// Unit checks for worker/brokerage.js that need no server: SnapTrade request signing (against the example in
// https://docs.snaptrade.com/docs/request-signatures), sealing the userSecret, and access-token verification with a
// locally generated ES256 key. Run: node tools/portfolio/unit.mjs   (prints PASS/FAIL lines; exit 1 on a failure)
// Prints "SIG <hex>" lines that tools/portfoliotest.py recomputes in Python, so both languages agree on the bytes.
import { createHmac, generateKeyPairSync, createSign } from 'node:crypto';
import { canonicalJSON, signingString, signSnapTrade, sealSecret, openSecret, verifyJwt, config, b64u, brokerageHealth } from '../../worker/brokerage.js';

let ok = true, n = 0;
const check = (c, msg) => { n++; ok = ok && !!c; console.log((c ? 'PASS ' : 'FAIL ') + msg); };
const enc = new TextEncoder();

// ---- signing ----
const doc = '{"content":{"substring":"AAPL"},"path":"/symbols","query":"clientId=YOUR_CLIENT_ID&timestamp=1715123456"}';
check(signingString('/symbols', 'clientId=YOUR_CLIENT_ID&timestamp=1715123456', { substring: 'AAPL' }) === doc, 'signing string matches the documented example byte for byte');
check(signingString('/accounts', 'clientId=X&timestamp=1', null) === '{"content":null,"path":"/accounts","query":"clientId=X&timestamp=1"}', 'no body: content is null');
check(signingString('/x', 'q=1', {}) === '{"content":null,"path":"/x","query":"q=1"}', 'an empty {} body counts as no body');
check(canonicalJSON({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: 'é/"' } }) === '{"a":{"c":"é/\\"","d":[3,{"y":2,"z":1}]},"b":1}', 'keys sorted at every level, arrays kept in order, no whitespace');
const key = 'fake-consumer-key-0123456789';
const body = { connectionType: 'read', customRedirect: 'http://127.0.0.1:8790/portfolio/?connect=done', immediateRedirect: true };
const q = 'clientId=FAKE-CLIENT&timestamp=1763200000&userId=fb-00000000-0000-4000-8000-000000000001&userSecret=s3cr3t';
const sig = await signSnapTrade(key, '/snapTrade/login', q, body);
const ref = createHmac('sha256', key).update(signingString('/snapTrade/login', q, body)).digest('base64');
check(sig === ref, 'HMAC-SHA256 (WebCrypto) equals Node’s createHmac over the same signing string');
check(/^[A-Za-z0-9+/]+=*$/.test(sig) && sig.length === 44, 'signature is standard base64 of 32 bytes');
console.log('SIG ' + JSON.stringify({ key, path: '/snapTrade/login', query: q, body, sig }));
console.log('SIG ' + JSON.stringify({ key, path: '/symbols', query: 'clientId=YOUR_CLIENT_ID&timestamp=1715123456', body: { substring: 'AAPL' }, sig: await signSnapTrade(key, '/symbols', 'clientId=YOUR_CLIENT_ID&timestamp=1715123456', { substring: 'AAPL' }) }));

// ---- configuration ----
const base = { SNAPTRADE_CLIENT_ID: 'FAKE-CLIENT', SNAPTRADE_CONSUMER_KEY: key, BROKERAGE_KEY: 'x'.repeat(40) };
check(config(base).ready, 'all three secrets set: ready');
check(!config({ SNAPTRADE_CLIENT_ID: 'a', SNAPTRADE_CONSUMER_KEY: 'b' }).ready, 'no BROKERAGE_KEY: not ready');
check(!config(Object.assign({}, base, { BROKERAGE_KEY: 'short' })).ready, 'a short BROKERAGE_KEY: not ready');
check(!config(Object.assign({}, base, { SNAPTRADE_API: 'http://evil.example' })).ready, 'a plain-http SnapTrade address (other than localhost) is refused');
check(config(Object.assign({}, base, { SUPABASE_URL: 'http://127.0.0.1:9000' })).sb === 'http://127.0.0.1:9000', 'localhost stand-ins are allowed for tests');
check(config({}).api === 'https://api.snaptrade.com' && config({}).sb === 'https://cwvgvzsrmcvpiqsbelyb.supabase.co', 'defaults are the real services (root API path, no /api/v1)');
const h = JSON.stringify(brokerageHealth(base));
check(!h.includes(key) && !h.includes('FAKE-CLIENT') && !h.includes('x'.repeat(40)) && h.includes('"SNAPTRADE_CONSUMER_KEY":"set"'), 'health says set / not set, never the values');

// ---- sealing the userSecret ----
const c = config(base);
const uid = 'fb-00000000-0000-4000-8000-000000000001', other = 'fb-00000000-0000-4000-8000-000000000002';
const secret = 'adf2aa34-8219-40f7-a6b3-60156985cc61';
const box = await sealSecret(c, uid, secret);
check(/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/.test(box) && !box.includes(secret), 'sealed box is v1.<iv>.<ciphertext>, without the secret in it');
check(await openSecret(c, uid, box) === secret, 'opens again for the same user');
check(await openSecret(c, other, box) === null, 'does not open for another user id (the id is bound in)');
check(await openSecret(config(Object.assign({}, base, { BROKERAGE_KEY: 'y'.repeat(40) })), uid, box) === null, 'does not open with another BROKERAGE_KEY');
const t = box.split('.'); const ct = t[2]; const flipped = t[0] + '.' + t[1] + '.' + (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1);
check(await openSecret(c, uid, flipped) === null, 'a tampered box does not open');
check(await sealSecret(c, uid, secret) !== box, 'a fresh IV every time');

// ---- access tokens ----
const SB = 'http://127.0.0.1:59999';
const cc = config(Object.assign({}, base, { SUPABASE_URL: SB }));
const mk = () => generateKeyPairSync('ec', { namedCurve: 'P-256' });
const k1 = mk(), k2 = mk(), k3 = mk();
const jwk = (k, kid) => Object.assign(k.publicKey.export({ format: 'jwk' }), { kid, alg: 'ES256', use: 'sig' });
let served = [jwk(k1, 'kid-1')], fetches = 0;
globalThis.fetch = async (url) => { fetches++; if (String(url) !== SB + '/auth/v1/.well-known/jwks.json') throw new Error('unexpected fetch ' + url); return new Response(JSON.stringify({ keys: served }), { status: 200, headers: { 'content-type': 'application/json' } }); };
const now = Math.floor(Date.now() / 1000);
const sub = '00000000-0000-4000-8000-000000000001';
const claims = (o) => Object.assign({ iss: SB + '/auth/v1', aud: 'authenticated', role: 'authenticated', sub, exp: now + 600, iat: now - 5, is_anonymous: false }, o || {});
function es256(k, kid, payload, head) {
  const h = b64u(enc.encode(JSON.stringify(Object.assign({ alg: 'ES256', typ: 'JWT', kid }, head || {}))));
  const p = b64u(enc.encode(JSON.stringify(payload)));
  const s = createSign('SHA256'); s.update(h + '.' + p);
  return h + '.' + p + '.' + b64u(s.sign({ key: k.privateKey, dsaEncoding: 'ieee-p1363' }));
}
const hs256 = (payload) => { const h = b64u(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 'kid-1' }))); const p = b64u(enc.encode(JSON.stringify(payload))); return h + '.' + p + '.' + b64u(createHmac('sha256', 'guess').update(h + '.' + p).digest()); };
const none = (payload) => b64u(enc.encode(JSON.stringify({ alg: 'none', typ: 'JWT', kid: 'kid-1' }))) + '.' + b64u(enc.encode(JSON.stringify(payload))) + '.';
async function rejects(tok, msg, why) {
  try { await verifyJwt(tok, cc); check(false, msg + ' (accepted!)'); }
  catch (e) { check(e.status === 401 && (!why || (e.extra && e.extra.why === why)), msg + ` -> ${e.status} ${e.extra && e.extra.why}`); }
}
const good = await verifyJwt(es256(k1, 'kid-1', claims()), cc).catch((e) => e);
check(good && good.sub === sub, 'a valid ES256 token from the project key is accepted and gives the sub');
await rejects(es256(k2, 'kid-1', claims()), 'a token signed by another key under the same kid', 'signature');
await rejects(hs256(claims()), 'an HS256 token (algorithm confusion)', 'alg');
await rejects(none(claims()), 'an alg:none token', 'alg');
await rejects(es256(k1, 'kid-1', claims({ exp: now - 1 })), 'an expired token', 'exp');
await rejects(es256(k1, 'kid-1', claims({ iss: 'https://other.supabase.co/auth/v1' })), 'a token from another project (iss)', 'iss');
await rejects(es256(k1, 'kid-1', claims({ aud: 'anon' })), 'a token for another audience', 'aud');
await rejects(es256(k1, 'kid-1', claims({ role: 'service_role' })), 'a service_role token', 'role');
await rejects(es256(k1, 'kid-1', claims({ role: 'anon' })), 'an anon token', 'role');
await rejects(es256(k1, 'kid-1', claims({ is_anonymous: true })), 'an anonymous user', 'anonymous');
await rejects(es256(k1, 'kid-1', claims({ sub: 'not-a-uuid' })), 'a token whose sub is not a uuid', 'sub');
await rejects(es256(k1, 'kid-1', claims({ iat: now + 3600 })), 'a token issued in the future', 'iat');
await rejects('abc.def', 'a malformed token', 'shape');
const tampered = es256(k1, 'kid-1', claims()).split('.'); tampered[1] = b64u(enc.encode(JSON.stringify(claims({ sub: '00000000-0000-4000-8000-000000000009' }))));
await rejects(tampered.join('.'), 'a token whose claims were edited after signing', 'signature');
// key rotation: a new kid triggers one refetch
const before = fetches;
served = [jwk(k1, 'kid-1'), jwk(k3, 'kid-3')];
const rot = await verifyJwt(es256(k3, 'kid-3', claims()), cc).catch((e) => e);
check(rot && rot.sub === sub && fetches === before + 1, 'a rotated key (new kid) is fetched once and accepted');
const f2 = fetches;
await rejects(es256(k2, 'kid-9', claims()), 'an unknown kid right after a refetch', 'kid');
check(fetches === f2, 'an unknown kid does not refetch again within 30 seconds');

console.log(`${n} checks, ${ok ? 'ALL PASSED' : 'SOME FAILED'}`);
process.exit(ok ? 0 : 1);
