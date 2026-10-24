/* Stock Market Lessons: Retirement Accounts part 1 (Roth vs traditional, IRA and saving order, backdoor Roth). Fork W7. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const usd = (v) => F.usd(Math.round(v), 0);
  const k$ = (v) => { const a = Math.abs(v); const s = v < 0 ? F.minus : ''; if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, '') + 'M'; if (a >= 1e4) return s + '$' + Math.round(a / 1e3) + 'K'; if (a >= 1e3) return s + '$' + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return s + '$' + Math.round(a); };

  /* 2026 IRS figures (IRS news release, Nov 2025; Rev. Proc. 2025-19 for HSA) */
  const L = {
    ira: 7500, iraCatch: 1100,
    k401: 24500, catch50: 8000, catch6063: 11250, total415: 72000,
    hsaSelf: 4400, hsaFam: 8750, hsaCatch: 1000,
    roth: { single: [153000, 168000], mfj: [242000, 252000] },
  };

  SML.css(`
.wa-ctrl{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.wa-ctrl .wa-wide{grid-column:1/-1}
.wa-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.wa-row .lab{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.wa-fields{display:grid;gap:12px 16px;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));padding:16px 18px 0}
.wa-segs{display:flex;flex-direction:column;gap:12px;padding:14px 18px 4px}
.wa-segs .seg{flex-wrap:wrap}
.wa-steps{list-style:none;display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));padding:14px 16px;background:var(--surface)}
.wa-steps li{border:1px solid var(--line);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0;transition:border-color .2s,background-color .2s;cursor:pointer}
.wa-steps li b{font:600 10.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.wa-steps li span{font-size:13.5px;line-height:1.4;color:color-mix(in srgb,var(--ink) 85%,transparent)}
.wa-steps li.on{border-color:var(--accent);background:var(--accent-t)}
.wa-steps li.on b{color:var(--accent)}
@media (max-width:560px){.wa-steps{grid-template-columns:repeat(2,minmax(0,1fr));padding:12px}.wa-steps li{padding:8px 10px}.wa-steps li span{display:none}}
`);

  /* future value of C paid at the start of each year for n years at rate r */
  const fvf = (r, n) => (r === 0 ? n : ((Math.pow(1 + r, n) - 1) / r) * (1 + r));

  /* ======================================================================
     1. rothVsTrad: same savings, taxed now or later
     ====================================================================== */
  function rothCalc(C, tN, tR, N, r, invest) {
    const f = fvf(r, N), bal = C * f;
    const roth = bal;
    const tradNet = bal * (1 - tR), irs = bal * tR;
    let side = 0, sideTax = 0;
    if (invest) { const s = C * tN, sb = s * f, gain = sb - s * N; sideTax = Math.max(0, gain) * 0.15; side = sb - sideTax; }
    const trad = tradNet + side;
    const breakEven = invest ? side / bal : 0;
    return { bal, roth, tradNet, irs, side, trad, breakEven, saving: C * tN };
  }

  SML.widgets.rothVsTrad = function (root) {
    const id = SML.uid('rvt');
    const presets = {
      early: { label: 'Early career', C: 6000, now: 12, later: 22, N: 38, r: 7 },
      peak: { label: 'Peak earner', C: 24500, now: 32, later: 22, N: 15, r: 7 },
      same: { label: 'Same rate', C: 7500, now: 22, later: 22, N: 30, r: 7 },
    };
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Tax now or tax later</span>${ui.seg(id + '-p', Object.keys(presets).map((k) => ({ v: k, label: presets[k].label })), 'early', 'Example saver')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl wa-ctrl">
        ${ui.slider({ id: id + '-c', label: 'Saved each year', min: 500, max: 30000, step: 500, value: 6000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-n', label: 'Tax rate now', min: 0, max: 45, step: 1, value: 12, fmt: 'pct' })}
        ${ui.slider({ id: id + '-l', label: 'Tax rate in retirement', min: 0, max: 45, step: 1, value: 22, fmt: 'pct' })}
        ${ui.slider({ id: id + '-y', label: 'Years until you retire', min: 1, max: 45, step: 1, value: 38, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-r', label: 'Yearly return', min: 0, max: 10, step: 0.5, value: 7, fmt: 'pct1' })}
        <div class="wa-row wa-wide"><span class="lab">Traditional saver</span>${ui.seg(id + '-i', [{ v: 'yes', label: 'Invests the tax saving' }, { v: 'no', label: 'Spends the tax saving' }], 'yes', 'What the traditional saver does with the tax saving')}</div>
      </div>
      <div class="wg-read">${ui.stat('Roth: yours to spend', id + '-sr', 'hl')}${ui.stat('Traditional: after tax', id + '-st')}${ui.stat('Roth minus traditional', id + '-sd')}${ui.stat('Break-even later rate', id + '-sb')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-note">Drag the two dots on the tax ruler, or use the sliders. The small diamond on the ruler marks the retirement rate at which both tie. Rates are your marginal rate (federal plus state). Money goes in at the start of each year. The traditional saver's yearly tax saving is invested in a taxable account and its gains are taxed at 15% at the end. Both accounts have the same yearly limit in real life, so at the limit a Roth shelters more.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest('.seg');
      if (seg && seg.id === id + '-p') { const p = presets[st.seg(id + '-p')]; st.set(id + '-c', p.C); st.set(id + '-n', p.now); st.set(id + '-l', p.later); st.set(id + '-y', p.N); st.set(id + '-r', p.r); }
      else if (!seg || seg.id !== id + '-i') st.setSeg(id + '-p', '');
      draw();
    });
    let geo = null;
    ui.drag(fig, {
      sel: '.handle', start: (pt, t) => { geo && (geo.k = t.dataset.k); },
      move: (pt) => {
        if (!geo || !geo.k) return;
        const v = Math.round(SML.clamp(geo.vert ? geo.rate.inv(pt.y) : geo.rate.inv(pt.x), 0, 45));
        st.set(id + (geo.k === 'now' ? '-n' : '-l'), v); st.setSeg(id + '-p', ''); draw();
      },
    });
    const draw = ui.responsive(fig, (W) => {
      const C = st.n(id + '-c'), tN = st.n(id + '-n') / 100, tR = st.n(id + '-l') / 100, N = st.n(id + '-y'), r = st.n(id + '-r') / 100, inv = st.seg(id + '-i') !== 'no';
      const o = rothCalc(C, tN, tR, N, r, inv);
      const wide = W >= 600;
      let b = '';
      const H = wide ? 244 : 392;
      // tax ruler
      let rate;
      if (wide) {
        const x0 = 70, top = 44, bot = H - 22; rate = SML.lin(0, 45, bot, top);
        b += S.text(x0, 22, 'TAX RATE', 'cap', 'middle');
        b += S.line(x0, top, x0, bot, 's-line w2');
        [0, 10, 20, 30, 40].forEach((v) => { b += S.line(x0 - 5, rate(v), x0 + 5, rate(v), 's-mut') + S.text(x0 - 10, rate(v) + 4, v + '%', 'xs mono', 'end'); });
        const yn = rate(tN * 100), yl = rate(tR * 100);
        b += S.line(x0, yn, x0, yl, (tR > tN ? 's-dn' : tR < tN ? 's-up' : 's-mut') + ' w4');
        let ln = yn, ll = yl;
        if (Math.abs(yn - yl) < 18) { const mid = (yn + yl) / 2, up = yn <= yl; ln = mid + (up ? -9 : 9); ll = mid + (up ? 9 : -9); if (yn === yl) { ln = mid - 9; ll = mid + 9; } }
        b += S.text(x0 + 16, ln + 4, 'now ' + Math.round(tN * 100) + '%', 'md b acc') + S.text(x0 + 16, ll + 4, 'later ' + Math.round(tR * 100) + '%', 'md b info');
        b += S.circle(x0, yn, 9, 'handle', ' data-k="now"') + S.circle(x0, yl, 9, 'handle', ' data-k="later"');
        geo = { vert: true, rate, k: geo && geo.k };
      } else {
        const y0 = 46, x0 = 30, x1 = W - 30; rate = SML.lin(0, 45, x0, x1);
        b += S.text(x0, 18, 'TAX RATE', 'cap');
        b += S.line(x0, y0, x1, y0, 's-line w2');
        [0, 15, 30, 45].forEach((v) => { b += S.line(rate(v), y0 - 5, rate(v), y0 + 5, 's-mut') + S.text(rate(v), y0 + 22, v + '%', 'xs mono', 'middle'); });
        const xn = rate(tN * 100), xl = rate(tR * 100);
        b += S.line(xn, y0, xl, y0, (tR > tN ? 's-dn' : tR < tN ? 's-up' : 's-mut') + ' w4');
        const close = Math.abs(xn - xl) < 70;
        b += S.text(xn, y0 - 14, 'now', 'sm b acc', 'middle') + S.text(xl, close ? y0 + 36 : y0 - 14, 'later', 'sm b info', 'middle');
        b += S.circle(xn, y0, 9, 'handle', ' data-k="now"') + S.circle(xl, y0, 9, 'handle', ' data-k="later"');
        geo = { vert: false, rate, k: geo && geo.k };
      }
      // bars
      const bx0 = wide ? 200 : 16, bx1 = W - 16, by0 = wide ? 30 : 108;
      const max = Math.max(o.roth, o.tradNet + o.irs + o.side) * 1.02 || 1;
      const xs = SML.lin(0, max, bx0, bx1);
      const bh = wide ? 50 : 40, gap = wide ? 86 : 92;
      const rowLab = (y, t, sub) => S.text(bx0, y - 10, t, 'md b ink') + (sub ? S.text(bx1, y - 10, sub, 'sm mono', 'end') : '');
      // Roth row
      let y = by0 + 16;
      b += rowLab(y, 'Roth', 'pay tax now, nothing later');
      b += S.rect(bx0, y, xs(o.roth) - bx0, bh, 'f-up', 3);
      const rothLbl = 'yours ' + k$(o.roth);
      b += (xs(o.roth) - bx0 > 110 ? S.text(bx0 + 10, y + bh / 2 + 5, rothLbl, 'md b on') : S.text(xs(o.roth) + 8, y + bh / 2 + 5, rothLbl, 'md b up'));
      // Traditional row
      y += gap;
      b += rowLab(y, 'Traditional', 'skip tax now, pay later');
      const xa = xs(o.tradNet), xb = xs(o.tradNet + o.irs);
      b += S.rect(bx0, y, xa - bx0, bh, 'f-up', 3) + S.rect(xa, y, xb - xa, bh, 'f-dn-t s-dn w15', 0);
      if (o.side > 0) b += S.rect(xb, y, xs(o.tradNet + o.irs + o.side) - xb, bh, 'f-info', 0);
      if (xa - bx0 > 90) b += S.text(bx0 + 10, y + bh / 2 + 5, 'yours ' + k$(o.tradNet), 'md b on');
      if (xb - xa > 64) b += S.text((xa + xb) / 2, y + bh / 2 + 5, 'tax ' + k$(o.irs), 'sm b dn', 'middle');
      // legend under traditional row
      const ly = y + bh + 20;
      let lx = bx0, lyy = ly;
      const leg = (cls, t) => { const w = 22 + t.length * 6.2; if (lx + w > bx1 + 4 && lx > bx0) { lx = bx0; lyy += 20; } const s = S.rect(lx, lyy - 9, 11, 11, cls, 2) + S.text(lx + 16, lyy, t, 'sm'); lx += w; return s; };
      b += leg('f-up', 'you keep') + leg('f-dn-t s-dn', 'income tax later');
      if (o.side > 0) b += leg('f-info', 'invested tax saving ' + k$(o.side));
      // break-even marker on ruler
      if (inv) {
        const be = o.breakEven * 100;
        const dm = (cx, cy) => S.polygon([[cx, cy - 6], [cx + 6, cy], [cx, cy + 6], [cx - 6, cy]], 'f-ink s-surf w15');
        b += wide ? dm(70, rate(be)) : dm(rate(be), 46);
      }
      fig.innerHTML = S.wrap(W, H, `Roth ends with ${usd(o.roth)} to spend; traditional ends with ${usd(o.trad)} after tax`, b, 'drag');
      const d = o.roth - o.trad;
      sv(id + '-sr', usd(o.roth), 'up'); sv(id + '-st', usd(o.trad), o.trad >= o.roth ? 'up' : '');
      sv(id + '-sd', F.susd(Math.round(d), 0), Math.abs(d) < o.roth * 0.01 ? '' : d > 0 ? 'up' : 'info');
      sv(id + '-sb', inv ? F.pct(o.breakEven * 100, 1) : 'n/a');
      const m = $id(id + '-m');
      if (!inv) m.innerHTML = ui.msg('dn', 'Not fair', `The traditional saver spends the ${usd(o.saving)} yearly tax saving, so Roth wins at any retirement rate above 0%. Invest the saving or the deduction is wasted.`);
      else if (Math.abs(d) < o.roth * 0.01) m.innerHTML = ui.msg('acc', 'About a tie', `When your rate later is close to your rate now, both end up near ${usd(o.roth)}. Splitting between them (tax diversification) keeps your options open.`);
      else if (d > 0) m.innerHTML = ui.msg('up', 'Roth wins', `Roth leaves ${usd(d)} more because you pay ${Math.round(tN * 100)}% on the way in instead of ${Math.round(tR * 100)}% on the way out. Lower rate now than later points to Roth.`);
      else m.innerHTML = ui.msg('info', 'Traditional wins', `Traditional leaves ${usd(-d)} more: you skip ${Math.round(tN * 100)}% now and pay ${Math.round(tR * 100)}% later. It only works if the ${usd(o.saving)} you save in tax each year gets invested.`);
    });
    st.setSeg(id + '-p', 'early');
  };

  /* ======================================================================
     2. savingsOrder: where does my next dollar go?
     ====================================================================== */
  function rothRoom(magi, status, limit) {
    const [lo, hi] = L.roth[status];
    if (magi <= lo) return { direct: limit, mode: 'direct' };
    if (magi >= hi) return { direct: 0, mode: 'backdoor' };
    let a = limit * (1 - (magi - lo) / (hi - lo));
    a = Math.ceil(a / 10) * 10; if (a > 0 && a < 200) a = 200;
    return { direct: Math.min(limit, a), mode: 'partial' };
  }
  function planOrder(o) {
    const age = o.age;
    const catch401 = age === '60-63' ? L.catch6063 : age === '50-54' || age === '55-59' || age === '64+' ? L.catch50 : 0;
    const iraOne = L.ira + (age === 'u50' ? 0 : L.iraCatch);
    const nIRA = o.married && o.spouse ? 2 : 1;
    const deferMax = L.k401 + catch401;
    const [mRate, mUpTo] = { none: [0, 0], '50-6': [0.5, 0.06], '100-4': [1, 0.04], '100-6': [1, 0.06] }[o.match];
    const toMatch = Math.min(o.salary * mUpTo, deferMax);
    const hsaLim = o.hsa ? (o.family ? L.hsaFam : L.hsaSelf) + (age === '55-59' || age === '60-63' || age === '64+' ? L.hsaCatch : 0) : 0;
    const ira = rothRoom(o.house, o.married ? 'mfj' : 'single', iraOne);
    let left = o.save;
    const take = (room) => { const a = Math.max(0, Math.min(left, room)); left -= a; return a; };
    const steps = [];
    const starter = Math.min(o.ef, 1000), fullEf = Math.max(0, o.ef - starter);
    steps.push({ k: 'ef', t: 'Starter cushion', room: starter, a: take(starter), cls: 'f-info', note: starter ? 'about $1,000 in cash' : 'already built' });
    const m1 = take(toMatch);
    steps.push({ k: 'match', t: '401(k) to the full match', room: toMatch, a: m1, cls: 'f-acc', extra: m1 * mRate, note: mRate ? `+${k$(m1 * mRate)} free match` : 'no match offered' });
    steps.push({ k: 'debt', t: 'High-interest debt', room: o.debt, a: take(o.debt), cls: 'f-dn', note: o.debt ? 'a sure 20%+ return' : 'none' });
    steps.push({ k: 'ef2', t: 'Full emergency fund', room: fullEf, a: take(fullEf), cls: 'f-info', note: fullEf ? '3–6 months of costs' : 'already built' });
    steps.push({ k: 'hsa', t: 'HSA', room: hsaLim, a: take(hsaLim), cls: 'f-vio', note: o.hsa ? 'triple tax break' : 'not eligible' });
    const iraRoom = iraOne * nIRA;
    const iraT = ira.mode === 'direct' ? 'Roth IRA' : ira.mode === 'partial' ? 'Roth IRA (part backdoor)' : 'Backdoor Roth IRA';
    steps.push({ k: 'ira', t: iraT + (nIRA === 2 ? ' ×2' : ''), room: iraRoom, a: take(iraRoom), cls: 'f-up', note: ira.mode === 'direct' ? 'tax-free growth' : ira.mode === 'partial' ? `direct up to ${k$(ira.direct)} each` : 'income above the Roth limit' });
    const rest = Math.max(0, deferMax - m1);
    steps.push({ k: 'max', t: 'Rest of the 401(k)', room: rest, a: take(rest), cls: 'f-acc', note: `limit ${k$(deferMax)}` });
    const used415 = Math.min(L.k401, m1 + steps.find((x) => x.k === 'max').a) + m1 * mRate; // catch-ups do not count toward 415(c)
    const megaRoom = o.mega ? Math.max(0, L.total415 - used415) : 0;
    steps.push({ k: 'mega', t: 'Mega backdoor Roth', room: megaRoom, a: take(megaRoom), cls: 'f-up', note: o.mega ? 'after-tax, then convert' : 'plan does not allow' });
    steps.push({ k: 'tax', t: 'Taxable brokerage', room: Math.max(left, 0), a: take(left), cls: 'f-ink', note: 'no limits, no tax break' });
    return { steps, match: m1 * mRate, maxMatch: toMatch * mRate, ira, catch401, iraOne };
  }

  SML.widgets.savingsOrder = function (root) {
    const id = SML.uid('so');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Where your next dollar goes</span></div>
      <div class="wa-fields">
        ${ui.field({ id: id + '-sal', label: 'Your salary', value: 85000, step: 1000, min: 0 })}
        <div id="${id}-spw" hidden>${ui.field({ id: id + '-sp', label: 'Spouse\'s salary', value: 60000, step: 1000, min: 0 })}</div>
        ${ui.field({ id: id + '-ef', label: 'Emergency fund still to build (to 3–6 months)', value: 0, step: 500, min: 0 })}
        ${ui.field({ id: id + '-debt', label: 'Card debt and loans above 8%', value: 0, step: 500, min: 0 })}
      </div>
      <div class="wa-segs">
        <div class="wa-row"><span class="lab">Filing</span>${ui.seg(id + '-fs', [{ v: 's', label: 'Single' }, { v: 'm', label: 'Married, jointly' }], 's', 'Filing status')}</div>
        <div class="wa-row"><span class="lab">Age</span>${ui.seg(id + '-age', [{ v: 'u50', label: 'Under 50' }, { v: '50-54', label: '50–54' }, { v: '55-59', label: '55–59' }, { v: '60-63', label: '60–63' }, { v: '64+', label: '64+' }], 'u50', 'Age')}</div>
        <div class="wa-row"><span class="lab">401(k) match</span>${ui.seg(id + '-m', [{ v: 'none', label: 'None' }, { v: '50-6', label: '50% of 6%' }, { v: '100-4', label: '100% of 4%' }, { v: '100-6', label: '100% of 6%' }], '50-6', 'Employer match')}</div>
        ${ui.chips(id + '-ch', [{ k: 'hsa', label: 'HSA-eligible health plan', color: 'var(--violet)', on: true }, { k: 'fam', label: 'Family coverage', color: 'var(--violet)' }, { k: 'mega', label: 'Plan allows mega backdoor', color: 'var(--up)' }, { k: 'sp', label: 'Fund a spousal IRA too', color: 'var(--up)' }])}
      </div>
      <div class="wg-ctrl wa-ctrl">${ui.slider({ id: id + '-s', label: 'You can save each month', min: 100, max: 10000, step: 50, value: 1500, fmt: 'usd0' })}</div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Free match captured', id + '-a', 'hl')}${ui.stat('Into tax-advantaged accounts', id + '-b')}${ui.stat('Taxable brokerage', id + '-c')}${ui.stat('Savings rate', id + '-d')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">2026 limits: 401(k) ${usd(L.k401)} (+${usd(L.catch50)} at 50+, +${usd(L.catch6063)} at 60–63), IRA ${usd(L.ira)} (+${usd(L.iraCatch)} at 50+), HSA ${usd(L.hsaSelf)} self or ${usd(L.hsaFam)} family (+${usd(L.hsaCatch)} at 55+), total 401(k) additions ${usd(L.total415)}. Roth IRA eligibility uses modified AGI; this uses your salary (plus your spouse\'s if married), and pre-tax 401(k) and HSA money lowers the number the IRS checks. Payroll dollars into a pre-tax 401(k) or HSA cost less take-home than shown. A working spouse has a 401(k) of their own.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const num = (k, d) => { const v = st.n(id + k); return isFinite(v) && v >= 0 ? v : d; };
    const draw = ui.responsive(fig, (W) => {
      const married = st.seg(id + '-fs') === 'm';
      $id(id + '-spw').hidden = !married;
      const house = num('-sal', 0) + (married ? num('-sp', 0) : 0);
      const o = { salary: num('-sal', 0), house, ef: num('-ef', 0), debt: num('-debt', 0), save: st.n(id + '-s') * 12, married, age: st.seg(id + '-age'), match: st.seg(id + '-m'), hsa: st.on(id + '-ch', 'hsa'), family: st.on(id + '-ch', 'fam'), mega: st.on(id + '-ch', 'mega'), spouse: st.on(id + '-ch', 'sp') };
      const p = planOrder(o), steps = p.steps;
      const narrow = W < 520;
      const rowH = narrow ? 52 : 40, top = 30, labW = narrow ? 0 : 196;
      const rh = (s) => (narrow && s.room <= 0 ? 30 : rowH);
      const ys = []; let acc = top; steps.forEach((s) => { ys.push(acc); acc += rh(s); });
      const H = acc + 10;
      const x0 = narrow ? 34 : 34 + labW, x1 = W - (narrow ? 14 : 92);
      const max = Math.max(o.save, ...steps.map((s) => Math.min(s.room, o.save * 1.2) + (s.extra || 0)), 1);
      const xs = SML.lin(0, max, x0, x1);
      let b = S.text(14, 16, (narrow ? '' : 'IN ORDER, EACH YEAR · ') + usd(o.save) + (narrow ? ' A YEAR, IN ORDER' : ' TO PLACE'), 'cap');
      let firstOpen = -1;
      steps.forEach((s, i) => {
        const y = ys[i];
        const by = narrow ? y + 22 : y + 8, bh = narrow ? 18 : 20;
        const room = Math.min(s.room, max), filled = s.a;
        const dim = s.room <= 0;
        if (firstOpen < 0 && s.room > 0 && s.a < s.room - 0.5) firstOpen = i;
        b += S.badge(18, narrow ? y + 10 : y + 18, String(i + 1), dim ? 'f-shade2' : filled > 0 ? 'f-acc' : 'f-mut');
        b += S.text(narrow ? 34 : 34, narrow ? y + 14 : y + 22, s.t, 'md b ' + (dim ? 'mut' : 'ink'));
        if (!narrow) b += S.text(34, y + 36, s.note, 'xs');
        if (!dim) b += S.rect(x0, by, Math.max(2, xs(room) - x0), bh, 'f-shade2', 3);
        if (filled > 0) b += S.rect(x0, by, Math.max(2, xs(filled) - x0), bh, s.cls, 3);
        if (s.extra > 0) b += S.rect(xs(filled), by, xs(filled + s.extra) - xs(filled), bh, 'f-up-t s-up w15', 0);
        const lbl = dim ? 'n/a' : usd(filled);
        if (narrow) b += S.text(W - 14, y + 14, lbl, 'sm mono ' + (filled > 0 ? 'ink b' : 'mut'), 'end');
        else b += S.text(x1 + 8, by + 15, filled > 0 ? usd(filled) : dim ? '—' : '$0', 'sm mono ' + (filled > 0 ? 'ink b' : 'mut'));
        if (!narrow && s.extra > 0 && xs(filled + s.extra) + 6 < x1 - 90) b += S.text(xs(filled + s.extra) + 6, by + 15, '+' + k$(s.extra) + ' match', 'sm b up');
      });
      fig.innerHTML = S.wrap(W, H, 'Your yearly savings poured into accounts in order: ' + steps.filter((s) => s.a > 0).map((s) => s.t + ' ' + usd(s.a)).join(', '), b);
      const adv = steps.filter((s) => s.k !== 'tax' && s.k !== 'ef' && s.k !== 'ef2' && s.k !== 'debt').reduce((a, s) => a + s.a, 0) + p.match;
      sv(id + '-a', usd(p.match), p.match >= p.maxMatch - 0.5 && p.maxMatch > 0 ? 'up' : p.maxMatch > 0 ? 'dn' : '');
      sv(id + '-b', usd(adv)); sv(id + '-c', usd(steps.find((x) => x.k === 'tax').a));
      sv(id + '-d', o.house > 0 ? F.pct((o.save / o.house) * 100, 0) : '—');
      const m = $id(id + '-msg');
      const lost = p.maxMatch - p.match;
      if (lost > 0.5) m.innerHTML = ui.msg('dn', 'Free money missed', `You leave ${usd(lost)} a year of employer match on the table. Get to the full match before anything except a starter emergency fund.`);
      else if (firstOpen >= 0 && steps[firstOpen].k !== 'tax') { const s = steps[firstOpen]; m.innerHTML = ui.msg('acc', 'Next dollar', `Your next dollar goes to step ${firstOpen + 1}, ${s.t.toLowerCase()}, which still has ${usd(s.room - s.a)} of room${p.ira.mode !== 'direct' && s.k === 'ira' ? '. Your income is in or above the Roth range, so use the backdoor' : ''}.`); }
      else m.innerHTML = ui.msg('up', 'Every box filled', `Every tax-advantaged account is full. The extra ${usd(steps.find((x) => x.k === 'tax').a)} goes to a taxable brokerage account, where low-cost index funds are still a great home.`);
    });
  };

  /* ======================================================================
     3. backdoorRoth: steps and the pro-rata rule
     ====================================================================== */
  SML.widgets.backdoorRoth = function (root) {
    const id = SML.uid('bdr');
    const STEPS = [
      ['Overview', 'Income above the Roth limit? Go through a traditional IRA.'],
      ['1 · Contribute', 'Put after-tax money in a traditional IRA. Take no deduction.'],
      ['2 · Convert', 'Move it to your Roth IRA. Only pre-tax money is taxed.'],
      ['3 · Form 8606', 'Report the after-tax basis and the conversion with your return.'],
    ];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Backdoor Roth and the pro-rata rule</span>${ui.chips(id + '-fix', [{ k: 'roll', label: 'Fix: roll IRA into 401(k) first', color: 'var(--up)' }])}</div>
      <ol class="wa-steps" id="${id}-st">${STEPS.map((s, i) => `<li data-i="${i}" class="${i ? '' : 'on'}"><b>${s[0]}</b><span>${s[1]}</span></li>`).join('')}</ol>
      <div class="wg-fig"></div>
      <div class="wg-ctrl wa-ctrl">
        ${ui.slider({ id: id + '-c', label: 'After-tax contribution (2026)', min: 1000, max: L.ira + L.iraCatch, step: 100, value: L.ira, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-p', label: 'Pre-tax IRA money on Dec 31', min: 0, max: 300000, step: 1000, value: 45000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-t', label: 'Your tax rate', min: 10, max: 37, step: 1, value: 24, fmt: 'pct' })}
      </div>
      <div class="wg-read">${ui.stat('Taxable share', id + '-s1', 'hl')}${ui.stat('Tax due on conversion', id + '-s2')}${ui.stat('Lands in Roth', id + '-s3')}${ui.stat('Basis left behind', id + '-s4')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" id="${id}-b">Back</button><button type="button" class="btn btn-p sm" id="${id}-n">Next step</button><button type="button" class="btn btn-g sm" id="${id}-play">Play the steps</button></div>
      <div class="wg-note">Pre-tax IRA money means every traditional, rollover, SEP and SIMPLE IRA in your name on December 31 of the year you convert. 401(k)s, inherited IRAs and Roth IRAs don't count, and a spouse's IRAs are checked separately. Assumes you convert exactly what you put in, before it earns anything.</div>`;
    const fig = root.querySelector('.wg-fig');
    let step = 0, timer = null;
    const st = ui.wire(root, () => draw());
    const setStep = (i) => { step = (i + STEPS.length) % STEPS.length; root.querySelectorAll('.wa-steps li').forEach((li, j) => li.classList.toggle('on', j === step)); draw(); };
    $id(id + '-st').addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) { stop(); setStep(Number(li.dataset.i)); } });
    $id(id + '-n').addEventListener('click', () => { stop(); setStep(step + 1); });
    $id(id + '-b').addEventListener('click', () => { stop(); setStep(step - 1); });
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $id(id + '-play').textContent = 'Play the steps'; } };
    $id(id + '-play').addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (SML.reduced()) { setStep(3); return; }
      setStep(1); $id(id + '-play').textContent = 'Pause';
      timer = SML.every(1700, () => { if (step >= STEPS.length - 1) { stop(); return; } setStep(step + 1); });
    });
    SML.onCleanup(stop);
    const draw = ui.responsive(fig, (W) => {
      const B = st.n(id + '-c'), rolled = st.on(id + '-fix', 'roll');
      const P = rolled ? 0 : st.n(id + '-p'), t = st.n(id + '-t') / 100;
      const share = P / (P + B), taxable = B * share, tax = taxable * t, basisLeft = B - (B - taxable);
      const narrow = W < 560;
      const H = narrow ? 352 : 270;
      let b = '';
      // boxes
      const bw = narrow ? Math.min(150, (W - 92) / 2) : Math.min(170, (W - 120) / 3.2);
      const cashX = 14, iraX = narrow ? 14 : (W - bw) / 2 - bw * 0.15, rothX = W - 14 - bw;
      const poolTop = narrow ? 130 : 70, poolH = narrow ? 150 : 150;
      const hi = (k) => (step === k ? 's-acc w25' : 's-line w15');
      // cash (step 1 source)
      if (!narrow) {
        b += S.rect(cashX, poolTop + 40, bw * 0.62, 70, 'f-surf ' + hi(1), 6) + S.text(cashX + bw * 0.31, poolTop + 72, 'Your cash', 'md b ink', 'middle') + S.text(cashX + bw * 0.31, poolTop + 90, 'already taxed', 'xs', 'middle');
        b += S.arrow(cashX + bw * 0.62 + 4, poolTop + 75, iraX - 6, poolTop + 75, step === 1 ? 'acc' : 'mut', 8);
        b += S.badge((cashX + bw * 0.62 + iraX) / 2, poolTop + 58, '1', step === 1 ? 'f-acc' : 'f-mut');
      } else {
        b += S.text(14, 20, 'Your cash, already taxed', 'sm b ink');
        b += S.arrow(60, 30, 60, poolTop - 30, step === 1 ? 'acc' : 'mut', 8) + S.badge(78, 62, '1', step === 1 ? 'f-acc' : 'f-mut');
      }
      // traditional IRA pool
      const tot = P + B, ph = poolH;
      const hB = tot ? Math.max(B / tot * ph, 6) : 0, hP = ph - hB;
      b += S.text(iraX + bw / 2, poolTop - 12, 'Traditional IRA', 'md b ink', 'middle');
      b += S.rect(iraX, poolTop, bw, ph, 'f-surf ' + hi(2), 8);
      if (P > 0) b += S.rect(iraX + 3, poolTop + 3, bw - 6, hP - 3, 'f-acc-t', 6);
      b += S.rect(iraX + 3, poolTop + hP, bw - 6, hB - 3, 'f-up-t', 6);
      if (P > 0 && hP > 30) b += S.text(iraX + bw / 2, poolTop + hP / 2 + 4, k$(P) + ' pre-tax', 'sm b acc', 'middle');
      b += S.text(iraX + bw / 2, poolTop + hP + Math.max(hB / 2 + 4, 14), k$(B) + ' after-tax', 'sm b up', 'middle');
      // conversion scoop
      const sx = narrow ? iraX + bw + 12 : iraX + bw + 14, ex = rothX - 8, ay = poolTop + ph / 2;
      b += S.arrow(sx, ay, ex, ay, step === 2 ? 'acc' : 'mut', 8);
      const scW = Math.min(46, (ex - sx) * 0.5), scH = 40, scX = (sx + ex) / 2 - scW / 2, scY = ay - scH - 10;
      const sTax = scH * share;
      b += S.rect(scX, scY, scW, scH - sTax, 'f-up', 3) + (sTax > 0.5 ? S.rect(scX, scY + scH - sTax, scW, sTax, 'f-acc', 0) : '');
      b += S.badge(scX + scW / 2, ay + 18, '2', step === 2 ? 'f-acc' : 'f-mut');
      if (!narrow || ex - sx > 80) b += S.text(scX + scW / 2, scY - 6, 'convert ' + k$(B), 'xs mono', 'middle');
      // roth
      b += S.text(rothX + bw / 2, poolTop - 12, 'Roth IRA', 'md b ink', 'middle');
      b += S.rect(rothX, poolTop, bw, ph, 'f-surf ' + hi(2), 8);
      b += S.rect(rothX + 3, poolTop + ph - Math.max(10, ph * 0.35), bw - 6, Math.max(10, ph * 0.35) - 3, 'f-up', 6);
      b += S.text(rothX + bw / 2, poolTop + ph - ph * 0.35 / 2 + 5, k$(B), 'md b on', 'middle');
      b += S.text(rothX + bw / 2, poolTop + ph * 0.3, 'grows tax-free', 'xs', 'middle');
      // tax due bubble
      const tx = rothX + bw / 2, ty = poolTop + ph + 28;
      b += S.text(tx, ty, tax > 0.5 ? 'tax now ' + usd(tax) : 'no tax due', 'md b ' + (tax > 0.5 ? 'dn' : 'up'), 'middle');
      // form 8606
      const fx = narrow ? 14 : cashX, fy = narrow ? poolTop + ph + 40 : poolTop + ph + 8;
      const fw = 44, fh = 50;
      if (!narrow) {
        b += S.rect(fx, fy - 30, fw, fh, 'f-paper ' + hi(3), 4) + S.line(fx + 8, fy - 18, fx + fw - 8, fy - 18, 's-mut') + S.line(fx + 8, fy - 10, fx + fw - 8, fy - 10, 's-mut') + S.line(fx + 8, fy - 2, fx + fw - 14, fy - 2, 's-mut');
        b += S.text(fx + fw + 10, fy - 6, 'Form 8606', 'md b ' + (step === 3 ? 'acc' : 'ink')) + S.text(fx + fw + 10, fy + 10, 'with your tax return', 'xs');
        b += S.badge(fx + fw, fy - 30, '3', step === 3 ? 'f-acc' : 'f-mut');
      } else {
        b += S.badge(22, fy + 6, '3', step === 3 ? 'f-acc' : 'f-mut') + S.text(38, fy + 10, 'Form 8606 with your return', 'sm b ' + (step === 3 ? 'acc' : 'ink'));
      }
      fig.innerHTML = S.wrap(W, H, `Converting ${usd(B)}: ${F.pct(share * 100, 1)} is taxable because of ${usd(P)} of pre-tax IRA money; tax due ${usd(tax)}`, b);
      sv(id + '-s1', F.pct(share * 100, share > 0 && share < 0.1 ? 1 : 0), share > 0.005 ? 'dn' : 'up');
      sv(id + '-s2', usd(tax), tax > 0.5 ? 'dn' : 'up'); sv(id + '-s3', usd(B), 'up'); sv(id + '-s4', usd(basisLeft));
      const m = $id(id + '-m');
      const stepTxt = [
        `A backdoor Roth is two legal steps: a nondeductible traditional IRA contribution, then a conversion to Roth. `,
        `Step 1: contribute ${usd(B)} to a traditional IRA and claim no deduction. That money is your after-tax basis. `,
        `Step 2: convert to Roth, ideally before it earns much. The IRS treats every dollar you convert as the same mix as all your IRAs. `,
        `Step 3: file Form 8606 for the year. Part I records the nondeductible contribution, Part II the conversion. `,
      ][step];
      if (P > 0) m.innerHTML = ui.msg('dn', 'Pro-rata', stepTxt + `With ${usd(P)} of pre-tax IRA money on Dec 31, ${F.pct(share * 100, 0)} of the conversion (${usd(taxable)}) is taxed: about ${usd(tax)}. Roll that money into a 401(k) that accepts it before Dec 31 to fix this.`);
      else m.innerHTML = ui.msg('up', 'Clean', stepTxt + (rolled ? `With the pre-tax money rolled into the 401(k), the conversion is tax-free apart from any small earnings.` : `No pre-tax IRA money, so the whole ${usd(B)} converts tax-free.`));
    });
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  SML.lessons.push({
    id: 'l-trad-vs-roth', course: 'accounts', order: 1, title: 'Traditional or Roth?', mins: 8, level: 'Beginner',
    summary: 'Pay tax now or later: how to pick, and why many people hold both.',
    idea: 'Traditional skips tax now and taxes withdrawals. Roth taxes you now and never again. Compare your tax rate now with later.',
    widget: 'rothVsTrad',
    try: 'Drag the "now" and "later" dots on the tax ruler and watch which bar wins. Then switch the traditional saver to spending the tax saving.',
    body: [
      '<h3>Two ways to get the same tax break</h3><p>Retirement accounts come in two tax flavors. A <b>traditional</b> 401(k) or IRA gives you a deduction today: the money goes in before income tax, grows untaxed, and every dollar you take out later is taxed as income. A <b>Roth</b> 401(k) or IRA works the other way: you pay tax on the money first, it grows, and qualified withdrawals in retirement are tax-free, growth included.</p>',
      '<h3>The one question that decides it</h3><p>If the tax rates are the same, the two end up equal: paying 22% at the start or the end of a multiplication gives the same answer. So the choice comes down to one guess: <b>is your tax rate higher now or in retirement?</b></p><ul><li><b>Lean Roth</b> when your rate is low now: early in your career, a low-income year, a sabbatical, or the years between retiring and starting Social Security.</li><li><b>Lean traditional</b> in your peak earning years, when the deduction saves you 24%, 32% or more, especially if you expect lower income later or plan to retire somewhere with no state income tax.</li><li>Your retirement rate depends on Social Security, pensions, rental income and required withdrawals from traditional accounts. A big traditional balance can push it up.</li></ul>',
      '<h3>The fine print that tilts toward Roth</h3><ul><li><b>Limits are per dollar contributed, not per dollar of value.</b> $7,500 in a Roth IRA is worth more than $7,500 in a traditional IRA, because none of it belongs to the IRS. If you max out, Roth shelters more.</li><li><b>No required withdrawals.</b> Roth IRAs have no required minimum distributions for the owner, and Roth 401(k)s no longer have them either (since 2024). Traditional accounts force withdrawals from your 70s.</li><li><b>Heirs</b> inherit Roth money tax-free; traditional money is taxed when they withdraw it.</li><li><b>Contributions can come back out</b> of a Roth IRA at any time, tax- and penalty-free. Only earnings are locked up.</li></ul>',
      '<h3>Tax diversification: own some of each</h3><p>Nobody knows future tax rates. Holding both kinds gives you a lever in retirement: take taxable withdrawals up to the top of a low bracket, then use Roth money for the rest. That flexibility also helps you stay under income lines for health-insurance subsidies and Medicare premiums (see <a href="#l-medicare-rmd">Medicare, RMDs and IRMAA</a>).</p>',
      '<h3>Where the choice shows up</h3><ul><li><b>Your 401(k):</b> many plans offer both traditional and Roth for your own contributions. The employer match usually goes in pre-tax, though plans can now offer a Roth match (taxed to you as pay).</li><li><b>Your IRA:</b> a traditional IRA deduction phases out if you are covered by a workplace plan and earn above certain incomes, and Roth IRA contributions phase out at higher incomes (see <a href="#l-ira">the IRA lesson</a> and <a href="#l-backdoor-roth">the backdoor Roth</a>).</li></ul>',
    ],
    example: {
      title: 'Maya picks Roth early',
      intro: 'A 26-year-old in a low bracket today who expects to earn much more later.',
      steps: [
        'Maya earns $58,000. After the 2026 standard deduction her top federal bracket is 12%.',
        'She can put $6,000 a year into a Roth IRA or a traditional IRA. Traditional would cut her tax by 12% × $6,000 = $720 a year.',
        'At 7% a year for 35 years (to age 61), $6,000 at the start of each year grows to about $887,500 in either account.',
        'Roth: all $887,500 is hers to spend, tax-free.',
        'Traditional, with a 22% rate in retirement: she keeps $887,500 × 78% = about $692,200. If she also invested every $720 saving, that side account adds about $94,300 after a 15% tax on its gains, for about $786,500.',
      ],
      result: 'Roth leaves Maya about $101,000 more, because she paid 12% going in instead of 22% coming out.',
    },
    mistakes: [
      'Choosing traditional for the deduction, then spending the tax saving. The comparison only works if the saving is invested.',
      'Assuming you will be in a lower bracket in retirement. Social Security, required withdrawals and a large traditional balance can keep your rate high.',
      'Going all traditional in a low-income year (first job, sabbatical, early retirement) when Roth money costs very little tax.',
      'Putting everything in one bucket. With only traditional money, every retirement dollar raises your taxable income.',
    ],
    points: [
      'Same rate now and later means a tie. A lower rate now favors Roth; a higher rate now favors traditional.',
      'Roth money has no required withdrawals and passes to heirs tax-free.',
      'At the contribution limit, a Roth shelters more because none of it is owed to the IRS.',
      'Holding both gives you control over your taxable income in retirement.',
    ],
    terms: ['Traditional IRA', 'Roth IRA', 'Roth 401(k)', 'Marginal tax rate', 'RMD', 'Tax bracket'],
    glossary: [{ t: 'Tax diversification', d: 'Holding money in pre-tax, Roth and taxable accounts so you can choose which to draw from as tax rules and your income change.' }],
    quiz: { q: 'You are in the 12% bracket now and expect 22% in retirement. Which usually leaves you more to spend?', options: ['Traditional', 'Roth', 'They always come out the same'], answer: 1, why: 'Paying 12% now beats paying 22% later on the same money.' },
    sources: [
      { t: 'IRS Publication 590-A: Contributions to IRAs (traditional and Roth)', u: 'https://www.irs.gov/publications/p590a' },
      { t: 'IRS: RMD FAQs (no lifetime RMDs for Roth IRAs and Roth 401(k)s)', u: 'https://www.irs.gov/retirement-plans/retirement-plan-and-ira-required-minimum-distributions-faqs' },
      { t: 'IRS Rev. Proc. 2025-32: 2026 tax brackets and standard deduction', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
    ],
  });

  SML.lessons.push({
    id: 'l-ira', course: 'accounts', order: 2, title: 'When to open an IRA, and in what order to save', mins: 9, level: 'Beginner',
    summary: 'Who can open an IRA, the 2026 limits and deadlines, and the order to fill your accounts.',
    idea: 'Open an IRA as soon as you have earned income. Fill accounts in order: cushion, match, debt, emergency fund, HSA and IRA, then the rest.',
    widget: 'savingsOrder',
    try: 'Enter your income and monthly savings, pick your match, and watch the money pour into each account in order.',
    body: [
      '<h3>What an IRA is</h3><p>An <b>individual retirement account</b> is a tax-advantaged account you open yourself, at any broker, in about ten minutes (see <a href="#l-broker">choosing a broker</a>). It sits next to any 401(k) you have at work. You need <b>earned income</b> (wages or self-employment) to contribute, or a spouse with earned income.</p><p>An IRA is a container, not an investment. After you add money, buy something inside it, such as a target-date fund or a total-market index fund (see <a href="#l-index-funds">index funds</a>). Money left in cash just sits there.</p><p><b>Open a Roth IRA early, even with a small amount.</b> Your first Roth contribution starts the five-year clock that earnings need to come out tax-free later, so starting now with $100 keeps more doors open. Teens with a job can have a <b>custodial Roth IRA</b> funded up to what they earned (see <a href="#l-kids-money">kids\' money</a>).</p>',
      '<h3>2026 limits and deadlines</h3><ul><li><b>$7,500</b> a year in total across all your traditional and Roth IRAs, plus a <b>$1,100</b> catch-up from age 50. You can\'t put in more than you earned.</li><li>You have until the <b>tax-filing deadline</b> to contribute for a year: money for 2026 can go in until April 15, 2027. A filing extension does not extend this.</li><li><b>Roth IRA income limits (2026):</b> the amount you can contribute shrinks between $153,000 and $168,000 of modified AGI if you file single, and between $242,000 and $252,000 if married filing jointly. Above that, use the <a href="#l-backdoor-roth">backdoor Roth</a>.</li><li><b>Traditional IRA deduction:</b> anyone with earned income can contribute, but if you have a workplace plan the deduction fades between $81,000 and $91,000 (single) or $129,000 and $149,000 (joint) in 2026.</li></ul>',
      '<h3>Spousal IRA</h3><p>If you file jointly and one spouse earns little or nothing, the working spouse\'s income can fund an IRA for both: up to $15,000 for the couple in 2026, as long as the couple\'s earned income covers it. It is one of the simplest ways to double a household\'s IRA savings.</p>',
      '<h3>The order to save in</h3><p>Each step beats the one after it, so fill them in this order and move to the next when a step is full:</p><ul><li><b>1. Starter cushion.</b> About $500 to $1,000 in cash, so a surprise bill does not become card debt.</li><li><b>2. 401(k) up to the full match.</b> An instant 50% or 100% return (<a href="#l-401k-match">the match</a>).</li><li><b>3. High-interest debt.</b> Paying off a 24% card is a guaranteed 24% return (<a href="#l-card-debt">card debt</a>).</li><li><b>4. Full emergency fund.</b> Three to six months of expenses in a high-yield savings or money market account (<a href="#l-emergency">emergency fund</a>).</li><li><b>5. HSA</b> if your health plan qualifies: deductible going in, tax-free coming out for medical costs (<a href="#l-hsa">the HSA</a>).</li><li><b>6. Roth IRA</b>, or a backdoor Roth if your income is too high: more investment choice and lower fees than many 401(k)s. Steps 5 and 6 can be filled side by side.</li><li><b>7. The rest of the 401(k)</b>, up to $24,500 in 2026 (more from age 50).</li><li><b>8. Mega backdoor Roth</b> if your plan allows after-tax contributions (<a href="#l-mega-backdoor">mega backdoor</a>).</li><li><b>9. Taxable brokerage account</b> for everything else (<a href="#l-extra-money">extra money</a>).</li></ul>',
      '<h3>Lower incomes: the Saver\'s Credit</h3><p>If your income is modest, you may get a tax credit just for saving: in 2026 it applies up to $40,250 of AGI for single filers and $80,500 for joint filers. Contributions to an IRA or 401(k) both count.</p>',
    ],
    example: {
      title: 'Jordan fills the boxes',
      intro: 'Single, 30, earns $85,000, can save $1,500 a month. The employer matches 50% of the first 6% of pay.',
      steps: [
        'Jordan already has a full emergency fund and no card debt, so steps 1, 3 and 4 are done.',
        'Step 2: 6% of $85,000 is $5,100 into the 401(k). The employer adds 50% of that: $2,550 of free money.',
        'Step 5: the health plan is HSA-eligible, so $4,400 goes into the HSA (the 2026 self-only limit).',
        'Step 6: $85,000 is under the $153,000 Roth line, so $7,500 goes straight into a Roth IRA.',
        'Step 7: the year\'s savings are $18,000. $18,000 − $5,100 − $4,400 − $7,500 = $1,000 left, which goes into the 401(k).',
      ],
      result: 'Jordan\'s $18,000 becomes $20,550 a year in tax-advantaged accounts, and nothing is left on the table.',
    },
    mistakes: [
      'Skipping the match to fund an IRA first. The match is the best return you will ever get.',
      'Opening an IRA and leaving the money in cash. Buy a fund inside it.',
      'Waiting for a "good time" to open one. Each year you skip is a year of tax-free growth you can never contribute again.',
      'Contributing to a Roth IRA with income above the limit and not fixing it. An excess contribution costs 6% a year until you remove or recharacterize it.',
    ],
    points: [
      'You need earned income (or a spouse\'s) to fund an IRA. The 2026 limit is $7,500, plus $1,100 from age 50.',
      'You can contribute for a year until the tax-filing deadline the next April.',
      'Starter cushion, full match, high-interest debt, full emergency fund, HSA, Roth IRA, the rest of the 401(k), mega backdoor, then taxable.',
      'A spousal IRA lets a working spouse fund an IRA for a non-working one.',
    ],
    terms: ['Roth IRA', 'Traditional IRA', 'Spousal IRA', 'Employer match', 'MAGI', 'Taxable brokerage account'],
    glossary: [{ t: 'Earned income', d: 'Pay from work: wages, salary, tips and self-employment profit. Interest, dividends and Social Security do not count for IRA contributions.' }],
    quiz: { q: 'Your employer matches 50% of the first 6% you contribute. After a small starter cushion, where should your next dollar usually go?', options: ['A Roth IRA', 'Your 401(k), up to the full match', 'A taxable brokerage account'], answer: 1, why: 'The match is an instant 50% return that no other account can beat.' },
    sources: [
      { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit increases to $7,500', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
      { t: 'IRS Notice 2025-67: 2026 limits, Roth IRA phase-outs and Saver\'s Credit', u: 'https://www.irs.gov/pub/irs-drop/n-25-67.pdf' },
      { t: 'IRS Rev. Proc. 2025-19: 2026 HSA limits', u: 'https://www.irs.gov/pub/irs-drop/rp-25-19.pdf' },
      { t: 'IRS Publication 590-A: Contributions to IRAs', u: 'https://www.irs.gov/publications/p590a' },
    ],
  });

  SML.lessons.push({
    id: 'l-backdoor-roth', course: 'accounts', order: 3, title: 'The backdoor Roth IRA, step by step', mins: 9, level: 'Intermediate',
    summary: 'Earn too much for a Roth IRA? Contribute to a traditional IRA, convert, and watch the pro-rata rule.',
    idea: 'High earners can still fund a Roth IRA: put after-tax money in a traditional IRA, convert it, and report it on Form 8606.',
    widget: 'backdoorRoth',
    try: 'Press Play the steps. Then raise the pre-tax IRA money and watch the taxable share of the conversion jump. Tick the rollover fix.',
    body: [
      '<h3>Who it is for</h3><p>Roth IRA contributions phase out at higher incomes ($153,000 to $168,000 single, $242,000 to $252,000 joint in 2026). But there is no income limit on <b>converting</b> a traditional IRA to a Roth. The backdoor Roth uses that gap. It is legal, widely used and follows the normal IRS forms.</p>',
      '<h3>The steps</h3><ul><li><b>1. Open both accounts</b> at the same broker: a traditional IRA and a Roth IRA.</li><li><b>2. Contribute</b> up to $7,500 for 2026 ($8,600 at 50+) to the traditional IRA and take <b>no deduction</b>. This after-tax money is called your <b>basis</b>.</li><li><b>3. Convert</b> the money to your Roth IRA. Many people leave it in cash and convert within days, so there are few earnings to tax.</li><li><b>4. Invest</b> inside the Roth IRA.</li><li><b>5. File Form 8606</b> with your tax return. Part I reports the nondeductible contribution; Part II reports the conversion. Your broker sends a 1099-R for the conversion.</li></ul><p>You can\'t undo a conversion: recharacterizing conversions has not been allowed since 2018.</p>',
      '<h3>The pro-rata rule: the trap</h3><p>The IRS treats all your traditional, rollover, SEP and SIMPLE IRAs as one pot, measured on <b>December 31 of the year you convert</b>. You can\'t convert only the after-tax dollars: each converted dollar carries the same mix as the whole pot. With $7,500 of basis and $92,500 of old pre-tax rollover money, 92.5% of the conversion is taxable.</p><p><b>The fix:</b> roll the pre-tax IRA money into your current 401(k) (if the plan accepts roll-ins) before December 31. 401(k)s, inherited IRAs and Roth IRAs are not counted, and each spouse\'s IRAs are checked separately.</p>',
      '<h3>Roth five-year rules</h3><ul><li><b>Contributions</b> come out first, any time, with no tax or penalty.</li><li><b>Each conversion</b> has its own five-year clock, starting January 1 of the conversion year. The 10% early-withdrawal penalty applies only to the part of a conversion that was taxed when you converted, if you take it out within five years and before 59½. A clean backdoor conversion was tax-free, so it carries no penalty risk; the clock matters when the pro-rata rule made part of it taxable, or for bigger taxable conversions such as a conversion ladder.</li><li><b>Earnings</b> are tax-free once you are 59½ and five tax years have passed since your first Roth IRA contribution of any kind.</li></ul>',
      '<h3>The bigger cousin</h3><p>If your 401(k) allows after-tax contributions and in-plan Roth conversions, the <a href="#l-mega-backdoor">mega backdoor Roth</a> can move tens of thousands more a year into Roth. A tax professional can check your plan and your IRA balances before you start.</p>',
    ],
    example: {
      title: 'Priya cleans up first',
      intro: 'Priya and Sam file jointly and earn $310,000, above the 2026 Roth IRA limit. Their top federal bracket is 24%.',
      steps: [
        'Priya has a $45,000 rollover IRA from an old job, all pre-tax.',
        'If she contributes $7,500 after tax and converts it, her pot on December 31 is $52,500. Only $7,500 ÷ $52,500 = 14.3% is after-tax.',
        'So 85.7% of the $7,500 conversion, $6,429, is taxable: about $1,543 of tax at 24%.',
        'Instead, in October she rolls the $45,000 into her current 401(k), which accepts roll-ins. Her pre-tax IRA balance is now $0.',
        'In November she contributes $7,500, converts it a week later and files Form 8606. Sam does the same with his own IRAs, which are checked separately.',
      ],
      result: 'They move $15,000 into Roth IRAs for 2026 with almost no tax, instead of a surprise $1,543 bill.',
    },
    mistakes: [
      'Forgetting an old rollover, SEP or SIMPLE IRA. The pro-rata rule counts every one of them on December 31.',
      'Not filing Form 8606. Without it the IRS can treat your after-tax contribution as pre-tax and tax it twice.',
      'Taking a deduction for the traditional IRA contribution. A backdoor contribution must be nondeductible.',
      'Forgetting the five-year clock on a conversion that was partly taxable. Withdraw the taxed part within five years while under 59½ and it costs a 10% penalty.',
    ],
    points: [
      'No income limit applies to Roth conversions, so high earners can contribute after tax and convert.',
      'The pro-rata rule looks at all your pre-tax IRA money on December 31 of the conversion year.',
      'Rolling pre-tax IRA money into a 401(k) first makes the conversion almost tax-free.',
      'File Form 8606 every year you do it.',
    ],
    terms: ['Backdoor Roth IRA', 'Pro-rata rule', 'Roth conversion', 'Rollover', 'Roth IRA', 'Mega backdoor Roth'],
    glossary: [
      { t: 'Form 8606', d: 'The IRS form for nondeductible IRA contributions, conversions and Roth IRA withdrawals. It tracks your after-tax basis.' },
      { t: 'Basis', d: 'Money already taxed, such as a nondeductible IRA contribution. It is not taxed again when converted or withdrawn.' },
      { t: 'Recharacterization', d: 'Treating an IRA contribution as if it went to the other kind of IRA. Allowed for contributions, not for conversions.' },
    ],
    quiz: { q: 'You have $92,500 in a pre-tax rollover IRA and convert a $7,500 nondeductible contribution. About how much of the conversion is taxable?', options: ['None of it', 'About 7.5%', 'About 92.5%'], answer: 2, why: 'The pro-rata rule treats the $100,000 pot as 92.5% pre-tax, so 92.5% of what you convert is taxed.' },
    sources: [
      { t: 'IRS: About Form 8606, Nondeductible IRAs', u: 'https://www.irs.gov/forms-pubs/about-form-8606' },
      { t: 'IRS Publication 590-B: Distributions from IRAs', u: 'https://www.irs.gov/publications/p590b' },
      { t: 'IRS: 401(k) limit increases to $24,500 for 2026, IRA limit increases to $7,500', u: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500' },
    ],
  });
})();
