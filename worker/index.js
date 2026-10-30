/* FiredBunny Worker: serves the static site (dist/, via the ASSETS binding) and a tiny read-only API for the
   Earnings lookup. The API only relays public data, so the heavy lifting (parsing SEC filings) happens in the
   visitor's browser and the Worker stays within the free plan's CPU limits.

   GET /api/sec/tickers            SEC ticker → CIK list            (www.sec.gov/files/company_tickers.json)
   GET /api/sec/facts/<cik>        XBRL company facts (all filings)  (data.sec.gov/api/xbrl/companyfacts)
   GET /api/sec/submissions/<cik>  filing index (10-Q, 10-K, 8-K)    (data.sec.gov/submissions)
   GET /api/price/<ticker>         ~5 years of daily closes as JSON  (Yahoo Finance chart API, Stooq fallback)

   SEC asks automated tools to identify themselves: set the SEC_UA variable to "FiredBunny <contact email>". */

const DEFAULT_UA = 'FiredBunny earnings lookup https://github.com/wissile/firedbunny';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const TTL = { tickers: 86400, facts: 21600, submissions: 21600, price: 3600 };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(url, request, env, ctx); }
      catch (e) { return json({ error: 'server_error', message: 'Something went wrong. Try again in a moment.' }, 502); }
    }
    return env.ASSETS.fetch(request);
  },
};

async function api(url, request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method_not_allowed' }, 405);
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  const ua = (env && env.SEC_UA) || DEFAULT_UA;
  if (parts[1] === 'sec' && parts[2] === 'tickers' && parts.length === 3) {
    return relay('https://www.sec.gov/files/company_tickers.json', { 'User-Agent': ua, Accept: 'application/json' }, TTL.tickers, ctx);
  }
  if (parts[1] === 'sec' && (parts[2] === 'facts' || parts[2] === 'submissions') && parts.length === 4) {
    if (!/^\d{1,10}$/.test(parts[3])) return json({ error: 'bad_cik' }, 400);
    const cik = parts[3].padStart(10, '0');
    const target = parts[2] === 'facts'
      ? `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`
      : `https://data.sec.gov/submissions/CIK${cik}.json`;
    return relay(target, { 'User-Agent': ua, Accept: 'application/json' }, TTL[parts[2]], ctx);
  }
  if (parts[1] === 'price' && parts.length === 3) {
    const t = decodeURIComponent(parts[2]).toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(t)) return json({ error: 'bad_ticker' }, 400);
    return price(t, ctx);
  }
  return json({ error: 'not_found' }, 404);
}

/* Fetch an upstream JSON document and stream it back (no parsing), cached at the edge where the Cache API works. */
async function relay(target, headers, ttl, ctx) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request(target);
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }
  const up = await fetch(target, { headers, cf: { cacheTtl: ttl, cacheEverything: true } });
  if (up.status === 404) return json({ error: 'not_found' }, 404);
  if (!up.ok) return json({ error: 'upstream', status: up.status }, 502);
  const res = new Response(up.body, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ttl}` } });
  if (cache && ctx) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

/* ~5 years of daily closes: [['YYYY-MM-DD', close], ...]. Yahoo first, then Stooq. */
async function price(ticker, ctx) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const key = new Request('https://firedbunny.internal/price/' + ticker);
  if (cache) { const hit = await cache.match(key); if (hit) return hit; }
  let out = null;
  try { out = await yahoo(ticker); } catch (e) { out = null; }
  if (!out || out.points.length < 20) { try { out = await stooq(ticker); } catch (e) { out = null; } }
  if (!out || out.points.length < 20) return json({ error: 'no_price' }, 404);
  const res = json(out, 200, TTL.price);
  if (cache && ctx) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

async function yahoo(ticker) {
  const sym = ticker.replace('.', '-');
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=5y&interval=1d&includePrePost=false&events=div%2Csplit`, { headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' }, cf: { cacheTtl: TTL.price } });
  if (!r.ok) return null;
  const d = await r.json();
  const res = d && d.chart && d.chart.result && d.chart.result[0];
  if (!res || !res.timestamp) return null;
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

async function stooq(ticker) {
  const sym = ticker.toLowerCase().replace('.', '-') + '.us';
  const from = new Date(Date.now() - 5.2 * 365 * 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const r = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&d1=${from}&i=d`, { headers: { 'User-Agent': BROWSER_UA }, cf: { cacheTtl: TTL.price } });
  if (!r.ok) return null;
  const text = await r.text();
  const lines = text.trim().split('\n'); const points = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(','); const c = parseFloat(f[4]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(f[0]) && isFinite(c)) points.push([f[0], Math.round(c * 100) / 100]);
  }
  return { source: 'Stooq', currency: 'USD', points };
}

function json(obj, status = 200, maxAge = 0) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store' } });
}
