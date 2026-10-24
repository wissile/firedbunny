/* Stock Market Lessons: Reading Charts + Indicators (mod-charts) */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const MC = (SML._mc = SML._mc || {});
  const byId = (x) => document.getElementById(x);
  const setHTML = (id, h) => { const e = byId(id); if (e) e.innerHTML = h; };
  const setStat = (id, t, cls) => { const e = byId(id); if (e) { e.textContent = t; e.className = 'stat-v' + (cls ? ' ' + cls : ''); } };
  const smooth = (t) => t * t * (3 - 2 * t);
  MC.byId = byId; MC.setHTML = setHTML; MC.setStat = setStat; MC.smooth = smooth;

  /* push labels apart vertically: items [{y}] -> adds .ly */
  MC.spread = function (items, gap, top, bottom) {
    items.sort((a, b) => a.y - b.y);
    for (let i = 0; i < items.length; i++) items[i].ly = Math.max(items[i].y, i ? items[i - 1].ly + gap : top);
    for (let i = items.length - 1; i >= 0; i--) { const lim = i === items.length - 1 ? bottom : items[i + 1].ly - gap; if (items[i].ly > lim) items[i].ly = lim; }
    for (let i = 0; i < items.length; i++) if (items[i].ly < top) items[i].ly = top;
    return items;
  };
  MC.minMax = function (cs) { let lo = Infinity, hi = -Infinity; cs.forEach((k) => { if (!k) return; lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); }); return [lo, hi]; };
  /* right-hand price axis + faint grid */
  MC.axis = function (yf, lo, hi, x0, x1, n, d) {
    let s = '';
    SML.ticks(lo, hi, n || 5).forEach((v) => { const yy = yf(v); if (yy < 4 || yy > yf(lo) + 2) return; s += S.line(x0, yy, x1, yy, 's-grid'); s += S.text(x1 + 6, yy + 3.5, (d === 0 ? '' : '') + v.toFixed(d == null ? 0 : d), 'xs mono'); });
    return s;
  };
  /* tidy candles so wicks contain bodies */
  MC.fix = function (k) { k.h = Math.max(k.h, k.o, k.c); k.l = Math.min(k.l, k.o, k.c); return k; };
  /* pointer x -> bar index helper */
  MC.hover = function (fig, getIdx, onIdx, onLeave) {
    const h = (e) => { const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e); const i = getIdx(p); if (i != null) onIdx(i); };
    fig.addEventListener('pointermove', h);
    fig.addEventListener('pointerdown', h);
    if (onLeave) fig.addEventListener('pointerleave', onLeave);
  };

  /* candle pattern reading */
  MC.classify = function (o, h, l, c) {
    const r = h - l, body = Math.abs(c - o), up = h - Math.max(o, c), lo = Math.min(o, c) - l, bull = c >= o;
    if (r < 0.02) return { name: 'Doji', cls: 'acc', text: 'Price closed almost exactly where it opened. Neither side won: indecision.' };
    if (lo >= 2 * body && up <= 0.15 * r && lo >= 0.5 * r) return { name: 'Hammer', cls: 'up', text: `Sellers pushed price down to ${F.usd(l)}, then buyers pushed it back up near the high. At support, this hints buyers are stepping in.` };
    if (up >= 2 * body && lo <= 0.15 * r && up >= 0.5 * r) return { name: 'Shooting star', cls: 'dn', text: `Buyers pushed price up to ${F.usd(h)}, then sellers drove it back down. At resistance, this hints sellers are taking over.` };
    if (body / r <= 0.1) return { name: 'Doji', cls: 'acc', text: 'Price closed almost exactly where it opened. Neither side won: indecision.' };
    if (body / r >= 0.8) return bull ? { name: 'Big body', cls: 'up', text: 'Buyers were in control from open to close, with almost no pullback.' } : { name: 'Big body', cls: 'dn', text: 'Sellers were in control from open to close, with almost no bounce.' };
    if (body / r <= 0.35 && up >= 0.25 * r && lo >= 0.25 * r) return { name: 'Spinning top', cls: 'acc', text: 'Small body with wicks on both sides. Both sides tried, and nobody won.' };
    return bull ? { name: 'Green candle', cls: 'up', text: `Close above open: buyers won this period by ${F.usd(c - o)}.` } : { name: 'Red candle', cls: 'dn', text: `Close below open: sellers won this period by ${F.usd(o - c)}.` };
  };

  SML.css(`
.mc-checks{display:grid;padding:4px 16px 8px}
.mc-check{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px dashed var(--line);font-size:14px;color:var(--muted)}
.mc-check:last-child{border-bottom:0}
.mc-check .ic{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 11px/1 var(--mono);background:var(--shade);color:var(--muted)}
.mc-check.pass{color:var(--ink)} .mc-check.pass .ic{background:var(--up);color:var(--on)}
.mc-check.fail{color:var(--ink)} .mc-check.fail .ic{background:var(--down);color:var(--on)}
.mc-check .v{font:600 12.5px var(--mono);color:var(--muted);white-space:nowrap}
.mc-check.pass .v{color:var(--up)} .mc-check.fail .v{color:var(--down)}
.mc-calc{padding:10px 16px;font:500 12.5px/1.5 var(--mono);color:var(--muted);overflow-wrap:anywhere}
.mc-calc b{color:var(--ink)}
.wg-actions .mc-sp{flex:1 1 auto}
.mc-score{font:600 12.5px var(--mono);color:var(--muted)}
.mc-score b{color:var(--ink)}
.wg-fig svg .mc-halo{paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
`);

  /* =====================================================================
     1. candleBuilder
     ===================================================================== */
  SML.widgets.candleBuilder = function (root) {
    const id = SML.uid('cb');
    const P = { Hammer: [100.2, 100.8, 96.0, 100.6], 'Shooting star': [99.6, 104.6, 99.3, 99.9], Doji: [100.0, 102.6, 97.4, 100.1], 'Big body': [96.4, 104.5, 96.2, 104.3] };
    const names = ['Open', 'High', 'Low', 'Close'], keys = ['o', 'h', 'l', 'c'];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Presets</span>${ui.seg(id + '-p', Object.keys(P), 'Hammer', 'Candle presets')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${names.map((n, i) => ui.slider({ id: id + '-' + keys[i], label: n, min: 90, max: 110, step: 0.1, value: P.Hammer[i], fmt: 'usd' })).join('')}</div>
      <div class="wg-read">${ui.stat('Body', id + '-sb')}${ui.stat('Range (high − low)', id + '-sr')}${ui.stat('Upper wick', id + '-su')}${ui.stat('Lower wick', id + '-sl')}</div>
      <div class="wg-msg" id="${id}-m"></div>`;
    const fig = root.querySelector('.wg-fig');
    const v = () => ({ o: st.n(id + '-o'), h: st.n(id + '-h'), l: st.n(id + '-l'), c: st.n(id + '-c') });
    const fix = (changed) => {
      const q = v(); const suf = changed.slice(-2);
      if (suf === '-o' || suf === '-c') { if (Math.max(q.o, q.c) > q.h) st.set(id + '-h', Math.max(q.o, q.c)); if (Math.min(q.o, q.c) < q.l) st.set(id + '-l', Math.min(q.o, q.c)); }
      if (suf === '-h' && q.h < Math.max(q.o, q.c)) st.set(id + '-h', Math.max(q.o, q.c));
      if (suf === '-l' && q.l > Math.min(q.o, q.c)) st.set(id + '-l', Math.min(q.o, q.c));
    };
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      if (t && t.closest && t.closest('.seg')) { const p = P[st.seg(id + '-p')]; if (p) keys.forEach((k, i) => st.set(id + '-' + k, p[i])); }
      else if (t && t.id && t.type === 'range') { fix(t.id); st.setSeg(id + '-p', '__none'); }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const { o, h, l, c } = v();
      const compact = W < 520, wide = W >= 600;
      const H = compact ? 300 : 340, top = 22, bot = H - 22;
      const span = Math.max(5, (h - l) * 1.4), mid = (h + l) / 2, ylo = mid - span / 2, yhi = mid + span / 2;
      const y = SML.lin(ylo, yhi, bot, top);
      const cx = Math.round(W * (compact ? 0.42 : wide ? 0.31 : 0.38));
      const bw = compact ? 44 : 60;
      const kk = c >= o ? 'up' : 'dn';
      let b = '';
      SML.ticks(ylo, yhi, 5).forEach((p) => { b += S.line(0, y(p), W, y(p), 's-grid') + S.text(4, y(p) - 4, '$' + p, 'xs mono'); });
      const yt = y(Math.max(o, c)), yb = y(Math.min(o, c));
      b += S.line(cx, y(h), cx, y(l), 's-' + kk + ' w3');
      b += S.rect(cx - bw / 2, yt, bw, Math.max(2.5, yb - yt), 'f-' + kk, 3);
      // part labels (left)
      const parts = [];
      if (yt - y(h) > 12) parts.push({ y: (y(h) + yt) / 2, t: compact ? 'Wick' : 'Upper wick', ax: cx - 3 });
      parts.push({ y: (yt + yb) / 2, t: 'Body', ax: cx - bw / 2 - 3 });
      if (y(l) - yb > 12) parts.push({ y: (yb + y(l)) / 2, t: compact ? 'Wick' : 'Lower wick', ax: cx - 3 });
      MC.spread(parts, 20, top + 8, bot - 4);
      const lx = cx - bw / 2 - 20;
      parts.forEach((p) => { b += S.line(lx + 5, p.ly - 4, p.ax, p.y, 's-mut'); b += S.text(lx, p.ly, p.t, 'md ink', 'end'); });
      // O H L C labels (right)
      const rx = cx + bw / 2 + 28;
      const pts = [{ k: 'High', v: h, x0: cx + 3 }, { k: 'Open', v: o, x0: cx + bw / 2 + 2 }, { k: 'Close', v: c, x0: cx + bw / 2 + 2 }, { k: 'Low', v: l, x0: cx + 3 }].map((q) => Object.assign(q, { y: y(q.v) }));
      MC.spread(pts, 18, top + 4, bot);
      pts.forEach((q) => { b += S.line(q.x0, q.y, rx - 6, q.ly - 4, 's-mut dash2'); b += S.text(rx, q.ly, `<tspan class="ink b">${q.k}</tspan> <tspan class="mono">${F.usd(q.v)}</tspan>`, 'md'); });
      // who pushed bar (wide)
      const r = Math.max(1e-9, h - l), su = (h - Math.max(o, c)) / r, sb = Math.abs(c - o) / r, sl = (Math.min(o, c) - l) / r;
      if (wide) {
        const xb = Math.min(W - 160, cx + bw / 2 + 200), y0 = top + 26, ht = bot - y0 - 6;
        b += S.text(xb, top + 8, 'WHO PUSHED', 'cap');
        const segs = [{ f: su, cls: 'f-dn-t', lab: 'Sellers', sub: 'pushed back down', t: 'dn' }, { f: sb, cls: 'f-' + kk, lab: 'Body', sub: kk === 'up' ? 'buyers won' : 'sellers won', t: kk }, { f: sl, cls: 'f-up-t', lab: 'Buyers', sub: 'pushed back up', t: 'up' }];
        let yy = y0; const labs = [];
        segs.forEach((s) => { const hh = s.f * ht; b += S.rect(xb, yy, 22, Math.max(0, hh), s.cls, 0); labs.push({ y: yy + hh / 2 + 4, s }); yy += hh; });
        b += S.rect(xb, y0, 22, ht, 'nf s-line', 0);
        MC.spread(labs, 30, y0 + 6, y0 + ht - 10);
        labs.forEach((q) => { b += S.text(xb + 32, q.ly, `<tspan class="b ${q.s.t}">${q.s.lab}</tspan> <tspan class="mono ink">${Math.round(q.s.f * 100)}%</tspan>`, 'md'); b += S.text(xb + 32, q.ly + 14, q.s.sub, 'sm'); });
      }
      fig.innerHTML = S.wrap(W, H, `One candle: open ${F.usd(o)}, high ${F.usd(h)}, low ${F.usd(l)}, close ${F.usd(c)}`, b);
      setStat(id + '-sb', (c >= o ? '+' : F.minus) + F.usd(Math.abs(c - o)), kk);
      setStat(id + '-sr', F.usd(h - l));
      setStat(id + '-su', F.usd(h - Math.max(o, c)));
      setStat(id + '-sl', F.usd(Math.min(o, c) - l));
      const cl = MC.classify(o, h, l, c);
      setHTML(id + '-m', ui.msg(cl.cls, cl.name, cl.text));
    });
  };

  /* =====================================================================
     1b. candleStory (extra): hover a short 2-min chart
     ===================================================================== */
  SML.widgets.candleStory = function (root) {
    const id = SML.uid('cs');
    const raw = [
      [101.0, 101.2, 100.2, 100.4, 160], [100.4, 100.6, 99.7, 99.9, 140], [99.9, 100.1, 99.4, 99.6, 120], [99.6, 99.9, 98.4, 99.7, 185],
      [99.7, 100.4, 99.6, 100.3, 130], [100.3, 101.5, 100.2, 101.42, 210], [101.42, 101.7, 101.1, 101.55, 95], [101.55, 101.85, 101.25, 101.53, 70],
      [101.53, 102.6, 101.45, 102.52, 190], [102.52, 102.9, 102.3, 102.72, 110], [102.72, 104.0, 102.62, 102.82, 175], [102.82, 102.9, 102.0, 102.08, 150],
      [102.08, 102.3, 101.5, 101.62, 140], [101.62, 101.9, 101.3, 101.8, 90], [101.8, 102.0, 101.4, 101.5, 80], [101.5, 101.6, 100.8, 100.92, 130],
      [100.92, 101.1, 100.4, 101.0, 100], [101.0, 101.3, 100.9, 101.22, 70]];
    const cs = raw.map((r, i) => ({ o: r[0], h: r[1], l: r[2], c: r[3], v: r[4], t: i * 2 }));
    const custom = {
      0: 'Red candle at the open: sellers in control from the first minute.',
      3: 'Hammer at the morning low. Sellers pushed to $98.40, buyers pushed it all the way back. Watch for follow-through.',
      5: 'Big green candle right after the hammer: buyers confirmed the turn.',
      7: 'Doji: a pause after the run. Nobody won these two minutes.',
      10: 'Shooting star at the high. Buyers reached $104.00, sellers slammed it back down.',
      11: 'Red follow-through after the shooting star: sellers confirmed the rejection.',
    };
    let sel = 3;
    root.innerHTML = `<div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Time', id + '-t')}${ui.stat('Open → close', id + '-c')}${ui.stat('High', id + '-h')}${ui.stat('Low', id + '-l')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" data-a="prev">◀ Previous candle</button><button type="button" class="btn btn-g sm" data-a="next">Next candle ▶</button><span class="note">Hover or tap a candle to read it.</span></div>`;
    const fig = root.querySelector('.wg-fig');
    let geo = null;
    root.querySelector('.wg-actions').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; sel = SML.clamp(sel + (b.dataset.a === 'next' ? 1 : -1), 0, cs.length - 1); draw(); });
    MC.hover(fig, (p) => (geo ? SML.clamp(Math.floor((p.x - geo.x0) / geo.slot), 0, cs.length - 1) : null), (i) => { if (i !== sel) { sel = i; draw(); } });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const H = compact ? 250 : 280, padL = 6, padR = 40, top = 14, volH = 34, timeH = 16;
      const pBot = H - volH - timeH - 10;
      const lo = 98.2, hi = 104.2, y = SML.lin(lo, hi, pBot, top);
      const slot = (W - padL - padR) / cs.length, x = (i) => padL + slot * (i + 0.5), bw = Math.min(18, slot * 0.6);
      geo = { x0: padL, slot };
      let b = MC.axis(y, lo, hi, padL, W - padR, 4, 0);
      b += S.rect(x(sel) - slot / 2, top - 6, slot, H - top - timeH + 2, 'f-acc-t', 2);
      b += S.candles(cs, x, bw, y);
      b += S.volume(cs, x, bw, H - timeH - 2, volH, { hi: new Set([sel]) });
      cs.forEach((k, i) => { if (i % (compact ? 6 : 3) === 0) b += S.text(x(i), H - 3, F.time(k.t), 'xs mono', 'middle'); });
      const k = cs[sel], cl = MC.classify(k.o, k.h, k.l, k.c);
      b += S.text(SML.clamp(x(sel), 40, W - padR - 40), Math.max(11, y(k.h) - 9), cl.name, 'sm b mc-halo ' + (cl.cls === 'acc' ? 'acc' : cl.cls), 'middle');
      fig.innerHTML = S.wrap(W, H, 'A morning of 2-minute candles; the selected candle is highlighted', b);
      setStat(id + '-t', F.time(k.t)); setStat(id + '-h', F.usd(k.h)); setStat(id + '-l', F.usd(k.l)); setStat(id + '-c', F.usd(k.o) + ' → ' + F.usd(k.c), k.c >= k.o ? 'up' : 'dn');
      setHTML(id + '-m', ui.msg(cl.cls, cl.name, custom[sel] || cl.text));
    });
  };

  /* =====================================================================
     2. timeframeZoom
     ===================================================================== */
  SML.widgets.timeframeZoom = function (root) {
    const id = SML.uid('tz');
    const closes = SML.data.path([[0, 100], [12, 99.2], [25, 100.9], [40, 100.5], [55, 102.0], [70, 101.4], [90, 101.7], [105, 103.1], [120, 102.6], [140, 102.9], [155, 104.2], [170, 103.6], [179, 104.0]], 180, 41, 0.07);
    const base = SML.data.candles(closes, 41, { vol: 60, open: 100.2, wick: 0.25, shape: SML.data.uShape }).map((k, i) => Object.assign(k, { t: i }));
    const sets = { 2: SML.data.aggregate(base, 2), 5: SML.data.aggregate(base, 5), 15: SML.data.aggregate(base, 15) };
    const blocks = sets[15];
    let selMin = 50; // selected minute
    root.innerHTML = `<div class="wg-bar"><span class="wg-title">Timeframe</span>${ui.seg(id + '-tf', [{ v: 2, label: '2-min' }, { v: 5, label: '5-min' }, { v: 15, label: '15-min' }], 2, 'Timeframe')}<span class="grow"></span>${ui.chips(id + '-c', [{ k: 'ghost', label: 'Show the 15-min candle', color: 'var(--accent)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Candle', id + '-t')}${ui.stat('Open → close', id + '-c2')}${ui.stat('High', id + '-h')}${ui.stat('Low', id + '-l')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-note">Hover or tap the chart to pick a candle. The same three hours of trading in every view.</div>`;
    const fig = root.querySelector('.wg-fig');
    let geo = null;
    const st = ui.wire(root, () => draw());
    MC.hover(fig, (p) => { if (!geo) return null; const i = SML.clamp(Math.floor((p.x - geo.x0) / geo.slot), 0, geo.n - 1); return i * geo.tf; }, (m) => { if (Math.floor(m / 15) !== Math.floor(selMin / 15) || m !== selMin) { selMin = m; draw(); } });
    const draw = ui.responsive(fig, (W) => {
      const tf = Number(st.seg(id + '-tf')) || 2, cs = sets[tf], n = cs.length, ghost = st.on(id + '-c', 'ghost');
      const compact = W < 480;
      const H = compact ? 270 : 320, padL = 6, padR = 42, top = 14, volH = 36, timeH = 16, pBot = H - volH - timeH - 10;
      const [lo0, hi0] = MC.minMax(base), lo = lo0 - 0.15, hi = hi0 + 0.15, y = SML.lin(lo, hi, pBot, top);
      const slot = (W - padL - padR) / n, x = (i) => padL + slot * (i + 0.5), bw = Math.max(1.4, Math.min(22, slot * 0.62));
      const xm = (m) => padL + slot * (m / tf);
      geo = { x0: padL, slot, n, tf };
      const blk = Math.floor(selMin / 15), bk = blocks[blk];
      const selIdx = Math.floor(selMin / tf);
      let b = MC.axis(y, lo, hi, padL, W - padR, 5, 0);
      // 15-min block separators
      for (let m = 0; m <= 180; m += 15) b += S.line(xm(m), top - 4, xm(m), H - timeH - 2, m % 30 === 0 ? 's-line' : 's-grid');
      for (let m = 0; m < 180; m += compact ? 60 : 30) b += S.text(xm(m) + 3, H - 3, F.time(m), 'xs mono');
      // selected block band
      b += S.rect(xm(blk * 15), top - 6, xm(blk * 15 + 15) - xm(blk * 15), H - top - timeH + 4, 'f-acc-t', 0);
      // ghost 15-min candle behind small candles
      if (ghost && tf !== 15) {
        const gx0 = xm(blk * 15) + 2, gw = xm(blk * 15 + 15) - xm(blk * 15) - 4, gk = bk.c >= bk.o ? 'up' : 'dn';
        b += S.line(gx0 + gw / 2, y(bk.h), gx0 + gw / 2, y(bk.l), 's-' + gk + ' w2 dash2');
        b += S.rect(gx0, y(Math.max(bk.o, bk.c)), gw, Math.max(2, y(Math.min(bk.o, bk.c)) - y(Math.max(bk.o, bk.c))), 'f-' + gk + ' o35', 2);
        b += S.rect(gx0, y(Math.max(bk.o, bk.c)), gw, Math.max(2, y(Math.min(bk.o, bk.c)) - y(Math.max(bk.o, bk.c))), 'nf s-' + gk + ' w15 dash2', 2);
      }
      const dim = new Set(); if (tf !== 15) cs.forEach((k, i) => { if (Math.floor(k.t / 15) !== blk) dim.add(i); });
      b += S.candles(cs, x, bw, y, { dim: ghost && tf !== 15 ? dim : null });
      const hiSet = new Set(); cs.forEach((k, i) => { if (Math.floor(k.t / 15) === blk) hiSet.add(i); });
      b += S.volume(cs, x, bw, H - timeH - 4, volH, { hi: hiSet });
      if (tf === 15) b += S.rect(x(blk) - slot / 2 + 1, top - 6, slot - 2, pBot - top + 12, 'nf s-acc w2', 3);
      const cnt = { 2: '7 to 8', 5: '3', 15: '1' }[tf];
      const lab = tf === 15 ? 'one 15-min candle' : compact ? `${cnt} candles = one 15-min` : `${cnt} candles = one 15-min candle`, tw = lab.length * 6.3;
      const tx = SML.clamp(xm(blk * 15 + 7.5), tw / 2 + 2, W - padR - tw / 2);
      b += S.text(tx, top + 4, lab, 'sm acc b mc-halo', 'middle');
      if (tf !== 15) { const si = Math.min(selIdx, n - 1), sk = cs[si]; b += S.rect(x(si) - Math.max(3, bw / 2 + 2), y(sk.h) - 3, Math.max(6, bw + 4), y(sk.l) - y(sk.h) + 6, 'nf s-ink w15', 2); }
      fig.innerHTML = S.wrap(W, H, `The same morning on a ${tf}-minute chart; the selected 15-minute block is highlighted`, b);
      const k = tf === 15 ? bk : cs[Math.min(selIdx, n - 1)];
      setStat(id + '-t', `${F.time(k.t)}–${F.time(k.t + tf)}`); setStat(id + '-h', F.usd(k.h)); setStat(id + '-l', F.usd(k.l)); setStat(id + '-c2', F.usd(k.o) + ' → ' + F.usd(k.c), k.c >= k.o ? 'up' : 'dn');
      const msg = tf === 15 ? ui.msg('info', 'The map', `The 15-min chart hides the noise. Use it for the trend and the day's key levels. This candle moved ${F.usd(bk.c - bk.o)} in 15 minutes.`)
        : tf === 5 ? ui.msg('acc', 'In between', 'The 5-min chart sits between the two. Some traders use it instead of the 2-min for calmer entries.')
          : ui.msg('up', 'The trigger', `The 2-min chart shows the moves inside each 15-min candle: the dips, the retest, the exact spot for a tight stop. That's what you time entries with.`);
      setHTML(id + '-m', msg);
    });
  };
})();
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, MC = SML._mc;
  const { byId, setHTML, setStat, smooth } = MC;
  const mean = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);

  /* =====================================================================
     3. levelsMap
     ===================================================================== */
  SML.widgets.levelsMap = function (root) {
    const id = SML.uid('lv');
    const sess = SML.data.session(21, { kind: 'trend-up', bars: 100 });
    const P = sess.prev;
    const yc = SML.data.path([[0, P.o], [7, P.h - 0.25], [15, (P.h + P.l) / 2 + 0.3], [21, P.l + 0.25], [25, P.c]], 26, 77, 0.12);
    const yday = SML.data.candles(yc, 77, { vol: 80, open: P.o, shape: SML.data.uShape }).map((k) => {
      k.c = SML.clamp(k.c, P.l + 0.05, P.h - 0.05); k.o = SML.clamp(k.o, P.l + 0.05, P.h - 0.05);
      k.h = Math.min(k.h, P.h); k.l = Math.max(k.l, P.l); return MC.fix(k);
    });
    yday[7].h = P.h; yday[21].l = P.l;
    const day = sess.day, pre = sess.pre;
    const LV = [{ k: 'PDH', p: sess.pdh, from: 'y', name: 'previous day high' }, { k: 'PMH', p: sess.pmh, from: 'p', name: 'premarket high' }, { k: 'PML', p: sess.pml, from: 'p', name: 'premarket low' }, { k: 'PDL', p: sess.pdl, from: 'y', name: 'previous day low' }];
    root.innerHTML = `<div class="wg-bar"><span class="wg-title">Levels</span>${ui.chips(id + '-c', LV.map((l) => ({ k: l.k, label: l.k, color: 'var(--accent)', on: true })))}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-t', label: 'Time (ET)', min: 1, max: 100, step: 1, value: 50, fmt: (v) => F.time(v * 2) })}</div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" id="${id}-play">▶ Play the day</button><button type="button" class="btn btn-g sm" id="${id}-rw">Back to the open</button></div>
      <div class="wg-read">${ui.stat('Time', id + '-st')}${ui.stat('Price', id + '-sp')}${ui.stat('Next level up', id + '-su')}${ui.stat('Next level down', id + '-sd')}</div>
      <div class="wg-msg" id="${id}-m"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    let timer = null;
    const playBtn = byId(id + '-play');
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = '▶ Play the day'; };
    SML.onCleanup(stop);
    playBtn.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (st.n(id + '-t') >= 100) st.set(id + '-t', 1);
      if (SML.reduced()) { st.set(id + '-t', 100); draw(); return; }
      playBtn.textContent = '❚❚ Pause';
      timer = setInterval(() => { const t = st.n(id + '-t') + 1; if (t > 100) { stop(); return; } st.set(id + '-t', t); draw(); }, 130);
    });
    byId(id + '-rw').addEventListener('click', () => { stop(); st.set(id + '-t', 1); draw(); });

    function events(t, on) {
      const tol = 0.06, ev = [];
      LV.filter((l) => on[l.k]).forEach((L) => {
        let side = day[0].o >= L.p ? 1 : -1, broke = -1, tested = false, retested = false, cnt = 0;
        for (let i = 0; i < t && cnt < 3; i++) {
          const k = day[i], cs = side < 0 ? (k.c > L.p + 0.05 ? 1 : -1) : (k.c < L.p - 0.05 ? -1 : 1);
          if (cs !== side) { side = cs; broke = i; retested = false; cnt++; ev.push({ i, L, type: cs > 0 ? 'breakUp' : 'breakDn' }); continue; }
          const touch = side < 0 ? k.h >= L.p - tol : k.l <= L.p + tol;
          if (!touch) continue;
          if (broke < 0 && !tested) { tested = true; cnt++; ev.push({ i, L, type: side < 0 ? 'testUp' : 'testDn' }); }
          else if (broke >= 0 && !retested && i - broke >= 2) { retested = true; cnt++; ev.push({ i, L, type: side > 0 ? 'holdUp' : 'holdDn' }); }
        }
      });
      return ev.sort((a, b) => a.i - b.i).slice(0, 7);
    }
    function evText(e) {
      const k = day[e.i], rv = k.v / mean(day.slice(Math.max(0, e.i - 10), e.i).map((q) => q.v).concat(e.i ? [] : [k.v]));
      const vn = rv >= 1.5 ? ` on ${rv.toFixed(1)}× normal volume` : '';
      const n = `the ${e.L.name}`;
      return {
        testUp: `Price is testing ${n} from below. Sellers defended this price before.`,
        testDn: `Price dipped to ${n} from above. Watch whether buyers defend it.`,
        breakUp: `Price closed above ${n}${vn}. Old resistance can now act as support.`,
        breakDn: `Price closed below ${n}${vn}. Old support can now act as resistance.`,
        holdUp: `Price came back to ${n} and held above it. That retest is the classic entry.`,
        holdDn: `Price bounced back up to ${n} and got rejected. Sellers still own it.`,
      }[e.type];
    }
    const draw = ui.responsive(fig, (W) => {
      const t = st.n(id + '-t'), on = {}; LV.forEach((l) => { on[l.k] = st.on(id + '-c', l.k); });
      const compact = W < 520, k2 = compact ? 2 : 1;
      const H = compact ? 300 : 340, padL = 6, padR = compact ? 40 : 108, top = 28, volH = 34, timeH = 14, pBot = H - volH - timeH - 12;
      const plotW = W - padL - padR, fy = compact ? 0.15 : 0.18, fp = compact ? 0.13 : 0.15;
      const xY0 = padL, xP0 = padL + plotW * fy, xT0 = xP0 + plotW * fp, xT1 = W - padR;
      const preD = compact ? SML.data.aggregate(pre, 2) : pre, dayD = SML.data.aggregate(day, k2), shown = SML.data.aggregate(day.slice(0, t), k2);
      const ys = (xY0 === xP0) ? 1 : (xP0 - xY0) / yday.length, ps = (xT0 - xP0) / preD.length, ts = (xT1 - xT0) / dayD.length;
      const all = yday.concat(pre, day);
      const lo = Math.min(...all.map((k) => k.l), sess.pdl) - 0.3, hi = Math.max(...all.map((k) => k.h), sess.pdh) + 0.3;
      const y = SML.lin(lo, hi, pBot, top);
      let b = '';
      SML.ticks(lo, hi, 5).forEach((v) => { b += S.line(padL, y(v), xT1, y(v), 's-grid'); });
      b += S.rect(xP0, top - 18, xT0 - xP0, H - top + 18 - timeH, 'f-shade o70');
      b += S.line(xP0, top - 18, xP0, H - timeH, 's-mut dash2') + S.line(xT0, top - 18, xT0, H - timeH, 's-mut dash2');
      b += S.text(xY0 + 3, 12, compact ? 'YDAY' : 'YESTERDAY', 'cap') + S.text(xP0 + 3, 12, compact ? 'PRE' : 'PREMARKET', 'cap') + S.text(xT0 + 4, 12, compact ? 'TODAY' : 'TODAY 9:30', 'cap');
      // levels
      const labs = [];
      LV.forEach((L) => { if (!on[L.k]) return; const x0 = L.from === 'y' ? xY0 : xP0; b += S.line(x0, y(L.p), xT1, y(L.p), 's-acc dash w15'); labs.push({ y: y(L.p) + 4, L }); });
      MC.spread(labs, 15, top - 4, pBot + 8);
      labs.forEach((q) => { b += S.text(xT1 + 5, q.ly, compact ? `<tspan class="b acc">${q.L.k}</tspan>` : `<tspan class="b acc">${q.L.k}</tspan> <tspan class="mono ink">${q.L.p.toFixed(2)}</tspan>`, 'sm'); });
      // candles
      const xy = (i) => xY0 + ys * (i + 0.5), xp = (i) => xP0 + ps * (i + 0.5), xt = (i) => xT0 + ts * (i + 0.5);
      b += S.candles(yday, xy, Math.max(1.2, ys * 0.6), y);
      b += S.candles(preD, xp, Math.max(1.2, ps * 0.6), y);
      b += S.candles(shown, xt, Math.max(1.2, ts * 0.62), y);
      // volume
      const maxV = Math.max(...day.map((k) => k.v)) * k2;
      const vb = H - timeH - 4;
      b += S.volume(yday, xy, Math.max(1, ys * 0.6), vb, volH, { maxV: maxV * 0.9, hi: new Set() });
      b += S.volume(preD, xp, Math.max(1, ps * 0.6), vb, volH, { maxV: maxV, hi: new Set() });
      b += S.volume(shown, xt, Math.max(1, ts * 0.62), vb, volH, { maxV: maxV, hi: new Set(shown.map((_, i) => i)) });
      [0, 60, 120, 180].forEach((m) => { if (m / 2 < 100) b += S.text(xT0 + ts * (m / 2 / k2), H - 2, F.time(m), 'xs mono', m === 0 ? 'start' : 'middle'); });
      // now marker
      const last = day[t - 1];
      b += S.circle(xt(shown.length - 1), y(last.c), 4, 'f-ink');
      // events
      const ev = events(t, on); const placed = [];
      ev.forEach((e, n) => {
        const up = e.type === 'breakUp' || e.type === 'testUp' || e.type === 'holdDn';
        let bx = xt(Math.floor(e.i / k2)), by = y(e.L.p) + (up ? -16 : 16);
        placed.forEach((p) => { if (Math.abs(p.x - bx) < 18 && Math.abs(p.y - by) < 18) by += up ? -20 : 20; });
        placed.push({ x: bx, y: by });
        b += S.badge(bx, by, n + 1, e.type.indexOf('break') === 0 ? 'f-acc' : 'f-ink');
      });
      fig.innerHTML = S.wrap(W, H, 'Yesterday, premarket and today with the four key levels; numbered badges mark reactions at the levels', b);
      setStat(id + '-st', F.time((t - 1) * 2 + 2) + ' ET');
      setStat(id + '-sp', F.usd(last.c));
      const lvOn = LV.filter((l) => on[l.k]);
      const above = lvOn.filter((l) => l.p > last.c).sort((a, b) => a.p - b.p)[0], below = lvOn.filter((l) => l.p <= last.c).sort((a, b) => b.p - a.p)[0];
      setStat(id + '-su', above ? `${above.k} +${(above.p - last.c).toFixed(2)}` : 'none', above ? 'dn' : '');
      setStat(id + '-sd', below ? `${below.k} ${F.minus}${(last.c - below.p).toFixed(2)}` : 'none', below ? 'up' : '');
      const e = ev[ev.length - 1];
      if (!lvOn.length) setHTML(id + '-m', ui.msg('', 'No levels', 'Turn the levels back on. Without them every move looks random.'));
      else if (!e) setHTML(id + '-m', ui.msg('acc', 'Waiting', 'Price is between the levels. Marked before the open, these are where reactions tend to happen.'));
      else setHTML(id + '-m', ui.msg(e.type.indexOf('break') === 0 ? 'acc' : e.type === 'holdUp' || e.type === 'testDn' ? 'up' : 'dn', `${ev.length} · ${e.L.k}`, `<b>${F.time(e.i * 2 + 2)}</b> ${evText(e)}`));
    });
  };

  /* =====================================================================
     4. srDrag
     ===================================================================== */
  SML.widgets.srDrag = function (root) {
    const id = SML.uid('sr');
    const n = 70;
    const A = [[0, 101.2], [5, 103.72], [10, 100.28], [16, 103.75], [22, 100.25], [28, 103.7], [34, 100.3], [40, 103.72], [44, 102.7], [47, 104.55], [50, 105.4], [53, 106.3], [57, 104.6], [59, 104.4], [62, 105.1], [66, 106.6], [69, 107.6]];
    const cl = SML.data.path(A, n, 5, 0.1);
    const cs = SML.data.candles(cl, 5, { vol: 90, wick: 0.25, boost: { 47: 2.4, 48: 1.6 } });
    cs.forEach((k, i) => {
      if (i < 46) { k.c = SML.clamp(k.c, 100.18, 103.8); k.o = SML.clamp(k.o, 100.18, 103.8); k.h = Math.min(k.h, 103.86); k.l = Math.max(k.l, 100.14); }
      if (i >= 50) { k.o = Math.max(k.o, 104.2); k.c = Math.max(k.c, 104.2); k.l = Math.max(k.l, 104.12); }
      MC.fix(k);
    });
    [5, 16, 28, 40].forEach((i) => { cs[i].h = 104.0; });
    [10, 22, 34].forEach((i) => { cs[i].l = 100.0; });
    cs[58].l = 104.03;
    let dragged = false, geo = null;
    root.innerHTML = `<div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-L', label: 'Line price', min: 99, max: 108.5, step: 0.05, value: 104, fmt: 'usd' })}</div>
      <div class="wg-read">${ui.stat('Touches', id + '-t')}${ui.stat('Bounces', id + '-b')}${ui.stat('Breaks', id + '-k')}${ui.stat('Acting as', id + '-r')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-note">Drag the amber line (or its round handle) up and down, or use the slider. A touch counts when a candle comes within $0.18.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => { dragged = true; draw(); });
    ui.drag(fig, { sel: '.sr-grab', start: () => { dragged = true; }, move: (pt) => { if (!geo) return; const v = SML.clamp(geo.y.inv(pt.y), 99, 108.5); st.set(id + '-L', Math.round(v / 0.05) * 0.05); draw(); } });
    function analyze(L) {
      const tol = 0.18, ev = []; let crosses = 0;
      for (let i = 1; i < n; i++) if ((cs[i].c >= L) !== (cs[i - 1].c >= L)) crosses++;
      let i = 0;
      while (i < n) {
        const k = cs[i];
        if (k.l <= L + tol && k.h >= L - tol) {
          let j = i; while (j + 1 < n && cs[j + 1].l <= L + tol && cs[j + 1].h >= L - tol) j++;
          const before = i > 0 ? cs[i - 1].c : cs[i].o, sb = before >= L ? 1 : -1, sa = cs[j].c >= L ? 1 : -1;
          let cx = 0; for (let q = i + 1; q <= j; q++) if ((cs[q].c >= L) !== (cs[q - 1].c >= L)) cx++;
          let m = i; for (let q = i; q <= j; q++) if (sb < 0 ? cs[q].h > cs[m].h : cs[q].l < cs[m].l) m = q;
          ev.push({ s: i, e: j, m, type: cx > 1 || j - i > 5 ? 'chop' : sb === sa ? 'bounce' : 'break', from: sb, to: sa });
          i = j + 1;
        } else i++;
      }
      return { ev, crosses };
    }
    const draw = ui.responsive(fig, (W) => {
      const L = st.n(id + '-L');
      const compact = W < 480;
      const H = compact ? 290 : 330, padL = 6, padR = 62, top = 18, bot = H - 16;
      const lo = 99.3, hi = 108.3, y = SML.lin(lo, hi, bot, top);
      const slot = (W - padL - padR) / n, x = (i) => padL + slot * (i + 0.5), bw = Math.max(1.5, Math.min(10, slot * 0.62));
      geo = { y };
      const { ev, crosses } = analyze(L);
      let b = MC.axis(y, lo, hi, padL, W - padR, 5, 0).replace(/<text[^>]*>[^<]*<\/text>/g, '');
      SML.ticks(lo, hi, 5).forEach((v) => { b += S.text(padL + 2, y(v) - 3, '$' + v, 'xs mono'); });
      b += S.candles(cs, x, bw, y);
      // the line
      b += S.line(padL, y(L), W - padR + 6, y(L), 's-acc w25 dash');
      const bounces = ev.filter((e) => e.type === 'bounce'), breaks = ev.filter((e) => e.type === 'break');
      let flip = null;
      breaks.forEach((bk) => { const after = bounces.find((q) => q.s > bk.e && q.from === bk.to); if (after && !flip) flip = { bk, after }; });
      ev.forEach((e) => {
        const cx = x(e.m);
        if (e.type === 'break') b += S.polygon([[cx, y(L) - 7], [cx + 7, y(L)], [cx, y(L) + 7], [cx - 7, y(L)]], 'f-acc');
        else b += S.circle(cx, y(L), 5.5, (e.type === 'chop' ? 'f-mut' : e.from < 0 ? 'f-dn' : 'f-up') + ' s-surf w15');
      });
      if (flip && !compact) {
        const fx = SML.clamp(x(flip.after.m), 80, W - padR - 80);
        b += S.text(fx, y(L) + (flip.bk.to > 0 ? 24 : -14), flip.bk.to > 0 ? 'old ceiling = new floor' : 'old floor = new ceiling', 'md b ' + (flip.bk.to > 0 ? 'up' : 'dn'), 'middle');
      }
      const firstRes = bounces.find((e) => e.from < 0), firstSup = bounces.find((e) => e.from > 0 && (!flip || e !== flip.after));
      if (firstRes && (!flip || firstRes.s < flip.bk.s)) b += S.text(SML.clamp(x(firstRes.m), 40, W - padR - 40), y(L) - 12, 'resistance', 'sm dn b', 'middle');
      if (firstSup && (!flip || firstSup.s < flip.bk.s)) b += S.text(SML.clamp(x(firstSup.m), 40, W - padR - 40), y(L) + 20, 'support', 'sm up b', 'middle');
      // handle
      const hx = W - padR + 22;
      b += S.rect(padL, y(L) - 11, W - padR - padL + 34, 22, 'hit grab sr-grab');
      b += S.circle(hx, y(L), 11, 'handle sr-grab');
      b += S.path(`M${hx - 4},${y(L) - 2} L${hx},${y(L) - 6} L${hx + 4},${y(L) - 2} M${hx - 4},${y(L) + 2} L${hx},${y(L) + 6} L${hx + 4},${y(L) + 2}`, 'nf s-acc w15', ' pointer-events="none"');
      b += S.text(hx, y(L) - 17, L.toFixed(2), 'sm mono b acc', 'middle', ' pointer-events="none"');
      if (!dragged) b += S.text(hx, y(L) + 27, 'drag me', 'sm b ink', 'middle', ' pointer-events="none"');
      fig.innerHTML = S.wrap(W, H, `Chart with a draggable line at $${L.toFixed(2)}: ${ev.length} touches, ${bounces.length} bounces, ${breaks.length} breaks`, b, 'drag');
      const last = cs[n - 1].c, role = last >= L ? 'Support' : 'Resistance';
      setStat(id + '-t', String(ev.length)); setStat(id + '-b', String(bounces.length)); setStat(id + '-k', String(breaks.length));
      setStat(id + '-r', role, last >= L ? 'up' : 'dn');
      let m;
      if (!ev.length) m = ui.msg('', 'No touches', 'No candle reaches this line. Drag it to a price where the chart turned.');
      else if (crosses >= 5) m = ui.msg('', 'Not a level', `Price cut straight through this line ${crosses} times. Real levels make price turn, not slice through.`);
      else if (flip) m = ui.msg(flip.bk.to > 0 ? 'up' : 'dn', 'Role flip', flip.bk.to > 0 ? `Price bounced off this line ${bounces.filter((q) => q.from < 0).length} times from below, broke through, then came back and held it from above. The old ceiling became the floor.` : 'Price held this line as a floor, broke below, then got rejected from underneath. The old floor became the ceiling.');
      else if (bounces.length >= 2) m = ui.msg(bounces[0].from < 0 ? 'dn' : 'up', bounces[0].from < 0 ? 'Resistance' : 'Support', `${bounces.length} bounces: ${bounces[0].from < 0 ? 'sellers' : 'buyers'} keep defending this price. That makes it a real level.`);
      else m = ui.msg('acc', `${ev.length} touch${ev.length > 1 ? 'es' : ''}`, 'A level gets stronger the more times price turns at it. Look for a spot with two or more clean bounces.');
      setHTML(id + '-m', m);
    });
  };

  /* =====================================================================
     5. breakoutSim (game)
     ===================================================================== */
  SML.widgets.breakoutSim = function (root) {
    const id = SML.uid('bo');
    const L = 100, N = 44;
    const base = (() => {
      const cl = SML.data.path([[0, 98.6], [3, 99.3], [6, 99.7], [9, 98.9], [12, 98.5], [14, 99.68], [17, 99.2]], 18, 12, 0.06);
      const cs = SML.data.candles(cl, 12, { vol: 100, wick: 0.25, open: 98.45 });
      cs.forEach((k) => { k.c = Math.min(k.c, 99.78); k.o = Math.min(k.o, 99.78); k.h = Math.min(k.h, 99.85); MC.fix(k); });
      cs[6].h = 99.97; cs[14].h = 99.96;
      return cs;
    })();
    const ANCH = {
      fake: [[17, 99.2], [18, 99.4], [19, 99.75], [20, 100.22], [21, 99.65], [22, 99.3], [24, 99.0], [28, 98.6], [32, 98.3], [36, 98.15], [40, 97.95], [43, 98.05]],
      real: [[17, 99.2], [18, 99.4], [19, 99.7], [20, 100.75], [21, 100.5], [22, 100.3], [23, 100.18], [24, 100.62], [27, 101.2], [31, 101.75], [35, 102.35], [39, 102.6], [43, 102.95]],
      norts: [[17, 99.2], [18, 99.5], [19, 99.8], [20, 100.85], [21, 101.45], [22, 101.9], [24, 102.4], [27, 102.9], [30, 103.3], [33, 103.1], [36, 102.75], [40, 102.5], [43, 102.6]],
    };
    function build(kind) {
      const cl = SML.data.path(ANCH[kind].map((a) => [a[0] - 17, a[1]]), 27, 31, 0.05);
      const tail = SML.data.candles(cl, 31, { vol: 100, wick: 0.22, open: base[17].c }).slice(1);
      const cs = base.map((k) => Object.assign({}, k)).concat(tail);
      const avg = mean(cs.slice(10, 20).map((k) => k.v));
      const set = (i, o, h, l, c, vm) => { cs[i] = { o, h, l, c, v: vm * avg }; };
      let D, stop;
      if (kind === 'real') {
        set(20, 99.72, 100.86, 99.66, 100.75, 2.6); set(23, 100.27, 100.36, 100.06, 100.18, 0.55); set(24, 100.2, 100.68, 100.14, 100.62, 1.3);
        cs[21].l = Math.max(cs[21].l, 100.3); cs[22].l = Math.max(cs[22].l, 100.16); cs[21].v = avg * 0.9; cs[22].v = avg * 0.7;
        for (let i = 25; i < N; i++) { cs[i].l = Math.max(cs[i].l, 100.45); cs[i].o = Math.max(cs[i].o, 100.5); cs[i].c = Math.max(cs[i].c, 100.5); }
        D = 24; stop = 99.88;
      } else if (kind === 'fake') {
        set(20, 99.78, 100.42, 99.7, 100.22, 1.05); set(21, 100.2, 100.56, 99.55, 99.62, 1.4);
        for (let i = 22; i < N; i++) { cs[i].h = Math.min(cs[i].h, 99.85); cs[i].o = Math.min(cs[i].o, 99.8); cs[i].c = Math.min(cs[i].c, 99.8); }
        D = 20; stop = 99.6;
      } else {
        set(20, 99.82, 100.96, 99.78, 100.85, 2.3); set(21, 100.85, 101.56, 100.76, 101.45, 1.8);
        for (let i = 22; i < N; i++) { cs[i].l = Math.max(cs[i].l, 100.95); cs[i].o = Math.max(cs[i].o, 101.0); cs[i].c = Math.max(cs[i].c, 101.0); }
        D = 21; stop = 99.88;
      }
      cs.forEach(MC.fix);
      const entry = cs[D].c, risk = entry - stop, target = entry + 2 * risk;
      let out = null;
      for (let j = D + 1; j < N && !out; j++) { const k = cs[j]; if (k.l <= stop) out = { R: -1, j, exit: stop, how: 'stop' }; else if (k.h >= target) out = { R: 2, j, exit: target, how: 'target' }; }
      if (!out) { const lc = cs[N - 1].c; out = { R: (lc - entry) / risk, j: N - 1, exit: lc, how: 'close' }; }
      return { kind, cs, D, stop, entry, risk, target, out, avg, vwap: SML.ind.vwap(cs) };
    }
    const order = ['fake', 'real', 'norts'];
    const SC = {}; order.forEach((k) => { SC[k] = build(k); });
    const NAME = { real: 'Real breakout', fake: 'False breakout', norts: 'No retest' };
    const verdict = {}; // kind -> good?
    let g = null;
    function reset(kind) { g = { sc: SC[kind], i: 17, phase: 'watch', choice: null }; }
    reset('fake');
    root.innerHTML = `<div class="wg-bar"><span class="wg-title">Pick a chart</span>${ui.seg(id + '-s', [{ v: 'fake', label: 'Chart 1' }, { v: 'real', label: 'Chart 2' }, { v: 'norts', label: 'Chart 3' }], 'fake', 'Scenario')}<span class="grow"></span><span class="mc-score" id="${id}-score"></span></div>
      <div class="wg-fig"></div>
      <div class="mc-checks" id="${id}-ck"></div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-actions">
        <button type="button" class="btn btn-g sm" id="${id}-next">Next candle ▶</button>
        <button type="button" class="btn btn-g sm" id="${id}-play">▶ Play</button>
        <button type="button" class="btn btn-up sm" id="${id}-enter" hidden>Enter long</button>
        <button type="button" class="btn btn-g sm" id="${id}-wait" hidden>Wait</button>
        <span class="mc-sp"></span>
        <button type="button" class="btn btn-g sm" id="${id}-reset">Restart chart</button>
      </div>
      <div class="wg-read">${ui.stat('Entry', id + '-e')}${ui.stat('Stop', id + '-st')}${ui.stat('Target (2R)', id + '-tg')}${ui.stat('Result', id + '-r')}</div>`;
    const fig = root.querySelector('.wg-fig');
    let timer = null;
    const btn = (k) => byId(id + '-' + k);
    const stopPlay = () => { if (timer) { clearInterval(timer); timer = null; } btn('play').textContent = '▶ Play'; };
    SML.onCleanup(stopPlay);
    function step() {
      if (g.phase === 'watch') { g.i++; if (g.i >= g.sc.D) { g.i = g.sc.D; g.phase = 'decide'; stopPlay(); } }
      else if (g.phase === 'after') { g.i++; if (g.i >= N - 1) { g.i = N - 1; g.phase = 'done'; stopPlay(); finish(); } }
      else stopPlay();
      draw();
    }
    function finish() {
      const sc = g.sc, good = sc.kind === 'real' ? g.choice === 'enter' : sc.kind === 'fake' ? g.choice === 'wait' : true;
      verdict[sc.kind] = good;
    }
    function play() {
      if (timer) { stopPlay(); return; }
      if (g.phase === 'decide' || g.phase === 'done') return;
      if (SML.reduced()) { while (g.phase === 'watch' || g.phase === 'after') step(); return; }
      btn('play').textContent = '❚❚ Pause';
      timer = setInterval(step, 380);
    }
    function choose(c) {
      if (g.phase !== 'decide') return;
      g.choice = c; g.phase = 'after'; draw();
      if (SML.reduced()) { while (g.phase === 'after') step(); return; }
      btn('play').textContent = '❚❚ Pause'; timer = setInterval(step, 260);
    }
    btn('next').addEventListener('click', () => { stopPlay(); step(); });
    btn('play').addEventListener('click', play);
    btn('enter').addEventListener('click', () => choose('enter'));
    btn('wait').addEventListener('click', () => choose('wait'));
    btn('reset').addEventListener('click', () => { stopPlay(); reset(g.sc.kind); draw(); });
    ui.wire(root.querySelector('.wg-bar'), () => { stopPlay(); reset(byId(id + '-s').querySelector('button.on').dataset.v); draw(); });

    function checks(sc, i) {
      const cs = sc.cs; let bo = -1; for (let j = 18; j < N; j++) if (cs[j].c > L) { bo = j; break; }
      const seen = bo >= 0 && bo <= i, after = seen ? cs.slice(bo + 1, i + 1) : [], back = after.some((k) => k.c < L);
      const r = [];
      r.push(seen ? { s: back ? 'fail' : 'pass', t: 'Candle closes above the level', v: back ? 'closed back below' : 'closed ' + F.usd(cs[bo].c) } : { s: 'pend', t: 'Candle closes above the level', v: 'waiting' });
      if (seen) { const rv = cs[bo].v / mean(cs.slice(bo - 10, bo).map((k) => k.v)); r.push({ s: rv >= 1.5 ? 'pass' : 'fail', t: 'Volume at least 1.5× average', v: rv.toFixed(1) + '×' }); }
      else r.push({ s: 'pend', t: 'Volume at least 1.5× average', v: 'waiting' });
      let rt = { s: 'pend', t: 'Retest of the level holds', v: seen ? 'waiting for a pullback' : 'waiting' };
      if (seen && back) rt = { s: 'fail', t: 'Retest of the level holds', v: 'failed' };
      else if (seen) { const q = after.find((k) => k.l <= L + 0.25); if (q) rt = { s: 'pass', t: 'Retest of the level holds', v: 'held at ' + F.usd(q.l) }; else if (g.phase === 'done') rt.v = 'never came'; }
      r.push(rt);
      const vw = sc.vwap[i]; r.push({ s: cs[i].c > vw ? 'pass' : 'fail', t: 'Price above VWAP', v: 'VWAP ' + F.usd(vw) });
      return r;
    }
    const draw = ui.responsive(fig, (W) => {
      const sc = g.sc, cs = sc.cs, i = g.i, compact = W < 480;
      const H = compact ? 300 : 330, padL = 6, padR = compact ? 58 : 84, top = 22, volH = 40, pBot = H - volH - 16;
      const lo = 97.5, hi = Math.max(103.6, sc.target + 0.35), y = SML.lin(lo, hi, pBot, top);
      const off = compact ? 9 : 0;
      const slot = (W - padL - padR) / (N - off), x = (j) => padL + slot * (j - off + 0.5), bw = Math.max(2, Math.min(12, slot * 0.64));
      let b = '';
      SML.ticks(lo, hi, 5).forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid') + S.text(W - padR + 6, y(v) + 3.5, v.toFixed(0), 'xs mono'); });
      if (g.phase === 'watch' || g.phase === 'decide') {
        const fx = x(i) + slot / 2;
        b += S.rect(fx, top - 14, W - padR - fx, H - top + 12, 'f-shade o50');
        b += S.text((fx + W - padR) / 2, (top + pBot) / 2 + 12, '?', 'xxl b mut', 'middle');
      }
      b += S.line(padL, y(L), W - padR, y(L), 's-acc dash w2');
      b += S.text(padL + 4, y(L) - 7, 'Level ' + F.usd(L), 'sm acc b mc-halo');
      b += S.poly(sc.vwap.slice(0, i + 1).map((v, j) => (j < off ? null : [x(j), y(v)])), 's-info w2');
      if (!compact) b += S.text(x(Math.min(i, 8)), y(sc.vwap[Math.min(i, 8)]) + 16, 'VWAP', 'sm info b mc-halo', 'middle');
      if (i >= sc.D) { b += S.line(x(sc.D), top - 14, x(sc.D), pBot + 4, 's-ink dash2'); b += S.text(x(sc.D), top - 4, 'decision', 'cap', 'middle'); }
      b += S.candles(cs, x, bw, y, { from: off, to: i + 1 });
      // volume
      const vb = H - 6, maxV = Math.max(...cs.map((k) => k.v));
      b += S.volume(cs, x, bw, vb, volH, { from: off, to: i + 1, maxV, hi: new Set(i >= 20 ? [20] : []) });
      const ref = vb - (sc.avg * 1.5 / maxV) * volH;
      b += S.line(padL, ref, W - padR, ref, 's-mut dash2') + S.text(W - padR + 6, ref + 3.5, '1.5× avg', 'xs');
      // trade lines
      if (g.choice || g.phase === 'done') {
        const dim = g.choice === 'wait' ? ' o50' : '';
        const xs = x(sc.D), xe = W - padR;
        b += S.line(xs, y(sc.target), xe, y(sc.target), 's-up dash w15' + dim) + S.line(xs, y(sc.entry), xe, y(sc.entry), 's-ink w15' + dim) + S.line(xs, y(sc.stop), xe, y(sc.stop), 's-dn dash w15' + dim);
        const labs = MC.spread([{ y: y(sc.target) - 4, t: 'Target', c: 'up' }, { y: y(sc.entry) - 4, t: 'Entry', c: 'ink' }, { y: y(sc.stop) + 12, t: 'Stop', c: 'dn' }], 13, top, pBot + 10);
        labs.forEach((q) => { b += S.text(xe - 4, q.ly, q.t, 'sm b mc-halo ' + q.c, 'end'); });
        if (g.choice === 'wait' && g.phase === 'done') b += S.text(xs + 6, y(sc.entry) + 16, 'if you had entered', 'sm b mut mc-halo');
      }
      if (g.phase === 'done') {
        const o = sc.out; const cls = o.R >= 0 ? 'up' : 'dn';
        b += S.circle(x(o.j), y(o.exit), 6, 'f-' + cls + ' s-surf w2');
        b += o.R >= 0 ? S.text(x(o.j) - 10, y(o.exit) - 10, F.R(o.R), 'md b mc-halo ' + cls, 'end') : S.text(x(o.j) + 10, y(o.exit) + 4, F.R(o.R), 'md b mc-halo ' + cls, 'start');
      }
      fig.innerHTML = S.wrap(W, H, `Breakout game chart, ${i + 1} of ${N} candles shown`, b);
      // checklist
      const ck = checks(sc, i);
      setHTML(id + '-ck', ck.map((c) => `<div class="mc-check ${c.s}"><span class="ic">${c.s === 'pass' ? '✓' : c.s === 'fail' ? '✕' : '·'}</span><span>${c.t}</span><span class="v">${c.v}</span></div>`).join(''));
      // buttons
      btn('enter').hidden = btn('wait').hidden = g.phase !== 'decide';
      btn('next').disabled = g.phase === 'decide' || g.phase === 'done';
      btn('play').disabled = g.phase === 'decide' || g.phase === 'done';
      // stats
      const showT = g.choice === 'enter' || g.phase === 'done';
      setStat(id + '-e', showT ? F.usd(sc.entry) : '—'); setStat(id + '-st', showT ? F.usd(sc.stop) : '—', showT ? 'dn' : ''); setStat(id + '-tg', showT ? F.usd(sc.target) : '—', showT ? 'up' : '');
      if (g.phase === 'done') { const R = g.choice === 'enter' ? sc.out.R : 0; setStat(id + '-r', g.choice === 'wait' ? 'Waited: 0R' : F.R(R), R > 0 ? 'up' : R < 0 ? 'dn' : ''); }
      else setStat(id + '-r', g.choice === 'enter' ? 'in the trade' : g.choice === 'wait' ? 'watching' : '—');
      const played = Object.keys(verdict), good = played.filter((k) => verdict[k]).length;
      setHTML(id + '-score', played.length ? `Good calls: <b>${good} of ${played.length}</b>` : 'Play all three charts');
      // coach
      const pass = ck.filter((c) => c.s === 'pass').length;
      let m;
      if (g.phase === 'watch') {
        if (i < 20) m = ui.msg('acc', 'Watch', 'Price keeps stalling at $100. That is resistance. Press Next candle and watch for a breakout.');
        else m = ui.msg('acc', 'Watch', 'Price closed above $100. Is the breakout confirmed? Watch the checklist and the pullback.');
      } else if (g.phase === 'decide') m = ui.msg('acc', 'Your call', `Decision time. Price is at ${F.usd(cs[i].c)} and ${pass} of 4 checks have passed. Enter long, or wait?`);
      else if (g.phase === 'after') m = g.choice === 'enter' ? ui.msg('info', 'In the trade', `Long at ${F.usd(sc.entry)}, stop ${F.usd(sc.stop)}, target ${F.usd(sc.target)}. Let's see what happens.`) : ui.msg('info', 'Waiting', 'You stayed out. Let’s see what the chart did.');
      else {
        const k = sc.kind, e = g.choice === 'enter', R = F.R(sc.out.R);
        const txt = {
          real: e ? `Every check passed before you entered and the trade hit its 2R target. This is the setup to wait for.` : `All four checks passed: this was the one to take. Entering would have made ${R}. Waiting cost 0R, so no harm done.`,
          fake: e ? `Volume was weak, and the next candle closed back below $100. Your stop got hit: ${R}. A wick above a level is not a breakout.` : `Weak volume was the clue, and price fell back under the level. Waiting saved you a full 1R loss.`,
          norts: e ? `It worked (${R}), but with no retest your stop had to sit far below the level. The reward was small for the risk you took.` : `No retest ever came. Skipping it cost 0R; chasing would have made ${R} with a stop twice as wide. Strict rules skip some winners, and that's fine.`,
        }[k];
        m = ui.msg(k === 'fake' ? 'dn' : k === 'real' ? 'up' : 'acc', NAME[k], txt + (Object.keys(verdict).length < 3 ? ' Try another chart.' : ''));
      }
      setHTML(id + '-m', m);
    });
  };

  /* =====================================================================
     6. volumeLab
     ===================================================================== */
  SML.widgets.volumeLab = function (root) {
    const id = SML.uid('vl');
    const L = 100;
    const pre = (() => {
      const cl = SML.data.path([[0, 98.7], [4, 99.6], [8, 98.9], [12, 99.68], [16, 99.0], [19, 99.5]], 20, 8, 0.06);
      const cs = SML.data.candles(cl, 8, { vol: 100, wick: 0.25, open: 98.6 });
      cs.forEach((k) => { k.c = Math.min(k.c, 99.8); k.o = Math.min(k.o, 99.8); k.h = Math.min(k.h, 99.9); MC.fix(k); });
      return cs;
    })();
    const avgV = mean(pre.slice(10).map((k) => k.v));
    function breakout(v) {
      const f = smooth(SML.clamp((v - 0.6) / 2.0, 0, 1));
      const bc = 100.42 + 0.38 * f;
      const A = [[0, bc], [2, 100.3 + 0.9 * f - 0.45 * (1 - f)], [5, 100 + 1.8 * f - 0.9 * (1 - f)], [9, 100 + 2.6 * f - 1.3 * (1 - f)], [15, 100 + 3.2 * f - 1.6 * (1 - f)]];
      const cl = SML.data.path(A, 16, 19, 0.06);
      const tail = SML.data.candles(cl, 19, { vol: 100 * (0.7 + 0.9 * f), wick: 0.22, open: bc }).slice(1);
      const bk = { o: 99.78, h: bc + 0.12, l: 99.7, c: bc, v: v * avgV };
      return pre.concat([bk], tail).map((k) => MC.fix(Object.assign({}, k)));
    }
    const trendCl = SML.data.path([[0, 100], [8, 101.4], [11, 100.9], [19, 102.6], [22, 102.1], [30, 103.8], [33, 103.4], [39, 104.8]], 40, 23, 0.08);
    const trendBase = SML.data.candles(trendCl, 23, { vol: 100, wick: 0.22, open: 99.8 });
    function trend(kind) {
      return trendBase.map((k, i) => { const up = k.c >= k.o; const v = kind === 'healthy' ? (60 + 3.2 * i) * (up ? 1 : 0.5) : (190 - 3.6 * i) * (up ? 1 : 0.8); return Object.assign({}, k, { v: Math.max(20, v) }); });
    }
    root.innerHTML = `<div class="wg-bar">${ui.seg(id + '-m', [{ v: 'bo', label: 'Breakout' }, { v: 'healthy', label: 'Healthy trend' }, { v: 'weak', label: 'Weak trend' }], 'bo', 'Example')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl" id="${id}-ctrl">${ui.slider({ id: id + '-v', label: 'Breakout volume (× average)', min: 0.5, max: 4, step: 0.1, value: 2, fmt: 'x' })}</div>
      <div class="wg-read">${ui.stat('Relative volume', id + '-a')}${ui.stat('Follow-through', id + '-b')}${ui.stat('Shares traded', id + '-d')}${ui.stat('Verdict', id + '-c')}</div>
      <div class="wg-msg" id="${id}-msg"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const mode = st.seg(id + '-m'), bo = mode === 'bo';
      byId(id + '-ctrl').hidden = !bo;
      const v = st.n(id + '-v'), compact = W < 480;
      const cs = bo ? breakout(v) : trend(mode), n = cs.length;
      const meterH = bo ? 54 : 0;
      const H = (compact ? 290 : 320) + meterH, padL = 6, padR = 44, top = 22, volH = 52, pBot = H - meterH - volH - 22;
      const [lo0, hi0] = MC.minMax(cs), lo = Math.min(lo0, bo ? 97.8 : lo0) - 0.2, hi = Math.max(hi0, bo ? 103.5 : hi0) + 0.2;
      const y = SML.lin(lo, hi, pBot, top);
      const slot = (W - padL - padR) / n, x = (i) => padL + slot * (i + 0.5), bw = Math.max(2, Math.min(14, slot * 0.62));
      let b = MC.axis(y, lo, hi, padL, W - padR, 5, 0);
      b += S.text(padL + 2, 12, 'ILLUSTRATION', 'cap');
      if (bo) { b += S.line(padL, y(L), W - padR, y(L), 's-acc dash w15') + S.text(padL + 2, y(L) - 6, 'Level', 'sm acc b'); b += S.rect(x(20) - slot / 2, top - 8, slot, pBot - top + volH + 22, 'f-acc-t o70'); }
      b += S.candles(cs, x, bw, y);
      const vb = pBot + 14 + volH, maxV = Math.max(...cs.map((k) => k.v), bo ? 4 * avgV : 0);
      b += S.volume(cs, x, bw, vb, volH, { maxV, hi: new Set(cs.map((_, i) => i).filter((i) => !bo || i === 20)) });
      b += S.line(padL, vb + 0.5, W - padR, vb + 0.5, 's-line');
      if (bo) {
        const ry = vb - (avgV / maxV) * volH; b += S.line(padL, ry, W - padR, ry, 's-mut dash2') + S.text(W - padR + 4, ry + 3.5, 'avg', 'xs');
        // meter
        const my = H - 30, mx0 = padL + 4, mx1 = W - padR, mx = SML.lin(0, 4, mx0, mx1);
        b += S.text(mx0, my - 12, 'RELATIVE VOLUME', 'cap');
        b += S.rect(mx(0), my, mx(1) - mx(0), 10, 'f-dn-t', 0) + S.rect(mx(1), my, mx(1.5) - mx(1), 10, 'f-shade2', 0) + S.rect(mx(1.5), my, mx(4) - mx(1.5), 10, 'f-up-t', 0);
        [0, 1, 1.5, 2, 3, 4].forEach((t) => { if (compact && t === 1.5) return; b += S.text(mx(t), my + 24, t + '×', 'xs mono', t === 0 ? 'start' : t === 4 ? 'end' : 'middle'); });
        b += S.polygon([[mx(v), my + 12], [mx(v) - 6, my - 4], [mx(v) + 6, my - 4]], 'f-ink');
      } else {
        // volume regression arrow
        const vs = cs.map((k) => k.v), xm = (n - 1) / 2, ym = mean(vs);
        let num = 0, den = 0; vs.forEach((vv, i) => { num += (i - xm) * (vv - ym); den += (i - xm) * (i - xm); });
        const sl = num / den, v0 = ym - sl * xm, v1 = ym + sl * xm;
        const yv = (vv) => vb - (vv / maxV) * volH;
        b += S.arrow(x(0), yv(v0) - 6, x(n - 1), yv(v1) - 6, mode === 'healthy' ? 'up' : 'dn', 9);
        b += S.text(x(Math.round(n / 2)), Math.min(yv(v0), yv(v1)) - 12, mode === 'healthy' ? 'volume rising' : 'volume fading', 'sm b ' + (mode === 'healthy' ? 'up' : 'dn'), 'middle');
        b += S.arrow(x(0), y(cs[0].c) + 18, x(n - 1), y(cs[n - 1].c) + 18, 'mut', 8, true);
      }
      fig.innerHTML = S.wrap(W, H, bo ? `Breakout on ${v.toFixed(1)} times normal volume and the follow-through that comes after` : `Rising price with ${mode === 'healthy' ? 'rising' : 'fading'} volume`, b);
      if (bo) {
        const ft = cs[n - 1].c - L;
        const vd = v < 1 ? ['Weak', 'dn'] : v < 1.5 ? ['Normal', ''] : v < 2.5 ? ['Strong', 'up'] : ['Very strong', 'up'];
        setStat(id + '-a', v.toFixed(1) + '×'); setStat(id + '-b', F.susd(ft), ft >= 0 ? 'up' : 'dn'); setStat(id + '-c', vd[0], vd[1]); setStat(id + '-d', F.num(v * avgV * 1000, 0));
        const vv = v.toFixed(1) + '×';
        setHTML(id + '-msg', v < 1 ? ui.msg('dn', 'Thin', `Only ${vv} normal volume. Few buyers joined the break, and price slipped back under the level. Thin breakouts fail often.`)
          : v < 1.5 ? ui.msg('', 'Normal', `${vv} volume, about normal. The break stalls near the level. Not enough fuel to trust it yet.`)
            : v < 2.5 ? ui.msg('up', 'Strong', `${vv} volume: a real crowd joined the break, and the move follows through.`)
              : ui.msg('up', 'Very strong', `${vv} volume: a big crowd piled in. Moves like this tend to run, though pullbacks can be sharp too.`));
      } else {
        const vs = cs.map((k) => k.v), ch = (mean(vs.slice(-6)) / mean(vs.slice(0, 6)) - 1) * 100;
        const upV = mean(cs.filter((k) => k.c >= k.o).map((k) => k.v)), dnV = mean(cs.filter((k) => k.c < k.o).map((k) => k.v));
        setStat(id + '-a', F.spct(ch, 0), ch >= 0 ? 'up' : 'dn'); setStat(id + '-b', (upV / dnV).toFixed(1) + '×'); setStat(id + '-d', F.susd(cs[cs.length - 1].c - cs[0].o), 'up'); setStat(id + '-c', mode === 'healthy' ? 'Healthy' : 'Tiring', mode === 'healthy' ? 'up' : 'dn');
        setHTML(id + '-msg', mode === 'healthy' ? ui.msg('up', 'Healthy', 'Price rises and volume rises with it, while pullbacks come on light volume. More buyers keep joining.')
          : ui.msg('dn', 'Tiring', 'Price is still rising, but each push comes on less volume. Fewer buyers are joining, so the trend is running out of fuel.'));
      }
      const lab = root.querySelector('.wg-read .stat:nth-child(1) .stat-l'), lab2 = root.querySelector('.wg-read .stat:nth-child(2) .stat-l');
      if (lab) lab.textContent = bo ? 'Relative volume' : 'Volume change';
      if (lab2) lab2.textContent = bo ? 'Follow-through' : 'Up vs down volume';
      const lab3 = root.querySelector('.wg-read .stat:nth-child(3) .stat-l'); if (lab3) lab3.textContent = bo ? 'Breakout shares' : 'Price change';
    });
  };
})();
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, MC = SML._mc, IND = SML.ind;
  const { byId, setHTML, setStat } = MC;
  const mean = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);

  /* =====================================================================
     7. maLab
     ===================================================================== */
  SML.widgets.maLab = function (root) {
    const id = SML.uid('ma');
    const n = 90;
    const cl = SML.data.path([[0, 108], [10, 106.5], [20, 104], [30, 101], [38, 98.4], [42, 97.6], [46, 98.6], [55, 101.5], [65, 104], [75, 106.5], [89, 108.5]], n, 9, 0.22);
    let bottom = 30; for (let i = 30; i < 56; i++) if (cl[i] < cl[bottom]) bottom = i;
    root.innerHTML = `<div class="wg-bar"><span class="wg-title">Show</span>${ui.chips(id + '-c', [{ k: 'sma', label: 'SMA', color: 'var(--violet)', on: true }, { k: 'ema', label: 'EMA', color: 'var(--accent)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-p', label: 'Period (bars averaged)', min: 5, max: 50, step: 1, value: 20, fmt: 'bars' })}</div>
      <div class="wg-read">${ui.stat('Period', id + '-pp')}${ui.stat('EMA turned up', id + '-e')}${ui.stat('SMA turned up', id + '-s')}${ui.stat('EMA faster by', id + '-d')}</div>
      <div class="wg-msg" id="${id}-m"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const turn = (a, from) => { let m = -1; for (let i = from; i < n; i++) if (a[i] != null && (m < 0 || a[i] < a[m])) m = i; return m; };
    const draw = ui.responsive(fig, (W) => {
      const p = st.n(id + '-p'), showS = st.on(id + '-c', 'sma'), showE = st.on(id + '-c', 'ema');
      const sma = IND.sma(cl, p), ema = IND.ema(cl, p);
      const compact = W < 480, H = compact ? 260 : 300, padL = 6, padR = 40, top = 20, bot = H - 22;
      const lo = 96.5, hi = 109.5, y = SML.lin(lo, hi, bot, top), x = SML.lin(0, n - 1, padL + 4, W - padR);
      let b = MC.axis(y, lo, hi, padL, W - padR, 5, 0);
      b += S.line(x(bottom), top - 6, x(bottom), bot + 4, 's-mut dash2') + S.text(x(bottom), bot + 16, 'price bottom', 'sm ink b', 'middle');
      b += S.poly(cl.map((v, i) => [x(i), y(v)]), 's-mut w15');
      const tS = turn(sma, Math.max(p - 1, bottom - 5)), tE = turn(ema, Math.max(5, bottom - 5));
      if (showS) b += S.poly(sma.map((v, i) => (v == null ? null : [x(i), y(v)])), 's-vio w25');
      if (showE) b += S.poly(ema.map((v, i) => [x(i), y(v)]), 's-acc w25');
      if (showE && tE >= 0) { b += S.circle(x(tE), y(ema[tE]), 6, 'f-acc s-surf w2'); b += S.line(x(tE), y(ema[tE]) - 7, x(tE) - 14, y(ema[tE]) - 26, 's-acc'); b += S.text(x(tE) - 16, y(ema[tE]) - 28, `EMA +${tE - bottom}`, 'md acc b mc-halo', 'end'); }
      if (showS && tS >= 0) { b += S.circle(x(tS), y(sma[tS]), 6, 'f-vio s-surf w2'); b += S.text(x(tS) + 6, y(sma[tS]) + 22, `SMA +${tS - bottom}`, 'md vio b mc-halo', 'start'); }
      if (!compact) b += S.text(padL + 4, top - 6, 'grey line = price', 'sm');
      fig.innerHTML = S.wrap(W, H, `Price makes a V-shaped bottom; a ${p}-bar EMA turns up ${tE - bottom} bars later and the SMA ${tS - bottom} bars later`, b);
      setStat(id + '-e', `${tE - bottom} bars after`, 'acc'); setStat(id + '-s', `${tS - bottom} bars after`);
      setStat(id + '-d', `${tS - tE} bar${tS - tE === 1 ? '' : 's'}`, 'up'); setStat(id + '-pp', p + ' bars');
      if (!showS && !showE) setHTML(id + '-m', ui.msg('', 'Nothing on', 'Turn on an average to compare.'));
      else setHTML(id + '-m', ui.msg(p <= 12 ? 'acc' : p >= 35 ? 'vio' : 'info', p <= 12 ? 'Fast' : p >= 35 ? 'Slow' : 'Medium', `With a ${p}-bar period the EMA turned up ${tE - bottom} bars after the bottom and the SMA ${tS - bottom}. ${p <= 12 ? 'Short periods react fast, but they also flip back and forth in choppy markets.' : p >= 35 ? 'Long periods are slow to turn, which makes them good for the big trend and bad for timing.' : 'Both lag, because both are built from past prices. The EMA lags less.'}`));
    });
  };

  /* =====================================================================
     8. emaStack
     ===================================================================== */
  SML.widgets.emaStack = function (root) {
    const id = SML.uid('es');
    const NT = 560, D0 = 260, ND = NT - D0;
    const cl = SML.data.path([[0, 132], [120, 136], [260, 134], [300, 124], [340, 112], [380, 101], [410, 104], [440, 100.5], [480, 110], [520, 121], [559, 129]], NT, 4, 0.55);
    const e13 = IND.ema(cl, 13), e48 = IND.ema(cl, 48), e200 = IND.ema(cl, 200);
    const stateAt = (i) => (e13[i] > e48[i] && e48[i] > e200[i] ? 'up' : e13[i] < e48[i] && e48[i] < e200[i] ? 'dn' : 'mix');
    const states = []; for (let i = D0; i < NT; i++) states.push(stateAt(i));
    const crosses = []; for (let i = D0 + 1; i < NT; i++) { const a = e13[i] - e48[i], b0 = e13[i - 1] - e48[i - 1]; if ((a >= 0) !== (b0 >= 0)) crosses.push({ i: i - D0, up: a >= 0 }); }
    root.innerHTML = `<div class="wg-bar"><span class="wg-title">Show</span>${ui.chips(id + '-c', [{ k: '13', label: '13 EMA', color: 'var(--accent)', on: true }, { k: '48', label: '48 EMA', color: 'var(--info)', on: true }, { k: '200', label: '200 EMA', color: 'var(--ink)', on: true }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-s', label: 'Scrub through time', min: 0, max: ND - 1, step: 1, value: 250, fmt: (v) => 'bar ' + (v + 1) })}</div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" id="${id}-play">▶ Play</button></div>
      <div class="wg-read">${ui.stat('Price', id + '-p')}${ui.stat('13 EMA', id + '-a')}${ui.stat('48 EMA', id + '-b')}${ui.stat('200 EMA', id + '-c2')}</div>
      <div class="wg-msg" id="${id}-m"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    let timer = null; const pb = byId(id + '-play');
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } pb.textContent = '▶ Play'; };
    SML.onCleanup(stop);
    pb.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (st.n(id + '-s') >= ND - 1) st.set(id + '-s', 0);
      if (SML.reduced()) { st.set(id + '-s', ND - 1); draw(); return; }
      pb.textContent = '❚❚ Pause';
      timer = setInterval(() => { const v = st.n(id + '-s') + 3; if (v >= ND - 1) { st.set(id + '-s', ND - 1); draw(); stop(); return; } st.set(id + '-s', v); draw(); }, 40);
    });
    const draw = ui.responsive(fig, (W) => {
      const s = st.n(id + '-s'), on = { 13: st.on(id + '-c', '13'), 48: st.on(id + '-c', '48'), 200: st.on(id + '-c', '200') };
      const compact = W < 480, H = compact ? 280 : 320, padL = 6, padR = compact ? 40 : 48, top = 16, ribH = 10, bot = H - ribH - 30;
      const seg = cl.slice(D0), lo = Math.min(...seg, ...e200.slice(D0)) - 2, hi = Math.max(...seg, ...e200.slice(D0)) + 2;
      const y = SML.lin(lo, hi, bot, top), x = SML.lin(0, ND - 1, padL, W - padR);
      let b = '';
      SML.ticks(lo, hi, 5).forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid') + S.text(padL + 2, y(v) - 3, '$' + v, 'xs mono'); });
      b += S.poly(seg.map((v, i) => [x(i), y(v)]), 's-mut w1');
      const lines = [{ k: 200, a: e200, c: 's-ink w25', t: 'ink' }, { k: 48, a: e48, c: 's-info w2', t: 'info' }, { k: 13, a: e13, c: 's-acc w2', t: 'acc' }];
      lines.forEach((L) => { if (on[L.k]) b += S.poly(L.a.slice(D0).map((v, i) => [x(i), y(v)]), L.c); });
      if (on[13] && on[48]) crosses.forEach((c) => { b += S.circle(x(c.i), y(e13[c.i + D0]), 4.5, (c.up ? 'f-up' : 'f-dn') + ' s-surf w15'); });
      const labs = lines.filter((L) => on[L.k]).map((L) => ({ y: y(L.a[NT - 1]) + 4, L }));
      MC.spread(labs, 13, top, bot);
      labs.forEach((q) => { b += S.text(W - padR + 5, q.ly, String(q.L.k), 'sm b ' + q.L.t); });
      // ribbon
      const ry = bot + 10; let r0 = 0;
      for (let i = 1; i <= ND; i++) { if (i === ND || states[i] !== states[r0]) { b += S.rect(x(r0), ry, Math.max(1, x(i - 1) - x(r0) + (W - padR - padL) / ND), ribH, states[r0] === 'up' ? 'f-up' : states[r0] === 'dn' ? 'f-dn' : 'f-shade2'); r0 = i; } }
      b += S.text(padL, ry + ribH + 13, compact ? 'green = stacked up · red = stacked down' : 'ribbon: green = stacked up · red = stacked down · grey = mixed', 'xs');
      // scrub
      b += S.line(x(s), top - 6, x(s), ry + ribH, 's-ink dash2');
      lines.forEach((L) => { if (on[L.k]) b += S.circle(x(s), y(L.a[s + D0]), 4, 'f-' + (L.t === 'ink' ? 'ink' : L.t) + ' s-surf w15'); });
      b += S.circle(x(s), y(cl[s + D0]), 3, 'f-mut');
      fig.innerHTML = S.wrap(W, H, 'Price with 13, 48 and 200 EMAs; the ribbon below shows when the averages were stacked up or down', b);
      const i = s + D0, state = stateAt(i), above = cl[i] >= e200[i];
      setStat(id + '-p', F.usd(cl[i]), above ? 'up' : 'dn'); setStat(id + '-a', F.usd(e13[i]), 'acc'); setStat(id + '-b', F.usd(e48[i])); setStat(id + '-c2', F.usd(e200[i]));
      const p200 = above ? 'Price is above the 200 EMA, so the big trend is up.' : 'Price is below the 200 EMA, so the big trend is down.';
      setHTML(id + '-m', state === 'up' ? ui.msg('up', 'Stacked up', `13 above 48 above 200: all three agree. ${p200} Favor longs.`)
        : state === 'dn' ? ui.msg('dn', 'Stacked down', `13 below 48 below 200: all three agree on down. ${p200} Favor shorts or stay out.`)
          : ui.msg('', 'Mixed', `The averages disagree, so the trend is changing or choppy. ${p200} Wait, or trade smaller.`));
    });
  };

  /* =====================================================================
     9. vwapLab
     ===================================================================== */
  SML.widgets.vwapLab = function (root) {
    const id = SML.uid('vw');
    const sess = SML.data.session(33, { kind: 'trend-up', bars: 100 }), day = sess.day, n = day.length;
    const vw = IND.vwap(day);
    root.innerHTML = `<div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-t', label: 'Time (ET)', min: 1, max: n, step: 1, value: 60, fmt: (v) => F.time(v * 2) })}</div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" id="${id}-play">▶ Play the day</button><span class="note">Each candle adds its price × volume to the running total.</span></div>
      <div class="wg-read">${ui.stat('Σ price × volume', id + '-pv')}${ui.stat('Σ volume', id + '-v')}${ui.stat('VWAP', id + '-w', 'hl')}${ui.stat('Price vs VWAP', id + '-d')}</div>
      <div class="mc-calc" id="${id}-calc"></div>
      <div class="wg-msg" id="${id}-m"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    let timer = null; const pb = byId(id + '-play');
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } pb.textContent = '▶ Play the day'; };
    SML.onCleanup(stop);
    pb.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (st.n(id + '-t') >= n) st.set(id + '-t', 1);
      if (SML.reduced()) { st.set(id + '-t', n); draw(); return; }
      pb.textContent = '❚❚ Pause';
      timer = setInterval(() => { const v = st.n(id + '-t') + 1; if (v > n) { stop(); return; } st.set(id + '-t', v); draw(); }, 120);
    });
    const draw = ui.responsive(fig, (W) => {
      const t = st.n(id + '-t'), compact = W < 480;
      const H = compact ? 280 : 320, padL = 6, padR = 44, top = 16, volH = 36, pBot = H - volH - 30;
      const [lo0, hi0] = MC.minMax(day), lo = lo0 - 0.2, hi = hi0 + 0.2, y = SML.lin(lo, hi, pBot, top);
      const slot = (W - padL - padR) / n, x = (i) => padL + slot * (i + 0.5), bw = Math.max(1.2, slot * 0.6);
      let b = MC.axis(y, lo, hi, padL, W - padR, 5, 0);
      // shaded gap between close and VWAP
      for (let i = 0; i < t - 1; i++) {
        const a = day[i].c - vw[i], c2 = day[i + 1].c - vw[i + 1];
        const cls = a + c2 >= 0 ? 'f-up-t' : 'f-dn-t';
        b += S.polygon([[x(i), y(day[i].c)], [x(i + 1), y(day[i + 1].c)], [x(i + 1), y(vw[i + 1])], [x(i), y(vw[i])]], cls + ' o70');
      }
      b += S.candles(day, x, bw, y, { to: t, cls: 'o70' });
      b += S.poly(vw.slice(0, t).map((v, i) => [x(i), y(v)]), 's-info w3');
      // crosses
      let lastX = null;
      for (let i = 1; i < t; i++) { const a = day[i].c >= vw[i], p = day[i - 1].c >= vw[i - 1]; if (a !== p) lastX = { i, up: a }; }
      if (lastX) {
        const px = x(lastX.i), py = y(day[lastX.i].c), dy = lastX.up ? 40 : -34, ly = SML.clamp(py + dy, top + 10, pBot + 8);
        b += S.line(px, py + (lastX.up ? 6 : -6), px, ly - (lastX.up ? 12 : -4), 's-' + (lastX.up ? 'up' : 'dn'));
        b += S.circle(px, py, 6, (lastX.up ? 'f-up' : 'f-dn') + ' s-surf w2');
        b += S.text(SML.clamp(px, 34, W - padR - 34), ly, lastX.up ? 'reclaim' : 'lost VWAP', 'sm b mc-halo ' + (lastX.up ? 'up' : 'dn'), 'middle');
      }
      b += S.text(SML.clamp(x(t - 1) + 8, 0, W - padR - 34), y(vw[t - 1]) + (day[t - 1].c >= vw[t - 1] ? 16 : -8), 'VWAP', 'sm info b');
      b += S.volume(day, x, bw, H - 20, volH, { to: t, hi: new Set(day.map((_, i) => i)), maxV: Math.max(...day.map((k) => k.v)) });
      [0, 60, 120, 180].forEach((m) => { b += S.text(x(m / 2) - slot / 2, H - 4, F.time(m), 'xs mono', m === 0 ? 'start' : 'middle'); });
      fig.innerHTML = S.wrap(W, H, 'Intraday candles with the VWAP line; green shading above VWAP, red below', b);
      let pv = 0, vv = 0; for (let i = 0; i < t; i++) { const k = day[i]; pv += ((k.h + k.l + k.c) / 3) * k.v; vv += k.v; }
      const w = pv / vv, c = day[t - 1].c, d = (c / w - 1) * 100;
      setStat(id + '-pv', F.num(pv, 0)); setStat(id + '-v', F.num(vv, 0)); setStat(id + '-w', F.usd(w)); setStat(id + '-d', F.spct(d, 2), d >= 0 ? 'up' : 'dn');
      const k = day[t - 1];
      setHTML(id + '-calc', `Latest candle: typical price (H+L+C)/3 = <b>${F.usd((k.h + k.l + k.c) / 3)}</b> × volume <b>${F.num(k.v, 0)}</b>. VWAP = <b>${F.num(pv, 0)}</b> ÷ <b>${F.num(vv, 0)}</b> = <b>${F.usd(w)}</b>`);
      setHTML(id + '-m', Math.abs(d) < 0.05 ? ui.msg('acc', 'On VWAP', `Price is sitting right on VWAP (${F.usd(w)}). This is a decision point: watch which side it closes on.`)
        : d > 0 ? ui.msg('up', 'Above VWAP', `Price is ${F.pct(d, 2)} above VWAP. Today's average buyer is in profit, so buyers are in control. Favor longs; pullbacks to VWAP are often bought.`)
          : ui.msg('dn', 'Below VWAP', `Price is ${F.pct(-d, 2)} below VWAP. Today's average buyer is losing, so sellers are in control. Avoid longs until price reclaims it.`));
    });
  };

  /* =====================================================================
     10. rsiLab
     ===================================================================== */
  SML.widgets.rsiLab = function (root) {
    const id = SML.uid('rs');
    const n = 140;
    const cl = SML.data.path([[0, 100], [30, 111.5], [45, 113.5], [60, 104], [75, 100], [90, 101.5], [100, 99.5], [110, 103], [139, 111]], n, 14, 0.62);
    let hov = null;
    root.innerHTML = `<div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-p', label: 'RSI period', min: 2, max: 30, step: 1, value: 14, fmt: 'bars' })}${ui.slider({ id: id + '-ob', label: 'Overbought line', min: 60, max: 90, step: 1, value: 70, fmt: 'num' })}${ui.slider({ id: id + '-os', label: 'Oversold line', min: 10, max: 40, step: 1, value: 30, fmt: 'num' })}</div>
      <div class="wg-read">${ui.stat('Bar', id + '-b')}${ui.stat('Price', id + '-pr')}${ui.stat('RSI', id + '-r')}${ui.stat('Longest overbought run', id + '-run')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-note">Hover or tap the chart to read RSI at any bar.</div>`;
    const fig = root.querySelector('.wg-fig');
    let geo = null;
    const st = ui.wire(root, () => draw());
    MC.hover(fig, (p) => (geo ? SML.clamp(Math.round(geo.x.inv(p.x)), geo.p, n - 1) : null), (i) => { if (i !== hov) { hov = i; draw(); } }, () => { hov = null; draw(); });
    const draw = ui.responsive(fig, (W) => {
      const p = st.n(id + '-p'), ob = st.n(id + '-ob'), os = st.n(id + '-os');
      const r = IND.rsi(cl, p);
      const compact = W < 480, H = compact ? 320 : 360, padL = 30, padR = 12, top = 14;
      const pBot = Math.round(H * 0.54), rTop = pBot + 24, rBot = H - 20;
      const x = SML.lin(0, n - 1, padL, W - padR), yp = SML.lin(97, 116, pBot, top), yr = SML.lin(0, 100, rBot, rTop);
      geo = { x, p };
      let b = '';
      SML.ticks(98, 116, 4).forEach((v) => { b += S.line(padL, yp(v), W - padR, yp(v), 's-grid') + S.text(padL - 4, yp(v) + 3.5, String(v), 'xs mono', 'end'); });
      if (!compact) b += S.text(padL + 2, top + 2, 'PRICE', 'cap');
      b += S.text(padL + 2, rTop - 7, 'RSI', 'cap');
      b += S.rect(padL, yr(100), W - padR - padL, yr(ob) - yr(100), 'f-dn-t') + S.rect(padL, yr(os), W - padR - padL, yr(0) - yr(os), 'f-up-t');
      b += S.line(padL, yr(ob), W - padR, yr(ob), 's-dn dash') + S.line(padL, yr(os), W - padR, yr(os), 's-up dash') + S.line(padL, yr(50), W - padR, yr(50), 's-grid');
      b += S.text(padL - 4, yr(ob) + 3.5, String(ob), 'xs mono dn', 'end') + S.text(padL - 4, yr(os) + 3.5, String(os), 'xs mono up', 'end');
      b += S.text(W - padR, rTop - 7, 'overbought ▲', 'xs b dn', 'end') + S.text(W - padR, rBot + 13, 'oversold ▼', 'xs b up', 'end');
      b += S.poly(cl.map((v, i) => [x(i), yp(v)]), 's-ink w2');
      b += S.poly(r.map((v, i) => (v == null ? null : [x(i), yr(v)])), 's-vio w2');
      // markers + longest run
      let run = 0, best = 0, bestEnd = -1, cntOb = 0, cntOs = 0;
      for (let i = p + 1; i < n; i++) {
        if (r[i] == null || r[i - 1] == null) continue;
        if (r[i] >= ob && r[i - 1] < ob) { cntOb++; b += S.polygon([[x(i), yp(cl[i]) - 7], [x(i) - 5, yp(cl[i]) - 15], [x(i) + 5, yp(cl[i]) - 15]], 'f-dn'); }
        if (r[i] <= os && r[i - 1] > os) { cntOs++; b += S.polygon([[x(i), yp(cl[i]) + 7], [x(i) - 5, yp(cl[i]) + 15], [x(i) + 5, yp(cl[i]) + 15]], 'f-up'); }
        if (r[i] >= ob) { run++; if (run > best) { best = run; bestEnd = i; } } else run = 0;
      }
      if (best > 3) { const s0 = bestEnd - best + 1; b += S.rect(x(s0), top, x(bestEnd) - x(s0), pBot - top, 'f-dn-t o50'); if (!compact || best > 10) b += S.text(Math.max((x(s0) + x(bestEnd)) / 2, padL + 70), top + 12, `${best} bars overbought`, 'sm dn b mc-halo', 'middle'); }
      const hi = hov != null && r[hov] != null ? hov : null;
      if (hi != null) { b += S.line(x(hi), top, x(hi), rBot, 's-ink dash2'); b += S.circle(x(hi), yp(cl[hi]), 4, 'f-ink'); b += S.circle(x(hi), yr(r[hi]), 4, 'f-vio'); }
      fig.innerHTML = S.wrap(W, H, `Price chart with a ${p}-period RSI below; overbought above ${ob}, oversold below ${os}`, b);
      const idx = hi != null ? hi : n - 1, rv = r[idx];
      setStat(id + '-b', String(idx + 1)); setStat(id + '-pr', F.usd(cl[idx])); setStat(id + '-r', rv == null ? '—' : rv.toFixed(0), rv >= ob ? 'dn' : rv <= os ? 'up' : '');
      setStat(id + '-run', best + ' bars', 'dn');
      let m;
      if (hi != null) m = rv >= ob ? ui.msg('dn', 'Overbought', `RSI ${rv.toFixed(0)}: stretched up. Avoid chasing here, but don't short it just for this; strong trends stay overbought.`)
        : rv <= os ? ui.msg('up', 'Oversold', `RSI ${rv.toFixed(0)}: stretched down. Sellers may be tiring, but wait for price itself to turn before buying.`)
          : ui.msg('', 'Neutral', `RSI ${rv.toFixed(0)}: between ${os} and ${ob}. No stretch either way.`);
      else m = ui.msg('vio', 'Warning, not a signal', `During the rally RSI stayed above ${ob} for ${best} bars in a row while price kept climbing. Overbought warns you not to chase. It does not mean sell. ${p < 8 ? 'A short period makes RSI jump in and out of the zones constantly.' : ''}`);
      setHTML(id + '-m', m);
    });
  };

  /* =====================================================================
     11. expectedMove (also the "Expected move" tool)
     ===================================================================== */
  SML.widgets.expectedMove = function (root) {
    const id = SML.uid('em');
    let seed = 5;
    root.innerHTML = `<div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-p', label: 'Stock price', min: 5, max: 500, step: 1, value: 100, fmt: 'usd0' })}${ui.slider({ id: id + '-iv', label: 'Implied volatility (IV)', min: 5, max: 150, step: 1, value: 30, fmt: 'pct' })}${ui.slider({ id: id + '-d', label: 'Days ahead', min: 1, max: 365, step: 1, value: 30, fmt: 'days' })}</div>
      <div class="wg-read">${ui.stat('Expected move', id + '-m1', 'hl')}${ui.stat('As a percent', id + '-pc')}${ui.stat('68% range', id + '-r1')}${ui.stat('95% range', id + '-r2')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" id="${id}-new">New sample paths</button><span class="note">Expected move = price × IV × √(days ÷ 365). A rough guide, not a promise.</span></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    byId(id + '-new').addEventListener('click', () => { seed++; draw(); });
    const draw = ui.responsive(fig, (W) => {
      const P = st.n(id + '-p'), iv = st.n(id + '-iv') / 100, D = st.n(id + '-d');
      const sd = (t) => P * iv * Math.sqrt(t / 365);
      const m1 = sd(D);
      const compact = W < 480, H = compact ? 280 : 320, padL = 6, padR = compact ? 74 : 120, top = 18, bot = H - 24;
      const lo = Math.max(0, P - 2.5 * m1), hi = P + 2.5 * m1, y = SML.lin(lo, hi, bot, top), x = SML.lin(0, D, padL + 6, W - padR);
      const N = 48, ts = []; for (let i = 0; i <= N; i++) ts.push((D * i) / N);
      let b = '';
      SML.ticks(lo, hi, 5).forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid'); });
      const band = (k, cls) => S.polygon(ts.map((t) => [x(t), y(P + k * sd(t))]).concat(ts.slice().reverse().map((t) => [x(t), y(Math.max(lo, P - k * sd(t)))])), cls);
      b += band(2, 'f-vio-t o50') + band(1, 'f-vio-t');
      b += S.poly(ts.map((t) => [x(t), y(P + sd(t))]), 's-vio w2') + S.poly(ts.map((t) => [x(t), y(P - sd(t))]), 's-vio w2');
      b += S.poly(ts.map((t) => [x(t), y(P + 2 * sd(t))]), 's-vio w1 dash2') + S.poly(ts.map((t) => [x(t), y(Math.max(lo, P - 2 * sd(t)))]), 's-vio w1 dash2');
      b += S.line(x(0), y(P), x(D), y(P), 's-mut dash');
      // sample paths (GBM)
      const r = SML.rng(seed * 97 + 3), steps = Math.min(120, Math.max(10, D)), dt = D / steps / 365;
      let inside = 0;
      for (let k = 0; k < 6; k++) {
        let s = P; const pts = [[x(0), y(P)]];
        for (let j = 1; j <= steps; j++) { s = s * Math.exp(-0.5 * iv * iv * dt + iv * Math.sqrt(dt) * r.gauss()); pts.push([x((D * j) / steps), y(SML.clamp(s, lo, hi))]); }
        const inB = Math.abs(s - P) <= m1; if (inB) inside++;
        b += S.poly(pts, 's-ink w1 o50');
        b += S.circle(pts[pts.length - 1][0], pts[pts.length - 1][1], 3.5, inB ? 'f-ink' : 'f-acc');
      }
      b += S.circle(x(0), y(P), 5, 'f-ink');
      const ex = W - padR + 8;
      const labs = MC.spread([{ y: y(P + 2 * m1) + 4, t: compact ? '+2σ' : '+2σ ' + F.usd(P + 2 * m1), c: 'vio' }, { y: y(P + m1) + 4, t: compact ? '+1σ' : '+1σ ' + F.usd(P + m1), c: 'vio b' }, { y: y(P) + 4, t: compact ? 'now' : 'today ' + F.usd(P), c: 'ink' }, { y: y(P - m1) + 4, t: compact ? '−1σ' : '−1σ ' + F.usd(P - m1), c: 'vio b' }, { y: y(Math.max(lo, P - 2 * m1)) + 4, t: compact ? '−2σ' : '−2σ ' + F.usd(Math.max(0, P - 2 * m1)), c: 'vio' }], 15, top, bot + 4);
      labs.forEach((q) => { b += S.text(ex, q.ly, q.t, 'sm mono ' + q.c); });
      b += S.text(x(0), H - 6, 'today', 'xs', 'start') + S.text(x(D), H - 6, 'day ' + D, 'xs', 'end');
      if (D >= 10) b += S.text(x(D / 2), H - 6, 'day ' + Math.round(D / 2), 'xs', 'middle');
      fig.innerHTML = S.wrap(W, H, `Expected move cone for a ${F.usd(P, 0)} stock with ${Math.round(iv * 100)}% IV over ${D} days`, b);
      setStat(id + '-m1', '±' + F.usd(m1)); setStat(id + '-pc', '±' + F.pct((m1 / P) * 100, 1));
      setStat(id + '-r1', `${F.usd(P - m1, 2)} – ${F.usd(P + m1, 2)}`); setStat(id + '-r2', `${F.usd(Math.max(0, P - 2 * m1), 2)} – ${F.usd(P + 2 * m1, 2)}`);
      setHTML(id + '-msg', ui.msg('vio', `${Math.round(iv * 100)}% IV`, `Options are pricing a move of about ±${F.usd(m1)} (±${F.pct((m1 / P) * 100, 1)}) by day ${D}. Price ends inside ${F.usd(P - m1)}–${F.usd(P + m1)} roughly 2 times out of 3. In this sample, ${inside} of 6 paths ended inside.`));
    });
  };
})();
(function () {
  'use strict';
  const SML = window.SML;
  const L = (o) => SML.lessons.push(o);

  /* ---------------- Reading Charts ---------------- */
  L({
    id: 'l-candles', course: 'charts', order: 1, title: 'Candlesticks', mins: 4, level: 'Beginner',
    summary: 'What one candle tells you about buyers and sellers.',
    idea: 'Each candle shows one slice of time: where price opened, where it closed, and how far it travelled in between.',
    widget: 'candleBuilder', opts: {},
    try: 'Pick a preset or drag the sliders. Watch the candle change shape and name.',
    body: [
      '<p>A candle has a <b>body</b> and two <b>wicks</b>. The body runs from the open price to the close price. The wicks reach the highest and lowest prices traded during that period.</p>',
      '<p>A <b class="up">green</b> candle closed higher than it opened, so buyers won that period. A <b class="dn">red</b> candle closed lower, so sellers won.</p>',
      '<p>Long wicks mean rejection: price went there, and the other side pushed it back. One candle is only a hint. It matters most when it forms at a level you already marked.</p>',
    ],
    extra: [{ widget: 'candleStory', opts: {}, try: 'Hover or tap any candle, or use the arrows, to read the story each one tells.' }],
    points: ['Body = open to close. Wicks = the high and the low.', 'Green closes above its open; red closes below it.', 'A long lower wick shows buyers stepping in. A long upper wick shows sellers.', 'Trust a candle signal more when it appears at support or resistance.'],
    quiz: { q: 'A candle opens at $50, drops to $47, and closes at $49.90. What is it?', options: ['A shooting star', 'A hammer', 'A big green body'], answer: 1, why: 'The long lower wick and tiny body near the top show buyers pushed price all the way back up.' },
    terms: ["Candlestick", "Wick", "Doji", "Hammer", "Support"],
    example: {"title": "Hammer at support", "intro": "You marked $50 as support because price bounced there twice last week.", "steps": ["Price pulls back to $50 on the 15-minute chart.", "A candle opens at $50.20, drops to $49.40 and closes at $50.30. The lower wick is $0.80 long and the body only $0.10.", "That shape is a hammer: sellers pushed price down and buyers pushed it all the way back.", "The next candle trades above the hammer’s high of $50.45. That is your confirmation.", "You buy at $50.50 with a stop at $49.30, just under the wick, and a target at the next resistance, $52."], "result": "You risk $1.20 per share to make $1.50, a 1.25R trade."},
    mistakes: ["Trading every hammer or doji you see. Without a level behind it, one candle is mostly noise.", "Acting before the candle closes. A hammer can turn into a big red candle in its last minute.", "Reading color only. A green candle with a long upper wick still shows sellers pushing back.", "Ignoring the timeframe. A hammer on a 1-minute chart means far less than one on a 15-minute chart."],
  });

  L({
    id: 'l-timeframes', course: 'charts', order: 2, title: '2-min vs 15-min', mins: 4, level: 'Beginner',
    summary: 'Why traders read a slow chart and a fast chart together.',
    idea: 'The same trading looks different on each timeframe. Use the slow chart for direction and the fast chart for timing.',
    widget: 'timeframeZoom', opts: {},
    try: 'Switch timeframes, then hover a candle to see which 15-minute candle it belongs to.',
    body: [
      '<p>A <b>timeframe</b> is how much time each candle covers. On a 15-minute chart one candle holds 15 minutes of trading. On a 2-minute chart the same 15 minutes is split into seven or eight smaller candles.</p>',
      '<p>The 15-minute chart filters out noise. Use it to find the trend and the levels that matter today.</p>',
      '<p>The 2-minute chart shows the detail inside each move. Use it to time your entry, see the retest happen, and place a tight stop.</p>',
    ],
    points: ['Higher timeframe = direction and key levels.', 'Lower timeframe = entry timing and stop placement.', 'When the two disagree, the higher timeframe usually wins.', 'Pick two timeframes and use the same ones every day.'],
    quiz: { q: 'The 15-minute chart shows a clean uptrend. What is the 2-minute chart best used for?', options: ['Deciding the trend', 'Timing a pullback entry', 'Replacing the 15-minute chart'], answer: 1, why: 'The 15-minute chart sets the direction; the 2-minute chart helps you enter at a good price with a tight stop.' },
    terms: ["Timeframe", "Candlestick", "Confirmation", "Stop loss"],
    example: {"title": "Map on the 15, trigger on the 2", "steps": ["On the 15-minute chart DEMO makes higher highs and higher lows, and $42 has held as support twice. Your plan: look for a long near $42.", "At 10:15 price drifts back to $42.10, so you switch to the 2-minute chart.", "A 2-minute candle tests $41.95, then closes back at $42.15. The next one closes higher at $42.30.", "You buy at $42.30 with a stop at $41.85, below the 2-minute low, instead of $41.40 below the 15-minute candle.", "Your target stays the 15-minute high at $43.20."], "result": "The tighter stop risks $0.45 instead of $0.90, so the same $0.90 move to the target pays 2R instead of 1R."},
    mistakes: ["Flipping through timeframes until one agrees with the trade you already want.", "Taking a 2-minute signal against a clear 15-minute trend.", "Using a different pair of timeframes every day, so no chart ever becomes familiar."],
  });

  L({
    id: 'l-levels', course: 'charts', order: 3, title: 'PDH, PDL, PMH, PML', mins: 5, level: 'Beginner',
    summary: 'Four prices to mark before the opening bell.',
    idea: 'Yesterday’s high and low and this morning’s premarket high and low are where price most often reacts.',
    widget: 'levelsMap', opts: {},
    try: 'Press Play the day or drag the time slider. Toggle each level and follow the numbered reactions.',
    body: [
      '<p><b>PDH</b> and <b>PDL</b> are the previous day’s high and low. <b>PMH</b> and <b>PML</b> are the high and low of the <b>premarket</b>, the trading that happens before the 9:30 a.m. ET open.</p>',
      '<p>Thousands of traders watch these same prices, so orders pile up there. That is why price often stalls, bounces, or speeds up when it reaches one.</p>',
      '<p>Mark all four every morning before the open. A break above the premarket high on strong volume, followed by a retest that holds, is one of the most common day-trading setups. A quick poke above it that fails is one of the most common traps.</p>',
    ],
    points: ['Mark PDH, PDL, PMH and PML before 9:30 a.m. ET.', 'Treat levels as zones a few cents wide, not exact pennies.', 'A clean break plus a retest is stronger than a first touch.', 'The nearest level above and below frame your target and your stop.'],
    quiz: { q: 'Price opens just below the premarket high. What is that level likely to act as first?', options: ['Support', 'Resistance', 'Nothing until the afternoon'], answer: 1, why: 'From below, a prior high is a ceiling until price closes above it.' },
    terms: ["PDH", "PDL", "PMH", "PML", "Premarket", "Retest"],
    example: {"title": "Planning the morning with four levels", "intro": "It is 9:15 a.m. ET and you are marking DEMO before the open.", "steps": ["Yesterday’s high was $26.40 (PDH) and yesterday’s low was $24.90 (PDL).", "Premarket traded between $25.40 (PML) and $25.95 (PMH). Price is now $25.80.", "Plan A: if price closes above $25.95 and a retest holds, buy with a stop at $25.75 and a target at $26.40.", "Plan B: if price loses $25.40, stand aside or look for a short toward $24.90.", "At 9:48 a candle closes at $26.02, the retest dips to $25.96 and holds, and you buy at $26.00."], "result": "You risk $0.25 to make $0.40, a 1.6R trade framed entirely by levels you marked before the bell."},
    mistakes: ["Marking levels after the open, when price is already moving and you are reacting instead of planning.", "Treating a level as one exact penny. Price often overshoots by a few cents before it reacts.", "Buying the first touch of a level from below instead of waiting for a close above it and a retest.", "Forgetting that PMH and PML only show when extended-hours data is turned on in your charting app."],
  });

  L({
    id: 'l-support', course: 'charts', order: 4, title: 'Support & resistance', mins: 4, level: 'Beginner',
    summary: 'Floors, ceilings, and why they swap roles.',
    idea: 'Support is a price where buyers keep showing up. Resistance is where sellers do. Once broken, they often switch jobs.',
    widget: 'srDrag', opts: {},
    try: 'Drag the amber line onto a price where the chart keeps turning. The counters show touches and bounces.',
    body: [
      '<p><b>Support</b> is a floor: price falls to it and bounces. <b>Resistance</b> is a ceiling: price rises to it and gets pushed back down.</p>',
      '<p>The more times a level holds, the more traders notice it. Each touch also uses up some of the orders waiting there, which is why a level tested many times often breaks in the end.</p>',
      '<p>After a break, the old ceiling often becomes the new floor. Traders who missed the breakout buy the pullback to it. That pullback is called a <b>retest</b>.</p>',
    ],
    points: ['Support = floor. Resistance = ceiling.', 'Draw levels where price turned more than once.', 'Treat a level as a zone, not a single penny.', 'Broken resistance often becomes support on the retest.'],
    quiz: { q: 'Price breaks above $50 resistance, falls back to $50, and bounces. What happened?', options: ['A failed breakout', 'A retest: old resistance acted as support', 'The level stopped mattering'], answer: 1, why: 'Holding the old ceiling from above is the classic role reversal.' },
    terms: ["Support", "Resistance", "Breakout", "Retest", "Stop loss"],
    example: {"title": "Old ceiling, new floor", "steps": ["DEMO turns down at $18.00 three times in two weeks. That is resistance.", "On Tuesday it closes at $18.35 on strong volume and breaks through.", "On Wednesday it pulls back to $18.05 and a 15-minute candle closes at $18.20. The old ceiling holds as a floor.", "You buy at $18.20 with a stop at $17.85, just under the zone.", "Your target is the next swing high at $19.10."], "result": "You risk $0.35 to make $0.90, about 2.6R."},
    mistakes: ["Drawing a level through every wiggle. A useful level has at least two clear turns.", "Placing the stop exactly on the level, where normal noise will hit it.", "Assuming a level holds forever. Every extra test uses up the buyers or sellers defending it."],
  });

  L({
    id: 'l-breakouts', course: 'charts', order: 5, title: 'Breakouts & fakeouts', mins: 6, level: 'Intermediate',
    summary: 'Wait for confirmation before you trust a break.',
    idea: 'A real breakout closes past the level on strong volume and holds the retest. A fakeout only pokes through.',
    widget: 'breakoutSim', opts: {},
    try: 'Pick a chart, press Next candle, and make the call when the game asks: Enter or Wait?',
    body: [
      '<p>A <b>breakout</b> is price moving through a level that held before. Many breakouts fail. A <b>false breakout</b> pokes above the level, traps eager buyers, then falls back.</p>',
      '<p><b>Confirmation</b> means waiting for proof: a candle that closes beyond the level, volume well above average, a retest that holds, and price on the right side of VWAP.</p>',
      '<p>Waiting means you sometimes miss a move. That costs nothing. Chasing a fakeout costs a full loss. Results here are counted in <b>R</b>: 1R is the amount you planned to risk.</p>',
    ],
    points: ['Look for a close beyond the level, not just a wick.', 'Breakout volume should be at least 1.5× the recent average.', 'The retest is your entry; the stop goes just past the level.', 'Missing a trade costs 0R. A fakeout costs 1R.'],
    quiz: { q: 'A candle wicks above resistance on low volume and closes back below. What is it most likely?', options: ['A confirmed breakout', 'A false breakout', 'A retest'], answer: 1, why: 'No close above the level and weak volume are the two classic fakeout signs.' },
    terms: ['Breakout', 'False breakout', 'Retest', 'Confirmation', 'Volume', 'R multiple'],
    example: {"title": "Waiting for the retest", "steps": ["DEMO stalls at $30.00 three times this morning. Average 2-minute volume is 40,000 shares.", "At 10:06 a candle closes at $30.18 on 92,000 shares, 2.3 times average: a close above the level on strong volume.", "You do not chase. Two candles later price dips to $30.03 and closes at $30.12. The retest holds and price is above VWAP.", "You buy at $30.12 with a stop at $29.92, just under the level.", "Your target is $30.72, the next level above."], "result": "You risk $0.20 to make $0.60, a 3R trade. If the retest had failed, you would have skipped it and lost nothing."},
    mistakes: ["Buying the first wick above the level before the candle closes.", "Ignoring volume. A break on below-average volume fails far more often.", "Placing the stop far below the level, which turns a small loss into a big one.", "Chasing a breakout that is already several ATRs past the level."],
  });

  L({
    id: 'l-volume', course: 'charts', order: 6, title: 'Volume', mins: 4, level: 'Beginner',
    summary: 'Volume is the fuel behind every move.',
    idea: 'Volume counts how many shares traded. Big moves on big volume tend to last; moves on thin volume tend to fade.',
    widget: 'volumeLab', opts: {},
    try: 'Slide the breakout volume and watch the follow-through change. Then compare a healthy and a weak trend.',
    body: [
      '<p><b>Volume</b> is the number of shares traded during each candle. It shows how many people took part in the move.</p>',
      '<p><b>Relative volume</b> compares today with normal. 2× means twice the usual activity for this time of day. Stocks that are “in play” often trade at 2× or more.</p>',
      '<p>In a healthy uptrend, volume grows on up candles and shrinks on pullbacks. If price keeps rising while volume fades, fewer buyers are joining and the move is getting tired.</p>',
    ],
    points: ['Strong breakouts usually come with 1.5× to 3× normal volume.', 'Rising price on rising volume = healthy.', 'Rising price on fading volume = weakening.', 'Quiet, low-volume pullbacks inside a trend are normal.'],
    quiz: { q: 'Price breaks resistance on half its normal volume. What should you expect?', options: ['A strong, lasting move', 'A higher chance the break fails', 'Nothing; volume does not matter'], answer: 1, why: 'Few buyers took part, so there is little fuel to carry the break.' },
    terms: ['Volume', 'Relative volume', 'Breakout', 'Confirmation'],
    example: {"title": "Reading relative volume", "steps": ["DEMO usually trades about 50,000 shares per 2-minute bar around 10:00.", "It breaks above $12.40 on a bar of 140,000 shares. Relative volume is 140,000 ÷ 50,000 = 2.8×.", "The next three bars push higher on 90,000, 80,000 and 75,000 shares, all above average.", "A pullback comes on only 30,000 shares, well below average. Sellers are not stepping in.", "You add to the trade on the quiet pullback and keep your stop under $12.40."], "result": "Heavy volume on the push and light volume on the pullback is what a healthy move looks like."},
    mistakes: ["Comparing volume to the whole day instead of the same time of day. The open is always busy.", "Treating any big volume bar as bullish. Heavy volume on a red candle at resistance is selling.", "Ignoring a breakout that happens on fading volume."],
  });

  /* ---------------- Indicators ---------------- */
  L({
    id: 'l-moving-averages', course: 'indicators', order: 1, title: 'SMA vs EMA', mins: 4, level: 'Beginner',
    summary: 'Two ways to smooth price, and why the EMA reacts faster.',
    idea: 'A moving average smooths price into one line. The EMA weights recent prices more, so it turns sooner than the SMA.',
    widget: 'maLab', opts: {},
    try: 'Change the period and toggle each average. The markers show how many bars each one lagged the bottom.',
    body: [
      '<p>A <b>simple moving average (SMA)</b> adds up the last N closing prices and divides by N. Every close counts the same.</p>',
      '<p>An <b>exponential moving average (EMA)</b> gives the newest closes more weight. It hugs price more closely and turns sooner, which is why many day traders prefer it.</p>',
      '<p>Every average lags because it is built from past prices. A shorter period lags less but flips back and forth more when the market is choppy.</p>',
    ],
    points: ['Both averages lag; the EMA lags less.', 'Short periods react fast and give more false signals.', 'Long periods are slow but show the big trend.', 'Use averages to read the trend, not to predict turns.'],
    quiz: { q: 'Why does a 20-period EMA turn up before a 20-period SMA?', options: ['It uses more data', 'It gives recent prices more weight', 'It ignores volume'], answer: 1, why: 'Heavier weight on the newest closes makes the EMA respond sooner.' },
    terms: ["SMA", "EMA", "Timeframe"],
    glossary: [{"t": "Period", "d": "How many bars an indicator looks back over. A 20-period average uses the last 20 closes."}, {"t": "Lag", "d": "How far an indicator trails price. Longer periods lag more."}],
    example: {"title": "Same data, two averages", "intro": "DEMO closes at $10, $10, $10 and $10, then jumps to $12.", "steps": ["A 5-period SMA adds the last five closes and divides by five: (10 + 10 + 10 + 10 + 12) ÷ 5 = $10.40.", "A 5-period EMA gives the newest close a weight of 2 ÷ (5 + 1) = 0.33. It moves from $10 to 10 + 0.33 × (12 - 10) = $10.67.", "The EMA reacted $0.27 more to the new price, so it turns sooner.", "If DEMO keeps closing at $12, the SMA reaches $12 after five bars. The EMA gets close faster but never quite touches it."], "result": "Use the EMA when you want speed and the SMA when you want fewer false turns."},
    mistakes: ["Expecting a moving average to predict a turn. It can only confirm one after it starts.", "Using a very short period and trading every cross, which gives many false signals in choppy markets.", "Mixing SMA and EMA without checking which one your chart is showing."],
  });

  L({
    id: 'l-ema-stack', course: 'indicators', order: 2, title: '13, 48 & 200 EMA', mins: 5, level: 'Beginner',
    summary: 'Three averages for the fast, medium and big trend.',
    idea: 'When the 13 EMA is above the 48 and the 48 is above the 200, all three trends agree on up.',
    widget: 'emaStack', opts: {},
    try: 'Drag the scrubber or press Play. The ribbon under the chart shows when the averages were stacked.',
    body: [
      '<p>The <b class="acc">13 EMA</b> tracks fast momentum and makes a handy trailing stop. The <b class="info">48 EMA</b> shows the medium trend; it behaves almost exactly like the popular 50. The <b>200 EMA</b> is the big trend nearly everyone watches.</p>',
      '<p><b>Stacked up</b> means 13 above 48 above 200, the cleanest uptrend. <b>Stacked down</b> is the mirror image. Anything else is mixed: the trend is changing or choppy.</p>',
      '<p>Price above the 200 EMA keeps the big picture bullish. Many traders only take longs above it and only take shorts below it.</p>',
    ],
    points: ['13 = momentum, 48 = medium trend, 200 = big trend.', 'Stacked averages mean the trend is clean.', 'Mixed averages mean wait, or trade smaller.', 'The exact numbers matter less than using the same ones every day.'],
    quiz: { q: 'The 13 EMA is below the 48, and both are below the 200. What does that tell you?', options: ['A strong uptrend', 'A stacked downtrend', 'Nothing useful'], answer: 1, why: 'All three averages agree on down when they stack in that order.' },
    terms: ["EMA", "SMA", "Support", "Stop loss"],
    glossary: [{"t": "Crossover", "d": "When a faster average crosses above or below a slower one."}, {"t": "EMA stack", "d": "Averages lined up in order, 13 above 48 above 200 or the reverse, showing a clean trend."}],
    example: {"title": "Trading with the stack", "steps": ["On the 15-minute chart DEMO trades at $64. The 13 EMA is $63.50, the 48 EMA $62.80 and the 200 EMA $60.10: stacked up.", "Price pulls back to $63.45, touching the 13 EMA, while the 48 and 200 keep rising.", "A candle closes back at $63.70. You buy with a stop at $62.70, just under the 48 EMA.", "As the trend continues you trail your stop under the 13 EMA.", "Two days later the 13 crosses below the 48. The stack is broken, so you exit at $66.10."], "result": "You risk $1.00 to make $2.40, a 2.4R trade that followed the trend instead of predicting it."},
    mistakes: ["Buying pullbacks while the 13, 48 and 200 are tangled. Mixed averages mean chop.", "Shorting just because price is far above the 200 EMA. Stretched is not the same as finished.", "Changing the periods every week to fit the latest chart."],
  });

  L({
    id: 'l-vwap', course: 'indicators', order: 3, title: 'VWAP', mins: 5, level: 'Beginner',
    summary: 'Today’s average price, weighted by volume.',
    idea: 'VWAP is the average price everyone paid today, weighted by volume. Above it, buyers are in control. Below it, sellers are.',
    widget: 'vwapLab', opts: {},
    try: 'Drag the time slider or press Play. Watch the running math build the VWAP line candle by candle.',
    body: [
      '<p><b>VWAP</b> stands for volume-weighted average price. Each candle’s typical price is multiplied by its volume, the results are added up, and the total is divided by all the volume so far. It resets every morning.</p>',
      '<p>Big funds use VWAP to judge whether they bought at a good price. Day traders use it as a line in the sand: favor longs above it and shorts below it.</p>',
      '<p>A <b>reclaim</b>, when price drops below VWAP and then closes back above it, is a common long setup. Losing VWAP after a strong run is a warning sign.</p>',
    ],
    points: ['VWAP resets at every open.', 'Above VWAP: buyers in control. Below: sellers.', 'Price often pulls back to VWAP and reacts there.', 'Busy, high-volume candles count more than quiet ones.'],
    quiz: { q: 'Price has stayed above VWAP all morning and pulls back to it. What do many traders watch for?', options: ['A bounce off VWAP to buy', 'An instant short', 'VWAP to reset at noon'], answer: 0, why: 'On a strong day VWAP often acts as support on pullbacks.' },
    terms: ["VWAP", "Volume", "Support", "Resistance"],
    example: {"title": "Buying the VWAP pullback", "steps": ["DEMO opens at $40 and climbs to $41.20 by 10:30, staying above VWAP the whole time.", "VWAP is now $40.60. Price pulls back to $40.65 on light volume.", "A 2-minute candle wicks to $40.58 and closes at $40.80, back above VWAP.", "You buy at $40.80 with a stop at $40.45, below VWAP and the wick.", "Your first target is the morning high at $41.20."], "result": "You risk $0.35 to make $0.40 to the high, a bit over 1R, with room for more if the trend holds."},
    mistakes: ["Using a VWAP carried over from yesterday. VWAP resets at every open.", "Buying every touch of VWAP on a choppy day when price keeps crossing back and forth.", "Giving late-day VWAP crosses too much weight. By the afternoon VWAP barely moves."],
  });

  L({
    id: 'l-rsi', course: 'indicators', order: 4, title: 'RSI', mins: 4, level: 'Beginner',
    summary: 'A 0 to 100 gauge of how stretched a move is.',
    idea: 'RSI compares recent gains with recent losses on a 0 to 100 scale. High means stretched up; low means stretched down.',
    widget: 'rsiLab', opts: {},
    try: 'Change the period and the two lines. Hover the chart to read RSI at any bar.',
    body: [
      '<p><b>RSI</b> (relative strength index) looks at the last 14 candles by default. If most of them closed up, RSI is high. If most closed down, it is low.</p>',
      '<p>Above 70 is called <b>overbought</b> and below 30 is <b>oversold</b>. Those words sound like signals, but they only mean the move is stretched.</p>',
      '<p>In a strong trend RSI can stay above 70 for a long time while price keeps climbing. Selling just because RSI is high is a classic beginner mistake. Use it to avoid chasing, not to call tops.</p>',
    ],
    points: ['RSI runs from 0 to 100; 14 periods is the default.', 'Above 70 = stretched up. Below 30 = stretched down.', 'Strong trends can stay overbought for a long time.', 'A shorter period makes RSI jumpier.'],
    quiz: { q: 'RSI hits 78 during a powerful uptrend. What is the most sensible reading?', options: ['Short it right away', 'The move is stretched, so avoid chasing a new entry', 'RSI is broken'], answer: 1, why: 'Overbought warns against buying late. It does not say the trend is over.' },
    terms: ["RSI", "Overbought", "Oversold", "EMA"],
    glossary: [{"t": "Divergence", "d": "When price makes a new high or low but the indicator does not, a sign the move is losing strength."}],
    example: {"title": "Overbought is not a sell signal", "steps": ["DEMO rallies from $20 to $24 in eight days and RSI(14) reads 78.", "You feel like shorting because RSI is above 70. First you check the trend: higher highs, and price above the 48 EMA.", "RSI stays between 70 and 82 for six more days while price climbs to $26.", "Then price makes a new high at $26.40 but RSI only reaches 66, lower than before. That divergence is a warning.", "You tighten the stop on your long to $25.60 instead of shorting."], "result": "RSI helped you manage the trade. Shorting at 78 would have cost $2 a share."},
    mistakes: ["Shorting the moment RSI crosses 70 in a strong uptrend.", "Buying every reading under 30 in a stock that keeps falling.", "Shortening the period to get more signals, which mostly adds noise."],
  });

  L({
    id: 'l-volatility', course: 'indicators', order: 5, title: 'Volatility & expected move', mins: 5, level: 'Intermediate',
    summary: 'How far a stock tends to move, in dollars.',
    idea: 'Volatility measures how much price swings. Options turn it into an expected move: the range price lands in about two times out of three.',
    widget: 'expectedMove', opts: {},
    try: 'Set a price, an implied volatility and a number of days. The cone shows the expected range.',
    body: [
      '<p><b>Volatility</b> is the size of a stock’s typical swings. Calm stocks move in small ranges. Volatile stocks can move several percent in a single day.</p>',
      '<p><b>ATR</b> (average true range) measures volatility in dollars: the average high-to-low range of the last 14 candles. Traders use it for stops, because a stop tighter than one ATR often gets hit by normal noise.</p>',
      '<p><b>IV</b> (implied volatility) is the yearly move that option prices imply. The <b>expected move</b> is price × IV × √(days ÷ 365). Price ends inside that range roughly 68% of the time, so about one time in three it ends outside.</p>',
    ],
    points: ['ATR = the typical range in dollars. Use it to size stops.', 'IV = the yearly move options are pricing in.', 'Expected move = price × IV × √(days ÷ 365).', 'About 1 time in 3, price ends outside the 1σ range.'],
    quiz: { q: 'A $100 stock has an IV of 36%. Roughly how big is the expected move over one year?', options: ['±$3.60', '±$36', '±$100'], answer: 1, why: 'Over one year the expected move is simply price × IV: $100 × 0.36 = $36.' },
    terms: ["Volatility", "ATR", "IV", "Expected move", "Position size"],
    example: {"title": "Sizing a stop with ATR and IV", "steps": ["DEMO trades at $80. Its 14-day ATR is $2.40, so a normal day covers about $2.40 from high to low.", "A stop $0.50 away would sit inside normal noise, so you place it 1 ATR away, at $77.60.", "With a $20,000 account and 1% risk ($200), you can buy $200 ÷ $2.40 = 83 shares.", "Options price DEMO at 30% IV. Over 30 days the expected move is $80 × 0.30 × √(30 ÷ 365) ≈ $6.88.", "So the market expects DEMO to end the month between about $73 and $87, roughly two times out of three."], "result": "ATR set the stop and the size. IV told you how big a month could be."},
    mistakes: ["Using the same dollar stop on a calm stock and a wild one.", "Treating the expected move as a promise. Price ends outside it about one time in three.", "Forgetting that IV usually jumps before earnings and drops right after."],
  });
})();
