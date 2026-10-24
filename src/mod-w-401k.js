/* Retirement & Wealth track · Company Benefits: 401(k) match, limits, mega backdoor Roth, HSA, open enrollment. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setL = (x, t) => { const el = $id(x); if (el && el.previousElementSibling) el.previousElementSibling.textContent = t; };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 1 : 2) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e5 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const usd = (v) => F.usd0(Math.round(v));
  const pctS = (v, d) => trim(v, d == null ? 0 : d) + '%';
  const fv = (pmt, r, n) => (r === 0 ? pmt * n : pmt * ((Math.pow(1 + r, n) - 1) / r)); // end-of-year contributions

  /* 2026 figures (IRS Notice 2025-67, Rev. Proc. 2025-19, Rev. Proc. 2025-32) */
  const L = { def: 24500, cu50: 8000, cu6063: 11250, add: 72000, rothCuWage: 150000 };
  const HSA = { self: 4400, fam: 8750, cu55: 1000, ddSelf: 1700, ddFam: 3400, oopSelf: 8500, oopFam: 17000 };
  const HSA27 = { self: 4500, fam: 9000 }; // Rev. Proc. 2026-24
  SML.w401k = { L, HSA };

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
  /* keep a range slider and a number field in step; register BEFORE ui.wire so redraws see both updated */
  function syncPair(root, sliderId, fieldId) {
    const s = $id(sliderId), f = $id(fieldId); if (!s || !f) return;
    f.addEventListener('input', () => { const v = Number(f.value); if (!isFinite(v) || f.value === '') return; s.value = SML.clamp(v, Number(s.min), Number(s.max)); ui.setRange(s); });
    s.addEventListener('input', () => { f.value = s.value; });
  }
  /* the value to use: the typed field if valid, else the slider */
  function pairVal(st, sliderId, fieldId, min, max) {
    const f = $id(fieldId); const v = f && f.value !== '' ? Number(f.value) : NaN;
    return SML.clamp(isFinite(v) ? v : st.n(sliderId), min, max);
  }

  SML.css(`
    .w4k-sub{display:grid;gap:16px 24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
    .w4k-sub[hidden]{display:none}
    .w4k-lg{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px;font:500 11px/1.3 var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
    .w4k-lg i{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-2px;margin-right:6px;background:var(--c);border:1px solid var(--c2,transparent)}
    .w4k-steps{list-style:none;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));padding:14px 16px}
    .w4k-steps li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:color-mix(in srgb,var(--ink) 88%,transparent)}
    .w4k-steps b{flex:0 0 22px;height:22px;border-radius:50%;background:var(--accent);color:var(--on-acc);font:700 11px/22px var(--mono);text-align:center}
  `);

  /* =====================================================================
     1. matchCalc ★ — match captured vs left on the table, paycheck strip, vesting
     ===================================================================== */
  const MATCH_PRE = [
    { v: 'a', label: '100% up to 4%', tiers: [[4, 100]] },
    { v: 'b', label: '50% of 6%', tiers: [[6, 50]] },
    { v: 'c', label: '100% of 3% + 50% of 2%', tiers: [[3, 100], [2, 50]] },
    { v: 'x', label: 'Custom' },
  ];
  /* match as % of pay for a contribution of c% of pay */
  const matchPct = (tiers, c) => { let s = 0, start = 0; tiers.forEach(([w, r]) => { s += (r / 100) * Math.max(0, Math.min(c - start, w)); start += w; }); return s; };
  const tierTop = (tiers) => tiers.reduce((a, t) => a + t[0], 0);
  const tierText = (tiers) => tiers.map(([w, r], i) => `${r}% of the ${i ? 'next ' : ''}${w}%`).join(' + ');
  const vestPct = (kind, yrs) => (kind === 'now' ? 100 : kind === 'cliff3' ? (yrs >= 3 ? 100 : 0) : yrs < 2 ? 0 : Math.min(100, (yrs - 1) * 20));

  SML.widgets.matchCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('mc');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Match formula</span>${ui.seg(id + '-f', MATCH_PRE.map((p) => ({ v: p.v, label: p.label })), opts.preset || 'b', 'Match formula')}</div>
      <div class="wg-fig"></div>
      <div class="w4k-lg"><span><i style="--c:var(--up)"></i>match you get</span><span><i style="--c:var(--down-t);--c2:var(--down)"></i>match left on the table</span><span><i style="--c:var(--accent-t);--c2:var(--accent)"></i>paid by a year-end true-up</span></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-s', label: 'Salary', min: 30000, max: 350000, step: 1000, value: opts.salary || 80000, fmt: 'usd0' })}
        ${ui.field({ id: id + '-sf', label: 'Or type your salary', value: opts.salary || 80000, min: 0, step: 1000 })}
        ${ui.slider({ id: id + '-c', label: 'You contribute (% of pay)', min: 0, max: 50, step: 1, value: opts.contrib != null ? opts.contrib : 3, fmt: 'pct' })}
        <div class="w4k-sub" id="${id}-cx" hidden>
          ${ui.slider({ id: id + '-mr', label: 'Employer matches', min: 10, max: 100, step: 5, value: 50, fmt: 'pct' })}
          ${ui.slider({ id: id + '-mu', label: 'Of the first (% of pay)', min: 1, max: 10, step: 1, value: 6, fmt: 'pct' })}
        </div>
      </div>
      <div class="wg-bar"><span class="wg-title">Vesting</span>${ui.seg(id + '-v', [{ v: 'now', label: 'Immediate' }, { v: 'cliff3', label: '3-year cliff' }, { v: 'grad6', label: '6-year graded' }], 'grad6', 'Vesting schedule')}<span class="grow"></span>${ui.chips(id + '-k', [{ k: 'tu', label: 'Plan has a year-end true-up', color: 'var(--accent)', on: false }])}</div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-y', label: 'Years you have worked there', min: 0, max: 6, step: 1, value: 2, fmt: 'yrs' })}</div>
      <div class="wg-read">${ui.stat('Employer match / year', id + '-m', 'hl big')}${ui.stat('You put in', id + '-in')}${ui.stat('Left on the table', id + '-lost')}${ui.stat('Vested if you left today', id + '-vest')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the dot or the contribution slider. 26 paychecks a year and the ${usd(L.def)} 2026 employee limit (under age 50). Your own contributions are always 100% yours; vesting applies to the employer's money.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    syncPair(root, id + '-s', id + '-sf');
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      if (t && (t.id === id + '-mr' || t.id === id + '-mu')) st.setSeg(id + '-f', 'x');
      draw();
    });
    let G = null;
    function tiers() {
      const p = st.seg(id + '-f');
      $id(id + '-cx').hidden = p !== 'x';
      if (p === 'x') return [[st.n(id + '-mu'), st.n(id + '-mr')]];
      return MATCH_PRE.find((x) => x.v === p).tiers;
    }
    function model() {
      const tr = tiers(), sal = pairVal(st, id + '-s', id + '-sf', 0, 2e6), c = st.n(id + '-c');
      const tu = st.on(id + '-k', 'tu');
      const pay = sal / 26; let cum = 0; const checks = [];
      let got = 0, trued = 0;
      for (let k = 0; k < 26; k++) {
        const want = pay * c / 100; const d = Math.max(0, Math.min(want, L.def - cum)); cum += d;
        const m = pay * matchPct(tr, pay > 0 ? (d / pay) * 100 : 0) / 100;
        const full = pay * matchPct(tr, c) / 100;
        got += m; checks.push({ d, m, full, cut: d < want - 0.01 });
      }
      const annualDefPct = sal > 0 ? (cum / sal) * 100 : 0;
      const annualMatch = sal * matchPct(tr, annualDefPct) / 100; // what a true-up pays to
      if (tu && annualMatch > got) { trued = annualMatch - got; }
      const maxMatch = sal * matchPct(tr, tierTop(tr)) / 100;
      const youGet = got + trued;
      const short = checks.filter((k) => k.full > 0.005 && k.m < k.full - 0.5).length;
      return { tr, sal, c, tu, checks, got, trued, youGet, maxMatch, lost: Math.max(0, maxMatch - youGet), cum, top: tierTop(tr), hitAt: checks.findIndex((x) => x.cut), short };
    }
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.y > G.chartB + 8 || p.x < G.pl - 6 || p.x > G.W - G.pr + 6) { tip.hide(); return; }
      const c = Math.round(SML.clamp(G.x.inv(p.x), 0, G.xMax));
      tip.show(G.x(c), G.y(G.m.sal * matchPct(G.m.tr, c) / 100), `At ${c}% you put in ${usd(G.m.sal * c / 100)}<br><span class="up">Match ${usd(G.m.sal * matchPct(G.m.tr, c) / 100)}</span>`, G.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
    ui.drag(fig, { sel: '.handle', move(pt) { if (!G) return; const c = Math.round(SML.clamp(G.x.inv(pt.x), 0, 50)); st.set(id + '-c', c); draw(); } });
    const draw = ui.responsive(fig, (W) => {
      const m = model(); const compact = W < 480;
      const pl = compact ? 46 : 58, pr = 16, pt = 34;
      const chartH = Math.round(SML.clamp(W * 0.34, 170, 230));
      const chartB = pt + chartH;
      const stripT = chartB + (compact ? 64 : 50), cellH = compact ? 22 : 26;
      const H = stripT + cellH + 26;
      const xMax = Math.max(10, Math.ceil(m.top + 4), Math.min(50, m.c + 2));
      const x = SML.lin(0, xMax, pl, W - pr);
      const yMax = Math.max(m.maxMatch * 1.25, 500);
      const y = SML.lin(0, yMax, chartB, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, xMax, compact ? 5 : 10).forEach((v) => { b += S.text(x(v), chartB + 16, v + '%', 'xs mono', 'middle'); });
      b += S.text(W - pr, chartB + 32, 'your contribution, % of pay', 'xs', 'end');
      // full-match zone
      b += S.rect(pl, pt, x(m.top) - pl, chartB - pt, 'f-up-t', 0, ' opacity=".45"');
      b += S.text(pl + 6, pt + 14, compact ? 'match zone' : 'the match zone: every dollar here is matched', 'sm up b');
      // curve
      const pts = []; for (let c = 0; c <= xMax; c += 0.25) pts.push([x(c), y(m.sal * matchPct(m.tr, c) / 100)]);
      b += S.area(pts, chartB, 'f-up-t') + S.poly(pts, 's-up w25');
      b += S.line(x(m.top), y(m.maxMatch), W - pr, y(m.maxMatch), 's-up dash');
      b += S.text(Math.min(x(m.top) + 8, W - pr - 110), y(m.maxMatch) - 8, 'full match ' + usd(m.maxMatch), 'sm up b', 'start');
      // your point + gap
      const cx = x(Math.min(m.c, xMax)), myM = m.sal * matchPct(m.tr, Math.min(m.c, 50)) / 100, cy = y(myM);
      if (m.c < m.top) {
        b += S.rect(cx - 7, y(m.maxMatch), 14, cy - y(m.maxMatch), 'f-dn-t s-dn w1', 2);
        b += S.text(cx + 12, (cy + y(m.maxMatch)) / 2 + 4, 'left: ' + usd(m.maxMatch - myM), 'sm dn b');
      }
      b += S.line(cx, cy, cx, chartB, 's-ink dash2');
      b += `<g class="handle" style="cursor:ew-resize">${S.circle(cx, cy, 14, 'f-acc', ' opacity=".18"')}${S.circle(cx, cy, 7, 'f-acc s-bg w2')}</g>`;
      const dmLeft = cx - pl > 70; b += S.text(dmLeft ? cx - 14 : cx + 14, cy + 20, 'drag me', 'xs acc b', dmLeft ? 'end' : 'start');
      // paycheck strip
      const x0 = compact ? 8 : pl - 50, x1 = W - pr;
      b += S.text(x0, stripT - 10, 'Your 26 paychecks this year', 'sm ink b'); const cw = (x1 - x0) / 26;
      m.checks.forEach((k, i) => {
        let cls = 'f-up';
        if (k.full > 0.005 && k.m < k.full - 0.5) cls = m.tu ? 'f-acc-t s-acc w1' : 'f-dn-t s-dn w1';
        if (k.full <= 0.005) cls = 'f-shade2';
        b += S.rect(x0 + i * cw + 1, stripT, cw - 2, cellH, cls, 2);
      });
      if (m.hitAt >= 0 && m.short > 0) {
        const hx = x0 + (26 - m.short) * cw;
        b += S.line(hx, stripT - 4, hx, stripT + cellH + 4, 's-ink w2');
        b += S.text(SML.clamp(hx, x0 + 70, x1 - 70), stripT + cellH + 18, (m.tu ? `limit hit after paycheck ${26 - m.short}: true-up fills the rest` : `limit hit: match stops after paycheck ${26 - m.short}`), 'xs ink b', 'middle');
      } else if (m.hitAt >= 0) {
        b += S.text(x0, stripT + cellH + 18, `limit reached in paycheck ${m.hitAt + 1}, but the match was already complete`, 'xs', 'start');
      } else b += S.text(x0, stripT + cellH + 18, m.c === 0 ? 'no contributions, so no match' : 'every paycheck matched', 'xs', 'start');
      fig.innerHTML = S.wrap(W, H, `Employer match against your contribution rate; you get ${usd(m.youGet)} of a possible ${usd(m.maxMatch)}`, b);
      G = { W, pl, pr, x, y, xMax, chartB, m };

      const yrs = st.n(id + '-y'), vk = st.seg(id + '-v'), vp = vestPct(vk, yrs);
      setT(id + '-m', usd(m.youGet));
      setT(id + '-in', usd(m.cum));
      setT(id + '-lost', usd(m.lost), m.lost > 0.5 ? 'dn' : 'up');
      setT(id + '-vest', pctS(vp), vp >= 100 ? 'up' : vp > 0 ? 'acc' : 'dn');
      const vestTxt = vp < 100 ? ` Only ${pctS(vp)} of the employer money is yours if you leave after ${yrs} year${yrs === 1 ? '' : 's'}${vk === 'cliff3' ? ' (all of it after 3 years)' : vk === 'grad6' ? ' (20% more each year from year 2, all of it after 6)' : ''}.` : '';
      const ret = m.cum > 0 ? m.youGet / Math.min(m.cum, m.sal * m.top / 100) : 0;
      if (m.c === 0) setMsg(id + '-msg', 'dn', 'Free money skipped', `Contributing nothing turns down ${usd(m.maxMatch)} a year. The formula here is ${tierText(m.tr)} of pay.${vestTxt}`);
      else if (m.hitAt >= 0 && !m.tu && m.lost > 0.5) setMsg(id + '-msg', 'dn', 'Front-loading trap', `At ${m.c}% you hit the ${usd(L.def)} limit in paycheck ${m.hitAt + 1}, and the plan matches per paycheck with no true-up. ${m.short} paycheck${m.short === 1 ? '' : 's'} at the end of the year get${m.short === 1 ? 's' : ''} little or no match: ${usd(m.lost)} lost. Spread contributions so they last all year, or ask HR about a true-up.`);
      else if (m.hitAt >= 0 && m.tu && m.trued > 0.5) setMsg(id + '-msg', 'acc', 'True-up saves you', `You hit the limit in paycheck ${m.hitAt + 1}. A year-end true-up pays the missing ${usd(m.trued)}, so you still get the full ${usd(m.youGet)}.${vestTxt}`);
      else if (m.c < m.top) setMsg(id + '-msg', 'acc', 'Raise it', `Going from ${m.c}% to ${trim(m.top, 1)}% costs you ${usd(m.sal * (m.top - m.c) / 100)} more a year before tax and adds ${usd(m.maxMatch - m.youGet)} of match. That is an instant ${pctS(100 * (m.maxMatch - m.youGet) / Math.max(1, m.sal * (m.top - m.c) / 100))} return.${vestTxt}`);
      else setMsg(id + '-msg', 'up', 'Full match', `You capture the full ${usd(m.youGet)} a year: an instant ${pctS(ret * 100)} return on the ${usd(m.sal * m.top / 100)} that earns it.${vestTxt}`);
    });
  };

  /* =====================================================================
     2. limitStack ★ — deferral + catch-up + match + after-tax up to 415(c)
     ===================================================================== */
  SML.widgets.limitStack = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('ls');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Your age in 2026</span>${ui.seg(id + '-a', [{ v: 'u50', label: 'Under 50' }, { v: '50', label: '50-59 or 64+' }, { v: '60', label: '60-63' }], opts.age || 'u50', 'Age group')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-s', label: 'Salary', min: 30000, max: 400000, step: 1000, value: opts.salary || 150000, fmt: 'usd0' })}
        ${ui.field({ id: id + '-sf', label: 'Or type your salary', value: opts.salary || 150000, min: 0, step: 1000 })}
        ${ui.slider({ id: id + '-d', label: 'Your 401(k) deferral', min: 0, max: L.def, step: 500, value: opts.deferral != null ? opts.deferral : L.def, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-e', label: 'Employer adds (% of pay)', min: 0, max: 15, step: 0.5, value: opts.employer != null ? opts.employer : 4, fmt: 'pct1' })}
      </div>
      <div class="wg-bar">${ui.chips(id + '-k', [{ k: 'cu', label: 'Use catch-up (50+)', color: 'var(--violet)', on: true }, { k: 'at', label: 'After-tax money allowed', color: 'var(--accent)', on: true }])}</div>
      <div class="wg-read">${ui.stat('Total into the plan', id + '-tot', 'hl big')}${ui.stat('From you (pre-tax/Roth)', id + '-me')}${ui.stat('From your employer', id + '-er')}${ui.stat('After-tax room', id + '-at')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 limits: ${usd(L.def)} employee deferral, ${usd(L.cu50)} catch-up at 50+ (${usd(L.cu6063)} at 60-63), ${usd(L.add)} total annual additions or 100% of pay if less. Catch-ups sit on top of the total. The employer share includes matching and profit-sharing money.</div>`;
    const fig = root.querySelector('.wg-fig');
    syncPair(root, id + '-s', id + '-sf');
    const st = ui.wire(root, () => draw());
    function model() {
      const sal = pairVal(st, id + '-s', id + '-sf', 0, 5e6), age = st.seg(id + '-a');
      const cuOn = st.on(id + '-k', 'cu') && age !== 'u50', atOn = st.on(id + '-k', 'at');
      const cap = Math.min(L.add, sal);
      const def = Math.min(st.n(id + '-d'), sal, cap);
      const cuMax = age === '60' ? L.cu6063 : age === '50' ? L.cu50 : 0;
      const cu = cuOn && def >= Math.min(L.def, sal) - 1 ? Math.max(0, Math.min(cuMax, sal - def)) : 0;
      const er = Math.min(sal * st.n(id + '-e') / 100, Math.max(0, cap - def));
      const room = Math.max(0, cap - def - er);
      const at = atOn ? room : 0;
      return { sal, age, cuMax, cuOn, atOn, cap, def, cu, er, room, at, total: def + cu + er + at, rothCu: cuOn && cu > 0 };
    }
    const draw = ui.responsive(fig, (W) => {
      const m = model(); const compact = W < 520;
      const pl = 14, pr = 16;
      const top = 54, barH = compact ? 56 : 60, H = top + barH + (compact ? 112 : 96);
      const scaleMax = Math.max(L.add + Math.max(m.cuMax, L.cu6063), m.cap + m.cu) * 1.02;
      const x = SML.lin(0, scaleMax, pl, W - pr);
      let b = '';
      // ticks
      SML.ticks(0, scaleMax, compact ? 4 : 8).forEach((v) => { b += S.line(x(v), top - 6, x(v), top + barH + 6, 's-grid') + S.text(x(v), top + barH + 20, kfmt(v), 'xs mono', 'middle'); });
      // empty track to the cap (+catch-up allowance)
      b += S.rect(x(0), top, x(m.cap + (m.cuMax && m.cuOn ? m.cuMax : 0)) - x(0), barH, 'f-surf s-line w1', 4);
      const segs = [
        { v: m.def, cls: 'f-info', lab: 'you', tc: 'on' },
        { v: m.cu, cls: 'f-vio', lab: 'catch-up', tc: 'on' },
        { v: m.er, cls: 'f-up', lab: 'employer', tc: 'on' },
        { v: m.at, cls: 'f-acc', lab: 'after-tax', tc: 'onacc' },
      ];
      // draw: deferral, then catch-up placed after the main stack so catch-up visibly sits on top of the total
      let cur = 0; const order = [segs[0], segs[2], segs[3], segs[1]];
      order.forEach((s) => { if (s.v <= 0) return; const w = x(cur + s.v) - x(cur); b += S.rect(x(cur), top, w, barH, s.cls, 0); if (w > (compact ? 54 : 70)) b += S.text(x(cur) + w / 2, top + barH / 2 + 4, compact ? kfmt(s.v) : s.lab + ' ' + kfmt(s.v), 'sm b ' + s.tc, 'middle'); cur += s.v; });
      if (!m.atOn && m.room > 0) { const w = x(m.def + m.er + m.room) - x(m.def + m.er); b += S.rect(x(m.def + m.er), top + 1, w, barH - 2, 'f-dn-t', 0) + (w > 60 ? S.text(x(m.def + m.er) + w / 2, top + barH / 2 + 4, 'unused ' + kfmt(m.room), 'sm dn b', 'middle') : ''); }
      // markers
      const mk = (v, label, cls, row) => { const xx = x(v); const ly = row === 0 ? top - 26 : top - 10; return S.line(xx, ly + 4, xx, top + barH + 4, cls + ' dash w15') + S.text(SML.clamp(xx, pl + 60, W - pr - 4), ly, label, 'sm b ' + (cls === 's-info' ? 'info' : 'acc'), xx > W - pr - 120 ? 'end' : 'middle'); };
      b += mk(Math.min(L.def, m.sal), (compact ? 'you: ' : 'employee limit ') + kfmt(Math.min(L.def, m.sal)), 's-info', 1);
      b += mk(m.cap, (compact ? 'total ' : 'total limit ') + kfmt(m.cap), 's-acc', 0);
      // legend under the bar
      const ly = top + barH + 44; let lx = pl;
      [['f-info', 'you ' + kfmt(m.def)], ['f-up', 'employer ' + kfmt(m.er)], ['f-acc', 'after-tax ' + kfmt(m.at)], ['f-vio', 'catch-up ' + kfmt(m.cu)]].filter((q, i) => i < 3 || m.cuMax > 0).forEach(([c, t], i) => {
        if (compact && i === 2) { lx = pl; }
        const yy = compact && i >= 2 ? ly + 22 : ly;
        b += S.rect(lx, yy - 10, 12, 12, c, 2) + S.text(lx + 18, yy, t, 'sm ink'); lx += compact ? 150 : 170;
      });
      b += S.text(pl, compact ? ly + 50 : ly + 26, m.cu > 0 ? `catch-up sits on top: up to ${kfmt(m.cap + m.cuMax)} in all` : 'the match does not use up your own limit', 'xs', 'start');
      fig.innerHTML = S.wrap(W, H, `401(k) contributions stacked against the ${usd(L.add)} total limit: ${usd(m.total)} going in`, b);
      setT(id + '-tot', usd(m.total));
      setT(id + '-me', usd(m.def + m.cu));
      setT(id + '-er', usd(m.er), 'up');
      setT(id + '-at', usd(m.room), m.room > 0 ? 'acc' : '');
      let msg;
      if (m.sal < L.add) msg = ['info', 'Pay caps it', `Total additions can't exceed 100% of pay, so your cap is ${usd(m.cap)} instead of ${usd(L.add)}.`];
      else if (m.def < L.def) msg = ['acc', 'Room to grow', `You defer ${usd(m.def)} of the ${usd(L.def)} employee limit. Your employer's ${usd(m.er)} comes on top and never uses up your own limit.`];
      else if (m.atOn) msg = ['up', 'Fully used', `Your ${usd(m.def)} plus ${usd(m.er)} from your employer leaves ${usd(m.room)} of room under the ${usd(L.add)} total. After-tax contributions can fill it, then convert to Roth (the mega backdoor).`];
      else msg = ['dn', 'Room unused', `You and your employer put in ${usd(m.def + m.er)}. ${usd(m.room)} of the ${usd(L.add)} total stays empty because this plan has no after-tax option.`];
      if (m.rothCu && m.sal > L.rothCuWage) msg[2] += ` From 2026, if last year's Social Security wages from this employer topped ${usd(L.rothCuWage)}, your catch-ups must go in as Roth.`;
      setMsg(id + '-msg', msg[0], msg[1], msg[2]);
    });
  };

  /* =====================================================================
     3. megaBackdoor — after-tax → Roth; growth vs leaving it or taxable
     ===================================================================== */
  SML.widgets.megaBackdoor = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('mb');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">How you convert</span>${ui.seg(id + '-h', [{ v: 'inplan', label: 'In-plan Roth conversion' }, { v: 'inservice', label: 'In-service withdrawal to Roth IRA' }], 'inplan', 'Conversion method')}</div>
      <ol class="w4k-steps" id="${id}-steps"></ol>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-a', label: 'After-tax money per year', min: 1000, max: 45000, step: 500, value: opts.amount || 20000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-y', label: 'Years until you retire', min: 5, max: 35, step: 1, value: 20, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-r', label: 'Yearly return', min: 2, max: 10, step: 0.5, value: 7, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-t', label: 'Your tax rate in retirement', min: 10, max: 37, step: 1, value: 24, fmt: 'pct' })}
      </div>
      <div class="wg-bar"><span class="wg-title">Convert</span>${ui.seg(id + '-w', [{ v: 'now', label: 'Every paycheck' }, { v: 'yr', label: 'Once a year' }], 'now', 'How often')}</div>
      <div class="wg-read">${ui.stat('Converted to Roth', id + '-roth', 'hl big')}${ui.stat('Left after-tax, never converted', id + '-left')}${ui.stat('Taxable brokerage instead', id + '-tax')}${ui.stat('Tax due at conversion / yr', id + '-cv')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">All values are after tax at retirement. After-tax money left unconverted: earnings taxed as income when withdrawn. Taxable brokerage: 1.5% dividend yield taxed at 15% each year, gains taxed at 15% at the end. Contributions at year end; a simple steady return.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    const st = ui.wire(root, () => draw());
    let G = null;
    function steps() {
      const inplan = st.seg(id + '-h') === 'inplan';
      const list = ['Max your regular pre-tax or Roth 401(k) deferral first.', 'Check the plan allows after-tax (non-Roth) contributions, and set a % of pay.', inplan ? 'Turn on automatic in-plan Roth conversion so the money moves to the Roth 401(k).' : 'Request in-service withdrawals of the after-tax money and roll it into your Roth IRA.', inplan ? 'Pay tax only on any small earnings before each conversion.' : 'Send any earnings to a traditional IRA, or pay tax on them.'];
      $id(id + '-steps').innerHTML = list.map((t, i) => `<li><b>${i + 1}</b><span>${t}</span></li>`).join('');
    }
    function series() {
      const A = st.n(id + '-a'), Y = st.n(id + '-y'), r = st.n(id + '-r') / 100, t = st.n(id + '-t') / 100;
      const rt = r - 0.015 * 0.15; const roth = [0], left = [0], taxa = [0];
      let b1 = 0, b3 = 0, basis = 0;
      for (let i = 1; i <= Y; i++) {
        b1 = b1 * (1 + r) + A; b3 = b3 * (1 + rt) + A; basis += A;
        roth.push(b1); left.push(b1 - t * Math.max(0, b1 - basis)); taxa.push(b3 - 0.15 * Math.max(0, b3 - basis));
      }
      const yearly = st.seg(id + '-w') === 'yr';
      const convTax = yearly ? A * (Math.pow(1 + r, 0.5) - 1) * t : 0;
      return { A, Y, r, t, roth, left, taxa, basis, convTax };
    }
    const draw = ui.responsive(fig, (W) => {
      steps();
      const s = series(); const compact = W < 480;
      const gross = s.roth[s.Y], basis = s.basis;
      const rows = [
        { name: 'Converted to Roth', kept: s.roth[s.Y], c: 'up' },
        { name: 'Taxable brokerage instead', kept: s.taxa[s.Y], c: 'info' },
        { name: 'Left after-tax, not converted', kept: s.left[s.Y], c: 'acc' },
      ];
      const pl = 8, pr = 10, top = compact ? 52 : 40, rowH = compact ? 66 : 62, barH = compact ? 24 : 28;
      const H = top + rows.length * rowH + 8;
      const x = SML.lin(0, gross, pl, W - pr);
      let b = '';
      // legend
      const lg = [['f-shade2', 'what you put in ' + kfmt(basis)], ['f-up', 'growth you keep'], ['f-dn-t s-dn w1', 'lost to tax']];
      let lx = pl;
      lg.forEach(([c, t], i) => { const yy = compact && i === 2 ? 36 : 18; if (compact && i === 2) lx = pl; b += S.rect(lx, yy - 10, 12, 12, c, 2) + S.text(lx + 18, yy, t, 'sm ink'); lx += compact ? (i === 0 ? 172 : 130) : (i === 0 ? 200 : 150); });
      rows.forEach((r, k) => {
        const y0 = top + k * rowH; const by = y0 + 18;
        const tax = Math.max(0, gross - r.kept);
        b += S.text(pl, y0 + 10, r.name, 'sm ink b') + S.text(W - pr, y0 + 10, kfmt(r.kept) + (tax > 0.5 ? '' : ' · no tax'), 'md b ' + r.c, 'end');
        b += S.rect(x(0), by, x(basis) - x(0), barH, 'f-shade2', 3);
        b += S.rect(x(basis), by, x(r.kept) - x(basis), barH, 'f-' + r.c, 0);
        if (tax > 0.5) {
          b += S.rect(x(r.kept), by, x(gross) - x(r.kept), barH, 'f-dn-t s-dn w1', 0);
          if (x(gross) - x(r.kept) > (compact ? 52 : 70)) b += S.text((x(r.kept) + x(gross)) / 2, by + barH / 2 + 4, '−' + kfmt(tax), 'sm dn b', 'middle');
          else b += S.text(x(r.kept) - 6, by + barH / 2 + 4, '−' + kfmt(tax), 'sm onacc b', 'end');
        }
        if (x(basis) - x(0) > 60 && k === 0) b += S.text(x(0) + 8, by + barH / 2 + 4, 'you put in', 'xs ink');
      });
      fig.innerHTML = S.wrap(W, H, `After-tax value of ${usd(s.A)} a year for ${s.Y} years: Roth ${usd(s.roth[s.Y])}, taxable ${usd(s.taxa[s.Y])}, not converted ${usd(s.left[s.Y])}`, b);
      const gap = s.roth[s.Y] - s.left[s.Y];
      setT(id + '-roth', usd(s.roth[s.Y]));
      setT(id + '-left', usd(s.left[s.Y]), 'acc');
      setT(id + '-tax', usd(s.taxa[s.Y]), 'info');
      setT(id + '-cv', s.convTax > 0.5 ? usd(s.convTax) : '≈ $0', s.convTax > 0.5 ? 'dn' : 'up');
      const extra = s.convTax > 0.5 ? ` Converting once a year lets about ${usd(s.convTax / s.t)} of earnings build up first, and that is taxed as income when you convert. Converting every paycheck keeps it near zero.` : '';
      setMsg(id + '-msg', 'up', 'Tax-free growth', `Over ${s.Y} years, ${usd(s.basis)} of after-tax money grows to ${usd(s.roth[s.Y])} in Roth. Leaving it unconverted costs ${usd(gap)} in tax on the earnings.${extra}`);
    });
  };

  /* =====================================================================
     4. hsaCalc — spend it now vs invest it and save receipts
     ===================================================================== */
  SML.widgets.hsaCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('hs');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Coverage</span>${ui.seg(id + '-c', [{ v: 'self', label: 'Self-only' }, { v: 'fam', label: 'Family' }], 'self', 'Coverage')}${ui.seg(id + '-yr', [{ v: '2026', label: '2026 limits' }, { v: '2027', label: '2027 limits' }], '2026', 'Limit year')}<span class="grow"></span>${ui.chips(id + '-k', [{ k: 'cu', label: '55+ catch-up', color: 'var(--violet)', on: false }, { k: 'pr', label: 'Through payroll', color: 'var(--info)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-p', label: 'You put in (% of the limit)', min: 10, max: 100, step: 5, value: 100, fmt: 'pct' })}
        ${ui.slider({ id: id + '-a', label: 'Your age now', min: 22, max: 60, step: 1, value: opts.age || 35, fmt: (v) => v + '' })}
        ${ui.slider({ id: id + '-m', label: 'Medical bills per year', min: 0, max: 6000, step: 100, value: 1000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-r', label: 'Yearly return if invested', min: 0, max: 10, step: 0.5, value: 7, fmt: 'pct1' })}
      </div>
      <div class="wg-bar"><span class="wg-title">Federal bracket</span>${ui.seg(id + '-t', ['10', '12', '22', '24', '32', '35'].map((v) => ({ v, label: v + '%' })), '22', 'Federal tax bracket')}</div>
      <div class="wg-read">${ui.stat('Tax saved each year', id + '-ts', 'hl')}${ui.stat('At 65 if you invest it', id + '-inv', 'big')}${ui.stat('At 65 if you spend it', id + '-sp')}${ui.stat('Receipts you can cash later', id + '-rc')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Invest it: you pay bills out of pocket, keep the receipts, and can reimburse yourself tax-free any time later. Spend it: bills come out of the HSA each year and only what is left is invested. Uses one year's limit for every year, so it understates future limits. Ignores state tax (California and New Jersey tax HSAs).</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    const st = ui.wire(root, () => draw());
    let G = null;
    function series() {
      const fam = st.seg(id + '-c') === 'fam', age0 = st.n(id + '-a');
      const Y27 = st.seg(id + '-yr') === '2027';
      const lim = (fam ? (Y27 ? HSA27.fam : HSA.fam) : (Y27 ? HSA27.self : HSA.self)) + (st.on(id + '-k', 'cu') ? HSA.cu55 : 0);
      const C = lim * st.n(id + '-p') / 100, M = st.n(id + '-m'), r = st.n(id + '-r') / 100;
      const rate = Number(st.seg(id + '-t')) / 100 + (st.on(id + '-k', 'pr') ? 0.0765 : 0);
      const N = Math.max(1, 65 - age0); const inv = [0], sp = [0], rc = [0];
      let a = 0, b = 0, rcpt = 0, unpaid = 0;
      for (let i = 1; i <= N; i++) {
        a = a * (1 + r) + C; rcpt += M;
        b = b * (1 + r) + C; const pay = Math.min(b, M); b -= pay; unpaid += M - pay;
        inv.push(a); sp.push(b); rc.push(rcpt);
      }
      return { fam, lim, C, M, r, rate, N, age0, inv, sp, rc, taxSaved: C * rate };
    }
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4) { tip.hide(); return; }
      const i = Math.round(SML.clamp(G.x.inv(p.x), 0, G.s.N));
      tip.show(G.x(i), G.y(G.s.inv[i]), `Age ${G.s.age0 + i}<br><span class="up">Invested ${usd(G.s.inv[i])}</span><br><span class="info">Spent as you go ${usd(G.s.sp[i])}</span><br><span class="acc">Receipts ${usd(G.s.rc[i])}</span>`, G.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
    const draw = ui.responsive(fig, (W) => {
      const s = series(); const compact = W < 480;
      const pl = compact ? 46 : 56, pr = compact ? 16 : 118, pt = 22, pb = 30;
      const H = Math.round(SML.clamp(W * 0.42, 230, 310));
      const yMax = Math.max(...s.inv, ...s.rc, 1) * 1.08;
      const x = SML.lin(0, s.N, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(s.age0, 65, compact ? 4 : 7).filter((v) => Number.isInteger(v) && v >= s.age0).forEach((v) => (b += S.text(x(v - s.age0), H - pb + 16, String(v), 'xs mono', 'middle')));
      b += S.text(W - pr, H - 2, 'age', 'xs', 'end');
      const P = (arr) => arr.map((v, i) => [x(i), y(v)]);
      b += S.area(P(s.inv), H - pb, 'f-up-t') + S.poly(P(s.inv), 's-up w25') + S.poly(P(s.sp), 's-info w2') + S.poly(P(s.rc), 's-acc w2 dash');
      const ends = [[s.inv[s.N], 'invested', 'up'], [s.rc[s.N], 'receipts', 'acc'], [s.sp[s.N], 'spent', 'info']].sort((a, c) => c[0] - a[0]);
      const ly = ends.map((e) => y(e[0])); for (let k = 1; k < 3; k++) if (ly[k] - ly[k - 1] < 15) ly[k] = ly[k - 1] + 15;
      ends.forEach((e, k) => { b += S.circle(x(s.N), y(e[0]), 4, 'f-' + e[2]); if (!compact) b += S.text(x(s.N) + 8, ly[k] + 4, e[1] + ' ' + kfmt(e[0]), 'sm b ' + e[2]); });
      if (compact) b += S.text(pl + 4, pt + 4, 'green invested · blue spent · amber receipts', 'xs');
      fig.innerHTML = S.wrap(W, H, `HSA at 65: ${usd(s.inv[s.N])} if invested versus ${usd(s.sp[s.N])} if spent each year`, b);
      G = { W, pl, pr, x, y, s };
      setT(id + '-ts', usd(s.taxSaved));
      setT(id + '-inv', usd(s.inv[s.N]), 'up');
      setT(id + '-sp', usd(s.sp[s.N]), 'info');
      setT(id + '-rc', usd(s.rc[s.N]), 'acc');
      if (s.M >= s.C) setMsg(id + '-msg', 'info', 'Bills eat it', `Your bills (${usd(s.M)}) are bigger than what you put in (${usd(s.C)}), so spending it leaves nothing to grow. Paying out of pocket, if you can, turns the HSA into a ${usd(s.inv[s.N])} account by 65.`);
      else setMsg(id + '-msg', 'up', 'Triple tax break', `Putting in ${usd(s.C)} a year, you skip about ${usd(s.taxSaved)} of tax going in. Invested, the money grows untaxed to ${usd(s.inv[s.N])} by 65, and ${usd(s.rc[s.N])} of saved receipts can come out tax-free whenever you want.`);
    });
  };

  /* =====================================================================
     5. planPicker — HDHP + HSA vs PPO total yearly cost by medical use
     ===================================================================== */
  const HSA27D = { ddSelf: 1750, ddFam: 3500 }; // 2027 HDHP minimum deductibles, Rev. Proc. 2026-24
  const PLANS = {
    self: { hd: { ded: HSA27D.ddSelf, co: 0.2, oop: 5000 }, ppo: { ded: 500, co: 0.2, oop: 3500 }, prem: { hd: 600, ppo: 1800 }, seed: 500, max: 12000 },
    fam: { hd: { ded: HSA27D.ddFam, co: 0.2, oop: 10000 }, ppo: { ded: 1000, co: 0.2, oop: 7000 }, prem: { hd: 3000, ppo: 6500 }, seed: 1000, max: 25000 },
  };
  const oopCost = (p, spend) => Math.min(p.oop, spend <= p.ded ? spend : p.ded + p.co * (spend - p.ded));
  SML.widgets.planPicker = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('pp');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Coverage</span>${ui.seg(id + '-c', [{ v: 'self', label: 'Just me' }, { v: 'fam', label: 'Family' }], 'self', 'Coverage')}<span class="grow"></span>${ui.seg(id + '-u', [{ v: 'low', label: 'Healthy year' }, { v: 'mid', label: 'Some visits' }, { v: 'hi', label: 'Surgery or baby' }], 'mid', 'Expected use')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-s', label: 'Expected medical bills this year', min: 0, max: 25000, step: 250, value: 2500, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-hp', label: 'HDHP: your premiums per year', min: 0, max: 8000, step: 100, value: PLANS.self.prem.hd, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-pp', label: 'PPO: your premiums per year', min: 0, max: 12000, step: 100, value: PLANS.self.prem.ppo, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-e', label: 'Employer HSA deposit', min: 0, max: 2000, step: 50, value: PLANS.self.seed, fmt: 'usd0' })}
      </div>
      <div class="wg-bar"><span class="wg-title">Tax rate saved on pre-tax bills</span>${ui.seg(id + '-t', ['12', '22', '24', '32'].map((v) => ({ v, label: v + '% + FICA' })), '22', 'Tax rate')}</div>
      <div class="wg-read">${ui.stat('HDHP + HSA, all-in', id + '-h', 'big')}${ui.stat('PPO, all-in', id + '-p', 'big')}${ui.stat('Cheaper this year', id + '-w', 'hl')}${ui.stat('Worst case: HDHP / PPO', id + '-wc')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    let lastCov = 'self';
    const st = ui.wire(root, (e) => {
      const t = e && e.target && e.target.closest ? e.target.closest('.seg') : null;
      const cov = st.seg(id + '-c'), P = PLANS[cov];
      if (cov !== lastCov) { lastCov = cov; st.set(id + '-hp', P.prem.hd); st.set(id + '-pp', P.prem.ppo); st.set(id + '-e', P.seed); }
      if (t && t.id === id + '-u') { const u = st.seg(id + '-u'); st.set(id + '-s', (u === 'low' ? 0.08 : u === 'mid' ? 0.25 : 0.8) * P.max); }
      draw();
    });
    let G = null;
    function cost(cov, spend) {
      const P = PLANS[cov], rate = Number(st.seg(id + '-t')) / 100 + 0.0765;
      const lim = cov === 'fam' ? HSA27.fam : HSA27.self, seed = st.n(id + '-e');
      const ho = oopCost(P.hd, spend), po = oopCost(P.ppo, spend);
      const hsaTax = rate * Math.max(0, Math.min(ho, lim) - seed); // bills paid from your own pre-tax HSA money
      const fsaTax = rate * Math.min(po, 3400); // health FSA limit (2026 figure; 2027 not yet announced)
      return { hd: st.n(id + '-hp') + ho - seed - hsaTax, ppo: st.n(id + '-pp') + po - fsaTax, ho, po };
    }
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4) { tip.hide(); return; }
      const sp = Math.round(SML.clamp(G.x.inv(p.x), 0, G.max) / 100) * 100; const c = cost(G.cov, sp);
      tip.show(G.x(sp), G.y(Math.max(c.hd, c.ppo)), `Bills ${usd(sp)}<br><span class="up">HDHP ${usd(c.hd)}</span><br><span class="info">PPO ${usd(c.ppo)}</span>`, G.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
    ui.drag(fig, { sel: '.handle', move(pt) { if (!G) return; st.set(id + '-s', Math.round(SML.clamp(G.x.inv(pt.x), 0, 25000) / 250) * 250); draw(); } });
    const draw = ui.responsive(fig, (W) => {
      const cov = st.seg(id + '-c'), P = PLANS[cov]; const compact = W < 480;
      const spend = st.n(id + '-s');
      const max = Math.max(P.max, spend);
      const pl = compact ? 46 : 56, pr = 16, pt = 26, pb = 34;
      const H = Math.round(SML.clamp(W * 0.42, 240, 310));
      const pts = []; let maxY = 0, cross = null, prevD = null;
      for (let s = 0; s <= max; s += max / 120) { const c = cost(cov, s); pts.push([s, c.hd, c.ppo]); maxY = Math.max(maxY, c.hd, c.ppo); const d = c.hd - c.ppo; if (prevD !== null && prevD < 0 && d >= 0 && cross === null) cross = s; prevD = d; }
      const x = SML.lin(0, max, pl, W - pr), y = SML.lin(0, maxY * 1.12, H - pb, pt);
      let b = '';
      SML.ticks(0, maxY * 1.12, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, max, compact ? 4 : 6).forEach((v) => (b += S.text(x(v), H - pb + 16, kfmt(v), 'xs mono', 'middle')));
      b += S.text(W - pr, H - 4, 'medical bills in the year', 'xs', 'end');
      b += S.poly(pts.map((q) => [x(q[0]), y(q[2])]), 's-info w25') + S.poly(pts.map((q) => [x(q[0]), y(q[1])]), 's-up w25');
      if (cross !== null) { b += S.line(x(cross), pt, x(cross), H - pb, 's-mut dash2') + S.text(x(cross) + 6, pt + 10, (compact ? 'PPO wins past ' : 'PPO cheaper past ') + kfmt(cross), 'xs ink b'); }
      const lastI = pts[pts.length - 1];
      b += S.text(W - pr - 4, y(lastI[2]) + (lastI[2] > lastI[1] ? -8 : 14), 'PPO', 'sm info b', 'end') + S.text(W - pr - 4, y(lastI[1]) + (lastI[1] >= lastI[2] ? -8 : 14), 'HDHP + HSA', 'sm up b', 'end');
      const c = cost(cov, spend), sx = x(spend);
      b += S.line(sx, pt, sx, H - pb, 's-acc w15');
      b += S.circle(sx, y(c.hd), 4.5, 'f-up') + S.circle(sx, y(c.ppo), 4.5, 'f-info');
      b += `<g class="handle" style="cursor:ew-resize">${S.rect(sx - 9, H - pb - 22, 18, 22, 'f-acc', 4)}${S.text(sx, H - pb - 7, '↔', 'sm onacc b', 'middle')}</g>`;
      b += S.text(SML.clamp(sx, pl + 40, W - pr - 40), pt - 8, 'your year: ' + kfmt(spend), 'sm acc b', 'middle');
      fig.innerHTML = S.wrap(W, H, `Total yearly cost by medical spending: HDHP ${usd(c.hd)}, PPO ${usd(c.ppo)} at ${usd(spend)} of bills`, b);
      G = { W, pl, pr, x, y, max, cov };
      const wcH = st.n(id + '-hp') + P.hd.oop - st.n(id + '-e'), wcP = st.n(id + '-pp') + P.ppo.oop;
      setT(id + '-h', usd(c.hd), c.hd <= c.ppo ? 'up' : '');
      setT(id + '-p', usd(c.ppo), c.ppo < c.hd ? 'up' : '');
      setT(id + '-w', (c.hd <= c.ppo ? 'HDHP by ' : 'PPO by ') + usd(Math.abs(c.hd - c.ppo)));
      setT(id + '-wc', kfmt(wcH) + ' / ' + kfmt(wcP));
      if (c.hd <= c.ppo) setMsg(id + '-msg', 'up', 'HDHP wins', `With ${usd(spend)} of bills, the HDHP plus HSA costs ${usd(c.ppo - c.hd)} less all-in. The premium you save can go into the HSA and grow for later.${cross !== null ? ` The PPO only wins if bills pass about ${usd(cross)}.` : ''}`);
      else setMsg(id + '-msg', 'info', 'PPO wins', `With ${usd(spend)} of bills, the PPO costs ${usd(c.hd - c.ppo)} less. Heavy-use years (surgery, a baby, ongoing treatment) tend to favor the plan with the lower deductible and out-of-pocket max.`);
      $id(id + '-note').textContent = `Sample 2027 plans: HDHP deductible ${usd(P.hd.ded)} (the 2027 HSA-eligible minimum), then 20%, out-of-pocket max ${usd(P.hd.oop)}; PPO deductible ${usd(P.ppo.ded)}, then 20%, out-of-pocket max ${usd(P.ppo.oop)}. HSA tax savings use the 2027 limits; FSA savings use the 2026 $3,400 limit. All-in = your premiums + your share of bills − employer HSA money − tax saved paying bills with pre-tax HSA or FSA money. Use your employer's real numbers; copays and networks also matter.`;
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    loans: { t: 'IRS: Retirement plans FAQs regarding loans', u: 'https://irs.gov/retirement-plans/retirement-plans-faqs-regarding-loans' },
    n2567: { t: 'IRS Notice 2025-67: 2026 retirement plan limits (deferral, catch-up, $72,000 total, $360,000 pay cap, Roth catch-up wage test)', u: 'https://www.irs.gov/pub/irs-drop/n-25-67.pdf' },
    vest: { t: 'IRS: Issue snapshot, vesting schedules for matching contributions', u: 'https://www.irs.gov/retirement-plans/issue-snapshot-vesting-schedules-for-matching-contributions' },
    frontload: { t: 'PLANSPONSOR: matching when deferrals are front-loaded (true-up)', u: 'https://www.plansponsor.com/blines-ask-experts-match-deferrals-front-loaded/' },
    rothcu: { t: 'IRS: final regulations on the new Roth catch-up rule (IR-2025-91)', u: 'https://www.irs.gov/newsroom/treasury-irs-issue-final-regulations-on-new-roth-catch-up-rule-other-secure-2point0-act-provisions' },
    mega: { t: 'Journal of Accountancy: how the mega backdoor Roth works', u: 'https://www.journalofaccountancy.com/news/2023/may/how-mega-backdoor-roth-works/' },
    p969: { t: 'IRS Publication 969: Health Savings Accounts and other tax-favored health plans', u: 'https://www.irs.gov/publications/p969' },
    obbbaHsa: { t: 'KPMG: IRS Notice 2026-5, expanded HSA eligibility under the 2025 tax law', u: 'https://kpmg.com/us/en/taxnewsflash/news/2025/12/notice-2026-5-expanded-hsa-eligibility-under-obbba.html' },
    hsa2027: { t: 'IFEBP: IRS releases 2027 HSA and HDHP amounts (Rev. Proc. 2026-24)', u: 'https://www.ifebp.org/detail-pages/news/2026/06/01/irs-releases-2027-hsa--hdhp--and-hra-inflation-adjusted-amounts' },
    ir25103: { t: 'IRS IR-2025-103: 2026 inflation adjustments (health FSA $3,400, commuter $340 a month)', u: 'https://www.irs.gov/node/151941' },
    dcfsa: { t: 'Polsinelli: dependent care FSA limit rises to $7,500 for 2026', u: 'https://www.polsinelli.com/publications/new-year-new-dependent-care-fsa-limits' },
    irs401k: { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit increases to $7,500 (Notice 2025-67)', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
    chase415: { t: 'Chase: 401(k) contribution limits for 2026, including the $72,000 combined limit', u: 'https://www.chase.com/personal/investments/learning-and-insights/article/401k-contribution-limits-2026' },
    hsa2026: { t: 'Thomson Reuters: IRS announces 2026 HSA limits, HDHP deductibles and out-of-pocket maximums (Rev. Proc. 2025-19)', u: 'https://tax.thomsonreuters.com/news/irs-announces-2026-hsa-and-ebhra-contribution-limits-hdhp-minimum-deductibles-and-hdhp-out-of-pocket-maximums/' },
    fsa2026: { t: 'GoodRx: 2026 FSA limits (health FSA $3,400, dependent care FSA $7,500)', u: 'https://www.goodrx.com/insurance/fsa-hsa/fsa-limits-2026' },
  };

  SML.lessons.push({
    id: 'l-401k-match', course: 'benefits', order: 1, title: 'The 401(k) match is free money', mins: 7, level: 'Beginner',
    summary: 'How employer matching works, how much you leave behind, and the traps.',
    idea: 'Your employer adds money when you save. Not saving enough to get all of it is turning down part of your pay.',
    widget: 'matchCalc',
    try: 'Pick a match formula, then drag the dot. Push the contribution past 30% to see what front-loading does to the paycheck strip.',
    body: [
      '<p>Most companies with a 401(k) add money to your account when you contribute. That is the <b>employer match</b>. It is part of your pay package, and the only way to collect it is to contribute yourself.</p>',
      '<h3>How the common formulas work</h3><ul><li><b>100% up to 4%</b>: put in 4% of pay and the company adds another 4%.</li><li><b>50% of 6%</b>: put in 6% and the company adds 3%. Putting in 3% only gets you 1.5%.</li><li><b>100% of the first 3% plus 50% of the next 2%</b>: a common "safe harbor" formula. Put in 5% and the company adds 4%.</li></ul><p>Your plan documents (the summary plan description) or HR spell out your formula. Find the contribution rate that captures all of it: that rate is your floor.</p>',
      '<h3>The match is on top of your own limit</h3><p>In 2026 you can defer up to $24,500 of your own pay. The match does not count against that number. It counts only toward a bigger total limit of $72,000 a year, which the <a href="#l-401k-limits">next lesson</a> covers.</p>',
      '<h3>Vesting: when the match becomes yours</h3><p>Your own contributions are always 100% yours. The employer money can come with a <b>vesting</b> schedule. The law allows at most a 3-year cliff (nothing until year 3, then everything) or a 6-year graded schedule (20% a year from year 2). Traditional safe harbor matches vest right away; automatic-enrollment safe harbor plans (called QACAs) can require up to two years of service. If you are thinking about leaving, check how close you are to the next vesting date.</p>',
      '<h3>The front-loading trap</h3><p>Many plans calculate the match each paycheck. If you contribute a big share of pay early and hit the yearly limit in, say, September, the paychecks after that get no match. Some plans pay a <b>true-up</b> at year end to fix it; many do not. If yours does not, spread your contributions so they last all 26 paychecks.</p>',
      '<h3>Newer options worth asking about</h3><ul><li><b>Roth match.</b> You choose whether your own money goes in pre-tax or Roth (see <a href="#l-trad-vs-roth">Traditional or Roth?</a>). Since SECURE 2.0, plans may also let you take the match as Roth. It is then fully vested and counts as taxable income that year.</li><li><b>Student-loan match.</b> Plans may treat your student-loan payments as if they were 401(k) contributions and match them, so paying off loans no longer means missing the match.</li><li><b>High earners.</b> Employers can only count the first $360,000 of pay in 2026 when figuring contributions.</li></ul>',
      '<h3>When you leave</h3><p>Your contributions and the vested part of the match go with you. Do not cash out: that triggers income tax and usually a 10% penalty before 59½. Roll the money into your new 401(k) or an IRA, or leave it where it is. Two cases where keeping it in a 401(k) beats an IRA:</p><ul><li><b>You leave in or after the year you turn 55.</b> The Rule of 55 lets you withdraw from that employer’s 401(k) without the 10% penalty; money rolled to an IRA loses that exception (see <a href="#l-retire-countdown">the ten-year countdown</a>).</li><li><b>You plan backdoor Roth contributions.</b> Pre-tax IRA balances make part of each conversion taxable under the pro-rata rule; pre-tax money in a 401(k) does not count (see <a href="#l-backdoor-roth">the backdoor Roth</a>).</li></ul>',
      '<h3>Use the plan wisely</h3><ul><li><b>Pick the funds.</b> Check the plan’s fund menu and fees. A low-cost index fund or a target-date fund is usually the best choice; avoid funds charging much more than a fraction of a percent a year (see <a href="#l-index-funds">index funds</a> and <a href="#l-allocation">asset allocation</a>).</li><li><b>401(k) loans.</b> If your plan allows them, you can borrow the lesser of $50,000 or the greater of $10,000 or 50% of your vested balance, repaid within five years (longer for a home purchase) through payroll. The interest goes back into your own account, but the borrowed money misses market growth and you repay it with after-tax pay. If you leave the job, the unpaid balance is treated as a withdrawal unless you repay or roll that amount into an IRA by your tax-return due date (with extensions) for that year; otherwise it is taxed, plus 10% before 59½.</li><li><b>Hardship withdrawals.</b> Some plans allow them for an immediate, heavy financial need. They are taxed as income, usually with the 10% penalty before 59½, and the money can never go back in. Since SECURE 2.0, plans may also allow one emergency withdrawal a year of up to $1,000 without the penalty. Treat both as a last resort after your emergency fund.</li></ul>',
    ],
    example: {
      title: 'Half the match left behind',
      intro: 'Maya earns $80,000. Her plan matches 50% of the first 6% of pay.',
      steps: [
        'Maya contributes 3% of pay: $2,400 a year. The match is 50% of that, $1,200.',
        'If she contributed 6% ($4,800), the match would be 50% of $4,800: $2,400.',
        'At 3% she leaves $1,200 of free money behind every year.',
        'Raising her rate costs $2,400 more of pay before tax, and earns $1,200 of match: an instant 50% return before any market growth.',
        'Invested for 30 years at 7%, $1,200 a year grows to about $113,000 ($1,200 × 94.46).',
      ],
      result: 'Moving from 3% to 6% is worth roughly $113,000 by retirement from the match alone.',
    },
    mistakes: [
      'Contributing less than the match formula needs, even for a year or two. Missed match can never be made up later.',
      'Maxing out early in a plan that matches per paycheck and has no true-up, so the last months get no match.',
      'Quitting a few weeks before a vesting date and forfeiting thousands of dollars of employer money.',
      'Assuming the match counts against your $24,500 limit and contributing less because of it.',
      'Cashing out an old 401(k) when you change jobs, or leaving a 401(k) loan unpaid, and losing a big slice to tax and penalties.',
    ],
    points: [
      'Always contribute at least enough to get the full match. It is an instant 25% to 100% return.',
      'The match comes on top of your own deferral limit.',
      'Check vesting before you change jobs.',
      'If you plan to max out, ask HR whether the plan has a true-up, or spread your contributions across all paychecks.',
    ],
    terms: ['401(k)', 'Employer match', 'Vesting', 'True-up', 'Elective deferral'],
    quiz: { q: 'Your plan matches 50% of the first 6% of pay. You earn $60,000 and contribute 4%. What is the match?', options: ['$1,200', '$1,800', '$2,400'], answer: 0, why: '4% of $60,000 is $2,400, and half of that is $1,200. Contributing 6% would raise it to $1,800.' },
    sources: [SRC.irs401k, SRC.vest, SRC.frontload, SRC.loans],
  });

  SML.lessons.push({
    id: 'l-401k-limits', course: 'benefits', order: 2, title: 'Max your 401(k): the limits most people miss', mins: 7, level: 'Intermediate',
    summary: 'Three 401(k) limits, and why your employer’s money sits on top of yours.',
    idea: 'There is a limit on what you put in and a much bigger limit on what goes in from every source.',
    widget: 'limitStack',
    try: 'Set your age, salary and employer contribution. Then switch the after-tax option off and watch the empty room appear.',
    body: [
      '<p>Most people think the 401(k) limit is one number. There are really three, and the biggest one is the one people miss.</p>',
      '<h3>Limit 1: what you defer ($24,500 in 2026)</h3><p>This is your <b>elective deferral</b> limit: the pre-tax and Roth 401(k) money you choose to take out of your pay. It is per person, not per plan, so two jobs in one year share it. It also covers 403(b) plans.</p>',
      '<h3>Limit 2: catch-up contributions</h3><ul><li>Age 50 or older by December 31: an extra $8,000 in 2026, so $32,500 of your own money.</li><li>Ages 60 to 63: a bigger catch-up of $11,250 instead of $8,000, so $35,750.</li><li>From 2026, if your Social Security wages from that employer (W-2 box 3) were above $150,000 the year before, your catch-ups must go in as Roth. Ask your plan how it handles this.</li></ul>',
      '<h3>Limit 3: everything together ($72,000 in 2026)</h3><p>The <b>annual additions limit</b> (also called the 415(c) limit) caps your deferrals plus the employer match, profit sharing and any after-tax contributions. It is $72,000 for 2026, or 100% of your pay if that is lower. Catch-up contributions are allowed on top, so up to $80,000 at 50+ and $83,250 at 60 to 63.</p><p>So yes: you can max out your own $24,500 and still receive the full match. The match never takes room from you.</p>',
      '<h3>Filling the rest of the room</h3><p>Even with a generous match, most people leave tens of thousands of dollars of room unused. If your plan accepts <b>after-tax contributions</b>, you can fill it, then convert that money to Roth. That is the <a href="#l-mega-backdoor">mega backdoor Roth</a>. Not every plan offers it, and plans that do may limit how much highly paid employees can put in after tax.</p>',
      '<h3>What order to fill things</h3><p>A common order: get the full match, then fund an HSA if eligible, then an IRA, then max the 401(k), then after-tax money. <a href="#l-ira">When to open an IRA</a> walks through it.</p>',
    ],
    example: {
      title: 'Room most people never use',
      intro: 'Jordan is 45, earns $150,000, and the employer contributes 4% of pay.',
      steps: [
        'Jordan defers the full $24,500 for 2026.',
        'The employer adds 4% of $150,000: $6,000. That does not reduce Jordan’s $24,500.',
        'Together that is $30,500 going in.',
        'The total limit is $72,000, so $72,000 − $30,500 = $41,500 of room is still open.',
        'Jordan’s plan allows after-tax contributions with in-plan Roth conversion, so Jordan adds $15,000 after tax and converts it.',
      ],
      result: 'Jordan saves $45,500 a year in the plan, $15,000 more than the "max" most people stop at.',
    },
    mistakes: [
      'Thinking the employer match reduces how much you are allowed to defer.',
      'Over-contributing across two jobs in one year: the $24,500 deferral limit is per person, so the excess must be fixed before the tax deadline.',
      'Turning 50 (or 60) and not raising your contribution to use the catch-up.',
      'Assuming after-tax room is useful without checking that the plan allows conversions to Roth.',
    ],
    points: [
      '2026: $24,500 of your own deferrals, plus $8,000 catch-up at 50+ or $11,250 at 60 to 63.',
      'The employer’s money comes on top of your deferral limit, up to $72,000 in total (or 100% of pay).',
      'Catch-ups sit on top of the $72,000.',
      'After-tax contributions can fill the leftover room if your plan allows them.',
    ],
    terms: ['Elective deferral', 'Annual additions limit', 'Catch-up contribution', 'Employer match', 'After-tax contribution'],
    sources: [SRC.n2567, SRC.irs401k, SRC.rothcu],
    quiz: { q: 'You are 40, defer $24,500 and your employer adds $10,000. How much more could go in for 2026 if your plan allows after-tax contributions?', options: ['$0, you are maxed out', '$37,500', '$47,500'], answer: 1, why: '$72,000 − $24,500 − $10,000 = $37,500 of room left under the annual additions limit.' },
  });

  SML.lessons.push({
    id: 'l-mega-backdoor', course: 'benefits', order: 3, title: 'The mega backdoor Roth', mins: 8, level: 'Advanced',
    summary: 'Turn leftover 401(k) room into tens of thousands of dollars a year of Roth money.',
    idea: 'After-tax 401(k) money converted to Roth grows tax-free, and the room for it can be far bigger than an IRA.',
    widget: 'megaBackdoor',
    try: 'Compare the three end values, then switch to converting once a year and watch the tax on earnings appear.',
    body: [
      '<p>A Roth IRA allows only $7,500 a year in 2026, and high earners cannot contribute directly. The <b>mega backdoor Roth</b> uses your 401(k) instead, and the room can be several times larger.</p>',
      '<h3>What your plan needs</h3><ul><li><b>After-tax contributions</b>: a third type of contribution, separate from pre-tax and Roth deferrals.</li><li>A way to move that money to Roth: an <b>in-plan Roth conversion</b> (to the Roth 401(k)) or <b>in-service withdrawals</b> (rolled to your Roth IRA while you still work there).</li></ul><p>Search your plan documents or benefits site for "after-tax" and "in-plan conversion", or ask HR. Many large employers offer it; many smaller plans do not.</p>',
      '<h3>Step by step</h3><ul><li>Max your normal deferral ($24,500 in 2026) and get the full match.</li><li>Work out your room: $72,000 minus your deferrals minus all employer money.</li><li>Set an after-tax contribution percentage that fills it by year end.</li><li>Turn on automatic conversion if the plan offers it, or convert often.</li><li>Keep records. The converted after-tax money was already taxed, so only earnings before conversion are taxable.</li></ul>',
      '<h3>Convert fast</h3><p>After-tax money left in the plan grows, and that growth is taxable as income when it comes out. Converting every paycheck keeps the taxable part close to zero. Leaving it for years can cost you thousands.</p>',
      '<h3>In-plan conversion or roll to a Roth IRA?</h3><p>Both work. Rolling to a Roth IRA gives you more fund choices and avoids the plan’s rules. An in-plan conversion is often automatic and simpler. When you roll out, IRS rules let you send the after-tax part to a Roth IRA and any earnings to a traditional IRA, so you do not owe tax on them now. The 1099-R can be confusing, so keep your own records.</p>',
      '<h3>Limits to know</h3><p>Plans must pass nondiscrimination tests. If not enough lower-paid employees contribute, highly paid employees can have after-tax money refunded. Equity comp and bonuses do not change the $72,000 cap. This is a good topic for a CPA or fee-only adviser if your plan rules are unclear.</p>',
    ],
    example: {
      title: '$20,000 a year into Roth',
      intro: 'Priya maxes her deferral and match, leaving $35,000 of room. Her plan allows after-tax money with automatic in-plan Roth conversion.',
      steps: [
        'She sets an after-tax contribution of $20,000 a year, about $769 per paycheck.',
        'Each paycheck the plan converts it to Roth 401(k) the same day, so there are no taxable earnings.',
        'After 20 years at 7%, $20,000 a year grows to about $819,900 ($20,000 × 40.995).',
        'She contributed $400,000, so $419,900 is growth, and all of it comes out tax-free in retirement.',
        'Left unconverted, that $419,900 of growth would be taxed as income: at 24% that is about $100,800.',
      ],
      result: 'Converting turns about $100,000 of future tax into $0.',
    },
    mistakes: [
      'Contributing after-tax money to a plan that offers no conversion or in-service withdrawal, so earnings pile up taxable.',
      'Converting once a year or less, and paying tax on months of earnings.',
      'Confusing after-tax contributions with Roth 401(k) deferrals. Roth deferrals count toward the $24,500 limit; after-tax money does not.',
      'Forgetting the plan may refund after-tax money to highly paid employees if it fails nondiscrimination testing.',
    ],
    points: [
      'The mega backdoor fills the room between your deferrals plus employer money and the $72,000 total.',
      'Your plan must allow after-tax contributions and in-plan conversion or in-service withdrawals.',
      'Convert as often as you can so almost nothing is taxable.',
      'It can move several times more money into Roth each year than a Roth IRA allows.',
    ],
    terms: ['Mega backdoor Roth', 'After-tax contribution', 'Annual additions limit', 'Roth conversion', 'Roth 401(k)'],
    glossary: [{ t: 'In-service withdrawal', d: 'Taking money out of your 401(k) while you still work for the employer, allowed only if the plan permits it.' }],
    quiz: { q: 'Why convert after-tax 401(k) money to Roth quickly?', options: ['The contribution itself is taxed again if you wait', 'Earnings before conversion are taxable, so waiting increases the tax', 'Conversions are only allowed in January'], answer: 1, why: 'The after-tax dollars were already taxed. Only the growth before conversion is taxable, so converting fast keeps that near zero.' },
    sources: [SRC.n2567, SRC.mega],
  });

  SML.lessons.push({
    id: 'l-hsa', course: 'benefits', order: 4, title: 'The HSA: a triple tax break', mins: 7, level: 'Beginner',
    summary: 'Tax-free in, tax-free growth, tax-free out: the HSA as a retirement account.',
    idea: 'An HSA is the only account where money goes in, grows and comes out without tax, if you spend it on health care.',
    widget: 'hsaCalc',
    try: 'Set your age and medical bills, then compare investing the HSA with spending it each year.',
    body: [
      '<p>A <b>health savings account</b> (HSA) comes with a high-deductible health plan (HDHP). It has the best tax deal in the US system: no tax going in, no tax on growth, and no tax coming out for qualified medical costs.</p>',
      '<h3>Who can open one</h3><p>You need HSA-eligible coverage (an HDHP), no other non-HDHP health coverage, you cannot be enrolled in Medicare, and nobody can claim you as a dependent. For 2026 an HDHP must have a deductible of at least $1,700 (self-only) or $3,400 (family).</p>',
      '<h3>Limits</h3><ul><li>2026: $4,400 for self-only coverage, $8,750 for family coverage.</li><li>2027 (already announced): $4,500 and $9,000.</li><li>Age 55 and older: an extra $1,000.</li><li>Employer deposits count toward the limit.</li></ul><p>Contributing through payroll also skips Social Security and Medicare tax (7.65%), which a 401(k) or IRA cannot do.</p>',
      '<h3>Recent changes</h3><p>The 2025 tax law widened who can use an HSA:</p><ul><li><b>From January 1, 2026</b>: bronze and catastrophic plans count as HSA-compatible, and people in a direct primary care arrangement (a flat monthly fee to a doctor, within a cap) can still contribute and can pay that fee from the HSA.</li><li><b>Telehealth</b>: free or low-cost telehealth before the deductible no longer blocks eligibility. That relief is now permanent and applies to plan years beginning on or after January 1, 2025.</li></ul>',
      '<h3>Treat it like a retirement account</h3><ul><li><b>Invest it.</b> Many HSAs start in cash. Move most of it into low-cost index funds.</li><li><b>Pay small bills out of pocket if you can</b> and keep every receipt. There is no deadline: you can reimburse yourself tax-free years later, as long as the expense came after you opened the HSA.</li><li><b>After 65</b>, you can withdraw for anything. Non-medical withdrawals are taxed like a traditional IRA; medical ones stay tax-free. Before 65, non-medical withdrawals owe tax plus a 20% penalty.</li></ul>',
      '<h3>Watch-outs</h3><ul><li>California and New Jersey do not follow the federal HSA rules, so state tax applies there.</li><li>Stop contributing once you enroll in Medicare, and note that Part A coverage can be backdated up to six months when you sign up after 65.</li><li>A health FSA is different: it is "use it or lose it" for the year (with a small carryover), and it does not grow.</li></ul>',
      '<p>Whether the HDHP is the right plan for your family is the question in <a href="#l-open-enrollment">Open enrollment</a>.</p>',
    ],
    example: {
      title: 'An HSA that funds retirement',
      intro: 'Sam is 35, has self-only HDHP coverage, and is in the 22% bracket.',
      steps: [
        'Sam contributes the 2026 maximum, $4,400, through payroll.',
        'Tax saved: 22% federal plus 7.65% payroll tax is 29.65%, about $1,305 a year.',
        'Sam pays about $1,000 of yearly medical bills out of pocket and saves the receipts.',
        'Invested at 7% for 30 years, $4,400 a year grows to about $415,600 ($4,400 × 94.46).',
        'By 65 Sam has $30,000 of saved receipts that can come out tax-free at any time, plus a big account for medical costs in retirement.',
      ],
      result: 'About $1,300 a year of tax saved now, and a six-figure tax-free health fund later.',
    },
    mistakes: [
      'Leaving the HSA in cash for decades instead of investing it.',
      'Throwing away receipts: without them you cannot prove tax-free reimbursements later.',
      'Contributing while also covered by a non-HDHP plan, such as a spouse’s PPO or a general-purpose health FSA.',
      'Spending HSA money on non-medical costs before 65 and paying tax plus the 20% penalty.',
    ],
    points: [
      'No tax in, no tax on growth, no tax out for medical costs.',
      '2026 limits: $4,400 self-only, $8,750 family, plus $1,000 at 55+.',
      'Invest it and pay small bills from cash if you can; save receipts forever.',
      'After 65, non-medical withdrawals are taxed like a traditional IRA.',
    ],
    terms: ['HSA', 'HDHP', 'Deductible', 'FSA', 'Compound interest'],
    quiz: { q: 'You paid a $900 medical bill out of pocket in 2026 and kept the receipt. When can you reimburse yourself tax-free from your HSA?', options: ['Only in 2026', 'Only after age 65', 'Any time later, as long as you keep the receipt'], answer: 2, why: 'There is no deadline for reimbursing a qualified expense that came after the HSA was opened, so the money can grow in the meantime.' },
    sources: [SRC.p969, SRC.hsa2026, SRC.hsa2027, SRC.obbbaHsa],
  });

  SML.lessons.push({
    id: 'l-open-enrollment', course: 'benefits', order: 8, title: 'Open enrollment: pick the right plan', mins: 8, level: 'Beginner',
    summary: 'A yearly checklist: health plan, HSA or FSA, insurance, 401(k), ESPP and beneficiaries.',
    idea: 'Once a year you choose benefits worth thousands of dollars. A one-hour review pays better than almost anything else you do.',
    widget: 'planPicker',
    try: 'Pick a coverage type and a kind of year, then drag your expected bills and find where the PPO starts to win.',
    body: [
      '<p><b>Open enrollment</b> is the yearly window, usually in the fall, to choose next year’s benefits. You can also enroll when you are hired and within a short window (often 30 days) after a life event such as marriage or a new baby. Outside those windows, most choices are locked for the year.</p><p>If you are enrolling in fall 2026, you are choosing 2027 benefits. The 2027 HSA limits are out ($4,500 self-only, $9,000 family); the IRS had not yet announced 2027 401(k) limits as of October 21, 2026.</p>',
      '<h3>1. Health plan: compare total cost, not premium</h3><p>Add up your premiums, your expected share of bills, and the worst case (premiums plus the <b>out-of-pocket maximum</b>). Then subtract any employer HSA deposit and the tax you save paying bills with pre-tax money. A high-deductible plan with an HSA often wins for healthy years; a low-deductible PPO can win when you expect heavy use. Check that your doctors are in network.</p>',
      '<h3>2. Pre-tax accounts</h3><ul><li><b>HSA</b> (with an HDHP): $4,400 self-only or $8,750 family in 2026. Keeps growing. See <a href="#l-hsa">the HSA lesson</a>.</li><li><b>Health FSA</b>: up to $3,400 in 2026 for predictable costs. Mostly use it or lose it, though some plans let about $680 carry over.</li><li><b>Dependent care FSA</b>: up to $7,500 per household in 2026 for child care while you work, raised from $5,000 by the 2025 tax law.</li><li><b>Commuter benefits</b>: up to $340 a month each for transit and parking in 2026, pre-tax.</li></ul>',
      '<h3>3. Insurance</h3><ul><li><b>Life</b>: free coverage is often one or two times salary. Group coverage above $50,000 creates a little taxable income. Families usually need more; cheap term coverage is covered in <a href="#l-insurance">Insurance you actually need</a>.</li><li><b>Disability</b>: replaces part of your pay if you cannot work. If you can pay the long-term disability premium with after-tax money, the benefit is usually tax-free when you need it.</li></ul>',
      '<h3>4. Money benefits</h3><ul><li>Check your 401(k) rate still gets the full match (<a href="#l-401k-match">the match lesson</a>).</li><li>Enroll in the ESPP if there is one; its enrollment windows often line up with open enrollment (<a href="#l-espp">ESPP: the 15% discount</a>).</li><li>Legal plans, student-loan help and tuition benefits can save real money.</li></ul>',
      '<h3>5. Beneficiaries</h3><p>Check who is named on your 401(k), HSA and life insurance. These forms override your will, so update them after a marriage, divorce or birth.</p>',
    ],
    example: {
      title: 'A family picks a plan',
      intro: 'In fall 2026 the Lees pick their 2027 family plan and expect about $4,000 of medical bills. Their choices: an HDHP with a $3,500 deductible (the 2027 HSA-eligible minimum), $3,000 of premiums and a $1,000 employer HSA deposit, or a PPO with $6,500 of premiums.',
      steps: [
        'HDHP share of bills: $3,500 deductible plus 20% of the next $500 = $3,600.',
        'HDHP all-in before tax savings: $3,000 + $3,600 − $1,000 = $5,600.',
        'They pay the other $2,600 of bills from their HSA with pre-tax money (well under the 2027 family limit of $9,000): at 22% + 7.65% that saves about $771, so about $4,830 all-in.',
        'PPO share of bills: $1,000 deductible plus 20% of $3,000 = $1,600. All-in: $6,500 + $1,600 = $8,100, minus about $474 of FSA tax savings = about $7,630.',
        'Worst case: HDHP $3,000 + $10,000 − $1,000 = $12,000; PPO $6,500 + $7,000 = $13,500.',
      ],
      result: 'The HDHP costs about $2,800 less in their expected year and less in the worst case too.',
    },
    mistakes: [
      'Picking the plan with the lowest premium, or the lowest deductible, without adding up the total.',
      'Letting benefits roll over without checking: prices, plans and your family change every year.',
      'Putting more in a health FSA than you will spend and losing the rest.',
      'Never updating beneficiaries after a marriage, divorce or new child.',
    ],
    points: [
      'Compare plans on premiums plus expected bills plus worst case, minus HSA money and tax savings.',
      'Use the HSA, health FSA and dependent care FSA ($7,500 in 2026) to pay predictable costs with pre-tax money.',
      'Review life and disability coverage, your 401(k) rate and ESPP enrollment at the same time.',
      'Check beneficiary forms every year.',
    ],
    terms: ['Open enrollment', 'Deductible', 'Out-of-pocket maximum', 'Insurance premium', 'FSA', 'HDHP'],
    glossary: [{ t: 'Dependent care FSA', d: 'A workplace account for child or dependent care costs while you work, paid with pre-tax money.' }, { t: 'Qualifying life event', d: 'A change such as marriage, a birth or losing other coverage that lets you change benefits outside open enrollment.' }],
    quiz: { q: 'You expect a very low-cost year medically. Which plan usually wins on total cost?', options: ['The plan with the lowest deductible', 'The high-deductible plan with an HSA, especially with an employer deposit', 'It never matters'], answer: 1, why: 'In a light year you pay little toward the deductible, so the lower premium, the employer HSA deposit and the tax savings usually win.' },
    sources: [SRC.ir25103, SRC.dcfsa, SRC.hsa2027, SRC.p969],
  });
})();
