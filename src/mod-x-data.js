/* Trading track · Economic Data & the Calendar (part 1): l-inflation (inflationCalc), l-jobs (jobsReport), l-pmi (pmiGauge). */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;

  /* ---------------- shared helpers ---------------- */
  const $id = (x) => document.getElementById(x);
  const setT = (id, txt, cls) => { const e = $id(id); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setL = (id, txt) => { const e = $id(id); if (e && e.previousElementSibling) e.previousElementSibling.textContent = txt; };
  const setMsg = (id, cls, pill, html) => { const e = $id(id); if (e) e.innerHTML = ui.msg(cls, pill, html); };
  const r1 = (v) => Math.round(v * 10) / 10;
  const pc = (v, d) => F.num(Math.abs(v) < 0.05 && !d ? 0 : v, d == null ? 1 : d) + '%';
  const spc = (v, d) => { d = d == null ? 1 : d; const x = Math.round(v * Math.pow(10, d)) / Math.pow(10, d); return (x > 0 ? '+' : x < 0 ? F.minus : '') + F.num(Math.abs(x), d) + '%'; };
  const kfmt = (v) => { const a = Math.abs(v); const s = v < 0 ? F.minus : ''; if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; if (a >= 1000) return s + '$' + (a / 1000).toFixed(a >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K'; return s + '$' + Math.round(a); };
  const kjobs = (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(Math.round(v)), 0) + 'K';

  /* latest readings (see research/macro.md; update with each release) */
  const NOW = { cpi: 3.7, core: 2.6, energy: 20.4, pce: 3.4, corePce: 3.0, ppi: 6.3, ur: 4.2, urPrev: 4.2, nfp: 29, ahe: 3.0, claims: 199, jolts: 7.1, ismM: 54.5, ismS: 54.9, gdp: 2.2, umich: 46.3, month: 'September 2026' };

  SML.css(`
    .xd-hide{display:none!important}
    .xd-react{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));background:var(--surface)}
    .xd-react > div{box-shadow:1px 0 0 var(--line),0 1px 0 var(--line);padding:12px 16px;display:flex;flex-direction:column;gap:6px;min-width:0}
    .xd-react .l{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
    .xd-react .v{display:flex;align-items:baseline;gap:8px;font-family:var(--display);font-size:24px;line-height:1;color:var(--ink)}
    @media (max-width:520px){.xd-react .v{font-size:20px}}
    .xd-react .v i{font-style:normal;font-size:20px}
    .xd-react .v.up{color:var(--up)} .xd-react .v.dn{color:var(--down)} .xd-react .v.flat{color:var(--muted)}
    .xd-react .w{font-size:13px;color:var(--muted);line-height:1.4}
    .xd-hd{font:600 10.5px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:12px 16px 0}
  `);

  /* tooltip inside a .wg-fig (14px padding) */
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
  /* spread right-edge labels so they never overlap */
  function spread(items, minGap, top, bottom) {
    const a = items.slice().sort((p, q) => p.y - q.y);
    for (let i = 1; i < a.length; i++) if (a[i].y - a[i - 1].y < minGap) a[i].y = a[i - 1].y + minGap;
    const over = a.length ? a[a.length - 1].y - bottom : 0;
    if (over > 0) { a.forEach((p) => { p.y -= over; }); for (let i = a.length - 2; i >= 0; i--) if (a[i + 1].y - a[i].y < minGap) a[i].y = a[i + 1].y - minGap; }
    a.forEach((p) => { p.y = Math.max(top, p.y); });
    return a;
  }

  /* =====================================================================
     1. inflationCalc: what inflation does to money, and the CPI basket
     ===================================================================== */
  /* CPI-U relative importance, December 2025 (BLS). Core services = services less energy services minus shelter. PCE weights are rough. */
  const CATS = [
    { k: 's', label: 'Shelter', short: 'Shelter', w: 35.625, pw: 15.5, f: 'f-acc', t: 'acc', core: true },
    { k: 'v', label: 'Other services', short: 'Services', w: 25.119, pw: 51.0, f: 'f-vio', t: 'vio', core: true },
    { k: 'g', label: 'Goods (not food or energy)', short: 'Goods', w: 19.176, pw: 22.0, f: 'f-info', t: 'info', core: true },
    { k: 'f', label: 'Food', short: 'Food', w: 13.698, pw: 7.5, f: 'f-up', t: 'up', core: false },
    { k: 'e', label: 'Energy', short: 'Energy', w: 6.383, pw: 4.0, f: 'f-dn', t: 'dn', core: false },
  ];
  const BASKETS = {
    calm: { label: 'Calm, like 2019', s: 3.2, v: 2.7, g: -0.1, f: 1.8, e: 3.4 },
    shock: { label: 'Energy and shortages, like 2022', s: 5.6, v: 5.4, g: 6.7, f: 10.4, e: 41.6 },
    sticky: { label: 'Sticky services', s: 5.0, v: 4.5, g: 0.5, f: 2.5, e: 0 },
    goods: { label: 'Goods price bump', s: 3.5, v: 3.5, g: 4.0, f: 3.0, e: 1.0 },
    stag: { label: '1970s-style', s: 8, v: 7, g: 7, f: 12, e: 25 },
  };
  const ASSETS = [
    { k: 'm', label: 'Cash under the mattress', short: 'Cash', r: 0, s: 's-mut', t: 'mut' },
    { k: 'b', label: 'Average bank savings', short: 'Savings', r: 0.6, s: 's-dn', t: 'dn' },
    { k: 't', label: 'T-bills / money market', short: 'T-bills', r: 4.2, s: 's-info', t: 'info' },
    { k: 'o', label: 'Bonds', short: 'Bonds', r: 4.5, s: 's-vio', t: 'vio' },
    { k: 'k', label: 'Stocks (long-run average)', short: 'Stocks', r: 9, s: 's-up', t: 'up' },
  ];
  function basketCalc(rates, weightKey) {
    let tot = 0, core = 0, coreW = 0, sumW = 0; const parts = [];
    CATS.forEach((c) => { const w = c[weightKey]; const ct = (w / 100) * rates[c.k]; sumW += w; tot += ct; parts.push({ c, ct }); if (c.core) { core += w * rates[c.k]; coreW += w; } });
    return { head: tot * (100 / sumW), core: core / coreW, parts };
  }

  SML.widgets.inflationCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('xdi');
    const v0 = opts.view === 'basket' ? 'basket' : 'money';
    const b0 = BASKETS[opts.basket] ? opts.basket : 'calm';
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'money', label: 'Your money' }, { v: 'basket', label: 'The price basket' }], v0, 'View')}<span class="grow"></span><span id="${id}-pb">${ui.seg(id + '-p', Object.keys(BASKETS).map((k) => ({ v: k, label: BASKETS[k].label })), b0, 'Scenario')}</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl" id="${id}-cm">
        ${ui.slider({ id: id + '-i', label: 'Inflation per year', min: 0, max: 12, step: 0.1, value: opts.infl != null ? opts.infl : NOW.cpi, fmt: (v) => F.num(v, 1) + '%' })}
        ${ui.slider({ id: id + '-y', label: 'Years', min: 1, max: 40, step: 1, value: opts.years || 20, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-a', label: 'Money today', min: 1000, max: 100000, step: 1000, value: 10000, fmt: 'usd0' })}
      </div>
      <div class="wg-ctrl" id="${id}-cb">
        ${CATS.map((c) => ui.slider({ id: id + '-c' + c.k, label: `${c.label} · ${F.num(c.w, 1)}% of CPI`, min: -10, max: c.k === 'e' ? 50 : 15, step: 0.1, value: BASKETS[b0][c.k], fmt: (v) => spc(v) })).join('')}
      </div>
      <div class="wg-read">${ui.stat('a', id + '-s1', 'hl')}${ui.stat('b', id + '-s2')}${ui.stat('c', id + '-s3')}${ui.stat('d', id + '-s4')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    let G = null;
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest ? e.target.closest('.seg') : null;
      if (seg && seg.id === id + '-p') { const b = BASKETS[st.seg(id + '-p')]; CATS.forEach((c) => st.set(id + '-c' + c.k, b[c.k])); }
      draw();
    });
    fig.addEventListener('pointermove', (e) => {
      if (!G || G.view !== 'money') return; const svg = fig.querySelector('svg'); if (!svg) return;
      const p = ui.pt(svg, e); if (p.x < G.pl - 4 || p.x > G.xr + 4) { tip.hide(); return; }
      const yr = SML.clamp(Math.round(G.x.inv(p.x)), 0, G.N);
      const rows = ASSETS.map((a) => `<span class="${a.t}">${a.short}</span> ${kfmt(G.val(a, yr))}`).join('<br>');
      tip.show(G.x(yr), p.y, `<b>Year ${yr}</b> · today’s dollars<br>${rows}`, G.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());

    const draw = ui.responsive(fig, (W) => {
      const view = st.seg(id + '-v') || 'money';
      $id(id + '-cm').classList.toggle('xd-hide', view !== 'money');
      $id(id + '-cb').classList.toggle('xd-hide', view !== 'basket');
      $id(id + '-pb').classList.toggle('xd-hide', view !== 'basket');
      tip.hide();
      if (view === 'money') drawMoney(W); else drawBasket(W);
    });

    function drawMoney(W) {
      const infl = st.n(id + '-i') / 100, N = st.n(id + '-y'), A = st.n(id + '-a');
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.52, 260, 360));
      const pl = compact ? 44 : 58, pr = compact ? 70 : 168, pt = 30, pb = 34;
      const val = (a, t) => A * Math.pow((1 + a.r / 100) / (1 + infl), t);
      const ends = ASSETS.map((a) => val(a, N));
      const yMax = Math.max(A * 1.15, ...ends) * 1.06, yMin = 0;
      const x = SML.lin(0, N, pl, W - pr), y = SML.lin(yMin, yMax, H - pb, pt);
      let b = '';
      SML.ticks(yMin, yMax, 4).forEach((v) => { b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, N, compact ? 4 : 8).filter((v) => Number.isInteger(v)).forEach((v) => { b += S.text(x(v), H - pb + 18, v === 0 ? 'now' : 'yr ' + v, 'xs mono', 'middle'); });
      b += S.line(pl, y(A), W - pr, y(A), 's-acc dash w15');
      b += S.text(pl + 6, y(A) - 7, compact ? 'today’s buying power' : `what ${kfmt(A)} buys today`, 'sm acc b');
      const labs = [];
      ASSETS.forEach((a) => {
        const pts = []; for (let t = 0; t <= N; t += Math.max(1, N / 80)) pts.push([x(t), y(val(a, t))]); pts.push([x(N), y(val(a, N))]);
        b += S.poly(pts, a.s + ' w25');
        b += S.circle(x(N), y(val(a, N)), 3.5, 'f-' + a.s.slice(2));
        labs.push({ a, y: y(val(a, N)) });
      });
      spread(labs, 15, pt, H - pb).forEach((l) => { b += S.text(x(N) + 8, l.y + 4, compact ? l.a.short : `${l.a.short} ${kfmt(val(l.a, N))}`, 'sm b ' + l.a.t); });
      b += S.text(pl, 16, compact ? 'Value in today’s dollars' : `${kfmt(A)} over ${N} years, in today’s dollars (after ${pc(infl * 100)} inflation)`, 'sm mut');
      fig.innerHTML = S.wrap(W, H, `What ${kfmt(A)} is worth in today's dollars after ${N} years of ${pc(infl * 100)} inflation, for cash, savings, T-bills, bonds and stocks`, b);
      G = { view: 'money', x, N, pl, xr: W - pr, W, val };

      const priceUp = Math.pow(1 + infl, N) - 1;
      const cashReal = A / Math.pow(1 + infl, N);
      const stockReal = val(ASSETS[4], N), billReal = val(ASSETS[2], N);
      setL(id + '-s1', `Prices after ${N} years`); setT(id + '-s1', spc(priceUp * 100, 0));
      setL(id + '-s2', '$100 of shopping will cost'); setT(id + '-s2', F.usd(100 * (1 + priceUp), 0));
      setL(id + '-s3', 'Cash under the mattress buys'); setT(id + '-s3', kfmt(cashReal), 'dn');
      setL(id + '-s4', 'Prices double every'); setT(id + '-s4', infl > 0.0005 ? F.num(Math.log(2) / Math.log(1 + infl), 0) + ' yrs' : 'never');
      const losers = ASSETS.filter((a) => a.r / 100 < infl).map((a) => a.short.toLowerCase());
      let cls = 'acc', pill = 'Inflation', msg;
      if (infl <= 0.02) { cls = 'up'; pill = 'Mild'; msg = `At ${pc(infl * 100)} a year, prices still rise ${spc(priceUp * 100, 0)} over ${N} years. That is the Fed’s comfort zone: cash slowly loses, while assets that earn more than inflation grow.`; }
      else if (infl <= 4.5) { msg = `At ${pc(infl * 100)}, ${kfmt(A)} kept as cash buys only ${kfmt(cashReal)} of today’s goods after ${N} years. ${losers.length ? 'Losing ground: ' + losers.join(', ') + '.' : ''} Stocks still grow to about ${kfmt(stockReal)} in today’s dollars.`; }
      else { cls = 'dn'; pill = 'High'; msg = `At ${pc(infl * 100)}, prices double in about ${F.num(Math.log(2) / Math.log(1 + infl), 0)} years. Every fixed-rate asset here loses buying power${billReal < A ? ', even T-bills' : ''}. This is when the Fed raises rates hard, which usually hits stock prices too (see the 2022 example below).`; }
      setMsg(id + '-msg', cls, pill, msg);
      $id(id + '-note').textContent = `Returns are held fixed so you can see inflation’s bite: savings ${pc(0.6)} (national average), T-bills and money market ${pc(4.2)}, bonds ${pc(4.5)} and stocks ${pc(9, 0)} a year (long-run average, with big swings). In real life T-bill yields tend to rise with inflation and stocks partly keep up over decades. Hover the chart for any year.`;
    }

    function drawBasket(W) {
      const rates = {}; CATS.forEach((c) => { rates[c.k] = st.n(id + '-c' + c.k); });
      const cpi = basketCalc(rates, 'w'), pce = basketCalc(rates, 'pw');
      const compact = W < 520;
      const rows = [
        { lab: 'CPI', sub: 'headline', v: cpi.head, parts: cpi.parts },
        { lab: 'Core CPI', sub: 'no food or energy', v: cpi.core },
        { lab: 'PCE', sub: 'rough, Fed’s gauge', v: pce.head, parts: pce.parts },
        { lab: 'Core PCE', sub: 'rough', v: pce.core },
      ];
      const lw = compact ? 78 : 150, pr = compact ? 54 : 70, pt = 34, rowH = compact ? 50 : 54, legendH = compact ? 44 : 26;
      const H = pt + rows.length * rowH + 30 + legendH;
      const minV = Math.min(0, ...rows.flatMap((r) => (r.parts ? r.parts.filter((p) => p.ct < 0).reduce((s, p) => s + p.ct, 0) : r.v))) - 0.2;
      const maxV = Math.max(3, ...rows.map((r) => (r.parts ? r.parts.filter((p) => p.ct > 0).reduce((s, p) => s + p.ct, 0) : r.v))) * 1.08;
      const x = SML.lin(minV, maxV, lw, W - pr);
      let b = '';
      SML.ticks(minV, maxV, compact ? 4 : 6).forEach((v) => { b += S.line(x(v), pt - 6, x(v), pt + rows.length * rowH - 8, 's-grid') + S.text(x(v), pt + rows.length * rowH + 8, F.num(v, 0) + '%', 'xs mono', 'middle'); });
      b += S.line(x(0), pt - 6, x(0), pt + rows.length * rowH - 8, 's-mut w15');
      b += S.line(x(2), pt - 14, x(2), pt + rows.length * rowH - 8, 's-acc dash w15') + S.text(x(2) + 4, pt - 16, 'Fed target 2%', 'sm acc b');
      rows.forEach((r, i) => {
        const yc = pt + i * rowH + rowH / 2 - 6, bh = compact ? 20 : 22;
        b += S.text(0, yc - 2, r.lab, 'md ink b') + S.text(0, yc + 13, r.sub, 'xs mut');
        if (r.parts) {
          let pos = 0, neg = 0;
          r.parts.forEach((p) => {
            const a = p.ct >= 0 ? pos : neg + p.ct; const w = x(a + Math.abs(p.ct)) - x(a);
            b += S.rect(x(a), yc - bh / 2, w, bh, p.c.f + ' s-surf w1');
            if (w > 34) b += S.text(x(a) + w / 2, yc + 4, F.num(Math.abs(p.ct), 1), 'xs mono b on', 'middle');
            if (p.ct >= 0) pos += p.ct; else neg += p.ct;
          });
        } else {
          b += S.rect(Math.min(x(0), x(r.v)), yc - bh / 2 + 4, Math.abs(x(r.v) - x(0)), bh - 8, 'f-shade2 s-mut w1', 2);
        }
        b += S.text(x(Math.max(r.parts ? r.parts.filter((p) => p.ct > 0).reduce((s, p) => s + p.ct, 0) : Math.max(0, r.v), 0)) + 6, yc + 5, pc(r.v), 'md b ' + (r.v > 3 ? 'dn' : r.v > 2.2 ? 'acc' : 'up'));
      });
      // legend
      const ly = pt + rows.length * rowH + 28; let lx = 0, lr = 0;
      CATS.forEach((c) => {
        const t = c.short, tw = t.length * 7 + 22;
        if (lx + tw > W) { lx = 0; lr++; }
        b += S.rect(lx, ly + lr * 18 - 9, 10, 10, c.f, 2) + S.text(lx + 15, ly + lr * 18, t, 'sm');
        lx += tw + 6;
      });
      b += S.text(0, 16, compact ? 'Points of inflation from each part' : 'Each colored block is that category’s share of the yearly inflation number', 'sm mut');
      fig.innerHTML = S.wrap(W, H, `Inflation from a price basket: CPI ${pc(cpi.head)}, core CPI ${pc(cpi.core)}, rough PCE ${pc(pce.head)}`, b);
      G = { view: 'basket' };

      const top = cpi.parts.slice().sort((p, q) => q.ct - p.ct)[0];
      setL(id + '-s1', 'CPI, headline'); setT(id + '-s1', pc(cpi.head));
      setL(id + '-s2', 'Core CPI'); setT(id + '-s2', pc(cpi.core), cpi.core > 3 ? 'dn' : '');
      setL(id + '-s3', 'PCE (rough)'); setT(id + '-s3', pc(pce.head));
      setL(id + '-s4', 'Biggest driver'); setT(id + '-s4', top.c.short, top.c.t === 'mut' ? '' : top.c.t === 'vio' ? 'info' : top.c.t);
      const gap = cpi.core - 2;
      let cls = 'up', pill = 'Near target', msg;
      if (cpi.head > 5) { cls = 'dn'; pill = 'Hot'; msg = `Headline CPI near ${pc(cpi.head)}. ${top.c.short} adds the most (${F.num(top.ct, 1)} points). A print like this pushes bond yields up and rate cuts off the table, which usually pulls stocks down, especially growth stocks.`; }
      else if (gap > 0.8) { cls = 'acc'; pill = 'Sticky'; msg = `Core CPI at ${pc(cpi.core)} is well above 2%. Shelter is about ${F.num(CATS[0].w, 0)}% of CPI but closer to 15% of PCE, so CPI often runs higher than the Fed’s gauge. Markets watch core for the trend.`; }
      else if (cpi.head < 1) { cls = 'info'; pill = 'Cool'; msg = `Inflation near ${pc(cpi.head)} gives the Fed room to cut rates. If it comes from falling energy prices, core tells you whether the slowdown is broad.`; }
      else msg = `Headline ${pc(cpi.head)} and core ${pc(cpi.core)} are close to the 2% goal. Calm prints like this let markets focus on growth and earnings instead of the Fed.`;
      setMsg(id + '-msg', cls, pill, msg);
      $id(id + '-note').textContent = 'CPI weights are BLS relative importance for December 2025. PCE weights are rough, to show why the two measures differ. Scenarios use approximate category rates with today’s weights, so totals differ a little from the official numbers at the time. Drag a slider to change one category.';
    }
  };

  /* =====================================================================
     2. jobsReport: release morning and the early warnings
     ===================================================================== */
  const PRIOR = [118, 92, 140, 104, 71, 126, 64, 98, 77, 102, 88];
  const JOB_PRESETS = {
    hot: { label: 'Blowout', p: 310, c: 120, r: 40, u: -0.2, w: 4.3 },
    goldi: { label: 'Just right', p: 125, c: 110, r: 0, u: 0, w: 3.5 },
    soft: { label: 'Soft', p: 20, c: 110, r: -60, u: 0.2, w: 3.3 },
    neg: { label: 'Jobs lost', p: -90, c: 60, r: -80, u: 0.3, w: 3.1 },
  };
  function claimsSeries(base, wave) {
    const r = SML.rng(31), out = [];
    for (let i = 0; i < 52; i++) {
      const seas = 6 * Math.sin((i / 52) * Math.PI * 2 + 0.6);
      const ramp = i >= 40 ? wave * Math.pow((i - 39) / 12, 1.4) : 0;
      out.push(base + seas + (r() - 0.5) * 14 + ramp);
    }
    return out;
  }
  SML.widgets.jobsReport = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('xdj');
    const p0 = JOB_PRESETS[opts.preset] || JOB_PRESETS.goldi;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'report', label: 'Jobs report morning' }, { v: 'warn', label: 'Early warnings' }], opts.view === 'warn' ? 'warn' : 'report', 'View')}<span class="grow"></span><span id="${id}-rb">${ui.seg(id + '-p', Object.keys(JOB_PRESETS).map((k) => ({ v: k, label: JOB_PRESETS[k].label })), opts.preset || 'goldi', 'Example report')}</span></div>
      <div class="wg-bar" id="${id}-gb"><span class="wg-title">What worries the Fed most</span>${ui.seg(id + '-g', [{ v: 'infl', label: 'Inflation' }, { v: 'jobs', label: 'A weak job market' }], opts.regime || 'infl', 'Fed worry')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl" id="${id}-cr">
        ${ui.slider({ id: id + '-pp', label: 'Payrolls this month (drag the bar too)', min: -200, max: 400, step: 5, value: p0.p, fmt: kjobs })}
        ${ui.slider({ id: id + '-cc', label: 'Consensus forecast', min: -50, max: 300, step: 5, value: p0.c, fmt: kjobs })}
        ${ui.slider({ id: id + '-rv', label: 'Revisions to the past 2 months', min: -150, max: 150, step: 5, value: p0.r, fmt: kjobs })}
        ${ui.slider({ id: id + '-uu', label: `Unemployment rate (latest report ${pc(NOW.urPrev)})`, min: 3, max: 7, step: 0.1, value: r1(NOW.urPrev + p0.u), fmt: (v) => pc(v) })}
        ${ui.slider({ id: id + '-ww', label: 'Average hourly earnings, vs a year ago', min: 2, max: 6, step: 0.1, value: p0.w, fmt: (v) => pc(v) })}
      </div>
      <div class="wg-ctrl xd-hide" id="${id}-cw">
        ${ui.slider({ id: id + '-wave', label: 'Layoff wave: extra weekly claims', min: 0, max: 120, step: 5, value: 0, fmt: (v) => '+' + v + 'K' })}
        ${ui.slider({ id: id + '-op', label: 'Job openings (JOLTS)', min: 4, max: 12.5, step: 0.1, value: NOW.jolts, fmt: (v) => F.num(v, 1) + 'M' })}
        ${ui.slider({ id: id + '-un', label: 'Unemployed people (example)', min: 4, max: 12, step: 0.1, value: 7.2, fmt: (v) => F.num(v, 1) + 'M' })}
      </div>
      <div class="xd-react" id="${id}-re"></div>
      <div class="wg-read">${ui.stat('a', id + '-s1', 'hl')}${ui.stat('b', id + '-s2')}${ui.stat('c', id + '-s3')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    let G = null;
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest ? e.target.closest('.seg') : null;
      if (seg && seg.id === id + '-p') { const p = JOB_PRESETS[st.seg(id + '-p')]; st.set(id + '-pp', p.p); st.set(id + '-cc', p.c); st.set(id + '-rv', p.r); st.set(id + '-uu', r1(NOW.urPrev + p.u)); st.set(id + '-ww', p.w); }
      draw();
    });
    ui.drag(fig, {
      start: (pt) => dragTo(pt), move: (pt) => dragTo(pt),
    });
    function dragTo(pt) {
      if (!G || G.view !== 'report') return;
      if (pt.x < G.lastX - G.bw) return;
      const v = SML.clamp(Math.round(G.y.inv(pt.y) / 5) * 5, -200, 400);
      st.set(id + '-pp', v); draw();
    }
    const draw = ui.responsive(fig, (W) => {
      const view = st.seg(id + '-v') || 'report';
      $id(id + '-cr').classList.toggle('xd-hide', view !== 'report');
      $id(id + '-cw').classList.toggle('xd-hide', view !== 'warn');
      $id(id + '-rb').classList.toggle('xd-hide', view !== 'report');
      $id(id + '-gb').classList.toggle('xd-hide', view !== 'report');
      $id(id + '-re').classList.toggle('xd-hide', view !== 'report');
      if (view === 'report') drawReport(W); else drawWarn(W);
    });

    function word(v) { return Math.abs(v) < 0.25 ? ['flat', '→', 'little change'] : v > 0 ? ['up', '▲', v > 0.9 ? 'up sharply' : 'up'] : ['dn', '▼', v < -0.9 ? 'down sharply' : 'down']; }
    function react(P, C, R, U, Wg, regime) {
      const surprise = P - C + R;
      const strength = surprise / 100 - (U - NOW.urPrev) * 3.5;
      const heat = (Wg - 3.5) / 0.5;
      const yld = 0.6 * strength + 0.5 * heat;
      let stocks;
      if (regime === 'infl') { stocks = -0.45 * strength - 0.5 * heat; if (strength < -1.5) stocks -= 0.8 * (-1.5 - strength); }
      else { stocks = 0.6 * strength - 0.25 * heat; if (strength > 2 && heat > 1) stocks -= 0.3; }
      return { surprise, strength, heat, yld, cut: -yld, usd: 0.8 * yld, stocks };
    }

    function drawReport(W) {
      const P = st.n(id + '-pp'), C = st.n(id + '-cc'), R = st.n(id + '-rv'), U = st.n(id + '-uu'), Wg = st.n(id + '-ww');
      const regime = st.seg(id + '-g') || 'infl';
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.46, 250, 320));
      const pl = compact ? 40 : 52, pr = compact ? 12 : 20, pt = 40, pb = 36;
      const revised = PRIOR.slice(); revised[9] += R / 2; revised[10] += R / 2;
      const all = revised.concat([P]);
      const lo = Math.min(-50, ...all, ...PRIOR) - 30, hi = Math.max(200, ...all, ...PRIOR, C) + 40;
      const y = SML.lin(lo, hi, H - pb, pt);
      const n = all.length, slot = (W - pl - pr) / n, bw = Math.min(34, slot * 0.62);
      const xc = (i) => pl + slot * (i + 0.5);
      let b = '';
      SML.ticks(lo, hi, 4).forEach((v) => { b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, (v > 0 ? '+' : v < 0 ? F.minus : '') + Math.abs(v) + 'K', 'xs mono', 'end'); });
      b += S.line(pl, y(0), W - pr, y(0), 's-mut w15');
      all.forEach((v, i) => {
        const last = i === n - 1, x0 = xc(i) - bw / 2;
        if (i >= 9 && i <= 10 && R !== 0) b += S.rect(x0, Math.min(y(0), y(PRIOR[i])), bw, Math.abs(y(PRIOR[i]) - y(0)), 'nf s-mut dash2 w1', 2);
        const cls = last ? (v >= C ? 'f-up' : 'f-dn') : 'f-shade2';
        b += S.rect(x0, Math.min(y(0), y(v)), bw, Math.max(1.5, Math.abs(y(v) - y(0))), cls + (last ? '' : ' o70'), 2);
        if (!compact || i % 2 === 1 || last) b += S.text(xc(i), H - pb + 16, last ? 'now' : (i - n + 1) + 'm', 'xs mono', 'middle');
      });
      const lx = xc(n - 1);
      b += S.line(lx - bw, y(C), lx + bw * 0.9, y(C), 's-acc dash w2');
      b += S.text(lx - bw - 6, y(C) + 4, `forecast ${kjobs(C)}`, 'sm acc b', 'end');
      b += S.circle(lx, y(P), 7, 'handle');
      const vl = kjobs(P); b += S.text(lx, (P >= 0 ? y(P) - 14 : y(P) + 22), vl, 'md b ' + (P >= C ? 'up' : 'dn'), 'middle');
      if (R !== 0) b += S.text(xc(9.5), Math.min(y(revised[9]), y(revised[10]), y(PRIOR[9]), y(PRIOR[10])) - 8, `revised ${kjobs(R)}`, 'xs b ' + (R > 0 ? 'up' : 'dn'), 'middle');
      b += S.text(pl, 18, compact ? 'Jobs added each month' : 'Jobs added each month (made-up history). Drag this month’s bar.', 'sm mut');
      fig.innerHTML = S.wrap(W, H, `Monthly payrolls: this month ${kjobs(P)} against a forecast of ${kjobs(C)}`, b, 'drag');
      G = { view: 'report', y, lastX: lx, bw };

      const r = react(P, C, R, U, Wg, regime);
      const tiles = [
        ['2-year Treasury yield', r.yld, 'Most sensitive to Fed expectations'],
        ['Odds of a rate cut', r.cut, 'Priced in futures markets'],
        ['US dollar', r.usd, 'Follows yields'],
        ['S&P 500', r.stocks, regime === 'infl' ? 'Strong data can be bad news' : 'Strong data is good news'],
      ];
      $id(id + '-re').innerHTML = tiles.map(([l, v, w]) => { const k = word(v); return `<div><span class="l">${l}</span><span class="v ${k[0]}"><i>${k[1]}</i>${k[2]}</span><span class="w">${w}</span></div>`; }).join('');
      setL(id + '-s1', 'Surprise, with revisions'); setT(id + '-s1', kjobs(r.surprise), r.surprise > 25 ? 'up' : r.surprise < -25 ? 'dn' : '');
      setL(id + '-s2', 'Unemployment rate'); setT(id + '-s2', `${pc(U)} (${U - NOW.urPrev >= 0 ? '+' : F.minus}${F.num(Math.abs(U - NOW.urPrev), 1)})`, U > NOW.urPrev + 0.05 ? 'dn' : U < NOW.urPrev - 0.05 ? 'up' : '');
      setL(id + '-s3', 'Wage pressure'); setT(id + '-s3', r.heat > 1 ? 'Hot' : r.heat > 0.2 ? 'Warm' : r.heat < -0.6 ? 'Cool' : 'Normal', r.heat > 1 ? 'dn' : r.heat < -0.6 ? 'info' : '');
      let cls = 'acc', pill = 'Mixed', msg;
      if (r.strength > 1 && regime === 'infl') { cls = 'dn'; pill = 'Good news, bad news'; msg = `Jobs beat the forecast by ${kjobs(r.surprise)}. With the Fed fighting inflation, a strong report means rates stay high for longer: yields jump${r.heat > 0.5 ? ', and hot wages add to the worry' : ''}, and stocks often fall in the first hour.`; }
      else if (r.strength > 1) { cls = 'up'; pill = 'Strong'; msg = `A ${kjobs(r.surprise)} surprise when the Fed is worried about jobs is simply good news: recession fears fade, yields rise a little and stocks usually like it.`; }
      else if (r.strength < -1.5) { cls = 'dn'; pill = 'Weak'; msg = `A miss of ${kjobs(r.surprise)}${U > NOW.urPrev + 0.05 ? ' and a higher unemployment rate' : ''} raises recession worries. Yields fall and rate-cut odds jump${regime === 'infl' ? ', but a report this weak usually hurts stocks anyway' : ', and stocks often drop as traders price a slowdown'}.`; }
      else if (Math.abs(r.strength) < 0.4 && Math.abs(r.heat) < 0.6) { cls = 'up'; pill = 'Goldilocks'; msg = 'Close to the forecast, steady unemployment and normal wages: not too hot, not too cold. Markets usually shrug and move on to the next release.'; }
      else msg = `Mixed report: a ${kjobs(r.surprise)} surprise with wages ${r.heat > 0.2 ? 'running warm' : 'in a normal range'}. The first move after 8:30 am often reverses once traders read the details and revisions.`;
      setMsg(id + '-msg', cls, pill, msg);
      $id(id + '-note').textContent = 'Reactions are a teaching model of typical first moves, not a forecast. Payrolls come from a survey of employers; the unemployment rate comes from a separate survey of households, so they can disagree. Payroll history here is made up.';
    }

    function drawWarn(W) {
      const wave = st.n(id + '-wave'), op = st.n(id + '-op'), un = st.n(id + '-un');
      const ser = claimsSeries(NOW.claims, wave);
      const avg = ser.map((v, i) => (i < 3 ? null : (ser[i] + ser[i - 1] + ser[i - 2] + ser[i - 3]) / 4));
      const compact = W < 480;
      const H1 = Math.round(SML.clamp(W * 0.36, 200, 250)), H2 = 96, H = H1 + H2 + 10;
      const pl = compact ? 40 : 52, pr = compact ? 12 : 20, pt = 34, pb = 26;
      const lo = Math.min(...ser) - 15, hi = Math.max(...ser, NOW.claims + 60) + 10;
      const x = SML.lin(0, 51, pl, W - pr), y = SML.lin(lo, hi, H1 - pb, pt);
      let b = '';
      SML.ticks(lo, hi, 4).forEach((v) => { b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, Math.round(v) + 'K', 'xs mono', 'end'); });
      [0, 13, 26, 39, 51].forEach((i) => { b += S.text(x(i), H1 - pb + 16, i === 51 ? 'this wk' : (i - 51) + 'w', 'xs mono', 'middle'); });
      b += S.poly(ser.map((v, i) => [x(i), y(v)]), 's-mut w1');
      b += S.poly(avg.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean), (wave > 30 ? 's-dn' : 's-info') + ' w25');
      b += S.text(pl, 18, compact ? 'Weekly jobless claims' : 'Initial jobless claims each week (thin) and the 4-week average (thick)', 'sm mut');
      // V/U gauge
      const ratio = op / un, gy = H1 + 10;
      const gx = SML.lin(0, 2.2, pl, W - pr);
      [[0, 0.8, 'f-dn-t', 'slack'], [0.8, 1.2, 'f-acc-t', 'balanced'], [1.2, 2.2, 'f-up-t', 'tight']].forEach(([a, z, cls, lab]) => { b += S.rect(gx(a), gy + 30, gx(z) - gx(a), 18, cls + ' s-line w1') + S.text((gx(a) + gx(z)) / 2, gy + 43, lab, 'xs b ink', 'middle'); });
      [0, 0.5, 1, 1.5, 2].forEach((v) => { b += S.text(gx(v), gy + 66, F.num(v, 1), 'xs mono', 'middle'); });
      const mx = gx(SML.clamp(ratio, 0, 2.2)); b += S.polygon([[mx, gy + 28], [mx - 7, gy + 18], [mx + 7, gy + 18]], 'f-ink');
      b += S.text(pl, gy + 10, compact ? `Openings per unemployed: ${F.num(ratio, 2)}` : `Job openings per unemployed person (JOLTS): ${F.num(ratio, 2)}`, 'sm ink b');
      fig.innerHTML = S.wrap(W, H, `Weekly jobless claims with a 4-week average, and ${F.num(ratio, 2)} job openings per unemployed person`, b);
      G = { view: 'warn' };
      const a4 = avg[51], yr = avg[3];
      setL(id + '-s1', '4-week average claims'); setT(id + '-s1', Math.round(a4) + 'K', wave > 30 ? 'dn' : '');
      setL(id + '-s2', 'Change over the year'); setT(id + '-s2', spc(((a4 - yr) / yr) * 100, 0), a4 > yr * 1.15 ? 'dn' : '');
      setL(id + '-s3', 'Openings per unemployed'); setT(id + '-s3', F.num(ratio, 2), ratio < 0.8 ? 'dn' : ratio > 1.2 ? 'up' : '');
      let cls = 'up', pill = 'Calm', msg = `Claims around ${Math.round(a4)}K a week are steady. Openings per unemployed person of ${F.num(ratio, 2)} ${ratio > 1.2 ? 'means employers are fighting for workers, which pushes wages up.' : ratio < 0.8 ? 'means more people chase each opening, so wage growth tends to cool.' : 'is roughly balanced.'}`;
      if (wave > 30) { cls = 'dn'; pill = 'Warning'; msg = `The 4-week average jumped to ${Math.round(a4)}K. Claims come out every Thursday, weeks before the monthly jobs report, so a steady climb like this is one of the earliest recession warnings traders watch.`; }
      setMsg(id + '-msg', cls, pill, msg);
      $id(id + '-note').textContent = `Claims history is made up around the latest level (${NOW.claims}K in mid-October 2026). The 4-week average smooths out holiday weeks and storms. Openings start at ${F.num(NOW.jolts, 1)} million (August 2026 JOLTS); the unemployed count is an example input. JOLTS comes out about a month after the month it describes, so it is slower than claims.`;
    }
  };

  /* =====================================================================
     3. pmiGauge: ISM manufacturing and services, and GDP
     ===================================================================== */
  const MFG = [['no', 'New orders'], ['pr', 'Production'], ['em', 'Employment'], ['sd', 'Supplier deliveries'], ['in', 'Inventories']];
  const SVC = [['ba', 'Business activity'], ['no', 'New orders'], ['em', 'Employment'], ['sd', 'Supplier deliveries']];
  const PMI_PRESETS = {
    boom: { label: 'Boom', mfg: { no: 61, pr: 60, em: 56, sd: 58, in: 52, px: 72 }, svc: { ba: 60, no: 59, em: 55, sd: 56, px: 66 } },
    steady: { label: 'Steady', mfg: { no: 52.5, pr: 52, em: 50.5, sd: 51, in: 49.5, px: 56 }, svc: { ba: 54, no: 53.5, em: 51, sd: 51, px: 58 } },
    slow: { label: 'Slowing', mfg: { no: 46.5, pr: 48, em: 46, sd: 49, in: 47.5, px: 55 }, svc: { ba: 50.5, no: 49.5, em: 48, sd: 50, px: 60 } },
    rec: { label: 'Recession', mfg: { no: 40, pr: 41, em: 42, sd: 46, in: 44, px: 40 }, svc: { ba: 43, no: 42, em: 44, sd: 48, px: 50 } },
    now: { label: 'Sep 2026', mfg: { no: 55.3, pr: 56.5, em: 52.7, sd: 56.0, in: 52.0, px: 77.9 }, svc: { ba: 56.4, no: 55.8, em: 52.4, sd: 55.0, px: 74 } },
  };
  const GDP_PARTS = [
    { k: 'c', label: 'Consumer spending', f: 'f-up', t: 'up' },
    { k: 'i', label: 'Business investment', f: 'f-info', t: 'info' },
    { k: 'h', label: 'Inventories', f: 'f-acc', t: 'acc' },
    { k: 'g', label: 'Government', f: 'f-vio', t: 'vio' },
    { k: 'x', label: 'Net exports', f: 'f-dn', t: 'dn' },
  ];
  const GDP_PRESETS = {
    normal: { label: 'Consumer-led', c: 1.6, i: 0.5, h: 0.1, g: 0.3, x: -0.2 },
    imports: { label: 'Imports rush in', c: 1.3, i: 1.2, h: 2.2, g: 0.1, x: -4.8 },
    stock: { label: 'Inventory swing', c: 1.2, i: 0.3, h: -2.0, g: 0.4, x: 0.6 },
    rec: { label: 'Recession quarter', c: -1.0, i: -1.6, h: -0.9, g: 0.4, x: 0.5 },
  };
  SML.widgets.pmiGauge = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('xdp');
    const view0 = ['mfg', 'svc', 'gdp'].indexOf(opts.view) >= 0 ? opts.view : 'mfg';
    const pm = PMI_PRESETS.steady, gp = GDP_PRESETS.normal;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'mfg', label: 'ISM Manufacturing' }, { v: 'svc', label: 'ISM Services' }, { v: 'gdp', label: 'GDP' }], view0, 'Report')}<span class="grow"></span>
        <span id="${id}-pb">${ui.seg(id + '-p', Object.keys(PMI_PRESETS).map((k) => ({ v: k, label: PMI_PRESETS[k].label })), 'steady', 'Economy')}</span>
        <span id="${id}-gb">${ui.seg(id + '-q', Object.keys(GDP_PRESETS).map((k) => ({ v: k, label: GDP_PRESETS[k].label })), 'normal', 'Quarter')}</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl" id="${id}-cm">${MFG.map(([k, l]) => ui.slider({ id: id + '-m' + k, label: l, min: 30, max: 70, step: 0.5, value: pm.mfg[k], fmt: (v) => F.num(v, 1) })).join('')}${ui.slider({ id: id + '-mpx', label: 'Prices paid (not in the headline)', min: 30, max: 90, step: 0.5, value: pm.mfg.px, fmt: (v) => F.num(v, 1) })}</div>
      <div class="wg-ctrl" id="${id}-cs">${SVC.map(([k, l]) => ui.slider({ id: id + '-s' + k, label: l, min: 30, max: 70, step: 0.5, value: pm.svc[k], fmt: (v) => F.num(v, 1) })).join('')}${ui.slider({ id: id + '-spx', label: 'Prices paid (not in the headline)', min: 30, max: 90, step: 0.5, value: pm.svc.px, fmt: (v) => F.num(v, 1) })}</div>
      <div class="wg-ctrl" id="${id}-cg">${GDP_PARTS.map((p) => ui.slider({ id: id + '-g' + p.k, label: p.label + ' (points)', min: -6, max: 5, step: 0.1, value: gp[p.k], fmt: (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), 1) })).join('')}</div>
      <div class="wg-read">${ui.stat('a', id + '-s1', 'hl')}${ui.stat('b', id + '-s2')}${ui.stat('c', id + '-s3')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest ? e.target.closest('.seg') : null;
      if (seg && seg.id === id + '-p') { const p = PMI_PRESETS[st.seg(id + '-p')]; MFG.forEach(([k]) => st.set(id + '-m' + k, p.mfg[k])); st.set(id + '-mpx', p.mfg.px); SVC.forEach(([k]) => st.set(id + '-s' + k, p.svc[k])); st.set(id + '-spx', p.svc.px); }
      if (seg && seg.id === id + '-q') { const p = GDP_PRESETS[st.seg(id + '-q')]; GDP_PARTS.forEach((g) => st.set(id + '-g' + g.k, p[g.k])); }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const view = st.seg(id + '-v') || 'mfg';
      $id(id + '-cm').classList.toggle('xd-hide', view !== 'mfg');
      $id(id + '-cs').classList.toggle('xd-hide', view !== 'svc');
      $id(id + '-cg').classList.toggle('xd-hide', view !== 'gdp');
      $id(id + '-pb').classList.toggle('xd-hide', view === 'gdp');
      $id(id + '-gb').classList.toggle('xd-hide', view !== 'gdp');
      if (view === 'gdp') drawGdp(W); else drawPmi(W, view);
    });

    function gauge(cx, cy, R, v, compact) {
      let b = '';
      const ang = (val) => Math.PI * (1 - (SML.clamp(val, 30, 70) - 30) / 40);
      const arc = (a0, a1, cls) => { const p0 = [cx + R * Math.cos(a0), cy - R * Math.sin(a0)], p1 = [cx + R * Math.cos(a1), cy - R * Math.sin(a1)]; return S.path(`M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${R},${R} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`, 'nf ' + cls, ` stroke-width="${compact ? 14 : 18}"`); };
      b += arc(ang(30), ang(50), 's-dn o70') + arc(ang(50), ang(70), 's-up o70');
      [30, 40, 50, 60, 70].forEach((t) => { const a = ang(t); b += S.text(cx + (R + 16) * Math.cos(a), cy - (R + 16) * Math.sin(a) + 4, t, 'xs mono', 'middle'); });
      const a = ang(v); b += S.line(cx, cy, cx + (R - 8) * Math.cos(a), cy - (R - 8) * Math.sin(a), 's-ink w3') + S.circle(cx, cy, 6, 'f-ink');
      b += S.text(cx, cy + 34, F.num(v, 1), 'xxl b disp ' + (v >= 50 ? 'up' : 'dn'), 'middle');
      b += S.text(cx - R, cy + 18, 'shrinking', 'xs dn b', 'start') + S.text(cx + R, cy + 18, 'growing', 'xs up b', 'end');
      return b;
    }
    function drawPmi(W, view) {
      const comps = view === 'mfg' ? MFG : SVC, pre = view === 'mfg' ? '-m' : '-s';
      const vals = comps.map(([k, l]) => ({ k, l, v: st.n(id + pre + k) }));
      const px = st.n(id + pre + 'px');
      const head = vals.reduce((s, c) => s + c.v, 0) / vals.length;
      const compact = W < 560;
      const R = compact ? 86 : 100;
      const gW = compact ? W : Math.min(W * 0.42, 300);
      const cy = R + 50;
      const barsTop = compact ? cy + 60 : 30, bx0 = compact ? 0 : gW + 20;
      const rowH = 30, rows = vals.concat([{ k: 'px', l: 'Prices paid', v: px, px: true }]);
      const H = compact ? barsTop + rows.length * rowH + 30 : Math.max(cy + 56, 30 + rows.length * rowH + 40);
      let b = gauge(gW / 2, cy, R, head, compact);
      b += S.text(gW / 2, 14, view === 'mfg' ? 'ISM Manufacturing PMI' : 'ISM Services PMI', 'sm ink b', 'middle');
      const lab = compact ? 116 : 136;
      const x = SML.lin(30, compact ? 90 : 90, bx0 + lab, W - 44);
      rows.forEach((r, i) => {
        const yy = barsTop + i * rowH + 14;
        b += S.text(bx0, yy + 4, r.l, 'sm ' + (r.px ? 'vio b' : 'ink'));
        b += S.rect(x(30), yy - 7, x(Math.max(30, r.v)) - x(30), 14, r.px ? 'f-vio o70' : r.v >= 50 ? 'f-up o70' : 'f-dn o70', 2);
        b += S.text(x(Math.max(30, r.v)) + 6, yy + 4, F.num(r.v, 1), 'sm mono b ' + (r.px ? 'vio' : r.v >= 50 ? 'up' : 'dn'));
      });
      const x50 = x(50); b += S.line(x50, barsTop + 2, x50, barsTop + rows.length * rowH + 2, 's-acc dash w15') + S.text(x50, barsTop + rows.length * rowH + 16, '50 = no change', 'xs acc b', 'middle');
      if (rows.length && !compact) b += S.text(bx0, 18, view === 'mfg' ? 'Five parts, equal weight' : 'Four parts, equal weight', 'sm mut');
      fig.innerHTML = S.wrap(W, H, `${view === 'mfg' ? 'Manufacturing' : 'Services'} PMI of ${F.num(head, 1)} built from its parts`, b);
      const nominv = view === 'mfg' ? st.n(id + '-mno') - st.n(id + '-min') : st.n(id + '-sno') - 50;
      setL(id + '-s1', view === 'mfg' ? 'Manufacturing PMI' : 'Services PMI'); setT(id + '-s1', F.num(head, 1), head >= 50 ? 'up' : 'dn');
      setL(id + '-s2', view === 'mfg' ? 'New orders minus inventories' : 'New orders vs 50'); setT(id + '-s2', (nominv > 0 ? '+' : nominv < 0 ? F.minus : '') + F.num(Math.abs(nominv), 1), nominv > 0 ? 'up' : nominv < 0 ? 'dn' : '');
      setL(id + '-s3', 'Prices paid'); setT(id + '-s3', F.num(px, 1), px >= 60 ? 'dn' : '');
      let cls = head >= 50 ? 'up' : 'dn', pill = head >= 52 ? 'Growing' : head >= 50 ? 'Barely growing' : head >= 46 ? 'Shrinking' : 'Deep drop', msg;
      const sect = view === 'mfg' ? 'industrials, materials, energy and transport stocks' : 'banks, retailers and travel companies';
      if (head >= 52) msg = `A reading of ${F.num(head, 1)} means more ${view === 'mfg' ? 'factories' : 'service businesses'} say activity rose than fell. That tends to lift ${sect}. ${nominv > 3 ? 'New orders are well ahead, a good sign for the next few months.' : ''}`;
      else if (head >= 50) msg = `Just above 50: growth, but barely. Traders look at new orders${view === 'mfg' ? ' minus inventories' : ''} (${(nominv >= 0 ? '+' : F.minus) + F.num(Math.abs(nominv), 1)}) for the direction of the next few months.`;
      else msg = `Below 50, more firms report shrinking than growing. ${head < 46 ? 'Readings this low have often come with recessions, and money tends to rotate into defensive stocks such as utilities and health care.' : 'One month below 50 is common; a run of them, with falling new orders, is the warning.'}`;
      if (px >= 65) { msg += ` Prices paid at ${F.num(px, 1)} signal cost pressure that can show up in CPI later.`; if (cls === 'up') { cls = 'acc'; pill = 'Hot prices'; } }
      setMsg(id + '-msg', cls, pill, msg);
      const nowNote = st.seg(id + '-p') === 'now' ? (view === 'mfg' ? ' In the Sep 2026 example the headline (54.5), new orders, employment and prices paid are ISM’s figures; production, deliveries and inventories are filled in to match.' : ' In the Sep 2026 example the headline (54.9) and prices paid are ISM’s figures; the four parts are filled in to match.') : '';
      $id(id + '-note').textContent = (view === 'mfg' ? 'The ISM Manufacturing PMI is the average of these five parts. Prices paid is published alongside it but is not in the headline. Out at 10:00 am ET on the first business day of the month.' : 'The ISM Services PMI is the average of these four parts. Services are most of the US economy, so this reading often matters more than manufacturing. Out at 10:00 am ET on the third business day of the month.') + nowNote;
    }

    function drawGdp(W) {
      const vals = GDP_PARTS.map((p) => ({ p, v: st.n(id + '-g' + p.k) }));
      const total = vals.reduce((s, c) => s + c.v, 0);
      const compact = W < 520;
      const lab = compact ? 104 : 160, pr = compact ? 50 : 70, pt = 34, rowH = 34;
      const rows = vals.concat([{ p: { label: 'GDP growth', t: total >= 0 ? 'up' : 'dn', f: total >= 0 ? 'f-up' : 'f-dn' }, v: total, tot: true }]);
      const H = pt + rows.length * rowH + 30;
      let run = 0; const ends = [];
      vals.forEach((c) => { ends.push([run, run + c.v]); run += c.v; });
      const lo = Math.min(0, ...ends.flat(), total) - 0.5, hi = Math.max(0.5, ...ends.flat(), total) + 0.5;
      const x = SML.lin(lo, hi, lab, W - pr);
      let b = '';
      SML.ticks(lo, hi, compact ? 4 : 6).forEach((v) => { b += S.line(x(v), pt - 6, x(v), pt + rows.length * rowH - 6, 's-grid') + S.text(x(v), pt + rows.length * rowH + 10, F.num(v, 0) + '%', 'xs mono', 'middle'); });
      b += S.line(x(0), pt - 6, x(0), pt + rows.length * rowH - 6, 's-mut w15');
      rows.forEach((r, i) => {
        const yc = pt + i * rowH + rowH / 2 - 4;
        const a = r.tot ? 0 : ends[i][0], z = r.tot ? r.v : ends[i][1];
        b += S.text(0, yc + 4, compact ? r.p.label.replace('Business ', '').replace('Consumer spending', 'Consumers') : r.p.label, r.tot ? 'md ink b' : 'sm ink');
        b += S.rect(Math.min(x(a), x(z)), yc - (r.tot ? 11 : 9), Math.max(1.5, Math.abs(x(z) - x(a))), r.tot ? 22 : 18, r.p.f + (r.tot ? '' : ' o70'), 2);
        if (i < rows.length - 1 && !r.tot) b += S.line(x(z), yc + 9, x(z), yc + rowH - 9, 's-mut dash2');
        const tx = Math.max(x(a), x(z)) + 6;
        b += S.text(tx, yc + 4, (r.v > 0 ? '+' : r.v < 0 ? F.minus : '') + F.num(Math.abs(r.v), 1), 'sm mono b ' + (r.v >= 0 ? 'up' : 'dn'));
      });
      if (rows.length) b += S.line(lab, pt + (rows.length - 1) * rowH - 4, W - pr, pt + (rows.length - 1) * rowH - 4, 's-line');
      b += S.text(0, 16, compact ? 'Points each part adds to growth' : 'Each part adds or subtracts points; together they make GDP growth (annual rate)', 'sm mut');
      fig.innerHTML = S.wrap(W, H, `GDP growth of ${F.num(total, 1)}% at an annual rate, built from its parts`, b);
      const qq = (Math.pow(1 + total / 100, 0.25) - 1) * 100;
      setL(id + '-s1', 'GDP growth, annual rate'); setT(id + '-s1', spc(total), total >= 0 ? 'up' : 'dn');
      setL(id + '-s2', 'Same quarter, not annualized'); setT(id + '-s2', spc(qq, 2));
      setL(id + '-s3', 'Consumers’ share of growth'); setT(id + '-s3', total > 0.05 ? F.num((vals[0].v / total) * 100, 0) + '%' : '—');
      const xv = vals[4].v, hv = vals[2].v;
      let cls = total >= 1.5 ? 'up' : total >= 0 ? 'acc' : 'dn', pill = total >= 1.5 ? 'Growing' : total >= 0 ? 'Slow' : 'Shrinking', msg;
      if (Math.abs(xv) >= 2 || Math.abs(hv) >= 1.5) { cls = 'info'; pill = 'Look inside'; msg = `The headline is ${spc(total)}, but ${Math.abs(xv) >= 2 ? 'net exports' : 'inventories'} swing it by ${F.num(Math.abs(Math.abs(xv) >= 2 ? xv : hv), 1)} points. Traders strip those out and watch consumer spending plus business investment (here ${spc(vals[0].v + vals[1].v)}), which says more about real demand.`; }
      else if (total < 0) msg = `GDP shrank at a ${pc(-total)} annual rate. Two weak quarters in a row worry markets, but the official recession call comes later, from the NBER, using jobs, income and spending too.`;
      else msg = `Consumers add ${spc(vals[0].v)} of the ${spc(total)}. Consumer spending is the biggest part of the US economy, which is why retail sales and confidence reports get so much attention.`;
      setMsg(id + '-msg', cls, pill, msg);
      $id(id + '-note').textContent = 'US GDP growth is reported at an annual rate: a quarter that grows about 0.5% shows up as about 2%. The first (advance) estimate comes out about a month after the quarter, then two revisions follow. Example quarters are made up.';
    }
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    cpiRI: { t: 'BLS: CPI relative importance, December 2025', u: 'https://www.bls.gov/cpi/tables/relative-importance/2025.htm' },
    cpiSep: { t: 'BLS: Consumer Price Index news release, September 2026', u: 'https://www.bls.gov/news.release/cpi.nr0.htm' },
    cpiSched: { t: 'BLS: CPI release schedule', u: 'https://www.bls.gov/schedule/news_release/cpi.htm' },
    peak: { t: 'BLS: consumer prices up 9.1% over the year ended June 2022', u: 'https://www.bls.gov/opub/ted/2022/consumer-prices-up-9-1-percent-over-the-year-ended-june-2022-largest-increase-in-40-years.htm' },
    fed2: { t: 'Federal Reserve: Statement on Longer-Run Goals (2% PCE inflation)', u: 'https://www.federalreserve.gov/monetarypolicy/files/FOMC_LongerRunGoals.pdf' },
    pce: { t: 'BEA: Personal Income and Outlays, August 2026', u: 'https://www.bea.gov/news/2026/personal-income-and-outlays-august-2026' },
    ppi: { t: 'BLS: Producer Price Index news release', u: 'https://www.bls.gov/news.release/ppi.nr0.htm' },
    hist: { t: 'Federal Reserve History: The Great Inflation', u: 'https://www.federalreservehistory.org/essays/great-inflation' },
    emp: { t: 'BLS: The Employment Situation, September 2026', u: 'https://www.bls.gov/news.release/empsit.nr0.htm' },
    empSched: { t: 'BLS: Employment Situation release schedule', u: 'https://www.bls.gov/schedule/news_release/empsit.htm' },
    claims: { t: 'Department of Labor: weekly unemployment insurance claims', u: 'https://www.dol.gov/ui/data.pdf' },
    jolts: { t: 'BLS: Job Openings and Labor Turnover Survey news release', u: 'https://www.bls.gov/news.release/jolts.nr0.htm' },
    lapse: { t: 'BLS: release dates changed by the 2025 funding lapse', u: 'https://www.bls.gov/bls/2025-lapse-revised-release-dates.htm' },
    ism: { t: 'ISM: Report On Business release calendar', u: 'https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/' },
    ismSep: { t: 'First Trust: ISM manufacturing index 54.5 in September 2026', u: 'https://www.ftportfolios.com/Commentary/EconomicResearch/2026/10/1/the-ism-manufacturing-index-declined-to-54.5-in-september' },
    spg: { t: 'S&P Global: PMI release dates', u: 'https://www.pmi.spglobal.com/Public/Release/ReleaseDates' },
    gdp: { t: 'BEA: Gross Domestic Product', u: 'https://www.bea.gov/data/gdp/gross-domestic-product' },
    retail: { t: 'Census Bureau: economic indicator calendar', u: 'https://www.census.gov/economic-indicators/calendar-listview-2026.html' },
  };

  SML.lessons.push({
    id: 'l-inflation', course: 'econ', order: 1, title: 'Inflation: CPI, PCE and PPI', mins: 10, level: 'Beginner',
    summary: 'How inflation is measured, why the Fed aims for 2% and how hot or cool reports move markets.',
    idea: 'Inflation is how fast prices rise. Hot readings push interest rates and bond yields up, which usually pulls stock prices down.',
    widget: 'inflationCalc', opts: {},
    try: 'Slide inflation and the years to see what your money is really worth. Then open the price basket and change one category at a time.',
    body: [
      '<p><b>Inflation</b> is the speed at which prices rise. At 3% a year, something that costs $100 today costs about $134 in ten years. The same dollars buy less, so money that earns less than inflation is quietly shrinking.</p>',
      '<h3>The three reports traders watch</h3><ul><li><b>CPI</b> (Consumer Price Index) from the Bureau of Labor Statistics: prices consumers pay, out around the middle of each month at 8:30 am Eastern (for example October 14 and November 10, 2026). It is the headline number on the news.</li><li><b>PCE</b> (personal consumption expenditures price index) from the Bureau of Economic Analysis: a wider measure of spending, out near the end of the month at 8:30 am with the personal income report. This is the one the Federal Reserve uses for its <b>2% goal</b>. Since 2000, CPI has run about half a point above PCE on average, mostly because the two weigh housing differently.</li><li><b>PPI</b> (Producer Price Index): prices businesses receive. Rising costs here can show up in consumer prices a few months later.</li></ul>',
      `<h3>Headline, core and the shelter effect</h3><p><b>Headline</b> inflation includes everything. <b>Core</b> leaves out food and energy, which jump around with weather, wars and oil supply, so core shows the slower trend underneath. Housing costs (shelter) are about ${F.num(CATS[0].w, 0)}% of CPI but closer to 15% of PCE, which is one reason the two measures often differ. Shelter also moves slowly, because it tracks rents people already pay, not just new leases.</p>`,
      '<h3>How inflation moves markets</h3><ul><li><b>Hotter than expected:</b> traders expect higher interest rates for longer. Bond yields rise, the dollar usually firms, and stocks tend to fall, growth stocks most, because their profits sit far in the future and are worth less when rates are high.</li><li><b>Cooler than expected:</b> the opposite. Rate cuts look closer, yields fall and stocks often rally.</li><li><b>What matters is the surprise:</b> markets price in the forecast before the report. A 3% reading can lift stocks if 3.3% was expected. See <a href="#l-data-day">trading data-release days</a>.</li></ul>',
      '<h3>Lessons from the past</h3><p>In the 1970s inflation climbed into double digits while growth stalled, a mix called <b>stagflation</b>. CPI inflation peaked near 15% in 1980, and Fed chair Paul Volcker pushed short-term rates close to 20% to break it, causing a deep recession. In June 2022 CPI inflation reached 9.1%, the highest in about 40 years. The Fed raised rates at the fastest pace in decades, and both stocks and bonds fell that year: an S&P 500 index fund lost about 18%. On September 13, 2022 alone, a hotter-than-expected CPI report knocked the S&P 500 down 4.3%.</p>',
      `<h3>Where inflation stands now</h3><p>CPI rose ${pc(NOW.cpi)} over the year to ${NOW.month}, a touch above the 3.6% forecast, while core CPI was ${pc(NOW.core)}. The gap is energy: energy prices were up ${pc(NOW.energy)} on the year. PCE inflation for August was ${pc(NOW.pce)}, with core PCE at ${pc(NOW.corePce)}, unusually above core CPI after a change in how the government measures some services. Producer prices (PPI) were up ${pc(NOW.ppi)}, a warning that costs are still flowing through. After the CPI report, traders raised the odds of another Fed rate hike. The next CPI comes out on November 10, 2026 at 8:30 am ET; every date is on the <a href="#calendar">calendar</a>.</p><p>Data can have gaps. During the 43-day government shutdown in late 2025, the October 2025 CPI was never published, which is why some year-over-year comparisons for that month are missing.</p>`,
      '<h3>What it means for your money</h3><ul><li>Keep cash in places that pay close to inflation, such as high-yield savings, Treasury bills or a money market fund (see <a href="#l-emergency">where to park cash</a>).</li><li>Over decades, owning businesses through <a href="#l-index-funds">index funds</a> has beaten inflation, with big swings along the way.</li><li>Long-term bonds suffer most when inflation surprises upward; see <a href="#l-rates">rates and the yield curve</a>.</li></ul>',
    ],
    example: {
      title: 'The same $50,000, two places to park it',
      intro: 'Inflation averages 3.7% a year (the CPI rate for September 2026). Taxes are ignored.',
      steps: [
        'Maya leaves $50,000 in a savings account paying 0.6%. After 10 years the balance reads $53,082.',
        'Prices rose 1.037 to the 10th power, or 43.8% in total, so each of her dollars buys less.',
        'In today’s dollars her account is worth $53,082 ÷ 1.438 = $36,912. She lost about $13,100 of buying power while the balance went up.',
        'Her brother puts the same $50,000 in Treasury bills paying 4.2%. After 10 years he has $75,448, or $52,464 in today’s dollars.',
        'Both took almost no risk, but one choice kept up with inflation and the other did not.',
      ],
      result: 'Same money, same safety, about $15,600 apart in buying power after ten years.',
    },
    mistakes: [
      'Comparing your savings rate with zero instead of with inflation. A 0.6% account loses ground when prices rise 3.7%.',
      'Reading only the headline number. Energy can swing it by a point or more; core shows the trend the Fed cares about.',
      'Treating CPI and PCE as the same number. The Fed’s 2% goal is for PCE, which usually runs a little below CPI.',
      'Trading the first seconds after 8:30 am. Spreads widen and the first move often reverses once traders read the details.',
    ],
    points: [
      'Inflation is the speed prices rise; money earning less than inflation loses buying power.',
      'CPI is the headline consumer measure, PCE is the Fed’s 2% target, PPI shows business costs.',
      'Core inflation leaves out food and energy to show the underlying trend.',
      'Hotter-than-expected inflation usually means higher yields and lower stock prices, especially for growth stocks.',
      'Markets react to the surprise against the forecast, not to the number alone.',
    ],
    terms: ['Inflation', 'CPI', 'Core inflation', 'PCE', 'PPI', 'Stagflation'],
    glossary: [{ t: 'Shelter', d: 'Housing costs in CPI: rent and the estimated rent owners would pay. About a third of the index.' }],
    quiz: { q: 'Which inflation measure does the Federal Reserve use for its 2% goal?', options: ['CPI', 'PCE', 'PPI'], answer: 1, why: 'The Fed’s 2% target is set in terms of the PCE price index, which covers a wider range of spending than CPI.' },
    sources: [SRC.cpiSep, SRC.pce, SRC.fed2, SRC.peak],
  });

  SML.lessons.push({
    id: 'l-jobs', course: 'econ', order: 2, title: 'The jobs report and jobless claims', mins: 9, level: 'Intermediate',
    summary: 'Payrolls, unemployment, wages and weekly claims, and why good news can be bad for stocks.',
    idea: 'The jobs report shows how fast the economy is hiring. Markets react to the surprise against the forecast, filtered through what the Fed is worried about.',
    widget: 'jobsReport', opts: {},
    try: 'Drag this month’s payroll bar or pick an example report, then flip what the Fed is worried about and watch the reactions change.',
    body: [
      '<p>The <b>Employment Situation</b> report from the Bureau of Labor Statistics comes out at 8:30 am Eastern, usually on the first Friday of the month (the next ones are November 6 and December 4, 2026). Traders call it jobs Friday. It packs several numbers into one release.</p>',
      '<h3>What is in the report</h3><ul><li><b>Nonfarm payrolls:</b> how many jobs employers added or cut last month, from a survey of businesses.</li><li><b>Unemployment rate:</b> the share of the labor force (people working or actively looking) who are jobless and looking, from a separate survey of households. The two surveys can disagree in any one month.</li><li><b>Average hourly earnings:</b> wage growth. Fast wage gains can feed inflation, especially in services.</li><li><b>Revisions:</b> the two previous months are updated. A big downward revision can matter as much as the new number.</li></ul>',
      '<h3>Why good news can be bad news</h3><p>When the Fed is fighting inflation, a hot jobs report means rates stay high for longer. Bond yields jump and stocks can fall on “good” news. When the Fed is more worried about a weakening job market, the same strong report is simply good news. Always ask which problem the Fed is focused on; the <a href="#l-fed">Fed lesson</a> explains how it decides.</p>',
      '<h3>The early warnings: weekly claims and JOLTS</h3><ul><li><b>Initial jobless claims</b> come out every Thursday at 8:30 am. They count new filings for unemployment benefits, so they turn before the monthly report does. Watch the 4-week average to smooth out holidays and storms.</li><li><b>JOLTS</b> (job openings) comes out at 10:00 am about a month after the month it covers, usually on a Tuesday. Openings per unemployed person show how tight the job market is.</li><li>A steady rise in claims together with a rising unemployment rate is a classic recession warning; see <a href="#l-cycle">the business cycle</a>.</li></ul>',
      `<h3>Where jobs stand now</h3><p>Employers added only ${NOW.nfp},000 jobs in ${NOW.month}, and July and August were revised down by a combined 60,000. The unemployment rate edged up to ${pc(NOW.ur)} from 4.1%, wages grew ${pc(NOW.ahe)} over the year and weekly jobless claims were low, near ${NOW.claims},000 in mid-October. Job openings were ${F.num(NOW.jolts, 1)} million in August. Hiring is slow, but layoffs are not rising: a soft job market, not a breaking one. The widget starts from these levels.</p><p>Gaps happen: the October 2025 jobs report was cancelled during the 43-day government shutdown, and the household survey for that month was never collected.</p>`,
      '<h3>How to use it as a trader</h3><ul><li>Know the forecast before the release. The surprise, including revisions, drives the first move.</li><li>Size down or stay flat into 8:30 am; see <a href="#l-data-day">trading data-release days</a>.</li><li>Watch the 2-year Treasury yield. It reacts fastest to what the report means for the Fed.</li></ul>',
    ],
    example: {
      title: 'A soft jobs Friday',
      intro: 'Made-up numbers. The Fed has said it is watching the job market closely.',
      steps: [
        'Economists expect +110,000 jobs. The report shows +45,000.',
        'The two previous months are revised down by a combined 40,000, so the total surprise is 45,000 − 110,000 − 40,000 = −105,000 jobs.',
        'The unemployment rate rises from 4.3% to 4.5%, and wage growth slows to 3.4% a year.',
        'Traders read this as a cooling job market. The 2-year yield falls and the odds of a rate cut jump within minutes.',
        'With the Fed worried about jobs, stocks often fall too, because a weak report raises recession fears. In the widget, pick Soft and the weak-job-market worry to see it.',
      ],
      result: 'The headline miss was 65,000 jobs, but revisions made the real surprise about 105,000.',
    },
    mistakes: [
      'Ignoring revisions. A good headline can hide big downward changes to earlier months.',
      'Reading payrolls and the unemployment rate as one survey. They come from different surveys and can point different ways.',
      'Assuming a strong report is always good for stocks. It depends on whether the Fed is fighting inflation or a slowdown.',
      'Treating one week of jobless claims as a trend. Use the 4-week average.',
    ],
    points: [
      'Jobs reports usually land on a Friday at 8:30 am ET: payrolls, unemployment rate, wages and revisions.',
      'The market moves on the surprise against the forecast, including revisions.',
      'When the Fed fights inflation, strong jobs can push yields up and stocks down.',
      'Weekly claims (Thursdays) and JOLTS are earlier and slower clues about the job market.',
    ],
    terms: ['Nonfarm payrolls', 'Unemployment rate', 'Jobless claims', 'JOLTS', 'Consensus estimate'],
    glossary: [{ t: 'Average hourly earnings', d: 'Wage growth from the jobs report. Watched for signs of wage-driven inflation.' }, { t: 'Revision', d: 'An update to an earlier month’s number when more survey answers come in.' }],
    quiz: { q: 'The Fed is fighting inflation and payrolls beat the forecast by 150,000. What often happens first?', options: ['Bond yields fall and stocks jump', 'Bond yields rise and stocks dip', 'Nothing, jobs data does not move markets'], answer: 1, why: 'A strong report makes higher rates for longer more likely, so yields rise and stocks often dip at first.' },
    sources: [SRC.emp, SRC.empSched, SRC.claims, SRC.jolts, SRC.lapse],
  });

  SML.lessons.push({
    id: 'l-pmi', course: 'econ', order: 3, title: 'PMI, GDP and retail sales', mins: 9, level: 'Intermediate',
    summary: 'The 50 line in PMI surveys, how GDP is built and what consumer spending reports say about stocks.',
    idea: 'PMI surveys are the fastest read on business: above 50 means growing. GDP is the slower, fuller picture, and consumers drive most of it.',
    widget: 'pmiGauge', opts: {},
    try: 'Move the parts of the ISM index and watch the headline and gauge. Then switch to GDP and pick an example quarter.',
    body: [
      '<p>A <b>PMI</b> (purchasing managers’ index) asks purchasing managers whether things got better, worse or stayed the same this month. The answers are turned into an index where <b>50 means no change</b>: above 50, more firms say growing; below 50, more say shrinking.</p>',
      '<h3>The ISM reports</h3><ul><li><b>ISM Manufacturing PMI</b>: out at 10:00 am Eastern on the first business day of the month. The headline is the average of five parts: new orders, production, employment, supplier deliveries and inventories.</li><li><b>ISM Services PMI</b>: out at 10:00 am on the third business day. Four parts: business activity, new orders, employment and supplier deliveries. Services are most of the US economy.</li><li><b>Prices paid</b> is published with each report but is not part of the headline. A jump there often comes before higher inflation readings.</li><li>S&amp;P Global also publishes US PMIs at 9:45 am, with an early “flash” estimate around the third or fourth week of the month (October 23, 2026 for October).</li></ul>',
      '<h3>Reading the parts</h3><ul><li><b>New orders</b> are future work, so they tend to lead. New orders above inventories is a sign production will pick up.</li><li><b>Employment</b> gives a hint before the jobs report.</li><li>One month below 50 is common. A run of readings in the low or mid-40s has often come with recessions.</li></ul>',
      '<h3>GDP: the full picture, later</h3><p><b>GDP</b> (gross domestic product) adds up everything the economy produces. The Bureau of Economic Analysis publishes an advance estimate about a month after each quarter, then two revisions. US growth is quoted at an <b>annual rate</b>: a quarter that grows about 0.5% is reported as about 2%. Consumer spending is the biggest part, roughly two thirds. Inventories and net exports can swing the headline a lot from quarter to quarter, so traders watch consumer spending plus business investment for the real demand underneath.</p>',
      '<h3>Retail sales and confidence</h3><p>The Census Bureau’s advance retail sales report comes out around the middle of the month at 8:30 am. It is an early read on consumers. Retail sales are in dollars, so part of any rise can just be higher prices; the “control group” (which leaves out cars, gas, building materials and restaurants) is the part that feeds GDP. Consumer confidence surveys from the University of Michigan (a preliminary reading mid-month and a final one late in the month) and the Conference Board show how people feel, which does not always match how they spend.</p>',
      '<h3>Other releases on the calendar</h3><ul><li><b>Durable goods orders</b> (Census, 8:30 am, near the end of the month, for example October 27, 2026): orders for things meant to last three years or more. Orders for core capital goods, which leave out aircraft and defense, are watched as a sign of business investment.</li><li><b>Housing starts and building permits</b> (Census, 8:30 am, mid to late month): how many new homes break ground. Housing is very sensitive to mortgage rates, so it often turns early.</li><li><b>Employment Cost Index</b> (BLS, 8:30 am, once a quarter, for example October 30, 2026): pay plus benefits. The Fed likes it because, unlike average hourly earnings, it is not skewed when the mix of jobs changes.</li><li><b>Industrial production</b> (Federal Reserve, around the middle of each month): output of factories, mines and utilities, a check on what the manufacturing PMI says.</li><li><b>Leading Economic Index</b> (Conference Board, 10:00 am, monthly): a blend of early indicators such as claims, new orders, building permits and the yield curve, built to turn before the economy does.</li></ul><p>Every date is on the <a href="#calendar">calendar</a>.</p>',
      `<h3>Where things stand now</h3><p>In ${NOW.month} the ISM Manufacturing PMI was ${F.num(NOW.ismM, 1)} and the Services PMI ${F.num(NOW.ismS, 1)}: both comfortably above 50. But prices paid hit 77.9 in manufacturing and about 74 in services, a sign that cost pressure is building. GDP grew at a ${pc(NOW.gdp)} annual rate in the second quarter; the third-quarter advance estimate is due October 29, 2026. Retail sales jumped 0.8% in September, though much of that was gas prices; the control group rose only 0.1%. Meanwhile the University of Michigan sentiment index fell to ${F.num(NOW.umich, 1)} in its October preliminary reading, among the lowest in its history. Busy businesses, gloomy households: a good reminder that each report shows only part of the picture.</p>`,
      '<h3>Which stocks react</h3><ul><li>Strong manufacturing data tends to lift <b>industrials, materials, energy and transport</b>.</li><li>Strong consumer data helps <b>retailers, travel and banks</b>.</li><li>Weak data sends money toward <b>defensives</b> such as utilities, staples and health care. See <a href="#l-cycle">the business cycle</a>.</li></ul>',
    ],
    example: {
      title: 'Reading an ISM morning',
      intro: 'Made-up numbers for one manufacturing report.',
      steps: [
        'The parts come in at new orders 51.2, production 49.0, employment 46.8, supplier deliveries 50.6 and inventories 45.4.',
        'The headline is their average: (51.2 + 49.0 + 46.8 + 50.6 + 45.4) ÷ 5 = 48.6, below 50.',
        'But new orders minus inventories is 51.2 − 45.4 = +5.8. Orders are arriving faster than stock is piling up, an early sign of a turn.',
        'Prices paid jumps to 62. That warns that costs are rising and could show up in inflation later.',
        'Industrial stocks may rise on the orders while bond yields tick up on the prices. One report, two stories.',
      ],
      result: 'A sub-50 headline with strong new orders is often the first sign a manufacturing slump is ending.',
    },
    mistakes: [
      'Treating a PMI of 49 as a recession. Small dips below 50 are common; direction and new orders matter more.',
      'Watching only manufacturing. Services are the bigger part of the US economy.',
      'Forgetting that US GDP is annualized. A 2% headline is about 0.5% growth in that quarter.',
      'Reading retail sales without inflation in mind. Sales up 3% with prices up 3% means about the same amount of stuff.',
    ],
    points: [
      'PMI above 50 means growing, below 50 means shrinking; new orders lead.',
      'ISM Manufacturing comes out on the first business day, ISM Services on the third, both at 10:00 am ET.',
      'GDP is quoted at an annual rate and revised twice; consumers are about two thirds of it.',
      'Strong data helps cyclical stocks, weak data favors defensives.',
    ],
    terms: ['PMI', 'GDP', 'Retail sales', 'Leading indicator', 'Cyclical stocks', 'Defensive stocks'],
    glossary: [{ t: 'Prices paid', d: 'The PMI part that tracks what firms pay for inputs. An early inflation clue.' }, { t: 'Annual rate', d: 'Quarterly growth scaled up to a full year, the way US GDP is reported.' }],
    quiz: { q: 'An ISM Manufacturing PMI of 48 means…', options: ['Factory output fell 2%', 'More firms reported shrinking than growing', 'The economy is officially in recession'], answer: 1, why: 'PMI is a survey index: below 50 means more firms reported declines than gains. It is not a percent change and not a recession call.' },
    sources: [SRC.ism, SRC.ismSep, SRC.spg, SRC.gdp, SRC.retail],
  });
})();
