/* Retirement & Wealth: Social Security, Medicare/RMDs/IRMAA and turning savings into a paycheck. Fork W8. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;

  /* ---------------- 2026 figures (research/core-2026.md, checked Oct 2026) ---------------- */
  const FRA = 67; // born 1960 or later
  const SSF = { et: 24480, etFra: 65160, et27: 25560, etFra27: 67920, cola26: 2.8, cola27: 3.6 };
  const PARTB = 202.9;
  const IRMAA = [
    { s: 109000, j: 218000, b: 202.9, d: 0 },
    { s: 137000, j: 274000, b: 284.1, d: 14.5 },
    { s: 171000, j: 342000, b: 405.8, d: 37.5 },
    { s: 205000, j: 410000, b: 527.5, d: 60.4 },
    { s: 500000, j: 750000, b: 649.2, d: 83.3 },
    { s: Infinity, j: Infinity, b: 689.9, d: 91.0 },
  ];
  /* IRS Uniform Lifetime Table (Table III, Pub 590-B, 2022+) */
  const ULT = { 72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4 };
  const TAX = {
    s: { std: 16100, br: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]], ltcg0: 49450, ltcg15: 545500, t1: 25000, t2: 34000 },
    j: { std: 32200, br: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]], ltcg0: 98900, ltcg15: 613700, t1: 32000, t2: 44000 },
  };

  /* ---------------- helpers ---------------- */
  const usd0 = (v) => F.usd(v, 0);
  const kfmt = (v) => {
    const a = Math.abs(v), s = v < 0 ? F.minus : '';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return s + '$' + Math.round(a);
  };
  const niceMax = (v) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 1.5 ? 1.5 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 3 ? 3 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 6 ? 6 : m <= 8 ? 8 : 10) * p; };
  /* nice axis: max rounded up to a multiple of a nice step (about 4 steps) */
  const niceAxis = (raw) => { const step = niceMax(Math.max(raw, 1) / 4); const max = step * Math.ceil(Math.max(raw, 1) / step - 1e-9); const vals = []; for (let v = 0; v <= max + 1e-6; v += step) vals.push(v); return { max, vals }; };
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
  /* Social Security benefit as a share of the full benefit, claiming at `age` (FRA 67) */
  function claimFactor(age) {
    const m = Math.round((age - FRA) * 12);
    if (m < 0) { const e = -m; return 1 - (Math.min(e, 36) * 5) / 900 - (Math.max(0, e - 36) * 5) / 1200; }
    return 1 + (Math.min(m, 36) * 2) / 300;
  }
  /* age where claiming at a2 (later) catches up with claiming at a1 */
  const breakEven = (a1, a2) => { const f1 = claimFactor(a1), f2 = claimFactor(a2); return (f2 * a2 - f1 * a1) / (f2 - f1); };
  const ageStr = (a) => { let y = Math.floor(a), m = Math.round((a - y) * 12); if (m === 12) { y++; m = 0; } return m ? `${y} and ${m} month${m === 1 ? '' : 's'}` : String(y); };
  const ageShort = (a) => { let y = Math.floor(a), m = Math.round((a - y) * 12); if (m === 12) { y++; m = 0; } return m ? `${y} y ${m} m` : String(y); };

  /* federal tax: ord = ordinary income excluding Social Security, lt = long-term gains, ss = benefits */
  function bracketTax(ti, br) { let t = 0, prev = 0; for (const [top, r] of br) { if (ti <= prev) break; t += (Math.min(ti, top) - prev) * r; prev = top; } return t; }
  function ssTaxable(pi, ss, T) {
    if (ss <= 0 || pi <= T.t1) return 0;
    if (pi <= T.t2) return Math.min(0.5 * ss, 0.5 * (pi - T.t1));
    return Math.min(0.85 * ss, 0.85 * (pi - T.t2) + Math.min(0.5 * ss, 0.5 * (T.t2 - T.t1)));
  }
  function fedTax(ord, lt, ss, T) {
    const tss = ssTaxable(ord + lt + 0.5 * ss, ss, T);
    const ordAll = ord + tss;
    const ordTI = Math.max(0, ordAll - T.std);
    const ltTI = Math.max(0, ordAll + lt - T.std) - ordTI;
    let t = bracketTax(ordTI, T.br);
    const at0 = Math.min(ltTI, Math.max(0, T.ltcg0 - ordTI));
    const at15 = Math.min(ltTI - at0, Math.max(0, T.ltcg15 - Math.max(ordTI, T.ltcg0)));
    return t + 0.15 * at15 + 0.2 * Math.max(0, ltTI - at0 - at15);
  }

  SML.css(`
    .wss-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
    .wss-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
    .wss-legend i.dash{height:0;width:16px;border-top:2px dashed var(--ink);border-radius:0;vertical-align:3px}
    .wss-legend i.ghost{border:1.5px dashed var(--muted);background:none}
    .wss-bkts{padding:0}
    .wss-cmp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:var(--surface)}
    .wss-cmp button{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:12px 16px;box-shadow:1px 0 0 var(--line);min-width:0}
    .wss-cmp button:hover{background:var(--surface-2)}
    .wss-cmp button.on{box-shadow:inset 0 3px 0 var(--accent),1px 0 0 var(--line);background:var(--surface-2)}
    .wss-cmp span{font:500 10.5px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
    .wss-cmp b{font:600 17px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
    .wss-cmp b.best{color:var(--up)}
    .wss-cmp small{font-size:12px;color:var(--muted);line-height:1.3}
    @media(max-width:520px){.wss-cmp button{padding:10px 10px}.wss-cmp b{font-size:14px}.wss-cmp small{display:none}}
  `);

  /* =====================================================================
     1. ssClaim: monthly check by claiming age and lifetime totals
     ===================================================================== */
  SML.widgets.ssClaim = function (root) {
    const id = SML.uid('ssc');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">When to claim</span><span class="grow"></span>${ui.seg(id + '-hh', [{ v: 's', label: 'Single' }, { v: 'm', label: 'Married, higher earner' }], 's', 'Household')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-pia', label: 'Your benefit at 67', min: 500, max: 4150, step: 50, value: 2000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-age', label: 'Claim at age', min: 62, max: 70, step: 1, value: 67, fmt: 'plain' })}
        ${ui.slider({ id: id + '-life', label: 'Live to age', min: 70, max: 100, step: 1, value: 87, fmt: 'plain' })}
        ${ui.slider({ id: id + '-work', label: 'Job income while claiming', min: 0, max: 120000, step: 1000, value: 0, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Monthly check', id + '-m', 'hl')}${ui.stat('Versus claiming at 67', id + '-v')}${ui.stat('Collected by 87', id + '-t')}${ui.stat('Best age for that lifespan', id + '-b')}${ui.stat('Held back while working', id + '-w')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">For anyone born in 1960 or later (full retirement age 67). Today's dollars: the yearly cost-of-living raise (2.8% in 2026, 3.6% for 2027) lifts every claiming age alike. Click a bar, or drag the dashed lifespan line. Ignores taxes and any interest on early checks. Get your own estimate at ssa.gov/myaccount.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    let geo = null;
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const pia = st.n(id + '-pia'), c = st.n(id + '-age'), L = st.n(id + '-life'), work = st.n(id + '-work'), hh = st.seg(id + '-hh');
      const compact = W < 520;
      const padL = compact ? 40 : 58, padR = compact ? 12 : 84;
      const ages = [62, 63, 64, 65, 66, 67, 68, 69, 70];
      const mon = (a) => pia * claimFactor(a);
      const cum = (a, A) => mon(a) * 12 * Math.max(0, A - a);
      let b = '';
      /* --- top: monthly check bars --- */
      const tTop = 20, barArea = compact ? 92 : 110, base = tTop + 18 + barArea;
      b += S.text(0, 12, 'MONTHLY CHECK BY CLAIMING AGE', 'cap');
      const pw = W - padL - padR, xw = pw / 9, maxM = pia * 1.24;
      ages.forEach((a, i) => {
        const m = mon(a), h = (m / maxM) * barArea, x = padL + i * xw + xw * 0.16, w = xw * 0.68, on = a === c;
        b += S.rect(x, base - h, w, h, on ? 'f-acc' : a === FRA ? 'f-info o70' : 'f-shade2', 2);
        b += S.text(x + w / 2, base - h - 6, compact ? kfmt(m) : usd0(m), (on ? 'sm b ink' : 'xs mut') + ' mono', 'middle');
        b += S.text(x + w / 2, base + 15, String(a), on ? 'sm b acc' : 'sm', 'middle');
        if (!compact) b += S.text(x + w / 2, base + 29, Math.round(claimFactor(a) * 1000) / 10 + '%', 'xs mono', 'middle');
        b += S.rect(padL + i * xw, tTop, xw, base - tTop + 18, 'hit wss-bar', 0, ` data-age="${a}" style="cursor:pointer"`);
      });
      b += S.line(padL, base + 0.5, W - padR, base + 0.5, 's-line');
      if (!compact) b += S.text(W - padR + 8, base - 4, 'share of', 'xs') + S.text(W - padR + 8, base + 8, 'full benefit', 'xs') + S.text(W - padR + 8, base + 29, '← at each age', 'xs');
      /* --- bottom: cumulative totals --- */
      const y0 = base + (compact ? 44 : 58);
      b += S.text(0, y0, 'TOTAL COLLECTED BY AGE', 'cap');
      const pTop = y0 + 18, pBot = pTop + (compact ? 190 : 236), H = pBot + 30;
      const x = SML.lin(62, 100, padL, W - padR);
      const ax = niceAxis(Math.max(cum(62, 100), cum(70, 100), cum(c, 100))), ymax = ax.max;
      const y = SML.lin(0, ymax, pBot, pTop);
      ax.vals.forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid'); b += S.text(padL - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      for (let A = 65; A <= 100; A += compact ? 10 : 5) b += S.text(x(A), pBot + 16, String(A), 'xs mono', 'middle');
      b += S.line(padL, pBot + 0.5, W - padR, pBot + 0.5, 's-line');
      const lines = [[62, 's-dn', 'dn'], [67, 's-info', 'info'], [70, 's-up', 'up']];
      if (lines.every((q) => q[0] !== c)) lines.push([c, 's-acc', 'acc']);
      const lab = [];
      lines.forEach(([a, sc, tc]) => {
        const on = a === c;
        b += S.poly([[x(62), y(0)], [x(a), y(0)], [x(100), y(cum(a, 100))]], `${sc} ${on ? 'w3' : 'w15'}${on ? '' : ' o70'}`);
        lab.push({ a, tc, on, yy: y(cum(a, 100)) });
      });
      /* line labels at the right edge, nudged apart */
      lab.sort((p, q) => p.yy - q.yy);
      for (let i = 1; i < lab.length; i++) if (lab[i].yy - lab[i - 1].yy < 13) lab[i].yy = lab[i - 1].yy + 13;
      lab.forEach((p) => { b += compact ? S.text(W - padR - 2, p.yy - 5, 'at ' + p.a, `xs b ${p.tc}`, 'end') : S.text(W - padR + 6, p.yy + 4, 'claim ' + p.a, `sm ${p.on ? 'b ' : ''}${p.tc}`); });
      /* break-even marker */
      const [ba, bb] = c > 62 ? [62, c] : [62, 70];
      const be = breakEven(ba, bb);
      if (be <= 100) {
        const by = y(cum(bb, be));
        b += S.circle(x(be), by, 5, 'f-bg s-ink w2');
        b += S.text(x(be) - 8, by - 9, `even at ${ageShort(be)}`, 'sm b ink', 'end');
      }
      /* lifespan line + handle */
      const lx = x(L);
      b += S.line(lx, pTop - 4, lx, pBot, 's-ink dash w15');
      b += S.rect(lx - 9, pTop - 14, 18, 18, 'handle wss-life', 4);
      b += S.text(lx + (lx > W - padR - 80 ? -14 : 14), pTop + 2, `live to ${L}`, 'sm b ink', lx > W - padR - 80 ? 'end' : 'start');
      const tot = cum(c, L);
      b += S.circle(lx, y(tot), 5, 'f-acc');
      b += S.rect(padL, pTop, W - padL - padR, pBot - pTop, 'hit wss-hov');
      geo = { x, padL, padR, W, pTop, pBot };
      fig.innerHTML = S.wrap(W, H, `Monthly Social Security check for claiming ages 62 to 70, and lifetime totals by age, with a break-even near ${ageShort(be)}`, b);

      /* stats */
      const m = mon(c);
      let best = 62, bestV = -1; ages.forEach((a) => { const v = cum(a, L); if (v > bestV + 0.5) { bestV = v; best = a; } });
      const withheld = c < FRA && work > SSF.et ? Math.min(m * 12, (work - SSF.et) / 2) : 0;
      document.getElementById(id + '-m').textContent = usd0(m);
      document.getElementById(id + '-v').textContent = c === FRA ? 'Full benefit' : F.spct((claimFactor(c) - 1) * 100, 1);
      const tEl = document.getElementById(id + '-t'); tEl.textContent = kfmt(tot); tEl.previousElementSibling.textContent = `Collected by ${L}`;
      document.getElementById(id + '-b').textContent = best === c ? `${best} (yours)` : String(best);
      document.getElementById(id + '-w').textContent = c >= FRA ? 'None at 67+' : withheld > 0 ? usd0(withheld) + '/yr' : '$0';

      let pill, txt;
      if (c === 62) { pill = ['dn', 'Earliest']; txt = `Claiming at 62 pays ${usd0(m)} a month, 30% less than at 67, for life. Against waiting to 70 it stays ahead only if you die before about ${ageStr(breakEven(62, 70))}.`; }
      else if (c === 70) { pill = ['up', 'Biggest check']; txt = `Waiting to 70 pays ${usd0(m)} a month: 24% more than at 67 and 77% more than at 62. It pulls ahead of claiming at 62 at about ${ageStr(be)}.`; }
      else if (c < FRA) { pill = ['acc', 'Early']; txt = `Claiming at ${c} pays ${usd0(m)} a month, ${Math.round((1 - claimFactor(c)) * 1000) / 10}% less than at 67. Waiting catches up with claiming at 62 at about ${ageStr(be)}.`; }
      else { pill = ['info', c === FRA ? 'Full benefit' : 'Delayed']; txt = `Claiming at ${c} pays ${usd0(m)} a month${c > FRA ? `, ${Math.round((claimFactor(c) - 1) * 100)}% more than at 67` : ''}. It catches up with claiming at 62 at about ${ageStr(be)}.`; }
      txt += best === 62 ? ` If you live only to ${L}, claiming at 62 collects the most.` : ` Living to ${L}, the best age is ${best}: ${usd0(cum(best, L) - cum(62, L))} more in total than claiming at 62.`;
      if (hh === 'm') txt += ' As the higher earner, your check also becomes your spouse’s survivor benefit, so waiting raises what they live on if you die first.';
      if (withheld > 0) txt += ` Earning ${usd0(work)} before 67 means about ${usd0(withheld)} a year is held back; SSA raises your check at 67 to make up for the withheld months.`;
      document.getElementById(id + '-msg').innerHTML = ui.msg(pill[0], pill[1], txt);
    });

    fig.addEventListener('click', (e) => { const t = e.target.closest('.wss-bar'); if (!t) return; st.set(id + '-age', Number(t.dataset.age)); draw(true); });
    ui.drag(fig, {
      sel: '.wss-life',
      move(pt) { if (!geo) return; const A = Math.round(SML.clamp(70 + ((pt.x - geo.x(70)) / (geo.x(100) - geo.x(70))) * 30, 70, 100)); if (A !== st.n(id + '-life')) { st.set(id + '-life', A); draw(true); } },
    });
    fig.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.wss-hov'); if (!t || !geo) { tip.hide(); return; }
      const svg = fig.querySelector('svg'); const pt = ui.pt(svg, e);
      const A = Math.round(SML.clamp(62 + ((pt.x - geo.padL) / (geo.W - geo.padL - geo.padR)) * 38, 62, 100));
      const pia = st.n(id + '-pia'), c = st.n(id + '-age');
      const row = (a) => `claim ${a}: <b>${kfmt(pia * claimFactor(a) * 12 * Math.max(0, A - a))}</b>`;
      tip.show(pt.x, pt.y, `By age ${A}<br>${[62, 67, 70].concat([62, 67, 70].includes(c) ? [] : [c]).map(row).join('<br>')}`, geo.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
  };

  /* =====================================================================
     2. rmdCalc: required minimum distributions and the IRMAA line
     ===================================================================== */
  SML.widgets.rmdCalc = function (root) {
    const id = SML.uid('rmd');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Required withdrawals</span><span class="grow"></span>${ui.seg(id + '-born', [{ v: '73', label: 'Born 1951–58' }, { v: '75', label: 'Born 1960+' }], '75', 'Birth year')}${ui.seg(id + '-fil', [{ v: 's', label: 'Single' }, { v: 'j', label: 'Married' }], 's', 'Filing status')}</div>
      <div class="wg-bar"><div class="wss-legend"><span><i style="background:var(--info)"></i>Other income</span><span><i style="background:var(--accent)"></i>RMD</span><span><i style="background:var(--down)"></i>Above the IRMAA line</span><span><i class="ghost"></i>RMD with no Roth moves</span></div></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-bal', label: 'Pre-tax savings when RMDs start', min: 100000, max: 4000000, step: 25000, value: 1200000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-g', label: 'Growth after inflation', min: 0, max: 7, step: 0.5, value: 3, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-oth', label: 'Other MAGI (pension, taxable Social Security)', min: 0, max: 200000, step: 1000, value: 70000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-conv', label: 'Moved to Roth before RMDs', min: 0, max: 60, step: 5, value: 0, fmt: 'pct' })}
      </div>
      <div class="wg-read">${ui.stat('First RMD', id + '-f', 'hl')}${ui.stat('Divisor that year', id + '-d')}${ui.stat('RMD at 85', id + '-85')}${ui.stat('All RMDs to 95', id + '-tot')}${ui.stat('Years over the IRMAA line', id + '-irm')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">RMD = last December 31 balance ÷ the IRS Uniform Lifetime Table divisor for your age that year. Simplified: other income counts only the taxable part of Social Security and stays flat, figures are in today's dollars, and the line is 2026's first IRMAA threshold (income from two years earlier sets each year's Medicare premium). Hover a bar for details.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    let geo = null, rows = [];
    const st = ui.wire(root, () => draw());
    const sim = (start, bal, g) => { const out = []; let B = bal; for (let a = start; a <= 95; a++) { const d = ULT[a]; const r = B / d; out.push({ a, B, d, r }); B = (B - r) * (1 + g); } return out; };
    const draw = ui.responsive(fig, (W) => {
      const start = Number(st.seg(id + '-born')), fil = st.seg(id + '-fil');
      const bal0 = st.n(id + '-bal'), g = st.n(id + '-g') / 100, oth = st.n(id + '-oth'), conv = st.n(id + '-conv') / 100;
      const thr = fil === 'j' ? IRMAA[0].j : IRMAA[0].s;
      const base = sim(start, bal0, g), mine = sim(start, bal0 * (1 - conv), g);
      rows = mine.map((r, i) => ({ ...r, other: oth, total: oth + r.r, ghost: base[i].r }));
      const compact = W < 520;
      const padL = compact ? 42 : 56, padR = compact ? 10 : 96, top = 16, bot = compact ? 230 : 280, H = bot + 30;
      const ax = niceAxis(Math.max(thr * 1.18, ...rows.map((r) => Math.max(r.total, r.other + r.ghost)))), ymax = ax.max;
      const y = SML.lin(0, ymax, bot, top);
      const n = rows.length, bw = (W - padL - padR) / n;
      let b = '';
      ax.vals.forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      rows.forEach((r, i) => {
        const x0 = padL + i * bw + bw * 0.14, w = bw * 0.72;
        b += S.rect(x0, y(r.other), w, bot - y(r.other), 'f-info o70');
        b += S.rect(x0, y(r.total), w, y(r.other) - y(r.total), 'f-acc');
        if (r.total > thr) { const lo = Math.max(thr, r.other); b += S.rect(x0, y(r.total), w, y(lo) - y(r.total), 'f-dn'); }
        if (conv > 0) b += S.rect(x0, y(r.other + r.ghost), w, y(r.total) - y(r.other + r.ghost), 'nf s-mut dash2 w1');
        const step = compact ? 5 : n > 22 ? 5 : 2;
        if ((r.a - start) % step === 0 || i === n - 1 && (r.a - start) % step > 2) b += S.text(x0 + w / 2, bot + 16, String(r.a), r.a === start ? 'xs b acc' : 'xs mono', 'middle');
      });
      b += S.line(padL, bot + 0.5, W - padR, bot + 0.5, 's-line');
      b += S.line(padL, y(thr), W - padR + (compact ? 0 : 6), y(thr), 's-dn dash w15');
      if (compact) { const lt = `IRMAA line ${kfmt(thr)}`; b += S.rect(padL + 2, y(thr) - 19, lt.length * 6.2 + 10, 15, 'f-bg', 3) + S.text(padL + 7, y(thr) - 8, lt, 'xs b dn'); }
      else { b += S.text(W - padR + 10, y(thr) - 2, 'IRMAA', 'sm b dn'); b += S.text(W - padR + 10, y(thr) + 12, 'starts ' + kfmt(thr), 'xs dn'); }
      const r0 = rows[0];
      if (!compact) b += S.text(padL + bw * 0.5, y(r0.total) - 8, `first RMD ${kfmt(r0.r)}`, 'sm b acc', 'start');
      b += S.rect(padL, top, W - padL - padR, bot - top, 'hit wss-hov');
      geo = { padL, bw, W, n };
      fig.innerHTML = S.wrap(W, H, `Required minimum distributions from age ${start} to 95 stacked on other income, against the first IRMAA threshold`, b);

      const r85 = rows.find((r) => r.a === 85);
      const tot = rows.reduce((s, r) => s + r.r, 0), totBase = base.reduce((s, r) => s + r.r, 0);
      const over = rows.filter((r) => r.total > thr).length;
      const fEl = document.getElementById(id + '-f'); fEl.textContent = usd0(r0.r); fEl.previousElementSibling.textContent = `First RMD, at ${start}`;
      document.getElementById(id + '-d').textContent = String(r0.d);
      document.getElementById(id + '-85').textContent = usd0(r85.r);
      document.getElementById(id + '-tot').textContent = kfmt(tot);
      document.getElementById(id + '-irm').textContent = `${over} of ${rows.length}`;
      let txt = `Your first RMD at ${start} is ${usd0(r0.r)}: ${kfmt(r0.B)} ÷ ${r0.d}. The divisor shrinks every year (16.0 at 85), so the required share climbs from ${F.pct(100 / r0.d, 1)} to ${F.pct(100 / 16, 1)} of the balance.`;
      txt += over ? ` In ${over} of ${rows.length} years your income lands above the first IRMAA line, which raises Medicare premiums two years later.` : ' Your income stays under the first IRMAA line every year.';
      if (conv > 0) txt += ` Moving ${Math.round(conv * 100)}% to Roth beforehand cuts lifetime RMDs by ${kfmt(totBase - tot)}; the Roth has no RMDs while you live.`;
      document.getElementById(id + '-msg').innerHTML = ui.msg(over ? 'dn' : 'up', over ? 'IRMAA risk' : 'Under the line', txt);
    });
    fig.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.wss-hov'); if (!t || !geo) { tip.hide(); return; }
      const pt = ui.pt(fig.querySelector('svg'), e); const i = SML.clamp(Math.floor((pt.x - geo.padL) / geo.bw), 0, geo.n - 1); const r = rows[i]; if (!r) return;
      tip.show(pt.x, pt.y, `Age ${r.a} · divisor ${r.d}<br>Balance ${kfmt(r.B)}<br>RMD <b>${usd0(r.r)}</b><br>Total income ${usd0(r.total)}`, geo.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
  };

  /* =====================================================================
     3. irmaaLadder: the Medicare premium staircase
     ===================================================================== */
  SML.widgets.irmaaLadder = function (root) {
    const id = SML.uid('irm');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Medicare premiums, 2026</span><span class="grow"></span>${ui.seg(id + '-fil', [{ v: 's', label: 'Single' }, { v: 'j', label: 'Married' }], 's', 'Filing status')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-magi', label: 'Your 2024 income (MAGI)', min: 40000, max: 850000, step: 1000, value: 125000, fmt: 'usd0' })}</div>
      <div class="wg-read">${ui.stat('Part B per month', id + '-b', 'hl')}${ui.stat('Part D add-on', id + '-d')}${ui.stat('Extra per year, each', id + '-x')}${ui.stat('Room to the next line', id + '-r')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 premiums use your modified adjusted gross income from 2024. Each spouse on Medicare pays the surcharge. Drag the marker or the slider. Source: CMS 2026 fact sheet.</div>`;
    const fig = root.querySelector('.wg-fig');
    let geo = null;
    const st = ui.wire(root, () => draw());
    const tierOf = (magi, k) => IRMAA.findIndex((t) => magi <= t[k]);
    const draw = ui.responsive(fig, (W) => {
      const fil = st.seg(id + '-fil'), k = fil === 'j' ? 'j' : 's', magi = st.n(id + '-magi');
      const compact = W < 520;
      const padL = compact ? 40 : 52, padR = compact ? 12 : 20, top = 26, bot = compact ? 210 : 250, H = bot + 34;
      const MIN = 40000, MAX = 850000;
      /* equal-width steps: each tier gets the same width, income maps linearly inside its tier */
      const bounds = [MIN].concat(IRMAA.slice(0, -1).map((t) => t[k]), [MAX]);
      const tw = (W - padL - padR) / IRMAA.length;
      const x = (m) => { const v = SML.clamp(m, MIN, MAX); let i = bounds.findIndex((bb, j) => j > 0 && v <= bb); if (i < 1) i = bounds.length - 1; const lo = bounds[i - 1], hi = bounds[i]; return padL + (i - 1) * tw + ((v - lo) / (hi - lo)) * tw; };
      const xinv = (px) => { const f = SML.clamp((px - padL) / tw, 0, IRMAA.length - 1e-6); const i = Math.floor(f); return bounds[i] + (f - i) * (bounds[i + 1] - bounds[i]); };
      const y = SML.lin(0, 800, bot, top);
      let b = '';
      [0, 200, 400, 600, 800].forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, '$' + v, 'xs mono', 'end'); });
      const ti = tierOf(magi, k);
      let path = '';
      IRMAA.forEach((t, i) => {
        const xa = padL + i * tw, xb = xa + tw, v = t.b + t.d;
        path += `${i ? ' L' : 'M'}${xa},${y(v)} L${xb},${y(v)}`;
        b += S.rect(xa, y(v), tw, bot - y(v), i === ti ? 'f-acc-t' : i ? 'f-dn-t o50' : 'f-up-t o70');
        b += S.text(xa + tw / 2, y(v) - 7, '$' + Math.round(v), (i === ti ? 'sm b ink' : 'xs mut') + ' mono', 'middle');
        if (!compact) b += S.text(xa + tw / 2, bot - 8, i ? 'tier ' + i : 'standard', 'xs', 'middle');
        if (i) { b += S.line(xa, y(v), xa, bot, 's-grid'); b += S.text(xa, bot + 16, kfmt(bounds[i]), 'xs mono', 'middle'); }
      });
      b += S.path(path, 'nf s-ink w2');
      b += S.line(padL, bot + 0.5, W - padR, bot + 0.5, 's-line');
      b += S.text(compact ? 0 : padL, 14, compact ? 'MONTHLY, PER PERSON' : 'MONTHLY PART B + PART D ADD-ON, PER PERSON', 'cap');
      const t = IRMAA[ti], v = t.b + t.d, mx = x(magi);
      b += S.line(mx, top, mx, bot, 's-acc w2');
      b += S.circle(mx, y(v), 9, 'handle wss-irm');
      const lbl = `you: ${kfmt(magi)}`, right = mx > W - padR - 90;
      b += S.text(mx + (right ? -14 : 14), y(v) + 26 > bot - 6 ? y(v) - 14 : y(v) + 26, lbl, 'sm b acc', right ? 'end' : 'start');
      b += S.text(W - padR, bot + 30, 'income two years earlier, steps not to scale →', 'xs', 'end');
      geo = { xinv };
      fig.innerHTML = S.wrap(W, H, 'Medicare Part B premium staircase by income, with your income marked', b);

      const extra = (t.b - PARTB + t.d) * 12;
      const room = isFinite(t[k]) ? t[k] - magi : null;
      document.getElementById(id + '-b').textContent = F.usd(t.b);
      document.getElementById(id + '-d').textContent = t.d ? '+' + F.usd(t.d) : '$0';
      document.getElementById(id + '-x').textContent = extra ? usd0(extra) : '$0';
      document.getElementById(id + '-r').textContent = room == null ? 'Top tier' : usd0(room);
      const nx = IRMAA[ti + 1];
      const jump = nx ? ((nx.b - t.b) + (nx.d - t.d)) * 12 : 0;
      let txt;
      if (ti === 0) txt = `You pay the standard ${F.usd(PARTB)} a month for Part B. You are ${usd0(room)} under the first line; going one dollar over would add about ${usd0(jump)} a year per person.`;
      else txt = `Your income puts you in surcharge tier ${ti}: ${F.usd(t.b)} a month for Part B plus ${F.usd(t.d)} on top of your drug plan. That is ${usd0(extra)} a year more than the standard premium, per person.${nx ? ` The next line is ${usd0(room)} away and would add ${usd0(jump)} more.` : ''} If income fell after a life-changing event such as retiring, ask SSA to use newer income on Form SSA-44.`;
      document.getElementById(id + '-msg').innerHTML = ui.msg(ti ? 'dn' : 'up', ti ? 'Surcharge' : 'Standard', txt);
    });
    ui.drag(fig, {
      sel: '.wss-irm',
      move(pt) { if (!geo) return; const v = Math.round(SML.clamp(geo.xinv(pt.x), 40000, 850000) / 1000) * 1000; st.set(id + '-magi', v); draw(true); },
    });
  };

  /* =====================================================================
     4. paycheckBuilder: a retirement paycheck stacked from sources
     ===================================================================== */
  const PRESETS = {
    couple: { fil: 'j', ret: 62, spend: 7000, ss: 3800, ssAge: 67, tx: 400000, tr: 900000, ro: 150000, r: 3.5 },
    single: { fil: 's', ret: 67, spend: 4500, ss: 2400, ssAge: 67, tx: 150000, tr: 500000, ro: 80000, r: 3.5 },
    early: { fil: 'j', ret: 55, spend: 6000, ss: 3400, ssAge: 67, tx: 900000, tr: 800000, ro: 200000, r: 3.5 },
  };
  const STRATS = [
    { v: 'conv', label: 'Taxable first', long: 'Taxable, then pre-tax, then Roth' },
    { v: 'fill', label: 'Fill the 12% bracket', long: 'Pre-tax up to the 12% bracket each year, extra converted to Roth' },
    { v: 'prop', label: 'Proportional', long: 'A slice from every account each year' },
  ];
  function fillTarget(ss, T) { const target = T.std + T.br[1][0]; let f = target; for (let k = 0; k < 10; k++) f = Math.max(0, target - ssTaxable(f + 0.5 * ss, ss, T)); return f; }
  function simulate(p, strat) {
    const T = TAX[p.fil], g = p.r / 100;
    let tx = p.tx, tr = p.tr, ro = p.ro;
    const rows = []; let life = 0, shortAge = null, convTot = 0;
    for (let age = p.ret; age <= 95; age++) {
      const ss = age >= p.ssAge ? p.ss * 12 : 0, need = p.spend * 12;
      const rmd = age >= 75 && tr > 0 ? tr / ULT[age] : 0;
      const early = age < 60; // before 59½: pre-tax money spent pays a 10% penalty (conversions do not)
      const plan = (tax) => {
        let gap = need + tax - ss;
        const w = { tx: 0, tr: 0, ro: 0, conv: 0, reinv: 0, pen: 0 };
        let trL = tr, txL = tx, roL = ro;
        const fromTr = (amt) => { const a = Math.max(0, Math.min(amt, trL)); trL -= a; return a; };
        let out = fromTr(rmd);
        if (strat === 'fill') out += fromTr(Math.max(0, fillTarget(ss, T) - out));
        const use = early ? 0 : Math.min(out, Math.max(0, gap)); w.tr += use; gap -= use;
        const extra = out - use;
        if (extra > 0) { const rx = Math.max(0, Math.min(extra, rmd - use)); w.reinv = rx; w.conv = extra - rx; }
        if (gap > 0) {
          if (strat === 'prop') {
            const A = txL + roL + (early ? 0 : trL);
            if (A > 0) { const gg = Math.min(gap, A); const a1 = (gg * txL) / A, a3 = (gg * roL) / A, a2 = early ? 0 : (gg * trL) / A; w.tx += a1; txL -= a1; w.tr += a2; trL -= a2; w.ro += a3; roL -= a3; gap -= gg; }
            if (gap > 0) { const a = Math.min(gap, trL); w.tr += a; trL -= a; gap -= a; if (early) w.pen += 0.1 * a; }
          } else {
            let a = Math.min(gap, txL); w.tx += a; txL -= a; gap -= a;
            if (early) { a = Math.min(gap, roL); w.ro += a; roL -= a; gap -= a; a = Math.min(gap, trL); w.tr += a; trL -= a; gap -= a; w.pen += 0.1 * a; }
            else { a = Math.min(gap, trL); w.tr += a; trL -= a; gap -= a; a = Math.min(gap, roL); w.ro += a; roL -= a; gap -= a; }
          }
        }
        w.short = Math.max(0, gap);
        w.left = { tx: txL + w.reinv, tr: trL, ro: roL + w.conv };
        return w;
      };
      let tax = 0, w = plan(0);
      for (let k = 0; k < 8; k++) { const t = fedTax(w.tr + w.conv + w.reinv, 0.5 * w.tx, ss, T) + w.pen; if (Math.abs(t - tax) < 0.5) { tax = t; break; } tax = t; w = plan(tax); }
      tax = fedTax(w.tr + w.conv + w.reinv, 0.5 * w.tx, ss, T) + w.pen;
      life += tax; convTot += w.conv;
      if (w.short > need * 0.01 && shortAge == null) shortAge = age;
      tx = w.left.tx * (1 + g); tr = w.left.tr * (1 + g); ro = w.left.ro * (1 + g);
      rows.push({ age, ss, need, tax, tx: w.tx, tr: w.tr, ro: w.ro, conv: w.conv, reinv: w.reinv, short: w.short, bal: tx + tr + ro, b: { tx, tr, ro } });
    }
    return { rows, life, shortAge, convTot, left: tx + tr + ro };
  }
  SML.widgets.paycheckBuilder = function (root) {
    const id = SML.uid('pay');
    const P = PRESETS.couple;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Example</span>${ui.seg(id + '-pre', [{ v: 'couple', label: 'Couple at 62' }, { v: 'single', label: 'Single at 67' }, { v: 'early', label: 'Early at 55' }], 'couple', 'Example')}<span class="grow"></span>${ui.seg(id + '-fil', [{ v: 's', label: 'Single' }, { v: 'j', label: 'Married' }], P.fil, 'Filing status')}</div>
      <div class="wss-cmp" role="group" aria-label="Withdrawal order">${STRATS.map((s, i) => `<button type="button" data-v="${s.v}" class="${i === 0 ? 'on' : ''}" aria-pressed="${i === 0}" title="${s.long}"><span>${s.label}</span><b id="${id}-c${s.v}">—</b><small id="${id}-d${s.v}">${s.long}</small></button>`).join('')}</div>
      <div class="wg-bar"><div class="wss-legend"><span><i style="background:var(--info)"></i>Social Security</span><span><i style="background:var(--accent)"></i>Taxable</span><span><i style="background:var(--violet)"></i>Pre-tax</span><span><i style="background:var(--up)"></i>Roth</span><span><i style="background:var(--down)"></i>Short</span><span><i class="dash"></i>Spending</span></div></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-ret', label: 'Retire at', min: 55, max: 70, step: 1, value: P.ret, fmt: 'plain' })}
        ${ui.slider({ id: id + '-spend', label: 'Spending per month', min: 2000, max: 20000, step: 250, value: P.spend, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ss', label: 'Social Security per month', min: 0, max: 8000, step: 50, value: P.ss, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ssa', label: 'Social Security starts at', min: 62, max: 70, step: 1, value: P.ssAge, fmt: 'plain' })}
        ${ui.slider({ id: id + '-tx', label: 'Taxable brokerage', min: 0, max: 3000000, step: 25000, value: P.tx, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-tr', label: 'Pre-tax 401(k) / IRA', min: 0, max: 3000000, step: 25000, value: P.tr, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ro', label: 'Roth', min: 0, max: 2000000, step: 25000, value: P.ro, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-r', label: 'Return after inflation', min: 0, max: 6, step: 0.5, value: P.r, fmt: 'pct1' })}
      </div>
      <div class="wg-read">${ui.stat('Money lasts', id + '-last', 'hl')}${ui.stat('Lifetime federal tax', id + '-tax')}${ui.stat('Social Security covers', id + '-cov')}${ui.stat('Moved to Roth', id + '-conv')}${ui.stat('Left at 95, after tax', id + '-left')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Today's dollars, federal tax only, 2026 brackets and standard deduction. Assumes half of each taxable-account sale is gain, Roth money taken before 59½ is your own contributions, a 10% penalty on pre-tax money spent before 60 (conversions are penalty-free; see the Rule of 55 and 72(t) in the FIRE track), required withdrawals from 75 (born 1960 or later), and Social Security amounts for the whole household. Pre-tax money left at 95 is counted after a 22% tax. Ignores state tax, the temporary senior deduction, health-insurance subsidies before 65 and Medicare surcharges. Hover a year for details.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    let strat = 'conv', geo = null, res = null;
    const read = () => ({ fil: st.seg(id + '-fil'), ret: st.n(id + '-ret'), spend: st.n(id + '-spend'), ss: st.n(id + '-ss'), ssAge: st.n(id + '-ssa'), tx: st.n(id + '-tx'), tr: st.n(id + '-tr'), ro: st.n(id + '-ro'), r: st.n(id + '-r') });
    const st = ui.wire(root, (e) => {
      const pre = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (pre) { const p = PRESETS[st.seg(id + '-pre')]; if (p) { st.setSeg(id + '-fil', p.fil); st.set(id + '-ret', p.ret); st.set(id + '-spend', p.spend); st.set(id + '-ss', p.ss); st.set(id + '-ssa', p.ssAge); st.set(id + '-tx', p.tx); st.set(id + '-tr', p.tr); st.set(id + '-ro', p.ro); st.set(id + '-r', p.r); } }
      draw(true);
    });
    root.querySelector('.wss-cmp').addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return; strat = btn.dataset.v;
      root.querySelectorAll('.wss-cmp button').forEach((x) => { x.classList.toggle('on', x === btn); x.setAttribute('aria-pressed', x === btn); });
      draw(true);
    });
    const draw = ui.responsive(fig, (W) => {
      const p = read();
      const all = {}; STRATS.forEach((s) => { all[s.v] = simulate(p, s.v); });
      res = all[strat];
      const rows = res.rows;
      const compact = W < 520;
      const padL = compact ? 42 : 56, padR = compact ? 10 : 18, top = 14, bot = compact ? 230 : 290, H = bot + 30;
      const mon = (v) => v / 12;
      const ax = niceAxis(Math.max(p.spend * 1.25, ...rows.map((r) => mon(r.ss + r.tx + r.tr + r.ro + r.short)))), ymax = ax.max;
      const y = SML.lin(0, ymax, bot, top);
      const n = rows.length, bw = (W - padL - padR) / n;
      let b = '';
      ax.vals.forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      rows.forEach((r, i) => {
        const x0 = padL + i * bw + Math.min(2, bw * 0.12), w = Math.max(1, bw - Math.min(4, bw * 0.24));
        let acc = 0;
        [[r.ss, 'f-info'], [r.tx, 'f-acc'], [r.tr, 'f-vio'], [r.ro, 'f-up'], [r.short, 'f-dn']].forEach(([v, cls]) => { if (v <= 0) return; const a = mon(acc), bb = mon(acc + v); b += S.rect(x0, y(bb), w, y(a) - y(bb), cls); acc += v; });
        const step = compact ? 10 : 5;
        if (r.age % step === 0) b += S.text(x0 + w / 2, bot + 16, String(r.age), 'xs mono', 'middle');
        if (r.conv > 1 && !compact) b += S.circle(x0 + w / 2, y(mon(acc)) - 5, 2.2, 'f-vio');
      });
      b += S.line(padL, bot + 0.5, W - padR, bot + 0.5, 's-line');
      b += S.line(padL, y(p.spend), W - padR, y(p.spend), 's-ink dash w15');
      { const lt = `spend ${kfmt(p.spend)}/mo`; b += S.rect(padL + 2, y(p.spend) - 21, lt.length * 6.6 + 10, 16, 'f-bg', 3) + S.text(padL + 7, y(p.spend) - 9, lt, 'sm b ink'); }
      if (p.ssAge > p.ret && p.ssAge <= 95 && p.ss > 0) { const i = p.ssAge - p.ret; const sx = padL + i * bw; b += S.line(sx, top, sx, bot, 's-info dash2'); b += S.text(sx + 4, top + 10, 'Social Security starts', 'xs info b'); }
      b += S.rect(padL, top, W - padL - padR, bot - top, 'hit wss-hov');
      geo = { padL, bw, W, n };
      fig.innerHTML = S.wrap(W, H, 'Monthly retirement paycheck by age, stacked by source: Social Security, taxable, pre-tax and Roth withdrawals', b);

      const after = (r) => { const e = r.rows[r.rows.length - 1].b; return e.tx + e.ro + e.tr * 0.78; };
      const score = (r) => (r.shortAge == null ? 1e12 + after(r) : r.shortAge);
      STRATS.forEach((s) => { const r = all[s.v]; document.getElementById(id + '-c' + s.v).textContent = r.shortAge == null ? kfmt(after(r)) + ' left' : 'short at ' + r.shortAge; document.getElementById(id + '-d' + s.v).textContent = `after tax at 95 · ${kfmt(r.life)} tax paid`; });
      const best = STRATS.reduce((a, s) => (score(all[s.v]) > score(all[a]) ? s.v : a), 'conv');
      STRATS.forEach((s) => document.getElementById(id + '-c' + s.v).classList.toggle('best', s.v === best));
      const firstSS = rows.find((r) => r.ss > 0);
      document.getElementById(id + '-last').textContent = res.shortAge == null ? '95+' : 'to ' + (res.shortAge - 1);
      document.getElementById(id + '-tax').textContent = kfmt(res.life);
      document.getElementById(id + '-cov').textContent = firstSS ? F.pct(Math.min(100, (firstSS.ss / firstSS.need) * 100), 0) : '—';
      document.getElementById(id + '-conv').textContent = res.convTot > 1 ? kfmt(res.convTot) : '$0';
      document.getElementById(id + '-left').textContent = kfmt(after(res));
      const sname = STRATS.find((s) => s.v === strat).label.toLowerCase();
      let pill, txt;
      if (res.shortAge != null) { pill = ['dn', 'Runs short']; txt = `At ${kfmt(p.spend)} a month the savings run out at ${res.shortAge}. Spend less, work a little longer, or delay Social Security for a bigger check.`; }
      else { pill = ['up', 'Lasts']; txt = `The paycheck holds to 95 with ${kfmt(after(res))} left after tax. `; }
      const bname = STRATS.find((s) => s.v === best).label;
      if (best !== strat && res.shortAge == null) txt += ` ${bname} would leave ${kfmt(after(all[best]) - after(res))} more after tax by 95 than ${sname} in this example.`;
      else if (best !== strat) txt += ` ${bname} makes the money last longer here.`;
      else txt += ` ${bname} leaves the most after tax of the three here${best !== 'conv' && all.conv.shortAge == null ? `: ${kfmt(after(res) - after(all.conv))} more than taxable first${all.conv.life - res.life > 500 ? `, with ${kfmt(all.conv.life - res.life)} less tax paid along the way` : ''}` : ''}.`;
      if (strat === 'fill' && res.convTot > 1) txt += ` It converts ${kfmt(res.convTot)} to Roth in low-income years, which shrinks the required withdrawals that start at 75.`;
      document.getElementById(id + '-msg').innerHTML = ui.msg(pill[0], pill[1], txt.replace(/\s+/g, ' ').trim());
    });
    fig.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.wss-hov'); if (!t || !geo || !res) { tip.hide(); return; }
      const pt = ui.pt(fig.querySelector('svg'), e); const i = SML.clamp(Math.floor((pt.x - geo.padL) / geo.bw), 0, geo.n - 1); const r = res.rows[i]; if (!r) return;
      const m = (v) => kfmt(v / 12);
      tip.show(pt.x, pt.y, `Age ${r.age} · per month<br>Social Security ${m(r.ss)}<br>Taxable ${m(r.tx)} · Pre-tax ${m(r.tr)}<br>Roth ${m(r.ro)}${r.short > 1 ? ` · <b>short ${m(r.short)}</b>` : ''}<br>Federal tax ${kfmt(r.tax)}/yr${r.conv > 1 ? `<br>Converted to Roth ${kfmt(r.conv)}` : ''}<br>Savings after: ${kfmt(r.bal)}`, geo.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
  };

  /* =====================================================================
     5. bucketFlow: the three-bucket plan through a sample decade
     ===================================================================== */
  SML.widgets.bucketFlow = function (root) {
    const id = SML.uid('bkt');
    const STK = [-26, -11, 17, 21, 5, -9, 14, 10, 18, 4];
    const BND = [1, 3, 3, 2, 3, 4, 3, 3, 2, 3];
    const CASH = 3, SPEND = 40000, TC = 2 * SPEND, TB = 5 * SPEND;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Three buckets · a sample decade</span><span class="grow"></span><span class="pill" id="${id}-yr">Start</span></div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Stocks this year', id + '-ret')}${ui.stat('Cash refilled from', id + '-src')}${ui.stat('Stocks sold in down years', id + '-sold', 'hl')}${ui.stat('Total savings', id + '-tot')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-p" id="${id}-play">Play the decade</button><button type="button" class="btn btn-g" id="${id}-next">Next year</button><button type="button" class="btn btn-g" id="${id}-reset">Start over</button></div>
      <div class="wg-note">Sample returns, not a forecast: a crash in years 1 and 2, then a recovery. Spending $40,000 a year from $1,000,000. Cash earns 3%. Rule: spend from cash; in up years refill cash to two years and bonds to five years from stocks; in down years refill cash from bonds and leave stocks alone.</div>`;
    const fig = root.querySelector('.wg-fig');
    let s, timer = null;
    const reset = () => { s = { y: 0, c: TC, b: TB, k: 1000000 - TC - TB, sold: 0, flow: null, hist: [] }; };
    reset();
    const step = () => {
      if (s.y >= 10) return;
      const i = s.y, r = STK[i];
      let need = SPEND; const fc = Math.min(s.c, need); s.c -= fc; need -= fc;
      if (need > 0) { const fb = Math.min(s.b, need); s.b -= fb; need -= fb; }
      if (need > 0) { s.k -= need; if (r < 0) s.sold += need; }
      s.c *= 1 + CASH / 100; s.b *= 1 + BND[i] / 100; s.k *= 1 + r / 100;
      const flow = { from: '', toC: 0, toB: 0 };
      if (r >= 0) { const a = Math.max(0, TC - s.c); s.c += a; s.k -= a; const bb = Math.max(0, TB - s.b); s.b += bb; s.k -= bb; flow.from = 'stocks'; flow.toC = a; flow.toB = bb; }
      else { const a = Math.min(s.b, Math.max(0, TC - s.c)); s.c += a; s.b -= a; flow.from = 'bonds'; flow.toC = a; }
      s.flow = flow; s.y++; s.hist.push(r);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } document.getElementById(id + '-play').textContent = 'Play the decade'; };
    SML.onCleanup(stop);
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const H = compact ? 356 : 376;
      let b = '';
      const cols = [['Cash', s.c, 2.6 * SPEND, 'f-info', 'info', '1–2 years'], ['Bonds', s.b, 6.5 * SPEND, 'f-vio', 'vio', 'about 5 years'], ['Stocks', s.k, 1200000, 'f-up', 'up', 'the long run']];
      const gap = compact ? 18 : 40, cw = Math.min(compact ? 92 : 150, (W - gap * 4) / 3), total = cw * 3 + gap * 2, x0 = (W - total) / 2;
      const top = compact ? 44 : 48, bh = compact ? 150 : 165, bot = top + bh;
      cols.forEach(([name, v, cap, fcls, tcls, sub], i) => {
        const x = x0 + i * (cw + gap), fh = SML.clamp(v / cap, 0, 1) * (bh - 6);
        b += S.rect(x, top, cw, bh, 'f-surf s-line w15', 10);
        b += S.rect(x + 3, bot - 3 - fh, cw - 6, fh, fcls + ' o70', 7);
        b += S.text(x + cw / 2, top - 22, name, `md b ${tcls}`, 'middle');
        b += S.text(x + cw / 2, top - 8, sub, 'xs', 'middle');
        b += S.text(x + cw / 2, bot - 3 - fh - 7 < top + 14 ? top + 18 : bot - 3 - fh - 7, kfmt(v), 'md b ink mono', 'middle');
      });
      /* flows of the last year, drawn in a band under the buckets */
      if (s.flow && s.y > 0) {
        const cx = (i) => x0 + i * (cw + gap) + cw / 2, fy = bot + 26;
        if (s.flow.from === 'stocks' && s.flow.toC + s.flow.toB > 1) { b += S.arrow(cx(2), fy, cx(0) + 10, fy, 'up', 7); b += S.text(cx(1), fy - 7, `${kfmt(s.flow.toC + s.flow.toB)} refill from stocks`, 'sm b up', 'middle'); }
        else if (s.flow.from === 'bonds' && s.flow.toC > 1) { b += S.arrow(cx(1), fy, cx(0) + 10, fy, 'vio', 7); b += S.text((cx(0) + cx(1)) / 2 + 6, fy - 7, `${kfmt(s.flow.toC)} from bonds`, 'sm b vio', 'middle'); b += S.text(cx(2), fy + 4, 'stocks untouched', 'sm b mut', 'middle'); }
        b += S.text(cx(0), fy + 20, `−${kfmt(SPEND)} spent`, 'sm b dn', 'middle');
      }
      /* timeline of stock returns */
      const ty = bot + (compact ? 106 : 110), tw = Math.min(W - 40, 520), tx0 = (W - tw) / 2, sw = tw / 10, ys = SML.lin(-30, 30, ty + 26, ty - 26);
      b += S.line(tx0, ys(0), tx0 + tw, ys(0), 's-line');
      STK.forEach((r, i) => {
        const done = i < s.y, cur = i === s.y - 1, x = tx0 + i * sw + sw * 0.2, w = sw * 0.6;
        b += S.rect(x, r >= 0 ? ys(r) : ys(0), w, Math.abs(ys(r) - ys(0)), (r >= 0 ? 'f-up' : 'f-dn') + (done ? '' : ' o35'), 2);
        if (cur || !compact) b += S.text(x + w / 2, r >= 0 ? ys(r) - 4 : ys(r) + 11, (r > 0 ? '+' : '') + r + '%', 'xs mono' + (cur ? ' b ink' : ''), 'middle');
        if (cur) b += S.rect(x - 3, ty - 30, w + 6, 60, 'nf s-acc w15', 3);
      });
      b += S.text(tx0, ty - 34, 'STOCK RETURN BY YEAR', 'cap');
      fig.innerHTML = S.wrap(W, H, `Cash, bonds and stocks buckets after year ${s.y} of a sample decade`, b);
      const tot = s.c + s.b + s.k;
      document.getElementById(id + '-yr').textContent = s.y ? 'Year ' + s.y : 'Start';
      document.getElementById(id + '-ret').textContent = s.y ? F.spct(STK[s.y - 1], 0) : '—';
      document.getElementById(id + '-src').textContent = s.flow ? (s.flow.from === 'stocks' ? 'Stocks' : 'Bonds') : '—';
      document.getElementById(id + '-sold').textContent = usd0(s.sold);
      document.getElementById(id + '-tot').textContent = kfmt(tot);
      let pill, txt;
      if (!s.y) { pill = ['info', 'Start']; txt = `Two years of spending sit in cash (${kfmt(TC)}), five in bonds (${kfmt(TB)}) and the rest in stocks. Press Next year or Play.`; }
      else if (STK[s.y - 1] < 0) { pill = ['dn', 'Down year']; txt = `Stocks fell ${Math.abs(STK[s.y - 1])}%. You spent ${kfmt(SPEND)} from cash and topped cash back up from bonds. No stocks were sold at a loss.`; }
      else { pill = ['up', 'Up year']; txt = `Stocks rose ${STK[s.y - 1]}%, so you sold some stocks to refill cash to two years and bonds to five.`; }
      if (s.y === 10) { pill = ['up', 'Decade done']; txt = `After ten years, including a 26% and an 11% drop, you still have ${kfmt(tot)} and sold ${usd0(s.sold)} of stocks in down years. Buckets keep you from selling stocks low, and that is what keeps people invested. They add no return on their own.`; }
      document.getElementById(id + '-msg').innerHTML = ui.msg(pill[0], pill[1], txt);
      document.getElementById(id + '-next').disabled = s.y >= 10;
    });
    root.querySelector('#' + id + '-next').addEventListener('click', () => { stop(); step(); draw(true); });
    root.querySelector('#' + id + '-reset').addEventListener('click', () => { stop(); reset(); draw(true); });
    root.querySelector('#' + id + '-play').addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (s.y >= 10) reset();
      if (SML.reduced()) { while (s.y < 10) step(); draw(true); return; }
      document.getElementById(id + '-play').textContent = 'Pause';
      step(); draw(true);
      timer = setInterval(() => { if (s.y >= 10) { stop(); return; } step(); draw(true); if (s.y >= 10) stop(); }, 1100);
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-social-security', course: 'accounts', order: 4, title: 'Social Security: when to claim', mins: 10, level: 'Beginner',
    summary: 'Claim at 62, 67 or 70: the monthly check, the break-even age and the tax.',
    idea: 'You can claim from 62 to 70. Every year you wait raises the check for life, so the best age depends mostly on how long you live.',
    widget: 'ssClaim',
    try: 'Set your benefit at 67 and how long you expect to live, then click a claiming age and watch the lifetime totals cross.',
    body: [
      '<h3>How your benefit is figured</h3><p>Social Security averages your <b>35 highest-earning years</b>, adjusted for wage growth. Missing years count as zeros. You need <b>40 credits</b> to qualify; in 2026 you earn one credit for each $1,890 of pay, up to four a year. The result is your <b>primary insurance amount</b>: the monthly check at full retirement age. Your own estimate is free at ssa.gov/myaccount.</p>',
      '<h3>The claiming window: 62 to 70</h3><ul><li><b>Full retirement age</b> is 67 for anyone born in 1960 or later.</li><li><b>Claim at 62</b> and the check is cut 30%, for life.</li><li><b>Wait past 67</b> and it grows 8% a year, to 124% at 70. Nothing is gained by waiting past 70.</li><li>Every age gets the yearly cost-of-living raise: 2.8% for 2026 and 3.6% for 2027, announced in October 2026.</li></ul><p>In 2026 the biggest possible check at 67 is $4,152 a month; the average retired worker gets about $2,071.</p>',
      '<h3>The break-even age</h3><p>Claiming early gets you more checks; waiting gets you bigger ones. Compared with claiming at 62, waiting to 67 pulls ahead at about 78 years and 8 months, and waiting to 70 at about 80 years and 4 months. If you expect to live past your early 80s, waiting usually collects more. Good reasons to claim early: poor health, no other money to live on, or being single with a short family lifespan.</p>',
      '<h3>Married couples: spousal and survivor checks</h3><ul><li>A spouse can get up to <b>50%</b> of the worker’s full benefit, claimed at the spouse’s own full retirement age (32.5% if claimed at 62; spousal checks stop growing at 67).</li><li>When one spouse dies, the survivor keeps the <b>larger</b> of the two checks.</li><li>So the higher earner’s claiming age decides the check the survivor may live on for decades. That is one of the strongest reasons for the higher earner to wait.</li><li>A divorced spouse can claim on an ex’s record if the marriage lasted 10 years.</li></ul>',
      '<h3>Working while you claim</h3><p>Before full retirement age the <b>earnings test</b> applies. In 2026, Social Security holds back $1 for every $2 you earn above $24,480 ($25,560 in 2027). In the year you reach full retirement age the limit is $65,160 and it holds back $1 for every $3. From full retirement age on there is no limit. Held-back money comes back: at full retirement age your check is raised to credit those months.</p>',
      '<h3>Taxes on your benefits</h3><p>Add half your benefits to your other income (including tax-free interest). That is your <b>combined income</b>.</p><ul><li>Single: above $25,000 up to 50% of benefits is taxable; above $34,000 up to 85%.</li><li>Married filing jointly: above $32,000 up to 50%; above $44,000 up to 85%.</li></ul><p>These lines are not adjusted for inflation, so more retirees cross them every year. Some states tax benefits too. You can have tax withheld with Form W-4V.</p>',
      '<h3>Will it be there?</h3><p>The 2026 Trustees Report projects the retirement trust fund runs dry in late 2032. After that, payroll taxes would still pay about 78% of scheduled benefits unless Congress acts. Plan for a possible cut. Claiming at 62 to beat it would lock in a permanent 30% cut, which is usually the worse deal. In January 2025 the Social Security Fairness Act also ended two rules (WEP and GPO) that reduced benefits for many people with government pensions.</p>',
    ],
    example: {
      title: 'Maria’s claiming choice',
      intro: 'Maria, born 1962, has a full benefit of $2,000 a month at 67. She is married and earned more than her husband.',
      steps: [
        'At 62 she would get 70%: $1,400 a month, or $16,800 a year. At 70 she would get 124%: $2,480 a month, or $29,760 a year.',
        'By age 80, claiming at 62 has paid 18 years × $16,800 = $302,400. Claiming at 70 has paid 10 years × $29,760 = $297,600. Early is still slightly ahead.',
        'Break-even: $1,400 × (age − 62) = $2,480 × (age − 70). That solves to about 80 years and 4 months.',
        'By age 90: claiming at 62 pays 28 × $16,800 = $470,400; claiming at 70 pays 20 × $29,760 = $595,200. Waiting wins by $124,800.',
        'If Maria dies first, her husband switches to her check. Waiting to 70 makes his survivor check $2,480 instead of $1,650 (survivor checks on an early claim have a floor of 82.5% of her full benefit).',
      ],
      result: 'If Maria expects to live past about 80, waiting to 70 collects more, and it protects the spouse who outlives her.',
    },
    mistakes: [
      'Claiming at 62 because “Social Security will go broke”. Even after the trust fund runs short, payroll taxes keep paying most benefits, while an early claim locks in a 30% cut for life.',
      'A married higher earner claiming early without thinking about the survivor, who may live on that smaller check for 20 years.',
      'Claiming before 67 while still working full time, then being surprised when checks are held back by the earnings test.',
      'Waiting past 70. The check stops growing at 70, so every month later is money you never get back.',
    ],
    points: [
      'Claim anytime from 62 (70% of the full benefit) to 70 (124%). Full retirement age is 67 for anyone born in 1960 or later.',
      'Waiting to 70 beats claiming at 62 if you live past about 80; health and family history matter most.',
      'For couples, the higher earner’s check becomes the survivor’s check, so delaying protects the spouse who lives longer.',
      'Up to 85% of benefits can be taxable once combined income passes $34,000 single or $44,000 joint.',
      'Check your earnings record at ssa.gov/myaccount every year; mistakes there lower your benefit.',
    ],
    terms: ['Social Security', 'Full retirement age', 'Delayed retirement credits', 'PIA', 'Earnings test', 'Longevity risk'],
    glossary: [{ t: 'Survivor benefit', d: 'The check a widow or widower can switch to: up to 100% of what the spouse who died was receiving.' }, { t: 'Combined income', d: 'Your other income plus tax-free interest plus half your Social Security. It decides how much of your benefit is taxed.' }],
    quiz: { q: 'Your full benefit at 67 is $2,000 a month. About how much is it if you wait to claim at 70?', options: ['$2,160', '$2,480', '$2,800'], answer: 1, why: 'Each year past 67 adds 8%, so three years add 24%: $2,000 × 1.24 = $2,480.' },
    sources: [
      { t: 'SSA: 2026 cost-of-living adjustment fact sheet (COLA, earnings test, maximum benefit)', u: 'https://www.ssa.gov/cola/factsheets/2026.html' },
      { t: 'SSA: COLA information, including the 3.6% COLA for 2027', u: 'https://www.ssa.gov/cola/' },
      { t: 'SSA: Benefit reduction for early retirement', u: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
      { t: 'SSA: Delayed retirement credits', u: 'https://www.ssa.gov/benefits/retirement/planner/delayret.html' },
    ],
  });

  SML.lessons.push({
    id: 'l-medicare-rmd', course: 'accounts', order: 5, title: 'Medicare, RMDs and IRMAA', mins: 10, level: 'Intermediate',
    summary: 'Enroll in Medicare on time, plan required withdrawals and stay under the IRMAA lines.',
    idea: 'Medicare starts at 65 and forced withdrawals start at 73 or 75. Both depend on your income, so plan them together.',
    widget: 'rmdCalc',
    try: 'Set your pre-tax savings and birth year, then raise the Roth slider and watch the forced withdrawals shrink under the IRMAA line.',
    extra: [{ widget: 'irmaaLadder', try: 'Drag your income along the staircase. Each step is a cliff: one dollar over raises the premium for the whole year.' }],
    body: [
      '<h3>Medicare at 65</h3><ul><li><b>Part A</b> covers hospital stays. It is premium-free if you or your spouse paid Medicare tax for 40 quarters. The 2026 hospital deductible is $1,736.</li><li><b>Part B</b> covers doctors and outpatient care: $202.90 a month in 2026, with a $283 yearly deductible.</li><li><b>Part D</b> covers drugs, bought from a private plan.</li><li>Many people pair Parts A and B with a Medigap policy and a Part D plan. Others choose <b>Medicare Advantage</b>, a private plan that delivers Part A and B coverage, usually with drugs included. Either way you must have Parts A and B and keep paying the Part B premium, plus any IRMAA.</li></ul>',
      '<h3>Sign up on time</h3><p>Your <b>Initial Enrollment Period</b> lasts seven months: the three months before the month you turn 65, that month, and the three after. Miss it and Part B costs 10% more for each full 12 months you could have had it, for life. If you or your spouse still work for an employer with group health coverage, you can usually wait and use an eight-month special window when that job coverage ends. COBRA and retiree plans do not count as job coverage for this rule. Original Medicare generally does not cover care outside the US.</p>',
      '<h3>IRMAA: the income surcharge</h3><p>Higher earners pay more for Parts B and D. The 2026 premium is set by your income from <b>2024</b>, two years earlier. The first line is $109,000 single or $218,000 married filing jointly, and the lines rise with inflation. MAGI here is your adjusted gross income plus tax-free interest; it counts only the taxable part of Social Security. Each tier is a cliff: one dollar over the line costs the whole surcharge for the year, for each spouse on Medicare. A big Roth conversion or home sale at 63 can raise your premiums at 65. If your income dropped after retiring, ask Social Security to use newer income with Form SSA-44.</p>',
      '<h3>Required minimum distributions</h3><ul><li>RMDs start at <b>73</b> if you were born 1951–1958 and at <b>75</b> if born 1960 or later. If you were born in 1959, check the latest IRS guidance.</li><li>Each year’s RMD is last December 31’s balance divided by the IRS Uniform Lifetime Table number for your age: 26.5 at 73, 24.6 at 75, 16.0 at 85.</li><li>They apply to traditional IRAs, 401(k)s and 403(b)s. Roth IRAs and Roth 401(k)s have none while you live.</li><li>The first RMD can wait until April 1 of the next year, but then you take two in one year.</li><li>Still working past RMD age? If you do not own 5% or more of the company, you can usually delay RMDs from your current employer’s 401(k) until you retire, if the plan allows. IRAs and old employers’ plans get no such delay.</li><li>You can keep contributing past RMD age: to a 401(k) while you work, and to traditional or Roth IRAs as long as you have earned income.</li><li>Miss one and the penalty is 25% of the shortfall, cut to 10% if you fix it within two years.</li></ul>',
      '<h3>Why Roth conversions before RMDs can help</h3><p>The years between retiring and RMDs are often your lowest-income years. Converting some pre-tax money to Roth then, in slices that fill the 12% or 22% bracket, means paying tax at a low rate now instead of a higher one later. It shrinks future RMDs, keeps you under IRMAA lines and leaves heirs tax-free Roth money (most heirs must empty an inherited IRA within 10 years). Watch the trade-offs: conversions raise your income for health subsidies before 65 and for IRMAA two years later. See <a href="#l-backdoor-roth">Roth conversions</a> and <a href="#l-retire-income">withdrawal order</a>.</p>',
    ],
    example: {
      title: 'Ken’s RMDs and the IRMAA line',
      intro: 'Ken is single and born in 1961. All figures are in today’s dollars, because IRMAA lines rise with inflation. His pension plus the taxable part of his Social Security adds $70,000 a year to his MAGI.',
      steps: [
        'Born after 1959, his RMDs start at 75. If his IRA holds $1,200,000 on the December 31 before, his first RMD is $1,200,000 ÷ 24.6 = $48,780, and his MAGI is $70,000 + $48,780 = $118,780, above the $109,000 single line.',
        'Two years later he pays $284.10 a month for Part B instead of $202.90, plus $14.50 a month on his drug plan: ($81.20 + $14.50) × 12 = $1,148.40 extra that year.',
        'Instead, from 65 to 74 he converts $30,000 a year to Roth. His MAGI in those years is $100,000, under the line, so the conversions themselves trigger no surcharge.',
        'The conversions are taxed at 22%, about the same rate his RMDs would face. The payoff is avoiding IRMAA, smaller RMDs and tax-free Roth money for his heirs.',
        'With 3% growth after inflation, ten $30,000 conversions leave roughly $850,000 in the IRA at 75. His first RMD becomes $850,000 ÷ 24.6 = $34,553, and his MAGI $104,553, under the line.',
      ],
      result: 'Sized conversions kept Ken under the first IRMAA line in every year, saving about $1,148 a year in Medicare premiums once RMDs start, with smaller forced withdrawals for life.',
    },
    mistakes: [
      'Missing the Part B window because you have COBRA or a retiree plan. Neither counts as job coverage, and the late penalty lasts for life.',
      'Forgetting the two-year lookback: a big conversion or home sale at 63 raises Medicare premiums at 65.',
      'Delaying the first RMD to April 1, then taking a second one by December 31. Two RMDs in one year can push you into a higher bracket and over an IRMAA line.',
      'Converting so much in one year that you jump into a high bracket. Convert in measured slices that fill your current bracket.',
    ],
    points: [
      'Enroll in Medicare in the seven months around your 65th birthday unless you have current job coverage.',
      'IRMAA uses income from two years earlier, and each tier is a cliff, so plan big income events.',
      'RMDs start at 73 (born 1951–58) or 75 (born 1960+): last year-end balance ÷ the IRS table divisor.',
      'Roth IRAs and Roth 401(k)s have no RMDs while you live.',
      'Low-income years before RMDs are the time for measured Roth conversions.',
    ],
    terms: ['Medicare', 'IRMAA', 'RMD', 'Roth conversion', 'Roth 401(k)', 'MAGI'],
    glossary: [{ t: 'Initial Enrollment Period', d: 'The seven months around your 65th birthday month when you can sign up for Medicare without a penalty.' }, { t: 'Uniform Lifetime Table', d: 'The IRS table of divisors used to work out each year’s required minimum distribution.' }],
    quiz: { q: 'Your IRA held $984,000 last December 31 and this year’s divisor is 24.6. What is your RMD?', options: ['$24,600', '$40,000', '$98,400'], answer: 1, why: 'RMD = balance ÷ divisor = $984,000 ÷ 24.6 = $40,000.' },
    sources: [
      { t: 'CMS: 2026 Medicare Parts A & B premiums and deductibles (includes IRMAA tiers)', u: 'https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles' },
      { t: 'IRS: Retirement plan and IRA required minimum distributions FAQs', u: 'https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs' },
      { t: 'IRS Publication 590-B: Distributions from IRAs (Uniform Lifetime Table)', u: 'https://www.irs.gov/publications/p590b' },
      { t: 'Medicare.gov: Avoid late enrollment penalties', u: 'https://www.medicare.gov/basics/costs/medicare-costs/avoid-penalties' },
    ],
  });

  SML.lessons.push({
    id: 'l-retire-income', course: 'retire', order: 3, title: 'Turn savings into a paycheck', mins: 11, level: 'Intermediate',
    summary: 'Which account to spend first, the bucket plan, annuities and the dividend myth.',
    idea: 'In retirement you build your own paycheck: Social Security is the floor, and withdrawals fill the gap in an order that keeps lifetime taxes low.',
    widget: 'paycheckBuilder',
    try: 'Pick an example, then switch the withdrawal order at the top and compare what each one leaves after tax at 95.',
    extra: [{ widget: 'bucketFlow', try: 'Play a decade with a crash at the start and watch which bucket pays the bills each year.' }],
    body: [
      '<h3>The paycheck stack</h3><p>Start with income that lasts for life and rises with inflation: <b>Social Security</b> and any pension. Your savings fill the gap between that floor and what you spend. How much you can take each year is the <a href="#l-swr">withdrawal rate</a> question; this lesson is about where each dollar comes from.</p>',
      '<h3>Which account first?</h3><ul><li><b>Taxable first</b>, then pre-tax, then Roth. The classic order. It lets tax-advantaged accounts grow longest, but it can leave a huge pre-tax balance that later meets RMDs, Social Security tax and IRMAA all at once.</li><li><b>Fill the low brackets.</b> Each year take (or convert to Roth) pre-tax money up to a chosen line, often the top of the 12% bracket, and cover the rest from taxable savings. In the gap years before Social Security and RMDs this often cuts lifetime tax. Gains stack on top of ordinary income, and for couples in 2026 the 0% band for gains ends at $98,900 of taxable income, just under the top of the 12% bracket ($100,800). Filling the 12% bracket with pre-tax money uses up that <a href="#l-zero-bracket">0% gains room</a>, so decide which one you want each year.</li><li><b>Proportional</b>: a slice from every account every year. Simple and steady.</li><li>Keep <b>Roth</b> money for last, for big one-off costs, or for heirs: it has no RMDs and comes out tax-free.</li></ul><p>In the widget’s three examples, spreading pre-tax withdrawals over more years (proportional or bracket-filling) leaves more after tax than taxable-first. The best order depends on your balances and tax rates, so test your own numbers, or ask a fee-only planner or CPA to.</p><p>Before 65, your income also sets <a href="#l-aca">health insurance subsidies</a>, and one dollar over 400% of the poverty line ($84,600 for two for 2026 coverage) ends the subsidy entirely. From 63 on, income sets <a href="#l-medicare-rmd">Medicare premiums</a> two years later.</p>',
      '<h3>The bucket plan</h3><ul><li><b>Cash</b>: about one to two years of the spending Social Security does not cover, in a high-yield savings account, money market fund or T-bills (see <a href="#l-emergency">where to park cash</a>).</li><li><b>Bonds</b>: roughly two to five more years in short-term, high-quality bonds.</li><li><b>Stocks</b>: the rest, for long-term growth.</li></ul><p>You spend from cash. After good years you refill from stocks; after bad years you refill from bonds and leave stocks alone to recover. The value is behavioral: you never have to sell stocks in a crash, which softens <a href="#l-sequence">sequence of returns risk</a> and keeps panic out of your decisions. Buckets add no return on their own.</p>',
      '<h3>Annuities: buying a paycheck</h3><p>A <b>single-premium immediate annuity</b> (SPIA) turns a lump sum into monthly income for life. Pros: you cannot outlive it, and it lets you spend more confidently. Cons: the money is gone for good, most payments do not rise with inflation, and you depend on the insurer (state guaranty funds cover only up to a limit). Avoid complex variable or indexed annuities with high fees and surrender charges. The cheapest inflation-protected annuity most people can buy is <a href="#l-social-security">delaying Social Security</a>.</p>',
      '<h3>The dividend myth</h3><p>“Only spend the dividends” feels safe, but a dividend is part of your return paid out, and the share price drops by the same amount on the payout date. Chasing high-yield stocks concentrates you in a few industries and can raise your tax bill. Spend from <b>total return</b>: dividends, interest and selling a little when needed.</p>',
      '<h3>Make it feel like a paycheck</h3><ul><li>Set an automatic monthly transfer from your brokerage cash to checking.</li><li>Have tax withheld: Form W-4R for IRA withdrawals, W-4V for Social Security, or pay quarterly estimates.</li><li>Rebalance and refill the cash bucket once a year, on a set date.</li></ul>',
    ],
    example: {
      title: 'A couple’s gap years at 62',
      intro: 'Married, both 62, spending $84,000 a year and buying health insurance on the ACA marketplace until Medicare at 65. Social Security of $3,800 a month starts at 67. Federal tax uses 2026 brackets and the $32,200 standard deduction.',
      steps: [
        'Until 67 there is no Social Security, so all $84,000 comes from savings: $34,000 from the brokerage account and $50,000 from the traditional IRA.',
        'Taxable ordinary income: $50,000 − $32,200 = $17,800, all in the 10% bracket: $1,780 of tax. Half the brokerage sale is gain ($17,000); total taxable income of $34,800 is under the $98,900 line, so that gain is taxed at 0%.',
        'Their MAGI is $50,000 + $17,000 = $67,000. For 2026 coverage, marketplace subsidies stop completely above 400% of the poverty line: $84,600 for two. A $40,000 conversion would push them to $107,000 and could cost a subsidy worth many thousands a year.',
        'So they convert $17,000, bringing MAGI to $84,000. Ordinary taxable income becomes $34,800: tax = $2,480 + 12% × $10,000 = $3,680. The gain still fits under $98,900 and stays at 0%.',
        'The conversion cost $3,680 − $1,780 = $1,900, about 11% of the $17,000 moved. From 65, with Medicare in place of the marketplace plan, they can convert more each year, keeping an eye on the IRMAA lines.',
      ],
      result: 'Converting just under the subsidy cliff costs about 11% now and shrinks the RMDs that start at 75; converting $40,000 would also have cost them their health subsidy.',
    },
    mistakes: [
      'Converting or withdrawing so much before 65 that income crosses the ACA subsidy cliff, losing the whole health-insurance subsidy for the year.',
      'Leaving all pre-tax money for last by default, then facing RMDs, taxable Social Security and IRMAA at once in your 70s.',
      'Buying a complex annuity with high fees and surrender charges after a sales pitch, instead of comparing simple quotes or delaying Social Security.',
      'Keeping next year’s spending money in stocks, so a crash forces you to sell low.',
    ],
    points: [
      'Social Security and pensions are the floor; savings fill the gap.',
      'Withdrawal order changes lifetime tax: filling the low brackets in the gap years often beats taxable-first.',
      'Hold one to two years of spending in cash so you never have to sell stocks in a crash.',
      'A simple immediate annuity, or delaying Social Security, can buy lifetime income; avoid high-fee products.',
      'Spend from total return: dividends, interest and occasional sales.',
    ],
    terms: ['Bucket strategy', 'Annuity', 'Roth conversion', 'Sequence of returns risk', 'Withdrawal rate', 'Qualified dividend'],
    glossary: [{ t: 'SPIA', full: 'Single-premium immediate annuity', d: 'You pay an insurer a lump sum once and get a fixed monthly payment for life.' }, { t: 'Total return', d: 'Price change plus dividends and interest: everything an investment earns.' }],
    quiz: { q: 'Why might a couple who retire at 62 withdraw or convert pre-tax money before Social Security starts?', options: ['RMDs are required at 62', 'Their income is low, so they can pay tax at 10–12% instead of more later', 'Roth conversions are tax-free'], answer: 1, why: 'The gap years are low-income years, so moving pre-tax money then is taxed at low rates and shrinks later RMDs.' },
    sources: [
      { t: 'IRS Rev. Proc. 2025-32: 2026 tax brackets, standard deduction and capital gains thresholds', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
      { t: 'IRS Publication 915: Social Security and equivalent railroad retirement benefits', u: 'https://www.irs.gov/publications/p915' },
      { t: 'Schwab: Sequence of returns risk and keeping a cash reserve', u: 'https://www.schwab.com/learn/story/timing-matters-understanding-sequence-returns-risk' },
    ],
  });
})();
