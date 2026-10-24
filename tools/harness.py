"""Test harness for one or more lesson modules.

Usage:  python3 /home/claude/site/tools/harness.py mod-charts.js [more modules...] [--only widgetName,...] [--no-shots]

Builds a test page (style.css + core.js + content.js if present + the modules), then for every lesson the
modules register it renders title, idea, the widget(s), body, points and quiz. Widgets the modules define but no
lesson uses are mounted standalone. Then:
  * fuzzes every control (ranges to min/max/mid, every seg button, chips twice, plain buttons) and reports JS errors
  * checks the page never scrolls sideways at 1100px and 360px
  * screenshots each widget at 1100px (light) and 360px (dark) into /home/claude/site/shots/<module>/
"""
import sys, os, json, re
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
only = None
for i, a in enumerate(sys.argv):
    if a == '--only' and i + 1 < len(sys.argv):
        only = set(sys.argv[i + 1].split(','))
        args = [x for x in args if x != sys.argv[i + 1]]
shots = '--no-shots' not in sys.argv
pages = None
for i, a in enumerate(sys.argv):
    if a == '--pages' and i + 1 < len(sys.argv):
        pages = sys.argv[i + 1].split(',')
        args = [x for x in args if x != sys.argv[i + 1]]
mods = args
src = lambda f: open(os.path.join(ROOT, 'src', f)).read()
css = src('style.css')
js = src('core.js') + '\n' + src('brand.js')
if os.path.exists(os.path.join(ROOT, 'src', 'content.js')):
    js += '\n' + src('content.js')
if os.path.exists(os.path.join(ROOT, 'src', 'content-money.js')):
    js += '\n' + src('content-money.js')
if os.path.exists(os.path.join(ROOT, 'src', 'content-macro.js')):
    js += '\n' + src('content-macro.js')
if os.path.exists(os.path.join(ROOT, 'src', 'content-realco.js')):
    js += '\n' + src('content-realco.js')
if os.path.exists(os.path.join(ROOT, 'src', 'account.js')):
    js += '\n' + src('account.js')
before = "window.__before = Object.keys(SML.widgets);"
mod_js = '\n'.join(src(m) for m in mods)
harness = r"""
(function(){
  const S = window.SML, view = document.getElementById('view');
  const mine = Object.keys(S.widgets).filter(k => window.__before.indexOf(k) < 0);
  const lessons = S.lessons.slice().sort((a,b)=> (a.course>b.course?1:a.course<b.course?-1:(a.order||0)-(b.order||0)));
  const used = new Set();
  let h = '';
  const only = window.__only;
  lessons.forEach(l => {
    const ws = [{widget:l.widget, opts:l.opts, try:l.try}].concat(l.extra||[]);
    if (only && !ws.some(w => only.indexOf(w.widget) >= 0)) return;
    ws.forEach(w => used.add(w.widget));
    h += `<section class="lessonprev" style="display:flex;flex-direction:column;gap:14px;padding:28px 0;border-bottom:2px solid var(--ink)">
      <div class="meta">${l.course} · #${l.order} · ${l.id} · ${l.mins} min · ${l.level}</div>
      <h2 class="l-title">${l.title}</h2><p class="idea">${l.idea}</p>
      ${ws.map(w => `<div class="try"><div class="try-h">Try it</div><p class="try-p">${w.try||''}</p>${S.widgetHTML(w.widget, w.opts)}</div>`).join('')}
      <div class="prose">${(l.body||[]).join('')}</div>
      ${l.example ? `<div class="takeaways"><h3>Worked example: ${l.example.title||''}</h3>${l.example.intro?`<p>${l.example.intro}</p>`:''}<ol>${(l.example.steps||[]).map(x=>`<li>${x}</li>`).join('')}</ol>${l.example.result?`<p><b>${l.example.result}</b></p>`:''}</div>` : '<p class="note" style="color:var(--down)">NO WORKED EXAMPLE</p>'}
      <div class="takeaways"><h3>Common mistakes</h3>${(l.mistakes||[]).length ? S.ui.ticks(l.mistakes) : '<p class="note" style="color:var(--down)">NO MISTAKES</p>'}</div>
      <div class="takeaways"><h3>Takeaways</h3>${S.ui.ticks(l.points||[])}</div>
      <p class="note">local glossary: ${(l.glossary||[]).map(g=>g.t).join(', ')}</p>
      <p class="note" style="overflow-wrap:anywhere">sources: ${(l.sources||[]).map(x=>x.t+' ('+x.u+')').join(' | ') || 'none'}</p>
      <div class="quiz"><h3>Quick check</h3><p class="quiz-q">${l.quiz?l.quiz.q:'(no quiz)'}</p>${l.quiz?l.quiz.options.map((o,i)=>`<div class="qopt">${i===l.quiz.answer?'✔ ':''}${o}</div>`).join(''):''}<p class="note">${l.quiz?l.quiz.why:''}</p></div>
      <p class="note">terms: ${(l.terms||[]).map(t => S.glossary.some(g => g.t === t) ? t : '<b style="color:var(--down)">MISSING:' + t + '</b>').join(', ')}</p></section>`;
  });
  mine.filter(w => !used.has(w) && (!only || only.indexOf(w)>=0)).forEach(w => { h += `<section style="padding:28px 0"><div class="meta">standalone widget: ${w}</div>${S.widgetHTML(w)}</section>`; });
  view.innerHTML = h;
  S.mount(view);
  window.__mine = mine; window.__lessonCount = lessons.length;
})();
"""
page = f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>{open(os.path.join(ROOT, 'tools', 'localfonts.css')).read()}</style><style>:root{{color-scheme:light}}body{{margin:0;font:14px system-ui}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
<style>{css}</style></head><body><main class="wrap" id="view" style="padding-block:20px;max-width:900px"></main>
<script>{js}\n{before}\nwindow.__only = {json.dumps(sorted(only)) if only else 'null'};\n{mod_js}\n{harness}</script></body></html>"""
os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
tag = re.sub(r'[^a-z0-9]+', '-', '-'.join(m.replace('.js', '') for m in mods).lower()).strip('-') or 'core'
outdir = os.path.join(ROOT, 'shots', tag)
os.makedirs(outdir, exist_ok=True)
path = os.path.join(outdir, 'harness.html')
open(path, 'w').write(page)

FUZZ = r"""
async () => {
  const errs = [];
  const roots = Array.from(document.querySelectorAll('[data-widget]'));
  const fire = (el, t) => el.dispatchEvent(new Event(t, {bubbles:true}));
  for (const r of roots) {
    const name = r.dataset.widget;
    try {
      for (const el of r.querySelectorAll('input[type=range]')) {
        for (const v of [el.min, el.max, (Number(el.min)+Number(el.max))/2]) { el.value = v; fire(el,'input'); }
      }
      for (const el of r.querySelectorAll('input[type=number]')) { const o = el.value; el.value = '0'; fire(el,'input'); el.value = ''; fire(el,'input'); el.value = o; fire(el,'input'); }
      for (const el of r.querySelectorAll('select')) { for (const o of el.options) { el.value = o.value; fire(el,'change'); fire(el,'input'); } }
      for (const b of r.querySelectorAll('.seg button')) b.click();
      for (const b of r.querySelectorAll('.chip')) { b.click(); b.click(); }
      const btns = Array.from(r.querySelectorAll('button:not(.chip):not(.seg button)')).filter(b => !b.closest('.seg'));
      for (let k = 0; k < 3; k++) for (const b of btns) { if (!b.disabled && document.body.contains(b)) b.click(); }
      for (const b of r.querySelectorAll('.seg button')) b.click();
    } catch (e) { errs.push(name + ': ' + e.message); }
  }
  await new Promise(res => setTimeout(res, 400));
  return errs;
}
"""

RENDER_PAGE = r"""
(tok) => { const S = window.SML, view = document.getElementById('view'); S.runCleanup(); view.innerHTML = '';
  view.style.maxWidth = 'none'; view.className = '';
  const fn = S.pages[tok] || (tok.indexOf('post-') === 0 ? S.pages.post : null);
  if (!fn) return 'no page ' + tok;
  try { fn(view, tok); S.mount(view); } catch (e) { return 'render error: ' + e.message; }
  return 'ok'; }
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    report = {}
    for label, vw, scheme in [('desktop', 1100, 'light'), ('mobile', 360, 'dark')]:
        pg = b.new_page(viewport={'width': vw, 'height': 900}, color_scheme=scheme)
        errs = []
        pg.on('pageerror', lambda e, errs=errs: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m, errs=errs: errs.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        pg.goto('file://' + path)
        pg.wait_for_timeout(600)
        sw = pg.evaluate('document.documentElement.scrollWidth')
        info = pg.evaluate('({mine: window.__mine, lessons: window.__lessonCount})')
        wide = pg.evaluate("""(vw) => Array.from(document.querySelectorAll('#view *')).filter(e => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && !e.closest('.scroll') && getComputedStyle(e).position !== 'fixed'; }).slice(0,8).map(e => e.tagName + '.' + (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) + ' right=' + Math.round(e.getBoundingClientRect().right))""", vw)
        if shots:
            for el in pg.query_selector_all('[data-widget]'):
                name = el.get_attribute('data-widget')
                try:
                    el.screenshot(path=os.path.join(outdir, f'{name}-{label}.png'))
                except Exception as ex:
                    errs.append(f'screenshot {name}: {ex}')
        fz = pg.evaluate(FUZZ)
        if pages:
            for tok in pages:
                res = pg.evaluate(RENDER_PAGE, tok)
                pg.wait_for_timeout(500)
                if res != 'ok':
                    errs.append(f'page {tok}: {res}')
                    continue
                sww = pg.evaluate('document.documentElement.scrollWidth')
                if sww > vw:
                    errs.append(f'page {tok}: horizontal overflow scrollWidth={sww}')
                if shots:
                    pg.screenshot(path=os.path.join(outdir, f'page-{tok}-{label}.png'), full_page=True)
                fz += [f'[{tok}] ' + x for x in pg.evaluate(FUZZ)]
        pg.wait_for_timeout(300)
        sw2 = pg.evaluate('document.documentElement.scrollWidth')
        report[label] = {'widgets': info['mine'], 'lessons': info['lessons'], 'scrollWidth': [sw, sw2], 'viewport': vw,
                         'overflowing': wide, 'errors': errs[:30], 'fuzzErrors': fz[:30]}
        pg.close()
    b.close()
print(json.dumps(report, indent=1))
print('screenshots in', outdir)
