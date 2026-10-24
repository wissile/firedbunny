/* Retirement & Wealth track: equity compensation (fork W6). Lessons l-rsu, l-espp, l-stock-options. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const trim = (v, d) => String(Number(Number(v).toFixed(d == null ? 1 : d)));
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 0 : 1) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e4 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const usd0 = (v) => F.usd(v, 0);
  const pctS = (v, d) => trim(v * 100, d == null ? 0 : d) + '%';

  /* ---------- 2026 federal tax figures (IRS Rev. Proc. 2025-32; SSA 2026 fact sheet) ---------- */
  const TX = {
    single: { br: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]], std: 16100, ltcg: [49450, 545500], niit: 200000, amtEx: 90100, amtPh: 500000, addMed: 200000 },
    mfj: { br: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]], std: 32200, ltcg: [98900, 613700], niit: 250000, amtEx: 140200, amtPh: 1000000, addMed: 250000 },
    amt28: 244500, supp: 0.22, suppHi: 0.37, ssBase: 184500,
  };
  function ordTax(ti, f) { let t = 0, lo = 0; for (const [hi, r] of TX[f].br) { if (ti > lo) t += (Math.min(ti, hi) - lo) * r; if (ti <= hi) break; lo = hi; } return Math.max(0, t); }
  function topRate(ti, f) { for (const [hi, r] of TX[f].br) if (ti <= hi) return r; return 0.37; }
  /* long-term gains g stacked on top of ordinary taxable income oi */
  function ltcgTax(oi, g, f) {
    if (g <= 0) return 0;
    const [a, b] = TX[f].ltcg, s = Math.max(0, oi), e = s + g; let t = 0;
    const seg = (lo, hi, r) => { t += Math.max(0, Math.min(e, hi) - Math.max(s, lo)) * r; };
    seg(0, a, 0); seg(a, b, 0.15); seg(b, Infinity, 0.2); return t;
  }
  const niit = (magi, inv, f) => 0.038 * Math.max(0, Math.min(Math.max(0, inv), magi - TX[f].niit));
  /* extra federal income tax from adding `add` of ordinary income on top of wages w */
  const extraOrd = (w, add, f) => { const ti0 = Math.max(0, w - TX[f].std); return ordTax(ti0 + add, f) - ordTax(ti0, f); };
  /* extra Social Security + Medicare on extra wages */
  function extraFica(w, add, f) {
    const ss = 0.062 * Math.max(0, Math.min(w + add, TX.ssBase) - Math.min(w, TX.ssBase));
    const th = TX[f].addMed; const med = 0.0145 * add + 0.009 * (Math.max(0, w + add - th) - Math.max(0, w - th));
    return ss + med;
  }
  /* simplified AMT for an ISO spread on top of wages (no other AMT items) */
  function amtFor(wages, spread, f) {
    const amti = wages + spread;
    const ex = Math.max(0, TX[f].amtEx - 0.5 * Math.max(0, amti - TX[f].amtPh));
    const base = Math.max(0, amti - ex);
    const tmt = base <= TX.amt28 ? base * 0.26 : TX.amt28 * 0.26 + (base - TX.amt28) * 0.28;
    return Math.max(0, tmt - ordTax(Math.max(0, wages - TX[f].std), f));
  }
  SML.eqTax = { ordTax, topRate, ltcgTax, amtFor, extraOrd };

  SML.css(`
.weq-ctrl[hidden],.weq-read[hidden]{display:none!important}
.weq-w .ctl[hidden]{display:none!important}
.weq-w .stat.hl .stat-v.dn{color:var(--down)} .weq-w .stat.hl .stat-v.up{color:var(--up)}
.weq-sub{font:600 10.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding:12px 16px 0}
.weq-pre{padding-top:0}
.weq-trap{display:grid;gap:10px;padding:14px 16px;grid-template-columns:1fr}
@media(min-width:640px){.weq-trap{grid-template-columns:repeat(3,minmax(0,1fr))}}
.weq-trap div{border:1px solid var(--line);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}
.weq-trap span{font:600 10.5px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.weq-trap b{font-family:var(--mono);font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}
.weq-trap b.dn{color:var(--down)} .weq-trap b.up{color:var(--up)}
.weq-trap small{font-size:12.5px;color:var(--muted);line-height:1.4}
`);

  function presetRow(id, list) {
    return `<div class="wg-bar weq-pre"><span class="meta">Try</span>${ui.seg(id, list.map((p, i) => ({ v: String(i), label: p.label })), '', 'Examples')}</div>`;
  }
  function applyPreset(st, p) { Object.keys(p.set).forEach((k) => st.set(k, p.set[k])); if (p.segs) Object.keys(p.segs).forEach((k) => st.setSeg(k, p.segs[k])); }

  /* =====================================================================================
     rsuVest: tax at vest (withholding gap) and hold-or-sell concentration
     ===================================================================================== */
  SML.widgets.rsuVest = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('rsu');
    root.classList.add('weq-w');
    const presets = [
      { label: 'New grad', set: { [id + '-sal']: 120000, [id + '-sh']: 120, [id + '-px']: 150, [id + '-own']: 0, [id + '-nw']: 40000 }, segs: { [id + '-f']: 'single' } },
      { label: 'Senior engineer', set: { [id + '-sal']: 220000, [id + '-sh']: 400, [id + '-px']: 150, [id + '-own']: 60000, [id + '-nw']: 250000 }, segs: { [id + '-f']: 'single' } },
      { label: 'Married director', set: { [id + '-sal']: 300000, [id + '-sh']: 1200, [id + '-px']: 160, [id + '-own']: 250000, [id + '-nw']: 600000 }, segs: { [id + '-f']: 'mfj' } },
    ];
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-m', [{ v: 'tax', label: 'Tax at vest' }, { v: 'hold', label: 'Hold or sell' }], opts.mode || 'tax', 'View')}<span class="grow"></span>${ui.seg(id + '-f', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married' }], 'single', 'Filing status')}</div>
      ${presetRow(id + '-pre', presets)}
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-sal', label: 'Salary (W-2 pay)', min: 40000, max: 600000, step: 5000, value: 220000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-sh', label: 'Shares vesting this year', min: 0, max: 3000, step: 10, value: 400, fmt: 'num' })}
        ${ui.slider({ id: id + '-px', label: 'Share price at vest', min: 5, max: 500, step: 1, value: 150, fmt: 'usd0' })}
      </div>
      <div class="wg-ctrl weq-ctrl" id="${id}-hc" hidden>
        ${ui.slider({ id: id + '-own', label: 'Other company stock you hold', min: 0, max: 1000000, step: 5000, value: 60000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-nw', label: 'Everything else you own', min: 0, max: 3000000, step: 10000, value: 250000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-drop', label: 'If the stock drops by', min: 10, max: 90, step: 5, value: 50, fmt: 'pct' })}
      </div>
      <div class="wg-read weq-read" id="${id}-rt">${ui.stat('Vest value (taxed as pay)', id + '-v')}${ui.stat('Withheld at 22%', id + '-w')}${ui.stat('Real federal income tax', id + '-t')}${ui.stat('Gap at tax time', id + '-g', 'hl')}${ui.stat('Social Security + Medicare', id + '-fi')}${ui.stat('Top bracket', id + '-r')}</div>
      <div class="wg-read weq-read" id="${id}-rh" hidden>${ui.stat('Company stock if you hold', id + '-ch', 'hl')}${ui.stat('If you sell at vest', id + '-cs')}${ui.stat('Drop costs (hold)', id + '-lh')}${ui.stat('Drop costs (sell)', id + '-ls')}${ui.stat('Extra tax to sell at vest', id + '-xt')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 federal figures, salary as the only other income. Social Security (6.2% up to the $184,500 wage base) and Medicare (1.45%, plus 0.9% on wages over $200,000) are withheld in full; the gap is income tax only. State tax not included. In “Other company stock”, count ESPP shares, vested options and any company stock in your 401(k). Sample numbers, not advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const pre = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (pre) { const v = st.seg(id + '-pre'); if (v !== null && presets[+v]) applyPreset(st, presets[+v]); }
      else if (e && e.target && e.target.closest && !e.target.closest('#' + id + '-m')) st.setSeg(id + '-pre', '');
      draw();
    });
    function calc() {
      const f = st.seg(id + '-f') || 'single', sal = st.n(id + '-sal'), V = st.n(id + '-sh') * st.n(id + '-px');
      const w = TX.supp * Math.min(V, 1e6) + TX.suppHi * Math.max(0, V - 1e6);
      const t = extraOrd(sal, V, f), gap = t - w;
      const ti = Math.max(0, sal - TX[f].std) + V;
      const fica = extraFica(sal, V, f);
      const own = st.n(id + '-own'), nw = st.n(id + '-nw'), drop = st.n(id + '-drop') / 100;
      const kept = V - t - fica; // after income tax, Social Security and Medicare
      const tot = own + nw + kept;
      return { f, sal, V, w, wAll: w + fica, tAll: t + fica, t, gap, ti, rate: topRate(ti, f), fica, own, nw, drop, kept, tot, cH: tot ? (own + kept) / tot : 0, cS: tot ? own / tot : 0 };
    }
    const draw = ui.responsive(fig, (W) => {
      const m = st.seg(id + '-m') || 'tax', c = calc();
      $id(id + '-hc').hidden = m !== 'hold'; $id(id + '-rt').hidden = m !== 'tax'; $id(id + '-rh').hidden = m !== 'hold';
      if (m === 'tax') drawTax(W, c); else drawHold(W, c);
    });
    function drawTax(W, c) {
      const compact = W < 560;
      const H = Math.round(SML.clamp(W * 0.5, 260, 330));
      const pl = compact ? 40 : 54, pr = 10, pt = compact ? 42 : 62, pb = compact ? 34 : 44;
      const V = Math.max(c.V, 1);
      const lo = 0, top = Math.max(c.V, 1) * 1.06;
      const y = SML.lin(lo, top, H - pb, pt);
      const n = 5, band = (W - pl - pr) / n, bw = Math.min(78, band * 0.62);
      const cx = (i) => pl + band * (i + 0.5);
      let b = '';
      SML.ticks(0, top, 4).forEach((v) => { if (y(v) < pt - 4) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const bars = [
        { a: 0, z: c.V, cls: 'f-info', lab: compact ? ['Vests'] : ['Shares vest', 'taxed as pay'], val: kfmt(c.V), vc: 'info' },
        { a: c.V - c.wAll, z: c.V, cls: 'f-shade2', lab: compact ? ['Withheld'] : ['Withheld', '22% + FICA'], val: F.minus + kfmt(c.wAll), vc: 'mut' },
        { a: 0, z: c.V - c.wAll, cls: 'f-acc', lab: compact ? ['Shares'] : ['Shares you', 'receive'], val: kfmt(c.V - c.wAll), vc: 'acc' },
        c.gap >= 0 ? { a: c.V - c.tAll, z: c.V - c.wAll, cls: 'f-dn', lab: compact ? ['Owe'] : ['Still owed', 'at tax time'], val: F.minus + kfmt(c.gap), vc: 'dn' } : { a: c.V - c.wAll, z: c.V - c.tAll, cls: 'f-up-t s-up w15', lab: compact ? ['Refund'] : ['Comes back', 'as refund'], val: '+' + kfmt(-c.gap), vc: 'up' },
        { a: 0, z: c.V - c.tAll, cls: 'f-up', lab: compact ? ['Kept'] : ['Yours after', 'tax'], val: kfmt(c.V - c.tAll), vc: 'up' },
      ];
      bars.forEach((r, i) => {
        const y0 = y(Math.max(r.a, r.z)), y1 = y(Math.min(r.a, r.z));
        b += S.rect(cx(i) - bw / 2, y0, bw, Math.max(1.5, y1 - y0), r.cls, 3);
        b += S.text(cx(i), y0 - 7, r.val, 'md mono b ' + r.vc, 'middle');
        r.lab.forEach((t, k) => { b += S.text(cx(i), H - pb + 16 + k * 13, t, k ? 'xs' : 'sm ink', 'middle'); });
        if (i < n - 1) { const lvl = i === 0 ? c.V : i === 1 ? c.V - c.wAll : i === 2 ? c.V - c.wAll : c.V - c.tAll; b += S.line(cx(i) + bw / 2, y(lvl), cx(i + 1) - bw / 2, y(lvl), 's-mut dash2'); }
      });
      b += S.line(pl, y(0), W - pr, y(0), 's-line');
      const head = c.V <= 0 ? 'Add shares vesting to see the tax picture.' : compact ? `Top bracket ${pctS(c.rate)}. Withheld: 22%.` : `Your top federal bracket with this vest: ${pctS(c.rate)}. Withholding uses 22%.`;
      b += S.text(compact ? 4 : pl, 18, head, (compact ? 'sm' : 'md') + ' ink b');
      if (!compact) b += S.text(pl, 34, 'Red bar = the gap you pay in April unless you set it aside or withhold more.', 'sm');
      fig.innerHTML = S.wrap(W, H, `Waterfall: ${usd0(c.V)} of shares vest, ${usd0(c.wAll)} withheld, real tax ${usd0(c.tAll)}`, b);
      setT(id + '-v', usd0(c.V)); setT(id + '-w', usd0(c.w)); setT(id + '-t', usd0(c.t)); setT(id + '-fi', usd0(c.fica));
      setT(id + '-g', c.gap >= 0 ? F.minus + usd0(c.gap) : '+' + usd0(-c.gap), c.gap > 50 ? 'dn' : 'up'); setT(id + '-r', pctS(c.rate));
      const msg = $id(id + '-msg');
      if (c.V <= 0) msg.innerHTML = ui.msg('info', 'No vest', 'Slide up the shares vesting this year.');
      else if (c.gap > 50) msg.innerHTML = ui.msg('dn', 'Under-withheld', `This vest lands in the ${pctS(c.rate)} bracket but only 22% is withheld, so you still owe about <b>${usd0(c.gap)}</b> of federal income tax. Park that in savings at each vest or ask payroll to withhold more.`);
      else if (c.gap < -50) msg.innerHTML = ui.msg('up', 'Covered', `At this income 22% is more than your real rate on the vest, so about ${usd0(-c.gap)} should come back as a refund.`);
      else msg.innerHTML = ui.msg('acc', 'About right', 'Here 22% withholding roughly matches your real federal rate on the vest. Check again if your pay or the share price jumps.');
    }
    function drawHold(W, c) {
      const compact = W < 520;
      const pl = 12, pr = 12, bw = W - pl - pr;
      const rowH = compact ? 96 : 88, top = 34, H = top + rowH * 2 + 26;
      const x = (v) => pl + (c.tot ? (v / c.tot) * bw : 0);
      let b = '';
      const guide = x(c.tot * 0.1);
      b += S.text(pl, 18, compact ? 'Your net worth, split by what it holds' : 'Your net worth after this vest, split into company stock and everything else', 'sm ink b');
      const rows = [
        { lab: compact ? 'Hold the shares' : 'Hold the vested shares', co: c.own + c.kept, conc: c.cH },
        { lab: compact ? 'Sell, buy index fund' : 'Sell at vest and buy a broad index fund', co: c.own, conc: c.cS },
      ];
      rows.forEach((r, i) => {
        const y0 = top + i * rowH;
        b += S.text(pl, y0 + 14, r.lab, 'md ink b');
        const by = y0 + 22, bh = 30;
        const xc = x(r.co);
        b += S.rect(pl, by, bw, bh, 'f-info-t s-info w1', 4);
        if (r.co > 0) b += S.rect(pl, by, Math.max(2, xc - pl), bh, 'f-acc', 4);
        const lost = r.co * c.drop;
        if (lost > 0) b += S.rect(xc - (x(lost) - pl), by, x(lost) - pl, bh, 'f-dn-t s-dn w15 dash2', 0);
        b += S.text(W - pr, y0 + 14, `${pctS(r.conc)} ${compact ? 'company' : 'in company stock'}`, 'md mono b ' + (r.conc > 0.1 ? 'dn' : 'up'), 'end');
        b += S.line(guide, by - 4, guide, by + bh + 4, 's-ink w15 dash2');
        const after = c.tot - lost;
        b += S.text(pl, by + bh + 18, `A ${pctS(c.drop)} drop costs ${usd0(lost)} (${pctS(c.tot ? lost / c.tot : 0)} of net worth)`, 'sm ' + (r.conc > 0.1 ? 'dn' : 'mut'));
        if (!compact) b += S.text(W - pr, by + bh + 18, `left: ${usd0(after)}`, 'sm mono', 'end');
      });
      b += S.line(guide, H - 18, guide, H - 4, 's-ink w15 dash2');
      b += S.text(guide + 5, H - 6, '10% of net worth', 'xs ink');
      fig.innerHTML = S.wrap(W, H, `Company stock is ${pctS(c.cH)} of net worth if you hold and ${pctS(c.cS)} if you sell at vest`, b);
      setT(id + '-ch', pctS(c.cH), c.cH > 0.1 ? 'dn' : 'up'); setT(id + '-cs', pctS(c.cS), c.cS > 0.1 ? 'dn' : 'up');
      setT(id + '-lh', F.minus + usd0((c.own + c.kept) * c.drop)); setT(id + '-ls', F.minus + usd0(c.own * c.drop)); setT(id + '-xt', '$0', 'up');
      const msg = $id(id + '-msg');
      if (c.kept <= 0) msg.innerHTML = ui.msg('info', 'No vest', 'Slide up the shares vesting this year.');
      else if (c.cH > 0.1) msg.innerHTML = ui.msg('dn', 'Concentrated', `Holding puts ${pctS(c.cH)} of your net worth in the company that also pays your salary. Keeping the shares is the same as taking a ${usd0(c.kept)} cash bonus and buying the stock with it. Selling at vest adds no extra tax, because your cost basis is the vest price.`);
      else msg.innerHTML = ui.msg('up', 'Diversified', `Even if you hold, company stock stays at ${pctS(c.cH)} of your net worth, under a common 10% guide. Make sure “Other company stock” includes ESPP shares, options and any in your 401(k).`);
    }
  };

  /* =====================================================================================
     esppCalc: discount, lookback, return and taxes
     ===================================================================================== */
  SML.widgets.esppCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('esp');
    root.classList.add('weq-w');
    const presets = [
      { label: 'Price rose', set: { [id + '-s0']: 40, [id + '-s1']: 50, [id + '-sp']: 50 } },
      { label: 'Price fell', set: { [id + '-s0']: 50, [id + '-s1']: 42, [id + '-sp']: 42 } },
      { label: 'Flat', set: { [id + '-s0']: 40, [id + '-s1']: 40, [id + '-sp']: 40 } },
    ];
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-d', [{ v: '15', label: '15% off' }, { v: '10', label: '10% off' }, { v: '5', label: '5% off' }], '15', 'Discount')}${ui.chips(id + '-lb', [{ k: 'lb', label: 'Lookback', color: 'var(--accent)', on: true }])}<span class="grow"></span>${ui.seg(id + '-f', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married' }], 'single', 'Filing status')}</div>
      ${presetRow(id + '-pre', presets)}
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-sal', label: 'Salary', min: 30000, max: 400000, step: 5000, value: 100000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-pc', label: 'Paycheck you put in', min: 1, max: 15, step: 1, value: 10, fmt: 'pct' })}
        ${ui.slider({ id: id + '-s0', label: 'Price on the first day', min: 10, max: 200, step: 1, value: 40, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-s1', label: 'Price on purchase day', min: 10, max: 200, step: 1, value: 50, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('You put in (6 months)', id + '-in')}${ui.stat('Shares bought', id + '-sh')}${ui.stat('Gain on purchase day', id + '-g', 'hl')}${ui.stat('Return over the period', id + '-r')}${ui.stat('Annualized', id + '-a')}</div>
      <p class="weq-sub">When you sell, and the federal tax</p>
      <div class="wg-bar">${ui.seg(id + '-s', [{ v: 'now', label: 'Sell on purchase day' }, { v: 'dq', label: 'Hold 1 year' }, { v: 'q', label: 'Hold 2 years+' }], 'now', 'When you sell')}</div>
      <div class="wg-ctrl weq-ctrl" id="${id}-spc" hidden>${ui.slider({ id: id + '-sp', label: 'Price when you sell', min: 5, max: 250, step: 1, value: 50, fmt: 'usd0' })}</div>
      <div class="wg-read">${ui.stat('Taxed as pay', id + '-oi')}${ui.stat('Capital gain', id + '-cg')}${ui.stat('Federal tax', id + '-tx')}${ui.stat('Profit after tax', id + '-pr', 'hl')}</div>
      <div class="weq-trap" id="${id}-trap"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">One 6-month offering with one purchase. Drag the two handles on the chart. The IRS caps purchases at $25,000 of stock a year, valued on the first day; this assumes two equal periods a year ($12,500 each). 2026 federal rates, no state tax. Sample numbers.</div>`;
    const fig = root.querySelector('.wg-fig');
    let G = null;
    const st = ui.wire(root, (e) => {
      const pre = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (pre) { const v = st.seg(id + '-pre'); if (v !== null && presets[+v]) applyPreset(st, presets[+v]); }
      else if (e && e.target && e.target.closest && (e.target.id === id + '-s0' || e.target.id === id + '-s1')) st.setSeg(id + '-pre', '');
      draw();
    });
    ui.drag(fig, {
      sel: '.handle',
      start(pt, t) { this.k = t.getAttribute('data-k'); },
      move(pt) { if (!G || !this.k) return; const v = Math.round(SML.clamp(G.y.inv(pt.y), 10, 200)); st.set(id + (this.k === 'a' ? '-s0' : '-s1'), v); st.setSeg(id + '-pre', ''); draw(); },
    });
    function calc() {
      const f = st.seg(id + '-f') || 'single', d = Number(st.seg(id + '-d') || 15) / 100, lb = st.on(id + '-lb', 'lb');
      const sal = st.n(id + '-sal'), pc = st.n(id + '-pc') / 100, s0 = st.n(id + '-s0'), s1 = st.n(id + '-s1');
      const contrib = (sal * pc) / 2;
      const P = Math.round((1 - d) * (lb ? Math.min(s0, s1) : s1) * 100) / 100;
      const cap = Math.floor(12500 / s0);
      const raw = Math.floor(contrib / P), sh = Math.max(0, Math.min(raw, cap));
      const cost = sh * P, val = sh * s1, gain = val - cost, r6 = cost ? gain / cost : 0;
      const ann = Math.pow(1 + r6, 2) - 1;
      const mode = st.seg(id + '-s') || 'now', sp = mode === 'now' ? s1 : st.n(id + '-sp');
      let oi, cg, cgLong;
      if (mode === 'q') { oi = sh * Math.max(0, Math.min(sp - P, d * s0)); cg = sh * (sp - P) - oi; cgLong = true; }
      else { oi = sh * (s1 - P); cg = sh * (sp - s1); cgLong = mode === 'dq'; }
      const w = sal, ti0 = Math.max(0, w - TX[f].std);
      const taxOI = ordTax(ti0 + oi, f) - ordTax(ti0, f);
      let taxCG;
      if (cg >= 0) taxCG = (cgLong ? ltcgTax(ti0 + oi, cg, f) : ordTax(ti0 + oi + cg, f) - ordTax(ti0 + oi, f)) + niit(sal + oi + cg, cg, f);
      else taxCG = -Math.min(3000, -cg) * topRate(ti0 + oi, f);
      const tax = taxOI + taxCG;
      const profit = sh * sp - cost - tax;
      return { f, d, lb, sal, pc, s0, s1, contrib, P, cap, raw, sh, cost, val, gain, r6, ann, mode, sp, oi, cg, cgLong, tax, taxOI, taxCG, profit, ti0 };
    }
    const draw = ui.responsive(fig, (W) => {
      const c = calc();
      $id(id + '-spc').hidden = c.mode === 'now';
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.46, 250, 320));
      const pl = compact ? 38 : 48, pr = compact ? 84 : 128, pt = 30, pb = 30;
      const n = 61;
      const lo = Math.min(c.s0, c.s1, c.P) * 0.82, hi = Math.max(c.s0, c.s1) * 1.12;
      const x = SML.lin(0, n - 1, pl, W - pr), y = SML.lin(lo, hi, H - pb, pt);
      const mid = (c.s0 + c.s1) / 2 + (c.s1 - c.s0) * 0.15 + c.s0 * 0.04;
      const path = SML.data.path([[0, c.s0], [22, c.s0 * 0.96 + c.s1 * 0.04], [40, mid], [n - 1, c.s1]], n, 11, c.s0 * 0.012);
      path[0] = c.s0; path[n - 1] = c.s1;
      let b = '';
      SML.ticks(lo, hi, 4).forEach((v) => { if (y(v) < pt - 2 || y(v) > H - pb + 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, '$' + trim(v, 0), 'xs mono', 'end'); });
      ['Start', 'M1', 'M2', 'M3', 'M4', 'M5', 'Buy'].forEach((t, i) => { if (compact && i % 2 && i < 6) return; b += S.text(x(i * 10), H - pb + 16, t, 'xs mono', 'middle'); });
      const refP = c.lb ? Math.min(c.s0, c.s1) : c.s1;
      b += S.line(pl, y(refP), W - pr, y(refP), 's-mut dash2');
      b += S.poly(path.map((v, i) => [x(i), y(v)]), 's-ink w2');
      b += S.level(y(c.P), pl, W - pr, '', 's-acc');
      const ex = x(n - 1);
      b += S.rect(ex - 5, y(c.s1), 10, Math.max(1, y(c.P) - y(c.s1)), 'f-up-t s-up w15', 2);
      b += S.text(ex + 12, y(c.P) + 4, `${compact ? 'pay' : 'You pay'} ${F.usd(c.P)}`, 'sm acc b');
      b += S.text(ex + 12, y(c.s1) + 4, `${compact ? 'worth' : 'Worth'} ${F.usd(c.s1, 0)}`, 'sm ink b');
      const gps = c.s1 - c.P;
      if (Math.abs(y(c.s1) - y(c.P)) > 34) b += S.text(ex + 12, (y(c.s1) + y(c.P)) / 2 + 4, `+${pctS(c.P ? gps / c.P : 0)}`, 'md up b');
      if (!compact) b += S.text(x(0) + 12, y(refP) + 15, c.lb ? `lookback uses the lower price, ${F.usd(refP, 0)}` : 'no lookback: discount on purchase-day price', 'xs');
      b += S.circle(x(0), y(c.s0), 7, 'handle', ` data-k="a"`) + S.circle(ex, y(c.s1), 7, 'handle', ` data-k="b"`);
      b += S.text(x(0) + 2, y(c.s0) - 12, 'drag', 'xs acc b');
      fig.innerHTML = S.wrap(W, H, `ESPP: price ${F.usd(c.s0, 0)} on day one, ${F.usd(c.s1, 0)} on purchase day; you pay ${F.usd(c.P)}`, b);
      G = { y };
      setT(id + '-in', usd0(c.sh * c.P)); setT(id + '-sh', F.num(c.sh));
      setT(id + '-g', (c.gain >= 0 ? '+' : F.minus) + usd0(Math.abs(c.gain)), c.gain >= 0 ? 'up' : 'dn');
      setT(id + '-r', F.spct(c.r6 * 100, 1)); setT(id + '-a', F.spct(c.ann * 100, 0));
      setT(id + '-oi', usd0(c.oi)); setT(id + '-cg', (c.cg < 0 ? F.minus : '') + usd0(Math.abs(c.cg)) + (c.cg ? (c.cgLong ? ' LT' : ' ST') : ''), c.cg < 0 ? 'dn' : undefined);
      setT(id + '-tx', (c.tax < 0 ? F.minus : '') + usd0(Math.abs(c.tax))); setT(id + '-pr', (c.profit < 0 ? F.minus : '') + usd0(Math.abs(c.profit)), c.profit >= 0 ? 'up' : 'dn');
      const basisAdj = c.sh ? c.oi / c.sh : 0;
      $id(id + '-trap').innerHTML = `<div><span>Broker 1099-B basis</span><b>${F.usd(c.P)} a share</b><small>What you paid. Often reported this way.</small></div>
        <div><span>Already on your W-2</span><b>${usd0(c.oi)}</b><small>The discount taxed as pay. Form 3922 shows the dates and prices.</small></div>
        <div><span>Correct basis</span><b class="up">${F.usd(c.P + basisAdj)} a share</b><small>Use this on Form 8949 or you pay tax twice on ${usd0(c.oi)}.</small></div>`;
      const msg = $id(id + '-msg');
      const capped = c.raw > c.cap;
      if (c.sh <= 0) msg.innerHTML = ui.msg('info', 'Nothing bought', 'Raise the share of your paycheck you put in.');
      else if (c.mode === 'now') msg.innerHTML = ui.msg('up', 'Sell right away', `You pay ${F.usd(c.P)} for shares worth ${F.usd(c.s1, 0)}: a ${pctS(c.r6, 1)} gain in six months, and your money was only in for about three months on average. The gain is taxed as pay, leaving ${usd0(c.profit)} after federal tax.${capped ? ' You hit the $25,000 yearly limit; the extra cash is refunded.' : ''}`);
      else if (c.mode === 'q') msg.innerHTML = ui.msg('acc', 'Qualifying', `Holding two years from the start and one from purchase makes it a qualifying sale: only the smaller of your gain or the ${pctS(c.d)} discount on the first-day price is taxed as pay, the rest at long-term rates. The trade-off is two years of single-stock risk.`);
      else msg.innerHTML = ui.msg('acc', 'Disqualifying', 'Selling before two years from the start is a disqualifying sale: the full discount at purchase is taxed as pay, and only the move after purchase is a capital gain (long-term here, after a year).');
    });
  };

  /* =====================================================================================
     equityOptions: ISO vs NSO from grant to exercise to sale
     ===================================================================================== */
  SML.widgets.equityOptions = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('eqo');
    root.classList.add('weq-w');
    const presets = [
      { label: 'Startup ISOs', set: { [id + '-n']: 8000, [id + '-k']: 2, [id + '-e']: 12, [id + '-s']: 20, [id + '-sal']: 160000, [id + '-g']: 24, [id + '-h']: 13 }, segs: { [id + '-t']: 'iso', [id + '-p']: 'hold' } },
      { label: 'Public company NSOs', set: { [id + '-n']: 2000, [id + '-k']: 40, [id + '-e']: 70, [id + '-s']: 70, [id + '-sal']: 180000, [id + '-g']: 36, [id + '-h']: 0 }, segs: { [id + '-t']: 'nso', [id + '-p']: 'sell' } },
      { label: 'Big ISO spread', set: { [id + '-n']: 10000, [id + '-k']: 5, [id + '-e']: 30, [id + '-s']: 40, [id + '-sal']: 200000, [id + '-g']: 30, [id + '-h']: 13 }, segs: { [id + '-t']: 'iso', [id + '-p']: 'hold' } },
    ];
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', [{ v: 'iso', label: 'ISO' }, { v: 'nso', label: 'NSO' }], opts.type || 'iso', 'Option type')}${ui.seg(id + '-p', [{ v: 'sell', label: 'Exercise and sell' }, { v: 'hold', label: 'Exercise and hold' }], 'hold', 'Plan')}<span class="grow"></span>${ui.seg(id + '-f', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married' }], 'single', 'Filing status')}</div>
      ${presetRow(id + '-pre', presets)}
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-n', label: 'Options you exercise', min: 100, max: 20000, step: 100, value: 4000, fmt: 'num' })}
        ${ui.slider({ id: id + '-k', label: 'Strike price', min: 0.5, max: 60, step: 0.5, value: 5, fmt: 'usd' })}
        ${ui.slider({ id: id + '-e', label: 'Share price when you exercise', min: 1, max: 150, step: 1, value: 30, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-s', label: 'Share price when you sell', min: 1, max: 200, step: 1, value: 40, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-sal', label: 'Salary', min: 40000, max: 500000, step: 5000, value: 160000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-g', label: 'Months from grant to exercise', min: 12, max: 60, step: 1, value: 24, fmt: (v) => v + ' mo' })}
        ${ui.slider({ id: id + '-h', label: 'Months you hold after exercise', min: 0, max: 36, step: 1, value: 13, fmt: (v) => v + ' mo' })}
      </div>
      <div class="wg-read">${ui.stat('Cash to exercise', id + '-cash')}${ui.stat('Spread at exercise', id + '-sp')}${ui.stat('Tax at exercise', id + '-te')}${ui.stat('Tax when you sell', id + '-ts')}${ui.stat('Profit after tax', id + '-pr', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Federal only, 2026 brackets, salary as your only other income. Assumes you exercise in January, so a sale within 11 months is in the same tax year. AMT is a simplified estimate; part of it often comes back later as a credit. Drag the exercise and sale points.</div>`;
    const fig = root.querySelector('.wg-fig');
    let G = null;
    const st = ui.wire(root, (e) => {
      const pre = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (pre) { const v = st.seg(id + '-pre'); if (v !== null && presets[+v]) applyPreset(st, presets[+v]); }
      draw();
    });
    ui.drag(fig, {
      sel: '.handle',
      start(pt, t) { this.k = t.getAttribute('data-k'); },
      move(pt) { if (!G || !this.k) return; const v = Math.round(G.y.inv(pt.y)); if (this.k === 'e') st.set(id + '-e', SML.clamp(v, 1, 150)); else st.set(id + '-s', SML.clamp(v, 1, 200)); draw(); },
    });
    function calc() {
      const f = st.seg(id + '-f') || 'single', iso = (st.seg(id + '-t') || 'iso') === 'iso', plan = st.seg(id + '-p') || 'hold';
      const n = st.n(id + '-n'), k = st.n(id + '-k'), e = st.n(id + '-e'), sal = st.n(id + '-sal'), g = st.n(id + '-g');
      const h = plan === 'sell' ? 0 : st.n(id + '-h');
      const s = plan === 'sell' ? e : st.n(id + '-s');
      const cash = n * k, spread = Math.max(0, (e - k) * n), total = (s - k) * n;
      const qualDate = Math.max(24, g + 12); // months from grant
      const saleM = g + h, qualifies = iso && saleM >= qualDate && h >= 12;
      const sameYear = h <= 11;
      const ti0 = Math.max(0, sal - TX[f].std);
      let te = 0, ts = 0, amt = 0, oi = 0, cg = 0, cgLong = h >= 12, kind;
      if (!iso) {
        oi = spread; te = extraOrd(sal, spread, f) + extraFica(sal, spread, f);
        cg = (s - e) * n;
        const add = sameYear ? spread : 0;
        if (cg >= 0) ts = (cgLong ? ltcgTax(ti0 + add, cg, f) : ordTax(ti0 + add + cg, f) - ordTax(ti0 + add, f)) + niit(sal + add + cg, cg, f);
        else ts = -Math.min(3000, -cg) * topRate(ti0, f);
        kind = 'nso';
      } else if (qualifies) {
        amt = amtFor(sal, spread, f); te = amt;
        cg = total; ts = total >= 0 ? ltcgTax(ti0, total, f) + niit(sal + total, total, f) : -Math.min(3000, -total) * topRate(ti0, f);
        kind = 'iso-q';
      } else {
        // disqualifying: ordinary income = smaller of the spread or the actual gain; no FICA
        oi = Math.max(0, Math.min(spread, total));
        cg = total - oi;
        amt = sameYear ? 0 : amtFor(sal, spread, f);
        te = amt;
        const base = ti0;
        const tOI = ordTax(base + oi, f) - ordTax(base, f);
        let tCG = 0;
        if (cg >= 0) tCG = (cgLong ? ltcgTax(base + oi, cg, f) : ordTax(base + oi + cg, f) - ordTax(base + oi, f)) + niit(sal + oi + cg, cg, f);
        else tCG = -Math.min(3000, -cg) * topRate(base, f);
        ts = tOI + tCG;
        kind = 'iso-d';
      }
      const profit = total - te - ts;
      return { f, iso, plan, n, k, e, s, sal, g, h, cash, spread, total, qualDate, saleM, qualifies, sameYear, te, ts, amt, oi, cg, cgLong, kind, profit };
    }
    const draw = ui.responsive(fig, (W) => {
      const c = calc();
      [id + '-s', id + '-h'].forEach((k) => { const el = $id(k); if (el) el.closest('label').hidden = c.plan === 'sell'; });
      const compact = W < 540;
      const H = Math.round(SML.clamp(W * 0.5, 270, 340));
      const pl = compact ? 40 : 50, pr = compact ? 14 : 24, pt = 40, pb = 34;
      const endM = Math.max(c.saleM, c.iso ? c.qualDate : 0, c.g + 1) + 3;
      const lo = 0, hi = Math.max(c.k, c.e, c.s) * 1.18;
      const x = SML.lin(0, endM, pl, W - pr), y = SML.lin(lo, hi, H - pb, pt);
      let b = '';
      SML.ticks(lo, hi, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, '$' + trim(v, 0), 'xs mono', 'end'); });
      SML.ticks(0, endM, compact ? 4 : 6).filter((v) => Number.isInteger(v)).forEach((v) => { b += S.text(x(v), H - pb + 16, v === 0 ? 'grant' : (v % 12 === 0 ? v / 12 + 'y' : v + 'm'), 'xs mono', 'middle'); });
      // ISO long-term window
      if (c.iso) {
        b += S.rect(x(c.qualDate), pt - 14, W - pr - x(c.qualDate), H - pb - pt + 14, 'f-up-t', 0, ' opacity=".55"');
        b += S.line(x(c.qualDate), pt - 14, x(c.qualDate), H - pb, 's-up w15 dash2');
        b += S.text(Math.min(x(c.qualDate) + 6, W - pr - 4), pt - 2, compact ? 'qualifying' : 'qualifying sale from here', 'xs up b', x(c.qualDate) + 130 > W - pr ? 'end' : 'start');
      }
      // price path grant -> exercise -> sale
      const N = Math.max(8, Math.round(endM));
      const anchors = [[0, c.k], [Math.round(c.g), c.e]]; if (c.saleM > c.g) anchors.push([Math.round(c.saleM), c.s]); anchors.push([N, c.saleM > c.g ? c.s * 1.02 : c.e * 1.02]);
      const path = SML.data.path(anchors, N + 1, 5, Math.max(c.e, c.k) * 0.045);
      path[0] = c.k; path[Math.round(c.g)] = c.e; if (c.saleM > c.g) path[Math.round(c.saleM)] = c.s;
      b += S.poly(path.map((v, i) => [x(i), y(Math.max(lo, v))]), 's-mut w15');
      // strike
      b += S.level(y(c.k), pl, W - pr, '', 's-acc');
      b += S.text(pl + 4, y(c.k) - 6, `strike ${F.usd(c.k)}`, 'sm acc b');
      // spread at exercise
      const xe = x(c.g), xs = x(c.saleM);
      const spCls = c.iso ? 'f-vio-t s-vio w15' : 'f-acc-t s-acc w15';
      if (c.e > c.k) b += S.rect(xe - 7, y(c.e), 14, y(c.k) - y(c.e), spCls, 2);
      const spLab = c.iso ? (c.kind === 'iso-q' ? 'spread: AMT item' : 'spread: taxed as pay') : 'spread: taxed as pay';
      const labRight = xe < W * 0.55;
      b += S.text(labRight ? xe + 12 : xe - 12, (y(c.e) + y(c.k)) / 2 + 4, spLab, 'sm ' + (c.iso ? 'vio' : 'acc') + ' b', labRight ? 'start' : 'end');
      // growth after exercise
      if (c.saleM > c.g && Math.abs(c.s - c.e) > 0.01) {
        const up = c.s >= c.e;
        b += S.rect(xs - 7, y(Math.max(c.s, c.e)), 14, Math.abs(y(c.s) - y(c.e)), up ? (c.cgLong ? 'f-up-t s-up w15' : 'f-acc-t s-acc w15') : 'f-dn-t s-dn w15', 2);
        b += S.line(xe, y(c.e), xs, y(c.e), 's-mut dash2');
        const t2 = up ? (c.kind === 'iso-q' ? 'all long-term' : c.cgLong ? 'long-term gain' : 'short-term gain') : 'loss';
        b += S.text(xs - 12, Math.min(y(c.s), y(c.e)) - 8, t2, 'sm b ' + (up ? (c.cgLong || c.kind === 'iso-q' ? 'up' : 'acc') : 'dn'), 'end');
      }
      b += S.circle(xe, y(c.e), 7, 'handle', ' data-k="e"') + S.text(xe, H - pb - 6, 'exercise', 'xs ink b', 'middle');
      if (c.saleM > c.g) { b += S.circle(xs, y(c.s), 7, 'handle', ' data-k="s"'); b += S.text(xs + 8, H - pb - 6 - (Math.abs(xs - xe) < 56 ? 12 : 0), 'sell', 'xs ink b', 'start'); }
      b += S.text(pl, 16, `${c.iso ? 'ISO' : 'NSO'}: ${F.num(c.n)} options, ${usd0(c.cash)} to exercise`, (compact ? 'sm' : 'md') + ' ink b');
      fig.innerHTML = S.wrap(W, H, `Stock price from grant to sale. Strike ${F.usd(c.k)}, exercise at ${F.usd(c.e, 0)}, sell at ${F.usd(c.s, 0)}`, b);
      G = { y };
      setT(id + '-cash', usd0(c.cash)); setT(id + '-sp', usd0(c.spread));
      setT(id + '-te', usd0(c.te), c.te > 0 ? 'dn' : undefined); setT(id + '-ts', (c.ts < 0 ? F.minus : '') + usd0(Math.abs(c.ts)));
      setT(id + '-pr', (c.profit < 0 ? F.minus : '') + usd0(Math.abs(c.profit)), c.profit >= 0 ? 'up' : 'dn');
      const msg = $id(id + '-msg');
      if (c.e <= c.k) msg.innerHTML = ui.msg('dn', 'Underwater', 'The share price is at or below your strike. Exercising now would mean paying more than the shares are worth.');
      else if (c.kind === 'nso') msg.innerHTML = ui.msg('acc', 'NSO', `The ${usd0(c.spread)} spread is taxed as pay when you exercise: about ${usd0(c.te)} of federal income tax, Social Security and Medicare. Anything the shares do after that is a capital gain or loss${c.plan === 'hold' ? (c.cgLong ? ', long-term here because you held over a year' : ', short-term until you have held a year') : ''}.`);
      else if (c.kind === 'iso-q') msg.innerHTML = ui.msg(c.amt > 0 ? 'vio' : 'up', 'Qualifying ISO', `No regular tax at exercise, but the ${usd0(c.spread)} spread counts for AMT: about ${usd0(c.amt)} this year. Sell after ${c.qualDate} months from grant and the whole ${usd0(c.total)} gain is long-term.`);
      else msg.innerHTML = ui.msg('acc', 'Disqualifying ISO', `Selling before 2 years from grant and 1 year from exercise turns it into a disqualifying sale: ${usd0(c.oi)} is taxed as pay (no Social Security or Medicare).${c.sameYear ? ' Because you sell in the same year you exercise, there is no AMT.' : ''}`);
    });
  };

  /* =====================================================================================
     Lessons
     ===================================================================================== */
  SML.lessons.push({
    id: 'l-rsu', course: 'benefits', order: 5, title: 'RSUs: taxes at vest and when to sell', mins: 9, level: 'Intermediate',
    summary: 'How vesting shares are taxed, the 22% withholding gap and a simple sell plan.',
    idea: 'RSUs are pay that arrives as shares. They are taxed when they vest, and holding them is a fresh bet on one stock.',
    widget: 'rsuVest',
    try: 'Pick an example, then slide the salary and vest size until the red gap appears. Switch to Hold or sell to see your concentration.',
    body: [
      '<h3>What an RSU is</h3><p>A <b>restricted stock unit</b> is a promise of company shares that arrive on set <b>vesting</b> dates, as long as you still work there. A common schedule is four years with a one-year cliff: nothing for 12 months, then a quarter of the grant, then the rest every quarter. Leave before a date and the unvested units are gone. At private companies, many RSUs are <b>double-trigger</b>: they need both time served and an event such as an IPO before they count.</p>',
      '<h3>How RSUs are taxed</h3><ul><li><b>At vest:</b> the market value of the shares is taxed as pay, exactly like a cash bonus. It shows up on your W-2, with Social Security and Medicare taxes too.</li><li><b>Your cost basis</b> is the price on the vest date. Your holding period starts that day.</li><li><b>When you sell:</b> only the move after vest is a capital gain or loss. Sell within a year and it is short-term; after a year, long-term (see <a href="#l-cap-gains">capital gains</a>).</li></ul><p>Granting the RSUs creates no tax. Selling right at vest creates almost none, because the price barely moved since it was taxed. Check that your 1099-B shows the vest price as your basis: if it shows $0, the vest value gets taxed twice.</p>',
      '<h3>The 22% withholding gap</h3><p>Employers usually withhold federal tax on vesting shares at the flat <b>supplemental</b> rate: 22% on the first $1 million of supplemental pay in a year and 37% above that. Most plans do this by quietly selling some shares (<b>sell to cover</b>).</p><p>If your real top bracket is 24%, 32% or 35%, 22% is not enough, and the rest is due in April. A senior engineer with $60,000 of vesting shares in the 32% bracket can easily owe several thousand dollars more. Fixes: move the gap into savings at each vest, raise withholding on your W-4 (or pick a higher RSU withholding rate if your employer offers one), or make estimated payments. Paying enough during the year also avoids an underpayment penalty; the instructions for IRS Form 2210 explain how much is enough.</p>',
      '<h3>Hold or sell? The bonus test</h3><p>Ask yourself: if this vest were paid as a cash bonus, would I spend it all on my employer’s stock? If not, selling at vest is the same decision. Holding ties your savings to the company that already pays your salary, so one bad year can hit your job and your net worth at once. Many planners suggest keeping any single stock under about 10% of your net worth. Add up all of it: RSUs, ESPP shares, vested options and any company stock inside your 401(k).</p>',
      '<h3>A simple RSU plan</h3><ul><li>Sell at vest, or set up automatic sales, and move the money into broad index funds (see <a href="#l-index-funds">index funds</a>).</li><li>Set aside the tax gap in a high-yield savings account until April (see <a href="#l-emergency">where to park cash</a>).</li><li>Use the cash flow to max your 401(k) and HSA from your paycheck (see <a href="#l-401k-limits">401(k) limits</a>).</li><li>If you are an insider, sell during open trading windows or through a pre-set 10b5-1 plan.</li><li>Selling company shares at a loss close to a vest or an ESPP purchase can run into the <a href="#l-wash-sale">wash sale</a> rule. Ask your broker or CPA how they treat it before you harvest a loss.</li></ul><p>Equity pay gets complicated at high incomes. A CPA or a fee-only adviser who works with tech employees can help you plan the year.</p>',
    ],
    example: {
      title: 'A $60,000 vest in the 32% bracket',
      intro: 'Sam is single, earns a $220,000 salary and has 400 RSUs vesting this year at $150 a share. All numbers are 2026 federal only.',
      steps: [
        '400 shares × $150 = $60,000 is added to Sam’s W-2 pay, just like a bonus.',
        'Taxable income before the vest is $220,000 − $16,100 standard deduction = $203,900, already in the 32% bracket that starts at $201,775.',
        'The vest pushes taxable income to $263,900. $52,325 of it is taxed at 32% and $7,675 at 35%: $16,744 + $2,686 = $19,430 of federal tax.',
        'Payroll withholds 22% for income tax ($13,200) plus Medicare: 1.45% and the extra 0.9% on wages over $200,000 = $1,410. Sam’s pay is already past the $184,500 Social Security wage base, so no Social Security. Selling about 98 of the 400 shares covers it; Sam receives about 302.',
        'The income tax gap is $19,430 − $13,200 = $6,230, due in April. Sam moves $6,230 to savings the day the shares land.',
        'Sam sells the remaining shares at $150. Cost basis is $150, so there is no extra tax, and the money goes into a total market index fund.',
      ],
      result: 'Sam keeps about $39,160 after income tax and Medicare ($60,000 − $19,430 − $1,410), with no surprise bill and little company stock.',
    },
    mistakes: [
      'Assuming the 22% withheld covers the tax. Above the 22% bracket you owe the difference in April.',
      'Holding every vest because selling “feels like losing money”. Selling at vest adds no tax; holding is a new bet on one stock.',
      'Thinking the shares are taxed only when sold. The value is taxed as pay on the vest date whether you sell or not.',
      'Ignoring a $0 cost basis on the 1099-B and paying tax on the vest value a second time.',
    ],
    points: [
      'RSUs are taxed as pay on the vest date; your cost basis is that day’s price.',
      'Withholding is a flat 22% (37% over $1 million), often too little at higher incomes.',
      'Selling right at vest costs almost no extra tax.',
      'Keep any one stock, especially your employer’s, to a small slice of net worth.',
    ],
    quiz: { q: 'Your RSUs vest at $100 a share and you sell them the same day at $100. What is taxed?', options: ['Nothing, because you sold right away', 'The $100 a share as pay; the sale adds about $0 of gain', 'Only the sale, as a short-term capital gain'], answer: 1, why: 'The value at vest is taxed as pay; your basis is $100, so selling at $100 creates no extra gain.' },
    terms: ['RSU', 'Vesting', 'Sell to cover', 'Supplemental withholding', 'Concentration risk', 'Cost basis'],
    glossary: [{ t: '10b5-1 plan', d: 'A written plan that sets future sales in advance, so company insiders can sell shares without timing concerns.' }, { t: 'Double-trigger RSU', d: 'An RSU that needs two events, usually time served and an IPO or sale of the company, before it vests and is taxed.' }],
    sources: [
      { t: 'IRS Rev. Proc. 2025-32: 2026 tax brackets and standard deduction', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
      { t: 'Supplemental wage withholding: 22% up to $1 million, 37% above (IRS Pub. 15)', u: 'https://www.mystockoptions.com/faq/index.cfm/ObjectID/17AAC844-5935-4EB6-AF9EB612AA30AE1C' },
      { t: 'Carta: how RSUs are taxed, cost basis and double-trigger RSUs', u: 'https://carta.com/learn/equity/rsu/' },
    ],
  });

  SML.lessons.push({
    id: 'l-espp', course: 'benefits', order: 6, title: 'ESPP: the 15% discount', mins: 9, level: 'Intermediate',
    summary: 'Why enrolling usually pays, how the lookback works and how the sale is taxed.',
    idea: 'An ESPP lets you buy company stock below market price. Buying and selling right away is one of the best low-risk returns at work.',
    widget: 'esppCalc',
    try: 'Drag the first-day and purchase-day prices, toggle the lookback, then compare selling right away with holding two years.',
    body: [
      '<h3>How an ESPP works</h3><p>An <b>employee stock purchase plan</b> takes a slice of each paycheck, after tax, during an offering period (often six months). On the purchase date it buys company shares for you at a discount, up to 15% in a qualified (Section 423) plan. The IRS caps purchases at $25,000 of stock per calendar year, valued at the price on the first day of the offering.</p>',
      '<h3>The lookback makes it better</h3><p>Many plans add a <b>lookback</b>: the discount applies to the lower of the price on the first day or on the purchase day. If the stock went from $40 to $50, you pay 85% of $40 = $34 for shares worth $50, a 47% gain. If it fell to $35, you pay 85% of $35 = $29.75 and still start 17.6% ahead.</p>',
      '<h3>Why most people should enroll</h3><ul><li>A 15% discount is an instant 17.6% gain on your money (1 ÷ 0.85 − 1), before any price move.</li><li>Your money is withheld bit by bit, so on average it is in the plan for only about three months of a six-month period. That 17.6% works out to about 38% a year counted over six months, and closer to 90% a year once you allow for the money going in gradually.</li><li>If you sell on purchase day, you take very little stock risk.</li></ul><p>Enroll if you can live on the smaller paycheck for six months. If cash is tight, start at a lower percentage rather than skipping it.</p>',
      '<h3>How the sale is taxed</h3><ul><li><b>Disqualifying sale</b> (before two years from the first day or one year from purchase, including selling right away): the discount at purchase (purchase-day price minus what you paid) is taxed as pay. It counts as income tax only: ESPP income is not hit by Social Security or Medicare tax. Employers usually withhold nothing on it, so set aside the tax for April. Any move after purchase is a capital gain or loss.</li><li><b>Qualifying sale</b> (after both holding periods): only the smaller of your actual gain or the discount on the first-day price is taxed as pay; the rest is a long-term gain.</li></ul><p>Holding for the qualifying sale saves some tax, but it means two years with a big piece of your savings in one stock. For most people, selling right away and investing the money broadly wins on risk.</p>',
      '<h3>The cost basis trap</h3><p>Your employer adds the taxable discount to your W-2. Your broker’s Form 1099-B often reports your basis as only what you paid. If you file using that number, you pay tax on the discount twice. Use Form 3922 and your broker’s supplemental statement to report the adjusted basis on Form 8949.</p>',
    ],
    example: {
      title: 'Six months, 10% of pay, sell on purchase day',
      intro: 'Ana earns $100,000, is single and puts 10% of pay into an ESPP with a 15% discount and a lookback.',
      steps: [
        'Over six months she contributes 10% × $100,000 ÷ 2 = $5,000.',
        'The stock is $40 on the first day and $50 on purchase day. With the lookback she pays 85% × $40 = $34 a share.',
        '$5,000 ÷ $34 buys 147 whole shares for $4,998; the leftover $2 is refunded.',
        'The shares are worth 147 × $50 = $7,350, a $2,352 gain (47%), which she sells the same day.',
        'Selling right away is disqualifying: $2,352 is taxed as pay. In her 22% bracket that is about $517 of federal tax.',
        'Her after-tax profit is about $1,835 on $4,998, in six months, with almost no time holding the stock.',
      ],
      result: 'She reports a cost basis of $50 a share (not $34) so the $2,352 is not taxed twice.',
    },
    mistakes: [
      'Skipping the plan because “I can’t pick stocks”. You are not picking: buying at a discount and selling right away is close to a sure gain.',
      'Holding every purchase for the qualifying sale and ending up with a big chunk of savings in one stock.',
      'Using the broker’s 1099-B basis and paying tax twice on the discount.',
      'Contributing so much that you run up credit card debt to cover the smaller paycheck.',
    ],
    points: [
      'A 15% discount is a 17.6% instant gain; a lookback can make it much bigger.',
      'Selling on purchase day keeps the stock risk small.',
      'Disqualifying sale: the discount is taxed as pay. Qualifying sale: more of the gain is long-term.',
      'Report the adjusted cost basis from Form 3922 to avoid double tax.',
    ],
    quiz: { q: 'With a 15% discount and a lookback, the stock is $40 on day one and $50 on purchase day. What do you pay per share?', options: ['$42.50', '$34.00', '$40.00'], answer: 1, why: 'The lookback uses the lower price, $40, and 85% of $40 is $34.' },
    terms: ['ESPP', 'Lookback provision', 'Qualifying disposition', 'Disqualifying disposition', 'Cost basis', 'Concentration risk'],
    glossary: [{ t: 'Form 3922', d: 'The form your employer sends after ESPP purchases, with the dates and prices you need to report the sale correctly.' }, { t: 'Offering period', d: 'The stretch, often six months, during which an ESPP collects your contributions before buying shares.' }],
    sources: [
      { t: 'IRC Section 423: employee stock purchase plans', u: 'https://www.govinfo.gov/content/pkg/USCODE-2023-title26/html/USCODE-2023-title26-subtitleA-chap1-subchapD-partII-sec423.htm' },
      { t: 'Schwab: ESPP taxes, qualifying and disqualifying sales', u: 'https://www.schwab.com/learn/story/espp-taxes' },
      { t: 'IRS Topic 427: Stock options (Form 3922)', u: 'https://www.irs.gov/taxtopics/tc427' },
    ],
  });

  SML.lessons.push({
    id: 'l-stock-options', course: 'benefits', order: 7, title: 'Stock options: ISOs and NSOs', mins: 10, level: 'Advanced',
    summary: 'What exercising costs, how ISOs and NSOs are taxed, AMT and the 90-day trap.',
    idea: 'An employee stock option lets you buy shares at a fixed strike price. When and how you exercise decides most of the tax.',
    widget: 'equityOptions',
    try: 'Switch between ISO and NSO, then drag the exercise and sale points. Watch when the sale turns qualifying.',
    body: [
      '<h3>What you get</h3><p>An employee stock option is the right to buy company shares at a fixed <b>strike price</b>, usually the share value on the grant date. Options vest over time like RSUs and typically expire 10 years after grant. They are worth something only when the share price is above the strike. To own the shares you must <b>exercise</b>: pay the strike price for each share.</p>',
      '<h3>NSOs: taxed as pay when you exercise</h3><p>With a <b>non-qualified stock option</b>, the gap between the share price and the strike at exercise (the <b>spread</b>) is taxed as pay, with Social Security and Medicare, the year you exercise. Your cost basis becomes the price at exercise, and later moves are capital gains or losses. Employers usually withhold the flat 22% supplemental rate on the spread, so at higher incomes NSOs leave the same April gap as <a href="#l-rsu">RSUs</a>.</p>',
      '<h3>ISOs: no regular tax at exercise, but watch AMT</h3><ul><li>Exercising an <b>incentive stock option</b> creates no regular income tax.</li><li>The spread does count for the <b>alternative minimum tax</b>. A big spread can mean a large AMT bill, even if you cannot sell the shares yet. Part of that AMT can come back as a credit in later years.</li><li>Sell at least 2 years after grant and 1 year after exercise and the whole gain is long-term. Sell sooner and it is a disqualifying sale: the spread is taxed as pay (without Social Security or Medicare), and there is no AMT if you sell in the same year you exercised.</li><li>Only $100,000 of ISOs (by grant-date value) can first become exercisable each year; the rest are treated as NSOs.</li></ul>',
      '<h3>Ways to exercise</h3><ul><li><b>Exercise and sell</b> (cashless) at a public company: simple, taxed as pay, no stock risk.</li><li><b>Exercise and hold</b>: you need cash for the strike and for any tax, and you carry the stock risk.</li><li><b>Early exercise with an 83(b) election</b>: some startups let you exercise before vesting. Filing an 83(b) (IRS Form 15620, which can now be filed online) within 30 days means you are taxed on today’s spread, often $0, instead of a bigger one at vesting. For ISOs the election only counts for AMT. Miss the 30 days and it is gone.</li><li>At private companies you may pay tax on shares you cannot sell for years. Exercise only what you can afford to lose.</li></ul>',
      '<h3>Startup shares and QSBS</h3><p>For shares of a qualifying small company acquired after July 4, 2025, the qualified small business stock (QSBS) rules can exclude 50% of the gain after 3 years, 75% after 4 and 100% after 5, up to $15 million (or 10 times your basis, if larger). The company must meet the tests (including gross assets of $75 million or less), so ask before you count on it.</p><h3>When you leave the company</h3><p>Most plans give you a short window, often 90 days, to exercise vested options after you leave. ISOs exercised more than three months after you leave are taxed as NSOs. Unexercised options that are worth something simply disappear when the window closes, so check your plan before you resign. Equity decisions this size deserve a CPA who knows AMT.</p>',
    ],
    example: {
      title: 'Exercising 4,000 startup ISOs',
      intro: 'Lee is single, earns $160,000 and holds 4,000 vested ISOs with a $5 strike. A recent valuation puts the shares at $30.',
      steps: [
        'Exercising costs 4,000 × $5 = $20,000 of cash.',
        'The spread is ($30 − $5) × 4,000 = $100,000. That is not regular income for an ISO.',
        'For AMT, the $100,000 is added to income and the standard deduction is not allowed. On these numbers the simplified estimate is about $17,000 of AMT for the year, on top of about $27,100 of regular tax on the salary.',
        'If Lee had NSOs instead, the $100,000 would be taxed as pay: about $27,400 of extra federal income tax plus about $3,500 of Social Security and Medicare.',
        'Lee holds until 2 years after grant and 1 year after exercise, then sells at $40: the whole $140,000 gain over the strike is long-term.',
      ],
      result: 'Qualifying turns most of the gain into long-term gain, but Lee needed $20,000 plus the AMT in cash and carried a year of single-stock risk.',
    },
    mistakes: [
      'Exercising a large batch of ISOs without checking AMT, then owing tax on paper gains you cannot sell.',
      'Letting vested, in-the-money options expire after leaving the job because the 90-day window passed.',
      'Missing the 30-day deadline for an 83(b) election after an early exercise.',
      'Holding a startup’s shares for the long-term rate while the company’s value falls, so the tax saved is far smaller than the loss.',
    ],
    points: [
      'NSO spread at exercise is taxed as pay; ISO spread can trigger AMT instead.',
      'ISOs held 2 years from grant and 1 year from exercise give an all long-term gain.',
      'Plan the cash for the strike and the tax before you exercise.',
      'Know your post-termination window, often 90 days.',
    ],
    quiz: { q: 'You exercise NSOs with a $10 strike when the stock is $25. What is taxed as pay that year?', options: ['$25 a share', '$15 a share, the spread', 'Nothing until you sell'], answer: 1, why: 'For NSOs the spread at exercise, $25 − $10, is ordinary income.' },
    terms: ['ISO', 'NSO', 'Exercise', 'Bargain element', 'AMT', '83(b) election'],
    glossary: [{ t: 'Post-termination exercise window', d: 'How long you have to exercise vested options after leaving a company, often 90 days.' }, { t: 'Strike price', full: 'Exercise price', d: 'The fixed price per share you pay when you exercise an employee stock option.' }],
    sources: [
      { t: 'IRS Topic 427: Stock options', u: 'https://www.irs.gov/taxtopics/tc427' },
      { t: 'IRC Section 422: incentive stock options (holding periods, $100,000 limit, 3 months)', u: 'https://www.law.cornell.edu/uscode/text/26/422' },
      { t: '2026 AMT exemption and phase-out (Rev. Proc. 2025-32 analysis)', u: 'https://www.currentfederaltaxdevelopments.com/blog/2025/10/9/2026-inflation-adjustments-for-tax-professionals-revenue-procedure-2025-32-analysis' },
      { t: 'Cooley: QSBS changes in the 2025 tax law', u: 'https://www.cooley.com/news/insight/2025/2025-07-11-the-one-big-beautiful-bill-act-expands-qsbs-benefits' },
    ],
  });
})();
