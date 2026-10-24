/* Retirement & Wealth track, course `invest`: compound growth, index funds, allocation, extra money, kids' accounts. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setL = (x, t) => { const el = $id(x); if (el && el.previousElementSibling) el.previousElementSibling.textContent = t; };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 1 : 2) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e4 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const pctTxt = (f, d) => F.pct(f * 100, d == null ? 0 : d);
  const usd0 = (v) => F.usd(v, 0);
  const mfmt = (v) => (Math.abs(v) >= 1e6 ? (v < 0 ? F.minus : '') + '$' + (Math.abs(v) / 1e6).toFixed(2) + 'M' : kfmt(v));

  SML.css(`
.wiv-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.wiv-leg i{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-2px;margin-right:6px}
.wiv-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:0;background:var(--surface)}
.wiv-facts > div{padding:12px 16px;box-shadow:1px 0 0 var(--line),0 1px 0 var(--line);display:flex;flex-direction:column;gap:5px;min-width:0}
.wiv-facts b{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.wiv-facts span{font-size:14.5px;line-height:1.45;color:var(--ink)}
.wiv-tbl{width:100%;border-collapse:collapse;font-size:13.5px}
.wiv-tbl th,.wiv-tbl td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;line-height:1.4}
.wiv-tbl thead th{font:500 10px/1.2 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);background:var(--shade)}
.wiv-tbl tbody tr:last-child td{border-bottom:0}
.wiv-tbl td.ok{color:var(--up)} .wiv-tbl td.no{color:var(--down)} .wiv-tbl td.mid{color:var(--accent)}
.wiv-tw{overflow-x:auto;padding:0}
.wiv-check{display:flex;flex-direction:column;gap:6px;padding:14px 16px}
.wiv-check label{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.45;color:var(--ink);cursor:pointer}
.wiv-check input{margin-top:3px;accent-color:var(--accent);width:16px;height:16px;flex:0 0 auto}
@media (max-width:520px){.wiv-hide-s{display:none}}
.wiv-cpr > .stat.hl{flex:2 1 220px}
`);

  /* tooltip inside a .wg-fig (which has 14px padding) */
  function tipper(fig) {
    let tip = null;
    return {
      show(x, y, html, W) {
        if (!tip || !fig.contains(tip)) { tip = document.createElement('div'); tip.className = 'wg-tip'; fig.appendChild(tip); }
        tip.hidden = false; tip.innerHTML = html;
        const tw = tip.offsetWidth; let left = 14 + x + 14; if (left + tw > 14 + W) left = 14 + x - 14 - tw;
        tip.style.left = Math.max(4, left) + 'px'; tip.style.top = Math.max(4, 14 + y - 28) + 'px';
      },
      hide() { if (tip) tip.hidden = true; },
    };
  }

  /* =====================================================================
     1. compoundPlus: age, money, monthly saving, return -> balance at retirement
     ===================================================================== */
  const CP_PRESETS = {
    grad: { a: 22, r: 65, s: 1000, m: 300, ret: 7 },
    mid: { a: 35, r: 65, s: 25000, m: 800, ret: 7 },
    late: { a: 50, r: 67, s: 50000, m: 1500, ret: 6 },
  };
  const INFL = 0.03;
  SML.widgets.compoundPlus = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('cp');
    const p0 = CP_PRESETS[opts.preset] || CP_PRESETS.grad;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-pre', [{ v: 'grad', label: 'New grad' }, { v: 'mid', label: 'Mid-career' }, { v: 'late', label: 'Late start' }], opts.preset || 'grad', 'Example person')}<span class="grow"></span>
        ${ui.chips(id + '-ch', [{ k: 'wait', label: 'Start 10 years later', color: 'var(--down)', on: true }, { k: 'real', label: "Today's dollars", color: 'var(--violet)', on: false }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-a', label: 'Your age now', min: 16, max: 70, step: 1, value: p0.a, fmt: (v) => v + ' yrs' })}
        ${ui.slider({ id: id + '-r', label: 'Retire at', min: 30, max: 85, step: 1, value: p0.r, fmt: (v) => 'age ' + v })}
        ${ui.slider({ id: id + '-s', label: 'Money you start with', min: 0, max: 200000, step: 500, value: p0.s, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-m', label: 'Added every month', min: 0, max: 5000, step: 25, value: p0.m, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ret', label: 'Average yearly return', min: 0, max: 12, step: 0.5, value: p0.ret, fmt: (v) => trim(v, 1) + '%' })}
      </div>
      <div class="wg-read wiv-cpr">${ui.stat('At 65', id + '-fv', 'hl big')}${ui.stat('You put in', id + '-in')}${ui.stat('Growth', id + '-gr')}${ui.stat('Cost of waiting 10 yrs', id + '-wt')}${ui.stat('Doubles every', id + '-dbl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the amber handle to change your retirement age. Hover the chart for any age. Assumes the same return every year, monthly saving and monthly compounding; real markets swing from year to year. "Today's dollars" removes 3% yearly inflation.</div>`;
    const fig = root.querySelector('.wg-fig');
    fig.classList.add('drag');
    const tip = tipper(fig);
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (seg) { const p = CP_PRESETS[st.seg(id + '-pre')]; if (p) { st.set(id + '-a', p.a); st.set(id + '-r', p.r); st.set(id + '-s', p.s); st.set(id + '-m', p.m); st.set(id + '-ret', p.ret); } }
      else if (e && e.target && e.target.type === 'range') st.setSeg(id + '-pre', '');
      draw();
    });
    let G = null, dragging = false;
    function model() {
      const A0 = st.n(id + '-a'); let R = st.n(id + '-r');
      if (R <= A0) { R = Math.min(85, A0 + 1); st.set(id + '-r', R); }
      const s0 = st.n(id + '-s'), mo = st.n(id + '-m'), r = st.n(id + '-ret') / 100;
      const wait = st.on(id + '-ch', 'wait'), real = st.on(id + '-ch', 'real');
      const n = R - A0;
      const bal = [s0], con = [s0], wb = [], wc = [];
      let b = s0, c = s0, w = null, wcs = null;
      for (let i = 1; i <= n; i++) {
        for (let k = 0; k < 12; k++) { b = b * (1 + r / 12) + mo; c += mo; if (w != null) { w = w * (1 + r / 12) + mo; wcs += mo; } }
        if (i === 10) { w = s0; wcs = s0; }
        bal.push(b); con.push(c); wb.push(w); wc.push(wcs);
      }
      wb.unshift(null); wc.unshift(null);
      const d = (i) => (real ? Math.pow(1 + INFL, i) : 1);
      const B = bal.map((v, i) => v / d(i)), Cn = con.map((v, i) => v / d(i)), Wb = wb.map((v, i) => (v == null ? null : v / d(i)));
      let cross = -1;
      if (mo > 0 && r > 0) for (let i = 1; i <= n; i++) { const g = bal[i] - bal[i - 1] - 12 * mo; if (g > 12 * mo) { cross = i; break; } }
      const xMax = Math.min(85, Math.max(A0 + 20, 75, R));
      return { A0, R, n, s0, mo, r, wait: wait && n > 10, real, B, Cn, Wb, cross, xMax, nomFinal: b, nomWait: w };
    }
    function hoverAt(px) {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return;
      const m = G.m; const age = Math.round(SML.clamp(G.x.inv(px), m.A0, m.R)); const i = age - m.A0;
      const hov = svg.querySelector('[data-hov]'); if (!hov) return;
      let h = S.line(G.x(age), G.pt, G.x(age), G.H - G.pb, 's-ink dash2') + S.circle(G.x(age), G.y(m.B[i]), 4.5, 'f-up') + S.circle(G.x(age), G.y(m.Cn[i]), 4, 'f-info');
      if (m.wait && m.Wb[i] != null) h += S.circle(G.x(age), G.y(m.Wb[i]), 4, 'f-dn');
      hov.innerHTML = h;
      tip.show(G.x(age), G.y(m.B[i]), `Age ${age}<br>Total ${usd0(m.B[i])}<br><span class="info">Put in ${usd0(m.Cn[i])}</span><br><span class="up">Growth ${usd0(m.B[i] - m.Cn[i])}</span>${m.wait && m.Wb[i] != null ? `<br><span class="dn">Late start ${usd0(m.Wb[i])}</span>` : ''}`, G.W);
    }
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointermove', (e) => { if (dragging) return; const svg = fig.querySelector('svg'); if (!svg || !G) return; const p = ui.pt(svg, e); if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4 || p.y < G.pt - 4) { hide(); return; } hoverAt(p.x); });
    fig.addEventListener('pointerleave', hide);
    ui.drag(fig, {
      sel: '.handle,.cp-grab',
      start() { dragging = true; hide(); },
      move(pt) { if (!G) return; const a = Math.round(SML.clamp(G.x.inv(pt.x), G.m.A0 + 1, Math.min(85, G.m.xMax))); if (a !== st.n(id + '-r')) { st.set(id + '-r', a); st.setSeg(id + '-pre', ''); draw(); } },
      end() { dragging = false; },
    });
    const draw = ui.responsive(fig, (W) => {
      const m = model();
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.52, 280, 380));
      const pl = compact ? 44 : 58, pr = compact ? 14 : 20, pt = 62, pb = 34;
      const top = Math.max(m.B[m.n], m.wait && m.Wb[m.n] != null ? m.Wb[m.n] : 0, 1);
      const yMax = top * 1.14;
      const x = SML.lin(m.A0, m.xMax, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, compact ? 3 : 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const span = m.xMax - m.A0, step = span > 40 ? 10 : 5;
      for (let a = Math.ceil(m.A0 / step) * step; a <= m.xMax; a += step) if (Math.abs(x(a) - x(m.R)) > 16 || a === m.R) b += S.text(x(a), H - pb + 16, String(a), 'xs mono', 'middle');
      b += S.text(pl, H - pb + 16, String(m.A0), 'xs mono b ink', 'middle');
      b += S.line(pl, H - pb + 0.5, W - pr, H - pb + 0.5, 's-line');
      const bp = m.B.map((v, i) => [x(m.A0 + i), y(v)]), cp = m.Cn.map((v, i) => [x(m.A0 + i), y(v)]);
      b += S.polygon(bp.concat(cp.slice().reverse()), 'f-up-t');
      b += S.area(cp, H - pb, 'f-info-t');
      b += S.poly(cp, 's-info w2') + S.poly(bp, 's-up w3');
      if (m.wait) {
        const wp = []; for (let i = 10; i <= m.n; i++) wp.push([x(m.A0 + i), y(m.Wb[i])]);
        b += S.poly(wp, 's-dn w2 dash');
        b += S.circle(x(m.A0 + 10), y(m.Wb[10]), 3.5, 'f-dn');
      }
      // after retirement: dimmed
      if (m.R < m.xMax) b += S.rect(x(m.R), pt - 8, x(m.xMax) - x(m.R), H - pb - pt + 8, 'f-bg', 0, ' opacity=".55"') + (x(m.xMax) - x(m.R) > 70 ? S.text((x(m.R) + x(m.xMax)) / 2, H - pb - 10, 'retired', 'xs mut', 'middle') : '');
      // crossover marker
      if (m.cross > 0 && m.cross < m.n - 1) {
        const cx = x(m.A0 + m.cross), cy = y(m.B[m.cross]);
        b += S.line(cx, cy, cx, H - pb, 's-up dash2') + S.circle(cx, cy, 5, 'f-surf s-up w2');
        const lbl = compact ? 'growth > saving' : 'growth beats your saving';
        const tw = lbl.length * 6.6;
        const left = cx - 10 - tw > pl + 4;
        const ly = Math.max(pt + 12, cy - (left ? 30 : 56));
        const lx = left ? cx - 10 : cx + 10;
        b += S.line(cx, cy - 6, cx, ly + 18, 's-up w1') + S.text(lx, ly, lbl, 'sm up b', left ? 'end' : 'start') + S.text(lx, ly + 14, 'from age ' + (m.A0 + m.cross), 'xs up', left ? 'end' : 'start');
      }
      // end value
      const ex = x(m.R), ey = y(m.B[m.n]);
      b += S.circle(ex, ey, 6, 'f-up');
      const endTxt = mfmt(m.B[m.n]);
      const leftSide = ex > W - pr - 70;
      b += S.text(leftSide ? ex - 12 : ex + 10, ey + (ey < pt + 14 ? 18 : -6), endTxt, (compact ? 'lg' : 'xl') + ' up b mono', leftSide ? 'end' : 'start');
      if (m.wait && m.Wb[m.n] != null) { const wy = y(m.Wb[m.n]); b += S.circle(ex, wy, 4.5, 'f-dn'); if (Math.abs(wy - ey) > 22) b += S.text(leftSide ? ex - 12 : ex + 10, leftSide ? wy - 9 : wy + 4, mfmt(m.Wb[m.n]), 'md dn b mono', leftSide ? 'end' : 'start'); }
      // retirement handle
      b += S.line(ex, pt - 18, ex, H - pb, 's-acc w15 dash');
      b += S.rect(ex - 18, pt - 30, 36, H - pb - pt + 30, 'cp-grab hit grab');
      b += S.circle(ex, pt - 18, 9, 'handle');
      const hl = `retire at ${m.R}`;
      const hx = ex + 14 + (compact ? 70 : 92) > W ? ex - 14 : ex + 14;
      b += S.text(hx, pt - 14, hl, 'md acc b', hx < ex ? 'end' : 'start');
      b += S.text(hx, pt - 1, 'drag me', 'xs mut', hx < ex ? 'end' : 'start');
      // legend
      let lx = pl;
      b += S.rect(lx, 8, 12, 12, 'f-info-t s-info w1', 2) + S.text(lx + 18, 18, 'what you put in', 'sm ink'); lx += compact ? 112 : 128;
      b += S.rect(lx, 8, 12, 12, 'f-up-t s-up w1', 2) + S.text(lx + 18, 18, 'growth', 'sm ink'); lx += compact ? 66 : 76;
      if (m.wait) { if (compact) { b += S.line(pl, 34, pl + 14, 34, 's-dn w2 dash') + S.text(pl + 20, 38, 'start 10 years later', 'sm ink'); } else { b += S.line(lx, 14, lx + 14, 14, 's-dn w2 dash') + S.text(lx + 20, 18, 'start 10 years later', 'sm ink'); } }
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Savings from age ${m.A0} growing to ${usd0(m.B[m.n])} at age ${m.R}`, b);
      G = { W, H, pl, pr, pt, pb, x, y, m };
      // stats
      const fin = m.B[m.n], cin = m.Cn[m.n], gr = fin - cin;
      setL(id + '-fv', 'At ' + m.R + (m.real ? " (today's $)" : ''));
      setT(id + '-fv', usd0(fin)); setT(id + '-in', usd0(cin)); setT(id + '-gr', usd0(gr), gr > 0 ? 'up' : '');
      if (m.n > 10) { const cost = fin - m.Wb[m.n]; setT(id + '-wt', usd0(cost), 'dn'); } else setT(id + '-wt', 'n/a', '');
      setT(id + '-dbl', m.r > 0 ? '≈' + trim(72 / (m.r * 100), 1) + ' yrs' : 'never', '');
      // coach
      if (m.r === 0) setMsg(id + '-msg', 'acc', 'No growth', 'At a 0% return you only get back what you put in. Growth is the whole point of investing for decades.');
      else {
        const share = fin > 0 ? gr / fin : 0;
        const per = Math.pow(1 + m.r / 12, 12 * m.n) / (m.real ? Math.pow(1 + INFL, m.n) : 1);
        let t = `Growth is <b>${pctTxt(share)}</b> of your ${usd0(fin)}. Every $1 you invest today at ${m.A0} becomes about <b>${F.usd(per, 2)}</b> by ${m.R}.`;
        if (m.cross > 0) t += ` From age ${m.A0 + m.cross} your money earns more each year than you add.`;
        if (m.n > 10) { const cost = fin - m.Wb[m.n]; const skipped = 10 * 12 * m.mo; t += ` Waiting 10 years costs <b>${usd0(cost)}</b>${skipped > 0 && cost > skipped * 1.5 ? `, far more than the ${usd0(skipped)} of saving you would skip` : ''}.`; }
        setMsg(id + '-msg', 'up', 'Compounding', t);
      }
    });
  };

  /* =====================================================================
     2. fundCompare: what five popular funds hold, what they cost, how far they fell in 2022
     ===================================================================== */
  const FUNDS = [
    { k: 'world', name: 'Total world', tick: 'VTWAX · VT', what: 'About 10,180 stocks: the US plus developed and emerging markets abroad, big and small companies.', mix: { us: 61, intl: 38, bond: 0, cash: 1 }, fee: 'VTWAX 0.09% · VT 0.06% a year', min: 'VTWAX $3,000 at Vanguard. VT costs one share, or less at brokers with fractional shares.', y22: -18.0, best: 'A one-fund core you hold for decades.', watch: '100% stocks. Its ETF twin VT fell about 50% from mid-2008 to March 2009 and 35% in early 2020.', fr: 0.0009 },
    { k: 'us', name: 'Total US', tick: 'VTSAX · VTI', what: 'About 3,500 US companies, from the giants down to small companies.', mix: { us: 100, intl: 0, bond: 0, cash: 0 }, fee: 'VTSAX 0.04% · VTI 0.03% a year', min: 'VTSAX $3,000 at Vanguard. VTI costs one share.', y22: -19.5, best: 'A US core. Add an international fund to go global.', watch: 'One country only. Still 100% stocks.', fr: 0.0004 },
    { k: 'sp', name: 'S&P 500', tick: 'VFIAX · VOO', what: 'About 500 of the largest US companies. The biggest names make up a large share.', mix: { us: 100, intl: 0, bond: 0, cash: 0 }, fee: 'VFIAX 0.04% · VOO 0.03% a year', min: 'VFIAX $3,000 at Vanguard. VOO costs one share.', y22: -18.1, best: 'A simple large-company core.', watch: 'Large US companies only, and heavy in a handful of tech giants.', fr: 0.0004 },
    { k: 'tdf', name: 'Target-date 2060', tick: 'VTTSX', what: 'One fund built from a handful of Vanguard index funds: about 54% US stocks, 36% foreign stocks, 8% bonds and 2% cash today. It stays near 90% stocks until roughly 25 years before 2060, then shifts toward bonds.', mix: { us: 54, intl: 36, bond: 8, cash: 2 }, fee: '0.08% a year', min: '$1,000 at Vanguard.', y22: -17.5, best: 'Hands-off investors who want one fund that rebalances itself.', watch: 'Still about 90% stocks today. Holding it next to other funds muddles the mix.', fr: 0.0008 },
    { k: 'mm', name: 'Money market', tick: 'VMFXX · VUSXX', what: 'Short-term US government debt. It aims to keep a $1 share price and pays interest daily.', mix: { us: 0, intl: 0, bond: 0, cash: 100 }, fee: 'VMFXX 0.11% · VUSXX 0.07% a year', min: 'VUSXX $3,000 at Vanguard. Check each fund’s minimum.', y22: 0, best: 'Cash you need within a year or two, and your emergency fund.', watch: 'Not FDIC-insured, though very low risk. About 3.8% yield in October 2026, close to 3.7% inflation, so little real growth.', fr: 0.0011 },
  ];
  const MIXK = [['us', 'US stocks', 'f-info', 'info'], ['intl', 'Foreign stocks', 'f-vio', 'vio'], ['bond', 'Bonds', 'f-acc', 'acc'], ['cash', 'Cash', 'f-mut', 'mut']];
  SML.widgets.fundCompare = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('fc');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-f', FUNDS.map((f) => ({ v: f.k, label: f.name })), opts.fund || 'world', 'Fund')}</div>
      <div class="wg-fig"></div>
      <div class="wiv-facts" id="${id}-facts"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Fund facts from AAII fund pages (holdings and mix as of Aug 31, 2026) and Vanguard; 2022 is the worst calendar year each stock fund has had since 2016. Money market yields from October 19, 2026. Fees and mixes change: check the fund page before you buy.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const f = FUNDS.find((x) => x.k === st.seg(id + '-f')) || FUNDS[0];
      const compact = W < 560;
      // panel A: 10x10 squares
      const cell = compact ? Math.min(19, Math.floor((W - 20) / 10) - 3) : 18, gap = 3;
      const gridW = 10 * cell + 9 * gap;
      const aW = compact ? W : gridW + 150;
      const aH = 28 + gridW + (compact ? 64 : 0);
      let a = S.text(0, 14, 'INSIDE EVERY $100', 'cap');
      const order = []; MIXK.forEach(([k, , cls]) => { for (let i = 0; i < Math.round(f.mix[k]); i++) order.push(cls); });
      while (order.length < 100) order.push('f-mut'); order.length = 100;
      for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10; a += S.rect(c * (cell + gap), 26 + r * (cell + gap), cell, cell, order[i], 2); }
      const legX = compact ? 0 : gridW + 18, legY = compact ? 26 + gridW + 22 : 40;
      let li = 0;
      MIXK.forEach(([k, lab, cls, tcls]) => { const v = f.mix[k]; if (!v) return; const lx = compact ? (li % 2) * Math.floor(W / 2) : legX, ly = compact ? legY + Math.floor(li / 2) * 22 : legY + li * 34; a += S.rect(lx, ly - 10, 12, 12, cls, 2) + S.text(lx + 18, ly, `<tspan class="${tcls}" font-weight="600">${v}%</tspan> ${lab}`, 'md ink'); li++; });
      // panel B: 2022 bars for all funds
      const bW = compact ? W : W - aW - 36, bX0 = compact ? 0 : aW + 36;
      const rowH = 30, bTop = 26, bH = bTop + FUNDS.length * rowH + 18;
      const labW = compact ? 104 : 124;
      const xs = SML.lin(-25, 0, labW, bW - 54);
      let bb = S.text(0, 14, compact ? '2022, THE WORST RECENT YEAR' : 'WORST CALENDAR YEAR SINCE 2016 (2022)', 'cap');
      bb += S.line(xs(0), bTop - 4, xs(0), bTop + FUNDS.length * rowH, 's-line');
      [-20, -10].forEach((v) => { bb += S.line(xs(v), bTop - 4, xs(v), bTop + FUNDS.length * rowH, 's-grid') + S.text(xs(v), bTop + FUNDS.length * rowH + 14, v + '%', 'xs mono', 'middle'); });
      bb += S.text(xs(0), bTop + FUNDS.length * rowH + 14, '0', 'xs mono', 'middle');
      FUNDS.forEach((g, i) => {
        const yy = bTop + i * rowH, on = g.k === f.k, dim = on ? '' : ' o35';
        bb += S.text(labW - 10, yy + 18, g.name, 'sm ' + (on ? 'ink b' : 'mut'), 'end');
        if (g.y22 < 0) { bb += S.rect(xs(g.y22), yy + 6, xs(0) - xs(g.y22), 16, 'f-dn' + dim, 2) + S.text(xs(0) + 8, yy + 18, F.pct(g.y22, 1), 'sm mono b ' + (on ? 'dn' : 'mut')); }
        else bb += S.circle(xs(0), yy + 14, 4, 'f-up' + dim) + S.text(xs(0) + 8, yy + 18, 'held $1', 'sm ' + (on ? 'up b' : 'mut'));
      });
      let body, H;
      if (compact) { H = aH + 24 + bH; body = a + `<g transform="translate(0,${aH + 24})">${bb}</g>`; }
      else { H = Math.max(aH, bH); body = a + `<g transform="translate(${bX0},0)">${bb}</g>`; }
      fig.innerHTML = S.wrap(W, H, `${f.name} fund: ${f.mix.us}% US stocks, ${f.mix.intl}% foreign stocks, ${f.mix.bond}% bonds, ${f.mix.cash}% cash; 2022 return ${f.y22}%`, body);
      $id(id + '-facts').innerHTML = [['Tickers', f.tick], ['What it holds', f.what], ['Yearly fee', f.fee], ['To start', f.min], ['Good for', f.best], ['Watch out', f.watch]].map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join('');
      const stocks = f.mix.us + f.mix.intl;
      if (f.k === 'mm') setMsg(id + '-msg', 'up', 'Steady', 'This is where short-term money belongs. It barely moves, but over decades it only about keeps up with inflation.');
      else if (stocks >= 99) setMsg(id + '-msg', 'dn', 'Not "safe"', `Owning ${f.k === 'world' ? 'about 10,000' : f.k === 'us' ? 'about 3,500' : 'about 500'} companies means no single failure can sink you. It does not stop the whole market falling: this fund lost ${F.pct(-f.y22, 1)} in 2022 alone. Diversified and low-cost, yes. Safe for money you need soon, no.`);
      else setMsg(id + '-msg', 'acc', 'Mostly stocks', `About ${stocks}% stocks today, so it still fell ${F.pct(-f.y22, 1)} in 2022. The bond share grows each year as 2060 gets closer.`);
    });
  };

  /* =====================================================================
     2b. feeDrag: what a yearly fee costs over decades
     ===================================================================== */
  SML.widgets.feeDrag = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('fd');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Compare with</span>${ui.seg(id + '-cmp', [{ v: '0.5', label: '0.5% fund' }, { v: '1', label: '1% fund or adviser' }, { v: '2', label: '1% fund + 1% adviser' }], '1', 'Higher fee to compare')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-fee', label: 'Your fund’s fee', min: 0.03, max: 1, step: 0.01, value: 0.06, fmt: (v) => trim(v, 2) + '%' })}
        ${ui.slider({ id: id + '-s', label: 'Starting amount', min: 0, max: 500000, step: 5000, value: 50000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-m', label: 'Added every month', min: 0, max: 3000, step: 50, value: 500, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-y', label: 'Years', min: 5, max: 45, step: 1, value: 30, fmt: 'yrs' })}
      </div>
      <div class="wg-read">${ui.stat('With your fund', id + '-a', 'hl')}${ui.stat('With the higher fee', id + '-b')}${ui.stat('Lost to fees', id + '-d')}${ui.stat('Share of your money', id + '-p')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Both funds earn 7% a year before fees; the fee comes off every year. The gap grows because fees also take the growth those dollars would have earned.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const grow = (s0, mo, yrs, r) => { const out = [s0]; let b = s0; for (let y = 1; y <= yrs; y++) { for (let k = 0; k < 12; k++) b = b * (1 + r / 12) + mo; out.push(b); } return out; };
    const draw = ui.responsive(fig, (W) => {
      const fee = st.n(id + '-fee') / 100, hi = Number(st.seg(id + '-cmp')) / 100, s0 = st.n(id + '-s'), mo = st.n(id + '-m'), Y = st.n(id + '-y');
      const A = grow(s0, mo, Y, 0.07 - fee), B = grow(s0, mo, Y, 0.07 - hi);
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.42, 230, 320));
      const pl = compact ? 44 : 56, pr = compact ? 64 : 92, pt = 30, pb = 30;
      const yMax = Math.max(...A, ...B, 1) * 1.08;
      const x = SML.lin(0, Y, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, Y, compact ? 4 : 6).filter(Number.isInteger).forEach((v) => (b += S.text(x(v), H - pb + 16, v === 0 ? 'now' : v + 'y', 'xs mono', 'middle')));
      const ap = A.map((v, i) => [x(i), y(v)]), bp = B.map((v, i) => [x(i), y(v)]);
      b += S.polygon(ap.concat(bp.slice().reverse()), 'f-dn-t');
      b += S.poly(bp, 's-dn w2') + S.poly(ap, 's-up w25');
      const ya = y(A[Y]), yb = y(B[Y]);
      b += S.circle(x(Y), ya, 4.5, 'f-up') + S.circle(x(Y), yb, 4.5, 'f-dn');
      let la = ya + 4, lb = yb + 4; if (lb - la < 16) lb = la + 16;
      b += S.text(x(Y) + 8, la, mfmt(A[Y]), 'md up b mono') + S.text(x(Y) + 8, lb, mfmt(B[Y]), 'md dn b mono');
      const mid = Math.round(Y * 0.72); if (y(B[mid]) - y(A[mid]) > 18) b += S.text(x(mid), (y(A[mid]) + y(B[mid])) / 2 + 4, 'lost to fees', 'sm dn b', 'middle');
      b += S.line(pl, 14, pl + 16, 14, 's-up w25') + S.text(pl + 22, 18, trim(fee * 100, 2) + '% fee', 'sm ink') + S.line(pl + 96, 14, pl + 112, 14, 's-dn w2') + S.text(pl + 118, 18, trim(hi * 100, 2) + '% fee', 'sm ink');
      fig.innerHTML = S.wrap(W, H, `Growth with a ${trim(fee * 100, 2)}% fee versus ${trim(hi * 100, 2)}% over ${Y} years`, b);
      const d = A[Y] - B[Y];
      setT(id + '-a', usd0(A[Y])); setT(id + '-b', usd0(B[Y])); setT(id + '-d', usd0(d), d > 0 ? 'dn' : ''); setT(id + '-p', A[Y] > 0 ? pctTxt(d / A[Y]) : '0%', '');
      if (fee >= hi) setMsg(id + '-msg', 'acc', 'Same or worse', 'Your fee is as high as the comparison. Low-cost index funds charge a small fraction of this.');
      else setMsg(id + '-msg', 'dn', 'Fee drag', `A ${trim(hi * 100, 2)}% fee instead of ${trim(fee * 100, 2)}% costs you <b>${usd0(d)}</b> over ${Y} years, about ${pctTxt(d / A[Y])} of what you would have had. The fee looks tiny each year; it compounds just like returns do.`);
    });
  };


  /* =====================================================================
     shared simple market model (nominal yearly returns, stated in each widget's note)
     ===================================================================== */
  const MKT = { stock: { mu: 0.09, sd: 0.17 }, bond: { mu: 0.045, sd: 0.06 }, cash: { mu: 0.035, sd: 0.01 }, rho: 0.2 };
  function draws(rng) {
    const z1 = rng.gauss(), z2 = MKT.rho * z1 + Math.sqrt(1 - MKT.rho * MKT.rho) * rng.gauss(), z3 = rng.gauss();
    return { s: Math.max(-0.6, MKT.stock.mu + MKT.stock.sd * z1), b: Math.max(-0.3, MKT.bond.mu + MKT.bond.sd * z2), c: Math.max(0, MKT.cash.mu + MKT.cash.sd * z3) };
  }
  const pctl = (arr, p) => { const a = arr.slice().sort((x, y) => x - y); const i = SML.clamp((a.length - 1) * p, 0, a.length - 1); const lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
  /* target-date style glide: ~90% stocks until 25 years out, down to ~50% at retirement, ~30% seven years after */
  const glide = (yrsLeft) => (yrsLeft >= 25 ? 0.9 : yrsLeft >= 0 ? 0.5 + 0.4 * (yrsLeft / 25) : Math.max(0.3, 0.5 + (0.2 * yrsLeft) / 7));

  /* =====================================================================
     3. allocationSim: stocks / bonds / cash mix -> range of outcomes and worst year
     ===================================================================== */
  const Y22 = { s: -0.18, b: -0.132, c: 0.015 };
  SML.widgets.allocationSim = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('al');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-pre', [{ v: '90', label: '90/10' }, { v: '60', label: '60/40' }, { v: '30', label: '30/70' }, { v: 'glide', label: 'Target-date' }], '60', 'Mix')}<span class="grow"></span>${ui.chips(id + '-rb', [{ k: 'rb', label: 'Rebalance every year', color: 'var(--accent)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-s', label: 'Stocks', min: 0, max: 100, step: 5, value: 60, fmt: (v) => v + '%' })}
        ${ui.slider({ id: id + '-c', label: 'Cash (rest is bonds)', min: 0, max: 50, step: 5, value: 0, fmt: (v) => v + '%' })}
        ${ui.slider({ id: id + '-y', label: 'Years until you need it', min: 3, max: 40, step: 1, value: 20, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-amt', label: 'Amount invested', min: 10000, max: 1000000, step: 10000, value: 100000, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Middle outcome', id + '-p50', 'hl')}${ui.stat('Bad case (1 in 10)', id + '-p10')}${ui.stat('Good case (1 in 10)', id + '-p90')}${ui.stat('In a 2022-type year', id + '-w')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2,000 simulated paths. Model assumptions, not a forecast: stocks average 9% a year with big swings, bonds 4.5%, cash 3.5%. The 2022 row uses what really happened that year: world stocks (VTWAX) −18.0%, US bonds (VBTLX) −13.2%. Results are before inflation and taxes.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      if (t && t.closest && t.closest('#' + id + '-pre')) { const v = st.seg(id + '-pre'); if (v !== 'glide') { st.set(id + '-s', Number(v)); st.set(id + '-c', 0); } }
      else if (t && (t.id === id + '-s' || t.id === id + '-c')) st.setSeg(id + '-pre', '');
      draw();
    });
    function run() {
      const glideOn = st.seg(id + '-pre') === 'glide';
      const ws = st.n(id + '-s') / 100; let wc = st.n(id + '-c') / 100; if (ws + wc > 1) wc = 1 - ws;
      const Y = st.n(id + '-y'), amt = st.n(id + '-amt'), rb = st.on(id + '-rb', 'rb');
      const mixAt = (t) => { if (glideOn) { const g = glide(Y - t); return { s: g, c: 0.02, b: 1 - g - 0.02 }; } return { s: ws, c: wc, b: Math.max(0, 1 - ws - wc) }; };
      const rng = SML.rng(4242);
      const N = 2000, paths = [];
      let lossYears = 0, years = 0;
      for (let p = 0; p < N; p++) {
        let m0 = mixAt(0), S0 = amt * m0.s, B0 = amt * m0.b, C0 = amt * m0.c; const vals = [amt];
        for (let t = 1; t <= Y; t++) {
          const d = draws(rng); const before = S0 + B0 + C0;
          S0 *= 1 + d.s; B0 *= 1 + d.b; C0 *= 1 + d.c;
          const tot = S0 + B0 + C0; if (tot < before) lossYears++; years++;
          if (rb || glideOn) { const m = mixAt(t); S0 = tot * m.s; B0 = tot * m.b; C0 = tot * m.c; }
          vals.push(tot);
        }
        paths.push(vals);
      }
      const band = []; for (let t = 0; t <= Y; t++) { const col = paths.map((v) => v[t]); band.push([pctl(col, 0.1), pctl(col, 0.5), pctl(col, 0.9)]); }
      // drift of the mix along the expected path (no rebalancing)
      const strip = []; { let m0 = mixAt(0), s = m0.s, b = m0.b, c = m0.c; for (let t = 0; t <= Y; t++) { const tot = s + b + c; strip.push({ s: s / tot, b: b / tot, c: c / tot }); s *= 1 + MKT.stock.mu; b *= 1 + MKT.bond.mu; c *= 1 + MKT.cash.mu; if (rb || glideOn) { const m = mixAt(t + 1); const T2 = s + b + c; s = T2 * m.s; b = T2 * m.b; c = T2 * m.c; } } }
      const m0 = mixAt(0);
      const w22 = m0.s * Y22.s + m0.b * Y22.b + m0.c * Y22.c;
      return { glideOn, Y, amt, rb, band, strip, m0, w22, lossShare: lossYears / years };
    }
    const draw = ui.responsive(fig, (W) => {
      const r = run();
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.5, 280, 360));
      const pl = compact ? 46 : 58, pr = compact ? 68 : 84, pt = 30, stripH = 34, pb = 30 + stripH + 22;
      const yMax = r.band[r.Y][2] * 1.06;
      const x = SML.lin(0, r.Y, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, r.Y, compact ? 4 : 6).filter(Number.isInteger).forEach((v) => (b += S.text(x(v), H - pb + 16, v === 0 ? 'now' : v + 'y', 'xs mono', 'middle')));
      const top = r.band.map((q, i) => [x(i), y(q[2])]), bot = r.band.map((q, i) => [x(i), y(q[0])]), med = r.band.map((q, i) => [x(i), y(q[1])]);
      b += S.polygon(top.concat(bot.slice().reverse()), 'f-info-t');
      b += S.line(pl, y(r.amt), W - pr, y(r.amt), 's-mut dash2') + S.text(W - pr - 4, r.band[r.Y][0] > r.amt * 1.12 ? y(r.amt) + 13 : y(r.amt) - 6, 'you put in ' + kfmt(r.amt), 'xs mut', 'end');
      b += S.poly(top, 's-up w15') + S.poly(bot, 's-dn w15') + S.poly(med, 's-acc w3');
      const ex = x(r.Y);
      const labs = [{ y: y(r.band[r.Y][2]), t: mfmt(r.band[r.Y][2]), c: 'up' }, { y: y(r.band[r.Y][1]), t: mfmt(r.band[r.Y][1]), c: 'acc' }, { y: y(r.band[r.Y][0]), t: mfmt(r.band[r.Y][0]), c: 'dn' }];
      for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 15) labs[i].y = labs[i - 1].y + 15;
      labs.forEach((l) => (b += S.text(ex + 8, l.y + 4, l.t, 'md b mono ' + l.c)));
      if (!compact) { b += S.text(ex + 8, Math.max(pt + 6, labs[0].y - 12), 'good', 'xs up'); b += S.text(ex + 8, labs[2].y + 18, 'bad', 'xs dn'); }
      // mix strip
      const sy = H - stripH - 4;
      b += S.text(pl, sy - 8, r.glideOn ? 'MIX OVER TIME (GLIDE PATH)' : r.rb ? 'MIX OVER TIME (REBALANCED)' : 'MIX DRIFTS WITHOUT REBALANCING', 'cap');
      for (let t = 0; t < r.Y; t++) {
        const m = r.strip[t], x0 = x(t), x1 = x(t + 1), w = Math.max(0.5, x1 - x0 + 0.4);
        const hs = stripH * m.s, hb = stripH * m.b, hc = stripH * m.c;
        b += S.rect(x0, sy, w, hs, 'f-info') + S.rect(x0, sy + hs, w, hb, 'f-acc') + S.rect(x0, sy + hs + hb, w, hc, 'f-mut');
      }
      const last = r.strip[r.Y];
      b += S.text(ex + 8, sy + 13, Math.round(last.s * 100) + '% stocks', 'sm info b') + (compact ? '' : S.text(ex + 8, sy + 28, Math.round(last.b * 100) + '% bonds', 'xs acc'));
      // legend
      b += S.rect(pl, 8, 12, 12, 'f-info-t', 2) + S.text(pl + 18, 18, '8 in 10 outcomes', 'sm ink') + S.line(pl + 140, 14, pl + 156, 14, 's-acc w3') + S.text(pl + 162, 18, 'middle', 'sm ink');
      fig.innerHTML = S.wrap(W, H, `Range of outcomes for ${Math.round(r.m0.s * 100)}% stocks over ${r.Y} years`, b);
      const e = r.band[r.Y];
      setT(id + '-p50', usd0(e[1])); setT(id + '-p10', usd0(e[0]), e[0] < r.amt ? 'dn' : ''); setT(id + '-p90', usd0(e[2]), 'up');
      setT(id + '-w', F.spct(r.w22 * 100, 1), r.w22 < 0 ? 'dn' : 'up');
      const stockPct = Math.round(r.m0.s * 100);
      let msg;
      if (r.glideOn) msg = ['info', 'Glide path', `A target-date fund starts near 90% stocks and shifts toward bonds as the target year nears (this model reaches about 50% at the target year). Today that means ${stockPct}% stocks. In a year like 2022 your mix would move about ${F.spct(r.w22 * 100, 1)} (${usd0(r.w22 * r.amt)}).`];
      else if (e[0] < r.amt) msg = ['dn', 'Too short?', `With ${stockPct}% stocks over ${r.Y} years, the bad case still ends below what you put in. Money you need soon belongs in cash and bonds.`];
      else if (stockPct >= 80) msg = ['acc', 'Growth first', `${stockPct}% stocks gives the highest middle outcome, ${usd0(e[1])}, and the deepest falls: about ${F.spct(r.w22 * 100, 1)} in a 2022-type year. Only hold this much if you will not sell in a crash.`];
      else msg = ['up', 'Balanced', `${stockPct}% stocks: a middle outcome of ${usd0(e[1])} and about ${F.spct(r.w22 * 100, 1)} in a 2022-type year. In this model about ${pctTxt(r.lossShare)} of years lose money.`];
      if (!r.rb && !r.glideOn) msg = ['acc', 'Drift', `Without rebalancing, stocks grow to about ${Math.round(last.s * 100)}% of the mix on a typical path, so your risk creeps up without you choosing it. Rebalancing once a year puts it back.`];
      setMsg(id + '-msg', msg[0], msg[1], msg[2]);
    });
  };

  /* =====================================================================
     4. extraMoney: where money should sit, by when you need it
     ===================================================================== */
  const HOR = [{ v: '1', label: '1 year' }, { v: '3', label: '3 years' }, { v: '5', label: '5 years' }, { v: '10', label: '10 years' }, { v: '20', label: '20+ years' }];
  const OPTS = [
    { k: 'cash', name: compactName('Cash', 'HYSA, money market'), w: { s: 0, b: 0, c: 1 } },
    { k: 'bond', name: compactName('Bonds', 'bond index fund'), w: { s: 0, b: 1, c: 0 } },
    { k: 'mix', name: compactName('60/40', 'stocks and bonds'), w: { s: 0.6, b: 0.4, c: 0 } },
    { k: 'stock', name: compactName('Stocks', 'total world fund'), w: { s: 1, b: 0, c: 0 } },
  ];
  function compactName(a, b) { return { a, b }; }
  const pick = (yrs) => (yrs <= 2 ? 'cash' : yrs <= 4 ? 'bond' : yrs <= 9 ? 'mix' : 'stock');
  SML.widgets.extraMoney = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('em');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">I need this money in</span>${ui.seg(id + '-h', HOR, '10', 'When you need the money')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-a', label: 'Extra money to place', min: 1000, max: 200000, step: 1000, value: 20000, fmt: 'usd0' })}</div>
      <div class="wg-read">${ui.stat('Best fit', id + '-best', 'hl')}${ui.stat('Its middle outcome', id + '-mid')}${ui.stat('Its bad case (1 in 10)', id + '-bad')}${ui.stat('Chance it ends below what you put in', id + '-lose')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Bars show 8 in 10 simulated outcomes (2,000 paths) with the middle marked. Model assumptions, not a forecast: stocks average 9% with big swings, bonds 4.5%, cash about 3.5% (top savings accounts paid about 4% and Vanguard's money market funds about 3.8% in October 2026). Before tax and inflation.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const cache = {};
    function sim(yrs, w) {
      const key = yrs + '|' + w.s + w.b + w.c; if (cache[key]) return cache[key];
      const rng = SML.rng(777 + yrs), N = 2000, out = [];
      for (let p = 0; p < N; p++) { let v = 1; for (let t = 0; t < yrs; t++) { const d = draws(rng); v *= 1 + w.s * d.s + w.b * d.b + w.c * d.c; } out.push(v); }
      const res = { p10: pctl(out, 0.1), p50: pctl(out, 0.5), p90: pctl(out, 0.9), lose: out.filter((v) => v < 1).length / N };
      cache[key] = res; return res;
    }
    const draw = ui.responsive(fig, (W) => {
      const yrs = Number(st.seg(id + '-h')), amt = st.n(id + '-a');
      const best = pick(yrs);
      const res = OPTS.map((o) => ({ o, r: sim(yrs, o.w) }));
      const compact = W < 520;
      const H = compact ? 300 : 320;
      const pl = compact ? 46 : 60, pr = 12, pt = 40, pb = compact ? 50 : 46;
      const lo = Math.min(...res.map((q) => q.r.p10)) * amt, hi = Math.max(...res.map((q) => q.r.p90)) * amt;
      const y = SML.lin(Math.min(lo, amt) * 0.92, hi * 1.05, H - pb, pt);
      const colW = (W - pl - pr) / OPTS.length;
      let b = '';
      SML.ticks(y.d[0], y.d[1], 4).forEach((v) => { if (y(v) < pt - 2 || y(v) > H - pb + 1) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      b += S.line(pl, y(amt), W - pr, y(amt), 's-ink dash') + S.line(pl, 12, pl + 18, 12, 's-ink dash') + S.text(pl + 24, 16, 'what you put in', 'sm ink') + S.rect(pl + 136, 6, 12, 12, 'f-up-t s-up w1', 2) + S.text(pl + 154, 16, compact ? '8 in 10' : '8 in 10 outcomes', 'sm ink') + (compact ? '' : S.line(pl + 286, 12, pl + 304, 12, 's-acc w3') + S.text(pl + 310, 16, 'middle', 'sm ink'));
      res.forEach(({ o, r }, i) => {
        const cx = pl + colW * (i + 0.5), bw = Math.min(46, colW * 0.42), on = o.k === best;
        if (on) b += S.rect(pl + colW * i + 4, pt - 14, colW - 8, H - pb - pt + 14 + (compact ? 40 : 36), 'f-acc-t', 6);
        const y10 = y(r.p10 * amt), y90 = y(r.p90 * amt), y50 = y(r.p50 * amt), ya = y(amt);
        if (r.p10 < 1) { b += S.rect(cx - bw / 2, Math.min(ya, y90), bw, Math.max(1.5, y10 - Math.min(ya, y90)), 'f-up-t s-up w1', 3); b += S.rect(cx - bw / 2, Math.max(ya, y90), bw, Math.max(0, y10 - Math.max(ya, y90)), 'f-dn-t s-dn w1', 0); }
        else b += S.rect(cx - bw / 2, y90, bw, Math.max(1.5, y10 - y90), 'f-up-t s-up w1', 3);
        b += S.line(cx - bw / 2 - 4, y50, cx + bw / 2 + 4, y50, 's-acc w3');
        if (!compact || on) b += S.text(cx, y90 - 6, kfmt(r.p90 * amt), 'xs mono up', 'middle');
        b += S.text(cx, y10 + 13, kfmt(r.p10 * amt), 'xs mono ' + (r.p10 < 1 ? 'dn' : 'mut'), 'middle');
        b += S.text(cx, H - pb + 18, o.name.a, 'md b ' + (on ? 'acc' : 'ink'), 'middle');
        b += S.text(cx, H - pb + 32, compact ? (on ? 'best fit' : '') : o.name.b, 'xs ' + (on ? 'acc b' : 'mut'), 'middle');
        if (!compact && on) b += S.text(cx, pt - 4, 'best fit', 'xs acc b', 'middle');
      });
      fig.innerHTML = S.wrap(W, H, `Ranges of outcomes after ${yrs} years for cash, bonds, a 60/40 mix and stocks`, b);
      const R = res.find((q) => q.o.k === best).r;
      setT(id + '-best', best === 'cash' ? 'Cash' : best === 'bond' ? 'Bonds + cash' : best === 'mix' ? '60/40 mix' : 'Stocks');
      setT(id + '-mid', usd0(R.p50 * amt)); setT(id + '-bad', usd0(R.p10 * amt), R.p10 < 1 ? 'dn' : ''); setT(id + '-lose', pctTxt(R.lose), R.lose > 0.05 ? 'dn' : 'up');
      const st100 = res[3].r;
      const msgs = {
        cash: ['info', 'Keep it safe', `For money you need within a year or two, the only job is to be there. Stocks lose money in about ${pctTxt(st100.lose)} of ${yrs}-year stretches in this model, and you cannot wait for a recovery.`],
        bond: ['info', 'Mostly steady', `Over ${yrs} years, bonds or a CD ladder smooth the ride. Stocks still end below where they started in about ${pctTxt(st100.lose)} of stretches this short.`],
        mix: ['acc', 'Balanced', `Five to ten years out, a mix gives growth with smaller dips. All-stocks ends lower than it started in ${pctTxt(st100.lose)} of ${yrs}-year stretches here, a mix in ${pctTxt(res[2].r.lose)}.`],
        stock: ['up', 'Time is on your side', `With ${yrs}+ years, a low-cost world stock fund (like VTWAX or VT) has the best middle outcome: ${usd0(st100.p50 * amt)}. The swings are real, but you have time to wait them out.`],
      };
      const m = msgs[best]; setMsg(id + '-msg', m[0], m[1], m[2]);
    });
  };

  /* =====================================================================
     4b. lumpVsDca: invest a windfall now or spread it out
     ===================================================================== */
  SML.widgets.lumpVsDca = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('ld');
    let seed = 11;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Spread it over</span>${ui.seg(id + '-n', [{ v: '3', label: '3 months' }, { v: '6', label: '6 months' }, { v: '12', label: '12 months' }], '12', 'Months to spread')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-a', label: 'Windfall to invest', min: 1000, max: 200000, step: 1000, value: 24000, fmt: 'usd0' })}</div>
      <div class="wg-read">${ui.stat('All at once', id + '-l', 'hl')}${ui.stat('Spread out', id + '-d')}${ui.stat('This year’s winner', id + '-win')}${ui.stat('All at once wins (2,000 years)', id + '-odds')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g" id="${id}-new">New market year</button></div>
      <div class="wg-note">Simulated monthly prices for a stock fund (same model as above: 9% a year on average with big swings). Spreading out keeps the waiting cash in a money market at 3.5%. Values shown after 12 months.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    $id(id + '-new').addEventListener('click', () => { seed += 1; draw(); });
    const mMu = MKT.stock.mu / 12, mSd = MKT.stock.sd / Math.sqrt(12), cashM = 0.035 / 12;
    function year(rng) { const p = [1]; for (let i = 1; i <= 12; i++) p.push(p[i - 1] * (1 + mMu + mSd * rng.gauss())); return p; }
    function outcome(p, n, amt) {
      const lump = (amt / p[0]) * p[12];
      let sh = 0, cash = amt; const lumpV = [], dcaV = [];
      for (let i = 0; i <= 12; i++) {
        if (i < n) { const put = amt / n; sh += put / p[i]; cash -= put; }
        lumpV.push((amt / p[0]) * p[i]); dcaV.push(sh * p[i] + cash);
        if (i < 12) cash *= 1 + cashM;
      }
      return { lump, dca: sh * p[12] + cash, lumpV, dcaV };
    }
    let oddsCache = {};
    function odds(n) {
      if (oddsCache[n] != null) return oddsCache[n];
      const rng = SML.rng(90210); let w = 0; const N = 2000;
      for (let k = 0; k < N; k++) { const p = year(rng); const o = outcome(p, n, 1); if (o.lump > o.dca) w++; }
      return (oddsCache[n] = w / N);
    }
    const draw = ui.responsive(fig, (W) => {
      const n = Number(st.seg(id + '-n')), amt = st.n(id + '-a');
      const p = year(SML.rng(seed * 7919)); const o = outcome(p, n, amt);
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.42, 240, 310));
      const pl = compact ? 46 : 58, pr = compact ? 62 : 80, pt = 34, pb = 30;
      const vals = o.lumpV.concat(o.dcaV);
      const lo = Math.min(...vals), hi = Math.max(...vals); const padv = (hi - lo) * 0.12 + amt * 0.01;
      const x = SML.lin(0, 12, pl, W - pr), y = SML.lin(lo - padv, hi + padv, H - pb, pt);
      let b = '';
      SML.ticks(lo - padv, hi + padv, 4).forEach((v) => { if (y(v) < pt - 2 || y(v) > H - pb + 1) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      for (let i = 0; i <= 12; i += compact ? 3 : 2) b += S.text(x(i), H - pb + 16, i === 0 ? 'now' : i + 'm', 'xs mono', 'middle');
      b += S.rect(x(0), pt - 6, x(n) - x(0), H - pb - pt + 6, 'f-acc-t', 0, ' opacity=".6"') + S.text(x(0) + 6, pt + 6, compact ? 'buying' : 'buying each month', 'xs acc b');
      for (let i = 0; i < n; i++) b += S.circle(x(i), y(o.dcaV[i]), 3, 'f-acc');
      b += S.line(pl, y(amt), W - pr, y(amt), 's-mut dash2');
      b += S.poly(o.dcaV.map((v, i) => [x(i), y(v)]), 's-acc w25') + S.poly(o.lumpV.map((v, i) => [x(i), y(v)]), 's-info w25');
      let yl = y(o.lump) + 4, yd = y(o.dca) + 4; if (Math.abs(yl - yd) < 15) { if (yl < yd) yd = yl + 15; else yl = yd + 15; }
      b += S.text(x(12) + 8, yl, kfmt(o.lump), 'md info b mono') + S.text(x(12) + 8, yd, kfmt(o.dca), 'md acc b mono');
      b += S.line(pl, 14, pl + 16, 14, 's-info w25') + S.text(pl + 22, 18, 'all at once', 'sm ink') + S.line(pl + 104, 14, pl + 120, 14, 's-acc w25') + S.text(pl + 126, 18, 'spread out', 'sm ink');
      fig.innerHTML = S.wrap(W, H, `Investing ${usd0(amt)} at once versus over ${n} months in one simulated year`, b);
      const lw = o.lump >= o.dca;
      setT(id + '-l', usd0(o.lump), lw ? 'up' : ''); setT(id + '-d', usd0(o.dca), lw ? '' : 'up');
      setT(id + '-win', lw ? 'All at once' : 'Spread out', ''); const od = odds(n); setT(id + '-odds', pctTxt(od), '');
      setMsg(id + '-msg', lw ? 'info' : 'acc', lw ? 'Lump sum won' : 'Spreading won', `${lw ? 'Prices mostly rose, so money that waited bought fewer shares.' : 'Prices fell early, so the later monthly buys got cheaper shares.'} Across 2,000 simulated years, investing at once wins about ${pctTxt(od)} of the time because markets rise more often than they fall. Spreading out still helps if a sudden drop would make you quit.`);
    });
  };


  /* =====================================================================
     5. kidsMoney: 529, Trump account, custodial Roth, UTMA, your own account
     ===================================================================== */
  const GOALS = [{ v: 'college', label: 'College' }, { v: 'any', label: 'Anything at 18+' }, { v: 'retire', label: 'Their retirement' }];
  const KACC = [
    { k: '529', name: '529 plan', short: '529 plan', ctl: 'You (the owner)', aid: 'Light (parent asset)', tax: { college: ['ok', 'Tax-free for tuition, books, room and board, and up to $20,000 a year of K-12 costs'], any: ['no', 'Growth taxed as income plus a 10% penalty, unless you roll up to $35,000 into their Roth IRA'], retire: ['mid', 'Only through the $35,000 lifetime rollover to a Roth IRA (529 open 15+ years)'] } },
    { k: 'trump', name: 'Trump account', short: 'Trump acct', ctl: 'Locked until 18, then the child', aid: 'Not settled yet', tax: { college: ['mid', 'From 18, IRA rules: growth taxed as income when withdrawn'], any: ['mid', 'From 18, IRA rules: growth taxed as income, and a 10% penalty before 59½ unless an exception applies'], retire: ['ok', 'Grows tax-deferred for decades in US stock index funds'] } },
    { k: 'roth', name: 'Custodial Roth IRA', short: 'Custodial Roth', ctl: 'You, then the child at 18 to 21 in most states', aid: 'Retirement accounts are not counted', tax: { college: ['mid', 'Contributions come out tax-free any time; growth is taxed if withdrawn early'], any: ['mid', 'Contributions come out tax-free any time; leave the growth alone'], retire: ['ok', 'Tax-free growth for 40+ years. The best account a teen can have'] } },
    { k: 'utma', name: 'UTMA/UGMA', short: 'UTMA/UGMA', ctl: 'The child at 18 to 21 in most states, up to 25 in a few', aid: 'Heavy (the child’s asset)', tax: { college: ['mid', 'Gains taxed; above a small yearly amount at the parent’s rate (kiddie tax)'], any: ['mid', 'The money is legally theirs to spend however they like'], retire: ['no', 'No tax shelter, and they may spend it first'] } },
    { k: 'own', name: 'Your own account', short: 'Your account', ctl: 'You, always', aid: 'Parent asset', tax: { college: ['mid', 'Long-term gains taxed at 0%, 15% or 20% when you sell'], any: ['ok', 'Fully flexible: you decide when and how to help'], retire: ['mid', 'You can gift it to their Roth later, if they have earned income'] } },
  ];
  const BEST = { college: '529', any: 'own', retire: 'roth' };
  SML.widgets.kidsMoney = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('km');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Saving for</span>${ui.seg(id + '-g', GOALS, opts.goal || 'college', 'Goal')}<span class="grow"></span>${ui.chips(id + '-ch', [{ k: 'born', label: 'Born 2025-2028', color: 'var(--accent)', on: true }, { k: 'job', label: 'Teen has a job', color: 'var(--up)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-age', label: 'Child’s age now', min: 0, max: 17, step: 1, value: 0, fmt: (v) => (v === 0 ? 'newborn' : v + (v === 1 ? ' year' : ' years')) })}
        ${ui.slider({ id: id + '-m', label: 'You save each month', min: 25, max: 1000, step: 25, value: 200, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-r', label: 'Average yearly return', min: 3, max: 10, step: 0.5, value: 7, fmt: (v) => trim(v, 1) + '%' })}
      </div>
      <div class="wg-read">${ui.stat('Total you put in', id + '-in')}${ui.stat('Best fit at 18', id + '-b', 'hl')}${ui.stat('Roth left alone to 60', id + '-r60')}</div>
      <div class="wiv-tw"><table class="wiv-tbl"><thead><tr><th>Account</th><th>Tax for this goal</th><th class="wiv-hide-s">Who controls it</th><th class="wiv-hide-s">College aid impact</th></tr></thead><tbody id="${id}-tb"></tbody></table></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Same monthly amount in each account. Trump accounts allow $5,000 a year in total and add a one-time $1,000 from the government for US-citizen children born 2025 through 2028. A custodial Roth needs the teen's own earned income (assumed from age 15, up to the $7,500 2026 IRA limit). Steady returns are a simplification; rules as of October 2026.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const fv = (mo, yrs, r, start) => { let b = start || 0; for (let i = 0; i < Math.round(yrs * 12); i++) b = b * (1 + r / 12) + mo; return b; };
    const draw = ui.responsive(fig, (W) => {
      const goal = st.seg(id + '-g') || 'college', age = st.n(id + '-age'), mo = st.n(id + '-m'), r = st.n(id + '-r') / 100;
      const born = st.on(id + '-ch', 'born') && age <= 1, job = st.on(id + '-ch', 'job');
      const yrs = 18 - age;
      const vals = {
        '529': fv(mo, yrs, r), own: fv(mo, yrs, r), utma: fv(mo, yrs, r),
        trump: fv(Math.min(mo, 5000 / 12), yrs, r, 0) + (born ? 1000 * Math.pow(1 + r / 12, yrs * 12) : 0),
        roth: job ? fv(Math.min(mo, 7500 / 12), Math.max(0, Math.min(yrs, 3)), r) : 0,
      };
      const best = BEST[goal];
      const compact = W < 520;
      const rowH = compact ? 40 : 42, labW = compact ? 112 : 160, pr = compact ? 58 : 84, top = 10;
      const H = top + KACC.length * rowH + 8;
      const vmax = Math.max(...Object.values(vals), 1);
      const x = SML.lin(0, vmax, labW, W - pr);
      let b = '';
      KACC.forEach((a, i) => {
        const yy = top + i * rowH, v = vals[a.k], on = a.k === best;
        if (on) b += S.rect(0, yy, W, rowH - 4, 'f-acc-t', 4);
        b += S.text(labW - 10, yy + (compact ? 16 : 18), compact ? a.short : a.name, 'md b ' + (on ? 'acc' : 'ink'), 'end');
        if (on) b += S.text(labW - 10, yy + (compact ? 30 : 32), 'best fit', 'xs acc b', 'end');
        else if (a.k === 'trump' && born) b += S.text(labW - 10, yy + (compact ? 30 : 32), 'incl. $1,000 seed', 'xs mut', 'end');
        if (v > 0) { b += S.rect(labW, yy + 8, Math.max(2, x(v) - labW), rowH - 20, on ? 'f-acc' : 'f-info', 3); b += S.text(x(v) + 8, yy + rowH / 2 + 2, mfmt(v), 'md b mono ' + (on ? 'acc' : 'ink')); }
        else b += S.text(labW + 4, yy + rowH / 2 + 2, a.k === 'roth' ? 'needs a teen with a job' : '—', 'sm mut');
      });
      fig.innerHTML = S.wrap(W, H, `Value at age 18 in five kinds of accounts; best fit for ${goal}: ${best}`, b);
      $id(id + '-tb').innerHTML = KACC.map((a) => { const t = a.tax[goal]; return `<tr${a.k === best ? ' style="background:var(--accent-t)"' : ''}><td><b>${a.name}</b></td><td class="${t[0]}">${t[1]}</td><td class="wiv-hide-s">${a.ctl}</td><td class="wiv-hide-s">${a.aid}</td></tr>`; }).join('');
      setT(id + '-in', usd0(mo * 12 * yrs));
      setT(id + '-b', usd0(vals[best]));
      const r60 = vals.roth * Math.pow(1 + r, 42);
      setT(id + '-r60', job ? usd0(r60) : 'needs a job', job ? 'up' : '');
      const msgs = {
        college: ['up', '529 first', `For school, a 529 grows tax-free and counts lightly for financial aid. ${usd0(mo)} a month from ${age === 0 ? 'birth' : 'age ' + age} could be about ${usd0(vals['529'])} at 18.${age > 10 ? ' Starting late still helps, and many states give a tax deduction for 529 deposits.' : ''}`],
        any: ['acc', 'Keep control', `For "whatever they need", money in your own account stays flexible. A UTMA becomes legally theirs at 18 to 21 in most states (up to 25 in a few), and a 529 or Trump account adds tax or penalties for non-school spending.`],
        retire: job ? ['up', 'Roth for teens', `Even three summers of Roth contributions could grow to about ${usd0(r60)} by 60 at ${trim(r * 100, 1)}% a year without another dollar added. That is compounding with a 45-year head start.`] : ['acc', 'No job yet', `A Roth IRA needs earned income, so until they work, a Trump account is the tax-deferred option for the long run.${born ? ' Children born 2025 through 2028 also get the $1,000 seed.' : ''}`],
      };
      const m = msgs[goal]; setMsg(id + '-msg', m[0], m[1], m[2]);
    });
  };


  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    g19: { t: 'Federal Reserve G.19: credit card interest rates (Aug 2026)', u: 'https://www.federalreserve.gov/releases/g19/current/default.htm' },
    cpi: { t: 'BLS via DOL: Consumer Price Index, September 2026', u: 'https://www.dol.gov/newsroom/economicdata/cpi_10142026.pdf' },
    vtwax: { t: 'AAII: Vanguard Total World Stock Index Admiral (VTWAX)', u: 'https://www.aaii.com/fund/ticker/VTWAX' },
    vttsx: { t: 'AAII: Vanguard Target Retirement 2060 (VTTSX)', u: 'https://www.aaii.com/fund/ticker/VTTSX' },
    vbtlx: { t: 'AAII: Vanguard Total Bond Market Index Admiral (VBTLX)', u: 'https://www.aaii.com/fund/ticker/VBTLX' },
    vtdd: { t: 'Chartrow: VT drawdown history', u: 'https://chartrow.com/quote/vt/drawdown' },
    jpm: { t: 'Chase: J.P. Morgan Self-Directed Investing pricing', u: 'https://chase.com/personal/investments/online-investing/pricing' },
    jpmfaq: { t: 'Chase: Self-Directed Investing trading FAQs (recurring investments)', u: 'https://www.chase.com/personal/investments/online-investing/faqs/trading' },
    hysa: { t: 'Bankrate: best high-yield savings rates (Oct 2026)', u: 'https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts/' },
    rp: { t: 'IRS Rev. Proc. 2025-32: 2026 inflation adjustments', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    lim: { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit to $7,500', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
    trump: { t: 'IRS: 4 million children signed up for Trump accounts (Mar 31, 2026)', u: 'https://www.irs.gov/newsroom/4-million-children-have-been-signed-up-for-trump-accounts-with-1-million-claiming-the-1000-pilot-program-contribution' },
    obbba: { t: 'IRS: One Big Beautiful Bill provisions', u: 'https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions' },
    buch: { t: 'Buchalter: key tax changes in Public Law 119-21 (529 changes)', u: 'https://www.buchalter.com/insights/key-tax-changes-in-public-law-119-21-what-individuals-and-businesses-need-to-know/' },
    secure: { t: 'T. Rowe Price: SECURE 2.0 cheat sheet (529-to-Roth rollover)', u: 'https://www.troweprice.com/financial-intermediary/us/en/insights/articles/2026/q1/secure-2-0-act-cheat-sheet.html' },
  };

  SML.lessons.push({
    id: 'l-compound', course: 'invest', order: 1, title: 'The power of compound interest', mins: 8, level: 'Beginner',
    summary: 'Your age, your money and time: how growth on growth builds wealth.',
    idea: 'Money that earns returns on its past returns grows slowly at first, then fast. Time matters more than amount.',
    widget: 'compoundPlus',
    try: 'Pick a person, drag the amber retirement handle, change the return. Keep “Start 10 years later” on to see what waiting costs.',
    body: [
      '<h3>Growth on growth</h3><p>Put $10,000 in an investment that earns 7% a year. Year one adds $700. Year two adds $749, because you now earn on $10,700. Leave it alone and it becomes about $19,700 after 10 years, $38,700 after 20 and $76,100 after 30. You added nothing after day one. That snowball is <b>compound interest</b>.</p><p>The curve looks flat for years and then bends upward. Most of the money arrives at the end, which is why people who start early look like geniuses and people who start late feel stuck.</p>',
      '<h3>The rule of 72</h3><p>Divide 72 by the yearly return to estimate how long money takes to double. At 7% it doubles about every 10.3 years. At 10%, every 7.2 years. At 4%, every 18 years. Flip it around for debt: a credit card at about 21% (the average rate on all card accounts in August 2026) doubles what you owe in under four years if you pay nothing.</p>',
      '<h3>Time beats amount</h3><p>Alex saves $300 a month from 25 to 35, then stops: $36,000 in total. Bo saves the same $300 a month from 35 to 65: $108,000 in total. At 7% a year, Alex ends at 65 with about <b>$421,000</b> and Bo with about <b>$366,000</b>. Alex put in a third as much and still finished ahead, because Alex’s money had 30 extra years to compound.</p><p>The best time to start was years ago. The second best is your next payday. Small amounts count; automating them counts more (see <a href="#l-extra-money">where extra money should go</a>).</p>',
      '<h3>Today’s dollars</h3><p>Prices rise too. Consumer prices were up 3.7% in the year to September 2026. At 3% inflation, $1 million in 40 years buys what about $307,000 buys today. A 7% return with 3% inflation is roughly a 4% <b>real return</b>. Turn on “Today’s dollars” in the chart to plan in money you can picture.</p>',
      '<h3>What return should you use?</h3><ul><li>No return is promised. Stocks have grown faster than bonds or cash over long periods, with big drops on the way: a world stock fund lost 18% in 2022 alone.</li><li>For planning, many people test 5% to 7% a year for a stock-heavy mix and check that the plan still works at the low end.</li><li>Fees and taxes come straight off the top, so they compound against you. Keep both low (see <a href="#l-index-funds">index funds</a> and <a href="#l-asset-location">asset location</a>).</li></ul>',
      '<h3>What breaks the snowball</h3><ul><li><b>Stopping:</b> cashing out a 401(k) when you change jobs costs tax, often a 10% penalty, and every future year of growth.</li><li><b>Selling in a crash:</b> you lock in the loss and miss the recovery.</li><li><b>High-interest debt:</b> it compounds against you faster than investments compound for you. Pay it off first (see <a href="#l-card-debt">credit card debt</a>).</li></ul>',
    ],
    example: {
      title: 'Starting at 25 vs 35',
      intro: 'Two friends each invest $400 a month in a low-cost stock index fund. Assume 7% a year, compounded monthly.',
      steps: [
        'Maya starts at 25 and invests until 65: 40 years × 12 × $400 = $192,000 of her own money.',
        'Jordan starts at 35 and invests until 65: 30 years × 12 × $400 = $144,000.',
        'At 65 Maya has about $1,049,900. Growth is $857,900 of it, more than four times what she put in.',
        'At 65 Jordan has about $488,000. Growth is $344,000.',
        'Maya saved $48,000 more but ends with about $561,900 more. The extra decade did most of the work.',
      ],
      result: 'Ten more years of compounding more than doubled the result. Rule of 72: at 7% money doubles about every 10 years, so the first decade’s dollars double one extra time.',
    },
    mistakes: [
      'Waiting until you “have real money” to start. $100 a month at 22 can beat $300 a month at 40.',
      'Expecting a steady 7% every year. Real returns jump around, and a crash right before you retire hurts most (see <a href="#l-sequence">sequence risk</a>).',
      'Forgetting inflation. A $1 million goal in 40 years buys roughly what $307,000 buys today at 3% inflation.',
      'Breaking the chain: cashing out retirement accounts at a job change or selling everything in a downturn.',
    ],
    points: [
      'Compounding is growth on growth: slow at first, then fast.',
      'Rule of 72: years to double ≈ 72 ÷ yearly return.',
      'Starting ten years earlier can be worth more than saving twice as much later.',
      'Plan in today’s dollars by subtracting inflation from your return.',
      'Debt, fees and taxes compound too, against you.',
    ],
    terms: ['Compound interest', 'Rule of 72', 'Inflation', 'Real return', 'Opportunity cost'],
    quiz: { q: 'At about 8% a year, roughly how long does money take to double?', options: ['About 5 years', 'About 9 years', 'About 15 years'], answer: 1, why: 'Rule of 72: 72 ÷ 8 = 9 years.' },
    sources: [SRC.cpi, SRC.g19, SRC.vtwax],
  });

  SML.lessons.push({
    id: 'l-index-funds', course: 'invest', order: 2, title: 'Index funds: VTWAX, VTI and VOO', mins: 9, level: 'Beginner',
    summary: 'What the most popular index funds hold, what they cost and how far they fall.',
    idea: 'One low-cost fund can own thousands of companies. Diversified and cheap, but still 100% stocks.',
    widget: 'fundCompare',
    try: 'Switch between the five funds. Compare what is inside each $100, what it costs and how it did in 2022.',
    extra: [{ widget: 'feeDrag', try: 'Slide your fund’s fee, then pick a higher-fee comparison. Watch what 30 years of fees add up to.' }],
    body: [
      '<h3>What an index fund is</h3><p>An index fund buys every company in a market index, such as the S&amp;P 500, in the same proportions. Nobody picks stocks, so fees are tiny and you get the market’s return minus a sliver. Over long periods, most stock pickers struggle to beat their index once fees are counted. More on the basics in <a href="#l-etfs">index funds and ETFs</a>.</p>',
      '<h3>Mutual fund or ETF twin</h3><p>Vanguard sells most of its index funds two ways. The mutual fund (VTWAX, VTSAX, VFIAX) trades once a day at the closing price and needs $3,000 to start at Vanguard. The ETF twin (VT, VTI, VOO) trades like a stock all day at any broker for the price of one share, or less where fractional shares are offered. Inside, they own the same stocks.</p><p>If you bank at Chase, J.P. Morgan Self-Directed Investing charges $0 for online stock and ETF trades, so VT, VTI or VOO cost nothing to buy there. Whether it offers Vanguard’s mutual funds is something to check on its fund list; the ETF twin is the easy route.</p>',
      '<h3>Five funds, side by side</h3><ul><li><b>Total world (VTWAX, VT):</b> about 10,180 stocks, roughly 61% US and 38% abroad. Fees 0.09% and 0.06% a year.</li><li><b>Total US (VTSAX, VTI):</b> about 3,500 US companies of every size. 0.04% and 0.03%.</li><li><b>S&amp;P 500 (VFIAX, VOO):</b> about 500 of the largest US companies. 0.04% and 0.03%.</li><li><b>Target-date 2060 (VTTSX):</b> one fund built from a handful of Vanguard index funds, about 90% stocks today; it shifts toward bonds in the last 25 years or so before 2060. 0.08%, $1,000 to start.</li><li><b>Money market (VMFXX, VUSXX):</b> short-term government debt. About 3.8% and 3.9% yields on October 19, 2026.</li></ul>',
      '<h3>“The safest fund”? Not quite</h3><p>VTWAX is about as diversified as one fund gets: no single company or country can sink it. That is not the same as safe. It is 100% stocks. It lost 18.0% in 2022, and its ETF twin VT fell about 50% from June 2008 to March 2009, 35% in early 2020 and 28% from late 2021 to October 2022.</p><p>For money you need within a few years, the safe places are FDIC-insured savings, Treasury bills and government or Treasury money market funds (see <a href="#l-emergency">emergency fund</a>). A world stock fund is a great home for money you will not touch for 10 years or more, as long as you can sit through a 50% drop without selling.</p>',
      '<h3>Fees: small numbers, big money</h3><p>A fee comes off every year, and it also takes the growth those dollars would have earned. With $50,000 to start and $500 a month for 30 years at 7%, a 0.06% fund ends near $1,001,000. The same money at 1% ends near $803,000. That gap of about $198,000 went to fees.</p>',
      '<h3>How to choose</h3><ul><li><b>One fund:</b> a total world fund, or a target-date fund near your retirement year. Simple and complete.</li><li><b>Two or three funds:</b> a total US fund plus a total international fund (and a bond fund if you want one), set in the mix you choose.</li><li>Do not stack overlapping funds. The S&amp;P 500 companies already make up most of a total US fund by value, and a target-date fund already holds both.</li></ul>',
    ],
    example: {
      title: '$10,000 in a world fund through 2022',
      intro: 'You invest $10,000 in VTWAX on January 1, 2022. These are the fund’s actual calendar-year returns.',
      steps: [
        '2022: −18.0%. Your $10,000 is $8,200 at year end. The fee that year was about $9 (0.09%).',
        'You hold. 2023: +21.9%, so $8,200 × 1.219 = $9,995.80. Almost back to even.',
        '2024: +16.4%, so $9,995.80 × 1.164 = $11,635.11.',
        '2025: +22.4%, so $11,635.11 × 1.224 = $14,241.38.',
        'Someone who sold at the end of 2022 locked in a $1,800 loss and missed a $6,041 recovery.',
      ],
      result: 'Holding through the drop turned $10,000 into about $14,241 in four years. Diversified does not mean it cannot fall; it means you can afford to wait.',
    },
    mistakes: [
      'Calling a 100% stock fund “safe” and using it for a house deposit due next year.',
      'Owning an S&amp;P 500 fund, a total US fund and a target-date fund and thinking that is three times the diversification. It is mostly the same stocks.',
      'Paying 1% or more for a fund that tracks the same market a 0.03% fund tracks.',
      'Switching to whichever fund did best last year.',
    ],
    points: [
      'Index funds own a whole market at very low cost.',
      'VTWAX/VT is the whole world in one fund; VTSAX/VTI the whole US; VFIAX/VOO the 500 largest US companies.',
      'Diversified is not safe: every stock fund here lost 17% to 20% in 2022.',
      'Mutual fund and ETF twins hold the same stocks; the ETF is easier to buy at other brokers.',
      'Fees compound against you; under 0.10% is the target.',
    ],
    terms: ['Index fund', 'Total world index fund', 'Expense ratio', 'ETF', 'Diversification', 'Drawdown'],
    glossary: [{ t: 'Admiral Shares', d: 'Vanguard’s lower-cost mutual fund share class, usually with a $3,000 minimum to start.' }],
    quiz: { q: 'Which single fund owns both US and international stocks?', options: ['VOO', 'VTWAX', 'VMFXX'], answer: 1, why: 'VTWAX (and its ETF twin VT) holds about 61% US and 38% international stocks.' },
    sources: [SRC.vtwax, SRC.vttsx, SRC.vtdd, SRC.jpm],
  });

  SML.lessons.push({
    id: 'l-allocation', course: 'invest', order: 3, title: 'Stocks, bonds and your age', mins: 9, level: 'Beginner',
    summary: 'How your mix of stocks, bonds and cash sets your growth and your worst years.',
    idea: 'Your mix of stocks, bonds and cash decides most of your risk and return. Match it to when you need the money.',
    widget: 'allocationSim',
    try: 'Pick a mix or build your own, change the years, then turn off rebalancing and watch the mix drift.',
    body: [
      '<h3>Three ingredients</h3><ul><li><b>Stocks:</b> the growth engine, with big swings. A world stock fund lost 18.0% in 2022.</li><li><b>Bonds:</b> loans to governments and companies. Steadier, but they can fall when interest rates jump: a total US bond fund lost 13.2% in 2022 (see <a href="#l-bonds">bonds</a>).</li><li><b>Cash:</b> savings, money market funds, T-bills. Steady, and in October 2026 paying about 3.8% to 4.3%, roughly the 3.7% inflation rate.</li></ul>',
      '<h3>What a mix did in 2022</h3><p>A 60/40 mix (60% stocks, 40% bonds) lost about 0.6 × 18.0% + 0.4 × 13.2% ≈ 16.1% in 2022. That year was unusual: bonds usually cushion a stock crash, but rates rose so fast that both fell together. The “In a 2022-type year” tile shows what your mix would have done.</p>',
      '<h3>Rules of thumb</h3><ul><li>“110 minus your age” in stocks is a common starting point: about 80% at 30, 50% at 60.</li><li>Target-date funds do it for you. Vanguard’s 2060 fund is about 90% stocks today. It stays near that level until roughly 25 years before 2060, then shifts toward bonds each year as the date gets closer. That schedule is called the <b>glide path</b>.</li><li>Rules of thumb ignore your pension, Social Security, job security and nerves. Adjust for them.</li></ul>',
      '<h3>Rebalancing</h3><p>When stocks race ahead, they become a bigger slice than you chose, and your risk rises without you deciding it. Once a year (or when a slice is 5 points off), sell some of what grew and buy what lagged. Do it inside retirement accounts or with new money to avoid taxes. A target-date fund rebalances itself.</p>',
      '<h3>Time horizon beats age</h3><p>A 30-year-old saving for a house in three years should not hold that money in stocks, and a 60-year-old’s money for age 85 can hold plenty. Give each goal its own mix (see <a href="#l-extra-money">where extra money should go</a>).</p>',
      '<h3>The mix you can live with</h3><p>The best allocation is the one you will not abandon in a crash. A 90/10 mix that you sell in a panic does worse than a 60/40 mix you hold. Picture a 30% to 50% drop in your stock money and ask what you would do (see <a href="#l-drawdowns">drawdowns</a>).</p>',
    ],
    example: {
      title: 'Rebalancing a 60/40 mix after 2022',
      intro: 'You start 2022 with $100,000: $60,000 in a world stock fund and $40,000 in a total bond fund.',
      steps: [
        'Stocks fall 18.0% to $49,200. Bonds fall 13.2% to $34,720. Total: $83,920, down 16.1%.',
        'Your mix is now 58.6% stocks and 41.4% bonds. Target stocks: 60% × $83,920 = $50,352.',
        'You sell $1,152 of bonds and buy $1,152 of stocks, back to 60/40. Inside an IRA this costs no tax.',
        '2023: stocks +21.9% ($50,352 → $61,379) and bonds +5.7% ($33,568 → $35,481).',
        'Total: $96,860. Rebalancing made you buy stocks when they were cheaper, without guessing.',
      ],
      result: 'A simple once-a-year rule kept the risk you chose and bought low automatically.',
    },
    mistakes: [
      'Choosing an aggressive mix during a boom, then selling stocks in the next crash.',
      'Keeping 30-year money in cash, or next year’s money in stocks.',
      'Never rebalancing, so stocks drift to 80% or more without you choosing it.',
      'Holding a target-date fund next to other funds, which undoes its careful mix.',
    ],
    points: [
      'Your stock, bond and cash mix drives most of your risk and return.',
      'More stocks: higher middle outcome, deeper bad years.',
      'Match each pot of money to when you need it.',
      'Rebalance once a year, ideally inside tax-sheltered accounts.',
      'Pick the mix you will hold in a crash.',
    ],
    terms: ['Asset allocation', 'Rebalancing', 'Target-date fund', 'Bond', 'Diversification'],
    glossary: [{ t: 'Glide path', d: 'The schedule a target-date fund follows as it moves from mostly stocks toward bonds over time.' }],
    quiz: { q: 'In a year when stocks fall 18% and bonds fall 13%, a 60/40 mix loses about…', options: ['18%', '16%', '8%'], answer: 1, why: '0.6 × 18% + 0.4 × 13.2% ≈ 16.1%.' },
    sources: [SRC.vtwax, SRC.vbtlx, SRC.vttsx, SRC.cpi],
  });

  SML.lessons.push({
    id: 'l-extra-money', course: 'invest', order: 4, title: 'Where your extra money should go', mins: 9, level: 'Beginner',
    summary: 'Match money to when you need it, pick an account, automate and invest.',
    idea: 'Money you need soon stays safe. Money you will not touch for years goes into low-cost stock funds, automatically.',
    widget: 'extraMoney',
    try: 'Pick when you need the money and see which choice fits. Then try investing a windfall all at once or spread out.',
    extra: [{ widget: 'lumpVsDca', try: 'Press “New market year” a few times, then compare 3, 6 and 12 months.' }],
    body: [
      '<h3>First, the order</h3><ol><li>A starter cushion of $500 to $1,000 (<a href="#l-emergency">emergency fund</a>).</li><li>Get the full 401(k) match (<a href="#l-401k-match">the match</a>).</li><li>Pay off high-interest debt such as credit cards (<a href="#l-card-debt">card debt</a>).</li><li>Build the full emergency fund: three to six months of costs.</li><li>Fill an HSA and a Roth IRA (<a href="#l-ira">which account first</a>).</li><li>Max out the 401(k) (<a href="#l-401k-limits">the limits</a>).</li><li>Then a taxable brokerage account for everything else.</li></ol>',
      '<h3>Match the money to the date</h3><ul><li><b>Within 2 years:</b> cash. Top high-yield savings paid about 4.0% to 4.3% in October 2026, Vanguard’s Federal Money Market (VMFXX) about 3.8%, and 3-month Treasury bills 4.26%. T-bill interest is free of state income tax.</li><li><b>2 to 5 years:</b> mostly bonds, CDs or a ladder of Treasuries, with little or no stock.</li><li><b>5 to 10 years:</b> a balanced mix.</li><li><b>10+ years:</b> mostly low-cost stock index funds, such as a total world fund.</li></ul>',
      '<h3>Opening a taxable brokerage account</h3><p>Any large broker works: Vanguard, Fidelity, Schwab, or J.P. Morgan Self-Directed Investing if you bank at Chase. J.P. Morgan charges $0 for online stock and ETF trades and offers free recurring investments, but fractional shares only for S&amp;P 500 and Nasdaq-100 stocks and ETFs. Check that the fund you want is eligible for recurring and fractional buys there, and whether a mutual fund such as VTWAX is on its fund list. Those investment balances also count toward Chase relationship tiers (see <a href="#l-bank-tiers">banking relationships</a>). J.P. Morgan’s robo-adviser has been shut down, so Self-Directed means you pick the funds.</p><p>A simple choice: VTWAX at Vanguard ($3,000 to start), or its ETF twin VT at almost any broker, J.P. Morgan included. More on picking a broker in <a href="#l-broker">choosing a broker</a>.</p>',
      '<h3>Taxes in a taxable account</h3><p>You pay tax each year on dividends and when you sell at a gain. Qualified dividends and long-term gains get the 0%, 15% or 20% rates. In 2026 the 0% rate applies up to $49,450 of taxable income for single filers and $98,900 for married couples filing jointly. Keep turnover low, hold broad index funds, and use losses wisely (<a href="#l-tlh-pairs">tax-loss harvesting</a>, <a href="#l-asset-location">asset location</a>).</p>',
      '<h3>Automate it</h3><p>Set a recurring transfer and investment for the day after payday. Raise it by 1% of pay with every raise. Automation removes the two things that ruin returns: forgetting and reacting to headlines.</p>',
      '<h3>A windfall: all at once or spread out?</h3><p>Because markets rise more often than they fall, investing a lump sum right away usually ends ahead of feeding it in over months. Spreading it out (<b>dollar-cost averaging</b>) wins when prices drop early, and it can make a big first step easier to take. If spreading it out is what gets you invested, it is a fine choice; just set the schedule in advance and stick to it.</p>',
    ],
    example: {
      title: 'A $15,000 bonus',
      intro: 'You have six months of costs saved and no card debt, and your 401(k), Roth IRA and HSA are already full for the year. A $15,000 bonus lands after tax.',
      steps: [
        'You split it by date. $5,000 is for a car you will replace next year, so it goes into a high-yield savings account at about 4.2%: roughly $210 of interest in a year, before tax.',
        '$10,000 is for the long run. You buy VT in a taxable account at J.P. Morgan Self-Directed for $0 commission. Its 0.06% fee costs about $6 a year.',
        'You check that VT is eligible for recurring buys there (J.P. Morgan offers fractional shares only on S&amp;P 500 and Nasdaq-100 stocks and ETFs). If it is, you set $300 a month after payday; if not, you buy whole shares each month or use VTWAX at Vanguard.',
        'At 7% a year, $10,000 plus $300 a month for 25 years grows to about $300,300. You put in $100,000.',
        'Each year the fund pays small dividends. For most people they are qualified dividends taxed at 0% or 15%, so you keep holding and avoid selling.',
      ],
      result: 'Short-term money stayed safe, long-term money went to work immediately, and the habit runs itself.',
    },
    mistakes: [
      'Putting money you need in a year or two into stocks.',
      'Leaving a large cash pile in checking. The average savings account paid about 0.6% in October 2026 while good ones paid about 4%.',
      'Waiting months or years for the “right time” to invest a windfall.',
      'Paying for a managed account with high fees when one low-cost index fund would do the job.',
    ],
    points: [
      'Order: $500-$1,000 cushion, full 401(k) match, high-interest debt, full emergency fund, HSA and Roth IRA, max the 401(k), then taxable investing.',
      'Short-term money in cash or T-bills; long-term money in low-cost stock funds.',
      'VTWAX at Vanguard or VT at almost any broker gives you the world in one fund.',
      'Automate the transfer and the purchase.',
      'A lump sum usually beats spreading out, but any plan you stick to beats waiting.',
    ],
    terms: ['Taxable brokerage account', 'Dollar-cost averaging', 'Money market fund', 'HYSA', 'T-bill', 'Qualified dividend'],
    quiz: { q: 'You need $8,000 for a wedding in 14 months. Where does it fit best?', options: ['A total world stock fund', 'A high-yield savings account or T-bills', 'Split between stocks and bonds'], answer: 1, why: 'Money needed within about two years should not ride the stock market.' },
    sources: [SRC.jpm, SRC.jpmfaq, SRC.hysa, SRC.rp],
  });

  SML.lessons.push({
    id: 'l-kids-money', course: 'invest', order: 5, title: 'Kids: 529s, Trump accounts and custodial Roths', mins: 9, level: 'Beginner',
    summary: 'Four ways to invest for a child, and which fits college, freedom or retirement.',
    idea: 'Pick the account by the goal: a 529 for school, a Roth for a working teen, your own account for flexibility.',
    widget: 'kidsMoney',
    try: 'Switch the goal and the child’s age, then turn the job and birth-year chips on and off.',
    body: [
      '<h3>Your retirement comes first</h3><p>Students can borrow for college; nobody lends you money to retire. Get your own emergency fund, 401(k) match and retirement saving on track, then add accounts for your children.</p>',
      '<h3>529 plans</h3><ul><li>Growth is tax-free when spent on qualified education: college tuition, books, room and board.</li><li>From 2026, up to $20,000 a year can go to K-12 tuition (up from $10,000), and more K-12 costs count: curriculum, books, online courses, tutoring and test fees. Post-high-school credential and licensing costs count too.</li><li>Spend it on anything else and the growth is taxed as income plus a 10% penalty.</li><li>A leftover 529 can move up to $35,000 over a lifetime into the child’s Roth IRA if the 529 has been open 15 years or more, within the yearly Roth limits.</li><li>A parent-owned 529 counts lightly on the federal aid form (FAFSA). Many states also give a tax deduction for deposits.</li></ul>',
      '<h3>Trump accounts</h3><ul><li>Created by the 2025 tax law. Any child under 18 with a Social Security number can have one, elected on IRS Form 4547.</li><li>US-citizen children born from January 1, 2025 through December 31, 2028 get a one-time $1,000 deposit from the government. By March 2026 about 4 million children had been signed up.</li><li>Contributions started July 4, 2026, up to $5,000 a year in total. Employers can add up to $2,500 a year without it counting as the parent’s income.</li><li>The money is invested in US stock index funds and generally cannot come out before 18. After that, traditional IRA-style rules apply: growth is taxed as income when withdrawn.</li></ul>',
      '<h3>Custodial Roth IRA</h3><p>A teen with earned income (a summer job, babysitting, real work in a family business) can have a Roth IRA that you manage. Contributions are capped at the lesser of what they earned that year and the $7,500 IRA limit for 2026. You can fund it as a gift. Contributions can come out any time; the growth compounds tax-free for 40+ years.</p>',
      '<h3>UTMA and UGMA accounts</h3><p>A custodial account is an irrevocable gift: the money belongs to the child, who takes control at 18 to 21 in most states (up to 25 in a few), and can spend it on anything. Investment income above a small yearly amount is taxed at the parent’s rate (the kiddie tax), and the account counts heavily against college aid.</p>',
      '<h3>Gifts from family</h3><p>Each person can give each child up to $19,000 in 2026 without filing a gift tax return. Grandparents can put that toward a 529, a Trump account or a Roth (the Roth still needs the child’s earned income).</p>',
    ],
    example: {
      title: 'A newborn in 2026',
      intro: 'A US-citizen baby with a Social Security number is born in March 2026. Assume steady returns.',
      steps: [
        'The parents elect a Trump account on Form 4547 and receive the one-time $1,000. Left alone at 7% for 18 years, it grows to about $3,380.',
        'Grandparents add $1,000 at the end of each year for 18 years. At 7% that adds about $34,000, for roughly $37,400 at 18.',
        'The parents save $200 a month in a 529 at 6%: $43,200 put in, about $77,500 at 18, tax-free for college.',
        'At 16 and 17 the teen earns $3,000 each summer, and the parents put $3,000 a year into a custodial Roth IRA.',
        'Left alone to 60 at 7%, that $6,000 could grow to about $113,900, all tax-free.',
      ],
      result: 'Each account did one job: the 529 for school, the Trump account and Roth for the long run.',
    },
    mistakes: [
      'Saving for college before your own emergency fund and retirement.',
      'Putting college money in a UTMA without realizing the child controls it at 18 to 21 in most states (up to 25 in a few) and it hurts aid.',
      'Opening a custodial Roth without real earned income to back the contributions.',
      'Missing the one-time $1,000 Trump account deposit for a child born 2025 through 2028.',
    ],
    points: [
      '529: best for education, now including more K-12 costs.',
      'Trump account: $1,000 seed for eligible kids, up to $5,000 a year, locked until 18.',
      'Custodial Roth: the strongest long-term account, but only with earned income.',
      'UTMA: flexible, but it becomes the child’s money and hurts aid.',
      'Your own retirement first, then your children’s accounts.',
    ],
    terms: ['529 plan', 'Trump account', 'Custodial account', 'Roth IRA', 'Compound interest'],
    glossary: [
      { t: 'Kiddie tax', d: 'A rule that taxes a child’s investment income above a small yearly amount at the parent’s tax rate.' },
      { t: 'FAFSA', full: 'Free Application for Federal Student Aid', d: 'The form colleges use to work out federal aid. Money in the child’s name counts more than money the parents own.' },
    ],
    quiz: { q: 'How much can go into a custodial Roth IRA for a 16-year-old in 2026?', options: ['Any amount a parent wants', 'Up to the teen’s earned income that year, and no more than $7,500', 'Nothing until the teen turns 18'], answer: 1, why: 'A Roth IRA contribution needs earned income and is capped at the lesser of that income and the yearly IRA limit.' },
    sources: [SRC.trump, SRC.obbba, SRC.buch, SRC.lim, SRC.secure],
  });

})();
