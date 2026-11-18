"""End-to-end test of the help chat ("Ask Bunny", src/chat.js + src/chat-data.js) and feedback (src/feedback.js).

Usage: python3 tools/build.py --no-prerender && python3 tools/chattest.py [--shots DIR]
(after a full build it also checks that no pre-built page contains the chat).
Serves dist/ like the Cloudflare deployment (tools/accounts/staticserver.py) and points the app at the stand-in
Supabase (tools/accounts/mock_supabase.py), so it needs no network. Covers: the launcher on home, lesson and tool
pages; opening and closing (button, Escape, X) with focus handling; the greeting and suggested replies; realistic
questions with typos and abbreviations, each checked against the page the answer links to; navigating from the chat
with the conversation kept (also across a reload); feedback end to end into the insert-only feedback table, a
signed-in note carrying the account, the "table missing" failure that keeps the note, and the About page form; a
390x844 phone with the audio mini player, update bar and analytics question showing (no overlap, no sideways scroll,
the sheet scrolls on its own and keeps focus inside); the claude.ai-style copy (hash addresses, copy and private
storage routes, the owner inbox); and no script errors. Screenshots (2x) go to shots/chat/ unless --shots is given.
Needs Playwright with Chromium."""
import glob, json, os, re, sys, threading, http.server, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'accounts'))
import staticserver, mock_supabase
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else os.path.join(ROOT, 'shots', 'chat')
os.makedirs(SHOTS, exist_ok=True)
SITE_PORT, MOCK_PORT = 8877, 8903
DIST = os.path.join(ROOT, 'dist')
site = http.server.ThreadingHTTPServer(('127.0.0.1', SITE_PORT), staticserver.handler(DIST))
threading.Thread(target=site.serve_forever, daemon=True).start()
mock_supabase.serve(MOCK_PORT)
B = f'http://127.0.0.1:{SITE_PORT}'
SB = 'https://fbtest.supabase.co'
ok = True
counts = {'pass': 0, 'fail': 0}
def check(c, msg):
    global ok
    ok &= bool(c); counts['pass' if c else 'fail'] += 1
    print(('PASS ' if c else 'FAIL ') + msg, flush=True)
def mstate():
    return json.loads(urllib.request.urlopen(f'http://127.0.0.1:{MOCK_PORT}/__state').read())

CFG = re.compile(r"window\.SML\.SUPABASE = \{[^}]*\};")
def inject(body):  # point the app at the stand-in project
    assert len(CFG.findall(body)) == 1, 'cloud-config line not found in the app script'
    return CFG.sub(lambda m: f"window.SML.SUPABASE = {{ url: '{SB}', key: 'sb_publishable_test', live: true }};", body)

ERRS = []
def watch(pg, label):
    pg.on('pageerror', lambda e: ERRS.append(f'{label}: {e}'))
    pg.on('console', lambda m: ERRS.append(f'{label} console: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)

def context(b, w=1280, h=860, phone=False, reduced=True, init=None):
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, service_workers='block', has_touch=phone, is_mobile=phone,
                        reduced_motion='reduce' if reduced else 'no-preference')
    def app(route):
        r = route.fetch(); route.fulfill(response=r, body=inject(r.text()))
    ctx.route('**/app.*.js', app)
    def sb(route):
        url = route.request.url.replace(SB, f'http://127.0.0.1:{MOCK_PORT}')
        route.fulfill(response=route.fetch(url=url, max_redirects=0, headers=dict(route.request.headers, **{'x-mock-origin': SB})))
    ctx.route(SB + '/**', sb)
    ctx.route('**/*googletagmanager*', lambda r: r.abort())
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    if init: ctx.add_init_script(init)
    return ctx

READY = "() => window.SML && SML.chat && SML.account && SML.account.status.ready && !document.getElementById('pre') && !document.getElementById('boot')"
def go(pg, path):
    pg.goto(B + path); pg.wait_for_function(READY, timeout=20000); pg.wait_for_timeout(250)

BOTS = "() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length"
def wait_reply(pg, n, timeout=8000):
    pg.wait_for_function(f"() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length > {n} && !document.querySelector('.fbc-typing')", timeout=timeout)
    pg.wait_for_timeout(60)
LAST = """() => { const ms = document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)'); const m = ms[ms.length - 1]; if (!m) return null;
  const pri = m.querySelector('.fbc-a.pri'); return { text: m.textContent.replace(/\\s+/g, ' ').trim(), pri: pri ? pri.getAttribute('href') : null,
  links: Array.from(m.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')), chips: Array.from(document.querySelectorAll('.fbc-chips .fbc-chip')).map((c) => c.textContent.trim()) }; }"""
def ask(pg, text):
    n = pg.evaluate(BOTS)
    pg.fill('#fbc-q', text); pg.press('#fbc-q', 'Enter')
    wait_reply(pg, n)
    return pg.evaluate(LAST)
def tap_chip(pg, label):
    n = pg.evaluate(BOTS)
    pg.locator('.fbc-chips .fbc-chip', has_text=label).first.click()
    wait_reply(pg, n)
    return pg.evaluate(LAST)
def path(pg, tok):
    return pg.evaluate('(t) => SML.routes.href(t)', tok)
def rect(pg, sel):
    return pg.evaluate("(s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }", sel)
def overlap(a, b):
    return bool(a and b and a['l'] < b['r'] and b['l'] < a['r'] and a['t'] < b['b'] and b['t'] < a['b'])
def open_chat(pg):
    pg.click('.fbc-launch'); pg.wait_for_selector('#fbc-panel:not([hidden]) .fbc-chip', timeout=8000)

# realistic questions: (message, page token the answer's main button must open, or a check on the reply)
QUESTIONS = [
    ('what is a covered call', 'l-covered-call', 'Covered call'),
    ('explain vwap', 'l-vwap', 'VWAP'),
    ('rsi oversold', 'l-rsi', None),
    ('roth ira vs 401k', ('l-trad-vs-roth', 'l-ira'), 'Roth IRA'),
    ('tlh', 'l-tax-loss', 'Tax-loss harvesting'),
    ('calculator for compound interest', 'tool-compound', 'Compound interest'),
    ('covred call', 'l-covered-call', 'I read that as'),
    ('whats theta', 'l-theta', None),
    ('vwpa', 'l-vwap', 'I read that as'),
    ('what is the 4% rule', 'l-swr', None),
    ('retirment calculator', 'tool-retire', None),
    ('mortgage calculator', 'tool-mortgage', None),
    ('pdh', 'l-levels', 'Previous day high'),
    ('explain the wash sale rule', 'l-wash-sale', None),
    ('hsa', 'l-hsa', None),
    ('cash secured put', 'l-cash-secured-put', 'Cash-secured put'),
    ('13 48 200 ema', 'l-ema-stack', None),
    ('day trading vs swing trading', 'l-styles', 'Swing trading'),
    ('what does dte mean', 'l-contracts', 'Expiration'),
    ('explain the greeks', 'l-delta-gamma', None),
    ('is this free', 'about', 'no paywall'),
    ('how do i delete my data', 'settings', 'Delete everything'),
    ('who made this', 'about', 'pen name'),
    ('is this financial advice', 'l-stock-picking', 'education only'),
    ('how do i sign in', 'signin', 'free FiredBunny account'),
    ('when is the next fed meeting', 'calendar', 'FOMC'),
    ('should i buy or rent', 'l-rent-vs-buy', None),
    ('can i use this offline', 'offline', None),
]

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------- desktop: launcher, open/close, focus ----------
    D = context(b); pd = D.new_page(); watch(pd, 'desktop')
    for pth, label in [('/', 'home'), ('/lessons/wheel-strategy/', 'lesson'), ('/tools/compound-interest/', 'tool')]:
        go(pd, pth)
        r = rect(pd, '.fbc-launch')
        check(r and r['w'] >= 44 and r['h'] >= 44 and r['r'] <= 1280 and r['b'] <= 860 and pd.is_visible('.fbc-launch'), f'launcher visible bottom-right on the {label} page ({r and round(r["l"])},{r and round(r["t"])})')
    check(pd.get_attribute('.fbc-launch', 'aria-expanded') == 'false' and pd.get_attribute('.fbc-launch', 'aria-controls') == 'fbc-panel' and bool(pd.get_attribute('.fbc-launch', 'aria-label')), 'launcher has aria-expanded, aria-controls and a label')
    check(pd.evaluate("!document.querySelector('#fbc-panel .fbc-log') && !document.querySelector('style[data-fb=\"chat-panel\"]')"), 'the panel and its styles are not built until the first open')
    raw = urllib.request.urlopen(B + '/').read().decode('utf-8')
    check('fbc-launch' not in raw and 'fbc-panel' not in raw, 'the served home page HTML does not contain the chat (added at runtime)')
    go(pd, '/lessons/wheel-strategy/')
    pd.screenshot(path=os.path.join(SHOTS, 'chat-desktop-closed.png'))
    open_chat(pd)
    check(pd.evaluate("document.getElementById('fbc-panel').getAttribute('role') === 'dialog' && document.getElementById('fbc-title').textContent === 'Ask Bunny' && document.getElementById('fbc-panel').getAttribute('aria-labelledby') === 'fbc-title'"), 'panel is a labelled dialog')
    check(pd.get_attribute('.fbc-launch', 'aria-expanded') == 'true', 'launcher says expanded while open')
    pd.wait_for_timeout(100)
    check(pd.evaluate("document.getElementById('fbc-panel').contains(document.activeElement)"), f'focus moves into the panel on open ({pd.evaluate("document.activeElement.id || document.activeElement.className")})')
    greet = pd.evaluate(LAST)
    check(greet and 'Bunny' in greet['text'] and 'pass a note' in greet['text'], 'greeting from Bunny')
    check(greet and greet['chips'] == ['Find a lesson', 'Explain a term', 'Which tool should I use?', 'Where do I start?', 'Send feedback'], f'quick replies offered ({greet and greet["chips"]})')
    check(pd.evaluate("!!document.querySelector('#fbc-panel [aria-live=\"polite\"]') && document.querySelector('#fbc-panel [aria-live=\"polite\"]').textContent.includes('Bunny')"), 'bot messages are announced in a polite live region')
    p0 = rect(pd, '#fbc-panel')
    check(p0 and 360 <= p0['w'] <= 400 and p0['r'] <= 1280 - 12 and p0['b'] < rect(pd, '.fbc-launch')['t'], f'desktop panel is a ~380px card above the launcher ({p0 and round(p0["w"])}px)')
    pd.keyboard.press('Escape'); pd.wait_for_timeout(100)
    check(pd.evaluate("document.getElementById('fbc-panel').hidden") and pd.evaluate("document.activeElement.classList.contains('fbc-launch')"), 'Escape closes the panel and returns focus to the launcher')
    pd.keyboard.press('Enter'); pd.wait_for_timeout(200)
    check(not pd.evaluate("document.getElementById('fbc-panel').hidden"), 'the launcher opens the panel from the keyboard')
    pd.click('[data-fbc="close"]'); pd.wait_for_timeout(100)
    check(pd.evaluate("document.getElementById('fbc-panel').hidden && document.activeElement.classList.contains('fbc-launch')"), 'the X closes the panel and returns focus to the launcher')
    open_chat(pd); pd.click('.fbc-launch'); pd.wait_for_timeout(100)
    check(pd.evaluate("document.getElementById('fbc-panel').hidden"), 'the launcher closes it again')
    open_chat(pd)
    chips = pd.evaluate("Array.from(document.querySelectorAll('.fbc-chip')).map((c) => c.tagName + ':' + c.type)")
    check(chips and all(c == 'BUTTON:button' for c in chips), 'suggested replies are real buttons (keyboard reachable)')

    # ---------- questions ----------
    for q, want, txt in QUESTIONS:
        r = ask(pd, q)
        wants = want if isinstance(want, tuple) else (want,)
        hrefs = [path(pd, t) for t in wants]
        good = r and r['pri'] in hrefs and (txt is None or txt.lower() in r['text'].lower())
        check(good, f'“{q}” -> {r and r["pri"]} {"" if good else "(wanted " + "/".join(hrefs) + ")  " + (r["text"][:120] if r else "")}')
    r = ask(pd, 'where do i start')
    check(r and 'three tracks' in r['text'] and any(c.startswith('Trading') for c in r['chips']) and 'Not sure yet' in r['chips'], '“where do i start” offers the three tracks')
    r = tap_chip(pd, 'Retirement & Wealth')
    check(r and r['pri'] and 'Start: ' in r['text'] or (r and 'Continue' in r['text']), f'picking a track gives its first lesson ({r and r["pri"]})')
    r = ask(pd, 'xqzv blorpt flimflam')
    check(r and 'couldn’t find' in r['text'] and 'Send this as a question' in r['chips'] and any(c.startswith('Search all lessons') for c in r['chips']), 'gibberish gets a graceful fallback (search all lessons, or send as a question)')
    r = ask(pd, 'what is a covered call'); r2 = tap_chip(pd, 'Tell me more')
    check(r2 and 'Key takeaways' in r2['text'] and r2['pri'] == path(pd, 'l-covered-call'), 'follow-up “Tell me more” gives the lesson’s takeaways')
    r = tap_chip(pd, 'Explain a term')
    check(r and 'glossary has' in r['text'], 'chip “Explain a term” asks which word')
    r = ask(pd, 'theta')
    check(r and r['pri'] == path(pd, 'l-theta'), 'after “Explain a term”, a bare word is explained')
    tap_chip(pd, 'Something else'); r = tap_chip(pd, 'Which tool should I use?')
    check(r and 'Options and the wheel' in r['chips'], 'chip “Which tool should I use?” lists areas')
    r = tap_chip(pd, 'Options and the wheel')
    check(r and path(pd, 'tool-wheel') in r['links'], 'an area lists its tools as links')
    pd.screenshot(path=os.path.join(SHOTS, 'chat-desktop-tools.png'))
    r = ask(pd, 'what is a covered call')
    pd.screenshot(path=os.path.join(SHOTS, 'chat-desktop-answer.png'))

    # ---------- navigating from the chat ----------
    before = pd.evaluate("document.querySelectorAll('.fbc-m').length")
    r = ask(pd, 'explain vwap')
    pd.locator('.fbc-m.bot').last.locator('.fbc-a.pri').click()
    pd.wait_for_function("location.pathname === '/lessons/vwap/'", timeout=8000); pd.wait_for_timeout(300)
    check(pd.inner_text('#view h1').strip().upper() == 'VWAP', 'a link in the answer opens the lesson')
    check(not pd.evaluate("document.getElementById('fbc-panel').hidden") and pd.evaluate("document.querySelectorAll('.fbc-m').length") >= before + 2, 'on desktop the chat stays open with its history')
    r = ask(pd, 'take me to the wheel strategy')
    pd.wait_for_function("location.pathname === '/lessons/wheel-strategy/'", timeout=8000)
    check(True, '“take me to the wheel strategy” goes to the lesson')
    r = ask(pd, 'open the glossary'); pd.wait_for_function("location.pathname === '/glossary/'", timeout=8000)
    check(True, '“open the glossary” goes to the glossary')
    n_msgs = pd.evaluate("document.querySelectorAll('.fbc-m').length")
    last_before = pd.evaluate("JSON.parse(sessionStorage.getItem('fb-chat')).msgs.slice(-1)[0]")
    go(pd, '/tools/')
    open_chat(pd)
    check(pd.evaluate("document.querySelectorAll('.fbc-m').length") == min(n_msgs, 80) and pd.evaluate("JSON.parse(sessionStorage.getItem('fb-chat')).msgs.slice(-1)[0]") == last_before, f'after a full reload the conversation is restored from this tab (the last {min(n_msgs, 80)} messages)')
    check(pd.evaluate("Object.keys(localStorage).every((k) => !k.includes('chat'))"), 'the conversation is not kept in localStorage (tab only)')
    # search all lessons from a fallback
    ask(pd, 'xqzv blorpt flimflam'); pd.locator('.fbc-chip', has_text='Search all lessons').click()
    pd.wait_for_function("location.pathname === '/learn/' && document.getElementById('learn-q') && document.getElementById('learn-q').value === 'xqzv blorpt flimflam'", timeout=8000)
    check(True, '“Search all lessons” opens the lessons page with the words in its search box')

    # ---------- feedback into the stand-in Supabase ----------
    go(pd, '/lessons/wheel-strategy/'); open_chat(pd)
    pd.click('[data-fbc="restart"]'); pd.wait_for_selector('.fbc-chip')
    r = tap_chip(pd, 'Send feedback')
    check(r and 'What kind' in r['text'] and r['chips'][:5] == ['Idea', 'Something to improve', 'Correct an inaccuracy', 'Question', 'Other'], 'feedback asks for the kind first')
    r = tap_chip(pd, 'Correct an inaccuracy')
    check(r and 'where did you see' in r['text'], 'then for the message')
    r = ask(pd, 'The 2026 IRA limit in the takeaways looks out of date.')
    check(r and 'optional' in r['text'] and 'only to answer you' in r['text'] and 'No email, thanks' in r['chips'], 'then offers an optional email, used only to reply')
    r = ask(pd, 'reader@nowhere')
    check(r and 'doesn’t look like an email' in r['text'], 'a malformed email is caught')
    r = ask(pd, 'reader@example.com')
    check(r and '/lessons/wheel-strategy/' in r['text'] and 'reader@example.com' in r['text'] and 'What gets sent' in r['text'] and 'browser type' in r['text'], 'the confirmation shows the note, page, email and exactly what is sent')
    pd.screenshot(path=os.path.join(SHOTS, 'chat-feedback-confirm.png'))
    r = tap_chip(pd, 'Send it')
    rows = mstate()['feedback']
    check(r and 'Sent' in r['text'] and len(rows) == 1, f'the note is sent ({r and r["text"][:60]})')
    f = rows[-1] if rows else {}
    check(f.get('kind') == 'Correct an inaccuracy' and 'IRA limit' in (f.get('message') or '') and f.get('email') == 'reader@example.com' and f.get('page') == '/lessons/wheel-strategy/' and f.get('source') == 'chat', 'stored with kind, message, email, page and source')
    check(f.get('user_id') is None and f.get('status') == 'new' and 'Chrome' in (f.get('user_agent') or '') and f.get('id'), 'a guest’s note has no account; the server sets id and status; browser type kept')
    check(all('return=representation' not in pr for pr in mock_supabase.STATE['feedback_prefer']), 'the insert asks nothing back (visitors cannot read the table)')
    check(pd.evaluate("[...document.scripts].some((s) => s.src.includes('/vendor/supabase-js'))"), 'the Supabase library loads only when sending')
    # the table is missing (schema not run yet): the note is kept, and can be sent once it exists
    mock_supabase.STATE['feedback_mode'] = 'missing'
    r = ask(pd, 'The theta lesson has a typo in the second paragraph')
    check(r and 'Something to improve' in r['text'], 'a message that reports a problem starts a note with the kind guessed')
    ask(pd, 'In "How it works", decay is spelled "decya".'); tap_chip(pd, 'No email, thanks'); r = tap_chip(pd, 'Send it')
    check(r and 'didn’t go through' in r['text'] and 'nothing is lost' in r['text'] and 'Try again' in r['chips'] and 'Copy my note' in r['chips'], 'when the table is missing it says so gracefully and offers Try again / Copy')
    check(len(mstate()['feedback']) == 1, 'nothing half-stored')
    go(pd, '/lessons/theta/'); open_chat(pd)
    r = pd.evaluate(LAST)
    check(r and 'Try again' in r['chips'] and pd.evaluate("JSON.parse(sessionStorage.getItem('fb-chat')).fb.message.includes('decya')"), 'the unsent note survives a reload')
    mock_supabase.STATE['feedback_mode'] = 'ok'
    r = tap_chip(pd, 'Try again')
    rows = mstate()['feedback']
    check(r and 'Sent' in r['text'] and len(rows) == 2 and 'decya' in rows[-1]['message'] and rows[-1]['email'] is None, 'Try again sends it once the table exists')
    # the database's rules as the browser sees them
    res = pd.evaluate("""async () => { const c = await SML.cloud.feedbackClient(); const a = await c.from('feedback').select('*');
      const b = await c.from('feedback').insert({ kind: 'Idea', message: 'spoof', user_id: '00000000-0000-0000-0000-000000000000' });
      const d = await c.from('feedback').insert({ kind: 'Idea', message: 'read back' }).select();
      const e = await c.from('feedback').delete().eq('kind', 'Idea');
      return [a.error && a.error.code, b.error && b.error.code, d.error && d.error.code, e.error && e.error.code]; }""")
    check(res == ['42501', '42501', '42501', '42501'], f'visitors cannot read, set the account, read back or delete ({res})')
    # signed in: the note carries the account (filled by the database from the session)
    mock_supabase.STATE['confirm'] = False
    S = context(b); ps = S.new_page(); watch(ps, 'signed-in')
    go(ps, '/signin/'); ps.fill('#au-email', 'sam@example.com'); ps.fill('#au-pw', 'a long enough pass'); ps.click('form[data-auth="signup"] button[type=submit]')
    ps.wait_for_selector('[data-auth-act="signout"]', timeout=20000)
    go(ps, '/'); open_chat(ps); tap_chip(ps, 'Send feedback'); tap_chip(ps, 'Idea'); ask(ps, 'A lesson on I bonds would be great.')
    r = tap_chip(ps, 'No email, thanks')
    check(r and 'account id' in r['text'], 'signed in, the confirmation says the account id is sent')
    tap_chip(ps, 'Send it')
    uid = next(u['id'] for u in mstate()['users'] if u['email'] == 'sam@example.com')
    check(mstate()['feedback'][-1]['user_id'] == uid and mstate()['feedback'][-1]['page'] == '/', 'a signed-in person’s note carries their account id')
    S.close(); mock_supabase.STATE['confirm'] = True
    # the About page form sends to the same table
    go(pd, '/about/')
    check('Goes to the person who runs FiredBunny' in pd.inner_text('.ab-route') and 'browser type' in pd.inner_text('.ab-privacy'), 'the About form says where notes go and what is sent')
    pd.fill('.ab-form textarea', 'Please add a lesson on bond ladders.'); pd.fill('.ab-form [name="email"]', 'pat@example.com')
    pd.click('.ab-form button[type="submit"]'); pd.wait_for_selector('.ab-status.ok', timeout=8000)
    f = mstate()['feedback'][-1]
    check(f['source'] == 'about' and f['email'] == 'pat@example.com' and f['kind'] == 'Idea' and 'bond ladders' in f['message'], 'the About form sends to the feedback table on the website')
    mock_supabase.STATE['feedback_mode'] = 'missing'
    pd.fill('.ab-form textarea', 'This one will not go through.'); pd.click('.ab-form button[type="submit"]'); pd.wait_for_selector('.ab-status.err', timeout=8000)
    check(pd.input_value('.ab-form textarea') == 'This one will not go through.', 'when sending fails the About form keeps the message')
    mock_supabase.STATE['feedback_mode'] = 'ok'
    D.close()

    # ---------- typing indicator (motion allowed) ----------
    M = context(b, reduced=False); pm = M.new_page(); watch(pm, 'motion')
    go(pm, '/'); open_chat(pm)
    n = pm.evaluate(BOTS); pm.fill('#fbc-q', 'explain vwap'); pm.press('#fbc-q', 'Enter')
    pm.wait_for_selector('.fbc-typing', timeout=3000)
    check(True, 'a short typing indicator shows before the reply')
    wait_reply(pm, n)
    check(not pm.query_selector('.fbc-typing') and 'VWAP' in pm.evaluate(LAST)['text'], 'then the reply replaces it')
    M.close()

    # ---------- phone 390x844 ----------
    P = context(b, 390, 844, phone=True); pp = P.new_page(); watch(pp, 'phone')
    go(pp, '/lessons/wheel-strategy/')
    l0 = rect(pp, '.fbc-launch')
    check(l0 and l0['r'] <= 390 - 12 and l0['b'] <= 844 - 12, 'phone: launcher sits in the bottom-right corner')
    # the other things at the bottom of the screen: audio mini player, update bar, analytics question
    pp.evaluate("""() => { document.querySelector('.nar-mini').classList.add('show');
      const c = document.createElement('div'); c.id = 'fb-consent'; c.className = 'fb-consent'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Analytics');
      c.innerHTML = '<p><b>Help make FiredBunny better?</b> Allow Google Analytics to count visits and see which lessons, tools and audio people use. Your profile, goals and money figures are never sent. You can change this any time in Settings.</p><div class="row"><button type="button" class="btn btn-p sm">Allow</button><button type="button" class="btn btn-g sm">No thanks</button></div>';
      document.body.appendChild(c); }""")
    pp.wait_for_timeout(500)
    l1, nar, con = rect(pp, '.fbc-launch'), rect(pp, '.nar-mini'), rect(pp, '#fb-consent')
    check(not overlap(l1, nar) and not overlap(l1, con) and l1['t'] >= 0, f'phone: with the mini player and analytics question showing, the launcher sits above them (launcher top {round(l1["t"])}, banner top {round(con["t"])})')
    pp.screenshot(path=os.path.join(SHOTS, 'chat-phone-bottom-bars.png'))
    pp.evaluate("() => document.getElementById('fb-consent').remove()"); pp.wait_for_timeout(300)
    l2 = rect(pp, '.fbc-launch'); nar = rect(pp, '.nar-mini')
    check(not overlap(l2, nar) and l2['b'] <= nar['t'], 'phone: with just the mini player, the launcher sits right above it')
    pp.evaluate("""() => { const d = document.createElement('div'); d.id = 'fb-upd'; d.className = 'fb-upd'; d.setAttribute('role', 'status'); d.innerHTML = '<span>A new version of FiredBunny is ready.</span><button type="button" class="btn btn-p sm">Reload</button><button type="button" class="fb-upd-x" aria-label="Later">×</button>'; document.body.appendChild(d); document.querySelector('.nar-mini').classList.remove('show'); }""")
    pp.wait_for_timeout(400)
    check(not overlap(rect(pp, '.fbc-launch'), rect(pp, '#fb-upd')), 'phone: with the update bar, the launcher sits above it')
    pp.evaluate("() => document.getElementById('fb-upd').remove()"); pp.wait_for_timeout(300)
    check(rect(pp, '.fbc-launch')['b'] > 780, 'phone: and it drops back down when they go')
    check(pp.evaluate("document.documentElement.scrollWidth") <= 390, 'phone: no sideways scrolling')
    # the self-assessment's sticky Back/Next bar
    go(pp, '/investor-assessment/')
    pp.evaluate("() => { const f = document.querySelector('.asq-foot'); if (f) f.scrollIntoView({ block: 'end' }); window.scrollBy(0, -200); }"); pp.wait_for_timeout(400)
    foot = rect(pp, '.asq-foot')
    check(foot and not overlap(rect(pp, '.fbc-launch'), foot), 'phone: the launcher stays clear of the assessment’s Back/Next bar')
    # the sheet
    go(pp, '/lessons/wheel-strategy/')
    y0 = pp.evaluate('window.scrollY')
    pp.tap('.fbc-launch'); pp.wait_for_selector('#fbc-panel:not([hidden]) .fbc-chip', timeout=8000); pp.wait_for_timeout(150)
    sh = rect(pp, '#fbc-panel')
    check(sh and sh['t'] <= 24 and abs(sh['b'] - 844) <= 1 and sh['w'] >= 389, f'phone: the panel opens as a near-full-height sheet (top {sh and round(sh["t"])})')
    check(pp.get_attribute('#fbc-panel', 'aria-modal') == 'true' and pp.evaluate("getComputedStyle(document.documentElement).overflow") == 'hidden', 'phone: the sheet is modal and the page behind it is locked')
    check(pp.evaluate("document.getElementById('fbc-panel').contains(document.activeElement)"), 'phone: focus is inside the sheet')
    hs = pp.evaluate("Array.from(document.querySelectorAll('.fbc-chip, .fbc-ib, .fbc-send')).map((e) => Math.round(e.getBoundingClientRect().height))")
    check(hs and min(hs) >= 44, f'phone: touch targets are at least 44px ({min(hs) if hs else None})')
    for q in ['what is a covered call', 'roth ira vs 401k', 'explain the greeks', 'how do i delete my data']:
        ask(pp, q)
    pp.evaluate("document.activeElement.blur()")
    pp.screenshot(path=os.path.join(SHOTS, 'chat-phone-sheet.png'))
    sc = pp.evaluate("() => { const l = document.querySelector('.fbc-log'); return { sh: l.scrollHeight, ch: l.clientHeight, top: l.scrollTop }; }")
    check(sc['sh'] > sc['ch'] * 1.5, 'phone: a long conversation scrolls inside the sheet')
    pp.mouse.move(195, 400)
    try: pp.mouse.wheel(0, -600)
    except Exception: pp.evaluate("document.querySelector('.fbc-log').scrollBy(0, -600)")
    pp.wait_for_timeout(400)
    check(pp.evaluate("document.querySelector('.fbc-log').scrollTop") < sc['top'] and pp.evaluate('window.scrollY') == y0, 'phone: scrolling moves the conversation, not the page behind')
    inside = True
    for i in range(30):
        pp.keyboard.press('Tab')
        if not pp.evaluate("document.getElementById('fbc-panel').contains(document.activeElement)"): inside = False; break
    check(inside, 'phone: Tab stays inside the open sheet')
    pp.locator('.fbc-m.bot').last.locator('.fbc-a.pri').click(); pp.wait_for_timeout(500)
    check(pp.evaluate("document.getElementById('fbc-panel').hidden && location.pathname === '/settings/'") and pp.evaluate("getComputedStyle(document.documentElement).overflow") != 'hidden', 'phone: a link in the sheet opens the page and closes the sheet')
    check(pp.evaluate("document.documentElement.scrollWidth") <= 390, 'phone: still no sideways scrolling')
    P.close()

    # ---------- claude.ai-style copy (hash addresses) ----------
    body = open(os.path.join(ROOT, 'build', 'fragment.html'), encoding='utf-8').read()
    prev = os.path.join(ROOT, 'build', 'chat-preview.html')
    open(prev, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + body + '</body></html>')
    H = context(b); ph = H.new_page(); watch(ph, 'hash')
    ph.goto('file://' + prev); ph.wait_for_function("() => window.SML && SML.chat && !document.getElementById('boot')", timeout=20000)
    check(ph.evaluate("SML.routes.mode") == 'hash' and ph.is_visible('.fbc-launch'), 'hash mode: the launcher is there')
    open_chat(ph)
    r = ask(ph, 'explain vwap')
    check(r and r['pri'] == '#l-vwap', 'hash mode: answers link with #tokens')
    ph.locator('.fbc-m.bot').last.locator('.fbc-a.pri').click(); ph.wait_for_function("location.hash === '#l-vwap'", timeout=5000); ph.wait_for_timeout(300)
    check(ph.inner_text('#view h1').strip().upper() == 'VWAP' and not ph.evaluate("document.getElementById('fbc-panel').hidden"), 'hash mode: the link opens the lesson and the chat stays')
    r = ask(ph, 'take me to the glossary'); ph.wait_for_function("location.hash === '#glossary'", timeout=5000)
    check(True, 'hash mode: “take me to the glossary” navigates')
    tap_chip(ph, 'Something else'); tap_chip(ph, 'Send feedback'); tap_chip(ph, 'Idea'); ask(ph, 'More on bonds, please.')
    r = tap_chip(ph, 'No email, thanks')
    check(r and 'Nothing is sent or stored' in r['text'] and 'Copy my note' in r['chips'], 'a copy with no way to send says so and offers to copy')
    r = tap_chip(ph, 'Copy my note')
    check(r and 'Copied' in r['text'], 'and copies the note')
    H.close()
    FAKE = """(() => { const store = {}; const snap = (p) => ({ id: p.split('/').pop(), exists: p in store, data: () => store[p] ? JSON.parse(JSON.stringify(store[p])) : undefined });
      const doc = (p) => ({ id: p.split('/').pop(), get: async () => snap(p), set: async (d) => { store[p] = JSON.parse(JSON.stringify(d)); }, update: async (d) => { Object.assign(store[p], d); } });
      const col = (p) => ({ doc: (id) => doc(p + '/' + id), onSnapshot: (cb) => { const t = () => cb({ docs: Object.keys(store).filter((k) => k.startsWith(p + '/')).map(snap) }); t(); const iv = setInterval(t, 300); return () => clearInterval(iv); },
        orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }), get: async () => ({ docs: [] }) });
      const user = { me: async () => ({ id: 'u_owner', name: 'Owner', isOwner: true }), id: async () => 'u_owner', isOwner: async () => true, can: async () => true, canEdit: async () => true, profiles: async () => ({}) };
      const db = { doc, collection: col };
      window.__fakeStore = store;
      window.claude = { use: (n) => Promise.resolve(n === 'user' ? user : n === 'db' ? db : null) }; })();"""
    C = context(b, init=FAKE); pc = C.new_page(); watch(pc, 'claude')
    pc.goto('file://' + prev); pc.wait_for_function("() => window.SML && SML.chat && SML.host === 'claude' && !document.getElementById('boot')", timeout=20000)
    open_chat(pc); tap_chip(pc, 'Send feedback'); tap_chip(pc, 'Question'); ask(pc, 'Does the wheel work in an IRA?')
    r = tap_chip(pc, 'No email, thanks')
    check(r and 'account id that keeps your notes together' in r['text'], 'claude.ai: the confirmation describes private storage')
    r = tap_chip(pc, 'Send it')
    entries = pc.evaluate("(window.__fakeStore['feedback/u_owner'] || {}).entries || []")
    check(r and 'Sent' in r['text'] and entries and entries[-1]['source'] == 'chat' and entries[-1]['kind'] == 'Question' and 'IRA' in entries[-1]['message'], 'claude.ai: the note goes to the page’s private storage, like the About form')
    pc.evaluate("location.hash = 'about'"); pc.wait_for_selector('#ab-inbox-sec:not([hidden]) .ab-ilist li', timeout=8000)
    check('Does the wheel work in an IRA?' in pc.inner_text('#ab-inbox-sec') and 'help chat' in pc.inner_text('#ab-inbox-sec'), 'claude.ai: the owner’s feedback inbox shows the chat note')
    C.close()

    # ---------- pre-built pages stay free of the chat ----------
    pages = glob.glob(os.path.join(DIST, '**', 'index.html'), recursive=True)
    dirty = [f for f in pages if re.search(r'fbc-launch|fbc-panel|data-fb="chat', open(f, encoding='utf-8').read())]
    check(not dirty, f'no pre-built page contains the chat ({len(pages)} pages checked)')

    errs = [e for e in ERRS if 'favicon' not in e]
    check(not errs, f'no script errors {errs[:4]}')
    b.close()
print(f"{counts['pass']} passed, {counts['fail']} failed")
print('ALL PASSED' if ok else 'SOME FAILED')
sys.exit(0 if ok else 1)
