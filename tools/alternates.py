"""hreflang links between FiredBunny's languages (docs/i18n/README.md), run by tools/build.py after every language is
pre-built. For each page that exists in English and in at least one live language, every version gets
<link rel="alternate" hreflang="..."> to all the others plus x-default (English), inside its <!--seo--> block. Live
languages' sitemaps are listed in robots.txt. A language that isn't live gets nothing, so search engines never meet it."""
import json, os, re, html

ORIGIN = 'https://firedbunny.com'


def main(dist, langs):
    live = {k: v for k, v in langs.items() if v.get('live')}
    robots = os.path.join(dist, 'robots.txt')
    if not live:
        return 0
    paths = {'en': json.load(open(os.path.join(dist, '.paths.json')))}
    for k, v in live.items():
        f = os.path.join(dist, v['prefix'].strip('/'), '.paths.json')
        if os.path.exists(f):
            paths[k] = json.load(open(f))
    tags = {'en': 'en'}; tags.update({k: v['hreflang'] for k, v in live.items()})
    done = 0
    for tok, en_path in paths['en'].items():
        vers = {k: p[tok] for k, p in paths.items() if tok in p}
        if len(vers) < 2:
            continue
        links = ''.join(f'<link rel="alternate" hreflang="{tags[k]}" href="{html.escape(ORIGIN + p)}">\n' for k, p in sorted(vers.items()))
        links += f'<link rel="alternate" hreflang="x-default" href="{html.escape(ORIGIN + en_path)}">\n'
        for k, p in vers.items():
            out = os.path.join(dist, p.strip('/'), 'index.html') if p != '/' else os.path.join(dist, 'index.html')
            if not os.path.exists(out):
                continue
            doc = open(out, encoding='utf-8').read()
            doc = re.sub(r'<link rel="alternate" hreflang="[^"]+" href="[^"]+">\n', '', doc)
            doc = doc.replace('<!--/seo-->', links + '<!--/seo-->', 1)
            open(out, 'w', encoding='utf-8').write(doc); done += 1
    if os.path.exists(robots):
        txt = open(robots, encoding='utf-8').read()
        for k, v in live.items():
            line = f'Sitemap: {ORIGIN}{v["prefix"]}/sitemap.xml'
            if line not in txt:
                txt = txt.rstrip('\n') + '\n' + line + '\n'
        open(robots, 'w', encoding='utf-8').write(txt)
    print(f'alternates: hreflang added to {done} pages across {", ".join(paths)}')
    return done
