/* Stock Market Lessons: Trading track, Oil, Metals & Geopolitics part 3 (tension, war, sanctions, tariffs; the dollar). Fork M5. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const k$ = (v) => {
    const a = Math.abs(v), s = v < 0 ? F.minus : '';
    if (a >= 1e6) return s + '$' + parseFloat((a / 1e6).toFixed(2)) + 'M';
    if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return s + '$' + Math.round(a);
  };
  const b$ = (v) => (v < 0 ? F.minus : '') + '$' + Math.abs(v).toFixed(1).replace(/\.0$/, '') + 'B';
  const sp = (v, d) => F.spct(v * 100, d == null ? 1 : d);

  SML.css(`
.xgeo-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px 0;font:500 11px/1.3 var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.xgeo-legend i{display:inline-block;width:16px;height:0;border-top:2.5px solid;margin-right:6px;vertical-align:3px}
.xgeo-ex{padding:12px 16px 0;font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 85%,transparent)}
.xgeo-ex b{color:var(--ink)}
.xgeo-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);border-top:1px solid var(--line)}
@media(min-width:620px){.xgeo-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
.xgeo-tile{background:var(--surface);padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
.xgeo-tile .n{font:600 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.xgeo-tile .v{font:600 15px/1.25 var(--mono);color:var(--ink)}
.xgeo-tile .v.up{color:var(--up)} .xgeo-tile .v.dn{color:var(--down)} .xgeo-tile .v.acc{color:var(--accent)}
.xgeo-tile .d{font-size:12.5px;line-height:1.4;color:var(--muted)}
.xgeo-sub{padding:12px 16px 0;font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.2em;color:var(--muted)}
.xgeo-do{list-style:none;display:flex;flex-direction:column;gap:8px;padding:10px 16px 14px}
.xgeo-do li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:10px;font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.xgeo-do li i{font-style:normal;font:700 13px/1.5 var(--mono);color:var(--up)}
.xgeo-do li.no i{color:var(--down)}
.xgeo-ww{display:grid;grid-template-columns:1fr;gap:1px;background:var(--line);border-top:1px solid var(--line)}
@media(min-width:620px){.xgeo-ww{grid-template-columns:1fr 1fr}}
.xgeo-ww > div{background:var(--surface);padding:12px 16px}
.xgeo-ww h4{font:600 11px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
.xgeo-ww h4.up{color:var(--up)} .xgeo-ww h4.dn{color:var(--down)}
.xgeo-ww ul{list-style:none;display:flex;flex-direction:column;gap:7px}
.xgeo-ww li{font-size:14px;line-height:1.45;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.xgeo-ww li b{color:var(--ink)}
.xgeo-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;grid-column:1/-1}
.xgeo-row .lab{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.xgeo-row .seg{flex-wrap:wrap}
`);

  /* shared axis helpers */
  const yAxis = (ticks, y, x0, x1, fmt) => ticks.map((v) => S.line(x0, y(v), x1, y(v), v === 0 ? 's-mut' : 's-grid') + S.text(x0 - 6, y(v) + 3.5, fmt(v), 'xs mono', 'end')).join('');

  /* =====================================================================
     shockRecovery
     ===================================================================== */
  /* Each example uses calendar days after the event. dd = S&P 500 total fall, trough = day of the low (approximate where
     the source gives no date), rec = day of the recovery milestone (recLabel), oilPts = documented oil moves (fraction vs
     the start), spxPts = extra documented S&P points. Sources: LPL Research (27 events, Mar 2026), Federal Reserve History,
     EIA, FactSet, AAA, research/macro.md. */
  const SHOCKS = [
    { k: 'avg', label: 'Typical event', ex: 'Average of 27 geopolitical shocks since 1941', dd: 0.044, trough: 18, rec: 39, recLabel: 'back to start', seed: 11,
      text: '<b>LPL Research studied 27 geopolitical shocks since 1941.</b> On average the S&amp;P 500 fell 1.0% on the first day and 4.4% in total, hit bottom after about 18 days and was back to its starting level after about 39 days. The median fall was only 2.9%.',
      first: [['Oil', 'up', 'Often first to jump on supply fears.'], ['Gold', 'up', 'Bought as a safe haven.'], ['Volatility', 'up', 'The VIX “fear gauge” spikes.'], ['Treasuries', 'acc', 'Often bought for safety, unless inflation is the worry.'], ['Stocks', 'dn', 'Usually a short dip, then recovery.'], ['Energy and defense', 'up', 'Often seen as relative winners.']] },
    { k: 'pearl', label: 'Surprise attack', ex: 'Pearl Harbor, December 1941', dd: 0.198, trough: 140, rec: 307, recLabel: 'back to start', seed: 23,
      text: '<b>Pearl Harbor (December 7, 1941)</b> is one of the two big outliers in LPL’s study: the S&amp;P 500 fell about 19.8% in total and took about 307 days to get back to its starting level, as the US entered a long war with no clear end.',
      first: [['Stocks', 'dn', 'A 19.8% fall and about 307 days to recover.'], ['Uncertainty', 'dn', 'No one knew how long the war would last.'], ['Safe havens', 'up', 'Money moved to cash and government bonds.'], ['Industry', 'up', 'Factories switched to war production.'], ['Duration', 'acc', 'One of the slowest recoveries in LPL’s list.'], ['Lesson', 'acc', 'Long, uncertain conflicts hurt more than one-off events.']] },
    { k: 'kuwait', label: 'War that hits oil', ex: 'Iraq invades Kuwait, August 1990', dd: 0.169, trough: 70, rec: 189, recLabel: 'back to start', oilPts: [[0, 0], [75, 1.7]], oilNote: 'oil: $17 to a $46 peak', seed: 31,
      text: '<b>Iraq invaded Kuwait on August 2, 1990.</b> Oil went from about $17 a barrel (July average) to a peak near $46 in mid-October and helped tip the US into the 1990–91 recession. The S&amp;P 500 fell about 16.9% and took about 189 days to recover.',
      first: [['Oil', 'up', 'About $17 to a $46 peak by mid-October.'], ['Stocks', 'dn', 'A 16.9% fall, about 189 days to recover.'], ['Economy', 'dn', 'The oil spike helped cause the 1990–91 recession.'], ['Airlines, travel', 'dn', 'Fuel costs jump and trips are cancelled.'], ['Energy stocks', 'up', 'Higher oil prices lift their profits.'], ['Gold', 'up', 'Safe-haven demand.']] },
    { k: 'iran', label: 'Oil supply shock', ex: 'Iran war and Hormuz disruption, 2026', dd: 0.09, trough: 30, rec: 46, recLabel: 'new record', oilPts: [[0, 0], [3, 0], [9, 0.47], [38, 0.42], [39, 0.24], [61, 0.55]], oilNote: 'Brent vs March 3', seed: 47,
      text: '<b>US and Israeli strikes on Iran began on February 28, 2026,</b> and tanker traffic through the Strait of Hormuz slowed to a near standstill. Brent went from about $81 on March 3 to near $120 within days. The S&amp;P 500 fell about 9% in March, bottomed on March 30 and set a record close by April 15. The oil shock lasted: energy prices pushed inflation up and the Fed raised rates in September.',
      first: [['Oil', 'up', 'Near $120 within days; $126 intraday on April 30.'], ['Gasoline', 'up', '$4.26 a gallon in October 2026, from $3.05 a year earlier.'], ['Inflation', 'dn', 'Energy prices up 20.4% over the year to September.'], ['Bonds', 'dn', 'The 10-year Treasury yield climbed above 5%.'], ['Gold', 'acc', 'Rose on fear, then fell as interest rates climbed.'], ['Energy stocks', 'up', 'Sector earnings up about 128% in Q3 2026.']] },
    { k: 'tariff', label: 'Tariff shock', ex: 'Broad US tariffs announced April 2, 2025', dd: 0.121, trough: 6, rec: 30, recLabel: 'back to start', rec2: 86, rec2Label: 'new record', seed: 53,
      spxPts: [[0, 0], [1, -0.0484], [2, -0.105], [5, -0.107], [6, -0.121], [7, -0.038], [30, 0], [86, 0.089]],
      text: '<b>Broad new US tariffs were announced on April 2, 2025.</b> The S&amp;P 500 fell 4.84% and then 5.97% on the next two days and closed at its low on April 8, about 12% below its April 2 close; the VIX closed at 45.31. A 90-day pause on April 9 brought a 9.52% one-day jump, the biggest since 2008, and the index set a new record on June 27.',
      first: [['Stocks', 'dn', 'About 10% lower in two days, 12% by April 8.'], ['Volatility', 'up', 'The VIX closed at 45.31.'], ['Rebound', 'up', 'A 9.52% jump on April 9 when tariffs were paused.'], ['Dollar', 'dn', 'The dollar index fell about 9.5% over 2025.'], ['Importers, retailers', 'dn', 'They pay the tariff at the border.'], ['Gold', 'up', 'Gold rose about 67% in 2025.']] },
  ];
  const ACTS = [
    { v: 'hold', label: 'Hold' },
    { v: 'panic', label: 'Panic-sell at the low' },
    { v: 'rebal', label: '60/40 and rebalance' },
    { v: 'lev', label: '3× leveraged fund' },
  ];
  const DO = [
    [1, 'Ask one question: does this change inflation, interest rates or company profits for years? If not, history says the dip is usually short.'],
    [1, 'Keep a cash buffer so you never have to sell stocks at a low to pay bills.'],
    [1, 'Rebalance on a schedule: it sells what held up and buys what fell, without guessing headlines.'],
    [1, 'Traders: cut position size or stand aside when headline risk is high, and use stop losses.'],
    [0, 'Don’t trade breaking news with leverage or options: prices gap and spreads widen.'],
    [0, 'Don’t panic-sell after a big drop: you lock in the loss and usually miss the rebound.'],
  ];

  function shockPaths(sh) {
    const N = Math.max(60, Math.round(Math.max(sh.rec, sh.rec2 || 0, sh.oilPts ? sh.oilPts[sh.oilPts.length - 1][0] : 0) * 1.25)), rng = SML.rng(sh.seed);
    const ease = (x) => Math.sin(Math.min(1, Math.max(0, x)) * Math.PI / 2);
    const eio = (x) => 0.5 - 0.5 * Math.cos(Math.min(1, Math.max(0, x)) * Math.PI);
    const base = [];
    const interp = (pts, t, fallback) => {
      if (t > pts[pts.length - 1][0]) return fallback(t);
      let j = 0; while (j < pts.length - 2 && pts[j + 1][0] < t) j++;
      const [t0, v0] = pts[j], [t1, v1] = pts[j + 1], f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * (t1 - t0 <= 1 ? Math.min(1, Math.max(0, f)) : eio(f));
    };
    for (let t = 0; t <= N; t++) {
      let p;
      if (sh.spxPts) { const last = sh.spxPts[sh.spxPts.length - 1]; p = interp(sh.spxPts, t, (u) => last[1] + 0.0004 * (u - last[0])); }
      else if (t <= sh.trough) p = -sh.dd * ease(t / sh.trough);
      else if (t <= sh.rec) p = -sh.dd * (1 - eio((t - sh.trough) / (sh.rec - sh.trough)));
      else p = 0.0004 * (t - sh.rec);
      base.push(p);
    }
    /* small seeded wiggle, pinned to zero at the event, the low and the recovery day */
    const noiseAmp = Math.min(0.01, 0.12 * sh.dd + 0.003);
    let n = 0; const wig = [];
    for (let t = 0; t <= N; t++) { n = n * 0.85 + (rng() - 0.5) * noiseAmp; wig.push(n); }
    const pins = [0, sh.trough, sh.rec].concat(sh.spxPts ? sh.spxPts.map((q) => q[0]) : []);
    const pin = (t) => Math.min(1, ...pins.map((q) => Math.abs(t - q) / 4));
    const spx = base.map((p, t) => p + wig[t] * pin(t) * (1 + p));
    const oil = [];
    for (let t = 0; t <= N; t++) {
      const pts = sh.oilPts;
      if (!pts || t > pts[pts.length - 1][0]) { oil.push(NaN); continue; }
      let j = 0; while (j < pts.length - 2 && pts[j + 1][0] < t) j++;
      const [t0, v0] = pts[j], [t1, v1] = pts[j + 1];
      const f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      oil.push(v0 + (v1 - v0) * (0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, f)))));
    }
    return { N, spx, oil };
  }
  function outcome(sh, P, act, day) {
    const start = 100000, t = Math.min(day, P.N), T = sh.trough;
    const worstHold = (k) => start * (1 + Math.min(...P.spx.slice(0, k + 1)));
    if (act === 'hold') return { v: start * (1 + P.spx[t]), worst: worstHold(t) };
    if (act === 'panic') {
      if (t <= T) return { v: start * (1 + P.spx[t]), worst: worstHold(t) };
      const cash = start * (1 + P.spx[T]);
      if (t < sh.rec) return { v: cash, worst: cash };
      return { v: cash * (1 + P.spx[t]) / (1 + P.spx[sh.rec]), worst: cash };
    }
    if (act === 'rebal') {
      /* 60% stocks, 40% bonds held flat (an assumption), rebalanced once at the low */
      let s = 60000, b = 40000, worst = start;
      for (let i = 1; i <= t; i++) {
        s *= (1 + P.spx[i]) / (1 + P.spx[i - 1]);
        if (i === T) { const tot = s + b; s = tot * 0.6; b = tot * 0.4; }
        worst = Math.min(worst, s + b);
      }
      return { v: s + b, worst };
    }
    /* 3x daily leveraged fund: each day's move times three, compounded */
    let v = start, worst = start;
    for (let i = 1; i <= t; i++) { const r = (1 + P.spx[i]) / (1 + P.spx[i - 1]) - 1; v *= Math.max(0, 1 + 3 * r); worst = Math.min(worst, v); }
    return { v, worst };
  }

  SML.widgets.shockRecovery = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('xsr');
    let shock = SHOCKS.find((s) => s.k === opts.shock) || SHOCKS[0], act = 'hold', day = null, hover = null;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Pick a shock</span>${ui.seg(id + '-k', SHOCKS.map((s) => ({ v: s.k, label: s.label })), shock.k, 'Shock type')}</div>
      <p class="xgeo-ex" id="${id}-ex"></p>
      <div class="xgeo-legend"><span><i style="border-color:var(--ink)"></i>S&amp;P 500</span><span id="${id}-ol"><i style="border-color:var(--accent)"></i>Oil</span><span>drag the marker through the days</span></div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl"><div class="xgeo-row"><span class="lab">What you do with $100,000</span>${ui.seg(id + '-a', ACTS, act, 'What you do')}</div></div>
      <div class="wg-read">${ui.stat('Days after the event', id + '-d')}${ui.stat('S&amp;P 500', id + '-s')}${ui.stat('Oil', id + '-o')}${ui.stat('Phase', id + '-p')}${ui.stat('Your $100,000', id + '-y', 'hl')}${ui.stat('Worst point', id + '-w')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <p class="xgeo-sub">What moved, and which way</p>
      <div class="xgeo-tiles" id="${id}-t"></div>
      <p class="xgeo-sub">What to do when the headlines hit</p>
      <ul class="xgeo-do">${DO.map(([ok, t]) => `<li class="${ok ? '' : 'no'}"><i>${ok ? '✓' : '✕'}</i><span>${t}</span></li>`).join('')}</ul>
      <p class="wg-note">Simplified paths in calendar days. The size of each fall, the recovery time and the oil moves come from the sources named in the lesson; the daily wiggles and the exact day of each low are illustrative. The 60/40 mix assumes bonds held flat. Past shocks do not predict the next one.</p>`;
    const fig = $id(id + '-fig');
    let P = shockPaths(shock), geom = null;
    const st = ui.wire(root, () => {
      const k = st.seg(id + '-k');
      if (k !== shock.k) { shock = SHOCKS.find((s) => s.k === k); P = shockPaths(shock); day = null; hover = null; }
      act = st.seg(id + '-a');
      draw(true);
    });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.5, 250, 360));
      const L = compact ? 40 : 48, R = 14, Tp = 22, B = 34;
      const N = P.N; if (day == null) day = Math.min(N, Math.max(shock.trough, 1));
      const hasOil = !!shock.oilPts;
      const vals = P.spx.concat(hasOil ? P.oil.filter(isFinite) : [], [0]);
      let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.1 + 0.01; lo -= pad; hi += pad;
      const x = SML.lin(0, N, L, W - R), y = SML.lin(lo, hi, H - B, Tp);
      let b = yAxis(SML.ticks(lo, hi, compact ? 4 : 5), y, L, W - R, (v) => F.spct(v * 100, 0));
      const xt = SML.ticks(0, N, compact ? 4 : 6).filter((v) => v >= 0 && v <= N);
      b += xt.map((v) => S.line(x(v), H - B, x(v), H - B + 4, 's-line') + S.text(x(v), H - B + 16, String(Math.round(v)), 'xs mono', 'middle')).join('');
      b += S.text(W - R, H - 4, compact ? 'days' : 'days after the event', 'xs', 'end');
      b += S.line(x(0), Tp, x(0), H - B, 's-mut dash2');
      const mark = (d, lab, cls, anchorEnd) => (d <= N ? S.line(x(d), Tp, x(d), H - B, `s-${cls} dash2 o50`) + S.text(x(d) + (anchorEnd ? -4 : 4), Tp - 6, lab, `xs ${cls} b`, anchorEnd ? 'end' : 'start') : '');
      b += mark(shock.trough, 'low', 'dn', x(shock.trough) > W - R - 40);
      const recEnd = x(shock.rec) > W - R - 90 || (shock.rec2 && shock.rec2 - shock.rec < N * 0.25);
      b += mark(shock.rec, compact && shock.recLabel === 'back to start' ? 'back' : shock.recLabel, 'up', recEnd || x(shock.rec) - x(shock.trough) < 34);
      if (shock.rec2) b += mark(shock.rec2, shock.rec2Label, 'up', true);
      const line = (arr, cls) => S.poly(arr.map((v, t) => [x(t), y(v)]), cls);
      if (hasOil) {
        b += line(P.oil, 's-acc w2');
        const last = shock.oilPts[shock.oilPts.length - 1];
        if (!compact) b += S.text(Math.min(x(last[0]) + 6, W - R - 2), y(last[1]) + 4, shock.oilNote, 'xs acc b', x(last[0]) + 6 > W - R - 110 ? 'end' : 'start');
      }
      b += S.area(P.spx.map((v, t) => [x(t), y(v)]), y(0), 'f-dn-t', ' opacity=".5"') + line(P.spx, 's-ink w25');
      const md = hover != null ? hover : day;
      b += S.line(x(md), Tp, x(md), H - B, 's-ink w15');
      b += S.circle(x(md), y(P.spx[md]), 4, 'f-ink');
      if (hasOil && isFinite(P.oil[md])) b += S.circle(x(md), y(P.oil[md]), 3.5, 'f-acc');
      const right = x(day) < W - R - 50;
      b += S.circle(x(day), H - B, 8, 'handle') + S.text(x(day) + (right ? 13 : -13), H - B - 6, 'drag', 'xs acc b', right ? 'start' : 'end');
      b += S.rect(L, Tp, W - R - L, H - B - Tp, 'hit');
      fig.innerHTML = S.wrap(W, H, `${shock.label}: the S&P 500${hasOil ? ' and oil' : ''} after ${shock.ex}`, b);
      $id(id + '-ol').hidden = !hasOil;
      geom = { x, N };
      readout(md);
    });
    function readout(t) {
      const o = outcome(shock, P, act, t);
      sv(id + '-d', t + (t === 1 ? ' day' : ' days'));
      sv(id + '-s', sp(P.spx[t]), P.spx[t] < 0 ? 'dn' : 'up');
      sv(id + '-o', isFinite(P.oil[t]) ? sp(P.oil[t], 0) : '—', isFinite(P.oil[t]) ? (P.oil[t] < 0 ? 'dn' : 'up') : '');
      const ph = t < shock.trough ? ['Falling', 'dn'] : t === shock.trough ? ['The low', 'dn'] : t < shock.rec ? ['Recovering', 'acc'] : ['Recovered', 'up'];
      sv(id + '-p', ph[0], ph[1]);
      sv(id + '-y', k$(o.v), o.v < 100000 ? 'dn' : 'up');
      sv(id + '-w', k$(o.worst), 'dn');
      $id(id + '-ex').innerHTML = shock.text;
      $id(id + '-t').innerHTML = shock.first.map(([n, c, d]) => `<div class="xgeo-tile"><span class="n">${n}</span><span class="v ${c}">${c === 'up' ? '▲ up' : c === 'dn' ? '▼ down' : '◆ mixed'}</span><span class="d">${d}</span></div>`).join('');
      const end = outcome(shock, P, act, P.N), hEnd = outcome(shock, P, 'hold', P.N);
      const msg = $id(id + '-msg');
      if (act === 'hold') msg.innerHTML = ui.msg(hEnd.v >= 100000 ? 'up' : 'dn', 'Hold', `Holding through the drop to ${k$(hEnd.worst)} felt awful, but by day ${P.N} the model is back at ${k$(hEnd.v)}. Most geopolitical shocks were sold hard and then recovered; the ones that did lasting damage changed inflation, rates or profits for years.`);
      else if (act === 'panic') msg.innerHTML = ui.msg('dn', 'Panic', `Selling at the low locks in the loss. Waiting until it “feels safe” means buying back after the recovery: you end with ${k$(end.v)} against ${k$(hEnd.v)} for holding.`);
      else if (act === 'rebal') msg.innerHTML = ui.msg('up', 'Rebalance', `A 60/40 mix fell less (worst ${k$(end.worst)}), and rebalancing at the low bought stocks cheaply. You end with ${k$(end.v)} against ${k$(hEnd.v)} for all stocks held.`);
      else if (end.v > hEnd.v) msg.innerHTML = ui.msg('dn', '3× fund', `A 3× daily fund fell to ${k$(end.worst)}, a ${Math.round((1 - end.worst / 100000) * 100)}% drop, before the sharp rebound lifted it to ${k$(end.v)} against ${k$(hEnd.v)} for plain stocks. That only works if you hold through the drop; selling near the low, as many people do, locks in the loss.`);
      else msg.innerHTML = ui.msg('dn', '3× fund', `A 3× daily fund fell to ${k$(end.worst)} and ends at ${k$(end.v)}, while plain stocks end at ${k$(hEnd.v)}: daily losses compound faster than gains on the way back. Leverage on headlines can wipe out an account before the recovery comes.`);
    }
    function invX(px) { if (!geom) return null; const x0 = geom.x(0), x1 = geom.x(geom.N); return Math.round(SML.clamp((px - x0) / (x1 - x0), 0, 1) * geom.N); }
    ui.drag(fig, { sel: '.handle,.hit', start(pt) { const t = invX(pt.x); if (t != null) { day = t; hover = null; draw(true); } }, move(pt) { const t = invX(pt.x); if (t != null && t !== day) { day = t; draw(true); } } });
    fig.addEventListener('pointermove', (e) => { if (e.buttons) return; const svg = fig.querySelector('svg'); if (!svg || !geom) return; const t = invX(ui.pt(svg, e).x); if (t !== hover) { hover = t; draw(true); } });
    fig.addEventListener('pointerleave', () => { if (hover != null) { hover = null; draw(true); } });
  };

  /* =====================================================================
     dollarLab
     ===================================================================== */
  SML.widgets.dollarLab = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('xdl');
    let view = opts.view || 'co';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Dollar over the next year</span>${ui.seg(id + '-v', [{ v: 'co', label: 'A US multinational' }, { v: 'fund', label: 'Your international fund' }, { v: 'ww', label: 'Winners and losers' }], view, 'View')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="xgeo-ww" id="${id}-ww" hidden></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-d', label: 'Dollar change vs other currencies', min: -20, max: 20, step: 1, value: 10, fmt: (v) => F.spct(v, 0) })}
        <div id="${id}-cc" style="display:contents">
          ${ui.slider({ id: id + '-f', label: 'Sales from abroad', min: 0, max: 80, step: 5, value: 40, fmt: 'pct' })}
          ${ui.slider({ id: id + '-h', label: 'Of those, costs also abroad', min: 0, max: 100, step: 10, value: 50, fmt: 'pct' })}
          ${ui.slider({ id: id + '-m', label: 'Profit margin', min: 5, max: 40, step: 1, value: 20, fmt: 'pct' })}
        </div>
        <div id="${id}-fc" style="display:contents">
          ${ui.slider({ id: id + '-r', label: 'Foreign stocks in their own currency', min: -20, max: 30, step: 1, value: 8, fmt: (v) => F.spct(v, 0) })}
          ${ui.slider({ id: id + '-hg', label: 'Share of the fund currency-hedged', min: 0, max: 100, step: 25, value: 0, fmt: 'pct' })}
        </div>
      </div>
      <div class="wg-read" id="${id}-rd"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <p class="wg-note" id="${id}-note"></p>`;
    const fig = $id(id + '-fig');
    const st = ui.wire(root, () => { view = st.seg(id + '-v'); draw(true); });
    const draw = ui.responsive(fig, (W) => {
      const d = st.n(id + '-d') / 100, fx = 1 / (1 + d) - 1;
      $id(id + '-cc').hidden = view !== 'co'; $id(id + '-fc').hidden = view !== 'fund';
      $id(id + '-cc').style.display = view === 'co' ? 'contents' : 'none'; $id(id + '-fc').style.display = view === 'fund' ? 'contents' : 'none';
      $id(id + '-ww').hidden = view !== 'ww'; fig.hidden = view === 'ww';
      const compact = W < 480;
      const rd = $id(id + '-rd'), msg = $id(id + '-msg'), note = $id(id + '-note');
      if (view === 'co') {
        const Sx = 100, f = st.n(id + '-f') / 100, h = st.n(id + '-h') / 100, m = st.n(id + '-m') / 100;
        const usS = Sx * (1 - f), frS = Sx * f, costs = Sx * (1 - m), frC = frS * (1 - m) * h, usC = costs - frC;
        const frS2 = frS / (1 + d), frC2 = frC / (1 + d);
        const prof0 = Sx - costs, prof1 = usS + frS2 - usC - frC2, sales1 = usS + frS2;
        const H = Math.round(SML.clamp(W * 0.42, 220, 300));
        const L = compact ? 92 : 128, R = 70, top = 18, rowH = (H - top - 26) / 4;
        const xm = Math.max(Sx, sales1) * 1.02, x = SML.lin(0, xm, L, W - R);
        let b = '';
        const row = (i, label, a, cls, valTxt, sub) => {
          const yy = top + i * rowH, bh = Math.min(26, rowH * 0.55);
          return S.text(L - 10, yy + bh / 2 + 4, label, 'sm ink b', 'end') + (sub ? S.text(L - 10, yy + bh / 2 + 17, sub, 'xs', 'end') : '') + a.map(([v0, v1, c]) => S.rect(x(v0), yy, x(v1) - x(v0), bh, c, 2)).join('') + S.text(x(a[a.length - 1][1]) + 6, yy + bh / 2 + 4, valTxt, 'sm mono b ' + cls);
        };
        b += row(0, 'Sales last year', [[0, usS, 'f-info'], [usS, Sx, 'f-acc']], 'ink', b$(Sx), compact ? '' : 'US + abroad');
        b += row(1, 'Sales this year', [[0, usS, 'f-info'], [usS, sales1, 'f-acc']], sales1 < Sx ? 'dn' : 'up', b$(sales1), 'same local sales');
        const pm = Math.max(prof0, prof1) * 1.0;
        const xp = SML.lin(0, Math.max(pm, 1) * 1.35, L, W - R);
        const prow = (i, label, v, cls) => { const yy = top + i * rowH, bh = Math.min(26, rowH * 0.55); return S.text(L - 10, yy + bh / 2 + 4, label, 'sm ink b', 'end') + S.rect(xp(0), yy, Math.max(0, xp(v) - xp(0)), bh, cls, 2) + S.text(xp(Math.max(0, v)) + 6, yy + bh / 2 + 4, b$(v), 'sm mono b ' + (cls === 'f-up' ? 'up' : cls === 'f-dn' ? 'dn' : 'ink')); };
        b += prow(2, 'Profit last year', prof0, 'f-shade2');
        b += prow(3, 'Profit this year', prof1, prof1 >= prof0 ? 'f-up' : 'f-dn');
        b += S.text(L, H - 6, compact ? 'blue = US, amber = abroad' : 'blue = US sales, amber = sales abroad (in dollars), $100B company', 'xs');
        fig.innerHTML = S.wrap(W, H, 'A US company’s sales and profit before and after the dollar moves', b);
        rd.innerHTML = ui.stat('Sales in dollars', id + '-a') + ui.stat('Profit in dollars', id + '-b', 'hl') + ui.stat('Foreign sales lose', id + '-c');
        sv(id + '-a', sp(sales1 / Sx - 1), sales1 < Sx ? 'dn' : 'up');
        sv(id + '-b', sp(prof1 / prof0 - 1), prof1 < prof0 ? 'dn' : 'up');
        sv(id + '-c', sp(fx), fx < 0 ? 'dn' : 'up');
        msg.innerHTML = d > 0 ? ui.msg('dn', 'Strong dollar', `Customers abroad pay the same euros or yen, but each one buys fewer dollars, so ${Math.round(f * 100)}% of sales shrink by ${Math.abs(fx * 100).toFixed(1)}% when counted in dollars. Profit falls ${Math.abs((prof1 / prof0 - 1) * 100).toFixed(1)}%. Costs paid abroad soften it: a natural hedge.`)
          : d < 0 ? ui.msg('up', 'Weak dollar', `Foreign sales are worth more dollars, so reported sales rise ${((sales1 / Sx - 1) * 100).toFixed(1)}% and profit ${((prof1 / prof0 - 1) * 100).toFixed(1)}% with no extra customers. Companies call this a currency tailwind.`)
          : ui.msg('', 'Flat', 'No currency effect: results come down to the business itself.');
        note.textContent = 'Translation effect only: same local sales and costs, no hedging contracts, no change in demand. Real companies hedge part of this and say how much in their reports.';
      } else if (view === 'fund') {
        const r = st.n(id + '-r') / 100, hg = st.n(id + '-hg') / 100;
        const cur = (1 - hg) * ((1 + r) / (1 + d) - (1 + r));
        const total = r + cur;
        const H = Math.round(SML.clamp(W * 0.42, 220, 300));
        const L = compact ? 40 : 52, R = 16, Tp = 22, B = 46;
        const vals = [0, r, r + cur]; const lo = Math.min(...vals) - 0.04, hi = Math.max(...vals) + 0.04;
        const y = SML.lin(lo, hi, H - B, Tp);
        let b = yAxis(SML.ticks(lo, hi, 4), y, L, W - R, (v) => F.spct(v * 100, 0));
        const cols = 3, cw = (W - L - R) / cols, bw = Math.min(90, cw * 0.55);
        const bar = (i, v0, v1, cls, lab, val, vcls) => { const cx = L + cw * (i + 0.5); return S.rect(cx - bw / 2, Math.min(y(v0), y(v1)), bw, Math.abs(y(v1) - y(v0)), cls, 2) + S.text(cx, Math.min(y(v0), y(v1)) - 6, val, 'sm mono b ' + vcls, 'middle') + S.text(cx, H - B + 16, lab, 'sm ink b', 'middle'); };
        b += bar(0, 0, r, r >= 0 ? 'f-info' : 'f-dn', compact ? 'Local' : 'In local money', sp(r), r >= 0 ? 'info' : 'dn');
        b += bar(1, r, r + cur, cur >= 0 ? 'f-up' : 'f-dn', compact ? 'Currency' : 'Currency effect', sp(cur), cur >= 0 ? 'up' : 'dn');
        b += bar(2, 0, total, total >= 0 ? 'f-acc' : 'f-dn', compact ? 'You get' : 'Your return in $', sp(total), total >= 0 ? 'acc' : 'dn');
        b += S.line(L + cw * 1 - (cw - bw) / 2 + 0, y(r), L + cw * 1 + (cw - bw) / 2, y(r), 's-mut dash2');
        b += S.text(L, H - 8, compact ? '' : 'An unhedged fund converts back to dollars when you sell', 'xs');
        fig.innerHTML = S.wrap(W, H, 'International fund return split into local return and currency effect', b);
        rd.innerHTML = ui.stat('Local return', id + '-a') + ui.stat('Currency effect', id + '-b') + ui.stat('Your return in dollars', id + '-c', 'hl');
        sv(id + '-a', sp(r), r < 0 ? 'dn' : 'up'); sv(id + '-b', sp(cur), cur < 0 ? 'dn' : 'up'); sv(id + '-c', sp(total), total < 0 ? 'dn' : 'up');
        msg.innerHTML = Math.abs(d) < 0.005 ? ui.msg('', 'Flat dollar', 'No currency effect: you get the local return.')
          : d > 0 ? ui.msg('dn', 'Strong dollar', `The foreign stocks gained ${sp(r)} in their own money, but each euro or yen now buys fewer dollars. ${hg > 0 ? `Hedging ${Math.round(hg * 100)}% softened it. ` : ''}You keep ${sp(total)}.`)
          : ui.msg('up', 'Weak dollar', `A falling dollar adds to your return: ${sp(r)} locally becomes ${sp(total)} for you.${hg > 0 ? ' Hedging gave up part of that boost.' : ''}`);
        note.textContent = 'Return in dollars = (1 + local return) ÷ (1 + dollar change) − 1 for the unhedged part. Hedged funds remove most of the currency effect, for a small cost.';
      } else {
        rd.innerHTML = ui.stat('Dollar change', id + '-a', 'hl') + ui.stat('1,000-euro hotel, was $1,100', id + '-b') + ui.stat('$100 of foreign sales become', id + '-c');
        sv(id + '-a', F.spct(d * 100, 0), d > 0 ? 'up' : d < 0 ? 'dn' : '');
        const eurusd0 = 1.10, eurusd1 = eurusd0 / (1 + d);
        sv(id + '-b', F.usd(1000 * eurusd1, 0), d > 0 ? 'up' : d < 0 ? 'dn' : ''); sv(id + '-c', F.usd(100 / (1 + d), 2), d > 0 ? 'dn' : d < 0 ? 'up' : '');
        const strong = d >= 0;
        const win = strong ? ['<b>Americans traveling abroad</b>: your dollars buy more.', '<b>Importers and shoppers</b>: foreign goods cost fewer dollars.', '<b>US-focused companies</b>: little foreign sales to shrink.', '<b>Foreign investors who own dollars</b>.']
          : ['<b>US exporters and multinationals</b>: foreign sales are worth more dollars.', '<b>Your international funds</b>: currency adds to returns.', '<b>Commodities</b> priced in dollars, such as gold and oil, often rise.', '<b>Emerging markets</b> with dollar debt get relief.'];
        const lose = strong ? ['<b>US multinationals and exporters</b>: currency headwind on earnings.', '<b>Unhedged international funds</b>: foreign gains shrink in dollars.', '<b>Commodities</b> priced in dollars, such as gold and oil, often fall.', '<b>Emerging markets</b> with dollar debt: repayments cost more.']
          : ['<b>Americans traveling abroad</b> and buyers of imports pay more.', '<b>Inflation</b> can pick up as imports cost more.', '<b>Foreign holders of dollar assets</b>.', '<b>US-focused importers</b> such as retailers.'];
        $id(id + '-ww').innerHTML = `<div><h4 class="up">${strong ? 'Strong dollar helps' : 'Weak dollar helps'}</h4><ul>${win.map((t) => `<li>${t}</li>`).join('')}</ul></div><div><h4 class="dn">${strong ? 'Strong dollar hurts' : 'Weak dollar hurts'}</h4><ul>${lose.map((t) => `<li>${t}</li>`).join('')}</ul></div>`;
        msg.innerHTML = ui.msg(strong ? 'info' : 'acc', strong ? 'Rising dollar' : 'Falling dollar', strong ? 'A rising dollar usually comes with higher US rates or fear in markets. It is a quiet headwind for big US companies that sell abroad.' : 'A falling dollar flatters the earnings of US multinationals and the returns of foreign funds, and tends to lift commodity prices.');
        note.textContent = 'General tendencies, not rules. Hotel example assumes 1.10 dollars per euro before the move.';
      }
    });
  };


  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-geopolitics', course: 'commod', order: 4, title: 'Tension, war, sanctions and tariffs', mins: 11, level: 'Intermediate',
    summary: 'How wars, sanctions, tariffs and shipping shocks move oil, stocks and inflation, and what to do.',
    idea: 'Markets fall fast on frightening news and usually recover within weeks. The exceptions are shocks that change inflation, interest rates or profits for years.',
    widget: 'shockRecovery', opts: { shock: 'avg' },
    try: 'Pick a shock, drag the marker through the days after it, then switch what you do with $100,000.',
    body: [
      '<h3>What markets are really pricing</h3><p>A stock price reflects what investors expect a company to earn and the interest rate they use to value those earnings. A headline matters for stocks only if it changes one of those. Fear arrives first: oil, gold and the VIX “fear gauge” jump, investors buy Treasuries and dollars, and stocks dip. Traders call this <b>risk-off</b>. Then the real question takes over: how long will it last, and what will it cost the economy?</p>',
      '<h3>History: mostly short dips, a few long ones</h3><p>LPL Research looked at <b>27 geopolitical shocks since 1941</b>. On average the S&amp;P 500 fell 1.0% on the first day and <b>4.4% in total</b>, bottomed after about <b>18 days</b> and was back to its starting level after about <b>39 days</b>. The median fall was only 2.9%. The two big outliers were Pearl Harbor (−19.8%, about 307 days to recover) and Iraq’s invasion of Kuwait in 1990 (−16.9%, about 189 days).</p><p>Oil shocks are different. A Goldman Sachs study of 1973, 1979, 1990 and 2022 found oil rose a median 169% and the S&amp;P 500’s median peak-to-trough fall was <b>23%</b>, because expensive energy feeds inflation and forces central banks to act.</p>',
      '<h3>Oil is the main channel</h3><p>Conflict near oil producers or shipping lanes threatens supply, so prices jump. Fuel and freight costs rise, inflation follows, and the Fed may have to keep rates higher. 2026 is a live example. After US and Israeli strikes on Iran began on February 28, tanker traffic through the Strait of Hormuz nearly stopped. Brent crude touched $126 intraday on April 30 and was still near $110 in October. US gasoline averaged $4.26 a gallon on October 21 against $3.05 a year earlier, energy prices were up 20.4% over the year to September, and the Fed raised rates on September 16. Stocks bottomed on March 30 and, after the April 8 ceasefire, set a record close by April 15, while bonds later fell as the 10-year yield passed 5%. More in <a href="#l-oil">Oil</a>, <a href="#l-inflation">Inflation</a> and <a href="#l-fed">the Fed</a>.</p>',
      '<h3>How sanctions work</h3><ul><li>In the US, sanctions are run by the Treasury’s <b>OFAC</b>. Putting a person or company on the <b>SDN list</b> blocks its property under US jurisdiction and bars Americans from dealing with it.</li><li>The <b>50% rule</b> extends the block to companies a sanctioned party owns 50% or more of. Non-US firms that keep dealing with a target risk <b>secondary sanctions</b>.</li><li>Example: on October 22, 2025, OFAC added Russia’s two largest oil companies, Rosneft and Lukoil, and 34 subsidiaries to the SDN list.</li><li>The <b>oil price cap</b> works through services instead of a ban. The G7, the EU and Australia bar their shipping, insurance and finance firms from handling Russian oil unless it sells at or below the cap. G7 firms control about 90% of the relevant insurance market. The cap started at $60 in December 2022; the EU and UK later lowered theirs and moved to a cap that adjusts every six months.</li></ul><p>For markets, sanctions on a big exporter can lift prices for the goods it sells, reroute trade and force companies with business there to write it off. Check whether your funds hold companies with large sales in the affected region.</p>',
      '<h3>Tariffs: who pays and what changes</h3><p>A <b>tariff</b> is a tax on imports, paid by the US importer at the border. The cost is then shared between the importer’s profit margin, the foreign supplier’s price and the final customer, and other countries may retaliate. When broad tariffs were announced on April 2, 2025, the S&amp;P 500 fell 4.84% and 5.97% on the next two days and jumped 9.52% when a 90-day pause came on April 9. On February 20, 2026 the Supreme Court ruled 6–3 that the emergency powers law used for many of those tariffs (IEEPA) does not authorize tariffs; tariffs under other laws (Sections 232 and 301) stayed. A temporary 10% tariff under Section 122 ran from February 24 to July 24, 2026, and Section 301 tariffs of 10% or 12.5% on 60 economies replaced it. A Minneapolis Fed analysis found tariffs had added about 0.2 to 0.4 percentage points to core PCE inflation by July 2026, showing up late, for example in clothing prices. Copper got its own tariff: see <a href="#l-copper">Copper</a>.</p>',
      '<h3>Shipping and supply chains</h3><p>A few narrow sea routes, such as the Strait of Hormuz and the Red Sea with the Suez Canal, carry a large share of world trade. When ships are attacked there, insurance and freight costs jump and many vessels sail the long way around Africa, adding time and cost. Lloyd’s List counted Suez transits in August 2026 still 39% below their level before the Red Sea attacks began. Delays raise prices for goods, hurt importers and retailers, and help shipping companies that can charge more.</p>',
      '<h3>What to do</h3><ul><li>Ask one question: does this change inflation, interest rates or profits for years? If not, the dip has usually been short.</li><li>Keep a cash buffer and an <a href="#l-allocation">asset mix</a> you can live with, so you never sell at a low to pay bills.</li><li>Rebalance on a schedule rather than on headlines.</li><li>Traders: cut <a href="#l-position-size">position size</a> when headline risk is high, expect gaps over weekends, and avoid leverage on breaking news. See <a href="#l-psychology">trading psychology</a>.</li><li>Mark known risk dates (elections, deadlines, central bank meetings) in the <a href="#calendar">calendar</a>.</li></ul>',
    ],
    example: {
      title: 'A war headline and an 80/20 account',
      intro: 'Made-up numbers. On a Monday, fighting breaks out near a major oil route.',
      steps: [
        'Your $50,000 account holds $40,000 in an S&amp;P 500 fund and $10,000 in bonds.',
        'Oil jumps 40% that week and your stock fund falls 6%: $40,000 × 0.94 = $37,600, a $2,400 paper loss. Bonds stay flat at $10,000.',
        'You ask the key question. Oil is up a lot, so inflation could rise and rates stay higher. That argues for caution, not panic: you keep the plan and stop adding risk for now.',
        'Rebalancing check: stocks are $37,600 of $47,600, about 79%, still inside your 75–85% band. No trade is needed.',
        'A friend held the same $40,000 of stocks in a 3× daily S&amp;P fund instead: roughly 3 × 6% = 18% down, about $7,200, and daily compounding can make it worse in a choppy week.',
      ],
      result: 'A written plan turned a frightening week into a $2,400 paper loss and no rushed decisions. Leverage on the same stocks would have roughly tripled the loss.',
    },
    mistakes: [
      'Selling everything on the first frightening headline. In LPL’s study most geopolitical dips were recovered within weeks, and selling locks in the loss.',
      'Assuming every shock is short. Oil shocks that push up inflation and interest rates, such as 1973 and 1990, did far more damage.',
      'Trading breaking news with leverage or short-dated options: prices gap, spreads widen and stop orders can fill far from where you set them.',
      'Forgetting hidden exposure: international funds, companies with big sales in the region, and higher fuel costs in your own budget.',
    ],
    points: [
      'Fear moves first: oil, gold, the VIX, Treasuries and the dollar often jump while stocks dip.',
      'Across 27 geopolitical events since 1941, the S&amp;P 500 fell 4.4% on average and recovered in about 39 days.',
      'The shocks that last change inflation, interest rates or profits, usually through oil.',
      'Sanctions block trade and money flows; tariffs are taxes on imports paid by the importer and shared along the chain.',
      'Have the plan before the headline: cash buffer, rebalancing rules, smaller size, no leverage on news.',
    ],
    terms: ['Geopolitical risk', 'Sanctions', 'Tariff', 'Risk-off', 'Safe haven', 'OPEC+'],
    glossary: [
      { t: 'OFAC', full: 'Office of Foreign Assets Control', d: 'The US Treasury office that runs sanctions programs.' },
      { t: 'SDN list', d: 'OFAC’s list of people and companies whose US property is blocked and that Americans may not deal with.' },
      { t: 'Secondary sanctions', d: 'Penalties aimed at non-US companies that keep dealing with a sanctioned target.' },
      { t: 'Oil price cap', d: 'A rule that Western shipping, insurance and finance firms may only handle Russian oil sold at or below a set price.' },
      { t: 'Chokepoint', d: 'A narrow sea route, such as the Strait of Hormuz or the Suez Canal, that a large share of trade must pass through.' },
    ],
    quiz: { q: 'In LPL Research’s study of 27 geopolitical events, about how long did the S&amp;P 500 take on average to get back to its pre-event level?', options: ['About 39 days', 'About two years', 'It usually never recovered'], answer: 0, why: 'The average fall was 4.4% and recovery took about 39 days. The big exceptions were shocks that changed inflation or the economy for longer.' },
    sources: [
      { t: 'LPL Research: how markets have reacted to geopolitical events (updated March 2026)', u: 'https://www.lpl.com/research/blog/iran-escalation-how-markets-have-reacted-to-geopolitical-events.html' },
      { t: 'K&L Gates: Supreme Court decision on IEEPA tariffs (February 20, 2026)', u: 'https://www.klgates.com/Summary-Supreme-Court-Decision-on-IEEPA-Tariffs-2-20-2026' },
      { t: 'US Treasury: the price cap on Russian oil', u: 'https://home.treasury.gov/news/press-releases/jy1141' },
      { t: 'Minneapolis Fed: the pass-through of tariffs to consumer prices (August 2026)', u: 'https://minneapolisfed.org/article/2026/initially-delayed-the-pass-through-of-tariffs-to-consumer-prices-has-arrived' },
    ],
  });

  SML.lessons.push({
    id: 'l-dollar', course: 'commod', order: 5, title: 'The dollar and global money', mins: 8, level: 'Intermediate',
    summary: 'Why the dollar rises and falls, and what that does to big US companies, commodities and your foreign funds.',
    idea: 'A stronger dollar shrinks the dollar value of everything earned abroad. A weaker dollar does the opposite.',
    widget: 'dollarLab',
    try: 'Move the dollar slider, then switch between a US company, your international fund and the winners and losers.',
    body: [
      '<h3>What the dollar index measures</h3><p>The <b>US Dollar Index (DXY)</b> tracks the dollar against six major currencies. The euro is by far the largest weight, more than half the index, followed by the Japanese yen, British pound, Canadian dollar, Swedish krona and Swiss franc. It was about <b>101.7</b> on October 21, 2026. In 2025 it fell about 9.5%, its worst year since 2017; reporting at the time pointed to Fed rate cuts, tariff and policy uncertainty, and the dollar coming down from very high levels. In 2026 it bottomed near 95.3 in late January and climbed back above 101 by October as US yields rose and the Fed raised rates.</p>',
      '<h3>Why the dollar moves</h3><ul><li><b>Interest-rate gaps.</b> When US rates rise compared with other countries, global money earns more in dollars, so demand for dollars rises. See <a href="#l-rates">rates and yields</a>.</li><li><b>Fear.</b> In a global panic, investors and companies want dollars and Treasuries, the world’s main safe haven. See <a href="#l-geopolitics">tension and war</a>.</li><li><b>Growth.</b> A US economy growing faster than others tends to attract capital.</li><li><b>Policy uncertainty.</b> Doubts about US policy can push the dollar down, as in 2025.</li></ul>',
      '<h3>A strong dollar: who wins and who loses</h3><p>Big US companies sell abroad in euros, yen and pounds, then report in dollars. When the dollar rises, the same foreign sales convert into fewer dollars: the <b>translation effect</b>. Companies call this a currency headwind and often report <b>constant-currency</b> growth to show how the business really did. A strong dollar also makes imports and foreign trips cheaper for Americans, tends to weigh on commodities priced in dollars (gold pays no interest, so a stronger dollar and higher rates raise the cost of holding it), and squeezes emerging markets that borrowed in dollars. A weak dollar flips each of these. See <a href="#l-gold-silver">gold</a> and <a href="#l-earnings-season">earnings season</a>.</p>',
      '<h3>Your international funds</h3><p>An unhedged foreign fund earns two things: the return of its stocks in their own currency, and the change in that currency against the dollar. Your return in dollars is (1 + local return) ÷ (1 + dollar change) − 1. Hedged funds use contracts to cancel most of the currency move, for a small cost. Owning some international stocks spreads your risk across economies and currencies; see <a href="#l-index-funds">index funds</a> and <a href="#l-allocation">asset allocation</a>.</p>',
      '<h3>How traders use it</h3><ul><li>Watch the dollar alongside the 2-year Treasury yield: both react to surprises about the Fed.</li><li>Gold and the dollar often move in opposite directions, though not every day.</li><li>In earnings season, listen for “currency headwind” or “tailwind” and compare reported growth with constant-currency growth.</li></ul>',
    ],
    example: {
      title: 'A strong-dollar year for a US multinational',
      intro: 'Made-up company, same customers and prices in local money all year.',
      steps: [
        'The company sells $100 billion a year: $60 billion in the US and $40 billion abroad in euros, yen and pounds. Its profit margin is 20%, so profit is $20 billion.',
        'The dollar rises 10%. Each unit of foreign currency now buys 1 ÷ 1.10 = 0.909 dollars, so the same foreign sales count as $40 billion × 0.909 ≈ $36.4 billion.',
        'Total sales fall to about $96.4 billion, down 3.6%, without losing a single customer.',
        'Half of the costs of those foreign sales are also paid abroad: $40 billion × 80% × 50% = $16 billion, which now counts as about $14.5 billion. That natural hedge softens the hit.',
        'Profit = $60B + $36.4B − $64B of US costs − $14.5B ≈ $17.8 billion, down about 10.9%.',
      ],
      result: 'A 10% stronger dollar cut reported profit by about 11% while the business itself did not change.',
    },
    mistakes: [
      'Reading a currency headwind as a weaker business. Check constant-currency growth in the earnings report.',
      'Forgetting that an unhedged international fund carries currency risk: a strong dollar can turn a good year abroad into a loss for you.',
      'Assuming the dollar always rises in a crisis. In 2025 it fell about 9.5% amid tariff and policy uncertainty.',
      'Betting heavily on currency forecasts. Exchange rates are hard to predict; diversify instead.',
    ],
    points: [
      'The dollar index (DXY) tracks the dollar against six major currencies; it was about 101.7 in October 2026.',
      'Higher US interest rates and global fear usually lift the dollar; policy doubts and Fed cuts can push it down.',
      'A strong dollar shrinks the dollar value of foreign sales and of unhedged foreign funds; a weak dollar boosts them.',
      'Commodities priced in dollars, such as gold, often move opposite to the dollar.',
    ],
    terms: ['US Dollar Index', 'Safe haven', 'Treasury yield', 'Federal funds rate', 'Diversification', 'Index fund'],
    glossary: [
      { t: 'Translation effect', d: 'The change in reported results when foreign-currency sales and costs are converted into dollars.' },
      { t: 'Constant currency', d: 'Growth measured as if exchange rates had not changed, to show how the business itself did.' },
      { t: 'Currency hedging', d: 'Using contracts to cancel out exchange-rate moves, so a fund’s return stays close to its local return.' },
    ],
    quiz: { q: 'The dollar rises 10% against the euro and a European stock fund gains 8% in euros. Roughly what does an unhedged US investor earn?', options: ['About +18%', 'About −2%', 'Exactly +8%'], answer: 1, why: '1.08 ÷ 1.10 − 1 ≈ −1.8%: the stronger dollar more than wiped out the local gain.' },
    sources: [
      { t: 'Trading Economics: US Dollar Index (October 2026)', u: 'https://tradingeconomics.com/united-states/currency' },
      { t: 'Business Standard: dollar index posts its biggest annual fall since 2017', u: 'https://www.business-standard.com/markets/capital-market-news/us-dollar-index-sees-biggest-annual-fall-since-2017-126010100582_1.html' },
      { t: 'NPR: why the dollar fell over 9% in 2025', u: 'https://www.npr.org/2026/01/04/nx-s1-5662540/why-the-dollar-fell-over-9-in-2025-and-what-to-expect-in-2026' },
      { t: 'World Gold Council: what drives gold (rates and the dollar)', u: 'https://www.gold.org/goldhub/gold-focus/2024/11/lets-tally-rally' },
    ],
  });

  void k$;
})();
