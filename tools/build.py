"""Build FiredBunny from src/.

Outputs
  dist/                    the deployable website (Cloudflare Pages output directory): a full index.html plus
                           everything in public/ (audio, icons, _headers, robots.txt, manifest)
  build/fragment.html      the same page as a fragment, for publishing as a claude.ai artifact
Usage: python3 tools/build.py [--no-mods] [--mods mod-a.js,mod-b.js]
Only the Python standard library is used, so it runs on Cloudflare's build image as is.
Optional env: SITE_URL (e.g. https://firedbunny.com) for absolute social-preview links; on Cloudflare Pages the
deployment URL (CF_PAGES_URL) is used when SITE_URL is not set.
"""
import os, sys, glob, shutil

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

HEAD = f'''<title>FiredBunny</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="FiredBunny: the money school they skipped. Learn trading, macro, crypto, retirement and FIRE by playing with interactive lessons, tools and a self-assessment.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,700&display=swap">
<style>
{read('style.css')}
</style>
'''
BODY = f'''<main id="view" class="view" tabindex="-1"></main>
{script('core.js')}
{script('brand.js')}
{script('content.js')}
{script('content-money.js')}
{script('content-macro.js')}
{script('content-realco.js')}
{script('account.js')}
{script('assets.js')}
{chr(10).join(script(m) for m in mods)}
{script('hero.js')}
{script('pages.js')}
'''

DESC = 'FiredBunny: the money school they skipped. Learn trading, macro, crypto, retirement and FIRE by playing with interactive lessons, tools and a self-assessment.'
site = (os.environ.get('SITE_URL') or os.environ.get('CF_PAGES_URL') or '').rstrip('/')
og_img = (site + '/og-image.jpg') if site else '/og-image.jpg'

# 1) claude.ai artifact fragment (the artifact host adds the document skeleton)
os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
frag = HEAD + BODY
frag_out = os.path.join(ROOT, 'build', 'fragment.html')
open(frag_out, 'w', encoding='utf-8').write(frag)

# 2) the website: a complete HTML document plus public/ assets
web_head = HEAD.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
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
<meta property="og:type" content="website">
<meta property="og:site_name" content="FiredBunny">
<meta property="og:title" content="FiredBunny: the money school they skipped">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="{og_img}">
{'<meta property="og:url" content="' + site + '/">' if site else ''}
<meta name="twitter:card" content="summary_large_image">
{web_head}</head>
<body>
{BODY}</body>
</html>
"""
dist = os.path.join(ROOT, 'dist')
if os.path.isdir(dist):
    shutil.rmtree(dist)
pub = os.path.join(ROOT, 'public')
if os.path.isdir(pub):
    shutil.copytree(pub, dist)
else:
    os.makedirs(dist)
out = os.path.join(dist, 'index.html')
open(out, 'w', encoding='utf-8').write(page)
print(out, f'{len(page)/1024:.0f} KB;', frag_out, f'{len(frag)/1024:.0f} KB;', 'modules:', ', '.join(mods) or '(none)')
