"""Check the built site (dist/) for search problems before it is deployed.

Run by tools/build.py after the prerender (and on its own: python3 tools/seo_check.py). Exit code 1 when something is
wrong, so in CI a broken page never reaches Cloudflare. Standard library only.

Errors:
  - a sitemap URL without its pre-built file, or whose page is noindex, or whose canonical is not its own address
  - a missing or duplicate <title> / meta description among the indexable pages
  - a pre-built page without its snapshot, without exactly one <h1>, or with #token links to other pages left in it
  - JSON-LD that does not parse or has no @type
  - a per-visitor page (noindex) listed in the sitemap, or a pre-built page missing from both sitemap and noindex
  - sitemap.xml not valid, or lastmod not YYYY-MM-DD; robots.txt without the Sitemap line; 404.html without noindex
Warnings: very short or long titles and descriptions.
"""
import html, json, os, re, sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGIN = 'https://firedbunny.com'
ROUTE_LINK = re.compile(r'href="#(?:(?:l|c|tool|track|post)-[\w.~-]+|home|learn|tools|glossary|play|wheel|indicator|sheets|apps|blog|calendar|about|assessment|results|dashboard|profile|settings|signin|offline)"')


def attr(doc, pattern):
    m = re.search(pattern, doc)
    return html.unescape(m.group(1)) if m else None


def check(dist):
    errors, warnings = [], []
    err, warn = errors.append, warnings.append
    sm_path = os.path.join(dist, 'sitemap.xml')
    if not os.path.exists(sm_path):
        return [f'{sm_path} is missing (did the prerender run?)'], []
    try:
        root = ET.parse(sm_path).getroot()
    except ET.ParseError as e:
        return [f'sitemap.xml is not valid XML: {e}'], []
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = []
    for u in root.findall('s:url', ns):
        loc, lm = u.findtext('s:loc', default='', namespaces=ns), u.findtext('s:lastmod', default='', namespaces=ns)
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', lm or ''):
            err(f'sitemap: bad lastmod {lm!r} for {loc}')
        urls.append(loc)
    if len(urls) != len(set(urls)):
        err('sitemap: duplicate URLs')
    seen_titles, seen_desc = {}, {}
    pages = {}
    for dirpath, _, files in os.walk(dist):
        if 'index.html' in files and not os.path.relpath(dirpath, dist).startswith(('audio', 'img', 'fonts')):
            rel = os.path.relpath(dirpath, dist).replace(os.sep, '/')
            pages['/' if rel == '.' else '/' + rel + '/'] = os.path.join(dirpath, 'index.html')
    in_sitemap = set()
    for loc in urls:
        if not loc.startswith(ORIGIN + '/'):
            err(f'sitemap: {loc} is not on {ORIGIN}'); continue
        path = loc[len(ORIGIN):]
        in_sitemap.add(path)
        if path not in pages:
            err(f'sitemap: {loc} has no pre-built page'); continue
        doc = open(pages[path], encoding='utf-8').read()
        robots = attr(doc, r'<meta name="robots" content="([^"]*)"') or ''
        canon = attr(doc, r'<link rel="canonical" href="([^"]*)"')
        title = attr(doc, r'<title>([^<]*)</title>')
        desc = attr(doc, r'<meta name="description" content="([^"]*)"')
        if 'noindex' in robots:
            err(f'{path}: in the sitemap but noindex')
        if doc.count('rel="canonical"') != 1 or canon != loc:
            err(f'{path}: canonical {canon!r}, expected {loc}')
        if not title:
            err(f'{path}: no <title>')
        else:
            if title in seen_titles: err(f'{path}: same <title> as {seen_titles[title]}: {title!r}')
            seen_titles[title] = path
            if len(title) > 80: warn(f'{path}: long title ({len(title)}): {title}')
        if not desc:
            err(f'{path}: no meta description')
        else:
            if desc in seen_desc: err(f'{path}: same description as {seen_desc[desc]}')
            seen_desc[desc] = path
            if not 50 <= len(desc) <= 170: warn(f'{path}: description length {len(desc)}')
        pre = doc[doc.find('<div id="pre">'):doc.find('<div id="boot"')] if '<div id="pre">' in doc else ''
        if not pre:
            err(f'{path}: no pre-built snapshot')
        else:
            n_h1 = len(re.findall(r'<h1\b', pre))
            if n_h1 != 1: err(f'{path}: {n_h1} <h1> in the snapshot')
            left = ROUTE_LINK.findall(pre)
            if left: err(f'{path}: {len(left)} #token link(s) left in the snapshot, e.g. {left[0]}')
        for raw in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', doc, re.S):
            try:
                obj = json.loads(raw)
                if not isinstance(obj, dict) or '@type' not in obj: err(f'{path}: JSON-LD without @type')
            except ValueError as e:
                err(f'{path}: JSON-LD does not parse ({e})')
    for path, file in pages.items():  # every other pre-built page must be noindex or point elsewhere
        if path in in_sitemap:
            continue
        doc = open(file, encoding='utf-8').read()
        robots = attr(doc, r'<meta name="robots" content="([^"]*)"') or ''
        canon = attr(doc, r'<link rel="canonical" href="([^"]*)"')
        if 'noindex' not in robots and canon == ORIGIN + path:
            err(f'{path}: pre-built and indexable but not in the sitemap')
    robots_txt = open(os.path.join(dist, 'robots.txt'), encoding='utf-8').read() if os.path.exists(os.path.join(dist, 'robots.txt')) else ''
    if f'Sitemap: {ORIGIN}/sitemap.xml' not in robots_txt:
        err('robots.txt has no Sitemap line')
    if re.search(r'^\s*Disallow:\s*/\s*$', robots_txt, re.M):
        err('robots.txt blocks the whole site')
    nf = os.path.join(dist, '404.html')
    if not os.path.exists(nf) or 'noindex' not in open(nf, encoding='utf-8').read():
        err('404.html is missing or not noindex')
    return errors, warnings


def main(dist=None):
    dist = dist or os.path.join(ROOT, 'dist')
    errors, warnings = check(dist)
    for w in warnings[:20]:
        print('seo check warning:', w)
    for e in errors[:50]:
        print('seo check ERROR:', e)
    n = sum(1 for _ in open(os.path.join(dist, 'sitemap.xml'))) if os.path.exists(os.path.join(dist, 'sitemap.xml')) else 0
    print(f'seo check: {len(errors)} error(s), {len(warnings)} warning(s)' + ('' if errors else ' - sitemap, pages, metadata and robots look right'))
    return 0 if not errors else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
