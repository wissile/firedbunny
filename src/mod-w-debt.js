/* Debt & Credit course (Retirement & Wealth track): credit scores, card debt payoff, 0% balance transfers, car cash vs loan. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 0 : 1) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e4 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const usd0 = (v) => F.usd(Math.round(v), 0);
  const pct = (v, d) => trim(v, d == null ? 1 : d) + '%';
  const dur = (m) => { if (!isFinite(m)) return 'never'; const y = Math.floor(m / 12), r = m % 12; if (!y) return m + (m === 1 ? ' month' : ' months'); return y + (y === 1 ? ' yr' : ' yrs') + (r ? ' ' + r + ' mo' : ''); };
  const durShort = (m) => { if (!isFinite(m)) return 'never'; const y = Math.floor(m / 12), r = m % 12; if (!y) return m + ' mo'; return y + 'y' + (r ? ' ' + r + 'm' : ''); };

  function tipper(fig) {
    let tip = null;
    return {
      show(x, y, html, W) {
        if (!tip || !fig.contains(tip)) { tip = document.createElement('div'); tip.className = 'wg-tip'; fig.appendChild(tip); }
        tip.hidden = false; tip.innerHTML = html;
        const tw = tip.offsetWidth; let left = 14 + x + 14; if (left + tw > 14 + W) left = 14 + x - 14 - tw;
        tip.style.left = Math.max(4, left) + 'px'; tip.style.top = Math.max(4, 14 + y - 28) + 'px';
      },
      hide() { if (tip) tip.hidden = true; },
    };
  }

  SML.css(`
.wdb-debts{display:flex;flex-direction:column;gap:10px;padding:16px 18px}
.wdb-row{display:grid;grid-template-columns:22px minmax(0,1.3fr) minmax(0,1fr) minmax(0,.8fr);gap:10px;align-items:end}
.wdb-row .sw{width:14px;height:14px;border-radius:3px;margin-bottom:12px}
.wdb-row .nm{font:600 13px/1.3 var(--sans);color:var(--ink);padding-bottom:10px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wdb-row .nm small{display:block;font:500 10.5px/1.3 var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
@media (max-width:520px){.wdb-row{grid-template-columns:16px minmax(0,1fr) minmax(0,1fr);row-gap:6px}.wdb-row .nm{grid-column:2/-1;padding-bottom:0}.wdb-row .sw{margin-bottom:0;align-self:center}.wdb-row .fld:first-of-type{grid-column:2}}
.wdb-c-a{background:var(--accent)}.wdb-c-b{background:var(--info)}.wdb-c-c{background:var(--violet)}
.wdb-ctl2{display:grid;gap:14px 24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));padding:18px}
.wdb-ctl2 .ctl > .seg,.wdb-ctl2 .ctl > .chips{align-self:flex-start}
.wdb-warn{color:var(--down)}
.wdb-full{grid-column:1/-1}
.wdb-full .chip{text-align:left;line-height:1.3;padding-block:6px}
`);

  /* ======================================================================
     1. creditScore: a teaching model of the five FICO factors
     ====================================================================== */
  const FACTORS = [
    { k: 'pay', name: 'Payment history', w: 35 },
    { k: 'owed', name: 'Amounts owed', w: 30 },
    { k: 'age', name: 'Length of history', w: 15 },
    { k: 'new', name: 'New credit', w: 10 },
    { k: 'mix', name: 'Credit mix', w: 10 },
  ];
  const BANDS = [
    { lo: 300, hi: 579, name: 'Poor', cls: 'f-dn' },
    { lo: 580, hi: 669, name: 'Fair', cls: 'f-acc o70' },
    { lo: 670, hi: 739, name: 'Good', cls: 'f-acc' },
    { lo: 740, hi: 799, name: 'Very good', cls: 'f-up o70' },
    { lo: 800, hi: 850, name: 'Exceptional', cls: 'f-up' },
  ];
  const bandOf = (s) => BANDS.find((b) => s >= b.lo && s <= b.hi) || BANDS[0];
  function scoreModel(u, yrs, inq, late, card, loan) {
    const f = {};
    f.pay = { None: 1, '1 late': 0.62, '2+ lates': 0.38, Collection: 0.12 }[late] || 1;
    if (u <= 0) f.owed = 0.93;
    else if (u < 10) f.owed = 1;
    else if (u <= 30) f.owed = 1 - (u - 10) * 0.01;
    else if (u <= 50) f.owed = 0.8 - (u - 30) * 0.015;
    else f.owed = Math.max(0.08, 0.5 - (u - 50) * 0.0084);
    f.age = 0.1 + 0.9 * Math.min(1, yrs / 15);
    f.new = Math.max(0, 1 - inq * 0.17);
    f.mix = card && loan ? 1 : card || loan ? 0.7 : 0.25;
    if (!card && !loan) { f.age = Math.min(f.age, 0.1); f.owed = Math.min(f.owed, 0.5); }
    const sum = FACTORS.reduce((s, x) => s + (x.w / 100) * f[x.k], 0);
    return { f, score: Math.round(300 + 550 * sum) };
  }
  SML.widgets.creditScore = function (root) {
    const id = SML.uid('wcs');
    const presets = {
      new: { u: 35, a: 1, i: 2, l: 'None', card: true, loan: false },
      avg: { u: 28, a: 9, i: 1, l: 'None', card: true, loan: true },
      maxed: { u: 88, a: 9, i: 3, l: 'None', card: true, loan: true },
      late: { u: 22, a: 9, i: 0, l: '1 late', card: true, loan: true },
      best: { u: 4, a: 20, i: 0, l: 'None', card: true, loan: true },
    };
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Try a person</span>${ui.seg(id + '-p', [{ v: 'new', label: 'New to credit' }, { v: 'avg', label: 'Typical' }, { v: 'maxed', label: 'Maxed cards' }, { v: 'late', label: 'One late' }, { v: 'best', label: '800 club' }], 'avg', 'Example people')}</div>
      <div class="wg-fig"></div>
      <div class="wdb-ctl2">
        ${ui.slider({ id: id + '-u', label: 'Card balances ÷ card limits', min: 0, max: 100, step: 1, value: 28, fmt: 'pct' })}
        ${ui.slider({ id: id + '-a', label: 'Age of your oldest account', min: 0, max: 30, step: 1, value: 9, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-i', label: 'Credit applications, past year', min: 0, max: 6, step: 1, value: 1, fmt: (v) => String(v) })}
        <div class="ctl"><span class="ctl-lab">Late payments, past 2 years</span>${ui.seg(id + '-l', ['None', '1 late', '2+ lates', 'Collection'], 'None', 'Late payments')}</div>
        <div class="ctl"><span class="ctl-lab">Accounts you have</span>${ui.chips(id + '-m', [{ k: 'card', label: 'Credit card', on: true, color: 'var(--accent)' }, { k: 'loan', label: 'Installment loan', on: true, color: 'var(--info)' }])}</div>
      </div>
      <div class="wg-read">${ui.stat('Estimated score', id + '-s', 'hl big')}${ui.stat('Range', id + '-b')}${ui.stat('Biggest drag', id + '-d')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">A teaching model, not the real formula: FICO publishes the five weights, not the math. Real scores also differ by bureau and score version.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const pb = e && e.target && e.target.closest && e.target.closest('#' + id + '-p button');
      if (pb) { const p = presets[pb.dataset.v]; st.set(id + '-u', p.u); st.set(id + '-a', p.a); st.set(id + '-i', p.i); st.setSeg(id + '-l', p.l); setChip('card', p.card); setChip('loan', p.loan); }
      else if (e && e.target && !(e.target.closest && e.target.closest('#' + id + '-p'))) st.setSeg(id + '-p', '');
      draw();
    });
    function setChip(k, on) { const b = root.querySelector(`#${id}-m .chip[data-k="${k}"]`); if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); } }
    const draw = ui.responsive(fig, (W) => {
      const u = st.n(id + '-u'), yrs = st.n(id + '-a'), inq = st.n(id + '-i'), late = st.seg(id + '-l') || 'None';
      const card = st.on(id + '-m', 'card'), loan = st.on(id + '-m', 'loan');
      const m = scoreModel(u, yrs, inq, late, card, loan), sc = m.score, band = bandOf(sc);
      const compact = W < 520;
      const pl = 6, pr = 6, gy = 46, gh = 18;
      const x = SML.lin(300, 850, pl, W - pr);
      let b = '';
      BANDS.forEach((bd, i) => {
        const x0 = x(bd.lo), x1 = x(i === BANDS.length - 1 ? 850 : bd.hi + 1);
        b += S.rect(x0 + (i ? 1 : 0), gy, x1 - x0 - (i ? 1 : 0), gh, bd.cls + (bd === band ? '' : ' o50'), i === 0 || i === 4 ? 3 : 0);
        const mid = (x0 + x1) / 2;
        if (!compact || bd === band) b += S.text(mid, gy + gh + 16, bd.name, 'sm' + (bd === band ? ' ink b' : ''), 'middle');
      });
      [300, 580, 670, 740, 800, 850].forEach((v, i) => { if (compact && (v === 670 || v === 800)) return; b += S.text(i === 0 ? x(v) : i === 5 ? x(v) : x(v), gy - 6, String(v), 'xs mono', i === 0 ? 'start' : i === 5 ? 'end' : 'middle'); });
      // marker
      const mx = x(sc);
      b += S.path(`M${mx - 8},${gy - 18} L${mx + 8},${gy - 18} L${mx},${gy - 8} Z`, 'f-ink');
      const lx = SML.clamp(mx, 40, W - 40);
      b += S.text(lx, gy - 24, String(sc), 'xl ink b mono', 'middle');
      b += S.line(mx, gy - 8, mx, gy + gh, 's-ink w2');
      // factor rows
      const top = gy + gh + 40, rowH = compact ? 46 : 36;
      const labW = compact ? 0 : 196, barX = compact ? pl : pl + labW, barW = W - pr - barX - (compact ? 0 : 74);
      b += S.text(pl, top - 12, 'WHAT GOES INTO IT', 'cap');
      let worst = null;
      FACTORS.forEach((fc, i) => {
        const v = m.f[fc.k], yy = top + i * rowH + (compact ? 18 : 0);
        const cls = v >= 0.8 ? 'up' : v >= 0.5 ? 'acc' : 'dn';
        const word = v >= 0.95 ? 'Great' : v >= 0.8 ? 'Good' : v >= 0.5 ? 'Fair' : 'Hurting';
        const lost = (fc.w / 100) * (1 - v) * 550;
        if (!worst || lost > worst.lost) worst = { fc, lost };
        if (compact) {
          b += S.text(pl, yy - 6, `${fc.name} · ${fc.w}%`, 'sm ink');
          b += S.text(W - pr, yy - 6, word, 'sm b ' + cls, 'end');
        } else {
          b += S.text(pl, yy + 13, fc.name, 'md ink') + S.text(pl + 150, yy + 13, fc.w + '%', 'sm mono', 'start');
          b += S.text(W - pr, yy + 13, word, 'md b ' + cls, 'end');
        }
        const bh = compact ? 10 : 14;
        b += S.rect(barX, yy, barW, bh, 'f-line', 3);
        b += S.rect(barX, yy, Math.max(3, barW * v), bh, 'f-' + cls, 3);
        // weight tick marks: show the share of the score each factor can move
      });
      const H = top + FACTORS.length * rowH + (compact ? 14 : 4);
      fig.innerHTML = S.wrap(W, H, `Estimated credit score ${sc}, ${band.name}, with five factor bars`, b);
      setT(id + '-s', String(sc));
      setT(id + '-b', band.name, sc >= 740 ? 'up' : sc >= 670 ? 'acc' : 'dn');
      const drag = worst && worst.lost > 6 ? worst.fc.name : 'Nothing big';
      setT(id + '-d', drag, worst && worst.lost > 6 ? 'dn' : 'up');
      let msg;
      if (late === 'Collection' || late === '2+ lates') msg = ['dn', 'Payment history', 'Late payments are the heaviest weight. Set every bill to autopay at least the minimum. Lates fade with time and drop off reports after seven years.'];
      else if (u > 30) msg = ['dn', 'Utilization', `Using ${u}% of your limits drags the score. Paying balances down before the statement closes lowers the reported number, and the score recovers as soon as the lower balance is reported.`];
      else if (inq >= 3) msg = ['acc', 'New credit', `${inq} applications in a year looks like you need credit. Each hard inquiry dips the score a little and counts for a year.`];
      else if (!card && !loan) msg = ['acc', 'No file', 'With no accounts there is nothing to score. A secured card used lightly and paid in full builds a history.'];
      else if (yrs < 3) msg = ['info', 'Young file', 'Time is the only fix for a short history. Keep your oldest card open, even if you rarely use it.'];
      else msg = ['up', band.name, sc >= 800 ? 'Above about 800, lenders treat you the same. Extra points barely change the rate you are offered.' : 'Pay on time, keep balances low and apply rarely. That is almost the whole game.'];
      setMsg(id + '-msg', msg[0], msg[1], msg[2]);
    });
  };

  /* ======================================================================
     2. debtPayoff: avalanche vs snowball vs minimum payments
     ====================================================================== */
  const DEBT_PRESETS = {
    cards: [{ n: 'Old card', b: 1200, r: 19.9 }, { n: 'Travel card', b: 4800, r: 29.99 }, { n: 'Cash-back card', b: 9500, r: 24.24 }],
    mixed: [{ n: 'Card A', b: 3200, r: 27.24 }, { n: 'Card B', b: 6400, r: 22.99 }, { n: 'Personal loan', b: 9000, r: 12.5 }],
    one: [{ n: 'Big card', b: 15000, r: 23.99 }, { n: 'Small card', b: 600, r: 18.9 }, { n: 'Old card', b: 0, r: 26.99 }],
  };
  const minPay = (bal, interest) => Math.min(bal, Math.max(25, interest + bal * 0.01));
  function simDebts(debts, budget, method) {
    const bal = debts.map((d) => Math.max(0, d.b)), apr = debts.map((d) => d.r);
    const series = [bal.slice()], paidOff = bal.map((b) => (b > 0 ? null : 0));
    let interest = 0, m = 0, short = false;
    while (m < 600 && bal.some((b) => b > 0.005)) {
      m++;
      const ints = bal.map((b, i) => (b > 0 ? (b * apr[i]) / 1200 : 0));
      ints.forEach((x, i) => { bal[i] += x; interest += x; });
      const mins = bal.map((b, i) => (b > 0 ? minPay(b, ints[i]) : 0));
      const need = mins.reduce((s, x) => s + x, 0);
      let left = method === 'min' ? 0 : budget - need;
      if (method !== 'min' && left < 0) { short = true; left = 0; }
      mins.forEach((x, i) => { bal[i] -= x; });
      if (left > 0) {
        const order = bal.map((b, i) => i).filter((i) => bal[i] > 0.005).sort((a, c) => (method === 'snow' ? bal[a] - bal[c] || apr[c] - apr[a] : apr[c] - apr[a] || bal[a] - bal[c]));
        for (const i of order) { const x = Math.min(left, bal[i]); bal[i] -= x; left -= x; if (left <= 0) break; }
      }
      bal.forEach((b, i) => { if (b <= 0.005) { bal[i] = 0; if (paidOff[i] == null) paidOff[i] = m; } });
      series.push(bal.slice());
    }
    const done = !bal.some((b) => b > 0.005);
    return { months: done ? m : Infinity, interest, series, paidOff, short };
  }
  SML.widgets.debtPayoff = function (root) {
    const id = SML.uid('wdp');
    const cols = ['a', 'b', 'c'], fills = ['f-acc', 'f-info', 'f-vio'], strokes = ['s-acc', 's-info', 's-vio'];
    const row = (i, d) => `<div class="wdb-row"><span class="sw wdb-c-${cols[i]}" aria-hidden="true"></span><span class="nm" id="${id}-n${i}">${d.n}<small>Debt ${i + 1}</small></span>${ui.field({ id: `${id}-b${i}`, label: 'Balance ($)', value: d.b, min: 0, step: 100 })}${ui.field({ id: `${id}-r${i}`, label: 'APR (%)', value: d.r, min: 0, max: 40, step: 0.1 })}</div>`;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Plan</span>${ui.seg(id + '-m', [{ v: 'aval', label: 'Avalanche' }, { v: 'snow', label: 'Snowball' }], 'aval', 'Payoff method')}<span class="grow"></span>${ui.seg(id + '-p', [{ v: 'cards', label: 'Three cards' }, { v: 'mixed', label: 'Cards + loan' }, { v: 'one', label: 'One big card' }], 'cards', 'Example debts')}</div>
      <div class="wg-fig"></div>
      <div class="wdb-debts">${DEBT_PRESETS.cards.map((d, i) => row(i, d)).join('')}</div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-x', label: 'Total you pay every month', min: 100, max: 3000, step: 25, value: 700, fmt: 'usd0' })}</div>
      <div class="wg-read">${ui.stat('Debt-free in', id + '-t', 'hl big')}${ui.stat('Interest you pay', id + '-i')}${ui.stat('Saved vs minimums', id + '-sv')}${ui.stat('vs the other method', id + '-o')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Minimum payment assumed: interest plus 1% of the balance, at least $25 (a common card formula; yours may differ). Interest compounds monthly. When a debt is paid off, its payment rolls into the next one. Hover the chart for any month.</div>`;
    const fig = root.querySelector('.wg-fig'), tip = tipper(fig);
    let G = null;
    const st = ui.wire(root, (e) => {
      const pb = e && e.target && e.target.closest && e.target.closest('#' + id + '-p button');
      if (pb) { DEBT_PRESETS[pb.dataset.v].forEach((d, i) => { $id(`${id}-b${i}`).value = d.b; $id(`${id}-r${i}`).value = d.r; $id(`${id}-n${i}`).innerHTML = `${d.n}<small>Debt ${i + 1}</small>`; }); }
      draw();
    });
    function debts() {
      return [0, 1, 2].map((i) => ({ b: SML.clamp(Number($id(`${id}-b${i}`).value) || 0, 0, 1e6), r: SML.clamp(Number($id(`${id}-r${i}`).value) || 0, 0, 60), n: ($id(`${id}-n${i}`).firstChild || {}).textContent || 'Debt ' + (i + 1) }));
    }
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4) { hide(); return; }
      const mo = Math.round(SML.clamp(G.x.inv(p.x), 0, G.xMax));
      const row = G.plan.series[Math.min(mo, G.plan.series.length - 1)] || [0, 0, 0];
      const minRow = G.base.series[Math.min(mo, G.base.series.length - 1)] || [0, 0, 0];
      const tot = row.reduce((s, x) => s + x, 0), mt = minRow.reduce((s, x) => s + x, 0);
      const hov = svg.querySelector('[data-hov]');
      if (hov) hov.innerHTML = S.line(G.x(mo), G.pt, G.x(mo), G.H - G.pb, 's-ink dash');
      tip.show(G.x(mo), G.y(tot), `Month ${mo}<br>Your plan: ${usd0(tot)}<br><span class="dn">Minimums only: ${usd0(mt)}</span>`, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);
    const draw = ui.responsive(fig, (W) => {
      const ds = debts(), budget = st.n(id + '-x'), method = st.seg(id + '-m') || 'aval';
      const plan = simDebts(ds, budget, method), other = simDebts(ds, budget, method === 'aval' ? 'snow' : 'aval'), base = simDebts(ds, budget, 'min');
      const total0 = ds.reduce((s, d) => s + d.b, 0);
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.46, 250, 330));
      const pl = compact ? 40 : 52, pr = compact ? 10 : 16, pt = 34, pb = 30;
      const planM = isFinite(plan.months) ? plan.months : 600;
      const baseM = isFinite(base.months) ? base.months : 600;
      const xMax = Math.max(12, Math.min(baseM, Math.ceil((planM * 1.7) / 6) * 6));
      const x = SML.lin(0, xMax, pl, W - pr), y = SML.lin(0, Math.max(total0, 1) * 1.08, H - pb, pt);
      let b = '';
      SML.ticks(0, total0 * 1.08, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const yrs = xMax / 12, step = yrs <= 3 ? 6 : yrs <= 8 ? 12 : yrs <= 16 ? 24 : 60;
      for (let mo = 0; mo <= xMax; mo += step) b += S.text(x(mo), H - pb + 16, mo === 0 ? 'now' : mo % 12 === 0 ? mo / 12 + 'y' : mo + 'm', 'xs mono', 'middle');
      // stacked areas for the plan
      const n = Math.min(plan.series.length - 1, xMax);
      let lower = [];
      for (let k = 0; k <= n; k++) lower.push(0);
      for (let i = 2; i >= 0; i--) {
        const upper = lower.map((lo, k) => lo + plan.series[k][i]);
        const pts = upper.map((v, k) => [x(k), y(v)]).concat(lower.map((v, k) => [x(k), y(v)]).reverse());
        if (ds[i].b > 0) b += S.polygon(pts, fills[i] + ' o70');
        lower = upper;
      }
      b += S.poly(lower.map((v, k) => [x(k), y(v)]), 's-ink w2');
      // minimum-only total
      const bn = Math.min(base.series.length - 1, xMax);
      const bpts = []; for (let k = 0; k <= bn; k++) bpts.push([x(k), y(base.series[k].reduce((s, v) => s + v, 0))]);
      b += S.poly(bpts, 's-dn w2 dash');
      const lastB = bpts[bpts.length - 1];
      const minLbl = isFinite(base.months) ? (base.months <= xMax ? 'minimums only' : `minimums only: ${dur(base.months)}`) : 'minimums only: 50+ years';
      b += S.text(Math.min(lastB[0], W - pr), Math.min(H - pb - 6, lastB[1] + 18), minLbl, 'sm dn b', 'end');
      // payoff badges
      const offs = plan.paidOff.map((m, i) => ({ m, i })).filter((o) => o.m && ds[o.i].b > 0).sort((a, c) => a.m - c.m);
      const placed = [];
      offs.forEach((o) => { if (o.m > xMax) return; const bx = x(o.m); let lv = 0; placed.forEach((q) => { if (Math.abs(q.x - bx) < 20 && q.lv >= lv) lv = q.lv + 1; }); placed.push({ x: bx, lv }); b += S.line(bx, y(0), bx, H - pb + 4, 's-mut dash2') + S.circle(bx, y(0) - 12 - lv * 22, 9, fills[o.i]) + S.text(bx, y(0) - 8.2 - lv * 22, String(o.i + 1), 'badge', 'middle'); });
      // legend
      const lg = compact ? ds.map((d, i) => `${i + 1}`) : ds.map((d) => d.n);
      let lx = pl;
      ds.forEach((d, i) => { if (!d.b) return; b += S.rect(lx, 10, 11, 11, fills[i], 2); const t = compact ? 'debt ' + lg[i] : lg[i]; b += S.text(lx + 16, 19.5, t, 'sm ink'); lx += 22 + t.length * (compact ? 6.2 : 6.6); });
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Debt balances paid down in ${dur(plan.months)} with the ${method === 'aval' ? 'avalanche' : 'snowball'} method, against minimum payments only`, b);
      G = { W, H, pl, pr, pt, pb, x, y, xMax, plan, base };
      setT(id + '-t', isFinite(plan.months) ? dur(plan.months) : '50+ yrs', isFinite(plan.months) ? 'acc' : 'dn');
      setT(id + '-i', usd0(plan.interest));
      const saved = base.interest - plan.interest;
      setT(id + '-sv', isFinite(base.months) ? usd0(saved) : usd0(saved) + '+', saved > 0 ? 'up' : '');
      const diff = other.interest - plan.interest;
      setT(id + '-o', Math.abs(diff) < 1 ? 'Same' : (diff > 0 ? 'Saves ' : 'Costs ') + usd0(Math.abs(diff)), diff > 0.5 ? 'up' : diff < -0.5 ? 'dn' : '');
      const firstP = (p) => Math.min(...p.paidOff.filter((m, i) => m && ds[i].b > 0).concat([Infinity]));
      const aval = method === 'aval' ? plan : other, snow = method === 'aval' ? other : plan;
      const extra = aval.interest > snow.interest ? 0 : snow.interest - aval.interest;
      if (plan.short) setMsg(id + '-msg', 'dn', 'Too low', `Your minimums add up to more than ${usd0(budget)} a month, so only minimums get paid. Raise the monthly amount or call the card issuer about a hardship plan.`);
      else if (!total0) setMsg(id + '-msg', 'up', 'Debt-free', 'No balances entered. Keep it that way: pay every card in full each month.');
      else if (Math.abs(aval.interest - snow.interest) < 1) setMsg(id + '-msg', 'info', 'Same order', `Here both methods attack the debts in the same order. ${usd0(budget)} a month clears everything in ${dur(plan.months)} and saves ${usd0(saved)} of interest against paying minimums.`);
      else setMsg(id + '-msg', method === 'aval' ? 'up' : 'acc', method === 'aval' ? 'Avalanche' : 'Snowball', `Avalanche saves ${usd0(extra)} of interest. Snowball clears your first debt in ${dur(firstP(snow))} instead of ${dur(firstP(aval))}, a quick win that keeps some people going. Either beats minimums by about ${usd0(saved)}.`);
    });
  };

  /* ======================================================================
     3. transferPlanner: the 0% clock, the fee and the payment that clears it
     ====================================================================== */
  function simTransfer(o) {
    // stay on the old card
    const stay = [o.B]; let sb = o.B, sInt = 0, sM = 0;
    while (sb > 0.005 && sM < 240) { sM++; const it = (sb * o.apr) / 1200; sInt += it; sb = sb + it - Math.min(o.p, sb + it); stay.push(sb); if (o.p <= it && sM > 2) { sM = Infinity; break; } }
    // transfer
    const fee1 = o.B * o.fee / 100; let tb = o.B + fee1, tInt = 0, fees = fee1, tM = 0, promoEnd = o.promo, chained = false, leftAtEnd = null, fee2 = 0;
    const tr = [tb];
    while (tb > 0.005 && tM < 240) {
      tM++;
      const inPromo = tM <= promoEnd;
      const it = inPromo ? 0 : (tb * o.goto) / 1200; tInt += it; tb = tb + it - Math.min(o.p, tb + it);
      if (tM === o.promo) leftAtEnd = Math.max(0, tb);
      if (tM === o.promo && o.chain && tb > 0.005 && !chained) { chained = true; fee2 = tb * o.fee / 100; fees += fee2; tb += fee2; promoEnd = o.promo + o.promo2; }
      tr.push(Math.max(0, tb));
      if (!inPromo && o.p <= it && tM > o.promo + 2) { tM = Infinity; break; }
    }
    if (leftAtEnd == null) leftAtEnd = 0;
    return { stay, sInt, sM: sb > 0.005 && isFinite(sM) && sM >= 240 ? Infinity : sM, tr, tInt, fees, fee1, fee2, tM: tb > 0.005 && isFinite(tM) && tM >= 240 ? Infinity : tM, leftAtEnd, chained, promoEnd, need: Math.ceil((o.B + fee1) / o.promo) };
  }
  SML.widgets.transferPlanner = function (root) {
    const id = SML.uid('wtp');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Transfer fee</span>${ui.seg(id + '-f', [{ v: '0', label: '0%' }, { v: '3', label: '3%' }, { v: '4', label: '4%' }, { v: '5', label: '5%' }], '3', 'Transfer fee')}<span class="grow"></span>${ui.chips(id + '-c', [{ k: 'chain', label: 'Transfer again when 0% ends', color: 'var(--violet)', on: false }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-b', label: 'Card balance', min: 1000, max: 30000, step: 250, value: 8000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-a', label: 'APR on your current card', min: 10, max: 36, step: 0.01, value: 22.36, fmt: (v) => pct(v, 2) })}
        ${ui.slider({ id: id + '-m', label: 'Months at 0% on the new card', min: 6, max: 24, step: 1, value: 18, fmt: (v) => v + ' months' })}
        ${ui.slider({ id: id + '-p', label: 'What you pay each month', min: 50, max: 2000, step: 10, value: 350, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-g', label: 'APR after the 0% ends', min: 12, max: 32, step: 0.01, value: 22.36, fmt: (v) => pct(v, 2) })}
      </div>
      <div class="wg-read">${ui.stat('Pay this to finish at 0%', id + '-n', 'hl big')}${ui.stat('Transfer fee', id + '-fe')}${ui.stat('Left when 0% ends', id + '-l')}${ui.stat('Saved vs staying', id + '-s')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">The fee is added to the balance on day one. A second transfer assumes another card with the same fee and 15 months at 0%, which needs a new approval. Hover the chart for any month.</div>`;
    const fig = root.querySelector('.wg-fig'), tip = tipper(fig);
    let G = null;
    const st = ui.wire(root, () => draw());
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4) { hide(); return; }
      const mo = Math.round(SML.clamp(G.x.inv(p.x), 0, G.xMax));
      const a = G.r.stay[Math.min(mo, G.r.stay.length - 1)], t = G.r.tr[Math.min(mo, G.r.tr.length - 1)];
      const hov = svg.querySelector('[data-hov]'); if (hov) hov.innerHTML = S.line(G.x(mo), G.pt, G.x(mo), G.H - G.pb, 's-ink dash');
      tip.show(G.x(mo), G.y(Math.max(a, t)), `Month ${mo}<br><span class="dn">Stay: ${usd0(a)}</span><br><span class="up">Transfer: ${usd0(t)}</span>`, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);
    const draw = ui.responsive(fig, (W) => {
      const o = { B: st.n(id + '-b'), apr: st.n(id + '-a'), promo: st.n(id + '-m'), p: st.n(id + '-p'), goto: st.n(id + '-g'), fee: Number(st.seg(id + '-f') || 3), chain: st.on(id + '-c', 'chain'), promo2: 15 };
      const r = simTransfer(o);
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.44, 240, 320));
      const pl = compact ? 40 : 52, pr = compact ? 10 : 16, pt = 34, pb = 30;
      const fin = (m) => (isFinite(m) ? m : 60);
      const xMax = Math.max(o.promo + 6, Math.min(72, Math.max(fin(r.tM), fin(r.sM)) + 2));
      const yMax = Math.max(...r.stay.slice(0, xMax + 1), ...r.tr.slice(0, xMax + 1), o.B) * 1.1;
      const x = SML.lin(0, xMax, pl, W - pr), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      // promo window(s)
      b += S.rect(x(0), pt - 8, x(o.promo) - x(0), H - pb - pt + 8, 'f-up-t');
      b += S.text(x(0) + 8, pt + 6, compact ? `0% · ${o.promo} mo${r.fee1 > 0 ? ' · ' + usd0(r.fee1) + ' fee' : ''}` : `0% window · ${o.promo} months${r.fee1 > 0 ? ' · ' + usd0(r.fee1) + ' fee added on day one' : ''}`, 'sm up b');
      if (r.chained) { const e2 = Math.min(xMax, r.promoEnd); b += S.rect(x(o.promo), pt - 8, x(e2) - x(o.promo), H - pb - pt + 8, 'f-vio-t'); b += S.text(x(o.promo) + 8, pt + 6, compact ? '2nd 0%' : 'second 0% card', 'sm vio b'); }
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      const step = xMax <= 30 ? 6 : 12;
      for (let mo = 0; mo <= xMax; mo += step) b += S.text(x(mo), H - pb + 16, mo === 0 ? 'now' : mo + 'm', 'xs mono', 'middle');
      const sp = r.stay.slice(0, xMax + 1).map((v, k) => [x(k), y(v)]), tp = r.tr.slice(0, xMax + 1).map((v, k) => [x(k), y(v)]);
      b += S.poly(sp, 's-dn w25') + S.poly(tp, 's-up w25');
      // labels at the end of each line
      const sl = sp[sp.length - 1], tl = tp[tp.length - 1];
      const stayLbl = isFinite(r.sM) ? (r.sM <= xMax ? 'stay' : 'stay: ' + dur(r.sM)) : 'stay: never paid off';
      let ly1 = Math.max(pt + 22, sl[1] - 8), ly2 = Math.max(pt + 22, tl[1] - 8);
      if (Math.abs(ly1 - ly2) < 14) { if (ly1 <= ly2) ly2 = ly1 + 14; else ly1 = ly2 + 14; }
      b += S.text(Math.min(sl[0], W - pr), Math.min(ly1, H - pb - 6), stayLbl, 'sm dn b', 'end');
      // fee bump marker
      if (r.fee1 > 0) b += S.circle(x(0), y(o.B + r.fee1), 4, 'f-up');
      // promo end marker
      const left = r.leftAtEnd;
      b += S.line(x(o.promo), pt - 8, x(o.promo), H - pb, 's-up w15 dash2');
      if (left > 0.5) { b += S.circle(x(o.promo), y(left), 5, 'f-acc'); b += S.text(Math.min(x(o.promo) + 8, W - pr - 90), y(left) - 10, usd0(left) + ' left', 'md acc b'); }
      else if (isFinite(r.tM)) b += S.circle(x(r.tM), y(0), 5, 'f-up');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Card balance if you stay at ${o.apr}% versus a transfer with ${o.promo} months at 0%`, b);
      G = { W, H, pl, pr, pt, pb, x, y, xMax, r };
      setT(id + '-n', usd0(r.need) + '/mo', o.p >= r.need ? 'up' : 'acc');
      setT(id + '-fe', usd0(r.fee1) + (r.fee2 ? ' + ' + usd0(r.fee2) : ''));
      setT(id + '-l', usd0(left), left > 0.5 ? 'dn' : 'up');
      const costStay = isFinite(r.sM) ? r.sInt : Infinity, costTr = isFinite(r.tM) ? r.tInt + r.fees : Infinity;
      setT(id + '-s', isFinite(costStay) && isFinite(costTr) ? usd0(costStay - costTr) : isFinite(costTr) ? 'All of it' : '—', costStay > costTr ? 'up' : 'dn');
      if (!isFinite(r.sM) && !isFinite(r.tM)) setMsg(id + '-msg', 'dn', 'Too low', `${usd0(o.p)} a month does not even cover the interest once 0% ends. Raise the payment.`);
      else if (o.p >= r.need) setMsg(id + '-msg', 'up', 'Clears at 0%', `${usd0(o.p)} a month pays it off in ${dur(r.tM)}, inside the 0% window. You pay only the ${usd0(r.fee1)} fee instead of ${isFinite(r.sM) ? usd0(r.sInt) : 'endless'} interest by staying.`);
      else if (r.chained) setMsg(id + '-msg', 'vio', 'Second transfer', `${usd0(left)} is left at month ${o.promo}. Moving it to another 0% card costs ${usd0(r.fee2)} more in fees, needs a new approval and a new hard inquiry. Total cost: ${usd0(r.tInt + r.fees)}.`);
      else setMsg(id + '-msg', 'acc', 'Short', `At ${usd0(o.p)} a month, ${usd0(left)} is still owed when 0% ends and starts costing ${pct(o.goto, 2)}. Pay ${usd0(r.need)} a month to finish in time, or plan a second transfer.`);
    });
  };

  /* ======================================================================
     4. carCashVsLoan: pay cash, or keep cash invested and take the loan
     ====================================================================== */
  const CAR_PRESETS = {
    promo: { price: 35000, apr: 0, term: '60' },
    newcar: { price: 35000, apr: 6.35, term: '60' },
    used: { price: 24000, apr: 11.19, term: '60' },
  };
  const VMFXX_USGO = 0.6661; // share of VMFXX 2025 income from US government obligations (state-tax-exempt in most states)
  function simCar(o) {
    const n = o.term, i = o.apr / 1200;
    const pmt = i > 0 ? (o.P * i) / (1 - Math.pow(1 + i, -n)) : o.P / n;
    const tax = (o.fed + o.state * (o.treas ? 0 : 1 - VMFXX_USGO)) / 100;
    const r = (o.y * (1 - tax)) / 1200;
    let A = 0, B = o.P, bal = o.P, yearInt = 0, totInt = 0, ded = 0, B0 = o.P;
    const As = [0], Bs = [o.P];
    for (let k = 1; k <= n; k++) {
      const it = bal * i; yearInt += it; totInt += it; bal = bal + it - pmt; if (bal < 0) bal = 0;
      A = A * (1 + r) + pmt;
      B0 = B0 * (1 + r);
      if (o.ded && (k % 12 === 0 || k === n)) { const save = Math.min(yearInt, 10000) * (o.fed / 100); ded += save; yearInt = 0; }
      else if (k % 12 === 0) yearInt = 0;
      B = B0 + ded;
      As.push(A); Bs.push(B);
    }
    return { pmt, totInt, As, Bs, A, B, ded, rAT: o.y * (1 - tax), earned: o.P * (Math.pow(1 + r, n) - 1), tax };
  }
  SML.widgets.carCashVsLoan = function (root) {
    const id = SML.uid('wcc');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Example</span>${ui.seg(id + '-p', [{ v: 'promo', label: '0% dealer promo' }, { v: 'newcar', label: 'Typical new car' }, { v: 'used', label: 'Typical used car' }], 'newcar', 'Example loans')}<span class="grow"></span>${ui.seg(id + '-t', [{ v: '36', label: '36 mo' }, { v: '48', label: '48' }, { v: '60', label: '60' }, { v: '72', label: '72' }], '60', 'Loan term')}</div>
      <div class="wg-fig"></div>
      <div class="wdb-ctl2">
        ${ui.slider({ id: id + '-c', label: 'Amount to pay or borrow', min: 5000, max: 80000, step: 500, value: 35000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-a', label: 'Loan APR', min: 0, max: 18, step: 0.01, value: 6.35, fmt: (v) => pct(v, 2) })}
        ${ui.slider({ id: id + '-y', label: 'Money market yield (before tax)', min: 0, max: 6, step: 0.01, value: 3.83, fmt: (v) => pct(v, 2) })}
        ${ui.slider({ id: id + '-s', label: 'State income tax rate', min: 0, max: 13.3, step: 0.1, value: 5, fmt: (v) => pct(v, 1) })}
        <div class="ctl"><span class="ctl-lab">Federal tax bracket</span>${ui.seg(id + '-f', ['10', '12', '22', '24', '32', '35', '37'].map((v) => ({ v, label: v + '%' })), '22', 'Federal bracket')}</div>
        <div class="ctl wdb-full"><span class="ctl-lab">Details</span>${ui.chips(id + '-k', [{ k: 'treas', label: 'Treasury fund: fully state-tax-free', color: 'var(--info)', on: false }, { k: 'ded', label: 'New US-built car: deduct interest', color: 'var(--up)', on: false }, { k: 'ef', label: 'Cash would drain my emergency fund', color: 'var(--down)', on: false }])}</div>
      </div>
      <div class="wg-read">${ui.stat('Winner', id + '-w', 'hl big')}${ui.stat('Loan payment', id + '-m')}${ui.stat('Loan interest', id + '-i')}${ui.stat('Cash earns, after tax', id + '-e')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Both paths spend the same each month: with the loan you pay the lender, with cash you invest that same payment instead. The chart shows what you have saved at the end. Interest is compounded monthly. State tax applies to the third of VMFXX’s income that is not from US government debt (about 66.6% was exempt in 2025). The deduction toggle assumes you qualify (new car, final assembly in the US, income limits), counts federal tax only and does not reinvest the tax saved. Defaults: Experian's Q2 2026 average new-car APR and VMFXX's yield in October 2026.</div>`;
    const fig = root.querySelector('.wg-fig'), tip = tipper(fig);
    let G = null;
    const st = ui.wire(root, (e) => {
      const pb = e && e.target && e.target.closest && e.target.closest('#' + id + '-p button');
      if (pb) { const p = CAR_PRESETS[pb.dataset.v]; st.set(id + '-c', p.price); st.set(id + '-a', p.apr); st.setSeg(id + '-t', p.term); }
      else if (e && e.target && e.target.closest && (e.target.closest('#' + id + '-c') || e.target.closest('#' + id + '-a'))) st.setSeg(id + '-p', '');
      draw();
    });
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl - 4 || p.x > G.W - G.pr + 4) { hide(); return; }
      const mo = Math.round(SML.clamp(G.x.inv(p.x), 0, G.n));
      const hov = svg.querySelector('[data-hov]'); if (hov) hov.innerHTML = S.line(G.x(mo), G.pt, G.x(mo), G.H - G.pb, 's-ink dash');
      tip.show(G.x(mo), G.y(Math.max(G.r.As[mo], G.r.Bs[mo])), `Month ${mo}<br><span class="up">Paid cash: ${usd0(G.r.As[mo])}</span><br><span class="info">Took loan: ${usd0(G.r.Bs[mo])}</span>`, G.W);
    });
    function hide() { const svg = fig.querySelector('svg'); const h = svg && svg.querySelector('[data-hov]'); if (h) h.innerHTML = ''; tip.hide(); }
    fig.addEventListener('pointerleave', hide);
    const draw = ui.responsive(fig, (W) => {
      const o = { P: st.n(id + '-c'), apr: st.n(id + '-a'), term: Number(st.seg(id + '-t') || 60), y: st.n(id + '-y'), state: st.n(id + '-s'), fed: Number(st.seg(id + '-f') || 22), treas: st.on(id + '-k', 'treas'), ded: st.on(id + '-k', 'ded') };
      const ef = st.on(id + '-k', 'ef');
      const r = simCar(o), n = o.term;
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.44, 240, 320));
      const pl = compact ? 40 : 52, pr = compact ? 12 : 18, pt = 34, pb = 30;
      const yMax = Math.max(r.A, r.B, o.P) * 1.12;
      const x = SML.lin(0, n, pl, W - pr - (compact ? 0 : 92)), y = SML.lin(0, yMax, H - pb, pt);
      let b = '';
      SML.ticks(0, yMax, 4).forEach((v) => { if (y(v) < pt - 2) return; b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      for (let mo = 0; mo <= n; mo += 12) b += S.text(x(mo), H - pb + 16, mo === 0 ? 'buy' : mo / 12 + 'y', 'xs mono', 'middle');
      const ap = r.As.map((v, k) => [x(k), y(v)]), bp = r.Bs.map((v, k) => [x(k), y(v)]);
      b += S.area(ap, y(0), 'f-up-t') + S.poly(ap, 's-up w25') + S.poly(bp, 's-info w25');
      b += S.circle(x(n), y(r.A), 5, 'f-up') + S.circle(x(n), y(r.B), 5, 'f-info');
      // end labels
      let la = y(r.A), lb = y(r.B);
      if (Math.abs(la - lb) < 30) { if (la < lb) { la -= (30 - (lb - la)) / 2; lb = la + 30; } else { lb -= (30 - (la - lb)) / 2; la = lb + 30; } }
      if (compact) {
        b += S.text(x(n) - 8, Math.max(pt + 10, la - 8), 'cash ' + kfmt(r.A), 'sm up b', 'end');
        b += S.text(x(n) - 8, Math.min(H - pb - 4, Math.max(pt + 10, lb + (lb > la ? 16 : -8))), 'loan ' + kfmt(r.B), 'sm info b', 'end');
      } else {
        b += S.text(x(n) + 10, la - 2, 'Paid cash', 'sm up b') + S.text(x(n) + 10, la + 13, usd0(r.A), 'md mono ink');
        b += S.text(x(n) + 10, lb - 2, 'Took loan', 'sm info b') + S.text(x(n) + 10, lb + 13, usd0(r.B), 'md mono ink');
      }
      b += S.text(x(0) + 8, y(o.P) - 8, compact ? 'cash kept' : 'loan path: your cash stays invested', 'sm info');
      b += S.text(x(0) + 8, H - pb - 8, compact ? '' : 'cash path: invest the payment you skip', 'sm up');
      b += '<g data-hov></g>';
      fig.innerHTML = S.wrap(W, H, `Savings after ${n} months: paying cash ${usd0(r.A)} versus taking the loan ${usd0(r.B)}`, b);
      G = { W, H, pl, pr, pt, pb, x, y, n, r };
      const diff = r.A - r.B;
      setT(id + '-w', Math.abs(diff) < 50 ? 'About even' : (diff > 0 ? 'Cash +' : 'Loan +') + usd0(Math.abs(diff)), Math.abs(diff) < 50 ? '' : diff > 0 ? 'up' : 'info');
      setT(id + '-m', usd0(r.pmt) + '/mo');
      setT(id + '-i', usd0(r.totInt), r.totInt > 0 ? 'dn' : '');
      setT(id + '-e', pct(r.rAT, 2) + ' · ' + usd0(r.earned));
      const be = (o.ded ? o.apr * (1 - o.fed / 100) : o.apr) / (1 - r.tax);
      if (ef) setMsg(id + '-msg', 'dn', 'Keep the cushion', `Do not empty your emergency fund for a car. Pay cash only from money above three to six months of expenses. Otherwise take the loan, or buy a cheaper car, and pay it down fast.`);
      else if (Math.abs(diff) < 50) setMsg(id + '-msg', 'info', 'Close call', `The loan rate and your after-tax yield are about equal, so it barely matters. Paying cash removes a monthly bill and the risk of rates changing on your savings.`);
      else if (diff > 0) setMsg(id + '-msg', 'up', 'Pay cash', `The loan charges ${pct(o.apr, 2)}. Your cash earns ${pct(o.y, 2)} before tax, only ${pct(r.rAT, 2)} after. Paying cash leaves you ${usd0(diff)} ahead after ${n} months. The loan would only win if your cash earned more than ${pct(be, 1)} before tax.`);
      else setMsg(id + '-msg', 'info', 'Take the loan', `At ${pct(o.apr, 2)} the loan costs less than your cash earns after tax (${pct(r.rAT, 2)}${o.ded ? ', plus the interest deduction' : ''}). Keeping the cash invested leaves you ${usd0(-diff)} ahead, as long as you really leave it alone.`);
    });
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const SRC = {
    fico: { t: 'myFICO: What’s in my FICO Scores (the five factor weights)', u: 'https://www.myfico.com/credit-education/whats-in-your-credit-score' },
    ranges: { t: 'Experian: What is a good credit score (FICO ranges)', u: 'https://www.experian.com/blogs/ask-experian/credit-education/score-basics/what-is-a-good-credit-score/' },
    inq: { t: 'myFICO: Credit checks and inquiries', u: 'https://www.myfico.com/credit-education/credit-reports/credit-checks-and-inquiries' },
    util: { t: 'Experian: What is a credit utilization rate', u: 'https://www.experian.com/blogs/ask-experian/credit-education/score-basics/credit-utilization-rate/' },
    seven: { t: 'CFPB: How long negative information stays on a credit report', u: 'https://www.consumerfinance.gov/ask-cfpb/how-long-does-negative-information-remain-on-my-credit-report-en-323/' },
    auto: { t: 'Experian: Average car loan interest rates by credit score (Q2 2026)', u: 'https://www.experian.com/blogs/ask-experian/average-car-loan-interest-rates-by-credit-score/' },
    g19: { t: 'Federal Reserve G.19: Consumer credit, card and auto rates (Aug 2026 data)', u: 'https://www.federalreserve.gov/releases/g19/current/default.htm' },
    regz: { t: 'CFPB: Regulation Z §1026.53, how card payments are allocated', u: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/53/' },
    bt: { t: 'NerdWallet: Best balance transfer cards (updated Oct 1, 2026)', u: 'https://www.nerdwallet.com/best/credit-cards/balance-transfer' },
    deferred: { t: 'Experian: What is deferred interest', u: 'https://www.experian.com/blogs/ask-experian/what-is-deferred-interest/' },
    irsCar: { t: 'IRS: Deduction for car loan interest (One Big Beautiful Bill Act)', u: 'https://www.irs.gov/newsroom/one-big-beautiful-bill-act-tax-deductions-for-working-americans-and-seniors' },
    irsNotice: { t: 'IRS: Guidance on the new deduction for car loan interest (IR-2025-129)', u: 'https://www.irs.gov/newsroom/treasury-irs-provide-guidance-on-the-new-deduction-for-car-loan-interest-under-the-one-big-beautiful-bill' },
    vgTax: { t: 'Vanguard: Share of fund income from US government obligations (2025)', u: 'https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/usgo-012026.pdf' },
    carfax: { t: 'Carfax: Car depreciation (Apr 2026)', u: 'https://www.carfax.com/blog/car-depreciation' },
    bankrate: { t: 'Bankrate: How much car can I afford', u: 'https://www.bankrate.com/loans/auto-loans/how-much-car-can-i-afford/' },
  };

  SML.lessons.push({
    id: 'l-credit-score', course: 'debt', order: 1, title: 'How credit scores work', mins: 8, level: 'Beginner',
    summary: 'What debt costs, what a credit score measures and how to raise yours.',
    idea: 'Debt is renting future money. Your credit score sets the rent, and five habits set the score.',
    widget: 'creditScore',
    try: 'Pick a person, then move the sliders. Watch which factor drags the score and how far.',
    body: [
      '<h3>What debt really is</h3><p>When you borrow, you spend money you have not earned yet. Interest is the rent you pay for that. A $5,000 card balance at 22% costs about $1,100 a year in rent, and you get nothing for it.</p><p>Some debt can make sense: a fixed-rate mortgage on a home you live in, or a low-rate loan for something that earns or saves money. High-rate debt for things that lose value, such as card balances for vacations or gadgets, is the kind that keeps people poor. The <a href="#l-smart-leverage">smart leverage lesson</a> goes deeper.</p><p>Where debt payoff fits in your plan: a starter cushion of $500 to $1,000 first, then the full 401(k) match, then high-interest debt, then a full emergency fund, then an IRA and HSA, then taxable investing. The <a href="#l-card-debt">next lesson</a> covers it step by step.</p>',
      '<h3>What the score is</h3><p>A <b>credit score</b> is a number from 300 to 850 that predicts how likely you are to pay a loan back. FICO, the most used score, groups it like this: 300 to 579 poor, 580 to 669 fair, 670 to 739 good, 740 to 799 very good, 800 to 850 exceptional.</p><p>Lenders use it to decide whether to lend and at what rate. In the second quarter of 2026, new-car borrowers with the best scores paid 4.41% on average, while subprime borrowers paid 13.52%. On a $30,000 five-year loan, that gap is about $8,000 of interest.</p>',
      '<h3>The five factors</h3><ul><li><b>Payment history, 35%.</b> Did you pay on time? A single late payment that gets reported can hurt for years, and most negative items can stay on your report for seven years.</li><li><b>Amounts owed, 30%.</b> Mostly your <b>credit utilization</b>: card balances divided by card limits. Lower is better. In Experian’s data, people with scores of 800 to 850 used about 7% of their limits on average.</li><li><b>Length of history, 15%.</b> How old your accounts are. Time is the only fix.</li><li><b>New credit, 10%.</b> Each application adds a <b>hard inquiry</b>. FICO counts inquiries from the last 12 months, and each one usually costs fewer than 5 points.</li><li><b>Credit mix, 10%.</b> Having both cards and an installment loan helps a little. Never borrow just for this.</li></ul>',
      '<h3>How to raise it</h3><ul><li>Set every card and loan to autopay at least the minimum, so you are never late.</li><li>Pay your card before the statement closes. The balance on the statement is what gets reported, so a lower one means lower utilization.</li><li>Keep old cards open, even if you rarely use them. Closing one shrinks your total limit and can shorten your history.</li><li>Apply only when you need credit. When you shop for a car loan or mortgage, do it within a couple of weeks: FICO counts those inquiries as one.</li><li>Check your reports for free at AnnualCreditReport.com and dispute mistakes. Freezing your credit with the three bureaus is free and blocks most identity theft.</li></ul>',
      '<h3>Myths</h3><ul><li>Checking your own score does not hurt it. That is a soft inquiry.</li><li>Carrying a balance does not help your score. Paying in full every month gives the same score benefit with no interest.</li><li>Your income and savings are not part of the score.</li></ul>',
    ],
    example: {
      title: 'Cleaning up before a car loan',
      intro: 'Maya plans to buy a car in three months. Her two cards have $10,000 of limits and $4,500 of balances.',
      steps: [
        'Her utilization is $4,500 ÷ $10,000 = 45%. That is the biggest drag on her score.',
        'She pays $4,000 before the statement closing dates. The balances reported next are $500, so utilization drops to 5%.',
        'She sets both cards to autopay the full statement balance and makes no new applications.',
        'When she shops for the loan, she gets three quotes within one week. FICO treats them as one inquiry.',
        'If her score lands in the best tier, a $30,000 five-year loan at 4.41% costs $558 a month and $3,484 in interest. At 6.15% it would be $582 a month and $4,925 in interest.',
      ],
      result: 'Paying down cards before applying could save her about $1,440 on one loan.',
    },
    mistakes: [
      'Closing your oldest card after paying it off. Your total limit shrinks and utilization jumps.',
      'Missing a payment because it was not on autopay. Payment history is the heaviest factor.',
      'Opening store cards at checkout for a one-time discount. Each one is a hard inquiry and a new account.',
      'Paying a company to "fix" your credit. You can dispute errors yourself for free; nobody can remove accurate late payments.',
    ],
    points: [
      'Interest is rent on money you have not earned yet. High-rate debt for things that lose value is the costly kind.',
      'Payment history (35%) and amounts owed (30%) are two-thirds of a FICO score.',
      'Keep card utilization low, ideally in the single digits, by paying before the statement closes.',
      'A better score means lower rates: thousands of dollars on a car loan or mortgage.',
    ],
    terms: ['Credit score', 'Credit utilization', 'Hard inquiry', 'APR', 'Leverage'],
    glossary: [{ t: 'Soft inquiry', d: 'A credit check that does not affect your score, such as checking your own score or a pre-approval offer.' }, { t: 'Credit freeze', d: 'A free lock on your credit file at each bureau, so nobody can open new credit in your name until you lift it.' }],
    quiz: { q: 'Which change usually raises a score fastest?', options: ['Opening two new cards', 'Paying card balances down before the statement closes', 'Closing your oldest card'], answer: 1, why: 'Lower reported balances cut utilization, which counts for about 30% of a FICO score, and the score updates once the new balance is reported.' },
    sources: [SRC.fico, SRC.ranges, SRC.inq, SRC.auto],
  });

  SML.lessons.push({
    id: 'l-card-debt', course: 'debt', order: 2, title: 'Credit card debt: get out, stay out', mins: 9, level: 'Beginner',
    summary: 'Why card interest is an emergency, the minimum-payment trap, and two payoff plans.',
    idea: 'Card interest runs above 20%. Paying it off is a guaranteed return no investment can match.',
    widget: 'debtPayoff',
    try: 'Switch between avalanche and snowball, change the monthly amount, and compare both with minimum payments.',
    body: [
      '<h3>The goal: never pay card interest</h3><p>Use cards for convenience and rewards, then pay the full statement balance every month. Do that and you pay no interest at all. Carry a balance and the rate is brutal: in August 2026, card accounts that were charged interest paid 22.36% on average.</p><p>Paying off a 22% card is like earning a guaranteed 22% return. No index fund or savings account promises that. The one exception worth keeping while you pay down cards is your 401(k) match, which is an instant return of 50% to 100% on the money you put in (see <a href="#l-401k-match">the match lesson</a>).</p>',
      '<h3>The minimum-payment trap</h3><p>Many cards set the minimum at the month’s interest plus 1% of the balance. On $5,000 at 22.36%, paying only that minimum takes about 19 years and costs about $8,100 in interest. Paying a fixed $200 a month instead clears it in under three years for about $1,800.</p>',
      '<h3>Avalanche or snowball</h3><ul><li><b>Avalanche:</b> pay minimums on everything, then put every extra dollar on the highest APR. It always saves the most interest.</li><li><b>Snowball:</b> put the extra on the smallest balance first. You clear a card sooner, and that win keeps many people going.</li></ul><p>Both roll the payment of each paid-off card into the next one. The best plan is the one you will keep doing. On a single card with several balances, the law already sends any amount above the minimum to the highest-rate balance first.</p>',
      '<h3>A plan that sticks</h3><ul><li>Stop adding: take the card out of your phone wallet and online stores.</li><li>Build a small cushion, around $500 to $1,000, so a flat tire does not land on the card again (see <a href="#l-emergency">the emergency fund lesson</a>).</li><li>List every debt with balance, APR and minimum. Pick avalanche or snowball.</li><li>Automate a fixed payment above the minimums.</li><li>Stop the interest: move the balance to a 0% card if you qualify (<a href="#l-balance-transfer">next lesson</a>), or call the issuer and ask for a lower rate or a hardship plan.</li></ul>',
      '<h3>Where paying off debt fits</h3><p>The same order runs through this whole site:</p><ol><li>A starter cushion of $500 to $1,000.</li><li>Enough in your 401(k) to get the full employer match.</li><li>Pay off high-interest debt such as credit cards.</li><li>Build the full emergency fund, three to six months of expenses.</li><li>Fund an IRA and, if you have one, an HSA.</li><li>Then invest more in the 401(k) and a taxable account.</li></ol><p>The <a href="#l-ira">savings order lesson</a> walks through each step.</p>',
      '<h3>Avoid the traps on the way out</h3><p>Debt settlement companies that promise to cut your balance in half usually tell you to stop paying, which wrecks your score and adds fees. A consolidation loan at a lower fixed rate can help, but only if the cards stay at zero afterward. A common trap is paying off the cards with a loan and then running them back up.</p>',
    ],
    example: {
      title: 'Three cards, $700 a month',
      intro: 'Same three cards as the widget: $1,200 at 19.9%, $4,800 at 29.99% and $9,500 at 24.24%. Total $15,500.',
      steps: [
        'Minimums only: the debt takes about 24 and a half years to clear and costs about $29,200 in interest.',
        'Avalanche with $700 a month: pay the 29.99% card first, then the 24.24% card, then the 19.9% card. Debt-free in 30 months, about $5,410 of interest.',
        'Snowball with $700 a month: pay the $1,200 card first. After five payments only about $5 is left, so it is gone in month 6. Debt-free in 31 months, about $5,660 of interest.',
        'Avalanche saves about $240 more than snowball. Snowball gives a first win nine months sooner (month 6 instead of month 15).',
        'Moving the $4,800 card to a 0% offer would cut the interest further. That is the next lesson.',
      ],
      result: 'Either plan saves about $23,500 to $23,800 compared with paying only the minimums.',
    },
    mistakes: [
      'Paying only the minimum. Most of each payment goes to interest and the balance barely moves.',
      'Investing in a taxable account while carrying a 22% card. Pay the card first; keep only the 401(k) match going.',
      'Paying off cards with a consolidation loan, then using the cards again.',
      'Having no cash cushion, so every surprise bill goes right back on the card.',
    ],
    points: [
      'Pay the full statement balance every month and you never pay card interest.',
      'Paying off a 22% card is a guaranteed 22% return.',
      'Avalanche (highest APR first) saves the most; snowball (smallest balance first) gives faster wins.',
      'Automate a fixed payment above the minimums and stop adding new charges.',
    ],
    terms: ['APR', 'Avalanche method', 'Snowball method', 'Emergency fund', 'Opportunity cost'],
    glossary: [{ t: 'Minimum payment', d: 'The smallest amount the card requires each month. Often the month’s interest plus about 1% of the balance.' }, { t: 'Statement balance', d: 'What you owed when the billing cycle closed. Paying it in full by the due date avoids interest on purchases.' }],
    quiz: { q: 'You have $2,000 at 27% and $6,000 at 18%. Which payoff order saves the most interest?', options: ['The $6,000 card first, because it is bigger', 'The 27% card first (avalanche)', 'Split the extra money evenly'], answer: 1, why: 'Every extra dollar on the highest APR stops the most expensive interest first. That is the avalanche method.' },
    sources: [SRC.g19, SRC.regz],
  });

  SML.lessons.push({
    id: 'l-balance-transfer', course: 'debt', order: 3, title: '0% APR and balance transfers', mins: 9, level: 'Intermediate',
    summary: 'Use 0% offers to stop interest, with the fee, the clock and the fine print in view.',
    idea: 'A 0% transfer swaps high interest for a one-time fee. It only works if you clear the balance before the clock runs out.',
    widget: 'transferPlanner',
    try: 'Set your balance and monthly payment, then find the payment that reaches zero before the 0% window ends.',
    body: [
      '<h3>How a transfer works</h3><p>You open a card with a 0% intro APR on balance transfers. The new card pays off your old card, and you owe the new card instead. You pay a <b>balance transfer fee</b>, usually 3% to 5% of the amount moved (often at least $5), added to the balance on day one. In October 2026 the best offers run 15 to 21 months at 0%.</p><p>On $8,000, a 3% fee is $240, paid once. Staying at 22% would cost about $150 of interest in the first month alone.</p>',
      '<h3>The one number that matters</h3><p>Divide the transferred balance plus the fee by the months at 0%. That is the monthly payment that clears it in time. For $8,000 with a $240 fee and 18 months: $8,240 ÷ 18 = $458 a month. Set it up as an automatic payment. Whatever is left when the promo ends starts charging the card’s regular rate.</p>',
      '<h3>The fine print</h3><ul><li><b>Same bank:</b> you generally cannot transfer between two cards from the same issuer.</li><li><b>Deadline:</b> the 0% usually applies only to transfers made within the first 60 to 120 days.</li><li><b>Purchases:</b> on some cards the 0% covers only transfers, and new purchases charge interest. Do not use the transfer card for shopping.</li><li><b>Late payments:</b> read what happens if you pay late. Treat autopay as required.</li><li><b>Approval:</b> the limit you get may be lower than your balance. Move the highest-rate debt first.</li></ul>',
      '<h3>When the promo ends: transfer again?</h3><p>If a balance remains, you can move it to another 0% card from a different bank. That works, but each move costs another fee, needs a new approval and adds a hard inquiry and a new account. If your score drops or offers dry up, you are stuck at the regular rate. Plan to finish on the first card and treat a second transfer as a backup, not the plan.</p>',
      '<h3>Deferred interest is a different animal</h3><p>Store cards and medical financing often say "no interest if paid in full in 12 months". That is <b>deferred interest</b>. If even $1 is left at the deadline, they charge all the interest back to day one, on the original amount. A true 0% intro APR only charges interest on what remains after the promo ends. Example: $5,000 financed, $1,000 left at the end. Deferred interest charges a year of interest on $5,000; a 0% card starts charging interest on $1,000.</p>',
      '<h3>What it does to your score</h3><p>The application adds a hard inquiry (usually fewer than 5 points, counted for a year) and a new account lowers your average age. The new limit lowers your overall utilization, which helps. Expect a small dip that fades as the inquiry ages and the balance falls.</p>',
    ],
    example: {
      title: '$8,000 moved to an 18-month 0% card',
      intro: 'Your card charges 22.36%. You qualify for a card with 0% for 18 months and a 3% fee.',
      steps: [
        'Fee: 3% of $8,000 = $240. You now owe $8,240 at 0%.',
        'Payment to finish in time: $8,240 ÷ 18 = $457.78, so you autopay $458 a month.',
        'Staying put and paying $458 a month at 22.36% would take 22 months and about $1,770 of interest.',
        'With the transfer you pay $240 in total. You save about $1,530.',
        'If you could only pay $350 a month, $1,940 would be left at month 18 and start charging the regular rate. Raise the payment or plan a second transfer.',
      ],
      result: 'A transfer works when the fee is small next to the interest and the payment fits inside the 0% window.',
    },
    mistakes: [
      'Moving the balance, then running the old card back up. Now you have two balances.',
      'Paying only the minimum on the new card and hitting the end of the promo with most of the balance left.',
      'Using the transfer card for new purchases that charge interest from day one.',
      'Treating a store card’s deferred-interest promo like a true 0% APR.',
    ],
    points: [
      'A transfer trades high interest for a one-time fee of about 3% to 5%.',
      'Payment to clear it in time = (balance + fee) ÷ months at 0%. Automate it.',
      'Transfers usually cannot go between two cards from the same bank, and must happen within the first months.',
      'Deferred interest charges everything back if any balance is left. A true 0% APR does not.',
      'A second transfer is a backup, not a plan: another fee, approval and inquiry.',
    ],
    terms: ['Balance transfer', 'Balance transfer fee', 'Intro APR', 'Deferred interest', 'Hard inquiry'],
    quiz: { q: 'You finance a $3,000 sofa with "no interest if paid in full in 12 months" and owe $200 at month 12. What happens?', options: ['Interest is charged only on the $200', 'Interest from day one on the full $3,000 can be charged', 'Nothing, the promo is extended'], answer: 1, why: 'That is deferred interest. Missing the deadline by any amount brings back all the interest from the start.' },
    sources: [SRC.bt, SRC.deferred, SRC.inq, SRC.g19],
  });

  SML.lessons.push({
    id: 'l-car-cash', course: 'debt', order: 4, title: 'Car: pay cash or take the loan?', mins: 9, level: 'Intermediate',
    summary: 'Compare the loan rate with what your cash earns after tax, then add the new deduction.',
    idea: 'Take the loan only when its rate is below what your cash earns after tax. Otherwise paying cash wins.',
    widget: 'carCashVsLoan',
    try: 'Try the three examples, then change your tax bracket and the money market yield to see which path ends richer.',
    body: [
      '<h3>The rule</h3><p>If you pay cash, you lose the interest that money would have earned. If you borrow, you pay the loan’s interest. So compare the loan APR with the yield on your cash <b>after tax</b>.</p><p>In October 2026, Vanguard’s Federal Money Market Fund (VMFXX) yielded about 3.83%. Its income is taxed as ordinary income. In the 22% federal bracket with 5% state tax, 3.83% shrinks to about 2.92% (about two-thirds of VMFXX’s income escapes state tax, see below). The average new-car loan in the second quarter of 2026 was 6.35%, and the average used-car loan 11.19%. At those rates, paying cash wins.</p>',
      '<h3>Taxes on your cash</h3><ul><li>Money market income is taxed at your federal rate every year, even if you never withdraw it.</li><li>Part of VMFXX’s income comes from US government debt, which most states let you leave out of state income (about two-thirds of it in 2025). California, Connecticut and New York allow this only when at least half of the fund is US government debt; VMFXX reportedly met that test for 2025. A Treasury money market fund such as VUSXX or Treasury bills are almost fully state-tax-free, which helps in high-tax states.</li><li>Money market funds are very low risk but are not FDIC-insured.</li></ul>',
      '<h3>The new car loan interest deduction (2025 to 2028)</h3><p>A 2025 law lets you deduct up to $10,000 a year of interest on a car loan, whether or not you itemize, if:</p><ul><li>the car is new (you are its first owner) and had its final assembly in the US,</li><li>the loan started after December 31, 2024, is for personal use and is secured by the car,</li><li>your income is low enough: the deduction shrinks by $200 for each $1,000 of modified AGI above $100,000 (single) or $200,000 (married filing jointly).</li></ul><p>You report the car’s VIN on your return. Used cars and leases do not qualify. The deduction lowers the loan’s cost by your tax bracket, but at normal rates it rarely flips the answer.</p>',
      '<h3>When the loan wins</h3><p>Dealer promotions at 0% to about 2.9% can beat what your cash earns after tax. Then take the loan and leave the cash invested, and do not touch it. Watch for one catch: dealers often make you choose between promo financing and a cash rebate. Compare the rebate with what the cheap loan is worth.</p>',
      '<h3>Keep the cushion, and mind depreciation</h3><p>Pay cash only from money above your emergency fund of three to six months of expenses. A car paid in cash with no cushion left often ends with the next repair on a credit card.</p><h3>Two hidden costs to count</h3><ul><li><b>Selling investments to pay cash.</b> If the cash would come from selling stocks or funds that have gone up, not from a money market, the capital-gains tax on that sale is part of the cost of paying cash (see <a href="#l-cap-gains">capital gains</a>). Selling shares held over a year with small gains costs little; selling big short-term winners can cost a lot.</li><li><b>Insurance.</b> A lender requires full coverage (collision and comprehensive) for as long as you owe money. If you own the car outright, you choose your coverage, and on an older car you might drop collision. On a cheaper or older car, that difference can tilt the answer toward cash.</li></ul><p>The car loses value either way. New cars commonly lose 10% to 20% in the first year and roughly 35% to 60% over five years, depending on the model and miles. Long loans (72 months or more) can leave you owing more than the car is worth. Edmunds suggests keeping a new-car payment under about 15% of take-home pay.</p>',
      '<h3>Shop the loan like a pro</h3><p>Get a pre-approval from your bank or a credit union before you visit the dealer, then let the dealer try to beat it. Auto-loan inquiries made within a short window count as one for FICO. Negotiate the car price first, the financing second.</p>',
    ],
    example: {
      title: '$35,000 new car: cash or 6.35% loan',
      intro: 'You have $35,000 in VMFXX beyond your emergency fund. You are in the 22% bracket and your state has no income tax.',
      steps: [
        'Loan: 60 months at 6.35% is $682.36 a month, about $5,940 of interest in total.',
        'Your cash earns 3.83% before tax, 2.99% after 22% federal tax. Kept invested for five years, the $35,000 earns about $5,630 after tax.',
        'Compare equal monthly budgets: pay cash and invest $682.36 a month instead, or take the loan and keep $35,000 invested. After 60 months, paying cash leaves you about $3,470 ahead.',
        'If the car qualifies for the interest deduction and your income is under $100,000, the deduction saves about $1,310 of federal tax. Cash still wins by about $2,160.',
        'Now the dealer offers 0% for 60 months ($583.33 a month). Keeping your cash invested wins by about $2,930, unless a cash rebate for paying up front is worth more.',
      ],
      result: 'Borrow only when the loan rate is below your after-tax yield. At 6.35% against 2.99%, pay cash.',
    },
    mistakes: [
      'Comparing the loan APR with your yield before tax. Taxes shrink what your cash really earns.',
      'Draining the emergency fund to avoid a loan, then putting the next repair on a 22% card.',
      'Shopping by monthly payment. A 72- or 84-month loan makes any car look affordable and costs far more interest.',
      'Selling appreciated stocks to pay cash and forgetting the capital-gains tax, or forgetting that a loan locks you into full-coverage insurance.',
    ],
    points: [
      'Compare the loan APR with your cash’s after-tax yield. The higher number decides.',
      'At average 2026 rates (6.35% new, 11.19% used), paying cash usually wins.',
      'Promo loans near 0% can beat cash; keep the cash invested and untouched.',
      'The 2025-2028 deduction helps on new US-assembled cars, but rarely changes the answer.',
      'Never pay cash with your emergency fund.',
    ],
    terms: ['APR', 'Money market fund', 'T-bill', 'Marginal tax rate', 'Emergency fund', 'Opportunity cost'],
    glossary: [{ t: 'Car depreciation', d: 'The value a car loses over time. Steepest in the first year for a new car.' }, { t: 'Upside down', d: 'Owing more on a car loan than the car is worth. Common with long loans and small down payments.' }],
    quiz: { q: 'Your loan offer is 5.5%. Your cash earns 4% in a money market and you pay 30% combined tax. Which is cheaper?', options: ['Take the loan, because 4% is close to 5.5%', 'Pay cash: 4% after 30% tax is 2.8%, well below 5.5%', 'It is always better to borrow and invest'], answer: 1, why: 'After tax your cash earns 2.8%. Borrowing at 5.5% to keep earning 2.8% loses money.' },
    sources: [SRC.irsCar, SRC.auto, SRC.vgTax, SRC.bankrate],
  });
})();
