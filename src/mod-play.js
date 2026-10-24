/* Stock Market Lessons: playground (trade replay), blog, spreadsheets, apps. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const MINUS = F.minus;
  const p2 = (v) => (v < 0 ? MINUS : '') + Math.abs(v).toFixed(2);
  const CROSS = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-dn-t"/><path d="M6 6l6 6M12 6l-6 6" class="nf s-dn w2"/></svg>';
  const DASHI = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-shade"/><path d="M5.5 9h7" class="nf s-mut w2"/></svg>';
  const fmtDate = (iso) => { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
  const FALLBACK = { 'l-levels': 'PDH, PDL, PMH, PML', 'l-breakouts': 'Breakouts & fakeouts', 'l-volume': 'Volume', 'l-position-size': 'Position sizing', 'l-wheel': 'The wheel strategy', 'l-payoff': 'Payoff diagrams', 'l-theta': 'Theta: time decay', 'l-contracts': 'Contracts & moneyness', 'l-game-plan': 'A day-trade game plan', 'l-orders': 'Order types', 'l-psychology': 'Mind traps', 'l-tax-loss': 'Tax-loss harvesting', 'l-wash-sale': 'The wash sale rule', 'l-cap-gains': 'Short vs long-term gains', 'l-stock-picking': 'Which stocks to trade' };
  const lessonTitle = (id, fb) => { const l = SML.lessons.find((x) => x.id === id); return l ? l.title : FALLBACK[id] || fb; };

  SML.css(`
/* ---- trade replay ---- */
.tr-bar .pill{font-size:11px}
.tr-acts{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;padding:12px 16px}
.tr-grp{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tr-grp-l{font:600 10.5px/1 var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-right:2px}
.tr-acts .sep{width:1px;align-self:stretch;background:var(--line)}
.tr-acts .btn{min-width:74px}
.tr-cols{display:grid;grid-template-columns:minmax(0,1fr)}
.tr-cols > div{padding:14px 16px;min-width:0;display:flex;flex-direction:column;gap:10px}
.tr-cols > div + div{border-top:1px solid var(--line)}
@media (min-width:820px){.tr-cols{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}.tr-cols > div + div{border-top:0;border-left:1px solid var(--line)}}
.tr-h{font:600 11px/1.2 var(--mono);text-transform:uppercase;letter-spacing:.09em;color:var(--muted)}
.tr-feed{list-style:none;display:flex;flex-direction:column}
.tr-feed li{display:grid;grid-template-columns:48px minmax(0,1fr);gap:10px;padding:8px 0;border-bottom:1px dashed var(--line);font-size:13.5px;line-height:1.4;color:var(--text)}
.tr-feed li:last-child{border-bottom:0}
.tr-feed time{font:500 12px var(--mono);color:var(--muted);padding-top:1px}
.tr-feed li:first-child{color:var(--ink)}
.tr-log .tbl{font-size:13px}
.tr-log .tbl td,.tr-log .tbl th{padding:7px 8px}
.tr-empty{font-size:13.5px;color:var(--muted);padding:6px 0}
.tr-score{padding:20px 18px;display:flex;flex-direction:column;gap:16px;background:var(--accent-t)}
.tr-score-h{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;justify-content:space-between}
.tr-score-t{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:30px;line-height:.9;color:var(--ink)}
.tr-score .wg-read{border:1px solid var(--line);border-radius:5px;overflow:hidden}
.tr-checks{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.tr-checks li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.4;list-style:none;background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:10px 12px}
.tr-checks li span b{display:block}
.tr-keys{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
kbd{font:600 11px/1 var(--mono);border:1px solid var(--line);border-bottom-width:2px;border-radius:3px;padding:3px 6px;background:var(--surface);color:var(--ink);margin-right:4px}
.tr-goals{display:grid;gap:12px;grid-template-columns:1fr}
@media (min-width:760px){.tr-goals{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tr-goal{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px 16px}
.tr-goal .t{font-weight:600;color:var(--ink)}
.tr-goal .d{font-size:13.5px;color:var(--muted)}
.tr-goal .prog{flex:1 1 0;min-width:40px}
.tr-goal .meta{flex:0 0 auto;white-space:nowrap}
.tr-read{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:620px){.sh-read .stat:last-child:nth-child(odd){grid-column:1/-1}}
.tr-read .stat:last-child{grid-column:1/-1}
@media (min-width:700px){.tr-read{grid-template-columns:repeat(5,minmax(0,1fr))}.tr-read .stat:last-child{grid-column:auto}}
@media (max-width:620px){.tr-acts .sep,.tr-acts .grow{display:none}.tr-grp{width:100%}.tr-grp-l{width:100%;margin-bottom:2px}.tr-grp .btn{flex:1 1 0;min-width:0}.tr-acts > .btn{width:100%}}
.how-n{font-family:var(--display);font-weight:800;font-size:40px;line-height:.8;color:var(--accent)}
/* ---- recap / blog widgets ---- */
.rc-steps{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px}
.rc-steps .seg[id$="-st"] button{min-width:34px;font-family:var(--mono)}
.rc-cap{display:flex;flex-direction:column;gap:4px;padding:14px 16px}
.rc-cap b{font-size:15.5px}
.rc-cap p{font-size:14.5px;line-height:1.5;max-width:68ch}
.tl-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 16px;font-size:14px}
.tl-row + .tl-row{border-top:1px dashed var(--line)}
.tl-row .num{font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--ink);font-weight:600;white-space:nowrap}
.tl-row .nm{min-width:0}
.tl-row .nm small{display:block;color:var(--muted);font-size:12.5px}
.tl-tog{appearance:none;-webkit-appearance:none;width:38px;height:22px;border-radius:11px;background:var(--shade2);position:relative;cursor:pointer;flex:0 0 auto;margin:0;transition:background-color .15s}
.tl-tog::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--surface);transition:transform .15s;box-shadow:0 1px 2px var(--raise)}
.tl-tog:checked{background:var(--up)}
.tl-tog:checked::after{transform:translateX(16px)}
.tl-tog:disabled{opacity:.35;cursor:not-allowed}
/* ---- blog ---- */
.bl-feat{display:grid;grid-template-columns:minmax(0,1fr);text-decoration:none;color:inherit}
@media (min-width:860px){.bl-feat{grid-template-columns:minmax(0,7fr) minmax(0,5fr)}.bl-feat .card-fig{border-bottom:0;border-right:1px solid var(--line)}}
.bl-feat .card-fig{min-height:220px}
.bl-feat .card-fig svg{max-height:300px}
.bl-feat .card-t{font-size:clamp(24px,3vw,32px);font-family:var(--display);font-weight:800;text-transform:uppercase;line-height:.95}
.bl-filter{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:20px}
.bl-head{display:flex;flex-direction:column;gap:14px}
.bl-head .h1{font-size:clamp(40px,6vw,64px)}
.bl-back{font-weight:500;text-decoration:none;font-size:14px}
.bl-back:hover{text-decoration:underline}
.bl-rel{display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:20px}
.post .wg{margin-block:6px}
.post .prose h2 + p{margin-top:-4px}
/* ---- sheets ---- */
.sh-intro{display:flex;flex-direction:column;gap:12px;padding:14px 16px}
.sh-intro p{font-size:14.5px;max-width:72ch}
.sh-wrap{max-height:460px;overflow:auto}
.sh-wrap .sheet{border-left:0}
.sh-wrap .sheet thead th{position:sticky;top:0;z-index:1}
.sheet td.del{width:36px;text-align:center;background:var(--paper)}
.sheet td.del button{border:0;background:none;width:30px;height:30px;border-radius:4px;color:var(--muted);cursor:pointer;font:600 16px/1 var(--sans)}
.sheet td.del button:hover{background:var(--down-t);color:var(--down)}
.sheet td.txt{padding:0 10px;color:var(--ink)}
.sheet thead th small{display:block;font-size:9.5px;letter-spacing:.04em;color:var(--accent);text-transform:none;font-weight:500;margin-top:1px}
.sheet thead th.cl{color:var(--ink)}
.sheet thead th .col{color:var(--muted);font-weight:500;margin-right:6px}
.sheet td input[type=number]{text-align:right;-moz-appearance:textfield;appearance:textfield}
.sheet td input[type=number]::-webkit-inner-spin-button,.sheet td input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.sheet td.calc{min-width:92px}
.sheet tfoot td{height:34px;white-space:nowrap}
.sheet tfoot td.num{text-align:right}
/* ---- apps ---- */
.ap-band{display:grid;gap:36px;grid-template-columns:minmax(0,1fr);align-items:center}
@media (min-width:880px){.ap-band{grid-template-columns:auto minmax(0,1fr);gap:56px}.ap-band.flip{grid-template-columns:minmax(0,1fr) auto}.ap-band.flip .ap-ph{order:2}}
.ap-ph{display:flex;flex-direction:column;align-items:center;gap:10px}
.ap-copy{display:flex;flex-direction:column;gap:16px;min-width:0}
.ap-copy .h2{font-size:clamp(34px,4.4vw,48px)}
.ap-scr{font-size:13px;color:var(--text);display:flex;flex-direction:column;height:100%;min-height:0}
.ap-top{padding:6px 16px 10px;display:flex;flex-direction:column;gap:2px}
.ap-app{font:600 10px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.ap-big{font-family:var(--display);font-weight:800;font-size:34px;line-height:1;color:var(--ink)}
.ap-tip{font-size:11.5px;color:var(--muted);line-height:1.4}
.ap-tip b{color:var(--ink);font-weight:600}
.ap-sub{font-size:11.5px;color:var(--muted)}
.ap-body{flex:1 1 auto;overflow:auto;padding:0 12px 12px;display:flex;flex-direction:column;gap:8px;min-height:0}
.ap-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 8px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 12px;text-align:left;cursor:pointer;width:100%;font:inherit;color:inherit}
.ap-item:hover{border-color:var(--muted)}
.ap-item .t{font-weight:600;color:var(--ink);font-size:13.5px}
.ap-item .s{font-size:11.5px;color:var(--muted)}
.ap-item .v{font:600 13px var(--mono);color:var(--up);text-align:right}
.ap-item .prog{grid-column:1/-1;height:3px}
.ap-tabs{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;border-top:1px solid var(--line);background:var(--surface);flex:0 0 auto}
.ap-tabs button{border:0;background:none;padding:10px 4px 12px;font:600 11px/1 var(--sans);color:var(--muted);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px}
.ap-tabs button svg{width:18px;height:18px}
.ap-tabs button.on{color:var(--accent)}
.ap-card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px}
.ap-kv{display:grid;grid-template-columns:1fr auto;gap:6px 10px;font-size:12.5px}
.ap-kv span:nth-child(odd){color:var(--muted)}
.ap-kv span:nth-child(even){font:600 12.5px var(--mono);color:var(--ink);text-align:right}
.ap-scr .btn{min-height:36px;font-size:13px;border-radius:9px}
.ap-scr .ctl-lab{font-size:12px}
.ap-scr .ctl-val{font-size:12.5px}
.ap-scr .fld input{padding:7px 9px;font-size:13.5px;border-radius:8px}
.ap-scr .seg{border-radius:9px;width:100%}
.ap-scr .seg button{flex:1 1 0;min-height:30px;font-size:12px;padding:0 6px}
.ap-out{display:flex;flex-direction:column;align-items:center;gap:2px;padding:12px;background:var(--accent-t);border-radius:10px;text-align:center}
.ap-out b{font-family:var(--display);font-size:28px;line-height:1;color:var(--accent);font-weight:800}
.ap-out span{font-size:11.5px;color:var(--ink)}
.ap-bars{display:flex;align-items:flex-end;gap:6px;height:110px;padding-top:6px}
.ap-bars div{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:4px;font:500 10px var(--mono);color:var(--muted);height:100%;justify-content:flex-end}
.ap-bars i{display:block;width:100%;background:var(--up);border-radius:3px 3px 0 0;min-height:2px}
.ap-roadmap{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:820px){.ap-roadmap{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ap-rm{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px;display:flex;flex-direction:column;gap:8px;position:relative}
.ap-rm.now{border-color:var(--accent);background:var(--accent-t)}
.ap-rm .t{font-weight:600;color:var(--ink)}
.ap-rm p{font-size:14px}
`);

  /* =====================================================================
     TRADE REPLAY: the playground game
     ===================================================================== */
  function synthYesterday(prev, seed) {
    const up = prev.c >= prev.o;
    const A = up ? [[0, prev.o], [3, prev.l], [9, prev.h], [12, prev.c]] : [[0, prev.o], [3, prev.h], [9, prev.l], [12, prev.c]];
    const c = SML.data.candles(SML.data.path(A, 13, seed + 50, 0.12), seed + 51, { vol: 60, open: prev.o, wick: 0.25 });
    const hi = Math.max(...c.map((x) => x.h)), lo = Math.min(...c.map((x) => x.l));
    const f = (v) => prev.l + ((v - lo) / (hi - lo || 1)) * (prev.h - prev.l);
    return c.map((x) => ({ o: f(x.o), h: f(x.h), l: f(x.l), c: f(x.c), v: x.v }));
  }

  SML.widgets.tradeReplay = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('tr');
    const START = 25000;
    let equity = START, seed = opts.seed || 11, dayNo = 1;
    let D, yest, pre2, k, pos, trades, feed, dayStartEq, done, lastMsg;
    let timer = null, speed = 1, lay = null, dragging = null, hoverJ = -1;

    root.innerHTML = `
      <div class="wg-bar tr-bar">
        ${ui.chips(id + '-ov', [
          { k: 'lv', label: 'Levels', color: 'var(--accent)', on: true },
          { k: 'vw', label: 'VWAP', color: 'var(--info)', on: true },
          { k: 'e13', label: '13 EMA', color: 'var(--accent)', on: false },
          { k: 'e48', label: '48 EMA', color: 'var(--info)', on: false },
          { k: 'vol', label: 'Volume', color: 'var(--up)', on: true },
        ])}
        <span class="grow"></span>
        <span class="pill" id="${id}-day">Day 1</span>
        <span class="pill ink" id="${id}-clock">Premarket</span>
      </div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="tr-acts">
        <div class="tr-grp"><span class="tr-grp-l">Replay</span>
          <button type="button" class="btn btn-p sm" data-a="next">Next bar</button>
          <button type="button" class="btn btn-g sm" data-a="play">Play</button>
          ${ui.seg(id + '-spd', [{ v: '1', label: '1×' }, { v: '4', label: '4×' }], '1', 'Replay speed')}
        </div>
        <span class="sep" aria-hidden="true"></span>
        <div class="tr-grp"><span class="tr-grp-l">Trade</span>
          <button type="button" class="btn btn-up sm" data-a="buy">Buy</button>
          <button type="button" class="btn btn-dn sm" data-a="short">Short</button>
          <button type="button" class="btn btn-g sm" data-a="close">Close</button>
        </div>
        <span class="grow" style="flex:1 1 auto"></span>
        <button type="button" class="btn btn-g sm" data-a="newday">New day</button>
      </div>
      <div class="wg-read tr-read">
        ${ui.stat('Account', id + '-eq')}${ui.stat('Day P/L', id + '-dpl')}${ui.stat('Position', id + '-pos')}${ui.stat('Open P/L', id + '-opl')}${ui.stat('Trades', id + '-ntr')}
      </div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="tr-score" id="${id}-score" hidden></div>
      <div class="tr-cols">
        <div class="tr-log"><span class="tr-h">Trade log</span><div id="${id}-log"></div></div>
        <div><span class="tr-h">Coach</span><ol class="tr-feed" id="${id}-feed"></ol></div>
      </div>
      <div class="wg-note tr-keys"><span><kbd>N</kbd>next bar</span><span><kbd>Space</kbd>play / pause</span><span><kbd>B</kbd>buy</span><span><kbd>S</kbd>short</span><span><kbd>C</kbd>close</span><span>Drag the stop or target handle on the chart to move it. Hover a candle for its prices.</span></div>`;

    const fig = $('#' + id + '-fig', root);
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-spd')) { speed = Number(st.seg(id + '-spd')) || 1; if (timer) { stop(); play(); } }
      redraw();
    });

    /* ---------- day setup ---------- */
    function newDay(s) {
      seed = s; D = SML.data.session(seed, { bars: 100 }); yest = synthYesterday(D.prev, seed); pre2 = SML.data.aggregate(D.pre, 2);
      k = 0; pos = null; trades = []; feed = []; done = false; dayStartEq = equity; lastMsg = {};
      say(-1, 'Premarket. Find PDH, PDL, PMH and PML on the chart and decide what you would do at each. Then press Next bar to open the market.', 'acc', 'Plan');
      $('#' + id + '-score', root).hidden = true;
    }
    const last = () => (k > 0 ? D.day[k - 1].c : D.pre[D.pre.length - 1].c);
    const vwapArr = () => SML.ind.vwap(D.day.slice(0, Math.max(1, k)));
    function emaSeries(n) { const closes = pre2.map((c) => c.c).concat(D.day.slice(0, k).map((c) => c.c)); return SML.ind.ema(closes, n); }
    function say(t, text, cls, tag) { feed.unshift({ t, text, cls: cls || '', tag: tag || 'Note' }); if (feed.length > 40) feed.length = 40; }
    const clock = (t) => (t < 0 ? 'Pre' : F.time(t));
    const openPnl = () => (pos ? (last() - pos.entry) * pos.shares * (pos.side === 'long' ? 1 : -1) : 0);

    /* ---------- trading ---------- */
    function enter(side) {
      if (done || k < 1 || pos) return;
      const px = last(); const bars = D.day.slice(Math.max(0, k - 3), k);
      let stopP = side === 'long' ? Math.min(...bars.map((b) => b.l)) - 0.02 : Math.max(...bars.map((b) => b.h)) + 0.02;
      let dist = Math.abs(px - stopP);
      const rb = D.day.slice(Math.max(0, k - 10), k); const avgRange = rb.reduce((q, x) => q + (x.h - x.l), 0) / rb.length;
      const minD = Math.max(0.12, avgRange * 0.9);
      if (dist < minD) { dist = minD; stopP = side === 'long' ? px - dist : px + dist; }
      const riskD = Math.round(equity * 0.01), bp = equity * 4;
      const want = Math.floor(riskD / dist), capSh = Math.floor(bp / px);
      const sh = Math.max(1, Math.min(want, capSh)); const capped = want > capSh;
      const vw = vwapArr(); const vNow = vw[vw.length - 1];
      pos = { side, entry: px, stop: stopP, stop0: stopP, target: side === 'long' ? px + 2 * dist : px - 2 * dist, useTarget: true, shares: sh, risk: sh * dist, bar: k - 1, t: k * 2, widened: false, early: k < 3, vwapOk: side === 'long' ? px >= vNow : px <= vNow };
      say(k * 2, `${side === 'long' ? 'Long' : 'Short'} ${sh.toLocaleString('en-US')} shares at ${p2(px)}. Stop ${p2(stopP)} beyond the last 3 bars, so 1R = ${F.usd0(pos.risk)}${capped ? `, less than 1% because the size hit the practice account's ${F.usd0(bp)} buying power` : ' (1% of the account)'}. Target set at 2R.`, side === 'long' ? 'up' : 'dn', 'Entry');
      if (pos.early) say(k * 2, 'You entered in the first 5 minutes. Spreads are widest and swings are wildest right after the open.', 'acc', 'Rule');
      if (!pos.vwapOk) say(k * 2, side === 'long' ? 'This long is below VWAP. Buyers have not taken control of the day yet.' : 'This short is above VWAP. Sellers have not taken control of the day yet.', 'acc', 'Rule');
      redraw();
    }
    function exitPos(price, reason) {
      if (!pos) return;
      const dir = pos.side === 'long' ? 1 : -1; const pnl = (price - pos.entry) * pos.shares * dir; equity += pnl;
      const tr = Object.assign({}, pos, { exit: price, pnl, R: pnl / pos.risk, reason, exitBar: Math.max(0, k - 1), exitT: k * 2 });
      trades.push(tr); pos = null;
      const tag = reason === 'Stop' ? 'Stopped' : reason === 'Target' ? 'Target' : 'Exit';
      say(k * 2, `${reason === 'Stop' ? 'Stop hit' : reason === 'Target' ? 'Target hit' : reason === 'Session end' ? 'Session over, position closed' : 'Closed'} at ${p2(price)}: ${F.susd(pnl, 0)} (${F.R(tr.R, 1)}).${reason === 'Stop' ? ' A small, planned loss. That is the stop doing its job.' : ''}`, pnl >= 0 ? 'up' : 'dn', tag);
    }

    /* ---------- advancing ---------- */
    function step() {
      if (done) return;
      k++; const i = k - 1; const b = D.day[i];
      // fills first
      if (pos) {
        if (pos.side === 'long') {
          if (b.l <= pos.stop) exitPos(Math.min(pos.stop, b.o), 'Stop');
          else if (pos.useTarget && b.h >= pos.target) exitPos(Math.max(pos.target, b.o), 'Target');
        } else {
          if (b.h >= pos.stop) exitPos(Math.max(pos.stop, b.o), 'Stop');
          else if (pos.useTarget && b.l <= pos.target) exitPos(Math.min(pos.target, b.o), 'Target');
        }
      }
      events(i);
      if (k >= D.day.length) finish();
      redraw();
    }
    function events(i) {
      const b = D.day[i], t = (i + 1) * 2; const prevC = i > 0 ? D.day[i - 1].c : D.pre[D.pre.length - 1].c;
      let n = 0; const add = (key, text, cls, tag) => { if (n >= 2) return; if (lastMsg[key] != null && i - lastMsg[key] < (key === 'vw' || key === 'ema' ? 8 : 18)) return; lastMsg[key] = i; say(t, text, cls, tag); n++; };
      if (i === 0) { say(t, 'Market open. The first candles are the fastest and noisiest of the day. Many traders wait at least 5 minutes.', 'info', 'Open'); n++; }
      const lv = [['PDH', D.pdh, 'the previous day high'], ['PMH', D.pmh, 'the premarket high'], ['PML', D.pml, 'the premarket low'], ['PDL', D.pdl, 'the previous day low']];
      lv.forEach(([nm, p, long]) => {
        if (prevC < p && b.c > p) add(nm, `Closed above ${nm} (${long}, ${p2(p)}). If a retest holds above it, the breakout is confirmed.`, 'up', 'Break');
        else if (prevC > p && b.c < p) add(nm, `Closed below ${nm} (${long}, ${p2(p)}). A retest that fails from below would confirm the breakdown.`, 'dn', 'Break');
        else if (prevC < p && b.h >= p - 0.06 && b.c < p) add(nm, `Tested ${nm} (${p2(p)}) from below and got pushed back. Sellers are defending it.`, 'acc', 'Test');
        else if (prevC > p && b.l <= p + 0.06 && b.c > p) add(nm, `Dipped to ${nm} (${p2(p)}) and held. The level is acting as a floor.`, 'acc', 'Test');
      });
      if (i > 0) {
        const vw = SML.ind.vwap(D.day.slice(0, i + 1)); const vNow = vw[i], vPrev = vw[i - 1];
        if (prevC < vPrev && b.c > vNow) add('vw', `Crossed above VWAP (${p2(vNow)}). Buyers have the edge while price holds above it.`, 'info', 'VWAP');
        else if (prevC > vPrev && b.c < vNow) add('vw', `Crossed below VWAP (${p2(vNow)}). Sellers have the edge while price stays below it.`, 'info', 'VWAP');
      }
      if (i >= 5) {
        const avg = D.day.slice(Math.max(0, i - 10), i).reduce((s, x) => s + x.v, 0) / Math.min(10, i);
        if (b.v >= 2 * avg) add('vol', `Volume spike: ${(b.v / avg).toFixed(1)}× the recent average. Big orders are hitting the tape.`, 'vio', 'Volume');
      }
      if (k >= 3) {
        const e13 = emaSeries(13), e48 = emaSeries(48); const L = e13.length - 1;
        if (e13[L - 1] < e48[L - 1] && e13[L] > e48[L]) add('ema', '13 EMA crossed above the 48 EMA. Short-term momentum turned up.', 'acc', 'EMA');
        else if (e13[L - 1] > e48[L - 1] && e13[L] < e48[L]) add('ema', '13 EMA crossed below the 48 EMA. Short-term momentum turned down.', 'acc', 'EMA');
      }
      if (i === 2) say(t, 'Five minutes in. The opening noise usually starts to settle from here.', '', 'Clock');
    }
    function finish() {
      if (pos) exitPos(D.day[D.day.length - 1].c, 'Session end');
      done = true; stop();
      say(D.day.length * 2, 'Morning session over at 12:50. Check your scorecard below.', 'ink', 'Done');
      scorecard();
      try { document.dispatchEvent(new CustomEvent('sml:replay')); } catch (e) {}
    }
    function scorecard() {
      const box = $('#' + id + '-score', root);
      const n = trades.length, wins = trades.filter((t) => t.pnl > 0).length;
      const totR = trades.reduce((s, t) => s + t.R, 0), dayPl = equity - dayStartEq;
      const best = n ? trades.reduce((a, t) => (t.R > a.R ? t : a)) : null, worst = n ? trades.reduce((a, t) => (t.R < a.R ? t : a)) : null;
      const checks = n ? [
        [trades.every((t) => !t.widened), 'Respected every stop', 'No stop was moved further away.', 'A stop was moved further away, which made the loss bigger than planned.'],
        [trades.every((t) => !t.early), 'Waited out the first 5 minutes', 'No entries in the opening noise.', 'At least one entry came in the first 5 minutes.'],
        [trades.every((t) => t.vwapOk), 'Traded with VWAP', 'Longs above VWAP, shorts below it.', 'At least one trade fought VWAP.'],
      ] : null;
      const stats = SML.store.get('replay-stats', { days: 0, clean: 0 });
      stats.days += 1; if (checks && checks.every((c) => c[0])) stats.clean += 1;
      SML.store.set('replay-stats', stats);
      let pb = SML.store.get('replay-best', null), newBest = false;
      if (n && (!pb || totR > pb.r + 1e-9)) { newBest = !!pb || totR > 0; pb = { r: totR }; SML.store.set('replay-best', pb); }
      box.innerHTML = `
        <div class="tr-score-h"><div><div class="eyebrow">Scorecard · Day ${dayNo}</div><div class="tr-score-t">${n ? (totR >= 0 ? 'Session closed green' : 'Session closed red') : 'No trades today'}</div></div>
          <div class="tr-grp">${newBest ? '<span class="pill up">New personal best</span>' : ''}${pb ? `<span class="pill">Best day ${F.R(pb.r, 1)}</span>` : ''}<button type="button" class="btn btn-a sm" data-a="newday">Play another day</button></div></div>
        ${n ? `<div class="wg-read">${[
          ['Trades', String(n)], ['Win rate', Math.round((wins / n) * 100) + '%'], ['Total R', F.R(totR, 1), totR >= 0 ? 'up' : 'dn'], ['Day P/L', F.susd(dayPl, 0), dayPl >= 0 ? 'up' : 'dn'],
          ['Best trade', F.R(best.R, 1), best.R >= 0 ? 'up' : 'dn'], ['Worst trade', F.R(worst.R, 1), worst.R >= 0 ? 'up' : 'dn'],
        ].map((s) => `<div class="stat"><span class="stat-l">${s[0]}</span><span class="stat-v ${s[2] || ''}">${s[1]}</span></div>`).join('')}</div>
        <ul class="tr-checks">${checks.map((c) => `<li>${c[0] ? ui.check : CROSS}<span><b>${c[1]}</b>${c[0] ? c[2] : c[3]}</span></li>`).join('')}</ul>`
          : `<p class="lede" style="font-size:16px">Sitting out is a valid choice when nothing sets up cleanly. Next time, try one trade at a level you marked before the open.</p>`}`;
      box.hidden = false;
    }

    /* ---------- playback ---------- */
    function play() { if (done || timer) return; timer = setInterval(() => { step(); if (done) stop(); }, speed === 4 ? 170 : 650); syncButtons(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } syncButtons(); }
    SML.onCleanup(() => { if (timer) clearInterval(timer); timer = null; });

    function act(a) {
      if (a === 'next') { stop(); step(); }
      else if (a === 'play') { timer ? stop() : play(); }
      else if (a === 'buy') enter('long');
      else if (a === 'short') enter('short');
      else if (a === 'close') { if (pos) { exitPos(last(), 'Manual'); redraw(); } }
      else if (a === 'newday') { stop(); dayNo += 1; newDay(seed * 7 + 13 + Math.floor(Math.random() * 100000)); redraw(); }
      else if (a === 'tgt') { if (pos) { pos.useTarget = !pos.useTarget; redraw(); } }
    }
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b || !root.contains(b) || b.disabled) return; act(b.dataset.a); });
    const onKey = (e) => {
      if (!document.body.contains(root)) return;
      const tg = e.target; const tag = tg && tg.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'spacebar') { if (tag === 'BUTTON') return; e.preventDefault(); act('play'); }
      else if (key === 'n') act('next'); else if (key === 'b') act('buy'); else if (key === 's') act('short'); else if (key === 'c') act('close');
    };
    document.addEventListener('keydown', onKey);
    SML.onCleanup(() => document.removeEventListener('keydown', onKey));

    function syncButtons() {
      const q = (a) => $(`[data-a="${a}"]`, root);
      q('next').disabled = done; q('play').disabled = done; q('play').textContent = timer ? 'Pause' : 'Play';
      q('buy').disabled = done || k < 1 || !!pos; q('short').disabled = done || k < 1 || !!pos; q('close').disabled = !pos;
    }

    /* ---------- drawing ---------- */
    function drawChart(W) {
      const compact = W < 560;
      const H = Math.round(SML.clamp(W * 0.56, 340, 470));
      const lvOn = st.on(id + '-ov', 'lv'), vwOn = st.on(id + '-ov', 'vw'), e13On = st.on(id + '-ov', 'e13'), e48On = st.on(id + '-ov', 'e48'), volOn = st.on(id + '-ov', 'vol');
      const padL = 4, padR = compact ? 58 : 96, padT = 26, axH = 18;
      const volH = volOn ? Math.round(H * 0.15) : 0;
      const plotB = H - axH - volH - (volOn ? 10 : 2);
      const plotR = W - padR, plotW = plotR - padL;
      const slots = [];
      let yStart = -1;
      if (!compact) { yStart = 0; yest.forEach((c) => slots.push({ z: 'y', c })); slots.push({ z: 'g' }, { z: 'g' }); }
      const preStart = slots.length; pre2.forEach((c, p) => slots.push({ z: 'p', c, p })); const preEnd = slots.length; slots.push({ z: 'g' });
      const dayStart = slots.length; D.day.forEach((c, i) => slots.push({ z: 'd', c, i }));
      const cap = Math.max(36, Math.floor(plotW / (compact ? 5.6 : 8.4)));
      let s0 = 0, s1 = slots.length;
      if (slots.length > cap) { const cur = k > 0 ? dayStart + k - 1 : preEnd - 1; s1 = Math.min(slots.length, cur + 1 + Math.round(cap * 0.2)); s0 = Math.max(0, s1 - cap); s1 = s0 + cap; }
      const sw = plotW / (s1 - s0), bw = SML.clamp(sw * 0.62, 1.6, 9);
      const xs = (j) => padL + (j - s0 + 0.5) * sw;
      const shown = (s) => s.z !== 'g' && !(s.z === 'd' && s.i >= k);
      const vis = []; for (let j = s0; j < s1; j++) if (shown(slots[j])) vis.push(slots[j].c);
      let lo = Math.min(...vis.map((c) => c.l)), hi = Math.max(...vis.map((c) => c.h));
      if (lvOn) { lo = Math.min(lo, D.pdl, D.pml); hi = Math.max(hi, D.pdh, D.pmh); }
      if (pos) { lo = Math.min(lo, pos.stop, pos.useTarget ? pos.target : lo); hi = Math.max(hi, pos.stop, pos.useTarget ? pos.target : hi); }
      const pad = (hi - lo) * 0.07 || 0.5;
      const y = SML.lin(lo - pad, hi + pad, plotB, padT);
      lay = { y, xs, s0, s1, sw, slots, padL, plotR, plotB, padT, dayStart, preStart, H, W, compact };
      let b = '';
      // zones
      const inView = (a, z) => Math.max(a, s0) < Math.min(z, s1);
      if (inView(preStart, preEnd)) { const a = Math.max(preStart, s0), z = Math.min(preEnd, s1); b += S.rect(xs(a) - sw / 2, padT - 8, (z - a) * sw, plotB - padT + 8, 'f-shade o70'); b += S.text(xs(a) + 4, 14, compact ? 'PRE' : 'PREMARKET', 'cap'); }
      if (!compact && inView(0, yest.length)) b += S.text(xs(Math.max(0, s0)) + 4, 14, 'YESTERDAY', 'cap');
      if (inView(dayStart, slots.length)) { const a = Math.max(dayStart, s0); b += S.line(xs(a) - sw / 2, padT - 8, xs(a) - sw / 2, plotB, 's-mut dash2'); b += S.text(xs(a) - sw / 2 + 5, 14, k > 0 ? 'TODAY' : 'TODAY · OPENS 9:30', 'cap'); }
      // grid
      const tks = SML.ticks(lo - pad, hi + pad, compact ? 4 : 6);
      tks.forEach((v) => { const yy = y(v); if (yy < padT - 4 || yy > plotB) return; b += S.line(padL, yy, plotR, yy, 's-grid'); b += S.text(padL + 3, yy - 3, v.toFixed(v % 1 ? 1 : 0), 'xs mono'); });
      // right-hand labels collected and de-overlapped
      const tags = [];
      if (lvOn) [['PDH', D.pdh], ['PMH', D.pmh], ['PML', D.pml], ['PDL', D.pdl]].forEach(([nm, p]) => { b += S.line(padL, y(p), plotR, y(p), 's-acc dash w15'); tags.push({ y: y(p), t: compact ? nm : `${nm} ${p.toFixed(2)}`, cls: 'sm acc b' }); });
      // volume
      if (volOn) {
        const base = H - axH, top = base - volH; const vv = []; for (let j = s0; j < s1; j++) if (shown(slots[j])) vv.push(slots[j].c.v);
        const maxV = Math.max(...vv, 1);
        b += S.line(padL, base + 0.5, plotR, base + 0.5, 's-line');
        for (let j = s0; j < s1; j++) { const s = slots[j]; if (!shown(s)) continue; const h = (s.c.v / maxV) * volH; let hiV = false; if (s.z === 'd' && s.i >= 5) { const avg = D.day.slice(Math.max(0, s.i - 10), s.i).reduce((q, x) => q + x.v, 0) / Math.min(10, s.i); hiV = s.c.v >= 2 * avg; } b += S.rect(xs(j) - bw / 2, base - h, bw, h, (s.c.c >= s.c.o ? 'f-up' : 'f-dn') + (hiV ? '' : ' o35')); }
        if (!compact) b += S.text(padL + 3, top + 10, 'VOLUME', 'cap');
      }
      // position zones
      if (pos) {
        const xa = xs(dayStart + pos.bar) - sw / 2;
        b += S.rect(xa, Math.min(y(pos.entry), y(pos.stop)), plotR - xa, Math.abs(y(pos.entry) - y(pos.stop)), 'f-dn-t o70');
        if (pos.useTarget) b += S.rect(xa, Math.min(y(pos.entry), y(pos.target)), plotR - xa, Math.abs(y(pos.entry) - y(pos.target)), 'f-up-t o70');
      }
      // candles
      for (let j = s0; j < s1; j++) {
        const s = slots[j]; if (!shown(s)) continue; const c = s.c, x = xs(j); const kk = c.c >= c.o ? 'up' : 'dn'; const dim = s.z === 'y' ? ' o70' : '';
        const t = y(Math.max(c.o, c.c)), bt = y(Math.min(c.o, c.c));
        b += S.line(x, y(c.h), x, y(c.l), `wk ${kk}${dim}`) + S.rect(x - bw / 2, t, bw, Math.max(1.4, bt - t), `bd ${kk}${dim}`, bw > 6 ? 1 : 0);
      }
      // EMAs and VWAP
      const series = (arr, cls) => { const pts = []; arr.forEach((v, q) => { const j = q < pre2.length ? preStart + q : dayStart + (q - pre2.length); if (j >= s0 && j < s1) pts.push([xs(j), y(v)]); }); return pts.length > 1 ? S.poly(pts, cls) : ''; };
      if (e48On) { const e = emaSeries(48); b += series(e, 's-info w2'); tags.push({ y: y(e[e.length - 1]), t: compact ? '48' : '48 EMA', cls: 'sm info' }); }
      if (e13On) { const e = emaSeries(13); b += series(e, 's-acc w2'); tags.push({ y: y(e[e.length - 1]), t: compact ? '13' : '13 EMA', cls: 'sm acc' }); }
      if (vwOn && k > 0) { const vw = vwapArr(); const pts = vw.map((v, i) => [xs(dayStart + i), y(v)]).filter((p, i) => dayStart + i >= s0 && dayStart + i < s1); if (pts.length > 1) b += S.poly(pts, 's-info w25'); tags.push({ y: y(vw[vw.length - 1]), t: 'VWAP', cls: 'sm info b' }); }
      // trade markers
      trades.concat(pos ? [pos] : []).forEach((t) => {
        const j = dayStart + t.bar; if (j >= s0 && j < s1) { const c = D.day[t.bar], x = xs(j); if (t.side === 'long') { const yy = y(c.l) + 6; b += S.polygon([[x, yy], [x - 5, yy + 8], [x + 5, yy + 8]], 'f-up'); } else { const yy = y(c.h) - 6; b += S.polygon([[x, yy], [x - 5, yy - 8], [x + 5, yy - 8]], 'f-dn'); } }
        if (t.exit != null) { const je = dayStart + t.exitBar; if (je >= s0 && je < s1) b += S.circle(xs(je), y(t.exit), 4.5, t.pnl >= 0 ? 'f-up s-surf w15' : 'f-dn s-surf w15'); }
      });
      // position lines + handles
      if (pos) {
        const xa = xs(dayStart + pos.bar) - sw / 2, hx = plotR - 14;
        b += S.line(xa, y(pos.entry), plotR, y(pos.entry), 's-ink dash2 w15');
        b += S.line(xa, y(pos.stop), plotR, y(pos.stop), 's-dn dash w2');
        tags.push({ y: y(pos.stop), t: compact ? 'Stop' : `Stop ${pos.stop.toFixed(2)}`, cls: 'sm dn b' });
        if (pos.useTarget) { b += S.line(xa, y(pos.target), plotR, y(pos.target), 's-up dash w2'); tags.push({ y: y(pos.target), t: compact ? 'Tgt' : `Target ${pos.target.toFixed(2)}`, cls: 'sm up b' }); }
        const handle = (h, yy) => S.circle(hx, yy, 16, 'hit', ` data-h="${h}"`) + S.circle(hx, yy, 7, 'handle drag', ` data-h="${h}"`);
        b += handle('stop', y(pos.stop)); if (pos.useTarget) b += handle('target', y(pos.target));
        if (trades.length === 0 && k - 1 - pos.bar < 4) b += S.text(hx - 12, y(pos.stop) + (pos.side === 'long' ? 20 : -12), 'drag me', 'sm dn b', 'end');
      }
      // last price tag
      const lp = last(); tags.push({ y: y(lp), t: lp.toFixed(2), cls: 'sm mono on b', box: true });
      // de-overlap right labels
      tags.sort((a, c) => a.y - c.y); const gap = 14;
      for (let q = 1; q < tags.length; q++) if (tags[q].y - tags[q - 1].y < gap) tags[q].y = tags[q - 1].y + gap;
      const over = tags.length ? tags[tags.length - 1].y - (plotB + 4) : 0; if (over > 0) tags.forEach((t) => (t.y -= over));
      tags.forEach((t) => { if (t.box) b += S.rect(plotR + 3, t.y - 9, padR - 6, 18, 'f-ink', 3) + S.text(plotR + 3 + (padR - 6) / 2, t.y + 4, t.t, t.cls, 'middle'); else b += S.text(plotR + 6, t.y + 4, t.t, t.cls); });
      // time axis
      for (let i = 0; i < D.day.length; i += 15) { const j = dayStart + i; if (j < s0 || j >= s1) continue; b += S.text(xs(j), H - 4, F.time(i * 2), 'xs mono', 'middle'); }
      if (preStart >= s0 && preStart < s1 && !compact) b += S.text(xs(preStart), H - 4, '4:00', 'xs mono', 'middle');
      b += `<g id="${id}-hov"></g>`;
      fig.innerHTML = S.wrap(W, H, `Replay chart${k ? ', ' + F.time(k * 2) + ' ET' : ', premarket'}: candles with ${lvOn ? 'PDH, PMH, PML, PDL levels' : 'no levels'}${vwOn ? ', VWAP' : ''}${volOn ? ', volume' : ''}${pos ? ', open ' + pos.side + ' position with stop' : ''}.`, b);
      if (hoverJ >= 0) hover(hoverJ);
    }
    function hover(j) {
      const g = $('#' + id + '-hov', fig); if (!g || !lay) return;
      const s = lay.slots[j]; if (j < lay.s0 || j >= lay.s1 || !s || s.z === 'g' || (s.z === 'd' && s.i >= k)) { g.innerHTML = ''; return; }
      const c = s.c, x = lay.xs(j); const tl = s.z === 'd' ? F.time(s.i * 2) : s.z === 'p' ? F.time(D.pre[s.p * 2].t) + ' pre' : 'Yesterday';
      const lines = [tl, `O ${c.o.toFixed(2)}  H ${c.h.toFixed(2)}`, `L ${c.l.toFixed(2)}  C ${c.c.toFixed(2)}`, `Vol ${Math.round(c.v * 1000).toLocaleString('en-US')}`];
      const bw = 132, bh = 70; let bx = x + 12; if (bx + bw > lay.plotR) bx = x - 12 - bw; bx = SML.clamp(bx, lay.padL, Math.max(lay.padL, lay.W - bw - 2)); const by = lay.padT;
      g.innerHTML = S.line(x, lay.padT - 8, x, lay.H - 18, 's-mut dash2') + S.rect(bx, by, bw, bh, 'tipbg', 4) + lines.map((t, q) => S.text(bx + 8, by + 16 + q * 15, t, q === 0 ? 'sm ink b' : 'sm mono ink')).join('');
    }
    fig.addEventListener('pointermove', (e) => { if (dragging || !lay) return; const svg = $('svg', fig); if (!svg) return; const p = ui.pt(svg, e); const j = lay.s0 + Math.floor((p.x - lay.padL) / lay.sw); hoverJ = j; hover(j); });
    fig.addEventListener('pointerleave', () => { hoverJ = -1; const g = $('#' + id + '-hov', fig); if (g) g.innerHTML = ''; });
    ui.drag(fig, {
      sel: '[data-h]',
      start(pt, t) { dragging = t.getAttribute('data-h'); hoverJ = -1; },
      move(pt) {
        if (!pos || !dragging || !lay) return; const px = lay.y.inv(pt.y); const lp = last(); const L = pos.side === 'long';
        if (dragging === 'stop') { pos.stop = L ? Math.min(px, lp - 0.01) : Math.max(px, lp + 0.01); if (Math.abs(pos.entry - pos.stop) > Math.abs(pos.entry - pos.stop0) + 0.004 && (L ? pos.stop < pos.stop0 : pos.stop > pos.stop0)) pos.widened = true; }
        else { pos.target = L ? Math.max(px, lp + 0.01) : Math.min(px, lp - 0.01); }
        redraw();
      },
      end() { if (pos && dragging === 'stop' && pos.widened && !pos._warned) { pos._warned = true; say(k * 2, 'You moved the stop further away. That turns a planned 1R loss into a bigger one. Most rules say: stops only move in your favour.', 'dn', 'Rule'); renderSide(); } dragging = null; },
    });

    function renderSide() {
      const eqv = equity + openPnl(); const dpl = eqv - dayStartEq;
      $('#' + id + '-eq', root).textContent = F.usd0(eqv);
      const dEl = $('#' + id + '-dpl', root); dEl.textContent = F.susd(dpl, 0); dEl.className = 'stat-v ' + (dpl > 0.5 ? 'up' : dpl < -0.5 ? 'dn' : '');
      $('#' + id + '-pos', root).textContent = pos ? `${pos.side === 'long' ? 'Long' : 'Short'} ${pos.shares} @ ${pos.entry.toFixed(2)}` : 'Flat';
      const oEl = $('#' + id + '-opl', root); const op = openPnl();
      oEl.textContent = pos ? `${F.susd(op, 0)} · ${F.R(op / pos.risk, 1)}` : '—'; oEl.className = 'stat-v ' + (pos ? (op >= 0 ? 'up' : 'dn') : '');
      const wins = trades.filter((t) => t.pnl > 0).length;
      $('#' + id + '-ntr', root).textContent = trades.length ? `${trades.length} · ${wins}W ${trades.length - wins}L` : '0';
      $('#' + id + '-day', root).textContent = 'Day ' + dayNo;
      $('#' + id + '-clock', root).textContent = done ? 'Closed 12:50' : k > 0 ? F.time(k * 2) + ' ET' : 'Premarket';
      const m = feed[0]; $('#' + id + '-msg', root).innerHTML = m ? ui.msg(m.cls, m.tag, esc(m.text)) : '';
      $('#' + id + '-feed', root).innerHTML = feed.slice(0, 7).map((f) => `<li><time>${clock(f.t)}</time><span>${esc(f.text)}</span></li>`).join('');
      const rows = trades.slice().reverse();
      $('#' + id + '-log', root).innerHTML = rows.length || pos ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Side</th><th>Time</th><th class="num">Entry</th><th class="num">Exit</th><th class="num">Shares</th><th class="num">P/L</th><th class="num">R</th><th>Exit</th></tr></thead><tbody>
        ${pos ? `<tr><td>${trades.length + 1}</td><td>${pos.side === 'long' ? '<span class="pill up">Long</span>' : '<span class="pill dn">Short</span>'}</td><td class="mono">${F.time(pos.t)}</td><td class="num">${pos.entry.toFixed(2)}</td><td class="num">open</td><td class="num">${pos.shares}</td><td class="num ${openPnl() >= 0 ? 'up' : 'dn'}">${F.susd(openPnl(), 0)}</td><td class="num">${F.R(openPnl() / pos.risk, 1)}</td><td><button type="button" class="linkish" data-a="tgt">${pos.useTarget ? 'Remove target' : 'Add 2R target'}</button></td></tr>` : ''}
        ${rows.map((t, q) => `<tr><td>${rows.length - q}</td><td>${t.side === 'long' ? '<span class="pill up">Long</span>' : '<span class="pill dn">Short</span>'}</td><td class="mono">${F.time(t.t)}</td><td class="num">${t.entry.toFixed(2)}</td><td class="num">${t.exit.toFixed(2)}</td><td class="num">${t.shares}</td><td class="num ${t.pnl >= 0 ? 'up' : 'dn'}">${F.susd(t.pnl, 0)}</td><td class="num ${t.R >= 0 ? 'up' : 'dn'}">${F.R(t.R, 1)}</td><td>${t.reason}</td></tr>`).join('')}
        </tbody></table></div>` : `<p class="tr-empty">No trades yet. Wait for price to react at a level, then press Buy or Short. Size is set so the stop costs 1% of the account.</p>`;
      syncButtons();
    }
    let drawFn = null;
    function redraw() { if (drawFn) drawFn(); renderSide(); }

    newDay(seed);
    drawFn = ui.responsive(fig, drawChart);
    renderSide();
  };

  /* ---------- page: play ---------- */
  function goalsHTML() {
    const st = SML.store.get('replay-stats', { days: 0, clean: 0 });
    const best = SML.store.get('replay-best', null);
    const goals = [
      ['Play five sessions', 'Reps build pattern memory. Each replay is a new random day.', Math.min(1, st.days / 5), `${Math.min(st.days, 5)} of 5`],
      ['Finish a day with every rule check green', 'Respect stops, skip the first 5 minutes, trade with VWAP.', st.clean > 0 ? 1 : 0, st.clean > 0 ? 'Done' : 'Not yet'],
      ['Reach +3R in one session', 'One or two clean trades at levels usually get you there.', best ? SML.clamp(best.r / 3, 0, 1) : 0, best ? `Best ${F.R(best.r, 1)}` : 'No trades yet'],
      ['Three clean days in total', 'Consistency beats one lucky day.', Math.min(1, st.clean / 3), `${Math.min(st.clean, 3)} of 3`],
    ];
    return goals.map((g) => `<div class="tr-goal">${g[2] >= 1 ? ui.check : DASHI}<div><div class="t">${g[0]}</div><div class="d">${g[1]}</div><div style="display:flex;align-items:center;gap:10px;margin-top:8px"><div class="prog"><i style="--w:${Math.round(g[2] * 100)}%"></i></div><span class="meta">${g[3]}</span></div></div></div>`).join('');
  }

  SML.pages.play = function (view) {
    view.innerHTML = `
      ${SML.pageHeader('02', 'Playground · fake money', 'Trade <em>replay</em>', `<p>A random trading morning, one 2-minute candle at a time. Mark your levels, wait for a setup, then buy or short with a $25,000 practice account. Every trade risks 1%, and the coach tells you what just happened.</p>${SML.more('#wheel', 'Or run the wheel simulator')}`)}
      <section class="chapter" style="padding-top:40px"><div class="wrap">${SML.widgetHTML('tradeReplay')}</div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="pl-how"><div class="wrap">
        ${SML.chapHead('', 'Four steps per day', 'How to play a session.', '', 'pl-how')}
        <ol class="tiles t4">${[
          ['Read the premarket', 'Before 9:30 the chart shows yesterday and the premarket. The amber lines are PDH, PMH, PML and PDL. Decide what you would do at each one.'],
          ['Step through the open', 'Press Next bar (or N) to reveal one 2-minute candle. Press Play to run it. The coach narrates level tests, VWAP crosses and volume spikes.'],
          ['Take a trade', 'Buy or Short at the latest close. A stop goes beyond the last 3 candles and the size is set so that stop costs 1% of the account. Drag the stop or target if you need to.'],
          ['Read the scorecard', 'At 12:50 the session ends. You get your win rate, total R and three rule checks. Then play another random day.'],
        ].map((st, i) => `<li><div class="tile"><span class="tile-n">${String(i + 1).padStart(2, '0')}</span><span class="tile-t">${st[0]}</span><span class="tile-p">${st[1]}</span></div></li>`).join('')}</ol>
      </div></section>
      <section class="chapter" style="padding-top:0" aria-labelledby="pl-goals"><div class="wrap">
        ${SML.chapHead('', 'Practice goals', 'Profit in a replay means little. Following the rules every time is the skill that carries over to real money. Progress is saved in this browser.', SML.more('#l-game-plan', 'The day-trade game plan'), 'pl-goals')}
        <div class="tr-goals" id="play-goals">${goalsHTML()}</div>
      </div></section>`;
    const upd = () => { const g = document.getElementById('play-goals'); if (g) g.innerHTML = goalsHTML(); };
    document.addEventListener('sml:replay', upd);
    SML.onCleanup(() => document.removeEventListener('sml:replay', upd));
    return 'Trade replay';
  };

  /* =====================================================================
     RECAP CHART: annotated step-through of an example trade (blog)
     ===================================================================== */
  function setBar(c, i, o) { Object.assign(c[i], o); }
  function scenario(kind) {
    if (kind === 'open') {
      const cl = SML.data.path([[0, 50.85], [1, 49.95], [2, 50.2], [4, 50.6], [6, 49.9], [8, 50.55], [9, 51.25], [11, 51.1], [14, 51.45], [20, 51.7], [26, 52.15], [31, 52.4], [35, 52.1], [39, 52.3]], 40, 21, 0.06);
      const c = SML.data.candles(cl, 22, { vol: 100, open: 50, wick: 0.25, shape: SML.data.uShape });
      setBar(c, 0, { o: 50.0, c: 50.85, h: 50.95, l: 49.9, v: c[0].v * 2.4 });
      setBar(c, 1, { o: 50.85, c: 49.95, h: 51.05, l: 49.8, v: c[1].v * 2.2 });
      setBar(c, 2, { o: 49.95, c: 50.2, h: 50.4, l: 49.7 });
      for (let i = 3; i < 9; i++) { c[i].h = Math.min(c[i].h, 50.75); c[i].l = Math.max(c[i].l, 49.78); c[i].c = SML.clamp(c[i].c, 49.85, 50.7); c[i].o = SML.clamp(c[i].o, 49.85, 50.7); c[i].v *= 0.6; }
      setBar(c, 8, { c: 50.62 });
      setBar(c, 9, { o: 50.62, c: 51.25, h: 51.32, l: 50.58, v: c[9].v * 2.6 });
      for (let i = 10; i < 40; i++) c[i].l = Math.max(c[i].l, 51.02);
      c.forEach((x, i) => { x.z = 'd'; x.t = i * 2; x.h = Math.max(x.h, x.o, x.c); x.l = Math.min(x.l, x.o, x.c); });
      return {
        bars: c, vwap: true, vol: true,
        levels: [{ p: 51.05, label: 'Range high', from: 3, cls: 'acc' }, { p: 49.7, label: 'Range low', from: 3, cls: 'acc' }],
        box: { from: 0, to: 7, step: 3 },
        steps: [
          { upto: 0, badge: [0, 'h'], title: 'The opening spike', text: 'At 9:30 every overnight order hits at once. The first 2-minute candle jumps 1.7% on more than four times normal volume. It looks like a breakout.' },
          { upto: 1, badge: [1, 'l'], title: 'The reversal', text: 'The next candle erases the whole move. A trader who chased the first candle at $50.85 with a stop at $50.40 is out two minutes later for a full loss.', lines: [{ p: 50.85, label: 'Chase', cls: 'ink', from: 0, to: 1 }, { p: 50.4, label: 'Stop', cls: 'dn', from: 0, to: 1 }], x: [1, 50.4] },
          { upto: 7, badge: [5, 'l'], title: 'A range forms', text: 'By 9:46 the first fifteen minutes have drawn an opening range from $49.70 to $51.05. Now there are clear levels instead of noise.' },
          { upto: 9, badge: [9, 'h'], title: 'The cleaner break', text: 'At 9:48 a candle closes above the range high, on about 2.5 times average volume and above VWAP. A stop below the range middle keeps the risk small and defined.', lines: [{ p: 51.25, label: 'Entry', cls: 'ink', from: 9 }, { p: 50.55, label: 'Stop', cls: 'dn', from: 9 }] },
          { upto: 39, badge: [31, 'h'], title: 'Follow-through', text: 'The range high holds as support on the pullback and price trends to $52.40. Waiting fifteen minutes cost nothing and replaced a coin flip with a plan.', lines: [{ p: 51.25, label: 'Entry', cls: 'ink', from: 9 }, { p: 50.55, label: 'Stop', cls: 'dn', from: 9 }] },
        ],
      };
    }
    if (kind === 'levels') {
      const y = SML.data.candles(SML.data.path([[0, 100.2], [3, 98.4], [8, 102.6], [12, 101.1]], 13, 31, 0.14), 32, { vol: 70, open: 100.2, wick: 0.3 });
      const yh = Math.max(...y.map((b) => b.h)), yl = Math.min(...y.map((b) => b.l));
      const pre = SML.data.candles(SML.data.path([[0, 101.1], [4, 101.6], [8, 101.95], [11, 101.4], [15, 101.7]], 16, 33, 0.08), 34, { vol: 18, open: 101.1, wick: 0.3 });
      const ph = Math.max(...pre.map((b) => b.h)), pl = Math.min(...pre.map((b) => b.l));
      const day = SML.data.candles(SML.data.path([[0, 101.75], [4, ph - 0.12], [7, ph + 0.35], [10, ph + 0.08], [13, ph + 0.4], [19, ph + 0.75]], 20, 35, 0.07), 36, { vol: 100, open: 101.72, wick: 0.25, shape: SML.data.uShape });
      day[7].v *= 2.4; for (let i = 8; i < 20; i++) day[i].l = Math.max(day[i].l, ph - 0.06);
      y.forEach((b) => (b.z = 'y')); pre.forEach((b, i) => { b.z = 'p'; b.t = -330 + i * 20; }); day.forEach((b, i) => { b.z = 'd'; b.t = i * 2; });
      const bars = y.concat(pre, day); const d0 = y.length + pre.length;
      return {
        bars, vwap: false, vol: true,
        levels: [{ p: yh, label: 'PDH', from: 0, cls: 'acc' }, { p: yl, label: 'PDL', from: 0, cls: 'acc' }, { p: ph, label: 'PMH', from: 1, cls: 'acc' }, { p: pl, label: 'PML', from: 1, cls: 'acc' }],
        steps: [
          { upto: y.length - 1, badge: [y.findIndex((b) => b.h === yh), 'h'], title: 'Mark yesterday\u2019s range', text: `Mark the previous day high (PDH, ${yh.toFixed(2)}) and low (PDL, ${yl.toFixed(2)}). These are the prices where yesterday’s buyers and sellers gave up.` },
          { upto: y.length + pre.length - 1, badge: [y.length + pre.findIndex((b) => b.h === ph), 'h'], title: 'Add the premarket range', text: `Add the premarket high (PMH, ${ph.toFixed(2)}) and low (PML, ${pl.toFixed(2)}). Premarket volume is thin, so treat these as zones, not exact prices.` },
          { upto: y.length + pre.length - 1, title: 'Write the if-then plan', text: 'Write one line per scenario before the bell. Above PMH and holding: look for a long on a retest. Below PML: look for a short. In between: do nothing. Set your max loss for the day.', plan: true },
          { upto: bars.length - 1, badge: [d0 + 7, 'h'], title: 'The open', text: 'Price breaks the premarket high on 2.4 times normal volume, then retests it and holds. The plan already said what to do, so there is nothing to decide in a rush.' },
        ],
      };
    }
    // default: 'pmh' premarket-high break and retest
    const cl = SML.data.path([[0, 100.45], [3, 100.82], [5, 100.55], [8, 100.86], [10, 100.7], [11, 101.45], [13, 101.12], [15, 101.08], [16, 101.4], [22, 101.92], [26, 101.72], [32, 102.5], [36, 102.92], [40, 102.62], [44, 102.7]], 45, 41, 0.05);
    const c = SML.data.candles(cl, 42, { vol: 100, open: 100.3, wick: 0.22, shape: SML.data.uShape });
    for (let i = 0; i < 11; i++) { c[i].c = Math.min(c[i].c, 100.9); c[i].o = Math.min(c[i].o, 100.92); c[i].h = Math.min(Math.max(c[i].h, c[i].o, c[i].c), 100.97); }
    setBar(c, 3, { h: 100.98, c: 100.8 }); setBar(c, 8, { h: 100.99, c: 100.84 });
    setBar(c, 11, { o: 100.72, c: 101.45, h: 101.52, l: 100.7, v: c[11].v * 3.1 });
    setBar(c, 12, { o: 101.45, c: 101.22, h: 101.5, l: 101.15, v: c[12].v * 0.8 });
    setBar(c, 13, { o: 101.22, c: 101.12, h: 101.28, l: 101.03, v: c[13].v * 0.7 });
    setBar(c, 14, { o: 101.12, c: 101.1, h: 101.2, l: 100.98, v: c[14].v * 0.7 });
    setBar(c, 15, { o: 101.1, c: 101.08, h: 101.18, l: 101.02, v: c[15].v * 0.6 });
    setBar(c, 16, { o: 101.08, c: 101.4, h: 101.44, l: 101.06, v: c[16].v * 1.8 });
    for (let i = 17; i < 45; i++) c[i].l = Math.max(c[i].l, 101.2);
    setBar(c, 36, { h: 103.02, c: 102.92 });
    for (let i = 37; i < 45; i++) c[i].h = Math.min(c[i].h, 102.98);
    c.forEach((x, i) => { x.z = 'd'; x.t = i * 2; x.h = Math.max(x.h, x.o, x.c); x.l = Math.min(x.l, x.o, x.c); });
    return {
      bars: c, vwap: true, vol: true,
      levels: [{ p: 101.0, label: 'PMH', from: 0, cls: 'acc' }, { p: 103.0, label: 'PDH', from: 0, cls: 'acc' }],
      steps: [
        { upto: 10, badge: [8, 'h'], title: 'Mark the level', text: 'The premarket high (PMH) is $101.00. In the first twenty minutes price tests it twice and gets pushed back both times. Sellers are defending it.' },
        { upto: 11, badge: [11, 'h'], title: 'The break', text: 'At 9:52 a candle closes at $101.45, above the level, on about three times the recent volume. A close above matters more than a wick above.' },
        { upto: 15, badge: [14, 'l'], title: 'The retest holds', text: 'Price pulls back for four candles. One wick dips to $100.98, but every candle closes above $101.00. The old ceiling is now acting as a floor.' },
        { upto: 16, badge: [16, 'h'], title: 'Entry, stop and size', text: 'Entry at $101.40 on the green candle that confirms the retest. Stop at $100.85, under the level, so the risk is $0.55 a share. Risking 1% of $25,000 ($250) allows 454 shares.', lines: [{ p: 101.4, label: 'Entry', cls: 'ink', from: 16 }, { p: 100.85, label: 'Stop', cls: 'dn', from: 16 }, { p: 103.0, label: 'Target', cls: 'up', from: 16, hideLabel: true }] },
        { upto: 44, badge: [36, 'h'], title: 'Exit at the next level', text: 'Forty minutes later price reaches the previous day high (PDH) near $103.00. The position closes at $102.90: $1.50 a share, or 2.7 times the risk (+2.7R).', lines: [{ p: 101.4, label: 'Entry', cls: 'ink', from: 16, to: 36 }, { p: 100.85, label: 'Stop', cls: 'dn', from: 16, to: 36 }], exit: [36, 102.9] },
      ],
    };
  }

  SML.widgets.recapChart = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('rc');
    const sc = scenario(opts.kind || 'pmh');
    const N = sc.steps.length;
    let cur = 0, hoverI = -1, lay = null;
    root.innerHTML = `
      <div class="rc-steps">
        <button type="button" class="btn btn-g sm" data-a="prev" aria-label="Previous step">← Prev</button>
        ${ui.seg(id + '-st', sc.steps.map((s, i) => ({ v: String(i), label: String(i + 1) })), '0', 'Step')}
        <button type="button" class="btn btn-p sm" data-a="next">Next →</button>
        <span class="grow" style="flex:1 1 auto"></span>
        <span class="pill acc" id="${id}-pill">Step 1 of ${N}</span>
      </div>
      <div class="wg-fig"></div>
      <div class="rc-cap" id="${id}-cap" aria-live="polite"></div>
      <div class="wg-note">Example prices for teaching. Hover or tap a candle to read its open, high, low and close.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => { cur = Number(st.seg(id + '-st')) || 0; redraw(); });
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b) return; cur = SML.clamp(cur + (b.dataset.a === 'next' ? 1 : -1), 0, N - 1); st.setSeg(id + '-st', cur); redraw(); });

    const slots = []; let prevZ = null;
    sc.bars.forEach((b, i) => { if (prevZ && b.z !== prevZ) slots.push(null); slots.push(i); prevZ = b.z; });
    const allP = []; sc.bars.forEach((b) => allP.push(b.h, b.l)); sc.levels.forEach((l) => allP.push(l.p)); sc.steps.forEach((s) => (s.lines || []).forEach((l) => allP.push(l.p)));
    const lo = Math.min(...allP), hi = Math.max(...allP), pad = (hi - lo) * 0.08;
    const vw = sc.vwap ? (() => { const dd = sc.bars.filter((b) => b.z === 'd'); const v = SML.ind.vwap(dd); const out = {}; let q = 0; sc.bars.forEach((b, i) => { if (b.z === 'd') out[i] = v[q++]; }); return out; })() : null;

    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520; const H = Math.round(SML.clamp(W * 0.52, 290, 400));
      const padL = 4, padR = compact ? 64 : 96, padT = 22, axH = 16, volH = sc.vol ? Math.round(H * 0.13) : 0;
      const plotB = H - axH - volH - (sc.vol ? 8 : 0), plotR = W - padR, plotW = plotR - padL;
      const sw = plotW / slots.length, bw = SML.clamp(sw * 0.62, 2, 11);
      const xi = {}; slots.forEach((bi, j) => { if (bi != null) xi[bi] = padL + (j + 0.5) * sw; });
      const y = SML.lin(lo - pad, hi + pad, plotB, padT);
      const step = sc.steps[cur], upto = step.upto;
      lay = { xi, sw, y, padL, plotR, padT, H, plotB };
      let b = '';
      // zones
      const zr = (z) => { const idx = sc.bars.map((x, i) => (x.z === z ? i : -1)).filter((i) => i >= 0); return idx.length ? [xi[idx[0]] - sw / 2, xi[idx[idx.length - 1]] + sw / 2] : null; };
      const zp = zr('p'); if (zp) { b += S.rect(zp[0], padT - 8, zp[1] - zp[0], plotB - padT + 8, 'f-shade o70'); b += S.text(zp[0] + 4, 13, compact ? 'PRE' : 'PREMARKET', 'cap'); }
      const zy = zr('y'); if (zy) b += S.text(zy[0] + 4, 13, compact ? 'YDAY' : 'YESTERDAY', 'cap');
      const zd = zr('d'); if (zd && (zy || zp)) { b += S.line(zd[0], padT - 8, zd[0], plotB, 's-mut dash2'); b += S.text(zd[0] + 5, 13, 'TODAY', 'cap'); }
      SML.ticks(lo - pad, hi + pad, compact ? 4 : 5).forEach((v) => { const yy = y(v); if (yy < padT - 4 || yy > plotB) return; b += S.line(padL, yy, plotR, yy, 's-grid') + S.text(padL + 3, yy - 3, v.toFixed(v % 1 ? 1 : 0), 'xs mono'); });
      // opening range box
      if (sc.box && cur >= sc.box.step) { const x0 = xi[sc.box.from] - sw / 2, x1 = xi[sc.box.to] + sw / 2; b += S.rect(x0, y(sc.levels[0].p), x1 - x0, y(sc.levels[1].p) - y(sc.levels[0].p), 'f-acc-t o70'); }
      const tags = [];
      sc.levels.forEach((l) => { if (cur < l.from) return; b += S.line(padL, y(l.p), plotR, y(l.p), 's-acc dash w15'); tags.push({ y: y(l.p), t: compact ? l.label.replace('Range ', 'R ') : `${l.label} ${l.p.toFixed(2)}`, cls: 'sm acc b' }); });
      // volume
      if (sc.vol) {
        const base = H - axH, maxV = Math.max(...sc.bars.map((x) => x.v));
        b += S.line(padL, base + 0.5, plotR, base + 0.5, 's-line');
        sc.bars.forEach((x, i) => { if (i > upto) return; const h = (x.v / maxV) * volH; const big = x.z === 'd' && i > 0 && x.v > 1.8 * (sc.bars.slice(Math.max(0, i - 8), i).reduce((q, z) => q + z.v, 0) / Math.min(8, i)); b += S.rect(xi[i] - bw / 2, base - h, bw, h, (x.c >= x.o ? 'f-up' : 'f-dn') + (big ? '' : ' o35')); });
      }
      // step lines
      (step.lines || []).forEach((l) => { const x0 = xi[l.from != null ? l.from : 0] - sw / 2; const x1 = l.to != null ? xi[l.to] + sw / 2 : plotR; b += S.line(x0, y(l.p), x1, y(l.p), `s-${l.cls} ${l.cls === 'ink' ? 'dash2' : 'dash'} w2`); if (!l.hideLabel) tags.push({ y: y(l.p), t: compact ? l.label : `${l.label} ${l.p.toFixed(2)}`, cls: `sm ${l.cls} b` }); });
      if (step.lines && step.lines[0] && step.lines[1] && cur === 3 && (opts.kind || 'pmh') === 'pmh') { const x0 = xi[16] - sw / 2; b += S.rect(x0, y(101.4), plotR - x0, y(100.85) - y(101.4), 'f-dn-t o70') + S.rect(x0, y(103), plotR - x0, y(101.4) - y(103), 'f-up-t o50'); }
      // candles
      sc.bars.forEach((x, i) => { if (i > upto) return; const kk = x.c >= x.o ? 'up' : 'dn', dim = x.z === 'y' ? ' o70' : ''; const t = y(Math.max(x.o, x.c)), bt = y(Math.min(x.o, x.c)); b += S.line(xi[i], y(x.h), xi[i], y(x.l), `wk ${kk}${dim}`) + S.rect(xi[i] - bw / 2, t, bw, Math.max(1.4, bt - t), `bd ${kk}${dim}`, bw > 6 ? 1 : 0); });
      // vwap
      if (vw) { const pts = []; Object.keys(vw).forEach((i) => { if (Number(i) <= upto) pts.push([xi[i], y(vw[i])]); }); if (pts.length > 1) { b += S.poly(pts, 's-info w2'); tags.push({ y: pts[pts.length - 1][1], t: 'VWAP', cls: 'sm info b' }); } }
      // plan notes
      if (step.plan) {
        const lv = (nm) => sc.levels.find((l) => l.label === nm).p; const xN = (zp ? zp[1] : padL) + 12;
        const notes = [[lv('PMH') + (hi - lv('PMH')) * 0.45, 'Holds above PMH: look for a long', 'up'], [(lv('PMH') + lv('PML')) / 2, 'Between: wait', 'mut'], [lv('PML') - (lv('PML') - lo) * 0.35, 'Loses PML: look for a short', 'dn']];
        notes.forEach(([p, t, cls]) => { const yy = y(p); const tw = Math.min(plotR - xN - 6, t.length * 6.6 + 18); b += S.rect(xN, yy - 12, tw, 22, cls === 'mut' ? 'f-surf s-line' : `f-${cls}-t`, 4) + S.text(xN + 9, yy + 4, compact ? t.replace('look for a ', '').replace('Holds above', 'Above').replace('Loses', 'Below') : t, `sm b ${cls === 'mut' ? 'ink' : cls}`); });
      }
      // failed chase marker
      if (step.x) { const [i, p] = step.x; const xx = xi[i], yy = y(p); b += S.line(xx - 5, yy - 5, xx + 5, yy + 5, 's-dn w25') + S.line(xx - 5, yy + 5, xx + 5, yy - 5, 's-dn w25'); }
      if (step.exit) { const [i, p] = step.exit; b += S.circle(xi[i], y(p), 5, 'f-up s-surf w15'); }
      // badges up to current step
      sc.steps.forEach((s, q) => { if (q > cur || !s.badge) return; const [i, at] = s.badge; const bar = sc.bars[i]; const yy = at === 'h' ? y(bar.h) - 14 : y(bar.l) + 14; b += S.badge(xi[i], yy, q + 1, q === cur ? 'f-acc' : 'f-mut'); });
      // right tags
      tags.sort((a, c) => a.y - c.y); for (let q = 1; q < tags.length; q++) if (tags[q].y - tags[q - 1].y < 14) tags[q].y = tags[q - 1].y + 14;
      const over = tags.length ? tags[tags.length - 1].y - (plotB + 2) : 0; if (over > 0) tags.forEach((t) => (t.y -= over));
      tags.forEach((t) => (b += S.text(plotR + 6, t.y + 4, t.t, t.cls)));
      // time axis
      sc.bars.forEach((x, i) => { if (x.z === 'd' && x.t % 30 === 0) b += S.text(xi[i], H - 3, F.time(x.t), 'xs mono', 'middle'); });
      b += `<g id="${id}-hov"></g>`;
      fig.innerHTML = S.wrap(W, H, `Example chart, step ${cur + 1}: ${step.title}`, b);
      if (hoverI >= 0) hov(hoverI);
    });
    function hov(i) {
      const g = $('#' + id + '-hov', fig); if (!g || !lay) return; const step = sc.steps[cur];
      if (i < 0 || i > step.upto || lay.xi[i] == null) { g.innerHTML = ''; return; }
      const x = sc.bars[i], xx = lay.xi[i]; const tl = x.z === 'd' ? F.time(x.t) : x.z === 'p' ? 'Premarket' : 'Yesterday';
      const lines = [tl, `O ${x.o.toFixed(2)}  H ${x.h.toFixed(2)}`, `L ${x.l.toFixed(2)}  C ${x.c.toFixed(2)}`];
      const bw = 128, bh = 54; let bx = xx + 12; if (bx + bw > lay.plotR) bx = xx - 12 - bw; bx = Math.max(lay.padL, bx);
      g.innerHTML = S.line(xx, lay.padT - 6, xx, lay.plotB, 's-mut dash2') + S.rect(bx, lay.padT, bw, bh, 'tipbg', 4) + lines.map((t, q) => S.text(bx + 8, lay.padT + 16 + q * 15, t, q ? 'sm mono ink' : 'sm ink b')).join('');
    }
    fig.addEventListener('pointermove', (e) => { const svg = $('svg', fig); if (!svg || !lay) return; const p = ui.pt(svg, e); let best = -1, bd = 1e9; Object.keys(lay.xi).forEach((i) => { const d = Math.abs(lay.xi[i] - p.x); if (d < bd) { bd = d; best = Number(i); } }); hoverI = bd < lay.sw ? best : -1; hov(hoverI); });
    fig.addEventListener('pointerleave', () => { hoverI = -1; hov(-1); });
    function redraw() {
      draw();
      const s = sc.steps[cur];
      $('#' + id + '-cap', root).innerHTML = `<b>${cur + 1}. ${s.title}</b><p>${s.text}</p>`;
      $('#' + id + '-pill', root).textContent = `Step ${cur + 1} of ${N}`;
      $('[data-a="prev"]', root).disabled = cur === 0; $('[data-a="next"]', root).disabled = cur === N - 1;
    }
    redraw();
  };

  /* =====================================================================
     WHEEL TIMELINE: one full turn of the wheel, step by step
     ===================================================================== */
  SML.widgets.wheelTimeline = function (root) {
    const id = SML.uid('wt');
    const mk = (A, seed, pins) => { const p = SML.data.path(A, 61, seed, 0.16); Object.keys(pins).forEach((d) => (p[d] = pins[d])); return p; };
    const paths = {
      base: mk([[0, 40], [8, 39.3], [14, 38.4], [20, 36.6], [26, 37.3], [33, 38.2], [40, 38.6], [46, 39.1], [53, 39.8], [60, 40.2]], 61, { 0: 40, 20: 36.6, 40: 38.6, 60: 40.2 }),
      crash: mk([[0, 40], [8, 39.1], [14, 37.6], [20, 36.6], [26, 35.1], [33, 33.8], [40, 33.2], [46, 32.2], [53, 31.5], [60, 31.0]], 62, { 0: 40, 20: 36.6, 40: 33.2, 60: 31.0 }),
    };
    const plans = {
      base: [
        { d: 0, title: 'Sell a cash-secured put', text: 'The stock is at $40. Sell one put with a $38 strike that expires in about 20 trading days, for $0.85 a share. You collect $85 and set aside $3,800 in case you must buy 100 shares.', prem: 85, opt: { k: 38, t: 'Put', from: 0, to: 20 } },
        { d: 20, title: 'Assigned at $38', text: 'At expiry the stock is $36.60, below the strike, so you buy 100 shares at $38. Your real cost is $38 minus the $0.85 premium: $37.15 a share.', assign: true },
        { d: 20, title: 'Sell a covered call', text: 'Now you own the shares, so you sell a $39 call for $0.70 ($70). If the stock is above $39 at expiry, your shares get sold at $39. Cost basis drops to $36.45.', prem: 70, opt: { k: 39, t: 'Call', from: 20, to: 40 } },
        { d: 40, title: 'Call expires, sell another', text: 'The stock ends at $38.60, under $39, so the call expires and you keep the shares and the $70. You sell another $39 call for $0.65 ($65). Cost basis: $35.80.', prem: 65, opt: { k: 39, t: 'Call', from: 40, to: 60 } },
        { d: 60, title: 'Called away at $39', text: 'The stock finishes at $40.20, above $39, so your 100 shares are sold at $39. Total: $220 of premium plus $100 of share gain = $320 on $3,800 of capital, about 8.4% in three months.', called: true },
      ],
      crash: [
        { d: 0, title: 'Sell a cash-secured put', text: 'Same start: sell the $38 put for $0.85 and collect $85, with $3,800 set aside.', prem: 85, opt: { k: 38, t: 'Put', from: 0, to: 20 } },
        { d: 20, title: 'Assigned at $38', text: 'The stock is $36.60 at expiry. You buy 100 shares at $38. Cost basis $37.15.', assign: true },
        { d: 20, title: 'Sell a covered call', text: 'The stock keeps sliding. A $39 call now pays only $0.20 ($20) because it is far above the price. Cost basis: $36.95.', prem: 20, opt: { k: 39, t: 'Call', from: 20, to: 40 } },
        { d: 40, title: 'Call expires, premiums shrink', text: 'At $33.20 the next $39 call pays just $0.10 ($10). Selling a call below your cost would lock in a loss if the shares were called away.', prem: 10, opt: { k: 39, t: 'Call', from: 40, to: 60 } },
        { d: 60, title: 'Still holding at $31', text: 'Three months later you still own shares worth $3,100 that cost $3,800. Premiums of $115 soften the $700 drop. The wheel does not protect you from a falling stock.', end: true },
      ],
    };
    let mode = 'base', cur = 0, hovD = -1, lay = null;
    root.innerHTML = `
      <div class="rc-steps">
        ${ui.seg(id + '-m', [{ v: 'base', label: 'As it played out' }, { v: 'crash', label: 'If the stock kept falling' }], 'base', 'Scenario')}
        <span class="grow" style="flex:1 1 auto"></span>
        <button type="button" class="btn btn-g sm" data-a="prev">← Prev</button>
        ${ui.seg(id + '-st', [0, 1, 2, 3, 4].map((i) => ({ v: String(i), label: String(i + 1) })), '0', 'Step')}
        <button type="button" class="btn btn-p sm" data-a="next">Next →</button>
      </div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Premium collected', id + '-pr', 'hl')}${ui.stat('Holding', id + '-hd')}${ui.stat('Cost basis / share', id + '-cb')}${ui.stat('Total P/L so far', id + '-pl')}</div>
      <div class="rc-cap" id="${id}-cap" aria-live="polite"></div>
      <div class="wg-note">Example numbers on a made-up $40 stock, one contract (100 shares). Hover the chart to read any day.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, (e) => { const nm = st.seg(id + '-m'); if (nm !== mode) { mode = nm; } cur = Number(st.seg(id + '-st')) || 0; redraw(); });
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b) return; cur = SML.clamp(cur + (b.dataset.a === 'next' ? 1 : -1), 0, 4); st.setSeg(id + '-st', cur); redraw(); });
    function state() {
      const P = plans[mode], path = paths[mode]; let prem = 0, shares = 0, cost = 0, realized = 0;
      for (let q = 0; q <= cur; q++) { const s = P[q]; if (s.prem) prem += s.prem; if (s.assign) { shares = 100; cost = 3800; } if (s.called) { realized = 3900 - cost; shares = 0; } }
      const d = P[cur].d, px = path[d];
      const unreal = shares ? px * 100 - cost : 0;
      return { prem, shares, basis: shares ? (cost - prem) / 100 : null, pl: prem + realized + unreal, d, px, called: P[cur].called };
    }
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520; const H = Math.round(SML.clamp(W * 0.48, 260, 360));
      const padL = 34, padR = compact ? 70 : 92, padT = 18, padB = 26, plotR = W - padR;
      const path = paths[mode], P = plans[mode], s = state();
      const x = SML.lin(0, 60, padL, plotR), y = SML.lin(mode === 'crash' ? 29.5 : 35.2, 41.2, H - padB, padT);
      lay = { x, y, padT, H, padB, plotR, path };
      let b = '';
      SML.ticks(mode === 'crash' ? 29.5 : 35.2, 41.2, 5).forEach((v) => { b += S.line(padL, y(v), plotR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, '$' + v, 'xs mono', 'end'); });
      for (let w = 0; w <= 12; w += compact ? 4 : 2) b += S.text(x(w * 5), H - 8, w === 0 ? 'Week 0' : 'Wk ' + w, 'xs mono', 'middle');
      // holding shares shading
      const aIdx = P.findIndex((q) => q.assign); if (aIdx >= 0 && cur >= aIdx) { const endD = s.called ? 60 : Math.max(P[cur].d, P[aIdx].d); b += S.rect(x(P[aIdx].d), padT, x(endD) - x(P[aIdx].d), H - padB - padT, 'f-vio-t o50'); if (!compact) b += S.text(x(P[aIdx].d) + 6, padT + 13, 'holding 100 shares', 'sm vio'); }
      const tags = [];
      // option strikes
      const seenK = {}; P.forEach((q, i) => { if (i > cur || !q.opt) return; const o = q.opt; b += S.line(x(o.from), y(o.k), x(o.to), y(o.k), `${o.t === 'Put' ? 's-dn' : 's-up'} dash w2`); const key = o.t + o.k; if (!seenK[key]) { seenK[key] = 1; b += S.text(x(o.from) + 4, y(o.k) - 6, `${o.t} strike $${o.k}`, `sm b ${o.t === 'Put' ? 'dn' : 'up'}`); } });
      // basis line
      { const bas = []; let prem = 0, held = false;
        for (let i = 0; i <= cur; i++) { const q = P[i]; if (q.prem) prem += q.prem; if (q.assign) held = true; if (held) bas.push([q.d, (3800 - prem) / 100]); }
        if (bas.length) {
          const pts = []; bas.forEach(([d, v], i) => { if (i) pts.push([x(d), y(bas[i - 1][1])]); pts.push([x(d), y(v)]); });
          const endX = Math.max(x(P[cur].d), pts[pts.length - 1][0] + 18); pts.push([Math.min(endX, plotR), pts[pts.length - 1][1]]);
          b += S.poly(pts, 's-vio w2'); tags.push({ y: pts[pts.length - 1][1], t: compact ? 'Basis' : 'Cost basis', cls: 'sm vio b' });
        } }
      // future faint path + revealed path
      b += S.poly(path.map((v, d) => [x(d), y(v)]), 's-line w15 dash2');
      b += S.poly(path.slice(0, s.d + 1).map((v, d) => [x(d), y(v)]), 's-ink w2');
      tags.push({ y: y(s.px), t: '$' + s.px.toFixed(2), cls: 'sm ink b mono' });
      // badges
      P.forEach((q, i) => { if (i > cur) return; const off = i === 2 ? 18 : i === 1 ? -18 : -16; b += S.circle(x(q.d), y(path[q.d]), 3.5, 'f-ink') + S.badge(x(q.d) + (i === 2 ? 14 : 0), y(path[q.d]) + off, i + 1, i === cur ? 'f-acc' : 'f-mut'); });
      tags.sort((a, c) => a.y - c.y); for (let q = 1; q < tags.length; q++) if (tags[q].y - tags[q - 1].y < 14) tags[q].y = tags[q - 1].y + 14;
      tags.forEach((t) => (b += S.text(plotR + 8, t.y + 4, t.t, t.cls)));
      b += `<g id="${id}-hov"></g>`;
      fig.innerHTML = S.wrap(W, H, `Wheel example on a $40 stock, step ${cur + 1}: ${P[cur].title}`, b);
      if (hovD >= 0) hov(hovD);
    });
    function hov(d) { const g = $('#' + id + '-hov', fig); if (!g || !lay) return; if (d < 0 || d > state().d) { g.innerHTML = ''; return; } const xx = lay.x(d), v = lay.path[d]; const bx = Math.max(2, xx + 110 > lay.plotR ? xx - 108 : xx + 8); g.innerHTML = S.line(xx, lay.padT, xx, lay.H - lay.padB, 's-mut dash2') + S.circle(xx, lay.y(v), 4, 'f-acc') + S.rect(bx, lay.padT, 100, 38, 'tipbg', 4) + S.text(bx + 8, lay.padT + 15, `Day ${d}`, 'sm ink b') + S.text(bx + 8, lay.padT + 30, '$' + v.toFixed(2), 'sm mono ink'); }
    fig.addEventListener('pointermove', (e) => { const svg = $('svg', fig); if (!svg || !lay) return; const p = ui.pt(svg, e); hovD = Math.round(SML.clamp(lay.x.inv(p.x), 0, 60)); hov(hovD); });
    fig.addEventListener('pointerleave', () => { hovD = -1; hov(-1); });
    function redraw() {
      draw(); const s = state(), P = plans[mode][cur];
      $('#' + id + '-pr', root).textContent = F.usd0(s.prem);
      $('#' + id + '-hd', root).textContent = s.called ? 'Cash $3,900' : s.shares ? '100 shares' : 'Cash $3,800';
      $('#' + id + '-cb', root).textContent = s.basis != null ? F.usd(s.basis) : '—';
      const pl = $('#' + id + '-pl', root); pl.textContent = F.susd(s.pl, 0); pl.className = 'stat-v ' + (s.pl >= 0 ? 'up' : 'dn');
      $('#' + id + '-cap', root).innerHTML = `<b>${cur + 1}. ${P.title}</b><p>${P.text}</p>`;
      $('[data-a="prev"]', root).disabled = cur === 0; $('[data-a="next"]', root).disabled = cur === 4;
    }
    redraw();
  };

  /* =====================================================================
     TAX-LOSS HARVEST CHECKLIST (blog)
     ===================================================================== */
  SML.widgets.tlhChecklist = function (root) {
    const id = SML.uid('th');
    const GAINS = 6200;
    const pos = [{ t: 'DEMO-B', l: 2400, n: 'Down 18% since March', on: true }, { t: 'DEMO-C', l: 1800, n: 'Down 31% since January', on: true }, { t: 'DEMO-D', l: 900, n: 'Down 9% since August', on: false }];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Your year so far</span><span class="grow"></span><span class="tr-grp-l">Tax bracket</span>${ui.seg(id + '-br', ['12', '22', '24', '32'].map((v) => ({ v, label: v + '%' })), '24', 'Tax bracket')}</div>
      <div>
        <div class="tl-row"><span class="pill up">Gain</span><span class="nm">Short-term gains already taken<small>Sold earlier in the year</small></span><span class="num up">${F.susd(GAINS, 0)}</span></div>
        ${pos.map((p, i) => `<label class="tl-row" for="${id}-p${i}"><input type="checkbox" class="tl-tog" id="${id}-p${i}" data-i="${i}"${p.on ? ' checked' : ''}><span class="nm">Sell ${p.t} at a loss<small>${p.n}</small></span><span class="num dn">${F.susd(-p.l, 0)}</span></label>`).join('')}
      </div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Losses harvested', id + '-lh')}${ui.stat('Taxable gain left', id + '-tg')}${ui.stat('Carried to next year', id + '-cf')}${ui.stat('Estimated tax saved', id + '-ts', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Sample data with made-up tickers. Assumes all gains and losses are short-term and taxed at your bracket. Not tax advice.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => redraw());
    root.addEventListener('change', (e) => { if (e.target.classList.contains('tl-tog')) { pos[Number(e.target.dataset.i)].on = e.target.checked; redraw(); } });
    function calc() {
      pos.forEach((p, i) => { const el = $('#' + id + '-p' + i, root); if (el) p.on = el.checked; });
      const L = pos.reduce((s, p) => s + (p.on ? p.l : 0), 0); const net = GAINS - L; const rate = Number(st.seg(id + '-br')) / 100;
      const taxable = Math.max(0, net), ded = net < 0 ? Math.min(3000, -net) : 0, carry = net < 0 ? -net - ded : 0;
      return { L, net, taxable, ded, carry, saved: rate * (Math.min(L, GAINS) + ded), rate };
    }
    const draw = ui.responsive(fig, (W) => {
      const c = calc(), cp = W < 460; const rows = [[cp ? 'Gains' : 'Gains taken', GAINS, 'f-up'], [cp ? 'Harvested' : 'Losses harvested', -c.L, 'f-dn'], [cp ? 'Taxable' : 'Taxable gain', c.taxable, 'f-acc']];
      if (c.ded) rows.push([cp ? 'Cuts income' : 'Cuts other income', -c.ded, 'f-info']); if (c.carry) rows.push([cp ? 'Carried' : 'Carried forward', c.carry, 'f-mut']);
      const lw = cp ? 92 : 140, rowH = 30, H = rows.length * rowH + 16; const x = SML.lin(0, 6200, lw, W - 70);
      let b = '';
      rows.forEach((r, i) => { const yy = 8 + i * rowH; const w = x(Math.abs(r[1])) - lw; b += S.text(lw - 10, yy + 17, r[0], 'md ink', 'end') + S.rect(lw, yy + 4, Math.max(2, w), 20, r[2], 3) + S.text(lw + Math.max(2, w) + 6, yy + 18, F.usd0(r[1]), 'sm mono ink b'); });
      fig.innerHTML = S.wrap(W, H, 'Bars comparing gains taken, losses harvested and what is left to tax', b);
    });
    function redraw() {
      draw(); const c = calc();
      $('#' + id + '-lh', root).textContent = F.usd0(c.L); $('#' + id + '-tg', root).textContent = F.usd0(c.taxable); $('#' + id + '-cf', root).textContent = F.usd0(c.carry); $('#' + id + '-ts', root).textContent = F.usd0(c.saved);
      $('#' + id + '-msg', root).innerHTML = c.L === 0 ? ui.msg('', 'Idle', 'No losses harvested yet. Toggle a losing position to sell it before December 31.')
        : ui.msg('acc', 'Wash sale', `If these sales happen on Dec 15, 2026, do not buy the same or a substantially identical stock before Jan 15, 2027, in any account including IRAs. Otherwise the loss is deferred.${c.carry ? ' Losses beyond your gains and the $3,000 limit carry forward to 2027.' : ''}`);
    }
    redraw();
  };

  /* =====================================================================
     BLOG: sample posts + index + post pages
     ===================================================================== */
  const W = (name, o) => SML.widgetHTML(name, o);
  const thumbs = {
    pmh: () => {
      let b = S.rect(0, 0, 320, 180, 'f-paper');
      for (let i = 0; i < 9; i++) b += S.line(0, 20 * i, 320, 20 * i, 's-grid');
      b += S.line(14, 96, 306, 96, 's-acc dash w2') + S.text(300, 88, 'PMH', 'sm acc b', 'end');
      const c = [[104, 112, 118, 98], [112, 103, 116, 100], [103, 108, 112, 99], [108, 99, 112, 97], [99, 104, 108, 98], [104, 76, 106, 72], [76, 86, 90, 72], [86, 93, 98, 82], [93, 90, 99, 86], [90, 74, 92, 70], [74, 62, 78, 58], [62, 52, 66, 48], [52, 44, 56, 40], [44, 36, 48, 30]];
      c.forEach((q, i) => { const x = 30 + i * 19, [o, cl, lo, hi] = q, up = cl < o; b += S.line(x, hi, x, lo, 'wk ' + (up ? 'up' : 'dn')) + S.rect(x - 5, Math.min(o, cl), 10, Math.max(2, Math.abs(o - cl)), 'bd ' + (up ? 'up' : 'dn'), 1); });
      b += S.badge(125, 60, 1) + S.badge(182, 112, 2) + S.badge(258, 36, 3);
      return S.box(320, 180, 'Candles breaking above a dashed premarket-high line, retesting it, then rising', b);
    },
    wheel: () => {
      let b = S.rect(0, 0, 320, 180, 'f-paper');
      b += S.path('M110,60 C130,22 190,22 210,60', 'nf s-ink w2') + S.polygon([[210, 60], [201, 52], [213, 50]], 'f-ink');
      b += S.path('M210,120 C190,158 130,158 110,120', 'nf s-ink w2') + S.polygon([[110, 120], [119, 128], [107, 130]], 'f-ink');
      b += S.rect(44, 66, 96, 48, 'f-info-t s-info w2', 6) + S.text(92, 95, 'CASH', 'lg ink b', 'middle');
      b += S.rect(180, 66, 96, 48, 'f-acc-t s-acc w2', 6) + S.text(228, 95, 'SHARES', 'lg ink b', 'middle');
      b += S.text(160, 22, 'sell put', 'sm b', 'middle') + S.text(160, 170, 'sell call', 'sm b', 'middle');
      return S.box(320, 180, 'The wheel: cash turns into shares through a put, shares turn back into cash through a call', b);
    },
    open: () => {
      let b = S.rect(0, 0, 320, 180, 'f-paper');
      b += S.rect(20, 18, 74, 150, 'f-dn-t o70') + S.text(57, 32, '9:30', 'sm dn b', 'middle');
      const c = [[90, 40, 150, 34], [40, 140, 150, 30], [140, 110, 146, 96], [110, 118, 124, 104], [118, 108, 122, 102], [108, 114, 118, 104], [114, 110, 116, 106], [110, 112, 116, 106], [112, 92, 114, 88], [92, 86, 96, 80], [86, 72, 90, 68], [72, 66, 76, 60], [66, 58, 70, 54]];
      c.forEach((q, i) => { const x = 34 + i * 22, [o, cl, lo, hi] = q, up = cl < o; b += S.line(x, hi, x, lo, 'wk ' + (up ? 'up' : 'dn')) + S.rect(x - 6, Math.min(o, cl), 12, Math.max(2, Math.abs(o - cl)), 'bd ' + (up ? 'up' : 'dn'), 1); });
      b += S.line(100, 101, 220, 101, 's-acc dash w15') + S.line(100, 125, 220, 125, 's-acc dash w15');
      return S.box(320, 180, 'Wild first candles at 9:30 followed by a calm range and a clean break', b);
    },
    tax: () => {
      let b = S.rect(0, 0, 320, 180, 'f-paper') + S.rect(24, 22, 150, 136, 'f-surf s-line', 6) + S.rect(24, 22, 150, 26, 'f-dn', 6) + S.rect(24, 40, 150, 8, 'f-dn') + S.text(99, 40, 'DECEMBER', 'sm on b', 'middle');
      for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) { const n = r * 7 + q - 1; if (n < 1 || n > 31) continue; const x = 34 + q * 20, y = 66 + r * 19; b += n === 31 ? S.circle(x + 4, y - 4, 9, 'f-acc') + S.text(x + 4, y, '31', 'xs onacc b', 'middle') : S.text(x + 4, y, String(n), 'xs mono', 'middle'); }
      b += S.rect(198, 60, 26, 98, 'f-up', 2) + S.rect(234, 60, 26, 62, 'f-dn', 2) + S.rect(270, 122, 26, 36, 'f-acc', 2) + S.line(190, 158.5, 304, 158.5, 's-line');
      return S.box(320, 180, 'December calendar with the 31st circled, next to bars showing gains reduced by harvested losses', b);
    },
    routine: () => {
      let b = S.rect(0, 0, 320, 180, 'f-paper') + S.circle(86, 92, 58, 'f-surf s-ink w2');
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; b += S.line(86 + Math.sin(a) * 50, 92 - Math.cos(a) * 50, 86 + Math.sin(a) * 56, 92 - Math.cos(a) * 56, 's-ink w15'); }
      b += S.path('M86,92 L86,34 A58,58 0 0 1 120,45 Z', 'f-acc-t') + S.line(86, 92, 86, 50, 's-ink w3') + S.line(86, 92, 112, 76, 's-acc w3') + S.circle(86, 92, 4, 'f-ink');
      [['PDH', 40], ['PMH', 72], ['PML', 112], ['PDL', 144]].forEach(([t, y]) => { b += S.line(170, y, 300, y, 's-acc dash w15') + S.text(300, y - 5, t, 'sm acc b', 'end'); });
      return S.box(320, 180, 'A clock showing ten minutes next to four marked price levels', b);
    },
  };

  SML.posts.push(
    {
      id: 'post-pmh-retest', featured: true, title: 'Breakdown: a premarket-high break and retest', date: '2026-10-14', tag: 'Trade breakdown', mins: 5, thumb: thumbs.pmh(),
      excerpt: 'The most common day-trade setup, one candle at a time: a clean break of the premarket high, a retest that holds, and a stop that defines the risk before the trade starts.',
      related: ['l-levels', 'l-breakouts', 'l-volume', 'l-position-size'],
      body: `
        <p>Most intraday setups are versions of one idea. Price leaves a level, comes back to test it, and the level holds. This breakdown walks through that idea on a 2-minute chart, one candle at a time. Step through the chart, then read the notes below it.</p>
        ${W('recapChart', { kind: 'pmh' })}
        <h2>1. Mark the level before the open</h2>
        <p>The premarket high (PMH) at $101.00 is the highest price traded before 9:30. Traders who bought there and traders who sold there both remember it, so price often reacts at it. In the first twenty minutes price tested $101.00 twice and was turned away both times.</p>
        <h2>2. The break</h2>
        <p>At 9:52 a candle closed at $101.45, above the level, on about three times the recent volume. A close above the level matters more than a wick above it: it shows buyers held the price there for the full two minutes.</p>
        <h2>3. The retest</h2>
        <p>Breakouts often pull back. Over the next four candles price dipped as low as $100.98, but every candle closed back above $101.00. The old ceiling was now acting as a floor.</p>
        <h2>4. Entry, stop and size</h2>
        <p>The entry came on the green candle that confirmed the retest, at $101.40. The stop went just under the level at $100.85, because a close back below $101.00 would mean the idea was wrong. That is $0.55 of risk per share. Risking 1% of a $25,000 account ($250) allows 454 shares.</p>
        <h2>5. The exit</h2>
        <p>The next level above was the previous day high (PDH) near $103.00. Price reached it forty minutes later and the position was closed at $102.90. That is $1.50 per share, or 2.7 times the amount risked (+2.7R).</p>
        <h2>What would have cancelled the trade</h2>
        <ul><li>A break on weak volume.</li><li>A retest candle that closed back below $101.00.</li><li>Price sitting below VWAP at the time of entry.</li></ul>
        <p>Not every retest works. The stop exists so the losers stay small, which lets a handful of clean winners like this one carry the month. Practise spotting this pattern in the <a href="#play">trade replay</a>.</p>`,
    },
    {
      id: 'post-wheel-40', title: 'One full turn of the wheel on a $40 stock', date: '2026-10-07', tag: 'Wheel log', mins: 6, thumb: thumbs.wheel(),
      excerpt: 'A cash-secured put, an assignment, two covered calls and a called-away exit: every step of the wheel with example numbers, plus what happens when the stock keeps falling.',
      related: ['l-wheel', 'l-payoff', 'l-theta', 'l-contracts'],
      body: `
        <p>The wheel is a loop of two option trades. You sell puts until you are assigned shares, then sell calls on those shares until they are sold. Each sale pays you a premium. This example follows one full turn on a made-up $40 stock with one contract (100 shares). Switch to the second scenario to see the risk.</p>
        ${W('wheelTimeline')}
        <h2>Step 1: the cash-secured put</h2>
        <p>With the stock at $40, you sell one put with a $38 strike for $0.85 a share, which is $85 for the contract. In exchange you promise to buy 100 shares at $38 if the stock is below $38 at expiry, so you keep $3,800 in cash set aside. That cash is what makes the put "cash-secured".</p>
        <h2>Step 2: assignment</h2>
        <p>At expiry the stock is $36.60. You buy 100 shares at $38. Your effective cost is $38 minus the $0.85 you already collected: $37.15 a share. The shares are worth less than you paid today, which is the trade-off you accepted when you sold the put.</p>
        <h2>Steps 3 and 4: covered calls</h2>
        <p>Now you sell a $39 call for $0.70. If the stock ends above $39, your shares are sold at $39. It ends at $38.60, so the call expires and you keep both the shares and the $70. You sell another $39 call for $0.65. Each premium lowers your cost basis: $36.45, then $35.80.</p>
        <h2>Step 5: called away</h2>
        <p>The stock finishes at $40.20 and your shares are sold at $39. Add it up: $85 + $70 + $65 = $220 of premium, plus $100 of share gain ($38 to $39). That is $320 on $3,800 of capital in about three months, roughly 8.4%. Simply holding 100 shares from $40 would have made $20.</p>
        <h2>The other path</h2>
        <p>If the stock had kept falling to $31, you would still own shares bought at $38. Call premiums shrink as the price drops away from your strike, and selling calls below your cost basis risks locking in a loss. Premiums of $115 would soften a $700 drop. The wheel turns a falling stock into a slower loss, not into a gain.</p>
        <h2>Rules that keep the wheel safe</h2>
        <ul><li>Only wheel stocks you would be happy to own for years.</li><li>Size it so one assignment is a small part of your account.</li><li>Pick put strikes at or below support, where you would want to buy anyway.</li><li>Avoid selling through earnings unless you accept a big gap.</li></ul>`,
    },
    {
      id: 'post-first-five', title: 'Why the first five minutes are a trap', date: '2026-09-30', tag: 'Guide', mins: 4, thumb: thumbs.open(),
      excerpt: 'Spreads are wide, overnight orders all hit at once and the first candle often reverses. Here is what happens at 9:30 and a simple way to wait it out.',
      related: ['l-game-plan', 'l-breakouts', 'l-orders', 'l-psychology'],
      body: `
        <p>The first minutes after 9:30 ET are the busiest of the day. Orders that piled up overnight all execute at once, market makers widen their bid-ask spreads to protect themselves, and news from the night before is still being priced in. The result is big candles that look like breakouts and often are not.</p>
        ${W('recapChart', { kind: 'open' })}
        <h2>What makes the open so noisy</h2>
        <ul><li><b>Wide spreads.</b> The gap between the bid and the ask is often several times its midday size, so a market order fills at a worse price.</li><li><b>Order imbalance.</b> A rush of buy or sell orders can push price far in one direction before the other side shows up.</li><li><b>Fast reversals.</b> When that rush is done, price often snaps back, stopping out whoever chased it.</li></ul>
        <h2>A simple rule: let a range form</h2>
        <p>Many day traders do nothing for the first 5 to 15 minutes. They let the opening range form, mark its high and low, and only trade a break of that range with volume and price on the right side of VWAP. You give up a few cents of the move and gain a clear level to put your stop behind.</p>
        <h2>Try it in the replay</h2>
        <p>The <a href="#play">trade replay</a> scorecard checks whether you waited out the first 5 minutes. Play a few sessions both ways and compare your results.</p>`,
    },
    {
      id: 'post-tax-loss-checklist', title: 'December tax-loss harvesting checklist', date: '2026-10-16', tag: 'Checklist', mins: 5, thumb: thumbs.tax(),
      excerpt: 'Selling losers before December 31 can cut this year’s tax bill. Use this checklist, and toggle positions in the example to see how gains, losses and the $3,000 limit interact.',
      related: ['l-tax-loss', 'l-wash-sale', 'l-cap-gains'],
      body: `
        <p>Tax-loss harvesting means selling investments that are worth less than you paid to realize the loss, so it can cancel out gains you have already taken. It does not make the loss go away. It moves a tax benefit into this year. Toggle the positions below to see the effect.</p>
        ${W('tlhChecklist')}
        <h2>The checklist</h2>
        <ul>
          <li><b>Add up gains you already realized this year.</b> Your broker’s realized gain/loss report shows them, split into short-term and long-term.</li>
          <li><b>List positions with unrealized losses.</b> Ask whether you still want to own each one. Harvesting works best on positions you would sell anyway.</li>
          <li><b>Sell by the last trading day of the year.</b> For losses, the trade date counts, so a sale on December 31, 2026 counts for 2026.</li>
          <li><b>Respect the wash sale window.</b> Buying the same or a substantially identical security 30 days before or after the sale defers the loss. Purchases in IRAs and a spouse’s accounts count too.</li>
          <li><b>Swap, do not repurchase.</b> If you want to stay invested, buy something similar but not substantially identical for 31 days.</li>
          <li><b>Remember the $3,000 limit.</b> Net losses beyond your gains reduce ordinary income by up to $3,000 a year ($1,500 if married filing separately). The rest carries forward.</li>
          <li><b>Keep records and ask a tax professional</b> before acting on large amounts.</li>
        </ul>
        <p>This checklist is general education about US rules as of 2026, not tax advice.</p>`,
    },
    {
      id: 'post-premarket-routine', title: 'A 10-minute premarket routine', date: '2026-09-23', tag: 'Guide', mins: 4, thumb: thumbs.routine(),
      excerpt: 'Four levels, one if-then plan and a daily loss limit. A short routine that means you never make a decision in a rush at 9:30.',
      related: ['l-levels', 'l-game-plan', 'l-stock-picking'],
      body: `
        <p>Good trading days are mostly decided before the bell. A routine turns the open from a scramble into a checklist. This one takes about ten minutes. Step through the chart to see what each part adds.</p>
        ${W('recapChart', { kind: 'levels' })}
        <h2>Minutes 0 to 3: news and calendar</h2>
        <p>Check the economic calendar and any earnings reports for the stocks you follow. A scheduled number at 8:30 or 10:00 can move everything at once.</p>
        <h2>Minutes 3 to 5: mark the four levels</h2>
        <p>On each stock, draw the previous day high and low (PDH, PDL) and the premarket high and low (PMH, PML). These are where the day’s first reactions usually happen.</p>
        <h2>Minutes 5 to 7: pick two to four stocks</h2>
        <p>Choose stocks that trade millions of shares a day, have a tight bid-ask spread and a reason to move today. Fewer stocks means you actually watch them.</p>
        <h2>Minutes 7 to 9: write the if-then plan</h2>
        <p>One line per scenario. If price holds above PMH, look for a long on a retest. If it loses PML, look for a short. If it stays between, do nothing.</p>
        <h2>Minute 10: set your limits</h2>
        <p>Write your maximum loss for the day, for example 3% of the account or three losing trades. When you hit it, you stop. You can copy a ready-made watchlist and levels sheet from the <a href="#sheets">spreadsheets page</a>.</p>`,
    }
  );

  const byDate = () => SML.posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const dShort = (iso) => SML.fmtDate ? SML.fmtDate(iso) : fmtDate(iso);
  const dLong = (iso) => SML.fmtDate ? SML.fmtDate(iso, true) : fmtDate(iso);
  const UR = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  const BK = '<svg class="ico" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
  SML.css(`
.bf{display:grid;gap:40px;padding-block:56px;border-bottom:1px solid var(--line);text-decoration:none;color:inherit;align-items:center}
@media (min-width:1024px){.bf{grid-template-columns:5fr 7fr;padding-block:80px}}
.bf-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.bf-meta .acc{color:var(--accent)}
.bf h2{font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(44px,5vw,60px);line-height:.92;color:var(--ink);margin-top:24px;text-wrap:balance;transition:color .15s}
.bf:hover h2{color:var(--accent)}
.bf p{margin-top:20px;max-width:46ch;line-height:1.65;color:var(--muted)}
.bf .ulink{display:inline-flex;align-items:center;gap:8px;margin-top:28px;font-weight:500}
.bf-vis{border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.bf-vis .plate-stage{border-bottom:0;min-height:260px}
.bf-vis svg{max-height:340px}
.bl-list{list-style:none;padding-block:16px}
.bl-list li + li{border-top:1px solid var(--line)}
.bl-row{display:grid;gap:16px;padding-block:32px;text-decoration:none;color:inherit;align-items:center}
@media (min-width:768px){.bl-row{grid-template-columns:2fr 6fr 3fr auto;gap:32px}}
.bl-dt{display:flex;gap:16px;font:500 11px/1.5 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
@media (min-width:768px){.bl-dt{flex-direction:column;gap:4px}}
.bl-dt .acc{color:var(--accent)}
.bl-row h2{font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:clamp(30px,3.4vw,40px);line-height:.95;color:var(--ink);transition:transform .3s,color .15s}
.bl-row:hover h2{transform:translateX(8px);color:var(--accent)}
.bl-row p{margin-top:8px;font-size:14px;line-height:1.6;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bl-st{display:flex;gap:28px}
@media (min-width:768px){.bl-st{justify-content:flex-end}}
.bl-st dt{font:500 10px var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.bl-st dd{font-family:var(--display);font-size:30px;line-height:1;color:var(--ink);margin-top:4px}
.bl-row .circ{display:none}
@media (min-width:768px){.bl-row .circ{display:inline-flex}}
.post-hdr{border-bottom:1px solid var(--line)}
.pw{max-width:1024px;margin:0 auto}
.post-hdr .pw{padding-block:40px 56px;display:flex;flex-direction:column}
@media (min-width:768px){.post-hdr .pw{padding-bottom:80px}}
.post-back{display:inline-flex;align-items:center;gap:8px;font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted);text-decoration:none;align-self:flex-start}
.post-back:hover{color:var(--ink)}
.post-hdr .bf-meta{margin-top:48px}
.post-hdr .h-page{margin-top:24px;max-width:18ch;font-size:clamp(52px,8vw,96px)}
.post-hdr .l-sum{margin-top:32px;max-width:52ch}
.post-body{padding-block:48px 80px;display:flex;flex-direction:column;gap:40px}
.post-body .sample{align-self:center;max-width:672px;width:100%}
.learn-card{display:flex;align-items:center;gap:24px;border-radius:16px;background:var(--accent);color:var(--on-acc);padding:24px 28px;text-decoration:none;max-width:672px;width:100%;margin:0 auto}
.learn-card small{display:block;font:500 10px var(--mono);text-transform:uppercase;letter-spacing:.18em;opacity:.75}
.learn-card b{display:block;font-family:var(--display);font-weight:400;font-size:32px;line-height:1;margin-top:8px;color:var(--on-acc)}
.learn-card .circ{width:48px;height:48px;flex:0 0 48px;background:var(--on-acc);color:var(--accent);border:0}
.learn-card:hover .circ{transform:rotate(45deg)}
.post-rel{max-width:672px;width:100%;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px 20px;align-items:baseline}
.post-body .l-nav{max-width:672px;width:100%;margin:0 auto}
`);

  SML.pages.blog = function (view) {
    const posts = byDate(); const feat = posts.find((p) => p.featured) || posts[0];
    const tags = ['All'].concat(Array.from(new Set(posts.map((p) => p.tag))));
    const fid = SML.uid('blog');
    const row = (p) => `<li><a class="bl-row" href="#${p.id}"><div class="bl-dt"><time datetime="${p.date}">${dShort(p.date)}</time><span class="acc">${esc(p.tag)}</span></div><div><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p></div><dl class="bl-st"><div><dt>Read</dt><dd>${p.mins} min</dd></div><div><dt>Charts</dt><dd>${(p.body.match(/data-widget=/g) || []).length || 1}</dd></div></dl><span class="circ go">${UR}</span></a></li>`;
    view.innerHTML = `
      ${SML.pageHeader('04', 'Trade notes', 'Trade <em>notes</em>', `<p>Trade breakdowns, wheel logs, checklists and routines. Every post has an interactive chart you can step through.</p>${ui.seg(fid + '-tag', tags.map((t) => ({ v: t, label: t })), 'All', 'Filter by topic')}`)}
      <div class="wrap">
        <a class="bf" href="#${feat.id}" id="${fid}-feat"><div><div class="bf-meta"><span class="pill solid">Featured</span><span class="acc">${esc(feat.tag)}</span><time datetime="${feat.date}">${dShort(feat.date)}</time></div><h2>${esc(feat.title)}</h2><p>${esc(feat.excerpt)}</p><span class="ulink">Read the breakdown ${UR}</span></div><div class="bf-vis"><div class="plate-stage">${feat.thumb}</div></div></a>
        <ul class="bl-list" id="${fid}-list">${posts.filter((p) => p !== feat).map(row).join('')}</ul>
        <p class="note" style="padding-bottom:64px">These are sample posts with example numbers, written to show the format. Replace them with your own.</p>
      </div>`;
    const st = ui.wire(view.querySelector('.page-hdr'), () => {
      const t = st.seg(fid + '-tag');
      document.getElementById(fid + '-feat').hidden = !(t === 'All' || feat.tag === t);
      document.getElementById(fid + '-list').innerHTML = posts.filter((p) => p !== feat && (t === 'All' || p.tag === t)).map(row).join('');
    });
    return 'Trade notes';
  };

  SML.pages.post = function (view, token) {
    const posts = byDate(); const i = posts.findIndex((p) => p.id === token);
    if (i < 0) { view.innerHTML = `<section class="wrap" style="padding-block:96px"><h1 class="h-page">Post not <em>found</em></h1><p class="lede" style="margin-top:16px">That post may have moved. <a href="#blog">See all trade notes</a>.</p></section>`; return 'Not found'; }
    const p = posts[i], newer = posts[i - 1], older = posts[i + 1];
    const rel = p.related || []; const r0 = rel[0];
    view.innerHTML = `<article>
      <header class="post-hdr"><div class="wrap"><div class="pw">
        <a class="post-back" href="#blog">${BK} Trade notes</a>
        <div class="bf-meta"><span class="acc">${esc(p.tag)}</span><time datetime="${p.date}">${dLong(p.date)}</time><span>${p.mins} min read</span></div>
        <h1 class="h-page">${esc(p.title)}</h1>
        <p class="l-sum">${esc(p.excerpt)}</p>
      </div></div></header>
      <div class="wrap"><div class="pw post-body">
        <p class="sample"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.5" class="f-acc"/><path d="M8 4.2v4.6M8 10.8v.9" class="nf" style="stroke:var(--on-acc)" stroke-width="1.8" stroke-linecap="round"/></svg>Sample post with example numbers. Educational only, not advice.</p>
        <div class="post"><div class="prose">${p.body}</div></div>
        ${r0 ? `<a class="learn-card" href="#${r0}"><span style="flex:1"><small>Learn the setup</small><b>${esc(lessonTitle(r0, r0))}</b></span><span class="circ">${UR}</span></a>` : ''}
        ${rel.length > 1 ? `<div class="post-rel"><span class="wg-title">Related lessons</span>${rel.slice(1).map((id) => `<a class="ulink" href="#${id}">${esc(lessonTitle(id, id.replace(/^l-/, '').replace(/-/g, ' ')))}</a>`).join('')}</div>` : ''}
        <nav class="l-nav" aria-label="More posts">${newer ? `<a href="#${newer.id}"><span>${BK} Newer</span><strong>${esc(newer.title)}</strong></a>` : '<span></span>'}${older ? `<a class="next" href="#${older.id}"><span>Older</span><strong>${esc(older.title)}</strong></a>` : ''}</nav>
      </div></div>
    </article>`;
    return p.title;
  };

  /* =====================================================================
     SPREADSHEETS: editable templates with live formulas + TSV copy
     ===================================================================== */
  const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const n = (v) => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
  const cellNum = (v, d) => (isFinite(v) ? v.toFixed(d) : '');

  const TEMPLATES = {
    journal: {
      title: 'Trade journal', file: 'trade-journal',
      blurb: 'One row per trade. Risk, P/L and the R multiple fill in by themselves, so you can see whether your winners pay for your losers and whether you followed your plan.',
      cols: [
        { k: 'date', label: 'Date', type: 'text', w: 120 }, { k: 'tk', label: 'Ticker', type: 'text', w: 96 }, { k: 'side', label: 'Side', type: 'select', opts: ['Long', 'Short'], w: 84 },
        { k: 'en', label: 'Entry', type: 'num', w: 96 }, { k: 'sp', label: 'Stop', type: 'num', w: 96 }, { k: 'ex', label: 'Exit', type: 'num', w: 96 }, { k: 'sh', label: 'Shares', type: 'num', w: 88 },
        { k: 'risk', label: 'Risk $', calc: (r) => Math.abs(n(r.en) - n(r.sp)) * n(r.sh), fmt: (v) => F.usd0(v), f: (i) => `=ABS(D${i}-E${i})*G${i}` },
        { k: 'pl', label: 'P/L $', calc: (r) => (n(r.ex) - n(r.en)) * n(r.sh) * (r.side === 'Short' ? -1 : 1), fmt: (v) => F.susd(v, 0), sign: true, f: (i) => `=IF(C${i}="Short",D${i}-F${i},F${i}-D${i})*G${i}` },
        { k: 'R', label: 'R', calc: (r, c) => (c.risk ? c.pl / c.risk : NaN), fmt: (v) => (isFinite(v) ? F.R(v, 2) : ''), sign: true, f: (i) => `=IF(H${i}=0,"",I${i}/H${i})` },
        { k: 'setup', label: 'Setup', type: 'text', w: 170 }, { k: 'plan', label: 'Followed plan', type: 'select', opts: ['Yes', 'No'], w: 136 },
      ],
      rows: [
        ['2026-10-01', 'DEMO-A', 'Long', 101.4, 100.85, 102.9, 454, 'PMH retest', 'Yes'], ['2026-10-02', 'DEMO-B', 'Short', 48.2, 48.65, 47.3, 555, 'PML break', 'Yes'],
        ['2026-10-05', 'DEMO-A', 'Long', 99.8, 99.3, 99.3, 500, 'VWAP reclaim', 'Yes'], ['2026-10-06', 'DEMO-C', 'Long', 25.1, 24.8, 24.8, 833, 'Chased the open', 'No'],
        ['2026-10-07', 'DEMO-B', 'Long', 47.0, 46.6, 47.9, 625, 'PDL bounce', 'Yes'], ['2026-10-08', 'DEMO-D', 'Short', 62.5, 63.1, 63.1, 416, 'Failed breakdown', 'Yes'],
        ['2026-10-09', 'DEMO-A', 'Long', 103.2, 102.7, 104.1, 500, 'PDH break', 'Yes'], ['2026-10-12', 'DEMO-C', 'Short', 24.4, 24.75, 24.05, 714, 'VWAP rejection', 'Yes'],
      ],
      blank: () => ['', '', 'Long', '', '', '', '', '', 'Yes'],
      totals: (rows, C) => {
        const done = C.filter((c) => isFinite(c.R)); const wins = done.filter((c) => c.pl > 0).length;
        const totR = done.reduce((s, c) => s + c.R, 0), totPl = C.reduce((s, c) => s + (c.pl || 0), 0);
        return { label: `${rows.length} trades`, cells: { pl: F.susd(totPl, 0), R: F.R(totR, 2) },
          tsv: (a, z) => ({ tk: `=COUNTA(B${a}:B${z})&" trades"`, pl: `=SUM(I${a}:I${z})`, R: `=SUM(J${a}:J${z})` }),
          stats: [['Trades', String(rows.length)], ['Win rate', done.length ? Math.round((wins / done.length) * 100) + '%' : '—'], ['Total R', F.R(totR, 1), totR >= 0 ? 'up' : 'dn'], ['Total P/L', F.susd(totPl, 0), totPl >= 0 ? 'up' : 'dn'], ['Followed plan', rows.length ? Math.round((rows.filter((r) => r.plan === 'Yes').length / rows.length) * 100) + '%' : '—']] };
      },
      chart(rows, C, Wd) {
        const vals = C.map((c) => (isFinite(c.R) ? c.R : 0)); if (!vals.length) return null; let cum = 0; const cs = vals.map((v) => (cum += v));
        const H = 210, padL = 40, padR = 70, padT = 18, padB = 26; const lo = Math.min(0, ...vals, ...cs), hi = Math.max(0, ...vals, ...cs);
        const y = SML.lin(lo - 0.3, hi + 0.3, H - padB, padT); const sw = (Wd - padL - padR) / vals.length; const x = (i) => padL + (i + 0.5) * sw;
        let b = SML.ticks(lo - 0.3, hi + 0.3, 4).map((v) => S.line(padL, y(v), Wd - padR, y(v), v === 0 ? 's-mut' : 's-grid') + S.text(padL - 6, y(v) + 4, (v > 0 ? '+' : '') + v + 'R', 'xs mono', 'end')).join('');
        vals.forEach((v, i) => { const bw = Math.min(26, sw * 0.6); b += S.rect(x(i) - bw / 2, Math.min(y(0), y(v)), bw, Math.abs(y(v) - y(0)), (v >= 0 ? 'f-up' : 'f-dn') + ' o50', 2); if (sw > 22) b += S.text(x(i), H - 8, '#' + (i + 1), 'xs mono', 'middle'); });
        b += S.poly(cs.map((v, i) => [x(i), y(v)]), 's-acc w25') + S.circle(x(cs.length - 1), y(cs[cs.length - 1]), 4.5, 'f-acc');
        b += S.text(Wd - padR + 10, y(cs[cs.length - 1]) + 4, F.R(cs[cs.length - 1], 1), 'md acc b');
        return { H, svg: b, label: 'Bars for each trade in R with a line for the running total' };
      },
      chartTitle: 'Each trade in R, and the running total',
    },
    wheel: {
      title: 'Wheel tracker', file: 'wheel-tracker',
      blurb: 'Log every put and call you sell. Premium, capital tied up, return and annualized return fill in by themselves, and the chart groups premium by month.',
      cols: [
        { k: 'date', label: 'Opened', type: 'text', w: 120 }, { k: 'tk', label: 'Ticker', type: 'text', w: 96 }, { k: 'type', label: 'Type', type: 'select', opts: ['Put', 'Call'], w: 76 },
        { k: 'k', label: 'Strike', type: 'num', w: 88 }, { k: 'pr', label: 'Premium', type: 'num', w: 96 }, { k: 'ct', label: 'Contracts', type: 'num', w: 104 }, { k: 'dy', label: 'Days', type: 'num', w: 76 },
        { k: 'st', label: 'Status', type: 'select', opts: ['Open', 'Expired', 'Assigned', 'Called away', 'Closed early'], w: 140 },
        { k: 'prem', label: 'Premium $', calc: (r) => n(r.pr) * 100 * n(r.ct), fmt: (v) => F.usd0(v), f: (i) => `=E${i}*100*F${i}` },
        { k: 'cap', label: 'Capital', calc: (r) => n(r.k) * 100 * n(r.ct), fmt: (v) => F.usd0(v), f: (i) => `=D${i}*100*F${i}` },
        { k: 'ret', label: 'Return', calc: (r, c) => (c.cap ? (c.prem / c.cap) * 100 : NaN), fmt: (v) => (isFinite(v) ? F.pct(v, 2) : ''), f: (i) => `=IF(J${i}=0,"",I${i}/J${i})` },
        { k: 'ann', label: 'Annualized', calc: (r, c) => (n(r.dy) ? (c.ret * 365) / n(r.dy) : NaN), fmt: (v) => (isFinite(v) ? F.pct(v, 1) : ''), f: (i) => `=IF(G${i}=0,"",K${i}*365/G${i})` },
      ],
      rows: [
        ['2026-06-02', 'DEMO-A', 'Put', 38, 0.85, 1, 30, 'Assigned'], ['2026-07-06', 'DEMO-A', 'Call', 39, 0.7, 1, 28, 'Expired'], ['2026-08-03', 'DEMO-A', 'Call', 39, 0.65, 1, 30, 'Called away'],
        ['2026-08-10', 'DEMO-B', 'Put', 21, 0.42, 2, 35, 'Expired'], ['2026-09-08', 'DEMO-B', 'Put', 21, 0.38, 2, 30, 'Expired'], ['2026-09-15', 'DEMO-C', 'Put', 52, 1.1, 1, 31, 'Open'], ['2026-10-06', 'DEMO-B', 'Put', 20, 0.35, 2, 32, 'Open'],
      ],
      blank: () => ['', '', 'Put', '', '', 1, 30, 'Open'],
      totals: (rows, C) => {
        const prem = C.reduce((s, c) => s + c.prem, 0); const anns = C.map((c) => c.ann).filter(isFinite); const avg = anns.length ? anns.reduce((s, v) => s + v, 0) / anns.length : NaN;
        return { label: `${rows.length} trades`, cells: { prem: F.usd0(prem), ann: isFinite(avg) ? F.pct(avg, 1) + ' avg' : '' },
          tsv: (a, z) => ({ tk: `=COUNTA(B${a}:B${z})&" trades"`, prem: `=SUM(I${a}:I${z})`, ann: `=AVERAGE(L${a}:L${z})` }),
          stats: [['Premium collected', F.usd0(prem), 'up'], ['Positions', String(rows.length)], ['Open now', String(rows.filter((r) => r.st === 'Open').length)], ['Avg annualized', isFinite(avg) ? F.pct(avg, 1) : '—']] };
      },
      chart(rows, C, Wd) {
        const m = {}; rows.forEach((r, i) => { const key = String(r.date || '').slice(0, 7); if (!/^\d{4}-\d{2}$/.test(key)) return; m[key] = (m[key] || 0) + C[i].prem; });
        const keys = Object.keys(m).sort(); if (!keys.length) return null;
        const H = 210, padL = 48, padR = 16, padT = 22, padB = 26; const hi = Math.max(...keys.map((q) => m[q])) * 1.15; const y = SML.lin(0, hi, H - padB, padT);
        const sw = (Wd - padL - padR) / keys.length; let b = SML.ticks(0, hi, 4).map((v) => S.line(padL, y(v), Wd - padR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, F.usd0(v), 'xs mono', 'end')).join('');
        keys.forEach((q, i) => { const bw = Math.min(56, sw * 0.6), x = padL + (i + 0.5) * sw; b += S.rect(x - bw / 2, y(m[q]), bw, y(0) - y(m[q]), 'f-up', 3) + S.text(x, y(m[q]) - 6, F.usd0(m[q]), 'sm mono ink b', 'middle') + S.text(x, H - 8, new Date(q + '-15T12:00:00').toLocaleDateString('en-US', { month: 'short' }), 'xs mono', 'middle'); });
        return { H, svg: b, label: 'Bars of premium collected per month' };
      },
      chartTitle: 'Premium collected by month',
    },
    retire: {
      title: 'Retirement planner', file: 'retirement-planner',
      blurb: 'Set a starting balance and age, then edit the yearly contribution and return for any year. Growth assumes contributions arrive evenly through the year.',
      pre: [{ k: 'start', label: 'Starting balance $', v: 25000 }, { k: 'age', label: 'Current age', v: 35 }],
      cols: [
        { k: 'yr', label: 'Year', calc: (r, c, i) => i + 1, fmt: (v) => String(v), f: (i) => `=ROW()-4` },
        { k: 'ag', label: 'Age', calc: (r, c, i, P) => n(P.age) + i, fmt: (v) => String(v), f: (i) => `=$B$2+A${i}-1` },
        { k: 'ct', label: 'Contribution $', type: 'num', w: 140 }, { k: 'rt', label: 'Return %', type: 'num', w: 104 },
        { k: 'sb', label: 'Start', calc: (r, c, i, P, prev) => (i === 0 ? n(P.start) : prev.eb), fmt: (v) => F.usd0(v), f: (i) => (i === 5 ? '=$B$1' : `=G${i - 1}`) },
        { k: 'gr', label: 'Growth', calc: (r, c) => (c.sb * n(r.rt)) / 100 + (n(r.ct) * n(r.rt)) / 200, fmt: (v) => F.usd0(v), f: (i) => `=E${i}*D${i}/100+C${i}*D${i}/200` },
        { k: 'eb', label: 'End balance', calc: (r, c) => c.sb + n(r.ct) + c.gr, fmt: (v) => F.usd0(v), f: (i) => `=E${i}+C${i}+F${i}` },
      ],
      rows: Array.from({ length: 25 }, () => [6000, 7]),
      blank: () => [6000, 7],
      totals: (rows, C, P) => {
        const contrib = rows.reduce((s, r) => s + n(r.ct), 0), growth = C.reduce((s, c) => s + c.gr, 0), end = C.length ? C[C.length - 1].eb : n(P.start);
        return { label: 'Total', cells: { ct: F.usd0(contrib), gr: F.usd0(growth), eb: F.usd0(end) },
          tsv: (a, z) => ({ ct: `=SUM(C${a}:C${z})`, gr: `=SUM(F${a}:F${z})`, eb: `=G${z}` }),
          stats: [['Ending balance', F.usd0(end), 'up'], ['You put in', F.usd0(contrib + n(P.start))], ['Growth', F.usd0(growth), 'up'], ['Age at the end', String(n(P.age) + rows.length)]] };
      },
      chart(rows, C, Wd, P) {
        if (!C.length) return null; const H = 220, padL = 58, padR = 16, padT = 18, padB = 26; let paid = n(P.start); const pts = C.map((c, i) => { paid += n(rows[i].ct); return [paid, c.eb]; });
        const hi = Math.max(...pts.map((p) => p[1]), 1) * 1.08; const y = SML.lin(0, hi, H - padB, padT); const x = SML.lin(0, C.length - 1 || 1, padL, Wd - padR);
        let b = SML.ticks(0, hi, 4).map((v) => S.line(padL, y(v), Wd - padR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1000) + 'k', 'xs mono', 'end')).join('');
        b += S.area(pts.map((p, i) => [x(i), y(p[1])]), y(0), 'f-up-t') + S.area(pts.map((p, i) => [x(i), y(p[0])]), y(0), 'f-info-t');
        b += S.poly(pts.map((p, i) => [x(i), y(p[1])]), 's-up w25') + S.poly(pts.map((p, i) => [x(i), y(p[0])]), 's-info w2');
        const step = C.length > 12 ? 5 : 1; C.forEach((c, i) => { if (i % step === 0 || i === C.length - 1) b += S.text(x(i), H - 8, 'Age ' + (n(P.age) + i + 1), 'xs mono', 'middle'); });
        const last = pts[pts.length - 1]; b += S.circle(x(C.length - 1), y(last[1]), 4.5, 'f-up');
        b += S.text(padL + 10, padT + 12, 'growth', 'sm up b') + S.text(padL + 10, padT + 27, 'money you put in', 'sm info b');
        return { H, svg: b, label: 'Area chart of balance growth versus money contributed over the years' };
      },
      chartTitle: 'Balance over time: what you put in vs growth',
    },
    watch: {
      title: 'Watchlist & levels', file: 'watchlist-levels',
      blurb: 'Fill in the last price and the four daily levels for each stock. The sheet finds the nearest level, how far away it is and where price sits in the day’s map.',
      cols: [
        { k: 'tk', label: 'Ticker', type: 'text', w: 96 }, { k: 'last', label: 'Last', type: 'num', w: 96 },
        { k: 'pdh', label: 'PDH', type: 'num', w: 96 }, { k: 'pdl', label: 'PDL', type: 'num', w: 96 }, { k: 'pmh', label: 'PMH', type: 'num', w: 96 }, { k: 'pml', label: 'PML', type: 'num', w: 96 },
        { k: 'dist', label: 'Distance $', calc: (r) => Math.min(...['pdh', 'pdl', 'pmh', 'pml'].map((q) => Math.abs(n(r.last) - n(r[q])))), fmt: (v) => F.usd(v), f: (i) => `=MIN(ABS(B${i}-C${i}),ABS(B${i}-D${i}),ABS(B${i}-E${i}),ABS(B${i}-F${i}))` },
        { k: 'near', label: 'Nearest', calc: (r, c) => ['pdh', 'pdl', 'pmh', 'pml'].find((q) => Math.abs(Math.abs(n(r.last) - n(r[q])) - c.dist) < 1e-9).toUpperCase(), fmt: (v) => v, f: (i) => `=IF(ABS(B${i}-C${i})=G${i},"PDH",IF(ABS(B${i}-D${i})=G${i},"PDL",IF(ABS(B${i}-E${i})=G${i},"PMH","PML")))` },
        { k: 'pct', label: 'Distance %', calc: (r, c) => (n(r.last) ? (c.dist / n(r.last)) * 100 : NaN), fmt: (v) => (isFinite(v) ? F.pct(v, 2) : ''), f: (i) => `=IF(B${i}=0,"",G${i}/B${i})` },
        { k: 'bias', label: 'Where price sits', calc: (r) => { const L = n(r.last), lv = ['pdh', 'pdl', 'pmh', 'pml'].map((q) => n(r[q])); if (L > Math.max(...lv)) return 'Above all levels'; if (L < Math.min(...lv)) return 'Below all levels'; if (L > n(r.pmh)) return 'Above PMH'; if (L < n(r.pml)) return 'Below PML'; return 'Inside premarket range'; }, fmt: (v) => v, f: (i) => `=IF(B${i}>MAX(C${i}:F${i}),"Above all levels",IF(B${i}<MIN(C${i}:F${i}),"Below all levels",IF(B${i}>E${i},"Above PMH",IF(B${i}<F${i},"Below PML","Inside premarket range"))))` },
        { k: 'note', label: 'Plan', type: 'text', w: 200 },
      ],
      rows: [
        ['DEMO-A', 101.42, 103.17, 97.85, 101.15, 99.6, 'Long on PMH retest'], ['DEMO-B', 47.8, 49.2, 46.9, 48.1, 47.3, 'Wait, inside range'],
        ['DEMO-C', 24.1, 25.3, 23.95, 24.6, 24.0, 'Short if PML breaks'], ['DEMO-D', 63.05, 64.4, 61.8, 62.9, 62.2, 'Above PMH, watch volume'], ['DEMO-E', 15.9, 16.85, 15.35, 16.1, 15.7, 'No plan yet'],
      ],
      blank: () => ['', '', '', '', '', '', ''],
      totals: (rows, C) => {
        const valid = C.map((c, i) => [c, rows[i]]).filter((q) => isFinite(q[0].pct)); const close = valid.length ? valid.reduce((a, q) => (q[0].pct < a[0].pct ? q : a)) : null;
        return { label: `${rows.length} stocks`, cells: {}, tsv: (a, z) => ({ tk: `=COUNTA(A${a}:A${z})&" stocks"` }),
          stats: [['Stocks', String(rows.length)], ['Closest to a level', close ? `${close[1].tk || '—'} ${F.pct(close[0].pct, 2)}` : '—'], ['Above PMH', String(C.filter((c) => /Above/.test(c.bias)).length)], ['Below PML', String(C.filter((c) => /Below/.test(c.bias)).length)]] };
      },
      chart(rows, C, Wd) {
        const items = C.map((c, i) => ({ t: rows[i].tk || 'Row ' + (i + 1), v: isFinite(c.pct) ? ((n(rows[i].last) - n(rows[i][c.near.toLowerCase()])) / (n(rows[i].last) || 1)) * 100 : 0, near: c.near })); if (!items.length) return null;
        const rowH = 28, H = items.length * rowH + 30, lw = 70; const m = Math.max(0.5, ...items.map((q) => Math.abs(q.v))) * 1.25; const x = SML.lin(-m, m, lw, Wd - 16);
        let b = S.line(x(0), 8, x(0), H - 20, 's-mut') + S.text(x(-m) + 2, H - 4, 'below level', 'xs', 'start') + S.text(Wd - 18, H - 4, 'above level', 'xs', 'end');
        items.forEach((q, i) => { const yy = 10 + i * rowH; b += S.text(lw - 8, yy + 15, esc(q.t), 'sm mono ink b', 'end') + S.rect(Math.min(x(0), x(q.v)), yy + 3, Math.max(2, Math.abs(x(q.v) - x(0))), 16, q.v >= 0 ? 'f-up' : 'f-dn', 2); const lx = q.v >= 0 ? x(q.v) + 6 : x(q.v) - 6; b += S.text(lx, yy + 15, `${F.spct(q.v, 2)} vs ${q.near}`, 'sm mono', q.v >= 0 ? 'start' : 'end'); });
        return { H, svg: b, label: 'Bars showing how far each stock is above or below its nearest level' };
      },
      chartTitle: 'Distance to the nearest level',
    },
  };

  SML.widgets.sheetTemplates = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('sh');
    let tplKey = TEMPLATES[opts.tpl] ? opts.tpl : 'journal';
    let rows, pre, saveT = null;
    const solo = !!opts.solo;
    root.innerHTML = `
      ${solo ? `<div class="wg-bar sh-chrome"><span class="sh-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="sh-file">${TEMPLATES[tplKey].file}.xlsx</span><span class="grow"></span><span class="pill acc" id="${id}-state">Example rows</span></div>` : `<div class="wg-bar">${ui.seg(id + '-tpl', Object.keys(TEMPLATES).map((k) => ({ v: k, label: TEMPLATES[k].title })), tplKey, 'Template')}<span class="grow"></span><span class="pill acc" id="${id}-state">Example rows</span></div>`}
      <div class="sh-intro" id="${id}-intro"></div>
      <div class="sh-wrap scroll" id="${id}-tbl"></div>
      <div class="wg-bar"><span class="wg-title" id="${id}-ct"></span></div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-read sh-read" id="${id}-read"></div>
      <div class="wg-actions">
        <button type="button" class="btn btn-a sm" data-a="csv" hidden><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Download .csv</button>
        <button type="button" class="btn btn-a sm" data-a="copy"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" class="nf" style="stroke:currentColor" stroke-width="1.6"/><path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" class="nf" style="stroke:currentColor" stroke-width="1.6"/></svg>Copy for Google Sheets / Excel</button>
        <button type="button" class="btn btn-g sm" data-a="add">Add row</button>
        <button type="button" class="btn btn-g sm" data-a="reset">Reset example</button>
      </div>
      <div class="wg-note">Paste into cell A1 of an empty sheet. Calculated columns arrive as live formulas. Your edits are saved in this browser only.</div>`;
    const T = () => TEMPLATES[tplKey];
    const key = () => 'sheet-' + tplKey;
    function fromExample() { const t = T(); const inputs = t.cols.filter((c) => !c.calc); return t.rows.map((r) => { const o = {}; inputs.forEach((c, i) => (o[c.k] = r[i])); return o; }); }
    function load() {
      const saved = SML.store.get(key(), null); const t = T();
      rows = saved && Array.isArray(saved.rows) ? saved.rows : fromExample();
      pre = {}; (t.pre || []).forEach((p) => (pre[p.k] = saved && saved.pre && saved.pre[p.k] != null ? saved.pre[p.k] : p.v));
      $('#' + id + '-state', root).textContent = saved ? 'Your edits' : 'Example rows';
      $('#' + id + '-state', root).className = 'pill ' + (saved ? 'info' : 'acc');
    }
    function save() { clearTimeout(saveT); saveT = setTimeout(() => { SML.store.set(key(), { rows, pre }); const s = $('#' + id + '-state', root); if (s) { s.textContent = 'Your edits'; s.className = 'pill info'; } }, 250); }
    function compute() { const t = T(); const out = []; rows.forEach((r, i) => { const c = {}; t.cols.forEach((col) => { if (col.calc) { try { c[col.k] = col.calc(r, c, i, pre, out[i - 1]); } catch (e) { c[col.k] = NaN; } } }); out.push(c); }); return out; }
    function renderAll() {
      const t = T();
      $('#' + id + '-intro', root).hidden = solo && !t.pre;
      $('#' + id + '-intro', root).innerHTML = `${solo ? '' : `<p>${t.blurb}</p>`}${t.pre ? `<div class="fields" style="max-width:420px">${t.pre.map((p) => `<label class="fld" for="${id}-pre-${p.k}"><span>${p.label}</span><input id="${id}-pre-${p.k}" type="number" step="any" data-pre="${p.k}" value="${esc(pre[p.k])}"></label>`).join('')}</div>` : ''}`;
      const hdr = t.cols.map((c, j) => `<th${c.calc ? ' class="cl"' : ''}${c.w ? ` style="min-width:${c.w}px"` : ''}><span class="col">${COLS[j]}</span>${c.label}${c.calc ? '<small>formula</small>' : ''}</th>`).join('');
      const body = rows.map((r, i) => `<tr><th class="rn">${i + 1}</th>${t.cols.map((c) => {
        if (c.calc) return `<td class="calc" data-r="${i}" data-k="${c.k}"></td>`;
        const aria = `aria-label="${esc(c.label)} row ${i + 1}"`;
        if (c.type === 'select') return `<td><select data-r="${i}" data-k="${c.k}" ${aria}>${c.opts.map((o) => `<option${String(r[c.k]) === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>`;
        return `<td><input ${c.type === 'num' ? 'type="number" step="any" inputmode="decimal"' : 'type="text"'} data-r="${i}" data-k="${c.k}" value="${esc(r[c.k] == null ? '' : r[c.k])}" ${aria}></td>`;
      }).join('')}<td class="del"><button type="button" data-del="${i}" aria-label="Delete row ${i + 1}">×</button></td></tr>`).join('');
      $('#' + id + '-tbl', root).innerHTML = `<table class="sheet"><thead><tr><th class="rn"></th>${hdr}<th class="rn" aria-label="Delete"></th></tr></thead><tbody>${body}</tbody><tfoot><tr id="${id}-tot"></tr></tfoot></table>`;
      $('#' + id + '-ct', root).textContent = t.chartTitle;
      refresh();
    }
    let drawChart = null;
    function refresh() {
      const t = T(), C = compute();
      $$('td.calc', root).forEach((td) => { const i = Number(td.dataset.r), col = t.cols.find((c) => c.k === td.dataset.k); const v = C[i] ? C[i][col.k] : NaN; td.textContent = typeof v === 'number' && !isFinite(v) ? '' : col.fmt(v); td.className = 'calc' + (col.sign && isFinite(v) ? (v > 0 ? ' up' : v < 0 ? ' dn' : '') : ''); });
      const tot = t.totals(rows, C, pre);
      $('#' + id + '-tot', root).innerHTML = `<td></td>${t.cols.map((c, j) => `<td class="${c.calc ? 'num' : ''}">${j === 0 ? tot.label : tot.cells[c.k] || ''}</td>`).join('')}<td></td>`;
      $('#' + id + '-read', root).innerHTML = tot.stats.map((s) => `<div class="stat"><span class="stat-l">${s[0]}</span><span class="stat-v ${s[2] || ''}">${s[1]}</span></div>`).join('');
      if (drawChart) drawChart();
    }
    load();
    drawChart = ui.responsive($('#' + id + '-fig', root), (Wd) => {
      const t = T(), C = compute(); const ch = t.chart(rows, C, Wd, pre); const fig = $('#' + id + '-fig', root);
      fig.innerHTML = ch ? S.wrap(Wd, ch.H, ch.label, ch.svg) : `<p class="note" style="padding:20px">Add a row to see the chart.</p>`;
    });
    function tsv() {
      const t = T(); const lines = []; const pr = t.pre || [];
      pr.forEach((p) => lines.push([p.label, n(pre[p.k])].join('\t')));
      if (pr.length) lines.push('');
      const first = lines.length + 2; // header on row lines.length+1
      lines.push(t.cols.map((c) => c.label).join('\t'));
      rows.forEach((r, i) => { const rowNo = first + i; lines.push(t.cols.map((c) => (c.calc ? c.f(rowNo) : r[c.k] == null ? '' : String(r[c.k]))).join('\t')); });
      const tot = t.totals(rows, compute(), pre); const tf = tot.tsv(first, first + rows.length - 1);
      lines.push(t.cols.map((c, j) => (tf[c.k] != null ? tf[c.k] : j === 0 ? 'Total' : '')).join('\t'));
      return lines.join('\n');
    }
    const tblEl = $('#' + id + '-tbl', root), introEl = $('#' + id + '-intro', root);
    const onEdit = (e) => { const el = e.target; if (el.dataset.r != null && el.dataset.k) { const c = T().cols.find((q) => q.k === el.dataset.k); rows[Number(el.dataset.r)][el.dataset.k] = c && c.type === 'num' ? (el.value === '' ? '' : n(el.value)) : el.value; refresh(); save(); } };
    tblEl.addEventListener('input', onEdit); tblEl.addEventListener('change', onEdit);
    introEl.addEventListener('input', (e) => { const k = e.target.dataset.pre; if (k) { pre[k] = e.target.value === '' ? 0 : n(e.target.value); refresh(); save(); } });
    tblEl.addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (!b) return; rows.splice(Number(b.dataset.del), 1); renderAll(); save(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return; const a = b.dataset.a; const t = T();
      if (a === 'add') { const inputs = t.cols.filter((c) => !c.calc); const bl = t.blank(); const o = {}; inputs.forEach((c, i) => (o[c.k] = bl[i])); rows.push(o); renderAll(); save(); const last = $$('#' + id + '-tbl tbody tr', root).pop(); if (last) { const inp = $('input,select', last); if (inp) inp.focus(); } }
      else if (a === 'reset') { SML.store.set(key(), null); load(); renderAll(); SML.toast('Example rows restored'); }
      else if (a === 'copy') { SML.copy(tsv(), `Copied ${rows.length} rows with formulas. Paste into cell A1.`); }
      else if (a === 'csv' && dl) {
        const csv = tsv().split('\n').map((line) => line.split('\t').map((c) => (/[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c)).join(',')).join('\r\n');
        dl.save({ filename: t.file + '.csv', data: csv }).then(() => SML.toast('Saved ' + t.file + '.csv')).catch((err) => { const c = err && err.code; if (c === 'declined') return; if (c === 'rate_limited') SML.toast('A save is already waiting for you.'); else { SML.toast('Downloads are not available here. Use Copy instead.'); b.hidden = true; } });
      }
    });
    let dl = null;
    try { if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then((d) => { if (d && root.isConnected) { dl = d; const b = $('[data-a="csv"]', root); if (b) b.hidden = false; } }).catch(() => {}); } catch (e) {}
    if (!solo) { const st = ui.wire($('.wg-bar', root), () => { tplKey = st.seg(id + '-tpl'); load(); renderAll(); }); }
    renderAll();
  };

  SML.css(`
.sh-chrome{gap:10px}
.sh-dots{display:flex;gap:6px}
.sh-dots i{width:10px;height:10px;border-radius:50%;background:color-mix(in srgb,var(--down) 70%,transparent)}
.sh-dots i:nth-child(2){background:color-mix(in srgb,var(--accent) 70%,transparent)}
.sh-dots i:nth-child(3){background:color-mix(in srgb,var(--up) 70%,transparent)}
.sh-file{font:500 11px var(--mono);color:var(--muted);margin-left:6px}
.sh-list{list-style:none}
.sh-row{display:grid;gap:32px;padding-block:56px;border-bottom:1px solid var(--line);align-items:start}
@media (min-width:1100px){.sh-row{grid-template-columns:4fr 8fr;gap:48px}.sh-row > div:first-child{position:sticky;top:96px}}
.sh-row .part{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.18em;color:var(--accent)}
.sh-row h2{font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:48px;line-height:.95;color:var(--ink);margin-top:12px}
.sh-row p.d{margin-top:16px;font-size:14.5px;line-height:1.65;color:var(--muted);max-width:44ch}
.sh-row .cta-row{margin-top:24px;align-items:center;gap:16px}
.sh-row .wg{border-radius:16px}
`);
  SML.pages.sheets = function (view) {
    const rel = { journal: ['#l-journal', 'Lesson: Keep a journal'], wheel: ['#l-wheel', 'Lesson: The wheel strategy'], retire: ['#tool-compound', 'Compounding tool'], watch: ['#l-levels', 'Lesson: PDH, PDL, PMH, PML'] };
    const keys = Object.keys(TEMPLATES);
    view.innerHTML = `
      ${SML.pageHeader('05', 'Spreadsheets', 'Copy-ready <em>trading</em> sheets.', `<p>${keys.length} templates you can edit right here. The formulas work as you type, and one click copies the whole sheet, formulas included, into Google Sheets or Excel.</p>`)}
      <ul class="wrap sh-list">${keys.map((k, i) => { const t = TEMPLATES[k]; const r = rel[k] || ['#learn', 'Lessons']; return `<li class="sh-row"><div><p class="part">Sheet ${String(i + 1).padStart(2, '0')} · live formulas</p><h2>${t.title}</h2><p class="d">${t.blurb}</p><div class="cta-row"><a class="ulink" href="${r[0]}">${r[1]}</a></div></div><div style="min-width:0">${SML.widgetHTML('sheetTemplates', { tpl: k, solo: true })}</div></li>`; }).join('')}</ul>
      <section class="chapter" aria-labelledby="sh-how"><div class="wrap">
        ${SML.chapHead('', 'How to use them', 'Three steps, about a minute.', '', 'sh-how')}
        <ol class="tiles t3">${[
          ['Edit the example', 'Type over the example rows or add your own. Calculated columns are marked "formula" and update as you type.'],
          ['Copy or download', 'Press "Copy for Google Sheets / Excel" to copy the headers, your rows and the formulas as tab-separated text. Where your browser allows it, Download .csv saves a file instead.'],
          ['Paste into A1', 'Open a blank Google Sheet or Excel workbook, click cell A1 and paste. Format the percent columns as percentages if you like.'],
        ].map((st, i) => `<li><div class="tile"><span class="tile-n">${String(i + 1).padStart(2, '0')}</span><span class="tile-t">${st[0]}</span><span class="tile-p">${st[1]}</span></div></li>`).join('')}</ol>
        <div class="callout info" style="margin-top:20px"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-info"/><path d="M9 8v5M9 5.2v.8" class="nf" style="stroke:var(--on)" stroke-width="1.8" stroke-linecap="round"/></svg><span>Tickers like DEMO-A are made up. Replace them with your own trades. Edits stay in this browser and are never uploaded.</span></div>
      </div></section>`;
    return 'Spreadsheets';
  };

  /* =====================================================================
     APPS: interactive phone previews
     ===================================================================== */
  const ICON = {
    list: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 4.5h12M3 9h12M3 13.5h12" class="nf" style="stroke:currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    bars: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 15V9M9 15V4M14 15v-7" class="nf" style="stroke:currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };
  function wheelApp(scr, ctl) {
    const fresh = () => ({ view: 'list', sel: null, closed: 1240, months: { Jun: 180, Jul: 265, Aug: 310, Sep: 285, Oct: 200 }, pos: [
      { t: 'DEMO-A', type: 'Put', k: 38, prem: 0.85, ct: 1, left: 12, total: 30 }, { t: 'DEMO-B', type: 'Call', k: 52, prem: 0.64, ct: 1, left: 5, total: 28 }, { t: 'DEMO-C', type: 'Put', k: 21, prem: 0.41, ct: 2, left: 26, total: 32 }] });
    let s = fresh();
    const premOf = (p) => p.prem * 100 * p.ct, capOf = (p) => p.k * 100 * p.ct;
    function render() {
      let body = '';
      if (s.view === 'list') {
        body = `<div class="ap-top"><span class="ap-app">Wheel Tracker</span><span class="ap-sub">Premium this year (example)</span><span class="ap-big">${F.usd0(s.closed)}</span><span class="ap-sub">${s.pos.length} open position${s.pos.length === 1 ? '' : 's'} · ${F.usd0(s.pos.reduce((q, p) => q + premOf(p), 0))} pending</span></div>
          <div class="ap-body">${s.pos.length ? s.pos.map((p, i) => `<button type="button" class="ap-item" data-ap="open" data-i="${i}"><span class="t">${p.t} · ${p.type} $${p.k}</span><span class="v">+${F.usd0(premOf(p))}</span><span class="s">${p.left} days left · ${p.ct} contract${p.ct > 1 ? 's' : ''}</span><span class="s" style="text-align:right">tap</span><div class="prog"><i style="--w:${Math.round((1 - p.left / p.total) * 100)}%"></i></div></button>`).join('') : '<div class="ap-card"><b>No open positions</b><span class="ap-sub">Every option in the demo has expired. Reset the demo to start again.</span></div>'}${s.pos.length ? (() => { const nx = s.pos.reduce((a, p) => (p.left < a.left ? p : a)); return `<div class="ap-card"><span class="ap-tip"><b>Next expiry:</b> ${nx.t} ${nx.type.toLowerCase()} in ${nx.left} days. ${nx.type === 'Call' ? 'If the stock is above $' + nx.k + ', your shares are sold at $' + nx.k + '.' : 'If the stock is below $' + nx.k + ', you buy 100 shares per contract.'}</span></div>`; })() : ''}</div>`;
      } else if (s.view === 'detail') {
        const p = s.pos[s.sel]; const ret = (premOf(p) / capOf(p)) * 100, ann = (ret * 365) / p.total;
        body = `<div class="ap-top"><button type="button" class="linkish" data-ap="back" style="align-self:flex-start;font-size:12.5px">‹ Positions</button><span class="ap-app" style="margin-top:6px">${p.t}</span><span class="ap-big" style="font-size:28px">${p.type} $${p.k}</span><span class="ap-sub">${p.left} of ${p.total} days left</span></div>
          <div class="ap-body"><div class="ap-card"><div class="prog"><i style="--w:${Math.round((1 - p.left / p.total) * 100)}%"></i></div>
            <div class="ap-kv"><span>Premium</span><span>${F.usd0(premOf(p))}</span><span>${p.type === 'Put' ? 'Cash set aside' : 'Shares covered'}</span><span>${p.type === 'Put' ? F.usd0(capOf(p)) : 100 * p.ct}</span><span>${p.type === 'Put' ? 'Breakeven' : 'Sold at if called'}</span><span>${F.usd(p.type === 'Put' ? p.k - p.prem : p.k)}</span><span>Return</span><span>${F.pct(ret, 2)}</span><span>Annualized</span><span>${F.pct(ann, 1)}</span></div></div>
            <button type="button" class="btn btn-up" data-ap="expire">Mark expired: keep ${F.usd0(premOf(p))}</button>
            <button type="button" class="btn btn-g" data-ap="back">Back</button></div>`;
      } else {
        const ks = Object.keys(s.months), mx = Math.max(...ks.map((k) => s.months[k]));
        body = `<div class="ap-top"><span class="ap-app">Wheel Tracker</span><span class="ap-sub">Premium by month (example)</span><span class="ap-big">${F.usd0(s.closed)}</span></div>
          <div class="ap-body"><div class="ap-card"><div class="ap-bars">${ks.map((k) => `<div><span>${F.usd0(s.months[k])}</span><i style="height:${Math.round((s.months[k] / mx) * 70)}px"></i><span>${k}</span></div>`).join('')}</div></div>
          <div class="ap-card"><div class="ap-kv"><span>Avg per month</span><span>${F.usd0(s.closed / ks.length)}</span><span>Positions closed</span><span>${14 + (3 - s.pos.length)}</span><span>Assignments</span><span>2</span></div></div></div>`;
      }
      scr.innerHTML = `<div class="ap-scr">${body}<nav class="ap-tabs"><button type="button" data-ap="tab-list" class="${s.view !== 'stats' ? 'on' : ''}">${ICON.list}Positions</button><button type="button" data-ap="tab-stats" class="${s.view === 'stats' ? 'on' : ''}">${ICON.bars}Stats</button></nav></div>`;
    }
    scr.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ap]'); if (!b) return; const a = b.dataset.ap;
      if (a === 'open') { s.sel = Number(b.dataset.i); s.view = 'detail'; }
      else if (a === 'back' || a === 'tab-list') s.view = 'list';
      else if (a === 'tab-stats') s.view = 'stats';
      else if (a === 'expire') { const p = s.pos[s.sel]; if (p) { s.closed += premOf(p); s.months.Oct += premOf(p); s.pos.splice(s.sel, 1); } s.view = 'list'; SML.toast('Marked expired. Premium added to this year.'); }
      render();
    });
    ctl.reset = () => { s = fresh(); render(); };
    render();
  }

  function retireApp(scr, ctl) {
    const id = SML.uid('rr');
    scr.innerHTML = `<div class="ap-scr"><div class="ap-top"><span class="ap-app">Retirement Runway</span><span class="ap-sub" id="${id}-lab">At 65 you could have</span><span class="ap-big" id="${id}-big" style="font-size:30px"></span><span class="ap-sub" id="${id}-real"></span></div>
      <div class="ap-body"><div class="ap-card" style="padding:8px 10px" id="${id}-ch"></div>
        <div class="ap-out"><b id="${id}-inc"></b><span id="${id}-inc2"></span></div>
        <div class="ap-card" style="gap:6px">
          ${ui.slider({ id: id + '-age', label: 'Age now', min: 20, max: 60, step: 1, value: 35, fmt: 'plain' })}
          ${ui.slider({ id: id + '-mo', label: 'Saving per month', min: 100, max: 3000, step: 50, value: 600, fmt: 'usd0' })}
          ${ui.slider({ id: id + '-rt', label: 'Yearly return', min: 3, max: 10, step: 0.5, value: 7, fmt: 'pct1' })}
          ${ui.slider({ id: id + '-ret', label: 'Retire at', min: 50, max: 70, step: 1, value: 65, fmt: 'plain' })}
        </div><span class="ap-sub">Starts from $25,000 saved. Example math, not a forecast.</span></div></div>`;
    const st = ui.wire(scr, () => calc());
    function calc() {
      const age = st.n(id + '-age'), mo = st.n(id + '-mo'), r = st.n(id + '-rt') / 100, ra = Math.max(st.n(id + '-ret'), age + 1);
      const yrs = ra - age; let bal = 25000; const pts = [[age, bal]];
      for (let y = 1; y <= yrs; y++) { bal = bal * (1 + r) + mo * 12 * (1 + r / 2); pts.push([age + y, bal]); }
      const real = bal / Math.pow(1.03, yrs);
      $('#' + id + '-lab', scr).textContent = `At ${ra} you could have`;
      $('#' + id + '-big', scr).textContent = bal >= 1e6 ? '$' + (bal / 1e6).toFixed(2) + 'M' : F.usd0(bal);
      $('#' + id + '-real', scr).textContent = `${F.usd0(real)} in today’s dollars (3% inflation)`;
      $('#' + id + '-inc', scr).textContent = F.usd0((bal * 0.04) / 12) + '/mo';
      $('#' + id + '-inc2', scr).textContent = 'if you withdraw 4% of it a year';
      const Wd = 210, H = 62; const x = SML.lin(age, ra, 4, Wd - 4), y = SML.lin(0, bal * 1.05, H - 4, 4);
      $('#' + id + '-ch', scr).innerHTML = S.box(Wd, H, 'Balance growing until retirement', S.area(pts.map((p) => [x(p[0]), y(p[1])]), H - 4, 'f-up-t') + S.poly(pts.map((p) => [x(p[0]), y(p[1])]), 's-up w2') + S.circle(x(ra), y(bal), 3.5, 'f-up') + S.text(4, H - 8, String(age), 'xs mono') + S.text(Wd - 4, H - 8, String(ra), 'xs mono', 'end'));
    }
    ctl.reset = () => { [['-age', 35], ['-mo', 600], ['-rt', 7], ['-ret', 65]].forEach(([k, v]) => st.set(id + k, v)); calc(); };
    calc();
  }

  function toolkitApp(scr, ctl) {
    const id = SML.uid('tk');
    const panes = {
      size: `<div class="fields" style="grid-template-columns:1fr 1fr;gap:8px">${ui.field({ id: id + '-a', label: 'Account $', value: 25000 })}${ui.field({ id: id + '-r', label: 'Risk %', value: 1 })}${ui.field({ id: id + '-e', label: 'Entry $', value: 50 })}${ui.field({ id: id + '-s', label: 'Stop $', value: 48.5 })}</div>`,
      be: `${ui.seg(id + '-ty', ['Call', 'Put'], 'Call', 'Option type')}<div class="fields" style="grid-template-columns:1fr 1fr;gap:8px">${ui.field({ id: id + '-k', label: 'Strike $', value: 100 })}${ui.field({ id: id + '-p', label: 'Premium $', value: 2.5 })}${ui.field({ id: id + '-c', label: 'Contracts', value: 1 })}</div>`,
      ex: `<div class="fields" style="grid-template-columns:1fr 1fr;gap:8px">${ui.field({ id: id + '-w', label: 'Win rate %', value: 45 })}${ui.field({ id: id + '-aw', label: 'Avg win R', value: 2 })}${ui.field({ id: id + '-al', label: 'Avg loss R', value: 1 })}</div>`,
    };
    scr.innerHTML = `<div class="ap-scr"><div class="ap-top"><span class="ap-app">Trader Toolkit</span><span class="ap-big" style="font-size:26px">Calculators</span></div>
      <div class="ap-body">${ui.seg(id + '-m', [{ v: 'size', label: 'Size' }, { v: 'be', label: 'Breakeven' }, { v: 'ex', label: 'Expectancy' }], 'size', 'Calculator')}
        ${Object.keys(panes).map((k) => `<div class="ap-card" data-pane="${k}"${k === 'size' ? '' : ' hidden'}>${panes[k]}</div>`).join('')}
        <div class="ap-out"><b id="${id}-o1"></b><span id="${id}-o2"></span></div><span class="ap-sub" id="${id}-o3"></span><div class="ap-card"><span class="ap-tip" id="${id}-tip"></span></div></div></div>`;
    const st = ui.wire(scr, () => calc());
    function calc() {
      const m = st.seg(id + '-m'); $$('[data-pane]', scr).forEach((p) => (p.hidden = p.dataset.pane !== m));
      const o1 = $('#' + id + '-o1', scr), o2 = $('#' + id + '-o2', scr), o3 = $('#' + id + '-o3', scr);
      $('#' + id + '-tip', scr).innerHTML = { size: '<b>How it works:</b> shares = (account \u00d7 risk %) \u00f7 (entry \u2212 stop). The stop decides the size, not the other way round.', be: '<b>How it works:</b> a bought call breaks even at strike + premium, a bought put at strike \u2212 premium. You can lose the whole premium.', ex: '<b>How it works:</b> expectancy = win rate \u00d7 average win \u2212 loss rate \u00d7 average loss. Above zero, the strategy makes money over many trades.' }[m];
      if (m === 'size') {
        const a = st.n(id + '-a'), r = st.n(id + '-r'), e = st.n(id + '-e'), s = st.n(id + '-s'); const risk = (a * r) / 100, per = Math.abs(e - s);
        if (!(a > 0 && r > 0 && e > 0 && per > 0)) { o1.textContent = '—'; o2.textContent = 'Enter an entry and a different stop'; o3.textContent = ''; return; }
        const sh = Math.floor(risk / per); o1.textContent = sh.toLocaleString('en-US') + ' shares'; o2.textContent = `Risking ${F.usd0(risk)} · position ${F.usd0(sh * e)}`; o3.textContent = `2R target: ${F.usd(e > s ? e + 2 * per : e - 2 * per)}`;
      } else if (m === 'be') {
        const t = st.seg(id + '-ty'), k = st.n(id + '-k'), p = st.n(id + '-p'), c = st.n(id + '-c') || 0;
        if (!(k > 0) || !(p >= 0)) { o1.textContent = '—'; o2.textContent = 'Enter a strike and premium'; o3.textContent = ''; return; }
        o1.textContent = F.usd(t === 'Call' ? k + p : k - p); o2.textContent = `Breakeven at expiry for a bought ${t.toLowerCase()}`; o3.textContent = `Cost and max loss: ${F.usd0(p * 100 * c)} for ${c} contract${c === 1 ? '' : 's'}`;
      } else {
        const w = st.n(id + '-w') / 100, aw = st.n(id + '-aw'), al = st.n(id + '-al'); const ex = w * aw - (1 - w) * al;
        if (!isFinite(ex)) { o1.textContent = '—'; o2.textContent = 'Enter all three numbers'; o3.textContent = ''; return; }
        o1.textContent = F.R(ex, 2); o2.textContent = 'average result per trade'; o3.textContent = `Over 100 trades: ${F.R(ex * 100, 0)}. Breakeven win rate: ${F.pct((al / (aw + al || 1)) * 100, 0)}`;
      }
    }
    ctl.reset = () => { st.setSeg(id + '-m', 'size'); calc(); };
    calc();
  }

  SML.widgets.appPhone = function (root, opts) {
    opts = opts || {}; const app = opts.app || 'wheel';
    root.classList.remove('wg'); root.classList.add('ap-ph');
    root.innerHTML = `<div class="phone"><div class="phone-notch"></div><div class="phone-scr"></div></div><span class="note">Interactive preview with example data</span><button type="button" class="linkish" data-reset style="font-size:13px">Reset demo</button>`;
    const scr = $('.phone-scr', root); const ctl = {};
    ({ wheel: wheelApp, retire: retireApp, toolkit: toolkitApp }[app] || wheelApp)(scr, ctl);
    $('[data-reset]', root).addEventListener('click', () => ctl.reset && ctl.reset());
  };

  SML.css(`
.ap-hero{background:var(--accent);color:var(--on-acc)}
.ap-hero .wrap{display:grid;gap:48px;padding-block:64px;align-items:center}
@media (min-width:768px){.ap-hero .wrap{padding-block:96px}}
@media (min-width:1024px){.ap-hero .wrap{grid-template-columns:1fr 1fr}}
.ap-hero .ap-k{color:var(--on-acc);opacity:.8}
.ap-hero .h-page{color:var(--on-acc);margin-top:32px;font-size:clamp(60px,8vw,96px)}
.ap-hero .h-page em{color:var(--on-acc);text-decoration:underline;text-decoration-thickness:4px;text-underline-offset:8px}
.ap-hero p.l{margin-top:32px;max-width:28rem;font-size:18px;line-height:1.6;opacity:.85}
.ap-btn{display:inline-flex;align-items:center;gap:12px;margin-top:40px;min-height:48px;padding:0 8px 0 24px;border-radius:999px;background:var(--on-acc);color:var(--accent);font-weight:500;font-size:14px;text-decoration:none}
.ap-btn .circ{width:32px;height:32px;flex:0 0 32px;background:var(--accent);color:var(--on-acc);border:0}
.ap-btn:hover .circ{transform:rotate(45deg)}
.ap-hero img{display:block;width:100%;height:auto;border-radius:24px;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)}
.ap-line{display:grid;border-top:1px solid var(--line);margin-top:48px;list-style:none}
@media (min-width:1024px){.ap-line{grid-template-columns:repeat(3,minmax(0,1fr))}.ap-line > li{padding-inline:32px;border-right:1px solid var(--line)}.ap-line > li:first-child{padding-left:0}.ap-line > li:last-child{padding-right:0;border-right:0}}
.ap-line > li{display:flex;flex-direction:column;padding-block:40px;border-bottom:1px solid var(--line);min-width:0}
.ap-n{font-family:var(--display);font-size:72px;line-height:.9;color:var(--accent)}
.ap-line h2{font-family:var(--display);font-weight:400;text-transform:uppercase;font-size:40px;line-height:.95;color:var(--ink);margin-top:24px}
.ap-line p.d{margin-top:12px;font-size:14.5px;line-height:1.65;color:var(--muted)}
.ap-line .ap-ph{margin-top:28px}
.ap-feat{list-style:none;margin-top:24px;border-top:1px solid var(--line);font-size:14px;flex:1 1 auto}
.ap-feat li{border-bottom:1px solid var(--line);padding:10px 0;color:color-mix(in srgb,var(--ink) 85%,transparent)}
.ap-line .ulink{margin-top:28px;display:inline-flex;align-items:center;gap:8px;align-self:flex-start}
`);
  SML.pages.apps = function (view) {
    const apps = [
      { app: 'wheel', name: 'Wheel Tracker', lede: 'Log every put and call you sell. See premium collected, your real cost basis after each roll, and the annualized return on the cash you tied up.', feats: ['Puts, calls and assignments on one timeline', 'Cost basis that updates after every premium', 'Return and annualized return per position and per year', 'Reminders before expiration and earnings dates', 'Export to the Wheel tracker spreadsheet'], link: ['#tool-wheel', 'Try the web version'] },
      { app: 'retire', name: 'Retirement Runway', lede: 'Move a few sliders and see what your saving rate becomes by the time you want to stop working, in future dollars and in today’s.', feats: ['Contribution, return and retirement-age sliders', 'Inflation-adjusted view so the number means something', 'Monthly income at a chosen withdrawal rate', 'Side-by-side scenarios'], link: ['#tool-compound', 'Try the web version'] },
      { app: 'toolkit', name: 'Trader Toolkit', lede: 'The calculators from this site in your pocket: position size from entry and stop, option breakeven, and the expectancy of your strategy.', feats: ['Position size from account, risk %, entry and stop', 'Option breakeven, cost and max loss', 'Win rate and R to expectancy', 'Works offline'], link: ['#tool-size', 'Try the web version'] },
    ];
    const img = SML.assets && SML.assets.appsMockup;
    view.innerHTML = `
      <section class="ap-hero"><div class="wrap">
        <div><p class="kicker ap-k"><i></i><span>Apps · In development</span></p>
          <h1 class="h-page">Tools for your <em>pocket</em>.</h1>
          <p class="l">Three mobile apps are in development. Until launch, every tool is free on the web, and each preview below works: tap the positions, move the sliders, run the numbers.</p>
          <a class="ap-btn" href="#tools">Use the web tools <span class="circ">${UR}</span></a></div>
        ${img ? `<img src="${img}" alt="Wheel Strategy Tracker and Retirement Planner app screens on two phones" width="1050" height="653">` : ''}
      </div></section>
      <section class="wrap" style="padding-block:80px 104px" aria-labelledby="ap-line">
        ${SML.kicker('§', '<span id="ap-line">The lineup</span>')}
        <ul class="ap-line">${apps.map((a, i) => `<li><p class="ap-n">${String(i + 1).padStart(2, '0')}</p><h2>${a.name}</h2><span class="pill acc" style="align-self:flex-start;margin-top:12px">In development</span><p class="d">${a.lede}</p>${SML.widgetHTML('appPhone', { app: a.app })}<ul class="ap-feat">${a.feats.map((f) => `<li>${f}</li>`).join('')}</ul><a class="ulink" href="${a.link[0]}">${a.link[1]} ${UR}</a></li>`).join('')}</ul>
      </section>
      <section class="chapter" style="padding-top:0" aria-labelledby="ap-road"><div class="wrap">
        ${SML.chapHead('', 'What comes next', 'The order may change as we learn what traders use most.', '', 'ap-road')}
        <ol class="tiles t4">${[
          ['Now', 'Website, lessons and tools', 'Interactive courses, the trade replay, tools, the TradingView indicator and spreadsheets.', true],
          ['Next', 'Wheel Tracker beta', 'Log real positions and see cost basis and annualized return.'],
          ['Then', 'Retirement Runway', 'Plan contributions and see your runway in today’s dollars.'],
          ['Later', 'Trader Toolkit and sheet sync', 'Tools on the go, and sync with the spreadsheet templates.'],
        ].map((r) => `<li><div class="tile"><span class="pill ${r[3] ? 'solid' : ''}" style="align-self:flex-start">${r[0]}</span><span class="tile-t">${r[1]}</span><span class="tile-p">${r[2]}</span></div></li>`).join('')}</ol>
      </div></section>`;
    return 'Apps';
  };
})();
