/* Stock Market Lessons: Trading track, Economic Data & the Calendar part 2 (data-release days, earnings season, business cycle). Fork M3. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const usd = (v, d) => F.usd(v, d == null ? (Math.abs(v) >= 100 ? 0 : 2) : d);
  const pct = (v, d) => F.pct(v, d == null ? 1 : d);
  const spct = (v, d) => F.spct(v, d == null ? 1 : d);

  SML.css(`
.xmk-sub{padding:12px 16px 2px;font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.2em;color:var(--muted)}
.xmk-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;grid-column:1/-1}
.xmk-row .lab{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.xmk-row .seg{flex-wrap:wrap}
.xmk-btn{min-height:36px;padding:0 14px;font-size:13px}
.xmk-when{font:500 12px/1.4 var(--mono);color:var(--muted)}
.xmk-when b{color:var(--ink);font-weight:600}
.xmk-ctrl{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.xmk-rules{list-style:none;display:grid;gap:8px 18px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));padding:4px 16px 14px;font-size:13.5px;line-height:1.45;color:color-mix(in srgb,var(--ink) 86%,transparent)}
.xmk-rules li{display:flex;gap:10px;align-items:flex-start}
.xmk-rules b.n{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--accent-t);border:1px solid var(--accent);font:600 10.5px/1 var(--mono);color:var(--ink)}
.xmk-phase{display:grid;gap:14px 24px;grid-template-columns:1fr;padding:16px}
@media(min-width:640px){.xmk-phase{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.xmk-phase h4{font-family:var(--display);font-weight:400;font-size:30px;line-height:.95;text-transform:uppercase;color:var(--ink)}
.xmk-phase .kv{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 12px;font-size:13.5px;line-height:1.4;margin-top:10px}
.xmk-phase .kv dt{font:500 10.5px/1.6 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.xmk-phase .kv dd{color:color-mix(in srgb,var(--ink) 88%,transparent)}
.xmk-phase .lab{font:500 10.5px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);margin-bottom:8px}
.xmk-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.xmk-chips span{font:500 12.5px/1.2 var(--sans);border-radius:999px;padding:6px 11px;border:1px solid var(--line);color:var(--ink)}
.xmk-chips.lead span{border-color:color-mix(in srgb,var(--up) 45%,transparent);background:color-mix(in srgb,var(--up) 10%,transparent)}
.xmk-chips.lag span{border-color:color-mix(in srgb,var(--down) 40%,transparent);background:color-mix(in srgb,var(--down) 8%,transparent);color:color-mix(in srgb,var(--ink) 80%,transparent)}
.xmk-lights{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line)}
.xmk-lights > div{background:var(--surface);padding:12px 14px;display:flex;flex-direction:column;gap:5px;min-width:0}
.xmk-lights .l{font:500 10.5px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.xmk-lights .v{font:600 16px/1.2 var(--mono);color:var(--ink)}
.xmk-lights .s{display:inline-flex;align-items:center;gap:6px;font:600 11px/1.2 var(--mono);text-transform:uppercase;letter-spacing:.1em}
.xmk-lights .s i{width:9px;height:9px;border-radius:50%;display:inline-block;background:var(--muted)}
.xmk-lights .s.g{color:var(--up)} .xmk-lights .s.g i{background:var(--up)}
.xmk-lights .s.a{color:var(--accent)} .xmk-lights .s.a i{background:var(--accent)}
.xmk-lights .s.r{color:var(--down)} .xmk-lights .s.r i{background:var(--down)}
.xmk-tbl{width:100%;border-collapse:collapse;font-size:14px}
.xmk-tbl th,.xmk-tbl td{padding:9px 12px;text-align:left;border-top:1px solid var(--line);vertical-align:top}
.xmk-tbl th{font:600 10.5px/1.3 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-top:0}
.xmk-tblw{overflow-x:auto}
svg .xmk-grab{cursor:grab}
@media (max-width:520px){.xmk-tbl th,.xmk-tbl td{padding:8px 6px;font-size:13px}}
`);

  /* =====================================================================
     1. dataDayMove: how big a move is priced in, and what a gap does to your plan
     ===================================================================== */
  const EVENTS = {
    cpi: { label: 'CPI', long: 'the CPI inflation report', when: '8:30 am ET, about mid-month, before the open', asset: 'Index ETF', px: 500, strad: 5, sMin: 1, sMax: 15, kind: 'infl',
      steps: ['0.2 pt cooler', '0.1 pt cooler', 'as expected', '0.1 pt hotter', '0.2 pt hotter'], surpriseLab: 'Core CPI vs forecast' },
    jobs: { label: 'Jobs report', long: 'the monthly jobs report', when: '8:30 am ET, usually the first Friday, before the open', asset: 'Index ETF', px: 500, strad: 5, sMin: 1, sMax: 15, kind: 'growth',
      steps: ['150K fewer jobs', '75K fewer', 'as expected', '75K more', '150K more'], surpriseLab: 'Jobs added vs forecast' },
    fomc: { label: 'Fed decision', long: 'the Fed’s rate decision', when: '2:00 pm ET statement, 2:30 pm press conference, during the session', asset: 'Index ETF', px: 500, strad: 4.5, sMin: 1, sMax: 15, kind: 'fed',
      steps: ['much more dovish', 'a bit dovish', 'as expected', 'a bit hawkish', 'much more hawkish'], surpriseLab: 'Fed message vs expectations' },
    earn: { label: 'Big-tech earnings', long: 'a big company’s earnings', when: 'after the 4:00 pm close, so the move shows up the next morning', asset: 'DEMO stock', px: 200, strad: 14, sMin: 3, sMax: 40, kind: 'earn',
      steps: ['guidance cut', 'small miss', 'in line', 'small beat', 'beat and raise'], surpriseLab: 'Results vs expectations' },
  };

  function reactions(kind, s, regime) {
    /* strengths in roughly -2..+2; teaching model of the usual first reaction */
    if (kind === 'earn') return [
      { k: 'DEMO stock', v: s * 1.0, c: 'eq' }, { k: 'Its sector', v: s * 0.45, c: 'eq' }, { k: 'Whole index', v: s * 0.18, c: 'eq' },
    ];
    let eq;
    if (kind === 'infl') eq = regime === 'infl' ? -0.85 * s : -0.45 * s;
    else if (kind === 'growth') eq = regime === 'infl' ? -0.5 * s : 0.8 * s;
    else eq = -0.8 * s;
    const y2 = kind === 'growth' ? (regime === 'infl' ? 1.0 : 0.8) * s : 1.0 * s;
    const fx = 0.6 * s;
    return [{ k: 'Stocks', v: eq, c: 'eq' }, { k: '2-year yield', v: y2, c: 'rt' }, { k: 'US dollar', v: fx, c: 'rt' }];
  }

  SML.widgets.dataDayMove = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('xdd');
    let ev = EVENTS[opts.event] ? opts.event : 'cpi';
    const E = () => EVENTS[ev];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Release day</span><span class="grow"></span>${ui.seg(id + '-ev', Object.keys(EVENTS).map((k) => ({ v: k, label: EVENTS[k].label })), ev, 'Event')}</div>
      <div class="wg-bar" style="padding-top:0"><span class="xmk-when" id="${id}-when"></span></div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl xmk-ctrl">
        <div class="xmk-row"><span class="lab">Your trade</span>${ui.seg(id + '-side', [{ v: 'long', label: 'Long (bought)' }, { v: 'short', label: 'Short' }], 'long', 'Side')}</div>
        <div id="${id}-sl-px">${ui.slider({ id: id + '-px', label: 'Price', min: 20, max: 1000, step: 1, value: E().px, fmt: 'usd0' })}</div>
        <div id="${id}-sl-st">${ui.slider({ id: id + '-st', label: 'Straddle price (call + put)', min: E().sMin, max: E().sMax, step: 0.25, value: E().strad, fmt: 'usd' })}</div>
        ${ui.slider({ id: id + '-acct', label: 'Account size', min: 5000, max: 200000, step: 1000, value: 25000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-risk', label: 'Risk per trade', min: 0.25, max: 2, step: 0.25, value: 1, fmt: (v) => F.num(v, 2).replace(/0$/, '') + '%' })}
        ${ui.slider({ id: id + '-stop', label: 'Stop distance', min: 0.2, max: 4, step: 0.1, value: 0.4, fmt: (v) => F.num(v, 1) + '%' })}
      </div>
      <div class="wg-read">${ui.stat('Move priced in', id + '-em', 'hl')}${ui.stat('Shares for your risk', id + '-sh')}${ui.stat('Planned loss (1R)', id + '-r')}${ui.stat('Bad open (2× the move)', id + '-gap')}${ui.stat('That bad open is', id + '-gr')}${ui.stat('Chance it jumps your stop', id + '-p')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="xmk-sub">What usually moves, and which way</div>
      <div class="wg-bar" style="padding-top:6px">${ui.seg(id + '-reg', [{ v: 'infl', label: 'Market fears inflation' }, { v: 'growth', label: 'Market fears a slowdown' }], 'infl', 'What the market fears')}</div>
      <div class="wg-fig" id="${id}-fig2"></div>
      <div class="wg-ctrl"><div id="${id}-sl-s">${ui.slider({ id: id + '-s', label: E().surpriseLab, min: -2, max: 2, step: 1, value: 1, fmt: (v) => E().steps[v + 2] })}</div></div>
      <div class="wg-msg" id="${id}-msg2"></div>
      <div class="xmk-sub">Release-morning rules</div>
      <ul class="xmk-rules">
        <li><b class="n">1</b><span>Know the time. Data at 8:30 am ET lands before the open, so the first price you can trade may be far from yesterday’s close.</span></li>
        <li><b class="n">2</b><span>Size for the gap, not the stop. A stop cannot fill at a price that never trades.</span></li>
        <li><b class="n">3</b><span>Let the first 15 minutes finish. The first move often reverses once the details are read.</span></li>
        <li><b class="n">4</b><span>Options lose their event premium after the news. Being right on direction is not enough.</span></li>
      </ul>
      <div class="wg-note">Teaching model. The straddle price is roughly the average size of the move the options market expects. Chances use a normal bell curve, so real jumps can be bigger. Example prices; check your broker’s quotes.</div>`;
    const fig = $id(id + '-fig'), fig2 = $id(id + '-fig2');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-ev')) {
        ev = st.seg(id + '-ev');
        const x = E();
        $id(id + '-sl-st').innerHTML = ui.slider({ id: id + '-st', label: 'Straddle price (call + put)', min: x.sMin, max: x.sMax, step: 0.25, value: x.strad, fmt: 'usd' });
        $id(id + '-sl-s').innerHTML = ui.slider({ id: id + '-s', label: x.surpriseLab, min: -2, max: 2, step: 1, value: 1, fmt: (v) => EVENTS[ev].steps[v + 2] });
        rewire();
        st.set(id + '-px', x.px);
      }
      redraw(); redraw2();
    });
    function rewire() {
      [id + '-st', id + '-s'].forEach((k) => { const el = $id(k); if (el && !el.dataset.w) { el.dataset.w = '1'; el.addEventListener('input', () => { ui.setRange(el); redraw(); redraw2(); }); } });
    }
    rewire();
    function model() {
      const px = st.n(id + '-px'), strad = st.n(id + '-st');
      const em = strad, emPct = em / px * 100, sig = em / 0.798;
      const acct = st.n(id + '-acct'), riskPct = st.n(id + '-risk'), stopPct = st.n(id + '-stop');
      const riskD = acct * riskPct / 100, stopD = px * stopPct / 100;
      const shares = Math.max(0, Math.floor(riskD / stopD));
      const gapLoss = shares * 2 * em, gapR = riskD > 0 ? gapLoss / riskD : 0;
      const pJump = 1 - SML.ncdf(stopD / sig);
      const safe = Math.max(0, Math.floor(riskD / (2 * em)));
      return { px, strad, em, emPct, sig, acct, riskPct, stopPct, riskD, stopD, shares, gapLoss, gapR, pJump, safe, side: st.seg(id + '-side') || 'long' };
    }
    const redraw = ui.responsive(fig, (W) => {
      const m = model(), x0 = E();
      $id(id + '-when').innerHTML = `<b>${x0.label}:</b> ${x0.when}. ${x0.asset}, example price.`;
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.42, 220, 300));
      const padL = 14, padR = 14, top = 30, base = H - 42;
      const lo = m.px - 3.3 * m.sig, hi = m.px + 3.3 * m.sig;
      const x = SML.lin(lo, hi, padL, W - padR);
      const pdf = (p) => SML.npdf((p - m.px) / m.sig) / m.sig;
      const y = SML.lin(0, pdf(m.px), base, top + 22);
      const pts = []; for (let i = 0; i <= 160; i++) { const p = lo + (hi - lo) * i / 160; pts.push([x(p), y(pdf(p)), p]); }
      const long = m.side === 'long';
      const stopPx = long ? m.px - m.stopD : m.px + m.stopD;
      let b = '';
      b += S.area(pts.filter((q) => Math.abs(q[2] - m.px) <= m.em), base, 'f-acc-t');
      b += S.area(pts.filter((q) => (long ? q[2] <= stopPx : q[2] >= stopPx)), base, 'f-dn-t');
      b += S.poly(pts, 's-ink w2');
      b += S.line(padL, base + 0.5, W - padR, base + 0.5, 's-line');
      [-1, 1].forEach((k) => { const xx = x(m.px + k * m.em); b += S.line(xx, top + 16, xx, base, 's-acc dash w15'); });
      b += S.text(x(m.px), top + 10, compact ? 'priced in ±' + pct(m.emPct) : 'priced-in move ±' + usd(m.em) + ' (' + pct(m.emPct) + ')', 'sm acc b', 'middle');
      b += S.line(x(m.px), top + 16, x(m.px), base, 's-ink w15');
      // stop
      const xs = x(stopPx), inPlot = xs > padL && xs < W - padR;
      if (inPlot) {
        b += S.line(xs, top + 30, xs, base, 's-dn w2 dash2');
        const lt = 'stop ' + (long ? '−' : '+') + pct(m.stopPct), lw = lt.length * 6.4 + 12, ly = top + 32;
        let bx = long ? xs - lw - 4 : xs + 4; bx = SML.clamp(bx, padL, W - padR - lw);
        b += S.rect(bx, ly, lw, 20, 'tipbg', 4) + S.text(bx + lw / 2, ly + 14, lt, 'sm dn b', 'middle');
      }
      // 2x bad open
      const bad = long ? m.px - 2 * m.em : m.px + 2 * m.em, xb = x(bad);
      b += S.polygon([[xb, base - 2], [xb - 6, base - 13], [xb + 6, base - 13]], 'f-dn');
      b += S.text(xb, base - 18, '2× move', 'xs dn b', 'middle');
      // axis labels
      const ticks = compact ? [-1, 0, 1] : [-2, -1, 0, 1, 2];
      ticks.forEach((k) => { b += S.text(x(m.px + k * m.em), base + 15, usd(m.px + k * m.em, m.px >= 100 ? 0 : 2), 'xs mono' + (k === 0 ? ' ink b' : ''), 'middle'); });
      b += S.text(padL, base + 32, 'lower open', 'xs', 'start') + S.text(W - padR, base + 32, 'higher open', 'xs', 'end');
      fig.innerHTML = S.wrap(W, H, `Bell curve of the next opening price, with the priced-in move of about ${pct(m.emPct)} and your stop`, b);
      // stats
      sv(id + '-em', '±' + pct(m.emPct));
      sv(id + '-sh', F.num(m.shares));
      sv(id + '-r', usd(m.riskD, 0), 'dn');
      sv(id + '-gap', F.minus + usd(m.gapLoss, 0), m.gapR > 2 ? 'dn' : '');
      sv(id + '-gr', F.num(m.gapR, 1) + 'R', m.gapR > 2 ? 'dn' : '');
      sv(id + '-p', pct(m.pJump * 100, 0), m.pJump > 0.25 ? 'dn' : '');
      const msg = $id(id + '-msg');
      if (m.shares === 0) msg.innerHTML = ui.msg('acc', 'Too small', 'Your planned risk does not cover even one share at this stop. Widen the stop or skip the trade.');
      else if (m.gapR > 2) msg.innerHTML = ui.msg('dn', 'Gap risk', `The options market is pricing about ±${pct(m.emPct)} for ${x0.long}. Your stop is only ${pct(m.stopPct)} away, so there is about a ${pct(m.pJump * 100, 0)} chance the price simply jumps past it. A bad open of twice the priced-in move would cost <b>${usd(m.gapLoss, 0)}</b>, about <b>${F.num(m.gapR, 1)}R</b>. To keep even that within 1R, hold about <b>${F.num(m.safe)} shares</b>, or wait until after the release.`);
      else msg.innerHTML = ui.msg('up', 'Sized right', `Even an open twice the priced-in move against you costs about ${usd(m.gapLoss, 0)} (${F.num(m.gapR, 1)}R). That fits a plan built around the data.`);
    });
    const redraw2 = ui.responsive(fig2, (W) => {
      const x0 = E(), s = st.n(id + '-s'), regime = st.seg(id + '-reg') || 'infl';
      const rows = reactions(x0.kind, s, regime);
      const compact = W < 480;
      const labW = compact ? 92 : 118, rowH = 44, top = 12, H = top + rows.length * rowH + 22;
      const cx = labW + (W - labW - 12) / 2, half = (W - labW - 12) / 2 - 8;
      let b = S.line(cx, top - 4, cx, H - 20, 's-line');
      rows.forEach((r, i) => {
        const yy = top + i * rowH + rowH / 2;
        b += S.text(labW - 10, yy + 4, r.k, 'md ink b', 'end');
        const len = SML.clamp(r.v / 2.2, -1, 1) * half;
        const col = r.c === 'eq' ? (r.v > 0.05 ? 'up' : r.v < -0.05 ? 'dn' : 'mut') : (Math.abs(r.v) > 0.05 ? 'info' : 'mut');
        const word = Math.abs(r.v) < 0.12 ? 'little change' : (r.c === 'eq' ? (r.v > 0 ? 'up' : 'down') : (r.v > 0 ? 'higher' : 'lower'));
        if (Math.abs(len) > 6) b += S.arrow(cx, yy, cx + len, yy, col, 10);
        else b += S.circle(cx, yy, 4, 'f-mut');
        const tx = len >= 0 ? Math.min(cx + Math.max(len, 8) + 8, W - 14) : Math.max(cx + Math.min(len, -8) - 8, labW + 4);
        const anc = len >= 0 ? (tx >= W - 60 ? 'end' : 'start') : (tx <= labW + 60 ? 'start' : 'end');
        b += S.text(anc === 'end' && len >= 0 ? W - 14 : tx, yy - 10, word, 'sm ' + col + ' b', anc === 'end' && len >= 0 ? 'end' : anc);
      });
      b += S.text(cx - half, H - 6, compact ? '← down' : '← falls', 'xs', 'start') + S.text(cx + half, H - 6, compact ? 'up →' : 'rises →', 'xs', 'end');
      fig2.innerHTML = S.wrap(W, H, 'Usual first reaction of stocks, yields and the dollar to the surprise', b);
      const msg = $id(id + '-msg2');
      const what = x0.steps[s + 2];
      let t;
      if (s === 0) t = ui.msg('info', 'No surprise', `When the number matches the forecast, it is already in the price. The move then comes from the details: revisions, the core number, wages, or the chair’s tone.`);
      else if (x0.kind === 'infl') t = ui.msg(s > 0 ? 'dn' : 'up', s > 0 ? 'Hot print' : 'Cool print', `CPI came in ${what}. Traders expect the Fed to keep rates ${s > 0 ? 'higher for longer' : 'lower sooner'}, so the 2-year yield ${s > 0 ? 'rises' : 'falls'} and the dollar usually follows. Stocks ${s > 0 ? 'tend to fall' : 'tend to rise'}${regime === 'infl' ? ', most of all fast-growing tech and small companies that rely on borrowing.' : ', though less when the market cares more about growth than inflation.'}`);
      else if (x0.kind === 'growth') t = ui.msg(regime === 'infl' ? (s > 0 ? 'dn' : 'up') : (s > 0 ? 'up' : 'dn'), regime === 'infl' ? 'Good news can be bad news' : 'Good news is good news', `The report showed ${what} than forecast. ${regime === 'infl' ? `With inflation the worry, ${s > 0 ? 'strong hiring means the Fed may hold rates high, so yields rise and stocks can fall' : 'weak hiring means rate cuts sooner, so yields fall and stocks can rise'}.` : `With a slowdown the worry, ${s > 0 ? 'strong hiring eases recession fears, so stocks tend to rise even as yields go up' : 'weak hiring feeds recession fears, so stocks tend to fall while yields drop'}.`} Same number, different reaction: it depends on what the market fears.`);
      else if (x0.kind === 'fed') t = ui.msg(s > 0 ? 'dn' : 'up', s > 0 ? 'Hawkish' : 'Dovish', `The Fed sounded ${what}. ${s > 0 ? 'Hawkish means rates may stay higher or rise. Short yields and the dollar jump; stocks usually fall.' : 'Dovish means cuts may come sooner. Short yields and the dollar drop; stocks usually rise.'} Watch the 2:30 pm press conference: it often changes the first reaction to the 2:00 pm statement.`);
      else t = ui.msg(s > 0 ? 'up' : 'dn', s > 0 ? 'Beat' : 'Miss', `Results came in as a ${what}. The stock takes the biggest hit or gain; its peers often move in sympathy, and a giant company can nudge the whole index. Guidance usually matters more than last quarter’s numbers. See <a href="#l-earnings-season">earnings season</a>.`);
      msg.innerHTML = t;
    });
  };

  /* =====================================================================
     2. earningsSeason: how a stock reacts to EPS, revenue and guidance
     ===================================================================== */
  const GUIDE = { cut: { label: 'Cut', v: -7 }, inline: { label: 'In line', v: 0 }, raise: { label: 'Raised', v: 4 } };
  const PRESETS_E = {
    ex: { label: 'Beat, but guidance cut', eps: 10, rev: 0, g: 'cut', run: 12, imp: 7 },
    clean: { label: 'Beat and raise', eps: 6, rev: 2, g: 'raise', run: 0, imp: 7 },
    priced: { label: 'Priced for perfection', eps: 4, rev: 1, g: 'inline', run: 20, imp: 8 },
    miss: { label: 'Miss, low hopes', eps: -5, rev: -1, g: 'inline', run: -12, imp: 9 },
  };
  function earnModel(eps, rev, g, run) {
    const cEps = 0.25 * eps, cRev = 1.2 * rev, cG = GUIDE[g].v;
    const cRun = run > 0 ? -0.3 * run : -0.2 * run;
    return { cEps, cRev, cG, cRun, move: cEps + cRev + cG + cRun };
  }
  SML.widgets.earningsSeason = function (root) {
    const id = SML.uid('xes');
    const P0 = PRESETS_E.ex;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">DEMO reports</span><span class="grow"></span>${ui.seg(id + '-pre', Object.keys(PRESETS_E).map((k) => ({ v: k, label: PRESETS_E[k].label })), 'ex', 'Scenario')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl xmk-ctrl">
        <div class="xmk-row"><span class="lab">Guidance for next quarter</span>${ui.seg(id + '-g', Object.keys(GUIDE).map((k) => ({ v: k, label: GUIDE[k].label })), P0.g, 'Guidance')}</div>
        ${ui.slider({ id: id + '-eps', label: 'EPS vs estimate', min: -20, max: 20, step: 1, value: P0.eps, fmt: (v) => F.spct(v, 0) })}
        ${ui.slider({ id: id + '-rev', label: 'Revenue vs estimate', min: -5, max: 5, step: 0.5, value: P0.rev, fmt: (v) => F.spct(v, 1) })}
        ${ui.slider({ id: id + '-run', label: 'Run-up into the report', min: -20, max: 30, step: 1, value: P0.run, fmt: (v) => F.spct(v, 0) })}
        ${ui.slider({ id: id + '-imp', label: 'Move priced in by options', min: 2, max: 15, step: 0.5, value: P0.imp, fmt: (v) => '±' + F.num(v, 1) + '%' })}
      </div>
      <div class="wg-read">${ui.stat('Next-day move (model)', id + '-mv', 'hl')}${ui.stat('Vs priced-in move', id + '-vs')}${ui.stat('100 shares', id + '-d')}${ui.stat('Biggest driver', id + '-drv')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Simple teaching model built from common patterns: guidance and revenue matter more than an EPS beat, and a big run-up raises the bar. Real reactions vary a lot. DEMO is a made-up company.</div>`;
    const fig = $id(id + '-fig');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-pre')) {
        const p = PRESETS_E[st.seg(id + '-pre')];
        st.set(id + '-eps', p.eps); st.set(id + '-rev', p.rev); st.set(id + '-run', p.run); st.set(id + '-imp', p.imp); st.setSeg(id + '-g', p.g);
      }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const eps = st.n(id + '-eps'), rev = st.n(id + '-rev'), run = st.n(id + '-run'), imp = st.n(id + '-imp'), g = st.seg(id + '-g') || 'inline';
      const m = earnModel(eps, rev, g, run);
      const compact = W < 520;
      const close = 150, start = close / (1 + run / 100), after = close * (1 + m.move / 100);
      const nPre = compact ? 16 : 24;
      const pre = SML.data.path([[0, start], [Math.round(nPre * 0.5), start + (close - start) * 0.45], [nPre - 1, close]], nPre, 11, Math.max(0.6, Math.abs(close - start) / 18 + 0.9));
      pre[nPre - 1] = close;
      const post = SML.data.path([[0, after], [4, after * (1 + m.move / 100 * 0.12)]], 5, 23, 0.9);
      const closes = pre.concat(post);
      const cd = SML.data.candles(closes, 5, { wick: 0.25 });
      cd[nPre].o = after - (after - close) * 0.02; // gap open near the new level
      cd[nPre].h = Math.max(cd[nPre].h, cd[nPre].o); cd[nPre].l = Math.min(cd[nPre].l, cd[nPre].o);
      // layout: price chart on top, waterfall below
      const topH = Math.round(SML.clamp(W * 0.36, 190, 250));
      const wfRowH = 26, wfTop = topH + 30, H = wfTop + 5 * wfRowH + 18;
      const padL = 10, padR = compact ? 52 : 64;
      const N = closes.length;
      const allP = cd.flatMap((k) => [k.h, k.l]).concat([close * (1 + imp / 100), close * (1 - imp / 100)]);
      const yMin = Math.min(...allP), yMax = Math.max(...allP), padY = (yMax - yMin) * 0.08 + 0.5;
      const y = SML.lin(yMin - padY, yMax + padY, topH - 18, 16);
      const x = (i) => padL + (i + 0.5) * (W - padL - padR) / N;
      const bw = Math.max(3, Math.min(14, (W - padL - padR) / N * 0.62));
      let b = '';
      // implied band at report day
      const xr = x(nPre), bandX0 = x(nPre) - bw, bandX1 = W - padR;
      b += S.rect(bandX0, y(close * (1 + imp / 100)), bandX1 - bandX0, y(close * (1 - imp / 100)) - y(close * (1 + imp / 100)), 'f-acc-t', 0, ' opacity=".55"');
      b += S.line(bandX0, y(close * (1 + imp / 100)), bandX1, y(close * (1 + imp / 100)), 's-acc dash w15') + S.line(bandX0, y(close * (1 - imp / 100)), bandX1, y(close * (1 - imp / 100)), 's-acc dash w15');
      b += S.text(W - padR + 6, y(close * (1 + imp / 100)) + 4, '+' + F.num(imp, 1) + '%', 'xs acc mono b') + S.text(W - padR + 6, y(close * (1 - imp / 100)) + 4, '−' + F.num(imp, 1) + '%', 'xs acc mono b');
      b += S.line(xr - bw, 10, xr - bw, topH - 18, 's-mut dash2') + S.text(xr - bw - 4, 22, 'report', 'xs', 'end');
      b += S.line(padL, y(close), W - padR, y(close), 's-line dash2') + S.text(W - padR + 6, y(close) + 4, '$150', 'xs mono');
      b += S.candles(cd, x, bw, y);
      // gap arrow
      const up = m.move >= 0, col = up ? 'up' : 'dn';
      b += S.arrow(xr - bw * 1.6, y(close), xr - bw * 1.6, y(cd[nPre].o), col, 7);
      { const t = F.spct(m.move, 1), tw = t.length * 7 + 10, tx = xr - bw * 1.6 - 6 - tw, ty = (y(close) + y(cd[nPre].o)) / 2 - 10;
        b += S.rect(tx, ty, tw, 20, 'tipbg', 4) + S.text(tx + tw / 2, ty + 14, t, 'sm b ' + col, 'middle'); }
      b += S.text(padL, topH - 2, compact ? 'run-up' : 'the weeks before: ' + F.spct(run, 0), 'xs', 'start');
      // waterfall
      b += S.text(padL, wfTop - 10, 'What drove the move', 'cap');
      const items = [['EPS beat/miss', m.cEps], ['Revenue', m.cRev], ['Guidance', m.cG], ['Expectations', m.cRun], ['Total', m.move]];
      const labW = compact ? 92 : 110, zx0 = labW + 10, zW = W - zx0 - (compact ? 46 : 60);
      const maxAbs = Math.max(8, ...items.map((t) => Math.abs(t[1])));
      const zx = SML.lin(-maxAbs, maxAbs, zx0, zx0 + zW);
      b += S.line(zx(0), wfTop - 4, zx(0), wfTop + 5 * wfRowH - 4, 's-line');
      items.forEach((t, i) => {
        const yy = wfTop + i * wfRowH, v = t[1], last = i === 4;
        b += S.text(labW, yy + 13, t[0], 'sm ' + (last ? 'ink b' : 'ink'), 'end');
        const x1 = zx(Math.min(0, v)), x2 = zx(Math.max(0, v));
        b += S.rect(x1, yy + 2, Math.max(1.5, x2 - x1), 16, (v >= 0 ? 'f-up' : 'f-dn') + (last ? '' : ' o70'), 2);
        b += S.text(v >= 0 ? x2 + 5 : zx(0) + 5, yy + 14, F.spct(v, 1), 'xs mono b ' + (v >= 0 ? 'up' : 'dn'), 'start');
      });
      fig.innerHTML = S.wrap(W, H, `DEMO stock chart into its earnings report, a gap of ${F.spct(m.move, 1)} and what drove it`, b);
      sv(id + '-mv', F.spct(m.move, 1), up ? 'up' : 'dn');
      const ratio = Math.abs(m.move) / imp;
      sv(id + '-vs', ratio > 1 ? F.num(ratio, 1) + '× bigger' : ratio > 0.6 ? 'about as priced' : 'smaller', ratio > 1 ? 'dn' : '');
      sv(id + '-d', F.susd((after - close) * 100, 0), up ? 'up' : 'dn');
      const drv = items.slice(0, 4).reduce((a, t) => (Math.abs(t[1]) > Math.abs(a[1]) ? t : a));
      sv(id + '-drv', drv[0]);
      const msg = $id(id + '-msg');
      if (eps > 0 && m.move < 0) msg.innerHTML = ui.msg('dn', 'Still fell', `DEMO beat EPS by ${eps}%, yet the model says ${F.spct(m.move, 1)}. ${g === 'cut' ? 'The guidance cut speaks about the next quarters, which is what the price is really built on.' : ''} ${run > 8 ? `The ${run}% run-up meant buyers already expected good news, so a plain beat disappointed.` : ''}`);
      else if (m.move > imp) msg.innerHTML = ui.msg('up', 'Big move', `A ${F.spct(m.move, 1)} jump beats the ±${F.num(imp, 1)}% the options market expected. That usually takes a raise in guidance or a revenue surprise, not just an EPS beat.`);
      else if (m.move < -imp) msg.innerHTML = ui.msg('dn', 'Big move', `A ${F.spct(m.move, 1)} drop is outside the ±${F.num(imp, 1)}% options priced in. Holders who sized for a normal day lose more than planned.`);
      else msg.innerHTML = ui.msg(up ? 'up' : 'info', 'In range', `A ${F.spct(m.move, 1)} move sits inside the ±${F.num(imp, 1)}% priced in. Option buyers who paid for a big move lose money here as volatility drops after the report (<a href="#l-iv-crush">IV crush</a>).`);
    });
  };

  /* extra: seasonRhythm — when companies report, by week after quarter end */
  const SEASON_SHAPE = [1, 5, 12, 22, 23, 16, 10, 6, 3, 2];
  const SEASONS = [
    { k: 'q3-26', label: 'Q3 2026', end: '2026-09-30' },
    { k: 'q4-26', label: 'Q4 2026', end: '2026-12-31' },
    { k: 'q1-27', label: 'Q1 2027', end: '2027-03-31' },
    { k: 'q2-27', label: 'Q2 2027', end: '2027-06-30' },
    { k: 'q3-27', label: 'Q3 2027', end: '2027-09-30' },
  ];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function firstMondayAfter(iso) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + 1); while (d.getDay() !== 1) d.setDate(d.getDate() + 1); return d; }
  SML.widgets.seasonRhythm = function (root) {
    const id = SML.uid('xsr');
    let sel = -1;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Earnings season</span><span class="grow"></span>${ui.seg(id + '-q', SEASONS.map((s) => ({ v: s.k, label: s.label })), 'q4-26', 'Quarter')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Bars show the usual shape of a season (share of S&amp;P 500 companies reporting each week), not an exact count. Weeks start on the Monday after the quarter ends. Tap a bar. Check each company’s investor-relations page for its date.</div>`;
    const fig = $id(id + '-fig');
    const st = ui.wire(root, () => { sel = -1; draw(); });
    const NOTE = [
      'A quiet start. A few companies with early fiscal calendars report.',
      'The season opens: the biggest US banks usually report first, about two weeks after the quarter ends. Their comments on loans, consumers and credit set the tone.',
      'More banks, plus industrials, health care and early tech names.',
      'Peak weeks: a large share of the index reports, including several of the largest tech companies.',
      'Still at the peak. Daily moves in single stocks are big; the index can swing on a few giants.',
      'Energy, materials, smaller companies and the remaining tech names.',
      'Smaller companies and late reporters.',
      'Big retailers report now: their fiscal quarters end a month later (January, April, July, October).',
      'The tail: retailers and a few chipmakers with off-calendar quarters.',
      'The season is over. Analysts reset estimates for the next quarter.',
    ];
    const draw = ui.responsive(fig, (W) => {
      const q = SEASONS.find((s) => s.k === (st.seg(id + '-q') || 'q4-26')) || SEASONS[1];
      const m0 = firstMondayAfter(q.end);
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.42, 210, 280));
      const padL = 12, padR = 12, top = 30, base = H - 40;
      const n = SEASON_SHAPE.length, bwSlot = (W - padL - padR) / n;
      const y = SML.lin(0, 26, base, top);
      let b = S.line(padL, base + 0.5, W - padR, base + 0.5, 's-line');
      SEASON_SHAPE.forEach((v, i) => {
        const x0 = padL + i * bwSlot + bwSlot * 0.14, w = bwSlot * 0.72;
        const tag = i === 1 ? 'f-info' : (i === 3 || i === 4) ? 'f-acc' : i === 7 ? 'f-vio' : 'f-shade2';
        b += S.rect(x0, y(v), w, base - y(v), tag + (sel >= 0 && sel !== i ? ' o35' : ''), 3);
        b += S.rect(padL + i * bwSlot, top - 10, bwSlot, base - top + 34, 'hit', 0, ` data-i="${i}"`);
        const d = new Date(m0); d.setDate(d.getDate() + 7 * i);
        if (!compact || i % 2 === 0) b += S.text(x0 + w / 2, base + 15, MON[d.getMonth()] + ' ' + d.getDate(), 'xs mono', 'middle');
      });
      const lab = (i, t, cls) => { const x0 = padL + i * bwSlot + bwSlot / 2; return S.text(x0, y(SEASON_SHAPE[i]) - 8, t, 'sm b ' + cls, 'middle'); };
      b += lab(1, 'banks', 'info');
      b += S.text(padL + 3.5 * bwSlot + bwSlot / 2 - bwSlot / 2, y(24) - 10, compact ? 'peak' : 'peak weeks', 'sm b acc', 'middle');
      b += lab(7, 'retail', 'vio');
      b += S.text(padL, base + 32, 'week starting', 'xs', 'start');
      fig.innerHTML = S.wrap(W, H, `Usual shape of the ${q.label} earnings season by week`, b);
      const i = sel >= 0 ? sel : 1;
      const d = new Date(m0); d.setDate(d.getDate() + 7 * i);
      $id(id + '-msg').innerHTML = ui.msg(sel >= 0 ? 'acc' : 'info', 'Week of ' + MON[d.getMonth()] + ' ' + d.getDate(), NOTE[i] + (sel < 0 ? ` The ${q.label} quarter ends ${MON[Number(q.end.slice(5, 7)) - 1]} ${Number(q.end.slice(8))}.` : ''));
    });
    fig.addEventListener('click', (e) => { const t = e.target.closest('[data-i]'); if (!t) return; sel = Number(t.dataset.i); draw(); });
  };

  /* =====================================================================
     3. cycleClock: phases, leading indicators and sector rotation
     ===================================================================== */
  /* Sector tendencies: Fidelity, The Business Cycle Approach to Sector Investing (data from 1962). */
  const PHASES = [
    { k: 'early', label: 'Early cycle', short: 'Early', col: 'up', econ: 'Growth rebounds fast after a recession', infl: 'Low', rates: 'Low; the Fed is supportive', earn: 'Recovering quickly from a low base', len: 'About 1 year',
      lead: ['Consumer discretionary', 'Real estate', 'Industrials', 'Financials', 'Technology', 'Materials'], lag: ['Utilities', 'Health care', 'Energy', 'Communication services'],
      note: 'Stocks have often made their biggest gains here, starting before the economy feels better.' },
    { k: 'mid', label: 'Mid cycle', short: 'Mid', col: 'info', econ: 'Steady, moderate growth', infl: 'Rising gently', rates: 'Normal; the Fed is neutral', earn: 'Growing at a healthy pace', len: 'About 3½ years',
      lead: ['Technology'], lag: ['Materials', 'Utilities'],
      note: 'Usually the longest phase. Gains are smaller than early cycle and sector leadership is less clear.' },
    { k: 'late', label: 'Late cycle', short: 'Late', col: 'acc', econ: 'Growth slows; the economy runs hot', infl: 'Highest of the cycle', rates: 'High; the Fed is tightening', earn: 'Margins squeezed by costs', len: 'About 1½ years',
      lead: ['Energy', 'Materials', 'Health care', 'Consumer staples', 'Utilities'], lag: ['Technology', 'Consumer discretionary'],
      note: 'Energy has been the most consistent late-cycle leader; defensive sectors have tended to hold up better.' },
    { k: 'rec', label: 'Recession', short: 'Recession', col: 'dn', econ: 'Output and jobs fall', infl: 'Falling', rates: 'Falling; the Fed is cutting', earn: 'Falling', len: 'Under 1 year',
      lead: ['Consumer staples', 'Utilities', 'Health care'], lag: ['Industrials', 'Technology', 'Real estate'],
      note: 'Defensive sectors have tended to fall least. Stocks have often bottomed before the recession ended.' },
  ];
  const IND_PRESETS = {
    now: { label: 'Oct 2026', curve: 0.35, claims: 200, pmi: 54.5, sahm: 0 },
    early: { label: 'Textbook early', curve: 2.0, claims: 260, pmi: 53.5, sahm: 0.25 },
    late: { label: 'Textbook late', curve: -0.4, claims: 215, pmi: 50.5, sahm: 0.1 },
    rec: { label: 'Textbook recession', curve: 0.9, claims: 380, pmi: 44, sahm: 0.9 },
  };
  function lights(v) {
    const L = {};
    L.curve = v.curve < 0 ? ['r', 'Inverted'] : v.curve < 0.5 ? ['a', 'Flat'] : ['g', 'Normal'];
    L.claims = v.claims > 300 ? ['r', 'Layoffs rising'] : v.claims >= 240 ? ['a', 'Creeping up'] : ['g', 'Low'];
    L.pmi = v.pmi < 48 ? ['r', 'Shrinking'] : v.pmi < 50 ? ['a', 'Soft'] : v.pmi < 52 ? ['a', 'Barely growing'] : ['g', 'Growing'];
    L.sahm = v.sahm >= 0.5 ? ['r', 'Triggered'] : v.sahm >= 0.3 ? ['a', 'Watch'] : ['g', 'Calm'];
    return L;
  }
  function guessPhase(v) {
    if (v.sahm >= 0.5 && v.pmi < 50) return 3;
    if (v.sahm >= 0.5) return 3;
    if (v.curve < 0) return 2;
    if (v.pmi < 50 && (v.curve < 0.5 || v.claims >= 250)) return 2;
    if (v.curve >= 1.2 && v.pmi >= 50) return 0;
    if (v.pmi >= 51 && v.claims < 260) return 1;
    return v.pmi >= 50 ? 1 : 2;
  }
  SML.widgets.cycleClock = function (root) {
    const id = SML.uid('xcc');
    let phase = -1; // -1: follow the indicators
    const P0 = IND_PRESETS.now;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">The business cycle</span><span class="grow"></span>${ui.seg(id + '-pre', Object.keys(IND_PRESETS).map((k) => ({ v: k, label: IND_PRESETS[k].label })), 'now', 'Readings')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="xmk-phase" id="${id}-ph"></div>
      <div class="xmk-sub">Leading indicators: set the readings</div>
      <div class="wg-ctrl xmk-ctrl">
        ${ui.slider({ id: id + '-curve', label: '10-year minus 2-year yield', min: -1.5, max: 2.5, step: 0.05, value: P0.curve, fmt: (v) => F.spct(v, 2).replace('%', ' pts') })}
        ${ui.slider({ id: id + '-claims', label: 'Weekly jobless claims', min: 180, max: 450, step: 5, value: P0.claims, fmt: (v) => v + 'K' })}
        ${ui.slider({ id: id + '-pmi', label: 'ISM manufacturing PMI', min: 40, max: 62, step: 0.5, value: P0.pmi, fmt: (v) => F.num(v, 1) })}
        ${ui.slider({ id: id + '-sahm', label: 'Sahm rule reading', min: 0, max: 1.5, step: 0.05, value: P0.sahm, fmt: (v) => F.num(v, 2) + ' pts' })}
      </div>
      <div class="xmk-lights" id="${id}-lights"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the hand around the clock to explore a phase, or move the readings to see where they point. A rough rule of thumb from past cycles, not a forecast; cycles differ, and sector leadership does not repeat every time.</div>`;
    const fig = $id(id + '-fig');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-pre')) {
        const p = IND_PRESETS[st.seg(id + '-pre')];
        st.set(id + '-curve', p.curve); st.set(id + '-claims', p.claims); st.set(id + '-pmi', p.pmi); st.set(id + '-sahm', p.sahm);
      }
      phase = -1; draw();
    });
    const vals = () => ({ curve: st.n(id + '-curve'), claims: st.n(id + '-claims'), pmi: st.n(id + '-pmi'), sahm: st.n(id + '-sahm') });
    let geom = null, dragAng = null;
    const draw = ui.responsive(fig, (W) => {
      const v = vals(), g = guessPhase(v), show = phase >= 0 ? phase : g;
      const compact = W < 480;
      const H = compact ? 300 : 320;
      const cx = W / 2, cy = H / 2 + 4, R = Math.min(H / 2 - 30, W / 2 - (compact ? 22 : 90)), r0 = R * 0.56;
      geom = { cx, cy, R };
      let b = '';
      const arcPath = (a0, a1, ro, ri) => {
        const p = (a, rr) => [cx + rr * Math.sin(a), cy - rr * Math.cos(a)];
        const [x0, y0] = p(a0, ro), [x1, y1] = p(a1, ro), [x2, y2] = p(a1, ri), [x3, y3] = p(a0, ri);
        return `M${x0.toFixed(1)},${y0.toFixed(1)} A${ro},${ro} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${ri},${ri} 0 0 0 ${x3.toFixed(1)},${y3.toFixed(1)} Z`;
      };
      PHASES.forEach((p, i) => {
        const a0 = i * Math.PI / 2 + 0.02, a1 = (i + 1) * Math.PI / 2 - 0.02;
        b += S.path(arcPath(a0, a1, R, r0), 'f-' + p.col + (i === show ? '' : '-t') + ' s-surf w2' + (i === show ? '' : ''), ` data-p="${i}" style="cursor:pointer"`);
        const am = (i + 0.5) * Math.PI / 2, rl = (R + r0) / 2;
        b += S.text(cx + rl * Math.sin(am), cy - rl * Math.cos(am) + 4, p.short, (compact ? 'sm' : 'md') + ' b ' + (i === show ? 'on' : p.col), 'middle');
      });
      // outer captions
      if (!compact) {
        b += S.text(cx + R + 12, cy - R * 0.55, 'growth', 'xs', 'start') + S.text(cx + R + 12, cy - R * 0.55 + 13, 'speeds up', 'xs', 'start');
        b += S.text(cx - R - 12, cy + R * 0.6, 'growth', 'xs', 'end') + S.text(cx - R - 12, cy + R * 0.6 + 13, 'shrinks', 'xs', 'end');
      }
      // indicator marker (where signals point)
      const ag = (g + 0.5) * Math.PI / 2;
      const mx = cx + (R + 9) * Math.sin(ag), my = cy - (R + 9) * Math.cos(ag);
      const ux = Math.sin(ag), uy = -Math.cos(ag);
      b += S.polygon([[mx - ux * 2, my - uy * 2], [mx + ux * 10 - uy * 6, my + uy * 10 + ux * 6], [mx + ux * 10 + uy * 6, my + uy * 10 - ux * 6]], 'f-ink');
      // hand
      const ah = dragAng != null ? dragAng : (show + 0.5) * Math.PI / 2;
      const hx = cx + (r0 - 10) * Math.sin(ah), hy = cy - (r0 - 10) * Math.cos(ah);
      b += S.circle(cx, cy, r0 - 4, 'f-surf s-line w15');
      b += S.line(cx, cy, hx, hy, 's-ink w3');
      b += S.circle(cx, cy, 5, 'f-ink');
      b += S.circle(hx, hy, 9, 'handle xmk-grab', ' data-h="1"');
      b += S.text(cx, cy + r0 * 0.42, 'drag', 'xs', 'middle');
      fig.innerHTML = S.wrap(W, H, `Business cycle clock showing ${PHASES[show].label}; the readings point to ${PHASES[g].label}`, b, 'drag');
      // phase panel
      const p = PHASES[show];
      $id(id + '-ph').innerHTML = `<div><h4>${p.label}</h4><dl class="kv"><dt>Economy</dt><dd>${p.econ}</dd><dt>Inflation</dt><dd>${p.infl}</dd><dt>Rates</dt><dd>${p.rates}</dd><dt>Earnings</dt><dd>${p.earn}</dd><dt>Typical length</dt><dd>${p.len}</dd></dl></div>
        <div><p class="lab">Sectors that have tended to lead</p><div class="xmk-chips lead">${p.lead.map((s) => `<span>${s}</span>`).join('')}</div><p class="lab">Tended to lag</p><div class="xmk-chips lag">${p.lag.map((s) => `<span>${s}</span>`).join('')}</div><p style="font-size:13.5px;line-height:1.5;color:var(--muted)">${p.note}</p></div>`;
      const L = lights(v);
      const box = (lab, val, l) => `<div><span class="l">${lab}</span><span class="v">${val}</span><span class="s ${l[0]}"><i></i>${l[1]}</span></div>`;
      $id(id + '-lights').innerHTML = box('Yield curve', F.spct(v.curve, 2).replace('%', ' pts'), L.curve) + box('Jobless claims', v.claims + 'K', L.claims) + box('ISM PMI', F.num(v.pmi, 1), L.pmi) + box('Sahm rule', F.num(v.sahm, 2), L.sahm);
      const reds = Object.values(L).filter((l) => l[0] === 'r').length, ambers = Object.values(L).filter((l) => l[0] === 'a').length;
      const msg = $id(id + '-msg');
      const head = phase >= 0 && phase !== g ? `You are exploring <b>${PHASES[phase].label}</b>; the readings point to <b>${PHASES[g].label}</b>. ` : `The readings point to <b>${PHASES[g].label}</b>. `;
      const N = IND_PRESETS.now, isNow = v.curve === N.curve && v.claims === N.claims && v.pmi === N.pmi && v.sahm === N.sahm;
      const nowNote = isNow ? ' But the four lights miss two late-cycle features of October 2026: inflation back at 3.7% and a Fed rate hike in September.' : '';
      msg.innerHTML = ui.msg(reds >= 2 ? 'dn' : reds === 1 || ambers >= 2 ? 'acc' : 'up', reds + ' red · ' + ambers + ' amber', head + (reds >= 2 ? 'Several warning lights are on together. That has often come before or during recessions, but stocks tend to bottom before the economy does.' : reds === 1 || ambers >= 2 ? 'Mixed signals: one light alone has given false alarms, such as the long yield-curve inversion of 2022 to 2024 without a recession.' : 'Few warnings. Expansions can last for years; leadership often shifts toward growth sectors.') + nowNote);
    });
    const angOf = (pt) => { let a = Math.atan2(pt.x - geom.cx, -(pt.y - geom.cy)); if (a < 0) a += 2 * Math.PI; return a; };
    ui.drag(fig, {
      sel: '[data-h], [data-p]',
      start(pt) { if (!geom) return; dragAng = angOf(pt); phase = Math.min(3, Math.floor(dragAng / (Math.PI / 2))); draw(); },
      move(pt) { if (!geom) return; dragAng = angOf(pt); phase = Math.min(3, Math.floor(dragAng / (Math.PI / 2))); draw(); },
      end() { dragAng = null; draw(); },
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    blsCpi: { t: 'BLS: Consumer Price Index news release (8:30 am ET)', u: 'https://www.bls.gov/news.release/cpi.nr0.htm' },
    blsJobs: { t: 'BLS: The Employment Situation news release', u: 'https://www.bls.gov/news.release/empsit.nr0.htm' },
    fomc: { t: 'Federal Reserve: FOMC meeting calendar', u: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
    orats: { t: 'ORATS: bank earnings and CPI straddles (July 2026)', u: 'https://orats.com/blog/bank-earnings-cpi-straddles' },
    cpi2022: { t: 'Nasdaq: stocks suffer worst day since 2020 on hot CPI (Sept. 13, 2022)', u: 'https://www.nasdaq.com/articles/stocks-collapse-suffer-worst-day-since-2020' },
    factset: { t: 'FactSet: S&P 500 earnings season update (Oct. 16, 2026)', u: 'https://insight.factset.com/sp-500-earnings-season-update-october-16-2026' },
    jpm: { t: 'JPMorgan Chase: 2027 earnings conference call dates', u: 'https://www.jpmorganchase.com/ir/news/2026/jpmc-announces-conference-calls-to-review-first-quarter-second-quarter-third-quarter-and-fourth-quarter-2027-earnings' },
    factsetPdf: { t: 'FactSet Earnings Insight (Oct. 16, 2026)', u: 'https://advantage.factset.com/hubfs/Website/Resources%20Section/Research%20Desk/Earnings%20Insight/EarningsInsight_101626.pdf' },
    nber: { t: 'NBER: US business cycle expansions and contractions', u: 'https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions' },
    fidelity: { t: 'Fidelity: The Business Cycle Approach to Sector Investing', u: 'https://www.fidelity.com/webcontent/ap101883-markets_sectors-content/21.01.0/business_cycle/Business_Cycle_Sector_Approach_2020.pdf' },
    sahm: { t: 'FRED: Real-time Sahm rule recession indicator', u: 'https://fred.stlouisfed.org/series/SAHMREALTIME' },
    treas: { t: 'US Treasury: daily par yield curve rates (Oct. 2026)', u: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202610' },
    bears: { t: 'CNN Business via KVIA: what caused the last 12 bear markets', u: 'https://kvia.com/news/business-technology/2020/03/09/us-stocks-are-nearing-a-bear-market-heres-what-caused-the-last-12-bears/' },
  };

  SML.lessons.push({
    id: 'l-data-day', course: 'econ', order: 4, title: 'Trading data-release days', mins: 9, level: 'Intermediate',
    summary: 'Why CPI, jobs and Fed days move markets, and how to size around the release.',
    idea: 'Markets move on the surprise, not the number. Options show how big a move is priced in; size so a gap cannot break your plan.',
    widget: 'dataDayMove',
    try: 'Pick an event, then shrink the stop and raise your risk. Watch what one bad open would cost, and how the same jobs number reads differently when the market fears inflation or a slowdown.',
    body: [
      '<h3>The events that move everything</h3><p>A handful of scheduled reports can move the whole market in seconds. They come out on dates set long in advance, so you can plan around them (see the <a href="#calendar">calendar</a>):</p><ul><li><b>CPI inflation</b>: 8:30 am ET, usually around the middle of the month (the September 2026 report came out on Wednesday, October 14). See <a href="#l-inflation">inflation</a>.</li><li><b>The jobs report</b>: 8:30 am ET, usually on the first Friday of the month (the September report came out on Friday, October 2). See <a href="#l-jobs">the jobs report</a>.</li><li><b>Fed decisions</b>: eight scheduled meetings a year, with the statement at 2:00 pm ET on the second day and the chair’s press conference at 2:30 pm. The next decisions are due October 28 and December 9, 2026. See <a href="#l-fed">how the Fed works</a>.</li><li><b>Also watched</b>: PCE inflation, PPI, retail sales, the ISM PMIs (10:00 am ET), GDP, and results from the largest companies.</li></ul>',
      '<h3>The surprise is what moves prices</h3><p>Before each report, economists publish forecasts. Their average is the <b>consensus</b>. Traders position for it ahead of time, so the consensus is already in the price. What moves markets is the <b>surprise</b>: the gap between the actual number and the consensus, plus details such as revisions to earlier months, the core number without food and energy, or wage growth.</p><p>The same surprise can push stocks either way. When the market fears inflation, a strong jobs report lifts yields because the Fed may keep rates high, and stocks can fall: good news is bad news. When the market fears a slowdown, the same report eases recession worries and stocks rise.</p>',
      '<h3>How big a move is priced in</h3><p>The options market tells you. Add the prices of the at-the-money call and put that expire just after the event: that pair is a <b>straddle</b>. Its price is roughly the size of the move traders expect. If an index fund trades at $500 and the straddle costs $5, the market is pricing about ±$5, or 1%. A smaller move happens a bit more than half the time; a move twice as big is rarer, but it happens. For the S&amp;P 500, options have priced roughly 0.6% to 1% for recent CPI days and about 1.2% for a jobs report in May 2024. Real moves can be far bigger: on September 13, 2022, a hot CPI report sent the S&amp;P 500 down 4.3% in one day. More in <a href="#l-volatility">volatility and the expected move</a>.</p>',
      '<h3>What reacts first</h3><ul><li><b>The 2-year Treasury yield</b>: the most sensitive to what the Fed will do next. See <a href="#l-rates">rates and yields</a>.</li><li><b>The dollar</b>: higher US yields tend to lift it. See <a href="#l-dollar">the dollar</a>.</li><li><b>Rate-sensitive stocks</b>: fast-growing tech, small companies, homebuilders and real estate move most on rate surprises.</li><li><b>Gold</b>: often dips when inflation-adjusted yields jump. See <a href="#l-gold-silver">gold and silver</a>.</li></ul>',
      '<h3>A release-morning routine</h3><ul><li>Check the calendar the night before and write down the time.</li><li>Do not carry a full-size position with a tight stop into 8:30 am data. A stop becomes a market order: if the price gaps past it, you are filled at the gap.</li><li>Size for a bad open, not just your stop. A move of twice the priced-in move should still fit inside your normal risk (see <a href="#l-position-size">position size</a> and <a href="#l-one-percent">the 1% rule</a>), or wait until after the release.</li><li>Let the first 15 minutes finish, then trade levels with confirmation (see <a href="#l-timeframes">timeframes</a> and <a href="#l-breakouts">breakouts</a>). The first reaction often reverses as people read the details.</li><li>On Fed days the 2:30 pm press conference can undo the 2:00 pm move.</li><li>Buying options just before an event? Implied volatility drops right after the news (<a href="#l-iv-crush">IV crush</a>), so you need a bigger move than priced in to profit.</li></ul>',
    ],
    example: {
      title: 'Sizing a trade on CPI morning',
      intro: 'You trade a $25,000 account and risk 1% ($250) per trade. CPI comes out at 8:30 am ET.',
      steps: [
        'An index fund trades at $500 (example price). The at-the-money straddle costs $5.00, so the market is pricing about ±$5, or 1%.',
        'Your plan: buy with a stop 0.4% ($2) below. Normal sizing gives $250 ÷ $2 = <b>125 shares</b>.',
        'Your stop is well inside the priced-in move. In a simple bell-curve model there is about a 37% chance the open jumps straight past it.',
        'If the print is hot and the fund opens twice the priced-in move lower ($10 a share), 125 shares lose $1,250: <b>5R</b> instead of 1R.',
        'To keep even that bad open within $250, hold $250 ÷ $10 = <b>25 shares</b>, or wait until after 9:45 am and trade the new levels.',
      ],
      result: 'Same idea, sized for the data: a bad open now costs 1R, not 5R.',
    },
    mistakes: [
      'Holding a full-size position with a tight stop through 8:30 am data, as if the stop guaranteed the exit price.',
      'Trading the headline in the first seconds, when spreads are wide and the first move often reverses.',
      'Buying options right before the event and losing money even when the direction was right, because volatility drops after the news.',
      'Assuming hot data is always bad for stocks, or strong jobs always good. The reaction depends on what the market fears that month.',
    ],
    points: [
      'Markets react to the surprise versus the consensus, not the raw number.',
      'The at-the-money straddle shows roughly how big a move is priced in.',
      'Size so an open of twice the priced-in move still fits your normal risk, or wait until after the release.',
      'Watch the 2-year yield and the dollar for the market’s read of the data.',
      'Let the first 15 minutes finish; on Fed days, wait for the press conference.',
    ],
    terms: ['Consensus estimate', 'CPI', 'Nonfarm payrolls', 'FOMC', 'Expected move', 'IV crush'],
    glossary: [
      { t: 'Straddle', d: 'Buying (or selling) a call and a put with the same strike and expiry. Its price shows how big a move the market expects.' },
      { t: 'Hawkish and dovish', d: 'Hawkish means leaning toward higher rates to fight inflation; dovish means leaning toward lower rates to support jobs.' },
    ],
    quiz: {
      q: 'An index fund trades at $400. Just before CPI, the at-the-money straddle costs $6. Roughly what move is priced in?',
      options: ['About ±$6, or 1.5%', 'About ±$12, or 3%', 'About ±$3, or 0.75%'],
      answer: 0,
      why: 'The straddle’s price is roughly the size of the move the options market expects: $6 on $400 is 1.5%.',
    },
    sources: [SRC.blsCpi, SRC.blsJobs, SRC.fomc, SRC.orats, SRC.cpi2022],
  });

  SML.lessons.push({
    id: 'l-earnings-season', course: 'econ', order: 5, title: 'Earnings season and the economy', mins: 9, level: 'Intermediate',
    summary: 'When companies report, what really moves the stock, and how the economy shows up in results.',
    idea: 'Four times a year companies report. The stock reacts to the surprise and the outlook, and the outlook carries the economy inside it.',
    widget: 'earningsSeason',
    try: 'Start with “Beat, but guidance cut”, then switch the guidance to Raised and shrink the run-up. Watch which bar drives the move.',
    extra: [{ widget: 'seasonRhythm', try: 'Pick a quarter and tap the bars: banks open the season, the peak weeks follow, and retailers come last.' }],
    body: [
      '<h3>The rhythm of a season</h3><p>Most US companies report within a few weeks after each quarter ends. The biggest banks usually open the season about two weeks after the quarter closes; the busiest weeks follow, including several of the largest tech companies; big retailers come last because their quarters end a month later. JPMorgan Chase, which traditionally opens the season, has set its Q4 2026 report for Thursday, January 14, 2027, and its 2027 reports for April 13, July 13 and October 12. Each company posts its date on its investor-relations page, and the <a href="#calendar">calendar</a> marks the season openings.</p>',
      '<h3>What a report contains</h3><ul><li><b>EPS</b> (earnings per share) against the analysts’ consensus estimate.</li><li><b>Revenue</b> against its estimate. A beat built on sales is worth more than one built on cost cuts.</li><li><b>Guidance</b>: the company’s forecast for the next quarter or year. This is the future, and prices are built on the future.</li><li><b>Margins and commentary</b>: costs, demand, hiring and investment plans, mostly heard on the conference call.</li></ul><p>Back to basics in <a href="#l-earnings">earnings</a> and <a href="#l-statements">the three statements</a>.</p>',
      '<h3>Why a beat is normal</h3><p>Early in the Q3 2026 season, 84% of S&amp;P 500 companies that had reported beat their EPS estimates, above the 5-year average of 78% and the 10-year average of 77% (FactSet, October 16, 2026). But the average beat was only 2.6%, and only 67% beat on revenue. Companies tend to guide cautiously and analysts trim estimates before reports, so a small beat is the baseline, not good news. What moves the stock is the size of the beat, whether revenue beat too, and whether guidance went up or down, compared with what the stock’s run-up already assumed.</p>',
      '<h3>Where the economy shows up</h3><ul><li><b>Interest rates</b>: borrowing costs for companies, and lending income for banks. See <a href="#l-rates">rates</a>.</li><li><b>The dollar</b>: a strong dollar shrinks foreign sales when they are converted back, a headwind for multinationals. See <a href="#l-dollar">the dollar</a>.</li><li><b>The consumer</b>: retailers, restaurants and card networks describe spending in real time.</li><li><b>Costs</b>: oil, metals, wages and tariffs squeeze or lift margins. See <a href="#l-oil">oil</a>, <a href="#l-copper">copper</a> and <a href="#l-geopolitics">tariffs</a>.</li><li><b>The banks</b> go first and act as a check-up on the economy: loan demand, defaults and consumer credit.</li></ul>',
      '<h3>The index view</h3><p>Over long periods stock prices follow earnings. FactSet put blended growth for Q3 2026 at about 29% as of October 16, led by energy and semiconductors, with about 33% expected for all of 2026. The S&amp;P 500 traded at about 19 times expected earnings for the next 12 months, close to its 10-year average of 19.1, down from 22 at the end of 2025 as bond yields rose. When stocks are priced at a high multiple of earnings, there is less room for disappointment.</p>',
      '<h3>Trading and investing through reports</h3><ul><li>Options price the expected move. Holding through a report means accepting a gap of that size or more, so keep the position small enough (see <a href="#l-data-day">data-release days</a>).</li><li>After the report, implied volatility drops (<a href="#l-iv-crush">IV crush</a>). Option buyers need a move bigger than priced in.</li><li>Big surprises have tended to keep drifting in the same direction for days or weeks after the report, a pattern researchers call post-earnings drift. It is a tendency, not a promise.</li><li>Investors: judge the trend across several quarters (revenue, margins, guidance) rather than one headline.</li></ul>',
    ],
    example: {
      title: 'A beat that still fell',
      intro: 'DEMO is a made-up company. The numbers follow the widget’s first scenario.',
      steps: [
        'DEMO runs up 12% in the weeks before its report, to $150. Options price a move of about ±7%.',
        'After the close it reports EPS of $1.10 against a $1.00 estimate, a 10% beat. Revenue matches the estimate.',
        'It lowers its outlook for next quarter below what analysts expected. In the model, the guidance cut is worth −7 points and the high expectations −3.6 points; the EPS beat adds only +2.5.',
        'The stock opens about 8.1% lower, near $137.85: a bigger drop than the ±7% priced in.',
        'An investor holding 100 shares is down about $1,215 overnight. A trader who bought calls for the beat loses on the price and on the drop in volatility.',
      ],
      result: 'The beat was about the past; the guidance cut changed the future, and the run-up meant good news was already in the price.',
    },
    mistakes: [
      'Reading “beat” in a headline and buying, without checking revenue and guidance.',
      'Holding a large position through a report as if a stop protects you. The stock can open far past it.',
      'Ignoring how far the stock ran before the report. A big run-up raises the bar.',
      'Judging a company on one quarter instead of the trend in revenue, margins and guidance.',
    ],
    points: [
      'Seasons open about two weeks after each quarter ends, with the big banks; retailers report last.',
      'Most companies beat estimates, so the size of the beat, revenue and guidance matter more than the word “beat”.',
      'Guidance carries the economy inside it: rates, the dollar, consumer demand and costs.',
      'Options show the move priced in; size for a gap and remember IV crush.',
    ],
    terms: ['Earnings season', 'EPS', 'Revenue', 'Guidance', 'Consensus estimate', 'IV crush'],
    glossary: [
      { t: 'Beat and raise', d: 'Beating estimates for the quarter and raising guidance for the future. The combination markets like most.' },
      { t: 'Conference call', d: 'The call after a report where executives explain results and answer analysts’ questions.' },
      { t: 'Post-earnings drift', d: 'The tendency of stocks with big earnings surprises to keep moving the same way for a while afterward.' },
    ],
    quiz: {
      q: 'A company beats its EPS estimate by 8% but lowers next quarter’s guidance well below forecasts. What usually matters most for the next-day move?',
      options: ['The 8% EPS beat', 'The lower guidance', 'The size of its dividend'],
      answer: 1,
      why: 'Prices are built on future profits. Guidance changes the future; the beat describes a quarter that is already over.',
    },
    sources: [SRC.factset, SRC.factsetPdf, SRC.jpm],
  });

  SML.lessons.push({
    id: 'l-cycle', course: 'econ', order: 6, title: 'The business cycle, sectors and recessions', mins: 10, level: 'Intermediate',
    summary: 'Expansion, peak, slowdown and recovery: the signals to watch and the sectors that tend to lead.',
    idea: 'Economies move in cycles. A few leading indicators hint at the phase, and different sectors have tended to lead in each one.',
    widget: 'cycleClock',
    try: 'Switch between the presets, then drag the clock hand around to see which sectors have led in each phase.',
    body: [
      '<h3>Four phases</h3><ul><li><b>Early cycle</b>: the economy climbs out of a recession, rates are low and profits rebound fast.</li><li><b>Mid cycle</b>: steady growth, usually the longest phase.</li><li><b>Late cycle</b>: growth slows, inflation and rates are high, margins get squeezed.</li><li><b>Recession</b>: output and jobs fall, and the Fed cuts rates.</li></ul><p>In the US, the National Bureau of Economic Research (NBER) dates recessions, usually many months after they start. From 1945 to 2020 the average expansion lasted about 64 months and the average contraction about 10 months.</p>',
      '<h3>Leading indicators worth watching</h3><ul><li><b>The yield curve</b>: when the 2-year Treasury yields more than the 10-year, the curve is inverted. Inversions came before most past recessions, but the long inversion that started in 2022 has been a false alarm so far. See <a href="#l-rates">rates and the yield curve</a>.</li><li><b>Weekly jobless claims</b>: a steady rise means layoffs are spreading. See <a href="#l-jobs">jobs</a>.</li><li><b>ISM PMI and new orders</b>: below 50 means activity is shrinking. See <a href="#l-pmi">PMI</a>.</li><li><b>The Sahm rule</b>: when the 3-month average unemployment rate rises 0.5 points or more above its low of the past 12 months, past recessions had usually begun.</li></ul><p>Readings in October 2026: the 10-year yield sat 0.33 points above the 2-year (positive but flat), weekly claims were about 199,000, the ISM manufacturing PMI was 54.5 for September, and the Sahm rule read 0.00. No single signal is perfect: the Sahm rule triggered in mid-2024 without a recession.</p>',
      '<h3>Sector rotation</h3><p>Fidelity’s study of US cycles since 1962 found these tendencies. <b>Early cycle</b>: consumer discretionary, real estate, industrials, financials, technology and materials led. <b>Mid cycle</b>: technology. <b>Late cycle</b>: energy (the most consistent), materials, health care, consumer staples and utilities. <b>Recession</b>: consumer staples, utilities and health care. The study covers only seven full cycles. It is a tendency drawn from past cycles, not a rule. Leadership can break the pattern, for example when a technology wave carries one sector through every phase.</p>',
      '<h3>Stocks move before the economy</h3><p>The market looks ahead, so it usually turns before the economic data does:</p><ul><li><b>2007 to 2009</b>: stocks peaked in October 2007, two months before the recession began, and bottomed in March 2009, three months before it ended in June.</li><li><b>2020</b>: the recession ran from February to April 2020; stocks bottomed in March.</li><li><b>1990 to 1991</b>: stocks bottomed in October 1990; the recession ended in March 1991.</li><li><b>2001</b>: the exception. The recession ended in November 2001, but the dot-com bear market kept falling until October 2002.</li></ul><p>Waiting for the economy to look healthy has often meant buying back much higher.</p>',
      '<h3>How to use the cycle</h3><ul><li>Do not bet everything on calling the phase. Single signals give false alarms, and the official recession call comes late.</li><li>Investors: keep a long-term mix and rebalance back to it (see <a href="#l-allocation">asset allocation</a>); keep buying through downturns if your job and emergency fund allow.</li><li>Traders: notice which sectors show relative strength, and cut position size when volatility rises.</li><li>Watch the calendar for the reports that feed these indicators (see <a href="#calendar">the calendar</a>).</li></ul>',
    ],
    example: {
      title: 'Reading a late-cycle dashboard',
      intro: 'Illustrative readings, not today’s data.',
      steps: [
        'Over three months the yield curve goes from −0.4 to +0.6 points as short-term rates fall: after being inverted, it is turning positive again.',
        'Weekly jobless claims climb from 210K to 260K, and the ISM PMI slips to 48: factories are shrinking.',
        'The Sahm rule reads 0.4, close to the 0.5 trigger. Three of the four lights are amber or red, pointing to late cycle.',
        'In past late cycles, energy, health care, consumer staples and utilities tended to hold up better, and stocks often fell before a recession was declared.',
        'Sam’s $100,000 portfolio has drifted to 68% stocks and 32% bonds. Instead of guessing, Sam rebalances to the 60/40 target: sell $8,000 of stocks and buy $8,000 of bonds.',
      ],
      result: 'No forecast needed: the dashboard says “be ready”, and rebalancing puts the plan back in place whatever comes next.',
    },
    mistakes: [
      'Selling everything on one recession signal. Single signals, such as the 2022 to 2024 inversion, have given false alarms.',
      'Waiting for the official recession call. It comes months later, often after stocks have already bottomed.',
      'Chasing the last cycle’s winners without checking whether conditions still match.',
      'Treating sector rotation as a law. It is a tendency, and some cycles break it.',
    ],
    points: [
      'The cycle runs early, mid, late and recession; expansions have lasted far longer than contractions.',
      'Watch several leading indicators together: the yield curve, jobless claims, PMI and the Sahm rule.',
      'Different sectors have tended to lead in different phases, from cyclical early on to defensive late.',
      'Stocks usually turn before the economy does, so waiting for good news often means buying higher.',
    ],
    terms: ['Business cycle', 'Recession', 'Leading indicator', 'Sector rotation', 'Defensive stocks', 'Inverted yield curve'],
    glossary: [
      { t: 'Sahm rule', d: 'A recession signal: the 3-month average unemployment rate rising 0.5 points or more above its low of the previous 12 months.' },
      { t: 'NBER', d: 'The National Bureau of Economic Research, the private nonprofit whose committee officially dates US recessions.' },
    ],
    quiz: {
      q: 'In most past US recessions, when did stocks hit their low?',
      options: ['Before the recession ended', 'Exactly when the recession was declared over', 'About a year after it ended'],
      answer: 0,
      why: 'In 2009 and 2020 stocks bottomed in March, before the June 2009 and April 2020 troughs. 2001 to 2002 was the exception.',
    },
    sources: [SRC.nber, SRC.fidelity, SRC.sahm, SRC.treas, SRC.bears],
  });

  SML._xmkSRC = SRC;
})();
