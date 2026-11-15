"""A stand-in for SnapTrade's API (https://api.snaptrade.com), for testing the portfolio without network access.

Every request must carry a valid signature: HMAC-SHA256 with the (fake) consumer key over the canonical JSON of
{content, path, query}, exactly as https://docs.snaptrade.com/docs/request-signatures describes, plus the right clientId
and a timestamp within five minutes. Anything else gets 401, so a signing bug fails the tests.

Implements what worker/brokerage.js calls: registerUser, deleteUser, login (Connection Portal link), authorizations,
DELETE /connection/{id}, /accounts/all, and per account balances, positions/all, balanceHistory and activities, with a
Robinhood-like connection holding a taxable account and a Roth IRA (ETFs, single stocks, a covered call, a cash-secured
put, tax lots, dividends, option premium, an assignment). Error answers deliberately echo the request's query string
(which holds the userSecret) and the consumer key, so the tests can prove the Worker never passes them on.

Control (tests only): GET /__state, POST /__mode?m=ok|down|ratelimit, POST /__disable?id=<connection>&on=1|0,
GET /__portal?token=... (what the browser reaches instead of app.snaptrade.com; &abandon=1 abandons).
"""
import base64, datetime, hashlib, hmac, http.server, json, random, secrets, threading, time, urllib.parse, uuid

CLIENT_ID = 'FAKE-CLIENT-ID-TEST'
CONSUMER_KEY = 'fake-consumer-key-NOT-A-REAL-SECRET-9f8e7d6c'
STATE = {'users': {}, 'calls': [], 'logins': [], 'sessions': {}, 'mode': 'ok', 'bad': [], 'deleted': [], 'issued': [], 'registered': []}
LOCK = threading.Lock()


def canonical(obj):
    return json.dumps(obj, separators=(',', ':'), sort_keys=True)


def expected_sig(path, query, body):
    content = None if body is None or body == {} else body
    return base64.b64encode(hmac.new(CONSUMER_KEY.encode(), canonical({'content': content, 'path': path, 'query': query}).encode(), hashlib.sha256).digest()).decode()


def day(n):
    return (datetime.date.today() + datetime.timedelta(days=n)).isoformat()


def friday(n):
    d = datetime.date.today() + datetime.timedelta(days=n)
    while d.weekday() != 4:
        d += datetime.timedelta(days=1)
    return d.isoformat()


def stamp(n, hour=15):
    return (datetime.date.today() + datetime.timedelta(days=n)).isoformat() + f' {hour:02d}:30:00+00:00'


def inst(kind, symbol, desc):
    return {'kind': kind, 'id': str(uuid.uuid5(uuid.NAMESPACE_URL, symbol)), 'symbol': symbol, 'description': desc, 'currency': 'USD', 'exchange': 'XNAS'}


def opt(symbol, underlying, otype, strike, expiry):
    return {'kind': 'option', 'id': str(uuid.uuid5(uuid.NAMESPACE_URL, symbol)), 'symbol': symbol, 'option_type': otype, 'strike_price': str(strike), 'expiration_date': expiry,
            'multiplier': '100', 'description': f'{underlying} {expiry} {strike} {otype}', 'underlying': inst('stock', underlying, underlying)}


def lot(date, qty, price, cur):
    return {'original_purchase_date': date + 'T15:30:00Z', 'quantity': str(qty), 'purchased_price': str(price), 'cost_basis': f'{qty * price:.2f}', 'current_value': f'{qty * cur:.2f}', 'position_type': 'LONG', 'lot_id': secrets.token_hex(4)}


def history(end_value, seed):
    r = random.Random(seed)
    pts, v = [], end_value * 0.82
    days = 365
    for i in range(days, -1, -1):
        d = datetime.date.today() - datetime.timedelta(days=i)
        if d.weekday() >= 5:
            continue
        v *= 1 + r.gauss(0.0007, 0.009)
        pts.append([d.isoformat(), v])
    scale = end_value / pts[-1][1]
    return [{'date': d, 'total_value': f'{x * scale:.2f}'} for d, x in pts]


def fixtures():
    """Two accounts in one Robinhood-like connection. Values are made up for tests."""
    ko_exp, aapl_exp = friday(11), friday(25)
    ko_sym = 'KO    ' + ko_exp[2:].replace('-', '') + 'P00065000'
    aapl_sym = 'AAPL  ' + aapl_exp[2:].replace('-', '') + 'C00280000'
    taxable = {
        'meta': {'kind': 'investment', 'display_name': 'Robinhood Individual', 'masked_account_number': '****4821', 'raw_type': 'Individual', 'cash_or_margin': 'cash', 'status': 'open', 'is_paper': False},
        'cash': 9850.00, 'buying_power': 3350.00,
        'positions': [
            {'instrument': inst('etf', 'VTI', 'Vanguard Total Stock Market ETF'), 'units': '45', 'price': '330.10', 'cost_basis': '255.00', 'currency': 'USD',
             'tax_lots': [lot('2021-03-10', 30, 205.0, 330.10), lot(day(-160), 15, 355.0, 330.10)]},
            {'instrument': inst('stock', 'AAPL', 'Apple Inc.'), 'units': '200', 'price': '268.40', 'cost_basis': '190.00', 'currency': 'USD',
             'tax_lots': [lot('2022-06-01', 200, 190.0, 268.40)]},
            {'instrument': inst('stock', 'NVDA', 'NVIDIA Corporation'), 'units': '60', 'price': '182.00', 'cost_basis': '95.00', 'currency': 'USD', 'tax_lots': []},
            {'instrument': inst('stock', 'PYPL', 'PayPal Holdings, Inc.'), 'units': '80', 'price': '61.20', 'cost_basis': '78.25', 'currency': 'USD',
             'tax_lots': [lot(day(-200), 70, 80.43, 61.20), lot(day(-12), 10, 63.0, 61.20)]},
            {'instrument': inst('stock', 'DIS', 'The Walt Disney Company'), 'units': '25', 'price': '98.40', 'cost_basis': '112.00', 'currency': 'USD',
             'tax_lots': [lot(day(-90), 25, 112.0, 98.40)]},
            {'instrument': opt(aapl_sym, 'AAPL', 'CALL', 280, aapl_exp), 'units': '-2', 'price': '3.10', 'cost_basis': '4.25', 'currency': 'USD'},
            {'instrument': opt(ko_sym, 'KO', 'PUT', 65, ko_exp), 'units': '-1', 'price': '0.85', 'cost_basis': '1.40', 'currency': 'USD'},
            {'instrument': {'kind': 'cash', 'code': 'USD'}, 'units': '9850', 'price': '1', 'cost_basis': '1', 'currency': 'USD', 'cash_equivalent': True},
        ],
        'activities': [],
    }
    acts = taxable['activities']

    def act(n, typ, sym=None, units=0, price=0, amount=0, otype=None, option=None, desc=''):
        acts.append({'id': str(uuid.uuid4()), 'symbol': {'symbol': sym, 'raw_symbol': sym, 'description': sym} if sym else None, 'option_symbol': option, 'price': price, 'units': units,
                     'amount': amount, 'currency': {'code': 'USD', 'name': 'US Dollar'}, 'type': typ, 'option_type': otype or '', 'description': desc or typ,
                     'trade_date': stamp(n), 'settlement_date': stamp(n + 1, 0), 'fee': 0, 'fx_rate': None, 'institution': 'Robinhood', 'external_reference_id': None})

    def osym(under, otype, strike, exp):
        return {'id': str(uuid.uuid4()), 'ticker': f'{under} {exp} {otype[0]}{strike}', 'option_type': otype, 'strike_price': strike, 'expiration_date': exp, 'is_mini_option': False,
                'underlying_symbol': {'symbol': under, 'raw_symbol': under}}
    for m in range(1, 12):  # monthly put / call premium and interest
        act(-30 * m + 3, 'SELL', None, -1, 1.2 + 0.05 * m, 118 + 5 * m, 'SELL_TO_OPEN', osym('KO', 'PUT', 62 + (m % 3), day(-30 * m + 24)), 'Sold KO put')
        act(-30 * m + 24, 'OPTIONEXPIRATION', None, 1, 0, 0, None, osym('KO', 'PUT', 62 + (m % 3), day(-30 * m + 24)), 'KO put expired')
        if m % 2 == 0:
            act(-30 * m + 5, 'SELL', None, -2, 3.6, 715, 'SELL_TO_OPEN', osym('AAPL', 'CALL', 260 + m, day(-30 * m + 26)), 'Sold AAPL calls')
        act(-30 * m + 1, 'INTEREST', None, 0, 0, 14.0 + m, None, None, 'Interest on cash')
    for q in range(4):
        act(-90 * q - 20, 'DIVIDEND', 'AAPL', 0, 0, 52.0, None, None, 'AAPL dividend')
        act(-90 * q - 35, 'DIVIDEND', 'VTI', 0, 0, 43.5, None, None, 'VTI dividend')
    act(-3, 'SELL', None, -1, 1.40, 140, 'SELL_TO_OPEN', osym('KO', 'PUT', 65, ko_exp), 'Sold KO put')
    act(-5, 'SELL', None, -2, 4.25, 850, 'SELL_TO_OPEN', osym('AAPL', 'CALL', 280, aapl_exp), 'Sold AAPL calls')
    act(-12, 'BUY', 'PYPL', 10, 63.0, -630, None, None, 'Bought PYPL')
    act(-90, 'BUY', 'DIS', 25, 112.0, -2800, None, None, 'Bought DIS')
    act(-150, 'OPTIONASSIGNMENT', 'KO', 100, 63.0, -6300, None, osym('KO', 'PUT', 63, day(-150)), 'KO put assigned: bought 100 shares at 63')
    act(-120, 'OPTIONASSIGNMENT', 'KO', -100, 66.0, 6600, None, osym('KO', 'CALL', 66, day(-120)), 'KO call assigned: sold 100 shares at 66')
    act(-60, 'FEE', None, 0, 0, -5.0, None, None, 'ADR fee')
    act(-45, 'SELL', 'MSFT', -10, 410.0, 4100, None, None, 'Sold MSFT')

    roth = {
        'meta': {'kind': 'investment', 'display_name': 'Robinhood Roth IRA', 'masked_account_number': '****7730', 'raw_type': 'Roth IRA', 'cash_or_margin': 'cash', 'status': 'open', 'is_paper': False},
        'cash': 412.00, 'buying_power': 412.00,
        'positions': [
            {'instrument': inst('etf', 'VXUS', 'Vanguard Total International Stock ETF'), 'units': '120', 'price': '71.40', 'cost_basis': '58.00', 'currency': 'USD', 'tax_lots': []},
            {'instrument': inst('etf', 'SCHD', 'Schwab U.S. Dividend Equity ETF'), 'units': '150', 'price': '27.90', 'cost_basis': '26.10', 'currency': 'USD'},
            {'instrument': inst('etf', 'BND', 'Vanguard Total Bond Market ETF'), 'units': '60', 'price': '73.50', 'cost_basis': '76.00', 'currency': 'USD'},
        ],
        'activities': [],
    }
    acts = roth['activities']
    for q in range(4):
        act(-90 * q - 10, 'DIVIDEND', 'SCHD', 0, 0, 39.0, None, None, 'SCHD dividend')
    for m in range(12):
        act(-30 * m - 2, 'DIVIDEND', 'BND', 0, 0, 13.0, None, None, 'BND dividend')
    act(-200, 'CONTRIBUTION', None, 0, 0, 7000, None, None, 'Roth contribution')
    for a in (taxable, roth):
        mv = sum(float(p['units']) * float(p['price']) * (100 if p['instrument']['kind'] == 'option' else 1) for p in a['positions'] if p['instrument']['kind'] != 'cash')
        a['value'] = round(mv + a['cash'], 2)
        a['history'] = history(a['value'], a['meta']['display_name'])
    return [taxable, roth]


def new_connection(user, ctype):
    cid = str(uuid.uuid4())
    accts = {}
    for a in fixtures():
        aid = str(uuid.uuid4())
        accts[aid] = a
    user['connections'][cid] = {'id': cid, 'type': ctype, 'disabled': False, 'created': time.time(), 'accounts': accts}
    return cid


def conn_json(c):
    return {'id': c['id'], 'created_date': '2026-11-15 15:00:00+00:00', 'name': 'Connection-1', 'type': c['type'], 'disabled': c['disabled'],
            'disabled_date': '2026-11-14 10:00:00+00:00' if c['disabled'] else None, 'meta': {}, 'updated_date': '2026-11-15 15:00:00+00:00',
            'brokerage': {'id': 'b-robinhood', 'slug': 'ROBINHOOD', 'name': 'Robinhood', 'display_name': 'Robinhood', 'enabled': True, 'maintenance_mode': False, 'is_degraded': False, 'allows_trading': False},
            'data_freshness_mode': {'institution': 'realtime', 'snaptrade': 'realtime'}}


class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def reply(self, code, obj=None, headers=None):
        body = b'' if obj is None else json.dumps(obj).encode()
        self.send_response(code)
        if obj is not None:
            self.send_header('Content-Type', 'application/json')
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def leaky(self, code, detail, query):
        # an error body that echoes what a careless relay might pass on: the request (userSecret included) and the key
        return self.reply(code, {'detail': detail, 'status_code': code, 'code': '1076', 'request': query, 'consumerKey': CONSUMER_KEY})

    def handle_any(self, method):
        u = urllib.parse.urlsplit(self.path)
        n = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(n) if n else b''
        if u.path.startswith('/__'):
            with LOCK:
                return self.control(method, u.path, dict(urllib.parse.parse_qsl(u.query)))
        body = None
        if raw:
            try:
                body = json.loads(raw)
            except Exception:
                return self.reply(400, {'detail': 'bad json'})
        q = dict(urllib.parse.parse_qsl(u.query, keep_blank_values=True))
        with LOCK:
            STATE['calls'].append({'method': method, 'path': u.path, 'query': {k: v for k, v in q.items() if k != 'userSecret'}, 'body': body, 'secret_sent': 'userSecret' in q})
            if u.path == '/' and method == 'GET':
                return self.reply(200, {'version': 151, 'timestamp': datetime.datetime.utcnow().isoformat() + 'Z', 'online': True})
            if self.headers.get('Signature') != expected_sig(u.path, u.query, body) or q.get('clientId') != CLIENT_ID or abs(int(q.get('timestamp') or 0) - time.time()) > 300:
                STATE['bad'].append(f'{method} {u.path}')
                return self.leaky(401, 'Unable to verify signature sent', u.query)
            if STATE['mode'] == 'down':
                return self.leaky(503, 'Service unavailable', u.query)
            if STATE['mode'] == 'ratelimit':
                return self.reply(429, {'detail': 'Too many requests', 'request': u.query}, {'Retry-After': '30'})
            return self.route(method, u.path, q, body)

    def do_GET(self):
        self.handle_any('GET')

    def do_POST(self):
        self.handle_any('POST')

    def do_DELETE(self):
        self.handle_any('DELETE')

    def user(self, q):
        u = STATE['users'].get(q.get('userId'))
        if not u or q.get('userSecret') != u['secret']:
            return None
        return u

    def route(self, method, path, q, body):
        if path == '/snapTrade/registerUser' and method == 'POST':
            uid = (body or {}).get('userId')
            if not uid or uid in STATE['users']:
                return self.reply(400, {'detail': 'User already exist', 'status_code': 400, 'code': '1010'})
            STATE['users'][uid] = {'secret': str(uuid.uuid4()), 'connections': {}}
            STATE['issued'].append(STATE['users'][uid]['secret']); STATE['registered'].append(uid)
            return self.reply(200, {'userId': uid, 'userSecret': STATE['users'][uid]['secret']})
        if path == '/snapTrade/deleteUser' and method == 'DELETE':
            uid = q.get('userId')
            if uid not in STATE['users']:
                return self.reply(404, {'detail': 'User not found', 'status_code': 404, 'code': '1011'})
            del STATE['users'][uid]
            STATE['deleted'].append(uid)
            return self.reply(200, {'status': 'deleted', 'detail': 'User queued for deletion; please wait for webhook for confirmation.', 'userId': uid})
        u = self.user(q)
        if not u:
            return self.leaky(401, 'Invalid userID or userSecret provided', urllib.parse.urlencode(q))
        if path == '/snapTrade/login' and method == 'POST':
            b = body or {}
            tok = secrets.token_urlsafe(18)
            STATE['sessions'][tok] = {'userId': q['userId'], 'body': b}
            STATE['logins'].append(dict(b, userId=q['userId']))
            return self.reply(200, {'redirectURI': f'https://app.snaptrade.com/snapTrade/redeemToken?token={tok}&clientId={CLIENT_ID}&connectionPortalVersion=v4&sessionId={uuid.uuid4()}', 'sessionId': str(uuid.uuid4())})
        if path == '/authorizations' and method == 'GET':
            return self.reply(200, [conn_json(c) for c in u['connections'].values()])
        if path.startswith('/connection/') and method == 'DELETE':
            cid = path.split('/')[2]
            if cid not in u['connections']:
                return self.reply(404, {'detail': 'Not found'})
            del u['connections'][cid]
            return self.reply(200, {'detail': 'Connection queued for deletion; please wait for webhook for confirmation.', 'connection_id': cid})
        accts = {aid: (c, a) for c in u['connections'].values() for aid, a in c['accounts'].items()}
        if path == '/accounts/all' and method == 'GET':
            res = []
            for aid, (c, a) in accts.items():
                m = a['meta']
                res.append(dict(m, id=aid, connection_id=c['id'], institution_account_id=None, institution_id='i-robinhood', opening_date=None, funding_date=None,
                                sync_status={'positions': {'last_successful_sync': stamp(0, 14)}, 'balances': {'last_successful_sync': stamp(0, 14)}, 'transactions': {'last_successful_sync': day(-1)}},
                                net_value={'amount': a['value'], 'currency': 'USD'}))
            return self.reply(200, {'results': res})
        parts = path.strip('/').split('/')
        if len(parts) >= 3 and parts[0] == 'accounts' and parts[1] in accts and method == 'GET':
            c, a = accts[parts[1]]
            rest = '/'.join(parts[2:])
            if rest == 'balances':
                return self.reply(200, [{'currency': {'id': 'usd', 'code': 'USD', 'name': 'US Dollar'}, 'cash': a['cash'], 'buying_power': a['buying_power']}])
            if rest == 'positions/all':
                return self.reply(200, {'results': a['positions'], 'data_freshness': {'as_of': stamp(0, 14)}})
            if rest == 'balanceHistory':
                return self.reply(200, {'history': a['history'], 'currency': 'USD'})
            if rest == 'activities':
                since = q.get('startDate') or '0000'
                data = [x for x in a['activities'] if x['trade_date'][:10] >= since]
                data.sort(key=lambda x: x['trade_date'], reverse=True)
                lim = int(q.get('limit') or 1000)
                return self.reply(200, {'data': data[:lim], 'pagination': {'offset': 0, 'limit': lim, 'total': len(data)}})
        return self.reply(404, {'detail': 'Not found ' + path})

    def control(self, method, path, q):
        if path == '/__state':
            return self.reply(200, {'users': {k: {'connections': [dict(conn_json(c), accounts=len(c['accounts'])) for c in v['connections'].values()]} for k, v in STATE['users'].items()},
                                    'logins': STATE['logins'], 'bad': STATE['bad'], 'deleted': STATE['deleted'], 'mode': STATE['mode'], 'calls': len(STATE['calls'])})
        if path == '/__mode':
            STATE['mode'] = q.get('m', 'ok')
            return self.reply(200, {'mode': STATE['mode']})
        if path == '/__disable':
            for u in STATE['users'].values():
                if q.get('id') in u['connections']:
                    u['connections'][q['id']]['disabled'] = q.get('on', '1') == '1'
            return self.reply(200, {})
        if path == '/__portal':
            s = STATE['sessions'].pop(q.get('token') or '', None)
            if not s:
                return self.reply(400, {'detail': 'expired link'})
            b = s['body']
            red = b.get('customRedirect') or 'https://snaptrade.com'
            sep = '&' if '?' in red else '?'
            if q.get('abandon'):
                loc = red + sep + 'status=ABANDONED'
            else:
                u = STATE['users'].get(s['userId'])
                if b.get('reconnect') and b['reconnect'] in u['connections']:
                    u['connections'][b['reconnect']]['disabled'] = False
                    cid = b['reconnect']
                else:
                    cid = new_connection(u, b.get('connectionType') or 'read')
                loc = red + sep + 'status=SUCCESS&connection_id=' + cid
            self.send_response(303); self.send_header('Location', loc); self.send_header('Content-Length', '0'); self.end_headers()
            return
        return self.reply(404, {})


def serve(port):
    s = http.server.ThreadingHTTPServer(('127.0.0.1', port), H)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s
