/* Stock Market Lessons: Risk & Sizing + Trading Styles (fork C) */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const R1 = SML.R1;

  SML.css(`
.rk-fields{grid-column:1/-1;grid-template-columns:repeat(auto-fit,minmax(118px,1fr))}
.rk-meter{flex:1 1 140px;height:8px;background:var(--shade);border-radius:4px;overflow:hidden;min-width:90px}
.rk-meter i{display:block;height:100%;background:var(--up);width:0;transition:width .3s}
.rk-steps{display:flex;flex-direction:column;gap:2px;padding:8px}
.rk-step{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;border-radius:5px}
.rk-step.on{background:var(--accent-t)}
.rk-step input{width:18px;height:18px;accent-color:var(--up);margin:0 auto;cursor:pointer}
.rk-stepbtn{display:flex;flex-wrap:wrap;gap:2px 12px;align-items:baseline;text-align:left;border:0;background:transparent;padding:9px 8px 9px 2px;cursor:pointer;color:var(--ink);font-size:14.5px;line-height:1.35;border-radius:5px;width:100%;min-width:0}
.rk-stepbtn .t{font:600 11.5px var(--mono);color:var(--muted);flex:0 0 112px}
.rk-stepbtn .s{flex:1 1 200px;min-width:0}
.rk-step.done .rk-stepbtn .s{color:var(--muted);text-decoration:line-through;text-decoration-color:var(--muted)}
.rk-pc{display:grid;gap:16px 28px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));padding:16px}
.rk-pc h4{font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 10px}
.rk-pc ul.tick li{font-size:14.5px}
.rk-tblwrap{padding:0}
.rk-tbl{min-width:620px}
.rk-tbl tbody tr{cursor:pointer;transition:background-color .15s}
.rk-tbl tbody tr:hover td{background:var(--paper)}
.rk-tbl tbody tr.pass td{background:var(--accent-t)}
.rk-tbl tbody tr.fail td{color:var(--muted)}
.rk-tbl tbody tr.sel td{background:var(--info-t);color:var(--ink)}
.rk-tbl tbody tr:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.rk-tbl td.bad{color:var(--down)!important;font-weight:600}
.rk-tbl td.tk{font:600 13.5px var(--mono);color:var(--ink)}
.rk-legend{display:flex;flex-direction:column;gap:10px;min-width:0}
.rk-legend .row{display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:10px;align-items:center;font-size:14.5px}
.rk-legend .row b{font-family:var(--mono);font-variant-numeric:tabular-nums}
.rk-legend .row span.n{color:var(--ink)}
.rk-legend .row small{display:block;color:var(--muted);font-size:12.5px}
.rk-sw{width:12px;height:12px;border-radius:3px;display:inline-block}
.rk-sw.c-info{background:var(--info)} .rk-sw.c-acc{background:var(--accent)} .rk-sw.c-dn{background:var(--down)} .rk-sw.c-mut{background:var(--muted)} .rk-sw.c-vio{background:var(--violet)} .rk-sw.c-up{background:var(--up)}
.rk-split{display:grid;gap:18px 24px;grid-template-columns:1fr;align-items:center;padding:16px;background-color:var(--paper);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:20px 20px}
.rk-split > .rk-donut{display:flex;justify-content:center}
.rk-split > .rk-legend{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:14px 16px}
.rk-wide .rk-split{grid-template-columns:auto minmax(0,1fr)}
.rk-quiz{padding:20px 18px;display:flex;flex-direction:column;gap:14px}
.rk-quiz .q{font-size:19px;font-weight:600;color:var(--ink);line-height:1.35;text-wrap:balance}
.rk-quiz .quiz-opts{display:grid;gap:8px}
.rk-qbar{display:flex;align-items:center;gap:12px;flex:1 1 auto;min-width:0}
.rk-qbar .prog{flex:1 1 0;min-width:40px}
.rk-tbl td{vertical-align:middle}
.rk-res{display:flex;flex-direction:column;gap:12px;min-width:0}
.rk-res-h{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:34px;line-height:.9;color:var(--ink);text-wrap:balance}
.rk-res p{font-size:15px;max-width:52ch}
.rk-links{display:flex;flex-wrap:wrap;gap:8px}
`);

  /* ---------- small helpers ---------- */
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 0 : 1) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e4 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const pctTxt = (f, d) => F.pct(f * 100, d == null ? 0 : d);
  const minusIcon = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-dn-t"/><path d="M5.5 9h7" class="nf s-dn w2"/></svg>';
  const cons = (items) => `<ul class="tick">${items.map((t) => `<li>${minusIcon}<span>${t}</span></li>`).join('')}</ul>`;
  /* push labels apart vertically */
  function spread(items, gap, lo, hi) {
    items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
    const over = items.length ? items[items.length - 1].y - hi : 0;
    if (over > 0) { items.forEach((it) => (it.y -= over)); }
    items.forEach((it) => { if (it.y < lo) it.y = lo; });
    return items;
  }
  function arcPath(cx, cy, ro, ri, a0, a1) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (r, a) => [R1(cx + r * Math.cos(a)), R1(cy + r * Math.sin(a))];
    const [x0, y0] = p(ro, a0), [x1, y1] = p(ro, a1), [x2, y2] = p(ri, a1), [x3, y3] = p(ri, a0);
    return `M${x0},${y0} A${ro},${ro} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 ${large} 0 ${x3},${y3} Z`;
  }
  function donut(cx, cy, ro, ri, parts) {
    const tot = parts.reduce((s, p) => s + Math.max(0, p.v), 0) || 1; let a = -Math.PI / 2; let s = '';
    parts.forEach((p) => {
      const f = Math.max(0, p.v) / tot; if (f <= 0.0005) return;
      const a1 = a + Math.min(f, 0.99995) * Math.PI * 2;
      s += S.path(arcPath(cx, cy, ro, ri, a, a1), p.cls + ' s-surf w2');
      a = a1;
    });
    return s;
  }
  /* html tooltip inside a .wg-fig (fig has 12px padding) */
  function tipper(fig) {
    let tip = null;
    return {
      show(x, y, html, W) {
        if (!tip || !fig.contains(tip)) { tip = document.createElement('div'); tip.className = 'wg-tip'; fig.appendChild(tip); }
        tip.hidden = false; tip.innerHTML = html;
        const tw = tip.offsetWidth; let left = 12 + x + 14; if (left + tw > 12 + W) left = 12 + x - 14 - tw;
        tip.style.left = Math.max(4, left) + 'px'; tip.style.top = Math.max(4, 12 + y - 24) + 'px';
      },
      hide() { if (tip) tip.hidden = true; },
    };
  }

  /* =====================================================================
     1. onePct: what a losing streak does at different risk levels
     ===================================================================== */
  SML.widgets.onePct = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('op');
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-r', label: 'Risk per trade', min: 0.5, max: 10, step: 0.5, value: opts.risk || 5, fmt: (v) => trim(v, 1) + '%' })}
        ${ui.slider({ id: id + '-n', label: 'Losses in a row', min: 1, max: 20, step: 1, value: opts.streak || 10, fmt: 'num' })}
        ${ui.slider({ id: id + '-a', label: 'Account size', min: 1000, max: 100000, step: 1000, value: opts.account || 10000, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('You have left', id + '-left', 'hl')}${ui.stat('Account lost', id + '-lost')}${ui.stat('Gain to get back', id + '-gain')}${ui.stat('Same streak at 1%', id + '-one')}</div>
      <div class="wg-msg" id="${id}-msg"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const r = st.n(id + '-r') / 100, n = st.n(id + '-n'), A = st.n(id + '-a');
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.46, 250, 320));
      const pl = compact ? 42 : 54, pr = 14, pt = 36, pb = 38;
      const x = SML.lin(0, n, pl, W - pr), y = SML.lin(0, A, H - pb, pt);
      const sev = r <= 0.0101 ? 'up' : r <= 0.0201 ? 'acc' : 'dn';
      const same = Math.abs(r - 0.01) < 1e-9;
      const lc = r < 0.0099 ? 'info' : sev;
      let b = '';
      [0, 0.25, 0.5, 0.75, 1].forEach((f) => { b += S.line(pl, y(A * f), W - pr, y(A * f), 's-grid'); b += S.text(pl - 8, y(A * f) + 4, kfmt(A * f), 'xs mono', 'end'); });
      const stepX = n <= 10 ? 1 : compact ? 4 : 2;
      for (let i = 0; i <= n; i += stepX) b += S.text(x(i), H - pb + 16, i, 'xs mono', 'middle');
      if (n % stepX) b += S.text(x(n), H - pb + 16, n, 'xs mono', 'middle');
      b += S.text(W - pr, H - 4, 'losses in a row →', 'sm', 'end');
      const one = [], you = [];
      for (let i = 0; i <= n; i++) { one.push([x(i), y(A * Math.pow(0.99, i))]); you.push([x(i), y(A * Math.pow(1 - r, i))]); }
      // lost money area
      b += S.polygon(you.concat([[x(n), y(A)], [x(0), y(A)]]), 'f-dn-t');
      const youEnd = A * Math.pow(1 - r, n), oneEnd = A * Math.pow(0.99, n);
      const mid = Math.round(n * 0.62), gapPx = y(A * Math.pow(1 - r, mid)) - y(A);
      if (gapPx > 44 && !same) b += S.text(x(mid) - 6, y(A) + gapPx * 0.42 + 4, 'money lost', 'sm dn b', 'end');
      b += S.poly(one, 's-up w25');
      if (!same) b += S.poly(you, `s-${lc} w25`);
      if (n <= 20) you.forEach((p) => (b += S.circle(p[0], p[1], 2.6, `f-${same ? 'up' : lc}`)));
      // legend
      b += S.line(pl, 16, pl + 18, 16, 's-up w25') + S.text(pl + 24, 20, '1% risk', 'sm ink');
      if (!same) b += S.line(pl + 92, 16, pl + 110, 16, `s-${lc} w25`) + S.text(pl + 116, 20, `your ${trim(r * 100, 1)}% risk`, 'sm ink');
      // end labels
      const endTxt = (v) => (compact ? '$' + trim(v / 1000, 1) + 'k' : F.usd0(v));
      const youHigher = youEnd > oneEnd;
      const labs = [{ y: youHigher && !same ? y(oneEnd) + 18 : y(oneEnd) - 10, t: (compact ? '' : '1%: ') + endTxt(oneEnd), c: 'sm up b' }];
      if (!same) labs.push({ y: youHigher ? y(youEnd) - 10 : y(youEnd) + 18, t: (compact ? '' : 'you: ') + endTxt(youEnd), c: `sm ${lc} b` });
      spread(labs, 15, pt + 2, H - pb - 6).forEach((l) => (b += S.text(x(n) - 8, l.y, l.t, l.c, 'end')));
      fig.innerHTML = S.wrap(W, H, `Account balance through ${n} losses in a row at ${trim(r * 100, 1)}% risk versus 1% risk`, b);
      const lost = 1 - youEnd / A, gain = youEnd > 0 ? A / youEnd - 1 : Infinity;
      setT(id + '-left', F.usd0(youEnd));
      setT(id + '-lost', pctTxt(lost, lost < 0.1 ? 1 : 0), lost > 0.2 ? 'dn' : '');
      setT(id + '-gain', '+' + pctTxt(gain, gain < 0.1 ? 1 : 0), gain > 0.25 ? 'dn' : '');
      setT(id + '-one', F.usd0(oneEnd), 'up');
      const rr = trim(r * 100, 1) + '%';
      if (sev === 'up') setMsg(id + '-msg', 'up', 'Survivable', `After ${n} losses in a row you still have ${pctTxt(1 - lost)} of your money. A few good trades gets you back.`);
      else if (sev === 'acc') setMsg(id + '-msg', 'acc', 'Careful', `At ${rr} risk, ${n} straight losses cost ${pctTxt(lost)}. You need +${pctTxt(gain)} just to get back to even.`);
      else if (r <= 0.05) setMsg(id + '-msg', 'dn', 'Dangerous', `At ${rr} risk, ${n} losses in a row erase ${pctTxt(lost)} of the account. Getting back needs +${pctTxt(gain)}.`);
      else setMsg(id + '-msg', 'dn', 'Account killer', `At ${rr} risk a normal losing streak wipes out ${pctTxt(lost)}. Most traders never climb out of that hole.`);
    });
  };

  /* =====================================================================
     2. sizeCalc: position size from risk budget and stop (drag the stop)
     ===================================================================== */
  SML.widgets.sizeCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('sz');
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        <div class="fields rk-fields">
          ${ui.field({ id: id + '-acct', label: 'Account $', value: opts.account || 25000, min: 0, step: 100 })}
          ${ui.field({ id: id + '-risk', label: 'Risk %', value: opts.risk || 1, min: 0, step: 0.25 })}
          ${ui.field({ id: id + '-entry', label: 'Entry $', value: opts.entry || 50, min: 0, step: 0.01 })}
          ${ui.field({ id: id + '-stop', label: 'Stop $', value: opts.stop || 48.5, min: 0, step: 0.01 })}
        </div>
        ${ui.slider({ id: id + '-tr', label: 'Profit target', min: 1, max: 5, step: 0.5, value: 2, fmt: (v) => trim(v, 1) + 'R' })}
      </div>
      <div class="wg-read">
        <div class="stat hl big"><span class="stat-l" id="${id}-shl">Shares to buy</span><span class="stat-v" id="${id}-sh">—</span></div>
        ${ui.stat('Position', id + '-pos')}${ui.stat('Of account', id + '-pct')}${ui.stat('Max loss', id + '-loss')}${ui.stat('Risk / share', id + '-rps')}${ui.stat('Target', id + '-tgt')}
      </div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">shares = (account × risk %) ÷ (entry − stop). Drag the red stop line on the chart or type your own numbers. A stop above the entry means a short trade.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    let frozen = null, lastY = null, refRisk = null, lastRisk = 1.5;
    ui.drag(fig, {
      sel: '.rk-grab',
      start() { frozen = lastY; refRisk = lastRisk; },
      move(pt) {
        if (!frozen) return; const [lo, hi] = frozen.d;
        let p = frozen.inv(pt.y); p = SML.clamp(p, Math.min(lo, hi) + 0.01, Math.max(lo, hi) - 0.01);
        const el = $id(id + '-stop'); el.value = p.toFixed(2); draw();
      },
      end() { frozen = null; refRisk = null; draw(); },
    });
    const draw = ui.responsive(fig, (W) => {
      const acct = st.n(id + '-acct'), rp = st.n(id + '-risk'), E = st.n(id + '-entry'), Sp = st.n(id + '-stop'), tr = st.n(id + '-tr');
      const valid = isFinite(acct) && acct > 0 && isFinite(rp) && rp > 0 && isFinite(E) && E > 0 && isFinite(Sp) && Sp > 0 && Math.abs(E - Sp) >= 0.005;
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.42, 250, 320));
      const pl = 10, pr = compact ? 92 : 118, pt = 16, pb = 16;
      const long = !valid || Sp < E, dir = long ? 1 : -1, risk = Math.abs(E - Sp);
      const tgt = E + dir * tr * risk;
      // illustrative approach candles in units of risk: the swing low sits just above the stop
      const unit = refRisk || (valid ? risk : 1.5); if (!refRisk && valid) lastRisk = risk;
      const u = [[0, -0.55], [5, 0.35], [9, -0.25], [14, 0.3], [19, -0.72], [24, -0.12], [27, 0]];
      const closes = SML.data.path(u, 28, 21, 0.1).map((v) => (E > 0 ? E : 50) + dir * v * unit);
      const cd = SML.data.candles(closes, 21, { wick: 0.25 });
      let y;
      if (frozen) y = frozen;
      else {
        const vals = [E, Sp, tgt, E + dir * 3 * risk].concat(cd.map((k) => k.h), cd.map((k) => k.l)).filter((v) => isFinite(v) && v > 0);
        let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.1 || 1; lo -= pad; hi += pad;
        y = SML.lin(lo, hi, H - pb, pt);
      }
      lastY = y;
      const xE = pl + (W - pl - pr) * (compact ? 0.48 : 0.55);
      const x = SML.lin(0, cd.length - 1, pl + 8, xE - 8);
      const bw = Math.max(3, Math.min(9, ((xE - pl) / cd.length) * 0.6));
      let b = '';
      if (valid) {
        b += S.rect(xE, Math.min(y(E), y(Sp)), W - pr - xE, Math.abs(y(Sp) - y(E)), 'f-dn-t');
        b += S.rect(xE, Math.min(y(E), y(tgt)), W - pr - xE, Math.abs(y(tgt) - y(E)), 'f-up-t');
      }
      b += S.candles(cd, x, bw, y);
      if (valid) {
        const labs = [];
        for (let k = 1; k <= Math.max(3, Math.floor(tr)); k++) {
          const p = E + dir * k * risk; if (p <= 0) continue;
          const on = Math.abs(k - tr) < 1e-9;
          b += S.line(xE, y(p), W - pr, y(p), on ? 's-up w2' : 's-up dash o70');
          labs.push({ y: y(p) + 4, t: `${k}R ${F.usd(p)}`, c: on ? 'sm up b' : 'sm up' });
        }
        if (tr % 1) { b += S.line(xE, y(tgt), W - pr, y(tgt), 's-up w2'); labs.push({ y: y(tgt) + 4, t: `${trim(tr, 1)}R ${F.usd(tgt)}`, c: 'sm up b' }); }
        b += S.line(xE - 10, y(E), W - pr, y(E), 's-ink w2');
        labs.push({ y: y(E) + 4, t: `Entry ${F.usd(E)}`, c: 'sm ink b' });
        labs.push({ y: y(Sp) + 4, t: `Stop ${F.usd(Sp)}`, c: 'sm dn b' });
        spread(labs, 14, pt + 4, H - 4).forEach((l) => (b += S.text(W - pr + 8, l.y, compact ? l.t.replace('Entry ', '').replace('Stop ', '') : l.t, l.c)));
        // stop line + grab area + handle
        b += S.line(xE, y(Sp), W - pr, y(Sp), 's-dn w25');
        b += S.rect(xE, y(Sp) - 10, W - pr - xE, 20, 'hit rk-grab grab');
        const hx = W - pr - 18;
        b += S.circle(hx, y(Sp), 9, 'handle rk-grab');
        b += S.line(hx - 3, y(Sp) - 3, hx + 3, y(Sp) - 3, 's-acc w15') + S.line(hx - 3, y(Sp) + 3, hx + 3, y(Sp) + 3, 's-acc w15');
        b += S.text(hx - 14, y(Sp) + (long ? 20 : -12), 'drag the stop', 'xs dn b', 'end');
      }
      fig.innerHTML = S.wrap(W, H, 'Trade plan chart with entry, stop and profit targets', b, 'drag');
      if (!valid) {
        ['-sh', '-pos', '-pct', '-loss', '-rps', '-tgt'].forEach((k) => setT(id + k, '—', ''));
        setMsg(id + '-msg', 'dn', 'Check inputs', 'Enter an account size, a risk %, an entry price and a stop that is different from the entry.');
        return;
      }
      const budget = (acct * rp) / 100, shares = Math.floor(budget / risk + 1e-9);
      const pos = shares * E, pct = pos / acct, loss = shares * risk, prof = shares * tr * risk;
      $id(id + '-shl').textContent = long ? 'Shares to buy' : 'Shares to short';
      setT(id + '-sh', shares.toLocaleString('en-US'));
      setT(id + '-pos', F.usd0(pos));
      setT(id + '-pct', pctTxt(pct, pct < 0.1 ? 1 : 0), pct > 1 ? 'dn' : pct > 0.25 ? 'acc' : '');
      setT(id + '-loss', F.usd0(loss), 'dn');
      setT(id + '-rps', F.usd(risk));
      setT(id + '-tgt', F.usd(tgt), 'up');
      if (shares < 1) setMsg(id + '-msg', 'dn', 'Too wide', `Your risk per share (${F.usd(risk)}) is bigger than the ${F.usd0(budget)} you're willing to lose. Pick a closer stop or skip this trade.`);
      else if (pct > 1) setMsg(id + '-msg', 'dn', 'Too big', `This position is ${F.usd0(pos)}, more than your whole account. The stop is so tight the share count explodes. Cap the position at what you can pay for.`);
      else if (pct > 0.25) setMsg(id + '-msg', 'acc', 'Concentrated', `${pctTxt(pct)} of your account in one stock. The stop limits the planned loss to ${F.usd0(loss)}, but a gap through the stop could cost more.`);
      else setMsg(id + '-msg', 'up', 'Sized right', `If the stop is hit you lose ${F.usd0(loss)} (${trim(rp, 2)}% of the account). If the ${trim(tr, 1)}R target is hit you make ${F.usd0(prof)}.`);
    });
  };

  /* =====================================================================
     3. riskSim: Monte Carlo of win rate x reward:risk x risk %
     ===================================================================== */
  SML.widgets.riskSim = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('rs');
    const PATHS = 20, MAXN = 300, START = 10000;
    let seed = 11, U = gen(seed);
    function gen(s) { const r = SML.rng(s * 7919 + 3); const m = []; for (let p = 0; p < PATHS; p++) { const row = new Float32Array(MAXN); for (let t = 0; t < MAXN; t++) row[t] = r(); m.push(row); } return m; }
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-wr', label: 'Win rate', min: 20, max: 80, step: 1, value: opts.win || 45, fmt: 'pct' })}
        ${ui.slider({ id: id + '-rr', label: 'Reward : risk', min: 0.5, max: 4, step: 0.25, value: opts.rr || 2, fmt: (v) => trim(v) + ' : 1' })}
        ${ui.slider({ id: id + '-rk', label: 'Risk per trade', min: 0.5, max: 5, step: 0.5, value: opts.risk || 1, fmt: (v) => trim(v, 1) + '%' })}
        ${ui.slider({ id: id + '-nt', label: 'Number of trades', min: 50, max: 300, step: 10, value: opts.trades || 100, fmt: 'num' })}
      </div>
      <div class="wg-read">${ui.stat('Edge per trade', id + '-exp', 'hl')}${ui.stat('Median ending', id + '-med')}${ui.stat('Worst drawdown', id + '-dd')}${ui.stat('Futures that lost', id + '-lost')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button class="btn btn-g sm" type="button" data-act="rerun">Run again</button><span class="note">20 possible futures, $10,000 start. Same rules, different luck. Hover the chart to inspect a trade.</span></div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    const st = ui.wire(root, () => draw());
    root.querySelector('[data-act="rerun"]').addEventListener('click', () => { seed += 1; U = gen(seed); draw(); });
    let G = null; // geometry for hover
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4 || p.y > G.plotB + 4) { hideHover(); return; }
      const t = Math.round(SML.clamp(G.x.inv(p.x), 0, G.N));
      const vals = G.paths.map((q) => q.eq[t]).sort((a, b) => a - b);
      const hov = svg.querySelector('[data-hov]');
      const xx = G.x(t), ym = G.y(G.med[t]);
      if (hov) hov.innerHTML = S.line(xx, G.pt, xx, G.plotB, 's-ink dash') + S.circle(xx, SML.clamp(ym, G.pt, G.plotB), 4.5, 'f-ink');
      tip.show(xx, SML.clamp(ym, G.pt, G.plotB), `Trade ${t}<br>Median ${F.usd0(G.med[t])}<br><span class="up">Best ${F.usd0(vals[vals.length - 1])}</span><br><span class="dn">Worst ${F.usd0(vals[0])}</span>`, G.W);
    });
    function hideHover() { const svg = fig.querySelector('svg'); const hov = svg && svg.querySelector('[data-hov]'); if (hov) hov.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hideHover);
    const draw = ui.responsive(fig, (W) => {
      const p = st.n(id + '-wr') / 100, R = st.n(id + '-rr'), rk = st.n(id + '-rk') / 100, N = st.n(id + '-nt');
      const paths = U.map((row) => { const eq = [START]; let e = START, peak = START, dd = 0; for (let t = 0; t < N; t++) { e = row[t] < p ? e * (1 + rk * R) : e * (1 - rk); eq.push(e); if (e > peak) peak = e; dd = Math.max(dd, 1 - e / peak); } return { eq, dd, fin: e }; });
      const med = []; for (let t = 0; t <= N; t++) { const v = paths.map((q) => q.eq[t]).sort((a, b) => a - b); med.push((v[PATHS / 2 - 1] + v[PATHS / 2]) / 2); }
      const maxes = paths.map((q) => Math.max(...q.eq)).sort((a, b) => a - b);
      const mins = paths.map((q) => Math.min(...q.eq));
      let yMax = Math.max(START * 1.25, maxes[Math.floor(PATHS * 0.85)] * 1.06);
      let yMin = Math.min(START * 0.8, Math.min(...mins) * 0.95); yMin = Math.max(0, yMin);
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.56, 290, 400));
      const pl = compact ? 44 : 54, pr = 14, pt = 14, plotB = H - 92;
      const x = SML.lin(0, N, pl, W - pr), y = SML.lin(yMin, yMax, plotB, pt);
      let b = `<defs><clipPath id="${id}-clip"><rect x="${pl}" y="${pt}" width="${R1(W - pl - pr)}" height="${R1(plotB - pt)}"/></clipPath></defs>`;
      SML.ticks(yMin, yMax, 5).forEach((v) => { if (y(v) < pt - 1 || y(v) > plotB + 1) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 8, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, N, compact ? 3 : 5).filter((v) => x(v) < x(N) - 70).forEach((v) => (b += S.text(x(v), plotB + 16, v, 'xs mono', 'middle')));
      b += S.text(x(N), plotB + 16, N + ' trades', 'xs mono', 'end');
      b += S.line(pl, y(START), W - pr, y(START), 's-mut dash');
      const stepT = Math.max(1, Math.ceil(N / ((W - pl - pr) / 2)));
      let g = '';
      paths.forEach((q) => { const pts = []; for (let t = 0; t <= N; t += stepT) pts.push([x(t), y(q.eq[t])]); if (N % stepT) pts.push([x(N), y(q.eq[N])]); g += S.poly(pts, (q.fin >= START ? 's-up' : 's-dn') + ' w1 o50'); });
      const mp = []; for (let t = 0; t <= N; t += stepT) mp.push([x(t), y(med[t])]); if (N % stepT) mp.push([x(N), y(med[N])]);
      g += S.poly(mp, 's-ink w25');
      b += `<g clip-path="url(#${id}-clip)">${g}</g>`;
      const my = SML.clamp(y(med[N]), pt + 10, plotB - 4);
      b += S.text(W - pr - 4, my - 8, 'median', 'sm ink b', 'end');
      // breakeven gauge
      const be = 1 / (1 + R), gy = H - 34, gx = SML.lin(0, 1, pl, W - pr);
      b += S.rect(gx(0), gy, gx(be) - gx(0), 8, 'f-dn o70') + S.rect(gx(be), gy, gx(1) - gx(be), 8, 'f-up o70');
      b += S.line(gx(be), gy - 4, gx(be), gy + 12, 's-ink w2');
      const bx = SML.clamp(gx(be), pl + 50, W - pr - 50);
      b += S.text(bx, gy + 24, `breakeven ${Math.round(be * 100)}%`, 'sm ink', 'middle');
      const yx = gx(p);
      b += S.polygon([[yx, gy - 2], [yx - 6, gy - 11], [yx + 6, gy - 11]], 'f-ink');
      b += S.text(SML.clamp(yx, pl + 30, W - pr - 30), gy - 16, `you ${Math.round(p * 100)}%`, 'sm ink b', 'middle');
      if (yx > pl + 120) b += S.text(pl, gy - 16, 'WIN RATE', 'cap');
      else b += S.text(W - pr, gy - 16, 'WIN RATE', 'cap', 'end');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `${PATHS} simulated equity curves over ${N} trades with ${Math.round(p * 100)}% win rate and ${trim(R)} to 1 reward to risk`, b);
      G = { W, pl, pr, pt, plotB, x, y, N, med, paths };
      const exp = p * R - (1 - p);
      const worst = Math.max(...paths.map((q) => q.dd));
      const lostN = paths.filter((q) => q.fin < START).length;
      setT(id + '-exp', F.R(exp, 2), exp > 0 ? 'up' : 'dn');
      setT(id + '-med', F.usd0(med[N]), med[N] >= START ? 'up' : 'dn');
      setT(id + '-dd', F.minus + pctTxt(worst), worst > 0.3 ? 'dn' : '');
      setT(id + '-lost', `${lostN} of ${PATHS}`, lostN > PATHS / 2 ? 'dn' : '');
      if (exp <= 0) setMsg(id + '-msg', 'dn', 'No edge', `On average each trade ${exp < 0 ? 'loses ' + F.R(Math.abs(exp), 2).replace('+', '') : 'breaks even'}. You need to win more than ${Math.round(be * 100)}% at ${trim(R)}:1. More trades only makes a negative edge worse.`);
      else if (worst > 0.35) setMsg(id + '-msg', 'acc', 'Edge, too much risk', `The edge is positive (${F.R(exp, 2)} a trade), but at ${trim(rk * 100, 1)}% risk the worst future fell ${pctTxt(worst)} from its high. Lower the risk per trade.`);
      else setMsg(id + '-msg', 'up', 'Positive edge', `Each trade earns ${F.R(exp, 2)} on average. Luck still decides the order: the worst future dipped ${pctTxt(worst)} from its high before recovering.`);
    });
  };

  /* =====================================================================
     4. drawdownCalc: loss vs gain needed
     ===================================================================== */
  SML.widgets.drawdownCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('dd');
    const BASE = 10000;
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-l', label: 'Account falls by', min: 5, max: 90, step: 1, value: opts.loss || 30, fmt: 'pct' })}</div>
      <div class="wg-read">${ui.stat('Money lost', id + '-lostv')}${ui.stat('Money left', id + '-left')}${ui.stat('Gain to get back', id + '-gain', 'hl')}${ui.stat('Years at 10% a year', id + '-yrs')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button class="btn btn-g sm" type="button" data-act="play">Replay the drop and climb</button></div>`;
    const fig = root.querySelector('.wg-fig');
    let t = 1, raf = 0;
    const st = ui.wire(root, () => { cancelAnimationFrame(raf); t = 1; draw(); });
    SML.onCleanup(() => cancelAnimationFrame(raf));
    root.querySelector('[data-act="play"]').addEventListener('click', () => {
      cancelAnimationFrame(raf);
      if (SML.reduced()) { t = 1; draw(); return; }
      const t0 = performance.now();
      const step = (ts) => { t = Math.min(1, (ts - t0) / 2200); draw(); if (t < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    });
    const ease = (v) => 1 - Math.pow(1 - SML.clamp(v, 0, 1), 3);
    const draw = ui.responsive(fig, (W) => {
      const L = st.n(id + '-l') / 100, G = L / (1 - L);
      const compact = W < 560;
      const H = compact ? 430 : Math.round(SML.clamp(W * 0.42, 290, 330));
      let b = '';
      // ----- three bars: start, after the loss, climb back
      const bw = 44, gb = 30, panelW = 3 * bw + 2 * gb;
      const bx0 = compact ? Math.round((W - panelW) / 2) : 26;
      const bTop = 42, bBot = compact ? 186 : H - 44;
      const hy = SML.lin(0, 1, bBot, bTop);
      const lvl = 1 - L * ease(t / 0.35);
      const c = t < 0.45 ? 0 : ease((t - 0.45) / 0.55);
      const bxs = [0, 1, 2].map((i) => bx0 + i * (bw + gb));
      b += S.text(bx0, 16, 'YOUR $10,000 ACCOUNT', 'cap');
      // start
      b += S.rect(bxs[0], hy(1), bw, hy(0) - hy(1), 'f-info', 2);
      b += S.text(bxs[0] + bw / 2, hy(1) - 7, kfmt(BASE), 'sm ink b', 'middle');
      // after loss
      b += S.rect(bxs[1], hy(1), bw, hy(0) - hy(1), 'nf s-mut dash', 2);
      b += S.rect(bxs[1], hy(1), bw, hy(lvl) - hy(1), 'f-dn-t', 2);
      b += S.rect(bxs[1], hy(lvl), bw, hy(0) - hy(lvl), 'f-info', 2);
      b += S.text(bxs[1] + bw / 2, hy(1) - 7, F.minus + Math.round(L * 100 * ease(t / 0.35)) + '%', 'sm dn b', 'middle');
      if (hy(0) - hy(lvl) > 20) b += S.text(bxs[1] + bw / 2, hy(lvl) + 15, kfmt(BASE * lvl), 'xs on b', 'middle');
      // climb back
      b += S.rect(bxs[2], hy(1), bw, hy(0) - hy(1), 'nf s-mut dash', 2);
      b += S.rect(bxs[2], hy(1 - L), bw, hy(0) - hy(1 - L), 'f-info o35', 2);
      if (c > 0) b += S.rect(bxs[2], hy(1 - L + L * c), bw, hy(1 - L) - hy(1 - L + L * c), 'f-up', 2);
      b += S.text(bxs[2] + bw / 2, hy(1) - 7, '+' + Math.round(G * 100 * c) + '%', 'sm up b', 'middle');
      b += S.line(bx0 - 8, hy(0), bx0 + panelW + 8, hy(0), 's-mut');
      [['Start', 0], ['After loss', 1], ['Climb back', 2]].forEach(([l, i]) => (b += S.text(bxs[i] + bw / 2, hy(0) + 16, l, 'xs ink', 'middle')));
      // ----- curve panel
      const cl = compact ? 52 : bx0 + panelW + 76, cr = W - 18, ct = compact ? 248 : 34, cb = H - 34;
      let yMax = Math.max(120, G * 100 * 1.25); const tk = SML.ticks(0, yMax, 4); yMax = Math.max(yMax, tk[tk.length - 1]);
      const cx = SML.lin(0, 90, cl, cr), cy = SML.lin(0, yMax, cb, ct);
      b += `<defs><clipPath id="${id}-c"><rect x="${cl}" y="${ct}" width="${R1(cr - cl)}" height="${R1(cb - ct)}"/></clipPath></defs>`;
      SML.ticks(0, yMax, 4).forEach((v) => { b += S.line(cl, cy(v), cr, cy(v), 's-grid') + S.text(cl - 6, cy(v) + 4, (v ? '+' : '') + v + '%', 'xs mono', 'end'); });
      (compact ? [0, 30] : [0, 30, 60]).forEach((v) => (b += S.text(cx(v), cb + 16, (v ? F.minus : '') + v + '%', 'xs mono', 'middle')));
      b += S.text(cx(90), cb + 16, F.minus + '90% loss', 'xs mono', 'end');
      b += S.text(cl, ct - 14, 'GAIN NEEDED TO RECOVER', 'cap');
      const pts = []; for (let v = 0; v <= 90; v += 1) pts.push([cx(v), cy((v / (100 - v)) * 100)]);
      b += `<g clip-path="url(#${id}-c)">${S.poly(pts, 's-up w25')}</g>`;
      // reference points
      [[10, 11], [50, 100]].forEach(([l, g]) => { if (g <= yMax && Math.abs(l - L * 100) > 6) b += S.circle(cx(l), cy(g), 3, 'f-mut'); });
      const mx = cx(L * 100), myy = cy(G * 100);
      b += S.line(mx, cb, mx, myy, 's-dn dash') + S.line(cl, myy, mx, myy, 's-up dash');
      b += S.circle(mx, myy, 6, 'f-acc');
      const lab = `${F.minus}${Math.round(L * 100)}% → +${Math.round(G * 100)}%`;
      const leftSide = mx > cr - 130;
      b += S.text(leftSide ? mx - 12 : mx + 12, leftSide ? myy - 10 : myy + 22, lab, 'md ink b', leftSide ? 'end' : 'start');
      fig.innerHTML = S.wrap(W, H, `A ${Math.round(L * 100)} percent loss needs a ${Math.round(G * 100)} percent gain to recover`, b);
      const yrs = Math.log(1 / (1 - L)) / Math.log(1.1);
      setT(id + '-lostv', F.usd0(-BASE * L), 'dn');
      setT(id + '-left', F.usd0(BASE * (1 - L)));
      setT(id + '-gain', '+' + Math.round(G * 100) + '%');
      setT(id + '-yrs', trim(yrs, 1) + (yrs < 1.05 ? ' year' : ' years'));
      if (L < 0.15) setMsg(id + '-msg', 'up', 'Easy fix', `A ${Math.round(L * 100)}% loss needs only +${Math.round(G * 100)}% to recover. This is why pros cut losers early.`);
      else if (L < 0.35) setMsg(id + '-msg', 'acc', 'Takes work', `After a ${Math.round(L * 100)}% loss you need +${Math.round(G * 100)}%. At a good 10% a year that's about ${trim(yrs, 1)} years of growth just to get back.`);
      else setMsg(id + '-msg', 'dn', 'Deep hole', `A ${Math.round(L * 100)}% loss needs +${Math.round(G * 100)}% to get back to even. The gap grows faster the deeper you fall.`);
    });
  };

  /* =====================================================================
     5. stockFunnel: filters -> watchlist (sample data)
     ===================================================================== */
  const STOCKS = [
    { tk: 'KELP', p: 42.1, vol: 8.2, spr: 0.01, rv: 3.1, news: 'Earnings beat' },
    { tk: 'ZORB', p: 3.4, vol: 22, spr: 0.01, rv: 5.2, news: 'Hype post' },
    { tk: 'QUIX', p: 118.5, vol: 0.4, spr: 0.12, rv: 2.6, news: 'Upgrade' },
    { tk: 'FIZZ', p: 27.8, vol: 3.5, spr: 0.02, rv: 0.9, news: '' },
    { tk: 'OWLY', p: 215.3, vol: 5.1, spr: 0.03, rv: 2.4, news: 'New product' },
    { tk: 'TOAD', p: 0.85, vol: 41, spr: 0.01, rv: 8.0, news: 'Penny pump' },
    { tk: 'YAKK', p: 64.2, vol: 1.8, spr: 0.02, rv: 2.2, news: 'Guidance raised' },
    { tk: 'NOOK', p: 9.1, vol: 2.4, spr: 0.01, rv: 1.3, news: '' },
    { tk: 'LYNQ', p: 356.0, vol: 0.7, spr: 0.25, rv: 1.1, news: '' },
    { tk: 'DRUM', p: 18.4, vol: 12.5, spr: 0.01, rv: 4.4, news: 'Contract win' },
    { tk: 'PIXO', p: 88.75, vol: 2.2, spr: 0.05, rv: 2.8, news: 'Analyst note' },
    { tk: 'SODA', p: 33.6, vol: 1.1, spr: 0.03, rv: 1.0, news: '' },
    { tk: 'VANT', p: 640.0, vol: 1.4, spr: 0.04, rv: 2.1, news: 'Split news' },
    { tk: 'MIRA', p: 12.3, vol: 0.3, spr: 0.06, rv: 3.4, news: 'Merger rumor' },
  ];
  const FILTERS = [
    { k: 'liq', label: 'Liquid', long: 'Liquid: 1M+ shares a day', test: (s) => s.vol >= 1, why: (s) => `only ${volTxt(s.vol)} shares trade a day, so orders fill slowly and you can get stuck` },
    { k: 'spr', label: 'Tight spread', long: 'Spread $0.03 or less', test: (s) => s.spr <= 0.03, why: (s) => `the $${s.spr.toFixed(2)} spread costs $${Math.round(s.spr * 100)} per 100 shares just to get in and out` },
    { k: 'play', label: 'In play', long: 'In play: RVOL 2×+', test: (s) => s.rv >= 2, why: (s) => `relative volume is only ${s.rv.toFixed(1)}×, so there's no reason for it to move today` },
    { k: 'price', label: '$10 to $500', long: 'Price $10 to $500', test: (s) => s.p >= 10 && s.p <= 500, why: (s) => (s.p < 10 ? `at ${F.usd(s.p)} it's a low-priced stock that is easy to push around` : `at ${F.usd0(s.p)} a share, a normal position is only a few shares`) },
  ];
  const volTxt = (v) => (v >= 1 ? trim(v, 1) + 'M' : Math.round(v * 1000) + 'K');
  SML.widgets.stockFunnel = function (root) {
    const id = SML.uid('sf');
    let sel = null;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Filters</span>${ui.chips(id + '-f', FILTERS.map((f) => ({ k: f.k, label: f.label, color: 'var(--accent)', on: true })))}<span class="grow"></span><span class="pill">sample data</span></div>
      <div class="wg-fig"></div>
      <div class="scroll rk-tblwrap" id="${id}-tw"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Made-up tickers and numbers. Click any row to see why it passes or fails.</div>`;
    const fig = root.querySelector('.wg-fig'), tw = $id(id + '-tw');
    const st = ui.wire(root, () => { draw(); table(); });
    const active = () => FILTERS.filter((f) => st.on(id + '-f', f.k));
    tw.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-i]'); if (!tr) return; sel = Number(tr.dataset.i); table(); });
    tw.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const tr = e.target.closest('tr[data-i]'); if (!tr) return; e.preventDefault(); sel = Number(tr.dataset.i); table(); const again = tw.querySelector(`tr[data-i="${sel}"]`); if (again) again.focus(); });
    function table() {
      const fs = active();
      const rows = STOCKS.map((s, i) => {
        const fails = fs.filter((f) => !f.test(s)).map((f) => f.k);
        const pass = fails.length === 0;
        const bad = (k) => (fails.indexOf(k) >= 0 ? ' bad' : '');
        return `<tr data-i="${i}" tabindex="0" class="${i === sel ? 'sel' : pass ? 'pass' : 'fail'}">
          <td class="tk">${s.tk}</td><td class="num${bad('price')}">${F.usd(s.p)}</td><td class="num${bad('liq')}">${volTxt(s.vol)}</td><td class="num${bad('spr')}">$${s.spr.toFixed(2)}</td><td class="num${bad('play')}">${s.rv.toFixed(1)}×</td><td>${s.news || '—'}</td>
          <td>${pass ? '<span class="pill acc">Watchlist</span>' : `<span class="pill">${fails.length} fail${fails.length > 1 ? 's' : ''}</span>`}</td></tr>`;
      }).join('');
      tw.innerHTML = `<table class="tbl rk-tbl"><thead><tr><th>Ticker</th><th class="num">Price</th><th class="num">Avg volume</th><th class="num">Spread</th><th class="num">RVOL</th><th>News</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
      const passList = STOCKS.filter((s) => fs.every((f) => f.test(s)));
      if (sel != null) {
        const s = STOCKS[sel]; const fails = fs.filter((f) => !f.test(s));
        if (!fails.length) setMsg(id + '-msg', 'acc', s.tk, `${s.tk} passes every filter: ${volTxt(s.vol)} shares a day, a $${s.spr.toFixed(2)} spread and ${s.rv.toFixed(1)}× normal volume${s.news ? ' on ' + s.news.toLowerCase() : ''}. Worth a spot on today's list.`);
        else setMsg(id + '-msg', 'dn', s.tk, `${s.tk} fails because ${fails.map((f) => f.why(s)).join('; and ')}.`);
      } else if (!fs.length) setMsg(id + '-msg', 'dn', 'No filters', 'With no filters on, all 14 stocks look tradeable. Turn the filters on to see how few really are.');
      else setMsg(id + '-msg', passList.length <= 4 ? 'up' : 'acc', passList.length + ' left', passList.length <= 4 ? `${passList.map((s) => s.tk).join(', ')} pass every filter. That short list is today's watchlist.` : `${passList.length} stocks still pass. Add filters until 2 to 4 are left, so you can watch each one closely.`);
    }
    const draw = ui.responsive(fig, (W) => {
      const fs = active();
      const stages = [{ label: 'All stocks', n: STOCKS.length }];
      let pool = STOCKS.slice();
      fs.forEach((f) => { pool = pool.filter(f.test); stages.push({ label: f.long, n: pool.length }); });
      const compact = W < 520;
      const bh = 30, gap = 6, top = 8;
      const H = top + stages.length * (bh + gap) + 6;
      const lw = compact ? 0 : 190;
      const ax = lw, aw = W - lw;
      const minW = compact ? Math.min(aw, 190) : 60;
      let b = '';
      stages.forEach((s, i) => {
        const w = minW + (aw - minW) * (s.n / STOCKS.length);
        const x0 = ax + (aw - w) / 2, yy = top + i * (bh + gap);
        const last = i === stages.length - 1 && i > 0;
        b += S.rect(x0, yy, w, bh, last ? 'f-acc' : 'f-acc-t s-acc w1', 3);
        if (compact) {
          b += S.text(x0 + 10, yy + 19.5, s.label, `sm ${last ? 'onacc' : 'ink'} b`);
          b += S.text(x0 + w - 10, yy + 19.5, s.n, `md mono ${last ? 'onacc' : 'ink'} b`, 'end');
        } else {
          b += S.text(lw - 12, yy + 19.5, s.label, 'md ink', 'end');
          b += S.text(x0 + w / 2, yy + 20, s.n + (i === 0 ? ' stocks' : ''), `md mono ${last ? 'onacc' : 'ink'} b`, 'middle');
        }
      });
      fig.innerHTML = S.wrap(W, H, `Funnel from ${STOCKS.length} sample stocks down to ${pool.length} after filters`, b);
    });
    table();
  };

  /* =====================================================================
     6. styleCompare: four styles side by side
     ===================================================================== */
  const STY = {
    day: { name: 'Day trading', span: [-0.4, 1.4], hold: 'Minutes to hours', screen: '2–6 hours a day', screenH: 5, trades: '300–1,000+', tax: ['dn', 'Short-term'], capital: 'at least $2,000 in a margin account', week: ['3 trades', '2 trades', 'no setup', '4 trades', '1 trade'], best: 'Fits people with free mornings who like fast decisions and can follow strict rules.', pros: ['Nothing held overnight', 'Many chances every day', 'Fast feedback on your skill'], cons: ['Hardest style to profit from', 'Stressful, needs hours of focus', 'Every gain is short-term for taxes'] },
    swing: { name: 'Swing trading', span: [1.6, 3.4], hold: 'Days to weeks', screen: '20–60 min a day', screenH: 0.6, trades: '30–100', tax: ['dn', 'Short-term'], capital: 'any account size', week: ['scan', 'enter', 'check', 'move stop', 'exit'], best: 'Fits people with a day job who can plan in the evening and let orders do the work.', pros: ['Works around a job', 'Catches bigger moves per trade', 'Fewer, calmer decisions'], cons: ['Overnight gaps can jump your stop', 'Needs patience to hold winners', 'Gains usually taxed short-term'] },
    wheel: { name: 'The wheel', span: [2.7, 4.4], hold: 'Weeks to months', screen: '15–30 min a week', screenH: 0.08, trades: '12–40', tax: ['dn', 'Premium short-term'], capital: 'enough cash for 100 shares, about $4,000 for a $40 stock', week: ['sell put', '', '', '', 'check'], best: 'Fits people who want steady income and clear rules, on stocks they would happily own.', pros: ['Collects premium every month', 'Simple, repeatable rules', 'Works in flat markets'], cons: ['Upside is capped by the call', 'Can get stuck holding a falling stock', 'Needs cash for 100 shares'] },
    value: { name: 'Value investing', span: [3.7, 5.4], hold: 'Months to years', screen: 'A few hours a quarter', screenH: 0.03, trades: '2–10', tax: ['up', 'Long-term after 1 year'], capital: 'any account size', week: ['', '', 'read report', '', ''], best: 'Fits people who want wealth over years with little screen time and low stress.', pros: ['Compounding does the heavy lifting', 'Lowest stress and trading costs', 'Lower long-term tax rate'], cons: ['Slow: results take years', 'Can lag the market for long stretches', 'Needs research into businesses'] },
  };
  const STY_ORDER = ['day', 'swing', 'wheel', 'value'];
  SML.widgets.styleCompare = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('sc');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-s', STY_ORDER.map((k) => ({ v: k, label: STY[k].name })), opts.style || 'swing', 'Trading style')}</div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Holding time', id + '-hold')}${ui.stat('Screen time', id + '-scr')}${ui.stat('Trades a year', id + '-tr')}${ui.stat('Taxes', id + '-tax')}</div>
      <div class="rk-pc" id="${id}-pc"></div>
      <div class="wg-msg" id="${id}-msg"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const k = st.seg(id + '-s') || 'swing', s = STY[k];
      const compact = W < 520;
      const pl = 6, pr = 6;
      const cats = compact ? ['min', 'hrs', 'days', 'wks', 'mos', 'yrs'] : ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];
      const step = (W - pl - pr) / 6, cx = (i) => pl + (i + 0.5) * step;
      let b = S.text(pl, 14, 'HOLDING PERIOD', 'cap');
      STY_ORDER.forEach((kk, i) => {
        const q = STY[kk], on = kk === k, yy = 26 + i * 26;
        const x0 = cx(q.span[0]), x1 = cx(q.span[1]);
        b += S.rect(x0, yy, x1 - x0, 20, on ? 'f-acc' : 'f-shade2', 3, on ? '' : ' opacity=".55"');
        const tw = q.name.length * 6.6 + 14;
        if (x1 - x0 >= tw) b += S.text(x0 + 8, yy + 14, q.name, `sm b ${on ? 'onacc' : 'ink'}`);
        else if (x0 - pl >= tw - 6) b += S.text(x0 - 6, yy + 14, q.name, `sm b ${on ? 'acc' : 'ink'}`, 'end');
        else b += S.text(x1 + 6, yy + 14, q.name, `sm b ${on ? 'acc' : 'ink'}`);
      });
      b += S.line(pl, 136, W - pr, 136, 's-mut w15');
      cats.forEach((c, i) => { b += S.line(cx(i), 132, cx(i), 140, 's-mut'); b += S.text(cx(i), 154, c, 'sm', 'middle'); });
      // week strip
      const wy = 186, days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], cw = (W - pl - pr - 4 * 6) / 5;
      b += S.text(pl, wy - 10, 'A WEEK IN THE LIFE', 'cap');
      days.forEach((d, i) => {
        const x0 = pl + i * (cw + 6); let act = s.week[i];
        if (cw < 70 && act) act = { 'move stop': 'adjust', 'read report': 'read', 'no setup': 'none', '3 trades': '3 trades' }[act] || act;
        b += S.rect(x0, wy, cw, 46, 'f-surf s-line w1', 4);
        if (act) b += S.rect(x0 + 4, wy + 13, cw - 8, 20, 'f-acc-t s-acc w1', 3) + S.text(x0 + cw / 2, wy + 27, act, (cw < 70 ? 'xs' : 'sm') + ' ink b', 'middle');
        else b += S.text(x0 + cw / 2, wy + 28, '—', 'sm mut', 'middle');
        b += S.text(x0 + cw / 2, wy + 62, d, 'xs mono', 'middle');
      });
      // screen time meter
      const my = 284, mx0 = pl + (compact ? 0 : 0), mw = W - pl - pr;
      b += S.text(pl, my - 10, 'SCREEN TIME (0 TO 6 HOURS A DAY)', 'cap');
      b += S.rect(mx0, my, mw, 10, 'f-shade', 5);
      b += S.rect(mx0, my, Math.max(6, (mw * Math.min(s.screenH, 6)) / 6), 10, 'f-acc', 5);
      const H = 306;
      fig.innerHTML = S.wrap(W, H, `${s.name}: holding period, a sample week and daily screen time`, b);
      setT(id + '-hold', s.hold); setT(id + '-scr', s.screen); setT(id + '-tr', s.trades); setT(id + '-tax', s.tax[1], s.tax[0]);
      $id(id + '-pc').innerHTML = `<div><h4>Good</h4>${ui.ticks(s.pros)}</div><div><h4>Hard</h4>${cons(s.cons)}</div>`;
      setMsg(id + '-msg', 'acc', s.name, `${s.best} You can start with ${s.capital}.`);
    });
  };

  /* =====================================================================
     7. gamePlan: checklist over the trading-day timeline
     ===================================================================== */
  const STEPS = [
    { a: 180, b: 240, time: '7:00–8:00 AM', t: 'Check news, earnings and the economic calendar', tip: 'Know why stocks are moving before you look at charts, and note scheduled events like a 10:00 economic report.' },
    { a: 240, b: 285, time: '8:00–8:45 AM', t: 'Mark PDH, PDL, PMH and PML', tip: "Draw yesterday's high and low and the premarket high and low. Price often reacts at these lines." },
    { a: 285, b: 325, time: '8:45–9:25 AM', t: 'Pick 2–4 stocks in play', tip: 'Liquid stocks with news and 2×+ relative volume. Write the plan for each: level, entry, stop, target.' },
    { a: 330, b: 345, time: '9:30–9:45 AM', t: 'Let the open settle', tip: 'The first minutes are the wildest of the day. Watch how price reacts at your levels before acting.' },
    { a: 345, b: 450, time: '9:45–11:30 AM', t: 'Trade your planned setup only', tip: 'Break, retest, volume, right side of VWAP. Stop set before entry, size from your risk budget.' },
    { a: 450, b: 600, time: '11:30–2:00 PM', t: 'Midday: trade less or stop', tip: 'Volume dries up and moves get choppy. Many good traders are done by lunch.' },
    { a: 660, b: 720, time: '3:00–4:00 PM', t: 'Power hour: manage and close', tip: 'Volume returns into the close. Close day trades before 4:00 so nothing is held overnight by accident.' },
    { a: 720, b: 750, time: 'After 4:00 PM', t: 'Journal every trade', tip: 'Screenshot each chart. Note the plan, what you did and the result in R. Your journal shows your edge.' },
  ];
  SML.widgets.gamePlan = function (root) {
    const id = SML.uid('gp');
    let sel = 0; const done = STEPS.map(() => false);
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Readiness</span><span class="rk-meter"><i id="${id}-m"></i></span><span class="pill" id="${id}-c">0 of ${STEPS.length}</span></div>
      <div class="wg-fig"></div>
      <div class="rk-steps" id="${id}-steps">${STEPS.map((s, i) => `<div class="rk-step" data-i="${i}"><input type="checkbox" id="${id}-cb${i}" aria-label="Done: ${SML.esc(s.t)}"><button type="button" class="rk-stepbtn" data-i="${i}"><span class="t">${s.time}</span><span class="s">${i + 1}. ${s.t}</span></button></div>`).join('')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Tap a step to see when it happens. Tick the box when it's done. All times Eastern.</div>`;
    const fig = root.querySelector('.wg-fig'), list = $id(id + '-steps');
    list.addEventListener('click', (e) => { const btn = e.target.closest('.rk-stepbtn'); if (!btn) return; sel = Number(btn.dataset.i); update(); });
    list.addEventListener('change', (e) => { const cb = e.target.closest('input[type=checkbox]'); if (!cb) return; const i = Number(cb.closest('.rk-step').dataset.i); done[i] = cb.checked; sel = i; update(); });
    const vol = (t) => {
      if (t < 330) return 0.05 + 0.06 * Math.exp(-Math.pow((t - 240) / 35, 2)) + 0.12 * Math.pow(t / 330, 4);
      const u = (t - 330) / 390;
      return Math.min(1, 0.16 + 0.84 * Math.exp(-(t - 330) / 14) + 0.5 * Math.pow(u, 5) + 0.08 * Math.exp(-(t - 330) / 70));
    };
    function update() {
      $$('.rk-step', list).forEach((row, i) => { row.classList.toggle('on', i === sel); row.classList.toggle('done', done[i]); const cb = row.querySelector('input'); if (cb.checked !== done[i]) cb.checked = done[i]; });
      const n = done.filter(Boolean).length;
      $id(id + '-m').style.width = (n / STEPS.length) * 100 + '%';
      const c = $id(id + '-c'); c.textContent = n === STEPS.length ? 'Ready' : `${n} of ${STEPS.length}`; c.className = 'pill' + (n === STEPS.length ? ' up' : n ? ' acc' : '');
      const s = STEPS[sel];
      setMsg(id + '-msg', done[sel] ? 'up' : 'acc', `Step ${sel + 1}`, `${s.tip}`);
      draw();
    }
    const $$ = SML.$$;
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.36, 220, 270));
      const pl = 10, pr = 10, pt = 64, pb = 40;
      const x = SML.lin(0, 750, pl, W - pr), y = SML.lin(0, 1, H - pb, pt);
      let b = S.rect(x(0), pt - 4, x(330) - x(0), H - pb - pt + 4, 'f-shade o50');
      b += S.text(x(0) + 6, pt + 10, compact ? 'PRE' : 'PREMARKET', 'cap');
      const s = STEPS[sel];
      b += S.rect(x(s.a), 6, x(s.b) - x(s.a), H - pb - 6, 'f-acc-t');
      const pts = []; for (let t = 0; t <= 750; t += 3) pts.push([x(t), y(t > 720 ? 0.02 : vol(t))]);
      b += S.area(pts, H - pb, 'f-info-t') + S.poly(pts, 's-info w2');
      b += S.line(x(330), pt - 6, x(330), H - pb, 's-ink dash') + S.line(x(720), pt - 6, x(720), H - pb, 's-ink dash');
      b += S.line(pl, H - pb, W - pr, H - pb, 's-mut');
      const ticks = compact ? [[0, '4:00'], [330, '9:30'], [480, '12:00'], [720, '4:00 PM']] : [[0, '4:00 AM'], [120, '6:00'], [240, '8:00'], [330, '9:30 open'], [480, '12:00'], [600, '2:00'], [720, '4:00 close']];
      ticks.forEach(([t, l]) => { b += S.line(x(t), H - pb, x(t), H - pb + 5, 's-mut'); b += S.text(x(t), H - pb + 18, l, 'xs mono', t === 0 ? 'start' : t >= 720 ? 'end' : 'middle'); });
      b += S.text(W - pr, H - 4, 'volume through the day', 'xs mut', 'end');
      STEPS.forEach((q, i) => {
        const cxx = x((q.a + q.b) / 2), cyy = i % 2 ? 40 : 18;
        const cls = done[i] ? 'f-up' : i === sel ? 'f-acc' : 'f-surf s-acc w15';
        b += S.circle(cxx, cyy, 9, cls);
        b += S.text(cxx, cyy + 3.8, done[i] ? '✓' : i + 1, done[i] || i === sel ? 'badge' : 'badge acc', 'middle');
      });
      fig.innerHTML = S.wrap(W, H, 'Trading day from 4 AM to 4 PM Eastern with trading volume and the game plan steps', b);
    });
    update();
  };

  /* =====================================================================
     8. marginSafety: value vs price, buy zone
     ===================================================================== */
  SML.widgets.marginSafety = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('ms');
    const r = SML.rng(77); let e = 0; const DEV = [];
    for (let i = 0; i <= 120; i++) { e = e * 0.8 + r.gauss() * 0.035; DEV.push(0.2 * Math.sin(i / 13 + 0.6) + 0.09 * Math.sin(i / 4.7) + e - 0.24 * Math.exp(-Math.pow((i - 47) / 7, 2))); }
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Cushion you want</span>${ui.seg(id + '-m', [{ v: 20, label: '20%' }, { v: 30, label: '30%' }, { v: 40, label: '40%' }], 30, 'Required margin of safety')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-eps', label: 'Earnings per share (EPS)', min: 0.5, max: 10, step: 0.1, value: opts.eps || 4, fmt: 'usd' })}
        ${ui.slider({ id: id + '-pe', label: 'Fair P/E', min: 5, max: 30, step: 1, value: opts.pe || 15, fmt: (v) => v + '×' })}
        ${ui.slider({ id: id + '-p', label: 'Price today', min: 5, max: 200, step: 1, value: opts.price || 42, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Estimated value', id + '-v')}${ui.stat('Price', id + '-pr')}${ui.stat('Margin of safety', id + '-mos', 'hl')}${ui.stat('Buy below', id + '-bb')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Illustration: value grows about 6% a year and the price swings around it. Value = EPS × fair P/E is a rough first estimate.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const eps = st.n(id + '-eps'), pe = st.n(id + '-pe'), P = st.n(id + '-p'), m = Number(st.seg(id + '-m') || 30) / 100;
      const V = eps * pe, mos = (V - P) / V;
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.46, 250, 330));
      const pl = compact ? 40 : 50, pr = compact ? 70 : 96, pt = 16, pb = 34;
      const val = (i) => V * Math.pow(1.06, (i - 120) / 12);
      const target = P / V - 1;
      const price = (i) => { const w = SML.clamp((i - 96) / 24, 0, 1); const sm = w * w * (3 - 2 * w); return val(i) * (1 + DEV[i] * (1 - sm) + target * sm); };
      const pv = []; for (let i = 0; i <= 120; i++) pv.push(price(i));
      const yMax = Math.max(...pv, V * 1.15) * 1.08;
      const x = SML.lin(0, 120, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, '$' + v, 'xs mono', 'end'); });
      // buy zone
      const zone = []; for (let i = 0; i <= 120; i += 2) zone.push([x(i), y(val(i) * (1 - m))]);
      b += S.area(zone, H - pb, 'f-up-t');
      b += S.poly(zone, 's-up dash w15');
      b += S.text(x(4), y(val(4) * (1 - m)) + 16, 'buy zone', 'sm up b');
      const vl = []; for (let i = 0; i <= 120; i += 2) vl.push([x(i), y(val(i))]);
      b += S.poly(vl, 's-acc w25 dash');
      b += S.poly(pv.map((v, i) => [x(i), y(v)]), 's-ink w2');
      // highlight time in buy zone
      for (let i = 1; i <= 120; i++) if (pv[i] <= val(i) * (1 - m) && pv[i - 1] <= val(i - 1) * (1 - m)) b += S.line(x(i - 1), y(pv[i - 1]), x(i), y(pv[i]), 's-up w4');
      [[0, compact ? '10y ago' : '10 years ago'], [60, '5y'], [120, 'today']].forEach(([i, l]) => (b += S.text(x(i), H - pb + 16, l, 'xs mono', i === 0 ? 'start' : i === 120 ? 'end' : 'middle')));
      // today bracket
      const xT = x(120);
      b += S.line(xT + 8, y(V), xT + 8, y(P), mos >= 0 ? 's-up w2' : 's-dn w2');
      b += S.circle(xT, y(V), 5, 'f-acc') + S.circle(xT, y(P), 5, 'f-ink');
      const labs = spread([{ y: y(V) + 4, t: (compact ? '' : 'value ') + F.usd0(V), c: 'sm acc b' }, { y: y(P) + 4, t: (compact ? '' : 'price ') + F.usd0(P), c: 'sm ink b' }], 15, pt + 4, H - pb);
      labs.forEach((l) => (b += S.text(xT + 16, l.y, l.t, l.c)));
      fig.innerHTML = S.wrap(W, H, `Price swinging around an estimated value of ${F.usd0(V)} with the buy zone shaded`, b);
      setT(id + '-v', F.usd(V)); setT(id + '-pr', F.usd(P));
      setT(id + '-mos', mos >= 0 ? pctTxt(mos) : F.minus + pctTxt(-mos), mos >= m ? 'up' : mos < 0 ? 'dn' : 'acc');
      setT(id + '-bb', F.usd(V * (1 - m)));
      if (mos >= m) setMsg(id + '-msg', 'up', 'Buy zone', `Price is ${pctTxt(mos)} below your value estimate. Even if your estimate is a bit too high, you have a cushion.`);
      else if (mos >= 0) setMsg(id + '-msg', 'acc', 'Not cheap enough', `Price is only ${pctTxt(mos)} below value. You asked for ${Math.round(m * 100)}%, so wait for ${F.usd(V * (1 - m))} or less.`);
      else setMsg(id + '-msg', 'dn', 'Above value', `You'd pay ${pctTxt(-mos)} more than your estimate of what the business is worth. Value investors wait.`);
    });
  };

  /* =====================================================================
     9. blendAllocator: buckets that always total 100%
     ===================================================================== */
  const BUCKETS = [
    { k: 'core', name: 'Core long-term', sub: 'Index funds and value stocks', cls: 'f-info', sw: 'c-info', def: 60 },
    { k: 'sw', name: 'Swing + wheel', sub: 'Trades held days to weeks', cls: 'f-acc', sw: 'c-acc', def: 25 },
    { k: 'day', name: 'Day trading', sub: 'Small, while you learn', cls: 'f-dn', sw: 'c-dn', def: 5 },
    { k: 'cash', name: 'Cash', sub: 'Dry powder for chances', cls: 'f-mut', sw: 'c-mut', def: 10 },
  ];
  SML.widgets.blendAllocator = function (root) {
    const id = SML.uid('ba');
    root.innerHTML = `
      <div class="rk-split" id="${id}-sp"><div class="rk-donut" id="${id}-d"></div><div class="rk-legend" id="${id}-lg"></div></div>
      <div class="wg-ctrl">
        ${BUCKETS.map((q) => ui.slider({ id: `${id}-${q.k}`, label: q.name, min: 0, max: 100, step: 1, value: q.def, fmt: 'pct' })).join('')}
        ${ui.slider({ id: id + '-acct', label: 'Account size', min: 1000, max: 250000, step: 1000, value: 25000, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('1% risk per day trade', id + '-st-risk', 'hl')}${ui.stat('Long-term core', id + '-st-core')}${ui.stat('Swing + wheel', id + '-st-sw')}${ui.stat('Day trading', id + '-st-day')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Example only. Move one slider and the others adjust so the total stays 100%.</div>`;
    const sp = $id(id + '-sp');
    const st = ui.wire(root, (e) => {
      const tid = e && e.target && e.target.id;
      const ki = BUCKETS.findIndex((q) => `${id}-${q.k}` === tid);
      if (ki >= 0) {
        const vals = BUCKETS.map((q) => st.n(`${id}-${q.k}`));
        const v = vals[ki], others = [0, 1, 2, 3].filter((i) => i !== ki);
        const sumO = others.reduce((s, i) => s + vals[i], 0), rem = 100 - v;
        const raw = others.map((i) => (sumO > 0 ? (vals[i] * rem) / sumO : rem / 3));
        const fl = raw.map(Math.floor); let left = rem - fl.reduce((s, q) => s + q, 0);
        raw.map((q, j) => [q - fl[j], j]).sort((a, c) => c[0] - a[0]).forEach(([, j]) => { if (left > 0) { fl[j]++; left--; } });
        others.forEach((i, j) => st.set(`${id}-${BUCKETS[i].k}`, fl[j]));
      }
      render();
    });
    function render() {
      const vals = BUCKETS.map((q) => st.n(`${id}-${q.k}`)), A = st.n(id + '-acct');
      const tot = vals.reduce((s, v) => s + v, 0) || 1;
      const pct = vals.map((v) => v / tot);
      $id(id + '-d').innerHTML = S.wrap(200, 200, 'Donut of how the account is split between buckets', donut(100, 100, 92, 58, BUCKETS.map((q, i) => ({ v: pct[i], cls: q.cls }))) + S.text(100, 98, kfmt(A), 'xl mono ink b', 'middle') + S.text(100, 116, 'account', 'sm', 'middle'));
      $id(id + '-lg').innerHTML = BUCKETS.map((q, i) => `<div class="row"><i class="rk-sw ${q.sw}"></i><span class="n">${q.name}<small>${q.sub}</small></span><b>${Math.round(pct[i] * 100)}% · ${kfmt(A * pct[i])}</b></div>`).join('');
      sp.parentElement.classList.toggle('rk-wide', root.clientWidth >= 520);
      const [core, sw, day, cash] = pct;
      setT(id + '-st-risk', F.usd0(A * day * 0.01));
      setT(id + '-st-core', F.usd0(A * core)); setT(id + '-st-sw', F.usd0(A * sw)); setT(id + '-st-day', F.usd0(A * day));
      if (day > 0.2) setMsg(id + '-msg', 'acc', 'Heavy on day trading', `${Math.round(day * 100)}% in day trading is a lot while learning. Most beginners keep it under 20% until their journal shows an edge.`);
      else if (core < 0.4) setMsg(id + '-msg', 'acc', 'Thin core', `Only ${Math.round(core * 100)}% is in the long-term core. The core is what compounds quietly while you learn to trade.`);
      else if (cash < 0.05) setMsg(id + '-msg', 'acc', 'No cash buffer', 'Keep some cash. It lets you act on a good chance without selling something at a bad time.');
      else if (cash > 0.4) setMsg(id + '-msg', 'acc', 'Lots of cash', `${Math.round(cash * 100)}% sits in cash. That's safe, but cash loses value to inflation over time.`);
      else setMsg(id + '-msg', 'up', 'Balanced', `A ${Math.round(core * 100)}% core with ${Math.round(day * 100)}% for day trading. Risking 1% of that bucket means about ${F.usd0(A * day * 0.01)} per day trade.`);
    }
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => sp.parentElement.classList.toggle('rk-wide', root.clientWidth >= 520)); ro.observe(root); SML.onCleanup(() => ro.disconnect()); }
    render();
  };

  /* =====================================================================
     10. compoundCalc: compounding & retirement
     ===================================================================== */
  SML.widgets.compoundCalc = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('cc');
    root.innerHTML = `
      <div class="wg-bar">${ui.chips(id + '-inf', [{ k: 'real', label: "Show in today's dollars (3% inflation)", color: 'var(--violet)', on: false }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-s', label: 'Starting amount', min: 0, max: 100000, step: 1000, value: opts.start != null ? opts.start : 10000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-m', label: 'Added every month', min: 0, max: 3000, step: 50, value: opts.monthly != null ? opts.monthly : 500, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-y', label: 'Years', min: 1, max: 45, step: 1, value: opts.years || 30, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-r', label: 'Yearly return', min: 0, max: 12, step: 0.5, value: opts.rate != null ? opts.rate : 7, fmt: (v) => trim(v, 1) + '%' })}
      </div>
      <div class="wg-read">${ui.stat('Final value', id + '-fv', 'hl big')}${ui.stat('You put in', id + '-in')}${ui.stat('Growth', id + '-gr')}${ui.stat("In today's dollars", id + '-real')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Monthly compounding. Real returns vary year to year; a steady rate is a simplification. Hover the chart for any year.</div>`;
    const fig = root.querySelector('.wg-fig');
    const tip = tipper(fig);
    const st = ui.wire(root, () => draw());
    let G = null;
    function series() {
      const s0 = st.n(id + '-s'), mo = st.n(id + '-m'), Y = st.n(id + '-y'), r = st.n(id + '-r') / 100, real = st.on(id + '-inf', 'real');
      const bal = [s0], con = [s0]; let b = s0, c = s0;
      for (let yr = 1; yr <= Y; yr++) { for (let k = 0; k < 12; k++) { b = b * (1 + r / 12) + mo; c += mo; } bal.push(b); con.push(c); }
      const d = (i) => (real ? Math.pow(1.03, i) : 1);
      return { Y, real, bal: bal.map((v, i) => v / d(i)), con: con.map((v, i) => v / d(i)), nomFinal: b, conFinal: c, r };
    }
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4) { hide(); return; }
      const i = Math.round(SML.clamp(G.x.inv(p.x), 0, G.s.Y));
      const hov = svg.querySelector('[data-hov]');
      if (hov) hov.innerHTML = S.line(G.x(i), G.pt, G.x(i), G.H - G.pb, 's-ink dash') + S.circle(G.x(i), G.y(G.s.bal[i]), 4.5, 'f-up') + S.circle(G.x(i), G.y(G.s.con[i]), 4, 'f-info');
      tip.show(G.x(i), G.y(G.s.bal[i]), `Year ${i}<br>Total ${F.usd0(G.s.bal[i])}<br><span class="info">Put in ${F.usd0(G.s.con[i])}</span><br><span class="up">Growth ${F.usd0(G.s.bal[i] - G.s.con[i])}</span>`, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);
    const draw = ui.responsive(fig, (W) => {
      const s = series();
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.44, 240, 320));
      const pl = compact ? 44 : 56, pr = 14, pt = 30, pb = 30;
      const yMax = Math.max(...s.bal, ...s.con, 1) * 1.08;
      const x = SML.lin(0, s.Y, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, s.Y, compact ? 4 : 6).filter((v) => Number.isInteger(v)).forEach((v) => (b += S.text(x(v), H - pb + 16, v === 0 ? 'now' : v + 'y', 'xs mono', 'middle')));
      const bp = s.bal.map((v, i) => [x(i), y(v)]), cp = s.con.map((v, i) => [x(i), y(v)]);
      b += S.polygon(bp.concat(cp.slice().reverse()), 'f-up-t');
      b += S.area(cp, H - pb, 'f-info-t');
      b += S.poly(cp, 's-info w2') + S.poly(bp, 's-up w25');
      b += S.circle(x(s.Y), y(s.bal[s.Y]), 5, 'f-up');
      b += S.text(x(s.Y) - 10, Math.max(pt + 22, y(s.bal[s.Y]) - 4), kfmt(s.bal[s.Y]), 'md up b', 'end');
      // legend
      b += S.rect(pl, 8, 12, 12, 'f-info-t s-info w1', 2) + S.text(pl + 18, 18, 'what you put in', 'sm ink');
      b += S.rect(pl + (compact ? 116 : 136), 8, 12, 12, 'f-up-t s-up w1', 2) + S.text(pl + (compact ? 134 : 154), 18, 'growth', 'sm ink');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Savings growing to ${F.usd0(s.bal[s.Y])} over ${s.Y} years`, b);
      G = { W, pl, pr, pt, pb, H, x, y, s };
      const fin = s.bal[s.Y], cin = s.con[s.Y], gr = fin - cin;
      setT(id + '-fv', F.usd0(fin)); setT(id + '-in', F.usd0(cin)); setT(id + '-gr', F.usd0(gr), gr >= 0 ? 'up' : 'dn');
      $id(id + '-real').previousElementSibling.textContent = s.real ? 'Without inflation' : "In today's dollars";
      setT(id + '-real', s.real ? F.usd0(s.nomFinal) : F.usd0(s.nomFinal / Math.pow(1.03, s.Y)));
      if (s.r === 0) setMsg(id + '-msg', 'acc', 'No growth', 'With a 0% return you only get back what you put in. Growth is what makes long-term investing work.');
      else {
        const share = fin > 0 ? gr / fin : 0;
        const k = Math.max(0, s.Y - 10); const lastDec = s.Y > 10 ? (fin - s.bal[k]) / fin : 1;
        setMsg(id + '-msg', 'up', 'Compounding', s.Y > 10 ? `Growth makes up ${pctTxt(share)} of the final balance. ${pctTxt(lastDec)} of the money shows up in the last 10 years, so starting early matters most.` : `Growth makes up ${pctTxt(share)} of the final balance. Stretch the years to watch compounding take over.`);
      }
    });
  };

  /* =====================================================================
     11. styleQuiz: which style fits you?
     ===================================================================== */
  const QS = [
    { q: 'How much time can you watch the market on a weekday?', a: [['Almost none', { value: 3, wheel: 2, day: -3 }], ['30 to 60 minutes', { swing: 3, wheel: 2, value: 1, day: -1 }], ['A few hours most mornings', { day: 3, swing: 2, wheel: 1 }]] },
    { q: 'A position drops 5% in an hour. You…', a: [['Feel sick and want out', { value: 3, wheel: 1, day: -2 }], ['Check the plan and stay calm', { swing: 2, wheel: 2, value: 1, day: 1 }], ["Get excited. That's the action", { day: 2, swing: 1 }]] },
    { q: 'What is your main goal?', a: [['Grow wealth for retirement', { value: 3, wheel: 1 }], ['Extra monthly income', { wheel: 3, swing: 1 }], ['Learn to trade actively', { day: 2, swing: 2 }]] },
    { q: 'How big is your account?', a: [['Under $5,000', { value: 2, swing: 1, wheel: -1 }], ['$5,000 to $50,000', { wheel: 2, swing: 1, value: 1 }], ['Over $50,000', { wheel: 2, value: 1, swing: 1, day: 1 }]] },
    { q: 'How much trading experience do you have?', a: [['Brand new', { value: 2, day: -3 }], ['Some, mostly investing', { swing: 1, wheel: 1, value: 1 }], ['I have traded before', { day: 2, swing: 1 }]] },
  ];
  const FIT = {
    value: { name: 'Long-term investor', txt: 'You want steady growth without watching screens. Build a big long-term core and add to it every month.', link: ['#l-value', 'Value investing'] },
    swing: { name: 'Swing trader', txt: 'You can give the market a little time each day. Plan trades in the evening and let your orders do the work.', link: ['#l-styles', 'Compare styles'] },
    wheel: { name: 'Wheel income', txt: 'You like clear rules and regular income. Sell options on stocks you would be happy to own.', link: ['#l-wheel', 'The wheel strategy'] },
    day: { name: 'Active day trader', txt: 'You have time and like fast decisions. Start tiny, follow a game plan, and keep most of your money in the core.', link: ['#l-game-plan', 'Day-trade game plan'] },
  };
  SML.widgets.styleQuiz = function (root) {
    const id = SML.uid('sq');
    let step = 0; let ans = [];
    const LEAN = [['day', 'Day trading', 'f-dn'], ['swing', 'Swing', 'f-acc'], ['wheel', 'Wheel', 'f-vio'], ['value', 'Long-term', 'f-info']];
    function drawLean() {
      const fig = root.querySelector('.rk-lean'); if (!fig) return;
      const W = Math.max(260, fig.clientWidth - 24);
      const pts = { value: 0, swing: 0, wheel: 0, day: 0 };
      ans.slice(0, step).forEach((ai, qi) => { const add = QS[qi].a[ai][1]; Object.keys(add).forEach((k) => (pts[k] += add[k])); });
      const mx = Math.max(8, ...Object.values(pts).map((v) => Math.max(0, v) + 1));
      const lw = 84; let b = S.text(0, 11, step ? 'YOUR LEANING SO FAR' : 'YOUR LEANING (ANSWER TO FILL THE BARS)', 'cap');
      LEAN.forEach(([k, l, c], i) => {
        const yy = 22 + i * 22, w = ((Math.max(0, pts[k]) + 1) / mx) * (W - lw - 8);
        b += S.text(lw - 10, yy + 12, l, 'sm ink', 'end') + S.rect(lw, yy + 2, W - lw - 8, 12, 'f-shade', 6) + S.rect(lw, yy + 2, w, 12, c, 6);
      });
      fig.innerHTML = S.wrap(W, 108, 'How your answers so far lean toward each trading style', b);
    }
    function render() {
      if (step < QS.length) {
        const q = QS[step];
        root.innerHTML = `
          <div class="wg-bar"><span class="rk-qbar"><span class="pill acc">Question ${step + 1} of ${QS.length}</span><span class="prog"><i style="--w:${(step / QS.length) * 100}%"></i></span></span></div>
          <div class="wg-fig rk-lean"></div>
          <div class="rk-quiz"><p class="q" id="${id}-q">${q.q}</p><div class="quiz-opts" role="group" aria-labelledby="${id}-q">${q.a.map((a, i) => `<button type="button" class="qopt" data-a="${i}"><span class="k">${'ABC'[i]}</span>${a[0]}</button>`).join('')}</div></div>
          <div class="wg-actions"><button type="button" class="btn btn-g sm" data-act="back"${step ? '' : ' disabled'}>Back</button><span class="note">Five quick questions. Nothing is saved.</span></div>`;
        drawLean();
      } else {
        const pts = { value: 0, swing: 0, wheel: 0, day: 0 };
        ans.forEach((ai, qi) => { const add = QS[qi].a[ai][1]; Object.keys(add).forEach((k) => (pts[k] += add[k])); });
        const isNew = ans[4] === 0;
        const w = { core: 4 + Math.max(0, pts.value), swing: Math.max(0, pts.swing), wheel: Math.max(0, pts.wheel), day: Math.max(0, pts.day) * (isNew ? 0.4 : 1) };
        const tot = w.core + w.swing + w.wheel + w.day;
        let a = { core: (90 * w.core) / tot, swing: (90 * w.swing) / tot, wheel: (90 * w.wheel) / tot, day: (90 * w.day) / tot };
        const dayCap = isNew ? 5 : 15; if (a.day > dayCap) { a.core += a.day - dayCap; a.day = dayCap; }
        if (a.core < 40) { const need = 40 - a.core, pool = a.swing + a.wheel + a.day; const f = pool > 0 ? (pool - need) / pool : 0; a.swing *= f; a.wheel *= f; a.day *= f; a.core = 40; }
        const r5 = (v) => Math.round(v / 5) * 5;
        a = { swing: r5(a.swing), wheel: r5(a.wheel), day: r5(a.day) }; a.core = 90 - a.swing - a.wheel - a.day; a.cash = 10;
        const top = Object.keys(pts).sort((p, q) => pts[q] - pts[p])[0];
        const fit = FIT[top];
        const parts = [{ k: 'core', name: 'Core long-term', cls: 'f-info', sw: 'c-info' }, { k: 'swing', name: 'Swing trades', cls: 'f-acc', sw: 'c-acc' }, { k: 'wheel', name: 'The wheel', cls: 'f-vio', sw: 'c-vio' }, { k: 'day', name: 'Day trading', cls: 'f-dn', sw: 'c-dn' }, { k: 'cash', name: 'Cash', cls: 'f-mut', sw: 'c-mut' }];
        const links = [fit.link].concat([['#l-blend', 'Blending styles'], ['#l-styles', 'Compare styles']].filter((l) => l[0] !== fit.link[0]));
        root.innerHTML = `
          <div class="wg-bar"><span class="rk-qbar"><span class="pill up">Your result</span><span class="prog"><i style="--w:100%"></i></span></span></div>
          <div class="rk-split rk-wide-q">
            <div class="rk-donut">${S.wrap(190, 190, 'Suggested blend of styles', donut(95, 95, 88, 56, parts.map((p) => ({ v: a[p.k], cls: p.cls }))) + S.text(95, 92, 'YOUR', 'cap', 'middle') + S.text(95, 110, 'BLEND', 'cap', 'middle'))}</div>
            <div class="rk-res">
              <span class="eyebrow">Your fit</span>
              <h3 class="rk-res-h">${fit.name}</h3>
              <p>${fit.txt}</p>
              <div class="rk-legend">${parts.filter((p) => a[p.k] > 0).map((p) => `<div class="row"><i class="rk-sw ${p.sw}"></i><span class="n">${p.name}</span><b>${a[p.k]}%</b></div>`).join('')}</div>
              <div class="rk-links">${links.map((l) => `<a class="btn btn-g sm" href="${l[0]}">${l[1]} →</a>`).join('')}</div>
            </div>
          </div>
          <div class="wg-actions"><button type="button" class="btn btn-p sm" data-act="restart">Take it again</button><span class="note">A starting point to learn from, not financial advice.</span></div>`;
        const split = root.querySelector('.rk-split');
        const fitW = () => split.style.setProperty('grid-template-columns', root.clientWidth >= 560 ? 'auto minmax(0,1fr)' : '1fr');
        fitW();
      }
    }
    root.addEventListener('click', (e) => {
      const opt = e.target.closest('.qopt[data-a]');
      if (opt && root.contains(opt)) { ans[step] = Number(opt.dataset.a); step = Math.min(QS.length, step + 1); render(); return; }
      const act = e.target.closest('[data-act]'); if (!act) return;
      if (act.dataset.act === 'back' && step > 0) { step--; render(); }
      if (act.dataset.act === 'restart') { step = 0; ans = []; render(); }
    });
    let lastRW = 0;
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (root.clientWidth === lastRW) return; lastRW = root.clientWidth; const sp = root.querySelector('.rk-wide-q'); if (sp) sp.style.setProperty('grid-template-columns', root.clientWidth >= 560 ? 'auto minmax(0,1fr)' : '1fr'); requestAnimationFrame(drawLean); }); ro.observe(root); SML.onCleanup(() => ro.disconnect()); }
    render();
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push(
    {
      id: 'l-one-percent', course: 'risk', order: 1, title: 'The 1% rule', mins: 4, level: 'Beginner',
      summary: 'Why small bets keep you in the game through losing streaks.',
      idea: 'Risk about 1% of your account per trade, so a losing streak hurts but never knocks you out.',
      widget: 'onePct', opts: {},
      try: 'Push the risk per trade up to 10% and see what ten losses in a row do to the account.',
      body: [
        '<p><b>Risk</b> is the money you lose if the trade hits your stop loss. It is not the size of the position. With a $10,000 account, 1% risk means you plan to lose at most $100 on that trade.</p>',
        '<p>Losing streaks are normal. Even a trader who wins half the time will see about 8 losses in a row somewhere in a few hundred trades. At 1% risk that streak costs about 8%. At 10% risk it costs more than half the account.</p>',
        "<p>Small risk also keeps your head clear. When one trade can't hurt you much, you can follow your plan instead of panicking.</p>",
      ],
      points: ['Risk is what you lose if your stop is hit, not what you buy.', 'Keep it around 1% per trade (2% at most) while learning.', 'Losing streaks will happen. Size so you survive them.', 'The deeper the hole, the harder the climb back.'],
      quiz: { q: 'You have $20,000 and follow the 1% rule. What is the most you plan to lose on one trade?', options: ['$20', '$200', '$2,000'], answer: 1, why: '1% of $20,000 is $200. That is your planned loss if the stop is hit.' },
      terms: ['Position size', 'Stop loss', 'Drawdown'],
      example: {"title": "Sizing a $15,000 account", "intro": "An example account with made-up prices.", "steps": ["Your account is $15,000. At 1% risk, the most you plan to lose on one trade is $150.", "You want to buy DEMO at $42.00 with a stop at $40.50, just under support. That is $1.50 of risk per share.", "$150 ÷ $1.50 = 100 shares, a $4,200 position. The position is far bigger than the risk, and that is fine.", "Five trades in a row hit their stops. Each loss is 1% of what is left, so the account ends near $14,265, down about 5%.", "The same five losses at 10% risk per trade would leave about $8,857, down about 41%."], "result": "Same streak, same trades: about 5% lost at 1% risk versus about 41% lost at 10% risk."},
      mistakes: ["Confusing position size with risk. A $4,200 position can risk only $150 when the stop is close.", "Raising risk after a loss to win it back faster. That is how a normal streak turns into a deep hole.", "Trading without a stop, so the real risk on the trade is unknown.", "Betting more on trades that feel like sure things. Every trade gets the same risk because you cannot tell in advance which ones will work."],
    },
    {
      id: 'l-position-size', course: 'risk', order: 2, title: 'Position sizing', mins: 5, level: 'Beginner',
      summary: 'Turn your stop and your risk budget into an exact share count.',
      idea: 'Pick the stop first, then buy only as many shares as your risk budget allows.',
      widget: 'sizeCalc', opts: {},
      try: 'Drag the red stop line closer to the entry and watch the share count grow while the max loss stays put.',
      body: [
        "<p>Most beginners pick a share count first (“I'll buy 100”) and hope. Pros work the other way. They decide where the trade is proven wrong, which is the <b>stop</b>, then size the position so being wrong costs a fixed amount.</p>",
        "<p>The math is one line: <b>shares = money you're willing to lose ÷ distance from entry to stop</b>. $250 of risk with a $1.50 stop distance means 166 shares.</p>",
        '<p>A tight stop gives you more shares and a wide stop fewer, but the dollar loss stays the same. Put the stop where the idea is wrong, like just under a support level, not at a random round number.</p>',
      ],
      points: ['Decide the stop before the entry.', 'Shares = risk in dollars ÷ (entry − stop).', 'A tighter stop means more shares with the same dollar risk.', 'If the position is bigger than your account, the stop is too tight or the trade is too big.'],
      quiz: { q: 'Your risk budget is $100. Entry $20.00, stop $19.50. How many shares?', options: ['50', '200', '500'], answer: 1, why: '$100 ÷ $0.50 risk per share = 200 shares.' },
      terms: ['Position size', 'Stop loss', 'R multiple', 'Risk:reward', 'Slippage'],
      example: {"title": "Sizing a retest entry", "intro": "A $25,000 example account risking 1% per trade.", "steps": ["Your risk budget is 1% of $25,000 = $250.", "You plan to buy DEMO at $30.00 on a retest. The stop goes under the level at $28.75, so risk per share is $1.25.", "Shares = $250 ÷ $1.25 = 200 shares. The position is $6,000, or 24% of the account.", "Targets: 1R is $31.25, 2R is $32.50 and 3R is $33.75 (entry plus 1, 2 or 3 times $1.25).", "If the stop is hit you lose 200 × $1.25 = $250, exactly 1%. A fast drop can fill a little lower, so a bit of slippage is normal."], "result": "Risk $250 to make $500 at the 2R target."},
      mistakes: ["Choosing the number of shares first, then placing the stop wherever the loss feels small enough.", "Setting the stop so tight that normal wiggles hit it. A tiny stop also inflates the share count and the position.", "Forgetting that a gap through the stop can lose more than planned. Keep any single position small enough to survive a gap.", "Sizing from last month's balance instead of today's account value after a losing stretch."],
    },
    {
      id: 'l-risk-reward', course: 'risk', order: 3, title: 'Win rate & reward', mins: 6, level: 'Intermediate',
      summary: 'How win rate and reward-to-risk combine into an edge.',
      idea: 'You can lose more often than you win and still grow, if your wins are bigger than your losses.',
      widget: 'riskSim', opts: {},
      try: 'Set the win rate to 40% and reward to 2 : 1, then press Run again a few times.',
      body: [
        '<p>Traders measure results in <b>R</b>, where 1R is the amount you risked on a trade. A 2R win made twice what you risked. A full loss is −1R.</p>',
        '<p>Your <b>expectancy</b> is the average R per trade: win rate × average win − loss rate × average loss. At 40% wins and 2R targets that is 0.4 × 2 − 0.6 × 1 = +0.2R per trade.</p>',
        '<p>Each line in the chart is one possible future with the same rules. Luck decides the order of wins and losses, so even a good system has ugly stretches. That is why risk per trade must stay small.</p>',
      ],
      points: ['Expectancy = win % × average win − loss % × average loss.', "Breakeven win rate = 1 ÷ (1 + reward:risk). At 2 : 1 it's 33%.", 'A positive edge still has losing streaks.', 'Bigger risk per trade makes the bad futures much worse.'],
      quiz: { q: 'Your targets are 3R and your stops are 1R. What win rate do you need to break even?', options: ['25%', '33%', '50%'], answer: 0, why: '1 ÷ (1 + 3) = 25%. Win more than one trade in four and the math is on your side.' },
      terms: ['R multiple', 'Risk:reward', 'Win rate', 'Expectancy', 'Drawdown'],
      example: {"title": "Is this strategy worth trading?", "intro": "Fifty example trades from a journal.", "steps": ["Your journal shows 50 trades: 20 winners and 30 losers. The win rate is 40%.", "Winners average +2.5R. Losers average −1R because you always respect the stop.", "Expectancy = 0.40 × 2.5 − 0.60 × 1 = 1.0 − 0.6 = +0.4R per trade.", "Breakeven win rate at 2.5 : 1 is 1 ÷ 3.5, about 29%. You are about 11 points above it.", "Risking $100 per trade, 100 more trades like these would make about 40R, roughly $4,000, with losing streaks along the way."], "result": "A 40% win rate is a winning strategy when the average win is big enough."},
      mistakes: ["Judging a strategy by its win rate alone. A 70% win rate loses money if the losers are much bigger than the winners.", "Taking profits early out of fear, so the average win shrinks below what the math needs.", "Trusting expectancy from 10 trades. You need dozens of trades before the numbers mean much.", "Raising risk because the expectancy is positive. A real edge still has long losing streaks."],
    },
    {
      id: 'l-drawdowns', course: 'risk', order: 4, title: 'Losses are lopsided', mins: 3, level: 'Beginner',
      summary: 'Why a 50% loss needs a 100% gain to get back to even.',
      idea: 'Every loss needs a bigger gain to recover, and the gap grows fast as losses get deeper.',
      widget: 'drawdownCalc', opts: {},
      try: 'Slide the loss from 10% to 50%, then press Replay to watch the drop and the climb back.',
      body: [
        '<p>A <b>drawdown</b> is how far your account has fallen from its high. If $10,000 drops 50% you have $5,000 left. A 50% gain on $5,000 only gets you to $7,500. You need +100% to get back to $10,000.</p>',
        '<p>Small losses are cheap to fix: −10% needs +11%. Big ones are brutal: −75% needs +300%. Protecting the downside matters more than chasing the upside.</p>',
      ],
      points: ['Gain needed = loss ÷ (1 − loss).', '−10% needs +11%. −50% needs +100%.', 'Cut losses while they are small.', 'Your first job is to protect your capital.'],
      quiz: { q: 'Your account falls 20%. What gain gets you back to even?', options: ['20%', '25%', '40%'], answer: 1, why: '0.20 ÷ 0.80 = 25%. After a loss you are growing a smaller base.' },
      terms: ['Drawdown', 'Stop loss', 'Position size', 'Compounding'],
      example: {"title": "Climbing out of a hole", "intro": "An example $20,000 account after a bad month.", "steps": ["Your account starts at $20,000.", "A bad month drops it 30% to $14,000.", "Getting back to $20,000 takes $6,000 on a $14,000 base: $6,000 ÷ $14,000 is about 43%.", "If you had stopped trading and reviewed at −10% ($18,000), you would need only $2,000 ÷ $18,000, about 11%.", "At a steady +2% a month, +11% takes about 5 to 6 months. +43% takes about 18 months."], "result": "The deeper the drawdown, the longer and harder the climb back."},
      mistakes: ["Doubling position size to make it back faster. Bigger size in a drawdown usually makes the hole deeper.", "Thinking a 50% loss needs a 50% gain. It needs 100%.", "Moving or removing the stop to avoid taking a loss, which turns a small drawdown into a deep one.", "Having no drawdown limit. Decide in advance at what loss you stop trading and review, for example −10%."],
    },
    {
      id: 'l-stock-picking', course: 'risk', order: 5, title: 'Which stocks to trade', mins: 5, level: 'Beginner',
      summary: 'Filter thousands of stocks down to a short watchlist worth your time.',
      idea: 'Trade stocks that are liquid, moving for a reason, and cheap to get in and out of.',
      widget: 'stockFunnel', opts: {},
      try: 'Turn the filters on and off, then click a row to see why that stock passes or fails.',
      body: [
        '<p><b>Liquidity</b> means lots of shares trade every day. In a liquid stock your order fills fast, near the price you see. In a thin stock you can get stuck.</p>',
        '<p>The <b>bid-ask spread</b> is the gap between the best price to sell and the best price to buy. A $0.10 spread costs you $10 per 100 shares the moment you enter. Day traders want a spread of a penny or two.</p>',
        "<p><b>Relative volume</b> (RVOL) compares today's volume to normal. RVOL of 2 or more usually means news, and news brings the moves. Very cheap stocks move a lot but are easy to push around, so most traders skip them.</p>",
      ],
      points: ['Liquid: about 1 million or more shares a day.', 'Tight spread: a few cents or less.', 'In play: news and relative volume of 2× or more.', 'Keep the watchlist to 2–4 stocks you know well.'],
      quiz: { q: "Which stock fits a day trader's watchlist best?", options: ['$2 stock, 50M shares a day, no news', '$60 stock, 4M shares a day, earnings today, $0.01 spread', '$300 stock, 200K shares a day, $0.40 spread'], answer: 1, why: 'It is liquid, cheap to trade and has a reason to move today.' },
      terms: ['Liquidity', 'Bid-ask spread', 'Relative volume', 'Volume', 'Slippage'],
      example: {"title": "Building a morning watchlist", "intro": "A premarket scan with made-up tickers.", "steps": ["Your premarket scanner lists 40 stocks up or down more than 3%.", "Drop anything that trades under 1 million shares a day on average: 14 are left.", "Drop anything with a spread wider than $0.03: 9 are left.", "Keep only those with news and relative volume of 2× or more: 5 are left.", "Mark the levels on each. Three have clean PDH and PMH lines: DEMO-A, DEMO-B and DEMO-C. That is your watchlist."], "result": "Three stocks, each with a reason to move, tight spreads and levels you can plan around."},
      mistakes: ["Trading thin, low-priced stocks because they move a lot. Wide spreads and slippage eat the profits.", "Watching 15 tickers at once and missing the setup on all of them.", "Picking stocks with no news or reason to move. They tend to drift and chop.", "Ignoring the spread when you size. A $0.20 spread on a $0.50 stop is 40% of your risk gone on entry and exit."],
    },
    {
      id: 'l-styles', course: 'styles', order: 1, title: 'Day, swing, wheel, value', mins: 5, level: 'Beginner',
      summary: 'Four ways to use the market, from minutes to years.',
      idea: 'Each style trades a different amount of your time for a different kind of return.',
      widget: 'styleCompare', opts: {},
      try: 'Switch between the four styles and compare holding time, screen time and taxes.',
      body: [
        '<p><b>Day trading</b> opens and closes trades the same day. <b>Swing trading</b> holds for days to weeks to catch a bigger move. <b>The wheel</b> sells options on stocks you would happily own to collect income. <b>Value investing</b> buys good businesses below what they are worth and holds for years.</p>',
        '<p>No style is best for everyone. The right one fits your schedule, your temperament and your account. Most people do better with less screen time, not more.</p>',
        '<p>Taxes differ too. Gains on anything held a year or less are taxed like your salary. Holding longer than a year usually gets a lower rate.</p>',
      ],
      points: ['Day trading: minutes to hours, hours of screen time.', 'Swing trading: days to weeks, fits around a job.', 'The wheel: steady option income on stocks you want to own.', 'Value investing: years, little screen time, lower taxes.'],
      quiz: { q: 'You have a full-time job and can check the market once in the evening. Which style fits best?', options: ['Day trading', 'Swing trading', 'Trading the first 5 minutes'], answer: 1, why: "Swing trades are planned in the evening and managed with orders, so you don't need to watch all day." },
      terms: ['Day trading', 'Swing trading', 'Value investing', 'Wheel', 'Short-term gain', 'Long-term gain'],
      example: {"title": "Fitting styles to a 9-to-5 week", "intro": "You have a full-time job, $12,000 and about 30 minutes each evening.", "steps": ["Day trading needs you at the screen from 9:30 to about 11:00 ET. You are at work then, so it is out.", "Swing trading fits: you scan after the close, place limit entries and stops as orders, and check once each evening.", "The wheel fits: one cash-secured put on a $40 stock ties up $4,000, so you can run one or two at a time.", "Value investing fits: $300 a month into an index fund, plus a company you studied when it trades well below your value estimate.", "Taxes: swing gains held a year or less are taxed like salary. Value holdings kept more than a year get the lower long-term rates."], "result": "Swing, the wheel and value all fit your week. Day trading does not, and that is fine."},
      mistakes: ["Choosing day trading because it looks exciting, not because your schedule allows it.", "Switching styles after every losing week, so you never get enough trades to learn any one style.", "Holding a failed day trade overnight and calling it a swing trade, or a failed swing trade and calling it an investment.", "Ignoring taxes. Frequent short-term gains are taxed at your income rate, which can cut returns a lot."],
    },
    {
      id: 'l-game-plan', course: 'styles', order: 2, title: 'A day-trade game plan', mins: 5, level: 'Intermediate',
      summary: 'A step-by-step routine from premarket prep to the closing journal.',
      idea: 'Good day trades are planned before the open. The session is for following the plan.',
      widget: 'gamePlan', opts: {},
      try: 'Tap each step to see when it happens, and tick it off as you get ready.',
      body: [
        "<p>The <b>premarket</b> runs from 4:00 to 9:30 AM Eastern. Use it to find what is moving and why, and to mark the key levels: yesterday's high and low (PDH, PDL) and the premarket high and low (PMH, PML).</p>",
        '<p>The first minutes after 9:30 are the most volatile of the day. Many traders wait 5 to 15 minutes for the dust to settle, then trade only the setup they planned.</p>',
        '<p>Volume dries up around midday, so moves get choppy. Many traders stop after the morning, set a daily loss limit, and journal every trade after the close.</p>',
      ],
      points: ['Prep in the premarket: news, levels, 2–4 stocks.', 'Let the open settle before your first trade.', 'Trade one planned setup, with the stop set before entry.', 'Stop at your daily loss limit. Journal every trade.'],
      quiz: { q: 'When is volume usually lowest during the regular session?', options: ['The first 15 minutes', 'Midday', 'The last hour'], answer: 1, why: 'Volume is U-shaped: heavy at the open and the close, light around lunch.' },
      terms: ['Premarket', 'PDH', 'PDL', 'PMH', 'PML', 'Day trading'],
      example: {"title": "One morning, by the plan", "intro": "An example $16,000 account and a made-up stock.", "steps": ["8:45 ET: DEMO has earnings news and 3× its usual premarket volume. PMH is $51.20, PML $49.80 and PDH $52.40.", "9:00: You write the plan. Long only above PMH on a retest that holds, stop under $51.00, target PDH.", "9:30 to 9:45: You wait. The first candles swing between $50.40 and $51.60.", "9:52: A 2-minute candle closes at $51.45 on high volume, then a retest at $51.25 holds. You buy 400 shares at $51.30 with a stop at $50.90. Risk is $0.40 × 400 = $160, about 1%.", "10:40: Price reaches $52.30 just under PDH and you sell. Profit is $1.00 × 400 = $400."], "result": "+$400, or 2.5R. You journal it the same way you would journal a loss."},
      mistakes: ["Trading the first five minutes before any level has been tested.", "Having no daily loss limit, so one bad morning turns into a bad month.", "Taking trades that were not in the plan just because the stock is moving.", "Skipping the journal on winning days. Wins teach you as much as losses."],
    },
    {
      id: 'l-value', course: 'styles', order: 3, title: 'Value investing', mins: 5, level: 'Beginner',
      summary: 'Estimate what a business is worth and buy it for less.',
      idea: 'Price is what you pay and value is what the business is worth. Buy with a cushion between them.',
      widget: 'marginSafety', opts: {},
      try: 'Change the earnings, the fair P/E and the price to move in and out of the buy zone.',
      body: [
        '<p>A simple first estimate of value is <b>earnings per share × a fair P/E</b>. A company earning $4 a share at a fair multiple of 15 is worth about $60 a share.</p>',
        '<p>Your estimate will be off by some amount. A <b>margin of safety</b> protects you: only buy when the price is well below your estimate, often 20–40% below.</p>',
        '<p>Prices swing around value for years because of fear and greed. Value investors use those swings, buying when others are scared and holding while the price catches up.</p>',
      ],
      points: ['Value ≈ EPS × fair P/E, as a rough first estimate.', 'Margin of safety = (value − price) ÷ value.', 'Ask for a bigger cushion when you are less sure.', 'Expect to hold for years.'],
      quiz: { q: 'Your value estimate is $50 and the price is $35. What is the margin of safety?', options: ['15%', '30%', '43%'], answer: 1, why: '($50 − $35) ÷ $50 = 30%.' },
      terms: ['Value investing', 'Margin of safety', 'P/E', 'EPS'],
      example: {"title": "Valuing a steady company", "intro": "A made-up company with example numbers.", "steps": ["DEMO Foods earns $3.00 per share (EPS) and has grown slowly and steadily for years.", "Similar steady companies trade around 16 times earnings, so a rough value is $3.00 × 16 = $48.", "After a market sell-off, the stock trades at $36.", "Margin of safety = ($48 − $36) ÷ $48 = 25%.", "You are not sure about the estimate, so you want 30%. Your buy price is $48 × 0.70 = $33.60, and you place a limit order there."], "result": "No buy at $36. You wait for $33.60, or for new facts that change your estimate."},
      mistakes: ["Buying a low P/E stock without asking why it is cheap. Some are cheap because the business is shrinking.", "Using a fair P/E from a fast-growing sector for a slow, steady business.", "Treating the value estimate as exact. It is a range, which is why you want a margin of safety.", "Selling after a few months because the price has not moved. Value plays usually take years."],
      glossary: [{"t": "Value trap", "d": "A stock that looks cheap on the numbers but keeps falling because the business is getting worse."}],
    },
    {
      id: 'l-blend', course: 'styles', order: 4, title: 'Blending styles', mins: 4, level: 'Beginner',
      summary: 'Split one account into buckets, each with its own rules.',
      idea: 'You can mix styles, as long as each one gets its own bucket of money and its own rules.',
      widget: 'blendAllocator', opts: {},
      try: 'Move the sliders. The others adjust so the total always stays at 100%.',
      body: [
        '<p>A common blend: a large <b>core</b> of index funds or value stocks you hold for years, a middle bucket for swing trades and the wheel, a small bucket for day trading while you learn, and some cash.</p>',
        '<p>Keep the buckets separate. Never sell the core to cover a losing trade. If a bucket hits its loss limit, pause it and review before adding money.</p>',
        '<p>Size day trades from the day-trading bucket, not the whole account. 1% of a $2,500 bucket is $25 per trade, which is plenty while you learn.</p>',
      ],
      points: ['Give each style its own bucket and its own rules.', 'Keep the long-term core the biggest bucket.', 'Size trades from their bucket, not the whole account.', 'A bucket that hits its loss limit pauses until you review it.'],
      quiz: { q: 'Your day-trading bucket keeps losing. What does a blend plan say to do?', options: ['Move money from the core into it', 'Pause it and review your trades', 'Double the size to win it back'], answer: 1, why: 'Each bucket has its own limit. Pausing protects the rest of the account.' },
      terms: ['Diversification', 'Day trading', 'Swing trading', 'Wheel', 'Compounding'],
      example: {"title": "Splitting a $30,000 account", "intro": "One example blend. Your own split depends on your goals and time.", "steps": ["Core, 60%: $18,000 in index funds that you add to and do not trade.", "Swing and wheel, 25%: $7,500. One cash-secured put on a $30 stock ties up $3,000 of it.", "Day trading, 5%: $1,500. Risking 1% of this bucket means $15 per day trade.", "Cash, 10%: $3,000 kept ready for a sale in the market.", "A rough month takes the day bucket down 20% to $1,200. It hits its loss limit and pauses for review. The core is untouched."], "result": "A bad month of day trading costs $300, not the whole account."},
      mistakes: ["Moving money from the core to refill a losing trading bucket.", "Sizing day trades from the whole account instead of the day-trading bucket.", "Keeping no cash, so you cannot act when prices drop.", "Letting the trading buckets quietly grow bigger than the core."],
    }
  );
})();
