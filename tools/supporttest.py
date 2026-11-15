"""End-to-end test of "Support FiredBunny" (src/mod-y-support.js, src/support-config.js, the footer link, the About line,
the help chat's support and free replies) without any network.

Usage: python3 tools/build.py --no-prerender && python3 tools/supporttest.py [--shots DIR]
(after a full build it also checks the pre-built pages and the sitemap).
Serves dist/ like the Cloudflare deployment (tools/accounts/staticserver.py). Payment links are never committed for the
test: the app script is rewritten in flight (as tools/chattest.py does for Supabase) with a test-mode link, and
buy.stripe.com / billing.stripe.com are answered by a local stand-in page. Accounts are switched off in flight, so no
request leaves the machine. Covers: no test-mode link committed; everything hidden with no link; buttons, footer link and About
line with a test link (new tab, rel="noopener", the exact Stripe address opened); the monthly button needing the
customer-portal link; refused addresses (http, other hosts, look-alikes, donate.stripe.com, credentials, ports, no id);
support links never inside lessons, tools or the Portfolio page; no dialogs; the page text the lastmod hash reads
(tools/prerender.py) is the same with and without a link; the support_click event only with analytics consent, never
with an amount; the help chat's support intent, the free reply in both states and phrasings that must still reach
their lessons; a 390x844 phone; /support/thanks/ (says thank you, claims nothing, noindex); the claude.ai copy (no
payment buttons, points to the website); no script errors. Screenshots (2x) go to shots/support/ unless --shots is given.
Needs Playwright with Chromium."""
import glob, hashlib, json, os, re, sys, threading, http.server
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'accounts')); sys.path.insert(0, HERE)
import staticserver
from prerender import SNAPSHOT_JS
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else os.path.join(ROOT, 'shots', 'support')
os.makedirs(SHOTS, exist_ok=True)
PORT = 8886
DIST = os.path.join(ROOT, 'dist')
class Server(http.server.ThreadingHTTPServer):
    def handle_error(self, request, client_address):  # a tab closed mid-transfer (the Stripe stand-in pop-ups) is not an error
        if isinstance(sys.exc_info()[1], (ConnectionResetError, BrokenPipeError)): return
        super().handle_error(request, client_address)
site = Server(('127.0.0.1', PORT), staticserver.handler(DIST))
threading.Thread(target=site.serve_forever, daemon=True).start()
B = f'http://127.0.0.1:{PORT}'
V = 'http://firedbunny.test'  # a "real visitor" host (mapped to the local server), so analytics is not switched off as local
ok = True
counts = {'pass': 0, 'fail': 0}
def check(c, msg):
    global ok
    ok &= bool(c); counts['pass' if c else 'fail'] += 1
    print(('PASS ' if c else 'FAIL ') + msg, flush=True)

ONCE = 'https://buy.stripe.com/test_00example0once'
MONTHLY = 'https://buy.stripe.com/test_00example0month'
MANAGE = 'https://billing.stripe.com/p/login/test_00example0portal'
TEST = {'once': ONCE, 'monthly': MONTHLY, 'manage': MANAGE}
NONE = {'once': '', 'monthly': '', 'manage': ''}
SHIPPED = open(os.path.join(ROOT, 'src', 'support-config.js'), encoding='utf-8').read()
SHIPPED_EMPTY = "once: '', monthly: '', manage: ''" in SHIPPED

SUP = re.compile(r"window\.SML\.SUPPORT = \{ links: \{[^}]*\} \};")
SB = re.compile(r"window\.SML\.SUPABASE = \{[^}]*\};")
def inject(body, links):
    assert len(SUP.findall(body)) == 1, 'support-config line not found in the app script'
    if links is not None:
        body = SUP.sub(lambda m: 'window.SML.SUPPORT = { links: ' + json.dumps(links) + ' };', body)
    return SB.sub(lambda m: "window.SML.SUPABASE = { url: '', key: '', live: false };", body)  # no accounts, no network

ERRS, WARNS = [], []
def watch(pg, label):
    pg.on('pageerror', lambda e: ERRS.append(f'{label}: {e}'))
    def con(m):
        if m.type == 'error' and 'Failed to load resource' not in m.text: ERRS.append(f'{label} console: {m.text}')
        if m.type == 'warning' and '[FiredBunny] support' in m.text: WARNS.append(f'{label}: {m.text}')
    pg.on('console', con)

STRIPE_HITS = []
HIDE = "Object.defineProperty(navigator, 'webdriver', { get: () => false });"
def context(b, links=None, w=1280, h=900, phone=False, tz=None, visitor=False, init=None):
    ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, service_workers='block', has_touch=phone, is_mobile=phone,
                        reduced_motion='reduce', timezone_id=tz or 'America/Denver')
    def app(route):
        r = route.fetch(url=route.request.url.replace(V, B))  # fetched outside the browser, where firedbunny.test is not mapped
        route.fulfill(response=r, body=inject(r.text(), links))
    ctx.route('**/app.*.js', app)
    def stripe(route):
        STRIPE_HITS.append(route.request.url)
        route.fulfill(status=200, content_type='text/html', body='<!doctype html><title>Stripe stand-in</title><p>Stand-in for a Stripe page (test).</p>')
    ctx.route('https://buy.stripe.com/**', stripe); ctx.route('https://billing.stripe.com/**', stripe); ctx.route('https://donate.stripe.com/**', stripe)
    ctx.route('**/*googletagmanager*', lambda r: r.abort())
    ctx.route('**/fonts.googleapis.com/**', lambda r: r.abort()); ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
    if visitor: ctx.add_init_script(HIDE)
    if init: ctx.add_init_script(init)
    return ctx

READY = "() => window.SML && SML.chat && SML.support && !document.getElementById('pre') && !document.getElementById('boot')"
def go(pg, path, base=B):
    pg.goto(base + path); pg.wait_for_function(READY, timeout=20000); pg.wait_for_timeout(250)
STRIPE_A = "() => Array.from(document.querySelectorAll('a[href*=\"stripe.com\"]')).map((a) => a.getAttribute('href'))"
FOOT = "() => Array.from(document.querySelectorAll('footer.foot a')).filter((a) => /support/i.test(a.textContent) || a.dataset.supportPlace).map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim(), place: a.dataset.supportPlace || '' }))"
ABOUT_LINE = "() => Array.from(document.querySelectorAll('.ab-facts li')).filter((l) => l.querySelector('[data-support-place]')).map((l) => ({ text: l.textContent.trim(), volatile: l.hasAttribute('data-volatile'), href: l.querySelector('a').getAttribute('href') }))"
DIALOGS = "() => Array.from(document.querySelectorAll('[role=dialog],[role=alertdialog],[aria-modal=true],dialog[open]')).filter((d) => !d.hidden && d.getClientRects().length && getComputedStyle(d).display !== 'none' && getComputedStyle(d).visibility !== 'hidden').map((d) => d.id || d.className)"
TEXTHASH = lambda pg: hashlib.sha1(pg.evaluate(SNAPSHOT_JS)['text'].encode('utf-8')).hexdigest()[:16]
EVS = """(n) => { const out = []; for (const e of (window.dataLayer || [])) {
  if (!e || Object.prototype.toString.call(e) !== '[object Arguments]') continue;
  if (e[0] === 'event' && (!n || e[1] === n)) out.push(Object.assign({ event: e[1] }, e[2] || {})); } return out; }"""
def reply(pg, q):
    return pg.evaluate('(q) => SML.chat.reply(q)', q)
def chat_ask(pg, text):
    n = pg.evaluate("() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length")
    pg.fill('#fbc-q', text); pg.press('#fbc-q', 'Enter')
    pg.wait_for_function(f"() => document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)').length > {n} && !document.querySelector('.fbc-typing')", timeout=8000)
    pg.wait_for_timeout(60)
    return pg.evaluate("""() => { const ms = document.querySelectorAll('.fbc-m.bot:not(.fbc-typing)'); const m = ms[ms.length - 1]; const pri = m.querySelector('.fbc-a.pri');
      return { text: m.textContent.replace(/\\s+/g, ' ').trim(), pri: pri ? pri.getAttribute('href') : null }; }""")
def open_chat(pg):
    pg.click('.fbc-launch'); pg.wait_for_selector('#fbc-panel:not([hidden]) .fbc-chip', timeout=8000)

with sync_playwright() as p:
    b = p.chromium.launch(args=[f'--host-resolver-rules=MAP firedbunny.test 127.0.0.1:{PORT}'])

    check(not re.search(r'stripe\.com/(p/login/)?test_', SHIPPED), 'src/support-config.js holds no Stripe test-mode link' + (' (links empty: hidden)' if SHIPPED_EMPTY else ' (a live link is set)'))

    # ---------- no link: everything hidden ----------
    A = context(b, NONE); pa = A.new_page(); watch(pa, 'none')
    go(pa, '/support/')
    check(pa.evaluate('SML.support.live()') is False and pa.evaluate('SML.support.configured()') is False, 'no link: support is off')
    check('no way to chip in yet' in pa.inner_text('.sp-cta') and pa.get_attribute('.sp-cta', 'data-volatile') is not None, 'no link: the Support page explains and says there is no way to chip in yet (data-volatile)')
    check(not pa.evaluate(STRIPE_A) and pa.locator('[data-support-plan]').count() == 0, 'no link: no Stripe link and no payment button on the Support page')
    check(pa.locator('#view h1').count() == 1 and 'not free to make' in pa.inner_text('#view h1').replace('\n', ' ').lower(), 'the Support page has one h1')
    pa.screenshot(path=os.path.join(SHOTS, 'support-desktop-nolink.png'), full_page=True)
    hidden = True
    for path in ['/', '/support/', '/lessons/wheel-strategy/', '/tools/position-size/', '/about/']:
        go(pa, path)
        if pa.evaluate(FOOT) or pa.evaluate(STRIPE_A) or pa.locator('[data-support-plan], #view [data-support-place]').count(): hidden = False; print('  visible on', path)
    check(hidden, 'no link: no footer link, About line or button on home, Support, a lesson, a tool or About')
    hashes_none = {}
    for path in ['/support/', '/about/', '/editorial-standards/', '/']:
        go(pa, path); hashes_none[path] = TEXTHASH(pa)
    go(pa, '/editorial-standards/')
    check(pa.locator('#view a[href="/support/"]').count() == 1 and 'How FiredBunny is paid for' in pa.inner_text('#view'), 'Editorial standards links to how the site is paid for (always, a plain link)')
    r = reply(pa, 'how can i support you')
    check(r['intent'] == 'support' and 'no way to chip in yet' in r['text'] and 'Stripe' not in r['text'], 'no link: the chat says there is no way to chip in yet')
    r = reply(pa, 'is it free')
    check(r['intent'] == 'free' and 'no paywall' in r['text'] and 'chip in' not in r['text'], 'no link: the free reply stays as it was')
    A.close()

    # ---------- a test link: shown ----------
    T = context(b, TEST); pt = T.new_page(); watch(pt, 'link')
    go(pt, '/support/')
    check(pt.evaluate('SML.support.live()') is True, 'test link: support is on')
    once = pt.locator('a[data-support-plan="once"]'); monthly = pt.locator('a[data-support-plan="monthly"]'); manage = pt.locator(f'a[href="{MANAGE}"]')
    check(once.count() == 1 and once.get_attribute('href') == ONCE and once.get_attribute('target') == '_blank' and 'noopener' in (once.get_attribute('rel') or '').split(), 'test link: “Chip in once” opens the Stripe link in a new tab with rel="noopener"')
    check(monthly.count() == 1 and monthly.get_attribute('href') == MONTHLY and 'noopener' in (monthly.get_attribute('rel') or '').split(), 'test link: “Chip in monthly” too')
    check(manage.count() == 1 and 'noopener' in (manage.get_attribute('rel') or '').split(), 'test link: monthly comes with the “Cancel or change it” link (customer portal)')
    cta = pt.inner_text('.sp-cta')
    check(all(s in cta for s in ['Not tax-deductible', 'not a charity', 'unlocks nothing', 'never sees your card']), 'test link: the fine print says not tax-deductible, not a charity, unlocks nothing, card stays with Stripe')
    check('opens Stripe in a new tab' in once.inner_text(), 'test link: screen readers hear that it opens Stripe in a new tab')
    with T.expect_page() as pop:
        once.click()
    popup = pop.value; popup.wait_for_load_state()
    check(popup.url == ONCE and 'Stripe stand-in' in popup.title() and pt.url == B + '/support/', f'clicking it opens exactly the configured Stripe address in a new tab and the site stays put ({popup.url})')
    popup.close()
    # keyboard focus is visible on the button
    pt.evaluate("() => { window.scrollTo(0, 0); document.getElementById('view').focus(); }")  # start of the page content
    for _ in range(10):
        pt.keyboard.press('Tab')
        if pt.evaluate("() => document.activeElement && document.activeElement.dataset.supportPlan === 'once'"): break
    st = pt.evaluate("() => { const s = getComputedStyle(document.activeElement); return { plan: document.activeElement.dataset.supportPlan, style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; }")
    check(st['plan'] == 'once' and st['style'] != 'none' and st['width'] >= 1, f'keyboard: Tab reaches the button and shows a focus ring ({st})')
    pt.evaluate('window.scrollTo(0, 0)'); pt.wait_for_timeout(100)
    pt.screenshot(path=os.path.join(SHOTS, 'support-desktop-link.png'), full_page=True)
    f = pt.evaluate(FOOT)
    check(f == [{'href': '/support/', 'text': 'Support FiredBunny', 'place': 'footer'}], f'test link: the footer has one “Support FiredBunny” link to /support/ ({f})')
    pt.locator('footer.foot').screenshot(path=os.path.join(SHOTS, 'footer-desktop-link.png'))
    inside = []
    for path in ['/lessons/wheel-strategy/', '/lessons/support-and-resistance/', '/tools/position-size/', '/tools/wheel-simulator/', '/portfolio/', '/']:
        go(pt, path)
        n = pt.evaluate("() => document.querySelectorAll('#view a[href*=\"stripe.com\"], #view [data-support-plan], #view [data-support-place], #view a[href=\"/support/\"]').length")
        if n: inside.append((path, n))
        if len(pt.evaluate(FOOT)) != 1: inside.append((path, 'footer'))
    check(not inside, f'test link: no support link inside lessons, tools, the Portfolio page or home; the footer link is on each ({inside})')
    go(pt, '/about/')
    al = pt.evaluate(ABOUT_LINE)
    check(len(al) == 1 and al[0]['volatile'] and al[0]['href'] == '/support/' and 'optional and unlocks nothing' in al[0]['text'], f'test link: one quiet line on the About page, data-volatile, linking to /support/ ({al})')
    pt.locator('.ab-facts').screenshot(path=os.path.join(SHOTS, 'about-line-desktop-link.png'))
    hashes_link = {}
    for path in ['/support/', '/about/', '/editorial-standards/', '/']:
        go(pt, path); hashes_link[path] = TEXTHASH(pt)
    check(hashes_link == hashes_none, f'the page text the lastmod hash reads is the same with and without a link ({hashes_none} vs {hashes_link})')
    pt.wait_for_timeout(1500)
    check(not pt.evaluate(DIALOGS), 'no dialog or pop-up anywhere (home after a moment)')
    go(pt, '/support/'); pt.wait_for_timeout(1500)
    check(not pt.evaluate(DIALOGS), 'no dialog or pop-up on the Support page')
    # the help chat
    r = reply(pt, 'how can i support you')
    check(r['intent'] == 'support' and 'Support page' in r['text'] and 'not a charity' in r['text'] and 'unlocks nothing' in r['text'], 'chat: “how can I support you” answers with the Support page, not tax-deductible, unlocks nothing')
    r = reply(pt, 'is it free')
    check(r['intent'] == 'free' and 'no paywall' in r['text'] and 'optional and unlocks nothing' in r['text'], 'chat: the free reply stays true (free; optional support, nothing unlocked)')
    for q in ['can i donate', 'is there a tip jar', 'buy you a coffee', 'who pays for this site', 'how is firedbunny funded', 'i want to support firedbunny', 'how can i help']:
        r = reply(pt, q)
        check(r['intent'] == 'support', f'chat: “{q}” → support ({r["intent"]})')
    for q, tok in [('support and resistance', 'l-support'), ('what is support', 'l-support'), ('support level', 'l-support'), ('how much can i contribute to a roth ira', None), ('donate appreciated stock', None), ('how do you make money with covered calls', None), ('tip me a stock', None)]:
        r = reply(pt, q)
        good = r['intent'] != 'support'
        if tok: good = good and pt.evaluate('(q) => SML.chat.match(q)[0].tok', q) == tok
        check(good, f'chat: “{q}” still goes to its lesson, not support ({r["intent"]})')
    open_chat(pt)
    r = chat_ask(pt, 'How can I support FiredBunny?')
    check(r['pri'] == '/support/', f'chat: the answer’s button opens the Support page ({r["pri"]})')
    pt.locator('#fbc-panel').screenshot(path=os.path.join(SHOTS, 'chat-support-desktop-link.png'))
    T.close()

    # ---------- only a one-time link; monthly without the customer portal ----------
    O = context(b, {'once': ONCE, 'monthly': '', 'manage': ''}); po = O.new_page(); watch(po, 'once-only')
    go(po, '/support/')
    check(po.locator('[data-support-plan]').count() == 1 and 'You choose the amount.' in po.inner_text('.sp-cta') and 'Cancel or change' not in po.inner_text('.sp-cta'), 'once only: one button, “You choose the amount”, no monthly line')
    O.close()
    n0 = len(WARNS)
    M = context(b, {'once': ONCE, 'monthly': MONTHLY, 'manage': ''}); pm = M.new_page(); watch(pm, 'no-manage')
    go(pm, '/support/')
    check(pm.locator('a[data-support-plan="monthly"]').count() == 0 and pm.locator('a[data-support-plan="once"]').count() == 1 and any('monthly needs manage' in w for w in WARNS[n0:]), 'monthly without the customer-portal link is not shown, with a console warning')
    M.close()

    # ---------- refused addresses ----------
    R = context(b); pr = R.new_page(); watch(pr, 'check')
    go(pr, '/support/')
    bad = [('once', 'http://buy.stripe.com/abc123'), ('once', 'https://evil.example/pay'), ('once', 'https://buy.stripe.com.evil.example/abc123'), ('once', 'https://evilbuy.stripe.com/abc123'),
           ('once', 'https://stripe.com/abc123'), ('once', 'https://donate.stripe.com/abc123'), ('once', 'javascript:alert(1)'), ('once', 'https://user:pw@buy.stripe.com/abc123'),
           ('once', 'https://buy.stripe.com:8443/abc123'), ('once', 'https://buy.stripe.com/'), ('once', 'buy.stripe.com/abc123'), ('once', 'https://billing.stripe.com/p/login/abc123'),
           ('monthly', 'https://evil.example/m'), ('manage', 'https://buy.stripe.com/abc123'), ('manage', 'https://evil.example/p/login/abc')]
    good = [('once', 'https://buy.stripe.com/abc123'), ('once', ' https://buy.stripe.com/test_abc123?locale=en '), ('monthly', 'https://buy.stripe.com/xyz789'), ('manage', 'https://billing.stripe.com/p/login/abc123')]
    res_bad = pr.evaluate('(l) => l.map(([k, u]) => SML.support.check(u, k))', bad)
    res_good = pr.evaluate('(l) => l.map(([k, u]) => SML.support.check(u, k))', good)
    check(all(x == '' for x in res_bad), f'refused: http, other hosts, look-alikes, donate.stripe.com, javascript:, credentials, ports, no id, wrong kind ({[u for (k, u), x in zip(bad, res_bad) if x]})')
    check(all(x.startswith('https://') and ('buy.stripe.com/' in x or 'billing.stripe.com/p/login/' in x) for x in res_good), f'accepted: buy.stripe.com links (test or live) and the billing.stripe.com portal link ({res_good})')
    R.close()
    for cfg in [{'once': 'https://evil.example/pay', 'monthly': '', 'manage': ''}, {'once': 'http://buy.stripe.com/abc123', 'monthly': 'https://buy.stripe.com.evil.example/m', 'manage': MANAGE}, {'once': 'https://donate.stripe.com/abc123', 'monthly': '', 'manage': ''}]:
        n0 = len(WARNS)
        X = context(b, cfg); px = X.new_page(); watch(px, 'bad')
        go(px, '/support/')
        shown = px.evaluate(FOOT) or px.evaluate(STRIPE_A) or px.locator('[data-support-plan]').count() or px.evaluate('SML.support.live()')
        check(not shown and 'no way to chip in yet' in px.inner_text('.sp-cta') and any('support link ignored' in w for w in WARNS[n0:]), f'a configured non-Stripe or look-alike address is ignored everywhere, with a console warning ({cfg["once"]})')
        X.close()

    # ---------- analytics: support_click only with consent, coarse ----------
    D = context(b, TEST, visitor=True, tz='America/Denver'); pd = D.new_page(); watch(pd, 'visitor')
    go(pd, '/support/', V)
    check(pd.evaluate('SML.trackOn') is True, 'visitor outside Europe: analytics on by default (as the rest of the site)')
    pd.locator('footer.foot a[data-support-place="footer"]').click(); pd.wait_for_timeout(300)
    with D.expect_page() as pop:
        pd.locator('a[data-support-plan="once"]').click()
    pop.value.close()
    ev = pd.evaluate(EVS, 'support_click')
    check([(e.get('target'), e.get('target_type')) for e in ev] == [('page', 'footer'), ('once', 'support')], f'support_click for the footer link and the button: target and place only ({[(e.get("target"), e.get("target_type")) for e in ev]})')
    allowed = {'event', 'target', 'target_type', 'page_type', 'content_id', 'content_title', 'course_name', 'track_name', 'connection', 'display_mode', 'lessons_done'}
    extra = sorted({k for e in ev for k in e} - allowed)
    check(not extra and not any('stripe' in json.dumps(e).lower() for e in ev), f'no amount, address or anything personal in the event ({extra})')
    go(pd, '/about/', V); pd.locator('.ab-facts a[data-support-place="about"]').click(); pd.wait_for_timeout(300)
    go(pd, '/', V); open_chat(pd); chat_ask(pd, 'how can I support you?')
    pd.locator('.fbc-m.bot').last.locator('.fbc-a.pri').click(); pd.wait_for_timeout(400)
    ev = pd.evaluate(EVS, 'support_click')
    check(ev and (ev[-1].get('target'), ev[-1].get('target_type')) == ('page', 'chat') and pd.url == V + '/support/', f'support_click from the help chat (place: chat), and the link opens the page ({ev[-1:] if ev else ev})')
    pd.evaluate('SML.chat.close()'); pd.evaluate('SML.analytics.set(false)'); n = len(pd.evaluate(EVS, 'support_click'))
    with D.expect_page() as pop:
        pd.locator('a[data-support-plan="monthly"]').click()
    pop.value.close()
    check(len(pd.evaluate(EVS, 'support_click')) == n, 'after switching usage stats off in Settings, no support_click is sent')
    D.close()
    E = context(b, TEST, visitor=True, tz='Europe/Paris'); pe = E.new_page(); watch(pe, 'europe')
    go(pe, '/support/', V); pe.wait_for_selector('#fb-consent', timeout=8000)
    with E.expect_page() as pop:
        pe.locator('a[data-support-plan="once"]').click()
    pop.value.close()
    check(not pe.evaluate(EVS, None), 'Europe, before any choice: clicking a support button sends nothing at all')
    pe.click('#fb-consent [data-c="yes"]'); pe.wait_for_timeout(300)
    with E.expect_page() as pop:
        pe.locator('a[data-support-plan="once"]').click()
    pop.value.close()
    ev = pe.evaluate(EVS, 'support_click')
    check(len(ev) == 1 and ev[0]['target'] == 'once', f'Europe, after Allow: one support_click ({len(ev)})')
    E.close()

    # ---------- phone, 390 x 844 ----------
    for label, links in [('link', TEST), ('nolink', None)]:
        P = context(b, links, w=390, h=844, phone=True); pp = P.new_page(); watch(pp, 'phone-' + label)
        go(pp, '/support/')
        sw = pp.evaluate('document.documentElement.scrollWidth')
        wide = pp.evaluate("() => Array.from(document.querySelectorAll('#view *, footer.foot *')).filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > 391 || r.left < -1); }).slice(0, 3).map((e) => e.tagName + '.' + e.className)")
        check(sw <= 390 and not wide, f'phone ({label}): no sideways scrolling on the Support page ({sw}, {wide})')
        if links:
            bx = [pp.locator(f'a[data-support-plan="{k}"]').bounding_box() for k in ('once', 'monthly')]
            check(all(x and x['height'] >= 44 and x['x'] >= 15 and x['x'] + x['width'] <= 375 and x['y'] + x['height'] < 844 for x in bx), f'phone: both buttons on the first screen, at least 44 px tall, inside the 16 px gutters ({bx})')
            ft = pp.locator('footer.foot a[data-support-place="footer"]'); ft.scroll_into_view_if_needed()
            check(ft.is_visible(), 'phone: the footer link is there')
        pp.evaluate('window.scrollTo(0, 0)'); pp.wait_for_timeout(100)
        pp.screenshot(path=os.path.join(SHOTS, f'support-phone-{label}.png'), full_page=True)
        pp.screenshot(path=os.path.join(SHOTS, f'support-phone-{label}-first-screen.png'))
        if links:
            go(pp, '/about/'); pp.locator('.ab-facts').scroll_into_view_if_needed()
            pp.locator('.ab-facts').screenshot(path=os.path.join(SHOTS, 'about-line-phone-link.png'))
            go(pp, '/'); open_chat(pp); chat_ask(pp, 'How can I support you?')
            pp.screenshot(path=os.path.join(SHOTS, 'chat-support-phone-link.png'))
        P.close()

    # ---------- /support/thanks/ ----------
    for label, w, h in [('desktop', 1280, 900), ('phone', 390, 844)]:
        H = context(b, TEST, w=w, h=h, phone=label == 'phone'); ph = H.new_page(); watch(ph, 'thanks')
        go(ph, '/support/thanks/')
        txt = ph.inner_text('#view').lower()
        robots = ph.evaluate("() => (document.querySelector('meta[name=robots]') || {}).content || ''")
        check('thank you' in txt and not re.search(r'payment|paid|received|success|confirm|receipt|amount|\$', txt) and 'noindex' in robots, f'thank-you page: says thank you, claims no payment, noindex ({txt[:80]!r}, {robots})')
        check(ph.locator('#view a[href="/learn/"]').count() == 1 and ph.locator('#view a[href="/support/"]').count() == 1, 'thank-you page: links back to the lessons and the Support page')
        ph.screenshot(path=os.path.join(SHOTS, f'thanks-{label}.png'))
        H.close()

    # ---------- the claude.ai copy (hash addresses, window.claude present) ----------
    body = open(os.path.join(ROOT, 'build', 'fragment.html'), encoding='utf-8').read()
    prev = os.path.join(ROOT, 'build', 'support-preview.html')
    open(prev, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + inject(body, TEST) + '</body></html>')
    FAKE = """(() => { const user = { me: async () => ({ id: 'u_1', name: 'Viewer' }), id: async () => 'u_1', isOwner: async () => false, can: async () => true, canEdit: async () => false, profiles: async () => ({}) };
      window.claude = { use: (n) => Promise.resolve(n === 'user' ? user : null) }; })();"""
    C = context(b, init=FAKE); pc = C.new_page(); watch(pc, 'claude')
    pc.goto('file://' + prev + '#support'); pc.wait_for_function("() => window.SML && SML.support && SML.host === 'claude' && !document.getElementById('boot')", timeout=20000); pc.wait_for_timeout(300)
    cta = pc.inner_text('.sp-cta')
    check(pc.evaluate('SML.support.configured()') and not pc.evaluate('SML.support.live()') and not pc.evaluate(STRIPE_A) and 'firedbunny.com/support' in cta, 'claude.ai copy with a link set: no payment buttons, the page points to firedbunny.com/support')
    out = pc.locator('.sp-cta a'); check(out.get_attribute('href') == 'https://firedbunny.com/support/' and out.get_attribute('target') == '_blank' and 'noopener' in out.get_attribute('rel'), 'claude.ai copy: that link opens outside, rel="noopener"')
    check(not pc.evaluate(FOOT), 'claude.ai copy: no footer support link')
    pc.screenshot(path=os.path.join(SHOTS, 'claude-copy-support.png'))
    pc.evaluate("location.hash = 'about'"); pc.wait_for_timeout(500)
    check(not pc.evaluate(ABOUT_LINE), 'claude.ai copy: no About line')
    r = reply(pc, 'how can i support you')
    check(r['intent'] == 'support' and 'firedbunny.com/support' in r['text'] and 'doesn’t take payments' in r['text'], 'claude.ai copy: the chat says support is handled on the website')
    C.close()

    # ---------- pre-built pages (after a full build) ----------
    pre = os.path.join(DIST, 'support', 'index.html')
    if os.path.exists(pre) and '<div id="pre">' in open(pre, encoding='utf-8').read():
        pages = glob.glob(os.path.join(DIST, '**', 'index.html'), recursive=True)
        stripe = [os.path.relpath(f, DIST) for f in pages if re.search(r'stripe\.com|data-support-plan', open(f, encoding='utf-8').read())]
        d = open(pre, encoding='utf-8').read(); snap = d[d.find('<div id="pre">'):d.find('<div id="boot"')]
        if SHIPPED_EMPTY:
            dirty = [os.path.relpath(f, DIST) for f in pages if re.search(r'stripe\.com|data-support-place|data-support-plan', open(f, encoding='utf-8').read())]
            check(not dirty, f'pre-built pages (no link set): no Stripe link, no footer support link, no button ({len(pages)} pages checked, {dirty[:3]})')
            check('no way to chip in yet' in snap, 'pre-built /support/ (no link set): says there is no way to chip in yet')
        else:
            check(stripe == [os.path.join('support', 'index.html')], f'pre-built pages (link set): the Stripe link is on /support/ only ({stripe[:3]})')
        check('data-volatile' in snap and '<link rel="canonical" href="https://firedbunny.com/support/">' in d and 'index, follow' in d, 'pre-built /support/: indexable, canonical, its call to action is data-volatile')
        t = open(os.path.join(DIST, 'support', 'thanks', 'index.html'), encoding='utf-8').read()
        check('noindex' in t and '<div id="pre">' not in t, 'pre-built /support/thanks/: noindex, no snapshot')
        sm = open(os.path.join(DIST, 'sitemap.xml'), encoding='utf-8').read()
        check('<loc>https://firedbunny.com/support/</loc>' in sm and '/support/thanks/' not in sm, 'sitemap: /support/ in, /support/thanks/ out')
        lm = json.load(open(os.path.join(HERE, 'seo-lastmod.json'), encoding='utf-8'))
        check('/support/' in lm and '/support/thanks/' not in lm, 'tools/seo-lastmod.json has /support/ (commit it with the page)')
        # no layout shift while the live page takes over from the snapshot
        L = context(b); pl = L.new_page(); watch(pl, 'cls')
        pl.add_init_script("window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });")
        for path in ['/support/', '/about/']:
            go(pl, path); pl.wait_for_timeout(600)
            cls = pl.evaluate('window.__cls')
            check(cls < 0.01, f'no layout shift on {path} as the script takes over from the pre-built page (CLS {cls:.4f})')
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
