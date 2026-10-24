/* Crypto & Blockchain course, part 2 (Trading track): what moves crypto, how to trade it (leverage, liquidation,
   funding, sizing), and the risks, scams and taxes. Widgets: cryptoDrivers, liqCalc (tool), cryptoRisks. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const usd0 = (v) => F.usd(Math.round(v), 0);
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 0 : 2) + 'M'; else if (a >= 1e4) s = '$' + trim(a / 1000, 0) + 'k'; else if (a >= 1000) s = '$' + trim(a / 1000, 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const pct = (v, d) => trim(v, d == null ? 1 : d) + '%';
  const esc = SML.esc;

  /* Market facts used as defaults (research/crypto.md, October 2026). Prices move daily: every one is an input. */
  const FX = {
    btc: 84500,        // BTC price, about, October 2026 (default entry)
    btcVol: 43,         // BTC annualized volatility, %
    spxVol: 15,         // S&P 500 annualized volatility, %
    corr: 0.33,          // BTC vs Nasdaq-100 correlation (recent)
    mm: 0.5,            // maintenance margin, % of position
    funding: 0.01,      // funding per 8 hours, %
    fee: 0.05,          // taker fee per side on futures, %
  };

  SML.css(`
.kc2 .kc2-fig{padding:12px}
.kc2-more{padding:0}
.kc2-more > summary{cursor:pointer;list-style:none;padding:12px 18px;font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted);display:flex;align-items:center;gap:8px}
.kc2-more > summary::-webkit-details-marker{display:none}
.kc2-more > summary::before{content:'+';display:inline-flex;width:16px;height:16px;align-items:center;justify-content:center;border:1px solid var(--input);border-radius:3px;font-size:12px;color:var(--ink)}
.kc2-more[open] > summary::before{content:'−'}
.kc2-more > .wg-ctrl{border-top:1px solid var(--line)}
.kc2-entry{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:flex-end;padding:16px 18px 0}
.kc2-entry .fld{flex:1 1 150px;max-width:220px}
.kc2-tabs{display:flex;flex-wrap:wrap;gap:8px}
.kc2-pane{padding:18px;display:flex;flex-direction:column;gap:14px;min-width:0}
.kc2-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;display:flex;flex-direction:column;gap:10px;min-width:0}
.kc2-from{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.kc2-from b{color:var(--ink);font-weight:600;letter-spacing:.06em}
.kc2-text{font-size:15.5px;line-height:1.6;color:var(--ink);overflow-wrap:anywhere}
.kc2-text mark{background:color-mix(in srgb,var(--down) 22%,transparent);color:var(--ink);border-radius:3px;padding:0 3px}
.kc2-btns{display:flex;flex-wrap:wrap;gap:8px}
.kc2-flags{list-style:none;display:flex;flex-direction:column;gap:8px;font-size:14.5px;line-height:1.5}
.kc2-flags li{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.kc2-flags li i{width:10px;height:10px;border-radius:50%;margin-top:6px;background:var(--down)}
.kc2-flags.ok li i{background:var(--up)}
.kc2-verdict{font:600 12px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em}
.kc2-verdict.up{color:var(--up)} .kc2-verdict.dn{color:var(--down)}
.kc2-dots{display:flex;gap:6px;flex-wrap:wrap}
.kc2-dots i{width:10px;height:10px;border-radius:50%;background:var(--shade2)}
.kc2-dots i.on{background:var(--accent)} .kc2-dots i.r{background:var(--up)} .kc2-dots i.w{background:var(--down)}
.kc2-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.kc2-tile{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.kc2-tile.r{border-color:color-mix(in srgb,var(--up) 50%,transparent)} .kc2-tile.w{border-color:color-mix(in srgb,var(--down) 50%,transparent)}
.kc2-tile b{font-size:14.5px;line-height:1.4;color:var(--ink);font-weight:600}
.kc2-tile p{font-size:13.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 80%,transparent)}
.kc2-tile .pill{align-self:flex-start}
.kc2-chk{display:grid;gap:18px;grid-template-columns:minmax(0,1fr)}
@media (min-width:720px){.kc2-chk{grid-template-columns:200px minmax(0,1fr);align-items:start}}
.kc2-ring{display:flex;flex-direction:column;align-items:center;gap:8px}
.kc2-groups{display:flex;flex-direction:column;gap:14px;min-width:0}
.kc2-groups h4{font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted);margin-bottom:8px}
.kc2-groups .chips{gap:6px}
.kc2-groups .chip{text-align:left;line-height:1.4;padding-block:8px;white-space:normal;text-transform:none;letter-spacing:0;font:500 13.5px/1.4 var(--sans)}
.kc2-fix{list-style:none;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.5}
.kc2-fix li::before{content:'→ ';color:var(--accent);font-weight:700}
`);

  /* ======================================================================
     1. cryptoDrivers: drag each force between headwind and tailwind
     ====================================================================== */
  const DRIVERS = [
    { k: 'fed', name: 'Fed and liquidity', w: 3, lo: -2, up: 'Rate cuts, easier money', dn: 'Hikes, higher real yields', us: 'Easier money', ds: 'Tighter money' },
    { k: 'etf', name: 'ETF flows', w: 2.5, lo: -2, up: 'Big inflows into funds', dn: 'Steady outflows', us: 'Inflows', ds: 'Outflows' },
    { k: 'risk', name: 'Stock market mood', w: 2, lo: -2, up: 'Risk-on, Nasdaq rallying', dn: 'Risk-off, Nasdaq selling', us: 'Risk-on', ds: 'Risk-off' },
    { k: 'lev', name: 'Leverage and funding', w: 2, lo: -2, up: 'Shorts crowded, funding negative', dn: 'Longs crowded, funding high', us: 'Shorts crowded', ds: 'Longs crowded' },
    { k: 'usd', name: 'US dollar', w: 1.5, lo: -2, up: 'Dollar weakening', dn: 'Dollar strengthening', us: 'Weaker', ds: 'Stronger' },
    { k: 'stab', name: 'Stablecoin supply', w: 1.5, lo: -2, up: 'Supply growing fast', dn: 'Supply shrinking', us: 'Growing', ds: 'Shrinking' },
    { k: 'reg', name: 'Rules and regulators', w: 1.5, lo: -2, up: 'Clear rules, approvals', dn: 'Crackdowns, lawsuits', us: 'Clear rules', ds: 'Crackdowns' },
    { k: 'half', name: 'Halving-cycle story', w: 1, lo: -2, up: 'Post-halving excitement', dn: 'Late-cycle fatigue', us: 'Excitement', ds: 'Fatigue' },
    { k: 'hack', name: 'Hacks and failures', w: 2, lo: -2, hi: 0, up: 'No major incidents', dn: 'Big hack or exchange collapse', us: 'Calm', ds: 'Big hack' },
  ];
  const DR_PRESETS = {
    neutral: { label: 'Neutral', v: {} },
    easy: { label: 'Easy money', v: { fed: 2, etf: 1, risk: 2, lev: -1, usd: 1, stab: 2, reg: 0, half: 1, hack: 0 } },
    tight: { label: 'Tight money', v: { fed: -2, etf: 0, risk: -2, lev: -2, usd: -2, stab: -1, reg: -1, half: -1, hack: -2 } },
    mixed: { label: 'Mixed', v: { fed: -1, etf: 1, risk: 1, lev: -1, usd: 0, stab: 1, reg: 1, half: 0, hack: 0 } },
  };
  const stateText = (d, v, short) => (v > 0 ? (short ? d.us : d.up) : v < 0 ? (short ? d.ds : d.dn) : (d.k === 'hack' ? (short ? d.us : d.up) : 'Neutral'));

  SML.widgets.cryptoDrivers = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('kcd');
    root.classList.add('kc2');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Forces on crypto</span><span class="grow"></span>${ui.seg(id + '-pre', Object.keys(DR_PRESETS).map((k) => ({ v: k, label: DR_PRESETS[k].label })), opts.preset || 'mixed', 'Example setups')}</div>
      <div class="wg-fig kc2-fig drag"></div>
      <div class="wg-read">${ui.stat('Net push', id + '-net', 'hl')}${ui.stat('Biggest tailwind', id + '-tw')}${ui.stat('Biggest headwind', id + '-hw')}${ui.stat('BTC normal day', id + '-bd')}${ui.stat('S&amp;P 500 normal day', id + '-sd')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" data-a="zero">Set all to neutral</button></div>
      <div class="wg-note">Drag a dot or tap a track. A teaching model with made-up weights, not a forecast: it shows which way the wind blows, not tomorrow's price. A "normal day" is one standard deviation from yearly volatility of about ${FX.btcVol}% for bitcoin (trades every day) and ${FX.spxVol}% for the S&amp;P 500 (252 trading days). Bitcoin’s link to the Nasdaq-100 is unstable: a 30-day correlation of 0.70 in March 2025, about ${FX.corr} over 90 days by September 2026.</div>`;
    const fig = root.querySelector('.wg-fig');
    const val = {};
    const applyPreset = (k) => { const p = DR_PRESETS[k] || DR_PRESETS.mixed; DRIVERS.forEach((d) => { val[d.k] = p.v[d.k] || 0; }); };
    applyPreset(opts.preset || 'mixed');
    let geo = null;
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest('#' + id + '-pre')) { applyPreset(st.seg(id + '-pre')); draw(true); } });
    root.querySelector('[data-a="zero"]').addEventListener('click', () => { DRIVERS.forEach((d) => { val[d.k] = 0; }); st.setSeg(id + '-pre', 'neutral'); draw(true); });

    const setFromX = (i, x) => {
      if (!geo) return; const d = DRIVERS[i]; const hi = d.hi == null ? 2 : d.hi;
      const v = Math.round(SML.clamp(geo.xs.inv(x), d.lo, hi));
      if (val[d.k] !== v) { val[d.k] = v; st.setSeg(id + '-pre', '__'); draw(true); }
    };
    let dragI = -1;
    ui.drag(fig, { sel: '[data-i]', start(pt, t) { dragI = Number(t.getAttribute('data-i')); setFromX(dragI, pt.x); }, move(pt) { if (dragI >= 0) setFromX(dragI, pt.x); }, end() { dragI = -1; } });

    const draw = ui.responsive(fig, (W) => {
      const compact = W < 560;
      const padL = compact ? 8 : 186, padR = compact ? 8 : 24;
      const rowH = compact ? 50 : 38, top = 30;
      const x0 = padL, x1 = W - padR;
      const xs = SML.lin(-2, 2, x0 + 10, x1 - 10);
      geo = { xs };
      let b = '';
      // header
      b += S.text(xs(-2), 16, '◀ Headwind', 'xs dn b', 'start') + S.text(xs(2), 16, 'Tailwind ▶', 'xs up b', 'end') + S.text(xs(0), 16, 'neutral', 'xs', 'middle');
      DRIVERS.forEach((d, i) => {
        const v = val[d.k] || 0;
        const yT = top + i * rowH + (compact ? 34 : 19);
        const hi = d.hi == null ? 2 : d.hi;
        if (compact) {
          b += S.text(x0, yT - 18, esc(d.name), 'sm ink b');
          b += S.text(x1, yT - 18, esc(stateText(d, v, true)), 'xs ' + (v > 0 ? 'up' : v < 0 ? 'dn' : 'mut'), 'end');
        } else {
          b += S.text(12, yT - 2, esc(d.name), 'md ink b');
          b += S.text(12, yT + 12, esc(stateText(d, v)), 'xs ' + (v > 0 ? 'up' : v < 0 ? 'dn' : 'mut'));
        }
        b += S.line(xs(d.lo), yT, xs(hi), yT, 's-line w2');
        if (hi < 2) b += S.line(xs(hi), yT, xs(2), yT, 's-grid w2 dash2');
        for (let t = d.lo; t <= hi; t++) b += S.line(xs(t), yT - 4, xs(t), yT + 4, t === 0 ? 's-mut w15' : 's-line');
        const th = 3 + d.w * 1.6;
        if (v) b += S.rect(Math.min(xs(0), xs(v)), yT - th / 2, Math.abs(xs(v) - xs(0)), th, v > 0 ? 'f-up' : 'f-dn', 2, ' opacity=".85"');
        b += S.rect(xs(d.lo) - 10, yT - 14, xs(hi) - xs(d.lo) + 20, 28, 'hit', 0, ` data-i="${i}"`);
        b += S.circle(xs(v), yT, 8, 'handle', ` data-i="${i}"`);
      });
      // net gauge
      const yG = top + DRIVERS.length * rowH + 26;
      const tot = DRIVERS.reduce((s, d) => s + d.w * 2, 0);
      const net = DRIVERS.reduce((s, d) => s + d.w * (val[d.k] || 0), 0) / tot;
      const gx = SML.lin(-1, 1, x0 + 10, x1 - 10);
      const zones = [[-1, -0.5, 'f-dn'], [-0.5, -0.15, 'f-dn-t'], [-0.15, 0.15, 'f-shade2'], [0.15, 0.5, 'f-up-t'], [0.5, 1, 'f-up']];
      b += S.text(compact ? x0 : 12, yG - 10, 'Net push', compact ? 'sm ink b' : 'md ink b');
      zones.forEach(([a, z, c]) => { b += S.rect(gx(a), yG - 6, gx(z) - gx(a) - 1, 12, c, 2); });
      b += S.polygon([[gx(net), yG - 9], [gx(net) - 7, yG - 19], [gx(net) + 7, yG - 19]], 'f-acc');
      b += S.line(gx(net), yG - 9, gx(net), yG + 9, 's-acc w25');
      // normal day bars
      const yN = yG + 46;
      const bd = FX.btcVol / Math.sqrt(365), sd = FX.spxVol / Math.sqrt(252);
      const nx = SML.lin(-Math.max(4, bd * 1.25), Math.max(4, bd * 1.25), x0 + 10, x1 - 10);
      b += S.text(compact ? x0 : 12, yN - 14, 'A normal day', compact ? 'sm ink b' : 'md ink b');
      b += S.line(nx(0), yN - 8, nx(0), yN + 34, 's-mut w1 dash2');
      b += S.rect(nx(-bd), yN - 4, nx(bd) - nx(-bd), 12, 'f-vio-t s-vio w15', 3) + S.text(nx(bd) + 6, yN + 6, 'BTC ±' + trim(bd, 1) + '%', 'sm vio b');
      b += S.rect(nx(-sd), yN + 16, nx(sd) - nx(-sd), 12, 'f-info-t s-info w15', 3) + S.text(nx(sd) + 6, yN + 26, 'S&P ±' + trim(sd, 1) + '%', 'sm info b');
      const H = yN + 44;
      fig.innerHTML = S.wrap(W, H, 'Forces that push crypto prices, each dragged between headwind and tailwind, with the net push and a normal-day comparison', b);

      // readouts
      const label = net >= 0.5 ? 'Strong tailwind' : net >= 0.15 ? 'Tailwind' : net > -0.15 ? 'Balanced' : net > -0.5 ? 'Headwind' : 'Strong headwind';
      setT(id + '-net', (net > 0 ? '+' : net < 0 ? F.minus : '') + trim(Math.abs(net), 2), net >= 0.15 ? 'up' : net <= -0.15 ? 'dn' : '');
      const scored = DRIVERS.map((d) => ({ d, s: d.w * (val[d.k] || 0) }));
      const best = scored.slice().sort((a, b2) => b2.s - a.s)[0], worst = scored.slice().sort((a, b2) => a.s - b2.s)[0];
      setT(id + '-tw', best.s > 0 ? best.d.name : 'None', best.s > 0 ? 'up' : '');
      setT(id + '-hw', worst.s < 0 ? worst.d.name : 'None', worst.s < 0 ? 'dn' : '');
      setT(id + '-bd', '±' + trim(bd, 1) + '%', 'info');
      setT(id + '-sd', '±' + trim(sd, 1) + '%');
      let extra = '';
      if ((val.lev || 0) <= -2) extra = ' Crowded longs paying high funding are fragile: a small dip can trigger forced selling, which triggers more, and price can fall 10% or more in hours even when the news is fine.';
      else if ((val.hack || 0) <= -1) extra = ' A big hack or exchange failure tends to hit everything at once, because traders sell what they can to cover what they cannot.';
      else if ((val.fed || 0) <= -1 && (val.risk || 0) <= -1) extra = ' Tight money and a falling stock market together have been the hardest mix for crypto: it has tended to act like a high-risk tech stock.';
      const cls = net >= 0.15 ? 'up' : net <= -0.15 ? 'dn' : 'info';
      setMsg(id + '-msg', cls, label, `The net push is <b>${(net > 0 ? '+' : net < 0 ? F.minus : '') + trim(Math.abs(net), 2)}</b> on a −1 to +1 scale.${extra} Forces explain moves after the fact far better than they predict them, and crypto often moves against all of them for weeks. Size every position as if the next move could be a ${trim(bd * 3, 0)}% day.`);
    });
  };

  /* ======================================================================
     2. liqCalc: spot vs leveraged perpetual futures, liquidation and sizing
     ====================================================================== */
  function liqPrice(side, E, lev, mm, margin, account, mode) {
    // linear USD-margined perpetual; ignores fees and funding (they move it closer)
    if (mode === 'spot') return null;
    const N = margin * lev; const q = N / E;
    const col = mode === 'cross' ? account : margin;
    if (side === 'long') { const p = (q * E - col) / (q * (1 - mm)); return Math.max(0, p); }
    return (q * E + col) / (q * (1 + mm));
  }
  const touchProb = (barrierPct, volPct, days) => { // driftless log-price random walk: chance of touching a level within `days`
    if (barrierPct == null || !isFinite(barrierPct) || barrierPct <= 0) return 0;
    const sig = (volPct / 100) * Math.sqrt(days / 365); if (sig <= 0) return 0;
    return Math.min(1, 2 * SML.ncdf(-barrierPct / sig));
  };

  SML.widgets.liqCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('klq');
    root.classList.add('kc2');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Trade</span>${ui.seg(id + '-side', [{ v: 'long', label: 'Long' }, { v: 'short', label: 'Short' }], 'long', 'Direction')}<span class="grow"></span>${ui.seg(id + '-mode', [{ v: 'spot', label: 'Spot' }, { v: 'iso', label: 'Isolated' }, { v: 'cross', label: 'Cross' }], opts.mode || 'iso', 'Account type')}</div>
      <div class="wg-fig kc2-fig"></div>
      <div class="kc2-entry">${ui.field({ id: id + '-acct', label: 'Account size ($)', value: 10000, min: 100, step: 100 })}${ui.field({ id: id + '-px', label: 'Entry price ($)', value: FX.btc, min: 1, step: 1 })}</div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-mg', label: 'Margin you put up', min: 100, max: 10000, step: 100, value: 1000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-lev', label: 'Leverage', min: 1, max: 50, step: 1, value: 10, fmt: (v) => v + '×' })}
        ${ui.slider({ id: id + '-days', label: 'Days you hold it', min: 1, max: 60, step: 1, value: 7, fmt: 'days' })}
      </div>
      <details class="kc2-more"><summary>More assumptions</summary><div class="wg-ctrl">
        ${ui.slider({ id: id + '-vol', label: 'Volatility (yearly)', min: 15, max: 120, step: 1, value: FX.btcVol, fmt: (v) => v + '%' })}
        ${ui.slider({ id: id + '-mm', label: 'Maintenance margin', min: 0.4, max: 5, step: 0.1, value: FX.mm, fmt: (v) => trim(v, 1) + '%' })}
        ${ui.slider({ id: id + '-fund', label: 'Funding per 8 hours', min: -0.05, max: 0.1, step: 0.005, value: FX.funding, fmt: (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + trim(Math.abs(v), 3) + '%' })}
        ${ui.slider({ id: id + '-fee', label: 'Trading fee per side', min: 0, max: 1, step: 0.01, value: FX.fee, fmt: (v) => trim(v, 2) + '%' })}
        ${ui.slider({ id: id + '-stop', label: 'Your stop distance', min: 1, max: 25, step: 0.5, value: 5, fmt: (v) => trim(v, 1) + '%' })}
        ${ui.slider({ id: id + '-risk', label: 'Risk per trade', min: 0.25, max: 3, step: 0.25, value: 1, fmt: (v) => trim(v, 2) + '%' })}
      </div></details>
      <div class="wg-read">${ui.stat('Liquidation price', id + '-liq')}${ui.stat('Distance to it', id + '-dist')}${ui.stat('Chance of touching it', id + '-tp')}${ui.stat('Fees + funding', id + '-cost')}${ui.stat('Size for your risk', id + '-safe')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" data-a="paths">New sample paths</button><button type="button" class="btn btn-g sm" data-a="reset">Reset</button></div>
      <div class="wg-note"><b>Spot</b>: you buy the coins. <b>Isolated</b> and <b>Cross</b> are perpetual-futures margin modes: isolated risks only the margin you put up; cross uses the whole account. A simple model: a USD-margined perpetual with one position, no drift, volatility constant, fees and funding left out of the liquidation price (they move it closer). Real exchanges use mark prices, tiered maintenance margin and liquidation fees; check yours. The fee default suits futures; spot apps often charge 0.4–1% or more per side. "Chance of touching" treats price as a random walk; a normal day is yearly volatility ÷ √365, since crypto trades every day. Sample paths are simulated, not history.</div>`;
    const fig = root.querySelector('.wg-fig');
    let seed = 7;
    const st = ui.wire(root, () => draw(true));
    const num = (k, d) => { const v = st.n(id + '-' + k); return isFinite(v) ? v : d; };
    const syncMargin = () => {
      const acct = Math.max(100, num('acct', 10000)); const el = $id(id + '-mg'); if (!el) return;
      const mx = Math.max(100, Math.round(acct / 100) * 100); el.max = mx; if (Number(el.value) > mx) el.value = mx; ui.setRange(el);
    };
    root.querySelector('[data-a="paths"]').addEventListener('click', () => { seed = (seed * 7919 + 13) % 100003; draw(true); });
    root.querySelector('[data-a="reset"]').addEventListener('click', () => {
      st.set(id + '-acct', 10000); st.set(id + '-px', FX.btc); st.set(id + '-mg', 1000); st.set(id + '-lev', 10); st.set(id + '-days', 7);
      st.set(id + '-vol', FX.btcVol); st.set(id + '-mm', FX.mm); st.set(id + '-fund', FX.funding); st.set(id + '-fee', FX.fee); st.set(id + '-stop', 5); st.set(id + '-risk', 1);
      st.setSeg(id + '-side', 'long'); st.setSeg(id + '-mode', opts.mode || 'iso'); seed = 7; draw(true);
    });

    const draw = ui.responsive(fig, (W) => {
      syncMargin();
      const mode = st.seg(id + '-mode') || 'iso';
      if (mode === 'spot' && st.seg(id + '-side') === 'short') st.setSeg(id + '-side', 'long');
      const side = st.seg(id + '-side') || 'long';
      const shortBtn = root.querySelector('#' + id + '-side [data-v="short"]'); if (shortBtn) { shortBtn.disabled = mode === 'spot'; shortBtn.title = mode === 'spot' ? 'Spot means owning coins, so it is long only' : ''; }
      { const mgl = root.querySelector('label[for="' + id + '-mg"] .ctl-lab'); if (mgl) mgl.textContent = mode === 'spot' ? 'Amount you buy' : 'Margin you put up'; }
      const tpl = $id(id + '-tp'); if (tpl && tpl.previousElementSibling) tpl.previousElementSibling.textContent = mode === 'spot' ? 'Chance of a 20% dip' : 'Chance of touching it';
      const acct = Math.max(100, num('acct', 10000)), E = Math.max(0.0001, num('px', FX.btc));
      const levEl = $id(id + '-lev');
      if (levEl) { levEl.disabled = mode === 'spot'; levEl.closest('.ctl').style.opacity = mode === 'spot' ? '.45' : ''; }
      const lev = mode === 'spot' ? 1 : num('lev', 10);
      const margin = Math.min(acct, num('mg', 1000));
      const days = num('days', 7), vol = num('vol', FX.btcVol), mm = num('mm', FX.mm) / 100, fund = num('fund', FX.funding) / 100, fee = num('fee', FX.fee) / 100;
      const stop = num('stop', 5) / 100, risk = num('risk', 1) / 100;
      const N = margin * lev;
      const L = liqPrice(side, E, lev, mm, margin, acct, mode);
      const dist = L == null ? null : Math.abs(L - E) / E; // fraction
      const logBar = L == null ? null : (L <= 0 ? Infinity : Math.abs(Math.log(L / E)));
      const pTouch = L == null || !isFinite(logBar) ? 0 : touchProb(logBar, vol, days);
      const stopPx = side === 'long' ? E * (1 - stop) : E * (1 + stop);
      const fundCost = (side === 'long' ? 1 : -1) * N * fund * 3 * days * (mode === 'spot' ? 0 : 1);
      const feeCost = N * fee * 2;
      const safeN = (acct * risk) / stop; // notional so a stop-out loses risk% of account
      const lossAtStop = N * stop + feeCost;

      // simulate paths
      const compact = W < 560;
      const nP = compact ? 24 : 32, spd = 4, steps = days * spd;
      const rng = SML.rng(seed * 31 + days * 7 + Math.round(vol));
      const dt = 1 / 365 / spd, sg = (vol / 100) * Math.sqrt(dt);
      const paths = []; let liqN = 0, minAll = E, maxAll = E;
      for (let p = 0; p < nP; p++) {
        let P = E; const pts = [[0, E]]; let dead = -1;
        for (let s = 1; s <= steps; s++) {
          P = P * Math.exp(sg * rng.gauss() - 0.5 * sg * sg);
          pts.push([s / spd, P]);
          if (L != null && dead < 0 && ((side === 'long' && P <= L) || (side === 'short' && P >= L))) { dead = s; break; }
        }
        if (dead >= 0) liqN++;
        pts.forEach((q) => { if (q[1] < minAll) minAll = q[1]; if (q[1] > maxAll) maxAll = q[1]; });
        paths.push({ pts, dead: dead >= 0 });
      }
      // y range: paths, entry, stop, and liquidation if not too far
      let lo = Math.min(minAll, stopPx, E), hi = Math.max(maxAll, stopPx, E);
      const liqVisible = L != null && L > 0 && L > E * 0.35 && L < E * 1.9;
      if (liqVisible) { lo = Math.min(lo, L); hi = Math.max(hi, L); }
      const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      const padL = compact ? 8 : 12, padR = compact ? 10 : 132, top = 18, H = Math.round(SML.clamp(W * 0.46, 240, 330)), bot = H - 26;
      const x = SML.lin(0, days, padL + (compact ? 0 : 44), W - padR), y = SML.lin(lo, hi, bot, top);
      let b = '';
      const ticks = SML.ticks(lo, hi, compact ? 4 : 5);
      ticks.forEach((t) => { b += S.line(x(0), y(t), x(days), y(t), 's-grid'); if (!compact) b += S.text(padL + 38, y(t) + 4, kfmt(t), 'xs mono', 'end'); });
      const dTicks = SML.ticks(0, days, compact ? 4 : 6).filter((d) => d <= days);
      dTicks.forEach((d) => { b += S.text(x(d), H - 8, d === 0 ? 'now' : 'day ' + d, 'xs', 'middle'); });
      // normal range band over the holding period
      const sigT = (vol / 100) * Math.sqrt(days / 365);
      const bandHi = E * Math.exp(sigT), bandLo = E * Math.exp(-sigT);
      const band = []; for (let i = 0; i <= 24; i++) { const d = (days * i) / 24; const s = (vol / 100) * Math.sqrt(d / 365); band.push([x(d), y(Math.min(hi, E * Math.exp(s)))]); }
      const bandB = []; for (let i = 24; i >= 0; i--) { const d = (days * i) / 24; const s = (vol / 100) * Math.sqrt(d / 365); bandB.push([x(d), y(Math.max(lo, E * Math.exp(-s)))]); }
      b += S.polygon(band.concat(bandB), 'f-info-t', ' opacity=".55"');
      // paths
      paths.forEach((p) => { if (!p.dead) b += S.poly(p.pts.map((q) => [x(q[0]), y(q[1])]), 's-mut w1', ' opacity=".45"'); });
      paths.forEach((p) => { if (p.dead) { const last = p.pts[p.pts.length - 1]; b += S.poly(p.pts.map((q) => [x(q[0]), y(Math.max(lo, Math.min(hi, q[1])))]), 's-dn w15', ' opacity=".8"'); b += S.text(x(last[0]), y(Math.max(lo, Math.min(hi, last[1]))) + 4, '×', 'md dn b', 'middle'); } });
      // levels
      const lab = (yy, txt, cls) => (compact ? S.text(x(0) + 4, yy - 5, txt, 'xs b ' + cls) : S.text(W - padR + 8, yy + 4, txt, 'sm b ' + cls));
      b += S.line(x(0), y(E), x(days), y(E), 's-ink w15 dash2') + lab(y(E), 'Entry ' + kfmt(E), 'ink');
      b += S.line(x(0), y(stopPx), x(days), y(stopPx), 's-acc w15 dash') + lab(y(stopPx), 'Stop ' + kfmt(stopPx), 'acc');
      if (L != null) {
        if (liqVisible) { b += S.line(x(0), y(L), x(days), y(L), 's-dn w2 dash') + lab(y(L), 'Liquidation ' + kfmt(L), 'dn'); }
        else b += S.text(compact ? x(0) + 4 : W - padR + 8, side === 'long' ? bot - 6 : top + 10, 'Liquidation ' + (L <= 0 ? 'near $0' : kfmt(L)) + (side === 'long' ? ' ↓' : ' ↑'), (compact ? 'xs' : 'sm') + ' b dn');
      }
      if (!compact) b += S.text(x(days) - 4, y(Math.min(hi, bandHi)) - 6, 'normal range', 'xs info', 'end');
      fig.innerHTML = S.wrap(W, H, `${nP} simulated price paths over ${days} days with the entry, stop and liquidation levels`, b);

      // readouts
      if (mode === 'spot') {
        setT(id + '-liq', 'None', 'up'); setT(id + '-dist', 'No loan', '');
        const p20 = touchProb(Math.abs(Math.log(0.8)), vol, days);
        setT(id + '-tp', p20 < 0.005 ? 'Under 1%' : pct(p20 * 100, 0), p20 >= 0.25 ? 'dn' : '');
      } else {
        setT(id + '-liq', L <= 0 ? '$0' : kfmt(L), 'dn');
        setT(id + '-dist', (side === 'long' ? F.minus : '+') + pct(dist * 100, 1), dist < 0.05 ? 'dn' : dist < 0.15 ? 'acc' : '');
        setT(id + '-tp', pTouch < 0.005 ? 'Under 1%' : pct(pTouch * 100, 0), pTouch >= 0.25 ? 'dn' : pTouch >= 0.08 ? 'acc' : 'up');
      }
      { const c = fundCost + feeCost; setT(id + '-cost', c >= 0 ? usd0(c) : '+' + usd0(-c) + ' back', c < 0 ? 'up' : c > margin * 0.05 ? 'dn' : ''); }
      setT(id + '-safe', kfmt(safeN), N > safeN * 1.05 ? 'dn' : 'up');

      const lossPctAcct = (lossAtStop / acct) * 100;
      const dayMove = vol / Math.sqrt(365);
      let cls, pill, html;
      if (mode === 'spot') {
        cls = 'info'; pill = 'Spot';
        html = `Spot has no liquidation: you own the coins, so a drop only hurts if you sell. The risk is size. A ${pct(stop * 100, 1)} stop on ${kfmt(N)} loses about ${usd0(lossAtStop)} with fees (${pct(lossPctAcct, 1)} of the account). Over ${days} days a random walk with ${vol}% yearly volatility dips 20% or more ${(() => { const q = touchProb(Math.abs(Math.log(0.8)), vol, days); return q < 0.005 ? 'less than 1%' : 'about ' + pct(q * 100, 0); })()} of the time, but over years bitcoin has fallen more than 75% from a peak more than once. Spot is long only: betting on a fall takes futures or borrowed coins.`;
      } else {
        const nd = dist * 100 / dayMove;
        const stopBeyond = (side === 'long' && L >= stopPx) || (side === 'short' && L <= stopPx);
        cls = pTouch >= 0.25 || stopBeyond ? 'dn' : pTouch >= 0.08 ? 'acc' : 'up';
        pill = pTouch >= 0.25 ? 'Coin flip' : pTouch >= 0.08 ? 'Fragile' : 'Wide';
        html = `At ${lev}× your liquidation is <b>${pct(dist * 100, 1)}</b> away, about <b>${trim(nd, 1)} times</b> a normal day's move (±${trim(dayMove, 1)}%). A random walk touches it within ${days} days ${pTouch < 0.005 ? '<b>less than 1%</b>' : 'about <b>' + pct(pTouch * 100, 0) + '</b>'} of the time; ${liqN} of ${nP} sample paths were liquidated.`;
        if (stopBeyond) html += ` Your ${pct(stop * 100, 1)} stop sits past the liquidation price, so the exchange would close you first.`;
        if (mode === 'cross') html += ' In cross mode the whole account backs the trade: liquidation is further away, but if it comes, it takes the account.';
        if (Math.abs(fundCost) > 1) html += ` Funding ${fundCost > 0 ? 'costs' : 'pays'} about ${usd0(Math.abs(fundCost))} over ${days} days, plus about ${usd0(feeCost)} in fees to open and close.`;
      }
      html += ` To risk ${pct(risk * 100, 2)} of ${usd0(acct)} with a ${pct(stop * 100, 1)} stop, the position should be about <b>${kfmt(safeN)}</b>${safeN <= acct ? ', which needs no leverage at all' : ''}.`;
      setMsg(id + '-msg', cls, pill, html);
    });
    syncMargin();
  };

  /* ======================================================================
     3. cryptoRisks: spot the scam, is it taxable?, safety check
     ====================================================================== */
  const SCAMS = [
    { from: 'Text message', who: 'Unknown number', scam: true,
      text: 'Hi Amy, is this still your number? Oh sorry, wrong person! You seem nice though. <mark>I trade crypto with my uncle\'s platform</mark>, it made me <mark>28% last month</mark>. I can show you, <mark>just start small</mark>.',
      flags: ['A "wrong number" that turns into a friendship is the classic opening of a pig-butchering scam.', 'Promised returns and screenshots of gains: real investing never comes with steady big profits.', 'A platform you can only reach through this person. Fake sites show fake balances, then demand "taxes" before you can withdraw.'] },
    { from: 'App store', who: 'Coinbase Wallet Pro Sync', scam: true,
      text: 'New! Sync your exchange and wallet in one tap. To connect, <mark>enter your 12-word recovery phrase</mark>. Developer: <mark>Crypto Apps Studio Ltd</mark>.',
      flags: ['No real app ever needs your recovery phrase to "sync". Whoever has it owns your coins.', 'A familiar brand name from an unknown developer. Download only from the official site link, and check the developer name.'] },
    { from: 'Social media', who: '@Support_Help_Desk', scam: true,
      text: 'We saw your post about a stuck withdrawal. Our team can fix it now. <mark>Join this video call and share your screen</mark>, or <mark>connect your wallet at the link</mark> to verify.',
      flags: ['Real support never contacts you first through social media or asks for screen sharing.', 'Connecting your wallet to a site and signing a request can hand over permission to drain it.'] },
    { from: 'Phone call', who: '"Your bank\'s fraud team"', scam: true,
      text: 'Your account has been hacked. To protect your savings, <mark>withdraw cash today and deposit it into this bitcoin ATM</mark> using the QR code we text you. <mark>Do not tell the teller why</mark>, the thief may work there.',
      flags: ['No bank, government agency or police department will ever ask you to move money into crypto or a bitcoin ATM.', 'Urgency and secrecy ("do not tell anyone") are the signature of an impostor scam. Hang up and call the number on the back of your card.', 'The FTC found that most crypto ATM scam reports involved someone posing as a government agency, a business or tech support.'] },
    { from: 'Website ad', who: 'StakeMax Yield', scam: true,
      text: 'Earn a <mark>guaranteed 2% a day</mark> on your crypto. <mark>Zero risk</mark>, withdraw any time. <mark>Bonus 20% if you invite 3 friends</mark>.',
      flags: ['2% a day compounds to over 1,000 times your money in a year. Nothing pays that; it is a Ponzi scheme paying old investors with new money.', 'Rewards for recruiting friends is the shape of a pyramid.', '"Guaranteed" and "zero risk" do not exist for any real crypto yield.'] },
    { from: 'Group chat', who: 'MoonDog token launch', scam: true,
      text: 'New coin launching in 1 hour, <mark>already up 400% on presale</mark>! Team is anonymous for privacy. <mark>Liquidity unlock in 7 days</mark>. Buy before the influencers post!',
      flags: ['An anonymous team and liquidity the creators can pull out in days: the setup for a rug pull.', 'Hype about a coin that does not exist yet, plus a race against other buyers, is pump-and-dump marketing.'] },
    { from: 'Email', who: 'Your US exchange', scam: false,
      text: 'Your 2026 tax form is ready. For your security, we will never include links to sign in. Open the app or type our address yourself to view it under Taxes.',
      flags: ['No link, no request for keys or passwords, and it tells you to go to the site on your own: that is how real services write.', 'Still worth checking inside the app rather than trusting any email.'] },
    { from: 'Device screen', who: 'Your new hardware wallet', scam: false,
      text: 'Write down these 24 words on the recovery sheet, in order. They will not be shown again. Never type them into a phone or computer.',
      flags: ['A hardware wallet you bought new from the maker shows your recovery words once, on its own screen, during setup. That is normal.', 'The scam version arrives pre-set with words already printed, or asks you to type them into a website.'] },
    { from: 'Text message', who: 'Unknown number', scam: true,
      text: 'Congratulations! You qualify for the <mark>official airdrop of 500 tokens</mark>. <mark>Claim within 24 hours</mark>: connect your wallet at claim-drop-now.app and <mark>sign the approval</mark>.',
      flags: ['Surprise free money with a short deadline pushes you to act before you think.', 'Signing an "approval" on an unknown site can give it permission to move every token of that type in your wallet.'] },
  ];
  const TAX = [
    { t: 'Buy bitcoin with dollars and hold it', a: false, why: 'Buying is not a sale. Keep the receipt: it is your cost basis.' },
    { t: 'Sell bitcoin for dollars at a profit', a: true, kind: 'Capital gain', why: 'A sale. Held a year or less it is short-term, taxed like pay; longer, it gets the lower long-term rates.' },
    { t: 'Swap ether for another coin', a: true, kind: 'Capital gain or loss', why: 'A swap is a sale of the first coin at its market value, even though no dollars arrive.' },
    { t: 'Pay for a coffee with bitcoin', a: true, kind: 'Capital gain or loss', why: 'Spending crypto is selling it. Each small purchase is its own taxable sale.' },
    { t: 'Move coins between two wallets you own', a: false, why: 'A transfer to yourself is not a sale. Network fees paid in crypto can be a tiny taxable disposal; keep records.' },
    { t: 'Receive staking rewards', a: true, kind: 'Income', why: 'Rewards count as income at their value when you gain control of them, and that value becomes their cost basis.' },
    { t: 'Get paid by an employer in crypto', a: true, kind: 'Income', why: 'Wages are wages: taxed at their dollar value when paid, with payroll tax.' },
    { t: 'Sell bitcoin itself at a loss and buy it back the next day', a: true, kind: 'Capital loss', why: 'A sale, so the loss counts. As of October 2026 the wash-sale rule does not cover crypto you hold directly (bills to change that are pending).' },
    { t: 'Sell a bitcoin ETF at a loss and buy it back 10 days later', a: true, kind: 'Wash sale', why: 'ETF shares are securities, so the wash-sale rule applies: the loss is deferred into the new shares.' },
    { t: 'Gift $5,000 of bitcoin to your sister', a: false, why: 'Giving is not selling. Large gifts may need a gift tax return; she takes over your cost basis.' },
  ];
  const CHECK = [
    { g: 'Size and money', items: [['small', 'Crypto is a small slice I can afford to lose completely', 3], ['nolev', 'No leverage, or tiny size with a stop', 2], ['dca', 'I buy on a plan, not after a big jump or a tip', 1]] },
    { g: 'Accounts', items: [['us', 'I use a US-regulated exchange, broker or ETF, not a site from an ad or a stranger', 3], ['2fa', 'Two-factor with an authenticator app or security key, not text messages', 2], ['pw', 'A unique password from a password manager', 1], ['allow', 'Withdrawal address allowlist turned on', 1]] },
    { g: 'Keys and coins', items: [['seed', 'Recovery phrase on paper or metal, never photographed, typed or shared', 3], ['cold', 'Long-term coins in a hardware wallet or a regulated custodian', 2], ['test', 'I send a small test before every large transfer', 1]] },
    { g: 'Know the limits', items: [['sipc', 'I know SIPC and FDIC do not cover crypto losses', 1], ['tax', 'I keep records of every buy, sell, swap and reward for taxes', 2], ['never', 'I never share my screen or move money because someone urgent told me to', 3]] },
  ];

  SML.widgets.cryptoRisks = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('kcr');
    root.classList.add('kc2');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Stay safe</span><span class="grow"></span>${ui.seg(id + '-tab', [{ v: 'scam', label: 'Spot the scam' }, { v: 'tax', label: 'Is it taxable?' }, { v: 'safe', label: 'Safety check' }], opts.tab || 'scam', 'Section')}</div>
      <div class="wg-fig kc2-fig" style="padding:0"><div class="kc2-pane" id="${id}-pane"></div></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">All messages, names and sites are made up for practice. Tax answers describe general US rules for individuals as of 2026, not advice for your situation.</div>`;
    const pane = $id(id + '-pane');
    const S1 = { i: 0, ans: SCAMS.map(() => null) };
    const S2 = { ans: TAX.map(() => null) };
    const S3 = { on: new Set(['us', '2fa']) };
    const st = ui.wire(root, () => render());

    function renderScam() {
      const done = S1.ans.filter((a) => a != null).length, right = S1.ans.filter((a, i) => a != null && a === SCAMS[i].scam).length;
      if (S1.i >= SCAMS.length) {
        pane.innerHTML = `<div class="kc2-card"><p class="kc2-verdict ${right >= 7 ? 'up' : 'dn'}">You caught ${right} of ${SCAMS.length}</p>
          <p class="kc2-text">Every crypto scam asks for one of four things: your <b>recovery phrase</b>, a <b>signature or wallet connection</b> on a site you did not find yourself, <b>money moved somewhere new</b>, or <b>trust in a stranger</b> who promises returns. Real services ask for none of them.</p>
          <div class="kc2-btns"><button type="button" class="btn btn-p sm" data-a="again">Start again</button></div></div>`;
        pane.querySelector('[data-a="again"]').addEventListener('click', () => { S1.i = 0; S1.ans = SCAMS.map(() => null); render(); });
        setMsg(id + '-msg', right >= 7 ? 'up' : 'acc', 'Score', `${right} of ${SCAMS.length}. If anything ever asks for your recovery phrase, a wallet signature on an unfamiliar site, or crypto sent to "keep it safe", stop and verify through a number or address you look up yourself.`);
        return;
      }
      const c = SCAMS[S1.i], a = S1.ans[S1.i];
      const shown = a != null;
      const text = shown ? c.text : c.text.replace(/<\/?mark>/g, '');
      pane.innerHTML = `<div class="kc2-dots" aria-label="Progress">${SCAMS.map((x, i) => `<i class="${S1.ans[i] == null ? (i === S1.i ? 'on' : '') : (S1.ans[i] === x.scam ? 'r' : 'w')}"></i>`).join('')}</div>
        <div class="kc2-card"><div class="kc2-from"><span>${esc(c.from)}</span><b>${esc(c.who)}</b><span>${S1.i + 1} of ${SCAMS.length}</span></div><p class="kc2-text">${text}</p>
        ${shown ? `<p class="kc2-verdict ${c.scam ? 'dn' : 'up'}">${c.scam ? 'Scam' : 'Looks legitimate'} · you said ${a ? 'scam' : 'legit'}${a === c.scam ? ' ✓' : ' ✗'}</p><ul class="kc2-flags${c.scam ? '' : ' ok'}">${c.flags.map((f) => `<li><i></i><span>${f}</span></li>`).join('')}</ul>` : ''}
        <div class="kc2-btns">${shown ? `<button type="button" class="btn btn-p sm" data-a="next">${S1.i === SCAMS.length - 1 ? 'See your score' : 'Next message'}</button>` : `<button type="button" class="btn btn-dn sm" data-a="scam">Scam</button><button type="button" class="btn btn-up sm" data-a="legit">Looks legit</button>`}</div></div>`;
      const go = (v) => { S1.ans[S1.i] = v; render(); };
      const bS = pane.querySelector('[data-a="scam"]'), bL = pane.querySelector('[data-a="legit"]'), bN = pane.querySelector('[data-a="next"]');
      if (bS) bS.addEventListener('click', () => go(true));
      if (bL) bL.addEventListener('click', () => go(false));
      if (bN) bN.addEventListener('click', () => { S1.i++; render(); });
      if (!shown) setMsg(id + '-msg', 'info', `${done} done`, 'Read the message the way you would on your phone. Scam or legit?');
      else setMsg(id + '-msg', a === c.scam ? 'up' : 'dn', a === c.scam ? 'Right' : 'Not quite', c.scam ? 'The highlighted words are the red flags. Each one alone is reason to stop.' : 'This one is normal. The difference: it asks for nothing and sends you to the service on your own.');
    }
    function renderTax() {
      const done = S2.ans.filter((a) => a != null).length, right = S2.ans.filter((a, i) => a != null && a === TAX[i].a).length;
      pane.innerHTML = `<div class="kc2-grid">${TAX.map((t, i) => { const a = S2.ans[i]; const shown = a != null; return `<div class="kc2-tile${shown ? (a === t.a ? ' r' : ' w') : ''}"><b>${esc(t.t)}</b>${shown ? `<span class="pill ${t.a ? 'dn' : 'up'}">${t.a ? 'Taxable · ' + esc(t.kind) : 'Not taxable'}</span><p>${esc(t.why)}</p>` : `<div class="kc2-btns"><button type="button" class="btn btn-g sm" data-i="${i}" data-v="1">Taxable</button><button type="button" class="btn btn-g sm" data-i="${i}" data-v="0">Not taxable</button></div>`}</div>`; }).join('')}</div>
        ${done ? '<div class="kc2-btns"><button type="button" class="btn btn-g sm" data-a="clear">Start again</button></div>' : ''}`;
      pane.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { S2.ans[Number(b.dataset.i)] = b.dataset.v === '1'; render(); }));
      const clr = pane.querySelector('[data-a="clear"]'); if (clr) clr.addEventListener('click', () => { S2.ans = TAX.map(() => null); render(); });
      if (!done) setMsg(id + '-msg', 'info', 'Guess', 'Tap Taxable or Not taxable on each card. The IRS treats crypto as property, so most things you do with it count as a sale.');
      else setMsg(id + '-msg', right === done ? 'up' : 'acc', `${right} of ${done}`, done === TAX.length ? 'The pattern: buying and moving your own coins is not taxable; selling, swapping, spending and earning are. Keep a record of every one of them.' : 'Keep going. Watch for swaps and spending: they are sales too.');
    }
    function renderSafe() {
      const all = CHECK.flatMap((g) => g.items), tot = all.reduce((s, x) => s + x[2], 0);
      const got = all.filter((x) => S3.on.has(x[0])).reduce((s, x) => s + x[2], 0);
      const score = Math.round((got / tot) * 100);
      const missing = all.filter((x) => !S3.on.has(x[0])).sort((a, b) => b[2] - a[2]).slice(0, 3);
      const r = 46, c = 2 * Math.PI * r, f = got / tot;
      const ring = `<svg viewBox="0 0 120 120" width="140" height="140" role="img" aria-label="Safety score ${score} out of 100"><circle cx="60" cy="60" r="${r}" class="nf s-line" style="stroke-width:12"/><circle cx="60" cy="60" r="${r}" class="nf ${score >= 80 ? 's-up' : score >= 50 ? 's-acc' : 's-dn'}" style="stroke-width:12" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)" stroke-linecap="round"/><text x="60" y="66" class="xxl disp ink" text-anchor="middle" style="font-size:34px">${score}</text><text x="60" y="84" class="xs" text-anchor="middle">of 100</text></svg>`;
      pane.innerHTML = `<div class="kc2-chk"><div class="kc2-ring">${ring}<span class="pill ${score >= 80 ? 'up' : score >= 50 ? 'acc' : 'dn'}">${score >= 80 ? 'Well protected' : score >= 50 ? 'Some gaps' : 'Exposed'}</span></div>
        <div class="kc2-groups">${CHECK.map((g, gi) => `<div><h4>${esc(g.g)}</h4>${ui.chips(id + '-g' + gi, g.items.map((x) => ({ k: x[0], label: esc(x[1]), on: S3.on.has(x[0]), color: x[2] >= 3 ? 'var(--down)' : x[2] === 2 ? 'var(--accent)' : 'var(--muted)' })))}</div>`).join('')}
        ${missing.length ? `<div><h4>Fix these first</h4><ul class="kc2-fix">${missing.map((x) => `<li>${esc(x[1])}</li>`).join('')}</ul></div>` : ''}</div></div>`;
      CHECK.forEach((g, gi) => { const box = $id(id + '-g' + gi); if (box) box.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; const k = b.dataset.k; if (S3.on.has(k)) S3.on.delete(k); else S3.on.add(k); render(); }); });
      setMsg(id + '-msg', score >= 80 ? 'up' : score >= 50 ? 'acc' : 'dn', score + ' / 100', score >= 80 ? 'Strong habits. The biggest remaining risk is the market itself: crypto can still fall by most of its value.' : `Tick what you already do. Red dots matter most. Start with: ${missing.length ? esc(missing[0][1].charAt(0).toLowerCase() + missing[0][1].slice(1)) : ''}.`);
    }
    function render() { const t = st.seg(id + '-tab') || 'scam'; if (t === 'tax') renderTax(); else if (t === 'safe') renderSafe(); else renderScam(); }
    render();
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  SML.lessons.push({
    id: 'l-crypto-drivers', course: 'crypto', order: 4, title: 'What moves crypto prices', mins: 9, level: 'Intermediate',
    summary: 'Liquidity, ETF flows, leverage, the dollar, rules and hacks: the forces behind crypto’s big swings.',
    idea: 'Crypto has no earnings to anchor it, so prices swing on money flows, leverage and mood. Learn the forces, then size for the swings.',
    widget: 'cryptoDrivers',
    try: 'Pick an example setup, then drag each force between headwind and tailwind and watch the net push change.',
    body: [
      '<h3>No earnings, so flows rule</h3><p>A stock has profits you can value (see <a href="#l-statements">the financial statements</a>). Bitcoin has no profits, dividends or cash flows. Its price is simply where buyers and sellers meet, so anything that changes how much money wants in, or how much must get out, moves it. That is why the same news can move crypto two or three times as much as stocks.</p>',
      '<h3>Liquidity and the Fed</h3><p>When money is cheap, people take more risk with it. Rate cuts and easy money have tended to lift speculative assets. Rising real yields are often cited as a headwind too, though that link has been unreliable. In 2022, as the Fed raised rates quickly, bitcoin fell about 77% from its late-2021 peak to about $15,800. In 2026 it slid with stocks after a hawkish Fed meeting in June, and the Fed raised its target range to 3.75%–4.00% on September 16, 2026. See <a href="#l-fed">how the Fed works</a> and <a href="#l-rates">rates and yields</a>.</p>',
      '<h3>ETF flows</h3><p>Since January 2024, spot bitcoin ETFs have let anyone hold bitcoin in a regular brokerage account. By October 2026, US spot bitcoin ETFs held about $100 billion, with about $58 billion of net new money since launch; the largest, BlackRock’s IBIT, charges 0.25% a year. Daily money into or out of these funds is now one of the most watched crypto numbers, because the funds must buy or sell real coins to match.</p>',
      '<h3>Big holders</h3><p>A few holders own a large share of all bitcoin. In October 2026 the company Strategy held about 848,250 bitcoin, US spot ETFs held roughly 1.2 million (an estimate), and the US government about 328,000, mostly seized coins it has said it will not sell. Together that is roughly 12% of the supply. When a big buyer pauses or funds see steady outflows, the market feels it.</p>',
      '<h3>The stock market and the dollar</h3><p>Bitcoin has often traded like a high-risk tech stock. Its 30-day correlation with the Nasdaq-100 reached 0.70 in March 2025, then the 90-day figure fell to about 0.33 by September 2026. The link comes and goes, and it tends to jump during sell-offs, exactly when you would want it low. A stronger <a href="#l-dollar">US dollar</a> is often cited as a headwind as well, but the link is unreliable, so do not trade on it alone.</p>',
      '<h3>Leverage, funding and liquidation cascades</h3><p>Many crypto traders borrow to bet, mostly through <b>perpetual futures</b>. When most of them lean the same way, the <b>funding rate</b> they pay each other climbs. Then a small drop forces the most borrowed traders out; their forced selling pushes price lower, which forces out the next group. On October 10–11, 2025, after a US announcement of a proposed 100% tariff on Chinese goods, about $19 billion of leveraged positions were liquidated, the largest wipeout on record, hitting about 1.6 million traders, mostly longs.</p>',
      '<h3>Supply: the halving and stablecoins</h3><p>Every 210,000 blocks, about every four years, the new bitcoin paid to miners per block is cut in half. The last <b>halving</b>, on April 20, 2024, cut it to 3.125 bitcoin; the next is expected around April 2028. Past price peaks came roughly 12–18 months after halvings, including the October 2025 record about 18 months after the last one. The "four-year cycle" around halvings is a popular story built on only a handful of examples, so treat it as a story, not a schedule. <b>Stablecoins</b> are dollars waiting on crypto rails: about $301 billion of them existed in October 2026, about 61% of it USDT and about 24% USDC. A growing supply has tended to mean more money ready to buy.</p>',
      '<h3>Rules, hacks and failures</h3><p>Approvals and clear rules have lifted prices; lawsuits and crackdowns have hit them. In February 2025 hackers stole about $1.5 billion from the exchange Bybit, a theft the FBI attributed to North Korea, and about $3.4 billion was stolen across crypto that year. When a big platform fails, traders sell whatever they can to cover what is stuck, so everything drops together.</p>',
      '<h3>How big are the swings?</h3><p>Bitcoin’s volatility over the past year was about 43% a year in October 2026, roughly three times the S&amp;P 500’s long-run 15%, and its ten-year average is about 64%. It has fallen more than 75% from a peak several times: about 84% in 2018 and about 77% in 2022. From its October 2025 record of about $126,000 it fell to about $58,000 by July 2026, a drop of about 54%, and traded near $84,500 in late October 2026. That is why the trading lessons insist on small size: see <a href="#l-crypto-trading">how to trade crypto</a>.</p>',
    ],
    example: {
      title: 'A weekend liquidation cascade',
      intro: 'Made-up numbers on a made-up Saturday, to show how leverage turns a dip into a crash.',
      steps: [
        'A coin trades at $100,000. Funding has been high for two weeks: longs are paying shorts every eight hours, a sign that most traders are betting on a rise with borrowed money.',
        'Late Saturday a headline hits and the price drops 5% in ten minutes, to $95,000. Stock markets are closed, so there are fewer buyers than on a weekday.',
        'A trader long at 20× with isolated margin had a liquidation price about 4.5% below entry ($100,000 × (1 − 1/20) ÷ (1 − 0.5%) ≈ $95,500). The exchange closes the position and sells, pushing price lower.',
        'Each wave of forced selling triggers the next. The price falls another 8%, to about $87,400, and the 10× longs (liquidation about 9.5% below entry, near $90,450) are wiped out too.',
        'A 3× long has its liquidation about 33% below entry and survives. A holder of the actual coins with no loan is not forced out: they are down about 13% on paper but still own the coins.',
        'By Monday the price recovers half the drop. The 20× and 10× traders are not there to see it: their margin is gone.',
      ],
      result: 'Same coin, same weekend: the 20× trader lost the whole margin on a 4.5% dip, while the unleveraged holder was down about 13% on paper and got half of it back by Monday.',
    },
    mistakes: [
      'Treating one force as the whole story, such as "ETF money is flowing in, so it can only go up."',
      'Trading the halving calendar as if it were a schedule. There have been only four halvings, and each cycle looked different.',
      'Ignoring leverage. Record funding rates and crowded longs have often come right before sharp drops.',
      'Forgetting crypto trades all weekend and overnight, when stock markets are closed and fewer buyers are around.',
    ],
    points: [
      'Crypto has no earnings, so money flows, leverage and mood move it more than they move stocks.',
      'Easy money and a rising stock market have often been tailwinds; tight money and risk-off moods have been headwinds. The dollar and real yields are often cited too, but those links are unreliable.',
      'Heavy leverage makes the market fragile: forced selling can turn a small dip into a crash in minutes.',
      'Forces explain moves better after the fact than before. Size every position for a big move either way.',
    ],
    terms: ['Bitcoin', 'Halving', 'Stablecoin', 'Perpetual futures', 'Funding rate', 'Liquidation', 'Spot bitcoin ETF'],
    quiz: { q: 'Funding rates are at a record and most traders are long with borrowed money. What is the main risk?', options: ['A slow, steady rise', 'A fast drop as forced selling triggers more forced selling', 'None, funding only affects short sellers'], answer: 1, why: 'Crowded, leveraged longs are fuel for a liquidation cascade: a small dip forces sales that push price lower and force more sales.' },
    sources: [{ t: 'Federal Reserve: FOMC statement, September 16, 2026', u: 'https://federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm' }, { t: 'iShares Bitcoin Trust (IBIT): fund page', u: 'https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf' }, { t: 'FBI: North Korea responsible for $1.5 billion Bybit hack (PSA, Feb 2025)', u: 'https://www.ic3.gov/PSA/2025/PSA250226' }, { t: 'FXStreet: bitcoin and Nasdaq-100 correlation hits 70% (Matrixport, Mar 2025)', u: 'https://www.fxstreet.com/cryptocurrencies/news/bitcoin-vs-nasdaq-100-index-correlation-hits-70-matrixport-analysts-hint-at-what-to-expect-202503251650' }, { t: 'Crypto Briefing: bitcoin decouples from the Nasdaq (Grayscale, Sep 2026)', u: 'https://cryptobriefing.com/bitcoin-decouples-nasdaq-aligns-gold/' }, { t: 'Crypto Briefing: Grayscale on bitcoin and S&P 500 volatility (Oct 2026)', u: 'https://cryptobriefing.com/grayscale-sp-500-more-volatile-than-bitcoin/' }, { t: 'MoneySense: the October 10, 2025 liquidations (Coinglass data)', u: 'https://www.moneysense.ca/?p=368849' }, { t: 'Crypto Briefing: US bitcoin ETF assets and flows (Oct 2026)', u: 'https://cryptobriefing.com/?p=394338' }],
  });

  SML.lessons.push({
    id: 'l-crypto-trading', course: 'crypto', order: 5, title: 'How to trade crypto', mins: 12, level: 'Intermediate',
    summary: 'Spot, ETFs, futures and perps: how each works, what it costs, and how leverage gets you liquidated.',
    idea: 'Most crypto blowups come from leverage and size, not from picking the wrong coin. Know your liquidation price before you click.',
    widget: 'liqCalc',
    try: 'Raise the leverage and the days held. Watch the liquidation line move into normal noise, then compare your position with the size the 1% rule suggests.',
    body: [
      '<h3>Four ways in</h3><ul><li><b>Spot on a US exchange or broker.</b> You buy the coins themselves on platforms such as Coinbase, Kraken or Robinhood, and can usually move them to your own wallet. Fees vary a lot (below).</li><li><b>Spot ETFs in a brokerage account or IRA.</b> Funds such as IBIT hold the coins for you for a yearly fee (IBIT charges 0.25%). They trade only during market hours, you can use options on them, and there are no keys to lose.</li><li><b>Regulated futures.</b> CME bitcoin futures cover 5 bitcoin and micro futures 0.1 bitcoin; they are cash-settled, need margin, and since May 29, 2026 trade around the clock. See <a href="#l-oil">how futures work</a>.</li><li><b>Perpetual futures.</b> Futures with no expiry, kept near the spot price by funding payments. In the US, Coinbase has offered CFTC-regulated perpetual-style futures since July 2025 (up to 10×), and Kraken announced perps for eligible US clients through Bitnomial in May 2026. Offshore exchanges offer far higher leverage, but US residents are generally barred from them.</li></ul>',
      '<h3>Placing the trade</h3><p>Costs differ a lot. In October 2026, Coinbase Advanced charged 0.40% for orders that add liquidity and 0.60% for orders that take it, below $10,000 of monthly trading; Kraken Pro charged 0.40% and 0.80% at its first tier; Robinhood’s tiered crypto fees ran from 0% to 0.95% by volume. Simple "buy" buttons usually add a spread on top, so a round trip on a convenience app can cost 2% or more (Kraken’s app, for example, charges 1% per instant buy plus the spread). Use <a href="#l-orders">limit orders</a> so you choose your price, especially at night and on weekends when order books are thin and a market order can fill far from the last price. Compare the total cost of a round trip (buy plus sell) before you pick a platform.</p>',
      '<h3>Charts mostly work the same</h3><p>Support and resistance, breakouts and retests, volume and VWAP all apply (see <a href="#l-levels">key levels</a> and <a href="#l-vwap">VWAP</a>). Three differences: there is no opening bell, so most traders use the daily candle that starts at midnight UTC; a VWAP has to be anchored to a start time you choose; and trading is split across many exchanges, so the volume and VWAP on one exchange’s chart cover only that venue and can differ from another’s.</p>',
      '<h3>Leverage and liquidation</h3><p>With leverage you put up <b>margin</b> and the exchange lends the rest. At 10×, a move of about 10% against you wipes out the margin, and the exchange closes you a little before that, at the <b>liquidation price</b>, to keep a small buffer called maintenance margin. <b>Isolated</b> margin risks only the margin on that trade; <b>cross</b> margin uses your whole account, so liquidation is further away but takes everything when it comes.</p>',
      '<h3>The short side</h3><p>Shorting works in reverse: a 10× short at $80,000 is liquidated near $87,600, about 9.5% higher (fees ignored). When <b>funding</b> turns negative, shorts pay longs, which has happened in crashes. And in extreme moves some exchanges use <b>auto-deleveraging</b>: they close out winning traders’ positions to cover losses that liquidations could not, so even a correct short can be cut off early.</p>',
      '<h3>Funding</h3><p>Perpetual futures charge or pay <b>funding</b>, usually every eight hours. When it is positive, longs pay shorts. The standard rate is 0.01% every eight hours, about 11% a year on the whole position, not just your margin, and it climbs far higher in a frenzy. In October 2026, bitcoin funding was running at about +10% a year. Holding a perp for weeks can quietly cost more than the fee to trade it.</p>',
      '<h3>Size with the 1% rule</h3><p>Decide the most you will lose if your stop is hit, usually 1% of the account, then divide by the stop distance: <b>size = account × 1% ÷ stop distance</b> (see <a href="#l-one-percent">the 1% rule</a> and <a href="#l-position-size">position sizing</a>). Crypto needs wider stops than stocks because it swings more, so the position must be smaller. With a normal 5% stop the rule almost never calls for leverage.</p>',
      '<h3>Weekends and gaps</h3><p>Crypto never closes. Big moves often happen at night or on weekends, liquidity is thinner, and stop orders can fill well past their price. Crypto ETFs only trade during stock market hours, so they can open Monday far from Friday’s close.</p>',
      '<h3>Investing instead of trading</h3><p>If you want exposure without a screen, buy a small fixed amount on a schedule (dollar-cost averaging), keep crypto to a small slice of your investments, and rebalance once a year (see <a href="#l-allocation">asset allocation</a>). Keep a <a href="#l-journal">trade journal</a> either way: it also gives you the records you need for taxes.</p>',
    ],
    example: {
      title: 'Sizing a bitcoin trade with the 1% rule',
      intro: 'A $10,000 account, an entry at $80,000 (a round number near October 2026 prices) and a stop 5% below.',
      steps: [
        'The most you plan to lose is 1% of $10,000: $100.',
        'Your stop is 5% below entry, at $76,000. Position size = $100 ÷ 5% = $2,000, which is 0.025 bitcoin. No leverage needed.',
        'Compare a 10× trade: $1,000 of margin controls $10,000 of bitcoin. If the 5% stop fills, you lose $500 (5% of the account), five times your plan.',
        'Its liquidation price sits about 9.5% below entry, near $72,400 ($80,000 × 0.9 ÷ 0.995 with 0.5% maintenance margin, before fees). With yearly volatility around 43%, a normal day is about ±2.3% (43% ÷ √365, since crypto trades every day), so the cushion is only about four times a normal day’s move. A simple random walk has roughly a 1-in-10 chance of touching it within a week, and real markets jump more than that.',
        'Hold it a week with funding at +0.01% every eight hours and you pay about $21 in funding on the $10,000 position (21 payments of $1), plus trading fees on the way in and out.',
      ],
      result: 'The 1% rule says a $2,000 spot position. The 10× trade risks five times more, and in a simple model has about a 1-in-10 chance of being liquidated within a week.',
    },
    mistakes: [
      'Using leverage because the platform offers it, without looking up the liquidation price first.',
      'Setting a stop beyond the liquidation price, so the exchange closes you before your stop can.',
      'Using market orders at 3 a.m. on a Sunday, when thin order books mean a bad fill.',
      'Holding perpetual futures for weeks without adding up the funding you pay.',
    ],
    points: [
      'Spot, ETFs, regulated futures and perpetual futures all give exposure, with very different costs and risks.',
      'Leverage turns normal swings into liquidations: at 10×, a move of about 10% against you ends the trade.',
      'Size from your stop: account × 1% ÷ stop distance. In crypto that usually means a small position and no leverage.',
      'Use limit orders, count fees and funding, and remember the market never closes.',
    ],
    terms: ['Perpetual futures', 'Funding rate', 'Liquidation', 'Leverage', 'Spot bitcoin ETF', 'Position size', 'Futures contract'],
    quiz: { q: 'You have $10,000, risk 1% per trade and set a 5% stop. About how big should the position be?', options: ['$500', '$2,000', '$10,000'], answer: 1, why: '1% of $10,000 is $100. $100 ÷ 5% = $2,000, so a stop-out loses your planned $100.' },
    sources: [{ t: 'CME Group: cryptocurrency futures FAQ', u: 'https://www.cmegroup.com/articles/faqs/frequently-asked-questions-cryptocurrency-futures.html' }, { t: 'Kraken fee schedule', u: 'https://www.kraken.com/features/fee-schedule' }, { t: 'Robinhood: crypto fee tiers', u: 'https://robinhood.com/us/en/support/articles/crypto-fee-tiers' }, { t: 'Investor.gov: dollar-cost averaging', u: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging' }],
  });

  SML.lessons.push({
    id: 'l-crypto-risks', course: 'crypto', order: 6, title: 'Risks, scams and taxes', mins: 11, level: 'Beginner',
    summary: 'How people lose crypto (scams, hacks, failed platforms, leverage) and how the IRS taxes every sale, swap and reward.',
    idea: 'There is no bank to call in crypto: stolen or scammed coins are usually gone. Know the traps, and keep tax records from your first trade.',
    widget: 'cryptoRisks',
    try: 'Judge each message as scam or legit, then switch tabs to test which actions are taxable and to score your own safety habits.',
    body: [
      '<h3>How people lose money</h3><ul><li><b>Crashes:</b> bitcoin has fallen more than 75% from a peak more than once, and ether was about 50% below its record in October 2026.</li><li><b>Leverage:</b> about $19 billion of leveraged positions were wiped out on October 10–11, 2025.</li><li><b>Failed platforms:</b> Mt. Gox reported about 850,000 bitcoin missing in 2014 (about 200,000 were later found); FTX collapsed in November 2022 after its founder took more than $8 billion of customer money.</li><li><b>Hacks:</b> about $3.4 billion was stolen in 2025, including about $1.5 billion from Bybit.</li><li><b>Lost keys:</b> Chainalysis estimated in 2020 that about 3.7 million bitcoin are probably lost for good.</li><li><b>Broken pegs:</b> TerraUSD, an algorithmic stablecoin, collapsed in May 2022; investors lost an estimated $40 billion.</li></ul>',
      '<h3>The scams that work</h3><p>The FBI’s 2025 internet crime report counted about $11.4 billion of crypto-related losses, a record. About $7.2 billion came from crypto investment fraud such as pig butchering, people 60 and older lost about $4.3 billion, and about $389 million was lost through crypto ATMs. The patterns repeat:</p><ul><li><b>Pig butchering:</b> a stranger becomes a friend or romantic interest over weeks, then shows you a "platform" with fake profits. When you try to withdraw, there are fees and "taxes" to pay first.</li><li><b>Impostors and crypto ATMs:</b> callers posing as your bank, the government or tech support tell you to move cash into a bitcoin ATM "to protect it".</li><li><b>Wallet drainers:</b> fake airdrops, support accounts and lookalike apps that ask you to connect a wallet, sign an approval or type your recovery phrase.</li><li><b>Guaranteed yield and rug pulls:</b> fixed daily returns, recruiting bonuses, anonymous teams and new coins hyped before launch.</li><li><b>Recovery scams:</b> after a loss, someone offers to get your coins back for a fee. They cannot.</li></ul>',
      '<h3>If you are targeted or scammed</h3><ul><li>Stop sending money, even if they promise a refund or ask for a release fee.</li><li>Report it at <b>IC3.gov</b> with the wallet addresses and transaction IDs (hashes), and tell the exchange you sent from right away.</li><li>Forward scam texts to <b>7726</b> (SPAM) and ignore unsolicited messages from strangers.</li><li>Before using any platform, check that it is registered: FINRA BrokerCheck for brokers, NFA BASIC for futures firms, and your state’s money-transmitter licence list.</li><li>Expect "recovery" offers to follow, and ignore them.</li></ul>',
      '<h3>No safety net</h3><p>SIPC does not protect crypto that is not a security, and the FDIC does not insure crypto. Crypto transfers cannot be reversed, and when a platform goes bankrupt, customers can wait years as creditors. Each way of holding crypto trades one risk for another: spreading coins across platforms limits what one failure can take but does not remove the risk; a licensed US exchange can still fail; holding your own keys removes platform risk but adds the risk of losing or leaking the keys; and ETF shares at a SIPC-member broker are securities, where SIPC covers the broker failing, not prices falling (see <a href="#l-crypto-custody">wallets and custody</a>).</p>',
      '<h3>How crypto is taxed</h3><p>The IRS treats crypto, stablecoins and NFTs as <b>property</b>, not currency. Every Form 1040 asks whether you received or disposed of a digital asset, and you report each sale on Form 8949 even when there is no gain.</p><ul><li><b>Taxable sales:</b> selling for dollars, swapping one coin for another and spending crypto. Held more than a year: long-term rates; a year or less: ordinary income rates.</li><li><b>Not taxable:</b> buying with dollars and moving coins between your own wallets (a network fee paid in crypto can be a tiny taxable sale).</li><li><b>Income:</b> staking rewards (Rev. Rul. 2023-14) and mining rewards (IRS digital-assets guidance, Notice 2014-21) are ordinary income at their value when you gain control of them.</li><li><b>Form 1099-DA:</b> brokers report gross proceeds for sales from 2025 and cost basis for certain sales from 2026. Keep your own records anyway, especially for coins moved between platforms.</li><li><b>Wash sales:</b> as of October 2026 the wash-sale rule does not apply to crypto you hold directly (bills to change that are pending, not law), but it does apply to crypto ETF shares. Very aggressive loss harvesting can still be challenged by the IRS.</li><li><b>Scam alert:</b> there is no IRS crypto "registration". Letters with QR codes pointing to a "compliance portal" are scams.</li></ul><p>See <a href="#l-cap-gains">short- and long-term gains</a> and <a href="#l-wash-sale">the wash-sale rule</a>. Choosing which coins you sold (cost-basis method) and claiming losses from theft or scams are complicated and change often; check current IRS rules or use a CPA or enrolled agent who handles crypto, especially if you trade a lot.</p>',
      '<h3>How much to own</h3><p>Large asset managers have suggested small slices: BlackRock called 1–2% of a multi-asset portfolio a reasonable range for bitcoin (December 2024), and Morgan Stanley’s investment committee suggested 0% for conservative portfolios and up to 4% for aggressive growth ones (October 2025). At 2%, a repeat of a 77–84% crash would cost about 1.5–1.7% of the whole portfolio. Decide your slice before you buy, write it down, and rebalance back to it rather than chasing a run-up.</p>',
    ],
    example: {
      title: 'One year of crypto at tax time',
      intro: 'Made-up numbers for one person in the 22% bracket, all trades within a year (short-term).',
      steps: [
        'In January you buy 0.5 bitcoin at $60,000 each: $30,000. Buying is not taxable; your cost basis is $30,000, or $6,000 per 0.1 bitcoin.',
        'In June you swap 0.1 bitcoin, worth $9,000, for ether. That swap is a sale: $9,000 − $6,000 = a $3,000 short-term gain. Your ether’s cost basis is $9,000.',
        'Over the year you receive staking rewards worth $400 when they land. That $400 is ordinary income, and it becomes the rewards’ cost basis.',
        'In December you swap the ether for USDC worth $7,500. That is a sale too: a $1,500 short-term loss ($9,000 − $7,500). Your USDC’s cost basis is $7,500.',
        'Net: $3,000 − $1,500 = $1,500 of short-term gain plus $400 of income, about $1,900 taxed at 22%: roughly $418. You still hold 0.4 bitcoin (cost basis $24,000), $7,500 of USDC and the $400 of staking rewards.',
      ],
      result: 'Two swaps and some rewards created three tax events and about $418 of federal tax, even though you never cashed out to dollars.',
    },
    mistakes: [
      'Thinking a coin-to-coin swap is not taxable until you cash out to dollars.',
      'Leaving coins on a little-known platform because it promises a high, steady yield.',
      'Sharing a recovery phrase or your screen with "support", or signing a wallet request on a site you did not find yourself.',
      'Paying a "recovery service" after a scam. That is almost always a second scam.',
    ],
    points: [
      'Most losses come from crashes, leverage, scams and failed platforms, and crypto losses are rarely recoverable.',
      'No real bank, agency or company will ask you to move money into crypto, share a recovery phrase or sign a wallet request.',
      'The IRS treats crypto as property: selling, swapping and spending are sales, and rewards are income.',
      'Keep records of every trade from day one, and keep crypto to a small slice you could lose.',
    ],
    terms: ['Rug pull', 'Pig-butchering scam', 'Depeg', 'Form 1099-DA', 'Seed phrase', 'Capital gain'],
    quiz: { q: 'You swap $5,000 of bitcoin for ether. What happened for tax purposes?', options: ['Nothing until you sell for dollars', 'You sold bitcoin, so you have a gain or loss to report', 'Only the ether purchase counts'], answer: 1, why: 'A swap is a sale of the coin you give up at its market value, so it creates a gain or loss on that bitcoin.' },
    sources: [{ t: 'IRS: Digital assets', u: 'https://www.irs.gov/filing/digital-assets' }, { t: 'FBI IC3: 2025 Internet Crime Report (PDF)', u: 'https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf' }, { t: 'SIPC: What SIPC protects', u: 'https://www.sipc.org/for-investors/what-sipc-protects' }, { t: 'CFTC: joint alert on relationship investment scams', u: 'https://www.cftc.gov/PressRoom/PressReleases/8963-24' }],
  });
})();
