"""Live QA probe for firedbunny.com (temporary, branch qa-probe only). Standard library only.
Writes qa.json (full results) and prints a summary. Run from GitHub Actions because the audit container cannot reach the site."""
import concurrent.futures as cf, html, json, re, socket, ssl, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

ORIGIN = 'https://firedbunny.com'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 FiredBunnyQA/1.0'
out = {'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def fetch(url, ua=UA, follow=False, method='GET', timeout=25, maxbytes=4_000_000):
    opener = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    req = urllib.request.Request(url, method=method, headers={'User-Agent': ua, 'Accept': 'text/html,application/xhtml+xml,*/*', 'Accept-Encoding': 'identity'})
    t0 = time.time()
    try:
        r = opener.open(req, timeout=timeout)
        body = r.read(maxbytes) if method == 'GET' else b''
        return {'status': r.status, 'headers': {k.lower(): v for k, v in r.headers.items()}, 'body': body.decode('utf-8', 'replace'), 'url': r.geturl(), 'ms': int((time.time() - t0) * 1000)}
    except urllib.error.HTTPError as e:
        body = e.read(maxbytes).decode('utf-8', 'replace') if method == 'GET' else ''
        return {'status': e.code, 'headers': {k.lower(): v for k, v in e.headers.items()}, 'body': body, 'url': url, 'ms': int((time.time() - t0) * 1000)}
    except Exception as e:
        return {'status': None, 'error': str(e)[:200], 'headers': {}, 'body': '', 'url': url, 'ms': int((time.time() - t0) * 1000)}


def attr(doc, pat):
    m = re.search(pat, doc)
    return html.unescape(m.group(1)) if m else None


# 1. robots.txt and sitemap
rb = fetch(ORIGIN + '/robots.txt')
out['robots'] = {'status': rb['status'], 'body': rb['body'][:4000], 'content_type': rb['headers'].get('content-type')}
sm = fetch(ORIGIN + '/sitemap.xml')
locs = re.findall(r'<loc>([^<]+)</loc>', sm['body'])
out['sitemap'] = {'status': sm['status'], 'count': len(locs), 'content_type': sm['headers'].get('content-type'), 'unique': len(set(locs))}

# 2. every sitemap URL
def page(url):
    r = fetch(url)
    d = r['body']
    pre = d[d.find('<div id="pre">'):d.find('<div id="boot"')] if '<div id="pre">' in d else ''
    text = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)\b.*?</\1>', ' ', pre, flags=re.S)))).strip()
    lds = []
    for raw in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', d, re.S):
        try:
            o = json.loads(raw); lds.append(o.get('@type'))
        except Exception as e:
            lds.append('INVALID: ' + str(e)[:80])
    links = set(re.findall(r'href="(/[^"#?]*)(?:[?#][^"]*)?"', pre))
    ext = set(u for u in re.findall(r'href="(https?://[^"]+)"', pre) if 'firedbunny.com' not in u)
    return {'url': url, 'status': r['status'], 'ms': r['ms'], 'xrobots': r['headers'].get('x-robots-tag'), 'cache': r['headers'].get('cache-control'),
            'ctype': r['headers'].get('content-type'), 'title': attr(d, r'<title>([^<]*)</title>'), 'desc': attr(d, r'<meta name="description" content="([^"]*)"'),
            'canonical': attr(d, r'<link rel="canonical" href="([^"]*)"'), 'robots': attr(d, r'<meta name="robots" content="([^"]*)"'),
            'h1': len(re.findall(r'<h1\b', pre)), 'words': len(text.split()), 'ld': lds, 'links': sorted(links), 'ext': sorted(ext), 'bytes': len(d),
            'hash_links': len(re.findall(r'href="#(?:l|c|tool|track|post)-', pre))}

with cf.ThreadPoolExecutor(8) as ex:
    pages = list(ex.map(page, locs))
out['pages'] = pages

# 3. internal link targets not in the sitemap
inlinks = {}
for p in pages:
    for l in p['links']:
        inlinks.setdefault(l, []).append(p['url'][len(ORIGIN):])
sm_paths = {u[len(ORIGIN):] for u in locs}
extra = sorted(l for l in inlinks if l not in sm_paths and not re.search(r'\.(png|jpg|svg|webp|ico|xml|txt|json|js|css|mp4|woff2|webmanifest)$', l))
def status_only(path):
    r = fetch(ORIGIN + path)
    return {'path': path, 'status': r['status'], 'location': r['headers'].get('location'), 'robots': attr(r['body'], r'<meta name="robots" content="([^"]*)"'), 'linked_from': inlinks[path][:3]}
with cf.ThreadPoolExecutor(8) as ex:
    out['links_outside_sitemap'] = list(ex.map(status_only, extra))
assets = sorted(l for l in inlinks if re.search(r'\.(png|jpg|svg|webp|ico|xml|txt|json|webmanifest)$', l))
out['asset_links'] = [{'path': a, 'status': fetch(ORIGIN + a, method='GET')['status']} for a in assets[:40]]

# 4. redirects and status codes
cases = ['http://firedbunny.com/', 'http://firedbunny.com/lessons/wheel-strategy/', 'https://www.firedbunny.com/', 'https://www.firedbunny.com/tools/position-size/?x=1',
         ORIGIN + '/lessons/wheel-strategy', ORIGIN + '/tools/position-size', ORIGIN + '/Lessons/Wheel-Strategy/', ORIGIN + '/index.html', ORIGIN + '/lessons/wheel-strategy/index.html',
         ORIGIN + '/lessons/', ORIGIN + '/tools/', ORIGIN + '/no-such-page/', ORIGIN + '/lessons/no-such-lesson/', ORIGIN + '/#l-wheel', ORIGIN + '/?utm_source=chatgpt.com',
         ORIGIN + '/dashboard/', ORIGIN + '/results/', ORIGIN + '/learn/', ORIGIN + '/404.html', ORIGIN + '/api/health', 'https://firedbunny.dosfirm.workers.dev/']
red = []
for u in cases:
    r = fetch(u)
    red.append({'url': u, 'status': r['status'], 'location': r['headers'].get('location'), 'hsts': r['headers'].get('strict-transport-security'),
                'xrobots': r['headers'].get('x-robots-tag'), 'robots': attr(r['body'], r'<meta name="robots" content="([^"]*)"'), 'canonical': attr(r['body'], r'<link rel="canonical" href="([^"]*)"'), 'error': r.get('error')})
out['redirects'] = red

# 5. crawlers and AI agents: same page for each user agent?
agents = {
    'Googlebot': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Bingbot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/130.0 Safari/537.36',
    'GPTBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
    'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
    'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
    'ClaudeBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'Claude-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)',
    'PerplexityBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
    'CCBot': 'CCBot/2.0 (https://commoncrawl.org/faq/)',
    'Applebot': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
}
bots = []
for name, ua in agents.items():
    for path in ['/', '/lessons/wheel-strategy/', '/tools/position-size/']:
        r = fetch(ORIGIN + path, ua=ua)
        bots.append({'agent': name, 'path': path, 'status': r['status'], 'has_snapshot': '<div id="pre">' in r['body'], 'title': attr(r['body'], r'<title>([^<]*)</title>'), 'bytes': len(r['body'])})
out['bots'] = bots

# 6. external links (sources), once each, browser user agent; 403/429 often means bot protection, not a dead page
ext = sorted({u for p in pages for u in p['ext']})
def ext_check(u):
    r = fetch(u, follow=True, timeout=20, maxbytes=200_000)
    return {'url': u, 'status': r['status'], 'final': r['url'] if r['url'] != u else None, 'error': r.get('error')}
with cf.ThreadPoolExecutor(10) as ex:
    out['external'] = list(ex.map(ext_check, ext))

# 7. verification files and DNS records
def dig(name, typ):
    try:
        return subprocess.run(['dig', '+short', typ, name], capture_output=True, text=True, timeout=15).stdout.strip().splitlines()
    except Exception as e:
        return [str(e)]
out['dns'] = {'TXT firedbunny.com': dig('firedbunny.com', 'TXT'), 'A firedbunny.com': dig('firedbunny.com', 'A'), 'CNAME www': dig('www.firedbunny.com', 'CNAME'),
              'A www': dig('www.firedbunny.com', 'A')}
out['verification_files'] = {p: fetch(ORIGIN + p)['status'] for p in ['/BingSiteAuth.xml', '/llms.txt', '/.well-known/security.txt', '/indexnow.txt', '/ads.txt']}
home = next((p for p in pages if p['url'] == ORIGIN + '/'), None)
hb = fetch(ORIGIN + '/')['body']
out['home_meta_verification'] = re.findall(r'<meta name="(google-site-verification|msvalidate\.01|yandex-verification)"[^>]*>', hb)
out['home_headers'] = fetch(ORIGIN + '/')['headers']
out['finished'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(out, open('qa.json', 'w'), indent=1)

# summary
print('pages', len(pages), 'statuses', {s: sum(1 for p in pages if p['status'] == s) for s in {p['status'] for p in pages}})
titles = [p['title'] for p in pages]; descs = [p['desc'] for p in pages]
print('dup titles', len(titles) - len(set(titles)), 'dup descs', len(descs) - len(set(descs)))
print('canonical mismatches', [p['url'] for p in pages if p['canonical'] != p['url']][:10])
print('noindex in sitemap', [p['url'] for p in pages if 'noindex' in (p['robots'] or '') or 'noindex' in (p['xrobots'] or '')][:10])
print('h1 != 1', [p['url'] for p in pages if p['h1'] != 1][:10], 'hash links left', sum(p['hash_links'] for p in pages))
print('invalid ld', [p['url'] for p in pages if any(str(t).startswith('INVALID') for t in p['ld'])][:10])
print('thin (<150 words)', [(p['url'], p['words']) for p in pages if p['words'] < 150][:20])
print('links outside sitemap', json.dumps(out['links_outside_sitemap'])[:3000])
print('redirects', json.dumps(red, indent=0)[:6000])
print('bots', json.dumps([(b['agent'], b['path'], b['status'], b['has_snapshot']) for b in bots]))
bad_ext = [e for e in out['external'] if e['status'] != 200]
print('external', len(out['external']), 'non-200', json.dumps(bad_ext)[:4000])
print('dns', json.dumps(out['dns'])); print('verification files', out['verification_files'], 'meta', out['home_meta_verification'])
print('robots.txt', rb['body'][:1500])
ms = sorted(p['ms'] for p in pages); print('response ms median', ms[len(ms) // 2], 'p90', ms[int(len(ms) * 0.9)], 'max', ms[-1])
