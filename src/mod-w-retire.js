/* Retirement & Wealth track, course `retire`: retire early or late, the one-page plan, the ten-year countdown. Fork W9. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (i) => document.getElementById(i);
  const setT = (i, v, cls) => { const el = $id(i); if (!el) return; el.textContent = v; el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const money = (v) => { const a = Math.abs(v), s = v < 0 ? F.minus : ''; if (a >= 999500) return s + '$' + (a / 1e6).toFixed(a >= 9.95e6 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1000) return s + '$' + Math.round(a / 1000) + 'k'; return s + '$' + Math.round(a); };
  const ageTxt = (a) => (Math.abs(a - Math.round(a)) > 0.01 ? Math.floor(a) + '½' : String(Math.round(a)));

  SML.css(`
  .wrt-h{grid-column:1/-1;font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.2em;color:var(--accent);margin-bottom:-6px}
  .wrt-fields{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));grid-column:1/-1}
  .wrt-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
  .wrt-legend i{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-2px;margin-right:6px}
  .wrt-legend i.pre{background:var(--info)} .wrt-legend i.roth{background:var(--violet)} .wrt-legend i.tax{background:var(--accent)} .wrt-legend i.hsa{background:var(--up)}
  .wrt-list{list-style:none;display:flex;flex-direction:column}
  .wrt-list li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:14px 16px;border-top:1px solid var(--line);align-items:start}
  .wrt-list li:first-child{border-top:0}
  .wrt-list li.now{background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
  .wrt-list li.late{background:color-mix(in srgb,var(--down) 6%,var(--surface))}
  .wrt-ck{width:26px;height:26px;border-radius:50%;border:2px solid var(--input);background:var(--bg);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;margin-top:1px;color:var(--on)}
  .wrt-ck:hover{border-color:var(--accent)}
  .wrt-ck[aria-pressed="true"]{background:var(--up);border-color:var(--up)}
  .wrt-ck svg{width:14px;height:14px}
  .wrt-ti{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
  .wrt-ti b{font-weight:600;color:var(--ink);font-size:15px;line-height:1.35}
  .wrt-ti .n{font:600 11px var(--mono);color:var(--accent)}
  .wrt-list p{margin-top:5px;font-size:14px;line-height:1.55;color:color-mix(in srgb,var(--ink) 72%,transparent)}
  .wrt-list li.done b{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--input)}
  .wrt-rows{cursor:pointer}
  `);

  /* small tooltip inside a .wg-fig */
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

  /* ---------------- shared math ---------------- */
  /* Social Security: share of the full benefit (PIA) by claiming age, for full retirement age 67 (born 1960 or later).
     Early: 5/9 of 1% a month for the first 36 months, 5/12 of 1% after that. Late: 8% a year up to 70. */
  function ssFactor(age) {
    const m = Math.round((SML.clamp(age, 62, 70) - 67) * 12);
    if (m >= 0) return 1 + m * (0.08 / 12);
    const e = -m; return 1 - Math.min(e, 36) * (5 / 900) - Math.max(0, e - 36) * (5 / 1200);
  }

  /* retireAge model, all in today's dollars with a real return */
  function ageModel(p, R) {
    const r = p.r, n = R - p.a;
    const g = Math.pow(1 + r, n);
    const atR = p.B0 * g + (r ? (p.C * (g - 1)) / r : p.C * n);
    const claim = p.mode === '70' ? 70 : p.mode === '67' ? Math.max(67, R) : Math.max(62, R);
    const ss = p.P * 12 * ssFactor(claim);
    const need = (age) => p.S + (age < 65 ? p.H : 0) - (age >= claim ? ss : 0);
    let pv = 0;
    for (let age = R; age < p.L; age++) pv += need(age) / Math.pow(1 + r, age - R);
    let bal = atR, runOut = null;
    for (let age = R; age < p.L; age++) { bal -= need(age); if (bal < 0 && runOut == null) { runOut = age; break; } bal *= 1 + r; }
    return { R, atR, claim, ss, need: Math.max(0, pv), funded: pv > 0 ? atR / pv : 9.99, runOut, bridge: Math.max(0, 65 - R), years: p.L - R, first: need(R) };
  }

  /* planner simulation, nominal dollars inside, reported in both */
  function planSim(p, spendOverride) {
    const S0 = spendOverride != null ? spendOverride : p.S;
    const pools = { pre: p.pre, roth: p.roth, tax: p.tax, hsa: p.hsa };
    const rows = [];
    let runOut = null, atR = null, firstW = null, firstGross = null;
    const R = Math.max(p.R, p.a);
    const ssYear = p.P * 12 * ssFactor(p.c);
    for (let age = p.a; age <= p.L; age++) {
      const t = age - p.a, g = Math.pow(1 + p.inf, t);
      rows.push({ age, g, pre: pools.pre, roth: pools.roth, tax: pools.tax, hsa: pools.hsa });
      if (age === p.L) break;
      if (age < R) {
        const you = p.m * 12 * g, match = p.sal * (p.mp / 100) * g;
        const half = 1 + p.ret / 2;
        const toPre = p.dest === 'pre' ? you : p.dest === 'split' ? you / 2 : 0;
        const toRoth = you - toPre;
        pools.pre = pools.pre * (1 + p.ret) + (toPre + match) * half;
        pools.roth = pools.roth * (1 + p.ret) + toRoth * half;
        pools.tax *= 1 + p.ret; pools.hsa *= 1 + p.ret;
      } else {
        if (atR == null) atR = (pools.pre + pools.roth + pools.tax + pools.hsa) / g;
        const income = (age >= p.c ? ssYear : 0) * g + p.O * 12 * g;
        let net = S0 * g - income;
        let gross = 0;
        if (net < 0) { pools.tax += -net; net = 0; }
        const take = (k, rate) => { if (net <= 0 || pools[k] <= 0) return; const want = net / (1 - rate); const got = Math.min(pools[k], want); pools[k] -= got; gross += got; net -= got * (1 - rate); };
        take('tax', 0.05); take('pre', p.tr / 100); take('roth', 0); take('hsa', 0);
        if (firstW == null) { firstW = gross / g; firstGross = gross; }
        if (net > 1 && runOut == null) runOut = age;
        ['pre', 'roth', 'tax', 'hsa'].forEach((k) => { pools[k] = Math.max(0, pools[k]) * (1 + p.ret); });
      }
    }
    const last = rows[rows.length - 1];
    const totR = rows.find((x) => x.age === R);
    const totalAtR = totR ? totR.pre + totR.roth + totR.tax + totR.hsa : 0;
    return { rows, runOut, atR: atR == null ? totalAtR / Math.pow(1 + p.inf, R - p.a) : atR, totalAtRNom: totalAtR, firstW: firstW || 0, firstGross: firstGross || 0, leftReal: (last.pre + last.roth + last.tax + last.hsa) / last.g, R, ssYear };
  }
  function maxSpend(p) {
    let lo = 0, hi = 600000;
    for (let i = 0; i < 32; i++) { const mid = (lo + hi) / 2; if (planSim(p, mid).runOut == null) lo = mid; else hi = mid; }
    return lo;
  }
  SML._wrt = { ssFactor, ageModel, planSim, maxSpend };

  /* =====================================================================
     1. retireAge: the same person retiring at 55, 62, 67 or 70
     ===================================================================== */
  const AGES = [55, 62, 67, 70];
  SML.widgets.retireAge = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('wra');
    const pct = (v) => trimN(v, 1) + '%';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Retire at</span>${ui.seg(id + '-sel', AGES.map((a) => ({ v: a, label: String(a) })), opts.sel || 62, 'Retirement age to explain')}<span class="grow"></span>${ui.seg(id + '-view', [{ v: 'time', label: 'Timeline' }, { v: 'money', label: 'Has vs needs' }], 'time', 'Chart view')}</div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Savings at retirement', id + '-has', 'hl')}${ui.stat('Needed to last', id + '-need')}${ui.stat('Social Security', id + '-ss')}${ui.stat('Years before Medicare', id + '-br')}${ui.stat('Money lasts until', id + '-last')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-ctrl">
        <p class="wrt-h">You today</p>
        ${ui.slider({ id: id + '-a', label: 'Your age now', min: 25, max: 54, step: 1, value: 45, fmt: 'num' })}
        ${ui.slider({ id: id + '-b', label: 'Saved so far', min: 0, max: 2000000, step: 10000, value: 400000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-c', label: 'You save per year', min: 0, max: 80000, step: 1000, value: 25000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-r', label: 'Return after inflation', min: 0, max: 7, step: 0.25, value: 4, fmt: pct })}
        <p class="wrt-h">Retirement (today's dollars)</p>
        ${ui.slider({ id: id + '-s', label: 'Spending per year', min: 20000, max: 200000, step: 1000, value: 60000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-p', label: 'Social Security at 67, per month', min: 0, max: 5000, step: 50, value: 2400, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-h', label: 'Health insurance before 65, per year', min: 0, max: 30000, step: 500, value: 12000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-l', label: 'Plan for money to last to', min: 85, max: 100, step: 1, value: 95, fmt: 'num' })}
        <div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center"><span class="ctl-lab">Claim Social Security</span>${ui.seg(id + '-m', [{ v: 'ret', label: 'When I retire (62+)' }, { v: '67', label: 'At 67' }, { v: '70', label: 'At 70' }], 'ret', 'When to claim Social Security')}</div>
      </div>
      <div class="wg-note">Today's dollars, a steady return after inflation and saving at the same pace every year. Social Security assumes full retirement age 67 (born 1960 or later): 70% of the full benefit at 62, 124% at 70. Click a row or a button to explain that age.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    let rowsBox = null;
    fig.addEventListener('click', (e) => {
      const g = e.target.closest('[data-row]'); if (!g) return;
      st.setSeg(id + '-sel', g.getAttribute('data-row')); draw();
    });
    function params() {
      return { a: st.n(id + '-a'), B0: st.n(id + '-b'), C: st.n(id + '-c'), r: st.n(id + '-r') / 100, S: st.n(id + '-s'), P: st.n(id + '-p'), H: st.n(id + '-h'), L: st.n(id + '-l'), mode: st.seg(id + '-m') };
    }
    const draw = ui.responsive(fig, (W) => {
      const p = params();
      const res = AGES.map((R) => ageModel(p, R));
      const sel = Number(st.seg(id + '-sel')) || 62, view = st.seg(id + '-view');
      const cur = res.find((x) => x.R === sel);
      const compact = W < 520;
      let b = '', H;
      if (view === 'money') {
        H = Math.round(SML.clamp(W * 0.5, 250, 330));
        const pl = compact ? 46 : 60, pr = 10, pt = 34, pb = 44;
        const max = Math.max(...res.map((x) => Math.max(x.atR, x.need)), 1) * 1.12;
        const y = SML.lin(0, max, H - pb, pt);
        SML.ticks(0, max, 4).forEach((v) => { if (y(v) < pt - 4) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, money(v), 'xs mono', 'end'); });
        const gw = (W - pl - pr) / 4, bw = Math.min(46, gw * 0.3);
        res.forEach((x, i) => {
          const cx = pl + gw * (i + 0.5), on = x.R === sel;
          b += `<g data-row="${x.R}" class="wrt-rows">` + S.rect(pl + gw * i + 2, pt - 6, gw - 4, H - pb - pt + 40, on ? 'f-shade' : 'f-surf', 4, ' opacity="' + (on ? 1 : 0) + '"');
          b += S.rect(cx - bw - 3, y(x.atR), bw, H - pb - y(x.atR), 'f-info', 2) + S.rect(cx + 3, y(x.need), bw, H - pb - y(x.need), 'f-acc', 2);
          if (!compact) { b += S.text(cx - bw / 2 - 3, y(x.atR) - 6, money(x.atR), 'xs mono info', 'middle') + S.text(cx + 3 + bw / 2, y(x.need) - 6, money(x.need), 'xs mono acc', 'middle'); }
          const ok = x.funded >= 1;
          b += S.text(cx, H - pb + 18, (compact ? 'At ' : 'Retire ') + x.R, 'sm ' + (on ? 'ink b' : ''), 'middle') + S.text(cx, H - pb + 34, (x.funded >= 3 ? '300%+' : Math.round(x.funded * 100) + '%') + (compact ? '' : ' funded'), 'xs mono b ' + (ok ? 'up' : 'dn'), 'middle') + '</g>';
        });
        b += S.line(pl, H - pb + 0.5, W - pr, H - pb + 0.5, 's-line');
        b += S.rect(pl, 10, 12, 12, 'f-info', 2) + S.text(pl + 18, 20, 'savings at retirement', 'sm ink') + S.rect(pl + (compact ? 150 : 170), 10, 12, 12, 'f-acc', 2) + S.text(pl + (compact ? 168 : 188), 20, 'needed to last', 'sm ink');
        fig.innerHTML = S.wrap(W, H, 'Savings at retirement compared with the amount needed, for retiring at 55, 62, 67 and 70', b);
      } else {
        const rowH = compact ? 46 : 50, top = compact ? 74 : 58, lab = compact ? 30 : 64, right = compact ? 58 : 104;
        H = top + rowH * 4 + 40;
        const x = SML.lin(p.a, p.L, lab, W - right);
        // age ticks
        const step = W < 420 ? 10 : 5;
        for (let v = Math.ceil(p.a / step) * step; v <= p.L; v += step) b += S.line(x(v), top - 6, x(v), top + rowH * 4, 's-grid') + S.text(x(v), H - 14, String(v), 'xs mono', 'middle');
        if (x(Math.ceil(p.a / step) * step) - x(p.a) > 22) b += S.text(x(p.a), H - 14, String(p.a), 'xs mono', 'middle');
        // markers 59.5 and 65
        [[59.5, '59½', 'penalty-free'], [65, '65', 'Medicare']].forEach(([v, t, d], k) => {
          if (v <= p.a || v >= p.L) return;
          b += S.line(x(v), top - 8, x(v), top + rowH * 4 + 4, k ? 's-info dash2 w15' : 's-vio dash2 w15');
          b += S.text(x(v) + (k ? 4 : -4), top - 12, compact ? t : t + ' ' + d, 'sm b ' + (k ? 'info' : 'vio'), k ? 'start' : 'end');
        });
        res.forEach((r, i) => {
          const y0 = top + i * rowH + 6, bh = rowH - 22, on = r.R === sel;
          b += `<g data-row="${r.R}" class="wrt-rows">` + S.rect(2, y0 - 5, W - 4, rowH - 2, on ? 'f-shade s-acc w15' : 'f-surf', 6, on ? '' : ' opacity="0"');
          b += S.text(compact ? 4 : 10, y0 + bh / 2 + 5, compact ? String(r.R) : 'At ' + r.R, (compact ? 'md' : 'lg') + ' b ' + (on ? 'acc' : 'ink'));
          const end = r.runOut != null ? r.runOut : p.L;
          b += S.rect(x(p.a), y0, x(r.R) - x(p.a), bh, 'f-info-t s-info w1', 3);
          if (r.claim > r.R) b += S.rect(x(r.R), y0, x(Math.min(r.claim, end)) - x(r.R), bh, 'f-acc-t s-acc w1', 3);
          if (end > r.claim) b += S.rect(x(r.claim), y0, x(end) - x(r.claim), bh, 'f-up-t s-up w1', 3);
          if (r.runOut != null) b += S.rect(x(r.runOut), y0, x(p.L) - x(r.runOut), bh, 'f-dn-t s-dn w1 dash2', 3) + S.text(x(r.runOut) + 4, y0 + bh / 2 + 4, compact ? '✕' : '✕ ' + r.runOut, 'sm b dn');
          if (r.R < 65) b += S.rect(x(r.R), y0 + bh + 2, x(65) - x(r.R), 4, 'f-dn', 2);
          if (!compact && x(r.R) - x(p.a) > 70) b += S.text(x(p.a) + 6, y0 + bh / 2 + 4, 'work and save', 'xs ink');
          const ok = r.funded >= 1 && r.runOut == null;
          b += S.text(W - 6, y0 + bh / 2 + (compact ? 4 : 0), r.funded >= 3 ? '300%+' : Math.round(r.funded * 100) + '%', (compact ? 'sm' : 'md') + ' mono b ' + (ok ? 'up' : 'dn'), 'end');
          if (!compact) b += S.text(W - 6, y0 + bh / 2 + 14, 'funded', 'xs', 'end');
          b += '</g>';
        });
        // legend
        const lg = [['f-info-t s-info', 'work'], ['f-acc-t s-acc', 'savings only'], ['f-up-t s-up', 'plus Social Security'], ['f-dn', 'pay for health cover']];
        let lx = 4, ly = 10;
        lg.forEach(([c, t]) => { const w = 26 + t.length * 5.6; if (lx + w > W) { lx = 4; ly += 18; } b += S.rect(lx, ly, 12, 10, c + ' w1', 2) + S.text(lx + 17, ly + 9, t, 'xs ink'); lx += w; });
        fig.innerHTML = S.wrap(W, H, 'Timelines for retiring at 55, 62, 67 and 70: years of work, years on savings alone, years with Social Security, and when the money runs out', b);
      }
      // stats and coach for the selected age
      const c = cur;
      setT(id + '-has', money(c.atR));
      setT(id + '-need', money(c.need), c.atR >= c.need ? '' : 'dn');
      setT(id + '-ss', F.usd0(c.ss / 12) + '/mo');
      $id(id + '-ss').previousElementSibling.textContent = 'Social Security from ' + c.claim;
      setT(id + '-br', c.bridge ? c.bridge + (c.bridge === 1 ? ' year' : ' years') : 'None');
      setT(id + '-last', c.runOut == null ? p.L + '+' : String(c.runOut), c.runOut == null ? 'up' : 'dn');
      const msg = $id(id + '-msg');
      const gap = c.claim - c.R;
      let txt = '';
      if (c.R === 55) txt = `Retiring at 55 means ${c.years} years to fund, ${gap > 0 ? gap + ' of them before Social Security starts' : ''}, and 10 years of buying your own health insurance before Medicare. Leave your job in or after the year you turn 55 and the Rule of 55 lets you tap that employer's 401(k) without the 10% penalty; IRAs still wait until 59½.`;
      else if (c.R === 62) txt = `At 62 you can claim Social Security, but only ${Math.round(ssFactor(62) * 100)}% of your full benefit for life. You still need ${c.bridge} years of private health insurance before Medicare at 65.`;
      else if (c.R === 67) txt = `67 is full retirement age: your full Social Security benefit and Medicare already in place. You also get ${c.R - p.a} years of saving and compounding.`;
      else txt = `Waiting to 70 grows Social Security to ${Math.round(ssFactor(70) * 100)}% of the full benefit for life, and leaves the fewest years to fund. The risk: health or a layoff can end work before you choose to.`;
      const fundTxt = c.runOut == null ? ` Your savings cover the plan to ${p.L}.` : ` At this pace the money runs out at ${c.runOut}.`;
      msg.innerHTML = ui.msg(c.runOut == null ? 'up' : 'dn', c.runOut == null ? 'Funded' : 'Short', txt + fundTxt);
    });
  };
  function trimN(v, d) { return String(Number(v.toFixed(d))); }

  /* =====================================================================
     2. retirePlanner: one-page plan, year by year to 95
     ===================================================================== */
  const PRESETS = {
    grad: { label: 'New grad', a: 23, R: 65, L: 95, pre: 0, roth: 1000, tax: 2000, hsa: 0, m: 400, sal: 65000, mp: 4, dest: 'roth', ret: 6.5, inf: 2.5, S: 50000, P: 2200, c: 67, O: 0, tr: 12 },
    mid: { label: 'Mid-career couple', a: 40, R: 56, L: 95, pre: 320000, roth: 70000, tax: 90000, hsa: 25000, m: 2500, sal: 180000, mp: 5, dest: 'split', ret: 6.5, inf: 2.5, S: 100000, P: 4200, c: 67, O: 0, tr: 15 },
    late: { label: 'Behind at 50', a: 50, R: 67, L: 95, pre: 110000, roth: 0, tax: 15000, hsa: 0, m: 2000, sal: 85000, mp: 3, dest: 'pre', ret: 6, inf: 2.5, S: 52000, P: 2600, c: 70, O: 0, tr: 12 },
  };
  SML.widgets.retirePlanner = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('wrp');
    const pk = PRESETS[opts.preset] ? opts.preset : 'mid';
    const P0 = PRESETS[pk];
    const pct = (v) => trimN(v, 1) + '%';
    const ctlSlider = (k, label, min, max, step, fmt) => ui.slider({ id: id + '-' + k, label, min, max, step, value: P0[k], fmt });
    const fld = (k, label) => ui.field({ id: id + '-' + k, label, value: P0[k], min: 0, step: 1000 });
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-ex', Object.keys(PRESETS).map((k) => ({ v: k, label: PRESETS[k].label })), pk, 'Example person')}<span class="grow"></span>${ui.seg(id + '-real', [{ v: 'real', label: "Today's dollars" }, { v: 'nom', label: 'Future dollars' }], 'real', 'Dollar view')}</div>
      <div class="wg-bar"><div class="wrt-legend"><span><i class="pre"></i>Pre-tax</span><span><i class="roth"></i>Roth</span><span><i class="tax"></i>Taxable</span><span><i class="hsa"></i>HSA</span></div></div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Saved at retirement', id + '-atr', 'hl big')}${ui.stat('Money lasts until', id + '-last')}${ui.stat('First-year withdrawal, incl. tax', id + '-wr')}${ui.stat('Most you can spend', id + '-max')}${ui.stat('Left at the end', id + '-left')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-ctrl">
        <p class="wrt-h">Ages</p>
        ${ctlSlider('a', 'Your age now', 20, 70, 1, 'num')}
        ${ctlSlider('R', 'Retire at', 40, 75, 1, 'num')}
        ${ctlSlider('L', 'Plan to age', 85, 100, 1, 'num')}
        <p class="wrt-h">Savings today</p>
        <div class="wrt-fields">${fld('pre', 'Pre-tax 401(k)/IRA')}${fld('roth', 'Roth 401(k)/IRA')}${fld('tax', 'Taxable brokerage')}${fld('hsa', 'HSA')}</div>
        <p class="wrt-h">Saving until you retire</p>
        ${ctlSlider('m', 'You save per month', 0, 6000, 50, 'usd0')}
        <div class="wrt-fields" style="grid-column:auto">${fld('sal', 'Salary per year')}</div>
        ${ctlSlider('mp', 'Employer match, % of pay', 0, 10, 0.5, pct)}
        <div style="display:flex;flex-direction:column;gap:8px"><span class="ctl-lab">Your savings go to</span>${ui.seg(id + '-dest', [{ v: 'pre', label: 'Pre-tax' }, { v: 'roth', label: 'Roth' }, { v: 'split', label: 'Half each' }], P0.dest, 'Where new savings go')}</div>
        <p class="wrt-h">Markets</p>
        ${ctlSlider('ret', 'Yearly return', 0, 10, 0.25, pct)}
        ${ctlSlider('inf', 'Inflation', 0, 6, 0.25, pct)}
        <p class="wrt-h">Retirement (today's dollars)</p>
        ${ctlSlider('S', 'Spending per year', 20000, 250000, 1000, 'usd0')}
        ${ctlSlider('P', 'Social Security at 67, per month', 0, 6000, 50, 'usd0')}
        ${ctlSlider('c', 'Claim Social Security at', 62, 70, 1, 'num')}
        ${ctlSlider('O', 'Pension or rent, per month', 0, 10000, 100, 'usd0')}
        ${ctlSlider('tr', 'Tax on pre-tax withdrawals', 0, 35, 1, 'pct')}
      </div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" id="${id}-reset">Reset to the example</button><span class="note">Drag the amber handle on the chart to try another retirement age.</span></div>
      <div class="wg-note">A simple model, not advice. Same return every year (real markets swing: see the sequence-of-returns lesson), contributions and spending rise with inflation, employer match goes to pre-tax and assumes you save enough to earn it. Spending is after tax: the planner takes it from taxable money first and assumes 5% tax on those withdrawals, then pre-tax money taxed at your chosen rate, then Roth and HSA tax-free. Withdrawal rate, most you can spend and money left all include these taxes. Social Security assumes full retirement age 67. Ignores RMDs and contribution limits.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-ex')) applyPreset(st.seg(id + '-ex'));
      draw();
    });
    function applyPreset(k) {
      const q = PRESETS[k] || PRESETS.mid;
      ['a', 'R', 'L', 'pre', 'roth', 'tax', 'hsa', 'm', 'sal', 'mp', 'ret', 'inf', 'S', 'P', 'c', 'O', 'tr'].forEach((f) => st.set(id + '-' + f, q[f]));
      st.setSeg(id + '-dest', q.dest);
    }
    $id(id + '-reset').addEventListener('click', () => { applyPreset(st.seg(id + '-ex')); draw(); });
    const num = (k, d) => { const v = st.n(id + '-' + k); return isFinite(v) ? Math.max(0, v) : d; };
    function params() {
      return { a: num('a', 40), R: num('R', 62), L: num('L', 95), pre: num('pre', 0), roth: num('roth', 0), tax: num('tax', 0), hsa: num('hsa', 0), m: num('m', 0), sal: num('sal', 0), mp: num('mp', 0), dest: st.seg(id + '-dest') || 'pre', ret: num('ret', 6) / 100, inf: num('inf', 2.5) / 100, S: num('S', 60000), P: num('P', 0), c: num('c', 67), O: num('O', 0), tr: num('tr', 12) };
    }
    let G = null;
    ui.drag(fig, {
      sel: '.handle',
      move(pt) { if (!G) return; const age = Math.round(SML.clamp(G.x.inv(pt.x), 40, 75)); if (age !== st.n(id + '-R')) { st.set(id + '-R', age); draw(); } },
    });
    fig.addEventListener('pointermove', (e) => {
      if (!G || e.buttons) return; const svg = fig.querySelector('svg'); if (!svg) return; const pnt = ui.pt(svg, e);
      if (pnt.x < G.pl - 4 || pnt.x > G.W - G.pr + 4 || pnt.y > G.H - G.pb + 4) { hide(); return; }
      const age = Math.round(SML.clamp(G.x.inv(pnt.x), G.p.a, G.p.L));
      const r = G.sim.rows.find((q) => q.age === age); if (!r) return;
      const d = G.real ? r.g : 1, tot = (r.pre + r.roth + r.tax + r.hsa) / d;
      const hov = svg.querySelector('[data-hov]');
      if (hov) hov.innerHTML = S.line(G.x(age), G.pt, G.x(age), G.H - G.pb, 's-ink dash2') + S.circle(G.x(age), G.y(tot), 4.5, 'f-ink');
      tip.show(G.x(age), G.y(tot), `Age ${age}<br><b>${F.usd0(tot)}</b><br><span class="info">Pre-tax ${money(r.pre / d)}</span><br><span class="vio">Roth ${money(r.roth / d)}</span><br><span class="acc">Taxable ${money(r.tax / d)}</span><br><span class="up">HSA ${money(r.hsa / d)}</span>`, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);

    const draw = ui.responsive(fig, (W) => {
      const p = params();
      if (p.L <= p.a + 1) p.L = p.a + 2;
      const sim = planSim(p);
      const real = st.seg(id + '-real') !== 'nom';
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.48, 260, 340));
      const pl = compact ? 46 : 60, pr = 14, pt = 30, pb = 36;
      const tots = sim.rows.map((r) => (r.pre + r.roth + r.tax + r.hsa) / (real ? r.g : 1));
      const yMax = Math.max(...tots, 1) * 1.12;
      const x = SML.lin(p.a, p.L, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 4) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, money(v), 'xs mono', 'end'); });
      const span = p.L - p.a, stepA = span > 50 ? 10 : 5;
      for (let v = Math.ceil(p.a / stepA) * stepA; v <= p.L; v += stepA) b += S.text(x(v), H - pb + 16, String(v), 'xs mono', 'middle');
      // stacked areas: hsa (bottom), tax, roth, pre (top)
      const order = [['hsa', 'f-up'], ['tax', 'f-acc'], ['roth', 'f-vio'], ['pre', 'f-info']];
      let base = sim.rows.map(() => 0);
      order.forEach(([k, cls]) => {
        const top = sim.rows.map((r, i) => base[i] + r[k] / (real ? r.g : 1));
        const up = top.map((v, i) => [x(sim.rows[i].age), y(v)]), dn = base.map((v, i) => [x(sim.rows[i].age), y(v)]).reverse();
        if (top.some((v, i) => v - base[i] > 0.5)) b += S.polygon(up.concat(dn), cls, ' opacity=".8"');
        base = top;
      });
      b += S.poly(tots.map((v, i) => [x(sim.rows[i].age), y(v)]), 's-ink w15');
      // retirement line (draggable), SS line
      const R = sim.R, xR = x(R);
      b += S.line(xR, pt - 6, xR, H - pb, 's-acc w2');
      b += S.text(xR + (xR > W - 120 ? -6 : 6), pt - 12 + 4, 'Retire ' + R, 'sm acc b', xR > W - 120 ? 'end' : 'start');
      if (p.c >= p.a && p.c <= p.L && p.c !== R) {
        b += S.line(x(p.c), pt + 14, x(p.c), H - pb, 's-up dash2 w15');
        const lf = Math.abs(x(p.c) - xR) < 70;
        b += S.text(x(p.c) + 5, pt + (lf ? 30 : 12) + 12, compact ? 'SS ' + p.c : 'Social Security ' + p.c, 'xs up b');
      }
      if (sim.runOut != null) {
        b += S.rect(x(sim.runOut), pt, W - pr - x(sim.runOut), H - pb - pt, 'f-dn-t', 0, ' opacity=".7"');
        b += S.circle(x(sim.runOut), H - pb, 6, 'f-dn') + S.text(x(sim.runOut) > W - 130 ? x(sim.runOut) - 8 : x(sim.runOut) + 8, pt + 16, 'Runs out at ' + sim.runOut, 'md dn b', x(sim.runOut) > W - 130 ? 'end' : 'start');
      }
      b += S.line(pl, H - pb + 0.5, W - pr, H - pb + 0.5, 's-line');
      b += S.rect(xR - 9, H - pb - 9, 18, 18, 'handle', 4) + S.path(`M${xR - 3},${H - pb - 3} l-3,3 3,3 M${xR + 3},${H - pb - 3} l3,3 -3,3`, 'nf s-acc w15');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Savings by account from age ${p.a} to ${p.L}; retirement at ${R}`, b, 'drag');
      G = { W, H, pl, pr, pt, pb, x, y, sim, p, real };

      // stats
      setT(id + '-atr', money(sim.atR));
      $id(id + '-atr').previousElementSibling.textContent = real ? `Saved at ${R} (today's $)` : `Saved at ${R} (future $)`;
      if (!real) setT(id + '-atr', money(sim.totalAtRNom));
      setT(id + '-last', sim.runOut == null ? p.L + '+' : String(sim.runOut), sim.runOut == null ? 'up' : 'dn');
      const wr = sim.atR > 0 ? (sim.firstW / sim.atR) * 100 : 0;
      setT(id + '-wr', sim.atR > 0 ? F.pct(wr, 1) : '—', sim.runOut != null && wr > 4 ? 'dn' : wr > 4.5 ? 'acc' : 'up');
      const ms = maxSpend(p);
      setT(id + '-max', money(ms) + '/yr');
      setT(id + '-left', sim.runOut == null ? money(real ? sim.leftReal : sim.leftReal * Math.pow(1 + p.inf, p.L - p.a)) : '$0', sim.runOut == null ? '' : 'dn');
      const income = p.P * 12 * ssFactor(p.c) + p.O * 12;
      const cover = p.S > 0 ? Math.min(100, (income / p.S) * 100) : 0;
      let pill, txt;
      if (p.R < p.a) { pill = ['info', 'Retired']; txt = `Retire-at is below your age, so the plan starts withdrawals now.`; }
      else if (sim.runOut == null) { pill = ['up', 'On track']; txt = `You reach ${R} with about ${money(sim.atR)} in today's dollars. The first-year withdrawal, including tax, is ${F.pct(wr, 1)} of savings${wr > 4.5 && p.c > R ? `, high only until Social Security starts at ${p.c}` : ''}. Social Security plus other income will then cover about ${Math.round(cover)}% of spending. You could spend up to about ${money(ms)} a year after tax and still last to ${p.L}.`; }
      else { pill = ['dn', 'Short']; txt = `At this pace the money runs out at ${sim.runOut}. To last to ${p.L}, spend about ${money(ms)} a year, save more, retire later or claim Social Security later.`; }
      $id(id + '-msg').innerHTML = ui.msg(pill[0], pill[1], txt);
    });
  };

  /* =====================================================================
     3. countdownList: the ten-year countdown
     ===================================================================== */
  const TASKS = [
    { k: 'catch', t: 'Use catch-up contributions', s: 10, e: 0, why: 'From 50 you can put extra into a 401(k) and an IRA each year, and more again at 60 to 63. The last ten years are when most people can save the most.' },
    { k: 'debt', t: 'Pay off high-interest debt', s: 10, e: 5, why: 'Card and car payments are fixed bills your savings must cover. Clear them while a paycheck still arrives.' },
    { k: 'ssa', t: 'Check your Social Security record', s: 10, e: 0, why: 'Open a my Social Security account, check every year of earnings is recorded and see your benefit at 62, 67 and 70.' },
    { k: 'house', t: 'Decide on the mortgage', s: 8, e: 1, why: 'Pay it off, keep a cheap fixed rate, or downsize. A paid-off home lowers the spending your savings must fund.' },
    { k: 'glide', t: 'Move toward your glide path', s: 5, e: 0, why: 'A crash right before or after you retire hurts most. Shift gradually so a few years of spending sits in bonds and cash.' },
    { k: 'where', t: 'Choose where you will live', s: 5, e: 1, why: 'Housing, state tax, health care and family all change with the place. Rent there for a season before you commit.' },
    { k: 'test', t: 'Test-drive the retirement budget', s: 3, e: 1, why: 'Live on your planned retirement spending for a year and invest the rest. If it pinches, you find out while you can still adjust.' },
    { k: 'health', t: 'Plan health insurance until 65', s: 3, e: 0, why: 'Before Medicare you need cover from a spouse, COBRA or the marketplace. Medicare sign-up opens three months before the month you turn 65.' },
    { k: 'claim', t: 'Pick your Social Security age', s: 2, e: 0, why: 'Claiming at 62 locks in a smaller check for life; every year you wait to 70 adds about 8% to it. Couples should plan the claims together.' },
    { k: 'estate', t: 'Update estate documents', s: 2, e: 0, why: 'Will, beneficiaries on every account, power of attorney and a health care directive. Beneficiary forms beat what the will says.' },
    { k: 'cash', t: 'Build a 1-2 year cash bucket', s: 2, e: 0, why: 'Cash for the first year or two of spending means you are not forced to sell stocks in a bad market.' },
    { k: 'roth', t: 'Map your Roth conversion window', s: 1, e: -3, why: 'The years between your last paycheck and Social Security or RMDs are often your lowest-tax years. Converting some pre-tax money to Roth then can cut lifetime tax.' },
  ];
  SML.widgets.countdownList = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('wcd');
    const KEY = 'wrt-countdown';
    let done = new Set(SML.store.get(KEY, []).filter((k) => TASKS.some((t) => t.k === k)));
    const RET = [55, 60, 62, 65, 67, 70];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Retiring at</span>${ui.seg(id + '-r', RET.map((a) => ({ v: a, label: String(a) })), opts.retire || 65, 'Retirement age')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-y', label: 'Years until you retire', min: -3, max: 10, step: 1, value: opts.years != null ? opts.years : 8, fmt: (v) => (v > 0 ? v + (v === 1 ? ' year' : ' years') : v === 0 ? 'Retiring now' : -v + (v === -1 ? ' year in' : ' years in')) })}</div>
      <div class="wg-read">${ui.stat('Done', id + '-done', 'hl')}${ui.stat('Do now', id + '-now')}${ui.stat('Running late', id + '-late')}${ui.stat('Coming up', id + '-later')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <ul class="wrt-list" id="${id}-list"></ul>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" id="${id}-clear">Clear my ticks</button><span class="note">Ticks stay in this browser only.</span></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const list = $id(id + '-list');
    let G = null;
    function status(t, yrs) {
      if (done.has(t.k)) return 'done';
      if (yrs > t.s) return 'later';
      if (yrs < t.e) return 'late';
      return 'now';
    }
    list.addEventListener('click', (e) => {
      const b = e.target.closest('.wrt-ck'); if (!b) return;
      const k = b.dataset.k; if (done.has(k)) done.delete(k); else done.add(k);
      SML.store.set(KEY, Array.from(done)); draw();
    });
    $id(id + '-clear').addEventListener('click', () => { done = new Set(); SML.store.set(KEY, []); draw(); });
    ui.drag(fig, { sel: '.handle', move(pt) { if (!G) return; const v = Math.round(SML.clamp(-G.x.inv(pt.x), -3, 10)); if (v !== st.n(id + '-y')) { st.set(id + '-y', v); draw(); } } });
    fig.addEventListener('click', (e) => { const g = e.target.closest('[data-task]'); if (!g) return; const li = list.querySelector(`[data-li="${g.getAttribute('data-task')}"]`); if (li) li.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'nearest' }); });
    const check = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.4l3 3 6-6.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const draw = ui.responsive(fig, (W) => {
      const R = Number(st.seg(id + '-r')) || 65, yrs = st.n(id + '-y');
      const compact = W < 560;
      const lab = compact ? 30 : 230, pr = 16, top = 58, laneH = compact ? 20 : 22;
      const H = top + TASKS.length * laneH + 34;
      // x is "years relative to retirement": -10 (left) to +3 (right)
      const x = SML.lin(-10, 3, lab, W - pr);
      let b = '';
      for (let v = -10; v <= 3; v++) {
        const age = R + v; const show = compact ? v % 2 === 0 : true;
        b += S.line(x(v), top - 8, x(v), H - 30, v === 0 ? 's-acc w15' : 's-grid');
        if (show) b += S.text(x(v), H - 12, String(age), 'xs mono' + (v === 0 ? ' acc b' : ''), 'middle');
      }
      if (!compact) b += S.text(lab - 10, H - 12, 'age', 'xs mono', 'end');
      // milestones by age
      const ms = [[50, '50 catch-up'], [55, '55 Rule of 55'], [59.5, '59½ penalty-free'], [60, '60 bigger catch-up'], [62, '62 Social Security'], [65, '65 Medicare'], [67, '67 full benefit'], [70, '70 max benefit'], [73, '73 RMDs start (75 if born 1960+)']];
      const shown = ms.filter(([a]) => a - R >= -10 && a - R <= 3);
      let lastX = -999, row = 0;
      shown.forEach(([a, t]) => {
        const xx = x(a - R);
        row = xx - lastX < (compact ? 46 : 104) ? (row + 1) % 2 : 0; lastX = xx;
        const ty = 16 + row * 16;
        b += S.line(xx, ty + 4, xx, top - 6, 's-vio dash2') + S.circle(xx, top - 6, 3, 'f-vio');
        b += S.text(xx, ty, compact ? t.split(' ')[0] : t, 'xs vio b', xx > W - 70 ? 'end' : xx < lab + 40 ? 'start' : 'middle');
      });
      let nNow = 0, nLate = 0, nLater = 0;
      TASKS.forEach((t, i) => {
        const y0 = top + i * laneH, s = status(t, yrs);
        if (s === 'now') nNow++; if (s === 'late') nLate++; if (s === 'later') nLater++;
        const cls = s === 'done' ? 'f-up' : s === 'now' ? 'f-acc' : s === 'late' ? 'f-dn' : 'f-shade2';
        b += `<g data-task="${t.k}" style="cursor:pointer">`;
        b += S.rect(lab - (compact ? 28 : 226), y0 + 1, W, laneH - 2, 'f-surf', 0, ' opacity="0"');
        if (compact) b += S.text(lab - 6, y0 + laneH / 2 + 4, String(i + 1), 'xs mono b ' + (s === 'now' ? 'acc' : s === 'late' ? 'dn' : s === 'done' ? 'up' : ''), 'end');
        else b += S.text(lab - 10, y0 + laneH / 2 + 4, t.t.length > 34 ? t.t.slice(0, 32) + '…' : t.t, 'sm ' + (s === 'now' ? 'ink b' : s === 'late' ? 'dn b' : s === 'done' ? 'up' : ''), 'end');
        const x0 = x(-t.s), x1 = x(-t.e);
        b += S.rect(x0, y0 + 4, Math.max(6, x1 - x0), laneH - 8, cls, 3, s === 'later' ? ' opacity=".9"' : '');
        if (s === 'done') b += S.text(x0 + 6, y0 + laneH / 2 + 4, '✓', 'sm b on');
        b += '</g>';
      });
      // you-are-here
      const xh = x(-yrs);
      b += S.line(xh, top - 4, xh, H - 30, 's-ink w2');
      b += S.rect(xh - 9, H - 39, 18, 18, 'handle', 4);
      b += S.text(xh + (xh > W - 90 ? -12 : 12), H - 26, 'you', 'sm ink b', xh > W - 90 ? 'end' : 'start');
      fig.innerHTML = S.wrap(W, H, `Retirement countdown timeline for retiring at ${R}, with ${yrs} years to go`, b, 'drag');
      G = { x };
      setT(id + '-done', done.size + ' / ' + TASKS.length, done.size === TASKS.length ? 'up' : '');
      setT(id + '-now', String(nNow), nNow ? 'acc' : '');
      setT(id + '-late', String(nLate), nLate ? 'dn' : '');
      setT(id + '-later', String(nLater));
      const ageNow = R - yrs;
      const nowList = TASKS.filter((t) => status(t, yrs) === 'now').map((t) => t.t.toLowerCase());
      const lateList = TASKS.filter((t) => status(t, yrs) === 'late').map((t) => t.t.toLowerCase());
      let pill = 'acc', head = 'Now', txt;
      if (lateList.length) { pill = 'dn'; head = 'Catch up'; txt = `At ${ageNow}, these are past their best window: ${lateList.slice(0, 3).join(', ')}${lateList.length > 3 ? ' and more' : ''}. Most can still be done, so start this month.`; }
      else if (nowList.length) txt = `At ${ageNow}, with ${yrs > 0 ? yrs + (yrs === 1 ? ' year' : ' years') + ' to go' : yrs === 0 ? 'retirement this year' : 'retirement under way'}, focus on: ${nowList.slice(0, 3).join(', ')}${nowList.length > 3 ? ` (+${nowList.length - 3} more)` : ''}.`;
      else { pill = 'up'; head = 'All set'; txt = `Everything due by ${ageNow} is ticked. Check back each year.`; }
      $id(id + '-msg').innerHTML = ui.msg(pill, head, txt);
      list.innerHTML = TASKS.map((t, i) => {
        const s = status(t, yrs); const on = done.has(t.k);
        const pillTxt = { done: ['up', 'Done'], now: ['acc', 'Do now'], late: ['dn', 'Running late'], later: ['', (yrs - t.s) + (yrs - t.s === 1 ? ' year away' : ' years away')] }[s];
        const yr = (n) => n + (n === 1 ? ' year' : ' years');
        const when = t.e < 0 ? `${yr(t.s)} before to ${-t.e} after` : t.e === 0 ? `last ${yr(t.s)}` : `${t.s} to ${yr(t.e)} before`;
        return `<li class="${s}" data-li="${t.k}"><button type="button" class="wrt-ck" data-k="${t.k}" aria-pressed="${on}" aria-label="${on ? 'Mark not done' : 'Mark done'}: ${SML.esc(t.t)}">${on ? check : ''}</button><div><div class="wrt-ti"><span class="n">${String(i + 1).padStart(2, '0')}</span><b>${t.t}</b><span class="pill ${pillTxt[0]}">${pillTxt[1]}</span><span class="pill">${when}</span></div><p>${t.why}</p></div></li>`;
      }).join('');
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-retire-age', course: 'retire', order: 1, title: 'Retire at 55, 62, 67 or 70?', mins: 8, level: 'Beginner',
    summary: 'The age you stop work changes the savings you need, Social Security and health cover.',
    idea: 'Each extra year of work adds a year of saving, removes a year to fund and grows Social Security for life.',
    widget: 'retireAge',
    try: 'Pick a retirement age, then move your savings, spending and Social Security and watch which ages stay funded.',
    body: [
      '<p>The day you stop working is the biggest lever in any retirement plan. It decides four things at once, and they all push in the same direction.</p>',
      '<h3>Four things the date decides</h3><ul><li><b>Years of saving.</b> Every year you work you add money and give the pile another year to compound.</li><li><b>Years to fund.</b> Retire at 55 and plan to 95, and your money must last 40 years. Retire at 70 and it is 25.</li><li><b>Social Security.</b> Claim at 62 and you get 70% of your full benefit for life. Wait to 67 for 100%, or to 70 for 124% (for anyone born in 1960 or later).</li><li><b>Health insurance.</b> Medicare starts at 65. Every year before that you buy your own cover.</li></ul>',
      '<h3>Retiring early: the bridge years</h3><p>Early retirees must bridge two gaps. The first is <b>access</b>: money taken from a 401(k) or IRA before 59½ usually owes a 10% penalty on top of income tax. Ways around it include the <b>Rule of 55</b> (leave your job in or after the year you turn 55 and take money from that employer’s 401(k) without the penalty), Roth IRA contributions (you can always take out what you put in), and a taxable brokerage account. See <a href="#l-early-access">money out before 59½</a>.</p><p>The second is <b>health insurance</b> until 65: a spouse’s plan, COBRA or the marketplace. It can cost more than people expect. See <a href="#l-aca">health insurance before 65</a> and <a href="#l-health-bridge">bridging the gap to Medicare</a>.</p>',
      '<h3>Retiring late: the quiet superpower</h3><p>Working a few more years helps three ways at once: more contributions (including catch-up contributions from 50), more growth, and fewer years to pay for. Delaying Social Security past 67 adds 8% a year up to 70, and that bigger check is adjusted for inflation for the rest of your life.</p><p>The catch: plenty of people stop earlier than planned because of health, a layoff or caring for family. Treat working to 70 as a bonus, and make sure an earlier date still works.</p>',
      '<h3>Plan for a long life</h3><p><b>Longevity risk</b> is the risk of outliving your money. A plan that works to 85 can fail at 92. Plan to at least 95, and longer if your family lives long. Delaying Social Security is one of the cheapest ways to insure a long life, because the larger check never runs out. For couples, the higher earner’s benefit also becomes the survivor’s benefit. More in <a href="#l-social-security">Social Security: when to claim</a>.</p>',
      '<h3>The middle path</h3><p>Retirement does not have to be a cliff. Part-time work, consulting or a lower-stress job in your late 50s and early 60s can cover spending and health insurance while your savings keep growing. Even $20,000 a year of earnings in the first few years cuts what you withdraw when a market drop would hurt most. See <a href="#l-coast-fire">Coast FIRE and Barista FIRE</a>.</p>',
    ],
    example: {
      title: 'One saver, four dates',
      intro: 'A 45-year-old with $400,000 saved puts away $25,000 a year, earns 4% after inflation, plans to spend $60,000 a year and expects $2,400 a month of Social Security at 67. Health insurance before 65 costs $12,000 a year. All figures are in today’s dollars and the plan runs to 95.',
      steps: [
        '<b>Retire at 55.</b> Savings reach about $892,000. From 55 to 61 she needs $72,000 a year ($60,000 plus $12,000 of health cover) with no Social Security.',
        'At 62 she claims 70% of her benefit: $2,400 × 12 × 0.70 = $20,160 a year. That still leaves $39,840 a year to withdraw after Medicare starts at 65. She needs about $1.05 million, has $892,000, and runs out at 81.',
        '<b>Retire at 62.</b> Seven more years of saving lift the pot to about $1.37 million, and she skips seven years of paying for everything alone. She needs about $787,000: 174% funded.',
        '<b>Retire at 67.</b> Her full benefit is $28,800 a year, so she withdraws only $31,200 a year. About $1.80 million saved against $541,000 needed.',
        '<b>Retire at 70.</b> Social Security grows to 124%: $35,712 a year. She withdraws $24,288 a year from about $2.11 million.',
      ],
      result: 'Working from 55 to 62 turned a plan that runs out at 81 into one with room to spare. Retiring at 58 with part-time income is a middle path worth testing in the widget.',
    },
    mistakes: [
      'Planning only to average life expectancy. Many people live well past it, so plan to 95 or beyond.',
      'Forgetting the health insurance bill between your last day of work and Medicare at 65.',
      'Claiming Social Security at 62 by default. It locks in a check about 30% smaller for life, and can shrink a surviving spouse’s benefit too.',
      'Counting on working until 70 with no plan B if health or a layoff ends your career earlier.',
    ],
    points: [
      'Each extra year of work adds a year of saving, removes a year to fund and grows Social Security.',
      'Retiring before 65 means paying for health insurance; before 59½ it means planning penalty-free access to your money.',
      'Social Security pays 70% of the full benefit at 62, 100% at 67 and 124% at 70, for life.',
      'Plan for the money to last to at least 95.',
      'Part-time work in the early years is a powerful middle path.',
    ],
    terms: ['Full retirement age', 'Delayed retirement credits', 'Rule of 55', 'Longevity risk', 'Medicare', 'Social Security'],
    quiz: { q: 'With full retirement age 67, what share of your full Social Security benefit do you get by claiming at 62?', options: ['50%', '70%', '90%'], answer: 1, why: 'Claiming 60 months early cuts the benefit by 30%, for life. Waiting to 70 raises it to 124%.' },
    sources: [
      { t: 'SSA: Retirement benefits by year of birth and claiming age', u: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' },
      { t: 'SSA: Delayed retirement credits', u: 'https://www.ssa.gov/benefits/retirement/planner/delayret.html' },
      { t: 'IRS: Exceptions to tax on early distributions', u: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-exceptions-to-tax-on-early-distributions' },
    ],
  });

  SML.lessons.push({
    id: 'l-retire-plan', course: 'retire', order: 2, title: 'Your retirement plan on one page', mins: 9, level: 'Intermediate',
    summary: 'Savings, saving rate, returns, spending and Social Security, year by year to 95.',
    idea: 'Five numbers decide almost every retirement plan. Put them on one page and update them once a year.',
    widget: 'retirePlanner',
    try: 'Pick an example person or type your own numbers, then drag the amber handle to try another retirement age.',
    body: [
      '<p>A retirement plan does not need a 40-page report. It needs five numbers, a sense of which accounts the money sits in, and an hour once a year to update them.</p>',
      '<h3>The five numbers that matter</h3><ul><li><b>What you have</b>, split by account type.</li><li><b>What you add</b> each year, including any employer match (see <a href="#l-401k-match">the 401(k) match</a>).</li><li><b>Your return after inflation.</b> Small changes here compound into big differences over decades.</li><li><b>What you will spend</b> in retirement, in today’s dollars. Start from what you spend now, then add travel and health care and remove work costs and the mortgage if it will be paid off.</li><li><b>Guaranteed income:</b> Social Security, a pension, rent. Get your Social Security estimate from a my Social Security account at ssa.gov.</li></ul>',
      '<h3>Today’s dollars, not future dollars</h3><p>At 2.5% inflation, prices double in about 29 years (72 ÷ 2.5, the <b>rule of 72</b>). A future $2 million sounds rich, but in today’s money it may buy what $1 million buys now. Think and plan in today’s dollars: the planner shows both.</p>',
      '<h3>Why the account type matters</h3><ul><li><b>Pre-tax</b> 401(k) and traditional IRA money is taxed as income when you take it out. $1 million pre-tax is not $1 million to spend.</li><li><b>Roth</b> money comes out tax-free after 59½ (and five years).</li><li><b>HSA</b> money is tax-free when spent on medical costs.</li><li><b>Taxable</b> brokerage money is taxed only on gains, often at low long-term rates, and has no age rules, which makes it the natural bridge for early retirees.</li></ul><p>More in <a href="#l-trad-vs-roth">Traditional or Roth?</a> and <a href="#l-retire-income">Turn savings into a paycheck</a>.</p>',
      '<h3>Read the withdrawal rate</h3><p>Your first-year withdrawal divided by your savings is your <b>withdrawal rate</b>. In US history, about 4% a year, raised with inflation, lasted 30 years through almost every period (see <a href="#l-swr">the 4% rule</a>). A higher rate for a few bridge years can be fine if Social Security will soon take over part of the load.</p>',
      '<h3>What a one-page plan leaves out</h3><p>The planner uses one steady return. Real markets swing, and a crash in your first years of retirement hurts most (see <a href="#l-sequence">sequence of returns risk</a>). It also skips required minimum distributions, detailed taxes, long-term care and contribution limits. Use it to find the direction, then stress-test it and re-run it every year or after any big life change.</p>',
    ],
    example: {
      title: 'A mid-career couple',
      intro: 'The “Mid-career couple” preset in the planner: a 6.5% return, 2.5% inflation, and the planner’s tax assumptions of 5% on taxable-account withdrawals and 15% on pre-tax withdrawals.',
      steps: [
        'Both 40, they have $320,000 pre-tax, $70,000 Roth, $90,000 taxable and $25,000 in an HSA: $505,000 in all.',
        'They save $2,500 a month ($30,000 a year) and get a 5% match on $180,000 of pay ($9,000). That is $39,000 a year, rising with inflation.',
        'Retiring at 56, they have about $1.78 million in today’s dollars.',
        'From 56 to 66 they spend $100,000 a year with no Social Security. The planner takes it from the taxable account first and assumes 5% tax, so they withdraw about $105,300 ($100,000 ÷ 0.95): about 5.9% of savings including tax, or 5.6% before tax. Before 59½ they need money they can reach without the 10% penalty.',
        'At 67 Social Security pays $4,200 a month, $50,400 a year: half their spending. Withdrawals drop sharply from there.',
      ],
      result: 'With those tax assumptions, the plan lasts past 95 with about $540,000 to spare in today’s dollars, and they could spend up to about $105,900 a year after tax.',
    },
    mistakes: [
      'Treating a pre-tax balance as all yours. Income tax comes out of every dollar you withdraw.',
      'Mixing today’s and future dollars, so a big future number looks safer than it is.',
      'Using a high steady return as if it were a promise. Test lower returns too.',
      'Building the plan once and never updating it as pay, savings and goals change.',
    ],
    points: [
      'Five numbers decide most plans: savings, saving rate, return after inflation, spending and guaranteed income.',
      'Plan in today’s dollars.',
      'Pre-tax, Roth, HSA and taxable money are not equal once taxes are counted.',
      'A first-year withdrawal near 4% has held up historically; higher bridge years can work if Social Security follows.',
      'Re-run the plan every year.',
    ],
    terms: ['Real return', 'Inflation', 'Rule of 72', 'Withdrawal rate', 'Roth IRA', 'Employer match'],
    quiz: { q: 'Prices rise 2.5% a year. Roughly how long until they double?', options: ['About 10 years', 'About 29 years', 'About 50 years'], answer: 1, why: 'Rule of 72: 72 ÷ 2.5 ≈ 29 years.' },
    sources: [
      { t: 'SSA: my Social Security account (your benefit estimate)', u: 'https://www.ssa.gov/myaccount/' },
    ],
  });

  SML.lessons.push({
    id: 'l-retire-countdown', course: 'retire', order: 4, title: 'The ten-year countdown', mins: 8, level: 'Beginner',
    summary: 'What to do ten, five, two and one year before you stop work.',
    idea: 'The last ten years before retirement are your biggest saving years and your best chance to fix gaps.',
    widget: 'countdownList',
    try: 'Choose your retirement age and drag the marker to where you are today. Tick each task as you finish it.',
    body: [
      '<p>Most people earn the most, and can save the most, in the decade before they retire. It is also the last stretch where a mistake is cheap to fix. Use it on purpose.</p>',
      '<h3>Ten years out</h3><ul><li><b>Catch-up contributions.</b> From the year you turn 50 you can add extra to a 401(k) and an IRA, and a bigger 401(k) catch-up applies at ages 60 to 63. See <a href="#l-401k-limits">the 401(k) limits</a>.</li><li><b>Clear high-interest debt</b> while a paycheck still arrives (<a href="#l-card-debt">card debt</a>).</li><li><b>Check your Social Security record.</b> Missing years of earnings mean a smaller benefit.</li><li><b>Decide on the mortgage:</b> pay it off, keep a cheap fixed rate, or downsize.</li></ul>',
      '<h3>Five years out</h3><ul><li><b>Start the glide path.</b> A crash just before or after you retire does the most damage. Shift gradually so a few years of spending sit in bonds and cash (<a href="#l-allocation">stocks, bonds and your age</a>).</li><li><b>Choose where you will live.</b> Housing, state tax, health care and family all change with the place.</li></ul>',
      '<h3>Two to three years out</h3><ul><li><b>Test-drive the budget.</b> Live on your planned retirement spending for a year and invest the rest.</li><li><b>Plan health insurance until 65.</b> Medicare’s initial enrollment period runs seven months: the three months before the month you turn 65, that month, and the three after. Missing it without other qualifying coverage can add 10% to your Part B premium for each full year you were late, for life.</li><li><b>Pick your Social Security age</b>, as a couple if you are married (<a href="#l-social-security">when to claim</a>).</li><li><b>Update estate documents and beneficiaries</b> (<a href="#l-estate">wills, beneficiaries and trusts</a>).</li><li><b>Build a cash bucket</b> of one to two years of spending.</li></ul>',
      '<h3>The year you retire, and after</h3><ul><li><b>Set up your paycheck:</b> which account pays for what, and how much each month (<a href="#l-retire-income">turn savings into a paycheck</a>).</li><li><b>Think before rolling over a 401(k).</b> If you retire between 55 and 59½, money left in that employer’s plan can be reached without the 10% penalty; once it moves to an IRA it usually cannot.</li><li><b>Use the low-tax window.</b> The years between your last paycheck and Social Security or required minimum distributions are often your cheapest years to convert pre-tax money to Roth (<a href="#l-medicare-rmd">Medicare, RMDs and IRMAA</a>).</li></ul>',
    ],
    example: {
      title: 'Maria’s last ten years',
      intro: 'Maria is 52 and plans to retire at 62. The catch-up figures are the 2026 limits.',
      steps: [
        'At 52 she raises her 401(k) to the 2026 limit of $24,500 plus the $8,000 catch-up for 50 and older: $32,500 a year. Her IRA takes $7,500 plus a $1,100 catch-up.',
        'At 60 and 61 the 401(k) catch-up for ages 60 to 63 rises to $11,250 (2026 figure), so she can put in $35,750 a year.',
        'At 57 she starts shifting from 90% stocks toward 60% and fills a cash bucket with one year of spending.',
        'At 59 she lives on her planned $5,000 a month for a year and invests everything above it. The budget holds, with $400 a month to spare.',
        'At 61 she prices a marketplace health plan for ages 62 to 64, decides to claim Social Security at 67, and updates the beneficiaries on every account.',
      ],
      result: 'Ten years of catch-ups alone let her save roughly $97,500 more than the standard limits allow ($8,000 × 8 + $11,250 × 2 + $1,100 × 10), before any growth.',
    },
    mistakes: [
      'Leaving everything for the final year, when the big levers (saving more, paying off debt) have little time left to work.',
      'Missing the Medicare enrollment window around your 65th birthday and paying a late penalty for life.',
      'Forgetting beneficiary forms. They override your will, and an ex-spouse can still be listed.',
      'Going to all cash out of fear, or staying 100% in stocks right up to the last day.',
    ],
    points: [
      'The last decade is usually your strongest saving decade: use catch-up contributions.',
      'Clear high-interest debt and decide on the mortgage while you still have a paycheck.',
      'Shift gradually toward safer assets and keep one to two years of spending in cash.',
      'Test-drive the budget, plan health cover to 65 and pick a Social Security age before you leave.',
      'The early retirement years are a low-tax window for Roth conversions.',
    ],
    terms: ['Catch-up contribution', 'Medicare', 'Sequence of returns risk', 'Beneficiary designation', 'Roth conversion', 'RMD'],
    quiz: { q: 'When does your Medicare initial enrollment period begin?', options: ['On your 65th birthday', 'Three months before the month you turn 65', 'The day you retire'], answer: 1, why: 'It is a seven-month window: three months before your birthday month, that month and three months after.' },
    sources: [
      { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit increases to $7,500', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
      { t: 'Medicare.gov: When does Medicare coverage start?', u: 'https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-does-medicare-coverage-start' },
      { t: 'Medicare.gov: Avoid late enrollment penalties', u: 'https://www.medicare.gov/basics/costs/medicare-costs/avoid-penalties' },
      { t: 'SSA: my Social Security account', u: 'https://www.ssa.gov/myaccount/' },
    ],
  });
})();
