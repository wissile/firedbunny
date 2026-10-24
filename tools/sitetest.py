"""Visit every route of the built page (build/fragment.html, wrapped like the claude.ai host does) in headless Chromium.
Usage: python3 tools/sitetest.py [--shots tok1,tok2,...] [--routes tok1,tok2] [--fuzz]
Reports JS errors, missing widgets, horizontal overflow at 1280 and 375 px.
Screenshots (full page) for --shots tokens go to shots/site/<tok>-<desktop|mobile>.png
"""
import sys, os, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist = os.path.join(ROOT, 'build', 'fragment.html')
body = open(dist).read()
doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>'+open(os.path.join(ROOT, 'tools', 'localfonts.css')).read()+'</style><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>'
prev = os.path.join(ROOT, 'build', 'preview.html')
# audio files sit next to the page on the real hosts; mirror that for the file:// preview
_aud = os.path.join(ROOT, 'build', 'audio')
if not os.path.exists(_aud) and os.path.isdir(os.path.join(ROOT, 'public', 'audio')):
    os.symlink(os.path.join(ROOT, 'public', 'audio'), _aud)
open(prev, 'w').write(doc)
arg = lambda k: sys.argv[sys.argv.index(k) + 1].split(',') if k in sys.argv else None
shots = arg('--shots') or []
only = arg('--routes')
fuzz = '--fuzz' in sys.argv
outdir = os.path.join(ROOT, 'shots', 'site'); os.makedirs(outdir, exist_ok=True)

FUZZ = open(os.path.join(ROOT, 'tools', 'harness.py')).read().split('FUZZ = r"""')[1].split('"""')[0]

with sync_playwright() as p:
    b = p.chromium.launch()
    results = {}
    for label, vw, scheme in [('desktop', 1280, 'light'), ('mobile', 375, 'dark')]:
        pg = b.new_page(viewport={'width': vw, 'height': 860}, color_scheme=scheme)
        errs = []
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'fonts.g' not in m.text else None)
        pg.goto('file://' + prev)
        pg.wait_for_timeout(500)
        routes = only or pg.evaluate("""() => { const S = window.SML; const r = ['home','learn','track-trading','track-wealth','track-fire','tools','indicator','play','wheel','blog','sheets','apps','glossary','calendar','about','assessment','results','dashboard','profile','settings','signin'];
          S.courses.forEach(c => r.push('c-' + c.id)); S.courses.forEach(c => S.lessons.filter(l => l.course === c.id).sort((a,b)=>a.order-b.order).forEach(l => r.push(l.id)));
          S.tools.forEach(t => r.push(t.id)); S.posts.forEach(p => r.push(p.id)); return r; }""")
        for tok in routes:
            n0 = len(errs)
            pg.evaluate(f"location.hash = '{tok}'")
            pg.wait_for_timeout(350)
            info = pg.evaluate("""(vw) => ({
              sw: document.documentElement.scrollWidth,
              missing: Array.from(document.querySelectorAll('[data-widget]')).filter(e => /still being drawn|failed to load/.test(e.textContent) && e.children.length <= 1).map(e => e.dataset.widget),
              wide: Array.from(document.querySelectorAll('#view *')).filter(e => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && r.width > 0 && !e.closest('.scroll,.ticker,.sheet-wrap') && getComputedStyle(e).position !== 'fixed'; }).slice(0,4).map(e => e.tagName + '.' + (typeof e.className === 'string' ? e.className : (e.className.baseVal||'')) + ' r=' + Math.round(e.getBoundingClientRect().right)),
              h1: (document.querySelector('#view h1') || {}).textContent || ''
            })""", vw)
            if fuzz:
                fe = pg.evaluate(FUZZ)
                errs.extend('fuzz ' + x for x in fe)
            if tok in shots:
                pg.evaluate('window.scrollTo(0,0)')
                pg.wait_for_timeout(250)
                pg.screenshot(path=os.path.join(outdir, f'{tok}-{label}.png'), full_page=True)
            new = errs[n0:]
            bad = new or info['missing'] or info['sw'] > vw or info['wide']
            results.setdefault(tok, {})[label] = info | {'errors': new} if bad else 'ok'
        pg.close()
    b.close()
okc = sum(1 for t, v in results.items() if all(x == 'ok' for x in v.values()))
print(f'{okc}/{len(results)} routes clean')
for t, v in results.items():
    if not all(x == 'ok' for x in v.values()):
        print(t, json.dumps(v)[:900])
