/* Stock Market Lessons: core library. Everything hangs off window.SML. */
(function () {
  'use strict';
  const SML = (window.SML = window.SML || {});
  SML.widgets = SML.widgets || {};   // name -> function(root, opts)
  SML.lessons = SML.lessons || [];   // lesson objects (modules push)
  SML.posts = SML.posts || [];       // blog posts (mod-play pushes)
  SML.pages = SML.pages || {};       // route token -> function(viewEl, token)
  SML.tools = SML.tools || [];
  SML.glossary = SML.glossary || [];

  /* ---------------- DOM + misc ---------------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  SML.$ = $; SML.$$ = $$;
  SML.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let _uid = 0;
  SML.uid = (p) => (p || 'u') + '-' + (++_uid);
  const R1 = (v) => Math.round(v * 10) / 10;
  SML.R1 = R1;
  SML.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SML.lerp = (a, b, t) => a + (b - a) * t;
  SML.reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /* linear scale: f(v) -> pixel, f.inv(px) -> value */
  SML.lin = function (d0, d1, r0, r1) {
    const f = (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
    f.inv = (p) => d0 + ((p - r0) / (r1 - r0 || 1)) * (d1 - d0);
    f.d = [d0, d1]; f.r = [r0, r1];
    return f;
  };
  /* "nice" tick values between min and max */
  SML.ticks = function (min, max, count) {
    count = count || 5;
    const span = max - min || 1;
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v / step) * step);
    return out;
  };

  /* ---------------- seeded random ---------------- */
  SML.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const r = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  };

  /* ---------------- indicators ---------------- */
  SML.ind = {
    sma(a, n) { const out = []; let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= n) s -= a[i - n]; out.push(i >= n - 1 ? s / n : null); } return out; },
    ema(a, n) { const k = 2 / (n + 1); const out = []; let e = a[0]; for (let i = 0; i < a.length; i++) { e = i === 0 ? a[0] : e + k * (a[i] - e); out.push(e); } return out; },
    rsi(a, n) {
      n = n || 14; const out = new Array(a.length).fill(null); if (a.length <= n) return out;
      let g = 0, l = 0;
      for (let i = 1; i <= n; i++) { const d = a[i] - a[i - 1]; if (d > 0) g += d; else l -= d; }
      g /= n; l /= n; out[n] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
      for (let i = n + 1; i < a.length; i++) { const d = a[i] - a[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
      return out;
    },
    /* candles: [{o,h,l,c,v}] -> running VWAP array */
    vwap(c) { let pv = 0, vv = 0; return c.map((k) => { const tp = (k.h + k.l + k.c) / 3; pv += tp * k.v; vv += k.v; return vv ? pv / vv : tp; }); },
    atr(c, n) { n = n || 14; const tr = c.map((k, i) => (i === 0 ? k.h - k.l : Math.max(k.h - k.l, Math.abs(k.h - c[i - 1].c), Math.abs(k.l - c[i - 1].c)))); return SML.ind.sma(tr, Math.min(n, tr.length)); },
    closes(c) { return c.map((k) => k.c); },
  };

  /* ---------------- price data generators ---------------- */
  SML.data = {
    /* random walk of closes */
    walk(seed, n, o) {
      o = o || {}; const r = SML.rng(seed); let p = o.start != null ? o.start : 100; const out = [p];
      const vol = o.vol != null ? o.vol : 0.5, drift = o.drift || 0;
      for (let i = 1; i < n; i++) { p = p + drift + r.gauss() * vol; out.push(p); }
      return out;
    },
    /* closes passing near anchor points [[index, price], ...]; noise is smoothed so it looks like real tape */
    path(anchors, n, seed, noise) {
      const r = SML.rng(seed || 7); noise = noise == null ? 0.25 : noise;
      const pts = anchors.slice().sort((a, b) => a[0] - b[0]);
      const base = [];
      for (let i = 0; i < n; i++) {
        let j = 0; while (j < pts.length - 2 && i > pts[j + 1][0]) j++;
        const [i0, p0] = pts[j], [i1, p1] = pts[Math.min(j + 1, pts.length - 1)];
        const t = i1 === i0 ? 0 : SML.clamp((i - i0) / (i1 - i0), 0, 1);
        base.push(p0 + (p1 - p0) * t);
      }
      let e = 0; const out = [];
      for (let i = 0; i < n; i++) { e = e * 0.55 + r.gauss() * noise; const pin = pts.some((a) => a[0] === i) ? 0.25 : 1; out.push(base[i] + e * pin); }
      return out;
    },
    /* closes -> OHLCV candles. o.vol: base volume, o.boost: {index: multiplier}, o.wick: wick size */
    candles(closes, seed, o) {
      o = o || {}; const r = SML.rng((seed || 3) + 101);
      const wick = o.wick != null ? o.wick : 0.22, baseV = o.vol || 100, boost = o.boost || {};
      let avgMove = 0; for (let i = 1; i < closes.length; i++) avgMove += Math.abs(closes[i] - closes[i - 1]); avgMove = avgMove / Math.max(1, closes.length - 1) || 0.1;
      return closes.map((c, i) => {
        const op = i === 0 ? (o.open != null ? o.open : c - r.gauss() * avgMove * 0.6) : closes[i - 1] + r.gauss() * avgMove * 0.08;
        const hi = Math.max(op, c) + Math.abs(r.gauss()) * wick * avgMove * 2.2;
        const lo = Math.min(op, c) - Math.abs(r.gauss()) * wick * avgMove * 2.2;
        const shape = o.shape ? o.shape(i, closes.length) : 1;
        const v = baseV * shape * (0.65 + 0.7 * Math.abs(c - op) / avgMove) * Math.exp(r.gauss() * 0.25) * (boost[i] || 1);
        return { o: op, h: hi, l: lo, c: c, v: Math.max(1, v) };
      });
    },
    /* merge k candles into one */
    aggregate(c, k) { const out = []; for (let i = 0; i < c.length; i += k) { const g = c.slice(i, i + k); out.push({ o: g[0].o, h: Math.max(...g.map((x) => x.h)), l: Math.min(...g.map((x) => x.l)), c: g[g.length - 1].c, v: g.reduce((s, x) => s + x.v, 0), t: g[0].t }); } return out; },
    /* U-shaped intraday volume curve, i of n */
    uShape(i, n) { const u = (i - n / 2) / (n / 2); return 0.55 + 1.5 * u * u + (i < 3 ? 1.2 - i * 0.35 : 0); },
    /* A full trading day.
       returns { prev:{o,h,l,c}, pre:[candles], day:[candles], pdh, pdl, pmh, pml, kind, tf }
       candle.t = minutes from 9:30 ET (premarket negative). Regular bars are 2-minute bars. */
    session(seed, o) {
      o = o || {}; const r = SML.rng(seed); const n = o.bars || 100;
      const pc = 100; const pdh = pc + r.range(2.2, 3.6), pdl = pc - r.range(1.8, 3.0);
      const prevClose = pc + r.range(-0.6, 0.9);
      // premarket 40 bars (8-min bars 4:00 -> 9:20)
      const gap = r.range(-0.6, 1.4);
      const preC = SML.data.path([[0, prevClose], [10, prevClose + gap * 0.4 + r.range(-0.4, 0.4)], [22, prevClose + gap + r.range(0.3, 0.9)], [32, prevClose + gap - r.range(0.2, 0.8)], [39, prevClose + gap]], 40, seed + 1, 0.12);
      const pre = SML.data.candles(preC, seed + 2, { vol: 18, wick: 0.3, open: prevClose }).map((k, i) => Object.assign(k, { t: -330 + i * 8 + 0 }));
      const pmh = Math.max(...pre.map((k) => k.h)), pml = Math.min(...pre.map((k) => k.l));
      const open = pre[pre.length - 1].c + r.range(-0.15, 0.15);
      const kind = o.kind || r.pick(['trend-up', 'trend-up', 'fake-out', 'trend-down', 'range']);
      let A;
      if (kind === 'trend-up') A = [[0, open], [6, open - r.range(0.2, 0.7)], [13, pmh + 0.35], [19, pmh + 0.05], [34, pmh + r.range(1.0, 1.8)], [44, pmh + r.range(0.6, 1.1)], [70, Math.max(pdh - 0.2, pmh + 1.6)], [82, pdh + r.range(-0.4, 0.3)], [n - 1, pdh - r.range(0.2, 0.9)]];
      else if (kind === 'trend-down') A = [[0, open], [7, open + r.range(0.2, 0.6)], [14, pml - 0.3], [20, pml - 0.05], [38, pml - r.range(1.0, 1.7)], [48, pml - r.range(0.5, 0.9)], [74, Math.min(pdl + 0.3, pml - 1.6)], [n - 1, pdl + r.range(-0.2, 0.6)]];
      else if (kind === 'fake-out') A = [[0, open], [8, pmh + 0.25], [12, pmh - 0.3], [20, open - r.range(0.6, 1.2)], [36, pml + 0.1], [50, pml - 0.7], [70, pml - r.range(1.0, 1.6)], [n - 1, pml - r.range(0.4, 1.1)]];
      else A = [[0, open], [10, pmh - 0.1], [22, pml + 0.2], [36, pmh - 0.2], [50, pml + 0.3], [64, (pmh + pml) / 2 + 0.2], [80, pmh - 0.25], [n - 1, (pmh + pml) / 2]];
      const closes = SML.data.path(A, n, seed + 3, 0.16);
      const boost = {}; if (kind === 'trend-up') { boost[12] = 2.6; boost[13] = 2.0; } if (kind === 'trend-down') { boost[13] = 2.6; boost[14] = 1.9; } if (kind === 'fake-out') { boost[18] = 1.8; boost[19] = 1.6; }
      const day = SML.data.candles(closes, seed + 4, { vol: 100, open: open, boost: boost, shape: SML.data.uShape }).map((k, i) => Object.assign(k, { t: i * 2 }));
      return { prev: { o: pc, h: pdh, l: pdl, c: prevClose }, pre, day, pdh, pdl, pmh, pml, kind, tf: 2 };
    },
  };

  /* ---------------- options math (Black-Scholes) ---------------- */
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  SML.ncdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  SML.npdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  /* S stock, K strike, days to expiry, iv as decimal (0.30), r rate decimal, type 'call'|'put'.
     returns per-share {price, delta, gamma, theta (per day), vega (per 1 vol point), prob (ITM at expiry), intrinsic, time} */
  SML.bs = function (S, K, days, iv, r, type) {
    r = r == null ? 0.04 : r; type = type || 'call';
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    const T = Math.max(days, 0) / 365;
    if (T <= 1e-6 || iv <= 1e-6) {
      const itm = type === 'call' ? S > K : S < K;
      return { price: intrinsic, delta: itm ? (type === 'call' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, prob: itm ? 1 : 0, intrinsic, time: 0 };
    }
    const sq = Math.sqrt(T); const d1 = (Math.log(S / K) + (r + iv * iv / 2) * T) / (iv * sq); const d2 = d1 - iv * sq;
    const disc = Math.exp(-r * T); const nd1 = SML.npdf(d1);
    let price, delta, theta, prob;
    if (type === 'call') { price = S * SML.ncdf(d1) - K * disc * SML.ncdf(d2); delta = SML.ncdf(d1); theta = (-S * nd1 * iv / (2 * sq) - r * K * disc * SML.ncdf(d2)) / 365; prob = SML.ncdf(d2); }
    else { price = K * disc * SML.ncdf(-d2) - S * SML.ncdf(-d1); delta = SML.ncdf(d1) - 1; theta = (-S * nd1 * iv / (2 * sq) + r * K * disc * SML.ncdf(-d2)) / 365; prob = SML.ncdf(-d2); }
    const gamma = nd1 / (S * iv * sq); const vega = (S * nd1 * sq) / 100;
    return { price: Math.max(price, 0), delta, gamma, theta, vega, prob, intrinsic, time: Math.max(0, price - intrinsic) };
  };

  /* ---------------- formatting ---------------- */
  const MINUS = '−';
  const num = (v, d) => Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  SML.fmt = {
    num: (v, d) => (v < 0 ? MINUS : '') + num(v, d || 0),
    usd: (v, d) => (v < 0 ? MINUS : '') + '$' + num(v, d == null ? 2 : d),
    usd0: (v) => SML.fmt.usd(v, 0),
    susd: (v, d) => (v > 0 ? '+' : v < 0 ? MINUS : '') + '$' + num(v, d == null ? 2 : d),
    pct: (v, d) => (v < 0 ? MINUS : '') + num(v, d == null ? 1 : d) + '%',
    spct: (v, d) => (v > 0 ? '+' : v < 0 ? MINUS : '') + num(v, d == null ? 1 : d) + '%',
    R: (v, d) => (v > 0 ? '+' : v < 0 ? MINUS : '') + num(v, d == null ? 1 : d) + 'R',
    /* minutes from 9:30 ET -> clock */
    time(m) { let t = 570 + Math.round(m); const h = Math.floor(t / 60), mm = t % 60; const h12 = ((h + 11) % 12) + 1; return h12 + ':' + String(mm).padStart(2, '0'); },
    minus: MINUS,
  };

  /* ---------------- SVG string builders (coords rounded to 0.1) ---------------- */
  const esc = SML.esc;
  const S = (SML.svg = {
    /* full svg drawn 1:1 in pixels: width=W height=H */
    wrap: (W, H, label, body, cls) => `<svg viewBox="0 0 ${R1(W)} ${R1(H)}" width="${R1(W)}" height="${R1(H)}" role="img" aria-label="${esc(label)}"${cls ? ` class="${cls}"` : ''}>${body}</svg>`,
    /* scalable svg (decorative thumbnails): fills container width */
    box: (W, H, label, body, cls) => `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"${cls ? ` class="${cls}"` : ''}>${body}</svg>`,
    line: (x1, y1, x2, y2, cls) => `<line x1="${R1(x1)}" y1="${R1(y1)}" x2="${R1(x2)}" y2="${R1(y2)}" class="${cls || 's-line'}"/>`,
    rect: (x, y, w, h, cls, rx, extra) => `<rect x="${R1(x)}" y="${R1(y)}" width="${R1(Math.max(0, w))}" height="${R1(Math.max(0, h))}"${rx ? ` rx="${rx}"` : ''} class="${cls || ''}"${extra || ''}/>`,
    text: (x, y, s, cls, anchor, extra) => `<text x="${R1(x)}" y="${R1(y)}"${cls ? ` class="${cls}"` : ''}${anchor && anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${extra || ''}>${s}</text>`,
    poly: (pts, cls, extra) => `<polyline points="${pts.filter((p) => p && isFinite(p[1])).map((p) => R1(p[0]) + ',' + R1(p[1])).join(' ')}" class="nf ${cls || 's-ink'}"${extra || ''}/>`,
    polygon: (pts, cls, extra) => `<polygon points="${pts.map((p) => R1(p[0]) + ',' + R1(p[1])).join(' ')}" class="${cls || ''}"${extra || ''}/>`,
    path: (d, cls, extra) => `<path d="${d}" class="${cls || ''}"${extra || ''}/>`,
    circle: (cx, cy, r, cls, extra) => `<circle cx="${R1(cx)}" cy="${R1(cy)}" r="${r}" class="${cls || ''}"${extra || ''}/>`,
    /* filled area between a polyline and baseline y */
    area: (pts, baseY, cls, extra) => { const p = pts.filter((q) => q && isFinite(q[1])); if (!p.length) return ''; return `<polygon points="${R1(p[0][0])},${R1(baseY)} ${p.map((q) => R1(q[0]) + ',' + R1(q[1])).join(' ')} ${R1(p[p.length - 1][0])},${R1(baseY)}" class="${cls || 'f-acc-t'}"${extra || ''}/>`; },
    arrow(x1, y1, x2, y2, col, hs, dash) {
      col = col || 'ink'; hs = hs || 7; const a = Math.atan2(y2 - y1, x2 - x1);
      const lx = x2 - hs * 0.7 * Math.cos(a), ly = y2 - hs * 0.7 * Math.sin(a);
      const p2 = [x2 - hs * Math.cos(a) + hs * 0.5 * Math.sin(a), y2 - hs * Math.sin(a) - hs * 0.5 * Math.cos(a)];
      const p3 = [x2 - hs * Math.cos(a) - hs * 0.5 * Math.sin(a), y2 - hs * Math.sin(a) + hs * 0.5 * Math.cos(a)];
      return S.line(x1, y1, lx, ly, `s-${col} w15${dash ? ' dash' : ''}`) + S.polygon([[x2, y2], p2, p3], `f-${col}`);
    },
    badge: (x, y, n, cls) => S.circle(x, y, 9, cls || 'f-acc') + S.text(x, y + 3.8, n, 'badge', 'middle'),
    /* candles: data [{o,h,l,c}], xf(i)->center x, bw body width, yf(price)->y. o: {from,to,cls,dim:Set of indices to fade, hi:Set to outline} */
    candles(data, xf, bw, yf, o) {
      o = o || {}; let s = ''; const from = o.from || 0, to = o.to == null ? data.length : o.to;
      for (let i = from; i < to; i++) {
        const k = data[i]; if (!k) continue; const x = xf(i); const kk = k.c >= k.o ? 'up' : 'dn';
        const t = yf(Math.max(k.o, k.c)), b = yf(Math.min(k.o, k.c));
        const ex = o.dim && o.dim.has(i) ? ' o35' : '';
        s += S.line(x, yf(k.h), x, yf(k.l), `wk ${kk}${ex}${o.cls ? ' ' + o.cls : ''}`);
        s += S.rect(x - bw / 2, t, bw, Math.max(1.4, b - t), `bd ${kk}${ex}${o.cls ? ' ' + o.cls : ''}`, bw > 6 ? 1 : 0);
      }
      return s;
    },
    /* volume bars from baseline up; o: {hi:Set (full opacity), maxV, from, to} */
    volume(data, xf, bw, base, h, o) {
      o = o || {}; const from = o.from || 0, to = o.to == null ? data.length : o.to;
      const maxV = o.maxV || Math.max(...data.slice(from, to).map((k) => k.v)) || 1; let s = '';
      for (let i = from; i < to; i++) { const k = data[i]; if (!k) continue; const vh = (k.v / maxV) * h; const hi = o.hi && o.hi.has(i); s += S.rect(xf(i) - bw / 2, base - vh, bw, vh, (k.c >= k.o ? 'f-up' : 'f-dn') + (hi ? '' : ' o35'), bw > 6 ? 1 : 0); }
      return s;
    },
    /* horizontal level with label at x1 + 6 */
    level(y, x0, x1, label, cls, lcls) { return S.line(x0, y, x1, y, (cls || 's-acc') + ' dash w15') + (label ? S.text(x1 + 6, y + 4, label, lcls || 'sm acc b') : ''); },
    hgrid(ys, x0, x1) { return ys.map((y) => S.line(x0, y, x1, y, 's-grid')).join(''); },
    /* price axis labels on the right */
    yaxis(vals, yf, x, fmtFn, cls) { return vals.map((v) => S.text(x, yf(v) + 4, fmtFn ? fmtFn(v) : v, cls || 'xs mono')).join(''); },
  });

  /* ---------------- UI helpers ---------------- */
  const ui = (SML.ui = {});
  ui._fmt = {};
  ui.F = {
    num: (v) => SML.fmt.num(v, 0), num1: (v) => SML.fmt.num(v, 1), num2: (v) => SML.fmt.num(v, 2),
    usd: (v) => SML.fmt.usd(v, 2), usd0: (v) => SML.fmt.usd(v, 0), pct: (v) => SML.fmt.num(v, 0) + '%', pct1: (v) => SML.fmt.num(v, 1) + '%',
    days: (v) => v + (Number(v) === 1 ? ' day' : ' days'), x: (v) => SML.fmt.num(v, 1) + '×', R: (v) => SML.fmt.num(v, 1) + 'R', yrs: (v) => v + (Number(v) === 1 ? ' year' : ' years'), bars: (v) => v + ' bars', plain: (v) => String(v),
  };
  /* slider HTML. o: {id,label,min,max,step,value,fmt:'usd'|fn} */
  ui.slider = function (o) {
    if (typeof o.fmt === 'function') ui._fmt[o.id] = o.fmt;
    const key = typeof o.fmt === 'string' ? o.fmt : 'num';
    const f = typeof o.fmt === 'function' ? o.fmt : ui.F[key] || ui.F.num;
    const p = ((o.value - o.min) / (o.max - o.min)) * 100;
    return `<label class="ctl" for="${o.id}"><span class="ctl-top"><span class="ctl-lab">${o.label}</span><output class="ctl-val" id="${o.id}-o" for="${o.id}">${f(o.value)}</output></span><input type="range" id="${o.id}" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${o.value}" data-fmt="${key}" style="--p:${p}%"></label>`;
  };
  /* segmented control HTML. opts: [{v,label}] or ['a','b'] */
  ui.seg = function (id, opts, value, label) {
    return `<div class="seg" id="${id}" role="group"${label ? ` aria-label="${esc(label)}"` : ''}>${opts.map((x) => { const v = typeof x === 'object' ? x.v : x, l = typeof x === 'object' ? x.label : x; return `<button type="button" data-v="${esc(v)}" class="${String(v) === String(value) ? 'on' : ''}" aria-pressed="${String(v) === String(value)}">${l}</button>`; }).join('')}</div>`;
  };
  /* toggle chips HTML. items: [{k,label,color:'var(--info)',on:true}] */
  ui.chips = function (id, items) {
    return `<div class="chips" id="${id}">${items.map((c) => `<button type="button" class="chip${c.on ? ' on' : ''}" data-k="${c.k}" aria-pressed="${!!c.on}"><i class="sw" style="--c:${c.color || 'var(--muted)'}"></i>${c.label}</button>`).join('')}</div>`;
  };
  ui.stat = (label, id, cls) => `<div class="stat ${cls || ''}"><span class="stat-l">${label}</span><span class="stat-v" id="${id}">—</span></div>`;
  ui.field = (o) => `<label class="fld" for="${o.id}"><span>${o.label}</span><input id="${o.id}" type="${o.type || 'number'}" inputmode="decimal" value="${o.value}"${o.step != null ? ` step="${o.step}"` : ' step="any"'}${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''}></label>`;
  ui.msg = (pillCls, pillText, html) => `<span class="pill ${pillCls || ''}">${pillText}</span><span>${html}</span>`;
  ui.check = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-up-t"/><path d="M5 9.4l2.6 2.6 5.4-5.8" class="nf s-up w2"/></svg>';
  ui.ticks = (items) => `<ul class="tick">${items.map((t) => `<li>${ui.check}<span>${t}</span></li>`).join('')}</ul>`;
  ui.setRange = function (el) { const p = ((el.value - el.min) / (el.max - el.min)) * 100; el.style.setProperty('--p', p + '%'); const out = document.getElementById(el.id + '-o'); if (out) { const f = ui._fmt[el.id] || ui.F[el.dataset.fmt] || ui.F.num; out.textContent = f(Number(el.value)); } };
  /* Wire every range / number / select / seg / chip inside root. onChange(evt) runs after any change.
     returns st: st.n(id) number value, st.seg(id) selected value, st.on(id,k) chip on?, st.set(id,v) set range/number */
  ui.wire = function (root, onChange) {
    const call = (e) => { try { onChange && onChange(e); } catch (err) { console.error(err); } };
    $$('input,select', root).forEach((el) => {
      el.addEventListener('input', (e) => { if (el.type === 'range') ui.setRange(el); call(e); });
      if (el.tagName === 'SELECT') el.addEventListener('change', call);
    });
    $$('.seg', root).forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !g.contains(b)) return; $$('button', g).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); call(e); }));
    $$('.chips', root).forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b || !g.contains(b)) return; const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); call(e); }));
    return {
      n: (id) => { const el = document.getElementById(id); return el ? Number(el.value) : NaN; },
      seg: (id) => { const b = $(`#${id} button.on`); return b ? b.dataset.v : null; },
      on: (id, k) => { const b = $(`#${id} .chip[data-k="${k}"]`); return !!(b && b.classList.contains('on')); },
      set: (id, v) => { const el = document.getElementById(id); if (!el) return; el.value = v; if (el.type === 'range') ui.setRange(el); },
      setSeg: (id, v) => { $$(`#${id} button`).forEach((x) => { const on = x.dataset.v === String(v); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); },
    };
  };
  /* Draw at true pixel size. Calls draw(W) now and whenever el's content width changes. Returns force-redraw fn. */
  ui.responsive = function (el, draw) {
    let lastW = -1;
    const go = (force) => {
      const cs = getComputedStyle(el);
      const W = Math.max(260, Math.floor(el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0)));
      if (force || W !== lastW) { lastW = W; try { draw(W); } catch (err) { console.error(err); } }
    };
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => requestAnimationFrame(() => go(false))); ro.observe(el); SML.onCleanup(() => ro.disconnect()); }
    go(true);
    return () => go(true);
  };
  /* pointer position in svg user units */
  ui.pt = function (svg, evt) { const p = svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY; const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 }; const q = p.matrixTransform(m.inverse()); return { x: q.x, y: q.y }; };
  /* drag helper on an element that is re-rendered: attach to a stable container (e.g. .wg-fig) and filter by selector.
     o: {sel:'.handle', start(pt, target, evt), move(pt, evt), end(evt)} ; pt in svg units of the svg under the container */
  ui.drag = function (container, o) {
    let active = null;
    container.addEventListener('pointerdown', (e) => {
      const t = o.sel ? e.target.closest(o.sel) : e.target; if (!t || !container.contains(t)) return;
      const svg = container.querySelector('svg'); if (!svg) return;
      active = { svg, t }; try { container.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault(); o.start && o.start(ui.pt(svg, e), t, e);
    });
    container.addEventListener('pointermove', (e) => { if (!active) return; const svg = container.querySelector('svg') || active.svg; o.move && o.move(ui.pt(svg, e), e); });
    const end = (e) => { if (!active) return; active = null; o.end && o.end(e); };
    container.addEventListener('pointerup', end); container.addEventListener('pointercancel', end);
  };

  /* module-specific CSS (use tokens only, prefix selectors with your module's class names) */
  SML.css = function (txt) { const s = document.createElement('style'); s.textContent = txt; document.head.appendChild(s); };

  /* ---------------- toast, copy, storage, cleanup ---------------- */
  let toastT = null;
  SML.toast = function (msg) {
    let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200);
  };
  /* call inside a click handler */
  SML.copy = function (text, okMsg) {
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); SML.toast(ok ? okMsg || 'Copied' : 'Copy blocked here. Select the table and press Ctrl+C.'); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => SML.toast(okMsg || 'Copied'), fallback); else fallback(); } catch (e) { fallback(); }
  };
  SML.store = {
    get(k, d) { try { const v = localStorage.getItem('sml:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sml:' + k, JSON.stringify(v)); } catch (e) {} },
  };
  let cleanups = [];
  SML.onCleanup = (fn) => cleanups.push(fn);
  SML.runCleanup = () => { const c = cleanups; cleanups = []; c.forEach((fn) => { try { fn(); } catch (e) {} }); };
  /* setInterval that stops on navigation */
  SML.every = (ms, fn) => { const h = setInterval(fn, ms); SML.onCleanup(() => clearInterval(h)); return h; };

  /* ---------------- progress ---------------- */
  SML.progress = {
    list: () => SML.store.get('done', []),
    isDone: (id) => SML.progress.list().indexOf(id) >= 0,
    set(id, on) { const l = SML.progress.list().filter((x) => x !== id); if (on) l.push(id); SML.store.set('done', l); document.dispatchEvent(new CustomEvent('sml:progress')); },
    count: () => SML.progress.list().filter((id) => SML.lessons.some((l) => l.id === id)).length,
  };

  /* ---------------- mounting widgets ---------------- */
  SML.mount = function (container) {
    $$('[data-widget]', container).forEach((el) => {
      if (el.dataset.mounted) return; el.dataset.mounted = '1';
      const name = el.dataset.widget; let opts = {};
      try { opts = el.dataset.opts ? JSON.parse(el.dataset.opts) : {}; } catch (e) {}
      el.classList.add('wg');
      const fn = SML.widgets[name];
      if (!fn) { el.innerHTML = `<div class="wg-note">This illustration is still being drawn.</div>`; return; }
      try { fn(el, opts); } catch (err) { console.error('widget ' + name, err); el.innerHTML = `<div class="wg-note">This illustration failed to load.</div>`; }
    });
  };
  SML.widgetHTML = (name, opts) => `<div class="wg" data-widget="${name}"${opts ? ` data-opts='${esc(JSON.stringify(opts))}'` : ''}></div>`;
})();
