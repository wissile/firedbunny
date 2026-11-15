"""A stand-in for a Supabase project, for testing FiredBunny accounts without network access.

Implements the subset of GoTrue (auth) and PostgREST (rest) that supabase-js uses for: sign up with email confirmation
links (PKCE), sign in with password, refresh, get/update user, logout, password recovery, resend, and the user_data table
with row-level security (a request only sees and writes rows whose user_id is the token's sub), the 300-row and 512 KB
limits, and rpc/delete_my_account. Emails go to an outbox readable at GET /__outbox?email=.

public.feedback is insert-only, as in supabase/schema.sql: anyone may add a note (only the visitor columns; the server
fills id, created_at, status and user_id from the token), nobody may read, change or delete, the length checks apply,
and the 121st note within ten minutes is refused. STATE['feedback_mode'] = 'missing' answers as Supabase does before
the table exists (the owner has not run the new schema yet). Each insert's Prefer header is kept in STATE['feedback_prefer'].

public.brokerage_links (the portfolio's encrypted SnapTrade secret, one row per person) follows supabase/schema.sql: a
request sees, adds, changes and deletes only the row whose user_id is the token's sub; snaptrade_user_id must be
'fb-<user_id>' (optionally with a suffix) and secret_box 20 to 1000 characters; delete_my_account removes it.
STATE['links_mode'] = 'missing' answers as Supabase does before the table exists.

public.waitlist (the Plans page) follows supabase/schema.sql: anyone may add a row with only the visitor columns (email,
extras, note); the server fills user_id from the token and drops the email for a signed-in person, trims the email and
note, drops empty extras, refuses the 121st sign-up within ten minutes (checked first), then quietly skips a second
sign-up for the same email (any capitals) or account (201, nothing stored, like the trigger returning NULL), then applies
the checks (exactly one of email or account, email shape, extras from the fixed list, note up to 280). A signed-in
request may read its own rows (not the email column) and delete them with a filter; nobody may change rows.
STATE['waitlist_mode'] = 'missing' answers as before the table exists; each insert's Prefer header is kept in
STATE['waitlist_prefer'].

enable_es256(iss) switches tokens to ES256 with a locally generated P-256 key (like the real project's signing keys),
served at /auth/v1/.well-known/jwks.json, and makes the REST side verify signatures. sign_es256() mints any token
(tests use it to forge bad ones). Without it, tokens stay unsigned HS256 look-alikes as before.
"""
import base64, hashlib, http.server, json, re, secrets, threading, time, urllib.parse, uuid
from datetime import datetime, timezone

STATE = {'users': {}, 'rows': {}, 'codes': {}, 'refresh': {}, 'outbox': [], 'confirm': True, 'calls': [],
         'feedback': [], 'feedback_mode': 'ok', 'feedback_prefer': [], 'links': {}, 'links_mode': 'ok',
         'waitlist': [], 'waitlist_mode': 'ok', 'waitlist_prefer': [],
         'es256': None, 'kid': 'fbtest-kid-1', 'iss': None, 'jwks_hits': 0, 'user_hits': 0}
FEEDBACK_COLS = {'kind', 'message', 'email', 'page', 'source', 'user_agent'}
EMAIL_SHAPE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
WAITLIST_COLS = {'email', 'extras', 'note'}
WAITLIST_READABLE = {'id', 'created_at', 'user_id', 'extras', 'note'}
WAITLIST_EXTRAS = {'review', 'coach', 'report', 'history'}
LOCK = threading.Lock()


def b64u(b):
    return base64.urlsafe_b64encode(b).rstrip(b'=').decode()


def enable_es256(iss):
    """Sign tokens with ES256 under a fresh P-256 key, like a Supabase project with the newer signing keys."""
    from cryptography.hazmat.primitives.asymmetric import ec
    STATE['es256'] = ec.generate_private_key(ec.SECP256R1())
    STATE['iss'] = iss


def jwk_of(key, kid):
    n = key.public_key().public_numbers()
    return {'kty': 'EC', 'crv': 'P-256', 'alg': 'ES256', 'use': 'sig', 'kid': kid, 'key_ops': ['verify'], 'ext': True,
            'x': b64u(n.x.to_bytes(32, 'big')), 'y': b64u(n.y.to_bytes(32, 'big'))}


def sign_es256(payload, key=None, kid=None, header=None):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    head = b64u(json.dumps(dict({'alg': 'ES256', 'typ': 'JWT', 'kid': kid or STATE['kid']}, **(header or {}))).encode())
    body = b64u(json.dumps(payload).encode())
    r, s_ = decode_dss_signature((key or STATE['es256']).sign(f'{head}.{body}'.encode(), ec.ECDSA(hashes.SHA256())))
    return f'{head}.{body}.{b64u(r.to_bytes(32, "big") + s_.to_bytes(32, "big"))}'


def claims_of(user, **over):
    now = int(time.time())
    c = {'sub': user['id'], 'email': user['email'], 'role': 'authenticated', 'aud': 'authenticated', 'iat': now, 'exp': now + 3600,
         'session_id': secrets.token_hex(8), 'aal': 'aal1', 'amr': [{'method': 'password', 'timestamp': now}], 'is_anonymous': False}
    if STATE['iss']:
        c['iss'] = STATE['iss']
    c.update(over)
    return c


def jwt(user):
    if STATE['es256']:
        return sign_es256(claims_of(user))
    head = b64u(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    body = b64u(json.dumps(claims_of(user)).encode())
    return f'{head}.{body}.{b64u(b"sig")}'


def es256_ok(token):
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
    h, b, sig = token.split('.')
    head = json.loads(base64.urlsafe_b64decode(h + '=' * (-len(h) % 4)))
    if head.get('alg') != 'ES256' or head.get('kid') != STATE['kid']:
        return False
    raw = base64.urlsafe_b64decode(sig + '=' * (-len(sig) % 4))
    if len(raw) != 64:
        return False
    try:
        STATE['es256'].public_key().verify(encode_dss_signature(int.from_bytes(raw[:32], 'big'), int.from_bytes(raw[32:], 'big')), f'{h}.{b}'.encode(), ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:
        return False


def sub_of(headers):
    a = headers.get('Authorization', '')
    if not a.startswith('Bearer '):
        return None
    try:
        if STATE['es256'] and not es256_ok(a[7:]):  # PostgREST and GoTrue verify the signature
            return None
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
        if path == '/rest/v1/feedback':
            return self.feedback_insert(sub, b)
        if path == '/rest/v1/waitlist':
            return self.waitlist_insert(sub, b)
        if path == '/rest/v1/rpc/delete_my_account':
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for function delete_my_account'})
            STATE['rows'] = {k: v for k, v in STATE['rows'].items() if k[0] != sub}
            STATE['links'].pop(sub, None)  # references auth.users on delete cascade
            STATE['waitlist'] = [w for w in STATE['waitlist'] if w['user_id'] != sub]  # delete_my_account and the cascade
            STATE['users'].pop(sub, None)
            for f in STATE['feedback']:  # references auth.users on delete set null
                if f['user_id'] == sub:
                    f['user_id'] = None
            return self.reply(204)
        if path == '/rest/v1/brokerage_links':
            return self.links_upsert(sub, b, q)
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

    # ---------------- brokerage_links (own row only) ----------------
    def links_missing(self):
        return self.reply(404, {'code': 'PGRST205', 'details': None, 'hint': None, 'message': "Could not find the table 'public.brokerage_links' in the schema cache"})

    def links_filter(self, q):
        f = q.get('user_id', '')
        return f[3:] if f.startswith('eq.') else None

    def links_upsert(self, sub, b, q):
        if STATE['links_mode'] == 'missing':
            return self.links_missing()
        if not sub:
            return self.reply(401, {'code': '42501', 'message': 'permission denied for table brokerage_links'})
        rows = b if isinstance(b, list) else [b]
        prefer = self.headers.get('Prefer') or ''
        for r in rows:
            if not isinstance(r, dict) or set(r) - {'user_id', 'snaptrade_user_id', 'secret_box'}:
                return self.reply(403, {'code': '42501', 'message': 'permission denied for table brokerage_links'})
            if (r.get('user_id') or sub) != sub:
                return self.reply(403, {'code': '42501', 'message': 'new row violates row-level security policy for table "brokerage_links"'})
            uid = r.get('snaptrade_user_id') or ''
            if not (uid == 'fb-' + sub or (uid.startswith('fb-' + sub + '-') and len(uid) <= len(sub) + 20)):
                return self.reply(400, {'code': '23514', 'message': 'new row for relation "brokerage_links" violates check constraint "brokerage_links_user_id_shape"'})
            if not (20 <= len(r.get('secret_box') or '') <= 1000):
                return self.reply(400, {'code': '23514', 'message': 'new row for relation "brokerage_links" violates check constraint "brokerage_links_box_length"'})
            if sub in STATE['links'] and 'merge-duplicates' not in prefer:
                return self.reply(409, {'code': '23505', 'message': 'duplicate key value violates unique constraint "brokerage_links_pkey"'})
        for r in rows:
            old = STATE['links'].get(sub)
            STATE['links'][sub] = {'user_id': sub, 'snaptrade_user_id': r['snaptrade_user_id'], 'secret_box': r['secret_box'],
                                   'created_at': old['created_at'] if old else now_iso(), 'updated_at': now_iso()}
        return self.reply(201)

    # ---------------- feedback (insert only) ----------------
    def feedback_missing(self):
        return self.reply(404, {'code': 'PGRST205', 'details': None, 'hint': None, 'message': "Could not find the table 'public.feedback' in the schema cache"})

    def feedback_denied(self, sub):  # no select, update or delete for anyone (401 for anon, 403 signed in, like PostgREST)
        if STATE['feedback_mode'] == 'missing':
            return self.feedback_missing()
        return self.reply(403 if sub else 401, {'code': '42501', 'details': None, 'hint': None, 'message': 'permission denied for table feedback'})

    def feedback_insert(self, sub, b):
        if STATE['feedback_mode'] == 'missing':
            return self.feedback_missing()
        prefer = self.headers.get('Prefer') or ''
        STATE['feedback_prefer'].append(prefer)
        if 'return=representation' in prefer:  # reading the row back needs select, which nobody has
            return self.feedback_denied(sub)
        rows = b if isinstance(b, list) else [b]
        check = lambda name: self.reply(400, {'code': '23514', 'details': None, 'hint': None, 'message': f'new row for relation "feedback" violates check constraint "feedback_{name}"'})
        for r in rows:
            if not isinstance(r, dict) or set(r) - FEEDBACK_COLS:  # column privileges: only the visitor columns
                return self.feedback_denied(sub)
            if r.get('message') is None or r.get('kind') is None:
                return self.reply(400, {'code': '23502', 'details': None, 'hint': None, 'message': 'null value in column violates not-null constraint'})
            if not (1 <= len(r['kind']) <= 40): return check('kind_length')
            if len(r['message']) > 4000 or not r['message'].strip(): return check('message_length')
            if r.get('email') is not None and (len(r['email']) > 254 or not EMAIL_SHAPE.match(r['email'])): return check('email_shape')
            if r.get('page') is not None and len(r['page']) > 300: return check('page_length')
            if r.get('source') is not None and len(r['source']) > 20: return check('source_length')
            if r.get('user_agent') is not None and len(r['user_agent']) > 300: return check('ua_length')
        for r in rows:
            if sum(1 for f in STATE['feedback'] if f['t'] > time.time() - 600) >= 120:
                return self.reply(400, {'code': 'P0001', 'details': None, 'hint': None, 'message': 'FiredBunny: too much feedback right now, try again in a few minutes'})
            STATE['feedback'].append(dict({c: r.get(c) for c in FEEDBACK_COLS}, id=str(uuid.uuid4()), created_at=now_iso(), status='new', user_id=sub, t=time.time()))
        return self.reply(201)

    # ---------------- waitlist (join; own rows readable and removable when signed in) ----------------
    def waitlist_missing(self):
        return self.reply(404, {'code': 'PGRST205', 'details': None, 'hint': None, 'message': "Could not find the table 'public.waitlist' in the schema cache"})

    def waitlist_denied(self, sub):
        return self.reply(403 if sub else 401, {'code': '42501', 'details': None, 'hint': None, 'message': 'permission denied for table waitlist'})

    def waitlist_insert(self, sub, b):
        if STATE['waitlist_mode'] == 'missing':
            return self.waitlist_missing()
        prefer = self.headers.get('Prefer') or ''
        STATE['waitlist_prefer'].append(prefer)
        if 'return=representation' in prefer:  # reading the row back would need the email column, which nobody can read
            return self.waitlist_denied(sub)
        rows = b if isinstance(b, list) else [b]
        check = lambda name: self.reply(400, {'code': '23514', 'details': None, 'hint': None, 'message': f'new row for relation "waitlist" violates check constraint "waitlist_{name}"'})
        if any(not isinstance(r, dict) or set(r) - WAITLIST_COLS for r in rows):  # column privileges
            return self.waitlist_denied(sub)
        for r in rows:
            # the trigger: server-side fields and tidying, the flood guard, then the quiet duplicate skip
            raw, ex, nt = r.get('email'), r.get('extras'), r.get('note')
            email = None if sub else ((raw.strip() or None) if isinstance(raw, str) else raw)
            extras = sorted(set(x for x in ex if x is not None)) if isinstance(ex, list) and all(isinstance(x, (str, type(None))) for x in ex) else ([] if ex is None else [ex])
            note = (nt.strip() or None) if isinstance(nt, str) else nt
            if sum(1 for w in STATE['waitlist'] if w['t'] > time.time() - 600) >= 120:
                return self.reply(400, {'code': 'P0001', 'details': None, 'hint': None, 'message': 'FiredBunny: too many waitlist sign-ups right now, try again in a few minutes'})
            if any((sub and w['user_id'] == sub) or (email and isinstance(email, str) and (w['email'] or '').lower() == email.lower()) for w in STATE['waitlist']):
                continue
            # the table's checks
            if (email is None) == (sub is None): return check('who')
            if email is not None and (not isinstance(email, str) or len(email) > 254 or not EMAIL_SHAPE.match(email)): return check('email_shape')
            if not isinstance(extras, list) or any(x not in WAITLIST_EXTRAS for x in extras): return check('extras_known')
            if note is not None and (not isinstance(note, str) or len(note) > 280): return check('note_length')
            STATE['waitlist'].append({'id': str(uuid.uuid4()), 'created_at': now_iso(), 'email': email, 'user_id': sub, 'extras': extras, 'note': note, 't': time.time()})
        return self.reply(201)

    def waitlist_select(self, sub, q):
        if STATE['waitlist_mode'] == 'missing':
            return self.waitlist_missing()
        if not sub:
            return self.waitlist_denied(sub)
        cols = [c.strip() for c in (q.get('select') or '*').split(',')]
        if cols == ['*'] or set(cols) - WAITLIST_READABLE:  # column privileges: no email for anyone
            return self.waitlist_denied(sub)
        return self.reply(200, [{c: w[c] for c in cols} for w in STATE['waitlist'] if w['user_id'] == sub])

    def waitlist_delete(self, sub, q):
        if STATE['waitlist_mode'] == 'missing':
            return self.waitlist_missing()
        if not sub:
            return self.waitlist_denied(sub)
        f = q.get('user_id', '')
        if not f.startswith('eq.'):
            return self.reply(400, {'code': '21000', 'details': None, 'hint': None, 'message': 'DELETE requires a WHERE clause'})
        STATE['waitlist'] = [w for w in STATE['waitlist'] if not (w['user_id'] == sub and w['user_id'] == f[3:])]  # only one's own rows are visible
        return self.reply(204)

    def h_get(self, path, q):
        if path == '/rest/v1/feedback':
            return self.feedback_denied(sub_of(self.headers))
        if path == '/rest/v1/waitlist':
            return self.waitlist_select(sub_of(self.headers), q)
        if path == '/auth/v1/.well-known/jwks.json':
            STATE['jwks_hits'] += 1
            return self.reply(200, {'keys': [jwk_of(STATE['es256'], STATE['kid'])] if STATE['es256'] else []})
        if path == '/rest/v1/brokerage_links':
            if STATE['links_mode'] == 'missing':
                return self.links_missing()
            sub = sub_of(self.headers)
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for table brokerage_links'})
            want = self.links_filter(q)
            cols = [c for c in (q.get('select') or '*').split(',')]
            rows = [r for u, r in STATE['links'].items() if u == sub and (want is None or u == want)]
            return self.reply(200, [{k: v for k, v in r.items() if cols == ['*'] or k in cols} for r in rows])
        if path == '/__outbox':
            mails = [m for m in STATE['outbox'] if m['to'] == (q.get('email') or '').lower()]
            return self.reply(200, mails[-1] if mails else None)
        if path == '/__state':
            return self.reply(200, {'users': [{'id': u['id'], 'email': u['email'], 'confirmed': bool(u.get('confirmed'))} for u in STATE['users'].values()],
                                    'rows': [{'user_id': k[0], 'key': k[1], 'value': v['value'], 'updated_at': v['updated_at']} for k, v in STATE['rows'].items()],
                                    'feedback': [{k: v for k, v in f.items() if k != 't'} for f in STATE['feedback']],
                                    'links': list(STATE['links'].values()),
                                    'waitlist': [{k: v for k, v in w.items() if k != 't'} for w in STATE['waitlist']]})
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
            STATE['user_hits'] += 1
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
        if path == '/rest/v1/feedback':
            return self.feedback_denied(sub_of(self.headers))
        if path == '/rest/v1/waitlist':  # nobody may change a sign-up
            return self.waitlist_missing() if STATE['waitlist_mode'] == 'missing' else self.waitlist_denied(sub_of(self.headers))
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
        if path == '/rest/v1/feedback':
            return self.feedback_denied(sub_of(self.headers))
        if path == '/rest/v1/waitlist':
            return self.waitlist_delete(sub_of(self.headers), q)
        if path == '/rest/v1/brokerage_links':
            if STATE['links_mode'] == 'missing':
                return self.links_missing()
            sub = sub_of(self.headers)
            if not sub:
                return self.reply(401, {'code': '42501', 'message': 'permission denied for table brokerage_links'})
            want = self.links_filter(q)
            if sub in STATE['links'] and (want is None or want == sub):  # other people's rows are invisible, so untouched
                del STATE['links'][sub]
            return self.reply(204)
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
