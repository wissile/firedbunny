/* Options income in depth: covered calls, cash-secured puts, rolling and assignment. Four lessons in the options
   course (after the wheel) and four calculators. Facts are sourced in each lesson; worked examples match the
   calculators' default inputs. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const numv = (x) => { const e = $id(x); const v = e ? parseFloat(e.value) : NaN; return isFinite(v) ? v : NaN; };
  const stat = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const msg = (x, cls, pill, html) => { const e = $id(x); if (e) e.innerHTML = ui.msg(cls, pill, html); };
  const money = (v) => F.usd(v, 2);
  const usd0 = (v) => F.usd(Math.round(v), 0);
  const susd0 = (v) => F.susd(Math.round(v), 0);
  const pct = (v, d) => F.pct(v * 100, d == null ? 1 : d);
  const tone = (v) => (v > 0.5 ? 'up' : v < -0.5 ? 'dn' : '');

  SML.css(`
    .oi-chart .lg-k{display:inline-flex;align-items:center;gap:6px;margin-right:14px;font:500 12px/1.4 var(--mono);color:var(--muted)}
    .oi-chart .lg-k i{display:inline-block;width:16px;height:0;border-top:2px solid currentColor}
    .oi-chart .lg-k i.d{border-top-style:dashed}
    .oi-legend{padding:0 16px 10px}
  `);

  /* profit at expiration over a price range, with an optional dashed comparison line */
  function payoffSvg(W, o) {
    let H = W < 520 ? 190 : 210; const pl = 12, pr = 12, top = 22, bot = H - 44;
    const lo = o.lo, hi = o.hi, N = 120;
    const xs = []; for (let i = 0; i <= N; i++) xs.push(lo + ((hi - lo) * i) / N);
    o.marks.forEach((m) => { if (m.v > lo && m.v < hi) xs.push(m.v); });
    xs.sort((a, b) => a - b);
    const ys = xs.map(o.f), cs = o.cmp ? xs.map(o.cmp) : [];
    const all = ys.concat(cs, [0]);
    let yMin = Math.min.apply(null, all), yMax = Math.max.apply(null, all);
    const pad = (yMax - yMin) * 0.12 || 1; yMin -= pad; yMax += pad;
    const x = SML.lin(lo, hi, pl, W - pr), y = SML.lin(yMin, yMax, bot, top);
    let b = '';
    const y0 = y(0);
    const up = xs.map((v, i) => [x(v), y(Math.max(0, ys[i]))]), dn = xs.map((v, i) => [x(v), y(Math.min(0, ys[i]))]);
    b += S.area(up, y0, 'f-up-t') + S.area(dn, y0, 'f-dn-t');
    b += S.line(pl, y0, W - pr, y0, 's-grid');
    b += S.text(pl, y0 - 5, '$0', 'xs mono', 'start');
    if (o.cmp) b += S.poly(xs.map((v, i) => [x(v), y(cs[i])]), 's-mut w15 dash2');
    b += S.poly(xs.map((v, i) => [x(v), y(ys[i])]), 's-acc w25');
    // labels under the chart: sorted by position, each on the first row where it does not touch another
    const ends = [];
    const seen = [];
    o.marks.slice().sort((a, c) => a.v - c.v).forEach((m) => {
      if (!(m.v > lo && m.v < hi) || seen.some((v) => Math.abs(v - m.v) < 1e-9)) return;
      seen.push(m.v);
      const mx = x(m.v), t = m.label, w = t.length * 6.6;
      b += S.line(mx, top - 4, mx, bot, (m.cls || 's-ink') + ' w1 dash');
      let x0 = Math.max(2, Math.min(W - 2 - w, mx - w / 2));
      let r = 0; while (r < ends.length && ends[r] > x0 - 8) r++;
      ends[r] = x0 + w;
      b += S.text(x0, bot + 16 + r * 15, t, 'sm mono b ' + (m.tcls || 'ink'), 'start');
    });
    const top1 = Math.max.apply(null, ys);
    b += S.text(W - pr, top + 2, 'best ' + susd0(top1), 'xs mono up', 'end');
    H += Math.max(0, ends.length - 2) * 15;
    return S.wrap(W, H, o.label, b);
  }
  const legend = (a, b) => `<div class="oi-legend oi-chart"><span class="lg-k" style="color:var(--accent)"><i></i>${a}</span>${b ? `<span class="lg-k"><i class="d"></i>${b}</span>` : ''}</div>`;
  const bad = (fig, W, txt, id) => { fig.innerHTML = S.wrap(W, 70, 'Waiting for inputs', S.text(W / 2, 40, txt, 'md ink', 'middle')); msg(id, 'mut', 'Inputs', txt); };

  /* ---------- 1. Covered call ---------- */
  SML.widgets.coveredCallCalc = function (root) {
    const id = SML.uid('occ');
    root.innerHTML = `
      <div class="wg-ctrl mo-fields">
        ${ui.field({ id: id + '-s', label: 'Stock price now $', value: 50, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-b', label: 'Your cost / share $', value: 50, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-k', label: 'Call strike $', value: 52.5, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-p', label: 'Premium / share $', value: 0.8, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-d', label: 'Days to expiry', value: 30, step: 1, min: 1 })}
        ${ui.field({ id: id + '-n', label: 'Contracts (100 shares each)', value: 1, step: 1, min: 1 })}
        ${ui.field({ id: id + '-v', label: 'Implied volatility %', value: 30, step: 1, min: 1 })}
      </div>
      <div class="wg-fig"></div>${legend('covered call at expiration', 'shares alone')}
      <div class="wg-read mo-r6">${ui.stat('Premium collected', id + '-pc', 'hl')}${ui.stat('Return if unchanged', id + '-ru')}${ui.stat('Return if called away', id + '-rc')}${ui.stat('Annualized if called', id + '-an')}${ui.stat('Breakeven', id + '-be')}${ui.stat('Chance of being called (est.)', id + '-pr')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Returns are measured on what the shares are worth now, the money you could have instead. Profit in dollars is measured from your cost. The chance uses a standard pricing model with the volatility you enter; it is an estimate, not a forecast. No commissions, dividends or taxes.</div>`;
    const fig = root.querySelector('.wg-fig');
    const draw = ui.responsive(fig, (W) => {
      const S0 = numv(id + '-s'), c = numv(id + '-b'), K = numv(id + '-k'), p = numv(id + '-p'), d = numv(id + '-d'), n = Math.max(1, Math.round(numv(id + '-n') || 1)), iv = numv(id + '-v') / 100;
      if (!(S0 > 0 && c > 0 && K > 0 && p >= 0 && d > 0 && iv > 0)) return bad(fig, W, 'Fill in every field with a number above zero.', id + '-msg');
      const m = 100 * n;
      const f = (P) => (Math.min(P, K) - c + p) * m, cmp = (P) => (P - c) * m;
      const be = c - p, maxP = (K - c + p) * m;
      const lo = Math.min(S0, c, be) * 0.8, hi = Math.max(S0, K) * 1.18;
      fig.innerHTML = payoffSvg(W, { lo, hi, f, cmp, label: `Covered call profit at expiration: best ${susd0(maxP)} at or above the ${money(K)} strike, breakeven ${money(be)}.`,
        marks: [{ v: S0, label: 'now ' + money(S0) }, { v: K, label: 'strike ' + money(K), cls: 's-acc', tcls: 'acc' }, { v: be, label: 'breakeven ' + money(be), cls: 's-dn', tcls: 'dn' }] });
      const ru = p / S0, rc = (K - S0 + p) / S0, an = rc * 365 / d;
      const prob = SML.bs(S0, K, d, iv, 0.04, 'call').prob;
      stat(id + '-pc', usd0(p * m));
      stat(id + '-ru', pct(ru, 2));
      stat(id + '-rc', pct(rc, 2), rc < 0 ? 'dn' : '');
      stat(id + '-an', pct(an, 1), an < 0 ? 'dn' : '');
      stat(id + '-be', money(be));
      stat(id + '-pr', pct(prob, 0));
      const capGive = S0 * 1.1 > K ? ` If the stock jumps 10% to ${money(S0 * 1.1)}, you still get only ${money(K)} a share: about ${usd0((S0 * 1.1 - K) * m)} of gain goes to the buyer.` : '';
      if (K < c) msg(id + '-msg', 'dn', 'Below cost', `The strike is under your cost of ${money(c)}. If the shares are called away you lock in ${susd0(maxP)} including the premium. Most covered-call sellers pick a strike above their cost.`);
      else msg(id + '-msg', 'up', 'Covered call', `You collect ${usd0(p * m)} now for agreeing to sell ${m} shares at ${money(K)}. The best case is ${susd0(maxP)} if the stock ends at or above the strike. The premium cushions a fall only down to ${money(be)}; below that you lose like any shareholder.${capGive}`);
    });
    ui.wire(root, () => draw());
  };

  /* ---------- 2. Cash-secured put ---------- */
  SML.widgets.cspCalc = function (root) {
    const id = SML.uid('ocsp');
    root.innerHTML = `
      <div class="wg-ctrl mo-fields">
        ${ui.field({ id: id + '-s', label: 'Stock price now $', value: 60, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-k', label: 'Put strike $', value: 57.5, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-p', label: 'Premium / share $', value: 0.95, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-d', label: 'Days to expiry', value: 30, step: 1, min: 1 })}
        ${ui.field({ id: id + '-n', label: 'Contracts (100 shares each)', value: 1, step: 1, min: 1 })}
        ${ui.field({ id: id + '-y', label: 'Interest on the cash %', value: 4, step: 0.1, min: 0 })}
        ${ui.field({ id: id + '-v', label: 'Implied volatility %', value: 30, step: 1, min: 1 })}
      </div>
      <div class="wg-fig"></div>${legend('cash-secured put at expiration', 'buying the shares now')}
      <div class="wg-read mo-r6">${ui.stat('Cash to set aside', id + '-cap')}${ui.stat('Premium collected', id + '-pc', 'hl')}${ui.stat('Return on the cash', id + '-roc')}${ui.stat('Annualized', id + '-an')}${ui.stat('Price you pay if assigned', id + '-eff')}${ui.stat('Chance of assignment (est.)', id + '-pr')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">The cash stays yours while it waits, so it can also earn interest in a money market fund or T-bills if your broker allows. Annualized assumes you could repeat the same trade all year, which rarely happens exactly. The chance is a model estimate. No commissions or taxes.</div>`;
    const fig = root.querySelector('.wg-fig');
    const draw = ui.responsive(fig, (W) => {
      const S0 = numv(id + '-s'), K = numv(id + '-k'), p = numv(id + '-p'), d = numv(id + '-d'), n = Math.max(1, Math.round(numv(id + '-n') || 1)), yld = (numv(id + '-y') || 0) / 100, iv = numv(id + '-v') / 100;
      if (!(S0 > 0 && K > 0 && p >= 0 && d > 0 && iv > 0)) return bad(fig, W, 'Fill in every field with a number above zero.', id + '-msg');
      const m = 100 * n, cap = K * m, eff = K - p;
      const f = (P) => (p - Math.max(0, K - P)) * m, cmp = (P) => (P - S0) * m;
      const lo = Math.min(S0, eff) * 0.75, hi = Math.max(S0, K) * 1.15;
      fig.innerHTML = payoffSvg(W, { lo, hi, f, cmp, label: `Cash-secured put profit at expiration: best ${susd0(p * m)} at or above the ${money(K)} strike, breakeven ${money(eff)}.`,
        marks: [{ v: S0, label: 'now ' + money(S0) }, { v: K, label: 'strike ' + money(K), cls: 's-acc', tcls: 'acc' }, { v: eff, label: 'breakeven ' + money(eff), cls: 's-dn', tcls: 'dn' }] });
      const roc = p / K, an = roc * 365 / d, intr = cap * yld * d / 365;
      const prob = SML.bs(S0, K, d, iv, 0.04, 'put').prob;
      const disc = (S0 - eff) / S0;
      stat(id + '-cap', usd0(cap));
      stat(id + '-pc', usd0(p * m));
      stat(id + '-roc', pct(roc, 2));
      stat(id + '-an', pct(an, 1));
      stat(id + '-eff', money(eff));
      stat(id + '-pr', pct(prob, 0));
      if (K >= S0) msg(id + '-msg', 'dn', 'In the money', `The strike is at or above today’s price, so assignment is likely and the premium is mostly the stock’s own value. Most sellers choose a strike below the current price.`);
      else msg(id + '-msg', 'acc', 'Cash-secured put', `You set aside ${usd0(cap)} and collect ${usd0(p * m)} now: ${pct(roc, 2)} for ${d} days, plus about ${usd0(intr)} of interest if the cash sits in a fund. If the stock is under ${money(K)} at expiry you buy ${m} shares there, a real cost of ${money(eff)} a share, ${pct(disc, 1)} below today. If it falls to ${money(S0 * 0.8)}, you would be down about ${usd0((eff - S0 * 0.8) * m)} on paper.`);
    });
    ui.wire(root, () => draw());
  };

  /* ---------- 3. Rolling ---------- */
  SML.widgets.rollCalc = function (root) {
    const id = SML.uid('orl');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', [{ v: 'put', label: 'Short put' }, { v: 'call', label: 'Covered call' }], 'put', 'Option you sold')}</div>
      <div class="wg-ctrl mo-fields">
        ${ui.field({ id: id + '-s', label: 'Stock price now $', value: 54, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-k0', label: 'Strike you sold $', value: 57.5, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-p0', label: 'Premium you got $', value: 0.95, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-x', label: 'Cost to buy it back $', value: 3.6, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-d0', label: 'Days left on it', value: 7, step: 1, min: 0 })}
        ${ui.field({ id: id + '-k1', label: 'New strike $', value: 57.5, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-p1', label: 'New premium $', value: 4.55, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-d1', label: 'Days to new expiry', value: 42, step: 1, min: 1 })}
        <div id="${id}-cw" hidden>${ui.field({ id: id + '-c', label: 'Your cost / share $', value: 50, step: 0.01, min: 0 })}</div>
      </div>
      <div class="wg-fig"></div>${legend('after the roll, at the new expiry', 'no roll: assigned or kept now')}
      <div class="wg-read mo-r6">${ui.stat('Net credit or debit', id + '-net', 'hl')}${ui.stat('Premium kept in total', id + '-tot')}${ui.stat('New breakeven', id + '-be')}${ui.stat('Extra time bought', id + '-dx')}${ui.stat('Credit per extra day, yearly', id + '-an')}${ui.stat('Loss if you just close', id + '-cl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">A roll is two trades: buying back the option you sold and selling a new one. Each has its own spread and fees, not included here. “Premium kept in total” adds both premiums you received and subtracts what you paid to buy back.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-t')) {
        if (st.seg(id + '-t') === 'call') { [['-s', 56], ['-k0', 52.5], ['-p0', 0.8], ['-x', 3.75], ['-d0', 5], ['-k1', 55], ['-p1', 3.3], ['-d1', 40], ['-c', 50]].forEach(([k, v]) => st.set(id + k, v)); }
        else { [['-s', 54], ['-k0', 57.5], ['-p0', 0.95], ['-x', 3.6], ['-d0', 7], ['-k1', 57.5], ['-p1', 4.55], ['-d1', 42]].forEach(([k, v]) => st.set(id + k, v)); }
      }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const put = st.seg(id + '-t') !== 'call';
      $id(id + '-cw').hidden = put;
      const S0 = numv(id + '-s'), K0 = numv(id + '-k0'), p0 = numv(id + '-p0'), x = numv(id + '-x'), d0 = Math.max(0, numv(id + '-d0') || 0), K1 = numv(id + '-k1'), p1 = numv(id + '-p1'), d1 = numv(id + '-d1'), c = numv(id + '-c');
      if (!(S0 > 0 && K0 > 0 && p0 >= 0 && x >= 0 && K1 > 0 && p1 >= 0 && d1 > 0) || (!put && !(c > 0))) return bad(fig, W, 'Fill in every field with a number above zero.', id + '-msg');
      const net = p1 - x, tot = p0 - x + p1, dx = d1 - d0;
      let f, cmp, be, label;
      if (put) {
        be = K1 - tot;
        f = (P) => (tot - Math.max(0, K1 - P)) * 100; cmp = (P) => (p0 - Math.max(0, K0 - P)) * 100;
        label = `After rolling the put to ${money(K1)}, breakeven at the new expiry is ${money(be)}.`;
      } else {
        be = c - tot;
        f = (P) => (Math.min(P, K1) - c + tot) * 100; cmp = (P) => (Math.min(P, K0) - c + p0) * 100;
        label = `After rolling the covered call to ${money(K1)}, selling at the strike brings ${money(K1 + tot)} a share.`;
      }
      const lo = Math.min(S0, K0, K1, be) * 0.82, hi = Math.max(S0, K0, K1) * 1.15;
      fig.innerHTML = payoffSvg(W, { lo, hi, f, cmp, label,
        marks: [{ v: S0, label: 'now ' + money(S0) }, { v: K1, label: 'new strike ' + money(K1), cls: 's-acc', tcls: 'acc' }, { v: be, label: (put ? 'breakeven ' : 'cost after premiums ') + money(be), cls: 's-dn', tcls: 'dn' }] });
      const capital = (put ? K1 : S0) * 100;
      const an = dx > 0 ? (net * 100) / capital * 365 / dx : NaN;
      stat(id + '-net', (net >= 0 ? 'Credit ' : 'Debit ') + usd0(Math.abs(net * 100)), net >= 0 ? 'up' : 'dn');
      stat(id + '-tot', susd0(tot * 100), tot >= 0 ? '' : 'dn');
      stat(id + '-be', money(be));
      stat(id + '-dx', dx > 0 ? dx + ' days' : 'none', dx > 0 ? '' : 'dn');
      stat(id + '-an', isFinite(an) ? pct(an, 1) : '—', an < 0 ? 'dn' : '');
      stat(id + '-cl', susd0((p0 - x) * 100), tone((p0 - x) * 100));
      const dir = put ? (K1 < K0 ? 'down and out' : K1 > K0 ? 'up and out' : 'out') : (K1 > K0 ? 'up and out' : K1 < K0 ? 'down and out' : 'out');
      let html;
      if (dx <= 0) html = ['dn', 'No extra time', 'The new option expires no later than the old one. A roll normally moves the expiration later.'];
      else if (net < 0) html = ['dn', 'Debit roll', `Rolling ${dir} costs ${usd0(-net * 100)} more than the new option pays. You are paying to keep the trade alive for ${dx} more days, and the risk is still there. Ask whether you would open this new trade today on its own merits.`];
      else if (put) html = ['acc', 'Credit roll', `Rolling ${dir} brings in ${usd0(net * 100)} more for ${dx} more days, and lifts the premium you have kept to ${susd0(tot * 100)}. If you are assigned at ${money(K1)} later, your real cost is ${money(be)}. Rolling buys time; it does not remove the risk if the stock keeps falling.`];
      else html = ['acc', 'Credit roll', `Rolling ${dir} brings in ${usd0(net * 100)} more for ${dx} more days. If the shares are called away at ${money(K1)}, you receive ${money(K1 + tot)} a share with all premiums counted, against your cost of ${money(c)}.`];
      msg(id + '-msg', html[0], html[1], html[2]);
    });
  };

  /* ---------- 4. Early assignment risk ---------- */
  SML.widgets.assignRisk = function (root) {
    const id = SML.uid('oas');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', [{ v: 'call', label: 'Short call' }, { v: 'put', label: 'Short put' }], 'call', 'Option you sold')}</div>
      <div class="wg-ctrl mo-fields">
        ${ui.field({ id: id + '-s', label: 'Stock price now $', value: 31, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-k', label: 'Strike $', value: 30, step: 0.5, min: 0 })}
        ${ui.field({ id: id + '-o', label: 'Option price now $', value: 1.05, step: 0.01, min: 0 })}
        ${ui.field({ id: id + '-d', label: 'Days to expiry', value: 10, step: 1, min: 0 })}
        ${ui.field({ id: id + '-n', label: 'Contracts', value: 1, step: 1, min: 1 })}
        <div id="${id}-dw">${ui.field({ id: id + '-dv', label: 'Next dividend / share $', value: 0.5, step: 0.01, min: 0 })}</div>
        <div id="${id}-xw">${ui.field({ id: id + '-xd', label: 'Days to ex-dividend date', value: 3, step: 1, min: 0 })}</div>
      </div>
      <div class="wg-fig"></div>
      <div class="wg-read mo-r6">${ui.stat('Assignment risk', id + '-r', 'hl')}${ui.stat('In the money by', id + '-itm')}${ui.stat('Time value left', id + '-tv')}${ui.stat('Dividend vs time value', id + '-dvt')}${ui.stat('If assigned you', id + '-do')}${ui.stat('Amount involved', id + '-amt')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">A rule-of-thumb check, not a prediction: any short US stock option can be assigned on any trading day, in or out of the money. At expiration, options 1 cent or more in the money are exercised automatically unless the owner says otherwise. Time value = option price − the amount it is in the money.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-t')) {
        if (st.seg(id + '-t') === 'put') [['-s', 52], ['-k', 57.5], ['-o', 5.55], ['-d', 4], ['-dv', 0], ['-xd', 0]].forEach(([k, v]) => st.set(id + k, v));
        else [['-s', 31], ['-k', 30], ['-o', 1.05], ['-d', 10], ['-dv', 0.5], ['-xd', 3]].forEach(([k, v]) => st.set(id + k, v));
      }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const call = st.seg(id + '-t') !== 'put';
      const S0 = numv(id + '-s'), K = numv(id + '-k'), o = numv(id + '-o'), d = Math.max(0, numv(id + '-d') || 0), n = Math.max(1, Math.round(numv(id + '-n') || 1));
      const dv = Math.max(0, numv(id + '-dv') || 0), xd = numv(id + '-xd');
      if (!(S0 > 0 && K > 0 && o >= 0)) return bad(fig, W, 'Fill in the stock price, strike and option price.', id + '-msg');
      const intr = call ? Math.max(0, S0 - K) : Math.max(0, K - S0);
      const tv = Math.max(0, o - intr), itm = intr > 0;
      const divBefore = call && dv > 0 && isFinite(xd) && xd < d;
      let level, cls, why;
      if (!itm) {
        const near = Math.abs(S0 - K) / K < 0.01 && d <= 2;
        level = near ? 'Watch' : 'Low'; cls = near ? 'acc' : 'up';
        why = near ? `The stock is within 1% of the strike right before expiry. A late move, even after the close, can decide whether you are assigned, so you may not know until the next morning.` : `The option is out of the money, so the owner would lose money by exercising now. Assignment is unlikely, though never impossible.`;
      } else if (divBefore && dv > tv) {
        level = 'High'; cls = 'dn';
        why = `The ${money(dv)} dividend is bigger than the ${money(tv)} of time value left, and the ex-dividend date comes before expiry. The owner gains by exercising the day before the ex-dividend date to collect the dividend, so you would sell your shares at ${money(K)} and miss the dividend.`;
      } else if (tv < 0.1 || d <= 1) {
        level = 'Elevated'; cls = 'dn';
        why = `The option is in the money with only ${money(tv)} of time value left${d <= 1 ? ' and expiry is here' : ''}. The owner gives up little by exercising early, so assignment is more likely from here on.`;
      } else {
        level = 'Possible'; cls = 'acc';
        why = `The option is in the money, but it still has ${money(tv)} of time value. An owner who exercises now throws that away, so they would usually sell the option instead. That can change as expiry nears.`;
      }
      const m = 100 * n;
      stat(id + '-r', level, cls);
      stat(id + '-itm', itm ? money(intr) : 'out of the money', itm ? 'dn' : 'up');
      stat(id + '-tv', money(tv), tv < 0.1 && itm ? 'dn' : '');
      stat(id + '-dvt', call ? (dv > 0 ? (dv > tv ? 'Dividend bigger' : 'Time value bigger') + (divBefore ? '' : ' (ex-date after expiry)') : 'no dividend') : 'n/a for puts', call && divBefore && dv > tv ? 'dn' : '');
      stat(id + '-do', call ? `sell ${m} shares at ${money(K)}` : `buy ${m} shares at ${money(K)}`);
      stat(id + '-amt', usd0(K * m) + (call && divBefore && dv > tv ? ` and miss ${usd0(dv * m)}` : ''));
      $id(id + '-dw').hidden = !call; $id(id + '-xw').hidden = !call;
      // picture: time value left vs the dividend (calls) or vs a few cents (puts)
      const H = 112, pl = W < 520 ? 120 : 170, pr = 70, bh = 22;
      const vals = call ? [['Time value left', tv, 'f-info'], ['Dividend', divBefore ? dv : 0, divBefore && dv > tv ? 'f-dn' : 'f-mut']] : [['Time value left', tv, 'f-info'], ['In the money by', intr, 'f-dn']];
      const vmax = Math.max(0.05, vals[0][1], vals[1][1]) * 1.1;
      const xs = SML.lin(0, vmax, pl, W - pr);
      let b = '';
      vals.forEach((v, i) => {
        const y = 18 + i * 44;
        b += S.text(pl - 10, y + 15, v[0], 'sm b ink', 'end');
        b += S.rect(pl, y, Math.max(2, xs(v[1]) - pl), bh, v[2], 3);
        b += S.text(xs(v[1]) + 6, y + 15, money(v[1]) + (call && i === 1 && !divBefore && dv > 0 ? ' (after expiry)' : ''), 'sm mono b ink', 'start');
      });
      fig.innerHTML = S.wrap(W, H, `Assignment risk ${level}: time value left ${money(tv)}${call ? ', dividend ' + money(dv) : ''}.`, b);
      msg(id + '-msg', cls, level, why + (call ? '' : ' For puts, early assignment is most likely when the put is deep in the money with almost no time value left.'));
    });
  };

  /* ---------- lessons ---------- */
  const SRC = {
    oicCc: { t: 'Options Industry Council: Covered call (buy/write)', u: 'https://www.optionseducation.org/strategies/all-strategies/covered-call-buy-write' },
    oicCsp: { t: 'Options Industry Council: Cash-secured put', u: 'https://www.optionseducation.org/strategies/all-strategies/cash-secured-put' },
    schwabCsp: { t: 'Schwab: Managing cash-secured equity puts (May 2025)', u: 'https://www.schwab.com/learn/story/managing-cash-secured-equity-puts' },
    schwabAsg: { t: 'Schwab: The risks of options assignment (October 2025)', u: 'https://www.schwab.com/learn/story/risks-options-assignment' },
    fidDiv: { t: 'Fidelity: How dividends can increase options assignment risk (October 2026)', u: 'https://fidelity.com/learning-center/investment-products/options/dividends-options-assignment-risk' },
    etrade: { t: 'E*TRADE: Options expiration process and risks (automatic exercise)', u: 'https://us.etrade.com/l/h/options/expiration-process-risk' },
    occ: { t: 'OCC: Characteristics and Risks of Standardized Options (the options disclosure document)', u: 'https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document' },
    cboe: { t: 'Cboe: white paper on the S&P 500 PutWrite Index, 1986 to 2018 (May 2019)', u: 'https://www.cboe.com/insights/posts/white-paper-shows-volatility-risk-premium-facilitated-higher-risk-adjusted-returns-for-put-index/' },
  };
  const tbl = (head, rows) => '<div style="overflow-x:auto"><table class="tbl"><thead><tr>' + head.map((h) => `<th scope="col">${h}</th>`).join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr><th scope="row">' + r[0] + '</th>' + r.slice(1).map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';

  SML.lessons.push({
    id: 'l-covered-call', course: 'options', order: 8, title: 'Covered calls', mins: 9, level: 'Intermediate',
    summary: 'Sell someone the right to buy your shares at a higher price, and get paid for it now.',
    idea: 'A covered call turns some of a stock’s future upside into cash today. You keep the downside.',
    brief: 'A covered call means owning 100 shares and selling one call option on them. You collect the premium now; in return you agree to sell the shares at the strike price if the buyer asks. The best case is the strike minus your cost plus the premium. The premium cushions a fall only by its own size.',
    widget: 'coveredCallCalc',
    try: 'Change the strike and watch the trade-off: a closer strike pays more premium but caps your gain sooner and is called away more often.',
    body: [
      '<p>When you own at least 100 shares of a stock, you can sell a <b>call option</b> against them. The buyer pays you a <b>premium</b> today for the right to buy your shares at the <b>strike price</b> until the option expires. Because you already own the shares you might have to deliver, the call is <b>covered</b>.</p>',
      '<p>At expiration there are two outcomes. If the stock is <b>below the strike</b>, the call usually expires worthless: you keep the shares and the premium, and you can sell another call. If the stock is <b>above the strike</b>, your shares are likely to be <b>called away</b>: you sell them at the strike and keep the premium.</p>',
      '<p>The Options Industry Council gives the arithmetic. The <b>best result</b> is the strike − what you paid for the shares + the premium. The <b>breakeven</b> is your purchase price − the premium. The <b>worst case</b> is the stock going to zero, cushioned only by the premium.</p>',
      '<p>So a covered call fits a <b>neutral to moderately bullish</b> view: you expect the stock to drift or rise slowly. It is a poor fit if you expect a big rally, because the gain above the strike goes to the buyer, or a big fall, because the premium is a small cushion.</p>',
      '<p>Time decay works for you: each day the call is worth a little less, so it gets cheaper to buy back. Rising volatility works against you if you want to buy the call back, because it makes the call more expensive.</p>',
    ],
    deep: [
      { h: 'Choosing the strike', short: 'The strike', html: '<p>The strike is the price you are agreeing to sell at. Here is the trade-off on the calculator’s default stock, $50 with 30 days to expiry and 30% volatility (model prices):</p>' + tbl(['Strike', 'Premium (model)', 'Return if called', 'Chance of being called (est.)'], [['$50 (at the money)', 'about $1.80', '3.6%', 'about 50%'], ['$52.50', 'about $0.80', '6.6%', 'about 28%'], ['$55', 'about $0.33', '10.7%', 'about 13%']]) + '<p>A closer strike pays more now but caps you sooner. Keep the strike above what you paid for the shares, or being called away locks in a loss.</p>' },
      { h: 'What you give up', short: 'What you give up', html: '<p>The premium is pay for giving up the stock’s upside above the strike. On the default example, if the stock jumps 10% to $55, you still sell at $52.50: about $250 of gain goes to the call buyer, against the $80 you were paid. Over many months the covered call wins in flat markets and lags in strong rallies.</p>' },
      { h: 'Early assignment and dividends', short: 'Early assignment', html: '<p>Calls on US stocks can be exercised on any trading day, so your shares can be called away before expiration. The Options Industry Council names the usual exception: an owner exercising the day before an ex-dividend date to collect the dividend. That is most likely when the call is in the money and its time value is smaller than the dividend. See <a href="#l-assignment">Assignment and early exercise</a>.</p>' },
    ],
    faq: [
      { q: 'Is a covered call risky?', a: 'It carries almost all the risk of owning the stock. The premium lowers your breakeven a little, but if the stock falls 30%, you lose nearly as much as any shareholder.' },
      { q: 'Can I lose my shares?', a: 'Yes, if the stock is above the strike, the shares can be called away at the strike. You keep the premium. If you want to keep the shares, you can buy the call back, often at a loss, or roll it (see <a href="#l-rolling">Rolling options</a>).' },
      { q: 'What happens to the premium for taxes?', a: 'In the US it is taxed when the call expires, is bought back or is assigned, not when you receive it. <a href="#l-wheel-tax">How the wheel is taxed</a> covers each case.' },
    ],
    example: {
      title: 'A covered call on DEMO',
      steps: [
        'You own 100 shares of DEMO, bought at $50, and it trades at $50.',
        'You sell one $52.50 call expiring in 30 days for $0.80 and collect $80.',
        'If DEMO ends below $52.50, the call expires. You keep the shares and the $80: 1.6% in a month.',
        'If DEMO ends above $52.50, your shares are sold at $52.50. Profit: $2.50 + $0.80 = $3.30 a share, $330, or 6.6%.',
        'If DEMO falls to $45, you lose $5 a share on the shares and keep $0.80: down $420. Breakeven is $49.20.',
      ],
      result: 'You traded the gain above $52.50 for $80 now. The cushion on the downside is only that $80.',
    },
    mistakes: [
      'Selling a call below what you paid, so a rally locks in a loss.',
      'Treating the premium as protection. It only covers a fall as large as the premium.',
      'Forgetting the ex-dividend date: an in-the-money call can be exercised early and you miss the dividend.',
      'Selling calls on a stock you would hate to sell, then paying up to buy them back after a rally.',
    ],
    points: [
      'A covered call is 100 shares plus one short call.',
      'Best case = strike − cost + premium; breakeven = cost − premium.',
      'It suits a flat to slowly rising stock.',
      'You keep the downside and give up the upside above the strike.',
      'Early assignment is most likely just before an ex-dividend date.',
    ],
    terms: ['Covered call', 'Assignment', 'Strike price', 'Premium'],
    quiz: { q: 'You bought shares at $50 and sell a $52.50 call for $0.80. What is your best possible profit per share?', options: ['$0.80', '$2.50', '$3.30'], answer: 2, why: 'The shares can rise to the $52.50 strike ($2.50 of gain) and you keep the $0.80 premium: $3.30.' },
    sources: [SRC.oicCc, SRC.fidDiv, SRC.occ],
    checked: 'November 2026',
  });

  SML.lessons.push({
    id: 'l-cash-secured-put', course: 'options', order: 9, title: 'Cash-secured puts', mins: 9, level: 'Intermediate',
    summary: 'Get paid now for agreeing to buy a stock you want at a lower price.',
    idea: 'A cash-secured put is a limit order to buy that pays you while you wait.',
    brief: 'A cash-secured put means selling a put option while keeping enough cash to buy the 100 shares if you are assigned. You collect the premium now. If the stock is below the strike at expiration you buy the shares at the strike, and your real cost is the strike minus the premium. The most you can make is the premium.',
    widget: 'cspCalc',
    try: 'Move the strike further below the price: the premium shrinks, and so does the chance of buying the shares.',
    body: [
      '<p>When you <b>sell a put</b>, the buyer pays you a premium for the right to sell you 100 shares at the strike price until expiration. If you keep the full cost of those shares in cash, the put is <b>cash-secured</b>. Schwab’s example: a $50 put means setting aside at least $5,000.</p>',
      '<p>If the stock stays <b>above the strike</b>, the put expires worthless. You keep the premium, which is the most you can make, and you have no further obligation. If the stock is <b>below the strike</b> at expiration, you will most likely be <b>assigned</b> and buy the shares at the strike.</p>',
      '<p>Your real cost if assigned is the <b>strike − the premium</b>, which is also the breakeven. The worst case is the stock going to zero: you lose the strike minus the premium. That is the same risk as buying the shares, but at a lower price, and in exchange you give up any rally beyond the premium.</p>',
      '<p>The Options Industry Council calls the cash-secured put “primarily a stock acquisition strategy for a price-sensitive investor”. It suits a stock you would be glad to own at the strike. Being assigned a little below the strike is usually fine, because the premium brings your cost under it. Being assigned after a crash leaves you owning shares worth less than you paid.</p>',
    ],
    deep: [
      { h: 'Returns on the cash', short: 'Returns', html: '<p>Measure the return on the cash you set aside, not on nothing. On the default example, $0.95 on a $57.50 strike is 1.65% for 30 days. Annualizing that to 20% assumes you could repeat it twelve times with no assignment, which rarely happens. The cash itself can usually sit in a money market fund or T-bills while it waits; at 4% that adds about $19 a month on $5,750.</p>' },
      { h: 'Closing early', short: 'Closing early', html: '<p>You can buy the put back before expiration. Schwab’s example: a $50 put sold for $2.00 falls to $0.50 after the stock rises, and buying it back locks in $1.50, or $150 a contract. Buying back an in-the-money put to stop further losses usually means taking a loss, and there may not always be a good price to trade at.</p>' },
      { h: 'Picking the strike with delta', short: 'Delta', html: '<p>Many sellers read a put’s delta as a rough chance of finishing in the money. A put near 0.25 delta is assigned about one time in four, a 0.15 put less often. The calculator shows a model estimate from the volatility you enter. See <a href="#l-delta-gamma">Delta and gamma</a>.</p>' },
    ],
    faq: [
      { q: 'How much money do I need?', a: 'The strike × 100 for each contract: $5,750 for a $57.50 strike. In an IRA, brokers require the full amount in cash.' },
      { q: 'Is selling a put the same as a limit order?', a: 'Close, with two differences. You are paid the premium whether or not you buy, and you might not get the shares even if the stock dips below the strike before expiry and recovers.' },
      { q: 'What if the stock falls a lot?', a: 'You must still buy at the strike. You can take the shares and sell covered calls (the <a href="#l-wheel">wheel</a>), close the put for a loss, or roll it (see <a href="#l-rolling">Rolling options</a>).' },
    ],
    example: {
      title: 'A cash-secured put on DEMO',
      steps: [
        'DEMO trades at $60. You set aside $5,750 and sell one $57.50 put expiring in 30 days for $0.95, collecting $95.',
        'If DEMO stays above $57.50, the put expires: you keep $95, 1.65% on the cash in 30 days.',
        'If DEMO ends at $56, you buy 100 shares at $57.50. Your real cost is $57.50 − $0.95 = $56.55 a share.',
        'If DEMO falls to $48, you still pay $57.50: you own shares worth $4,800 that cost you $5,655 net, down $855.',
      ],
      result: 'You were paid $95 to wait for a price 5.75% below today. The risk below $56.55 is the same as owning the stock.',
    },
    mistakes: [
      'Selling puts on a stock you would not want to own, just for the premium.',
      'Selling more contracts than your cash covers. That is no longer cash-secured.',
      'Quoting the annualized return as if every month will repeat.',
      'Selling puts right before earnings without accepting that a gap can blow through the strike.',
    ],
    points: [
      'Keep strike × 100 in cash for each put you sell.',
      'The most you can make is the premium.',
      'Breakeven and your cost if assigned = strike − premium.',
      'The downside is the stock’s, from a lower starting price.',
      'Sell puts only on stocks you would be glad to own at the strike.',
    ],
    terms: ['Cash-secured put', 'Assignment', 'Strike price', 'Premium'],
    quiz: { q: 'You sell a $57.50 put for $0.95 and are assigned. What do the shares really cost you?', options: ['$57.50', '$56.55', '$58.45'], answer: 1, why: 'You pay the $57.50 strike but keep the $0.95 premium, so your cost is $56.55.' },
    sources: [SRC.oicCsp, SRC.schwabCsp, SRC.occ],
    checked: 'November 2026',
  });

  SML.lessons.push({
    id: 'l-rolling', course: 'options', order: 10, title: 'Rolling options', mins: 8, level: 'Advanced',
    summary: 'Buy back the option you sold and sell a later one. It buys time; it does not erase risk.',
    idea: 'A roll is two trades, a close and a new sale. Judge the new trade on its own merits.',
    brief: 'Rolling means buying back an option you sold and selling a new one on the same stock with a later expiration, often at a different strike. Rolling for a credit brings in more premium; rolling for a debit costs money. Either way the stock’s risk stays with you, and each roll adds trading costs.',
    widget: 'rollCalc',
    try: 'Change the new strike: rolling down and out lowers the strike you might buy at, but usually brings in less, or even costs money.',
    body: [
      '<p>Say you sold a put and the stock has fallen toward or below your strike. You can let it run and probably be assigned, buy it back and take the loss, or <b>roll</b>: buy it back and, in the same order, sell a new put with a later expiration.</p>',
      '<p>The new option usually pays more than the old one costs to buy back, because it has more time left. That difference is a <b>net credit</b>. If the new option pays less, the roll is a <b>net debit</b>: you are paying to keep the trade alive.</p>',
      '<p>The common versions:</p><ul><li><b>Out:</b> same strike, later date. Most premium, same risk.</li><li><b>Down and out</b> (puts): lower strike, later date. You would buy cheaper if assigned, but the new put pays less.</li><li><b>Up and out</b> (covered calls): higher strike, later date. More room for the stock to rise, but less premium.</li></ul>',
      '<p>Rolling does not make a losing trade a winner. If the stock keeps falling, the new put keeps losing value too. Schwab notes that rolling adds transaction costs, including the fees on both contracts. A useful test: would you sell the new option today if you had no position? If not, rolling is just postponing a decision.</p>',
    ],
    deep: [
      { h: 'Keep score with total premium', short: 'Keeping score', html: '<p>Track the <b>total premium kept</b>: every premium received minus every buy-back paid. Your real cost if assigned is the strike minus that total. In the default example, $0.95 received − $3.60 paid + $4.55 received = $1.90 kept, so being assigned at $57.50 later costs $55.60 a share.</p>' },
      { h: 'When rolling makes sense', short: 'When to roll', html: '<p>These are rules of thumb, not facts. Rolling can make sense when you still like the stock at the strike, the roll is for a credit, and the new expiration does not cross an earnings date you want to avoid. It makes less sense when you are rolling to avoid admitting a mistake, paying debits again and again, or tying up your cash for months to save a small loss.</p>' },
      { h: 'Rolling covered calls', short: 'Covered calls', html: '<p>For a covered call that is in the money, rolling up and out can keep your shares and lift the price you might sell at. It often costs a debit, and if the stock keeps rising you face the same choice again later. Being called away at a profit is also a fine outcome.</p>' },
    ],
    faq: [
      { q: 'Can I roll as often as I like?', a: 'Yes, as long as the options trade. But each roll costs spreads and fees, and keeps your capital in the same position.' },
      { q: 'Does rolling avoid assignment?', a: 'It replaces the old option with a new one, so the old one can no longer be assigned. The new one can be, on any trading day.' },
      { q: 'How are rolls taxed?', a: 'In the US, buying back the old option closes it, usually as a short-term gain or loss, in that tax year. The new option is a new trade. See <a href="#l-wheel-tax">How the wheel is taxed</a>.' },
    ],
    example: {
      title: 'Rolling a put on DEMO out',
      steps: [
        'You sold a $57.50 put for $0.95 when DEMO was $60. With 7 days left, DEMO is at $54.',
        'Buying the put back costs $3.60: closing now would lose $265.',
        'You roll out: buy it back for $3.60 and sell a $57.50 put 42 days out for $4.55, a $95 net credit for 35 more days.',
        'Total premium kept: $0.95 − $3.60 + $4.55 = $1.90. If assigned at $57.50 later, your cost is $55.60.',
        'Rolling down and out to a $55 put would have paid about $2.95, a $65 debit, for a lower strike.',
      ],
      result: 'The roll bought 35 days and $95. DEMO still has to recover above $55.60 by then for you to come out ahead.',
    },
    mistakes: [
      'Rolling for a debit again and again to avoid taking a loss.',
      'Counting only the latest premium and forgetting what the buy-backs cost.',
      'Rolling into an earnings date without meaning to.',
      'Rolling a put on a stock you no longer want to own.',
    ],
    points: [
      'A roll = buy back the old option + sell a later one.',
      'Credit rolls bring in money; debit rolls cost money.',
      'Rolling buys time; it does not remove the stock’s risk.',
      'Track total premium kept to know your real cost.',
      'Ask whether you would open the new trade on its own.',
    ],
    terms: ['Assignment', 'Premium', 'Cash-secured put', 'Covered call'],
    quiz: { q: 'You received $0.95, pay $3.60 to buy back and sell a new put for $4.55. How much premium have you kept in total?', options: ['$0.95', '$1.90', '$4.55'], answer: 1, why: '$0.95 − $3.60 + $4.55 = $1.90 a share.' },
    sources: [SRC.schwabCsp, SRC.oicCsp, SRC.schwabAsg],
    checked: 'November 2026',
  });

  SML.lessons.push({
    id: 'l-assignment', course: 'options', order: 11, title: 'Assignment and early exercise', mins: 8, level: 'Advanced',
    summary: 'When the buyer exercises, the seller must deliver. Here is when it happens and how to see it coming.',
    idea: 'Any short US stock option can be assigned on any trading day. Time value and dividends tell you how likely it is.',
    brief: 'Assignment is when the owner of an option you sold exercises it, and you must buy shares (for a put) or sell shares (for a call) at the strike. US stock options can be exercised any day until expiration, so early assignment can happen. It is most likely when the option is in the money with little time value left, and for calls just before an ex-dividend date.',
    widget: 'assignRisk',
    try: 'Set the dividend above the time value left and the risk jumps to High. Push the ex-dividend date past expiry and it falls back.',
    body: [
      '<p>Options on US stocks are <b>American-style</b>: the owner can exercise on any trading day up to expiration. When someone exercises, the clearing house (OCC) assigns the obligation to a seller. If that is you, a <b>short put</b> means you must buy 100 shares per contract at the strike, and a <b>short call</b> means you must sell 100 shares at the strike.</p>',
      '<p>Schwab puts it plainly: short options can be assigned “at any time up to expiration regardless of the in-the-money (ITM) amount.” In practice, an owner rarely exercises early, because an option’s price includes <b>time value</b> that is lost by exercising. Selling the option usually gets the owner more.</p>',
      '<p>That gives the main warning signs. Early assignment is more likely when the option is <b>in the money</b> and most of its <b>time value is gone</b>. For calls there is one more: if the <b>dividend</b> is bigger than the call’s remaining time value, the owner has a reason to exercise, usually on the day before the ex-dividend date, to collect the dividend.</p>',
      '<p>At expiration, OCC exercises options that close <b>$0.01 or more in the money</b> automatically, unless the owner instructs otherwise. Owners can also exercise out-of-the-money options, or skip in-the-money ones, after moves in after-hours trading. So a short option that looks out of the money at the close can still be assigned.</p>',
    ],
    deep: [
      { h: 'The dividend check for covered calls', short: 'Dividends', html: '<p>Fidelity describes the rule: early exercise is likely when “the dividend exceeds the remaining time value of the option”, and owners will likely exercise on the day before the ex-dividend date. The stock usually drops by about the dividend on the ex-date, and only shareholders of record get it. Check the ex-dividend date whenever you have an in-the-money call that expires after it.</p>' + tbl(['Call in the money by', 'Call price', 'Time value', 'Dividend', 'Early exercise?'], [['$1.00', '$1.05', '$0.05', '$0.50', 'Likely: dividend > time value'], ['$1.00', '$1.80', '$0.80', '$0.50', 'Less likely: time value > dividend'], ['out of the money', '$0.40', '$0.40', '$0.50', 'Unlikely: no gain from exercising']]) },
      { h: 'What to do about it', short: 'What to do', html: '<p>If you want to keep the shares or avoid buying them, the only sure way is to close the option before it is assigned, by buying it back. Rolling replaces it with a later option (see <a href="#l-rolling">Rolling options</a>). If assignment is fine with you, as in the <a href="#l-wheel">wheel</a>, make sure the cash or shares are there. Assignment turns an option into stock, which can raise margin requirements in a margin account.</p>' },
      { h: 'After assignment', short: 'After assignment', html: '<p>A put assignment leaves you with 100 shares at the strike; your real cost is the strike minus the premium. A covered-call assignment sells your shares at the strike; your sale price is the strike plus the premium. You usually find out the next morning.</p>' },
    ],
    faq: [
      { q: 'Can I be assigned on an out-of-the-money option?', a: 'Rarely, but yes. The owner decides, and after-hours moves on expiration day can change whether exercise makes sense. Close the option if you must avoid assignment.' },
      { q: 'When will I know?', a: 'Brokers usually report assignments the next morning, before the market opens.' },
      { q: 'Does early assignment hurt me?', a: 'Not by itself: you get the strike price you agreed to. On a covered call before an ex-dividend date, you miss the dividend. On a put, you must have the cash.' },
    ],
    example: {
      title: 'A covered call before the dividend',
      steps: [
        'You own 100 shares of DEMO at $31 and sold a $30 call. It expires in 10 days and trades at $1.05.',
        'The call is $1.00 in the money, so its time value is only $0.05.',
        'DEMO goes ex-dividend in 3 days with a $0.50 dividend.',
        'An owner who exercises the day before collects $0.50 and gives up $0.05 of time value, so exercise is likely.',
        'You would sell 100 shares at $30, $3,000, and not receive the $50 dividend.',
      ],
      result: 'When the dividend is bigger than the time value left, expect assignment before the ex-date.',
    },
    mistakes: [
      'Assuming you can only be assigned at expiration.',
      'Ignoring the ex-dividend date on an in-the-money covered call.',
      'Leaving a short option just out of the money into expiration and being surprised by an after-hours move.',
      'Selling puts without the cash to take the shares.',
    ],
    points: [
      'US stock options can be exercised on any trading day.',
      'Risk rises when the option is in the money with little time value.',
      'Calls: watch for a dividend larger than the time value left.',
      'At expiry, options 1 cent or more in the money are exercised automatically.',
      'Only buying the option back removes the risk.',
    ],
    terms: ['Assignment', 'Exercise', 'Ex-dividend date', 'Covered call', 'Cash-secured put'],
    glossary: [{ t: 'Time value', d: 'The part of an option’s price above what it is in the money. It is lost if the option is exercised, and melts toward zero by expiration.' }, { t: 'Exercise by exception', d: 'OCC’s practice of exercising expiring options that are $0.01 or more in the money automatically, unless the owner says otherwise.' }],
    quiz: { q: 'Your $30 call is $1.00 in the money and costs $1.05. A $0.50 dividend goes ex before expiry. Is early assignment likely?', options: ['Yes', 'No', 'Only at expiration'], answer: 0, why: 'The $0.50 dividend is bigger than the $0.05 of time value left, so the owner gains by exercising before the ex-date.' },
    sources: [SRC.schwabAsg, SRC.fidDiv, SRC.etrade, SRC.occ, SRC.oicCc],
    checked: 'November 2026',
  });

  /* ---------- tools ---------- */
  SML.tools.push(
    { id: 'tool-covered-call', title: 'Covered call', blurb: 'Premium, return if called away, breakeven and the chance your shares are called.', widget: 'coveredCallCalc', cat: 'Options', icon: 'wheel', lesson: 'l-covered-call' },
    { id: 'tool-csp', title: 'Cash-secured put', blurb: 'Cash needed, return on it, the price you pay if assigned and the chance of assignment.', widget: 'cspCalc', cat: 'Options', icon: 'wheel', lesson: 'l-cash-secured-put' },
    { id: 'tool-roll', title: 'Option roll', blurb: 'Net credit or debit, total premium kept and the new breakeven when you roll.', widget: 'rollCalc', cat: 'Options', icon: 'wheel', lesson: 'l-rolling' },
    { id: 'tool-assignment', title: 'Early assignment risk', blurb: 'Check time value and the next dividend to see how likely early assignment is.', widget: 'assignRisk', cat: 'Options', icon: 'wheel', lesson: 'l-assignment' },
  );
})();
