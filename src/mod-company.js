/* Stock Market Lessons: Company Fundamentals, Taxes for Traders, Execution & Habits */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const clamp = SML.clamp;
  const $id = (x) => document.getElementById(x);
  const MF = (v) => (v < 0 ? F.minus : '') + '$' + F.num(Math.abs(v)) + 'M';
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const msgTo = (x, html) => { const e = $id(x); if (e) e.innerHTML = html; };
  const BR = [10, 12, 22, 24, 32, 35, 37];
  const brSelect = (id, val, label) => `<label class="fld" for="${id}"><span>${label || 'Income tax bracket'}</span><select id="${id}">${BR.map((b) => `<option value="${b}"${b === val ? ' selected' : ''}>${b}%</option>`).join('')}</select></label>`;
  /* status chip drawn in svg, right-aligned at xr */
  const chip = (xr, y, label, kind) => { const w = label.length * 7.3 + 16; return S.rect(xr - w, y - 13, w, 19, 'f-' + kind + '-t', 9.5) + S.text(xr - w / 2, y, label, 'cap ' + kind, 'middle'); };

  SML.css(`
    .mc-read{display:flex;flex-wrap:wrap}
    .mc-read > .stat{flex:1 1 128px}
    .mc-fseg .seg{align-self:flex-start}
    .mc-orders{display:flex;flex-direction:column;gap:6px;padding:12px 16px;background:var(--surface)}
    .mc-orders .row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:13.5px;color:var(--text)}
    .mc-orders .row b{font-family:var(--mono);color:var(--ink)}
    .mc-orders .row .sp{flex:1 1 auto}
    .mc-orders .empty{font-size:13.5px;color:var(--muted)}
    .mc-mt{display:flex;flex-direction:column;gap:12px;padding:16px;background:var(--surface)}
    .mc-urge{font-size:17px;line-height:1.4;color:var(--ink);font-weight:600;padding-left:14px;border-left:3px solid var(--accent);max-width:60ch}
    .mc-mt .qopt[disabled]{cursor:default}
    .mc-mt .qopt[disabled]:not(.right):not(.wrong):hover{border-color:var(--line)}
    .mc-mt .qopt[disabled]:not(.right):not(.wrong){opacity:.6}
    .mc-dots{display:inline-flex;gap:6px;align-items:center}
    .mc-dots i{width:10px;height:10px;border-radius:50%;background:var(--shade2)}
    .mc-dots i.cur{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent)}
    .mc-dots i.ok{background:var(--up)} .mc-dots i.no{background:var(--down)}
    .mc-jt{background:var(--surface);position:relative}
    .mc-jt .sheet{width:100%}
    .mc-jt td.setup{width:30%}
    .mc-jt td.setup input{min-width:170px}
    .mc-jt td.calc{min-width:72px}
    .mc-del{border:0;background:transparent;color:var(--muted);cursor:pointer;width:36px;height:33px;font-size:17px;line-height:1}
    .mc-del:hover{color:var(--down)}
  `);

  /* waterfall bars. steps: [{l:[lines], v, abs:bool, c:'up'|'dn'|'info'|'acc'|'vio'}] */
  function waterfall(W, top, bottom, steps, compact, fmt) {
    let run = 0;
    const bars = steps.map((st) => { let a, b; if (st.abs) { a = 0; b = st.v; } else { a = run; b = run + st.v; } run = b; return Object.assign({ a, b }, st); });
    const vals = [0]; bars.forEach((b) => vals.push(b.a, b.b));
    let lo = Math.min(...vals), hi = Math.max(...vals); const span = hi - lo || 1;
    hi += span * 0.16; if (lo < 0) lo -= span * 0.18;
    const y = SML.lin(lo, hi, bottom, top);
    const n = bars.length, x0 = 6, x1 = W - 6, slot = (x1 - x0) / n, bw = Math.min(compact ? 46 : 80, slot * 0.6);
    let s = S.line(x0, y(0), x1, y(0), 's-mut');
    bars.forEach((b, i) => {
      const cx = x0 + slot * (i + 0.5), yt = y(Math.max(b.a, b.b)), yb = y(Math.min(b.a, b.b));
      if (i < n - 1) { const nx = x0 + slot * (i + 1.5); s += S.line(cx + bw / 2, y(b.b), nx - bw / 2, y(b.b), 's-mut dash'); }
      s += S.rect(cx - bw / 2, yt, bw, Math.max(2, yb - yt), 'f-' + b.c, 3);
      const lv = b.abs ? fmt(b.v) : (b.v >= 0 ? '+' : '') + fmt(b.v);
      if (b.abs && b.v < 0) s += S.text(cx, yb + 15, lv, 'sm mono b dn', 'middle');
      else s += S.text(cx, yt - 7, lv, 'sm mono b ink', 'middle');
      b.l.forEach((ln, k) => { s += S.text(cx, bottom + 17 + k * 13, ln, (compact ? 'sm' : 'md') + ' ink', 'middle'); });
    });
    return s;
  }

  /* =====================================================================
     1. statementsLab: income / balance sheet / cash flow
     ===================================================================== */
  SML.widgets.statementsLab = function (root) {
    const id = SML.uid('st');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-s', [{ v: 'inc', label: 'Income' }, { v: 'bal', label: 'Balance sheet' }, { v: 'cf', label: 'Cash flow' }], 'inc', 'Statement')}<span class="grow"></span><span class="pill">Example company · $ millions</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl mc-pane" data-p="inc">${ui.slider({ id: id + '-rev', label: 'Revenue (sales)', min: 50, max: 400, step: 5, value: 200, fmt: MF })}${ui.slider({ id: id + '-cost', label: 'Costs and expenses', min: 20, max: 420, step: 5, value: 160, fmt: MF })}</div>
      <div class="wg-ctrl mc-pane" data-p="bal" hidden>${ui.slider({ id: id + '-ast', label: 'Assets: what it owns', min: 100, max: 1000, step: 10, value: 600, fmt: MF })}${ui.slider({ id: id + '-debt', label: 'Debt: what it owes', min: 50, max: 1000, step: 10, value: 250, fmt: MF })}</div>
      <div class="wg-ctrl mc-pane" data-p="cf" hidden>${ui.slider({ id: id + '-dep', label: 'Non-cash costs (depreciation)', min: 0, max: 80, step: 5, value: 20, fmt: MF })}${ui.slider({ id: id + '-capex', label: 'Capex: new equipment, buildings', min: 0, max: 150, step: 5, value: 35, fmt: MF })}</div>
      <div class="wg-read mc-read">${ui.stat('Net income', id + '-ni')}${ui.stat('Profit margin', id + '-pm')}${ui.stat('Equity', id + '-eq')}${ui.stat('Debt / equity', id + '-de')}${ui.stat('Free cash flow', id + '-fcf', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());

    function strip(W, cur, ni, compact) {
      const sign = ni >= 0 ? '+' : '';
      const items = [
        ['inc', 'INCOME', compact ? MF(ni) : 'Profit ' + MF(ni)],
        ['bal', 'BALANCE', compact ? sign + MF(ni) : 'Equity ' + sign + MF(ni)],
        ['cf', 'CASH FLOW', compact ? MF(ni) : 'Starts at ' + MF(ni)],
      ];
      const gap = compact ? 16 : 26, bw = (W - 2 * gap - 4) / 3;
      let s = '';
      items.forEach((it, i) => {
        const x = 2 + i * (bw + gap), on = it[0] === cur;
        s += S.rect(x, 6, bw, 48, on ? 'f-acc-t s-acc w15' : 'f-surf s-line', 6);
        s += S.text(x + bw / 2, 24, it[1], 'cap' + (on ? ' acc' : ''), 'middle');
        s += S.text(x + bw / 2, 43, it[2], 'md mono b ' + (ni >= 0 ? 'ink' : 'dn'), 'middle');
        if (i < 2) s += S.arrow(x + bw + 3, 30, x + bw + gap - 2, 30, 'mut', 6);
      });
      s += S.text(W / 2, 72, compact ? 'Profit links all three reports' : 'Profit is the thread that links all three reports', 'sm', 'middle');
      return s;
    }
    function inLabel(cx, yt, yb, name, val) {
      const h = yb - yt;
      if (h >= 40) return S.text(cx, (yt + yb) / 2 - 2, name, 'md b on', 'middle') + S.text(cx, (yt + yb) / 2 + 14, val, 'sm mono on', 'middle');
      if (h >= 17) return S.text(cx, (yt + yb) / 2 + 4.5, name + ' ' + val, 'sm b on', 'middle');
      return '';
    }
    function balance(W, top, bottom, ast, debt, eq, ni, compact) {
      const mx = Math.max(ast, debt) * 1.1;
      const y = SML.lin(0, mx, bottom, top);
      const cw = Math.min(compact ? 92 : 130, W * 0.3), lx = W * 0.28, rx = W * 0.66;
      let s = S.line(6, bottom, W - 6, bottom, 's-mut');
      s += S.rect(lx - cw / 2, y(ast), cw, bottom - y(ast), 'f-info', 3) + inLabel(lx, y(ast), bottom, 'Assets', MF(ast));
      s += S.rect(rx - cw / 2, y(debt), cw, bottom - y(debt), 'f-dn', 3) + inLabel(rx, y(debt), bottom, 'Debt', MF(debt));
      const side = rx + cw / 2 + 8, roomRight = W - side > 92;
      if (bottom - y(debt) < 17 && roomRight) s += S.text(side, (y(debt) + bottom) / 2 + 4, 'Debt ' + MF(debt), 'sm b dn');
      if (eq > 0) {
        s += S.rect(rx - cw / 2, y(ast), cw, y(debt) - y(ast), 'f-up', 3);
        let eqTop = y(ast);
        if (ni > 0) {
          const band = y(ast - Math.min(ni, eq)) - y(ast);
          s += S.rect(rx - cw / 2, y(ast), cw, Math.max(2, band), 'f-acc', 3);
          if (roomRight) s += S.line(rx + cw / 2 + 2, y(ast) + band / 2, side - 2, y(ast) + band / 2, 's-acc') + S.text(side, y(ast) + band / 2 + 4, "this year's profit", 'sm b acc');
          eqTop += band;
        }
        s += inLabel(rx, eqTop, y(debt), 'Equity', MF(eq));
        if (y(debt) - eqTop < 17 && roomRight) s += S.text(side, (eqTop + y(debt)) / 2 + 10, 'Equity ' + MF(eq), 'sm b up');
      } else {
        s += S.line(rx - cw / 2 - 6, y(ast), rx + cw / 2 + 6, y(ast), 's-ink dash w15');
        s += S.text(rx, y(debt) - 7, compact ? 'Owes more than it owns' : 'Owes more than it owns: equity ' + MF(eq), 'sm b dn', 'middle');
      }
      s += S.text((lx + cw / 2 + rx - cw / 2) / 2, (top + bottom) / 2 + 8, '=', 'xxl ink', 'middle');
      s += S.text(lx, bottom + 18, 'Owns', 'md ink', 'middle') + S.text(rx, bottom + 18, 'Owes + yours', 'md ink', 'middle');
      return s;
    }

    const draw = ui.responsive(fig, (W) => {
      const cur = st.seg(id + '-s') || 'inc';
      root.querySelectorAll('.mc-pane').forEach((p) => { p.hidden = p.dataset.p !== cur; });
      const rev = st.n(id + '-rev'), cost = st.n(id + '-cost'), ast = st.n(id + '-ast'), debt = st.n(id + '-debt'), dep = st.n(id + '-dep'), capex = st.n(id + '-capex');
      const ni = rev - cost, eq = ast - debt, ocf = ni + dep, fcf = ocf - capex;
      const compact = W < 480, H = compact ? 300 : 320, top = 92, bottom = H - 36;
      let b = strip(W, cur, ni, compact);
      if (cur === 'inc') b += waterfall(W, top, bottom, [
        { l: ['Revenue'], v: rev, abs: true, c: 'info' },
        { l: ['Costs'], v: -cost, c: 'dn' },
        { l: ['Net', 'income'], v: ni, abs: true, c: ni >= 0 ? 'up' : 'dn' }], compact, MF);
      else if (cur === 'cf') b += waterfall(W, top, bottom, [
        { l: ['Net', 'income'], v: ni, abs: true, c: ni >= 0 ? 'up' : 'dn' },
        { l: ['Non-cash', 'costs'], v: dep, c: 'info' },
        { l: ['Operating', 'cash'], v: ocf, abs: true, c: ocf >= 0 ? 'up' : 'dn' },
        { l: ['Capex'], v: -capex, c: 'dn' },
        { l: ['Free', 'cash'], v: fcf, abs: true, c: fcf >= 0 ? 'acc' : 'dn' }], compact, MF);
      else b += balance(W, top + 6, bottom, ast, debt, eq, ni, compact);
      const label = cur === 'inc' ? 'Income statement: revenue minus costs equals net income' : cur === 'bal' ? 'Balance sheet: assets equal debt plus equity' : 'Cash flow: net income plus non-cash costs minus capex equals free cash flow';
      fig.innerHTML = S.wrap(W, H, label, b);
      sv(id + '-ni', MF(ni), ni >= 0 ? 'up' : 'dn');
      sv(id + '-pm', F.pct((ni / rev) * 100, 1), ni >= 0 ? '' : 'dn');
      sv(id + '-eq', MF(eq), eq > 0 ? '' : 'dn');
      sv(id + '-de', eq > 0 ? F.num(debt / eq, 2) + '×' : 'n/a', eq > 0 && debt / eq <= 1 ? 'up' : eq > 0 && debt / eq <= 2 ? '' : 'dn');
      sv(id + '-fcf', MF(fcf), fcf >= 0 ? 'acc' : 'dn');
      let m;
      if (cur === 'inc') m = ni >= 0
        ? ui.msg('up', 'Profitable', `Sales of ${MF(rev)} minus costs of ${MF(cost)} leaves ${MF(ni)} of profit. That profit adds to equity and starts the cash flow statement.`)
        : ui.msg('dn', 'Losing money', `Costs beat sales by ${MF(-ni)}. Losses shrink equity, so the company may need to borrow or sell new shares.`);
      else if (cur === 'bal') {
        const de = eq > 0 ? debt / eq : Infinity;
        m = eq <= 0 ? ui.msg('dn', 'Red flag', `It owes ${MF(debt)} but owns only ${MF(ast)}. Equity is below zero, a serious warning sign.`)
          : ui.msg(de <= 1 ? 'up' : de <= 2 ? 'acc' : 'dn', de <= 1 ? 'Healthy' : de <= 2 ? 'Watch debt' : 'Heavy debt', `It owns ${MF(ast)} and owes ${MF(debt)}. The rest, ${MF(eq)}, belongs to shareholders. That's equity.`);
      } else m = fcf >= 0
        ? ui.msg('up', 'Free cash', `Profit of ${MF(ni)} plus ${MF(dep)} of non-cash costs is ${MF(ocf)} of real cash. After ${MF(capex)} of capex, ${MF(fcf)} is free for dividends, buybacks or paying debt.`)
        : ui.msg('dn', 'Burning cash', `After capex the company spent ${MF(-fcf)} more cash than it brought in. It has to cover that with savings, debt or new shares.`);
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     2. earningsLab: beat / miss + guidance -> illustrative gap
     ===================================================================== */
  SML.widgets.earningsLab = function (root) {
    const id = SML.uid('ea');
    const preCl = SML.data.path([[0, 46.8], [4, 47.9], [8, 47.5], [13, 50]], 14, 41, 0.16);
    const pre = SML.data.candles(preCl, 41, { vol: 100 });
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Guidance</span>${ui.seg(id + '-g', [{ v: 'up', label: 'Raised' }, { v: 'flat', label: 'In line' }, { v: 'cut', label: 'Cut' }], 'cut', 'Guidance')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-est', label: 'EPS analysts expected', min: 0.5, max: 2, step: 0.01, value: 1, fmt: 'usd' })}${ui.slider({ id: id + '-act', label: 'EPS the company reported', min: 0.5, max: 2, step: 0.01, value: 1.1, fmt: 'usd' })}${ui.slider({ id: id + '-rev', label: 'Revenue vs expected', min: -10, max: 10, step: 0.5, value: 2, fmt: (v) => F.spct(v, 1) })}</div>
      <div class="wg-read mc-read">${ui.stat('EPS surprise', id + '-es')}${ui.stat('Revenue surprise', id + '-rs')}${ui.stat('Guidance', id + '-gd')}${ui.stat('Next-day move', id + '-mv', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Illustration with a simple made-up model. Real reactions vary a lot and depend on what traders already expected.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const est = st.n(id + '-est'), act = st.n(id + '-act'), rev = st.n(id + '-rev'), g = st.seg(id + '-g') || 'cut';
      const es = ((act - est) / est) * 100;
      const gv = { up: 5, flat: 0, cut: -9 }[g];
      const mv = clamp(clamp(es * 0.35, -8, 8) + rev * 0.45 + gv, -25, 20);
      const last = pre[pre.length - 1].c, open = last * (1 + mv / 100);
      const postCl = SML.data.path([[0, open], [5, open * (1 + (mv / 100) * 0.3)]], 6, 77, 0.32);
      const post = SML.data.candles(postCl, 78, { vol: 160, open: open });
      const H = compact ? 300 : 320;
      let s = '';
      const lx = 78, bmax = compact ? W - lx - 58 : Math.min(300, W * 0.42);
      const bx = SML.lin(0, 2, lx, lx + bmax);
      const ec = es > 0.5 ? 'up' : es < -0.5 ? 'dn' : 'ink';
      [['Expected', est, 'f-shade2', 'ink'], ['Reported', act, es > 0.5 ? 'f-up' : es < -0.5 ? 'f-dn' : 'f-mut', ec]].forEach((r, i) => {
        const yy = 10 + i * 24;
        s += S.text(lx - 8, yy + 11, r[0], 'md ink', 'end') + S.rect(lx, yy, bx(r[1]) - lx, 14, r[2], 3) + S.text(bx(r[1]) + 6, yy + 11, F.usd(r[1]), 'md mono b ' + r[3]);
      });
      if (!compact) s += chip(W - 4, 30, g === 'up' ? 'GUIDANCE RAISED' : g === 'cut' ? 'GUIDANCE CUT' : 'GUIDANCE IN LINE', g === 'up' ? 'up' : g === 'cut' ? 'dn' : 'acc');
      const top = 76, bottom = H - 26;
      const all = pre.concat(post);
      const lo = Math.min(...all.map((k) => k.l)), hi = Math.max(...all.map((k) => k.h)), pad = (hi - lo) * 0.1 + 0.25;
      const y = SML.lin(lo - pad, hi + pad, bottom, top);
      const x0 = 6, x1 = W - 6, slot = (x1 - x0) / 21, bw = clamp(slot * 0.6, 4, 16);
      const xp = (i) => x0 + slot * (i + 0.5), xq = (j) => x0 + slot * (15 + j + 0.5), ex = x0 + slot * 14.5;
      s += S.line(ex, top - 6, ex, bottom + 2, 's-mut dash');
      s += S.text(ex, H - 7, 'Earnings report', 'sm b ink', 'middle');
      s += S.candles(pre, xp, bw, y) + S.candles(post, xq, bw, y);
      const c = mv >= 0 ? 'up' : 'dn';
      s += S.line(xp(13) + bw / 2, y(last), ex, y(last), 's-mut dash') + S.line(ex, y(open), xq(0) - bw / 2, y(open), 's-mut dash');
      s += S.line(ex, y(last), ex, y(open), 's-' + c + ' w3');
      const gl = Math.abs(mv) < 0.3 ? 'Flat open' : F.spct(mv, 1) + ' gap';
      s += S.text(ex + 8, mv >= 0 ? bottom - 8 : top + 14, gl, 'lg b ' + (Math.abs(mv) < 0.3 ? 'ink' : c));
      fig.innerHTML = S.wrap(W, H, `Expected EPS ${F.usd(est)}, reported ${F.usd(act)}, guidance ${g}; the illustrated stock gaps ${F.spct(mv, 1)} the next day`, s);
      sv(id + '-es', F.spct(es, 1), es > 0.5 ? 'up' : es < -0.5 ? 'dn' : '');
      sv(id + '-rs', F.spct(rev, 1), rev > 0 ? 'up' : rev < 0 ? 'dn' : '');
      sv(id + '-gd', g === 'up' ? 'Raised' : g === 'cut' ? 'Cut' : 'In line', g === 'up' ? 'up' : g === 'cut' ? 'dn' : '');
      sv(id + '-mv', F.spct(mv, 1), mv >= 0 ? 'up' : 'dn');
      const beat = es > 1, miss = es < -1;
      let m;
      if (beat && g === 'cut') m = ui.msg('dn', 'Beat, then drop', `Earnings beat by ${F.pct(es, 0)}, but management lowered its forecast. A stock's price is a bet on future profits, so a weaker outlook can outweigh a good quarter.`);
      else if (miss && g === 'up') m = ui.msg('up', 'Miss, then pop', 'The quarter missed, but a raised forecast tells investors the next quarters look better. The future matters more.');
      else if (beat && g === 'up') m = ui.msg('up', 'Beat and raise', 'The best combination: a better quarter than expected and a higher forecast.');
      else if (miss && g === 'cut') m = ui.msg('dn', 'Miss and cut', 'Both the quarter and the outlook disappointed. Big gaps down often follow.');
      else if (beat) m = ui.msg('up', 'Beat', 'A beat with steady guidance often gets a modest lift, unless traders had expected even more.');
      else if (miss) m = ui.msg('dn', 'Miss', 'A miss with steady guidance usually brings a modest drop.');
      else m = ui.msg('acc', 'In line', 'Results matched expectations, so the forecast and revenue drive the reaction.');
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     3. ratioCalc: five numbers with gauges
     ===================================================================== */
  SML.widgets.ratioCalc = function (root) {
    const id = SML.uid('rc');
    const P = { steady: [60, 3.5, 8, 18, 0.6, 3.2], hot: [180, 2.0, 45, 12, 0.3, 1.0], weak: [12, -0.8, -6, -4, 2.4, -0.5] };
    const keys = ['pr', 'eps', 'gr', 'mg', 'de', 'fcf'];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Sample company</span>${ui.seg(id + '-p', [{ v: 'steady', label: 'Steady' }, { v: 'hot', label: 'Hot story' }, { v: 'weak', label: 'Struggling' }], 'steady', 'Sample company')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-pr', label: 'Share price', min: 5, max: 300, step: 1, value: 60, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-eps', label: 'Earnings per share, yearly (EPS)', min: -3, max: 15, step: 0.1, value: 3.5, fmt: 'usd' })}
        ${ui.slider({ id: id + '-gr', label: 'Sales growth per year', min: -20, max: 60, step: 1, value: 8, fmt: (v) => F.spct(v, 0) })}
        ${ui.slider({ id: id + '-mg', label: 'Profit margin', min: -20, max: 40, step: 1, value: 18, fmt: (v) => F.pct(v, 0) })}
        ${ui.slider({ id: id + '-de', label: 'Debt / equity', min: 0, max: 3, step: 0.05, value: 0.6, fmt: (v) => F.num(v, 2) + '×' })}
        ${ui.slider({ id: id + '-fcf', label: 'Free cash flow per share, yearly', min: -5, max: 15, step: 0.1, value: 3.2, fmt: 'usd' })}
      </div>
      <div class="wg-read mc-read">${ui.stat('P/E', id + '-pe')}${ui.stat('Earnings yield', id + '-ey')}${ui.stat('FCF yield', id + '-fy')}${ui.stat('Healthy checks', id + '-sc', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Made-up sample companies and rules of thumb only. Fair values differ by industry, so compare a company with its peers and its own history.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      if (t && t.closest && t.closest('#' + id + '-p')) { const v = P[st.seg(id + '-p')]; if (v) keys.forEach((k, i) => st.set(id + '-' + k, v[i])); }
      else if (t && t.type === 'range') st.setSeg(id + '-p', '');
      draw();
    });
    const KIND = { healthy: 'up', watch: 'acc', weak: 'dn' };
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 520;
      const pr = st.n(id + '-pr'), eps = st.n(id + '-eps'), gr = st.n(id + '-gr'), mg = st.n(id + '-mg'), de = st.n(id + '-de'), fcf = st.n(id + '-fcf');
      const pe = eps > 0 ? pr / eps : null, ey = (eps / pr) * 100, fy = (fcf / pr) * 100;
      const rows = [
        { k: 'P/E', show: pe ? F.num(pe, 1) : 'no profit', val: pe == null ? 60 : pe, st: pe == null ? 'weak' : pe <= 20 ? 'healthy' : pe <= 40 ? 'watch' : 'weak', rule: 'under 20 fair, over 40 pricey', dom: [0, 60], z: [[0, 20, 'up'], [20, 40, 'acc'], [40, 60, 'dn']] },
        { k: 'Sales growth', show: F.spct(gr, 0), val: gr, st: gr >= 10 ? 'healthy' : gr >= 0 ? 'watch' : 'weak', rule: '10% a year or more is strong', dom: [-20, 60], z: [[-20, 0, 'dn'], [0, 10, 'acc'], [10, 60, 'up']] },
        { k: 'Profit margin', show: F.pct(mg, 0), val: mg, st: mg >= 15 ? 'healthy' : mg >= 5 ? 'watch' : 'weak', rule: '15% or more is strong', dom: [-20, 40], z: [[-20, 5, 'dn'], [5, 15, 'acc'], [15, 40, 'up']] },
        { k: 'Debt / equity', show: F.num(de, 2) + '×', val: de, st: de <= 1 ? 'healthy' : de <= 2 ? 'watch' : 'weak', rule: 'under 1× is comfortable', dom: [0, 3], z: [[0, 1, 'up'], [1, 2, 'acc'], [2, 3, 'dn']] },
        { k: 'FCF yield', show: F.pct(fy, 1), val: fy, st: fy >= 4 ? 'healthy' : fy >= 0 ? 'watch' : 'weak', rule: '4% or more is strong', dom: [-10, 15], z: [[-10, 0, 'dn'], [0, 4, 'acc'], [4, 15, 'up']] },
      ];
      const rowH = compact ? 80 : 52, H = 8 + rows.length * rowH;
      let s = '';
      rows.forEach((r, i) => {
        const y0 = 4 + i * rowH; let gx0, gx1, gy;
        if (compact) {
          s += S.text(4, y0 + 15, r.k, 'md b ink') + chip(W - 4, y0 + 16, r.st.toUpperCase(), KIND[r.st]);
          gx0 = 10; gx1 = W - 10; gy = y0 + 42;
          s += S.text(4, y0 + 66, r.rule, 'xs');
        } else {
          s += S.text(4, y0 + 22, r.k, 'md b ink') + S.text(4, y0 + 38, r.rule, 'xs');
          gx0 = 176; gx1 = W - 110; gy = y0 + 28;
          s += chip(W - 4, y0 + 32, r.st.toUpperCase(), KIND[r.st]);
        }
        const x = SML.lin(r.dom[0], r.dom[1], gx0, gx1);
        r.z.forEach((z) => { s += S.rect(x(z[0]), gy - 5, x(z[1]) - x(z[0]), 10, 'f-' + z[2] + '-t'); });
        s += S.rect(gx0, gy - 5, gx1 - gx0, 10, 'nf s-line', 5);
        const mx = x(clamp(r.val, r.dom[0], r.dom[1]));
        s += S.circle(mx, gy, 7, 'f-surf s-ink w2');
        s += S.text(clamp(mx, gx0 + 26, gx1 - 26), gy - 11, r.show, 'sm mono b ink', 'middle');
        if (i < rows.length - 1) s += S.line(4, y0 + rowH - 1, W - 4, y0 + rowH - 1, 's-grid');
      });
      fig.innerHTML = S.wrap(W, H, 'Five gauges: P/E, sales growth, profit margin, debt to equity and free cash flow yield, each marked healthy, watch or weak', s);
      const h = rows.filter((r) => r.st === 'healthy').length, w = rows.filter((r) => r.st === 'weak').length;
      sv(id + '-pe', pe ? F.num(pe, 1) : 'n/a', pe == null ? 'dn' : '');
      sv(id + '-ey', F.pct(ey, 1), ey < 0 ? 'dn' : '');
      sv(id + '-fy', F.pct(fy, 1), fy < 0 ? 'dn' : '');
      sv(id + '-sc', h + ' of 5');
      let m;
      if (pe == null) m = ui.msg('dn', 'No profit', "The company is losing money, so P/E doesn't apply. Check whether sales are growing and how long its cash will last.");
      else if (pe > 40 && gr >= 25) m = ui.msg('acc', 'Priced for growth', 'The price already assumes years of fast growth. If growth slows, high-P/E stocks can fall hard.');
      else if (h >= 4) m = ui.msg('up', 'Strong', `${h} of 5 checks look healthy. Next, compare with similar companies and decide what a fair price would be.`);
      else if (w >= 3) m = ui.msg('dn', 'Weak', `${w} of 5 checks are weak. A low price alone doesn't make this a bargain.`);
      else m = ui.msg('acc', 'Mixed', `${h} healthy, ${5 - h - w} to watch, ${w} weak. Dig into the weak ones before you buy.`);
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     4. capGainsCalc: short vs long-term
     ===================================================================== */
  SML.widgets.capGainsCalc = function (root) {
    const id = SML.uid('cg');
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-d', label: 'Days you have held it', min: 1, max: 730, step: 1, value: 200, fmt: 'days' })}
        ${ui.slider({ id: id + '-g', label: 'Profit if you sell', min: 100, max: 50000, step: 100, value: 5000, fmt: 'usd0' })}
        ${brSelect(id + '-br', 24, 'Your income tax bracket')}
        <div class="fld mc-fseg"><span>Your long-term rate</span>${ui.seg(id + '-lt', [{ v: '0', label: '0%' }, { v: '15', label: '15%' }, { v: '20', label: '20%' }], '15', 'Long-term rate')}</div>
      </div>
      <div class="wg-read mc-read">${ui.stat('Status', id + '-s')}${ui.stat('Tax if sold today', id + '-now')}${ui.stat('Tax as long-term', id + '-lt-v')}${ui.stat('Days to long-term', id + '-left')}${ui.stat('Saved by waiting', id + '-sv', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the marker on the timeline. Simplified federal estimate: ignores state tax, the 3.8% net investment income tax, and how a big gain can push you into a higher bracket. Not tax advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    let xs = null;
    const st = ui.wire(root, () => draw());
    const setDay = (pt) => { if (!xs) return; st.set(id + '-d', Math.round(clamp(xs.inv(pt.x), 1, 730))); draw(); };
    ui.drag(fig, { sel: '.handle,.mc-hit', start: setDay, move: setDay });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const d = st.n(id + '-d'), g = st.n(id + '-g'), br = Number($id(id + '-br').value) || 24, lt = Number(st.seg(id + '-lt') || 15);
      const isLT = d >= 366, stTax = (g * br) / 100, ltTax = (g * lt) / 100, left = Math.max(0, 366 - d);
      const H = compact ? 210 : 190, x0 = 14, x1 = W - 14, ty = 58;
      xs = SML.lin(0, 730, x0, x1);
      let s = '';
      s += S.rect(x0, ty - 7, xs(365) - x0, 14, 'f-dn-t') + S.rect(xs(365), ty - 7, x1 - xs(365), 14, 'f-up-t');
      s += S.text((x0 + xs(365)) / 2, 16, 'SHORT-TERM', 'cap dn', 'middle') + S.text((xs(365) + x1) / 2, 16, 'LONG-TERM', 'cap up', 'middle');
      s += S.line(xs(365), 44, xs(365), 72, 's-ink w15');
      const tk = compact ? [[0, '0'], [365, '1 year'], [730, '2 years']] : [[0, '0'], [182, '6 months'], [365, '1 year'], [547, '18 months'], [730, '2 years']];
      tk.forEach((t) => { s += S.text(xs(t[0]), 88, t[1], 'sm' + (t[0] === 365 ? ' b ink' : ''), t[0] === 0 ? 'start' : t[0] === 730 ? 'end' : 'middle'); });
      s += S.rect(x0, ty - 2, Math.max(0, xs(d) - x0), 4, isLT ? 'f-up' : 'f-dn', 2);
      s += S.rect(x0 - 6, ty - 16, x1 - x0 + 12, 32, 'hit mc-hit');
      s += S.circle(xs(d), ty, 9, 'handle');
      s += S.text(clamp(xs(d), x0 + 30, x1 - 30), 37, 'Day ' + d, 'sm mono b ink', 'middle');
      const maxTax = g * 0.37 || 1;
      const rows = [{ lab: `Short-term at ${br}%`, v: stTax, on: !isLT, c: 'dn' }, { lab: `Long-term at ${lt}%`, v: ltTax, on: isLT, c: 'up' }];
      rows.forEach((r, i) => {
        if (compact) {
          const yy = 114 + i * 50, bwid = Math.max(2, ((x1 - x0 - 70) * r.v) / maxTax);
          s += S.text(x0, yy, r.lab + (r.on ? '  · applies now' : ''), 'md' + (r.on ? ' b ink' : ''));
          s += S.rect(x0, yy + 7, bwid, 18, 'f-' + r.c + (r.on ? '' : ' o35'), 3) + S.text(x0 + bwid + 6, yy + 21, F.usd0(r.v), 'md mono b ink');
        } else {
          const yy = 118 + i * 34, lx = 160, bwid = Math.max(2, ((x1 - lx - 170) * r.v) / maxTax);
          s += S.text(x0, yy + 13, r.lab, 'md' + (r.on ? ' b ink' : ''));
          const vt = F.usd0(r.v);
          s += S.rect(lx, yy, bwid, 18, 'f-' + r.c + (r.on ? '' : ' o35'), 3) + S.text(lx + bwid + 8, yy + 13, vt, 'md mono b ink') + (r.on ? S.text(lx + bwid + 8 + vt.length * 8.2 + 10, yy + 13, 'applies now', 'sm b acc') : '');
        }
      });
      fig.innerHTML = S.wrap(W, H, `Holding timeline: day ${d} of a 2-year line with the 1-year mark; tax ${F.usd0(stTax)} short-term versus ${F.usd0(ltTax)} long-term`, s);
      sv(id + '-s', isLT ? 'Long-term' : 'Short-term', isLT ? 'up' : 'dn');
      sv(id + '-now', F.usd0(isLT ? ltTax : stTax));
      sv(id + '-lt-v', F.usd0(ltTax));
      sv(id + '-left', isLT ? 'Done' : String(left), isLT ? 'up' : '');
      sv(id + '-sv', isLT ? F.usd0(stTax - ltTax) + ' saved' : F.usd0(Math.max(0, stTax - ltTax)), 'acc');
      msgTo(id + '-msg', isLT
        ? ui.msg('up', 'Long-term', `Held more than a year, so the ${F.usd0(g)} gain gets your long-term rate of ${lt}%: about ${F.usd0(ltTax)} instead of ${F.usd0(stTax)}.`)
        : ui.msg('dn', 'Short-term', `Sell now and the ${F.usd0(g)} gain is taxed like salary at ${br}%: about ${F.usd0(stTax)}. Wait ${left} more ${left === 1 ? 'day' : 'days'} and it drops to ${lt}%: about ${F.usd0(ltTax)}.`));
    });
  };

  /* =====================================================================
     5. tlhCalc: tax-loss harvesting
     ===================================================================== */
  SML.widgets.tlhCalc = function (root) {
    const id = SML.uid('tl');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Your gains are</span>${ui.seg(id + '-k', [{ v: 'st', label: 'Short-term' }, { v: 'lt', label: 'Long-term (15%)' }], 'st', 'Gain type')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-g', label: 'Gains you already took this year', min: 0, max: 50000, step: 500, value: 8000, fmt: 'usd0' })}${ui.slider({ id: id + '-l', label: 'Losses you harvest', min: 0, max: 60000, step: 500, value: 12000, fmt: 'usd0' })}${brSelect(id + '-br', 24)}</div>
      <div class="wg-read mc-read">${ui.stat('Net result', id + '-net')}${ui.stat('Gain still taxed', id + '-tx')}${ui.stat('Cuts your income', id + '-ded')}${ui.stat('Carried forward', id + '-cf')}${ui.stat('Est. tax saved', id + '-sv', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">The $3,000 limit is $1,500 if married filing separately. Simplified federal estimate. Not tax advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const G = st.n(id + '-g'), L = st.n(id + '-l'), br = Number($id(id + '-br').value) || 24, k = st.seg(id + '-k') || 'st';
      const net = G - L, offset = Math.min(G, L), taxed = Math.max(0, net), excess = Math.max(0, -net);
      const ded = Math.min(3000, excess), carry = excess - ded, gr = k === 'st' ? br : 15;
      const saved = (offset * gr) / 100 + (ded * br) / 100;
      const steps = [{ l: ['Gains'], v: G, abs: true, c: 'up' }, { l: ['Losses', 'sold'], v: -L, c: 'dn' }];
      if (net >= 0) steps.push({ l: ['Gain', 'taxed'], v: net, abs: true, c: 'acc' });
      else steps.push({ l: ['Net', 'loss'], v: net, abs: true, c: 'dn' }, { l: ['Used vs', 'income'], v: ded, c: 'acc' }, { l: ['Carried', 'forward'], v: -carry, abs: true, c: 'vio' });
      const H = compact ? 270 : 290;
      fig.innerHTML = S.wrap(W, H, `Waterfall: ${F.usd0(G)} of gains minus ${F.usd0(L)} of harvested losses`, waterfall(W, 16, H - 36, steps, compact, F.usd0));
      sv(id + '-net', (net >= 0 ? '+' : '') + F.usd0(net), net >= 0 ? 'up' : 'dn');
      sv(id + '-tx', F.usd0(taxed));
      sv(id + '-ded', F.usd0(ded), ded > 0 ? 'acc' : '');
      sv(id + '-cf', F.usd0(carry), carry > 0 ? 'vio' : '');
      sv(id + '-sv', F.usd0(saved), 'acc');
      let m;
      if (L === 0) m = ui.msg('acc', 'No harvest', `All ${F.usd0(G)} of gains are taxed. Selling positions that are down would cancel part of that.`);
      else if (net >= 0) m = ui.msg('up', 'Gains cut', `Your ${F.usd0(L)} of losses cancel the same amount of gains, so only ${F.usd0(taxed)} is taxed. Estimated saving: ${F.usd0(saved)}.`);
      else if (carry > 0) m = ui.msg('vio', 'Carry forward', `Losses wipe out all gains, ${F.usd0(ded)} cuts your regular income, and ${F.usd0(carry)} carries forward to next year.`);
      else m = ui.msg('up', 'Income cut', `Losses wipe out all gains and the extra ${F.usd0(ded)} cuts your regular income this year.`);
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     6. washSale: 61-day window
     ===================================================================== */
  SML.widgets.washSale = function (root) {
    const id = SML.uid('ws');
    const dayFmt = (v) => (v === 0 ? 'Same day' : v < 0 ? -v + (v === -1 ? ' day' : ' days') + ' before' : v + (v === 1 ? ' day' : ' days') + ' after');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">You buy back</span>${ui.seg(id + '-w', [{ v: 'same', label: 'Same stock' }, { v: 'opt', label: 'Call option on it' }, { v: 'other', label: 'A different company' }], 'same', 'What you buy back')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-d', label: 'When you buy back', min: -40, max: 40, step: 1, value: 12, fmt: dayFmt })}${ui.slider({ id: id + '-l', label: 'Loss when you sold', min: 100, max: 10000, step: 100, value: 2000, fmt: 'usd0' })}${ui.slider({ id: id + '-c', label: 'Cost of the new purchase', min: 1000, max: 20000, step: 500, value: 8000, fmt: 'usd0' })}</div>
      <div class="wg-read mc-read">${ui.stat('Wash sale?', id + '-ws')}${ui.stat('Loss you claim now', id + '-al')}${ui.stat('Added to new basis', id + '-ad')}${ui.stat('New cost basis', id + '-nb', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the rebuy marker. Purchases in an IRA count too. Not tax advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    let xs = null;
    const st = ui.wire(root, () => draw());
    const setDay = (pt) => { if (!xs) return; st.set(id + '-d', Math.round(clamp(xs.inv(pt.x), -40, 40))); draw(); };
    ui.drag(fig, { sel: '.handle,.mc-hit', start: setDay, move: setDay });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const d = st.n(id + '-d'), loss = st.n(id + '-l'), cost = st.n(id + '-c'), what = st.seg(id + '-w') || 'same';
      const inW = Math.abs(d) <= 30, wash = inW && what !== 'other';
      const dis = wash ? loss : 0, basis = cost + dis;
      const H = 160, x0 = 14, x1 = W - 14;
      xs = SML.lin(-40.5, 40.5, x0, x1);
      const cw = (x1 - x0) / 81, gap = cw > 5 ? 0.6 : 0;
      let s = '';
      s += S.text(xs(0), 16, compact ? 'Wash sale window: 61 days' : 'Wash sale window: 30 days before to 30 days after', 'sm b dn', 'middle');
      s += S.line(xs(-30.5), 27, xs(30.5), 27, 's-dn w15') + S.line(xs(-30.5), 27, xs(-30.5), 34, 's-dn w15') + S.line(xs(30.5), 27, xs(30.5), 34, 's-dn w15');
      for (let k = -40; k <= 40; k++) {
        const cls = k === 0 ? 'f-dn' : Math.abs(k) <= 30 ? 'f-dn-t' : 'f-shade2';
        s += S.rect(xs(k - 0.5) + gap, 40, cw - 2 * gap, 28, cls, cw > 6 ? 1.5 : 0);
      }
      s += S.rect(xs(d - 0.5) - 1, 38, cw + 2, 32, 'nf s-ink w2', 2);
      const step = compact ? 20 : 10;
      for (let k = -40; k <= 40; k += step) { if (k === 0) continue; s += S.text(xs(k), 86, k > 0 ? '+' + k : F.minus + -k, 'sm mono', 'middle'); }
      s += S.text(xs(0), 86, 'Sell at a loss', 'sm b dn', 'middle');
      s += S.line(xs(d), 70, xs(d), 110, 's-ink w15');
      s += S.rect(x0 - 6, 36, x1 - x0 + 12, 100, 'hit mc-hit');
      s += S.circle(xs(d), 120, 9, 'handle');
      s += S.text(clamp(xs(d), x0 + 60, x1 - 60), 148, 'Rebuy: ' + dayFmt(d).toLowerCase(), 'sm b ' + (wash ? 'dn' : 'ink'), 'middle');
      fig.innerHTML = S.wrap(W, H, `Calendar from 40 days before to 40 days after a loss sale. The rebuy is ${dayFmt(d).toLowerCase()}, ${inW ? 'inside' : 'outside'} the 61-day window.`, s);
      sv(id + '-ws', wash ? 'Yes' : 'No', wash ? 'dn' : 'up');
      sv(id + '-al', F.usd0(loss - dis), wash ? 'dn' : 'up');
      sv(id + '-ad', F.usd0(dis));
      sv(id + '-nb', F.usd0(basis), 'acc');
      let m;
      if (what === 'other') m = ui.msg('up', 'No wash', "A different company isn't substantially identical, so you keep the loss and stay invested in the market.");
      else if (wash) m = ui.msg('dn', 'Wash sale', `Buying back ${dayFmt(d).toLowerCase()} the sale is inside the window. You can't claim the ${F.usd0(loss)} loss now; it's added to the new cost basis, ${F.usd0(basis)}.`);
      else m = ui.msg('up', 'Clear', `Buying back ${dayFmt(d).toLowerCase()} the sale is outside the 30-day window, so you can claim the full ${F.usd0(loss)} loss.`);
      msgTo(id + '-msg', m);
    });
  };

  /* =====================================================================
     7. orderLadder: market / limit / stop orders on a moving price
     ===================================================================== */
  SML.widgets.orderLadder = function (root) {
    const id = SML.uid('ol');
    const SPREAD = 0.1;
    const NAMES = { mkt: 'Market buy', lbuy: 'Limit buy', lsell: 'Limit sell', stop: 'Stop (sell)' };
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', [{ v: 'mkt', label: 'Market buy' }, { v: 'lbuy', label: 'Limit buy' }, { v: 'lsell', label: 'Limit sell' }, { v: 'stop', label: 'Stop' }], 'lbuy', 'Order type')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-p', label: 'Your order price', min: 48, max: 52, step: 0.05, value: 49.6, fmt: 'usd' })}</div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" data-a="place">Place order (100 shares)</button><button type="button" class="btn btn-g sm" data-a="play">Pause</button><button type="button" class="btn btn-g sm" data-a="step">Next tick</button><button type="button" class="btn btn-g sm" data-a="reset">Reset</button></div>
      <div class="mc-orders" id="${id}-ord"></div>
      <div class="wg-read mc-read">${ui.stat('Bid', id + '-bid')}${ui.stat('Ask', id + '-ask')}${ui.stat('Position', id + '-pos')}${ui.stat('Profit / loss', id + '-pl', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Example stock with a 10-cent spread. Buyers pay the ask, sellers get the bid. Each order is 100 shares; a sell with no shares opens a short.</div>`;
    const fig = root.querySelector('.wg-fig');
    let r, mid, hist, t, orders, pos, drift, msg, timer = null;
    const R2 = (v) => Math.round(v * 100) / 100;
    const bid = () => R2(mid - SPREAD / 2), ask = () => R2(mid + SPREAD / 2);
    function tick(silent) {
      if (r() < 0.07) drift = (r() - 0.5) * 0.06;
      mid = R2(clamp(mid + drift + r.gauss() * 0.075 + (50 - mid) * 0.01, 48.3, 51.7));
      t++; hist.push({ t, p: mid }); if (hist.length > 90) hist.shift();
      if (!silent) check();
    }
    function trade(side, px) {
      const q = side * 100;
      if (pos.sh === 0 || Math.sign(pos.sh) === side) { pos.avg = (pos.avg * Math.abs(pos.sh) + px * 100) / (Math.abs(pos.sh) + 100); pos.sh += q; }
      else { pos.real += 100 * (px - pos.avg) * Math.sign(pos.sh); pos.sh += q; if (pos.sh === 0) pos.avg = 0; }
    }
    function fill(o, px) { o.status = 'filled'; o.fill = R2(px); o.ft = t; trade(o.side, o.fill); }
    function check() {
      orders.forEach((o) => {
        if (o.status !== 'working') return;
        if (o.type === 'lbuy' && ask() <= o.price) { fill(o, Math.min(o.price, ask())); msg = ui.msg('up', 'Filled', `The ask dropped to your price, so your limit buy filled at ${F.usd(o.fill)}.`); }
        else if (o.type === 'lsell' && bid() >= o.price) { fill(o, Math.max(o.price, bid())); msg = ui.msg('up', 'Filled', `The bid rose to your price, so your limit sell filled at ${F.usd(o.fill)}.`); }
        else if (o.type === 'stop' && bid() <= o.price) { fill(o, bid()); const slip = R2(o.price - o.fill); msg = ui.msg('dn', 'Stop hit', `Price reached your stop at ${F.usd(o.price)}. It became a market order and sold at the bid, ${F.usd(o.fill)}${slip > 0.004 ? `: ${F.usd(slip)} of slippage` : ''}.`); }
      });
    }
    function reset() {
      r = SML.rng(2026); mid = 50; hist = []; t = 0; orders = []; pos = { sh: 0, avg: 0, real: 0 }; drift = 0;
      for (let i = 0; i < 70; i++) tick(true);
      msg = ui.msg('info', 'Ready', 'Pick an order type, set your price, then place the order and watch what happens.');
    }
    function place() {
      const type = st.seg(id + '-t') || 'lbuy', price = R2(st.n(id + '-p'));
      if (orders.filter((o) => o.status === 'working').length >= 4) { msg = ui.msg('acc', 'Too many', 'You already have 4 orders waiting. Let some fill or press Reset.'); return; }
      const o = { type, price: type === 'mkt' ? null : price, side: type === 'mkt' || type === 'lbuy' ? 1 : -1, status: 'working', t };
      orders.push(o);
      if (orders.length > 12) { const k = orders.findIndex((x) => x.status !== 'working'); if (k >= 0) orders.splice(k, 1); }
      if (type === 'mkt') { fill(o, ask()); msg = ui.msg('info', 'Filled now', `A market buy fills right away at the ask, ${F.usd(o.fill)}. You paid the spread for speed.`); }
      else if (type === 'lbuy') { if (ask() <= price) { fill(o, ask()); msg = ui.msg('info', 'Filled now', `Your limit was above the ask, so it filled right away at ${F.usd(o.fill)}. A limit only promises your price or better.`); } else msg = ui.msg('acc', 'Waiting', `Limit buy at ${F.usd(price)} is waiting. It fills only if the ask drops to your price, and it may never fill.`); }
      else if (type === 'lsell') { if (bid() >= price) { fill(o, bid()); msg = ui.msg('info', 'Filled now', `Your limit was below the bid, so it sold right away at ${F.usd(o.fill)}.`); } else msg = ui.msg('acc', 'Waiting', `Limit sell at ${F.usd(price)} is waiting for the bid to rise to your price.`); }
      else { if (bid() <= price) { fill(o, bid()); msg = ui.msg('dn', 'Triggered', `Your stop was above the current bid, so it triggered at once and sold at ${F.usd(o.fill)}.`); } else msg = ui.msg('acc', 'Armed', `Stop at ${F.usd(price)} is armed. If the bid falls to it, it sells at market.`); }
    }
    function setPlay(on) {
      if (timer) { clearInterval(timer); timer = null; }
      if (on) timer = setInterval(() => { tick(false); draw(); }, 450);
      const b = root.querySelector('[data-a="play"]'); if (b) b.textContent = on ? 'Pause' : 'Play';
    }
    SML.onCleanup(() => { if (timer) clearInterval(timer); timer = null; });
    reset();
    const st = ui.wire(root, () => draw());
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'place') place();
      else if (a === 'play') setPlay(!timer);
      else if (a === 'step') { tick(false); }
      else if (a === 'reset') reset();
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480, H = compact ? 270 : 300;
      const rp = compact ? 70 : 96, x0 = 8, x1 = W - rp, top = 12, bottom = H - 14;
      const y = SML.lin(48, 52, bottom, top);
      const x = (k) => x0 + (k / 89) * (x1 - x0);
      let s = '', labels = '';
      for (let p = 48; p <= 52; p += 0.5) { s += S.line(x0, y(p), x1, y(p), 's-grid'); if (p > 48 && p < 52) labels += S.rect(x0, y(p) - 6, 40, 12, 'f-paper o70', 2) + S.text(x0 + 3, y(p) + 3.5, '$' + p.toFixed(2), 'xs mono'); }
      const type = st.seg(id + '-t') || 'lbuy', pv = st.n(id + '-p');
      const used = new Set();
      const tag = (yy, txt, c) => { const w = txt.length * 7 + 10; return S.rect(x0 + 50, yy - 17, w, 16, 'f-paper', 3) + S.text(x0 + 55, yy - 5, txt, 'sm b ' + c); };
      orders.filter((o) => o.status === 'working').forEach((o) => {
        const c = o.type === 'lbuy' ? 'info' : o.type === 'lsell' ? 'up' : 'dn';
        s += S.line(x0, y(o.price), x1, y(o.price), 's-' + c + ' dash w15');
        labels += tag(y(o.price), (o.type === 'lbuy' ? 'LIMIT BUY ' : o.type === 'lsell' ? 'LIMIT SELL ' : 'STOP ') + F.usd(o.price), c);
        used.add(o.price);
      });
      if (type !== 'mkt' && !used.has(R2(pv))) {
        s += S.line(x0, y(pv), x1, y(pv), 's-acc dot2 w2');
        labels += tag(y(pv), 'YOUR PRICE ' + F.usd(pv), 'acc');
      }
      const n = hist.length, off = 90 - n;
      s += S.poly(hist.map((h, k) => [x(k + off), y(h.p)]), 's-ink w2') + labels;
      orders.filter((o) => o.status === 'filled').forEach((o) => {
        const k = hist.findIndex((h) => h.t === o.ft); if (k < 0) return;
        const cx = x(k + off), cy = y(o.fill);
        s += S.circle(cx, cy, 8, o.side > 0 ? 'f-info' : 'f-dn') + S.text(cx, cy + 3.8, o.side > 0 ? 'B' : 'S', 'badge', 'middle');
      });
      const lx = x(89), ly = y(mid);
      s += S.rect(lx - 26, y(ask()), 26, Math.max(2, y(bid()) - y(ask())), 'f-acc-t');
      s += S.circle(lx, ly, 4.5, 'f-ink');
      const tx = x1 + 8;
      s += S.rect(tx - 2, ly - 22, rp - 8, 44, 'f-surf s-line', 4);
      s += S.text(tx + 4, ly - 6, (compact ? 'A ' : 'Ask ') + ask().toFixed(2), 'sm mono b dn');
      s += S.text(tx + 4, ly + 13, (compact ? 'B ' : 'Bid ') + bid().toFixed(2), 'sm mono b up');
      fig.innerHTML = S.wrap(W, H, `Price chart around $50 with bid ${bid().toFixed(2)} and ask ${ask().toFixed(2)}, plus your working orders`, s);
      sv(id + '-bid', F.usd(bid()), 'up'); sv(id + '-ask', F.usd(ask()), 'dn');
      sv(id + '-pos', pos.sh === 0 ? 'Flat' : (pos.sh > 0 ? '+' : F.minus) + Math.abs(pos.sh) + ' sh');
      const pl = pos.real + (pos.sh ? pos.sh * ((pos.sh > 0 ? bid() : ask()) - pos.avg) : 0);
      sv(id + '-pl', F.susd(pl), pl > 0.005 ? 'up' : pl < -0.005 ? 'dn' : '');
      const list = orders.slice(-5).reverse();
      $id(id + '-ord').innerHTML = list.length
        ? list.map((o) => `<div class="row"><span class="pill ${o.status === 'filled' ? (o.side > 0 ? 'info' : 'dn') : 'acc'}">${o.status === 'filled' ? 'Filled' : 'Working'}</span><span>${NAMES[o.type]}${o.price != null ? ' at <b>' + F.usd(o.price) + '</b>' : ''}</span><span class="sp"></span><span>${o.status === 'filled' ? 'filled at <b>' + F.usd(o.fill) + '</b>' : 'waiting'}</span></div>`).join('')
        : '<div class="empty">No orders yet. Your orders and their fills will show here.</div>';
      msgTo(id + '-msg', msg);
    });
    if (!SML.reduced()) setPlay(true); else setPlay(false);
  };

  /* =====================================================================
     8. accountRules: cash vs margin, settlement, 2026 rules
     ===================================================================== */
  SML.widgets.accountRules = function (root) {
    const id = SML.uid('ar');
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const stat = (n) => `<div class="stat"><span class="stat-l" id="${id}-l${n}">—</span><span class="stat-v" id="${id}-v${n}">—</span></div>`;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-a', [{ v: 'cash', label: 'Cash account' }, { v: 'margin', label: 'Margin account' }], 'cash', 'Account type')}<span class="grow"></span><span class="pill acc">2026 rules</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-b', label: 'Account balance', min: 500, max: 30000, step: 500, value: 5000, fmt: 'usd0' })}${ui.slider({ id: id + '-sz', label: 'Size of each day trade', min: 500, max: 12000, step: 250, value: 3000, fmt: 'usd0' })}</div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" data-a="trade">Buy and sell today</button><button type="button" class="btn btn-g sm" data-a="next">Next day</button><button type="button" class="btn btn-g sm" data-a="reset">Reset week</button></div>
      <div class="wg-read mc-read">${stat(1)}${stat(2)}${stat(3)}${stat(4)}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">The old rule: with under $25,000, a fourth day trade in five business days flagged you as a pattern day trader. FINRA removed it in 2026. Each round trip here is assumed to break even. Buying power shown as 2× equity is only an example; your broker sets the real number and may add its own limits.</div>`;
    const fig = root.querySelector('.wg-fig');
    let acct, bal, day, settled, pending, days, msg;
    const pend = () => pending.reduce((s, p) => s + p.amt, 0);
    const snap = () => { days[day] = { settled, unsettled: pend(), trades: days[day] ? days[day].trades : 0 }; };
    function resetWeek() {
      acct = st.seg(id + '-a') || 'cash'; bal = st.n(id + '-b'); day = 0; settled = bal; pending = []; days = [];
      snap();
      msg = acct === 'cash'
        ? ui.msg('info', 'Cash account', 'You can day trade as often as you like, but only with settled cash. Sales settle one business day later (T+1).')
        : bal < 2000 ? ui.msg('dn', 'Below $2,000', 'Margin accounts need at least $2,000 in equity. Raise the balance to trade on margin.')
          : ui.msg('info', 'Margin account', 'No day-trade counting anymore. Buying power is checked in real time while you trade.');
    }
    function trade() {
      const T = st.n(id + '-sz');
      if (day > 4) return;
      if (acct === 'cash') {
        const u = pend();
        if (T <= settled + 0.001) { settled -= T; pending.push({ amt: T, day: day + 1 }); days[day].trades++; msg = ui.msg('up', 'Done', `Bought and sold ${F.usd0(T)} today with settled cash. The ${F.usd0(T)} from the sale settles tomorrow (T+1).`); }
        else if (T <= settled + u + 0.001) msg = ui.msg('dn', 'Wait', `Only ${F.usd0(settled)} is settled. Trading with unsettled money in a cash account can cause a good-faith violation. Wait for tomorrow.`);
        else msg = ui.msg('dn', 'Not enough', `This trade needs ${F.usd0(T)} but the account holds ${F.usd0(settled + u)}.`);
      } else {
        if (bal < 2000) msg = ui.msg('dn', 'Below minimum', 'Margin accounts need at least $2,000 in equity, so margin trading is off.');
        else if (T > 2 * bal) msg = ui.msg('dn', 'Too big', `${F.usd0(T)} is more than your buying power of ${F.usd0(2 * bal)}. The order would be rejected, or a margin call would follow.`);
        else { days[day].trades++; const tot = days.reduce((a, d) => a + (d ? d.trades : 0), 0); msg = ui.msg('up', 'Done', `Day trade number ${tot} this week. There's no four-trade limit anymore; buying power is checked in real time.`); }
      }
      snap();
    }
    function nextDay() {
      if (day >= 4) { msg = ui.msg('acc', 'Week over', 'Press Reset week to start again.'); return; }
      day++;
      const due = pending.filter((p) => p.day <= day), amt = due.reduce((s, p) => s + p.amt, 0);
      pending = pending.filter((p) => p.day > day); settled += amt; snap();
      msg = acct === 'cash' && amt > 0 ? ui.msg('info', 'Settled', `${F.usd0(amt)} from yesterday's sales settled overnight and is ready to use.`) : ui.msg('info', DAYS[day], 'A new trading day.');
    }
    const st = ui.wire(root, (e) => { if (!(e && e.target && e.target.id === id + '-sz')) resetWeek(); draw(); });
    resetWeek(); trade();
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      if (b.dataset.a === 'trade') trade(); else if (b.dataset.a === 'next') nextDay(); else resetWeek();
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480, H = 244, x0 = 4, x1 = W - 4, cw = (x1 - x0) / 5, top = 44, bottom = H - 46;
      const cash = acct === 'cash';
      const maxV = cash ? bal : Math.max(2 * bal, 2400);
      const y = SML.lin(0, maxV * 1.14, bottom, top);
      let s = '';
      if (cash) s += S.rect(6, 8, 11, 11, 'f-up', 2) + S.text(22, 18, 'Settled cash', 'sm ink') + S.rect(compact ? 112 : 120, 8, 11, 11, 'f-acc', 2) + S.text(compact ? 128 : 136, 18, compact ? 'Settling (T+1)' : 'Settling tomorrow (T+1)', 'sm ink');
      else s += S.rect(6, 8, 11, 11, 'f-info', 2) + S.text(22, 18, 'Equity', 'sm ink') + S.rect(84, 8, 11, 11, 'nf s-info dash w15', 2) + S.text(100, 18, compact ? 'Buying power (example)' : 'Buying power (example: 2× equity)', 'sm ink');
      for (let d = 0; d < 5; d++) {
        const cx = x0 + cw * (d + 0.5);
        if (d === day) s += S.rect(x0 + cw * d + 2, top - 14, cw - 4, bottom - top + 52, 'f-acc-t', 6);
        s += S.text(cx, bottom + 18, DAYS[d], 'md b ' + (d === day ? 'acc' : 'ink'), 'middle');
        const sn = days[d], bw = Math.min(46, cw * 0.5);
        if (!sn) { const yg = y(cash ? bal : 2 * bal); s += S.rect(cx - bw / 2, yg, bw, bottom - yg, 'nf s-shade2 dash w15', 2); continue; }
        if (cash) {
          const ys = y(sn.settled), yu = y(sn.settled + sn.unsettled);
          if (sn.settled > 0) s += S.rect(cx - bw / 2, ys, bw, bottom - ys, 'f-up', 2);
          if (sn.unsettled > 0) s += S.rect(cx - bw / 2, yu, bw, ys - yu, 'f-acc', 2);
          s += S.text(cx, yu - 6, F.usd0(sn.settled), 'xs mono b ink', 'middle');
        } else {
          const yb = y(2 * bal), ye = y(bal);
          s += S.rect(cx - bw / 2, yb, bw, bottom - yb, 'nf s-info dash w15', 2) + S.rect(cx - bw / 2, ye, bw, bottom - ye, 'f-info', 2);
        }
        s += S.text(cx, bottom + 34, sn.trades + (sn.trades === 1 ? ' trade' : ' trades'), 'sm', 'middle');
      }
      s += S.line(x0, bottom, x1, bottom, 's-mut');
      if (!cash) { const y2 = y(2000); s += S.line(x0, y2, x1, y2, 's-dn dash w15') + S.text(x1 - 2, y2 - 5, '$2,000 minimum', 'sm b dn', 'end'); }
      fig.innerHTML = S.wrap(W, H, cash ? 'Week view of settled and settling cash in a cash account' : 'Week view of equity and example buying power in a margin account, with the $2,000 minimum line', s);
      const tot = days.reduce((a, d) => a + (d ? d.trades : 0), 0);
      const set = (n, l, v, c) => { const e = $id(id + '-l' + n); if (e) e.textContent = l; sv(id + '-v' + n, v, c); };
      set(1, 'Today', DAYS[day]);
      if (cash) { set(2, 'Settled cash', F.usd0(settled), 'up'); set(3, 'Settling', F.usd0(pend()), pend() > 0 ? 'acc' : ''); }
      else { set(2, 'Equity', F.usd0(bal), bal < 2000 ? 'dn' : ''); set(3, 'Buying power', bal < 2000 ? 'None' : F.usd0(2 * bal), bal < 2000 ? 'dn' : 'up'); }
      set(4, 'Day trades this week', String(tot), 'acc');
      msgTo(id + '-msg', msg);
    });
  };

  /* =====================================================================
     9. mindTraps: five scenario cards
     ===================================================================== */
  SML.widgets.mindTraps = function (root) {
    const id = SML.uid('mt');
    const CARDS = [
      {
        name: 'Fear of missing out', urge: '"It\'s flying! Buy now before it goes even higher!"',
        a: [[0, 50], [12, 50.3], [17, 50.7], [21, 52.6], [25, 54.1], [27, 54.25]], n: 28, seed: 11,
        lines: [{ p: 50.9, label: 'Breakout', cls: 's-acc', lc: 'sm b acc' }],
        ann: (c) => S.text(c.x0 + 4, c.top + 12, 'Ran +8% without you', 'md b up') + S.circle(c.xf(27), c.y(c.d[27].c), 6, 'nf s-acc w2'),
        choices: [
          { t: 'Buy at market right now', ok: false, fb: 'You would buy far above the breakout level, so a sensible stop is a long way down and the risk is huge.' },
          { t: 'Wait for a pullback to a level, or skip it', ok: true, fb: 'Right. There will be another setup. Chasing a move that already left means bad entries and big stops.' },
          { t: 'Buy double size to make up for missing it', ok: false, fb: 'Doubling size on the worst entry of the day is how small mistakes become big losses.' }],
        rule: 'No setup, no trade. Missing a move costs nothing.',
      },
      {
        name: 'Revenge trading', urge: '"You just lost $300. Win it back right now."',
        a: [[0, 40], [6, 40.55], [10, 40.35], [13, 39.75], [17, 39.35], [22, 39.7]], n: 23, seed: 12,
        lines: [{ p: 40.5, label: 'Entry', cls: 's-ink', lc: 'sm b ink' }, { p: 39.9, label: 'Stop hit', cls: 's-dn', lc: 'sm b dn' }],
        ann: (c) => S.text(c.x0 + 4, c.bottom - 6, 'Stopped out: −$300', 'md b dn'),
        choices: [
          { t: 'Take the next trade at twice the size', ok: false, fb: 'Bigger size while upset is the classic revenge trade. One more loss and the day is ruined.' },
          { t: 'Short the same stock because it owes you', ok: false, fb: 'The stock owes you nothing. A new trade needs its own setup, not a grudge.' },
          { t: 'Step away 15 minutes and check your daily loss limit', ok: true, fb: 'Right. A short break resets your head, and the daily limit decides if you are done for today.' }],
        rule: 'After a loss, pause. Respect your daily loss limit.',
      },
      {
        name: 'Moving the stop', urge: '"It\'ll bounce. Just move the stop a little lower."',
        a: [[0, 30], [7, 30.6], [13, 30.15], [19, 29.7], [23, 29.5]], n: 24, seed: 13,
        lines: [{ p: 30.5, label: 'Entry', cls: 's-ink', lc: 'sm b ink' }, { p: 29.4, label: 'Stop', cls: 's-dn', lc: 'sm b dn' }, { p: 28.8, label: 'Lower stop?', cls: 's-acc', lc: 'sm b acc' }],
        ann: () => '',
        choices: [
          { t: 'Let the stop do its job', ok: true, fb: 'Right. You chose that stop with a clear head. A planned 1R loss is part of the business.' },
          { t: 'Move the stop lower to give it room', ok: false, fb: 'Moving the stop turns a planned 1R loss into 1.5R, then 2R. That habit drains accounts.' },
          { t: 'Remove the stop and hope', ok: false, fb: 'Hope is not a plan. Without a stop one bad trade can erase weeks of wins.' }],
        rule: 'Never move a stop further away from your entry.',
      },
      {
        name: 'Overtrading', urge: '"Nothing has set up for an hour. I\'m bored. Let\'s find something."',
        a: [[0, 22], [39, 22.05]], n: 40, seed: 14, noise: 0.07,
        lines: [{ p: 22.0, label: 'VWAP', cls: 's-info', lc: 'sm b info' }],
        ann: (c) => S.rect(c.xf(4), c.top, c.xf(36) - c.xf(4), c.bottom - c.top, 'f-shade o50', 4) + S.text((c.xf(4) + c.xf(36)) / 2, c.top + 14, 'Midday chop: no clean setup', 'md b ink', 'middle'),
        choices: [
          { t: 'Take a small trade just to be in the market', ok: false, fb: 'Small boredom trades still cost money, and they usually lead to bigger ones.' },
          { t: 'Close the platform until your next trading window', ok: true, fb: 'Right. Sitting out choppy hours is a skill. Your best setups come at the open and near the close.' },
          { t: 'Loosen your rules a bit to find something', ok: false, fb: 'Your rules exist for days like this. Loosening them means taking the trades your journal says lose.' }],
        rule: 'Boredom is not a signal. Fewer, better trades.',
      },
      {
        name: 'Cutting winners early', urge: '"You\'re up! Grab it before it disappears!"',
        a: [[0, 59.7], [5, 60.0], [11, 60.3], [15, 60.65], [19, 60.5]], n: 20, seed: 15, noise: 0.06,
        lines: [{ p: 61.0, label: 'Target +2R', cls: 's-up', lc: 'sm b up' }, { p: 60.0, label: 'Entry', cls: 's-ink', lc: 'sm b ink' }, { p: 59.5, label: 'Stop', cls: 's-dn', lc: 'sm b dn' }],
        ann: (c) => S.circle(c.xf(19), c.y(c.d[19].c), 6, 'nf s-acc w2') + S.text(c.xf(19) - 10, c.y(c.d[19].c) - 12, 'Now +1R', 'md b acc', 'end'),
        choices: [
          { t: 'Sell everything now at +1R', ok: false, fb: 'If you always cut winners at 1R but take full 1R losses, you need to win far more than half the time just to break even.' },
          { t: 'Move the target way higher', ok: false, fb: 'Changing the plan mid-trade out of greed is the mirror image of fear. Stick to what you planned.' },
          { t: 'Follow the plan: hold for the target, maybe trail the stop', ok: true, fb: 'Right. Let the plan work. You can raise the stop to breakeven, but give the trade room to reach 2R.' }],
        rule: 'Follow your exit plan for winners, too.',
      },
    ];
    let cur = 0, ans = CARDS.map(() => null);
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title" id="${id}-name"></span><span class="grow"></span><span class="mc-dots" id="${id}-dots"></span><span class="pill acc" id="${id}-score"></span></div>
      <div class="wg-fig"></div>
      <div class="mc-mt"><p class="mc-urge" id="${id}-urge"></p><div class="quiz-opts" id="${id}-opts"></div><div id="${id}-fb"></div></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" data-a="prev">Previous</button><button type="button" class="btn btn-p sm" data-a="next">Next situation</button><button type="button" class="btn btn-g sm" data-a="restart">Start over</button></div>`;
    const fig = root.querySelector('.wg-fig');
    const charts = CARDS.map((c) => { const cl = SML.data.path(c.a, c.n, c.seed, c.noise == null ? 0.1 : c.noise); return SML.data.candles(cl, c.seed, { wick: 0.18 }); });
    function render() {
      const c = CARDS[cur], a = ans[cur];
      $id(id + '-name').textContent = `Situation ${cur + 1} of ${CARDS.length}: ${c.name}`;
      $id(id + '-dots').innerHTML = CARDS.map((_, i) => `<i class="${ans[i] == null ? '' : CARDS[i].choices[ans[i]].ok ? 'ok' : 'no'}${i === cur ? ' cur' : ''}"></i>`).join('');
      const score = ans.filter((v, i) => v != null && CARDS[i].choices[v].ok).length, done = ans.filter((v) => v != null).length;
      $id(id + '-score').textContent = `Score ${score} / ${CARDS.length}`;
      $id(id + '-urge').textContent = c.urge;
      $id(id + '-opts').innerHTML = c.choices.map((ch, i) => {
        let cls = 'qopt';
        if (a != null) { if (ch.ok) cls += ' right'; else if (i === a) cls += ' wrong'; }
        return `<button type="button" class="${cls}" data-i="${i}"${a != null ? ' disabled' : ''}><span class="k">${'ABC'[i]}</span><span>${ch.t}</span></button>`;
      }).join('');
      const fb = $id(id + '-fb');
      if (a != null) { const ch = c.choices[a]; fb.innerHTML = `<p class="quiz-why${ch.ok ? '' : ' no'}">${ch.fb}</p>`; }
      else fb.innerHTML = '';
      let m;
      if (done === CARDS.length) m = ui.msg(score >= 4 ? 'up' : score >= 2 ? 'acc' : 'dn', 'Finished', `Discipline score ${score} of ${CARDS.length}. ${score === CARDS.length ? 'Every urge handled. Now do it with real money on the line.' : 'Write the rules you missed on a sticky note next to your screen.'}`);
      else if (a != null) m = ui.msg('info', 'Rule', c.rule);
      else m = ui.msg('acc', 'Your move', 'What would you do? Pick one.');
      msgTo(id + '-msg', m);
      root.querySelector('[data-a="prev"]').disabled = cur === 0;
      root.querySelector('[data-a="next"]').disabled = cur === CARDS.length - 1;
      redraw();
    }
    root.querySelector('.mc-mt').addEventListener('click', (e) => {
      const b = e.target.closest('.qopt'); if (!b || b.disabled) return;
      ans[cur] = Number(b.dataset.i); render();
    });
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b || b.disabled) return;
      const a = b.dataset.a;
      if (a === 'prev') cur = Math.max(0, cur - 1);
      else if (a === 'next') cur = Math.min(CARDS.length - 1, cur + 1);
      else { cur = 0; ans = CARDS.map(() => null); }
      render();
    });
    const redraw = ui.responsive(fig, (W) => {
      const c = CARDS[cur], d = charts[cur], compact = W < 480;
      const H = compact ? 210 : 230, rp = compact ? 82 : 96, x0 = 6, x1 = W - rp, top = 12, bottom = H - 12;
      const ps = d.map((k) => k.l).concat(d.map((k) => k.h)).concat(c.lines.map((l) => l.p));
      const lo = Math.min(...ps), hi = Math.max(...ps), pad = (hi - lo) * 0.15 + 0.05;
      const y = SML.lin(lo - pad, hi + pad, bottom, top);
      const slot = (x1 - x0) / c.n, xf = (i) => x0 + slot * (i + 0.5), bw = clamp(slot * 0.62, 3, 14);
      const ctx = { x0, x1, top, bottom, y, xf, d, W, H };
      let s = c.ann(ctx);
      c.lines.forEach((l) => { s += S.level(y(l.p), x0, x1, l.label, l.cls, l.lc); });
      s += S.candles(d, xf, bw, y);
      fig.innerHTML = S.wrap(W, H, `${c.name}: example chart`, s);
    });
    render();
  };

  /* =====================================================================
     10. journalLab: editable trade journal in R
     ===================================================================== */
  SML.widgets.journalLab = function (root) {
    const id = SML.uid('jl');
    const EX = [
      { s: 'PMH break + retest', e: 50.0, st: 49.5, x: 51.1, sh: 200 },
      { s: 'VWAP reclaim', e: 32.4, st: 32.0, x: 32.0, sh: 250 },
      { s: 'PDH breakout', e: 18.2, st: 17.95, x: 18.7, sh: 400 },
      { s: 'Fake breakout short', e: 40.0, st: 40.4, x: 39.4, sh: 250 },
      { s: 'Chased the open', e: 25.0, st: 24.6, x: 24.4, sh: 250 },
      { s: 'Midday chop', e: 61.2, st: 60.9, x: 61.05, sh: 300 },
    ];
    const copyEx = () => EX.map((r) => Object.assign({}, r));
    let rows = SML.store.get('journal-rows', null);
    if (!Array.isArray(rows) || !rows.length) rows = copyEx();
    const save = () => SML.store.set('journal-rows', rows);
    const calc = (r) => {
      const e = Number(r.e), stp = Number(r.st), x = Number(r.x), sh = Number(r.sh);
      if (![e, stp, x].every((v) => isFinite(v) && v > 0) || e === stp) return null;
      const sign = e > stp ? 1 : -1, risk = Math.abs(e - stp), R = (sign * (x - e)) / risk;
      return { risk, R, pl: isFinite(sh) && sh > 0 ? sign * (x - e) * sh : null };
    };
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-read mc-read">${ui.stat('Trades', id + '-n')}${ui.stat('Win rate', id + '-wr')}${ui.stat('Avg win', id + '-aw')}${ui.stat('Avg loss', id + '-al')}${ui.stat('Expectancy', id + '-ex', 'hl')}${ui.stat('Total', id + '-tot')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="mc-jt scroll"><table class="sheet"><thead><tr><th class="rn">#</th><th>Setup</th><th>Entry</th><th>Stop</th><th>Exit</th><th>Shares</th><th>Risk / sh</th><th>R</th><th>P/L</th><th><span class="sr">Remove</span></th></tr></thead><tbody id="${id}-tb"></tbody></table></div>
      <div class="wg-actions"><button type="button" class="btn btn-a sm" data-a="add">Add trade</button><button type="button" class="btn btn-g sm" data-a="copy">Copy as table</button><button type="button" class="btn btn-g sm" data-a="reset">Reset examples</button></div>
      <div class="wg-note">Example trades with made-up prices. Type over them with your own; edits stay in this browser. Short trades work too: put the stop above the entry.</div>`;
    const fig = root.querySelector('.wg-fig'), tb = $id(id + '-tb');
    const inp = (i, k, v, cls) => `<td${cls ? ` class="${cls}"` : ''}><input type="${k === 's' ? 'text' : 'number'}" ${k === 's' ? '' : 'step="any" inputmode="decimal" '}id="${id}-${i}-${k}" data-r="${i}" data-k="${k}" value="${SML.esc(v)}" aria-label="Trade ${i + 1} ${({ s: 'setup', e: 'entry', st: 'stop', x: 'exit', sh: 'shares' })[k]}"></td>`;
    function buildRows() {
      tb.innerHTML = rows.map((r, i) => `<tr><th class="rn">${i + 1}</th>${inp(i, 's', r.s, 'setup')}${inp(i, 'e', r.e)}${inp(i, 'st', r.st)}${inp(i, 'x', r.x)}${inp(i, 'sh', r.sh)}<td class="calc" id="${id}-${i}-rk"></td><td class="calc" id="${id}-${i}-r"></td><td class="calc" id="${id}-${i}-pl"></td><td><button type="button" class="mc-del" data-del="${i}" aria-label="Remove trade ${i + 1}">×</button></td></tr>`).join('');
    }
    tb.addEventListener('input', (e) => {
      const t = e.target; if (!t.dataset || t.dataset.r == null) return;
      const r = rows[Number(t.dataset.r)]; if (!r) return;
      r[t.dataset.k] = t.dataset.k === 's' ? t.value : t.value === '' ? '' : Number(t.value);
      save(); update();
    });
    tb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      rows.splice(Number(b.dataset.del), 1); save(); buildRows(); update();
    });
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'add') {
        if (rows.length >= 30) { SML.toast('This demo journal holds up to 30 trades.'); return; }
        rows.push({ s: 'New trade', e: 20, st: 19.5, x: 21, sh: 100 }); save(); buildRows(); update();
        const f = $id(`${id}-${rows.length - 1}-s`); if (f) f.focus();
      } else if (a === 'reset') { rows = copyEx(); save(); buildRows(); update(); }
      else {
        const head = ['Setup', 'Entry', 'Stop', 'Exit', 'Shares', 'Risk per share', 'R', 'P/L'];
        const lines = rows.map((r) => { const c = calc(r); return [r.s, r.e, r.st, r.x, r.sh, c ? c.risk.toFixed(2) : '', c ? c.R.toFixed(2) : '', c && c.pl != null ? c.pl.toFixed(2) : ''].join('\t'); });
        SML.copy([head.join('\t')].concat(lines).join('\n'), 'Copied. Paste into Google Sheets or Excel.');
      }
    });
    let stats = { Rs: [] };
    function update() {
      const Rs = [];
      rows.forEach((r, i) => {
        const c = calc(r);
        const rk = $id(`${id}-${i}-rk`), rr = $id(`${id}-${i}-r`), pl = $id(`${id}-${i}-pl`);
        if (!rk) return;
        rk.textContent = c ? F.usd(c.risk) : '—';
        rr.textContent = c ? F.R(c.R, 2) : '—'; rr.className = 'calc' + (c ? (c.R > 0 ? ' up' : c.R < 0 ? ' dn' : '') : '');
        pl.textContent = c && c.pl != null ? F.susd(c.pl) : '—'; pl.className = 'calc' + (c && c.pl != null ? (c.pl > 0 ? ' up' : c.pl < 0 ? ' dn' : '') : '');
        if (c) Rs.push(c.R);
      });
      const wins = Rs.filter((v) => v > 0), losses = Rs.filter((v) => v < 0);
      const mean = Rs.length ? Rs.reduce((a, b) => a + b, 0) / Rs.length : 0, tot = Rs.reduce((a, b) => a + b, 0);
      sv(id + '-n', String(Rs.length));
      sv(id + '-wr', Rs.length ? F.pct((wins.length / Rs.length) * 100, 0) : '—');
      sv(id + '-aw', wins.length ? F.R(wins.reduce((a, b) => a + b, 0) / wins.length, 2) : '—', 'up');
      sv(id + '-al', losses.length ? F.R(losses.reduce((a, b) => a + b, 0) / losses.length, 2) : '—', 'dn');
      sv(id + '-ex', Rs.length ? F.R(mean, 2) : '—', mean > 0 ? 'up' : mean < 0 ? 'dn' : '');
      sv(id + '-tot', Rs.length ? F.R(tot, 1) : '—', tot > 0 ? 'up' : tot < 0 ? 'dn' : '');
      let m;
      if (Rs.length < 3) m = ui.msg('acc', 'Too few', 'Log at least 20 to 30 trades before you trust these numbers.');
      else if (mean > 0) m = ui.msg('up', 'Positive edge', `Each trade makes ${F.R(mean, 2)} on average. You win ${F.pct((wins.length / Rs.length) * 100, 0)} of the time${(wins.length && losses.length && wins.reduce((a, b) => a + b, 0) / wins.length > -losses.reduce((a, b) => a + b, 0) / losses.length) ? ' and your average win is bigger than your average loss' : ', often enough to cover your losses'}. Keep logging to see if it holds.`);
      else m = ui.msg('dn', 'Negative edge', `Each trade loses ${F.num(-mean, 2)}R on average. Find the setups that lose most and cut them.`);
      msgTo(id + '-msg', m);
      stats = { Rs };
      redraw();
    }
    const redraw = ui.responsive(fig, (W) => {
      const Rs = stats.Rs, compact = W < 480, H = compact ? 190 : 210, x0 = compact ? 30 : 36, x1 = W - (compact ? 70 : 92), top = 16, bottom = H - 24;
      let s = '';
      if (!Rs.length) { fig.innerHTML = S.wrap(W, H, 'No trades yet', S.text(W / 2, H / 2, 'Add a trade to draw your R curve', 'md', 'middle')); return; }
      const cum = []; Rs.reduce((a, v) => { cum.push(a + v); return a + v; }, 0);
      const lo = Math.min(0, ...Rs, ...cum), hi = Math.max(0, ...Rs, ...cum), pad = (hi - lo) * 0.12 + 0.3;
      const y = SML.lin(lo - pad, hi + pad, bottom, top);
      const n = Rs.length, slot = (x1 - x0) / n, xf = (i) => x0 + slot * (i + 0.5), bw = clamp(slot * 0.45, 4, 28);
      SML.ticks(lo - pad, hi + pad, 5).forEach((v) => { s += S.line(x0, y(v), x1, y(v), 's-grid') + S.text(x0 - 6, y(v) + 4, (v > 0 ? '+' : v < 0 ? F.minus : '') + Math.abs(v) + 'R', 'xs mono', 'end'); });
      s += S.line(x0, y(0), x1, y(0), 's-mut');
      Rs.forEach((v, i) => { const yt = y(Math.max(0, v)), yb = y(Math.min(0, v)); s += S.rect(xf(i) - bw / 2, yt, bw, Math.max(1.5, yb - yt), (v >= 0 ? 'f-up' : 'f-dn') + ' o50', 2); if (slot >= 22) s += S.text(xf(i), H - 8, '#' + (i + 1), 'xs mono', 'middle'); });
      const pts = cum.map((v, i) => [xf(i), y(v)]);
      s += S.poly([[xf(0) - slot / 2, y(0)]].concat(pts), 's-acc w25');
      pts.forEach((p) => { s += S.circle(p[0], p[1], 3.5, 'f-acc'); });
      const last = pts[pts.length - 1], tot = cum[cum.length - 1];
      s += S.text(last[0] + 10, last[1] + 4, (compact ? '' : 'Total ') + F.R(tot, 1), 'md b ' + (tot >= 0 ? 'acc' : 'dn'));
      fig.innerHTML = S.wrap(W, H, `Bars show each trade's R; the amber line is the running total, ending at ${F.R(tot, 1)}`, s);
    });
    buildRows(); update();
  };

  /* =====================================================================
     11. emotionCycle: the market emotion cycle + a personal tilt meter
     ===================================================================== */
  SML.css(`
    .ec-cards{display:grid;grid-template-columns:1fr;gap:1px;background:var(--line)}
    @media (min-width:720px){.ec-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .ec-cards > div{background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:6px;min-width:0}
    .ec-cards .k{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
    .ec-cards .v{font-size:15px;line-height:1.5;color:var(--ink)}
    .ec-cards .q{font-family:var(--display);font-size:26px;line-height:1;text-transform:uppercase;color:var(--ink)}
    .ec-cards .q.acc{color:var(--accent)} .ec-cards .q.dn{color:var(--down)} .ec-cards .q.up{color:var(--up)}
    .wg-ctrl.ec-row{grid-template-columns:minmax(0,1fr) auto;align-items:end}
    .ec-row .btn{min-width:140px}
    @media (max-width:520px){.wg-ctrl.ec-row{grid-template-columns:1fr}.ec-row .btn{width:100%}}
  `);
  const EC_STAGES = [
    { n: 'Optimism', x: 0.04, p: 36, ph: 'up', side: 'B', crowd: '"This could work."', newb: 'Waits for proof and misses the early, low-risk entries.', pro: 'Follows the plan and buys setups with a defined stop.' },
    { n: 'Excitement', x: 0.13, p: 50, ph: 'acc', side: 'L', crowd: '"I knew it. I am good at this."', newb: 'Checks the app all day and adds to winners with no plan.', pro: 'Raises stops under new higher lows to lock in gains.' },
    { n: 'Thrill', x: 0.22, p: 66, ph: 'acc', side: 'L', crowd: '"Easy money. Tell your friends."', newb: 'Sizes up, borrows on margin, buys more at higher prices.', pro: 'Keeps size steady and takes partial profits at targets.' },
    { n: 'Euphoria', x: 0.31, p: 82, ph: 'acc', side: 'T', crowd: '"I am a genius. This never ends."', newb: 'Goes all in near the top, often with call options.', pro: 'Trims, tightens stops and refuses to chase. This is the point of most risk.' },
    { n: 'Anxiety', x: 0.40, p: 69, ph: 'dn', side: 'B', crowd: '"It is just a pullback."', newb: 'Holds with no stop: "it will come back."', pro: 'Lets the trailing stop decide, with no exceptions.' },
    { n: 'Denial', x: 0.47, p: 73, ph: 'dn', side: 'T', crowd: '"Great company. It will bounce."', newb: 'Averages down on a falling position.', pro: 'Exits when the level breaks. No averaging down without a plan.' },
    { n: 'Fear', x: 0.55, p: 55, ph: 'dn', side: 'R', crowd: '"Maybe I should have sold."', newb: 'Freezes and stops opening the account.', pro: 'Trades small, waits for clean setups in either direction.' },
    { n: 'Panic', x: 0.63, p: 38, ph: 'dn', side: 'R', crowd: '"Get me out at any price!"', newb: 'Sells at market into the steepest part of the drop.', pro: 'Was already out by plan. Watches for climax volume.' },
    { n: 'Capitulation', x: 0.71, p: 23, ph: 'dn', side: 'R', crowd: '"I am never trading again."', newb: 'Dumps everything near the low.', pro: 'Looks for huge volume and a reversal candle at support.' },
    { n: 'Despair', x: 0.79, p: 17, ph: 'dn', side: 'B', crowd: '"The market is rigged."', newb: 'Stays out and misses the start of the recovery.', pro: 'Starts small positions with tight risk. This is the point of most opportunity.' },
    { n: 'Hope', x: 0.88, p: 29, ph: 'up', side: 'L', crowd: '"Maybe it is turning."', newb: 'Does not trust it and keeps waiting.', pro: 'Adds as higher lows form above a rising 48 EMA.' },
    { n: 'Relief', x: 0.96, p: 41, ph: 'up', side: 'L', crowd: '"Phew, back to even."', newb: 'Sells at breakeven just to escape, then watches the trend continue.', pro: 'Holds the trend and trails the stop under higher lows.' },
  ];
  /* dense Catmull-Rom samples through the stage anchors (in 0..1 x, price y) */
  const EC_PTS = (() => {
    const P = [{ x: -0.02, p: 30 }].concat(EC_STAGES.map((s) => ({ x: s.x, p: s.p })), [{ x: 1.02, p: 50 }]);
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < 24; k++) {
        const t = k / 24, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push({ x: f(p0.x, p1.x, p2.x, p3.x), p: f(p0.p, p1.p, p2.p, p3.p) });
      }
    }
    out.push(P[P.length - 1]);
    return out.filter((q) => q.x >= 0 && q.x <= 1);
  })();
  const ecPriceAt = (x) => { for (let i = 1; i < EC_PTS.length; i++) { if (EC_PTS[i].x >= x) { const a = EC_PTS[i - 1], b = EC_PTS[i]; const t = (x - a.x) / ((b.x - a.x) || 1); return a.p + (b.p - a.p) * t; } } return EC_PTS[EC_PTS.length - 1].p; };
  const ecStageAt = (x) => EC_STAGES.reduce((best, s, i) => (Math.abs(s.x - x) < Math.abs(EC_STAGES[best].x - x) ? i : best), 0);

  SML.widgets.emotionCycle = function (root) {
    const id = SML.uid('ec');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">The market emotion cycle</span><span class="grow"></span><span class="pill" id="${id}-ph">Phase</span></div>
      <div class="wg-fig" id="${id}-f1"></div>
      <div class="wg-ctrl ec-row">${ui.slider({ id: id + '-t', label: 'Where is the cycle?', min: 0, max: 100, step: 1, value: 31, fmt: (v) => EC_STAGES[ecStageAt(v / 100)].n })}<button type="button" class="btn sm btn-g" data-a="run">Run the cycle</button></div>
      <div class="ec-cards"><div><span class="k">The crowd feels</span><span class="q" id="${id}-st"></span><span class="v" id="${id}-cr"></span></div><div><span class="k">Beginners tend to</span><span class="v" id="${id}-nb"></span></div><div><span class="k">A disciplined trader</span><span class="v" id="${id}-pr"></span></div></div>
      <div class="wg-bar"><span class="wg-title">Your tilt meter</span><span class="grow"></span><span class="pill" id="${id}-zone">Calm</span></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-l', label: 'Losses in a row', min: 0, max: 6, step: 1, value: 2, fmt: 'num' })}
        ${ui.slider({ id: id + '-s', label: 'Size vs your normal', min: 1, max: 3, step: 0.1, value: 1.2, fmt: (v) => v.toFixed(1) + '×' })}
        ${ui.slider({ id: id + '-m', label: 'Since last trade', min: 0, max: 60, step: 1, value: 12, fmt: (v) => v + ' min' })}
        ${ui.slider({ id: id + '-r', label: 'Rules broken today', min: 0, max: 4, step: 1, value: 0, fmt: 'num' })}
        ${ui.slider({ id: id + '-d', label: 'Daily loss limit used', min: 0, max: 150, step: 5, value: 50, fmt: (v) => v + '%' })}
      </div>
      <div class="wg-fig" id="${id}-f2"></div>
      <div class="wg-read mc-read">${ui.stat('Tilt score', id + '-sc', 'big')}${ui.stat('State', id + '-zs')}${ui.stat('Next trade size', id + '-nx')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">The cycle is a teaching sketch of crowd mood, not a forecast: in real time nobody knows which stage it is. The tilt meter is a simple rule of thumb you can copy into your own plan.</div>`;
    const f1 = $id(id + '-f1'), f2 = $id(id + '-f2');
    let timer = null;
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.id === id + '-t') { if (timer) stop(); drawCycle(); } else drawTilt(); });

    const drawCycle = ui.responsive(f1, (W) => {
      const compact = W < 520;
      const H = Math.round(clamp(W * 0.42, 250, 330));
      const top = 34, bot = 26, x0 = compact ? 8 : 14, x1 = W - (compact ? 8 : 14);
      const xs = SML.lin(0, 1, x0, x1), ys = SML.lin(10, 88, H - bot, top);
      const t = st.n(id + '-t') / 100, si = ecStageAt(t), S0 = EC_STAGES[si];
      let b = '';
      // zone bands: most risk (euphoria) and most opportunity (despair)
      const band = (cx, cls) => S.rect(xs(cx - 0.05), 4, xs(0.1) - xs(0), H - 8, cls, 4, ' opacity=".45"');
      b += band(0.31, 'f-dn-t') + band(0.79, 'f-up-t');
      b += S.text(xs(0.31), H - 8, compact ? 'MOST RISK' : 'MOST RISK', 'cap dn', 'middle');
      b += S.text(xs(0.79), 16, compact ? 'MOST OPPORTUNITY' : 'MOST OPPORTUNITY', 'cap up', 'middle');
      // curve + area
      const pts = EC_PTS.map((q) => [xs(q.x), ys(q.p)]);
      b += S.area(pts, H - bot + 6, 'f-acc-t', ' opacity=".35"');
      // colored segments by phase: rising (up), top (acc), falling (dn)
      const seg = (a, z, cls) => S.poly(EC_PTS.filter((q) => q.x >= a && q.x <= z).map((q) => [xs(q.x), ys(q.p)]), cls);
      b += seg(0, 0.17, 's-up w3') + seg(0.17, 0.35, 's-acc w3') + seg(0.35, 0.8, 's-dn w3') + seg(0.79, 1, 's-up w3');
      // stage dots + labels
      EC_STAGES.forEach((s, i) => {
        const cx = xs(s.x), cy = ys(s.p), cur = i === si;
        b += S.circle(cx, cy, cur ? 5 : 3.2, cur ? 'f-ink' : 'f-mut');
        const show = !compact || cur || ['Euphoria', 'Panic', 'Despair'].indexOf(s.n) >= 0;
        if (!show) return;
        const cls = (compact ? 'xs' : 'sm') + (cur ? ' b ink' : ' mut');
        if (s.side === 'T') b += S.text(cx, cy - 12, s.n, cls, 'middle');
        else if (s.side === 'B') b += S.text(cx, cy + 20, s.n, cls, 'middle');
        else if (s.side === 'L') b += S.text(cx - 9, cy - 4, s.n, cls, 'end');
        else b += S.text(cx + 9, cy - 4, s.n, cls, 'start');
      });
      // marker
      const mx = xs(t), my = ys(ecPriceAt(t));
      b += S.line(mx, top - 10, mx, H - bot + 4, 's-acc dash2');
      b += S.rect(x0, top - 6, x1 - x0, H - bot - top + 12, 'hit');
      b += S.circle(mx, my, 9, 'handle');
      f1.innerHTML = S.wrap(W, H, `Market emotion cycle drawn as a price wave. The marker is at ${S0.n}.`, b);
      $id(id + '-st').textContent = S0.n; $id(id + '-st').className = 'q ' + S0.ph;
      $id(id + '-cr').textContent = S0.crowd; $id(id + '-nb').textContent = S0.newb; $id(id + '-pr').textContent = S0.pro;
      const ph = $id(id + '-ph');
      const zn = si <= 1 ? ['Rising', 'up'] : si <= 3 ? ['Greed', 'acc'] : si <= 7 ? ['Fear', 'dn'] : si <= 9 ? ['Bottom', ''] : ['Recovery', 'up'];
      ph.className = 'pill ' + zn[1]; ph.textContent = zn[0] + ' phase';
    });
    ui.drag(f1, {
      sel: '.handle,.hit',
      start: (p) => moveTo(p.x), move: (p) => moveTo(p.x),
    });
    function moveTo(px) {
      const svg = f1.querySelector('svg'); if (!svg) return;
      const W = Number(svg.getAttribute('width')); const x0 = W < 520 ? 8 : 14; const v = clamp(Math.round(((px - x0) / (W - 2 * x0)) * 100), 0, 100);
      if (timer) stop(); st.set(id + '-t', v); drawCycle();
    }
    const runBtn = root.querySelector('[data-a="run"]');
    function stop() { if (timer) clearInterval(timer); timer = null; runBtn.textContent = 'Run the cycle'; }
    runBtn.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (SML.reduced()) { st.set(id + '-t', 79); drawCycle(); return; }
      let v = st.n(id + '-t'); if (v >= 100) v = 0;
      runBtn.textContent = 'Pause';
      timer = setInterval(() => { v += 1; if (v > 100) { stop(); return; } st.set(id + '-t', v); drawCycle(); }, 90);
    });
    SML.onCleanup(stop);

    function tilt() {
      const L = st.n(id + '-l'), Sz = st.n(id + '-s'), M = st.n(id + '-m'), R = st.n(id + '-r'), D = st.n(id + '-d');
      const parts = [
        { k: L + ' loss' + (L === 1 ? '' : 'es') + ' in a row', v: L * 14 },
        { k: 'trading ' + Sz.toFixed(1) + '× your normal size', v: Math.max(0, (Sz - 1) * 40) },
        { k: 'only ' + M + ' min since the last trade', v: M < 3 ? 20 : M < 10 ? 10 : 0 },
        { k: R + ' rule' + (R === 1 ? '' : 's') + ' broken', v: R * 18 },
        { k: D + '% of your daily loss limit used', v: D * 0.35 },
      ];
      const score = Math.min(100, Math.round(parts.reduce((a, p) => a + p.v, 0)));
      const limit = D >= 100;
      const zone = limit ? 'stop' : score >= 60 ? 'tilt' : score >= 30 ? 'caution' : 'calm';
      return { score, zone, limit, parts: parts.filter((p) => p.v > 0).sort((a, b) => b.v - a.v) };
    }
    const drawTilt = ui.responsive(f2, (W) => {
      const T = tilt();
      const H = 200, cx = W / 2, cy = H - 44, r = Math.min(130, W / 2 - 34);
      const ang = (v) => Math.PI + (v / 100) * Math.PI;
      const pt = (v, rr) => [cx + rr * Math.cos(ang(v)), cy + rr * Math.sin(ang(v))];
      const arc = (a, z, cls) => { const [ax, ay] = pt(a, r), [zx, zy] = pt(z, r); return S.path(`M${ax.toFixed(1)},${ay.toFixed(1)} A${r},${r} 0 0 1 ${zx.toFixed(1)},${zy.toFixed(1)}`, 'nf ' + cls, ' style="stroke-width:16"'); };
      const zi = T.zone === 'calm' ? 0 : T.zone === 'caution' ? 1 : 2;
      let b = arc(0, 29.5, 's-up w4' + (zi === 0 ? '' : ' o35')) + arc(30.5, 59.5, 's-acc w4' + (zi === 1 ? '' : ' o35')) + arc(60.5, 100, 's-dn w4' + (zi === 2 ? '' : ' o35'));
      [0, 30, 60, 100].forEach((v) => { const [a, c] = pt(v, r - 14), [d, e] = pt(v, r + 12); b += S.line(a, c, d, e, 's-line'); });
      const [lx, ly] = pt(0, r + 4), [rx, ry] = pt(100, r + 4);
      b += S.text(lx, ly + 22, 'CALM', 'cap up', 'middle') + S.text(rx, ry + 22, 'TILT', 'cap dn', 'middle');
      const [nx, ny] = pt(T.score, r - 22);
      b += S.line(cx, cy, nx, ny, 's-ink w3') + S.circle(cx, cy, 7, 'f-ink');
      b += S.text(cx, cy + 34, T.score + ' / 100', 'lg mono b ' + (zi === 0 ? 'up' : zi === 1 ? 'acc' : 'dn'), 'middle');
      f2.innerHTML = S.wrap(W, H, `Tilt meter gauge reading ${T.score} out of 100`, b);
      const names = { calm: ['Calm', 'up', 'Normal'], caution: ['Caution', 'acc', 'Half size'], tilt: ['Tilt', 'dn', 'None today'], stop: ['Stop', 'dn', 'None today'] };
      const N = names[T.zone];
      sv(id + '-sc', String(T.score), N[1]); sv(id + '-zs', N[0], N[1]); sv(id + '-nx', N[2], N[1]);
      const z = $id(id + '-zone'); z.className = 'pill ' + N[1]; z.textContent = N[0];
      const why = T.parts.slice(0, 2).map((p) => p.k).join(' and ');
      const msg = T.zone === 'stop' ? ui.msg('dn', 'Stop', 'You have hit your daily loss limit. Close the platform, write one line in your journal and come back tomorrow.')
        : T.zone === 'tilt' ? ui.msg('dn', 'Tilt', `Stop for the day. Biggest factors: ${why}. The best trade right now is no trade.`)
        : T.zone === 'caution' ? ui.msg('acc', 'Caution', `Cut your size in half and take only an A+ setup${why ? `. Watch out for ${why}` : ''}.`)
        : ui.msg('up', 'Calm', why ? `You are in a good state. Keep an eye on ${why}.` : 'Clear head, normal size. Trade your plan.');
      msgTo(id + '-msg', msg);
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const NTA = '<p class="note">General education about US federal rules, not tax advice. Talk to a tax professional about your own situation.</p>';
  SML.lessons.push(
    {
      id: 'l-statements', course: 'fundamentals', order: 1, title: 'The three statements', mins: 6, level: 'Beginner',
      summary: 'Income, balance sheet and cash flow: what each report tells you.',
      idea: 'Three reports answer three questions: did it make money, what does it own and owe, and where did the cash go?',
      widget: 'statementsLab', opts: {},
      try: 'Switch between the three statements and move the sliders. Watch profit flow from one report into the others.',
      body: [
        '<p>Every public company publishes three financial statements each quarter. The <b>income statement</b> shows sales (revenue) minus costs. What is left is profit, also called net income or earnings.</p>',
        '<p>The <b>balance sheet</b> is a snapshot of what the company owns (assets) and what it owes (debt). Whatever is left belongs to shareholders. That part is called equity.</p>',
        '<p>The <b>cash flow statement</b> tracks real money moving in and out. Accounting choices can shape profit, but cash is much harder to fake. <b>Free cash flow</b> is the cash left after paying for new equipment and buildings, called capex.</p>',
        '<p>The three reports connect. Profit adds to equity on the balance sheet, and it is the starting line of the cash flow statement.</p>',
      ],
      example: {
        title: 'Reading DEMO Corp in four steps',
        intro: 'DEMO Corp is a made-up company. All numbers cover one year.',
        steps: [
          'Income statement: revenue of $500M minus all costs of $440M leaves net income of $60M. Profit margin is $60M ÷ $500M = 12%.',
          'Cash flow statement: start from the $60M profit and add back $25M of depreciation, a cost that used no cash this year. Cash from operations is $85M.',
          'Subtract $50M of capex for new equipment. Free cash flow is $85M − $50M = $35M.',
          'Balance sheet: assets of $900M minus debt of $400M leaves equity of $500M. Debt to equity is $400M ÷ $500M = 0.8.',
        ],
        result: 'Profitable, cash positive and moderate debt: a healthy picture worth a closer look.',
      },
      mistakes: [
        'Judging a company by profit alone. A business can report a profit for years while its free cash flow stays negative.',
        'Reading one quarter in isolation. Compare at least four quarters, and the same quarter last year, to see the trend.',
        'Skipping the balance sheet. A company with debt far above its equity can get into trouble fast when sales slow or rates rise.',
      ],
      points: ['Income statement: sales minus costs equals profit.', 'Balance sheet: assets equal debt plus equity.', 'Cash flow: profit plus non-cash costs minus capex equals free cash flow.', 'Healthy companies grow sales, keep debt in check and produce free cash.'],
      quiz: { q: 'A company reports a profit every year, but its free cash flow is always negative. What should you look at first?', options: ['Nothing, profit is all that matters', 'Where the cash goes, such as heavy capex or customers paying late', "The stock's RSI"], answer: 1, why: 'Profit is an accounting number; free cash flow that stays negative means the business keeps needing more money than it brings in.' },
      terms: ['Income statement', 'Balance sheet', 'Cash flow statement', 'Revenue', 'Free cash flow'],
      glossary: [
        { t: 'Capex', d: 'Capital expenditures: money spent on equipment, buildings and other long-term assets.' },
        { t: 'Depreciation', d: 'Spreading the cost of equipment over its useful life. It lowers profit but uses no cash that year.' },
      ],
    },
    {
      id: 'l-earnings', course: 'fundamentals', order: 2, title: 'Earnings reports', mins: 5, level: 'Beginner',
      summary: 'Why stocks jump or drop when a company reports its results.',
      idea: 'A stock reacts to the surprise versus expectations and to the forecast, more than to the raw numbers.',
      widget: 'earningsLab', opts: {},
      try: 'Set the expected and reported EPS, then flip guidance between raised, in line and cut.',
      body: [
        '<p>Four times a year a company reports its results, usually before the market opens or after it closes. The headline number is <b>EPS</b>, earnings per share: profit divided by the number of shares.</p>',
        '<p>Analysts publish estimates ahead of time, so the price already reflects what people expect. A <b>beat</b> means results came in above the estimates; a <b>miss</b> means below.</p>',
        "<p>Management also gives <b>guidance</b>, its forecast for the coming quarter or year. A stock's price is a bet on future profits, so a lower forecast can sink a stock even after a great quarter.</p>",
        '<p>Earnings moves often happen as an overnight gap that jumps straight past your stop. Many short-term traders close positions before earnings or trade smaller.</p>',
      ],
      example: {
        title: 'A beat that still fell',
        intro: 'You hold 100 shares of DEMO at $80 going into earnings, with a stop at $77. You planned to risk $300.',
        steps: [
          'Analysts expect EPS of $1.00. DEMO reports $1.08, a beat of 8%.',
          'Management cuts its full-year guidance by 5%. Traders now expect lower profits next year.',
          'The next morning the stock opens at $73, a gap of −8.75% that skips right past your $77 stop.',
          'Your stop becomes a market order and fills near $73. The loss is $7 a share, or $700 on 100 shares.',
        ],
        result: 'You planned a $300 loss and took $700, about 2.3R, because the gap jumped your stop.',
      },
      mistakes: [
        'Reading only the headline beat or miss. Guidance and revenue often decide which way the stock moves.',
        'Holding a full-size swing trade through earnings. An overnight gap can blow straight past your stop.',
        'Buying options right before the report. Implied volatility drops afterwards (IV crush), so options can lose value even when you guess the direction right.',
        'Forgetting to check the date. Look up the next earnings date before every swing or option trade.',
      ],
      points: ['Price moves on the surprise, not on the number itself.', 'Guidance about the future often outweighs the last quarter.', 'Earnings can gap a stock past your stop loss.', 'Check the earnings date before every swing trade or option trade.'],
      quiz: { q: 'A company beats its EPS estimate but cuts its full-year guidance. What often happens to the stock?', options: ['It always rises because it beat', 'It can fall because the future now looks weaker', "Nothing, guidance doesn't matter"], answer: 1, why: 'Investors price future profits, so a weaker forecast can outweigh one good quarter.' },
      terms: ['EPS', 'Revenue', 'Guidance', 'IV crush', 'Stop loss'],
      glossary: [{ t: 'Gap', d: 'When a stock opens well above or below the last close, skipping the prices in between.' }],
    },
    {
      id: 'l-ratios', course: 'fundamentals', order: 3, title: 'Five numbers to check', mins: 6, level: 'Beginner',
      summary: 'P/E, growth, margins, debt and free cash flow in plain words.',
      idea: 'Five quick numbers show whether a company is growing, profitable, not drowning in debt, and fairly priced.',
      widget: 'ratioCalc', opts: {},
      try: 'Pick a sample company, then move the sliders and watch each gauge and verdict change.',
      body: [
        "<p><b>P/E</b> is the share price divided by yearly earnings per share. It tells you how many years of today's profit you pay for: a P/E of 20 means $20 for each $1 of yearly profit.</p>",
        '<p><b>Sales growth</b> shows whether customers buy more each year. <b>Profit margin</b> is the share of each sales dollar the company keeps as profit.</p>',
        '<p><b>Debt to equity</b> compares what the company owes with what shareholders own. <b>Free cash flow</b> is the cash left after running and investing in the business. Divide it by the price and you get the free cash flow yield.</p>',
        '<p>These are rules of thumb. Fast growers often carry high P/Es and banks normally carry more debt, so compare a company with its peers and with its own past.</p>',
      ],
      example: {
        title: 'Five numbers for DEMO',
        intro: 'DEMO is a made-up company. It trades at $60 and has 60 million shares.',
        steps: [
          'Earnings: net income of $180M ÷ 60M shares = EPS of $3. P/E = $60 ÷ $3 = 20.',
          'Growth: sales rose 12% to $2.0B, so customers are buying more.',
          'Margin: $180M profit ÷ $2.0B sales = 9%. DEMO keeps 9 cents of each sales dollar.',
          'Debt: debt to equity is 0.6, well under the 2× warning line.',
          'Cash: free cash flow of $90M ÷ 60M shares = $1.50 a share. $1.50 ÷ $60 = a 2.5% free cash flow yield.',
        ],
        result: 'Growing, profitable, low debt and cash positive at a P/E of 20. Next step: compare with its peers.',
      },
      mistakes: [
        'Buying because the P/E is low. A shrinking business often looks cheap right before its profits fall further.',
        'Comparing P/Es across industries. A software company and a bank are priced on very different scales.',
        'Judging from a single year. Look at 3 to 5 years of sales, margins and cash flow to see the direction.',
      ],
      points: ['P/E = price ÷ earnings per share. Lower is cheaper, but cheap can be cheap for a reason.', 'Look for growing sales and steady margins.', 'Debt above 2× equity deserves a closer look.', 'Positive, growing free cash flow is a strong sign of a real business.'],
      quiz: { q: 'A stock costs $50 and earned $2.50 per share last year. What is its P/E?', options: ['12.5', '20', '125'], answer: 1, why: '$50 ÷ $2.50 = 20, so you pay $20 for every $1 of yearly profit.' },
      terms: ['P/E', 'EPS', 'Revenue', 'Free cash flow', 'Balance sheet'],
      glossary: [
        { t: 'Profit margin', d: 'Net income divided by revenue: the share of each sales dollar kept as profit.' },
        { t: 'Debt to equity', d: 'Total debt divided by shareholder equity. Above 2 deserves a closer look in most industries.' },
      ],
    },
    {
      id: 'l-cap-gains', course: 'taxes', order: 1, title: 'Short vs long-term gains', mins: 5, level: 'Beginner',
      summary: 'Why holding a winner more than a year can cut your tax bill.',
      idea: 'Hold a winner more than one year and the US taxes the gain at a lower long-term rate.',
      widget: 'capGainsCalc', opts: {},
      try: 'Drag the marker along the timeline and compare the tax if you sell now with the tax after one year.',
      body: [
        '<p>A <b>capital gain</b> is the profit from selling something for more than you paid. You owe tax only when you sell. That is called realizing the gain.</p>',
        "<p>Held one year or less, it's a <b>short-term gain</b>, taxed like your salary at 10% to 37%. Held more than one year, it's a <b>long-term gain</b>, taxed at 0%, 15% or 20% depending on your income.</p>",
        '<p>Day trades, swing trades and most option premium are short-term. Trades inside an IRA or Roth IRA are not taxed each time you sell.</p>',
        NTA,
      ],
      example: {
        title: 'Waiting six weeks to save $360',
        intro: 'You bought 100 shares of DEMO at $50 on March 1, 2025. On January 15, 2026 they trade at $90. Your bracket is 24% and your long-term rate is 15%.',
        steps: [
          'Gain: ($90 − $50) × 100 = $4,000.',
          'Sell today: you have held less than a year, so the gain is short-term. Tax is $4,000 × 24% = $960.',
          'The holding period starts the day after you buy. Selling on March 2, 2026 or later makes the gain long-term.',
          'Sell then at the same price: tax is $4,000 × 15% = $600.',
          'Waiting saves $960 − $600 = $360, as long as the price holds up.',
        ],
        result: 'Weigh the $360 saving against how far the stock could fall in the next six weeks.',
      },
      mistakes: [
        'Selling a few days before the one-year mark. Check the purchase date before you sell a big winner.',
        'Letting tax decide everything. Holding a falling stock to save 9 points of tax can cost far more than the tax.',
        'Forgetting state tax. Most states tax capital gains too, at their own rates.',
      ],
      points: ['Short-term (1 year or less): taxed like income, 10% to 37%.', 'Long-term (more than 1 year): 0%, 15% or 20%.', 'Tax is owed when you sell, not while you hold.', "Retirement accounts like IRAs don't tax each trade."],
      quiz: { q: 'You bought shares 11 months ago and are up $5,000. Your bracket is 24% and your long-term rate is 15%. Roughly how much could waiting past one year save?', options: ['$0', 'About $450', 'About $1,200'], answer: 1, why: '$5,000 × 24% = $1,200 now versus $5,000 × 15% = $750 later, a difference of $450.' },
      terms: ['Capital gain', 'Short-term gain', 'Long-term gain', 'Tax-loss harvesting'],
      glossary: [{ t: 'Holding period', d: 'How long you owned a position, counted from the day after you bought it to the day you sold it.' }],
    },
    {
      id: 'l-tax-loss', course: 'taxes', order: 2, title: 'Tax-loss harvesting', mins: 5, level: 'Beginner',
      summary: 'Use positions that are down to cut the tax on your winners.',
      idea: 'Selling losers cancels out gains, and up to $3,000 of extra loss can reduce your regular income each year.',
      widget: 'tlhCalc', opts: {},
      try: 'Set your gains and harvested losses, then switch between short and long-term gains to compare the tax saved.',
      body: [
        '<p><b>Tax-loss harvesting</b> means selling positions that are down to realize the loss. Realized losses first cancel realized gains, so less of your profit is taxed.</p>',
        '<p>If your losses are bigger than your gains, up to $3,000 a year ($1,500 if married filing separately) can reduce your ordinary income. Anything left over carries forward to future years with no expiry.</p>',
        '<p>Watch the wash sale rule: buy the same stock back within 30 days and the loss is postponed. Many investors switch to a similar but not identical fund to stay invested.</p>',
        NTA,
      ],
      example: {
        title: 'Harvesting $7,500 of losses',
        intro: 'This year you have $6,000 of short-term gains from swing trades and a 24% bracket. Two positions are down: DEMO-A by $4,500 and DEMO-B by $3,000.',
        steps: [
          'Without harvesting, the tax on your gains is $6,000 × 24% = $1,440.',
          'You sell both losing positions and realize $4,500 + $3,000 = $7,500 of losses.',
          'The losses cancel all $6,000 of gains and leave a net loss of $1,500.',
          'That $1,500 is under the $3,000 limit, so it lowers your ordinary income: $1,500 × 24% = $360 less tax.',
          'Total saving this year: $1,440 + $360 = $1,800.',
        ],
        result: 'To stay invested, buy a similar fund that is not identical, and wait at least 31 days before buying DEMO-A or DEMO-B back.',
      },
      mistakes: [
        'Buying the same stock back within 30 days. The wash sale rule postpones the loss you just harvested.',
        'Selling a position you still believe in and never getting back in. Plan the replacement before you sell.',
        'Harvesting inside an IRA or 401(k). Gains and losses there are not taxed, so there is nothing to harvest.',
      ],
      points: ['Losses cancel gains first.', 'Up to $3,000 of net loss a year can offset regular income.', 'Leftover losses carry forward to next year.', "Don't rebuy the same stock within 30 days, or the loss is deferred."],
      quiz: { q: 'You have $5,000 of gains and harvest $9,000 of losses. What happens to the extra $4,000?', options: ["It's lost", '$3,000 reduces your income this year and $1,000 carries forward', 'All $4,000 reduces your income this year'], answer: 1, why: 'Net losses offset up to $3,000 of ordinary income a year; the rest carries forward.' },
      terms: ['Tax-loss harvesting', 'Capital gain', 'Short-term gain', 'Wash sale'],
    },
    {
      id: 'l-wash-sale', course: 'taxes', order: 3, title: 'The wash sale rule', mins: 4, level: 'Beginner',
      summary: 'The 61-day window that can postpone your tax loss.',
      idea: "Buy the same stock within 30 days before or after selling it at a loss, and you can't claim that loss yet.",
      widget: 'washSale', opts: {},
      try: 'Drag the rebuy marker along the calendar and change what you buy back.',
      body: [
        '<p>The <b>wash sale</b> rule stops people from selling just to book a tax loss and then buying right back. The window runs from 30 days before the sale to 30 days after it, 61 days in total.</p>',
        "<p>The loss isn't gone. It's added to the cost basis of the new shares, so you get the benefit when you finally sell them. Buying options on the same stock can count too.</p>",
        "<p>Purchases in your IRA count. A loss washed by an IRA purchase is lost for good, because the IRA shares don't get the higher cost basis.</p>",
        NTA,
      ],
      example: {
        title: 'A rebuy that moved the loss',
        intro: 'You own 100 shares of DEMO that you bought at $50.',
        steps: [
          'November 20: you sell all 100 shares at $40 for a $1,000 loss.',
          'December 5, 15 days later, DEMO looks like it is bouncing and you buy 100 shares back at $42. That is inside the 30-day window.',
          'The $1,000 loss is disallowed for now and added to the new shares: $42 + $10 = a $52 cost basis per share.',
          'In March you sell at $55. Your taxable gain is ($55 − $52) × 100 = $300.',
          'Without the wash sale you would have claimed −$1,000 last year and +$1,300 now. The total is the same $300, but the tax break arrived a year later.',
        ],
        result: 'The loss was delayed. Had you bought the shares back in your IRA, it would be gone for good.',
      },
      mistakes: [
        'Forgetting automatic buys. A dividend reinvestment or auto-invest plan that buys the same stock inside the window washes part of the loss.',
        'Rebuying in your IRA. The loss is disallowed and never added back, so it is lost for good.',
        'Swapping into a near twin. Two funds that track the exact same index are a gray area; one that tracks a different index is safer.',
        'Buying call options on the same stock inside the window. Options can trigger a wash sale too.',
      ],
      points: ['Window: 30 days before to 30 days after a loss sale.', 'The same or a substantially identical security triggers it, options included.', "The disallowed loss is added to the new shares' cost basis.", 'All your accounts count, including IRAs.'],
      quiz: { q: 'You sell a stock at a $1,000 loss on March 10 and buy it back on March 25. What happens?', options: ['You claim the $1,000 loss this year', "The loss is deferred and added to the new shares' cost basis", 'You pay a penalty'], answer: 1, why: "The rebuy is within 30 days, so it's a wash sale and the loss moves into the new shares' basis." },
      terms: ['Wash sale', 'Tax-loss harvesting', 'Capital gain'],
      glossary: [{ t: 'Cost basis', d: 'What you paid for a position, including fees. Your gain or loss is the sale price minus the cost basis.' }],
    },
    {
      id: 'l-orders', course: 'habits', order: 1, title: 'Order types', mins: 5, level: 'Beginner',
      summary: 'Market, limit and stop orders, and when each one fills.',
      idea: 'A market order buys speed, a limit order controls price, and a stop order gets you out when price turns against you.',
      widget: 'orderLadder', opts: {},
      try: 'Pick an order type, set a price, place the order and watch when it fills.',
      body: [
        '<p>Every stock has two prices at once. The <b>bid</b> is the highest price buyers offer; the <b>ask</b> is the lowest price sellers accept. The gap between them is the <b>spread</b>, a small cost you pay on every trade.</p>',
        '<p>A <b>market order</b> fills right away at the best available price: you buy at the ask and sell at the bid. A <b>limit order</b> fills only at your price or better, so it may never fill.</p>',
        '<p>A <b>stop order</b> waits until price reaches your stop, then becomes a market order. It protects you from a bigger loss, but in a fast move it can fill below your stop. That difference is called slippage.</p>',
      ],
      example: {
        title: 'Entry, stop and slippage',
        intro: 'DEMO shows a bid of $25.00 and an ask of $25.05. You plan to buy 200 shares.',
        steps: [
          'A market buy would fill at the ask, $25.05. You place a limit buy at $25.02 instead, and a seller fills it.',
          'Right after the fill you set a stop order at $24.60. Planned risk: ($25.02 − $24.60) × 200 = $84.',
          'Bad news hits and DEMO drops fast. Price touches $24.60 and your stop becomes a market order.',
          'By then the best bid is $24.55, so that is where you fill. Actual loss: ($25.02 − $24.55) × 200 = $94.',
        ],
        result: 'The extra $10 is slippage. Expect a little on every stop, and more on thin or fast-moving stocks.',
      },
      mistakes: [
        'Using market orders on thinly traded stocks. A wide spread can cost more than the risk you planned.',
        'Placing stops at obvious round numbers like $25.00, where many other stops sit. Price often dips there and then reverses.',
        'Assuming a stop guarantees your price. Overnight gaps and fast moves can fill you well below it.',
        'Entering without placing the stop. Put it in right after the fill, while your head is clear.',
      ],
      points: ['Market: fast fill, price not guaranteed.', 'Limit: price guaranteed, fill not guaranteed.', 'Stop: triggers at your price, then fills at market.', 'Place your stop as soon as you enter a trade.'],
      quiz: { q: 'You place a limit buy at $49.50 while the ask is $50.02. When does it fill?', options: ['Immediately at $50.02', 'Only if the ask drops to $49.50 or lower', 'At the close no matter what'], answer: 1, why: 'A limit buy fills only at your price or better.' },
      terms: ['Market order', 'Limit order', 'Stop order', 'Bid-ask spread', 'Slippage', 'Liquidity'],
    },
    {
      id: 'l-pdt', course: 'habits', order: 2, title: 'Day trading rules in 2026', mins: 5, level: 'Beginner',
      summary: 'Cash vs margin accounts now that the $25,000 rule is gone.',
      idea: "The $25,000 pattern day trader rule is gone. Now it's about settled cash in a cash account or $2,000 of equity in a margin account.",
      widget: 'accountRules', opts: {},
      try: 'Switch account types, set a balance, and place day trades through the week.',
      body: [
        "<p>Until 2026, FINRA's pattern day trader rule required $25,000 in a margin account to make more than three day trades in five business days. In 2026 the SEC approved FINRA's change that removed it, and brokers switched over around June.</p>",
        '<p>In a <b>margin account</b> you now need at least $2,000 in equity, and your buying power is checked in real time during the day. Go over it and you get a margin call that you must cover.</p>',
        "<p>In a <b>cash account</b> you can day trade without margin, but only with settled cash. Stock trades settle one business day later (T+1), so money from today's sale is ready to use again tomorrow.</p>",
        "<p>Brokers can still set stricter rules of their own, so read your broker's policy before you start.</p>",
      ],
      example: {
        title: 'A Monday in a $3,000 cash account',
        intro: 'You have $3,000 of settled cash in a cash account.',
        steps: [
          'Monday 9:45: you buy 100 DEMO at $30 with the $3,000 and sell at $30.50 by 10:30. You now hold $3,050 that settles Tuesday.',
          'Monday 11:00: another setup appears. Buying it with the unsettled $3,050 and selling it today would be a good faith violation.',
          'You let it go. On Tuesday the $3,050 is settled and you can trade with all of it again.',
          'So a cash account gives you about one full-size round trip a day. Rack up several violations in 12 months and many brokers restrict you to settled cash for 90 days.',
          'The same $3,000 in a margin account is above the $2,000 minimum, so you could trade several times on Monday. Buying power is checked in real time, and going over it brings a margin call.',
        ],
        result: 'Cash account: slower, no borrowing. Margin account: more flexible, but borrowed money makes losses grow faster.',
      },
      mistakes: [
        'Trading with unsettled cash in a cash account. Repeated good faith violations can get the account restricted.',
        'Treating margin buying power as your own money. Borrowed size makes every loss bigger.',
        "Not reading your broker's rules. Some brokers keep stricter day trading limits than the FINRA minimum.",
      ],
      points: ['The $25,000 PDT rule was removed in 2026.', 'Margin accounts need at least $2,000 in equity.', 'Cash accounts trade with settled cash; sales settle T+1.', 'Your broker may still have its own limits.'],
      quiz: { q: 'In a cash account you buy and sell $3,000 of stock on Monday. When is that $3,000 settled again?', options: ['Immediately', 'Tuesday, one business day later', 'After 30 days'], answer: 1, why: 'Stock trades settle T+1, one business day after the trade.' },
      terms: ['PDT rule', 'Margin account', 'Cash account', 'Settlement', 'Day trading'],
      glossary: [
        { t: 'Good faith violation', d: 'In a cash account, buying with unsettled money and selling before that money settles. Repeat violations can restrict the account.' },
        { t: 'Buying power', d: 'How much you can buy right now: settled cash in a cash account, or cash plus available margin in a margin account.' },
      ],
    },
    {
      id: 'l-psychology', course: 'habits', order: 3, title: 'Trading psychology', mins: 8, level: 'Beginner',
      summary: 'Fear, greed and the thinking traps that make you break your own rules.',
      idea: 'A strategy only works if you follow it. Most account damage comes from broken rules, so build habits that protect you from yourself.',
      widget: 'mindTraps', opts: {},
      try: 'Read each situation, choose what you would do, and build your discipline score.',
      body: [
        '<p>Two traders can use the same strategy and get opposite results. The difference is what they do when money is on the line. Trading pokes at fear and greed all day, and a handful of predictable thinking errors show up in almost everyone.</p>',
        '<h3>Fear and greed</h3>',
        '<p>Greed makes you size up, chase a stock that already ran, or hold a winner past your target hoping for more. Fear makes you skip good setups after a loss, or dump a good trade at the first wiggle. Both feel like smart decisions in the moment.</p>',
        '<h3>The thinking traps</h3>',
        '<ul>' +
          '<li><b>Loss aversion.</b> A loss hurts roughly twice as much as an equal gain feels good. So you hold losers to avoid making the loss real, and you sell winners early to lock in the good feeling.</li>' +
          '<li><b>FOMO.</b> Fear of missing out. A stock is flying, everyone is talking about it, and you buy late, far from any level, with no sensible place for a stop.</li>' +
          '<li><b>Revenge trading.</b> After a loss you want the money back right now, so you take a worse setup at a bigger size.</li>' +
          '<li><b>Overconfidence after a streak.</b> Five winners in a row feel like pure skill. You raise size and loosen your rules right before the normal losing run arrives.</li>' +
          '<li><b>Confirmation bias.</b> You read only the news and posts that agree with your trade and ignore the chart telling you that you are wrong.</li>' +
          '<li><b>Recency bias.</b> The last few trades feel like the whole story. Three losses and you drop a strategy that works over 100 trades.</li>' +
        '</ul>',
        '<h3>Rules do the hard part</h3>',
        '<p>You can\'t switch emotions off, but you can make your decisions before they show up. Write your entry, stop, target and size before you click. Set a daily loss limit. During the session your only job is to follow the plan you made with a clear head. When you feel an urge, name it: saying "this is FOMO" is often enough to slow you down.</p>',
        '<h3>A pre-trade checklist</h3>',
        '<ul>' +
          '<li>Is this one of my setups, at a level I marked before the open?</li>' +
          '<li>Where is my stop, and is the target at least 2R away?</li>' +
          '<li>Does my size risk 1% of the account or less?</li>' +
          '<li>Am I under my daily loss limit, and am I calm?</li>' +
        '</ul>',
        '<p>Any "no" means skip the trade. There is always another one.</p>',
        '<h3>Sleep, stress and size</h3>',
        '<p>Sleep, stress and hunger change how you trade. A tired brain takes more risk and follows fewer rules, so trade smaller or not at all on rough days. Use a size you can sleep with: if a position has you checking your phone at night, it is too big, even when the math says it is fine. The next lesson, <a href="#l-emotions">Fear, greed and tilt</a>, shows how these feelings build over a trend and over a single bad day.</p>',
      ],
      example: {
        title: 'Running the checklist on one trade',
        intro: 'You marked DEMO\'s premarket high at $40.20 before the open. Your account is $10,000 and you risk 1%, or $100, per trade.',
        steps: [
          'Setup: DEMO breaks above $40.20 on strong volume, pulls back and holds the level. That retest is one of your setups.',
          'Plan: entry $40.25 and stop $39.95 under the level, so you risk $0.30 a share. The target of $40.85 is $0.60 away, which is 2R.',
          'Size: $100 ÷ $0.30 = 333 shares. You are under your daily limit and feel calm, so every box is checked.',
          'Before your limit order fills, DEMO spikes to $40.70. FOMO says to buy now at market.',
          'At $40.70 with the same stop you would risk $0.75 to make $0.15. The checklist fails, so you cancel and wait for the next retest.',
        ],
        result: 'Skipping the chase cost nothing. Taking it would have risked 5 times the possible reward.',
      },
      mistakes: [
        'Raising size after a winning streak. Part of the streak was luck, and the next normal losing run now costs twice as much.',
        'Moving the stop "just a little" to give the trade room. A small planned loss becomes a large unplanned one.',
        'Reading only bullish posts about a stock you own. Confirmation bias hides the warning signs on the chart.',
        'Dropping a tested strategy after three losses. Judge a method over 30 or more trades.',
      ],
      points: ['Most account damage comes from broken rules. Follow the plan you wrote with a clear head.', 'Name the urge: FOMO, revenge, overconfidence. Naming it slows you down.', 'Run a pre-trade checklist on every trade. Any "no" means skip.', 'Never move a stop further away, and stop for the day at your loss limit.', 'Trade a size you can sleep with.'],
      quiz: { q: 'You just took a $300 loss. What is the best next step?', options: ['Double the size on the next trade to win it back', 'Pause, check your daily loss limit, and wait for a real setup', 'Short the same stock because it owes you'], answer: 1, why: 'Revenge trading after a loss is one of the fastest ways to turn a small loss into a big one.' },
      terms: ['FOMO', 'Confirmation bias', 'Loss aversion', 'Tilt', 'Stop loss'],
      glossary: [
        { t: 'Revenge trading', d: 'Taking a rushed, often bigger trade to win back a loss right away.' },
        { t: 'Recency bias', d: 'Giving your last few results too much weight compared with the long-run record.' },
      ],
    },
    {
      id: 'l-emotions', course: 'habits', order: 4, title: 'Fear, greed and tilt', mins: 7, level: 'Beginner',
      summary: 'The crowd emotion cycle, and how to notice when you are on tilt.',
      idea: 'Crowds swing from euphoria to panic and back, and so can you inside a single day. Spot the swing early and let rules decide.',
      widget: 'emotionCycle', opts: {},
      try: 'Drag the marker along the wave or press Run the cycle. Then set the tilt meter to match a bad day and see when it tells you to stop.',
      body: [
        '<p>Prices swing further than the businesses behind them because people trade them, and people move in herds. The <b>emotion cycle</b> is a sketch of how the crowd feels as a big trend rises and falls. You can see it in single stocks, in crypto and in the whole market.</p>',
        '<h3>The cycle in four parts</h3>',
        '<ul>' +
          '<li><b>Rising:</b> optimism, then excitement, then thrill. Each gain makes people more sure of themselves.</li>' +
          '<li><b>The top:</b> euphoria. Everyone you know is buying. Risk is highest here, because few buyers are left.</li>' +
          '<li><b>Falling:</b> anxiety, denial, fear and panic. People hold too long, then sell all at once.</li>' +
          '<li><b>The bottom:</b> capitulation and despair, then hope and relief. Once most people have given up, sellers run out and price can turn.</li>' +
        '</ul>',
        '<p>Nobody knows for sure which stage they are in while it happens. The useful part is noticing these feelings in yourself and in the headlines. If you feel like a genius and want to go all in, treat that feeling as a warning sign.</p>',
        '<h3>Tilt: the cycle inside your day</h3>',
        '<p><b>Tilt</b> is a poker word for playing badly because you are upset. In trading it usually starts with a loss or two, then shows up as bigger size, faster trades and broken rules. Each step makes the next mistake more likely.</p>',
        '<p>Watch for the signs: losses in a row, size above normal, jumping into a new trade minutes after the last one, and any broken rule. Two or more at once means stop for the day. A <b>daily loss limit</b>, such as 2% to 3% of the account, is the hard stop that ends the session no matter how you feel.</p>',
        '<h3>Reset routines</h3>',
        '<ul>' +
          '<li>After two losses in a row, stand up and step away for 15 minutes.</li>' +
          '<li>After any broken rule, cut your size in half for the rest of the day.</li>' +
          '<li>At your daily loss limit, close the platform and write one paragraph in your <a href="#l-journal">journal</a>.</li>' +
          "<li>Start the next day at normal size. Don't try to win yesterday back.</li>" +
        '</ul>',
      ],
      example: {
        title: 'How a −$100 day becomes −$650',
        intro: 'Your account is $10,000. You risk $100 per trade and your daily loss limit is 3%, or $300.',
        steps: [
          '9:40: a DEMO breakout fails and you hit your stop. Loss: −$100. Normal, it happens.',
          '9:44: annoyed, you jump into another trade at double size. It stops out for −$200, and you are down $300 for the day.',
          'Tilt check: 2 losses in a row, 2× size, 4 minutes between trades, 1 rule broken and 100% of the daily limit used. The meter says stop.',
          '10:05: you ignore it, take a third trade and move the stop lower when it goes against you. It closes at −$350.',
          'The day ends at −$650, more than twice your limit. Stopping at −$300 would have kept the loss to something one good day can repair.',
        ],
        result: '−$650 is 6.5 normal losses. Stopping at the limit would have cost 3.',
      },
      mistakes: [
        'Buying more as a trend gets exciting and everyone is talking about it. Euphoria is where risk is highest.',
        'Selling everything in a panic after a long drop, often near the low, then missing the recovery.',
        'Treating the daily loss limit as a suggestion. One more "last trade" is how −3% days turn into −10% days.',
        'Coming back the next day at bigger size to make up the loss. That is tilt carried over into a new day.',
      ],
      points: ['Crowds move from optimism to euphoria to panic to despair and back.', 'Peak risk feels like euphoria; peak opportunity feels like despair.', 'Tilt signs: losses in a row, bigger size, rushed trades, broken rules.', 'Set a daily loss limit and stop when you hit it.', 'After a bad day, start the next one at normal size.'],
      quiz: { q: 'You have lost two trades in a row, doubled your size on the second one, and just hit your daily loss limit. What should you do?', options: ['One more trade at normal size to get back to even', 'Stop trading for the day and journal what happened', 'Switch to options to win it back faster'], answer: 1, why: 'Hitting the limit while tilted is when the next trade is most likely to be a bad one. Stop, write it down and start fresh tomorrow.' },
      terms: ['Tilt', 'FOMO', 'Loss aversion', 'Drawdown', 'Position size'],
      glossary: [
        { t: 'Euphoria', d: 'Extreme confidence near a top, when almost everyone expects prices to keep rising.' },
        { t: 'Capitulation', d: 'The point in a fall when many holders give up and sell at once, often on very high volume.' },
        { t: 'Daily loss limit', d: 'A fixed amount you can lose in one day before you stop trading, such as 3% of the account.' },
      ],
    },
    {
      id: 'l-journal', course: 'habits', order: 5, title: 'Keep a journal', mins: 5, level: 'Beginner',
      summary: 'Track every trade in R to find out what actually works.',
      idea: 'Write down every trade in R multiples. After 30 trades the numbers show you whether you have a real edge.',
      widget: 'journalLab', opts: {},
      try: 'Edit the example trades or add your own. The stats and the R curve update as you type.',
      body: [
        "<p>An <b>R multiple</b> measures a trade by the risk you took. If you risked $1 per share and made $2, that's +2R. If you hit your stop, that's −1R. R lets you compare trades of any size.</p>",
        '<p>Your <b>win rate</b> is the share of trades that made money. <b>Expectancy</b> is the average R per trade: above zero means your method makes money over time, below zero means it loses.</p>',
        "<p>Log the setup, entry, stop, exit and size of every trade, plus a screenshot and one lesson. Review every week. Patterns show up fast: maybe your breakouts work and your midday trades don't.</p>",
      ],
      example: {
        title: 'What 10 trades revealed',
        intro: 'You log your last 10 trades in R. Each one risked $100.',
        steps: [
          '4 winners average +2.1R, for +8.4R. 6 losers at −1R each add up to −6R.',
          'Total: +2.4R, or $240. Win rate: 4 ÷ 10 = 40%. Expectancy: +2.4R ÷ 10 = +0.24R per trade.',
          'You tag each trade with the time of entry. 5 of the 6 losers came after 11:00.',
          'Without those 5 trades the other 5 total +2.4R + 5R = +7.4R.',
          'New rule to test: no new trades after 11:00 for the next 20 trades, then review again.',
        ],
        result: 'The journal found a $500 leak that you could not feel while trading.',
      },
      mistakes: [
        'Logging only the good trades. A journal without the losers tells a nice story and teaches you nothing.',
        'Measuring in dollars. Trades of different sizes only compare fairly in R.',
        'Changing everything after a handful of trades. Test one change at a time and review after 20 to 30 more trades.',
        'Skipping the notes. Your mood and the reason for each trade explain patterns the numbers cannot.',
      ],
      points: ['R = (exit − entry) ÷ (entry − stop).', 'Expectancy above 0R per trade means a working method.', 'A 40% win rate can still make money if winners average 2R.', 'Review your journal weekly and cut what loses.'],
      quiz: { q: 'You buy at $20 with a stop at $19.50 and sell at $21. What is the R multiple?', options: ['+1R', '+2R', '+4R'], answer: 1, why: 'You risked $0.50 per share and made $1.00, which is two times your risk.' },
      terms: ['R multiple', 'Win rate', 'Expectancy', 'Stop loss', 'Profit factor'],
    }
  );
})();
