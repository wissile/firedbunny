"""Which segments a language's pages actually show (docs/i18n/README.md). Build with FB_KEYS=1 (every untranslated
segment shows as ⟦its key⟧), then: python3 tools/i18n/seen.py es  -> tools/i18n/es/seen.json, used by
`make.js todo es --seen` to translate what readers see first. It opens every page and also clicks every tab, segmented
button and quiz option once, so text shown after a click counts; text that appears only deeper in a widget is missed."""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(__file__))
from crawl import serve
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
lang = sys.argv[1]
L = json.load(open(os.path.join(ROOT, 'tools', 'i18n', 'langs.json'), encoding='utf-8'))[lang]
KEY = re.compile(r'⟦([0-9a-f]{12})⟧')
GRAB = r"""() => { const out = [document.title, document.body.innerText];
  for (const el of document.querySelectorAll('[title],[aria-label],[placeholder],[alt],[label],meta[content]'))
    for (const a of ['title','aria-label','placeholder','alt','label','content']) { const v = el.getAttribute(a); if (v) out.push(v); }
  return out.join('\n'); }"""
srv = serve(os.path.join(ROOT, 'dist'), 8799)
seen = set()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(service_workers='block', viewport={'width': 1280, 'height': 900})
    pg.goto(f'http://127.0.0.1:8799{L["prefix"]}/'); pg.wait_for_function('window.SML && SML.routes && SML.lessons && SML.lessons.length > 50', timeout=60000)
    toks = pg.evaluate("SML.routes.all().map(t => [t, SML.routes.path(t)])")
    for i, (tok, path) in enumerate(toks):
        pg.evaluate("(p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')); }", path); pg.wait_for_timeout(250)
        seen |= set(KEY.findall(pg.evaluate(GRAB)))
        # one click on each segmented option, tab and quiz answer, to reveal text that appears after a click
        n = pg.evaluate("document.querySelectorAll('#view .seg button, #view [role=tab], #view .quiz button, #view .q-opt').length")
        for j in range(min(n, 60)):
            try:
                pg.evaluate("(j) => { const b = document.querySelectorAll('#view .seg button, #view [role=tab], #view .quiz button, #view .q-opt')[j]; if (b) b.click(); }", j)
            except Exception:
                pass
        pg.wait_for_timeout(150)
        seen |= set(KEY.findall(pg.evaluate(GRAB)))
    b.close()
srv.shutdown()
out = os.path.join(ROOT, 'tools', 'i18n', lang, 'seen.json')
json.dump({'pages': len(toks), 'keys': sorted(seen)}, open(out, 'w'), indent=0)
print(f'seen: {len(seen)} segments on {len(toks)} {lang} pages -> {out}')
