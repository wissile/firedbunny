#!/usr/bin/env python3
# Run after: python3 tools/build.py --no-prerender
"""Download-all / delete bar: lessons list, lesson page, profile, offline page. Uses the real audio files in dist, with no service worker."""
import http.server, threading, functools, sys, re
from playwright.sync_api import sync_playwright
DIST = __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..', 'dist')
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8766), functools.partial(H, directory=DIST))
threading.Thread(target=srv.serve_forever, daemon=True).start()
ok = True
def check(c, m):
    global ok
    print(('PASS ' if c else 'FAIL ') + m); ok = ok and c
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1200, 'height': 900}, service_workers='block')
    pass  # real files from dist, no service worker
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8766/#lessons'); pg.wait_for_selector('.offq', timeout=15000)
    t = pg.inner_text('.offq'); check('0 of' in t and 'Download all' in t, 'lessons list shows the bar with nothing saved: ' + t.split('\n')[2][:60])
    check(pg.is_disabled('button[data-oq="del"]'), 'delete is greyed out while nothing is saved')
    bg = pg.eval_on_selector('button[data-oq="del"]', 'e => getComputedStyle(e).backgroundColor')
    pg.click('button[data-oq="all"]')
    pg.wait_for_function("document.querySelector('.offq') && /lessons saved/.test(document.querySelector('.offq').innerText) && !/Downloading/.test(document.querySelector('.offq').innerText) && /all \\d+ lessons saved/i.test(document.querySelector('.offq').innerText)", timeout=400000)
    check(True, 'download all finished: ' + pg.inner_text('.offq .off-row'))
    check(not pg.is_disabled('button[data-oq="del"]'), 'delete is enabled once audio is saved')
    bg2 = pg.eval_on_selector('button[data-oq="del"]', 'e => getComputedStyle(e).backgroundColor')
    check(bg != bg2, f'delete turns red ({bg} -> {bg2})')
    pg.screenshot(path=__import__('os').path.join(__import__('tempfile').gettempdir(), 'lessons_saved.png'), clip={'x': 0, 'y': 0, 'width': 1200, 'height': 700})
    # lesson page, compact
    pg.goto('http://127.0.0.1:8766/#l-covered-call'); pg.wait_for_selector('.offq.compact', timeout=15000)
    check('saved' in pg.inner_text('.offq.compact') and not pg.is_disabled('.offq.compact button[data-oq="del"]'), 'lesson page shows the compact bar with delete enabled: ' + pg.inner_text('.offq.compact').replace('\n', ' | '))
    pg.locator('.offq.compact').screenshot(path=__import__('os').path.join(__import__('tempfile').gettempdir(), 'lesson_compact.png'))
    # profile, guest
    pg.goto('http://127.0.0.1:8766/#profile'); pg.wait_for_selector('.offq', timeout=15000)
    check('Listen offline' in pg.inner_text('.offq'), 'profile page shows the card for a guest')
    pg.click('button[data-oq="del"]'); check('Tap again' in pg.inner_text('button[data-oq="del"]'), 'first tap asks to confirm')
    pg.click('button[data-oq="del"]'); pg.wait_for_function("document.querySelector('button[data-oq=\"del\"]').disabled", timeout=10000)
    check('0 of' in pg.inner_text('.offq'), 'second tap deletes everything and greys the button out again')
    n = pg.evaluate("caches.open('fb-audio-v1').then(c=>c.keys()).then(k=>k.length).catch(()=>-1)")
    keys = pg.evaluate("caches.keys()")
    check(not any('audio' in k for k in keys) or n == 0, f'audio cache is empty ({keys})')
    pg.locator('.offq').screenshot(path=__import__('os').path.join(__import__('tempfile').gettempdir(), 'profile_card.png'))
    # offline page: red delete greyed out when nothing saved
    pg.goto('http://127.0.0.1:8766/#offline'); pg.wait_for_selector('[data-off-act="rmall"]', timeout=15000)
    check(pg.is_disabled('[data-off-act="rmall"]'), 'Offline page: delete all is greyed out with nothing saved')
    # phone width, lessons list
    m = ctx.new_page(); m.set_viewport_size({'width': 390, 'height': 844}); m.goto('http://127.0.0.1:8766/#lessons'); m.wait_for_selector('.offq')
    check(m.evaluate('document.documentElement.scrollWidth') <= 390, 'no sideways scroll on a phone')
    m.locator('.offq').screenshot(path=__import__('os').path.join(__import__('tempfile').gettempdir(), 'lessons_phone.png'))
    check(not errs, 'no page errors ' + '; '.join(errs[:3]))
    b.close()
srv.shutdown()
print('ALL PASSED' if ok else 'SOME FAILED'); sys.exit(0 if ok else 1)
