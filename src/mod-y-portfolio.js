/* Portfolio (/portfolio/): a private, read-only view of a signed-in visitor's brokerage accounts, connected through
 * SnapTrade (worker/brokerage.js does the talking; this file draws). Prefix: .pf-
 *
 * - Pull-based: data is fetched only while this page is open (on arrival, at most every 5 minutes, or on Refresh).
 *   Nothing is pushed, emailed or shown anywhere else.
 * - Holdings and activity are kept on this device only (localStorage 'fb-portfolio:<user id>'), removed on sign-out,
 *   and never written to the account. The account holds only the Worker's encrypted SnapTrade key (brokerage_links).
 * - The sample portfolio (made-up accounts and prices) shows to everyone else: signed out, before launch
 *   (src/brokerage-config.js), when the server has no SnapTrade keys yet, and always in the claude.ai copy.
 * - Every observation links to the lesson or tool that explains it, and is phrased as an observation or a question:
 *   education, not advice. SML.portfolio.analyze(data) returns the numbers the page shows (handy in the console).
 */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, F = SML.fmt, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const CFG = SML.BROKERAGE || {};
  const web = SML.host === 'web';
  const PV = 'fb-brokerage-preview', CK = 'fb-portfolio:';
  const MINUS = '−';
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) out.push(k); } } catch (e) {} return out; },
  };

  /* ---------------- the pre-launch gate ---------------- */
  // ?preview=brokerage opts this browser in (the Connect button shows), ?preview=off opts out. Read once at start.
  (function gate() {
    if (!web) return;
    let q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
    const p = q.get('preview');
    if (p === 'brokerage') ls.set(PV, '1'); else if (p === 'off') ls.del(PV); else return;
    q.delete('preview');
    try { history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } catch (e) {}
  })();
  const accountsOn = () => !!(web && SML.cloud && SML.cloud.enabled);
  const signedIn = () => !!(accountsOn() && SML.cloud.user);
  const uid = () => (signedIn() ? SML.cloud.user.id : null);
  const enabled = () => accountsOn() && (CFG.live === true || ls.get(PV) === '1');

  /* ---------------- this device's copy ---------------- */
  // One person's copy at a time: anyone else's (a shared computer) and anything left after signing out is removed.
  (function tidy() {
    const me = uid();
    ls.keys().forEach((k) => { if (k.indexOf(CK) === 0 && k !== CK + me) ls.del(k); });
  })();
  const readCopy = () => { const id = uid(); if (!id) return null; try { const c = JSON.parse(ls.get(CK + id) || 'null'); return c && c.data && c.at ? c : null; } catch (e) { return null; } };
  const writeCopy = (c) => { const id = uid(); if (id) ls.set(CK + id, JSON.stringify(c)); };
  const dropCopy = () => { const id = uid(); if (id) ls.del(CK + id); };

  /* ---------------- talking to the Worker ---------------- */
  async function accessToken() {
    if (!signedIn()) return null;
    const c = await SML.cloud.client();
    const { data } = await c.auth.getSession(); // refreshes an expired token first
    return data && data.session ? data.session.access_token : null;
  }
  const E = (code, message, extra) => Object.assign(new Error(message || code), { code }, extra || {});
  async function call(action, body, ms) {
    let tok;
    try { tok = await accessToken(); } catch (e) { throw E(navigator.onLine === false ? 'offline' : 'network', 'Could not reach the sign-in service.'); }
    if (!tok) throw E('unauthorized', 'Sign in again to use your portfolio.');
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => { if (ctl) ctl.abort(); }, ms || 25000);
    let r;
    try { r = await fetch('/api/brokerage/' + action, { method: 'POST', cache: 'no-store', credentials: 'omit', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify(body || {}), signal: ctl ? ctl.signal : undefined }); }
    catch (e) { throw E(navigator.onLine === false ? 'offline' : 'network', 'Could not reach FiredBunny’s server.'); }
    finally { clearTimeout(t); }
    let d = null; try { d = await r.json(); } catch (e) { d = null; }
    if (r.status === 404 && (!d || d.error === 'not_found')) return { ok: true, configured: false }; // a server without the relay yet
    if (!r.ok) throw E((d && d.error) || 'http_' + r.status, (d && d.message) || 'Something went wrong. Try again in a moment.', { status: r.status, retryAfter: d && d.retryAfter });
    return d || {};
  }

  /* ---------------- helpers ---------------- */
  const n0 = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const has = (v) => typeof v === 'number' && isFinite(v);
  const sum = (a, f) => a.reduce((s, x) => s + n0(f ? f(x) : x), 0);
  const usd = (v) => F.usd(Math.round(n0(v)), 0);
  const susd = (v) => (Math.round(v) === 0 ? '$0' : F.susd(Math.round(v), 0));
  const kfmt = (v) => { const a = Math.abs(v), sg = v < 0 ? MINUS : ''; if (a >= 1e6) return sg + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e4) return sg + '$' + Math.round(a / 1e3) + 'K'; if (a >= 1e3) return sg + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return sg + '$' + Math.round(a); };
  const pct = (v, d) => F.pct(v * 100, d == null ? 1 : d);
  const spct = (v, d) => F.spct(v * 100, d == null ? 1 : d);
  const day0 = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
  const parseDay = (s) => { if (!s) return null; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s)); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null; };
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const daysBetween = (a, b) => Math.round((day0(b) - day0(a)) / 864e5);
  const mDY = (s) => { const d = parseDay(s); return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'; };
  const mD = (s) => { const d = parseDay(s); return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'; };
  const when = (isoTime) => { try { const d = new Date(isoTime); return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return String(isoTime); } };
  const tone = (v) => (v > 0.5 ? 'up' : v < -0.5 ? 'dn' : '');
  const link = (tok, label) => (SML.routes && SML.routes.exists && !SML.routes.exists(tok) ? esc(label) : `<a class="pf-ln" href="#${tok}">${esc(label)}</a>`);
  const I = (body, w) => `<svg class="pf-i" width="${w || 18}" height="${w || 18}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICON = {
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
    plug: '<path d="M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0zM12 17v5"/>',
    warn: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };

  /* ---------------- vocabulary ---------------- */
  const TAX = {
    taxable: { label: 'Taxable', long: 'Taxable brokerage', col: 'var(--accent)' },
    deferred: { label: 'Tax-deferred', long: 'Tax-deferred (traditional IRA, 401(k))', col: 'var(--info)' },
    roth: { label: 'Roth', long: 'Roth (tax-free growth)', col: 'var(--violet)' },
    hsa: { label: 'HSA', long: 'Health savings account', col: 'var(--up)' },
    education: { label: '529', long: 'Education (529)', col: 'color-mix(in srgb,var(--up) 50%,var(--info))' },
  };
  function taxType(a) {
    const s = ((a.rawType || '') + ' ' + (a.name || '')).toLowerCase();
    if (/\broth\b/.test(s)) return 'roth';
    if (/\bhsa\b|health savings/.test(s)) return 'hsa';
    if (/\b529\b|coverdell|\besa\b/.test(s)) return 'education';
    if (/\bira\b|401\s?\(?k\)?|403\s?\(?b\)?|\b457\b|\bsep\b|\bsimple\b|rollover|traditional|keogh|pension|retirement/.test(s)) return 'deferred';
    return 'taxable';
  }
  const CLS = {
    funds: { label: 'Funds (ETFs, mutual funds)', short: 'Funds', col: 'var(--up)' },
    stocks: { label: 'Single stocks', short: 'Stocks', col: 'var(--info)' },
    bonds: { label: 'Bond funds and bonds', short: 'Bonds', col: 'var(--violet)' },
    options: { label: 'Options you own', short: 'Options', col: 'var(--accent)' },
    crypto: { label: 'Crypto', short: 'Crypto', col: 'color-mix(in srgb,var(--violet) 55%,var(--down))' },
    cash: { label: 'Cash', short: 'Cash', col: 'var(--muted)' },
    other: { label: 'Other', short: 'Other', col: 'var(--shade2)' },
  };
  // common bond funds (taxable interest); municipal-bond funds are left out on purpose (their interest is usually federal-tax-free)
  const BOND_FUNDS = new Set(['BND', 'AGG', 'BNDX', 'BNDW', 'TLT', 'IEF', 'IEI', 'SHY', 'SCHZ', 'SCHR', 'SCHO', 'SCHP', 'TIP', 'VTIP', 'STIP', 'VGIT', 'VGSH', 'VGLT', 'VCIT', 'VCSH', 'VCLT', 'LQD', 'HYG', 'JNK', 'USHY', 'MBB', 'VMBS', 'GOVT', 'SGOV', 'BIL', 'FBND', 'FXNAX', 'VBTLX', 'VBMFX', 'SWAGX', 'BSV', 'BIV', 'BLV', 'IUSB', 'SPAB', 'SPTL', 'SPTI', 'SPSB', 'EMB']);
  function classOf(p) {
    const k = p.kind;
    if (k === 'option' || k === 'future_option') return 'options';
    if (k === 'cash') return 'cash';
    if (k === 'crypto') return 'crypto';
    if (k === 'bond' || BOND_FUNDS.has(String(p.symbol || '').toUpperCase())) return 'bonds';
    if (k === 'etf' || k === 'mutualfund' || k === 'cef') return 'funds';
    if (k === 'stock' || k === 'adr' || k === 'preferred_stock') return 'stocks';
    return 'other';
  }
  const ACT = { DIVIDEND: 'Dividend', SUBSTITUTE_DIVIDEND: 'Dividend (in lieu)', STOCK_DIVIDEND: 'Stock dividend', REI: 'Reinvested dividend', INTEREST: 'Interest', FEE: 'Fee', TAX: 'Tax', BUY: 'Buy', SELL: 'Sell', CONTRIBUTION: 'Contribution', WITHDRAWAL: 'Withdrawal', OPTIONEXPIRATION: 'Option expired', OPTIONASSIGNMENT: 'Option assigned', OPTIONEXERCISE: 'Option exercised', TRANSFER: 'Transfer', SPLIT: 'Split' };
  const OPT_ACT = { SELL_TO_OPEN: 'Sold to open', BUY_TO_CLOSE: 'Bought to close', BUY_TO_OPEN: 'Bought to open', SELL_TO_CLOSE: 'Sold to close' };

  /* ---------------- the numbers ---------------- */
  function analyze(d, today) {
    const now = today ? day0(today) : day0(new Date());
    const acts = (d.activities || []).filter((x) => x && x.date);
    const accounts = (d.accounts || []).map((a) => {
      const tax = taxType(a);
      const raw = Array.isArray(a.positions) ? a.positions : [];
      const cashPos = sum(raw.filter((p) => p && (p.kind === 'cash')), (p) => n0(p.units) * (has(p.price) ? p.price : 1));
      const cash = has(a.cash) ? a.cash : cashPos;
      const pos = raw.filter((p) => p && p.kind !== 'cash' && !p.cashEquivalent && has(p.units) && p.units !== 0).map((p) => {
        const opt = p.option || null;
        const mult = opt ? (opt.multiplier || 100) : 1;
        const price = has(p.price) ? p.price : null;
        const mv = price == null ? 0 : p.units * price * mult;
        const basis = has(p.costBasis) && p.costBasis > 0 ? p.costBasis : null;
        const cost = basis == null ? null : p.units * basis * mult;
        const pl = cost == null || price == null ? null : mv - cost;
        let st = null, lt = null, lots = null;
        if (Array.isArray(p.lots) && p.lots.length && price != null) {
          st = 0; lt = 0;
          lots = p.lots.filter((l) => has(l.qty)).map((l) => {
            const dt = parseDay(l.date); const age = dt ? daysBetween(dt, now) : null;
            const b = has(l.basis) ? l.basis : has(l.price) ? l.price * l.qty : null;
            const v = price * l.qty, g = b == null ? null : v - b;
            const term = age == null ? null : age > 365 ? 'long' : 'short'; // held more than one year: long-term
            if (g != null) { if (term === 'long') lt += g; else st += g; }
            return { date: l.date, qty: l.qty, basis: b, gain: g, term, age };
          });
        }
        return { symbol: p.symbol || '—', desc: p.description || '', kind: p.kind, cls: classOf(p), units: p.units, price, mult, mv, basis, cost, pl, plPct: cost ? pl / Math.abs(cost) : null, st, lt, lots, option: opt, account: a.id };
      });
      const mv = sum(pos, (p) => p.mv);
      const value = has(a.value) ? a.value : cash + mv;
      return { id: a.id, name: a.name || 'Account', number: a.number || '', rawType: a.rawType || '', tax, cash, mv, value, pos, history: Array.isArray(a.history) ? a.history : null, connectionId: a.connectionId, asOf: a.asOf, synced: a.synced || {} };
    });
    const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));
    const total = sum(accounts, (a) => a.value);
    const cash = sum(accounts, (a) => a.cash);
    const positions = accounts.flatMap((a) => a.pos.map((p) => Object.assign({}, p, { acct: a })));
    const holdings = positions.filter((p) => p.cls !== 'options');
    const options = positions.filter((p) => p.cls === 'options' && p.option);
    // allocation (short options are a liability: shown apart, not as a slice)
    const alloc = {}; Object.keys(CLS).forEach((k) => { alloc[k] = 0; });
    positions.forEach((p) => { if (p.mv > 0) alloc[p.cls] += p.mv; });
    alloc.cash += Math.max(0, cash);
    const shortOpt = sum(positions.filter((p) => p.mv < 0), (p) => p.mv);
    const allocTotal = sum(Object.values(alloc));
    // the same symbol across accounts counts once
    const bySym = {};
    holdings.forEach((p) => { if (p.mv <= 0) return; const k = p.symbol; const o = bySym[k] || (bySym[k] = { symbol: k, desc: p.desc, cls: p.cls, mv: 0, pl: 0, cost: 0, accounts: new Set() }); o.mv += p.mv; if (p.pl != null) { o.pl += p.pl; o.cost += p.cost; } o.accounts.add(p.acct.name); });
    const ranked = Object.values(bySym).sort((x, y) => y.mv - x.mv);
    ranked.forEach((h) => { h.share = total ? h.mv / total : 0; });
    const top = ranked[0] || null;
    const top5 = ranked.slice(0, 5).reduce((s, h) => s + h.share, 0);
    const invested = sum(ranked, (h) => h.mv);
    const stockShare = invested ? sum(ranked.filter((h) => h.cls === 'stocks'), (h) => h.mv) / invested : 0;
    const fundShare = invested ? sum(ranked.filter((h) => h.cls === 'funds' || h.cls === 'bonds'), (h) => h.mv) / invested : 0;
    // gains
    const withBasis = positions.filter((p) => p.pl != null);
    const unreal = sum(withBasis, (p) => p.pl);
    const unrealCost = sum(withBasis, (p) => Math.abs(p.cost));
    const lotsKnown = holdings.some((p) => p.lots);
    const stTot = sum(holdings, (p) => p.st), ltTot = sum(holdings, (p) => p.lt);
    // value history: accounts added up, from the first day every account has a value
    let history = null;
    const hs = accounts.filter((a) => a.history && a.history.length > 1);
    if (hs.length && hs.length === accounts.length) {
      const start = hs.map((a) => a.history[0][0]).sort().pop();
      const dates = Array.from(new Set(hs.flatMap((a) => a.history.map((h) => h[0])))).filter((x) => x >= start).sort();
      const last = hs.map(() => null), idx = hs.map(() => 0);
      history = dates.map((dt) => { let s = 0; hs.forEach((a, i) => { while (idx[i] < a.history.length && a.history[idx[i]][0] <= dt) { last[i] = a.history[idx[i]][1]; idx[i]++; } s += n0(last[i]); }); return [dt, s]; });
      if (history.length < 2) history = null;
    }
    const dayChange = history ? { v: history[history.length - 1][1] - history[history.length - 2][1], since: history[history.length - 2][0], base: history[history.length - 2][1] } : null;
    const yearChange = history ? { v: history[history.length - 1][1] - history[0][1], since: history[0][0], base: history[0][1] } : null;
    // activity in the last 12 months
    const yearAgo = new Date(now); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const recent = acts.filter((x) => { const dt = parseDay(x.date); return dt && dt >= yearAgo && dt <= new Date(now.getTime() + 864e5); });
    const months = []; for (let i = 11; i >= 0; i--) { const m = new Date(now.getFullYear(), now.getMonth() - i, 1, 12); months.push({ key: iso(m).slice(0, 7), label: m.toLocaleDateString('en-US', { month: 'short' }), year: m.getFullYear(), div: 0, int: 0, prem: 0, fees: 0 }); }
    const mIdx = Object.fromEntries(months.map((m, i) => [m.key, i]));
    const isDiv = (t) => t === 'DIVIDEND' || t === 'SUBSTITUTE_DIVIDEND';
    let premTax = 0;
    recent.forEach((x) => {
      const i = mIdx[String(x.date).slice(0, 7)]; if (i == null) return;
      const amt = n0(x.amount);
      if (isDiv(x.type)) months[i].div += amt;
      else if (x.type === 'INTEREST') months[i].int += amt;
      else if (x.type === 'FEE') months[i].fees += Math.abs(amt);
      else if (x.option && (x.optionType === 'SELL_TO_OPEN' || x.optionType === 'BUY_TO_CLOSE')) { months[i].prem += amt; if (byId[x.accountId] && byId[x.accountId].tax === 'taxable') premTax += amt; }
      if (x.fee) months[i].fees += Math.abs(n0(x.fee));
    });
    const income = { div: sum(months, (m) => m.div), int: sum(months, (m) => m.int), prem: sum(months, (m) => m.prem), fees: sum(months, (m) => m.fees), months, any: recent.length > 0, premTaxable: premTax };
    income.total = income.div + income.int + income.prem;
    income.divTaxable = sum(recent.filter((x) => isDiv(x.type) && byId[x.accountId] && byId[x.accountId].tax === 'taxable'), (x) => x.amount);
    // options: what each open contract is, how far from the strike, what assignment would mean
    const priceOf = (sym) => { const h = holdings.find((p) => p.symbol === sym && p.price != null); return h ? h.price : (d.quotes && d.quotes[sym]) || quotes[sym] || null; };
    const sharesIn = (acctId, sym) => sum(holdings.filter((p) => p.acct.id === acctId && p.symbol === sym), (p) => p.units);
    const putCollateral = {};
    const opts = options.map((p) => {
      const o = p.option, short = p.units < 0, contracts = Math.abs(p.units), mult = o.multiplier || 100;
      const S0 = o.underlying ? priceOf(o.underlying) : null, K = o.strike;
      const exp = parseDay(o.expiry), dte = exp ? daysBetween(now, exp) : null;
      let itm = null, dist = null;
      if (S0 != null && K) { itm = o.type === 'CALL' ? S0 > K : S0 < K; dist = (S0 - K) / K; }
      const covered = short && o.type === 'CALL' ? sharesIn(p.acct.id, o.underlying) >= contracts * mult : null;
      const collateral = short && o.type === 'PUT' && K ? K * mult * contracts : 0;
      if (collateral) putCollateral[p.acct.id] = (putCollateral[p.acct.id] || 0) + collateral;
      const premium = p.basis != null ? p.basis * mult * contracts : null; // received (short) or paid (long)
      const opened = acts.filter((x) => x.option && x.option.underlying === o.underlying && x.option.type === o.type && Math.abs(n0(x.option.strike) - K) < 0.001 && x.option.expiry === o.expiry && x.optionType === (short ? 'SELL_TO_OPEN' : 'BUY_TO_OPEN')).map((x) => parseDay(x.date)).filter(Boolean).sort((a, b) => a - b)[0] || null;
      const span = opened && exp ? Math.max(1, daysBetween(opened, exp)) : null;
      const yieldAnn = short && premium != null && span ? premium / (collateral || (S0 ? S0 * mult * contracts : 0) || NaN) * (365 / span) : null;
      let role = short ? (o.type === 'CALL' ? (covered ? 'Covered call' : 'Short call') : 'Cash-secured put') : (o.type === 'CALL' ? 'Long call' : 'Long put');
      const ifAssigned = short && o.type === 'PUT' && K ? { buy: K * mult * contracts, shares: mult * contracts, share: total ? ((bySym[o.underlying] ? bySym[o.underlying].mv : 0) + K * mult * contracts) / total : null }
        : short && o.type === 'CALL' && K ? { sell: K * mult * contracts, shares: mult * contracts, gain: (() => { const h = holdings.find((q) => q.acct.id === p.acct.id && q.symbol === o.underlying); return h && h.basis != null ? (K - h.basis) * mult * contracts : null; })(), longTerm: (() => { const h = holdings.find((q) => q.acct.id === p.acct.id && q.symbol === o.underlying); return h && h.lots ? h.lots.every((l) => l.term === 'long') : null; })() } : null;
      return { p, o, short, contracts, mult, S0, K, dte, itm, dist, covered, collateral, premium, value: p.mv, pl: p.pl, opened, yieldAnn, role, ifAssigned, acct: p.acct };
    }).sort((a, b) => n0(a.dte) - n0(b.dte));
    Object.keys(putCollateral).forEach((id) => { opts.filter((x) => x.acct.id === id && x.collateral).forEach((x) => { x.secured = byId[id].cash >= putCollateral[id] - 0.5; if (!x.secured) x.role = 'Short put'; }); });
    // the wheel, per underlying: premium collected, assignments and where each cycle stands now
    const wheel = {};
    const W = (u) => wheel[u] || (wheel[u] = { u, prem: 0, puts: 0, calls: 0, assigned: 0, calledAway: 0 });
    acts.forEach((x) => {
      const dt = parseDay(x.date); if (!dt || dt < yearAgo) return;
      if (x.option && x.option.underlying && (x.optionType === 'SELL_TO_OPEN' || x.optionType === 'BUY_TO_CLOSE')) {
        const w = W(x.option.underlying); w.prem += n0(x.amount);
        if (x.optionType === 'SELL_TO_OPEN') { if (x.option.type === 'PUT') w.puts += Math.abs(n0(x.units)) || 1; else w.calls += Math.abs(n0(x.units)) || 1; }
      }
      if (x.type === 'OPTIONASSIGNMENT') { const u = (x.option && x.option.underlying) || x.symbol; if (!u) return; const w = W(u); if ((x.option && x.option.type === 'CALL') || n0(x.units) < 0 || n0(x.amount) > 0) w.calledAway++; else w.assigned++; }
    });
    const wheels = Object.values(wheel).filter((w) => w.puts || w.calls).map((w) => {
      const sh = sum(holdings.filter((p) => p.symbol === w.u), (p) => p.units);
      const openPut = opts.some((x) => x.short && x.o.type === 'PUT' && x.o.underlying === w.u), openCall = opts.some((x) => x.short && x.o.type === 'CALL' && x.o.underlying === w.u);
      const stage = openPut && sh < 100 ? 'Selling puts' : sh >= 100 && openCall ? 'Shares + covered calls' : sh >= 100 ? 'Holding shares, no call open' : openPut ? 'Selling puts' : 'Between cycles';
      const h = holdings.find((p) => p.symbol === w.u && p.basis != null);
      const adj = h && sh > 0 ? h.basis - w.prem / sh : null;
      return Object.assign(w, { shares: sh, stage, basis: h ? h.basis : null, adjBasis: adj });
    }).sort((a, b) => b.prem - a.prem);
    // tax-loss harvest candidates: taxable accounts, a loss of at least $100 and 3%
    const ira = new Set(accounts.filter((a) => a.tax !== 'taxable').flatMap((a) => a.pos.map((p) => p.symbol)));
    const buys = acts.filter((x) => (x.type === 'BUY' || x.type === 'REI') && x.symbol);
    const tlh = holdings.filter((p) => p.acct.tax === 'taxable' && p.pl != null && p.pl <= -100 && p.plPct <= -0.03 && p.cls !== 'crypto').map((p) => {
      const recentBuy = buys.filter((x) => x.symbol === p.symbol).map((x) => parseDay(x.date)).filter((dt) => dt && daysBetween(dt, now) <= 30 && daysBetween(dt, now) >= 0).sort((a, b) => b - a)[0] || null;
      const stLoss = p.lots ? p.st : null, ltLoss = p.lots ? p.lt : null; // net per term, so the two add up to the total
      return { p, recentBuy, inIra: ira.has(p.symbol), stLoss, ltLoss };
    }).sort((a, b) => a.p.pl - b.p.pl);
    const taxSplit = {}; Object.keys(TAX).forEach((k) => { taxSplit[k] = 0; });
    accounts.forEach((a) => { taxSplit[a.tax] += a.value; });
    const bondsTaxable = holdings.filter((p) => p.cls === 'bonds' && p.acct.tax === 'taxable' && p.mv > 0);
    return { accounts, byId, total, cash, positions, holdings, options: opts, alloc, allocTotal, shortOpt, ranked, top, top5, invested, stockShare, fundShare, unreal, unrealCost, lotsKnown, stTot, ltTot, history, dayChange, yearChange, income, wheels, tlh, taxSplit, bondsTaxable, now };
  }

  /* ---------------- observations (each one links to the lesson that explains it) ---------------- */
  function insights(A) {
    const out = [];
    const add = (level, title, body, links) => out.push({ level, title, body, links });
    const topStock = A.ranked.find((h) => h.cls === 'stocks');
    if (topStock && topStock.share >= 0.1) {
      add(topStock.share >= 0.2 ? 'warn' : 'info', `${topStock.symbol} is ${pct(topStock.share, 0)} of everything here`,
        `One company is a large share of this portfolio, so its bad year would be your bad year. Is that on purpose? The position-sizing lessons show how traders cap what any one idea can cost them.`, [['l-position-size', 'Position sizing'], ['l-drawdowns', 'Losses are lopsided'], ['tool-size', 'Position size tool']]);
    }
    if (A.ranked.length >= 6 && A.top5 >= 0.6) add('info', `Your five largest holdings are ${pct(A.top5, 0)} of the total`, 'Concentration is not wrong in itself, but it decides how bumpy the ride is. Funds spread the same money over hundreds of companies.', [['l-etfs', 'Index funds and ETFs'], ['l-index-funds', 'VTWAX, VTI and VOO']]);
    if (A.invested && A.stockShare >= 0.5) add('info', `${pct(A.stockShare, 0)} of your invested money is in single stocks`, 'Picking stocks is a different job from owning the market. How did you choose these, and what would make you change your mind about one?', [['l-stock-picking', 'Which stocks to trade'], ['l-value', 'Value investing'], ['l-blend', 'Blending styles']]);
    const cashShare = A.total ? A.cash / A.total : 0;
    const collateral = sum(A.options.filter((o) => o.collateral), (o) => o.collateral);
    if (cashShare >= 0.15) add('info', `Cash is ${pct(cashShare, 0)} of this portfolio`, `${collateral ? `${usd(collateral)} of it backs your cash-secured puts. ` : ''}Is the rest a deliberate reserve, like an emergency fund, or money waiting for a plan? Cash is steady, but it does not grow with the market.`, [['l-emergency', 'Emergency fund and where to park cash'], ['l-allocation', 'Stocks, bonds and your age']]);
    A.options.filter((o) => o.ifAssigned && o.ifAssigned.share != null && o.ifAssigned.share >= 0.1 && o.o.type === 'PUT').forEach((o) => add('info', `If your ${o.o.underlying} put is assigned, ${o.o.underlying} becomes about ${pct(o.ifAssigned.share, 0)} of the portfolio`, `Assignment means buying ${o.ifAssigned.shares} shares for ${usd(o.ifAssigned.buy)}. Would you be comfortable owning that much of one company? The wheel only works on stocks you are happy to hold.`, [['l-wheel', 'The wheel strategy'], ['l-position-size', 'Position sizing'], ['tool-wheel', 'Wheel income tool']]));
    A.options.filter((o) => o.short && o.o.type === 'CALL' && o.acct.tax === 'taxable' && o.ifAssigned && o.ifAssigned.gain > 0).forEach((o) => add('info', `Your ${o.o.underlying} call could sell shares with a ${usd(o.ifAssigned.gain)} gain`, `If the shares are called away at ${F.usd(o.K, 2)}, that gain is realized and taxed for this year${o.ifAssigned.longTerm === true ? ' at long-term rates (every lot is over a year old)' : o.ifAssigned.longTerm === false ? ', partly or fully as a short-term gain (some lots are a year old or less)' : ''}. Worth knowing before expiry, not a reason to act on its own.`, [['l-wheel-tax', 'How the wheel is taxed'], ['l-cap-gains', 'Short vs long-term gains']]));
    A.options.filter((o) => o.short && o.dte != null && o.dte >= 0 && o.dte <= 7).forEach((o) => add('info', `${o.o.underlying} ${o.o.type === 'PUT' ? 'put' : 'call'} expires in ${o.dte === 0 ? 'less than a day' : o.dte + (o.dte === 1 ? ' day' : ' days')}`, `${o.itm ? 'It is in the money, so assignment is likely if it stays there.' : 'Time value melts fastest in the last days, which is what option sellers collect; it also leaves little time for anything to change.'} What is your plan at expiry?`, [['l-theta', 'Theta: time decay'], ['l-contracts', 'Contracts and moneyness']]));
    if (A.tlh.length) add('info', `${A.tlh.length === 1 ? 'One position is' : A.tlh.length + ' positions are'} below cost in a taxable account`, `Unrealized losses total ${usd(-sum(A.tlh, (t) => t.p.pl))}. Selling at a loss can offset gains (and up to $3,000 a year of other income), but buying the same thing within 30 days before or after cancels the loss: the wash sale rule.${A.tlh.some((t) => t.recentBuy) ? ' At least one was bought in the last 30 days.' : ''}`, [['l-tax-loss', 'Tax-loss harvesting'], ['l-wash-sale', 'The wash sale rule'], ['tool-tlh', 'Tax-loss harvest tool']]);
    if (A.bondsTaxable.length && A.taxSplit.deferred + A.taxSplit.roth > 0) add('info', `Bond funds in a taxable account: ${A.bondsTaxable.map((p) => p.symbol).filter((v, i, s) => s.indexOf(v) === i).join(', ')}`, 'Bond interest is taxed every year as ordinary income. Many people keep bond funds in tax-deferred accounts and stock funds in taxable ones, which is called asset location.', [['l-asset-location', 'Asset location'], ['l-bonds', 'Bonds and interest rates']]);
    if (A.income.premTaxable > 200 && A.taxSplit.deferred + A.taxSplit.roth > 0) add('info', `${usd(A.income.premTaxable)} of option premium in a taxable account this year`, 'Premium from options that expire or are bought back is usually a short-term capital gain. Some people run the wheel inside an IRA instead, where it has its own rules.', [['l-wheel-tax', 'How the wheel is taxed'], ['l-wheel-ira', 'Run the wheel in an IRA']]);
    const deep = A.ranked.filter((h) => h.cost > 0 && h.pl / h.cost <= -0.3);
    if (deep.length) add('info', `${deep.map((h) => h.symbol).slice(0, 3).join(', ')} ${deep.length === 1 ? 'is' : 'are'} down 30% or more from cost`, 'A 30% loss needs a 43% gain to get back to even, and a 50% loss needs 100%. What would have to be true for this to recover?', [['l-drawdowns', 'Losses are lopsided'], ['tool-drawdown', 'Drawdown recovery']]);
    if (A.income.fees >= 1) add('info', `${F.usd(A.income.fees, 2)} in fees over the last 12 months`, 'Small fees add up over decades. Fund expense ratios are not in this list: they come out of the fund’s price.', [['l-broker', 'Choosing a broker'], ['tool-compound', 'Compound interest']]);
    return out;
  }

  /* ---------------- the sample portfolio (made up) ---------------- */
  function demo() {
    const now = day0(new Date());
    const d = (n) => iso(new Date(now.getTime() + n * 864e5));
    const fri = (n) => { const x = new Date(now.getTime() + n * 864e5); while (x.getDay() !== 5) x.setDate(x.getDate() + 1); return iso(x); };
    const lot = (date, qty, price) => ({ date, qty, price, basis: qty * price });
    const pepExp = fri(16), amdExp = fri(30);
    const tax = [
      { kind: 'etf', symbol: 'VOO', description: 'Vanguard S&P 500 ETF', units: 60, price: 612.40, costBasis: 471.10, lots: [lot('2022-03-14', 40, 395.0), lot(d(-240), 20, 623.3)] },
      { kind: 'stock', symbol: 'MSFT', description: 'Microsoft Corporation', units: 25, price: 505.20, costBasis: 338.00, lots: [lot('2021-08-02', 25, 338.0)] },
      { kind: 'stock', symbol: 'AMD', description: 'Advanced Micro Devices, Inc.', units: 100, price: 162.30, costBasis: 128.50, lots: [lot(d(-212), 100, 128.5)] },
      { kind: 'stock', symbol: 'SOFI', description: 'SoFi Technologies, Inc.', units: 400, price: 14.85, costBasis: 17.90, lots: [lot(d(-150), 300, 19.10), lot(d(-9), 100, 14.30)] },
      { kind: 'etf', symbol: 'AGG', description: 'iShares Core U.S. Aggregate Bond ETF', units: 120, price: 99.80, costBasis: 101.50, lots: [lot(d(-420), 120, 101.5)] },
      { kind: 'option', symbol: 'AMD ' + amdExp + ' 175 C', description: 'AMD call', units: -1, price: 3.20, costBasis: 4.60, option: { type: 'CALL', strike: 175, expiry: amdExp, multiplier: 100, underlying: 'AMD' } },
      { kind: 'option', symbol: 'PEP ' + pepExp + ' 140 P', description: 'PEP put', units: -1, price: 1.95, costBasis: 2.60, option: { type: 'PUT', strike: 140, expiry: pepExp, multiplier: 100, underlying: 'PEP' } },
    ];
    const roth = [
      { kind: 'mutualfund', symbol: 'FXAIX', description: 'Fidelity 500 Index Fund', units: 150, price: 228.50, costBasis: 190.20 },
      { kind: 'etf', symbol: 'VEA', description: 'Vanguard FTSE Developed Markets ETF', units: 200, price: 57.10, costBasis: 49.80 },
      { kind: 'etf', symbol: 'SCHD', description: 'Schwab U.S. Dividend Equity ETF', units: 180, price: 27.90, costBasis: 26.40 },
    ];
    const value = (ps, cash) => cash + ps.reduce((s, p) => s + p.units * p.price * (p.option ? 100 : 1), 0);
    const hist = (end, seed) => { const r = SML.rng(seed); const pts = []; let v = 1; for (let i = 365; i >= 0; i--) { const x = new Date(now.getTime() - i * 864e5); if (x.getDay() === 0 || x.getDay() === 6) continue; v *= 1 + 0.0006 + r.gauss() * 0.0085; pts.push([iso(x), v]); } const k = end / pts[pts.length - 1][1]; const out = pts.map((p) => [p[0], Math.round(p[1] * k * 100) / 100]); out[out.length - 2][1] = Math.round(end / 1.0058 * 100) / 100; return out; };
    const acts = [];
    const A = (acct, n, type, o) => acts.push(Object.assign({ id: 'demo-' + acts.length, accountId: acct, date: d(n), type, units: 0, price: 0, amount: 0, fee: 0 }, o || {}));
    const opt = (u, type, strike, expiry) => ({ underlying: u, type, strike, expiry });
    for (let m = 1; m <= 11; m++) {
      const pe = d(-30 * m + 20);
      A('demo-tax', -30 * m + 2, 'SELL', { optionType: 'SELL_TO_OPEN', option: opt('PEP', 'PUT', 138 + (m % 3) * 2, pe), units: -1, price: 2.1, amount: 205 + 4 * (m % 4), description: 'Sold PEP put' });
      A('demo-tax', -30 * m + 20, 'OPTIONEXPIRATION', { option: opt('PEP', 'PUT', 138 + (m % 3) * 2, pe), description: 'PEP put expired' });
      if (m <= 6) A('demo-tax', -30 * m + 4, 'SELL', { optionType: 'SELL_TO_OPEN', option: opt('AMD', 'CALL', 150 + 3 * m, d(-30 * m + 25)), units: -1, price: 3.9, amount: 385 + 10 * m, description: 'Sold AMD call' });
      A('demo-tax', -30 * m + 1, 'INTEREST', { amount: 31 + m, description: 'Interest on cash' });
      A('demo-tax', -30 * m - 4, 'DIVIDEND', { symbol: 'AGG', amount: 38.5, description: 'AGG dividend' });
    }
    A('demo-tax', -8 * 30 + 3, 'SELL', { optionType: 'SELL_TO_OPEN', option: opt('AMD', 'PUT', 130, d(-212)), units: -1, price: 3.1, amount: 305, description: 'Sold AMD put' });
    A('demo-tax', -212, 'OPTIONASSIGNMENT', { symbol: 'AMD', option: opt('AMD', 'PUT', 130, d(-212)), units: 100, price: 130, amount: -13000, description: 'AMD put assigned: bought 100 shares at $130' });
    A('demo-tax', -95, 'SELL', { optionType: 'BUY_TO_CLOSE', option: opt('AMD', 'CALL', 165, d(-80)), units: 1, price: 6.4, amount: -640, description: 'Bought back AMD call' });
    for (let q = 0; q < 4; q++) {
      A('demo-tax', -90 * q - 25, 'DIVIDEND', { symbol: 'VOO', amount: 104.4, description: 'VOO dividend' });
      A('demo-tax', -90 * q - 40, 'DIVIDEND', { symbol: 'MSFT', amount: 22.75, description: 'MSFT dividend' });
      A('demo-roth', -90 * q - 12, 'DIVIDEND', { symbol: 'SCHD', amount: 47.0, description: 'SCHD dividend' });
    }
    A('demo-roth', -170, 'DIVIDEND', { symbol: 'VEA', amount: 88.2, description: 'VEA dividend' });
    A('demo-roth', -300, 'CONTRIBUTION', { amount: 7500, description: 'Roth IRA contribution' });
    A('demo-tax', -2, 'SELL', { optionType: 'SELL_TO_OPEN', option: opt('PEP', 'PUT', 140, pepExp), units: -1, price: 2.6, amount: 260, description: 'Sold PEP put' });
    A('demo-tax', -5, 'SELL', { optionType: 'SELL_TO_OPEN', option: opt('AMD', 'CALL', 175, amdExp), units: -1, price: 4.6, amount: 460, description: 'Sold AMD call' });
    A('demo-tax', -9, 'BUY', { symbol: 'SOFI', units: 100, price: 14.30, amount: -1430, description: 'Bought SOFI' });
    A('demo-tax', -63, 'FEE', { amount: -4.5, description: 'Regulatory fee' });
    acts.sort((x, y) => (x.date < y.date ? 1 : -1));
    const tv = value(tax, 16400), rv = value(roth, 640);
    return {
      demo: true, asOf: new Date().toISOString(),
      connections: [{ id: 'demo-conn', broker: 'Sample Brokerage', type: 'read', disabled: false }],
      accounts: [
        { id: 'demo-tax', connectionId: 'demo-conn', name: 'Individual (sample)', number: '****0001', rawType: 'Individual', cash: 16400, value: tv, positions: tax, history: hist(tv, 7) },
        { id: 'demo-roth', connectionId: 'demo-conn', name: 'Roth IRA (sample)', number: '****0002', rawType: 'Roth IRA', cash: 640, value: rv, positions: roth, history: hist(rv, 11) },
      ],
      activities: acts,
      quotes: { PEP: 142.80 }, // the sample's stock price for the put (the live page looks up the last close)
    };
  }

  /* ---------------- charts ---------------- */
  function donut(items, total, size, top, bottom, label) {
    const cx = size / 2, r = size / 2 - 11, c = 2 * Math.PI * r, w = 15; let off = 0;
    let s = S.circle(cx, cx, r, 'nf s-line', ` stroke-width="${w}"`);
    const gap = items.length > 1 ? 2.5 : 0;
    items.forEach((it) => { const len = (it.v / total) * c, L = Math.max(0.5, len - gap); s += `<circle cx="${cx}" cy="${cx}" r="${r.toFixed(1)}" class="nf" style="stroke:${it.col}" stroke-width="${w}" stroke-dasharray="${L.toFixed(2)} ${(c - L).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"><title>${esc(it.label)}: ${usd(it.v)}</title></circle>`; off += len; });
    s += S.text(cx, cx + 2, top, 'lg b ink mono', 'middle') + S.text(cx, cx + 18, bottom, 'xs mut mono', 'middle');
    return S.wrap(size, size, label, s);
  }
  const niceSteps = (lo, hi, n) => { const span = hi - lo || 1; const s0 = span / n; const mag = Math.pow(10, Math.floor(Math.log10(s0))); const f = s0 / mag; const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag; const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step; const t = []; for (let v = a; v <= b + step / 2; v += step) t.push(Math.round(v / step) * step); return { lo: a, hi: b === a ? a + step : b, ticks: t }; };
  function drawHistory(el, hist, W) {
    const H = W < 520 ? 190 : 230, L = 4, R = 58, T = 14, B = 26;
    const pts = hist.map((h) => ({ t: +parseDay(h[0]), d: h[0], v: h[1] }));
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const vs = pts.map((p) => p.v); const nk = niceSteps(Math.min(...vs) * 0.98, Math.max(...vs) * 1.01, 4);
    const xf = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R), yf = (v) => T + (1 - (v - nk.lo) / (nk.hi - nk.lo)) * (H - T - B);
    let s = S.hgrid(nk.ticks.map(yf), L, W - R) + S.yaxis(nk.ticks, yf, W - R + 8, kfmt, 'xs mono mut');
    const P = pts.map((p) => [xf(p.t), yf(p.v)]);
    s += S.area(P, yf(nk.lo), 'f-up-t') + S.poly(P, 's-up w2');
    const lp = P[P.length - 1]; s += S.circle(lp[0], lp[1], 8, 'f-up-t') + S.circle(lp[0], lp[1], 4, 'f-up');
    s += S.text(xf(t0), H - 6, mDY(pts[0].d), 'xs mono mut', 'start') + S.text(xf(t1), H - 6, mDY(pts[pts.length - 1].d), 'xs mono mut', 'end');
    s += `<line class="s-mut w1 dash" data-g x1="0" x2="0" y1="${T}" y2="${H - B}" opacity="0"/><circle data-gc r="4" cx="0" cy="0" class="f-ink" opacity="0"/>`;
    const first = pts[0], last = pts[pts.length - 1];
    el.innerHTML = S.wrap(W, H, `Estimated total value from ${mDY(first.d)} (${usd(first.v)}) to ${mDY(last.d)} (${usd(last.v)})`, s) + '<div class="wg-tip" hidden></div>';
    const svg = $('svg', el), tip = $('.wg-tip', el), g = $('[data-g]', el), gc = $('[data-gc]', el);
    const hide = () => { tip.hidden = true; g.setAttribute('opacity', 0); gc.setAttribute('opacity', 0); };
    const move = (e) => {
      const r = svg.getBoundingClientRect(); const x = e.clientX - r.left;
      let bi = 0, bd = 1e9; P.forEach((p, i) => { const dd = Math.abs(p[0] - x); if (dd < bd) { bd = dd; bi = i; } });
      const [px, py] = P[bi];
      g.setAttribute('x1', px); g.setAttribute('x2', px); gc.setAttribute('cx', px); gc.setAttribute('cy', py); g.setAttribute('opacity', 1); gc.setAttribute('opacity', 1);
      tip.innerHTML = `${esc(mDY(pts[bi].d))}<br><b>${usd(pts[bi].v)}</b>`; tip.hidden = false; tip.style.left = Math.max(70, Math.min(W - 70, px)) + 'px'; tip.style.top = py + 'px';
    };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', hide);
  }
  function drawBars(el, rows, W, total) { // largest positions, as a share of the whole portfolio
    const lab = W < 480 ? 54 : 70, R = 64, rowH = 26, T = 6, H = T + rows.length * rowH + 20;
    const maxS = Math.max(0.12, ...rows.map((r) => r.share));
    const xf = (v) => lab + (v / maxS) * (W - lab - R);
    let s = '';
    rows.forEach((r, i) => {
      const y = T + i * rowH;
      s += S.text(0, y + 16, esc(r.symbol), 'sm b ink mono') + S.rect(lab, y + 5, Math.max(2, xf(r.share) - lab), 14, '', 3, ` style="fill:${CLS[r.cls] ? CLS[r.cls].col : 'var(--muted)'}"`);
      s += S.text(xf(r.share) + 6, y + 16, pct(r.share, 1), 'xs mono mut');
    });
    if (maxS >= 0.1) { const x = xf(0.1); s += S.line(x, T, x, H - 18, 's-acc w1 dash') + S.text(x, H - 4, '10%', 'xs mono acc', 'middle'); }
    el.innerHTML = S.wrap(W, H, `Largest holdings as a share of ${usd(total)}: ` + rows.map((r) => `${r.symbol} ${pct(r.share, 1)}`).join(', '), s);
  }
  function drawIncome(el, months, W) {
    const H = W < 520 ? 180 : 210, L = 4, R = 52, T = 12, B = 24;
    const pos = months.map((m) => Math.max(0, m.div) + Math.max(0, m.int) + Math.max(0, m.prem)), neg = months.map((m) => Math.min(0, m.prem));
    const nk = niceSteps(Math.min(0, ...neg), Math.max(1, ...pos), 4);
    const slot = (W - L - R) / months.length, bw = Math.max(6, Math.min(26, slot * 0.6));
    const yf = (v) => T + (1 - (v - nk.lo) / (nk.hi - nk.lo)) * (H - T - B);
    let s = S.hgrid(nk.ticks.map(yf), L, W - R) + S.yaxis(nk.ticks, yf, W - R + 8, kfmt, 'xs mono mut');
    months.forEach((m, i) => {
      const x = L + slot * i + (slot - bw) / 2; let base = 0;
      [['div', 'var(--up)'], ['int', 'var(--info)'], ['prem', 'var(--accent)']].forEach(([k, col]) => { const v = Math.max(0, m[k]); if (v <= 0) return; s += S.rect(x, yf(base + v), bw, yf(base) - yf(base + v), '', 0, ` style="fill:${col}"`); base += v; });
      if (m.prem < 0) s += S.rect(x, yf(0), bw, yf(m.prem) - yf(0), '', 0, ' style="fill:var(--down)"');
      if (months.length <= 12 && (W >= 520 || i % 2 === 0)) s += S.text(x + bw / 2, H - 6, m.label, 'xs mono mut', 'middle');
    });
    if (nk.lo < 0) s += S.line(L, yf(0), W - R, yf(0), 's-mut w1');
    el.innerHTML = S.wrap(W, H, 'Income by month for the last 12 months: dividends, interest and net option premium. The table below has the numbers.', s);
  }

  /* ---------------- styles ---------------- */
  SML.css(`
    .pf{padding-block:4px 80px;display:flex;flex-direction:column;gap:22px}
    p.pf-ro,.ph-side p.pf-ro{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:7px 12px;border-radius:99px;border:1px solid color-mix(in srgb,var(--up) 40%,var(--line));background:color-mix(in srgb,var(--up) 8%,transparent);font:600 12.5px/1.35 var(--sans);color:var(--ink)}
    p.pf-ro .pf-i{color:var(--up)}
    .pf-i{flex:0 0 auto;vertical-align:-3px}
    .pf-state{display:flex;flex-direction:column;gap:14px}
    .pf-state h2{font-family:var(--display);font-weight:400;font-size:clamp(28px,3vw,38px);line-height:.95;text-transform:uppercase;color:var(--ink);letter-spacing:.005em}
    .pf-state p{font-size:15px;line-height:1.6;color:color-mix(in srgb,var(--ink) 84%,transparent);max-width:70ch}
    .pf-facts{list-style:none;display:grid;gap:10px;grid-template-columns:1fr;margin:2px 0}
    @media(min-width:760px){.pf-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .pf-facts li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 84%,transparent);padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
    .pf-facts li b{color:var(--ink)} .pf-facts .pf-i{color:var(--accent);margin-top:2px}
    .pf-acts{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .pf-note{font-size:13px;line-height:1.55;color:var(--muted)}
    .pf-note a,.pf-ln{color:var(--accent);font-weight:600;text-decoration:none}
    .pf-note a:hover,.pf-ln:hover{text-decoration:underline}
    .pf-banner{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:10px;border:1px solid var(--line);background:var(--surface);font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 90%,transparent)}
    .pf-banner > div{min-width:0;flex:1;display:flex;flex-direction:column;gap:8px}
    .pf-banner b{color:var(--ink)}
    .pf-banner.ok{border-color:color-mix(in srgb,var(--up) 45%,var(--line));background:color-mix(in srgb,var(--up) 8%,var(--surface))} .pf-banner.ok > .pf-i{color:var(--up)}
    .pf-banner.warn{border-color:color-mix(in srgb,var(--accent) 50%,var(--line));background:color-mix(in srgb,var(--accent) 9%,var(--surface))} .pf-banner.warn > .pf-i{color:var(--accent)}
    .pf-banner.err{border-color:color-mix(in srgb,var(--down) 50%,var(--line));background:color-mix(in srgb,var(--down) 8%,var(--surface))} .pf-banner.err > .pf-i{color:var(--down)}
    .pf-sample{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:10px;border:1px dashed color-mix(in srgb,var(--accent) 60%,var(--line));background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--accent) 6%,transparent) 0 12px,transparent 12px 24px)}
    .pf-sample b{font:600 12px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
    .pf-sample span{font-size:13.5px;color:var(--muted)}
    .pf-bar{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
    .pf-conns{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-width:0}
    .pf-conn{display:inline-flex;align-items:center;gap:8px;padding:6px 11px;border-radius:99px;border:1px solid var(--line);font:600 12.5px/1.2 var(--sans);color:var(--ink)}
    .pf-conn .dot{width:8px;height:8px;border-radius:50%;background:var(--up)} .pf-conn.pf-off .dot{background:var(--down)}
    .pf-conn small{font:500 11px var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
    .pf-when{font:500 12px var(--mono);color:var(--muted)}
    .pf-confirm{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 14px;border:1px solid color-mix(in srgb,var(--down) 45%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--down) 7%,var(--surface));font-size:14px;color:var(--ink)}
    .pf-confirm p{flex:1 1 280px;line-height:1.5}
    .pf-grid2{display:grid;gap:22px;grid-template-columns:1fr}
    @media(min-width:1024px){.pf-grid2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
    .pf-fig{position:relative;min-width:0;margin-top:6px}
    .pf-fig svg{display:block;overflow:visible}
    .pf-fig .wg-tip{transform:translate(-50%,-100%);margin-top:-10px}
    .pf-alloc{display:flex;flex-wrap:wrap;gap:18px 24px;align-items:center}
    .pf-leg{list-style:none;display:flex;flex-direction:column;gap:8px;min-width:200px;flex:1}
    .pf-leg li{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--ink)}
    .pf-leg li span:nth-child(2){flex:1;min-width:0}
    .pf-leg li b{font:600 13px var(--mono);font-variant-numeric:tabular-nums}
    .pf-leg li small{font:500 12px var(--mono);color:var(--muted);width:4.2em;text-align:right}
    .pf-sw{width:10px;height:10px;border-radius:3px;background:var(--c,var(--muted));flex:0 0 10px}
    .pf-split{display:flex;height:14px;border-radius:99px;overflow:hidden;background:var(--line);margin:8px 0 12px}
    .pf-split i{display:block;height:100%;background:var(--c);min-width:2px}
    .pf-tw{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px}
    .pf-t{width:100%;border-collapse:collapse;font-size:13.5px;font-variant-numeric:tabular-nums}
    .pf-t th,.pf-t td{padding:9px 12px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--line)}
    .pf-t th:first-child,.pf-t td:first-child{text-align:left}
    .pf-t td.l,.pf-t th.l{text-align:left}
    .pf-t thead th{font:500 10.5px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);background:var(--shade)}
    .pf-t tbody tr:last-child td{border-bottom:0}
    .pf-t td b{color:var(--ink);font-weight:600}
    .pf-t td small{display:block;color:var(--muted);font-size:11.5px;white-space:normal;max-width:26ch}
    .pf-t .up{color:var(--up)} .pf-t .dn{color:var(--down)}
    .pf-t tfoot td{font-weight:600;color:var(--ink);background:var(--shade)}
    .pf-tag{display:inline-block;font:600 10px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;padding:4px 7px;border-radius:99px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
    .pf-tag.up{color:var(--up);border-color:color-mix(in srgb,var(--up) 40%,transparent)} .pf-tag.dn{color:var(--down);border-color:color-mix(in srgb,var(--down) 40%,transparent)} .pf-tag.acc{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
    .pf-ins{list-style:none;display:grid;gap:12px;grid-template-columns:1fr}
    @media(min-width:900px){.pf-ins{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .pf-ins li{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-width:0}
    .pf-ins li.warn{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
    .pf-ins li > .pf-i{color:var(--accent);margin-top:2px}
    .pf-ins h3{font-size:15px;font-weight:600;color:var(--ink);line-height:1.35;overflow-wrap:anywhere}
    .pf-ins p{font-size:13.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 80%,transparent);margin-top:4px}
    .pf-ins .pf-lks{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;font-size:13px}
    .pf-opts{display:grid;gap:12px;grid-template-columns:1fr}
    @media(min-width:760px){.pf-opts{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .pf-opt{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-width:0}
    .pf-opt-h{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline;justify-content:space-between}
    .pf-opt-h b{font:600 17px var(--mono);color:var(--ink)}
    .pf-opt dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 10px}
    .pf-opt dt{font:500 10px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
    .pf-opt dd{font:600 13.5px/1.35 var(--mono);color:var(--ink);overflow-wrap:anywhere}
    .pf-opt p{font-size:13px;line-height:1.5;color:color-mix(in srgb,var(--ink) 80%,transparent)}
    .pf-gauge{position:relative;height:6px;border-radius:99px;background:var(--line)}
    .pf-gauge i{position:absolute;top:-4px;width:2px;height:14px;background:var(--ink);left:var(--x)} .pf-gauge s{position:absolute;top:-6px;width:2px;height:18px;background:var(--accent);left:50%;text-decoration:none}
    .pf-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);margin-top:8px}
    .pf-legend span{display:inline-flex;align-items:center;gap:6px}
    details.pf-more{margin-top:10px} details.pf-more summary{cursor:pointer;color:var(--accent);font-weight:600;font-size:13.5px;min-height:32px;display:flex;align-items:center}
    details.pf-more[open] summary{margin-bottom:8px}
    .pf-how{display:grid;gap:14px;grid-template-columns:1fr}
    @media(min-width:900px){.pf-how{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .pf-how > div{display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 84%,transparent)}
    .pf-how h3{font:600 12px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
    .pf-busy{display:inline-flex;align-items:center;gap:8px;font:500 12.5px var(--mono);color:var(--muted)}
    .pf-busy::before{content:"";width:12px;height:12px;border-radius:50%;border:2px solid var(--line);border-top-color:var(--accent);animation:pfSpin .8s linear infinite}
    @keyframes pfSpin{to{transform:rotate(360deg)}}
    @media (prefers-reduced-motion:reduce){.pf-busy::before{animation:none}}
    @media(max-width:520px){.pf-opt dl{grid-template-columns:repeat(2,minmax(0,1fr))}.pf-t th,.pf-t td{padding:8px 9px}}
  `);

  /* ---------------- the page ---------------- */
  const M = { uid: null, data: null, at: null, prev: null, source: null, configured: null, connected: null, relink: false, err: null, busy: false, flash: null, confirm: null, connecting: false, autoAt: 0 };
  function resetFor(id) { if (M.uid === id) return; Object.assign(M, { uid: id, data: null, at: null, prev: null, source: null, configured: null, connected: null, relink: false, err: null, busy: false, flash: null, confirm: null, connecting: false, autoAt: 0 }); }

  // back from SnapTrade's Connection Portal: ?connect=done&status=SUCCESS|ERROR|ABANDONED
  function readReturn() {
    let q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
    if (q.get('connect') !== 'done') return;
    const st = (q.get('status') || '').toUpperCase();
    if (st === 'SUCCESS') M.flash = { kind: 'ok', text: '<b>Connected.</b> SnapTrade can take a few minutes to finish the first sync with your brokerage, so press Refresh if an account or position is missing.' };
    else if (st === 'ABANDONED') M.flash = { kind: 'warn', text: 'You closed the connection window, so nothing was connected.' };
    else M.flash = { kind: 'err', text: `The brokerage connection did not finish${q.get('error_code') ? ` (SnapTrade error ${esc(String(q.get('error_code')).slice(0, 12))})` : ''}. Nothing was connected. Try again, or pick another brokerage.` };
    try { history.replaceState(history.state, '', location.pathname + location.hash); } catch (e) {}
    M.autoAt = 0; // fetch straight away
  }

  async function load(force) {
    if (M.busy || !enabled() || !signedIn()) return;
    const id = uid(); resetFor(id);
    if (!force && M.source === 'live' && M.at && Date.now() - Date.parse(M.at) < 5 * 60 * 1000) return;
    M.busy = true; M.err = null; paintAll();
    try {
      const d = await call('portfolio', {}, 35000);
      if (uid() !== id) return;
      M.configured = d.configured !== false;
      if (!M.configured) { M.connected = false; }
      else if (!d.connected) { M.connected = false; M.relink = !!d.relink; M.data = null; M.at = null; M.source = null; dropCopy(); }
      else {
        M.connected = true; M.relink = false;
        // "since your last visit" compares with the copy from an earlier visit (at least 6 hours old), not a minute ago
        const old = readCopy();
        if (old && old.at && Date.now() - Date.parse(old.at) > 6 * 3600 * 1000) M.prev = { at: old.at, total: old.total };
        else if (old && old.prev) M.prev = old.prev;
        M.data = d; M.at = d.asOf || new Date().toISOString(); M.source = 'live';
        const A = analyze(d);
        writeCopy({ at: M.at, data: d, total: A.total, prev: M.prev });
      }
    } catch (e) {
      M.err = e;
      if (e.code === 'unauthorized') { M.connected = null; }
      if (e.code === 'not_configured') M.configured = false;
    } finally { M.busy = false; paintAll(); }
  }
  async function connect(opts) {
    if (M.connecting) return;
    M.connecting = true; M.err = null; paintAll();
    try {
      const d = await call('connect', opts || {}, 25000);
      if (!d.url) throw E('snaptrade_error', 'SnapTrade did not send a link. Try again later.');
      SML.track('portfolio_connect', { method: 'snaptrade', label: opts && opts.reconnect ? 'reconnect' : (opts && opts.broker) || 'any' });
      location.assign(d.url);
    } catch (e) { M.err = e; M.connecting = false; paintAll(); }
  }
  async function disconnect(target) {
    M.busy = true; M.err = null; paintAll();
    try {
      const r = await call('disconnect', target === 'all' ? { all: true } : { connectionId: target }, 25000);
      SML.track('portfolio_disconnect', { method: 'snaptrade' });
      M.confirm = null; M.data = null; M.at = null; M.source = null; dropCopy();
      M.flash = { kind: 'ok', text: '<b>Disconnected.</b> FiredBunny’s read-only access was removed at SnapTrade, and this device’s copy of your holdings was deleted.' };
      M.busy = false;
      if (r.removed === 'connection') await load(true); // other brokerages are still connected: show them
      else M.connected = false;
    } catch (e) { M.err = e; } finally { M.busy = false; paintAll(); }
  }

  let VIEW = null;
  function paintAll() {
    if (!VIEW || !VIEW.isConnected) return;
    const top = $('#pf-top', VIEW), main = $('#pf-main', VIEW);
    if (!top || !main) return;
    const y = window.scrollY;
    top.innerHTML = stateHTML();
    // live data when there is some; nothing while the first check runs; otherwise the sample, clearly labelled
    let show = null;
    if (!(enabled() && signedIn())) show = demo();
    else if (M.data) show = M.data;
    else if (M.configured === false || M.connected === false || (M.err && M.err.code !== 'unauthorized')) show = demo();
    main.innerHTML = show ? dashboardHTML(show) : '';
    if (show) mountCharts(main, show);
    if (SML.linkify) SML.linkify(VIEW);
    window.scrollTo(0, y);
  }

  function errorText(e) {
    const c = e && e.code;
    if (c === 'offline') return 'You’re offline.';
    if (c === 'network') return 'FiredBunny’s server could not be reached.';
    if (c === 'rate_limited') return `You’ve refreshed a lot in a short time. Try again in ${e.retryAfter && e.retryAfter < 120 ? e.retryAfter + ' seconds' : 'a minute or two'}.`;
    if (c === 'snaptrade_rate_limited') return 'SnapTrade asked us to slow down. Try again in a minute.';
    if (c === 'snaptrade_unreachable') return 'SnapTrade (the connection service) is not answering right now. Try again in a few minutes.';
    if (c === 'unauthorized') return 'Your sign-in has expired.';
    if (c === 'schema_missing') return 'Brokerage connections are not set up in the database yet.';
    return esc((e && e.message) || 'Something went wrong. Try again in a moment.');
  }
  function stateHTML() {
    const ro = `<p class="pf-ro">${I(ICON.lock, 15)}Read-only. FiredBunny can’t place trades. Education, not financial advice.</p>`;
    const signLink = SML.routes && SML.routes.mode === 'path' ? '/signin/' : '#signin';
    if (!web) return `<section class="dsh-card pf-state" aria-labelledby="pf-s-h"><p class="dsh-k">Sample portfolio</p><h2 id="pf-s-h">See what the Portfolio page shows</h2><p>On firedbunny.com, a signed-in visitor can connect a brokerage read-only and see their own accounts here. This copy always shows made-up sample data.</p></section>`;
    if (!accountsOn()) return `<section class="dsh-card pf-state" aria-labelledby="pf-s-h"><p class="dsh-k">Sample portfolio</p><h2 id="pf-s-h">A tour with made-up data</h2><p>Connecting a brokerage needs a FiredBunny account, which isn’t available here yet. Below is a sample portfolio.</p></section>`;
    if (!signedIn()) return `<section class="dsh-card pf-state" aria-labelledby="pf-s-h"><p class="dsh-k">Your own accounts</p><h2 id="pf-s-h">Sign in to see your own accounts</h2>
      <p>With a free FiredBunny account you can connect a brokerage, read-only, and see your holdings the way the lessons teach: allocation, concentration, gains and losses by tax term, open options and the income they bring. Below is a sample portfolio with made-up numbers.</p>
      <div class="pf-acts"><a class="btn btn-p" href="${signLink}">Sign in or create an account</a><a class="btn btn-g" href="#pf-how">How it works</a></div></section>`;
    if (!enabled()) return `<section class="dsh-card pf-state" aria-labelledby="pf-s-h"><p class="dsh-k">Coming soon</p><h2 id="pf-s-h">Connecting a brokerage is almost ready</h2><p>Soon you’ll be able to connect your brokerage, read-only, and see your own accounts here. Until then, explore the sample portfolio below: every number is made up.</p></section>`;
    const parts = [];
    if (M.flash) parts.push(banner(M.flash.kind, M.flash.text));
    const conns = (M.data && M.data.connections) || [];
    const off = conns.filter((c) => c.disabled);
    if (M.data && off.length) off.forEach((c) => parts.push(banner('warn', `<b>${esc(c.broker)} needs you to sign in again.</b> The connection stopped refreshing${c.disabledAt ? ' on ' + esc(mDY(c.disabledAt)) : ''}, so the numbers below are the last ones SnapTrade received.<div class="pf-acts"><button type="button" class="btn btn-p sm" data-pf="reconnect" data-id="${esc(c.id)}">Reconnect ${esc(c.broker)}</button></div>`)));
    if (M.err) {
      const e = M.err, copy = M.data && M.source === 'cache';
      const tail = M.data ? ` Showing the copy saved on this device from <b>${esc(when(M.at))}</b>.` : '';
      if (e.code === 'unauthorized') parts.push(banner('err', `<b>${errorText(e)}</b> <a href="${signLink}">Sign in again</a> to refresh your portfolio.${tail}`));
      else parts.push(banner(e.code === 'offline' || e.code === 'rate_limited' ? 'warn' : 'err', `<b>${errorText(e)}</b>${tail || (copy ? '' : '')}<div class="pf-acts"><button type="button" class="btn btn-g sm" data-pf="refresh">Try again</button></div>`));
    }
    if (M.configured === false) {
      parts.push(`<section class="dsh-card pf-state" aria-labelledby="pf-s-h"><p class="dsh-k">Sample data</p><h2 id="pf-s-h">Live connections aren’t switched on yet</h2><p>The server isn’t set up to connect brokerages yet, so this page shows the sample portfolio below. Nothing about you was sent anywhere.</p></section>`);
      return parts.join('');
    }
    if (M.data) {
      const live = M.source === 'live';
      const confirm = M.confirm ? `<div class="pf-confirm" role="group" aria-label="Confirm disconnect"><p>Disconnect ${M.confirm === 'all' ? 'all brokerages' : esc((conns.find((c) => c.id === M.confirm) || {}).broker || 'this brokerage')}? FiredBunny’s read-only access is removed at SnapTrade and this device’s copy is deleted. You can connect again any time.</p><button type="button" class="btn btn-dn sm" data-pf="disconnect-yes">Disconnect</button><button type="button" class="btn btn-g sm" data-pf="disconnect-no">Cancel</button></div>` : '';
      parts.push(`<div class="pf-bar"><div class="pf-conns">${conns.map((c) => `<span class="pf-conn${c.disabled ? ' pf-off' : ''}"><i class="dot" aria-hidden="true"></i>${esc(c.broker)}<small>${c.type === 'read' ? 'read-only' : esc(c.type || '')}${c.disabled ? ' · needs sign-in' : ''}</small></span>`).join('')}
        <span class="pf-when" aria-live="polite">${M.busy ? '<span class="pf-busy">Refreshing…</span>' : (live ? 'Updated ' : 'Saved on this device ') + esc(when(M.at))}</span></div>
        <div class="pf-acts"><button type="button" class="btn btn-g sm" data-pf="refresh"${M.busy ? ' disabled' : ''}>${I(ICON.refresh, 15)}Refresh</button><button type="button" class="btn btn-g sm" data-pf="connect-more"${M.connecting ? ' disabled' : ''}>${I(ICON.plug, 15)}Add a brokerage</button><button type="button" class="btn btn-g sm" data-pf="disconnect" data-id="${conns.length === 1 ? esc(conns[0].id) : 'all'}">Disconnect</button></div></div>${confirm}`);
      return parts.join('');
    }
    const checking = M.busy || (M.configured == null && M.connected == null && !M.err);
    if (checking && M.connected !== false) { parts.push(`<section class="dsh-card pf-state"><p class="pf-busy">Checking your brokerage connection…</p></section>`); return parts.join(''); }
    if (M.err && M.err.code === 'unauthorized') return parts.join('');
    if (M.err && M.connected == null) { return parts.join('') + connectCard(ro, false); }
    return parts.join('') + connectCard(ro, false);
  }
  function connectCard(ro, quiet) {
    return `<section class="dsh-card pf-state" aria-labelledby="pf-s-h"><p class="dsh-k">${SML.flame ? SML.flame(13) : ''}${M.relink ? 'Connect again' : 'Not connected yet'}</p><h2 id="pf-s-h">${M.relink ? 'Your brokerage connection needs to be set up again' : 'Connect your brokerage, read-only'}</h2>
      <p>See your own accounts here: what you own, how concentrated it is, gains and losses by tax term, open options and the income they bring, each tied to the lesson that explains it.</p>
      <ul class="pf-facts">
        <li>${I(ICON.lock)}<span><b>Read-only.</b> The connection can read balances, positions and transactions. It can’t place trades or move money, and FiredBunny has no trading features.</span></li>
        <li>${I(ICON.link)}<span><b>Through SnapTrade.</b> You sign in to your brokerage on SnapTrade’s connection page (for Robinhood, on Robinhood’s own sign-in). FiredBunny never sees your brokerage password.</span></li>
        <li>${I(ICON.eye)}<span><b>Fetched when you open this page.</b> Your holdings and activity pass through FiredBunny’s server to your browser and are kept on this device only, not in your account. Signing out deletes this device’s copy.</span></li>
        <li>${I(ICON.plug)}<span><b>Disconnect any time</b> here, which removes the access at SnapTrade (you can also revoke it in your brokerage’s settings). Deleting your FiredBunny account removes it too.</span></li>
      </ul>
      <div class="pf-acts"><button type="button" class="btn btn-p" data-pf="connect" data-broker="ROBINHOOD"${M.connecting ? ' disabled' : ''}>${M.connecting ? 'Opening SnapTrade…' : 'Connect Robinhood'}</button><button type="button" class="btn btn-g" data-pf="connect"${M.connecting ? ' disabled' : ''}>Another brokerage</button></div>
      <p class="pf-note">SnapTrade is the connection provider: <a href="https://snaptrade.com/privacy-policy" target="_blank" rel="noopener">SnapTrade privacy policy</a> · <a href="https://snaptrade.com/security" target="_blank" rel="noopener">SnapTrade security</a>. Brokerages don’t endorse FiredBunny; they let you share your own data.${quiet ? '' : ' Below is what the page shows, with a made-up sample portfolio.'}</p></section>`;
  }
  const banner = (kind, html) => `<div class="pf-banner ${kind}" role="${kind === 'err' ? 'alert' : 'status'}">${I(kind === 'ok' ? ICON.lock : ICON.warn)}<div><span>${html}</span></div></div>`;

  /* ---------------- the dashboard ---------------- */
  let LAST = null;
  function dashboardHTML(d) {
    const A = analyze(d); LAST = { d, A };
    const sample = !!d.demo;
    const tile = (l, v, sub, cls) => `<div class="dsh-kpi${cls ? ' ' + cls : ''}"><span class="dsh-kl">${l}</span>${v}${sub}</div>`;
    const dc = A.dayChange, prev = !sample && !dc && M.prev && M.prev.total ? { v: A.total - M.prev.total, since: M.prev.at } : null;
    const chg = dc ? `<b class="dsh-kv ${tone(dc.v)}">${susd(dc.v)}</b><span class="dsh-ks ${tone(dc.v)}">${spct(dc.base ? dc.v / dc.base : 0, 2)} since ${esc(mD(dc.since))} (estimated)</span>`
      : prev ? `<b class="dsh-kv ${tone(prev.v)}">${susd(prev.v)}</b><span class="dsh-ks">since your last visit, ${esc(when(prev.since))}</span>`
        : `<b class="dsh-kv">—</b><span class="dsh-ks">Daily history isn’t available for this connection</span>`;
    const opt = A.options;
    const kpis = `<section class="dsh-kpis" aria-label="Key numbers">
      ${tile('Total value', `<b class="dsh-kv">${kfmt(A.total)}</b>`, `<span class="dsh-ks">${A.accounts.length} account${A.accounts.length === 1 ? '' : 's'}</span>`, 'fl')}
      ${tile('Cash', `<b class="dsh-kv">${kfmt(A.cash)}</b>`, `<span class="dsh-ks">${A.total ? pct(A.cash / A.total, 0) + ' of the total' : '—'}</span>`)}
      ${tile('Day change', chg, '')}
      ${tile('Unrealized gain', `<b class="dsh-kv ${tone(A.unreal)}">${A.unrealCost ? (A.unreal < 0 ? MINUS : '+') + kfmt(Math.abs(A.unreal)) : '—'}</b>`, `<span class="dsh-ks">${A.unrealCost ? spct(A.unreal / A.unrealCost, 1) + ' on what you paid' : 'Cost basis not reported'}</span>`)}
      ${tile('Open options', `<b class="dsh-kv">${opt.length}</b>`, `<span class="dsh-ks">${opt.length ? (opt[0].dte != null ? `next expiry in ${opt[0].dte} day${opt[0].dte === 1 ? '' : 's'}` : 'expiry not reported') : 'none open'}</span>`)}
      ${tile('Income, 12 months', `<b class="dsh-kv">${A.income.any ? kfmt(A.income.total) : '—'}</b>`, `<span class="dsh-ks">${A.income.any ? 'Dividends, interest, option premium' : 'No activity reported'}</span>`)}
    </section>`;
    const ins = insights(A);
    const sec = (id, k, title, sub, body, side) => `<section class="dsh-card" aria-labelledby="${id}"><div class="dsh-h"><div><p class="dsh-k">${k}</p><h2 id="${id}">${title}</h2>${sub ? `<p class="dsh-sub">${sub}</p>` : ''}</div>${side || ''}</div>${body}</section>`;
    const out = [];
    if (sample) out.push(`<div class="pf-sample" role="note"><b>Sample data</b><span>A made-up portfolio (two accounts at a pretend broker) to show what this page does. None of it is real or anyone’s.</span></div>`);
    out.push(kpis);
    // observations
    out.push(sec('pf-ins-h', 'Worth a look', 'Observations and questions', 'Things the numbers suggest asking yourself, each with the lesson behind it. They describe; they don’t tell you to buy or sell anything.',
      ins.length ? `<ul class="pf-ins">${ins.map((x) => `<li class="${x.level}">${I(ICON.bulb)}<div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p><div class="pf-lks">${x.links.map(([t, l]) => link(t, l)).join('')}</div></div></li>`).join('')}</ul>` : '<p class="dsh-note">Nothing stands out right now: no single position dominates, no options are close to expiry and nothing is below cost in a taxable account.</p>'));
    // value over time + allocation
    const allocItems = Object.keys(CLS).filter((k) => A.alloc[k] > 0.5).map((k) => ({ k, label: CLS[k].label, v: A.alloc[k], col: CLS[k].col })).sort((a, b) => b.v - a.v);
    const histBody = A.history ? `<div class="pf-fig" id="pf-hist"></div><p class="pf-note">${A.yearChange ? `${susd(A.yearChange.v)} (${spct(A.yearChange.base ? A.yearChange.v / A.yearChange.base : 0, 1)}) since ${esc(mDY(A.yearChange.since))}, deposits and withdrawals included. ` : ''}SnapTrade estimates this history from your holdings; it can have gaps and is for the trend, not a record.</p>
      <details class="pf-more"><summary>Show the numbers</summary>${monthEnds(A.history)}</details>` : `<p class="dsh-note">Value history isn’t available for this connection yet.${sample ? '' : ' (SnapTrade provides it as an optional add-on; it may appear after a day.)'}</p>`;
    out.push(`<div class="pf-grid2">${sec('pf-hist-h', 'Value over time', 'The last year', '', histBody)}${sec('pf-al-h', 'Allocation', 'What it’s made of', '', allocItems.length ? `<div class="pf-alloc"><div>${donut(allocItems, A.allocTotal, 168, kfmt(A.allocTotal), 'invested + cash', 'Allocation: ' + allocItems.map((i) => `${i.label} ${pct(i.v / A.allocTotal, 0)}`).join(', '))}</div><ul class="pf-leg">${allocItems.map((i) => `<li><span class="pf-sw" style="--c:${i.col}"></span><span>${esc(i.label)}</span><b>${usd(i.v)}</b><small>${pct(i.v / A.allocTotal, 0)}</small></li>`).join('')}</ul></div>
        <p class="pf-note">${A.invested ? `Funds and bond funds are ${pct(A.fundShare, 0)} of the invested money, single stocks ${pct(A.stockShare, 0)}. ` : ''}${A.shortOpt < 0 ? `Not counted above: ${usd(-A.shortOpt)} to buy back the options you sold. ` : ''}${link('l-allocation', 'Stocks, bonds and your age')} · ${link('l-etfs', 'Index funds and ETFs')}</p>` : '<p class="dsh-note">No positions reported.</p>')}</div>`);
    // concentration + accounts
    const topRows = A.ranked.slice(0, 8);
    const taxRows = Object.keys(TAX).filter((k) => A.taxSplit[k] > 0.5);
    out.push(`<div class="pf-grid2">${sec('pf-con-h', 'Concentration', 'Largest holdings', `Largest: ${A.top ? `<b>${esc(A.top.symbol)}</b>, ${pct(A.top.share, 1)} of the total` : '—'}. Top five: ${pct(A.top5, 0)}. The dashed line marks 10%.`,
      topRows.length ? `<div class="pf-fig" id="pf-bars"></div><p class="pf-note">${link('l-position-size', 'Position sizing')} · ${link('l-one-percent', 'The 1% rule')} · ${link('l-drawdowns', 'Losses are lopsided')}</p>` : '<p class="dsh-note">No positions reported.</p>')}
      ${sec('pf-acc-h', 'Accounts', 'Where it’s held', 'Grouped by how each account is taxed, judged from the account type your broker reports.',
        `<div class="pf-split" role="img" aria-label="${esc(taxRows.map((k) => `${TAX[k].label} ${pct(A.taxSplit[k] / (A.total || 1), 0)}`).join(', '))}">${taxRows.map((k) => `<i style="--c:${TAX[k].col};width:${(A.taxSplit[k] / (A.total || 1)) * 100}%"></i>`).join('')}</div>
        <div class="pf-tw"><table class="pf-t"><thead><tr><th>Account</th><th class="l">Tax treatment</th><th>Value</th><th>Cash</th></tr></thead><tbody>${A.accounts.map((a) => `<tr><td><b>${esc(a.name)}</b><small>${esc([a.number, a.rawType].filter(Boolean).join(' · '))}</small></td><td class="l"><span class="pf-sw" style="--c:${TAX[a.tax].col};display:inline-block;margin-right:6px"></span>${esc(TAX[a.tax].long)}</td><td>${usd(a.value)}</td><td>${usd(a.cash)}</td></tr>`).join('')}</tbody></table></div>
        <p class="pf-note">Which account holds what changes the tax you pay along the way: ${link('l-asset-location', 'Asset location')} · ${link('l-trad-vs-roth', 'Traditional or Roth?')}</p>`)}</div>`);
    // holdings
    const H = A.holdings.slice().sort((x, y) => y.mv - x.mv);
    out.push(sec('pf-hold-h', 'Holdings', 'Gains and losses', A.lotsKnown ? 'Short-term means held one year or less (taxed like income); long-term means more than a year. Split by tax lot where your broker reports lots.' : 'Your broker didn’t report purchase dates (tax lots), so gains can’t be split into short- and long-term.',
      H.length ? `<div class="pf-tw"><table class="pf-t"><thead><tr><th>Holding</th><th>Value</th><th>Share</th><th>Cost</th><th>Unrealized</th>${A.lotsKnown ? '<th>Short-term</th><th>Long-term</th>' : ''}<th class="l">Account</th></tr></thead><tbody>
        ${H.map((p) => `<tr><td><b>${esc(p.symbol)}</b><small>${esc(p.desc)}</small></td><td>${usd(p.mv)}</td><td>${A.total ? pct(p.mv / A.total, 1) : '—'}</td><td>${p.cost != null ? usd(p.cost) : '—'}</td><td class="${p.pl != null ? tone(p.pl) : ''}">${p.pl != null ? susd(p.pl) + `<small>${spct(p.plPct, 1)}</small>` : '—'}</td>${A.lotsKnown ? `<td class="${tone(n0(p.st))}">${p.lots ? susd(p.st) : '—'}</td><td class="${tone(n0(p.lt))}">${p.lots ? susd(p.lt) : '—'}</td>` : ''}<td class="l">${esc(p.acct.name)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td>Total</td><td>${usd(sum(H, (p) => p.mv))}</td><td></td><td></td><td class="${tone(sum(H, (p) => p.pl))}">${susd(sum(H, (p) => p.pl))}</td>${A.lotsKnown ? `<td>${susd(A.stTot)}</td><td>${susd(A.ltTot)}</td>` : ''}<td></td></tr></tfoot></table></div>
        <p class="pf-note">${link('l-cap-gains', 'Short vs long-term gains')} · ${link('l-zero-bracket', 'The 0% capital gains bracket')}</p>` : '<p class="dsh-note">No holdings reported.</p>'));
    // tax-loss harvest candidates
    if (A.tlh.length) out.push(sec('pf-tlh-h', 'Taxes', 'Below cost in a taxable account', 'Positions you could review for tax-loss harvesting. Losses in IRAs and Roth accounts don’t count for taxes, so they aren’t listed.',
      `<div class="pf-tw"><table class="pf-t"><thead><tr><th>Holding</th><th>Unrealized loss</th><th>Short-term</th><th>Long-term</th><th class="l">Wash-sale check</th></tr></thead><tbody>${A.tlh.map((t) => `<tr><td><b>${esc(t.p.symbol)}</b><small>${esc(t.p.acct.name)}</small></td><td class="dn">${susd(t.p.pl)}</td><td>${t.stLoss != null ? susd(t.stLoss) : '—'}</td><td>${t.ltLoss != null ? susd(t.ltLoss) : '—'}</td><td class="l">${t.recentBuy ? `<span class="pf-tag dn">Bought ${esc(mD(iso(t.recentBuy)))}</span><small>Within 30 days: a sale at a loss now could be a wash sale.</small>` : '<span class="pf-tag">No buys in 30 days</span>'}${t.inIra ? '<small>Also held in an IRA or Roth: a purchase there within 30 days counts too, and that loss is lost for good.</small>' : ''}</td></tr>`).join('')}</tbody></table></div>
      <p class="pf-note">The wash sale rule looks 30 days before and after a sale, across all your accounts (and your spouse’s). Activity older than SnapTrade’s history, or at other brokerages, isn’t checked here. ${link('l-tax-loss', 'Tax-loss harvesting')} · ${link('l-wash-sale', 'The wash sale rule')} · ${link('l-tlh-pairs', 'Harvesting with fund pairs')} · ${link('tool-tlh', 'Tax-loss harvest tool')}</p>`));
    // options
    if (opt.length) out.push(sec('pf-opt-h', 'Options', 'Open contracts', 'Strike, days to expiry, how far the stock is from the strike, and what assignment would mean.',
      `<div class="pf-opts">${opt.map(optCard).join('')}</div><p class="pf-note">Stock prices for distance to the strike come from your positions, or the last close when you don’t hold the stock. ${link('l-contracts', 'Contracts and moneyness')} · ${link('l-delta-gamma', 'Delta and gamma')} · ${link('l-theta', 'Theta')} · ${link('l-wheel', 'The wheel strategy')}</p>`));
    if (A.wheels.length) out.push(sec('pf-wh-h', 'The wheel', 'Wheel progress, last 12 months', 'Premium collected per stock from selling puts and calls, assignments, and where each cycle stands. Adjusted cost spreads the premium over the shares you hold.',
      `<div class="pf-tw"><table class="pf-t"><thead><tr><th>Stock</th><th class="l">Stage</th><th>Premium (net)</th><th>Puts sold</th><th>Calls sold</th><th>Assigned</th><th>Called away</th><th>Cost / share</th><th>Adjusted</th></tr></thead><tbody>${A.wheels.map((w) => `<tr><td><b>${esc(w.u)}</b></td><td class="l"><span class="pf-tag acc">${esc(w.stage)}</span></td><td class="${tone(w.prem)}">${susd(w.prem)}</td><td>${w.puts}</td><td>${w.calls}</td><td>${w.assigned}</td><td>${w.calledAway}</td><td>${w.basis != null ? F.usd(w.basis, 2) : '—'}</td><td>${w.adjBasis != null ? F.usd(w.adjBasis, 2) : '—'}</td></tr>`).join('')}</tbody></table></div>
      <p class="pf-note">${link('tool-wheel', 'Wheel income tool')} · ${link('wheel', 'Wheel simulator')} · ${link('l-wheel-tax', 'How the wheel is taxed')}</p>`));
    // income
    if (A.income.any) out.push(sec('pf-inc-h', 'Income', 'Dividends, interest and premium', `${usd(A.income.div)} in dividends, ${usd(A.income.int)} in interest and ${susd(A.income.prem)} in net option premium over the last 12 months.${A.income.fees >= 1 ? ` Fees: ${F.usd(A.income.fees, 2)}.` : ''}`,
      `<div class="pf-fig" id="pf-inc"></div><div class="pf-legend"><span><i class="pf-sw" style="--c:var(--up)"></i>Dividends</span><span><i class="pf-sw" style="--c:var(--info)"></i>Interest</span><span><i class="pf-sw" style="--c:var(--accent)"></i>Option premium</span><span><i class="pf-sw" style="--c:var(--down)"></i>Net premium paid back</span></div>
      <details class="pf-more"><summary>Show the numbers</summary><div class="pf-tw"><table class="pf-t"><thead><tr><th>Month</th><th>Dividends</th><th>Interest</th><th>Premium (net)</th><th>Fees</th></tr></thead><tbody>${A.income.months.map((m) => `<tr><td>${esc(m.label + ' ' + m.year)}</td><td>${usd(m.div)}</td><td>${usd(m.int)}</td><td class="${tone(m.prem)}">${susd(m.prem)}</td><td>${m.fees ? F.usd(m.fees, 2) : '—'}</td></tr>`).join('')}</tbody></table></div></details>
      <p class="pf-note">Activity arrives a day late from most brokerages. Premium is what you received for options sold, minus what you paid to buy them back. ${link('l-retire-income', 'Turn savings into a paycheck')} · ${link('tool-wheel', 'Wheel income tool')}</p>`));
    // on track
    out.push(trackSec(A, sample));
    // recent activity
    const acts = (d.activities || []).slice(0, 14);
    if (acts.length) out.push(sec('pf-act-h', 'Activity', 'Recent transactions', 'The latest entries your brokerage reported.',
      `<div class="pf-tw"><table class="pf-t"><thead><tr><th>Date</th><th class="l">What</th><th class="l">Detail</th><th>Amount</th></tr></thead><tbody>${acts.map((x) => `<tr><td>${esc(mD(x.date))}</td><td class="l">${esc((x.optionType && OPT_ACT[x.optionType]) || ACT[x.type] || x.type || '—')}</td><td class="l">${esc(x.option ? `${x.option.underlying || ''} ${x.option.strike != null ? x.option.strike : ''} ${x.option.type === 'PUT' ? 'put' : x.option.type === 'CALL' ? 'call' : ''} ${x.option.expiry ? mD(x.option.expiry) : ''}`.replace(/\s+/g, ' ').trim() : x.symbol ? `${x.symbol}${x.units ? ' × ' + Math.abs(x.units) : ''}` : (x.description || ''))}<small>${esc(((A.byId[x.accountId] || {}).name) || '')}</small></td><td class="${tone(n0(x.amount))}">${x.amount ? susd(x.amount) : '—'}</td></tr>`).join('')}</tbody></table></div>`));
    return out.join('');
  }
  function monthEnds(hist) {
    const byM = {}; hist.forEach((h) => { byM[h[0].slice(0, 7)] = h; });
    const rows = Object.values(byM).slice(-13);
    return `<div class="pf-tw"><table class="pf-t"><thead><tr><th>Month end</th><th>Estimated value</th></tr></thead><tbody>${rows.map((h) => `<tr><td>${esc(mDY(h[0]))}</td><td>${usd(h[1])}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function optCard(x) {
    const o = x.o, exp = o.expiry ? mDY(o.expiry) : '—';
    const money = x.itm == null ? '<span class="pf-tag">Stock price unknown</span>' : x.itm ? '<span class="pf-tag dn">In the money</span>' : Math.abs(x.dist) <= 0.03 ? '<span class="pf-tag acc">Near the strike</span>' : '<span class="pf-tag up">Out of the money</span>';
    const gx = x.dist == null ? null : Math.max(2, Math.min(98, 50 + (x.dist * 100) * 5)); // ±10% fills the gauge
    let what = '';
    if (x.short && o.type === 'PUT') what = `If assigned: buy ${x.ifAssigned.shares} shares of ${esc(o.underlying)} for ${usd(x.ifAssigned.buy)}${x.ifAssigned.share != null ? `, about ${pct(x.ifAssigned.share, 0)} of the portfolio` : ''}.${x.secured === false ? ' Your cash in this account doesn’t cover all the put collateral.' : ''}`;
    else if (x.short && o.type === 'CALL') what = x.covered ? `If assigned: your ${x.ifAssigned.shares} shares are sold at ${F.usd(x.K, 2)}${x.ifAssigned.gain != null ? ` (${susd(x.ifAssigned.gain)} versus your cost)` : ''}.` : 'This account doesn’t hold enough shares to cover this call: if assigned, the shares would have to be bought at the market price.';
    else what = `You paid ${x.premium != null ? usd(x.premium) : 'a premium'} for the right to ${o.type === 'CALL' ? 'buy' : 'sell'} ${x.mult * x.contracts} shares at ${F.usd(x.K, 2)}.`;
    if (x.itm && x.short) what += o.type === 'CALL' ? ' Calls can be assigned early, most often just before an ex-dividend date.' : ' In the money near expiry, assignment is likely.';
    return `<article class="pf-opt"><div class="pf-opt-h"><b>${esc(o.underlying || x.p.symbol)} ${F.usd(x.K, x.K % 1 ? 2 : 0)} ${o.type === 'PUT' ? 'put' : 'call'}</b><span class="pf-tag acc">${esc(x.role)}${x.contracts > 1 ? ' × ' + x.contracts : ''}</span></div>
      <dl><div><dt>Expires</dt><dd>${esc(exp)}</dd></div><div><dt>Days left</dt><dd>${x.dte != null ? Math.max(0, x.dte) : '—'}</dd></div><div><dt>Stock</dt><dd>${x.S0 != null ? F.usd(x.S0, 2) : '—'}</dd></div>
        <div><dt>${x.short ? 'Premium in' : 'Premium paid'}</dt><dd>${x.premium != null ? usd(x.premium) : '—'}</dd></div><div><dt>Now worth</dt><dd>${usd(Math.abs(x.value))}</dd></div><div><dt>${x.short && o.type === 'PUT' ? 'Collateral' : 'P/L so far'}</dt><dd class="${x.short && o.type === 'PUT' ? '' : tone(n0(x.pl))}">${x.short && o.type === 'PUT' ? usd(x.collateral) : x.pl != null ? susd(x.pl) : '—'}</dd></div></dl>
      <div>${money}${x.dist != null ? ` <span class="pf-note">stock ${spct(x.dist, 1)} from the strike</span>` : ''}${x.yieldAnn != null && isFinite(x.yieldAnn) ? ` <span class="pf-note">· premium ≈ ${pct(x.yieldAnn, 0)} a year on ${x.collateral ? 'collateral' : 'the shares'}</span>` : ''}</div>
      ${gx != null ? `<div class="pf-gauge" role="img" aria-label="Stock price ${spct(x.dist, 1)} from the strike (orange mark: strike, white mark: stock)"><s></s><i style="--x:${gx}%"></i></div>` : ''}
      <p>${what}</p></article>`;
  }
  function trackSec(A, sample) {
    const acc = SML.account; const p = !sample && acc ? acc.get() : null;
    const goal = p && Array.isArray(p.goals) ? p.goals.find((g) => g && g.type === 'fire' && Number(g.target) > 0) : null;
    const target = sample ? 1200000 : goal ? Number(goal.target) : 0;
    const nw = p && acc ? acc.netWorth(p) : null;
    let plan = null; try { plan = sample ? null : SML.store.get('fire-plan', null); } catch (e) { plan = null; }
    const rows = [];
    let body = '';
    if (target > 0) {
      const share = A.total / target;
      body += `<p class="dsh-note">${sample ? 'With a sample FIRE number of <b>$1.2M</b>' : `Your FIRE number goal on the dashboard is <b>${usd(target)}</b>`}: these accounts are <b>${pct(share, 0)}</b> of it${share < 1 ? `, ${usd(target - A.total)} to go` : ''}.</p>
        <div class="dsh-bar" role="progressbar" aria-label="${pct(share, 0)} of the FIRE number" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.min(1, share) * 100)}" style="margin:10px 0 4px"><i style="--w:${Math.min(100, share * 100)}%;--c:var(--flame)"></i></div>`;
    }
    if (nw && nw.investable > 0) rows.push(['Your dashboard counts as investable', usd(nw.investable)]);
    if (plan && typeof plan === 'object' && plan.age) {
      const planTot = n0(Number(plan.tax)) + n0(Number(plan.pre)) + n0(Number(plan.roth)) + n0(Number(plan.hsa));
      if (planTot > 0) rows.push(['Your FIRE plan assumes (taxable, pre-tax, Roth, HSA)', usd(planTot)]);
      [['Taxable', 'tax', ['taxable']], ['Pre-tax 401(k)/IRA', 'pre', ['deferred']], ['Roth', 'roth', ['roth']], ['HSA', 'hsa', ['hsa']]].forEach(([l, k, ts]) => { const conn = sum(ts, (t) => A.taxSplit[t]); if (n0(Number(plan[k])) > 0 || conn > 0) rows.push([`${l}: plan ${usd(n0(Number(plan[k])))}`, `connected ${usd(conn)}`]); });
    }
    if (rows.length) body += `<div class="pf-tw" style="margin-top:10px"><table class="pf-t"><tbody><tr><td><b>These connected accounts</b></td><td><b>${usd(A.total)}</b></td></tr>${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table></div><p class="pf-note">FiredBunny doesn’t change your dashboard or plan on its own; update them yourself if they’ve drifted.</p>`;
    if (!body) body = `<p class="dsh-note">Set a FIRE number goal on your <a class="pf-ln" href="#dashboard">dashboard</a> or build a <a class="pf-ln" href="#tool-fireplan">full FIRE plan</a> to see how these accounts compare.</p>`;
    return `<section class="dsh-card" aria-labelledby="pf-trk-h"><div class="dsh-h"><div><p class="dsh-k">On track?</p><h2 id="pf-trk-h">Compared with your own plan</h2><p class="dsh-sub">Only accounts connected here count; anything held elsewhere isn’t included.</p></div></div>${body}
      <p class="pf-note">${link('l-fire-number', 'Your FIRE number')} · ${link('tool-fire', 'FIRE number calculator')} · ${link('tool-fireplan', 'Full FIRE plan')}</p></section>`;
  }
  function mountCharts(main, d) {
    const A = LAST && LAST.d === d ? LAST.A : analyze(d);
    const h = $('#pf-hist', main); if (h && A.history) SML.ui.responsive(h, (W) => drawHistory(h, A.history, W));
    const b = $('#pf-bars', main); if (b) SML.ui.responsive(b, (W) => drawBars(b, A.ranked.slice(0, 8), W, A.total));
    const inc = $('#pf-inc', main); if (inc) SML.ui.responsive(inc, (W) => drawIncome(inc, A.income.months, W));
    // the last close for stocks behind options you don't hold (the site's own price relay), once per symbol
    if (web && !d.demo && SML.routes && SML.routes.mode === 'path') {
      const need = A.options.filter((x) => x.S0 == null && x.o.underlying && !(x.o.underlying in quotes)).map((x) => x.o.underlying);
      Array.from(new Set(need)).slice(0, 6).forEach((sym) => {
        quotes[sym] = null;
        fetch('/api/price/' + encodeURIComponent(sym)).then((r) => (r.ok ? r.json() : null)).then((j) => {
          const pts = j && Array.isArray(j.points) ? j.points : []; const last = pts[pts.length - 1];
          if (last && isFinite(last[1])) { quotes[sym] = last[1]; paintAll(); }
        }).catch(() => {});
      });
    }
  }
  const quotes = {};

  function aboutHTML() {
    return `<section class="dsh-card" id="pf-how" aria-labelledby="pf-how-h"><div class="dsh-h"><div><p class="dsh-k">How it works</p><h2 id="pf-how-h">Your data, read-only</h2></div></div>
      <div class="pf-how">
        <div><h3>The connection</h3><p>SnapTrade, a brokerage-connection service, links your brokerage with read-only access after you sign in on their page. FiredBunny’s server asks SnapTrade for your balances, positions and transactions when you open this page. It never sees your brokerage password and has no way to place trades.</p><p class="pf-note"><a href="https://snaptrade.com/privacy-policy" target="_blank" rel="noopener">SnapTrade privacy policy</a> · <a href="https://snaptrade.com/security" target="_blank" rel="noopener">SnapTrade security</a></p></div>
        <div><h3>What is kept, where</h3><p>Your holdings and activity are shown in your browser and kept on this device only, so the page opens fast and works offline; signing out deletes that copy. Your FiredBunny account stores only an encrypted key that lets the server ask SnapTrade for your data, and nothing else about your brokerage. The person who runs FiredBunny can see that the key exists, not your holdings.</p></div>
        <div><h3>Stopping</h3><p>Disconnect on this page removes the access at SnapTrade. Deleting your FiredBunny account in <a class="pf-ln" href="#settings">Settings</a> removes it too. You can also revoke it from your brokerage’s own settings. Analysis appears only here, when you open the page: no emails or alerts.</p></div>
      </div>
      <p class="pf-note" style="margin-top:12px">Education, not financial advice. Numbers come from your brokerage through SnapTrade and can be delayed or incomplete; your brokerage’s statements are the record. Brokerages don’t endorse FiredBunny.</p></section>`;
  }

  SML.pages.portfolio = function (view) {
    VIEW = view;
    if (signedIn()) resetFor(uid());
    if (enabled() && signedIn() && !M.data) { const c = readCopy(); if (c) { M.data = c.data; M.at = c.at; M.prev = c.prev || null; M.source = 'cache'; } }
    readReturn();
    view.innerHTML = SML.pageHeader('', 'Portfolio', 'Your portfolio, <em>explained</em>.', `<p>Your brokerage accounts seen the way the lessons teach them: what you own, how concentrated it is, taxes, options and income, each with the lesson behind it.</p><p class="pf-ro">${I(ICON.lock, 15)}Read-only. FiredBunny can’t place trades. Education, not financial advice.</p>`) +
      `<div class="wrap pf" id="pf"><div id="pf-top" class="pf-state"></div><div id="pf-main" class="pf"></div>${aboutHTML()}</div>`;
    view.addEventListener('click', onClick);
    SML.onCleanup(() => { view.removeEventListener('click', onClick); if (VIEW === view) VIEW = null; });
    paintAll();
    if (enabled() && signedIn()) {
      const stale = !(M.source === 'live' && M.at && Date.now() - Date.parse(M.at) < 5 * 60 * 1000);
      if (stale && !M.busy) setTimeout(() => load(false), 0);
    }
    return 'Portfolio';
  };
  function onClick(e) {
    const b = e.target.closest && e.target.closest('[data-pf]'); if (!b) return;
    const a = b.dataset.pf;
    if (a === 'refresh') { M.flash = null; load(true); }
    else if (a === 'connect') { M.flash = null; connect(b.dataset.broker ? { broker: b.dataset.broker } : {}); }
    else if (a === 'connect-more') { M.flash = null; connect({}); }
    else if (a === 'reconnect') { M.flash = null; connect({ reconnect: b.dataset.id }); }
    else if (a === 'disconnect') { M.confirm = b.dataset.id || 'all'; paintAll(); const y = $('[data-pf="disconnect-no"]', VIEW); if (y) y.focus(); }
    else if (a === 'disconnect-no') { M.confirm = null; paintAll(); }
    else if (a === 'disconnect-yes') { const t = M.confirm; disconnect(t); }
  }
  window.addEventListener('online', () => { if (VIEW && VIEW.isConnected && M.err && M.err.code === 'offline') load(true); });

  /* Settings > "Delete my account too" asks this first. Resolves { ok } or { ok: false, unreachable: true }; never throws. */
  async function forget() {
    if (!signedIn()) return { ok: true };
    dropCopy();
    try { const r = await call('forget', {}, 20000); return { ok: true, snaptrade: r.snaptrade || (r.configured === false ? 'not_configured' : 'none') }; }
    catch (e) { return { ok: false, unreachable: true, code: e.code }; }
  }

  SML.portfolio = { analyze, demo, insights, enabled, forget, dropCopy: () => { ls.keys().forEach((k) => { if (k.indexOf(CK) === 0) ls.del(k); }); }, _quotes: quotes, _state: M };
})();
