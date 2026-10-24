/* Stock Market Lessons: Market Basics + Options & the Wheel (fork B) */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const clamp = SML.clamp;
  const $id = (x) => document.getElementById(x);
  const numv = (x) => { const el = $id(x); if (!el || el.value === '') return NaN; return Number(el.value); };

  SML.css(`
    svg .mo-row{cursor:pointer}
    svg .mo-row:hover{fill:var(--accent);opacity:.08}
    .wg-ctrl.mo-fields{grid-template-columns:repeat(auto-fit,minmax(132px,1fr))}
    .mo-fld-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
    .mo-fld-top .linkish{font:500 12px var(--sans);text-transform:none;letter-spacing:0}
    .mo-log{max-height:260px;overflow:auto}
    .mo-log .tbl th,.mo-log .tbl td{padding:7px 10px;font-size:13px;white-space:nowrap}
    .mo-log .empty{padding:14px 16px;font-size:14px;color:var(--muted)}
    .mo-preview{font:500 13px/1.4 var(--mono);color:var(--muted);flex:1 1 220px;min-width:0}
    .mo-preview b{color:var(--ink)}
    .mo-table .tbl td,.mo-table .tbl th{white-space:nowrap}
    .mo-table .tbl td.up{color:var(--up)} .mo-table .tbl td.dn{color:var(--down)}
    .mo-ctlgroup{display:flex;flex-direction:column;gap:6px;min-width:0}
    .wg-read.mo-r4,.wg-read.mo-r6{grid-template-columns:repeat(2,minmax(0,1fr))}
    @media (min-width:640px){.wg-read.mo-r4{grid-template-columns:repeat(4,minmax(0,1fr))}.wg-read.mo-r6{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media (min-width:1080px){.wg-read.mo-r6{grid-template-columns:repeat(6,minmax(0,1fr))}}
    svg text.mo-halo{paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
  `);

  /* ---------------- shared helpers ---------------- */
  function stat(id, txt, cls) { const el = $id(id); if (!el) return; el.textContent = txt; el.className = 'stat-v' + (cls ? ' ' + cls : ''); }
  function msg(id, cls, pill, html) { const el = $id(id); if (el) el.innerHTML = ui.msg(cls, pill, html); }
  const tone = (v) => (v > 0.005 ? 'up' : v < -0.005 ? 'dn' : '');
  const money = (v) => F.usd(v, 2);
  const usd0 = (v) => F.usd0(v);
  const pf2 = (v) => v.toFixed(2) + '%';

  /* polyline split into green/red segments by the sign of the value */
  function plLines(xs, vs, xf, yf, w) {
    let s = '';
    for (let i = 0; i < xs.length - 1; i++) {
      const v0 = vs[i], v1 = vs[i + 1], x0 = xf(xs[i]), x1 = xf(xs[i + 1]);
      if ((v0 >= 0) === (v1 >= 0)) s += S.line(x0, yf(v0), x1, yf(v1), (v0 + v1 >= 0 ? 's-up ' : 's-dn ') + w);
      else {
        const t = v0 / (v0 - v1), xm = x0 + t * (x1 - x0);
        s += S.line(x0, yf(v0), xm, yf(0), (v0 >= 0 ? 's-up ' : 's-dn ') + w) + S.line(xm, yf(0), x1, yf(v1), (v1 >= 0 ? 's-up ' : 's-dn ') + w);
      }
    }
    return s;
  }
  function plAreas(xs, vs, xf, yf) {
    return S.area(xs.map((x, i) => [xf(x), yf(Math.max(0, vs[i]))]), yf(0), 'f-up-t') + S.area(xs.map((x, i) => [xf(x), yf(Math.min(0, vs[i]))]), yf(0), 'f-dn-t');
  }
  function yGrid(lo, hi, yf, x0, x1, fmtFn, n) {
    return SML.ticks(lo, hi, n || 4).map((v) => S.line(x0, yf(v), x1, yf(v), 's-grid') + S.text(x0 - 6, yf(v) + 4, fmtFn(v), 'xs mono', 'end')).join('');
  }
  /* tooltip box; lines: [{t, cls}] */
  function tip(xa, yTop, lines, W, minX) {
    const w = Math.max.apply(null, lines.map((l) => l.t.replace(/<[^>]+>/g, '').length)) * 6.9 + 18, h = lines.length * 16 + 10;
    let x = xa + 12; if (x + w > W - 2) x = xa - 12 - w; x = Math.max(minX || 2, x);
    let s = S.rect(x, yTop, w, h, 'tipbg', 4);
    lines.forEach((l, i) => { s += S.text(x + 9, yTop + 18 + i * 16, l.t, l.cls || 'sm mono ink'); });
    return s;
  }
  /* pointer scrubbing over a figure: press/drag everywhere, hover for mouse if o.hover */
  function scrub(fig, onPt, o) {
    o = o || {}; let down = false;
    const at = (e) => { const svg = fig.querySelector('svg'); if (svg) onPt(ui.pt(svg, e), e); };
    fig.addEventListener('pointerdown', (e) => { if (e.button > 0) return; down = true; try { fig.setPointerCapture(e.pointerId); } catch (x) {} at(e); });
    fig.addEventListener('pointermove', (e) => { if (down || (o.hover && e.pointerType === 'mouse')) at(e); });
    const up = () => { down = false; };
    fig.addEventListener('pointerup', up); fig.addEventListener('pointercancel', up);
    if (o.leave) fig.addEventListener('pointerleave', () => { if (!down) o.leave(); });
  }
  function payoff(S0, K, type, side, prem) { const intr = type === 'call' ? Math.max(0, S0 - K) : Math.max(0, K - S0); return (side === 'buy' ? 1 : -1) * (intr - prem); }

  /* =====================================================================
     1. ownershipLab: a company as 100 blocks of shares
     ===================================================================== */
  SML.widgets.ownershipLab = function (root) {
    const id = SML.uid('own'), TOTAL = 100000;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-sc', [{ v: 'now', label: 'Today' }, { v: 'grow', label: 'Company grows' }, { v: 'bad', label: 'Company struggles' }], 'now', 'Scenario')}<span class="grow"></span>${ui.chips(id + '-dv', [{ k: 'div', label: 'Pays a dividend', color: 'var(--accent)' }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-sh', label: 'Shares you buy', min: 10, max: 10000, step: 10, value: 500, fmt: 'num' })}${ui.slider({ id: id + '-px', label: 'Price per share today', min: 5, max: 100, step: 1, value: 20, fmt: 'usd0' })}</div>
      <div class="wg-read mo-r4">${ui.stat('You own', id + '-pct')}${ui.stat('Your shares are worth', id + '-val', 'hl')}${ui.stat('Change', id + '-chg')}${ui.stat('Yearly dividend', id + '-div')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Sample company with 100,000 shares. Each block is 1% of the business (1,000 shares). Scenarios are made-up examples one year out.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const sh = st.n(id + '-sh'), px = st.n(id + '-px'), sc = st.seg(id + '-sc'), dv = st.on(id + '-dv', 'div');
      const mult = sc === 'grow' ? 1.6 : sc === 'bad' ? 0.55 : 1, px2 = px * mult;
      const compact = W < 520;
      const H = compact ? 236 : Math.round(clamp(W * 0.4, 260, 310));
      const g = Math.min(H - 40, compact ? W * 0.5 : W * 0.42, 280);
      const cell = g / 10, gap = Math.max(1.5, cell * 0.1), gx = 2, gy = 28;
      let b = S.text(gx, 14, compact ? '100,000 SHARES' : 'THE COMPANY · 100,000 SHARES', 'cap');
      const blocks = sh / 1000;
      for (let i = 0; i < 100; i++) {
        const r = Math.floor(i / 10), c = i % 10, x = gx + c * cell + gap / 2, y = gy + r * cell + gap / 2, s = cell - gap;
        b += S.rect(x, y, s, s, 'f-shade2', 2);
        const own = clamp(blocks - i, 0, 1);
        if (own > 0) b += S.rect(x, y, Math.max(2, s * own), s, 'f-acc', own < 0.3 ? 0 : 2);
      }
      const x0 = gx + g + (compact ? 16 : 34);
      const valCls = sc === 'now' ? 'ink' : sc === 'grow' ? 'up' : 'dn';
      const rows = [['COMPANY VALUE', usd0(TOTAL * px2), 'ink'], ['YOUR SLICE', F.pct(sh / TOTAL * 100, 2), 'acc'], ['YOUR SHARES', usd0(sh * px2), valCls]];
      let y = gy + 10;
      rows.forEach((r, i) => {
        b += S.text(x0, y, r[0], 'cap');
        if (i === 1) b += S.rect(x0 + r[0].length * 7.4 + 4, y - 8.5, 9, 9, 'f-acc', 1);
        b += S.text(x0, y + (compact ? 21 : 24), r[1], (compact ? 'lg' : 'xl') + ' mono b ' + r[2]);
        y += compact ? 46 : 50;
      });
      // one-year price sketch
      const sy0 = y - 6, sy1 = H - 8, sw = W - x0 - 4;
      if (sc !== 'now' && sy1 - sy0 > 30) {
        const pts = SML.data.path([[0, px], [9, px * (1 + (mult - 1) * 0.25)], [20, px * (1 + (mult - 1) * 0.75)], [29, px2]], 30, 13, px * 0.02);
        const lo = Math.min.apply(null, pts.concat([px, px2])), hi = Math.max.apply(null, pts.concat([px, px2]));
        const xs = SML.lin(0, 29, x0, x0 + sw - (compact ? 4 : 70)), ys = SML.lin(lo, hi, sy1 - 4, sy0 + 14);
        b += S.text(x0, sy0 + 4, 'PRICE, NEXT 12 MONTHS', 'cap');
        b += S.poly(pts.map((p, i) => [xs(i), ys(p)]), (sc === 'grow' ? 's-up' : 's-dn') + ' w2');
        b += S.circle(xs(29), ys(px2), 3.5, sc === 'grow' ? 'f-up' : 'f-dn');
        if (!compact) b += S.text(xs(29) + 8, ys(px2) + 4, money(px2), 'sm mono b ' + valCls);
      } else if (sc === 'now' && sy1 - sy0 > 30) {
        b += S.text(x0, sy0 + 10, compact ? 'Pick a scenario' : 'Pick a scenario above to look', 'sm mut');
        b += S.text(x0, sy0 + 25, compact ? 'to look ahead.' : 'one year ahead.', 'sm mut');
      }
      fig.innerHTML = S.wrap(W, H, `A company drawn as 100 blocks. You own ${F.pct(sh / TOTAL * 100, 2)}, shaded amber.`, b);
      const divYear = sh * px * 0.03;
      stat(id + '-pct', F.pct(sh / TOTAL * 100, 2));
      stat(id + '-val', usd0(sh * px2));
      stat(id + '-chg', sc === 'now' ? '$0' : F.susd(sh * (px2 - px), 0), tone(px2 - px));
      stat(id + '-div', dv ? usd0(divYear) + ' / yr' : 'None');
      const divTxt = dv ? ` The dividend pays you about ${usd0(divYear)} a year in cash (3% of today's price).` + (sc === 'bad' ? ' Struggling companies often cut dividends.' : '') : '';
      if (sc === 'now') msg(id + '-msg', 'acc', 'Owner', `Your ${F.num(sh)} shares are ${F.pct(sh / TOTAL * 100, 2)} of the business and cost ${usd0(sh * px)}. You now share in its profits and its risks.` + divTxt);
      else if (sc === 'grow') msg(id + '-msg', 'up', 'Grows', `Profits rise, buyers will pay more, and the price climbs to ${money(px2)}. Your shares are now worth ${usd0(sh * px2)} (${F.susd(sh * (px2 - px), 0)}).` + divTxt);
      else msg(id + '-msg', 'dn', 'Struggles', `Sales slump and the price drops to ${money(px2)}. Your shares are worth ${usd0(sh * px2)} (${F.susd(sh * (px2 - px), 0)}). If a company fails, its shares can go to zero.` + divTxt);
    });
  };

  /* =====================================================================
     2. bondSeesaw: rates up, prices down
     ===================================================================== */
  function bondPrice(face, cpn, n, r) { let p = 0; for (let t = 1; t <= n; t++) p += (face * cpn) / Math.pow(1 + r, t); return p + face / Math.pow(1 + r, n); }
  SML.widgets.bondSeesaw = function (root) {
    const id = SML.uid('bd');
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-m', label: 'Market interest rate', min: 1, max: 9, step: 0.25, value: 5.5, fmt: pf2 })}${ui.slider({ id: id + '-c', label: "This bond's coupon", min: 1, max: 8, step: 0.25, value: 4, fmt: pf2 })}${ui.slider({ id: id + '-y', label: 'Years to maturity', min: 1, max: 30, step: 1, value: 10, fmt: 'yrs' })}</div>
      <div class="wg-read mo-r4">${ui.stat('Bond price', id + '-p', 'hl')}${ui.stat('Vs $1,000 face', id + '-d')}${ui.stat('Coupon per year', id + '-c2')}${ui.stat('Yield if bought now', id + '-yl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Face value $1,000, one coupon a year. Bars are to scale: light = cash paid to you, solid = what that future cash is worth today.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const m = st.n(id + '-m') / 100, cpn = st.n(id + '-c') / 100, n = st.n(id + '-y');
      const price = bondPrice(1000, cpn, n, m);
      const compact = W < 520;
      const H = Math.round(clamp(W * 0.56, 330, 390));
      const cx = W / 2, cy = 130, Lp = Math.min(W * 0.36, 220);
      const th = (clamp((m - cpn) * 100 * 3.2, -16, 16) * Math.PI) / 180;
      const lx = cx - Lp * Math.cos(th), ly = cy - Lp * Math.sin(th), rx = cx + Lp * Math.cos(th), ry = cy + Lp * Math.sin(th);
      const pr = [Math.sin(th) * 14, -Math.cos(th) * 14];
      let b = '';
      b += S.polygon([[cx, cy + 3], [cx - 17, cy + 32], [cx + 17, cy + 32]], 'f-mut');
      b += S.line(cx - 44, cy + 32, cx + 44, cy + 32, 's-mut w2');
      b += S.line(lx, ly, rx, ry, 's-ink w4');
      b += S.circle(lx + pr[0], ly + pr[1], 12, 'f-info') + S.circle(rx + pr[0], ry + pr[1], 12, 'f-acc');
      const up = th > 0.001, dn = th < -0.001;
      const lArrow = up ? '▲ ' : dn ? '▼ ' : '', rArrow = up ? '▼ ' : dn ? '▲ ' : '';
      const lxLab = clamp(lx, compact ? 46 : 60, W / 2 - 50), rxLab = clamp(rx, W / 2 + 50, W - (compact ? 46 : 60));
      b += S.text(lxLab, ly - 52, 'MARKET RATE', 'cap', 'middle');
      b += S.text(lxLab, ly - 33, `${lArrow}${pf2(m * 100)}`, (compact ? 'lg' : 'xl') + ' mono b info', 'middle');
      b += S.text(rxLab, ry - 52, 'BOND PRICE', 'cap', 'middle');
      b += S.text(rxLab, ry - 33, `${rArrow}${usd0(price)}`, (compact ? 'lg' : 'xl') + ' mono b acc', 'middle');
      b += S.text(cx, cy + 52, `This bond pays ${pf2(cpn * 100)}: ${usd0(1000 * cpn)} a year`, 'sm ink', 'middle');
      // cash-flow timeline
      const yb = H - 22, top = cy + 74, hb = yb - top - 22;
      const sc = hb / (1000 * (1 + cpn));
      const slot = (W - 24) / n, bw = clamp(slot * 0.62, 2, 18);
      for (let t = 1; t <= n; t++) {
        const nom = 1000 * cpn + (t === n ? 1000 : 0), pv = nom / Math.pow(1 + m, t);
        const x = 12 + slot * (t - 0.5);
        b += S.rect(x - bw / 2, yb - nom * sc, bw, Math.max(1, nom * sc), 'f-acc-t', 1);
        b += S.rect(x - bw / 2, yb - pv * sc, bw, Math.max(1, pv * sc), 'f-acc', 1);
        if (t === n) {
          const anc = n === 1 ? 'middle' : 'end', lx2 = n === 1 ? x : x + bw / 2;
          b += S.text(lx2, yb - nom * sc - 18, `${usd0(nom)} in year ${n}`, 'sm b ink', anc);
          b += S.text(lx2, yb - nom * sc - 5, `worth ${usd0(pv)} today`, 'sm acc', anc);
        }
      }
      b += S.line(8, yb + 0.5, W - 8, yb + 0.5, 's-line');
      b += S.text(12, yb + 15, 'Year 1', 'xs');
      if (n > 1) b += S.text(W - 12, yb + 15, `Year ${n}`, 'xs', 'end');
      if (n > 2) b += S.text(12, top - 2, `${usd0(1000 * cpn)} coupons`, 'sm');
      fig.innerHTML = S.wrap(W, H, `Seesaw: market rate ${pf2(m * 100)} versus bond price ${usd0(price)}, with the bond's cash flows below.`, b);
      stat(id + '-p', money(price));
      stat(id + '-d', F.susd(price - 1000, 0), tone(price - 1000));
      stat(id + '-c2', usd0(1000 * cpn));
      stat(id + '-yl', pf2(m * 100));
      const longTxt = n >= 10 ? ` Long bonds like this ${n}-year one swing more when rates move.` : ` Short bonds like this ${n}-year one barely react to rate changes.`;
      if (Math.abs(m - cpn) < 1e-9) msg(id + '-msg', 'acc', 'At par', `New bonds pay the same ${pf2(m * 100)} as this one, so it trades at its $1,000 face value.` + longTxt);
      else if (m > cpn) msg(id + '-msg', 'dn', 'Discount', `New bonds pay ${pf2(m * 100)}, more than this bond's ${pf2(cpn * 100)}. Nobody pays full price for the lower coupon, so its price falls to ${usd0(price)}, where a buyer still earns ${pf2(m * 100)} a year.` + longTxt);
      else msg(id + '-msg', 'up', 'Premium', `New bonds pay only ${pf2(m * 100)}. This bond's ${pf2(cpn * 100)} coupon is more attractive, so buyers pay up to ${usd0(price)} for it.` + longTxt);
    });
  };

  /* =====================================================================
     3. diversifyLab: 1 vs 10 vs 500 holdings
     ===================================================================== */
  SML.widgets.diversifyLab = function (root) {
    const id = SML.uid('dv');
    let crashed = false, t = 0, raf = 0;
    SML.onCleanup(() => cancelAnimationFrame(raf));
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-n', [{ v: 1, label: '1 company' }, { v: 10, label: '10 companies' }, { v: 500, label: '500 companies' }], 10, 'Number of holdings')}</div>
      <div class="wg-fig"></div>
      <div class="wg-read mo-r4">${ui.stat('Each holding', id + '-each')}${ui.stat('Crashed company', id + '-cr')}${ui.stat('Portfolio value', id + '-val', 'hl')}${ui.stat('Change', id + '-chg')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-dn sm" id="${id}-go">Crash one company 50%</button><button type="button" class="btn btn-g sm" id="${id}-rs" disabled>Reset</button></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const go = $id(id + '-go'), rs = $id(id + '-rs');
    go.addEventListener('click', () => {
      if (crashed) return; crashed = true; go.disabled = true; rs.disabled = false;
      if (SML.reduced()) { t = 1; draw(); return; }
      const t0 = performance.now();
      const step = (ts) => { t = Math.min(1, (ts - t0) / 650); draw(); if (t < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    });
    rs.addEventListener('click', () => { cancelAnimationFrame(raf); crashed = false; t = 0; go.disabled = false; rs.disabled = true; draw(); });
    const draw = ui.responsive(fig, (W) => {
      const n = Number(st.seg(id + '-n')), each = 10000 / n, ci = n === 1 ? 0 : n === 10 ? 3 : 137;
      const loss = each * 0.5 * t, val = 10000 - loss;
      const compact = W < 560;
      const H = compact ? 292 : Math.round(clamp(W * 0.36, 250, 290));
      const ay = 24, aw = compact ? W : W - 170, ah = compact ? 172 : H - 34;
      const cols = n === 1 ? 1 : n === 10 ? 5 : 25, rows = n === 1 ? 1 : n === 10 ? 2 : 20;
      const cw = aw / cols, chh = ah / rows;
      const r = Math.min(cw, chh) * (n === 1 ? 0.42 : n === 10 ? 0.34 : 0.36);
      let b = S.text(0, 14, 'YOUR $10,000, SPLIT EQUALLY', 'cap');
      for (let i = 0; i < n; i++) {
        const cx = (i % cols + 0.5) * cw, cy = ay + (Math.floor(i / cols) + 0.5) * chh - (n === 10 ? 8 : 0);
        const isC = i === ci && t > 0;
        const rr = isC ? r * (1 - (1 - Math.SQRT1_2) * t) : r;
        b += S.circle(cx, cy, Math.max(1.2, rr), isC ? 'f-dn' : n === 500 ? 'f-info o70' : 'f-info');
        if (n === 1) {
          b += S.text(cx, cy - 2, usd0(each - (isC ? loss : 0)), 'xl mono b on', 'middle');
          b += S.text(cx, cy + 18, 'one company', 'sm on', 'middle');
        } else if (n === 10) {
          b += S.text(cx, cy + r + 15, usd0(each - (isC ? loss : 0)), 'sm mono ' + (isC ? 'dn b' : 'ink'), 'middle');
        }
      }
      if (n === 500 && t > 0) {
        const cx = (ci % cols + 0.5) * cw, cy = ay + (Math.floor(ci / cols) + 0.5) * chh;
        b += S.circle(cx, cy, r + 5, 'nf s-dn w2');
      }
      if (!compact) {
        const bx = W - 140, bw2 = 46, by = ay, bh = ah;
        const fy = by + (1 - val / 10000) * bh;
        b += S.text(bx, 14, 'PORTFOLIO', 'cap');
        b += S.rect(bx, by, bw2, bh, 'f-surf s-line w1', 3);
        b += S.rect(bx, by, bw2, fy - by, 'f-dn-t', 2);
        b += S.rect(bx, fy, bw2, by + bh - fy, 'f-info', 2);
        b += S.text(bx + bw2 + 10, fy + 14, usd0(val), 'md mono b ink');
        if (loss > 0) b += S.text(bx + bw2 + 10, fy + 30, F.susd(-loss, 0), 'sm mono b dn');
      } else {
        const by = ay + ah + 30, bh2 = 24, fw = (val / 10000) * W;
        b += S.text(0, by - 8, 'PORTFOLIO', 'cap');
        b += S.text(W, by - 8, usd0(val) + (loss > 0 ? '  ' + F.susd(-loss, 0) : ''), 'sm mono b ' + (loss > 0 ? 'dn' : 'ink'), 'end');
        b += S.rect(0, by, W, bh2, 'f-dn-t', 3);
        b += S.rect(0, by, fw, bh2, 'f-info', 3);
      }
      fig.innerHTML = S.wrap(W, H, `Your $10,000 split across ${n} companies. Portfolio value ${usd0(val)}.`, b);
      stat(id + '-each', usd0(each) + ` (${F.pct(100 / n, n === 500 ? 1 : 0)})`);
      stat(id + '-val', usd0(val));
      stat(id + '-cr', t > 0 ? `${usd0(each)} → ${usd0(each - loss)}` : 'None yet', t > 0 ? 'dn' : '');
      stat(id + '-chg', t > 0 ? F.susd(-loss, 0) + ` (${F.spct(-loss / 100, loss < 100 ? 1 : 0)})` : '$0', t > 0 ? 'dn' : '');
      if (!crashed) msg(id + '-msg', 'acc', n + (n === 1 ? ' holding' : ' holdings'), `Each company is ${F.pct(100 / n, n === 500 ? 1 : 0)} of your money. Press the red button to see what one disaster does.`);
      else {
        const L = 10000 / n * 0.5;
        if (n === 1) msg(id + '-msg', 'dn', 'Ouch', `All your money is in one company. When it halves, you lose ${usd0(L)}: half of everything.`);
        else if (n === 10) msg(id + '-msg', 'acc', 'Dent', `That company was 10% of your money. Losing half of it costs ${usd0(L)}, or 5%. Painful, but you recover.`);
        else msg(id + '-msg', 'up', 'Barely felt', `That company was 0.2% of your money. Losing half of it costs ${usd0(L)}, or 0.1%. This is why index funds are the core of most portfolios.`);
      }
    });
  };

  /* =====================================================================
     4. riskLadder: from calm to wild
     ===================================================================== */
  const LADDER = [
    { k: 'cash', name: 'Cash', sub: 'savings', bad: 0, good: 4, badTxt: 'Cash in a savings account does not drop in dollars, but inflation slowly eats what it can buy.', goodTxt: 'A good savings rate pays a few percent a year. Safe and steady, with little growth.' },
    { k: 'bonds', name: 'Bonds', sub: 'bond fund', bad: -13, good: 10, badTxt: 'US bonds fell about 13% in 2022 when interest rates jumped. Rare, but it happens.', goodTxt: 'A good year for bonds is around +10%, usually when interest rates fall.' },
    { k: 'index', name: 'Index fund', sub: 'S&P 500 fund', bad: -37, good: 32, badTxt: 'The S&P 500 fell about 37% in 2008. Holding on through that took nerves and years.', goodTxt: 'Strong years have returned 30% or more. Over decades the index has trended up, with deep dips along the way.' },
    { k: 'stock', name: 'One stock', sub: 'one company', bad: -100, good: 150, badTxt: 'A single company can go bankrupt. Its shares can go to zero.', goodTxt: 'A single winner can double or more in a year. Picking it in advance is the hard part.' },
    { k: 'opt', name: 'Options', sub: 'calls / puts', bad: -100, good: 400, badTxt: 'Most short-dated options that people buy expire worthless: −100% in weeks.', goodTxt: 'A well-timed option can return several times its cost. That is why people chase them, and why most lose.' },
  ];
  SML.widgets.riskLadder = function (root) {
    const id = SML.uid('rl');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-a', LADDER.map((a) => ({ v: a.k, label: a.name })), 'index', 'Investment')}${ui.seg(id + '-yr', [{ v: 'bad', label: 'Bad year' }, { v: 'good', label: 'Good year' }], 'bad', 'Kind of year')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-amt', label: 'Amount invested', min: 1000, max: 50000, step: 1000, value: 10000, fmt: 'usd0' })}</div>
      <div class="wg-read mo-r4">${ui.stat('Risk level', id + '-lv')}${ui.stat('One-year range', id + '-rg')}${ui.stat('Could become', id + '-cb', 'hl')}${ui.stat('Gain or loss', id + '-gl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Illustrative one-year ranges based on past extremes, not forecasts. Tap a row to pick it.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    fig.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('[data-k]'); if (t) { st.setSeg(id + '-a', t.getAttribute('data-k')); draw(); } });
    const draw = ui.responsive(fig, (W) => {
      const sel = st.seg(id + '-a'), yr = st.seg(id + '-yr'), amt = st.n(id + '-amt');
      const compact = W < 520;
      const LW = compact ? 78 : 120, rowH = 48, top = 10;
      const H = top + LADDER.length * rowH + 28;
      const xf = SML.lin(-100, 150, LW + 14, W - (compact ? 26 : 40));
      let b = '';
      const yEnd = top + LADDER.length * rowH;
      [-100, -50, 0, 50, 100, 150].forEach((v) => {
        if (compact && (v === -50 || v === 50)) return;
        b += S.line(xf(v), top, xf(v), yEnd, v === 0 ? 's-mut w15' : 's-grid');
        b += S.text(xf(v), yEnd + 16, (v > 0 ? '+' : v < 0 ? F.minus : '') + Math.abs(v) + '%', 'xs mono', 'middle');
      });
      LADDER.forEach((a, i) => {
        const yc = top + i * rowH + rowH / 2, on = a.k === sel;
        if (on) b += S.rect(0, yc - rowH / 2 + 3, W, rowH - 6, 'f-acc-t', 4);
        b += S.text(LW, yc - 1, a.name, 'md ' + (on ? 'b ink' : 'ink'), 'end');
        b += S.text(LW, yc + 13, a.sub, 'xs', 'end');
        const fade = on ? '' : ' o35';
        if (a.bad < 0) b += S.rect(xf(a.bad), yc - 7, xf(0) - xf(a.bad), 14, 'f-dn' + fade, 2);
        const gx = xf(Math.min(a.good, 150));
        b += S.rect(xf(0), yc - 7, gx - xf(0), 14, 'f-up' + fade, 2);
        if (a.good > 150) {
          b += S.polygon([[gx + 2, yc - 9], [gx + 11, yc], [gx + 2, yc + 9]], 'f-up' + fade);
          if (!compact) b += S.text(gx + 14, yc + 4, '+' + a.good + '%', 'xs mono up');
        }
        if (on) {
          const v = yr === 'bad' ? a.bad : a.good, xm = xf(clamp(v, -100, 150));
          b += S.circle(xm, yc, 7, 'f-ink');
          b += S.circle(xm, yc, 3, 'f-surf');
          const lab = `${F.spct(v, 0)} → ${usd0(amt * (1 + v / 100))}`;
          const lw = lab.length * 7;
          let lxp = xm, anc = 'middle';
          if (xm - lw / 2 < LW + 10) { lxp = Math.max(xm - 8, LW + 10); anc = 'start'; }
          if (xm + lw / 2 > W - 2) { lxp = W - 2; anc = 'end'; }
          b += S.text(lxp, yc - 12, lab, 'sm mono b ' + (v < 0 ? 'dn' : 'up'), anc);
        }
        b += S.rect(0, yc - rowH / 2, W, rowH, 'hit mo-row', 0, ` data-k="${a.k}"`);
      });
      fig.innerHTML = S.wrap(W, H, 'Risk ladder: illustrative one-year ranges for cash, bonds, an index fund, one stock and options.', b);
      const a = LADDER.find((x) => x.k === sel), v = yr === 'bad' ? a.bad : a.good;
      const li = LADDER.indexOf(a);
      stat(id + '-lv', ['Very low', 'Low', 'Medium', 'High', 'Extreme'][li] + ` (${li + 1}/5)`, li >= 3 ? 'dn' : li === 2 ? 'acc' : 'up');
      stat(id + '-rg', `${F.spct(a.bad, 0)} to ${F.spct(a.good, 0)}${a.good > 150 ? '+' : ''}`);
      stat(id + '-cb', usd0(amt * (1 + v / 100)));
      stat(id + '-gl', F.susd((amt * v) / 100, 0), tone(v));
      msg(id + '-msg', yr === 'bad' ? (a.bad < 0 ? 'dn' : 'acc') : 'up', a.name, yr === 'bad' ? a.badTxt : a.goodTxt);
    });
  };

  /* =====================================================================
     5/7. optionPayoff: simple (buy call / buy put) or full builder
     ===================================================================== */
  SML.widgets.optionPayoff = function (root, opts) {
    opts = opts || {};
    const simple = !!opts.simple, id = SML.uid('po'), S0 = 100;
    let override = false, xfLast = null;
    const bar = simple
      ? ui.seg(id + '-ty', [{ v: 'call', label: 'Buy a call' }, { v: 'put', label: 'Buy a put' }], 'call', 'Option type')
      : ui.seg(id + '-sd', [{ v: 'buy', label: 'Buy' }, { v: 'sell', label: 'Sell' }], 'buy', 'Buy or sell') + ui.seg(id + '-ty', [{ v: 'call', label: 'Call' }, { v: 'put', label: 'Put' }], 'call', 'Call or put');
    const pxSlider = ui.slider({ id: id + '-px', label: 'Stock price at expiration', min: 70, max: 130, step: 0.5, value: 110, fmt: 'usd' });
    const ctrl = simple ? pxSlider
      : ui.slider({ id: id + '-k', label: 'Strike', min: 80, max: 120, step: 1, value: 100, fmt: 'usd0' }) +
        ui.slider({ id: id + '-d', label: 'Days to expiration', min: 1, max: 90, step: 1, value: 30, fmt: 'days' }) +
        ui.slider({ id: id + '-iv', label: 'Implied volatility', min: 10, max: 100, step: 1, value: 30, fmt: 'pct' }) + pxSlider +
        `<div class="fld"><span class="mo-fld-top"><label for="${id}-pr">Premium per share</label><button type="button" class="linkish" id="${id}-mdl" hidden>Use model price</button></span><input id="${id}-pr" type="number" inputmode="decimal" step="0.01" min="0" value="3.59"></div>`;
    root.innerHTML = `
      <div class="wg-bar">${bar}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ctrl}</div>
      <div class="wg-read ${simple ? 'mo-r4' : 'mo-r6'}">${ui.stat('Premium', id + '-pr2')}${ui.stat('Breakeven', id + '-be')}${simple ? '' : ui.stat('Max profit', id + '-mp')}${ui.stat('Max loss', id + '-ml')}${simple ? '' : ui.stat('Chance ITM (model)', id + '-pi')}${ui.stat('P/L at marker', id + '-at', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">${simple ? 'Stock $100 now, strike $100, 30 days, premium from the pricing model. The line shows profit or loss for one contract on expiration day. Hover, tap or drag the chart to move the marker.' : 'Solid line: profit or loss for one contract at expiration. Dashed blue line: the same trade valued today. Hover, tap or drag the chart to move the marker. Premium comes from the Black-Scholes model; type a quote to override it.'}</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      if (t && t.id === id + '-pr') override = true;
      if (t && t.closest && t.closest('#' + id + '-ty')) st.set(id + '-px', st.seg(id + '-ty') === 'call' ? 110 : 90);
      draw();
    });
    if (!simple) $id(id + '-mdl').addEventListener('click', () => { override = false; draw(); });
    scrub(fig, (pt) => { if (!xfLast) return; st.set(id + '-px', clamp(Math.round(xfLast.inv(pt.x) * 2) / 2, 70, 130)); draw(); }, { hover: true });
    const params = () => {
      const type = st.seg(id + '-ty'), side = simple ? 'buy' : st.seg(id + '-sd');
      const K = simple ? 100 : st.n(id + '-k'), days = simple ? 30 : st.n(id + '-d'), iv = simple ? 0.3 : st.n(id + '-iv') / 100;
      const model = SML.bs(S0, K, days, iv, 0.04, type).price;
      let prem = model;
      if (!simple) {
        const pr = $id(id + '-pr'), v = numv(id + '-pr');
        if (override && isFinite(v) && v >= 0) prem = v;
        else if (!override || pr.value === '') { if (document.activeElement !== pr) pr.value = model.toFixed(2); }
        $id(id + '-mdl').hidden = !override;
      }
      return { type, side, K, days, iv, prem, px: st.n(id + '-px') };
    };
    const draw = ui.responsive(fig, (W) => {
      const p = params(), { type, side, K, days, iv, prem, px } = p;
      const sg = side === 'buy' ? 1 : -1;
      const compact = W < 480;
      const H = Math.round(clamp(W * 0.5, 260, 340));
      const L = compact ? 48 : 58, Rm = 12, T = 14, B = 30;
      const xf = SML.lin(70, 130, L, W - Rm); xfLast = xf;
      const xs = [], ve = [], vt = [];
      for (let i = 0; i <= 150; i++) { const s = 70 + (60 * i) / 150; xs.push(s); ve.push(payoff(s, K, type, side, prem) * 100); if (!simple) vt.push(sg * (SML.bs(s, K, days, iv, 0.04, type).price - prem) * 100); }
      let lo = Math.min(0, ...ve, ...(vt.length ? vt : [0])), hi = Math.max(0, ...ve, ...(vt.length ? vt : [0]));
      const pad = (hi - lo) * 0.1 || 100; lo -= pad; hi += pad;
      const yf = SML.lin(lo, hi, H - B, T);
      let b = yGrid(lo, hi, yf, L, W - Rm, (v) => F.usd0(v), 4);
      [70, 80, 90, 100, 110, 120, 130].forEach((v) => { if (compact && v % 20 !== 10 && v !== 100) return; b += S.text(xf(v), H - B + 17, '$' + v, 'xs mono', 'middle'); });
      b += plAreas(xs, ve, xf, yf);
      b += S.line(L, yf(0), W - Rm, yf(0), 's-ink w1');
      b += S.line(xf(K), T, xf(K), H - B, 's-mut dash2');
      b += S.text(xf(K) + 4, T + 10, 'strike', 'xs');
      if (!simple) b += S.poly(xs.map((x, i) => [xf(x), yf(vt[i])]), 's-info w15 dash');
      b += plLines(xs, ve, xf, yf, 'w25');
      const be = type === 'call' ? K + prem : K - prem;
      if (be > 70 && be < 130) {
        b += S.circle(xf(be), yf(0), 4.5, 'f-surf s-ink w15');
        const lab = 'breakeven ' + money(be), lw = lab.length * 6.6;
        let bx = xf(be) + 7, anc = 'start'; if (bx + lw > W - Rm) { bx = xf(be) - 7; anc = 'end'; }
        const above = (type === 'call') === (side === 'buy');
        b += S.text(bx, yf(0) + (above ? -8 : 16), lab, 'sm b ink mo-halo', anc);
      }
      b += S.polygon([[xf(S0), H - B], [xf(S0) - 5, H - B + 7], [xf(S0) + 5, H - B + 7]], 'f-ink');
      // marker
      const mv = payoff(px, K, type, side, prem) * 100, mx = xf(px);
      b += S.line(mx, T, mx, H - B, 's-acc w15');
      b += S.circle(mx, yf(mv), 5.5, 'f-acc');
      b += S.circle(mx, H - B, 7, 'handle');
      const lines = [{ t: 'Stock ' + money(px), cls: 'sm mono ink b' }, { t: 'Expiry ' + F.susd(mv, 0), cls: 'sm mono ' + (mv >= 0 ? 'up' : 'dn') }];
      if (!simple) { const tv = sg * (SML.bs(px, K, days, iv, 0.04, type).price - prem) * 100; lines.push({ t: 'Today  ' + F.susd(tv, 0), cls: 'sm mono info' }); }
      b += tip(mx, T + 4, lines, W - Rm, L + 2);
      fig.innerHTML = S.wrap(W, H, `Payoff diagram for ${side === 'buy' ? 'buying' : 'selling'} a ${K} ${type}. Breakeven ${money(be)}.`, b);
      // stats
      const P = prem * 100;
      stat(id + '-pr2', (sg > 0 ? F.susd(-P, 0) + ' paid' : F.susd(P, 0) + ' received'), sg > 0 ? 'dn' : 'up');
      stat(id + '-be', money(be));
      let mp, ml;
      if (side === 'buy') { ml = F.susd(-P, 0); mp = type === 'call' ? 'Unlimited' : F.susd((K - prem) * 100, 0); }
      else { mp = F.susd(P, 0); ml = type === 'call' ? 'Unlimited' : F.susd(-(K - prem) * 100, 0); }
      if (!simple) stat(id + '-mp', mp, 'up');
      stat(id + '-ml', ml, 'dn');
      stat(id + '-at', F.susd(mv, 0), tone(mv));
      if (!simple) stat(id + '-pi', F.pct(SML.bs(S0, K, days, iv, 0.04, type).prob * 100, 0));
      const atTxt = ` At ${money(px)} on expiration day this ${mv >= 0 ? 'makes' : 'loses'} ${usd0(Math.abs(mv))}.`;
      let t;
      if (side === 'buy' && type === 'call') t = `You pay ${usd0(P)} for the right to buy 100 shares at ${usd0(K)}. You profit if the stock finishes above ${money(be)}. The most you can lose is the ${usd0(P)} you paid.`;
      else if (side === 'buy') t = `You pay ${usd0(P)} for the right to sell 100 shares at ${usd0(K)}. You profit if the stock finishes below ${money(be)}. The most you can lose is the ${usd0(P)} you paid.`;
      else if (type === 'call') t = `You collect ${usd0(P)} and promise to sell 100 shares at ${usd0(K)}. You keep it all if the stock stays below ${usd0(K)}. Without shares to cover it, losses above ${money(be)} have no limit.`;
      else t = `You collect ${usd0(P)} and promise to buy 100 shares at ${usd0(K)}. You keep it all if the stock stays above ${usd0(K)}. Below ${money(be)} you lose money, and you may have to buy the shares.`;
      msg(id + '-msg', side === 'buy' ? 'info' : 'acc', (side === 'buy' ? 'Buy ' : 'Sell ') + type, t + atTxt);
    });
  };

  /* =====================================================================
     6. moneynessLab: strike ladder, ITM / ATM / OTM
     ===================================================================== */
  SML.widgets.moneynessLab = function (root) {
    const id = SML.uid('mn'), KS = [115, 110, 105, 100, 95, 90, 85], DAYS = 30, IV = 0.3;
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-s', label: 'Stock price', min: 80, max: 120, step: 0.5, value: 103, fmt: 'usd' })}${ui.slider({ id: id + '-k', label: 'Strike to inspect', min: 85, max: 115, step: 5, value: 95, fmt: 'usd0' })}</div>
      <div class="wg-read mo-r4">${ui.stat('Call, per share', id + '-cp')}${ui.stat('Call, 1 contract', id + '-cc', 'hl')}${ui.stat('Put, per share', id + '-pp')}${ui.stat('Put, 1 contract', id + '-pc', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Prices from the Black-Scholes model with 30 days left and 30% implied volatility. Tap a row to inspect that strike.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    fig.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('[data-k]'); if (t) { st.set(id + '-k', t.getAttribute('data-k')); draw(); } });
    const mon = (type, K, S0) => (Math.abs(S0 - K) < 1.25 ? 'ATM' : (type === 'call' ? S0 - K : K - S0) > 0 ? 'ITM' : 'OTM');
    const draw = ui.responsive(fig, (W) => {
      const S0 = st.n(id + '-s'), Ks = st.n(id + '-k'), compact = W < 520;
      const sw = compact ? 62 : 96, cw = (W - sw) / 2, rh = 32, ty = 24;
      const by = ty + KS.length * rh + 22;
      const H = by + 92;
      let b = S.text(cw / 2, 14, 'CALLS', 'cap', 'middle') + S.text(cw + sw / 2, 14, 'STRIKE', 'cap', 'middle') + S.text(cw + sw + cw / 2, 14, 'PUTS', 'cap', 'middle');
      const fill = (m) => (m === 'ITM' ? 'f-up-t' : m === 'ATM' ? 'f-acc-t' : 'f-surf');
      const tagc = (m) => 'xs mono b ' + (m === 'ITM' ? 'up' : m === 'ATM' ? 'acc' : 'mut');
      const cells = [], texts = [], hits = [];
      KS.forEach((K, i) => {
        const y = ty + i * rh, c = SML.bs(S0, K, DAYS, IV, 0.04, 'call'), p = SML.bs(S0, K, DAYS, IV, 0.04, 'put');
        const mc = mon('call', K, S0), mp = mon('put', K, S0), on = K === Ks;
        cells.push(S.rect(1, y + 1, cw - 2, rh - 2, fill(mc), 3) + S.rect(cw + sw + 1, y + 1, cw - 2, rh - 2, fill(mp), 3) + S.rect(cw + 3, y + 1, sw - 6, rh - 2, on ? 'f-ink' : 'f-shade', 3));
        texts.push(S.text(cw + sw / 2, y + rh / 2 + 5, '$' + K, 'md mono b ' + (on ? 'on' : 'ink'), 'middle'));
        texts.push(S.text(10, y + rh / 2 + 4, mc, tagc(mc)) + S.text(cw - 10, y + rh / 2 + 5, money(c.price), 'md mono ink', 'end'));
        texts.push(S.text(cw + sw + 10, y + rh / 2 + 5, money(p.price), 'md mono ink') + S.text(W - 10, y + rh / 2 + 4, mp, tagc(mp), 'end'));
        if (on) texts.push(S.rect(0.5, y + 0.5, W - 1, rh - 1, 'nf s-acc w2', 4));
        hits.push(S.rect(0, y, W, rh, 'hit mo-row', 0, ` data-k="${K}"`));
      });
      const yP = clamp(SML.lin(115, 85, ty + rh / 2, ty + 6 * rh + rh / 2)(S0), ty + 2, ty + KS.length * rh - 2);
      const priceLine = S.line(0, yP, W, yP, 's-acc w2') + S.polygon([[0, yP - 6], [8, yP], [0, yP + 6]], 'f-acc') + S.polygon([[W, yP - 6], [W - 8, yP], [W, yP + 6]], 'f-acc');
      b += cells.join('') + priceLine + texts.join('') + hits.join('');
      // intrinsic vs time bars for the inspected strike
      const c = SML.bs(S0, Ks, DAYS, IV, 0.04, 'call'), p = SML.bs(S0, Ks, DAYS, IV, 0.04, 'put');
      const lw = compact ? 62 : 86, maxP = Math.max(c.price, p.price, 4);
      const sc = (W - lw - 64) / maxP;
      [['Call $' + Ks, c], ['Put $' + Ks, p]].forEach((r, i) => {
        const y = by + i * 28;
        b += S.text(lw - 8, y + 13, r[0], 'sm b ink', 'end');
        b += S.rect(lw, y, Math.max(0, r[1].intrinsic * sc), 18, 'f-up', 2);
        b += S.rect(lw + r[1].intrinsic * sc, y, Math.max(1, r[1].time * sc), 18, 'f-acc', 2);
        b += S.text(lw + r[1].price * sc + 6, y + 13, money(r[1].price), 'sm mono b ink');
      });
      const ly = by + 72;
      b += S.rect(lw, ly - 9, 10, 10, 'f-up', 2) + S.text(lw + 15, ly, 'intrinsic value', 'sm');
      b += S.rect(lw + 118, ly - 9, 10, 10, 'f-acc', 2) + S.text(lw + 133, ly, 'time value', 'sm');
      fig.innerHTML = S.wrap(W, H, `Strike ladder with the stock at ${money(S0)}. Green cells are in the money.`, b);
      stat(id + '-cp', money(c.price)); stat(id + '-cc', usd0(c.price * 100));
      stat(id + '-pp', money(p.price)); stat(id + '-pc', usd0(p.price * 100));
      const mc = mon('call', Ks, S0), mp = mon('put', Ks, S0);
      const desc = (t, m, o) => m === 'OTM' ? `The $${Ks} ${t} is out of the money, so its ${money(o.price)} is all time value.`
        : m === 'ATM' ? `The $${Ks} ${t} is at the money: ${money(o.intrinsic)} intrinsic and ${money(o.time)} time value.`
        : `The $${Ks} ${t} is in the money by ${money(o.intrinsic)}. That is its intrinsic value; the other ${money(o.time)} is time value.`;
      msg(id + '-msg', mc === 'ITM' ? 'up' : mc === 'ATM' ? 'acc' : 'mut', 'Stock ' + money(S0), desc('call', mc, c) + ' ' + desc('put', mp, p) + ` One call contract costs ${usd0(c.price * 100)}.`);
    });
  };

  /* =====================================================================
     8. greeksLab: delta and gamma curves
     ===================================================================== */
  SML.widgets.greeksLab = function (root) {
    const id = SML.uid('gk'), K = 100;
    let xfLast = null;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-ty', [{ v: 'call', label: 'Call' }, { v: 'put', label: 'Put' }], 'call', 'Option type')}<span class="grow"></span><span class="pill">Strike $100</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-s', label: 'Stock price', min: 70, max: 130, step: 0.5, value: 100, fmt: 'usd' })}${ui.slider({ id: id + '-d', label: 'Days to expiration', min: 1, max: 120, step: 1, value: 30, fmt: 'days' })}${ui.slider({ id: id + '-iv', label: 'Implied volatility', min: 10, max: 100, step: 1, value: 30, fmt: 'pct' })}</div>
      <div class="wg-read mo-r6">${ui.stat('Option price', id + '-p')}${ui.stat('Delta', id + '-de', 'hl')}${ui.stat('Gamma', id + '-ga')}${ui.stat('Theta / day', id + '-th')}${ui.stat('Vega / 1% IV', id + '-ve')}${ui.stat('Chance ITM (model)', id + '-pi')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Theta and vega are shown per contract (100 shares). Drag across the chart to move the stock price.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    scrub(fig, (pt) => { if (!xfLast) return; st.set(id + '-s', clamp(Math.round(xfLast.inv(pt.x) * 2) / 2, 70, 130)); draw(); });
    const draw = ui.responsive(fig, (W) => {
      const type = st.seg(id + '-ty'), S0 = st.n(id + '-s'), days = st.n(id + '-d'), iv = st.n(id + '-iv') / 100;
      const compact = W < 480;
      const H = Math.round(clamp(W * 0.6, 320, 410));
      const L = compact ? 36 : 44, Rm = 12, top = 12, gap = 30, xb = 22;
      const plotH = H - top - gap - xb, hD = plotH * 0.56, hG = plotH - hD;
      const d0 = top, d1 = top + hD, g0 = d1 + gap, g1 = g0 + hG;
      const xf = SML.lin(60, 140, L, W - Rm); xfLast = xf;
      const yD = type === 'call' ? SML.lin(0, 1, d1, d0 + 6) : SML.lin(-1, 0, d1, d0 + 6);
      const xs = [], dl = [], gm = [];
      for (let i = 0; i <= 160; i++) { const s = 60 + i * 0.5; const g = SML.bs(s, K, days, iv, 0.04, type); xs.push(s); dl.push(g.delta); gm.push(g.gamma); }
      const gmax = Math.max.apply(null, gm) * 1.18 || 0.01;
      const yG = SML.lin(0, gmax, g1, g0 + 6);
      let b = '';
      (type === 'call' ? [0, 0.5, 1] : [-1, -0.5, 0]).forEach((v) => { b += S.line(L, yD(v), W - Rm, yD(v), 's-grid') + S.text(L - 6, yD(v) + 4, v.toFixed(1), 'xs mono', 'end'); });
      b += S.line(L, g1, W - Rm, g1, 's-grid');
      b += S.line(xf(K), d0, xf(K), g1, 's-mut dash2');
      b += S.text(L + 4, d0 + 10, 'DELTA', 'cap') + S.text(L + 4, g0 + 10, 'GAMMA', 'cap');
      b += S.area(xs.map((x, i) => [xf(x), yG(gm[i])]), g1, 'f-info-t');
      b += S.poly(xs.map((x, i) => [xf(x), yG(gm[i])]), 's-info w25');
      b += S.poly(xs.map((x, i) => [xf(x), yD(dl[i])]), 's-acc w25');
      [60, 80, 100, 120, 140].forEach((v) => { b += S.text(xf(v), H - 6, (v === 100 ? 'strike ' : '') + '$' + v, 'xs mono', 'middle'); });
      const g = SML.bs(S0, K, days, iv, 0.04, type), mx = xf(S0);
      b += S.line(mx, d0, mx, g1, 's-ink w15 dash');
      b += S.circle(mx, yD(g.delta), 6, 'f-acc') + S.circle(mx, yG(g.gamma), 6, 'f-info');
      const right = mx < W - 110;
      b += S.text(mx + (right ? 10 : -10), yD(g.delta) + (type === 'call' && g.delta > 0.75 ? 18 : -9), 'Δ ' + g.delta.toFixed(2), 'md mono b acc mo-halo', right ? 'start' : 'end');
      b += S.text(mx + (right ? 10 : -10), Math.max(g0 + 24, yG(g.gamma) - 9), 'Γ ' + g.gamma.toFixed(3), 'md mono b info mo-halo', right ? 'start' : 'end');
      fig.innerHTML = S.wrap(W, H, `Delta and gamma of a $100 ${type} across stock prices. At ${money(S0)} delta is ${g.delta.toFixed(2)}.`, b);
      stat(id + '-p', money(g.price));
      stat(id + '-de', g.delta.toFixed(2));
      stat(id + '-ga', g.gamma.toFixed(3));
      stat(id + '-th', F.susd(g.theta * 100, 2), 'dn');
      stat(id + '-ve', F.susd(g.vega * 100, 2));
      stat(id + '-pi', F.pct(g.prob * 100, 0));
      const m = Math.abs(S0 - K) < 1.25 ? 'at the money' : (type === 'call' ? S0 > K : S0 < K) ? 'in the money' : 'out of the money';
      const ad = Math.abs(g.delta);
      let t;
      if (type === 'call') t = `This call is ${m}. If the stock rises $1, it gains about ${money(ad)} (${usd0(ad * 100)} per contract), and delta climbs to about ${Math.min(1, g.delta + g.gamma).toFixed(2)}.`;
      else t = `This put is ${m}. If the stock rises $1, it loses about ${money(ad)} (${usd0(ad * 100)} per contract). If the stock falls $1, it gains about that much.`;
      if (g.gamma > 0.08) t += ' Gamma is very high here: delta can flip fast.';
      msg(id + '-msg', ad > 0.7 ? 'up' : ad < 0.3 ? 'mut' : 'acc', 'Delta ' + g.delta.toFixed(2), t);
    });
  };

  /* =====================================================================
     9. thetaLab: watch time melt
     ===================================================================== */
  SML.widgets.thetaLab = function (root) {
    const id = SML.uid('th'), S0 = 100, IV = 0.3;
    const KS = [{ k: 90, c: 'up', lab: 'ITM $90' }, { k: 100, c: 'acc', lab: 'ATM $100' }, { k: 110, c: 'info', lab: 'OTM $110' }];
    let dCur = 45, playing = false, raf = 0, last = 0;
    SML.onCleanup(() => { playing = false; cancelAnimationFrame(raf); });
    root.innerHTML = `
      <div class="wg-bar">${ui.chips(id + '-ch', [{ k: '90', label: 'In the money $90', color: 'var(--up)', on: true }, { k: '100', label: 'At the money $100', color: 'var(--accent)', on: true }, { k: '110', label: 'Out of the money $110', color: 'var(--info)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-d', label: 'Days to expiration', min: 0, max: 60, step: 1, value: 45, fmt: 'days' })}</div>
      <div class="wg-read mo-r4">${ui.stat('ATM call, 1 contract', id + '-a')}${ui.stat('ATM theta / day', id + '-t', 'hl')}${ui.stat('OTM call, 1 contract', id + '-o')}${ui.stat('ITM time value left', id + '-i')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" id="${id}-play">Play: let time run out</button><button type="button" class="btn btn-g sm" id="${id}-rs">Back to 60 days</button></div>
      <div class="wg-note">Calls on a $100 stock, 30% implied volatility, stock price held still so only time changes.</div>`;
    const fig = root.querySelector('.wg-fig');
    const playBtn = $id(id + '-play');
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.id === id + '-d') { dCur = st.n(id + '-d'); stop(); } draw(); });
    function stop() { playing = false; cancelAnimationFrame(raf); playBtn.textContent = 'Play: let time run out'; }
    function frame(ts) {
      if (!playing) return;
      if (!last) last = ts;
      dCur = Math.max(0, dCur - ((ts - last) / 1000) * 12); last = ts;
      st.set(id + '-d', Math.round(dCur)); draw();
      if (dCur <= 0) { stop(); return; }
      raf = requestAnimationFrame(frame);
    }
    playBtn.addEventListener('click', () => {
      if (playing) { stop(); return; }
      if (dCur <= 0) dCur = 60;
      playing = true; last = 0; playBtn.textContent = 'Pause';
      if (SML.reduced()) { dCur = 0; st.set(id + '-d', 0); draw(); stop(); return; }
      raf = requestAnimationFrame(frame);
    });
    $id(id + '-rs').addEventListener('click', () => { stop(); dCur = 60; st.set(id + '-d', 60); draw(); });
    const draw = ui.responsive(fig, (W) => {
      const d = dCur, compact = W < 480;
      const H = Math.round(clamp(W * 0.5, 260, 340));
      const L = compact ? 40 : 46, Rm = 14, T = 14, B = 28;
      const xf = SML.lin(60, 0, L, W - Rm), yf = SML.lin(0, 12, H - B, T);
      let b = S.rect(xf(30), T, xf(0) - xf(30), H - B - T, 'f-dn-t o50');
      b += S.text(xf(15), T + 14, 'fast decay', 'sm dn b', 'middle');
      [0, 4, 8, 12].forEach((v) => { b += S.line(L, yf(v), W - Rm, yf(v), 's-grid') + S.text(L - 6, yf(v) + 4, '$' + v, 'xs mono', 'end'); });
      [60, 45, 30, 15, 0].forEach((v) => { b += S.text(xf(v), H - 8, v === 0 ? 'expiry' : compact ? v + 'd' : v + ' days', 'xs mono', v === 60 ? 'start' : v === 0 ? 'end' : 'middle'); });
      const on = KS.filter((k) => st.on(id + '-ch', String(k.k)));
      if (on.some((k) => k.k === 90)) { b += S.line(L, yf(10), W - Rm, yf(10), 's-up dash2 o70'); b += S.text(L + 4, yf(10) - 5, 'intrinsic $10', 'xs up'); }
      on.forEach((k) => {
        const pts = []; for (let x = 60; x >= 0; x -= 0.5) pts.push([xf(x), yf(SML.bs(S0, k.k, x, IV, 0.04, 'call').price)]);
        b += S.poly(pts, 's-' + k.c + ' w25');
      });
      const mx = xf(d);
      b += S.line(mx, T, mx, H - B, 's-ink w15 dash');
      const labs = on.map((k) => ({ k, v: SML.bs(S0, k.k, d, IV, 0.04, 'call').price })).sort((a, c) => c.v - a.v);
      let lastY = -99;
      const right = mx < W - 120;
      labs.forEach((o) => { b += S.circle(mx, yf(o.v), 5, 'f-' + o.k.c); });
      labs.forEach((o) => {
        const ly = Math.max(yf(o.v) - 9, lastY + 15, T + 10); lastY = ly;
        b += S.text(mx + (right ? 9 : -9), ly, money(o.v), 'sm mono b mo-halo ' + o.k.c, right ? 'start' : 'end');
      });
      fig.innerHTML = S.wrap(W, H, `Option values shrinking as expiration nears. ${Math.round(d)} days left.`, b);
      const atm = SML.bs(S0, 100, d, IV, 0.04, 'call'), otm = SML.bs(S0, 110, d, IV, 0.04, 'call'), itm = SML.bs(S0, 90, d, IV, 0.04, 'call');
      stat(id + '-a', usd0(atm.price * 100));
      stat(id + '-t', d <= 0 ? '$0' : F.susd(atm.theta * 100, 2), 'dn');
      stat(id + '-o', usd0(otm.price * 100));
      stat(id + '-i', usd0(itm.time * 100));
      const dr = Math.round(d);
      if (dr <= 0) msg(id + '-msg', 'dn', 'Expired', 'Time is up. Only intrinsic value is left: the $90 call is worth $1,000 per contract and the other two are worth $0.');
      else msg(id + '-msg', dr <= 30 ? 'dn' : 'acc', dr + (dr === 1 ? ' day' : ' days'), `The at-the-money call is worth ${usd0(atm.price * 100)} per contract and loses about ${usd0(-atm.theta * 100)} a day.` + (dr <= 30 ? ' Decay is speeding up.' : ' Decay is still slow this far out.') + ` The out-of-the-money call is pure time value: ${usd0(otm.price * 100)}.`);
    });
  };

  /* =====================================================================
     10. ivCrushLab: earnings and implied volatility
     ===================================================================== */
  SML.widgets.ivCrushLab = function (root) {
    const id = SML.uid('iv'), S0 = 100, K = 100, DB = 10, DA = 9;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-ty', [{ v: 'call', label: 'You bought a call' }, { v: 'put', label: 'You bought a put' }], 'call', 'Option bought')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-mv', label: 'Stock move on earnings', min: -15, max: 15, step: 0.5, value: 4, fmt: (v) => F.spct(v, 1) })}${ui.slider({ id: id + '-b', label: 'IV before earnings', min: 40, max: 150, step: 5, value: 80, fmt: 'pct' })}${ui.slider({ id: id + '-a', label: 'IV after earnings', min: 15, max: 80, step: 5, value: 30, fmt: 'pct' })}</div>
      <div class="wg-read mo-r4">${ui.stat('Option before', id + '-ob')}${ui.stat('Option after', id + '-oa')}${ui.stat('Your P/L', id + '-pl', 'hl')}${ui.stat('Move needed to break even', id + '-be')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">One $100-strike contract on a $100 stock, bought 10 days before expiration, valued the day after earnings. Solid line: after IV drops. Dashed line: if IV had stayed the same.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const type = st.seg(id + '-ty'), mv = st.n(id + '-mv'), ivb = st.n(id + '-b') / 100, iva = st.n(id + '-a') / 100;
      const before = SML.bs(S0, K, DB, ivb, 0.04, type).price;
      const after = (m, iv) => SML.bs(S0 * (1 + m / 100), K, DA, iv, 0.04, type).price;
      const plC = (m) => (after(m, iva) - before) * 100, plS = (m) => (after(m, ivb) - before) * 100;
      const compact = W < 480;
      const H = Math.round(clamp(W * 0.5, 260, 340));
      const L = compact ? 50 : 60, Rm = 12, T = 14, B = 28;
      const xs = [], vc = [], vs = [];
      for (let i = 0; i <= 120; i++) { const m = -15 + i * 0.25; xs.push(m); vc.push(plC(m)); vs.push(plS(m)); }
      let lo = Math.min(...vc, ...vs, 0), hi = Math.max(...vc, ...vs, 0); const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      const xf = SML.lin(-15, 15, L, W - Rm), yf = SML.lin(lo, hi, H - B, T);
      let b = yGrid(lo, hi, yf, L, W - Rm, (v) => F.usd0(v), 4);
      [-15, -10, -5, 0, 5, 10, 15].forEach((v) => { if (compact && Math.abs(v) === 5) return; b += S.text(xf(v), H - 8, F.spct(v, 0), 'xs mono', 'middle'); });
      b += plAreas(xs, vc, xf, yf);
      b += S.line(L, yf(0), W - Rm, yf(0), 's-ink');
      b += S.line(xf(0), T, xf(0), H - B, 's-mut dash2');
      b += S.poly(xs.map((x, i) => [xf(x), yf(vs[i])]), 's-mut w15 dash');
      b += plLines(xs, vc, xf, yf, 'w25');
      // breakeven in the favourable direction
      let be = null;
      if (type === 'call') { for (let m = 0; m <= 15; m += 0.05) if (plC(m) >= 0) { be = m; break; } }
      else { for (let m = 0; m >= -15; m -= 0.05) if (plC(m) >= 0) { be = m; break; } }
      if (be != null) {
        b += S.circle(xf(be), yf(0), 4.5, 'f-surf s-ink w15');
        b += S.text(xf(be) + (type === 'call' ? 6 : -6), yf(0) + 16, 'breakeven ' + F.spct(be, 1), 'sm b ink mo-halo', type === 'call' ? 'start' : 'end');
      }
      const pl = plC(mv), mx = xf(mv);
      b += S.line(mx, T, mx, H - B, 's-acc w15');
      b += S.circle(mx, yf(pl), 5.5, 'f-acc');
      b += tip(mx, T + 2, [{ t: 'Move ' + F.spct(mv, 1), cls: 'sm mono b ink' }, { t: 'P/L  ' + F.susd(pl, 0), cls: 'sm mono ' + (pl >= 0 ? 'up' : 'dn') }], W - Rm, L + 2);
      fig.innerHTML = S.wrap(W, H, `Profit or loss of a bought ${type} after earnings, across stock moves. IV falls from ${Math.round(ivb * 100)}% to ${Math.round(iva * 100)}%.`, b);
      stat(id + '-ob', usd0(before * 100));
      stat(id + '-oa', usd0(after(mv, iva) * 100));
      stat(id + '-pl', F.susd(pl, 0), tone(pl));
      stat(id + '-be', be == null ? 'over ' + (type === 'call' ? '+15%' : F.minus + '15%') : F.spct(be, 1));
      const fav = type === 'call' ? mv > 0 : mv < 0;
      const ivTxt = `IV fell from ${Math.round(ivb * 100)}% to ${Math.round(iva * 100)}%`;
      const beTxt = be == null ? 'more than 15%' : 'about ' + F.spct(be, 1);
      if (iva >= ivb) msg(id + '-msg', pl >= 0 ? 'up' : 'dn', 'No crush', `IV did not fall, so the option keeps its expensive price. P/L: ${F.susd(pl, 0)}.`);
      else if (mv === 0) msg(id + '-msg', 'dn', 'IV crush', `The stock did not move and ${ivTxt}. The ${type} lost ${usd0(-pl)} from the volatility drop alone.`);
      else if (pl < 0 && fav) msg(id + '-msg', 'dn', 'IV crush', `The stock moved ${F.spct(mv, 1)} your way, yet the ${type} lost ${usd0(-pl)} because ${ivTxt}. You needed ${beTxt} just to break even.`);
      else if (pl < 0) msg(id + '-msg', 'dn', 'Loss', `The stock moved ${F.spct(mv, 1)} against you and ${ivTxt}. The ${type} lost ${usd0(-pl)}.`);
      else msg(id + '-msg', 'up', 'Big enough', `The ${F.spct(mv, 1)} move beat what the market expected, so the ${type} gained ${usd0(pl)} even though ${ivTxt}.`);
    });
  };

  /* =====================================================================
     11. wheelSim: play the wheel month by month
     ===================================================================== */
  SML.widgets.wheelSim = function (root) {
    const id = SML.uid('ws'), IV = 0.45, RV = 0.4, DTE = 30, TD = 21, RATE = 0.04;
    const TARGET = { safe: 0.15, bal: 0.25, agg: 0.35 };
    let G = null, raf = 0, alive = true, anim = null, running = false;
    SML.onCleanup(() => { alive = false; cancelAnimationFrame(raf); });
    function fresh(seed) {
      const r = SML.rng(seed), p0 = Math.round(r.range(30, 60)), drift = r.range(-0.2, 0.3);
      const pre = [p0]; let x = p0; for (let i = 0; i < TD; i++) { x = x * Math.exp(-0.4 / Math.sqrt(252) * r.gauss() * 0.9); pre.unshift(x); }
      const cash = Math.ceil((p0 * 125) / 500) * 500;
      G = { seed, r, p0, drift, price: p0, cash, start: cash, shares: 0, basis: null, prem: 0, month: 0, phase: 'cash', days: pre, startIdx: TD, cyc: [], last: null, gain: 0 };
    }
    function plan() {
      const style = st.seg(id + '-sty') || 'bal', type = G.phase === 'cash' ? 'put' : 'call', S0 = G.price;
      let best = null;
      for (let k = Math.round(S0 * 0.6 * 2) / 2; k <= S0 * 1.4 + 1e-9; k += 0.5) {
        const d = Math.abs(SML.bs(S0, k, DTE, IV, RATE, type).delta), diff = Math.abs(d - TARGET[style]);
        if (!best || diff < best.diff) best = { k, diff };
      }
      let k = best.k, note = '';
      if (type === 'put') { const maxK = Math.floor((G.cash / 100) * 2) / 2; if (k > maxK) { k = maxK; note = 'cash'; } }
      else if (st.on(id + '-cb', 'basis') && G.basis != null && k < G.basis) { k = Math.ceil(G.basis * 2) / 2; note = 'basis'; }
      const g = SML.bs(S0, k, DTE, IV, RATE, type);
      return { type, k, prem: Math.max(0.01, Math.round(g.price * 100) / 100), delta: g.delta, note };
    }
    function simulate() {
      const r = G.r, dt = 1 / 252, path = []; let x = G.price;
      for (let i = 0; i < TD; i++) { x = x * Math.exp((G.drift - (RV * RV) / 2) * dt + RV * Math.sqrt(dt) * r.gauss()); path.push(x); }
      return path;
    }
    function settle(p, path) {
      const end = path[path.length - 1], from = G.days.length - 1;
      G.month++; G.days = G.days.concat(path); G.price = end; G.cash += p.prem * 100; G.prem += p.prem * 100;
      let out;
      if (p.type === 'put') {
        if (end < p.k) { G.cash -= p.k * 100; G.shares = 100; G.basis = p.k - p.prem; G.phase = 'shares'; out = 'assigned'; } else out = 'expired';
      } else if (end > p.k) { G.gain = (p.k - G.basis + p.prem) * 100; G.cash += p.k * 100; G.shares = 0; G.basis = null; G.phase = 'cash'; out = 'called'; }
      else { G.basis -= p.prem; out = 'kept'; }
      const c = Object.assign({}, p, { from, to: G.days.length - 1, end, out, month: G.month });
      G.cyc.push(c); G.last = c;
    }
    function play(p, path, ms, done) {
      const fin = () => { anim = null; settle(p, path); draw(); report(); if (done) done(); };
      if (SML.reduced() || ms <= 0) { fin(); return; }
      anim = { p, path, n: 1 }; const t0 = performance.now();
      const step = (ts) => {
        if (!alive) return;
        const f = Math.min(1, (ts - t0) / ms); anim.n = Math.max(1, Math.round(f * path.length)); draw();
        if (f < 1) raf = requestAnimationFrame(step); else fin();
      };
      raf = requestAnimationFrame(step);
    }
    root.innerHTML = `
      <div class="wg-bar"><span class="ctl-lab">Strike style</span>${ui.seg(id + '-sty', [{ v: 'safe', label: 'Safer' }, { v: 'bal', label: 'Balanced' }, { v: 'agg', label: 'Aggressive' }], 'bal', 'Strike style')}<span class="grow"></span>${ui.chips(id + '-cb', [{ k: 'basis', label: 'Sell calls above my cost', color: 'var(--accent)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-read mo-r6">${ui.stat('Holding', id + '-h')}${ui.stat('Premium collected', id + '-pc', 'hl')}${ui.stat('Account value', id + '-av')}${ui.stat('Wheel P/L', id + '-wp')}${ui.stat('Buy & hold P/L', id + '-bh')}${ui.stat('Month', id + '-mo')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-a" id="${id}-go">Sell a put</button><button type="button" class="btn btn-g sm" id="${id}-run">Run 12 months</button><button type="button" class="btn btn-g sm" id="${id}-new">New stock</button><span class="mo-preview" id="${id}-pv"></span></div>
      <div class="mo-log" id="${id}-log"></div>
      <div class="wg-note">Sample stock with made-up prices. Each turn is one 30-day option. Safer, balanced and aggressive mean strikes near 0.15, 0.25 and 0.35 delta. Blue dashes are put strikes, amber dashes call strikes; A = assigned shares, C = shares called away. No commissions or taxes.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => { draw(); preview(); });
    const goB = $id(id + '-go'), runB = $id(id + '-run'), newB = $id(id + '-new');
    function busy(on) { running = on; [goB, runB, newB].forEach((b) => { b.disabled = on; }); }
    goB.addEventListener('click', () => { if (running) return; const p = plan(); busy(true); play(p, simulate(), 1500, () => { busy(false); preview(); }); });
    runB.addEventListener('click', () => {
      if (running) return; let i = 0; busy(true);
      const next = () => { if (!alive) return; if (i++ >= 12) { busy(false); preview(); return; } const p = plan(); play(p, simulate(), 420, next); };
      next();
    });
    newB.addEventListener('click', () => { if (running) return; fresh(G.seed + 7919); draw(); report(); preview(); });
    function preview() {
      if (!G) return;
      const p = plan();
      goB.textContent = p.type === 'put' ? 'Sell a put' : 'Sell a call';
      const extra = p.note === 'cash' ? ' (lowered: not enough cash)' : p.note === 'basis' ? ' (raised to stay above your cost)' : '';
      $id(id + '-pv').innerHTML = `Next: sell the <b>${money(p.k)}</b> ${p.type}, collect <b>${usd0(p.prem * 100)}</b>, delta ${Math.abs(p.delta).toFixed(2)}${extra}`;
    }
    function report() {
      const val = G.cash + G.shares * G.price;
      stat(id + '-h', G.shares ? '100 shares' : 'Cash');
      stat(id + '-pc', usd0(G.prem));
      stat(id + '-av', usd0(val));
      stat(id + '-wp', F.susd(val - G.start, 0), tone(val - G.start));
      stat(id + '-bh', F.susd(100 * (G.price - G.p0), 0), tone(G.price - G.p0));
      stat(id + '-mo', String(G.month));
      const L = G.last, m = id + '-msg';
      if (!L) msg(m, 'acc', 'Start', `You have ${usd0(G.cash)} and a ${money(G.p0)} stock you would be happy to own. Sell a put to get paid while you wait for a lower price.`);
      else if (L.out === 'expired') msg(m, 'up', 'Put expired', `The stock closed at ${money(L.end)}, above your ${money(L.k)} strike. The put expired worthless and you keep ${usd0(L.prem * 100)}. Sell another put.`);
      else if (L.out === 'assigned') msg(m, 'acc', 'Assigned', `The stock closed at ${money(L.end)}, below your ${money(L.k)} strike, so you bought 100 shares at ${money(L.k)}. Counting the premium, your cost is ${money(G.basis)} a share. Now sell covered calls.`);
      else if (L.out === 'kept') msg(m, 'up', 'Call expired', `The stock closed at ${money(L.end)}, below your ${money(L.k)} call strike. You keep the shares and ${usd0(L.prem * 100)}. Your cost drops to ${money(G.basis)} a share.`);
      else msg(m, G.gain >= 0 ? 'up' : 'dn', 'Called away', `The stock closed at ${money(L.end)}, above your ${money(L.k)} strike, so your shares were sold at ${money(L.k)}. The round trip made ${F.susd(G.gain, 0)} including premiums.` + (L.end > L.k * 1.05 ? ` The stock ran past your strike: that is the capped upside.` : '') + ' Back to cash: sell a put.');
      if (G.shares && G.basis != null && G.price < G.basis * 0.85) {
        const el = $id(m); if (el) el.lastElementChild.insertAdjacentHTML('beforeend', ` The stock now sits ${F.pct((1 - G.price / G.basis) * 100, 0)} below your cost, so calls above your cost pay very little. This is the wheel's main risk.`);
      }
      const outTxt = { expired: ['Expired', 'up'], assigned: ['Assigned', 'acc'], kept: ['Kept shares', 'up'], called: ['Called away', 'up'] };
      const rows = G.cyc.slice().reverse().map((c) => `<tr><td class="num">${c.month}</td><td>Sold ${c.type}</td><td class="num">${money(c.k)}</td><td class="num">${usd0(c.prem * 100)}</td><td class="num">${money(c.end)}</td><td><span class="pill ${outTxt[c.out][1]}">${outTxt[c.out][0]}</span></td></tr>`).join('');
      $id(id + '-log').innerHTML = G.cyc.length ? `<div class="scroll"><table class="tbl"><thead><tr><th class="num">Month</th><th>Trade</th><th class="num">Strike</th><th class="num">Premium</th><th class="num">Close</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="empty">No trades yet. Your trade log appears here.</p>`;
    }
    function diagram(bx, by, bw, bh) {
      let b = '';
      const nw = Math.min(104, (bw - 30) / 2), nh = 46, ny = by + bh * 0.42;
      const cx = bx + 6, sx = bx + bw - 6 - nw;
      const L = G.last, cashOn = G.phase === 'cash';
      const node = (x, on, t1, t2) => S.rect(x, ny, nw, nh, on ? 'f-acc-t s-acc w2' : 'f-surf s-line w15', 6) + S.text(x + nw / 2, ny + 20, t1, 'md b ink', 'middle') + S.text(x + nw / 2, ny + 36, t2, 'xs mono', 'middle');
      const loop = (x, on, lab) => {
        const x1 = x + nw * 0.22, x2 = x + nw * 0.78, y = ny;
        const live = on && (anim || !running);
        return S.path(`M${x1},${y} C${x1},${y - 40} ${x2},${y - 40} ${x2},${y - 6}`, 'nf ' + (live ? 's-acc w2' : 's-line w15')) +
          S.polygon([[x2, y], [x2 - 5, y - 9], [x2 + 5, y - 9]], live ? 'f-acc' : 'f-line') +
          S.text(x + nw / 2, y - 40, lab, 'sm b ' + (on ? 'ink' : 'mut'), 'middle');
      };
      b += loop(cx, cashOn, 'Sell put') + loop(sx, !cashOn, 'Sell call');
      b += node(cx, cashOn, 'CASH', usd0(G.cash));
      b += node(sx, !cashOn, '100 SHARES', G.basis != null ? 'cost ' + money(G.basis) : 'none yet');
      const aOn = L && L.out === 'assigned' && !anim, cOn = L && L.out === 'called' && !anim;
      b += S.arrow(cx + nw + 3, ny + 15, sx - 3, ny + 15, aOn ? 'acc' : 'mut', 7);
      b += S.arrow(sx - 3, ny + 31, cx + nw + 3, ny + 31, cOn ? 'acc' : 'mut', 7);
      b += S.text(bx + bw / 2, ny + nh + 18, 'put assigned →', 'sm ' + (aOn ? 'b acc' : 'mut'), 'middle');
      b += S.text(bx + bw / 2, ny + nh + 33, '← call assigned', 'sm ' + (cOn ? 'b acc' : 'mut'), 'middle');
      return b;
    }
    const draw = ui.responsive(fig, (W) => {
      if (!G) return;
      const wide = W >= 700;
      const chartW = wide ? W - 262 : W, chartH = wide ? 300 : 220, H = wide ? 300 : 220 + 158;
      const L = 44, Rm = wide ? 8 : 10, T = 12, B = 24;
      const days = anim ? G.days.concat(anim.path.slice(0, anim.n)) : G.days;
      const nDays = Math.max(days.length - 1 + (anim ? 0 : Math.max(TD, Math.round(days.length * 0.12))), G.startIdx + 3 * TD);
      const cyc = G.cyc.concat(anim ? [Object.assign({}, anim.p, { from: G.days.length - 1, to: G.days.length - 1 + anim.n, live: true })] : []);
      const nextP = !anim ? plan() : null;
      const vals = days.concat(cyc.map((c) => c.k)); if (G.basis != null) vals.push(G.basis); if (nextP) vals.push(nextP.k);
      let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.08 + 0.5; lo -= pad; hi += pad;
      const xf = SML.lin(0, nDays, L, chartW - Rm), yf = SML.lin(lo, hi, chartH - B, T);
      let b = yGrid(lo, hi, yf, L, chartW - Rm, (v) => '$' + Math.round(v), 4);
      const months = Math.ceil((nDays - G.startIdx) / TD);
      for (let m = 0; m <= months; m++) {
        const x = xf(G.startIdx + m * TD); if (x > chartW - Rm + 1) break;
        b += S.line(x, T, x, chartH - B, m === 0 ? 's-mut dash2' : 's-grid');
        const every = months > 24 ? 6 : months > 12 || !wide ? 3 : 1;
        if (m === 0) b += S.text(x, chartH - 8, 'start', 'xs', 'middle');
        else if (m % every === 0) b += S.text(x, chartH - 8, 'M' + m, 'xs mono', 'middle');
      }
      cyc.forEach((c) => { b += S.line(xf(c.from), yf(c.k), xf(c.live ? c.from + TD : c.to), yf(c.k), (c.type === 'put' ? 's-info' : 's-acc') + ' w2 dash'); });
      if (G.basis != null) {
        const x0 = xf(G.cyc.length ? G.cyc[G.cyc.length - 1].to : 0);
        b += S.line(x0, yf(G.basis), chartW - Rm, yf(G.basis), 's-ink dot2 w15');
        b += S.text(chartW - Rm, yf(G.basis) + 13, 'cost', 'xs ink mo-halo', 'end');
      }
      if (nextP) {
        const x0 = xf(days.length - 1);
        const x1 = Math.min(chartW - Rm, x0 + xf(TD) - xf(0));
        b += S.line(x0, yf(nextP.k), x1, yf(nextP.k), (nextP.type === 'put' ? 's-info' : 's-acc') + ' w15 dash2');
        b += S.text(x1, yf(nextP.k) + (nextP.type === 'put' ? 15 : -7), 'next ' + nextP.type + ' ' + money(nextP.k), 'xs mo-halo ' + (nextP.type === 'put' ? 'info' : 'acc'), 'end');
      }
      b += S.poly(days.map((p, i) => [xf(i), yf(p)]), 's-ink w15');
      G.cyc.forEach((c) => {
        if (c.out === 'assigned' || c.out === 'called') {
          const x = xf(c.to), y = yf(c.end);
          b += S.circle(x, y, 8, c.out === 'assigned' ? 'f-dn' : 'f-up') + S.text(x, y + 3.8, c.out === 'assigned' ? 'A' : 'C', 'badge', 'middle');
        }
      });
      const ex = xf(days.length - 1), ey = yf(days[days.length - 1]);
      b += S.circle(ex, ey, 4, 'f-ink');
      const pl = money(days[days.length - 1]);
      const lastC = G.cyc[G.cyc.length - 1];
      if (anim || !lastC || (lastC.out !== 'assigned' && lastC.out !== 'called')) b += S.text(ex - 9, ey - 9, pl, 'sm mono b ink mo-halo', 'end');
      if (wide) b += S.line(chartW + 8, 10, chartW + 8, H - 10, 's-line') + diagram(chartW + 18, 0, W - chartW - 18, H);
      else b += S.line(0, chartH + 6, W, chartH + 6, 's-line') + diagram(Math.max(0, (W - 300) / 2), chartH + 10, Math.min(W, 300), 146);
      fig.innerHTML = S.wrap(W, H, `Wheel simulation: month ${G.month}, holding ${G.shares ? '100 shares' : 'cash'}, stock at ${money(G.price)}.`, b);
    });
    fresh(20277);
    draw(); report(); preview();
  };

  /* =====================================================================
     Tool: optionCalc
     ===================================================================== */
  SML.widgets.optionCalc = function (root) {
    const id = SML.uid('oc');
    let override = false, xfLast = null, hoverX = null;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-sd', [{ v: 'buy', label: 'Buy' }, { v: 'sell', label: 'Sell' }], 'buy', 'Buy or sell')}${ui.seg(id + '-ty', [{ v: 'call', label: 'Call' }, { v: 'put', label: 'Put' }], 'call', 'Call or put')}</div>
      <div class="wg-ctrl mo-fields">
        ${ui.field({ id: id + '-s', label: 'Stock price $', value: 100, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-k', label: 'Strike $', value: 105, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-d', label: 'Days to expiry', value: 30, step: 1, min: 0 })}
        ${ui.field({ id: id + '-iv', label: 'Implied vol %', value: 35, step: 1, min: 1 })}
        ${ui.field({ id: id + '-n', label: 'Contracts', value: 1, step: 1, min: 1 })}
        <div class="fld"><span class="mo-fld-top"><label for="${id}-pr">Premium / share $</label><button type="button" class="linkish" id="${id}-mdl" hidden>use model</button></span><input id="${id}-pr" type="number" inputmode="decimal" step="0.01" min="0" value=""></div>
      </div>
      <div class="wg-fig"></div>
      <div class="wg-read mo-r4">${ui.stat('Premium', id + '-pt', 'hl')}${ui.stat('Breakeven', id + '-be')}${ui.stat('Max profit', id + '-mp')}${ui.stat('Max loss', id + '-ml')}${ui.stat('Chance ITM (model)', id + '-pi')}${ui.stat('Delta, share equivalent', id + '-de')}${ui.stat('Theta / day', id + '-th')}${ui.stat('Vega / 1% IV', id + '-ve')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="mo-table scroll" id="${id}-tb"></div>
      <div class="wg-note">Premium defaults to the Black-Scholes model price (4% interest rate). Type your broker's quote to override it. Greeks are for the whole position. Hover or tap the chart to read any price.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.id === id + '-pr') override = true; draw(); });
    $id(id + '-mdl').addEventListener('click', () => { override = false; draw(); });
    scrub(fig, (pt) => { if (!xfLast) return; hoverX = xfLast.inv(pt.x); draw(); }, { hover: true, leave: () => { hoverX = null; draw(); } });
    const draw = ui.responsive(fig, (W) => {
      const type = st.seg(id + '-ty'), side = st.seg(id + '-sd');
      const S0 = numv(id + '-s'), K = numv(id + '-k'), days = numv(id + '-d'), iv = numv(id + '-iv') / 100;
      const n = Math.max(1, Math.round(numv(id + '-n') || 1));
      const H = Math.round(clamp(W * 0.45, 240, 320));
      if (!(S0 > 0 && K > 0 && days >= 0 && iv > 0)) {
        fig.innerHTML = S.wrap(W, 80, 'Waiting for inputs', S.text(W / 2, 44, 'Enter a stock price, strike, days and volatility above zero.', 'md ink', 'middle'));
        msg(id + '-msg', 'mut', 'Inputs', 'Stock price, strike and implied volatility must be above zero; days can be zero for expiration day.');
        return;
      }
      const model = SML.bs(S0, K, days, iv, 0.04, type);
      const pr = $id(id + '-pr'), pv = numv(id + '-pr');
      if (!override && document.activeElement !== pr) pr.value = model.price.toFixed(2);
      $id(id + '-mdl').hidden = !override;
      const prem = override && isFinite(pv) && pv >= 0 ? pv : model.price;
      const sg = side === 'buy' ? 1 : -1, mult = 100 * n;
      const expPL = (x) => payoff(x, K, type, side, prem) * mult;
      const todPL = (x) => sg * (SML.bs(x, K, days, iv, 0.04, type).price - prem) * mult;
      const lo = Math.min(S0 * 0.7, K * 0.9), hi = Math.max(S0 * 1.3, K * 1.1);
      const compact = W < 480, L = compact ? 52 : 64, Rm = 12, T = 14, B = 28;
      const xf = SML.lin(lo, hi, L, W - Rm); xfLast = xf;
      const xs = [], ve = [], vt = [];
      for (let i = 0; i <= 150; i++) { const x = lo + ((hi - lo) * i) / 150; xs.push(x); ve.push(expPL(x)); vt.push(todPL(x)); }
      let ylo = Math.min(0, ...ve, ...vt), yhi = Math.max(0, ...ve, ...vt); const pad = (yhi - ylo) * 0.1 || 100; ylo -= pad; yhi += pad;
      const yf = SML.lin(ylo, yhi, H - B, T);
      let b = yGrid(ylo, yhi, yf, L, W - Rm, (v) => F.usd0(v), 4);
      SML.ticks(lo, hi, compact ? 4 : 6).forEach((v) => { b += S.text(xf(v), H - 8, '$' + F.num(v, v < 10 ? 1 : 0), 'xs mono', 'middle'); });
      b += plAreas(xs, ve, xf, yf);
      b += S.line(L, yf(0), W - Rm, yf(0), 's-ink');
      b += S.line(xf(K), T, xf(K), H - B, 's-mut dash2') + S.text(xf(K) + 4, T + 10, 'strike', 'xs');
      b += S.poly(xs.map((x, i) => [xf(x), yf(vt[i])]), 's-info w15 dash');
      b += plLines(xs, ve, xf, yf, 'w25');
      b += S.polygon([[xf(S0), H - B], [xf(S0) - 5, H - B + 7], [xf(S0) + 5, H - B + 7]], 'f-ink');
      const be = type === 'call' ? K + prem : K - prem;
      if (be > lo && be < hi) b += S.circle(xf(be), yf(0), 4.5, 'f-surf s-ink w15');
      if (hoverX != null && hoverX >= lo && hoverX <= hi) {
        const mx = xf(hoverX), e = expPL(hoverX), t = todPL(hoverX);
        b += S.line(mx, T, mx, H - B, 's-acc w15') + S.circle(mx, yf(e), 5, 'f-acc') + S.circle(mx, yf(t), 4, 'f-info');
        b += tip(mx, T + 2, [{ t: 'Stock ' + money(hoverX), cls: 'sm mono b ink' }, { t: 'Expiry ' + F.susd(e, 0), cls: 'sm mono ' + (e >= 0 ? 'up' : 'dn') }, { t: 'Today  ' + F.susd(t, 0), cls: 'sm mono info' }], W - Rm, L + 2);
      }
      fig.innerHTML = S.wrap(W, H, `Profit and loss for ${side === 'buy' ? 'buying' : 'selling'} ${n} ${type} contract${n > 1 ? 's' : ''} at strike ${money(K)}.`, b);
      const P = prem * mult;
      stat(id + '-pt', sg > 0 ? F.susd(-P, 0) + ' paid' : F.susd(P, 0) + ' received', sg > 0 ? 'dn' : 'up');
      stat(id + '-be', money(be));
      let mp, ml;
      if (side === 'buy') { ml = F.susd(-P, 0); mp = type === 'call' ? 'Unlimited' : F.susd((K - prem) * mult, 0); }
      else { mp = F.susd(P, 0); ml = type === 'call' ? 'Unlimited' : F.susd(-(K - prem) * mult, 0); }
      stat(id + '-mp', mp, 'up'); stat(id + '-ml', ml, 'dn');
      stat(id + '-pi', F.pct(model.prob * 100, 0));
      stat(id + '-de', F.num(sg * model.delta * mult, 0) + ' sh');
      stat(id + '-th', F.susd(sg * model.theta * mult, 2), tone(sg * model.theta));
      stat(id + '-ve', F.susd(sg * model.vega * mult, 2), tone(sg * model.vega));
      const rows = [-20, -10, -5, 0, 5, 10, 20].map((m) => { const x = S0 * (1 + m / 100), e = expPL(x), t = todPL(x); return `<tr><td class="num">${money(x)}</td><td class="num">${F.spct(m, 0)}</td><td class="num ${tone(e)}">${F.susd(e, 0)}</td><td class="num ${tone(t)}">${F.susd(t, 0)}</td></tr>`; }).join('');
      $id(id + '-tb').innerHTML = `<table class="tbl"><thead><tr><th class="num">Stock price</th><th class="num">Move</th><th class="num">P/L at expiry</th><th class="num">P/L today</th></tr></thead><tbody>${rows}</tbody></table>`;
      const what = side === 'buy' ? `You pay ${usd0(P)} for ${n} ${type}${n > 1 ? 's' : ''}` : `You collect ${usd0(P)} for selling ${n} ${type}${n > 1 ? 's' : ''}`;
      const win = type === 'call' ? (side === 'buy' ? `above ${money(be)}` : `below ${money(be)}`) : side === 'buy' ? `below ${money(be)}` : `above ${money(be)}`;
      msg(id + '-msg', side === 'buy' ? 'info' : 'acc', side + ' ' + type, `${what}. At expiration you profit if the stock finishes ${win}. The model gives about a ${F.pct(model.prob * 100, 0)} chance of finishing in the money.` + (override ? ` Your quote differs from the model price of ${money(model.price)}.` : ''));
    });
  };

  /* =====================================================================
     Tool: wheelCalc
     ===================================================================== */
  SML.widgets.wheelCalc = function (root) {
    const id = SML.uid('wc');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-m', [{ v: 'put', label: 'Cash-secured put' }, { v: 'call', label: 'Covered call' }], 'put', 'Strategy')}</div>
      <div class="wg-ctrl mo-fields">
        ${ui.field({ id: id + '-s', label: 'Stock price $', value: 40, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-k', label: 'Strike $', value: 38, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-p', label: 'Premium / share $', value: 0.95, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-d', label: 'Days to expiry', value: 30, step: 1, min: 1 })}
        ${ui.field({ id: id + '-n', label: 'Contracts', value: 1, step: 1, min: 1 })}
        <div id="${id}-bw" hidden>${ui.field({ id: id + '-b', label: 'Your cost / share $', value: 40, step: 0.01, min: 0 })}</div>
      </div>
      <div class="wg-fig"></div>
      <div class="wg-read mo-r6">${ui.stat('Premium collected', id + '-pc', 'hl')}${ui.stat('Return on capital', id + '-roc')}${ui.stat('Annualized', id + '-ann')}${ui.stat('Breakeven', id + '-be')}${ui.stat('Capital tied up', id + '-cap')}${ui.stat('If assigned', id + '-ifa')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Annualized assumes you could repeat the same trade all year, which rarely happens exactly. No commissions or taxes included.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-m')) {
        const mode = st.seg(id + '-m'), S0 = numv(id + '-s') > 0 ? numv(id + '-s') : 40, d = numv(id + '-d') > 0 ? numv(id + '-d') : 30;
        const K = mode === 'put' ? Math.floor(S0 * 0.95 * 2) / 2 : Math.ceil(S0 * 1.05 * 2) / 2;
        st.set(id + '-k', K); st.set(id + '-p', SML.bs(S0, K, d, 0.4, 0.04, mode).price.toFixed(2));
        if (mode === 'call' && !(numv(id + '-b') > 0)) st.set(id + '-b', S0);
      }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const mode = st.seg(id + '-m');
      $id(id + '-bw').hidden = mode !== 'call';
      const S0 = numv(id + '-s'), K = numv(id + '-k'), p = numv(id + '-p'), d = numv(id + '-d'), n = Math.max(1, Math.round(numv(id + '-n') || 1)), basis = numv(id + '-b');
      if (!(S0 > 0 && K > 0 && p >= 0 && d > 0) || (mode === 'call' && !(basis > 0))) {
        fig.innerHTML = S.wrap(W, 70, 'Waiting for inputs', S.text(W / 2, 40, 'Fill in stock price, strike, premium and days above zero.', 'md ink', 'middle'));
        msg(id + '-msg', 'mut', 'Inputs', 'Stock price, strike and days must be above zero.');
        return;
      }
      const mult = 100 * n, P = p * mult;
      let roc, be, cap, ifa, ifaCls;
      if (mode === 'put') { roc = p / K; be = K - p; cap = K * mult; ifa = money(K - p) + '/sh'; ifaCls = ''; }
      else { roc = p / S0; be = basis - p; cap = S0 * mult; const g = (K - basis + p) * mult; ifa = F.susd(g, 0); ifaCls = tone(g); }
      const ann = roc * (365 / d);
      // price-zone picture
      const compact = W < 520, H = 124;
      const lo = Math.min(S0, K, be) * 0.85, hi = Math.max(S0, K, be) * 1.15;
      const xf = SML.lin(lo, hi, 8, W - 8), zt = 34, zh = 34;
      const zones = mode === 'put'
        ? [[lo, be, 'f-dn-t', 'loss if assigned', 'dn'], [be, K, 'f-acc-t', 'assigned, still ahead', 'acc'], [K, hi, 'f-up-t', 'keep the premium', 'up']]
        : [[lo, be, 'f-dn-t', 'loss on shares', 'dn'], [be, K, 'f-up-t', 'keep shares + premium', 'up'], [K, hi, 'f-acc-t', 'called away at ' + money(K), 'acc']];
      let b = '';
      zones.forEach((z) => {
        const x0 = xf(Math.max(lo, Math.min(z[0], z[1]))), x1 = xf(Math.min(hi, Math.max(z[0], z[1])));
        if (x1 - x0 <= 0) return;
        b += S.rect(x0, zt, x1 - x0, zh, z[2]);
        if (z[3].length * 6.4 + 10 < x1 - x0) b += S.text((x0 + x1) / 2, zt + zh / 2 + 4, z[3], 'sm b ' + z[4], 'middle');
      });
      b += S.line(xf(K), zt - 6, xf(K), zt + zh + 6, 's-acc w2');
      b += S.line(xf(be), zt, xf(be), zt + zh, 's-dn w2 dash2');
      b += S.polygon([[xf(S0), zt - 2], [xf(S0) - 6, zt - 12], [xf(S0) + 6, zt - 12]], 'f-ink');
      const place = (x, txt, y, cls) => { const w = txt.length * 6.6; let anc = 'middle'; if (x - w / 2 < 2) anc = 'start', x = 2; else if (x + w / 2 > W - 2) anc = 'end', x = W - 2; return S.text(x, y, txt, cls, anc); };
      b += place(xf(S0), 'now ' + money(S0), zt - 17, 'sm mono b ink');
      b += place(xf(K), 'strike ' + money(K), zt + zh + 18, 'sm mono b acc');
      b += place(xf(be), 'breakeven ' + money(be), zt + zh + 34, 'sm mono b dn');
      fig.innerHTML = S.wrap(W, H, `Price zones for a ${mode === 'put' ? 'cash-secured put' : 'covered call'} with strike ${money(K)} and breakeven ${money(be)}.`, b);
      stat(id + '-pc', usd0(P));
      stat(id + '-roc', F.pct(roc * 100, 2));
      stat(id + '-ann', F.pct(ann * 100, 1));
      stat(id + '-be', money(be));
      stat(id + '-cap', usd0(cap));
      stat(id + '-ifa', ifa, ifaCls);
      if (mode === 'put') msg(id + '-msg', K > S0 ? 'dn' : 'acc', 'Put', `You collect ${usd0(P)} now for agreeing to buy ${100 * n} shares at ${money(K)}. That is ${F.pct(roc * 100, 2)} on the ${usd0(cap)} you set aside (${F.pct(ann * 100, 1)} a year if repeated). If assigned, your real cost is ${money(be)} a share` + (K < S0 ? `, ${F.pct((1 - be / S0) * 100, 1)} below today's price.` : '.') + (K > S0 ? ' This strike is above the stock price, so assignment is likely.' : ''));
      else msg(id + '-msg', K < basis ? 'dn' : 'up', 'Call', `You collect ${usd0(P)} for agreeing to sell your shares at ${money(K)}. That is ${F.pct(roc * 100, 2)} of their value (${F.pct(ann * 100, 1)} a year if repeated). If the shares are called away, the trade makes ${ifa} versus your ${money(basis)} cost.` + (K < basis ? ' This strike is below your cost, so being called away locks in a loss.' : ''));
    });
  };

  /* =====================================================================
     brokerPicker: yearly options commissions by broker + needs filter + fee table
     Fees as of fall 2026 (brokerage-review.com Sep 2026; NerdWallet Jul 2026).
     Feature flags: 1 = yes, 0.5 = limited, new or changing (check), 0 = no.
     ===================================================================== */
  const BROKERS = [
    { k: 'rh', name: 'Robinhood', fee: 0, feeTxt: '$0', mf: 0, crypto: 1, api: 1, apiTxt: 'MCP (beta)', lt: 0, branch: 0, note: 'No mutual funds or bonds. IRA match 1% (3% with Gold). $75 transfer-out fee. Agentic Trading via MCP (beta).' },
    { k: 'wb', name: 'Webull', fee: 0, feeTxt: '$0', mf: 0, crypto: 1, api: 1, apiTxt: 'API', lt: 0, branch: 0, note: 'Regulatory and exchange fees apply on options.' },
    { k: 'pub', name: 'Public', fee: 0, feeTxt: '$0', mf: 0, crypto: 1, api: 0.5, apiTxt: 'Check', lt: 0, branch: 0, note: 'Offers rebates on options trades.' },
    { k: 'moo', name: 'moomoo', fee: 0, feeTxt: '$0', mf: 0, crypto: 0.5, api: 1, apiTxt: 'API', lt: 0, branch: 0, note: 'App built for active traders.' },
    { k: 'alp', name: 'Alpaca', fee: 0, feeTxt: '$0', mf: 0, crypto: 1, api: 1, apiTxt: 'MCP + API', lt: 0, branch: 0, note: 'API-first broker. Official MCP server, paper trading by default.' },
    { k: 'tt', name: 'tastytrade', fee: 0.5, open: true, feeTxt: '$0.50 open, $0 close', mf: 0, crypto: 1, api: 1, apiTxt: 'API', lt: 0, branch: 0, note: 'Built for options. Opening fee capped at $10 per leg.' },
    { k: 'ts', name: 'TradeStation', fee: 0.5, feeTxt: '$0.50', mf: 0.5, crypto: 0.5, api: 1, apiTxt: 'API', lt: 0, branch: 0, note: 'Charting and strategy tools for active traders.' },
    { k: 'sch', name: 'Schwab', fee: 0.65, feeTxt: '$0.65', mf: 1, crypto: 0.5, api: 1, apiTxt: 'API', lt: 1, branch: 1, note: 'Full service and research. Developer API.' },
    { k: 'fid', name: 'Fidelity', fee: 0.65, feeTxt: '$0.65', mf: 1, crypto: 1, api: 0, apiTxt: 'No', lt: 1, branch: 1, note: 'Branches and 24/7 support. Strong for long-term investing.' },
    { k: 'et', name: 'E*TRADE', fee: 0.65, feeTxt: '$0.65', mf: 1, crypto: 0.5, api: 1, apiTxt: 'API', lt: 0.5, branch: 0.5, note: 'Owned by Morgan Stanley.' },
    { k: 'ib', name: 'IBKR', full: 'Interactive Brokers', fee: 0.65, approx: true, feeTxt: 'about $0.65', mf: 1, crypto: 1, api: 1, apiTxt: 'API', lt: 0.5, branch: 0, note: 'Pro tools, global markets and a powerful API.' },
    { k: 'me', name: 'Merrill Edge', fee: 0.65, feeTxt: '$0.65', mf: 1, crypto: 0, api: 0, apiTxt: 'No', lt: 1, branch: 1, note: 'Linked with Bank of America accounts and branches.' },
    { k: 'vg', name: 'Vanguard', fee: 1, feeTxt: '$1.00', mf: 1, crypto: 0, api: 0, apiTxt: 'No', lt: 1, branch: 0, note: 'Built for long-term index investing.' },
  ];
  const NEEDS = [
    { k: 'mf', label: 'Mutual funds', short: 'mutual funds' },
    { k: 'crypto', label: 'Crypto', short: 'crypto' },
    { k: 'api', label: 'API / AI agents', short: 'an API for bots and AI agents' },
    { k: 'lt', label: 'Long-term investing focus', short: 'a long-term investing focus' },
    { k: 'branch', label: 'Branches & phone help', short: 'branches' },
  ];
  /* yearly options commissions; each contract is opened and closed (tastytrade: open only) */
  const bkCost = (b, perMonth) => perMonth * 12 * b.fee * (b.open ? 1 : 2);
  const yn = (v) => (v === 1 ? '<td class="up">Yes</td>' : v === 0.5 ? '<td class="acc">Check</td>' : '<td class="mut">No</td>');
  SML.css(`
    .mo-bk-cap{padding:12px 16px 0;font-size:13px;color:var(--muted)} .mo-bk-cap b{color:var(--ink)}
    .mo-bk{margin-top:8px}
    .mo-bk .tbl th,.mo-bk .tbl td{padding:8px 10px;font-size:13px;background:var(--surface)}
    .mo-bk .tbl thead th{font-size:10px;background:var(--shade)}
    .mo-bk .tbl th:first-child,.mo-bk .tbl td:first-child{position:sticky;left:0;z-index:1;box-shadow:inset -1px 0 0 var(--line)}
    .mo-bk .tbl td.nt{white-space:normal;min-width:300px;color:var(--muted)}
    .mo-bk .tbl td.acc{color:var(--accent)} .mo-bk .tbl td.mut{color:var(--muted)}
    .mo-bk .tbl tbody tr{cursor:pointer;transition:opacity .15s}
    .mo-bk .tbl tbody tr.nofit{opacity:.42}
    .mo-bk .tbl tbody tr.sel td{background:color-mix(in srgb,var(--accent) 13%,var(--surface))}
    .mo-bk .tbl tbody tr.sel td:first-child{box-shadow:inset 3px 0 0 var(--accent),inset -1px 0 0 var(--line)}
  `);
  SML.widgets.brokerPicker = function (root) {
    const id = SML.uid('bk');
    let sel = 'rh';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Your needs</span>${ui.chips(id + '-nd', NEEDS.map((n) => ({ k: n.k, label: n.label, color: 'var(--accent)', on: false })))}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-oc', label: 'Option contracts per month', min: 0, max: 200, step: 5, value: 20, fmt: 'num' })}${ui.slider({ id: id + '-tr', label: 'Stock & ETF trades per month', min: 0, max: 100, step: 1, value: 10, fmt: 'num' })}</div>
      <div class="wg-read mo-r4">${ui.stat('Brokers that fit', id + '-n')}${ui.stat('Cheapest fit', id + '-lo', 'hl')}${ui.stat('Priciest fit', id + '-hi')}${ui.stat('Stock trades', id + '-sk')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="mo-bk-cap">Online stock and ETF trades cost <b>$0</b> at every broker below. Swipe the table sideways for more.</div>
      <div class="mo-table mo-bk scroll"><table class="tbl"><thead><tr><th>Broker</th><th>Options, per contract</th><th>Mutual funds</th><th>Crypto</th><th>API / AI agents</th><th>Notes</th></tr></thead><tbody>${BROKERS.map((b) => `<tr data-k="${b.k}"><td><b>${b.full || b.name}</b></td><td>${b.feeTxt}</td>${yn(b.mf)}${yn(b.crypto)}<td class="${b.api === 1 ? 'up' : b.api ? 'acc' : 'mut'}">${b.apiTxt}</td><td class="nt">${b.note}</td></tr>`).join('')}</tbody></table></div>
      <div class="wg-note">Fees as of fall 2026 (brokerage-review.com, Sep 2026; NerdWallet, Jul 2026). Check the broker's site, fees change. “Check” means limited, new or changing. Bars count opening and closing each contract; options that expire worthless have no closing fee. Small regulatory fees apply on sells. Tap a row to read about a broker.</div>`;
    const fig = root.querySelector('.wg-fig'), rows = Array.prototype.slice.call(root.querySelectorAll('.mo-bk tbody tr'));
    const st = ui.wire(root, () => draw());
    const pick = (e) => { const t = e.target.closest && e.target.closest('[data-k]'); if (t) { sel = t.getAttribute('data-k'); draw(); } };
    const skLab = root.querySelector('#' + id + '-sk').previousElementSibling;
    fig.addEventListener('click', pick);
    root.querySelector('.mo-bk tbody').addEventListener('click', pick);
    const fitOf = (b, needs) => { if (!needs.length) return 1; let f = 1; needs.forEach((n) => { f = Math.min(f, b[n.k]); }); return f; };
    const draw = ui.responsive(fig, (W) => {
      const oc = st.n(id + '-oc'), tr = st.n(id + '-tr');
      const needs = NEEDS.filter((n) => st.on(id + '-nd', n.k));
      const compact = W < 520;
      const list = BROKERS.map((b, i) => ({ b, i, cost: bkCost(b, oc), fit: fitOf(b, needs) }));
      list.sort((p, q) => p.cost - q.cost || p.i - q.i);
      const maxC = Math.max(60, list[list.length - 1].cost);
      const tk = SML.ticks(0, maxC, compact ? 3 : 5), step = tk.length > 1 ? tk[1] - tk[0] : maxC;
      const hiT = Math.ceil(maxC / step - 1e-9) * step;
      if (tk[tk.length - 1] < hiT - 1e-9) tk.push(hiT);
      const LW = compact ? 84 : 112, RW = needs.length ? (compact ? 66 : 128) : (compact ? 52 : 70);
      const rowH = compact ? 25 : 27, top = 6, H = top + list.length * rowH + 34;
      const xf = SML.lin(0, hiT, LW + 10, W - RW);
      const yEnd = top + list.length * rowH;
      let s = '';
      tk.forEach((v) => {
        if (v > hiT + 1e-9) return;
        s += S.line(xf(v), top, xf(v), yEnd, v === 0 ? 's-mut w15' : 's-grid');
        s += S.text(xf(v), yEnd + 15, usd0(v), 'xs mono', 'middle');
      });
      s += S.text(LW + 10, yEnd + 30, 'Options commissions per year', 'xs mut');
      list.forEach((r, j) => {
        const b = r.b, yc = top + j * rowH + rowH / 2, on = b.k === sel;
        if (on) s += S.rect(0, yc - rowH / 2 + 1, W, rowH - 2, 'f-acc-t', 4);
        const nameCls = (compact ? 'sm ' : 'md ') + (r.fit === 0 ? 'mut' : 'ink') + (on ? ' b' : '');
        s += S.text(LW, yc + 4, b.name, nameCls, 'end');
        const bw = Math.max(3, xf(r.cost) - xf(0));
        s += S.rect(xf(0), yc - 6, bw, 12, r.fit === 1 ? 'f-acc' : r.fit === 0.5 ? 'f-acc o50' : 'f-mut o35', 2);
        const val = (b.approx && r.cost > 0 ? '~' : '') + usd0(r.cost);
        s += S.text(xf(0) + bw + 6, yc + 4, val, 'sm mono ' + (r.fit === 0 ? 'mut' : 'ink b'));
        if (needs.length) {
          const tag = r.fit === 1 ? (compact ? '✓' : '✓ fits') : r.fit === 0.5 ? (compact ? '?' : '? check') : (compact ? '–' : 'no match');
          s += S.text(W - 4, yc + 4, tag, (compact ? 'md b ' : 'sm ') + (r.fit === 1 ? 'up' : r.fit === 0.5 ? 'acc' : 'mut'), 'end');
        }
        s += S.rect(0, yc - rowH / 2, W, rowH, 'hit mo-row', 0, ` data-k="${b.k}"`);
      });
      fig.innerHTML = S.wrap(W, H, `Yearly options commissions at ${oc} contracts a month for ${BROKERS.length} brokers, sorted from cheapest. Brokers that match your needs are highlighted.`, s);

      const fits = list.filter((r) => r.fit === 1), maybe = list.filter((r) => r.fit === 0.5);
      const pool = fits.length ? fits : maybe;
      stat(id + '-n', `${fits.length} of ${BROKERS.length}`, fits.length ? 'up' : 'dn');
      stat(id + '-lo', pool.length ? usd0(pool[0].cost) + '/yr' : 'n/a', pool.length ? 'up' : '');
      stat(id + '-hi', pool.length ? usd0(pool[pool.length - 1].cost) + '/yr' : 'n/a', pool.length && pool[pool.length - 1].cost > 0 ? 'dn' : '');
      skLab.textContent = `${tr * 12} trades/yr`;
      stat(id + '-sk', '$0', 'up');
      rows.forEach((tr2) => { const k = tr2.getAttribute('data-k'), r = list.find((x) => x.b.k === k); tr2.classList.toggle('nofit', r.fit === 0); tr2.classList.toggle('sel', k === sel); });

      const cur = list.find((r) => r.b.k === sel), b = cur.b;
      const missing = needs.filter((n) => b[n.k] === 0).map((n) => n.short), unsure = needs.filter((n) => b[n.k] === 0.5).map((n) => n.short);
      const join = (a) => (a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0]);
      let t = `At ${oc} contracts a month, options cost <b>${(b.approx && cur.cost > 0 ? 'about ' : '') + usd0(cur.cost)} a year</b> here` + (b.open ? ' (you pay only to open)' : '') + '. ' + b.note;
      if (missing.length) t += ` It does not offer ${join(missing)}.`;
      else if (unsure.length) t += ` Check its site for ${join(unsure)}.`;
      if (!fits.length && maybe.length) t += ` No broker clearly has everything you ticked; ${maybe.length} might, so check their sites.`;
      else if (!fits.length) t += ' No broker here has everything you ticked. Try dropping one need.';
      else if (pool.length > 1 && pool[pool.length - 1].cost - pool[0].cost > 0) t += ` Among the ${fits.length} that fit, yearly options fees range from ${usd0(pool[0].cost)} to ${usd0(pool[pool.length - 1].cost)}.`;
      msg(id + '-msg', missing.length ? 'dn' : unsure.length ? 'acc' : 'up', b.name, t);
    });
  };

  /* =====================================================================
     Lessons: Market Basics
     ===================================================================== */
  SML.lessons.push(
    {
      id: 'l-stocks', course: 'basics', order: 1, title: 'What a stock is', mins: 3, level: 'Beginner',
      summary: 'Owning a share means owning a small slice of a real business.',
      idea: 'A share is a tiny slice of a company. Its price moves as people change their view of that business.',
      widget: 'ownershipLab', opts: {},
      try: 'Buy more or fewer shares, change the price, then see what happens if the company grows or struggles.',
      body: [
        '<p>Companies split their ownership into many equal pieces called <b>shares</b>. Buy one and you own a small part of the business: its profits and its future.</p>',
        '<p>You can make money two ways. The price can rise because people expect the company to earn more. Some companies also pay a <b>dividend</b>, a slice of profits sent to owners in cash.</p>',
        '<p>Prices can fall too. If the business struggles, buyers only pay less for each slice. If a company fails, its shares can become worthless.</p>',
      ],
      points: ['A share is a slice of ownership in a real business.', 'You earn from a rising price and, sometimes, dividends.', 'The price reflects what buyers expect the company to earn.', 'The most you can lose on shares you own is what you paid.'],
      quiz: { q: 'A company has 1,000,000 shares and you own 10,000. What do you own?', options: ['1% of the company', '10% of the company', '0.1% of the company'], answer: 0, why: '10,000 ÷ 1,000,000 = 0.01, which is 1%.' },
      terms: ["Stock", "Share", "Dividend", "Diversification"],
      example: {"title": "Buying 10 shares of DEMO", "intro": "DEMO is a made-up company used for this example.", "steps": ["DEMO has 2,000,000 shares and trades at $40, so the whole company is valued at 2,000,000 × $40 = $80 million.", "You buy 10 shares for $400. You now own 10 ÷ 2,000,000 = 0.0005% of the business.", "DEMO pays a $0.50 dividend per share each year, so you receive $5 a year in cash.", "A year later the price is $46. Your shares are worth $460: a $60 gain on top of the $5 of dividends."], "result": "Total return: $65 on $400, or 16.25%. If the price had fallen to $34 instead, you would be down $60 before dividends."},
      mistakes: ["Thinking a $5 share is cheaper than a $500 share. What matters is the value of the whole company, not the price of one slice.", "Buying a company you cannot explain in one sentence just because its price is moving.", "Putting most of your money into one stock. If that company fails, so does your account."],
      glossary: [{"t": "Market cap", "d": "Share price × number of shares: the total value the market puts on a company."}, {"t": "Ticker", "d": "The short symbol a stock trades under, like DEMO in these examples."}],
    },
    {
      id: 'l-bonds', course: 'basics', order: 2, title: 'Bonds & interest rates', mins: 4, level: 'Beginner',
      summary: 'Lend money, earn fixed interest, and why prices fall when rates rise.',
      idea: 'A bond is a loan you make. It pays fixed interest, and its price moves opposite to interest rates.',
      widget: 'bondSeesaw', opts: {},
      try: 'Move the market rate above and below the coupon and watch the seesaw tip.',
      body: [
        '<p>When you buy a <b>bond</b> you lend money to a government or a company. They pay you fixed interest every year, called the <b>coupon</b>, and hand back the face value (usually $1,000) at the end.</p>',
        '<p>If new bonds start paying more, nobody will pay full price for your older, lower-paying bond. Its price drops until its <b>yield</b> matches the market. When rates fall, the opposite happens.</p>',
        '<p>Longer bonds swing more, because you are locked into the old rate for more years. Hold a bond to the end and you still get the $1,000 back, as long as the borrower does not default.</p>',
      ],
      points: ['A bond is a loan with fixed interest payments.', 'Rates up means existing bond prices down, and the reverse.', 'Longer maturities mean bigger price swings.', 'Held to maturity, you get the face value back unless the borrower defaults.'],
      quiz: { q: 'You own a 4% bond. New bonds now pay 6%. What happens to your bond’s price?', options: ['It rises', 'It falls', 'It stays at $1,000'], answer: 1, why: 'Buyers can get 6% elsewhere, so they only buy your 4% bond at a discount.' },
      terms: ["Bond", "Coupon", "Yield"],
      example: {"title": "A 5-year bond when rates rise", "steps": ["You buy a $1,000 bond with a 4% coupon, so it pays you $40 a year for 5 years.", "A year later, new 4-year bonds pay 6%. A buyer can now get $60 a year elsewhere.", "To give a new buyer a 6% yield, your bond’s price falls to about $931. That is a paper loss of about $69.", "If you hold to maturity you still collect every $40 coupon and get the $1,000 back, so the loss disappears unless you sell early."], "result": "A 2-point rise in rates cut about 7% from a bond with 4 years left. Longer bonds fall further for the same rate rise."},
      mistakes: ["Buying long-term bonds for safety without realizing their prices can fall a lot when rates rise.", "Chasing the highest yield without checking who is borrowing. A higher yield usually means a higher risk of default.", "Selling a sound bond in a panic when rates rise, locking in a loss you could have waited out."],
      glossary: [{"t": "Face value", "d": "The amount a bond repays at the end, usually $1,000."}, {"t": "Default", "d": "When a borrower fails to pay interest or return the face value."}],
    },
    {
      id: 'l-etfs', course: 'basics', order: 3, title: 'Index funds & ETFs', mins: 3, level: 'Beginner',
      summary: 'One purchase, hundreds of companies, and why spreading out protects you.',
      idea: 'An index fund holds hundreds of companies, so one company’s disaster barely dents your money.',
      widget: 'diversifyLab', opts: {},
      try: 'Pick 1, 10 or 500 holdings, then crash one company and compare the damage.',
      body: [
        '<p>An <b>index fund</b> buys every company on a list, such as the S&amp;P 500 (about 500 large US companies). An <b>ETF</b> is a fund that trades on the exchange like a stock, so you can buy the whole basket in one order.</p>',
        '<p>Spreading money across many companies is called <b>diversification</b>. One bad company hurts a lot when it is all you own and almost nothing when it is 1 of 500.</p>',
        '<p>Diversification does not stop the whole market from falling together. It removes the risk of one company sinking you, which is why index funds sit at the core of most long-term portfolios.</p>',
      ],
      points: ['An index fund is many companies in one purchase.', 'ETFs trade like stocks during market hours.', 'More holdings means any one failure matters less.', 'The whole market can still fall; diversification limits single-company risk.'],
      quiz: { q: 'You own 500 equal holdings and one falls 50%. Roughly how much does your portfolio fall?', options: ['50%', '10%', '0.1%'], answer: 2, why: 'That company is 0.2% of your money. Half of 0.2% is 0.1%.' },
      terms: ["ETF", "Index fund", "Diversification", "Stock"],
      example: {"title": "One stock versus an index fund", "steps": ["You have $10,000. Choice A: all of it in one company. Choice B: a fund holding 500 companies in equal amounts.", "One company in the fund loses half its value in a single day.", "Choice A: that company is your whole account, so you lose $5,000.", "Choice B: that company is 1/500 of the fund, $20 of your money, so you lose about $10."], "result": "Same bad news, $5,000 lost versus about $10. Diversification removes single-company risk, not the risk of the whole market falling."},
      mistakes: ["Owning five funds that all hold the same big companies and calling it diversified.", "Ignoring the expense ratio. A fund that charges 1% a year costs ten times more than one that charges 0.1%.", "Selling an index fund during a market drop. The whole market can fall together, and diversification does not prevent that."],
      glossary: [{"t": "Expense ratio", "d": "The yearly fee a fund charges, as a percent of the money you hold in it."}, {"t": "S&P 500", "d": "An index of about 500 large US companies, often used as a measure of the whole US market."}],
    },
    {
      id: 'l-risk-ladder', course: 'basics', order: 4, title: 'The risk ladder', mins: 3, level: 'Beginner',
      summary: 'Cash, bonds, funds, stocks and options ranked from calm to wild.',
      idea: 'Each step up the ladder offers more possible reward and asks you to accept bigger, faster losses.',
      widget: 'riskLadder', opts: {},
      try: 'Pick an investment, switch between a good and a bad year, and see what your money could become.',
      body: [
        '<p>Cash in a savings account barely moves. Bonds move a little. A broad index fund can fall by a third in a bad year. A single company can go to zero, and an option can lose everything in days.</p>',
        '<p>Higher possible reward always comes with higher risk. Nobody gets the upside without accepting the downside.</p>',
        '<p>Most people keep their long-term money on the lower rungs and use only a small slice for the top ones.</p>',
      ],
      points: ['Risk and reward rise together.', 'Index funds have fallen more than 30% in bad years.', 'Single stocks and bought options can go to zero.', 'Size each rung so a bad year cannot wreck you.'],
      quiz: { q: 'Which of these can lose 100% of what you put in?', options: ['Only options', 'Single stocks and options', 'Cash in a savings account'], answer: 1, why: 'A company can go bankrupt and an option can expire worthless.' },
      terms: ["Stock", "Bond", "Index fund", "Option", "Diversification"],
      example: {"title": "Spreading $20,000 across the ladder", "steps": ["You split $20,000: $4,000 cash, $4,000 bonds, $10,000 in an index fund, $1,500 across two stocks and $500 for options.", "A bad year hits: bonds fall 10%, the index fund falls 30%, one of the two $750 stock positions falls 60%, and the options expire worthless.", "Losses: bonds $400, index fund $3,000, the stock $450 and the options $500. That is $4,350 in total.", "You are down about 22%. It hurts, but your $4,000 of cash is untouched and ready to buy at lower prices."], "result": "Put the same $20,000 entirely into options and that bad year would have taken all of it."},
      mistakes: ["Putting money you need within a year on the top rungs of the ladder.", "Judging risk by last year’s returns. A calm year says little about the next bad one.", "Letting one winning position grow until it dominates the whole account."],
      glossary: [{"t": "Bear market", "d": "A fall of 20% or more from a recent high in a broad market index."}],
    },
    {
      id: 'l-broker', course: 'basics', order: 5, title: 'Choosing a broker', mins: 6, level: 'Beginner',
      summary: 'Fees, account types, safety and AI tools: how to compare brokers before you open an account.',
      idea: 'Stock trades are $0 almost everywhere. Compare options fees, what you can trade, how your orders are filled, and how the broker earns from you.',
      widget: 'brokerPicker', opts: {},
      try: 'Set how many option contracts you trade, tick the features you need, and see which brokers fit and what each costs per year.',
      body: ["<p>A <b>broker</b> holds your account and sends your orders to the market. Almost every US broker now charges $0 to buy or sell stocks and ETFs online, so the real differences are options fees, what you can trade, how well your orders are filled, and the tools you get. This lesson uses Robinhood as the worked example because it is popular. The same checks apply to any broker.</p>", "<h3>How a $0 broker makes money</h3><ul><li><b>Payment for order flow.</b> Market makers pay the broker to send them your orders.</li><li><b>Interest on your cash.</b> The broker earns more on uninvested cash than it pays you.</li><li><b>Margin interest.</b> You pay interest when you borrow to trade.</li><li><b>Subscriptions.</b> Paid tiers such as Robinhood Gold.</li><li><b>Stock lending.</b> The broker lends shares to short sellers and keeps part of the fee.</li></ul><p>None of this is hidden, but it means “free” has a cost somewhere. Compare the rate a broker pays on uninvested cash, too.</p>", "<h3>Spreads and execution quality</h3><p>Every quote has a <b>bid</b> (what buyers pay) and an <b>ask</b> (what sellers want). Buy at the ask and sell at the bid, and you lose the gap. A broker that fills you a cent better per share saves you more than a $0 commission on big orders. Brokers publish order-routing reports (Rule 606) and execution-quality reports (Rule 605). Use limit orders on anything thinly traded.</p>", "<h3>Account types</h3><ul><li><b>Cash account.</b> You trade only with settled cash. Stocks settle the next business day (T+1). The safest place to start.</li><li><b>Margin account.</b> You can borrow against your holdings. It needs at least $2,000, you pay interest, and losses can exceed what you put in. The old $25,000 pattern-day-trader rule was removed in 2026, though brokers can set stricter limits.</li><li><b>IRA.</b> A retirement account with tax benefits (Traditional or Roth). Most brokers allow covered calls and cash-secured puts in an IRA, but not borrowing. Robinhood adds a 1% match on contributions (3% with Gold).</li></ul>", "<h3>SIPC, fractional shares and trading hours</h3><p><b>SIPC</b> protects up to $500,000 per customer, including $250,000 of cash, if a member broker fails. It does not cover market losses, and crypto is not covered.</p><p><b>Fractional shares</b> let you invest by dollar amount: $50 of a $400 stock buys 0.125 shares. Fractional shares often cannot be moved to another broker and may be sold during a transfer, and covered calls need 100 whole shares.</p><p><b>Extended hours</b> run before the 9:30 am open and after the 4:00 pm close (Eastern). Some brokers, including Robinhood, also offer overnight trading on popular stocks five days a week. Fewer traders are active then, so spreads are wider and prices jump more. Use limit orders.</p>", "<h3>Transfer-out fees</h3><p>Moving your account to another broker uses a system called ACATS. Many brokers charge for it: Robinhood charges $75 for a full transfer out. Some brokers repay that fee when you move in, so ask before you move.</p>", "<h3>APIs and AI agents</h3><p>An <b>API</b> lets software read quotes and place orders for you. Schwab, Interactive Brokers, tastytrade and others offer developer APIs. Newer brokers connect to AI assistants through MCP servers:</p><ul><li><b>Robinhood Agentic Trading</b> (beta, US only) connects tools like Claude through the official server at <code>agent.robinhood.com/mcp/trading</code>. The agent trades only inside a separate agentic account you fund as its budget, though it can read all your Robinhood accounts. You can review each trade before it happens and get a notification for every order.</li><li><b>Alpaca</b> is built for APIs and runs an official MCP server that starts in paper trading (fake money) by default.</li></ul><p>Setting this up safely, step by step, is covered in <a href=\"#l-ai-automate\">the AI automation lesson</a>.</p>", "<h3>Red flags</h3><ul><li>An app or “broker” you cannot find on FINRA BrokerCheck or the SIPC member list, often based offshore.</li><li>Promises of guaranteed or fixed returns, or an “account manager” who messages you on WhatsApp or Telegram.</li><li>Pressure to deposit crypto, or fees you must pay before you can withdraw.</li></ul><p>A regulated US broker never promises returns.</p>", "<h3>Open and fund an account safely</h3><ul><li>Download the app from the official store or type the web address yourself. Do not click links in texts or ads.</li><li>Expect to give your Social Security number and ID. Every regulated US broker must verify who you are.</li><li>Turn on two-factor authentication (2FA), ideally with an authenticator app rather than text messages. Use a unique password.</li><li>Choose a cash account to start. You can add margin later if you need it.</li><li>Link your bank through the broker’s own flow and start with a small deposit. Never share a login code with anyone, including “support”.</li></ul>"],
      points: ["Online stock and ETF trades are $0 at nearly every US broker. Options fees run from $0 to about $1 per contract.", "A $0 broker earns from order flow, your cash, margin loans, subscriptions and stock lending.", "Start with a cash account. Margin lets you lose more than you deposit.", "SIPC covers you if the broker fails, not if your investments fall.", "Pick by the features you need, check fees on the broker’s site, and turn on 2FA before you deposit."],
      quiz: { q: 'Your broker fails. You had $40,000 in stocks and $10,000 in cash there. What does SIPC protect?', options: ['All $50,000: it covers up to $500,000, including $250,000 of cash', 'Nothing: SIPC only covers bank deposits', 'Any losses your stocks had over the past year'], answer: 0, why: 'SIPC replaces missing securities and cash when a member broker fails, up to $500,000 including $250,000 of cash. It never covers market losses.' },
      terms: ["Brokerage", "Commission", "Payment for order flow", "SIPC", "Fractional share", "Margin account", "Cash account", "Bid-ask spread", "API"],
      example: {"title": "Opening a Robinhood account with $500", "intro": "Robinhood is the example here. The same steps work at any broker.", "steps": ["You download the app from the official store, verify your ID and choose a cash account (no margin). Then you turn on 2FA with an authenticator app.", "You link your bank and deposit $500.", "You buy $100 of an S&P 500 index ETF priced at $500 a share. Fractional shares let you own 0.2 of a share.", "You also trade about 10 option contracts a month, each opened and closed: 10 × 2 × 12 = 240 contract fees a year. At $0 per contract you pay $0. At $0.65 you would pay 240 × $0.65 = $156.", "A year later you want to move. A full transfer out costs $75, and your 0.2 fractional share may be sold rather than moved, which can create a small taxable gain or loss."], "result": "You saved about $156 a year in options fees. Leaving costs $75, so weigh the exit fee, your fills and the rate on your cash too."},
      mistakes: ["Choosing a broker only because trades are $0, without checking options fees, fills, cash interest and the features you need.", "Opening a margin account by default and borrowing without meaning to.", "Sending money to an app that promises fixed returns or that you cannot find on FINRA BrokerCheck.", "Skipping 2FA or reusing a password on the account that holds your savings."],
      glossary: [{"t": "ACATS transfer", "d": "The standard system US brokers use to move an account from one firm to another. It usually takes about a week."}, {"t": "Extended hours", "d": "Trading before the 9:30 am open or after the 4:00 pm close (Eastern). Fewer traders and wider spreads."}, {"t": "2FA", "d": "Two-factor authentication: a second code from an app or key, on top of your password, to sign in."}],
    }
  );

  /* =====================================================================
     Lessons: Options & the Wheel
     ===================================================================== */
  SML.lessons.push(
    {
      id: 'l-options-101', course: 'options', order: 1, title: 'Calls and puts', mins: 4, level: 'Beginner',
      summary: 'A call bets on up, a put bets on down. Buyers risk only the premium.',
      idea: 'A call profits when the stock rises above the strike, a put when it falls below. Buyers can lose only what they paid.',
      widget: 'optionPayoff', opts: { simple: true },
      try: 'Switch between a call and a put, then drag across the chart to see the profit or loss at expiration.',
      body: [
        '<p>An <b>option</b> is a contract that gives you the right to buy or sell 100 shares at a set price, the <b>strike</b>, until a set date, the <b>expiration</b>. You pay for that right. The price is called the <b>premium</b>.</p>',
        '<p>A <b>call</b> is the right to buy. It gains value when the stock climbs above the strike. A <b>put</b> is the right to sell. It gains value when the stock drops below the strike.</p>',
        '<p>If the stock does not move far enough before expiration, the option can expire worthless and you lose the premium. That is the most a buyer can lose.</p>',
      ],
      points: ['Call: the right to buy. It profits when the stock rises.', 'Put: the right to sell. It profits when the stock falls.', 'Breakeven = strike + premium for a call, strike − premium for a put.', 'The most a buyer can lose is the premium paid.'],
      quiz: { q: 'You buy a $100 call for $3. Where is your breakeven at expiration?', options: ['$97', '$100', '$103'], answer: 2, why: 'The stock must climb past the strike by the $3 you paid: $100 + $3 = $103.' },
      terms: ["Option", "Call", "Put", "Strike", "Premium", "Expiration"],
      example: {"title": "Buying a call on DEMO", "steps": ["DEMO trades at $50. You buy one $52 call that expires in 30 days for $1.50, which costs $150.", "Your breakeven at expiration is $52 + $1.50 = $53.50.", "DEMO finishes at $56. The call is worth $56 − $52 = $4.00, or $400 for the contract.", "Profit: $400 − $150 = $250. Had DEMO finished below $52, the call would have expired worthless and you would have lost the $150."], "result": "You risked $150 to make $250 at $56. The stock had to rise 7% just to break even."},
      mistakes: ["Forgetting the ×100. A $1.50 quote costs $150 per contract, not $1.50.", "Buying very cheap, far out-of-the-money options that need a huge move to pay off.", "Holding to the final day hoping for a miracle while the time value melts away."],
      glossary: [{"t": "Breakeven", "d": "The stock price at which an option trade neither makes nor loses money at expiration."}],
    },
    {
      id: 'l-contracts', course: 'options', order: 2, title: 'Contracts & moneyness', mins: 4, level: 'Beginner',
      summary: '100 shares per contract, and what in, at and out of the money mean.',
      idea: 'One contract covers 100 shares. An option is in the money when using it right now would be worth something.',
      widget: 'moneynessLab', opts: {},
      try: 'Move the stock price and watch the calls and puts change color. Tap a strike to split its price in two.',
      body: [
        '<p>Option prices are quoted per share, but one <b>contract</b> controls 100 shares. A quote of $2.50 costs $250.</p>',
        '<p>A call is <b>in the money</b> (ITM) when the stock is above its strike. A put is ITM when the stock is below its strike. A strike right at the stock price is <b>at the money</b> (ATM). Everything else is <b>out of the money</b> (OTM).</p>',
        '<p>An option’s price has two parts. <b>Intrinsic value</b> is what it is worth if used right now. <b>Time value</b> is the extra people pay for the chance it moves further before expiration. OTM options are pure time value.</p>',
      ],
      points: ['Quote × 100 = the cost of one contract.', 'Calls are ITM at strikes below the stock price, puts at strikes above it.', 'Price = intrinsic value + time value.', 'OTM options are cheap because they are all time value.'],
      quiz: { q: 'The stock is at $103. Which option is in the money?', options: ['The $105 call', 'The $100 call', 'The $100 put'], answer: 1, why: 'A call is ITM when the stock is above its strike, and $103 is above $100.' },
      terms: ["Contract", "ITM", "ATM", "OTM", "Intrinsic value", "Time value"],
      example: {"title": "Splitting an option’s price", "steps": ["DEMO is at $103. The $100 call costs $4.20.", "Intrinsic value: $103 − $100 = $3.00. That part is real right now.", "Time value: $4.20 − $3.00 = $1.20. That is what you pay for the chance of a bigger move.", "The $105 call costs $1.10. It is out of the money, so all $1.10 is time value, and one contract costs $110."], "result": "If DEMO is still at $103 on expiration day, the $100 call ends worth $3.00 and the $105 call ends worth nothing."},
      mistakes: ["Mixing up calls and puts. A call is in the money below the stock price, a put above it.", "Paying for a lot of time value on options that expire in a few days.", "Ignoring a wide bid-ask spread. A $0.30 spread on a $1.00 option costs about 30% to get in and back out."],
    },
    {
      id: 'l-payoff', course: 'options', order: 3, title: 'Payoff diagrams', mins: 5, level: 'Intermediate',
      summary: 'Read any option trade in one chart: profit, loss and breakeven.',
      idea: 'A payoff diagram shows your profit or loss at every possible stock price on expiration day.',
      widget: 'optionPayoff', opts: {},
      try: 'Switch between buying and selling calls and puts. Hover, tap or drag across the chart to read the result at any price.',
      body: [
        '<p>The solid line shows profit or loss at expiration. Above zero you make money, below zero you lose. Where it crosses zero is your <b>breakeven</b>.</p>',
        '<p>The dashed line shows the same trade valued today. It is smoother because the option still holds some time value.</p>',
        '<p>Buyers have limited losses and room for big gains, but many short-dated options expire worthless. Sellers collect the premium up front and win more often, but they take larger losses when the stock moves hard against them.</p>',
      ],
      points: ['Solid line: result at expiration. Dashed line: value today.', 'A buyer’s max loss is the premium. A seller’s max profit is the premium.', 'Selling a call without owning the shares has unlimited risk.', 'Know your breakeven before you enter.'],
      quiz: { q: 'You sell a put and collect the premium. What is your best case?', options: ['Unlimited profit', 'Keeping the full premium', 'Getting 100 shares for free'], answer: 1, why: 'A seller’s profit is capped at the premium collected.' },
      terms: ["Premium", "Strike", "Call", "Put", "Assignment"],
      example: {"title": "Selling a put on DEMO", "steps": ["DEMO trades at $50. You sell one $47 put expiring in 30 days for $1.00 and collect $100.", "Best case: DEMO stays above $47 and you keep the whole $100.", "Breakeven: $47 − $1.00 = $46. Below that you start losing money.", "DEMO drops to $42. The put is worth $5.00, so you owe $500 against the $100 you collected: a $400 loss."], "result": "Max profit $100, max loss $4,600 if DEMO went to zero. Sellers win often, so they must size for the bad case."},
      mistakes: ["Selling options because they usually expire worthless, without planning for the big move.", "Selling calls on shares you do not own, which carries unlimited risk.", "Reading the dashed line (value today) as the final result. Only the solid line shows the outcome at expiration."],
      glossary: [{"t": "Naked call", "d": "Selling a call without owning the shares. The possible loss has no limit."}],
    },
    {
      id: 'l-delta-gamma', course: 'options', order: 4, title: 'Delta & gamma', mins: 5, level: 'Intermediate',
      summary: 'How much an option moves for each $1 in the stock, and how fast that changes.',
      idea: 'Delta tells you how much the option moves when the stock moves $1. Gamma tells you how fast delta changes.',
      widget: 'greeksLab', opts: {},
      try: 'Slide the stock price, days and volatility, or drag across the chart. Watch the markers ride the curves.',
      body: [
        '<p><b>Delta</b> runs from 0 to 1 for calls and from 0 to −1 for puts. A call with delta 0.50 gains about $0.50 per share ($50 per contract) when the stock rises $1. Traders also read delta as a rough chance the option finishes in the money.</p>',
        '<p><b>Gamma</b> is the speed of delta. It is highest when the stock sits near the strike close to expiration. That is when option prices swing the most.</p>',
        '<p>Deep in-the-money options have delta near 1 and move almost like the stock. Far out-of-the-money options have delta near 0 and barely react.</p>',
      ],
      points: ['Delta ≈ dollars the option moves per $1 in the stock, per share.', 'Delta 0.30 ≈ roughly a 30% chance of finishing in the money.', 'Gamma peaks at the strike and near expiration.', 'Multiply by 100 for one contract.'],
      quiz: { q: 'A call has delta 0.40. The stock rises $2. About how much does one contract gain?', options: ['$40', '$80', '$0.80'], answer: 1, why: '0.40 × $2 = $0.80 per share, and × 100 shares = $80.' },
      terms: ["Delta", "Gamma", "Call", "Strike"],
      example: {"title": "Delta and gamma in action", "steps": ["DEMO is at $100. The $100 call costs $4.00 with delta 0.52 and gamma 0.04.", "DEMO rises $1. The call gains about $0.52, to about $4.52, which is $52 per contract.", "Gamma raises delta by about 0.04, so delta is now about 0.56.", "Another $1 rise adds about $0.56, taking the call to about $5.08."], "result": "Two dollars in the stock added about $1.08 to the option, $108 per contract, a 27% gain on $400."},
      mistakes: ["Forgetting that delta changes as the stock moves. Gamma makes it speed up or slow down.", "Treating delta as an exact probability. It is only a rough guide from a pricing model.", "Buying short-dated, at-the-money options without respecting how fast gamma makes them swing."],
    },
    {
      id: 'l-theta', course: 'options', order: 5, title: 'Theta: time decay', mins: 4, level: 'Intermediate',
      summary: 'Options lose value every day, and the melt speeds up near expiration.',
      idea: 'Time value melts every day, and the melting speeds up in the last few weeks.',
      widget: 'thetaLab', opts: {},
      try: 'Press play to watch time run out, or drag the days slider yourself.',
      body: [
        '<p><b>Theta</b> is how much value an option loses per day if nothing else changes. A theta of −0.05 means about $5 per contract per day.</p>',
        '<p>Decay is slow when expiration is months away and fast in the final weeks. At-the-money options lose the most dollars because they hold the most time value.</p>',
        '<p>Theta hurts option buyers and pays option sellers. That is why strategies like the wheel sell options and let time work for them.</p>',
      ],
      points: ['Theta is the value lost per day.', 'Decay speeds up in the last 30 days.', 'At-the-money options decay the most in dollars.', 'Buyers fight time; sellers collect it.'],
      quiz: { q: 'When does an at-the-money option lose value fastest?', options: ['90 days before expiration', 'In the final week', 'It loses the same amount every day'], answer: 1, why: 'Time decay accelerates as expiration gets close.' },
      terms: ["Theta", "Time value", "Expiration", "Premium"],
      example: {"title": "Watching a call melt", "steps": ["You buy a 30-day $100 call on DEMO for $3.20. Theta is −0.05.", "DEMO goes nowhere. Early in the month you lose about $0.05 a day, or $5 per contract.", "With 10 days left the call is worth about $1.85 and theta is close to −0.09, so each flat day now costs about $9.", "On expiration day DEMO is still at $100. The call is worth $0: all $320 was time value."], "result": "The stock did nothing and the buyer lost $320. A seller of the same call would have kept it."},
      mistakes: ["Buying options with only days left and hoping, just when decay is fastest.", "Forgetting weekends. Time keeps passing while the market is closed.", "Holding a losing option with no time stop and letting theta finish it off."],
      glossary: [{"t": "Time stop", "d": "An exit based on time: if the trade has not worked by a set date, you close it."}],
    },
    {
      id: 'l-iv-crush', course: 'options', order: 6, title: 'IV & earnings', mins: 5, level: 'Intermediate',
      summary: 'Why an option can lose money even when the stock moves your way.',
      idea: 'Before earnings, option prices are pumped up by expected volatility. After the news, that air comes out.',
      widget: 'ivCrushLab', opts: {},
      try: 'Set the stock’s earnings move and see how much of it the drop in IV eats.',
      body: [
        '<p><b>Implied volatility</b> (IV) is the size of move the market expects, baked into an option’s price. Before earnings nobody knows the news, so IV and option prices climb.</p>',
        '<p>Once the news is out the uncertainty is gone and IV collapses. This <b>IV crush</b> can wipe out the gain from guessing the direction right.</p>',
        '<p>To profit from buying options into earnings, the stock has to move more than the market already expected. Sellers aim to collect that inflated premium instead, and accept the risk of a huge move.</p>',
      ],
      points: ['High IV means expensive options.', 'IV usually drops sharply right after earnings.', 'A small move your way can still lose money.', 'Vega shows how much the price changes per 1 point of IV.'],
      quiz: { q: 'You buy a call before earnings. The stock rises 3% but IV falls from 90% to 35%. What is likely?', options: ['A big gain', 'A loss, from IV crush', 'No change'], answer: 1, why: 'The drop in IV removes more value than the small move adds.' },
      terms: ["IV", "IV crush", "Vega", "Volatility", "Expected move"],
      example: {"title": "A call bought before earnings", "steps": ["DEMO is at $100 the day before earnings, with IV at 90%. A $100 call expiring in 7 days costs about $5.00.", "Earnings beat. DEMO opens at $103, up 3%, and IV falls to 35%.", "The call is now worth about $3.75. Its intrinsic value is $3.00, but most of its time value vanished with the IV.", "You sell for a loss of about $1.25 per share, or $125 per contract, after guessing the direction right."], "result": "To profit, DEMO needed to move more than the roughly 10% the options were pricing in."},
      mistakes: ["Buying options right before earnings without checking how big a move is already priced in.", "Assuming a correct direction guess means a profit.", "Selling premium into earnings with too much size. A surprise gap can be several times the expected move."],
      glossary: [{"t": "Straddle", "d": "A call and a put at the same strike. Its price shows roughly how big a move the market expects."}],
    },
    {
      id: 'l-wheel', course: 'options', order: 7, title: 'The wheel strategy', mins: 6, level: 'Intermediate',
      summary: 'Sell puts, maybe get shares, sell calls, repeat. Collect premium each turn.',
      idea: 'The wheel sells options on a stock you would happily own, collecting premium at every turn.',
      widget: 'wheelSim', opts: {},
      try: 'Choose a strike style, sell a put, and play month by month. Then compare with simply buying and holding.',
      body: [
        '<p><b>Step one:</b> with enough cash to buy 100 shares, sell a <b>cash-secured put</b>. If the stock stays above the strike, you keep the premium and do it again.</p>',
        '<p><b>Step two:</b> if the stock falls below the strike, you are <b>assigned</b> and buy 100 shares at the strike. Your real cost is lower because you kept the premium.</p>',
        '<p><b>Step three:</b> sell a <b>covered call</b> above your cost. If the stock rises past the strike, your shares are sold and you are back to cash. If not, keep the premium and sell another call.</p>',
        '<p>The wheel works best on steady companies you want to own. Its risks: a stock that crashes leaves you holding a loser, and a stock that rockets past your call strike caps your upside.</p>',
      ],
      points: ['Only wheel stocks you would hold for years.', 'For puts, keep enough cash to buy the shares.', 'For calls, sell strikes above your cost.', 'Premium cushions losses but cannot stop a crash.'],
      quiz: { q: 'Your $38 put is assigned after you collected $1.00 per share. What is your cost per share?', options: ['$38', '$37', '$39'], answer: 1, why: 'You paid $38 but keep the $1 premium, so your cost basis is $37.' },
      terms: ["Wheel", "Cash-secured put", "Covered call", "Assignment", "Premium"],
      example: {"title": "One turn of the wheel on DEMO", "steps": ["DEMO is at $40. You hold $3,800 cash and sell one $38 put for $0.90, collecting $90.", "DEMO closes at $36.50 on expiration. You are assigned 100 shares at $38. Your cost basis is $38 − $0.90 = $37.10.", "You sell a $38 covered call for $0.80 and collect $80. Your basis drops to $36.30.", "DEMO rallies to $39 by expiration and your shares are called away at $38.", "You bought and sold at $38, so the profit is the two premiums: $170 on $3,800 over two months."], "result": "About 4.5% in two months. Had DEMO kept falling to $30, you would be down about $630 even after both premiums."},
      mistakes: ["Wheeling a stock you would not want to own just because its premium is high.", "Selling calls below your cost basis and locking in a loss when the shares are called away.", "Putting all your cash into one wheel. One crash can tie up the whole account."],
      glossary: [{"t": "Cost basis", "d": "What you effectively paid per share after subtracting the premiums you collected."}],
    }
  );
})();
