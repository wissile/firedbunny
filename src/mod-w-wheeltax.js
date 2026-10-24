/* Smart Taxes, part 2: tax-loss harvesting with fund pairs, how the wheel is taxed, the wheel in an IRA. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const clamp = SML.clamp, esc = SML.esc;
  const $id = (x) => document.getElementById(x);
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const msgTo = (x, html) => { const e = $id(x); if (e) e.innerHTML = html; };
  const BR = [10, 12, 22, 24, 32, 35, 37];
  const select = (id, label, opts, val) => `<label class="fld" for="${id}"><span>${label}</span><select id="${id}">${opts.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(val) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>`;
  const brSelect = (id, val, label) => select(id, label || 'Federal income tax bracket', BR.map((b) => ({ v: b, label: b + '%' })), val);
  /* usual long-term rate for an ordinary bracket (the real line is set by taxable income) */
  const ltFor = (br) => (br <= 12 ? 0 : br >= 37 ? 20 : 15);
  const k$ = (v) => { const a = Math.abs(v); const s = a >= 1000 ? F.num(a / 1000, a >= 10000 ? 0 : 1) + 'k' : F.num(a, 0); return (v < 0 ? F.minus : v > 0 ? '+' : '') + s; };
  const pm$ = (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + '$' + F.num(Math.abs(v), 0);
  /* dates */
  const D = (y, m, d) => Date.UTC(y, m - 1, d);
  const DAY = 86400000;
  const diff = (a, b) => Math.round((b - a) / DAY);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dShort = (t) => { const d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
  const dLong = (t) => { const d = new Date(t); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
  const yearOf = (t) => new Date(t).getUTCFullYear();

  SML.css(`
    .wwt-read{display:flex;flex-wrap:wrap}
    .wwt-read > .stat{flex:1 1 130px}
    .wwt-swap{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:stretch;padding:16px;background:var(--surface)}
    .wwt-fund{border:1px solid var(--line);border-radius:var(--r);padding:12px 14px;display:flex;flex-direction:column;gap:5px;min-width:0;background:var(--bg)}
    .wwt-fund .k{font:600 10.5px/1.2 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
    .wwt-fund b{font-family:var(--display);font-weight:400;font-size:32px;line-height:.95;color:var(--ink);letter-spacing:.01em}
    .wwt-fund .nm{font-size:13px;color:var(--text);line-height:1.35}
    .wwt-fund .ix{font:500 12px/1.35 var(--mono);color:var(--info)}
    .wwt-fund.sell{box-shadow:inset 3px 0 0 var(--down)} .wwt-fund.buy{box-shadow:inset 3px 0 0 var(--up)}
    .wwt-arrow{display:flex;align-items:center;justify-content:center;color:var(--muted);font:600 20px var(--mono)}
    .wwt-risk{align-self:flex-start;margin-top:3px}
    @media(max-width:520px){.wwt-swap{grid-template-columns:1fr}.wwt-arrow{transform:rotate(90deg);height:18px}}
    .wwt-pbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:10px 16px}
    .wwt-card{padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:var(--surface)}
    .wwt-card .hd{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;font:600 11px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
    .wwt-card .hd b{color:var(--accent);font-weight:600}
    .wwt-card h4{font-size:17px;line-height:1.35;color:var(--ink);font-weight:600;text-wrap:pretty}
    .wwt-card p{font-size:14.5px;line-height:1.55;color:var(--text);max-width:70ch;text-wrap:pretty}
    .wwt-tags{display:flex;flex-wrap:wrap;gap:6px}
    .wwt-tags .pill{text-transform:none;letter-spacing:.02em;font-size:11.5px;min-height:24px}
    .wwt-led{width:100%;border-collapse:collapse;font-size:13.5px}
    .wwt-led th,.wwt-led td{padding:8px 12px;border-bottom:1px solid var(--line);text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}
    .wwt-led th:first-child,.wwt-led td:first-child{text-align:left}
    .wwt-led thead th{font:500 10.5px/1.2 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);background:var(--shade)}
    .wwt-led tfoot td{color:var(--accent);font-weight:600;border-bottom:0}
    .wwt-led td.z{color:var(--muted)}
    .wwt-ledw{background:var(--surface);overflow-x:auto}
    .wwt-br .fld{flex-direction:row;align-items:center;gap:10px}
    .wwt-br select{min-height:34px;padding-block:4px}
    @media(max-width:520px){.wwt-led th,.wwt-led td{padding:7px 8px;font-size:12.5px}.wwt-sm{display:none}}
  `);

  /* =====================================================================
     1. tlhPairs: swap a losing fund for a partner, watch the 61-day window
     ===================================================================== */
  const RISK = {
    hi: { cls: 'dn', label: 'Same index: risky' },
    mid: { cls: 'acc', label: 'Close cousin: gray area' },
    lo: { cls: 'up', label: 'Different index: common' },
    mix: { cls: 'info', label: 'Different mix: safe, changes exposure' },
  };
  const FUNDS = [
    { t: 'VOO', name: 'Vanguard S&P 500 ETF', idx: 'S&P 500', what: 'US large companies', partners: [
      { t: 'VTI', name: 'Vanguard Total Stock Market ETF', idx: 'CRSP US Total Market', risk: 'lo', note: 'Adds mid and small companies; moves almost in step with the S&P 500.' },
      { t: 'SCHX', name: 'Schwab U.S. Large-Cap ETF', idx: 'Dow Jones U.S. Large-Cap Total Stock Market', risk: 'lo', note: 'Large US companies on a different index provider.' },
      { t: 'IVV', name: 'iShares Core S&P 500 ETF', idx: 'S&P 500', risk: 'hi', note: 'Same index as VOO. Many advisers avoid this swap because it could be called substantially identical.' },
      { t: 'SPYM', name: 'SPDR Portfolio S&P 500 ETF (ticker was SPLG until Oct 2025)', idx: 'S&P 500', risk: 'hi', note: 'Same index as VOO, so the same gray-zone risk as IVV.' },
    ] },
    { t: 'VTI', name: 'Vanguard Total Stock Market ETF', idx: 'CRSP US Total Market', what: 'the whole US stock market', partners: [
      { t: 'ITOT', name: 'iShares Core S&P Total U.S. Stock Market ETF', idx: 'S&P Total Market', risk: 'lo', note: 'Whole US market on an S&P index.' },
      { t: 'SCHB', name: 'Schwab U.S. Broad Market ETF', idx: 'Dow Jones U.S. Broad Stock Market', risk: 'lo', note: 'Whole US market on a Dow Jones index.' },
      { t: 'VOO', name: 'Vanguard S&P 500 ETF', idx: 'S&P 500', risk: 'mix', note: 'Drops mid and small companies for a while. Safe on wash sales, slightly different mix.' },
    ] },
    { t: 'VGT', name: 'Vanguard Information Technology ETF', idx: 'MSCI US IMI Information Technology 25/50', what: 'US tech companies', partners: [
      { t: 'XLK', name: 'Technology Select Sector SPDR Fund', idx: 'Technology Select Sector (S&P)', risk: 'lo', note: 'Also US tech, on a different index with fewer, larger holdings.' },
      { t: 'FTEC', name: 'Fidelity MSCI Information Technology ETF', idx: 'MSCI USA IMI Information Technology 25/50', risk: 'hi', note: 'Effectively the same MSCI tech index as VGT, with nearly identical holdings. Avoid this pair.' },
      { t: 'QQQ', name: 'Invesco QQQ Trust', idx: 'Nasdaq-100', risk: 'mix', note: 'Tech-heavy but also holds non-tech giants. Safe on wash sales, different mix.' },
    ] },
    { t: 'QQQ', name: 'Invesco QQQ Trust', idx: 'Nasdaq-100', what: 'the 100 largest Nasdaq companies', partners: [
      { t: 'VUG', name: 'Vanguard Growth ETF', idx: 'CRSP US Large Cap Growth', risk: 'mix', note: 'Large US growth companies, heavy overlap at the top.' },
      { t: 'XLK', name: 'Technology Select Sector SPDR Fund', idx: 'Technology Select Sector (S&P)', risk: 'mix', note: 'Tech only, so it skips QQQ’s non-tech names.' },
      { t: 'QQQM', name: 'Invesco NASDAQ 100 ETF', idx: 'Nasdaq-100', risk: 'hi', note: 'Same index and same sponsor as QQQ. Avoid for harvesting.' },
    ] },
    { t: 'VXUS', name: 'Vanguard Total International Stock ETF', idx: 'FTSE Global All Cap ex US', what: 'stocks outside the US', partners: [
      { t: 'IXUS', name: 'iShares Core MSCI Total International Stock ETF', idx: 'MSCI ACWI ex USA IMI', risk: 'lo', note: 'International stocks on an MSCI index.' },
      { t: 'VEU', name: 'Vanguard FTSE All-World ex-US ETF', idx: 'FTSE All-World ex US', risk: 'lo', note: 'Different FTSE index without the smallest companies.' },
    ] },
    { t: 'BND', name: 'Vanguard Total Bond Market ETF', idx: 'Bloomberg US Aggregate Float Adjusted', what: 'US investment-grade bonds', partners: [
      { t: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', idx: 'Bloomberg US Aggregate', risk: 'mid', note: 'A very close cousin index. Widely used for harvesting, but more of a gray area.' },
    ] },
    { t: 'SCHD', name: 'Schwab U.S. Dividend Equity ETF', idx: 'Dow Jones U.S. Dividend 100', what: 'US dividend payers', partners: [
      { t: 'VYM', name: 'Vanguard High Dividend Yield ETF', idx: 'FTSE High Dividend Yield', risk: 'lo', note: 'Dividend payers chosen by a different method.' },
      { t: 'DGRO', name: 'iShares Core Dividend Growth ETF', idx: 'Morningstar US Dividend Growth', risk: 'lo', note: 'Companies that grow their dividends.' },
    ] },
  ];

  SML.widgets.tlhPairs = function (root) {
    const id = SML.uid('wtp');
    const backFmt = (v) => (v >= 61 ? 'Stay in the new fund' : 'Day ' + v);
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Fund you hold</span>${select(id + '-f', 'Fund you hold', FUNDS.map((f) => ({ v: f.t, label: f.t + ' · ' + f.what })), 'VGT').replace('<span>Fund you hold</span>', '<span class="sr">Fund you hold</span>')}</div>
      <div class="wwt-pbar"><span class="wg-title">Swap into</span><span id="${id}-pw"></span></div>
      <div class="wwt-swap" id="${id}-sw"></div>
      <div class="wg-fig"></div>
      <div class="wg-bar"><span class="wg-title">Traps</span>${ui.chips(id + '-tr', [{ k: 'ira', label: 'I · IRA auto-buy, day −8', color: 'var(--down)' }, { k: 'drip', label: 'D · Dividend reinvest, day +12', color: 'var(--down)' }, { k: 'sp', label: 'S · Spouse buys, day +20', color: 'var(--down)' }])}</div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-c', label: 'You paid', min: 1000, max: 100000, step: 500, value: 20000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-d', label: 'It has fallen', min: 2, max: 40, step: 1, value: 20, fmt: 'pct' })}
        ${ui.slider({ id: id + '-b', label: 'Buy the old fund back on', min: 0, max: 61, step: 1, value: 31, fmt: backFmt })}
        ${select(id + '-o', 'Your loss cancels', [{ v: 'st', label: 'Short-term gains' }, { v: 'lt', label: 'Long-term gains' }, { v: 'inc', label: 'No gains: income only' }], 'st')}
        ${brSelect(id + '-br', 24)}
      </div>
      <div class="wg-read wwt-read">${ui.stat('Loss harvested', id + '-l')}${ui.stat('Blocked by wash sales', id + '-x')}${ui.stat('Usable this year', id + '-u')}${ui.stat('Carried forward', id + '-cf')}${ui.stat('Est. tax saved now', id + '-s', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the round handle to move the buy-back day. The window looks back as well as forward: a purchase in the 30 days before the sale counts the same as one after. Trap purchases are sample amounts: one dividend (0.4% of the position), a $500 IRA purchase and a $5,000 spouse purchase. A partial repurchase blocks a matching share of the loss. Federal estimate only; the $3,000 income limit is $1,500 if married filing separately. Not tax advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    let partner = 0, xs = null;
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.id === id + '-f') { partner = 0; renderPartners(); } draw(); });
    const fund = () => FUNDS.find((f) => f.t === $id(id + '-f').value) || FUNDS[0];
    function renderPartners() {
      const f = fund();
      $id(id + '-pw').innerHTML = ui.seg(id + '-p', f.partners.map((p, i) => ({ v: i, label: p.t })), partner, 'Swap partner');
      const seg = $id(id + '-p');
      seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; partner = Number(b.dataset.v); seg.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); draw(); });
    }
    renderPartners();
    const setDay = (pt) => { if (!xs) return; st.set(id + '-b', Math.round(clamp(xs.inv(pt.x), 0, 61))); draw(); };
    ui.drag(fig, { sel: '.handle,.wwt-hit', start: setDay, move: setDay });

    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const f = fund(), p = f.partners[partner] || f.partners[0];
      const cost = st.n(id + '-c'), drop = st.n(id + '-d') / 100, back = st.n(id + '-b'), br = Number($id(id + '-br').value) || 24, off = $id(id + '-o').value;
      const V = cost * (1 - drop), L = cost * drop;
      const traps = [];
      if (st.on(id + '-tr', 'ira')) traps.push({ k: 'I', day: -8, amt: 500, ira: true, label: 'IRA buys $500' });
      if (st.on(id + '-tr', 'drip')) traps.push({ k: 'D', day: 12, amt: V * 0.004, label: 'a reinvested dividend' });
      if (st.on(id + '-tr', 'sp')) traps.push({ k: 'S', day: 20, amt: 5000, label: 'your spouse’s $5,000 purchase' });
      const backIn = back <= 30;
      let frac = 0, fracIra = 0;
      traps.forEach((t) => { const fr = Math.min(1, t.amt / V); frac += fr; if (t.ira) fracIra += fr; });
      if (backIn) { frac = 1; fracIra = Math.min(fracIra, 1); }
      frac = Math.min(1, frac);
      const riskHi = p.risk === 'hi';
      const blocked = L * frac, lostForever = backIn ? 0 : L * Math.min(fracIra, 1);
      const usable = L - blocked;
      let saved = 0, carry = 0;
      if (off === 'st') saved = usable * br / 100;
      else if (off === 'lt') saved = usable * ltFor(br) / 100;
      else { const u = Math.min(3000, usable); saved = u * br / 100; carry = usable - u; }

      /* swap cards */
      const rk = RISK[p.risk];
      $id(id + '-sw').innerHTML = `<div class="wwt-fund sell"><span class="k">Sell at a loss</span><b>${f.t}</b><span class="nm">${esc(f.name)}</span><span class="ix">Index: ${esc(f.idx)}</span></div><div class="wwt-arrow" aria-hidden="true">→</div><div class="wwt-fund buy"><span class="k">Buy the same day</span><b>${p.t}</b><span class="nm">${esc(p.name)}</span><span class="ix">Index: ${esc(p.idx)}</span><span class="pill ${rk.cls} wwt-risk">${rk.label}</span></div>`;

      /* calendar: day -35 .. +65 */
      const lo = -35, hi = 65, n = hi - lo + 1;
      const H = compact ? 196 : 186, x0 = 14, x1 = W - 14;
      xs = SML.lin(lo - 0.5, hi + 0.5, x0, x1);
      const cw = (x1 - x0) / n, gap = cw > 5 ? 0.5 : 0, cy = 52, ch = 24;
      let s = '';
      s += S.text(xs(0), 16, compact ? 'Wash-sale window: 61 days' : 'Wash-sale window: 30 days before to 30 days after the sale', 'sm b dn', 'middle');
      s += S.line(xs(-30.5), 26, xs(30.5), 26, 's-dn w15') + S.line(xs(-30.5), 26, xs(-30.5), 33, 's-dn w15') + S.line(xs(30.5), 26, xs(30.5), 33, 's-dn w15');
      for (let k = lo; k <= hi; k++) {
        const cls = k === 0 ? 'f-dn' : Math.abs(k) <= 30 ? 'f-dn-t' : 'f-shade2';
        s += S.rect(xs(k - 0.5) + gap, cy, cw - 2 * gap, ch, cls, cw > 6 ? 1.5 : 0);
      }
      /* trap flags above the cells */
      traps.forEach((t) => {
        const x = xs(t.day);
        s += S.polygon([[x - 6, 36], [x + 6, 36], [x, 46]], 'f-dn') + S.text(x, 33, t.k, 'sm b dn', 'middle');
      });
      /* partner buy marker (day 0) */
      const tickY = cy + ch + 15;
      const step = compact ? 30 : 10;
      for (let k = -30; k <= 60; k += step) { if (k === 0) continue; s += S.text(xs(k), tickY, k > 0 ? '+' + k : F.minus + -k, 'xs mono', 'middle'); }
      s += S.text(xs(0), tickY, compact ? 'Sale' : `Sell ${f.t}, buy ${p.t}`, 'sm b ink', 'middle');
      /* buy-back handle */
      const bx = back >= 61 ? xs(hi) : xs(back);
      const hy = cy + ch + 44;
      s += S.line(bx, cy + ch, bx, tickY - 12, 's-ink w15' + (back >= 61 ? ' dash2' : '')) + S.line(bx, tickY + 5, bx, hy - 9, 's-ink w15' + (back >= 61 ? ' dash2' : ''));
      s += S.rect(x0 - 6, cy - 4, x1 - x0 + 12, hy - cy + 20, 'hit wwt-hit');
      s += S.circle(bx, hy, 9, 'handle');
      const lab = back >= 61 ? `Stay in ${p.t}` : `Buy ${f.t} back: day ${back}`;
      s += S.text(clamp(bx, x0 + 70, x1 - 70), hy + 28, lab, 'sm b ' + (backIn ? 'dn' : 'up'), 'middle');
      fig.innerHTML = S.wrap(W, H, `Calendar from 35 days before to 65 days after selling ${f.t} at a loss. Buy-back of ${f.t} on ${back >= 61 ? 'no date' : 'day ' + back}, ${backIn ? 'inside' : 'outside'} the window. ${traps.length} trap purchase${traps.length === 1 ? '' : 's'} inside the window.`, s);

      sv(id + '-l', F.usd0(L), 'dn');
      sv(id + '-x', F.usd0(blocked), blocked > 0 ? 'dn' : '');
      sv(id + '-u', F.usd0(usable), usable > 0 ? 'up' : '');
      sv(id + '-cf', F.usd0(carry), carry > 0 ? 'vio' : '');
      sv(id + '-s', F.usd0(saved), 'acc');

      const iraPart = L * Math.min(1, fracIra), otherPart = blocked - iraPart;
      const trapTxt = traps.length ? ` ${lostForever > 0 ? `Your IRA’s purchase 8 days before the sale blocks ${F.usd0(iraPart)}, and because it was in an IRA that part is gone for good (Rev. Rul. 2008-5).` : ''}${otherPart > 0.5 ? ` ${((x) => x.charAt(0).toUpperCase() + x.slice(1))(traps.filter((t) => !t.ira).map((t) => t.label).join(' and '))} inside the window block${traps.filter((t) => !t.ira).length === 1 ? 's' : ''} ${F.usd0(otherPart)}, which moves into the new shares’ basis.` : ''} Purchases in the 30 days before the sale count as much as those after: stop automatic buys and dividend reinvestment of the old fund at least 31 days before you sell, in every account.` : '';
      let m;
      if (backIn) m = ui.msg('dn', 'Wash sale', `Buying ${f.t} back on day ${back} is inside the 30-day window, so the whole ${F.usd0(L)} loss is blocked for now. It moves into the cost basis of the shares you bought back. Wait until day 31.`);
      else if (riskHi) m = ui.msg('dn', 'Gray zone', `${p.t} tracks the same index as ${f.t}. If the IRS called them substantially identical, the swap would be a wash sale and the whole ${F.usd0(L)} loss would be blocked. Pick a fund on a different index.${trapTxt}`);
      else if (lostForever > 0) m = ui.msg('dn', 'IRA trap', trapTxt.trim());
      else if (traps.length) m = ui.msg('acc', 'Partial wash', `Small purchases of ${f.t} inside the window block ${F.usd0(blocked)} of the loss. That part moves into the new shares’ basis, so it is delayed, not lost. Purchases in the 30 days before the sale count too, so stop automatic buys and reinvestment at least 31 days before you sell.`);
      else if (p.risk === 'mid') m = ui.msg('acc', 'Gray area', `${p.t} follows a very close cousin of ${f.t}’s index. Many investors use it, but it is less clear-cut than a different-index swap. You keep about ${F.usd0(saved)} of tax savings if it holds.`);
      else if (off === 'inc') m = ui.msg('up', 'Clean harvest', `With no gains to cancel, ${F.usd0(Math.min(3000, usable))} cuts your income this year and ${F.usd0(carry)} carries forward to future years. You stay invested in ${p.t}.`);
      else m = ui.msg('up', 'Clean harvest', `${f.t} → ${p.t} on ${p.idx === f.idx ? 'the same' : 'a different'} index. You book a ${F.usd0(L)} loss, stay invested, and save about ${F.usd0(saved)} this year. Your new basis is ${F.usd0(V)}, so part of that tax comes back when you sell later.`);
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     2. wheelTaxSim: every tax event in a wheel, step by step
     ===================================================================== */
  /* event fields: t date, title, cash, st, lt, basis text, hp text, tags [[cls,text]], why, clock {n, susp, lost, lt} */
  function pathA() {
    const acq = D(2027, 1, 15);
    const ck = (t) => ({ n: diff(acq, t), susp: 0, lost: 0, ltOn: D(2028, 1, 16) });
    return [
      { t: D(2026, 11, 20), title: 'Sell a $50 put on DEMO, expiring Dec 18, for $1.50 a share ($150).', cash: 150, tags: [['', 'Not taxed yet']],
        why: 'Premium you collect for selling an option is not income when it lands. It sits open until the option ends: it expires, you buy it back, or you are assigned.' },
      { t: D(2026, 12, 18), title: 'The put expires worthless. DEMO closes at $51.', cash: 0, st: 150, tags: [['up', 'Short-term gain $150 · 2026']],
        why: 'An option you sold that expires is a short-term capital gain on the expiration date, no matter how long it was open.' },
      { t: D(2026, 12, 21), title: 'Sell a $48 put expiring Jan 15, 2027, for $1.20 ($120).', cash: 120, tags: [['acc', 'Cash in 2026, tax in 2027']],
        why: 'The cash arrives in December, but nothing is taxed for 2026. The option ends in 2027, so that is the year it counts. This trips up many people doing their own estimates.' },
      { t: acq, title: 'Assigned. DEMO closes at $46.10, so you buy 100 shares at $48 ($4,800).', cash: -4800, basis: 4680, tags: [['', 'No tax event'], ['info', 'Basis $46.80 a share']], clock: ck(acq),
        why: 'The $120 premium is never taxed on its own. It lowers what the shares cost you: $48.00 − $1.20 = $46.80 a share. The holding period starts the next day.' },
      { t: D(2027, 2, 8), title: 'Sell a $50 covered call expiring Mar 19 (39 days, out of the money) for $1.00 ($100).', cash: 100, tags: [['', 'Not taxed yet'], ['up', 'Qualified covered call']], clock: ck(D(2027, 2, 8)),
        why: 'More than 30 days to expiration and out of the money, so it is a qualified covered call. Your shares’ holding period keeps running.' },
      { t: D(2027, 3, 10), title: 'DEMO dips. Buy the call back for $0.30 ($30).', cash: -30, st: 70, tags: [['up', 'Short-term gain $70 · 2027']], clock: ck(D(2027, 3, 10)),
        why: 'Buying back an option you sold closes it. The difference, $100 − $30 = $70, is a short-term gain or loss, whatever the holding time.' },
      { t: D(2027, 3, 10), title: 'Roll out: sell a $50 call expiring Apr 16 for $0.90 ($90).', cash: 90, tags: [['', 'Not taxed yet']], clock: ck(D(2027, 3, 10)),
        why: 'A roll is two trades. The buy-back was taxed just now; the new call is taxed only when it ends.' },
      { t: D(2027, 4, 16), title: 'Called away. DEMO closes at $52.40, so your shares are sold at $50 ($5,000).', cash: 5000, st: 410, tags: [['up', 'Short-term gain $410 · 2027']], clock: ck(D(2027, 4, 16)), sold: true,
        why: 'The call premium is added to the sale price: $5,000 + $90 = $5,090, minus your $4,680 basis = $410. You held the shares 91 days, so it is short-term.' },
    ];
  }
  function pathB(k) {
    const acq = D(2026, 3, 20), sale = D(2027, 4, 15), callOn = D(2027, 1, 4), callEnd = D(2027, 2, 19);
    const susp = diff(callOn, callEnd); // 46 days
    const ltBase = D(2027, 3, 21);
    const clock = (t) => {
      const n0 = diff(acq, t);
      if (k === 'itm' && t > callOn) return { n: n0 - Math.min(susp, diff(callOn, t)), susp: Math.min(susp, diff(callOn, t)), lost: 0, ltOn: ltBase + susp * DAY };
      if (k === 'deep' && t >= callEnd) return { n: diff(callEnd, t), susp: 0, lost: diff(acq, callEnd), ltOn: D(2028, 2, 20) };
      if (k === 'deep' && t >= callOn) return { n: n0, susp: 0, lost: 0, ltOn: ltBase, open: true };
      return { n: n0, susp: 0, lost: 0, ltOn: ltBase };
    };
    const C = {
      otm: { title: 'DEMO is at $50. Sell a $52.50 call expiring Feb 19 (46 days) for $1.10 ($110).', cash: 110, tags: [['', 'Not taxed yet'], ['up', 'Qualified, out of the money']],
        why: 'Out of the money with more than 30 days to go: a qualified covered call. The holding-period clock on your shares keeps running.' },
      itm: { title: 'DEMO is at $50. Sell a $47.50 call expiring Feb 19 (46 days) for $3.40 ($340).', cash: 340, tags: [['', 'Not taxed yet'], ['acc', 'Qualified, in the money']],
        why: 'One strike in the money still counts as a qualified covered call, but because it is in the money, the holding period of shares held a year or less is suspended while the call is open.' },
      deep: { title: 'DEMO is at $50. Sell a deep $40 call expiring Feb 19 (46 days) for $10.20 ($1,020).', cash: 1020, tags: [['', 'Not taxed yet'], ['dn', 'Not qualified: a tax straddle']],
        why: 'A call this deep in the money is not a qualified covered call. The shares and the call form a straddle, and for shares held a year or less the holding period is wiped out. It starts again only when the straddle ends.' },
    }[k];
    const E = {
      otm: { title: 'Feb 19: DEMO closes at $46. The $52.50 call expires worthless.', cash: 0, st: 110, tags: [['up', 'Short-term gain $110 · 2027']], why: 'An expired call you sold is a short-term gain. Your shares stay put and the clock never stopped.' },
      itm: { title: 'Feb 19: DEMO closes at $46. The $47.50 call expires worthless.', cash: 0, st: 340, tags: [['up', 'Short-term gain $340 · 2027'], ['acc', '46 days not counted']], why: 'The call made $340, short-term. The 46 days it was open do not count toward your shares’ holding period, so long-term status moves out by 46 days.' },
      deep: { title: 'Feb 19: DEMO closes at $46. Buy the $40 call back for $6.10 ($610).', cash: -610, st: 410, tags: [['up', 'Short-term gain $410 · 2027'], ['dn', 'Holding period reset']], why: 'Closing the call nets $1,020 − $610 = $410, short-term. The straddle ends today, and the shares’ holding period starts over from here: the 336 days you had are gone.' },
    }[k];
    const ltNote = { otm: 'You have now held the shares more than one year. Any gain from today is long-term.', itm: 'One calendar year has passed, but 46 suspended days do not count. Long-term starts around May 6, 2027.', deep: 'One calendar year has passed, but the clock restarted on Feb 19. Long-term is now about a year away, in late February 2028.' }[k];
    const saleTerm = k === 'otm' ? 'lt' : 'st';
    return [
      { t: D(2026, 3, 2), title: 'Sell a $40 put on DEMO expiring Mar 20 for $1.00 ($100).', cash: 100, tags: [['', 'Not taxed yet']], why: 'Premium is not taxed when you receive it. It waits for the option to end.' },
      { t: acq, title: 'Assigned at $40: you buy 100 shares ($4,000).', cash: -4000, basis: 3900, tags: [['', 'No tax event'], ['info', 'Basis $39.00 a share']], clock: clock(acq),
        why: 'The $100 premium lowers your cost: $40.00 − $1.00 = $39.00 a share, $3,900 in all. The holding period starts the next day, Mar 21, 2026.' },
      { t: D(2026, 7, 17), title: 'Sell a $45 call in June for $0.80 ($80). It expires Jul 17 with DEMO at $43.', cash: 80, st: 80, tags: [['up', 'Short-term gain $80 · 2026']], clock: clock(D(2026, 7, 17)),
        why: 'Covered calls that expire are short-term gains in the year they expire. Out of the money and 46 days long, so the holding period keeps running.' },
      Object.assign({ t: callOn, clock: clock(callOn) }, C),
      Object.assign({ t: callEnd, clock: clock(callEnd) }, E),
      { t: ltBase, title: 'Mar 21, 2027: one year since you bought the shares.', cash: 0, tags: [[k === 'otm' ? 'up' : 'dn', k === 'otm' ? 'Long-term from today' : 'Still short-term']], clock: clock(ltBase), why: ltNote },
      { t: sale, title: 'Apr 15: DEMO is $55. You sell the shares ($5,500).', cash: 5500, [saleTerm]: 1600, sold: true, tags: [[saleTerm === 'lt' ? 'up' : 'dn', (saleTerm === 'lt' ? 'Long-term' : 'Short-term') + ' gain $1,600 · 2027']], clock: clock(sale),
        why: saleTerm === 'lt' ? '$5,500 − $3,900 basis = $1,600, and you held the shares more than a year: taxed at the lower long-term rate.' : `$5,500 − $3,900 basis = $1,600. Because of the ${k === 'itm' ? 'suspended days' : 'reset clock'}, the shares count as held under a year, so the whole gain is short-term, taxed like salary.` },
    ];
  }
  function pathC() {
    return [
      { t: D(2026, 11, 2), title: 'Sell 1 XSP put (a cash-settled mini S&P 500 index option) for $4.00 ($400).', cash: 400, tags: [['', 'Not taxed yet'], ['vio', 'Section 1256 contract']],
        why: 'Broad-based index options such as SPX and XSP generally count as Section 1256 contracts. They are cash-settled, so there are no shares to wheel, but the tax rules are friendlier.' },
      { t: D(2026, 12, 31), title: 'Year end: the put is still open and now worth $1.50 ($150).', cash: 0, lt: 150, st: 100, mtm: true, tags: [['vio', 'Marked to market: $250 gain'], ['up', '60% long / 40% short']],
        why: 'Section 1256 contracts are treated as sold at their fair value on the last business day of the year. You owe 2026 tax on the $250 gain even though the trade is open: 60% long-term ($150) and 40% short-term ($100), reported on Form 6781.' },
      { t: D(2027, 1, 15), title: 'Buy the put back for $0.50 ($50).', cash: -50, lt: 60, st: 40, tags: [['up', '$100 more gain · 2027'], ['up', '60/40 again']],
        why: 'Total gain $400 − $50 = $350. $250 was already taxed for 2026, so 2027 picks up the last $100, again split 60/40. The same trade on SPY options would be $350 of short-term gain, all in 2027.' },
    ];
  }

  SML.widgets.wheelTaxSim = function (root) {
    const id = SML.uid('wts');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-p', [{ v: 'a', label: 'Called away within a year' }, { v: 'b', label: 'Held past a year' }, { v: 'c', label: 'Index options' }], 'a', 'Example path')}</div>
      <div class="wg-bar" id="${id}-kb" hidden><span class="wg-title">The January call</span>${ui.seg(id + '-k', [{ v: 'otm', label: 'Out of the money' }, { v: 'itm', label: 'One strike in' }, { v: 'deep', label: 'Deep in the money' }], 'otm', 'Covered call choice')}</div>
      <div class="wg-fig"></div>
      <div class="wwt-card" id="${id}-card" aria-live="polite"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" data-a="back">Back</button><button type="button" class="btn btn-a sm" data-a="next">Next step</button><button type="button" class="btn btn-g sm" data-a="end">Run to the end</button><button type="button" class="btn btn-g sm" data-a="reset">Start over</button><span class="grow"></span><span class="wwt-br">${brSelect(id + '-br', 24, 'Bracket')}</span></div>
      <div class="wwt-ledw" id="${id}-led"></div>
      <div class="wg-read wwt-read">${ui.stat('Net cash so far', id + '-c')}${ui.stat('Taxable in 2026', id + '-y1')}${ui.stat('Taxable in 2027', id + '-y2')}${ui.stat('Est. federal tax', id + '-tx', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Made-up stock DEMO, one contract (100 shares). Long-term rate shown is the usual one for your bracket (0% at 10–12%, 15% in the middle, 20% at the top); the real line is set by taxable income. Ignores state tax and the 3.8% net investment income tax. Not tax advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    let cur = 0;
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && e.target.closest('.seg')) cur = 0; draw(); });
    const events = () => { const p = st.seg(id + '-p') || 'a'; return p === 'a' ? pathA() : p === 'b' ? pathB(st.seg(id + '-k') || 'otm') : pathC(); };
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const n = events().length, a = b.dataset.a;
      if (a === 'next') cur = Math.min(n - 1, cur + 1); else if (a === 'back') cur = Math.max(0, cur - 1); else if (a === 'end') cur = n - 1; else cur = 0;
      draw();
    });

    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const path = st.seg(id + '-p') || 'a';
      $id(id + '-kb').hidden = path !== 'b';
      const ev = events(); cur = clamp(cur, 0, ev.length - 1);
      const br = Number($id(id + '-br').value) || 24, lr = ltFor(br);
      /* totals up to cur */
      const yrs = {}; let cash = 0;
      ev.slice(0, cur + 1).forEach((e) => { cash += e.cash || 0; const y = yearOf(e.t); yrs[y] = yrs[y] || { st: 0, lt: 0 }; yrs[y].st += e.st || 0; yrs[y].lt += e.lt || 0; });
      [2026, 2027].forEach((y) => { yrs[y] = yrs[y] || { st: 0, lt: 0 }; });
      const taxOf = (o) => o.st * br / 100 + o.lt * lr / 100;
      const tax = taxOf(yrs[2026]) + taxOf(yrs[2027]);

      /* ---- figure: event strip + clock ---- */
      const n = ev.length, x0 = 12, x1 = W - 12, slot = (x1 - x0) / n;
      const cx = (i) => x0 + slot * (i + 0.5);
      const H = path === 'c' ? 196 : 206;
      let s = '';
      /* year bands */
      const firstNext = ev.findIndex((e) => yearOf(e.t) === 2027);
      const split = firstNext < 0 ? x1 : x0 + slot * firstNext;
      s += S.rect(x0, 8, split - x0, 104, 'f-shade', 4) + S.rect(split, 8, x1 - split, 104, 'f-acc-t o70', 4);
      s += S.text(x0 + 8, 24, '2026', 'cap', 'start');
      if (firstNext >= 0) s += S.text(x1 - 8, 24, '2027', 'cap acc', 'end');
      s += S.line(x0 + slot * 0.5, 60, x1 - slot * 0.5, 60, 's-line w2');
      ev.forEach((e, i) => {
        const x = cx(i), on = i === cur, past = i < cur, fut = i > cur;
        const kind = e.mtm ? 'f-vio' : e.lt ? 'f-up' : e.st ? 'f-up' : e.basis ? 'f-info' : 'f-acc';
        if (on) s += S.circle(x, 60, 15, 'nf s-acc w2');
        s += S.circle(x, 60, 10, (fut ? 'f-shade2' : kind) + (past ? ' o70' : ''));
        s += S.text(x, 64, String(i + 1), 'badge', 'middle');
        const cl = fut ? 'xs mono mut' : 'xs mono ' + ((e.cash || 0) > 0 ? 'up' : (e.cash || 0) < 0 ? 'dn' : 'mut');
        s += S.text(x, 40, e.cash ? (compact ? k$(e.cash) : pm$(e.cash)) : '·', cl + (on ? ' b' : ''), 'middle');
        const dd = new Date(e.t);
        s += S.text(x, 92, compact ? (dd.getUTCMonth() + 1) + '/' + dd.getUTCDate() : dShort(e.t), 'xs' + (on ? ' ink b' : ''), 'middle');
        const tx = (e.st || 0) + (e.lt || 0);
        s += S.text(x, 106, fut ? '' : tx ? (e.mtm ? 'MTM' : e.lt && !e.st ? 'LT' : e.lt ? '60/40' : 'ST') : e.basis ? 'basis' : '', 'xs b ' + (e.mtm ? 'vio' : e.lt && !e.st ? 'up' : tx ? 'acc' : 'info'), 'middle');
      });
      /* clock or 60/40 bar */
      const by = 140;
      if (path === 'c') {
        const bx0 = x0, bw = x1 - x0;
        s += S.text(x0, by - 8, compact ? 'Section 1256: always split 60/40' : 'Section 1256: every gain or loss is split the same way, however long you held', 'sm ink');
        s += S.rect(bx0, by, bw * 0.6, 22, 'f-up', 3) + S.rect(bx0 + bw * 0.6 + 2, by, bw * 0.4 - 2, 22, 'f-acc', 3);
        s += S.text(bx0 + bw * 0.3, by + 15, '60% long-term', 'sm b on', 'middle') + S.text(bx0 + bw * 0.8, by + 15, '40% short-term', 'sm b onacc', 'middle');
        const blend = 0.6 * lr + 0.4 * br;
        s += S.text(x0, by + 44, compact ? `Blended rate ${F.num(blend, 1)}% vs ${br}% on SPY options` : `Blended rate in the ${br}% bracket: ${F.num(blend, 1)}%, vs ${br}% for ETF options like SPY`, 'sm acc b');
      } else {
        const e = ev[cur], c = e.clock && !(ev.slice(0, cur).some((q) => q.sold)) ? e.clock : null;
        const maxD = 420, bx = SML.lin(0, maxD, x0, x1);
        s += S.text(x0, by - 8, compact ? 'Holding-period clock' : 'Holding-period clock: days that count toward long-term (more than one year)', 'sm ink');
        s += S.rect(x0, by, x1 - x0, 20, 'f-shade2', 3);
        if (c) {
          const filled = clamp(c.n, 0, maxD);
          s += S.rect(x0, by, bx(filled) - x0, 20, c.n > 365 ? 'f-up' : 'f-info', 3);
          if (c.susp) s += S.rect(bx(filled), by, bx(filled + c.susp) - bx(filled), 20, 'f-acc o70', 0);
          if (c.lost) s += S.text(x0, by + 38, compact ? `Reset: ${c.lost} days wiped out` : `Reset: ${c.lost} days wiped out by the straddle`, 'sm b dn');
          else if (c.susp) s += S.text(x0, by + 38, compact ? `${c.susp} days suspended` : `${c.susp} days suspended while the in-the-money call was open`, 'sm b acc');
          else if (c.open) s += S.text(x0, by + 38, compact ? 'Straddle open: reset ahead' : 'Straddle open: the clock will reset when it ends', 'sm b dn');
          s += S.text(clamp(bx(filled), x0 + 30, x1 - 4), by + 15, `${c.n} d`, 'sm mono b ' + (c.n > 365 ? 'on' : 'ink'), c.n > 40 ? 'end' : 'start', c.n > 40 ? ' dx="-6"' : ' dx="6"');
        } else {
          s += S.text((x0 + x1) / 2, by + 14, ev.slice(0, cur + 1).some((q) => q.sold) ? 'Shares sold' : 'No shares yet', 'sm mut', 'middle');
        }
        s += S.line(bx(365), by - 4, bx(365), by + 24, 's-acc w2') + S.text(bx(365), by + 38 + (c && (c.lost || c.susp || c.open) ? 16 : 0), '1 year', 'sm acc b', 'middle');
      }
      fig.innerHTML = S.wrap(W, H, `Timeline of ${n} wheel events across 2026 and 2027, step ${cur + 1} highlighted, with the holding-period clock.`, s);

      /* ---- event card ---- */
      const e = ev[cur];
      const tags = (e.tags || []).map(([c, t]) => `<span class="pill ${c}">${t}</span>`).join('');
      const extra = [];
      if (e.cash) extra.push(`<span class="pill ${e.cash > 0 ? 'up' : 'dn'}">Cash ${pm$(e.cash)}</span>`);
      $id(id + '-card').innerHTML = `<div class="hd"><b>Step ${cur + 1} of ${n}</b><span>${dLong(e.t)}</span></div><h4>${e.title}</h4><div class="wwt-tags">${extra.join('')}${tags}</div><p>${e.why}</p>`;

      /* ---- ledger ---- */
      const row = (y) => { const o = yrs[y]; return `<tr><td>${y}</td><td class="${o.st ? '' : 'z'}">${F.usd0(o.st)}</td><td class="${o.lt ? '' : 'z'}">${F.usd0(o.lt)}</td><td class="${taxOf(o) ? '' : 'z'}">${F.usd0(taxOf(o))}</td></tr>`; };
      const tot = { st: yrs[2026].st + yrs[2027].st, lt: yrs[2026].lt + yrs[2027].lt };
      $id(id + '-led').innerHTML = `<table class="wwt-led"><thead><tr><th>Year</th><th>Short<span class="wwt-sm">-term</span></th><th>Long<span class="wwt-sm">-term</span></th><th>Tax<span class="wwt-sm"> at ${br}% / ${lr}%</span></th></tr></thead><tbody>${row(2026)}${row(2027)}</tbody><tfoot><tr><td>Total</td><td>${F.usd0(tot.st)}</td><td>${F.usd0(tot.lt)}</td><td>${F.usd0(tax)}</td></tr></tfoot></table>`;

      sv(id + '-c', pm$(cash), cash >= 0 ? 'up' : 'dn');
      sv(id + '-y1', F.usd0(yrs[2026].st + yrs[2026].lt));
      sv(id + '-y2', F.usd0(yrs[2027].st + yrs[2027].lt));
      sv(id + '-tx', F.usd0(tax), 'acc');

      const last = cur === n - 1;
      let m;
      if (!last) m = ui.msg('acc', `Step ${cur + 1}`, `${e.tags && e.tags[0] ? e.tags[0][1] : ''}. Press Next step to keep going.`);
      else if (path === 'a') m = ui.msg('dn', 'All short-term', `You netted $630. Every dollar is short-term, taxed like salary: about ${F.usd0(tax)} federal at ${br}%. Notice the $120 put: paid in 2026, absorbed into basis in 2027. In a Roth IRA none of this would be taxed.`);
      else if (path === 'b') {
        const k = st.seg(id + '-k') || 'otm';
        const alt = { st: 80 + (k === 'otm' ? 110 : k === 'itm' ? 340 : 410), lt: 0 };
        m = k === 'otm' ? ui.msg('up', 'Long-term', `Out-of-the-money calls kept the clock running, so the $1,600 share gain is long-term at ${lr}%. Total federal tax about ${F.usd0(tax)}.`)
          : ui.msg('dn', 'Clock trap', `The ${k === 'itm' ? 'in-the-money call suspended' : 'deep call reset'} the holding period, so the $1,600 share gain is short-term at ${br}%: about ${F.usd0(1600 * (br - lr) / 100)} more tax than the out-of-the-money path. Total federal tax about ${F.usd0(tax)} on ${F.usd0(alt.st + 1600)} of gains.`);
      } else {
        const spy = 350 * br / 100;
        m = ui.msg('vio', '60/40', `Section 1256 treatment: about ${F.usd0(tax)} of federal tax across two years, versus about ${F.usd0(spy)} if the same $350 came from SPY options (all short-term). The catch: you pay 2026 tax on an open trade.`);
      }
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     3. wheelAccounts: same wheel, taxable vs Roth IRA vs traditional IRA
     ===================================================================== */
  const IRA_LIMIT = 7500;
  SML.widgets.wheelAccounts = function (root) {
    const id = SML.uid('wta');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Start with</span>${ui.seg(id + '-pr', [{ v: IRA_LIMIT, label: 'One year of IRA money' }, { v: 50000, label: '$50K' }, { v: 200000, label: '$200K rollover' }], 50000, 'Starting amount')}<span class="grow"></span>${ui.seg(id + '-m', [{ v: 'steady', label: 'Steady years' }, { v: 'bad', label: 'A −25% year' }], 'steady', 'Market path')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-c', label: 'Money for the wheel', min: 5000, max: 300000, step: 500, value: 50000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-r', label: 'Net yearly return (premiums minus losses)', min: 2, max: 20, step: 0.5, value: 8, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-y', label: 'Years', min: 1, max: 30, step: 1, value: 15, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-s', label: 'State income tax', min: 0, max: 13, step: 0.5, value: 5, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-w', label: 'Tax rate on traditional IRA withdrawals', min: 0, max: 37, step: 1, value: 22, fmt: 'pct' })}
        ${ui.slider({ id: id + '-px', label: 'Price of the stock you wheel', min: 10, max: 300, step: 5, value: 50, fmt: 'usd0' })}
        ${brSelect(id + '-br', 24)}
      </div>
      <div class="wg-read wwt-read">${ui.stat('Taxable, after tax', id + '-tb')}${ui.stat('Roth IRA', id + '-ro', 'hl')}${ui.stat('Traditional IRA, after tax', id + '-tr')}${ui.stat('Tax paid along the way', id + '-tp')}${ui.stat('Puts you can secure', id + '-pu')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Same starting balance in each account, all gains short-term and realized each year in the taxable account. Taxable losses offset later gains and up to $3,000 a year of income; IRA losses do nothing for your taxes. Traditional IRA money was not taxed going in, so it is taxed coming out. IRA contributions are capped (the 2026 limit is $${F.num(IRA_LIMIT)}, or $8,600 at 50 and over), so bigger IRA balances usually come from rollovers. Simplified model, not advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && e.target.closest('#' + id + '-pr')) { st.set(id + '-c', Number(st.seg(id + '-pr'))); } draw(); });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const C = st.n(id + '-c'), r = st.n(id + '-r') / 100, N = st.n(id + '-y'), sTax = st.n(id + '-s') / 100, wr = st.n(id + '-w') / 100, px = st.n(id + '-px');
      const br = Number($id(id + '-br').value) / 100 || 0.24, bad = st.seg(id + '-m') === 'bad';
      const t = br + sTax;
      const ret = (y) => (bad && y === 3 ? -0.25 : r);
      let tb = C, ro = C, carry = 0, paid = 0, saved = 0;
      const pts = { tb: [[0, C]], ro: [[0, C]], tr: [[0, C * (1 - wr)]] };
      for (let y = 1; y <= N; y++) {
        const g = ret(y);
        ro *= 1 + g;
        const gain = tb * g;
        if (gain >= 0) {
          const use = Math.min(carry, gain); carry -= use;
          const tx = (gain - use) * t;
          paid += tx; tb += gain - tx;
        } else { tb += gain; carry += -gain; }
        if (carry > 0) { const u = Math.min(3000, carry); carry -= u; const back = u * t; saved += back; tb += back; }
        pts.tb.push([y, tb]); pts.ro.push([y, ro]); pts.tr.push([y, ro * (1 - wr)]);
      }
      const trv = ro * (1 - wr);
      /* chart */
      const H = compact ? 250 : 290, padL = compact ? 8 : 12, padR = compact ? 74 : 132, top = 20, bot = H - 30;
      const all = pts.ro.concat(pts.tb, pts.tr).map((p) => p[1]);
      const ymax = Math.max(...all) * 1.08, ymin = Math.min(0, Math.min(...all));
      const x = SML.lin(0, N, padL + 30, W - padR), y = SML.lin(ymin, ymax, bot, top);
      let s = '';
      SML.ticks(ymin, ymax, 4).forEach((v) => { s += S.line(padL + 30, y(v), W - padR, y(v), 's-grid') + S.text(padL + 26, y(v) + 4, '$' + (v >= 1e6 ? F.num(v / 1e6, 1) + 'M' : F.num(v / 1000, 0) + 'k'), 'xs mono', 'end'); });
      const xt = N <= 10 ? 1 : N <= 20 ? 5 : 5;
      for (let k = 0; k <= N; k += xt) s += S.text(x(k), bot + 18, k === 0 ? 'Start' : 'Yr ' + k, 'xs', 'middle');
      if (bad && N >= 3) s += S.rect(x(2), top, x(3) - x(2), bot - top, 'f-dn-t', 0) + S.text((x(2) + x(3)) / 2, top + 12, '−25%', 'xs b dn', 'middle');
      const toP = (arr) => arr.map((p) => [x(p[0]), y(p[1])]);
      s += S.poly(toP(pts.tb), 's-acc w25') + S.poly(toP(pts.tr), 's-info w25') + S.poly(toP(pts.ro), 's-up w3');
      /* end labels, spread to avoid overlap */
      const ends = [{ v: ro, l: 'Roth IRA', c: 'up' }, { v: trv, l: compact ? 'Trad. IRA' : 'Traditional IRA', c: 'info' }, { v: tb, l: 'Taxable', c: 'acc' }].sort((a, b) => b.v - a.v);
      let lastY = -1e9;
      ends.forEach((e) => { let yy = Math.max(y(e.v) + 4, lastY + 28); yy = Math.min(yy, bot + 4); lastY = yy; s += S.text(W - padR + 8, yy - 12, e.l, 'sm b ' + e.c) + S.text(W - padR + 8, yy + 2, '$' + F.num(e.v / 1000, e.v < 100000 ? 1 : 0) + 'k', 'sm mono ink'); });
      fig.innerHTML = S.wrap(W, H, `After-tax value over ${N} years: Roth IRA ${F.usd0(ro)}, traditional IRA after withdrawal tax ${F.usd0(trv)}, taxable account ${F.usd0(tb)}.`, s);

      sv(id + '-tb', F.usd0(tb), 'acc');
      sv(id + '-ro', F.usd0(ro), 'up');
      sv(id + '-tr', F.usd0(trv), 'info');
      sv(id + '-tp', F.usd0(paid), paid > 0 ? 'dn' : '');
      const puts = Math.floor(C / (px * 100));
      sv(id + '-pu', puts + (puts === 1 ? ' contract' : ' contracts'), puts === 0 ? 'dn' : '');
      let m;
      if (puts === 0) m = ui.msg('dn', 'Too small', `One cash-secured put on a $${F.num(px)} stock needs $${F.num(px * 100)} set aside. With ${F.usd0(C)} you cannot sell even one. Wheel cheaper stocks, or let the IRA grow first.`);
      else if (bad) m = ui.msg('acc', 'Loss year', `In the −25% year the taxable account books a loss that offsets later gains and up to $3,000 of income (worth ${F.usd0(saved)} here). The IRAs get no tax help from losses. Even so, after ${N} years the Roth ends ${F.usd0(ro - tb)} ahead.`);
      else m = ui.msg('up', 'Roth wins', `Wheel income is short-term, so the taxable account loses ${F.num(t * 100, 1)}% of every year’s gain to tax: ${F.usd0(paid)} over ${N} years that stopped compounding. The Roth IRA ends ${F.usd0(ro - tb)} ahead${puts <= 2 ? `, but ${F.usd0(C)} only secures ${puts} put${puts === 1 ? '' : 's'} on a $${F.num(px)} stock, so you are concentrated in one or two names` : ''}.`);
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    tc409: { t: 'IRS Topic 409: Capital gains and losses', u: 'https://www.irs.gov/taxtopics/tc409' },
    rp2532: { t: 'IRS Rev. Proc. 2025-32: 2026 tax brackets and capital gains thresholds', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    bhWash: { t: 'Bogleheads: Wash sale (spouse, IRA and substantially identical rules)', u: 'https://www.bogleheads.org/wiki/Wash_sale' },
    bhTlh: { t: 'Bogleheads: Tax-loss harvesting and fund pairs', u: 'https://www.bogleheads.org/wiki/Tax_loss_harvesting' },
    spym: { t: 'State Street: SPLG ticker change to SPYM (Oct 31, 2025)', u: 'https://www.ssga.com/library-content/products/fund-docs/etfs/us/information-schedules/ap-notice/notice-to-aps-ticker-fund-name-and-benchmark-index-name-changes-10-31-25.pdf' },
    kitcesIra: { t: 'Kitces: IRS Rev. Rul. 2008-5 and wash sales through IRAs', u: 'https://www.kitces.com/blog/irs-shuts-down-wash-sale-evasion-technique/' },
    taxact: { t: 'TaxAct (quoting IRS Pub. 550): writers of calls and puts', u: 'https://www.taxact.com/support/14604/capital-gains-and-losses-writers-of-calls-and-puts' },
    schwab: { t: 'Charles Schwab: How are options taxed?', u: 'https://www.schwab.com/learn/story/how-are-options-taxed' },
    fidCc: { t: 'Fidelity: Tax implications of covered calls', u: 'https://www.fidelity.com/learning-center/investment-products/options/tax-implications-covered-calls' },
    cboe: { t: 'Cboe: XSP vs SPY, including Section 1256 tax treatment', u: 'https://www.cboe.com/insights/posts/why-trade-xsp-vs-spy-a-breakdown-of-the-benefits' },
    iraLim: { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit increases to $7,500', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
  };

  SML.lessons.push({
    id: 'l-tlh-pairs', course: 'wtax', order: 4, title: 'Tax-loss harvesting with fund pairs', mins: 9, level: 'Intermediate',
    summary: 'Sell a fund at a loss, buy a similar one and keep both the tax break and your plan.',
    idea: 'Swap a losing fund for a similar fund on a different index. You book the loss without leaving the market.',
    widget: 'tlhPairs',
    try: 'Pick a fund you hold and a swap partner, then drag the buy-back day. Switch on the traps to see what quietly breaks the loss.',
    body: [
      '<p><b>Tax-loss harvesting</b> means selling an investment that is worth less than you paid, so the loss lowers your tax bill. The trick with index funds is that you do not have to sit in cash: you buy a similar fund the same day and stay invested. Done well, you keep your plan and get a tax break. This builds on <a href="#l-tax-loss">the trading lesson on harvesting</a> and <a href="#l-wash-sale">the wash-sale rule</a>.</p>',
      '<h3>How the swap works</h3><ul><li><b>Sell</b> the fund that is down, say VGT, and lock in the loss.</li><li><b>Buy</b> a similar fund the same day, say XLK. You stay in US tech.</li><li><b>Wait at least 31 days</b> before buying the original fund again, in any account.</li><li>After that, stay in the new fund or switch back. Either is fine.</li></ul>',
      '<h3>What “substantially identical” means for funds</h3><p>The wash-sale rule blocks a loss if you buy the same or a <b>substantially identical</b> security within 30 days before or after the sale. The IRS has never said exactly when two funds are substantially identical. Practitioners use a simple test: <b>funds that track the same index are the risky swap</b> (VOO, IVV and SPYM all track the S&P 500), while <b>funds on different indexes are common practice</b> (VOO to VTI, VTI to ITOT, VGT to XLK).</p><p>VGT and XLK are a classic pair: both hold US technology companies, but VGT follows an MSCI index with hundreds of holdings and XLK follows the S&P Technology Select Sector index with fewer, larger ones. FTEC, by contrast, tracks effectively the same MSCI tech index as VGT, so the two are nearly identical: avoid that pair.</p><h3>About “SPDL and VGT”</h3><p>We could not find any US fund with the ticker SPDL. It is most likely <b>SPLG</b>, the low-cost SPDR S&P 500 fund, which State Street renamed <b>SPYM</b> on October 31, 2025. Swapping an S&P 500 fund for VGT is safe from wash sales, but it is <b>not a similar asset</b>: you would go from the whole large-company market to technology only, a much riskier mix while you wait. If you meant an SPDR tech fund, that is <b>XLK</b>, and XLK is VGT’s usual partner.</p><h3>Sector funds and single stocks</h3><ul><li><b>Sector funds:</b> pick a partner from a different index family and check the pair itself. VGT and FTEC show that two MSCI-based funds from different companies can be near-identical.</li><li><b>Single stocks:</b> a different company is not substantially identical, so selling one stock at a loss and buying a close competitor keeps the loss. You just own a different business for a month.</li><li><b>Tracking risk:</b> while you hold the substitute it will not move exactly like the original. Over 31 days the gap is usually small, but it can go either way.</li></ul>',
      '<h3>Traps that break the loss</h3><ul><li><b>Every account counts.</b> A purchase in your IRA or Roth IRA within the window triggers a wash sale, and the IRS has ruled that loss is <b>lost for good</b>, because it cannot be added to an IRA’s basis (Rev. Rul. 2008-5). That ruling does not address 401(k) purchases, so treat those as risky too.</li><li><b>Your spouse counts.</b> If your spouse buys the same fund within the window, it is a wash sale too.</li><li><b>The window looks back, too.</b> Dividend reinvestment and automatic investing quietly buy the old fund. A purchase in the 30 days <b>before</b> the sale washes those shares just like one after, and in an IRA that part is lost for good. Stop them at least 31 days before you sell, or check what every account bought in the previous 30 days.</li><li><b>Buying a call option</b> on the same fund counts as buying it. Reinvested dividends wash only the few shares they buy, but it still makes a mess of your records.</li><li><b>Day 30 is still inside.</b> The window runs 30 days before and 30 days after the sale: 61 days in all.</li></ul>',
      '<h3>What the loss is worth</h3><p>Losses first cancel capital gains. If losses are left over, up to <b>$3,000</b> a year ($1,500 if married filing separately) comes off your ordinary income, and the rest <b>carries forward</b> with no expiry. Harvesting usually <b>defers</b> tax rather than erasing it: your new fund has a lower cost basis, so you owe more when you finally sell. The deferral is still valuable, and the tax can disappear if you give the shares to charity or hold them until death, when the basis steps up.</p>',
      '<h3>Harvest gains too</h3><p>If your taxable income is low enough to sit in the <b>0% long-term capital gains bracket</b> (for 2026, taxable income up to $49,450 single or $98,900 married filing jointly), you can do the reverse: sell winners, pay 0% tax, and buy them right back. The wash-sale rule only applies to losses, so there is no waiting. Your cost basis resets higher, which shrinks future taxes. Do not waste losses offsetting gains that would have been taxed at 0% anyway, and watch side effects of a higher income, such as health insurance subsidies. Early retirees use this a lot; see <a href="#l-zero-bracket">the 0% bracket lesson</a>.</p>',
      '<h3>A harvesting checklist</h3><ul><li>Is the loss big enough to be worth the paperwork? Small losses rarely are.</li><li>Pick a partner on a different index, with a similar risk level and low cost.</li><li>Check that no account (yours, your IRAs, your spouse’s) bought the old fund in the last 30 days, then turn off dividend reinvestment and automatic buys so nothing buys it in the next 30.</li><li>Sell and buy on the same day. Write the date down; day 31 is the earliest safe buy-back.</li><li>Check your year-end tax forms. Brokers only track wash sales inside one account, not across accounts or households.</li></ul>',
    ],
    example: {
      title: 'Swapping VGT for XLK in a down year',
      intro: 'Made-up numbers. You are in the 24% bracket and already took $2,500 of short-term gains this year.',
      steps: [
        'You bought $20,000 of VGT in March. By November it is worth $16,000: a $4,000 loss on paper.',
        'You check every account: no VGT was bought in any account in the 30 days before the sale. You turn off dividend reinvestment on VGT and stop the automatic VGT purchase in your IRA, so none is bought in the 30 days after either.',
        'You sell all the VGT and, the same day, buy $16,000 of XLK. You still own US tech; the loss is now booked.',
        'At tax time the $4,000 loss cancels your $2,500 of short-term gains, and the remaining $1,500 comes off your salary income: 4,000 × 24% = $960 less tax.',
        'Your XLK cost basis is $16,000. You can switch back to VGT from day 31, or stay in XLK. Either way, more gain is taxed when you finally sell, unless you hold for life or donate the shares.',
      ],
      result: 'Same market exposure, $960 less federal tax this year, and no wash sale.',
    },
    mistakes: [
      'Swapping between two funds on the same index, such as VOO and IVV. It is the least defensible pair if the IRS ever asks.',
      'Forgetting the look-back. An automatic IRA purchase or reinvested dividend in the 30 days before the sale blocks part of the loss just like one after it, and in an IRA that part is gone for good.',
      'Buying the original fund back on day 29 or 30. The window runs a full 30 days after the sale.',
      'Thinking harvesting erases tax. It mostly defers it, because your new shares have a lower basis.',
    ],
    points: [
      'Sell the loser, buy a similar fund on a different index the same day, and stay invested.',
      'Same-index swaps are the gray zone; different-index swaps are common practice.',
      'Wash sales count across all your accounts, your IRA and your spouse’s purchases.',
      'Losses cancel gains, then up to $3,000 of income a year, and the rest carries forward.',
      'In the 0% bracket, harvest gains instead: sell, buy back at once, raise your basis tax-free.',
    ],
    terms: ['Tax-loss harvesting', 'Wash sale', 'Substantially identical', 'Capital loss carryforward', '0% capital gains bracket', 'Cost basis'],
    quiz: { q: 'You sell VOO at a loss. Which purchase that same day is the most common, safest swap?', options: ['IVV, which also tracks the S&P 500', 'VTI, which tracks the whole US market on a different index', 'VOO in your Roth IRA'], answer: 1, why: 'VTI follows a different index, so it is not substantially identical. IVV tracks the same index, and buying VOO in an IRA would wipe out the loss for good.' },
    sources: [SRC.bhWash, SRC.bhTlh, SRC.spym, SRC.rp2532],
  });

  SML.lessons.push({
    id: 'l-wheel-tax', course: 'wtax', order: 5, title: 'How the wheel is taxed', mins: 12, level: 'Advanced',
    summary: 'Puts, assignments, calls and rolls each follow their own tax rule. Here is every one.',
    idea: 'Option premium is taxed when the option ends, not when you collect it. Assignment folds it into the share price.',
    widget: 'wheelTaxSim',
    try: 'Pick a path and press Next step. Each step shows the cash, the tax result, the cost basis and the holding-period clock.',
    body: [
      '<p>The <a href="#l-wheel">wheel</a> looks simple: sell puts, get assigned, sell calls, get called away. The tax side is not. Every option can end three ways, assignment changes your cost basis, and covered calls can even change how long the IRS thinks you have owned your shares. Here are the rules for a regular taxable account, from IRS Publication 550.</p>',
      '<h3>Rule 1: premium is taxed when the option ends</h3><p>When you sell an option, the premium is not income yet. It waits until the option is closed. Then:</p><ul><li><b>It expires worthless:</b> the premium is a <b>short-term capital gain</b> on the expiration date, even if the option was open for months.</li><li><b>You buy it back:</b> the difference is a short-term gain or loss.</li><li><b>You are assigned:</b> the premium is folded into the stock trade (rules 2 and 3).</li></ul><p>So a put you sell in December that expires in January is taxed in <b>January’s</b> tax year, even though the cash arrived in December.</p>',
      '<h3>Rule 2: an assigned put lowers your cost basis</h3><p>If your put is assigned, you buy 100 shares at the strike. The premium is not taxed separately; it reduces the shares’ cost. Sell a $48 put for $1.20 and get assigned: your basis is $46.80 a share. The holding period of the shares starts the day after assignment.</p>',
      '<h3>Rule 3: covered calls follow the shares</h3><ul><li><b>Call expires:</b> short-term gain on the premium.</li><li><b>You buy it back:</b> short-term gain or loss.</li><li><b>You are called away:</b> the premium is added to the sale price of the shares. Whether that gain is short- or long-term depends on how long you held the <b>shares</b>, not the call.</li></ul><p>A <b>roll</b> is simply two trades: the buy-back is taxed now, the new option later.</p>',
      '<h3>Rule 4: some covered calls touch your holding period</h3><p>A <b>qualified covered call</b> is traded on an exchange, has more than 30 days to expiration and is not too deep in the money (roughly, no lower than the first strike below the share price; the exact limits depend on price and time). Then:</p><ul><li><b>Out of the money and qualified:</b> nothing changes. The holding-period clock keeps running.</li><li><b>In the money but qualified:</b> for shares held a year or less, the days the call is open do not count toward long-term. If the shares are already long-term, a loss from buying the call back is treated as long-term too.</li><li><b>Not qualified</b> (deep in the money or 30 days or less): the shares and the call form a tax <b>straddle</b>. For shares held a year or less, the holding period is wiped out and starts again when the straddle ends, and losses on one side can be deferred while you hold the other.</li></ul><p>If the shares were <b>already long-term</b> when you wrote an unqualified call, they keep their long-term status, but a loss from buying the call back becomes a long-term loss, and it is deferred while the shares still have an unrealized gain at year end. This is how a wheel trader can hold shares for 13 months and still pay short-term tax on the gain, or find a loss they cannot use yet.</p>',
      '<h3>Rule 5: wash sales apply to options too</h3><ul><li>Sell a stock at a loss and then get <b>assigned on a put</b> on the same stock within 30 days: you acquired the shares, so treat it as a wash sale.</li><li><b>Buying a call</b> on a stock you just sold at a loss also counts.</li><li>Selling a put soon after a loss sale can count too if it is likely to be exercised, such as a deep in-the-money put (Rev. Rul. 85-87). Out-of-the-money puts are the safer choice.</li><li>Brokers often miss these when the trades are in different accounts. You are still responsible.</li></ul>',
      '<h3>Rule 6: index options are different (Section 1256)</h3><p>Broad-based index options such as <b>SPX</b> and <b>XSP</b> are generally <b>Section 1256 contracts</b>. Every gain or loss is taxed <b>60% long-term and 40% short-term</b>, however long you held it, and open positions are marked to market at year end (Form 6781). They are cash-settled, so there are no shares to wheel. Options on ETFs such as <b>SPY, QQQ and IWM</b> are treated by brokers and most tax pros as ordinary equity options, not Section 1256 (the IRS has not ruled explicitly); they follow rules 1 to 5. Most states tax all of it as ordinary income anyway.</p>',
      '<h3>Why the wheel is hard to do in a taxable account</h3><ul><li>Almost everything is <b>short-term</b>, taxed at your full income tax rate plus state tax.</li><li>Dozens of small trades a year, each with its own date, basis adjustment and term.</li><li>Year-end timing splits trades across two tax years.</li><li>Your broker’s 1099-B may net premiums into basis or proceeds in ways that look odd; check it against your own records.</li><li><b>Year-end calls:</b> close a qualified covered call at a loss in December while the share gain lands in January, and you must hold the shares at least 30 days after closing the call, or the loss is deferred.</li><li><b>Dividends:</b> days your shares are covered by an in-the-money call do not count toward the holding period needed for the lower qualified-dividend rate.</li><li><b>High earners</b> also owe the 3.8% net investment income tax on wheel income once modified AGI is above $200,000 single or $250,000 married filing jointly.</li></ul><p>That is why many people run the wheel inside a Roth IRA instead: see <a href="#l-wheel-ira">the next lesson</a>. If you trade a lot in a taxable account, a CPA or enrolled agent who knows options is worth the fee.</p>',
    ],
    example: {
      title: 'One wheel across New Year',
      intro: 'Made-up stock DEMO, one contract, taxable account.',
      steps: [
        'Nov 20, 2026: sell a $50 put for $1.50 ($150). It expires Dec 18: a $150 short-term gain for 2026.',
        'Dec 21: sell a $48 put expiring Jan 15, 2027 for $1.20 ($120). The cash arrives in 2026, but nothing is taxed for 2026.',
        'Jan 15, 2027: assigned at $48. Your basis is $48 − $1.20 = $46.80 a share, or $4,680. The $120 is never taxed on its own.',
        'Sell a $50 call for $1.00 ($100), buy it back for $0.30 ($30): a $70 short-term gain in 2027. Then sell a new $50 call for $0.90 ($90).',
        'Apr 16, 2027: called away at $50. Proceeds $5,000 + $90 = $5,090, minus $4,680 basis = a $410 short-term gain.',
      ],
      result: 'You netted $630: $150 taxed in 2026 and $480 in 2027, all short-term at ordinary rates.',
    },
    mistakes: [
      'Counting premium as income in the year the cash arrived. It is taxed when the option ends, which can be the next year.',
      'Paying tax on an assigned put’s premium and also using the full strike as your basis. The premium belongs in the basis, once.',
      'Selling deep in-the-money calls on shares held under a year, which resets the holding period and turns a long-term gain short-term.',
      'Selling shares at a loss and getting assigned on a put on the same stock within 30 days. That is a wash sale.',
    ],
    points: [
      'Sold options are taxed when they expire, are bought back or are assigned, not when you collect the premium.',
      'An assigned put’s premium lowers your cost basis; a called-away call’s premium raises your sale price.',
      'Gains on the shares follow the shares’ holding period; option-only gains are short-term.',
      'In-the-money and deep in-the-money covered calls can suspend or reset that holding period.',
      'SPX and XSP options get 60/40 treatment; SPY and QQQ options do not.',
    ],
    terms: ['Covered call', 'Cash-secured put', 'Assignment', 'Cost basis', 'Holding period', 'Qualified covered call', 'Section 1256 contract'],
    glossary: [
      { t: 'Tax straddle', d: 'Holding positions that offset each other’s risk, such as shares plus a deep in-the-money call you sold. Losses can be deferred and holding periods reset.' },
      { t: 'Mark to market', d: 'Treating an open position as sold at its year-end value for tax purposes, as with Section 1256 contracts.' },
    ],
    quiz: { q: 'You sell a put in December 2026 for $200 and it expires worthless in January 2027. When is the $200 taxed?', options: ['2026, when the cash arrived', '2027, when the option expired', 'Never, because it expired'], answer: 1, why: 'Premium from a sold option is taxed when the option ends. It expired in January 2027, so it is a 2027 short-term gain.' },
    sources: [SRC.taxact, SRC.schwab, SRC.fidCc, SRC.cboe],
  });

  SML.lessons.push({
    id: 'l-wheel-ira', course: 'wtax', order: 6, title: 'Run the wheel in an IRA', mins: 9, level: 'Intermediate',
    summary: 'Same trades, no yearly tax bill. When an IRA beats a taxable account, and its traps.',
    idea: 'Wheel income is mostly short-term and taxed like salary. Inside a Roth IRA it compounds without any yearly tax bill.',
    widget: 'wheelAccounts',
    try: 'Set your starting money and return, then compare the three lines. Try the −25% year and a pricier stock.',
    body: [
      '<p>As <a href="#l-wheel-tax">the last lesson</a> showed, nearly all wheel income is <b>short-term</b>: taxed at your full income tax rate, plus state tax, every single year. Tax paid each year is money that stops compounding. Inside an IRA there is no tax on each trade at all.</p>',
      '<h3>What you can do in an IRA</h3><ul><li>Most brokers allow <b>cash-secured puts</b> and <b>covered calls</b> in IRAs, usually at their lowest options approval levels. The <a href="#l-broker">broker lesson</a> covers how to compare them.</li><li>No margin, so every put must be fully backed by cash in the account.</li><li>No naked calls, and usually no complex spreads at the basic level.</li></ul>',
      '<h3>Roth or traditional?</h3><ul><li><b>Roth IRA:</b> no tax on trades and no tax on qualified withdrawals after age 59½, once five years have passed since your first contribution to any Roth IRA. The best home for high-turnover, high-income strategies.</li><li><b>Traditional IRA:</b> no tax on trades, but every dollar you withdraw is taxed as ordinary income, and required withdrawals start in your 70s.</li><li><b>Taxable account:</b> taxed every year, but losses are deductible and money is available any time.</li></ul>',
      '<h3>The trade-offs</h3><ul><li><b>Contribution limits.</b> The 2026 IRA limit is $7,500 ($8,600 if you are 50 or older). One cash-secured put with a $75 strike ties up the whole $7,500, so a new IRA can only wheel one cheap stock. Bigger balances usually come from a <b>rollover</b> of an old 401(k).</li><li><b>Losses do not help your taxes.</b> A bad year inside an IRA is just a smaller balance. In a taxable account the same loss offsets other gains and up to $3,000 of income.</li><li><b>Access.</b> Withdrawals before 59½ generally face a 10% penalty plus tax (Roth contributions, not earnings, can come out any time).</li></ul>',
      '<h3>The IRA wash-sale trap</h3><p>Sell a stock at a loss in your taxable account, and buy it or get <b>assigned on a put</b> on it in your IRA within 30 days before or after the sale. That is a wash sale, and the IRS has ruled the loss cannot be added to the IRA shares’ basis (Rev. Rul. 2008-5). The loss is <b>gone for good</b>. Keep a simple rule: before you harvest a loss, check what your IRA bought or was assigned in the 30 days before; never wheel a stock in your IRA that you have just sold at a loss elsewhere; and never harvest a loss on a stock your IRA might buy within the next 30 days.</p>',
      '<h3>A sensible split</h3><p>Many people run the wheel in a Roth IRA and keep broad index funds in the taxable account, where most of the return is long-term and qualified dividends are taxed at lower rates. That is called <a href="#l-asset-location">asset location</a>. Whatever you do, keep a trade log; you will still want to know your real return.</p>',
    ],
    example: {
      title: '$50,000 wheel: taxable vs Roth IRA',
      intro: 'Made-up but plausible: 8% a year net of losses, 24% federal plus 5% state on short-term gains.',
      steps: [
        'In the taxable account each year’s 8% gain is short-term, so 29% goes to tax. You keep 8% × 71% = 5.68% a year.',
        'After 15 years the taxable account grows to $50,000 × 1.0568^15 ≈ $114,500.',
        'In the Roth IRA the full 8% compounds: $50,000 × 1.08^15 ≈ $158,600.',
        'The difference, about $44,100, is the tax paid along the way plus the growth that tax money never earned.',
        'In a traditional IRA the balance also reaches about $158,600, but withdrawals are taxed: at 22% you keep about $123,700, still ahead of taxable because the tax waited until the end.',
        'Catch: $50,000 is far more than one year’s IRA limit, so this works only with years of contributions or a rollover.',
      ],
      result: 'The Roth ends about 39% bigger than the taxable account with the same trades.',
    },
    mistakes: [
      'Getting assigned in an IRA on a stock you sold at a loss in your taxable account within 30 days before or after. That loss is lost for good.',
      'Wheeling a high-priced stock with a small IRA, which ties the whole account to one or two positions.',
      'Expecting to deduct a bad year in an IRA. Losses inside it never reach your tax return.',
      'Withdrawing early to fund trades elsewhere and paying a 10% penalty plus tax.',
    ],
    points: [
      'Wheel income is mostly short-term, so a taxable account loses a slice of every year’s gain to tax.',
      'In a Roth IRA the trades and qualified withdrawals are tax-free; a traditional IRA taxes withdrawals instead.',
      'IRAs allow cash-secured puts and covered calls, but no margin, and losses do not count for tax.',
      'Never let your IRA buy a stock you just sold at a loss elsewhere: the loss disappears.',
    ],
    terms: ['Roth IRA', 'Traditional IRA', 'Wash sale', 'Short-term gain', 'Cash-secured put', 'Tax drag'],
    quiz: { q: 'You sell DEMO at a $2,000 loss in your brokerage account. Ten days later a put on DEMO is assigned in your Roth IRA. What happens to the loss?', options: ['You claim it as usual', 'It is added to the IRA shares’ basis', 'It is disallowed and lost for good'], answer: 2, why: 'Buying the same stock in an IRA within 30 days is a wash sale, and the IRS has ruled the loss cannot be added to IRA basis, so it is permanently lost.' },
    sources: [SRC.kitcesIra, SRC.iraLim, SRC.schwab],
  });
})();
