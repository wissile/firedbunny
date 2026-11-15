"""End-to-end test of the Plans page and its waitlist (src/mod-y-plans.js, the footer link, the help chat's plans,
waitlist-leave, free and support replies, the Settings privacy line) against the stand-in Supabase.

Usage: python3 tools/build.py --no-prerender && python3 tools/planstest.py [--shots DIR]
(after a full build it also checks the pre-built page, the sitemap, tools/seo-lastmod.json and layout shift).
Serves dist/ like the Cloudflare deployment (tools/accounts/staticserver.py) and points the app at the stand-in Supabase
(tools/accounts/mock_supabase.py, whose waitlist follows supabase/schema.sql), so it needs no network. Covers: the page
(one h1, both plans, no prices or dates), the footer link; a guest joining with an email (malformed and missing email
caught, extras and note stored, nothing read back, a duplicate in other capitals gives the same answer and stores
nothing new), what the browser may do with the table (no reading, no account spoofing, no read-back, no deleting); the
table missing, offline and busy cases (the form and the answers stay); a signed-in one-click join (no email collected,
account id stored), the status shown after a reload, leaving and joining again, the Settings privacy line, the "table
missing" status, account deletion removing the sign-up; the lastmod text being the same signed in and out; the help
chat (plans and waitlist-leave intents, the free and support replies, and "premium" questions about options, insurance
and taxes still reaching their lessons); the waitlist_join event only with analytics consent and never with the email
or the note; keyboard focus; a 390x844 phone; the claude.ai copy and a copy from disk (they collect nothing and point to
firedbunny.com/plans); and no script errors. Screenshots (2x) go to shots/plans/ unless --shots is given.
Needs Playwright with Chromium."""
import glob, hashlib, json, os, re, sys, threading, time, http.server, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'accounts')); sys.path.insert(0, HERE)
import staticserver, mock_supabase
from prerender import SNAPSHOT_JS
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else os.path.join(ROOT, 'shots', 'plans')
os.makedirs(SHOTS, exist_ok=True)
SITE_PORT, MOCK_PORT = 8893, 8907
DIST = os.path.join(ROOT, 'dist')
site = http.server.ThreadingHTTPServer(('127.0.0.1', SITE_PORT), staticserver.handler(DIST))
threading.Thread(target=site.serve_forever, daemon=True).start()
mock_supabase.serve(MOCK_PORT)
B = f'http://127.0.0.1:{SITE_PORT}'
V = 'http://firedbunny.test'  # a "real visitor" host (mapped to the local server), so analytics is not switched off as local
SB = 'https://fbtest.supabase.co'
MS = mock_supabase.STATE
ok = True
counts = {'pass': 0, 'fail': 0}
def check(c, msg):
    global ok
    ok &= bool(c); counts['pass' if c else 'fail'] += 1
    print(('PASS ' if c else 'FAIL ') + msg, flush=True)
def mstate():
    return json.loads(urllib.request.urlopen(f'http://127.0.0.1:{MOCK_PORT}/__state').read())
def rows():
    return mstate()['waitlist']
def calls(kind):  # requests the stand-in has seen, e.g. 'get /rest/v1/waitlist'
    return sum(1 for c in MS['calls'] if c == kind)

CFG = re.compile(r"window\.SML\.SUPABASE = \{[^}]*\};")
def inject(body):  # point the app at the stand-in project
    assert len(CFG.findall(body)) == 1, 'cloud-config line not found in the app script'
    return CFG.sub(lambda m: f"window.SML.SUPABASE = {{ url: '{SB}', key: 'sb_publishable_test', live: true }};", body)

ERRS = []
def watch(pg, label):
    pg.on('pageerror', lambda e: ERRS.append(f'{label}: {e}'))
    pg.on('console', lambda m: ERRS.append(f'{label} console: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)

HIDE = "Object.defineProperty(navigator, 'webdriver', { get: () => false });"
def context(b, w=1280, h=900, phone=False, tz='America/Denver', visitor=False, init=None):
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, service_workers='block', has_touch=phone, is_mobile=phone,
                        reduced_motion='reduce', timezone_id=tz)
    def app(route):
        r = route.fetch(url=route.request.url.replace(V, B)); route.fulfill(response=r, body=inject(r.text()))
    ctx.route('**/app.*.js', app)
    def sb(route):
        url = route.request.url.replace(SB, f'http://127.0.0.1:{MOCK_PORT}')
        route.fulfill(response=route.fetch(url=url, max_redirects=0, headers=dict(route.request.headers, **{'x-mock-origin': SB})))
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())  # never the real project (the copies carry its address)
    ctx.route(SB + '/**', sb)
    ctx.route('**/*googletagmanager*', lambda r: r.abort())
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort()); ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    if visitor: ctx.add_init_script(HIDE)
    if init: ctx.add_init_script(init)
    return ctx

READY = "() => window.SML && SML.plans && SML.chat && SML.account && SML.account.status.ready && !document.getElementById('pre') && !document.getElementById('boot')"
def go(pg, path, base=B):
    pg.goto(base + path); pg.wait_for_function(READY, timeout=20000); pg.wait_for_timeout(250)
def plans_ready(pg):  # the waitlist box has settled (signed in: the status check has answered)
    pg.wait_for_function("() => { const b = document.querySelector('.pl-box'); if (!b) return false; const s = b.querySelector('[type=submit]'); return b.querySelector('.pl-done, .pl-away') || (s && !s.disabled); }", timeout=15000)
    pg.wait_for_timeout(100)
TEXTHASH = lambda pg: hashlib.sha1(pg.evaluate(SNAPSHOT_JS)['text'].encode('utf-8')).hexdigest()[:16]
EVS = """(n) => { const out = []; for (const e of (window.dataLayer || [])) {
  if (!e || Object.prototype.toString.call(e) !== '[object Arguments]') continue;
  if (e[0] === 'event' && (!n || e[1] === n)) out.push(Object.assign({ event: e[1] }, e[2] || {})); } return out; }"""
DL = "() => JSON.stringify((window.dataLayer || []).map((e) => Object.prototype.toString.call(e) === '[object Arguments]' ? Array.from(e) : e))"
FOOT = "() => Array.from(document.querySelectorAll('footer.foot a')).filter((a) => a.textContent.trim() === 'Plans').map((a) => a.getAttribute('href'))"
STATUS = "() => { const s = document.querySelector('.pl-box .pl-status:not([hidden])'); return s ? { cls: s.className, text: s.textContent.replace(/\\s+/g, ' ').trim() } : null; }"
def status(pg):
    return pg.evaluate(STATUS)
def wait_status(pg, cls, timeout=10000):
    pg.wait_for_function(f"() => {{ const s = document.querySelector('.pl-box .pl-status:not([hidden])'); return s && s.classList.contains('{cls}'); }}", timeout=timeout)
    pg.wait_for_timeout(80)
    return status(pg)
def fill_form(pg, email=None, extras=(), note=None):
    for c in pg.locator('[data-pl-extra]').all():
        want = c.get_attribute('value') in extras
        if c.is_checked() != want: c.click()
    if note is not None: pg.fill('#pl-note', note)
    if email is not None: pg.fill('#pl-email', email)
def submit(pg):
    pg.evaluate("() => { const s = document.querySelector('.pl-box .pl-status'); if (s) s.hidden = true; }")  # so a stale message never counts
    pg.click('#pl-form [type=submit]')
def box_shot(pg, name):  # the waitlist box, from a full-page capture taken at the top (so the sticky header never covers it)
    pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(80)
    r = pg.evaluate("() => { const b = document.querySelector('.pl-box').getBoundingClientRect(); return { x: b.left - 8, y: b.top + window.scrollY - 8, width: b.width + 16, height: b.height + 16 }; }")
    pg.screenshot(path=os.path.join(SHOTS, name), full_page=True, clip=r)
def reply(pg, q):
    return pg.evaluate('(q) => { SML.chat.reset(); return SML.chat.reply(q); }', q)
def top(pg, q):
    m = pg.evaluate('(q) => SML.chat.match(q)', q)
    return m[0]['tok'] if m else None
def chat_ask(pg, text):
    n = pg.evaluate("() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length")
    pg.fill('#fbc-q', text); pg.press('#fbc-q', 'Enter')
    pg.wait_for_function(f"() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length > {n} && !document.querySelector('.fbc-typing')", timeout=8000)
    pg.wait_for_timeout(60)
    return pg.evaluate("""() => { const ms = document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)'); const m = ms[ms.length - 1]; const pri = m.querySelector('.fbc-a.pri');
      return { text: m.textContent.replace(/\\s+/g, ' ').trim(), pri: pri ? pri.getAttribute('href') : null }; }""")
def open_chat(pg):
    pg.click('.fbc-launch'); pg.wait_for_selector('#fbc-panel:not([hidden]) .fbc-chip', timeout=8000)
def sign_up(pg, email):
    MS['confirm'] = False
    go(pg, '/signin/'); pg.fill('#au-email', email); pg.fill('#au-pw', 'a long enough pass'); pg.click('form[data-auth="signup"] button[type=submit]')
    pg.wait_for_selector('[data-auth-act="signout"]', timeout=20000)
    MS['confirm'] = True
    return next(u['id'] for u in mstate()['users'] if u['email'] == email)

with sync_playwright() as p:
    b = p.chromium.launch(args=[f'--host-resolver-rules=MAP firedbunny.test 127.0.0.1:{SITE_PORT}'])

    # ---------- the page, as a guest ----------
    G = context(b); pg = G.new_page(); watch(pg, 'guest')
    go(pg, '/plans/'); plans_ready(pg)
    view = pg.inner_text('#view')
    check(pg.locator('#view h1').count() == 1 and 'free stays free' in pg.inner_text('#view h1').replace('\n', ' ').lower(), 'the Plans page has one h1: “Free stays free.”')
    check(all(s.lower() in view.lower() for s in ['Today, and for good', 'FiredBunny Plus', 'working name', 'Being considered', 'There is no price and no date', 'Nothing on this list will move into a paid plan']), 'both plans are there: the free one (stays free) and a possible one, being considered, no price or date')
    check(all(s in view for s in ['Every lesson and quiz', 'Every calculator and simulator', 'A free account', 'The Portfolio page', 'once connections are switched on', 'No ads, no affiliate links and no paywall']), 'the free plan lists what exists today, the Portfolio page once connections are on')
    check(all(x['t'] in view for x in pg.evaluate('SML.plans.EXTRAS')) and 'None would tell you what to buy or sell' in view and 'promise a return' in view and 'explain your own numbers with the lessons' in view, 'the extras being considered are listed, framed as education (nothing on what to buy or sell, no returns promised)')
    check(not re.search(r'[$€£]|\b(19|20)\d\d\b|per month|/mo\b|a month\b|\bmonthly\b|\b(January|February|March|April|June|July|August|September|October|November|December)\b', view), 'no prices and no dates anywhere on the page')
    check(pg.evaluate("document.querySelector('.pl-box').hasAttribute('data-volatile')") and pg.locator('#pl-form [name]').count() == 0, 'the waitlist box is data-volatile and its fields have no name attribute (a submit before the script starts sends nothing)')
    check(pg.evaluate(FOOT) == ['/plans/'], f'the footer has a Plans link to /plans/ ({pg.evaluate(FOOT)})')
    check('Plans: free for everyone' in pg.title() and pg.evaluate("document.querySelector('meta[name=robots]').content").startswith('index'), f'title and robots ({pg.title()})')
    pg.screenshot(path=os.path.join(SHOTS, 'plans-desktop.png'), full_page=True)
    for path in ['/', '/lessons/wheel-strategy/', '/tools/position-size/']:
        go(pg, path)
        check(pg.evaluate(FOOT) == ['/plans/'], f'footer Plans link on {path}')
    pg.locator('footer.foot a', has_text='Plans').first.click()
    pg.wait_for_function("location.pathname === '/plans/'", timeout=8000); pg.wait_for_function(READY); plans_ready(pg)
    check(pg.evaluate('!!window.SML') and pg.locator('#pl-form').count() == 1, 'the footer link opens the Plans page inside the site')
    hash_guest = TEXTHASH(pg)
    pg.evaluate("window.scrollTo(0, 0)"); pg.click('.pl-hcta a'); pg.wait_for_timeout(300)
    check(pg.evaluate("Math.abs(document.getElementById('pl-join').getBoundingClientRect().top) < 120") and pg.evaluate("location.pathname") == '/plans/', 'the header’s “Join the waitlist” jumps to the form without leaving the page')

    # ---------- a guest joins ----------
    check('your email, the extras you tick' in pg.inner_text('.pl-stored') and 'only to tell you if the plan opens' in pg.inner_text('.pl-stored') and 'no newsletter, no marketing' in pg.inner_text('.pl-stored') and 'never sold or shared' in pg.inner_text('.pl-stored') and 'send a note' in pg.inner_text('.pl-stored'), 'the form says what is stored, what the email is for (only the plan opening), and how to leave')
    check(pg.locator('.pl-send a[href="/signin/"]').count() == 1, 'guests are offered to sign in and join with one click')
    n_post = calls('post /rest/v1/waitlist')
    fill_form(pg, email='reader@nowhere', extras=('report',)); submit(pg)
    s = wait_status(pg, 'err')
    check('Check the email address' in s['text'] and pg.get_attribute('#pl-email', 'aria-invalid') == 'true' and pg.evaluate("document.activeElement.id") == 'pl-email', 'a malformed email is caught in the browser, marked invalid and focused')
    pg.fill('#pl-email', ''); submit(pg); s = wait_status(pg, 'err')
    check('Add your email' in s['text'], 'an empty email is caught too')
    check(calls('post /rest/v1/waitlist') == n_post and not rows(), 'nothing was sent for them')
    n_get = calls('get /rest/v1/waitlist')
    fill_form(pg, email='  reader@example.com ', extras=('report', 'review'), note='A printable report, please.'); submit(pg)
    s = wait_status(pg, 'ok')
    first = s['text']
    check('You’re on the list' in first and 'reader@example.com' in first, f'joined: “You’re on the list”, with the address ({first[:90]})')
    check(pg.evaluate("document.activeElement && document.activeElement.classList.contains('pl-status')"), 'focus moves to the confirmation')
    r = rows()
    check(len(r) == 1 and r[0]['email'] == 'reader@example.com' and r[0]['extras'] == ['report', 'review'] and r[0]['note'] == 'A printable report, please.' and r[0]['user_id'] is None and r[0]['id'], f'stored: email (trimmed), the ticked extras, the note, no account ({r})')
    check(all('return=representation' not in pr for pr in MS['waitlist_prefer']) and calls('get /rest/v1/waitlist') == n_get, 'nothing is read back: the insert asks for nothing and a guest never reads the table')
    check(pg.evaluate("location.search") == '', 'the address bar carries nothing from the form')
    box_shot(pg, 'waitlist-guest-joined-desktop.png')
    pg.click('[data-pl="again"]')
    check(pg.evaluate("document.activeElement.id") == 'pl-email' and pg.input_value('#pl-email') == '', '“Add another email” brings back an empty form')
    fill_form(pg, email='Reader@Example.COM', extras=('coach',)); submit(pg)
    s = wait_status(pg, 'ok')
    check(s['text'].lower() == first.lower(), 'joining again with the same address (other capitals) gives exactly the same answer')
    r = rows()
    check(len(r) == 1 and r[0]['extras'] == ['report', 'review'], 'and stores nothing new (the first sign-up and its answers are kept)')
    # the table's rules as the browser sees them
    res = pg.evaluate("""async () => { const c = await SML.cloud.feedbackClient(); const a = await c.from('waitlist').select('*'); const a2 = await c.from('waitlist').select('extras');
      const b = await c.from('waitlist').insert({ email: 'spoof@example.com', user_id: '00000000-0000-0000-0000-000000000000' });
      const d = await c.from('waitlist').insert({ email: 'back@example.com' }).select();
      const e = await c.from('waitlist').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
      const f = await c.from('waitlist').update({ note: 'x' }).eq('user_id', '00000000-0000-0000-0000-000000000000');
      return [a.error && a.error.code, a2.error && a2.error.code, b.error && b.error.code, d.error && d.error.code, e.error && e.error.code, f.error && f.error.code]; }""")
    check(res == ['42501'] * 6, f'visitors cannot read the list, set an account, read back, delete or change ({res})')
    check(len(rows()) == 1, 'still one row')
    # the table is missing (the owner has not run the new schema yet): the form and the answers stay
    MS['waitlist_mode'] = 'missing'
    pg.click('[data-pl="again"]'); fill_form(pg, email='new@example.com', extras=('history',), note='Longer history, yes.'); submit(pg)
    s = wait_status(pg, 'err')
    kept = pg.evaluate("() => [document.getElementById('pl-email').value, document.getElementById('pl-note').value, [...document.querySelectorAll('[data-pl-extra]:checked')].map((c) => c.value)]")
    check('isn’t open yet' in s['text'] and 'nothing was saved' in s['text'] and kept == ['new@example.com', 'Longer history, yes.', ['history']], f'table missing: it says so gracefully and keeps the form and the answers ({s["text"][:60]}, {kept})')
    box_shot(pg, 'waitlist-table-missing-desktop.png')
    MS['waitlist_mode'] = 'ok'
    submit(pg); s = wait_status(pg, 'ok')
    check(len(rows()) == 2 and rows()[-1]['email'] == 'new@example.com' and rows()[-1]['extras'] == ['history'], 'once the table exists, pressing the button again joins')
    # offline
    pg.click('[data-pl="again"]'); fill_form(pg, email='offline@example.com', extras=('coach',))
    G.set_offline(True); submit(pg); s = wait_status(pg, 'err'); G.set_offline(False)
    check('offline' in s['text'] and pg.input_value('#pl-email') == 'offline@example.com' and len(rows()) == 2, 'offline: says so, keeps the answers, stores nothing')
    # the help chat
    for q in ['is there a paid plan', 'how much is the premium plan', 'pricing', 'waitlist', 'firedbunny plus', 'do you have a subscription', 'will it always be free', 'will you start charging', 'upgrade my account', 'is there a premium version']:
        r = reply(pg, q)
        check(r['intent'] == 'plans' and 'being considered' in r['text'] and 'no price, no date' in r['text'] and 'never what to buy or sell' in r['text'], f'chat: “{q}” → plans ({r["intent"]})')
    r = reply(pg, 'is there a paid plan')
    check('stays free' in r['text'] and 'join the waitlist on the Plans page' in r['text'], 'chat: the plans reply says everything free stays free and points to the waitlist')
    for q in ['how do i leave the waitlist', 'remove me from the waiting list']:
        r = reply(pg, q)
        check(r['intent'] == 'waitlist-leave' and 'send a note' in r['text'], f'chat: “{q}” → how to leave (guests: send a note) ({r["intent"]})')
    r = reply(pg, 'is it free')
    check(r['intent'] == 'free' and 'no paywall' in r['text'] and 'no “premium” tier for the important parts' in r['text'] and 'only being considered' in r['text'], 'chat: the free reply stays true and mentions the plan being considered')
    for q in ['do i have to pay', 'do i have to pay for the lessons', 'will i need to pay to use it']:
        r = reply(pg, q)
        check(r['intent'] == 'free', f'chat: “{q}” → free ({r["intent"]})')
    r = reply(pg, 'how can i support you')
    check(r['intent'] == 'support' and 'chip in' in r['text'], 'chat: the support reply is unchanged in substance')
    for q, tok in [('what is option premium', 'l-contracts'), ('sell premium', 'l-contracts'), ('collect premium', 'l-contracts'), ('what is a premium in options', 'l-contracts'), ('premium decay', 'l-theta'),
                   ('insurance premium', None), ('health insurance premiums', None), ('premium tax credit', 'l-aca'), ('how much premium should i collect', None), ('premium', 'l-contracts'),
                   ('option pricing', None), ('cancel subscriptions', None), ('plan for retirement', None), ('fire plan', None), ('premium income from covered calls', 'l-wheel'),
                   # money questions about taxes, brokers and insurance are not about FiredBunny's price
                   ('do i have to pay taxes on dividends', None), ('do i need to pay tax on my roth withdrawal', None), ('will i have to pay capital gains', None),
                   ('is my broker going to charge me for options', None), ('will they start charging commissions', None), ('is robinhood going to charge a fee', None),
                   ('premium plan health insurance', None), ('pro account margin', None), ('upgrade my account to margin', None), ('vanguard premium account', None)]:
        r = reply(pg, q)
        good = r['intent'] not in ('plans', 'free', 'support', 'waitlist-leave') and (tok is None or top(pg, q) == tok)
        check(good, f'chat: “{q}” still reaches its lesson ({r["intent"]}, {top(pg, q)})')
    open_chat(pg)
    r = chat_ask(pg, 'Is there a paid plan?')
    check(r['pri'] == '/plans/', f'chat: the answer’s button opens the Plans page ({r["pri"]})')
    pg.locator('#fbc-panel').screenshot(path=os.path.join(SHOTS, 'chat-plans-desktop.png'))
    pg.evaluate('SML.chat.close()')
    # keyboard: the checkboxes are reachable and show focus; Space ticks one
    go(pg, '/plans/'); plans_ready(pg)
    pg.focus('#pl-note'); pg.keyboard.press('Shift+Tab')
    st = pg.evaluate("() => { const a = document.activeElement; const s = getComputedStyle(a); return { v: a.value, type: a.type, style: s.outlineStyle, w: parseFloat(s.outlineWidth) }; }")
    pg.keyboard.press('Space')
    check(st['type'] == 'checkbox' and st['style'] != 'none' and st['w'] >= 1 and pg.is_checked('[data-pl-extra][value="history"]'), f'keyboard: Tab reaches the checkboxes with a visible focus ring, Space ticks one ({st})')
    G.close()

    # ---------- busy: the database's flood guard ----------
    now = time.time()
    keep = list(MS['waitlist'])
    MS['waitlist'] += [{'id': f'f{i}', 'created_at': '', 'email': f'flood{i}@example.com', 'user_id': None, 'extras': [], 'note': None, 't': now} for i in range(120)]
    F = context(b); pf = F.new_page(); watch(pf, 'busy')
    go(pf, '/plans/'); plans_ready(pf); fill_form(pf, email='late@example.com'); submit(pf); s = wait_status(pf, 'err')
    check('A lot of sign-ups' in s['text'] and pf.input_value('#pl-email') == 'late@example.com', 'too many sign-ups at once: it says so and keeps the answers')
    MS['waitlist'] = keep
    F.close()

    # ---------- signed in: one click, status, leave ----------
    S = context(b); ps = S.new_page(); watch(ps, 'signed-in')
    uid = sign_up(ps, 'sam@example.com')
    go(ps, '/plans/'); plans_ready(ps)
    check(ps.locator('#pl-email').count() == 0 and ps.inner_text('#pl-form [type=submit]') == 'Join with one click', 'signed in: no email field, a one-click button')
    check('your account id' in ps.inner_text('.pl-stored') and 'No email is asked for' in ps.inner_text('.pl-stored') and 'Leave it any time on this page' in ps.inner_text('.pl-stored'), 'signed in: it says the account id is stored, no email is collected, and how to leave')
    check(TEXTHASH(ps) == hash_guest, 'the page text the lastmod hash reads is the same signed in and as a guest')
    n_rows = len(rows())
    fill_form(ps, extras=('review', 'history'), note='Would use the review.'); submit(ps)
    ps.wait_for_selector('.pl-done .pl-status.ok', timeout=10000); ps.wait_for_timeout(100)
    t = ps.inner_text('.pl-done')
    mine = [w for w in rows() if w['user_id'] == uid]
    check('You’re on the list' in t and 'Deeper portfolio history' in t and 'Portfolio review in plain words' in t, f'one click: “You’re on the list”, with the extras ticked ({t[:100]!r})')
    check(len(rows()) == n_rows + 1 and len(mine) == 1 and mine[0]['email'] is None and mine[0]['extras'] == ['history', 'review'] and mine[0]['note'] == 'Would use the review.', f'stored with the account id and no email ({mine})')
    box_shot(ps, 'waitlist-signed-in-on-desktop.png')
    go(ps, '/plans/'); plans_ready(ps)
    t = ps.inner_text('.pl-done') if ps.locator('.pl-done').count() else ''
    check('You’re on the waitlist' in t and 'Joined ' in t and ps.locator('[data-pl="leave"]').count() == 1, f'after a reload the status shows: on the waitlist, since when, with a Leave button ({t[:80]!r})')
    r = ps.evaluate("SML.plans.join({ extras: ['coach'] })")
    check(r['ok'] and len([w for w in rows() if w['user_id'] == uid]) == 1 and [w for w in rows() if w['user_id'] == uid][0]['extras'] == ['history', 'review'], 'joining twice keeps one sign-up with the first answers')
    r = reply(ps, 'how do i leave the waitlist')
    check(r['intent'] == 'waitlist-leave' and 'Leave the waitlist' in r['text'], 'chat (signed in): leave it yourself on the Plans page')
    ps.click('[data-pl="leave"]'); s = wait_status(ps, 'info')
    check('left the waitlist' in s['text'] and not [w for w in rows() if w['user_id'] == uid] and ps.locator('#pl-form').count() == 1, 'Leave deletes the sign-up and brings the form back')
    submit(ps); ps.wait_for_selector('.pl-done .pl-status.ok', timeout=10000)
    mine = [w for w in rows() if w['user_id'] == uid]
    check(len(mine) == 1 and mine[0]['extras'] == [] and 'didn’t tick any extras' in ps.inner_text('.pl-done'), 'joining again with nothing ticked works')
    go(ps, '/settings/')
    pv = ps.inner_text('.acx-card:has(#acx-s8)')
    check('join the waitlist on the Plans page' in pv and 'only to tell you if the plan opens' in pv and ps.locator('.acx-card:has(#acx-s8) a[href="/plans/"]').count() == 1, 'Settings privacy says what the waitlist keeps and links to the Plans page')
    r = reply(ps, 'what data do you collect')
    check('waitlist on the Plans page' in r['text'], 'chat: the privacy answer mentions the waitlist too')
    # the table goes missing while signed in: the status check says so; the form stays usable
    MS['waitlist_mode'] = 'missing'
    go(ps, '/plans/'); plans_ready(ps)
    s = status(ps)
    check(s and 'isn’t open yet' in s['text'] and ps.locator('#pl-form [type=submit]').is_enabled(), f'signed in, table missing: it says so and the form stays ({s and s["text"][:60]})')
    submit(ps); s = wait_status(ps, 'err')
    check('isn’t open yet' in s['text'], 'joining then says it isn’t open yet')
    MS['waitlist_mode'] = 'ok'
    # deleting the account removes the sign-up
    go(ps, '/settings/'); ps.fill('#acx-del', 'DELETE')
    with ps.expect_navigation(timeout=20000): ps.click('[data-acx-act="delete-account"]')
    check(not [w for w in rows() if w['user_id'] == uid] and not any(u['id'] == uid for u in mstate()['users']), 'deleting the account removes the waitlist sign-up')
    check(any(w['email'] == 'reader@example.com' for w in rows()), 'guest sign-ups stay')
    S.close()

    # ---------- analytics: waitlist_join only with consent, never the email or the note ----------
    D = context(b, visitor=True, tz='America/Denver'); pd = D.new_page(); watch(pd, 'visitor')
    go(pd, '/plans/', V); plans_ready(pd)
    check(pd.evaluate('SML.trackOn') is True, 'visitor outside Europe: analytics on by default (as the rest of the site)')
    fill_form(pd, email='stats@example.com', extras=('review', 'coach'), note='secret words here'); submit(pd); wait_status(pd, 'ok')
    ev = pd.evaluate(EVS, 'waitlist_join')
    check([(e.get('label'), e.get('method')) for e in ev] == [('review,coach', 'email')], f'waitlist_join: the ticked extras’ ids (in the page’s order) and the method ({[(e.get("label"), e.get("method")) for e in ev]})')
    dl = pd.evaluate(DL)
    check('stats@example.com' not in dl and 'stats%40' not in dl and 'secret words' not in dl and '@example' not in dl, 'neither the email nor the note is in anything sent to analytics')
    allowed = {'event', 'label', 'method', 'page_type', 'content_id', 'content_title', 'course_name', 'track_name', 'connection', 'display_mode', 'lessons_done'}
    check(not (set(ev[0]) - allowed) if ev else False, f'no other fields in the event ({sorted(set(ev[0]) - allowed) if ev else ev})')
    pd.evaluate('SML.analytics.set(false)'); n = len(pd.evaluate(EVS, 'waitlist_join'))
    pd.click('[data-pl="again"]'); fill_form(pd, email='stats2@example.com'); submit(pd); wait_status(pd, 'ok')
    check(len(pd.evaluate(EVS, 'waitlist_join')) == n, 'after switching usage stats off in Settings, no waitlist_join is sent')
    D.close()
    E = context(b, visitor=True, tz='Europe/Paris'); pe = E.new_page(); watch(pe, 'europe')
    go(pe, '/plans/', V); plans_ready(pe); pe.wait_for_selector('#fb-consent', timeout=8000)
    fill_form(pe, email='eu@example.com', extras=('report',)); submit(pe); wait_status(pe, 'ok')
    check(not pe.evaluate(EVS, None), 'Europe, before any choice: joining sends nothing at all to analytics')
    pe.click('#fb-consent [data-c="yes"]'); pe.wait_for_timeout(300)
    pe.click('[data-pl="again"]'); fill_form(pe, email='eu2@example.com', extras=('report',)); submit(pe); wait_status(pe, 'ok')
    ev = pe.evaluate(EVS, 'waitlist_join')
    check(len(ev) == 1 and ev[0]['label'] == 'report' and ev[0]['method'] == 'email', f'Europe, after Allow: one waitlist_join ({ev})')
    E.close()

    # ---------- phone, 390 x 844 ----------
    P = context(b, 390, 844, phone=True); pp = P.new_page(); watch(pp, 'phone')
    go(pp, '/plans/'); plans_ready(pp)
    sw = pp.evaluate('document.documentElement.scrollWidth')
    wide = pp.evaluate("() => Array.from(document.querySelectorAll('#view *, footer.foot *')).filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > 391 || r.left < -1); }).slice(0, 3).map((e) => e.tagName + '.' + e.className)")
    check(sw <= 390 and not wide, f'phone: no sideways scrolling ({sw}, {wide})')
    cta = pp.locator('.pl-hcta a').bounding_box()
    check(cta and cta['height'] >= 44 and cta['y'] + cta['height'] < 844 and cta['x'] >= 15, f'phone: “Join the waitlist” is on the first screen, at least 44 px tall, inside the gutter ({cta})')
    boxes = [pp.locator(sel).bounding_box() for sel in ['#pl-form [type=submit]', '#pl-email']] + [l.bounding_box() for l in pp.locator('.pl-chk').all()]
    check(all(x and x['height'] >= 44 and x['x'] >= 15 and x['x'] + x['width'] <= 375 for x in boxes), f'phone: checkboxes, the email field and the button are at least 44 px tall and inside the 16 px gutters ({[round(x["height"]) for x in boxes if x]})')
    pp.evaluate('window.scrollTo(0, 0)'); pp.wait_for_timeout(100)
    pp.screenshot(path=os.path.join(SHOTS, 'plans-phone.png'), full_page=True)
    pp.screenshot(path=os.path.join(SHOTS, 'plans-phone-first-screen.png'))
    pp.locator('#pl-join').scroll_into_view_if_needed(); pp.wait_for_timeout(100)
    fill_form(pp, email='phone@example.com', extras=('report',)); submit(pp); wait_status(pp, 'ok')
    box_shot(pp, 'waitlist-guest-joined-phone.png')
    go(pp, '/'); open_chat(pp); chat_ask(pp, 'Is there a paid plan?'); pp.evaluate("document.activeElement.blur()")
    pp.screenshot(path=os.path.join(SHOTS, 'chat-plans-phone.png'))
    P.close()
    P2 = context(b, 390, 844, phone=True); pp = P2.new_page(); watch(pp, 'phone-signed-in')
    sign_up(pp, 'pat@example.com'); go(pp, '/plans/'); plans_ready(pp)
    pp.locator('#pl-join').scroll_into_view_if_needed(); fill_form(pp, extras=('coach', 'report')); submit(pp)
    pp.wait_for_selector('.pl-done .pl-status.ok', timeout=10000); pp.wait_for_timeout(100)
    check(pp.evaluate('document.documentElement.scrollWidth') <= 390, 'phone, signed in: no sideways scrolling after joining')
    box_shot(pp, 'waitlist-signed-in-on-phone.png')
    P2.close()

    # ---------- the claude.ai copy and a copy opened from disk: nothing collected ----------
    body = open(os.path.join(ROOT, 'build', 'fragment.html'), encoding='utf-8').read()
    prev = os.path.join(ROOT, 'build', 'plans-preview.html')
    open(prev, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + body + '</body></html>')
    FAKE = """(() => { const user = { me: async () => ({ id: 'u_1', name: 'Viewer' }), id: async () => 'u_1', isOwner: async () => false, can: async () => true, canEdit: async () => false, profiles: async () => ({}) };
      window.claude = { use: (n) => Promise.resolve(n === 'user' ? user : null) }; })();"""
    n_calls = len(MS['calls'])
    for label, init in [('claude', FAKE), ('disk', None)]:
        C = context(b, init=init); pc = C.new_page(); watch(pc, label)
        pc.goto('file://' + prev + '#plans'); pc.wait_for_function("() => window.SML && SML.plans && !document.getElementById('boot')", timeout=20000); pc.wait_for_timeout(400)
        away = pc.locator('.pl-away a')
        check(pc.evaluate('SML.plans.where()') == ('claude' if init else 'elsewhere') and pc.locator('#pl-form').count() == 0 and 'waitlist is on the FiredBunny website' in pc.inner_text('.pl-box')
              and away.get_attribute('href') == 'https://firedbunny.com/plans/' and away.get_attribute('target') == '_blank' and 'noopener' in away.get_attribute('rel'), f'{label} copy: no form; it points to firedbunny.com/plans (new tab, rel="noopener")')
        check(pc.evaluate("Array.from(document.querySelectorAll('footer.foot a')).some((a) => a.textContent.trim() === 'Plans' && a.getAttribute('href') === '#plans')"), f'{label} copy: the footer Plans link uses #plans')
        r = pc.evaluate("(async () => SML.plans.join({ email: 'x@example.com' }))()")
        check(r == {'ok': False, 'reason': 'elsewhere'}, f'{label} copy: SML.plans.join refuses ({r})')
        r = reply(pc, 'is there a paid plan')
        check(r['intent'] == 'plans' and 'firedbunny.com/plans' in r['text'], f'{label} copy: the chat says the waitlist is on the website')
        if init:
            pc.locator('#pl-join').scroll_into_view_if_needed(); pc.wait_for_timeout(100)
            pc.screenshot(path=os.path.join(SHOTS, 'claude-copy-plans.png'))
            pc.evaluate("location.hash = 'settings'"); pc.wait_for_timeout(500)
            check('waitlist' not in pc.inner_text('#view').lower(), 'claude.ai copy: Settings says nothing about a waitlist it does not have')
        C.close()
    check(len(MS['calls']) == n_calls, 'the copies sent nothing to the database')

    # ---------- pre-built page (after a full build) ----------
    pre = os.path.join(DIST, 'plans', 'index.html')
    if os.path.exists(pre) and '<div id="pre">' in open(pre, encoding='utf-8').read():
        d = open(pre, encoding='utf-8').read(); snap = d[d.find('<div id="pre">'):d.find('<div id="boot"')]
        check('<link rel="canonical" href="https://firedbunny.com/plans/">' in d and 'index, follow' in d and len(re.findall(r'<h1\b', snap)) == 1, 'pre-built /plans/: indexable, canonical, one h1')
        box = snap[snap.find('class="pl-box"') - 12:]
        check('class="pl-box" data-volatile' in snap and 'id="pl-form"' in snap and not re.search(r'<(input|textarea|select)\b[^>]*\bname=', box), 'pre-built /plans/: the guest form is there, data-volatile, with no named fields')
        sm = open(os.path.join(DIST, 'sitemap.xml'), encoding='utf-8').read()
        check('<loc>https://firedbunny.com/plans/</loc>' in sm, 'sitemap: /plans/ is in')
        lm = json.load(open(os.path.join(HERE, 'seo-lastmod.json'), encoding='utf-8'))
        check('/plans/' in lm, 'tools/seo-lastmod.json has /plans/ (commit it with the page)')
        pages = [f for f in glob.glob(os.path.join(DIST, '**', 'index.html'), recursive=True) if '<div id="pre">' in open(f, encoding='utf-8').read()]
        missing = [os.path.relpath(f, DIST) for f in pages if 'href="/plans/">Plans</a>' not in open(f, encoding='utf-8').read()]
        check(not missing, f'every pre-built page has the footer Plans link ({len(pages)} pages, {missing[:3]})')
        L = context(b); pl = L.new_page(); watch(pl, 'cls')
        pl.add_init_script("window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });")
        for w, h in [(1280, 900), (390, 844)]:
            pl.set_viewport_size({'width': w, 'height': h})
            go(pl, '/plans/'); pl.wait_for_timeout(600)
            cls = pl.evaluate('window.__cls')
            check(cls < 0.01, f'no layout shift at {w}px as the script takes over from the pre-built page (CLS {cls:.4f})')
        L.close()
    else:
        print('SKIP pre-built page checks (run a full python3 tools/build.py first)')

    errs = [e for e in ERRS if 'favicon' not in e and 'service worker' not in e.lower()]
    check(not errs, f'no script errors {errs[:4]}')
    b.close()
site.shutdown()
print(f"{counts['pass']} passed, {counts['fail']} failed")
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
