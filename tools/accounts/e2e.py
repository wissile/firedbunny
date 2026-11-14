"""End-to-end test of FiredBunny accounts (src/cloud.js) against a stand-in Supabase (mock_supabase.py), no network.

Usage: python3 tools/build.py --no-prerender && python3 tools/accounts/e2e.py
Two browser contexts are two devices. The app script gets a test project's config injected (src/cloud-config.js stays
empty), and requests to https://fbtest.supabase.co go to the stand-in. Covers sign-up with email confirmation, sign-in,
moving guest data into the account, syncing between devices, offline changes, merging lesson progress, sign-out,
password reset, another person's data staying private, account deletion, and the phone layout. Needs Playwright."""
import os, sys, tempfile, threading, http.server, json, urllib.request, time
HERE = os.path.dirname(os.path.abspath(__file__)); SP = tempfile.gettempdir()
sys.path.insert(0, HERE)
import staticserver as fbserver, mock_supabase
from playwright.sync_api import sync_playwright

SITE_PORT, MOCK_PORT = 8875, 8901
site = http.server.ThreadingHTTPServer(('127.0.0.1', SITE_PORT), fbserver.handler(os.path.join(os.path.dirname(os.path.dirname(HERE)), 'dist')))
threading.Thread(target=site.serve_forever, daemon=True).start()
mock = mock_supabase.serve(MOCK_PORT)
B = f'http://127.0.0.1:{SITE_PORT}'
SB = 'https://fbtest.supabase.co'
EMAIL, PW, PW2 = 'pat@example.com', 'correct horse battery', 'new staple horse'
ok = True
def check(c, msg):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + msg, flush=True)
def mstate():
    return json.loads(urllib.request.urlopen(f'http://127.0.0.1:{MOCK_PORT}/__state').read())
def outbox(email):
    return json.loads(urllib.request.urlopen(f'http://127.0.0.1:{MOCK_PORT}/__outbox?email={email}').read())
def rows(email=EMAIL):
    st = mstate(); u = next((x for x in st['users'] if x['email'] == email), None)
    return {r['key']: r['value'] for r in st['rows'] if u and r['user_id'] == u['id']}

NET = {}
def device(b):
    ctx = b.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
    net = {'down': False}; NET[id(ctx)] = net
    def app(route):
        r = route.fetch(); body = r.text()
        assert "window.SML.SUPABASE = { url: '', key: '' };" in body
        body = body.replace("window.SML.SUPABASE = { url: '', key: '' };", f"window.SML.SUPABASE = {{ url: '{SB}', key: 'sb_publishable_test' }};")
        route.fulfill(response=r, body=body)
    ctx.route('**/app.*.js', app)
    def sb(route):
        if net['down']: return route.abort('internetdisconnected')
        url = route.request.url.replace(SB, f'http://127.0.0.1:{MOCK_PORT}')
        r = route.fetch(url=url, max_redirects=0, headers=dict(route.request.headers, **{'x-mock-origin': SB}))
        route.fulfill(response=r)
    ctx.route(SB + '/**', sb)
    ctx.route('**/*googletagmanager*', lambda r: r.abort())
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    return ctx, pg, errs

READY = "() => window.SML && SML.account && SML.account.status.ready && !document.getElementById('pre')"
def go(pg, path):
    pg.goto(B + path); pg.wait_for_function(READY, timeout=20000); pg.wait_for_timeout(300)
def settle(pg):  # wait until the device has uploaded everything
    pg.wait_for_function("() => SML.cloud.status.pending === 0", timeout=15000); pg.wait_for_timeout(200)

with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------- device A: a guest with data, then creates an account ----------
    A, pa, ea = device(b)
    go(pa, '/')
    pa.evaluate("""() => { SML.store.set('journal-rows', [{date:'2026-11-01', ticker:'DEMO', pnl: 120}]); SML.store.set('fire-plan', {spend: 50000});
                         SML.progress.set('l-stock', true); SML.account.save({ nickname: 'Pat' }); }""")
    check(pa.evaluate("SML.accountsOn && SML.cloud.enabled && !SML.cloud.user"), 'accounts switched on, guest not signed in')
    check(pa.evaluate("!!document.querySelector('script[src*=\"/vendor/\"]')") is False, 'guests on ordinary pages do not load the sign-in library')
    go(pa, '/signin/')
    check(pa.is_visible('form[data-auth="signup"]'), 'sign-in page shows the create-account form')
    pa.fill('#au-email', 'not-an-email'); pa.fill('#au-pw', 'short'); pa.click('form[data-auth="signup"] button[type=submit]')
    check('Enter your email' in pa.inner_text('.acx-err'), 'invalid email is caught before sending')
    pa.fill('#au-email', EMAIL); pa.fill('#au-pw', 'short'); pa.click('form[data-auth="signup"] button[type=submit]')
    check('at least 8' in pa.inner_text('.acx-err'), 'short password is caught')
    pa.fill('#au-pw', PW); pa.click('form[data-auth="signup"] button[type=submit]')
    pa.wait_for_selector('text=Check your email', timeout=15000)
    check(any(u['email'] == EMAIL and not u['confirmed'] for u in mstate()['users']), 'account created, waiting for email confirmation')
    pa.click('[data-auth-go="signin"]'); pa.fill('#au-email', EMAIL); pa.fill('#au-pw', PW); pa.click('form[data-auth="signin"] button[type=submit]')
    pa.wait_for_selector('.acx-err', timeout=15000)
    check('Confirm your email' in pa.inner_text('.acx-err'), f'signing in before confirming explains why ({pa.inner_text(".acx-err")[:60]})')
    mail = outbox(EMAIL); check(mail and mail['kind'] == 'signup', 'confirmation email sent with a link')
    pa.goto(mail['link']); pa.wait_for_function(READY, timeout=20000)
    pa.wait_for_selector('[data-auth-act="signout"]', timeout=20000)
    pa.wait_for_function("SML.account.status.mode === 'cloud'", timeout=15000); pa.wait_for_selector('[data-acx-act="migrate"]', timeout=10000)
    check(pa.evaluate("SML.account.status.provider === 'supabase' && SML.account.status.mode === 'cloud'"), 'the email link signs you in (account mode)')
    check(pa.evaluate("location.search") == '', 'the one-time code is removed from the address bar')
    check(pa.is_visible('[data-acx-act="migrate"]'), 'offers to move this browser\'s guest data into the account')
    pa.click('[data-acx-act="migrate"]'); pa.wait_for_timeout(500); settle(pa)
    r = rows()
    check(r.get('profile', {}).get('nickname') == 'Pat' and 'l-stock' in r.get('profile', {}).get('progress', {}).get('done', []), 'profile and lesson progress moved to the account')
    check(r.get('s:journal-rows') == [{'date': '2026-11-01', 'ticker': 'DEMO', 'pnl': 120}] and r.get('s:fire-plan') == {'spend': 50000}, 'trade journal and FIRE plan moved to the account')
    check(pa.evaluate("localStorage.getItem('sml:journal-rows') === null && localStorage.getItem('sml:profile') === 'null'"), 'guest copies removed from the browser (moved, not copied)')
    check(pa.evaluate("localStorage.getItem('sml:analytics')") is None or 'analytics' not in json.dumps(r), 'analytics consent is not uploaded')
    go(pa, '/lessons/what-a-stock-is/'); pa.click('#mark'); pa.wait_for_timeout(300); settle(pa)
    check(pa.evaluate("SML.progress.list().length") >= 1 and 'l-stock' in rows()['profile']['progress']['done'], 'marking a lesson complete saves to the account')
    go(pa, '/settings/')
    check(EMAIL in pa.inner_text('.acx-id small') and pa.is_visible('[data-auth-act="signout"]'), 'settings shows the account and a sign-out button')
    check('Up to date' in pa.inner_text('[data-auth="sync"]'), f'settings shows the sync state ({pa.inner_text("[data-auth=sync]")})')

    # ---------- device B: signs in with the password, sees everything ----------
    Bc, pb, eb = device(b)
    go(pb, '/signin/'); pb.click('[data-auth-go="signin"]')
    pb.fill('#au-email', EMAIL); pb.fill('#au-pw', 'wrong password'); pb.click('form[data-auth="signin"] button[type=submit]')
    pb.wait_for_selector('.acx-err', timeout=15000)
    check('don’t match' in pb.inner_text('.acx-err'), 'wrong password gives a plain message')
    pb.fill('#au-pw', PW); pb.click('form[data-auth="signin"] button[type=submit]')
    pb.wait_for_selector('[data-auth-act="signout"]', timeout=20000); pb.wait_for_function("SML.account.status.mode === 'cloud'", timeout=15000)
    check(pb.evaluate("SML.account.displayName()") == 'Pat' and pb.evaluate("SML.store.get('journal-rows', null)") == [{'date': '2026-11-01', 'ticker': 'DEMO', 'pnl': 120}], 'device B gets the profile and journal')
    check('l-stock' in pb.evaluate("SML.progress.list()"), 'device B gets the lesson progress')
    go(pb, '/dashboard/'); check('Saved to your account' in pb.inner_text('main'), 'dashboard says it is saved to the account')
    # B changes things; A picks them up when it comes back to the tab
    pb.evaluate("() => { SML.store.set('fire-plan', {spend: 42000}); SML.progress.set('l-bonds', true); }"); settle(pb)
    pa.evaluate("SML.cloud.sync(true)"); pa.wait_for_timeout(800)
    check(pa.evaluate("SML.store.get('fire-plan', null)") == {'spend': 42000} and 'l-bonds' in pa.evaluate("SML.progress.list()"), 'a change on device B reaches device A')
    # both change lesson progress while A is offline: nothing is lost
    NET[id(A)]['down'] = True  # device A cannot reach the account server (the website itself still loads)
    pa.evaluate("window.dispatchEvent(new Event('offline'))")
    pa.evaluate("SML.progress.set('l-etfs', true)"); pa.wait_for_timeout(1200)
    check(pa.evaluate("SML.cloud.status.pending") >= 1 and pa.evaluate("JSON.parse(localStorage.getItem('fb-cloud:' + SML.cloud.user.id)).pending.profile") >= 1, 'offline change waits on device A (kept in browser storage)')
    pb.evaluate("SML.progress.set('l-risk-ladder', true)"); settle(pb)
    pa.reload(); pa.wait_for_function(READY, timeout=20000)
    check('l-etfs' in pa.evaluate("SML.progress.list()"), 'device A reopens offline with its account copy and the waiting change')
    pa.wait_for_function("SML.cloud.status.offline === true", timeout=15000); pa.wait_for_timeout(200)
    st_txt = pa.evaluate("document.querySelector('[data-auth=sync]') ? document.querySelector('[data-auth=sync]').textContent : ''")
    check('Offline' in st_txt and 'will upload' in st_txt, f'settings says the change waits until back online ({st_txt})')
    NET[id(A)]['down'] = False; pa.evaluate("window.dispatchEvent(new Event('online'))"); pa.wait_for_timeout(1500); settle(pa)
    done = set(rows()['profile']['progress']['done'])
    check({'l-stock', 'l-bonds', 'l-etfs', 'l-risk-ladder'} <= done, f'after reconnecting both devices\' lesson progress is kept ({sorted(done)})')
    check({'l-etfs', 'l-risk-ladder'} <= set(pa.evaluate("SML.progress.list()")), 'and device A shows both')
    # device B never refreshed, then saves its (older) profile: lessons from A must survive, B's new nickname wins
    pb.evaluate("SML.account.save({ nickname: 'Pat B' })"); settle(pb)
    pr = rows()['profile']
    check(pr['nickname'] == 'Pat B' and 'l-etfs' in pr['progress']['done'], f'a stale device saving later keeps the other device\'s lessons ({sorted(pr["progress"]["done"])})')
    check('l-etfs' in pb.evaluate("SML.progress.list()"), 'and the stale device now shows them too')
    # sign out on A
    go(pa, '/signin/')
    with pa.expect_navigation(timeout=20000): pa.click('[data-auth-act="signout"]')
    pa.wait_for_function(READY, timeout=20000); pa.wait_for_timeout(500)
    check(pa.evaluate("!SML.cloud.user && SML.account.status.mode === 'local'"), 'sign out returns device A to guest mode')
    check(pa.evaluate("Object.keys(localStorage).filter(k => k.startsWith('fb-cloud:') || k.startsWith('sb-')).length") == 0, 'signing out deletes the account copy and session from the browser')
    check(pa.evaluate("SML.store.get('journal-rows', null)") is None, 'the journal is no longer readable on device A')

    # ---------- password reset on A ----------
    go(pa, '/signin/'); pa.click('[data-auth-go="signin"]'); pa.click('[data-auth-go="forgot"]')
    pa.fill('#au-email', EMAIL); pa.click('form[data-auth="forgot"] button[type=submit]'); pa.wait_for_selector('text=Check your email')
    mail = outbox(EMAIL); check(mail and mail['kind'] == 'recovery', 'reset email sent')
    pa.goto(mail['link']); pa.wait_for_selector('form[data-auth="recovery"]', timeout=20000)
    check(pa.evaluate("location.search") == '', 'reset link opens the new-password form and cleans the address')
    pa.fill('#au-pw', PW2); pa.click('form[data-auth="recovery"] button[type=submit]')
    pa.wait_for_selector('[data-auth-act="signout"]', timeout=20000)
    check(pa.evaluate("SML.account.status.provider") == 'supabase', 'new password saved and signed in')
    # B signs out and back in with the new password
    go(pb, '/signin/')
    with pb.expect_navigation(timeout=20000): pb.click('[data-auth-act="signout"]')
    pb.wait_for_function(READY); pb.wait_for_timeout(400)
    go(pb, '/signin/'); pb.click('[data-auth-go="signin"]'); pb.fill('#au-email', EMAIL); pb.fill('#au-pw', PW2); pb.click('form[data-auth="signin"] button[type=submit]')
    pb.wait_for_selector('[data-auth-act="signout"]', timeout=20000); pb.wait_for_function("SML.account.status.mode === 'cloud'", timeout=15000)
    check(pb.evaluate("SML.account.status.provider") == 'supabase' and pb.evaluate("SML.account.displayName()") == 'Pat B', 'the new password works on the other device')

    # ---------- another person cannot see Pat's data ----------
    mock_supabase.STATE['confirm'] = False
    Cc, pc, ec = device(b)
    go(pc, '/signin/'); pc.fill('#au-email', 'sam@example.com'); pc.fill('#au-pw', 'another long pass'); pc.click('form[data-auth="signup"] button[type=submit]')
    pc.wait_for_selector('[data-auth-act="signout"]', timeout=20000)
    check(pc.evaluate("SML.store.get('journal-rows', null)") is None and pc.evaluate("SML.account.displayName()") == '', 'a second person sees none of the first person\'s data')
    check(pc.evaluate("""async () => { const c = await SML.cloud.client(); const r = await c.from('user_data').upsert([{ user_id: '00000000-0000-0000-0000-000000000000', key: 'x', value: 1 }]); return r.error && r.error.code; }""") == '42501', 'writing into someone else\'s account is refused')
    mock_supabase.STATE['confirm'] = True

    # ---------- delete account on B ----------
    go(pb, '/settings/'); pb.fill('#acx-del', 'DELETE')
    with pb.expect_navigation(timeout=20000): pb.click('[data-acx-act="delete-account"]')
    pb.wait_for_function(READY, timeout=20000); pb.wait_for_timeout(500)
    check(pb.evaluate("!SML.cloud.user && location.pathname === '/'"), 'after deleting, the visitor is a guest on the home page')
    check(not any(u['email'] == EMAIL for u in mstate()['users']) and not rows(), 'deleting the account removes the login and every saved row')
    check(pb.evaluate("Object.keys(localStorage).filter(k => k.startsWith('fb-cloud:') || k.startsWith('sb-')).length") == 0, 'and nothing of it is left in that browser')

    # ---------- phone width ----------
    P = b.new_context(viewport={'width': 390, 'height': 844}, service_workers='block'); P.route('**/app.*.js', lambda route: route.fulfill(response=route.fetch(), body=route.fetch().text().replace("window.SML.SUPABASE = { url: '', key: '' };", f"window.SML.SUPABASE = {{ url: '{SB}', key: 'k' }};")))
    pp = P.new_page(); go(pp, '/signin/')
    check(pp.evaluate("document.documentElement.scrollWidth") <= 390, 'sign-in page fits a phone screen')
    pp.screenshot(path=f'{SP}/acct-phone.png', full_page=False)
    pa.screenshot(path=f'{SP}/acct-desktop.png')
    errs = [e for e in ea + eb + ec if 'favicon' not in e]
    check(not errs, f'no page errors {errs[:4]}')
    b.close()
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
