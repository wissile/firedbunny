/* FIRE track, course 1: Your FIRE Number. Widgets: fireFlavors, spendAverager, fireNumber (tool), savingsRate (tool), coastFire. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const usd0 = (v) => F.usd(Math.round(v), 0);
  /* compact dollars: $850K, $1.25M */
  const kd = (v) => {
    if (!isFinite(v)) return '—';
    const a = Math.abs(v), sg = v < 0 ? F.minus : '';
    if (a >= 999500) return sg + '$' + (a / 1e6).toFixed(a >= 9995000 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1000) return sg + '$' + Math.round(a / 1e3) + 'K';
    return sg + '$' + Math.round(a);
  };
  /* years until a balance reaches target: start balance grows at r, plus `save` added at each year end. Fractional by interpolation. */
  function yearsTo(target, start, save, r, cap) {
    cap = cap || 70;
    if (start >= target) return 0;
    let nw = start;
    for (let y = 1; y <= cap; y++) {
      const nx = nw * (1 + r) + save;
      if (nx >= target) return y - 1 + (target - nw) / (nx - nw || 1);
      nw = nx;
    }
    return Infinity;
  }
  /* segment rect with a native tooltip */
  const tseg = (x, y, w, h, cls, tip) => `<g><title>${esc(tip)}</title>${S.rect(x, y, Math.max(0, w), h, cls, 2)}</g>`;
  /* text with a soft background box, for labels that sit on top of lines */
  function tag(x, y, s, cls, anchor, cp) {
    const wpx = s.length * (cp ? 6.1 : 6.6) + 12;
    const bx = anchor === 'end' ? x - wpx + 6 : anchor === 'middle' ? x - wpx / 2 : x - 6;
    return S.rect(bx, y - 13, wpx, 18, 'tipbg', 3) + S.text(x, y, s, cls, anchor);
  }

  SML.css(`
.fn-sub{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 12px;font:600 11px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:-6px}
.fn-sub small{font:500 12px/1.3 var(--mono);letter-spacing:.02em;text-transform:none;color:var(--muted)}
.fn-fields{grid-column:1/-1;display:grid;gap:12px 14px;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));align-items:end}
.fn-st .stat-v small{font:500 12px/1 var(--mono);color:var(--muted);letter-spacing:.04em;margin-left:8px;white-space:nowrap}
.fn-chips{grid-column:1/-1}
.fn-more{background:var(--surface)}
.fn-more>summary{list-style:none;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:6px 14px;padding:14px 18px;cursor:pointer;font:600 11px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
.fn-more>summary::-webkit-details-marker{display:none}
.fn-more>summary span::before{content:'+ '}
.fn-more[open]>summary span::before{content:'− '}
.fn-more>summary small{font:500 12px/1.3 var(--mono);letter-spacing:.02em;text-transform:none;color:var(--muted)}
.fn-more>summary:hover small{color:var(--ink)}
.fn-more[open]>summary{border-bottom:1px solid var(--line)}
.fn-more>summary:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.fn-recipe{margin:10px 4px 0;font:500 12.5px/1.6 var(--mono);color:var(--muted);text-align:center;text-wrap:balance}
.fn-recipe b{color:var(--accent);font-weight:600}
.fn-irr{display:flex;flex-direction:column;padding:4px 18px 14px}
.fn-irr-h,.fn-irr-r{display:grid;grid-template-columns:minmax(0,1fr) 116px 116px;gap:10px;align-items:center}
.fn-irr-h{font:500 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:12px 0 6px}
.fn-irr-h span:not(:first-child){padding-left:2px}
.fn-irr-r{padding:7px 0;border-top:1px solid var(--line)}
.fn-irr-r label.nm{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.35;color:var(--ink);min-width:0;cursor:pointer}
.fn-irr-r input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent);flex:0 0 auto;margin:0}
.fn-irr-r.off label.nm{color:var(--muted)}
.fn-irr-r.off input[type=number],.fn-irr-r.off select{opacity:.45}
.fn-irr input[type=number],.fn-irr select{width:100%;min-width:0;min-height:36px;background:var(--bg);border:1px solid var(--input);border-radius:6px;color:var(--ink);font:500 13px var(--mono);padding:0 8px}
.fn-irr input:focus-visible,.fn-irr select:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.fn-irr-r .per{font:500 11px var(--mono);color:var(--muted);grid-column:2/-1;margin-top:-2px}
@media (max-width:520px){.fn-irr{padding:4px 14px 12px}.fn-irr-h{display:none}.fn-irr-r{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fn-irr-r label.nm{grid-column:1/-1}.fn-irr-r .per{grid-column:1/-1}}
.fn-mo{padding:11px 16px;font:500 12.5px/1.55 var(--mono);color:var(--muted)}
.fn-mo b{color:var(--ink);font-weight:600}
.fn-mo i{font-style:normal;color:var(--accent)}
.fn-cards{display:grid;background:var(--surface);grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.fn-card{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:14px 16px;background:var(--surface);cursor:pointer;min-width:0;transition:background-color .15s;box-shadow:1px 0 0 var(--line),0 1px 0 var(--line)}
.fn-card b{font-family:var(--display);font-weight:400;font-size:24px;line-height:1;text-transform:uppercase;color:var(--ink);letter-spacing:.01em}
.fn-card span{font-size:13px;line-height:1.45;color:var(--muted)}
.fn-card:hover{background:var(--surface-2)}
.fn-card.on{background:var(--surface-2);box-shadow:inset 0 3px 0 var(--accent),1px 0 0 var(--line),0 1px 0 var(--line)}
.fn-card.on b{color:var(--accent)}
.fn-card:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.fn-ctab{display:flex;flex-wrap:wrap;gap:1px;background:var(--line)}
.fn-ctab>div{flex:1 1 84px;background:var(--surface);padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}
.fn-ctab>.hd{flex:1 1 100%;font:600 11px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.fn-ctab span{font:500 10.5px/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.fn-ctab b{font:600 14px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.fn-ctab>div.on{box-shadow:inset 0 -3px 0 var(--accent)}
.fn-ctab>div.on b{color:var(--accent)}
.fn-ctab>div.past b{color:var(--muted)}
`);

  /* =====================================================================
     fireNumber: spending, withdrawal rate, other income and net worth by account
     ===================================================================== */
  const FN_PRE = {
    single: { spend: 42000, wr: 4, save: 30000, ret: 5, age: 33, health: 6500, tax: 1500, perm: 0, ss: 17000, ssAge: 67, tx: 85000, pre: 60000, roth: 15000, hsa: 5000, cash: 15000, home: 0, debt: 0 },
    couple: { spend: 65000, wr: 4, save: 45000, ret: 5, age: 38, health: 14000, tax: 3000, perm: 0, ss: 28000, ssAge: 67, tx: 160000, pre: 210000, roth: 45000, hsa: 12000, cash: 30000, home: 180000, debt: 0 },
    family: { spend: 82000, wr: 4, save: 40000, ret: 5, age: 41, health: 21000, tax: 4000, perm: 6000, ss: 32000, ssAge: 67, tx: 120000, pre: 260000, roth: 50000, hsa: 15000, cash: 35000, home: 250000, debt: 18000 },
  };
  SML.widgets.fireNumber = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('fn');
    const pre0 = FN_PRE[opts.preset] ? opts.preset : 'couple';
    const P = FN_PRE[pre0];
    const sl = (k, label, min, max, step, fmt) => ui.slider({ id: id + '-' + k, label, min, max, step, value: P[k], fmt });
    const fl = (k, label) => ui.field({ id: id + '-' + k, label, value: P[k], min: 0, step: 1000 });
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Household</span>${ui.seg(id + '-hh', [{ v: 'single', label: 'Single' }, { v: 'couple', label: 'Couple' }, { v: 'family', label: 'Family of 4' }], pre0, 'Example household')}<span class="grow"></span><button type="button" class="btn btn-g sm" data-act="reset">Reset</button></div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('FIRE number', id + '-num', 'hl')}${ui.stat('Counted now', id + '-have')}${ui.stat('Of the way', id + '-pct')}${ui.stat('Free at', id + '-when', 'fn-st')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-ctrl">
        <div class="fn-sub">Spending and saving</div>
        ${sl('spend', 'Yearly living spending', 15000, 250000, 1000, 'usd0')}
        ${sl('wr', 'Withdrawal rate', 3, 5, 0.05, (v) => v.toFixed(2) + '% · ' + (100 / v).toFixed(1) + '×')}
        ${sl('save', 'Saved per year', 0, 150000, 1000, 'usd0')}
        ${sl('ret', 'Return after inflation', 2, 8, 0.5, 'pct1')}
        ${sl('age', 'Your age', 18, 70, 1, 'num')}
      </div>
      <details class="fn-more"><summary><span>Health, taxes and other income</span><small id="${id}-sum"></small></summary>
        <div class="wg-ctrl">
          ${sl('health', 'Health insurance and care a year', 0, 40000, 500, 'usd0')}
          ${sl('tax', 'Taxes on withdrawals a year', 0, 30000, 500, 'usd0')}
          ${sl('perm', 'Rental or part-time income, after tax', 0, 80000, 1000, 'usd0')}
          ${sl('ss', 'Social Security a year (estimate)', 0, 60000, 1000, 'usd0')}
          ${sl('ssAge', 'Social Security starts at age', 62, 70, 1, 'num')}
        </div>
      </details>
      <div class="wg-ctrl">
        <div class="fn-sub">Net worth by account <small id="${id}-nwt"></small></div>
        <div class="fn-fields">${fl('tx', 'Taxable brokerage')}${fl('pre', 'Pre-tax 401(k)/IRA')}${fl('roth', 'Roth accounts')}${fl('hsa', 'HSA')}${fl('cash', 'Cash')}${fl('home', 'Home equity')}${fl('debt', 'Debts to pay off')}</div>
        <div class="fn-chips">${ui.chips(id + '-cnt', [{ k: 'cash', label: 'Count cash', on: false, color: 'var(--muted)' }, { k: 'pre', label: 'Pre-tax at 85% (after tax)', on: true, color: 'var(--info)' }, { k: 'home', label: 'Count home equity', on: false, color: 'var(--ink)' }])}</div>
      </div>
      <div class="wg-note">All amounts in today's dollars; the return is after inflation. Other income is after tax. Your SSA statement assumes you keep working until you claim, so use a lower estimate if you will stop early. The Social Security bridge is money set aside for the years before benefits start, assumed to just keep pace with inflation. Count home equity only if you will sell or downsize.</div>`;
    const fig = $('.wg-fig', root);
    const K = (k) => id + '-' + k;
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && e.target.closest('#' + K('hh'))) applyPreset(st.seg(K('hh'))); draw(true); });
    function applyPreset(name) {
      const p = FN_PRE[name] || P;
      Object.keys(p).forEach((k) => st.set(K(k), p[k]));
      $$('#' + K('cnt') + ' .chip', root).forEach((c) => { const on = c.dataset.k === 'pre'; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    }
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-act="reset"]'); if (!b) return; const name = st.seg(K('hh')) || pre0; applyPreset(name); draw(true); });
    const v = (k) => Math.max(0, st.n(K(k)) || 0);
    function calc() {
      const c = { spend: v('spend'), health: v('health'), tax: v('tax'), perm: v('perm'), ss: v('ss'), ssAge: v('ssAge') || 67, age: v('age'), save: v('save'), r: v('ret') / 100, w: Math.max(0.01, v('wr') / 100), wr: v('wr') };
      const cntCash = st.on(K('cnt'), 'cash'), cut = st.on(K('cnt'), 'pre'), cntHome = st.on(K('cnt'), 'home');
      c.b = { tx: v('tx'), pre: v('pre') * (cut ? 0.85 : 1), roth: v('roth'), hsa: v('hsa'), cash: cntCash ? v('cash') : 0, home: cntHome ? v('home') : 0 };
      c.gross0 = Object.values(c.b).reduce((a, x) => a + x, 0);
      c.debt = Math.min(v('debt'), c.gross0);
      c.have = c.gross0 - c.debt;
      c.nwAll = v('tx') + v('pre') + v('roth') + v('hsa') + v('cash') + v('home') - v('debt');
      c.gross = c.spend + c.health + c.tax;
      c.net = Math.max(0, c.gross - c.perm);
      c.ssUse = Math.min(c.ss, c.net);
      let num = c.net / c.w, yrs = yearsTo(num, c.have, c.save, c.r);
      if (c.ssUse > 0) {
        for (let k = 0; k < 40; k++) {
          const ra = c.age + (isFinite(yrs) ? yrs : 90);
          const target = (c.net - c.ssUse) / c.w + c.ssUse * Math.max(0, c.ssAge - ra);
          num = k ? (num + target) / 2 : target;
          yrs = yearsTo(num, c.have, c.save, c.r);
        }
      }
      c.yrs = yrs; c.retAge = c.age + yrs;
      c.bridge = c.ssUse > 0 && isFinite(c.retAge) ? c.ssUse * Math.max(0, c.ssAge - c.retAge) : 0;
      c.num = c.net > 0 ? (c.net - c.ssUse) / c.w + c.bridge : 0;
      if (c.net > 0) { c.yrs = yearsTo(c.num, c.have, c.save, c.r); c.retAge = c.age + c.yrs; }
      return c;
    }
    let geo = null;
    const draw = ui.responsive(fig, (W) => {
      const c = calc();
      const cp = W < 520;
      const x0 = cp ? 44 : 58, x1 = W - (cp ? 4 : 10);
      const bh = cp ? 20 : 24, needY = 30, haveY = needY + bh + (cp ? 30 : 34);
      const maxV = Math.max(c.num, c.gross0, 1) * 1.02;
      const X = SML.lin(0, maxV, x0, x1);
      let b = S.text(0, needY + bh / 2 + 4, 'NEED', 'cap') + S.text(0, haveY + bh / 2 + 4, 'HAVE', 'cap');
      /* need bar: the portfolio-funded part of each spending line, then the Social Security bridge */
      const f = c.gross > 0 && c.net > 0 ? (c.net - c.ssUse) / c.gross : 0;
      const segs = [['Living', c.spend * f / c.w, 'f-acc-t s-acc w15'], ['Health', c.health * f / c.w, 'f-dn-t s-dn w15'], ['Taxes', c.tax * f / c.w, 'f-vio-t s-vio w15'], ['SS bridge', c.bridge, 'f-info-t s-info w15']];
      let cx = 0;
      segs.forEach(([l, val, cls]) => {
        if (val <= 0) return;
        const xa = X(cx), xb = X(cx + val);
        b += tseg(xa, needY, xb - xa, bh, cls, `${l}: ${kd(val)}`);
        if (xb - xa > (cp ? 48 : 60)) b += S.text(xa + 7, needY + bh / 2 + 4, l, 'sm b ink');
        cx += val;
      });
      if (c.num <= 0) b += S.text(x0, needY + bh / 2 + 4, 'Other income covers your spending', 'sm up b');
      /* have bar */
      const hs = [['Taxable', c.b.tx, 'f-up'], ['Pre-tax', c.b.pre, 'f-info'], ['Roth', c.b.roth, 'f-vio'], ['HSA', c.b.hsa, 'f-acc'], ['Cash', c.b.cash, 'f-mut'], ['Home', c.b.home, 'f-ink o50']];
      cx = 0;
      hs.forEach(([l, val, cls]) => {
        if (val <= 0) return;
        const xa = X(cx), xb = X(cx + val);
        b += tseg(xa, haveY, Math.max(1, xb - xa - 1), bh, cls, `${l}: ${kd(val)}`);
        if (xb - xa > (cp ? 50 : 58)) b += S.text(xa + 7, haveY + bh / 2 + 4, l, 'sm b onacc');
        cx += val;
      });
      if (c.debt > 0) { const xa = X(c.gross0 - c.debt), xb = X(c.gross0); b += tseg(xa, haveY - 3, xb - xa, bh + 6, 'f-bg o70 s-dn w15', `Debts: ${F.minus}${kd(c.debt)}`); if (xb - xa > 40) b += S.text((xa + xb) / 2, haveY + bh / 2 + 4, 'debt', 'sm b dn', 'middle'); }
      if (c.have <= 0) b += S.rect(x0, haveY, 2, bh, 'f-mut');
      /* labels: FIRE number above the need bar, progress after the have bar */
      if (c.num > 0) {
        const nx = X(c.num);
        b += S.line(nx, needY - 6, nx, haveY + bh + 6, 's-acc dash w15');
        const lab = `FIRE number ${kd(c.num)}`;
        b += nx - x0 > lab.length * 7 ? S.text(nx, needY - 10, lab, (cp ? 'sm' : 'md') + ' b acc', 'end') : S.text(nx + 4, needY - 10, lab, (cp ? 'sm' : 'md') + ' b acc');
      }
      const pctV = c.num > 0 ? c.have / c.num * 100 : 100;
      const hl = `${kd(c.have)} · ${Math.round(Math.min(pctV, 999))}%`;
      const hx = X(c.have);
      b += hx + hl.length * 7.2 + 8 < x1 ? S.text(hx + 6, haveY + bh / 2 + 4, hl, 'sm mono b ink') : S.text(Math.min(hx, x1) - 6, haveY + bh + 15, hl, 'sm mono b ink', 'end');

      /* projection chart */
      const cTop = haveY + bh + (cp ? 44 : 50), ch = cp ? 176 : 216, cBot = cTop + ch;
      const a0 = c.age;
      const aEnd = isFinite(c.retAge) ? Math.min(a0 + 50, Math.max(a0 + 8, Math.ceil(c.retAge) + 5)) : a0 + 40;
      const n = Math.round(aEnd - a0);
      const path = [c.have];
      for (let t = 1; t <= n; t++) path.push(path[t - 1] * (1 + c.r) + c.save);
      const yMax = Math.max(c.num * 1.3, c.have * 1.15, 10000);
      const XA = SML.lin(a0, aEnd, x0, x1), Y = SML.lin(0, yMax, cBot, cTop);
      const yt = SML.ticks(0, yMax, cp ? 3 : 4);
      b += S.hgrid(yt.map(Y), x0, x1) + yt.map((t) => S.text(x0 - 6, Y(t) + 4, kd(t), 'xs mono', 'end')).join('');
      const xt = SML.ticks(a0, aEnd, cp ? 4 : 7).filter((t) => t >= a0 && t <= aEnd && Math.abs(t - Math.round(t)) < 1e-6);
      b += S.line(x0, cBot, x1, cBot, 's-line') + xt.map((t) => S.text(XA(t), cBot + 16, String(t), 'xs mono', 'middle')).join('');
      b += S.text(x0, cTop - 12, cp ? 'INVESTED, BY AGE' : 'COUNTED INVESTMENTS, BY AGE', 'cap');
      const clip = SML.uid('fnc');
      b += `<defs><clipPath id="${clip}"><rect x="${x0}" y="${cTop - 4}" width="${x1 - x0}" height="${ch + 4}"/></clipPath></defs>`;
      const pts = path.map((val, t) => [XA(a0 + t), Y(val)]);
      const fiT = isFinite(c.yrs) ? c.yrs : n + 1;
      const cross = fiT <= n ? [XA(a0 + fiT), Y(c.num)] : null;
      const solid = pts.filter((_, t) => t <= fiT).concat(cross && fiT > 0 ? [cross] : []);
      let g = S.area(solid, cBot, 'f-up-t') + S.poly(solid, 's-up w25');
      if (cross) g += S.poly([cross].concat(pts.filter((_, t) => t > fiT)), 's-up w15 dash2 o70');
      b += `<g clip-path="url(#${clip})">${g}</g>`;
      if (c.num > 0 && c.num < yMax) {
        b += S.line(x0, Y(c.num), x1, Y(c.num), 's-acc dash w15') + tag(x0 + 8, Y(c.num) - 8, 'FIRE number', 'sm b acc', 'start', cp);
      }
      if (c.ssUse > 0 && c.ssAge > a0 && c.ssAge < aEnd) {
        const sx = XA(c.ssAge);
        b += S.line(sx, cTop, sx, cBot, 's-info dot2 w15') + S.text(sx, cTop - 12 + (cp ? 0 : 0), `SS ${c.ssAge}`, 'xs b info', sx > x1 - 30 ? 'end' : 'middle');
      }
      if (c.num > 0 && isFinite(c.yrs) && c.yrs > 0 && c.yrs <= n) {
        const fx = XA(c.retAge), fy = Y(c.num);
        const lab = `Free at ${Math.round(c.retAge)}`;
        b += S.circle(fx, fy, 6, 'f-acc s-surf w2') + tag(fx > x1 - 110 ? fx - 10 : fx + 10, fy - 14, lab, 'sm b ink', fx > x1 - 110 ? 'end' : 'start', cp);
      } else if (c.num > 0 && c.yrs === 0) {
        b += tag(x0 + 10, Y(Math.min(c.have, yMax)) - 14, 'Already there', 'sm b up', 'start', cp);
      }
      b += S.rect(x0, cTop, x1 - x0, ch, 'hit fn-hit') + '<g class="fn-hov"></g>';
      const H = cBot + 26;
      geo = { x0, x1, cTop, cBot, a0, aEnd, path, XA, Y, cp };
      const recipe = c.net > 0
        ? `(${usd0(c.gross)} spending${c.perm ? ' − ' + usd0(c.perm) + ' other income' : ''}${c.ssUse ? ' − ' + usd0(c.ssUse) + ' Social Security' : ''}) ÷ ${+c.wr.toFixed(2)}%${c.bridge ? ' + ' + kd(c.bridge) + ' bridge' : ''} = <b>${kd(c.num)}</b>`
        : 'Your other income covers your spending.';
      fig.innerHTML = S.wrap(W, H, `Your FIRE number of ${kd(c.num)} against ${kd(c.have)} counted today, and a projection by age`, b) + `<p class="fn-recipe">${recipe}</p>`;
      /* readouts */
      $('#' + K('num')).textContent = kd(c.num);
      $('#' + K('have')).textContent = kd(c.have);
      $('#' + K('pct')).textContent = Math.round(Math.min(pctV, 999)) + '%';
      $('#' + K('when')).innerHTML = c.num <= 0 || c.yrs === 0 ? 'Now' : isFinite(c.yrs) ? `Age ${Math.round(c.retAge)}<small>${c.yrs < 10 ? c.yrs.toFixed(1) : Math.round(c.yrs)} yrs</small>` : '70+ yrs';
      $('#' + K('sum')).textContent = `${kd(c.health)} health · ${kd(c.tax)} tax · ${kd(c.perm + c.ss)} income`;
      $('#' + K('nwt')).textContent = `total ${kd(c.nwAll)} · counted ${kd(c.have)}`;
      const per1k = kd(1000 / c.w);
      let m;
      if (c.num <= 0) m = ui.msg('up', 'Covered', 'Your rental or part-time income covers your spending, so the portfolio only has to back up surprises.');
      else if (c.have >= c.num) m = ui.msg('up', 'You are there', `Counted investments of ${kd(c.have)} cover your ${kd(c.num)} target. Next: a withdrawal plan, taxes and health insurance.`);
      else if (!isFinite(c.yrs)) m = ui.msg('dn', 'Not on track', `At ${usd0(c.save)} a year you would not reach ${kd(c.num)} within 70 years. Spending less moves this fastest: every $1,000 a year cut lowers the target by ${per1k}.`);
      else {
        const y2 = yearsTo(c.num, c.have, c.save + 5000, c.r);
        m = ui.msg(c.yrs <= 10 ? 'up' : 'acc', c.yrs <= 10 ? 'Close' : 'On the way', `You need ${kd(c.num)} and have ${Math.round(pctV)}% of it. Saving ${usd0(c.save)} a year gets you there in about ${Math.round(c.yrs)} years, at age ${Math.round(c.retAge)}. Another $5,000 a year saves about ${(c.yrs - y2).toFixed(1)} years; every $1,000 a year of spending you cut lowers the target by ${per1k}.${c.bridge > 0 ? ` Social Security shrinks the target, but ${kd(c.bridge)} of it is a bridge to age ${c.ssAge}.` : ''}`);
      }
      $('#' + K('msg')).innerHTML = m;
    });
    /* hover readout on the projection */
    fig.addEventListener('pointermove', (e) => {
      const svg = $('svg', fig), hov = $('.fn-hov', fig); if (!svg || !hov || !geo) return;
      const p = ui.pt(svg, e);
      if (p.x < geo.x0 || p.x > geo.x1 || p.y < geo.cTop - 6 || p.y > geo.cBot + 6) { hov.innerHTML = ''; return; }
      const t = SML.clamp(Math.round(geo.XA.inv(p.x) - geo.a0), 0, geo.path.length - 1);
      const val = geo.path[t], x = geo.XA(geo.a0 + t), y = geo.Y(Math.min(val, geo.Y.d[1]));
      const lab = `Age ${geo.a0 + t}: ${kd(val)}`;
      hov.innerHTML = S.line(x, geo.cTop, x, geo.cBot, 's-mut dash2') + S.circle(x, y, 4.5, 'f-up s-surf w2') + tag(x > geo.x1 - 120 ? x - 10 : x + 10, Math.max(geo.cTop + 14, y - 10), lab, 'sm mono b ink', x > geo.x1 - 120 ? 'end' : 'start', geo.cp);
    });
    fig.addEventListener('pointerleave', () => { const hov = $('.fn-hov', fig); if (hov) hov.innerHTML = ''; });
  };

  /* =====================================================================
     savingsRate: savings rate -> years to financial independence
     ===================================================================== */
  function srYears(s, r, w, k) {
    if (s >= 1) return 0;
    const T = (1 - s) / w, N0 = k * (1 - s);
    if (N0 >= T) return 0;
    if (s <= 0) return Infinity;
    if (r <= 0) return (T - N0) / s;
    return Math.log((T + s / r) / (N0 + s / r)) / Math.log(1 + r);
  }
  SML.widgets.savingsRate = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('sr');
    const K = (k) => id + '-' + k;
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Years to FI', K('yrs'), 'hl')}${ui.stat('Saved a year', K('sv'))}${ui.stat('Spent a year', K('sp'))}${ui.stat('FIRE number', K('num'))}</div>
      <div class="wg-msg" id="${K('msg')}"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: K('rate'), label: 'Savings rate', min: 5, max: 90, step: 1, value: opts.rate || 30, fmt: 'pct' })}
        ${ui.slider({ id: K('pay'), label: 'Take-home pay a year', min: 20000, max: 300000, step: 1000, value: 80000, fmt: 'usd0' })}
        ${ui.slider({ id: K('ret'), label: 'Return after inflation', min: 2, max: 8, step: 0.5, value: 5, fmt: 'pct1' })}
        ${ui.slider({ id: K('wr'), label: 'Withdrawal rate', min: 3, max: 5, step: 0.25, value: 4, fmt: (v) => v.toFixed(2) + '%' })}
        ${ui.slider({ id: K('k'), label: 'Saved so far', min: 0, max: 20, step: 0.5, value: 0, fmt: (v) => (v ? v + ' yrs of spending' : 'nothing yet') })}
      </div>
      <div class="wg-note">Drag the dot along the curve. Assumes you spend the same in retirement as you do now, save at the end of each year and earn a steady return after inflation. Real markets bounce around, so treat the years as a guide.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => draw(true));
    let geo = null;
    const draw = ui.responsive(fig, (W) => {
      const s = st.n(K('rate')) / 100, pay = st.n(K('pay')), r = st.n(K('ret')) / 100, w = st.n(K('wr')) / 100, k = st.n(K('k'));
      const yrs = srYears(s, r, w, k);
      const cp = W < 520;
      const x0 = cp ? 30 : 42, x1 = W - (cp ? 6 : 14);
      /* income split bar */
      const ibY = 24, ibH = cp ? 24 : 28;
      const IX = SML.lin(0, 1, x0, x1);
      let b = S.text(x0, 13, 'OF EVERY $100 YOU TAKE HOME', 'cap');
      b += S.rect(x0, ibY, IX(s) - x0, ibH, 'f-up', 2) + S.rect(IX(s) + 2, ibY, x1 - IX(s) - 2, ibH, 'f-acc-t s-acc w15', 2);
      const sv = `$${Math.round(s * 100)} saved`, sp = `$${100 - Math.round(s * 100)} spent`;
      if (IX(s) - x0 > sv.length * 7 + 12) b += S.text(x0 + 8, ibY + ibH / 2 + 4.5, sv, 'md b onacc');
      else b += S.text(x0 + 2, ibY + ibH + 15, sv, 'sm b up');
      if (x1 - IX(s) > sp.length * 7 + 12) b += S.text(x1 - 8, ibY + ibH / 2 + 4.5, sp, 'md b ink', 'end');
      else b += S.text(x1, ibY + ibH + 15, sp, 'sm b acc', 'end');
      /* curve */
      const cTop = ibY + ibH + 46, ch = cp ? 210 : 250, cBot = cTop + ch, cap = 60;
      const X = SML.lin(5, 90, x0, x1), Y = SML.lin(0, cap, cBot, cTop);
      b += S.text(x0, cTop - 14, cp ? 'YEARS TO FI' : 'YEARS OF WORK UNTIL FINANCIALLY INDEPENDENT', 'cap');
      const yt = [0, 10, 20, 30, 40, 50, 60];
      b += S.hgrid(yt.map(Y), x0, x1) + yt.map((t) => S.text(x0 - 6, Y(t) + 4, String(t), 'xs mono', 'end')).join('');
      const xt = cp ? [10, 30, 50, 70, 90] : [10, 20, 30, 40, 50, 60, 70, 80, 90];
      b += S.line(x0, cBot, x1, cBot, 's-line') + xt.map((t) => S.text(X(t), cBot + 16, t + '%', 'xs mono', 'middle')).join('');
      b += S.text(x1, cBot + 32, 'savings rate', 'xs', 'end');
      const pts = [];
      for (let q = 5; q <= 90.001; q += 0.5) { const y = srYears(q / 100, r, w, k); pts.push([X(q), Y(Math.min(isFinite(y) ? y : cap + 20, cap + 20))]); }
      const clip = SML.uid('src');
      b += `<defs><clipPath id="${clip}"><rect x="${x0}" y="${cTop}" width="${x1 - x0}" height="${ch}"/></clipPath></defs>`;
      b += `<g clip-path="url(#${clip})">${S.area(pts, cBot, 'f-info-t')}${S.poly(pts, 's-info w25')}</g>`;
      /* reference points */
      const cur = s * 100;
      [10, 25, 50, 75].forEach((q) => {
        const y = srYears(q / 100, r, w, k); if (!isFinite(y) || y > cap) return;
        b += S.circle(X(q), Y(y), 3.5, 'f-ink');
        if (Math.abs(q - cur) > 5) b += S.text(X(q) + 7, Y(y) - 7, Math.round(y) + ' yrs', 'xs mono b ink');
      });
      /* current point */
      const yc = isFinite(yrs) ? Math.min(yrs, cap) : cap;
      const cx = X(cur), cy = Y(yc);
      b += S.line(cx, cBot, cx, cy, 's-acc dash2 w15') + S.line(x0, cy, cx, cy, 's-acc dash2 w15');
      const lab = `${Math.round(cur)}% → ${isFinite(yrs) ? (yrs < 10 ? yrs.toFixed(1) : Math.round(yrs)) + ' yrs' : '60+ yrs'}`;
      const right = cx < x1 - 130;
      b += tag(right ? cx + 16 : cx - 16, Math.max(cTop + 14, cy - 12), lab, 'md b acc', right ? 'start' : 'end', cp);
      b += S.rect(x0, cTop, x1 - x0, ch, 'hit sr-drag') + S.circle(cx, cy, 9, 'handle sr-drag');
      geo = { X };
      fig.innerHTML = S.wrap(W, cBot + 38, `Years to financial independence by savings rate; at ${Math.round(cur)}% it takes about ${Math.round(yrs)} years`, b);
      /* readouts */
      const spend = pay * (1 - s), num = spend / w;
      $('#' + K('yrs')).textContent = isFinite(yrs) ? (yrs < 10 ? yrs.toFixed(1) : Math.round(yrs)) + ' yrs' : '60+';
      $('#' + K('sv')).textContent = usd0(pay * s);
      $('#' + K('sp')).textContent = usd0(spend);
      $('#' + K('num')).textContent = kd(num);
      const lo = srYears(Math.max(0.05, s - 0.1), r, w, k);
      let m;
      if (yrs === 0) m = ui.msg('up', 'Done', 'What you have already saved covers your spending at this withdrawal rate.');
      else if (yrs <= 10) m = ui.msg('up', 'Fast lane', `At ${Math.round(cur)}% you spend ${usd0(spend)} and save ${usd0(pay * s)} a year, so in about ${Math.round(yrs)} years you have ${kd(num)}. Each working year funds several years of freedom.`);
      else if (yrs >= 40) m = ui.msg('dn', 'Most of a career', `At ${Math.round(cur)}% it takes about ${isFinite(yrs) ? Math.round(yrs) : '60+'} years. Lifting the rate by 10 points cuts that to about ${Math.round(srYears(s + 0.1, r, w, k))} years.`);
      else m = ui.msg('acc', 'The lever', `At ${Math.round(cur)}% it takes about ${Math.round(yrs)} years. Ten points less (${Math.round(cur) - 10}%) would mean about ${isFinite(lo) ? Math.round(lo) : '60+'} years; ten points more, about ${Math.round(srYears(Math.min(0.9, s + 0.1), r, w, k))}. Your income level barely changes these numbers.`);
      $('#' + K('msg')).innerHTML = m;
    });
    const setFrom = (pt) => { if (!geo) return; const q = Math.round(SML.clamp(geo.X.inv(pt.x), 5, 90)); if (q !== st.n(K('rate'))) { st.set(K('rate'), q); draw(true); } };
    ui.drag(fig, { sel: '.sr-drag', start: setFrom, move: setFrom });
  };

  /* =====================================================================
     spendAverager: regular months plus irregular and long-cycle costs
     ===================================================================== */
  const SA_ITEMS = [
    { k: 'ins', label: 'Insurance billed yearly', months: [0] },
    { k: 'subs', label: 'Yearly memberships and software', months: [0] },
    { k: 'med', label: 'Deductibles, dental and glasses', months: [1] },
    { k: 'carFix', label: 'Car repairs and tires', months: [2] },
    { k: 'ptax', label: 'Property tax (if not in the mortgage)', months: [3, 9] },
    { k: 'travel', label: 'Travel', months: [6] },
    { k: 'home', label: 'Home repairs and upkeep', months: [8] },
    { k: 'gifts', label: 'Holidays and gifts', months: [11] },
    { k: 'gear', label: 'Appliances, furniture, electronics', months: [10] },
    { k: 'car', label: 'Next car', months: [5] },
  ];
  const SA_REG = [['housing', 'Housing'], ['food', 'Food'], ['transport', 'Transport'], ['util', 'Utilities and phone'], ['health', 'Health care'], ['other', 'Everything else']];
  const SA_PRE = {
    single: { reg: [1600, 550, 350, 220, 250, 330], it: { ins: [900, 1, 1], subs: [400, 1, 1], med: [800, 1, 1], carFix: [900, 1, 1], ptax: [0, 1, 0], travel: [2500, 1, 1], home: [400, 1, 1], gifts: [700, 1, 1], gear: [3000, 5, 1], car: [22000, 10, 1] } },
    couple: { reg: [2400, 1100, 500, 350, 400, 250], it: { ins: [2200, 1, 1], subs: [600, 1, 0], med: [0, 1, 0], carFix: [1400, 1, 1], ptax: [0, 1, 0], travel: [4000, 1, 1], home: [3500, 1, 1], gifts: [1500, 1, 1], gear: [5000, 5, 1], car: [28000, 10, 1] } },
    family: { reg: [2900, 1500, 700, 450, 650, 600], it: { ins: [2600, 1, 1], subs: [700, 1, 1], med: [2000, 1, 1], carFix: [1800, 1, 1], ptax: [4800, 1, 1], travel: [5000, 1, 1], home: [4000, 1, 1], gifts: [2500, 1, 1], gear: [6000, 5, 1], car: [32000, 8, 1] } },
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  SML.widgets.spendAverager = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('sa');
    const K = (k) => id + '-' + k;
    const p0 = SA_PRE[opts.preset] ? opts.preset : 'couple';
    const P = SA_PRE[p0];
    const every = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Household</span>${ui.seg(K('pre'), [{ v: 'single', label: 'Single renter' }, { v: 'couple', label: 'Couple, own home' }, { v: 'family', label: 'Family of 4' }], p0, 'Example household')}</div>
      <div class="wg-fig"></div>
      <div class="fn-mo" id="${K('mo')}"></div>
      <div class="wg-read">${ui.stat('Typical month', K('typ'))}${ui.stat('Irregular a year', K('irr'))}${ui.stat('True yearly spending', K('tot'), 'hl')}${ui.stat('A typical month misses', K('gap'))}</div>
      <div class="wg-msg" id="${K('msg')}"></div>
      <div class="wg-ctrl"><div class="fn-sub">Regular monthly costs</div>
        ${SA_REG.map(([k, l], i) => ui.slider({ id: K(k), label: l, min: 0, max: k === 'housing' ? 6000 : 3000, step: 25, value: P.reg[i], fmt: 'usd0' })).join('')}
      </div>
      <div class="fn-irr"><div class="fn-irr-h"><span>Irregular and long-cycle costs</span><span>Amount</span><span>Every</span></div>
        ${SA_ITEMS.map((it) => { const d = P.it[it.k]; return `<div class="fn-irr-r${d[2] ? '' : ' off'}" data-k="${it.k}"><label class="nm"><input type="checkbox" id="${K('on-' + it.k)}"${d[2] ? ' checked' : ''}><span>${it.label}</span></label><input type="number" id="${K('amt-' + it.k)}" value="${d[0]}" min="0" step="100" inputmode="decimal" aria-label="${esc(it.label)}: amount"><select id="${K('ev-' + it.k)}" aria-label="${esc(it.label)}: how often">${every.map((y) => `<option value="${y}"${y === d[1] ? ' selected' : ''}>${y === 1 ? '1 year' : y + ' years'}</option>`).join('')}</select></div>`; }).join('')}
      </div>
      <div class="wg-note">Yearly bills land in the month they usually come. Costs that come every few years are spread evenly as "set aside" money (a sinking fund). Hover or tap a month for its details.</div>`;
    const fig = $('.wg-fig', root);
    let selM = -1, geo = null, last = null;
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + K('hh'))) applyPreset(st.seg(K('hh')));
      draw(true);
    });
    function applyPreset(name) {
      const p = SA_PRE[name] || P;
      SA_REG.forEach(([k], i) => st.set(K(k), p.reg[i]));
      SA_ITEMS.forEach((it) => { const d = p.it[it.k]; $('#' + K('amt-' + it.k)).value = d[0]; $('#' + K('ev-' + it.k)).value = String(d[1]); $('#' + K('on-' + it.k)).checked = !!d[2]; });
      selM = -1;
    }
    function calc() {
      const reg = SA_REG.reduce((a, [k]) => a + Math.max(0, st.n(K(k)) || 0), 0);
      const inMonth = new Array(12).fill(0), byMonth = Array.from({ length: 12 }, () => []);
      let sinkM = 0, yearly = 0, sinkY = 0; const sinks = [];
      SA_ITEMS.forEach((it) => {
        const row = $(`.fn-irr-r[data-k="${it.k}"]`, root), on = $('#' + K('on-' + it.k)).checked;
        if (row) row.classList.toggle('off', !on);
        const amt = Math.max(0, Number($('#' + K('amt-' + it.k)).value) || 0), ev = Math.max(1, Number($('#' + K('ev-' + it.k)).value) || 1);
        if (!on || !amt) return;
        if (ev === 1) { const per = amt / it.months.length; it.months.forEach((m) => { inMonth[m] += per; byMonth[m].push([it.label, per]); }); yearly += amt; }
        else { sinkM += amt / ev / 12; sinkY += amt / ev; sinks.push([it.label, amt / ev]); }
      });
      const total = reg * 12 + yearly + sinkY;
      return { reg, inMonth, byMonth, sinkM, yearly, sinkY, sinks, total };
    }
    function monthLine(c, m) {
      const parts = [`regular <b>${usd0(c.reg)}</b>`];
      if (c.sinkM) parts.push(`set aside <b>${usd0(c.sinkM)}</b>`);
      c.byMonth[m].forEach(([l, v]) => parts.push(`${esc(l.toLowerCase())} <b>${usd0(v)}</b>`));
      return `<i>${MONTHS[m]}</i> · ${parts.join(' + ')} = <b>${usd0(c.reg + c.sinkM + c.inMonth[m])}</b>`;
    }
    const draw = ui.responsive(fig, (W) => {
      const c = calc(); last = c;
      const cp = W < 520;
      const x0 = cp ? 40 : 52, x1 = W - (cp ? 4 : 132);
      const top = 40, ch = cp ? 180 : 220, base = top + ch;
      const tots = c.inMonth.map((v) => c.reg + c.sinkM + v);
      const yMax = Math.max(...tots, 100) * 1.14;
      const Y = SML.lin(0, yMax, base, top);
      const bwSlot = (x1 - x0) / 12, bw = bwSlot * (cp ? 0.66 : 0.6);
      let b = '';
      /* legend */
      const leg = [['f-info', cp ? 'Monthly' : 'Regular monthly'], ['f-vio', cp ? 'Set aside' : 'Set aside (every few years)'], ['f-acc', cp ? 'Yearly bills' : 'Yearly bills']];
      let lx = x0;
      leg.forEach(([cls, l]) => { b += S.rect(lx, 8, 10, 10, cls, 2) + S.text(lx + 15, 17, l, 'sm'); lx += 15 + l.length * (cp ? 6 : 6.4) + 16; });
      const yt = SML.ticks(0, yMax, cp ? 3 : 4);
      b += S.hgrid(yt.map(Y), x0, x1) + yt.map((t) => S.text(x0 - 6, Y(t) + 4, kd(t), 'xs mono', 'end')).join('');
      b += S.line(x0, base, x1, base, 's-line');
      const big = tots.indexOf(Math.max(...tots));
      const sel = selM >= 0 ? selM : big;
      for (let m = 0; m < 12; m++) {
        const xc = x0 + (m + 0.5) * bwSlot, xl = xc - bw / 2;
        let y = base;
        const hR = base - Y(c.reg), hS = base - Y(c.sinkM), hI = base - Y(c.inMonth[m]);
        b += S.rect(xl, y - hR, bw, hR, 'f-info o70'); y -= hR;
        if (hS > 0) { b += S.rect(xl, y - hS, bw, hS, 'f-vio o70'); y -= hS; }
        if (hI > 0) { b += S.rect(xl, y - hI, bw, hI, 'f-acc'); y -= hI; }
        if (m === sel) b += S.rect(xl - 3, y - 3, bw + 6, base - y + 3, 'nf s-ink w15', 3);
        b += S.text(xc, base + 15, cp ? MONTHS[m][0] : MONTHS[m], 'xs mono' + (m === sel ? ' b ink' : ''), 'middle');
      }
      /* lines: typical month vs true average */
      const typ = c.reg, avg = c.total / 12;
      b += S.line(x0, Y(typ), x1, Y(typ), 's-mut dash w15') + S.line(x0, Y(avg), x1, Y(avg), 's-acc w2');
      if (cp) {
        const la = `True average ${usd0(avg)}`, lt = `Typical month ${usd0(typ)}`;
        const ya = Y(avg) - 7, ytp = Math.abs(Y(typ) - Y(avg)) < 22 ? Y(typ) + 17 : Y(typ) - 7;
        b += tag(x1 - 4, ya, la, 'sm b acc', 'end', cp) + tag(x1 - 4, ytp, lt, 'sm b ink', 'end', cp);
      } else {
        let ya = Y(avg), ytp = Y(typ);
        if (Math.abs(ytp - ya) < 30) { const mid = (ya + ytp) / 2; ya = mid - 15; ytp = mid + 15; }
        b += S.line(x1, Y(avg), x1 + 6, Y(avg), 's-acc w2') + S.line(x1, Y(typ), x1 + 6, Y(typ), 's-mut w15');
        b += S.text(x1 + 12, ya - 2, 'True average', 'xs b acc') + S.text(x1 + 12, ya + 12, usd0(avg) + ' /mo', 'sm mono b acc');
        b += S.text(x1 + 12, ytp - 2, 'Typical month', 'xs b ink') + S.text(x1 + 12, ytp + 12, usd0(typ) + ' /mo', 'sm mono b ink');
      }
      for (let m = 0; m < 12; m++) b += S.rect(x0 + m * bwSlot, top, bwSlot, ch + 18, 'hit sa-m', 0, ` data-m="${m}"`);
      geo = { x0, bwSlot, top, base };
      fig.innerHTML = S.wrap(W, base + 24, `Monthly spending across a year: typical month ${kd(typ)}, true average ${kd(avg)}`, b);
      $('#' + K('mo')).innerHTML = monthLine(c, sel);
      const naive = c.reg * 12, gap = c.total - naive;
      $('#' + K('typ')).textContent = usd0(c.reg);
      $('#' + K('irr')).textContent = usd0(c.yearly + c.sinkY);
      $('#' + K('tot')).textContent = usd0(c.total);
      $('#' + K('gap')).textContent = c.total > 0 ? Math.round(gap / c.total * 100) + '% · ' + kd(gap) : '—';
      const m = gap <= 0
        ? ui.msg('info', 'Steady', 'With no irregular costs switched on, every month looks the same. Real years rarely do: switch some on.')
        : ui.msg(gap / Math.max(1, c.total) > 0.12 ? 'dn' : 'acc', 'Hidden costs', `A budget built from a typical month says ${usd0(naive)} a year. The real number is ${usd0(c.total)}, so the typical month misses ${Math.round(gap / Math.max(1, c.total) * 100)}% of your spending. At 25 times spending, that gap is ${kd(gap * 25)} of FIRE number.`);
      $('#' + K('msg')).innerHTML = m;
    });
    const pick = (e) => {
      const svg = $('svg', fig); if (!svg || !geo || !last) return;
      const p = ui.pt(svg, e);
      if (p.y < geo.top - 10 || p.y > geo.base + 22) return;
      const m = Math.floor((p.x - geo.x0) / geo.bwSlot);
      if (m < 0 || m > 11) return;
      if (m !== selM) { selM = m; draw(true); }
    };
    fig.addEventListener('pointermove', pick);
    fig.addEventListener('pointerdown', pick);
  };

  /* =====================================================================
     fireFlavors: Lean, FIRE, Fat, Barista, Coast
     ===================================================================== */
  const FLV = [
    { k: 'lean', t: 'Lean', d: 'A small budget, roughly under $40K a year for a household. Faster, thinner cushion.', set: { sp: 36000, pt: 0 } },
    { k: 'fire', t: 'FIRE', d: 'Roughly your current lifestyle, paid by your investments for life.', set: { sp: 65000, pt: 0 } },
    { k: 'fat', t: 'Fat', d: 'A big budget, often $100K+ a year, with room for travel and comfort. Bigger number.', set: { sp: 140000, pt: 0 } },
    { k: 'barista', t: 'Barista', d: 'Leave full-time work; part-time income pays part of the bills, ideally with health insurance.', set: { sp: 65000, pt: 25000 } },
    { k: 'coast', t: 'Coast', d: 'Enough invested to grow into your number by retirement age, so work only pays today.', set: { sp: 65000, pt: 0 } },
  ];
  SML.widgets.fireFlavors = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('ff');
    const K = (k) => id + '-' + k;
    let flav = FLV.some((f) => f.k === opts.flavor) ? opts.flavor : 'fire';
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Your zone', K('zone'))}${ui.stat('FIRE number', K('num'), 'hl')}${ui.stat('Barista number', K('bar'))}${ui.stat('Coast number today', K('cst'))}</div>
      <div class="wg-msg" id="${K('msg')}"></div>
      <div class="fn-cards" role="group" aria-label="FIRE flavors">${FLV.map((f) => `<button type="button" class="fn-card${f.k === flav ? ' on' : ''}" data-f="${f.k}" aria-pressed="${f.k === flav}"><b>${f.k === 'fire' ? 'FIRE' : f.t + ' FIRE'}</b><span>${f.d}</span></button>`).join('')}</div>
      <div class="wg-ctrl">
        ${ui.slider({ id: K('sp'), label: 'Yearly spending', min: 20000, max: 250000, step: 1000, value: 65000, fmt: 'usd0' })}
        ${ui.slider({ id: K('pt'), label: 'Part-time pay, after tax', min: 0, max: 60000, step: 1000, value: 0, fmt: 'usd0' })}
        ${ui.slider({ id: K('inv'), label: 'Invested now', min: 0, max: 2000000, step: 10000, value: 300000, fmt: kd })}
        ${ui.slider({ id: K('age'), label: 'Your age', min: 20, max: 60, step: 1, value: 35, fmt: 'num' })}
        ${ui.slider({ id: K('ret'), label: 'Full retirement at', min: 50, max: 67, step: 1, value: 60, fmt: 'num' })}
      </div>
      <div class="wg-note">Drag the dot along the spending scale or pick a flavor. Uses a 4% withdrawal rate (25 times spending) and a 5% return after inflation. Part-time pay is take-home pay. The zone labels are rough community terms with no official cutoffs.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => { syncFlavorFromSpend(); draw(true); });
    function syncFlavorFromSpend() {
      if (flav === 'barista' || flav === 'coast') return;
      const z = zoneOf(st.n(K('sp')));
      if (z !== flav) setFlav(z, false);
    }
    const zoneOf = (sp) => (sp < 40000 ? 'lean' : sp >= 100000 ? 'fat' : 'fire');
    function setFlav(k, apply) {
      flav = k;
      $$('.fn-card', root).forEach((b) => { const on = b.dataset.f === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      if (apply) { const f = FLV.find((x) => x.k === k); st.set(K('sp'), f.set.sp); st.set(K('pt'), f.set.pt); }
    }
    root.addEventListener('click', (e) => { const b = e.target.closest('.fn-card'); if (!b || !root.contains(b)) return; setFlav(b.dataset.f, true); draw(true); });
    let geo = null;
    const draw = ui.responsive(fig, (W) => {
      const sp = st.n(K('sp')), pt = Math.min(st.n(K('pt')), sp), inv = st.n(K('inv')), age = st.n(K('age'));
      const R = Math.max(st.n(K('ret')), age + 1), r = 0.05, w = 0.04;
      const fireN = sp / w, barN = (sp - pt) / w, coastN = fireN / Math.pow(1 + r, R - age);
      const cp = W < 520;
      const x0 = cp ? 10 : 16, x1 = W - (cp ? 10 : 16);
      const sMin = 20000, sMax = 250000, X = SML.lin(sMin, sMax, x0, x1);
      const bandY = 38, bandH = 28;
      let b = S.text(x0, 12, 'YEARLY SPENDING', 'cap');
      const hx0 = X(SML.clamp(sp, sMin, sMax));
      [[20000, 40000, 'Lean', 'f-up-t s-up w15'], [40000, 100000, 'FIRE', 'f-acc-t s-acc w15'], [100000, 250000, 'Fat', 'f-vio-t s-vio w15']].forEach(([a, z, l, cls]) => {
        b += S.rect(X(a) + 1, bandY, X(z) - X(a) - 2, bandH, cls + ' ff-band', 3);
        const mid = (X(a) + X(z)) / 2, lw = l.length * 8;
        let lx = Math.abs(hx0 - mid) < lw / 2 + 16 ? (hx0 > mid ? hx0 - 16 - lw / 2 : hx0 + 16 + lw / 2) : mid;
        if (lx - lw / 2 >= X(a) + 3 && lx + lw / 2 <= X(z) - 3) b += S.text(lx, bandY + bandH / 2 + 4.5, l, 'md b ink', 'middle');
      });
      (cp ? [20000, 100000, 250000] : [20000, 40000, 100000, 150000, 200000, 250000]).forEach((t) => { b += S.text(X(t), bandY + bandH + 15, kd(t), 'xs mono', t === sMin ? 'start' : t === sMax ? 'end' : 'middle'); });
      const hx = X(SML.clamp(sp, sMin, sMax));
      const hl = `${kd(sp)} a year`;
      b += S.line(hx, bandY - 4, hx, bandY + bandH + 4, 's-ink w2');
      b += S.text(SML.clamp(hx, x0 + hl.length * 3.6, x1 - hl.length * 3.6), bandY - 9, hl, 'md b ink', 'middle');
      b += S.circle(hx, bandY + bandH / 2, 9, 'handle ff-band');
      /* target bars */
      const bTop = bandY + bandH + (cp ? 46 : 50), rowH = cp ? 46 : 48, barH = cp ? 16 : 18;
      const rows = [['fire', 'Full FIRE number', fireN], ['barista', `Barista number (with ${kd(pt)} part-time)`, barN], ['coast', `Coast number today (to retire at ${R})`, coastN]];
      const mx = Math.max(fireN, inv, 1) * 1.06;
      const lw = cp ? 54 : 70;
      const XB = SML.lin(0, mx, x0, x1 - lw);
      const selRow = flav === 'barista' ? 'barista' : flav === 'coast' ? 'coast' : 'fire';
      rows.forEach(([k, l, val], i) => {
        const y = bTop + i * rowH;
        const reached = inv >= val && val > 0;
        const sel = k === selRow;
        b += S.text(x0, y - 7, cp ? l.replace(' (with ', ' (').replace(' (to retire at ', ' (by ') : l, 'sm b ' + (sel ? 'acc' : 'ink'));
        b += S.rect(x0, y, x1 - lw - x0, barH, 'f-shade', 3);
        b += S.rect(x0, y, Math.max(2, XB(val) - x0), barH, reached ? 'f-up' : sel ? 'f-acc' : 'f-info o70', 3);
        b += S.text(XB(val) + 6, y + barH / 2 + 4.5, kd(val) + (reached ? ' ✓' : ''), 'sm mono b ' + (reached ? 'up' : 'ink'));
      });
      /* you marker */
      const yx = XB(Math.min(inv, mx));
      const yTop = bTop - 26, yBot = bTop + 2 * rowH + barH + 4;
      b += S.line(yx, yTop + 6, yx, yBot, 's-ink dash2 w15');
      const yl = `You: ${kd(inv)}`;
      b += tag(SML.clamp(yx, x0 + yl.length * 3.5 + 6, x1 - yl.length * 3.5 - 6), yBot + 16, yl, 'sm b ink', 'middle', cp);
      geo = { X, bandY, bandH };
      fig.innerHTML = S.wrap(W, yBot + 26, `Spending scale with your spending at ${kd(sp)}, and FIRE, Barista and Coast targets against ${kd(inv)} invested`, b);
      const zone = zoneOf(sp);
      $('#' + K('zone')).textContent = zone === 'lean' ? 'Lean' : zone === 'fat' ? 'Fat' : 'FIRE';
      $('#' + K('num')).textContent = kd(fireN);
      $('#' + K('bar')).textContent = kd(barN);
      $('#' + K('cst')).textContent = kd(coastN);
      let m;
      if (flav === 'barista') m = pt > 0 ? ui.msg('acc', 'Barista', `${usd0(pt)} a year of part-time work covers part of your ${usd0(sp)} budget, so the portfolio needs ${kd(barN)} instead of ${kd(fireN)}: ${kd(fireN - barN)} less.${inv >= barN ? ' You already have enough for this.' : ''}`) : ui.msg('acc', 'Barista', 'Move the part-time pay slider: every $1,000 a year of take-home pay cuts $25,000 from the number.');
      else if (flav === 'coast') m = inv >= coastN ? ui.msg('up', 'Coasting', `${kd(inv)} grows to about ${kd(inv * Math.pow(1 + r, R - age))} by ${R} with no more saving, above your ${kd(fireN)} target. Work only has to pay today's ${usd0(sp)} a year.`) : ui.msg('acc', 'Coast', `To coast to ${R} you need ${kd(coastN)} invested today; you have ${kd(inv)}. Close the ${kd(coastN - inv)} gap and saving becomes optional.`);
      else {
        const lbl = zone === 'lean' ? 'Lean FIRE' : zone === 'fat' ? 'Fat FIRE' : 'FIRE';
        m = ui.msg(zone === 'lean' ? 'up' : zone === 'fat' ? 'vio' : 'acc', lbl, `Spending ${usd0(sp)} a year means a target of ${kd(fireN)}. ${zone === 'fat' ? 'A bigger life needs a bigger number and usually more years of work.' : zone === 'lean' ? 'A small budget gets you there sooner but leaves less room for surprises.' : 'Each $1,000 a year you spend adds $25,000 to the target.'}${inv >= fireN ? ' You already have it.' : ` You are ${Math.round(inv / fireN * 100)}% of the way.`}`);
      }
      $('#' + K('msg')).innerHTML = m;
    });
    ui.drag(fig, { sel: '.ff-band', start: (pt) => setSp(pt), move: (pt) => setSp(pt) });
    function setSp(pt) { if (!geo) return; const val = Math.round(SML.clamp(geo.X.inv(pt.x), 20000, 250000) / 1000) * 1000; if (val !== st.n(K('sp'))) { st.set(K('sp'), val); syncFlavorFromSpend(); draw(true); } }
  };

  /* =====================================================================
     coastFire: coast line by age, the target dot and work income needed
     ===================================================================== */
  SML.widgets.coastFire = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('cf');
    const K = (k) => id + '-' + k;
    root.innerHTML = `
      <div class="wg-fig"></div>
      <div class="fn-ctab" id="${K('tab')}"></div>
      <div class="wg-read">${ui.stat('Coast number now', K('c0'), 'hl')}${ui.stat('Invested now', K('bv'))}${ui.stat('Coast reached', K('when'))}${ui.stat('Take-home pay needed', K('inc'))}</div>
      <div class="wg-msg" id="${K('msg')}"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: K('age'), label: 'Your age', min: 20, max: 60, step: 1, value: 35, fmt: 'num' })}
        ${ui.slider({ id: K('b'), label: 'Invested now', min: 0, max: 1500000, step: 5000, value: 250000, fmt: kd })}
        ${ui.slider({ id: K('save'), label: 'Saved per year', min: 0, max: 100000, step: 1000, value: 20000, fmt: 'usd0' })}
        ${ui.slider({ id: K('R'), label: 'Full retirement at', min: 45, max: 70, step: 1, value: 60, fmt: 'num' })}
        ${ui.slider({ id: K('sp'), label: 'Yearly spending', min: 20000, max: 200000, step: 1000, value: 50000, fmt: 'usd0' })}
        ${ui.slider({ id: K('wr'), label: 'Withdrawal rate', min: 3, max: 5, step: 0.25, value: 4, fmt: (v) => v.toFixed(2) + '%' })}
        ${ui.slider({ id: K('ret'), label: 'Return after inflation', min: 3, max: 8, step: 0.5, value: 5, fmt: 'pct1' })}
      </div>
      <div class="wg-note">Drag the target dot to change your retirement age. Work income here is take-home pay: gross pay must be higher to cover payroll and income taxes. Today's dollars with a steady return after inflation; real returns vary, so recheck every year and keep a margin.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => draw(true));
    let geo = null;
    const draw = ui.responsive(fig, (W) => {
      const age = st.n(K('age')), B = st.n(K('b')), save = st.n(K('save')), sp = st.n(K('sp')), w = st.n(K('wr')) / 100, r = st.n(K('ret')) / 100;
      const R = Math.max(st.n(K('R')), age + 1);
      const N = sp / w, Y = R - age, C0 = N / Math.pow(1 + r, Y);
      const coastAt = (a) => N / Math.pow(1 + r, R - a);
      /* coast age if you keep saving: yearly steps, interpolated */
      let cAge = B >= C0 ? age : Infinity;
      const sav = [[age, B]];
      if (B < C0) {
        let bal = B;
        for (let t = 1; t <= Y; t++) {
          const nb = bal * (1 + r) + save, a = age + t;
          if (nb >= coastAt(a)) {
            const gPrev = bal - coastAt(a - 1), gNow = nb - coastAt(a);
            cAge = a - 1 + (gPrev < 0 ? -gPrev / (gNow - gPrev) : 0);
            bal = nb; sav.push([a, nb]); break;
          }
          bal = nb; sav.push([a, nb]);
        }
        if (isFinite(cAge)) { const last = sav[sav.length - 1]; for (let a = last[0] + 1; a <= R; a++) sav.push([a, sav[sav.length - 1][1] * (1 + r)]); }
      }
      const endNoSave = B * Math.pow(1 + r, Y);
      const cp = W < 520;
      const x0 = cp ? 44 : 58, x1 = W - (cp ? 12 : 22);
      const top = 26, ch = cp ? 200 : 240, base = top + ch;
      const yMax = Math.max(N, endNoSave, sav[sav.length - 1][1]) * 1.15;
      const X = SML.lin(age, R, x0, x1), YY = SML.lin(0, yMax, base, top);
      let b = '';
      if (cp) {
        let lx = 4;
        [['s-acc w25', '', 'Coast line'], ['s-info w25', '', 'Saving'], ['s-mut w2 dash', '', 'No saving']].forEach(([cls, , l]) => { b += S.line(lx, 9, lx + 16, 9, cls) + S.text(lx + 21, 13, l, 'sm'); lx += 21 + l.length * 6.3 + 14; });
      } else b += S.text(x0, 12, 'INVESTED, BY AGE', 'cap');
      const yt = SML.ticks(0, yMax, cp ? 3 : 4);
      b += S.hgrid(yt.map(YY), x0, x1) + yt.map((t) => S.text(x0 - 6, YY(t) + 4, kd(t), 'xs mono', 'end')).join('');
      const xt = SML.ticks(age, R, cp ? 4 : 7).filter((t) => t >= age && t <= R && Math.abs(t - Math.round(t)) < 1e-6);
      b += S.line(x0, base, x1, base, 's-line') + xt.map((t) => S.text(X(t), base + 16, String(t), 'xs mono', 'middle')).join('');
      /* coast zone (above the coast line) */
      const cl = [];
      for (let i = 0; i <= 60; i++) { const a = age + (R - age) * i / 60; cl.push([X(a), YY(Math.min(coastAt(a), yMax))]); }
      b += S.polygon(cl.concat([[x1, top], [x0, top]]), 'f-up-t o50');
      b += S.poly(cl, 's-acc w25');
      if (!cp) {
        b += tag(x0 + 8, top + 16, 'Coast zone: no more saving needed', 'sm b up', 'start', cp);
        b += tag(cl[12][0] + 6, cl[12][1] + 22, 'Coast line', 'sm b acc', 'start', cp);
      }
      /* paths */
      const ns = [];
      for (let i = 0; i <= 60; i++) { const a = age + (R - age) * i / 60; ns.push([X(a), YY(B * Math.pow(1 + r, a - age))]); }
      b += S.poly(ns, B >= C0 ? 's-up w25' : 's-mut w2 dash');
      if (B < C0 && sav.length > 1) {
        const pre = sav.filter(([a]) => a <= Math.ceil(cAge)), post = sav.filter(([a]) => a >= Math.ceil(cAge));
        b += S.poly(pre.map(([a, v]) => [X(a), YY(v)]), 's-info w25');
        if (post.length > 1) b += S.poly(post.map(([a, v]) => [X(a), YY(v)]), 's-info w15 dash2');
      }
      if (B < C0 && !cp) b += tag(X(age + (R - age) * 0.62), YY(B * Math.pow(1 + r, (R - age) * 0.62)) + 18, 'If you stop saving today', 'sm mut', 'middle', cp);
      if (isFinite(cAge) && cAge > age) {
        const cx = X(cAge), cy = YY(coastAt(cAge));
        b += S.circle(cx, cy, 6, 'f-info s-surf w2') + tag(cx > x1 - 110 ? cx - 10 : cx + 10, cy - 12, `Coast at ${Math.ceil(cAge)}`, 'sm b info', cx > x1 - 110 ? 'end' : 'start', cp);
      }
      /* target */
      const tx = X(R), ty = YY(N);
      b += S.line(x0, ty, x1, ty, 's-acc dash2 w15');
      b += cp ? tag(x0 + 8, ty - 10, `FIRE number ${kd(N)} at ${R}`, 'sm b acc', 'start', cp) : tag(tx - 14, ty - 14, `FIRE number ${kd(N)} at ${R}`, 'md b acc', 'end', cp);
      b += S.circle(tx, ty, 9, 'handle cf-drag');
      b += S.rect(x0, base - 6, x1 - x0, 30, 'hit cf-drag');
      geo = { X };
      fig.innerHTML = S.wrap(W, base + 26, `Coast line from age ${age} to ${R}, your balance of ${kd(B)} and the FIRE number of ${kd(N)}`, b);
      /* coast number by age */
      const ages = []; for (let a = 25; a < R; a += 5) ages.push(a);
      $('#' + K('tab')).innerHTML = `<div class="hd">Coast number by age, to retire at ${R} on ${kd(sp)} a year</div>` + ages.map((a) => `<div class="${a <= age && a + 5 > age ? 'on' : a < age ? 'past' : ''}"><span>Age ${a}</span><b>${kd(coastAt(a))}</b></div>`).join('');
      $('#' + K('c0')).textContent = kd(C0);
      $('#' + K('bv')).textContent = kd(B);
      $('#' + K('when')).textContent = B >= C0 ? 'Now' : isFinite(cAge) ? 'Age ' + Math.ceil(cAge) : 'Not by ' + R;
      $('#' + K('inc')).textContent = usd0(sp);
      const draw4 = Math.max(0, sp - w * B);
      let m;
      if (B >= C0) m = ui.msg('up', 'Coasting', `${kd(B)} grows to about ${kd(endNoSave)} by ${R} with no more saving, past your ${kd(N)} target. From here work only has to bring home your ${usd0(sp)} a year. Barista FIRE instead: drawing ${(w * 100).toFixed(2).replace(/0$/, '')}% now (${usd0(w * B)}) leaves ${usd0(draw4)} a year of take-home pay for work to cover, for as long as you do it.`);
      else if (isFinite(cAge)) m = ui.msg('info', 'Keep going', `You need ${kd(C0)} today to coast; you have ${kd(B)}. Saving ${usd0(save)} a year, you cross the coast line around age ${Math.ceil(cAge)}. After that, work only has to bring home your ${usd0(sp)} a year.`);
      else m = ui.msg('dn', 'Not by ' + R, `At ${usd0(save)} a year you never cross the coast line before ${R}. Save more, spend less in retirement or retire a little later.`);
      $('#' + K('msg')).innerHTML = m;
    });
    const setR = (pt) => { if (!geo) return; const a = Math.round(geo.X.inv(pt.x)); const age = st.n(K('age')); const R = SML.clamp(a, Math.max(45, age + 1), 70); if (R !== st.n(K('R'))) { st.set(K('R'), R); draw(true); } };
    ui.drag(fig, { sel: '.cf-drag', start: setR, move: setR });
  };

  /* =====================================================================
     lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-fire-intro', course: 'fi-basics', order: 1, title: 'What FIRE really means', mins: 7, level: 'Beginner',
    summary: 'Financial independence, retire early: the idea, the flavors and the math behind them.',
    idea: 'Save and invest enough that your investments pay your bills, so work becomes a choice instead of a need.',
    widget: 'fireFlavors',
    try: 'Drag your yearly spending along the scale, then pick a flavor to see how the targets change.',
    body: [
      '<h3>The idea in one line</h3><p><b>FIRE</b> stands for financial independence, retire early. You are financially independent when your investments can pay your yearly spending for the rest of your life. The "retire early" part is optional: many people keep working, just on their own terms.</p>',
      '<h3>The target is set by spending</h3><p>Your target depends on what you spend, not what you earn. A common rule of thumb is about 25 times your yearly spending, which comes from the <a href="#l-swr">4% rule</a>. Spend $50,000 a year and the target is about $1.25 million. Spend $35,000 and it drops to $875,000.</p><p>Every $1,000 a year you don\'t need cuts $25,000 from the target and adds $1,000 a year to what you can save. That double effect is why <a href="#l-savings-rate">savings rate</a> matters so much.</p>',
      '<h3>The flavors</h3><ul><li><b>Lean FIRE</b>: a small budget. Faster, with little room for surprises.</li><li><b>FIRE</b>: roughly your current lifestyle.</li><li><b>Fat FIRE</b>: a large budget with room for travel and comfort. A bigger number and a longer road.</li><li><b>Barista FIRE</b>: leave the full-time job while part-time work covers some spending and, ideally, health insurance.</li><li><b>Coast FIRE</b>: you have enough invested that it will grow into your number by a normal retirement age, so you only need to earn today\'s costs (<a href="#l-coast-fire">more here</a>).</li></ul><p>The labels are rough community terms. There are no official cutoffs.</p>',
      '<h3>What FIRE takes</h3><ul><li>A high savings rate, often 30% to 70% of take-home pay.</li><li>Low-cost, diversified investing held for many years (<a href="#l-index-funds">index funds</a>).</li><li>A plan for what your job used to cover: health insurance (<a href="#l-aca">before 65</a>), taxes on <a href="#l-fire-tax">withdrawals</a> and getting money out of retirement accounts <a href="#l-early-access">before 59½</a>.</li></ul>',
      '<h3>What it does not take</h3><p>You don\'t need a huge salary, stock picking or a lucky bet. Most people who get there use ordinary index funds and keep a big gap between income and spending for 10 to 25 years.</p>',
    ],
    example: {
      title: 'Three People, Five Flavors',
      intro: 'Same 25-times rule, very different targets. All amounts in today\'s dollars, with a 5% return after inflation.',
      steps: [
        'Ana spends $36,000 a year. Her Lean FIRE number is $36,000 × 25 = $900,000.',
        'Ben and Cole spend $70,000 a year as a couple. Their FIRE number is $70,000 × 25 = $1,750,000.',
        'Dee wants $140,000 a year for travel and a bigger home: $140,000 × 25 = $3,500,000, a Fat FIRE target.',
        'Ben takes a part-time job that brings home $25,000 a year after tax. Now the portfolio only has to cover $45,000: $45,000 × 25 = $1,125,000. That Barista FIRE number is $625,000 lower.',
        'Ana is 30 and has $250,000 invested. With no more saving it grows to about $250,000 × 1.05^30 ≈ $1,080,000 by 60, more than her $900,000 target. She has reached Coast FIRE and only needs to earn her $36,000 a year of costs.',
      ],
      result: 'The flavor you pick sets the target, and spending is the biggest dial you control.',
    },
    mistakes: [
      'Copying a number from a blog instead of using your own spending. Your target is your spending times about 25.',
      'Forgetting costs your job covered: health insurance, taxes on withdrawals, and replacing cars and roofs.',
      'Treating Lean FIRE as a finish line with no cushion. A thin budget leaves little room for a bad market or a big bill.',
      'Assuming FIRE means never earning again. A little income later makes almost any plan much safer.',
    ],
    points: [
      'Financial independence means your investments can pay your spending for life.',
      'A rough target is 25 times yearly spending, from the 4% rule.',
      'Lean, regular and Fat FIRE differ by budget. Barista and Coast FIRE are ways to leave full-time work sooner.',
      'Before you quit, plan for health insurance, taxes and early access to retirement accounts.',
    ],
    terms: ['FIRE', 'FIRE number', 'Lean FIRE', 'Fat FIRE', 'Barista FIRE', 'Coast FIRE'],
    quiz: { q: 'You spend $48,000 a year. Using 25 times spending, what is your rough FIRE number?', options: ['$480,000', '$1,200,000', '$2,400,000'], answer: 1, why: '$48,000 × 25 = $1,200,000, the same as dividing by a 4% withdrawal rate.' },
    sources: [{ t: 'The Motley Fool: types of FIRE and which one is right for you (2025)', u: 'https://www.fool.com/retirement/2025/07/26/types-of-fire-which-one-is-right-for-you/' }, { t: 'Advisor Perspectives: Bill Bengen boosts the 4% rule to 4.7% (2025)', u: 'https://www.advisorperspectives.com/articles/2025/08/29/bill-bengen-boosts-the-4-rule-to-4-7' }],
  });

  SML.lessons.push({
    id: 'l-avg-spending', course: 'fi-basics', order: 2, title: 'Find your real spending', mins: 7, level: 'Beginner',
    summary: 'Average a full year, including the costs that only show up now and then.',
    idea: 'Your FIRE number is built on spending, so use a full year of real numbers, including bills that come once a year or once a decade.',
    widget: 'spendAverager',
    try: 'Pick a household, adjust the monthly costs, then switch irregular costs on and off and watch the true average move.',
    body: [
      '<h3>Why a typical month lies</h3><p>Most months look calm. Then the car needs tires, the insurance renews, December arrives and the water heater dies. A budget built from a typical month can easily miss 10% to 25% of what you really spend. For a sense of scale, the average US household spent $78,535 in 2024, according to the government\'s Consumer Expenditure Surveys.</p>',
      '<h3>Three ways to find your number</h3><ul><li><b>Look back 12 months.</b> Download a year of bank and card transactions and add them up. This is the most honest number.</li><li><b>Track forward.</b> Use an app or a spreadsheet for three months, then add the yearly costs you know are coming.</li><li><b>Build it up.</b> Use the calculator above: monthly costs plus every irregular cost divided by how often it happens.</li></ul><p>Use the look-back if you can. See <a href="#l-track-spending">tracking your spending</a> for tools.</p>',
      '<h3>Annualize the lumpy costs</h3><p>Divide each irregular cost by how many years it lasts. A $28,000 car every 10 years is $2,800 a year. A $5,000 round of appliances and electronics every 5 years is $1,000 a year. Move that money aside monthly into a <b>sinking fund</b> so the bill never becomes a crisis.</p>',
      '<h3>Adjust for retirement</h3><ul><li><b>Goes away:</b> retirement contributions, commuting, work clothes, and the mortgage payment if it will be paid off.</li><li><b>Stays:</b> property tax, home insurance and repairs, even with no mortgage.</li><li><b>Goes up:</b> health insurance (often the biggest new cost before <a href="#l-aca">Medicare at 65</a>), travel and hobbies, and <a href="#l-fire-tax">taxes on withdrawals</a>.</li><li><b>Changes over time:</b> kids grow up and leave, and health costs rise with age.</li></ul>',
      '<h3>Then add a cushion</h3><p>Many planners add about 10% for things nobody can list in advance. Watch for <b>lifestyle creep</b>, where spending rises with every raise: it quietly pushes your target further away.</p>',
    ],
    example: {
      title: 'The Family That Thought It Spent $5,000 a Month',
      steps: [
        'A family adds up a typical month: housing $2,400, food $1,100, transport $500, utilities $350, health $400 and everything else $250. Total: $5,000 a month, or $60,000 a year.',
        'Then the yearly bills: insurance $2,200, travel $4,000, holidays and gifts $1,500, car repairs $1,400 and home repairs $3,500. That adds $12,600.',
        'Then the long-cycle costs: a $28,000 car every 10 years ($2,800 a year) and $5,000 of appliances and electronics every 5 years ($1,000 a year). That adds $3,800.',
        'True yearly spending: $60,000 + $12,600 + $3,800 = $76,400. The typical-month budget missed $16,400, about 21% of what they really spend (27% more than the budget).',
        'At 25 times spending, that gap is $16,400 × 25 = $410,000 of FIRE number they would have been missing.',
      ],
      result: 'Count the whole year. A number built on a typical month can leave you hundreds of thousands short.',
    },
    mistakes: [
      'Using a calm month as your budget and forgetting yearly and once-a-decade bills.',
      'Dropping the mortgage from retirement spending but also forgetting the property tax, insurance and repairs that stay.',
      'Leaving out health insurance because an employer pays most of it today.',
      'Counting retirement contributions as spending. They stop when you stop working.',
    ],
    points: [
      'Use 12 months of real transactions when you can.',
      'Annualize lumpy costs: divide each by how many years it lasts, and save for it monthly.',
      'Adjust for retirement: some costs end, health insurance and taxes begin.',
      'Every $1,000 a year of spending adds about $25,000 to your FIRE number.',
    ],
    terms: ['Budget', 'Sinking fund', 'Lifestyle creep', 'FIRE number', 'Emergency fund'],
    sources: [{ t: 'US Bureau of Labor Statistics: Consumer Expenditure Surveys', u: 'https://www.bls.gov/cex/' }],
    quiz: { q: 'You replace a $30,000 car every 10 years. How much should your yearly spending include for it?', options: ['Nothing, it is not a monthly bill', '$3,000', '$30,000, but only in the year you buy'], answer: 1, why: '$30,000 ÷ 10 years = $3,000 a year, set aside monthly in a sinking fund.' },
    
  });

  SML.lessons.push({
    id: 'l-fire-number', course: 'fi-basics', order: 3, title: 'Your FIRE number', mins: 9, level: 'Beginner',
    summary: 'Spending, withdrawal rate, other income and your whole net worth in one number.',
    idea: 'Your FIRE number is the invested money that can pay your yearly spending, after other income, for the rest of your life.',
    widget: 'fireNumber',
    try: 'Pick a household and type in your accounts. Then move spending and the withdrawal rate, and hover the chart to see each year.',
    body: [
      '<h3>The formula</h3><p><b>FIRE number = (yearly spending − other yearly income) ÷ withdrawal rate.</b> At a 4% withdrawal rate that is 25 times; at 3.5% about 28.6 times; at 3.25% about 30.8 times.</p>',
      '<h3>What goes into spending</h3><ul><li>Your real yearly spending from <a href="#l-avg-spending">the last lesson</a>.</li><li><b>Health insurance and care.</b> Retire before 65 and you buy your own coverage. For 2026, marketplace subsidies stop completely above 400% of the federal poverty level: a MAGI (modified adjusted gross income, not your spending) of about $62,600 for one person, $84,600 for two and $128,600 for a family of four. Below the line, the lower your MAGI the less you pay: a couple at about $42,300 pays roughly 6.6% of income for the benchmark plan, about $230 a month, versus about $660 a month at $80,000. See <a href="#l-aca">health insurance before 65</a>.</li><li><b>Taxes on withdrawals.</b> Often low in early retirement, but rarely zero; see <a href="#l-fire-tax">how withdrawals are taxed</a>.</li></ul>',
      '<h3>Pick a withdrawal rate</h3><p>The 4% rule comes from William Bengen\'s 1994 study of 30-year retirements: the worst historical start still lasted 30 years at about 4.15%. In 2025 he raised his figure to 4.7% for a more diversified portfolio, while Morningstar\'s estimate for 2026 is 3.9% (30 years, 90% success). If you stop at 40, your money may need to last 50 years or more, and research on 40- to 60-year retirements points to roughly 3.25% to 3.5%. Being willing to cut spending in bad years lets you start higher. See <a href="#l-swr">the 4% rule and its limits</a>.</p>',
      '<h3>Other income lowers the number</h3><p>Rent from a property or steady part-time work reduces what your portfolio must pay. Social Security helps too, but benefits start at 62 at the earliest, so you need a <b>bridge</b>: money set aside to cover the years until they begin. The calculator adds that bridge for you. Be careful with the estimate: your SSA statement assumes you keep working until you claim. Stopping early fills your 35-year record with zero years and lowers the benefit, so use an estimate with no future earnings (<a href="#l-ss-early">see how much</a>).</p>',
      '<h3>Count your net worth carefully</h3><ul><li><b>Count fully:</b> taxable brokerage, Roth accounts and HSA.</li><li><b>Count with care:</b> pre-tax 401(k) and IRA money is taxed when it comes out, so some people count it at about 85%.</li><li><b>Subtract debts</b> you will still owe when you stop, such as car or student loans. A mortgage you keep paying can stay as a debt, or you can leave the balance out and put the payment in your spending, but not both.</li><li><b>Rental property or a business:</b> count it once. Either as equity you will sell, or as the yearly income it pays you (in other income), never both.</li><li><b>Pensions and annuities</b> are income streams, not assets: put the payments in other income.</li><li><b>Usually leave out:</b> home equity unless you will sell or downsize, the emergency cash you want to keep, cars and belongings.</li></ul><p>Counting the house is the most common way people fool themselves: you cannot buy groceries with a living room.</p>',
    ],
    example: {
      title: 'A Couple at 38',
      intro: 'All amounts in today\'s dollars, with a 5% return after inflation. It matches the Couple preset above.',
      steps: [
        'Living spending is $65,000, health insurance $14,000 and taxes $3,000: $82,000 a year.',
        'At a 4% withdrawal rate the FIRE number is $82,000 ÷ 0.04 = $2,050,000.',
        'They count $160,000 taxable, $210,000 pre-tax at 85% ($178,500), $45,000 Roth and $12,000 HSA: $395,500. They leave out $30,000 of emergency cash and $180,000 of home equity, and have no other debts. That is about 19% of the way.',
        'Saving $45,000 a year, they reach $2,050,000 in about 17 years, around age 55.',
        'Now add Social Security. Their SSA statement shows $38,000 a year at 67, but it assumes they keep working until then. With no earnings after their early 50s, a fairer estimate is about $28,000 a year. The portfolio then needs ($82,000 − $28,000) ÷ 0.04 = $1,350,000 for the long run, plus a bridge for the years before 67.',
        'Retiring around 53 means about 14 bridge years, roughly $400,000, so the target is about $1.75 million, reached in about 15 years.',
      ],
      result: 'Spending sets the target, other income shrinks it, and only money you can actually spend counts toward it.',
    },
    mistakes: [
      'Counting the equity in a home you plan to keep living in, or emergency cash you will never spend.',
      'Using 4% for a 50-year retirement with no plan to cut spending in bad years.',
      'Forgetting the gap between retiring and Social Security, which starts at 62 at the earliest.',
      'Leaving health insurance and taxes out of retirement spending.',
    ],
    points: [
      'FIRE number = (spending − other income) ÷ withdrawal rate.',
      'For long retirements, 3.25% to 3.5% is the cautious range; 4% works better with flexible spending.',
      'Social Security lowers the number but needs a bridge until it starts, and an early stop lowers the benefit.',
      'Count invested money you can spend; treat pre-tax money as partly taxed and leave out the house.',
    ],
    terms: ['FIRE number', 'Withdrawal rate', 'Safe withdrawal rate', '4% rule', 'Net worth', 'Social Security'],
    glossary: [{ t: 'Social Security bridge', d: 'Money set aside to cover the spending Social Security will later pay, for the years between retiring and the first benefit check.' }],
    quiz: { q: 'You spend $60,000 a year and earn $12,000 a year from a small rental. At a 4% withdrawal rate, what is your FIRE number?', options: ['$1,500,000', '$1,200,000', '$1,800,000'], answer: 1, why: '($60,000 − $12,000) ÷ 0.04 = $1,200,000. The rental covers part of the spending.' },
    sources: [{ t: 'Early Retirement Now: the ultimate guide to safe withdrawal rates, part 1', u: 'https://earlyretirementnow.com/2016/12/07/the-ultimate-guide-to-safe-withdrawal-rates-part-1-intro/' }, { t: 'Advisor Perspectives: Bill Bengen boosts the 4% rule to 4.7% (2025)', u: 'https://www.advisorperspectives.com/articles/2025/08/29/bill-bengen-boosts-the-4-rule-to-4-7' }, { t: 'Morningstar: what is a safe retirement withdrawal rate for 2026?', u: 'https://www.morningstar.com/retirement/whats-safe-retirement-withdrawal-rate-2026' }, { t: 'SSA: benefit reduction for early retirement', u: 'https://www.ssa.gov/benefits/retirement/planner/agereduction.html' }, { t: 'ASTHO: enhanced ACA premium tax credits expired after 2025', u: 'https://www.astho.org/communications/blog/2026/aca-enhanced-premium-tax-credits-legislative-developments-2025-2026/' }],
  });

  SML.lessons.push({
    id: 'l-savings-rate', course: 'fi-basics', order: 4, title: 'Savings rate is the lever', mins: 6, level: 'Beginner',
    summary: 'Why the share of income you save decides how many years you work.',
    idea: 'A higher savings rate works twice: more money invested each year, and a smaller target because you live on less.',
    widget: 'savingsRate',
    try: 'Drag the dot along the curve, or move the sliders, to see how many working years each savings rate costs.',
    body: [
      '<h3>The shockingly simple math</h3><p>In 2012 the blogger Mr. Money Mustache showed that, starting from zero, the years until financial independence depend almost entirely on one number: your <b>savings rate</b>, the share of take-home pay you save. Income barely matters, because a high earner who spends it all is no closer than anyone else.</p>',
      '<h3>Why it works twice</h3><p>Saving more puts more money to work each year, and it proves you can live on less, which shrinks your target. At 10% you save $1 for every $9 you spend, so piling up 25 years of spending takes most of a career. At 50% you save $1 for every $1 you spend, so each working year funds a year of freedom before any growth.</p>',
      '<h3>The table</h3><p>With a 5% return after inflation, a 4% withdrawal rate and nothing saved to start: <b>10%</b> takes about 51 years, <b>25%</b> about 32, <b>50%</b> roughly 16 to 17 and <b>75%</b> about 7. The chart above runs the same math with your numbers.</p>',
      '<h3>How to raise it</h3><ul><li><b>The big three:</b> housing, transport and food are most of most budgets. One change there beats a hundred small cuts, though <a href="#l-latte">small habits add up</a> too.</li><li><b>Save your raises.</b> Send most of every raise to savings before it turns into lifestyle creep.</li><li><b>Automate.</b> Pay yourself first with automatic transfers on payday.</li><li><b>Use the tax breaks.</b> A <a href="#l-401k-match">401(k) match</a> and an <a href="#l-hsa">HSA</a> make each dollar saved go further.</li></ul>',
      '<h3>How to measure it</h3><p>Simple version: money saved ÷ take-home pay. Fuller version: add your pre-tax 401(k) contributions and the employer match to both the top and the bottom. Pick one method and stick with it so you can see progress month to month.</p>',
    ],
    example: {
      title: 'Two Ways to Use a Raise',
      intro: 'A 5% return after inflation and a 4% withdrawal rate, starting from zero.',
      steps: [
        'Jo takes home $80,000 and saves $16,000, a 20% savings rate. She needs about 37 years.',
        'Her target is her spending times 25: $64,000 × 25 = $1,600,000.',
        'She gets a $20,000 raise and saves all of it. Take-home pay is now $100,000 and saving is $36,000, a 36% rate, while spending stays at $64,000.',
        'At 36% she needs about 24 years. Keeping spending flat cut about 13 years of work.',
        'Had she spent the raise and kept saving $16,000, her rate would fall to 16%, her target would rise to $84,000 × 25 = $2,100,000 and the road would stretch to about 41 years.',
      ],
      result: 'Same raise, a 17-year difference. What you do with extra income matters more than the income itself.',
    },
    mistakes: [
      'Chasing a higher salary while spending rises with it, so the savings rate never moves.',
      'Cutting tiny costs while ignoring housing and cars, the biggest lines in most budgets.',
      'Measuring the savings rate a different way each month, so you cannot see progress.',
      'Treating the table as exact. Returns vary, and the order of good and bad years matters.',
    ],
    points: [
      'Years to financial independence depend mostly on your savings rate.',
      'Saving more both adds money and shrinks the target.',
      'From zero, about 17 years at a 50% rate and about 51 years at 10% (5% real return, 4% withdrawal).',
      'Raises that are saved, not spent, are the fastest lever most people have.',
    ],
    terms: ['Savings rate', 'Lifestyle creep', 'Pay yourself first', 'Compound interest', 'Real return'],
    quiz: { q: 'Two people both take home $100,000. One saves $50,000 a year, the other $20,000. With a 5% real return and the 4% rule, who reaches FI sooner, and by about how much?', options: ['Neither, their incomes are equal', 'The 50% saver, about 20 years sooner', 'The 50% saver, about 2 years sooner'], answer: 1, why: 'About 17 years at 50% versus about 37 years at 20%. The savings rate sets the pace, not the income.' },
    sources: [{ t: 'Mr. Money Mustache: the shockingly simple math behind early retirement (2012)', u: 'https://www.mrmoneymustache.com/2012/01/13/the-shockingly-simple-math-behind-early-retirement/' }],
  });

  SML.lessons.push({
    id: 'l-coast-fire', course: 'fi-basics', order: 5, title: 'Coast FIRE and Barista FIRE', mins: 7, level: 'Intermediate',
    summary: 'Save hard early, then let compounding finish the job while work only covers today.',
    idea: 'Once your investments can grow into your number on their own, you only need to earn what you spend today.',
    widget: 'coastFire',
    try: 'Move your age, balance and savings. Drag the amber target dot to change when you fully retire.',
    body: [
      '<h3>Coast FIRE</h3><p>You reach <b>Coast FIRE</b> when the money you already have will grow into your FIRE number by your chosen retirement age, with no more saving. From then on you only need to earn enough to pay your bills. That can mean a lower-stress job, fewer hours or a career change.</p><p><b>Coast number = FIRE number ÷ (1 + real return)<sup>years to retirement</sup>.</b> At a 5% return after inflation, money roughly doubles every 14 years (the <a href="#l-compound">rule of 72</a>), so time does the heavy lifting.</p>',
      '<h3>Barista FIRE</h3><p><b>Barista FIRE</b> means leaving full-time work while part-time income covers part of your spending and your portfolio covers the rest. The name comes from the idea of a part-time coffee-shop job with health benefits. Every $1,000 a year of take-home pay cuts $25,000 from a 4% target, so $25,000 a year cuts $625,000.</p>',
      '<h3>Health insurance is the catch</h3><p>A part-time job with health insurance is gold before 65. Without one you buy marketplace coverage, where your MAGI (modified adjusted gross income) sets the subsidy, and part-time wages count toward it. See <a href="#l-aca">health insurance before 65</a> and <a href="#l-health-bridge">bridging the gap to Medicare</a>.</p>',
      '<h3>Risks to know</h3><ul><li><b>Growth is not guaranteed.</b> A coast plan assumes years of returns, and a weak decade can leave you short. Recheck every year.</li><li><b>Spending creeps.</b> If retirement spending ends up higher than planned, the coast number was too low.</li><li><b>Fewer earning years can lower Social Security</b> (<a href="#l-ss-early">why</a>).</li><li><b>Keep a margin.</b> Many people keep saving a little even after crossing the line.</li></ul>',
    ],
    example: {
      title: 'Coasting From 35',
      intro: 'A 5% return after inflation and a 4% withdrawal rate.',
      steps: [
        'Sam is 35, expects to spend $50,000 a year and wants to fully retire at 60. FIRE number: $50,000 × 25 = $1,250,000.',
        'Years to 60: 25. Coast number: $1,250,000 ÷ 1.05^25 = $1,250,000 ÷ 3.386 ≈ $369,000.',
        'Sam has $380,000 invested, a little above the coast number. With no new saving it should grow to about $1,287,000 by 60.',
        'Sam moves to a 30-hour job paying about $60,000 a year before tax. After payroll tax and federal income tax (single, 2026 standard deduction) that leaves about $50,400, enough for the $50,000 of spending before any state tax.',
        'Barista FIRE instead: $380,000 supports about $15,200 a year at 4%, so part-time work would have to bring home the other $34,800 for as long as it lasts. Coasting asks for more work income now but leads to full retirement at 60.',
      ],
      result: 'Once you cross the coast number, work only has to pay today\'s bills.',
    },
    mistakes: [
      'Using an optimistic return. At 7% instead of 5%, the coast number in the example looks about 38% smaller.',
      'Mixing nominal and real numbers. If your FIRE number is in today\'s dollars, use a return after inflation.',
      'Stopping all saving the day you cross the line, with no margin for a bad decade.',
      'Cutting back to part-time work without a plan for health insurance.',
    ],
    points: [
      'Coast number = FIRE number ÷ (1 + real return) ^ years to retirement.',
      'After Coast FIRE, work only has to cover today\'s spending, after tax.',
      'Barista FIRE lets part-time income pay part of the bills, shrinking the number.',
      'Recheck every year and keep a margin: growth is not guaranteed.',
    ],
    terms: ['Coast FIRE', 'Barista FIRE', 'FIRE number', 'Compound interest', 'Real return'],
    quiz: { q: 'Your FIRE number is $1,000,000 and you plan to fully retire in 28 years. With a 5% return after inflation, roughly what coast number do you need today?', options: ['$1,000,000', 'About $255,000', 'About $500,000'], answer: 1, why: '$1,000,000 ÷ 1.05^28 ≈ $1,000,000 ÷ 3.92 ≈ $255,000.' },
    sources: [{ t: 'The Motley Fool: types of FIRE and which one is right for you (2025)', u: 'https://www.fool.com/retirement/2025/07/26/types-of-fire-which-one-is-right-for-you/' }],
  });
})();
