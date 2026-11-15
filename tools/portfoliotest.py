"""End-to-end test of the Portfolio page (src/mod-y-portfolio.js) and its Worker relay (worker/brokerage.js).

Usage: python3 tools/build.py --no-prerender && python3 tools/portfoliotest.py [--shots DIR] [--wrangler PATH]
(after a full build it also checks the pre-built /portfolio/ page is noindex and out of the sitemap).

Needs no network: SnapTrade is tools/portfolio/mock_snaptrade.py (it checks every request signature with a fake consumer
key) and Supabase is tools/accounts/mock_supabase.py switched to ES256 tokens with a locally generated key, its JWKS,
/auth/v1/user and the brokerage_links table with row-level security. The Worker runs in `wrangler dev` (port 8790, a
temporary config without the site build; the fake secrets go in a .dev.vars file, the stand-ins' addresses in --var).
Wrangler comes from --wrangler, $WRANGLER or the PATH.

Covers: request signing (Node and Python agree, the documented example), sealing, token checks (forged, expired, wrong
project, wrong audience, service_role, HS256, alg none, unknown kid), other people's data unreachable, no secret in any
response or in the Worker's log, the read-only connection type, CORS and body limits, per-person rate limits, SnapTrade
down or rate limiting, disconnect, account deletion (also with SnapTrade down), the not-configured state, and in the
browser every page state on desktop and a 390x844 phone (screenshots at 2x), the help chat and Settings."""
import json, os, re, shutil, signal, subprocess, sys, tempfile, threading, time, urllib.error, urllib.parse, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'accounts')); sys.path.insert(0, os.path.join(HERE, 'portfolio'))
import mock_supabase as MS, mock_snaptrade as MT
from playwright.sync_api import sync_playwright

arg = lambda name, d=None: sys.argv[sys.argv.index(name) + 1] if name in sys.argv else d
SHOTS = arg('--shots', os.path.join(ROOT, 'shots', 'portfolio')); os.makedirs(SHOTS, exist_ok=True)
WRANGLER = arg('--wrangler') or os.environ.get('WRANGLER') or shutil.which('wrangler')
WR_PORT, ST_PORT, SB_PORT = 8790, 8911, 8912
B = f'http://127.0.0.1:{WR_PORT}'
SB_LOCAL = f'http://127.0.0.1:{SB_PORT}'
SB_BROWSER = 'https://fbtest.supabase.co'  # what the page is told; the browser's requests are routed to the stand-in
BOX_KEY = 'test-only-brokerage-key-' + 'z' * 24
DIST = os.path.join(ROOT, 'dist')
ok = True; counts = {'pass': 0, 'fail': 0}
def check(c, msg):
    global ok
    ok &= bool(c); counts['pass' if c else 'fail'] += 1
    print(('PASS ' if c else 'FAIL ') + msg, flush=True)

MS.enable_es256(SB_LOCAL + '/auth/v1')
MS.serve(SB_PORT); MT.serve(ST_PORT)
BODIES, KINDS = [], []  # every Worker answer (and which action), scanned for secrets at the end

# ---------------------------------------------------------------- 1. unit checks (no server)
r = subprocess.run(['node', os.path.join(HERE, 'portfolio', 'unit.mjs')], capture_output=True, text=True, timeout=120)
fails = [l for l in r.stdout.splitlines() if l.startswith('FAIL')]
check(r.returncode == 0 and not fails, f'unit checks (signing, sealing, tokens): {r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[:200]}')
for l in fails: print('   ', l)
import base64, hashlib, hmac
sigs = [json.loads(l[4:]) for l in r.stdout.splitlines() if l.startswith('SIG ')]
agree = all(base64.b64encode(hmac.new(s['key'].encode(), json.dumps({'content': s['body'] or None, 'path': s['path'], 'query': s['query']}, separators=(',', ':'), sort_keys=True).encode(), hashlib.sha256).digest()).decode() == s['sig'] for s in sigs)
check(len(sigs) == 2 and agree, 'Python (json.dumps sort_keys, compact) and the Worker (WebCrypto) produce the same signatures')

# ---------------------------------------------------------------- the Worker under wrangler dev
WR = {'p': None, 'dir': None, 'logs': []}
def start_worker(configured=True):
    stop_worker()
    d = tempfile.mkdtemp(prefix='fb-portfolio-wr-')
    cfg = {'name': 'firedbunny-portfoliotest', 'main': os.path.join(ROOT, 'worker', 'index.js'), 'compatibility_date': '2026-10-01',
           'assets': {'directory': DIST, 'binding': 'ASSETS', 'not_found_handling': '404-page', 'run_worker_first': ['/api/*', '/audio/*']}}
    json.dump(cfg, open(os.path.join(d, 'wrangler.json'), 'w'))
    if configured:  # secrets go in .dev.vars, like Worker secrets (wrangler shows them as hidden)
        open(os.path.join(d, '.dev.vars'), 'w').write(f'SNAPTRADE_CLIENT_ID="{MT.CLIENT_ID}"\nSNAPTRADE_CONSUMER_KEY="{MT.CONSUMER_KEY}"\nBROKERAGE_KEY="{BOX_KEY}"\n')
    log = os.path.join(d, 'wrangler.log')
    cmd = [WRANGLER, 'dev', '-c', os.path.join(d, 'wrangler.json'), '--port', str(WR_PORT), '--ip', '127.0.0.1',
           '--var', f'SNAPTRADE_API:http://127.0.0.1:{ST_PORT}', '--var', f'SUPABASE_URL:{SB_LOCAL}', '--var', 'SUPABASE_PUBLISHABLE_KEY:sb_publishable_test']
    WR['p'] = subprocess.Popen(cmd, stdout=open(log, 'w'), stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, cwd=d, start_new_session=True)
    WR['dir'] = d; WR['logs'].append(log)
    for i in range(240):
        try:
            if urllib.request.urlopen(B + '/sw.js', timeout=2).status == 200: return True
        except Exception:
            time.sleep(0.5)
    print(open(log).read()[-2000:]); return False
def stop_worker():
    p = WR['p']
    if p and p.poll() is None:
        try: os.killpg(p.pid, signal.SIGTERM)
        except Exception: pass
        try: p.wait(timeout=15)
        except Exception:
            try: os.killpg(p.pid, signal.SIGKILL)
            except Exception: pass
    WR['p'] = None
    for i in range(40):  # the port is free again
        try: urllib.request.urlopen(B + '/sw.js', timeout=1); time.sleep(0.25)
        except Exception: break

def api(action, body=None, token=None, origin=None, method='POST', ctype='application/json', raw=None, path=None):
    url = B + (path or '/api/brokerage/' + action)
    data = raw if raw is not None else (None if method in ('GET', 'OPTIONS') else json.dumps(body or {}).encode())
    h = {}
    if ctype and data is not None: h['Content-Type'] = ctype
    if token: h['Authorization'] = 'Bearer ' + token
    if origin: h['Origin'] = origin
    if method == 'OPTIONS': h['Access-Control-Request-Method'] = 'POST'; h['Access-Control-Request-Headers'] = 'authorization, content-type'
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        res = urllib.request.urlopen(req, timeout=60); code, text, hdr = res.status, res.read().decode(), dict(res.headers)
    except urllib.error.HTTPError as e:
        code, text, hdr = e.code, e.read().decode(), dict(e.headers)
    BODIES.append(text + json.dumps(hdr)); KINDS.append(action)
    try: j = json.loads(text) if text else None
    except Exception: j = None
    return code, j, hdr

def user(tag):
    u = {'id': f'{tag * 8}-0000-4000-8000-{tag * 12}'[:36], 'email': f'{tag}@example.com', 'password': 'x' * 10, 'created': time.time(), 'confirmed': time.time()}
    MS.STATE['users'][u['id']] = u
    return u
def portal(url, abandon=False):  # what SnapTrade's Connection Portal does: the person connects, then back to the site
    tok = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)['token'][0]
    req = urllib.request.Request(f'http://127.0.0.1:{ST_PORT}/__portal?token={tok}' + ('&abandon=1' if abandon else ''))
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k): return None
    try: urllib.request.build_opener(NoRedirect).open(req)
    except urllib.error.HTTPError as e: return e.headers.get('Location')
mt = lambda: json.loads(urllib.request.urlopen(f'http://127.0.0.1:{ST_PORT}/__state').read())
def mt_mode(m): urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{ST_PORT}/__mode?m={m}', method='POST'))

check(bool(WRANGLER) and os.path.exists(WRANGLER) or bool(shutil.which(str(WRANGLER))), f'wrangler found ({WRANGLER})')
subprocess.run(['pkill', '-f', 'fb-portfolio-wr-'], capture_output=True)  # a Worker left over from an interrupted run
def port_busy():
    try: urllib.request.urlopen(B + '/sw.js', timeout=1); return True
    except Exception: return False
for i in range(20):
    if not port_busy(): break
    time.sleep(0.5)
if port_busy(): sys.exit(f'port {WR_PORT} is in use by something else; stop it first')
import atexit; atexit.register(stop_worker)
check(start_worker(True), 'wrangler dev started with the brokerage secrets (stand-in SnapTrade and Supabase)')

# ---------------------------------------------------------------- 2. the relay's front door
A, Bu, C = user('a'), user('b'), user('c')
tA, tB, tC = MS.jwt(A), MS.jwt(Bu), MS.jwt(C)
code, j, h = api('status', method='GET')
check(code == 405 and h.get('Allow') == 'POST', f'GET is refused with 405, Allow: POST ({code})')
code, j, h = api('status')
check(code == 401 and j and j.get('error') == 'unauthorized', 'no token: 401 unauthorized')
code, j, h = api('status', method='OPTIONS', origin='https://firedbunny.com')
check(code == 204 and h.get('Access-Control-Allow-Origin') == 'https://firedbunny.com' and 'POST' in (h.get('Access-Control-Allow-Methods') or ''), 'CORS preflight from firedbunny.com is allowed')
code, j, h = api('status', method='OPTIONS', origin='https://evil.example')
check(code == 403 and 'Access-Control-Allow-Origin' not in h, 'CORS preflight from another site is refused')
code, j, h = api('status', token=tA, origin='https://evil.example')
check(code == 403 and j.get('error') == 'forbidden_origin', 'a POST from another site is refused even with a valid token')
code, j, h = api('status', token=tA, origin=B)
check(code == 200 and h.get('Access-Control-Allow-Origin') == B and h.get('Cache-Control') == 'no-store', f'same-origin POST: 200, no-store, CORS only for the site itself ({code} {h.get("Access-Control-Allow-Origin")} {h.get("Cache-Control")})')
code, j, h = api('status', token=tA, raw=b'{"x":"' + b'y' * 5000 + b'"}')
check(code == 413 and j.get('error') == 'too_large', 'a body over 4 KB is refused (413)')
code, j, h = api('status', token=tA, raw=b'hello', ctype='text/plain')
check(code == 415, 'a non-JSON body is refused (415)')
code, j, h = api('nope', token=tA)
check(code == 404, 'an unknown action is 404')
# forged and unusable tokens
now = int(time.time())
from cryptography.hazmat.primitives.asymmetric import ec
other = ec.generate_private_key(ec.SECP256R1())
b64 = lambda o: MS.b64u(json.dumps(o).encode())
bad = {
    'signed by another key (same kid)': MS.sign_es256(MS.claims_of(A), key=other),
    'HS256 (algorithm confusion)': b64({'alg': 'HS256', 'typ': 'JWT', 'kid': MS.STATE['kid']}) + '.' + b64(MS.claims_of(A)) + '.' + MS.b64u(hmac.new(b'secret', b'x', hashlib.sha256).digest()),
    'alg none': b64({'alg': 'none', 'typ': 'JWT', 'kid': MS.STATE['kid']}) + '.' + b64(MS.claims_of(A)) + '.',
    'expired': MS.sign_es256(MS.claims_of(A, exp=now - 5)),
    'another project (iss)': MS.sign_es256(MS.claims_of(A, iss='https://someone-else.supabase.co/auth/v1')),
    'another audience': MS.sign_es256(MS.claims_of(A, aud='anon')),
    'service_role': MS.sign_es256(MS.claims_of(A, role='service_role')),
    'unknown kid': MS.sign_es256(MS.claims_of(A), key=other, kid='rotated-away'),
    'claims edited after signing': (lambda t: t.split('.')[0] + '.' + b64(MS.claims_of(Bu)) + '.' + t.split('.')[2])(tA),
}
for name, tok in bad.items():
    code, j, h = api('status', token=tok)
    check(code == 401 and j.get('error') == 'unauthorized', f'token {name}: 401')
check(MS.STATE['jwks_hits'] >= 1, f'the Worker read the stand-in JWKS ({MS.STATE["jwks_hits"]} fetches: cached, plus one refetch for an unknown kid)')

# ---------------------------------------------------------------- 3. connecting, reading, other people
code, j, h = api('status', token=tA)
check(code == 200 and j == {'ok': True, 'configured': True, 'connected': False, 'connections': []}, 'A, never connected: configured, not connected')
hits0 = MS.STATE['user_hits']
code, j, h = api('connect', {'broker': 'ROBINHOOD'}, token=tA)
check(code == 200 and j.get('url', '').startswith('https://app.snaptrade.com/'), f'A connect: a Connection Portal link on snaptrade.com ({code})')
check(MS.STATE['user_hits'] > hits0, 'before registering a SnapTrade user, the Worker confirms the account at /auth/v1/user')
login = mt()['logins'][-1]
check(login.get('connectionType') == 'read', 'the portal is requested with connectionType "read"')
check(login.get('customRedirect') == B + '/portfolio/?connect=done' and login.get('broker') == 'ROBINHOOD' and login.get('immediateRedirect') is True, 'back to this site’s /portfolio/ (the Worker’s own origin), broker ROBINHOOD')
check(login.get('userId') == 'fb-' + A['id'], 'SnapTrade user id is fb-<account id>')
row = MS.STATE['links'].get(A['id'])
secretA = MT.STATE['users']['fb-' + A['id']]['secret']
check(row and row['secret_box'].startswith('v1.') and secretA not in row['secret_box'] and row['snaptrade_user_id'] == 'fb-' + A['id'], 'only the sealed secret is stored, in A’s own brokerage_links row')
loc = portal(j['url'])
check(loc and 'status=SUCCESS' in loc and loc.startswith(B + '/portfolio/?connect=done&'), 'the portal sends the person back with status=SUCCESS')
code, j, h = api('status', token=tA)
connA = j['connections'][0]['id'] if j and j.get('connections') else None
check(code == 200 and j['connected'] and j['connections'][0]['broker'] == 'Robinhood' and j['connections'][0]['type'] == 'read', 'A is connected to Robinhood, read-only')
code, j, h = api('portfolio', token=tA)
accts = (j or {}).get('accounts') or []
pos = [p for a in accts for p in (a.get('positions') or [])]
check(code == 200 and len(accts) == 2 and any(p.get('option') and p['option']['type'] == 'PUT' for p in pos) and len(j.get('activities') or []) > 20, f'A portfolio: 2 accounts, positions with options, activities ({len(pos)} positions)')
check(all(a.get('history') for a in accts) and any(p.get('lots') for p in pos), 'value history and tax lots come through')
reg0 = len(MT.STATE['registered'])
code, j, h = api('connect', {}, token=tA)
check(code == 200 and len(MT.STATE['registered']) == reg0, 'connecting again reuses A’s SnapTrade user (no second registration)')
# B cannot reach A
code, j, h = api('portfolio', token=tB)
check(code == 200 and j.get('connected') is False and 'accounts' not in j, 'B (never connected) gets nothing of A’s')
code, j, h = api('disconnect', {'connectionId': connA}, token=tB)
check(code == 200 and j.get('removed') == 'none' and mt()['users'].get('fb-' + A['id'], {}).get('connections'), 'B trying to disconnect A’s connection removes nothing')
api('connect', {}, token=tB)
code, j, h = api('disconnect', {'connectionId': connA}, token=tB)
check(code == 404 and j.get('error') == 'unknown_connection' and mt()['users'].get('fb-' + A['id'], {}).get('connections'), 'once B has a SnapTrade user, A’s connection id is still “not one of yours” (404)')
# B plants A's sealed secret in B's own row: it opens for nobody but A's user id
req = urllib.request.Request(SB_LOCAL + '/rest/v1/brokerage_links?on_conflict=user_id', method='POST', headers={'Authorization': 'Bearer ' + tB, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'},
                             data=json.dumps({'user_id': Bu['id'], 'snaptrade_user_id': 'fb-' + Bu['id'], 'secret_box': MS.STATE['links'][A['id']]['secret_box']}).encode())
urllib.request.urlopen(req)
code, j, h = api('portfolio', token=tB)
check(code == 200 and j.get('connected') is False and j.get('relink') is True and 'accounts' not in j, 'A’s sealed secret copied into B’s row does not open for B (bound to the user id): nothing of A’s')
req = urllib.request.Request(SB_LOCAL + '/rest/v1/brokerage_links?on_conflict=user_id', method='POST', headers={'Authorization': 'Bearer ' + tB, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'},
                             data=json.dumps({'user_id': Bu['id'], 'snaptrade_user_id': 'fb-' + A['id'], 'secret_box': 'v1.xxxxxxxxxxxxxxxx.yyyyyyyy'}).encode())
try: urllib.request.urlopen(req); planted = True
except urllib.error.HTTPError as e: planted = e.code != 400
check(not planted, 'B cannot point their row at A’s SnapTrade user id (check constraint)')
code, j, h = api('connect', {}, token=tB)
check(code == 200 and MS.STATE['links'][Bu['id']]['snaptrade_user_id'].startswith('fb-' + Bu['id']) and MT.STATE['users'].get(MS.STATE['links'][Bu['id']]['snaptrade_user_id']), 'B’s unreadable row is replaced by a fresh SnapTrade user (the old one deleted first)')
check(not mt()['bad'], f'every request reached SnapTrade with a valid signature ({len(mt()["bad"])} refused)')

# ---------------------------------------------------------------- 4. limits and SnapTrade trouble
codes = [api('status', token=tC)[0] for i in range(31)]
code, j, h = api('status', token=tC)
check(all(c == 200 for c in codes[:30]) and code == 429 and j.get('error') == 'rate_limited' and j.get('retryAfter') and h.get('Retry-After'), f'per-person limit: 30 status checks in 5 minutes, then 429 with Retry-After')
code, j, h = api('status', token=tA)
check(code == 200, 'another person is not affected by C’s limit')
mt_mode('down')
code, j, h = api('portfolio', token=tA)
check(code == 502 and j.get('error') == 'snaptrade_unreachable' and set(j) <= {'error', 'message'}, 'SnapTrade down: 502 snaptrade_unreachable, nothing of its answer passed on')
mt_mode('ratelimit')
code, j, h = api('portfolio', token=tA)
check(code == 429 and j.get('error') == 'snaptrade_rate_limited' and j.get('retryAfter'), 'SnapTrade rate limiting: 429 snaptrade_rate_limited with a retry time')
mt_mode('ok')
code, j, h = api('portfolio', token=tA)
code2, j2, h2 = api('portfolio', token=tA)
check(code == 200 and code2 == 429 and j2.get('error') == 'rate_limited', 'portfolio refreshes are limited to 4 per 2 minutes per person')
# a session that no longer exists (account deleted) cannot register a new SnapTrade user
G = user('9'); tG = MS.jwt(G); del MS.STATE['users'][G['id']]
code, j, h = api('connect', {}, token=tG)
check(code == 401 and not any(r.endswith(G['id']) for r in MT.STATE['registered']), 'a still-valid token for a deleted account is refused at connect (401), nothing registered')
# the table missing (owner has not run the schema yet)
F = user('f'); tF = MS.jwt(F); MS.STATE['links_mode'] = 'missing'
code, j, h = api('status', token=tF)
check(code == 503 and j.get('error') == 'schema_missing', 'brokerage_links missing: 503 schema_missing')
MS.STATE['links_mode'] = 'ok'

# ---------------------------------------------------------------- 5. disconnect and forget
code, j, h = api('disconnect', {'connectionId': connA}, token=tA)
check(code == 200 and j.get('removed') == 'user' and 'fb-' + A['id'] not in mt()['users'] and A['id'] not in MS.STATE['links'], 'A disconnects the only connection: SnapTrade user deleted and the row removed')
code, j, h = api('status', token=tA)
check(code == 200 and j['connected'] is False, 'A is not connected any more')
D = user('d'); tD = MS.jwt(D); api('connect', {}, token=tD)
code, j, h = api('forget', {}, token=tD)
check(code == 200 and j.get('snaptrade') == 'deleted' and 'fb-' + D['id'] in mt()['deleted'] and D['id'] not in MS.STATE['links'], 'forget (account deletion): SnapTrade user deleted, row removed')
E = user('e'); tE = MS.jwt(E); api('connect', {}, token=tE)
mt_mode('down')
code, j, h = api('forget', {}, token=tE)
mt_mode('ok')
check(code == 502 and j.get('error') == 'snaptrade_unreachable' and E['id'] in MS.STATE['links'], 'forget with SnapTrade down: 502, and the row is kept so a retry knows what to delete')
code, j, h = api('forget', {}, token=tE)
check(code == 200 and 'fb-' + E['id'] in mt()['deleted'] and E['id'] not in MS.STATE['links'], 'the retry deletes it')
H = user('8'); tH = MS.jwt(H); mt_mode('down')
code, j, h = api('forget', {}, token=tH); mt_mode('ok')
check(code == 200 and j.get('snaptrade') == 'unchecked', 'forget with SnapTrade down for someone who never connected: no alarm (nothing on record)')
# health: says set / not set, never the values
code, j, h = api(None, path='/api/health', method='GET')
bk = (j or {}).get('brokerage') or {}
check(bk.get('ready') is True and bk.get('SNAPTRADE_CONSUMER_KEY') == 'set' and bk.get('BROKERAGE_KEY') == 'set', f'/api/health says the brokerage secrets are set ({code})')

# ---------------------------------------------------------------- 6. the browser
CFG = re.compile(r"window\.SML\.SUPABASE = \{[^}]*\};")
LIVE = {'v': False}
def inject(body):
    assert len(CFG.findall(body)) == 1
    body = CFG.sub(lambda m: f"window.SML.SUPABASE = {{ url: '{SB_BROWSER}', key: 'sb_publishable_test', live: true }};", body)
    if LIVE['v']: body = body.replace('window.SML.BROKERAGE = { live: false };', 'window.SML.BROKERAGE = { live: true };')
    return body
ERRS = []
PORTAL = {'abandon': False}
def watch(pg, label):
    pg.on('pageerror', lambda e: ERRS.append(f'{label}: {e}'))
    pg.on('console', lambda m: ERRS.append(f'{label} console: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)
def context(b, w=1280, h=900, phone=False, init=None):
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, service_workers='block', has_touch=phone, is_mobile=phone, reduced_motion='reduce')
    def app(route):
        r = route.fetch(); route.fulfill(response=r, body=inject(r.text()))
    ctx.route('**/app.*.js', app)
    def sb(route):
        url = route.request.url.replace(SB_BROWSER, SB_LOCAL)
        route.fulfill(response=route.fetch(url=url, max_redirects=0, headers=dict(route.request.headers, **{'x-mock-origin': SB_BROWSER})))
    ctx.route(SB_BROWSER + '/**', sb)
    def snap(route):  # the Connection Portal: the stand-in connects (or abandons) and redirects back
        q = urllib.parse.urlsplit(route.request.url).query
        route.fulfill(response=route.fetch(url=f'http://127.0.0.1:{ST_PORT}/__portal?{q}' + ('&abandon=1' if PORTAL['abandon'] else ''), max_redirects=0))
    ctx.route('https://app.snaptrade.com/**', snap)
    ctx.route('**/api/price/**', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'source': 'test', 'currency': 'USD', 'points': [['2026-11-12', 66.9], ['2026-11-13', 67.3]]})))
    ctx.route('**/*googletagmanager*', lambda r: r.abort())
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort()); ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    if init: ctx.add_init_script(init)
    return ctx
READY = "() => window.SML && SML.portfolio && SML.account && SML.account.status.ready && !document.getElementById('pre') && !document.getElementById('boot')"
def go(pg, path):
    pg.goto(B + path); pg.wait_for_function(READY, timeout=30000); pg.wait_for_timeout(300)
def settle(pg, timeout=20000):  # the page has finished asking the Worker
    pg.wait_for_function("() => SML.portfolio && !SML.portfolio._state.busy && !SML.portfolio._state.connecting && document.querySelector('#pf-top') && !document.querySelector('#pf-top .pf-busy')", timeout=timeout); pg.wait_for_timeout(250)
# textContent, not innerText: headings are uppercase on screen (CSS), not in the text
txt = lambda pg, sel: re.sub(r'\s+', ' ', pg.evaluate("(s) => { const e = document.querySelector(s); return e ? e.textContent : ''; }", sel))
top = lambda pg: txt(pg, '#pf-top')
main = lambda pg: txt(pg, '#pf-main')
def shot(pg, name, full=True): pg.screenshot(path=os.path.join(SHOTS, name + '.png'), full_page=full)
def nowide(pg): return pg.evaluate('document.documentElement.scrollWidth') <= pg.viewport_size['width']
def signup(pg, email):
    MS.STATE['confirm'] = False
    go(pg, '/signin/'); pg.fill('#au-email', email); pg.fill('#au-pw', 'a long enough pass'); pg.click('form[data-auth="signup"] button[type=submit]')
    pg.wait_for_selector('[data-auth-act="signout"]', timeout=20000)
    return next(u['id'] for u in MS.STATE['users'].values() if u['email'] == email)
def done(ctx):  # close a context without tripping over route handlers still running
    try: ctx.unroute_all(behavior='ignoreErrors')
    except Exception: pass
    ctx.close()
def via_portal(pg, sel):  # click, go through the (stand-in) Connection Portal, and land back on /portfolio/
    with pg.expect_navigation(url=re.compile(r'/portfolio/\?connect=done'), timeout=30000):
        pg.click(sel)
    pg.wait_for_function(READY, timeout=30000); settle(pg, 40000)
def both(pg, name):  # the state as it is on a desktop, then on a 390x844 phone screen (no sideways scrolling)
    w, h = pg.viewport_size['width'], pg.viewport_size['height']
    pg.evaluate('window.scrollTo(0, 0)'); shot(pg, name + '-desktop', full=False)
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(400); pg.evaluate('window.scrollTo(0, 0)')
    wide = nowide(pg); shot(pg, name + '-phone', full=False)
    pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(300)
    check(wide, f'{name}: fits a 390px phone screen')
def copy_key(pg): return pg.evaluate("Object.keys(localStorage).filter((k) => k.indexOf('fb-portfolio:') === 0)")

with sync_playwright() as p:
    br = p.chromium.launch()
    # ---- signed out (desktop and phone) ----
    for w, h, tag, phone in [(1280, 900, 'desktop', False), (390, 844, 'phone', True)]:
        X = context(br, w, h, phone); pg = X.new_page(); watch(pg, 'out-' + tag)
        go(pg, '/portfolio/')
        t = top(pg)
        check('Sign in to see your own accounts' in t and pg.is_visible('#pf-top a.btn-p') and 'Sample data' in main(pg) and 'Individual (sample)' in main(pg), f'{tag}, signed out: explains, links to sign in, shows the labelled sample')
        check('Read-only. FiredBunny can’t place trades. Education, not financial advice.' in txt(pg, '#view'), f'{tag}: the read-only line is visible')
        check(pg.evaluate("document.querySelector('meta[name=robots]') && document.querySelector('meta[name=robots]').content.includes('noindex')"), f'{tag}: the page is noindex')
        check(nowide(pg), f'{tag}: no sideways scrolling')
        if phone:
            hs = pg.evaluate("Array.from(document.querySelectorAll('#view .btn, #view summary')).filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().height))")
            check(hs and min(hs) >= 32, f'phone: buttons and toggles at least 32px tall ({min(hs) if hs else None})')
        shot(pg, f'portfolio-signed-out-{tag}')
        done(X)
    # ---- signed in, before launch, then the preview ----
    X = context(br); pg = X.new_page(); watch(pg, 'U')
    uidU = signup(pg, 'pat@example.com')
    go(pg, '/portfolio/')
    check('almost ready' in top(pg) and not pg.query_selector('[data-pf="connect"]') and 'Sample data' in main(pg), 'signed in before launch (live: false): “coming soon”, no Connect button, the sample')
    both(pg, 'portfolio-coming-soon')
    go(pg, '/portfolio/?preview=brokerage'); settle(pg)
    check(pg.evaluate("location.search") == '' and pg.evaluate("localStorage.getItem('fb-brokerage-preview')") == '1', '?preview=brokerage opts this browser in and is taken out of the address')
    check('Connect your brokerage, read-only' in top(pg) and pg.is_visible('[data-pf="connect"][data-broker="ROBINHOOD"]') and 'SnapTrade privacy policy' in top(pg), 'not connected: what connecting means (read-only, SnapTrade, where data goes, disconnect) and Connect')
    check(pg.get_attribute('#pf-top a[href*="privacy-policy"]', 'href') == 'https://snaptrade.com/privacy-policy' and pg.get_attribute('#pf-top a[href*="security"]', 'href') == 'https://snaptrade.com/security', 'links to SnapTrade’s privacy and security pages')
    shot(pg, 'portfolio-not-connected-desktop'); both(pg, 'portfolio-not-connected-top')
    via_portal(pg, '[data-pf="connect"][data-broker="ROBINHOOD"]')
    check(mt()['logins'][-1].get('connectionType') == 'read' and mt()['logins'][-1].get('broker') == 'ROBINHOOD', 'Connect Robinhood: SnapTrade portal requested read-only for Robinhood')
    check('Connected.' in top(pg) and 'Robinhood' in top(pg) and 'read-only' in top(pg) and 'Robinhood Individual' in main(pg) and 'Sample data' not in main(pg), 'back from the portal: connected banner, Robinhood read-only, the live accounts')
    check(pg.evaluate("location.search") == '', 'the portal’s status parameters are taken out of the address')
    keys = copy_key(pg)
    copy = pg.evaluate("(k) => localStorage.getItem(k)", keys[0]) if keys else ''
    check(keys == ['fb-portfolio:' + uidU] and 'Robinhood Individual' in copy and 'v1.' not in copy and not any(s in copy for s in MT.STATE['issued']), 'this device keeps a copy of the holdings under the person’s id, without any secret')
    m = main(pg)
    check('AAPL is 47% of everything here' in m and 'Position sizing' in m, 'observation: AAPL concentration, linked to position sizing')
    check('PYPL' in m and 'Bought' in m and 'wash sale' in m.lower(), 'tax-loss candidates with the wash-sale check (PYPL bought within 30 days)')
    check('KO $65 put' in m and 'Cash-secured put' in m and '$67.30' in m and 'Out of the money' in m, 'the cash-secured put: strike, stock price (last close), moneyness')
    check('AAPL $280 call' in m and 'Covered call' in m, 'the covered call is recognised')
    check('Shares + covered calls' in m or 'Selling puts' in m, 'wheel progress per stock')
    check(pg.evaluate("Array.from(document.querySelectorAll('#pf-main svg[role=img]')).every((s) => (s.getAttribute('aria-label') || '').length > 20)") and pg.evaluate("document.querySelectorAll('#pf-main details.pf-more table').length") >= 2, 'charts have text equivalents (labels and “Show the numbers” tables)')
    check(pg.evaluate("[...document.querySelectorAll('#pf-main a.pf-ln')].every((a) => a.getAttribute('href').startsWith('/'))") and pg.evaluate("document.querySelectorAll('#pf-main .pf-ins a.pf-ln').length") >= 6, 'every observation links to a lesson or tool (real paths)')
    shot(pg, 'portfolio-connected-desktop')
    pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(500)
    check(nowide(pg), 'connected, 390px wide: no sideways scrolling (tables scroll inside their box)')
    shot(pg, 'portfolio-connected-phone')
    pg.screenshot(path=os.path.join(SHOTS, 'portfolio-connected-phone-top.png'))
    pg.set_viewport_size({'width': 1280, 'height': 900}); pg.wait_for_timeout(300)
    # abandoned portal
    PORTAL['abandon'] = True
    via_portal(pg, '[data-pf="connect-more"]')
    PORTAL['abandon'] = False
    check('You closed the connection window' in top(pg) and 'Robinhood Individual' in main(pg), 'an abandoned portal says nothing was connected, and the data stays')
    both(pg, 'portfolio-portal-abandoned')
    start_worker(True)  # a fresh Worker instance: its in-memory rate limits start again
    # SnapTrade down: the device copy, with its time
    mt_mode('down'); pg.click('[data-pf="refresh"]'); settle(pg)
    t = top(pg)
    check('SnapTrade (the connection service) is not answering' in t and 'Showing the copy saved on this device' in t and 'Robinhood Individual' in main(pg), 'SnapTrade down: says so and shows the device copy with its time')
    both(pg, 'portfolio-error-snaptrade-down')
    mt_mode('ratelimit'); pg.click('[data-pf="refresh"]'); settle(pg)
    check('SnapTrade asked us to slow down' in top(pg), 'SnapTrade rate limiting is explained')
    both(pg, 'portfolio-error-snaptrade-rate-limited')
    mt_mode('ok')
    connU = mt()['users']['fb-' + uidU]['connections'][0]['id']
    urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{ST_PORT}/__disable?id={connU}&on=1', method='POST'))
    pg.click('[data-pf="refresh"]'); settle(pg)
    check('Robinhood needs you to sign in again' in top(pg) and pg.is_visible('[data-pf="reconnect"]'), 'a broken connection: “needs you to sign in again” with Reconnect')
    both(pg, 'portfolio-reauth')
    pg.click('[data-pf="refresh"]'); settle(pg)  # the 4th refresh in two minutes is still allowed
    pg.click('[data-pf="refresh"]'); settle(pg)
    code_rl = top(pg)
    check('refreshed a lot' in code_rl and 'Robinhood Individual' in main(pg), 'our own rate limit: explained, data kept')
    both(pg, 'portfolio-rate-limited')
    start_worker(True)
    via_portal(pg, '[data-pf="reconnect"]')
    check(mt()['logins'][-1].get('reconnect') == connU and 'needs you to sign in again' not in top(pg), 'Reconnect sends the connection id to the portal and the warning goes away')
    # offline
    X.set_offline(True); pg.click('[data-pf="refresh"]'); settle(pg)
    check('You’re offline' in top(pg) and 'Showing the copy saved on this device' in top(pg) and 'Robinhood Individual' in main(pg), 'offline: the last device copy with its time')
    both(pg, 'portfolio-offline')
    X.set_offline(False); pg.wait_for_timeout(1500); settle(pg)
    check('offline' not in top(pg).lower(), 'back online: refreshed by itself')
    # help chat and Settings while previewing
    pg.click('.fbc-launch'); pg.wait_for_selector('#fbc-panel:not([hidden]) .fbc-chip', timeout=8000)
    n = pg.evaluate("document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length")
    pg.fill('#fbc-q', 'how do i connect my robinhood'); pg.press('#fbc-q', 'Enter')
    pg.wait_for_function(f"() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length > {n} && !document.querySelector('.fbc-typing')", timeout=8000)
    last = pg.evaluate("() => { const ms = document.querySelectorAll('.fbc-m.bot'); const m = ms[ms.length - 1]; const a = m.querySelector('.fbc-a.pri'); return { t: m.textContent, h: a && a.getAttribute('href') }; }")
    check(last['h'] == '/portfolio/' and 'read-only' in last['t'] and 'can’t place trades' in last['t'], f'help chat: “connect my robinhood” answers with the Portfolio page ({last["h"]})')
    n = pg.evaluate("document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length")
    pg.fill('#fbc-q', 'what data do you collect'); pg.press('#fbc-q', 'Enter')
    pg.wait_for_function(f"() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length > {n} && !document.querySelector('.fbc-typing')", timeout=8000)
    t = pg.evaluate("() => { const ms = document.querySelectorAll('.fbc-m.bot'); return ms[ms.length - 1].textContent; }")
    check('Portfolio page' in t and 'kept on this device only' in t, 'help chat: the privacy answer mentions how brokerage data is handled')
    pg.click('[data-fbc="close"]')
    go(pg, '/settings/')
    st_txt = txt(pg, '#view')
    check('If you connect a brokerage on the Portfolio page' in st_txt and pg.query_selector('a.acx-link[href="/portfolio/"]'), 'Settings: privacy item about brokerage data, and a link to Portfolio')
    go(pg, '/dashboard/')
    check(bool(pg.query_selector('#view a[href="/portfolio/"]')), 'the dashboard links to Portfolio')
    # disconnect
    go(pg, '/portfolio/'); settle(pg, 40000)
    pg.click('[data-pf="disconnect"]')
    check(pg.is_visible('.pf-confirm') and 'removed at SnapTrade' in txt(pg, '.pf-confirm'), 'Disconnect asks first and says what it does')
    pg.click('[data-pf="disconnect-yes"]'); settle(pg, 40000)
    check('Disconnected.' in top(pg) and 'Connect your brokerage, read-only' in top(pg) and 'fb-' + uidU not in mt()['users'] and uidU not in MS.STATE['links'] and not copy_key(pg), 'Disconnect: removed at SnapTrade, row and device copy gone, back to Connect')
    both(pg, 'portfolio-disconnected')
    # sign out removes the device copy
    start_worker(True)
    via_portal(pg, '[data-pf="connect"][data-broker="ROBINHOOD"]')
    check(copy_key(pg) == ['fb-portfolio:' + uidU], 'connected again: a device copy exists')
    go(pg, '/settings/'); pg.click('[data-auth-act="signout"]'); pg.wait_for_timeout(1500)
    check(not copy_key(pg), 'signing out deletes this device’s copy of the holdings')
    done(X)
    # ---- account deletion removes the SnapTrade user first ----
    for down in (False, True):
        X = context(br); pg = X.new_page(); watch(pg, 'del')
        uid = signup(pg, f'del{int(down)}@example.com')
        go(pg, '/portfolio/?preview=brokerage'); settle(pg)
        via_portal(pg, '[data-pf="connect"][data-broker="ROBINHOOD"]')
        check('fb-' + uid in mt()['users'], f'deletion test{" (SnapTrade down)" if down else ""}: connected first')
        go(pg, '/settings/')
        if down: mt_mode('down')
        pg.fill('#acx-del', 'DELETE'); pg.click('[data-acx-act="delete-account"]')
        if down:
            pg.wait_for_selector('[data-acx-act="home"]', timeout=20000)
            msg = txt(pg, '[data-acx="del-msg"]')
            check(uid not in MS.STATE['users'] and 'Your FiredBunny account is deleted' in msg and 'could not be removed at SnapTrade' in msg and 'connected apps' in msg, 'SnapTrade down: the account is still deleted, and the page says the connection may remain and how to remove it')
            check('fb-' + uid in mt()['users'], '(that SnapTrade user stays behind, as the message says)')
            pg.evaluate("document.querySelector('[data-acx=\"del-msg\"]').scrollIntoView({ block: 'center' })"); shot(pg, 'settings-delete-snaptrade-down-desktop', full=False)
            pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(300); pg.evaluate("document.querySelector('[data-acx=\"del-msg\"]').scrollIntoView({ block: 'center' })"); shot(pg, 'settings-delete-snaptrade-down-phone', full=False)
            check(nowide(pg), 'settings, SnapTrade down message: fits a 390px phone screen')
            mt_mode('ok')
        else:
            pg.wait_for_function("location.pathname === '/'", timeout=20000)
            check(uid not in MS.STATE['users'] and 'fb-' + uid in mt()['deleted'] and uid not in MS.STATE['links'], 'Delete my account too: SnapTrade user deleted first, then the account and its row')
        done(X)
    # ---- live: true shows Connect without the preview ----
    LIVE['v'] = True
    X = context(br, 390, 844, phone=True); pg = X.new_page(); watch(pg, 'live')
    signup(pg, 'livy@example.com'); go(pg, '/portfolio/'); settle(pg)
    check(pg.is_visible('[data-pf="connect"]'), 'with live: true the Connect button shows without ?preview')
    shot(pg, 'portfolio-not-connected-phone')
    via_portal(pg, '[data-pf="connect"][data-broker="ROBINHOOD"]')
    pg.evaluate("window.scrollTo(0, 0)"); shot(pg, 'portfolio-connected-phone-full')
    check(nowide(pg), 'phone (390x844), connected: no sideways scrolling')
    done(X); LIVE['v'] = False
    # ---- the server without SnapTrade keys ----
    start_worker(False)
    code, j, h = api('status', token=tA)
    check(code == 200 and j == {'ok': True, 'configured': False}, 'without the secrets: status says configured: false')
    code, j, h = api(None, path='/api/health', method='GET')
    bk = (j or {}).get('brokerage') or {}
    check(bk.get('ready') is False and bk.get('SNAPTRADE_CONSUMER_KEY') == 'not set' and 'Portfolio page shows sample data' in bk.get('verdict', ''), '/api/health says what is missing')
    for w, h_, tag, phone in [(1280, 900, 'desktop', False), (390, 844, 'phone', True)]:
        X = context(br, w, h_, phone); pg = X.new_page(); watch(pg, 'nc-' + tag)
        signup(pg, f'nc-{tag}@example.com'); go(pg, '/portfolio/?preview=brokerage'); settle(pg)
        check('Live connections aren’t switched on yet' in top(pg) and 'Sample data' in main(pg) and not pg.query_selector('[data-pf="connect"]'), f'{tag}: server not configured: says so, shows the labelled sample, no Connect')
        shot(pg, f'portfolio-not-configured-{tag}')
        if tag == 'desktop':
            go(pg, '/settings/'); pg.fill('#acx-del', 'DELETE'); pg.click('[data-acx-act="delete-account"]'); pg.wait_for_function("location.pathname === '/'", timeout=20000)
            check(not any(u['email'] == 'nc-desktop@example.com' for u in MS.STATE['users'].values()), 'not configured: deleting the account works as before')
        done(X)
    stop_worker()
    # ---- the claude.ai copy: always the sample ----
    body = open(os.path.join(ROOT, 'build', 'fragment.html'), encoding='utf-8').read()
    prev = os.path.join(ROOT, 'build', 'portfolio-preview.html')
    open(prev, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + body + '</body></html>')
    FAKE = """(() => { const store = {}; const snap = (p) => ({ id: p.split('/').pop(), exists: p in store, data: () => store[p] });
      const doc = (p) => ({ id: p.split('/').pop(), get: async () => snap(p), set: async (d) => { store[p] = d; } });
      const col = (p) => ({ doc: (id) => doc(p + '/' + id), orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }), get: async () => ({ docs: [] }), onSnapshot: () => () => {} });
      const user = { me: async () => ({ id: 'u1', name: 'Visitor' }), id: async () => 'u1', isOwner: async () => false, can: async () => true, canEdit: async () => true, profiles: async () => ({}) };
      window.claude = { use: (n) => Promise.resolve(n === 'user' ? user : n === 'db' ? { doc, collection: col } : null) }; })();"""
    X = context(br, init=FAKE); pg = X.new_page(); watch(pg, 'claude')
    calls = []; pg.on('request', lambda r: calls.append(r.url) if '/api/brokerage' in r.url else None)
    pg.goto('file://' + prev + '#portfolio'); pg.wait_for_function("() => window.SML && SML.portfolio && SML.host === 'claude' && !document.getElementById('boot') && document.querySelector('#pf-main .dsh-kpis')", timeout=30000); pg.wait_for_timeout(300)
    check('This copy always shows made-up sample data' in top(pg) and 'Sample data' in main(pg) and not calls and not pg.query_selector('[data-pf="connect"]'), 'claude.ai copy (hash addresses): always the sample, no Connect, no server calls')
    both(pg, 'portfolio-claude-copy')
    done(X)
    br.close()

# ---------------------------------------------------------------- 7. secrets and the pre-built page
secrets_ = [MT.CONSUMER_KEY, BOX_KEY] + MT.STATE['issued']
leaks = [s for s in secrets_ if any(s in b for b in BODIES)]
check(not leaks and BODIES, f'no secret (consumer key, BROKERAGE_KEY, any userSecret) in any of {len(BODIES)} Worker answers')
check(not any(MT.CLIENT_ID in b for b, k in zip(BODIES, KINDS) if k != 'connect'), 'the SnapTrade client id is in no Worker answer either, except inside the portal link SnapTrade itself builds')
logs = ''.join(open(l, encoding='utf-8', errors='replace').read() for l in WR['logs'])
check(not [s for s in secrets_ if s in logs] and 'userSecret' not in logs, f'no secret and no SnapTrade URL in the Worker’s log ({len(logs)} characters checked)')
pre = os.path.join(DIST, 'portfolio', 'index.html')
if os.path.exists(pre):
    html = open(pre, encoding='utf-8').read(); sm = open(os.path.join(DIST, 'sitemap.xml'), encoding='utf-8').read()
    check('noindex' in html and '/portfolio/' not in sm and '<div id="pre">' not in html, 'pre-built /portfolio/ is a noindex shell without a snapshot, and not in the sitemap')
else:
    print('(no pre-built pages: run a full build to check /portfolio/ in the sitemap)')
errs = [e for e in ERRS if 'favicon' not in e]
check(not errs, f'no script errors {errs[:4]}')
print(f"{counts['pass']} passed, {counts['fail']} failed")
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
