"""Build FiredBunny from src/.

Outputs
  dist/                    the deployable website: index.html (styles, loading screen), app.<hash>.js (every script),
                           sw.js (the service worker that makes it fast and offline), everything in public/ (audio,
                           fonts, icons, _headers, robots.txt, manifest), and, from tools/prerender.py, one pre-built
                           page per address (dist/lessons/<slug>/index.html ...), 404.html and sitemap.xml
  build/fragment.html      the same page as a fragment, for publishing as a claude.ai artifact
Usage: python3 tools/build.py [--no-mods] [--mods mod-a.js,mod-b.js] [--no-prerender]
The build itself uses only the Python standard library; the pre-built pages need Playwright (pip install playwright).
In CI (the CI environment variable is set) a failed prerender fails the build, so a site without its pages is never
deployed. Search metadata comes from src/seo.js (see tools/seohead.py).
"""
import os, sys, re, glob, shutil, hashlib, json, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seohead

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
read = lambda f: open(os.path.join(SRC, f), encoding='utf-8').read()
if '--no-mods' in sys.argv:
    mods = []
elif '--mods' in sys.argv:
    mods = sys.argv[sys.argv.index('--mods') + 1].split(',')
else:
    order = ['mod-options.js', 'mod-charts.js', 'mod-risk.js', 'mod-company.js', 'mod-play.js', 'mod-indicator.js']
    found = [os.path.basename(p) for p in glob.glob(os.path.join(SRC, 'mod-*.js'))]
    mods = [m for m in order if m in found] + sorted(m for m in found if m not in order)

def script(name):
    body = read(name).replace('</script', '<\\/script')
    return f'<script>/* {name} */\n{body}\n</script>'

GOOGLE_FONTS = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap">
'''
# the running-bunny loading screen: its style comes first and its markup opens the body, so it shows while the
# rest of the page (mostly scripts) downloads; pages.js removes it once the site has drawn
HEAD = f'''<title>FiredBunny</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="FiredBunny: the money school they skipped. Learn trading, macro, crypto, retirement and FIRE by playing with interactive lessons, tools and a self-assessment.">
<style>
{read('loader.css')}</style>
{GOOGLE_FONTS}<style>
{read('style.css')}
</style>
'''
# every script of the site, in load order
SCRIPTS = ['core.js', 'brand.js', 'content.js', 'content-money.js', 'content-macro.js', 'content-realco.js', 'content-toolguide.js', 'account.js',
           'assets.js', 'routes.js'] + mods + ['hero.js', 'seo.js', 'pages.js']
BODY = read('loader.html') + '<main id="view" class="view" tabindex="-1"></main>\n' + '\n'.join(script(n) for n in SCRIPTS) + '\n'


# 1) claude.ai artifact fragment (the artifact host adds the document skeleton)
os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
frag = HEAD + BODY
frag_out = os.path.join(ROOT, 'build', 'fragment.html')
open(frag_out, 'w', encoding='utf-8').write(frag)

# 2) the website: a complete HTML document plus public/ assets. It hosts its own fonts (public/fonts, src/fonts.css)
#    instead of Google Fonts and has a service worker (src/sw.js -> dist/sw.js), so it works offline.
pub = os.path.join(ROOT, 'public')
def file_hash(path):
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()[:10]
# every audio file with its size and content hash: the page versions audio URLs (?v=) and offers them for download
assets = {}
for path in sorted(glob.glob(os.path.join(pub, 'audio', '**', '*.*'), recursive=True)):
    rel = os.path.relpath(path, pub).replace(os.sep, '/')
    assets[rel] = [os.path.getsize(path), file_hash(path)]
fonts_css = read('fonts.css') if os.path.exists(os.path.join(SRC, 'fonts.css')) else ''
# All scripts go into one file named by its content (app.<hash>.js): the page itself stays small, so the loading screen
# paints at once, and browsers keep a compiled copy of the script between visits. Each module is wrapped so one that
# fails cannot stop the others, as separate <script> tags did.
def module(name):
    return f'/* {name} */\ntry {{\n{read(name)}\n}} catch (e) {{ console.error("[FiredBunny] {name} failed to start", e); }}\n'
app_js = ''.join(module(n) for n in SCRIPTS)
# Large inline images (the bunny art, the apps mockup) become files under /img: the script gets ~300 KB lighter and the
# images load alongside it. The claude.ai copy keeps them inline (it has no files).
images = {}
def _extract(m):
    data = base64.b64decode(m.group(2))
    ext = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png'}.get(m.group(1), 'bin')
    name = '/img/' + hashlib.sha1(data).hexdigest()[:10] + '.' + ext
    images[name] = data
    return name
app_js = re.sub(r'data:(image/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]{4000,})', _extract, app_js)
app_name = 'app.' + hashlib.sha1(app_js.encode('utf-8')).hexdigest()[:10] + '.js'
# fonts the first screen uses: fetched straight away so text never repaints in a fallback font
# (the home page uses all ten latin faces; the latin-ext and greek files load only when a page needs them). Measured in
# Nov 2026: preloading only the seven faces visible above the fold made start-up longer (fonts arriving during the first
# render cost a second layout: +~300 ms blocking at 4x CPU), and a low-priority script preload changed nothing, so both
# stay as they are.
PRELOAD_FONTS = sorted(os.path.basename(f)[:-6] for f in glob.glob(os.path.join(pub, 'fonts', '*-latin-[0-9]*.woff2')))
preloads = ''.join(f'<link rel="preload" href="/fonts/{f}.woff2" as="font" type="font/woff2" crossorigin>\n' for f in PRELOAD_FONTS
                   if os.path.exists(os.path.join(pub, 'fonts', f + '.woff2')))
# No preload for the script (see the starter below): Lighthouse and PageSpeed Insights treat any request that starts
# before the first paint as something the paint waited for. The pre-built page is complete and its links work without it.
web_head = HEAD.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
# the title, description and link-preview tags go in the <!--seo--> block (tools/seohead.py), one per page
web_head = re.sub(r'<title>.*?</title>\n<meta name="description"[^>]*>\n', '', web_head, count=1)
if fonts_css:
    # 'block' instead of 'swap': text waits for its font (preloaded, then saved on the device) instead of showing in a
    # fallback font first and visibly changing
    web_head = web_head.replace(GOOGLE_FONTS, f'{preloads}<style>\n{fonts_css.replace("font-display:swap", "font-display:block")}</style>\n')
web_head = web_head.replace('<style>', '<style data-fb="base">')
# start the site only after the loading screen has painted
starter = f"""<script>(function () {{
  var started = false;
  function start() {{
    if (started) return; started = true;
    var s = document.createElement('script'); s.src = '/{app_name}';
    s.onerror = function () {{ var m = document.querySelector('#boot .boot-msg'); if (m) m.innerHTML = '<span class="boot-err">FiredBunny could not load. Check your connection, then reload.</span>'; }};
    document.body.appendChild(s);
  }}
  // The large script is requested only after the pre-built page has painted with its fonts. Lighthouse and PageSpeed
  // Insights simulate a slow phone from a fast load and count every request that starts before the first paint as
  // something it waited for: with the script fetched early they reported 10-25 s first paint and LCP, although real
  // browsers paint the pre-built page first either way (measured Nov 2026, docs/search-optimization/FINAL_AUDIT.md E).
  // Cost: the live page takes over about 0.1-0.5 s later. So: lay the page out (which requests its fonts), wait for
  // them, then two frames, then load the script.
  function afterPaint() {{ requestAnimationFrame(function () {{ requestAnimationFrame(function () {{ setTimeout(start, 0); }}); }}); }}
  try {{ void document.body.offsetHeight; document.fonts.ready.then(afterPaint, afterPaint); }} catch (e) {{ afterPaint(); }}
  setTimeout(start, 3000); // a tab opened in the background gets no frames; slow fonts never hold the site back for long
}})();</script>
"""
web_body = read('loader.html') + '<main id="view" class="view" tabindex="-1"></main>\n' + starter
version = hashlib.sha1((web_head + web_body + app_js + json.dumps(assets, sort_keys=True) + read('sw.js')).encode('utf-8')).hexdigest()[:12]
asset_js = '<script>window.FB_ASSETS=' + json.dumps({'v': version, 'files': assets}, separators=(',', ':')) + ';</script>\n'
page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0f19">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="FiredBunny">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
{seohead.block({})}{asset_js}{web_head}</head>
<body>
{web_body}</body>
</html>
"""
dist = os.path.join(ROOT, 'dist')
if os.path.isdir(dist):
    shutil.rmtree(dist)
if os.path.isdir(pub):
    shutil.copytree(pub, dist)
else:
    os.makedirs(dist)
out = os.path.join(dist, 'index.html')
open(out, 'w', encoding='utf-8').write(page)
# unknown addresses get this page with a 404 status (wrangler.jsonc not_found_handling); the prerender adds its picture
open(os.path.join(dist, '404.html'), 'w', encoding='utf-8').write(seohead.replace(page, seohead.block(
    {'title': 'Page not found · FiredBunny', 'description': 'This page does not exist. Browse the lessons and tools instead.', 'robots': 'noindex, follow', 'canonical': '', 'url': ''})))
open(os.path.join(dist, app_name), 'w', encoding='utf-8').write(app_js)
for name, data in images.items():
    os.makedirs(os.path.join(dist, 'img'), exist_ok=True)
    open(os.path.join(dist, name.lstrip('/')), 'wb').write(data)
# the service worker: saves the page, fonts, icons and manifest at install (audio only when the visitor asks)
shell = ['/', '/' + app_name, '/site.webmanifest'] + sorted('/' + os.path.relpath(p, dist).replace(os.sep, '/') for p in
        glob.glob(os.path.join(dist, 'img', '*.*')) + glob.glob(os.path.join(dist, 'fonts', '*.woff2')) + glob.glob(os.path.join(dist, '*.png')) + glob.glob(os.path.join(dist, '*.svg')))
# pre-build the home page into index.html when a headless browser is available (tools/prerender.py)
if '--no-prerender' not in sys.argv:
    from prerender import prerender
    strict = bool(os.environ.get('CI'))
    if not prerender(dist, strict=strict) and strict:
        sys.exit('The pages could not be pre-built, so this build must not be deployed (see the messages above).')
    # search checks on the result (tools/seo_check.py): in CI an error stops the deploy
    import seo_check
    if seo_check.main(dist) and strict:
        sys.exit('The search checks failed, so this build must not be deployed (see the messages above).')
sw = '/* Generated by tools/build.py from src/sw.js. */\nconst BUILD = ' + json.dumps({'version': version, 'shell': shell}) + ';\n' + read('sw.js')
open(os.path.join(dist, 'sw.js'), 'w', encoding='utf-8').write(sw)
print(out, f'{len(page)/1024:.0f} KB + {app_name} {len(app_js)/1024:.0f} KB;', frag_out, f'{len(frag)/1024:.0f} KB;', f'version {version}, {len(shell)} files saved for offline;',
      'modules:', ', '.join(mods) or '(none)')
