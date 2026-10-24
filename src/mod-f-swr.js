/* Stock Market Lessons: FIRE track, Stress-Test Your Plan part 1 (safe withdrawal rates, sequence risk, guardrails). Fork F6. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const k$ = (v) => {
    const a = Math.abs(v), s = v < 0 ? F.minus : '';
    if (a >= 1e6) return s + '$' + parseFloat((a / 1e6).toFixed(a >= 1e7 ? 1 : 2)) + 'M';
    if (a >= 1e4) return s + '$' + Math.round(a / 1e3) + 'K';
    if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return s + '$' + Math.round(a);
  };
  const pct0 = (v) => Math.round(v * 100) + '%';

  SML.css(`
.fsw-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px 0;font:500 11px/1.3 var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.fsw-legend i{display:inline-block;width:16px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.fsw-legend i.ln{height:0;border-top:2.5px solid;border-radius:0;vertical-align:3px}
.fsw-legend i.dsh{height:0;border-top:2px dashed;border-radius:0;vertical-align:3px}
.fsw-refs{list-style:none;display:flex;flex-direction:column;gap:6px;padding:4px 16px 12px;font-size:13px;line-height:1.45;color:color-mix(in srgb,var(--ink) 80%,transparent)}
.fsw-refs li{display:flex;gap:10px;align-items:baseline}
.fsw-refs b{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:var(--violet-t);border:1px solid var(--violet);font:600 10.5px/1 var(--mono);color:var(--ink)}
.fsw-sub{padding:12px 16px 0;font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.2em;color:var(--muted)}
.fsw-tbl{width:100%;border-collapse:collapse;font-size:14px}
.fsw-tbl th,.fsw-tbl td{padding:9px 12px;text-align:right;border-top:1px solid var(--line);white-space:nowrap}
.fsw-tbl th{font:600 10.5px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-top:0}
.fsw-tbl td:first-child,.fsw-tbl th:first-child{text-align:left}
.fsw-tbl td{font-family:var(--mono);color:var(--ink)}
.fsw-tbl td:first-child{font-family:var(--sans,inherit);font-weight:600}
.fsw-tbl .sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px;vertical-align:0}
.fsw-tblw{overflow-x:auto;padding:4px 4px 0}
.fsw-ctrl{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.fsw-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;grid-column:1/-1}
.fsw-row .lab{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.fsw-row .seg{flex-wrap:wrap}
.fsw-btn{min-height:36px;padding:0 14px;font-size:13px}
svg .fsw-grab{cursor:grab}
@media (max-width:560px){.fsw-tbl th,.fsw-tbl td{padding:8px 6px;font-size:12.5px}.fsw-tbl .hide-s{display:none}.fsw-tbl .sw{margin-right:5px}}
`);

  /* ---------- shared chart bits ---------- */
  function yAxis(ticks, y, x0, x1, fmt) {
    return ticks.map((v) => S.line(x0, y(v), x1, y(v), 's-grid') + S.text(x0 - 6, y(v) + 3.5, fmt(v), 'xs mono', 'end')).join('');
  }
  function xAxis(ticks, x, yb, fmt) {
    return ticks.map((v) => S.line(x(v), yb, x(v), yb + 4, 's-line') + S.text(x(v), yb + 16, fmt(v), 'xs mono', 'middle')).join('');
  }
  const niceMax = (v) => { const t = SML.ticks(0, v, 4); const st = t.length > 1 ? t[1] - t[0] : v; return Math.ceil(v / st) * st; };

  /* =====================================================================
     Monte Carlo engine (real, after-inflation returns, seeded)
     Stocks: log-return mean 5.5%, sd 16%  -> about 7% average yearly real return
     Bonds:  log-return mean 2.0%, sd 6%   -> about 2.2% average yearly real return
     Correlation 0.1, each year independent. Withdrawals at the start of each year,
     raised with inflation (constant in real terms), portfolio rebalanced every year.
     ===================================================================== */
  const MC = { sMu: 0.055, sSd: 0.16, bMu: 0.02, bSd: 0.06, rho: 0.1, n: 1000, Y: 60 };
  const pathCache = new Map();
  function getPaths(seed) {
    if (pathCache.has(seed)) return pathCache.get(seed);
    const r = SML.rng(seed), N = MC.n * MC.Y;
    const zs = new Float64Array(N), zb = new Float64Array(N);
    const c = Math.sqrt(1 - MC.rho * MC.rho);
    for (let i = 0; i < N; i++) { const a = r.gauss(), b = r.gauss(); zs[i] = a; zb[i] = MC.rho * a + c * b; }
    const P = { zs, zb };
    if (pathCache.size > 4) pathCache.clear();
    pathCache.set(seed, P);
    return P;
  }
  function returnTable(P, w, fee) {
    const N = MC.n * MC.Y, R = new Float64Array(N);
    for (let i = 0; i < N; i++) R[i] = w * (Math.exp(MC.sMu + MC.sSd * P.zs[i]) - 1) + (1 - w) * (Math.exp(MC.bMu + MC.bSd * P.zb[i]) - 1) - fee;
    return R;
  }
  /* start = 1; returns success share, failure years, optional balances per path per year */
  function runMC(R, rate, years, rec) {
    let ok = 0; const fails = []; const Yp = years + 1;
    const bal = rec ? new Float64Array(MC.n * Yp) : null;
    for (let p = 0; p < MC.n; p++) {
      let b = 1, failY = 0; const o = p * MC.Y;
      if (rec) bal[p * Yp] = 1;
      for (let y = 0; y < years; y++) {
        if (!failY) { b -= rate; if (b <= 0) { b = 0; failY = y + 1; } else b *= 1 + R[o + y]; }
        if (rec) bal[p * Yp + y + 1] = b;
      }
      if (failY) fails.push(failY); else ok++;
    }
    return { succ: ok / MC.n, fails, bal, Yp };
  }
  function pctiles(bal, Yp, qs) {
    const out = qs.map(() => new Float64Array(Yp)); const col = new Float64Array(MC.n);
    for (let t = 0; t < Yp; t++) {
      for (let p = 0; p < MC.n; p++) col[p] = bal[p * Yp + t];
      col.sort();
      qs.forEach((q, i) => { out[i][t] = col[Math.min(MC.n - 1, Math.floor(q * MC.n))]; });
    }
    return out;
  }
  const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

  /* Research reference points (see lesson sources). r in %, a/b for ranges. */
  const REFS = [
    { n: 1, r: 4.0, years: 30, t: 'Bengen (1994): about 4.15% survived the worst 30-year period for a 60/40 mix of US stocks and Treasuries, rounded to the 4% rule.' },
    { n: 2, r: 4.7, years: 30, t: 'Bengen (2025 book): 4.7% for 30 years, after adding small, mid-size and international stocks.' },
    { n: 3, a: 3.25, b: 3.5, years: 50, t: 'Early Retirement Now: about 3.25% to 3.5% for 40 to 60 year retirements.' },
    { n: 4, r: 3.9, years: 30, t: 'Morningstar (for 2026): 3.9% for 30 years at 90% success, with 30% to 50% in stocks.' },
  ];

  /* =====================================================================
     1. swrSim: success rate across 1,000 simulated futures
     ===================================================================== */
  SML.widgets.swrSim = function (root) {
    const id = SML.uid('swr');
    let seed = 20261021;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">1,000 simulated futures</span>${ui.seg(id + '-y', [{ v: 30, label: '30 yrs' }, { v: 40, label: '40 yrs' }, { v: 50, label: '50 yrs' }, { v: 60, label: '60 yrs' }], 40, 'How many years the money must last')}</div>
      <div class="wg-fig">
        <div class="fsw-legend" aria-hidden="true"><span><i class="ln" style="border-color:var(--info)"></i>Median future</span><span><i style="background:color-mix(in srgb,var(--info) 35%,transparent)"></i>Middle half</span><span><i style="background:var(--info-t)"></i>8 in 10 futures</span><span><i class="dsh" style="border-color:var(--down)"></i>Worst 10%</span><span><i style="background:var(--down)"></i>Ran out that year</span></div>
        <div class="fsw-f1"></div>
        <p class="fsw-sub">Success rate for every withdrawal rate</p>
        <div class="fsw-f2"></div>
        <ul class="fsw-refs">${REFS.map((r) => `<li><b>${r.n}</b><span>${r.t}</span></li>`).join('')}<li><b>i</b><span>Marks 1, 2 and 4 are 30-year findings from history or forecasts. Set 30 years to compare like with like.</span></li></ul>
      </div>
      <div class="wg-ctrl fsw-ctrl">
        ${ui.slider({ id: id + '-r', label: 'First-year withdrawal', min: 2.5, max: 6, step: 0.1, value: 4, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-w', label: 'Stocks in the mix', min: 0, max: 100, step: 10, value: 60, fmt: 'pct' })}
        ${ui.slider({ id: id + '-f', label: 'Yearly fees', min: 0, max: 1.5, step: 0.05, value: 0.1, fmt: (v) => F.num(v, 2) + '%' })}
        ${ui.slider({ id: id + '-p', label: 'Starting portfolio', min: 250000, max: 5000000, step: 50000, value: 1000000, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Lasted the whole time', id + '-ss')}${ui.stat('First-year spending', id + '-sp')}${ui.stat('Median left at the end', id + '-sm')}${ui.stat('Worst 10% left', id + '-sw')}${ui.stat('Failures ran out around', id + '-sf')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g fsw-btn" id="${id}-new">Roll 1,000 new futures</button><button type="button" class="btn btn-g fsw-btn" id="${id}-reset">Reset</button></div>
      <div class="wg-note">A simulation, not history: each year draws a random return. Stocks average about 7% a year above inflation and swing about 16% in a typical year; bonds about 2% with 6% swings. Real markets have streaks and recoveries this simple model leaves out, so treat the percentages as rough. Spending starts at the withdrawal rate and rises with inflation every year (shown in today’s dollars). Drag the dot on the lower chart to change the rate.</div>`;
    const f1 = root.querySelector('.fsw-f1'), f2 = root.querySelector('.fsw-f2');
    let cacheKey = '', R = null, curve = null;
    const st = ui.wire(root, () => update());
    const inputs = () => ({ rate: st.n(id + '-r') / 100, w: st.n(id + '-w') / 100, fee: st.n(id + '-f') / 100, start: st.n(id + '-p'), years: Number(st.seg(id + '-y')) || 40 });
    let res = null, q = null, I = null;
    function compute() {
      I = inputs();
      const key = seed + '|' + I.w + '|' + I.fee;
      if (key !== cacheKey) { R = returnTable(getPaths(seed), I.w, I.fee); cacheKey = key; curve = null; }
      if (!curve || curve.years !== I.years) {
        const pts = [];
        for (let r = 25; r <= 60; r += 1) pts.push([r / 10, runMC(R, r / 1000, I.years, false).succ]);
        curve = { years: I.years, pts };
      }
      res = runMC(R, I.rate, I.years, true);
      q = pctiles(res.bal, res.Yp, [0.1, 0.25, 0.5, 0.75, 0.9]);
    }
    function drawFan(W) {
      const narrow = W < 480;
      const H = narrow ? 230 : 280, pl = narrow ? 46 : 56, pr = 12, pt = 12, pb = 28;
      const years = I.years, start = I.start;
      let top = 0; for (let t = 0; t < res.Yp; t++) top = Math.max(top, q[4][t]);
      const yMax = niceMax(Math.min(Math.max(top, 1.3), 4) * start);
      const x = SML.lin(0, years, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      const cid = id + '-clip';
      let b = `<defs><clipPath id="${cid}"><rect x="${pl}" y="${pt}" width="${W - pr - pl}" height="${H - pb - pt}"/></clipPath></defs>`;
      b += yAxis(SML.ticks(0, yMax, narrow ? 3 : 4), y, pl, W - pr, k$);
      b += xAxis(SML.ticks(0, years, narrow ? 3 : 6), x, H - pb, (v) => (v === 0 ? 'start' : 'yr ' + v));
      const band = (lo, hi) => { const pts = []; for (let t = 0; t < res.Yp; t++) pts.push([x(t), y(q[hi][t] * start)]); for (let t = res.Yp - 1; t >= 0; t--) pts.push([x(t), y(q[lo][t] * start)]); return pts; };
      let g = S.polygon(band(0, 4), 'f-info-t') + S.polygon(band(1, 3), 'f-info o35');
      const line = (k) => { const pts = []; for (let t = 0; t < res.Yp; t++) pts.push([x(t), y(q[k][t] * start)]); return pts; };
      g += S.poly(line(2), 's-info w25') + S.poly(line(0), 's-dn w2 dash');
      b += `<g clip-path="url(#${cid})">${g}</g>`;
      b += S.line(pl, y(start), W - pr, y(start), 's-mut w1 dash2') + S.text(pl + 6, y(start) - 5, 'starting balance', 'xs mut');
      // failure histogram at the bottom
      const counts = new Array(years + 2).fill(0); res.fails.forEach((fy) => { counts[fy]++; });
      const cmax = Math.max(1, ...counts), hh = narrow ? 22 : 28, bw = Math.max(2, (x(1) - x(0)) * 0.7);
      for (let t = 1; t <= years; t++) if (counts[t]) { const h = Math.max(2, (counts[t] / cmax) * hh); b += S.rect(x(t) - bw / 2, H - pb - h, bw, h, 'f-dn o50', 1); }
      b += S.line(pl, H - pb, W - pr, H - pb, 's-line');
      const endMed = q[2][res.Yp - 1] * start;
      if (!narrow) b += S.text(W - pr - 4, Math.max(pt + 12, Math.min(H - pb - 8, y(Math.min(endMed, yMax)) - 8)), 'median ' + k$(endMed), 'sm info b', 'end');
      f1.innerHTML = S.wrap(W, H, `Fan chart of 1,000 simulated portfolios over ${years} years at a ${F.num(I.rate * 100, 1)}% withdrawal rate`, b);
    }
    let x2 = null;
    function drawCurve(W) {
      const narrow = W < 480;
      const H = narrow ? 206 : 222, pl = 40, pr = 16, pt = 46, pb = 30;
      const x = SML.lin(2.5, 6, pl, W - pr), y = SML.lin(0, 1, H - pb, pt); x2 = x;
      let b = yAxis([0, 0.5, 1], y, pl, W - pr, pct0);
      b += S.line(pl, y(0.9), W - pr, y(0.9), 's-up w1 dash2') + S.text(W - pr - 2, y(0.9) - 4, '90% line', 'xs up', 'end');
      b += xAxis([2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6], x, H - pb, (v) => F.num(v, 1) + '%');
      // research marks on top, staggered into two rows when they would touch
      const marks = REFS.map((r) => ({ r, cx: r.a != null ? x(r.b) + 11 : x(r.r) })).sort((a, b) => a.cx - b.cx);
      let lastX = -99;
      marks.forEach((m) => { m.row = m.cx - lastX < 17 ? 1 : 0; if (m.row === 0) lastX = m.cx; });
      marks.forEach((m) => {
        const r = m.r, my = pt - 14 - m.row * 17;
        if (r.a != null) b += S.rect(x(r.a), pt - 8, x(r.b) - x(r.a), 6, 'f-vio o50', 2) + S.line(x(r.a), pt - 2, x(r.a), H - pb, 's-vio w1 dash2') + S.line(x(r.b), pt - 2, x(r.b), H - pb, 's-vio w1 dash2');
        else b += S.line(x(r.r), my + 7, x(r.r), H - pb, 's-vio w1 dash2');
        b += S.circle(m.cx, my, 7, 'f-vio-t s-vio w1') + S.text(m.cx, my + 3.5, r.n, 'xs b ink', 'middle');
      });
      const pts = curve.pts.map((p) => [x(p[0]), y(p[1])]);
      b += S.area(pts, H - pb, 'f-acc-t') + S.poly(pts, 's-acc w25');
      const cx = x(I.rate * 100), cy = y(res.succ);
      b += S.line(cx, cy, cx, H - pb, 's-acc w15 dash');
      const lbl = F.num(I.rate * 100, 1) + '% → ' + pct0(res.succ);
      const lx = Math.min(W - pr - 4, Math.max(pl + 4, cx + (cx > W - 150 ? -12 : 12)));
      b += S.text(lx, Math.max(pt + 12, cy - 12), lbl, 'sm b ink', cx > W - 150 ? 'end' : 'start');
      b += S.rect(pl, pt, W - pr - pl, H - pb - pt, 'hit');
      b += S.circle(cx, cy, 8, 'handle');
      if (!narrow) b += S.text(W - pr, H - 4, 'drag the dot', 'xs mut', 'end');
      f2.innerHTML = S.wrap(W, H, `Success rate falls as the withdrawal rate rises; at ${F.num(I.rate * 100, 1)}% about ${pct0(res.succ)} of futures last ${I.years} years`, b);
    }
    function readouts() {
      const sp = I.rate * I.start, endMed = q[2][res.Yp - 1] * I.start, end10 = q[0][res.Yp - 1] * I.start, s = res.succ;
      sv(id + '-ss', pct0(s), s >= 0.9 ? 'up' : s >= 0.75 ? 'acc' : 'dn');
      sv(id + '-sp', k$(sp) + ' / yr');
      sv(id + '-sm', k$(endMed));
      sv(id + '-sw', end10 > 0 ? k$(end10) : '$0', end10 > 0 ? '' : 'dn');
      sv(id + '-sf', res.fails.length ? 'year ' + Math.round(median(res.fails)) : 'none', res.fails.length ? 'dn' : 'up');
      const fails = MC.n - Math.round(s * MC.n);
      let m;
      if (s >= 0.95) m = ui.msg('up', 'Very likely', `${pct0(s)} of the 1,000 futures still had money after ${I.years} years. Spending ${k$(sp)} a year from ${k$(I.start)} looks sturdy, and in the median future you end with ${k$(endMed)}.`);
      else if (s >= 0.85) m = ui.msg('acc', 'Usually lasts', `${fails} of 1,000 futures ran out, mostly after a bad first decade. A little flexibility (spending less after bad years) closes most of that gap. See the guardrails lesson.`);
      else if (s >= 0.7) m = ui.msg('acc', 'Risky', `About ${Math.round((1 - s) * 10)} in 10 futures ran out before year ${I.years}. Lower the rate, plan part-time income, or use guardrails.`);
      else m = ui.msg('dn', 'Likely to fail', `Only ${pct0(s)} of futures lasted ${I.years} years. At ${F.num(I.rate * 100, 1)}% you would need a lot of luck or big spending cuts.`);
      $id(id + '-m').innerHTML = m;
    }
    let lastW1 = 600, lastW2 = 600;
    const d1 = ui.responsive(f1, (W) => { lastW1 = W; if (!res) compute(); drawFan(W); });
    const d2 = ui.responsive(f2, (W) => { lastW2 = W; if (!res) compute(); drawCurve(W); });
    function update() { compute(); drawFan(lastW1); drawCurve(lastW2); readouts(); }
    ui.drag(f2, {
      sel: '.handle,.hit',
      start: (p) => setRate(p.x),
      move: (p) => setRate(p.x),
    });
    function setRate(px) { if (!x2) return; const v = Math.round(SML.clamp(x2.inv(px), 2.5, 6) * 10) / 10; if (Math.abs(v - st.n(id + '-r')) < 0.001) return; st.set(id + '-r', v); update(); }
    $id(id + '-new').addEventListener('click', () => { seed = (seed * 7 + 13) % 2147483647; update(); SML.toast('1,000 new futures'); });
    $id(id + '-reset').addEventListener('click', () => { seed = 20261021; st.set(id + '-r', 4); st.set(id + '-w', 60); st.set(id + '-f', 0.1); st.set(id + '-p', 1000000); st.setSeg(id + '-y', 40); update(); });
    update();
    void d1; void d2;
  };

  /* =====================================================================
     2. sequenceDemo: same returns, different order
     ===================================================================== */
  const SEQ = [-0.26, -0.14, -0.09, 0.04, 0.11, 0.07, 0.15, 0.09, 0.02, 0.12, 0.08, -0.04, 0.10, 0.06, 0.19, 0.05, 0.03, 0.13, -0.06, 0.09, 0.07, 0.14, 0.01, 0.10, 0.08, 0.12, -0.02, 0.06, 0.16, 0.09];
  function runSeq(rs, w, start) {
    let b = start, out = 0; const bs = [b];
    for (let y = 0; y < rs.length; y++) {
      if (!out) { b -= w; if (b <= 0) { b = 0; out = y + 1; } else b *= 1 + rs[y]; }
      bs.push(b);
    }
    return { bs, end: b, out };
  }
  SML.widgets.sequenceDemo = function (root) {
    const id = SML.uid('sq');
    const start = 1000000;
    let order = SEQ.map((_, i) => i);
    const rngS = SML.rng(77);
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Same 30 returns, two orders</span>${ui.seg(id + '-wd', [{ v: 'on', label: 'Withdrawing' }, { v: 'off', label: 'No withdrawals' }], 'on', 'Withdrawals on or off')}</div>
      <div class="wg-fig">
        <div class="fsw-legend" aria-hidden="true"><span><i class="ln" style="border-color:var(--accent)"></i>Your order</span><span><i class="ln" style="border-color:var(--info)"></i>Same returns reversed</span><span><i style="background:var(--down)"></i>Out of money</span></div>
        <div class="fsw-f1"></div>
        <p class="fsw-sub">Yearly returns in your order (drag a bar to move that year)</p>
        <div class="fsw-f2"></div>
      </div>
      <div class="wg-actions">
        <button type="button" class="btn btn-g fsw-btn" data-a="first">Bad years first</button>
        <button type="button" class="btn btn-g fsw-btn" data-a="last">Bad years last</button>
        <button type="button" class="btn btn-g fsw-btn" data-a="shuffle">Shuffle</button>
        <button type="button" class="btn btn-g fsw-btn" data-a="flip">Flip the order</button>
      </div>
      <div class="wg-ctrl fsw-ctrl">${ui.slider({ id: id + '-r', label: 'Yearly withdrawal (of $1M)', min: 3, max: 6, step: 0.5, value: 4.5, fmt: 'pct1' })}</div>
      <div class="wg-read">${ui.stat('Average yearly return', id + '-sa')}${ui.stat('Your order ends with', id + '-se')}${ui.stat('Reversed ends with', id + '-sr')}${ui.stat('Gap from order alone', id + '-sg')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-note">Made-up returns after inflation, chosen to look like a rough 30 years: three bad years, some flat ones, many good ones. Withdrawals happen at the start of each year and stay the same in today’s dollars. Both lines use exactly the same 30 numbers, so the average is identical.</div>`;
    const f1 = root.querySelector('.fsw-f1'), f2 = root.querySelector('.fsw-f2');
    const st = ui.wire(root, () => update());
    let xb = null, n = SEQ.length, W1 = 600, W2 = 600;
    const rsOf = (o) => o.map((i) => SEQ[i]);
    function calc() {
      const on = st.seg(id + '-wd') !== 'off';
      const w = on ? (st.n(id + '-r') / 100) * start : 0;
      const a = runSeq(rsOf(order), w, start), b = runSeq(rsOf(order).reverse(), w, start);
      return { on, w, a, b };
    }
    function drawLines(W) {
      const c = calc(); const narrow = W < 480;
      const H = narrow ? 220 : 260, pl = narrow ? 46 : 56, pr = narrow ? 12 : 84, pt = 14, pb = 28;
      const top = Math.max(...c.a.bs, ...c.b.bs, start);
      const yMax = niceMax(top * 1.05);
      const x = SML.lin(0, n, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = yAxis(SML.ticks(0, yMax, narrow ? 3 : 4), y, pl, W - pr, k$);
      b += xAxis(SML.ticks(0, n, narrow ? 3 : 6), x, H - pb, (v) => (v === 0 ? 'start' : 'yr ' + v));
      b += S.line(pl, H - pb, W - pr, H - pb, 's-line');
      const pts = (bs) => bs.map((v, t) => [x(t), y(v)]);
      b += S.poly(pts(c.b.bs), 's-info w25') + S.poly(pts(c.a.bs), 's-acc w3');
      [[c.a, 'acc'], [c.b, 'info']].forEach(([r, col]) => {
        if (r.out) { b += S.circle(x(r.out), y(0), 6, 'f-dn') + S.text(Math.min(W - pr, Math.max(pl + 40, x(r.out))), y(0) - 12, 'out of money, yr ' + r.out, 'sm dn b', 'middle'); }
        else if (!narrow) b += S.text(W - pr + 6, y(r.end) + 4, k$(r.end), 'sm b ' + col);
      });
      if (!narrow && c.a.out === 0 && c.b.out === 0 && Math.abs(y(c.a.end) - y(c.b.end)) < 14) { /* labels may touch when equal */ }
      f1.innerHTML = S.wrap(W, H, `Portfolio balance for your order and the reversed order over ${n} years`, b);
    }
    function drawBars(W) {
      const narrow = W < 480;
      const H = narrow ? 120 : 140, pl = narrow ? 46 : 56, pr = narrow ? 12 : 84, pt = 16, pb = 22;
      const x = SML.lin(0, n, pl, W - pr); xb = x;
      const y = SML.lin(-0.3, 0.2, H - pb, pt);
      const bw = (x(1) - x(0)) * 0.72;
      let b = S.line(pl, y(0), W - pr, y(0), 's-line');
      b += S.text(pl - 6, y(0.2) + 4, '+20%', 'xs mono', 'end') + S.text(pl - 6, y(0) + 3.5, '0%', 'xs mono', 'end') + S.text(pl - 6, y(-0.3) + 3, F.minus + '30%', 'xs mono', 'end');
      order.forEach((si, t) => {
        const r = SEQ[si], cx = x(t + 0.5);
        const y0 = y(Math.max(0, r)), y1 = y(Math.min(0, r));
        b += S.rect(cx - bw / 2, y0, bw, Math.max(1.5, y1 - y0), (r >= 0 ? 'f-up' : 'f-dn') + (drag === t ? '' : ' o70'), 2);
        if (!narrow && (r <= -0.09 || bw > 22)) b += S.text(cx, r >= 0 ? y0 - 4 : y1 + 11, (r > 0 ? '+' : r < 0 ? F.minus : '') + Math.round(Math.abs(r) * 100), 'xs mono', 'middle');
        b += S.rect(cx - (x(1) - x(0)) / 2, pt - 6, x(1) - x(0), H - pb - pt + 12, 'hit fsw-grab', 0, ` data-t="${t}"`);
      });
      b += S.text(pl, H - 4, 'year 1', 'xs mut') + S.text(W - pr, H - 4, 'year ' + n, 'xs mut', 'end');
      f2.innerHTML = S.wrap(W, H, 'Bar chart of the 30 yearly returns in your chosen order; drag a bar to move it', b);
    }
    let drag = -1;
    ui.drag(f2, {
      sel: '.fsw-grab',
      start: (p, t) => { drag = Number(t.dataset.t); drawBars(W2); },
      move: (p) => {
        if (drag < 0 || !xb) return;
        const j = SML.clamp(Math.floor(xb.inv(p.x)), 0, n - 1);
        if (j !== drag) { const v = order.splice(drag, 1)[0]; order.splice(j, 0, v); drag = j; update(); }
      },
      end: () => { drag = -1; drawBars(W2); },
    });
    function readouts() {
      const c = calc();
      const ar = SEQ.reduce((s, r) => s + r, 0) / n;
      sv(id + '-sa', F.num(ar * 100, 1) + '% (both)');
      sv(id + '-se', c.a.out ? 'ran out, yr ' + c.a.out : k$(c.a.end), c.a.out ? 'dn' : 'up');
      sv(id + '-sr', c.b.out ? 'ran out, yr ' + c.b.out : k$(c.b.end), c.b.out ? 'dn' : 'up');
      sv(id + '-sg', k$(Math.abs(c.a.end - c.b.end)));
      let m;
      if (!c.on) m = ui.msg('info', 'No withdrawals', `Both orders end at exactly ${k$(c.a.end)}. Multiplying the same returns in any order gives the same answer. Order only matters once you take money out.`);
      else if (c.a.out && !c.b.out) m = ui.msg('dn', 'Bad luck early', `Taking ${k$(c.w)} a year while the market is down sells shares at low prices, and they are not there for the recovery. Your order runs out in year ${c.a.out}; the reversed order ends with ${k$(c.b.end)}.`);
      else if (!c.a.out && c.b.out) m = ui.msg('up', 'Good luck early', `Strong early years built a cushion, so your order ends with ${k$(c.a.end)}. Reversed, the same returns run out in year ${c.b.out}.`);
      else if (c.a.out && c.b.out) m = ui.msg('dn', 'Too much spending', `At ${k$(c.w)} a year both orders run out (years ${c.a.out} and ${c.b.out}). Lower the withdrawal to see order take over.`);
      else m = ui.msg(c.a.end >= c.b.end ? 'up' : 'acc', 'Same average', `Both last 30 years, but the endings differ by ${k$(Math.abs(c.a.end - c.b.end))} only because of the order of the same returns.`);
      $id(id + '-m').innerHTML = m;
    }
    ui.responsive(f1, (W) => { W1 = W; drawLines(W); });
    ui.responsive(f2, (W) => { W2 = W; drawBars(W); });
    function update() { drawLines(W1); drawBars(W2); readouts(); }
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'first') order = SEQ.map((_, i) => i);
      else if (a === 'last') order = SEQ.map((_, i) => i).reverse();
      else if (a === 'flip') order = order.slice().reverse();
      else { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rngS() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; } }
      update();
    });
    update();
  };

  /* =====================================================================
     3. guardrailsSim: fixed vs guardrails vs variable percentage
     ===================================================================== */
  const PATHS = {
    rough: [-0.18, -0.12, -0.08, 0.06, 0.03, -0.04, 0.08, 0.02, 0.05, -0.02, 0.10, 0.07, 0.12, 0.09, 0.04, 0.11, 0.06, 0.08, 0.13, 0.05, 0.09, 0.03, 0.10, 0.07, 0.06, 0.12, 0.04, 0.08, 0.05, 0.09],
    average: [0.07, -0.03, 0.09, 0.05, 0.12, -0.08, 0.06, 0.10, 0.03, 0.08, -0.05, 0.11, 0.07, 0.04, 0.09, 0.02, 0.13, -0.06, 0.08, 0.06, 0.10, 0.04, -0.02, 0.09, 0.07, 0.05, 0.11, 0.03, 0.08, 0.06],
  };
  PATHS.lucky = PATHS.rough.slice().reverse();
  const VPW_R = 0.04;
  function simStrat(kind, rs, o) {
    const start = 1000000; let b = start, out = 0;
    let target = kind === 'fixed' ? o.fixed * start : o.g * start;
    const spend = [], bal = [b], ev = [];
    for (let y = 0; y < rs.length; y++) {
      const inc = o.inc(y);
      let w;
      if (kind === 'vpw') {
        const nLeft = rs.length - y; const p = VPW_R / ((1 + VPW_R) * (1 - Math.pow(1 + VPW_R, -nLeft)));
        w = b * p; spend.push(w + inc);
      } else {
        if (kind === 'guard' && y > 0 && b > 0) {
          const cur = target / b;
          if (cur > o.g * (1 + o.band) && rs.length - y > 15) { target *= 1 - o.step; ev.push({ y, t: 'cut' }); }
          else if (cur < o.g * (1 - o.band)) { target *= 1 + o.step; ev.push({ y, t: 'raise' }); }
        }
        w = Math.max(0, target - inc);
        if (w >= b) { w = b; if (!out && target - inc > 0) out = y + 1; }
        spend.push(b > 0 || inc > 0 ? Math.min(target, w + inc) : 0);
      }
      b = Math.max(0, b - w) * (1 + rs[y]);
      bal.push(b);
    }
    const lo = Math.min(...spend), avg = spend.reduce((s, v) => s + v, 0) / spend.length;
    return { spend, bal, ev, out, lo, avg, first: spend[0], end: b };
  }
  SML.widgets.guardrailsSim = function (root) {
    const id = SML.uid('gr');
    const COLS = { fixed: { label: 'Fixed', cls: 'ink', css: 'var(--ink)' }, guard: { label: 'Guardrails', cls: 'acc', css: 'var(--accent)' }, vpw: { label: 'Variable %', cls: 'vio', css: 'var(--violet)' } };
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Three ways to spend $1M</span>${ui.seg(id + '-p', [{ v: 'rough', label: 'Rough start' }, { v: 'average', label: 'Average' }, { v: 'lucky', label: 'Lucky start' }], 'rough', 'Market path')}</div>
      <div class="wg-fig">
        <div style="padding:10px 16px 0">${ui.chips(id + '-v', Object.keys(COLS).map((k) => ({ k, label: COLS[k].label, color: COLS[k].css, on: true })))}</div>
        <div class="fsw-f1"></div>
      </div>
      <div class="fsw-tblw"><table class="fsw-tbl"><thead><tr><th>Strategy</th><th>Year 1</th><th>Lowest</th><th class="hide-s">Average</th><th>End</th></tr></thead><tbody id="${id}-tb"></tbody></table></div>
      <div class="wg-ctrl fsw-ctrl">
        ${ui.slider({ id: id + '-fx', label: 'Fixed: withdrawal rate', min: 3, max: 6, step: 0.1, value: 4, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-g', label: 'Guardrails: starting rate', min: 3, max: 6.5, step: 0.1, value: 5, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-b', label: 'Guardrail width', min: 10, max: 30, step: 5, value: 20, fmt: (v) => '±' + v + '%' })}
        ${ui.slider({ id: id + '-s', label: 'Size of each cut or raise', min: 5, max: 15, step: 5, value: 10, fmt: 'pct' })}
        <div class="fsw-row"><span class="lab">Part-time income</span>${ui.seg(id + '-i', [{ v: 0, label: 'None' }, { v: 1, label: '$15K for 5 years' }, { v: 2, label: '$20K for 10 years' }], 0, 'Part-time income in early retirement')}</div>
      </div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-note">Per $1M saved, in today’s dollars, with made-up yearly returns for a 60/40 portfolio. Guardrails follow the Guyton-Klinger idea, simplified: if spending grows past the upper rail as a share of the portfolio, cut it; if it falls below the lower rail, give yourself a raise; no cuts in the last 15 years. Variable % works like the Bogleheads VPW method: spend a share of whatever is left, a share that rises as the years run out (here assuming a 4% return after inflation over 30 years), so it ends at zero by design. Part-time income is spent first and the portfolio covers the rest.</div>`;
    const fig = root.querySelector('.fsw-f1');
    const st = ui.wire(root, () => update());
    let W0 = 600;
    function calc() {
      const rs = PATHS[st.seg(id + '-p')] || PATHS.rough;
      const im = Number(st.seg(id + '-i')) || 0;
      const o = { fixed: st.n(id + '-fx') / 100, g: st.n(id + '-g') / 100, band: st.n(id + '-b') / 100, step: st.n(id + '-s') / 100, inc: (y) => (im === 1 ? (y < 5 ? 15000 : 0) : im === 2 ? (y < 10 ? 20000 : 0) : 0) };
      return { rs, o, res: { fixed: simStrat('fixed', rs, o), guard: simStrat('guard', rs, o), vpw: simStrat('vpw', rs, o) } };
    }
    function draw(W) {
      W0 = W; const c = calc(); const narrow = W < 480;
      const on = Object.keys(COLS).filter((k) => st.on(id + '-v', k));
      const n = c.rs.length, pl = narrow ? 46 : 56, pr = 14, h1 = narrow ? 150 : 180, h2 = narrow ? 140 : 170, gap = 46, pt = 30, rb = 26;
      const H = pt + h1 + gap + h2 + rb;
      const x = SML.lin(0, n, pl, W - pr);
      const ks = on.length ? on : Object.keys(COLS);
      const sMax = niceMax(Math.max(...ks.map((k) => Math.max(...c.res[k].spend))) * 1.08);
      const bMax = niceMax(Math.max(...ks.map((k) => Math.max(...c.res[k].bal))) * 1.05);
      const ys = SML.lin(0, sMax, pt + h1, pt), yb = SML.lin(0, bMax, pt + h1 + gap + h2, pt + h1 + gap);
      let b = S.text(pl, pt - 8, 'Spending each year', 'sm b ink');
      b += yAxis(SML.ticks(0, sMax, 3), ys, pl, W - pr, k$);
      b += S.line(pl, pt + h1, W - pr, pt + h1, 's-line');
      b += S.text(pl, pt + h1 + gap - 8, 'Portfolio left', 'sm b ink');
      b += yAxis(SML.ticks(0, bMax, 3), yb, pl, W - pr, k$);
      b += xAxis(SML.ticks(0, n, narrow ? 3 : 6), x, pt + h1 + gap + h2, (v) => (v === 0 ? 'start' : 'yr ' + v));
      b += S.line(pl, pt + h1 + gap + h2, W - pr, pt + h1 + gap + h2, 's-line');
      // shade the market's down years on the spending panel
      c.rs.forEach((r, t) => { if (r < 0) b += S.rect(x(t), pt, x(t + 1) - x(t), h1, 'f-dn-t', 0, ' opacity=".55"'); });
      on.forEach((k) => {
        const R = c.res[k], col = COLS[k].cls;
        const sp = R.spend.map((v, t) => [x(t + 0.5), ys(v)]);
        b += S.poly(sp, `s-${col} ${k === 'guard' ? 'w3' : 'w25'}`);
        b += S.poly(R.bal.map((v, t) => [x(t), yb(v)]), `s-${col} ${k === 'guard' ? 'w3' : 'w25'}`);
        if (k === 'guard') R.ev.forEach((e) => { const cx = x(e.y + 0.5), cy = ys(R.spend[e.y]); b += e.t === 'cut' ? S.polygon([[cx - 5, cy - 11], [cx + 5, cy - 11], [cx, cy - 4]], 'f-dn') : S.polygon([[cx - 5, cy + 11], [cx + 5, cy + 11], [cx, cy + 4]], 'f-up'); });
        if (R.out) b += S.circle(x(R.out), yb(0), 6, 'f-dn') + S.text(Math.max(pl + 50, Math.min(W - pr - 50, x(R.out))), yb(0) - 10, COLS[k].label + ' runs out, yr ' + R.out, 'sm dn b', 'middle');
      });
      if (!narrow) b += S.text(W - pr, pt - 8, 'red bands: down years · ▼ cut · ▲ raise', 'xs mut', 'end');
      fig.innerHTML = S.wrap(W, H, 'Spending and portfolio balance each year for fixed, guardrails and variable-percentage withdrawals', b);
      // table + coach
      $id(id + '-tb').innerHTML = Object.keys(COLS).map((k) => { const R = c.res[k]; return `<tr><td><i class="sw" style="background:${COLS[k].css}"></i>${COLS[k].label}</td><td>${k$(R.first)}</td><td class="${R.lo < R.first * 0.8 ? 'dn' : ''}">${k$(R.lo)}</td><td class="hide-s">${k$(R.avg)}</td><td class="${R.out ? 'dn' : ''}">${R.out ? 'out, yr ' + R.out : k === 'vpw' && R.end < 1000 ? 'spent' : k$(R.end)}</td></tr>`; }).join('');
      const f = c.res.fixed, g = c.res.guard, v = c.res.vpw;
      const cuts = g.ev.filter((e) => e.t === 'cut').length, raises = g.ev.length - cuts;
      let m;
      if (f.out && !g.out) m = ui.msg('acc', 'Flexibility wins', `Fixed spending of ${k$(f.first)} a year runs out in year ${f.out}. Guardrails started higher at ${k$(g.first)}, cut ${cuts} time${cuts === 1 ? '' : 's'} in the bad years (lowest ${k$(g.lo)}) and still has ${k$(g.end)} after 30 years.`);
      else if (f.out && g.out) m = ui.msg('dn', 'Too much spending', `Both fixed and guardrails run out on this path. Lower the rates or add part-time income. Variable % never runs out, but its lowest year is ${k$(v.lo)}.`);
      else if (!f.out && g.out) m = ui.msg('dn', 'Rails too loose', `Guardrails ran out in year ${g.out}: the start rate is too high or the cuts too small for this path.`);
      else m = ui.msg('up', 'All three last', `Fixed ends with ${k$(f.end)}. Guardrails cut ${cuts} and raised ${raises} time${raises === 1 ? '' : 's'}, averaging ${k$(g.avg)} a year. Variable % averaged ${k$(v.avg)} but swung from ${k$(v.lo)} to ${k$(Math.max(...v.spend))}.`);
      $id(id + '-m').innerHTML = m;
    }
    ui.responsive(fig, draw);
    function update() { draw(W0); }
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    bengen: { t: 'Advisor Perspectives: Bill Bengen boosts the 4% rule to 4.7% (Aug 2025)', u: 'https://www.advisorperspectives.com/articles/2025/08/29/bill-bengen-boosts-the-4-rule-to-4-7' },
    ern1: { t: 'Early Retirement Now: The ultimate guide to safe withdrawal rates, part 1', u: 'https://earlyretirementnow.com/2016/12/07/the-ultimate-guide-to-safe-withdrawal-rates-part-1-intro/' },
    ern60: { t: 'Early Retirement Now: Does a 4% withdrawal rate survive a 60-year retirement?', u: 'https://earlyretirementnow.com/2019/06/26/does-a-4-percent-withdrawal-rate-survive-a-60-year-retirement/' },
    mstar: { t: 'Morningstar: What’s a safe retirement withdrawal rate for 2026?', u: 'https://www.morningstar.com/retirement/whats-safe-retirement-withdrawal-rate-2026' },
    schwab: { t: 'Schwab: Timing matters, understanding sequence-of-returns risk', u: 'https://www.schwab.com/learn/story/timing-matters-understanding-sequence-returns-risk' },
    wci: { t: 'White Coat Investor: The Guyton-Klinger guardrails approach', u: 'https://www.whitecoatinvestor.com/guyton-klinger-guardrails-approach-for-retirement/' },
    kitces: { t: 'Kitces: Implementing retirement income guardrails', u: 'https://www.kitces.com/blog/implementing-retirement-income-guardrails-to-facilitate-the-right-spending-raises-and-spending-cuts/' },
    vpw: { t: 'Bogleheads wiki: Variable percentage withdrawal', u: 'https://www.bogleheads.org/wiki/Variable_percentage_withdrawal' },
  };

  SML.lessons.push({
    id: 'l-swr', course: 'fi-plan', order: 1, title: 'The 4% rule and its limits', mins: 8, level: 'Intermediate',
    summary: 'Where the 4% rule comes from, and why early retirees often use less.',
    idea: 'Spending 4% in year one, raised with inflation, survived 30 years in US history. Longer retirements need a little less.',
    widget: 'swrSim',
    try: 'Pick how many years your money must last, then drag the dot on the lower chart and watch the success rate change.',
    body: [
      '<h3>Where 4% comes from</h3><p>In 1994 a financial planner named Bill Bengen tested every 30-year retirement in US history since 1926. He asked: what is the most you could withdraw in year one, then raise with inflation every year, without running out? For a mix of 60% US stocks and 40% Treasury bonds, the worst period still allowed about <b>4.15%</b>. That got rounded to the <b>4% rule</b>. In 1998 three professors at Trinity University ran a similar test (the <b>Trinity study</b>) and found 3% to 4% held up well for stock-heavy portfolios.</p>',
      '<p>Read the rule carefully. You withdraw 4% of your savings in the <i>first</i> year only. After that you take the same dollars plus inflation, whatever the market does. With $1M you take $40,000 in year one; if prices rise 3%, you take $41,200 in year two.</p>',
      '<h3>What “safe” means</h3><ul><li><b>Success</b> means money was left at the end of the period. It says nothing about how much.</li><li>The rule is built on the <b>worst</b> historical stretch. In most periods retirees following it ended with more than they started with.</li><li>Bengen’s research assumed tax-deferred accounts. Taxes, fund fees and advice fees come out of the same 4%, so count them in your spending.</li><li>Bengen calls inflation retirees’ greatest enemy: high inflation early in retirement and expensive stock markets both lower the safe rate.</li></ul>',
      '<h3>Why early retirees use less</h3><p>A 40-year-old may need money for 50 or 60 years. The research blog <b>Early Retirement Now</b> found that 4% with a 50/50 mix succeeded about 95% of the time over 30 years, but only about <b>65%</b> of the time over 60 years. Its summary for 40 to 60 year retirements: about <b>3.25% to 3.5%</b>. Looking forward instead of back, <b>Morningstar</b> puts the safe starting rate for 2026 at <b>3.9%</b> for 30 years with 30% to 50% in stocks. Bengen himself raised his figure to <b>4.7%</b> in a 2025 book by adding small-company and international stocks.</p>',
      '<h3>Turn a rate into your number</h3><ul><li>4% = 25 times your yearly spending</li><li>3.5% = 28.6 times</li><li>3.25% = 30.8 times</li><li>3% = 33.3 times</li></ul><p>For $60,000 a year that is $1.5M, $1.71M, $1.85M or $2M. Build yours in <a href="#l-fire-number">Your FIRE number</a>.</p>',
      '<h3>Ways to safely spend more</h3><p>The rates above assume you never change your spending. Real people do. Morningstar finds flexible methods can support starting rates approaching 6% if your spending can move with markets. Other levers: a few years of part-time income, a later and bigger Social Security check, and low fees. See <a href="#l-sequence">sequence risk</a> and <a href="#l-guardrails">guardrails</a> next.</p>',
    ],
    example: {
      title: 'A 50-year plan for $60,000 a year',
      intro: 'A couple aged 45 spends $60,000 a year and wants the money to last to 95.',
      steps: [
        'They need 50 years of withdrawals, not the 30 years the 4% rule was built for.',
        'At 4% they would need $60,000 × 25 = <b>$1.5M</b>. Over 60-year periods, 4% held up only about 65% of the time in Early Retirement Now’s tests.',
        'At 3.5% they need $60,000 ÷ 0.035 = <b>$1.71M</b> (28.6 times). At 3.25%, $60,000 ÷ 0.0325 = <b>$1.85M</b> (30.8 times).',
        'They pick 3.5%. Year one they withdraw $60,000. Inflation runs 3%, so year two they withdraw $61,800, whatever the market did.',
        'They also agree to trim travel after a bad year, which gives them a cushion if the first decade goes badly.',
      ],
      result: 'Planning at 3.5% means saving about $214,000 more than the 4% rule, in exchange for a plan that held up in most 60-year periods. Starting at 3.25% held up in about 97% of them.',
    },
    mistakes: [
      'Reading the rule as 4% of each year’s balance. That is a different method, and its spending swings up and down with the market.',
      'Using a 30-year rule for a 50- or 60-year retirement without lowering the rate or adding flexibility.',
      'Leaving taxes, fund fees and health insurance out of the spending number the rate is applied to.',
      'Treating 90% success as a guarantee, or a failed path as going broke overnight. Failing paths show warning signs for years, and you can react.',
    ],
    points: [
      'The 4% rule: withdraw 4% in year one, then raise that dollar amount with inflation.',
      'It survived the worst 30-year period in Bengen’s US data; it is a floor from history, not a forecast.',
      'For 40 to 60 years, research points to roughly 3.25% to 3.5%, or about 29 to 31 times spending. Even that held up in most long periods, not all.',
      'Flexible spending, part-time income and low fees let you safely spend more.',
    ],
    terms: ['4% rule', 'Safe withdrawal rate', 'Withdrawal rate', 'Real return', 'Inflation', 'Asset allocation'],
    glossary: [
      { t: 'Monte Carlo simulation', d: 'Running thousands of random “what if” futures to see how often a plan works.' },
      { t: 'Success rate', d: 'The share of past periods or simulated futures in which the money lasted the whole time.' },
      { t: 'Trinity study', d: 'A 1998 study by three Trinity University professors that tested withdrawal rates on historical US returns.' },
    ],
    quiz: {
      q: 'Under the 4% rule, a retiree with $1M withdraws $40,000 in year one. Inflation is 3%. What do they withdraw in year two?',
      options: ['4% of whatever the balance is now', '$41,200: the same spending raised for inflation', '$40,000 again, whatever happens'],
      answer: 1,
      why: 'The rule sets a dollar amount in year one and raises it with inflation each year, whatever the market does.',
    },
    sources: [SRC.bengen, SRC.ern1, SRC.ern60, SRC.mstar],
  });

  SML.lessons.push({
    id: 'l-sequence', course: 'fi-plan', order: 2, title: 'Sequence of returns risk', mins: 7, level: 'Intermediate',
    summary: 'Why bad years at the start of retirement hurt far more than the same years later.',
    idea: 'Once you are withdrawing, the same returns in a different order can mean money for life or running out.',
    widget: 'sequenceDemo',
    try: 'Press Flip the order, or drag a red bar to a later year, and watch two retirements with the same average return split apart.',
    body: [
      '<h3>Order only matters when money moves</h3><p>Without withdrawals, the order of returns does not matter: a 20% loss then a 25% gain ends in the same place as the gain then the loss. Switch the widget to <i>No withdrawals</i> and both lines finish together.</p><p>Withdrawals change that. When you sell shares to pay for groceries during a crash, you sell more shares at low prices. Those shares are not there when the market recovers. A temporary drop becomes a permanent hole. That is <b>sequence of returns risk</b>.</p>',
      '<h3>The danger zone</h3><p>The first five to ten years of retirement matter most, because the portfolio is at its biggest and has the longest time left to fund. Schwab’s example: after early losses, a portfolio paying out 2% a year needed about 11.5 years to recover, while one paying out 4% needed about 28.</p>',
      '<h3>How to defend yourself</h3><ul><li><b>A cash and bond buffer.</b> Schwab suggests about a year of spending (after Social Security or other income) in cash, plus two to four years in short-term high-quality bonds, so you do not have to sell stocks in a downturn. This is the <b>bucket strategy</b>.</li><li><b>Flexible spending.</b> Cut the extras after a bad year. See <a href="#l-guardrails">guardrails</a>.</li><li><b>Part-time income early on.</b> Even a small income in the first years means smaller withdrawals when they hurt most.</li><li><b>A lower starting rate.</b> See <a href="#l-swr">the 4% rule and its limits</a>.</li><li><b>Rebalance.</b> Selling bonds to buy stocks after a crash keeps your mix steady and spends the safer money first.</li></ul>',
      '<h3>Watch the right number</h3><p>A bad year is not failure. Track your current withdrawal rate: this year’s spending divided by today’s balance. If it climbs well above where you started, it is time to act, years before the money is in danger. Stress-test your own plan in <a href="#l-fire-whatif">What if?</a>.</p>',
    ],
    example: {
      title: 'Same returns, six years apart',
      intro: 'Two retirees each start with $1M and withdraw $50,000 in year one, raising it 2% a year. Every year earns +6% except two years that lose 15%.',
      steps: [
        'Alex gets the two bad years first. Year 1: $1,000,000 − $50,000 = $950,000, then × 0.85 = <b>$807,500</b>.',
        'Year 2: $807,500 − $51,000 = $756,500, then × 0.85 = <b>$643,025</b>. A third of the money is gone in two years.',
        'Blair earns +6% in those years: $1,007,000 after year 1 and about $1.03M by year 9. The same two −15% years arrive in years 10 and 11, leaving <b>$652,386</b>.',
        'After 18 years Alex has about <b>$24,000</b> left and runs out in year 19. Blair still has about <b>$396,000</b> and lasts until year 25.',
      ],
      result: 'Same returns, same spending, same average. Only the order changed, and it cost Alex six years of income.',
    },
    mistakes: [
      'Judging a retirement plan only by its average return.',
      'Having no cash or short-term bond buffer, so a crash forces you to sell stocks at low prices to pay the bills.',
      'Keeping spending fixed through a deep drop in the first years of retirement.',
      'Panicking after one bad year instead of checking your current withdrawal rate against your plan.',
    ],
    points: [
      'With no withdrawals, the order of returns does not matter. With withdrawals, it matters a lot.',
      'The first five to ten years of retirement carry the most risk.',
      'A cash and bond buffer, flexible spending and early part-time income are the main defenses.',
      'Track this year’s spending as a share of today’s balance to spot trouble early.',
    ],
    terms: ['Sequence of returns risk', 'Withdrawal rate', 'Bucket strategy', 'Drawdown', 'Rebalancing'],
    glossary: [
      { t: 'Current withdrawal rate', d: 'This year’s spending from the portfolio divided by its balance today.' },
    ],
    quiz: {
      q: 'Two retirees get exactly the same yearly returns in a different order and withdraw the same amounts. Why can one run out of money?',
      options: ['Their average returns are different', 'Early losses force them to sell more shares at low prices, leaving less to recover', 'Taxes are always higher for the one who runs out'],
      answer: 1,
      why: 'The averages are identical. Withdrawing during early losses sells shares cheaply, so less money is left to benefit from the recovery.',
    },
    sources: [SRC.schwab, SRC.ern1],
  });

  SML.lessons.push({
    id: 'l-guardrails', course: 'fi-plan', order: 3, title: 'Flexible spending with guardrails', mins: 8, level: 'Intermediate',
    summary: 'Spend a bit more in good years and cut a little in bad ones so the money lasts.',
    idea: 'A plan that can bend rarely breaks: small, rule-based cuts after bad years let you start higher and still last.',
    widget: 'guardrailsSim',
    try: 'Switch between Rough start, Average and Lucky start, then add part-time income and see how each spending method copes.',
    body: [
      '<h3>Fixed spending is rigid</h3><p>The 4% rule assumes you never change your spending, even in a crash. Real people trim travel or delay a new car when markets fall. Building that flexibility into written rules lets you start with a higher withdrawal and still sleep at night.</p>',
      '<h3>Guyton-Klinger guardrails</h3><p>Planners Jonathan Guyton and William Klinger published the best-known rules in 2006:</p><ul><li><b>Start</b> around 5.2% to 5.6% with at least 65% in stocks, using all the rules.</li><li><b>Capital preservation:</b> if your current withdrawal rate rises more than 20% above where you started, cut spending by 10%.</li><li><b>Prosperity:</b> if it falls more than 20% below where you started, give yourself a 10% raise.</li><li>The cut rule stops applying in the last 15 years of the plan.</li></ul><p>Start at 5% on $1M ($50,000) and the rails sit at 6% and 4%. If the portfolio falls to $800,000, $50,000 is now 6.25%, so spending drops to $45,000.</p>',
      '<h3>Variable percentage withdrawal</h3><p>The Bogleheads <b>VPW</b> method withdraws a percentage of whatever you have each year, and the percentage rises with age. For a 60/40 mix their table starts at about 4.1% at age 40, 4.3% at 50, 4.7% at 60 and 5.0% at 65. You can never run out early, but your spending moves with the market, so plan a floor for the essentials. Bogleheads suggests considering an income annuity around age 80.</p>',
      '<h3>How much can flexibility buy?</h3><p>Morningstar finds that flexible methods (guardrails, a constant percentage, endowment-style rules) can support starting rates approaching 6%, if your spending can really move. The price is variable income: the widget shows guardrails cutting deeply on a rough path.</p>',
      '<h3>Make your spending bendable</h3><ul><li>Split spending into needs (housing, food, insurance) and wants (travel, gifts, upgrades). Only wants should flex.</li><li>Keep a few years of part-time or <a href="#l-coast-fire">Barista FIRE</a> income as a buffer for a bad start.</li><li>Delay big one-off purchases after a down year.</li><li>Write the rules down before you retire, so the cut is a plan, not a panic.</li></ul>',
      '<h3>One-more-year syndrome</h3><p>Many people hit their number and keep working “just one more year”, then another, out of fear of a crash. Each extra year buys a little safety and costs a year of freedom. Flexible rules, a cash buffer and part-time income are cheaper insurance than years of your life. Set a date and test it in <a href="#l-fire-planner">Your full FIRE plan</a>.</p>',
    ],
    example: {
      title: 'Guardrails through a bear market',
      intro: 'A retiree starts with $1M and follows Guyton-Klinger-style rails of ±20%.',
      steps: [
        'Start at 5%: <b>$50,000</b> in year one. Upper rail: 5% × 1.2 = 6%. Lower rail: 5% × 0.8 = 4%.',
        'A bear market drops the portfolio to $800,000. $50,000 ÷ $800,000 = <b>6.25%</b>, above the 6% rail.',
        'Cut spending 10%: $50,000 × 0.9 = <b>$45,000</b>. New rate: $45,000 ÷ $800,000 = 5.6%, back inside the rails.',
        'Years later the portfolio reaches $1,200,000. $45,000 ÷ $1.2M = 3.75%, below the 4% rail, so spending rises 10% to <b>$49,500</b>.',
        'In the last 15 years of the plan the cut rule no longer applies, so spending only rises with good years.',
      ],
      result: 'One $5,000 cut during a bad stretch kept the plan on track, instead of locking in a much lower fixed rate for life.',
    },
    mistakes: [
      'Setting guardrails and then ignoring them when the cut arrives.',
      'Starting at a guardrail rate when almost all of your spending is essential and nothing can be cut.',
      'Mistaking VPW’s lower spending in bad years for failure, instead of planning a floor for the essentials.',
      'Working “one more year” again and again out of fear, instead of building a flexible plan.',
    ],
    points: [
      'Rules that cut spending a little after bad years let you start higher and still last.',
      'Guyton-Klinger: cut 10% if your rate rises 20% above the start, raise 10% if it falls 20% below.',
      'Variable percentage never runs out early, but your income moves with the market.',
      'Only flexible spending should flex: cover essentials with steady income or a buffer.',
      'Part-time income in the early years is one of the strongest protections there is.',
    ],
    terms: ['Guardrails', 'Withdrawal rate', 'Sequence of returns risk', 'Barista FIRE', '4% rule'],
    glossary: [
      { t: 'Variable percentage withdrawal', full: 'VPW', d: 'Withdrawing a set percentage of the current balance each year, with the percentage rising as you age.' },
      { t: 'Capital preservation rule', d: 'The Guyton-Klinger guardrail that cuts spending 10% when your withdrawal rate rises more than 20% above where it started.' },
      { t: 'One-more-year syndrome', d: 'Putting off retirement again and again, even after you have enough, out of fear.' },
    ],
    quiz: {
      q: 'You started at 5% ($50,000 of $1M) with ±20% guardrails. Your portfolio falls to $780,000. What does the rule say?',
      options: ['Nothing: stay at $50,000', 'Cut spending 10% to $45,000, because 6.4% is above the 6% rail', 'Stop withdrawals until the market recovers'],
      answer: 1,
      why: '$50,000 ÷ $780,000 = 6.4%, more than 20% above the 5% start, so the rule cuts spending by 10%.',
    },
    sources: [SRC.wci, SRC.kitces, SRC.vpw, SRC.mstar],
  });
})();
