"""Pre-build the home page into dist/index.html, so the first paint already shows it (like a server-rendered site)
instead of a loading screen while the script starts.

Run by tools/build.py after it writes dist/. It opens the built site in a headless browser (the system Chrome, or
Playwright's own Chromium), waits until the home page has drawn, and saves:
  - the header, home page and footer as static HTML inside <div id="pre">, shown until the script takes over
    (pages.js removes it in the same moment it draws the live page);
  - the rules it uses from the styles the modules add at runtime (for every screen width), inlined in the page so the
    snapshot looks right before any script runs; the script adds the full styles when it takes over.
A link straight to another page (a #hash other than #home) hides the snapshot and shows the loading screen instead.
Needs `pip install playwright`; without it, or if the browser will not start, the site builds without the snapshot
and simply shows the loading screen.
"""
import functools, http.server, os, threading

SNAPSHOT_JS = r"""() => {
  // only the rules the snapshot uses (any screen width: media queries are kept around the rules they hold); the
  // script adds the full styles when it takes over
  const STATE = /::?(before|after|placeholder|selection|marker|backdrop|-webkit-[a-z-]+|-moz-[a-z-]+)|:(hover|focus|focus-visible|focus-within|active|visited|checked|disabled|enabled|invalid|valid|target|indeterminate|placeholder-shown|user-invalid)\b/g;
  const used = (selText) => selText.split(',').some((s) => { const b = s.replace(STATE, '').trim() || '*'; try { return !!document.querySelector(b); } catch (e) { return true; } });
  const walk = (rules) => { let out = ''; for (const r of rules) {
    if (r instanceof CSSStyleRule) { if (used(r.selectorText)) out += r.cssText + '\n'; }
    else if (r instanceof CSSMediaRule || (window.CSSSupportsRule && r instanceof CSSSupportsRule)) { const inner = walk(r.cssRules); if (inner) out += (r instanceof CSSMediaRule ? '@media ' + r.media.mediaText : '@supports ' + r.conditionText) + '{\n' + inner + '}\n'; }
    else out += r.cssText + '\n';
  } return out; };
  let css = '', all = 0;
  for (const s of document.querySelectorAll('head style:not([data-fb])')) { all += s.textContent.length; try { css += walk(s.sheet.cssRules); } catch (e) { css += s.textContent + '\n'; } }
  const keep = (el) => { if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('[data-mounted]').forEach((w) => w.removeAttribute('data-mounted')); c.querySelectorAll('canvas').forEach((x) => x.remove()); return c.outerHTML; };
  const view = document.getElementById('view').cloneNode(true);
  view.removeAttribute('id'); view.removeAttribute('tabindex'); view.classList.add('pre-view');
  view.querySelectorAll('[data-mounted]').forEach((w) => w.removeAttribute('data-mounted'));
  view.querySelectorAll('canvas').forEach((x) => x.remove());
  return { css, all, html: keep(document.querySelector('body > header.nav')) + view.outerHTML + keep(document.querySelector('body > footer.foot')), title: document.title };
}"""


def prerender(dist):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('home page snapshot skipped: Playwright is not installed (pip install playwright)')
        return False
    index = os.path.join(dist, 'index.html')
    page_html = open(index, encoding='utf-8').read()

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=dist))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/'
    try:
        with sync_playwright() as p:
            browser = None
            for opts in ({'channel': 'chrome'}, {}):
                try:
                    browser = p.chromium.launch(**opts); break
                except Exception:
                    continue
            if not browser:
                print('home page snapshot skipped: no browser could start')
                return False
            ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
            page = ctx.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(url)
            page.wait_for_selector('#view section', timeout=60000)
            page.wait_for_function("() => !document.getElementById('boot') && document.fonts.status === 'loaded'", timeout=30000)
            page.wait_for_timeout(300)
            snap = page.evaluate(SNAPSHOT_JS)
            browser.close()
    except Exception as e:
        print('home page snapshot skipped:', str(e).splitlines()[0][:200])
        return False
    finally:
        srv.shutdown()
    if errors:
        print('home page snapshot skipped: the page reported errors:', errors[:2])
        return False
    # styles the modules add, then the rules that pick snapshot or loading screen
    style = ('<style data-fb="pre">\n' + snap['css'] + '\n'
             'html:not(.fb-deep) #boot{display:none}\n.fb-deep #pre{display:none}\n'
             '#pre .pre-view{animation:none}\n</style>\n')
    head_js = "<script>if(/^#(?!home$)./.test(location.hash))document.documentElement.classList.add('fb-deep');</script>\n"
    if '</head>' not in page_html or '<div id="boot"' not in page_html:
        print('home page snapshot skipped: unexpected page layout')
        return False
    page_html = page_html.replace('</head>', head_js + style + '</head>', 1)
    page_html = page_html.replace('<div id="boot"', '<div id="pre">' + snap['html'] + '</div>\n<div id="boot"', 1)
    open(index, 'w', encoding='utf-8').write(page_html)
    print(f"home page snapshot: {len(snap['html']) // 1024} KB of HTML, {len(snap['css']) // 1024} KB of the {snap['all'] // 1024} KB of module styles")
    return True
