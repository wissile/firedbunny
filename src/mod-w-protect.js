/* Stock Market Lessons: Protect What You Build (insurance, estate basics, scams). Course `protect`. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $id = (x) => document.getElementById(x);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const usd = (v) => F.usd(Math.round(v), 0);
  const kM = (v) => { const a = Math.abs(v), s = v < 0 ? F.minus : ''; if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e4) return s + '$' + Math.round(a / 1000) + 'K'; return s + '$' + F.num(Math.round(a)); };
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  /* simple flowing legend: items [{c, t}] -> svg string and height used */
  function legend(items, x0, y0, maxW) {
    let x = x0, y = y0, out = '';
    items.forEach((it) => {
      const w = 22 + it.t.length * 6.4;
      if (x + w > x0 + maxW && x > x0) { x = x0; y += 18; }
      out += S.rect(x, y - 9, 10, 10, it.c, 2) + S.text(x + 15, y, esc(it.t), 'sm ink');
      x += w + 12;
    });
    return { svg: out, h: y - y0 + 14 };
  }

  SML.css(`
.wpr-hide{display:none!important}
.wpr-presets{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.wpr-steps{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.wpr-dot{width:9px;height:9px;border-radius:50%;background:var(--line)}
.wpr-dot.ok{background:var(--up)} .wpr-dot.no{background:var(--down)} .wpr-dot.cur{box-shadow:0 0 0 2px var(--accent)}
.wpr-stage{display:flex;flex-direction:column;gap:16px;align-items:center}
.wpr-card{width:100%;max-width:470px;background:var(--surface);border:1px solid var(--input);border-radius:14px;overflow:hidden;box-shadow:0 18px 40px -24px var(--raise)}
.wpr-card-h{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line);background:var(--surface-2)}
.wpr-av{width:30px;height:30px;border-radius:50%;display:grid;place-content:center;font:700 12px var(--mono);background:var(--shade2);color:var(--ink);flex:0 0 30px}
.wpr-from{display:flex;flex-direction:column;gap:2px;min-width:0}
.wpr-from b{font-size:14px;color:var(--ink);line-height:1.2;overflow-wrap:anywhere}
.wpr-from small{font:500 10.5px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.wpr-body{padding:14px 16px 16px;font-size:15px;line-height:1.6;color:color-mix(in srgb,var(--ink) 92%,transparent);overflow-wrap:anywhere}
.wpr-body p + p{margin-top:8px}
.wpr-body.sms p{background:var(--shade);border-radius:14px 14px 14px 4px;padding:10px 13px;display:inline-block}
.wpr-body.call{font-family:var(--mono);font-size:13.5px}
.wpr-body.popup{border:2px solid var(--down);margin:12px;border-radius:8px}
.wpr-sub{font-weight:600;color:var(--ink);margin-bottom:6px}
.wpr-fl{background:none;color:inherit;border-radius:3px;padding:0 1px;transition:background-color .2s}
.wpr-show .wpr-fl{background:color-mix(in srgb,var(--down) 22%,transparent);box-shadow:inset 0 -2px 0 var(--down)}
.wpr-show.legit .wpr-fl{background:color-mix(in srgb,var(--up) 20%,transparent);box-shadow:inset 0 -2px 0 var(--up)}
.wpr-fl sup{display:none;font:700 9.5px var(--mono);color:var(--down);margin-left:2px}
.wpr-show .wpr-fl sup{display:inline}
.wpr-show.legit .wpr-fl sup{color:var(--up)}
.wpr-ans{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:470px}
.wpr-ans .btn{white-space:normal;line-height:1.2}
.wpr-why{width:100%;max-width:640px;display:flex;flex-direction:column;gap:10px}
.wpr-why ol{list-style:none;display:flex;flex-direction:column;gap:8px;counter-reset:f}
.wpr-why li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:10px;font-size:14.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.wpr-why li::before{counter-increment:f;content:counter(f);width:20px;height:20px;border-radius:50%;display:grid;place-content:center;font:700 10.5px var(--mono);background:color-mix(in srgb,var(--down) 18%,transparent);color:var(--down)}
.wpr-why.legit li::before{background:color-mix(in srgb,var(--up) 18%,transparent);color:var(--up)}
.wpr-do{font-size:14px;line-height:1.55;color:var(--muted);border-left:3px solid var(--info);padding-left:12px}
.wpr-do b{color:var(--ink)}
.wpr-end{width:100%;max-width:640px;display:flex;flex-direction:column;gap:12px}
.wpr-end h4{font-family:var(--display);font-weight:400;font-size:36px;line-height:.95;text-transform:uppercase;color:var(--ink)}
.wpr-list{font-size:13.5px;line-height:1.5;color:var(--muted);padding:12px 16px}
.wpr-list b{color:var(--ink);font-weight:600}
.wpr-list ul{list-style:none;display:flex;flex-direction:column;gap:6px;margin-top:6px}
.wpr-list li{display:grid;grid-template-columns:14px minmax(0,1fr);gap:8px}
.wpr-list li i{width:9px;height:9px;border-radius:50%;margin-top:5px;background:var(--muted)}
.wpr-list li i.dn{background:var(--down)} .wpr-list li i.acc{background:var(--accent)} .wpr-list li i.up{background:var(--up)}
`);

  /* =====================================================================
     1. insuranceNeeds: life (DIME), disability gap, liability / umbrella
     ===================================================================== */
  SML.widgets.insuranceNeeds = function (root, opts) {
    const id = SML.uid('wpi');
    const P = {
      single: { inc: 70000, yrs: 0, debt: 15000, mort: 0, edu: 0, sav: 40000, work: 70000, pay: 5800, ltd: 60, cap: 10000, who: 'emp', tax: 22, exp: 3200, wait: '90', ef: 4, nw: 120000, auto: '100', home: '100', risk: [] },
      family: { inc: 85000, yrs: 15, debt: 25000, mort: 300000, edu: 120000, sav: 70000, work: 85000, pay: 7100, ltd: 60, cap: 10000, who: 'emp', tax: 22, exp: 5200, wait: '90', ef: 3, nw: 350000, auto: '250', home: '300', risk: ['dog'] },
      c55: { inc: 140000, yrs: 7, debt: 0, mort: 90000, edu: 0, sav: 900000, work: 140000, pay: 11700, ltd: 60, cap: 10000, who: 'you', tax: 24, exp: 7000, wait: '90', ef: 9, nw: 1600000, auto: '250', home: '300', risk: ['teen', 'rental'] },
    };
    const start = P[(opts && opts.preset) || 'family'];
    const risks = [{ k: 'teen', label: 'Teen driver', color: 'var(--down)' }, { k: 'pool', label: 'Pool or trampoline', color: 'var(--down)' }, { k: 'dog', label: 'Dog', color: 'var(--accent)' }, { k: 'rental', label: 'Rental property', color: 'var(--accent)' }, { k: 'boat', label: 'Boat or ATV', color: 'var(--accent)' }];
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-m', [{ v: 'life', label: 'Life' }, { v: 'dis', label: 'Disability' }, { v: 'liab', label: 'Lawsuits' }], 'life', 'Kind of insurance')}<span class="grow"></span>
        <span class="wpr-presets"><span class="wg-title">Person</span>${ui.seg(id + '-p', [{ v: 'single', label: 'Single' }, { v: 'family', label: 'Young family' }, { v: 'c55', label: 'Couple at 55' }], (opts && opts.preset) || 'family', 'Example person')}</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl" data-g="life">
        ${ui.slider({ id: id + '-inc', label: 'Income to replace (yearly)', min: 0, max: 300000, step: 5000, value: start.inc, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-yrs', label: 'Years your family needs it', min: 0, max: 30, step: 1, value: start.yrs, fmt: 'yrs' })}
        ${ui.slider({ id: id + '-debt', label: 'Debts (not the mortgage)', min: 0, max: 200000, step: 5000, value: start.debt, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-mort', label: 'Mortgage to pay off', min: 0, max: 1000000, step: 10000, value: start.mort, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-edu', label: 'College to fund', min: 0, max: 400000, step: 10000, value: start.edu, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-sav', label: 'Savings your family could use', min: 0, max: 2000000, step: 10000, value: start.sav, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-work', label: 'Life cover through work', min: 0, max: 500000, step: 5000, value: start.work, fmt: 'usd0' })}
        <div class="ctl"><span class="ctl-lab">Count the work cover?</span>${ui.chips(id + '-wc', [{ k: 'on', label: 'Count it', on: false, color: 'var(--muted)' }])}</div>
      </div>
      <div class="wg-ctrl wpr-hide" data-g="dis">
        ${ui.slider({ id: id + '-pay', label: 'Monthly pay before tax', min: 1000, max: 30000, step: 100, value: start.pay, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ltd', label: 'Plan pays (% of pay)', min: 0, max: 80, step: 5, value: start.ltd, fmt: 'pct' })}
        ${ui.slider({ id: id + '-cap', label: 'Plan’s monthly cap', min: 2000, max: 25000, step: 500, value: start.cap, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-exp', label: 'Must-pay costs a month', min: 500, max: 20000, step: 100, value: start.exp, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-ef', label: 'Emergency fund (months)', min: 0, max: 12, step: 1, value: start.ef, fmt: 'num' })}
        ${ui.slider({ id: id + '-tax', label: 'Tax rate on a taxable benefit', min: 0, max: 37, step: 1, value: start.tax, fmt: 'pct' })}
        <div class="ctl"><span class="ctl-lab">Who pays the premium?</span>${ui.seg(id + '-who', [{ v: 'emp', label: 'Employer' }, { v: 'you', label: 'You, after tax' }], start.who, 'Who pays the premium')}</div>
        <div class="ctl"><span class="ctl-lab">Waiting period</span>${ui.seg(id + '-wait', [{ v: '30', label: '30 days' }, { v: '90', label: '90 days' }, { v: '180', label: '180 days' }], start.wait, 'Waiting period')}</div>
      </div>
      <div class="wg-ctrl wpr-hide" data-g="liab">
        ${ui.slider({ id: id + '-nw', label: 'Assets a lawsuit could reach', min: 0, max: 5000000, step: 25000, value: start.nw, fmt: 'usd0' })}
        <div class="ctl"><span class="ctl-lab">Car liability limit (per person)</span>${ui.seg(id + '-auto', [{ v: '50', label: '$50K' }, { v: '100', label: '$100K' }, { v: '250', label: '$250K' }, { v: '500', label: '$500K' }], start.auto, 'Car liability limit')}</div>
        <div class="ctl"><span class="ctl-lab">Home or renters liability</span>${ui.seg(id + '-home', [{ v: '100', label: '$100K' }, { v: '300', label: '$300K' }, { v: '500', label: '$500K' }], start.home, 'Home liability limit')}</div>
        <div class="ctl"><span class="ctl-lab">Things that raise lawsuit risk</span>${ui.chips(id + '-risk', risks.map((r) => ({ ...r, on: start.risk.indexOf(r.k) >= 0 })))}</div>
        <div class="ctl"><span class="ctl-lab">Umbrella policy</span>${ui.chips(id + '-umb', [{ k: 'on', label: 'Add the suggested umbrella', on: true, color: 'var(--violet)' }])}</div>
      </div>
      <div class="wg-read">${ui.stat('', id + '-s1')}${ui.stat('', id + '-s2')}${ui.stat('', id + '-s3', 'hl')}${ui.stat('', id + '-s4')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const pb = e && e.target && e.target.closest && e.target.closest('#' + id + '-p');
      if (pb) applyPreset(st.seg(id + '-p'));
      draw();
    });
    function applyPreset(k) {
      const p = P[k]; if (!p) return;
      ['inc', 'yrs', 'debt', 'mort', 'edu', 'sav', 'work', 'pay', 'ltd', 'cap', 'tax', 'exp', 'ef', 'nw'].forEach((f) => st.set(id + '-' + f, p[f]));
      st.setSeg(id + '-who', p.who); st.setSeg(id + '-wait', p.wait); st.setSeg(id + '-auto', p.auto); st.setSeg(id + '-home', p.home);
      $$('#' + id + '-risk .chip').forEach((c) => { const on = p.risk.indexOf(c.dataset.k) >= 0; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    }
    const labels = (a) => { ['s1', 's2', 's3', 's4'].forEach((k, i) => { const el = $id(id + '-' + k); if (el && el.previousElementSibling) el.previousElementSibling.textContent = a[i]; }); };
    const stdTerm = (y) => [10, 15, 20, 25, 30].find((t) => t >= y) || 30;

    function life(W) {
      const n = (k) => st.n(id + '-' + k);
      const inc = n('inc'), yrs = n('yrs'), debt = n('debt'), mort = n('mort'), edu = n('edu'), sav = n('sav');
      const workOn = st.on(id + '-wc', 'on'), work = workOn ? n('work') : 0;
      const need = [{ k: 'Debts', v: debt, c: 'f-vio' }, { k: 'Income', v: inc * yrs, c: 'f-acc' }, { k: 'Mortgage', v: mort, c: 'f-info' }, { k: 'College', v: edu, c: 'f-up' }];
      const have = [{ k: 'Savings', v: sav, c: 'f-up-t s-up w15' }, { k: 'Work cover', v: work, c: 'f-shade2 s-mut w15' }];
      const needT = sum(need.map((x) => x.v)), haveT = sum(have.map((x) => x.v)), gap = Math.max(0, needT - haveT);
      const x0 = 12, x1 = W - 12, bw = x1 - x0, max = Math.max(needT, haveT, 1);
      const sc = (v) => (v / max) * bw;
      let b = '', y = 20;
      b += S.text(x0, y, W < 480 ? 'YOUR FAMILY WOULD NEED' : 'WHAT YOUR FAMILY WOULD NEED', 'cap') + S.text(x1, y, kM(needT), 'lg b ink mono', 'end');
      y += 10; let x = x0;
      need.forEach((s) => { const w = sc(s.v); if (w > 0.5) { b += S.rect(x, y, w, 38, s.c); const lab = s.k + ' ' + kM(s.v); if (w > lab.length * 6.6 + 14) b += S.text(x + 8, y + 23, esc(lab), 'sm b onacc'); x += w; } });
      if (needT <= 0) b += S.rect(x0, y, bw, 38, 'nf s-line dash') + S.text(x0 + bw / 2, y + 23, 'Nothing to cover', 'sm', 'middle');
      y += 38 + 20;
      const lg = legend(need.filter((s) => s.v > 0).map((s) => ({ c: s.c, t: s.k + ' ' + kM(s.v) })), x0, y, bw); b += lg.svg; y += lg.h + 16;
      b += S.text(x0, y, W < 480 ? 'ALREADY THERE + GAP' : 'ALREADY THERE, PLUS THE GAP', 'cap') + S.text(x1, y, gap > 0 ? 'gap ' + kM(gap) : 'no gap', 'lg b mono ' + (gap > 0 ? 'dn' : 'up'), 'end');
      y += 10; x = x0;
      have.forEach((s) => { const w = sc(s.v); if (w > 0.5) { b += S.rect(x, y, w, 38, s.c); const lab = s.k + ' ' + kM(s.v); if (w > lab.length * 6.6 + 14) b += S.text(x + 8, y + 23, esc(lab), 'sm b ink'); x += w; } });
      if (gap > 0) { const w = sc(gap); b += S.rect(x, y, w, 38, 'f-dn-t s-dn w15 dash'); const lab = 'Gap: term cover ' + kM(gap); if (w > lab.length * 6.6 + 14) b += S.text(x + 8, y + 23, esc(lab), 'sm b dn'); else if (w > 60) b += S.text(x + 8, y + 23, 'Gap', 'sm b dn'); }
      if (haveT > needT && needT > 0) { b += S.line(x0 + sc(needT), y - 6, x0 + sc(needT), y + 44, 's-acc w2 dash2') + S.text(Math.min(x0 + sc(needT) + 6, x1 - 60), y + 56, 'need ends here', 'sm acc b'); }
      y += 38 + 20;
      const lg2 = legend(have.filter((s) => s.v > 0).map((s) => ({ c: s.c, t: s.k + ' ' + kM(s.v) })).concat(gap > 0 ? [{ c: 'f-dn-t s-dn w15', t: 'Gap ' + kM(gap) }] : []), x0, y, bw); b += lg2.svg; y += lg2.h;
      fig.innerHTML = S.wrap(W, y + 6, `Life insurance need of ${kM(needT)} compared with ${kM(haveT)} already in place`, b);
      labels(['Total need', 'Already there', 'Term cover to buy', 'Suggested term']);
      sv(id + '-s1', usd(needT)); sv(id + '-s2', usd(haveT)); sv(id + '-s3', gap > 0 ? usd(Math.ceil(gap / 50000) * 50000) : '$0', gap > 0 ? 'dn' : 'up');
      sv(id + '-s4', yrs > 0 || mort > 0 ? stdTerm(Math.max(yrs, 10)) + ' years' : 'Maybe none');
      const m = $id(id + '-msg');
      if (needT <= 0) m.innerHTML = ui.msg('info', 'Nobody depends', 'If no one relies on your income and you leave no debts, you may not need life insurance yet. Revisit it when you marry, buy a home or have a child.');
      else if (gap <= 0) m.innerHTML = ui.msg('up', 'Covered', `Savings ${workOn ? 'and work cover ' : ''}already meet the need. Recheck after a new child, a bigger mortgage or a job change.`);
      else if (yrs === 0 && mort === 0 && edu === 0) m.innerHTML = ui.msg('info', 'Small need', `The gap is mostly debts. A small term policy of about ${kM(Math.ceil(gap / 50000) * 50000)} would clear them, or your savings may do it soon.`);
      else m.innerHTML = ui.msg('acc', 'Buy term', `A ${stdTerm(Math.max(yrs, 10))}-year term policy of about ${kM(Math.ceil(gap / 50000) * 50000)} closes the gap.${workOn && work > 0 ? ' The work cover ends if the job ends, so price a policy without it too.' : !workOn && n('work') > 0 ? ' The work cover is left out on purpose: it ends if the job does.' : ''}`);
      $id(id + '-note').textContent = 'DIME method: Debts + Income × years + Mortgage + Education, minus what is already there. A simple starting point, not a quote. Each earning or caregiving parent needs their own number.';
    }

    function dis(W) {
      const n = (k) => st.n(id + '-' + k);
      const pay = n('pay'), pctv = n('ltd'), cap = n('cap'), exp = n('exp'), ef = n('ef'), tax = n('tax');
      const who = st.seg(id + '-who'), wait = Number(st.seg(id + '-wait'));
      const gross = Math.min(pay * pctv / 100, cap), net = who === 'emp' ? gross * (1 - tax / 100) : gross;
      const gap = exp - net, efDays = ef * 30;
      const compact = W < 520, x0 = 12, x1 = W - 12;
      const max = Math.max(pay, exp, net, 1) * 1.04, sc = (v) => (v / max) * (x1 - x0);
      let b = '', y = 18;
      const row = (label, v, cls, valCls) => { b += S.text(x0, y, label, 'cap'); y += 8; b += S.rect(x0, y, sc(v), 26, cls, 3); const t = usd(v) + ' / mo'; const w = sc(v); b += w > t.length * 7 + 16 ? S.text(x0 + w - 8, y + 17.5, t, 'md b mono ' + (valCls || 'onacc'), 'end') : S.text(x0 + w + 8, y + 17.5, t, 'md b mono ink'); const yy = y; y += 26 + 22; return yy; };
      row('PAY NOW, BEFORE TAX', pay, 'f-shade2', 'ink');
      const yb = row(who === 'emp' ? 'DISABILITY BENEFIT AFTER TAX' : 'DISABILITY BENEFIT (TAX-FREE)', net, 'f-up');
      row('MUST-PAY COSTS', exp, 'f-acc');
      if (gap > 0) { const xa = x0 + sc(net), xb = x0 + sc(exp); b += S.rect(xa, yb, xb - xa, 26, 'f-dn-t s-dn w15 dash', 3); if (xb - xa > 76) b += S.text((xa + xb) / 2, yb + 17.5, 'gap', 'sm b dn', 'middle'); }
      y += 6;
      const dMax = Math.max(wait, efDays, 180) * 1.05, ds = (d) => (d / dMax) * (x1 - x0);
      b += S.text(x0, y, compact ? 'DAYS UNTIL CHECKS START' : 'DAYS FROM INJURY UNTIL THE FIRST CHECK', 'cap'); y += 8;
      b += S.rect(x0, y, ds(wait), 22, 'f-dn-t s-dn w15', 3) + S.text(x0 + 8, y + 15, `wait ${wait} days`, 'sm b dn');
      y += 30;
      b += S.rect(x0, y, Math.max(ds(efDays), 2), 22, efDays >= wait ? 'f-up-t s-up w15' : 'f-acc-t s-acc w15', 3) + S.text(x0 + Math.max(ds(efDays), 2) + 8 > x1 - 150 ? x0 + 8 : x0 + Math.max(ds(efDays), 2) + 8, y + 15, `emergency fund lasts ${efDays} days`, 'sm b ' + (efDays >= wait ? 'up' : 'acc'));
      y += 22;
      fig.innerHTML = S.wrap(W, y + 8, `Disability benefit of ${usd(net)} a month after tax against ${usd(exp)} of monthly costs`, b);
      labels(['Benefit after tax', gap > 0 ? 'Monthly gap' : 'Monthly cushion', 'Gap over a year', 'Waiting period']);
      sv(id + '-s1', usd(net), 'up'); sv(id + '-s2', usd(Math.abs(gap)), gap > 0 ? 'dn' : 'up'); sv(id + '-s3', gap > 0 ? usd(gap * 12) : '$0', gap > 0 ? 'dn' : 'up');
      sv(id + '-s4', efDays >= wait ? 'Covered' : 'Short', efDays >= wait ? 'up' : 'dn');
      const m = $id(id + '-msg');
      if (pctv === 0) m.innerHTML = ui.msg('dn', 'No cover', 'Without disability insurance your savings are the only plan. Long-term disability through work, or an individual policy, is usually the first fix.');
      else if (gap > 0 && efDays < wait) m.innerHTML = ui.msg('dn', 'Two holes', `You would be short ${usd(gap)} a month, and the emergency fund runs out before the first check. Build cash toward ${Math.ceil(wait / 30)} months of costs and price a supplemental policy.`);
      else if (gap > 0) m.innerHTML = ui.msg('acc', 'Short each month', `The benefit covers ${Math.round((net / exp) * 100)}% of must-pay costs. ${who === 'emp' ? 'Because your employer pays the premium, the benefit is taxed. ' : ''}An individual own-occupation policy can fill the ${usd(gap)} gap.`);
      else if (efDays < wait) m.innerHTML = ui.msg('acc', 'Bridge the wait', `Once checks start you are fine, but the emergency fund covers ${efDays} of the ${wait} waiting days. Grow it to about ${Math.ceil(wait / 30)} months.`);
      else m.innerHTML = ui.msg('up', 'Solid', `The benefit covers your must-pay costs and the emergency fund bridges the ${wait}-day wait.${who === 'emp' ? ' Remember the benefit is taxable because your employer pays the premium.' : ''}`);
      $id(id + '-note').textContent = 'Check your benefits summary for the percent replaced, the monthly cap, the waiting period and whether "disability" means your own job or any job. Employer-paid benefits are taxable; benefits from a policy you paid with after-tax money are not.';
    }

    function liab(W) {
      const nw = st.n(id + '-nw'), auto = Number(st.seg(id + '-auto')) * 1000, home = Number(st.seg(id + '-home')) * 1000;
      const nRisk = risks.filter((r) => st.on(id + '-risk', r.k)).length;
      const target = Math.max(nw, nRisk > 0 ? 1e6 : 0);
      const sugg = target > Math.max(auto, home) && (nw >= 250000 || nRisk > 0) ? Math.max(1e6, Math.ceil(target / 1e6) * 1e6) : 0;
      const umb = st.on(id + '-umb', 'on') ? sugg : 0;
      const compact = W < 520, x0 = compact ? 8 : 64, x1 = W - 12, top = 40, base = 236, H = 280;
      const max = Math.max(nw, auto + umb, home + umb, 300000) * 1.12, y = SML.lin(0, max, base, top);
      let b = '';
      if (!compact) SML.ticks(0, max, 4).forEach((v) => { b += S.line(x0, y(v), x1, y(v), 's-grid') + S.text(x0 - 8, y(v) + 4, kM(v), 'xs mono', 'end'); });
      const cols = [{ t: 'Car crash', basev: auto, sub: 'car liability' }, { t: 'Injury at home', basev: home, sub: 'home liability' }];
      const cw = Math.min(110, (x1 - x0) / 3.2), gapx = ((x1 - x0) - cw * 3) / 4;
      const cx = (i) => x0 + gapx + i * (cw + gapx);
      cols.forEach((c, i) => {
        const X = cx(i);
        b += S.rect(X, y(c.basev), cw, base - y(c.basev), 'f-info', 2);
        if (base - y(c.basev) > 20) b += S.text(X + cw / 2, base - 8, kM(c.basev), 'sm b onacc', 'middle');
        if (umb > 0) { b += S.rect(X, y(c.basev + umb), cw, y(c.basev) - y(c.basev + umb), 'f-vio', 2); b += S.text(X + cw / 2, y(c.basev + umb) + 18, '+' + kM(umb), 'sm b onacc', 'middle'); }
        b += S.text(X + cw / 2, base + 18, c.t, compact ? 'sm b ink' : 'md b ink', 'middle');
        const ok = c.basev + umb >= nw;
        b += S.text(X + cw / 2, y(c.basev + umb) - 8, ok ? 'covered' : 'short ' + kM(nw - c.basev - umb), 'sm b ' + (ok ? 'up' : 'dn'), 'middle');
      });
      const X = cx(2);
      b += S.rect(X, y(nw), cw, base - y(nw), 'f-acc-t s-acc w15', 2) + S.text(X + cw / 2, base + 18, compact ? 'At risk' : 'Your assets', compact ? 'sm b ink' : 'md b ink', 'middle');
      b += S.text(X + cw / 2, Math.min(y(nw) - 8, base - 8), kM(nw), 'sm b acc', 'middle');
      b += S.line(x0, y(nw), x1, y(nw), 's-acc w15 dash');
      b += S.line(x0, base, x1, base, 's-line');
      const lgd = legend([{ c: 'f-info', t: 'home or car policy' }].concat(umb > 0 ? [{ c: 'f-vio', t: 'umbrella' }] : []).concat([{ c: 'f-acc-t s-acc w15', t: 'assets a judgment could take' }]), x0, 18, x1 - x0);
      b += lgd.svg;
      fig.innerHTML = S.wrap(W, H, `Liability cover for a car crash and a home injury compared with ${kM(nw)} of assets at risk`, b);
      labels(['Assets at risk', 'Best current limit', 'Suggested umbrella', 'Risk factors']);
      sv(id + '-s1', kM(nw), 'acc'); sv(id + '-s2', kM(Math.max(auto, home))); sv(id + '-s3', sugg ? kM(sugg) : 'Not yet', sugg ? 'acc' : 'up'); sv(id + '-s4', String(nRisk), nRisk ? 'dn' : '');
      const m = $id(id + '-msg');
      if (!sugg) m.innerHTML = ui.msg('up', 'Fine for now', 'Your home and car limits cover what a lawsuit could take today. Raise them, and add an umbrella, as your savings grow.');
      else if (!umb) m.innerHTML = ui.msg('dn', 'Exposed', `A serious claim could reach about ${kM(Math.max(nw - Math.max(auto, home), 0))} of your own money. A ${kM(sugg)} umbrella sits on top of your home and car policies for exactly this.`);
      else m.innerHTML = ui.msg('up', 'Umbrella on', `A ${kM(sugg)} umbrella covers both cases. Insurers usually require higher car and home liability limits underneath it, so raise those too.`);
      $id(id + '-note').textContent = 'Retirement accounts often have extra legal protection from lawsuits; rules vary by state. An umbrella also pays legal defense costs. Ask your insurer what underlying limits it requires.';
    }

    const draw = ui.responsive(fig, (W) => {
      const mode = st.seg(id + '-m');
      $$('[data-g]', root).forEach((g) => g.classList.toggle('wpr-hide', g.dataset.g !== mode));
      if (mode === 'dis') dis(W); else if (mode === 'liab') liab(W); else life(W);
    });
  };

  /* =====================================================================
     2. estateMap: how each asset passes at death
     ===================================================================== */
  SML.widgets.estateMap = function (root, opts) {
    const id = SML.uid('wpe');
    const FAM = {
      single: { label: 'Single, no kids', kids: false, married: false, assets: [['k401', '401(k)', 150000, 'form'], ['ira', 'IRA', 40000, 'form'], ['bank', 'Bank accounts', 30000, 'pod'], ['brok', 'Brokerage', 60000, 'tod'], ['home', 'Home equity', 220000, 'sole'], ['stuff', 'Car and belongings', 25000, 'will']] },
      family: { label: 'Married, young kids', kids: true, married: true, assets: [['k401', '401(k)', 420000, 'form'], ['ira', 'IRA', 90000, 'form'], ['life', 'Life insurance', 1000000, 'form'], ['bank', 'Bank accounts', 45000, 'pod'], ['brok', 'Brokerage', 160000, 'tod'], ['home', 'Home equity', 350000, 'joint'], ['stuff', 'Car and belongings', 40000, 'will']] },
      blended: { label: 'Remarried, kids from first marriage', kids: true, married: true, assets: [['k401', '401(k)', 400000, 'form'], ['ira', 'IRA', 120000, 'form'], ['life', 'Work life insurance', 300000, 'form'], ['bank', 'Bank accounts', 60000, 'pod'], ['brok', 'Brokerage', 150000, 'tod'], ['home', 'Home equity', 300000, 'joint'], ['stuff', 'Car and belongings', 35000, 'will']] },
    };
    const DOCS = [{ k: 'will', label: 'Will', color: 'var(--accent)' }, { k: 'benef', label: 'Beneficiary forms current', color: 'var(--up)' }, { k: 'tod', label: 'TOD / POD on accounts', color: 'var(--up)' }, { k: 'trust', label: 'Funded living trust', color: 'var(--violet)' }, { k: 'poa', label: 'Power of attorney', color: 'var(--info)' }, { k: 'hc', label: 'Healthcare directive', color: 'var(--info)' }];
    const sc0 = (opts && opts.scenario) || 'family';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Family</span>${ui.seg(id + '-f', Object.keys(FAM).map((k) => ({ v: k, label: k === 'single' ? 'Single' : k === 'family' ? 'Married, kids' : 'Remarried' })), sc0, 'Family situation')}</div>
      <div class="wg-bar"><span class="wg-title">Documents you have</span>${ui.chips(id + '-d', DOCS.map((d) => ({ ...d, on: false })))}</div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Passes directly', id + '-s1', 'hl')}${ui.stat('Through probate', id + '-s2')}${ui.stat('Problems', id + '-s3')}${ui.stat('Documents', id + '-s4')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wpr-list" id="${id}-list"></div>
      <div class="wg-actions"><button type="button" class="btn btn-up" data-a="fix">Fix everything</button><button type="button" class="btn btn-g" data-a="clear">Start over</button></div>
      <div class="wg-note">Made-up family and values. How each account passes depends on how it is titled and your state’s law. Real plans need an estate attorney.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const on = b.dataset.a === 'fix';
      $$('#' + id + '-d .chip').forEach((c) => { c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      draw();
    });
    /* route an asset: returns {path, kind, out} kind: direct|joint|trust|probate|problem */
    function route(a, f, d, sc) {
      const [k, , , type] = a;
      const intest = f.kids ? (sc === 'blended' ? 'State law splits it; stepchildren left out' : 'State law splits spouse and kids') : 'State law picks: parents, then siblings';
      const viaWill = (txt) => (d.will ? { path: 'Will, then probate', kind: 'probate', out: txt || 'Court process, months, public' } : { path: 'No will: probate', kind: 'problem', out: intest });
      if (type === 'form') {
        if (d.benef) return { path: 'Beneficiary form', kind: 'direct', out: f.kids && !d.trust ? 'Named people; kids need a custodian' : 'Named people, in weeks' };
        if (sc === 'blended' && k === 'life') return { path: 'Form from 2009', kind: 'problem', out: 'Pays the ex-spouse' };
        if (sc === 'blended' && k === 'k401') return { path: 'Federal spouse rule', kind: 'joint', out: 'All to spouse unless she waives' };
        return { path: 'Missing form', kind: 'probate', out: 'Plan default, often the estate' };
      }
      if (type === 'pod' || type === 'tod') {
        if (d.tod) return { path: type === 'pod' ? 'POD designation' : 'TOD designation', kind: 'direct', out: 'Named people, no court' };
        if (d.trust) return { path: 'Retitled to trust', kind: 'trust', out: 'Trustee follows your trust' };
        return viaWill();
      }
      if (type === 'joint') return { path: 'Joint with spouse', kind: 'joint', out: 'Spouse owns it automatically' };
      if (type === 'sole') {
        if (d.trust) return { path: 'Deed to trust', kind: 'trust', out: 'Trustee follows your trust' };
        if (d.tod) return { path: 'TOD deed, where allowed', kind: 'direct', out: 'Named people, if your state allows' };
        return viaWill();
      }
      if (d.trust && d.will) return { path: 'Will pours into trust', kind: 'trust', out: 'Small items, simple process' };
      return d.will ? { path: 'Will', kind: 'probate', out: 'Often a simpler small-estate process' } : viaWill();
    }
    const KC = { direct: ['f-up', 'up', 'Direct'], joint: ['f-info', 'info', 'Joint'], trust: ['f-vio', 'vio', 'Trust'], probate: ['f-acc', 'acc', 'Probate'], problem: ['f-dn', 'dn', 'Problem'] };
    const draw = ui.responsive(fig, (W) => {
      const sc = st.seg(id + '-f'), f = FAM[sc];
      const d = {}; DOCS.forEach((x) => { d[x.k] = st.on(id + '-d', x.k); });
      const rows = f.assets.map((a) => ({ a, r: route(a, f, d, sc) }));
      const total = sum(f.assets.map((a) => a[2]));
      const by = {}; rows.forEach((o) => { by[o.r.kind] = (by[o.r.kind] || 0) + o.a[2]; });
      const x0 = 10, x1 = W - 10;
      let b = '', y = 16;
      b += S.text(x0, y, 'WHERE ' + kM(total) + ' GOES', 'cap'); y += 8;
      let x = x0;
      ['direct', 'joint', 'trust', 'probate', 'problem'].forEach((k) => { const v = by[k] || 0; if (!v) return; const w = (v / total) * (x1 - x0); b += S.rect(x, y, w, 20, KC[k][0]); if (w > 64) b += S.text(x + 6, y + 14, KC[k][2] + ' ' + Math.round((v / total) * 100) + '%', 'sm b onacc'); x += w; });
      y += 20 + 14;
      const lg = legend(['direct', 'joint', 'trust', 'probate', 'problem'].filter((k) => by[k]).map((k) => ({ c: KC[k][0], t: KC[k][2] + ' ' + kM(by[k]) })), x0, y, x1 - x0); b += lg.svg; y += lg.h + 10;
      const c1 = (x1 - x0) * 0.26, pillW = Math.min(190, (x1 - x0) * 0.27);
      const avail = x1 - (x0 + c1 + 10 + pillW + 40);
      const maxOut = Math.max(...rows.map((o) => o.r.out.length));
      const wide = W >= 600 && maxOut * 6.3 <= avail;
      const outCls = wide && maxOut * 7 > avail ? 'sm' : 'md';
      rows.forEach((o, i) => {
        const [, name, val] = o.a, kc = KC[o.r.kind];
        const rh = wide ? 40 : 74; const ry = y;
        b += S.rect(x0, ry, x1 - x0, rh - 6, i % 2 ? 'f-surf' : 'f-shade', 5);
        if (wide) {
          b += S.text(x0 + 12, ry + 15, esc(name), 'md b ink') + S.text(x0 + 12, ry + 29, kM(val), 'sm mono');
          const px = x0 + c1 + 10;
          b += S.arrow(x0 + c1 - 22, ry + 17, px - 4, ry + 17, 'mut', 6);
          b += S.rect(px, ry + 6, pillW, 22, kc[0] + ' o70', 11) + S.text(px + pillW / 2, ry + 21, esc(o.r.path), 'sm b onacc', 'middle');
          const ox = px + pillW + 8;
          b += S.arrow(ox, ry + 17, ox + 20, ry + 17, kc[1], 6);
          b += S.text(ox + 28, ry + 21.5, esc(o.r.out), outCls + ' ' + (o.r.kind === 'problem' ? 'dn b' : 'ink'));
        } else {
          b += S.text(x0 + 10, ry + 18, esc(name), 'md b ink') + S.text(x1 - 10, ry + 18, kM(val), 'sm mono', 'end');
          const pw = Math.min(x1 - x0 - 20, o.r.path.length * 6.4 + 22);
          b += S.rect(x0 + 10, ry + 26, pw, 20, kc[0] + ' o70', 10) + S.text(x0 + 10 + pw / 2, ry + 40, esc(o.r.path), 'sm b onacc', 'middle');
          b += S.text(x0 + 10, ry + 61, '→ ' + esc(o.r.out), 'sm ' + (o.r.kind === 'problem' ? 'dn b' : 'ink'));
        }
        y += rh;
      });
      fig.innerHTML = S.wrap(W, y + 4, `How ${f.assets.length} assets pass at death for this family: ${Math.round(((by.direct || 0) + (by.joint || 0) + (by.trust || 0)) / total * 100)}% outside probate`, b);
      /* issues */
      const issues = [];
      if (sc === 'blended' && !d.benef) issues.push(['dn', 'The 2009 life insurance form still names the ex-spouse. Workplace plans follow the form, not your will.']);
      if (f.kids && !d.will) issues.push(['dn', 'No will, so no guardian is named: a court decides who raises your children.']);
      if (rows.some((o) => o.r.kind === 'problem' && o.r.path.indexOf('No will') === 0)) issues.push(['dn', 'With no will, state law decides who inherits what is left.']);
      if (f.kids && d.benef && !d.trust) issues.push(['acc', 'Young children cannot take money directly. Name a trust or a custodian (UTMA) as the backup on each form.']);
      if (!d.poa) issues.push(['acc', 'No power of attorney: if you cannot act, family may need a court to manage your money.']);
      if (!d.hc) issues.push(['acc', 'No healthcare directive: doctors and family must guess your wishes.']);
      if ((by.probate || 0) > 0 && !d.tod && !d.trust) issues.push(['acc', 'Add TOD or POD to bank and brokerage accounts so they skip probate.']);
      if (sc === 'blended' && d.benef) issues.push(['info', 'For the 401(k), your spouse gets it by federal law unless she signs a waiver. Talk it through if you want your children to share.']);
      const nProb = issues.filter((x) => x[0] === 'dn').length;
      const dirP = Math.round(((by.direct || 0) + (by.joint || 0) + (by.trust || 0)) / total * 100);
      sv(id + '-s1', dirP + '%', dirP >= 90 ? 'up' : dirP >= 60 ? 'acc' : 'dn');
      const probV = sum(rows.filter((o) => o.r.kind === 'probate' || /probate/i.test(o.r.path)).map((o) => o.a[2]));
      sv(id + '-s2', kM(probV), probV > 0 ? 'acc' : 'up');
      sv(id + '-s3', String(nProb), nProb ? 'dn' : 'up');
      const nd = DOCS.filter((x) => d[x.k]).length; sv(id + '-s4', nd + ' / ' + DOCS.length, nd === DOCS.length ? 'up' : '');
      const m = $id(id + '-msg');
      if (nProb) m.innerHTML = ui.msg('dn', 'Fix first', issues.find((x) => x[0] === 'dn')[1]);
      else if (nd < DOCS.length) m.innerHTML = ui.msg('acc', 'Nearly there', issues.length ? issues[0][1] : 'A few documents are still missing.');
      else m.innerHTML = ui.msg('up', 'In order', 'Every asset has a clear road, and someone you trust can act if you cannot. Review the forms after any marriage, divorce, birth or move.');
      $id(id + '-list').innerHTML = issues.length ? `<b>Checklist for this family</b><ul>${issues.map((x) => `<li><i class="${x[0]}"></i><span>${x[1]}</span></li>`).join('')}</ul>` : '<b>Checklist for this family</b><ul><li><i class="up"></i><span>Nothing missing. Keep a one-page list of accounts and where documents are, and tell your executor.</span></li></ul>';
    });
  };

  /* =====================================================================
     3. scamSpotter: decide safe or scam, then see the red flags
     ===================================================================== */
  const SCAMS = [
    { kind: 'sms', av: 'BK', from: '+1 (302) 555-0143', sub: 'Text message', scam: true,
      body: ['[[1|BANK FRAUD ALERT]]: Suspicious login blocked on your account.', 'Verify now at [[2|secure-acct-verify.co]] or your account [[3|will be locked in 24 hours]].'],
      flags: ['Unexpected alert designed to scare you into acting.', 'The link is not your bank’s real website. Never log in from a texted link.', 'A deadline to rush you: real banks give you time and let you call them.'],
      ok: 'Delete it. If you are worried, open your bank’s app or call the number on the back of your card.' },
    { kind: 'call', av: 'SS', from: 'Caller ID: Social Security Admin', sub: 'Phone call, transcript', scam: true,
      body: ['“This is Officer Daniels with Social Security. Your number was used in a crime and [[1|will be suspended]].', 'To protect your savings, [[2|move them to a safe government account]] today. [[3|Do not tell your bank]]; employees there may be involved.”'],
      flags: ['Social Security does not suspend numbers or threaten you.', 'No real agency or bank ever asks you to move money to keep it safe. That “safe account” belongs to the scammer.', 'Secrecy is the tell: scammers isolate you from the people who would stop them.'],
      ok: 'Hang up. Caller ID can be faked. Call Social Security yourself at the number on ssa.gov.' },
    { kind: 'email', av: 'IR', from: 'IRS Collections <notice@irs-gov-pay.com>', sub: 'FINAL NOTICE: Balance due', scam: true,
      body: ['You owe $2,140 in back taxes. [[1|Pay today with gift cards or Bitcoin]] to avoid [[2|arrest by local police]].', 'Reply with the card numbers to [[3|this address]].'],
      flags: ['The IRS does not take gift cards or crypto, and does not demand payment by email.', 'Threats of arrest are a pressure tactic, not how tax debts work.', 'The sender’s address is not irs.gov.'],
      ok: 'Do not reply. Check your real account at irs.gov by typing the address yourself.' },
    { kind: 'dm', av: 'LY', from: 'Lily (new contact)', sub: 'Messaging app', scam: true,
      body: ['Hi, sorry, [[1|wrong number]]! But you seem kind 😊 I trade gold with my uncle’s signals, [[2|made 34% last month with no risk]].', 'Download [[3|GoldLane Pro]], deposit a little crypto, and I will show you.'],
      flags: ['A “wrong number” that turns into friendship is how many romance and investment scams start.', 'Guaranteed or no-risk high returns do not exist.', 'An app you have never heard of, funded with crypto. These fake apps show fake profits.'],
      ok: 'Stop replying and block. Check any firm on FINRA BrokerCheck before sending money anywhere.' },
    { kind: 'app', av: 'GL', from: 'GoldLane Pro', sub: 'Trading app notice', scam: true,
      body: ['Congratulations! Your balance is [[1|$48,200 (+382%)]].', 'To withdraw, [[2|first pay a 20% tax deposit]] of $9,640 [[3|within 48 hours]].'],
      flags: ['Huge, smooth gains on an unknown app are numbers on a screen, not money.', 'Real platforms take taxes or fees out of a withdrawal. Paying first to get your money out is the classic ending of this scam.', 'Another deadline to keep you from asking anyone.'],
      ok: 'Pay nothing more. Report it at ReportFraud.ftc.gov and ic3.gov, and beware of anyone offering to “recover” the money for a fee.' },
    { kind: 'sms', av: 'BK', from: 'Your bank (short code 72166)', sub: 'Text message', scam: false,
      body: ['Card ending 4421: Did you make a $482.19 purchase at HOME SUPPLY? [[1|Reply Y or N]].', '[[2|We will never ask for your PIN, password or a code.]]'],
      flags: ['It asks only for Y or N. No link, no login, no code.', 'It tells you what the bank will never ask for. That is how real fraud alerts read.'],
      ok: 'Answering Y or N is fine. If anything feels off, call the number on the back of your card instead.' },
    { kind: 'popup', av: '!', from: 'Browser window', sub: 'Full-screen warning', scam: true,
      body: ['[[1|WARNING! Your computer is infected]] and your bank details are at risk.', '[[2|Call Microsoft Support at 1-888-555-0199 now]]. [[3|Do not shut down]] your computer.'],
      flags: ['Real virus warnings do not take over your browser and shout.', 'Tech companies do not put phone numbers in pop-ups. The number reaches the scammer, who will ask for remote access.', 'Telling you not to restart keeps the fake screen in front of you.'],
      ok: 'Close the browser, or restart the computer. Never give remote access to someone who contacted you.' },
    { kind: 'call', av: '??', from: 'Unknown number', sub: 'Phone call, transcript', scam: true,
      body: ['“Grandma? It’s me. I was in a car accident and I’m in jail. I need [[1|$3,000 for bail right now]].', '[[2|Please don’t tell Mom]]. My lawyer will [[3|send a courier to pick up the cash]].”'],
      flags: ['An emergency plus a demand for money right now. The voice can be cloned with AI from a short clip.', 'Secrecy again, so nobody can check the story.', 'Couriers collecting cash or gold are a common way scammers take money that cannot be traced.'],
      ok: 'Hang up and call your grandchild or their parent on a number you already have. A family code word settles it in seconds.' },
    { kind: 'email', av: '4K', from: 'Your 401(k) provider', sub: 'Your quarterly statement is ready', scam: false,
      body: ['Your statement for the quarter is ready. [[1|Log in through our app or the website you normally use]] to view it.', '[[2|We will never ask for your password or a code by email or phone.]]'],
      flags: ['It does not include a link or ask you to act fast. It sends you to the app or site you already use.', 'It reminds you what they never ask for.'],
      ok: 'Fine to read. Still open the app or type the site yourself rather than clicking any link.' },
  ];
  SML.widgets.scamSpotter = function (root, opts) {
    const id = SML.uid('wps');
    const items = SCAMS;
    let i = 0, answered = false, res = items.map(() => 0); /* 1 right, -1 wrong */
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Safe or scam?</span><span class="grow"></span><span class="wpr-steps" id="${id}-dots"></span><span class="meta" id="${id}-cnt"></span></div>
      <div class="wg-fig"><div class="wpr-stage" id="${id}-stage"></div></div>
      <div class="wg-read">${ui.stat('Right', id + '-s1', 'hl')}${ui.stat('Scams caught', id + '-s2')}${ui.stat('Safe ones trusted', id + '-s3')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g" data-a="prev">Back</button><button type="button" class="btn btn-p" data-a="next">Next message</button><span class="grow" style="flex:1"></span><button type="button" class="btn btn-g" data-a="reset">Start again</button></div>`;
    const stage = $id(id + '-stage');
    const mark = (s) => esc(s).replace(/\[\[(\d)\|([^\]]+)\]\]/g, (m, n, t) => `<mark class="wpr-fl">${t}<sup>${n}</sup></mark>`);
    function card(it) {
      const body = it.body.map((p) => `<p>${mark(p)}</p>`).join('');
      return `<div class="wpr-card${answered ? ' wpr-show' + (it.scam ? '' : ' legit') : ''}"><div class="wpr-card-h"><span class="wpr-av" aria-hidden="true">${esc(it.av)}</span><span class="wpr-from"><b>${esc(it.from)}</b><small>${esc(it.sub)}</small></span></div>
        <div class="wpr-body ${it.kind}">${it.kind === 'email' ? `<div class="wpr-sub">${esc(it.sub)}</div>` : ''}${body}</div></div>`;
    }
    function render() {
      const it = items[i];
      if (i >= items.length) { renderEnd(); return; }
      stage.innerHTML = card(it) + (answered
        ? `<div class="wpr-why${it.scam ? '' : ' legit'}"><p class="wg-title">${it.scam ? 'Red flags' : 'Why it looks genuine'}</p><ol>${it.flags.map((f) => `<li><span>${esc(f)}</span></li>`).join('')}</ol><p class="wpr-do"><b>What to do:</b> ${esc(it.ok)}</p></div>`
        : `<div class="wpr-ans"><button type="button" class="btn btn-g" data-v="safe">Looks safe</button><button type="button" class="btn btn-dn" data-v="scam">It’s a scam</button></div>`);
      $id(id + '-dots').innerHTML = items.map((x, j) => `<span class="wpr-dot${res[j] > 0 ? ' ok' : res[j] < 0 ? ' no' : ''}${j === i ? ' cur' : ''}" aria-hidden="true"></span>`).join('');
      $id(id + '-cnt').textContent = `${i + 1} / ${items.length}`;
      stats();
      const m = $id(id + '-msg');
      if (!answered) m.innerHTML = ui.msg('info', 'Your call', 'Read it like it just arrived. Would you act on it?');
      else if (res[i] > 0) m.innerHTML = ui.msg('up', 'Right', it.scam ? 'Scam spotted. Every flag above shows up again and again.' : 'Correct, this one reads like a genuine message. You still lose nothing by checking through your own app.');
      else m.innerHTML = ui.msg('dn', 'Not this time', it.scam ? 'This one is a scam. Look at the numbered flags; next time any one of them is reason to stop.' : 'This one is likely genuine, but being careful is never wrong. Notice what it does not ask for.');
      const nb = root.querySelector('[data-a=next]'); if (nb) { nb.hidden = false; nb.textContent = i === items.length - 1 ? 'See your score' : 'Next message'; }
    }
    function stats() {
      const right = res.filter((r) => r > 0).length, n = res.filter((r) => r !== 0).length;
      const scamIdx = items.map((x, j) => (x.scam ? j : -1)).filter((j) => j >= 0), safeIdx = items.map((x, j) => (!x.scam ? j : -1)).filter((j) => j >= 0);
      sv(id + '-s1', `${right} / ${n}`, n && right === n ? 'up' : '');
      sv(id + '-s2', `${scamIdx.filter((j) => res[j] > 0).length} / ${scamIdx.length}`);
      sv(id + '-s3', `${safeIdx.filter((j) => res[j] > 0).length} / ${safeIdx.length}`, 'up');
    }
    function renderEnd() {
      const right = res.filter((r) => r > 0).length;
      stage.innerHTML = `<div class="wpr-end"><h4>${right} of ${items.length} right</h4><p class="wg-title">The five flags behind almost every scam</p>
        <div class="wpr-why"><ol>${['It contacts you out of the blue: a call, text, pop-up or new “friend”.', 'It rushes you with a deadline, a threat or a once-only chance.', 'It asks you to keep it secret from family or your bank.', 'It wants money in a form you cannot pull back: gift cards, crypto, wires, cash couriers or a “safe account”.', 'It promises returns with no risk, or asks you to pay before you can withdraw.'].map((t) => `<li><span>${t}</span></li>`).join('')}</ol>
        <p class="wpr-do"><b>One habit beats them all:</b> hang up or close it, then contact the company or person yourself, on a number or site you already know.</p></div></div>`;
      $id(id + '-dots').innerHTML = items.map((x, j) => `<span class="wpr-dot${res[j] > 0 ? ' ok' : res[j] < 0 ? ' no' : ''}" aria-hidden="true"></span>`).join('');
      $id(id + '-cnt').textContent = 'Done';
      const nb = root.querySelector('[data-a=next]'); if (nb) nb.hidden = true;
      stats();
      $id(id + '-msg').innerHTML = ui.msg(right === items.length ? 'up' : 'acc', right === items.length ? 'Sharp' : 'Good practice', right === items.length ? 'Every message sorted correctly. Share the five flags with someone who answers the phone for strangers.' : 'Scammers practise every day. Re-run the ones you missed, and share the five flags with family.');
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.dataset.v && i < items.length && !answered) {
        const saidScam = b.dataset.v === 'scam';
        res[i] = saidScam === items[i].scam ? 1 : -1; answered = true; render(); return;
      }
      const a = b.dataset.a;
      if (a === 'next') { if (i < items.length) { i++; answered = i < items.length && res[i] !== 0; } render(); }
      else if (a === 'prev') { if (i > 0) { i--; answered = res[i] !== 0; render(); } }
      else if (a === 'reset') { i = 0; answered = false; res = items.map(() => 0); render(); }
    });
    render();
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-insurance', course: 'protect', order: 1, title: 'Insurance you actually need', mins: 9, level: 'Beginner',
    summary: 'Life, disability and lawsuit cover: what to buy, how much, and what to skip.',
    idea: 'Insurance protects the plan, not your returns. Buy cheap cover for disasters you could never pay for, and self-insure the small stuff.',
    widget: 'insuranceNeeds',
    try: 'Pick a person, then switch between Life, Disability and Lawsuits. Move the sliders and watch the gap open or close.',
    body: [
      '<h3>What insurance is for</h3><p>Insurance moves a risk you could not survive onto a company that pools it with thousands of others. Use it for the big, rare disasters: an early death, years without income, a lawsuit, a house fire. For small costs, an emergency fund and higher deductibles are cheaper than paying premiums every year.</p>',
      '<h3>Life insurance: term, not a savings plan</h3><p>If anyone depends on your income or your unpaid work, such as raising children, you need life insurance. For most families the right kind is <b>term</b>: a fixed premium for 10 to 30 years and a payout only if you die in that window. It is cheap because most policies never pay.</p><p><b>Whole life</b> and other permanent policies bundle insurance with a savings account. They cost several times more for the same payout and come with commissions and surrender charges. For most people, buying term and investing the difference in a 401(k) or IRA leaves more money. Permanent insurance can fit narrow cases, such as funding a trust for a disabled child, and that is a job for a fee-only adviser.</p>',
      '<h3>How much life cover: the DIME method</h3><ul><li><b>D</b>ebts: cards, car and student loans.</li><li><b>I</b>ncome: your yearly income times the years your family would need it.</li><li><b>M</b>ortgage: the balance, so the family keeps the home.</li><li><b>E</b>ducation: what you want to set aside for college.</li></ul><p>Subtract savings your family could use. Pick a term long enough to cover the youngest child to adulthood or the mortgage to payoff. A stay-at-home parent needs cover too: replacing childcare and household work is expensive.</p><p>Group life through work is usually one or two times salary and ends when the job ends. Treat it as a bonus, not the plan.</p>',
      '<h3>Disability insurance: protect the paycheck</h3><p>Early in your career, your future paychecks are worth more than everything you own. A long illness or injury is more likely than an early death, and it stops the income while the bills keep coming.</p><ul><li><b>Percent replaced and the cap.</b> Group long-term disability pays a share of base pay up to a monthly maximum. Bonuses and stock often are not covered.</li><li><b>Definition of disability.</b> “Own occupation” pays if you cannot do your job; “any occupation” pays only if you cannot do any job. Own-occupation is better and costs more.</li><li><b>Waiting period.</b> Checks start after 30 to 180 days. Your emergency fund covers the gap.</li><li><b>Taxes.</b> If your employer pays the premium, the benefit is taxable income. If you pay with after-tax money, it is tax-free (IRS Publication 525).</li></ul><p>Social Security disability exists, but approval is strict and the check is modest. An individual policy can top up a thin group plan and follows you between jobs.</p>',
      '<h3>Lawsuits: liability limits and umbrellas</h3><p>Your car and home (or renters) policies include liability cover: they pay if you injure someone or damage their property. State minimums for car liability are low. As your savings grow, raise those limits and add an <b>umbrella policy</b> that sits on top of both and pays legal defense too. It is usually sold in $1 million layers and costs far less than the home or car policy beneath it. Teen drivers, pools, dogs and rental properties all raise the risk.</p>',
      '<h3>Home, renters, car and health</h3><ul><li><b>Home:</b> insure the cost to rebuild, not the market price. Flood and earthquake need separate policies.</li><li><b>Renters:</b> covers your belongings and liability for little money. Landlords’ policies do not cover your things.</li><li><b>Car:</b> collision and comprehensive matter less as a car ages; liability matters more as you get richer.</li><li><b>Health:</b> picking a plan is its own lesson: see <a href="#l-open-enrollment">open enrollment</a> and, if you retire early, <a href="#l-aca">health insurance before 65</a>.</li></ul>',
      '<h3>Usually skip</h3><ul><li>Credit life and mortgage life insurance: they pay the lender and shrink over time. Term covers the same debt for less.</li><li>Accident-only, cancer-only and flight insurance: narrow cover for rare events.</li><li>Extended warranties on electronics and appliances: your emergency fund handles these.</li><li>Any policy sold mainly as an investment.</li></ul>',
    ],
    example: {
      title: 'A young family runs the DIME numbers',
      intro: 'Sam earns $85,000, has two kids, a mortgage and some savings. All numbers are made up.',
      steps: [
        'Debts: a $20,000 car loan and $5,000 on cards, so $25,000.',
        'Income: $85,000 a year for 15 years, until the youngest finishes school, is $1,275,000.',
        'Mortgage: $300,000 left. Education: $60,000 for each of two kids, so $120,000.',
        'Total need: $25,000 + $1,275,000 + $300,000 + $120,000 = $1,720,000.',
        'Subtract $70,000 of savings. Sam leaves out his $85,000 of group life through work, because it ends if he changes jobs. The gap is $1,650,000.',
        'He prices a 15-year term policy for $1.65 million, matching the years his family needs his income. His partner, who handles childcare, gets her own term policy too.',
      ],
      result: 'A 15-year term policy of about $1.65 million covers the family on its own. The work policy is a bonus on top while Sam stays in the job.',
    },
    mistakes: [
      'Relying only on life insurance through work. It is usually small and ends when the job does.',
      'Buying whole life as an investment without comparing it with term plus a 401(k) or IRA. The fees and surrender charges are easy to miss.',
      'Skipping disability insurance, or never reading whether the group plan covers your own occupation and how much it caps.',
      'Keeping state-minimum car liability while your savings grow. One serious accident can reach your house and brokerage account.',
    ],
    points: [
      'Insure the disasters you cannot afford; self-insure the small stuff with an emergency fund.',
      'Most families need term life insurance, sized with DIME, for as long as others depend on them.',
      'Disability cover protects your biggest early asset: your future paychecks.',
      'Raise car and home liability limits and add an umbrella once you have real savings.',
    ],
    terms: ['Term life insurance', 'Whole life insurance', 'Disability insurance', 'Umbrella policy', 'Insurance premium', 'Deductible'],
    glossary: [
      { t: 'DIME method', d: 'A simple way to size life insurance: Debts + Income × years + Mortgage + Education, minus savings.' },
      { t: 'Own-occupation', d: 'A disability policy that pays if you cannot do your own job, even if you could do a different one.' },
      { t: 'Waiting period', full: 'Elimination period', d: 'The days you must be disabled before disability benefits start.' },
    ],
    quiz: { q: 'Your employer pays the premium for your long-term disability plan. If you collect benefits, how are they taxed?', options: ['They are tax-free', 'They are taxable income', 'They are taxed as capital gains'], answer: 1, why: 'When the employer pays the premium, the benefits count as taxable income. Benefits from a policy you paid for with after-tax money are tax-free.' },
    sources: [
      { t: 'IRS Publication 525: Taxable and Nontaxable Income (sickness and injury benefits)', u: 'https://www.irs.gov/publications/p525' },
    ],
  });

  SML.lessons.push({
    id: 'l-estate', course: 'protect', order: 2, title: 'Wills, beneficiaries and trusts', mins: 10, level: 'Beginner',
    summary: 'Make sure the right people get your money quickly, without court delays or old mistakes.',
    idea: 'Most money passes by beneficiary forms, not your will. Keep the forms current, then use a will or trust for everything else.',
    widget: 'estateMap',
    try: 'Pick a family, then turn documents on and off. Watch which assets go straight to people and which get stuck in probate.',
    body: [
      '<h3>The roads money takes when you die</h3><ul><li><b>Beneficiary form:</b> 401(k), IRA, HSA, life insurance and annuities go to the people named on the form.</li><li><b>Payable-on-death (POD) and transfer-on-death (TOD):</b> bank and brokerage accounts, and in many states cars and real estate, can name heirs the same way.</li><li><b>Joint ownership with right of survivorship:</b> the other owner simply keeps it.</li><li><b>A trust:</b> whatever is titled in the trust follows the trust’s instructions.</li><li><b>Everything else</b> goes through your <b>will</b> and the court process called <b>probate</b>. With no will, state law decides who inherits.</li></ul>',
      '<h3>Beneficiary forms beat the will</h3><p>If your will says “everything to my spouse” but an old IRA form names your sister, your sister gets the IRA. Workplace plans pay whoever the plan’s form names, and the US Supreme Court has upheld paying an ex-spouse named on an old form. Review every form after a marriage, divorce, birth or death.</p><ul><li>Name a primary and a contingent (backup) beneficiary on every account.</li><li>For a 401(k), federal law generally makes your spouse the beneficiary unless your spouse signs a written waiver.</li><li>Minors cannot take money directly. Name a trust or a custodian under your state’s Uniform Transfers to Minors Act (UTMA), or a court may appoint someone.</li><li>Avoid naming “my estate”: it pushes the account into probate and can make heirs empty an inherited IRA faster.</li></ul>',
      '<h3>The will: guardians first</h3><p>If you have young children, the most important line in a will names their <b>guardian</b>. A will also names the executor who settles your affairs and says who gets anything without a beneficiary or joint owner. Probate is public, can take months to more than a year, and costs court and legal fees that vary a lot by state.</p>',
      '<h3>Revocable living trust</h3><p>You control the trust while alive and can change it any time. At death, your chosen trustee hands out the assets without probate, privately. It helps most if you own real estate in more than one state, want to control how heirs receive money, or want someone to step in smoothly if you become unable to manage things. It only works for assets you actually retitle into it, which is called <b>funding</b> the trust. A short “pour-over” will catches anything you forgot.</p>',
      '<h3>Documents for while you are alive</h3><ul><li><b>Durable financial power of attorney:</b> lets someone you trust pay bills and manage accounts if you cannot.</li><li><b>Healthcare power of attorney and living will</b> (an advance directive): names who speaks for you with doctors and records your wishes.</li><li><b>HIPAA release:</b> lets family get medical information.</li></ul><p>Without these, your family may need a court-ordered guardianship to act for you, which is slow and costly.</p>',
      '<h3>Taxes at death</h3><ul><li>The federal estate and gift tax exemption is <b>$15,000,000 per person in 2026</b>, set by the 2025 tax law and adjusted for inflation in later years. Very few estates owe federal estate tax. A surviving spouse can also claim the unused part of the first spouse’s exemption (called portability) by filing an estate tax return.</li><li>You can give up to <b>$19,000 per person in 2026</b> without filing a gift tax return; larger gifts just use up part of the lifetime exemption.</li><li>Some states have their own estate or inheritance taxes with much lower thresholds.</li><li><b>Step-up in basis:</b> stocks and funds inherited in a taxable account get a new cost basis equal to their value at death, so the gain built up during your life is never taxed. Inherited retirement accounts are different: withdrawals from an inherited traditional IRA or 401(k) are taxed as income, while inherited Roth withdrawals are generally tax-free once the Roth has been open five years. Either way, most non-spouse heirs must empty the account within 10 years.</li></ul>',
      '<h3>Make it easy to find</h3><p>Keep a one-page list of accounts, policies, the location of documents and how to reach your adviser or attorney. Tell your executor where it is. Many accounts and phones now let you name a legacy contact for digital access.</p>',
    ],
    example: {
      title: 'The old form that beats the new will',
      intro: 'Dan, 52, remarried. Every name and number here is made up.',
      steps: [
        'Dan has a $400,000 401(k), $300,000 of life insurance through work, a $150,000 brokerage account, $60,000 in the bank, and a home owned jointly with his wife, Maya.',
        'His new will splits everything between Maya and his two children from his first marriage.',
        'The work life insurance form, signed in 2009, still names his ex-wife. Workplace plans pay whoever the form names, so the $300,000 can go to her.',
        'The brokerage and bank accounts have no TOD or POD, so $210,000 goes through probate under the will: court filings, fees and months of waiting.',
        'The fix takes an afternoon: a new life insurance form naming Maya and a trust for the children, TOD and POD on the accounts, and a talk with Maya about the 401(k), which goes to her by law unless she signs a waiver.',
      ],
      result: 'Before: $300,000 to the wrong person and $210,000 stuck in probate. After: every asset has a direct road, and the will only handles the leftovers.',
    },
    mistakes: [
      'Never updating beneficiary forms after a divorce, marriage or new child. The form wins over the will.',
      'Naming young children directly as beneficiaries instead of a trust or custodian.',
      'Paying for a living trust and never retitling accounts and the home into it, so everything still goes through probate.',
      'Planning only for death and skipping the power of attorney and healthcare directive you would need if you were alive but unable to act.',
    ],
    points: [
      'Beneficiary forms, TOD/POD and joint ownership decide most of where money goes. Check them every year.',
      'A will names guardians for your children and handles whatever has no other road.',
      'A funded revocable living trust skips probate and keeps things private.',
      'In 2026 the federal estate tax exemption is $15 million per person, so most families should focus on paperwork, not estate tax.',
    ],
    terms: ['Will', 'Beneficiary designation', 'Revocable living trust', 'Probate', 'Power of attorney', 'Step-up in basis'],
    glossary: [
      { t: 'TOD / POD', full: 'Transfer on death / payable on death', d: 'A designation on a brokerage or bank account that passes it straight to named people, outside probate.' },
      { t: 'Executor', d: 'The person your will names to settle your estate: pay bills, file taxes and hand out what is left.' },
      { t: 'Intestacy', d: 'Dying without a will. State law then decides who inherits.' },
      { t: 'Portability', d: 'A surviving spouse claiming the unused part of the first spouse’s estate tax exemption by filing an estate tax return.' },
    ],
    quiz: { q: 'Your will leaves everything to your spouse, but your IRA’s beneficiary form names your sister. Who gets the IRA?', options: ['Your spouse, because the will is newer', 'Your sister, because the form controls the account', 'A probate court splits it between them'], answer: 1, why: 'Accounts with a beneficiary form pass by the form, outside the will. Keep the forms current.' },
    sources: [
      { t: 'IRS: What’s new, estate and gift tax (2026 basic exclusion $15,000,000; annual exclusion $19,000)', u: 'https://www.irs.gov/businesses/small-businesses-self-employed/whats-new-estate-and-gift-tax' },
      { t: 'IRS Publication 590-B: distributions from inherited IRAs (10-year rule)', u: 'https://www.irs.gov/publications/p590b' },
    ],
  });

  SML.lessons.push({
    id: 'l-scams', course: 'protect', order: 3, title: 'Scams that target savers', mins: 8, level: 'Beginner',
    summary: 'Spot impostor calls, fake investments and romance scams before they reach your savings.',
    idea: 'Every scam rushes you, isolates you and asks for money you cannot get back. Slow down and check on your own.',
    widget: 'scamSpotter',
    try: 'Read each message and decide: safe or scam. Then see the red flags, and what to do next.',
    body: [
      '<h3>How big the problem is</h3><p>Americans reported <b>$15.9 billion</b> lost to fraud in 2025 to the Federal Trade Commission, up from about $12.5 billion in 2024. Investment scams caused the most damage, <b>$7.9 billion</b>, and impostor scams were the most common, with more than a million reports. The FBI’s Internet Crime Complaint Center counted <b>$20.9 billion</b> in reported losses, including <b>$7.7 billion</b> from people aged 60 and over. Savers and retirees are targets because they have money in accounts that can be moved quickly.</p>',
      '<h3>The five red flags</h3><ul><li><b>Out of the blue:</b> a call, text, email, pop-up or new online friend you did not expect.</li><li><b>Pressure:</b> a deadline, a threat of arrest or a locked account, or a once-only chance.</li><li><b>Secrecy:</b> “do not tell your bank”, “do not tell Mom”.</li><li><b>Payment you cannot reverse:</b> gift cards, crypto, wire transfers, cash handed to a courier, or a “safe account”.</li><li><b>Too good to be true:</b> high returns with no risk, or a fee you must pay before you can withdraw.</li></ul>',
      '<h3>The scams to know</h3><ul><li><b>Impostors:</b> fake bank fraud teams, IRS, Social Security, police or tech support. Caller ID can be faked to show a real name.</li><li><b>Investment and romance scams:</b> a friendly stranger, often after a “wrong number” text, introduces a trading app or crypto platform that shows fake profits. The ending is always a fee or “tax” to withdraw.</li><li><b>Grandparent and family emergencies:</b> a panicked call, sometimes with an AI-cloned voice, asking for bail or hospital money.</li><li><b>Phishing and smishing:</b> emails and texts that copy real companies to steal logins and one-time codes.</li><li><b>Fake checks and overpayments:</b> you are sent too much and asked to send the difference back before the check bounces.</li></ul>',
      '<h3>Defenses that work</h3><p>Each tool below blocks one kind of attack. The biggest losses, from investment and impostor scams, happen when people send the money themselves, and no lock stops that. There the defense is a habit: hang up and verify through a number you look up yourself.</p><ul><li>Hang up and call back on a number you already trust: the back of your card, the app, or a site you type yourself.</li><li><b>Freeze your credit</b> at Equifax, Experian and TransUnion. It is free and stops new accounts in your name; you can lift it when you apply for credit.</li><li>Use two-factor authentication, ideally an authenticator app, to protect your logins, and never read a one-time code to anyone.</li><li>Agree on a family code word to unmask fake emergency calls from “relatives”.</li><li>Add a <b>trusted contact person</b> to your brokerage and retirement accounts, so the firm has someone to call if something looks wrong.</li><li>Check any adviser or firm on FINRA BrokerCheck before you send money (see <a href="#l-broker">choosing a broker</a>).</li><li>Real government agencies never demand gift cards, crypto or wire transfers.</li></ul>',
      '<h3>If it already happened</h3><ul><li>Call your bank or broker right away. Wires and transfers can sometimes be stopped if you act fast.</li><li>Report it at ReportFraud.ftc.gov and to the FBI at ic3.gov. Use IdentityTheft.gov if your identity was stolen.</li><li>For people 60 and over, the National Elder Fraud Hotline is 1-833-FRAUD-11 (1-833-372-8311).</li><li>Change passwords, freeze your credit, and watch for “recovery” services that promise to get your money back for a fee. That is a second scam.</li></ul>',
    ],
    example: {
      title: 'The “safe account” call',
      steps: [
        'Your phone shows your bank’s name. The caller says your account was hacked and reads the last four digits of your card to sound real.',
        'They say a branch employee is involved, so you must not tell anyone there, and you need to move $48,000 to a “safe account” today.',
        'Count the flags: unexpected call, pressure, secrecy, and moving money to protect it. Real banks never ask you to move money to keep it safe.',
        'You hang up and call the number on the back of your card. The bank confirms your account is fine and notes the attempt.',
        'You freeze your credit at the three bureaus and add a trusted contact to your brokerage account. It takes about 20 minutes.',
      ],
      result: 'Hanging up and calling back on a number you trust beat the whole script, and the $48,000 never moved.',
    },
    mistakes: [
      'Trusting caller ID or a sender name. Both are easy to fake.',
      'Thinking you are too careful to fall for it. Investment scams are slow, friendly and convincing, and they target smart, busy people.',
      'Paying a “tax” or “fee” to unlock a withdrawal from an app. Money that needs a fee to come out is already gone.',
      'Staying quiet out of embarrassment. Fast reporting is the only chance to stop a transfer, and it helps protect others.',
    ],
    points: [
      'Unexpected contact, pressure, secrecy and payments you cannot reverse mark nearly every scam.',
      'Hang up, then contact the company yourself on a number or site you already know.',
      'Each tool has one job: a credit freeze stops new accounts in your name, two-factor authentication protects your logins, and a family code word beats fake-family calls.',
      'The biggest losses come from people sending money themselves. Against investment and impostor scams, the defense is to hang up and verify through a number you look up yourself.',
      'If money moved, call your bank at once and report at ReportFraud.ftc.gov and ic3.gov.',
    ],
    terms: ['Credit score', 'Brokerage', 'SIPC'],
    glossary: [
      { t: 'Credit freeze', d: 'A free lock on your credit report at each bureau that stops new accounts being opened in your name until you lift it.' },
      { t: 'Phishing', d: 'Messages that copy a real company to trick you into giving a login, code or payment. By text it is called smishing.' },
      { t: 'Spoofing', d: 'Faking a caller ID, sender name or web address so a scam looks like it comes from someone you trust.' },
      { t: 'Trusted contact person', d: 'Someone your broker may call if it suspects fraud or cannot reach you. They cannot trade or log in, but the firm may share limited account information with them if it suspects exploitation or cannot reach you.' },
    ],
    quiz: { q: 'A caller from “your bank’s fraud team” says your money is at risk and asks you to move it to a safe account today. What should you do?', options: ['Move it quickly; they already know your card number', 'Hang up and call the number on the back of your card', 'Ask them to email you the account details first'], answer: 1, why: 'Banks never ask you to move money to protect it. Calling back on a number you trust ends the scam.' },
    sources: [
      { t: 'FTC: 2025 fraud losses ($15.9 billion; investment scams $7.9 billion)', u: 'https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-testifies-joint-economic-committee-agencys-efforts-combat-fraud' },
      { t: 'AARP: FBI and FTC 2025 fraud reports (IC3 $20.9 billion; $7.7 billion for people 60+)', u: 'https://www.aarp.org/money/scams-fraud/fbi-ftc-report-2025-losses.html' },
      { t: 'FTC consumer alert: Get a credit freeze', u: 'https://consumer.ftc.gov/consumer-alerts/2025/09/get-credit-freeze-stop-identity-thieves' },
      { t: 'Office for Victims of Crime: National Elder Fraud Hotline', u: 'https://ovc.ojp.gov/news/announcements/new-national-toll-free-hotline-provides-help-victims-elder-fraud' },
    ],
  });
})();
