/* FiredBunny brokerage relay: a read-only portfolio for signed-in visitors, through SnapTrade (https://snaptrade.com).
   Imported by worker/index.js (wrangler bundles the import itself; no build step of our own).

   POST /api/brokerage/status      is the server set up, is this person connected, and to which brokerages
   POST /api/brokerage/connect     a one-time Connection Portal link (read-only) for this person
   POST /api/brokerage/portfolio   accounts, balances, positions (stocks, funds, options), value history, activities
   POST /api/brokerage/disconnect  remove one connection at SnapTrade (the last one removes the SnapTrade user too)
   POST /api/brokerage/forget      delete this person's SnapTrade user (Settings > "Delete my account too" calls it first)

   Who is asking: every request carries the person's Supabase access token (Authorization: Bearer ...). It is verified
   here (ES256 against the project's JWKS, then iss, aud, exp, role) and its `sub` is the person. There is no Supabase
   secret or service_role key anywhere: the Worker reads and writes the person's own row in public.brokerage_links with
   their own token, so row-level security applies to the Worker exactly as it does to the browser.

   Secrets (Cloudflare dashboard > Worker > Settings > Variables and Secrets, type Secret):
     SNAPTRADE_CLIENT_ID      SnapTrade client id
     SNAPTRADE_CONSUMER_KEY   SnapTrade consumer key: signs every SnapTrade request (HMAC-SHA256); never leaves here
     BROKERAGE_KEY            random key (at least 32 characters) that encrypts each person's SnapTrade userSecret
   Optional plain variables (tests point them at local stand-ins; production uses the defaults below):
     SNAPTRADE_API, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY

   The SnapTrade userSecret: SnapTrade makes one per user at registration. It is encrypted here with AES-256-GCM under a
   key derived (HKDF-SHA256) from BROKERAGE_KEY and the SnapTrade user id, with the user id as associated data, and only
   that ciphertext is stored (brokerage_links.secret_box). The browser never sees the plain secret. A copied ciphertext
   is useless for anyone else: it only opens for the user id it was sealed for, and that id comes from the verified
   token. Lost or unreadable ciphertext: the old SnapTrade user is deleted and a new one registered.

   Holdings and transactions are fetched live and passed through; nothing about them is stored on the server. Errors
   from SnapTrade or Supabase are reduced to a short code: their bodies (which may echo request details) are never
   forwarded, and nothing here logs a URL (SnapTrade puts the userSecret in the query string). */

const DEF = {
  SNAPTRADE_API: 'https://api.snaptrade.com',
  SUPABASE_URL: 'https://cwvgvzsrmcvpiqsbelyb.supabase.co',
  // public by design: the same publishable key that ships in every page (src/cloud-config.js)
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_6jcvTuP-ezIzUr7-ds-ySA_SM8kAiJu',
};
// the site's own addresses; the address this Worker answers on is always allowed too
const SITE_ORIGINS = ['https://firedbunny.com', 'https://firedbunny.dosfirm.workers.dev'];
const MAX_BODY = 4096, MAX_TOKEN = 4096;
const UPSTREAM_TIMEOUT = 12000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// requests per person per window (in-memory, per Worker instance: a brake on runaway loops and abuse, not an exact quota)
const LIMITS = {
  status: [30, 300], portfolio: [4, 120], portfolioHour: [30, 3600], connect: [6, 600], disconnect: [10, 600], forget: [6, 600], authFail: [40, 300],
};
const enc = new TextEncoder(), dec = new TextDecoder();
const timeout = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

/* ---------------- configuration ---------------- */
function baseUrl(v, d) {
  const s = String(v || '').trim().replace(/\/+$/, '');
  if (!s) return d;
  if (/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(s) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(s)) return s;
  return null; // set but not a plain https origin: refuse rather than guess
}
export function config(env) {
  env = env || {};
  const keyLen = String(env.BROKERAGE_KEY || '').length;
  const c = {
    clientId: String(env.SNAPTRADE_CLIENT_ID || '').trim(),
    consumerKey: String(env.SNAPTRADE_CONSUMER_KEY || ''),
    boxKey: String(env.BROKERAGE_KEY || ''),
    api: baseUrl(env.SNAPTRADE_API, DEF.SNAPTRADE_API),
    sb: baseUrl(env.SUPABASE_URL, DEF.SUPABASE_URL),
    sbKey: String(env.SUPABASE_PUBLISHABLE_KEY || DEF.SUPABASE_PUBLISHABLE_KEY),
  };
  c.problems = [];
  if (!c.clientId) c.problems.push('SNAPTRADE_CLIENT_ID is not set');
  if (!c.consumerKey) c.problems.push('SNAPTRADE_CONSUMER_KEY is not set');
  if (!keyLen) c.problems.push('BROKERAGE_KEY is not set');
  else if (keyLen < 32) c.problems.push('BROKERAGE_KEY is too short (use at least 32 characters)');
  if (!c.api) c.problems.push('SNAPTRADE_API is not a plain https address');
  if (!c.sb) c.problems.push('SUPABASE_URL is not a plain https address');
  c.ready = c.problems.length === 0;
  return c;
}
/** For /api/health: whether each piece is set, never what it is. */
export function brokerageHealth(env) {
  const c = config(env);
  const s = (v) => (v ? 'set' : 'not set');
  const keyLen = String((env && env.BROKERAGE_KEY) || '').length;
  return {
    ready: c.ready,
    SNAPTRADE_CLIENT_ID: s(c.clientId),
    SNAPTRADE_CONSUMER_KEY: s(c.consumerKey),
    BROKERAGE_KEY: !keyLen ? 'not set' : keyLen < 32 ? 'set, but too short (use at least 32 characters)' : 'set',
    verdict: c.ready ? 'Brokerage connections are set up.' : 'Brokerage connections are off: ' + c.problems.join('; ') + '. The Portfolio page shows sample data until they are set.',
  };
}

/* ---------------- small helpers ---------------- */
export function b64u(bytes) {
  let s = ''; const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]*$/.test(s)) throw new Error('bad base64url');
  const t = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(t); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const b64 = (buf) => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); };
class Fail extends Error { constructor(status, code, message, extra) { super(code); this.status = status; this.code = code; this.msg = message; this.extra = extra; } }
const fail = (status, code, message, extra) => { throw new Fail(status, code, message, extra); };

/* ---------------- SnapTrade request signing ----------------
   https://docs.snaptrade.com/docs/request-signatures: HMAC-SHA256, keyed with the consumer key, over the canonical JSON
   (keys sorted at every level, no whitespace) of {content, path, query}; content is the JSON body, or null when there
   is none (or it is {}); query is the exact query string sent, clientId and timestamp included. Base64, in the
   Signature header. */
export function canonicalJSON(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
  return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonicalJSON(v[k])).join(',') + '}';
}
export function signingString(path, query, body) {
  const content = body == null || (typeof body === 'object' && !Array.isArray(body) && !Object.keys(body).length) ? null : body;
  return canonicalJSON({ content, path, query });
}
export async function signSnapTrade(consumerKey, path, query, body) {
  const key = await crypto.subtle.importKey('raw', enc.encode(consumerKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(await crypto.subtle.sign('HMAC', key, enc.encode(signingString(path, query, body))));
}
const qs = (params) => Object.keys(params).filter((k) => params[k] != null && params[k] !== '').map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(String(params[k]))).join('&');

/** One SnapTrade call. user = { userId, userSecret } for per-user endpoints. Returns { status, data, headers }. */
async function st(c, method, path, opts) {
  opts = opts || {};
  const params = Object.assign({ clientId: c.clientId, timestamp: Math.floor(Date.now() / 1000) },
    opts.user ? { userId: opts.user.userId, userSecret: opts.user.userSecret } : {}, opts.query || {});
  const query = qs(params);
  const body = opts.body || null;
  const signature = await signSnapTrade(c.consumerKey, path, query, body);
  let r;
  try {
    r = await fetch(c.api + path + '?' + query, {
      method, signal: timeout(opts.timeout || UPSTREAM_TIMEOUT),
      headers: Object.assign({ Signature: signature, Accept: 'application/json' }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) { return { status: 0, data: null }; } // offline, refused or timed out: the caller decides; no details kept
  let data = null;
  const type = r.headers.get('content-type') || '';
  if (/json/i.test(type)) data = await r.json().catch(() => null); else if (r.body) await r.body.cancel().catch(() => {});
  return { status: r.status, data, retryAfter: Number(r.headers.get('retry-after')) || null };
}
/** Turn a failed SnapTrade answer into one of our own errors (never its body). */
function stFail(res, what) {
  if (!res || res.status === 0) fail(502, 'snaptrade_unreachable', 'SnapTrade did not answer. Try again in a few minutes.');
  if (res.status === 429) fail(429, 'snaptrade_rate_limited', 'SnapTrade asked us to slow down. Try again in a minute.', { retryAfter: res.retryAfter || 60 });
  if (res.status >= 500) fail(502, 'snaptrade_unreachable', 'SnapTrade is having trouble right now. Try again in a few minutes.');
  if (res.status === 401 || res.status === 403) fail(502, 'snaptrade_refused', 'SnapTrade refused the request (' + what + ').');
  fail(502, 'snaptrade_error', 'SnapTrade could not complete the request (' + what + ').');
}

/* ---------------- Supabase access tokens (ES256, verified against the project's JWKS) ---------------- */
const jwks = { url: '', at: 0, keys: new Map(), lastForced: 0 };
async function loadJwks(c, force) {
  const url = c.sb + '/auth/v1/.well-known/jwks.json';
  const now = Date.now();
  if (!force && jwks.url === url && now - jwks.at < (jwks.keys.size ? 10 * 60 * 1000 : 60 * 1000)) return; // an empty set is kept a minute
  if (force && jwks.url === url && now - jwks.lastForced < 30 * 1000) return; // an unknown kid refetches at most every 30 s
  if (force) jwks.lastForced = now;
  let r;
  try { r = await fetch(url, { headers: { Accept: 'application/json' }, signal: timeout(8000), cf: { cacheTtl: 300 } }); }
  catch (e) { if (jwks.url === url && jwks.keys.size) return; fail(503, 'auth_unavailable', 'Could not check your sign-in right now. Try again in a moment.'); }
  if (!r.ok) { if (jwks.url === url && jwks.keys.size) return; fail(503, 'auth_unavailable', 'Could not check your sign-in right now. Try again in a moment.'); }
  const body = await r.json().catch(() => null);
  const keys = new Map();
  for (const k of (body && Array.isArray(body.keys) ? body.keys : [])) {
    if (!k || k.kty !== 'EC' || k.crv !== 'P-256' || typeof k.kid !== 'string' || !k.x || !k.y) continue;
    if (k.alg && k.alg !== 'ES256') continue;
    if (k.use && k.use !== 'sig') continue;
    try { keys.set(k.kid, await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: k.x, y: k.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])); } catch (e) { /* skip a key that does not import */ }
  }
  jwks.url = url; jwks.at = now; jwks.keys = keys;
}
const parseJSON = (bytes) => { try { return JSON.parse(dec.decode(bytes)); } catch (e) { return null; } };
/** The verified claims of a Supabase access token, or a 401. */
export async function verifyJwt(token, c, nowSec) {
  const bad = (why) => fail(401, 'unauthorized', 'Sign in again to use your portfolio.', { why });
  if (typeof token !== 'string' || token.length > MAX_TOKEN) bad('shape');
  const parts = token.split('.');
  if (parts.length !== 3) bad('shape');
  let head, claims, sig;
  try { head = parseJSON(unb64u(parts[0])); claims = parseJSON(unb64u(parts[1])); sig = unb64u(parts[2]); } catch (e) { bad('encoding'); }
  if (!head || !claims || typeof claims !== 'object') bad('encoding');
  if (head.alg !== 'ES256') bad('alg'); // no "none", no HS256: only the project's signing keys
  if (typeof head.kid !== 'string' || !head.kid || head.kid.length > 200) bad('kid');
  if (sig.length !== 64) bad('signature');
  await loadJwks(c, false);
  let key = jwks.keys.get(head.kid);
  if (!key) { await loadJwks(c, true); key = jwks.keys.get(head.kid); } // the project may have rotated its keys
  if (!key) bad('kid');
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig, enc.encode(parts[0] + '.' + parts[1])).catch(() => false);
  if (!ok) bad('signature');
  const now = nowSec || Math.floor(Date.now() / 1000);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== c.sb + '/auth/v1') bad('iss');
  if (aud.indexOf('authenticated') < 0) bad('aud');
  if (typeof claims.exp !== 'number' || claims.exp <= now) bad('exp');
  if (typeof claims.iat === 'number' && claims.iat > now + 60) bad('iat');
  if (typeof claims.nbf === 'number' && claims.nbf > now + 60) bad('nbf');
  if (claims.role !== 'authenticated') bad('role');
  if (claims.is_anonymous === true) bad('anonymous');
  if (typeof claims.sub !== 'string' || !UUID.test(claims.sub)) bad('sub');
  return claims;
}
/** Before registering a new SnapTrade user (which costs money), make sure the account still exists and its session is live. */
async function confirmUser(c, token, sub) {
  let r;
  try { r = await fetch(c.sb + '/auth/v1/user', { headers: { apikey: c.sbKey, Authorization: 'Bearer ' + token, Accept: 'application/json' }, signal: timeout(8000) }); }
  catch (e) { fail(503, 'auth_unavailable', 'Could not check your sign-in right now. Try again in a moment.'); }
  if (r.status === 401 || r.status === 403 || r.status === 404) fail(401, 'unauthorized', 'Sign in again to use your portfolio.', { why: 'session' });
  if (!r.ok) fail(503, 'auth_unavailable', 'Could not check your sign-in right now. Try again in a moment.');
  const u = await r.json().catch(() => null);
  if (!u || u.id !== sub) fail(401, 'unauthorized', 'Sign in again to use your portfolio.', { why: 'session' });
}

/* ---------------- the person's row in public.brokerage_links (their own token: row-level security applies) ---------------- */
async function rest(c, token, method, path, body, prefer) {
  let r;
  try {
    r = await fetch(c.sb + '/rest/v1/' + path, {
      method, signal: timeout(8000),
      headers: Object.assign({ apikey: c.sbKey, Authorization: 'Bearer ' + token, Accept: 'application/json' }, body ? { 'Content-Type': 'application/json' } : {}, prefer ? { Prefer: prefer } : {}),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) { fail(503, 'database_unavailable', 'FiredBunny’s database did not answer. Try again in a moment.'); }
  if (r.ok) { if (method === 'GET') return r.json().catch(() => []); if (r.body) await r.body.cancel().catch(() => {}); return null; }
  const e = await r.json().catch(() => null);
  if (r.status === 404 && e && (e.code === 'PGRST205' || e.code === '42P01')) fail(503, 'schema_missing', 'Brokerage connections are not set up in the database yet (the owner needs to run supabase/schema.sql).');
  if (r.status === 401) fail(401, 'unauthorized', 'Sign in again to use your portfolio.', { why: 'database' });
  fail(503, 'database_error', 'FiredBunny’s database could not save that. Try again in a moment.');
}
const ownId = (sub, id) => typeof id === 'string' && (id === 'fb-' + sub || (id.indexOf('fb-' + sub + '-') === 0 && id.length <= sub.length + 20));
async function getLink(c, token, sub) {
  const rows = await rest(c, token, 'GET', 'brokerage_links?select=snaptrade_user_id,secret_box&user_id=eq.' + sub + '&limit=1');
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || !ownId(sub, row.snaptrade_user_id) || typeof row.secret_box !== 'string') return null;
  return row;
}
const putLink = (c, token, sub, userId, box) => rest(c, token, 'POST', 'brokerage_links?on_conflict=user_id', { user_id: sub, snaptrade_user_id: userId, secret_box: box }, 'resolution=merge-duplicates,return=minimal');
const dropLink = (c, token, sub) => rest(c, token, 'DELETE', 'brokerage_links?user_id=eq.' + sub, null, 'return=minimal');

/* ---------------- sealing the SnapTrade userSecret ---------------- */
async function boxKey(c, userId) {
  const ikm = await crypto.subtle.importKey('raw', enc.encode(c.boxKey), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('firedbunny/brokerage/v1'), info: enc.encode('snaptrade-user-secret:' + userId) }, ikm, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function sealSecret(c, userId, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(userId) }, await boxKey(c, userId), enc.encode(secret));
  return 'v1.' + b64u(iv) + '.' + b64u(new Uint8Array(ct));
}
export async function openSecret(c, userId, box) {
  try {
    const p = String(box).split('.');
    if (p.length !== 3 || p[0] !== 'v1') return null;
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(p[1]), additionalData: enc.encode(userId) }, await boxKey(c, userId), unb64u(p[2]));
    return dec.decode(pt);
  } catch (e) { return null; }
}

/* ---------------- SnapTrade users ---------------- */
/** The person's SnapTrade user and secret, or null (never registered, or the stored secret can no longer be opened). */
async function currentUser(c, token, sub) {
  const row = await getLink(c, token, sub);
  if (!row) return { user: null, row: null };
  const secret = await openSecret(c, row.snaptrade_user_id, row.secret_box);
  return { user: secret ? { userId: row.snaptrade_user_id, userSecret: secret } : null, row };
}
async function deleteStUser(c, userId) {
  const r = await st(c, 'DELETE', '/snapTrade/deleteUser', { query: { userId } });
  if (r.status === 200 || r.status === 202 || r.status === 204) return 'deleted';
  if (r.status === 404) return 'none';
  return 'unreachable';
}
async function register(c, token, sub, stale) {
  if (stale && ownId(sub, stale.snaptrade_user_id)) await deleteStUser(c, stale.snaptrade_user_id).catch(() => {});
  const rand = () => b64u(crypto.getRandomValues(new Uint8Array(6))).replace(/[^A-Za-z0-9]/g, 'x').slice(0, 8);
  // fb-<sub> the first time; if that id is still taken (an older user waiting for SnapTrade's asynchronous delete), a suffix
  const ids = ['fb-' + sub, 'fb-' + sub + '-' + rand()];
  if (stale && stale.snaptrade_user_id === ids[0]) ids.shift();
  for (const userId of ids) {
    const r = await st(c, 'POST', '/snapTrade/registerUser', { body: { userId } });
    if (r.status === 200 && r.data && typeof r.data.userSecret === 'string' && r.data.userSecret) {
      try { await putLink(c, token, sub, userId, await sealSecret(c, userId, r.data.userSecret)); }
      catch (e) { await deleteStUser(c, userId).catch(() => {}); throw e; } // nowhere to keep the secret: do not leave the user behind
      return { userId, userSecret: r.data.userSecret };
    }
    if (r.status !== 400 && r.status !== 409) stFail(r, 'register');
  }
  fail(502, 'snaptrade_error', 'SnapTrade could not set up your connection. Try again later.');
}

/* ---------------- shaping SnapTrade's answers (only what the page uses) ---------------- */
const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(v); return isFinite(n) ? n : null; };
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n || 120) : v == null ? null : String(v).slice(0, n || 120));
function connOut(a) {
  const b = (a && a.brokerage) || {};
  return { id: str(a.id, 64), broker: str(b.display_name || b.name || 'Your brokerage', 60), slug: str(b.slug, 40), name: str(a.name, 60), type: str(a.type, 20), disabled: !!a.disabled, disabledAt: str(a.disabled_date, 40), createdAt: str(a.created_date, 40), degraded: !!b.is_degraded, maintenance: !!b.maintenance_mode };
}
function instrumentOut(i) {
  i = i || {};
  const o = { kind: str(i.kind, 20) || 'other', symbol: str(i.symbol, 40), description: str(i.description, 120) };
  if (i.kind === 'option' || i.kind === 'future_option') {
    const u = i.underlying || {};
    o.option = { type: str(i.option_type, 4), strike: num(i.strike_price), expiry: str(i.expiration_date, 10), multiplier: num(i.multiplier) || 100, underlying: str(u.symbol || u.raw_symbol, 20) };
  }
  if (i.kind === 'cash') o.symbol = str(i.code, 8);
  return o;
}
function positionOut(p) {
  const o = Object.assign(instrumentOut(p.instrument), { units: num(p.units), price: num(p.price), costBasis: num(p.cost_basis), currency: str(p.currency, 8), cashEquivalent: !!p.cash_equivalent });
  if (Array.isArray(p.tax_lots) && p.tax_lots.length) {
    o.lots = p.tax_lots.slice(0, 200).map((l) => ({ date: str(l.original_purchase_date, 30), qty: num(l.quantity), price: num(l.purchased_price), basis: num(l.cost_basis), value: num(l.current_value), side: str(l.position_type, 10) }));
  }
  return o;
}
function activityOut(a, accountId) {
  const sym = a.symbol || {}, opt = a.option_symbol || null, cur = a.currency || {};
  const o = { id: str(a.id, 64), accountId, date: str(a.trade_date || a.settlement_date, 30), type: str(a.type, 30), optionType: str(a.option_type, 20), symbol: str(sym.symbol || sym.raw_symbol, 40), units: num(a.units), price: num(a.price), amount: num(a.amount), fee: num(a.fee), currency: str(cur.code, 8), description: str(a.description, 140) };
  if (opt) o.option = { ticker: str(opt.ticker, 40), type: str(opt.option_type, 4), strike: num(opt.strike_price), expiry: str(opt.expiration_date, 10), underlying: str(opt.underlying_symbol && (opt.underlying_symbol.symbol || opt.underlying_symbol.raw_symbol), 20), mini: !!opt.is_mini_option };
  return o;
}
async function mapLimit(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}
async function portfolio(c, user) {
  const [auths, accts] = await Promise.all([st(c, 'GET', '/authorizations', { user }), st(c, 'GET', '/accounts/all', { user })]);
  if (auths.status !== 200) stFail(auths, 'connections');
  if (accts.status !== 200) stFail(accts, 'accounts');
  const connections = (Array.isArray(auths.data) ? auths.data : []).map(connOut);
  const list = ((accts.data && accts.data.results) || []).filter((a) => a && a.kind === 'investment' && a.status !== 'closed' && a.status !== 'archived' && !a.is_paper && typeof a.id === 'string' && UUID.test(a.id)).slice(0, 12);
  const warnings = [];
  const since = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const accounts = await mapLimit(list, 3, async (a) => {
    const id = a.id, path = '/accounts/' + id;
    const [bal, pos, hist, act] = await Promise.all([
      st(c, 'GET', path + '/balances', { user }), st(c, 'GET', path + '/positions/all', { user }),
      st(c, 'GET', path + '/balanceHistory', { user }), st(c, 'GET', path + '/activities', { user, query: { startDate: since, limit: 1000 } }),
    ]);
    if (bal.status === 429 || pos.status === 429) stFail(bal.status === 429 ? bal : pos, 'positions');
    const out = {
      id, connectionId: str(a.connection_id, 64), name: str(a.display_name, 80), number: str(a.masked_account_number, 20), rawType: str(a.raw_type, 60), cashOrMargin: str(a.cash_or_margin, 10), status: str(a.status, 20),
      value: num(a.net_value && a.net_value.amount), currency: str(a.net_value && a.net_value.currency, 8) || 'USD',
      synced: { positions: str(a.sync_status && a.sync_status.positions && (a.sync_status.positions.last_successful_sync || a.sync_status.positions), 40), balances: str(a.sync_status && a.sync_status.balances && (a.sync_status.balances.last_successful_sync || a.sync_status.balances), 40), transactions: str(a.sync_status && a.sync_status.transactions && (a.sync_status.transactions.last_successful_sync || a.sync_status.transactions), 40) },
      cash: null, buyingPower: null, positions: null, asOf: null, history: null,
    };
    if (bal.status === 200 && Array.isArray(bal.data)) {
      const usd = bal.data.filter((b) => !b.currency || !b.currency.code || b.currency.code === out.currency);
      out.cash = usd.reduce((s, b) => s + (num(b.cash) || 0), 0); out.buyingPower = usd.reduce((s, b) => s + (num(b.buying_power) || 0), 0);
    } else warnings.push({ account: id, part: 'balances', code: bal.status === 0 || bal.status >= 500 ? 'unreachable' : 'refused' });
    if (pos.status === 200 && pos.data) {
      out.positions = (Array.isArray(pos.data.results) ? pos.data.results : []).slice(0, 500).map(positionOut);
      out.asOf = str(pos.data.data_freshness && pos.data.data_freshness.as_of, 40);
    } else warnings.push({ account: id, part: 'positions', code: pos.status === 0 || pos.status >= 500 ? 'unreachable' : 'refused' });
    if (hist.status === 200 && hist.data && Array.isArray(hist.data.history)) out.history = hist.data.history.slice(-400).map((h) => [str(h.date, 10), num(h.total_value)]).filter((h) => h[0] && h[1] != null);
    out.activities = act.status === 200 && act.data && Array.isArray(act.data.data) ? act.data.data.slice(0, 1000).map((x) => activityOut(x, id)) : null;
    if (act.status !== 200) warnings.push({ account: id, part: 'activities', code: act.status === 0 || act.status >= 500 ? 'unreachable' : 'refused' });
    return out;
  });
  const activities = [];
  accounts.forEach((a) => { (a.activities || []).forEach((x) => activities.push(x)); delete a.activities; });
  activities.sort((x, y) => (String(y.date) > String(x.date) ? 1 : String(y.date) < String(x.date) ? -1 : 0));
  return { connections, accounts, activities: activities.slice(0, 2000), warnings };
}

/* ---------------- rate limits (per Worker instance) ---------------- */
const hits = new Map();
function limited(key, kind) {
  const [n, sec] = LIMITS[kind]; const now = Date.now(), k = kind + ':' + key;
  if (hits.size > 20000) hits.clear();
  const list = (hits.get(k) || []).filter((t) => now - t < sec * 1000);
  if (list.length >= n) { hits.set(k, list); return Math.ceil((sec * 1000 - (now - list[0])) / 1000); }
  list.push(now); hits.set(k, list); return 0;
}

/* ---------------- the HTTP side ---------------- */
function allowedOrigin(request, url) {
  const o = request.headers.get('origin');
  if (!o) return { ok: true, origin: null }; // not a browser (a test, a script): the token is still required
  return { ok: o === url.origin || SITE_ORIGINS.indexOf(o) >= 0, origin: o };
}
function reply(obj, status, origin, extra) {
  const h = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
  if (origin) { h['Access-Control-Allow-Origin'] = origin; }
  return new Response(JSON.stringify(obj), { status, headers: Object.assign(h, extra || {}) });
}
async function readBody(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > MAX_BODY) fail(413, 'too_large', 'That request is too large.');
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const text = await request.text();
  if (text.length > MAX_BODY) fail(413, 'too_large', 'That request is too large.');
  if (!text) return {};
  if (type !== 'application/json') fail(415, 'bad_request', 'Send JSON.');
  let b; try { b = JSON.parse(text); } catch (e) { fail(400, 'bad_request', 'That request is not valid JSON.'); }
  if (!b || typeof b !== 'object' || Array.isArray(b)) fail(400, 'bad_request', 'That request is not valid.');
  return b;
}
const ACTIONS = new Set(['status', 'connect', 'portfolio', 'disconnect', 'forget']);

/** Handles every /api/brokerage/... request. */
export async function brokerage(request, env, url) {
  const o = allowedOrigin(request, url);
  const action = url.pathname.replace(/^\/api\/brokerage\/?/, '').replace(/\/+$/, '');
  if (!o.ok) return reply({ error: 'forbidden_origin', message: 'Not allowed from this site.' }, 403, null);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: Object.assign({ 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, content-type', 'Access-Control-Max-Age': '600', 'Cache-Control': 'no-store', Vary: 'Origin' }, o.origin ? { 'Access-Control-Allow-Origin': o.origin } : {}) });
  }
  if (!ACTIONS.has(action)) return reply({ error: 'not_found' }, 404, o.origin);
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed', message: 'Use POST.' }, 405, o.origin, { Allow: 'POST' });
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  try {
    const body = await readBody(request);
    const c = config(env);
    if (!c.sb) fail(503, 'not_configured', 'Brokerage connections are not set up on this server yet.', { configured: false });
    const auth = request.headers.get('authorization') || '';
    const m = /^Bearer ([A-Za-z0-9._~+/=-]+)$/.exec(auth.trim());
    if (!m) { const w = limited(ip, 'authFail'); if (w) fail(429, 'rate_limited', 'Too many tries. Wait a few minutes.', { retryAfter: w }); fail(401, 'unauthorized', 'Sign in to use your portfolio.', { why: 'missing' }); }
    const token = m[1];
    let claims;
    try { claims = await verifyJwt(token, c); }
    catch (e) { if (e instanceof Fail && e.status === 401) { const w = limited(ip, 'authFail'); if (w) fail(429, 'rate_limited', 'Too many tries. Wait a few minutes.', { retryAfter: w }); } throw e; }
    const sub = claims.sub;
    const kind = action === 'portfolio' ? 'portfolio' : action;
    let wait = limited(sub, kind) || (action === 'portfolio' ? limited(sub, 'portfolioHour') : 0);
    if (wait) fail(429, 'rate_limited', 'You’ve refreshed a lot in a short time. Try again in a minute or two.', { retryAfter: wait });
    if (!c.ready) return reply({ ok: true, configured: false }, 200, o.origin);

    if (action === 'status') {
      const { user, row } = await currentUser(c, token, sub);
      if (!row) return reply({ ok: true, configured: true, connected: false, connections: [] }, 200, o.origin);
      if (!user) return reply({ ok: true, configured: true, connected: false, connections: [], relink: true }, 200, o.origin);
      const r = await st(c, 'GET', '/authorizations', { user });
      if (r.status === 401 || r.status === 403 || r.status === 404) return reply({ ok: true, configured: true, connected: false, connections: [], relink: true }, 200, o.origin);
      if (r.status !== 200) stFail(r, 'connections');
      const connections = (Array.isArray(r.data) ? r.data : []).map(connOut);
      return reply({ ok: true, configured: true, connected: connections.length > 0, connections }, 200, o.origin);
    }

    if (action === 'connect') {
      const reconnect = body.reconnect == null ? null : String(body.reconnect);
      if (reconnect && !UUID.test(reconnect)) fail(400, 'bad_request', 'That connection id is not valid.');
      const broker = body.broker == null ? null : String(body.broker);
      if (broker && !/^[A-Z0-9_]{2,40}$/.test(broker)) fail(400, 'bad_request', 'That brokerage name is not valid.');
      await confirmUser(c, token, sub);
      let { user, row } = await currentUser(c, token, sub);
      if (user && !reconnect) { // a secret SnapTrade no longer accepts counts as lost
        const chk = await st(c, 'GET', '/authorizations', { user });
        if (chk.status === 401 || chk.status === 403 || chk.status === 404) user = null; else if (chk.status !== 200) stFail(chk, 'connections');
      }
      if (!user) { if (reconnect) fail(409, 'relink', 'Connect again from the start.'); user = await register(c, token, sub, row); }
      const req = { connectionType: 'read', customRedirect: url.origin + '/portfolio/?connect=done', immediateRedirect: true, darkMode: true, showCloseButton: true, connectionPortalVersion: 'v4' };
      if (broker) req.broker = broker;
      if (reconnect) req.reconnect = reconnect;
      const r = await st(c, 'POST', '/snapTrade/login', { user, body: req });
      if (r.status !== 200) stFail(r, 'connection portal');
      let link = null;
      try { const u = new URL(r.data && r.data.redirectURI); if (u.protocol === 'https:' && (u.hostname === 'snaptrade.com' || /\.snaptrade\.com$/.test(u.hostname))) link = u.toString(); } catch (e) { link = null; }
      if (!link) fail(502, 'snaptrade_error', 'SnapTrade sent an unexpected answer. Try again later.');
      return reply({ ok: true, url: link }, 200, o.origin);
    }

    if (action === 'portfolio') {
      const { user, row } = await currentUser(c, token, sub);
      if (!user) return reply({ ok: true, configured: true, connected: false, relink: !!row }, 200, o.origin);
      const data = await portfolio(c, user);
      return reply(Object.assign({ ok: true, configured: true, connected: data.connections.length > 0, asOf: new Date().toISOString() }, data), 200, o.origin);
    }

    if (action === 'disconnect') {
      const all = body.all === true;
      const id = body.connectionId == null ? null : String(body.connectionId);
      if (!all && (!id || !UUID.test(id))) fail(400, 'bad_request', 'Say which connection to remove.');
      const { user, row } = await currentUser(c, token, sub);
      if (!row) return reply({ ok: true, removed: 'none' }, 200, o.origin);
      if (!user || all) { // nothing readable to work with, or everything: remove the SnapTrade user itself
        const r = await deleteStUser(c, row.snaptrade_user_id);
        if (r === 'unreachable') fail(502, 'snaptrade_unreachable', 'SnapTrade did not answer, so nothing was removed. Try again in a few minutes.');
        await dropLink(c, token, sub);
        return reply({ ok: true, removed: 'user' }, 200, o.origin);
      }
      const list = await st(c, 'GET', '/authorizations', { user });
      if (list.status !== 200) stFail(list, 'connections');
      const conns = Array.isArray(list.data) ? list.data : [];
      if (!conns.some((x) => x && x.id === id)) fail(404, 'unknown_connection', 'That connection is not one of yours.');
      if (conns.length === 1) {
        const r = await deleteStUser(c, user.userId);
        if (r === 'unreachable') fail(502, 'snaptrade_unreachable', 'SnapTrade did not answer, so nothing was removed. Try again in a few minutes.');
        await dropLink(c, token, sub);
        return reply({ ok: true, removed: 'user' }, 200, o.origin);
      }
      const r = await st(c, 'DELETE', '/connection/' + id, { user });
      if (r.status !== 200 && r.status !== 202 && r.status !== 204 && r.status !== 404) stFail(r, 'disconnect');
      return reply({ ok: true, removed: 'connection' }, 200, o.origin);
    }

    if (action === 'forget') {
      let row = null;
      try { row = await getLink(c, token, sub); } catch (e) { row = null; } // the table may not exist yet: still delete at SnapTrade
      const ids = ['fb-' + sub]; if (row && ownId(sub, row.snaptrade_user_id) && ids.indexOf(row.snaptrade_user_id) < 0) ids.push(row.snaptrade_user_id);
      const results = [];
      for (const id of ids) results.push(await deleteStUser(c, id).catch(() => 'unreachable'));
      // SnapTrade down: keep the row, so a second try still knows which SnapTrade user to delete (deleting the account
      // removes the row anyway). Without a row there is no record of a connection, so the person is not alarmed.
      if (results.indexOf('unreachable') >= 0) {
        if (!row) return reply({ ok: true, snaptrade: 'unchecked' }, 200, o.origin);
        fail(502, 'snaptrade_unreachable', 'SnapTrade did not answer, so your brokerage connection could not be removed there.');
      }
      if (row) await dropLink(c, token, sub).catch(() => {});
      return reply({ ok: true, snaptrade: results.indexOf('deleted') >= 0 ? 'deleted' : 'none' }, 200, o.origin);
    }
    return reply({ error: 'not_found' }, 404, o.origin);
  } catch (e) {
    if (e instanceof Fail) {
      const out = { error: e.code, message: e.msg };
      if (e.extra && e.extra.retryAfter) out.retryAfter = e.extra.retryAfter;
      if (e.extra && e.extra.configured === false) out.configured = false;
      return reply(out, e.status, o.origin, out.retryAfter ? { 'Retry-After': String(out.retryAfter) } : null);
    }
    console.error('brokerage: unexpected error in', action, e && e.name); // the name only: messages can carry request details
    return reply({ error: 'server_error', message: 'Something went wrong. Try again in a moment.' }, 500, o.origin);
  }
}
