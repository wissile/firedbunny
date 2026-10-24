/* Stock Market Lessons: FIRE track, Stress-Test Your Plan part 2 (full FIRE planner, what-if stress tests). Fork F7. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const clamp = SML.clamp;
  const usd = (v) => F.usd(Math.round(v), 0);
  const k$ = (v) => {
    const a = Math.abs(v), s = v < 0 ? F.minus : '';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e3) return s + '$' + Math.round(a / 1e3) + 'K';
    return s + '$' + Math.round(a);
  };
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };

  /* ---------- 2026 federal figures (Rev. Proc. 2025-32), today's dollars ---------- */
  const TAX = {
    single: { br: [0, 12400, 50400, 105700, 201775, 256225, 640600], std: 16100, add65: 2050, cg0: 49450, cg15: 545500, niit: 200000, top12: 50400, ss1: 25000, ss2: 34000 },
    mfj: { br: [0, 24800, 100800, 211400, 403550, 512450, 768700], std: 32200, add65: 1650, cg0: 98900, cg15: 613700, niit: 250000, top12: 100800, ss1: 32000, ss2: 44000 },
  };
  const RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
  const FPL400 = { 1: 62600, 2: 84600, 4: 128600 };   // 400% of the 2025 poverty guidelines, used for 2026 coverage
  const PARTB = 202.90, MEDI_EXTRA = 200;               // Part B 2026 (CMS) + assumed supplement, drugs and out-of-pocket, per person per month
  const LIMIT415 = 72000, IRA = 7500;
  /* Couple's monthly cost incl. rent, Numbeo Oct 2026 midpoints, relative to Indianapolis (~$3,925). Rough. */
  const LOCS = [
    { k: 'mid', label: 'US Midwest (Indianapolis)', m: 1, us: true },
    { k: 'big', label: 'US big coastal city (San Francisco)', m: 2.2, us: true },
    { k: 'van', label: 'Van life in the US', m: 0.95, us: true },
    { k: 'lis', label: 'Lisbon, Portugal', m: 0.79 },
    { k: 'val', label: 'Valencia, Spain', m: 0.73 },
    { k: 'mex', label: 'Mexico City', m: 0.61 },
    { k: 'mer', label: 'Mérida, Mexico', m: 0.5 },
    { k: 'bali', label: 'Bali, Indonesia', m: 0.5 },
    { k: 'cm', label: 'Chiang Mai, Thailand', m: 0.38 },
  ];
  const DIV = 0.015;                                    // assumed qualified-dividend yield on the taxable account in retirement
  const FPL100 = { 1: 15650, 2: 21150, 4: 32150 };      // 2025 HHS guidelines, used for 2026 marketplace coverage
  /* 2026 required contribution, % of income (Rev. Proc. 2025-25), linear inside each band */
  function acaPct(f) {
    if (f < 133) return 2.10;
    if (f < 150) return 3.14 + (f - 133) / 17 * (4.19 - 3.14);
    if (f < 200) return 4.19 + (f - 150) / 50 * (6.60 - 4.19);
    if (f < 250) return 6.60 + (f - 200) / 50 * (8.44 - 6.60);
    if (f < 300) return 8.44 + (f - 250) / 50 * (9.96 - 8.44);
    return 9.96;
  }
  /* what a household pays for the benchmark plan in 2026: Medicaid under 138% FPL (expansion state assumed), credit to 400%, full price above */
  function acaCost(magi, hhN, full) {
    const f = magi / FPL100[hhN] * 100;
    if (f < 138) return { cost: 0, zone: 'medicaid', f };
    if (f <= 400) return { cost: Math.min(full, acaPct(f) / 100 * magi), zone: 'credit', f };
    return { cost: full, zone: 'cliff', f };
  }
  const BUCKETS = [
    { k: 'pre', label: 'Pre-tax 401(k)/IRA', f: 'f-info', s: 's-info', c: 'var(--info)' },
    { k: 'roth', label: 'Roth', f: 'f-vio', s: 's-vio', c: 'var(--violet)' },
    { k: 'tax', label: 'Taxable', f: 'f-acc', s: 's-acc', c: 'var(--accent)' },
    { k: 'hsa', label: 'HSA', f: 'f-up', s: 's-up', c: 'var(--up)' },
    { k: 'cash', label: 'Cash', f: 'f-mut', s: 's-mut', c: 'var(--muted)' },
  ];
  const BK = Object.fromEntries(BUCKETS.map((b) => [b.k, b]));
  const SRC_LABEL = { cash: 'cash', tax: 'taxable account', roth: 'Roth', pre: 'pre-tax 401(k)/IRA', hsa: 'HSA', ss: 'Social Security' };

  const PRESETS = {
    nomad: { label: 'Lean nomad', p: { age: 32, hh: 'single', tax: 130000, basis: 75, pre: 85000, roth: 30000, hsa: 6000, cash: 20000, save: 42000, prePct: 40, spend: 40000, loc: 'cm', travel: 9000, health: 2400, ss: 1600, ssAge: 67, ret: 7, infl: 3, path: 'cautious', rule: 'fixed', ladder: 'std', stop: 41 } },
    lisbon: { label: 'Couple in Lisbon', p: { age: 41, hh: 'couple', tax: 420000, basis: 65, pre: 520000, roth: 110000, hsa: 30000, cash: 50000, save: 80000, prePct: 50, spend: 60000, loc: 'lis', travel: 12000, health: 6000, ss: 3600, ssAge: 67, ret: 7, infl: 3, path: 'cautious', rule: 'fixed', ladder: 'std', stop: 46 } },
    family: { label: 'Family of 4, Midwest', p: { age: 38, hh: 'family', tax: 200000, basis: 75, pre: 420000, roth: 80000, hsa: 25000, cash: 40000, save: 55000, prePct: 60, spend: 70000, loc: 'mid', travel: 5000, health: 26000, ss: 3900, ssAge: 67, ret: 7, infl: 3, path: 'cautious', rule: 'fixed', ladder: 'std', stop: 52 } },
    fat: { label: 'Fat FIRE', p: { age: 44, hh: 'couple', tax: 2200000, basis: 55, pre: 1400000, roth: 250000, hsa: 80000, cash: 200000, save: 220000, prePct: 30, spend: 90000, loc: 'big', travel: 30000, health: 26000, ss: 5500, ssAge: 70, ret: 7, infl: 3, path: 'cautious', rule: 'fixed', ladder: 'b12', stop: 52 } },
  };
  const DEF = PRESETS.lisbon.p;
  const STORE_KEY = 'fire-plan';
  const loadPlan = () => { try { const v = SML.store.get(STORE_KEY, null); return v && typeof v === 'object' && v.age ? Object.assign({}, DEF, v) : null; } catch (e) { return null; } };
  const savePlan = (p) => { try { SML.store.set(STORE_KEY, p); } catch (e) {} };

  /* ---------- tax engine ---------- */
  function ordTax(ti, t) { let tax = 0; for (let i = 0; i < t.br.length; i++) { const lo = t.br[i], hi = i + 1 < t.br.length ? t.br[i + 1] : Infinity; if (ti > lo) tax += (Math.min(ti, hi) - lo) * RATES[i]; } return tax; }
  function fedTax(ord, ltcg, ss, fs, n65) {
    const t = TAX[fs];
    const pi = ord + ltcg + 0.5 * ss;
    let tss = 0;
    if (ss > 0 && pi > t.ss1) {
      tss = pi <= t.ss2 ? Math.min(0.5 * ss, 0.5 * (pi - t.ss1)) : Math.min(0.85 * ss, 0.85 * (pi - t.ss2) + Math.min(0.5 * ss, 0.5 * (t.ss2 - t.ss1)));
    }
    const agi = ord + tss + ltcg;
    const ti = Math.max(0, agi - (t.std + t.add65 * n65));
    const ordTI = Math.max(0, ti - ltcg), cgTI = ti - ordTI;
    const at0 = Math.min(cgTI, Math.max(0, t.cg0 - ordTI));
    const rem = cgTI - at0;
    const at15 = Math.min(rem, Math.max(0, t.cg15 - Math.max(ordTI, t.cg0)));
    const niit = 0.038 * Math.max(0, Math.min(ltcg, agi - t.niit));
    return { tax: ordTax(ordTI, t) + 0.15 * at15 + 0.2 * (rem - at15) + niit, agi, tss };
  }
  const ssFactor = (age) => { if (age >= 67) return 1 + (Math.min(age, 70) - 67) * 0.08; const m = (67 - age) * 12; return 1 - (Math.min(m, 36) * 5 / 9 + Math.max(0, m - 36) * 5 / 12) / 100; };

  /* ---------- the simulation: one row per year, start-of-year balances, today's dollars ---------- */
  function simulate(p, o) {
    o = o || {}; const st = o.stress || {};
    const fs = p.hh === 'single' ? 'single' : 'mfj', adults = p.hh === 'single' ? 1 : 2, hhN = p.hh === 'family' ? 4 : adults;
    const t = TAX[fs];
    const loc = LOCS.find((l) => l.k === p.loc) || LOCS[0];
    let stop = Math.max(p.age, o.stop != null ? o.stop : p.stop);
    if (st.more) stop += 1;
    let r0 = (1 + p.ret / 100) / (1 + p.infl / 100) - 1;
    if (p.path === 'cautious') r0 -= 0.015;
    const b = { cash: p.cash, tax: p.tax, basis: p.tax * p.basis / 100, roth: p.roth, rothC: p.roth * 0.5, pre: p.pre, hsa: p.hsa };
    const ladder = []; let rothOut = 0;
    const rule55 = stop >= 55;
    const yrs = [];
    let shortAge = null, penaltyYears = [], cliffYears = [], medicaidYears = [], creditYears = [], convAcaCost = [], totalTax = 0, atStop = 0, prevR = 0, firstNeed = 0, firstTax = 0, convTotal = 0;
    const us = loc.us;
    const kidCost = st.child ? 16000 : 0, ptAmt = st.pt ? (st.ptAmt || 20000) : 0;
    for (let a = p.age; a <= 95; a++) {
      const yi = a - p.age, yr = 2026 + yi, ry = a - stop, retired = a >= stop;
      const total = b.cash + b.tax + b.roth + b.pre + b.hsa;
      const row = { a, cash: b.cash, tax: b.tax, roth: b.roth, pre: b.pre, hsa: b.hsa, total, retired, need: 0, ss: 0, taxPaid: 0, conv: 0, src: {}, short: 0, pt: 0 };
      if (a === stop) atStop = total;
      let r = r0;
      if (retired && ry === 0 && (p.path === 'crash' || st.crash)) r = -0.30;
      if (st.infl && retired && ry < 10) r -= 0.03;
      if (!retired) {
        const save = Math.max(0, p.save - (yi < 18 ? kidCost : 0));
        const preC = Math.min(save * p.prePct / 100, LIMIT415 * adults);
        let rest = save - preC; const rothC = Math.min(rest, IRA * adults); rest -= rothC;
        b.tax *= 1 + r; b.roth *= 1 + r; b.pre *= 1 + r; b.hsa *= 1 + r;
        b.pre += preC; b.roth += rothC; b.rothC += rothC; b.tax += rest; b.basis += rest;
      } else {
        const n65 = a >= 65 ? adults : 0;
        const flex = p.rule === 'flex' && ry > 0 && (prevR < 0 || total < 0.8 * atStop) ? 0.9 : 1;
        const living = (p.spend * loc.m * (st.abroad ? 0.7 : 1) + p.travel + (st.abroad ? 6000 : 0)) * flex;
        const medicare = adults * (PARTB + MEDI_EXTRA) * 12;
        const extra = (yi < 18 ? kidCost : 0) + (st.health && ry === 3 ? 40000 : 0);
        let ss = a >= p.ssAge ? p.ss * 12 * ssFactor(p.ssAge) : 0;
        if (st.sscut && yr >= 2033) ss *= 0.78;
        const pt = ry < 10 ? ptAmt : 0, ptNet = pt * (1 - 0.0765);
        const usAca = a < 65 && us && !st.abroad;
        /* HSA pays health costs from 65, tax-free */
        const hsaMed = a >= 65 ? Math.min(b.hsa, medicare) : 0;
        b.hsa -= hsaMed;
        /* qualified dividends from the taxable account: income you can spend */
        const div = b.tax * DIV; b.tax -= div;
        /* Roth conversion ladder */
        let conv = 0;
        if (p.ladder !== 'off' && a < 73 && b.pre > 0) {
          const ceiling = t.std + t.add65 * n65 + (p.ladder === 'b12' ? t.top12 : 0);
          conv = clamp(ceiling - pt - 0.85 * ss, 0, b.pre);
          b.pre -= conv; b.roth += conv; ladder.push({ amt: conv, ready: a + 5 }); convTotal += conv;
        }
        const seasoned = ladder.reduce((s2, l) => s2 + (l.ready <= a ? l.amt : 0), 0);
        const early = a < 59.5;
        const preFree = !early || (rule55 && a >= 55);
        /* withdraw in order, grossing up for tax and (in the US before 65) the marketplace premium after the credit */
        const draw = (target) => {
          const d = { cash: 0, tax: 0, roth: 0, pre: 0, hsa: 0, gain: 0, pen: 0, short: 0 };
          let rem = Math.max(0, target);
          const take = (k, avail) => { const x = Math.min(rem, Math.max(0, avail)); d[k] += x; rem -= x; return x; };
          take('cash', b.cash);
          const tx = take('tax', b.tax); if (tx > 0 && b.tax > 0) d.gain = tx * Math.max(0, 1 - b.basis / b.tax);
          const rothAvail = early ? Math.min(b.roth, b.rothC + seasoned - rothOut) : b.roth;
          if (preFree) { take('pre', b.pre); take('roth', rothAvail); }
          else { take('roth', rothAvail); const pw = take('pre', b.pre); d.pen += pw * 0.1; }
          if (rem > 0 && early) { const extraR = take('roth', b.roth - d.roth); d.pen += extraR * 0.1; }
          if (rem > 0 && a >= 65) take('hsa', b.hsa);
          d.short = rem; return d;
        };
        let health = a < 65 ? p.health : medicare, aca = null;
        const base = living + extra - hsaMed - ss - ptNet - div;
        let taxNow = 0, d = draw(base + health), ft;
        for (let it = 0; it < 14; it++) {
          ft = fedTax(conv + d.pre + d.hsa + pt, d.gain + div, ss, fs, n65);
          if (usAca) { aca = acaCost(ft.agi + (ss - ft.tss), hhN, p.health); health = aca.cost; }
          const next = ft.tax + d.pen;
          const dn = draw(base + health + next);
          const same = Math.abs(next - taxNow) < 0.5 && Math.abs(dn.tax + dn.pre + dn.roth + dn.cash - (d.tax + d.pre + d.roth + d.cash)) < 0.5;
          taxNow = next; d = dn;
          if (same) break;
        }
        ft = fedTax(conv + d.pre + d.hsa + pt, d.gain + div, ss, fs, n65);
        taxNow = ft.tax + d.pen;
        const acaMagi = ft.agi + (ss - ft.tss);
        let convAca = 0;
        if (usAca) { aca = acaCost(acaMagi, hhN, p.health); health = aca.cost; if (conv > 0) convAca = Math.max(0, aca.cost - acaCost(acaMagi - conv, hhN, p.health).cost); }
        const need = living + extra + health;
        const cashNeed = base + health;
        /* apply */
        if (d.tax > 0 && b.tax > 0) b.basis -= b.basis * (d.tax / b.tax);
        b.cash -= d.cash; b.tax -= d.tax; b.roth -= d.roth; b.pre -= d.pre; b.hsa -= d.hsa;
        if (early) rothOut += d.roth;
        const covered = d.cash + d.tax + d.roth + d.pre + d.hsa;
        const surplus = covered - (cashNeed + taxNow);
        if (surplus > 1 && d.short <= 1) { b.tax += surplus; b.basis += surplus; }
        if (d.short > 1 && shortAge === null) shortAge = a;
        if (d.pen > 1) penaltyYears.push(a);
        if (usAca) { if (aca.zone === 'cliff') cliffYears.push(a); else if (aca.zone === 'medicaid') medicaidYears.push(a); else creditYears.push(a); }
        if (convAca > 0) convAcaCost.push(convAca);
        Object.assign(row, { need, ss, pt, div, health, aca: aca ? aca.zone : '', convAca, taxPaid: taxNow, conv, short: d.short, magi: acaMagi, src: { cash: d.cash, tax: d.tax + div, roth: d.roth, pre: d.pre, hsa: d.hsa + hsaMed } });
        if (ry === 0) { firstNeed = need; firstTax = taxNow; }
        totalTax += taxNow;
        b.tax *= 1 + r; b.roth *= 1 + r; b.pre *= 1 + r; b.hsa *= 1 + r;
        ['cash', 'tax', 'roth', 'pre', 'hsa'].forEach((k) => { if (b[k] < 0.5) b[k] = 0; });
        if (b.basis < 0) b.basis = 0;
      }
      prevR = r;
      yrs.push(row);
    }
    const last = yrs[yrs.length - 1];
    const endTotal = b.cash + b.tax + b.roth + b.pre + b.hsa;
    return { yrs, ok: shortAge === null, shortAge, penaltyYears, cliffYears, medicaidYears, creditYears, convAcaCost, totalTax, atStop, firstNeed, firstTax, endTotal, stop, convTotal, hhN, fs, last, us };
  }
  function earliest(p, stress) { for (let s = p.age; s <= 75; s++) { if (simulate(p, { stop: s, stress }).ok) return s; } return null; }
  SML.firePlanSim = simulate;

  /* group retirement years by where the money came from */
  function phases(sim) {
    const out = [];
    sim.yrs.filter((y) => y.retired).forEach((y) => {
      const s = y.src || {}; const tot = Object.values(s).reduce((a, b) => a + b, 0);
      let keys = Object.keys(s).filter((k) => s[k] > Math.max(500, tot * 0.12)).sort((a, b) => s[b] - s[a]).slice(0, 2);
      if (y.short > 1) keys = ['short'];
      else if (!keys.length) keys = ['ss'];
      const label = keys.join('+') + (y.ss > 0 ? '|ss' : ''); const g = out[out.length - 1];
      if (g && g.label === label) { g.to = y.a; g.conv += y.conv; g.n++; g.ss += y.ss; g.tax += y.taxPaid; }
      else out.push({ label, keys, from: y.a, to: y.a, conv: y.conv, n: 1, ss: y.ss, tax: y.taxPaid });
    });
    // merge 1-year blips into the previous group
    const merged = [];
    out.forEach((g) => { const prev = merged[merged.length - 1]; if (prev && g.n === 1 && g.keys[0] !== 'short' && (g.ss > 0) === (prev.ss > 0)) { prev.to = g.to; prev.conv += g.conv; prev.n++; prev.ss += g.ss; prev.tax += g.tax; } else merged.push(g); });
    return merged.slice(0, 7);
  }
  const mainSrc = (y) => { if (y.short > 1) return 'short'; const s = y.src || {}; let best = 'ss', bv = 500; Object.keys(s).forEach((k) => { if (s[k] > bv) { bv = s[k]; best = k; } }); return best; };
  const srcFill = (k) => (k === 'short' ? 'f-dn' : k === 'ss' ? 'f-ink' : BK[k].f);

  SML.css(`
.fp-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:12px 16px;background:var(--surface)}
.fp-steps button{display:flex;align-items:center;gap:8px;min-height:44px;padding:6px 10px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--muted);font:600 12px/1.2 var(--sans);cursor:pointer;text-align:left;transition:border-color .15s,background-color .15s,color .15s}
.fp-steps button i{font:600 11px var(--mono);font-style:normal;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid var(--input);flex:0 0 auto}
.fp-steps button.on{border-color:var(--accent);background:var(--accent-t);color:var(--ink)}
.fp-steps button.on i{background:var(--accent);border-color:var(--accent);color:var(--on-acc)}
.fp-panel{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.fp-panel .fp-wide{grid-column:1/-1}
.fp-panel .fp-lab{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);margin-bottom:7px;display:block}
.fp-panel .seg{flex-wrap:wrap}
.fp-stop{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:flex-end;padding:14px 18px}
.fp-stop .ctl{flex:1 1 260px}
.fp-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.fp-legend i{display:inline-block;width:12px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px;opacity:.75}
.fp-order{padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:var(--surface)}
.fp-order h4{font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.2em;color:var(--muted)}
.fp-order ol{list-style:none;display:flex;flex-direction:column;gap:0}
.fp-order li{display:grid;grid-template-columns:76px minmax(0,1fr);gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.fp-order li:first-child{border-top:0}
.fp-order li b{font:600 13px var(--mono);color:var(--ink);white-space:nowrap}
.fp-order li .dots{display:inline-flex;gap:4px;margin-right:6px;vertical-align:1px}
.fp-order li .dots i{width:9px;height:9px;border-radius:50%;display:inline-block}
.fp-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line)}
.fw-chips{display:flex;flex-direction:column;gap:10px;padding:14px 16px}
.fw-chips .lab{font:500 10.5px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.fw-fix{padding:14px 18px;display:flex;flex-direction:column;gap:10px;background:var(--surface)}
.fw-fix h4{font:600 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.2em;color:var(--muted)}
.fw-fix ul{list-style:none;display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.fw-fix li{border:1px solid var(--line);border-left:3px solid var(--up);border-radius:6px;padding:10px 12px;font-size:14px;line-height:1.45;color:color-mix(in srgb,var(--ink) 88%,transparent);background:var(--bg)}
.fw-fix li b{display:block;font:600 15px var(--mono);color:var(--up);margin-bottom:2px}
.fw-fix p{font-size:14px;color:var(--muted)}
@media (max-width:560px){.fp-steps{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 12px}.fp-order li{grid-template-columns:64px minmax(0,1fr)}}
`);

  /* ---------- shared chart pieces ---------- */
  function ageAxis(x, a0, a1, yb, compact) {
    let g = ''; const step = compact ? 10 : 5;
    for (let a = Math.ceil(a0 / step) * step; a <= a1; a += step) g += S.line(x(a), yb, x(a), yb + 4, 's-line') + S.text(x(a), yb + 16, String(a), 'xs mono', 'middle');
    return g;
  }
  function yAxis(top, y, L, W, R, compact) {
    let g = '';
    SML.ticks(0, top, compact ? 4 : 5).forEach((v) => { g += S.line(L, y(v), W - R, y(v), 's-grid') + S.text(L - 6, y(v) + 4, k$(v), 'xs mono', 'end'); });
    return g;
  }
  const niceTop = (v) => { const t = SML.ticks(0, Math.max(1, v) * 1.08, 5); return t[t.length - 1] < v ? t[t.length - 1] + (t[1] - t[0]) : t[t.length - 1]; };

  /* ======================================================================
     1. firePlanner
     ====================================================================== */
  SML.widgets.firePlanner = function (root) {
    const id = SML.uid('fp');
    const saved = loadPlan();
    let p = Object.assign({}, saved || DEF);
    const field = (k, label, step) => ui.field({ id: id + '-' + k, label, value: p[k], step: step || 1000, min: 0 });
    const sl = (k, label, min, max, step, fmt) => ui.slider({ id: id + '-' + k, label, min, max, step, value: p[k], fmt });
    const locSel = `<label class="fld" for="${id}-loc"><span>Where you'll live</span><select id="${id}-loc">${LOCS.map((l) => `<option value="${l.k}"${l.k === p.loc ? ' selected' : ''}>${l.label} · ×${l.m}</option>`).join('')}</select></label>`;
    const steps = ['You', 'Money now', 'Life after', 'Assumptions'];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Your FIRE plan, year by year</span>${ui.seg(id + '-pre', Object.keys(PRESETS).map((k) => ({ v: k, label: PRESETS[k].label })), saved ? '' : 'lisbon', 'Example plan')}</div>
      <div class="wg-fig"><div class="fp-svg"></div><div class="fp-legend">${BUCKETS.map((b) => `<span><i style="background:${b.c}"></i>${b.label}</span>`).join('')}<span><i style="background:var(--ink)"></i>Social Security covers it</span></div></div>
      <div class="fp-stop">${ui.slider({ id: id + '-stop', label: 'Stop working at age (or drag the amber line)', min: 25, max: 75, step: 1, value: p.stop, fmt: 'plain' })}<button type="button" class="btn btn-p sm" id="${id}-early">Use the earliest age</button></div>
      <div class="wg-read">${ui.stat('Earliest you can stop', id + '-fi', 'hl')}${ui.stat('Money lasts', id + '-last')}${ui.stat('Invested when you stop', id + '-at')}${ui.stat('Spending, first year', id + '-need')}${ui.stat('US federal tax, first year', id + '-tax1')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="fp-steps" role="tablist" aria-label="Plan inputs">${steps.map((s, i) => `<button type="button" role="tab" aria-selected="${i === 0}" class="${i === 0 ? 'on' : ''}" data-s="${i}"><i>${i + 1}</i>${s}</button>`).join('')}</div>
      <div class="wg-ctrl fp-panel" data-s="0">
        ${sl('age', 'Your age today', 20, 65, 1, 'plain')}
        <div><span class="fp-lab">Household</span>${ui.seg(id + '-hh', [{ v: 'single', label: 'Single' }, { v: 'couple', label: 'Couple' }, { v: 'family', label: 'Family of 4' }], p.hh, 'Household')}</div>
        <p class="note fp-wide">Couples and families are taxed as married filing jointly. A family of four also gets a higher health-subsidy line.</p>
      </div>
      <div class="wg-ctrl fp-panel" data-s="1" hidden>
        ${field('tax', 'Taxable brokerage ($)')}${sl('basis', 'Of which you paid in (cost basis)', 0, 100, 5, 'pct')}
        ${field('pre', 'Pre-tax 401(k) / IRA ($)')}${field('roth', 'Roth IRA / 401(k) ($)')}
        ${field('hsa', 'HSA ($)')}${field('cash', 'Cash and savings ($)')}
        ${field('save', 'You save per year ($, incl. match)')}${sl('prePct', 'Share of savings into pre-tax', 0, 100, 5, 'pct')}
      </div>
      <div class="wg-ctrl fp-panel" data-s="2" hidden>
        ${field('spend', 'Living costs per year at US Midwest prices ($)')}${locSel}
        ${field('travel', 'Travel per year ($)', 500)}${sl('health', 'Health cover before 65, full price per year', 0, 40000, 500, 'usd0')}
        ${sl('ss', 'Social Security at 67, per month (household)', 0, 7000, 50, 'usd0')}${sl('ssAge', 'Claim Social Security at', 62, 70, 1, 'plain')}
        <p class="note fp-wide">In a US location the planner takes the 2026 marketplace credit off this price each year, based on that year's income. Abroad, enter your private or expat plan.</p>
      </div>
      <div class="wg-ctrl fp-panel" data-s="3" hidden>
        ${sl('ret', 'Average return before inflation', 3, 10, 0.5, 'pct1')}${sl('infl', 'Inflation', 1, 5, 0.25, (v) => F.num(v, 2) + '%')}
        <div><span class="fp-lab">Market path</span>${ui.seg(id + '-path', [{ v: 'avg', label: 'Average' }, { v: 'cautious', label: 'Cautious' }, { v: 'crash', label: 'Crash at start' }], p.path, 'Market path')}</div>
        <div><span class="fp-lab">Spending rule</span>${ui.seg(id + '-rule', [{ v: 'fixed', label: 'Fixed' }, { v: 'flex', label: 'Flexible' }], p.rule, 'Spending rule')}</div>
        <div class="fp-wide"><span class="fp-lab">Roth conversion ladder</span>${ui.seg(id + '-ladder', [{ v: 'off', label: 'Off' }, { v: 'std', label: 'Up to the standard deduction' }, { v: 'b12', label: 'Through the 12% bracket' }], p.ladder, 'Roth ladder')}</div>
      </div>
      <div class="fp-order"><h4>How the money comes out</h4><ol id="${id}-order"></ol></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" id="${id}-reset">Reset to the example</button><span class="note">Your inputs stay in this browser only.</span></div>
      <div class="wg-note">Simplified model in today's dollars: returns are after inflation, federal tax only (2026 brackets, standard deduction, 0% capital-gains band, Social Security taxation), no state tax, no RMDs, no tax on dividends while you work. In retirement the taxable account pays a 1.5% qualified dividend, which you spend and which counts as income. In a US location before 65 the 2026 marketplace credit is taken off your health price based on income (Medicaid under 138% of the poverty line, expansion state assumed; no credit above 400%). Abroad, only US federal tax is shown: the host country's tax is not modelled. Pre-tax savings include any employer match, capped at the $72,000 yearly limit per adult. From 65 health costs become Medicare: Part B ($202.90 a month in 2026) plus an assumed $200 a month per person for a supplement, drugs and out-of-pocket costs, paid from the HSA first. Half of today's Roth balance is assumed to be contributions you can take out any time. The Rule of 55 is applied if you stop at 55 or later. Place multipliers compare a couple's monthly costs including rent (Numbeo, October 2026) with Indianapolis: rough. Hover or tap the chart for any year. Not advice.</div>`;
    const figWrap = root.querySelector('.wg-fig'), fig = root.querySelector('.fp-svg');
    figWrap.style.position = 'relative';
    const tip = document.createElement('div'); tip.className = 'wg-tip'; tip.hidden = true; figWrap.appendChild(tip);
    const stw = ui.wire(root, (e) => onChange(e));
    const NUMS = ['age', 'basis', 'prePct', 'health', 'ss', 'ssAge', 'ret', 'infl', 'tax', 'pre', 'roth', 'hsa', 'cash', 'save', 'spend', 'travel'];
    let sim = null, fi = null, geom = null, touched = false;

    function readInputs() {
      const q = Object.assign({}, p);
      NUMS.forEach((k) => { const v = stw.n(id + '-' + k); q[k] = isFinite(v) ? Math.max(0, v) : 0; });
      q.age = clamp(Math.round(q.age), 18, 70);
      q.hh = stw.seg(id + '-hh') || q.hh; q.path = stw.seg(id + '-path') || q.path; q.rule = stw.seg(id + '-rule') || q.rule; q.ladder = stw.seg(id + '-ladder') || q.ladder;
      const sel = $id(id + '-loc'); if (sel) q.loc = sel.value;
      q.stop = stw.n(id + '-stop'); if (!isFinite(q.stop)) q.stop = p.stop;
      return q;
    }
    function writeInputs(q) {
      NUMS.forEach((k) => stw.set(id + '-' + k, q[k]));
      stw.setSeg(id + '-hh', q.hh); stw.setSeg(id + '-path', q.path); stw.setSeg(id + '-rule', q.rule); stw.setSeg(id + '-ladder', q.ladder);
      const sel = $id(id + '-loc'); if (sel) sel.value = q.loc;
      stw.set(id + '-stop', q.stop);
    }
    function onChange(e) {
      const t = e && e.target; touched = true;
      if (t && t.closest && t.closest('#' + id + '-pre')) {
        const k = stw.seg(id + '-pre'); if (PRESETS[k]) { p = Object.assign({}, PRESETS[k].p); writeInputs(p); }
      } else {
        p = readInputs();
        if (t && t.closest && !t.closest('#' + id + '-stop')) stw.setSeg(id + '-pre', '');
      }
      update();
    }
    root.querySelectorAll('.fp-steps button').forEach((bt) => bt.addEventListener('click', () => {
      const s = bt.dataset.s;
      root.querySelectorAll('.fp-steps button').forEach((x) => { x.classList.toggle('on', x === bt); x.setAttribute('aria-selected', x === bt); });
      root.querySelectorAll('.fp-panel').forEach((pn) => { pn.hidden = pn.dataset.s !== s; });
    }));
    $id(id + '-early').addEventListener('click', () => { if (fi !== null) { touched = true; p.stop = fi; stw.set(id + '-stop', fi); update(); } });
    $id(id + '-reset').addEventListener('click', () => { p = Object.assign({}, DEF); writeInputs(p); stw.setSeg(id + '-pre', 'lisbon'); touched = false; try { SML.store.set(STORE_KEY, null); } catch (e) {} update(); });

    function update() {
      if (p.stop < p.age) { p.stop = p.age; stw.set(id + '-stop', p.stop); }
      fi = earliest(p);
      sim = simulate(p);
      if (touched) savePlan(p);
      draw(true);
      // stats
      sv(id + '-fi', fi === null ? 'Not by 75' : 'Age ' + fi + (fi === p.age ? ' (now)' : ''), fi === null ? 'dn' : 'up');
      sv(id + '-last', sim.ok ? 'Past 95' : 'Runs out at ' + sim.shortAge, sim.ok ? 'up' : 'dn');
      sv(id + '-at', k$(sim.atStop));
      sv(id + '-need', k$(sim.firstNeed));
      sv(id + '-tax1', usd(sim.firstTax));
      // coach
      const msg = $id(id + '-msg'); let html;
      const wr = sim.atStop ? (sim.firstNeed - (sim.yrs.find((y) => y.a === sim.stop) || {}).ss) / sim.atStop * 100 : 0;
      if (fi === null) html = ui.msg('dn', 'Not yet', `With these numbers the money runs short even if you work to 75. Save more, spend less, or pick a cheaper place (step 2 and 3).`);
      else if (!sim.ok) html = ui.msg('dn', 'Too early', `Stopping at ${sim.stop} runs out of money at <b>${sim.shortAge}</b>. The earliest age that lasts past 95 with these numbers is <b>${fi}</b>.`);
      else {
        const slack = sim.stop - fi;
        const pathTip = p.path === 'avg' ? ' The Average path is a smooth line markets never follow: try Cautious or Crash at start in step 4.' : p.path === 'cautious' ? ' Try Crash at start in step 4 to see a bad first year.' : '';
        html = ui.msg('up', 'Lasts', `Stopping at <b>${sim.stop}</b>, your first-year spending of ${k$(sim.firstNeed)} is about ${F.num(Math.max(0, wr), 1)}% of what you have invested, and the plan ends at 95 with <b>${k$(sim.endTotal)}</b> in today's dollars.${slack > 0 ? ` That is ${slack} year${slack > 1 ? 's' : ''} later than the earliest age, which buys slack.` : ' This is the earliest age, so there is no slack.'}${pathTip}`);
      }
      const extras = [];
      const locNow = LOCS.find((l) => l.k === p.loc) || LOCS[0];
      if (!locNow.us) extras.push(`Living in ${locNow.label}: the planner shows US federal tax only. Your new country usually taxes residents on worldwide income, and a treaty decides who taxes what, so your real tax can be higher (<a href="#l-us-tax-abroad">US taxes abroad</a>, <a href="#l-treaty-france">the France example</a>). Health is your private or expat plan; the US marketplace does not apply.`);
      if (sim.convAcaCost.length) { const avg = sim.convAcaCost.reduce((x, y) => x + y, 0) / sim.convAcaCost.length; extras.push(`Your Roth conversions raise the income the marketplace credit is based on, costing about <b>${k$(avg)}</b> a year of lost credit in ${sim.convAcaCost.length} year${sim.convAcaCost.length > 1 ? 's' : ''} before 65: a hidden tax. Converting less until 65 can pay off.`); }
      if (sim.medicaidYears.length) extras.push(`In ${sim.medicaidYears.length} year${sim.medicaidYears.length > 1 ? 's' : ''} your income is under 138% of the poverty line, so the plan assumes Medicaid at $0. That only applies in expansion states, and from 2027 most adults under 65 must show 80 hours a month of work, study or volunteering.`);
      if (sim.penaltyYears.length) extras.push(`From ${sim.penaltyYears[0]} the plan has to take pre-tax or Roth earnings early and pays a 10% penalty in ${sim.penaltyYears.length} year${sim.penaltyYears.length > 1 ? 's' : ''}. A bigger taxable account, an earlier ladder or a <a href="#l-early-access">72(t) plan</a> avoids it.`);
      if (sim.cliffYears.length) extras.push(`In ${sim.cliffYears.length} year${sim.cliffYears.length > 1 ? 's' : ''} before 65 your income is above the 400% poverty line (${usd(FPL400[sim.hhN])} for ${sim.hhN === 1 ? 'one' : sim.hhN === 2 ? 'two' : 'four'} in 2026), so you pay the full health price with no credit. Smaller conversions or sales can keep you under it (<a href="#l-aca">health lesson</a>).`);
      msg.innerHTML = html + (extras.length ? `<span style="display:block;margin-top:6px;color:var(--muted)">${extras.join(' ')}</span>` : '');
      if (extras.length) { const sp = msg.querySelector('span:last-child'); sp.style.flexBasis = '100%'; msg.style.flexWrap = 'wrap'; }
      // order list
      const ol = $id(id + '-order'); const ph = phases(sim);
      ol.innerHTML = ph.length ? ph.map((g) => {
        const ages = g.from === g.to ? String(g.from) : g.from + '–' + g.to;
        const dots = g.keys.map((k) => `<i style="background:${k === 'short' ? 'var(--down)' : k === 'ss' ? 'var(--ink)' : BK[k].c}"></i>`).join('');
        let txt;
        if (g.keys[0] === 'short') txt = '<span style="color:var(--down)">Not enough money left: spending is not covered.</span>';
        else if (g.keys[0] === 'ss') txt = 'Social Security and HSA cover the bills; the rest keeps growing.';
        else txt = 'Mostly from your ' + g.keys.map((k) => SRC_LABEL[k]).join(', then ') + '.';
        if (g.conv > 500) txt += ` Converts about ${k$(g.conv / g.n)} a year from pre-tax to Roth.`;
        if (g.ss > 0 && g.keys[0] !== 'ss') txt += ` Social Security adds ${k$(g.ss / g.n)} a year.`;
        txt += ` Federal tax about ${k$(g.tax / g.n)} a year.`;
        return `<li><b><span class="dots">${dots}</span>${ages}</b><span>${txt}</span></li>`;
      }).join('') : `<li><b>—</b><span>You are still working through 95 in this plan.</span></li>`;
    }

    const draw = ui.responsive(fig, (W) => {
      if (!sim) return;
      const compact = W < 520;
      const H = Math.round(clamp(W * 0.5, 280, 390));
      const L = compact ? 44 : 56, R = 12, T = 30, B = 52;
      const ys = sim.yrs, a0 = p.age, a1 = 95;
      const x = SML.lin(a0, a1, L, W - R);
      const top = niceTop(Math.max(...ys.map((r) => r.total)));
      const y = SML.lin(0, top, H - B, T);
      let g = yAxis(top, y, L, W, R, compact);
      // markers
      const marks = [{ a: 59.5, t: '59½' }, { a: 65, t: 'Medicare' }, { a: p.ssAge, t: 'SS' }];
      marks.forEach((m) => { if (m.a > a0 && m.a < a1) g += S.line(x(m.a), T, x(m.a), H - B, 's-grid dash2'); });
      // stacked areas
      let cum = ys.map(() => 0);
      BUCKETS.forEach((bk) => {
        const lo = cum.slice(); cum = cum.map((c, i) => c + ys[i][bk.k]);
        if (!ys.some((r) => r[bk.k] > 0)) return;
        const topPts = ys.map((r, i) => [x(r.a), y(cum[i])]);
        const loPts = ys.map((r, i) => [x(r.a), y(lo[i])]).reverse();
        g += S.polygon(topPts.concat(loPts), bk.f, ' opacity=".55"') + S.poly(topPts, bk.s + ' w15');
      });
      g += S.poly(ys.map((r) => [x(r.a), y(r.total)]), 's-ink w2');
      g += S.line(L, H - B + 0.5, W - R, H - B + 0.5, 's-line');
      // source band
      const bw = x(a0 + 1) - x(a0), by = H - B + 22;
      ys.forEach((r) => { if (r.retired) g += S.rect(x(r.a) - bw / 2, by, Math.max(1, bw - 0.6), 8, srcFill(mainSrc(r)), 0, ' opacity=".85"'); });
      if (!compact) g += S.text(L - 6, by + 8, 'paid from', 'xs', 'end');
      g += ageAxis(x, a0, a1, H - B + 32, compact);
      // marker labels at top (skip near the stop label)
      const stopX = x(sim.stop);
      if (!compact) { const used = [stopX]; marks.forEach((m) => { const mx = x(m.a); if (m.a > a0 && m.a < a1 && used.every((u) => Math.abs(mx - u) > 56)) { g += S.text(mx, T - 8, m.t, 'xs mono', 'middle'); used.push(mx); } }); }
      // earliest marker
      if (fi !== null && fi !== sim.stop && fi >= a0) {
        g += S.line(x(fi), T, x(fi), H - B, 's-up w15 dash2');
        if (Math.abs(x(fi) - stopX) > 64) g += S.text(clamp(x(fi), L + 30, W - R - 30), H - B - 8, 'earliest ' + fi, 'sm up b', 'middle');
      }
      // depletion
      if (!sim.ok) {
        g += S.circle(x(sim.shortAge), y(0), 6, 'f-dn') + S.text(clamp(x(sim.shortAge), L + 50, W - R - 50), y(0) - 14, 'runs out at ' + sim.shortAge, 'sm dn b', 'middle');
      }
      g += S.rect(L, T, W - R - L, H - B - T, 'hit', 0, ' fill="transparent"') + '<g class="fp-hov" style="pointer-events:none"></g>';
      // stop line + handle
      g += S.rect(stopX - 12, T, 24, H - B - T, 'fp-grab', 0, ' fill="transparent" style="cursor:ew-resize"');
      g += S.line(stopX, T - 2, stopX, H - B, 's-acc w2 dash');
      g += S.circle(stopX, T - 2, 8, 'handle');
      const lab = compact ? 'stop ' + sim.stop : 'stop at ' + sim.stop + ' · drag';
      g += S.text(clamp(stopX, L + 44, W - R - 44), T - 15, lab, 'sm acc b', 'middle');
      fig.innerHTML = S.wrap(W, H, `Invested money by account from age ${a0} to 95, stopping work at ${sim.stop}${sim.ok ? '; it lasts past 95' : '; it runs out at ' + sim.shortAge}`, g, 'drag');
      geom = { x, y, L, R, T, B, W, H, a0, a1 };
    });

    // drag the stop line
    ui.drag(fig, { sel: '.handle,.fp-grab', start() { tip.hidden = true; }, move(pt) { if (!geom) return; const a = clamp(Math.round(geom.x.inv(pt.x)), p.age, 75); if (a !== p.stop) { touched = true; p.stop = a; stw.set(id + '-stop', a); update(); } } });
    // hover readout
    const hide = () => { tip.hidden = true; const h = fig.querySelector('.fp-hov'); if (h) h.innerHTML = ''; };
    fig.addEventListener('pointermove', (e) => {
      if (!geom || !sim || e.buttons) return;
      const svg = fig.querySelector('svg'); if (!svg) return;
      const pt = ui.pt(svg, e);
      if (pt.x < geom.L || pt.x > geom.W - geom.R || pt.y < geom.T || pt.y > geom.H - geom.B + 30) { hide(); return; }
      const a = clamp(Math.round(geom.x.inv(pt.x)), geom.a0, geom.a1); const r = sim.yrs[a - geom.a0]; if (!r) return;
      const hx = geom.x(a); const h = svg.querySelector('.fp-hov');
      if (h) h.innerHTML = S.line(hx, geom.T, hx, geom.H - geom.B, 's-ink w1') + S.circle(hx, geom.y(r.total), 4, 'f-ink');
      const src = mainSrc(r);
      tip.innerHTML = `<b>Age ${a}</b> · ${k$(r.total)} invested<br>${r.retired ? `Spend ${k$(r.need)} incl. health ${k$(r.health)} · tax ${k$(r.taxPaid)}${r.ss ? ` · SS ${k$(r.ss)}` : ''}<br>${r.short > 1 ? 'Short by ' + k$(r.short) : 'Paid mostly from ' + (SRC_LABEL[src] || 'Social Security')}${r.conv > 500 ? `<br>Roth conversion ${k$(r.conv)}` : ''}` : 'Still working and saving'}`;
      tip.hidden = false;
      const fw = figWrap.clientWidth; const tw = tip.offsetWidth;
      const px = hx + fig.offsetLeft; tip.style.left = clamp(px + 12, 4, fw - tw - 4) + 'px'; tip.style.top = (fig.offsetTop + geom.T + 6) + 'px';
    });
    fig.addEventListener('pointerleave', hide);

    if (saved) writeInputs(p);
    update();
  };

  /* ======================================================================
     2. fireWhatIf
     ====================================================================== */
  const STRESS = [
    { k: 'crash', label: 'Stocks fall 30% in year one', bad: true },
    { k: 'infl', label: 'High-inflation decade', bad: true },
    { k: 'health', label: '$40K medical bill', bad: true },
    { k: 'child', label: 'A child', bad: true },
    { k: 'sscut', label: 'Social Security cut to 78% (2033)', bad: true },
    { k: 'more', label: 'One more year of work', bad: false },
    { k: 'pt', label: 'Part-time $20K a year', bad: false },
    { k: 'abroad', label: 'Move somewhere 30% cheaper', bad: false },
  ];
  SML.widgets.fireWhatIf = function (root) {
    const id = SML.uid('fw');
    const saved = loadPlan();
    const plans = Object.keys(PRESETS).map((k) => ({ v: k, label: PRESETS[k].label }));
    if (saved) plans.unshift({ v: 'saved', label: 'My plan' });
    let planKey = saved ? 'saved' : 'lisbon';
    const getPlan = () => Object.assign({}, planKey === 'saved' && saved ? saved : PRESETS[planKey].p);
    let base = getPlan();
    let baseFi = earliest(base);
    let stop = baseFi === null ? 60 : baseFi;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Break the plan on purpose</span>${ui.seg(id + '-plan', plans, planKey, 'Plan to test')}</div>
      <div class="fw-chips">
        <span class="lab">What goes wrong</span>${ui.chips(id + '-bad', STRESS.filter((s) => s.bad).map((s) => ({ k: s.k, label: s.label, color: 'var(--down)', on: s.k === 'crash' })))}
        <span class="lab">What you can do</span>${ui.chips(id + '-good', STRESS.filter((s) => !s.bad).map((s) => ({ k: s.k, label: s.label, color: 'var(--up)' })))}
      </div>
      <div class="wg-fig"><div class="fw-svg"></div><div class="fp-legend"><span><i style="height:0;border-top:2px dashed var(--muted);background:none"></i>Plain plan</span><span><i style="height:3px;background:var(--accent)"></i>With your changes (red if it runs out)</span></div></div>
      <div class="fp-stop">${ui.slider({ id: id + '-stop', label: 'Plan stops work at age', min: 25, max: 75, step: 1, value: stop, fmt: 'plain' })}</div>
      <div class="wg-read">${ui.stat('Plain plan', id + '-b')}${ui.stat('With your changes', id + '-s')}${ui.stat('Left at 95', id + '-end')}${ui.stat('Earliest stop now', id + '-fi')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="fw-fix"><h4 id="${id}-fixh">Cheapest fixes</h4><div id="${id}-fix"></div></div>
      <div class="wg-note">Same simplified model as the planner, in today's dollars, with the plan's own market path (Cautious for the examples). The plan starts at its earliest safe stop age, so there is no slack. Assumptions: a crash is a 30% loss after inflation in the first year of retirement; the high-inflation decade cuts returns after inflation by 3 points for ten years; the medical bill lands three years in; a child costs about $16,000 a year for 18 years (USDA's middle-income estimate, before college); Social Security falls to 78% from 2033 (the 2026 Trustees project the retirement trust fund runs dry late in 2032); part-time pay is $20,000 a year for the first ten years, less payroll tax; moving abroad cuts living costs 30% and adds $6,000 a year of flights home. Not advice.</div>`;
    const fig = root.querySelector('.fw-svg');
    const stw = ui.wire(root, (e) => onChange(e));
    let res = null;
    const stressNow = () => { const s = {}; STRESS.forEach((x) => { if (stw.on(id + (x.bad ? '-bad' : '-good'), x.k)) s[x.k] = true; }); return s; };
    function onChange(e) {
      const t = e && e.target;
      if (t && t.closest && t.closest('#' + id + '-plan')) {
        planKey = stw.seg(id + '-plan') || planKey; base = getPlan(); baseFi = earliest(base); stop = baseFi === null ? 60 : baseFi; stw.set(id + '-stop', stop);
      } else if (t && t.closest && t.closest('#' + id + '-stop')) { stop = stw.n(id + '-stop'); }
      update();
    }
    function fixes(st) {
      const out = [];
      for (let n = 1; n <= 15; n++) { if (simulate(base, { stop: stop + n, stress: st }).ok) { out.push(['+' + n + ' year' + (n > 1 ? 's' : ''), `Work ${n} more year${n > 1 ? 's' : ''} and stop at ${stop + n}.`]); break; } }
      for (let c = 2; c <= 60; c += 2) { const q = Object.assign({}, base, { spend: base.spend * (1 - c / 100), travel: base.travel * (1 - c / 100) }); if (simulate(q, { stop, stress: st }).ok) { const loc = LOCS.find((l) => l.k === base.loc) || LOCS[0]; out.push(['−' + c + '%', `Spend ${c}% less on living and travel, about ${k$((base.spend * loc.m + base.travel) * c / 100)} a year.`]); break; } }
      if (!st.pt) for (let k = 4000; k <= 80000; k += 4000) { if (simulate(base, { stop, stress: Object.assign({}, st, { pt: true, ptAmt: k }) }).ok) { out.push([k$(k) + '/yr', `Earn ${k$(k)} a year part-time for the first ten years.`]); break; } }
      return out;
    }
    function update() {
      const st = stressNow();
      const b0 = simulate(base, { stop });
      const s1 = simulate(base, { stop, stress: st });
      const fiS = earliest(base, Object.assign({}, st, { more: false }));
      res = { b0, s1 };
      sv(id + '-b', b0.ok ? 'Past 95' : 'Out at ' + b0.shortAge, b0.ok ? 'up' : 'dn');
      sv(id + '-s', s1.ok ? 'Past 95' : 'Out at ' + s1.shortAge, s1.ok ? 'up' : 'dn');
      sv(id + '-end', k$(s1.endTotal), s1.ok ? '' : 'dn');
      sv(id + '-fi', fiS === null ? 'Not by 75' : 'Age ' + fiS);
      const on = STRESS.filter((x) => st[x.k]).map((x) => x.label.toLowerCase());
      const msg = $id(id + '-msg');
      if (!on.length) msg.innerHTML = ui.msg('info', 'Pick', `Switch on something that goes wrong, then see whether the plan survives it.`);
      else if (s1.ok && !b0.ok) msg.innerHTML = ui.msg('up', 'Rescued', `With ${on.join(', ')}, a plan that failed at ${b0.shortAge} now lasts past 95.`);
      else if (s1.ok) msg.innerHTML = ui.msg('up', 'Survives', `With ${on.join(', ')}, stopping at ${s1.stop} still lasts past 95 with ${k$(s1.endTotal)} left in today's dollars.`);
      else msg.innerHTML = ui.msg('dn', 'Breaks', `With ${on.join(', ')}, the money runs out at <b>${s1.shortAge}</b>. ${fiS === null ? 'No stop age up to 75 works without a fix.' : `The earliest safe stop age moves to <b>${fiS}</b>.`}`);
      const fx = $id(id + '-fix'), fh = $id(id + '-fixh');
      if (s1.ok) { fh.textContent = 'Margin'; fx.innerHTML = `<p>This version of the plan holds. Money left at 95: <b style="color:var(--ink)">${k$(s1.endTotal)}</b>. Try adding another stress to find where it breaks.</p>`; }
      else {
        fh.textContent = 'Cheapest fixes (any one is enough)';
        const f = fixes(st);
        fx.innerHTML = f.length ? `<ul>${f.map(([b, t]) => `<li><b>${b}</b>${t}</li>`).join('')}</ul>` : '<p>No single fix up to these limits works. Combine two, or rethink the plan.</p>';
      }
      draw(true);
    }
    const draw = ui.responsive(fig, (W) => {
      if (!res) return;
      const compact = W < 520;
      const H = Math.round(clamp(W * 0.46, 250, 350));
      const L = compact ? 44 : 56, R = 12, T = 36, B = 34;
      const a0 = base.age, a1 = 95;
      const x = SML.lin(a0, a1, L, W - R);
      const top = niceTop(Math.max(...res.b0.yrs.map((r) => r.total), ...res.s1.yrs.map((r) => r.total)));
      const y = SML.lin(0, top, H - B, T);
      let g = yAxis(top, y, L, W, R, compact);
      const st = stressNow();
      // events
      const ev = [];
      const stopA = res.s1.stop;
      if (st.crash) ev.push([stopA, 'crash', 'dn']);
      if (st.health) ev.push([stopA + 3, '$40K bill', 'dn']);
      if (st.sscut) ev.push([a0 + (2033 - 2026), 'SS 78%', 'dn']);
      if (st.infl) { g += S.rect(x(stopA), T, x(Math.min(a1, stopA + 10)) - x(stopA), H - B - T, 'f-dn-t', 0, ' opacity=".7"'); ev.push([stopA + 5, 'inflation', 'dn']); }
      ev.forEach(([a, t, c], i) => { if (a >= a0 && a <= a1) { g += S.line(x(a), T, x(a), H - B, 's-' + c + ' w1 dash2'); g += S.text(clamp(x(a), L + 28, W - R - 28), T - 8 - (i % 2) * 12, t, 'xs ' + c + ' b', 'middle'); } });
      g += S.line(x(stop), T, x(stop), H - B, 's-acc w15 dash');
      const bl = res.b0.yrs.map((r) => [x(r.a), y(r.total)]);
      g += S.poly(bl, 's-mut w2 dash');
      const sl = res.s1.yrs.map((r) => [x(r.a), y(r.total)]);
      g += S.area(sl, y(0), res.s1.ok ? 'f-acc-t' : 'f-dn-t') + S.poly(sl, (res.s1.ok ? 's-acc' : 's-dn') + ' w25');
      g += S.line(L, H - B + 0.5, W - R, H - B + 0.5, 's-line') + ageAxis(x, a0, a1, H - B, compact);
      if (!res.s1.ok) g += S.circle(x(res.s1.shortAge), y(0), 6, 'f-dn') + S.text(clamp(x(res.s1.shortAge), L + 50, W - R - 50), y(0) - 12, 'out at ' + res.s1.shortAge, 'sm dn b', 'middle');
      fig.innerHTML = S.wrap(W, H, `Invested money with and without your changes, stopping at ${stop}${res.s1.ok ? '; lasts past 95' : '; runs out at ' + res.s1.shortAge}`, g);
    });
    update();
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  SML.lessons.push({
    id: 'l-fire-planner', course: 'fi-plan', order: 4, title: 'Your full FIRE plan', mins: 12, level: 'Intermediate',
    summary: 'Every account, cost and rule in one year-by-year plan, and the age you can stop.',
    idea: 'A FIRE plan is a yearly budget for your money: what you save, what you spend, which account pays and what tax you owe.',
    widget: 'firePlanner',
    try: 'Pick an example plan, then drag the amber line to your stop age. Change the four steps below the chart with your own numbers.',
    body: [
      '<p>Your FIRE number tells you roughly how much you need. A plan tells you <b>when</b> you can stop and <b>how</b> the money comes out, year by year, until 95. The planner works in today’s dollars: every amount is in what money buys now, and returns are after inflation. That keeps the numbers readable over 50 years.</p>',
      '<h3>What goes in</h3><ul><li><b>You:</b> your age and household. Couples are taxed as married filing jointly.</li><li><b>Money now:</b> each bucket separately, because each is taxed and unlocked differently: taxable brokerage (and how much of it is your own money, the cost basis), pre-tax 401(k) and IRA, Roth, HSA and cash. Plus what you save each year.</li><li><b>Life after:</b> living costs, where you will live, travel, health insurance before 65 and your Social Security estimate.</li><li><b>Assumptions:</b> return, inflation, how markets behave and how flexible your spending is.</li></ul>',
      '<h3>The order the money comes out</h3><p>The planner follows the order many early retirees use:</p><ul><li><b>Cash and the taxable account first.</b> Dividends arrive as income (the planner assumes 1.5% a year), and when you sell you only pay tax on the gain part, and in 2026 long-term gains are taxed at 0% while taxable income stays under $98,900 for a married couple ($49,450 single). See <a href="#l-zero-bracket">the 0% bracket</a>.</li><li><b>A Roth conversion ladder at the same time.</b> Each year it moves some pre-tax money into Roth, often just up to the standard deduction ($32,200 for a couple in 2026) so the conversion costs no tax. Five years later that money can come out tax- and penalty-free. See <a href="#l-early-access">money out before 59½</a>.</li><li><b>Roth contributions and seasoned conversions</b> next, then <b>pre-tax money from 59½</b> (or from 55 under the Rule of 55 if you leave your job that year or later; a 72(t) plan is another route, not modelled here).</li><li><b>Social Security</b> from your claim age, and the <b>HSA</b> for medical costs from 65.</li></ul>',
      '<h3>Taxes can be tiny</h3><p>Because only the gain part of a sale is taxed, and long-term gains and qualified dividends are taxed at 0% while a couple’s taxable income stays under $98,900 in 2026, many early retirees in the US owe little or no federal income tax while they live on a taxable account. If you move abroad, your new country may tax that same income. The planner estimates each year’s federal tax with the 2026 brackets, the standard deduction, the 0% gains band and the rules for taxing Social Security. State tax is not included: check your state, or pick one with no income tax (<a href="#l-fire-tax">FIRE taxes</a>).</p>',
      '<h3>Health insurance before 65</h3><p>In 2026 the extra marketplace subsidies of 2021-2025 have expired. Subsidies stop completely once household income passes 400% of the poverty line: $62,600 for one person, $84,600 for two and $128,600 for four for 2026 coverage. From 2026 you also repay any excess advance credit in full at tax time. Below the line the credit shrinks as income rises, so Roth conversions, realized gains and dividends all raise your premium. In US locations the planner takes the credit off your health price each year and shows what conversions cost you in lost credit. If you live abroad the marketplace does not apply: enter your private or expat plan, and remember the planner shows only US tax, not your new country’s (<a href="#l-us-tax-abroad">US taxes abroad</a>). See <a href="#l-aca">health insurance before 65</a>.</p>',
      '<h3>Social Security in the plan</h3><p>Use an estimate that assumes you stop working at your stop age (your online my Social Security account at ssa.gov can show this), because your benefit is based on your 35 highest years and early retirement adds zero years. With a full retirement age of 67, claiming at 62 pays 70% of the full benefit and waiting to 70 pays 124%. See <a href="#l-ss-early">Social Security when you stop early</a>.</p>',
      '<h3>Reading the result</h3><p>The <b>earliest age</b> is the first stop age where the plan lasts past 95. An average return is a smooth line that real markets never follow, so check the <b>Cautious</b> and <b>Crash at start</b> paths in step 4 and give yourself a few years of slack. Flexible spending helps a lot (<a href="#l-guardrails">guardrails</a>), and the next lesson breaks the plan on purpose (<a href="#l-fire-whatif">what if</a>). Like any planner, this one is a simplified model, not advice; a fee-only fiduciary adviser can review a real plan.</p>',
    ],
    example: {
      title: 'A couple at 47: $0 tax, but conversions are not free',
      intro: 'A married couple in the US stops at 47 with $2.1M invested: $1.2M taxable (they paid in $700K), $700K pre-tax and $200K Roth. They need $70,000 a year for living plus the marketplace health plan. Figures use 2026 rules.',
      steps: [
        'Living costs are $70,000 a year plus health insurance, about 3.8% of $2.1M once health is added.',
        'The taxable account pays about 1.5% in qualified dividends: $1.2M × 1.5% = <b>$18,000</b>. They sell $62,000 more; the gain part is $62,000 × (1 − 700 ÷ 1,200) = <b>$25,833</b>.',
        'Their income is $18,000 + $25,833 = $43,833. After the $32,200 standard deduction, $11,633 is taxable, all inside the 0% band for gains. Federal income tax: <b>$0</b>.',
        'Health: $43,833 is about 207% of the poverty line for two ($21,150 for 2026 coverage), so they pay about 6.87% of income, <b>$3,010</b> a year, for the benchmark plan. The credit covers the rest.',
        'Now they add a <b>$32,200</b> Roth conversion. It uses up the standard deduction and the $43,833 of gains still fits in the 0% band, so federal tax stays $0. But income rises to $76,033, about 359% of the poverty line, and they now pay 9.96%: <b>$7,573</b>.',
        'The “tax-free” conversion costs $7,573 − $3,010 = <b>$4,563</b> of lost credit, about 14% of the amount converted. Converting less before 65, or in years without a subsidy, can be cheaper.',
      ],
      result: '$0 federal tax either way, but in 2026 income is the price of the health subsidy: count lost credit as a tax when you plan Roth conversions before 65.',
    },
    mistakes: [
      'Planning with the average return only. A plan that just works on a smooth line can fail when a crash comes in year one; test the Cautious and Crash paths.',
      'Leaving out health insurance before 65, or assuming the bigger 2021-2025 subsidies. In 2026 the 400% cliff is back and excess advance credits must be repaid in full.',
      'Counting all your money as reachable. Pre-tax money is hard to reach before 59½ without a Roth ladder, a 72(t) plan or the Rule of 55, so a plan can have enough in total and still run short of money you can use.',
      'Using a Social Security estimate that assumes you work until 67. Stopping at 45 puts zero years into your 35-year average.',
    ],
    points: [
      'Plan in today’s dollars with returns after inflation; it keeps 50 years of numbers readable.',
      'Spend cash and taxable money first while a Roth ladder converts pre-tax money at 0% or 10-12%, and count any lost health credit as part of the conversion’s cost.',
      'In 2026 a couple can have up to $98,900 of taxable income from long-term gains taxed at 0%.',
      'Your earliest stop age is where the plan lasts past 95. Give it slack and redo the plan every year.',
    ],
    terms: ['FIRE number', 'Roth conversion ladder', '0% capital gains bracket', 'Premium tax credit', 'Rule of 55', 'Withdrawal rate'],
    glossary: [{ t: "Today's dollars", d: 'Amounts adjusted for inflation so they show what money buys now. A plan in today’s dollars uses returns after inflation.' }],
    quiz: { q: 'Why does the planner spend the taxable account first in early retirement?', options: ['Money in a taxable account is never taxed', 'Only the gain part of each sale is taxed, often at 0%, while pre-tax money is converted to Roth at low rates', 'Pre-tax money can never be taken out before 65'], answer: 1, why: 'Selling shares you already paid tax on only taxes the gain, and in 2026 a couple’s long-term gains are taxed at 0% up to $98,900 of taxable income, leaving room for cheap Roth conversions.' },
    sources: [
      { t: 'IRS Rev. Proc. 2025-32: 2026 brackets, standard deduction and capital-gains thresholds', u: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
      { t: 'IRS Rev. Proc. 2025-25: 2026 premium tax credit contribution percentages', u: 'https://www.irs.gov/pub/irs-drop/rp-25-25.pdf' },
      { t: 'HealthCare.gov: federal poverty level (FPL)', u: 'https://www.healthcare.gov/glossary/federal-poverty-level-fpl/' },
      { t: 'CMS: 2026 Medicare Part B premium and deductible', u: 'https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles' },
    ],
  });

  SML.lessons.push({
    id: 'l-fire-whatif', course: 'fi-plan', order: 5, title: 'What if? Stress-test the plan', mins: 10, level: 'Intermediate',
    summary: 'Crashes, inflation, big bills and a Social Security cut: see what breaks and what fixes it.',
    idea: 'A plan that only works if nothing goes wrong is a hope. Break it on purpose, then find the cheapest fix.',
    widget: 'fireWhatIf',
    try: 'Pick a plan, switch on things that go wrong, then switch on the levers that rescue it. The plan starts at its earliest stop age, with no slack.',
    body: [
      '<p>Every FIRE plan rests on guesses about markets, prices, health and law. Stress-testing means changing one guess at a time to its bad version and watching what happens. If the plan only works on the average path, you know how much slack to add before you quit.</p>',
      '<h3>The stresses in this tool</h3><ul><li><b>A crash in year one.</b> The worst time for a big loss is right after you stop, because you sell shares at low prices to live (<a href="#l-sequence">sequence risk</a>).</li><li><b>A high-inflation decade.</b> Prices rise faster than your investments for years, so your returns after inflation shrink.</li><li><b>A big medical bill.</b> One-off costs are easy to forget: cars, roofs, weddings, surgery.</li><li><b>A child.</b> USDA’s middle-income estimate is about $285,000 to raise a child to 17, before college.</li><li><b>A Social Security cut.</b> See below.</li></ul>',
      '<h3>Social Security’s trust fund</h3><p>The 2026 Trustees Report projects that the retirement trust fund runs out late in 2032. After that, incoming payroll taxes would still pay about 78% of scheduled benefits (about 83% if the retirement and disability funds are combined, in 2034). Congress has acted before, so a cut is a risk to plan for, not a certainty. Planning on 0% is as wrong as planning on 100% forever.</p>',
      '<h3>The cheapest fixes</h3><ul><li><b>Flexible spending.</b> Trimming travel and extras after a bad year does more than you would think (<a href="#l-guardrails">guardrails</a>).</li><li><b>A little income.</b> Part-time or seasonal work in the first ten years covers spending exactly when sequence risk is highest. Even modest pay can replace a lot of savings (<a href="#l-coast-fire">Barista FIRE</a>).</li><li><b>One more year.</b> It works, but it is the most expensive fix: you pay for it with a year of your life. Decide your finish line in advance so “one more year” does not repeat forever.</li><li><b>A cheaper place.</b> Moving abroad or to a low-cost town shrinks the number (<a href="#l-geo-arbitrage">where your money goes furthest</a>).</li><li><b>A cash buffer.</b> A year or two of spending in cash or bonds lets you avoid selling stocks in a crash.</li></ul>',
      '<h3>FIRE mistakes to avoid</h3><ul><li><b>Forgetting health insurance</b> before 65, and the 2026 subsidy cliff at 400% of the poverty line.</li><li><b>Forgetting taxes</b>, or paying far more than needed by drawing from the wrong account first.</li><li><b>Ignoring lumpy costs</b>: a car every 8-10 years, home repairs, a new roof, help for family.</li><li><b>Underestimating home costs.</b> Maintenance, insurance and property tax rise over time.</li><li><b>Sequence risk</b>: a 100% stock portfolio with no cash buffer the year you quit.</li><li><b>Identity and boredom.</b> Work gives structure and friends. Plan what you are retiring <i>to</i>, not only what you are leaving.</li><li><b>A partner who is not on board</b> with the budget, the place or the date.</li></ul>',
    ],
    example: {
      title: 'One crash, three fixes',
      intro: 'A plan has $1.5M invested at 50 and spends $60,000 a year, a 4% withdrawal rate. In year one stocks fall 30%.',
      steps: [
        'They take $60,000 at the start of the year, leaving $1,440,000. The crash cuts it by 30%: $1,440,000 × 0.70 = <b>$1,008,000</b>.',
        'Keeping the same $60,000 is now $60,000 ÷ $1,008,000 = <b>5.95%</b> of the portfolio, well above a safe rate.',
        'Fix 1, spend 10% less for a few years: $54,000 ÷ $1,008,000 = <b>5.36%</b>. Better, but still high.',
        'Fix 2, earn $20,000 a year part-time: the portfolio only pays $40,000, or $40,000 ÷ $1,008,000 = <b>3.97%</b>.',
        'Fix 3, both: $54,000 − $20,000 = $34,000, or $34,000 ÷ $1,008,000 = <b>3.37%</b>.',
      ],
      result: 'A little income does more than a 10% spending cut, and stacking both brings the withdrawal rate back under 3.5%.',
    },
    mistakes: [
      'Testing only the average case, then quitting on a plan with no slack.',
      'Treating one more year as free. It costs a year of your life; set a finish line before you start.',
      'Assuming Social Security pays 100% forever, or nothing at all. The projected gap is about a fifth.',
      'Keeping no cash buffer, so a crash forces you to sell stocks near the bottom.',
    ],
    points: [
      'Stress-test the first ten years of retirement hardest: that is where crashes and inflation do the most damage.',
      'Flexible spending and a little income are usually the cheapest fixes.',
      'Plan for a Social Security cut of about a fifth as a stress case, not as the base case.',
      'Write down the fix in advance, so a bad year triggers a plan instead of panic.',
    ],
    terms: ['Sequence of returns risk', 'Guardrails', 'Social Security', 'Withdrawal rate', 'Barista FIRE'],
    quiz: { q: 'In the example, which single change lowered the withdrawal rate most after the crash?', options: ['Spending 10% less', 'Earning $20,000 a year part-time', 'Waiting for the market to recover before deciding'], answer: 1, why: 'Part-time pay cut the portfolio’s draw from $60,000 to $40,000 (3.97%), while a 10% spending cut only reached 5.36%.' },
    sources: [
      { t: 'SSA: 2026 Trustees Report, conclusion', u: 'https://www.ssa.gov/OACT/TR/2026/II_E_conclu.html' },
      { t: 'USDA: the cost of raising a child', u: 'https://www.usda.gov/media/blog/2017/01/13/cost-raising-child' },
      { t: 'HealthCare.gov: federal poverty level (FPL)', u: 'https://www.healthcare.gov/glossary/federal-poverty-level-fpl/' },
    ],
  });
})();
