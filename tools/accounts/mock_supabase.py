"""A stand-in for a Supabase project, for testing FiredBunny accounts without network access.

Implements the subset of GoTrue (auth) and PostgREST (rest) that supabase-js uses for: sign up with email confirmation
links (PKCE), sign in with password, refresh, get/update user, logout, password recovery, resend, and the user_data table
with row-level security (a request only sees and writes rows whose user_id is the token's sub), the 300-row and 512 KB
limits, and rpc/delete_my_account. Emails go to an outbox readable at GET /__outbox?email=.
"""
import base64, hashlib, http.server, json, secrets, threading, time, urllib.parse, uuid
from datetime import datetime, timezone

STATE = {'users': {}, 'rows': {}, 'codes': {}, 'refresh': {}, 'outbox': [], 'confirm': True, 'calls': []}
LOCK = threading.Lock()


def b64u(b):
    return base64.urlsafe_b64encode(b).rstrip(b'=').decode()


def jwt(user):
    now = int(time.time())
    head = b64u(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    body = b64u(json.dumps({'sub': user['id'], 'email': user['email'], 'role': 'authenticated', 'aud': 'authenticated', 'iat': now, 'exp': now + 3600,
                            'session_id': secrets.token_hex(8), 'aal': 'aal1', 'amr': [{'method': 'password', 'timestamp': now}]}).encode())
    return f'{head}.{body}.{b64u(b"sig")}'


def sub_of(headers):
    a = headers.get('Authorization', '')
    if not a.startswith('Bearer '):
        return None
    try:
        p = a[7:].split('.')[1]
        d = json.loads(base64.urlsafe_b64decode(p + '=' * (-len(p) % 4)))
        return d.get('sub') if d.get('role') == 'authenticated' and d.get('exp', 0) > time.time() and d.get('sub') in STATE['users'] else None
    except Exception:
        return None


def user_json(u):
    iso = lambda t: datetime.fromtimestamp(t, timezone.utc).isoformat() if t else None
    return {'id': u['id'], 'aud': 'authenticated', 'role': 'authenticated', 'email': u['email'], 'email_confirmed_at': iso(u.get('confirmed')),
            'confirmed_at': iso(u.get('confirmed')), 'created_at': iso(u['created']), 'updated_at': iso(u['created']), 'app_metadata': {'provider': 'email', 'providers': ['email']},
            'user_metadata': {}, 'identities': [{'id': u['id'], 'user_id': u['id'], 'provider': 'email', 'identity_data': {'email': u['email'], 'sub': u['id']}}], 'is_anonymous': False}


def session(u):
    rt = secrets.token_hex(16)
    STATE['refresh'][rt] = u['id']
    return {'access_token': jwt(u), 'token_type': 'bearer', 'expires_in': 3600, 'expires_at': int(time.time()) + 3600, 'refresh_token': rt, 'user': user_json(u)}


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec='microseconds')


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def cors(self):
        self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin') or '*')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Allow-Headers', self.headers.get('Access-Control-Request-Headers') or '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        self.send_header('Access-Control-Expose-Headers', 'Content-Range, X-Supabase-Api-Version')

    def reply(self, code, obj=None, headers=None):
        body = b'' if obj is None else json.dumps(obj).encode()
        self.send_response(code)
        self.cors()
        if obj is not None:
            self.send_header('Content-Type', 'application/json')
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def err(self, code, error_code, msg):
        self.reply(code, {'code': code, 'error_code': error_code, 'msg': msg, 'message': msg, 'error': error_code, 'error_description': msg})

    def body(self):
        n = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(n) if n else b''
        try:
            return json.loads(raw or b'null')
        except Exception:
            return None

    def do_OPTIONS(self):
        self.reply(204)

    def route(self, method):
        u = urllib.parse.urlsplit(self.path)
        q = dict(urllib.parse.parse_qsl(u.query))
        STATE['calls'].append(f'{method} {u.path}')
        with LOCK:
            return getattr(self, 'h_' + method)(u.path, q)

    def do_GET(self):
        self.route('get')

    def do_POST(self):
        self.route('post')

    def do_PUT(self):
        self.route('put')

    def do_DELETE(self):
        self.route('delete')

    def do_PATCH(self):
        self.route('put')

    # ---------------- auth ----------------
    def email_link(self, u, kind, redirect, challenge):
        tok = secrets.token_hex(12)
        STATE['codes'][tok] = {'uid': u['id'], 'kind': kind, 'challenge': challenge, 'redirect': redirect}
        host = self.headers.get('X-Mock-Origin') or 'https://fbtest.supabase.co'
        link = f'{host}/auth/v1/verify?token={tok}&type={kind}&redirect_to={urllib.parse.quote(redirect or "")}'
        STATE['outbox'].append({'to': u['email'], 'kind': kind, 'link': link, 'at': time.time()})

    def h_post(self, path, q):
        b = self.body() or {}
        if path == '/auth/v1/signup':
            email = (b.get('email') or '').lower()
            if len(b.get('password') or '') < 6:
                return self.err(422, 'weak_password', 'Password should be at least 6 characters.')
            existing = next((x for x in STATE['users'].values() if x['email'] == email), None)
            if existing:  # like Supabase with confirmations on: no error, no identities, nothing revealed
                j = user_json(existing); j['identities'] = []
                return self.reply(200, j)
            u = {'id': str(uuid.uuid4()), 'email': email, 'password': b['password'], 'created': time.time(), 'confirmed': None if STATE['confirm'] else time.time()}
            STATE['users'][u['id']] = u
            if not STATE['confirm']:
                return self.reply(200, session(u))
            self.email_link(u, 'signup', q.get('redirect_to'), b.get('code_challenge'))
            return self.reply(200, user_json(u))
        if path == '/auth/v1/token':
            g = q.get('grant_type')
            if g == 'password':
                u = next((x for x in STATE['users'].values() if x['email'] == (b.get('email') or '').lower()), None)
                if not u or u['password'] != b.get('password'):
                    return self.err(400, 'invalid_credentials', 'Invalid login credentials')
                if not u.get('confirmed'):
                    return self.err(400, 'email_not_confirmed', 'Email not confirmed')
                return self.reply(200, session(u))
            if g == 'refresh_token':
                uid = STATE['refresh'].pop(b.get('refresh_token'), None)
                if not uid or uid not in STATE['users']:
                    return self.err(400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found')
                return self.reply(200, session(STATE['users'][uid]))
            if g == 'pkce':
                c = STATE['codes'].pop('code:' + (b.get('auth_code') or ''), None)
                if not c:
                    return self.err(400, 'flow_state_not_found', 'invalid flow state, no valid flow state found')
                if c['challenge'] and b64u(hashlib.sha256((b.get('code_verifier') or '').encode()).digest()) != c['challenge']:
                    return self.err(400, 'bad_code_verifier', 'code challenge does not match previously saved code verifier')
                return self.reply(200, dict(session(STATE['users'][c['uid']]), redirect_type=c['kind']))
            return self.err(400, 'unsupported_grant_type', 'unsupported grant type')
        if path == '/auth/v1/logout':
            return self.reply(204)
        if path == '/auth/v1/recover':
            u = next((x for x in STATE['users'].values() if x['email'] == (b.get('email') or '').lower()), None)
            if u:
                self.email_link(u, 'recovery', q.get('redirect_to'), b.get('code_challenge'))
            return self.reply(200, {})
        if path == '/auth/v1/resend':
            u = next((x for x in STATE['users'].values() if x['email'] == (b.get('email') or '').lower()), None)
            if u and not u.get('confirmed'):
                self.email_link(u, 'signup', (b.get('options') or {}).get('email_redirect_to') or q.get('redirect_to'), b.get('code_challenge'))
            return self.reply(200, {})
        # ---------------- rest ----------------
        sub = sub_of(self.headers)
        if path == '/rest/v1/rpc/delete_my_account':
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for function delete_my_account'})
            STATE['rows'] = {k: v for k, v in STATE['rows'].items() if k[0] != sub}
            STATE['users'].pop(sub, None)
            return self.reply(204)
        if path == '/rest/v1/user_data':
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for table user_data'})
            rows = b if isinstance(b, list) else [b]
            out = []
            for r in rows:
                uid = r.get('user_id') or sub
                if uid != sub:
                    return self.reply(403, {'code': '42501', 'message': 'new row violates row-level security policy for table "user_data"'})
                if len(json.dumps(r.get('value'))) > 524288:
                    return self.reply(400, {'code': '23514', 'message': 'new row for relation "user_data" violates check constraint "user_data_value_size"'})
                if (uid, r['key']) not in STATE['rows'] and sum(1 for k in STATE['rows'] if k[0] == uid) >= 300:
                    return self.reply(400, {'code': 'P0001', 'message': 'FiredBunny: this account already has the maximum of 300 saved items'})
            for r in rows:
                t = now_iso(); time.sleep(0.001)
                STATE['rows'][(sub, r['key'])] = {'value': r.get('value'), 'updated_at': t}
                out.append({'key': r['key'], 'updated_at': t})
            return self.reply(201, out)
        return self.err(404, 'not_found', 'not found ' + path)

    def h_get(self, path, q):
        if path == '/__outbox':
            mails = [m for m in STATE['outbox'] if m['to'] == (q.get('email') or '').lower()]
            return self.reply(200, mails[-1] if mails else None)
        if path == '/__state':
            return self.reply(200, {'users': [{'id': u['id'], 'email': u['email'], 'confirmed': bool(u.get('confirmed'))} for u in STATE['users'].values()],
                                    'rows': [{'user_id': k[0], 'key': k[1], 'value': v['value'], 'updated_at': v['updated_at']} for k, v in STATE['rows'].items()]})
        if path == '/auth/v1/verify':  # the emailed link: confirm, then back to the site with a one-time code
            c = STATE['codes'].pop(q.get('token') or '', None)
            if not c:
                loc = (q.get('redirect_to') or '/') + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
            else:
                u = STATE['users'][c['uid']]
                if c['kind'] == 'signup':
                    u['confirmed'] = time.time()
                code = secrets.token_hex(10)
                STATE['codes']['code:' + code] = {'uid': u['id'], 'kind': c['kind'], 'challenge': c['challenge']}
                sep = '&' if '?' in (c['redirect'] or '') else '?'
                loc = f"{c['redirect']}{sep}code={code}"
            self.send_response(303); self.cors(); self.send_header('Location', loc); self.send_header('Content-Length', '0'); self.end_headers()
            return
        if path == '/auth/v1/user':
            sub = sub_of(self.headers)
            if not sub:
                return self.err(401, 'bad_jwt', 'invalid JWT')
            return self.reply(200, user_json(STATE['users'][sub]))
        if path == '/rest/v1/user_data':
            sub = sub_of(self.headers)
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for table user_data'})
            return self.reply(200, [{'key': k[1], 'value': v['value'], 'updated_at': v['updated_at']} for k, v in STATE['rows'].items() if k[0] == sub])
        return self.err(404, 'not_found', 'not found ' + path)

    def h_put(self, path, q):
        if path == '/auth/v1/user':
            sub = sub_of(self.headers)
            if not sub:
                return self.err(401, 'bad_jwt', 'invalid JWT')
            b = self.body() or {}
            u = STATE['users'][sub]
            if b.get('password'):
                if b['password'] == u['password']:
                    return self.err(422, 'same_password', 'New password should be different from the old password.')
                u['password'] = b['password']
            return self.reply(200, user_json(u))
        return self.err(404, 'not_found', 'not found ' + path)

    def h_delete(self, path, q):
        if path == '/rest/v1/user_data':
            sub = sub_of(self.headers)
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for table user_data'})
            want = None
            if q.get('key', '').startswith('in.('):
                want = set(x.strip('"') for x in q['key'][4:-1].split(','))
            for k in [k for k in STATE['rows'] if k[0] == sub and (want is None or k[1] in want)]:
                del STATE['rows'][k]
            return self.reply(204)
        return self.err(404, 'not_found', 'not found ' + path)


def serve(port):
    s = http.server.ThreadingHTTPServer(('127.0.0.1', port), H)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s
