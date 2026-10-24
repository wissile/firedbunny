/* Stock Market Lessons: FIRE track, course fi-abroad (US taxes abroad, the France treaty example, money and health care abroad). Fork F5. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const esc = SML.esc;
  const usd = (v) => F.usd(Math.round(v), 0);
  const eur = (v) => (v < 0 ? F.minus : '') + '€' + F.num(Math.abs(Math.round(v)), 0);
  const k$ = (v, cur) => { const c = cur || '$'; const a = Math.abs(v); const s = v < 0 ? F.minus : ''; if (a >= 1e6) return s + c + (a / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e4) return s + c + Math.round(a / 1e3) + 'K'; if (a >= 1e3) return s + c + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return s + c + Math.round(a); };
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };

  SML.css(`
.fab-ctrl{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.fab-ctrl .fab-wide{grid-column:1/-1}
.fab-row{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.fab-row .lab{font:500 10px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.fab-row .seg{flex-wrap:wrap}
.fab-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px 0;font:500 11px/1.3 var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.fab-legend span{display:inline-flex;align-items:center;gap:7px}
.fab-sw{display:inline-block;width:12px;height:12px;border-radius:2px}
.fab-sw.up{background:var(--up)} .fab-sw.info{background:var(--info)} .fab-sw.acc{background:var(--accent)} .fab-sw.vio{background:var(--violet)} .fab-sw.dn{background:var(--down)} .fab-sw.mut{background:var(--shade2)}
.fab-list{list-style:none;display:flex;flex-direction:column;background:var(--surface)}
.fab-list li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:10px;padding:11px 16px;border-top:1px solid var(--line);font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 86%,transparent)}
.fab-list li b{color:var(--ink);font-weight:600}
.fab-list li small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.fab-list li i{font-style:normal;font:600 12px/1.5 var(--mono);text-align:center;border-radius:50%;width:20px;height:20px;margin-top:1px}
.fab-list li.need i{background:var(--accent);color:var(--on-acc)}
.fab-list li.no i{background:var(--shade2);color:var(--muted)}
.fab-list li.no{color:var(--muted)}
.fab-list li.no b{color:var(--muted)}
.fab-ck{list-style:none;display:grid;grid-template-columns:1fr;gap:0;background:var(--surface)}
@media(min-width:760px){.fab-ck{grid-template-columns:1fr 1fr}}
.fab-ck li{border-top:1px solid var(--line);min-width:0}
@media(min-width:760px){.fab-ck li:nth-child(odd){border-right:1px solid var(--line)}}
.fab-ck button{all:unset;box-sizing:border-box;display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;width:100%;padding:12px 16px;cursor:pointer;font-size:14px;line-height:1.45;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.fab-ck button:hover{background:var(--surface-2)}
.fab-ck button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.fab-ck button .bx{width:20px;height:20px;border:1.5px solid var(--input);border-radius:5px;margin-top:1px;display:flex;align-items:center;justify-content:center;font:700 12px var(--mono);color:var(--on-acc)}
.fab-ck button[aria-pressed="true"] .bx{background:var(--up);border-color:var(--up)}
.fab-ck button b{display:block;color:var(--ink);font-weight:600}
.fab-ck button small{display:block;color:var(--muted);font-size:12.5px;margin-top:3px;line-height:1.45}
.fab-ck button .crit{font:600 9.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--down);margin-left:6px;white-space:nowrap}
.fab-ck .gh{padding:12px 16px 6px;font:600 10.5px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--accent);border-top:1px solid var(--line)}
@media(min-width:760px){.fab-ck .gh{grid-column:1/-1;border-right:0!important}}
.fab-pfic{display:flex;flex-direction:column;gap:10px;padding:14px 16px;background:var(--surface)}
.fab-pfic .seg{flex-wrap:wrap}
.fab-note-big{padding:12px 16px;border-left:4px solid var(--down);background:color-mix(in srgb,var(--down) 10%,var(--surface));font-size:13.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 90%,transparent)}
.fab-note-big b{color:var(--ink)}
.stat-v.fab-vio{color:var(--violet)}
.fab-eur{display:block;font:500 12px/1.2 var(--mono);color:var(--muted);margin-top:6px;letter-spacing:0}
`);

  /* ------------------------------------------------------------------
     2026 US federal figures (IRS Rev. Proc. 2025-32; SSA 2026 fact sheet)
     ------------------------------------------------------------------ */
  const US = {
    br: { single: [[0, 0.10], [12400, 0.12], [50400, 0.22], [105700, 0.24], [201775, 0.32], [256225, 0.35], [640600, 0.37]],
      mfj: [[0, 0.10], [24800, 0.12], [100800, 0.22], [211400, 0.24], [403550, 0.32], [512450, 0.35], [768700, 0.37]] },
    sd: { single: 16100, mfj: 32200 },
    ltcg: { single: [49450, 545500], mfj: [98900, 613700] },
    niit: { single: 200000, mfj: 250000 },
    ss: { single: [25000, 34000], mfj: [32000, 44000] },
    feie: 132900, wageBase: 184500,
    f8938: { single: [200000, 300000], mfj: [400000, 600000] },
  };
  function ordTax(ti, fs) {
    const b = US.br[fs]; let t = 0;
    for (let i = 0; i < b.length; i++) { const lo = b[i][0], hi = i + 1 < b.length ? b[i + 1][0] : Infinity; if (ti > lo) t += (Math.min(ti, hi) - lo) * b[i][1]; }
    return t;
  }
  /* tax with qualified dividends / long-term gains (pref) stacked on top of ordinary income */
  function prefTax(ti, pref, fs) {
    ti = Math.max(0, ti); pref = Math.max(0, Math.min(pref, ti));
    const ord = ti - pref; const z = US.ltcg[fs][0], f = US.ltcg[fs][1];
    const a0 = Math.max(0, Math.min(ti, z) - ord);
    const a15 = Math.max(0, Math.min(ti, f) - Math.max(ord, z));
    const a20 = Math.max(0, pref - a0 - a15);
    return ordTax(ord, fs) + a15 * 0.15 + a20 * 0.20;
  }
  function taxableSS(ss, prov, fs) {
    if (ss <= 0) return 0;
    const [b1, b2] = US.ss[fs];
    if (prov <= b1) return 0;
    if (prov <= b2) return Math.min(0.5 * ss, 0.5 * (prov - b1));
    return Math.min(0.85 * ss, 0.85 * (prov - b2) + Math.min(0.5 * ss, 0.5 * (b2 - b1)));
  }
  SML.fabUS = { ordTax, prefTax, taxableSS, US, usCalc: (p, f) => usCalc(p, f) };

  /* p: {fs, w, se, d, ira, ss, rent, ft (0-1), tot (bool)}; useFeie: claim the FEIE on earned income */
  function usCalc(p, useFeie, inner) {
    const fs = p.fs;
    const earned = p.w + p.se;
    const excl = useFeie ? Math.min(earned, US.feie) : 0;
    const exW = Math.min(p.w, excl), exSE = excl - exW;
    let seTax = 0;
    if (p.se > 0 && !p.tot) { const base = p.se * 0.9235; seTax = Math.min(base, US.wageBase) * 0.124 + base * 0.029; }
    const halfSE = seTax / 2;
    const ordNoSS = (p.w - exW) + (p.se - exSE) - halfSE + p.ira + p.rent;
    const prov = ordNoSS + p.d + excl + 0.5 * p.ss;
    const tss = taxableSS(p.ss, prov, fs);
    const agi = Math.max(0, ordNoSS + p.d + tss);
    const ti = Math.max(0, agi - US.sd[fs]);
    const pref = Math.min(p.d, ti);
    const tax = excl > 0 ? Math.max(0, prefTax(ti + excl, pref, fs) - ordTax(excl, fs)) : prefTax(ti, pref, fs);
    const forInc = Math.max(0, (p.w - exW) + (p.se - exSE) + p.rent);
    if (inner) return { tax };
    const credTax = p.ft * forInc;
    // limit: the US tax that the foreign income adds (tax with it minus tax without the foreign income)
    const without = usCalc(Object.assign({}, p, { w: exW, se: exSE, rent: 0 }), useFeie, true).tax;
    const limit = Math.max(0, tax - without);
    const ftc = Math.min(credTax, limit);
    const carry = Math.max(0, credTax - ftc);
    const magi = agi + excl;
    const niit = 0.038 * Math.max(0, Math.min(p.d + p.rent, magi - US.niit[fs]));
    const income = Math.max(0, tax - ftc);
    return { excl, seTax, tss, agi, ti, tax, ftc, carry, niit, income, total: income + seTax + niit };
  }

  /* ======================================================================
     1. expatTax: what the US taxes when you live abroad
     ====================================================================== */
  SML.widgets.expatTax = function (root) {
    const id = SML.uid('fxt');
    const P = {
      teach: { label: 'Teacher in Spain', fs: 'single', w: 46000, se: 0, d: 3000, ira: 0, ss: 0, rent: 0, ft: 22, hi: 28000, ye: 21000, tot: false },
      free: { label: 'Freelancer', fs: 'single', w: 0, se: 85000, d: 5000, ira: 0, ss: 0, rent: 0, ft: 12, hi: 45000, ye: 38000, tot: false },
      exec: { label: 'High earner', fs: 'mfj', w: 230000, se: 0, d: 28000, ira: 0, ss: 0, rent: 0, ft: 36, hi: 420000, ye: 390000, tot: false },
      ret: { label: 'Retired couple', fs: 'mfj', w: 0, se: 0, d: 40000, ira: 30000, ss: 38000, rent: 0, ft: 20, hi: 60000, ye: 52000, tot: false },
    };
    const sl = (k, label, max, step, v, fmt) => ui.slider({ id: id + '-' + k, label, min: 0, max, step, value: v, fmt: fmt || 'usd0' });
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Your income abroad, through US eyes</span>${ui.seg(id + '-p', Object.keys(P).map((k) => ({ v: k, label: P[k].label })), 'teach', 'Example person')}</div>
      <div class="fab-legend" aria-hidden="true"><span><i class="fab-sw up"></i>Excluded by the FEIE</span><span><i class="fab-sw info"></i>Foreign income: credit for foreign tax</span><span><i class="fab-sw acc"></i>US income: the US taxes it first</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl fab-ctrl">
        <div class="fab-row fab-wide"><span class="lab">Filing status</span>${ui.seg(id + '-fs', [{ v: 'single', label: 'Single' }, { v: 'mfj', label: 'Married filing jointly' }], 'single', 'Filing status')}<span class="lab">Earned income</span>${ui.seg(id + '-v', [{ v: 'feie', label: 'Claim the FEIE' }, { v: 'ftc', label: 'Credit only' }], 'feie', 'How to treat earned income')}</div>
        ${sl('w', 'Wages from a job abroad', 300000, 1000, 46000)}
        ${sl('se', 'Self-employment income abroad', 200000, 1000, 0)}
        ${sl('d', 'US dividends and long-term gains', 150000, 1000, 3000)}
        ${sl('ira', 'IRA or 401(k) withdrawals', 150000, 1000, 0)}
        ${sl('ss', 'Social Security benefits', 70000, 500, 0)}
        ${sl('rent', 'Net rent from a home abroad', 80000, 500, 0)}
        ${ui.slider({ id: id + '-ft', label: 'Foreign income tax on your local income', min: 0, max: 50, step: 1, value: 22, fmt: 'pct' })}
        ${sl('hi', 'Foreign accounts, highest total in the year', 800000, 1000, 28000)}
        ${sl('ye', 'Foreign accounts and assets, year end', 800000, 1000, 21000)}
        <div class="fab-row fab-wide">${ui.chips(id + '-c', [{ k: 'tot', label: 'Self-employed: I pay into the other country’s social security under a totalization agreement', color: 'var(--violet)' }])}</div>
      </div>
      <div class="wg-read">${ui.stat('US tax if you claim the FEIE', id + '-a', 'hl')}${ui.stat('US tax with the credit only', id + '-b')}${ui.stat('Excluded by the FEIE', id + '-x')}${ui.stat('Forms to file', id + '-n')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <ul class="fab-list" id="${id}-f" aria-label="Filing checklist"></ul>
      <div class="wg-note">Simplified 2026 US federal estimate: standard deduction, 2026 brackets, long-term gains rates, the FEIE stacking rule and a simple foreign tax credit limit. All income in dollars. It ignores the housing exclusion, state tax, credits for children and any treaty re-sourcing, and it does not show tax owed to your new country. The FEIE limit ($132,900 for 2026) is per person; this tool assumes one earner. Not tax advice.</div>`;
    const fig = root.querySelector('.wg-fig');
    const keys = ['w', 'se', 'd', 'ira', 'ss', 'rent', 'ft', 'hi', 'ye'];
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest && e.target.closest('.seg');
      if (seg && seg.id === id + '-p') {
        const p = P[st.seg(id + '-p')];
        keys.forEach((k) => st.set(id + '-' + k, p[k])); st.setSeg(id + '-fs', p.fs);
        const chip = root.querySelector(`#${id}-c .chip`); chip.classList.toggle('on', p.tot); chip.setAttribute('aria-pressed', p.tot);
      } else if (!seg || seg.id === id + '-fs') st.setSeg(id + '-p', '');
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const p = { fs: st.seg(id + '-fs') || 'single', tot: st.on(id + '-c', 'tot') };
      keys.forEach((k) => { p[k] = st.n(id + '-' + k); });
      p.ft = p.ft / 100;
      const view = st.seg(id + '-v') || 'feie';
      const A = usCalc(p, true), B = usCalc(p, false);
      const R = view === 'feie' ? A : B;
      const wide = W >= 620;
      const rows = [
        { k: 'w', t: 'Wages from a job abroad', v: p.w, kind: 'earn', tag: 'FEIE or foreign tax credit', ct: 'FEIE or credit' },
        { k: 'se', t: 'Self-employment abroad', v: p.se, kind: 'earn', tag: p.tot ? 'FEIE or credit · no US SE tax' : 'FEIE or credit · plus US SE tax', ct: p.tot ? 'FEIE or credit' : '+ SE tax' },
        { k: 'd', t: 'US dividends and gains', v: p.d, kind: 'us', tag: 'no FEIE · US taxes first', ct: 'no FEIE' },
        { k: 'ira', t: 'IRA or 401(k) withdrawals', v: p.ira, kind: 'us', tag: 'no FEIE · treaty decides relief', ct: 'no FEIE' },
        { k: 'ss', t: 'Social Security', v: p.ss, kind: 'us', tag: 'no FEIE · up to 85% taxable', ct: 'no FEIE' },
        { k: 'rent', t: 'Rent from a home abroad', v: p.rent, kind: 'for', tag: 'no FEIE · credit for foreign tax', ct: 'credit' },
      ];
      // FEIE allocation for drawing: wages first, then self-employment
      let left = view === 'feie' ? US.feie : 0;
      rows.forEach((r) => { if (r.kind === 'earn') { r.ex = Math.min(r.v, left); left -= r.ex; } else r.ex = 0; });
      const max = Math.max(60000, ...rows.map((r) => r.v));
      const rowH = wide ? 40 : 54, top = 14;
      const H = top + rows.length * rowH + 10;
      const x0 = wide ? 206 : 14, x1 = wide ? W - 196 : W - 14;
      const xs = SML.lin(0, max, x0, x1);
      let b = '';
      rows.forEach((r, i) => {
        const y = top + i * rowH;
        const by = wide ? y + 8 : y + 22, bh = wide ? 20 : 16;
        const dim = r.v <= 0;
        b += S.text(wide ? x0 - 12 : x0, wide ? y + 22 : y + 13, r.t, 'md ' + (dim ? 'mut' : 'ink b'), wide ? 'end' : 'start');
        b += S.rect(x0, by, x1 - x0, bh, 'f-shade', 3);
        if (r.v > 0) {
          const xe = xs(r.ex), xv = xs(r.v);
          if (r.ex > 0) b += S.rect(x0, by, xe - x0, bh, 'f-up', 3);
          if (r.v > r.ex) b += S.rect(xe, by, xv - xe, bh, r.kind === 'us' ? 'f-acc' : 'f-info', r.ex > 0 ? 0 : 3);
          const lab = k$(r.v);
          const inside = xv - x0 > 64;
          b += inside ? S.text(xv - 6, by + bh / 2 + 4.5, lab, 'sm mono b on', 'end') : S.text(xv + 6, by + bh / 2 + 4.5, lab, 'sm mono b ink');
        }
        const tagCls = 'sm ' + (dim ? 'mut' : r.kind === 'us' ? 'acc' : r.kind === 'earn' ? 'up' : 'info');
        if (wide) b += S.text(x1 + 12, y + 22, r.tag, tagCls);
        else b += S.text(W - 14, y + 13, r.ct, tagCls, 'end');
      });
      fig.innerHTML = S.wrap(W, H, 'Each kind of income you earn abroad and how the US treats it', b);
      sv(id + '-a', usd(A.total), A.total <= B.total ? 'up' : '');
      sv(id + '-b', usd(B.total), B.total < A.total ? 'up' : '');
      sv(id + '-x', usd(A.excl));
      // forms
      const gross = p.w + p.se + p.d + p.ira + p.rent;
      const forms = [];
      const fileReq = gross >= US.sd[p.fs] || p.se >= 400;
      forms.push([true, 'Form 1040, every year', fileReq ? 'Your income is above the filing threshold, and income you exclude still counts toward it.' : 'Your income looks below the filing threshold, but filing is still wise if you have foreign accounts or want a record.']);
      forms.push([p.w + p.se > 0 && view === 'feie', 'Form 2555 (foreign earned income exclusion)', 'Needs a tax home abroad plus 330 full days abroad in 12 months, or bona fide residence for a full tax year.']);
      forms.push([R.ftc > 0 || (view === 'ftc' && p.w + p.se + p.rent > 0 && p.ft > 0), 'Form 1116 (foreign tax credit)', R.carry > 1 ? `Unused credit of about ${usd(R.carry)} can carry forward up to 10 years.` : 'Claims a credit for income tax paid to your new country.']);
      forms.push([p.se >= 400 && !p.tot, 'Schedule SE (self-employment tax)', 'The FEIE does not remove self-employment tax. A totalization certificate can, if the other country covers you.']);
      forms.push([p.hi > 10000, 'FBAR (FinCEN 114)', `All foreign accounts together topped $10,000 at some point (${usd(p.hi)}). Due April 15, auto-extended to October 15.`]);
      const t8938 = US.f8938[p.fs];
      forms.push([p.ye > t8938[0] || p.hi > t8938[1], 'Form 8938 (FATCA)', `Living abroad the thresholds are ${usd(t8938[0])} at year end or ${usd(t8938[1])} at any time${p.fs === 'mfj' ? ' (married filing jointly)' : ' (single)'}.`]);
      const fl = $id(id + '-f');
      fl.innerHTML = forms.map(([need, t, d]) => `<li class="${need ? 'need' : 'no'}"><i aria-hidden="true">${need ? '✓' : '–'}</i><span><b>${t}</b>${need ? '' : ' · probably not needed'}<small>${d}</small></span></li>`).join('');
      sv(id + '-n', String(forms.filter((f) => f[0]).length));
      // coach
      const m = $id(id + '-m');
      const earned = p.w + p.se;
      const niitTxt = R.niit > 1 ? ` That includes ${usd(R.niit)} of 3.8% net investment income tax, which credits generally cannot reduce.` : '';
      const seTxt = R.seTax > 1 ? ` Self-employment tax of ${usd(R.seTax)} is part of it.` : '';
      let msg;
      if (earned > 0 && B.total < A.total - 50) msg = ui.msg('info', 'Credit wins', `Your new country taxes your pay at about ${Math.round(p.ft * 100)}%. The foreign tax credit cuts US tax to ${usd(B.total)}, below the ${usd(A.total)} with the FEIE, and your pay still counts for IRA contributions.${seTxt}${niitTxt}`);
      else if (earned > 0 && A.total < B.total - 50) msg = ui.msg('up', 'FEIE wins', `Excluding ${usd(A.excl)} of pay leaves ${usd(A.total)} of US tax, against ${usd(B.total)} with the credit alone. That is typical in low-tax countries. Income above the exclusion is taxed at the higher rates it would have faced anyway.${seTxt}${niitTxt}`);
      else if (earned > 0) msg = ui.msg('ink', 'About even', `Both routes leave about ${usd(A.total)} of US tax. The credit keeps IRA eligibility and builds carryforwards; the FEIE is simpler.${seTxt}${niitTxt}`);
      else if (p.d + p.ira + p.ss + p.rent > 0) msg = ui.msg('acc', 'No exclusion', `Retirement and investment money is not earned income, so the FEIE cannot touch it. The US taxes it as if you lived at home: about ${usd(A.total)} here. Relief from double tax comes through credits and the treaty.${niitTxt}`);
      else msg = ui.msg('ink', 'Nothing to tax', 'Add some income to see how the US treats it.');
      m.innerHTML = msg;
    });
  };

  /* ======================================================================
     2. franceTax: a US citizen living in France (simplified estimate)
     2026 French scale on 2025 income (service-public F1419), quotient
     familial cap (F2705), décote (F34328), PFU 31.4% = 12.8% + 18.6%
     social charges (F2329). US-France treaty Art. 18 and 24.
     ====================================================================== */
  const FR = {
    br: [[0, 0], [11600, 0.11], [29579, 0.30], [84577, 0.41], [181917, 0.45]],
    qfCap: 1807, decote: { 1: [1982, 897], 2: [3277, 1483] }, pfuIT: 0.128, sc: 0.186,
  };
  function frPerPart(q) {
    const b = FR.br; let t = 0;
    for (let i = 0; i < b.length; i++) { const lo = b[i][0], hi = i + 1 < b.length ? b[i + 1][0] : Infinity; if (q > lo) t += (Math.min(q, hi) - lo) * b[i][1]; }
    return t;
  }
  function frIT(R, base, parts) {
    if (R <= 0) return 0;
    const full = frPerPart(R / parts) * parts;
    const plain = frPerPart(R / base) * base;
    const half = Math.round((parts - base) * 2);
    let t = Math.max(full, plain - FR.qfCap * half);
    const d = FR.decote[base];
    if (t <= d[0]) t = Math.max(0, t - Math.max(0, d[1] - 0.4525 * t));
    return t;
  }
  function frZero(base, parts) { let lo = 0, hi = 200000; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (frIT(m, base, parts) < 0.5) lo = m; else hi = m; } return lo; }
  const partsOf = (base, kids) => base + (kids >= 1 ? 0.5 : 0) + (kids >= 2 ? 0.5 : 0) + Math.max(0, kids - 2);

  /* inputs in USD; fx = dollars per euro */
  function franceCalc(p) {
    const fx = p.fx, E = (v) => v / fx;
    const base = p.hh === 'couple' ? 2 : 1, parts = partsOf(base, p.kids);
    const dE = E(p.div), gE = E(p.gain), iE = E(p.ira), sE = E(p.ss), fE = E(p.fr);
    // France: pensions (incl. US 401k/IRA payouts), French income and US Social Security go on the progressive scale,
    // after an approximate 10% allowance (the real allowance is capped per household; the cap is not applied here).
    // US Social Security gets a credit equal to the French tax on it: exempt, but it raises the rate on the rest.
    // Investment income pays the 12.8% flat tax (PFU) unless the household elects the scale for ALL of it (p.elect).
    const AL = 0.9;
    const pI = iE * AL, pS = sE * AL, pF = fE * AL;
    const R = pI + pS + pF + (p.elect ? dE + gE : 0);
    const Tall = frIT(R, base, parts);
    const sh = (x) => (R > 0 ? Tall * x / R : 0);
    const itIRA = sh(pI), itFr = sh(pF);
    const itGain = p.elect ? sh(gE) : gE * FR.pfuIT;   // income-tax part on gains
    const itDivGross = p.elect ? sh(dE) : dE * FR.pfuIT; // credited away for US citizens (Art. 24(2)(b))
    const scDiv = p.clearSC ? 0 : dE * FR.sc, scGain = gE * FR.sc;
    const fr = { itIRA, itFr, itGain, itDivGross, scDiv, scGain, it: itIRA + itFr + itGain, scTot: scDiv + scGain, zero: frZero(base, parts), parts, R };
    // United States: taxes its citizens on everything (saving clause)
    const fs = base === 2 ? 'mfj' : 'single';
    const ordNoSS = p.ira + p.fr;
    const prov = ordNoSS + p.div + p.gain + 0.5 * p.ss;
    const tss = taxableSS(p.ss, prov, fs);
    const agi = ordNoSS + p.div + p.gain + tss;
    const ti = Math.max(0, agi - US.sd[fs]);
    const pref = Math.min(p.div + p.gain, ti);
    const tax = prefTax(ti, pref, fs);
    const ordPart = ordTax(ti - pref, fs), prefPart = tax - ordPart;
    const ob = p.ira + p.fr + tss, pb = p.div + p.gain;
    const a = { ira: ob ? ordPart * p.ira / ob : 0, fr: ob ? ordPart * p.fr / ob : 0, ss: ob ? ordPart * tss / ob : 0, div: pb ? prefPart * p.div / pb : 0, gain: pb ? prefPart * p.gain / pb : 0 };
    const niit = 0.038 * Math.max(0, Math.min(pb, agi - US.niit[fs]));
    const nd = pb ? niit * p.div / pb : 0, ng = niit - nd;
    const cr = { gain: Math.min(itGain * fx, a.gain), ira: Math.min(itIRA * fx, a.ira), fr: Math.min(itFr * fx, a.fr) };
    const us = { div: a.div + nd, gain: a.gain - cr.gain + ng, ira: a.ira - cr.ira, ss: a.ss, fr: a.fr - cr.fr, credit: cr.gain + cr.ira + cr.fr, tss, niit, before: tax + niit };
    us.total = us.div + us.gain + us.ira + us.ss + us.fr;
    const income = p.div + p.gain + p.ira + p.ss + p.fr;
    const total = (fr.it + fr.scTot) * fx + us.total;
    return { fr, us, fx, income, total, fs };
  }
  SML.fabFrance = franceCalc;

  SML.widgets.franceTax = function (root) {
    const id = SML.uid('frt');
    const P = {
      sixty: { label: 'Couple at 62', hh: 'couple', kids: 0, div: 15000, gain: 20000, ira: 30000, ss: 30000, fr: 0 },
      lean: { label: 'Lean couple', hh: 'couple', kids: 0, div: 10000, gain: 14000, ira: 0, ss: 0, fr: 0 },
      solo: { label: 'Single, small budget', hh: 'single', kids: 0, div: 6000, gain: 6000, ira: 4000, ss: 0, fr: 0 },
      big: { label: 'Family, big portfolio', hh: 'couple', kids: 2, div: 40000, gain: 70000, ira: 50000, ss: 0, fr: 0 },
    };
    const keys = ['kids', 'div', 'gain', 'ira', 'ss', 'fr'];
    const sl = (k, label, max, step, v) => ui.slider({ id: id + '-' + k, label, min: 0, max, step, value: v, fmt: 'usd0' });
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">US citizen living in France</span>${ui.seg(id + '-p', Object.keys(P).map((k) => ({ v: k, label: P[k].label })), 'sixty', 'Example household')}</div>
      <div class="fab-legend" aria-hidden="true"><span><i class="fab-sw info"></i>French income tax</span><span><i class="fab-sw vio"></i>French social charges</span><span><i class="fab-sw acc"></i>US federal tax</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl fab-ctrl">
        <div class="fab-row fab-wide"><span class="lab">Household</span>${ui.seg(id + '-hh', [{ v: 'single', label: 'Single' }, { v: 'couple', label: 'Married or PACS' }], 'couple', 'Household')}<span class="lab">Citizenship</span>${ui.seg(id + '-cz', [{ v: 'us', label: 'US citizen' }, { v: 'dual', label: 'US and French' }], 'us', 'Citizenship')}</div>
        <div class="fab-row fab-wide"><span class="lab">Investment income</span>${ui.seg(id + '-el', [{ v: 'pfu', label: 'Flat tax 12.8% (default)' }, { v: 'scale', label: 'Elect the progressive scale' }], 'pfu', 'How France taxes investment income')}</div>
        ${ui.slider({ id: id + '-kids', label: 'Children at home', min: 0, max: 4, step: 1, value: 0, fmt: 'num' })}
        ${sl('div', 'Dividends from US stocks and funds', 100000, 500, 15000)}
        ${sl('gain', 'Gains from selling US funds', 150000, 500, 20000)}
        ${sl('ira', '401(k) or traditional IRA withdrawals', 120000, 500, 30000)}
        ${sl('ss', 'US Social Security', 80000, 500, 30000)}
        ${sl('fr', 'Pension or pay from France', 100000, 500, 0)}
        ${ui.slider({ id: id + '-fx', label: 'Dollars per euro', min: 0.9, max: 1.4, step: 0.01, value: 1.12, fmt: 'num2' })}
        <div class="fab-row fab-wide">${ui.chips(id + '-c', [{ k: 'sc', label: 'Treaty credit also clears social charges on US dividends (unsettled)', color: 'var(--violet)' }])}</div>
      </div>
      <div class="wg-read">${ui.stat('French income tax', id + '-a')}${ui.stat('French social charges', id + '-b')}${ui.stat('US federal tax', id + '-c2')}${ui.stat('Total tax', id + '-t', 'hl')}${ui.stat('Scale tax is €0 up to', id + '-z')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="fab-note-big"><b>Simplified estimate, not tax advice.</b> It uses the 2026 French scale and 18.6% social charges, the 2026 US brackets and a simple reading of the US-France treaty for US citizens. Pensions and pay get an approximate 10% allowance without its household cap. It leaves out the dividend allowance and deductible social charges under the scale option, social charges on pensions and 401(k) money, the cotisation subsidiaire maladie, wealth tax, state tax and Roth accounts. Cross-border rules are hard: have a US-French tax professional check your own numbers.</div>
      <div class="wg-note">Amounts in dollars a year; French figures are converted at your exchange rate. Assumes married couples file jointly in the US and that dividends come from publicly traded US companies or funds.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest && e.target.closest('.seg');
      if (seg && seg.id === id + '-p') {
        const p = P[st.seg(id + '-p')]; keys.forEach((k) => st.set(id + '-' + k, p[k])); st.setSeg(id + '-hh', p.hh);
      } else if (!seg || seg.id === id + '-hh') st.setSeg(id + '-p', '');
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const p = { hh: st.seg(id + '-hh') || 'couple', fx: st.n(id + '-fx'), clearSC: st.on(id + '-c', 'sc'), elect: st.seg(id + '-el') === 'scale' };
      keys.forEach((k) => { p[k] = st.n(id + '-' + k); });
      const dual = st.seg(id + '-cz') === 'dual';
      const r = franceCalc(p), fx = r.fx;
      const wide = W >= 620;
      const rows = [
        { t: 'US dividends', v: p.div, fi: 0, sc: r.fr.scDiv * fx, us: r.us.div, tag: p.clearSC ? 'France credits its tax' : 'France credits its income tax' },
        { t: 'Gains on US funds', v: p.gain, fi: r.fr.itGain * fx, sc: r.fr.scGain * fx, us: r.us.gain, tag: (p.elect ? 'Scale (elected)' : 'Flat tax') + ' · US credits it' },
        { t: '401(k) or IRA', v: p.ira, fi: r.fr.itIRA * fx, sc: 0, us: r.us.ira, tag: 'France taxes · US credits it' },
        { t: 'Social Security', v: p.ss, fi: 0, sc: 0, us: r.us.ss, tag: 'Only the US taxes it' },
        { t: 'From France', v: p.fr, fi: r.fr.itFr * fx, sc: 0, us: r.us.fr, tag: 'France taxes · US credits it' },
      ];
      const tot = { t: 'Total', v: r.income, fi: r.fr.it * fx, sc: r.fr.scTot * fx, us: r.us.total, tag: r.income > 0 ? F.pct(r.total / r.income * 100, 1) + ' of income' : '' };
      const maxT = Math.max(2000, tot.fi + tot.sc + tot.us) * (wide ? 1.16 : 1.32);
      const rowH = wide ? 40 : 54, top = 12;
      const H = top + (rows.length + 1) * rowH + 18;
      const x0 = wide ? 212 : 14, x1 = wide ? W - 190 : W - 14;
      const xs = SML.lin(0, maxT, x0, x1);
      let b = '';
      const drawRow = (r0, y, bold) => {
        const dim = r0.v <= 0;
        const by = wide ? y + 9 : y + 24, bh = bold ? 22 : 18;
        if (wide) { b += S.text(x0 - 12, y + 20, r0.t, 'md ' + (dim ? 'mut' : bold ? 'ink b' : 'ink b'), 'end') + S.text(x0 - 12, y + 34, dim ? '' : usd(r0.v) + ' in', 'xs mono', 'end'); }
        else b += S.text(x0, y + 14, r0.t + (dim ? '' : ' · ' + k$(r0.v) + ' in'), 'md ' + (dim ? 'mut' : 'ink b'));
        b += S.rect(x0, by, x1 - x0, bh, 'f-shade', 3);
        let x = x0;
        [['fi', 'f-info'], ['sc', 'f-vio'], ['us', 'f-acc']].forEach(([k, c]) => { const w = xs(r0[k]) - x0; if (w > 0.5) { b += S.rect(x, by, w, bh, c, 0); x += w; } });
        const sum = r0.fi + r0.sc + r0.us;
        if (!dim) b += (!bold && x - x0 > 70 ? S.text(x - 6, by + bh / 2 + 4.5, usd(sum), 'sm mono b on', 'end') : S.text(x + 6, by + bh / 2 + 4.5, sum < 1 ? '$0' : usd(sum), (bold ? 'md' : 'sm') + ' mono b ' + (sum < 1 ? 'up' : bold ? 'acc' : 'ink')));
        const tagCls = 'sm ' + (dim ? 'mut' : bold ? 'acc b' : 'mut');
        if (wide) b += S.text(x1 + 12, y + 24, r0.tag, tagCls);
        else if (!bold) b += S.text(W - 14, y + 14, r0.tag.split(' · ')[0].replace('France credits its income tax', 'FR tax credited').replace('France credits its tax', 'FR tax credited').replace('Only the US taxes it', 'US only'), 'xs ' + (dim ? 'mut' : 'mut'), 'end');
        else b += S.text(W - 14, y + 14, r0.tag, 'sm acc b', 'end');
      };
      rows.forEach((r0, i) => drawRow(r0, top + i * rowH));
      const yt = top + rows.length * rowH + 8;
      b += S.line(14, yt - 2, W - 14, yt - 2, 's-line');
      drawRow(tot, yt, true);
      fig.innerHTML = S.wrap(W, H, 'Tax on each kind of income for a US citizen living in France, split into French income tax, French social charges and US tax', b);
      const two = (x, a1, a2, cls) => { const e = $id(x); if (!e) return; e.className = 'stat-v' + (cls ? ' ' + cls : ''); e.innerHTML = esc(a1) + '<small class="fab-eur">' + esc(a2) + '</small>'; };
      two(id + '-a', usd(r.fr.it * fx), eur(r.fr.it));
      two(id + '-b', usd(r.fr.scTot * fx), eur(r.fr.scTot), r.fr.scTot > 1 ? 'fab-vio' : '');
      sv(id + '-c2', usd(r.us.total));
      sv(id + '-t', usd(r.total), r.total < 1 ? 'up' : '');
      sv(id + '-z', eur(Math.round(r.fr.zero / 100) * 100));
      const m = $id(id + '-m');
      const lead = dual ? 'Being French as well changes nothing in this estimate: France taxes you because you live there, the US because you are a citizen. ' : '';
      const ssTxt = p.ss > 0 ? ` Your Social Security is taxed only by the US under the treaty${r.us.tss < 1 ? ', and at this income none of it is taxable' : ''}.` : '';
      const itZero = r.fr.it * fx < 1 && r.us.total < 1;
      const alt = franceCalc(Object.assign({}, p, { elect: !p.elect }));
      const save = (r.fr.it - alt.fr.it) * fx;
      const tip = p.div + p.gain <= 0 ? '' : save > 25 ? ` Tip: ${p.elect ? 'the default flat tax' : 'electing the progressive scale for all your investment income this year'} would cut French income tax by about ${usd(save)}.` : save < -25 ? ` ${p.elect ? 'Electing the scale costs' : 'Electing the progressive scale would cost'} about ${usd(-save)} more in French income tax here${p.elect ? ' than the flat tax' : ', so the flat tax is the better choice'}.` : '';
      let msg;
      if (r.income <= 0) msg = ui.msg('ink', 'No income', 'Add some income to see who taxes what.');
      else if (itZero && r.fr.scTot * fx < 1) msg = ui.msg('up', 'Holds here', `${lead}No income tax in either country and no social charges at this level. You still file a French return, a US return and an FBAR if your French accounts top $10,000.${ssTxt}${tip}`);
      else if (itZero) msg = ui.msg('acc', 'Half true', `${lead}No income tax in either country, yet France’s 18.6% social charges still cost ${usd(r.fr.scTot * fx)} (${eur(r.fr.scTot)}) a year on your investment income. They start at the first euro.${ssTxt}${tip}`);
      else {
        const parts = [['French income tax', r.fr.it * fx], ['French social charges', r.fr.scTot * fx], ['US federal tax', r.us.total]].sort((a, b2) => b2[1] - a[1]);
        msg = ui.msg('info', 'Taxed', `${lead}About ${usd(r.total)} a year in all, ${F.pct(r.total / r.income * 100, 1)} of your income. The biggest piece is ${parts[0][0]} at ${usd(parts[0][1])}.${r.us.credit > 1 ? ` The US gives about ${usd(r.us.credit)} of credit for French income tax, so those dollars are not taxed twice.` : ''}${ssTxt}${tip}`);
      }
      m.innerHTML = msg;
    });
  };

  /* ======================================================================
     3. expatChecklist: money checklist for moving abroad + PFIC tester
     ====================================================================== */
  const CK = [
    { g: 'Before you move', k: 'broker', w: 3, crit: 1, t: 'Tell your broker where you will live', d: 'Some US brokers limit trading or new purchases once you have a foreign address, and some run international or expat programs. Ask before you move. Never keep a US address you do not really use to dodge the rules.' },
    { g: 'Before you move', k: 'state', w: 3, crit: 1, t: 'Cut ties with your last state', d: 'A state can keep taxing you if it still sees you as domiciled there. Change your driver’s license, voter registration and home base, and keep proof of the move.' },
    { g: 'Before you move', k: '2fa', w: 1, t: 'Move sign-in codes to an authenticator app', d: 'Text-message codes to a US number can fail abroad or when you change phone plans.' },
    { g: 'Before you move', k: 'cards', w: 1, t: 'Carry a card with no foreign transaction fee', d: 'Plus a debit card that refunds ATM fees. See the travel money lesson.' },
    { g: 'Investing', k: 'usfunds', w: 3, crit: 1, t: 'Keep investing through US-domiciled funds', d: 'Most non-US mutual funds and ETFs are PFICs: punishing US tax and a Form 8621 for each one.' },
    { g: 'Investing', k: 'basis', w: 1, t: 'Track cost basis in dollars', d: 'The IRS measures gains in US dollars, so record the exchange rate when you buy and when you sell.' },
    { g: 'Investing', k: 'buffer', w: 2, t: 'Keep a currency buffer', d: 'If the dollar falls, life abroad costs more dollars. A buffer of 10–20% of a year’s spending, or some savings in the local currency, softens the swings.' },
    { g: 'Banking', k: 'local', w: 2, t: 'Open a local bank account', d: 'You need one for rent, utilities and often your visa. Banks abroad must report US customers under FATCA, so expect extra forms, and shop around if a bank says no.' },
    { g: 'Banking', k: 'fx', w: 1, t: 'Move money at a fair exchange rate', d: 'Compare the rate you are given with the mid-market rate. Bank wires often hide a markup of a few percent.' },
    { g: 'Every year', k: '1040', w: 3, crit: 1, t: 'File your US return', d: 'Citizens file wherever they live. Living abroad on April 15 gives an automatic extension to June 15, but interest runs from April 15.' },
    { g: 'Every year', k: 'fbar', w: 3, crit: 1, t: 'File the FBAR when foreign accounts top $10,000', d: 'All foreign accounts added together, at any moment of the year. Filed online with FinCEN, due April 15 with an automatic extension to October 15.' },
    { g: 'Every year', k: '8938', w: 2, t: 'Check the Form 8938 thresholds', d: 'Living abroad: over $200,000 at year end or $300,000 at any time if single; $400,000 and $600,000 if married filing jointly.' },
    { g: 'Every year', k: 'local', w: 2, crit: 1, t: 'File in your new country too', d: 'Living there usually makes you a tax resident. You need both returns; the treaty decides who gives the credit.' },
    { g: 'Social Security and Medicare', k: 'ss', w: 1, t: 'Check that Social Security can reach you', d: 'US citizens can generally get benefits abroad. Payments cannot go to Cuba or North Korea, and a few other countries have restrictions.' },
    { g: 'Social Security and Medicare', k: 'medicare', w: 2, crit: 1, t: 'Decide on Medicare Part B before 65', d: 'Medicare generally does not pay for care abroad, but signing up late adds 10% to the premium for each 12 months you could have had it.' },
    { g: 'Social Security and Medicare', k: 'tot', w: 1, t: 'Use the totalization agreement if you work', d: 'The US has 31 of them, France included, so you pay social security tax to one country, not both.' },
    { g: 'Leaving for good', k: 'renounce', w: 1, t: 'Know the rules before you renounce', d: 'It is permanent, done at a US embassy or consulate, and carries a fee (check travel.state.gov). Exit-tax rules apply to “covered expatriates”: net worth of $2 million or more, average income tax over five years above $211,000 (2026), or no proof of five years of compliance. IRAs are then treated as fully paid out. Some people who were dual citizens from birth are exempt from the first two tests.' },
  ];
  CK.forEach((c, i) => { c.i = i; });
  const PF = [
    { v: 'us', label: 'US-listed ETF (VT, VTI)', cls: 'up', pill: 'Not a PFIC', txt: 'Taxed just as if you lived in the US. US-domiciled funds are the safest default for Americans abroad, though your new country taxes them its own way.' },
    { v: 'ucits', label: 'European UCITS ETF', cls: 'dn', pill: 'PFIC', txt: 'Form 8621 every year, and gains taxed at the top rate plus an interest charge unless you make a special election. Funds run by US firms but based in Europe count too.' },
    { v: 'localfund', label: 'Local mutual or money fund', cls: 'dn', pill: 'PFIC', txt: 'Almost always a PFIC. The default tax can swallow most of the gain. Avoid it unless an adviser sets up an election.' },
    { v: 'stock', label: 'Shares of a foreign company', cls: 'acc', pill: 'Usually fine', txt: 'An ordinary operating business is usually not a PFIC. Companies whose income is mostly passive, like some holding companies, can be. Report the account as usual.' },
    { v: 'wrap', label: 'Assurance-vie or local savings wrapper', cls: 'dn', pill: 'Risky', txt: 'Often holds funds that are PFICs and brings extra US reporting. Get cross-border advice before you open one.' },
  ];

  SML.widgets.expatChecklist = function (root) {
    const id = SML.uid('fck');
    const done = new Set();
    const groups = Array.from(new Set(CK.map((c) => c.g)));
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Money checklist for moving abroad</span><button type="button" class="btn btn-g" id="${id}-r">Reset</button></div>
      <div class="wg-fig"></div>
      <ul class="fab-ck" aria-label="Checklist">${groups.map((g) => `<li class="gh" role="presentation">${esc(g)}</li>` + CK.filter((c) => c.g === g).map((c) => `<li><button type="button" data-i="${c.i}" aria-pressed="false"><span class="bx" aria-hidden="true"></span><span><b>${esc(c.t)}${c.crit ? '<span class="crit">Key</span>' : ''}</b><small>${esc(c.d)}</small></span></button></li>`).join('')).join('')}</ul>
      <div class="wg-msg" id="${id}-m"></div>
      <div class="fab-pfic"><span class="wg-title">Is it a PFIC? Pick an investment</span>${ui.seg(id + '-pf', PF.map((x) => ({ v: x.v, label: x.label })), 'us', 'Investment to test')}<div class="wg-msg" id="${id}-pm" style="margin:0"></div></div>
      <div class="wg-note">Tap an item when it is handled. Nothing is saved. The ring weighs key items more.</div>`;
    const fig = root.querySelector('.wg-fig');
    const list = root.querySelector('.fab-ck');
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-i]'); if (!btn) return;
      const i = Number(btn.dataset.i); if (done.has(i)) done.delete(i); else done.add(i);
      btn.setAttribute('aria-pressed', done.has(i)); btn.querySelector('.bx').textContent = done.has(i) ? '✓' : '';
      draw();
    });
    $id(id + '-r').addEventListener('click', () => { done.clear(); list.querySelectorAll('button[data-i]').forEach((b2) => { b2.setAttribute('aria-pressed', 'false'); b2.querySelector('.bx').textContent = ''; }); draw(); });
    const st = ui.wire(root, () => pfic());
    function pfic() { const x = PF.find((y) => y.v === st.seg(id + '-pf')) || PF[0]; $id(id + '-pm').innerHTML = ui.msg(x.cls, x.pill, esc(x.txt)); }
    pfic();
    const draw = ui.responsive(fig, (W) => {
      const tw = CK.reduce((s, c) => s + c.w, 0), dw = CK.filter((c) => done.has(c.i)).reduce((s, c) => s + c.w, 0);
      const pct = dw / tw;
      const wide = W >= 560;
      const H = wide ? 196 : 300;
      let b = '';
      const cx = wide ? 96 : W / 2, cy = wide ? 98 : 84, r = 62;
      const C = 2 * Math.PI * r;
      b += S.circle(cx, cy, r, 'nf s-line', ' stroke-width="14" fill="none"');
      if (pct > 0) b += S.circle(cx, cy, r, 'nf ' + (pct >= 0.999 ? 's-up' : 's-acc'), ` stroke-width="14" fill="none" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round"`);
      b += S.text(cx, cy + 8, Math.round(pct * 100) + '%', 'xl b ink mono', 'middle') + S.text(cx, cy + 28, 'ready', 'sm', 'middle');
      const gx0 = wide ? 200 : 16, gx1 = W - 16, gy0 = wide ? 22 : 170;
      const gh = wide ? 28 : 21;
      groups.forEach((g, i) => {
        const items = CK.filter((c) => c.g === g), n = items.length, d = items.filter((c) => done.has(c.i)).length;
        const y = gy0 + i * gh;
        const lw = wide ? 190 : Math.min(150, (gx1 - gx0) * 0.5);
        b += S.text(gx0, y + 13, g.length > 22 && !wide ? g.replace('Social Security and Medicare', 'Soc. Security, Medicare') : g, 'sm ' + (d === n ? 'up b' : 'ink'));
        const bx = gx0 + lw, bw = gx1 - bx - 34;
        b += S.rect(bx, y + 4, bw, 10, 'f-shade', 5);
        if (d) b += S.rect(bx, y + 4, bw * d / n, 10, d === n ? 'f-up' : 'f-acc', 5);
        b += S.text(gx1, y + 13, d + '/' + n, 'xs mono', 'end');
      });
      fig.innerHTML = S.wrap(W, H, 'How ready your money is for a move abroad, overall and by group', b);
      const miss = CK.filter((c) => c.crit && !done.has(c.i));
      const m = $id(id + '-m');
      if (!done.size) m.innerHTML = ui.msg('ink', 'Start', `Tap each item you have handled. ${miss.length} of them are key: missing one can cost real money or a penalty.`);
      else if (miss.length) m.innerHTML = ui.msg('acc', miss.length + ' key left', `Next: ${miss.slice(0, 2).map((c) => esc(c.t.toLowerCase())).join(', then ')}.`);
      else if (pct < 0.999) m.innerHTML = ui.msg('up', 'Key items done', 'Every key item is handled. The rest make life abroad cheaper and smoother.');
      else m.innerHTML = ui.msg('up', 'Ready', 'Everything on the list is handled. Review it once a year, at tax time.');
    });
  };

  /* ======================================================================
     4. expatHealth: build your health cover abroad in layers
     ====================================================================== */
  const PLACES = {
    fr: { label: 'France', main: 'Public system (PUMa)', mainTxt: 'Residents can usually join French public health insurance (PUMa) after about three months of stable residence. The long-stay visitor visa asks for private insurance at the start.', gap: 'Top-up policy (mutuelle)' },
    es: { label: 'Spain', main: 'Spanish private plan', mainTxt: 'The non-lucrative visa requires Spanish private health insurance with no copays or deductibles. Travel insurance is not accepted.', gap: 'Check the exclusions' },
    pt: { label: 'Portugal', main: 'Local or international plan', mainTxt: 'Most newcomers buy a Portuguese private plan or an international one at first. Check exactly what your consulate asks for with the D7 visa.', gap: 'Check the exclusions' },
    mx: { label: 'Mexico', main: 'Local or international plan', mainTxt: 'Private Mexican plans and international plans are both common. Check age limits and pre-existing condition rules before you move.', gap: 'Evacuation cover' },
    th: { label: 'Thailand', main: 'Plan with $50K+ cover', mainTxt: 'The LTR “wealthy pensioner” visa needs health insurance with at least $50,000 of cover, or $100,000 in the bank. Most retirees buy a Thai private or international plan.', gap: 'Evacuation cover' },
    cr: { label: 'Costa Rica', main: 'CAJA + private top-up', mainTxt: 'Legal residents are reported to be required to join the national health system (CAJA); confirm with Costa Rica’s immigration office. Many add private cover for faster appointments.', gap: 'Evacuation cover' },
    nomad: { label: 'Nomad', main: 'Nomad or international plan', mainTxt: 'Moving country to country, you need a plan that follows you. Travel medical (nomad) plans are cheap but are not full health insurance: they exclude pre-existing conditions and cap what they pay.', gap: 'Evacuation built in?' },
  };
  SML.widgets.expatHealth = function (root) {
    const id = SML.uid('fhl');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Your health cover abroad, layer by layer</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl fab-ctrl">
        <div class="fab-row fab-wide"><span class="lab">Your age</span>${ui.seg(id + '-a', [{ v: 'u40', label: 'Under 40' }, { v: 'mid', label: '40–59' }, { v: 'pre', label: '60–64' }, { v: 'med', label: '65+' }], 'pre', 'Age')}</div>
        <div class="fab-row fab-wide"><span class="lab">Where you live</span>${ui.seg(id + '-w', Object.keys(PLACES).map((k) => ({ v: k, label: PLACES[k].label })), 'es', 'Where you live')}</div>
        <div class="fab-row fab-wide"><span class="lab">Time in the US</span>${ui.seg(id + '-u', [{ v: 'rare', label: 'Rarely' }, { v: 'weeks', label: 'A few weeks a year' }, { v: 'months', label: 'Months a year' }], 'weeks', 'Time in the US')}</div>
        <div class="fab-row fab-wide">${ui.chips(id + '-c', [{ k: 'pre', label: 'I have a pre-existing condition', color: 'var(--down)' }])}</div>
      </div>
      <div class="wg-read">${ui.stat('US marketplace plan, no subsidy', id + '-s1')}${ui.stat('Medicare abroad', id + '-s2')}${ui.stat('Travel medical plan fits?', id + '-s3')}</div>
      <div class="wg-msg" id="${id}-m"></div>
      <ol class="fab-list" id="${id}-l" aria-label="Your layers"></ol>
      <div class="wg-note">Layers are general guidance, not a quote. Prices for international plans depend on age, area of cover, deductible and health history, so get several quotes. The US comparison is the 2026 national average benchmark silver plan with no subsidy.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const age = st.seg(id + '-a') || 'pre', wh = st.seg(id + '-w') || 'es', us = st.seg(id + '-u') || 'weeks', pre = st.on(id + '-c', 'pre');
      const P = PLACES[wh];
      const layers = [];
      layers.push({ n: 1, short: P.main, cls: 'f-info', tcls: 'on', title: 'Main cover: ' + P.main, txt: P.mainTxt + (pre ? ' With a pre-existing condition, choose full health insurance or a public system: travel medical plans will not pay for it.' : '') });
      layers.push({ n: 2, short: P.gap, cls: 'f-vio', tcls: 'on', title: P.gap, txt: /Evacuation/.test(P.gap) ? 'Check that a serious case can be flown to a hospital that can treat it. Many international plans include it; local plans often do not.' : /mutuelle/.test(P.gap) ? 'Public insurance pays only part of many bills. A top-up policy pays much of the rest.' : 'Read what the plan leaves out: conditions you already have, age limits, waiting periods and yearly caps.' });
      layers.push({ n: 3, short: us === 'rare' ? 'No US cover: cheaper' : us === 'weeks' ? 'Travel cover for US trips' : 'Plan that includes the US', cls: 'f-acc', tcls: 'on', title: us === 'rare' ? 'Leave the US out' : us === 'weeks' ? 'Cover for US trips' : 'Include the US', txt: us === 'rare' ? 'Plans that exclude the US cost less. A short trip home can be covered with travel medical insurance.' : us === 'weeks' ? 'Buy travel medical cover for each trip, or a plan with a US add-on. US hospital bills are the most expensive in the world.' : 'Spending months in the US means choosing worldwide cover including the US, which costs more than cover outside the US.' });
      if (age === 'med') layers.push({ n: 4, short: 'Medicare Part B: keep or drop', cls: 'f-up', tcls: 'on', title: 'Decide on Medicare Part B', txt: 'Medicare generally does not pay abroad. Part B costs $202.90 a month in 2026. Dropping it saves money, but if you come back and sign up later the premium rises 10% for each 12 months without it.' });
      const n = layers.length;
      const wide = W >= 560;
      const bh = wide ? 44 : 40, gap = 8, top = 10;
      const H = top + n * (bh + gap) + 6;
      let b = '';
      layers.slice().reverse().forEach((L, j) => {
        const i = n - 1 - j;
        const y = top + j * (bh + gap);
        const inset = wide ? (n - 1 - i) * 26 : (n - 1 - i) * 10;
        const x0 = 14 + inset, x1 = W - 14 - inset;
        b += S.rect(x0, y, x1 - x0, bh, L.cls, 6);
        b += S.badge(x0 + 22, y + bh / 2, String(L.n), 'f-ink');
        b += S.text(x0 + 42, y + bh / 2 + 5, L.short, (wide ? 'md' : 'sm') + ' b on');
      });
      fig.innerHTML = S.wrap(W, H, 'Your health cover abroad as a stack of layers, main cover at the bottom', b);
      $id(id + '-l').innerHTML = layers.map((L) => `<li class="need"><i aria-hidden="true">${L.n}</i><span><b>${esc(L.title)}</b><small>${esc(L.txt)}</small></span></li>`).join('');
      sv(id + '-s1', age === 'u40' ? 'Under $625/mo' : age === 'mid' ? '≈ $625/mo at 40' : age === 'pre' ? 'Well above $625' : 'Medicare instead');
      sv(id + '-s2', 'Not covered', 'dn');
      const nomadOK = !pre && age === 'u40';
      sv(id + '-s3', pre ? 'No' : age === 'u40' ? 'For travel' : 'Not enough', nomadOK ? 'up' : 'dn');
      const m = $id(id + '-m');
      if (age === 'med') m.innerHTML = ui.msg('acc', '65 and over', `Your main cover abroad has to come from ${esc(P.label === 'Nomad' ? 'an international plan' : P.label)}, because Medicare stays home. The Part B choice is about keeping the door open if you return.`);
      else if (pre) m.innerHTML = ui.msg('dn', 'Full cover only', 'Travel medical plans exclude pre-existing conditions. You need full health insurance or a public system that accepts you.');
      else if (wh === 'nomad' && age === 'u40') m.innerHTML = ui.msg('up', 'Nomad plan', 'Under 40 and healthy, a nomad plan can work as travel cover. One plan cost $62.72 per 4 weeks for ages 18–39 when checked, with a $250,000 limit. Know what it leaves out.');
      else m.innerHTML = ui.msg('info', esc(P.label), 'Start with the main cover your visa and country require, then fill the gaps. ' + (age === 'pre' ? 'Before 65 there is no Medicare to fall back on if you return, so keep your cover continuous.' : 'Get quotes from more than one insurer and check renewal rules.'));
    });
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  SML.lessons.push({
    id: 'l-us-tax-abroad', course: 'fi-abroad', order: 1, title: 'US taxes follow you abroad', mins: 10, level: 'Intermediate',
    summary: 'Americans file US taxes wherever they live. What the FEIE, credits and treaties do, plus the forms.',
    idea: 'The US taxes its citizens on worldwide income wherever they live. Exclusions and credits stop most double tax, but the filing never stops.',
    widget: 'expatTax',
    try: 'Pick an example person, then move the sliders. Watch which income the FEIE can touch, which route leaves less US tax, and which forms you need.',
    body: [
      '<h3>Citizens file wherever they live</h3><p>The US is one of very few countries that taxes by <b>citizenship</b>. Move to Lisbon or Bangkok and you still file a Form 1040 every year your income is over the filing threshold, reporting income from everywhere. Your new country usually taxes you too, because you live there. Two returns a year is normal for an American abroad.</p><p>If you live abroad on April 15 you get an automatic extension to <b>June 15</b> to file, but interest on any tax due still runs from April 15. Form 4868 extends the deadline to October 15.</p>',
      '<h3>The foreign earned income exclusion (FEIE)</h3><p>The FEIE lets you leave up to <b>$132,900</b> of foreign <b>earned</b> income off your US return in 2026, per person, on Form 2555. Earned means wages and self-employment income. To claim it you need a tax home abroad plus either 330 full days outside the US in any 12-month period or bona fide residence abroad for a full tax year.</p><ul><li>It does nothing for dividends, interest, capital gains, IRA or 401(k) withdrawals, pensions or Social Security. A retiree living on a portfolio gets no help from it.</li><li>It does not reduce self-employment tax.</li><li>Income above the exclusion is taxed at the higher rates it would have faced with the excluded pay included (the stacking rule).</li><li>Excluded pay does not count as compensation for IRA contributions, and it still counts as income for marketplace health subsidies if you ever come back.</li></ul>',
      '<h3>The foreign tax credit</h3><p>The other tool is a dollar-for-dollar credit for income tax you pay abroad, on Form 1116. In a country with higher tax than the US, the credit often wipes out the US tax on your foreign pay, keeps that pay available for IRA contributions, and leaves unused credit you can carry forward for up to 10 years. In a low-tax country the FEIE usually wins. The widget compares both.</p><p>A credit only helps when there is US tax to cancel. If your US tax is already $0, because you live in the 0% capital gains band (see <a href="#l-zero-bracket">the 0% bracket</a>), there is nothing to offset.</p>',
      '<h3>Treaties and the saving clause</h3><p>Tax treaties decide which country taxes which income first and who gives the credit. But almost every US treaty has a <b>saving clause</b>: the US keeps taxing its own citizens as if the treaty did not exist, apart from listed exceptions. So a treaty rarely removes your US return; it mostly decides where the credit comes from. The next lesson walks through France as a full example.</p>',
      '<h3>Report your foreign accounts</h3><ul><li><b>FBAR (FinCEN 114):</b> required when all your foreign financial accounts added together top <b>$10,000</b> at any moment of the year. It is filed online with FinCEN, separately from your tax return, due April 15 with an automatic extension to October 15.</li><li><b>Form 8938 (FATCA):</b> filed with your return. Living abroad, the thresholds are $200,000 at year end or $300,000 at any time for single filers, and $400,000 or $600,000 for married couples filing jointly. Missing it can cost a $10,000 penalty, plus up to $50,000 more if you keep ignoring IRS notices.</li></ul>',
      '<h3>Social security taxes and your last state</h3><p>Self-employed Americans abroad owe US self-employment tax even when the FEIE covers their income tax, unless a <b>totalization agreement</b> assigns them to the other country’s system. The US has 31 of these agreements; the one with France has been in force since July 1, 1988.</p><p>Your last US state may also keep taxing you if it still sees you as living there. Change your domicile, driver’s license and voter registration, and keep proof of the move. Cross-border rules get complicated fast, so a CPA or enrolled agent who works with expats is worth the fee in your first year abroad.</p>',
      '<h3>Other countries: check the host tax</h3><p>The US side is only half the bill. Your new country taxes you as a resident, and its rules change often. Check the current rules with a local adviser before you move:</p><ul><li><b>Spain</b> taxes residents on worldwide income, including savings income, and has wealth taxes on large fortunes.</li><li><b>Portugal</b> closed its NHR regime to new applicants. Its replacement, IFICI, is aimed at certain professionals and researchers and mostly does not help retirees.</li><li><b>Thailand</b> taxes foreign income that residents bring into the country.</li><li><b>Italy and Greece</b> offer flat-tax regimes of 7% for some foreign pensioners, with strict conditions on where you live and for how long.</li><li><b>France</b> is covered in detail in <a href="#l-treaty-france">the next lesson</a>.</li></ul>',
    ],
    example: {
      title: 'A retired couple abroad',
      intro: 'Made-up couple, both 63, married filing jointly, 2026 US federal rules. At 65 extra deductions would lower their bill.',
      steps: [
        'They live on $40,000 of dividends and long-term gains from US funds, $30,000 of IRA withdrawals and $38,000 of Social Security. None of it is earned income, so the FEIE is zero.',
        'Provisional income is $30,000 + $40,000 + half of $38,000 = $89,000. That is above $44,000, so the maximum 85% of Social Security is taxable: $32,300.',
        'AGI is $30,000 + $40,000 + $32,300 = $102,300. After the $32,200 standard deduction, taxable income is $70,100.',
        'The $30,100 of ordinary income costs $2,480 (10% of $24,800) plus $636 (12% of $5,300) = $3,116. The $40,000 of gains and dividends sits under the $98,900 line, so it is taxed at 0%.',
        'They keep $60,000 in a local bank. All foreign accounts topped $10,000, so they file an FBAR. They stay under the $400,000 Form 8938 line.',
      ],
      result: 'About $3,100 of US tax, an FBAR, and a tax return in their new country too. The FEIE did nothing for them.',
    },
    mistakes: [
      'Thinking you stop filing US taxes once you move. Citizens file every year their income is over the threshold, wherever they live.',
      'Expecting the FEIE to shelter retirement income. It covers only wages and self-employment income.',
      'Forgetting the FBAR. It is a separate online filing, and the trigger is all foreign accounts added together topping $10,000 at any moment.',
      'Claiming the FEIE by habit in a high-tax country. The foreign tax credit can leave less US tax, keeps IRA eligibility and builds credits you can carry forward.',
    ],
    points: [
      'US citizens file a 1040 wherever they live, and usually a return in their new country too.',
      'The FEIE ($132,900 in 2026) covers earned income only, and not self-employment tax.',
      'The foreign tax credit is the main tool for retirees and people in high-tax countries.',
      'Treaties decide who gives the credit; the saving clause keeps your US return.',
      'FBAR above $10,000 in foreign accounts; Form 8938 above $200,000 or $300,000 (single, abroad).',
    ],
    terms: ['Citizenship-based taxation', 'FEIE', 'Foreign tax credit', 'FBAR', 'FATCA', 'Totalization agreement'],
    glossary: [
      { t: 'Stacking rule', d: 'With the FEIE, the income you still report is taxed at the rates it would face if the excluded pay were included.' },
      { t: 'Tax home', d: 'The place where you mainly work or do business. For the FEIE it must be outside the US.' },
    ],
    quiz: { q: 'You retire abroad and live on dividends and IRA withdrawals. What does the FEIE do for you?', options: ['Excludes the first $132,900', 'Nothing: it covers only earned income', 'Excludes half of it'], answer: 1, why: 'The FEIE applies to wages and self-employment income only. Investment income and retirement withdrawals stay fully reportable.' },
    sources: [
      { t: 'IRS: US citizens and resident aliens abroad', u: 'https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad' },
      { t: 'IRS: Foreign earned income exclusion', u: 'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion' },
      { t: 'IRS: Report of Foreign Bank and Financial Accounts (FBAR)', u: 'https://www.irs.gov/businesses/small-businesses-self-employed/report-of-foreign-bank-and-financial-accounts-fbar' },
      { t: 'IRS: Do I need to file Form 8938?', u: 'https://www.irs.gov/businesses/corporations/do-i-need-to-file-form-8938-statement-of-specified-foreign-financial-assets' },
    ],
  });

  SML.lessons.push({
    id: 'l-treaty-france', course: 'fi-abroad', order: 2, title: 'Tax treaties: the France example', mins: 12, level: 'Advanced',
    summary: 'What really happens to a US citizen, or a US-French dual citizen, who lives in France.',
    idea: 'France taxes you because you live there. The US taxes you because you are a citizen. The treaty decides who gives the credit, not whether you file.',
    widget: 'franceTax',
    try: 'Pick a household, set the income mix and switch between US citizen and dual citizen. Watch French income tax, social charges and US tax move.',
    body: [
      '<h3>Two countries, two reasons to tax</h3><p>France taxes its <b>residents</b> on income from everywhere. Nationality does not matter: live in France and you are in. The US taxes its <b>citizens</b> wherever they live. A US citizen living in France therefore files in both countries, plus an FBAR and possibly Form 8938. Being a French citizen as well changes none of this, because France already taxes you as a resident.</p>',
      '<h3>The treaty in plain words</h3><p>The US-France tax treaty was signed in 1994, took effect in 1996 and was updated in 2004 and 2009. Its saving clause lets the US tax its citizens as if the treaty did not exist, with exceptions. The parts that matter most for a retiree:</p><ul><li><b>US Social Security</b> paid to a French resident is taxable <b>only in the US</b>. This exception survives the saving clause. France still counts it when setting the rate on your other income.</li><li><b>401(k) and IRA withdrawals</b> are taxed by France as the country where you live. The US also taxes you as a citizen and gives a credit for the French tax.</li><li><b>Dividends and interest from publicly traded US companies and the US government</b> go into your French return, but US citizens get a French credit equal to the French income tax on them, which removes that tax.</li><li><b>Gains from selling shares</b> are generally taxed by the country where you live, so France taxes them at its flat tax, and the US credits the French income tax.</li><li>A <b>Roth IRA</b> is a question mark: its French treatment is uncertain. Assume Roth earnings could be taxed in France until an adviser tells you otherwise.</li></ul>',
      '<h3>French income tax: the 0% band and household parts</h3><p>The 2026 scale (on 2025 income) is applied per <b>part</b>: 0% up to €11,600, 11% to €29,579, 30% to €84,577, 41% to €181,917 and 45% above. A couple has 2 parts, each of the first two children adds half a part and each later child a full part (the saving from children is capped at €1,807 per half-part). A further reduction, the <b>décote</b>, helps low tax bills. Together they mean <b>€0 income tax up to about €17,200</b> of scale income for a single person and <b>about €32,500</b> for a couple.</p><p>Two details matter. Pensions, including 401(k) and IRA payouts, get a <b>10% allowance</b> before the scale, capped per household (check impots.gouv.fr for the cap). And the scale covers pensions and pay only by default: <b>dividends, interest and gains pay the 12.8% flat tax from the first euro</b>, unless your household elects the progressive scale for <b>all</b> its investment income that year. With a low income the election can bring income tax on investments to €0; with a higher one it can cost more. The widget lets you try both.</p>',
      '<h3>Social charges: the part people forget</h3><p>On top of income tax, France levies <b>social charges</b> on investment income. In 2026 they are <b>18.6%</b> on most of it (CSG 10.6%, CRDS 0.5% and a 7.5% solidarity levy), so the flat tax on dividends and gains, the PFU, is <b>31.4%</b>: 12.8% income tax plus 18.6% social charges. Life insurance (assurance-vie), rental income and real-estate gains stay at 17.2%. A reduced 7.5% rate exists only for people covered by an EU, EEA or Swiss social security system, so someone covered by US Social Security appears to owe the full rate. Whether the treaty credit also removes social charges on US dividends is unsettled; the widget lets you see both cases. Whether social charges apply to US pensions and 401(k) money is a question for a professional. People who live mainly on investment income with little pay can also owe the <b>cotisation subsidiaire maladie</b>, a health-insurance levy on capital income; check whether it applies to you.</p>',
      '<h3>So do you pay nothing under a certain amount?</h3><p><b>As a blanket rule, no.</b> There is no special exemption for dual citizens. In a narrow sense, yes: a low income can mean €0 French income tax and $0 US federal tax (the standard deduction plus the 0% capital gains band up to $98,900 of taxable income for a married couple). But three things get in the way:</p><ul><li>The French 0% band only reaches investment income if you <b>elect the progressive scale</b> for all of it. By default, gains and dividends pay the 12.8% flat tax from the first euro.</li><li>French <b>social charges</b> start at the first euro of investment income either way: €10,000 of dividends or gains can cost €1,860 even when income tax is zero.</li><li>You still <b>file</b> in both countries, plus the FBAR.</li></ul><p>Example: a couple living on $10,000 of US dividends and $14,000 of fund gains owes $0 of US tax. In France the default flat tax takes about €1,600 from the gains; electing the scale brings income tax to €0. The €3,990 of social charges stays either way. US Social Security is taxed only by the US, where at low incomes little or none of it may be taxable.</p>',
      '<h3>Other French rules to know</h3><ul><li><b>IFI</b>, a wealth tax on real estate only, applies when your net real estate tops €1.3 million on January 1. Financial assets are not in it.</li><li>The US-France <b>totalization agreement</b> (in force since July 1, 1988) stops you paying both countries’ social security taxes on work.</li><li>New residents can usually join French public health insurance (PUMa) after about three months of stable residence, so plan private cover for the first months.</li><li>French funds and many assurance-vie contracts can be PFICs for Americans (see <a href="#l-expat-money">banks, brokers and PFICs</a>).</li></ul><p>This is one of the hardest areas of personal tax. Before you move, have a tax professional who handles both US and French returns run your real numbers.</p>',
    ],
    example: {
      title: 'A couple of 62 in Bordeaux',
      intro: 'Made-up US citizens, married, $95,000 of income a year, $1.12 per euro, default flat tax on investments. Same numbers as the “Couple at 62” preset.',
      steps: [
        'They take $15,000 of dividends from US funds, sell $20,000 of fund gains, withdraw $30,000 from a 401(k) and get $30,000 of Social Security.',
        'France puts the 401(k) money and Social Security on its scale after an approximate 10% allowance: about €48,200 over 2 parts, or €2,510 of tax after the décote. Social Security gets a credit for its half, so they owe about €1,260, all on the 401(k) money.',
        'The gains pay the flat tax: €2,290 of income tax plus €3,320 of social charges on about €17,860. The dividends’ income tax is credited away, but in this estimate their €2,490 of social charges remains.',
        'The US taxes everything: $25,500 of the Social Security is taxable, so taxable income is $58,300. Dividends and gains fall in the 0% band, and the $23,300 of ordinary income costs $2,330.',
        'The US credits $1,259 of French tax against the 401(k) part, leaving $1,071 of US tax, which is the tax on Social Security.',
      ],
      result: 'About €9,360 in France (≈ $10,480) plus $1,071 in the US: roughly $11,550, or 12.2% of their income. Social charges (€5,810) are the biggest piece. Electing the scale would cost more here (about $13,520), because it pushes the 401(k) money into the 30% band. Living in a US state with no income tax, the same income would have cost $2,330 of federal tax.',
    },
    mistakes: [
      'Believing dual citizenship removes a tax. France taxes residents and the US taxes citizens, so a dual citizen living in France gets both.',
      'Looking only at income tax. Social charges of 18.6% hit most investment income from the first euro, even when income tax is zero.',
      'Assuming the 0% band covers your dividends and gains. By default they pay the 12.8% flat tax unless you elect the scale for all your investment income.',
      'Assuming a Roth IRA stays tax-free in France. Its French treatment is uncertain.',
    ],
    points: [
      'France taxes residents on worldwide income; the US taxes citizens. A dual citizen in France files in both.',
      'US Social Security is taxed only by the US under the treaty; 401(k) and IRA withdrawals are taxed by France first.',
      'On the progressive scale, French income tax can be €0 below about €17,200 (single) or €32,500 (couple), but investment income pays the 12.8% flat tax unless you elect the scale for all of it.',
      'Social charges of 18.6% (2026) apply to most investment income from the first euro.',
      'Get a US-French tax professional to check your numbers before you move.',
    ],
    terms: ['Tax treaty', 'Savings clause', 'Tax residency', 'Social charges', 'Foreign tax credit', 'Totalization agreement'],
    glossary: [
      { t: 'Quotient familial', d: 'France’s household parts system: income is divided by the number of parts, taxed, then multiplied back, so families pay less.' },
      { t: 'Décote', d: 'A French reduction that shrinks or cancels small income tax bills.' },
      { t: 'PFU', full: 'Prélèvement forfaitaire unique', d: 'France’s flat tax on investment income: 12.8% income tax plus social charges, 31.4% in total for most income in 2026.' },
      { t: 'IFI', full: 'Impôt sur la fortune immobilière', d: 'A French wealth tax on real estate only, when net real estate tops €1.3 million.' },
    ],
    quiz: { q: 'A US citizen living in France receives US Social Security. Under the treaty, who taxes it?', options: ['Only France', 'Only the United States', 'Both, with a credit'], answer: 1, why: 'The treaty makes social security taxable only by the paying country, and this exception survives the saving clause. France can still count it when setting the rate on other income.' },
    sources: [
      { t: 'IRS: United States–France income tax treaty (PDF)', u: 'https://www.irs.gov/pub/irs-trty/france.pdf' },
      { t: 'Service-Public: income tax scale (barème)', u: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1419' },
      { t: 'Service-Public: household parts (quotient familial)', u: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2705' },
      { t: 'Service-Public: flat tax and social charges on investment income', u: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2329' },
    ],
  });

  SML.lessons.push({
    id: 'l-expat-money', course: 'fi-abroad', order: 3, title: 'Banks, brokers and PFICs abroad', mins: 9, level: 'Intermediate',
    summary: 'Keep your accounts working, avoid the PFIC trap and set up Social Security before you move.',
    idea: 'Sort out your broker, bank and investments before you move. The wrong local fund can cost far more than any bank fee.',
    widget: 'expatChecklist',
    try: 'Tap each item you have handled, then test a few investments in the PFIC checker.',
    body: [
      '<h3>Your US broker after you move</h3><p>Some US brokers limit what you can do once you have a foreign address: no new fund purchases, restricted trading, or a request to move the account. Others run international or expat account programs. Ask before you move: can I keep buying funds, trade options, get statements and sign in from abroad? Tell the truth about where you live. Keeping a US address you do not really use can break the account terms.</p>',
      '<h3>Banking where you live</h3><p>You will need a local account for rent, utilities and usually your visa. Banks abroad must report American customers to the IRS under FATCA, so expect extra forms. Move money at a fair exchange rate: compare what you are offered with the mid-market rate, because bank wires often hide a markup. Carry a card with no foreign transaction fee (see <a href="#l-travel-money">travel money</a>).</p>',
      '<h3>The PFIC trap</h3><p>To US tax law, most non-US mutual funds and ETFs are <b>PFICs</b> (passive foreign investment companies). That includes European UCITS funds run by US firms. Each one needs a Form 8621, and the default regime taxes gains at the top rate plus an interest charge, which can take most of the gain. Special elections exist but add work. The simple rule: keep investing through <b>US-domiciled funds</b> such as VT or VTI, or individual stocks and bonds. Your new country may tax US funds in its own way, so check that too.</p>',
      '<h3>Currency risk</h3><p>If your savings are in dollars and your life is in euros, a weaker dollar raises your costs. At $1.12 per euro, €3,000 a month costs about $3,360. At $1.25 per euro it costs $3,750; at $1.00, $3,000. A buffer of 10–20% of a year’s spending, or some savings in the local currency, softens the swings.</p>',
      '<h3>Social Security and Medicare from abroad</h3><p>US citizens can generally receive Social Security abroad. Payments cannot be sent to Cuba or North Korea, and a few countries have restrictions. Medicare generally does not pay for care outside the US, but signing up for Part B late adds 10% to the premium for each 12 months you could have had it. See <a href="#l-expat-health">health care abroad</a>.</p>',
      '<h3>If you ever renounce</h3><p>Giving up US citizenship is permanent and done in person at a US embassy or consulate, for a fee (check travel.state.gov for today’s amount). You are a <b>covered expatriate</b> if your net worth is $2 million or more, your average yearly income tax over the past five years tops $211,000 (2026), or you cannot certify five years of tax compliance on Form 8854. Being covered does not by itself mean a big bill; it means the exit-tax rules apply:</p><ul><li>Your assets are treated as sold the day before you leave, and gains above $910,000 (2026) are taxed.</li><li>IRAs and similar tax-deferred accounts are treated as fully paid out that day, with no exclusion. Other retirement plans have their own rules.</li><li>People who were US and another country’s citizen from birth, are still citizens and tax residents of that country, and lived in the US for no more than 10 of the last 15 years can escape the net-worth and tax tests. They still must certify five years of compliance. This can matter for US-French dual citizens.</li></ul><p>Never decide this without a specialist.</p>',
    ],
    example: {
      title: 'Ana moves to Porto',
      intro: 'Made-up retiree with $1,000,000 at a US broker and $1.12 per euro.',
      steps: [
        'Before moving she asks her broker about foreign addresses. It allows existing holdings but limits new fund purchases, so she opens an account with a broker that serves Americans abroad.',
        'She keeps her money in VT, a US-domiciled world fund. It is not a PFIC, so there is no Form 8621.',
        'A local bank suggests its own European fund. That would be a PFIC, so she says no.',
        'She keeps €20,000 in a Portuguese bank account. Her foreign accounts top $10,000, so she files an FBAR each year.',
        'She needs €3,000 a month, about $3,360, or $40,320 a year: a 4% withdrawal from $1,000,000. She keeps a buffer of 15% of a year’s spending, about $6,000, in euros.',
      ],
      result: 'No PFICs, one FBAR, a working brokerage account and a currency cushion: the boring setup that avoids expensive surprises.',
    },
    mistakes: [
      'Buying a local fund because the bank suggests it. For an American it is almost always a PFIC.',
      'Keeping a fake US address so the broker does not notice the move.',
      'Ignoring currency risk because the exchange rate looks fine on moving day.',
      'Skipping Medicare Part B at 65 without knowing the late-enrollment penalty if you return.',
    ],
    points: [
      'Ask your broker about foreign addresses before you move.',
      'Stick to US-domiciled funds or individual stocks and bonds: most foreign funds are PFICs.',
      'Expect FATCA forms at local banks and file an FBAR when foreign accounts top $10,000.',
      'Keep a currency buffer of 10–20% of a year’s spending.',
      'Renouncing citizenship is permanent; covered expatriates face exit-tax rules, including IRAs treated as paid out.',
    ],
    terms: ['PFIC', 'FBAR', 'FATCA', 'Currency risk', 'Citizenship-based taxation'],
    glossary: [
      { t: 'UCITS', d: 'The European rulebook for investment funds. Funds sold to Europeans usually follow it, and they are PFICs for Americans.' },
      { t: 'Covered expatriate', d: 'Someone who gives up US citizenship and meets the net worth, tax or compliance tests, so owes the exit tax.' },
    ],
    quiz: { q: 'Which of these is usually a PFIC for an American living abroad?', options: ['A US-listed ETF such as VTI', 'A European UCITS ETF', 'Shares of a US company'], answer: 1, why: 'Funds based outside the US, including European UCITS ETFs, are generally PFICs. US-listed funds and ordinary shares are not.' },
    sources: [
      { t: 'Bogleheads: Passive foreign investment company', u: 'https://www.bogleheads.org/wiki/Passive_foreign_investment_company' },
      { t: 'SSA: Your payments while you are outside the US (PDF)', u: 'https://www.ssa.gov/pubs/EN-05-10137.pdf' },
      { t: 'IRS: Expatriation tax', u: 'https://www.irs.gov/individuals/international-taxpayers/expatriation-tax' },
      { t: 'SSA: International agreements overview', u: 'https://www.ssa.gov/international/agreements_overview.html' },
    ],
  });

  SML.lessons.push({
    id: 'l-expat-health', course: 'fi-abroad', order: 4, title: 'Health care and insurance abroad', mins: 8, level: 'Intermediate',
    summary: 'Public systems, private and international plans, US trips and the Medicare question.',
    idea: 'Abroad, health cover comes in layers: a main plan, cover for the gaps, a plan for US trips, and a Medicare decision at 65.',
    widget: 'expatHealth',
    try: 'Choose your age, where you will live and how often you visit the US. The stack shows the layers you need.',
    body: [
      '<h3>Medicare stays home</h3><p>Medicare generally does not pay for care outside the US. If you move abroad at 65 or later, your main cover must come from your new country or a private plan. Medicare Part B costs $202.90 a month in 2026. Dropping it saves that money, but if you return and sign up later, the premium rises 10% for each full 12 months you could have had it. Many people keep Part B to keep the door home open; others drop it on purpose. Decide before you go.</p>',
      '<h3>Your main cover depends on the country and the visa</h3><ul><li><b>France:</b> residents can usually join public health insurance (PUMa) after about three months of stable residence, and most add a top-up policy. The long-stay visitor visa asks for private insurance at the start.</li><li><b>Spain:</b> the non-lucrative visa requires Spanish private health insurance with no copays or deductibles; travel insurance is not accepted.</li><li><b>Costa Rica:</b> legal residents are reported to be required to join the national system, the CAJA; confirm with Costa Rica’s immigration office.</li><li><b>Thailand:</b> the LTR “wealthy pensioner” visa needs at least $50,000 of health cover, or $100,000 in the bank.</li></ul><p>Visa rules change often: check the consulate’s current list before you buy anything.</p>',
      '<h3>Travel medical is not health insurance</h3><p>Nomad and travel medical plans are cheap for young travelers. One popular plan cost $62.72 per four weeks for ages 18 to 39 when checked, with a $250,000 overall limit. But they exclude pre-existing conditions and cancer treatment, cover the US only as an add-on, and limit time in your home country. They are fine for a healthy 30-year-old on the move, not as the only cover for a 60-year-old.</p>',
      '<h3>International expat plans</h3><p>International plans are built for people living abroad long term. Price depends on your age, the area of cover (worldwide excluding the US costs less), the deductible and your health history, and it rises as you age. Compare several insurers, and check whether the plan can be renewed for life and how it treats conditions you already have.</p>',
      '<h3>Compare with staying in the US</h3><p>Before 65, the alternative at home is a marketplace plan. In 2026 the national average benchmark silver plan for a 40-year-old costs about $625 a month with no subsidy, and older buyers pay much more. Moving back to the US usually opens a special enrollment window for marketplace coverage. See <a href="#l-aca">health insurance before 65</a> and <a href="#l-health-bridge">bridging to Medicare</a>.</p>',
    ],
    example: {
      title: 'Pat retires to Valencia at 62',
      intro: 'Made-up retiree; check the consulate and insurers for real terms.',
      steps: [
        'For Spain’s non-lucrative visa she buys Spanish private health insurance with no copays or deductibles. A travel policy would not be accepted.',
        'She visits family in the US three weeks a year, so she buys travel medical cover for those trips. Her Spanish plan does not cover the US.',
        'At 65 she must decide on Medicare Part B: $202.90 a month in 2026, or a 10% higher premium for each full year without it if she moves back later.',
        'She plans to stay for good, so she drops Part B and puts the $2,435 a year toward her Spanish plan.',
      ],
      result: 'Three layers, chosen on purpose: a plan her visa accepts, cover for US trips, and a Medicare decision made with the penalty in mind.',
    },
    mistakes: [
      'Assuming Medicare will pay for care abroad. It generally does not.',
      'Relying on a nomad plan as full health insurance in your 50s or 60s.',
      'Buying a policy before checking what your visa requires.',
      'Ignoring the Part B late-enrollment penalty when you might move back.',
    ],
    points: [
      'Medicare generally does not cover care outside the US.',
      'Your visa often decides your main cover: Spain wants private insurance with no copays; France opens its public system after a few months of residence.',
      'Travel medical plans exclude pre-existing conditions and are not full health insurance.',
      'Decide on Part B before 65: $202.90 a month in 2026, or a 10% penalty per year if you return late.',
    ],
    terms: ['Expat health insurance', 'Medicare', 'Passive income visa', 'ACA marketplace'],
    glossary: [
      { t: 'PUMa', full: 'Protection universelle maladie', d: 'France’s public health insurance, open to people who live in France stably.' },
      { t: 'Medical evacuation', d: 'Cover that flies you to a hospital able to treat you. Expensive without insurance.' },
    ],
    quiz: { q: 'You are 66 and living in Portugal. Does Medicare pay for a hospital stay in Lisbon?', options: ['Yes, Part A covers it', 'Generally no', 'Only if you have Part B'], answer: 1, why: 'Medicare generally does not cover care outside the US, so you need cover in your new country.' },
    sources: [
      { t: 'SSA: Your payments while you are outside the US (Medicare abroad)', u: 'https://www.ssa.gov/pubs/EN-05-10137.pdf' },
      { t: 'CMS: 2026 Medicare Parts A and B premiums and deductibles', u: 'https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles' },
      { t: 'Spain: non-lucrative residence visa (Consulate in Los Angeles)', u: 'https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-residencia-no-lucrativa.aspx' },
      { t: 'Thailand Long-Term Resident visa', u: 'https://ltr.boi.go.th/' },
    ],
  });
})();
