/* heroChart: a live, ticking 2-minute chart that narrates what happens. Used on the home page. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;

  SML.widgets.heroChart = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('hero');
    const TICKS = 7;
    let seed = opts.seed || 11 + Math.floor(Math.random() * 400);
    let sess, shown, tick, playing, speed = 1, events, lastMsg, endTimer = null, visible = true;

    root.innerHTML = `
      <div class="wg-bar hc-bar">
        <div class="hc-quote"><span class="hc-sym">DEMO</span><span class="hc-tf">2-min · simulated</span></div>
        <div class="hc-px"><span class="hc-price mono" id="${id}-px">—</span><span class="pill" id="${id}-chg">—</span></div>
        <span class="grow"></span>
        <span class="pill" id="${id}-side">—</span>
        <span class="hc-time mono" id="${id}-time">9:30</span>
      </div>
      <div class="wg-bar">
        ${ui.chips(id + '-ov', [
          { k: 'lv', label: 'Key levels', color: 'var(--accent)', on: true },
          { k: 'vw', label: 'VWAP', color: 'var(--info)', on: true },
          { k: 'ema', label: '13 / 48 EMA', color: 'var(--violet)', on: false },
          { k: 'vol', label: 'Volume', color: 'var(--up)', on: true },
        ])}
      </div>
      <div class="wg-fig hc-fig"></div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-actions">
        <button type="button" class="btn sm btn-g" id="${id}-play"></button>
        ${ui.seg(id + '-spd', [{ v: '1', label: '1×' }, { v: '3', label: '3×' }, { v: '8', label: '8×' }], '1', 'Speed')}
        <button type="button" class="btn sm btn-g" id="${id}-new">New day</button>
        <span class="grow"></span>
        <a class="btn sm btn-a" href="#play">Trade it yourself</a>
      </div>`;

    SML.css(`.hc-bar{gap:10px 18px}.hc-quote{display:flex;flex-direction:column;gap:3px}.hc-sym{font:600 12px var(--mono);color:var(--ink);letter-spacing:.16em}.hc-tf{font:500 10.5px var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
      .hc-px{display:flex;align-items:center;gap:10px}.hc-price{font-family:var(--display);font-size:38px;font-weight:400;color:var(--ink);line-height:.9;letter-spacing:.01em}.hc-time{font:600 12px var(--mono);color:var(--muted);letter-spacing:.06em}
      .wg-actions .grow{flex:1 1 auto}.hc-fig{cursor:crosshair}`);

    const fig = root.querySelector('.hc-fig');
    const $ = (s) => document.getElementById(id + '-' + s);
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-spd')) { speed = Number(st.seg(id + '-spd')); restartTimer(); }
      draw();
    });

    function newDay(s) {
      seed = s; sess = SML.data.session(seed, { bars: 100 });
      const r = SML.rng(seed + 9);
      scan.lastVw = null; shown = SML.reduced() ? sess.day.length : 30 + r.int(0, 12); tick = 0; events = []; lastMsg = null;
      // pre-scan events for bars already shown
      for (let i = 0; i < shown; i++) scan(i, true);
      if (!lastMsg) lastMsg = { cls: 'acc', pill: '9:30 open', text: 'The opening bell rang. Watch how price reacts to the premarket high and low.' };
    }

    /* forming candle for the current tick */
    function forming() {
      const k = sess.day[shown]; if (!k) return null;
      const up = k.c >= k.o; const pts = up ? [k.o, k.l, k.h, k.c] : [k.o, k.h, k.l, k.c];
      const t = (tick / (TICKS - 1)) * 3; const seg = Math.min(2, Math.floor(t)); const f = t - seg;
      const px = pts[seg] + (pts[seg + 1] - pts[seg]) * f;
      let hi = k.o, lo = k.o; for (let s = 0; s <= seg; s++) { hi = Math.max(hi, pts[s]); lo = Math.min(lo, pts[s]); } hi = Math.max(hi, px); lo = Math.min(lo, px);
      return { o: k.o, h: hi, l: lo, c: px, v: k.v * ((tick + 1) / TICKS), t: k.t };
    }

    /* event detection on a completed bar i */
    function scan(i, silent) {
      const d = sess.day, k = d[i]; const pk = i > 0 ? d[i - 1] : null;
      const vw = SML.ind.vwap(d.slice(0, i + 1));
      const allC = sess.pre.map((x) => x.c).concat(d.slice(0, i + 1).map((x) => x.c));
      const e13 = SML.ind.ema(allC, 13), e48 = SML.ind.ema(allC, 48); const n = allC.length - 1;
      const add = (cls, pill, text, mark) => { lastMsg = { cls, pill, text }; if (mark && !events.some((e) => e.pill === pill)) events.push({ i, cls, y: mark, pill }); };
      const avgV = d.slice(Math.max(0, i - 10), i).reduce((s, x) => s + x.v, 0) / Math.max(1, Math.min(10, i));
      const crossedUp = (lvl) => pk && pk.c <= lvl && k.c > lvl;
      const crossedDn = (lvl) => pk && pk.c >= lvl && k.c < lvl;
      if (i === 0) add('acc', '9:30 open', 'The opening bell rang. The first minutes are fast and messy, so most traders wait.');
      if (i > 2 && k.v > avgV * 2.1) add('info', 'Volume ' + (k.v / avgV).toFixed(1) + '×', 'Volume jumped to ' + (k.v / avgV).toFixed(1) + ' times the recent average. Big players are active.');
      const vwOk = i - (scan.lastVw == null ? -99 : scan.lastVw) > 8;
      if (vwOk && pk && pk.c < vw[i - 1] && k.c > vw[i]) { scan.lastVw = i; add('up', 'Above VWAP', 'Price crossed above VWAP, the day’s average price. Buyers are in control for now.'); }
      if (vwOk && pk && pk.c > vw[i - 1] && k.c < vw[i]) { scan.lastVw = i; add('dn', 'Below VWAP', 'Price slipped under VWAP. Sellers have the edge until it is reclaimed.'); }
      if (n > 1 && e13[n - 1] <= e48[n - 1] && e13[n] > e48[n] && i > 3) add('vio', 'EMA cross', 'The 13 EMA crossed above the 48 EMA. Short-term momentum turned up.');
      if (n > 1 && e13[n - 1] >= e48[n - 1] && e13[n] < e48[n] && i > 3) add('vio', 'EMA cross', 'The 13 EMA crossed below the 48 EMA. Short-term momentum turned down.');
      if (crossedUp(sess.pmh)) add('up', 'PMH break', 'Closed above the premarket high. Patient traders now wait for a retest that holds.', k.l);
      if (crossedDn(sess.pml)) add('dn', 'PML break', 'Closed below the premarket low. Watch for a retest from underneath.', k.h);
      if (crossedUp(sess.pdh)) add('up', 'PDH break', 'Price closed above yesterday’s high. That often opens room to run.', k.l);
      if (crossedDn(sess.pdl)) add('dn', 'PDL break', 'Price closed below yesterday’s low. A bearish sign for the day.', k.h);
      if (crossedDn(sess.pmh)) add('dn', 'Back below PMH', 'Price fell back under the premarket high. A break that fails like this is a false breakout.', k.h);
      // retest that holds
      if (i > 3 && k.c > sess.pmh && Math.abs(k.l - sess.pmh) < 0.12 && d.slice(Math.max(0, i - 8), i).some((x) => x.c > sess.pmh + 0.15)) add('up', 'Retest held', 'Price dipped back to the premarket high and held. This is the classic entry spot, with a stop just under the level.', k.l);
      if (i > 3 && k.c < sess.pml && Math.abs(k.h - sess.pml) < 0.12 && d.slice(Math.max(0, i - 8), i).some((x) => x.c < sess.pml - 0.15)) add('dn', 'Retest failed', 'Price popped back up to the premarket low and got rejected. Sellers defended it.', k.h);
      if (i > 0 && Math.abs(k.h - sess.pdh) < 0.1 && k.c < sess.pdh) add('acc', 'Testing PDH', 'Price is testing yesterday’s high, a level where sellers showed up before.', k.h);
    }

    function draw() { redraw(); }
    const redraw = ui.responsive(fig, (W) => {
      if (!sess) return;
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.52, 260, 400));
      const showVol = st.on(id + '-ov', 'vol'), showLv = st.on(id + '-ov', 'lv'), showVw = st.on(id + '-ov', 'vw'), showEma = st.on(id + '-ov', 'ema');
      const d = sess.day.slice(0, shown); const fk = forming(); if (fk) d.push(fk);
      const N = compact ? 36 : 64; const start = Math.max(0, d.length - N);
      const showPre = start === 0;
      const padR = compact ? 46 : 64, padL = 6, top = 14, volH = showVol ? Math.round(H * 0.17) : 0, bot = 22;
      const plotB = H - bot - volH - (showVol ? 8 : 0);
      const preW = showPre ? Math.round((W - padR - padL) * (compact ? 0.16 : 0.14)) : 0;
      const x0 = padL + preW + (showPre ? 8 : 0), x1 = W - padR;
      const slot = (x1 - x0) / N; const bw = Math.max(1.4, Math.min(9, slot * 0.62));
      const xd = (i) => x0 + (i - start + 0.5) * slot;
      const xp = (i) => padL + (i + 0.5) * (preW / sess.pre.length);
      // y range fixed for the session
      const allH = sess.day.map((k) => k.h).concat(sess.pre.map((k) => k.h), [sess.pdh]); const allL = sess.day.map((k) => k.l).concat(sess.pre.map((k) => k.l), [sess.pdl]);
      const yMax = Math.max(...allH) + 0.3, yMin = Math.min(...allL) - 0.3;
      const y = SML.lin(yMin, yMax, plotB, top);
      let b = '';
      // grid
      SML.ticks(yMin, yMax, compact ? 4 : 6).forEach((v) => { b += S.line(padL, y(v), x1, y(v), 's-grid') + S.text(W - 4, y(v) + 4, v.toFixed(0), 'xs mono', 'end'); });
      if (showPre) {
        b += S.rect(padL, top - 6, preW + 4, plotB - top + 10, 'f-shade', 0, ' opacity=".7"');
        b += S.text(padL + 4, top + 6, compact ? 'PRE' : 'PREMARKET', 'cap');
        b += S.candles(sess.pre, xp, Math.max(1, (preW / sess.pre.length) * 0.55), y, { cls: 'o70' });
        b += S.line(x0 - 4, top - 6, x0 - 4, H - bot, 's-mut dash');
      }
      const LV = [['PDH', sess.pdh], ['PMH', sess.pmh], ['PML', sess.pml], ['PDL', sess.pdl]];
      if (showLv) LV.forEach(([k, v]) => { b += S.line(padL, y(v), x1, y(v), 's-acc dash w15'); });
      // vwap & emas
      const vw = SML.ind.vwap(d);
      const closes = sess.pre.map((k) => k.c).concat(d.map((k) => k.c));
      if (showEma) {
        const e13 = SML.ind.ema(closes, 13).slice(sess.pre.length), e48 = SML.ind.ema(closes, 48).slice(sess.pre.length);
        b += S.poly(e48.map((v, i) => (i >= start ? [xd(i), y(v)] : null)), 's-info w15 dash2');
        b += S.poly(e13.map((v, i) => (i >= start ? [xd(i), y(v)] : null)), 's-vio w2');
      }
      if (showVw) b += S.poly(vw.map((v, i) => (i >= start ? [xd(i), y(v)] : null)), 's-info w25');
      // volume
      if (showVol) {
        const vb = H - bot; const maxV = Math.max(...sess.day.map((k) => k.v));
        b += S.volume(d, xd, bw, vb, volH, { from: start, maxV, hi: new Set([d.length - 1]) });
        b += S.line(padL, vb + 0.5, x1, vb + 0.5, 's-line');
      }
      b += S.candles(d, xd, bw, y, { from: start });
      if (showLv) LV.forEach(([k, v]) => { b += S.rect(x0 + 2, y(v) - 8, 32, 15, 'f-paper s-acc', 2) + S.text(x0 + 18, y(v) + 3.5, k, 'xs mono b acc', 'middle'); });
      // event markers
      events.forEach((e) => { if (e.i >= start && e.i < d.length) { const up = e.cls === 'up'; b += S.circle(xd(e.i), up ? y(e.y) + 9 : y(e.y) - 9, 3.6, 'f-' + (e.cls === 'dn' ? 'dn' : e.cls === 'up' ? 'up' : 'acc') + ' s-surf w15'); } });
      // live price tag
      const last = d[d.length - 1]; const open = sess.day[0].o; const upDay = last.c >= open;
      b += S.line(xd(d.length - 1), y(last.c), x1, y(last.c), (upDay ? 's-up' : 's-dn') + ' dash2');
      b += S.rect(x1 + 1, y(last.c) - 9, padR - 3, 18, upDay ? 'f-up' : 'f-dn', 3) + S.text(x1 + padR / 2, y(last.c) + 4, last.c.toFixed(2), 'sm mono b on', 'middle');
      // time axis
      const tl = compact ? [0, 30, 60, 90, 120, 150, 180] : [0, 30, 60, 90, 120, 150, 180];
      tl.forEach((m) => { const i = m / 2; if (i >= start && i < start + N) b += S.text(xd(i), H - 6, F.time(m), 'xs mono', 'middle'); });
      // hover
      if (hoverI != null && hoverI >= start && hoverI < d.length) {
        const k = d[hoverI]; const hx = xd(hoverI);
        b += S.line(hx, top - 6, hx, H - bot, 's-mut dash2');
        const txt = `${F.time(k.t)}  O ${k.o.toFixed(2)}  H ${k.h.toFixed(2)}  L ${k.l.toFixed(2)}  C ${k.c.toFixed(2)}`;
        const tw = compact ? 150 : 268; const tx = SML.clamp(hx - tw / 2, padL, W - tw - 2);
        if (compact) { b += S.rect(tx, top - 8, tw, 30, 'tipbg', 4) + S.text(tx + 8, top + 4, F.time(k.t) + '  C ' + k.c.toFixed(2), 'sm mono ink') + S.text(tx + 8, top + 17, 'H ' + k.h.toFixed(2) + '  L ' + k.l.toFixed(2), 'xs mono'); }
        else b += S.rect(tx, top - 8, tw, 20, 'tipbg', 4) + S.text(tx + 8, top + 6, txt, 'sm mono ink');
      }
      fig.innerHTML = S.wrap(W, H, 'Live simulated 2-minute chart with premarket, key levels, VWAP and volume', b);
      fig._geo = { xd, start, len: d.length, slot, x0 };
      // readouts
      $('px').textContent = last.c.toFixed(2);
      const ch = ((last.c - open) / open) * 100;
      $('chg').className = 'pill ' + (ch >= 0 ? 'up' : 'dn'); $('chg').textContent = F.spct(ch, 2);
      const above = last.c >= vw[vw.length - 1];
      $('side').className = 'pill ' + (above ? 'up' : 'dn'); $('side').textContent = above ? 'Above VWAP' : 'Below VWAP';
      $('time').textContent = F.time(last.t + (fk ? 2 * ((tick + 1) / TICKS) : 2)) + ' ET';
      if (lastMsg) $('msg').innerHTML = ui.msg(lastMsg.cls, lastMsg.pill, lastMsg.text);
      $('play').innerHTML = playing ? '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="3.5" height="11" class="f-acc"/><rect x="9.5" y="2.5" width="3.5" height="11" class="f-acc"/></svg>Pause' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5l9 5.5-9 5.5z" class="f-acc"/></svg>Play';
    });

    let hoverI = null;
    fig.addEventListener('pointermove', (e) => {
      const svg = fig.querySelector('svg'); const g = fig._geo; if (!svg || !g) return;
      const p = ui.pt(svg, e); const i = Math.floor((p.x - g.x0) / g.slot) + g.start;
      const ni = i >= g.start && i < g.len ? i : null; if (ni !== hoverI) { hoverI = ni; if (!playing) draw(); }
    });
    fig.addEventListener('pointerleave', () => { hoverI = null; if (!playing) draw(); });

    let timer = null;
    function step() {
      if (!visible || document.hidden) return;
      tick++;
      if (tick >= TICKS) {
        tick = 0; scan(shown); shown++;
        if (shown >= sess.day.length) {
          playing = false; stopTimer();
          lastMsg = { cls: 'acc', pill: 'Session done', text: 'That was the first three hours. A new day starts in a moment, or press New day.' };
          draw();
          endTimer = setTimeout(() => { newDay(seed + 1); playing = true; restartTimer(); draw(); }, 3500);
          return;
        }
      }
      draw();
    }
    function stopTimer() { if (timer) clearInterval(timer); timer = null; }
    function restartTimer() { stopTimer(); if (playing) timer = setInterval(step, Math.round(150 / speed)); }
    SML.onCleanup(() => { stopTimer(); clearTimeout(endTimer); });
    if (window.IntersectionObserver) { const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }); io.observe(root); SML.onCleanup(() => io.disconnect()); }

    $('play').addEventListener('click', () => {
      if (shown >= sess.day.length) { clearTimeout(endTimer); newDay(seed + 1); }
      playing = !playing; restartTimer(); draw();
    });
    $('new').addEventListener('click', () => { clearTimeout(endTimer); newDay(seed + 7); if (!SML.reduced()) { playing = true; restartTimer(); } draw(); });

    newDay(seed);
    playing = !SML.reduced();
    restartTimer();
    draw();
  };
})();
