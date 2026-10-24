/* FIRE track, course fi-where "Where Will You Live?": cityCompare, nomadCost, travelBudget, householdFire, visaFinder. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const MINUS = F.minus || '−';
  /* compact dollars: $940, $3.8K, $48K, $1.25M */
  const K = (v) => {
    const a = Math.abs(v), s = v < 0 ? MINUS : '';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
    if (a >= 1e4) return s + '$' + Math.round(a / 1000) + 'K';
    if (a >= 1000) return s + '$' + (a / 1000).toFixed(1) + 'K';
    return s + '$' + Math.round(a);
  };
  const usd0 = (v) => F.usd(v, 0);
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

  SML.css(`
.fw-legend{display:flex;flex-wrap:wrap;gap:6px 14px;padding:10px 16px;font:500 10.5px/1.3 var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.fw-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.fw-hit{cursor:pointer}
svg text.fw-halo{paint-order:stroke;stroke:var(--paper);stroke-width:3.5px;stroke-linejoin:round}
.fw-detail{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
.fw-detail > div{padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0}
.fw-detail > div + div{border-top:1px solid var(--line)}
@media (min-width:760px){.fw-detail{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fw-detail > div + div{border-top:0;border-left:1px solid var(--line)}}
.fw-h{font:600 10.5px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.fw-name{font-family:var(--display);font-weight:400;font-size:30px;line-height:.95;text-transform:uppercase;color:var(--ink)}
.fw-sub{font-size:13.5px;color:var(--muted);line-height:1.45}
.fw-rows{list-style:none;display:flex;flex-direction:column;gap:7px}
.fw-rows li{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:10px;align-items:center;font-size:14px;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.fw-rows li i{width:10px;height:10px;border-radius:2px}
.fw-rows li b{font:600 13px var(--mono);color:var(--ink);font-variant-numeric:tabular-nums}
.fw-rows li small{color:var(--muted);font:500 11px var(--mono);margin-left:6px}
.fw-notes{list-style:none;display:flex;flex-direction:column;gap:8px;font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 85%,transparent)}
.fw-notes li{padding-left:14px;position:relative}
.fw-notes li::before{content:"";position:absolute;left:0;top:.62em;width:6px;height:6px;border-radius:50%;background:var(--accent)}
.fw-notes a{color:var(--ink)}
.fw-cards{display:grid;grid-template-columns:minmax(0,1fr);gap:1px;background:var(--line)}
@media (min-width:640px){.fw-cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
.fw-cards > div{background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:6px;min-width:0}
.fw-cards b{color:var(--ink);font-size:15px}
.fw-cards p{font-size:13.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 78%,transparent)}
.fw-tag{display:inline-flex;align-self:flex-start}
.fw-vrow{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:baseline}
.fw-vrow b{font:600 14px var(--mono);color:var(--ink)}
.fw-ctl2{display:grid;gap:16px 24px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));padding:18px}
`);

  /* ---------- generic stacked horizontal bars ----------
     rows: [{k, label, vals:{cat:value}, total, tag}], cats: [{k, f}] ; sel: key ; fmt(total) -> string */
  function stackBars(W, rows, cats, sel, fmt, maxV, aria) {
    const compact = W < 520;
    const padT = 6, axisH = 24;
    const labelW = compact ? 0 : Math.min(176, Math.round(W * 0.27));
    const totW = compact ? 0 : 96;
    const x0 = compact ? 2 : labelW + 10, x1 = W - (compact ? 2 : totW + 6);
    const rowH = compact ? 44 : 32, barH = compact ? 14 : 16;
    const H = padT + rows.length * rowH + axisH;
    const mx = maxV || Math.max(1, ...rows.map((r) => r.total));
    const tk = SML.ticks(0, mx, compact ? 3 : 5).filter((t) => t <= mx * 1.0001);
    const xs = SML.lin(0, mx, x0, x1);
    let b = '';
    tk.forEach((t) => { b += S.line(xs(t), padT, xs(t), H - axisH + 2, 's-grid') + S.text(xs(t), H - 6, K(t), 'xs mono', t === 0 ? 'start' : 'middle'); });
    rows.forEach((r, i) => {
      const y = padT + i * rowH, on = r.k === sel;
      const by = compact ? y + 22 : y + (rowH - barH) / 2;
      if (on) b += S.rect(0, y + 1, W, rowH - 2, 'f-shade', 4);
      if (compact) {
        b += S.text(x0 + 2, y + 15, esc(r.label), 'sm ' + (on ? 'acc b' : 'ink'));
        b += S.text(x1, y + 15, fmt(r.total), 'sm mono ' + (on ? 'acc b' : 'ink'), 'end');
      } else {
        b += S.text(labelW, by + barH / 2 + 4, esc(r.label), 'md ' + (on ? 'acc b' : 'ink'), 'end');
        b += S.text(x1 + 8, by + barH / 2 + 4, fmt(r.total), 'md mono ' + (on ? 'acc b' : 'ink'));
      }
      let x = x0;
      cats.forEach((c) => { const v = r.vals[c.k] || 0; if (v <= 0) return; const w = xs(v) - xs(0); b += S.rect(x, by, Math.max(0.5, w - 1), barH, c.f); x += w; });
      if (on) b += S.rect(x0 - 2, by - 2, x - x0 + 3, barH + 4, 'nf s-acc w15', 3);
      b += `<rect x="0" y="${y}" width="${W}" height="${rowH}" class="hit fw-hit" data-k="${esc(r.k)}"><title>${esc(r.label)}</title></rect>`;
    });
    return { svg: S.wrap(W, H, aria, b), H };
  }
  const legendHTML = (cats) => `<div class="fw-legend" aria-hidden="true">${cats.map((c) => `<span><i style="background:${c.c}"></i>${c.l}</span>`).join('')}</div>`;

  /* =====================================================================
     1. cityCompare: monthly cost of the same life in different places
     ===================================================================== */
  const CC_CATS = [
    { k: 'housing', l: 'Housing', f: 'f-acc', c: 'var(--accent)' },
    { k: 'food', l: 'Food', f: 'f-up', c: 'var(--up)' },
    { k: 'transport', l: 'Transport', f: 'f-info', c: 'var(--info)' },
    { k: 'health', l: 'Health cover', f: 'f-dn', c: 'var(--down)' },
    { k: 'travel', l: 'Trips & flights home', f: 'f-vio', c: 'var(--violet)' },
    { k: 'admin', l: 'Visas & admin', f: 'f-shade2', c: 'var(--shade2)' },
    { k: 'fun', l: 'Fun & extras', f: 'f-mut', c: 'var(--muted)' },
  ];
  /* Monthly USD for a couple living a comfortable, not lavish, life. Rough 2026 ranges; see lesson sources.
     c: [housing, food, transport, health, travel, admin, fun]; hs: US health with marketplace subsidy (couple, low income) */
  const PLACES = [
    { k: 'us-hi', name: 'US big city', reg: 'US', us: true, ex: 'San Francisco and similar', src: 'Expatistan estimate', c: [4700, 1700, 600, 2000, 350, 0, 2000], hs: 230, kids: 600,
      notes: ['Housing is the whole story here: a furnished two-bedroom can cost $4,000 to $5,500 a month.', 'Health cover before 65 depends on income. Low taxable income can mean a large marketplace subsidy; see <a href="#l-aca">Health insurance before 65</a>.', 'No visa, no currency risk, close to family.'] },
    { k: 'us-mid', name: 'US Midwest city', reg: 'US', us: true, ex: 'Indianapolis and similar', src: 'Numbeo, Oct 2026', c: [1700, 1050, 650, 2000, 300, 0, 700], hs: 230, kids: 350,
      notes: ['The cheapest way to stay in the US: same language, same health system, same tax rules.', 'You usually need a car, so transport costs more than in a walkable city abroad.', 'State income tax varies a lot; some states have none. See <a href="#l-fire-tax">How FIRE withdrawals are taxed</a>.'] },
    { k: 'lisbon', name: 'Lisbon or Porto', reg: 'Europe', ex: 'Portugal', src: 'Numbeo, Oct 2026', c: [1400, 850, 110, 250, 350, 60, 740], kids: 300,
      notes: ['Lisbon rents have climbed fast; Porto and smaller towns cost less.', 'Residents can use the public health system, and local private plans are inexpensive.', 'A popular route is the D7 passive income visa: see <a href="#l-visas">Visas for early retirees</a>.'] },
    { k: 'valencia', name: 'Valencia', reg: 'Europe', ex: 'Spain', src: 'Numbeo, Oct 2026', c: [1430, 820, 90, 300, 350, 60, 710], kids: 300,
      notes: ['A big city with beaches and cheap public transport.', 'Spain taxes residents on worldwide income; ask a Spanish adviser about regional wealth taxes.', 'The non-lucrative visa needs proof of passive income and Spanish private health insurance.'] },
    { k: 'rural-fr', name: 'Rural France', reg: 'Europe', ex: 'A small town such as near Limoges', src: 'rough estimate from Numbeo rents', c: [700, 800, 380, 250, 350, 60, 420], kids: 250,
      notes: ['Old houses are cheap to rent or buy, but you will need a car.', 'Once resident you can join the national health system. Read <a href="#l-treaty-france">the France example</a> for taxes.', 'Living costs here are a rough estimate: few people report prices for small towns.'] },
    { k: 'paris', name: 'Paris', reg: 'Europe', ex: 'France', src: 'Numbeo, Oct 2026', c: [1560, 1150, 110, 250, 300, 60, 1080], kids: 300,
      notes: ['World-class city, small apartments, high rents.', 'Excellent public transport means no car.', 'Same French tax and health rules as anywhere in France.'] },
    { k: 'mexico', name: 'Mexico City or Mérida', reg: 'Latin America', ex: 'Mexico', src: 'Numbeo, Oct 2026', c: [830, 700, 140, 500, 250, 50, 630], kids: 350,
      notes: ['Short flights home and US time zones.', 'Neighborhoods popular with foreigners cost far more than the rest of the country; Mérida is cheaper than Mexico City.', 'Temporary residency needs proof of income or savings; each consulate sets the amount.'] },
    { k: 'medellin', name: 'Medellín', reg: 'Latin America', ex: 'Colombia', src: 'Numbeo, Oct 2026', c: [1050, 820, 150, 350, 300, 50, 730], kids: 300,
      notes: ['Spring-like weather all year.', 'Check safety neighborhood by neighborhood and read the official travel advisory.', 'A pension visa exists for people with a qualifying pension, such as Social Security.'] },
    { k: 'costa', name: 'Costa Rica', reg: 'Latin America', ex: 'San José area', src: 'Numbeo, Oct 20 2026', c: [950, 900, 250, 300, 250, 60, 850], kids: 350,
      notes: ['Not cheap by Latin American standards; imported goods and cars cost more.', 'Legal residents are expected to join the public health system (the Caja) and pay a monthly contribution.', 'Pensionado and rentista residency have clear income rules; check them with the immigration office.'] },
    { k: 'bali', name: 'Bali', reg: 'Asia', ex: 'Indonesia', src: 'Numbeo, Oct 2026', c: [980, 600, 140, 800, 450, 130, 430], kids: 900,
      notes: ['A house with a pool can cost less than a US studio, but flights home are long and expensive.', 'Visas need renewing, so admin costs more each year.', 'International schools are the big extra for families; get real quotes before you plan.'] },
    { k: 'chiangmai', name: 'Chiang Mai', reg: 'Asia', ex: 'Thailand', src: 'Numbeo, Oct 2026', c: [470, 560, 110, 800, 450, 100, 410], kids: 700,
      notes: ['One of the cheapest comfortable cities for foreigners.', 'Air quality is often poor in the dry-season burning months, roughly February to April.', 'Thailand has retirement visas from age 50 with income or savings rules.'] },
    { k: 'van', name: 'Van life, US', reg: 'US', us: true, ex: 'Full-time on the road', src: 'rough estimate', c: [550, 900, 900, 2000, 100, 40, 400], hs: 230, kids: 250,
      notes: ['"Housing" is campsites, internet and mail; transport is fuel, insurance and repairs (the van losing value is extra).', 'Your health plan comes from your home state (domicile), and its network may be local.', 'See <a href="#l-van-life">Van, RV, trailer or house?</a> for the full math.'] },
  ];
  const HH = {
    single: { label: 'Single', m: { housing: 0.75, food: 0.55, transport: 0.7, health: 0.5, travel: 0.5, admin: 0.6, fun: 0.55 } },
    couple: { label: 'Couple', m: { housing: 1, food: 1, transport: 1, health: 1, travel: 1, admin: 1, fun: 1 } },
    family: { label: 'Couple + 2 kids', m: { housing: 1.35, food: 1.6, transport: 1.25, health: 1.9, travel: 2, admin: 1.7, fun: 1.4 } },
  };
  const LIFE = {
    lean: { label: 'Lean', m: { housing: 0.8, food: 0.8, transport: 0.85, travel: 0.6, fun: 0.5 } },
    comfy: { label: 'Comfortable', m: {} },
    fat: { label: 'Fat', m: { housing: 1.7, food: 1.5, transport: 1.4, travel: 2.2, fun: 2.2 } },
  };
  function placeCost(p, hh, life, usHealth, dollar) {
    const out = {};
    CC_CATS.forEach((c, i) => {
      let v = p.c[i];
      if (c.k === 'health' && p.us && usHealth === 'sub') v = p.hs;
      v *= HH[hh].m[c.k] * (LIFE[life].m[c.k] || 1);
      if (!p.us && c.k !== 'travel') v /= 1 + dollar / 100;
      out[c.k] = v;
    });
    if (hh === 'family') out.fun += p.kids * (LIFE[life].m.fun ? Math.sqrt(LIFE[life].m.fun) : 1) / (p.us ? 1 : 1 + dollar / 100);
    return out;
  }
  SML.cityPlaces = PLACES; /* read-only reference for other lessons in this module */

  SML.widgets.cityCompare = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('cc');
    let sel = opts.sel || 'valencia';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Same life, different place</span>
        ${ui.seg(id + '-hh', Object.keys(HH).map((k) => ({ v: k, label: HH[k].label })), opts.hh || 'couple', 'Household')}
        ${ui.seg(id + '-life', Object.keys(LIFE).map((k) => ({ v: k, label: LIFE[k].label })), 'comfy', 'Lifestyle')}</div>
      <div class="wg-bar" style="padding-top:0">${ui.seg(id + '-reg', ['All', 'US', 'Europe', 'Latin America', 'Asia'], 'All', 'Region')}</div>
      <div class="wg-fig"></div>
      ${legendHTML(CC_CATS)}
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-wr', label: 'Withdrawal rate', min: 3, max: 5, step: 0.25, value: 4, fmt: (v) => F.num(v, 2) + '%' })}
        ${ui.slider({ id: id + '-fx', label: 'Dollar vs local money', min: -20, max: 20, step: 5, value: 0, fmt: (v) => (v === 0 ? 'today' : (v > 0 ? 'dollar +' : 'dollar ' + MINUS) + Math.abs(v) + '%') })}
        <div class="fld"><span>US health insurance before 65</span>${ui.seg(id + '-hl', [{ v: 'full', label: 'Full price' }, { v: 'sub', label: 'Subsidy, MAGI $42K' }], 'full', 'US health insurance')}</div>
      </div>
      <div class="wg-read">${ui.stat('Per month', id + '-mo', 'hl')}${ui.stat('Per year', id + '-yr')}${ui.stat('FIRE number, before tax', id + '-fn')}${ui.stat('Number vs US big city', id + '-vs')}</div>
      <div class="fw-detail" id="${id}-det"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Tap a bar to see the breakdown. Housing, food, transport and fun are rough October 2026 figures for a couple renting a one-bedroom (Numbeo; Expatistan for San Francisco); comfortable and fat lifestyles scale them up. Health cover abroad, flights home and visa costs are estimates. "Full price" US cover is an unsubsidized marketplace plan for two people in their 50s (estimate). The subsidy case assumes a couple’s MAGI (modified adjusted gross income) near $42,300, twice the poverty line, so under 2026 rules they pay about 6.6% of it, about $230 a month; at $80,000 of MAGI they would pay about $664. All figures are before income tax: abroad, residents usually owe local tax on worldwide dividends, interest and gains, and the US 0% capital gains band does not cancel it. Your costs will differ.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => draw());
    fig.addEventListener('click', (e) => { const h = e.target.closest('[data-k]'); if (!h) return; sel = h.dataset.k; draw(); });
    const draw = ui.responsive(fig, (W) => {
      const hh = st.seg(id + '-hh'), life = st.seg(id + '-life'), reg = st.seg(id + '-reg');
      const wr = st.n(id + '-wr'), fx = st.n(id + '-fx'), hl = st.seg(id + '-hl');
      const all = PLACES.map((p) => { const vals = placeCost(p, hh, life, hl, fx); return { k: p.k, label: p.name, vals, total: sum(vals), p }; });
      const maxV = Math.max(...all.map((r) => r.total));
      let rows = all.filter((r) => reg === 'All' || r.p.reg === reg).sort((a, b) => a.total - b.total);
      if (!rows.some((r) => r.k === sel)) sel = rows[0].k;
      const r = all.find((x) => x.k === sel), base = all.find((x) => x.k === 'us-hi');
      const out = stackBars(W, rows, CC_CATS, sel, (v) => (W < 520 ? K(v) : usd0(v)) + '/mo', maxV, 'Monthly cost of the same life in each place, split into housing, food, transport, health, travel, admin and fun');
      fig.innerHTML = out.svg;
      const yr = r.total * 12, fn = yr / (wr / 100), saveYr = (base.total - r.total) * 12;
      $('#' + id + '-mo').textContent = usd0(r.total);
      $('#' + id + '-yr').textContent = usd0(yr);
      $('#' + id + '-fn').textContent = K(fn);
      const vs = $('#' + id + '-vs');
      vs.textContent = r.k === 'us-hi' ? 'baseline' : (saveYr >= 0 ? MINUS : '+') + K(Math.abs(fn - base.total * 12 / (wr / 100)));
      vs.className = 'stat-v' + (r.k === 'us-hi' ? '' : saveYr >= 0 ? ' up' : ' dn');
      const lo = r.total * 0.85, hi = r.total * 1.15;
      $('#' + id + '-det').innerHTML = `<div><p class="fw-h">${esc(r.p.ex)}</p><p class="fw-name">${esc(r.p.name)}</p><p class="fw-sub">${HH[hh].label}, ${LIFE[life].label.toLowerCase()} life: about ${usd0(lo)} to ${usd0(hi)} a month. Living costs: ${esc(r.p.src)}.</p>
        <ul class="fw-rows">${CC_CATS.map((c) => `<li><i style="background:${c.c}"></i><span>${c.l}<small>${Math.round((r.vals[c.k] / r.total) * 100)}%</small></span><b>${usd0(r.vals[c.k])}</b></li>`).join('')}</ul></div>
        <div><p class="fw-h">Good to know</p><ul class="fw-notes">${r.p.notes.map((n) => `<li>${n}</li>`).join('')}${r.p.us ? '' : '<li>Before local tax: as a resident you will usually owe tax here on worldwide dividends, interest and gains, on top of filing in the US. See <a href="#l-us-tax-abroad">US taxes follow you abroad</a>.</li>'}</ul></div>`;
      const pct = Math.round((1 - r.total / base.total) * 100);
      $('#' + id + '-msg').innerHTML = r.k === 'us-hi'
        ? ui.msg('acc', 'Baseline', `This life costs about <b>${usd0(r.total)}</b> a month here, so you would need about <b>${K(fn)}</b> invested at a ${F.num(wr, 2)}% withdrawal rate. Tap another place to compare.`)
        : saveYr > 0
          ? ui.msg('up', pct + '% cheaper', `${esc(r.p.name)} costs about <b>${usd0(r.total)}</b> a month for the same life. Your FIRE number drops to <b>${K(fn)}</b>, about <b>${K(base.total * 12 / (wr / 100) - fn)}</b> less than in a US big city${r.p.us ? '' : ', before local income tax'}.`)
          : ui.msg('dn', 'Costs more', `${esc(r.p.name)} costs about <b>${usd0(r.total)}</b> a month for this life, so the FIRE number is <b>${K(fn)}</b>.`);
    });
  };

  /* =====================================================================
     2. nomadCost: van, motorhome, trailer or a small-town rental
     ===================================================================== */
  const NC_CATS = [
    { k: 'dep', l: 'Value lost', f: 'f-dn', c: 'var(--down)' },
    { k: 'fuel', l: 'Fuel', f: 'f-acc', c: 'var(--accent)' },
    { k: 'site', l: 'Campsites or rent', f: 'f-info', c: 'var(--info)' },
    { k: 'ins', l: 'Insurance & registration', f: 'f-vio', c: 'var(--violet)' },
    { k: 'maint', l: 'Repairs & upkeep', f: 'f-up', c: 'var(--up)' },
    { k: 'net', l: 'Internet, mail, utilities', f: 'f-mut', c: 'var(--muted)' },
  ];
  const HOMES = [
    { k: 'van', name: 'Camper van', veh: true, price: 60000, pmin: 20000, pmax: 200000, dep: 0.1, mpg: 17, ins: 165, maint: 0.14, site: 38, net: 175, desc: 'A converted cargo van. Easy to park and drive, tight inside.' },
    { k: 'rv', name: 'Motorhome', veh: true, price: 110000, pmin: 30000, pmax: 300000, dep: 0.15, mpg: 8, ins: 200, maint: 0.24, site: 52, net: 195, desc: 'A Class C motorhome: more room, worse fuel economy, bigger repair bills.' },
    { k: 'trailer', name: 'Trailer + truck', veh: true, price: 95000, pmin: 30000, pmax: 220000, dep: 0.13, mpg: 11, ins: 220, maint: 0.2, site: 50, net: 195, desc: 'A travel trailer pulled by a pickup. Park the trailer and explore by truck.' },
    { k: 'house', name: 'Small-town rental', veh: false, price: 1350, pmin: 700, pmax: 3000, dep: 0.1, car: 26000, mpg: 28, ins: 140, maint: 0.1, util: 260, net: 70, miles: 9000, desc: 'A two-bedroom rental in a low-cost US town, plus one paid-off-style car.' },
  ];
  function homeCost(h, price, miles, paidPct, fuel, years) {
    const v = {};
    const avgDep = (p, d) => (p * (1 - Math.pow(1 - d, years))) / years / 12;
    if (h.veh) {
      v.dep = avgDep(price, h.dep);
      v.fuel = (miles / 12 / h.mpg) * fuel;
      v.site = h.site * 30.4 * (paidPct / 100) + 25 * (1 - paidPct / 100); /* free nights still cost water, dumps, showers */
      v.ins = h.ins;
      v.maint = (miles / 12) * h.maint + 60;
      v.net = h.net;
    } else {
      v.dep = avgDep(h.car, h.dep);
      v.fuel = (h.miles / 12 / h.mpg) * fuel;
      v.site = price;
      v.ins = h.ins + 15;
      v.maint = (h.miles / 12) * h.maint + 40;
      v.net = h.util + h.net;
    }
    return v;
  }
  SML.widgets.nomadCost = function (root) {
    const id = SML.uid('nc');
    const prices = {}; HOMES.forEach((h) => { prices[h.k] = h.price; });
    let focus = 'van';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Monthly cost of a home on wheels</span>${ui.seg(id + '-f', HOMES.map((h) => ({ v: h.k, label: h.name })), focus, 'Home')}</div>
      <div class="wg-fig"></div>
      ${legendHTML(NC_CATS)}
      <div class="wg-ctrl">
        <div id="${id}-pw">${ui.slider({ id: id + '-p', label: 'Purchase price', min: 20000, max: 200000, step: 5000, value: prices.van, fmt: 'usd0' })}</div>
        ${ui.slider({ id: id + '-mi', label: 'Miles per year', min: 3000, max: 30000, step: 1000, value: 10000, fmt: (v) => F.num(v) + ' mi' })}
        ${ui.slider({ id: id + '-pd', label: 'Nights in paid campsites', min: 0, max: 100, step: 5, value: 40, fmt: 'pct' })}
        ${ui.slider({ id: id + '-fu', label: 'Fuel price per gallon', min: 2.5, max: 6, step: 0.1, value: 3.3, fmt: (v) => '$' + v.toFixed(2) })}
        ${ui.slider({ id: id + '-y', label: 'Years you keep it', min: 1, max: 10, step: 1, value: 4, fmt: 'yrs' })}
      </div>
      <div class="wg-read">${ui.stat('Per month', id + '-mo', 'hl')}${ui.stat('Per year', id + '-yr')}${ui.stat('Value lost per year', id + '-dp')}${ui.stat('FIRE number, 4%', id + '-fn')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Pick a home to edit its price; tap a bar to switch. Value lost is the average yearly drop in resale value over the years you keep it, assumed at 10% a year for a van, 13% for a trailer and truck and 15% for a motorhome: the hidden rent of a vehicle home. Insurance, repairs, internet and campsite prices are rough estimates, not quotes. Food, health insurance and fun are the same for every option, so they are left out.</div>`;
    const fig = $('.wg-fig', root), pw = $('#' + id + '-pw', root);
    const setPriceSlider = () => {
      const h = HOMES.find((x) => x.k === focus);
      pw.innerHTML = h.veh ? ui.slider({ id: id + '-p', label: 'Purchase price', min: h.pmin, max: h.pmax, step: 5000, value: prices[focus], fmt: 'usd0' }) : ui.slider({ id: id + '-p', label: 'Monthly rent', min: h.pmin, max: h.pmax, step: 50, value: prices[focus], fmt: 'usd0' });
      const inp = $('#' + id + '-p', root); inp.addEventListener('input', () => { ui.setRange(inp); prices[focus] = Number(inp.value); draw(); });
    };
    const st = ui.wire(root, (e) => {
      const f = st.seg(id + '-f');
      if (f !== focus) { focus = f; setPriceSlider(); }
      draw();
    });
    setPriceSlider();
    fig.addEventListener('click', (e) => { const h = e.target.closest('[data-k]'); if (!h) return; focus = h.dataset.k; st.setSeg(id + '-f', focus); setPriceSlider(); draw(); });
    const draw = ui.responsive(fig, (W) => {
      const mi = st.n(id + '-mi'), pd = st.n(id + '-pd'), fu = st.n(id + '-fu'), yrs = st.n(id + '-y');
      const rows = HOMES.map((h) => { const vals = homeCost(h, prices[h.k], mi, pd, fu, yrs); return { k: h.k, label: h.name, vals, total: sum(vals), h }; });
      const out = stackBars(W, rows, NC_CATS, focus, (v) => (W < 520 ? K(v) : usd0(v)) + '/mo', 0, 'Monthly cost of a camper van, a motorhome, a trailer with truck and a small-town rental, split into value lost, fuel, sites or rent, insurance, upkeep and utilities');
      fig.innerHTML = out.svg;
      const r = rows.find((x) => x.k === focus), house = rows.find((x) => x.k === 'house');
      $('#' + id + '-mo').textContent = usd0(r.total);
      $('#' + id + '-yr').textContent = usd0(r.total * 12);
      $('#' + id + '-dp').textContent = usd0(r.vals.dep * 12);
      $('#' + id + '-fn').textContent = K(r.total * 12 * 25);
      const diff = r.total - house.total;
      const biggest = NC_CATS.slice().sort((a, b) => r.vals[b.k] - r.vals[a.k])[0];
      $('#' + id + '-msg').innerHTML = focus === 'house'
        ? ui.msg('info', 'Baseline', `A small-town rental with one car runs about <b>${usd0(r.total)}</b> a month for housing and getting around. ${esc(r.h.desc)}`)
        : ui.msg(diff < 0 ? 'up' : 'dn', diff < 0 ? 'Cheaper' : 'Not cheaper', `The ${esc(r.h.name.toLowerCase())} costs about <b>${usd0(r.total)}</b> a month, ${usd0(Math.abs(diff))} ${diff < 0 ? 'less' : 'more'} than the rental. The biggest line is <b>${biggest.l.toLowerCase()}</b> (${usd0(r.vals[biggest.k])}).${r.vals.dep > r.vals.site ? ' Losing value costs you more than campsites do: buying used and driving less are the big levers.' : ''}`);
    });
  };

  /* =====================================================================
     3. travelBudget: slow vs fast travel, from a home base or full time
     ===================================================================== */
  const STY = {
    budget: { label: 'Budget', night: 45, day: 35 },
    mid: { label: 'Mid-range', night: 95, day: 65 },
    comfort: { label: 'Comfort', night: 210, day: 120 },
  };
  const PPL = { 1: { label: 'Solo', lodg: 0.85 }, 2: { label: 'Couple', lodg: 1 }, 4: { label: 'Family of 4', lodg: 1.5 } };
  const TB_CATS = [
    { k: 'fly', l: 'Flights', f: 'f-vio', c: 'var(--violet)' },
    { k: 'bed', l: 'Lodging', f: 'f-acc', c: 'var(--accent)' },
    { k: 'day', l: 'Food, transport, activities', f: 'f-up', c: 'var(--up)' },
    { k: 'ins', l: 'Insurance & visas', f: 'f-info', c: 'var(--info)' },
  ];
  const discount = (days) => (days >= 28 ? 0.6 : days >= 7 ? 0.85 : 1); /* typical weekly and monthly rental discounts */
  function travelYear(o) {
    const sty = STY[o.style], ppl = Number(o.ppl), nightRate = (d) => sty.night * PPL[ppl].lodg * discount(d);
    const v = { fly: 0, bed: 0, day: 0, ins: 0 };
    if (o.mode === 'base') {
      const days = o.days, trips = o.trips;
      v.fly = trips * o.flight * ppl;
      v.bed = trips * days * nightRate(days);
      v.day = trips * days * sty.day * ppl;
      v.ins = (v.fly + v.bed + v.day) * 0.05;
    } else {
      const days = 365 / o.places;
      v.fly = o.places * o.hop * ppl + o.home * o.flight * ppl;
      v.bed = 365 * nightRate(days);
      v.day = 365 * sty.day * ppl;
      v.ins = o.nomadIns * 12 * ppl + 250 * ppl;
    }
    return v;
  }
  SML.widgets.travelBudget = function (root) {
    const id = SML.uid('tb');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Your travel year</span>${ui.seg(id + '-m', [{ v: 'base', label: 'Trips from home' }, { v: 'nomad', label: 'Full-time travel' }], 'base', 'Travel mode')}</div>
      <div class="wg-bar" style="padding-top:0">${ui.seg(id + '-p', Object.keys(PPL).map((k) => ({ v: k, label: PPL[k].label })), '2', 'Travellers')}${ui.seg(id + '-s', Object.keys(STY).map((k) => ({ v: k, label: STY[k].label })), 'mid', 'Style')}</div>
      <div class="wg-fig"></div>
      ${legendHTML(TB_CATS)}
      <div class="wg-ctrl" id="${id}-c"></div>
      <div class="wg-read">${ui.stat('Travel per year', id + '-yr', 'hl')}${ui.stat('Per day, whole group', id + '-pd')}${ui.stat('Adds to FIRE number', id + '-fn')}${ui.stat('Per $1,000 a year', id + '-k')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the dot along the curve. It shows what one day costs your group depending on how long you stay in each place: longer stays spread the flights and unlock weekly (about 15% off) and monthly (about 40% off) rental discounts. Example prices; they vary hugely by country and season. Trip insurance is set at 5% of trip cost; nomad health insurance is an estimate and costs more as you age. FIRE number effect at a 4% withdrawal rate (25 times the yearly cost).</div>`;
    const fig = $('.wg-fig', root), ctl = $('#' + id + '-c', root);
    const vals = { trips: 3, days: 14, flight: 700, places: 6, hop: 200, home: 1, nomadIns: 120 };
    let mode = 'base';
    const sliders = () => {
      ctl.innerHTML = mode === 'base'
        ? ui.slider({ id: id + '-trips', label: 'Trips per year', min: 1, max: 8, step: 1, value: vals.trips })
          + ui.slider({ id: id + '-days', label: 'Days per trip', min: 3, max: 90, step: 1, value: vals.days, fmt: 'days' })
          + ui.slider({ id: id + '-flight', label: 'Round-trip flight, per person', min: 100, max: 2000, step: 50, value: vals.flight, fmt: 'usd0' })
        : ui.slider({ id: id + '-places', label: 'Places per year', min: 2, max: 24, step: 1, value: vals.places })
          + ui.slider({ id: id + '-hop', label: 'Flight between places, per person', min: 50, max: 800, step: 25, value: vals.hop, fmt: 'usd0' })
          + ui.slider({ id: id + '-home', label: 'Flights home per year', min: 0, max: 4, step: 1, value: vals.home })
          + ui.slider({ id: id + '-flight', label: 'Flight home, per person', min: 200, max: 2000, step: 50, value: vals.flight, fmt: 'usd0' })
          + ui.slider({ id: id + '-nomadIns', label: 'Nomad health insurance, per person a month', min: 40, max: 400, step: 10, value: vals.nomadIns, fmt: 'usd0' });
      $$('input', ctl).forEach((el) => el.addEventListener('input', () => { ui.setRange(el); vals[el.id.slice(id.length + 1)] = Number(el.value); draw(); }));
    };
    const st = ui.wire(root, () => { const m = st.seg(id + '-m'); if (m !== mode) { mode = m; sliders(); } draw(); });
    sliders();
    let scale = null;
    const setVal = (k, v) => { vals[k] = v; const el = $('#' + id + '-' + k, root); if (el) { el.value = v; ui.setRange(el); } };
    ui.drag(fig, { sel: '.handle', move(pt) {
      if (!scale) return;
      const d = SML.clamp(scale.inv(pt.x), 3, 90);
      if (mode === 'base') setVal('days', Math.round(d)); else setVal('places', SML.clamp(Math.round(365 / d), 2, 24));
      draw();
    } });
    const draw = ui.responsive(fig, (W) => {
      const o = Object.assign({ mode, ppl: st.seg(id + '-p'), style: st.seg(id + '-s') }, vals);
      const v = travelYear(o), tot = sum(v), ppl = Number(o.ppl), sty = STY[o.style];
      const compact = W < 520;
      const H = compact ? 260 : 300, padL = compact ? 40 : 52, padR = 14, padT = 22, curveB = H - 96;
      const dmin = 3, dmax = 90;
      const curveAt = (d) => {
        const bed = sty.night * PPL[ppl].lodg * discount(d), day = sty.day * ppl;
        const fly = mode === 'base' ? (o.flight * ppl) / d : (o.hop * ppl) / d;
        return { fly, bed, day };
      };
      const pts = []; for (let d = dmin; d <= dmax; d += 0.5) pts.push([d, curveAt(d)]);
      const ymax = Math.max(...pts.map(([, c]) => c.fly + c.bed + c.day)) * 1.08;
      const xs = SML.lin(dmin, dmax, padL, W - padR), ys = SML.lin(0, ymax, curveB, padT);
      scale = { inv: (px) => dmin + ((px - padL) / (W - padR - padL)) * (dmax - dmin) };
      let b = '';
      SML.ticks(0, ymax, 4).forEach((t) => { b += S.line(padL, ys(t), W - padR, ys(t), 's-grid') + S.text(padL - 6, ys(t) + 4, K(t), 'xs mono', 'end'); });
      [7, 14, 28, 60, 90].concat(compact ? [] : [45]).forEach((d) => { b += S.text(xs(d), curveB + 15, String(d), 'xs mono', 'middle'); });
      const lay = (f) => pts.map(([d, c]) => [xs(d), ys(f(c))]);
      const l1 = lay((c) => c.day), l2 = lay((c) => c.day + c.bed), l3 = lay((c) => c.day + c.bed + c.fly);
      const band = (top, bot, cls) => S.polygon(top.concat(bot.slice().reverse()), cls);
      b += S.area(l1, curveB, 'f-up-t') + band(l2, l1, 'f-acc-t') + band(l3, l2, 'f-vio-t');
      b += S.poly(l1, 's-up w15') + S.poly(l2, 's-acc w15') + S.poly(l3, 's-vio w25');
      b += S.text(W - padR, padT - 8, 'cost per day for your group', 'xs', 'end');
      const dNow = mode === 'base' ? o.days : 365 / o.places;
      const cNow = curveAt(SML.clamp(dNow, dmin, dmax)), yNow = cNow.fly + cNow.bed + cNow.day;
      b += S.line(xs(SML.clamp(dNow, dmin, dmax)), padT, xs(SML.clamp(dNow, dmin, dmax)), curveB, 's-ink dash2');
      b += S.circle(xs(SML.clamp(dNow, dmin, dmax)), ys(yNow), 7, 'handle');
      const tx = xs(SML.clamp(dNow, dmin, dmax)), right = tx < W * 0.6;
      b += S.text(tx + (right ? 10 : -10), ys(yNow) - 10, `${Math.round(dNow)} days: ${usd0(yNow)}/day`, 'sm b ink', right ? 'start' : 'end');
      b += S.text(W - padR, curveB + 30, 'days in each place', 'xs', 'end');
      /* yearly stacked bar */
      const by = H - 44, bx0 = padL, bx1 = W - padR, bxs = SML.lin(0, tot || 1, bx0, bx1);
      b += S.text(bx0, by - 8, 'Your year: ' + usd0(tot), 'sm b ink');
      let x = bx0;
      TB_CATS.forEach((c) => { const w = bxs(v[c.k]) - bx0; if (w <= 0) return; b += S.rect(x, by, Math.max(0.5, w - 1), 18, c.f); if (w > 54) b += S.text(x + 6, by + 13, K(v[c.k]), 'xs mono b onacc'); x += w; });
      fig.innerHTML = S.wrap(W, H, 'Cost per day of travel by length of stay, and your yearly travel cost split into flights, lodging, daily costs and insurance', b, 'drag');
      const days = mode === 'base' ? o.trips * o.days : 365;
      $('#' + id + '-yr').textContent = usd0(tot);
      $('#' + id + '-pd').textContent = usd0(tot / Math.max(1, days));
      $('#' + id + '-fn').textContent = '+' + K(tot * 25);
      $('#' + id + '-k').textContent = '+$25K';
      const short = curveAt(5), long = curveAt(30), sT = short.fly + short.bed + short.day, lT = long.fly + long.bed + long.day;
      $('#' + id + '-msg').innerHTML = mode === 'base'
        ? ui.msg('acc', K(tot) + ' a year', `${o.trips} trip${o.trips > 1 ? 's' : ''} of ${o.days} days cost about <b>${usd0(tot)}</b> a year on top of your home costs, which adds <b>${K(tot * 25)}</b> to your FIRE number. A day on a 5-day trip costs ${usd0(sT)}; on a month-long stay it falls to ${usd0(lT)}.`)
        : ui.msg('info', 'Full time', `Moving ${o.places} times a year (about ${Math.round(365 / o.places)} days per place) costs about <b>${usd0(tot)}</b> a year for everything, ${usd0(tot / 12)} a month. That replaces rent at home, so compare it with your home budget, not add it on.`);
    });
  };

  /* =====================================================================
     4. householdFire: how kids change spending and the number over time
     ===================================================================== */
  const HF_CATS = [
    { k: 'adult', l: 'Adults', f: 'f-info-t', s: 's-info', c: 'var(--info)' },
    { k: 'kid', l: 'Kids living costs', f: 'f-acc-t', s: 's-acc', c: 'var(--accent)' },
    { k: 'care', l: 'Childcare', f: 'f-vio-t', s: 's-vio', c: 'var(--violet)' },
    { k: 'college', l: 'College', f: 'f-up-t', s: 's-up', c: 'var(--up)' },
  ];
  const HF_PRESETS = {
    couple: { label: 'Couple', base: 55000, kids: 0, young: 2, care: 1100, kidc: 15000, col: 'none' },
    young: { label: 'Couple + 2 little ones', base: 58000, kids: 2, young: 1, care: 1100, kidc: 15000, col: 'public' },
    single: { label: 'Single parent + 1', base: 38000, kids: 1, young: 6, care: 600, kidc: 14000, col: 'public' },
    teens: { label: 'Couple + 3 teens', base: 62000, kids: 3, young: 12, care: 0, kidc: 17000, col: 'public' },
  };
  /* College Board, Trends in College Pricing 2025: average full-time budgets 2025-26 (tuition, fees, housing, food, books, transport) */
  const COLLEGE = { none: { label: 'No college help', y: 0 }, public: { label: 'Public, in-state', y: 30990 }, private: { label: 'Private', y: 65470 } };
  function householdYears(o, years) {
    const out = [];
    for (let t = 0; t <= years; t++) {
      const row = { t, adult: o.base, kid: 0, care: 0, college: 0 };
      for (let j = 0; j < o.kids; j++) {
        const age = o.young + 2 * j + t;
        if (age < 18) { row.kid += o.kidc; if (age < 5) row.care += o.care * 12; }
        else if (age < 22) row.college += COLLEGE[o.col].y;
      }
      out.push(row);
    }
    return out;
  }
  SML.widgets.householdFire = function (root) {
    const id = SML.uid('hf');
    const p0 = HF_PRESETS.young;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Spending over the next 30 years</span>${ui.seg(id + '-pr', Object.keys(HF_PRESETS).map((k) => ({ v: k, label: HF_PRESETS[k].label })), 'young', 'Household preset')}</div>
      <div class="wg-fig"></div>
      ${legendHTML(HF_CATS)}
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-base', label: 'Adults’ spending per year', min: 20000, max: 150000, step: 1000, value: p0.base, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-kids', label: 'Children', min: 0, max: 4, step: 1, value: p0.kids })}
        ${ui.slider({ id: id + '-young', label: 'Youngest child’s age', min: 0, max: 17, step: 1, value: p0.young, fmt: (v) => v + (v === 1 ? ' year' : ' years') })}
        ${ui.slider({ id: id + '-kidc', label: 'Cost per child per year', min: 6000, max: 30000, step: 500, value: p0.kidc, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-care', label: 'Childcare per month, under 5', min: 0, max: 3000, step: 50, value: p0.care, fmt: 'usd0' })}
        <div class="fld"><span>College help per child</span>${ui.seg(id + '-col', Object.keys(COLLEGE).map((k) => ({ v: k, label: COLLEGE[k].label })), p0.col, 'College help')}</div>
      </div>
      <div class="wg-read">${ui.stat('Spending now', id + '-now')}${ui.stat('Peak year', id + '-pk')}${ui.stat('After the kids leave', id + '-aft', 'hl')}${ui.stat('Extra for the kid years', id + '-br')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Children are spaced two years apart. Cost per child covers food, clothes, activities, health and the extra room, but not childcare or college (the USDA’s estimate is about $13,000 a year in 2015 dollars). Childcare starts at the 2025 US average of about $1,100 a month. College help is the College Board’s average 2025-26 budget for four years. All in today’s dollars; FIRE numbers at a 4% withdrawal rate; the kid-years extra is a simple sum, not invested.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-pr')) {
        const p = HF_PRESETS[st.seg(id + '-pr')];
        ['base', 'kids', 'young', 'kidc', 'care'].forEach((k) => st.set(id + '-' + k, p[k]));
        st.setSeg(id + '-col', p.col);
      }
      draw();
    });
    const draw = ui.responsive(fig, (W) => {
      const o = { base: st.n(id + '-base'), kids: st.n(id + '-kids'), young: st.n(id + '-young'), kidc: st.n(id + '-kidc'), care: st.n(id + '-care'), col: st.seg(id + '-col') };
      const N = 30, rows = householdYears(o, N), tot = rows.map((r) => r.adult + r.kid + r.care + r.college);
      const compact = W < 520;
      const H = compact ? 240 : 290, padL = compact ? 42 : 54, padR = compact ? 12 : 120, padT = 18, padB = 26;
      const ymax = Math.max(...tot, o.base) * 1.15;
      const xs = SML.lin(0, N, padL, W - padR), ys = SML.lin(0, ymax, H - padB, padT);
      let b = '';
      SML.ticks(0, ymax, 4).forEach((t) => { b += S.line(padL, ys(t), W - padR, ys(t), 's-grid') + S.text(padL - 6, ys(t) + 4, K(t), 'xs mono', 'end'); });
      [0, 5, 10, 15, 20, 25, 30].forEach((t) => { if (compact && t % 10) return; b += S.text(xs(t), H - 8, t === 0 ? 'now' : '+' + t + 'y', 'xs mono', 'middle'); });
      let prev = rows.map((r) => [xs(r.t), ys(0)]);
      let acc = rows.map(() => 0);
      HF_CATS.forEach((c) => {
        acc = acc.map((a, i) => a + rows[i][c.k]);
        const top = rows.map((r, i) => [xs(r.t), ys(acc[i])]);
        if (rows.some((r) => r[c.k] > 0)) { b += S.polygon(top.concat(prev.slice().reverse()), c.f) + S.poly(top, c.s + ' w15'); }
        prev = top;
      });
      const aft = o.base, peak = Math.max(...tot), pk = tot.indexOf(peak);
      b += S.line(padL, ys(aft), W - padR, ys(aft), 's-ink dash w15');
      const lbl = (y, s, cls) => (compact ? S.text(W - padR, y - 6, s, 'xs b ' + cls, 'end') : S.text(W - padR + 8, y + 4, s, 'sm b ' + cls));
      b += lbl(ys(aft), 'after kids ' + K(aft), 'ink');
      if (peak > aft * 1.01) { b += S.circle(xs(pk), ys(peak), 5, 'handle') + lbl(ys(peak), 'peak ' + K(peak), 'acc'); }
      fig.innerHTML = S.wrap(W, H, 'Household spending each year for the next 30 years, stacked into adults, kids, childcare and college', b);
      const bridge = tot.reduce((s, v) => s + Math.max(0, v - aft), 0);
      $('#' + id + '-now').textContent = usd0(tot[0]);
      $('#' + id + '-pk').textContent = usd0(peak) + (peak > aft * 1.01 ? ' (+' + pk + 'y)' : '');
      $('#' + id + '-aft').textContent = usd0(aft);
      $('#' + id + '-br').textContent = K(bridge);
      const fnPeak = peak * 25, fnLong = aft * 25 + bridge;
      $('#' + id + '-msg').innerHTML = o.kids === 0
        ? ui.msg('info', 'No kids', `Spending stays near <b>${usd0(aft)}</b> a year, so the FIRE number is about <b>${K(aft * 25)}</b>. Add children to see how the picture changes.`)
        : ui.msg('acc', 'Plan the bump', `Spending peaks at <b>${usd0(peak)}</b> in year ${pk}, then falls to <b>${usd0(aft)}</b>. Funding the peak forever needs about <b>${K(fnPeak)}</b>. A long-run number of ${K(aft * 25)} plus about <b>${K(bridge)}</b> set aside for the kid years needs about <b>${K(fnLong)}</b>${fnLong < fnPeak ? `, ${K(fnPeak - fnLong)} less` : ''}.`);
    });
  };

  /* =====================================================================
     5. visaFinder: which retirement or passive income visas might fit
     ===================================================================== */
  /* inc: monthly income in USD for one applicant (converted at €1 = $1.124, 33.6 baht, 3,150 pesos per $, Oct 2026);
     fam: extra per added adult; save: savings route in USD (null if none); age: minimum age; pension: only a lifetime pension counts;
     ver: true when the figure was confirmed on an official government page, false when it is a reported figure */
  const VISAS = [
    { k: 'pt', c: 'Portugal', n: 'D7 passive income visa', short: 'D7 visa', inc: 1034, fam: 517, save: null, age: 0, pension: false, ver: false,
      rule: 'About the Portuguese minimum wage per month (about €920 in 2026), plus 50% for a spouse', tax: 'Portugal taxes residents on worldwide income. The old NHR tax break is closed to newcomers, and its replacement is aimed at certain professionals, not retirees.', u: 'https://vistos.mne.gov.pt/' },
    { k: 'es', c: 'Spain', n: 'Non-lucrative visa', inc: 2698, fam: 674, save: 32371, age: 0, pension: false, ver: true,
      test: (o) => { const inc = o.hh === 2 ? 3372 : 2698, fund = o.hh === 2 ? 40464 : 32371;
        if (o.inc >= inc) return ['yes', 'income meets the rule'];
        if (o.sav >= fund) return ['yes', 'savings likely cover the first year: confirm with the consulate'];
        if (o.inc >= inc * 0.85 || o.sav >= fund * 0.85) return ['close', 'just under the rule'];
        return ['no', 'income and savings below the rule']; },
      rule: '400% of IPREM, €2,400 a month (€28,800 a year), plus €600 a month per family member: €36,000 a year for a couple. You show sufficient funds for the first year, and savings or investment accounts can count. Spanish private health insurance with no copays is required', tax: 'Spain taxes residents on worldwide income.', u: 'https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-residencia-no-lucrativa.aspx' },
    { k: 'fr', c: 'France', n: 'Long-stay visitor visa', short: 'Visitor visa', inc: 1661, fam: 0, save: null, age: 0, pension: false, ver: false,
      rule: 'Steady resources, usually compared with the French net minimum wage (about €1,478 a month from mid-2026); couples may be asked for more', tax: 'French residents pay income tax on worldwide income plus social charges on investment income. See the France example.', u: 'https://france-visas.gouv.fr/' },
    { k: 'it', c: 'Italy', n: 'Elective residence visa', short: 'Elective residence', inc: 2904, fam: 655, save: null, age: 0, pension: false, ver: false,
      rule: 'Stable passive income, by consular practice about €31,000 a year for one person and €38,000 for a couple', tax: 'Italy taxes residents on worldwide income; a special 7% regime for some pensioners in small southern towns is worth asking about.', u: 'https://vistoperitalia.esteri.it/' },
    { k: 'gr', c: 'Greece', n: 'Financially independent person', short: 'FIP visa', inc: 3934, fam: 787, save: null, age: 0, pension: false, ver: false,
      rule: 'About €3,500 a month, plus 20% for a spouse and 15% per child', tax: 'Greece taxes residents on worldwide income; ask about its flat-tax option for foreign pensioners.', u: 'https://www.mfa.gr/' },
    { k: 'mx', c: 'Mexico', n: 'Temporary resident, solvency', short: 'Temporary resident', inc: 4049, fam: 0, save: 68241, age: 0, pension: false, ver: true,
      rule: 'At the San Diego consulate in 2026: $4,049 a month of income for the last six months, or a minimum monthly balance of at least $68,241 over the last twelve months. Other consulates set their own amounts', tax: 'Living in Mexico can make you a Mexican tax resident; get local advice.', u: 'https://consulmex.sre.gob.mx/sandiego/images/visas/ingles/5a_Temporary_Resident_Visa_-_Economic_Solvency.pdf' },
    { k: 'cr', c: 'Costa Rica', n: 'Pensionado', inc: 1000, fam: 0, save: null, age: 0, pension: true, ver: false,
      rule: 'A lifetime pension of about $1,000 a month, such as Social Security; some programs may also accept a lifetime annuity you buy', tax: 'Costa Rica mainly taxes income earned in Costa Rica; confirm before you move.', u: 'https://www.migracion.go.cr/' },
    { k: 'cr2', c: 'Costa Rica', n: 'Rentista', inc: 2500, fam: 0, save: 60000, age: 0, pension: false, ver: false,
      rule: 'About $2,500 a month guaranteed for two years, or a deposit of about $60,000', tax: 'Costa Rica mainly taxes income earned in Costa Rica; confirm before you move.', u: 'https://www.migracion.go.cr/' },
    { k: 'pa', c: 'Panama', n: 'Pensionado', inc: 1000, fam: 0, save: null, age: 0, pension: true, ver: false,
      rule: 'A lifetime pension of about $1,000 a month', tax: 'Panama mainly taxes income earned in Panama; confirm before you move.', u: 'https://www.migracion.gob.pa/' },
    { k: 'co', c: 'Colombia', n: 'Pension visa', inc: 1667, fam: 0, save: null, age: 0, pension: true, ver: false,
      rule: 'A pension of at least three times the Colombian monthly minimum wage, about $1,670 a month in 2026 (the minimum wage itself was challenged in court)', tax: 'After 183 days in a year you become a Colombian tax resident on worldwide income.', u: 'https://www.cancilleria.gov.co/' },
    { k: 'th', c: 'Thailand', n: 'Retirement visa', inc: 1935, fam: 0, save: 23810, age: 50, pension: true, ver: false,
      rule: 'Reported: age 50 or older, and about 65,000 baht a month of pension income or about 800,000 baht in the bank. Rules differ by consulate, so check with the Thai consulate that serves your US state', tax: 'Thailand can tax foreign income you bring in while resident; get local advice.', u: 'https://www.thaievisa.go.th/' },
    { k: 'th2', c: 'Thailand', n: 'LTR wealthy pensioner', short: 'LTR pensioner', inc: 6667, fam: 0, save: null, age: 50, pension: false, ver: true,
      test: (o) => (o.age < 50 ? ['no', 'minimum age 50'] : o.inc >= 6667 ? ['yes', 'income meets the rule'] : o.inc >= 3333 && o.sav >= 250000 ? ['yes', 'income plus a $250,000 Thai investment'] : o.inc >= 5667 || (o.inc >= 3333 && o.sav >= 212500) ? ['close', 'just under the rule'] : ['no', 'income below the rule']),
      rule: 'Age 50 or older and $80,000 a year of passive income, or $40,000 to $80,000 plus a $250,000 investment in Thai bonds, property or a company; health insurance of at least $50,000', tax: 'A 10-year residence with some tax benefits; get local advice.', u: 'https://ltr.boi.go.th/' },
    { k: 'ph', c: 'Philippines', n: 'SRRV Classic', inc: 800, fam: 200, save: 30000, age: 40, pension: true, ver: true,
      test: (o) => { if (o.age < 40) return ['no', 'minimum age 40']; const old = o.age >= 50; const dep = old ? 15000 : 25000, pNeed = o.hh === 2 ? 1000 : 800;
        const noPenNeed = old ? 30000 : 50000;
        if (o.pen >= pNeed && o.sav >= dep) return ['yes', 'pension plus a ' + K(dep) + ' deposit'];
        if (o.sav >= noPenNeed) return ['yes', K(noPenNeed) + ' deposit without a pension'];
        if ((o.pen >= pNeed && o.sav >= dep * 0.85) || o.sav >= noPenNeed * 0.85) return ['close', 'just under the deposit rule'];
        return ['no', o.pen < pNeed ? 'needs a pension, or a larger deposit' : 'deposit below the rule']; },
      rule: 'Age 50+: a $15,000 deposit with a pension of at least $800 a month ($1,000 with dependants), or $30,000 without a pension. Age 40 to 49: $25,000 with a pension, $50,000 without', tax: 'Get local advice on Philippine tax residency.', u: 'https://www.pra.gov.ph/SRRVisa' },
    { k: 'id', c: 'Indonesia (Bali)', n: 'Second home visa', short: 'Bali · Second home visa', inc: 0, fam: 0, save: 111000, age: 0, pension: false, ver: false,
      rule: 'Proof of funds of about 2 billion rupiah (roughly $110,000) for a 5 or 10 year stay', tax: 'Staying 183 days or more can make you an Indonesian tax resident; get local advice.', u: 'https://evisa.imigrasi.go.id/' },
  ];
  SML.widgets.visaFinder = function (root) {
    const id = SML.uid('vf');
    let sel = 'pt';
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title grow">Retirement and passive income visas</span>${ui.seg(id + '-hh', [{ v: '1', label: 'Single' }, { v: '2', label: 'Couple' }], '2', 'Household')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-inc', label: 'Passive income per month (household)', min: 500, max: 8000, step: 100, value: 3000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-pen', label: 'Of which a lifetime pension (e.g. Social Security)', min: 0, max: 5000, step: 100, value: 0, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-sav', label: 'Savings you could deposit', min: 0, max: 300000, step: 5000, value: 50000, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-age', label: 'Your age', min: 30, max: 75, step: 1, value: 45, fmt: (v) => v + ' years' })}
      </div>
      <div class="wg-read">${ui.stat('Likely fit', id + '-ok', 'hl')}${ui.stat('Close', id + '-cl')}${ui.stat('Not yet', id + '-no')}</div>
      <div class="fw-detail" id="${id}-det"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Tap a row for details. Bars show the main monthly income rule, converted at October 2026 rates (€1 = $1.124, 33.6 baht and 3,150 Colombian pesos per dollar). A * marks a reported figure we could not confirm on an official government page: check the consulate. Every visa also needs health insurance, a clean record, housing and paperwork, consulates add their own rules, and amounts change every year.</div>`;
    const fig = $('.wg-fig', root);
    const st = ui.wire(root, () => draw());
    fig.addEventListener('click', (e) => { const h = e.target.closest('[data-k]'); if (!h) return; sel = h.dataset.k; draw(); });
    const judge = (v, o) => {
      const need = v.inc + (o.hh === 2 ? v.fam : 0);
      if (v.test) { const t = v.test(o); return { s: t[0], need, why: t[1] }; }
      const income = v.pension ? o.pen : o.inc;
      if (v.age && o.age < v.age) return { s: 'no', need, why: `minimum age ${v.age}` };
      if (v.save != null && o.sav >= v.save) return { s: 'yes', need, why: 'savings route' };
      if (need > 0 && income >= need) return { s: 'yes', need, why: v.pension ? 'pension meets the rule' : 'income meets the rule' };
      if (need > 0 && income >= need * 0.85) return { s: 'close', need, why: 'just under the income rule' };
      if (v.save != null && o.sav >= v.save * 0.85) return { s: 'close', need, why: 'just under the savings rule' };
      return { s: 'no', need, why: v.pension && o.pen < need ? 'needs a lifetime pension' : need > 0 ? 'income below the rule' : 'savings below the rule' };
    };
    const draw = ui.responsive(fig, (W) => {
      const o = { hh: Number(st.seg(id + '-hh')), inc: st.n(id + '-inc'), pen: Math.min(st.n(id + '-pen'), st.n(id + '-inc')), sav: st.n(id + '-sav'), age: st.n(id + '-age') };
      const rows = VISAS.map((v) => Object.assign({ v }, judge(v, o)));
      const compact = W < 520;
      const padT = 26, axisH = 24, rowH = compact ? 44 : 30;
      const labelW = compact ? 0 : Math.min(240, Math.round(W * 0.36));
      const x0 = compact ? 4 : labelW + 12, x1 = W - (compact ? 10 : 70);
      const mx = Math.max(7000, o.inc * 1.15);
      const xs = SML.lin(0, mx, x0, x1);
      const H = padT + rows.length * rowH + axisH;
      let b = '';
      SML.ticks(0, mx, compact ? 3 : 5).forEach((t) => { b += S.line(xs(t), padT, xs(t), H - axisH + 2, 's-grid') + S.text(xs(t), H - 6, K(t), 'xs mono', t === 0 ? 'start' : 'middle'); });
      const ix = xs(Math.min(o.inc, mx));
      b += S.line(ix, padT - 6, ix, H - axisH + 2, 's-acc w2');
      if (o.pen > 0) { const px = xs(o.pen); b += S.line(px, padT - 6, px, H - axisH + 2, 's-vio w15 dash2'); }
      rows.forEach((r, i) => {
        const y = padT + i * rowH, on = r.v.k === sel, cy = compact ? y + 30 : y + rowH / 2;
        const col = r.s === 'yes' ? 'up' : r.s === 'close' ? 'acc' : 'dn';
        if (on) b += S.rect(0, y + 1, W, rowH - 2, 'f-shade', 4);
        const name = (r.v.k === 'id' ? '' : r.v.c + ' · ') + (r.v.short || r.v.n) + (r.v.ver ? '' : ' *');
        if (compact) b += S.text(x0, y + 14, esc(name), 'sm fw-halo ' + (on ? 'acc b' : 'ink'));
        else b += S.text(labelW, cy + 4, esc(name), (W < 760 ? 'sm ' : 'md ') + (on ? 'acc b' : 'ink'), 'end');
        b += S.line(x0, cy, x1, cy, 's-line');
        if (r.need > 0) { b += S.rect(x0, cy - 4, xs(Math.min(r.need, mx)) - x0, 8, 'f-shade2', 2) + S.line(xs(Math.min(r.need, mx)), cy - 8, xs(Math.min(r.need, mx)), cy + 8, 's-ink w2'); }
        else b += S.text(x0 + 4, compact ? cy + 13 : cy - 6, 'savings only: ' + K(r.v.save), 'xs mono fw-halo');
        if (r.v.pension) b += S.text(xs(Math.min(r.need, mx)) + 6, compact ? cy + 13 : cy - 6, 'pension', 'xs vio fw-halo');
        b += S.circle(compact ? x1 + 4 : x1 + 18, cy, 6, 'f-' + col);
        if (!compact) b += S.text(x1 + 30, cy + 4, r.s === 'yes' ? 'fit' : r.s === 'close' ? 'close' : 'no', 'sm b ' + col);
        b += `<rect x="0" y="${y}" width="${W}" height="${rowH}" class="hit fw-hit" data-k="${r.v.k}"><title>${esc(name)}</title></rect>`;
      });
      const lx = SML.clamp(ix, x0 + 40, x1 - 40);
      b += S.text(lx, 14, 'you: ' + usd0(o.inc) + '/mo', 'sm b acc', 'middle');
      fig.innerHTML = S.wrap(W, H, 'Each visa’s minimum monthly income compared with your passive income (amber line) and lifetime pension (violet dashed line)', b);
      const n = (s) => rows.filter((r) => r.s === s).length;
      $('#' + id + '-ok').textContent = n('yes');
      $('#' + id + '-cl').textContent = n('close');
      $('#' + id + '-no').textContent = n('no');
      const r = rows.find((x) => x.v.k === sel);
      const pill = r.s === 'yes' ? '<span class="pill up">Likely fit</span>' : r.s === 'close' ? '<span class="pill acc">Close</span>' : '<span class="pill dn">Not yet</span>';
      const vpill = r.v.ver ? '<span class="pill info">Official figure</span>' : '<span class="pill">Reported figure: check the consulate</span>';
      $('#' + id + '-det').innerHTML = `<div><p class="fw-h">${esc(r.v.c)}</p><p class="fw-name">${esc(r.v.n)}</p><div class="fw-vrow">${pill}${vpill}</div>
        <div class="fw-vrow"><span class="fw-h">Main money rule</span><b>${r.need > 0 ? 'about ' + usd0(r.need) + ' a month' : 'about ' + usd0(r.v.save) + ' in savings'}</b></div>
        <p class="fw-sub">${esc(r.v.rule)}. ${r.v.age ? 'Minimum age ' + r.v.age + '. ' : ''}Your result: ${esc(r.why)}.</p></div>
        <div><p class="fw-h">Tax and next steps</p><ul class="fw-notes"><li>${esc(r.v.tax)}</li><li>Living there usually makes you a tax resident; the US still taxes you as a citizen. See <a href="#l-us-tax-abroad">US taxes follow you abroad</a>.</li><li><a href="${esc(r.v.u)}" target="_blank" rel="noopener noreferrer">Official immigration site</a>: check the current amount and documents.</li></ul></div>`;
      const yes = rows.filter((x) => x.s === 'yes').map((x) => x.v.c);
      $('#' + id + '-msg').innerHTML = yes.length
        ? ui.msg('up', yes.length + ' likely', `With ${usd0(o.inc)} a month${o.sav ? ' and ' + K(o.sav) + ' in savings' : ''}, the main money rule looks met for ${Array.from(new Set(yes)).slice(0, 5).join(', ')}${yes.length > 5 ? ' and more' : ''}. The paperwork is the next hurdle.`)
        : ui.msg('dn', 'Not yet', `None of these main money rules is met yet. Raise passive income, add a pension, or use a savings route.`);
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  const SRC = {
    numVal: { t: 'Numbeo: cost of living in Valencia (October 2026)', u: 'https://www.numbeo.com/cost-of-living/in/Valencia' },
    numInd: { t: 'Numbeo: cost of living in Indianapolis (October 2026)', u: 'https://www.numbeo.com/cost-of-living/in/Indianapolis' },
    expSF: { t: 'Expatistan: cost of living in San Francisco', u: 'https://www.expatistan.com/cost-of-living/san-francisco' },
    fpl: { t: 'HealthCare.gov: federal poverty level', u: 'https://www.healthcare.gov/glossary/federal-poverty-level-fpl/' },
    escapees: { t: 'Escapees RV Club: choosing a domicile', u: 'https://www.escapees.com/knowledge/domicile/' },
    safetywing: { t: 'SafetyWing: nomad insurance plans and prices', u: 'https://safetywing.com/nomad-insurance' },
    usda: { t: 'USDA: the cost of raising a child', u: 'https://www.usda.gov/media/blog/2017/01/13/cost-raising-child' },
    ccaa: { t: 'Child Care Aware of America: Child Care in America, 2025 price and supply', u: 'https://info.childcareaware.org/price-and-supply-2025' },
    cb: { t: 'College Board: Trends in College Pricing and Student Aid 2025', u: 'https://newsroom.collegeboard.org/trends-college-pricing-and-student-aid-report-published-tuition-prices-public-institutions-and' },
    ira: { t: 'IRS: IRA contribution limits (spousal IRA)', u: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits' },
    esNlv: { t: 'Spanish consulate, Los Angeles: non-lucrative residence visa', u: 'https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-residencia-no-lucrativa.aspx' },
    mx: { t: 'Consulate of Mexico in San Diego: temporary resident visa, economic solvency (2026)', u: 'https://consulmex.sre.gob.mx/sandiego/images/visas/ingles/5a_Temporary_Resident_Visa_-_Economic_Solvency.pdf' },
    ph: { t: 'Philippine Retirement Authority: SRRV options', u: 'https://www.pra.gov.ph/SRRVisa' },
  };

  SML.lessons.push({
    id: 'l-geo-arbitrage', course: 'fi-where', order: 1, title: 'Where your money goes furthest', mins: 9, level: 'Beginner',
    summary: 'The same life costs very different amounts in different places.',
    idea: 'The same savings buy a very different life in different places. A cheaper place shrinks your FIRE number.',
    widget: 'cityCompare',
    try: 'Pick your household and lifestyle, then tap places to compare monthly costs and FIRE numbers.',
    body: [
      '<h3>What geographic arbitrage means</h3><p><b>Geographic arbitrage</b> means earning or saving in a high-cost place and living in a cheaper one. Your FIRE number is roughly 25 times your yearly spending at a 4% withdrawal rate. So every $1,000 a month you cut from living costs lowers the number by about $300,000.</p>',
      '<h3>What really drives the bill</h3><ul><li><b>Housing</b> is the biggest line almost everywhere, and the one that changes most between places.</li><li><b>Health cover</b> is the American wildcard. Before 65, a full-price marketplace plan for two people in their 50s can cost around $2,000 a month. Subsidies depend on MAGI (modified adjusted gross income): under 2026 rules a couple with MAGI near $42,300 pays about $230 a month for a benchmark plan, and at $80,000 about $664 (see <a href="#l-aca">Health insurance before 65</a>). Abroad, residents often use cheaper public systems or local private plans.</li><li><b>Flights home</b> for holidays, weddings and aging parents.</li><li><b>Visas and admin</b>: renewals, translations, lawyers and residence cards.</li><li><b>Currency</b>: if the dollar falls 20%, a life priced in euros costs 25% more in dollars.</li></ul>',
      '<h3>Rough couple budgets, October 2026</h3><p>What a couple spends a month including rent for a one-bedroom, before health insurance, visas, travel and tax (Numbeo, plus Expatistan for San Francisco). Add 10% to 25% for those extras.</p><ul><li><b>Chiang Mai</b>, Thailand: about $1,400 to $1,550.</li><li><b>Bali</b>, Indonesia: about $1,750 to $2,150.</li><li><b>Mérida</b>, Mexico: about $1,900 to $2,050; <b>Mexico City</b>: about $2,200 to $2,550.</li><li><b>Medellín</b>, Colombia: about $2,300 to $2,750.</li><li><b>Porto</b>: about $2,550 to $2,900; <b>Lisbon</b>: about $2,900 to $3,300.</li><li><b>Valencia</b>, Spain: about $2,700 to $3,050.</li><li><b>Costa Rica</b> (San José area): about $2,750 to $2,950.</li><li><b>Paris</b>: about $3,550 to $3,900; <b>rural France</b>: a rough $2,000 to $2,600, with a car.</li><li><b>Indianapolis</b>: about $3,750 to $4,100 plus health insurance; <b>San Francisco</b>: an estimated $8,000 to $9,500.</li></ul>',
      '<h3>What cost-of-living sites miss</h3><p>Survey sites average what locals and foreigners report. They miss the expat premium in popular neighborhoods, furnished short-term rentals that cost far more than a local one-year lease, imported goods, international schools, a car where you need one, and air conditioning in hot places. Use them to compare places, then build your own budget.</p>',
      '<h3>Taxes travel with you</h3><p>The FIRE numbers here are before tax. Moving abroad does not end US taxes: as a citizen you file a US return wherever you live. Your new country will usually tax you as a resident too, often on worldwide dividends, interest and gains, and the US 0% capital gains band does nothing to reduce that foreign tax. Build a host-country tax line into your budget with a cross-border tax adviser, and read <a href="#l-us-tax-abroad">US taxes follow you abroad</a> and <a href="#l-treaty-france">the France example</a>. Inside the US, moving to a state with no income tax is a smaller but simpler win.</p>',
      '<h3>Rent or buy abroad?</h3><p>Rent first, for at least a year. Many countries limit what foreigners can own: in Indonesia, foreigners generally cannot own freehold land, so a “house in Bali” is usually a long lease or held through a legal structure, and other countries restrict land near coasts or borders. Check the current rules with a local lawyer. Buying also ties your money to a foreign currency and market, adds transaction costs and can be slow to sell if you change your mind.</p>',
      '<h3>Try before you move</h3><p>Rent for one to three months, ideally in the less pleasant season, and track every dollar. Check the visa rules (<a href="#l-visas">Visas for early retirees</a>), health care and how far you will be from family. Many people split the year, or keep a small base at home for the first year.</p>',
    ],
    example: {
      title: 'One couple, three places',
      intro: 'A couple in their early 50s compares the same comfortable life in three places, at a 4% withdrawal rate.',
      steps: [
        'In a US big city the life costs about $11,350 a month, including about $2,000 for full-price health insurance. That is $136,200 a year, so they would need about $3.4 million invested.',
        'In a Midwest city it costs about $6,400 a month ($76,800 a year), a FIRE number of $1.92 million. If they keep their MAGI near $42,300, a marketplace subsidy cuts health cover to about $230 a month and the number to about $1.39 million; at $80,000 of MAGI they would pay about $664 a month.',
        'In Valencia it costs about $3,760 a month, including Spanish private health insurance and flights home: $45,120 a year, a FIRE number of about $1.13 million before Spanish tax.',
        'They test currency risk. If the dollar falls 20% against the euro, everything priced in euros costs 25% more in dollars: about $4,610 a month, and a number of about $1.38 million.',
        'Spain taxes residents on worldwide income, including dividends and gains, and the US 0% capital gains band does not cancel that. With $1.25 million invested they fall short once Spanish tax and a weak dollar are added, so they ask a cross-border adviser to add a tax line, plan a three-month trial stay and save one more year.',
      ],
      result: 'Same life, three places: about $3.4 million, $1.9 million or $1.1 million before tax. Housing, health cover and the host country’s taxes make most of the difference.',
    },
    mistakes: [
      'Budgeting from a two-week holiday. Tourist prices and short-term rentals cost far more than a local one-year lease, and a holiday skips the boring bills.',
      'Leaving out the lines that cost-of-living sites skip: health insurance, flights home, visa renewals and a buffer for currency swings.',
      'Assuming a cheaper country means lower taxes. US citizens file US taxes everywhere, and the new country usually taxes residents on worldwide investment income too.',
      'Selling everything before a trial stay. Family, health care, language and loneliness send many people home within a few years.',
    ],
    points: [
      'Every $1,000 a month you cut from spending lowers your FIRE number by about $300,000 at a 4% withdrawal rate.',
      'Housing and health cover decide most of the gap between places.',
      'Keep a cushion of 10% to 20% of spending for currency moves, and budget flights home and visa costs.',
      'Add a host-country tax line: the numbers here are before tax.',
      'Rent first, for a few months, before you commit.',
    ],
    terms: ['Geographic arbitrage', 'Cost of living', 'Currency risk', 'FIRE number', 'Withdrawal rate', 'Passive income visa'],
    quiz: { q: 'At a 4% withdrawal rate, how much does cutting spending by $1,000 a month lower your FIRE number?', options: ['About $12,000', 'About $300,000', 'About $48,000'], answer: 1, why: '$1,000 a month is $12,000 a year, and 25 times that is $300,000.' },
    sources: [SRC.numVal, SRC.numInd, SRC.expSF, SRC.fpl],
  });

  SML.lessons.push({
    id: 'l-van-life', course: 'fi-where', order: 2, title: 'Van, RV, trailer or house?', mins: 8, level: 'Beginner',
    summary: 'What a home on wheels really costs, and where you legally live.',
    idea: 'A home on wheels swaps rent for fuel, campsites, repairs and lost value. It is cheaper only if you buy used and drive slowly.',
    widget: 'nomadCost',
    try: 'Pick a home, set its price, your miles and how often you pay for a campsite, then compare the monthly bills.',
    body: [
      '<h3>The hidden rent: lost value</h3><p>A van or motorhome loses value every year you own it. That drop is a real cost, even though no bill arrives. A $60,000 van that loses about 10% a year is worth about $39,400 after four years: roughly $430 a month. Motorhomes usually lose value faster. Buying used and keeping it longer are the biggest savings.</p>',
      '<h3>What the vehicle costs</h3><p>Rough ranges reported by full-timers, not quotes: a used van about $30,000 to $70,000; a new professional van build about $80,000 to $200,000 or more; a travel trailer about $20,000 to $60,000, plus a truck big enough to tow it, which can cost as much again; large Class A motorhomes from about $100,000 to well over $500,000. Trailers and motorhomes often lose 20% to 30% of their value in the first few years, so a lightly used one can be the best buy.</p>',
      '<h3>Fuel and miles</h3><p>Moving costs money. At 17 miles per gallon and $3.30 a gallon, 10,000 miles a year is about $160 a month of fuel; a motorhome at 8 mpg burns more than twice that. The cheapest nomads move slowly and stay in one area for weeks.</p>',
      '<h3>Where you sleep</h3><ul><li><b>Paid campgrounds and RV parks</b> charge by the night, with weekly and monthly rates that cost less per night.</li><li><b>Free camping</b> on public land (boondocking) costs little, but stays in one spot are usually limited to about two weeks, and you need water, a dump station and showers.</li><li><b>Memberships</b> and friends’ driveways fill the gaps.</li></ul>',
      '<h3>A home state on paper</h3><p>Full-timers still need a legal home, called a <b>domicile</b>. Florida, South Dakota and Texas are the most popular choices: none has a state income tax, and mail-forwarding services there give you a street address. Your driver’s license, vehicle registration, insurance rates, voting and jury duty all follow that state.</p>',
      '<h3>Health insurance on the road</h3><p>Marketplace plans are sold by the area of your domicile, and many cover routine care only in a local network, with emergencies covered elsewhere. A plan bought in South Dakota may not cover a routine checkup in Arizona. Look for plans with national or PPO networks, or plan routine care for when you are home. See <a href="#l-aca">Health insurance before 65</a>.</p>',
      '<h3>Plan the exit</h3><p>Many people road-trip for two to five years, then settle. Keep a repair fund (a roof leak or transmission can cost thousands and leave you without a home for a week), and think about resale before you buy.</p>',
    ],
    example: {
      title: 'Four years in a used van',
      steps: [
        'A couple buys a used camper van for $60,000 and plans four years on the road, driving 10,000 miles a year.',
        'If the van loses about 10% a year, it is worth about $39,400 after four years. That $20,600 drop is about $430 a month: their hidden rent.',
        'Fuel at 17 mpg and $3.30 a gallon is about $160 a month. Paying for a campsite 40% of nights at $38 is about $480 a month, including small costs on free nights.',
        'Insurance ($165), repairs and upkeep (about $175) and internet, mail and phone (about $175) bring the total to about $1,585 a month.',
        'A small-town rental with one car would cost about $2,225 a month for the same things, so the van saves about $640 a month: $7,670 a year, or about $190,000 off a FIRE number at 4%.',
      ],
      result: 'The van wins because it was bought used and moves slowly. A $110,000 motorhome would lose about $1,100 a month in value alone.',
    },
    mistakes: [
      'Counting fuel and campsites but forgetting that the vehicle loses thousands of dollars of value every year.',
      'Buying a new $150,000 build for a lifestyle you have not tried. Rent one for a few weeks first.',
      'Choosing a domicile state without checking how its health plans work when you are far from home.',
      'No repair fund. A breakdown can cost thousands and leave you paying for a hotel while you wait.',
    ],
    points: [
      'Lost value is the hidden rent of a vehicle home: buy used and keep it longer.',
      'Driving less and staying longer in each place are the biggest monthly savings.',
      'Your domicile state decides your taxes, license, insurance and health plan network.',
      'Keep a repair fund and a plan for when you stop.',
    ],
    terms: ['Domicile', 'Cost of living', 'Emergency fund', 'ACA marketplace', 'FIRE number'],
    glossary: [
      { t: 'Boondocking', d: 'Camping for free without hookups, often on public land, with limits on how long you can stay.' },
      { t: 'Mail-forwarding service', d: 'A company that gives full-time travellers a street address and sends their mail on.' },
    ],
    quiz: { q: 'Which cost do new van-lifers most often forget?', options: ['Fuel', 'The van losing value every year', 'Campsite fees'], answer: 1, why: 'No bill arrives for it, but a van that loses 10% a year costs hundreds of dollars a month.' },
    sources: [SRC.escapees],
  });

  SML.lessons.push({
    id: 'l-travel-budget', course: 'fi-where', order: 3, title: 'Budget for a life of travel', mins: 7, level: 'Beginner',
    summary: 'Slow travel, flights home and insurance: what a travelling retirement costs.',
    idea: 'Travel costs fall fast the longer you stay in each place. Budget travel as a yearly line, then multiply it by 25.',
    widget: 'travelBudget',
    try: 'Switch between trips from home and full-time travel, then drag the dot to change how long you stay in each place.',
    body: [
      '<h3>Two ways to travel</h3><p><b>Trips from a home base</b> come on top of your normal costs: rent or a mortgage keeps running while you are away. <b>Full-time travel</b> replaces housing, so compare it with your whole home budget instead of adding it on.</p>',
      '<h3>Why slow travel is cheaper</h3><p>Flights are a fixed cost per move. Stay three days and each day carries a big share of the flight; stay a month and the flight almost disappears. Longer stays also unlock weekly and monthly rental discounts, let you cook, and are far less tiring.</p>',
      '<h3>The lines to budget</h3><ul><li><b>Flights</b>, including trips home for family events.</li><li><b>Lodging</b>, nightly or monthly.</li><li><b>Food, local transport and activities</b>, often the biggest line.</li><li><b>Insurance</b>: trip insurance for trips; travel medical or international health insurance for full-timers.</li><li><b>Admin</b>: visas, phone plans, a storage unit or car insurance back home.</li></ul>',
      '<h3>Health cover when you are away</h3><p>Medicare generally does not cover care outside the US, and many US plans cover only emergencies abroad. Travel medical plans for nomads are cheap but limited (they often exclude pre-existing conditions) and are not full health insurance. See <a href="#l-expat-health">Health care and insurance abroad</a>.</p>',
      '<h3>Travel in your FIRE number</h3><p>Every $1,000 a year of travel needs about $25,000 invested at a 4% withdrawal rate. Many retirees travel most in their first active years and less later, so some keep a separate travel fund for the early years instead of raising their spending forever. Pay with a card with no foreign transaction fee and always pay in local currency (<a href="#l-travel-money">Travel money with no foreign fees</a>).</p>',
    ],
    example: {
      title: 'Three short trips or one long stay',
      steps: [
        'A couple plans three two-week trips a year, mid-range, with $700 round-trip flights each.',
        'Flights: 3 trips × 2 people × $700 = $4,200.',
        'Lodging at $95 a night with a weekly discount of about 15% comes to about $3,390. Food, transport and activities at $65 per person per day add $5,460, and trip insurance at 5% adds about $650. Total: about $13,700 a year.',
        'At a 4% withdrawal rate that travel needs about $343,000 invested (25 × $13,700).',
        'The same 42 days as one six-week stay needs one set of flights ($1,400) and gets a monthly rental rate about 40% off: about $9,700 a year in all.',
      ],
      result: 'Staying longer in one place saves about $4,000 a year, or about $100,000 off the FIRE number, for the same number of days away.',
    },
    mistakes: [
      'Budgeting flights and hotels but not daily spending, which is often the biggest line.',
      'Assuming Medicare or a US health plan covers you abroad. It usually does not, so you need travel or international health insurance.',
      'Moving every few days for months. Costs and fatigue both climb.',
      'Forgetting the bills at home while you are away: storage, car insurance, a phone plan or rent you still pay.',
    ],
    points: [
      'Every $1,000 a year of travel adds about $25,000 to your FIRE number at 4%.',
      'Longer stays spread flight costs and unlock monthly discounts.',
      'Trips from home add to your budget; full-time travel replaces housing.',
      'Budget insurance and flights home as their own lines.',
    ],
    terms: ['FIRE number', 'Withdrawal rate', 'Foreign transaction fee', 'Dynamic currency conversion', 'Expat health insurance', 'Currency risk'],
    glossary: [
      { t: 'Slow travel', d: 'Staying weeks or months in each place instead of days, which lowers costs and stress.' },
      { t: 'Trip insurance', d: 'Insurance for one trip that covers cancellations, delays and emergency medical care abroad.' },
    ],
    quiz: { q: 'Why does a day of travel cost less on a month-long stay than on a 5-day trip?', options: ['Food gets cheaper the longer you stay', 'The flight is spread over more days and monthly rentals are discounted', 'Insurance is free after 30 days'], answer: 1, why: 'Fixed costs like flights shrink per day, and monthly rental rates are lower per night.' },
    sources: [SRC.safetywing],
  });

  SML.lessons.push({
    id: 'l-household', course: 'fi-where', order: 4, title: 'Partners, kids and your number', mins: 8, level: 'Intermediate',
    summary: 'How a partner and children change spending, and the number, over time.',
    idea: 'Children raise spending for about twenty years, then it falls. Plan that bump on its own instead of funding the peak forever.',
    widget: 'householdFire',
    try: 'Pick a household, set the ages and costs, and see when spending peaks and where it settles.',
    body: [
      '<h3>Two adults, one plan</h3><ul><li>Count both partners’ net worth and plan one shared budget: two people living together spend less than two singles.</li><li>A partner with little or no pay can still save: a <b>spousal IRA</b> lets a non-working spouse contribute based on the working spouse’s pay (2026 limit $7,500, or $8,600 at 50 and over). See <a href="#l-ira">When to open an IRA</a>.</li><li>Plan Social Security together: spousal and survivor benefits depend on both records (see <a href="#l-ss-early">Social Security when you stop early</a>).</li><li>While the plan depends on one income, protect it with term life and disability insurance (<a href="#l-insurance">Insurance you actually need</a>).</li></ul>',
      '<h3>What children cost</h3><p>The USDA estimated about $233,600 in 2015 dollars to raise a child born that year through age 17 in a middle-income married family, roughly $13,000 a year, not counting college. Childcare is the biggest early line: the US average was about $13,200 a year in 2025. Larger families spend less per child.</p>',
      '<h3>The bump, not a new baseline</h3><p>Kid costs last roughly 18 to 22 years. If you set your FIRE number at peak spending, you over-save for the decades after they leave. Instead, aim for your long-run spending times 25 and plan the kid years separately: from income while you still work, a 529 plan, or a side pot you spend down.</p>',
      '<h3>College</h3><p>The College Board’s average full budget for 2025-26 was about $31,000 a year at a public in-state college and about $65,500 at a private one. A <a href="#l-kids-money">529 plan</a> grows tax-free for this. Money in 401(k)s and IRAs is not counted as an asset on the federal aid form (FAFSA), and the low income of an early retiree can raise aid.</p>',
      '<h3>Kids abroad and health cover</h3><p>Local public schools abroad can be free but teach in a new language; international schools often charge as much as a US private school, so get real quotes before you plan. In the US, marketplace subsidies depend on household size, so a family of four can earn more before hitting the subsidy cliff (see <a href="#l-aca">Health insurance before 65</a>).</p>',
    ],
    example: {
      title: 'Two little ones, one plan',
      steps: [
        'A couple spends $58,000 a year on themselves and has two children, aged 1 and 3.',
        'Today they spend about $114,400: $58,000 for the adults, $15,000 per child, and about $1,100 a month of childcare for each child under 5.',
        'Childcare ends in four years and spending falls to $88,000. It rises again when college overlaps: about $120,000 in year 17, with both kids in public college at about $31,000 each.',
        'From year 21 the kids are gone and spending settles at $58,000. Their long-run FIRE number is $1.45 million (25 × $58,000).',
        'The kid years add about $807,000 of extra spending in total. Funding the $120,000 peak forever would need about $3 million; $1.45 million plus a separate $807,000 for the kid years needs about $2.26 million.',
      ],
      result: 'Treating the kids as a 20-year bump, not a new forever budget, cuts the target by about $740,000. Work income, a 529 and steady saving can carry much of the bump.',
    },
    mistakes: [
      'Using today’s spending, with toddlers in daycare, as your forever number.',
      'Ignoring the partner with few work years: a spousal IRA and spousal Social Security benefits both help.',
      'Going without life or disability insurance while the whole plan rests on one income.',
      'Saving for college before your own retirement. College can be borrowed for; retirement cannot.',
    ],
    points: [
      'Plan as a household: one budget, both partners’ accounts and both Social Security records.',
      'Kid costs are a bump of about 20 years. Fund it separately from your long-run number.',
      'Childcare and college are the two biggest peaks; a 529 helps with the second.',
      'Protect the plan with insurance while children depend on your income.',
    ],
    terms: ['FIRE number', '529 plan', 'Spousal IRA', 'Term life insurance', 'Savings rate'],
    glossary: [{ t: 'FAFSA', full: 'Free Application for Federal Student Aid', d: 'The form that decides US federal college aid. Retirement accounts are not counted as assets on it.' }],
    quiz: { q: 'Why can a FIRE number based on peak child-rearing spending over-save?', options: ['Children cost nothing after age 5', 'Kid costs last about twenty years and then fall, so the peak is not your long-run spending', 'College is always free'], answer: 1, why: 'After the kid years your spending drops back, so funding the peak forever leaves you with far more than you need.' },
    sources: [SRC.usda, SRC.ccaa, SRC.cb, SRC.ira],
  });

  SML.lessons.push({
    id: 'l-visas', course: 'fi-where', order: 5, title: 'Visas for early retirees', mins: 9, level: 'Intermediate',
    summary: 'Passive income and retirement visas: who qualifies and what comes with them.',
    idea: 'To live abroad longer than a tourist stay you need a residence visa. Most retiree visas ask for steady passive income or savings.',
    widget: 'visaFinder',
    try: 'Set your passive income, pension, savings and age, then tap a visa to see its main money rule.',
    body: [
      '<h3>A tourist stay is not residency</h3><p>Americans can visit much of Europe’s Schengen area for up to 90 days in any 180-day period, and other countries set their own tourist limits. Living somewhere longer needs a residence visa or permit. Overstaying can bring fines and bans.</p>',
      '<h3>The visas early retirees use</h3><ul><li><b>Passive income visas</b> accept steady income from dividends, interest, rent or pensions (Portugal’s D7, Spain’s non-lucrative visa, France’s visitor visa).</li><li><b>Pensioner visas</b> generally need a lifetime pension, such as Social Security; Costa Rica, Panama and Colombia are reported to work this way. If you stop at 45, Social Security will not start until 62 at the earliest, though some programs may accept a lifetime annuity you buy. Check each one.</li><li><b>Savings or deposit routes</b> accept money in the bank: Spain counts sufficient funds for the first year, Mexico checks bank balances at some consulates, and Costa Rica’s rentista route is reported at $2,500 a month for two years or a $60,000 deposit. Thailand, the Philippines and Indonesia have deposit routes too.</li><li><b>Digital nomad visas</b> need income from remote work, so they usually do not fit a fully retired person.</li></ul>',
      '<h3>What every application asks for</h3><p>Proof of income or savings (bank statements, often for six to twelve months), health insurance, a criminal record check, a place to live, and documents with official stamps (apostilles) and translations. Most residence permits must be renewed, and many require you to spend a minimum time in the country each year.</p>',
      '<h3>Residency usually means tax residency</h3><p>Living somewhere most of the year usually makes you a tax resident there, while the US keeps taxing you as a citizen. Some countries offer special regimes for newcomers or pensioners; others tax worldwide income or wealth. Read <a href="#l-us-tax-abroad">US taxes follow you abroad</a> and <a href="#l-treaty-france">the France example</a> before you choose.</p>',
      '<h3>Plan your path</h3><p>Visit first, read the official consulate page for your region (amounts change each year with minimum wages and exchange rates), and budget a few months for paperwork. For anything unusual, an immigration lawyer in the country is worth the fee. Think ahead too: permanent residency and citizenship rules differ a lot between countries.</p>',
    ],
    example: {
      title: 'A couple at 52 checks the doors',
      intro: 'Figures marked as reported should be confirmed with the consulate.',
      steps: [
        'A couple aged 52 lives on about $3,200 a month from dividends and a small rental. They have no pension yet and $70,000 in cash they could deposit.',
        'Spain’s non-lucrative visa asks a couple to show €36,000 a year, about $3,370 a month. Their income is a little short, but the consulate accepts proof of sufficient funds for the first year, so their $70,000 (about €62,000) likely qualifies. They confirm with the consulate.',
        'Portugal’s D7 is reported at about the Portuguese minimum wage plus 50% for a spouse, roughly $1,550 a month, so they likely qualify; they confirm with the consulate.',
        'Pensioner visas in Costa Rica, Panama and Colombia generally need a lifetime pension, so they would likely wait for Social Security at 62 or later. Costa Rica’s rentista route, reported at $2,500 a month for two years or a $60,000 deposit, could work now.',
        'Thailand’s retirement visa for over-50s is reported at about 800,000 baht (about $23,800) in the bank, and the Mexican consulate in San Diego accepts a minimum monthly balance of at least $68,241 over the last twelve months. Both look within reach; they check the rules with the consulates that serve their state.',
      ],
      result: 'Several doors are open, but each also needs health insurance, a background check and translated paperwork, and living there usually makes them tax residents.',
    },
    mistakes: [
      'Planning around a digital nomad visa after you stop working. Those visas need work income.',
      'Counting portfolio withdrawals as income when a visa wants a pension or regular payments. Read exactly what counts.',
      'Forgetting that becoming a resident usually makes you a tax resident too.',
      'Relying on blog figures. Amounts change with minimum wages and exchange rates, and each consulate can add its own rules.',
    ],
    points: [
      'Tourist stays are short; living abroad needs a residence visa.',
      'Passive income visas fit most early retirees; pensioner visas wait for Social Security.',
      'Savings and deposit routes can work when your income is low.',
      'Always confirm the current amount on the official consulate page.',
    ],
    terms: ['Passive income visa', 'Tax residency', 'Expat health insurance', 'Currency risk', 'Citizenship-based taxation'],
    glossary: [
      { t: 'Schengen area', d: 'A group of European countries with shared border rules. US tourists can stay up to 90 days in any 180-day period.' },
      { t: 'Apostille', d: 'An official stamp that makes a public document, such as a background check, valid in another country.' },
    ],
    quiz: { q: 'You are 48, retired, and live on dividends. Which visa type is usually closed to you for now?', options: ['A passive income visa', 'A pensioner visa that requires a lifetime pension', 'A savings-deposit route'], answer: 1, why: 'Pensioner visas generally need a lifetime pension such as Social Security, which starts at 62 at the earliest.' },
    sources: [SRC.esNlv, SRC.mx, SRC.ph],
  });
})();
