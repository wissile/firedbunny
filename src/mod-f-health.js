/* FIRE track · Health Care & Social Security: l-aca (acaSubsidy), l-health-bridge (healthBridge), l-ss-early (ssEarly). */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;

  /* ---------------- shared helpers ---------------- */
  const $id = (x) => document.getElementById(x);
  const setT = (id, txt, cls) => { const e = $id(id); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setL = (id, txt) => { const e = $id(id); if (e && e.previousElementSibling) e.previousElementSibling.textContent = txt; };
  const setMsg = (id, cls, pill, html) => { const e = $id(id); if (e) e.innerHTML = ui.msg(cls, pill, html); };
  const usd = (v) => F.usd(Math.round(v), 0);
  const kfmt = (v) => { const a = Math.abs(v); if (a >= 1e6) return '$' + (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (a >= 1000) return '$' + (v / 1000).toFixed(a >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K'; return '$' + Math.round(v); };
  const pc = (v, d) => F.num(v, d == null ? 0 : d) + '%';

  /* Marketplace rules. 2026 coverage: 2025 HHS guidelines + Rev. Proc. 2025-25. 2027 coverage: 2026 HHS guidelines + Rev. Proc. 2026-26. 48 states + DC. */
  const RULES = {
    2026: { base: 15650, add: 5500, low: 2.10, bands: [[133, 150, 3.14, 4.19], [150, 200, 4.19, 6.60], [200, 250, 6.60, 8.44], [250, 300, 8.44, 9.96], [300, 400, 9.96, 9.96]] },
    2027: { base: 15960, add: 5680, low: 2.15, bands: [[133, 150, 3.23, 4.30], [150, 200, 4.30, 6.78], [200, 250, 6.78, 8.66], [250, 300, 8.66, 10.22], [300, 400, 10.22, 10.22]] },
  };
  const rule = (yr) => RULES[yr] || RULES[2026];
  const fpl = (n, yr) => rule(yr).base + rule(yr).add * (n - 1);
  function applicable(p, yr) {
    const R = rule(yr);
    if (p < 133) return R.low;
    for (let i = 0; i < R.bands.length; i++) { const [a, b, lo, hi] = R.bands[i]; if (p >= a && p <= b) return lo + ((hi - lo) * (p - a)) / (b - a); }
    return R.bands[R.bands.length - 1][3];
  }
  /* federal default age curve (CMS), age 21 = 1.000, 64+ = 3.000; children priced at 0.765 */
  const AGE = { 21: 1.0, 22: 1.0, 23: 1.0, 24: 1.0, 25: 1.004, 26: 1.024, 27: 1.048, 28: 1.087, 29: 1.119, 30: 1.135, 31: 1.159, 32: 1.183, 33: 1.198, 34: 1.214, 35: 1.222, 36: 1.23, 37: 1.238, 38: 1.246, 39: 1.262, 40: 1.278, 41: 1.302, 42: 1.325, 43: 1.357, 44: 1.397, 45: 1.444, 46: 1.5, 47: 1.563, 48: 1.635, 49: 1.706, 50: 1.786, 51: 1.865, 52: 1.952, 53: 2.04, 54: 2.135, 55: 2.23, 56: 2.333, 57: 2.437, 58: 2.548, 59: 2.603, 60: 2.714, 61: 2.81, 62: 2.873, 63: 2.952, 64: 3.0 };
  const ageF = (a) => AGE[SML.clamp(Math.round(a), 21, 64)];
  /* yearly benchmark silver premium for a household: adults at age a, the rest children */
  function benchYear(size, age, bench40) { const adults = size >= 2 ? 2 : 1, kids = size - adults; return 12 * bench40 * (adults * ageF(age) + kids * 0.765) / 1.278; }
  /* the marketplace picture at one MAGI */
  function market(magi, size, expansion, full, yr) {
    const F0 = fpl(size, yr), p = (magi / F0) * 100;
    if (expansion && p < 138) return { zone: 'medicaid', p, cost: 0, sub: 0, ap: 0 };
    if (!expansion && p < 100) return { zone: 'gap', p, cost: full, sub: 0, ap: 0 };
    if (p > 400) return { zone: 'over', p, cost: full, sub: 0, ap: 0 };
    const ap = applicable(p, yr), contrib = (magi * ap) / 100;
    return { zone: 'sub', p, cost: Math.min(full, contrib), sub: Math.max(0, full - contrib), ap, contrib };
  }
  /* 2026 Medicare Part B monthly premium by MAGI from two years earlier (CMS) */
  function partB(magi, couple) {
    const T = couple ? [218000, 274000, 342000, 410000, 750000] : [109000, 137000, 171000, 205000, 500000];
    const P = [202.9, 284.1, 405.8, 527.5, 649.2, 689.9];
    let i = 0; while (i < T.length && magi > T[i]) i++;
    if (couple ? magi >= 750000 : magi >= 500000) i = 5;
    return P[i];
  }

  SML.css(`
    .fhl-build{display:grid;gap:16px 24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));padding:18px}
    .fhl-mix{padding:0 18px 16px;display:flex;flex-direction:column;gap:8px}
    .fhl-bar{display:flex;height:14px;border-radius:3px;overflow:hidden;background:var(--line)}
    .fhl-bar i{display:block;height:100%;min-width:0}
    .fhl-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font:500 11.5px/1.4 var(--mono);color:var(--muted)}
    .fhl-leg b{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:-1px}
    .fhl-no{font-size:13px;color:var(--muted);line-height:1.5}
    .fhl-no s{text-decoration:none;color:var(--ink)}
    .fhl-hide{display:none!important}
  `);

  /* =====================================================================
     1. acaSubsidy: the 2026 subsidy line and the 400% cliff
     ===================================================================== */
  SML.widgets.acaSubsidy = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('aca');
    const sizes = [1, 2, 3, 4, 5].map((n) => ({ v: n, label: n === 1 ? '1 person' : String(n) }));
    const SRC = [
      { k: 'w', sh: 'pay', label: 'Wages or part-time pay', max: 150000, step: 500, val: 0, col: 'var(--info)' },
      { k: 't', sh: 'IRA/401(k) and Roth conversions', label: 'IRA/401(k) withdrawals and Roth conversions', max: 150000, step: 500, val: 20000, col: 'var(--violet)' },
      { k: 'd', sh: 'interest and dividends', label: 'Interest and dividends', max: 60000, step: 250, val: 12000, col: 'var(--accent)' },
      { k: 'g', sh: 'gains', label: 'Long-term gains you sell', max: 150000, step: 500, val: 30000, col: 'var(--up)' },
      { k: 's', sh: 'Social Security', label: 'Social Security (all of it counts)', max: 70000, step: 250, val: 0, col: 'var(--down)' },
      { k: 'p', sh: 'HSA/IRA contributions', label: 'Minus HSA or deductible IRA contributions', max: 17000, step: 100, val: 0, col: 'var(--muted)' },
    ];
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-y', [{ v: '2026', label: '2026' }, { v: '2027', label: '2027' }], '2026', 'Coverage year')}${ui.seg(id + '-n', sizes, opts.size || 2, 'Household size')}${ui.seg(id + '-x', [{ v: 'y', label: 'Expanded Medicaid' }, { v: 'n', label: 'Did not expand' }], 'y', 'State Medicaid status')}${ui.seg(id + '-m', [{ v: 'set', label: 'Set MAGI' }, { v: 'build', label: 'Build MAGI' }], 'set', 'How to enter income')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        <span id="${id}-one">${ui.slider({ id: id + '-i', label: 'Your MAGI for the year', min: 0, max: 200000, step: 500, value: opts.magi || 70000, fmt: 'usd0' })}</span>
        ${ui.slider({ id: id + '-a', label: 'Age of the adults', min: 30, max: 64, step: 1, value: opts.age || 58, fmt: (v) => v + ' years' })}
        ${ui.slider({ id: id + '-b', label: 'Benchmark plan for a 40-year-old in your area, per month', min: 350, max: 1300, step: 5, value: 625, fmt: 'usd0' })}
      </div>
      <div class="fhl-build fhl-hide" id="${id}-bld">${SRC.map((s) => ui.slider({ id: id + '-s' + s.k, label: s.label, min: 0, max: s.max, step: s.step, value: s.val, fmt: 'usd0' })).join('')}</div>
      <div class="fhl-mix fhl-hide" id="${id}-mix"><div class="fhl-bar" id="${id}-bar"></div><div class="fhl-leg" id="${id}-leg"></div>
        <p class="fhl-no"><s>Not counted:</s> withdrawals of Roth IRA contributions, cash from savings, the cost-basis part of shares you sell, loans and gifts.</p></div>
      <div class="wg-read">${ui.stat('Percent of poverty level', id + '-p')}${ui.stat('Where you land', id + '-z')}${ui.stat('You pay for the benchmark plan', id + '-c', 'hl big')}${ui.stat('Tax credit', id + '-s')}${ui.stat('Room before the cliff', id + '-r')}${ui.stat('Premium added per extra $1', id + '-h')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 coverage uses the 2025 poverty guidelines and Rev. Proc. 2025-25; 2027 coverage uses the 2026 guidelines and Rev. Proc. 2026-26, with today’s benchmark price (2027 prices are not set yet). 48 states and DC, enhanced credits expired, children priced at the federal default age curve. Premiums are yearly and assume you buy the benchmark (second-cheapest silver) plan. Drag the dot or tap the chart to move your income.</div>`;
    const fig = root.querySelector('.wg-fig');
    let G = null;
    const st = ui.wire(root, () => draw());
    function magiFromSources() {
      const v = (k) => st.n(id + '-s' + k) || 0;
      return { total: Math.max(0, v('w') + v('t') + v('d') + v('g') + v('s') - v('p')), parts: SRC.map((s) => ({ s, v: v(s.k) })) };
    }
    function state() {
      const yr = Number(st.seg(id + '-y')) || 2026;
      const size = Number(st.seg(id + '-n')) || 2, expansion = st.seg(id + '-x') !== 'n', build = st.seg(id + '-m') === 'build';
      const age = st.n(id + '-a'), b40 = st.n(id + '-b');
      const full = benchYear(size, age, b40);
      const magi = build ? magiFromSources().total : st.n(id + '-i');
      return { yr, size, expansion, build, age, b40, full, magi, F0: fpl(size, yr) };
    }
    ui.drag(fig, {
      start: (pt) => setFrom(pt), move: (pt) => setFrom(pt),
    });
    function setFrom(pt) {
      if (!G || st.seg(id + '-m') === 'build') return;
      const v = SML.clamp(Math.round(G.x.inv(pt.x) / 500) * 500, 0, 200000);
      st.set(id + '-i', v); draw();
    }
    const draw = ui.responsive(fig, (W) => {
      const s = state();
      $id(id + '-one').classList.toggle('fhl-hide', s.build);
      $id(id + '-bld').classList.toggle('fhl-hide', !s.build);
      $id(id + '-mix').classList.toggle('fhl-hide', !s.build);
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.5, 260, 340));
      const pl = compact ? 42 : 56, pr = compact ? 14 : 20, pt = compact ? 56 : 46, pb = 46;
      const cliff = s.F0 * 4, medi = s.F0 * (s.expansion ? 1.38 : 1.0);
      const xMax = Math.ceil(Math.max(cliff * 1.3, s.magi * 1.08, 20000) / 10000) * 10000;
      const yMax = s.full * 1.22;
      const x = SML.lin(0, xMax, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      const at = (m) => market(m, s.size, s.expansion, s.full, s.yr);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 4) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, xMax, compact ? 4 : 6).forEach((v) => { b += S.text(x(v), H - pb + 34, kfmt(v), 'xs mono', 'middle'); });
      // zone strip under the axis
      const zones = s.expansion ? [[0, medi, 'f-info-t s-info', 'Medicaid', 'info'], [medi, cliff, 'f-up-t s-up', 'Tax credit', 'up'], [cliff, xMax, 'f-dn-t s-dn', compact ? 'Full price' : 'No help: full price', 'dn']]
        : [[0, medi, 'f-dn-t s-dn', compact ? 'Gap' : 'Coverage gap', 'dn'], [medi, cliff, 'f-up-t s-up', 'Tax credit', 'up'], [cliff, xMax, 'f-dn-t s-dn', compact ? 'Full price' : 'No help: full price', 'dn']];
      zones.forEach(([a, z, cls, lab, tc]) => { const x0 = x(Math.min(a, xMax)), x1 = x(Math.min(z, xMax)); if (x1 - x0 < 2) return; b += S.rect(x0, H - pb + 5, x1 - x0, 15, cls + ' w1', 2); if (x1 - x0 > lab.length * 6.4 + 8) b += S.text((x0 + x1) / 2, H - pb + 16, lab, 'xs b ' + tc, 'middle'); });
      // full price line
      b += S.line(pl, y(s.full), W - pr, y(s.full), 's-dn dash w15');
      b += compact ? S.text(pl + 4, y(s.full) - 7, 'full price ' + kfmt(s.full) + '/yr', 'sm dn b') : S.text(W - pr, y(s.full) - 7, 'full price of the plan ' + kfmt(s.full) + '/yr', 'sm dn b', 'end');
      // cost curve with exact breakpoints
      const pts = []; const N = 360;
      for (let i = 0; i <= N; i++) { const m = (xMax * i) / N; pts.push([m, at(m).cost]); }
      [medi - 0.01, medi, cliff, cliff + 0.01].forEach((m) => { if (m > 0 && m < xMax) pts.push([m, at(m).cost]); });
      pts.sort((p, q) => p[0] - q[0]);
      const line = pts.map(([m, c]) => [x(m), y(c)]);
      b += S.area(line, H - pb, 'f-acc-t', ' opacity=".55"') + S.poly(line, 's-acc w25');
      // cliff
      if (cliff < xMax) {
        b += S.line(x(cliff), pt - 8, x(cliff), H - pb, 's-ink dash');
        b += S.text(x(cliff) + (x(cliff) > W - 150 ? -6 : 6), pt - 14, `400% FPL · ${kfmt(cliff)}`, 'sm ink b', x(cliff) > W - 150 ? 'end' : 'start');
        const c0 = at(cliff).cost;
        if (s.full - c0 > s.full * 0.08) {
          const ax = x(cliff) + 10; b += S.arrow(ax, y(c0) - 2, ax, y(s.full) + 6, 'dn', 7);
          const jl = `+${kfmt(s.full - c0)}`; const right = ax + 6 + jl.length * 7 < W - pr;
          b += S.text(right ? ax + 6 : ax - 14, (y(c0) + y(s.full)) / 2 + 4, jl, 'md dn b', right ? 'start' : 'end');
        }
      }
      // you
      const me = at(s.magi), mx = x(Math.min(s.magi, xMax)), my = y(me.cost);
      b += S.line(mx, pt, mx, H - pb, 's-ink w15');
      const lab = `you: ${kfmt(me.cost)}/yr`, lw = lab.length * 7;
      const lx = SML.clamp(mx, pl + lw / 2, W - pr - lw / 2), ly = my - 14 < pt + 6 ? my + 26 : my - 14;
      b += S.rect(lx - lw / 2 - 5, ly - 13, lw + 10, 19, 'f-surf s-line', 4) + S.text(lx, ly + 1, lab, 'sm ink b', 'middle');
      b += S.circle(mx, my, s.build ? 6 : 8, s.build ? 'f-ink' : 'handle');
      b += S.text(pl, 18, compact ? 'Yearly cost of the benchmark plan' : 'What you pay each year for the benchmark silver plan, by income (MAGI)', 'sm mut');
      fig.innerHTML = S.wrap(W, H, `${s.yr} marketplace premium by income for a household of ${s.size}: help stops at ${usd(cliff)}`, b);
      G = { x };
      // stats
      const zoneTxt = { medicaid: ['Medicaid', 'info'], gap: ['Coverage gap', 'dn'], sub: ['Tax credit', 'up'], over: ['Over the cliff', 'dn'] }[me.zone];
      setT(id + '-p', pc(me.p), me.p > 400 ? 'dn' : '');
      setT(id + '-z', zoneTxt[0], zoneTxt[1]);
      setT(id + '-c', me.zone === 'medicaid' ? '$0' : usd(me.cost));
      setL(id + '-c', me.zone === 'medicaid' ? 'Premium (Medicaid)' : `You pay for the benchmark plan · ${usd(me.cost / 12)}/mo`);
      setT(id + '-s', usd(me.sub), me.sub > 0 ? 'up' : '');
      const room = cliff - s.magi;
      setT(id + '-r', usd(Math.abs(room)), room < 0 ? 'dn' : room < 5000 ? 'acc' : '');
      setL(id + '-r', room >= 0 ? 'Room before the cliff' : 'Over the cliff by');
      // hidden tax: how much the net premium rises per extra dollar of MAGI
      let hid = null;
      if (me.zone === 'sub' && me.sub > 0) { const up = Math.min(s.magi + 1000, cliff); if (up > s.magi + 1) { const nx = at(up); if (nx.zone === 'sub') hid = (nx.cost - me.cost) / (up - s.magi); } }
      setT(id + '-h', hid == null ? '—' : Math.round(hid * 100) + '¢', hid == null ? '' : 'acc');
      const csr = me.zone === 'sub' && me.p <= 250 ? ' Under 250% of FPL a silver plan also comes with cost-sharing reductions: lower deductibles, copays and out-of-pocket limits.' : '';
      const hidTxt = hid != null ? ` Each extra dollar of MAGI here adds about ${Math.round(hid * 100)} cents to your premium, a hidden tax on top of income tax.` : '';
      // MAGI mix
      if (s.build) {
        const mix = magiFromSources(); const tot = Math.max(1, mix.parts.filter((q) => q.s.k !== 'p').reduce((a, q) => a + q.v, 0));
        $id(id + '-bar').innerHTML = mix.parts.filter((q) => q.s.k !== 'p' && q.v > 0).map((q) => `<i style="width:${((q.v / tot) * 100).toFixed(2)}%;background:${q.s.col}" title="${q.s.label}"></i>`).join('');
        $id(id + '-leg').innerHTML = mix.parts.filter((q) => q.v > 0).map((q) => `<span><b style="background:${q.s.col}"></b>${q.s.k === 'p' ? '−' : ''}${kfmt(q.v)} ${q.s.sh}</span>`).join('') + `<span style="color:var(--ink)">= MAGI ${usd(mix.total)}</span>`;
      }
      // coach
      if (me.zone === 'medicaid') setMsg(id + '-msg', 'info', 'Medicaid', `At ${pc(me.p)} of the poverty level in an expansion state, adults usually get Medicaid instead of a marketplace credit. It looks at income, not savings, but from 2027 adults 19 to 64 must also log 80 hours a month of work, volunteering or school unless exempt, which most early retirees will not. From age 55, states also recover some costs from members’ estates.`);
      else if (me.zone === 'gap') setMsg(id + '-msg', 'dn', 'Coverage gap', `Below 100% of the poverty level in a state that did not expand Medicaid, most adults get neither Medicaid nor a credit. Raising MAGI to ${usd(s.F0)}, for example with a small Roth conversion, unlocks the credit.`);
      else if (me.zone === 'over') setMsg(id + '-msg', 'dn', 'Over the cliff', `You are ${usd(-room)} over 400% of the poverty level, so there is no credit at all: ${usd(s.full)} a year. Bringing MAGI down by ${usd(-room + 1)} would make the plan cost about ${usd(at(cliff).cost)}, a saving of ${usd(s.full - at(cliff).cost)}.`);
      else if (me.sub <= 0) setMsg(id + '-msg', 'acc', 'No credit needed', `Your expected contribution (${pc(me.ap, 2)} of income, ${usd(me.contrib)}) is more than the benchmark plan costs here, so the credit is $0. Older ages and pricier areas get bigger credits.`);
      else if (room < 5000) setMsg(id + '-msg', 'acc', 'Near the cliff', `You pay ${usd(me.cost)} and the credit covers ${usd(me.sub)}. Only ${usd(room)} of room is left: one surprise fund distribution could push you over, and you would repay every dollar of advance credit at tax time.${hidTxt}`);
      else setMsg(id + '-msg', 'up', 'Tax credit', `You pay ${pc(me.ap, 2)} of income, ${usd(me.cost)} a year, and the credit covers ${usd(me.sub)}. Keep MAGI under ${usd(cliff)}: above it the whole credit disappears.${hidTxt}${csr}`);
    });
  };

  /* =====================================================================
     2. healthBridge: price every year before Medicare
     ===================================================================== */
  SML.widgets.healthBridge = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('hbr');
    const PATHS = [{ v: 'mkt', label: 'Marketplace' }, { v: 'cobra', label: 'COBRA first' }, { v: 'job', label: 'Part-time job' }];
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-h', [{ v: '1', label: 'Single' }, { v: '2', label: 'Couple' }], '1', 'Household')}${ui.seg(id + '-p', PATHS, 'cobra', 'Bridge path')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-r', label: 'Retire at age', min: 45, max: 64, step: 1, value: opts.retire || 60, fmt: (v) => String(v) })}
        ${ui.slider({ id: id + '-i', label: 'Yearly MAGI in retirement', min: 10000, max: 160000, step: 1000, value: 50000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-b', label: 'Benchmark plan for a 40-year-old, per month', min: 350, max: 1300, step: 5, value: 625, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-c', label: 'COBRA price per month (full cost)', min: 300, max: 3000, step: 25, value: 800, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-j', label: 'Job plan: your share per month', min: 0, max: 900, step: 10, value: 200, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Years to cover before 65', id + '-y')}${ui.stat('This path: premiums to 65', id + '-t', 'hl big')}${ui.stat('Cheapest path', id + '-k')}${ui.stat('Medicare Part B at 65', id + '-m')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Premiums only (deductibles extra). Marketplace uses 2026 rules held flat, the federal default age curve and an expansion state; COBRA lasts 18 months; Medicare shows 2026 Part B per person with the surcharge set by income two years earlier (Part D and Medigap extra). COBRA and job prices are examples: use your own.</div>`;
    const fig = root.querySelector('.wg-fig');
    let lastH = '1';
    const st = ui.wire(root, () => {
      const h = st.seg(id + '-h');
      if (h !== lastH) { lastH = h; st.set(id + '-c', h === '2' ? 1700 : 800); st.set(id + '-j', h === '2' ? 500 : 200); }
      draw();
    });
    function years(path, s) {
      const out = [];
      for (let a = s.R; a < 65; a++) {
        const full = benchYear(s.n, a, s.b40), mk = market(s.magi, s.n, true, full);
        const mkt = { src: mk.zone === 'medicaid' ? 'medicaid' : 'mkt', cost: mk.cost };
        const k = a - s.R; const segs = [];
        if (path === 'job') segs.push({ src: 'job', cost: s.job * 12 });
        else if (path === 'cobra' && k === 0) segs.push({ src: 'cobra', cost: s.cobra * 12 });
        else if (path === 'cobra' && k === 1) { segs.push({ src: 'cobra', cost: s.cobra * 6 }); segs.push({ src: mkt.src, cost: mkt.cost / 2 }); }
        else segs.push(mkt);
        out.push({ age: a, segs, total: segs.reduce((t, q) => t + q.cost, 0), full });
      }
      return out;
    }
    const COL = { cobra: ['f-acc', 'COBRA'], mkt: ['f-up', 'Marketplace'], medicaid: ['f-info', 'Medicaid'], job: ['f-vio', 'Job plan'], medicare: ['f-info-t s-info w15', 'Medicare'] };
    const draw = ui.responsive(fig, (W) => {
      const s = { n: Number(st.seg(id + '-h')) || 1, R: st.n(id + '-r'), magi: st.n(id + '-i'), b40: st.n(id + '-b'), cobra: st.n(id + '-c'), job: st.n(id + '-j') };
      const path = st.seg(id + '-p') || 'cobra';
      const all = {}; PATHS.forEach((p) => { const ys = years(p.v, s); all[p.v] = { ys, total: ys.reduce((t, q) => t + q.total, 0) }; });
      const cur = all[path];
      const pb65 = partB(s.magi, s.n === 2) * 12 * s.n;
      const compact = W < 480;
      const H1 = Math.round(SML.clamp(W * 0.34, 190, 250)), rowH = 30, H = H1 + 34 + PATHS.length * rowH + 10;
      const pl = compact ? 40 : 52, pr = 12, pt = compact ? 66 : 46, pb = 30;
      const n = cur.ys.length + 1; // + Medicare year
      const bw = (W - pl - pr) / n;
      const yMax = Math.max(pb65, ...cur.ys.map((q) => q.total), 1000) * 1.2;
      const y = SML.lin(0, yMax, H1 - pb, pt);
      let b = '';
      // legend
      let lx = pl - (compact ? 30 : 0), ly = 12; ['cobra', 'mkt', 'medicaid', 'job', 'medicare'].forEach((k) => { const w = COL[k][1].length * 6.6 + 26; if (lx + w > W - pr) { lx = pl - (compact ? 30 : 0); ly += 18; } b += S.rect(lx, ly, 11, 11, COL[k][0], 2) + S.text(lx + 16, ly + 9, COL[k][1], 'sm ink'); lx += w; });
      SML.ticks(0, yMax, 3).forEach((v) => { if (y(v) < pt - 4) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const every = bw < 22 ? 2 : 1;
      cur.ys.concat([{ age: 65, segs: [{ src: 'medicare', cost: pb65 }], total: pb65 }]).forEach((q, i) => {
        const x0 = pl + i * bw + Math.min(4, bw * 0.15), w = bw - Math.min(8, bw * 0.3);
        let yb = H1 - pb;
        q.segs.forEach((sg) => { const h = (H1 - pb) - y(sg.cost); b += S.rect(x0, yb - h, w, Math.max(sg.cost > 0 ? 1.5 : 0, h), COL[sg.src][0], 2); yb -= h; });
        if (q.total === 0) b += S.rect(x0, H1 - pb - 3, w, 3, 'f-info', 1);
        if (bw >= (compact ? 30 : 34)) b += S.text(x0 + w / 2, yb - 6, q.total === 0 ? '$0' : kfmt(q.total), 'xs mono b ink', 'middle');
        if (i % every === 0 || q.age === 65) b += S.text(x0 + w / 2, H1 - pb + 16, String(q.age), 'xs mono' + (q.age === 65 ? ' b info' : ''), 'middle');
      });
      b += S.line(pl, H1 - pb + 0.5, W - pr, H1 - pb + 0.5, 's-line');
      b += S.text(pl, H1 - 2, 'age', 'xs mut');
      // comparison rows
      const top = H1 + 22; const maxT = Math.max(...PATHS.map((p) => all[p.v].total), 1);
      const lw = compact ? 92 : 112, vw = 70; const bx = pl - (compact ? 30 : 40) + lw, bwid = W - pr - vw - bx;
      b += S.text(pl - (compact ? 30 : 40), top - 6, 'Total premiums before 65, by path', 'sm mut');
      const best = PATHS.reduce((a, p) => (all[p.v].total < all[a.v].total ? p : a), PATHS[0]);
      PATHS.forEach((p, i) => {
        const yy = top + 4 + i * rowH, on = p.v === path, t = all[p.v].total;
        b += S.text(pl - (compact ? 30 : 40), yy + 15, p.label, 'sm ' + (on ? 'ink b' : 'mut'));
        b += S.rect(bx, yy + 4, bwid, 14, 'f-shade', 3) + S.rect(bx, yy + 4, Math.max(3, (bwid * t) / maxT), 14, on ? 'f-acc' : 'f-shade2', 3);
        b += S.text(W - pr, yy + 16, usd(t), 'sm mono ' + (p.v === best.v ? 'up b' : on ? 'ink b' : 'mut'), 'end');
      });
      fig.innerHTML = S.wrap(W, H, `Health premiums each year from ${s.R} to 65 on the ${path} path, and total premiums for three paths`, b);
      // stats
      const yrs = 65 - s.R;
      setT(id + '-y', yrs + (yrs === 1 ? ' year' : ' years'));
      setT(id + '-t', usd(cur.total));
      setT(id + '-k', best.label, best.v === path ? 'up' : 'acc');
      setT(id + '-m', usd(partB(s.magi, s.n === 2)) + '/mo', partB(s.magi, s.n === 2) > 202.9 ? 'dn' : '');
      setL(id + '-m', s.n === 2 ? 'Medicare Part B at 65, each' : 'Medicare Part B at 65');
      // coach
      const fp = fpl(s.n), pFpl = (s.magi / fp) * 100;
      const irm = partB(s.magi, s.n === 2) > 202.9;
      const diff = all.cobra.total - all.mkt.total;
      let txt;
      if (pFpl > 400) txt = ['dn', 'Full price', `At ${usd(s.magi)} you are above 400% of the poverty level (${usd(fp * 4)} for ${s.n === 2 ? 'two' : 'one'}), so the marketplace is full price and climbs with age to about ${usd(benchYear(s.n, 64, s.b40))} a year at 64. Spending cash or Roth contributions to drop MAGI under the line is worth thousands.`];
      else if (pFpl < 138) txt = ['info', 'Medicaid range', `At ${pc(pFpl)} of the poverty level you would usually qualify for Medicaid in an expansion state, so marketplace years show $0. Check your state's rules, including the work rules that start by 2027.`];
      else if (diff > 0) txt = ['up', 'Price both', `With MAGI under the cliff, the marketplace caps your benchmark premium at a share of income, so going straight to it saves ${usd(diff)} versus COBRA here. COBRA is worth it mainly mid-treatment or to keep your doctors and deductible.`];
      else txt = ['acc', 'COBRA wins here', `Your COBRA price is low enough to beat the marketplace by ${usd(-diff)} for the first 18 months. Pick a marketplace plan within 60 days of losing job coverage if you will need one.`];
      if (best.v === 'job' && path !== 'job') txt[2] += ` A job plan at ${usd(s.job)} a month would be cheapest of all (${usd(all.job.total)}), if you want part-time work anyway.`;
      if (irm) txt[2] += ` Income at 63 sets Medicare premiums at 65: you would pay ${usd(partB(s.magi, s.n === 2))} a month for Part B instead of $202.90.`;
      setMsg(id + '-msg', txt[0], txt[1], txt[2]);
    });
  };

  /* =====================================================================
     3. ssEarly: what an early stop does to Social Security
     ===================================================================== */
  const BP1 = 1340, BP2 = 8077, WAGE_BASE = 184500, PER_CREDIT = 1890;
  function pia(aime) { const v = 0.9 * Math.min(aime, BP1) + 0.32 * SML.clamp(aime - BP1, 0, BP2 - BP1) + 0.15 * Math.max(0, aime - BP2); return Math.floor(v * 10) / 10; }
  function ssCalc(start, earn, stop) {
    const yrs = Math.max(0, stop - start);
    const ok = earn >= PER_CREDIT * 4 ? yrs : 0; const credits = Math.min(40, ok * 4);
    const counted = Math.min(yrs, 35);
    const aime = Math.floor((Math.min(earn, WAGE_BASE) * counted) / 420);
    return { yrs, counted, zeros: 35 - counted, credits, eligible: ok * 4 >= 40, aime, pia: ok * 4 >= 40 ? pia(aime) : 0 };
  }
  const CLAIM = { 62: [0.70, 0.325], 67: [1, 0.5], 70: [1.24, 0.5] };
  SML.widgets.ssEarly = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('sse');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-c', [{ v: '62', label: 'Claim at 62' }, { v: '67', label: 'At 67' }, { v: '70', label: 'At 70' }], '67', 'Claiming age')}${ui.chips(id + '-o', [{ k: 'sp', label: 'Spouse with no earnings', color: 'var(--info)' }, { k: 'cut', label: 'Plan for 78% payable', color: 'var(--down)' }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-e', label: "Average yearly pay, today's dollars", min: 15000, max: 200000, step: 1000, value: opts.earn || 90000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-a', label: 'Started full-time work at', min: 18, max: 32, step: 1, value: 22, fmt: (v) => String(v) })}
        ${ui.slider({ id: id + '-s', label: 'Stop working at', min: 30, max: 67, step: 1, value: opts.stop || 45, fmt: (v) => String(v) })}
      </div>
      <div class="wg-read">${ui.stat('Monthly benefit', id + '-m', 'hl big')}${ui.stat('Zero years in your 35', id + '-z')}${ui.stat('Versus a full 35-year record', id + '-d')}${ui.stat('Credits', id + '-k')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Simplified estimate in today's dollars: SSA's latest benefit formula (first eligible in 2027: 90% of the first $1,340 of average monthly earnings, 32% up to $8,077, 15% above), pay capped at the 2026 wage base of $184,500, full retirement age 67 (born 1960 or later). Your real record and wage indexing will differ: check your statement at ssa.gov. Drag the dot to change when you stop.</div>`;
    const fig = root.querySelector('.wg-fig');
    let G = null;
    const st = ui.wire(root, () => draw());
    ui.drag(fig, { start: (pt) => move(pt), move: (pt) => move(pt) });
    function move(pt) { if (!G) return; const a = SML.clamp(Math.round(G.x.inv(pt.x)), 30, 67); if (a !== st.n(id + '-s')) { st.set(id + '-s', a); draw(); } }
    const draw = ui.responsive(fig, (W) => {
      const claim = st.seg(id + '-c') || '67', [cf, sf] = CLAIM[claim];
      const sp = st.on(id + '-o', 'sp'), cut = st.on(id + '-o', 'cut') ? 0.78 : 1;
      const earn = st.n(id + '-e'), start = st.n(id + '-a'), stop = Math.max(st.n(id + '-s'), 30);
      const ben = (a) => { const c = ssCalc(start, earn, a); return { c, me: Math.floor(c.pia * cf * cut), hh: Math.floor(c.pia * (cf + (sp ? sf : 0)) * cut) }; };
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.46, 250, 320));
      const pl = compact ? 44 : 56, pr = 16, pt = 36, pb = 30;
      const x = SML.lin(30, 67, pl, W - pr);
      const top = ben(67); const yMax = Math.max(top.hh, top.me, 500) * 1.18;
      const y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 4) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, '$' + F.num(v), 'xs mono', 'end'); });
      [30, 35, 40, 45, 50, 55, 60, 67].forEach((a) => { if (compact && (a === 35 || a === 45 || a === 55)) return; b += S.text(x(a), H - pb + 16, String(a), 'xs mono', 'middle'); });
      // not-eligible zone
      const minAge = start + 10;
      if (minAge > 30) { const xe = x(Math.min(minAge, 67)); b += S.rect(pl, pt, xe - pl, H - pb - pt, 'f-dn-t', 0, ' opacity=".6"'); if (xe - pl > 70) b += S.text((pl + xe) / 2, pt + 16, 'under 40 credits', 'xs dn b', 'middle'); }
      // curves
      const ptsMe = [], ptsHh = [];
      for (let a = 30; a <= 67; a++) { const r = ben(a); ptsMe.push([x(a), y(r.me)]); ptsHh.push([x(a), y(r.hh)]); }
      b += S.area(ptsMe, H - pb, 'f-up-t') + S.poly(ptsMe, 's-up w25');
      const full35 = start + 35; if (full35 <= 66) { b += S.line(x(full35), pt, x(full35), H - pb, 's-mut dash2'); b += S.text(x(full35) + 5, H - pb - 10, compact ? '35 yrs' : '35 years worked', 'xs ink'); }
      if (sp) b += S.poly(ptsHh, 's-info w2 dash');
      b += S.line(pl, y(top.me), W - pr, y(top.me), 's-acc dash w15') + S.text(pl + 4, y(top.me) - 6, (compact ? 'full record: $' : 'full 35-year record: $') + F.num(top.me) + '/mo', 'sm acc b');
      if (sp) b += S.text(W - pr, y(top.hh) - 6, compact ? 'with spouse' : 'you + spouse', 'sm info b', 'end');
      // you
      const r = ben(stop), mx = x(stop), my = y(r.me);
      b += S.line(mx, pt, mx, H - pb, 's-ink w15');
      const lab = r.c.eligible ? `$${F.num(r.me)}/mo` : 'no benefit'; const lw = lab.length * 7.4;
      const lx = SML.clamp(mx, pl + lw / 2 + 4, W - pr - lw / 2 - 4), ly = my - 16 < pt + 18 ? my + 28 : my - 16;
      b += S.rect(lx - lw / 2 - 6, ly - 14, lw + 12, 20, 'f-surf s-line', 4) + S.text(lx, ly + 1, lab, 'md ink b', 'middle');
      b += S.circle(mx, my, 8, 'handle');
      b += S.text(pl, 18, `Monthly benefit at ${claim} by the age you stop working`, 'sm mut');
      fig.innerHTML = S.wrap(W, H, `Social Security at ${claim} by stopping age: stopping at ${stop} gives about $${F.num(r.me)} a month`, b);
      G = { x };
      // stats
      setT(id + '-m', r.c.eligible ? '$' + F.num(sp ? r.hh : r.me) : '$0', r.c.eligible ? '' : 'dn');
      setL(id + '-m', sp ? `Monthly at ${claim}, you + spouse` : `Monthly benefit at ${claim}`);
      setT(id + '-z', String(r.c.zeros), r.c.zeros > 0 ? 'acc' : 'up');
      const drop = top.me > 0 ? (r.me / top.me - 1) * 100 : 0;
      setT(id + '-d', r.c.eligible ? (drop >= -0.5 ? 'Same' : F.spct(drop, 0)) : '−100%', drop < -0.5 || !r.c.eligible ? 'dn' : 'up');
      setT(id + '-k', `${r.c.credits} of 40`, r.c.eligible ? 'up' : 'dn');
      // coach
      if (earn < PER_CREDIT * 4) setMsg(id + '-msg', 'dn', 'Too little pay', `Each credit needs ${usd(PER_CREDIT)} of earnings in 2026, so a year at ${usd(earn)} earns fewer than four. Raise the pay to see a benefit.`);
      else if (!r.c.eligible) setMsg(id + '-msg', 'dn', 'Not yet eligible', `You need 40 credits, about 10 years of work. Stopping at ${stop} gives ${r.c.credits}. Working until ${minAge} unlocks a benefit for life.`);
      else {
        const nx = stop < 67 ? ben(stop + 1).me - r.me : 0;
        let t = r.c.zeros > 0 ? `Your 35-year average includes ${r.c.zeros} zero years, yet the benefit is still ${F.num(100 + drop, 0)}% of a full 35-year record because the formula pays 90% on the first dollars. One more working year adds about $${F.num(nx)} a month.` : `You already have 35 working years. Extra years only help if they replace a lower-earning year.`;
        if (claim === '62' && stop > 62) t += ' Claiming at 62 while still working: SSA holds back $1 for every $2 you earn above $24,480 (2026) until 67, then credits it back.';
        if (claim === '62' && stop <= 62) t += ` Waiting until 70 would pay $${F.num(Math.floor(r.c.pia * 1.24 * cut))} a month instead, for life.`;
        if (cut < 1) t += ' Figures show 78% of the formula, the share payable from 2033 if Congress does nothing.';
        setMsg(id + '-msg', 'up', r.c.zeros > 0 ? 'Zero years' : 'Full record', t);
      }
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-aca', course: 'fi-health', order: 1, title: 'Health insurance before 65', mins: 10, level: 'Intermediate',
    summary: 'Marketplace tax credits, the 400% cliff and how to steer your income.',
    idea: 'Before 65, what you pay for health insurance depends on your income, not your savings. Steer your income and you steer the premium.',
    widget: 'acaSubsidy',
    try: 'Drag the dot along the income line and watch the price jump at the 400% line. Switch to Build MAGI to see which money counts.',
    body: [
      '<h3>Income, not wealth</h3><p>If you retire before 65 you buy your own health insurance, usually on the <b>ACA marketplace</b> (HealthCare.gov or your state’s site). The <b>premium tax credit</b> that lowers the price depends on your household’s <b>MAGI</b> compared with the <b>federal poverty level</b> (FPL). Your savings do not count. A couple with $2 million invested and $60,000 of income is treated as a $60,000 household.</p>',
      '<h3>The 2026 rules: the cliff is back</h3><p>The extra-generous credits of 2021 to 2025 expired at the end of 2025 and were not renewed. The House passed a three-year extension in January 2026, but the Senate has not voted on it as of October 2026, so check HealthCare.gov before you plan. For 2026 coverage the original rules apply again:</p><ul><li>The credit is available from <b>100% to 400% of the poverty level</b>, using the 2025 guidelines: $15,650 for one person, $21,150 for two, $32,150 for four.</li><li>At <b>400%</b> help stops completely: <b>$62,600</b> single, <b>$84,600</b> for a couple, <b>$128,600</b> for a family of four. That is the <b>subsidy cliff</b>.</li><li>Below it you pay a set share of income for the benchmark (second-cheapest silver) plan: <b>2.10%</b> under 133% of FPL, rising to <b>9.96%</b> from 300% to 400%. The credit covers the rest.</li><li><b>2027 coverage</b> (open enrollment runs November 1, 2026 to January 15, 2027 on HealthCare.gov, December 15 for coverage from January 1): the cliff still applies under current law. The 2026 guidelines move the 400% line to <b>$63,840</b> single, <b>$86,560</b> for two and <b>$132,000</b> for four, and the share of income runs from <b>2.15%</b> to <b>10.22%</b>. Use the 2027 switch in the calculator.</li></ul>', '<h3>The hidden tax below the cliff</h3><p>Under the line the credit shrinks as income rises, because your required share climbs. Between about 150% and 400% of FPL, each extra dollar of MAGI raises your net premium by roughly <b>10 to 18 cents</b>, on top of income tax. A $10,000 Roth conversion can quietly cost $1,000 to $1,800 in lost credit. The calculator shows this rate for your income.</p>', '<h3>Cost-sharing reductions on silver plans</h3><p>Between 100% and 250% of FPL, choosing a <b>silver</b> plan also brings cost-sharing reductions: a lower deductible, lower copays and a lower out-of-pocket maximum. They come only with silver plans, so a cheap bronze plan can cost you more if you need care.</p>',
      '<h3>What counts as MAGI</h3><p>MAGI for the marketplace is your adjusted gross income plus tax-exempt interest, untaxed foreign income and the untaxed part of Social Security. In practice:</p><ul><li><b>Counts:</b> wages, traditional IRA and 401(k) withdrawals, Roth conversions, interest and dividends, realized capital gains, all of your Social Security benefit.</li><li><b>Does not count:</b> withdrawals of your own Roth IRA contributions, cash from savings, the cost-basis part of shares you sell, loans.</li><li><b>Lowers it:</b> HSA contributions and deductible traditional IRA contributions (you need earned income for an IRA).</li></ul>',
      '<h3>Medicaid and the coverage gap</h3><p>In the 41 states (with DC) that expanded Medicaid, adults under about <b>138% of FPL</b> usually get Medicaid instead of a credit. It is based on income, not assets. In the 10 states that did not expand, adults under 100% of FPL often get neither: the coverage gap.</p><p>Some early retirees with large savings but low income have used Medicaid as their health plan. That gets much harder from <b>January 1, 2027</b> (states may start earlier and some may get extensions to the end of 2028): expansion adults aged 19 to 64 must show <b>80 hours a month</b> of work, community service, a work program or half-time school, or earnings of at least 80 times the federal minimum wage, unless exempt (for example medically frail people and some caregivers). Coverage is also rechecked every six months. A retiree living on savings usually meets none of these, so plan on the marketplace instead. Also know that for members aged 55 and older, states must try to recover the cost of long-term care from their estates after death, and some states recover other Medicaid costs too: check your state’s rules.</p>',
      '<h3>Reconciliation: the repayment trap</h3><p>The credit is usually paid in advance, based on your income estimate. At tax time Form 8962 compares it with your real income. From tax year 2026 the cap on repaying extra credit is gone. If your final MAGI lands one dollar over 400%, you repay every dollar of credit you received.</p>',
      '<h3>How early retirees steer MAGI</h3><ul><li>Choose what you sell: high-cost-basis shares create little gain.</li><li>Keep a cash or Roth-contribution bucket for years when you need low income.</li><li>Do Roth conversions and gain harvesting in years when you are not on the marketplace, or only up to your target.</li><li>Bronze and catastrophic plans count as HSA-eligible from 2026, so HSA contributions can trim MAGI.</li><li>Check your total in November, before year-end fund distributions surprise you. Report changes to the marketplace during the year.</li></ul><p>Taxes and coverage interact in ways that are easy to miss: <a href="#l-zero-bracket">the 0% capital gains lesson</a> and <a href="#l-health-bridge">the bridge to Medicare</a> build on this. A CPA or enrolled agent can check your plan.</p>',
    ],
    example: {
      title: 'A couple at 58, close to the line',
      intro: 'Made-up numbers for 2026 coverage. Check your own area’s premium on HealthCare.gov.',
      steps: [
        'Household of two: the 2025 poverty guideline is $21,150, so 400% is $84,600.',
        'The benchmark silver plan for both of them costs $2,400 a month, or $28,800 a year.',
        'They plan MAGI of $80,000, which is 378% of FPL. Their share is 9.96%: 0.0996 × $80,000 = $7,968 a year. The credit covers $28,800 − $7,968 = $20,832.',
        'In December a fund pays out a surprise $5,000 gain. MAGI becomes $85,000, or 402% of FPL. No credit at all, and with no repayment cap they owe back the full $20,832 at tax time.',
        'The fix: spend from cash or Roth contributions and sell high-basis shares, keeping MAGI at about $84,000, and check it again before year-end.',
      ],
      result: 'Here $5,000 of extra income would have cost $20,832. Plan withdrawals around the line.',
    },
    mistakes: [
      'Assuming your savings rule you out. The marketplace looks at income, not assets.',
      'Forgetting that Roth conversions, realized gains and your whole Social Security benefit count in MAGI.',
      'Estimating income too low. From 2026 there is no cap on paying back extra credit.',
      'Planning on the 2021-2025 credits. They expired, and the 400% cliff is back.',
    ],
    points: [
      'Marketplace credits depend on MAGI and household size, measured against the poverty level.',
      'Help stops above 400% of FPL: $62,600 single, $84,600 for two, $128,600 for four in 2026; $63,840, $86,560 and $132,000 in 2027.',
      'Below the cliff each extra MAGI dollar costs roughly 10 to 18 cents of credit, a hidden tax to plan around.',
      'Below about 138% of FPL in an expansion state, adults usually get Medicaid instead.',
      'Choosing which money you spend (cash, Roth contributions, high-basis shares) is how early retirees control MAGI.',
    ],
    terms: ['ACA marketplace', 'Premium tax credit', 'Subsidy cliff', 'FPL', 'MAGI', 'Medicaid'],
    glossary: [
      { t: 'Benchmark plan', d: 'The second-lowest-cost silver plan in your area. The tax credit is sized against its price, but you can use the credit on any metal level.' },
      { t: 'Reconciliation', d: 'Comparing the advance credit you received with the credit your real income allows, on Form 8962 with your tax return.' },
    ],
    quiz: { q: 'A retired couple has $2 million invested and plans $60,000 of MAGI in 2026. What decides their marketplace credit?', options: ['Their $2 million of savings', 'Their income compared with the poverty level, plus the local benchmark price', 'Nothing: retirees cannot get credits before 65'], answer: 1, why: 'Credits use MAGI and household size, not assets. $60,000 is under the $84,600 line for two.' },
    sources: [
      { t: 'IRS Rev. Proc. 2025-25: 2026 required contribution percentages', u: 'https://www.irs.gov/pub/irs-drop/rp-25-25.pdf' },
      { t: 'HealthCare.gov: Federal poverty level (FPL)', u: 'https://www.healthcare.gov/glossary/federal-poverty-level-fpl/' },
      { t: 'IRS IR-2025-127: premium tax credit changes, no repayment cap from 2026', u: 'https://www.irs.gov/node/153736' },
      { t: 'KFF: Status of state Medicaid expansion decisions', u: 'https://www.kff.org/medicaid/status-of-state-medicaid-expansion-decisions/' },
      { t: 'IRS Rev. Proc. 2026-26: 2027 applicable percentage table', u: 'https://www.irs.gov/pub/irs-drop/rp-26-26.pdf' },
      { t: 'Medicaid.gov: Estate recovery', u: 'https://www.medicaid.gov/medicaid/eligibility/estate-recovery/index.html' },
      { t: 'Foley Hoag: CMS interim final rule on Medicaid work requirements (June 2026)', u: 'https://www.foleyhoag.com/news-and-insights/publications/alerts-and-updates/2026/june/cms-issues-interim-final-rule-imposing-medicaid-work-requirements-for-expansion-populations/' },
    ],
  });

  SML.lessons.push({
    id: 'l-health-bridge', course: 'fi-health', order: 2, title: 'Bridging the gap to Medicare', mins: 9, level: 'Intermediate',
    summary: 'COBRA, the marketplace, a spouse’s plan or a job: covering every year before 65.',
    idea: 'Every year before 65 needs a health plan. Price the whole bridge before you pick your retirement date.',
    widget: 'healthBridge',
    try: 'Move your retirement age and income, then switch paths. Watch the totals at the bottom and the Medicare bar at 65.',
    body: [
      '<h3>Your options before 65</h3><ul><li><b>A spouse’s workplace plan.</b> Often the cheapest bridge if your spouse keeps working.</li><li><b>COBRA.</b> Keep your old employer plan for up to 18 months after leaving, at up to 102% of its full cost. You have at least 60 days to elect it. It keeps your doctors and this year’s deductible progress.</li><li><b>The ACA marketplace.</b> Pick a plan within 60 days of losing job coverage. With income under the 400% line, the price is capped as a share of income (see <a href="#l-aca">health insurance before 65</a>). If you drop COBRA early on purpose, you usually wait until open enrollment.</li><li><b>Medicaid</b> if your income is low enough in your state.</li><li><b>A part-time job with benefits</b>, the idea behind <a href="#l-coast-fire">Barista FIRE</a>.</li><li><b>Living abroad</b> with a national system or an expat plan (see <a href="#l-expat-health">health care abroad</a>).</li></ul>',
      '<h3>Health care sharing ministries are not insurance</h3><p>Sharing plans can look cheap, but state regulators warn that they are not insurance, are not required to pay your bills and do not have to cover pre-existing conditions. Treat them as a risk, not as a bridge.</p>',
      '<h3>Age drives the full price</h3><p>Marketplace premiums can be up to three times higher at 64 than at 21. The national average benchmark plan for a 40-year-old was $625 a month in 2026, from about $401 in New Hampshire to $1,299 in Vermont, so a 60-year-old in an average area faces about $1,330 a month at full price. Under the 400% line the credit absorbs that age jump; above it you pay it all.</p>',
      '<h3>Where the HSA fits</h3><p>HSA money cannot pay regular marketplace premiums, but it can pay COBRA premiums, coverage while you receive unemployment benefits, long-term care insurance and, from 65, Medicare premiums. From 2026 bronze and catastrophic marketplace plans count as HSA-eligible, so you can keep contributing before Medicare. Contributions must stop once you enroll in Medicare.</p>',
      '<h3>Medicare at 65 and the two-year lookback</h3><p>Sign up in the seven-month window around your 65th birthday; late Part B enrollment adds 10% to the premium for each full year of delay, for life. In 2026 Part B is $202.90 a month, but higher incomes pay a surcharge called IRMAA, based on your tax return from <b>two years earlier</b>. A big Roth conversion or home sale at 63 raises your premiums at 65. If you stopped working, Form SSA-44 lets you ask Social Security to use your newer, lower income.</p>',
    ],
    example: {
      title: 'Maya retires at 60',
      intro: 'Single, $50,000 of planned MAGI a year, an expansion state. Her COBRA price of $800 a month is an example.',
      steps: [
        'COBRA for the full 18 months costs 18 × $800 = $14,400.',
        'At $50,000 she is at 319% of the poverty level, so the benchmark plan costs her 9.96% of income: $4,980 a year, or $415 a month, whatever her age.',
        'Marketplace from 61½ to 65 (42 months): 42 × $415 = $17,430. COBRA first totals $14,400 + $17,430 = $31,830.',
        'Marketplace from day one: 60 months × $415 = $24,900, which is $6,930 less.',
        'At 63 she keeps MAGI under that year’s IRMAA threshold ($109,000 for 2026, indexed each year), so her first Medicare year has no surcharge: Part B was $202.90 a month in 2026.',
      ],
      result: 'Going straight to the marketplace saves about $6,900. COBRA makes sense mainly mid-treatment or to keep the same doctors.',
    },
    mistakes: [
      'Choosing COBRA by default without pricing the marketplace at your new, lower retirement income.',
      'Dropping COBRA midyear and expecting to switch: ending it early on purpose usually means waiting for open enrollment.',
      'Relying on a sharing ministry as your only coverage. It is not insurance and payment is not guaranteed.',
      'Doing a large Roth conversion or sale at 63 and paying higher Medicare premiums at 65.',
    ],
    points: [
      'List every year from your retirement date to 65 and give each one a health plan and a price.',
      'Under the 400% line the marketplace caps the benchmark premium as a share of income, so age matters less.',
      'COBRA lasts up to 18 months at up to 102% of the plan’s full cost, and HSA money can pay it.',
      'Medicare premiums at 65 depend on your income at 63: plan conversions with that in mind.',
    ],
    terms: ['COBRA', 'ACA marketplace', 'Medicaid', 'HSA', 'Medicare', 'IRMAA'],
    glossary: [
      { t: 'Health care sharing ministry', d: 'A group whose members share medical bills, often faith-based. Not insurance: payment is voluntary and pre-existing conditions can be excluded.' },
      { t: 'Special enrollment period', d: 'A window outside open enrollment, often 60 days after losing job coverage, when you can buy a marketplace plan.' },
    ],
    quiz: { q: 'Which premium can you pay with HSA money before 65?', options: ['A regular marketplace plan premium', 'COBRA premiums', 'Any premium once you are retired'], answer: 1, why: 'IRS rules allow HSA money for COBRA, coverage while on unemployment, long-term care insurance and, from 65, Medicare premiums.' },
    sources: [
      { t: 'US Department of Labor: An employee’s guide to health benefits under COBRA', u: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/an-employees-guide-to-health-benefits-under-cobra' },
      { t: 'Michigan DIFS: Health care sharing ministries are not health insurance', u: 'https://www.michigan.gov/difs/news-and-outreach/press-releases/2024/01/23/difs-reminds-consumers-that-health-care-sharing-ministries-are-not-health-insurance' },
      { t: 'CMS: 2026 Medicare Parts A and B premiums and deductibles', u: 'https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles' },
      { t: 'IRS Publication 969: HSAs and other tax-favored health plans', u: 'https://www.irs.gov/publications/p969' },
    ],
  });

  SML.lessons.push({
    id: 'l-ss-early', course: 'fi-health', order: 3, title: 'Social Security when you stop early', mins: 9, level: 'Intermediate',
    summary: 'Zero years, the 40 credits, claiming age and what an early stop really costs.',
    idea: 'Social Security averages your best 35 years. Stopping early adds zeros, but the formula softens the blow more than most people expect.',
    widget: 'ssEarly',
    try: 'Drag the dot to the age you might stop working. Then compare claiming at 62, 67 and 70.',
    body: [
      '<h3>How the benefit is figured</h3><p>Social Security takes your 35 highest-earning years (adjusted for wage growth), adds them up and divides by 420 months. That is your average indexed monthly earnings. A formula with two <b>bend points</b> then gives your benefit at full retirement age, the <b>PIA</b>: for people first eligible in 2027 it is 90% of the first $1,340, 32% of the amount up to $8,077 and 15% above that. The first dollars count most, which is why an early stop hurts less than you might fear.</p>',
      '<h3>The 10-year minimum</h3><p>You need <b>40 credits</b> to qualify. You earn up to four a year, one for each $1,890 of earnings in 2026. Ten years of real work is enough to get a benefit for life.</p>',
      '<h3>Zero years</h3><p>If you stop after 23 years of work, the 35-year average includes 12 zeros. Your statement at ssa.gov assumes you keep earning until you claim, so it overstates the benefit for an early retiree. Recalculate with your planned stop age, or use the calculator here as a rough guide.</p>',
      '<h3>When to claim</h3><ul><li>Full retirement age is <b>67</b> for anyone born in 1960 or later.</li><li>Claiming at <b>62</b> cuts your benefit by 30% for life.</li><li>Waiting to <b>70</b> adds 8% a year, 24% in total.</li><li>A spouse with little or no work record can get up to 50% of your PIA at their full retirement age (35% less at 62). Delayed credits do not raise it.</li><li>When one spouse dies, the survivor keeps the larger of the two benefits, which is a strong reason for the higher earner to wait.</li></ul>',
      '<h3>The earnings test</h3><p>If you claim before full retirement age and still work, Social Security holds back $1 for every $2 you earn above <b>$24,480</b> (2026). In the year you reach full retirement age it is $1 for every $3 above $65,160, counting only months before your birthday. Withheld money is not lost: your benefit is recalculated at full retirement age.</p>',
      '<h3>Will it be there?</h3><p>Retirement benefits are paid from the OASI trust fund. The 2026 Trustees Report projects it runs out in late 2032; after that, incoming payroll taxes cover about <b>78%</b> of scheduled benefits unless Congress acts. (Counting the disability fund too, the combined funds last to 2034 at about 83%, but that is not how the law works today.) A cautious plan uses 78% from 2033; the option in the calculator shows it.</p>',
      '<h3>Taxes and living abroad</h3><p>Benefits become partly taxable once provisional income (AGI plus tax-exempt interest plus half your benefit) passes <b>$25,000</b> single or <b>$32,000</b> married filing jointly: up to 50% is taxable. Above <b>$34,000</b> single or <b>$44,000</b> married, up to 85% is taxable. These thresholds have never been indexed. US citizens can usually receive benefits abroad; Treasury cannot send payments to Cuba or North Korea, and a few other countries are restricted. Agreements with countries such as France stop you paying into two systems and let you combine credits: see <a href="#l-us-tax-abroad">US taxes follow you abroad</a>. The Social Security Fairness Act of January 2025 ended the rules that cut benefits for people with some public or foreign pensions.</p>',
    ],
    example: {
      title: 'Sam stops at 45',
      intro: 'Sam earns about $90,000 a year in today’s dollars from age 22. Simplified: wages already in today’s dollars, full retirement age 67.',
      steps: [
        'Working until at least 57 fills 35 years. Average monthly earnings: $90,000 ÷ 12 = $7,500.',
        'Formula: 90% of the first $1,340 is $1,206, plus 32% of the next $6,160 is $1,971.20. Benefit at 67: about $3,177 a month.',
        'Stopping at 45 leaves 23 working years and 12 zeros: $90,000 × 23 ÷ 420 = $4,929 a month on average.',
        'Formula: $1,206 + 32% of $3,589 ($1,148) = about $2,354 a month at 67, roughly 26% less.',
        'Claiming age moves it more: $2,354 × 0.70 = $1,648 at 62, or $2,354 × 1.24 = $2,919 at 70.',
      ],
      result: 'Twelve fewer working years cut the benefit by about 26%. Claiming at 70 instead of 62 raises it by 77%.',
    },
    mistakes: [
      'Thinking an early stop wipes out Social Security. Forty credits qualify you, and the formula favors the first dollars.',
      'Planning with the number on your statement, which assumes you keep working until you claim.',
      'Claiming at 62 by default when savings could bridge the gap, and locking in a 30% cut for life, which can also shrink a surviving spouse’s check.',
      'Claiming early while still earning, then being surprised when the earnings test holds back payments.',
    ],
    points: [
      'Your benefit uses your 35 best years; missing years count as zeros.',
      'You need 40 credits, about ten years of work, to qualify at all.',
      'Because the formula pays 90% on the first dollars, stopping in your 40s often cuts the benefit by only a quarter or a third.',
      'Claiming age matters as much as working years: 62 pays 30% less than 67, and 70 pays 24% more.',
      'Plan conservatively for about 78% of scheduled benefits from 2033, when the retirement trust fund is projected to run dry.',
    ],
    terms: ['Social Security', 'Full retirement age', 'PIA', 'Delayed retirement credits', 'Earnings test', 'Totalization agreement'],
    glossary: [
      { t: 'AIME', full: 'Average indexed monthly earnings', d: 'Your 35 best years of wage-indexed earnings divided by 420 months. The benefit formula starts from it.' },
      { t: 'Bend points', d: 'The two dollar amounts in the benefit formula where the rate drops from 90% to 32% and from 32% to 15%.' },
    ],
    quiz: { q: 'You worked 20 years and stop at 42. What happens to your Social Security?', options: ['You get nothing unless you work 35 years', 'You qualify, and the benefit averages 20 working years with 15 zero years', 'Your benefit stays at the amount on today’s statement'], answer: 1, why: 'Twenty years gives far more than 40 credits. The 35-year average simply includes 15 zeros.' },
    sources: [
      { t: 'SSA: Primary insurance amount formula and bend points', u: 'https://www.ssa.gov/oact/COLA/piaformula.html' },
      { t: 'SSA: Social Security credits', u: 'https://www.ssa.gov/benefits/retirement/planner/credits.html' },
      { t: 'SSA: Benefit reduction for early retirement', u: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
      { t: 'SSA: 2026 Trustees Report conclusions', u: 'https://www.ssa.gov/OACT/TR/2026/II_E_conclu.html' },
      { t: 'SSA: Your payments while you are outside the United States', u: 'https://www.ssa.gov/pubs/EN-05-10137.pdf' },
    ],
  });
})();
