"""The search and link-preview tags of one page, written into its <head> between <!--seo--> and <!--/seo-->.

tools/build.py writes the home page's defaults; tools/prerender.py replaces the block in every pre-built page with the
values from src/seo.js (SML.seo.meta and SML.seo.jsonld), so the wording lives in one place."""
import html, json

START, END = '<!--seo-->', '<!--/seo-->'

DEFAULT = {
    'title': 'FiredBunny: learn trading, investing, retirement and FIRE by playing',
    'description': 'FiredBunny: the money school they skipped. Learn trading, macro, crypto, retirement and FIRE by playing with interactive lessons, tools and a self-assessment.',
    'canonical': 'https://firedbunny.com/', 'url': 'https://firedbunny.com/', 'robots': 'index, follow, max-image-preview:large', 'type': 'website',
    'image': 'https://firedbunny.com/og-image.jpg', 'imageWidth': 1200, 'imageHeight': 630, 'imageAlt': 'FiredBunny: learn the market by playing with it',
}


def block(meta, ld=(), tok=''):
    e = lambda s: html.escape(str(s), quote=True)
    m = dict(DEFAULT, **{k: v for k, v in meta.items() if v is not None})
    out = [START, f'<title>{e(m["title"])}</title>', f'<meta name="description" content="{e(m["description"])}">',
           f'<meta name="robots" content="{e(m["robots"])}">']
    if m.get('canonical'):
        out.append(f'<link rel="canonical" href="{e(m["canonical"])}">')
    out += [f'<meta property="og:type" content="{e(m["type"])}">', '<meta property="og:site_name" content="FiredBunny">', '<meta property="og:locale" content="en_US">',
            f'<meta property="og:title" content="{e(m["title"])}">', f'<meta property="og:description" content="{e(m["description"])}">']
    if m.get('url'):
        out.append(f'<meta property="og:url" content="{e(m["url"])}">')
    out += [f'<meta property="og:image" content="{e(m["image"])}">', f'<meta property="og:image:width" content="{m["imageWidth"]}">',
            f'<meta property="og:image:height" content="{m["imageHeight"]}">', f'<meta property="og:image:alt" content="{e(m["imageAlt"])}">',
            '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{e(m["title"])}">',
            f'<meta name="twitter:description" content="{e(m["description"])}">', f'<meta name="twitter:image" content="{e(m["image"])}">']
    for obj in ld or ():
        data = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
        out.append(f'<script type="application/ld+json" data-fb-tok="{e(tok)}">{data}</script>')
    out.append(END)
    return '\n'.join(out) + '\n'


def replace(page_html, new_block):
    i, j = page_html.find(START), page_html.find(END)
    if i < 0 or j < 0:
        raise ValueError('page has no <!--seo--> block')
    return page_html[:i] + new_block.rstrip('\n') + page_html[j + len(END):]
