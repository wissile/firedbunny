"""Second pass: full lists the first pass truncated (temporary, qa-probe branch)."""
import json, re, sys, time, urllib.request, urllib.error, concurrent.futures as cf
sys.path.insert(0, '.github/probe')
ORIGIN = 'https://firedbunny.com'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
def get(u, ua=UA, follow=True, hdrs=None):
    h = {'User-Agent': ua, 'Accept': 'text/html,*/*', 'Accept-Language': 'en-US,en;q=0.9'}; h.update(hdrs or {})
    req = urllib.request.Request(u, headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=25); b = r.read(300000); return r.status, dict(r.headers), r.geturl(), b
    except urllib.error.HTTPError as e: return e.code, dict(e.headers), u, b''
    except Exception as e: return None, {}, u, str(e)[:120].encode()
print('UTC', time.strftime('%Y-%m-%d %H:%M', time.gmtime()))
locs = re.findall(r'<loc>([^<]+)</loc>', get(ORIGIN + '/sitemap.xml')[3].decode())
ext = set()
def links(u):
    d = get(u)[3].decode('utf-8', 'replace'); pre = d[d.find('<div id="pre">'):d.find('<div id="boot"')]
    return [(x, u[len(ORIGIN):]) for x in re.findall(r'href="(https?://[^"]+)"', pre) if 'firedbunny.com' not in x]
src = {}
with cf.ThreadPoolExecutor(8) as ex:
    for lst in ex.map(links, locs):
        for x, p in lst: src.setdefault(x, p)
def chk(u):
    s, h, f, b = get(u)
    if s in (403, 405, 429, None): s2 = get(u, hdrs={'Referer': 'https://www.google.com/'})[0]
    else: s2 = None
    return u, s, s2, (f if f != u else ''), src[u]
with cf.ThreadPoolExecutor(12) as ex:
    res = list(ex.map(chk, sorted(src)))
print('EXTERNAL total', len(res))
for u, s, s2, f, p in res:
    if s != 200: print('EXT', s, s2, u, '| on', p, ('-> ' + f) if f else '')
redirected = [(u, f) for u, s, s2, f, p in res if s == 200 and f and f.rstrip('/') != u.rstrip('/')]
print('EXTERNAL redirected to a different URL:', len(redirected)); [print('REDIR', u, '->', f) for u, f in redirected[:40]]
# bots full
for name, ua in [('GPTBot', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot'), ('ClaudeBot', 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)'),
                 ('PerplexityBot', 'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)'), ('CCBot', 'CCBot/2.0 (https://commoncrawl.org/faq/)'),
                 ('Bytespider', 'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)'), ('Applebot', 'Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)'),
                 ('meta-externalagent', 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)'), ('Google-InspectionTool', 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)')]:
    s, h, f, b = get(ORIGIN + '/lessons/vwap/', ua=name and ua)
    print('BOT', name, s, 'snapshot' if b'<div id="pre">' in b else 'NO SNAPSHOT', len(b))
for path in ['/404', '/404.html', '/lessons/wheel-strategy/?utm_source=chatgpt.com', '/sitemap.xml', '/robots.txt', '/og-image.jpg', '/site.webmanifest', '/sw.js']:
    s, h, f, b = get(ORIGIN + path, follow=True)
    print('PATH', path, s, f, h.get('Content-Type'), h.get('Cache-Control'), h.get('X-Robots-Tag'))
s, h, f, b = get(ORIGIN + '/lessons/wheel-strategy/', hdrs={'Accept-Encoding': 'br, gzip'})
print('LESSON HEADERS', json.dumps({k: v for k, v in h.items() if k.lower() in ('content-type', 'content-encoding', 'cache-control', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'content-security-policy', 'x-frame-options', 'permissions-policy', 'link', 'vary', 'age', 'cf-cache-status')}))
