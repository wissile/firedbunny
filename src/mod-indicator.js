/* Stock Market Lessons: TradingView indicator page, live preview widget and the Pine Script. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ------------------------------------------------------------------
     The Pine Script (version 5). Plain text; shown, copied and downloaded.
     ------------------------------------------------------------------ */
  const PINE = `//@version=5
// Stock Market Lessons: key levels, VWAP and an EMA ribbon in one indicator.
// Draws PDH, PDL, PMH, PML, session VWAP, the 13 / 48 / 200 EMAs,
// marks level breaks on strong volume and offers alerts for each one.
// Free for education. Not financial advice.
indicator("SML Levels: PDH PDL PMH PML + VWAP + EMAs", shorttitle = "SML Levels", overlay = true, max_labels_count = 50)

// ---------- Inputs
grpLv = "Key levels"
showPD   = input.bool(true, "Previous day high and low (PDH, PDL)", group = grpLv)
showPM   = input.bool(true, "Premarket high and low (PMH, PML)", group = grpLv, tooltip = "Turn on extended trading hours for the chart, or the premarket lines stay empty.")
lvlColor = input.color(#e8ad4f, "Level color", group = grpLv)
showTags = input.bool(true, "Name tags on the right", group = grpLv)

grpVw = "VWAP"
showVw  = input.bool(true, "Session VWAP", group = grpVw)
vwColor = input.color(#7c93f2, "VWAP color", group = grpVw)

grpMa = "Moving averages"
showE1 = input.bool(true, "Fast EMA", group = grpMa, inline = "e1")
lenE1  = input.int(13, "", minval = 1, group = grpMa, inline = "e1")
showE2 = input.bool(true, "Medium EMA", group = grpMa, inline = "e2")
lenE2  = input.int(48, "", minval = 1, group = grpMa, inline = "e2")
showE3 = input.bool(true, "Slow EMA", group = grpMa, inline = "e3")
lenE3  = input.int(200, "", minval = 1, group = grpMa, inline = "e3")

grpSg = "Signals"
showSig = input.bool(true, "Mark level breaks on strong volume", group = grpSg)
volMult = input.float(1.5, "Strong volume = times the 20-bar average", minval = 1.0, step = 0.1, group = grpSg)
showRsi = input.bool(false, "Mark RSI overbought and oversold", group = grpSg)
rsiLen  = input.int(14, "RSI length", minval = 2, group = grpSg)
rsiHigh = input.int(70, "RSI overbought", minval = 50, maxval = 100, group = grpSg)
rsiLow  = input.int(30, "RSI oversold", minval = 0, maxval = 50, group = grpSg)

// ---------- Previous day high and low (regular session, does not repaint)
rthTicker = ticker.modify(syminfo.tickerid, session.regular)
[pdh, pdl] = request.security(rthTicker, "D", [high[1], low[1]], lookahead = barmerge.lookahead_on)

// ---------- Premarket high and low (needs extended hours on the chart)
var float pmh = na
var float pml = na
if timeframe.change("D")
    pmh := na
    pml := na
if session.ispremarket
    pmh := na(pmh) ? high : math.max(pmh, high)
    pml := na(pml) ? low : math.min(pml, low)
inRegular = session.ismarket

// ---------- VWAP and EMAs
vwapLine = ta.vwap(hlc3)
e1 = ta.ema(close, lenE1)
e2 = ta.ema(close, lenE2)
e3 = ta.ema(close, lenE3)

plot(showPD ? pdh : na, "PDH", color = lvlColor, linewidth = 1, style = plot.style_linebr)
plot(showPD ? pdl : na, "PDL", color = lvlColor, linewidth = 1, style = plot.style_linebr)
plot(showPM and inRegular ? pmh : na, "PMH", color = color.new(lvlColor, 35), linewidth = 1, style = plot.style_linebr)
plot(showPM and inRegular ? pml : na, "PML", color = color.new(lvlColor, 35), linewidth = 1, style = plot.style_linebr)
plot(showVw ? vwapLine : na, "VWAP", color = vwColor, linewidth = 2)
plot(showE1 ? e1 : na, "Fast EMA", color = #b48cf2, linewidth = 1)
plot(showE2 ? e2 : na, "Medium EMA", color = #8b95a8, linewidth = 1)
plot(showE3 ? e3 : na, "Slow EMA", color = #e8edf5, linewidth = 2)

// ---------- Level breaks on strong volume
avgVol    = ta.sma(volume, 20)
strongVol = volume > avgVol * volMult
upPMH = ta.crossover(close, pmh)
dnPML = ta.crossunder(close, pml)
upPDH = ta.crossover(close, pdh)
dnPDL = ta.crossunder(close, pdl)
breakUp   = showSig and inRegular and strongVol and (upPMH or upPDH)
breakDown = showSig and inRegular and strongVol and (dnPML or dnPDL)
plotshape(breakUp, "Break up on volume", style = shape.triangleup, location = location.belowbar, color = #5fc28d, size = size.small)
plotshape(breakDown, "Break down on volume", style = shape.triangledown, location = location.abovebar, color = #e2685c, size = size.small)

// ---------- RSI extremes (optional)
rsi = ta.rsi(close, rsiLen)
rsiOver  = ta.crossover(rsi, rsiHigh)
rsiUnder = ta.crossunder(rsi, rsiLow)
plotshape(showRsi and rsiOver, "RSI overbought", style = shape.circle, location = location.abovebar, color = #b48cf2, size = size.tiny)
plotshape(showRsi and rsiUnder, "RSI oversold", style = shape.circle, location = location.belowbar, color = #b48cf2, size = size.tiny)

// ---------- Name tags on the last bar
tag(float y, string txt, color c) =>
    var label lb = na
    if barstate.islast
        label.delete(lb)
        lb := na
        if not na(y)
            lb := label.new(bar_index + 2, y, txt, style = label.style_label_left, color = color.new(c, 80), textcolor = c, size = size.small)
    lb

tag(showTags and showPD ? pdh : na, "PDH", lvlColor)
tag(showTags and showPD ? pdl : na, "PDL", lvlColor)
tag(showTags and showPM ? pmh : na, "PMH", lvlColor)
tag(showTags and showPM ? pml : na, "PML", lvlColor)
tag(showTags and showVw ? vwapLine : na, "VWAP", vwColor)

// ---------- Alerts (Create alert > Condition: SML Levels > pick one)
alertcondition(inRegular and strongVol and upPMH, "Broke premarket high", "{{ticker}} closed above the premarket high on strong volume. Wait for a retest.")
alertcondition(inRegular and strongVol and dnPML, "Lost premarket low", "{{ticker}} closed below the premarket low on strong volume.")
alertcondition(inRegular and strongVol and upPDH, "Broke previous day high", "{{ticker}} closed above the previous day high on strong volume.")
alertcondition(inRegular and strongVol and dnPDL, "Lost previous day low", "{{ticker}} closed below the previous day low on strong volume.")
alertcondition(ta.crossover(close, vwapLine), "Reclaimed VWAP", "{{ticker}} closed back above VWAP.")
alertcondition(ta.crossunder(close, vwapLine), "Lost VWAP", "{{ticker}} closed below VWAP.")
alertcondition(ta.crossover(e1, e2), "Fast EMA crossed above medium", "{{ticker}}: the fast EMA crossed above the medium EMA.")
alertcondition(ta.crossunder(e1, e2), "Fast EMA crossed below medium", "{{ticker}}: the fast EMA crossed below the medium EMA.")
`;
  SML.pine = PINE;

  /* tiny Pine highlighter */
  const KW = /\b(if|else|var|and|or|not|true|false|na|for|while|import|export)\b/g;
  const NS = /\b(input|ta|math|color|plot|plotshape|label|request|session|ticker|timeframe|barmerge|syminfo|shape|location|size|barstate|indicator|alertcondition|hlc3|high|low|close|volume|bar_index)\b/g;
  function hlLine(line) {
    let code = line, cm = '';
    const ci = (() => { let inS = false; for (let i = 0; i < line.length - 1; i++) { if (line[i] === '"') inS = !inS; if (!inS && line[i] === '/' && line[i + 1] === '/') return i; } return -1; })();
    if (ci >= 0) { code = line.slice(0, ci); cm = line.slice(ci); }
    const parts = code.split(/("[^"]*")/g).map((p, i) => {
      if (i % 2) return `<span class="pn-s">${esc(p)}</span>`;
      return esc(p).replace(/#[0-9a-fA-F]{6}\b/g, (m) => `<span class="pn-c">${m}</span>`).replace(/\b\d+(\.\d+)?\b/g, (m) => `<span class="pn-n">${m}</span>`).replace(KW, '<span class="pn-k">$1</span>').replace(NS, '<span class="pn-f">$1</span>');
    });
    return parts.join('') + (cm ? `<span class="pn-m">${esc(cm)}</span>` : '');
  }
  const codeHTML = () => PINE.replace(/\n$/, '').split('\n').map((l) => `<span class="ln">${hlLine(l) || ' '}</span>`).join('');

  SML.css(`
.ip-top{gap:10px 14px}
.ip-sym{font:600 12px var(--mono);letter-spacing:.12em;color:var(--ink)}
.ip-body{display:grid;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.ip-body{grid-template-columns:minmax(0,1fr) 264px}.ip-set{border-left:1px solid var(--line);border-top:0!important}}
.ip-body > .ip-set{border-top:1px solid var(--line)}
.ip-fig{cursor:crosshair}
.ip-set{background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:14px;min-width:0}
.ip-set h4{font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.18em;color:var(--accent);margin:0}
.ip-set .ip-g{display:flex;flex-direction:column;gap:9px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.ip-set .ip-g:last-child{border-bottom:0;padding-bottom:0}
.ip-row{display:flex;align-items:center;gap:10px;font-size:13.5px;color:color-mix(in srgb,var(--ink) 85%,transparent);cursor:pointer;min-width:0}
.ip-row span{flex:1 1 auto;min-width:0}
.ip-row input[type=checkbox]{appearance:none;-webkit-appearance:none;width:16px;height:16px;flex:0 0 16px;margin:0;border:1.5px solid var(--input);border-radius:3px;background:var(--bg);cursor:pointer;display:grid;place-content:center}
.ip-row input[type=checkbox]:checked{background:var(--accent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-6.5' fill='none' stroke='%231a1206' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/12px no-repeat;border-color:var(--accent)}
.ip-row input[type=number]{width:58px;flex:0 0 58px;font:500 13px var(--mono);color:var(--ink);background:var(--bg);border:1px solid var(--input);border-radius:4px;padding:4px 6px}
.ip-row i{width:12px;height:12px;border-radius:2px;flex:0 0 12px;background:var(--c)}
.ip-scrub{grid-template-columns:minmax(0,1fr) auto!important;align-items:end}
.ip-log{list-style:none;max-height:190px;overflow:auto}
.ip-log li{display:grid;grid-template-columns:64px 18px minmax(0,1fr);gap:10px;align-items:center;padding:9px 16px;font-size:13.5px;color:color-mix(in srgb,var(--ink) 85%,transparent)}
.ip-log li + li{border-top:1px dashed var(--line)}
.ip-log time{font:500 12px var(--mono);color:var(--muted)}
.ip-log .empty{grid-template-columns:1fr;color:var(--muted)}
.ip-loghead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px}
.code-win{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.code-win > .wg-bar{border-bottom:1px solid var(--line)}
.code{margin:0;padding:16px 0;background:var(--bg);font:500 12.5px/1.7 var(--mono);color:var(--ink);overflow:auto;max-height:560px;counter-reset:ln;tab-size:4}
.code .ln{display:block;padding:0 20px 0 0;white-space:pre}
.code .ln::before{counter-increment:ln;content:counter(ln);display:inline-block;width:44px;padding-right:16px;text-align:right;color:color-mix(in srgb,var(--muted) 55%,transparent);user-select:none;-webkit-user-select:none}
.pn-m{color:color-mix(in srgb,var(--muted) 85%,transparent);font-style:italic}
.pn-s{color:var(--up)} .pn-n{color:var(--accent)} .pn-k{color:var(--violet)} .pn-f{color:var(--info)} .pn-c{color:var(--accent)}
.ind-feat .tile svg.ind-mini{width:100%;height:auto;display:block;margin-bottom:4px;border:1px solid var(--line);border-radius:4px;background:var(--paper)}
.qa{border-top:1px solid var(--line)}
.qa details{border-bottom:1px solid var(--line)}
.qa summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 0;font-family:var(--display);font-size:28px;line-height:1;text-transform:uppercase;color:var(--ink)}
.qa summary::-webkit-details-marker{display:none}
.qa summary::after{content:"+";font:400 24px var(--mono);color:var(--accent)}
.qa details[open] summary::after{content:"−"}
.qa details p{padding:0 0 20px;max-width:70ch;line-height:1.7;color:color-mix(in srgb,var(--ink) 80%,transparent)}
`);

  /* ------------------------------------------------------------------
     Live preview: what the indicator draws on a simulated morning
     ------------------------------------------------------------------ */
  SML.widgets.indicatorPreview = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('ind');
    let seed = opts.seed || 41, sess, histC, timer = null, hoverI = null;
    const swatch = (c) => `<i style="--c:${c}"></i>`;
    const ck = (k, label, on, c) => `<label class="ip-row" for="${id}-${k}"><input type="checkbox" id="${id}-${k}"${on ? ' checked' : ''}>${c ? swatch(c) : ''}<span>${label}</span></label>`;
    root.innerHTML = `
      <div class="wg-bar ip-top"><span class="ip-sym">DEMO · 2m</span><span class="pill acc">SML Levels</span><span class="note">simulated prices</span><span class="grow"></span><button type="button" class="btn sm btn-g" data-a="new">New day</button></div>
      <div class="ip-body">
        <div class="wg-fig ip-fig"></div>
        <div class="ip-set" aria-label="Indicator settings">
          <div class="ip-g"><h4>Key levels</h4>${ck('pd', 'PDH and PDL', true, 'var(--accent)')}${ck('pm', 'PMH and PML', true, 'color-mix(in srgb,var(--accent) 60%,transparent)')}${ck('tags', 'Name tags', true)}</div>
          <div class="ip-g"><h4>VWAP</h4>${ck('vw', 'Session VWAP', true, 'var(--info)')}</div>
          <div class="ip-g"><h4>Moving averages</h4>
            <label class="ip-row" for="${id}-e1"><input type="checkbox" id="${id}-e1" checked>${swatch('var(--violet)')}<span>Fast EMA</span><input type="number" id="${id}-l1" value="13" min="2" max="100" aria-label="Fast EMA length"></label>
            <label class="ip-row" for="${id}-e2"><input type="checkbox" id="${id}-e2" checked>${swatch('var(--muted)')}<span>Medium EMA</span><input type="number" id="${id}-l2" value="48" min="2" max="150" aria-label="Medium EMA length"></label>
            <label class="ip-row" for="${id}-e3"><input type="checkbox" id="${id}-e3" checked>${swatch('var(--ink)')}<span>Slow EMA</span><input type="number" id="${id}-l3" value="200" min="2" max="250" aria-label="Slow EMA length"></label></div>
          <div class="ip-g"><h4>Signals</h4>${ck('sig', 'Level breaks on volume', true)}
            ${ui.slider({ id: id + '-vm', label: 'Strong volume', min: 1, max: 3, step: 0.1, value: 1.5, fmt: (v) => v.toFixed(1) + '× avg' })}
            ${ck('rsi', 'RSI 70 / 30 marks', false, 'var(--violet)')}</div>
        </div>
      </div>
      <div class="wg-ctrl ip-scrub">${ui.slider({ id: id + '-t', label: 'Time', min: 6, max: 100, step: 1, value: 100, fmt: (v) => F.time(v * 2) + ' ET' })}<button type="button" class="btn sm btn-p" data-a="play" style="min-width:132px"></button></div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="ip-loghead"><span class="wg-title">Alert log</span><span class="note">What your alerts would have sent</span></div>
      <ul class="ip-log" id="${id}-log"></ul>`;
    const fig = root.querySelector('.ip-fig');
    const st = ui.wire(root, () => draw());
    const on = (k) => { const el = document.getElementById(id + '-' + k); return !!(el && el.checked); };
    const len = (k, d) => { const v = Math.round(Number(document.getElementById(id + '-' + k).value)); return v >= 2 ? Math.min(v, 250) : d; };

    function newDay(s) {
      seed = s; sess = SML.data.session(seed, { bars: 100 });
      const pc = sess.pre[0].o;
      histC = SML.data.walk(seed + 99, 240, { start: pc - 2 + (seed % 5) * 0.6, vol: 0.18, drift: 0.008 });
      const shift = pc - histC[histC.length - 1]; histC = histC.map((v) => v + shift);
    }

    /* compute everything for bars up to day index t (exclusive) */
    function compute(t) {
      const pre = sess.pre, day = sess.day.slice(0, t);
      const bars = pre.concat(day);
      const closes = histC.concat(bars.map((k) => k.c));
      const off = histC.length;
      const ema = (n) => SML.ind.ema(closes, n).slice(off);
      const e1 = ema(len('l1', 13)), e2 = ema(len('l2', 48)), e3 = ema(len('l3', 200));
      const vw = SML.ind.vwap(bars);
      const rsi = SML.ind.rsi(closes, 14).slice(off);
      const vm = st.n(id + '-vm');
      const sig = [];
      const P = pre.length;
      for (let j = 0; j < day.length; j++) {
        const i = P + j, k = bars[i], pk = bars[i - 1];
        const from = Math.max(0, i - 20); let s = 0; for (let q = from; q < i; q++) s += bars[q].v; const avg = s / Math.max(1, i - from);
        const strong = k.v > avg * vm;
        const add = (kind, dir, text) => sig.push({ j, kind, dir, text, t: k.t + 2, ratio: k.v / avg });
        if (strong && on('sig')) {
          if (pk.c <= sess.pmh && k.c > sess.pmh) add('pmh', 'up', `Broke the premarket high on ${(k.v / avg).toFixed(1)}× volume`);
          if (pk.c <= sess.pdh && k.c > sess.pdh) add('pdh', 'up', `Broke the previous day high on ${(k.v / avg).toFixed(1)}× volume`);
          if (pk.c >= sess.pml && k.c < sess.pml) add('pml', 'dn', `Lost the premarket low on ${(k.v / avg).toFixed(1)}× volume`);
          if (pk.c >= sess.pdl && k.c < sess.pdl) add('pdl', 'dn', `Lost the previous day low on ${(k.v / avg).toFixed(1)}× volume`);
        }
        if (on('rsi') && rsi[i - 1] != null && rsi[i] != null) {
          if (rsi[i - 1] <= 70 && rsi[i] > 70) add('rsi', 'ob', 'RSI crossed above 70 (overbought)');
          if (rsi[i - 1] >= 30 && rsi[i] < 30) add('rsi', 'os', 'RSI crossed below 30 (oversold)');
        }
        if (on('vw') && j > 0 && pk.c < vw[i - 1] && k.c > vw[i]) add('vw', 'vwu', 'Reclaimed VWAP');
        if (on('vw') && j > 0 && pk.c > vw[i - 1] && k.c < vw[i]) add('vw', 'vwd', 'Lost VWAP');
      }
      return { bars, P, day, e1, e2, e3, vw, rsi, sig };
    }

    const draw = ui.responsive(fig, (W) => {
      if (!sess) return;
      const t = st.n(id + '-t');
      const C = compute(t);
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.6, 300, 460));
      const padR = compact ? 56 : 92, top = 12, volH = Math.round(H * 0.13), bot = 20;
      const plotB = H - bot - volH - 8;
      const preW = Math.round((W - padR) * (compact ? 0.14 : 0.16));
      const x0 = preW + 6, x1 = W - padR;
      const N = 100, slot = (x1 - x0) / N, bw = Math.max(1.4, Math.min(8, slot * 0.62));
      const xd = (j) => x0 + (j + 0.5) * slot;
      const xb = (i) => (i < C.P ? (i + 0.5) * (preW / C.P) : xd(i - C.P));
      const allP = sess.day.map((k) => [k.h, k.l]).flat().concat(sess.pre.map((k) => [k.h, k.l]).flat(), [sess.pdh, sess.pdl]);
      const yMax = Math.max(...allP) + 0.35, yMin = Math.min(...allP) - 0.35;
      const y = SML.lin(yMin, yMax, plotB, top);
      const inY = (v) => v != null && v >= yMin && v <= yMax;
      let b = '';
      SML.ticks(yMin, yMax, compact ? 4 : 6).forEach((v) => { b += S.line(0, y(v), x1, y(v), 's-grid'); });
      b += S.rect(0, top - 6, preW + 2, plotB - top + 10, 'f-shade', 0, ' opacity=".8"') + S.text(6, top + 8, compact ? 'PRE' : 'PREMARKET', 'cap');
      b += S.line(x0 - 3, top - 6, x0 - 3, H - bot, 's-mut dash2');
      // levels
      const tags = [];
      if (on('pd')) [['PDH', sess.pdh], ['PDL', sess.pdl]].forEach(([k, v]) => { b += S.line(0, y(v), x1, y(v), 's-acc w15'); tags.push({ k, v, cls: 'acc' }); });
      if (on('pm')) [['PMH', sess.pmh], ['PML', sess.pml]].forEach(([k, v]) => { b += S.line(x0, y(v), x1, y(v), 's-acc w15 dash o70'); tags.push({ k, v, cls: 'acc' }); });
      // emas
      const line = (arr, cls) => S.poly(arr.map((v, i) => (i < C.bars.length && inY(v) ? [xb(i), y(v)] : null)), cls);
      if (on('e3')) b += line(C.e3, 's-ink w25 o70');
      if (on('e2')) b += line(C.e2, 's-mut w15');
      if (on('e1')) b += line(C.e1, 's-vio w15');
      if (on('vw')) { b += line(C.vw, 's-info w25'); tags.push({ k: 'VWAP', v: C.vw[C.vw.length - 1], cls: 'info' }); }
      // volume
      const vb = H - bot; const maxV = Math.max(...sess.day.map((k) => k.v));
      b += S.volume(C.day, xd, bw, vb, volH, { maxV, hi: new Set(C.sig.filter((s) => s.kind !== 'rsi' && s.kind !== 'vw').map((s) => s.j)) });
      b += S.line(0, vb + 0.5, x1, vb + 0.5, 's-line');
      // candles
      b += S.candles(sess.pre, xb, Math.max(1, (preW / C.P) * 0.55), y, { cls: 'o70' });
      b += S.candles(C.day, xd, bw, y);
      // signals
      C.sig.forEach((s) => {
        const k = C.day[s.j], x = xd(s.j);
        if (s.dir === 'up') b += S.polygon([[x, y(k.l) + 6], [x - 6, y(k.l) + 16], [x + 6, y(k.l) + 16]], 'f-up');
        else if (s.dir === 'dn') b += S.polygon([[x, y(k.h) - 6], [x - 6, y(k.h) - 16], [x + 6, y(k.h) - 16]], 'f-dn');
        else if (s.dir === 'ob') b += S.circle(x, y(k.h) - 9, 3.5, 'f-vio');
        else if (s.dir === 'os') b += S.circle(x, y(k.l) + 9, 3.5, 'f-vio');
      });
      // last price + tags on the right (TradingView-style), spread apart so they never overlap
      const last = C.day[C.day.length - 1] || sess.pre[sess.pre.length - 1];
      const upD = last.c >= sess.day[0].o;
      if (C.day.length) b += S.line(xd(C.day.length - 1), y(last.c), x1, y(last.c), (upD ? 's-up' : 's-dn') + ' dash2');
      const items = (on('tags') ? tags : []).filter((q) => inY(q.v)).map((q) => ({ ...q, y: y(q.v) }));
      items.push({ k: '', v: last.c, cls: upD ? 'up' : 'dn', y: y(last.c), price: true });
      items.sort((a, c) => a.y - c.y);
      for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 17) items[i].y = items[i - 1].y + 17;
      for (let i = items.length - 2; i >= 0; i--) if (items[i].y > H - bot - 9) items[i].y = Math.min(items[i].y, items[i + 1].y - 17);
      items.forEach((q) => {
        const yy = SML.clamp(q.y, 9, H - bot - 9);
        const fill = q.price ? (q.cls === 'up' ? 'f-up' : 'f-dn') : q.cls === 'info' ? 'f-info-t s-info' : 'f-acc-t s-acc';
        const tc = q.price ? 'on' : q.cls;
        b += S.rect(x1 + 3, yy - 8, padR - 5, 16, fill, 2);
        b += S.text(x1 + 7, yy + 4, compact ? (q.k || q.v.toFixed(2)) : (q.k ? q.k + ' ' : '') + q.v.toFixed(2), `xs mono b ${tc}`);
      });
      // time axis
      (compact ? [0, 60, 120, 180] : [0, 30, 60, 90, 120, 150, 180]).forEach((m) => { const j = m / 2; if (j < N) b += S.text(xd(j), H - 5, F.time(m), 'xs mono', 'middle'); });
      // hover
      if (hoverI != null && hoverI < C.day.length) {
        const k = C.day[hoverI], hx = xd(hoverI), i = C.P + hoverI;
        b += S.line(hx, top - 6, hx, H - bot, 's-mut dash2');
        const parts = [`${F.time(k.t)}`, `C ${k.c.toFixed(2)}`, on('vw') ? `VWAP ${C.vw[i].toFixed(2)}` : '', C.rsi[i] != null ? `RSI ${C.rsi[i].toFixed(0)}` : ''].filter(Boolean);
        const txt = parts.join('   '); const tw = Math.min(W - 8, txt.length * 6.6 + 18); const tx = SML.clamp(hx - tw / 2, 2, W - tw - 2);
        b += S.rect(tx, top - 6, tw, 20, 'tipbg', 4) + S.text(tx + 9, top + 8, txt, 'sm mono ink');
      }
      fig.innerHTML = S.wrap(W, H, 'Simulated 2-minute chart with the indicator drawn: key levels, VWAP, three EMAs, volume and signal markers', b);
      fig._g = { x0, slot, len: C.day.length };
      readouts(C, last);
    });

    function readouts(C, last) {
      const ups = C.sig.filter((s) => s.dir === 'up').length, dns = C.sig.filter((s) => s.dir === 'dn').length, rs = C.sig.filter((s) => s.kind === 'rsi').length;
      const n = C.bars.length - 1; const e1 = C.e1[n], e2 = C.e2[n], e3 = C.e3[n];
      const trend = e1 > e2 && e2 > e3 ? ['Stacked up', 'up'] : e1 < e2 && e2 < e3 ? ['Stacked down', 'dn'] : ['Mixed', ''];
      const above = last.c >= C.vw[n];
      document.getElementById(id + '-read').innerHTML =
        `<div class="stat"><span class="stat-l">Breaks up</span><span class="stat-v up">${ups}</span></div>` +
        `<div class="stat"><span class="stat-l">Breaks down</span><span class="stat-v dn">${dns}</span></div>` +
        `<div class="stat"><span class="stat-l">RSI marks</span><span class="stat-v">${on('rsi') ? rs : 'Off'}</span></div>` +
        `<div class="stat"><span class="stat-l">Price vs VWAP</span><span class="stat-v ${above ? 'up' : 'dn'}">${above ? 'Above' : 'Below'}</span></div>` +
        `<div class="stat"><span class="stat-l">EMA ribbon</span><span class="stat-v ${trend[1]}">${trend[0]}</span></div>`;
      const lastSig = C.sig.filter((s) => s.kind !== 'vw').slice(-1)[0];
      const msg = document.getElementById(id + '-msg');
      if (!C.day.length) msg.innerHTML = ui.msg('acc', 'Premarket', 'Before the open the indicator already shows PDH, PDL and the premarket range. Mark them and plan.');
      else if (lastSig && lastSig.dir === 'up') msg.innerHTML = ui.msg('up', 'Break up', `${lastSig.text} at ${F.time(lastSig.t)}. The lessons say: wait for a retest that holds before you buy.`);
      else if (lastSig && lastSig.dir === 'dn') msg.innerHTML = ui.msg('dn', 'Break down', `${lastSig.text} at ${F.time(lastSig.t)}. Watch for a weak bounce back to the level.`);
      else if (lastSig) msg.innerHTML = ui.msg('vio', 'RSI', `${lastSig.text} at ${F.time(lastSig.t)}. In a strong trend RSI can stay there; treat it as a warning, not a signal.`);
      else msg.innerHTML = ui.msg('info', 'Quiet', `No level broke on strong volume yet. Price is ${above ? 'above' : 'below'} VWAP and the ribbon is ${trend[0].toLowerCase()}.`);
      const log = C.sig.slice().reverse();
      document.getElementById(id + '-log').innerHTML = log.length ? log.map((s) => {
        const icon = s.dir === 'up' ? '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2l5 9H2z" class="f-up"/></svg>' : s.dir === 'dn' ? '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 12L2 3h10z" class="f-dn"/></svg>' : s.kind === 'rsi' ? '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4" class="f-vio"/></svg>' : '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7h12" class="nf s-info w25"/></svg>';
        return `<li><time>${F.time(s.t)}</time>${icon}<span>DEMO: ${esc(s.text)}</span></li>`;
      }).join('') : '<li class="empty">No alerts would have fired yet. Lower the strong-volume setting or move the time slider.</li>';
    }

    fig.addEventListener('pointermove', (e) => { const svg = fig.querySelector('svg'); const g = fig._g; if (!svg || !g) return; const p = ui.pt(svg, e); const j = Math.floor((p.x - g.x0) / g.slot); const n = j >= 0 && j < g.len ? j : null; if (n !== hoverI) { hoverI = n; draw(); } });
    fig.addEventListener('pointerleave', () => { if (hoverI != null) { hoverI = null; draw(); } });

    const playBtn = $('[data-a="play"]', root);
    const setPlay = () => { playBtn.innerHTML = timer ? '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="3.5" height="11" style="fill:currentColor"/><rect x="9.5" y="2.5" width="3.5" height="11" style="fill:currentColor"/></svg>Pause' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5l9 5.5-9 5.5z" style="fill:currentColor"/></svg>Play the day'; };
    const stop = () => { if (timer) clearInterval(timer); timer = null; setPlay(); };
    function play() {
      if (timer) return stop();
      if (st.n(id + '-t') >= 100) st.set(id + '-t', 6);
      if (SML.reduced()) { st.set(id + '-t', 100); draw(); return; }
      timer = setInterval(() => { const v = st.n(id + '-t'); if (v >= 100) { stop(); return; } st.set(id + '-t', v + 1); draw(); }, 140);
      setPlay(); draw();
    }
    SML.onCleanup(stop);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return;
      if (b.dataset.a === 'play') play();
      if (b.dataset.a === 'new') { stop(); newDay(seed + 13); st.set(id + '-t', 100); draw(); }
    });
    $('#' + id + '-t', root).addEventListener('input', () => { if (timer) stop(); });
    newDay(seed); setPlay(); draw();
  };

  /* ------------------------------------------------------------------
     Page
     ------------------------------------------------------------------ */
  function mini(kind) {
    const W = 300, H = 90; let b = '';
    const p = SML.data.path([[0, 100], [10, 99.4], [18, 101.2], [26, 100.8], [40, 102.4]], 41, kind.length * 7 + 3, 0.12);
    const x = SML.lin(0, 40, 8, W - 8), y = SML.lin(98.6, 103, H - 8, 8);
    const c = SML.data.candles(p, 5, { wick: 0.25 });
    if (kind === 'levels') { b += S.line(0, y(102.2), W, y(102.2), 's-acc w15') + S.line(0, y(100.4), W, y(100.4), 's-acc w15 dash o70') + S.line(0, y(99.2), W, y(99.2), 's-acc w15'); }
    if (kind === 'vwap') b += S.poly(SML.ind.vwap(c).map((v, i) => [x(i), y(v)]), 's-info w25');
    if (kind === 'ema') { b += S.poly(SML.ind.ema(p, 18).map((v, i) => [x(i), y(v)]), 's-ink w25 o70') + S.poly(SML.ind.ema(p, 9).map((v, i) => [x(i), y(v)]), 's-mut w15') + S.poly(SML.ind.ema(p, 3).map((v, i) => [x(i), y(v)]), 's-vio w15'); }
    b += S.candles(c, x, 4, y, kind === 'levels' || kind === 'vwap' || kind === 'ema' ? {} : { cls: 'o70' });
    if (kind === 'break') { b += S.line(0, y(101.3), W, y(101.3), 's-acc w15 dash'); b += S.polygon([[x(18), y(c[18].l) + 4], [x(18) - 5, y(c[18].l) + 13], [x(18) + 5, y(c[18].l) + 13]], 'f-up'); }
    if (kind === 'rsi') { b += S.circle(x(19), y(c[19].h) - 7, 3.2, 'f-vio') + S.circle(x(9), y(c[9].l) + 7, 3.2, 'f-vio'); }
    if (kind === 'alert') { b += S.rect(W - 132, 10, 122, 34, 'f-surf s-line', 4) + S.text(W - 122, 24, 'ALERT · 9:52', 'xs mono b acc') + S.text(W - 122, 37, 'Broke PMH, 2.4× vol', 'xs ink'); }
    return S.box(W, H, 'Miniature of what the indicator draws', b, 'ind-mini');
  }

  SML.pages.indicator = function (view) {
    const feats = [
      ['levels', 'Key levels', 'PDH and PDL from the regular session, plus the premarket high and low. Name tags sit on the right edge.', 'l-levels'],
      ['vwap', 'Session VWAP', 'The volume-weighted average price for the day, so you always know which side buyers and sellers are on.', 'l-vwap'],
      ['ema', '13 / 48 / 200 EMA', 'Fast, medium and slow averages. Stacked in order means a clean trend; tangled means chop.', 'l-ema-stack'],
      ['break', 'Breaks on volume', 'A green or red triangle when price closes through a level on volume above your multiple of the 20-bar average.', 'l-breakouts'],
      ['rsi', 'RSI extremes', 'Optional dots when RSI crosses above 70 or below 30. A warning, never a trigger on its own.', 'l-rsi'],
      ['alert', 'Eight alerts', 'Level breaks, VWAP reclaims and losses, and EMA crosses, ready to pick in the alert dialog.', 'l-game-plan'],
    ];
    const settings = [
      ['PDH and PDL', 'On', 'Previous day high and low from the regular session. Uses the prior day only, so the lines never repaint.'],
      ['PMH and PML', 'On', 'High and low traded before 9:30 ET. Shows only when extended trading hours are on for the chart.'],
      ['Level color', 'Amber', 'Color of the four level lines and their tags.'],
      ['Name tags', 'On', 'Small labels at the right edge so you can read each line at a glance.'],
      ['Session VWAP', 'On', 'Resets every session. With extended hours on, it starts at the 4:00 ET premarket open.'],
      ['Fast / medium / slow EMA', '13 / 48 / 200', 'Turn each one on or off and change its length.'],
      ['Level breaks on volume', 'On, 1.5×', 'Marks a close through a level when volume beats this multiple of the 20-bar average.'],
      ['RSI marks', 'Off, 14 · 70 · 30', 'Dots when RSI crosses its overbought or oversold line.'],
    ];
    const alerts = ['Broke premarket high', 'Lost premarket low', 'Broke previous day high', 'Lost previous day low', 'Reclaimed VWAP', 'Lost VWAP', 'Fast EMA crossed above medium', 'Fast EMA crossed below medium'];
    const lines = PINE.split('\n').length;
    view.innerHTML = `
      ${SML.pageHeader('', 'TradingView indicator', 'Every lesson, <em>on your chart</em>.', `<p>A free Pine Script indicator that draws what the lessons teach: the four key levels, VWAP, the 13 / 48 / 200 EMA ribbon, volume breaks and alerts. Paste it into TradingView in two minutes.</p><div class="cta-row"><button type="button" class="btn btn-p" data-copy>Copy the Pine Script</button><button type="button" class="btn btn-g" data-go="ind-install">How to install</button></div>`)}
      <section class="chapter" style="padding-top:40px" aria-labelledby="ind-live"><div class="wrap">
        ${SML.chapHead('', 'See it before you install it', 'A simulated morning with the indicator on. Flip the settings, press Play the day and watch the alert log fill.', '', 'ind-live')}
        ${SML.widgetHTML('indicatorPreview')}
      </div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="ind-what"><div class="wrap">
        ${SML.chapHead('01', 'What it draws', 'Six things from the lessons, in one indicator.', '', 'ind-what')}
        <ul class="tiles t3 ind-feat">${feats.map((f) => `<li><a class="tile" href="#${f[3]}">${mini(f[0])}<span class="tile-t">${f[1]}</span><span class="tile-p">${f[2]}</span><span class="more" style="margin-top:auto">Lesson ${SML.icons.arrow}</span></a></li>`).join('')}</ul>
      </div></section>
      <section class="chapter" style="padding-top:0" id="ind-install" aria-labelledby="ind-inst"><div class="wrap">
        ${SML.chapHead('02', 'Install in two minutes', 'Works in any browser or the TradingView desktop app.', '', 'ind-inst')}
        <ol class="tiles t4">${[
          ['Open a chart', 'Open a stock on a 1, 2 or 5-minute chart. In chart settings turn on extended trading hours so the premarket lines can draw.'],
          ['Open the Pine Editor', 'Click Pine Editor at the bottom of the chart. Start a new blank indicator and delete the sample code.'],
          ['Paste and add', 'Paste the script below, press Save, then Add to chart. The levels, VWAP and EMAs appear right away.'],
          ['Set your alerts', 'Click Alert, choose SML Levels as the condition, pick one of the eight alerts and set it to fire once per bar close.'],
        ].map((s, i) => `<li><div class="tile"><span class="tile-n">${String(i + 1).padStart(2, '0')}</span><span class="tile-t">${s[0]}</span><span class="tile-p">${s[1]}</span></div></li>`).join('')}</ol>
      </div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="ind-code"><div class="wrap">
        ${SML.chapHead('03', 'The Pine Script', `Version 5, ${lines} lines. Free to use and change.`, '', 'ind-code')}
        <div class="code-win">
          <div class="wg-bar"><span class="sh-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="sh-file">sml-levels.pine</span><span class="grow"></span><button type="button" class="btn sm btn-g" data-dl hidden>Download .txt</button><button type="button" class="btn sm btn-p" data-copy>Copy code</button></div>
          <pre class="code scroll" tabindex="0" aria-label="Pine Script source code"><code>${codeHTML()}</code></pre>
        </div>
      </div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="ind-set"><div class="wrap">
        ${SML.chapHead('04', 'Settings', 'Everything you can change from the indicator’s settings panel.', '', 'ind-set')}
        <div class="scroll" style="border:1px solid var(--line);border-radius:var(--r)"><table class="tbl" style="min-width:620px"><thead><tr><th>Setting</th><th>Default</th><th>What it does</th></tr></thead><tbody>${settings.map((r) => `<tr><td><b>${r[0]}</b></td><td class="mono" style="white-space:nowrap;color:var(--accent)">${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
      </div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="ind-al"><div class="wrap">
        ${SML.chapHead('05', 'Alerts you can set', 'Pick any of these in TradingView’s alert dialog. Each one sends the ticker and what happened.', '', 'ind-al')}
        <ol class="tiles t4">${alerts.map((a, i) => `<li><div class="tile"><span class="tag" style="align-self:flex-start">Alert ${String(i + 1).padStart(2, '0')}</span><span class="tile-t">${a}</span></div></li>`).join('')}</ol>
      </div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="ind-qa"><div class="wrap">
        ${SML.chapHead('', 'Questions', '', '', 'ind-qa')}
        <div class="qa">
          <details><summary>Does it repaint?</summary><p>The previous day high and low come from the prior finished day, so those lines never move. Premarket levels finish forming at 9:30. Signals are decided at the close of each bar, so set alerts to fire once per bar close and a mark never disappears after it fires.</p></details>
          <details><summary>Why are the premarket lines empty?</summary><p>TradingView only shows premarket bars when extended trading hours are turned on for the chart. Turn them on in chart settings. Symbols with no premarket session, like most futures and crypto, will not show PMH or PML.</p></details>
          <details><summary>Which chart timeframe should I use?</summary><p>The levels and VWAP work on any intraday timeframe. The lessons use the 15-minute chart to find levels and the 2-minute chart to time entries. On a daily chart the premarket lines and VWAP have no meaning.</p></details>
          <details><summary>Is it a buy and sell system?</summary><p>No. It draws the map the lessons teach and tells you when price reaches a spot worth watching. Your plan, your confirmation checklist and your stop still decide the trade.</p></details>
        </div>
        <p class="callout info" style="margin-top:28px">${SML.icons.info}<span>Stock Market Lessons is not affiliated with or endorsed by TradingView. TradingView is a trademark of its owner. The indicator is for education and is not financial advice.</span></p>
      </div></section>`;
    view.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => SML.copy(PINE, 'Pine Script copied. Paste it into the Pine Editor.')));
    view.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { const el = document.getElementById(b.dataset.go); if (el) el.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'start' }); }));
    const dlb = view.querySelector('[data-dl]');
    let dl = null;
    try { if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then((d) => { if (d && dlb.isConnected) { dl = d; dlb.hidden = false; } }).catch(() => {}); } catch (e) {}
    dlb.addEventListener('click', () => { if (!dl) return; dl.save({ filename: 'sml-levels.pine.txt', data: PINE }).then(() => SML.toast('Saved sml-levels.pine.txt')).catch((err) => { const c = err && err.code; if (c === 'declined') return; if (c === 'rate_limited') SML.toast('A save is already waiting for you.'); else { SML.toast('Downloads are not available here. Use Copy code instead.'); dlb.hidden = true; } }); });
    return 'TradingView indicator';
  };
})();
