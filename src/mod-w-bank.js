/* Retirement & Wealth track: Banking & Cards course (fork W3). Lessons l-bank-tiers, l-private-client, l-travel-money, l-rewards. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const usd0 = (v) => F.usd(v, 0);
  const sus0 = (v) => F.susd(v, 0);
  const kk = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(v % 1e6 ? 2 : 0).replace(/\.?0+$/, '') + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(v % 1000 ? 1 : 0).replace(/\.0$/, '') + 'K' : '$' + Math.round(v));
  const byId = (id) => document.getElementById(id);
  const setTxt = (id, t, cls) => { const el = byId(id); if (!el) return; el.textContent = t; if (cls != null) el.className = 'stat-v ' + cls; };
  const msg = (id, pc, pt, html) => { const el = byId(id); if (el) el.innerHTML = ui.msg(pc, pt, html); };

  /* ---------- figures checked October 2026 (see lesson sources) ---------- */
  const R = {
    depositApy: 0.01,   // % APY, Chase Private Client checking (effective 09/18/2026)
    altYield: 3.8,      // % VMFXX 7-day SEC yield was 3.83% on Oct 19, 2026; top HYSAs about 3.9%-4.27%
    altLabel: 'about 3.8%',
    ftf: 3,             // % typical foreign transaction fee (NerdWallet, Oct 2026)
    cardApr: 22.4,      // % Fed G.19, Aug 2026: 22.36% on accounts assessed interest
    dcc: 5,             // % EXAMPLE markup for paying in dollars abroad (varies; not a quoted figure)
  };

  const TIERS = [
    {
      k: 'total', name: 'Chase Total Checking', short: 'Total Checking', tiny: 'Total', min: 0, fee: 15,
      waive: '$500+ in monthly direct deposits, a $1,500 daily balance, or a $5,000 average balance in linked accounts',
      perks: ['Everyday checking and debit card', 'Abroad: $5 Chase fee per non-Chase ATM withdrawal, plus the owner’s fee', 'Wire fees apply'],
    },
    {
      k: 'premier', name: 'Chase Premier Plus Checking', short: 'Premier Plus', tiny: 'Premier', min: 15000, fee: 25,
      waive: 'a $15,000 average balance across linked deposits and investments',
      perks: ['No Chase fee at any ATM worldwide (the ATM owner may still charge)', 'No foreign exchange fee on debit card use', 'Earns a little interest; wire fees still apply'],
    },
    {
      k: 'sapphire', legacy: true, name: 'Chase Sapphire Checking', short: 'Sapphire (closed)', tiny: 'Sapphire', min: 75000, fee: 25,
      waive: 'a $75,000 average balance, for people who already have it',
      perks: ['ATM fees refunded worldwide', 'No foreign exchange fee on ATM and debit card use', 'No wire fees'],
      note: 'Closed to new accounts in 2026. Existing holders keep it; new customers go from Premier Plus straight to Private Client.',
    },
    {
      k: 'cpc', name: 'Chase Private Client', short: 'Private Client', tiny: 'Private', min: 150000, fee: 35,
      waive: 'a $150,000 average balance across linked deposits and qualifying J.P. Morgan investments',
      perks: ['No ATM fees worldwide, and other owners’ ATM fees refunded', 'No foreign exchange fee on ATM and debit card use', 'No Chase fees on incoming or outgoing wires', 'Dedicated banker, J.P. Morgan advisor and 24/7 service', 'Higher daily limits; relationship rates on home and auto loans'],
    },
    {
      k: 'jpm', name: 'J.P. Morgan Private Client', short: 'J.P. Morgan Private Client', tiny: 'JPM', min: 1000000, fee: 150,
      waive: '$1,000,000+ in qualifying balances (and free in the first year)',
      perks: ['Senior banker and a concierge team', 'ATM and wire fees waived worldwide', 'A complimentary luxury travel advisor and travel amenities', 'Preferred rates; a 0.25% mortgage discount at $1M+'],
    },
  ];
  const OPEN = TIERS.filter((t) => !t.legacy);
  const tierOf = (b) => { let t = OPEN[0]; OPEN.forEach((x) => { if (b >= x.min) t = x; }); return t; };

  SML.css(`
    .wbk-tiers{display:flex;flex-wrap:wrap;gap:1px;background:var(--line)}.wbk-tiers > .wbk-tier{flex:1 1 220px}
    .wbk-tier{background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0;opacity:.55;transition:opacity .2s,background-color .2s}
    .wbk-tier.on{opacity:1}
    .wbk-tier.leg{opacity:.75;background:repeating-linear-gradient(135deg,var(--surface) 0 10px,color-mix(in srgb,var(--line) 45%,var(--surface)) 10px 11px)}
    .wbk-tier.cur{background:color-mix(in srgb,var(--accent) 8%,var(--surface));box-shadow:inset 0 3px 0 var(--accent)}
    .wbk-tier h4{font-size:15px;font-weight:600;color:var(--ink);line-height:1.3;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
    .wbk-tier h4 span{font:600 11px var(--mono);color:var(--accent);white-space:nowrap}
    .wbk-tier .w{font-size:12.5px;line-height:1.45;color:var(--muted)}
    .wbk-tier ul{list-style:none;display:flex;flex-direction:column;gap:6px}
    .wbk-tier li{display:grid;grid-template-columns:14px minmax(0,1fr);gap:8px;font-size:13px;line-height:1.45;color:color-mix(in srgb,var(--ink) 85%,transparent)}
    .wbk-tier li i{width:8px;height:8px;border-radius:50%;margin-top:6px;background:var(--line)}
    .wbk-tier.on li i{background:var(--up)}
    .wbk-tier .nt{font-size:12px;line-height:1.45;color:var(--accent);border-left:2px solid var(--accent);padding-left:8px}
    .wbk-lock{font:600 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .wbk-tier.on .wbk-lock{color:var(--up)}
    .wbk-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em;padding:10px 16px}
    .wbk-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
    .wbk-r4 > .stat{flex:1 1 140px}
  `);
  const sw = (cls) => `<i style="background:var(${cls})"></i>`;

  /* =====================================================================
     1. tierLadder: balance slider lights up each Chase tier
     ===================================================================== */
  SML.widgets.tierLadder = function (root) {
    const id = SML.uid('wbt');
    const BR = [0, 15000, 75000, 150000, 1000000, 1500000];
    const toBal = (p) => {
      const i = Math.min(4, Math.floor(p / 20)), f = (p - i * 20) / 20;
      const v = BR[i] + f * (BR[i + 1] - BR[i]);
      const q = v < 15000 ? 500 : v < 150000 ? 1000 : 10000;
      return Math.round(v / q) * q;
    };
    const toPos = (b) => { for (let i = 0; i < 5; i++) if (b <= BR[i + 1]) return i * 20 + ((b - BR[i]) / (BR[i + 1] - BR[i])) * 20; return 100; };
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Presets</span>${ui.seg(id + '-p', [{ v: 'start', label: 'Starting out' }, { v: 'saver', label: 'Saver' }, { v: 'cash', label: '$160K in cash' }, { v: 'inv', label: '$160K mostly invested' }], 'saver', 'Preset')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-b', label: 'Balance at Chase + J.P. Morgan', min: 0, max: 100, step: 0.1, value: Math.round(toPos(40000) * 10) / 10, fmt: (v) => kk(toBal(v)) })}
        ${ui.slider({ id: id + '-c', label: 'Share kept as bank cash', min: 0, max: 100, step: 5, value: 50, fmt: 'pct' })}
        ${ui.slider({ id: id + '-y', label: 'What that cash could earn elsewhere', min: 0, max: 6, step: 0.1, value: R.altYield, fmt: 'pct1' })}
      </div>
      <div class="wg-read wbk-r4">${ui.stat('Your tier', id + '-t', 'hl')}${ui.stat('Monthly fee', id + '-f')}${ui.stat('Sitting in checking', id + '-cash')}${ui.stat('Interest given up / yr', id + '-oc')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wbk-tiers" id="${id}-cards"></div>
      <div class="wg-note">Drag the handle or the slider; each step of the staircase is one tier, so the scale stretches. Balances are average beginning-day balances across linked qualifying deposits and investments. Checking pays ${R.depositApy}% APY; a money market fund such as VMFXX paid about 3.8% in October 2026. Tiers from chase.com, October 2026; they change, so confirm with Chase.</div>`;
    const fig = root.querySelector('.wg-fig');
    const presets = { start: [3000, 100], saver: [40000, 50], cash: [160000, 90], inv: [160000, 15] };
    const st = ui.wire(root, (e) => {
      const seg = e && e.target && e.target.closest && e.target.closest('#' + id + '-p');
      if (seg) { const p = presets[st.seg(id + '-p')]; if (p) { st.set(id + '-b', toPos(p[0])); st.set(id + '-c', p[1]); } }
      draw();
    });
    let geo = null;
    const move = (pt) => { if (!geo) return; st.set(id + '-b', Math.round(SML.clamp((pt.x - geo.x0) / (geo.x1 - geo.x0), 0, 1) * 1000) / 10); draw(); };
    ui.drag(fig, { sel: '.handle,.wbk-hit', start: move, move });
    const draw = ui.responsive(fig, (W) => {
      const pos = st.n(id + '-b'), bal = toBal(pos), cashPct = st.n(id + '-c'), alt = st.n(id + '-y');
      const compact = W < 560;
      const H = compact ? 244 : 290;
      const x0 = 16, x1 = W - 16;
      const X = (b) => x0 + (toPos(b) / 100) * (x1 - x0);
      geo = { x0, x1 };
      const t = tierOf(bal);
      const base = H - 60, stepH = compact ? 26 : 34;
      let b = '';
      TIERS.forEach((tr, i) => {
        const a = X(tr.min), z = X(BR[i + 1]);
        const top = base - (i + 1) * stepH;
        const on = bal >= tr.min && !tr.legacy, cur = tr === t;
        const cls = tr.legacy ? 'f-shade s-mut dash2' : (on ? 'f-acc-t ' : 'f-shade ') + (cur ? 's-acc w2' : 's-line');
        b += S.rect(a + 1, top, z - a - 2, base - top, cls, 3);
        const name = compact ? tr.tiny : tr.short.replace('J.P. Morgan ', 'JPM ');
        b += S.text(a + (compact ? 5 : 7), top + (compact ? 14 : 15), name, (compact ? 'xs' : 'sm') + ' b ' + (tr.legacy ? 'mut' : on ? 'ink' : 'mut'));
        if (!compact) b += S.text(a + 7, top + 28, tr.legacy ? 'closed to new' : tr.min ? 'from ' + kk(tr.min) : 'any balance', 'xs mono');
      });
      b += S.line(x0, base + 0.5, x1, base + 0.5, 's-mut');
      BR.forEach((v, i) => {
        b += S.line(X(v), base, X(v), base + 5, 's-mut');
        b += S.text(X(v), base + 18, kk(v), 'xs mono', i === 0 ? 'start' : i === BR.length - 1 ? 'end' : 'middle');
      });
      const hx = X(bal);
      b += S.rect(x0, base + 36, Math.max(0, hx - x0), 6, 'f-acc', 3);
      b += S.rect(x0, base - 5 * stepH - 34, x1 - x0, 5 * stepH + 82, 'wbk-hit hit');
      b += S.line(hx, base - 5 * stepH - 12, hx, base + 2, 's-acc w15 dash2');
      const lab = kk(bal), lw = lab.length * 8 + 16, lx = SML.clamp(hx - lw / 2, x0, x1 - lw);
      b += S.rect(lx, base - 5 * stepH - 34, lw, 20, 'f-acc', 10) + S.text(lx + lw / 2, base - 5 * stepH - 20, lab, 'sm mono b onacc', 'middle');
      b += S.circle(hx, base + 39, 9, 'handle');
      b += S.text(hx > x1 - 70 ? hx - 14 : hx + 14, base + 43, 'drag', 'xs mut', hx > x1 - 70 ? 'end' : 'start');
      fig.innerHTML = S.wrap(W, H, `Chase tier staircase. Your balance of ${kk(bal)} reaches ${t.short}.`, b, 'drag');
      const cash = bal * cashPct / 100;
      const lost = cash * Math.max(0, alt - R.depositApy) / 100;
      const waived = t.k === 'total' ? bal >= 5000 : true;
      setTxt(id + '-t', t.short);
      setTxt(id + '-f', waived ? '$0' : '$' + t.fee + ' unless waived', waived ? 'up' : '');
      setTxt(id + '-cash', usd0(cash));
      setTxt(id + '-oc', lost > 0.5 ? F.minus + usd0(lost) : '$0', lost > 500 ? 'dn' : '');
      byId(id + '-cards').innerHTML = TIERS.map((tr) => {
        const on = bal >= tr.min && !tr.legacy, cur = tr === t;
        const lock = tr.legacy ? 'Closed to new accounts' : cur ? 'Your tier' : on ? 'Unlocked' : 'Locked: ' + kk(tr.min - bal) + ' to go';
        return `<div class="wbk-tier${on ? ' on' : ''}${cur ? ' cur' : ''}${tr.legacy ? ' leg' : ''}"><h4>${tr.short}<span>${tr.min ? kk(tr.min) + '+' : 'Start'}</span></h4>
          <p class="wbk-lock">${lock}</p>
          <p class="w">$${tr.fee}/month${tr.k === 'jpm' ? ' membership' : ''}, waived with ${tr.waive}.</p>
          <ul>${tr.perks.map((p) => `<li><i></i><span>${p}</span></li>`).join('')}</ul>${tr.note ? `<p class="nt">${tr.note}</p>` : ''}</div>`;
      }).join('');
      const next = OPEN.find((x) => x.min > bal);
      let line;
      if (lost >= 1000) line = `${usd0(cash)} sits in checking at ${R.depositApy}%. At ${F.pct(alt)} elsewhere it would earn about <b>${usd0(lost)} a year</b>. Investments held at J.P. Morgan count toward the balance, so keep a cash cushion at the bank and the rest invested.`;
      else if (next) line = `You are at <b>${t.short}</b>. ${kk(next.min - bal)} more in linked deposits or J.P. Morgan investments reaches ${next.short}.${bal >= 75000 && bal < 150000 ? ' The $75K Sapphire tier is closed to new customers, so Premier Plus is the tier you can open here.' : ' Only move money you would hold anyway.'}`;
      else line = `<b>${t.short}</b> with ${usd0(cash)} in cash. Fee-free ATMs worldwide and free wires cost you about ${usd0(lost)} a year in interest given up. A good trade if you use them.`;
      msg(id + '-msg', lost >= 1000 ? 'dn' : next ? 'acc' : 'up', lost >= 1000 ? 'Hidden cost' : t.tiny, line);
    });
  };

  /* =====================================================================
     2. perkValue: what Private Client perks are worth to you
     ===================================================================== */
  SML.widgets.perkValue = function (root) {
    const id = SML.uid('wbp');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">You are</span>${ui.seg(id + '-p', [{ v: 'home', label: 'Homebody' }, { v: 'trav', label: 'Frequent traveler' }, { v: 'buy', label: 'Buying a home' }], 'trav', 'Profile')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-atm', label: 'ATM withdrawals abroad / yr', min: 0, max: 40, step: 1, value: 10 })}
        ${ui.slider({ id: id + '-af', label: 'Fees you pay per foreign withdrawal now', min: 0, max: 15, step: 0.5, value: 8, fmt: 'usd' })}
        ${ui.slider({ id: id + '-cw', label: 'Cash per withdrawal', min: 0, max: 1000, step: 50, value: 200, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-fx', label: 'Debit card spending abroad / yr', min: 0, max: 30000, step: 500, value: 5000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-fxp', label: 'Foreign fee on debit and cash now', min: 0, max: 3, step: 0.5, value: R.ftf, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-w', label: 'Wires sent or received / yr', min: 0, max: 24, step: 1, value: 3 })}
        ${ui.slider({ id: id + '-wf', label: 'Fee per wire now', min: 0, max: 50, step: 1, value: 25, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-m', label: 'New mortgage', min: 0, max: 1500000, step: 25000, value: 0, fmt: (v) => kk(v) })}
        ${ui.slider({ id: id + '-md', label: 'Rate discount offered', min: 0, max: 0.75, step: 0.125, value: 0.125, fmt: (v) => F.num(v, 3) + '%' })}
        ${ui.slider({ id: id + '-c', label: 'Cash you keep at the bank', min: 0, max: 150000, step: 5000, value: 30000, fmt: (v) => kk(v) })}
        ${ui.slider({ id: id + '-y', label: 'That cash could earn elsewhere', min: 0, max: 6, step: 0.1, value: R.altYield, fmt: 'pct1' })}
      </div>
      <div class="wg-read wbk-r4">${ui.stat('Perks worth / yr', id + '-v', 'hl')}${ui.stat('Interest given up / yr', id + '-cost')}${ui.stat('Net for you', id + '-net')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Assumes you reach $150,000 in linked deposits and J.P. Morgan investments, so the $35 monthly fee is waived. Mortgage saving is the first year only (loan × discount). Chase’s mortgage relationship discount (0.125% at $150,000-$999,999 in balances, 0.25% at $1M+, plus possible new-money discounts) goes to any Chase customer with those balances, not only Private Client. Advisory accounts charge their own fees, not included here.</div>`;
    const fig = root.querySelector('.wg-fig');
    const presets = {
      home: { atm: 0, af: 8, cw: 200, fx: 0, fxp: R.ftf, w: 1, wf: 25, m: 0, md: 0.125, c: 40000 },
      trav: { atm: 10, af: 8, cw: 200, fx: 5000, fxp: R.ftf, w: 3, wf: 25, m: 0, md: 0.125, c: 30000 },
      buy: { atm: 2, af: 8, cw: 200, fx: 1000, fxp: R.ftf, w: 2, wf: 25, m: 600000, md: 0.125, c: 30000 },
    };
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-p')) { const p = presets[st.seg(id + '-p')]; Object.keys(p).forEach((k) => st.set(id + '-' + k, p[k])); }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const n = (k) => st.n(id + '-' + k);
      const items = [
        { l: 'ATM fees', s: 'ATM fees', v: n('atm') * n('af') },
        { l: 'Foreign fees (debit + cash)', s: 'FX fees', v: (n('fx') + n('atm') * n('cw')) * n('fxp') / 100 },
        { l: 'Wire fees', s: 'Wires', v: n('w') * n('wf') },
        { l: 'Mortgage discount, yr 1', s: 'Mortgage', v: n('m') * n('md') / 100 },
      ];
      const value = items.reduce((s, x) => s + x.v, 0);
      const cost = n('c') * Math.max(0, n('y') - R.depositApy) / 100;
      const net = value - cost;
      const compact = W < 520;
      const rows = items.concat([{ l: 'Interest given up', s: 'Interest lost', v: -cost, neg: true }, { l: 'Net per year', s: 'Net', v: net, tot: true }]);
      const rowH = compact ? 34 : 38, top = 14, H = top + rows.length * rowH + 8;
      const lw = compact ? 78 : 150;
      const lo = Math.min(0, net, value - cost), hi = Math.max(200, value);
      const a0 = lw + 12, a1 = W - (compact ? 58 : 76);
      const X = (v) => a0 + ((v - lo) / (hi - lo)) * (a1 - a0);
      const bh = compact ? 18 : 20;
      let b = S.line(X(0), top - 6, X(0), top + rows.length * rowH - 12, 's-mut');
      let run = 0;
      rows.forEach((r, i) => {
        const y = top + i * rowH;
        b += S.text(lw, y + bh / 2 + 4, compact ? r.s : r.l, 'sm ' + (r.tot ? 'ink b' : 'mut'), 'end');
        let from, to, cls;
        if (r.tot) { from = 0; to = net; cls = net >= 0 ? 'f-up' : 'f-dn'; }
        else if (r.neg) { from = run; to = run - cost; cls = 'f-dn'; run -= cost; }
        else { from = run; to = run + r.v; cls = 'f-up-t s-up'; run += r.v; }
        const xa = X(Math.min(from, to)), xb = X(Math.max(from, to));
        b += S.rect(xa, y, Math.max(xb - xa, (r.v || r.tot) ? 2 : 0), bh, cls, 3);
        const vt = r.tot ? sus0(net) : r.neg ? (cost ? F.minus + usd0(cost) : '$0') : (r.v ? '+' + usd0(r.v) : '$0');
        const vc = 'sm mono b ' + (r.tot ? (net >= 0 ? 'up' : 'dn') : r.neg ? 'dn' : 'ink');
        const tw = vt.length * 7.2;
        if (xb + 6 + tw <= W - 2) b += S.text(xb + 6, y + bh / 2 + 4, vt, vc);
        else if (xa - 6 - tw >= lw + 8) b += S.text(xa - 6, y + bh / 2 + 4, vt, vc, 'end');
        else b += S.text(xb - 6, y + bh / 2 + 4, vt, 'sm mono b on', 'end');
        if (!r.tot && i < rows.length - 2) { const xe = X(run); b += S.line(xe, y + bh, xe, y + rowH, 's-mut dash2'); }
      });
      fig.innerHTML = S.wrap(W, H, `Waterfall of perk value: ${usd0(value)} in perks minus ${usd0(cost)} interest given up equals ${sus0(net)} a year.`, b);
      setTxt(id + '-v', '+' + usd0(value), 'up');
      setTxt(id + '-cost', cost ? F.minus + usd0(cost) : '$0', cost > 0 ? 'dn' : '');
      setTxt(id + '-net', sus0(net), net >= 0 ? 'up' : 'dn');
      const big = items.slice().sort((p, q) => q.v - p.v)[0];
      if (net >= 0) msg(id + '-msg', 'up', 'Worth it', `The perks are worth about <b>${usd0(value)} a year</b> to you, mostly from ${big.l.toLowerCase()}, against ${usd0(cost)} of interest given up on bank cash. Keep the rest of the $150,000 invested so it still counts.`);
      else msg(id + '-msg', 'dn', 'Not for you', `You would give up about <b>${usd0(cost)} a year</b> in interest to save ${usd0(value)} in fees. Keep less cash at the bank (investments count toward the balance) or skip the tier.`);
    });
  };

  /* =====================================================================
     3. fxFees ★: what card and ATM fees cost on a trip
     ===================================================================== */
  SML.widgets.fxFees = function (root) {
    const id = SML.uid('wbf');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Trip</span>${ui.seg(id + '-p', [{ v: 'wk', label: 'Long weekend' }, { v: 'two', label: 'Two weeks' }, { v: 'mo', label: 'A month abroad' }], 'two', 'Trip preset')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-s', label: 'Card spending abroad', min: 0, max: 15000, step: 100, value: 3500, fmt: 'usd0' })}
        <div class="ctl"><span class="ctl-top"><span class="ctl-lab">Card's foreign transaction fee</span></span>${ui.seg(id + '-ftf', [{ v: 0, label: '0%' }, { v: 1, label: '1%' }, { v: 3, label: '3%' }], R.ftf, 'Card foreign fee')}</div>
        ${ui.slider({ id: id + '-d', label: 'Card payments taken “in dollars”', min: 0, max: 100, step: 5, value: 30, fmt: 'pct' })}
        ${ui.slider({ id: id + '-dm', label: 'Markup when you pay in dollars', min: 0, max: 10, step: 0.5, value: R.dcc, fmt: 'pct1' })}
        ${ui.slider({ id: id + '-c', label: 'Cash from ATMs', min: 0, max: 5000, step: 50, value: 800, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-n', label: 'Number of withdrawals', min: 0, max: 20, step: 1, value: 6 })}
        ${ui.slider({ id: id + '-bf', label: 'Your bank’s fee per withdrawal', min: 0, max: 10, step: 0.5, value: 5, fmt: 'usd' })}
        ${ui.slider({ id: id + '-of', label: 'ATM owner’s fee per withdrawal', min: 0, max: 10, step: 0.5, value: 4, fmt: 'usd' })}
        <div class="ctl"><span class="ctl-top"><span class="ctl-lab">Your bank's foreign fee on cash</span></span>${ui.seg(id + '-bfx', [{ v: 0, label: '0%' }, { v: 1, label: '1%' }, { v: 3, label: '3%' }], R.ftf, 'Bank foreign fee')}</div>
      </div>
      <div class="wg-read wbk-r4">${ui.stat('Fees this trip', id + '-tot', 'hl')}${ui.stat('Share of the trip', id + '-pc')}${ui.stat('Smart setup', id + '-smart')}${ui.stat('You keep', id + '-save')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wbk-legend">${[['--down', 'Card foreign fee'], ['--violet', 'Paying in dollars'], ['--accent', 'Your bank’s ATM fees'], ['--info', 'ATM owner fees'], ['--muted', 'Foreign fee on cash']].map(([c, l]) => `<span>${sw(c)}${l}</span>`).join('')}</div>
      <div class="wg-note">Smart setup: a card with no foreign transaction fee, always paying in the local currency, fewer and larger withdrawals (3 instead of ${'${n}'}), and a debit card with no bank ATM fee or foreign fee. ATM owners may still charge unless your bank refunds them. Many cards charge their foreign fee even when you agree to pay in dollars.</div>`;
    root.querySelector('.wg-note').innerHTML = root.querySelector('.wg-note').innerHTML.replace('3 instead of ${n}', 'at most 3');
    const fig = root.querySelector('.wg-fig');
    const presets = { wk: [1200, 300, 2], two: [3500, 800, 6], mo: [6000, 1500, 10] };
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-p')) { const p = presets[st.seg(id + '-p')]; st.set(id + '-s', p[0]); st.set(id + '-c', p[1]); st.set(id + '-n', p[2]); }
      draw();
    });
    const calc = (o) => {
      const card = o.s * o.ftf / 100, dcc = o.s * (o.d / 100) * (o.dm / 100);
      const bankAtm = o.n * o.bf, owner = o.n * o.of, cashFx = o.c * o.bfx / 100;
      return { parts: [card, dcc, bankAtm, owner, cashFx], tot: card + dcc + bankAtm + owner + cashFx };
    };
    const draw = ui.responsive(fig, (W) => {
      const o = { s: st.n(id + '-s'), ftf: Number(st.seg(id + '-ftf')), d: st.n(id + '-d'), dm: st.n(id + '-dm'), c: st.n(id + '-c'), n: st.n(id + '-n'), bf: st.n(id + '-bf'), of: st.n(id + '-of'), bfx: Number(st.seg(id + '-bfx')) };
      if (o.c > 0 && o.n === 0) o.n = 1;
      const you = calc(o);
      const smartN = o.c > 0 ? Math.min(Math.max(o.n, 1), 3) : 0;
      const smart = calc({ s: o.s, ftf: 0, d: 0, dm: o.dm, c: o.c, n: smartN, bf: 0, of: o.of, bfx: 0 });
      const refund = calc({ s: o.s, ftf: 0, d: 0, dm: o.dm, c: o.c, n: smartN, bf: 0, of: 0, bfx: 0 });
      const compact = W < 520;
      const lw = compact ? 78 : 130, top = 18, bh = compact ? 30 : 36, gap = compact ? 26 : 30;
      const rows = [{ l: 'Your setup', s: 'You now', r: you }, { l: 'Smart setup', s: 'Smart', r: smart }, { l: 'With ATM refunds', s: 'Refunds', r: refund }];
      const H = top + rows.length * (bh + gap) + 6;
      const mx = Math.max(50, you.tot, smart.tot);
      const a0 = lw + 10, a1 = W - 14 - usd0(mx).length * 8.2;
      const cls = ['f-dn', 'f-vio', 'f-acc', 'f-info', 'f-mut'];
      let b = '';
      rows.forEach((row, i) => {
        const y = top + i * (bh + gap);
        b += S.text(lw, y + bh / 2 + 4, compact ? row.s : row.l, 'md ' + (i ? 'ink' : 'ink b'), 'end');
        b += S.rect(a0, y, a1 - a0, bh, 'f-shade', 4);
        let x = a0;
        row.r.parts.forEach((p, j) => { const w = (p / mx) * (a1 - a0); if (w > 0.4) { b += S.rect(x, y, w, bh, cls[j], 0); x += w; } });
        b += S.text(x + 6, y + bh / 2 + 5, usd0(row.r.tot), 'md mono b ' + (i === 0 ? 'dn' : 'up'));
      });
      fig.innerHTML = S.wrap(W, H, `Trip fees: ${usd0(you.tot)} with your setup, ${usd0(smart.tot)} with a smart setup, ${usd0(refund.tot)} with ATM refunds.`, b);
      const spent = o.s + o.c;
      setTxt(id + '-tot', usd0(you.tot), you.tot > 0 ? 'dn' : 'up');
      setTxt(id + '-pc', spent ? F.pct(you.tot / spent * 100) : '0%');
      setTxt(id + '-smart', usd0(smart.tot), 'up');
      setTxt(id + '-save', usd0(you.tot - smart.tot), 'up');
      const names = ['card foreign fees', 'paying in dollars', 'your bank’s ATM fees', 'ATM owner fees', 'foreign fees on cash'];
      const bi = you.parts.indexOf(Math.max(...you.parts));
      if (you.tot < 1) msg(id + '-msg', 'up', 'Clean', 'No fees on this trip. That is what a no-foreign-fee card, a fee-free debit card and saying “local currency” gets you.');
      else msg(id + '-msg', you.tot > 100 ? 'dn' : 'acc', usd0(you.tot), `Fees eat ${F.pct(you.tot / Math.max(1, spent) * 100)} of this trip. The biggest leak is <b>${names[bi]}</b> (${usd0(you.parts[bi])}). The smart setup cuts the total to ${usd0(smart.tot)}.`);
    });
  };

  /* =====================================================================
     4. rewardsCalc: points vs annual fee vs interest
     ===================================================================== */
  SML.widgets.rewardsCalc = function (root) {
    const id = SML.uid('wbr');
    const CATS = [
      { k: 'din', l: 'Dining', v: 400, flat: 2, trav: 3 },
      { k: 'gro', l: 'Groceries', v: 600, flat: 2, trav: 1 },
      { k: 'tra', l: 'Travel', v: 250, flat: 2, trav: 2 },
      { k: 'gas', l: 'Gas', v: 150, flat: 2, trav: 3 },
      { k: 'oth', l: 'Everything else', v: 1500, flat: 2, trav: 1 },
    ];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">How you pay</span>${ui.seg(id + '-bal', [{ v: 'full', label: 'In full every month' }, { v: 'carry', label: 'Carry a balance' }], 'full', 'Payment habit')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${CATS.map((c) => ui.slider({ id: id + '-' + c.k, label: c.l + ' / month', min: 0, max: c.k === 'oth' ? 5000 : 2000, step: 25, value: c.v, fmt: 'usd0' })).join('')}
        ${ui.slider({ id: id + '-fee', label: 'Travel card annual fee', min: 0, max: 800, step: 5, value: 95, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-pv', label: 'Value of one travel point', min: 0.5, max: 2, step: 0.05, value: 1, fmt: (v) => F.num(v, 2) + '¢' })}
        ${ui.slider({ id: id + '-ab', label: 'Average balance carried', min: 0, max: 10000, step: 100, value: 2500, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-apr', label: 'Card APR', min: 10, max: 32, step: 0.5, value: R.cardApr, fmt: 'pct1' })}
      </div>
      <div class="wg-read wbk-r4">${ui.stat('Flat 2% card, net / yr', id + '-a', 'hl')}${ui.stat('Travel card, net / yr', id + '-b')}${ui.stat('Interest / yr', id + '-i')}${ui.stat('Better for you', id + '-w')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Example cards: a $0-fee card paying a flat 2% on everything, and a travel card earning 3 points per dollar on dining and gas, 2 on travel and 1 on everything else. One point is worth 1¢ as cash back and can be worth more when moved to airline or hotel partners. Sign-up bonuses are left out.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const carry = st.seg(id + '-bal') === 'carry';
      root.querySelectorAll('#' + id + '-ab,#' + id + '-apr').forEach((el) => { el.closest('.ctl').style.opacity = carry ? '1' : '.45'; });
      const spend = CATS.map((c) => st.n(id + '-' + c.k) * 12);
      const flatR = spend.reduce((s, v) => s + v * 0.02, 0);
      const pts = CATS.reduce((s, c, i) => s + spend[i] * c.trav, 0);
      const travR = pts * st.n(id + '-pv') / 100;
      const fee = st.n(id + '-fee');
      const interest = carry ? st.n(id + '-ab') * st.n(id + '-apr') / 100 : 0;
      const A = { l: 'Flat 2% card', s: 'Flat 2%', rew: flatR, fee: 0, int: interest }, B = { l: 'Travel card', s: 'Travel', rew: travR, fee, int: interest };
      [A, B].forEach((x) => { x.net = x.rew - x.fee - x.int; });
      const compact = W < 520;
      const lw = compact ? 54 : 104, top = 26, bh = compact ? 22 : 24, gap = compact ? 44 : 46;
      const H = top + 2 * (bh * 2 + gap) + 4;
      const maxRew = Math.max(100, A.rew, B.rew), maxCost = Math.max(A.fee + A.int, B.fee + B.int);
      const labR = '+' + usd0(maxRew);
      const a0 = lw + 14, a1 = W - 12 - labR.length * 7.4;
      const room = maxCost > 0 ? 58 : 34;
      const pxPer = (a1 - a0 - room) / (maxRew + maxCost);
      const mid = a0 + room + maxCost * pxPer;
      const sc = (v) => v * pxPer;
      let b = S.line(mid, 8, mid, H - 6, 's-mut');
      b += S.text(mid - 6, 16, compact ? 'costs' : '← fee + interest', 'xs mut', 'end') + S.text(mid + 6, 16, compact ? 'rewards' : 'rewards earned →', 'xs mut');
      [A, B].forEach((x, i) => {
        const y = top + i * (bh * 2 + gap);
        b += S.text(lw, y + bh + 4, compact ? x.s : x.l, 'md ink b', 'end');
        b += S.rect(mid, y, Math.max(2, sc(x.rew)), bh, 'f-up', 3) + S.text(mid + sc(x.rew) + 6, y + bh / 2 + 4, '+' + usd0(x.rew), 'sm mono b up');
        let cx = mid;
        if (x.fee > 0) { b += S.rect(cx - sc(x.fee), y + bh + 4, sc(x.fee), bh - 6, 'f-acc', 2); cx -= sc(x.fee); }
        if (x.int > 0) { b += S.rect(cx - sc(x.int), y + bh + 4, sc(x.int), bh - 6, 'f-dn', 2); cx -= sc(x.int); }
        const cost = x.fee + x.int;
        if (cost > 0) b += S.text(cx - 6, y + bh + 4 + (bh - 6) / 2 + 4, F.minus + usd0(cost), 'sm mono b dn', 'end');
        b += S.text(mid + 6, y + bh * 2 + 20, 'Net ' + sus0(x.net), 'sm mono b ' + (x.net >= 0 ? 'ink' : 'dn'));
      });
      fig.innerHTML = S.wrap(W, H, `Rewards versus costs: flat card nets ${sus0(A.net)}, travel card nets ${sus0(B.net)} a year.`, b);
      setTxt(id + '-a', sus0(A.net), A.net >= 0 ? 'up' : 'dn');
      setTxt(id + '-b', sus0(B.net), B.net >= 0 ? 'up' : 'dn');
      setTxt(id + '-i', interest ? F.minus + usd0(interest) : '$0', interest ? 'dn' : 'up');
      const win = A.net >= B.net ? A : B;
      setTxt(id + '-w', win.s);
      if (carry && interest > Math.max(A.rew, B.rew)) msg(id + '-msg', 'dn', 'Interest wins', `Carrying ${usd0(st.n(id + '-ab'))} at ${F.pct(st.n(id + '-apr'))} costs <b>${usd0(interest)} a year</b>, more than any rewards. Pay the balance off first; rewards only work when you pay in full.`);
      else if (carry) msg(id + '-msg', 'dn', 'Leak', `Interest of ${usd0(interest)} a year eats most of your rewards. Paying in full every month is worth more than any card choice.`);
      else msg(id + '-msg', 'up', win.s, `Paying in full, the <b>${win.l.toLowerCase()}</b> leaves you ${usd0(Math.abs(A.net - B.net))} a year ahead. ${B.net > A.net ? 'The fee pays for itself only because you value points at ' + F.num(st.n(id + '-pv'), 2) + '¢ and spend in its bonus categories.' : 'The travel card’s fee is not covered by its extra points at this spending.'}`);
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    cpc: { t: 'Chase: Private Client Checking, fee waiver, what counts and benefits', u: 'https://account.chase.com/consumer/banking/chase-private-client-checking-account' },
    cpcBro: { t: 'Chase: Private Client benefits brochure (PDF)', u: 'https://www.chase.com/content/dam/chase-ux/documents/personal/checking/cpc-brochure.pdf' },
    total: { t: 'Chase: Total Checking fees (ATM, wires, overdraft)', u: 'https://www.chase.com/personal/fees/total-checking' },
    premier: { t: 'Chase: Premier Plus Checking fees', u: 'https://www.chase.com/personal/fees/premier-plus-checking' },
    sapphire: { t: 'Chase: Sapphire Checking fees (no longer available for new accounts)', u: 'https://www.chase.com/personal/fees/sapphire-checking' },
    jpm: { t: 'Chase: J.P. Morgan Private Client', u: 'https://www.chase.com/personal/investments/private-client' },
    mort: { t: 'Chase: mortgage relationship pricing offers', u: 'https://www.chase.com/personal/mortgage/relationshipoffers' },
    vmfxx: { t: 'Vanguard Federal Money Market (VMFXX) yield, Oct 19 2026 (yieldfinder)', u: 'https://yieldfinder.app/funds/vmfxx/' },
    csp: { t: 'Chase: Sapphire Preferred card, annual fee and foreign transaction fees', u: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred' },
    nwFtf: { t: 'NerdWallet: best no-foreign-transaction-fee cards (Oct 2026)', u: 'https://www.nerdwallet.com/best/credit-cards/no-foreign-transaction-fee' },
    g19: { t: 'Federal Reserve G.19: credit card interest rates (Aug 2026)', u: 'https://www.federalreserve.gov/releases/g19/current/default.htm' },
    fico: { t: 'myFICO: credit checks and inquiries', u: 'https://www.myfico.com/credit-education/credit-reports/credit-checks-and-inquiries' },
  };

  SML.lessons.push({
    id: 'l-bank-tiers', course: 'banking', order: 1, title: 'Why a banking relationship pays', mins: 9, level: 'Beginner',
    summary: 'Bank tiers: what $15K, $150K and $1M unlock, and the hidden cost of idle cash.',
    idea: 'Keep enough with one bank group and fees disappear while perks appear. Investments count too, so the money does not have to sit idle.',
    widget: 'tierLadder',
    try: 'Drag the balance up the staircase, then raise the share kept as cash and watch the interest you give up.',
    body: [
      '<p><b>Relationship banking</b> means keeping enough money with one bank group that it waives fees and adds perks. Chase is a clear example, and most big banks run a similar tier program.</p>',
      '<h3>Chase’s tiers in 2026</h3><ul><li><b>Total Checking</b>: $15 a month, waived with $500 or more in monthly direct deposits, a $1,500 daily balance, or a $5,000 average balance across linked accounts. Abroad, Chase charges $5 per withdrawal at non-Chase ATMs, plus the ATM owner’s fee.</li><li><b>Premier Plus Checking</b>: $25 a month, waived at a $15,000 average balance across linked deposits and investments. No Chase fee at any ATM worldwide (the owner may still charge) and no foreign exchange fee on debit card use. Wires still cost money.</li><li><b>Chase Private Client</b>: $35 a month, waived at a $150,000 average balance. No ATM fees worldwide, including refunds of the owner’s fee, no foreign exchange fee, free wires, a dedicated banker and a J.P. Morgan advisor. The <a href="#l-private-client">next lesson</a> lists every perk.</li><li><b>J.P. Morgan Private Client</b>: for people bringing $1,000,000 or more. A $150 monthly membership fee, free in the first year or with $1M+ in qualifying balances, a senior banker and concierge team, and a luxury travel advisor.</li></ul>',
      '<h3>What happened to Sapphire Banking at $75,000?</h3><p>Chase Sapphire Checking used to be the middle step: $25 a month, waived at a $75,000 balance, with ATM fee refunds worldwide, no foreign exchange fee and free wires. In 2026 Chase stopped opening new Sapphire Checking accounts. People who already have it keep it. For a new customer the ladder now goes from Premier Plus at $15,000 straight to Private Client at $150,000.</p>',
      '<h3>What counts toward the balance</h3><p>Chase uses your <b>average beginning-day balance</b> across linked accounts: up to ten checking accounts, savings, CDs, certain retirement CDs and money market accounts, plus qualifying investments held with J.P. Morgan. 529 plans, donor-advised funds and certain retirement plan accounts do not count. Confirm before you move money.</p>',
      '<h3>The hidden cost: idle cash</h3><p>Chase Private Client checking pays 0.01% a year. In October 2026 a money market fund such as Vanguard’s VMFXX paid about 3.8%, and top high-yield savings accounts about 4%-4.3%. Keep $150,000 in checking and you give up roughly $5,700 a year in interest, far more than the perks are worth. The fix: keep a cash cushion at the bank and hold the rest as investments at J.P. Morgan, where it still counts and keeps growing.</p>',
      '<h3>Who gains, and who does not</h3><ul><li>Gains: people who travel abroad and take cash out, send wires, or will borrow for a home soon.</li><li>Gains: people with investments to move who like having everything in one place.</li><li>Does not gain: someone who would leave large sums in checking just to qualify.</li></ul><p>Deposits carry <b>FDIC insurance</b> up to $250,000 per depositor, per bank, per ownership category. Investments are not FDIC-insured; brokerage accounts have SIPC protection if the firm fails, not against market losses. See <a href="#l-emergency">where to park cash</a>.</p>',
    ],
    example: {
      title: 'Same $160,000, two ways',
      intro: 'Maya brings $160,000 to Chase. A money market fund pays about 3.8% in October 2026.',
      steps: [
        'Way one: all $160,000 goes into checking. It qualifies for Private Client, but at 0.01% it earns about $16 a year.',
        'At 3.8% the same cash would earn about $6,080 a year (160,000 × 0.038). Parking it gives up about $6,064 a year.',
        'Way two: she keeps $20,000 in checking as her cushion and invests $140,000 at J.P. Morgan. Her average linked balance is still $160,000, so she qualifies.',
        'Her idle cash now costs about $20,000 × (3.8% − 0.01%) ≈ $758 a year in interest given up.',
        'At Total Checking, 10 cash withdrawals of $200 abroad would cost about $8 each ($5 Chase fee plus the owner’s fee) plus a 3% foreign exchange fee on the $2,000: $80 + $60. With 3 wires at $25, she saves about $215 a year.',
      ],
      result: 'Way two keeps her money working and still unlocks the perks. Way one costs over $6,000 a year to save $215.',
    },
    mistakes: [
      'Parking a large sum in 0.01% checking just to reach a tier, and losing thousands of dollars of interest a year.',
      'Planning around Sapphire Banking at $75,000. It is closed to new accounts.',
      'Assuming every account counts. 529 plans, donor-advised funds and some retirement plan accounts do not.',
      'Forgetting that investments move. A market drop that pushes your total under $150,000 can bring the monthly fee back.',
    ],
    points: [
      'For new customers, Chase’s tiers are Total Checking, Premier Plus ($15,000), Private Client ($150,000) and J.P. Morgan Private Client ($1M+).',
      'Sapphire Checking ($75,000) is closed to new accounts; existing holders keep it.',
      'Qualifying J.P. Morgan investments count toward the balance, so most of the money can stay invested.',
      'Checking pays 0.01%. Idle cash is the hidden price of the perks.',
    ],
    terms: ['Relationship banking', 'Private client', 'FDIC insurance', 'Opportunity cost', 'Money market fund'],
    glossary: [{ t: 'Average beginning-day balance', d: 'The average of your balances at the start of each day in the statement period. Chase uses it to decide fee waivers.' }],
    quiz: { q: 'You want Private Client perks without losing interest. What is the better move?', options: ['Keep all $150,000 in checking', 'Keep a cash cushion in checking and hold the rest as qualifying J.P. Morgan investments', 'Open Sapphire Checking at $75,000 instead'], answer: 1, why: 'Qualifying investments count toward the balance, so most of the money can keep earning. Sapphire Checking is closed to new accounts.' },
    sources: [SRC.total, SRC.premier, SRC.sapphire, SRC.cpc],
  });

  SML.lessons.push({
    id: 'l-private-client', course: 'banking', order: 2, title: 'Private client perks and their real cost', mins: 8, level: 'Beginner',
    summary: 'Every Chase Private Client perk, and how to tell if it is worth it for you.',
    idea: 'Private Client waives almost every bank fee at home and abroad. Its real price is the interest your cash could have earned.',
    widget: 'perkValue',
    try: 'Pick a profile, then set your own travel, wires, mortgage and how much cash you would keep at the bank.',
    body: [
      '<p><b>Chase Private Client</b> is Chase’s main premium banking tier; J.P. Morgan Private Client sits above it for people bringing $1M or more. The checking account costs $35 a month unless your linked deposits and qualifying J.P. Morgan investments average $150,000 or more, or you link another qualifying checking account.</p>',
      '<h3>The perks Chase lists in 2026</h3><ul><li><b>ATMs</b>: no ATM fees worldwide. Chase charges nothing at non-Chase ATMs and refunds the fee the owner charges. If a refund does not post, call Chase; some owners do not flag their fee.</li><li><b>Foreign exchange</b>: no foreign exchange rate adjustment fee on ATM withdrawals or debit card purchases in another currency. The exchange rate itself is not refunded.</li><li><b>Wires</b>: no Chase fee on incoming or outgoing wires. The other bank may still deduct its own fee.</li><li><b>Checks and overdrafts</b>: no fees on cashier’s checks, counter checks or money orders, and no overdraft fee on up to four days a year.</li><li><b>People</b>: a dedicated banker, a J.P. Morgan Private Client Advisor and 24/7 service, plus member events.</li><li><b>Limits and linked accounts</b>: higher ATM, Zelle and mobile deposit limits (ask Chase for the exact numbers), and no monthly fees on linked checking and savings.</li><li><b>Investing</b>: some J.P. Morgan Self-Directed fees, such as wires and stop payments, are waived.</li><li><b>Loans</b>: relationship pricing on home and auto loans. Chase’s mortgage discount (0.125% at $150,000 to $999,999 in balances, 0.25% at $1M+) is open to any Chase customer with those balances.</li></ul><p>No airport lounges or travel credits come with the bank account; those belong to credit cards.</p>',
      '<h3>Traveling with Private Client</h3><p>Two perks matter most abroad: every ATM fee is waived or refunded, and there is no foreign exchange fee on cash or debit purchases. You can take local cash anywhere without paying the usual $5 to $10 a withdrawal. Pair it with a credit card that has no foreign transaction fee (see <a href="#l-travel-money">travel money</a>).</p>',
      '<h3>The real cost</h3><ul><li><b>Interest given up</b> on whatever cash you keep at 0.01% instead of about 3.8%-4.3% elsewhere. Usually the biggest cost.</li><li><b>Advisory fees</b> if a J.P. Morgan advisor manages your money. Ask for every fee in writing and compare with low-cost index funds (see <a href="#l-index-funds">index funds</a>).</li><li><b>Product pressure</b>: a dedicated banker also sells. Annuities, managed accounts and insurance can carry high fees.</li></ul>',
      '<h3>New-money bonus</h3><p>Chase sometimes pays a cash bonus for bringing new money. The offer running in October 2026 paid $1,000 to $3,000 depending on the amount, with a 90-day holding period. It is taxable as interest. Treat it as a one-time sweetener, never the reason to move money you would rather keep elsewhere.</p>',
      '<p>A fee-only fiduciary adviser can give a second opinion on any managed account or annuity you are offered.</p>',
    ],
    example: {
      title: 'Is Private Client worth it for Leo?',
      intro: 'Leo has $180,000: $30,000 in cash and $150,000 in index funds he can move to J.P. Morgan.',
      steps: [
        'He takes 10 ATM withdrawals of $200 abroad a year. At about $8 in fees each plus a 3% foreign exchange fee on the $2,000, that is $80 + $60 = $140 saved.',
        'He spends $5,000 abroad on his debit card. A 3% foreign fee would cost $150; Private Client charges none.',
        'He sends 3 wires a year at $25: $75 saved. Perks are worth $140 + $150 + $75 = $365 a year.',
        'His $30,000 of cash earns 0.01% instead of about 3.8%: roughly $30,000 × 3.79% ≈ $1,137 of interest given up.',
        'If he keeps only $5,000 in cash and invests the rest at J.P. Morgan, the interest given up drops to about $190.',
      ],
      result: 'With $30,000 idle: about −$772 a year. With $5,000 idle: about +$175 a year.',
    },
    mistakes: [
      'Judging the tier by its perk list instead of what you actually use in a year.',
      'Keeping big cash balances at 0.01% to stay qualified when investments count just as well.',
      'Saying yes to managed accounts or annuities without asking for every fee in writing.',
      'Thinking the mortgage discount is a Private Client perk. Any Chase customer with the same balances gets it.',
    ],
    points: [
      'Private Client waives ATM fees worldwide (with refunds), foreign exchange fees on debit and cash, and wire fees.',
      'The $35 monthly fee is waived at a $150,000 average balance, investments included.',
      'Its real cost is the interest your bank cash could have earned, plus any advisory fees you accept.',
      'Worth it for travelers and frequent wire senders who keep the cash part small.',
    ],
    terms: ['Private client', 'Relationship banking', 'Foreign transaction fee', 'Opportunity cost', 'Mortgage points'],
    glossary: [{ t: 'Relationship pricing', d: 'A loan rate discount a bank gives you because of the deposits and investments you hold with it.' }, { t: 'Wire transfer', d: 'A fast bank-to-bank money transfer, often used for home closings and moving money abroad.' }],
    quiz: { q: 'What is usually the biggest cost of Private Client?', options: ['The $35 monthly fee', 'Interest given up on cash kept in 0.01% checking', 'ATM fees abroad'], answer: 1, why: 'The fee is waived once you qualify; the interest your idle cash could earn elsewhere is what adds up.' },
    sources: [SRC.cpc, SRC.cpcBro, SRC.mort, SRC.jpm],
  });

  SML.lessons.push({
    id: 'l-travel-money', course: 'banking', order: 3, title: 'Travel money with no foreign fees', mins: 7, level: 'Beginner',
    summary: 'Cards, ATMs and the “pay in dollars?” question: keep fees off your trip.',
    idea: 'Travel fees hide in three places: the card, the ATM and the exchange rate. A two-card setup and one word, “local”, removes almost all of them.',
    widget: 'fxFees',
    try: 'Pick a trip, then set the card fee to 0% and the “in dollars” share to zero and watch the bar shrink.',
    body: [
      '<h3>Fee one: the card’s foreign transaction fee</h3><p>Many credit cards add a <b>foreign transaction fee</b>, typically about 3%, to every purchase made in another currency or with a merchant abroad. On a $3,500 trip that is $105. Plenty of cards charge none: the Chase Sapphire Preferred ($95 a year) and Sapphire Reserve, every US Capital One card, and several others. Check the card’s terms before you go.</p>',
      '<h3>Fee two: “Would you like to pay in dollars?”</h3><p>Shops, restaurants and ATMs abroad often offer to charge you in US dollars. This is <b>dynamic currency conversion</b>. Its exchange rate is usually considerably worse, and your card may still add its foreign fee. Always choose the <b>local currency</b> and let your card network convert it.</p>',
      '<h3>Fee three: ATMs</h3><ul><li>Your bank may charge for using a non-network ATM abroad. Chase Total Checking charges $5 per withdrawal outside the US.</li><li>Your bank may add a foreign exchange fee on the amount, often 3%.</li><li>The ATM owner may add its own surcharge.</li><li>The ATM may offer its own conversion. Decline it.</li></ul><p>Chase Premier Plus has no Chase ATM fee worldwide and no foreign exchange fee on its debit card; Private Client also refunds the owner’s fee (see <a href="#l-bank-tiers">bank tiers</a>). Other banks and brokerages offer similar cards. Take fewer, larger withdrawals, and skip airport currency counters.</p>',
      '<h3>A simple setup</h3><ul><li>A credit card with no foreign transaction fee for purchases.</li><li>A debit card with low or no ATM and foreign fees, for cash.</li><li>A backup card kept in a different place, in case one is lost or blocked.</li><li>Pay the card in full when you get home (see <a href="#l-card-debt">card debt</a>).</li></ul>',
    ],
    example: {
      title: 'Two weeks in Lisbon',
      intro: 'Sam spends $3,500 by card and takes $800 in cash over 6 withdrawals.',
      steps: [
        'His card charges 3% on foreign purchases: $3,500 × 0.03 = $105.',
        'He says “dollars” for about $1,050 of payments, and the worse rate costs about 5% in this example: about $53 more.',
        'His bank charges $5 per foreign withdrawal and the ATM owner $4: 6 × $9 = $54.',
        'His bank adds 3% on the $800 of cash: $24. Total fees: $105 + $53 + $54 + $24 = $236.',
        'Next trip he uses a no-foreign-fee card, always picks euros, and takes 3 withdrawals with a fee-free debit card: only the owner’s fee is left, 3 × $4 = $12.',
      ],
      result: 'Same trip: $236 in fees versus $12.',
    },
    mistakes: [
      'Choosing “pay in dollars” because it feels familiar. The exchange rate is usually considerably worse.',
      'Packing only a card that charges 3% on every foreign purchase.',
      'Taking many small ATM withdrawals and paying the fixed fees every time.',
      'Traveling with one card. If it is lost or frozen, you have no money.',
    ],
    points: [
      'Use a credit card with no foreign transaction fee for purchases.',
      'Always pay in the local currency. Decline dynamic currency conversion at shops and ATMs.',
      'Use a debit card with no foreign ATM or exchange fees, and take fewer, larger withdrawals.',
      'Chase Premier Plus waives Chase ATM fees worldwide; Private Client also refunds the owner’s fee.',
    ],
    terms: ['Foreign transaction fee', 'Dynamic currency conversion', 'Private client', 'Annual fee'],
    quiz: { q: 'A café abroad asks: pay in euros or in dollars?', options: ['Dollars, so I know the exact price', 'Euros, the local currency', 'It makes no difference'], answer: 1, why: 'Paying in dollars triggers dynamic currency conversion, whose rate is usually worse. Your card network converts euros at a better rate.' },
    sources: [SRC.nwFtf, SRC.csp, SRC.total, SRC.premier],
  });

  SML.lessons.push({
    id: 'l-rewards', course: 'banking', order: 4, title: 'Rewards cards without the trap', mins: 7, level: 'Beginner',
    summary: 'Points vs annual fees vs interest: when a rewards card actually pays.',
    idea: 'Rewards are a small rebate on spending you would do anyway. A year of carried interest wipes out a year of points.',
    widget: 'rewardsCalc',
    try: 'Set your monthly spending, then switch to “Carry a balance” and watch interest swallow the rewards.',
    body: [
      '<h3>How rewards work</h3><p>Cards earn cash back or points on each dollar you spend. A flat card might pay 2% on everything. A travel card pays more in bonus categories: the Chase Sapphire Preferred, for example, earns 3 points per dollar on dining and gas, 2 on most travel and 1 on everything else, for a $95 <b>annual fee</b>. A point is often worth 1¢ as cash and can be worth more when moved to airline or hotel partners.</p>',
      '<h3>Does the fee pay for itself?</h3><p>Compare the extra rewards with a no-fee flat card, then subtract the fee. A fee card wins only if you spend a lot in its bonus categories and use the points well. Perks such as travel credits count only if you would have spent that money anyway.</p>',
      '<h3>The trap: interest</h3><p>In August 2026 the average APR on card accounts paying interest was about 22.4% (Federal Reserve). Carry a $2,500 balance for a year at that rate and you pay about $560, more than most people earn in rewards. Rewards only make sense if you pay the full statement balance every month. If you carry debt, pay it off first (see <a href="#l-card-debt">card debt</a> and <a href="#l-balance-transfer">0% transfers</a>).</p>',
      '<h3>Sign-up bonuses and your credit score</h3><p>Bonuses can be worth hundreds of dollars but require spending a set amount in the first few months. Never spend extra just to hit the target. Each application is a <b>hard inquiry</b>, usually costing a few points for about a year, and new cards lower the average age of your accounts. Keep <b>credit utilization</b> low, ideally under 10% (see <a href="#l-credit-score">credit scores</a>).</p>',
      '<h3>Travel features worth having</h3><ul><li>No foreign transaction fee (see <a href="#l-travel-money">travel money</a>).</li><li>Travel protections you understand, such as trip delay or rental car coverage.</li><li>A card on a widely accepted network for use abroad.</li></ul>',
    ],
    example: {
      title: 'Flat card or travel card?',
      intro: 'Ana spends $400 on dining, $600 on groceries, $250 on travel, $150 on gas and $1,500 on everything else each month: $34,800 a year.',
      steps: [
        'A flat 2% card earns $34,800 × 0.02 = $696 a year, with no fee.',
        'The travel card earns 3 points on dining and gas ($6,600 × 3 = 19,800), 2 on travel ($3,000 × 2 = 6,000) and 1 on the rest ($25,200): 51,000 points.',
        'At 1¢ a point that is $510, minus the $95 fee: $415. The flat card wins by $281.',
        'If she moves points to travel partners at 1.5¢, they are worth $765, minus $95: $670. Still $26 behind the flat card.',
        'If she carried a $2,500 balance at 22.4% all year, about $560 of interest would wipe out most of either card’s rewards.',
      ],
      result: 'For Ana, a simple 2% card paid in full beats the fee card.',
    },
    mistakes: [
      'Carrying a balance on a rewards card. Interest above 20% cancels the rewards many times over.',
      'Spending more to chase points or a sign-up bonus.',
      'Paying an annual fee for credits and perks you would not have used anyway.',
      'Valuing points at their best possible rate when you actually redeem them for cash.',
    ],
    points: [
      'Rewards are a rebate of roughly 1%-3% of spending. Card interest averages over 20% a year.',
      'Pay the full statement balance every month, or skip rewards cards until you can.',
      'A fee card wins only with heavy bonus-category spending and good point use.',
      'For travel, a card with no foreign transaction fee matters more than the points.',
    ],
    terms: ['Annual fee', 'APR', 'Credit utilization', 'Hard inquiry', 'Foreign transaction fee'],
    glossary: [{ t: 'Sign-up bonus', d: 'Extra points or cash a card pays if you spend a set amount within the first few months.' }, { t: 'Cents per point', d: 'What one reward point is worth when you redeem it. About 1¢ as cash, sometimes more through travel partners.' }],
    quiz: { q: 'You carry a $3,000 balance at 24% APR and earn 2% back on $30,000 a year of spending. How do they compare?', options: ['Rewards of $600 beat interest of $720', 'Interest of about $720 beats rewards of $600', 'They cancel out exactly'], answer: 1, why: '$3,000 × 24% ≈ $720 of interest versus $30,000 × 2% = $600 of rewards. Paying in full is worth more than any card.' },
    sources: [SRC.csp, SRC.g19, SRC.fico],
  });
})();
