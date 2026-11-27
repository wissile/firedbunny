"""Open every page of a built site and report script errors, failed modules and pages that draw nothing.
Usage: python3 tools/i18n/crawl.py DIST [--compare EN_DIST]  (pages drawn with the History API from a local server)
With --compare, also reports pages whose text is much shorter than the English build's (a sign a page stopped drawing)."""
import sys, os, json, threading, functools, http.server, re
from playwright.sync_api import sync_playwright

def serve(d, port):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def send_head(self):  # every unknown path gets index.html, like the live router
            p = self.translate_path(self.path.split('?')[0])
            if not os.path.exists(p) or (os.path.isdir(p) and not os.path.exists(os.path.join(p, 'index.html'))):
                self.path = '/index.html'
            return super().send_head()
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Q, directory=d))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def crawl(d, port):
    srv = serve(d, port)
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(service_workers='block', viewport={'width': 1280, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)[:200]))
        pg.on('console', lambda m: errs.append('console: ' + m.text[:200]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        pg.goto(f'http://127.0.0.1:{port}/'); pg.wait_for_function('window.SML && SML.routes && SML.lessons && SML.lessons.length > 100', timeout=60000)
        boot = list(errs)
        paths = pg.evaluate("SML.routes.all().map(t => SML.routes.path(t))")
        for path in paths:
            errs.clear()
            try:
                pg.evaluate("(p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }", path)
                pg.wait_for_timeout(250)
                n = pg.evaluate("(document.querySelector('#view')||document.body).innerText.length")
            except Exception as e:
                errs.append('nav: ' + str(e)[:200]); n = 0
            res[path] = {'len': n, 'errors': list(errs)}
        b.close()
    srv.shutdown()
    return boot, res

if __name__ == '__main__':
    d = sys.argv[1]
    boot, res = crawl(d, 8791)
    print('pages', len(res), 'boot errors', len(boot))
    for e in boot[:20]: print('  BOOT', e)
    bad = {k: v for k, v in res.items() if v['errors']}
    print('pages with errors', len(bad))
    for k, v in list(bad.items())[:40]: print(' ', k, '|', ' || '.join(v['errors'])[:300])
    if '--compare' in sys.argv:
        _, en = crawl(sys.argv[sys.argv.index('--compare') + 1], 8792)
        short = [(k, res[k]['len'], en[k]['len']) for k in res if k in en and en[k]['len'] > 400 and res[k]['len'] < en[k]['len'] * 0.6]
        print('pages much shorter than English', len(short))
        for k, a, b in short[:40]: print(f'  {k}: {a} vs {b}')
    json.dump({'boot': boot, 'pages': res}, open(os.path.join(d, '..', 'crawl.json'), 'w'), indent=1)

def gaps(d, port, paths):
    """Visible text with English words but no ⟦pseudo⟧ marker: text the extractor missed (run on a pseudo build)."""
    srv = serve(d, port); found = {}
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(service_workers='block')
        pg.goto(f'http://127.0.0.1:{port}/'); pg.wait_for_function('window.SML && SML.routes && SML.lessons && SML.lessons.length > 100', timeout=60000)
        for path in paths:
            pg.evaluate("(p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }", path); pg.wait_for_timeout(250)
            for t in pg.evaluate(r"""() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                while (w.nextNode()) { const n = w.currentNode, s = n.nodeValue.trim(); const el = n.parentElement;
                  if (!s || !el || el.closest('script,style,svg,code,.chart,canvas')) continue;
                  if (!/[A-Za-z]{3,}/.test(s)) continue;
                  let inside = false, x = el; while (x) { if ((x.textContent||'').includes('⟦')) { inside = /⟦[^⟧]*$/.test((x.textContent||'').split(s)[0]); break; } x = x.parentElement; }
                  if (!s.includes('⟦') && !inside) out.push(s.slice(0, 80)); }
                return out; }"""):
                found[t] = found.get(t, 0) + 1
        b.close()
    srv.shutdown()
    return sorted(found.items(), key=lambda x: -x[1])
