/* Smart Taxes, part 1 (fork W11): tax brackets, deductions and credits, asset location. 2026 federal figures. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const usd = (v) => F.usd(Math.round(v), 0);
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + (+(a / 1e6).toFixed(a >= 1e7 ? 0 : 2)) + 'M'; else if (a >= 1000) s = '$' + (+(a / 1000).toFixed(a >= 1e4 ? 0 : 1)) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const pct = (f, d) => F.pct(f * 100, d == null ? 1 : d);
  const setT = (id, txt, cls) => { const el = $id(id); if (!el) return; el.textContent = txt; el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (id, cls, pill, html) => { const el = $id(id); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  function tipper(fig) {
    let tip = null;
    return {
      show(x, y, html, W) {
        if (!tip || !fig.contains(tip)) { tip = document.createElement('div'); tip.className = 'wg-tip'; fig.appendChild(tip); }
        tip.hidden = false; tip.innerHTML = html;
        const tw = tip.offsetWidth; let left = 14 + x + 14; if (left + tw > 14 + W) left = 14 + x - 14 - tw;
        tip.style.left = Math.max(4, left) + 'px'; tip.style.top = Math.max(4, 14 + y - 30) + 'px';
      },
      hide() { if (tip) tip.hidden = true; },
    };
  }
  /* rough text width for svg layout */
  const tw = (s, px) => String(s).length * (px || 11.5) * 0.56;

  SML.css(`
    .wtx-list{padding:6px 16px 16px;display:flex;flex-direction:column;gap:10px}
    .wtx-list > p{font:500 10.5px/1.3 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding-top:10px}
    .wtx-cards{list-style:none;display:grid;grid-template-columns:1fr;gap:8px}
    @media(min-width:720px){.wtx-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .wtx-card{border:1px solid var(--line);border-radius:var(--r);background:var(--bg);padding:12px 14px;display:flex;flex-direction:column;gap:6px;min-width:0}
    .wtx-card.top{border-color:color-mix(in srgb,var(--accent) 55%,transparent)}
    .wtx-ch{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:6px 10px}
    .wtx-ch b{font-weight:600;color:var(--ink);font-size:15px;line-height:1.3}
    .wtx-ch .pill{flex:0 1 auto;max-width:100%;white-space:normal;text-align:left;line-height:1.25;padding:4px 9px}
    .wtx-card p{font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 75%,transparent)}
    .wtx-card a{color:var(--accent)}
    .wtx-try{font:500 10.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
    .wtx-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px 0;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
    .wtx-legend i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px;vertical-align:-1px;background:var(--c)}
  `);

  /* ===================== 2026 federal tax data (IRS Rev. Proc. 2025-32, IR-2025-103) ===================== */
  const TX = {
    std: { single: 16100, mfj: 32200, hoh: 24150 },
    add65: { single: 2050, mfj: 1650, hoh: 2050 },            // per person 65+ (or blind)
    br: {
      single: [[0, 0.10], [12400, 0.12], [50400, 0.22], [105700, 0.24], [201775, 0.32], [256225, 0.35], [640600, 0.37]],
      mfj: [[0, 0.10], [24800, 0.12], [100800, 0.22], [211400, 0.24], [403550, 0.32], [512450, 0.35], [768700, 0.37]],
      hoh: [[0, 0.10], [17700, 0.12], [67450, 0.22], [105700, 0.24], [201750, 0.32], [256200, 0.35], [640600, 0.37]],
    },
    seniorStart: { single: 75000, mfj: 150000, hoh: 75000 },  // $6,000 per person 65+, 2025-2028, minus 6% of MAGI above
  };
  const STATUS = [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married jointly' }, { v: 'hoh', label: 'Head of household' }];
  function taxOn(ti, st) {
    const b = TX.br[st]; let t = 0;
    for (let i = 0; i < b.length; i++) { const lo = b[i][0], hi = i + 1 < b.length ? b[i + 1][0] : Infinity; if (ti > lo) t += (Math.min(ti, hi) - lo) * b[i][1]; }
    return t;
  }
  function rateAt(ti, st) { if (ti <= 0) return 0; const b = TX.br[st]; let r = b[0][1]; b.forEach((x) => { if (ti >= x[0]) r = x[1]; }); return r; }
  const seniorDed = (agi, st, n) => n * Math.max(0, 6000 - 0.06 * Math.max(0, agi - TX.seniorStart[st]));
  function calcTax(gross, pretax, st, is65) {
    pretax = Math.min(pretax, gross);
    const agi = gross - pretax, n = is65 ? (st === 'mfj' ? 2 : 1) : 0;
    const std = TX.std[st] + n * TX.add65[st], sen = seniorDed(agi, st, n), ded = std + sen;
    const ti = Math.max(0, agi - ded);
    return { gross, pretax, agi, n, std, sen, ded, ti, tax: taxOn(ti, st) };
  }

  /* =====================================================================
     1. bracketViz: income fills the bracket buckets (tool)
     ===================================================================== */
  const PRESETS = {
    p1: { st: 'single', g: 55000, p: 3000, a: false },
    p2: { st: 'mfj', g: 150000, p: 15000, a: false },
    p3: { st: 'single', g: 260000, p: 24500, a: false },
    p4: { st: 'mfj', g: 90000, p: 0, a: true },
  };
  SML.widgets.bracketViz = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('bv');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-st', STATUS, opts.status || 'single', 'Filing status')}${ui.chips(id + '-65', [{ k: 'a', label: 'Age 65+', color: 'var(--up)', on: false }])}</div>
      <div class="wg-bar"><span class="wtx-try">Try</span>${ui.seg(id + '-pre', [{ v: 'p1', label: 'Starter $55k' }, { v: 'p2', label: 'Couple $150k' }, { v: 'p3', label: 'High earner' }, { v: 'p4', label: 'Retired couple' }], '', 'Example households')}</div>
      <div class="wtx-legend" aria-hidden="true"><span><i style="--c:var(--up-t)"></i>Tax-free</span><span><i style="--c:var(--accent-t)"></i>Taxed</span><span><i style="--c:var(--accent)"></i>Your top bracket</span><span><i style="--c:color-mix(in srgb,var(--info) 40%,var(--surface))"></i>Pre-tax saving (tax saved)</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-g', label: 'Income (wages, pensions, IRA withdrawals)', min: 0, max: 600000, step: 1000, value: opts.income != null ? opts.income : 85000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-p', label: 'Pre-tax 401(k) + HSA', min: 0, max: 45000, step: 500, value: opts.pretax != null ? opts.pretax : 5000, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Federal income tax', id + '-tax', 'hl big')}${ui.stat('Taxable income', id + '-ti')}${ui.stat('Top rate', id + '-mr')}${ui.stat('Effective rate', id + '-er')}${ui.stat('A $1,000 raise', id + '-raise')}${ui.stat('$1,000 more pre-tax', id + '-k')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 federal income tax on ordinary income only (IRS brackets). Leaves out credits, capital gains, payroll tax (7.65% on wages) and state tax. "Age 65+" adds the extra standard deduction and the $6,000 senior deduction for 2025 to 2028 (both spouses when married). Hover the chart to read any slice.</div>`;
    const fig = root.querySelector('.wg-fig'), tip = tipper(fig);
    let busy = false;
    const st = ui.wire(root, (e) => {
      const pre = e && e.target && e.target.closest && e.target.closest('#' + id + '-pre');
      if (pre) { const p = PRESETS[st.seg(id + '-pre')]; if (p) { busy = true; st.setSeg(id + '-st', p.st); st.set(id + '-g', p.g); st.set(id + '-p', p.p); const c = root.querySelector(`#${id}-65 .chip`); c.classList.toggle('on', p.a); c.setAttribute('aria-pressed', p.a); busy = false; } }
      else if (!busy) st.setSeg(id + '-pre', '');
      draw();
    });
    let G = null;
    function state() {
      const s = st.seg(id + '-st') || 'single', g = st.n(id + '-g'), p = Math.min(st.n(id + '-p'), st.n(id + '-g')), a = st.on(id + '-65', 'a');
      const c = calcTax(g, p, s, a);
      const up = calcTax(g + 1000, p, s, a), k = calcTax(g, p + 1000, s, a);
      return { s, a, c, dRaise: up.tax - c.tax, dK: c.tax - (g >= p + 1000 ? k.tax : c.tax) };
    }
    function zones(c, s) {
      const z = [{ lo: 0, hi: c.ded, r: 0, name: 'Deductions' }];
      const b = TX.br[s];
      b.forEach((x, i) => z.push({ lo: c.ded + x[0], hi: c.ded + (i + 1 < b.length ? b[i + 1][0] : 1e9), r: x[1], name: Math.round(x[1] * 100) + '% bracket', tlo: x[0], thi: i + 1 < b.length ? b[i + 1][0] : null }));
      return z;
    }
    fig.addEventListener('pointermove', (e) => {
      if (!G) return; const svg = fig.querySelector('svg'); if (!svg) return; const p = ui.pt(svg, e);
      if (p.x < G.pl || p.x > G.W - G.pr || p.y > G.base + 4 || p.y < G.pt) { tip.hide(); return; }
      const d = G.x.inv(p.x); const z = G.z.find((q) => d >= q.lo && d < q.hi); if (!z) { tip.hide(); return; }
      const used = Math.max(0, Math.min(G.c.agi, z.hi) - z.lo);
      let h;
      if (z.r === 0) h = `<b>Tax-free</b><br>First ${usd(z.hi)} of income<br>(standard${G.c.sen ? ' + senior' : ''} deduction)`;
      else h = `<b>${z.name}</b><br>Taxable ${usd(z.tlo)} to ${z.thi ? usd(z.thi) : 'and up'}<br>Yours here: ${usd(used)}<br>Tax here: <span class="acc">${usd(used * z.r)}</span>`;
      tip.show(p.x, p.y, h, G.W);
    });
    fig.addEventListener('pointerleave', () => tip.hide());
    const draw = ui.responsive(fig, (W) => {
      const S0 = state(), c = S0.c, s = S0.s;
      const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.5, 270, 360));
      const pl = compact ? 34 : 42, pr = 12, pt = 38, pb = 28, base = H - pb;
      const xMax = Math.max(c.gross * 1.15, c.ded + TX.br[s][2][0] * 1.1, 30000);
      const x = SML.lin(0, xMax, pl, W - pr), y = SML.lin(0, 0.4, base, pt);
      const z = zones(c, s);
      let b = '';
      [0.1, 0.2, 0.3, 0.4].forEach((r) => { b += S.line(pl, y(r), W - pr, y(r), 's-grid') + S.text(pl - 6, y(r) + 4, Math.round(r * 100) + '%', 'xs mono', 'end'); });
      const mr = rateAt(c.ti, s);
      const labels = [];
      z.forEach((q) => {
        if (q.lo >= xMax) return;
        const x0 = x(q.lo), x1 = x(Math.min(q.hi, xMax)), wcol = x1 - x0;
        if (q.r === 0) {
          b += S.rect(x0, base - 8, wcol, 8, 'f-surf s-line w1');
          const ux = x(Math.min(c.agi, q.hi));
          if (c.agi > 0) b += S.rect(x0, base - 8, ux - x0, 8, 'f-up-t s-up w1');
          if (wcol > 60) labels.push(S.text(x0 + wcol / 2, base - 14, compact ? '0%' : 'tax-free', 'sm up b', 'middle'));
          return;
        }
        const yt = y(q.r);
        b += S.rect(x0, yt, wcol, base - yt, 'f-surf s-line w1');
        const uEnd = Math.min(c.agi, q.hi, xMax);
        const isTop = q.r === mr && c.agi > q.lo && c.agi <= q.hi;
        if (uEnd > q.lo) {
          const uw = x(uEnd) - x0;
          b += S.rect(x0, yt, uw, base - yt, (isTop ? 'f-acc' : 'f-acc-t') + ' s-acc w1');
          const taxSlice = (uEnd - q.lo) * q.r;
          if (uw > (compact ? 42 : 48) && base - yt > 26) labels.push(S.text(x0 + uw / 2, base - Math.max(12, (base - yt) * 0.3), kfmt(taxSlice), 'sm mono b ' + (isTop ? 'onacc' : 'ink'), 'middle'));
        }
        if (wcol > 24) labels.push(S.text(x0 + wcol / 2, yt - 6, Math.round(q.r * 100) + '%', 'md b ' + (uEnd > q.lo ? 'acc' : 'mut'), 'middle'));
      });
      // pre-tax slice: income that never reached the brackets
      let saved = 0;
      if (c.pretax > 0 && c.agi < xMax) {
        z.forEach((q) => {
          const a0 = Math.max(q.lo, c.agi), a1 = Math.min(q.hi, c.gross, xMax); if (a1 <= a0) return;
          const top = q.r === 0 ? base - 8 : y(q.r);
          b += S.rect(x(a0), top, x(a1) - x(a0), base - top, 'f-info o35') + S.rect(x(a0), top, x(a1) - x(a0), base - top, 'nf s-info w15 dash2');
        });
        saved = calcTax(c.gross, 0, s, S0.a).tax - c.tax;
        const mx = x((c.agi + Math.min(c.gross, xMax)) / 2), wSl = x(Math.min(c.gross, xMax)) - x(c.agi);
        const zt = z.find((q) => c.agi >= q.lo && c.agi < q.hi); const ytop = zt && zt.r ? y(zt.r) : base - 8;
        if (wSl > 44 && saved > 0 && base - ytop > 40) labels.push(S.text(mx, (ytop + base) / 2 + 4, kfmt(saved), 'sm mono b ink', 'middle'));
      }
      // income marker
      if (c.gross > 0) {
        const gx = x(Math.min(c.gross, xMax));
        b += S.line(gx, pt - 4, gx, base, 's-ink w15 dash2');
        const lab = (compact ? '' : 'income ') + kfmt(c.gross);
        const anchor = gx + tw(lab) / 2 > W - pr ? 'end' : gx - tw(lab) / 2 < pl ? 'start' : 'middle';
        labels.push(S.text(gx, pt - 10, lab, 'sm ink b', anchor));
      }
      // effective rate: same tax as if every dollar paid this rate
      const eff = c.gross > 0 ? c.tax / c.gross : 0;
      if (eff > 0.004) {
        const ex = x(Math.min(c.gross, xMax)); b += S.line(pl, y(eff), ex, y(eff), 's-vio w2 dash');
        const lab = 'effective ' + pct(eff);
        labels.push(S.rect(pl + 4, y(eff) - 17, tw(lab) + 10, 15, 'f-bg', 3) + S.text(pl + 9, y(eff) - 6, lab, 'sm vio b'));
      }
      b += S.line(pl, base + 0.5, W - pr, base + 0.5, 's-mut');
      SML.ticks(0, xMax, compact ? 3 : 5).forEach((v) => { if (x(v) > W - pr - 8) return; b += S.text(x(v), base + 17, kfmt(v), 'xs mono', 'middle'); });
      b += labels.join('');
      fig.innerHTML = S.wrap(W, H, `Income of ${usd(c.gross)} filling the 2026 tax brackets: tax ${usd(c.tax)}, top rate ${Math.round(mr * 100)}%`, b);
      G = { W, pl, pr, pt, base, x, z, c };
      setT(id + '-tax', usd(c.tax)); setT(id + '-ti', usd(c.ti)); setT(id + '-mr', Math.round(mr * 100) + '%', 'acc'); setT(id + '-er', pct(eff), 'info');
      setT(id + '-raise', (S0.dRaise >= 0 ? '+' : '') + usd(S0.dRaise) + ' tax', 'dn');
      setT(id + '-k', S0.dK > 0 ? F.minus + usd(S0.dK) + ' tax' : '$0 saved', S0.dK > 0 ? 'up' : '');
      const phase = c.n && c.agi > TX.seniorStart[s] && c.sen > 0;
      if (c.gross === 0) setMsg(id + '-msg', 'acc', 'No income', 'Drag the income slider. Your first dollars land in the tax-free zone created by the standard deduction.');
      else if (c.ti === 0) setMsg(id + '-msg', 'up', 'No income tax', `Your deductions (${usd(c.ded)}) cover all ${usd(c.agi)} of income, so you owe no federal income tax. Pre-tax saving cannot cut a tax you don't owe; a Roth account may suit you better.`);
      else {
        const zTop = z.find((q) => q.r === mr && c.agi > q.lo && c.agi <= q.hi);
        const inTop = zTop ? c.agi - zTop.lo : 0;
        let m = `Your top bracket is ${Math.round(mr * 100)}%, but only the last ${usd(inTop)} of taxable income pays it. Overall you pay ${pct(eff)} of your income. A $1,000 raise adds ${usd(S0.dRaise)} of income tax, so you keep the rest. Tax brackets alone never make a raise cost you money.`;
        if (phase) m += ' Your senior deduction is shrinking as income rises, so extra income costs a little more than your bracket.';
        if (saved > 0) m += ` Pre-tax saving is keeping ${usd(c.pretax)} out of your top bracket and saving ${usd(saved)}.`;
        setMsg(id + '-msg', mr >= 0.32 ? 'vio' : 'acc', Math.round(mr * 100) + '% bracket', m);
      }
    });
  };

  /* =====================================================================
     2. deductionFinder: which deductions and credits fit you, and standard vs itemize
     ===================================================================== */
  const SIT = [
    { k: 'k401', label: '401(k) at work', on: true }, { k: 'hsa', label: 'HSA-eligible health plan' }, { k: 'noplan', label: 'No retirement plan at work' },
    { k: 'a65', label: 'Age 65+' }, { k: 'tips', label: 'Earn tips' }, { k: 'ot', label: 'Paid overtime' }, { k: 'car', label: 'New US-built car on a loan' },
    { k: 'care', label: 'Pay for child care' }, { k: 'college', label: 'Paying college tuition' }, { k: 'biz', label: 'Side business' }, { k: 'k529', label: 'Saving for a child’s school' },
  ];
  const DCFSA = 7500; // dependent care FSA limit from 2026 (OBBBA)
  SML.widgets.deductionFinder = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('df');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-st', STATUS, opts.status || 'single', 'Filing status')}</div>
      <div class="wg-bar">${ui.chips(id + '-sit', SIT.map((x) => ({ k: x.k, label: x.label, color: 'var(--accent)', on: !!x.on })))}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-agi', label: 'Income (AGI)', min: 15000, max: 600000, step: 1000, value: opts.income || 95000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-kids', label: 'Children under 17', min: 0, max: 5, step: 1, value: opts.kids || 0, fmt: 'num' })}
        ${ui.slider({ id: id + '-salt', label: 'State + local taxes paid', min: 0, max: 60000, step: 500, value: opts.salt != null ? opts.salt : 7000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-mort', label: 'Mortgage interest', min: 0, max: 50000, step: 500, value: opts.mort || 0, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-char', label: 'Cash given to charity', min: 0, max: 30000, step: 250, value: opts.charity != null ? opts.charity : 1500, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('Your bracket', id + '-r', 'hl')}${ui.stat('Best deduction', id + '-best')}${ui.stat('Taxable income', id + '-ti')}${ui.stat('Biggest lever', id + '-lev')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wtx-list"><p>What applies to you, biggest first</p><ul class="wtx-cards" id="${id}-cards"></ul></div>
      <div class="wg-note">2026 federal rules. Savings are rough: deductions are valued at your top bracket, credits dollar for dollar. Tick the situations that fit you; amounts shown "per $1,000" or "if maxed" scale with what you actually put in.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    function model() {
      const s = st.seg(id + '-st') || 'single', on = (k) => st.on(id + '-sit', k);
      const agi = st.n(id + '-agi'), kids = st.n(id + '-kids'), salt = st.n(id + '-salt'), mort = st.n(id + '-mort'), charity = st.n(id + '-char');
      const mfj = s === 'mfj';
      const n65 = on('a65') ? (mfj ? 2 : 1) : 0;
      const std = TX.std[s] + n65 * TX.add65[s];
      const saltCap = Math.max(10000, 40400 - 0.3 * Math.max(0, agi - 505000));
      const saltDed = Math.min(salt, saltCap), charFloor = 0.005 * agi, charItem = Math.max(0, charity - charFloor);
      const itemized = saltDed + mort + charItem, useItem = itemized > std;
      const sen = seniorDed(agi, s, n65);
      const nonItemChar = useItem ? 0 : Math.min(charity, mfj ? 2000 : 1000);
      const ti = Math.max(0, agi - Math.max(std, itemized) - sen - nonItemChar);
      const r = rateAt(ti, s);
      const items = [];
      const add = (o) => items.push(o);
      // standard vs itemize
      if (useItem) add({ t: 'Itemize', v: (itemized - std) * r, tag: `≈ ${usd((itemized - std) * r)} more than standard`, p: `Your itemized total of ${usd(itemized)} beats the ${usd(std)} standard deduction, so list your deductions on Schedule A.` });
      else add({ t: 'Standard deduction', v: null, tag: usd(std), p: `Your itemized total (${usd(itemized)}) is ${usd(std - itemized)} short of the ${usd(std)} standard deduction, so take the standard. Bunching two years of giving into one year can tip it.${n65 ? ` It includes the extra ${usd(n65 * TX.add65[s])} for age 65+.` : ''}` });
      if (on('k401')) add({ t: '401(k) contributions', v: 24500 * r, tag: r ? `≈ ${usd(24500 * r)} if you max it` : 'no tax to cut', p: `Up to $24,500 in 2026, plus $8,000 at 50+ (or $11,250 at ages 60 to 63). Each $1,000 you put in saves about ${usd(1000 * r)} now. <a href="#l-401k-limits">Limits lesson</a>.` });
      if (on('hsa')) { const lim = mfj ? 8750 : 4400; add({ t: 'HSA contributions', v: lim * (r + 0.0765), tag: `≈ ${usd(lim * (r + 0.0765))} if maxed via payroll`, p: `$4,400 self-only or $8,750 family coverage in 2026, plus $1,000 at 55+. Through payroll it also skips the 7.65% payroll tax, and it stays tax-free for medical bills. <a href="#l-hsa">HSA lesson</a>.` }); }
      const ira = { lo: mfj ? 129000 : 81000, hi: mfj ? 149000 : 91000 };
      if (on('noplan')) add({ t: 'Deductible traditional IRA', v: 7500 * r, tag: `≈ ${usd(7500 * r)} if maxed`, p: 'With no retirement plan at work, a traditional IRA contribution of up to $7,500 ($8,600 at 50+) is deductible in 2026. (If your spouse has a plan, a separate income limit applies.)' });
      else if (on('k401')) {
        const f = SML.clamp((ira.hi - agi) / (ira.hi - ira.lo), 0, 1);
        if (f > 0) add({ t: 'Traditional IRA deduction', v: 7500 * r * f, tag: f < 1 ? `partly: ≈ ${usd(7500 * r * f)}` : `≈ ${usd(7500 * r)} if maxed`, p: `Even with a 401(k), a traditional IRA is deductible below ${usd(ira.lo)} of income and phases out by ${usd(ira.hi)} in 2026.` });
        else add({ t: 'IRA: no deduction at your income', v: null, tag: 'use a Roth instead', p: `Above ${usd(ira.hi)} with a workplace plan, a traditional IRA is not deductible. A Roth IRA (or the <a href="#l-backdoor-roth">backdoor Roth</a> above the Roth income limit) is usually the better use of the $7,500.` });
      }
      if (salt > 0) add({ t: 'State and local taxes (SALT)', v: null, tag: useItem ? 'counted in itemized' : 'only if itemizing', p: `Deductible only when you itemize, capped at $40,400 in 2026. The cap shrinks by 30% of income above $505,000 but never below $10,000.${salt > saltCap ? ` ${usd(salt - saltCap)} of yours is over the cap and buys nothing.` : ''}` });
      if (mort > 0) add({ t: 'Mortgage interest', v: null, tag: useItem ? 'counted in itemized' : 'only if itemizing', p: 'Interest on up to $750,000 of mortgage debt for your main and second home, if you itemize. Starting in 2026, mortgage insurance (PMI) premiums count again for itemizers, phasing out above $100,000 of AGI. <a href="#l-home-taxes">Home taxes lesson</a>.' });
      if (charity > 0) {
        if (useItem) add({ t: 'Charity (itemized)', v: null, tag: 'counted in itemized', p: `Itemizers deduct gifts above 0.5% of AGI (the first ${usd(charFloor)} here doesn't count). In the 37% bracket each dollar of itemized deductions is worth 35 cents.` });
        else add({ t: 'Charity without itemizing', v: nonItemChar * r, tag: `≈ ${usd(nonItemChar * r)}`, p: `New from 2026 and permanent: deduct up to $1,000 of cash gifts ($2,000 joint) even with the standard deduction. Gifts to donor-advised funds don't qualify.` });
      }
      if (n65) add({ t: 'Senior deduction', v: sen * r, tag: sen > 0 ? `≈ ${usd(sen * r)}` : 'phased out', p: `$6,000 per person 65+ for 2025 to 2028, on top of the standard or itemized deduction. It shrinks by 6% of income above ${usd(TX.seniorStart[s])}. Married couples must file jointly; SSNs required.${sen < n65 * 6000 && sen > 0 ? ` At your income you keep ${usd(sen)}.` : ''}` });
      const hiPh = mfj ? 300000 : 150000;
      const tipCap = Math.max(0, 25000 - 0.1 * Math.max(0, agi - hiPh)), otCap = Math.max(0, (mfj ? 25000 : 12500) - 0.1 * Math.max(0, agi - hiPh));
      if (on('tips')) add({ t: 'No tax on tips', v: Math.min(10000, tipCap) * r, tag: tipCap <= 0 ? 'phased out at your income' : agi > hiPh ? `cap cut to ${usd(tipCap)} at your income` : `≈ ${usd(10000 * r)} per $10,000 of tips`, p: `Deduct up to $25,000 of qualified tips a year, 2025 to 2028, without itemizing. It phases out above ${usd(hiPh)} of income. Married couples must file jointly; SSN required. Payroll tax still applies.` });
      if (on('ot')) add({ t: 'No tax on overtime', v: Math.min(5000, otCap) * r, tag: otCap <= 0 ? 'phased out at your income' : agi > hiPh ? `cap cut to ${usd(otCap)} at your income` : `≈ ${usd(5000 * r)} per $5,000 of OT premium`, p: `Deduct the extra "half" of time-and-a-half pay: up to $12,500 ($25,000 joint) a year, 2025 to 2028. It phases out above ${usd(hiPh)} of income. Married couples must file jointly; SSN required.` });
      if (on('car')) { const cph = mfj ? 200000 : 100000, carCap = Math.max(0, 10000 - 0.2 * Math.max(0, agi - cph)); add({ t: 'Car loan interest', v: Math.min(2500, carCap) * r, tag: carCap <= 0 ? 'phased out at your income' : agi > cph ? `cap cut to ${usd(carCap)} at your income` : `≈ ${usd(2500 * r)} on $2,500 of interest`, p: `Up to $10,000 a year of interest on a loan taken after 2024 for a new car with final assembly in the US, for personal use, 2025 to 2028. It phases out above ${usd(cph)} of income. Put the VIN on your return.` }); }
      if (kids > 0) { const thr = mfj ? 400000 : 200000; const ctc = Math.max(0, kids * 2200 - 50 * Math.ceil(Math.max(0, agi - thr) / 1000)); add({ t: 'Child tax credit', v: ctc, tag: `${usd(ctc)} credit`, p: `$2,200 per child under 17 in 2026, up to $1,700 of it refundable. It shrinks by $50 for each $1,000 of income above ${usd(thr)}. The child needs an SSN, and so does at least one parent on a joint return.` }); }
      if (on('care')) { const cap = kids >= 2 ? 6000 : 3000; const fsa = DCFSA * (r + 0.0765); add({ t: 'Child care: credit or FSA', v: Math.max(cap * 0.2, fsa), tag: `credit ≥ ${usd(cap * 0.2)}, FSA ≈ ${usd(fsa)}`, p: `The dependent care credit covers 20% to 50% of up to $3,000 of care for one child or $6,000 for two or more (the top rate rose to 50% in 2026 and shrinks as income rises). A dependent care FSA at work lets you pay up to $7,500 of care with pre-tax pay instead. The same dollars can't count twice.` }); }
      if (on('college')) { const lo = mfj ? 160000 : 80000, hi = mfj ? 180000 : 90000; const f = SML.clamp((hi - agi) / (hi - lo), 0, 1); add({ t: 'Education credits', v: 2500 * f, tag: f > 0 ? `up to ${usd(2500 * f)} per student` : 'over the income limit', p: `American opportunity credit: up to $2,500 per student for the first four years of college. Lifetime learning credit: up to $2,000 per return for any courses. Both phase out between ${usd(lo)} and ${usd(hi)} of income.` }); }
      const svT = { single: [24250, 26250, 40250], hoh: [36375, 39375, 60375], mfj: [48500, 52500, 80500] }[s], svLim = svT[2];
      const svRate = agi <= svT[0] ? 0.5 : agi <= svT[1] ? 0.2 : agi <= svT[2] ? 0.1 : 0, svVal = svRate * (mfj ? 4000 : 2000);
      if ((on('k401') || on('noplan')) && svRate > 0) add({ t: "Saver's credit", v: svVal, tag: `${usd(svVal)} if you save ${mfj ? '$4,000' : '$2,000'}`, p: `With income at or under ${usd(svLim)} in 2026, you get a credit of 10% to 50% of up to $2,000 you save in a 401(k) or IRA ($4,000 joint). The lower your income, the higher the rate.` });
      if (on('biz')) add({ t: 'Side business deductions', v: 0.2 * 20000 * r, tag: `≈ ${usd(0.2 * 20000 * r)} per $20,000 of profit`, p: 'The qualified business income deduction can take up to 20% of business profit off your taxable income (limits apply above $201,750 single or $403,500 joint of taxable income). You also deduct half of self-employment tax and can save far more in a solo 401(k) or SEP-IRA. A CPA or enrolled agent pays for themselves here.' });
      if (on('k529')) add({ t: '529 education savings', v: null, tag: 'state tax break', p: 'No federal deduction, but many states give a deduction or credit for 529 contributions, and growth is tax-free when spent on school. <a href="#l-kids-money">Kids’ money lesson</a>.' });
      const ranked = items.slice(1).filter((x) => x.v != null).sort((a, b) => b.v - a.v);
      return { s, agi, std, saltDed, saltOver: Math.max(0, salt - saltCap), mort, charItem, charFloor: Math.min(charity, charFloor), itemized, useItem, ti, r, items, ranked };
    }
    const draw = ui.responsive(fig, (W) => {
      const m = model();
      const compact = W < 520;
      const bars = m.ranked.slice(0, compact ? 4 : 6);
      const labW = compact ? 0 : 190, pl = 6 + labW, pr = compact ? 12 : 16;
      const rowH = compact ? 44 : 34, barH = compact ? 18 : 20;
      const sec2 = bars.length ? 34 + bars.length * rowH : 0;
      const H = 30 + 2 * rowH + 18 + sec2 + 6;
      let b = '';
      // section 1: standard vs itemized
      b += S.text(6, 16, 'STANDARD OR ITEMIZE?', 'cap');
      const xMaxD = Math.max(m.std, m.itemized + m.saltOver, 1) * 1.12;
      const xd = SML.lin(0, xMaxD, pl, W - pr - (compact ? 8 : 70));
      const row = (i) => 30 + i * rowH + (compact ? 16 : 0);
      const lab = (i, t, cls) => compact ? S.text(6, row(i) - 5, t, 'sm b ' + (cls || 'ink')) : S.text(6, row(i) + barH / 2 + 4, t, 'md b ' + (cls || 'ink'));
      // standard
      b += lab(0, 'Standard', m.useItem ? 'mut' : 'ink') + S.rect(pl, row(0), xd(m.std) - pl, barH, (m.useItem ? 'f-shade2' : 'f-up') + '', 3);
      b += S.text(xd(m.std) + 6, row(0) + barH / 2 + 4, usd(m.std) + (m.useItem ? '' : ' ✓'), 'sm mono b ' + (m.useItem ? 'mut' : 'up'));
      // itemized stack
      b += lab(1, 'Itemized', m.useItem ? 'ink' : 'mut');
      let cx = pl;
      [[m.saltDed, 'f-info', 'SALT'], [m.mort, 'f-vio', 'mortgage'], [m.charItem, 'f-acc', 'charity']].forEach(([v, cls, t]) => {
        if (v <= 0) return; const w = xd(v) - pl;
        b += S.rect(cx, row(1), w, barH, cls + (m.useItem ? '' : ' o70'), 2);
        if (w > tw(t, 11.5) + 10) b += S.text(cx + w / 2, row(1) + barH / 2 + 4, t, 'sm b onacc', 'middle');
        cx += w;
      });
      if (m.saltOver > 0) { const w = xd(m.saltOver) - pl; b += S.rect(cx, row(1), w, barH, 'nf s-dn w15 dash2', 2); if (w > 52) b += S.text(cx + w / 2, row(1) + barH / 2 + 4, 'over cap', 'xs dn b', 'middle'); cx += w; }
      if (m.itemized <= 0) b += S.text(pl + 4, row(1) + barH / 2 + 4, 'nothing to itemize yet', 'sm mut');
      else b += S.text(cx + 6, row(1) + barH / 2 + 4, usd(m.itemized) + (m.useItem ? ' ✓' : ''), 'sm mono b ' + (m.useItem ? 'up' : 'mut'));
      b += S.line(xd(m.std), row(0) - 4, xd(m.std), row(1) + barH + 4, 's-ink w15 dash2');
      // section 2: savings
      if (bars.length) {
        const y0 = 30 + 2 * rowH + 18;
        b += S.text(6, y0 + 4, 'ROUGH TAX SAVED, BIGGEST FIRST', 'cap');
        const vmax = Math.max(...bars.map((x) => x.v), 1) * 1.1;
        const xs = SML.lin(0, vmax, pl, W - pr - (compact ? 56 : 70));
        bars.forEach((it, i) => {
          const yy = y0 + 20 + i * rowH + (compact ? 16 : 0);
          const t = compact && tw(it.t, 11.5) > W - 20 ? it.t.slice(0, 30) + '…' : it.t;
          b += compact ? S.text(6, yy - 5, t, 'sm ink') : S.text(6, yy + barH / 2 + 4, it.t.length > 27 ? it.t.slice(0, 26) + '…' : it.t, 'md ink');
          b += S.rect(pl, yy, Math.max(2, xs(it.v) - pl), barH, i === 0 ? 'f-acc' : 'f-acc-t s-acc w1', 3);
          b += S.text(Math.max(pl + 2, xs(it.v)) + 6, yy + barH / 2 + 4, kfmt(it.v), 'sm mono b ' + (i === 0 ? 'acc' : 'ink'));
        });
      }
      fig.innerHTML = S.wrap(W, H, `Standard deduction ${usd(m.std)} versus itemized ${usd(m.itemized)}, and the tax breaks that save you the most`, b);
      setT(id + '-r', Math.round(m.r * 100) + '%');
      setT(id + '-best', (m.useItem ? 'Itemize ' : 'Standard ') + kfmt(Math.max(m.std, m.itemized)), 'up');
      setT(id + '-ti', usd(m.ti));
      setT(id + '-lev', m.ranked[0] ? m.ranked[0].t.replace(' contributions', '') : '—', 'acc');
      $id(id + '-cards').innerHTML = [m.items[0]].concat(m.ranked, m.items.slice(1).filter((x) => x.v == null)).map((it, i) => `<li class="wtx-card${it === m.ranked[0] ? ' top' : ''}"><div class="wtx-ch"><b>${it.t}</b><span class="pill ${it.v ? 'up' : 'info'}">${it.tag}</span></div><p>${it.p}</p></li>`).join('');
      const top = m.ranked[0];
      let msg;
      if (m.r === 0) msg = ui.msg('up', 'No income tax', 'Your deductions cover your income, so extra deductions save nothing this year. Refundable credits (child tax credit, part of the education credit) can still pay you, and a Roth account may suit you better than pre-tax saving.');
      else if (m.useItem) msg = ui.msg('up', 'Itemize', `Itemizing beats the standard deduction by ${usd(m.itemized - m.std)}, worth about ${usd((m.itemized - m.std) * m.r)}. ${top ? `Your biggest remaining lever: ${top.t.toLowerCase()} (${top.tag}).` : ''}`);
      else msg = ui.msg('acc', 'Standard wins', `The standard deduction beats itemizing by ${usd(m.std - m.itemized)}. ${top ? `Your biggest lever is ${top.t.toLowerCase()}: ${top.tag}.` : 'Tick what fits your life to see which breaks apply.'} Each $1,000 of deduction is worth about ${usd(1000 * m.r)} to you; each $1,000 of credit is worth $1,000.`);
      $id(id + '-msg').innerHTML = msg;
    });
  };

  /* =====================================================================
     3. assetLocation: same mix everywhere vs smart placement, after tax
     ===================================================================== */
  const AS = {
    bond: { name: 'Bonds', short: 'Bonds', r: 0.045, y: 0.045, kind: 'int', cls: 'f-acc', txt: 'acc', sw: 'var(--accent)' },
    reit: { name: 'REITs', short: 'REIT', r: 0.07, y: 0.04, kind: 'reit', cls: 'f-up', txt: 'up', sw: 'var(--up)' },
    us: { name: 'US stock index', short: 'US', r: 0.07, y: 0.015, kind: 'q', cls: 'f-info', txt: 'info', sw: 'var(--info)' },
    intl: { name: 'International index', short: 'Intl', r: 0.07, y: 0.03, ft: 0.003, kind: 'q', cls: 'f-vio', txt: 'vio', sw: 'var(--violet)' },
  };
  const PRIORITY = ['bond', 'reit', 'us', 'intl'];   // first claim on tax-sheltered space
  const ACC = [['tax', 'Taxable'], ['trad', 'Traditional'], ['roth', 'Roth']];
  function placeSame(bal, mix) {
    const out = { tax: {}, trad: {}, roth: {} };
    Object.keys(out).forEach((a) => PRIORITY.forEach((k) => { out[a][k] = bal[a] * mix[k]; }));
    return out;
  }
  function placeSmart(bal, mix) {
    const T = bal.tax + bal.trad + bal.roth; const out = { tax: {}, trad: {}, roth: {} };
    PRIORITY.forEach((k) => { out.tax[k] = 0; out.trad[k] = 0; out.roth[k] = 0; });
    let cap = bal.trad + bal.roth; const shel = {};
    PRIORITY.forEach((k) => { const amt = T * mix[k]; const s = Math.min(cap, amt); shel[k] = s; cap -= s; out.tax[k] = amt - s; });
    // lowest expected return goes to Traditional first; the Roth keeps the growth
    let tcap = bal.trad;
    PRIORITY.slice().sort((a, b) => AS[a].r - AS[b].r || PRIORITY.indexOf(a) - PRIORITY.indexOf(b)).forEach((k) => { const s = Math.min(tcap, shel[k]); out.trad[k] = s; tcap -= s; out.roth[k] = shel[k] - s; });
    return out;
  }
  /* yearly after-tax value of a placement if liquidated that year */
  function simulate(pl, P) {
    const rows = []; const hold = [];
    ACC.forEach(([a]) => PRIORITY.forEach((k) => { const v = pl[a][k]; if (v > 0.5) hold.push({ a, k, v, basis: v }); }));
    let taxPaid = 0;
    const afterTax = () => hold.reduce((s, h) => s + (h.a === 'roth' ? h.v : h.a === 'trad' ? h.v * (1 - P.ret) : h.v - (P.sell ? Math.max(0, h.v - h.basis) * P.q : 0)), 0);
    rows.push(afterTax());
    for (let yr = 1; yr <= P.N; yr++) {
      hold.forEach((h) => {
        const A = AS[h.k], ft = A.ft || 0;
        if (h.a !== 'tax') { h.v *= 1 + A.r - ft; return; }
        const inc = h.v * A.y, price = h.v * (A.r - A.y);
        let us = A.kind === 'int' ? inc * P.ord : A.kind === 'reit' ? inc * P.ord * 0.8 : inc * P.q;
        const foreign = h.v * ft, credit = Math.min(foreign, us); us -= credit;
        const reinvest = inc - foreign - us; taxPaid += us;
        h.v += price + reinvest; h.basis += reinvest;
      });
      rows.push(afterTax());
    }
    return { rows, taxPaid };
  }
  SML.widgets.assetLocation = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('al');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-view', [{ v: 'smart', label: 'Smart location' }, { v: 'same', label: 'Same mix everywhere' }], 'smart', 'Which plan to show on the map')}<span class="grow"></span>${ui.chips(id + '-sell', [{ k: 'sell', label: 'Sell at the end', color: 'var(--accent)', on: true }])}</div>
      <div class="wtx-legend" aria-hidden="true">${PRIORITY.map((k) => `<span><i style="--c:${AS[k].sw}"></i>${AS[k].name}</span>`).join('')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-tax', label: 'Taxable brokerage', min: 0, max: 1000000, step: 10000, value: opts.tax != null ? opts.tax : 200000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-trad', label: 'Traditional 401(k) / IRA', min: 0, max: 1000000, step: 10000, value: opts.trad != null ? opts.trad : 200000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-roth', label: 'Roth IRA / Roth 401(k)', min: 0, max: 1000000, step: 10000, value: opts.roth != null ? opts.roth : 100000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-bond', label: 'Bonds in your mix', min: 0, max: 60, step: 5, value: 30, fmt: 'pct' })}
        ${ui.slider({ id: id + '-intl', label: 'International stocks', min: 0, max: 40, step: 5, value: 20, fmt: 'pct' })}
        ${ui.slider({ id: id + '-reit', label: 'REITs', min: 0, max: 15, step: 5, value: 5, fmt: 'pct' })}
        ${ui.slider({ id: id + '-ord', label: 'Your tax bracket now', min: 12, max: 37, step: 1, value: 24, fmt: 'pct' })}
        ${ui.slider({ id: id + '-ret', label: 'Bracket on withdrawals', min: 10, max: 37, step: 1, value: 22, fmt: 'pct' })}
        ${ui.slider({ id: id + '-n', label: 'Years', min: 5, max: 40, step: 1, value: 30, fmt: 'yrs' })}
      </div>
      <div class="wg-read">${ui.stat('After tax: same mix', id + '-a')}${ui.stat('After tax: smart', id + '-b')}${ui.stat('You keep extra', id + '-d', 'hl big')}${ui.stat('Per year', id + '-py')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Simple model with steady returns: stocks and REITs 7% a year, bonds 4.5%. Dividend yields: US 1.5% (qualified), international 3% with 0.3% foreign tax (credited only in taxable), REITs 4% (ordinary rates with the 20% REIT deduction), bonds all interest. Qualified dividends and gains taxed at 0% in the 10-12% brackets, 15% above, 20% at 37%. Traditional money is valued after paying your withdrawal bracket; Roth money is yours tax-free. US stocks fill whatever the mix leaves.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    function model() {
      const bal = { tax: st.n(id + '-tax'), trad: st.n(id + '-trad'), roth: st.n(id + '-roth') };
      let bond = st.n(id + '-bond') / 100, intl = st.n(id + '-intl') / 100, reit = st.n(id + '-reit') / 100;
      const over = bond + intl + reit - 1; if (over > 0) { reit = Math.max(0, reit - over); }
      const mix = { bond, intl, reit, us: Math.max(0, 1 - bond - intl - reit) };
      const ord = st.n(id + '-ord') / 100, ret = st.n(id + '-ret') / 100;
      const q = ord <= 0.12 ? 0 : ord >= 0.37 ? 0.2 : 0.15;
      const P = { ord, ret, q, N: st.n(id + '-n'), sell: st.on(id + '-sell', 'sell') };
      const same = placeSame(bal, mix), smart = placeSmart(bal, mix);
      return { bal, mix, P, same, smart, A: simulate(same, P), B: simulate(smart, P), T: bal.tax + bal.trad + bal.roth };
    }
    const draw = ui.responsive(fig, (W) => {
      const m = model(), view = st.seg(id + '-view') || 'smart', plc = view === 'smart' ? m.smart : m.same;
      const wide = W >= 640;
      const mapW = wide ? Math.round(W * 0.38) : W, mapH = 190;
      const chW = wide ? W - mapW - 24 : W, chH = wide ? mapH + 40 : 210;
      const H = wide ? chH : mapH + 30 + chH;
      let b = '';
      // --- placement map: three columns ---
      const colGap = 14, cw = (mapW - 8 - colGap * 2) / 3, top = 44, base = mapH - 4;
      const maxBal = Math.max(m.bal.tax, m.bal.trad, m.bal.roth, 1);
      const hy = (v) => (v / maxBal) * (base - top);
      b += S.text(4, 14, (view === 'smart' ? 'SMART LOCATION' : 'SAME MIX EVERYWHERE'), 'cap');
      ACC.forEach(([a, name], i) => {
        const x0 = 4 + i * (cw + colGap); let yy = base;
        b += S.text(x0 + cw / 2, top - 6, name, 'sm b ink', 'middle');
        b += S.line(x0, base + 0.5, x0 + cw, base + 0.5, 's-mut');
        PRIORITY.forEach((k) => {
          const v = plc[a][k] || 0; if (v < 1) return; const h = hy(v); yy -= h;
          b += S.rect(x0, yy, cw, h, AS[k].cls + ' s-surf w1', 2);
          if (h > 16 && cw > 40) b += S.text(x0 + cw / 2, yy + h / 2 + 4, cw > 70 ? AS[k].short + ' ' + kfmt(v) : AS[k].short, 'xs b onacc', 'middle');
        });
        if (m.bal[a] <= 0) b += S.text(x0 + cw / 2, base - 8, 'empty', 'xs mut', 'middle');
      });
      // --- after-tax value over time ---
      const ox = wide ? mapW + 24 : 0, oy = wide ? 0 : mapH + 30;
      const pl = ox + (W < 420 ? 40 : 46), pr = 12, pt = oy + 26, pb = 26, bot = oy + chH - pb;
      const N = m.P.N, diff = m.B.rows.map((v, i) => v - m.A.rows[i]);
      const dmax = Math.max(...diff, 1) * 1.18, dmin = Math.min(0, ...diff) * 1.18;
      const x = SML.lin(0, N, pl, ox + chW - pr), y = SML.lin(dmin, dmax, bot, pt);
      b += S.text(ox + 4, oy + 14, 'EXTRA YOU KEEP WITH SMART LOCATION', 'cap');
      SML.ticks(dmin, dmax, 4).forEach((v) => { if (y(v) < pt - 2 || y(v) > bot + 1) return; b += S.line(pl, y(v), ox + chW - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      SML.ticks(0, N, W < 420 ? 3 : 5).filter(Number.isInteger).forEach((v) => { b += S.text(x(v), bot + 16, v === 0 ? 'now' : v + 'y', 'xs mono', 'middle'); });
      const pd = diff.map((v, i) => [x(i), y(v)]), neg = diff[N] < 0;
      b += S.area(pd, y(0), neg ? 'f-dn-t' : 'f-up-t') + S.line(pl, y(0), ox + chW - pr, y(0), 's-mut') + S.poly(pd, (neg ? 's-dn' : 's-up') + ' w25');
      b += S.circle(x(N), y(diff[N]), 5, neg ? 'f-dn' : 'f-up');
      b += S.text(x(N) - 10, Math.max(pt + 12, y(diff[N]) - 10), (diff[N] >= 0 ? '+' : '') + kfmt(diff[N]) + ' after tax', 'md b ' + (neg ? 'dn' : 'up'), 'end');
      const fa = m.A.rows[N], fb = m.B.rows[N];
      fig.innerHTML = S.wrap(W, H, `Asset location: smart placement ends at ${usd(fb)} after tax versus ${usd(fa)} with the same mix in every account, ${usd(fb - fa)} more`, b);
      const d = fb - fa, py = fa > 0 && N > 0 ? Math.pow(fb / fa, 1 / N) - 1 : 0;
      setT(id + '-a', usd(fa)); setT(id + '-b', usd(fb), 'up'); setT(id + '-d', (d >= 0 ? '+' : '') + usd(d)); setT(id + '-py', F.spct(py * 100, 2), d >= 0 ? 'up' : 'dn');
      if (m.T <= 0) setMsg(id + '-msg', 'acc', 'Empty', 'Add money to at least one account to compare.');
      else if (m.bal.tax === 0 || (m.bal.trad + m.bal.roth === 0)) setMsg(id + '-msg', 'info', 'Little to move', `With ${m.bal.tax === 0 ? 'no taxable account' : 'no tax-sheltered account'}, there is little to relocate. ${m.bal.tax === 0 ? 'The only lever left is Traditional versus Roth: growth in the Roth is never taxed.' : 'Every holding pays tax the same way, so focus on low-turnover index funds and the 0% bracket.'}`);
      else {
        const bondsTaxSame = m.same.tax.bond, bondsTaxSmart = m.smart.tax.bond;
        let s = `Same risk, same total mix, different addresses: smart location leaves you ${usd(d)} more after ${N} years, about ${F.pct(py * 100, 2)} a year. `;
        s += bondsTaxSmart < 1 ? `All your bonds sit in tax-sheltered accounts, so their interest isn't taxed every year${bondsTaxSame > 1 ? ` (with the same mix, ${usd(bondsTaxSame)} of bonds would sit in taxable)` : ''}.` : `Your bonds outgrow the sheltered space, so ${usd(bondsTaxSmart)} still sit in taxable; consider municipal or Treasury bonds there.`;
        setMsg(id + '-msg', py >= 0.001 ? 'up' : 'acc', py >= 0.001 ? 'Worth doing' : 'Small win', s);
      }
    });
  };

  /* ===================== lessons ===================== */
  const SRC = {
    sch: { t: 'IRS: Instructions for Schedule A (itemized deductions, SALT cap, mortgage interest)', u: 'https://www.irs.gov/instructions/i1040sca' },
    infl: { t: 'IRS: Tax inflation adjustments for tax year 2026 (IR-2025-103)', u: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill' },
    rp: { t: 'IRS Rev. Proc. 2025-32: 2026 brackets, capital gains thresholds, child tax credit', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    wf: { t: 'IRS: Working Families Tax Cuts for individuals (tips, overtime, car loan interest, senior deduction)', u: 'https://www.irs.gov/newsroom/working-families-tax-cuts-individuals-and-workers' },
    obbb: { t: 'IRS: One, Big, Beautiful Bill provisions (charity, dependent care, Trump accounts)', u: 'https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions' },
    lim: { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit to $7,500 (IR-2025-111)', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
    hsa: { t: 'IRS Rev. Proc. 2025-19: 2026 HSA limits', u: 'https://www.irs.gov/pub/irs-drop/rp-25-19.pdf' },
    bh: { t: 'Bogleheads wiki: Tax-efficient fund placement', u: 'https://www.bogleheads.org/wiki/Tax-efficient_fund_placement' },
    niit: { t: 'IRS: Net investment income tax', u: 'https://www.irs.gov/individuals/net-investment-income-tax' },
  };

  SML.lessons.push({
    id: 'l-tax-brackets', course: 'wtax', order: 1, title: 'How tax brackets really work', mins: 7, level: 'Beginner',
    summary: 'Marginal vs effective rate, the 2026 brackets and why a raise never lowers your pay.',
    idea: 'Income is taxed in slices. Each slice pays only its own rate, so your overall rate sits far below your top bracket.',
    widget: 'bracketViz',
    try: 'Pick an example household or drag your income. Watch the slices fill, then add pre-tax savings and see which dollars they pull out.',
    body: [
      '<h3>Income fills buckets, one after another</h3><p>Picture a row of buckets. The first bucket is tax-free: it is your standard deduction ($16,100 single, $32,200 married filing jointly, $24,150 head of household in 2026). Once it is full, the next dollars pour into the 10% bucket, then 12%, then 22%, and so on. Each bucket only charges its own rate on the dollars inside it.</p>',
      '<h3>The 2026 brackets</h3><p>These apply to <b>taxable income</b>: income after pre-tax savings and deductions.</p><ul><li><b>Single:</b> 10% to $12,400 · 12% to $50,400 · 22% to $105,700 · 24% to $201,775 · 32% to $256,225 · 35% to $640,600 · 37% above.</li><li><b>Married filing jointly:</b> 10% to $24,800 · 12% to $100,800 · 22% to $211,400 · 24% to $403,550 · 32% to $512,450 · 35% to $768,700 · 37% above.</li><li><b>Head of household:</b> 10% to $17,700 · 12% to $67,450 · 22% to $105,700 · 24% to $201,750 · 32% to $256,200 · 35% to $640,600 · 37% above.</li></ul>',
      '<h3>Marginal rate vs effective rate</h3><p>Your <b>marginal rate</b> is the rate on your next dollar: the bucket you are filling now. Use it to judge decisions at the edge, such as a raise, a side job or a 401(k) contribution. Your <b>effective rate</b> is total tax divided by income: what you pay on average. Use it to understand your whole bill. A single person earning $85,000 is in the 22% bracket but pays about 10% overall.</p>',
      '<h3>Brackets alone never make a raise cost you money</h3><p>Moving into a higher bracket only taxes the new dollars at the higher rate; the dollars below stay where they were. So turning down a raise or overtime to "stay in a lower bracket" is a mistake as far as brackets go. The real traps are <b>phase-outs</b> and <b>benefit cliffs</b>. Some breaks shrink as income rises (the senior deduction and many credits), so a dollar there costs a bit more than your bracket says. A cliff is worse: for example, the ACA premium tax credit for marketplace health insurance ends at 400% of the federal poverty level in 2026, so one dollar over the line can cost thousands (see <a href="#l-aca">health insurance before 65</a>).</p>',
      '<h3>Pre-tax saving works at your top rate</h3><p>Money you put into a traditional 401(k) or HSA comes off the top of your income, out of your highest bucket. In the 22% bracket, every $1,000 you save pre-tax cuts this year’s federal tax by $220. That is why the same contribution is worth more to a high earner, and why someone in the 10% or 12% bracket may prefer a Roth (see <a href="#l-trad-vs-roth">Traditional or Roth?</a>).</p>',
      '<h3>What the brackets leave out</h3><ul><li><b>Payroll tax:</b> 6.2% Social Security (up to a yearly wage cap) plus 1.45% Medicare on every paycheck.</li><li><b>State and local income tax:</b> from 0% in states such as Texas and Florida to over 10% at the top in California.</li><li><b>Long-term capital gains and qualified dividends:</b> their own 0%, 15% and 20% rates. In 2026 the 0% rate covers taxable income up to $49,450 single or $98,900 joint (see <a href="#l-zero-bracket">the 0% bracket</a> and <a href="#l-cap-gains">capital gains</a>).</li><li><b>Credits:</b> subtracted from the tax itself, after the brackets (see <a href="#l-deductions">deductions and credits</a>).</li></ul>',
    ],
    example: {
      title: 'A single earner at $85,000 in 2026',
      intro: 'Federal income tax only, standard deduction, no credits.',
      steps: [
        'Salary $85,000. She puts $5,000 into her 401(k), so her adjusted gross income is $80,000.',
        'Subtract the $16,100 standard deduction: taxable income is $63,900.',
        'The first $12,400 is taxed at 10% ($1,240). The next $38,000, up to $50,400, at 12% ($4,560).',
        'The last $13,500, from $50,400 to $63,900, lands in the 22% bucket: $2,970.',
        'Total: $1,240 + $4,560 + $2,970 = $8,770. That is 10.3% of her $85,000 salary, though her top rate is 22%.',
        'Another $1,000 into the 401(k) would save $220. A $1,000 raise would add $220 of income tax and $76.50 of payroll tax, so she keeps $703.50.',
      ],
      result: 'Top rate 22%, effective rate 10.3%: about one dollar in ten goes to federal income tax.',
    },
    mistakes: [
      'Turning down a raise or overtime to "stay in a lower bracket". Only the extra dollars pay the higher rate.',
      'Using your top rate to estimate your whole tax bill. It overstates it; the effective rate is the average.',
      'Using your effective rate to judge a 401(k) contribution. Pre-tax money comes out of your top bracket, so it saves at your marginal rate.',
      'Forgetting payroll and state taxes when you budget a raise, or ignoring phase-outs that make some income cost more than your bracket.',
    ],
    points: [
      'Each bracket taxes only the dollars inside it.',
      'Marginal rate: the rate on your next dollar. Effective rate: your average.',
      'The standard deduction is a tax-free first bucket: $16,100 single or $32,200 joint in 2026.',
      'Pre-tax 401(k) and HSA money comes out of your top bracket.',
      'Tax brackets alone never make a raise cost you money. Benefit cliffs can, such as the ACA premium credit ending at 400% of the poverty level in 2026.',
    ],
    terms: ['Tax bracket', 'Marginal tax rate', 'Effective tax rate', 'Taxable income', 'Standard deduction', 'AGI'],
    glossary: [{ t: 'Payroll tax', full: 'FICA', d: 'Social Security (6.2%) and Medicare (1.45%) withheld from wages, separate from income tax.' }, { t: 'Phase-out', d: 'An income range over which a deduction or credit shrinks, so extra income there costs more than your bracket.' }],
    quiz: { q: 'A single filer has $60,000 of taxable income in 2026. Which dollars are taxed at 22%?', options: ['All $60,000', 'Only the $9,600 above $50,400', 'None, because the effective rate is lower'], answer: 1, why: 'Only income above the $50,400 line falls into the 22% bracket; the dollars below pay 10% and 12%.' },
    sources: [SRC.infl, SRC.rp, SRC.wf],
  });

  SML.lessons.push({
    id: 'l-deductions', course: 'wtax', order: 2, title: 'Deductions and credits worth knowing', mins: 10, level: 'Beginner',
    summary: 'Standard vs itemized, the new 2025-2028 deductions and the credits that cut tax dollar for dollar.',
    idea: 'A deduction shrinks the income you are taxed on. A credit shrinks the tax itself. Know which ones fit your life, and claim every one.',
    widget: 'deductionFinder',
    try: 'Tick what fits your life and set your amounts. The chart shows whether to itemize and which tax breaks are worth the most to you.',
    body: [
      '<h3>Deduction or credit?</h3><p>A <b>deduction</b> lowers taxable income, so it saves your marginal rate: a $1,000 deduction in the 22% bracket saves $220. A <b>credit</b> comes off the tax bill itself: a $1,000 credit saves $1,000. Some credits are <b>refundable</b>, so you get the money even if you owe no tax.</p>',
      '<h3>The deductions you control: pre-tax accounts</h3><ul><li><b>401(k), 403(b), TSP:</b> up to $24,500 in 2026, plus $8,000 at age 50+ ($11,250 at ages 60 to 63). See <a href="#l-401k-limits">the limits most people miss</a>.</li><li><b>HSA:</b> $4,400 self-only or $8,750 family coverage, plus $1,000 at 55+. Through payroll it also skips the 7.65% payroll tax. See <a href="#l-hsa">the HSA</a>.</li><li><b>Traditional IRA:</b> up to $7,500 ($8,600 at 50+). If you have a workplace plan, the deduction phases out between $81,000 and $91,000 of income single, or $129,000 to $149,000 joint.</li></ul>',
      '<h3>Standard deduction or itemize?</h3><p>You take whichever is bigger. In 2026 the standard deduction is $16,100 single, $32,200 joint and $24,150 head of household, plus $2,050 for a single filer 65+ or $1,650 per married spouse 65+. Itemized deductions are mainly:</p><ul><li><b>State and local taxes (SALT):</b> capped at $40,400 in 2026. The cap shrinks by 30% of income above $505,000, never below $10,000.</li><li><b>Mortgage interest</b> on up to $750,000 of home debt. From 2026, mortgage insurance premiums count again for itemizers, phasing out above $100,000 of AGI.</li><li><b>Charity</b> above 0.5% of your AGI. In the top bracket, itemized deductions are worth 35 cents per dollar.</li><li><b>Medical costs</b> above 7.5% of your AGI.</li></ul><p>Most people take the standard deduction. If you are close, <b>bunch</b>: give two years of donations in one year, itemize that year and take the standard the next.</p>',
      '<h3>Deductions you get without itemizing</h3><p>New for 2025 to 2028:</p><ul><li><b>Seniors:</b> an extra $6,000 per person 65+, shrinking by 6% of income above $75,000 ($150,000 joint).</li><li><b>Tips:</b> up to $25,000 of qualified tips in jobs that customarily receive them. The cap shrinks by $100 per $1,000 of income above $150,000 ($300,000 joint).</li><li><b>Overtime:</b> the extra "half" of time-and-a-half pay, up to $12,500 ($25,000 joint), same phase-out.</li><li><b>Car loan interest:</b> up to $10,000 a year on a loan taken after 2024 for a new car with final assembly in the US, for personal use. The cap shrinks by $200 per $1,000 of income above $100,000 ($200,000 joint). Put the VIN on your return. See <a href="#l-car-cash">cash or loan</a>.</li></ul><p>Married couples must file jointly to claim the senior, tips and overtime deductions, and each needs a Social Security number.</p><p>From 2026 on, and permanent:</p><ul><li><b>Charity:</b> up to $1,000 of cash gifts ($2,000 joint) with the standard deduction. Gifts to donor-advised funds don’t count.</li></ul>',
      '<h3>Credits: worth more per dollar</h3><ul><li><b>Child tax credit:</b> $2,200 per child under 17 in 2026, up to $1,700 refundable. It shrinks by $50 per $1,000 of income above $200,000 ($400,000 joint). The child needs a Social Security number, and so does at least one parent on a joint return.</li><li><b>Child and dependent care credit:</b> 20% to 50% of up to $3,000 of care for one child or $6,000 for two or more; the top rate rose to 50% in 2026 and falls as income rises. A dependent care FSA at work is the alternative.</li><li><b>Education:</b> the American opportunity credit pays up to $2,500 per student for the first four years of college; the lifetime learning credit up to $2,000 per return. Both phase out between $80,000 and $90,000 ($160,000 to $180,000 joint).</li><li><b>Saver’s credit:</b> 10% to 50% of up to $2,000 you save for retirement, if your 2026 income is at or under $40,250 single, $60,375 head of household or $80,500 joint.</li><li><b>Earned income credit:</b> up to $8,231 in 2026 for working families with three or more children, less for smaller families.</li></ul>',
      '<h3>Side business and kids</h3><p>With self-employment income you can deduct business costs, half of self-employment tax and health insurance premiums, take the qualified business income deduction (up to 20% of profit, with limits at higher incomes) and save far more in a solo 401(k) or SEP-IRA. A 529 plan has no federal deduction, but many states give one, and the new Trump accounts give US-citizen children born from 2025 through 2028 a one-time $1,000 federal deposit (see <a href="#l-kids-money">kids’ money</a>). Once your return has a business, rentals or stock options, a CPA or enrolled agent is usually worth the fee.</p>',
      '<h3>Active traders</h3><ul><li><b>Trader tax status</b> lets you deduct trading expenses (data, software, a home office) as a business. The IRS tests are strict: your trading must be substantial, regular and continuous, aimed at short-term price swings rather than dividends or long-term growth. Most people who trade on the side do not qualify.</li><li><b>The section 475(f) mark-to-market election</b>, open only to those who qualify as traders, treats every position as sold at year end. Wash-sale rules and the $3,000 yearly cap on net capital losses no longer apply, but all trading gains become ordinary income with no long-term rate. You must elect by the original due date of the <i>previous</i> year’s return, so it cannot be added after a bad year. See <a href="#l-wash-sale">wash sales</a>.</li><li><b>Margin interest</b> can be deducted as investment interest on Form 4952, only if you itemize and only up to your net investment income; the rest carries forward. See <a href="#l-smart-leverage">smart leverage</a>.</li></ul><p>These are easy to get wrong; talk to a CPA who works with traders before claiming trader status or making the election.</p>',
    ],
    example: {
      title: 'A family decides whether to itemize',
      intro: 'Married filing jointly in 2026, two salaries totalling $180,000, one child aged 6.',
      steps: [
        'They put $20,000 into their 401(k)s, so AGI is $160,000. At 22%, that alone saves $4,400 of tax.',
        'Itemized: $14,000 of state and local taxes (under the $40,400 cap) + $9,500 of mortgage interest + charity of $3,000 minus 0.5% of AGI ($800) = $25,700.',
        'The $32,200 standard deduction beats $25,700 by $6,500, so they take the standard deduction.',
        'Without itemizing they can still deduct $2,000 of their cash gifts. Taxable income: $160,000 − $32,200 − $2,000 = $125,800.',
        'Tax: 10% of $24,800 ($2,480) + 12% of $76,000 ($9,120) + 22% of $25,000 ($5,500) = $17,100.',
        'The $2,200 child tax credit comes straight off the bill: $14,900.',
      ],
      result: 'Federal income tax of $14,900 on $180,000 of pay, about 8.3%.',
    },
    mistakes: [
      'Itemizing out of habit. With today’s higher standard deduction most households are better off with the standard.',
      'Missing the new 2025-2028 deductions (senior, tips, overtime, car loan interest) or the 2026 charity deduction because you don’t itemize. They don’t require itemizing.',
      'Treating a deduction like a credit. A $1,000 deduction at 22% saves $220, not $1,000.',
      'Giving through a donor-advised fund and expecting the non-itemizer charity deduction, or paying for child care with both FSA dollars and the credit.',
    ],
    points: [
      'Credits beat deductions dollar for dollar.',
      'Take the bigger of the standard deduction or your itemized total; bunch if you are close.',
      'Pre-tax 401(k), HSA and IRA money is the deduction you control most.',
      'The senior, tips, overtime and car-loan deductions run 2025 to 2028 and work without itemizing.',
      'Check every credit that fits: children, child care, school and the saver’s credit.',
    ],
    terms: ['Standard deduction', 'Itemized deductions', 'Tax credit', 'SALT cap', 'AGI', 'MAGI'],
    glossary: [{ t: 'Bunching', d: 'Grouping two or more years of deductible spending, such as charity, into one year so you can itemize that year and take the standard deduction the next.' }, { t: 'Refundable credit', d: 'A credit that is paid to you even if it is bigger than the tax you owe.' }],
    quiz: { q: 'Which saves more for someone in the 22% bracket?', options: ['A $1,000 deduction', 'A $1,000 credit', 'They save the same'], answer: 1, why: 'A credit cuts the tax bill by $1,000; a deduction cuts taxable income by $1,000, which saves $220 at 22%.' },
    sources: [SRC.wf, SRC.obbb, SRC.sch, SRC.lim],
  });

  SML.lessons.push({
    id: 'l-asset-location', course: 'wtax', order: 3, title: 'Asset location: the right account for each fund', mins: 8, level: 'Intermediate',
    summary: 'Hold tax-heavy funds in sheltered accounts and tax-light ones in taxable to keep more.',
    idea: 'Asset allocation decides what you own. Asset location decides which account holds each piece, and it can add return at no extra risk.',
    widget: 'assetLocation',
    try: 'Set your three account balances and your mix. Compare same mix everywhere with smart location, and switch the map between the two.',
    body: [
      '<h3>Three kinds of accounts</h3><ul><li><b>Taxable brokerage:</b> interest and dividends are taxed every year, and gains when you sell.</li><li><b>Tax-deferred</b> (traditional 401(k), traditional IRA): no tax along the way; every withdrawal is taxed as ordinary income.</li><li><b>Roth</b> (Roth IRA, Roth 401(k)): no tax along the way and none on qualified withdrawals.</li></ul><p>The same fund can cost very different amounts of tax depending on which account holds it.</p>',
      '<h3>How each investment is taxed in a taxable account</h3><ul><li><b>Bonds and bond funds:</b> interest is taxed at your ordinary rate every year, the worst treatment there is.</li><li><b>REITs:</b> most of their dividends are taxed at ordinary rates (with a 20% deduction), and they pay a lot of them.</li><li><b>Broad stock index funds:</b> low dividends, mostly qualified (0%, 15% or 20%), and very few gains passed out to you. Highly tax-efficient.</li><li><b>International index funds:</b> qualified dividends plus foreign taxes withheld, which you can claim back as a <b>foreign tax credit</b>, but only in a taxable account.</li><li><b>Municipal bonds:</b> interest is federal tax-free, so they belong in taxable if anywhere.</li></ul>',
      '<h3>The placement order</h3><ol><li><b>Tax-deferred accounts first get the least tax-efficient assets:</b> taxable bonds, REITs, high-yield funds.</li><li><b>The Roth gets your highest expected growth</b>, usually stocks: every dollar of growth there is tax-free forever, and Roth IRAs have no required withdrawals.</li><li><b>Taxable gets the tax-efficient assets:</b> total-market or S&amp;P 500 index funds, international index funds (to use the foreign tax credit) and municipal bonds if you need bonds there.</li></ol><p>Tax-loss harvesting only works in taxable accounts, another reason to hold broad stock funds there (see <a href="#l-tlh-pairs">fund pairs</a>).</p>',
      '<h3>Count after-tax dollars, not balances</h3><p>$100,000 in a traditional 401(k) is not $100,000 to spend: at a 22% withdrawal rate it is worth $78,000. $100,000 in a Roth is worth $100,000. If you put all your bonds in the traditional account, your true after-tax mix holds a little more stock than the statements suggest. Keep that in mind when you set your <a href="#l-allocation">allocation</a>.</p>',
      '<h3>When not to bother</h3><ul><li>Almost everything is in one type of account. There is nothing to move.</li><li>Location would push you into a worse or more expensive fund because your 401(k) menu is poor. Low fees come first.</li><li>You would need to sell taxable holdings at big gains to rearrange. Steer new contributions and dividends instead.</li></ul><p>Typical gains run a few tenths of a percent a year: free money that compounds, but never worth breaking your overall mix.</p>',
    ],
    example: {
      title: '$300,000 across three accounts',
      intro: '$100,000 each in taxable, a traditional 401(k) and a Roth IRA. Target: 30% bonds ($90,000), 70% stock index funds ($210,000). 24% bracket, 15% on qualified dividends.',
      steps: [
        'Same mix everywhere: each account holds $30,000 of bonds and $70,000 of stock funds.',
        'In taxable, the $30,000 of bonds paying 4.5% throws off $1,350 of interest, taxed at 24%: $324. The $70,000 of stocks yields 1.5%, $1,050 taxed at 15%: $157.50. Year-one tax: $481.50.',
        'Smart location: all $90,000 of bonds plus $10,000 of stocks go in the traditional 401(k). The Roth holds $100,000 of stocks. Taxable holds $100,000 of a total-market stock index fund.',
        'Taxable now yields $1,500 of qualified dividends, taxed at 15%: $225 a year.',
        'Year-one tax drops by $256.50 with the same 30/70 mix and the same risk. The difference stays invested and compounds every year.',
      ],
      result: 'Same investments, different addresses: $256.50 less tax in year one, and the gap widens every year.',
    },
    mistakes: [
      'Holding bonds or REITs in a taxable account while stock funds sit in the 401(k).',
      'Comparing balances without adjusting for tax: pre-tax money is worth less to spend than Roth or taxable money.',
      'Letting location drive a worse overall mix, or picking a high-fee fund just because it fits an account.',
      'Selling taxable holdings at large gains to rearrange, when new contributions could do it for free.',
    ],
    points: [
      'Allocation first, location second.',
      'Fill tax-deferred space with tax-inefficient assets such as bonds and REITs.',
      'Give the Roth your highest expected growth.',
      'Keep broad stock index funds and international funds in taxable.',
      'The gain is often a few tenths of a percent a year: worth it, but never worth bad funds or fees.',
    ],
    terms: ['Asset location', 'Tax drag', 'Qualified dividend', 'Taxable brokerage account', 'Roth IRA', 'Foreign tax credit'],
    glossary: [{ t: 'REIT', full: 'Real estate investment trust', d: 'A company that owns property and must pay out most of its income as dividends, which are mostly taxed at ordinary rates.' }, { t: 'Municipal bond', d: 'A bond issued by a state or city. Its interest is usually free of federal income tax.' }],
    quiz: { q: 'Which holding usually belongs in a traditional 401(k) rather than a taxable account?', options: ['A total US stock index fund', 'A taxable bond fund', 'An international stock index fund'], answer: 1, why: 'Bond interest is taxed at ordinary rates every year in a taxable account; a tax-deferred account shelters it.' },
    sources: [SRC.bh, SRC.rp, SRC.niit],
  });
})();
