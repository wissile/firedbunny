/* Trading track, course "commod": oil, gold and silver, copper. Fork M4. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const segOf = (e) => (e && e.target && e.target.closest ? e.target.closest('.seg') : null);
  const usd = (v, d) => F.usd(v, d == null ? 2 : d);
  const usd0 = (v) => F.usd(v, 0);
  const sgn = (v, d, unit) => (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), d == null ? 0 : d) + (unit || '');

  /* Market levels and facts used as defaults (see lesson sources). Filled from research/macro.md. */
  const DATA = {
    asOf: 'October 2026',
    wti: 98, brent: 110, brentSpot: 126.55, gas: 4.26,
    gold: 4141, silver: 58, copper: 6.54,
    ratioLow: 45, ratioHigh: 124, ratioNow: 71,
    er: { GLD: 0.40, IAU: 0.25, SLV: 0.50, GDX: 0.51 },
    gasWeight: 2.895, // CPI-U relative importance of gasoline (all types), December 2025, BLS
    gasWeightNow: 3.6, // our estimate after the 2026 gas price jump (weights rise with relative prices)
    usProd: 'US crude output hit a record of about 14 million barrels a day in October 2025 (EIA).',
    oilHistory: [
      '1973: an Arab oil embargo began in October; oil rose from about $2.90 to $11.65 a barrel by January 1974, nearly four times higher (Federal Reserve History).',
      '1990: after Iraq invaded Kuwait in August, oil climbed from about $17 to a peak near $46 in October and helped tip the US into recession.',
      '2022: after Russia invaded Ukraine, Brent peaked at about $139 in March, the highest since 2008.',
      '2026: from late February, fighting involving Iran disrupted tanker traffic through the Strait of Hormuz. Brent futures neared $120 in early March, touched about $126 on April 30, fell to about $74 by late June and were back above $100 in October.',
    ],
    oilSrc: [
      { t: 'Federal Reserve History: Oil shock of 1973–74', u: 'https://www.federalreservehistory.org/essays/oil-shock-of-1973-74' },
      { t: 'AAA: national average gas prices', u: 'https://gasprices.aaa.com/' },
      { t: 'BLS: Consumer Price Index news release', u: 'https://www.bls.gov/news.release/cpi.nr0.htm' },
    ],
    cbBuying: 'central banks bought more than 1,000 tonnes a year in 2022–2024, 863 tonnes in 2025, and 289 tonnes in the second quarter of 2026, a record for any second quarter (World Gold Council).',
    levelsText: 'Gold first topped $4,000 an ounce in October 2025, rose about 67% that year and set a record of roughly $5,600 on January 28–29, 2026. By October 21, 2026 it was about $4,141, around a quarter below the high, as rising bond yields and bets on rate hikes pulled it down even while geopolitical risk stayed high. Silver set a record of about $121.60 on January 29, 2026 and was about $58 in October.',
    silverNote: 'In the month to October 21, 2026 alone, silver fell about 14%.',
    ratioText: 'It hit a modern record of about 124 in March 2020, averaged 86 in 2019, and dropped to about 45 at the January 2026 peaks. In October 2026 it was about 71.',
    metalSrc: [
      { t: 'World Gold Council: central bank demand, full year 2025', u: 'https://gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2025/central-banks' },
      { t: 'Metal Charts: precious metals all-time highs', u: 'https://metalcharts.org/precious-metals-all-time-highs' },
      { t: 'iShares Gold Trust (IAU) fund page', u: 'https://www.ishares.com/us/products/239561/ishares-gold-trust-fund' },
    ],
    copperLevel: 'US copper futures (COMEX) were about $6.54 a pound on October 21, 2026, up about a third in a year, after a record near $6.85 in September 2026.',
    copperSrc: [
      { t: 'S&P Global: prices decline as US 50% tariff excludes refined copper', u: 'https://www.spglobal.com/market-intelligence/en/news-insights/research/prices-decline-as-us-50-tariff-excludes-refined-copper' },
      { t: 'Polsinelli: Section 232 tariffs formalized on copper imports', u: 'https://www.polsinelli.com/publications/new-section-232-tariffs-formalized-on-copper-imports' },
      { t: 'Trading Economics: copper price', u: 'https://tradingeconomics.com/commodity/copper' },
    ],
  };

  SML.css(`
.xm [hidden]{display:none!important}
.xm-tbl{width:100%;border-collapse:collapse;font-size:14px}
.xm-tbl th,.xm-tbl td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.xm-tbl th{font:600 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.xm-tbl td b{color:var(--ink)}
.xm-tbl td.n{font:600 13.5px var(--mono);color:var(--ink);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.xm-tw{overflow-x:auto;padding:4px 4px 8px}
@media (max-width:520px){.xm-tbl .hm{display:none}.xm-tbl th,.xm-tbl td{padding:8px 8px}}
`);

  /* ===================================================================== */
  /* 1. oilShock: an oil move rippling into gas, CPI, the Fed and sectors     */
  /* ===================================================================== */
  const CAUSE = {
    supply: { label: 'OPEC+ cut', kind: 'supply', mult: 1.25 },
    war: { label: 'War or disruption', kind: 'supply', mult: 1.4 },
    slump: { label: 'Demand slump', kind: 'demand', mult: 0.65 },
    boom: { label: 'Demand boom', kind: 'demand', mult: 1.25 },
  };
  const SECT = [
    ['Oil and gas producers', 1.0, 1.0],
    ['Refiners', 0.25, 0.4],
    ['Airlines', -0.9, 0.25],
    ['Trucking and delivery', -0.6, 0.4],
    ['Chemicals and plastics', -0.45, 0.2],
    ['Shops and restaurants', -0.5, 0.5],
    ['Broad stock market', -0.3, 0.5],
  ];
  SML.widgets.oilShock = function (root, opts) {
    opts = opts || {};
    root.classList.add('xm');
    const id = SML.uid('os');
    const B = DATA.wti, G0 = DATA.gas;
    const c0 = CAUSE[opts.cause] ? opts.cause : 'war';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Why oil moved</span>${ui.seg(id + '-c', Object.keys(CAUSE).map((k) => ({ v: k, label: CAUSE[k].label })), c0, 'Cause of the oil move')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-p', label: 'Oil price (WTI, a barrel)', min: 30, max: 160, step: 1, value: Math.round(B * CAUSE[c0].mult), fmt: 'usd0' })}
        ${ui.slider({ id: id + '-g', label: 'Gallons of gas you buy a year', min: 100, max: 2000, step: 50, value: 600, fmt: 'num' })}
      </div>
      <div class="wg-read">${ui.stat('Gas a gallon', id + '-gas')}${ui.stat('Your fuel bill', id + '-bill')}${ui.stat('Headline CPI push', id + '-cpi', 'hl')}${ui.stat('The Fed', id + '-fed')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the oil price on the track or use the slider. Starting point: WTI futures about ${usd0(B)} and regular gas about ${usd(G0)} a gallon (AAA), ${DATA.asOf}. A barrel holds 42 gallons, so each $1 on a barrel is about 2.4 cents a gallon once it passes through, usually within weeks. The CPI push is the direct effect of gasoline only, using a weight of about ${DATA.gasWeightNow}%: gasoline was 2.9% of the CPI basket at December 2025 prices (BLS) and its share grows when gas prices jump. Airfares, shipping and plastics add more over months. Sector bars show the typical direction, not a forecast.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const sg = segOf(e);
      if (sg && sg.id === id + '-c') st.set(id + '-p', Math.round(B * CAUSE[st.seg(id + '-c')].mult));
      draw();
    });
    let G = null;
    ui.drag(fig, {
      sel: '[data-h]',
      move(pt) { if (!G) return; const p = Math.round(SML.clamp(G.inv(pt.x), 30, 160)); st.set(id + '-p', p); draw(); },
    });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const cause = st.seg(id + '-c') || 'war', kind = CAUSE[cause].kind;
      const p = st.n(id + '-p'), gal = st.n(id + '-g');
      const ch = (p - B) / B, dGas = (p - B) / 42, gas = Math.max(0.5, G0 + dGas), gasPct = dGas / G0;
      const cpi = DATA.gasWeightNow * gasPct, bill = gal * dGas;
      const x0 = 16, x1 = W - 16;
      let b = '';
      // price track
      const tx = SML.lin(30, 160, x0 + 8, x1 - 8), ty = 44;
      b += S.text(x0, 16, compact ? 'Drag the oil price' : 'Drag the oil price along the track', 'sm acc b');
      b += S.line(tx(30), ty, tx(160), ty, 's-line w4');
      b += S.line(tx(Math.min(B, p)), ty, tx(Math.max(B, p)), ty, (p >= B ? 's-dn' : 's-up') + ' w4');
      [30, 60, 90, 120, 160].forEach((v) => { b += S.text(tx(v), ty + 22, '$' + v, 'xs mono', 'middle'); });
      b += S.line(tx(B), ty - 9, tx(B), ty + 9, 's-ink w2') + S.text(tx(B), ty - 13, 'today', 'xs ink b', 'middle');
      b += S.circle(tx(p), ty, 18, 'hit', ' data-h="p"') + S.circle(tx(p), ty, 9, 'handle', ' data-h="p"');
      G = { inv: (x) => 30 + ((x - tx(30)) / (tx(160) - tx(30))) * 130 };
      // ripple boxes
      const fed = kind === 'supply' ? (ch > 0.08 ? ['Dilemma', 'prices up, growth down', 'dn'] : ch < -0.08 ? ['Relief', 'cheaper energy', 'up'] : ['Calm', 'little change', 'mut'])
        : (ch < -0.08 ? ['Room to cut', 'demand is weak', 'info'] : ch > 0.08 ? ['Hold or hike', 'economy running hot', 'acc'] : ['Calm', 'little change', 'mut']);
      const boxes = [
        ['CRUDE (WTI)', usd0(p), (ch >= 0 ? '+' : F.minus) + F.num(Math.abs(ch * 100), 0) + '% vs today', ch > 0.02 ? 'dn' : ch < -0.02 ? 'up' : 'ink'],
        ['GASOLINE', usd(gas), (Math.abs(dGas) >= 1 ? (dGas > 0 ? '+' : F.minus) + usd(Math.abs(dGas)) : sgn(dGas * 100, 0, '¢')) + ' a gallon', dGas > 0.01 ? 'dn' : dGas < -0.01 ? 'up' : 'ink'],
        ['HEADLINE CPI', sgn(cpi, 2, ' pts'), 'direct effect only', cpi > 0.05 ? 'dn' : cpi < -0.05 ? 'up' : 'ink'],
        ['THE FED', fed[0], fed[1], fed[2]],
      ];
      const by = 82, cols = compact ? 2 : 4, gap = compact ? 10 : 22, bw = (x1 - x0 - gap * (cols - 1)) / cols, bh = 78;
      boxes.forEach((bx, i) => {
        const cx = x0 + (i % cols) * (bw + gap), cy = by + Math.floor(i / cols) * (bh + 12);
        b += S.rect(cx, cy, bw, bh, 'f-surf s-line', 6);
        b += S.text(cx + 12, cy + 20, bx[0], 'cap');
        b += S.text(cx + 12, cy + 47, bx[1], (compact ? 'lg' : 'xl') + ' b mono ' + bx[3]);
        b += S.text(cx + 12, cy + 66, bx[2], 'sm');
        if (!compact && i < 3) b += S.arrow(cx + bw + 3, cy + bh / 2, cx + bw + gap - 3, cy + bh / 2, 'mut', 6);
      });
      // sector bars
      const sy = by + (compact ? 2 * bh + 12 : bh) + 34;
      b += S.text(x0, sy, compact ? 'Who wins, who loses' : 'Who tends to win or lose from this move', 'md ink b');
      const lw = compact ? 128 : 190, ax = x0 + lw + (x1 - x0 - lw) / 2, half = (x1 - x0 - lw) / 2 - 10;
      const rh = 26, ry0 = sy + 16;
      b += S.line(ax, ry0 - 4, ax, ry0 + SECT.length * rh, 's-mut');
      b += S.text(ax - 6, ry0 + SECT.length * rh + 14, 'hurts', 'xs dn', 'end') + S.text(ax + 6, ry0 + SECT.length * rh + 14, 'helps', 'xs up');
      SECT.forEach(([name, sSup, sDem], i) => {
        const s = kind === 'supply' ? sSup : sDem;
        const eff = SML.clamp(s * ch * 1.6, -1, 1), y = ry0 + i * rh;
        b += S.text(x0, y + 15, compact ? name.replace(' and ', ' & ').replace('Shops & restaurants', 'Shops, dining') : name, 'sm ink');
        const len = Math.abs(eff) * half;
        if (len > 0.5) b += S.rect(eff > 0 ? ax : ax - len, y + 4, len, rh - 10, eff > 0 ? 'f-up' : 'f-dn', 2);
        const word = Math.abs(eff) > 0.5 ? 'strong' : Math.abs(eff) > 0.2 ? 'moderate' : Math.abs(eff) > 0.04 ? 'mild' : 'little effect';
        const lx = eff > 0 ? ax + len + 6 : ax - len - 6;
        if (!compact || Math.abs(eff) > 0.04) b += S.text(Math.abs(eff) <= 0.04 ? ax + 6 : lx, y + 15, word, 'xs ' + (Math.abs(eff) <= 0.04 ? 'mut' : eff > 0 ? 'up' : 'dn'), Math.abs(eff) <= 0.04 ? 'start' : eff > 0 ? 'start' : 'end');
      });
      const H = ry0 + SECT.length * rh + 22;
      fig.innerHTML = S.wrap(W, H, `Oil at ${usd0(p)} a barrel (${CAUSE[cause].label}): gasoline about ${usd(gas)} a gallon, headline CPI ${sgn(cpi, 2, ' points')}, and the effect on sectors.`, b, 'drag');
      setT(id + '-gas', usd(gas), dGas > 0.01 ? 'dn' : dGas < -0.01 ? 'up' : '');
      setT(id + '-bill', (bill >= 0 ? '+' : F.minus) + usd0(Math.abs(bill)) + '/yr', bill > 5 ? 'dn' : bill < -5 ? 'up' : '');
      setT(id + '-cpi', sgn(cpi, 2, ' pts'), cpi > 0.05 ? 'dn' : cpi < -0.05 ? 'up' : '');
      setT(id + '-fed', fed[0], fed[2] === 'mut' ? '' : fed[2]);
      let m;
      if (Math.abs(ch) < 0.08) m = ['', 'Small move', `Oil within about 8% of today barely shows up at the pump or in inflation. Markets mostly ignore it.`];
      else if (kind === 'supply' && ch > 0) m = ['dn', 'Supply shock', `Less oil for the same demand: gas jumps about ${dGas >= 1 ? usd(dGas) : F.num(dGas * 100, 0) + '¢'} a gallon, costing you about ${usd0(bill)} a year, and headline inflation gets a ${F.num(cpi, 2)}-point push. Producers profit while airlines and shoppers pay. The Fed faces higher prices and slower growth at once, the stagflation trap.`];
      else if (kind === 'supply') m = ['up', 'Supply glut', `More oil than buyers want: cheaper gas works like a tax cut of about ${usd0(-bill)} a year for you, and inflation cools. Energy stocks lag; airlines and shops benefit.`];
      else if (ch < 0) m = ['info', 'Demand slump', `Oil is falling because the economy is weakening, so cheap gas is not good news here. Energy stocks drop most, and the broad market usually falls too. Lower inflation gives the Fed room to cut.`];
      else m = ['acc', 'Demand boom', `Oil is rising because the economy is strong. Energy and most cyclical stocks can rise together, but the inflation push (${sgn(cpi, 2, ' pts')}) can keep the Fed from cutting.`];
      setMsg(id + '-msg', m[0], m[1], m[2]);
    });
  };

  /* ===================================================================== */
  /* 1b. oilCurve: contango, backwardation and why oil funds lag spot        */
  /* ===================================================================== */
  SML.widgets.oilCurve = function (root, opts) {
    opts = opts || {};
    root.classList.add('xm');
    const id = SML.uid('oc');
    const SH = { contango: 2, flat: 0, back: -1.5 };
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Futures curve</span>${ui.seg(id + '-s', [{ v: 'contango', label: 'Contango' }, { v: 'flat', label: 'Flat' }, { v: 'back', label: 'Backwardation' }], 'contango', 'Curve shape')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-k', label: 'Each later month costs', min: -3, max: 3, step: 0.25, value: 2, fmt: (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), 2) + '%' })}
        ${ui.slider({ id: id + '-m', label: 'Months the fund holds', min: 1, max: 24, step: 1, value: 12, fmt: (v) => v + (v === 1 ? ' month' : ' months') })}
      </div>
      <div class="wg-read">${ui.stat('Oil price (spot)', id + '-sp')}${ui.stat('Fund that rolls futures', id + '-fd', 'hl')}${ui.stat('$10,000 becomes', id + '-rc')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Simplified: the spot price and the curve's shape stay the same the whole time, and the fund holds next month's contract and rolls once a month. Real curves change shape all the time.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => { const sg = segOf(e); if (sg && sg.id === id + '-s') st.set(id + '-k', SH[st.seg(id + '-s')]); draw(); });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const k = st.n(id + '-k') / 100, m = st.n(id + '-m');
      const spot = Math.round(DATA.wti), fut = (n) => spot * (1 + k * n);
      const pl = compact ? 44 : 56, pr = 18, top = 34, ch = compact ? 170 : 190;
      const x = SML.lin(0, 12, pl + 12, W - pr), lo = Math.min(spot, fut(12)) - 6, hi = Math.max(spot, fut(12)) + 6, y = SML.lin(lo, hi, top + ch, top);
      let b = S.text(pl, 18, 'Price for oil delivered in later months', 'sm ink b');
      SML.ticks(lo, hi, 4).forEach((v) => { b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, '$' + F.num(v, 0), 'xs mono', 'end'); });
      [0, 3, 6, 9, 12].forEach((n) => { b += S.text(x(n), top + ch + 16, n === 0 ? 'now' : '+' + n + 'm', 'xs mono', 'middle'); });
      const pts = []; for (let n = 0; n <= 12; n++) pts.push([x(n), y(fut(n))]);
      b += S.poly(pts, 's-acc w25');
      for (let n = 1; n <= 12; n++) b += S.circle(x(n), y(fut(n)), 3.5, 'f-acc');
      b += S.circle(x(0), y(spot), 6, 'f-ink') + S.text(x(0) + 10, y(spot) + (k >= 0 ? 16 : -10), 'spot $' + spot, 'sm ink b');
      // roll arrows
      if (Math.abs(k) > 0.0001) {
        b += S.arrow(x(2), y(fut(2)) + (k > 0 ? -14 : 14), x(1), y(fut(1)) + (k > 0 ? -14 : 14), 'ink', 6);
        b += S.text(x(1.5), y(fut(1.5)) + (k > 0 ? -22 : 30), compact ? 'roll' : 'buy next month, it slides to spot', 'xs ink', 'middle');
      }
      const fund = Math.pow(1 / (1 + k), m) - 1;
      // result bars
      const ry = top + ch + 40, lx0 = 16, bx0 = lx0 + (compact ? 96 : 120), sc = (W - 16 - bx0 - 70) / 0.6;
      b += S.text(lx0, ry, `After ${m} month${m > 1 ? 's' : ''} with spot unchanged`, 'sm ink b');
      [['Oil itself', 0, 'f-mut'], ['Rolling fund', fund, fund < 0 ? 'f-dn' : 'f-up']].forEach(([lab, v, cls], i) => {
        const yy = ry + 14 + i * 28, len = Math.min(Math.abs(v), 0.6) * sc;
        b += S.text(lx0, yy + 15, lab, 'sm');
        b += S.rect(bx0, yy + 3, Math.max(2, len), 16, cls, 2);
        b += S.text(bx0 + Math.max(2, len) + 6, yy + 15, F.spct(v * 100, 1), 'sm mono b ' + (v < -0.0005 ? 'dn' : v > 0.0005 ? 'up' : 'ink'));
      });
      const H = ry + 74;
      fig.innerHTML = S.wrap(W, H, `Futures curve with each later month ${F.num(k * 100, 2)}% different. A fund that rolls futures for ${m} months returns about ${F.spct(fund * 100, 1)} while spot is flat.`, b);
      setT(id + '-sp', '0.0%');
      setT(id + '-fd', F.spct(fund * 100, 1), fund < -0.0005 ? 'dn' : fund > 0.0005 ? 'up' : '');
      setT(id + '-rc', usd0(10000 * (1 + fund)), fund < -0.0005 ? 'dn' : fund > 0.0005 ? 'up' : '');
      if (k > 0.0001) setMsg(id + '-msg', 'dn', 'Contango', `Later months cost more, so every roll sells low and buys high. Over ${m} months the fund loses about ${F.num(-fund * 100, 1)}% even though oil did not move. This is why oil funds can trail the price you see on the news.`);
      else if (k < -0.0001) setMsg(id + '-msg', 'up', 'Backwardation', `Later months are cheaper, often when supply is tight now. Each roll buys cheaper oil that rises toward spot, so the fund gains about ${F.num(fund * 100, 1)}% with spot flat.`);
      else setMsg(id + '-msg', '', 'Flat', 'With a flat curve, rolling costs nothing and the fund tracks spot, apart from fees.');
    });
  };

  /* ===================================================================== */
  /* 2. metalsLab ★: drivers, the gold-silver ratio, ways to own and tax      */
  /* ===================================================================== */
  const DRV = [
    { k: 'ry', label: 'Real yields fall', g: 3, s: 2, c: 0.5 },
    { k: 'usd', label: 'Dollar weakens', g: 2, s: 2, c: 1.5 },
    { k: 'fear', label: 'Fear spike', g: 3, s: 1, c: -2 },
    { k: 'cb', label: 'Central banks buy gold', g: 3, s: 0.5, c: 0 },
    { k: 'boom', label: 'Factory boom', g: 0.5, s: 2, c: 3 },
    { k: 'rec', label: 'Recession', g: 1, s: -2, c: -3 },
  ];
  SML.widgets.metalsLab = function (root, opts) {
    opts = opts || {};
    root.classList.add('xm');
    const id = SML.uid('ml');
    const v0 = ['drivers', 'ratio', 'own'].indexOf(opts.view) >= 0 ? opts.view : 'drivers';
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'drivers', label: 'What moves them' }, { v: 'ratio', label: 'Gold-silver ratio' }, { v: 'own', label: 'Ways to own + tax' }], v0, 'View')}</div>
      <div data-p="drivers">
        <div class="wg-ctrl">${ui.chips(id + '-d', DRV.map((d, i) => ({ k: d.k, label: d.label, on: i < 2, color: 'var(--accent)' })))}</div>
      </div>
      <div class="wg-fig"></div>
      <div data-p="ratio"><div class="wg-ctrl">
        ${ui.slider({ id: id + '-gp', label: 'Gold, an ounce', min: 1000, max: 8000, step: 1, value: DATA.gold, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-sp', label: 'Silver, an ounce', min: 10, max: 150, step: 0.5, value: DATA.silver, fmt: (v) => usd(v) })}
      </div></div>
      <div data-p="own"><div class="wg-ctrl">
        ${ui.slider({ id: id + '-amt', label: 'Amount invested', min: 1000, max: 100000, step: 1000, value: 10000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-gain', label: 'Price gain before you sell', min: 0, max: 200, step: 5, value: 60, fmt: 'pct' })}
        ${ui.slider({ id: id + '-yrs', label: 'Years held', min: 2, max: 20, step: 1, value: 5, fmt: 'yrs' })}
        <div class="ctl" style="grid-column:1/-1"><span class="ctl-top"><span class="ctl-lab">Your top tax bracket</span></span>${ui.seg(id + '-br', ['12', '22', '24', '32', '35', '37'].map((v) => ({ v, label: v + '%' })), '24', 'Ordinary income tax bracket')}</div>
      </div></div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const read = $id(id + '-read'), note = $id(id + '-note');
    let lastView = '';
    const draw = ui.responsive(fig, (W) => {
      const view = st.seg(id + '-v') || 'drivers';
      root.querySelectorAll('[data-p]').forEach((p) => { p.hidden = p.getAttribute('data-p') !== view; });
      const compact = W < 520;
      if (view !== lastView) {
        lastView = view;
        if (view === 'drivers') read.innerHTML = ui.stat('Gold', id + '-g', 'hl') + ui.stat('Silver', id + '-s') + ui.stat('Copper', id + '-c');
        else if (view === 'ratio') read.innerHTML = ui.stat('Gold-silver ratio', id + '-r', 'hl') + ui.stat('1 oz of gold buys', id + '-oz') + ui.stat('Record high / recent low', id + '-rg');
        else read.innerHTML = ui.stat('Gold ETF after tax', id + '-a1', 'hl') + ui.stat('Stock fund after tax', id + '-a2') + ui.stat('Tax rate on the gold ETF', id + '-tr');
      }
      if (view === 'drivers') drawDrivers(W, compact);
      else if (view === 'ratio') drawRatio(W, compact);
      else drawOwn(W, compact);
    });
    function drawDrivers(W, compact) {
      const on = DRV.filter((d) => st.on(id + '-d', d.k));
      const mets = [['Gold', 'g', 'acc', 'f-acc'], ['Silver', 's', 'ink', 'f-ink'], ['Copper', 'c', 'dn', 'f-dn']];
      const x0 = 16, x1 = W - 16, lw = compact ? 0 : 90, ax = x0 + lw + (x1 - x0 - lw) / 2, half = (x1 - x0 - lw) / 2 - (compact ? 58 : 80);
      let b = S.text(x0, 18, on.length ? (compact ? 'Push from the drivers you picked' : 'Typical push on each metal from the drivers you picked') : 'Pick one or more drivers above', 'sm ink b');
      const rowH = compact ? 66 : 58, y0 = 36, maxSum = 13;
      b += S.line(ax, y0 - 4 + (compact ? 16 : 0), ax, y0 + rowH * 3 - 8 + (compact ? 16 : 0), 's-mut');
      const yb = y0 + rowH * 3 + 6 + (compact ? 16 : 0);
      b += S.text(ax - 6, yb, 'pushes down', 'xs dn', 'end') + S.text(ax + 6, yb, 'pushes up', 'xs up');
      const sums = {};
      mets.forEach(([name, key, tc], i) => {
        const y = y0 + i * rowH + (compact ? 16 : 0);
        b += compact ? S.text(x0, y + 2, name, 'md b ' + tc) : S.text(x0, y + 24, name, 'lg b ' + tc);
        let pos = ax, neg = ax, sum = 0;
        on.forEach((d) => {
          const v = d[key]; sum += v; const len = (Math.abs(v) / maxSum) * half;
          if (len < 0.5) return;
          if (v > 0) { b += S.rect(pos, y + 8, len - 1.5, 26, 'f-up', 2); if (len > 26) b += S.text(pos + len / 2, y + 25, String(DRV.indexOf(d) + 1), 'xs b on', 'middle'); pos += len; }
          else { b += S.rect(neg - len + 1.5, y + 8, len - 1.5, 26, 'f-dn', 2); if (len > 26) b += S.text(neg - len / 2, y + 25, String(DRV.indexOf(d) + 1), 'xs b on', 'middle'); neg -= len; }
        });
        sums[key] = sum;
        const word = sum >= 4 ? 'strong up' : sum >= 1.5 ? 'up' : sum > -1.5 ? 'mixed' : sum > -4 ? 'down' : 'strong down';
        const wx = sum >= 0 ? Math.max(pos, ax) + 8 : Math.min(neg, ax) - 8;
        if (on.length) b += S.text(wx, y + 25, word, 'sm b ' + (sum >= 1.5 ? 'up' : sum <= -1.5 ? 'dn' : 'mut'), sum >= 0 ? 'start' : 'end');
      });
      // legend of numbered drivers
      const ly = yb + 20;
      let lx = x0, row = 0; const lgap = 14;
      on.forEach((d) => {
        const t = (DRV.indexOf(d) + 1) + ' ' + d.label, w = t.length * 6.3 + lgap;
        if (lx + w > x1) { lx = x0; row++; }
        b += S.text(lx, ly + row * 16, t, 'xs mut'); lx += w;
      });
      const H = ly + row * 16 + 10;
      fig.innerHTML = S.wrap(W, H, 'Typical direction each selected driver pushes gold, silver and copper.', b);
      setT(id + '-g', usd0(DATA.gold) + '/oz', ''); setT(id + '-s', usd(DATA.silver) + '/oz', ''); setT(id + '-c', usd(DATA.copper) + '/lb', '');
      note.innerHTML = `Prices are about ${DATA.asOf} levels and change every day. Bars show the usual direction of each driver, based on how these metals have tended to react, not a forecast. Gold is mostly a money and fear asset, copper mostly an industrial one, and silver sits in between.`;
      const g = sums.g || 0, s = sums.s || 0, c = sums.c || 0;
      let m;
      if (!on.length) m = ['', 'Pick a driver', 'Each metal answers to different things. Turn on a driver to see who it lifts and who it sinks.'];
      else if (g > 2 && c < -1) m = ['acc', 'Fear trade', 'Gold up, copper down: the classic worried-market split. Investors seek safety while factories expect less demand. Silver gets pulled both ways.'];
      else if (c > 2 && g < 2) m = ['up', 'Growth trade', 'Copper leads when factories are busy. Gold has less reason to rally when growth and yields are both rising.'];
      else if (g > 2 && s > 2 && c > 0) m = ['up', 'Everything metal', 'A weaker dollar and falling real yields lift all three, since they are priced in dollars and pay no interest.'];
      else m = ['', 'Mixed signals', 'The drivers you picked pull the metals in different directions. Real markets usually have several forces at once.'];
      setMsg(id + '-msg', m[0], m[1], m[2]);
    }
    function drawRatio(W, compact) {
      const gp = st.n(id + '-gp'), sp = st.n(id + '-sp'), r = gp / sp;
      const x0 = 16, x1 = W - 16;
      let b = S.text(x0, 18, `One ounce of gold buys ${F.num(r, 1)} ounces of silver`, 'md ink b');
      // coins
      const per = r > 60 ? 10 : 5, n = Math.min(14, Math.round(r / per)), cr = compact ? 9 : 12;
      const cy = 58;
      b += S.circle(x0 + 26, cy, cr * 1.9, 'f-acc') + S.text(x0 + 26, cy + 4, '1 oz', 'sm b onacc', 'middle');
      b += S.text(x0 + 26 + cr * 2.6, cy + 5, '=', 'xl ink b', 'middle');
      const cx0 = x0 + 26 + cr * 4.2, step = Math.min(cr * 2.4, (x1 - cx0 - 40) / Math.max(n, 1));
      for (let i = 0; i < n; i++) b += S.circle(cx0 + i * step, cy, cr, 'f-shade2 s-ink w15');
      b += S.text(cx0 - cr, cy + cr + 18, `each small coin = ${per} oz of silver`, 'xs mut');
      // scale
      const sx = SML.lin(20, 130, x0 + 8, x1 - 8), sy = 150;
      b += S.text(x0, sy - 26, 'Where the ratio sits on its range', 'sm ink b');
      b += S.rect(sx(20), sy - 6, sx(130) - sx(20), 12, 'f-shade', 6);
      b += S.rect(sx(DATA.ratioLow), sy - 6, sx(DATA.ratioHigh) - sx(DATA.ratioLow), 12, 'f-acc-t', 6);
      [20, 40, 60, 80, 100, 120].forEach((v) => { b += S.text(sx(v), sy + 24, String(v), 'xs mono', 'middle'); });
      b += S.text(sx(DATA.ratioLow), sy - 12, compact ? 'low ' + DATA.ratioLow : 'low ' + DATA.ratioLow + ' (Jan 2026)', 'xs acc', 'middle') + S.text(sx(DATA.ratioHigh), sy - 12, compact ? 'high ' + DATA.ratioHigh : 'record ' + DATA.ratioHigh + ' (Mar 2020)', 'xs acc', compact ? 'middle' : 'end');
      const rc = SML.clamp(r, 20, 130);
      b += S.line(sx(rc), sy - 16, sx(rc), sy + 12, 's-ink w2') + S.circle(sx(rc), sy, 7, 'f-ink');
      b += S.text(sx(rc), sy + 40, 'now ' + F.num(r, 0), 'sm ink b', 'middle');
      b += S.text(sx(30), sy + 58, compact ? '← silver pricey' : '← silver expensive vs gold', 'xs mut', 'start') + S.text(sx(126), sy + 58, compact ? 'silver cheap →' : 'silver cheap vs gold →', 'xs mut', 'end');
      const H = sy + 66;
      fig.innerHTML = S.wrap(W, H, `Gold at ${usd0(gp)} and silver at ${usd(sp)}: a gold-silver ratio of ${F.num(r, 1)}.`, b);
      setT(id + '-r', F.num(r, 1)); setT(id + '-oz', F.num(r, 1) + ' oz silver'); setT(id + '-rg', DATA.ratioHigh + ' / ' + DATA.ratioLow);
      note.innerHTML = `Band shown: from the January 2026 low (about ${DATA.ratioLow}) to the March 2020 record (about ${DATA.ratioHigh}). Gold about ${usd0(DATA.gold)} and silver about ${usd0(DATA.silver)} in ${DATA.asOf} (ratio about ${DATA.ratioNow}). Drag the sliders to try prices. A high ratio has often come before silver catching up, but it can stay stretched for years.`;
      let m;
      if (r >= 85) m = ['acc', 'Silver looks cheap', `At ${F.num(r, 0)}, silver is near the cheap end of its range against gold. Some investors tilt toward silver here, knowing it is far more volatile and can stay cheap for years.`];
      else if (r <= 50) m = ['info', 'Silver looks rich', `At ${F.num(r, 0)}, silver is expensive against gold, which has tended to happen near the end of big silver rallies.`];
      else m = ['', 'Middle of the range', `At ${F.num(r, 0)}, neither metal looks stretched against the other. The ratio is a comparison, not a timing signal.`];
      setMsg(id + '-msg', m[0], m[1], m[2]);
    }
    function drawOwn(W, compact) {
      const amt = st.n(id + '-amt'), gain = st.n(id + '-gain') / 100, yrs = st.n(id + '-yrs'), br = Number(st.seg(id + '-br') || 24) / 100;
      const ltcg = br <= 0.12 ? 0 : br >= 0.35 ? 0.2 : 0.15, coll = Math.min(br, 0.28), niit = br >= 0.32 ? 0.038 : 0;
      const fee = (er) => Math.pow(1 - er / 100, yrs);
      const rows = [
        ['Gold ETF (IAU)', amt * (1 + gain) * fee(DATA.er.IAU), coll, 'collectibles rate', 'f-acc'],
        ['Gold ETF (GLD)', amt * (1 + gain) * fee(DATA.er.GLD), coll, 'collectibles rate', 'f-acc'],
        ['Coins and bars', amt * (1 + gain) * 0.94, coll, 'collectibles, 6% spread', 'f-acc o70'],
        ['Gold miners fund', amt * (1 + gain) * fee(DATA.er.GDX), ltcg, 'stock rates', 'f-info'],
        ['Stock index fund', amt * (1 + gain) * fee(0.03), ltcg, 'stock rates', 'f-up'],
      ].map(([lab, val, rate, why, cls]) => { const g = Math.max(0, val - amt); const tax = g * (rate + niit); return { lab, val, tax, net: val - tax, rate: rate + niit, why, cls }; });
      const x0 = 16, x1 = W - 16, lw = compact ? 112 : 200, bx = x0 + lw, bwmax = x1 - bx - (compact ? 62 : 90);
      const mx = Math.max(...rows.map((r) => r.val));
      let b = S.text(x0, 18, `${usd0(amt)} that rises ${F.num(gain * 100, 0)}%, sold after ${yrs} years`, 'sm ink b');
      rows.forEach((r, i) => {
        const y = 34 + i * 40, wNet = (r.net / mx) * bwmax, wTax = (r.tax / mx) * bwmax;
        b += S.text(x0, y + 15, r.lab, 'sm ink');
        b += S.text(x0, y + 29, (compact ? 'tax ' : 'taxed ') + F.num(r.rate * 100, 1) + '%' + (compact ? '' : ' · ' + r.why), 'xs mut');
        b += S.rect(bx, y + 4, Math.max(1, wNet), 22, r.cls, 2);
        if (wTax > 0.5) b += S.rect(bx + wNet, y + 4, wTax, 22, 'f-dn o70', 2);
        b += S.text(bx + wNet + wTax + 6, y + 20, usd0(r.net), 'sm mono b ink');
      });
      const H = 34 + rows.length * 40 + 18;
      b += S.rect(bx, H - 14, 10, 8, 'f-dn o70') + S.text(bx + 14, H - 7, 'tax on the gain', 'xs mut');
      fig.innerHTML = S.wrap(W, H, 'After-tax value of gold held through ETFs, coins, miners and a stock index fund.', b);
      const g1 = rows[0], s1 = rows[4];
      setT(id + '-a1', usd0(g1.net)); setT(id + '-a2', usd0(s1.net)); setT(id + '-tr', F.num(g1.rate * 100, 1) + '%', g1.rate > s1.rate ? 'dn' : '');
      note.innerHTML = `Same price gain for every row so you can compare costs and tax only. Expense ratios: IAU ${DATA.er.IAU}%, GLD ${DATA.er.GLD}%, GDX ${DATA.er.GDX}% (see sources). Coins assume about 6% lost to dealer buy-sell spreads, an assumption that varies widely. Long-term gains only (held over a year). The 3.8% net investment income tax is added from the 32% bracket as a rough proxy for high income.`;
      const diff = s1.net - g1.net;
      setMsg(id + '-msg', diff > 1 ? 'acc' : '', 'Tax quirk', diff > 1
        ? `Physical-gold ETFs count as collectibles: long-term gains are taxed at your income rate up to 28%, not the ${F.num(ltcg * 100, 0)}% stock rate. On this gain that costs about ${usd0(diff)} more than a stock fund. Holding gold inside an IRA avoids the problem.`
        : 'In the 12% bracket collectibles and stock gains end up taxed about the same, so the gap is small. Higher brackets pay more on gold ETFs.');
    }
  };

  /* ===================================================================== */
  /* 3. copperGauge: when copper's price is a growth signal and when not      */
  /* ===================================================================== */
  const CU = {
    china: { label: 'China builds', type: 'demand', cu: 0.25, pmi: 4, lead: 2, txt: 'Demand-driven: copper rises a couple of months before factory surveys improve. This is the move people mean by Dr. Copper.' },
    slow: { label: 'Global slowdown', type: 'demand', cu: -0.25, pmi: -5, lead: 2, txt: 'Demand-driven: copper falls as orders dry up, often before stock markets notice. A useful warning.' },
    strike: { label: 'Mine strike', type: 'supply', cu: 0.2, pmi: 0, lead: 0, txt: 'Supply-driven: less copper for the same demand. The price jumps, but it says nothing about the economy. Treat it as noise.' },
    tariff: { label: 'Tariff shock', type: 'policy', cu: 0.25, pmi: -1, lead: 0, txt: 'Policy-driven: importers rush to buy before a tariff, then prices snap back. When a 2025 US tariff left out refined copper, US copper futures fell 22% in a day, their steepest one-day drop on record.' },
    grid: { label: 'Grid and EV boom', type: 'demand', cu: 0.3, pmi: 1.5, lead: 0, txt: 'A slow, long-term demand trend: power grids, data centers and electric cars use a lot of copper. Prices can rise even when factory surveys are flat.' },
  };
  SML.widgets.copperGauge = function (root, opts) {
    opts = opts || {};
    root.classList.add('xm');
    const id = SML.uid('cg');
    const c0 = CU[opts.scenario] ? opts.scenario : 'china';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">What is moving copper?</span>${ui.seg(id + '-s', Object.keys(CU).map((k) => ({ v: k, label: CU[k].label })), c0, 'Scenario')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-m', label: 'Size of the copper move', min: 5, max: 40, step: 1, value: 25, fmt: 'pct' })}</div>
      <div class="wg-read">${ui.stat('Copper over 18 months', id + '-cu')}${ui.stat('Factory survey (PMI)', id + '-pmi')}${ui.stat('Is it a growth signal?', id + '-sig', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">A teaching model with made-up paths, not real data. The PMI is a monthly survey of purchasing managers: above 50 means factories are growing. Copper's link to the economy only holds when demand, not supply or policy, is moving the price.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const sc = CU[st.seg(id + '-s') || 'china'], mag = st.n(id + '-m') / 100, k = mag / Math.abs(sc.cu || 0.25);
      const N = 18, start = 3;
      const cu = [], pm = [];
      for (let t = 0; t <= N; t++) {
        let c;
        if (sc.type === 'policy') { const up = ease((t - start) / 3), down = ease((t - start - 4) / 2); c = 100 * (1 + Math.sign(sc.cu) * mag * (up - 0.9 * down)); }
        else if (sc.type === 'supply') { const up = ease((t - start) / 2), fade = ease((t - start - 7) / 8); c = 100 * (1 + Math.sign(sc.cu) * mag * (up - 0.6 * fade)); }
        else if (sc.label.indexOf('Grid') === 0) c = 100 * (1 + Math.sign(sc.cu) * mag * (t / N));
        else c = 100 * (1 + Math.sign(sc.cu) * mag * ease((t - start) / 8));
        cu.push(c);
        const lag = sc.lead, base = 50 + sc.pmi * k * ease((t - start - lag) / 8);
        pm.push(sc.type === 'policy' ? 50 + sc.pmi * k * ease((t - start) / 4) * (1 - ease((t - start - 6) / 6)) : base);
      }
      const pl = compact ? 40 : 48, pr = compact ? 40 : 52, top = 30, ch = compact ? 180 : 200;
      const x = SML.lin(0, N, pl, W - pr);
      const cmin = Math.min(...cu, 95) - 3, cmax = Math.max(...cu, 105) + 3, yc = SML.lin(cmin, cmax, top + ch, top);
      const pmin = Math.min(...pm, 46) - 1, pmax = Math.max(...pm, 54) + 1, yp = SML.lin(pmin, pmax, top + ch, top);
      let b = S.text(pl, 16, 'Copper price (amber, left) and factory PMI (blue, right)', compact ? 'xs ink b' : 'sm ink b');
      SML.ticks(cmin, cmax, 4).forEach((v) => { b += S.line(pl, yc(v), W - pr, yc(v), 's-grid') + S.text(pl - 6, yc(v) + 4, F.num(v, 0), 'xs mono acc', 'end'); });
      SML.ticks(pmin, pmax, 4).forEach((v) => { b += S.text(W - pr + 6, yp(v) + 4, F.num(v, 0), 'xs mono info'); });
      if (yp(50) > top && yp(50) < top + ch) b += S.line(pl, yp(50), W - pr, yp(50), 's-info dash2') + S.text(W - pr - 4, yp(50) - 5, 'PMI 50', 'xs info', 'end');
      // noise band for supply/policy
      if (sc.type !== 'demand') b += S.rect(x(start), top, x(Math.min(N, start + 9)) - x(start), ch, 'f-dn-t', 0, ' opacity=".55"') + S.text(x(start) + 6, top + 14, 'not about growth', 'xs dn b');
      [0, 6, 12, 18].forEach((t) => { b += S.text(x(t), top + ch + 16, t === 0 ? 'month 0' : '+' + t, 'xs mono', 'middle'); });
      b += S.poly(pm.map((v, t) => [x(t), yp(v)]), 's-info w25');
      b += S.poly(cu.map((v, t) => [x(t), yc(v)]), 's-acc w3');
      if (sc.type === 'demand' && sc.lead) {
        const half = (arr, base) => { const tgt = base + (arr[N] - base) / 2; for (let t = 1; t <= N; t++) { if ((arr[t] - tgt) * (arr[t - 1] - tgt) <= 0) return t - 1 + (tgt - arr[t - 1]) / ((arr[t] - arr[t - 1]) || 1); } return start; };
        const tc = half(cu, 100), tp = half(pm, 50), yb = sc.cu > 0 ? top + ch - 18 : top + 18;
        b += S.line(x(tc), top + 4, x(tc), top + ch, 's-acc dash2') + S.line(x(tp), top + 4, x(tp), top + ch, 's-info dash2');
        b += S.line(x(tc), yb, x(tp), yb, 's-ink w15') + S.polygon([[x(tp), yb], [x(tp) - 6, yb - 4], [x(tp) - 6, yb + 4]], 'f-ink');
        b += S.text(x(tp) + 8, yb + 4, `copper moves ~${sc.lead} months first`, 'xs ink b');
      }
      // demand donut
      const H0 = top + ch + 30;
      const dy = H0 + 18, r = compact ? 34 : 40, dx = pl + r + 4;
      const parts = [['Construction', 25, 'f-acc'], ['Power grid and electrical', 25, 'f-info'], ['Machinery, transport, appliances and more', 50, 'f-shade2']];
      let a0 = -Math.PI / 2;
      parts.forEach(([lab, p, cls]) => {
        const a1 = a0 + (p / 100) * Math.PI * 2, large = p > 50 ? 1 : 0, cyy = dy + r;
        b += S.path(`M${dx},${cyy} L${(dx + r * Math.cos(a0)).toFixed(1)},${(cyy + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 ${large} 1 ${(dx + r * Math.cos(a1)).toFixed(1)},${(cyy + r * Math.sin(a1)).toFixed(1)} Z`, cls + ' s-surf w2');
        a0 = a1;
      });
      b += S.circle(dx, dy + r, r * 0.5, 'f-surf');
      const lx = dx + r + 18;
      const shortLab = ['Construction', 'Grid & electrical', 'Everything else'];
      b += S.text(lx, dy + 6, compact ? 'Where copper goes' : 'Where copper goes (world, rough shares)', 'sm ink b');
      parts.forEach(([lab, p, cls], i) => { b += S.rect(lx, dy + 16 + i * 18, 10, 10, cls) + S.text(lx + 16, dy + 25 + i * 18, (compact ? shortLab[i] : lab) + ' · about ' + p + '%', 'xs'); });
      b += S.text(lx, dy + 16 + 3 * 18 + 8, compact ? 'China: about half of all use' : 'China uses about half of the world’s copper', 'xs acc b');
      const H = dy + 2 * r + 12;
      fig.innerHTML = S.wrap(W, H, `${sc.label}: copper ${F.spct((cu[N] / 100 - 1) * 100, 0)} over 18 months while the PMI ends at ${F.num(pm[N], 1)}.`, b);
      const cuCh = (Math.max(...cu.map((v) => Math.abs(v - 100))) * Math.sign(sc.cu));
      setT(id + '-cu', F.spct(sc.type === 'demand' ? (cu[N] / 100 - 1) * 100 : cuCh, 0) + (sc.type === 'demand' ? '' : ' at peak'), sc.cu > 0 ? 'up' : 'dn');
      setT(id + '-pmi', F.num(pm[N], 1), pm[N] >= 50.5 ? 'up' : pm[N] <= 49.5 ? 'dn' : '');
      const sig = sc.type === 'demand' ? (sc.lead ? 'Yes, early' : 'Slow trend') : sc.type === 'supply' ? 'No: supply' : 'No: policy';
      setT(id + '-sig', sig, sc.type === 'demand' ? 'up' : 'dn');
      setMsg(id + '-msg', sc.type === 'demand' ? 'up' : 'dn', sc.label, sc.txt);
    });
  };

  /* ===================================================================== */
  /* Lessons                                                               */
  /* ===================================================================== */
  const pct0 = (v) => F.num(v, 0) + '%';
  /* worked-example math reused from the widgets so text and widgets agree */
  const exOil = (() => {
    const p0 = DATA.wti, p1 = DATA.wti + 25, dG = 25 / 42, g1 = DATA.gas + dG, gp = dG / DATA.gas;
    return { p0, p1, dG, g1, gp, cpi: DATA.gasWeightNow * gp, bill: 600 * dG };
  })();
  const exGold = (() => {
    const amt = 10000, gain = 0.6, yrs = 5, fee = (er) => Math.pow(1 - er / 100, yrs);
    const iauV = amt * (1 + gain) * fee(DATA.er.IAU), stkV = amt * (1 + gain) * fee(0.03);
    const iauTax = (iauV - amt) * 0.24, stkTax = (stkV - amt) * 0.15;
    return { iauV, stkV, iauTax, stkTax, iauNet: iauV - iauTax, stkNet: stkV - stkTax };
  })();

  SML.lessons.push({
    id: 'l-oil', course: 'commod', order: 1, title: 'Oil: prices, OPEC+ and the economy', mins: 10, level: 'Intermediate',
    summary: 'Why oil swings, how it reaches your gas tank and inflation, and who wins or loses.',
    idea: 'Oil is a cost inside almost everything. Why it moves, supply or demand, matters as much as how far it moves.',
    widget: 'oilShock',
    try: 'Pick why oil moved, then drag the price. Watch gas, inflation, the Fed and each sector react.',
    body: [
      `<h3>Two prices, one barrel</h3><p>Oil is priced per <b>barrel</b>, which holds 42 gallons. The US benchmark is <b>WTI</b> (West Texas Intermediate); the global one is <b>Brent</b>, from the North Sea. They usually sit a few dollars apart. On October 21, 2026, WTI futures were about ${usd0(DATA.wti)} and Brent futures about ${usd0(DATA.brent)}. Both trade as <b>futures contracts</b>, agreements to buy or sell oil on a future date, so the price on the news is usually the nearest futures contract. Physical oil for immediate delivery can trade at a different price: the EIA's Brent spot price was ${usd(DATA.brentSpot)} on October 14, 2026, far above futures, a sign of very tight near-term supply.</p>`,
      `<h3>Who controls supply and demand</h3><ul><li><b>OPEC+</b>: OPEC members plus allies such as Russia agree on how much to pump. Their meetings move prices (see the <a href="#calendar">calendar</a>). The United Arab Emirates left OPEC and OPEC+ effective May 1, 2026.</li><li><b>US shale producers</b>: they add or cut drilling as prices rise or fall. ${DATA.usProd}</li><li><b>The Strategic Petroleum Reserve</b>: the government's emergency stockpile, released in a crisis. After large releases it held about 283 million barrels in mid-October 2026, reportedly the lowest since 1982.</li><li><b>Demand</b>: global growth, China, the summer driving season and air travel.</li></ul><p>Every Wednesday at 10:30 am ET the Energy Information Administration (EIA) reports US crude and gasoline inventories. A surprise build or draw can move oil a few percent in minutes.</p>`,
      `<h3>From the barrel to your tank to inflation</h3><p>Crude was about 51% of the price of a gallon of regular gas in 2025; refining, distribution and taxes make up the rest (EIA). Because a barrel is 42 gallons, each $1 on a barrel adds roughly 2.4 cents a gallon once it passes through, usually within a few weeks. Gasoline was about 3% of the CPI basket at end-2025 weights (BLS), and its share rises when gas gets more expensive, so a 10% jump at the pump adds roughly 0.3 to 0.4 percentage points to headline inflation by itself. In September 2026, energy prices were up 20.4% from a year earlier and gasoline 34.2%, while regular gas averaged about ${usd(DATA.gas)} a gallon on October 21 (AAA). Core inflation leaves energy out, but expensive fuel leaks into airfares, shipping and plastics over the following months (see <a href="#l-inflation">Inflation</a>).</p>`,
      `<h3>Supply shock or demand shock?</h3><ul><li><b>Supply shock up</b> (war, OPEC+ cut): higher prices with the same or weaker economy. Consumers pay more, airlines and shops suffer, energy producers profit. Headline inflation rises while growth slows.</li><li><b>Demand shock down</b> (recession): oil falls because the world needs less. Cheap gas does not rescue the economy; energy stocks drop most and the broad market usually falls too.</li><li><b>Demand boom</b>: oil rises because the economy is strong. Energy and most cyclical stocks can rise together.</li><li><b>Supply glut</b>: too much oil; gas gets cheaper and inflation cools while energy stocks lag.</li></ul>`,
      `<h3>The Fed's dilemma</h3><p>A supply shock pushes inflation up and growth down at the same time, the recipe for <b>stagflation</b>. Raising rates fights the inflation but deepens the slowdown; cutting does the reverse. Central banks watch core inflation partly so they can see through short energy swings, but a long oil shock that feeds into wages and prices gets their attention. With energy prices surging, the Fed raised rates on September 16, 2026 instead of cutting (see <a href="#l-fed">How the Fed works</a>).</p>`,
      `<h3>Big oil moves in history</h3><ul>${DATA.oilHistory.map((h) => `<li>${h}</li>`).join('')}</ul><p>A Goldman Sachs look at the 1973, 1979, 1990 and 2022 shocks found oil rose a median 169% and the S&P 500 fell a median 23% from peak to trough. Shocks that feed inflation and change the Fed's path do far more damage than brief scares (see <a href="#l-geopolitics">Tension, war, sanctions and tariffs</a>).</p>`,
      `<h3>Owning oil: why funds can trail the price</h3><p>Most oil funds hold futures, not barrels. When later months cost more than the current month (<b>contango</b>), the fund keeps selling the expiring contract and buying a pricier one, losing a little each roll. When later months are cheaper (<b>backwardation</b>), rolling adds return. Energy company stocks are another route; their profits follow oil but also costs, debt and management choices. Try the curve below.</p>`,
    ],
    extra: [{ widget: 'oilCurve', try: 'Pick a curve shape and slide how steep it is. See what a fund that rolls futures earns while oil stays flat.' }],
    example: {
      title: 'A $25 oil spike and your budget',
      intro: `A conflict cuts supply and WTI jumps from ${usd0(exOil.p0)} to ${usd0(exOil.p1)} a barrel. You buy about 600 gallons of gas a year.`,
      steps: [
        `Pass-through to the pump: $25 ÷ 42 gallons ≈ ${usd(exOil.dG, 3)} a gallon (about ${F.num(exOil.dG * 100, 0)} cents), so regular gas rises from about ${usd(DATA.gas)} to about ${usd(exOil.g1)}, a ${pct0(exOil.gp * 100)} jump.`,
        `Your fuel bill: 600 gallons × ${usd(exOil.dG, 3)} ≈ ${usd0(exOil.bill)} more a year, money that no longer goes to restaurants or shops.`,
        `Inflation: at today's prices gasoline is roughly ${DATA.gasWeightNow}% of the CPI basket (2.9% at December 2025 prices), so ${pct0(exOil.gp * 100)} × ${DATA.gasWeightNow}% ≈ ${F.num(exOil.cpi, 2)} percentage points added to headline inflation, before airfares and shipping catch up.`,
        `Sectors: oil producers' revenue rises with every barrel, while airlines (fuel is one of their biggest costs) and delivery companies see margins squeezed.`,
        `The Fed: headline inflation rises while consumers slow down. Central banks often look through a one-time energy jump as long as core inflation stays calm; if it spreads into other prices, they may raise rates instead.`,
      ],
      result: `About ${usd0(exOil.bill)} a year out of your pocket and about ${F.num(exOil.cpi, 2)} points on headline inflation from one $25 move.`,
    },
    mistakes: [
      'Treating every oil drop as good news. If oil falls because a recession is coming, stocks usually fall with it.',
      'Buying an oil fund and expecting it to match the oil price. Futures rolls in contango can leave it far behind over a year.',
      'Chasing energy stocks after a war headline. Spikes driven by fear often fade as supply finds new routes and buyers cut back.',
      'Forgetting the lags: gas follows crude within weeks, and the CPI shows it the next month.',
    ],
    points: [
      'A barrel holds 42 gallons: each $1 on a barrel is about 2.4 cents a gallon at the pump.',
      'Gasoline is roughly 3% to 4% of the CPI, so pump prices move headline inflation quickly.',
      'Ask why oil moved: supply shocks hurt consumers and help producers; demand slumps hurt almost everyone.',
      'Supply shocks put the Fed in a bind between inflation and growth.',
      'Oil funds that hold futures can lag spot in contango and beat it in backwardation.',
    ],
    terms: ['WTI', 'Brent', 'OPEC+', 'Strategic Petroleum Reserve', 'Futures contract', 'Contango', 'Backwardation', 'Stagflation'],
    glossary: [
      { t: 'Barrel', d: 'The standard unit for crude oil: 42 US gallons.' },
      { t: 'Crack spread', d: 'The gap between the price of crude and the fuels refined from it. It is roughly a refiner’s profit margin.' },
    ],
    quiz: { q: 'Oil falls 30% because a recession is starting. What usually happens to the broad stock market?', options: ['It rises, because gas is cheaper', 'It usually falls, because earnings are expected to drop', 'Nothing, oil and stocks are unrelated'], answer: 1, why: 'A demand-driven drop signals weaker spending and profits; cheap gas does not offset that.' },
    sources: [
      { t: 'EIA: Factors affecting gasoline prices', u: 'https://www.eia.gov/energyexplained/gasoline/factors-affecting-gasoline-prices.php' },
      { t: 'BLS: CPI relative importance of components, December 2025', u: 'https://www.bls.gov/cpi/tables/relative-importance/2025.htm' },
          ].concat(DATA.oilSrc),
  });

  SML.lessons.push({
    id: 'l-gold-silver', course: 'commod', order: 2, title: 'Gold and silver', mins: 10, level: 'Intermediate',
    summary: 'What moves gold and silver, the gold-silver ratio, how to own them and the tax quirk.',
    idea: 'Gold is money that pays no interest; it shines when real yields fall, the dollar weakens or fear rises. Silver adds a factory job on top.',
    widget: 'metalsLab',
    try: 'Switch on drivers to see which metal they lift, try prices on the gold-silver ratio, then compare ways to own gold after tax.',
    body: [
      `<h3>Why gold has a price at all</h3><p>Gold pays no interest or dividend. People hold it because it is scarce, lasts forever, is owned by central banks and has been treated as money for thousands of years. Its main drivers:</p><ul><li><b>Real yields</b>: when bonds pay less after inflation, the cost of holding a metal that pays nothing falls, and gold tends to rise (see <a href="#l-rates">Rates and yields</a>).</li><li><b>The dollar</b>: gold is priced in dollars, so a weaker dollar usually lifts it (see <a href="#l-dollar">The dollar</a>).</li><li><b>Fear</b>: wars, bank failures and crashes send buyers to <b>safe havens</b>.</li><li><b>Central banks</b>: ${DATA.cbBuying}</li></ul>`,
      `<h3>Where prices are</h3><p>${DATA.levelsText}</p>`,
      `<h3>Silver: part money, part factory metal</h3><p>Silver follows gold on money and fear, but much of it is used in industry, including electronics and solar panels. That makes it swing harder than gold in both directions and gives it a link to factory demand. ${DATA.silverNote}</p>`,
      `<h3>The gold-silver ratio</h3><p>Divide the gold price by the silver price to see how many ounces of silver one ounce of gold buys. ${DATA.ratioText} A high ratio means silver is cheap relative to gold; some investors tilt toward silver then. It is a comparison, not a timing tool, and it can stay stretched for years.</p>`,
      `<h3>Ways to own gold and silver</h3><ul><li><b>Coins and bars</b>: you own the metal, but dealers charge a premium to buy and pay less when you sell, and you need safe storage and insurance.</li><li><b>Physically backed ETFs</b>: funds that hold bullion in vaults, bought like a stock. Yearly fees: IAU ${DATA.er.IAU}%, GLD ${DATA.er.GLD}%, SLV ${DATA.er.SLV}% (see sources).</li><li><b>Futures</b>: leverage and contract rolls; for experienced traders only.</li><li><b>Mining stocks</b> (such as the GDX fund, ${DATA.er.GDX}% fee): companies whose profits rise faster than gold when prices climb, and fall faster when they drop, with company risk on top.</li></ul>`,
      `<h3>The tax quirk</h3><p>The IRS treats physical gold and silver as <b>collectibles</b>. Sell coins, bars or a physically backed ETF after more than a year and the gain is taxed at your ordinary rate, capped at 28%, instead of the 0/15/20% rates for stocks (see <a href="#l-cap-gains">Capital gains</a>). Held a year or less, it is ordinary income like any short-term gain. Mining-stock funds are taxed like stocks. Futures-based funds set up as partnerships (commodity pools that send you a K-1) pass through the 60/40 treatment of Section 1256 contracts, but many futures ETFs set up as regular funds pay ordinary distributions on a 1099; check the tax section of the fund's prospectus. Holding a gold ETF inside an IRA sidesteps the collectibles rate.</p>`,
      `<h3>How much gold?</h3><p>Gold can rise when stocks fall, which is why some investors keep a small slice as a diversifier. It has also gone through long stretches of falling or flat prices, and it produces no income. Size it as insurance, not as the core of a plan (see <a href="#l-allocation">Stocks, bonds and your age</a>).</p>`,
    ],
    example: {
      title: 'Gold ETF vs a stock fund, after tax',
      intro: 'You invest $10,000 in a physical gold ETF (IAU) or in a stock index fund. Both rise 60% over 5 years. You are in the 24% bracket.',
      steps: [
        `Fees: IAU charges ${DATA.er.IAU}% a year, so $16,000 shrinks to about ${usd0(exGold.iauV)}. A 0.03% index fund ends at about ${usd0(exGold.stkV)}.`,
        `Gold ETF tax: the gain of about ${usd0(exGold.iauV - 10000)} is a collectible gain, taxed at your 24% bracket (capped at 28%): about ${usd0(exGold.iauTax)}.`,
        `Stock fund tax: the gain of about ${usd0(exGold.stkV - 10000)} is a normal long-term gain at 15%: about ${usd0(exGold.stkTax)}.`,
        `After tax you keep about ${usd0(exGold.iauNet)} from gold and ${usd0(exGold.stkNet)} from stocks.`,
        `In an IRA neither would be taxed on the sale, so the collectibles penalty disappears there.`,
      ],
      result: `Same price gain, but about ${usd0(exGold.stkNet - exGold.iauNet)} less in your pocket from the gold ETF in a taxable account.`,
    },
    mistakes: [
      'Buying coins at a large dealer markup and forgetting the lower price you will get when you sell.',
      'Assuming gold always rises with inflation or in a crisis. It has had long flat and falling stretches.',
      'Forgetting the 28% collectibles rate when holding gold or silver ETFs in a taxable account.',
      'Treating mining stocks as if they were the metal. They can fall harder and carry company risk.',
    ],
    points: [
      'Gold tends to rise when real yields fall, the dollar weakens, fear spikes or central banks buy.',
      'Silver follows gold but swings harder because industry uses so much of it.',
      'The gold-silver ratio compares the two; it is not a timing signal.',
      'Physically backed metal ETFs are taxed as collectibles: ordinary rates up to 28% on long-term gains.',
      'Gold pays no income; keep it as a small diversifier, not the core.',
    ],
    terms: ['Safe haven', 'Real yield', 'Gold-silver ratio', 'US Dollar Index', 'ETF', 'Expense ratio', 'Long-term gain', 'Futures contract'],
    glossary: [
      { t: 'Bullion', d: 'Gold or silver in bars or coins valued for their metal content.' },
      { t: 'Collectibles rate', d: 'The tax rate on long-term gains from collectibles such as gold: your ordinary rate, capped at 28%.' },
    ],
    quiz: { q: 'You hold a physically backed gold ETF for three years in the 24% bracket and sell at a gain. What federal rate applies?', options: ['15%, like stocks', '24%, the collectibles rule (capped at 28%)', '0%, because it is gold'], answer: 1, why: 'Physical gold counts as a collectible: long-term gains are taxed at ordinary rates up to 28%.' },
    sources: [
      { t: 'etf.com: Navigating the tax minefield of gold ETFs', u: 'https://www.etf.com/sections/etf-basics/gold-etf-tax-capital-gains' },
      { t: 'VanEck: GDX fund page', u: 'https://www.vaneck.com/gdx' },
    ].concat(DATA.metalSrc),
  });

  SML.lessons.push({
    id: 'l-copper', course: 'commod', order: 3, title: 'Copper and industrial metals', mins: 8, level: 'Intermediate',
    summary: 'Why copper is read as a sign of growth, when that signal works and when it lies.',
    idea: 'Copper goes into buildings, grids and machines, so demand-driven moves often show where the economy is heading before the data does.',
    widget: 'copperGauge',
    try: 'Switch between demand, supply and policy moves. Watch when copper and factory surveys move together and when they do not.',
    body: [
      `<h3>Why copper is called Dr. Copper</h3><p>Copper carries electricity and heat, so it goes into wiring, plumbing, motors, power lines and electronics. When factories and builders get busier, they buy more copper, often before official reports show the pickup. That is why traders say copper has a "PhD in economics."</p>`,
      `<h3>Where copper goes</h3><p>Construction and electrical infrastructure each take roughly a quarter of world copper use; machinery, transport and consumer goods take most of the rest. China uses about half of all copper, so Chinese building and factory activity moves the price more than any other country. ${DATA.copperLevel}</p>`,
      `<h3>Supply is slow</h3><p>Most copper comes from a small number of very large mines. A new mine can take many years to plan and build, so supply cannot jump quickly when demand rises. Strikes, floods and political changes at a single big mine can move the world price.</p>`,
      `<h3>When the signal fails</h3><p>Copper is only a growth signal when <b>demand</b> moves it. Supply problems and policy can move the price with no change in the economy:</p><ul><li><b>Mine disruptions</b> push prices up even as the economy slows.</li><li><b>Tariffs</b>: a July 30, 2025 proclamation put a 50% tariff on the copper in semi-finished products such as pipes and wire, and in copper-heavy parts, from August 1. Refined copper cathodes were left out. US copper futures had climbed far above London prices as importers rushed to buy ahead of the tariff, then fell 22% in a day, their steepest one-day drop on record. A tariff on refined copper was floated for 2027 but had not been decided as of mid-October 2026.</li><li><b>Long-term trends</b> such as power grids, data centers and electric cars can lift demand even when factory surveys are flat.</li></ul><p>Check the PMI and other data before reading copper as a forecast (see <a href="#l-pmi">PMI, GDP and retail sales</a>).</p>`,
      `<h3>Other industrial metals</h3><p>Aluminum (cans, cars, planes), nickel and lithium (batteries) and iron ore (steel) follow the same logic: demand from building and manufacturing, supply from a handful of producing countries, and big swings when either changes.</p>`,
      `<h3>Owning copper</h3><p>Most people get exposure through mining stocks or futures-based funds. Miners add company risk and debt; futures funds face the contract rolls explained in <a href="#l-oil">Oil</a>. Copper is volatile and cyclical: it tends to fall hard in recessions (see <a href="#l-cycle">The business cycle</a>).</p>`,
    ],
    example: {
      title: 'Two copper rallies, two meanings',
      intro: 'Made-up example. Over three months copper rises 15% twice in different years.',
      steps: [
        'Rally A: Chinese builders and power-grid projects order more. Over the next two months the factory PMI climbs from 48 to 51, above the 50 line between shrinking and growing.',
        'Reading A: demand moved copper first and the data followed. Cyclical stocks such as industrials and materials often do well in this phase.',
        'Rally B: a strike shuts one of the world’s largest mines. Copper jumps 15%, but the PMI stays at 48 and new orders keep falling.',
        'Reading B: supply moved the price, not demand. The economy is still soft, and the rally fades once the mine restarts.',
        'The check: before treating copper as a forecast, ask what moved it and whether surveys and orders agree.',
      ],
      result: 'Same 15% move: Rally A was a growth signal, Rally B was noise.',
    },
    mistakes: [
      'Reading every copper rally as a sign of growth. Strikes, tariffs and stockpiling can move it with no change in demand.',
      'Ignoring China. About half of world demand comes from one country.',
      'Chasing tariff-driven price gaps between US and London copper; policy changes can close them overnight.',
      'Buying a single mining stock as a copper bet and taking on that company’s debt and mine risk.',
    ],
    points: [
      'Copper is used in building, power and machines, so demand-driven moves can lead the economic data.',
      'China uses about half the world’s copper.',
      'Supply is slow to change, so mine problems can cause big price swings.',
      'Copper is a growth signal only when demand moves it; check the PMI and orders.',
    ],
    terms: ['Dr. Copper', 'Commodity', 'PMI', 'Tariff', 'Futures contract', 'Cyclical stocks'],
    glossary: [
      { t: 'Cathode', d: 'Refined copper in plate form, the raw material that factories turn into wire, pipe and sheet.' },
      { t: 'LME', d: 'The London Metal Exchange, the main global market for industrial metals.' },
    ],
    quiz: { q: 'Copper jumps 20% after a strike shuts a giant mine. What does that tell you about the global economy?', options: ['Growth is speeding up', 'Very little: supply moved the price, not demand', 'A recession is certain'], answer: 1, why: 'Copper is a growth signal only when demand drives it; a supply shock says nothing about demand.' },
    sources: [
            { t: 'Hellenic Shipping News (citing Investing.com): copper demand by country and end use', u: 'https://www.hellenicshippingnews.com/?p=1120679' },
    ].concat(DATA.copperSrc),
  });
})();
