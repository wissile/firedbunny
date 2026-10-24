/* Stock Market Lessons: Home & Real Estate, lessons 1-4 (fork W13): rent vs buy, mortgages, home taxes, house as an investment */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);

  /* ---------- 2026 figures (see lesson sources) ---------- */
  const STD = { Single: 16100, Married: 32200 };     // 2026 standard deduction
  const SALT_CAP = 40400;                             // 2026 SALT cap (phases down above $505,000 MAGI)
  const EXCL = { Single: 250000, Married: 500000 };   // Section 121 home-sale exclusion
  const MID_LIMIT = 750000;                           // mortgage interest deduction: acquisition debt limit

  SML.css(`
.wh-more{padding:0}
.wh-more > summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.wh-more > summary::-webkit-details-marker{display:none}
.wh-more > summary:hover{color:var(--ink)}
.wh-more > summary .wh-chev{transition:transform .15s;font-size:14px;color:var(--accent)}
.wh-more[open] > summary .wh-chev{transform:rotate(90deg)}
.wh-more > .wg-ctrl{border-top:1px solid var(--line)}
.wh-more .wh-row{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center}
.wh-more .wh-row .ctl-lab{flex:0 0 auto}
.wh-rules{display:grid;gap:1px;background:var(--line);grid-template-columns:1fr}
@media(min-width:640px){.wh-rules{grid-template-columns:repeat(3,minmax(0,1fr))}}
.wh-rule{background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:7px;min-width:0}
.wh-rule .k{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.wh-rule .v{font-family:var(--display);font-size:28px;line-height:.95;color:var(--ink)}
.wh-rule .v small{font-family:var(--mono);font-size:12px;color:var(--muted);margin-left:6px;letter-spacing:.04em}
.wh-rule p{font-size:13.5px;line-height:1.45;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.wh-rule .lean{font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.12em}
.wh-rule .lean.buy{color:var(--accent)} .wh-rule .lean.rent{color:var(--info)} .wh-rule .lean.mid{color:var(--muted)}
.wh-bars{display:flex;flex-direction:column;gap:5px}
.wh-bars span{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:8px;align-items:center;font:500 11.5px var(--mono);color:var(--muted)}
.wh-bars i{display:block;height:8px;border-radius:4px;background:var(--accent);min-width:2px}
.wh-bars i.rent{background:var(--info)}
.wh-bars b{color:var(--ink);font-weight:600}
.wh-modebar{justify-content:space-between}
.wh-grp[hidden]{display:none!important}
.wh-seglab{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.wh-segrow{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;grid-column:1/-1}
`);

  /* ---------- helpers ---------- */
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setL = (x, t) => { const el = $id(x); if (el && el.previousElementSibling) el.previousElementSibling.textContent = t; };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 1 : 2) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e4 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const pctf = (v, d) => trim(v, d == null ? 2 : d) + '%';
  const usd = F.usd0;
  const yrsMo = (m) => { m = Math.round(m); const y = Math.floor(m / 12), r = m % 12; return y + ' yr' + (r ? ' ' + r + ' mo' : ''); };
  function pmt(P, ratePct, years) { const n = Math.round(years * 12), i = ratePct / 1200; if (P <= 0) return 0; if (i === 0) return P / n; return (P * i) / (1 - Math.pow(1 + i, -n)); }
  function tipper(fig) {
    let tip = null;
    return {
      show(x, y, html, W) {
        if (!tip || !fig.contains(tip)) { tip = document.createElement('div'); tip.className = 'wg-tip'; fig.appendChild(tip); }
        tip.hidden = false; tip.innerHTML = html;
        const tw = tip.offsetWidth; let left = 14 + x + 14; if (left + tw > 14 + W) left = 14 + x - 14 - tw;
        tip.style.left = Math.max(4, left) + 'px'; tip.style.top = Math.max(4, 14 + y - 30) + 'px';
      },
      hide() { if (tip) tip.hidden = true; },
    };
  }
  /* yearly amortization. returns {pay, months, rows:[{y,int,prin,bal,pmi}], totInt, pmiEnd(month)} */
  function amortize(loan, rate, years, extra, o) {
    o = o || {};
    const pay = pmt(loan, rate, years), i = rate / 1200; let bal = loan, m = 0, totInt = 0, pmiEnd = null;
    const rows = []; let yi = 0, yp = 0, ypmi = 0;
    const pmiLine = o.pmiLine || 0, pmiM = o.pmiM || 0;
    while (bal > 0.005 && m < years * 12 + 1) {
      m++;
      const int = bal * i; let prin = Math.min(bal, pay - int + (extra || 0));
      if (pmiM && bal > pmiLine) ypmi += pmiM; else if (pmiM && pmiEnd == null) pmiEnd = m;
      bal -= prin; yi += int; yp += prin; totInt += int;
      if (m % 12 === 0 || bal <= 0.005) { rows.push({ y: Math.ceil(m / 12), int: yi, prin: yp, bal: Math.max(0, bal), pmi: ypmi }); yi = 0; yp = 0; ypmi = 0; }
    }
    if (pmiM && pmiEnd == null) pmiEnd = m;
    return { pay, months: m, rows, totInt, pmiEnd };
  }
  const moreBox = (title, inner) => `<details class="wh-more"><summary><span>${title}</span><span class="wh-chev" aria-hidden="true">›</span></summary><div class="wg-ctrl">${inner}</div></details>`;
  const sl = (id, label, min, max, step, value, fmt) => ui.slider({ id, label, min, max, step, value, fmt });
  const fPct = (d) => (v) => trim(v, d == null ? 2 : d) + '%';

  /* ======================================================================
     1. rentVsBuy ★ : net worth of buying vs renting and investing
     ====================================================================== */
  const RB_PRESETS = {
    typical: { label: 'Typical US home', price: 420000, down: 20, rate: 7.4, stay: 10, rent: 2100, g: 3.5, r: 6, rg: 3, ptax: 1, ins: 0.5, maint: 1, hoa: 0, buy: 3, sell: 7, pmi: 0.5, state: 6000 },
    city: { label: 'High-cost city', price: 1100000, down: 20, rate: 6.5, stay: 10, rent: 4200, g: 3.5, r: 6, rg: 3, ptax: 1.2, ins: 0.35, maint: 1, hoa: 450, buy: 3, sell: 7, pmi: 0.5, state: 22000 },
    town: { label: 'Low-cost town', price: 260000, down: 20, rate: 7.4, stay: 10, rent: 1700, g: 3, r: 6, rg: 3, ptax: 1.4, ins: 0.7, maint: 1, hoa: 0, buy: 3, sell: 7, pmi: 0.5, state: 3500 },
    low: { label: 'Rates drop to 5%', price: 420000, down: 20, rate: 5, stay: 10, rent: 2100, g: 3.5, r: 6, rg: 3, ptax: 1, ins: 0.5, maint: 1, hoa: 0, buy: 3, sell: 7, pmi: 0.5, state: 6000 },
  };

  function rbModel(p) {
    const loan = p.price * (1 - p.down / 100), D = p.price * p.down / 100, C = p.price * p.buy / 100;
    const term = p.term, pay = pmt(loan, p.rate, term), mi = p.rate / 1200, r = p.r / 100, g = p.g / 100;
    const gm = Math.pow(1 + g, 1 / 12), rm = 1 + r / 12;
    const pmiM = p.down < 20 ? (p.pmi / 100) * loan / 12 : 0;
    const std = STD[p.filing] || STD.Married, excl = EXCL[p.filing] || EXCL.Married;
    const dedFrac = loan > MID_LIMIT ? MID_LIMIT / loan : 1;
    let bal = loan, val = p.price, rentM = p.rent, pR = D + C, bR = pR, pB = 0, bB = 0, m = 0;
    const nwB = [], nwR = [], yr1 = {};
    const liq = (val0, bal0, pB0, bB0, pR0, bR0) => {
      const net = val0 * (1 - p.sell / 100); const gain = net - p.price * (1 + p.buy / 100);
      const homeTax = Math.max(0, gain - excl) * 0.15;
      return [net - bal0 - homeTax + pB0 - Math.max(0, pB0 - bB0) * 0.15, pR0 - Math.max(0, pR0 - bR0) * 0.15];
    };
    let z = liq(val, bal, pB, bB, pR, bR); nwB.push(z[0]); nwR.push(z[1]);
    for (let y = 0; y < 30; y++) {
      const ptaxY = val * p.ptax / 100, insY = val * p.ins / 100, maintY = val * p.maint / 100;
      let intY = 0, pmiY = 0, ownY = 0, rentY = 0;
      for (let k = 0; k < 12; k++) {
        m++;
        let payM = 0;
        if (bal > 0.005) { const int = bal * mi; const prin = Math.min(bal, pay - int); payM = int + prin; bal -= prin; intY += int; }
        const pm = pmiM && bal > 0.78 * p.price ? pmiM : 0; pmiY += pm;
        const own = payM + (ptaxY + insY + maintY) / 12 + p.hoa + pm;
        ownY += own; rentY += rentM;
        pR *= rm; pB *= rm;
        const d = own - rentM;
        if (d > 0) { pR += d; bR += d; } else { pB -= d; bB -= d; }
        val *= gm;
      }
      // tax refund from itemizing, received at year end and invested by the owner
      let ben = 0;
      if (p.taxOn) {
        const base = Math.max(std, Math.min(SALT_CAP, p.state));
        const withHome = Math.max(std, intY * dedFrac + Math.min(SALT_CAP, p.state + ptaxY));
        ben = Math.max(0, withHome - base) * p.bracket / 100;
        pB += ben; bB += ben;
      }
      if (y === 0) Object.assign(yr1, { int: intY, ptax: ptaxY, ins: insY, maint: maintY, hoa: p.hoa * 12, pmi: pmiY, ben, own: ownY, rent: rentY });
      rentM *= 1 + p.rg / 100;
      z = liq(val, bal, pB, bB, pR, bR); nwB.push(z[0]); nwR.push(z[1]);
    }
    let be = null; for (let t = 1; t <= 30; t++) if (nwB[t] >= nwR[t]) { be = t; break; }
    // year-1 "unrecoverable" cost of owning (after expected price growth and the return the cash gives up)
    const unrec = (yr1.int + yr1.ptax + yr1.ins + yr1.maint + yr1.hoa + yr1.pmi - yr1.ben + (D + C) * r - p.price * g) / 12;
    return { loan, D, C, pay, nwB, nwR, be, yr1, unrec, payUp: pmt(loan, p.rate + 1, term), payDn: pmt(loan, Math.max(0, p.rate - 1), term) };
  }
  SML.widgets.rentVsBuy = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('rb');
    const P0 = RB_PRESETS[opts.preset] || RB_PRESETS.typical;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-pre', Object.keys(RB_PRESETS).map((k) => ({ v: k, label: RB_PRESETS[k].label })), opts.preset || 'typical', 'Example')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${sl(id + '-price', 'Home price', 50000, 2500000, 5000, P0.price, 'usd0')}
        ${sl(id + '-down', 'Down payment', 3, 50, 1, P0.down, 'pct')}
        ${sl(id + '-rate', 'Mortgage rate', 2, 10, 0.05, P0.rate, fPct(2))}
        ${sl(id + '-rent', 'Rent for a similar home', 500, 12000, 50, P0.rent, (v) => usd(v) + '/mo')}
        ${sl(id + '-g', 'Home price growth', -2, 8, 0.25, P0.g, (v) => trim(v, 2) + '%/yr')}
        ${sl(id + '-r', 'Investment return', 0, 12, 0.25, P0.r, (v) => trim(v, 2) + '%/yr')}
        ${sl(id + '-stay', 'Years you stay', 1, 30, 1, P0.stay, 'yrs')}
      </div>
      ${moreBox('More assumptions: costs, taxes, rent growth', `
        <div class="wh-row"><span class="ctl-lab">Loan term</span>${ui.seg(id + '-term', [{ v: 30, label: '30 years' }, { v: 15, label: '15 years' }], 30, 'Loan term')}<span class="ctl-lab">Filing</span>${ui.seg(id + '-fil', ['Single', 'Married'], 'Married', 'Filing status')}</div>
        ${sl(id + '-rg', 'Rent growth', 0, 8, 0.25, P0.rg, (v) => trim(v, 2) + '%/yr')}
        ${sl(id + '-ptax', 'Property tax', 0.2, 3, 0.05, P0.ptax, (v) => trim(v, 2) + '% of value')}
        ${sl(id + '-ins', 'Home insurance', 0.1, 2, 0.05, P0.ins, (v) => trim(v, 2) + '% of value')}
        ${sl(id + '-maint', 'Maintenance', 0, 3, 0.25, P0.maint, (v) => trim(v, 2) + '% of value')}
        ${sl(id + '-hoa', 'HOA dues', 0, 1500, 25, P0.hoa, (v) => usd(v) + '/mo')}
        ${sl(id + '-buy', 'Buying costs', 0, 6, 0.25, P0.buy, (v) => trim(v, 2) + '% of price')}
        ${sl(id + '-sell', 'Selling costs', 0, 10, 0.25, P0.sell, (v) => trim(v, 2) + '% of price')}
        ${sl(id + '-pmi', 'PMI quote if under 20% down', 0, 1.5, 0.05, P0.pmi, (v) => trim(v, 2) + '% of loan')}
        <div class="wh-row">${ui.chips(id + '-tax', [{ k: 'on', label: 'Count the mortgage interest deduction', color: 'var(--accent)', on: true }])}<span class="ctl-lab">Tax bracket</span>${ui.seg(id + '-br', [12, 22, 24, 32, 35, 37].map((v) => ({ v, label: v + '%' })), 22, 'Tax bracket')}</div>
        ${sl(id + '-state', 'State and local income tax you pay', 0, 60000, 500, P0.state, (v) => usd(v) + '/yr')}`)}
      <div class="wg-read">${ui.stat('Buying, net worth', id + '-nb')}${ui.stat('Renting, net worth', id + '-nr')}${ui.stat('Ahead', id + '-gap', 'hl big')}${ui.stat('Break-even', id + '-be')}</div>
      <div class="wh-rules" id="${id}-rules"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g btn-sm" id="${id}-reset">Reset</button></div>
      <div class="wg-note">Drag the handle under the chart (or tap the chart) to pick the year you sell. Both paths spend the same each month: whoever pays less invests the difference. Net worth is what you would walk away with after selling the home, paying selling costs and paying 15% tax on investment gains (home gains are tax-free up to the Section 121 exclusion). Simplified model, not advice.</div>`;
    const fig = root.querySelector('.wg-fig'); const tip = tipper(fig);
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && e.target.closest('#' + id + '-pre')) applyPreset(st.seg(id + '-pre')); draw(); });
    let G = null;
    const KEYS = ['price', 'down', 'rate', 'rent', 'g', 'r', 'stay', 'rg', 'ptax', 'ins', 'maint', 'hoa', 'buy', 'sell', 'pmi', 'state'];
    function applyPreset(k) { const p = RB_PRESETS[k] || RB_PRESETS.typical; KEYS.forEach((key) => st.set(id + '-' + key, p[key])); }
    $id(id + '-reset').addEventListener('click', () => { st.setSeg(id + '-pre', 'typical'); applyPreset('typical'); st.setSeg(id + '-term', 30); st.setSeg(id + '-fil', 'Married'); st.setSeg(id + '-br', 22); const c = root.querySelector('#' + id + '-tax .chip'); if (c && !c.classList.contains('on')) { c.classList.add('on'); c.setAttribute('aria-pressed', 'true'); } draw(); });
    function read() {
      const o = {}; KEYS.forEach((k) => (o[k] = st.n(id + '-' + k)));
      o.term = Number(st.seg(id + '-term')) || 30; o.filing = st.seg(id + '-fil') || 'Married'; o.bracket = Number(st.seg(id + '-br')) || 22; o.taxOn = st.on(id + '-tax', 'on');
      return o;
    }
    function setStay(v) { v = SML.clamp(Math.round(v), 1, 30); if (v !== st.n(id + '-stay')) { st.set(id + '-stay', v); draw(); } }
    ui.drag(fig, { sel: '.wh-drag', start(pt) { if (G) setStay(G.x.inv(pt.x)); }, move(pt) { if (G) setStay(G.x.inv(pt.x)); } });
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4 || p.y > G.H - G.pb + 4) { hide(); return; }
      const t = Math.round(SML.clamp(G.x.inv(p.x), 0, 30));
      const hov = svg.querySelector('[data-hov]');
      if (hov) hov.innerHTML = S.line(G.x(t), G.pt, G.x(t), G.H - G.pb, 's-ink dash2') + S.circle(G.x(t), G.y(G.m.nwB[t]), 4.5, 'f-acc') + S.circle(G.x(t), G.y(G.m.nwR[t]), 4.5, 'f-info');
      const d = G.m.nwB[t] - G.m.nwR[t];
      tip.show(G.x(t), Math.min(G.y(G.m.nwB[t]), G.y(G.m.nwR[t])), `Sell in year ${t}<br><span class="acc">Buy ${usd(G.m.nwB[t])}</span><br><span class="info">Rent ${usd(G.m.nwR[t])}</span><br>${d >= 0 ? 'Buying' : 'Renting'} +${usd(Math.abs(d))}`, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);

    const draw = ui.responsive(fig, (W) => {
      const p = read(); const m = rbModel(p); const stay = p.stay;
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.5, 260, 360));
      const pl = compact ? 46 : 60, pr = compact ? 12 : 18, pt = 52, pb = 46;
      const all = m.nwB.concat(m.nwR);
      let lo = Math.min(0, ...all), hi = Math.max(...all, 1);
      const pad = (hi - lo) * 0.08; lo -= lo < 0 ? pad : 0; hi += pad;
      const x = SML.lin(0, 30, pl, W - pr), y = SML.lin(lo, hi, H - pb, pt);
      let b = '';
      SML.ticks(lo, hi, compact ? 4 : 5).forEach((v) => { if (y(v) < pt - 4 || y(v) > H - pb + 1) return; b += S.line(pl, y(v), W - pr, y(v), v === 0 ? 's-mut' : 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      [0, 5, 10, 15, 20, 25, 30].filter((v) => !compact || v % 10 === 0).forEach((v) => (b += S.text(x(v), H - pb + 16, v === 0 ? 'now' : 'yr ' + v, 'xs mono', 'middle')));
      // shaded gap between the lines
      for (let t = 0; t < 30; t++) {
        const d0 = m.nwB[t] - m.nwR[t], d1 = m.nwB[t + 1] - m.nwR[t + 1];
        const A = [x(t), y(m.nwB[t])], B = [x(t + 1), y(m.nwB[t + 1])], Cc = [x(t + 1), y(m.nwR[t + 1])], Dd = [x(t), y(m.nwR[t])];
        if ((d0 >= 0) === (d1 >= 0)) b += S.polygon([A, B, Cc, Dd], d0 >= 0 ? 'f-acc-t' : 'f-info-t');
        else {
          const f = d0 / (d0 - d1); const xm = x(t + f), ym = y(m.nwB[t] + f * (m.nwB[t + 1] - m.nwB[t]));
          b += S.polygon([A, [xm, ym], Dd], d0 >= 0 ? 'f-acc-t' : 'f-info-t') + S.polygon([[xm, ym], B, Cc], d1 >= 0 ? 'f-acc-t' : 'f-info-t');
        }
      }
      b += S.poly(m.nwR.map((v, i) => [x(i), y(v)]), 's-info w25') + S.poly(m.nwB.map((v, i) => [x(i), y(v)]), 's-acc w25');
      // break-even marker
      if (m.be) {
        const t = m.be, d0 = m.nwB[t - 1] - m.nwR[t - 1], d1 = m.nwB[t] - m.nwR[t]; const f = d0 === d1 ? 0 : SML.clamp(d0 / (d0 - d1), 0, 1);
        const xb = x(t - 1 + f), yb = y(m.nwB[t - 1] + f * (m.nwB[t] - m.nwB[t - 1]));
        b += S.circle(xb, yb, 5.5, 'f-bg s-ink w2');
        const lab = 'break-even yr ' + t; const right = xb < W * 0.6;
        b += S.text(xb + (right ? 9 : -9), yb + 18, lab, 'sm ink b', right ? 'start' : 'end');
      }
      // stay marker + handle
      const xs = x(stay);
      b += S.line(xs, pt - 10, xs, H - pb, 's-ink w15 dash');
      const lab = 'You sell: year ' + stay; const lw = lab.length * 6.6;
      const lx = SML.clamp(xs, pl + lw / 2, W - pr - lw / 2);
      b += S.text(lx, pt - 16, lab, 'sm ink b', 'middle');
      b += S.circle(xs, y(m.nwB[stay]), 5, 'f-acc') + S.circle(xs, y(m.nwR[stay]), 5, 'f-info');
      b += S.rect(pl, pt - 6, W - pr - pl, H - pb - pt + 6, 'hit wh-drag');
      b += S.rect(xs - 9, H - pb + 22, 18, 16, 'handle wh-drag grab', 4) + S.line(xs - 3, H - pb + 26, xs - 3, H - pb + 34, 's-acc w15') + S.line(xs + 3, H - pb + 26, xs + 3, H - pb + 34, 's-acc w15');
      // legend
      const ly = 14;
      b += S.line(pl, ly, pl + 18, ly, 's-acc w3') + S.text(pl + 24, ly + 4, 'Buy', 'sm ink b');
      b += S.line(pl + 64, ly, pl + 82, ly, 's-info w3') + S.text(pl + 88, ly + 4, compact ? 'Rent + invest' : 'Rent and invest the difference', 'sm ink b');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Net worth from buying versus renting over 30 years. Selling in year ${stay}: buying ${usd(m.nwB[stay])}, renting ${usd(m.nwR[stay])}.`, b, 'drag');
      G = { W, H, pl, pr, pt, pb, x, y, m };

      // stats
      const nb = m.nwB[stay], nr = m.nwR[stay], gap = nb - nr;
      setT(id + '-nb', usd(nb), 'acc'); setT(id + '-nr', usd(nr), 'info');
      setL(id + '-gap', gap >= 0 ? 'Buying ahead by' : 'Renting ahead by');
      setT(id + '-gap', usd(Math.abs(gap)));
      setT(id + '-be', m.be ? 'Year ' + m.be : 'None in 30 yrs');
      // rules of thumb
      const pr2 = p.price / (12 * p.rent);
      const leanPR = pr2 < 15 ? ['buy', 'Leans buy'] : pr2 <= 20 ? ['mid', 'Could go either way'] : ['rent', 'Leans rent'];
      const fiveRent = p.price * 0.05 / 12;
      const leanFive = p.rent > fiveRent * 1.05 ? ['buy', 'Leans buy'] : p.rent < fiveRent * 0.95 ? ['rent', 'Leans rent'] : ['mid', 'Close call'];
      const own = Math.max(0, m.unrec), rentM = p.rent; const mx = Math.max(own, rentM, 1);
      const leanU = own < rentM * 0.95 ? ['buy', 'Owning costs less'] : own > rentM * 1.05 ? ['rent', 'Renting costs less'] : ['mid', 'About even'];
      $id(id + '-rules').innerHTML = `
        <div class="wh-rule"><span class="k">Price-to-rent ratio</span><span class="v">${trim(pr2, 1)}<small>price ÷ yearly rent</small></span><span class="lean ${leanPR[0]}">${leanPR[1]}</span><p>Under 15 tends to favor buying, over 20 favors renting.</p></div>
        <div class="wh-rule"><span class="k">The 5% rule</span><span class="v">${usd(fiveRent)}<small>/mo</small></span><span class="lean ${leanFive[0]}">${leanFive[1]}</span><p>Owning costs about 5% of the price a year. Rent below ${usd(fiveRent)} a month leans rent.</p></div>
        <div class="wh-rule"><span class="k">Money you don’t get back, year 1</span><div class="wh-bars"><span>Own<i style="width:${(own / mx) * 100}%"></i><b>${usd(own)}</b></span><span>Rent<i class="rent" style="width:${(rentM / mx) * 100}%"></i><b>${usd(rentM)}</b></span></div><span class="lean ${leanU[0]}">${leanU[1]}</span><p>Owning: interest, tax, insurance, upkeep${p.hoa ? ', HOA' : ''}${m.yr1.pmi ? ', PMI' : ''} and the return your cash gives up, minus expected price growth.</p></div>`;
      // coach
      const swing = Math.round(m.payUp - m.pay);
      const costs = p.price * (p.buy + p.sell) / 100;
      let msg;
      if (gap >= 0) msg = ui.msg('acc', 'Buy', `Selling in year ${stay}, buying leaves you about <b>${usd(gap)}</b> ahead. ${m.be ? `The break-even is year ${m.be}: sell earlier and about ${usd(costs)} of buying and selling costs eats the gain.` : ''} Each 1-point change in the rate moves the payment by about ${usd(swing)} a month.`);
      else msg = ui.msg('info', 'Rent', `Selling in year ${stay}, renting and investing the difference leaves you about <b>${usd(-gap)}</b> ahead. ${m.be ? `Buying catches up in year ${m.be}.` : 'At these numbers buying does not catch up within 30 years.'} Renting only wins if you really invest the difference. Each 1-point change in the rate moves the payment by about ${usd(swing)} a month.`);
      $id(id + '-msg').innerHTML = msg;
    });
  };

  /* ======================================================================
     2. mortgageCalc ★ : payment, amortization, 15 vs 30, refinance
     ====================================================================== */
  SML.widgets.mortgageCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('mc');
    root.innerHTML = `
      <div class="wg-bar wh-modebar">${ui.seg(id + '-mode', [{ v: 'pay', label: 'Payoff' }, { v: 'cmp', label: '15 vs 30 years' }, { v: 'refi', label: 'Refinance' }], opts.mode || 'pay', 'View')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl wh-grp" data-g="pay cmp">
        ${sl(id + '-price', 'Home price', 50000, 2000000, 5000, 420000, 'usd0')}
        ${sl(id + '-down', 'Down payment', 3, 50, 1, 20, 'pct')}
        ${sl(id + '-rate', 'Rate (30-year)', 2, 10, 0.01, 7.4, fPct(2))}
      </div>
      <div class="wg-ctrl wh-grp" data-g="pay">
        <div class="wh-segrow"><span class="wh-seglab">Term</span>${ui.seg(id + '-term', [10, 15, 20, 30].map((v) => ({ v, label: v + ' yr' })), 30, 'Loan term')}</div>
        ${sl(id + '-pts', 'Points bought', 0, 3, 0.25, 0, (v) => trim(v, 2) + (Number(v) === 1 ? ' point' : ' points'))}
        ${sl(id + '-extra', 'Extra each month', 0, 2000, 25, 0, 'usd0')}
      </div>
      ${moreBox('Taxes, insurance and PMI', `
        ${sl(id + '-ptax', 'Property tax', 0.2, 3, 0.05, 1, (v) => trim(v, 2) + '% of price')}
        ${sl(id + '-ins', 'Home insurance', 300, 8000, 50, 2100, (v) => usd(v) + '/yr')}
        ${sl(id + '-pmi', 'PMI quote if under 20% down', 0.1, 1.5, 0.05, 0.5, (v) => trim(v, 2) + '% of loan/yr')}
        ${sl(id + '-ppt', 'Rate cut per point', 0.125, 0.375, 0.125, 0.25, (v) => trim(v, 3) + '%')}`).replace('class="wh-more"', `class="wh-more wh-grp" data-g="pay"`)}
      <div class="wg-ctrl wh-grp" data-g="cmp">
        ${sl(id + '-r15', 'Rate (15-year)', 2, 10, 0.01, 6.71, fPct(2))}
        ${sl(id + '-inv', 'Return if you invest the difference', 0, 12, 0.25, 6, (v) => trim(v, 2) + '%/yr')}
      </div>
      <div class="wg-ctrl wh-grp" data-g="refi">
        ${sl(id + '-rbal', 'Loan balance today', 20000, 1500000, 5000, 380000, 'usd0')}
        ${sl(id + '-rold', 'Current rate', 2, 10, 0.01, 7.8, fPct(2))}
        ${sl(id + '-rleft', 'Years left on the loan', 1, 30, 1, 27, 'yrs')}
        ${sl(id + '-rnew', 'New rate', 2, 10, 0.01, 6.5, fPct(2))}
        ${sl(id + '-rcost', 'Closing costs', 0, 6, 0.25, 2, (v) => trim(v, 2) + '% of loan')}
        <div class="wh-segrow"><span class="wh-seglab">New term</span>${ui.seg(id + '-rterm', [15, 20, 30].map((v) => ({ v, label: v + ' yr' })), 30, 'New term')}</div>
      </div>
      <div class="wg-read">${ui.stat('Monthly payment', id + '-a', 'hl big')}${ui.stat('—', id + '-b')}${ui.stat('—', id + '-c')}${ui.stat('—', id + '-d')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig'); const tip = tipper(fig);
    const st = ui.wire(root, () => draw());
    let G = null;
    function showGroups() { const mode = st.seg(id + '-mode'); root.querySelectorAll('.wh-grp').forEach((g) => { g.hidden = g.dataset.g.split(' ').indexOf(mode) < 0; }); }
    fig.addEventListener('pointermove', (e) => {
      if (!G || !G.hover) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      const r = G.hover(p); if (!r) { hide(); return; }
      const hov = svg.querySelector('[data-hov]'); if (hov) hov.innerHTML = r.svg; tip.show(r.x, r.y, r.html, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);

    function drawPay(W, compact) {
      const price = st.n(id + '-price'), down = st.n(id + '-down'), base = st.n(id + '-rate'), term = Number(st.seg(id + '-term')) || 30;
      const pts = st.n(id + '-pts'), extra = st.n(id + '-extra'), ppt = st.n(id + '-ppt');
      const rate = Math.max(0.5, base - pts * ppt);
      const loan = price * (1 - down / 100);
      const pmiM = down < 20 ? (st.n(id + '-pmi') / 100) * loan / 12 : 0;
      const A = amortize(loan, rate, term, 0, { pmiLine: 0.78 * price, pmiM });
      const X = amortize(loan, rate, term, extra, { pmiLine: 0.78 * price, pmiM });
      const taxM = price * st.n(id + '-ptax') / 100 / 12, insM = st.n(id + '-ins') / 12;
      const H = Math.round(SML.clamp(W * 0.6, 300, 420));
      const pl = compact ? 46 : 58, pr = 14, pt = 30, gap = 34, pb = 26;
      const h1 = (H - pt - pb - gap) * 0.55, h2 = (H - pt - pb - gap) * 0.45;
      const y1b = pt + h1, y2t = y1b + gap, y2b = y2t + h2;
      const x = SML.lin(0, term, pl, W - pr);
      const yB = SML.lin(0, loan * 1.04, y1b, pt);
      let b = '';
      SML.ticks(0, loan, 3).forEach((v) => { if (yB(v) < pt - 2) return; b += S.line(pl, yB(v), W - pr, yB(v), 's-grid') + S.text(pl - 6, yB(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const balPts = (rows) => [[x(0), yB(loan)]].concat(rows.map((r) => [x(r.y), yB(r.bal)]));
      if (extra > 0) b += S.poly(balPts(A.rows), 's-mut w15 dash');
      b += S.area(balPts(X.rows), y1b, 'f-info-t') + S.poly(balPts(X.rows), 's-info w25');
      b += S.text(pl, pt - 12, 'Loan balance', 'sm ink b');
      if (extra > 0) b += S.text(W - pr, pt - 12, 'dashed: no extra payments', 'xs mut', 'end');
      // PMI marker
      if (pmiM && X.pmiEnd) { const yy = X.pmiEnd / 12; const xp = x(Math.min(term, yy)); const rt = xp > W * 0.7; b += S.line(xp, pt, xp, y1b, 's-vio dash2') + S.text(rt ? xp - 5 : xp + 5, pt + 14, 'PMI ends yr ' + trim(yy, 1), 'sm vio b', rt ? 'end' : 'start'); }
      if (extra > 0 && X.months < A.months) { const xe = x(X.months / 12); b += S.circle(xe, y1b, 5, 'f-up') + S.text(xe, y1b - 10, 'paid off ' + yrsMo(X.months), 'sm up b', xe > W * 0.75 ? 'end' : 'middle'); }
      // yearly split bars
      const maxY = Math.max(...X.rows.map((r) => r.int + r.prin), 1);
      const yS = SML.lin(0, maxY * 1.05, y2b, y2t);
      const bw = Math.max(2, ((W - pl - pr) / term) * 0.7);
      X.rows.forEach((r) => { const cx = x(r.y - 0.5); b += S.rect(cx - bw / 2, yS(r.int), bw, y2b - yS(r.int), 'f-dn', 1) + S.rect(cx - bw / 2, yS(r.int + r.prin), bw, yS(r.int) - yS(r.int + r.prin), 'f-up', 1); });
      b += S.line(pl, y2b, W - pr, y2b, 's-mut');
      b += S.text(pl - 6, yS(maxY) + 4, kfmt(maxY), 'xs mono', 'end') + S.text(pl - 6, y2b, '$0', 'xs mono', 'end');
      b += S.rect(pl, y2t - 20, 10, 10, 'f-dn', 2) + S.text(pl + 15, y2t - 11, 'interest', 'sm ink') + S.rect(pl + 82, y2t - 20, 10, 10, 'f-up', 2) + S.text(pl + 97, y2t - 11, 'principal, each year', 'sm ink');
      const step = term <= 15 ? 5 : compact ? 10 : 5;
      for (let v = 0; v <= term; v += step) b += S.text(x(v), H - 6, v === 0 ? 'start' : 'yr ' + v, 'xs mono', 'middle');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Loan balance and yearly interest versus principal over ${term} years`, b);
      G = { W, hover(p) { if (p.x < pl || p.x > W - pr) return null; const yr = SML.clamp(Math.ceil(x.inv(p.x)), 1, X.rows.length); const r = X.rows[yr - 1]; if (!r) return null; const cx = x(r.y - 0.5); return { x: cx, y: yS(r.int + r.prin), svg: S.rect(cx - bw / 2 - 2, y2t, bw + 4, h2, 'nf s-ink w15', 2) + S.circle(x(r.y), yB(r.bal), 4.5, 'f-info'), html: `Year ${r.y}<br><span class="dn">Interest ${usd(r.int)}</span><br><span class="up">Principal ${usd(r.prin)}</span><br>Balance ${usd(r.bal)}` }; } };
      const pitiM = X.pay + taxM + insM + pmiM;
      setL(id + '-a', 'Principal + interest'); setT(id + '-a', usd(X.pay), '');
      setL(id + '-b', 'With tax, insurance' + (pmiM ? ', PMI' : '')); setT(id + '-b', usd(pitiM), '');
      setL(id + '-c', 'Total interest'); setT(id + '-c', usd(X.totInt), 'dn');
      setL(id + '-d', extra > 0 ? 'Paid off in' : 'Loan amount'); setT(id + '-d', extra > 0 ? yrsMo(X.months) : usd(loan), extra > 0 ? 'up' : '');
      const parts = [];
      const y1 = X.rows[0]; parts.push(`In year 1, <b>${usd(y1.int)}</b> of your ${usd(y1.int + y1.prin)} in payments is interest (${Math.round((y1.int / (y1.int + y1.prin)) * 100)}%).`);
      if (extra > 0) parts.push(`Adding ${usd(extra)} a month saves <b>${usd(A.totInt - X.totInt)}</b> of interest and ends the loan ${yrsMo(A.months - X.months)} early.`);
      if (pts > 0) { const cost = loan * pts / 100; const save = pmt(loan, base, term) - X.pay; parts.push(`${trim(pts, 2)} point${pts === 1 ? '' : 's'} cost ${usd(cost)} up front and save ${usd(save)} a month: break-even after ${save > 0 ? yrsMo(cost / save) : 'never'}.`); }
      if (pmiM) parts.push(`PMI adds ${usd(pmiM)} a month until the balance falls to 78% of the price.`);
      setMsg(id + '-msg', extra > 0 ? 'up' : 'acc', 'Payoff', parts.join(' '));
      $id(id + '-note').textContent = 'Points are assumed to cut the rate by the amount in “Taxes, insurance and PMI”; lenders vary. PMI uses the original price as the home value. Hover the chart for any year.';
    }

    function drawCmp(W, compact) {
      const price = st.n(id + '-price'), down = st.n(id + '-down'), r30 = st.n(id + '-rate'), r15 = st.n(id + '-r15'), inv = st.n(id + '-inv') / 100;
      const loan = price * (1 - down / 100);
      const p30 = pmt(loan, r30, 30), p15 = pmt(loan, r15, 15), A30 = amortize(loan, r30, 30, 0), A15 = amortize(loan, r15, 15, 0);
      // equal outflow p15 each month for 30 years. 30-yr path invests p15 - p30; 15-yr path invests p15 after payoff
      const rm = 1 + inv / 12; const n30 = [], n15 = []; let i30 = 0, i15 = 0, b30 = loan, b15 = loan;
      n30.push(-loan); n15.push(-loan);
      for (let mth = 1; mth <= 360; mth++) {
        i30 *= rm; i15 *= rm;
        if (b30 > 0.005) { const int = b30 * r30 / 1200; b30 -= Math.min(b30, p30 - int); i30 += p15 - p30; } else i30 += p15;
        if (b15 > 0.005) { const int = b15 * r15 / 1200; b15 -= Math.min(b15, p15 - int); } else i15 += p15;
        if (mth % 12 === 0) { n30.push(i30 - Math.max(0, b30)); n15.push(i15 - Math.max(0, b15)); }
      }
      const H = Math.round(SML.clamp(W * 0.5, 260, 360));
      const pl = compact ? 50 : 60, pr = 14, pt = 34, pb = 28;
      const lo = Math.min(...n30, ...n15), hi = Math.max(...n30, ...n15, 0) * 1.06;
      const x = SML.lin(0, 30, pl, W - pr), y = SML.lin(lo, hi, H - pb, pt);
      let b = '';
      SML.ticks(lo, hi, 5).forEach((v) => { if (y(v) < pt - 4 || y(v) > H - pb + 1) return; b += S.line(pl, y(v), W - pr, y(v), v === 0 ? 's-mut' : 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      b += S.line(x(15), pt - 4, x(15), H - pb, 's-mut dash2') + S.text(x(15) + 5, H - pb - 8, '15-yr loan paid off', 'xs mut');
      b += S.poly(n30.map((v, i) => [x(i), y(v)]), 's-acc w25') + S.poly(n15.map((v, i) => [x(i), y(v)]), 's-up w25');
      b += S.line(pl, 14, pl + 18, 14, 's-up w3') + S.text(pl + 24, 18, '15-year loan', 'sm ink b') + S.line(pl + 120, 14, pl + 138, 14, 's-acc w3') + S.text(pl + 144, 18, compact ? '30-yr + invest' : '30-year, invest the difference', 'sm ink b');
      [0, 10, 20, 30].forEach((v) => (b += S.text(x(v), H - 8, v === 0 ? 'start' : 'yr ' + v, 'xs mono', 'middle')));
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, 'Net position, investments minus loan balance, for a 15-year loan versus a 30-year loan where you invest the payment difference', b);
      G = { W, hover(p) { if (p.x < pl || p.x > W - pr) return null; const t = Math.round(SML.clamp(x.inv(p.x), 0, 30)); return { x: x(t), y: Math.min(y(n30[t]), y(n15[t])), svg: S.line(x(t), pt, x(t), H - pb, 's-ink dash2') + S.circle(x(t), y(n15[t]), 4.5, 'f-up') + S.circle(x(t), y(n30[t]), 4.5, 'f-acc'), html: `Year ${t}<br><span class="up">15-year ${usd(n15[t])}</span><br><span class="acc">30-year ${usd(n30[t])}</span>` }; } };
      setL(id + '-a', 'Payment, 15 years'); setT(id + '-a', usd(p15), '');
      setL(id + '-b', 'Payment, 30 years'); setT(id + '-b', usd(p30), '');
      setL(id + '-c', 'Interest saved by 15'); setT(id + '-c', usd(A30.totInt - A15.totInt), 'up');
      const d30 = n30[30] - n15[30];
      setL(id + '-d', 'Year 30: ' + (d30 >= 0 ? '30-yr ahead' : '15-yr ahead')); setT(id + '-d', usd(Math.abs(d30)), d30 >= 0 ? 'acc' : 'up');
      setMsg(id + '-msg', d30 >= 0 ? 'acc' : 'up', d30 >= 0 ? '30 + invest' : '15-year', `The 15-year loan costs ${usd(p15 - p30)} more a month and saves <b>${usd(A30.totInt - A15.totInt)}</b> of interest. If you take the 30 and invest that ${usd(p15 - p30)} every month at ${trim(inv * 100, 2)}%, you end year 30 ${usd(Math.abs(d30))} ${d30 >= 0 ? 'ahead' : 'behind'}. The 30 wins only if you really invest the gap and earn more than the loan costs; the 15 is the sure, forced saving.`);
      $id(id + '-note').textContent = 'Both paths spend the same each month (the 15-year payment). After the 15-year loan is paid off, that payment is invested. Ignores taxes on investment returns and any mortgage interest deduction.';
    }

    function drawRefi(W, compact) {
      const bal = st.n(id + '-rbal'), rOld = st.n(id + '-rold'), left = st.n(id + '-rleft'), rNew = st.n(id + '-rnew'), cPct = st.n(id + '-rcost'), nt = Number(st.seg(id + '-rterm')) || 30;
      const pOld = pmt(bal, rOld, left), pNew = pmt(bal, rNew, nt), cost = bal * cPct / 100, save = pOld - pNew;
      const intOld = pOld * left * 12 - bal, intNew = pNew * nt * 12 - bal;
      const months = Math.max(left, nt) * 12; const be = save > 0 ? cost / save : null;
      const H = Math.round(SML.clamp(W * 0.45, 240, 330));
      const pl = compact ? 50 : 60, pr = 14, pt = 30, pb = 28;
      const horizon = Math.min(months, 120); // first 10 years
      const cum = []; for (let mth = 0; mth <= horizon; mth++) cum.push(save * mth - cost);
      const lo = Math.min(...cum, -cost) * 1.1, hi = Math.max(...cum, cost * 0.2) * 1.1;
      const x = SML.lin(0, horizon, pl, W - pr), y = SML.lin(lo, hi, H - pb, pt);
      let b = '';
      SML.ticks(lo, hi, 5).forEach((v) => { if (y(v) < pt - 4 || y(v) > H - pb + 1) return; b += S.line(pl, y(v), W - pr, y(v), v === 0 ? 's-ink' : 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const pts = cum.map((v, i) => [x(i), y(v)]);
      b += S.area(pts, y(0), save > 0 ? 'f-up-t' : 'f-dn-t') + S.poly(pts, (save > 0 ? 's-up' : 's-dn') + ' w25');
      if (be != null && be <= horizon) { b += S.circle(x(be), y(0), 6, 'f-bg s-ink w2') + S.text(x(be), y(0) - 12, 'break-even ' + yrsMo(be), 'sm ink b', x(be) > W * 0.75 ? 'end' : x(be) < W * 0.25 ? 'start' : 'middle'); }
      b += S.text(pl, 16, 'Savings so far, after closing costs', 'sm ink b');
      for (let v = 0; v <= horizon / 12; v += compact ? 5 : 2) b += S.text(x(v * 12), H - 8, v === 0 ? 'now' : 'yr ' + v, 'xs mono', 'middle');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, 'Cumulative refinance savings minus closing costs over the first ten years', b);
      G = { W, hover(p) { if (p.x < pl || p.x > W - pr) return null; const mth = Math.round(SML.clamp(x.inv(p.x), 0, horizon)); return { x: x(mth), y: y(cum[mth]), svg: S.circle(x(mth), y(cum[mth]), 4.5, save > 0 ? 'f-up' : 'f-dn'), html: `After ${yrsMo(mth)}<br>${usd(cum[mth])}` }; } };
      setL(id + '-a', 'New payment'); setT(id + '-a', usd(pNew), '');
      setL(id + '-b', 'Saved each month'); setT(id + '-b', usd(save), save > 0 ? 'up' : 'dn');
      setL(id + '-c', 'Break-even'); setT(id + '-c', be != null ? yrsMo(be) : 'Never');
      setL(id + '-d', 'Lifetime interest change'); setT(id + '-d', F.susd(intNew - intOld + cost, 0), intNew + cost > intOld ? 'dn' : 'up');
      let msg;
      if (save <= 0) msg = ui.msg('dn', 'Skip', `The new payment is not lower, so the ${usd(cost)} of closing costs never come back.`);
      else msg = ui.msg(be <= 36 ? 'up' : 'acc', be <= 36 ? 'Worth a look' : 'Slow payback', `Closing costs of ${usd(cost)} come back after <b>${yrsMo(be)}</b> of ${usd(save)} monthly savings. Stay longer than that and you come out ahead.${nt > left && intNew + cost > intOld ? ` Careful: stretching ${left} remaining years to ${nt} raises total interest by ${usd(intNew + cost - intOld)} even though the payment drops.` : nt > left ? ` The new loan runs ${nt - left} year${nt - left === 1 ? '' : 's'} longer, but the lower rate still cuts lifetime interest by ${usd(intOld - intNew - cost)}.` : ''}`);
      $id(id + '-msg').innerHTML = msg;
      $id(id + '-note').textContent = 'Break-even = closing costs ÷ monthly savings. Lifetime interest compares the rest of the old loan with the full new loan, plus closing costs.';
    }

    const draw = ui.responsive(fig, (W) => {
      showGroups(); hide(); const mode = st.seg(id + '-mode'); const compact = W < 480;
      if (mode === 'cmp') drawCmp(W, compact); else if (mode === 'refi') drawRefi(W, compact); else drawPay(W, compact);
    });
  };

  /* ======================================================================
     3. homeSaleTax : Section 121 waterfall
     ====================================================================== */
  SML.widgets.homeSaleTax = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('hs');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-fil', ['Single', 'Married'], opts.filing || 'Married', 'Filing status')}${ui.seg(id + '-why', [{ v: 'none', label: 'Normal sale' }, { v: 'job', label: 'Job move' }, { v: 'health', label: 'Health' }, { v: 'other', label: 'Unforeseen event' }], 'none', 'Reason for selling')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${sl(id + '-buy', 'What you paid', 50000, 2000000, 5000, 350000, 'usd0')}
        ${sl(id + '-imp', 'Improvements (not repairs)', 0, 400000, 5000, 60000, 'usd0')}
        ${sl(id + '-sell', 'Sale price', 50000, 4000000, 5000, 1050000, 'usd0')}
        ${sl(id + '-cost', 'Selling costs', 0, 10, 0.25, 6, (v) => trim(v, 2) + '%')}
        ${sl(id + '-own', 'Years you owned it', 0.5, 30, 0.5, 9, (v) => trim(v, 1) + ' yrs')}
        ${sl(id + '-use', 'Years lived in it, last 5', 0, 5, 0.25, 5, (v) => trim(v, 2) + ' yrs')}
        <div class="wh-segrow"><span class="wh-seglab">Long-term gains rate</span>${ui.seg(id + '-rate', [0, 15, 20].map((v) => ({ v, label: v + '%' })), 15, 'Capital gains rate')}${ui.chips(id + '-niit', [{ k: 'on', label: '+3.8% NIIT', color: 'var(--down)', on: false }])}</div>
      </div>
      <div class="wg-read">${ui.stat('Gain', id + '-gain')}${ui.stat('Exclusion', id + '-ex')}${ui.stat('Taxable gain', id + '-tg')}${ui.stat('Estimated tax', id + '-tax', 'hl big')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Section 121: own and live in the home for at least 2 of the 5 years before the sale and up to $250,000 of gain ($500,000 married filing jointly) is tax-free, once every 2 years. A shorter stay can earn a partial exclusion if the main reason is a job move, health or an unforeseen event. Rental or home-office depreciation after May 6, 1997 is taxed even when the rest is excluded. Simplified; see IRS Publication 523.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => { const own = st.n(id + '-own'), use = st.n(id + '-use'); if (use > Math.min(5, own)) st.set(id + '-use', Math.min(5, own)); draw(); });
    const draw = ui.responsive(fig, (W) => {
      const fil = st.seg(id + '-fil') || 'Married', why = st.seg(id + '-why');
      const buy = st.n(id + '-buy'), imp = st.n(id + '-imp'), sell = st.n(id + '-sell'), cPct = st.n(id + '-cost'), own = st.n(id + '-own'), use = Math.min(st.n(id + '-use'), own);
      const rate = Number(st.seg(id + '-rate')), niit = st.on(id + '-niit', 'on');
      const costs = sell * cPct / 100, realized = sell - costs, basis = buy + imp, gain = realized - basis;
      const max = EXCL[fil]; const full = own >= 2 && use >= 2; const frac = full ? 1 : why !== 'none' ? Math.min(1, Math.min(own, use) / 2) : 0;
      const excl = gain > 0 ? Math.min(gain, max * frac) : 0; const taxable = Math.max(0, gain - excl);
      const short = own <= 1; const tr = short ? 24 : rate; const tax = taxable * (tr + (niit ? 3.8 : 0)) / 100;
      const compact = W < 520;
      const rows = [
        { k: 'Sale price', v: sell, from: 0, to: sell, cls: 'f-info', t: 'info' },
        { k: 'Selling costs', v: -costs, from: sell - costs, to: sell, cls: 'f-dn', t: 'dn' },
        { k: 'What you paid', v: -buy, from: sell - costs - buy, to: sell - costs, cls: 'f-mut', t: 'mut' },
        { k: 'Improvements', v: -imp, from: sell - costs - buy - imp, to: sell - costs - buy, cls: 'f-mut', t: 'mut' },
        { k: 'Gain', v: gain, from: Math.min(0, gain), to: Math.max(0, gain), cls: 'f-acc', t: 'acc', sep: true },
        { k: 'Exclusion', v: -excl, from: gain - excl, to: gain, cls: 'f-up', t: 'up' },
        { k: 'Taxable gain', v: taxable, from: 0, to: taxable, cls: 'f-dn', t: 'dn', sep: true },
        { k: 'Tax', v: -tax, from: 0, to: tax, cls: 'f-dn', t: 'dn' },
      ];
      const rh = compact ? 40 : 32, top = 10, H = top + rows.length * rh + 14;
      const lw = compact ? 0 : 118, vx = W - 6, bx0 = compact ? 8 : lw + 10, bx1 = W - (compact ? 84 : 96);
      const lo = Math.min(0, ...rows.map((r) => r.from)), hi = Math.max(...rows.map((r) => r.to), 1);
      const x = SML.lin(lo, hi, bx0, bx1);
      let b = '';
      if (lo < 0) b += S.line(x(0), top, x(0), H - 10, 's-mut dash2');
      rows.forEach((r, i) => {
        const yy = top + i * rh; const bh = compact ? 14 : 16; const by = compact ? yy + 20 : yy + (rh - bh) / 2;
        if (r.sep) b += S.line(bx0, yy + 1, W - 6, yy + 1, 's-line');
        b += S.text(compact ? bx0 : lw, compact ? yy + 14 : by + 12, r.k, 'sm ' + (r.k === 'Tax' || r.k === 'Gain' || r.k === 'Taxable gain' ? 'ink b' : 'ink'), compact ? 'start' : 'end');
        const w = Math.max(r.to - r.from > 0 ? 2 : 0, x(r.to) - x(r.from));
        b += S.rect(x(r.from), by, w, bh, r.cls + (r.cls === 'f-mut' ? ' o70' : ''), 2);
        b += S.text(vx, compact ? yy + 14 : by + 12, (r.v < 0 ? F.minus : '') + usd(Math.abs(r.v)), 'sm mono b ' + r.t, 'end');
        if (i > 0 && i < 4) { const prevEnd = rows[i - 1].k === 'Sale price' ? x(sell) : x(rows[i - 1].from); b += S.line(prevEnd, by - (compact ? 6 : 8), prevEnd, by, 's-mut w1 dash2'); }
      });
      fig.innerHTML = S.wrap(W, H, `Home sale gain of ${usd(gain)}, exclusion ${usd(excl)}, taxable gain ${usd(taxable)}, estimated tax ${usd(tax)}`, b);
      setT(id + '-gain', usd(gain), gain >= 0 ? 'acc' : 'dn'); setT(id + '-ex', usd(excl), 'up'); setT(id + '-tg', usd(taxable), taxable > 0 ? 'dn' : ''); setT(id + '-tax', usd(tax));
      let m;
      if (gain <= 0) m = ui.msg('info', 'No gain', 'You sold for less than your adjusted basis. There is no tax, but a loss on a personal home is not deductible either.');
      else if (frac === 1 && taxable === 0) m = ui.msg('up', 'Tax-free', `The whole ${usd(gain)} gain fits inside the ${usd(max)} exclusion. You may not even need to report the sale if you get no Form 1099-S.`);
      else if (frac === 1) m = ui.msg('acc', 'Partly taxed', `${usd(excl)} is tax-free and <b>${usd(taxable)}</b> is taxed as a long-term gain at ${tr}%${niit ? ' plus 3.8%' : ''}. Every dollar of improvements you can prove lowers that.`);
      else if (frac > 0) m = ui.msg('acc', 'Partial', `You did not meet the 2-of-5-year test, but a ${why === 'job' ? 'job move' : why === 'health' ? 'health reason' : 'unforeseen event'} gives a partial exclusion: ${Math.round(frac * 100)}% of ${usd(max)} = ${usd(max * frac)}.`);
      else m = ui.msg('dn', 'No exclusion', `You need 2 years of owning and living in the home (in the last 5) for the exclusion. ${use < 2 ? `Living there ${trim(2 - use, 2)} more year${2 - use === 1 ? '' : 's'}` : `Owning it ${trim(2 - own, 2)} more year${2 - own === 1 ? '' : 's'}`} would make up to ${usd(Math.min(gain, max))} tax-free.${short ? ' Owned a year or less, the gain is short-term and taxed as ordinary income (24% assumed).' : ''}`);
      $id(id + '-msg').innerHTML = m;
    });
  };

  /* extra: do you itemize? */
  SML.widgets.homeItemize = function (root) {
    const id = SML.uid('hi');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-fil', ['Single', 'Married'], 'Married', 'Filing status')}<span class="wh-seglab">Bracket</span>${ui.seg(id + '-br', [12, 22, 24, 32, 35, 37].map((v) => ({ v, label: v + '%' })), 22, 'Tax bracket')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${sl(id + '-bal', 'Mortgage balance', 0, 1500000, 10000, 360000, 'usd0')}
        ${sl(id + '-rate', 'Mortgage rate', 2, 10, 0.05, 7.4, fPct(2))}
        ${sl(id + '-ptax', 'Property tax', 0, 40000, 250, 5000, (v) => usd(v) + '/yr')}
        ${sl(id + '-st', 'State and local income tax', 0, 60000, 250, 7000, (v) => usd(v) + '/yr')}
        ${sl(id + '-gift', 'Charity', 0, 30000, 250, 1500, (v) => usd(v) + '/yr')}
      </div>
      <div class="wg-read">${ui.stat('Standard deduction', id + '-std')}${ui.stat('Itemized total', id + '-it')}${ui.stat('Extra tax saved', id + '-sv', 'hl big')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 rules: standard deduction $16,100 single, $32,200 married filing jointly; state and local taxes (SALT) deductible up to $40,400 (less above $505,000 of income); mortgage interest on up to $750,000 of loan. First-year interest is estimated as balance × rate. Simplified.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const fil = st.seg(id + '-fil') || 'Married', br = Number(st.seg(id + '-br'));
      const bal = st.n(id + '-bal'), rate = st.n(id + '-rate'), ptax = st.n(id + '-ptax'), stt = st.n(id + '-st'), gift = st.n(id + '-gift');
      const std = STD[fil]; const int = Math.min(bal, MID_LIMIT) * rate / 100; const saltRaw = ptax + stt, salt = Math.min(SALT_CAP, saltRaw);
      const item = int + salt + gift; const sv = Math.max(0, item - std) * br / 100;
      const compact = W < 480;
      const pl = compact ? 8 : 130, pr = compact ? 8 : 70, top = 22;
      const mx = Math.max(std, item + (saltRaw - salt), 1) * 1.05;
      const x = SML.lin(0, mx, pl, W - pr);
      const rowH = 30, y1 = top + (compact ? 18 : 6), y2 = y1 + rowH + (compact ? 36 : 22), H = y2 + rowH + 22;
      let b = '';
      b += S.text(compact ? pl : pl - 10, compact ? y1 - 6 : y1 + 19, 'Standard', 'sm ink b', compact ? 'start' : 'end');
      b += S.rect(x(0), y1, x(std) - x(0), rowH, 'f-mut o70', 3) + S.text(Math.min(x(std) + 6, W - pr + 4), y1 + 19, usd(std), 'sm mono b ink', x(std) + 70 > W ? 'end' : 'start');
      b += S.text(compact ? pl : pl - 10, compact ? y2 - 6 : y2 + 19, 'Itemized', 'sm ink b', compact ? 'start' : 'end');
      let cx = x(0);
      [[int, 'f-acc', 'interest'], [salt, 'f-info', 'SALT'], [gift, 'f-vio', 'charity']].forEach(([v, c, l]) => { const w = x(v) - x(0); if (w <= 0) return; b += S.rect(cx, y2, w, rowH, c, 2); if (w > 54) b += S.text(cx + w / 2, y2 + 19, l, 'xs b ' + (c === 'f-acc' ? 'onacc' : 'on'), 'middle'); cx += w; });
      if (saltRaw > salt) { const w = x(saltRaw - salt) - x(0); b += S.rect(cx, y2, w, rowH, 'nf s-dn dash2 w15', 2); if (w > 60) b += S.text(cx + w / 2, y2 + 19, 'over cap', 'xs dn b', 'middle'); }
      b += S.text(Math.min(cx + 6 + (saltRaw > salt ? x(saltRaw - salt) - x(0) : 0), W - 4), y2 + 19, usd(item), 'sm mono b ' + (item > std ? 'up' : 'ink'), cx + 70 > W ? 'end' : 'start');
      b += S.line(x(std), y1 - 6, x(std), y2 + rowH + 8, 's-ink dash2');
      fig.innerHTML = S.wrap(W, H, `Itemized deductions ${usd(item)} versus standard deduction ${usd(std)}`, b);
      setT(id + '-std', usd(std)); setT(id + '-it', usd(item), item > std ? 'up' : ''); setT(id + '-sv', usd(sv), sv > 0 ? 'up' : '');
      if (item <= std) setMsg(id + '-msg', 'info', 'Standard wins', `Your itemized total (${usd(item)}) is below the ${usd(std)} standard deduction, so the mortgage interest saves you <b>nothing extra</b>. That is true for most homeowners.`);
      else setMsg(id + '-msg', 'up', 'Itemize', `Itemizing beats the standard deduction by ${usd(item - std)}. At a ${br}% bracket that saves about <b>${usd(sv)}</b> a year. Only the part above ${usd(std)} counts, not the whole interest bill.${saltRaw > salt ? ` ${usd(saltRaw - salt)} of state and local tax is over the cap and does not count.` : ''}`);
    });
  };

  /* ======================================================================
     4. houseLeverage : leverage on equity, costs drag, vs index fund
     ====================================================================== */
  SML.widgets.houseLeverage = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('hl');
    root.innerHTML = `
      <div class="wg-bar">${ui.chips(id + '-ch', [{ k: 'rent', label: 'Count the rent you no longer pay', color: 'var(--up)', on: true }, { k: 'hack', label: 'House hack: rent out a room or unit', color: 'var(--violet)', on: false }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${sl(id + '-price', 'Home price', 100000, 1500000, 5000, 400000, 'usd0')}
        ${sl(id + '-down', 'Down payment', 3, 100, 1, 20, 'pct')}
        ${sl(id + '-chg', 'Home price change this year', -30, 30, 1, 4, (v) => (v > 0 ? '+' : '') + v + '%')}
        ${sl(id + '-rate', 'Mortgage rate', 2, 10, 0.05, 7.4, fPct(2))}
        ${sl(id + '-cost', 'Property tax, insurance, upkeep', 1, 5, 0.25, 2.5, (v) => trim(v, 2) + '% of price')}
        ${sl(id + '-rent', 'Rent for a similar place', 0, 8000, 50, 2100, (v) => usd(v) + '/mo')}
        ${sl(id + '-hack', 'House-hack rent you collect', 0, 4000, 50, 900, (v) => usd(v) + '/mo')}
        ${sl(id + '-idx', 'Index fund return', -30, 30, 1, 7, (v) => (v > 0 ? '+' : '') + v + '%')}
      </div>
      <div class="wg-read">${ui.stat('Leverage', id + '-lev')}${ui.stat('Change in your equity', id + '-eq')}${ui.stat('Year-1 return on your cash', id + '-roc', 'hl big')}${ui.stat('Same cash in an index fund', id + '-idxv')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Your cash = down payment + 3% closing costs. Year-1 return = price change − interest − tax, insurance and upkeep + rent you no longer pay (+ house-hack rent), divided by your cash. Principal you pay down is still your money, so it is not counted as a cost. Selling would cost another 6% or so.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    ui.drag(fig, { sel: '.wh-drag', move(pt) { if (!G) return; const v = SML.clamp(Math.round(G.inv(pt.y)), -30, 30); if (v !== st.n(id + '-chg')) { st.set(id + '-chg', v); draw(); } } });
    let G = null;
    const draw = ui.responsive(fig, (W) => {
      const price = st.n(id + '-price'), down = st.n(id + '-down'), chg = st.n(id + '-chg'), rate = st.n(id + '-rate'), cost = st.n(id + '-cost');
      const rent = st.n(id + '-rent'), hackV = st.n(id + '-hack'), idx = st.n(id + '-idx');
      const useRent = st.on(id + '-ch', 'rent'), hack = st.on(id + '-ch', 'hack');
      const D = price * down / 100, loan = price - D, cash = D + price * 0.03;
      const A = amortize(loan, rate, 30, 0); const int1 = loan > 0 ? A.rows[0].int : 0;
      const appr = price * chg / 100, carry = price * cost / 100;
      const net = appr - int1 - carry + (useRent ? rent * 12 : 0) + (hack ? hackV * 12 : 0);
      const roc = net / cash, idxGain = cash * idx / 100;
      const newVal = price + appr, eqAfter = newVal - loan, eqChg = (eqAfter - D) / D;
      const compact = W < 560;
      const H = compact ? 520 : 330;
      // ---- left: the house as loan + equity, before and after
      const lw = compact ? W : Math.round(W * 0.42);
      const top = 34, bot = compact ? 250 : H - 30;
      const maxV = price * 1.32;
      const yv = SML.lin(0, maxV, bot, top);
      const bw = Math.min(70, lw * 0.22); const x1 = lw * 0.28, x2 = lw * 0.72;
      let b = '';
      b += S.text(compact ? 8 : 4, 16, 'Your home: loan + your equity', 'sm ink b');
      const bar = (cx, val, lab) => {
        let s = S.rect(cx - bw / 2, yv(loan), bw, bot - yv(loan), 'f-info-t s-info w15', 2);
        const eq = val - loan;
        if (eq >= 0) s += S.rect(cx - bw / 2, yv(val), bw, yv(loan) - yv(val), 'f-acc s-acc w15', 2);
        else s += S.rect(cx - bw / 2, yv(loan), bw, yv(val) - yv(loan), 'f-dn-t s-dn w15 dash2', 2);
        s += S.text(cx, bot + 16, lab, 'sm ink b', 'middle') + S.text(cx, yv(Math.max(val, loan)) - (cx === x2 ? 16 : 8), kfmt(val), 'sm mono b ink', 'middle');
        return s;
      };
      b += S.line(8, bot, lw - 8, bot, 's-mut');
      b += bar(x1, price, 'Today') + bar(x2, newVal, 'In a year');
      if (loan > price * 0.12) b += S.text(x1, (yv(loan) + bot) / 2 + 4, 'loan', 'sm info b', 'middle');
      if (D > price * 0.08) b += S.text(x1, (yv(price) + yv(loan)) / 2 + 4, 'equity', 'sm onacc b', 'middle');
      // drag handle on the "after" bar top
      b += S.rect(x2 - bw / 2 - 6, yv(newVal) - 9, bw + 12, 18, 'hit wh-drag');
      b += S.rect(x2 - 14, yv(newVal) - 6, 28, 12, 'handle wh-drag grab', 4);
      b += S.text(x2 + bw / 2 + 8, yv(newVal) + 4, (chg > 0 ? '+' : '') + chg + '%', 'sm b ' + (chg >= 0 ? 'up' : 'dn'));
      const eqTxt = eqAfter < 0 ? 'Underwater' : (eqChg >= 0 ? '+' : F.minus) + Math.round(Math.abs(eqChg) * 100) + '% equity';
      b += S.text((x1 + x2) / 2, top + 4, eqTxt, 'md b ' + (eqAfter < 0 ? 'dn' : eqChg >= 0 ? 'up' : 'dn'), 'middle');
      // ---- right: year-1 return waterfall
      const rx0 = compact ? 8 : lw + 24, rx1 = W - 8, ry0 = compact ? 300 : top, ry1 = H - 10;
      const items = [
        ['Price change', appr, appr >= 0 ? 'f-up' : 'f-dn'],
        ['Interest', -int1, 'f-dn'],
        ['Tax, insurance, upkeep', -carry, 'f-dn'],
      ];
      if (useRent) items.push(['Rent you skip', rent * 12, 'f-up']);
      if (hack) items.push(['House-hack rent', hackV * 12, 'f-vio']);
      items.push(['Net', net, net >= 0 ? 'f-acc' : 'f-dn']);
      items.push(['Index fund', idxGain, 'f-info']);
      b += S.text(rx0, ry0 - (compact ? 10 : 18), 'Year 1, in dollars', 'sm ink b');
      const rows = items.length, rh = (ry1 - ry0) / rows;
      let run = 0; const vals = []; items.forEach((it, i) => { if (it[0] === 'Net' || it[0] === 'Index fund') vals.push([0, it[1]]); else { vals.push([run, run + it[1]]); run += it[1]; } });
      const lo = Math.min(0, ...vals.flat()), hi = Math.max(0, ...vals.flat()) || 1;
      const labW = compact ? 132 : 132; const bx0 = rx0 + labW, bx1 = rx1 - 62;
      const xs = SML.lin(lo, hi, bx0, bx1);
      b += S.line(xs(0), ry0 - 4, xs(0), ry1, 's-mut');
      items.forEach((it, i) => {
        const yy = ry0 + i * rh, bh = Math.min(18, rh * 0.6), by = yy + (rh - bh) / 2;
        const [a, c] = vals[i]; const x0 = xs(Math.min(a, c)), w = Math.max(1.5, Math.abs(xs(c) - xs(a)));
        if (it[0] === 'Net') b += S.line(rx0, yy, rx1, yy, 's-line');
        b += S.text(bx0 - 8, by + bh / 2 + 4, it[0], 'sm ' + (it[0] === 'Net' ? 'ink b' : 'ink'), 'end');
        b += S.rect(x0, by, w, bh, it[2] + (it[0] === 'Index fund' ? ' o70' : ''), 2);
        b += S.text(rx1, by + bh / 2 + 4, (it[1] < 0 ? F.minus : '+') + kfmt(Math.abs(it[1])), 'sm mono b ' + (it[0] === 'Index fund' ? 'info' : it[1] >= 0 ? 'up' : 'dn'), 'end');
      });
      fig.innerHTML = S.wrap(W, H, `Leverage: a ${chg}% home price change moves your equity ${Math.round(eqChg * 100)}%. Year-1 return on your cash ${Math.round(roc * 100)}%.`, b, 'drag');
      G = { inv: (yy) => (yv.inv(yy) / price - 1) * 100 };
      setT(id + '-lev', down >= 100 ? 'None' : trim(100 / down, 1) + '×');
      setT(id + '-eq', eqAfter < 0 ? 'Wiped out' : F.spct(eqChg * 100, 0), eqChg >= 0 ? 'up' : 'dn');
      setT(id + '-roc', F.spct(roc * 100, 1), roc >= 0 ? 'acc' : 'dn');
      setT(id + '-idxv', F.spct(idx, 0), 'info');
      let m;
      if (eqAfter < 0) m = ui.msg('dn', 'Underwater', `A ${Math.abs(chg)}% drop wipes out your ${down}% down payment: you owe more than the home is worth. Leverage works both ways; that is what happened to many owners after the 2006 peak.`);
      else if (roc > idx / 100) m = ui.msg('acc', 'House ahead', `Leverage turns a ${chg}% price move into ${Math.round(eqChg * 100)}% on your equity. After interest and running costs${useRent ? ', and counting the rent you skip' : ''}, your cash earns about <b>${F.spct(roc * 100, 1)}</b> this year, versus ${F.spct(idx, 0)} in the index fund.`);
      else m = ui.msg('info', 'Fund ahead', `After interest and running costs${useRent ? ', even counting the rent you skip' : ''}, your cash earns about <b>${F.spct(roc * 100, 1)}</b> this year, versus ${F.spct(idx, 0)} in the index fund. Price growth alone rarely beats the costs of owning.${useRent ? '' : ' Turn on the rent you no longer pay: that is the hidden return of owning.'}`);
      $id(id + '-msg').innerHTML = m;
    });
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const SRC = {
    pmms: { t: 'Freddie Mac: Primary Mortgage Market Survey (30-year 7.40%, 15-year 6.71% on Oct 15, 2026)', u: 'https://www.freddiemac.com/pmms' },
    nar: { t: 'NAR: Existing-home sales, September 2026 (median price $417,500)', u: 'https://www.nar.realtor/newsroom/existing-home-sales-increased-1-5-in-september-according-to-nar-report' },
    pwl: { t: 'PWL Capital: the 5% rule for renting versus buying', u: 'https://pwlcapital.com/?p=8502' },
    cfpbPmi: { t: 'CFPB: When can I remove private mortgage insurance (PMI)?', u: 'https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/' },
    fha: { t: 'NerdWallet: FHA mortgage insurance (MIP) rules', u: 'https://www.nerdwallet.com/mortgages/learn/fha-mortgage-insurance' },
    p523: { t: 'IRS Publication 523: Selling Your Home', u: 'https://www.irs.gov/publications/p523' },
    p936: { t: 'IRS Publication 936: Home Mortgage Interest Deduction', u: 'https://www.irs.gov/publications/p936' },
    irs26: { t: 'IRS: 2026 inflation adjustments, including the One Big Beautiful Bill changes', u: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill' },
    niit: { t: 'IRS Topic 559: Net investment income tax', u: 'https://www.irs.gov/taxtopics/tc559' },
    shiller: { t: 'A Wealth of Common Sense: real estate vs the stock market (Shiller home price data)', u: 'https://awealthofcommonsense.com/2022/12/is-real-estate-a-better-investment-than-the-stock-market/' },
    heloc: { t: 'CFPB: What is a home equity line of credit (HELOC)?', u: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-line-of-credit-heloc-en-107/' },
    hack: { t: 'Mortgage Daily: house hacking with an FHA multi-unit loan', u: 'https://www.mortgagedaily.com/rates/strategies/house-hacking-fha-multi-unit/' },
  };

  SML.lessons.push({
    id: 'l-rent-vs-buy', course: 'home', order: 1, title: 'Rent or buy?', mins: 11, level: 'Beginner',
    summary: 'When owning beats renting, and how rates, prices and time change the answer.',
    idea: 'Renting is not throwing money away. Compare the money neither path gets back, and how long you will stay.',
    widget: 'rentVsBuy',
    try: 'Pick an example, then drag the year you sell. Switch to “Rates drop to 5%” and watch a break-even year appear.',
    body: [
      '<h3>Both paths have costs you never get back</h3><p>Rent is gone once you pay it. So are big parts of owning: mortgage interest, property tax, insurance, upkeep, and the return your down payment could have earned invested. Only the loan principal you pay down and any rise in the home’s price build wealth. A fair comparison puts these unrecoverable costs side by side, which is what the calculator does month by month.</p>',
      '<h3>The costs of owning people forget</h3><ul><li><b>Buying costs:</b> closing costs typically run 2%–5% of the price.</li><li><b>Selling costs:</b> agent commissions have stayed around 5%–6% of the price even after the 2024 NAR settlement (buyer-agent fees averaged about 2.4% in 2025), plus transfer taxes and other fees.</li><li><b>Property tax:</b> often around 1% of the value a year, and much more or less depending on your state.</li><li><b>Maintenance:</b> plan on about 1% of the value a year.</li><li><b>Insurance and HOA dues:</b> insurance has been rising fast in states like Florida and California.</li><li><b>PMI</b> if you put less than 20% down (see <a href="#l-mortgage">Mortgage basics</a>).</li></ul>',
      '<h3>Two quick tests</h3><p><b>Price-to-rent ratio:</b> the home’s price divided by a year of rent for a similar place. Under about 15 tends to favor buying; over about 20 favors renting. At the national numbers for September 2026 it is roughly 16 to 18 depending on the data source: Zillow’s typical home value ($366,913) over its typical rent ($1,932 a month) gives about 15.8, while NAR’s median sale price ($417,500) gives about 18. Either way it is a close call that depends on your town.</p><p><b>The 5% rule:</b> owning costs roughly 5% of the home’s value a year in unrecoverable costs: about 1% property tax, 1% maintenance and 3% cost of money. Multiply the price by 5% and divide by 12. If you can rent a similar home for less, renting is competitive. For a $420,000 home that is $1,750 a month. The 3% was set when mortgages were cheaper, so with rates above 7% treat the rule as a floor.</p>',
      '<h3>Interest rates change the answer</h3><p>In today’s range, each 1-point rise in the rate adds about $65 a month for every $100,000 you borrow. On October 15, 2026 the average 30-year rate was 7.40% (Freddie Mac). A $336,000 loan costs $2,326 a month at that rate and $1,804 at 5%. In the calculator, the typical home never catches renting within 30 years at 7.4%, but pulls ahead after about 6 years at 5%. High rates push the answer toward renting and investing; falling rates pull it toward buying. Refinancing later is possible, but no one can promise rates will fall.</p>',
      '<h3>Reading the wider economy</h3><ul><li><b>Jobs and recessions:</b> the biggest risk is having to sell early. If your industry is shaky or a recession looks likely, a short or uncertain stay favors renting, because forced sales happen when prices are weak.</li><li><b>Local cycles:</b> housing markets move town by town. After a fast run-up, prices can stall or fall for years; after a slump, price-to-rent ratios often look better. Compare local rents and prices, not national headlines.</li><li><b>Inflation helps fixed-rate borrowers:</b> with a fixed rate, your principal and interest payment never rises while wages and rents usually do, so the loan gets lighter over time. Property tax and insurance can still rise.</li><li><b>Tools when rates are high:</b> an ARM starts lower but can reset higher; a rate buydown (points, or a seller paying to lower your rate) cuts the payment at a price; FHA and VA loans can often be taken over by a buyer with lender approval, keeping a seller’s older, lower rate. Each has trade-offs to price out.</li><li><b>Do not bank on a refinance:</b> buying at a payment you can only afford if rates fall is a bet. Rates may stay high for years; make sure today’s payment works on its own.</li></ul>',
      '<h3>When buying tends to win</h3><ul><li>You expect to stay at least 5–7 years, long enough to earn back roughly 10% in buying and selling costs.</li><li>Your job and income are steady and you still have an emergency fund after closing.</li><li>Local price-to-rent is reasonable and the payment fits easily in your budget.</li><li>You value stability: no landlord, no forced moves, freedom to renovate. That is a fair reason; just know its price.</li></ul>',
      '<h3>When renting tends to win</h3><ul><li>You might move within a few years, or your job is uncertain.</li><li>Prices are high compared with rents (a ratio above about 20).</li><li>You would rather keep money liquid and invested. Renting only wins if you <b>actually invest the difference</b>; spent, it is just a higher lifestyle.</li></ul><p>Next: what a mortgage really costs in <a href="#l-mortgage">Mortgage basics</a>, and whether a home is a good investment in <a href="#l-house-invest">Is a house an investment?</a></p>',
    ],
    example: {
      title: 'A $420,000 home at 7.4%',
      steps: [
        'You can rent a home for $2,100 a month, or buy a similar one for $420,000 with 20% down ($84,000) plus about $12,600 (3%) in closing costs.',
        'A 30-year loan of $336,000 at 7.4% costs $2,326 a month. In year 1, $24,758 of the $27,917 you pay is interest; only $3,158 builds equity.',
        'Add property tax ($350 a month at 1%), insurance ($175) and upkeep ($350). Owning takes about $3,201 a month in cash, $1,101 more than rent.',
        'Quick tests: price-to-rent is $420,000 ÷ $25,200 = 16.7, and the 5% rule gives $1,750 a month. Both say “close call”, leaning slightly toward buying.',
        'The full model has the renter invest the $96,600 up front and the monthly gap at 6% a year. It assumes the home grows 3.5% a year, rent rises 3% a year, insurance is 0.5% of the value, selling costs 7%, investment gains are taxed at 15%, and the mortgage interest deduction is counted (married filing jointly, 22% bracket). Selling in year 10, renting is about $49,000 ahead, and buying never catches up within 30 years at 7.4%. At a 5% rate, buying pulls ahead after year 6.',
      ],
      result: 'At October 2026 rates this home favors renting, unless prices grow faster, rents jump or rates fall. Run your own numbers above.',
    },
    mistakes: [
      'Comparing rent with the mortgage payment alone, and forgetting property tax, insurance, upkeep, HOA dues and PMI.',
      'Saying “rent is throwing money away” while ignoring that interest, taxes and upkeep are also gone for good.',
      'Buying for a two- or three-year stay, so about 10% in buying and selling costs wipes out any price gain.',
      'Renting to “invest the difference” and then spending it. The renting path only wins if the money is invested.',
    ],
    points: [
      'Compare unrecoverable costs: interest, tax, insurance, upkeep and lost returns versus rent.',
      'Price-to-rent under about 15 leans buy, over about 20 leans rent; the 5% rule is a fast second check.',
      'High mortgage rates push the answer toward renting; lower rates pull it toward buying.',
      'The longer you stay, the more the buying and selling costs are spread out. Under about 5 years, renting usually wins.',
      'Stability, schools and control are valid reasons to buy. Just know what they cost.',
    ],
    quiz: { q: 'You can rent a home for $1,500 a month. Using the 5% rule, what purchase price is roughly equivalent?', options: ['$180,000', '$360,000', '$600,000'], answer: 1, why: '$1,500 × 12 ÷ 5% = $360,000. If similar homes cost more than that, renting tends to be the better deal.' },
    terms: ['Down payment', 'Closing costs', 'Price-to-rent ratio', '5% rule', 'Opportunity cost', 'Mortgage'],
    sources: [SRC.pmms, SRC.nar, SRC.pwl],
  });

  SML.lessons.push({
    id: 'l-mortgage', course: 'home', order: 2, title: 'Mortgage basics', mins: 10, level: 'Beginner',
    summary: 'Payments, amortization, PMI, points, 15 vs 30 years and when to refinance.',
    idea: 'A mortgage payment is mostly interest at first. The rate, the term and every extra dollar change what your home really costs.',
    widget: 'mortgageCalc',
    try: 'Change the rate and term and add an extra payment. Then switch to “15 vs 30 years” and “Refinance”.',
    body: [
      '<h3>What your payment pays for</h3><p>Lenders talk about <b>PITI</b>: <b>principal</b> (paying down the loan), <b>interest</b>, property <b>taxes</b> and home <b>insurance</b>. Taxes and insurance are often collected with the payment into an escrow account and paid for you. Add PMI if you put less than 20% down, and HOA dues if the home has them.</p>',
      '<h3>Amortization: why the first years feel slow</h3><p>Every payment is the same size, but interest is charged on what you still owe. On a $336,000 loan at 7.4%, about 89% of the first year’s payments is interest. The split slowly flips, and in the last years almost all of each payment is principal. That is why extra payments early in the loan save the most.</p>',
      '<h3>Fixed or adjustable</h3><p>A <b>fixed-rate</b> loan keeps the same rate for its whole life. An <b>adjustable-rate mortgage</b> (ARM), such as a 7/6 ARM, is fixed for the first years and then resets with a market index plus a margin, within caps. An ARM usually starts cheaper but moves the risk of rising rates onto you.</p>',
      '<h3>15 or 30 years</h3><p>On October 15, 2026 the average 15-year rate was 6.71% and the 30-year 7.40% (Freddie Mac). On $336,000 that is $2,966 a month for 15 years versus $2,326 for 30, and about $198,000 versus $502,000 of total interest. The 30 gives breathing room; the 15 forces saving. Taking the 30 and investing the difference only wins if you really invest it and earn more than the loan costs.</p>',
      '<h3>PMI, points and extra payments</h3><ul><li><b>PMI:</b> with under 20% down on a conventional loan you pay private mortgage insurance, priced on your credit and down payment. You can ask to cancel it once the balance reaches 80% of the original value, and it ends automatically at 78% if you are current.</li><li><b>FHA loans</b> charge their own insurance (MIP): 1.75% of the loan up front plus a yearly premium that lasts for the life of the loan if you put less than 10% down.</li><li><b>Points:</b> one point costs 1% of the loan and buys a lower rate; how much lower depends on the lender. Divide the cost by the monthly saving to get the break-even, and only pay points if you will keep the loan longer than that.</li><li><b>Extra payments:</b> every extra dollar goes straight to principal. $200 more a month on the $336,000 loan saves about $132,500 of interest and ends it 6 years 8 months early.</li></ul>',
      '<h3>How much can you borrow?</h3><p>Lenders look at your <b>debt-to-income ratio</b> (DTI): monthly debt payments divided by gross monthly income. Fannie Mae’s automated underwriting can approve up to 50%, but a payment that big leaves nothing for saving or surprises. A long-used comfort guideline keeps housing near 28% of gross income and all debts near 36%. Get Loan Estimates from at least three lenders; they are standardized so you can compare rates and fees line by line.</p>',
      '<h3>Refinancing</h3><p>When rates fall, a new loan can cut your payment. Divide the closing costs by the monthly saving: if you will keep the home longer than that, it can pay. Watch the term: restarting a 30-year clock can raise your total interest even when the payment drops. Whether a home is worth buying at all is in <a href="#l-rent-vs-buy">Rent or buy?</a></p>',
    ],
    example: {
      title: 'Payoff choices on a $336,000 loan',
      steps: [
        'You buy a $420,000 home with 20% down and borrow $336,000 at 7.4% for 30 years: $2,326 a month for principal and interest.',
        'Over 30 years you would pay about $501,500 of interest, more than the amount you borrowed.',
        'A 15-year loan at 6.71% costs $2,966 a month, $639 more, but total interest drops to about $197,900.',
        'Keeping the 30-year loan and paying $200 extra every month ends it in 23 years 4 months and saves about $132,500 of interest.',
        'Later, rates fall. You owe $380,000 at 7.8% with 27 years left: $2,815 a month. A new 30-year loan at 6.5% costs $2,402, saving $413 a month; $7,600 of closing costs (2%) pays back in about 18 months.',
      ],
      result: 'Rate, term and extra payments can each move what the home really costs by six figures.',
    },
    mistakes: [
      'Choosing the house first and the loan as an afterthought. Compare Loan Estimates from several lenders; a small rate gap costs thousands.',
      'Paying points on a loan you will sell or refinance before the points break even.',
      'Borrowing the most a lender approves, leaving nothing for savings, repairs or a job loss.',
      'Refinancing into a fresh 30-year loan for a lower payment without noticing the total interest goes up.',
    ],
    points: [
      'Early payments are mostly interest, so extra principal early saves the most.',
      'A 15-year loan has a higher payment and a lower rate, and costs far less interest.',
      'PMI applies under 20% down; you can drop it at 80% of the original value and it ends at 78%.',
      'Points and refinancing are break-even math: up-front cost ÷ monthly saving.',
    ],
    quiz: { q: 'A refinance costs $6,000 and lowers your payment by $250 a month. When does it break even?', options: ['After 12 months', 'After 24 months', 'After 60 months'], answer: 1, why: '$6,000 ÷ $250 = 24 months. If you expect to move or refinance again before then, it does not pay.' },
    terms: ['Mortgage', 'Amortization', 'PMI', 'Mortgage points', 'ARM', 'DTI'],
    sources: [SRC.pmms, SRC.cfpbPmi, SRC.fha],
  });

  SML.lessons.push({
    id: 'l-home-taxes', course: 'home', order: 3, title: 'Your home and taxes', mins: 10, level: 'Intermediate',
    summary: 'The $250,000/$500,000 home-sale exclusion, cost basis and the deductions most owners miss out on.',
    idea: 'Up to $250,000 of profit on your home, $500,000 for a married couple, can be tax-free. The yearly deductions help fewer people than you think.',
    widget: 'homeSaleTax',
    try: 'Change what you paid, the improvements and the sale price. Then shorten how long you lived there and pick a reason for selling.',
    body: [
      '<h3>The home-sale exclusion (Section 121)</h3><p>When you sell your main home at a profit, you can exclude up to <b>$250,000</b> of gain from tax, or <b>$500,000</b> if you are married filing jointly. You must have <b>owned and lived in</b> the home for at least 24 months of the 5 years before the sale; the months need not be in a row. You can use the exclusion once every 2 years. For a married couple, one spouse must meet the ownership test and both must meet the use test.</p>',
      '<h3>Selling early: the partial exclusion</h3><p>If the main reason you sold early was a change of workplace, health or an unforeseeable event, you get a share of the exclusion: the shortest of your ownership, your use, or the time since your last exclusion, divided by 24 months. A single filer who lived there 12 months and moved for a new job can exclude up to 12/24 × $250,000 = $125,000.</p>',
      '<h3>Your cost basis: keep every receipt</h3><p>Your gain is the sale price minus selling costs minus your <b>adjusted basis</b>: what you paid, plus certain purchase costs, plus <b>capital improvements</b> such as a new roof, an addition or a remodel. Repairs that only keep the home in shape do not count. Keep the records as long as you own the home and for a few years after you sell. Depreciation you claimed for a home office or rental use is taxed on sale even when the rest of the gain is excluded.</p>',
      '<h3>Mortgage interest, property tax and PMI</h3><ul><li><b>Mortgage interest</b> is deductible on up to $750,000 of loan used to buy, build or improve your home (for loans taken out after December 15, 2017). The 2025 tax law made that limit permanent.</li><li><b>Home equity loan or HELOC interest</b> counts only if the money was used to buy, build or substantially improve that home, not to pay off cards or buy a car.</li><li><b>Property tax</b> shares the <b>SALT cap</b> with state and local income tax: $40,400 for 2026, reduced by 30% of income above $505,000 but never below $10,000.</li><li><b>Mortgage insurance</b> (PMI or FHA premiums) is deductible again from 2026 for people who itemize, phasing out above $100,000 of income.</li></ul>',
      '<h3>Why most homeowners get no tax break</h3><p>All of these are itemized deductions. They only help if, with your other itemized items, they beat the <b>standard deduction</b>: $16,100 single or $32,200 married filing jointly in 2026. A couple in a state with no income tax, with $14,000 of mortgage interest and $8,000 of property tax, has $22,000 of deductions, well under $32,200, so the mortgage saves them nothing extra. (In a state with an income tax, that tax joins property tax under the SALT cap and can tip the balance.) Only about 1 in 10 households itemized under the 2018–2024 rules; more may now that the SALT cap has risen. When you do itemize, only the amount above the standard deduction saves tax. Check yours with the second calculator below.</p>',
      '<h3>When the owner dies</h3><p>Heirs get a <b>step-up in basis</b>: the home’s basis resets to its value on the date of death, wiping out the untaxed gain. Giving a highly appreciated home away while alive passes on your old, low basis instead. Big gains, rentals and estates are worth a session with a CPA or enrolled agent.</p>',
    ],
    extra: [{ widget: 'homeItemize', try: 'Enter your mortgage, property tax and state income tax to see whether itemizing beats the 2026 standard deduction.' }],
    example: {
      title: 'A married couple sells after nine years',
      steps: [
        'A married couple bought their home for $350,000 nine years ago and lived in it the whole time. They added a kitchen and a new roof for $60,000.',
        'They sell for $1,050,000 and pay 6% in selling costs ($63,000), so they receive $987,000.',
        'Their adjusted basis is $350,000 + $60,000 = $410,000. The gain is $987,000 − $410,000 = $577,000.',
        'They pass the 2-of-5-year test, so $500,000 is excluded and $77,000 is taxable.',
        'At the 15% long-term rate the federal tax is $11,550. With $200,000 of other income their MAGI is $277,000, so the 3.8% net investment income tax also applies to the $27,000 above $250,000: another $1,026.',
      ],
      result: 'Without the kitchen and roof receipts the taxable gain would be $137,000, and the capital gains tax alone $9,000 higher.',
    },
    mistakes: [
      'Throwing away receipts for improvements. Without proof, your basis is just the purchase price and more of the gain is taxed.',
      'Moving out and renting the home for years, then selling after the 2-of-5-year window has closed.',
      'Buying a bigger home or taking a bigger loan “for the deduction” when you do not even itemize.',
      'Using a HELOC to pay off cards or buy a car and expecting to deduct the interest.',
    ],
    points: [
      'Up to $250,000 ($500,000 married) of home-sale gain is tax-free after 2 years of owning and living there.',
      'Capital improvements raise your basis; repairs do not. Keep the receipts.',
      'Mortgage interest and property tax only help if itemizing beats the 2026 standard deduction of $16,100 or $32,200.',
      'Property tax shares the $40,400 SALT cap with state income tax in 2026.',
      'Heirs get a step-up in basis; a gift during your life does not.',
    ],
    quiz: { q: 'A single filer lived in her home for 3 years and sells at a $300,000 gain. How much is taxable?', options: ['$0', '$50,000', '$300,000'], answer: 1, why: 'She passes the 2-of-5-year test, so $250,000 is excluded and the other $50,000 is taxed as a long-term gain.' },
    terms: ['Section 121 exclusion', 'Cost basis', 'Mortgage interest deduction', 'Standard deduction', 'SALT cap', 'Step-up in basis'],
    sources: [SRC.p523, SRC.p936, SRC.irs26, SRC.niit],
  });

  SML.lessons.push({
    id: 'l-house-invest', course: 'home', order: 4, title: 'Is a house an investment?', mins: 9, level: 'Intermediate',
    summary: 'Leverage, the costs that eat price gains, house hacking and the risks of HELOCs.',
    idea: 'Your home is first a place to live. Leverage makes small price moves big in both directions, and costs eat most of the price gain.',
    widget: 'houseLeverage',
    try: 'Drag the top of the “In a year” bar up and down. Then turn the rent you no longer pay off and on.',
    body: [
      '<h3>What history says</h3><p>Over the long run, US home prices have grown only a little faster than inflation: about 0.6% a year above inflation from 1890 to 2022 in Robert Shiller’s data, with faster gains since 1989. Stocks have returned roughly 6%–7% a year above inflation. A price chart leaves out two big things: the costs of owning, and the rent you no longer pay, which is most of a home’s real return.</p>',
      '<h3>Leverage cuts both ways</h3><p>With 20% down you control a home five times the size of your cash. A 4% rise on a $400,000 home is $16,000: a 20% gain on your $80,000. A 10% fall is $40,000: half your equity gone. With 5% down, a 5% dip leaves you owing as much as the home is worth, and selling would cost you money. That is what happened to many owners after the 2006 peak.</p>',
      '<h3>Costs drag hard</h3><p>In the $400,000 example at 7.4%, year 1 brings about $23,600 of interest and $10,000 of property tax, insurance and upkeep: more than double the $16,000 price rise. Count the $25,200 of rent you no longer pay and the home earns about 8% on your $92,000 of cash. Leave the rent out and it loses money. Selling adds commissions of about 5%–6% of the price plus other fees.</p>',
      '<h3>Other trade-offs</h3><ul><li><b>Illiquid:</b> selling takes months and a big slice of the price.</li><li><b>Concentrated:</b> one building in one town, often the same place your job depends on.</li><li><b>Forced saving:</b> the good side. Paying down principal builds wealth even for people who would never invest on their own, and a fixed payment gets easier as wages rise.</li></ul>',
      '<h3>House hacking</h3><p>Living in one unit of a 2–4 unit building, or renting out rooms, lets tenants cover part of your mortgage. FHA loans allow 1–4 units with 3.5% down (credit score 580+) if you live in one unit for at least a year; for 3–4 units the rents must pass a self-sufficiency test. Conventional loans allow 5% down on owner-occupied 2–4 unit homes. Buying without really moving in is occupancy fraud. Running numbers on a pure rental is in <a href="#l-rental">Rental property: the real numbers</a>.</p>',
      '<h3>HELOCs: handle with care</h3><p>A home equity line of credit lets you borrow against your equity, usually at a variable rate. Payments can jump when the draw period ends, the lender can freeze or cut the line if your home’s value or your finances fall, and default can cost you the home. Use it for repairs or improvements, not for spending. More on borrowing wisely in <a href="#l-smart-leverage">Leverage the smart way</a>.</p>',
    ],
    example: {
      title: 'A $400,000 home, one year later',
      steps: [
        'You buy a $400,000 home with $80,000 down plus $12,000 of closing costs: $92,000 of your cash. The loan is $320,000 at 7.4%.',
        'Prices rise 4%: the home gains $16,000, a 20% gain on your $80,000 of equity. That is leverage at work.',
        'Year 1 also brings $23,579 of interest and $10,000 of property tax, insurance and upkeep (2.5% of the price).',
        'You no longer pay $2,100 a month of rent: $25,200 saved. Net: $16,000 − $23,579 − $10,000 + $25,200 = $7,621, about 8.3% on your $92,000.',
        'Had prices fallen 10% instead, the same math gives −$48,379: about 53% of your cash, while $92,000 in an index fund that fell 10% would lose $9,200.',
      ],
      result: 'A home is a solid long-term store of value once you count the rent you save, but leverage and costs make any single year a gamble.',
    },
    mistakes: [
      'Judging a home by its price chart and forgetting interest, taxes, upkeep and selling costs.',
      'Putting almost nothing down in a hot market, so a small dip leaves you underwater and unable to sell.',
      'Treating home equity as a cash machine, using a HELOC for vacations or cars.',
      'Counting your home as retirement savings when you will still need somewhere to live.',
    ],
    points: [
      'Long-run home prices beat inflation only slightly; most of the return is the rent you do not pay.',
      'Leverage multiplies price moves: with 20% down, a 4% move is a 20% move in your equity.',
      'Owning costs can be bigger than the price gain in any single year.',
      'House hacking and forced saving are real advantages; HELOCs and thin equity are real risks.',
    ],
    quiz: { q: 'You put 10% down on a $300,000 home and prices fall 10%. What happens to your equity, before costs?', options: ['It falls 10%', 'It falls 50%', 'It is wiped out'], answer: 2, why: 'Your $30,000 of equity absorbs the whole $30,000 drop, so it is gone. Leverage works both ways.' },
    terms: ['Home equity', 'Leverage', 'House hacking', 'HELOC', 'Down payment'],
    sources: [SRC.shiller, SRC.hack, SRC.heloc],
  });
})();
