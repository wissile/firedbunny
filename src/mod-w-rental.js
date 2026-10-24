/* Retirement & Wealth track: rental property, Airbnb and smart leverage. Widgets: rentalCalc, strCalc, leverageLab. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const M = F.minus;

  /* ---------------- shared helpers ---------------- */
  const usd0 = (v) => F.usd(Math.round(v), 0);
  const kusd = (v) => { const a = Math.abs(v), s = v < 0 ? M : ''; if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M'; if (a >= 1e4) return s + '$' + Math.round(a / 1000) + 'k'; return s + '$' + F.num(Math.round(a)); };
  const sgn = (v) => (v > 0.5 ? '+' : v < -0.5 ? M : '') + '$' + F.num(Math.round(Math.abs(v)));
  const sgnK = (v) => (v > 0.5 ? '+' : '') + kusd(v);
  const pct = (v, d) => F.pct(v, d == null ? 1 : d);
  const spct0 = (v) => { const r = Math.round(v); return r === 0 ? '0%' : F.spct(r, 0); };
  function pmt(P, ratePct, years) { const r = ratePct / 1200, n = years * 12; if (P <= 0) return 0; if (r === 0) return P / n; return (P * r) / (1 - Math.pow(1 + r, -n)); }
  function balAfter(P, ratePct, years, k) { const r = ratePct / 1200, p = pmt(P, ratePct, years); if (P <= 0) return 0; if (k >= years * 12) return 0; if (r === 0) return Math.max(0, P - p * k); return Math.max(0, P * Math.pow(1 + r, k) - (p * (Math.pow(1 + r, k) - 1)) / r); }
  function interestYear(P, ratePct, years, yi) { const b0 = balAfter(P, ratePct, years, yi * 12), b1 = balAfter(P, ratePct, years, (yi + 1) * 12); return Math.max(0, pmt(P, ratePct, years) * 12 - (b0 - b1)); }
  const val = (st, id, d, lo, hi) => { let v = st.n(id); if (!isFinite(v)) v = d; return SML.clamp(v, lo, hi); };
  const stat = (label, value, cls, hl) => `<div class="stat${hl ? ' hl' : ''}"><span class="stat-l">${label}</span><span class="stat-v${cls ? ' ' + cls : ''}">${value}</span></div>`;
  const capAt = (wf, W, txt) => (W < 520 ? S.text(0, 14, txt, 'cap') : S.text(wf.LW, 14, txt, 'cap', 'end'));
  const bracketSeg = (id, v) => ui.seg(id, [10, 12, 22, 24, 32, 35, 37].map((x) => ({ v: x, label: x + '%' })), v, 'Your federal tax bracket');

  /* Horizontal waterfall. rows: {k:'start'|'add'|'sub'|'pass'|'tax'|'sub2'|'end', label, short, v}
     sub/pass/tax subtract v (tax may be negative = saving). sub2/end draw the running total. */
  function waterfall(W, rows, top) {
    const compact = W < 520;
    const LW = compact ? 96 : 160, VW = compact ? 58 : 86, rh = compact ? 25 : 27;
    top = top || 6;
    const x0 = LW + 10, x1 = W - VW - 8;
    let run = 0; const segs = [];
    rows.forEach((r) => {
      if (r.k === 'start') { segs.push({ r, a: 0, b: r.v }); run = r.v; }
      else if (r.k === 'add') { segs.push({ r, a: run, b: run + r.v }); run += r.v; }
      else if (r.k === 'sub' || r.k === 'pass' || r.k === 'tax') { segs.push({ r, a: run, b: run - r.v }); run -= r.v; }
      else segs.push({ r, a: 0, b: run, total: true });
    });
    let lo = 0, hi = 0; segs.forEach((s) => { lo = Math.min(lo, s.a, s.b); hi = Math.max(hi, s.a, s.b); });
    if (hi - lo < 1) hi = lo + 1;
    const x = SML.lin(lo, hi, x0, x1);
    let b = '';
    const yEnd = top + rows.length * rh;
    b += S.line(x(0), top, x(0), yEnd, 's-mut');
    segs.forEach((s, i) => {
      const r = s.r, y = top + i * rh, bh = rh - 9, yc = y + rh / 2;
      const a = Math.min(s.a, s.b), c = Math.max(s.a, s.b);
      let cls;
      if (r.k === 'start' || r.k === 'add') cls = 'f-up';
      else if (r.k === 'pass') cls = 'f-shade2';
      else if (r.k === 'sub') cls = 'f-dn o70';
      else if (r.k === 'tax') cls = r.v >= 0 ? 'f-vio o70' : 'f-up o70';
      else if (r.k === 'sub2') cls = s.b >= 0 ? 'f-acc' : 'f-dn';
      else cls = s.b >= 0 ? 'f-up' : 'f-dn';
      if (s.total && i) b += S.line(x0 - 4, y + 1, W - 2, y + 1, 's-line');
      b += S.rect(x(a), y + 4.5, Math.max(1.5, x(c) - x(a)), bh, cls, 2);
      if (i < segs.length - 1 && !segs[i + 1].total) b += S.line(x(s.b), y + 4.5 + bh, x(s.b), y + rh + 4.5, 's-mut dash2');
      const lab = compact && r.short ? r.short : r.label;
      b += S.text(LW, yc + 4, esc(lab), (compact ? 'sm' : 'md') + (s.total || r.k === 'start' ? ' ink b' : ''), 'end');
      const v = s.total ? s.b : r.k === 'start' || r.k === 'add' ? r.v : -r.v;
      const vcls = r.k === 'pass' ? 'mut' : s.total ? (s.b >= 0 ? 'up b' : 'dn b') : r.k === 'tax' && r.v < 0 ? 'up' : v < 0 ? 'dn' : 'ink';
      b += S.text(W - 2, yc + 4, compact ? (s.total || r.k === 'start' ? kusd(v) : sgnK(v)) : (s.total || r.k === 'start' ? usd0(v) : sgn(v)), (compact ? 'sm' : 'md') + ' mono ' + vcls, 'end');
    });
    return { body: b, H: yEnd + 4, x, x0, x1, LW };
  }

  SML.css(`
    .wrn-grp[hidden]{display:none}
    .wrn-sub{font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.18em;color:var(--accent);grid-column:1/-1;margin-bottom:-6px}
    .wrn-fields{display:grid;gap:14px 20px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));grid-column:1/-1}
    .wrn-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;grid-column:1/-1}
    .wrn-row .ctl-lab{flex:0 0 auto}
    .wrn-tbl{width:100%;border-collapse:collapse;font-size:13.5px}
    .wrn-tbl th,.wrn-tbl td{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;line-height:1.4}
    .wrn-tbl thead th{font:500 10px/1.2 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);background:var(--shade)}
    .wrn-tbl td.n{font-family:var(--mono);text-align:right;white-space:nowrap}
    .wrn-scroll{overflow-x:auto}
    .wrn-more{grid-column:1/-1;border:1px solid var(--line);border-radius:var(--r);background:color-mix(in srgb,var(--bg) 60%,transparent)}
    .wrn-more summary{cursor:pointer;padding:12px 14px;font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--ink);list-style:none;display:flex;justify-content:space-between;gap:10px}
    .wrn-more summary::-webkit-details-marker{display:none}
    .wrn-more summary::after{content:'+';color:var(--accent);font-size:15px;line-height:1}
    .wrn-more[open] summary::after{content:'−'}
    .wrn-more summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .wrn-in{display:grid;gap:16px 24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));padding:4px 14px 16px}
    svg .wrn-halo{paint-order:stroke;stroke:var(--paper);stroke-width:3px;stroke-linejoin:round}
  `);

  /* ======================================================================
     rentalCalc: long-term rental numbers, taxes and sale
     ====================================================================== */
  const RENT_PRESETS = {
    duplex: { price: 260000, rent: 2600, ptax: 1.1, ins: 1600, hoa: 0, land: 20, label: 'Duplex' },
    house: { price: 350000, rent: 2450, ptax: 1.7, ins: 2800, hoa: 0, land: 20, label: 'House' },
    condo: { price: 650000, rent: 3300, ptax: 0.9, ins: 1200, hoa: 450, land: 35, label: 'Condo' },
  };
  SML.widgets.rentalCalc = function (root) {
    const id = SML.uid('rc');
    const d = RENT_PRESETS.duplex;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'm', label: 'Monthly' }, { v: 't', label: 'Taxes' }, { v: 's', label: 'Sale' }], 'm', 'View')}<span class="grow"></span>${ui.seg(id + '-p', Object.keys(RENT_PRESETS).map((k) => ({ v: k, label: RENT_PRESETS[k].label })), 'duplex', 'Example property')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        <div class="wrn-fields">${ui.field({ id: id + '-price', label: 'Purchase price ($)', value: d.price, min: 50000, max: 5000000, step: 1000 })}${ui.field({ id: id + '-rent', label: 'Monthly rent ($)', value: d.rent, min: 300, max: 30000, step: 25 })}</div>
        ${ui.slider({ id: id + '-down', label: 'Down payment', min: 10, max: 60, step: 1, value: 25, fmt: 'pct' })}
        ${ui.slider({ id: id + '-rate', label: 'Mortgage rate', min: 3, max: 10, step: 0.05, value: 7.75, fmt: (v) => v.toFixed(2) + '%' })}
        ${ui.slider({ id: id + '-vac', label: 'Vacancy', min: 0, max: 20, step: 1, value: 6, fmt: 'pct' })}
        ${ui.slider({ id: id + '-mgmt', label: 'Property manager', min: 0, max: 15, step: 1, value: 10, fmt: (v) => v + '% of rent' })}
        ${ui.slider({ id: id + '-rep', label: 'Repairs + big-ticket reserve', min: 0, max: 25, step: 1, value: 10, fmt: (v) => v + '% of rent' })}
        ${ui.slider({ id: id + '-ptax', label: 'Property tax', min: 0.3, max: 3, step: 0.05, value: d.ptax, fmt: (v) => v.toFixed(2) + '% a year' })}
        ${ui.slider({ id: id + '-ins', label: 'Landlord insurance', min: 400, max: 6000, step: 100, value: d.ins, fmt: (v) => usd0(v) + '/yr' })}
        ${ui.slider({ id: id + '-hoa', label: 'HOA dues', min: 0, max: 1000, step: 10, value: d.hoa, fmt: (v) => usd0(v) + '/mo' })}
      </div>
      <div class="wg-ctrl wrn-grp" id="${id}-gt" hidden>
        <p class="wrn-sub">Your tax picture</p>
        ${ui.slider({ id: id + '-magi', label: 'Your income (MAGI)', min: 40000, max: 300000, step: 5000, value: 120000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-land', label: 'Land share of the price', min: 10, max: 50, step: 1, value: d.land, fmt: 'pct' })}
        <div class="wrn-row"><span class="ctl-lab">Tax bracket</span>${bracketSeg(id + '-br', 22)}</div>
      </div>
      <div class="wg-ctrl wrn-grp" id="${id}-gs" hidden>
        <p class="wrn-sub">The sale</p>
        ${ui.slider({ id: id + '-yrs', label: 'Years you hold it', min: 2, max: 30, step: 1, value: 10, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-app', label: 'Price growth a year', min: 0, max: 8, step: 0.5, value: 3, fmt: 'pct1' })}
        <div class="wrn-row"><span class="ctl-lab">Long-term gains rate</span>${ui.seg(id + '-lt', [0, 15, 20].map((x) => ({ v: x, label: x + '%' })), 15, 'Long-term capital gains rate')}</div>
        <div class="wrn-row"><span class="ctl-lab">Tax bracket</span>${bracketSeg(id + '-br2', 22)}</div>
        <div class="wrn-row">${ui.chips(id + '-x', [{ k: 'x1031', label: 'Swap with a 1031 exchange', color: 'var(--info)' }])}</div>
      </div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">The average 30-year rate on a home you live in was 7.40% on October 15, 2026 (Freddie Mac); loans on rentals usually cost more. Assumes a 30-year fixed loan, 3% buying costs, 6% selling costs, depreciation on the building only (straight line over 27.5 years, full first year for simplicity) and active participation. The tax view assumes the repair reserve is spent on deductible repairs this year; unspent reserves are not deductible, and big replacements are depreciated instead. Ignores rent growth, state tax and the 3.8% investment income tax. Example numbers, not advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest && e.target.closest('.seg');
      if (seg && seg.id === id + '-p') { const p = RENT_PRESETS[st.seg(id + '-p')]; st.set(id + '-price', p.price); st.set(id + '-rent', p.rent); st.set(id + '-ptax', p.ptax); st.set(id + '-ins', p.ins); st.set(id + '-hoa', p.hoa); st.set(id + '-land', p.land); }
      if (seg && seg.id === id + '-br') st.setSeg(id + '-br2', st.seg(id + '-br'));
      if (seg && seg.id === id + '-br2') st.setSeg(id + '-br', st.seg(id + '-br2'));
      draw();
    });
    function calc() {
      const price = val(st, id + '-price', d.price, 50000, 5000000), rent = val(st, id + '-rent', d.rent, 300, 30000);
      const down = st.n(id + '-down') / 100, rate = st.n(id + '-rate'), vac = st.n(id + '-vac') / 100, mgmt = st.n(id + '-mgmt') / 100, rep = st.n(id + '-rep') / 100;
      const ptax = st.n(id + '-ptax') / 100, ins = st.n(id + '-ins'), hoa = st.n(id + '-hoa');
      const loan = price * (1 - down), pi = pmt(loan, rate, 30), closing = price * 0.03, cash = price * down + closing;
      const vacL = rent * vac, collected = rent - vacL, mg = collected * mgmt, rp = rent * rep, tx = (price * ptax) / 12, inM = ins / 12;
      const noiM = rent - vacL - mg - rp - tx - inM - hoa, cfM = noiM - pi;
      const land = st.n(id + '-land') / 100, building = price * (1 - land), dep = building / 27.5;
      const int1 = interestYear(loan, rate, 30, 0), prin1 = pi * 12 - int1;
      const taxable = noiM * 12 - int1 - dep;
      const magi = st.n(id + '-magi'), br = Number(st.seg(id + '-br') || 22) / 100;
      const allow = magi <= 100000 ? 25000 : Math.max(0, 25000 - 0.5 * (magi - 100000));
      const loss = Math.max(0, -taxable), usable = Math.min(loss, allow), suspended = loss - usable;
      const taxEffect = taxable > 0 ? taxable * br : -usable * br;
      return { price, rent, down, rate, loan, pi, closing, cash, vacL, mg, rp, tx, inM, hoa, noiM, cfM, building, dep, int1, prin1, taxable, magi, br, allow, loss, usable, suspended, taxEffect, cap: (noiM * 12) / price, coc: (cfM * 12) / cash, onePct: rent / price };
    }
    const draw = ui.responsive(fig, (W) => {
      const v = st.seg(id + '-v') || 'm';
      root.querySelector('#' + id + '-gt').hidden = v !== 't';
      root.querySelector('#' + id + '-gs').hidden = v !== 's';
      const c = calc(); const read = root.querySelector('#' + id + '-read'), msg = root.querySelector('#' + id + '-msg');
      let wf, label, extra = '';
      if (v === 'm') {
        const rows = [{ k: 'start', label: 'Rent', v: c.rent }, { k: 'sub', label: 'Vacancy', v: c.vacL }, { k: 'sub', label: 'Property manager', short: 'Manager', v: c.mg }, { k: 'sub', label: 'Repairs + reserve', short: 'Repairs', v: c.rp }, { k: 'sub', label: 'Property tax', short: 'Prop. tax', v: c.tx }, { k: 'sub', label: 'Insurance', v: c.inM }];
        if (c.hoa > 0) rows.push({ k: 'sub', label: 'HOA dues', short: 'HOA', v: c.hoa });
        rows.push({ k: 'sub2', label: 'Net operating income', short: 'NOI', v: 0 }, { k: 'sub', label: 'Mortgage payment', short: 'Mortgage', v: c.pi }, { k: 'end', label: 'Cash flow a month', short: 'Cash flow', v: 0 });
        wf = waterfall(W, rows, 24); label = 'Monthly waterfall from rent to cash flow';
        extra = capAt(wf, W, 'EACH MONTH');
        read.innerHTML = stat('Cash flow a month', sgn(c.cfM), c.cfM >= 0 ? 'up' : 'dn', true) + stat('Cap rate', pct(c.cap * 100), '') + stat('Cash-on-cash', pct(c.coc * 100), c.coc >= 0 ? '' : 'dn') + stat('Cash you put in', kusd(c.cash), '');
        const one = `Rent is ${pct(c.onePct * 100, 2)} of the price${c.onePct >= 0.01 ? ', which passes the old 1% rule.' : ', under the old 1% rule of thumb.'}`;
        msg.innerHTML = c.cfM >= 0
          ? ui.msg('up', 'Cash positive', `After every cost and the mortgage, it pays you ${usd0(c.cfM)} a month (${usd0(c.cfM * 12)} a year) on ${usd0(c.cash)} of your cash. ${one}`)
          : ui.msg('dn', 'Costs you money', `It costs you ${usd0(-c.cfM)} a month to hold. You would be betting on rent growth and appreciation. ${one} Try a bigger down payment or a lower price.`);
      } else if (v === 't') {
        const rows = [{ k: 'start', label: 'Net operating income', short: 'NOI', v: c.noiM * 12 }, { k: 'sub', label: 'Mortgage interest', short: 'Interest', v: c.int1 }, { k: 'pass', label: 'Depreciation', short: 'Depreciation', v: c.dep }, { k: 'end', label: 'Taxable rental result', short: 'Taxable', v: 0 }];
        wf = waterfall(W, rows, 24); label = 'Yearly tax waterfall: income, interest and depreciation';
        extra = capAt(wf, W, 'FIRST YEAR');
        const cf = c.cfM * 12, y0 = wf.H + 14;
        extra += S.line(wf.x0 - 4, y0 - 6, W - 2, y0 - 6, 's-line');
        extra += S.text(wf.LW, y0 + 12, W < 520 ? 'Cash flow' : 'Cash flow (for comparison)', (W < 520 ? 'sm' : 'md') + ' ink b', 'end');
        const xc = wf.x, a = Math.min(0, cf), bb = Math.max(0, cf);
        extra += S.rect(xc(a), y0 + 1, Math.max(1.5, xc(bb) - xc(a)), 16, cf >= 0 ? 'f-info' : 'f-dn', 2) + S.text(W - 2, y0 + 13, W < 520 ? sgnK(cf) : sgn(cf), (W < 520 ? 'sm' : 'md') + ' mono b ' + (cf >= 0 ? 'info' : 'dn'), 'end');
        let H2 = y0 + 26;
        if (c.taxable < 0) {
          const gy = H2 + 18, gx0 = W < 520 ? 2 : wf.x0, gx1 = W < 520 ? W - 2 : wf.x1, gx = SML.lin(0, 25000, gx0, gx1);
          extra += S.text(gx0, gy - 4, W < 520 ? '$25k allowance used' : 'The $25,000 allowance: loss you can use against your pay this year', 'sm ink b');
          extra += S.rect(gx0, gy + 4, gx1 - gx0, 14, 'f-shade2', 3) + S.rect(gx0, gy + 4, Math.max(0, gx(c.allow) - gx0), 14, 'f-up-t', 3);
          extra += S.rect(gx0, gy + 4, Math.max(1.5, gx(Math.min(c.loss, 25000)) - gx0), 14, c.usable >= c.loss ? 'f-up' : 'f-acc', 3);
          extra += S.text(gx0, gy + 34, 'loss ' + kusd(c.loss), 'sm mono ' + (c.usable >= c.loss ? 'up' : 'acc')) + S.text(gx1, gy + 34, 'your limit ' + kusd(c.allow), 'sm mono mut', 'end');
          H2 = gy + 42;
        }
        wf.H = H2;
        read.innerHTML = stat('Taxable result', sgn(c.taxable), c.taxable >= 0 ? '' : 'up', true) + stat('Depreciation a year', usd0(c.dep), '') + stat(c.taxable >= 0 ? 'Tax on the profit' : 'Tax saved this year', usd0(Math.abs(c.taxEffect)), c.taxable >= 0 ? 'dn' : 'up') + stat('Loss carried forward', usd0(c.suspended), c.suspended > 0 ? 'acc' : '');
        if (c.taxable < 0) msg.innerHTML = ui.msg('up', 'Paper loss', `Cash flow is ${sgn(c.cfM * 12)} a year, yet on paper you lose ${usd0(c.loss)}, because depreciation of ${usd0(c.dep)} is a deduction you never pay in cash. ${c.allow <= 0 ? 'With MAGI of ' + usd0(c.magi) + ' the $25,000 allowance is gone, so the whole loss carries forward until you have passive income or sell.' : c.suspended > 0 ? 'Your allowance covers ' + usd0(c.usable) + '; ' + usd0(c.suspended) + ' carries forward.' : 'All of it can offset your pay this year, saving about ' + usd0(c.usable * c.br) + '.'}`);
        else msg.innerHTML = ui.msg('info', 'Taxable profit', `You owe tax on ${usd0(c.taxable)} of rental profit, about ${usd0(c.taxEffect)} at ${Math.round(c.br * 100)}%. Without depreciation the taxable profit would be ${usd0(c.taxable + c.dep)}. Principal paid (${usd0(c.prin1)}) is not deductible: it is your own equity.`);
      } else {
        const n = st.n(id + '-yrs'), a = st.n(id + '-app') / 100, ltr = Number(st.seg(id + '-lt') || 15) / 100, br = Number(st.seg(id + '-br2') || 22) / 100, ex = st.on(id + '-x', 'x1031');
        const sale = c.price * Math.pow(1 + a, n), sell = sale * 0.06, bal = balAfter(c.loan, c.rate, 30, n * 12);
        const accDep = Math.min(c.building, c.dep * n), basis = c.price + c.closing - accDep, gain = sale - sell - basis;
        const recap = Math.max(0, Math.min(accDep, gain)), recapTax = recap * Math.min(br, 0.25), cg = Math.max(0, gain - recap), cgTax = cg * ltr;
        const taxNow = ex ? 0 : recapTax + cgTax;
        const rows = [{ k: 'start', label: 'Sale price', v: sale }, { k: 'sub', label: 'Selling costs (6%)', short: 'Selling', v: sell }, { k: 'sub', label: 'Pay off the loan', short: 'Loan', v: bal }, { k: ex ? 'pass' : 'tax', label: ex ? 'Recapture (deferred)' : 'Depreciation recapture', short: ex ? 'Recapture*' : 'Recapture', v: ex ? 0 : recapTax }, { k: ex ? 'pass' : 'tax', label: ex ? 'Gains tax (deferred)' : 'Capital gains tax', short: ex ? 'Gains tax*' : 'Gains tax', v: ex ? 0 : cgTax }, { k: 'end', label: ex ? 'Equity to roll over' : 'Cash to you', short: ex ? 'To roll' : 'Cash to you', v: 0 }];
        wf = waterfall(W, rows, 24); label = 'Sale waterfall from sale price to cash';
        extra = capAt(wf, W, 'AFTER ' + n + ' YEARS');
        read.innerHTML = stat('Sale price', kusd(sale), '', true) + stat('Taxable gain', kusd(Math.max(0, gain)), '') + stat(ex ? 'Tax deferred' : 'Tax at sale', kusd(recapTax + cgTax), ex ? 'info' : 'dn') + stat('Cash out', kusd(sale - sell - bal - taxNow), 'up');
        msg.innerHTML = ex
          ? ui.msg('info', '1031 exchange', `Buy another investment property within the deadlines and the ${usd0(recapTax + cgTax)} of tax is deferred, not forgiven. The low basis carries into the new property. Hold until death and heirs get a stepped-up basis.`)
          : ui.msg('acc', 'Recapture bites', `The ${usd0(accDep)} of depreciation you deducted comes back: taxed at up to 25% (${usd0(recapTax)} here). The rest of the gain pays the long-term rate (${usd0(cgTax)}). Any losses you could not use earlier are released when you sell.`);
      }
      fig.innerHTML = S.wrap(W, wf.H, label, extra + wf.body);
    });
  };

  /* ======================================================================
     strCalc: short-term rental, gross bookings to real profit
     ====================================================================== */
  const SEASONS = {
    flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    beach: [0.5, 0.55, 0.7, 0.85, 1.05, 1.35, 1.55, 1.5, 1.1, 0.85, 0.55, 0.55],
    ski: [1.6, 1.6, 1.3, 0.8, 0.55, 0.75, 0.95, 0.9, 0.6, 0.6, 0.8, 1.5],
    city: [0.75, 0.8, 0.95, 1.05, 1.1, 1.1, 1.1, 1.1, 1.1, 1.05, 0.95, 0.95],
  };
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MON = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /* Platform fee choices: what the host pays as a share of the booking subtotal (nightly price + cleaning fee). */
  SML.widgets.strCalc = function (root) {
    const id = SML.uid('st');
    const FEES = { split: 3, single: 15.5 };
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'w', label: 'Waterfall' }, { v: 'm', label: 'By month' }], 'w', 'View')}<span class="grow"></span>${ui.seg(id + '-s', [{ v: 'flat', label: 'Steady' }, { v: 'beach', label: 'Beach' }, { v: 'ski', label: 'Ski' }, { v: 'city', label: 'City' }], 'beach', 'Seasons')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        <p class="wrn-sub">Bookings</p>
        ${ui.slider({ id: id + '-adr', label: 'Average nightly rate', min: 60, max: 800, step: 5, value: 300, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-occ', label: 'Occupancy (year average)', min: 15, max: 90, step: 1, value: 62, fmt: 'pct' })}
        ${ui.slider({ id: id + '-stay', label: 'Average stay', min: 1, max: 14, step: 0.5, value: 3, fmt: (v) => v + (v === 1 ? ' night' : ' nights') })}
        ${ui.slider({ id: id + '-mgmt', label: 'Manager or co-host', min: 0, max: 35, step: 1, value: 20, fmt: (v) => v + '% of nights' })}
        <div class="wrn-row"><span class="ctl-lab">Airbnb fee</span>${ui.seg(id + '-pf', [{ v: 'single', label: `Host-only (${FEES.single}%)` }, { v: 'split', label: `Old split (${FEES.split}%)` }], 'single', 'Airbnb fee structure')}</div>
        <details class="wrn-more"><summary>Cleaning, supplies, bills and taxes collected</summary><div class="wrn-in">
        ${ui.slider({ id: id + '-cfee', label: 'Cleaning fee you charge', min: 0, max: 300, step: 5, value: 125, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ccost', label: 'Cleaning cost per stay', min: 0, max: 300, step: 5, value: 110, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-sup', label: 'Supplies per stay', min: 0, max: 80, step: 1, value: 20, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-util', label: 'Utilities, internet, streaming', min: 0, max: 1000, step: 10, value: 350, fmt: (v) => usd0(v) + '/mo' })}
        ${ui.slider({ id: id + '-ins', label: 'Short-term rental insurance', min: 500, max: 8000, step: 100, value: 2400, fmt: (v) => usd0(v) + '/yr' })}
        ${ui.slider({ id: id + '-furn', label: 'Furnishing (replaced every 7 years)', min: 0, max: 100000, step: 1000, value: 28000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-otax', label: 'Local occupancy tax', min: 0, max: 18, step: 0.5, value: 12, fmt: 'pct1' })}
        </div></details>
        <details class="wrn-more"><summary>The home and the loan</summary><div class="wrn-in">
        ${ui.slider({ id: id + '-price', label: 'Home price', min: 100000, max: 2000000, step: 5000, value: 350000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-down', label: 'Down payment', min: 10, max: 100, step: 1, value: 25, fmt: 'pct' })}
        ${ui.slider({ id: id + '-rate', label: 'Mortgage rate', min: 3, max: 10, step: 0.05, value: 7.4, fmt: (v) => v.toFixed(2) + '%' })}
        ${ui.slider({ id: id + '-ptax', label: 'Property tax', min: 0.3, max: 3, step: 0.05, value: 1.1, fmt: (v) => v.toFixed(2) + '% a year' })}
        ${ui.slider({ id: id + '-maint', label: 'Maintenance', min: 0, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1) + '% of price' })}
        </div></details>
        <p class="wrn-sub">Your taxes</p>
        <div class="wrn-row"><span class="ctl-lab">Bracket</span>${bracketSeg(id + '-br', 24)}</div>
        ${ui.slider({ id: id + '-magi', label: 'Your income (MAGI)', min: 40000, max: 400000, step: 5000, value: 160000, fmt: 'usd0' })}
        <div class="wrn-row">${ui.chips(id + '-x', [
          { k: 'mp', label: 'I materially participate', color: 'var(--up)' },
          { k: 'cs', label: 'Cost segregation', color: 'var(--violet)' },
          { k: 'svc', label: 'Hotel-like services', color: 'var(--accent)' },
          { k: 'd14', label: '14 nights or fewer', color: 'var(--info)' },
        ])}</div>
      </div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Year-one estimate. Since late 2025 most US Airbnb hosts pay a 15.5% host-only fee on the nightly price plus cleaning fee, and guests pay no separate service fee. Depreciation: building is 80% of the price over 27.5 years; with cost segregation, 25% of the building is written off in year one through 100% bonus depreciation (homes bought after January 19, 2025). The tax result treats maintenance and the furniture reserve as spent and deductible this year; unspent reserves are not deductible, and furniture is normally depreciated. Some CPAs use 39 years, not 27.5, for homes rented mostly by the night. Self-employment tax at 15.3% on 92.35% of profit when services are hotel-like. Occupancy tax is collected from guests and passed on. Ignores state tax and the 3.8% investment income tax. Example numbers, not advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    function calc() {
      const adr = st.n(id + '-adr'), occ = st.n(id + '-occ') / 100, stay = st.n(id + '-stay'), cfee = st.n(id + '-cfee'), otax = st.n(id + '-otax') / 100;
      const pfPct = (st.seg(id + '-pf') === 'single' ? FEES.single : FEES.split) / 100;
      const ccost = st.n(id + '-ccost'), mgmt = st.n(id + '-mgmt') / 100, sup = st.n(id + '-sup'), util = st.n(id + '-util'), ins = st.n(id + '-ins'), furn = st.n(id + '-furn');
      const price = st.n(id + '-price'), down = st.n(id + '-down') / 100, rate = st.n(id + '-rate'), ptax = st.n(id + '-ptax') / 100, maint = st.n(id + '-maint') / 100;
      const br = Number(st.seg(id + '-br') || 24) / 100, magi = st.n(id + '-magi');
      const mp = st.on(id + '-x', 'mp'), cs = st.on(id + '-x', 'cs'), svc = st.on(id + '-x', 'svc'), d14 = st.on(id + '-x', 'd14');
      const prof = SEASONS[st.seg(id + '-s') || 'beach']; const mean = prof.reduce((a, b) => a + b, 0) / 12;
      const months = prof.map((p, i) => { const o = Math.min(0.98, occ * (p / mean)); const nights = o * DAYS[i]; return { o, nights, stays: nights / stay }; });
      let nights = months.reduce((a, m) => a + m.nights, 0);
      let stays = nights / stay;
      if (d14) { const f = nights > 0 ? Math.min(1, 14 / nights) : 0; nights = Math.min(14, nights); stays = nights / stay; months.forEach((m) => { m.nights *= f; m.stays *= f; }); }
      const nightly = nights * adr, cleanFees = stays * cfee, sub = nightly + cleanFees, occTax = sub * otax, guests = sub + occTax;
      const platform = sub * pfPct, cleaning = stays * ccost, manager = nightly * mgmt, supplies = stays * sup;
      const loan = price * (1 - down), pi = pmt(loan, rate, 30) * 12, int1 = interestYear(loan, rate, 30, 0);
      let fixed = { util: util * 12, ins, ptax: price * ptax, maint: price * maint, furn: furn / 7 };
      if (d14) fixed = { util: 0, ins: 0, ptax: 0, maint: 0, furn: 0 };
      const fixedSum = fixed.util + fixed.ins + fixed.ptax + fixed.maint + fixed.furn;
      const noi = sub - platform - cleaning - manager - supplies - fixedSum;
      const cashPre = noi - (d14 ? 0 : pi);
      const building = price * 0.8, depStd = building / 27.5, dep = cs ? building * 0.25 + (building * 0.75) / 27.5 : depStd;
      const taxable = d14 ? 0 : noi - int1 - dep;
      let tax = 0, se = 0, rule = '';
      const shortStay = stay <= 7;
      if (d14) { rule = 'd14'; tax = 0; }
      else if (taxable >= 0) { tax = taxable * br; if (svc) { se = taxable * 0.9235 * 0.153; tax += se; } rule = 'profit'; }
      else {
        const loss = -taxable;
        if (shortStay && mp) { tax = -loss * br; rule = 'loophole'; }
        else if (shortStay) { tax = 0; rule = 'passive-biz'; }
        else { const allow = magi <= 100000 ? 25000 : Math.max(0, 25000 - 0.5 * (magi - 100000)); const usable = Math.min(loss, allow); tax = -usable * br; rule = usable >= loss ? 'allow-all' : usable > 0 ? 'allow-part' : 'allow-none'; }
      }
      const kept = cashPre - tax;
      return { adr, nights, stays, nightly, cleanFees, sub, occTax, guests, platform, cleaning, manager, supplies, fixed, fixedSum, noi, pi, int1, cashPre, dep, taxable, tax, se, rule, kept, months, prof, shortStay, mp, cs, svc, d14, br, cfee, ccost, sup, mgmt, pfPct, util };
    }
    const draw = ui.responsive(fig, (W) => {
      const c = calc(), v = st.seg(id + '-v') || 'w';
      const read = root.querySelector('#' + id + '-read'), msg = root.querySelector('#' + id + '-msg');
      let body = '', H = 300, label = '';
      if (v === 'w') {
        const rows = [{ k: 'start', label: 'Guests paid', v: c.guests }, { k: 'pass', label: 'Occupancy tax (passed on)', short: 'Occ. tax', v: c.occTax }, { k: 'sub', label: 'Platform fee', short: 'Platform', v: c.platform }, { k: 'sub', label: 'Cleaning', v: c.cleaning }];
        if (c.manager > 0) rows.push({ k: 'sub', label: 'Manager or co-host', short: 'Manager', v: c.manager });
        rows.push({ k: 'sub', label: 'Supplies', v: c.supplies });
        if (!c.d14) rows.push({ k: 'sub', label: 'Utilities + internet', short: 'Utilities', v: c.fixed.util }, { k: 'sub', label: 'Insurance', v: c.fixed.ins }, { k: 'sub', label: 'Property tax', short: 'Prop. tax', v: c.fixed.ptax }, { k: 'sub', label: 'Maintenance', short: 'Maint.', v: c.fixed.maint }, { k: 'sub', label: 'Furnishing reserve', short: 'Furnishing', v: c.fixed.furn }, { k: 'sub2', label: 'Operating profit', short: 'Op. profit', v: 0 }, { k: 'sub', label: 'Mortgage payments', short: 'Mortgage', v: c.pi });
        rows.push({ k: 'sub2', label: 'Cash before tax', short: 'Pre-tax', v: 0 }, { k: 'tax', label: c.tax < 0 ? 'Tax saved on your pay' : c.se > 0 ? 'Income + self-emp. tax' : 'Income tax', short: c.tax < 0 ? 'Tax saved' : 'Tax', v: c.tax }, { k: 'end', label: 'What you keep', short: 'You keep', v: 0 });
        const wf = waterfall(W, rows, 24); body = capAt(wf, W, c.d14 ? '14 NIGHTS' : 'FIRST YEAR') + wf.body; H = wf.H; label = 'Waterfall from what guests paid to what you keep';
      } else {
        const compact = W < 520, L = compact ? 44 : 64, R = 10, T = 30, B = 40, Hh = compact ? 250 : 290; H = Hh;
        const mFixed = (c.fixedSum + (c.d14 ? 0 : c.pi)) / 12;
        const net = c.months.map((m) => { const nightly = m.nights * c.adr, cf = m.stays * c.cfee, sub = nightly + cf; return sub - sub * c.pfPct - m.stays * c.ccost - nightly * c.mgmt - m.stays * c.sup - mFixed; });
        const lo = Math.min(0, ...net), hi = Math.max(0, ...net, 1);
        const y = SML.lin(lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.08, Hh - B, T), bw = (W - L - R) / 12;
        const tks = SML.ticks(lo, hi, 4);
        tks.forEach((t) => { body += S.line(L, y(t), W - R, y(t), t === 0 ? 's-mut' : 's-grid') + S.text(L - 6, y(t) + 4, kusd(t), 'xs mono', 'end'); });
        net.forEach((n, i) => { const x0 = L + i * bw + bw * 0.16, w = bw * 0.68; body += S.rect(x0, Math.min(y(0), y(n)), w, Math.max(1.5, Math.abs(y(n) - y(0))), n >= 0 ? 'f-up' : 'f-dn', 2); body += S.text(x0 + w / 2, Hh - B + 16, compact ? MON[i] : MON3[i], 'xs', 'middle'); body += S.text(x0 + w / 2, Hh - B + 30, Math.round(c.months[i].o * 100) + '%', 'xs mono mut', 'middle'); });
        body += S.text(L, 16, compact ? 'CASH EACH MONTH' : 'CASH EACH MONTH AFTER ALL COSTS', 'cap') + S.text(W - R, 16, compact ? 'occ. % below' : 'occupancy % below each month', 'xs', 'end');
        label = 'Cash each month after all costs, by month, with occupancy';
        const neg = net.filter((n) => n < 0).length;
        msg.innerHTML = neg ? ui.msg('dn', neg + ' losing months', `Fixed costs of ${usd0(mFixed)} a month do not take a season off. ${neg} month${neg === 1 ? '' : 's'} lose money here, so keep a cash cushion for the slow season.`) : ui.msg('up', 'Every month pays', `Even the slowest month covers fixed costs of ${usd0(mFixed)}.`);
      }
      fig.innerHTML = S.wrap(W, H, label, body);
      const margin = c.guests > 0 ? (c.kept / c.guests) * 100 : 0;
      read.innerHTML = stat(c.d14 ? '14-night income' : 'Gross bookings', kusd(c.guests), '', true) + stat('Nights booked', F.num(Math.round(c.nights)), '') + stat('Cash before tax', sgnK(c.cashPre), c.cashPre >= 0 ? 'up' : 'dn') + stat('You keep', sgnK(c.kept), c.kept >= 0 ? 'up' : 'dn') + stat('Kept per $100 booked', usd0(margin), margin >= 0 ? '' : 'dn');
      if (v === 'w') {
        const why = {
          d14: `Rent the home you live in for 14 nights or fewer and the income is tax-free; you also deduct no rental costs. Here that is ${usd0(c.kept)} for ${Math.round(c.nights)} nights.`,
          profit: `Taxable profit of ${usd0(c.taxable)} costs ${usd0(c.tax)} in tax${c.se > 0 ? ', including ' + usd0(c.se) + ' of self-employment tax because hotel-like services make it a business' : ''}.`,
          loophole: `Average stay is ${c.stays > 0 ? (c.nights / c.stays).toFixed(1) : 0} nights and you materially participate, so the ${usd0(-c.taxable)} paper loss${c.cs ? ' (boosted by cost segregation)' : ''} can offset your pay and save about ${usd0(-c.tax)}. This is the short-term rental "loophole". The IRS checks your hours.`,
          'passive-biz': `Average stay is 7 nights or less, so this is not a "rental activity", and the $25,000 allowance does not apply. Without material participation the ${usd0(-c.taxable)} loss is passive and waits for passive income or a sale.`,
          'allow-all': `Stays average over 7 nights, so this is a rental. Your ${usd0(-c.taxable)} paper loss fits inside the $25,000 allowance at your income and saves about ${usd0(-c.tax)}.`,
          'allow-part': `Stays average over 7 nights, so this is a rental. Only part of the ${usd0(-c.taxable)} loss fits your shrinking $25,000 allowance; the rest carries forward.`,
          'allow-none': `Stays average over 7 nights, so this is a rental, and at your income the $25,000 allowance is gone. The ${usd0(-c.taxable)} loss carries forward.`,
        }[c.rule];
        const head = c.kept >= 0 ? (margin < 10 ? 'acc' : 'up') : 'dn';
        msg.innerHTML = ui.msg(head, c.kept >= 0 ? 'Real profit' : 'Real loss', `Guests paid ${usd0(c.guests)}; ${c.kept >= 0 ? `you keep ${usd0(c.kept)}, about ${usd0(margin)} of every $100.` : `after every cost and tax you are out ${usd0(-c.kept)} for the year.`} ${why}`);
      }
    });
  };

  /* ======================================================================
     leverageLab: borrowing compared, margin call, leveraged ETFs, prepay
     ====================================================================== */
  const DEBTS = () => [
    { k: 'mort', name: 'Fixed mortgage', short: 'Mortgage', rate: 7.4, fixed: true, call: false, coll: 'home', deduct: 'mort' },
    { k: 'heloc', name: 'HELOC', short: 'HELOC', rate: 7.75, fixed: false, call: false, coll: 'home', deduct: 'mort' },
    { k: 'sbloc', name: 'Securities line (SBLOC)', short: 'SBLOC', rate: 6.75, fixed: false, call: true, coll: 'investments', deduct: '' },
    { k: 'margin', name: 'Margin loan', short: 'Margin', rate: 10, fixed: false, call: true, coll: 'investments', deduct: 'inv' },
    { k: '401k', name: '401(k) loan', short: '401(k) loan', rate: 8, fixed: true, call: false, coll: 'your savings', deduct: '' },
    { k: 'auto', name: 'New car loan', short: 'Car loan', rate: 6.35, fixed: true, call: false, coll: 'car', deduct: '' },
    { k: 'card', name: 'Credit card', short: 'Card', rate: 22.4, fixed: false, call: false, coll: 'none', deduct: '' },
  ];
  SML.widgets.leverageLab = function (root) {
    const id = SML.uid('lv');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', [{ v: 'cmp', label: 'Compare' }, { v: 'mc', label: 'Margin call' }, { v: 'etf', label: 'Leveraged ETFs' }, { v: 'pay', label: 'Prepay mortgage?' }], 'cmp', 'Topic')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl wrn-grp" id="${id}-g-cmp">
        ${ui.slider({ id: id + '-exp', label: 'Return you expect on stocks', min: 3, max: 10, step: 0.5, value: 7, fmt: 'pct1' })}
        <div class="wrn-row"><span class="ctl-lab">Bracket</span>${bracketSeg(id + '-br', 24)}</div>
        <div class="wrn-row">${ui.chips(id + '-cx', [{ k: 'item', label: 'I itemize deductions', color: 'var(--up)' }])}</div>
      </div>
      <div class="wg-ctrl wrn-grp" id="${id}-g-mc" hidden>
        ${ui.slider({ id: id + '-cash', label: 'Your own money', min: 10000, max: 200000, step: 5000, value: 50000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-loan', label: 'Borrowed on margin', min: 0, max: 100, step: 5, value: 100, fmt: (v) => v + '% of your money' })}
        ${ui.slider({ id: id + '-mm', label: 'Maintenance requirement', min: 25, max: 50, step: 5, value: 30, fmt: 'pct' })}
        ${ui.slider({ id: id + '-drop', label: 'Market drop', min: 0, max: 70, step: 1, value: 20, fmt: 'pct' })}
      </div>
      <div class="wg-ctrl wrn-grp" id="${id}-g-etf" hidden>
        <div class="wrn-row"><span class="ctl-lab">Market path</span>${ui.seg(id + '-path', [{ v: 'chop', label: 'Choppy, ends flat' }, { v: 'up', label: 'Steady climb' }, { v: 'crash', label: 'Crash, recover' }], 'chop', 'Market path')}</div>
        ${ui.slider({ id: id + '-vol', label: 'Daily swings', min: 0.4, max: 3, step: 0.1, value: 1.5, fmt: (v) => '±' + v.toFixed(1) + '% a day' })}
        <div class="wg-actions" style="padding:0;grid-column:1/-1"><button type="button" class="btn btn-g sm" id="${id}-new">New random path</button></div>
      </div>
      <div class="wg-ctrl wrn-grp" id="${id}-g-pay" hidden>
        ${ui.slider({ id: id + '-bal', label: 'Mortgage balance', min: 50000, max: 1000000, step: 10000, value: 300000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-mr', label: 'Mortgage rate', min: 2, max: 9, step: 0.125, value: 6.5, fmt: (v) => v.toFixed(3).replace(/0$/, '') + '%' })}
        ${ui.slider({ id: id + '-yl', label: 'Years left', min: 5, max: 30, step: 1, value: 25, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-xtra', label: 'Extra payment', min: 0, max: 3000, step: 50, value: 500, fmt: (v) => usd0(v) + '/mo' })}
        ${ui.slider({ id: id + '-safe', label: 'Safe yield you could earn instead', min: 0, max: 7, step: 0.05, value: 4.25, fmt: (v) => v.toFixed(2) + '%' })}
        <div class="wrn-row"><span class="ctl-lab">Bracket</span>${bracketSeg(id + '-br3', 24)}</div>
        <div class="wrn-row">${ui.chips(id + '-px', [{ k: 'item', label: 'I itemize (deduct mortgage interest)', color: 'var(--up)' }])}</div>
      </div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    let seed = 7;
    const st = ui.wire(root, (e) => { const s = e && e.target && e.target.closest && e.target.closest('.seg'); if (s && s.id === id + '-br') st.setSeg(id + '-br3', st.seg(id + '-br')); if (s && s.id === id + '-br3') st.setSeg(id + '-br', st.seg(id + '-br3')); draw(); });
    root.querySelector('#' + id + '-new').addEventListener('click', () => { seed = (seed * 7 + 13) % 997 || 5; draw(); });
    ui.drag(fig, { sel: '.handle', move(pt) { if (st.seg(id + '-t') !== 'mc' || !fig._x) return; const d = SML.clamp(Math.round(fig._x.invert(pt.x)), 0, 70); if (d !== st.n(id + '-drop')) { st.set(id + '-drop', d); draw(); } } });
    const read = root.querySelector('#' + id + '-read'), msg = root.querySelector('#' + id + '-msg'), note = root.querySelector('#' + id + '-note');

    function drawCmp(W) {
      const exp = st.n(id + '-exp'), br = Number(st.seg(id + '-br') || 24) / 100, item = st.on(id + '-cx', 'item');
      const compact = W < 560;
      const rows = DEBTS().map((d) => { if (d.k === '401k') return Object.assign({}, d, { rate: exp, after: exp, verdict: 'acc' }); const after = (d.deduct === 'mort' || d.deduct === 'inv') && item ? d.rate * (1 - br) : d.rate; const verdict = after >= exp ? 'dn' : d.call || !d.fixed || d.k === 'auto' ? 'acc' : 'up'; return Object.assign({}, d, { after, verdict }); });
      const LW = compact ? 78 : 168, R = compact ? 50 : 150, T = 34, rh = compact ? 34 : 36;
      const H = T + rows.length * rh + 44, x = SML.lin(0, 24, LW + 8, W - R);
      let b = S.text(LW + 8, 14, 'AFTER-TAX INTEREST RATE', 'cap');
      SML.ticks(0, 24, compact ? 4 : 6).forEach((t) => { b += S.line(x(t), T - 6, x(t), T + rows.length * rh, 's-grid') + S.text(x(t), T + rows.length * rh + 16, t + '%', 'xs mono', 'middle'); });
      rows.forEach((r, i) => {
        const y = T + i * rh, yc = y + rh / 2;
        b += S.text(LW, yc + 4, esc(compact ? r.short : r.name), (compact ? 'sm' : 'md') + ' ink', 'end');
        if (r.after < r.rate) b += S.rect(x(0), yc - 8, x(r.rate) - x(0), 16, 'f-shade2', 2);
        b += S.rect(x(0), yc - 8, Math.max(2, x(r.after) - x(0)), 16, r.verdict === 'up' ? 'f-up' : r.verdict === 'acc' ? 'f-acc' : 'f-dn', 2);
        b += S.text(Math.min(x(r.after) + 6, W - R - 4), yc + 4, r.after.toFixed(1) + '%', 'sm mono b wrn-halo ' + (r.verdict === 'up' ? 'up' : r.verdict === 'acc' ? 'acc' : 'dn'));
        if (!compact) { const tags = r.k === '401k' ? 'interest goes to you · cost is lost growth' : r.k === 'auto' ? 'fixed · the car loses value' : [r.fixed ? 'fixed' : 'variable', r.call ? 'can be called' : '', r.coll !== 'none' ? 'secured by ' + r.coll : 'unsecured'].filter(Boolean).join(' · '); b += S.text(W - 2, yc + 4, tags, 'xs', 'end'); }
      });
      b = S.line(x(exp), T - 6, x(exp), T + rows.length * rh + 22, 's-ink w2 dash') + b + S.text(x(exp) + (exp > 14 ? -4 : 4), T + rows.length * rh + 34, (compact ? 'you expect ' : 'expected return ') + exp + '%', 'sm ink b', exp > 14 ? 'end' : 'start');
      fig.innerHTML = S.wrap(W, H, 'After-tax interest rates on common kinds of debt compared with an expected stock return', b);
      const good = rows.filter((r) => r.verdict === 'up').map((r) => r.short), bad = rows.filter((r) => r.verdict === 'dn').map((r) => r.short);
      read.innerHTML = stat('Expected return', pct(exp), '', true) + stat('Mortgage after tax', pct(rows[0].after), rows[0].verdict === 'up' ? 'up' : 'acc') + stat('Credit card', pct(rows[rows.length - 1].after), 'dn') + stat('Spread vs mortgage', (exp - rows[0].after >= 0 ? '+' : '') + (exp - rows[0].after).toFixed(1) + ' pts', exp - rows[0].after >= 2 ? 'up' : 'acc');
      msg.innerHTML = ui.msg('info', 'Rule of thumb', `Green: cheaper than the return you expect, at a fixed rate no one can call in (${good.length ? good.join(', ') : 'none at this setting'}). Amber: can work, but the rate floats, the lender can call it, or it buys something that loses value. Red: costs more than stocks are likely to earn (${bad.length ? bad.join(', ') : 'none'}), so borrowing it to invest loses on average. Pay red debt down first, highest rate first.`);
      note.textContent = `Rates as of October 2026: mortgage is Freddie Mac's 30-year average (7.40%), car loan Experian's new-car average (6.35%), card the Fed's rate on accounts paying interest (22.4%). HELOC, SBLOC and 401(k) loans float near the prime rate (7%); margin rates range widely by broker and balance. Mortgage interest is deductible only if you itemize; margin interest only against investment income. Expected returns are a guess.`;
    }
    function drawMc(W) {
      const C = st.n(id + '-cash'), L = (C * st.n(id + '-loan')) / 100, m = st.n(id + '-mm') / 100, d = st.n(id + '-drop') / 100;
      const tot = C + L, V = tot * (1 - d), E = V - L, ratio = V > 0 ? E / V : 0;
      const dCall = L > 0 ? Math.max(0, 1 - L / ((1 - m) * tot)) : 1, dWipe = L > 0 ? C / tot : 1;
      const compact = W < 520, Lm = compact ? 44 : 60, R = 14, T = 30, B = 36, H = compact ? 260 : 300;
      const x = SML.lin(0, 70, Lm, W - R), y = SML.lin(-100, 100, H - B, T);
      fig._x = { invert: (px) => ((px - Lm) / (W - R - Lm)) * 70 };
      let b = '';
      [-100, -50, 0, 50, 100].forEach((t) => { b += S.line(Lm, y(t), W - R, y(t), t === 0 ? 's-mut' : 's-grid') + S.text(Lm - 6, y(t) + 4, (t > 0 ? '+' : '') + t + '%', 'xs mono', 'end'); });
      [0, 10, 20, 30, 40, 50, 60, 70].forEach((t) => { if (compact && t % 20 && t !== 70) return; b += S.text(x(t), H - B + 16, t + '%', 'xs mono', 'middle'); });
      b += S.text((Lm + W - R) / 2, H - 4, 'market drop', 'xs', 'middle');
      if (L > 0 && dCall < 0.7) b += S.rect(x(dCall * 100), T, x(70) - x(dCall * 100), H - B - T, 'f-dn-t');
      const pts1 = [], pts2 = [];
      for (let t = 0; t <= 70; t += 1) { const dd = t / 100; pts1.push([x(t), y(-t)]); const e = tot * (1 - dd) - L; pts2.push([x(t), y(Math.max(-100, (e / C - 1) * 100))]); }
      b += S.poly(pts1, 's-mut w2 dash') + S.poly(pts2, 's-dn w25');
      const lgx = W - R - 8, lgy = T + 14;
      b += S.line(lgx - (compact ? 112 : 132), lgy - 4, lgx - (compact ? 92 : 112), lgy - 4, 's-dn w25') + S.text(lgx, lgy, 'with margin', 'sm dn b wrn-halo', 'end');
      b += S.line(lgx - (compact ? 112 : 132), lgy + 14, lgx - (compact ? 92 : 112), lgy + 14, 's-mut w2 dash') + S.text(lgx, lgy + 18, 'no leverage', 'sm mut b wrn-halo', 'end');
      if (L > 0 && dCall < 0.7) b += S.line(x(dCall * 100), T, x(dCall * 100), H - B, 's-dn w15 dash2') + S.text(x(dCall * 100) + (dCall > 0.45 ? -4 : 4), H - B - 8, (compact ? 'call −' : 'margin call at −') + (dCall * 100).toFixed(0) + '%', 'sm dn b wrn-halo', dCall > 0.45 ? 'end' : 'start');
      const ey = y(Math.max(-100, (E / C - 1) * 100)), hx = x(d * 100);
      b += S.line(hx, T, hx, H - B, 's-ink w15 dash2') + S.circle(hx, ey, 8, 'handle') + S.circle(hx, ey, 3, 'f-acc');
      b += S.text(hx + (d > 0.5 ? -12 : 12), ey - 10, (compact ? '' : 'drag ') + F.spct((E / C - 1) * 100, 0), 'sm mono b wrn-halo ' + (E >= C ? 'up' : 'dn'), d > 0.5 ? 'end' : 'start');
      b += S.text(Lm, 16, compact ? 'GAIN OR LOSS ON YOUR MONEY' : 'YOUR GAIN OR LOSS ON YOUR OWN MONEY', 'cap');
      fig.innerHTML = S.wrap(W, H, 'How a market drop hits your own money with and without margin, and where a margin call starts', b);
      const called = L > 0 && ratio < m, wiped = E <= 0, need = Math.max(0, m * V - E);
      read.innerHTML = stat('Portfolio value', kusd(V), '', true) + stat('Your equity', kusd(E), E >= C ? 'up' : 'dn') + stat('Equity share', pct(ratio * 100, 0), called ? 'dn' : '') + stat('Your loss', pct(Math.max(0, (C - E) / C) * 100, 0), 'dn') + stat('Call starts at', L > 0 ? '−' + (dCall * 100).toFixed(0) + '%' : 'never', L > 0 ? 'dn' : 'up');
      if (!L) msg.innerHTML = ui.msg('up', 'No margin', `Without borrowing, a ${pct(d * 100, 0)} drop costs ${pct(d * 100, 0)}, and no one can force you to sell.`);
      else if (wiped) msg.innerHTML = ui.msg('dn', 'Wiped out', `A ${pct(d * 100, 0)} drop erases all ${usd0(C)} of your money. Long before this, the broker would have sold your shares at the lows.`);
      else if (called) msg.innerHTML = ui.msg('dn', 'Margin call', `Your equity is ${pct(ratio * 100, 0)} of the account, below the ${pct(m * 100, 0)} requirement. Deposit about ${usd0(need)} fast, or the broker sells for you, at the worst time and without asking.`);
      else msg.innerHTML = ui.msg('acc', 'Amplified', `Borrowing ${usd0(L)} turns a ${pct(d * 100, 0)} market drop into a ${pct(((C - E) / C) * 100, 0)} loss of your own money. The call comes at a ${pct(dCall * 100, 0)} drop, and markets have fallen that far before.`);
      note.textContent = 'Federal rules require 50% equity to open a margin purchase and at least 25% equity afterwards; most brokers ask 30% or more and can raise it any day. Interest costs are left out here.';
    }
    function pathFor(kind, vol) {
      const r = SML.rng(seed), n = 250, g = [];
      for (let i = 0; i < n; i++) g.push(r.gauss() * vol);
      const mean = g.reduce((a, b) => a + b, 0) / n;
      if (kind === 'chop') return g.map((x) => x - mean);
      if (kind === 'up') return g.map((x) => x - mean + Math.log(1.3) / n);
      const k = 70; const m1 = g.slice(0, k).reduce((a, b) => a + b, 0) / k, m2 = g.slice(k).reduce((a, b) => a + b, 0) / (n - k);
      return g.map((x, i) => (i < k ? x - m1 + Math.log(0.65) / k : x - m2 + Math.log(1 / 0.65) / (n - k)));
    }
    function drawEtf(W) {
      const kind = st.seg(id + '-path') || 'chop', vol = st.n(id + '-vol') / 100;
      const lr = pathFor(kind, vol), lines = [[1], [1], [1]];
      lr.forEach((g) => { const r = Math.exp(g) - 1; [1, 2, 3].forEach((k, j) => { const prev = lines[j][lines[j].length - 1]; lines[j].push(Math.max(0.0001, prev * (1 + k * r))); }); });
      const all = lines.flat(); const lo = Math.min(...all), hi = Math.max(...all);
      const compact = W < 520, L = compact ? 40 : 56, R = compact ? 60 : 76, T = 28, B = 30, H = compact ? 250 : 290;
      const x = SML.lin(0, 250, L, W - R), y = SML.lin(Math.max(0, lo * 0.92), hi * 1.06, H - B, T);
      let b = '';
      SML.ticks(Math.max(0, lo * 0.92), hi * 1.06, 4).forEach((t) => { b += S.line(L, y(t), W - R, y(t), Math.abs(t - 1) < 1e-9 ? 's-mut' : 's-grid') + S.text(L - 6, y(t) + 4, '$' + Math.round(t * 100), 'xs mono', 'end'); });
      const cls = ['s-ink w2', 's-acc w2', 's-dn w2'], tc = ['ink', 'acc', 'dn'], lab = ['1×', '2×', '3×'];
      const ends = lines.map((ln) => ln[ln.length - 1]);
      const ly = ends.map((e) => y(e)); const order = [0, 1, 2].sort((a, b2) => ly[a] - ly[b2]); for (let k = 1; k < 3; k++) { if (ly[order[k]] - ly[order[k - 1]] < 14) ly[order[k]] = ly[order[k - 1]] + 14; }
      lines.forEach((ln, j) => { b += S.poly(ln.map((v, i) => [x(i), y(v)]), cls[j]); b += S.text(W - R + 6, ly[j] + 4, lab[j] + ' $' + Math.round(ends[j] * 100), 'sm mono b ' + tc[j]); });
      b += S.text(L, 16, compact ? '$100 IN EACH, ONE YEAR' : '$100 IN EACH, ONE YEAR OF TRADING DAYS', 'cap');
      fig.innerHTML = S.wrap(W, H, 'One dollar index versus 2x and 3x daily leveraged funds over a year', b);
      const idx = (ends[0] - 1) * 100, three = (ends[2] - 1) * 100;
      read.innerHTML = stat('Index', spct0(idx), Math.round(idx) >= 0 ? 'up' : 'dn', true) + stat('2× fund', spct0((ends[1] - 1) * 100), ends[1] >= 0.995 ? 'up' : 'dn') + stat('3× fund', spct0(three), Math.round(three) >= 0 ? 'up' : 'dn') + stat('3 × index', spct0(idx * 3), '');
      msg.innerHTML = ui.msg(three < idx * 3 - 5 ? 'dn' : 'up', three < idx * 3 - 5 ? 'Volatility decay' : 'Trend helps', three < idx * 3 - 5 ? `The index ended ${spct0(idx)}, but the 3× fund ended ${spct0(three)}, not ${spct0(idx * 3)}. Each day's reset makes losses compound faster than gains in a choppy market.` : `In a steady trend the daily reset can even beat 3× the index. Change the path or raise the daily swings to see it turn.`);
      note.textContent = 'Simulated prices, no fees. Real leveraged funds also charge about 1% a year and are built for one day, not for holding. Press New random path for another year.';
    }
    function drawPay(W) {
      const bal = st.n(id + '-bal'), r = st.n(id + '-mr'), yl = st.n(id + '-yl'), x0 = st.n(id + '-xtra'), safe = st.n(id + '-safe'), br = Number(st.seg(id + '-br3') || 24) / 100, item = st.on(id + '-px', 'item');
      const p = pmt(bal, r, yl), mr = r / 1200; let b1 = bal, b2 = bal, i1 = 0, i2 = 0, m2 = 0; const s1 = [[0, bal]], s2 = [[0, bal]];
      for (let k = 1; k <= yl * 12; k++) { if (b1 > 0) { const it = b1 * mr; i1 += it; b1 = Math.max(0, b1 + it - p); } if (b2 > 0) { const it = b2 * mr; i2 += it; b2 = Math.max(0, b2 + it - p - x0); m2 = k; } if (k % 6 === 0) { s1.push([k / 12, b1]); s2.push([k / 12, b2]); } }
      const compact = W < 520, L = compact ? 48 : 62, R = 16, T = 28, B = 32, H = compact ? 240 : 270;
      const x = SML.lin(0, yl, L, W - R), y = SML.lin(0, bal * 1.05, H - B, T);
      let b = '';
      SML.ticks(0, bal, 4).forEach((t) => { b += S.line(L, y(t), W - R, y(t), t === 0 ? 's-mut' : 's-grid') + S.text(L - 6, y(t) + 4, kusd(t), 'xs mono', 'end'); });
      SML.ticks(0, yl, compact ? 4 : 6).forEach((t) => { b += S.text(x(t), H - B + 16, 'yr ' + t, 'xs mono', 'middle'); });
      b += S.area(s1.map((q) => [x(q[0]), y(q[1])]), y(0), 'f-shade2') + S.poly(s1.map((q) => [x(q[0]), y(q[1])]), 's-mut w2') + S.poly(s2.map((q) => [x(q[0]), y(q[1])]), 's-up w25');
      if (x0 > 0) b += S.circle(x(m2 / 12), y(0), 5, 'f-up') + S.text(x(m2 / 12), y(0) - 10, 'paid off yr ' + (m2 / 12).toFixed(1), 'sm up b', m2 / 12 > yl * 0.6 ? 'end' : 'middle');
      b += S.text(L, 16, compact ? 'LOAN BALANCE' : 'LOAN BALANCE: REGULAR PAYMENTS VS EXTRA ' + usd0(x0) + '/MO', 'cap');
      fig.innerHTML = S.wrap(W, H, 'Mortgage balance over time with and without extra payments', b);
      const after = item ? r * (1 - br) : r, safeAfter = safe * (1 - br);
      read.innerHTML = stat('Interest saved', kusd(i1 - i2), 'up', true) + stat('Years cut', ((yl * 12 - m2) / 12).toFixed(1), 'up') + stat('Prepay return (after tax)', pct(after, 2), '') + stat('Safe yield after tax', pct(safeAfter, 2), '');
      const wins = after > safeAfter;
      msg.innerHTML = ui.msg(wins ? 'up' : 'info', wins ? 'Prepay wins' : 'Keep the loan', `Every extra dollar earns a guaranteed ${pct(after, 2)} after tax by killing ${pct(r, 2)} interest${item ? ' you would otherwise deduct' : ''}. A safe ${pct(safe, 2)} yield keeps about ${pct(safeAfter, 2)} after tax. ${wins ? 'Prepay with money you would keep safe anyway, once you have the full 401(k) match, no high-interest debt and a full emergency fund.' : 'Low-rate mortgages are cheap leverage: keep paying on schedule and invest or save the extra.'} Money in the house is hard to get back out.`);
      note.textContent = 'A 3-month Treasury bill yielded about 4.26% before tax on October 20, 2026 (free of state tax). Fixed-rate loan, monthly compounding, extra payments go to principal. Ignores mortgage insurance, state tax and inflation. Stocks may beat both choices over decades, with more risk.';
    }
    const draw = ui.responsive(fig, (W) => {
      const t = st.seg(id + '-t') || 'cmp';
      ['cmp', 'mc', 'etf', 'pay'].forEach((k) => { root.querySelector('#' + id + '-g-' + k).hidden = k !== t; });
      fig.classList.toggle('drag', t === 'mc');
      if (t === 'cmp') drawCmp(W); else if (t === 'mc') drawMc(W); else if (t === 'etf') drawEtf(W); else drawPay(W);
    });
  };
  /* ======================================================================
     Lessons
     ====================================================================== */
  SML.lessons.push({
    id: 'l-rental', course: 'home', order: 5, title: 'Rental property: the real numbers', mins: 9, level: 'Intermediate',
    summary: 'Cash flow, cap rate, depreciation and the taxes on a long-term rental.',
    idea: 'A rental pays you only after vacancy, repairs, management, taxes and the mortgage. Depreciation then changes the tax picture.',
    widget: 'rentalCalc',
    try: 'Pick an example property, then switch between Monthly, Taxes and Sale and move the sliders.',
    body: [
      '<p>A rental home can build wealth three ways: monthly cash flow, a loan your tenants pay down, and a price that may rise. It can also cost you money every month. The difference is in costs most first-time landlords leave out.</p>',
      '<h3>Four numbers that matter</h3><ul><li><b>Net operating income (NOI):</b> rent you actually collect minus operating costs (vacancy, manager, repairs, property tax, insurance, HOA). It leaves out the mortgage.</li><li><b>Cap rate:</b> yearly NOI divided by the price. It compares properties as if you paid cash.</li><li><b>Cash flow:</b> NOI minus the mortgage payment. This is what reaches your bank account.</li><li><b>Cash-on-cash return:</b> yearly cash flow divided by the cash you put in (down payment plus buying costs).</li></ul>',
      '<h3>The costs people forget</h3><ul><li><b>Vacancy:</b> empty weeks between tenants. Landlords often budget 5% to 10% of rent.</li><li><b>Management:</b> property managers usually charge 8% to 12% of collected rent, plus a fee of a few hundred dollars to place each new tenant.</li><li><b>Repairs and big-ticket items:</b> roofs, heating and cooling, water heaters and appliances wear out. Set aside a reserve every month, often 5% to 10% of rent each for repairs and replacements.</li><li><b>Landlord insurance, property tax and HOA dues,</b> which can all rise after you buy.</li></ul>',
      '<h3>Why the old 1% rule rarely works now</h3><p>The 1% rule says monthly rent should be at least 1% of the price. In September 2026 Zillow’s typical US rent was $1,932 and its typical home value $366,913, about 0.53% a month. With 30-year mortgages averaging 7.40% in mid-October 2026, many rentals bought with a loan do not cash flow. Their return then depends on rent growth, the loan being paid down, price gains and tax breaks.</p>',
      '<h3>Depreciation: a deduction that costs no cash each year</h3><p>The IRS lets you deduct the building’s cost over 27.5 years, straight line. Land is not depreciable, so only the building counts. A $300,000 rental where the building is 80% of the value gives $240,000 ÷ 27.5 = $8,727 a year of deduction. That is why a rental can show a <b>tax loss</b> while it puts cash in your pocket. It is not free forever: the depreciation is recaptured and taxed when you sell.</p>',
      '<h3>The passive loss rules</h3><ul><li>Rental income and losses are <b>passive</b> by default, so losses usually offset only other passive income.</li><li>If you <b>actively participate</b> (you approve tenants, set rent, okay repairs), up to <b>$25,000</b> of rental losses a year can offset your pay. The allowance shrinks by 50 cents for every dollar of MAGI over $100,000 and is gone at $150,000.</li><li>Losses you cannot use carry forward. They are released when you sell the property in a fully taxable sale.</li><li><b>Real estate professionals</b> (more than 750 hours a year and more than half of their working time in real estate) who also materially participate in their rentals can treat rental losses as non-passive. A full-time employee rarely qualifies.</li></ul>',
      '<h3>When you sell</h3><ul><li><b>Depreciation recapture:</b> the depreciation you deducted is taxed at up to 25% when you sell.</li><li>The rest of the gain is a long-term capital gain (0%, 15% or 20%), and higher earners may owe the 3.8% net investment income tax too.</li><li>A <b>1031 exchange</b> defers all of it if you buy another investment property: name the replacement in writing within 45 days and close by the earlier of 180 days or your tax-return due date (with extensions), using a qualified intermediary to hold the cash. Cash you take out, or debt you do not replace, is “boot” and is taxed. It works only for real estate held for business or investment, not your home.</li><li>Hold until death and heirs get a <a href="#l-estate">step-up in basis</a>, which wipes out the untaxed gain.</li></ul>',
      '<h3>Moving between a home and a rental</h3><ul><li><b>Rent it first, move in later:</b> years after 2008 when the place was not your main home (for example, rented before you moved in) shrink the part of the gain the <a href="#l-home-taxes">home-sale exclusion</a> can cover.</li><li><b>Move out, rent it, then sell:</b> you keep the full exclusion if you owned and lived there 2 of the 5 years before the sale, so you have up to 3 years after moving out to sell. Depreciation you took while renting is still taxed (up to 25%); it cannot be excluded.</li><li><b>Turning your home into a rental:</b> depreciation starts from the <b>lower</b> of the home’s market value or your adjusted basis on the day it becomes a rental, and only the building part counts.</li></ul>',
      '<h3>Before you buy</h3><ul><li>Keep a separate cash reserve for repairs and empty months, on top of your <a href="#l-emergency">emergency fund</a>.</li><li>Get landlord insurance and think about an umbrella policy (<a href="#l-insurance">insurance lesson</a>).</li><li>Learn fair housing rules and screen tenants the same way every time.</li><li>Living in one unit of a duplex can cut the down payment and the risk: see <a href="#l-house-invest">house hacking</a>.</li></ul><p>Rental taxes have many edge cases. A CPA or enrolled agent who works with landlords is worth an hour before you buy.</p>',
    ],
    example: {
      title: 'A duplex, year one',
      intro: 'Made-up numbers: a $260,000 duplex renting for $2,600 a month in total, bought with 25% down at 7.75%.',
      steps: [
        'Rent is $2,600. Take off 6% vacancy ($156), a 10% manager fee on what you collect ($244), a 10% repair reserve ($260), property tax of $2,860 a year ($238) and insurance of $1,600 a year ($133). NOI is $1,568 a month, $18,815 a year: a 7.2% cap rate.',
        'The $195,000 loan costs $1,397 a month. Cash flow is $171 a month, $2,051 a year. You put in $65,000 down plus about $7,800 of buying costs, so cash-on-cash is $2,051 ÷ $72,800 = 2.8%.',
        'The building is 80% of the price: $208,000 ÷ 27.5 = $7,564 of depreciation a year.',
        'First-year mortgage interest is about $15,053. Taxable result: $18,815 − $15,053 − $7,564 = −$3,801, a tax loss while you collected $2,051. This assumes the repair reserve is spent on deductible repairs this year; money only set aside is not deductible until spent.',
        'Your MAGI is $120,000, so your allowance is $25,000 − 50% × $20,000 = $15,000. The whole $3,801 offsets your pay. As a single filer your taxable income lands in the 22% bracket, so that saves about $836.',
      ],
      result: 'Year one: $2,051 of cash, about $836 of tax saved and $1,711 of loan paid down, before any price change. Thin, but positive.',
    },
    mistakes: [
      'Counting rent as income without vacancy, repairs and big replacements. Those turn many “positive” deals negative.',
      'Treating price gains and loan paydown as cash. They do not pay for the roof when it leaks.',
      'Expecting rental losses to cut taxes on a high salary. Above $150,000 of MAGI the $25,000 allowance is gone unless you are a real estate professional.',
      'Forgetting recapture. The depreciation you deducted is taxed at up to 25% when you sell, so plan the exit, or a 1031 exchange, before you buy.',
    ],
    points: [
      'Judge a rental by cash flow after every cost and the mortgage, plus cap rate and cash-on-cash return.',
      'Budget vacancy, management, repairs and big-ticket reserves before you trust any deal.',
      'Depreciation on the building (27.5 years) can create a tax loss while you collect cash.',
      'The $25,000 loss allowance shrinks between $100,000 and $150,000 of MAGI; unused losses carry forward.',
      'At sale, depreciation is recaptured at up to 25%; a 1031 exchange defers the tax.',
    ],
    terms: ['Cap rate', 'Cash-on-cash return', 'Rental depreciation', 'Passive activity loss', 'Depreciation recapture', '1031 exchange'],
    glossary: [
      { t: 'NOI', full: 'Net operating income', d: 'Rent collected minus operating costs such as repairs, management, property tax and insurance, before the mortgage.' },
      { t: 'Real estate professional', d: 'IRS status for people who spend more than 750 hours and more than half their working time in real estate. Their rental losses can be non-passive.' },
    ],
    quiz: { q: 'Your MAGI is $160,000 and your rental shows a $6,000 tax loss. What happens to the loss this year?', options: ['It cuts the tax on your salary in full', 'It carries forward until you have passive income or sell', 'It is lost for good'], answer: 1, why: 'The $25,000 allowance is gone above $150,000 of MAGI, so the loss is suspended and carried forward.' },
    sources: [
      { t: 'IRS Publication 527: Residential Rental Property', u: 'https://www.irs.gov/publications/p527' },
      { t: 'IRS Publication 925: Passive Activity and At-Risk Rules', u: 'https://www.irs.gov/publications/p925' },
      { t: 'IRS Topic 409: Capital gains and losses (25% rate on depreciation)', u: 'https://www.irs.gov/taxtopics/tc409' },
      { t: 'IRS Instructions for Form 8824: Like-kind exchanges', u: 'https://www.irs.gov/pub/irs-pdf/i8824.pdf' },
    ],
  });

  SML.lessons.push({
    id: 'l-airbnb', course: 'home', order: 6, title: 'Airbnb: gross vs real revenue', mins: 10, level: 'Intermediate',
    summary: 'Fees, cleaning, managers, seasons and short-term rental tax rules.',
    idea: 'Gross bookings are not income. Fees, cleaning, management and the mortgage can eat most of it before tax.',
    widget: 'strCalc',
    try: 'Change the season, the manager fee and the tax chips, then switch to By month to see the slow season.',
    body: [
      '<p>A listing that “books $80,000 a year” can leave its owner with almost nothing. Short-term rentals earn more per night than long-term rentals, but they cost far more to run and are taxed by their own rules.</p>',
      '<h3>Why gross bookings mislead</h3><ul><li><b>Occupancy taxes</b> are paid by guests and passed on to the city or state. Airbnb collects and remits them in many places; where it does not, you must.</li><li><b>Cleaning fees</b> mostly pay the cleaner.</li><li><b>Platform fees:</b> since late 2025 Airbnb has moved US hosts to a <b>host-only fee</b> of about 15.5% of the booking subtotal (nightly price plus cleaning and other fees, not taxes). Guests then pay no separate Airbnb service fee. The older split fee charged hosts 3% and guests about 14% to 16.5%. Under the split fee a host kept 97% of the subtotal; under host-only it keeps 84.5%, so netting the same takes prices about 15% higher (0.97 ÷ 0.845). Guests end up paying about the same all-in, because they no longer pay the old 14% to 16.5% guest fee.</li><li>Vrbo charges its own commission and payment fees; check its current terms.</li></ul>',
      '<h3>The costs that eat the rest</h3><ul><li><b>Cleaning</b> after every stay, plus laundry and supplies (coffee, soap, paper goods).</li><li><b>Management:</b> full-service short-term managers commonly take 20% to 30% of revenue; co-hosts often less.</li><li><b>Utilities, internet and streaming</b>, which you pay instead of a tenant.</li><li><b>Insurance</b> that covers paying guests; a regular homeowners policy may not. Ask your insurer.</li><li><b>Furniture and replacements</b>, maintenance, software, permits, property tax and the mortgage.</li></ul>',
      '<h3>Seasons and occupancy</h3><p>AirDNA’s mid-2026 outlook put average US occupancy near 57%, about where it was before 2020. Beach and ski homes swing hard by season, while the mortgage, insurance and internet bills arrive every month. Plan with monthly numbers and a cash cushion, not the yearly average.</p>',
      '<h3>Check the rules before you buy</h3><p>Cities, counties and HOAs can require permits, cap the number of nights or ban whole-home rentals. New York City’s Local Law 18, enforced from September 2023, requires registration and a host living in the home, allows at most two guests and bans whole-unit stays under 30 days. Most of the city’s listings disappeared. Read local rules and HOA bylaws first.</p>',
      '<h3>How short-term rental income is taxed</h3><ul><li><b>14-day rule:</b> rent a home you use for <b>fewer than 15 days</b> a year and you report no rent and deduct no rental costs. Handy for a big local event.</li><li><b>Personal use:</b> use the place yourself more than the greater of 14 days or 10% of rented days and your rental deductions are limited to rental income.</li><li><b>7-day average stay:</b> if guests stay 7 days or less on average, it is not a “rental activity” under the passive rules. The $25,000 allowance does not apply, but if you <b>materially participate</b> (for example 500+ hours, or 100+ hours and more than anyone else, cleaners and managers included), losses can offset your pay. People call this the short-term rental loophole. Keep a dated hours log.</li><li><b>Cost segregation</b> moves part of the cost into 5-, 7- and 15-year parts. For homes bought and placed in service after January 19, 2025, 100% bonus depreciation lets you write those parts off in year one. It is a deferral: those deductions come back at ordinary rates when you sell. Some states do not follow bonus depreciation.</li><li><b>Hotel-like services</b> such as daily cleaning or meals make it a business on Schedule C with 15.3% self-employment tax. Cleaning between guests does not count.</li><li>Payment platforms send a 1099-K only above $20,000 and 200 transactions, but all rental income is taxable either way.</li></ul><p>Tax pros disagree on some short-term rental points. One example: some CPAs treat a home rented mostly by the night as nonresidential property, depreciated over 39 years instead of 27.5. For a $280,000 building that is $7,179 a year instead of $10,182. The IRS watches these returns closely, so use a CPA who handles them.</p>',
    ],
    example: {
      title: 'A beach house, first year',
      intro: 'Made-up numbers: a $350,000 house, 25% down at 7.4%, 220 nights at $300, guests stay 4 nights on average, a co-host takes 20% of nightly revenue.',
      steps: [
        'Nights earn 220 × $300 = $66,000 and 55 stays pay $125 cleaning fees ($6,875): a $72,875 subtotal. Guests also pay 12% occupancy tax ($8,745), so they pay $81,620 in total.',
        'Take off the tax you pass on, Airbnb’s 15.5% host fee ($11,296), cleaning at $110 a stay ($6,050) and the co-host’s 20% ($13,200). $42,329 is left.',
        'Supplies ($1,100), utilities and internet ($4,200), insurance ($2,400), property tax ($3,850), maintenance ($3,500) and a furniture reserve ($4,000) leave an operating profit of $23,279.',
        'The $262,500 loan costs $21,810 a year. Cash before tax: $1,469.',
        'For tax: $23,279 − $19,342 of first-year interest − $10,182 of depreciation (27.5 years; $7,179 if your CPA uses 39) = a $6,245 loss, treating maintenance and the furniture reserve as spent this year. Stays are short, but the co-host works more hours than you, so you likely fail material participation: the loss is passive and carries forward.',
      ],
      result: 'Guests paid $81,620. You keep about $1,469, less than $2 of every $100 booked.',
    },
    mistakes: [
      'Treating gross bookings, including occupancy taxes and cleaning fees, as your income.',
      'Counting on the short-term rental loophole while a manager or cleaner works more hours on the property than you do.',
      'Buying before checking permits, HOA rules and local caps. A ban can turn a rental into an empty second home.',
      'Forgetting that cost segregation is a deferral. The early deductions come back as recapture when you sell.',
    ],
    points: [
      'Follow the money from what guests pay down to what you keep; taxes and cleaning fees are not yours.',
      'A 15.5% host-only fee, cleaning and management can take half of revenue before the mortgage.',
      'Fixed costs run every month, so plan for the slow season, not the yearly average.',
      'Average stays of 7 days or less plus material participation can let losses offset your pay; keep an hours log and use a CPA.',
      'Rent your own home for 14 nights or fewer and the income is tax-free.',
    ],
    terms: ['Short-term rental', 'ADR', 'Occupancy rate', '14-day rule', 'Material participation', 'Cost segregation'],
    glossary: [
      { t: 'Host-only fee', d: 'Airbnb’s single service fee charged to the host, about 15.5% of the booking subtotal for most US hosts in 2026. Guests pay no separate service fee.' },
      { t: 'Occupancy tax', d: 'A local hotel-style tax on short stays. Guests pay it and it is passed on to the city, county or state.' },
    ],
    quiz: { q: 'Guests stay 4 nights on average, and a co-host works more hours on the property than you. Can the tax loss offset your salary?', options: ['Yes, any average stay of 7 days or less qualifies', 'Probably not: you likely fail material participation, so the loss is passive', 'Yes, as long as you use cost segregation'], answer: 1, why: 'Short stays only remove the “rental” label. You still need material participation, and the 100-hour test fails if someone else works more hours than you.' },
    sources: [
      { t: 'Airbnb Help: Airbnb service fees', u: 'https://www.airbnb.com/help/article/1857' },
      { t: 'Airbnb Help: Occupancy tax collection and remittance', u: 'https://www.airbnb.com/help/article/654/what-is-occupancy-tax--do-i-need-to-collect-or-pay-it' },
      { t: 'IRS Topic 415: Renting residential and vacation property', u: 'https://www.irs.gov/taxtopics/tc415' },
      { t: 'IRS Publication 925: Passive Activity and At-Risk Rules', u: 'https://www.irs.gov/publications/p925' },
    ],
  });

  SML.lessons.push({
    id: 'l-smart-leverage', course: 'debt', order: 5, title: 'Leverage the smart way', mins: 9, level: 'Intermediate',
    summary: 'Good debt and bad, margin calls, leveraged ETFs and paying off a mortgage early.',
    idea: 'Borrowing magnifies results both ways. Use cheap, fixed debt nobody can call in, for things that last, and never borrow to spend.',
    widget: 'leverageLab',
    try: 'Compare the debts, then open Margin call and drag the market drop until the call hits.',
    body: [
      '<p>Leverage means owning more than your own money could buy. If you put $80,000 down on a $400,000 home, a 4% price rise is $16,000, which is 20% on your money. A 10% price fall wipes out half of it. The same tool that builds wealth can also force you to sell at the worst moment.</p>',
      '<h3>A smart-leverage checklist</h3><ul><li>It costs less, after tax, than what the asset is likely to earn, with room to spare.</li><li>The rate is <b>fixed</b> and the term is long.</li><li>Nobody can <b>call it in</b> or sell your assets when prices fall.</li><li>It buys something that lasts or earns (a home, skills, a business), not a vacation. A car loses value, so borrow for one only when a dealer promo rate is below what your cash earns after tax (see <a href="#l-car-cash">cash or loan</a>).</li><li>You could still make the payment if your income dropped, and you keep an <a href="#l-emergency">emergency fund</a>.</li></ul>',
      '<h3>Kinds of borrowing, compared</h3><ul><li><b>Fixed-rate mortgage:</b> the classic good debt. Long, fixed and impossible to call in while you pay. The 30-year average was 7.40% in mid-October 2026. The interest is deductible only if you itemize, and only about one household in ten does.</li><li><b>HELOC:</b> a variable-rate line of credit on your home. The lender can freeze or cut the line if your finances or home value drop, and missed payments put the house at risk. Interest is deductible only if the money buys, builds or substantially improves that home.</li><li><b>Margin loan:</b> a loan from your broker against your investments. Federal rules let you borrow up to 50% of a purchase; you must keep at least 25% equity after that, and most brokers require 30% to 40%. The broker can sell your shares without asking, and you can lose more than you put in.</li><li><b>Securities-based line of credit (SBLOC):</b> borrows against a portfolio for anything except buying more securities. It is variable-rate and the lender can demand more collateral within days or sell your holdings without notice.</li><li><b>401(k) loan:</b> up to the lesser of $50,000 or half your vested balance, repaid within five years. The interest goes back into your account, so the real cost is the growth you miss. If you leave your job, the plan usually cancels the loan against your balance (a “loan offset”). To avoid tax, deposit that amount into an IRA or another plan by your tax-return due date, including extensions; otherwise it is a taxable distribution, possibly with a 10% penalty.</li><li><b>Credit cards:</b> about 22% for people who carry a balance. Never borrow at that rate to invest. See <a href="#l-card-debt">getting out of card debt</a>.</li></ul>',
      '<h3>Leveraged ETFs reset every day</h3><p>A 2× or 3× fund aims to double or triple an index’s move for <b>one day</b>. Over months, the daily reset makes it drift away from 2× or 3× the index, most of all in choppy markets. In an SEC and FINRA example, an index rose 2% over four months while a 2× fund on it fell 6%.</p>',
      '<h3>“Buy, borrow, die”</h3><p>Wealthy families often borrow against stock they have held for decades instead of selling and paying capital gains tax. When they die, heirs get a step-up in basis and the untaxed gain disappears. It works only with a large taxable portfolio and survives only if a crash does not trigger calls on the loan while rates rise.</p>',
      '<h3>Should you pay off the mortgage early?</h3><p>Every extra dollar you pay earns a guaranteed return equal to the mortgage rate (after tax, if you itemize). Compare that with what safe money earns after tax: a 3-month Treasury bill yielded about 4.26% before tax in October 2026, roughly 3.3% after 22% federal tax (T-bills are free of state tax). A 3% mortgage is cheap to keep; a 7.4% mortgage is expensive to keep. Do it in order: a starter cushion of $500 to $1,000, the full <a href="#l-401k-match">401(k) match</a>, high-interest debt, a full 3- to 6-month <a href="#l-emergency">emergency fund</a>, then HSA and IRA, maxing the 401(k) and taxable investing (<a href="#l-ira">saving order</a>). Extra mortgage payments compete with those last steps. Money paid into a house is hard to get back out.</p>',
    ],
    example: {
      title: 'A margin call, step by step',
      intro: 'Made-up numbers: $50,000 of your own money plus $50,000 borrowed on margin buys $100,000 of stock. The broker requires 30% equity.',
      steps: [
        'The market falls 20%. The stock is worth $80,000, the loan is still $50,000, so your equity is $30,000. Your own money is down 40%, twice the market’s fall.',
        'The call comes when equity drops below 30% of the account: when the account falls under $50,000 ÷ 0.7 = $71,429. That is a 28.6% market drop.',
        'The market falls 35%. The account is worth $65,000 and your equity is $15,000, only 23%. The broker needs 30% × $65,000 = $19,500, so it calls for $4,500.',
        'You cannot add cash in time, so the broker sells shares near the low. Your $50,000 is now $15,000, a 70% loss locked in.',
        'Without margin, the same drop takes $50,000 to $32,500. Painful, but nobody can force you to sell, and you can wait for a recovery.',
      ],
      result: 'The same 35% crash cost 35% without margin and 70% with it, plus a forced sale.',
    },
    mistakes: [
      'Using margin or an SBLOC for a long-term bet. The lender can call the loan or sell your shares at the bottom.',
      'Moving card debt to a HELOC, then running the cards up again. Now the house backs the debt.',
      'Holding a 2× or 3× leveraged ETF for months and expecting 2× or 3× the index return.',
      'Rushing to prepay a cheap mortgage before you get the full 401(k) match, clear card debt and build an emergency fund.',
    ],
    points: [
      'Smart leverage is cheap after tax, fixed, long term and cannot be called in.',
      'Margin, SBLOCs and HELOCs can be called, frozen or sold out from under you in a crash.',
      'Leverage multiplies losses: a 20% drop with half the money borrowed costs 40% of yours.',
      'Leveraged ETFs track one day; held for long, they drift far from 2× or 3× the index.',
      'Prepaying a mortgage earns its after-tax rate, guaranteed; compare it with safe after-tax yields once the match, high-interest debt and a full emergency fund are handled.',
    ],
    terms: ['Leverage', 'Margin call', 'Margin account', 'SBLOC', 'HELOC', 'Step-up in basis'],
    glossary: [
      { t: 'Leveraged ETF', d: 'A fund that aims for 2 or 3 times an index’s move for a single day, using borrowed money or derivatives.' },
      { t: 'Maintenance requirement', d: 'The minimum share of a margin account that must be your own equity. Fall below it and you get a margin call.' },
    ],
    quiz: { q: 'You add $50,000 borrowed on margin to $50,000 of your own and buy stock. The market falls 20%. How much of your own money is gone?', options: ['20%', '40%', '10%'], answer: 1, why: 'The $100,000 position loses $20,000, and all of that comes out of your $50,000: 40%.' },
    sources: [
      { t: 'Investor.gov: Understanding margin accounts', u: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-29' },
      { t: 'FINRA: Securities-backed lines of credit', u: 'https://www.finra.org/investors/insights/securities-backed-lines-credit' },
      { t: 'CFPB: What is a HELOC?', u: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-line-of-credit-heloc-en-107/' },
      { t: 'IRS: Retirement topics, plan loans', u: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-loans' },
    ],
  });
})();
