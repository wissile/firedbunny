/* Stock Market Lessons: Taxes in Early Retirement (FIRE withdrawals, the 0% gains bracket, money before 59½). Fork F3. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const usd = (v) => F.usd(Math.round(v), 0);
  const k$ = (v) => { const a = Math.abs(v); const s = v < 0 ? F.minus : ''; if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e4) return s + '$' + Math.round(a / 1e3) + 'K'; if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return s + '$' + Math.round(a); };
  const pct = (v, d) => F.pct(v * 100, d == null ? 1 : d);

  /* ---------------- 2026 federal figures (IRS Rev. Proc. 2025-32) ---------------- */
  const TAX = {
    std: { single: 16100, mfj: 32200, hoh: 24150 },
    br: {
      single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
      mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
      hoh: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]],
    },
    cg: { single: [49450, 545500], mfj: [98900, 613700], hoh: [66200, 579600] },
    niit: { single: 200000, mfj: 250000, hoh: 200000 },
  };
  /* 2025 HHS poverty guidelines (48 states), used for 2026 marketplace coverage */
  const FPL = { 1: 15650, 2: 21150, 3: 26650, 4: 32150 };
  /* IRS Single Life Expectancy Table (2022 and later), ages 30-59 */
  const SLE = { 30: 55.3, 31: 54.4, 32: 53.4, 33: 52.5, 34: 51.5, 35: 50.5, 36: 49.6, 37: 48.6, 38: 47.7, 39: 46.7, 40: 45.7, 41: 44.8, 42: 43.8, 43: 42.9, 44: 41.9, 45: 41.0, 46: 40.0, 47: 39.0, 48: 38.1, 49: 37.1, 50: 36.2, 51: 35.3, 52: 34.3, 53: 33.4, 54: 32.5, 55: 31.6, 56: 30.6, 57: 29.8, 58: 28.9, 59: 28.0 };
  const FSL = { single: 'Single', mfj: 'Married filing jointly', hoh: 'Head of household' };

  function bracketTax(ti, br) { let t = 0, lo = 0; for (const [hi, r] of br) { if (ti <= lo) break; t += (Math.min(ti, hi) - lo) * r; lo = hi; } return t; }
  function margRate(ti, br) { for (const [hi, r] of br) if (ti < hi) return r; return br[br.length - 1][1]; }
  /* federal tax: ordinary income + long-term gains/qualified dividends stacked on top */
  function fed(fs, ord, lt) {
    const std = TAX.std[fs], br = TAX.br[fs], t0 = TAX.cg[fs][0], t15 = TAX.cg[fs][1];
    ord = Math.max(0, ord); lt = Math.max(0, lt);
    const agi = ord + lt, ti = Math.max(0, agi - std), ordTI = Math.max(0, ord - std), ltTI = ti - ordTI;
    const oTax = bracketTax(ordTI, br);
    const in0 = Math.max(0, Math.min(t0, ti) - ordTI);
    const in15 = Math.max(0, Math.min(t15, ti) - Math.max(t0, ordTI));
    const in20 = Math.max(0, ltTI - in0 - in15);
    const cgTax = in15 * 0.15 + in20 * 0.2;
    const niit = 0.038 * Math.max(0, Math.min(lt, agi - TAX.niit[fs]));
    return { std, agi, ti, ordTI, ltTI, oTax, in0, in15, in20, cgTax, niit, total: oTax + cgTax + niit, ltDed: lt - ltTI };
  }
  SML.fireFedTax = fed;

  SML.css(`
.ftx-ctrl{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.ftx-ctrl .ftx-wide{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.ftx-lab{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.ftx-bar .seg{flex-wrap:wrap}
.ftx-fig{cursor:crosshair}
.ftx-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.ftx-legend i{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-2px;margin-right:6px;background:var(--c)}
.ftx-hide{display:none!important}
`);

  /* shared drawing helpers */
  function axisMoney(x, y, v, anchor) { return S.text(x, y, k$(v), 'xs mono', anchor || 'middle'); }
  function niceMax(v) { const steps = [25e3, 50e3, 75e3, 100e3, 125e3, 150e3, 200e3, 250e3, 300e3, 400e3, 500e3, 600e3, 800e3, 1e6, 1.5e6, 2e6]; for (const s of steps) if (v <= s) return s; return Math.ceil(v / 1e6) * 1e6; }

  /* =====================================================================
     1. fireTaxCalc: what a FIRE withdrawal costs in federal tax
     ===================================================================== */
  const FT_PRE = {
    couple: { fs: 'mfj', port: 2000000, wr: 4, pre: 15, free: 10, gain: 50, div: 20000, other: 0, st: '0' },
    single: { fs: 'single', port: 1250000, wr: 4, pre: 80, free: 0, gain: 50, div: 3000, other: 0, st: '0' },
    fat: { fs: 'mfj', port: 4000000, wr: 4, pre: 30, free: 10, gain: 60, div: 30000, other: 0, st: '0' },
    barista: { fs: 'single', port: 800000, wr: 4, pre: 50, free: 0, gain: 40, div: 4000, other: 25000, st: '0' },
  };
  SML.widgets.fireTaxCalc = function (root) {
    const id = SML.uid('ftc');
    const d = FT_PRE.couple;
    let hover = null;
    root.innerHTML = `
      <div class="wg-bar ftx-bar"><span class="wg-title">Example</span>${ui.seg(id + '-pre', [{ v: 'couple', label: 'Couple, mostly taxable' }, { v: 'single', label: 'Single, mostly IRA' }, { v: 'fat', label: 'Fat FIRE couple' }, { v: 'barista', label: 'Barista + IRA' }], 'couple', 'Example household')}</div>
      <div class="wg-bar ftx-bar">${ui.seg(id + '-fs', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married, joint' }, { v: 'hoh', label: 'Head of household' }], d.fs, 'Filing status')}<span class="grow"></span>${ui.seg(id + '-st', [{ v: '0', label: 'No state tax' }, { v: '3', label: 'State 3%' }, { v: '5', label: 'State 5%' }, { v: '9', label: 'State 9%' }], d.st, 'State income tax')}</div>
      <div class="wg-fig ftx-fig"></div>
      <div class="ftx-legend" aria-hidden="true"><span><i style="--c:var(--info)"></i>Ordinary income</span><span><i style="--c:var(--up)"></i>Gains at 0%</span><span><i style="--c:var(--accent)"></i>Gains at 15%</span><span><i style="--c:var(--down)"></i>Gains at 20%</span><span><i style="--c:var(--violet)"></i>Not income</span></div>
      <div class="wg-ctrl ftx-ctrl">
        ${ui.slider({ id: id + '-port', label: 'Portfolio', min: 250000, max: 6000000, step: 50000, value: d.port, fmt: k$ })}
        ${ui.slider({ id: id + '-wr', label: 'Withdrawal rate', min: 2.5, max: 6, step: 0.1, value: d.wr, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-pre-tax', label: 'From 401(k) / traditional IRA', min: 0, max: 100, step: 5, value: d.pre, fmt: 'pct' })}
        ${ui.slider({ id: id + '-free', label: 'From Roth, HSA or cash', min: 0, max: 100, step: 5, value: d.free, fmt: 'pct' })}
        ${ui.slider({ id: id + '-gain', label: 'Gain share of taxable sales', min: 0, max: 100, step: 5, value: d.gain, fmt: 'pct' })}
        ${ui.slider({ id: id + '-div', label: 'Dividends from taxable account', min: 0, max: 60000, step: 500, value: d.div, fmt: k$ })}
        ${ui.slider({ id: id + '-other', label: 'Other income (part-time, rent)', min: 0, max: 80000, step: 1000, value: d.other, fmt: k$ })}
      </div>
      <div class="wg-read">${ui.stat('Withdrawal', id + '-w')}${ui.stat('Counted as income', id + '-agi')}${ui.stat('Federal tax', id + '-tax', 'hl')}${ui.stat('Effective rate', id + '-eff')}${ui.stat('State tax, rough', id + '-stt')}${ui.stat('$0 federal tax up to', id + '-zero')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 federal rules: standard deduction, ordinary brackets, the 0%/15%/20% long-term gains bands stacked on top of ordinary income, and the 3.8% net investment income tax. "Gain share" is the part of each taxable-account sale that is long-term gain (the rest is your own money coming back). Qualified dividends from the taxable account count as income every year, spent or reinvested; here they are spent first, before any shares are sold. Under 65, no credits, no Social Security. State tax is a flat rough rate. Hover the lower chart to try other amounts.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const pre = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (pre) { const p = FT_PRE[st.seg(id + '-pre')]; if (p) { st.setSeg(id + '-fs', p.fs); st.setSeg(id + '-st', p.st); st.set(id + '-port', p.port); st.set(id + '-wr', p.wr); st.set(id + '-pre-tax', p.pre); st.set(id + '-free', p.free); st.set(id + '-gain', p.gain); st.set(id + '-div', p.div); st.set(id + '-other', p.other); } }
      else st.setSeg(id + '-pre', '');
      draw();
    });
    function read() {
      const fs = st.seg(id + '-fs') || 'mfj';
      const port = st.n(id + '-port'), wr = st.n(id + '-wr') / 100;
      let pre = st.n(id + '-pre-tax') / 100, free = st.n(id + '-free') / 100;
      if (pre + free > 1) free = 1 - pre;
      const gain = st.n(id + '-gain') / 100, other = st.n(id + '-other'), div = st.n(id + '-div'), stRate = Number(st.seg(id + '-st') || 0) / 100;
      return { fs, port, wr, pre, free, tx: Math.max(0, 1 - pre - free), gain, other, div, stRate, W: port * wr };
    }
    const calcAt = (s, W) => { const ord = W * s.pre + s.other, lt = s.div + Math.max(0, W * s.tx - s.div) * s.gain; return fed(s.fs, ord, lt); };
    function zeroMax(s) {
      if (calcAt(s, 0).total >= 1) return 0;
      let lo = 0, hi = 2e6;
      if (calcAt(s, hi).total < 1) return hi;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (calcAt(s, m).total < 1) lo = m; else hi = m; }
      return lo;
    }
    const draw = ui.responsive(fig, (Wpx) => {
      const s = read(), W = s.W, r = calcAt(s, W), z = zeroMax(s);
      const divUsed = Math.min(s.div, W * s.tx), sale = W * s.tx - divUsed, divExtra = s.div - divUsed;
      const ord = W * s.pre + s.other, saleGain = sale * s.gain, ltAll = s.div + saleGain, basis = sale * (1 - s.gain), freeAmt = W * s.free;
      const compact = Wpx < 520, padL = compact ? 10 : 16, padR = compact ? 10 : 16, x0 = padL, x1 = Wpx - padR, wid = x1 - x0;
      let b = '', y = 18;
      /* A: what the withdrawal is made of */
      const tot = W + s.other || 1;
      b += S.text(x0, y, compact ? 'YOU TAKE OUT ' + k$(W) + (s.other ? ' + ' + k$(s.other) : '') : 'WHAT YOU TAKE OUT: ' + usd(W) + (s.other ? ' + ' + usd(s.other) + ' OTHER INCOME' : ''), 'cap');
      y += 10;
      const segsA = [[ord, 'f-info', 'income'], [divUsed, 'f-up o70', 'dividends'], [saleGain, 'f-up', 'gains'], [basis, 'f-vio', 'your money back'], [freeAmt, 'f-vio o70', 'Roth / HSA / cash']];
      let xa = x0;
      segsA.forEach(([v, c, lab]) => { if (v <= 0) return; const w = (v / tot) * wid; b += S.rect(xa, y, Math.max(0, w - 1), 20, c, 2); if (w > (compact ? 64 : 90)) b += S.text(xa + 6, y + 14, (compact ? k$(v) : usd(v)) + ' ' + lab, 'sm b on'); else if (w > 34) b += S.text(xa + 4, y + 14, k$(v), 'xs b on mono'); xa += w; });
      y += 20 + 30;
      /* B: income against the 2026 bands */
      const std = r.std, t0 = TAX.cg[s.fs][0], t15 = TAX.cg[s.fs][1];
      const xmax = Math.max(niceMax(Math.max(r.agi, std + t0) * 1.08), 50000);
      const X = SML.lin(0, xmax, x0, x1);
      b += S.text(x0, y - 8, compact ? 'HOW THE IRS COUNTS IT' : 'HOW THE IRS COUNTS IT (2026 ' + (s.fs === 'mfj' ? 'MARRIED, JOINT' : s.fs === 'hoh' ? 'HEAD OF HOUSEHOLD' : 'SINGLE') + ')', 'cap');
      const bandY = y, bandH = compact ? 22 : 24;
      const bands = [[0, std, 'f-shade2', compact ? 'Deduction 0%' : 'Standard deduction: 0%', 'ink'], [std, std + t0, 'f-up-t', compact ? 'Gains 0%' : 'Gains taxed 0%', 'up'], [std + t0, std + t15, 'f-acc-t', 'Gains 15%', 'acc'], [std + t15, Infinity, 'f-dn-t', 'Gains 20%', 'dn']];
      bands.forEach(([a, c, cls, lab, tc]) => { const xa2 = X(Math.min(a, xmax)), xb = X(Math.min(c, xmax)); if (xb - xa2 < 1) return; b += S.rect(xa2, bandY, xb - xa2, bandH, cls); if (xb - xa2 > lab.length * 6.6 + 10) b += S.text(xa2 + 6, bandY + bandH / 2 + 4, lab, 'sm b ' + tc); });
      const laneY = bandY + bandH + 10, laneH = compact ? 30 : 34;
      b += S.rect(x0, laneY, wid, laneH, 'f-surf s-line', 3);
      /* ordinary income split by rate */
      let cur = 0;
      if (ord > 0) {
        const cuts = [[std, 0]].concat(TAX.br[s.fs].map(([hi, rt]) => [std + hi, rt]));
        let lo = 0;
        cuts.forEach(([hi, rt]) => { const a = lo, c = Math.min(hi, ord); if (c > a) { const xa3 = X(a), xb = X(Math.min(c, xmax)); b += S.rect(xa3, laneY + 2, Math.max(0, xb - xa3 - 1), laneH - 4, 'f-info' + (rt === 0 ? ' o50' : ''), 2); if (xb - xa3 > 30) b += S.text((xa3 + xb) / 2, laneY + laneH / 2 + 4, Math.round(rt * 100) + '%', 'sm b on mono', 'middle'); } lo = hi; });
        cur = ord;
      }
      /* gains split by band */
      const gParts = [[r.ltDed + r.in0, 'f-up', '0%'], [r.in15, 'f-acc', '15%'], [r.in20, 'f-dn', '20%']];
      gParts.forEach(([v, cls, lab]) => { if (v <= 0) return; const xa3 = X(Math.min(cur, xmax)), xb = X(Math.min(cur + v, xmax)); b += S.rect(xa3, laneY + 2, Math.max(0, xb - xa3 - 1), laneH - 4, cls, 2); if (xb - xa3 > 30) b += S.text((xa3 + xb) / 2, laneY + laneH / 2 + 4, lab, 'sm b on mono', 'middle'); cur += v; });
      /* labels under lane */
      const ly = laneY + laneH + 16; let labR = -1e9, lyMax = ly;
      const place = (xs, txt, cls) => { const w = txt.length * 6.3; let x = Math.max(x0, Math.min(xs, x1 - w)), yy = ly; if (x < labR + 12) yy = ly + 15; lyMax = Math.max(lyMax, yy); b += S.text(x, yy, txt, cls); labR = Math.max(labR, x + w); };
      if (ord > 0) place(x0, compact ? 'income ' + k$(ord) + ', tax ' + k$(r.oTax) : 'ordinary income ' + usd(ord) + ' · tax ' + usd(r.oTax), 'sm ink');
      if (ltAll > 0) place(X(Math.min(ord, xmax)) + 2, compact ? 'gains+div ' + k$(ltAll) + ', tax ' + k$(r.cgTax) : 'gains and dividends ' + usd(ltAll) + ' · tax ' + usd(r.cgTax), 'sm up b');
      const ay = lyMax + 26;
      const nt = compact ? 3 : 5; for (let i = 0; i <= nt; i++) { const v = (xmax * i) / nt; b += S.line(X(v), ay - 12, X(v), ay - 8, 's-mut') + axisMoney(X(v), ay + 2, v, i === 0 ? 'start' : i === nt ? 'end' : 'middle'); }
      b += S.text(x1, ay + 16, 'income the IRS counts →', 'xs', 'end');
      y = ay + 36;
      /* C: federal tax as the withdrawal grows */
      b += S.text(x0, y, compact ? 'TAX AS YOU TAKE OUT MORE' : 'FEDERAL TAX AS YOU TAKE OUT MORE (SAME MIX)', 'cap');
      const cTop = y + 12, cH = compact ? 120 : 130, cBot = cTop + cH, cx0 = x0 + (compact ? 34 : 44);
      const wMax = niceMax(Math.max(W * 1.8, z * 1.3, 120000));
      const pts = []; let tMax = 0;
      for (let i = 0; i <= 80; i++) { const w = (wMax * i) / 80; const t = calcAt(s, w).total; pts.push([w, t]); tMax = Math.max(tMax, t); }
      const yt = SML.ticks(0, Math.max(tMax, 2000) * 1.05, 3); tMax = yt[yt.length - 1] < Math.max(tMax, 2000) ? yt[yt.length - 1] + (yt[1] - yt[0]) : yt[yt.length - 1];
      const XC = SML.lin(0, wMax, cx0, x1), YC = SML.lin(0, tMax, cBot, cTop);
      SML.ticks(0, tMax, 3).forEach((v) => { b += S.line(cx0, YC(v), x1, YC(v), 's-grid') + S.text(cx0 - 6, YC(v) + 4, k$(v), 'xs mono', 'end'); });
      b += S.area(pts.map(([w, t]) => [XC(w), YC(t)]), cBot, 'f-acc-t') + S.poly(pts.map(([w, t]) => [XC(w), YC(t)]), 's-acc w2');
      if (z > 0 && z < wMax) { b += S.line(XC(z), cTop, XC(z), cBot, 's-up w15 dash'); const zl = '$0 tax up to ' + k$(z); const zx = XC(z); b += S.text(zx + (zx > x1 - 130 ? -6 : 6), cTop + 12, zl, 'sm up b', zx > x1 - 130 ? 'end' : 'start'); }
      const cpx = XC(Math.min(W, wMax)), cpy = YC(r.total);
      b += S.circle(cpx, cpy, 5.5, 'f-acc s-surf w2') + S.text(cpx + (cpx > x1 - 110 ? -9 : 9), cpy - 9, 'you: ' + k$(r.total), 'sm acc b', cpx > x1 - 110 ? 'end' : 'start');
      if (hover != null) { const hw = SML.clamp(hover, 0, wMax), ht = calcAt(s, hw).total; const hx = XC(hw); b += S.line(hx, cTop, hx, cBot, 's-ink w1 dash2') + S.circle(hx, YC(ht), 4, 'f-ink'); const lab = 'take ' + k$(hw) + ' → tax ' + usd(ht) + (hw > 0 ? ' (' + pct(ht / (hw + s.other || 1)) + ')' : ''); const lx = hx > (x0 + x1) / 2 ? hx - 8 : hx + 8; b += S.rect(hx > (x0 + x1) / 2 ? lx - lab.length * 6.3 - 8 : lx - 4, cTop + 18, lab.length * 6.3 + 12, 20, 'f-surf s-line', 3) + S.text(lx, cTop + 32, lab, 'sm ink mono', hx > (x0 + x1) / 2 ? 'end' : 'start'); }
      const nc = compact ? 3 : 4; for (let i = 0; i <= nc; i++) { const v = (wMax * i) / nc; b += axisMoney(XC(v), cBot + 14, v, i === nc ? 'end' : 'middle'); }
      b += S.text(x1, cBot + 28, 'yearly withdrawal →', 'xs', 'end');
      const H = cBot + 34;
      fig.innerHTML = S.wrap(Wpx, H, `A ${usd(W)} withdrawal split into income and non-income parts, placed against the 2026 tax bands, with federal tax ${usd(r.total)}`, b);
      fig.dataset.cx0 = cx0; fig.dataset.cx1 = x1; fig.dataset.wmax = wMax; fig.dataset.ctop = cTop;
      /* readouts */
      const eff = r.total / (W + s.other || 1), stTax = s.stRate * Math.max(0, r.agi - r.std);
      sv(id + '-w', usd(W)); sv(id + '-agi', usd(r.agi)); sv(id + '-tax', usd(r.total), r.total < 1 ? 'up' : '');
      sv(id + '-eff', pct(eff), eff < 0.05 ? 'up' : eff < 0.12 ? '' : 'dn'); sv(id + '-stt', usd(stTax)); sv(id + '-zero', z >= 2e6 ? '$2M+' : z < 1 ? '$0' : usd(Math.floor(z / 100) * 100), z < 1 ? 'dn' : 'up');
      const notIncome = basis + freeAmt;
      let m;
      const reinv = divExtra > 0 ? ` ${usd(divExtra)} of dividends you reinvest still count as income.` : '';
      if (r.total < 1) m = ui.msg('up', '$0 federal', `All ${usd(W)} comes out with no federal income tax. ${usd(notIncome)} is not income at all, and the ${usd(r.agi)} that counts fits under the ${usd(std)} standard deduction plus the 0% band for gains and dividends.${reinv} On marketplace health insurance, that ${usd(r.agi)} also sets your subsidy.`);
      else if (r.cgTax + r.niit > r.oTax) m = ui.msg('', 'Gains drive it', `Most of the ${usd(r.total)} is tax on gains and dividends above the 0% band. Selling higher-basis shares, or taking a little more from Roth or cash, would lower it.${reinv}`);
      else if (s.pre > 0.5) m = ui.msg('info', 'IRA money', `Traditional IRA and 401(k) money is ordinary income, so it is taxed at ${Math.round(margRate(r.ordTI, TAX.br[s.fs]) * 100)}% at the margin. Converting some to Roth in low-income years spreads that out (see the Roth ladder lesson).`);
      else m = ui.msg('', 'Low rate', `You pay ${usd(r.total)}, ${pct(eff)} of what you take out. Ordinary income uses the deduction and the 10-12% brackets first, then gains stack on top.`);
      $id(id + '-msg').innerHTML = m;
    });
    fig.addEventListener('pointermove', (e) => {
      const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      const cx0 = +fig.dataset.cx0, cx1 = +fig.dataset.cx1, wMax = +fig.dataset.wmax, cTop = +fig.dataset.ctop;
      if (p.y < cTop - 14 || p.x < cx0 - 4) { if (hover != null) { hover = null; draw(true); } return; }
      hover = SML.clamp(((p.x - cx0) / (cx1 - cx0)) * wMax, 0, wMax); draw(true);
    });
    fig.addEventListener('pointerleave', () => { if (hover != null) { hover = null; draw(true); } });
  };

  /* =====================================================================
     2. gainHarvest: fill the 0% band with gains, or the 12% bracket with conversions
     ===================================================================== */
  /* 2026 marketplace: share of income expected toward the benchmark silver plan (Rev. Proc. 2025-25) */
  function acaPct(p) {
    if (p < 1.33) return 0.021;
    if (p < 1.5) return 0.0314 + ((p - 1.33) / 0.17) * (0.0419 - 0.0314);
    if (p < 2) return 0.0419 + ((p - 1.5) / 0.5) * (0.066 - 0.0419);
    if (p < 2.5) return 0.066 + ((p - 2) / 0.5) * (0.0844 - 0.066);
    if (p < 3) return 0.0844 + ((p - 2.5) / 0.5) * (0.0996 - 0.0844);
    return 0.0996;
  }
  /* what you pay for the benchmark plan after the premium tax credit (no credit above 400% FPL) */
  function netPremium(magi, hh, bench) { const p = magi / (FPL[hh] || FPL[2]); if (p > 4) return bench; return Math.min(bench, acaPct(p) * magi); }
  SML.fireNetPremium = netPremium;

  SML.widgets.gainHarvest = function (root) {
    const id = SML.uid('fgh');
    root.innerHTML = `
      <div class="wg-bar ftx-bar">${ui.seg(id + '-fs', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married, joint' }], 'mfj', 'Filing status')}<span class="grow"></span>${ui.chips(id + '-aca', [{ k: 'on', label: 'I buy marketplace health insurance', color: 'var(--violet)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="ftx-legend" aria-hidden="true"><span><i style="--c:var(--info)"></i>Other income</span><span><i style="--c:var(--violet)"></i>Roth conversion</span><span><i style="--c:var(--up)"></i>Gains you spend</span><span><i style="--c:color-mix(in srgb,var(--up) 45%,var(--surface))"></i>Gains you harvest</span><span><i style="--c:var(--accent)"></i>Federal tax</span><span><i style="--c:color-mix(in srgb,var(--violet) 45%,var(--surface))"></i>Health premium you pay</span></div>
      <div class="wg-ctrl ftx-ctrl">
        ${ui.slider({ id: id + '-sp', label: 'Spending from taxable account', min: 0, max: 150000, step: 1000, value: 60000, fmt: k$ })}
        ${ui.slider({ id: id + '-gs', label: 'Gain share of those sales', min: 0, max: 100, step: 5, value: 40, fmt: 'pct' })}
        ${ui.slider({ id: id + '-oth', label: 'Other income (interest, part-time)', min: 0, max: 60000, step: 1000, value: 4000, fmt: k$ })}
        ${ui.slider({ id: id + '-cv', label: 'Roth conversion this year', min: 0, max: 150000, step: 1000, value: 20000, fmt: k$ })}
        ${ui.slider({ id: id + '-hv', label: 'Extra gains harvested', min: 0, max: 150000, step: 1000, value: 30000, fmt: k$ })}
        ${ui.slider({ id: id + '-later', label: 'Your tax rate later (RMD years)', min: 10, max: 32, step: 1, value: 22, fmt: 'pct' })}
        <span id="${id}-w-bench">${ui.slider({ id: id + '-bench', label: 'Benchmark silver plan, per year', min: 4000, max: 40000, step: 500, value: 18000, fmt: k$ })}</span>
        <div class="ftx-wide" id="${id}-w-hh"><span class="ftx-lab">Household for health insurance</span>${ui.seg(id + '-hh', [{ v: '1', label: '1' }, { v: '2', label: '2' }, { v: '3', label: '3' }, { v: '4', label: '4' }], '2', 'Household size')}</div>
      </div>
      <div class="wg-actions"><button type="button" class="btn btn-g" id="${id}-fill0">Fill the 0% band with gains</button><button type="button" class="btn btn-g" id="${id}-fill12">Convert to the top of 12%</button><button type="button" class="btn btn-g" id="${id}-reset">Reset</button></div>
      <div class="wg-read">${ui.stat('Federal tax', id + '-tax', 'hl')}${ui.stat('Extra health premium', id + '-aca-v')}${ui.stat('0% room left', id + '-room')}${ui.stat('Next $1K converted costs', id + '-mg')}${ui.stat('Tax from both moves', id + '-tcv')}${ui.stat('Rough net saving', id + '-save')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Gain harvesting: sell winners and buy them straight back. Wash-sale rules only apply to losses, so the new, higher cost basis sticks. Conversions are ordinary income, so they also push gains up into the 15% band. Health premium: your share of the benchmark silver plan after the 2026 premium tax credit (2.10% to 9.96% of income, nothing above 400% of the 2025 poverty guideline); under about 138% most states offer Medicaid instead. Use your own benchmark premium from HealthCare.gov. "Net saving" compares tax now plus the extra premium with the rate you expect later on the converted money and 15% later on the harvested gains; it ignores growth.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const reset = () => { st.setSeg(id + '-fs', 'mfj'); st.set(id + '-sp', 60000); st.set(id + '-gs', 40); st.set(id + '-oth', 4000); st.set(id + '-cv', 20000); st.set(id + '-hv', 30000); st.set(id + '-later', 22); st.set(id + '-bench', 18000); st.setSeg(id + '-hh', '2'); draw(); };
    function read() {
      const fs = st.seg(id + '-fs') || 'mfj', sp = st.n(id + '-sp'), gs = st.n(id + '-gs') / 100, oth = st.n(id + '-oth');
      return { fs, sp, gs, oth, cv: st.n(id + '-cv'), hv: st.n(id + '-hv'), later: st.n(id + '-later') / 100, aca: st.on(id + '-aca', 'on'), hh: Number(st.seg(id + '-hh') || 2), bench: st.n(id + '-bench') };
    }
    $id(id + '-fill0').addEventListener('click', () => { const s = read(); const room = Math.max(0, TAX.std[s.fs] + TAX.cg[s.fs][0] - (s.oth + s.cv + s.sp * s.gs + s.hv)); st.set(id + '-hv', Math.min(150000, Math.floor((s.hv + room) / 1000) * 1000)); draw(); });
    $id(id + '-fill12').addEventListener('click', () => { const s = read(); const top12 = TAX.std[s.fs] + TAX.br[s.fs][1][0]; st.set(id + '-cv', SML.clamp(Math.floor((top12 - s.oth) / 1000) * 1000, 0, 150000)); draw(); });
    $id(id + '-reset').addEventListener('click', reset);
    const draw = ui.responsive(fig, (Wpx) => {
      const s = read(), std = TAX.std[s.fs], t0 = TAX.cg[s.fs][0], top12 = TAX.br[s.fs][1][0];
      $id(id + '-w-bench').classList.toggle('ftx-hide', !s.aca); $id(id + '-w-hh').classList.toggle('ftx-hide', !s.aca);
      const spG = s.sp * s.gs;
      const base = fed(s.fs, s.oth, spG), withCv = fed(s.fs, s.oth + s.cv, spG), all = fed(s.fs, s.oth + s.cv, spG + s.hv);
      const tCv = withCv.total - base.total, tHv = all.total - withCv.total;
      const room = Math.max(0, std + t0 - all.agi);
      const fpl = FPL[s.hh] || FPL[2], cliff = 4 * fpl, magi = all.agi;
      const prem = (m) => (s.aca ? netPremium(m, s.hh, s.bench) : 0);
      const pBase = prem(base.agi), pCv = prem(withCv.agi), pAll = prem(all.agi), acaCost = pAll - pBase;
      const mgTax = fed(s.fs, s.oth + s.cv + 1000, spG + s.hv).total - all.total, mgAca = prem(magi + 1000) - pAll, mg = mgTax + mgAca;
      const save = s.cv * s.later + s.hv * 0.15 - (all.total - base.total) - acaCost;
      const compact = Wpx < 520, x0 = compact ? 10 : 16, x1 = Wpx - (compact ? 10 : 16), wid = x1 - x0;
      const xmax = niceMax(Math.max(all.agi, std + t0, s.aca ? cliff : 0) * 1.08);
      const X = SML.lin(0, xmax, x0, x1);
      let b = '', y = 18;
      b += S.text(x0, y, compact ? 'INCOME VS THE 2026 BANDS' : 'THIS YEAR’S INCOME AGAINST THE 2026 BANDS', 'cap');
      const bandY = y + 26, bandH = compact ? 20 : 24;
      [[0, std, 'f-shade2', compact ? '0%' : 'Deduction 0%', 'ink'], [std, std + t0, 'f-up-t', compact ? 'Gains 0%' : 'Gains taxed 0%', 'up'], [std + t0, xmax, 'f-acc-t', 'Gains 15%', 'acc']].forEach(([a, c, cls, lab, tc]) => { const xa = X(a), xb = X(Math.min(c, xmax)); if (xb - xa < 1) return; b += S.rect(xa, bandY, xb - xa, bandH, cls); if (xb - xa > lab.length * 6.6 + 10) b += S.text(xa + 6, bandY + bandH / 2 + 4, lab, 'sm b ' + tc); });
      const laneY = bandY + bandH + 8, laneH = compact ? 32 : 38;
      b += S.rect(x0, laneY, wid, laneH, 'f-surf s-line', 3);
      let cur = 0;
      const seg = (v, cls, lab) => { if (v <= 0) return; const xa = X(Math.min(cur, xmax)), xb = X(Math.min(cur + v, xmax)); b += S.rect(xa, laneY + 2, Math.max(0, xb - xa - 1), laneH - 4, cls, 2); if (xb - xa > (compact ? 40 : 56)) b += S.text((xa + xb) / 2, laneY + laneH / 2 + 4, compact ? k$(v) : lab + ' ' + k$(v), 'sm b on', 'middle'); else if (xb - xa > 30) b += S.text((xa + xb) / 2, laneY + laneH / 2 + 4, k$(v), 'xs b on mono', 'middle'); cur += v; };
      seg(s.oth, 'f-info', 'other'); seg(s.cv, 'f-vio', 'convert'); seg(spG, 'f-up', 'spend'); seg(s.hv, 'f-up o50', 'harvest');
      /* markers */
      const mk = (v, cls, tcls, lab, row) => { if (v > xmax) return; const x = X(v); b += S.line(x, bandY - 4, x, laneY + laneH + 6, cls); const ty = row ? laneY + laneH + 18 + (row - 1) * 14 : bandY - 8; const anc = x > x1 - 120 ? 'end' : 'start'; b += S.text(x + (anc === 'end' ? -4 : 4), ty, lab, tcls, anc); };
      mk(std + top12, 's-info w15 dash2', 'xs info b', compact ? 'top of 12%' : 'top of the 12% bracket', 1);
      mk(std + t0, 's-up w15 dash2', 'xs up b', compact ? 'end of 0%' : 'end of the 0% gains band', 2);
      if (s.aca) mk(cliff, 's-vio w2 dash', 'xs vio b', compact ? 'subsidy line' : 'marketplace subsidy line (400% FPL)', 3);
      let ay = laneY + laneH + 18 + 3 * 14 + 8;
      const nt = compact ? 3 : 5; for (let i = 0; i <= nt; i++) { const v = (xmax * i) / nt; b += axisMoney(X(v), ay, v, i === 0 ? 'start' : i === nt ? 'end' : 'middle'); }
      ay += 18;
      /* tax (+ health premium) bars: before vs after */
      b += S.text(x0, ay + 8, s.aca ? (compact ? 'TAX + HEALTH PREMIUM' : 'FEDERAL TAX + YOUR SHARE OF THE HEALTH PREMIUM') : 'FEDERAL TAX THIS YEAR', 'cap');
      const tb = ay + 18;
      const rows = [['Spending only', base.total, pBase, 'f-shade2'], ['+ conversion', withCv.total, pCv, 'f-vio'], ['+ harvest', all.total, pAll, 'f-up']];
      const tMax = Math.max(1000, ...rows.map((r) => r[1] + r[2])) * 1.12, TX = SML.lin(0, tMax, x0 + (compact ? 92 : 128), x1 - (compact ? 56 : 120));
      rows.forEach(([lab, tx, pr], i) => {
        const yy = tb + i * 24; b += S.text(x0, yy + 13, lab, 'sm ink');
        const w1 = TX(tx) - TX(0), w2 = TX(tx + pr) - TX(tx);
        b += S.rect(TX(0), yy + 2, Math.max(2, w1), 15, 'f-acc', 2);
        if (s.aca && pr > 0) b += S.rect(TX(tx), yy + 2, Math.max(0, w2), 15, 'f-vio-t s-vio w1', 2);
        const lab2 = s.aca ? (compact ? k$(tx + pr) : usd(tx) + ' + ' + usd(pr)) : usd(tx);
        b += S.text(Math.max(TX(tx + pr), TX(0) + 2) + 6, yy + 14, lab2, 'sm mono b ink');
      });
      const H = tb + 3 * 24 + 6;
      fig.innerHTML = S.wrap(Wpx, H, 'Other income, a Roth conversion, spending gains and harvested gains stacked against the 2026 standard deduction, 12% bracket, 0% gains band and the marketplace subsidy line, with the tax and health premium for each step', b);
      sv(id + '-tax', usd(all.total), all.total < 1 ? 'up' : '');
      sv(id + '-aca-v', s.aca ? F.susd(Math.round(acaCost), 0) : 'n/a', acaCost > 1 ? 'dn' : '');
      sv(id + '-tcv', usd(tCv + tHv), tCv + tHv < 1 ? 'up' : 'dn');
      sv(id + '-room', usd(room), room > 0 ? 'up' : ''); sv(id + '-mg', usd(mg), mg > 220 ? 'dn' : '');
      sv(id + '-save', F.susd(Math.round(save), 0), save >= 0 ? 'up' : 'dn');
      const pctFpl = (m) => Math.round((m / fpl) * 100) + '%';
      const medi = s.aca && base.agi < 1.38 * fpl ? ` Before the moves your income was ${pctFpl(base.agi)} of the poverty line: in most states that means Medicaid instead of a marketplace plan.` : '';
      let m;
      if (s.aca && magi > cliff) m = ui.msg('dn', 'Subsidy cliff', `Your income the marketplace counts is ${usd(magi)}, above the ${usd(cliff)} line for a household of ${s.hh}. For 2026 coverage the whole premium subsidy stops there, so you pay the full ${usd(s.bench)}: ${usd(acaCost)} more than before. Trim the conversion or harvest.${medi}`);
      else if (s.aca && acaCost > 300) m = ui.msg('vio', 'Hidden tax', `Federal tax is ${usd(all.total)}, but your share of the benchmark health plan rises from ${usd(pBase)} to ${usd(pAll)}: ${usd(acaCost)} more, about ${Math.round((acaCost / Math.max(1, s.cv + s.hv)) * 100)}% of the ${usd(s.cv + s.hv)} you moved. Between about 150% and 400% of the poverty line, each extra dollar of income costs roughly 10-18 cents of subsidy.${medi}`);
      else if (mg > 220) m = ui.msg('dn', 'Stacking cost', `Each extra $1,000 converted now costs ${usd(mg)}: the conversion is taxed and it also pushes gains out of the 0% band into 15%. That is a ${Math.round(mg / 10)}% marginal rate.`);
      else if (room > 1000 && s.hv === 0 && s.cv === 0) m = ui.msg('up', 'Free room', `You still have ${usd(room)} of room in the 0% band. Harvest that much gain, or convert some IRA money, and pay little or nothing in federal tax.`);
      else if (room > 1000) m = ui.msg('up', 'Room left', `${usd(room)} of gains could still be realized at 0% this year.`);
      else m = ui.msg('', 'Band full', `The 0% band is used up. Total federal tax ${usd(all.total)}${s.cv ? `, of which ${usd(tCv)} comes from the conversion` : ''}.`);
      $id(id + '-msg').innerHTML = m;
    });
  };

  /* =====================================================================
     3. accessLadder: money out before 59½
     ===================================================================== */
  function sepPayment(bal, age, rate, method) {
    const n = SLE[Math.min(59, Math.max(30, Math.round(age)))];
    if (method === 'rmd') return bal / n;
    const r = rate; return r === 0 ? bal / n : (bal * r) / (1 - Math.pow(1 + r, -n));
  }
  SML.sepPayment = sepPayment;
  SML.widgets.accessLadder = function (root) {
    const id = SML.uid('fal');
    const STR = [{ v: 'none', label: 'Taxable + Roth basis only' }, { v: 'ladder', label: 'Roth conversion ladder' }, { v: 'sepp', label: '72(t) payments' }, { v: 'r55', label: 'Rule of 55' }];
    root.innerHTML = `
      <div class="wg-bar ftx-bar"><span class="wg-title">Bridge</span>${ui.seg(id + '-str', STR, 'ladder', 'Early access method')}</div>
      <div class="wg-fig"></div>
      <div class="ftx-legend" aria-hidden="true"><span><i style="--c:var(--info)"></i>Taxable account</span><span><i style="--c:var(--violet)"></i>Roth contributions</span><span><i style="--c:var(--up)"></i>Seasoned conversions</span><span><i style="--c:var(--accent)"></i>72(t) payments</span><span><i style="--c:var(--ink)"></i>401(k) via Rule of 55</span><span><i style="--c:var(--down)"></i>10% penalty draw or gap</span></div>
      <div class="wg-ctrl ftx-ctrl">
        ${ui.slider({ id: id + '-age', label: 'Retire at age', min: 35, max: 58, step: 1, value: 45, fmt: 'num' })}
        ${ui.slider({ id: id + '-sp', label: 'Spending per year', min: 20000, max: 150000, step: 1000, value: 50000, fmt: k$ })}
        ${ui.slider({ id: id + '-tx', label: 'Taxable brokerage', min: 0, max: 2000000, step: 10000, value: 250000, fmt: k$ })}
        ${ui.slider({ id: id + '-rb', label: 'Roth IRA contributions (basis)', min: 0, max: 300000, step: 5000, value: 60000, fmt: k$ })}
        ${ui.slider({ id: id + '-pt', label: '401(k) / traditional IRA', min: 0, max: 3000000, step: 10000, value: 900000, fmt: k$ })}
        <span id="${id}-w-cv">${ui.slider({ id: id + '-cv', label: 'Convert to Roth each year', min: 0, max: 150000, step: 1000, value: 50000, fmt: k$ })}</span>
        <span id="${id}-w-rate">${ui.slider({ id: id + '-rate', label: '72(t) interest rate', min: 1, max: 6, step: 0.1, value: 5, fmt: 'pct1' })}</span>
        <span id="${id}-w-meth" class="ftx-wide"><span class="ftx-lab">72(t) method</span>${ui.seg(id + '-meth', [{ v: 'amort', label: 'Fixed amortization' }, { v: 'rmd', label: 'RMD method' }], 'amort', '72(t) method')}</span>
        ${ui.slider({ id: id + '-ret', label: 'Real return per year', min: 0, max: 7, step: 0.5, value: 4, fmt: 'pct1' })}
        <span class="ftx-wide"><span class="ftx-lab">Filing status for the conversion tax</span>${ui.seg(id + '-fs', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married, joint' }], 'mfj', 'Filing status')}</span>
      </div>
      <div class="wg-read">${ui.stat('Penalty-free?', id + '-ok', 'hl')}${ui.stat('Years short', id + '-gap')}${ui.stat('10% penalties', id + '-pen')}${ui.stat('Taxable left at 60', id + '-tl')}${ui.stat('401(k)/IRA left at 60', id + '-pl')}${ui.stat('', id + '-x')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Today’s dollars, one withdrawal per year, growth at the real return you pick. Spending is paid in this order: 72(t) payment, taxable account, Roth contributions, conversions older than five tax years, 401(k) under the Rule of 55, then an early IRA withdrawal with the 10% penalty. Income tax on withdrawals is left out except the conversion tax shown. The 5-year clock for each conversion starts on January 1 of the year you convert. Life expectancy: IRS Single Life Table.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    function read() {
      return { str: st.seg(id + '-str') || 'ladder', age: st.n(id + '-age'), sp: st.n(id + '-sp'), tx: st.n(id + '-tx'), rb: st.n(id + '-rb'), pt: st.n(id + '-pt'), cv: st.n(id + '-cv'), rate: st.n(id + '-rate') / 100, meth: st.seg(id + '-meth') || 'amort', ret: st.n(id + '-ret') / 100, fs: st.seg(id + '-fs') || 'mfj' };
    }
    function sim(s) {
      let T = s.tx, RB = s.rb, P = s.pt, pen = 0, extra = 0;
      const pending = [], rows = [];
      const r55ok = s.str === 'r55' && s.age >= 55;
      const fixedPay = s.str === 'sepp' ? sepPayment(P, s.age, s.rate, s.meth) : 0;
      for (let a = s.age; a <= 59; a++) {
        const rec = { a, sepp: 0, tax: 0, rb: 0, conv: 0, k: 0, pen: 0, short: 0, cin: 0 };
        let need = s.sp;
        if (s.str === 'ladder' && P > 0 && s.cv > 0) { const c = Math.min(s.cv, P); P -= c; pending.push({ avail: a + 5, amt: c }); rec.cin = c; }
        if (s.str === 'sepp' && P > 0) { const pay = Math.min(P, s.meth === 'rmd' ? P / SLE[a] : fixedPay); P -= pay; rec.sepp = Math.min(pay, need); need -= rec.sepp; const ex = pay - rec.sepp; if (ex > 0) { T += ex; extra += ex; } }
        let u = Math.min(T, need); T -= u; rec.tax = u; need -= u;
        u = Math.min(RB, need); RB -= u; rec.rb = u; need -= u;
        for (const p of pending) { if (need <= 0) break; if (p.avail <= a && p.amt > 0) { const v = Math.min(p.amt, need); p.amt -= v; rec.conv += v; need -= v; } }
        if (r55ok && need > 0) { u = Math.min(P, need); P -= u; rec.k = u; need -= u; }
        if (need > 0 && P > 0) { const gross = Math.min(P, need / 0.9); P -= gross; rec.pen = gross * 0.9; pen += gross * 0.1; need -= rec.pen; }
        if (need > 1) rec.short = need;
        rows.push(rec);
        T *= 1 + s.ret; P *= 1 + s.ret;
      }
      const leftConv = pending.reduce((x, p) => x + p.amt, 0);
      return { rows, pen, T, P, fixedPay, extra, leftConv, r55ok };
    }
    const draw = ui.responsive(fig, (Wpx) => {
      const s = read();
      $id(id + '-w-cv').classList.toggle('ftx-hide', s.str !== 'ladder');
      $id(id + '-w-rate').classList.toggle('ftx-hide', s.str !== 'sepp' || s.meth === 'rmd');
      $id(id + '-w-meth').classList.toggle('ftx-hide', s.str !== 'sepp');
      const R = sim(s), rows = R.rows, n = rows.length;
      const compact = Wpx < 520, x0 = compact ? 40 : 52, x1 = Wpx - (compact ? 10 : 16);
      const top = 26, ch = compact ? 170 : 200, bot = top + ch;
      const vmax = niceMax(Math.max(s.sp, ...rows.map((r) => r.cin)) * 1.1);
      const Y = SML.lin(0, vmax, bot, top);
      const slot = (x1 - x0) / Math.max(n, 1), bw = Math.max(4, Math.min(28, slot * 0.7));
      const XC = (i) => x0 + slot * (i + 0.5);
      let b = S.text(x0 - (compact ? 34 : 44), 14, compact ? 'WHO PAYS, AGE ' + s.age + ' TO 59' : 'HOW EACH YEAR’S SPENDING IS PAID, AGE ' + s.age + ' TO 59', 'cap');
      SML.ticks(0, vmax, 3).forEach((v) => { b += S.line(x0, Y(v), x1, Y(v), 's-grid') + S.text(x0 - 6, Y(v) + 4, k$(v), 'xs mono', 'end'); });
      b += S.line(x0, Y(s.sp), x1, Y(s.sp), 's-mut dash2') + S.text(x1, Y(s.sp) - 5, 'spending ' + k$(s.sp), 'xs b', 'end');
      rows.forEach((r, i) => {
        let yy = bot; const cx = XC(i);
        [[r.sepp, 'f-acc'], [r.tax, 'f-info'], [r.rb, 'f-vio'], [r.conv, 'f-up'], [r.k, 'f-ink'], [r.pen, 'f-dn']].forEach(([v, cls]) => { if (v <= 0) return; const h = Y(0) - Y(v); b += S.rect(cx - bw / 2, yy - h, bw, Math.max(0, h - 0.6), cls, 1); yy -= h; });
        if (r.short > 0) { const h = Y(0) - Y(r.short); b += S.rect(cx - bw / 2, yy - h, bw, h, 'nf s-dn w15 dash2', 1); }
        const lab = (compact ? (i % 5 === 0 || i === n - 1) : (n <= 16 || i % 2 === 0 || i === n - 1));
        if (lab) b += S.text(cx, bot + 14, String(r.a), 'xs mono', 'middle');
      });
      b += S.line(x0, bot + 0.5, x1, bot + 0.5, 's-line');
      let H = bot + 24;
      /* conversion lane */
      if (s.str === 'ladder') {
        const ly = bot + 30, lh = 12;
        b += S.text(x0 - (compact ? 34 : 44), ly - 6, compact ? 'CONVERSIONS' : 'ROTH CONVERSIONS EACH YEAR', 'cap');
        rows.forEach((r, i) => { if (r.cin > 0) b += S.rect(XC(i) - bw / 2, ly, bw, lh, 'f-vio', 2); });
        if (rows[0] && rows[0].cin > 0) b += S.text(Math.min(XC(n - 1) + bw / 2, x1), ly - 6, k$(rows[0].cin) + ' a year', 'xs vio b', 'end');
        if (rows[0] && rows[0].cin > 0 && n > 5) { const xa = XC(0), xb = XC(5); b += S.arrow(xa, ly + lh + 12, xb, ly + lh + 12, 'vio', 6) + S.text((xa + xb) / 2, ly + lh + 26, compact ? '5-year wait' : 'each conversion waits 5 tax years', 'xs vio b', 'middle'); }
        H = ly + lh + 34;
      } else if (s.str === 'sepp') {
        const ly = bot + 34;
        b += S.line(XC(0) - bw / 2, ly, XC(n - 1) + bw / 2, ly, 's-acc w3') + S.text(XC(0) - bw / 2, ly + 16, compact ? '72(t) locked in until 59½' : `72(t) payments locked in for ${Math.max(5, Math.ceil(59.5 - s.age))} years: change them and the 10% penalty comes back on every payment`, 'xs acc b');
        H = ly + 24;
      } else if (s.str === 'r55') {
        const ly = bot + 34;
        b += S.text(x0, ly + 4, R.r55ok ? 'Left the job at ' + s.age + ': that employer’s 401(k) is open now' : 'Rule of 55 needs you to leave the job in or after the year you turn 55', 'xs b ' + (R.r55ok ? 'ink' : 'dn'));
        H = ly + 14;
      }
      fig.innerHTML = S.wrap(Wpx, H, `Bars for each year from age ${s.age} to 59 showing which account pays for spending under the ${STR.find((x) => x.v === s.str).label} approach`, b);
      const gapYears = rows.filter((r) => r.pen > 0 || r.short > 0).length;
      sv(id + '-ok', gapYears ? 'No' : 'Yes', gapYears ? 'dn' : 'up');
      sv(id + '-gap', String(gapYears), gapYears ? 'dn' : 'up');
      sv(id + '-pen', usd(R.pen), R.pen > 0 ? 'dn' : 'up');
      sv(id + '-tl', usd(R.T)); sv(id + '-pl', usd(R.P));
      const xs = root.querySelector('#' + id + '-x').previousElementSibling;
      if (s.str === 'ladder') { xs.textContent = 'Tax on each conversion'; const t = fed(s.fs, s.cv, 0).total; sv(id + '-x', usd(t), t < 1 ? 'up' : ''); }
      else if (s.str === 'sepp') { xs.textContent = s.meth === 'amort' ? '72(t) payment, fixed' : '72(t) payment, year 1'; sv(id + '-x', usd(R.fixedPay), 'acc'); }
      else if (s.str === 'r55') { xs.textContent = 'Rule of 55'; sv(id + '-x', R.r55ok ? 'Open' : 'Not yet', R.r55ok ? 'up' : 'dn'); }
      else { xs.textContent = 'Roth basis left'; sv(id + '-x', usd(Math.max(0, s.rb - rows.reduce((x, r) => x + r.rb, 0)))); }
      let m;
      const firstGap = rows.find((r) => r.pen > 0 || r.short > 0);
      if (!gapYears) m = ui.msg('up', 'Bridged', `Every year from ${s.age} to 59 is paid without a penalty.${s.str === 'ladder' ? ` The taxable account and Roth contributions carry the first five years while the first conversion seasons.` : s.str === 'sepp' ? ` The 72(t) schedule pays ${usd(R.fixedPay || rows[0].sepp)} a year and must not change until ${s.age + 5 > 59.5 ? 'age ' + (s.age + 5) : '59½'}.` : ''}`);
      else if (s.str === 'r55' && !R.r55ok) m = ui.msg('dn', 'Too early', `Retiring at ${s.age} is before 55, so the Rule of 55 does not apply. Try the Roth ladder or 72(t) payments instead.`);
      else if (s.str === 'ladder' && firstGap && firstGap.a < s.age + 5) m = ui.msg('dn', 'Five-year gap', `Conversions need five tax years to season. At age ${firstGap.a} the taxable account and Roth contributions run out before the first conversion is ready. Save more in taxable or start converting before you quit.`);
      else m = ui.msg('dn', 'Short', `${gapYears} year${gapYears === 1 ? '' : 's'} need early IRA withdrawals with the 10% penalty (${usd(R.pen)} in all), starting at age ${firstGap.a}. Raise the conversions, spend less, or add a second bridge.`);
      $id(id + '-msg').innerHTML = m;
    });
  };

  /* =====================================================================
     Lessons: course fi-tax
     ===================================================================== */
  const SRC = {
    rp: { t: 'IRS Rev. Proc. 2025-32: 2026 brackets, standard deduction and capital gains thresholds', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    t409: { t: 'IRS Topic 409: Capital gains and losses', u: 'https://www.irs.gov/taxtopics/tc409' },
    niit: { t: 'IRS Topic 559: Net investment income tax', u: 'https://www.irs.gov/taxtopics/tc559' },
    rp25: { t: 'IRS Rev. Proc. 2025-25: 2026 marketplace required contribution percentages', u: 'https://www.irs.gov/pub/irs-drop/rp-25-25.pdf' },
    fpl: { t: 'HealthCare.gov: Federal poverty level', u: 'https://www.healthcare.gov/glossary/federal-poverty-level-fpl/' },
    sepp: { t: 'IRS: Substantially equal periodic payments (72(t))', u: 'https://www.irs.gov/retirement-plans/substantially-equal-periodic-payments' },
    exc: { t: 'IRS: Exceptions to tax on early distributions', u: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions' },
    five: { t: 'Schwab: The five-year rules for Roth accounts', u: 'https://www.schwab.com/learn/story/what-to-know-about-five-year-rule-roths' },
    p969: { t: 'IRS Publication 969: Health savings accounts', u: 'https://www.irs.gov/publications/p969' },
    sen: { t: 'IRS: One Big Beautiful Bill Act deductions for working Americans and seniors', u: 'https://www.irs.gov/newsroom/one-big-beautiful-bill-act-tax-deductions-for-working-americans-and-seniors' },
  };

  SML.lessons.push({
    id: 'l-fire-tax',
    course: 'fi-tax',
    order: 1,
    title: 'How FIRE withdrawals are taxed',
    mins: 9,
    level: 'Intermediate',
    summary: 'Which dollars count as income, and how gains stack on the 0% band.',
    idea: 'Only the gain in a taxable sale counts as income, and a couple can realize about $131,000 of long-term gains at 0%.',
    widget: 'fireTaxCalc',
    try: 'Pick an example, then move the mix sliders and watch which dollars count as income. Hover the lower chart to try bigger withdrawals.',
    body: [
      '<h3>Three kinds of money come out</h3><p>When you live off your portfolio, each dollar comes from one of three places, and the IRS treats them very differently.</p><ul><li><b>Taxable brokerage account.</b> When you sell, only the <b>gain</b> counts as income. If you sell $10,000 of shares you bought for $6,000, $4,000 is gain and $6,000 is your own money coming back. Held more than a year, that gain is a long-term gain with its own low rates.</li><li><b>Traditional 401(k) or IRA.</b> Every dollar you take out is ordinary income, taxed like a paycheck. Before 59½ there can also be a 10% penalty (see <a href="#l-early-access">money out before 59½</a>).</li><li><b>Roth IRA, HSA for medical bills, cash.</b> Not income at all, if you follow the rules.</li></ul>',
      '<h3>The 2026 numbers that matter</h3><ul><li><b>Standard deduction:</b> $16,100 single, $32,200 married filing jointly, $24,150 head of household. That much income is taxed at 0%.</li><li><b>Low ordinary brackets:</b> 10% and 12% cover taxable income up to $50,400 single or $100,800 married filing jointly.</li><li><b>Long-term gains and qualified dividends:</b> 0% while your taxable income is up to $49,450 single, $98,900 married or $66,200 head of household. 15% above that, 20% above $545,500 single or $613,700 married.</li><li><b>Net investment income tax:</b> an extra 3.8% on investment income once income passes $200,000 single or $250,000 married. These lines are not raised for inflation.</li></ul>',
      '<h3>Gains stack on top</h3><p>The IRS lines up your income in a set order. Ordinary income (IRA withdrawals, interest, part-time pay) fills the standard deduction and the low brackets first. Long-term gains sit <b>on top</b>. Whatever part of your gains lands below the 0% line is taxed at 0%.</p><p>So a married couple with no other income can realize $98,900 + $32,200 = <b>$131,100</b> of long-term gains in 2026 and owe no federal income tax. A single person can realize $65,550. Every dollar of IRA income you add pushes a dollar of gains up toward the 15% band.</p>',
      '<h3>What a 4% withdrawal really costs</h3><p>Married filing jointly, no other income, 2026 rules:</p><ul><li>$80,000 from a taxable account where half of each sale is gain: $40,000 counts, $7,800 is taxable after the deduction, all at 0%. <b>$0 federal tax.</b></li><li>$120,000 from a taxable account that is all gain: $87,800 taxable, still under the 0% line. <b>$0.</b></li><li>$120,000 all from a traditional IRA: $87,800 of ordinary taxable income. <b>$10,040</b>, about 8.4%.</li><li>A $40,000 Roth conversion plus $80,000 of sales with $40,000 of gain: <b>$780</b>.</li></ul><p>Many early retirees pay little or no federal income tax. Your account mix matters more than your portfolio size.</p>',
      '<h3>Tax on a 4% withdrawal, by size</h3><p>Assumed mix: 40% from a traditional IRA, 50% from taxable sales where half of each sale is gain, 10% from Roth or cash. No other income, under 65, 2026 federal rules, computed with the calculator above.</p><div class="scroll"><table class="tbl"><thead><tr><th>Withdrawal (portfolio)</th><th class="num">Single</th><th class="num">Married, joint</th></tr></thead><tbody><tr><td>$40,000 ($1M)</td><td class="num">$0</td><td class="num">$0</td></tr><tr><td>$60,000 ($1.5M)</td><td class="num">$790 (1.3%)</td><td class="num">$0</td></tr><tr><td>$80,000 ($2M)</td><td class="num">$1,660 (2.1%)</td><td class="num">$0</td></tr><tr><td>$120,000 ($3M)</td><td class="num">$5,448 (4.5%)</td><td class="num">$1,580 (1.3%)</td></tr><tr><td>$200,000 ($5M)</td><td class="num">$16,270 (8.1%)</td><td class="num">$5,240 (2.6%)</td></tr><tr><td>$300,000 ($7.5M)</td><td class="num">$28,820 (9.6%)</td><td class="num">$19,625 (6.5%)</td></tr><tr><td>$600,000 ($15M)</td><td class="num">$76,304 (12.7%)</td><td class="num">$62,960 (10.5%)</td></tr></tbody></table></div><p>With this mix, gains start paying 15% above about $101,000 of withdrawals single ($202,000 married). IRA dollars reach the 22% bracket above about $166,000 single ($333,000 married). The 3.8% NIIT starts above about $308,000 single ($385,000 married). The 20% gains rate only starts above about $864,000 single ($994,000 married).</p>',
      '<h3>At 65 and older</h3><p>Two extra deductions arrive. The additional standard deduction is $2,050 for a single filer, or $1,650 for each married spouse 65 or older (2026). The new senior deduction adds $6,000 per person 65 or older for 2025 through 2028, reduced by 6% of income above $75,000 single or $150,000 married filing jointly. Social Security and required withdrawals start to count as income too; see <a href="#l-medicare-rmd">Medicare, RMDs and IRMAA</a>.</p>',
      '<h3>Control the gain you realize</h3><p>Most brokers let you choose which share lots you sell (specific identification). Selling high-cost lots realizes less gain; selling low-cost lots in a 0% year raises your cost basis for free. Hold tax-efficient index ETFs in the taxable account: actively managed mutual funds can pay out capital gains every December even when you sell nothing, and dividends count as income even when reinvested.</p>',
      '<h3>States and the hidden tax</h3><p>States with no broad income tax: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas and Wyoming. Washington has no wage tax but taxes large long-term gains. Most other states tax gains like ordinary income, so a 4-6% state tax can be the biggest tax bill an early retiree pays.</p><p>The other hidden tax is health insurance: marketplace subsidies depend on the same income, and in 2026 they stop completely above 400% of the poverty line. See <a href="#l-aca">health insurance before 65</a>. Rules get detailed fast; a CPA or enrolled agent can check your own numbers.</p>',
    ],
    example: {
      title: 'A couple spends $90,000 and pays $0 federal tax',
      intro: 'Married filing jointly, both 48, 2026 rules, no paycheck, marketplace health insurance for two.',
      steps: [
        'They hold $1.4 million in a taxable account with a $700,000 cost basis. It pays about 1.5% in qualified dividends: $21,000 a year, which counts as income whether they spend it or reinvest it.',
        'They spend the $21,000 of dividends and sell $69,000 of shares. Half of each sale is gain, so $34,500 counts and $34,500 is their own money coming back.',
        'Income the IRS counts: $21,000 + $34,500 = $55,500. After the $32,200 standard deduction, $23,300 is taxable, all dividends and long-term gains inside the 0% band. Federal tax: $0.',
        'They convert $29,000 from a traditional IRA to Roth. It uses up the deduction and pushes their gains up to $52,300 of taxable income, still inside the 0% band. Federal tax: still $0.',
        'The hidden costs: their marketplace income rises from $55,500 (262% of the poverty line for two) to $84,500, just under the $84,600 cliff. Their share of the benchmark plan goes from about 8.8% of income ($4,900) to 9.96% ($8,400): about $3,500 more. A flat 5% state tax on income above the deduction rises from about $1,165 to $2,615.',
      ],
      result: '$90,000 of spending and a $29,000 Roth conversion for $0 federal tax. The conversion really costs about $3,500 of health premium and $1,450 of state tax, against an expected 22% ($6,380) on that money later.',
    },
    mistakes: [
      'Treating the whole sale as income. Only the gain part of a taxable sale counts; the rest is your own money coming back.',
      'Taking big traditional IRA withdrawals first. They are ordinary income, push your gains out of the 0% band, and before 59½ can add a 10% penalty.',
      'Ignoring fund payouts. Mutual funds can pay out capital gains every December even if you sell nothing, and reinvested dividends still count as income.',
      'Looking only at federal tax. State income tax and lost health-insurance subsidies can cost more than the federal bill.',
    ],
    points: [
      'Taxable sales: only the gain counts. Traditional 401(k) and IRA: all of it counts. Roth and HSA for medical: none of it counts.',
      'In 2026 a married couple with no other income can realize $131,100 of long-term gains at 0% federal tax; a single person $65,550.',
      'Ordinary income fills the deduction and brackets first, and gains stack on top of it.',
      'Many FIRE households pay little or no federal tax; state tax and health subsidies often matter more.',
    ],
    terms: ['0% capital gains bracket', 'Long-term gain', 'Standard deduction', 'Taxable income', 'NIIT', 'Cost basis'],
    glossary: [{ t: 'Specific identification', d: 'Choosing exactly which share lots you sell, so you control how much gain you realize.' }],
    quiz: { q: 'A married couple with no other income sells $100,000 of shares they bought for $40,000. About how much federal income tax do they owe in 2026?', options: ['$0', '$9,000 (15% of the gain)', '$15,000 (15% of the sale)'], answer: 0, why: 'Only the $60,000 gain counts. After the $32,200 deduction, $27,800 of taxable income sits inside the 0% band.' },
    sources: [SRC.rp, SRC.t409, SRC.niit, SRC.sen],
  });

  SML.lessons.push({
    id: 'l-zero-bracket',
    course: 'fi-tax',
    order: 2,
    title: 'The 0% capital gains bracket',
    mins: 8,
    level: 'Intermediate',
    summary: 'Fill low-income years with 0% gains or cheap Roth conversions.',
    idea: 'Years with little income are a tax gift. Fill them on purpose with 0% gains or Roth conversions taxed at 10-12%.',
    widget: 'gainHarvest',
    try: 'Move the conversion and harvest sliders, or press a fill button. Watch the 0% room, the extra health premium and the subsidy line.',
    body: [
      '<h3>Why the early years are special</h3><p>Between your last paycheck and the age when Social Security and required withdrawals start, your income can be very low. The standard deduction and the low brackets reset every January. Room you do not use this year is gone.</p>',
      '<h3>Gain harvesting</h3><p>Sell investments that have gone up in your taxable account and buy them straight back. The wash-sale rule only blocks <b>losses</b>, so you can rebuy the same fund the same day. You pay 0% on the gain if it fits in the band, and your cost basis resets to today’s price, so a future sale has less gain to tax.</p><p>Example: a single person with $30,000 of taxable income can realize about $19,450 of gains at 0% in 2026 ($49,450 − $30,000). Do not harvest losses in a year your gains are taxed 0% anyway: the loss is wasted.</p>',
      '<h3>Roth conversions</h3><p>Moving money from a traditional IRA to a Roth IRA is taxed as ordinary income now, so the money grows tax-free afterwards and never faces required withdrawals. In a low-income year that tax can be small. Married filing jointly with no other income in 2026:</p><ul><li>The first $32,200 converted is tax-free (the standard deduction).</li><li>Up to $57,000 stays in the 10% bracket: $2,480 of tax.</li><li>Up to $133,000 stays in the 12% bracket: $11,600 of tax, 8.7% on average.</li></ul><p>Paying 10-12% now beats 22% or more later if large required withdrawals would push you higher. Conversions also feed the <a href="#l-early-access">Roth ladder</a>.</p>',
      '<h3>They compete for the same room</h3><p>Conversions are ordinary income, so they sit <b>under</b> your gains. Each dollar converted pushes a dollar of gains from the 0% band into 15%. Once that happens, an extra dollar of conversion costs 12% plus 15%: about 27%. The widget shows this as the cost of the next $1,000.</p><p>A common rule of thumb: with a large pre-tax balance, conversions in the 10-12% brackets usually come first; with a small one, harvest gains.</p>',
      '<h3>Watch the side effects</h3><ul><li><b>Health insurance, the hidden tax.</b> The enhanced marketplace subsidies ended after 2025. For 2026 coverage your share of the benchmark plan runs from 2.10% of income at low incomes to 9.96% between 300% and 400% of the poverty line, and the subsidy stops completely above 400%: $62,600 for one person, $84,600 for two, $128,600 for four. Conversions and harvested gains count toward that income, so between about 150% and 400% each extra dollar raises what you pay by roughly 10-18 cents. Under about 138% most states offer Medicaid instead. From 2026 any extra advance subsidy must be paid back in full.</li><li><b>Medicare premiums.</b> From about 63, income counts toward Medicare premium surcharges two years later.</li><li><b>State tax</b> may apply even when federal tax is $0.</li></ul><p>For your own plan, a CPA or enrolled agent can model several years at once.</p>',
    ],
    example: {
      title: 'Dana and Lee fill an empty year, and find the hidden cost',
      intro: 'Married filing jointly, 52 and 50, 2026 rules. They buy health insurance on the marketplace for two.',
      steps: [
        'They spend $60,000 from their taxable account. 40% of each sale is gain, so $24,000 counts. With $4,000 of interest, their income is $28,000: below the $32,200 deduction. Federal tax $0.',
        'On the marketplace, $28,000 is 132% of the poverty line for two. In most states that means Medicaid; elsewhere they would pay 2.10% of income toward the benchmark plan, about $588 a year.',
        'They convert $20,000 to Roth and sell and rebuy a fund with $30,000 of gain. Income the IRS counts is now $78,000, taxable income $45,800, all gains inside the 0% band. Federal tax: still $0, with $53,100 of 0% room left.',
        'But $78,000 is 369% of the poverty line, so their share of the benchmark plan jumps to 9.96% of income: about $7,769, roughly $7,200 more. That is a hidden tax of about 14% on the $50,000 they moved.',
        'Later they expect to save about 22% on the converted $20,000 ($4,400) and 15% on the harvested $30,000 ($4,500): about $8,900, against $7,200 now. A smaller move, or doing it in a year they have workplace coverage, would work better.',
      ],
      result: 'Federal tax stays $0, but on the marketplace each extra dollar of income between about 150% and 400% of the poverty line costs 10-18 cents of subsidy.',
    },
    mistakes: [
      'Harvesting losses in a year when your gains are taxed 0% anyway. The loss is wasted; keep it for a year it saves real tax.',
      'Converting so much that gains spill into the 15% band. Past that point each extra conversion dollar costs about 27%.',
      'Ignoring health subsidies. Below the 400% line each extra dollar of income costs about 10-18 cents of subsidy, and above it the 2026 subsidy stops completely.',
      'Forgetting the state. Some states tax harvested gains and conversions even when your federal bill is $0.',
    ],
    points: [
      'Low-income years are a use-it-or-lose-it chance to pay 0-12%.',
      'Gain harvesting: sell and rebuy right away. Wash sales only apply to losses.',
      'Conversions and gains share the same room; conversions sit underneath and push gains up.',
      'Check health subsidies, Medicare premiums and state tax before you fill the bands.',
    ],
    terms: ['Tax gain harvesting', 'Roth conversion', '0% capital gains bracket', 'MAGI', 'Subsidy cliff', 'Wash sale'],
    quiz: { q: 'Why can you sell a fund at a gain and buy it back the same day?', options: ['The wash-sale rule only applies to sales at a loss', 'Gains under $10,000 are exempt', 'Brokers waive the rule for index funds'], answer: 0, why: 'The wash-sale rule disallows losses. A gain is taxed at whatever rate applies, 0% here, and your new cost basis is the higher price.' },
    sources: [SRC.rp, SRC.t409, SRC.rp25, SRC.fpl],
  });

  SML.lessons.push({
    id: 'l-early-access',
    course: 'fi-tax',
    order: 3,
    title: 'Money out before 59½',
    mins: 10,
    level: 'Advanced',
    summary: 'Roth ladder, 72(t) and the Rule of 55: reach retirement money early.',
    idea: 'Retirement money is not locked until 59½. Build a bridge from taxable savings, Roth conversions, 72(t) payments or the Rule of 55.',
    widget: 'accessLadder',
    try: 'Pick a bridge, set your age and balances, and check that every year to 59 is covered without the 10% penalty.',
    body: [
      '<h3>The 10% penalty and its exits</h3><p>Money taken from a traditional 401(k) or IRA before 59½ is taxed as income plus a 10% additional tax, unless an exception applies. The IRS keeps a long list. The ones early retirees use most are below. Others include disability, medical bills above 7.5% of income, one $1,000 emergency withdrawal a year, and (IRA only) $10,000 lifetime for a first home, college costs and health premiums while unemployed.</p>',
      '<h3>Money that is always open</h3><ul><li><b>Taxable account:</b> no age rules. Only the gain in each sale is taxed, often at 0% (see <a href="#l-fire-tax">how FIRE withdrawals are taxed</a>).</li><li><b>Roth IRA contributions:</b> the money you put in comes out first, any time, with no tax and no penalty.</li><li><b>HSA receipts:</b> you can reimburse yourself tax-free, with no time limit, for medical bills paid after you opened the HSA. Keep the receipts. Non-medical HSA withdrawals before 65 are taxed plus 20%.</li></ul>',
      '<h3>The Roth conversion ladder</h3><p>Each year, convert some traditional IRA money to Roth. You pay income tax on it that year, ideally at 0-12%. Each conversion then has its own five-year clock that starts on January 1 of the year you convert. After that, the converted amount (not its earnings) comes out without the 10% penalty. A $40,000 conversion in December 2026 is open from January 1, 2031.</p><p>The catch: you need five years of other money while the first rung seasons, so start converting the year you stop working, or earlier. Withdrawals come out in a set order: contributions first, then conversions oldest first, then earnings. Conversions count as income for health subsidies.</p>',
      '<h3>72(t): substantially equal periodic payments</h3><p>You can take fixed yearly payments from an IRA at any age if you follow an IRS formula: the RMD method, fixed amortization or fixed annuitization. The interest rate can be up to the greater of 5% or 120% of the federal mid-term rate. Example: a $500,000 IRA at 50, fixed amortization at 5%, life expectancy 36.2 years, pays about $30,200 a year.</p><p>Payments must continue until the later of five years or age 59½. Change them and the 10% penalty comes back on every past payment, plus interest. You may switch once to the RMD method. Many people split their IRA first so only the money they need is locked in.</p>',
      '<h3>The Rule of 55</h3><p>Leave your job in or after the calendar year you turn 55 and that employer’s 401(k) or 403(b) is open with no 10% penalty (50 for many public-safety workers). It does not cover IRAs or plans from old jobs, and rolling the money to an IRA loses it. If your plan allows, roll old 401(k)s into your current plan before you leave. Governmental 457(b) plans have no 10% penalty at all.</p>',
      '<h3>Build the bridge</h3><p>Common combinations: taxable savings for the first five years and a Roth ladder after; 72(t) payments when most money is pre-tax and you stop in your 40s; the Rule of 55 if you leave at 55 or later. Mistakes here are costly and hard to undo, so a CPA or enrolled agent should check a 72(t) setup.</p>',
    ],
    example: {
      title: 'Retire at 45 with a Roth ladder',
      intro: 'Married filing jointly, both 45, today’s dollars with a 4% real return.',
      steps: [
        'Sam and Ali spend $50,000 a year. They have $250,000 in a taxable account, $60,000 of Roth IRA contributions and $900,000 in old 401(k)s rolled into IRAs.',
        'Each January they convert $50,000 from the IRA to Roth. With no other ordinary income, $32,200 is covered by the standard deduction and $17,800 is taxed at 10%: $1,780 a year. Gains from their taxable sales stack on top in the 0% band.',
        'Ages 45 to 49 are paid entirely from the taxable account, which keeps earning 4% on what is left.',
        'At 50, the last $22,500 of the taxable account and $27,500 of Roth contributions pay the year. The first conversion, made at 45, has now seasoned five tax years and waits as backup.',
        'At 51, the remaining $32,500 of contributions and $17,500 of the age-45 conversion pay the year. From 52 to 59 each year is paid from conversions made at least five years earlier. They reach 59½ with no 10% penalty and about $580,000 still in the IRA.',
      ],
      result: 'A five-year runway plus yearly conversions bridges 15 years, for about $1,780 of federal tax a year on the conversions.',
    },
    mistakes: [
      'Starting a Roth ladder without five years of other money. Conversions are not penalty-free until their five-year clock runs out.',
      'Changing 72(t) payments early. Any change before the end date brings back the 10% on every past payment, plus interest.',
      'Rolling your 401(k) into an IRA after leaving at 55. The Rule of 55 only covers the employer plan, so the rollover loses it.',
      'Forgetting that conversions count as income for marketplace health subsidies. A big conversion can cost you the subsidy.',
    ],
    points: [
      'Taxable savings and Roth contributions are open at any age.',
      'Each Roth conversion becomes penalty-free after its own five-tax-year clock.',
      '72(t) payments avoid the penalty, but must not change until the later of five years or 59½.',
      'The Rule of 55 opens the 401(k) of the job you leave in or after the year you turn 55.',
    ],
    terms: ['Roth conversion ladder', 'Rule of 55', '72(t) SEPP', 'Roth conversion', 'Roth IRA', 'HSA'],
    quiz: { q: 'You are 50 and convert $40,000 to a Roth IRA in December 2026. When can you take that $40,000 out without the 10% penalty?', options: ['January 1, 2031', 'December 2031', 'Only at 59½'], answer: 0, why: 'Each conversion’s five-year clock starts on January 1 of the year you convert, so a December 2026 conversion is open from January 1, 2031.' },
    sources: [SRC.sepp, SRC.exc, SRC.five, SRC.p969],
  });
})();
