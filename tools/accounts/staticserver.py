"""A local static server that answers like the Cloudflare deployment (wrangler.jsonc assets), for tests:
exact file; folder -> folder/index.html; /folder -> 307 /folder/; otherwise 404.html with status 404
(or, when the build has no 404.html, the single-page fallback index.html with 200)."""
import http.server, functools, os, posixpath, urllib.parse

class FB(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        url = urllib.parse.urlsplit(self.path); path = urllib.parse.unquote(url.path)
        full = self.translate_path(path)
        if os.path.isdir(full):
            if not path.endswith('/'):
                self.send_response(307); self.send_header('Location', path + '/' + (('?' + url.query) if url.query else '')); self.send_header('Content-Length', '0'); self.end_headers(); return None
            full = os.path.join(full, 'index.html')
        if os.path.isfile(full):
            return self._file(full, 200)
        root = self.directory
        nf = os.path.join(root, '404.html')
        if os.path.isfile(nf): return self._file(nf, 404)
        return self._file(os.path.join(root, 'index.html'), 200)
    def _file(self, full, code):
        f = open(full, 'rb'); fs = os.fstat(f.fileno())
        self.send_response(code); self.send_header('Content-Type', self.guess_type(full)); self.send_header('Content-Length', str(fs.st_size)); self.end_headers()
        return f

def handler(directory):
    return functools.partial(FB, directory=directory)
