/* FiredBunny Worker: serves the static site (dist/, via the ASSETS binding) and a tiny read-only API for the
   Earnings lookup. The API only relays public data, so the heavy lifting (parsing SEC filings) happens in the
   visitor's browser and the Worker stays within the free plan's CPU limits.

   GET /api/health                 self-test: is each upstream answering? (open it in a browser when lookups fail)
   GET /api/sec/tickers            SEC ticker → CIK list            (www.sec.gov/files/company_tickers.json)
   GET /api/sec/facts/<cik>        XBRL company facts (all filings)  (data.sec.gov/api/xbrl/companyfacts)
   GET /api/sec/submissions/<cik>  filing index (10-Q, 10-K, 8-K)    (data.sec.gov/submissions)
   GET /api/price/<ticker>         ~5 years of daily closes as JSON  (Yahoo Finance chart API, Stooq fallback)

   SEC asks automated tools to identify themselves with a contact email in the User-Agent and turns other requests
   away (403). Set the SEC_UA variable to "FiredBunny <contact email>" in Cloudflare (Worker > Settings > Variables
   and Secrets). /api/health says whether it is set, never what it is. */

const DEFAULT_UA = 'FiredBunny earnings lookup https://github.com/wissile/firedbunny';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const TTL = { tickers: 86400, facts: 21600, submissions: 21600, price: 3600 };
const TIMEOUT = 20000;
// Cache successes at Cloudflare's edge, never errors: a refusal from the SEC must not stick for hours.
const edge = (ttl) => ({ cacheEverything: true, cacheTtlByStatus: { '200-299': ttl, '300-599': 0 } });
const timeout = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try { return await api(url, request, env, ctx); }
      catch (e) { return json({ error: 'server_error', message: 'Something went wrong in the data relay. Try again in a moment.', detail: String((e && e.message) || e).slice(0, 200) }, 502); }
    }
    return env.ASSETS.fetch(request);
  },
};

async function api(url, request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method_not_allowed' }, 405);
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const ua = (env && env.SEC_UA) || DEFAULT_UA;
  if (parts.length === 1 || (parts[1] === 'health' && parts.length === 2)) return health(env, ua);
  if (parts[1] === 'sec' && parts[2] === 'tickers' && parts.length === 3) {
    return relay('https://www.sec.gov/files/company_tickers.json', secHeaders(ua), TTL.tickers, ctx, env);
  }
  if (parts[1] === 'sec' && (parts[2] === 'facts' || parts[2] === 'submissions') && parts.length === 4) {
    if (!/^\d{1,10}$/.test(parts[3])) return json({ error: 'bad_cik' }, 400);
    const cik = parts[3].padStart(10, '0');
    const target = parts[2] === 'facts'
      ? `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`
      : `https://data.sec.gov/submissions/CIK${cik}.json`;
    return relay(target, secHeaders(ua), TTL[parts[2]], ctx, env);
  }
  if (parts[1] === 'price' && parts.length === 3) {
    const t = decodeURIComponent(parts[2]).toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(t)) return json({ error: 'bad_ticker' }, 400);
    return price(t, ctx);
  }
  return json({ error: 'not_found' }, 404);
}

const secHeaders = (ua) => ({ 'User-Agent': ua, Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate' });

/* Why an SEC request failed, in words for the page, plus a hint for the site owner. */
function secFailure(status, env) {
  const hint = status === 403
    ? (env && env.SEC_UA
      ? 'The SEC refused the request even with SEC_UA set. Check that SEC_UA has the form "FiredBunny you@example.com", then open /api/health.'
      : 'The SEC refuses automated requests without a contact email. Set SEC_UA (e.g. "FiredBunny you@example.com") in Cloudflare: Worker > Settings > Variables and Secrets.')
    : status === 429 ? 'The SEC is rate-limiting this relay (more than 10 requests a second). It clears within minutes.'
    : status === 0 ? 'The SEC did not answer in time.'
    : 'The SEC answered with an error.';
  const message = status === 403 ? 'The SEC turned the request away (error 403).'
    : status === 429 ? 'The SEC asked us to slow down (error 429).'
    : status === 0 ? 'The SEC did not answer in time.'
    : `The SEC answered with an error (${status}).`;
  return { error: 'upstream', source: 'sec', status, message, hint };
}

/* Fetch an upstream JSON document and stream it back (no parsing), cached at the edge where the Cache API works. */
async function relay(target, headers, ttl, ctx, env) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(target);
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }
  let up;
  try { up = await fetch(target, { headers, cf: edge(ttl), signal: timeout(TIMEOUT) }); }
  catch (e) { return json(secFailure(0, env), 504); }
  if (up.status === 404) return json({ error: 'not_found' }, 404);
  if (!up.ok) return json(secFailure(up.status, env), 502);
  const ct = up.headers.get('content-type') || '';
  if (!/json/i.test(ct)) return json(Object.assign(secFailure(up.status, env), { message: 'The SEC sent a web page instead of data.', hint: 'Usually a block page: see /api/health.' }), 502);
  const res = new Response(up.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ttl}` } });
  if (cache && ctx) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

/* ~5 years of daily closes: [['YYYY-MM-DD', close], ...]. Yahoo first, then Stooq. */
async function price(ticker, ctx) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request('https://firedbunny.internal/price/' + ticker);
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }
  const tried = [];
  let out = await yahoo(ticker, tried).catch((e) => { tried.push({ source: 'Yahoo Finance', error: String((e && e.name) || e) }); return null; });
  if (!out || out.points.length < 20) out = await stooq(ticker, tried).catch((e) => { tried.push({ source: 'Stooq', error: String((e && e.name) || e) }); return null; });
  if (!out || out.points.length < 20) return json({ error: 'no_price', message: 'No price history was available.', tried }, 404);
  const res = json(out, 200, TTL.price);
  if (cache && ctx) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

async function yahoo(ticker, tried, range = '5y') {
  const sym = ticker.replace('.', '-');
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=1d&includePrePost=false&events=div%2Csplit`, { headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' }, cf: edge(TTL.price), signal: timeout(TIMEOUT) });
  if (!r.ok) { tried && tried.push({ source: 'Yahoo Finance', status: r.status }); return null; }
  const d = await r.json().catch(() => null);
  const res = d && d.chart && d.chart.result && d.chart.result[0];
  if (!res || !res.timestamp) { tried && tried.push({ source: 'Yahoo Finance', status: r.status, error: 'no data' }); return null; }
  const q = res.indicators && res.indicators.quote && res.indicators.quote[0];
  const adj = res.indicators && res.indicators.adjclose && res.indicators.adjclose[0] && res.indicators.adjclose[0].adjclose;
  const closes = (q && q.close) || adj;
  const off = (res.meta && res.meta.gmtoffset) || 0;
  const points = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const c = closes[i]; if (c == null || !isFinite(c)) continue;
    points.push([new Date((res.timestamp[i] + off) * 1000).toISOString().slice(0, 10), Math.round(c * 100) / 100]);
  }
  return { source: 'Yahoo Finance', currency: (res.meta && res.meta.currency) || 'USD', points };
}

async function stooq(ticker, tried, years = 5.2) {
  const sym = ticker.toLowerCase().replace('.', '-') + '.us';
  const from = new Date(Date.now() - years * 365 * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const r = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&d1=${from}&i=d`, { headers: { 'User-Agent': BROWSER_UA }, cf: edge(TTL.price), signal: timeout(TIMEOUT) });
  if (!r.ok) { tried && tried.push({ source: 'Stooq', status: r.status }); return null; }
  const text = await r.text();
  const lines = text.trim().split('\n'); const points = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(','); const c = parseFloat(f[4]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(f[0]) && isFinite(c)) points.push([f[0], Math.round(c * 100) / 100]);
  }
  if (!points.length) tried && tried.push({ source: 'Stooq', status: r.status, error: 'no data', sample: text.slice(0, 80) });
  return { source: 'Stooq', currency: 'USD', points };
}

/* Self-test: one small request to each upstream, with status, timing and a plain verdict. Not cached. */
async function health(env, ua) {
  const probe = async (name, url, headers) => {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { headers, cf: { cacheTtl: 0 }, signal: timeout(15000) });
      const type = (r.headers.get('content-type') || '').split(';')[0];
      let note = '';
      if (!r.ok || !/json/i.test(type)) {
        const txt = (await r.text().catch(() => '')).slice(0, 4000);
        note = /Undeclared Automated Tool/i.test(txt) ? 'SEC block page: "Undeclared Automated Tool" (needs a contact email in the User-Agent)'
          : /Request Rate Threshold/i.test(txt) ? 'SEC block page: request rate threshold exceeded'
          : txt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
      } else if (r.body) { await r.body.cancel(); }
      return { name, ok: r.ok && /json/i.test(type), status: r.status, type, ms: Date.now() - t0, note };
    } catch (e) { return { name, ok: false, status: 0, ms: Date.now() - t0, note: String((e && e.name) || e) }; }
  };
  const pricePr = async (name, fn) => {
    const t0 = Date.now(); const tried = [];
    try {
      const out = await fn(tried);
      const n = out ? out.points.length : 0;
      return { name, ok: n >= 20, points: n, last: n ? out.points[n - 1] : null, ms: Date.now() - t0, note: tried.map((x) => [x.status, x.error, x.sample].filter(Boolean).join(' ')).join('; ') };
    } catch (e) { return { name, ok: false, ms: Date.now() - t0, note: String((e && e.name) || e) }; }
  };
  const [tickers, facts, subs, yh, st] = await Promise.all([
    probe('SEC ticker list', 'https://www.sec.gov/files/company_tickers.json', secHeaders(ua)),
    probe('SEC company facts (Apple)', 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json', secHeaders(ua)),
    probe('SEC filing index (Apple)', 'https://data.sec.gov/submissions/CIK0000320193.json', secHeaders(ua)),
    pricePr('Prices: Yahoo Finance (AAPL)', (t) => yahoo('AAPL', t, '1mo')),
    pricePr('Prices: Stooq (AAPL)', (t) => stooq('AAPL', t, 0.1)),
  ]);
  const sec = [tickers, facts, subs];
  const secOk = sec.every((c) => c.ok), priceOk = yh.ok || st.ok;
  const verdict = secOk && priceOk ? 'All sources answer: live lookups should work.'
    : !secOk && sec.some((c) => c.status === 403) ? (env && env.SEC_UA ? 'The SEC refuses this relay even with SEC_UA set: check its form ("FiredBunny you@example.com").' : 'The SEC refuses this relay: set SEC_UA to "FiredBunny <your contact email>" in Cloudflare (Worker > Settings > Variables and Secrets), then reload this page.')
    : !secOk ? 'The SEC is not answering normally; lookups will fail until it does.'
    : 'SEC data works, but no price source answers: lookups work without price charts and valuation.';
  return json({
    ok: secOk, verdict, time: new Date().toISOString(),
    secUserAgent: env && env.SEC_UA ? 'SEC_UA is set' : 'SEC_UA is not set (using a default without a contact email)',
    checks: [tickers, facts, subs, yh, st],
  }, secOk ? 200 : 503);
}

function json(obj, status = 200, maxAge = 0) {
  return new Response(JSON.stringify(obj, null, status === 200 && maxAge ? 0 : 1), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store' } });
}
