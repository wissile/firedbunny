"""Pre-build every page of the site as static HTML, so each address answers with its own content on the first paint
(like a server-rendered site) and search engines read real pages instead of an empty shell.

Run by tools/build.py after it writes dist/. It opens the built site in a headless browser (the system Chrome, or
Playwright's own Chromium), then visits every page through the router (SML.routes.all()) and writes:
  - dist/<path>/index.html for each page (dist/index.html for the home page), with
      * its own title, description, canonical address, robots, link-preview tags and JSON-LD (src/seo.js, written by
        tools/seohead.py),
      * the header, page and footer as static HTML inside <div id="pre">, shown until the script takes over (pages.js
        swaps it for the live page in the same frame), and
      * the rules it uses from the styles the modules add at runtime (for every screen width), inlined so the
        snapshot looks right before any script runs;
    per-visitor pages (dashboard, settings...) get the shell with noindex and no snapshot;
  - dist/404.html: the Not found page, served with a 404 status for unknown addresses;
  - dist/sitemap.xml: every indexable page with the date its content last changed.

lastmod: the date of a page's last content change is kept in tools/seo-lastmod.json as {path: {h: hash, d: date}}. The
hash covers the page's text (interactive widgets left out). When it changes, the date becomes today; a page seen for
the first time takes the last git commit date of the file that defines it. Build before committing a content change
(CLAUDE.md) so the updated file goes in with it.

A link to another page shows the loading screen instead of the snapshot (the head script compares the address with
the page's own). Needs `pip install playwright`; without it the site builds without pre-built pages (local use only:
in CI tools/build.py fails the build).
"""
import datetime, functools, hashlib, html, http.server, json, os, re, subprocess, sys, threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seohead

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LASTMOD_FILE = os.path.join(ROOT, 'tools', 'seo-lastmod.json')
ORIGIN = 'https://firedbunny.com'

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
  // the page's text for lastmod: interactive widgets, charts and live parts (data-volatile: countdowns, the month on
  // show) left out, so only real edits change it
  const t = document.getElementById('view').cloneNode(true);
  t.querySelectorAll('[data-widget], [data-volatile], svg, canvas, script, style, [aria-live], .ticker, .ticker-track, .nar').forEach((x) => x.remove());
  const text = (t.textContent || '').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return { css, all, text, words, title: document.title, html: keep(document.querySelector('body > header.nav')) + view.outerHTML + keep(document.querySelector('body > footer.foot')) };
}"""

# draw one page through the router and wait until it (and its widgets) have painted
GO_JS = r"""async (tok) => {
  await new Promise((done) => {
    const on = (e) => { if (e.detail && e.detail.tok === tok) { document.removeEventListener('sml:route', on); done(); } };
    document.addEventListener('sml:route', on);
    if (tok === 'not-found') { history.pushState(null, '', '/__fb-not-found__/'); SML.route(); } else SML.go(tok);
  });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 120));
  return true;
}"""


def _git_date(path):
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path], cwd=ROOT, capture_output=True, text=True, timeout=20).stdout.strip()
        return out or None
    except Exception:
        return None


def _seed_dates(routes):
    """First-seen date for each token: the last commit of the file that defines it (a lesson, tool or note in the content
    and module files; a named page in its module). Pages drawn by code files (the router, the home page, the glossary
    and tools hubs) and courses and tracks take the newest date of the content they show."""
    src = os.path.join(ROOT, 'src')
    CODE = {'pages.js', 'routes.js', 'seo.js', 'core.js', 'account.js', 'sw.js', 'mod-a-analytics.js', 'brand.js', 'hero.js'}
    toks = {r['tok'] for r in routes}
    where = {}
    for f in sorted(os.listdir(src)):
        if not f.endswith('.js') or f in CODE:
            continue
        body = open(os.path.join(src, f), encoding='utf-8').read()
        for m in re.finditer(r"""['"]((?:l|tool|post)-[A-Za-z0-9-]+)['"]""", body):  # id: 'l-x', or T('wealth', 'tool-x', ...)
            if m.group(1) in toks:
                where.setdefault(m.group(1), f)
        for m in re.finditer(r"""SML\.pages(?:\.([A-Za-z]\w*)|\[['"]([\w-]+)['"]\])\s*=""", body):
            where.setdefault(m.group(1) or m.group(2), f)
    cache, dates = {}, {}
    def date_of(f):
        if f not in cache:
            cache[f] = _git_date(os.path.join('src', f))
        return cache[f]
    for r in routes:
        f = where.get(r['tok'])
        if f:
            dates[r['tok']] = date_of(f)
    for r in routes:  # courses: newest lesson
        if r['tok'].startswith('c-'):
            ds = [dates.get(l) for l in r.get('lessons', []) if dates.get(l)]
            if ds: dates[r['tok']] = max(ds)
    for r in routes:  # tracks: newest course
        if r['tok'].startswith('track-'):
            ds = [dates.get('c-' + c) for c in r.get('courses', []) if dates.get('c-' + c)]
            if ds: dates[r['tok']] = max(ds)
    content = [d for t, d in dates.items() if d and re.match(r'(l|tool|post)-', t)]
    newest = max(content) if content else None
    for r in routes:  # everything else (home, hubs drawn by pages.js): the newest content date
        if not dates.get(r['tok']) and newest:
            dates[r['tok']] = newest
    return dates


def _head_js(path, tok, named):
    """Show the snapshot only at its own address: any other path (the offline copy serves the home document for every
    address) or an old #token link shows the loading screen until the script draws the right page."""
    pat = '^(?:l-|c-|tool-|track-|post-)[\\w.~-]+$|^(?:' + '|'.join(re.escape(n) for n in named) + ')$'
    # /learn/ shows the visitor's own track: its Trading snapshot only fits visitors who have not picked another one
    own = ("try{var t=localStorage.getItem('sml:track');if(t&&JSON.parse(t)!=='trading')d.classList.add('fb-deep')}catch(e){}" if tok == 'learn' else '')
    return ("<script>(function(){var d=document.documentElement,p=location.pathname.replace(/index\\.html?$/,'');"
            "if(p.slice(-1)!=='/')p+='/';var h=location.hash.slice(1);"
            f"if(p.toLowerCase()!=={json.dumps(path)}||(h&&h!=={json.dumps(tok)}&&/{pat}/.test(h)))d.classList.add('fb-deep');{own}}})()</script>\n")


def _with_snapshot(page_html, snap, head_js):
    style = ('<style data-fb="pre">\n' + snap['css'] + '\n'
             'html:not(.fb-deep) #boot{display:none}\n.fb-deep #pre{display:none}\n'
             '#pre .pre-view{animation:none}\n</style>\n')
    page_html = page_html.replace('</head>', head_js + style + '</head>', 1)
    return page_html.replace('<div id="boot"', '<div id="pre">' + snap['html'] + '</div>\n<div id="boot"', 1)


def _out_path(dist, path):
    return os.path.join(dist, 'index.html') if path == '/' else os.path.join(dist, path.strip('/'), 'index.html')


def prerender(dist, strict=False):
    say = lambda *a: print('prerender:', *a)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        say('skipped: Playwright is not installed (pip install playwright); only the home shell was built')
        return False
    template = open(os.path.join(dist, 'index.html'), encoding='utf-8').read()
    if seohead.START not in template or '<div id="boot"' not in template or '</head>' not in template:
        say('skipped: unexpected page layout')
        return False

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=dist))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/'
    errors, snaps, metas = [], {}, {}
    try:
        with sync_playwright() as p:
            browser = None
            for opts in ({'channel': 'chrome'}, {}):
                try:
                    browser = p.chromium.launch(**opts); break
                except Exception:
                    continue
            if not browser:
                say('skipped: no browser could start')
                return False
            ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, service_workers='block')
            page = ctx.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(url)
            page.wait_for_selector('#view section', timeout=60000)
            page.wait_for_function("() => !document.getElementById('boot') && document.fonts.status === 'loaded'", timeout=30000)
            page.wait_for_timeout(300)
            routes = page.evaluate("""() => SML.routes.all().map((t) => ({ tok: t, path: SML.routes.path(t), private: SML.routes.isPrivate(t),
              lessons: t.indexOf('c-') === 0 ? SML.lessons.filter((l) => l.course === t.slice(2)).map((l) => l.id) : [],
              courses: t.indexOf('track-') === 0 ? SML.courses.filter((c) => (c.track || 'trading') === t.slice(6)).map((c) => c.id) : [] }))""")
            named = page.evaluate("() => SML.routes.all().filter((t) => !/^(l|c|tool|track|post)-/.test(t))")
            unfrozen = page.evaluate('() => SML.routes.unfrozen()')
            if unfrozen:
                say(f'{len(unfrozen)} page(s) have an automatic address; add them to FROZEN in src/routes.js:', ', '.join(unfrozen))
            for r in routes + [{'tok': 'not-found', 'path': None, 'private': False}]:
                tok = r['tok']
                page.evaluate(GO_JS, tok)
                metas[tok] = page.evaluate('(t) => Object.assign(SML.seo.meta(t, null), { title: document.title })', tok)
                if not r['private']:
                    snaps[tok] = page.evaluate(SNAPSHOT_JS)
            # lastmod: content hash against tools/seo-lastmod.json
            try:
                book = json.load(open(LASTMOD_FILE, encoding='utf-8'))
            except Exception:
                book = {}
            today = datetime.date.today().isoformat()
            seeds = None
            changed, lastmod = [], {}
            for r in routes:
                if r['private'] or not metas[r['tok']]['indexable']:
                    continue
                h = hashlib.sha1(snaps[r['tok']]['text'].encode('utf-8')).hexdigest()[:16]
                old = book.get(r['path'])
                if old and old.get('h') == h:
                    d = old['d']
                elif old:
                    d = today; changed.append(r['path'])
                else:
                    if seeds is None:
                        seeds = _seed_dates(routes)
                    d = seeds.get(r['tok']) or today
                book[r['path']] = {'h': h, 'd': d}
                lastmod[r['tok']] = d
            lds = page.evaluate('(lm) => Object.fromEntries(Object.keys(lm).map((t) => [t, SML.seo.jsonld(t, { lastmod: lm[t] })]))',
                                {r['tok']: lastmod.get(r['tok']) for r in routes if not r['private']})
            browser.close()
    except Exception as e:
        say('failed:', str(e).splitlines()[0][:300])
        return False
    finally:
        srv.shutdown()
    if errors:
        say('failed: the pages reported script errors:', errors[:3])
        return False
    empty = [t for t, s in snaps.items() if s['words'] < 20 and t != 'not-found']
    if empty:
        say('failed: these pages drew (almost) nothing:', empty[:10])
        return False

    # write the pages
    total = 0
    for r in routes:
        tok, path = r['tok'], r['path']
        doc = seohead.replace(template, seohead.block(metas[tok], lds.get(tok, []), tok))
        if not r['private']:
            doc = _with_snapshot(doc, snaps[tok], _head_js(path, tok, named))
        out = _out_path(dist, path)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(doc)
        total += len(doc)
    # the Not found page: its picture shows at any address (unless an old #token link asks for a real page)
    nf = metas['not-found']; nf.update({'canonical': '', 'url': ''})
    doc = seohead.replace(template, seohead.block(nf, [], 'not-found'))
    nf_js = _head_js('/__any__/', 'not-found', named).replace("p.toLowerCase()!==\"/__any__/\"||", '')
    open(os.path.join(dist, '404.html'), 'w', encoding='utf-8').write(_with_snapshot(doc, snaps['not-found'], nf_js))
    # the sitemap: indexable pages only (no per-visitor pages, no pages that point elsewhere with a canonical)
    items = [f'  <url><loc>{html.escape(ORIGIN + r["path"])}</loc><lastmod>{lastmod[r["tok"]]}</lastmod></url>' for r in routes if r['tok'] in lastmod]
    open(os.path.join(dist, 'sitemap.xml'), 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(items) + '\n</urlset>\n')
    book = {k: book[k] for k in sorted(book) if any(r['path'] == k for r in routes)}
    try:
        with open(LASTMOD_FILE, 'w', encoding='utf-8') as f:
            json.dump(book, f, indent=0, sort_keys=True); f.write('\n')
    except OSError as e:
        say('could not update', LASTMOD_FILE, e)
    if changed:
        say(f'{len(changed)} page(s) changed content (lastmod {today}); commit tools/seo-lastmod.json with the change:', ', '.join(changed[:8]) + (' ...' if len(changed) > 8 else ''))
    say(f"{len(routes)} pages written ({total // 1024} KB of HTML), {len(items)} in sitemap.xml, 404.html")
    return True
