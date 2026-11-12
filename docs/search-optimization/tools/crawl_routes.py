"""Rendered-DOM crawl of every route of the built site (dist/), served locally. Writes crawl.json.
Used for the November 2026 search audit (docs/search-optimization/). Build first: python3 tools/build.py
Needs: pip install playwright (Chromium). Run: python3 docs/search-optimization/tools/crawl_routes.py"""
import http.server, threading, functools, json, sys, os
from playwright.sync_api import sync_playwright
D = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'dist'))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8833), functools.partial(H, directory=D))
threading.Thread(target=srv.serve_forever, daemon=True).start()
COLLECT = r"""() => {
  const v = document.querySelector('#view'); const S = window.SML;
  const txt = (v.innerText || '').replace(/\s+/g, ' ').trim();
  const hs = [...v.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => [h.tagName, (h.innerText||'').replace(/\s+/g,' ').trim().slice(0, 90)]);
  const allH1 = [...document.querySelectorAll('h1')].map(h => (h.innerText||'').trim().slice(0, 90));
  let skips = 0, prev = 1; for (const [t] of hs) { const n = +t[1]; if (n > prev + 1) skips++; prev = n; }
  const links = [...v.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
  const internal = [...new Set(links.filter(h => /^#[A-Za-z0-9._~-]+$/.test(h)).map(h => h.slice(1)))];
  const ext = links.filter(h => /^https?:/.test(h)); const domains = [...new Set(ext.map(h => { try { return new URL(h).hostname.replace(/^www\./,''); } catch(e) { return ''; } }))];
  const imgs = [...v.querySelectorAll('img')]; const noalt = imgs.filter(i => !i.hasAttribute('alt')).length;
  const svgs = [...v.querySelectorAll('svg')]; const bigSvg = svgs.filter(s => { const r = s.getBoundingClientRect(); return r.width > 120 && r.height > 80; });
  const svgLabelled = bigSvg.filter(s => s.getAttribute('aria-label') || s.querySelector('title') || s.getAttribute('aria-labelledby') || s.closest('[aria-label]') || s.closest('figure')?.querySelector('figcaption')).length;
  const lower = txt.toLowerCase();
  return { title: document.title, desc: (document.querySelector('meta[name=description]')||{}).content || '', canonical: (document.querySelector('link[rel=canonical]')||{}).href || '',
    words: txt ? txt.split(' ').length : 0, h1: allH1, headings: hs.length, h2: hs.filter(h => h[0] === 'H2').length, skips, internal, extCount: ext.length, domains,
    imgs: imgs.length, noalt, bigSvg: bigSvg.length, svgLabelled, widgets: v.querySelectorAll('[data-widget]').length,
    quiz: v.querySelectorAll('#quiz .qopt').length ? 1 : 0, sourcesBlock: /\bsources?\b[:\s]/i.test(txt) && ext.length > 0 ? 1 : 0,
    disclaimer: /not (financial|investment|tax) advice|educational (purposes|only)|for education/i.test(lower) ? 1 : 0,
    dated: /(updated|as of|last reviewed)\s+[a-z]*\s*\d{1,2}?,?\s*20\d\d/i.test(txt) || !!v.querySelector('time') ? 1 : 0,
    first: txt.slice(0, 260) };
}"""
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8833/'); pg.wait_for_selector('#view section'); pg.wait_for_timeout(800)
    meta = pg.evaluate("""() => { const S = window.SML;
      const pick = (o) => Object.fromEntries(Object.entries(o).filter(([k, v]) => typeof v !== 'function' && typeof v !== 'object').map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 200) : v]));
      return { lessons: S.lessons.map(pick), courses: S.courses.map(pick), tools: S.tools.map(pick), posts: (S.posts||[]).map(pick), tracks: (S.tracks||[]).map(pick),
        glossary: (S.glossary || S.terms || []).length, glossaryKeys: S.glossary ? Object.keys(S.glossary[0] || S.glossary).slice(0, 8) : null,
        lessonKeys: Object.keys(S.lessons[0]), courseKeys: Object.keys(S.courses[0]), toolKeys: Object.keys(S.tools[0]) }; }""")
    routes = pg.evaluate("""() => { const S = window.SML; const r = ['home','learn','track-trading','track-wealth','track-fire','tools','indicator','play','wheel','blog','sheets','apps','glossary','calendar','about','assessment','results','dashboard','profile','settings','signin','offline'];
      S.courses.forEach(c => r.push('c-' + c.id)); S.courses.forEach(c => S.lessons.filter(l => l.course === c.id).sort((a,b)=>a.order-b.order).forEach(l => r.push(l.id)));
      S.tools.forEach(t => r.push(t.id)); (S.posts||[]).forEach(p => r.push(p.id)); return [...new Set(r)]; }""")
    out = {}
    for i, tok in enumerate(routes):
        pg.evaluate(f"location.hash = '{tok}'"); pg.wait_for_timeout(250)
        try: out[tok] = pg.evaluate(COLLECT)
        except Exception as e: out[tok] = {'error': str(e)}
        if i % 40 == 0: print(i, tok, flush=True)
    b.close()
srv.shutdown()
json.dump({'meta': meta, 'routes': out, 'errors': errs[:20]}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'crawl.json'), 'w'), indent=1)
print('routes', len(out), 'errors', len(errs))
