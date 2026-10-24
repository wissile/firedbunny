/* Retirement & Wealth track, course "money": budget, spending, habits, emergency fund, net worth. Fork W1. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (x, t, cls) => { const el = $id(x); if (!el) return; el.textContent = t; if (cls !== undefined) el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (x, cls, pill, html) => { const el = $id(x); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const trim = (v, d) => String(+Number(v).toFixed(d == null ? 2 : d));
  const usd0 = (v) => F.usd(v, 0);
  const kfmt = (v) => { const a = Math.abs(v); let s; if (a >= 1e6) s = '$' + trim(a / 1e6, a >= 1e7 ? 1 : 2) + 'M'; else if (a >= 1000) s = '$' + trim(a / 1000, a >= 1e4 ? 0 : 1) + 'k'; else s = '$' + Math.round(a); return (v < 0 ? F.minus : '') + s; };
  const pct = (v, d) => F.pct(v, d == null ? 1 : d);
  const segOf = (e) => (e && e.target && e.target.closest ? e.target.closest('.seg') : null);

  /* Market rates used as defaults (October 2026, see lesson sources). Edited after research. */
  const RATES = { bank: 0.64, hysa: 4.2, vmfxx: 3.83, vusxx: 3.9, tbill: 4.26, vmfxxGov: 0.6661, vusxxGov: 1 };

  SML.css(`
.wmo [hidden]{display:none!important}
.wmo-tx{list-style:none;display:flex;flex-direction:column;padding:4px 16px 12px}
.wmo-tx li{display:grid;grid-template-columns:34px minmax(0,1fr) auto auto;gap:10px;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px;line-height:1.35}
.wmo-tx li:last-child{border-bottom:0}
.wmo-tx .d{font:500 11px var(--mono);color:var(--muted)}
.wmo-tx .m{color:var(--ink);min-width:0}
.wmo-tx .c{font:500 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.wmo-tx .a{font:600 13.5px var(--mono);color:var(--ink);text-align:right;min-width:52px;font-variant-numeric:tabular-nums}
.wmo-tx li.wmo-skip .m,.wmo-tx li.wmo-skip .a{text-decoration:line-through;color:var(--muted)}
.wmo-tx li.wmo-skip .c{color:var(--up)}
.wmo-tx li.wmo-leak .c{color:var(--down)}
@media (max-width:479px){.wmo-tx li{grid-template-columns:30px minmax(0,1fr) auto}.wmo-tx .c{grid-column:2;grid-row:2;margin-top:-2px}.wmo-tx .a{grid-column:3;grid-row:1}}
.wmo-txh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:12px 16px 2px;font:600 11px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.wmo-txh b{color:var(--ink);font-weight:600;letter-spacing:.06em}
.wmo-full{grid-column:1/-1}
.wmo-rates summary{cursor:pointer;font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);padding:2px 0;list-style-position:inside}
.wmo-rates[open] summary{color:var(--ink);margin-bottom:14px}
.wmo-grid{display:grid;gap:16px 24px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.wmo-sub{font:500 11px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.wmo-row{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.wmo-leg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0 24px;padding:6px 16px 12px}
.wmo-leg div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:14px}
.wmo-leg span{display:flex;align-items:center;gap:8px;color:var(--text)}
.wmo-leg i{width:10px;height:10px;border-radius:2px;flex:0 0 auto}
.wmo-leg b{font:600 13.5px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.wmo-leg .dnv{color:var(--down)}
`);

  /* ===================================================================== */
  /* 1. budgetBuilder: needs / wants / save with drag handles and FI years   */
  /* ===================================================================== */
  const yrsToFI = (s) => (s <= 0 ? Infinity : Math.log(1 + (25 * 0.05 * (1 - s)) / s) / Math.log(1.05));
  const yrsTxt = (y) => (!isFinite(y) ? 'never' : y > 60 ? '60+ years' : Math.round(y) + ' years');

  SML.widgets.budgetBuilder = function (root, opts) {
    opts = opts || {};
    root.classList.add('wmo');
    const id = SML.uid('bb');
    const P = {
      grad: { pay: 3800, n: 58, s: 12 },
      couple: { pay: 9000, n: 50, s: 20 },
      family: { pay: 11500, n: 62, s: 13 },
      fire: { pay: 7500, n: 38, s: 50 },
    };
    const p0 = P[opts.preset] || P.couple;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Who is budgeting?</span>${ui.seg(id + '-p', [{ v: 'grad', label: 'New grad' }, { v: 'couple', label: 'Couple' }, { v: 'family', label: 'Family of four' }, { v: 'fire', label: 'Early-retirement saver' }], opts.preset || 'couple', 'Example household')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-pay', label: 'Take-home pay a month', min: 1500, max: 25000, step: 100, value: p0.pay, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-n', label: 'Needs', min: 20, max: 90, step: 1, value: p0.n, fmt: 'pct' })}
        ${ui.slider({ id: id + '-s', label: 'Saving and investing', min: 0, max: 70, step: 1, value: p0.s, fmt: 'pct' })}
      </div>
      <div class="wg-read">${ui.stat('Needs', id + '-vn')}${ui.stat('Wants', id + '-vw')}${ui.stat('Saving', id + '-vs')}${ui.stat('Savings rate', id + '-sr', 'hl')}${ui.stat('Years to independence', id + '-fy')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the two handles on the bar, or use the sliders. Wants are whatever is left over. Years to financial independence assume you start from zero, earn 5% a year after inflation and can live on 4% of your savings each year.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const sg = segOf(e);
      if (sg && sg.id === id + '-p') { const p = P[st.seg(id + '-p')]; st.set(id + '-pay', p.pay); st.set(id + '-n', p.n); st.set(id + '-s', p.s); }
      const t = e && e.target ? e.target.id : '';
      const n = st.n(id + '-n'), s = st.n(id + '-s');
      if (t === id + '-n' && n + s > 100) st.set(id + '-s', 100 - n);
      if (t === id + '-s' && n + s > 100) st.set(id + '-n', 100 - s);
      draw();
    });
    let G = null, active = null;
    ui.drag(fig, {
      sel: '[data-h]',
      start(pt, t) { active = t.getAttribute('data-h'); },
      move(pt) {
        if (!G || !active) return;
        const p = Math.round(SML.clamp(((pt.x - G.x0) / (G.x1 - G.x0)) * 100, 0, 100));
        const n = st.n(id + '-n'), s = st.n(id + '-s');
        if (active === 'n') st.set(id + '-n', SML.clamp(p, 20, Math.min(90, 100 - s)));
        else st.set(id + '-s', SML.clamp(100 - p, 0, Math.min(70, 100 - n)));
        draw();
      },
      end() { active = null; },
    });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const pay = st.n(id + '-pay'), n = st.n(id + '-n'), s = st.n(id + '-s'), w = Math.max(0, 100 - n - s);
      const x0 = 16, x1 = W - 16, X = (p) => x0 + ((x1 - x0) * p) / 100;
      const barY = 44, barH = compact ? 64 : 58;
      let b = S.text(x0, 24, `Your ${usd0(pay)} month`, 'lg ink b') + S.text(x1, 24, compact ? 'drag ◆' : 'drag the handles to move money', 'sm acc', 'end');
      const segs = [['Needs', n, 'f-info', 'info'], ['Wants', w, 'f-acc', 'acc'], ['Save', s, 'f-up', 'up']];
      let acc = 0; const below = [];
      segs.forEach(([lab, v, cls, tc], i) => {
        const xa = X(acc), xb = X(acc + v); acc += v;
        if (v <= 0) return;
        b += S.rect(xa, barY, xb - xa, barH, cls);
        const wpx = xb - xa, $ = usd0((pay * v) / 100);
        if (wpx >= (compact ? 72 : 92)) {
          const tx = xa + (i ? 16 : 8);
          b += S.text(tx, barY + 22, `${lab} ${v}%`, 'md b onacc') + S.text(tx, barY + 40, $, (compact ? 'sm' : 'md') + ' mono onacc');
        } else below.push({ x: (xa + xb) / 2, t: `${lab} ${v}%`, c: tc, i });
      });
      below.forEach((q, k) => { b += S.text(SML.clamp(q.x, x0 + 30, x1 - 30), barY + barH + 15 + (k % 2) * 13, q.t, 'sm b ' + q.c, 'middle'); });
      // handles
      [['n', X(n)], ['s', X(n + w)]].forEach(([h, x]) => {
        b += S.line(x, barY - 7, x, barY + barH + 7, 's-ink w2');
        b += S.circle(x, barY + barH / 2, 20, 'hit', ` data-h="${h}"`) + S.circle(x, barY + barH / 2, 10, 'handle', ` data-h="${h}"`);
      });
      // 50/30/20 guide
      const gy = barY + barH + (below.length ? 46 : 32);
      b += S.text(x0, gy - 7, 'Guide: 50% needs · 30% wants · 20% saving', 'sm mut');
      [[0, 50, 'f-info'], [50, 80, 'f-acc'], [80, 100, 'f-up']].forEach(([a, c, cls]) => { b += S.rect(X(a), gy, X(c) - X(a) - 1, 8, cls + ' o50'); });
      // FI curve
      const ct = gy + 44, ch = compact ? 150 : 160, pl = compact ? 40 : 48, pr = 16;
      const cx = SML.lin(8, 75, pl, W - pr), cy = SML.lin(0, 60, ct + ch, ct);
      b += S.text(x0, ct - 16, 'Years of work until your savings can pay your bills', 'sm ink b');
      [0, 20, 40, 60].forEach((v) => { b += S.line(pl, cy(v), W - pr, cy(v), 's-grid') + S.text(pl - 6, cy(v) + 4, v + 'y', 'xs mono', 'end'); });
      (compact ? [10, 30, 50, 70] : [10, 20, 30, 40, 50, 60, 70]).forEach((v) => { b += S.text(cx(v), ct + ch + 16, v + '%', 'xs mono', 'middle'); });
      const pts = []; for (let r = 8; r <= 75; r += 0.5) pts.push([cx(r), cy(Math.min(60, yrsToFI(r / 100)))]);
      b += S.poly(pts, 's-up w25');
      const yv = yrsToFI(s / 100), sx = cx(SML.clamp(s, 8, 75)), sy = cy(Math.min(60, isFinite(yv) ? yv : 60));
      b += S.line(sx, sy, sx, ct + ch, 's-acc dash2') + S.circle(sx, sy, 6.5, 'f-acc');
      const lab = `${s}% saved → ${yrsTxt(yv)}`;
      const right = sx < W * 0.55;
      b += S.text(right ? sx + 12 : sx - 12, Math.max(ct + 12, sy - 10), lab, 'md acc b', right ? 'start' : 'end');
      b += S.text(W - pr, ct + ch + 30, 'savings rate', 'xs', 'end');
      const H = ct + ch + 36;
      fig.innerHTML = S.wrap(W, H, `Budget bar: needs ${n}%, wants ${w}%, saving ${s}%. At this savings rate, about ${yrsTxt(yv)} to financial independence.`, b, 'drag');
      G = { x0, x1 };
      setT(id + '-vn', usd0((pay * n) / 100), 'info'); setT(id + '-vw', usd0((pay * w) / 100), 'acc'); setT(id + '-vs', usd0((pay * s) / 100), 'up');
      setT(id + '-sr', s + '%'); setT(id + '-fy', yrsTxt(yv));
      const yr = (pay * s * 12) / 100;
      let m;
      if (s >= 45) m = ['up', 'Early-retirement pace', `Saving ${s}% (${usd0(yr)} a year) means about ${yrsTxt(yv)} of work until your savings can cover your spending. Low housing costs are what usually make this possible.`];
      else if (s >= 20) m = ['up', 'On track', `You save ${usd0(yr)} a year, at or above the 50/30/20 guide. Each extra 5 points cuts years: at ${s + 5}% it would be about ${yrsTxt(yrsToFI((s + 5) / 100))}.`];
      else if (s >= 10) m = ['acc', 'Getting there', `Saving ${s}% works, but it is slow: about ${yrsTxt(yv)}. Raising it to 20% would cut that to about ${yrsTxt(yrsToFI(0.2))}.`];
      else m = ['dn', 'Too thin', `Below 10%, the next surprise bill lands on a credit card. Pay yourself first: automate even 5% on payday, then raise it 1 point a month.`];
      if (n > 60) m[2] += ` Needs take ${n}% of your pay. Housing is usually the lever: rent or a mortgage near a quarter to a third of take-home pay leaves room to save.`;
      setMsg(id + '-msg', m[0], m[1], m[2]);
    });
  };

  /* ===================================================================== */
  /* 2. spendTracker: a month week by week, with and without a review         */
  /* ===================================================================== */
  const CATS = [{ k: 'g', name: 'Groceries', b: 600 }, { k: 'd', name: 'Dining out', b: 300 }, { k: 't', name: 'Transport', b: 350 }, { k: 's', name: 'Shopping', b: 250 }, { k: 'u', name: 'Subscriptions', b: 90 }, { k: 'f', name: 'Fun', b: 200 }];
  const CATNAME = { g: 'Groceries', d: 'Dining', t: 'Transport', s: 'Shopping', u: 'Subscription', f: 'Fun' };
  const TX = [
    [['Mon', 'Gas', 't', 52], ['Mon', 'Grocery store', 'g', 112], ['Tue', 'Farmers market', 'g', 48], ['Wed', 'Lunches out (2)', 'd', 46], ['Thu', 'Household items', 's', 40], ['Fri', 'Dinner with friends', 'd', 64], ['Sat', 'Rideshare', 't', 38], ['Sat', 'Movie night', 'f', 30], ['Sun', 'Streaming and music', 'u', 29], ['Sun', 'Gym membership (not used)', 'u', 35, 'leak']],
    [['Sun', 'Grocery store', 'g', 150], ['Mon', 'Gas', 't', 50], ['Tue', 'Takeout (3)', 'd', 58], ['Wed', 'Online order: shoes', 's', 120], ['Thu', 'Home decor', 's', 40], ['Fri', 'Parking', 't', 35], ['Sat', 'Brunch', 'd', 37], ['Sat', 'Concert tickets', 'f', 85]],
    [['Sun', 'Grocery store', 'g', 140], ['Sun', 'Second streaming service', 'u', 16], ['Sun', 'Cloud storage', 'u', 3], ['Sun', 'App subscription', 'u', 19], ['Mon', 'Gas', 't', 55], ['Tue', 'Takeout (2)', 'd', 44], ['Wed', 'Lunches out (2)', 'd', 36, 'skip'], ['Wed', 'Online order: gadget', 's', 70, 'skip'], ['Thu', 'Snacks and drinks', 'g', 30], ['Fri', 'Rideshare', 't', 40], ['Fri', 'Bar tab', 'f', 60, 'skip']],
    [['Sun', 'Grocery store', 'g', 155], ['Mon', 'Gas', 't', 50], ['Tue', 'Takeout', 'd', 41], ['Thu', 'Car wash', 't', 30], ['Fri', 'Dinner out', 'd', 49, 'skip'], ['Fri', 'Drinks with friends', 'f', 25, 'skip'], ['Sat', 'Clothes', 's', 60], ['Sat', 'Mini golf', 'f', 25]],
  ];
  const BUDGET = CATS.reduce((a, c) => a + c.b, 0);
  const counts = (tx, wi, review) => !(review && wi >= 2 && tx[4] === 'skip');
  const spentTo = (k, wk, review) => { let s = 0; for (let i = 0; i < wk; i++) TX[i].forEach((tx) => { if (tx[2] === k && counts(tx, i, review)) s += tx[3]; }); return s; };
  const monthTotal = (review) => CATS.reduce((a, c) => a + spentTo(c.k, 4, review), 0);

  SML.widgets.spendTracker = function (root) {
    root.classList.add('wmo');
    const id = SML.uid('stk');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-w', [1, 2, 3, 4].map((v) => ({ v, label: 'Week ' + v })), 2, 'Week of the month')}<span class="grow"></span><button type="button" class="btn btn-g sm" id="${id}-play">Play the month</button></div>
      <div class="wg-bar">${ui.chips(id + '-rv', [{ k: 'rv', label: 'Weekly 10-minute review', color: 'var(--up)', on: false }])}</div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Spent so far', id + '-sp')}${ui.stat('Plan by now', id + '-pl')}${ui.stat('Over or under plan', id + '-ov')}${ui.stat('Month if this continues', id + '-pr')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div><p class="wmo-txh"><span id="${id}-th">This week</span><b id="${id}-tt"></b></p><ul class="wmo-tx" id="${id}-tx"></ul></div>
      <div class="wg-note">Sample month for a household with a ${usd0(BUDGET)} budget for flexible spending. Bills such as rent and insurance are left out. The tick on each bar shows where you should be by this week if you spend evenly.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    let timer = null;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } const b = $id(id + '-play'); if (b) b.textContent = 'Play the month'; };
    SML.onCleanup(stop);
    $id(id + '-play').addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (SML.reduced()) { st.setSeg(id + '-w', 4); draw(); return; }
      let w = 1; st.setSeg(id + '-w', w); draw(); $id(id + '-play').textContent = 'Pause';
      timer = setInterval(() => { w++; if (w > 4) { stop(); return; } st.setSeg(id + '-w', w); draw(); }, 1300);
    });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const wk = Number(st.seg(id + '-w')) || 1, rv = st.on(id + '-rv', 'rv');
      const pace = wk / 4;
      const lw = compact ? 0 : 118, rw = compact ? 0 : 112;
      const tx0 = 16 + lw, tx1 = W - 16 - rw;
      const rowH = compact ? 46 : 36, top = 40;
      const X = SML.lin(0, 1.3, tx0, tx1);
      let b = S.text(16, 22, `Week ${wk} of 4`, 'lg ink b') + S.text(W - 16, 22, compact ? '| = plan by now' : '| = where even spending puts you by now', 'sm mut', 'end');
      CATS.forEach((c, i) => {
        const y = top + i * rowH, sp = spentTo(c.k, wk, rv), ratio = sp / c.b, vsPace = sp / (c.b * pace);
        const cls = vsPace > 1.1 ? 'dn' : vsPace > 1.0 ? 'acc' : 'up';
        const by = compact ? y + 18 : y + 8, bh = compact ? 14 : 16;
        if (compact) { b += S.text(16, y + 11, c.name, 'sm ink b') + S.text(W - 16, y + 11, `${usd0(sp)} of ${usd0(c.b)}`, 'sm mono ' + cls, 'end'); }
        else { b += S.text(16, by + 12, c.name, 'md ink') + S.text(W - 16, by + 12, `${usd0(sp)} of ${usd0(c.b)}`, 'md mono ' + cls, 'end'); }
        b += S.rect(tx0, by, tx1 - tx0, bh, 'f-shade', 3);
        b += S.rect(tx0, by, X(Math.min(ratio, 1.3)) - tx0, bh, 'f-' + cls, 3);
        b += S.line(X(1), by - 3, X(1), by + bh + 3, 's-ink w15');
        b += S.line(X(pace), by - 5, X(pace), by + bh + 5, 's-acc w25');
      });
      const yb = top + CATS.length * rowH + 4;
      b += S.text(X(1), yb + 10, 'budget', 'xs', 'middle');
      const H = yb + 18;
      fig.innerHTML = S.wrap(W, H, `Spending by category after week ${wk}${rv ? ', with a weekly review' : ''}`, b);
      // stats
      const spent = CATS.reduce((a, c) => a + spentTo(c.k, wk, rv), 0), plan = BUDGET * pace, diff = spent - plan;
      setT(id + '-sp', usd0(spent)); setT(id + '-pl', usd0(plan));
      setT(id + '-ov', (diff > 0 ? '+' : diff < 0 ? F.minus : '') + usd0(Math.abs(diff)), diff > 20 ? 'dn' : 'up');
      setT(id + '-pr', usd0((spent / wk) * 4));
      // transactions
      const list = TX[wk - 1];
      const shown = list.reduce((a, t) => a + (counts(t, wk - 1, rv) ? t[3] : 0), 0);
      $id(id + '-th').textContent = `Week ${wk} transactions`; $id(id + '-tt').textContent = usd0(shown);
      $id(id + '-tx').innerHTML = list.map((t) => {
        const skip = rv && wk >= 3 && t[4] === 'skip', leak = t[4] === 'leak';
        const c = skip ? 'skipped after review' : leak && rv ? 'cancel: unused' : CATNAME[t[2]];
        return `<li class="${skip ? 'wmo-skip' : ''}${leak && rv ? ' wmo-leak' : ''}"><span class="d">${t[0]}</span><span class="m">${SML.esc(t[1])}</span><span class="c">${c}</span><span class="a">${usd0(t[3])}</span></li>`;
      }).join('');
      // coach
      const m0 = monthTotal(false), m1 = monthTotal(true);
      const over = (k) => spentTo(k, 2, false) - CATS.find((c) => c.k === k).b / 2;
      let m;
      if (wk === 1) m = ['info', 'Week 1', 'Groceries and transport look normal. Hidden in subscriptions: a $35 gym membership nobody used this month.'];
      else if (wk === 2 && !rv) m = ['acc', 'Check in now', `Two weeks in, dining is ${usd0(over('d'))} over plan and shopping is ${usd0(over('s'))} over. Turn on the review to see what ten minutes changes.`];
      else if (wk === 2) m = ['up', 'Review done', 'Dining, shopping and fun are over plan, so you skip a few planned extras in weeks 3 and 4, and you cancel the unused gym ($420 a year).'];
      else if (!rv) m = ['dn', wk === 4 ? 'Month over' : 'Drifting', `With no review, the month ends ${usd0(m0 - BUDGET)} over budget. Nothing dramatic happened: small extras in three categories.`];
      else m = ['up', wk === 4 ? 'Month on plan' : 'Catching up', `With one review the month ends at ${usd0(m1)}, ${m1 <= BUDGET ? usd0(BUDGET - m1) + ' under' : usd0(m1 - BUDGET) + ' over'} budget instead of ${usd0(m0 - BUDGET)} over, and the gym is cancelled for next month.`];
      setMsg(id + '-msg', m[0], m[1], m[2]);
    });
  };

  /* ===================================================================== */
  /* 3. habitCost: what small habits cost and grow into; coffee at home       */
  /* ===================================================================== */
  const HABITS = [
    { k: 'latte', name: 'Coffee-shop latte', short: 'Latte', price: 6.25, n: 5, unit: 'week', pmin: 2, pmax: 9, pstep: 0.25, nmax: 14, on: true },
    { k: 'pods', name: 'Coffee pods at home', short: 'Pods', price: 1.1, n: 14, unit: 'week', pmin: 0.4, pmax: 2, pstep: 0.05, nmax: 28, on: false },
    { k: 'lunch', name: 'Takeout lunch', short: 'Lunch', price: 15, n: 3, unit: 'week', pmin: 6, pmax: 30, pstep: 0.5, nmax: 7, on: true },
    { k: 'deliv', name: 'Delivery fees and tips', short: 'Delivery', price: 12, n: 2, unit: 'week', pmin: 3, pmax: 25, pstep: 0.5, nmax: 7, on: false },
    { k: 'subs', name: 'Streaming and app subscriptions', short: 'Subs', price: 55, n: 1, unit: 'month', pmin: 0, pmax: 200, pstep: 1, nmax: 1, on: true },
    { k: 'soda', name: 'Energy drink or soda', short: 'Drinks', price: 3.25, n: 5, unit: 'week', pmin: 1, pmax: 6, pstep: 0.25, nmax: 14, on: false },
  ];
  const fvMonthly = (yearly, years, r) => { const m = yearly / 12, i = r / 12, n = years * 12; return i === 0 ? m * n : m * ((Math.pow(1 + i, n) - 1) / i); };

  SML.widgets.habitCost = function (root, opts) {
    opts = opts || {};
    root.classList.add('wmo');
    const id = SML.uid('hc');
    const hab = HABITS.map((h) => Object.assign({}, h));
    const ctlFor = (h) => `<div class="wmo-grid wmo-full" data-hk="${h.k}"${h.k === 'latte' ? '' : ' hidden'}>
        ${ui.slider({ id: `${id}-p-${h.k}`, label: h.unit === 'month' ? 'Total a month' : 'Price each', min: h.pmin, max: h.pmax, step: h.pstep, value: h.price, fmt: h.pstep < 1 ? 'usd' : 'usd0' })}
        ${h.unit === 'month' ? '' : ui.slider({ id: `${id}-n-${h.k}`, label: 'Times a week', min: 0, max: h.nmax, step: 1, value: h.n, fmt: 'num' })}
      </div>`;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-v', [{ v: 'hab', label: 'Your habits' }, { v: 'cof', label: 'Coffee: café, pods or machine' }], opts.view || 'hab', 'View')}</div>
      <div class="wg-bar" data-pane="hab"><span class="wg-title">Count</span>${ui.chips(id + '-inc', hab.map((h) => ({ k: h.k, label: h.short, color: 'var(--accent)', on: h.on })))}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl" data-pane="hab">
        <div class="wmo-full wmo-row"><span class="wmo-sub">Edit</span>${ui.seg(id + '-e', hab.map((h) => ({ v: h.k, label: h.short })), 'latte', 'Habit to edit')}</div>
        ${hab.map(ctlFor).join('')}
        ${ui.slider({ id: id + '-r', label: 'If invested, yearly return', min: 0, max: 10, step: 0.5, value: 7, fmt: (v) => trim(v, 1) + '%' })}
      </div>
      <div class="wg-ctrl" data-pane="cof" hidden>
        ${ui.slider({ id: id + '-cd', label: 'Coffees a day', min: 1, max: 4, step: 1, value: 2, fmt: 'num' })}
        ${ui.slider({ id: id + '-cc', label: 'Café drink', min: 3, max: 9, step: 0.25, value: 6.25, fmt: 'usd' })}
        ${ui.slider({ id: id + '-cp', label: 'Pod drink (pod + milk)', min: 0.5, max: 2, step: 0.05, value: 1.3, fmt: 'usd' })}
        ${ui.slider({ id: id + '-cb', label: 'Home espresso (beans + milk)', min: 0.3, max: 1.5, step: 0.05, value: 0.75, fmt: 'usd' })}
        ${ui.slider({ id: id + '-cm', label: 'Espresso machine + grinder', min: 300, max: 3000, step: 50, value: 900, fmt: 'usd0' })}
      </div>
      <div class="wg-read" data-pane="hab">${ui.stat('Per year', id + '-yr', 'hl big')}${ui.stat('Per day', id + '-dy')}${ui.stat('Invested 10 years', id + '-10')}${ui.stat('Invested 30 years', id + '-30')}</div>
      <div class="wg-read" data-pane="cof" hidden>${ui.stat('Café a year', id + '-ca')}${ui.stat('Pods a year', id + '-pa')}${ui.stat('Home espresso a year', id + '-ea')}</div>
      <div class="wg-read" data-pane="cof" hidden>${ui.stat('Machine pays back vs café', id + '-pb1')}${ui.stat('vs pods', id + '-pb2')}${ui.stat('Café → machine, invested 30 yrs', id + '-iv1', 'hl')}${ui.stat('Pods → machine, invested 30 yrs', id + '-iv2')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const sg = segOf(e);
      if (sg && sg.id === id + '-e') root.querySelectorAll('[data-hk]').forEach((el) => { el.hidden = el.getAttribute('data-hk') !== st.seg(id + '-e'); });
      if (sg && sg.id === id + '-v') { const v = st.seg(id + '-v'); root.querySelectorAll('[data-pane]').forEach((el) => { el.hidden = el.getAttribute('data-pane') !== v; }); }
      draw();
    });
    const yearly = (h) => { const p = st.n(`${id}-p-${h.k}`); return h.unit === 'month' ? p * 12 : p * st.n(`${id}-n-${h.k}`) * 52; };
    function drawHab(W) {
      const compact = W < 480;
      const ed = st.seg(id + '-e'), r = st.n(id + '-r') / 100;
      const rows = hab.map((h) => ({ h, inc: st.on(id + '-inc', h.k), yr: yearly(h) }));
      const tot = rows.filter((q) => q.inc).reduce((a, q) => a + q.yr, 0);
      const maxYr = Math.max(...rows.map((q) => q.yr), 1);
      const rowH = compact ? 40 : 30, top = 36, lw = compact ? 0 : 230, rw = compact ? 0 : 92;
      const bx0 = 16 + lw, bx1 = W - 16 - rw;
      let b = S.text(16, 22, 'What each habit costs in a year', 'md ink b') + (compact ? '' : S.text(W - 16, 22, 'example prices', 'sm mut', 'end'));
      rows.forEach((q, i) => {
        const y = top + i * rowH, tc = q.inc ? 'ink' : 'mut', on = q.h.k === ed;
        const by = compact ? y + 17 : y + 6, bh = compact ? 12 : 16;
        const lab = (on ? '▸ ' : '') + (compact ? q.h.name.replace('Streaming and app subscriptions', 'Subscriptions').replace('Delivery fees and tips', 'Delivery fees') : q.h.name) + (q.inc ? '' : ' (not counted)');
        if (compact) b += S.text(16, y + 11, lab, 'sm ' + tc + (on ? ' b' : '')) + S.text(W - 16, y + 11, usd0(q.yr), 'sm mono ' + (q.inc ? 'acc b' : 'mut'), 'end');
        else b += S.text(16, by + 12, lab, 'md ' + tc + (on ? ' b' : '')) + S.text(W - 16, by + 12, usd0(q.yr), 'md mono ' + (q.inc ? 'acc b' : 'mut'), 'end');
        b += S.rect(bx0, by, bx1 - bx0, bh, 'f-shade', 3) + S.rect(bx0, by, ((bx1 - bx0) * q.yr) / maxYr, bh, q.inc ? 'f-acc' : 'f-shade2', 3);
      });
      // horizons
      const ht = top + rows.length * rowH + 30, ch = compact ? 150 : 170;
      b += S.text(16, ht, `Invest ${usd0(tot)} a year instead, at ${trim(r * 100, 1)}%`, 'md ink b');
      const vals = [10, 20, 30].map((y) => ({ y, fv: fvMonthly(tot, y, r), put: tot * y }));
      const vmax = Math.max(vals[2].fv, 1);
      const base = ht + 34 + ch, cw = Math.min(compact ? 64 : 96, (W - 32) / 5);
      const yS = SML.lin(0, vmax, base, ht + 34);
      vals.forEach((v, i) => {
        const cx = 16 + ((W - 32) * (i + 0.5)) / 3;
        b += S.rect(cx - cw / 2, yS(v.fv), cw, base - yS(v.fv), 'f-up-t s-up w15', 3);
        b += S.rect(cx - cw / 2, yS(v.put), cw, base - yS(v.put), 'f-acc', 2);
        b += S.text(cx, yS(v.fv) - 8, kfmt(v.fv), (compact ? 'md' : 'lg') + ' up b mono', 'middle');
        b += S.text(cx, base + 16, v.y + ' years', 'sm ink b', 'middle');
      });
      b += S.line(16, base + 0.5, W - 16, base + 0.5, 's-line');
      b += S.rect(16, base + 28, 10, 10, 'f-acc', 2) + S.text(32, base + 37, 'what you spent', 'sm') + S.rect(compact ? 132 : 146, base + 28, 10, 10, 'f-up-t s-up w1', 2) + S.text(compact ? 148 : 162, base + 37, 'what it grows into', 'sm');
      const H = base + 46;
      fig.innerHTML = S.wrap(W, H, `Habits cost ${usd0(tot)} a year; invested at ${trim(r * 100, 1)}% for 30 years that grows to about ${kfmt(vals[2].fv)}`, b);
      setT(id + '-yr', usd0(tot)); setT(id + '-dy', F.usd(tot / 365)); setT(id + '-10', kfmt(vals[0].fv), 'up'); setT(id + '-30', kfmt(vals[2].fv), 'up');
      const big = rows.filter((q) => q.inc).sort((a, c) => c.yr - a.yr)[0];
      if (!tot) setMsg(id + '-msg', 'info', 'Pick habits', 'Tap the chips above to count a habit, then edit its price and how often.');
      else setMsg(id + '-msg', tot > 3000 ? 'acc' : 'up', usd0(tot / 12) + ' a month', `Your biggest one is ${big.h.name.toLowerCase()} at ${usd0(big.yr)} a year. Over 30 years, all of them together cost ${kfmt(vals[2].put)}; invested instead, that money could grow to about ${kfmt(vals[2].fv)}. You do not have to quit everything: keep the one you love most and trim the rest.`);
      $id(id + '-note').textContent = `Example prices; edit them to match yours. Invested monthly at ${trim(r * 100, 1)}% a year compounded monthly, before taxes and inflation. Stocks have averaged roughly this over long periods, with big swings along the way. It is not a promise.`;
    }
    function drawCof(W) {
      const compact = W < 480;
      const d = st.n(id + '-cd'), cafe = st.n(id + '-cc'), pod = st.n(id + '-cp'), bean = st.n(id + '-cb'), mach = st.n(id + '-cm');
      const perM = d * (365 / 12);
      const M = 36;
      const lines = [
        { k: 'cafe', name: 'Café', cls: 'dn', f: (m) => cafe * perM * m },
        { k: 'pods', name: 'Pods', cls: 'acc', f: (m) => pod * perM * m },
        { k: 'esp', name: 'Machine + beans', cls: 'up', f: (m) => mach + bean * perM * m },
      ];
      const pl = compact ? 46 : 56, pr = compact ? 16 : 120, pt = 34, ch = compact ? 230 : 260;
      const ymax = Math.max(lines[0].f(M), lines[2].f(M), lines[1].f(M)) * 1.06;
      const x = SML.lin(0, M, pl, W - pr), y = SML.lin(0, ymax, pt + ch, pt);
      let b = S.text(16, 20, `Total spent on ${d} coffee${d > 1 ? 's' : ''} a day`, 'md ink b');
      SML.ticks(0, ymax, 4).forEach((v) => { b += S.line(pl, y(v), W - pr, y(v), 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
      [0, 6, 12, 18, 24, 30, 36].filter((m) => !compact || m % 12 === 0).forEach((m) => { b += S.text(x(m), pt + ch + 16, m === 0 ? 'now' : m % 12 === 0 ? m / 12 + ' yr' + (m > 12 ? 's' : '') : m + ' mo', 'xs mono', 'middle'); });
      lines.forEach((l) => { const pts = []; for (let m = 0; m <= M; m += 0.5) pts.push([x(m), y(l.f(m))]); b += S.poly(pts, `s-${l.cls} w25`); });
      // crossovers (payback months)
      const pbCafe = cafe > bean ? mach / ((cafe - bean) * perM) : Infinity;
      const pbPod = pod > bean ? mach / ((pod - bean) * perM) : Infinity;
      [[pbCafe, lines[0], '1'], [pbPod, lines[1], '2']].forEach(([m, l, n]) => { if (m <= M) b += S.badge(x(m), y(l.f(m)), n, 'f-acc'); });
      // end labels
      const ends = lines.map((l) => ({ l, y: y(l.f(M)) }));
      ends.sort((a, c) => a.y - c.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
      if (!compact) ends.forEach((e) => { b += S.text(W - pr + 8, e.y + 4, `${e.l.name} ${kfmt(e.l.f(M))}`, 'sm b ' + e.l.cls); });
      else { let lx = pl; lines.forEach((l) => { b += S.rect(lx, pt + ch + 28, 10, 10, 'f-' + l.cls, 2) + S.text(lx + 14, pt + ch + 37, l.name, 'sm ink'); lx += l.name.length * 6.6 + 30; }); }
      const H = pt + ch + (compact ? 46 : 28);
      fig.innerHTML = S.wrap(W, H, `Three years of coffee: café ${kfmt(lines[0].f(M))}, pods ${kfmt(lines[1].f(M))}, machine and beans ${kfmt(lines[2].f(M))}`, b);
      const yr = (p) => p * d * 365;
      setT(id + '-ca', usd0(yr(cafe)), 'dn'); setT(id + '-pa', usd0(yr(pod)), 'acc'); setT(id + '-ea', usd0(yr(bean)), 'up');
      const mo = (m) => (!isFinite(m) ? 'never' : m < 1 ? 'under a month' : m < 24 ? Math.round(m) + ' months' : trim(m / 12, 1) + ' years');
      setT(id + '-pb1', mo(pbCafe)); setT(id + '-pb2', mo(pbPod));
      const save = yr(cafe) - yr(bean), savePod = yr(pod) - yr(bean), r = st.n(id + '-r') / 100;
      const machGrown = mach * Math.pow(1 + r / 12, 360);
      const iv1 = fvMonthly(save, 30, r) - machGrown, iv2 = fvMonthly(savePod, 30, r) - machGrown;
      setT(id + '-iv1', kfmt(iv1), iv1 >= 0 ? 'up' : 'dn'); setT(id + '-iv2', kfmt(iv2), iv2 >= 0 ? 'up' : 'dn');
      setMsg(id + '-msg', 'up', 'Café → home', `Making ${d} coffee${d > 1 ? 's' : ''} a day at home instead of buying them keeps about ${usd0(save)} a year, and a ${usd0(mach)} setup pays for itself in ${mo(pbCafe)} (badge 1). Switching from pods to beans saves less, ${usd0(savePod)} a year, so the machine takes ${mo(pbPod)} (badge 2). Invested monthly at ${trim(r * 100, 1)}% for 30 years, and after subtracting what the ${usd0(mach)} would have grown to (${kfmt(machGrown)}), the café switch is worth about ${kfmt(iv1)} and the pod switch about ${kfmt(iv2)}.`);
      $id(id + '-note').textContent = `Example prices. Assumes you already own a pod machine, and ignores repairs, descaling and electricity. Invested values use the ${trim(r * 100, 1)}% return from the habits view, compounded monthly, before taxes and inflation; they subtract what the machine money would have grown to. Machine prices range from a few hundred dollars to several thousand.`;
    }
    const draw = ui.responsive(fig, (W) => { if (st.seg(id + '-v') === 'cof') drawCof(W); else drawHab(W); });
  };

  /* ===================================================================== */
  /* 4. cashParking: size the emergency fund, compare after-tax yields        */
  /* ===================================================================== */
  SML.widgets.cashParking = function (root, opts) {
    opts = opts || {};
    root.classList.add('wmo');
    const id = SML.uid('cp');
    const ACCTS = [
      { k: 'bank', name: 'Average bank savings', short: 'Average savings', tag: 'FDIC-insured · instant', min: 0, max: 2, step: 0.01, def: RATES.bank },
      { k: 'hysa', name: 'High-yield savings', short: 'High-yield savings', tag: 'FDIC-insured · 1-2 days', min: 0, max: 6, step: 0.01, def: RATES.hysa },
      { k: 'vmfxx', name: 'Federal money market (VMFXX)', short: 'VMFXX money market', tag: 'not FDIC, very low risk · next day', min: 0, max: 6, step: 0.01, def: RATES.vmfxx },
      { k: 'vusxx', name: 'Treasury money market (VUSXX)', short: 'VUSXX Treasury fund', tag: 'not FDIC, Treasuries · next day', min: 0, max: 6, step: 0.01, def: RATES.vusxx },
      { k: 'tbill', name: '3-month Treasury bills', short: '3-month T-bills', tag: 'US government · sell any trading day at a broker', min: 0, max: 6, step: 0.01, def: RATES.tbill },
    ];
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Your situation</span>${ui.seg(id + '-j', [{ v: 3, label: 'Two steady incomes' }, { v: 6, label: 'One income' }, { v: 9, label: 'Self-employed' }, { v: 12, label: 'Near retirement' }], 6, 'Situation')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-x', label: 'Must-pay bills a month', min: 1000, max: 15000, step: 100, value: opts.monthly || 4000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-m', label: 'Months of cushion', min: 1, max: 12, step: 1, value: 6, fmt: (v) => v + (v === 1 ? ' month' : ' months') })}
        <div class="ctl"><span class="ctl-lab">Federal tax bracket</span>${ui.seg(id + '-f', [10, 12, 22, 24, 32, 35, 37].map((v) => ({ v, label: v + '%' })), 22, 'Federal bracket')}</div>
        ${ui.slider({ id: id + '-s', label: 'State income tax rate', min: 0, max: 13.3, step: 0.1, value: 5, fmt: (v) => trim(v, 1) + '%' })}
        <details class="wmo-rates wmo-full"><summary>Edit the interest rates (October 2026 defaults)</summary><div class="wmo-grid">
          ${ACCTS.map((a) => ui.slider({ id: `${id}-r-${a.k}`, label: a.name, min: a.min, max: a.max, step: a.step, value: a.def, fmt: (v) => trim(v, 2) + '%' })).join('')}
        </div></details>
      </div>
      <div class="wg-read">${ui.stat('Emergency fund target', id + '-t', 'big')}${ui.stat('Best after tax', id + '-b', 'hl')}${ui.stat('Interest a year there', id + '-i')}${ui.stat('vs average savings', id + '-d')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">After-tax yield = rate × (1 − federal rate − state rate × the share that is state-taxable). Treasury interest is free of state and local income tax; bank interest is not. For VMFXX, about ${Math.round(RATES.vmfxxGov * 100)}% of 2025 income came from US government obligations, so that share is usually free of state tax (California, New York and Connecticut only allow it when the fund holds at least 50% in them). VUSXX was 100%. Yields as of October 19-21, 2026; they change often.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => { const sg = segOf(e); if (sg && sg.id === id + '-j') st.set(id + '-m', Number(st.seg(id + '-j'))); draw(); });
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480;
      const mon = st.n(id + '-x'), m = st.n(id + '-m'), fed = Number(st.seg(id + '-f')) / 100, stt = st.n(id + '-s') / 100;
      const fund = mon * m;
      const taxedShare = { bank: 1, hysa: 1, vmfxx: 1 - RATES.vmfxxGov, vusxx: 1 - RATES.vusxxGov, tbill: 0 };
      const rows = ACCTS.map((a) => { const y = st.n(`${id}-r-${a.k}`); const at = y * (1 - fed - stt * taxedShare[a.k]); return { a, y, at, inc: (fund * at) / 100 }; });
      const best = rows.slice().sort((p, q) => q.at - p.at)[0];
      // blocks
      let b = S.text(16, 22, `${m} month${m > 1 ? 's' : ''} × ${usd0(mon)} = ${usd0(fund)}`, 'lg ink b');
      const gap = compact ? 4 : 6, bw = (W - 32 - gap * 11) / 12, by = 36, bh = compact ? 30 : 34;
      for (let i = 0; i < 12; i++) {
        const xx = 16 + i * (bw + gap);
        b += S.rect(xx, by, bw, bh, i < m ? 'f-up-t s-up w15' : 'nf s-line dash2', 4);
        if (!compact) b += S.text(xx + bw / 2, by + bh / 2 + 4, i + 1, 'sm mono ' + (i < m ? 'up b' : 'mut'), 'middle');
      }
      // bars
      const top = by + bh + 34, rowH = compact ? 56 : 44, lw = compact ? 0 : 250, rw = compact ? 0 : 150;
      const x0 = 16 + lw, x1 = W - 16 - rw, xmax = Math.max(...rows.map((r) => r.y), 1) * 1.08;
      const X = SML.lin(0, xmax, x0, x1);
      b += S.text(16, top - 12, 'Yield before tax (outline) and after your taxes (fill)', 'sm mut');
      rows.forEach((r, i) => {
        const y = top + i * rowH, isB = r === best;
        const by2 = compact ? y + 30 : y + 6, bh2 = compact ? 12 : 16;
        if (compact) {
          b += S.text(16, y + 12, r.a.short, 'sm b ' + (isB ? 'up' : 'ink')) + S.text(W - 16, y + 12, `${pct(r.at, 2)} → ${usd0(r.inc)}/yr`, 'sm mono b ' + (isB ? 'up' : 'ink'), 'end');
          b += S.text(16, y + 25, r.a.tag, 'xs mut');
        } else {
          b += S.text(16, by2 + 4, r.a.name, 'md b ' + (isB ? 'up' : 'ink')) + S.text(16, by2 + 19, r.a.tag, 'xs mut');
          b += S.text(W - 16, by2 + 4, `${pct(r.at, 2)} after tax`, 'md mono b ' + (isB ? 'up' : 'ink'), 'end') + S.text(W - 16, by2 + 19, `${usd0(r.inc)} a year`, 'sm mono', 'end');
        }
        b += S.rect(x0, by2, Math.max(1, X(r.y) - x0), bh2, 'nf s-mut w1', 2);
        b += S.rect(x0, by2, Math.max(r.at > 0 ? 1 : 0, X(r.at) - x0), bh2, isB ? 'f-up' : 'f-info', 2);
        if (!compact) b += S.text(X(r.y) + 6, by2 + 12, pct(r.y, 2), 'xs mono');
      });
      const H = top + rows.length * rowH + 4;
      fig.innerHTML = S.wrap(W, H, `Emergency fund of ${usd0(fund)}; best after-tax home is ${best.a.name} at ${pct(best.at, 2)}`, b);
      const bank = rows[0];
      setT(id + '-t', usd0(fund)); setT(id + '-b', pct(best.at, 2)); setT(id + '-i', usd0(best.inc), 'up'); setT(id + '-d', '+' + usd0(best.inc - bank.inc), 'up');
      const hy = rows[1];
      setMsg(id + '-msg', 'up', best.a.k === 'hysa' ? 'Savings wins' : 'Treasuries win', `In a ${Math.round(fed * 100)}% federal bracket with ${trim(stt * 100, 1)}% state tax, ${best.a.name} keeps the most: about ${usd0(best.inc)} a year on ${usd0(fund)}, ${usd0(best.inc - bank.inc)} more than an average savings account. ${best.a.k !== 'hysa' ? `A high-yield savings account (${usd0(hy.inc)} a year) is close and simpler, and it is FDIC-insured.` : ''} Keep a few weeks of bills in checking so you never have to sell in a hurry.`);
    });
  };

  /* ===================================================================== */
  /* 5. netWorth: own vs owe, and tracking it over time                        */
  /* ===================================================================== */
  const NW_ITEMS = {
    own: [
      { k: 'cash', name: 'Cash and savings', cls: 'f-info', max: 300000, step: 500 },
      { k: 'ret', name: 'Retirement accounts', cls: 'f-up', max: 3000000, step: 5000 },
      { k: 'brk', name: 'Brokerage investments', cls: 'f-vio', max: 3000000, step: 5000 },
      { k: 'home', name: 'Home value', cls: 'f-acc', max: 2000000, step: 5000 },
      { k: 'car', name: 'Cars', cls: 'f-shade2', max: 150000, step: 500 },
    ],
    owe: [
      { k: 'mort', name: 'Mortgage', cls: 'f-dn', max: 1500000, step: 5000 },
      { k: 'auto', name: 'Car loan', cls: 'f-dn-t s-dn w1', max: 100000, step: 500 },
      { k: 'stud', name: 'Student loans', cls: 'f-dn o50', max: 250000, step: 500 },
      { k: 'card', name: 'Credit cards', cls: 'f-dn-t s-dn dash2 w15', max: 60000, step: 100 },
    ],
  };
  const NW_P = {
    grad: { cash: 4000, ret: 6000, brk: 0, home: 0, car: 14000, mort: 0, auto: 9000, stud: 32000, card: 2500, save: 600 },
    mid: { cash: 25000, ret: 180000, brk: 40000, home: 450000, car: 22000, mort: 310000, auto: 0, stud: 0, card: 0, save: 2000 },
    fi: { cash: 40000, ret: 900000, brk: 550000, home: 600000, car: 25000, mort: 120000, auto: 0, stud: 0, card: 0, save: 4500 },
  };
  SML.widgets.netWorth = function (root, opts) {
    opts = opts || {};
    root.classList.add('wmo');
    const id = SML.uid('nw');
    let seed = 7;
    const p0 = NW_P.mid;
    const sl = (it) => ui.slider({ id: `${id}-${it.k}`, label: it.name, min: 0, max: it.max, step: it.step, value: p0[it.k], fmt: (v) => kfmt(v) });
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-p', [{ v: 'grad', label: 'Starting out' }, { v: 'mid', label: 'Mid-career' }, { v: 'fi', label: 'Close to FI' }], 'mid', 'Example')}<span class="grow"></span>${ui.seg(id + '-v', [{ v: 'snap', label: 'Today' }, { v: 'time', label: 'Next 10 years' }], 'snap', 'View')}</div>
      <div class="wg-fig"></div>
      <div class="wmo-leg" id="${id}-leg"></div>
      <div class="wg-ctrl">
        <p class="wmo-sub wmo-full">What you own</p>${NW_ITEMS.own.map(sl).join('')}
        <p class="wmo-sub wmo-full">What you owe</p>${NW_ITEMS.owe.map(sl).join('')}
        ${ui.slider({ id: id + '-sv', label: 'Saved and invested a month', min: 0, max: 10000, step: 100, value: p0.save, fmt: 'usd0' })}
      </div>
      <div class="wg-read">${ui.stat('You own', id + '-a')}${ui.stat('You owe', id + '-o')}${ui.stat('Net worth', id + '-n', 'hl big')}${ui.stat('Liquid (cash + brokerage)', id + '-l')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions" id="${id}-act" hidden><button type="button" class="btn btn-g sm" id="${id}-rs">New market path</button><span class="note">Each path is a different made-up sequence of market years.</span></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      const sg = segOf(e);
      if (sg && sg.id === id + '-p') { const p = NW_P[st.seg(id + '-p')]; NW_ITEMS.own.concat(NW_ITEMS.owe).forEach((it) => st.set(`${id}-${it.k}`, p[it.k])); st.set(id + '-sv', p.save); }
      draw();
    });
    $id(id + '-rs').addEventListener('click', () => { seed = (seed * 7 + 13) % 997 || 3; draw(); });
    const val = (k) => st.n(`${id}-${k}`);
    function project() {
      const rnd = SML.rng(seed), years = 10, out = [];
      let cash = val('cash'), inv = val('ret') + val('brk'), home = val('home'), car = val('car'), mort = val('mort'), auto = val('auto'), stud = val('stud'), card = val('card');
      const save = st.n(id + '-sv') * 12, auto0 = auto, stud0 = stud;
      for (let y = 0; y <= years; y++) {
        const own = cash + inv + home + car, owe = mort + auto + stud + card;
        out.push({ y, own, owe, nw: own - owe, inv });
        const ret = 0.06 + 0.15 * rnd.gauss() * 0.9;
        let add = save; const payCard = Math.min(card, add); card -= payCard; add -= payCard;
        inv = Math.max(0, inv * (1 + SML.clamp(ret, -0.38, 0.4)) + add);
        home *= 1.03; car *= 0.85; mort = Math.max(0, mort * 0.97 - 2000);
        auto = Math.max(0, auto - auto0 / 4); stud = Math.max(0, stud - stud0 / 10);
      }
      return out;
    }
    const draw = ui.responsive(fig, (W) => {
      const compact = W < 480, view = st.seg(id + '-v');
      const own = NW_ITEMS.own.map((it) => ({ it, v: val(it.k) })), owe = NW_ITEMS.owe.map((it) => ({ it, v: val(it.k) }));
      const A = own.reduce((a, q) => a + q.v, 0), D = owe.reduce((a, q) => a + q.v, 0), N = A - D, L = val('cash') + val('brk');
      $id(id + '-act').hidden = view !== 'time';
      let b = '', H;
      if (view !== 'time') {
        const top = 58, ch = compact ? 220 : 250, base = top + ch;
        const vmax = Math.max(A, D, Math.abs(N), 1) * 1.04, Y = SML.lin(0, vmax, base, top);
        const cols = [['What you own', own, A], ['What you owe', owe, D]];
        const slot = (W - 32) / 3, cw = Math.min(compact ? 66 : 110, slot * 0.62);
        b += S.text(16, 20, 'A snapshot of everything', 'md ink b');
        cols.forEach(([lab, list, tot], i) => {
          const cx = 16 + slot * (i + 0.5); let acc = 0;
          list.forEach((q) => { if (q.v <= 0) return; const y1 = Y(acc), y2 = Y(acc + q.v); b += S.rect(cx - cw / 2, y2, cw, y1 - y2, q.it.cls); if (y1 - y2 > 18 && !compact) b += S.text(cx, (y1 + y2) / 2 + 4, kfmt(q.v), 'sm mono b onacc', 'middle'); acc += q.v; });
          if (!tot) b += S.rect(cx - cw / 2, base - 2, cw, 2, 'f-line');
          b += S.text(cx, Y(tot) - 8, kfmt(tot), (compact ? 'md' : 'lg') + ' mono b ' + (i ? 'dn' : 'ink'), 'middle');
          b += S.text(cx, base + 18, compact ? (i ? 'Owe' : 'Own') : lab, 'sm ink b', 'middle');
        });
        const cx = 16 + slot * 2.5, yN = Y(Math.abs(N));
        b += S.rect(cx - cw / 2, yN, cw, base - yN, N >= 0 ? 'f-up' : 'f-dn', 3);
        b += S.text(cx, yN - 8, kfmt(N), (compact ? 'md' : 'lg') + ' mono b ' + (N >= 0 ? 'up' : 'dn'), 'middle');
        b += S.text(cx, base + 18, N >= 0 ? 'Net worth' : 'Net worth (negative)', 'sm b ' + (N >= 0 ? 'up' : 'dn'), 'middle');
        if (!compact) { b += S.text(16 + slot, base - 24, '−', 'xxl mut', 'middle'); b += S.text(16 + slot * 2, base - 24, '=', 'xxl mut', 'middle'); }
        b += S.line(16, base + 0.5, W - 16, base + 0.5, 's-line');
        H = base + 28;
        fig.innerHTML = S.wrap(W, H, `You own ${kfmt(A)} and owe ${kfmt(D)}: net worth ${kfmt(N)}`, b);
      } else {
        const pts = project();
        const pl = compact ? 46 : 58, pr = compact ? 16 : 96, top = 34, ch = compact ? 220 : 250, base = top + ch;
        const lo = Math.min(0, ...pts.map((p) => p.nw)), hi = Math.max(...pts.map((p) => Math.max(p.own, p.nw))) * 1.05;
        const x = SML.lin(0, 10, pl, W - pr), y = SML.lin(lo, hi, base, top);
        b += S.text(16, 20, compact ? 'Net worth by year (made-up path)' : 'Net worth year by year (one made-up market path)', 'md ink b');
        SML.ticks(lo, hi, 4).forEach((v) => { b += S.line(pl, y(v), W - pr, y(v), v === 0 ? 's-mut' : 's-grid') + S.text(pl - 6, y(v) + 4, kfmt(v), 'xs mono', 'end'); });
        [0, 2, 4, 6, 8, 10].forEach((v) => { b += S.text(x(v), base + 16, v === 0 ? 'now' : '+' + v + 'y', 'xs mono', 'middle'); });
        b += S.area(pts.map((p) => [x(p.y), y(Math.max(p.nw, lo))]), y(Math.max(0, lo)), 'f-up-t');
        b += S.poly(pts.map((p) => [x(p.y), y(p.own)]), 's-info w15') + S.poly(pts.map((p) => [x(p.y), y(p.owe)]), 's-dn w2 dash2') + S.poly(pts.map((p) => [x(p.y), y(p.nw)]), 's-up w3');
        pts.forEach((p, i) => { if (i && p.nw < pts[i - 1].nw) b += S.circle(x(p.y), y(p.nw), 5, 'f-dn'); else b += S.circle(x(p.y), y(p.nw), 3.5, 'f-up'); });
        const last = pts[pts.length - 1];
        if (!compact) { const ls = [{ t: 'Own ' + kfmt(last.own), y: y(last.own), c: 'info' }, { t: 'Net ' + kfmt(last.nw), y: y(last.nw), c: 'up' }, { t: 'Owe ' + kfmt(last.owe), y: y(last.owe), c: 'dn' }]; ls.sort((a, c) => a.y - c.y); for (let i = 1; i < ls.length; i++) if (ls[i].y - ls[i - 1].y < 15) ls[i].y = ls[i - 1].y + 15; ls.forEach((l) => { b += S.text(W - pr + 8, l.y + 4, l.t, 'sm b ' + l.c); }); }
        else { b += S.text(x(10) - 4, y(last.nw) + 22, kfmt(last.nw), 'md mono b up', 'end'); }
        H = base + 26;
        fig.innerHTML = S.wrap(W, H, `Net worth projected from ${kfmt(pts[0].nw)} to ${kfmt(last.nw)} over 10 years`, b);
        const dips = pts.filter((p, i) => i && p.nw < pts[i - 1].nw).length;
        setMsg(id + '-msg', 'info', dips ? dips + ' down year' + (dips > 1 ? 's' : '') : 'Up every year', `${dips ? 'Red dots are years when net worth fell, usually because markets dropped. ' : ''}The trend is what matters: from ${kfmt(pts[0].nw)} to about ${kfmt(last.nw)} with ${usd0(st.n(id + '-sv'))} saved a month. Check it every month or quarter, not every day.`);
        $id(id + '-note').textContent = 'Simplified: investments return 6% a year on average with random swings, the home gains 3% a year, cars lose 15% a year, loans shrink on a fixed schedule and card debt is paid off first. Real results will differ.';
      }
      // legend + stats
      $id(id + '-leg').innerHTML = own.map((q) => `<div><span><i class="${q.it.cls.replace(/\bf-/g, 'wmo-f-')}"></i>${q.it.name}</span><b>${kfmt(q.v)}</b></div>`).join('') + owe.map((q) => `<div><span><i class="${q.it.cls.replace(/\bf-/g, 'wmo-f-')}"></i>${q.it.name}</span><b class="${q.v ? 'dnv' : ''}">${q.v ? F.minus + kfmt(q.v) : kfmt(0)}</b></div>`).join('');
      setT(id + '-a', kfmt(A)); setT(id + '-o', kfmt(D), D ? 'dn' : ''); setT(id + '-n', kfmt(N), N >= 0 ? 'up' : 'dn'); setT(id + '-l', kfmt(L));
      if (view !== 'time') {
        const card = val('card'), home = val('home');
        let m;
        if (card > 0) m = ['dn', 'Card debt first', `Once you have a small starter cushion and the full 401(k) match, pay off the ${kfmt(card)} on credit cards before anything else. At the 20%-plus rates most cards charge, that payoff beats what investments are likely to earn.`];
        else if (N < 0) m = ['acc', 'Normal at the start', 'A negative net worth is common when student loans are new. What matters is the direction: up a little every quarter.'];
        else if (A && home / A > 0.6) m = ['acc', 'House-heavy', `Your home is ${Math.round((home / A) * 100)}% of what you own. It counts, but you cannot spend it without selling or borrowing, so watch your liquid net worth too (${kfmt(L)}).`];
        else m = ['up', 'Net worth ' + kfmt(N), `You own ${kfmt(A)} and owe ${kfmt(D)}. ${kfmt(L)} of it is liquid. Write the number down on the same day each month or quarter and watch the trend.`];
        setMsg(id + '-msg', m[0], m[1], m[2]);
        $id(id + '-note').textContent = 'Use what things would sell for today, not what you paid. Count the car at resale value. Retirement accounts will be taxed or penalized on some withdrawals, so they are worth a bit less than their balance.';
      }
    });
  };
  SML.css(`.wmo-leg .wmo-f-info{background:var(--info)}.wmo-leg .wmo-f-up{background:var(--up)}.wmo-leg .wmo-f-vio{background:var(--violet)}.wmo-leg .wmo-f-acc{background:var(--accent)}.wmo-leg .wmo-f-shade2{background:var(--shade2)}.wmo-leg .wmo-f-dn{background:var(--down)}.wmo-leg .wmo-f-dn-t{background:var(--down-t);box-shadow:inset 0 0 0 1px var(--down)}.wmo-leg .o50{opacity:.5}`);

  /* ===================================================================== */
  /* Lessons                                                                 */
  /* ===================================================================== */
  const SRC = {
    cfpb: { t: 'CFPB: An essential guide to building an emergency fund', u: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/' },
    fdic: { t: 'FDIC: Understanding deposit insurance', u: 'https://www.fdic.gov/resources/deposit-insurance/understanding-deposit-insurance' },
    bankrate: { t: 'Bankrate: Best high-yield savings accounts (rates as of October 21, 2026)', u: 'https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts/' },
    vgusgo: { t: 'Vanguard: 2025 income from US government obligations, by fund (PDF)', u: 'https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/usgo-012026.pdf' },
    tsy: { t: 'US Treasury: Daily Treasury par yield curve rates, October 2026', u: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202610' },
    g19: { t: 'Federal Reserve G.19 Consumer Credit: credit card interest rates', u: 'https://www.federalreserve.gov/releases/g19/current/default.htm' },
    cpi: { t: 'BLS: Consumer Price Index, September 2026 (PDF)', u: 'https://www.dol.gov/newsroom/economicdata/cpi_10142026.pdf' },
  };

  SML.lessons.push({
    id: 'l-budget', course: 'money', order: 1, title: 'Build a monthly budget', mins: 8, level: 'Beginner',
    summary: 'Split your pay into needs, wants and saving, and see why saving sets your timeline.',
    idea: 'Early retirement starts with a monthly budget. The share of your pay you save decides how many years you have to work.',
    widget: 'budgetBuilder',
    try: 'Pick a household or drag the two handles, and watch the years to financial independence change.',
    body: [
      '<h3>Start from take-home pay</h3><p>Budget from the money that actually lands in your checking account, after taxes, health insurance and any 401(k) deduction. If part of your paycheck already goes into a 401(k), add it back to both your pay and your saving so your savings rate is honest.</p>',
      '<h3>Needs, wants and saving</h3><ul><li><b>Needs</b> are bills you must pay to live and work: rent or mortgage, groceries, utilities, insurance, transport and minimum debt payments.</li><li><b>Wants</b> make life better but could stop tomorrow: eating out, travel, shopping, hobbies, most subscriptions.</li><li><b>Saving</b> is money for your future self: retirement accounts, the emergency fund, investing and paying off debt faster than the minimum.</li></ul><p>The <b>50/30/20 rule</b> is a popular starting point: about half for needs, 30% for wants and 20% for saving. People who retire early often save 40% to 60%.</p>',
      '<h3>Pay yourself first</h3><p>Set an automatic transfer to savings and investments for the day your pay arrives, then spend what is left. Saving whatever remains at the end of the month rarely works, because there is rarely anything left. Start small if you need to and raise it by 1 percentage point a month, or save half of every raise.</p>',
      '<h3>Why the savings rate sets your retirement date</h3><p>Saving more does two things at once: the pile grows faster, and the lifestyle it must pay for gets smaller. With the assumptions in the tool (start from zero, 5% a year after inflation, live on 4% of savings), the years of work look like this:</p><ul><li>Save 10% of take-home pay: about 51 years.</li><li>Save 20%: about 37 years.</li><li>Save 30%: about 28 years.</li><li>Save 50%: about 17 years.</li><li>Save 65%: about 10 years.</li></ul><p>Your income matters less than you would think. Two people with the same savings rate need about the same number of years. The FIRE track goes deeper in <a href="#l-savings-rate">Savings rate is the lever</a>.</p>',
      '<h3>Pick a method you will keep</h3><ul><li><b>50/30/20:</b> three buckets, little tracking. Good for most people.</li><li><b>Zero-based:</b> every dollar gets a job before the month starts. More work, more control.</li><li><b>Pay yourself first only:</b> automate saving, then spend the rest freely. Simple and surprisingly effective.</li><li><b>Envelopes:</b> fixed cash or digital envelopes for categories that tend to run over, such as dining out.</li></ul>',
      '<h3>Fix the big three first</h3><p>Housing, transport and food are most of a typical budget. One cheaper apartment or one paid-off car usually does more than a year of skipped coffees. Small habits still add up, though: see <a href="#l-latte">Small habits, big numbers</a>, and track it all in <a href="#l-track-spending">Track your spending</a>.</p>',
    ],
    example: {
      title: 'A couple’s $9,000 month',
      intro: 'Take-home pay is $9,000 a month after taxes and insurance. Here is where it goes, and one round of changes.',
      steps: [
        'Needs: rent $2,600, groceries $900, utilities and phone $350, car payment and gas $700, insurance and medical $350, student loan minimums $300. Total $5,200, or 58% of take-home pay.',
        'Wants: eating out, travel, shopping and subscriptions take $2,500, or 28%.',
        'What is left for saving is $1,300 a month, a 14% savings rate. At that pace, financial independence is about 44 years away.',
        'They move $600 out of wants (fewer takeout nights, one trip a year instead of two) and save $400 on needs by switching car insurance and phone plans. Saving rises to $2,300 a month.',
        'They automate it: $2,300 moves to savings and investments the day pay arrives, and the rest in checking is theirs to spend.',
      ],
      result: 'Saving went from 14% to 26% of take-home pay, which cuts the road to financial independence from about 44 years to about 31.',
    },
    mistakes: [
      'Budgeting from gross pay instead of take-home pay, so the plan never matches what reaches the bank account.',
      'Saving whatever is left at the end of the month. There is usually nothing left. Automate saving first.',
      'Making the budget so tight it breaks in week two. Leave room for fun and for irregular costs such as gifts and car repairs.',
      'Letting spending rise with every raise (lifestyle creep), so the savings rate never moves.',
    ],
    points: [
      'Budget from take-home pay in three buckets: needs, wants and saving.',
      '50/30/20 is a starting point. Early retirees often save 40% to 60%.',
      'Your savings rate, more than your income, sets how many years you work.',
      'Pay yourself first: automate saving on payday.',
      'Fix housing, transport and food before small habits.',
    ],
    terms: ['Budget', '50/30/20 rule', 'Pay yourself first', 'Savings rate', 'Lifestyle creep'],
    glossary: [{ t: 'Zero-based budget', d: 'A budget where every dollar of income is assigned a job (a bill, a want or saving) before the month starts.' }],
    quiz: { q: 'Two friends take home the same pay. One saves 10% of it and the other saves 50%. How do their timelines to financial independence compare?', options: ['About the same, since they earn the same', 'The 50% saver needs about a third as many years', 'The 10% saver gets there first'], answer: 1, why: 'Under this lesson’s assumptions, saving 10% takes about 51 years and saving 50% about 17. Saving more grows the pile and shrinks the lifestyle it must pay for.' },
  });

  SML.lessons.push({
    id: 'l-track-spending', course: 'money', order: 2, title: 'Track your spending', mins: 7, level: 'Beginner',
    summary: 'Bank categories, an app or a spreadsheet, plus a weekly 10-minute review.',
    idea: 'Tracking is not about guilt. A short weekly look catches overspending while there is still time to fix the month.',
    widget: 'spendTracker',
    try: 'Play the month without the review, then turn on the weekly review and play it again.',
    body: [
      '<h3>Three ways to track</h3><ul><li><b>Your bank and card categories.</b> Free and automatic. Fix the ones that are wrong: a big-box store can be groceries one week and a TV the next.</li><li><b>A budgeting app</b> that links all your accounts. Many charge a yearly fee; check what they do with your data before you connect anything.</li><li><b>A spreadsheet.</b> The most control and the most typing. Our <a href="#sheets">spreadsheet templates</a> are a starting point.</li></ul><p>Using one or two cards for everyday spending makes tracking much easier, as long as you pay them in full every month (see <a href="#l-card-debt">Credit card debt</a>).</p>',
      '<h3>The weekly 10-minute review</h3><ul><li>Same day every week, for example Sunday morning.</li><li>Open your accounts and look at each category against where it should be by now. By the end of week 2, about half the monthly budget is normal.</li><li>Scan for charges you do not recognize or did not use.</li><li>Pick one small change for the rest of the month, such as cooking twice more or pausing online shopping.</li></ul>',
      '<h3>Sinking funds for irregular costs</h3><p>Car repairs, holiday gifts, yearly insurance bills and vacations are not emergencies; they are bills on a schedule. Divide each one by 12 and save that much every month in its own bucket. Gifts that cost $1,200 a year become $100 a month, and December stops wrecking the budget.</p>',
      '<h3>Hunt the leaks</h3><p>List every recurring charge: streaming, apps, cloud storage, gym, memberships, warranties. Cancel anything you did not use in the last 30 days. Set a reminder before free trials end. Leaks are small, but they repeat every month without you deciding anything.</p>',
      '<h3>Watch for lifestyle creep</h3><p>When income rises, spending quietly rises to match. Decide in advance what happens to raises and bonuses, for example save half and enjoy half. That one rule keeps your savings rate climbing as your career grows.</p>',
    ],
    example: {
      title: 'One review saves a month',
      intro: 'The household in the tool budgets $1,790 a month for flexible spending across six categories.',
      steps: [
        'After two weeks they have spent $1,069, against $895 if spending were even. Dining is $55 over plan and shopping $75 over.',
        'The 10-minute review also finds a $35 a month gym membership nobody used.',
        'For weeks 3 and 4 they skip two lunches out, one online order, one bar tab, one dinner out and one round of drinks: $240 in total.',
        'The month ends at $1,777, $13 under budget, instead of $2,017, $227 over.',
        'Cancelling the gym saves another $35 a month, $420 a year.',
      ],
      result: 'Ten minutes a week turned a $227 overspend into a month on budget and found $420 a year of pure waste.',
    },
    mistakes: [
      'Tracking hard for a month, feeling bad and quitting. Make it a 10-minute weekly habit, not a judgment.',
      'Only looking at the month when it is over, when nothing can be changed.',
      'Forgetting irregular costs, so a car repair or a birthday “breaks” the budget. Use sinking funds.',
      'Trusting automatic categories without checking them.',
    ],
    points: [
      'Pick the simplest tool you will actually keep using.',
      'Review weekly and compare each category with where it should be by now.',
      'Unused subscriptions are pure leak: cancel them.',
      'Turn irregular costs into monthly sinking funds.',
      'Decide in advance how much of every raise you will save.',
    ],
    terms: ['Budget', 'Sinking fund', 'Lifestyle creep', 'Savings rate'],
    quiz: { q: 'It is day 14 of the month and you have already spent 70% of your dining budget. What does the weekly review tell you?', options: ['Nothing yet; wait for the month to end', 'You are ahead of pace, so ease off for the next two weeks', 'Move the extra into next month’s budget'], answer: 1, why: 'Halfway through the month you should be near 50%. Adjusting now is easy; at month end it is too late.' },
  });

  SML.lessons.push({
    id: 'l-latte', course: 'money', order: 3, title: 'Small habits, big numbers', mins: 7, level: 'Beginner',
    summary: 'Daily coffee, pods and takeout: the yearly cost, and what it could grow into.',
    idea: 'Small daily spending is easy to ignore. Priced by the year and invested for decades, it gets surprisingly big.',
    widget: 'habitCost',
    try: 'Count your habits and set your own prices, then switch to the coffee view to compare café, pods and an espresso machine.',
    body: [
      '<h3>Price it by the year</h3><p>A $6.25 latte five workdays a week is $6.25 × 5 × 52 = <b>$1,625 a year</b>. Two coffee pods a day at $1.10 each is about $800 a year. A $15 takeout lunch three times a week is $2,340. None of these feels big on the day you buy it.</p>',
      '<h3>Then price it in future dollars</h3><p>Money you do not spend can be invested. $1,625 a year, invested monthly at 7% a year, grows to about $23,000 in 10 years, $71,000 in 20 and $165,000 in 30. That is the real price of the habit: its <b>opportunity cost</b>. The 7% is a long-run assumption for a stock index fund, not a promise.</p>',
      '<h3>Café, pods or an espresso machine?</h3><ul><li><b>Café to home</b> is the big win. A café latte costs $5 to $7; the same drink at home costs well under $1.</li><li><b>Pods to whole beans</b> saves less. Pods with milk run about $1 to $1.50 a drink; fresh beans and milk run about $0.50 to $1.</li><li>A good espresso machine and grinder costs from a few hundred dollars to several thousand. Against café drinks it pays for itself in months; against pods it can take years.</li></ul><p>The pod switch still adds up over time. With the example prices below, it saves about $400 a year. Invested monthly at 7% for 30 years, that is about $40,800, or about $33,500 after subtracting what the $900 spent on the machine would have grown to (about $7,300). The café switch is worth about $400,000 by the same math. So buy the machine if you love good coffee and will use it every day.</p>',
      '<h3>Other habits worth pricing</h3><ul><li>Delivery app fees, service fees and tips on top of the food.</li><li>Streaming and app subscriptions you forgot you had.</li><li>Energy drinks, bottled water and convenience-store snacks.</li><li>Bank fees and late fees, which buy nothing at all.</li></ul>',
      '<h3>Choose, do not just cut</h3><p>Cutting every small joy usually fails within a month. Keep the habits you truly value and drop the ones you barely notice. And keep perspective: housing, cars and food matter more than any coffee (see <a href="#l-budget">Build a monthly budget</a>).</p>',
    ],
    example: {
      title: 'Two coffees a day, three ways',
      intro: 'Example prices: café latte $6.25, pod drink with milk $1.30, home espresso $0.75 a drink, machine and grinder $900.',
      steps: [
        'Café: 2 drinks a day × $6.25 × 365 days = $4,562.50 a year.',
        'Pods: 2 × $1.30 × 365 = $949 a year, in a pod machine you already own.',
        'Machine and beans: $900 once, then 2 × $0.75 × 365 = $547.50 a year.',
        'Café to machine saves $4,015 a year, so the $900 pays back in about 3 months. Pods to machine saves $401.50 a year, so it takes about 2.2 years.',
        'Invested monthly at 7% for 30 years: the café saving ($4,015 a year) grows to about $408,000, and the pod saving ($401.50 a year) to about $40,800. Subtract what the $900 machine money would have grown to, about $7,300, and they are worth about $401,000 and $33,500.',
      ],
      result: 'The machine is a good buy against café drinks and a modest one against pods. The real money is in the habit you change, not the gadget.',
    },
    mistakes: [
      'Cutting every small pleasure at once and giving up on the budget a month later. Cut what you do not value.',
      'Buying an expensive machine and still buying café drinks, so the machine is just one more cost.',
      'Obsessing over coffee while a car payment or rent eats most of the budget.',
      'Forgetting delivery fees and subscriptions; they repeat quietly every month.',
    ],
    points: [
      'Multiply small habits by a year: $6 a day is about $2,200 a year.',
      'Invested monthly at 7% for 30 years, every $1,000 a year grows to about $100,000.',
      'Café to home is the big saving; pods to beans is a small one.',
      'Keep the habits you love and drop the ones you do not notice.',
    ],
    terms: ['Opportunity cost', 'Compound interest', 'Budget', 'Lifestyle creep'],
    quiz: { q: 'You buy two $6 coffees every workday. About how much is that a year?', options: ['About $600', 'About $3,100', 'About $4,400'], answer: 1, why: '$12 a day × 5 workdays × 52 weeks = $3,120 a year.' },
  });

  SML.lessons.push({
    id: 'l-emergency', course: 'money', order: 4, title: 'Emergency fund and where to park cash', mins: 9, level: 'Beginner',
    summary: 'How many months to keep, and where cash earns the most after tax while staying safe.',
    idea: 'An emergency fund turns a job loss or a big repair into an inconvenience instead of debt. Keep it safe, quick to reach and earning interest.',
    widget: 'cashParking',
    try: 'Pick your situation, set your bills and tax rates, and see which account keeps the most interest after tax.',
    body: [
      '<h3>How big should it be?</h3><p>A common rule of thumb is <b>three to six months of must-pay bills</b>: rent or mortgage, food, insurance, utilities and minimum debt payments. Not your full spending, because in an emergency the extras stop. Keep more if you are self-employed, your household has one income, your pay is irregular or your job would be hard to replace. If you are starting from zero, a first goal of about $500 to $1,000 already covers many surprises.</p>',
      '<h3>What it is for</h3><p>Job loss, medical bills, a car or home repair you did not see coming. A vacation or holiday gifts are planned costs: save for them in a separate sinking fund (see <a href="#l-track-spending">Track your spending</a>). If you use the emergency fund, refilling it comes before new investing.</p>',
      '<h3>Where to keep it (October 2026 rates)</h3><ul><li><b>High-yield savings account:</b> about 3.9% to 4.3% at the top online banks, against a national average of about 0.64% for savings. FDIC-insured.</li><li><b>Money market funds</b> such as Vanguard’s VMFXX (7-day yield about 3.83%) and VUSXX (about 3.90%). They hold short-term government debt. Very low risk, but they are investments, not bank deposits, so they are not FDIC-insured. Selling gets you cash the next business day.</li><li><b>Treasury bills</b> (3-month T-bills about 4.26%): short loans to the US government. Buy them at a broker if they hold emergency money: there you can sell any trading day. Bills bought at TreasuryDirect must be held to maturity, or transferred to a broker after 45 days before you can sell them.</li></ul><p>Careful with names: a bank’s money market <i>deposit account</i> is FDIC-insured; a money market <i>fund</i> is not.</p>',
      '<h3>Compare yields after tax</h3><p>Bank interest is taxed by the IRS and your state. Interest from US Treasuries is taxed by the IRS but not by states. A government money market fund is partly state-tax-free: in 2025, 66.61% of VMFXX’s income and 100% of VUSXX’s came from US government obligations. California, New York and Connecticut only allow that exclusion when a fund holds at least 50% in such debt, which VMFXX reportedly met for 2025. You usually enter the exclusion yourself on your state return.</p>',
      '<h3>Safety, not growth</h3><p>Prices were up 3.7% over the year to September 2026. A 4% yield taxed at 22% to 30% does not quite keep up with that, and that is fine: the emergency fund is insurance. Money for goals more than a few years away belongs in investments (see <a href="#l-net-worth">Know your net worth</a> and the investing course).</p>',
      '<h3>Insurance limits</h3><p>FDIC insurance covers at least $250,000 per depositor, per ownership category, per insured bank. Money market funds and Treasuries held at a broker are not FDIC-insured; SIPC protects you if the broker fails, but never against market losses (see <a href="#l-broker">Choosing a broker</a>).</p>',
    ],
    example: {
      title: 'A $24,000 cushion',
      intro: 'One income, so six months. Federal bracket 22%, state income tax 5%. Rates as of October 2026.',
      steps: [
        'Must-pay bills are $4,000 a month, so the target is 6 × $4,000 = $24,000.',
        'In a savings account paying the 0.64% average, after 22% federal and 5% state tax, it earns about $112 a year.',
        'A high-yield savings account at 4.20% keeps 3.07% after tax: about $736 a year, still FDIC-insured.',
        '3-month Treasury bills at 4.26% skip state tax, so they keep 3.32%: about $797 a year.',
        'A practical split: one month of bills in checking or savings for speed, the rest in a high-yield account or T-bills held at a broker, which can be sold any trading day.',
      ],
      result: 'Same safety, about $600 to $700 more interest a year than an average savings account.',
    },
    mistakes: [
      'Keeping the emergency fund in stocks. Crashes and layoffs often arrive together.',
      'Leaving it for years in a savings account that pays almost nothing.',
      'Assuming a money market fund is FDIC-insured. A bank money market deposit account is; a fund is not.',
      'Spending it on a vacation, then meeting the next real emergency with a credit card.',
    ],
    points: [
      'Aim for three to six months of must-pay bills, more with one income or irregular pay.',
      'High-yield savings, Treasury money market funds and T-bills all pay far more than average savings.',
      'Compare yields after tax: Treasury interest skips state income tax.',
      'The fund is insurance, not an investment. Refill it before investing more.',
    ],
    terms: ['Emergency fund', 'HYSA', 'Money market fund', 'T-bill', 'FDIC insurance', 'APY'],
    quiz: { q: 'You live in a state with a high income tax. At the same yield, which usually keeps more interest after tax?', options: ['A high-yield savings account', 'Treasury bills or a Treasury money market fund', 'They always come out the same'], answer: 1, why: 'Interest from US Treasuries is free of state and local income tax; bank interest is taxed by your state.' },
    sources: [SRC.fdic, SRC.bankrate, SRC.vgusgo, SRC.tsy],
  });

  SML.lessons.push({
    id: 'l-net-worth', course: 'money', order: 5, title: 'Know your net worth', mins: 7, level: 'Beginner',
    summary: 'Add what you own, subtract what you owe, and track the number over time.',
    idea: 'Net worth is your financial scoreboard: everything you own minus everything you owe. The direction matters more than the size.',
    widget: 'netWorth',
    try: 'Pick an example or enter your own numbers, then switch to the 10-year view and try a few market paths.',
    body: [
      '<h3>What you own</h3><p>Cash and savings, retirement accounts, brokerage investments, an HSA, your home at what it would sell for today, and cars at their resale value. Furniture, clothes and electronics are worth far less than you paid; most people leave them out. Future paychecks and a hoped-for inheritance do not count.</p>',
      '<h3>What you owe</h3><p>Mortgage, car loans, student loans, credit card balances, medical bills, personal loans, 401(k) loans and buy-now-pay-later balances. Use the payoff amount, not the monthly payment.</p>',
      '<h3>Three numbers worth watching</h3><ul><li><b>Net worth:</b> everything you own minus everything you owe.</li><li><b>Investable net worth:</b> cash and investments only. This is what can actually pay for retirement, and what your <a href="#l-fire-number">FIRE number</a> is compared with.</li><li><b>Liquid net worth:</b> what you could reach within days without penalties, such as cash and a taxable brokerage account.</li></ul><p>A paid-off home is valuable, but you cannot buy groceries with it without selling or borrowing.</p>',
      '<h3>How to track it</h3><p>Pick one day a month or a quarter and write the numbers in a spreadsheet: each account, each debt, the total and the change since last time. Add a note on why it moved: did you save more, or did markets move? Our <a href="#sheets">spreadsheets</a> include a simple tracker.</p>',
      '<h3>If it is negative, work in this order</h3><p>A negative net worth is common in your twenties, mostly from student loans. Watch the direction: up a little every quarter is the goal. The order this site uses:</p><ul><li>A starter cushion of about $500 to $1,000.</li><li>Enough in the 401(k) to get the full employer match (see <a href="#l-401k-match">the 401(k) match</a>).</li><li>Pay off high-interest debt, such as credit cards, which averaged about 21% APR in August 2026.</li><li>Build the full <a href="#l-emergency">emergency fund</a> of three to six months.</li><li>An HSA and a Roth IRA.</li><li>Max out the 401(k).</li><li>Invest in a taxable brokerage account.</li></ul>',
    ],
    example: {
      title: 'A mid-career snapshot',
      steps: [
        'Own: $25,000 in cash, $180,000 in retirement accounts, $40,000 in a brokerage account, a home worth $450,000 and cars worth $22,000. Total $717,000.',
        'Owe: a $310,000 mortgage. Net worth is $717,000 − $310,000 = $407,000.',
        'Of that, $140,000 is home equity ($450,000 − $310,000) and $22,000 is cars. Investable net worth (cash plus investments) is $245,000.',
        'They save $2,000 a month, so net worth grows by $24,000 a year before market moves, plus the mortgage principal they pay down.',
        'They log the numbers every quarter. A bad market can lower net worth for a quarter or two; the multi-year trend is what they judge.',
      ],
      result: 'Net worth is $407,000, but the money that could fund retirement today is $245,000.',
    },
    mistakes: [
      'Valuing the home at what you hope it will sell for, or the car at what you paid for it.',
      'Checking daily and reacting to every market swing. Monthly or quarterly is enough.',
      'Forgetting easy-to-miss debts: 401(k) loans, medical bills and buy-now-pay-later plans.',
      'Comparing your number with friends or online averages instead of with your own past.',
    ],
    points: [
      'Net worth = what you own − what you owe. Write it down on a schedule.',
      'Watch investable net worth: your home and car do not pay the bills.',
      'Order: starter cushion, full 401(k) match, high-interest debt, full emergency fund, HSA and Roth IRA, max 401(k), then taxable investing.',
      'The trend over years matters more than any one month.',
    ],
    terms: ['Net worth', 'Home equity', 'APR', 'Emergency fund'],
    glossary: [
      { t: 'Investable net worth', d: 'Your cash and investments, leaving out your home and cars. The part of your wealth that can pay for retirement.' },
      { t: 'Liquid net worth', d: 'What you could turn into cash within days without penalties, such as savings and a taxable brokerage account.' },
    ],
    quiz: { q: 'You own a $300,000 home with a $250,000 mortgage, have $20,000 in savings and owe $10,000 on credit cards. What is your net worth?', options: ['$320,000', '$60,000', '$50,000'], answer: 1, why: '$300,000 + $20,000 − $250,000 − $10,000 = $60,000.' },
    sources: [SRC.g19],
  });
})();
