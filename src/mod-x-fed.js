/* The Fed & Interest Rates (fork M1): how the economy moves stocks, how the Fed works, rates/yields/yield curve. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const $id = (x) => document.getElementById(x);
  const setT = (id, txt, cls) => { const el = $id(id); if (!el) return; el.textContent = txt; el.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const setMsg = (id, cls, pill, html) => { const el = $id(id); if (el) el.innerHTML = ui.msg(cls, pill, html); };
  const p2 = (v) => F.num(v, 2) + '%';
  const usd0 = (v) => F.usd(Math.round(v), 0);
  const tw = (s, px) => String(s).length * (px || 11.5) * 0.56;

  SML.css(`
    .xf [hidden]{display:none!important}
    .xf-assets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--line)}
    @media(max-width:560px){.xf-a{padding:10px 6px}.xf-a span{font-size:9px;letter-spacing:.06em}.xf-a b{font-size:22px}.xf-a small{font-size:11px}}
    .xf-a{background:var(--surface);padding:12px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
    .xf-a span{font:600 10.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .xf-a b{font-family:var(--display);font-weight:400;font-size:26px;line-height:1;color:var(--ink)}
    .xf-a small{font-size:12.5px;color:var(--muted);line-height:1.35}
    .xf-a.up b{color:var(--up)} .xf-a.dn b{color:var(--down)} .xf-a.mix b{color:var(--violet)} .xf-a.flat b{color:var(--muted)}
    .xf-sect{display:flex;flex-direction:column;gap:8px;padding:12px 16px}
    .xf-sect p{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font:600 10.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .xf-chip{font:500 12.5px/1.2 var(--sans);letter-spacing:0;text-transform:none;border-radius:999px;padding:5px 10px;border:1px solid var(--line)}
    .xf-chip.up{color:var(--up);border-color:color-mix(in srgb,var(--up) 40%,transparent);background:color-mix(in srgb,var(--up) 8%,transparent)}
    .xf-chip.dn{color:var(--down);border-color:color-mix(in srgb,var(--down) 40%,transparent);background:color-mix(in srgb,var(--down) 8%,transparent)}
    .xf-stmt{padding:14px 16px;font:500 13.5px/1.6 var(--mono);color:var(--ink);background:var(--bg)}
    .xf-stmt i{font-style:normal;color:var(--accent)}
    .xf-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
    .xf-legend i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px;vertical-align:-1px;background:var(--c)}
    .xf-ctl[hidden]{display:none!important}
  `);

  /* ======================================================================
     macroMap: cause and effect from a macro shock to stocks, bonds, gold, the dollar
     ====================================================================== */
  const MM_NODES = {
    oil: { r: 0, c: 0, l: 'Oil price', s: 'Oil' },
    inf: { r: 0, c: 1, l: 'Inflation', s: 'Inflation' },
    fed: { r: 0, c: 2, l: 'Fed rate', s: 'Fed rate' },
    jobs: { r: 1, c: 0, l: 'Jobs', s: 'Jobs' },
    gdp: { r: 1, c: 1, l: 'Growth', s: 'Growth' },
    yld: { r: 1, c: 2, l: 'Bond yields', s: 'Yields' },
    usd: { r: 2, c: 0, l: 'Dollar', s: 'Dollar' },
    eps: { r: 2, c: 1, l: 'Earnings', s: 'Earnings' },
    stk: { r: 2, c: 2, l: 'Stock prices', s: 'Stocks' },
  };
  const MM_SHOCKS = [
    { k: 'cpi', label: 'Hot inflation report', start: ['inf', 'up'],
      edges: [
        ['inf', 'fed', 'up', 'Prices rising faster than forecast make the Fed more likely to hike, or to cut later than hoped.'],
        ['fed', 'yld', 'up', 'Traders price in a higher path for rates, so Treasury yields jump, the 2-year most.'],
        ['yld', 'stk', 'dn', 'Higher yields shrink what future profits are worth today, so stock prices fall, growth stocks the most.'],
        ['fed', 'usd', 'up', 'Higher US rates attract money from abroad, so the dollar tends to rise.'],
        ['yld', 'gdp', 'dn', 'Over the following months, pricier mortgages and loans slow spending and hiring.'],
      ],
      assets: { stk: ['dn', 'Usually down'], bnd: ['dn', 'Prices fall'], gold: ['mix', 'Mixed'], usd: ['up', 'Usually up'], oil: ['flat', 'Little change'] },
      help: ['Energy', 'Banks', 'Value stocks'], hurt: ['Tech and growth', 'Real estate', 'Small caps', 'Homebuilders'],
      sum: 'Inflation above forecast usually means higher yields and lower stock prices that day. What matters is the surprise, not the level.' },
    { k: 'cut', label: 'Fed cuts rates', start: ['fed', 'dn'],
      edges: [
        ['fed', 'yld', 'dn', 'Short-term yields fall almost one for one. Long-term yields fall less, and can even rise if investors fear inflation.'],
        ['yld', 'stk', 'up', 'Lower yields raise what future profits are worth today, which supports stock prices.'],
        ['fed', 'usd', 'dn', 'Lower US rates make dollar savings less attractive, so the dollar tends to slip.'],
        ['yld', 'gdp', 'up', 'Cheaper credit helps home buying, car loans and business investment, with a lag of months.'],
        ['gdp', 'eps', 'up', 'Stronger spending lifts company sales and profits.'],
        ['eps', 'stk', 'up', 'Higher expected earnings push prices up again.'],
      ],
      assets: { stk: ['up', 'Usually up'], bnd: ['up', 'Prices rise'], gold: ['up', 'Usually up'], usd: ['dn', 'Usually down'], oil: ['flat', 'Little change'] },
      help: ['Small caps', 'Homebuilders', 'Real estate', 'Tech and growth'], hurt: ['Savers in cash', 'Bank lending margins'],
      sum: 'Rate cuts usually help stocks. The big exception: when the Fed cuts because a recession has already started, falling profits win.' },
    { k: 'oil', label: 'Oil price spike', start: ['oil', 'up'],
      edges: [
        ['oil', 'inf', 'up', 'Gasoline, shipping and plastics cost more, so headline inflation rises within weeks.'],
        ['inf', 'fed', 'up', 'Higher inflation makes the Fed slower to cut, or more likely to hike.'],
        ['fed', 'yld', 'up', 'Fewer expected cuts push yields up.'],
        ['oil', 'gdp', 'dn', 'Families spend more on fuel and less on everything else, so growth slows.'],
        ['gdp', 'eps', 'dn', 'Airlines, shippers and retailers face higher costs and weaker demand.'],
        ['eps', 'stk', 'dn', 'Lower expected profits pull most stocks down. Energy producers are the exception.'],
      ],
      assets: { stk: ['dn', 'Most fall'], bnd: ['dn', 'Prices fall'], gold: ['up', 'Usually up'], usd: ['mix', 'Mixed'], oil: ['up', 'Up'] },
      help: ['Oil and gas producers', 'Energy services', 'Pipelines'], hurt: ['Airlines', 'Trucking and shipping', 'Consumer discretionary', 'Chemicals'],
      sum: 'An oil spike works like a tax on consumers and pushes inflation up at the same time. That mix is hard on stocks and on the Fed.' },
    { k: 'rec', label: 'Recession scare', start: ['jobs', 'dn'],
      edges: [
        ['jobs', 'gdp', 'dn', 'Fewer paychecks mean less spending, so the economy slows.'],
        ['gdp', 'eps', 'dn', 'Analysts cut sales and profit forecasts.'],
        ['eps', 'stk', 'dn', 'Lower expected profits pull stock prices down, cyclical companies the most.'],
        ['gdp', 'inf', 'dn', 'Weaker demand cools inflation.'],
        ['inf', 'fed', 'dn', 'Markets bet the Fed will cut rates to support jobs.'],
        ['fed', 'yld', 'dn', 'Yields fall as money runs to the safety of Treasuries and cuts get priced in.'],
      ],
      assets: { stk: ['dn', 'Usually down'], bnd: ['up', 'Prices rise'], gold: ['up', 'Usually up'], usd: ['mix', 'Mixed'], oil: ['dn', 'Usually down'] },
      help: ['Utilities', 'Consumer staples', 'Health care', 'Treasuries'], hurt: ['Banks', 'Industrials', 'Travel', 'Small caps'],
      sum: 'Weak data hits stocks through earnings, while high-quality bonds usually rally. That is why many portfolios hold both.' },
    { k: 'jobs', label: 'Blowout jobs report', start: ['jobs', 'up'],
      edges: [
        ['jobs', 'gdp', 'up', 'More paychecks mean more spending.'],
        ['gdp', 'eps', 'up', 'Stronger demand lifts expected sales and profits.'],
        ['eps', 'stk', 'up', 'Higher expected profits pull stock prices up.'],
        ['jobs', 'inf', 'up', 'A tight job market pushes wages, and then prices, up.'],
        ['inf', 'fed', 'up', 'The Fed sees less reason to cut, or a reason to hike.'],
        ['fed', 'yld', 'up', 'Yields rise as bets on rate cuts fade.'],
        ['yld', 'stk', 'mix', 'But higher yields pull prices down at the same time. Good news can be bad news.'],
      ],
      assets: { stk: ['mix', 'Depends'], bnd: ['dn', 'Prices fall'], gold: ['dn', 'Often down'], usd: ['up', 'Usually up'], oil: ['up', 'Often up'] },
      help: ['Banks', 'Industrials', 'Consumer discretionary'], hurt: ['Long-term bonds', 'Real estate', 'Utilities'],
      sum: 'A hot jobs report can lift or sink stocks, depending on whether the market fears inflation or recession more that month.' },
    { k: 'fiscal', label: 'Stimulus or tax cut', start: ['gdp', 'up'],
      edges: [
        ['gdp', 'eps', 'up', 'More money for households and companies lifts spending and after-tax profits.'],
        ['eps', 'stk', 'up', 'Higher expected earnings support stock prices.'],
        ['gdp', 'inf', 'up', 'Extra demand can push prices up when the economy is already busy.'],
        ['inf', 'fed', 'up', 'The Fed may keep rates higher to offset it.'],
        ['fed', 'yld', 'up', 'Yields rise. Bigger deficits also mean more Treasury bonds for investors to absorb.'],
        ['yld', 'usd', 'up', 'Higher yields tend to lift the dollar.'],
      ],
      assets: { stk: ['up', 'Usually up'], bnd: ['dn', 'Prices fall'], gold: ['mix', 'Mixed'], usd: ['up', 'Usually up'], oil: ['up', 'Often up'] },
      help: ['Companies that get the spending', 'Small caps', 'Consumer discretionary'], hurt: ['Long-term bonds'],
      sum: 'Fiscal policy is Congress and the President: taxes and spending. It can work with the Fed, or against it.' },
    { k: 'usd', label: 'Dollar surges', start: ['usd', 'up'],
      edges: [
        ['usd', 'eps', 'dn', 'Sales made abroad are worth fewer dollars, so big US multinationals report lower profits.'],
        ['eps', 'stk', 'dn', 'Lower earnings weigh on large exporters and global tech companies.'],
        ['usd', 'oil', 'dn', 'Oil is priced in dollars, so a strong dollar tends to push its price down.'],
        ['oil', 'inf', 'dn', 'Cheaper oil and imports cool US inflation a little.'],
      ],
      assets: { stk: ['mix', 'Mixed'], bnd: ['flat', 'Little change'], gold: ['dn', 'Often down'], usd: ['up', 'Up'], oil: ['dn', 'Often down'] },
      help: ['US-focused small caps', 'Importers', 'Americans traveling abroad'], hurt: ['Multinationals and exporters', 'Emerging markets', 'Commodity producers'],
      sum: 'A strong dollar is good for US shoppers and travelers, and harder on exporters and on countries that borrow in dollars.' },
  ];
  const DIRSYM = { up: '▲', dn: '▼', mix: '◆' };
  const DIRCLS = { up: 'acc', dn: 'info', mix: 'vio' };

  SML.widgets.macroMap = function (root) {
    root.classList.add('xf');
    const id = SML.uid('xmm');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Pick a shock</span>${ui.seg(id + '-k', MM_SHOCKS.map((s) => ({ v: s.k, label: s.label })), 'cpi', 'Macro shock')}</div>
      <div class="wg-fig"></div>
      <div class="xf-legend"><span><i style="--c:var(--accent)"></i>Rises</span><span><i style="--c:var(--info)"></i>Falls</span><span><i style="--c:var(--violet)"></i>Pulled both ways</span></div>
      <div class="xf-assets" id="${id}-as"></div>
      <div class="xf-sect" id="${id}-sec"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn btn-g sm" data-a="back">Back</button><button type="button" class="btn btn-p sm" data-a="next">Next step</button><button type="button" class="btn btn-g sm" data-a="play">Play the chain</button><span class="grow"></span><span class="meta" id="${id}-st"></span></div>
      <div class="wg-note">Typical first reactions, not rules. Markets move on the surprise against what was expected, and every cycle is different. Arrows show direction only.</div>`;
    const fig = root.querySelector('.wg-fig');
    let shock = MM_SHOCKS[0], step = shock.edges.length, timer = null;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    SML.onCleanup(stop);
    const st = ui.wire(root, () => { const k = st.seg(id + '-k'); shock = MM_SHOCKS.find((s) => s.k === k) || MM_SHOCKS[0]; stop(); step = SML.reduced() ? shock.edges.length : 0; draw(); if (!SML.reduced()) play(); });
    root.querySelector('.wg-actions').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; stop();
      if (b.dataset.a === 'back') step = Math.max(0, step - 1);
      if (b.dataset.a === 'next') step = step >= shock.edges.length ? 0 : step + 1;
      if (b.dataset.a === 'play') { step = 0; draw(); play(); return; }
      draw();
    });
    function play() {
      stop();
      timer = setInterval(() => { if (!root.isConnected) return stop(); step++; draw(); if (step >= shock.edges.length) stop(); }, 1100);
    }

    function states() {
      const s = {}; s[shock.start[0]] = shock.start[1];
      shock.edges.slice(0, step).forEach((e) => { s[e[1]] = e[2]; });
      return s;
    }
    const draw = ui.responsive(fig, (W) => {
      const narrow = W < 480;
      const H = narrow ? 300 : 340, pad = narrow ? 10 : 18;
      const colW = (W - pad * 2) / 3;
      const nw = Math.min(colW - (narrow ? 34 : 44), 170), nh = narrow ? 42 : 50;
      const top = 22, rowGap = (H - top * 2 - nh) / 2;
      const pos = (k) => { const n = MM_NODES[k]; return { x: pad + colW * n.c + colW / 2, y: top + nh / 2 + n.r * rowGap }; };
      const sts = states();
      const clip = (c, dx, dy, m) => { const hw = nw / 2 + m, hh = nh / 2 + m; const t = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : 1e9); return [c.x + dx * t, c.y + dy * t]; };
      let edges = '', badges = '';
      shock.edges.forEach((e, i) => {
        if (i >= step) return;
        const A = pos(e[0]), B = pos(e[1]);
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        const others = Object.keys(MM_NODES).filter((k) => k !== e[0] && k !== e[1]).map(pos);
        let C = null, best = 1e9;
        [0, 0.2, -0.2, 0.35, -0.35, 0.5, -0.5, 0.7, -0.7, 0.9, -0.9].forEach((k) => {
          const c = { x: (A.x + B.x) / 2 + nx * len * k, y: (A.y + B.y) / 2 + ny * len * k };
          let hits = 0;
          for (let t = 0.1; t <= 0.9; t += 0.04) {
            const px = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * c.x + t * t * B.x, py = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * c.y + t * t * B.y;
            others.forEach((o) => { if (Math.abs(px - o.x) < nw / 2 + 5 && Math.abs(py - o.y) < nh / 2 + 5) hits++; });
            if (px < 3 || px > W - 3 || py < 3 || py > H - 3) hits += 2;
          }
          const sc = hits * 10 + Math.abs(k);
          if (sc < best) { best = sc; C = c; }
        });
        const s0 = clip(A, C.x - A.x || dx, C.y - A.y || dy, 3), s1 = clip(B, C.x - B.x || -dx, C.y - B.y || -dy, 5);
        const cur = i === step - 1;
        const col = DIRCLS[e[2]];
        edges += S.path(`M${s0[0].toFixed(1)},${s0[1].toFixed(1)} Q${C.x.toFixed(1)},${C.y.toFixed(1)} ${s1[0].toFixed(1)},${s1[1].toFixed(1)}`, `nf s-${col} ${cur ? 'w3' : 'w2'}${cur ? '' : ' o70'}`);
        const ax = s1[0] - C.x, ay = s1[1] - C.y, al = Math.hypot(ax, ay) || 1, ux = ax / al, uy = ay / al, hs = 9;
        edges += S.polygon([[s1[0], s1[1]], [s1[0] - ux * hs + uy * hs * 0.55, s1[1] - uy * hs - ux * hs * 0.55], [s1[0] - ux * hs - uy * hs * 0.55, s1[1] - uy * hs + ux * hs * 0.55]], `f-${col}`);
        const bx = 0.25 * s0[0] + 0.5 * C.x + 0.25 * s1[0], by = 0.25 * s0[1] + 0.5 * C.y + 0.25 * s1[1];
        badges += S.badge(bx, by, i + 1, cur ? 'f-acc' : 'f-mut');
      });
      let nodes = '';
      Object.keys(MM_NODES).forEach((k) => {
        const p = pos(k), s = sts[k], isStart = shock.start[0] === k;
        const cls = s ? `f-${DIRCLS[s] === 'acc' ? 'acc' : DIRCLS[s] === 'info' ? 'info' : 'vio'}-t s-${DIRCLS[s]}` : 'f-surf s-line';
        nodes += S.rect(p.x - nw / 2, p.y - nh / 2, nw, nh, cls + (isStart ? ' w3' : ' w15'), 8);
        const lab = narrow ? MM_NODES[k].s : MM_NODES[k].l;
        if (narrow) {
          nodes += S.text(p.x, p.y + (s ? 9 : 4), lab, 'sm b ' + (s ? 'ink' : 'mut'), 'middle');
          if (s) nodes += S.text(p.x, p.y - 5, DIRSYM[s], 'sm b ' + DIRCLS[s], 'middle');
        } else {
          nodes += S.text(p.x - (s ? 8 : 0), p.y + 5, lab, 'md b ' + (s ? 'ink' : 'mut'), 'middle');
          if (s) nodes += S.text(p.x + tw(lab, 13) / 2 + 2, p.y + 5, DIRSYM[s], 'md b ' + DIRCLS[s], 'middle');
        }
        if (isStart) nodes += S.text(p.x, p.y - nh / 2 - 6, 'START', 'xs mono b acc', 'middle');
      });
      fig.innerHTML = S.wrap(W, H, `Cause and effect map for: ${shock.label}`, edges + nodes + badges);
      // assets
      const A = shock.assets, names = [['stk', 'Stocks'], ['bnd', 'Bonds'], ['gold', 'Gold'], ['usd', 'Dollar'], ['oil', 'Oil']];
      const sym = { up: '▲', dn: '▼', mix: '◆', flat: '—' };
      $id(id + '-as').innerHTML = names.map(([k, n]) => `<div class="xf-a ${A[k][0]}"><span>${n}</span><b>${sym[A[k][0]]}</b><small>${A[k][1]}</small></div>`).join('');
      $id(id + '-sec').innerHTML = `<p>Tends to help ${shock.help.map((x) => `<span class="xf-chip up">${x}</span>`).join('')}</p><p>Tends to hurt ${shock.hurt.map((x) => `<span class="xf-chip dn">${x}</span>`).join('')}</p>`;
      $id(id + '-st').textContent = `Step ${step} of ${shock.edges.length}`;
      if (step === 0) setMsg(id + '-msg', 'acc', 'Start', `The shock: <b>${shock.label.toLowerCase()}</b>. Press Next step to follow the chain.`);
      else if (step < shock.edges.length) setMsg(id + '-msg', 'info', 'Step ' + step, shock.edges[step - 1][3]);
      else setMsg(id + '-msg', 'up', 'The chain', shock.edges[step - 1][3] + ' <b>Overall:</b> ' + shock.sum);
    });
  };

  /* ======================================================================
     fedSim: play the FOMC
     ====================================================================== */
  const FED_NOW = { inf: 3.0, un: 4.2, upper: 4.0 }; // core PCE Aug 2026 (BEA), unemployment Sep 2026 (BLS), range after Sep 16, 2026
  const FS_PRESETS = {
    now: { label: 'October 2026', inf: FED_NOW.inf, un: FED_NOW.un, upper: FED_NOW.upper, exp: 0 },
    hot: { label: 'Overheating', inf: 5.6, un: 3.5, upper: 3.0, exp: 25 },
    rec: { label: 'Recession', inf: 2.1, un: 6.3, upper: 4.5, exp: -50 },
    stag: { label: 'Stagflation', inf: 5.2, un: 6.0, upper: 4.0, exp: 0 },
    gold: { label: 'Goldilocks', inf: 2.1, un: 4.1, upper: 3.25, exp: 0 },
  };
  const frac = (v) => { const w = Math.floor(v + 1e-9), r = Math.round((v - w) * 4); return r === 0 ? String(w) : `${w}-${['', '1/4', '1/2', '3/4'][r]}`; };
  const ruleRate = (inf, un) => Math.max(0, 1 + inf + 0.5 * (inf - 2) - 1.0 * (un - 4.2));

  SML.widgets.fedSim = function (root) {
    root.classList.add('xf');
    const id = SML.uid('xfs');
    const P = FS_PRESETS.now;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Economy</span>${ui.seg(id + '-p', Object.keys(FS_PRESETS).map((k) => ({ v: k, label: FS_PRESETS[k].label })), 'now', 'Economy preset')}</div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-i', label: 'Inflation (core PCE, yearly)', min: 0, max: 9, step: 0.1, value: P.inf, fmt: (v) => F.num(v, 1) + '%' })}
        ${ui.slider({ id: id + '-u', label: 'Unemployment rate', min: 3, max: 10, step: 0.1, value: P.un, fmt: (v) => F.num(v, 1) + '%' })}
        ${ui.slider({ id: id + '-r', label: 'Rate today (top of range)', min: 0.25, max: 8, step: 0.25, value: P.upper, fmt: (v) => F.num(v, 2) + '%' })}
      </div>
      <div class="wg-bar"><span class="wg-title">Markets expect</span>${ui.seg(id + '-e', [{ v: -50, label: 'Cut 0.50' }, { v: -25, label: 'Cut 0.25' }, { v: 0, label: 'Hold' }, { v: 25, label: 'Hike 0.25' }], P.exp, 'What markets expect')}</div>
      <div class="wg-bar"><span class="wg-title">Your decision</span>${ui.seg(id + '-d', [{ v: -50, label: '−0.50' }, { v: -25, label: '−0.25' }, { v: 0, label: 'Hold' }, { v: 25, label: '+0.25' }, { v: 50, label: '+0.50' }], 0, 'Your rate decision')}</div>
      <div class="xf-stmt" id="${id}-stm"></div>
      <div class="wg-read">${ui.stat('New target range', id + '-nr', 'hl')}${ui.stat('Rule of thumb', id + '-rule')}${ui.stat('Prime rate', id + '-pr')}${ui.stat('Card APRs', id + '-cc')}${ui.stat('Savings yields', id + '-sv')}${ui.stat('30-yr mortgage', id + '-mg')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Drag the dot to change the economy. The rule of thumb is a simple Taylor-style rule with a 1% neutral real rate and 4.2% "normal" unemployment, both illustrative assumptions; the real FOMC weighs far more. Prime rate = top of the target range + 3 points, the usual bank convention.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-p')) {
        const p = FS_PRESETS[st.seg(id + '-p')]; st.set(id + '-i', p.inf); st.set(id + '-u', p.un); st.set(id + '-r', p.upper); st.setSeg(id + '-e', p.exp); st.setSeg(id + '-d', 0);
      }
      draw();
    });
    let G = null;
    ui.drag(fig, { sel: '.handle', move(pt) { if (!G) return; st.set(id + '-u', Math.round(SML.clamp(G.x.inv(pt.x), 3, 10) * 10) / 10); st.set(id + '-i', Math.round(SML.clamp(G.y.inv(pt.y), 0, 9) * 10) / 10); draw(); } });

    const draw = ui.responsive(fig, (W) => {
      const inf = st.n(id + '-i'), un = st.n(id + '-u'), cur = st.n(id + '-r');
      const d = Number(st.seg(id + '-d') || 0) / 100, exp = Number(st.seg(id + '-e') || 0) / 100;
      const nu = Math.max(0.25, cur + d), nl = nu - 0.25;
      const rule = ruleRate(inf, un), mid = nu - 0.125, gap = mid - rule;
      const narrow = W < 560;
      const H = narrow ? 470 : 330;
      const mapW = narrow ? W - 16 : Math.round(W * 0.6);
      const ml = 44, mt = 22, mb = 34;
      const mapH = narrow ? 290 : H - mt - mb;
      const x = SML.lin(3, 10, ml, mapW - 12), y = SML.lin(0, 9, mt + mapH - mb + 12, mt);
      G = { x, y };
      let b = '';
      // target zone
      b += S.rect(x(3.8), y(2.6), x(4.7) - x(3.8), y(1.4) - y(2.6), 'f-up-t s-up w1', 4);
      b += S.text(x(4.25), y(1.4) + 14, 'target zone', 'xs b up', 'middle');
      SML.ticks(0, 9, 5).forEach((v) => { b += S.line(ml, y(v), mapW - 12, y(v), 's-grid') + S.text(ml - 6, y(v) + 4, v + '%', 'xs mono', 'end'); });
      [3, 4, 5, 6, 7, 8, 9, 10].forEach((v) => { b += S.text(x(v), y(0) + 16, v + '%', 'xs mono', 'middle'); });
      b += S.line(ml, y(2), mapW - 12, y(2), 's-up dash w15') + S.text(mapW - 14, y(2) - 6, '2% inflation goal', 'xs up b', 'end');
      b += S.text(ml, mt - 8, 'INFLATION ↑', 'cap');
      b += S.text(mapW - 12, y(0) + 30, 'UNEMPLOYMENT →', 'cap', 'end');
      // quadrant hints
      b += S.text(x(3.15), y(8.4), 'too hot', 'sm dn b') + S.text(x(9.85), y(8.4), 'stagflation', 'sm vio b', 'end') + S.text(x(9.85), y(0.5), 'recession', 'sm info b', 'end');
      // effect arrow (12–24 months)
      if (Math.abs(d) > 0) {
        const k = d * 2.2; const tx = SML.clamp(un + k * 0.5, 3, 10), ty = SML.clamp(inf - k * 0.9, 0, 9);
        b += S.arrow(x(un), y(inf), x(tx), y(ty), d > 0 ? 'info' : 'acc', 8, true);
        b += S.text(x(tx) + (d > 0 ? 6 : -6), y(ty) + 14, 'in 1–2 years', 'xs b ' + (d > 0 ? 'info' : 'acc'), d > 0 ? 'start' : 'end');
      }
      b += S.circle(x(un), y(inf), 11, 'handle grab') + S.text(x(un), y(inf) - 16, 'drag me', 'xs b acc', 'middle');
      // votes
      const vx0 = narrow ? 16 : mapW + 18, vy0 = narrow ? mt + mapH + 18 : mt + 6, vW = narrow ? W - 32 : W - mapW - 30;
      const dis = Math.min(3, Math.floor(Math.abs(gap) / 0.75));
      b += S.text(vx0, vy0 + 4, 'THE 12 VOTERS', 'cap');
      const per = narrow ? 12 : 4, rr = narrow ? 9 : 11, gapx = narrow ? Math.min(26, (vW - 2 * rr) / 11) : Math.min(40, (vW - 2 * rr) / 3);
      const names = ['Gov', 'Gov', 'Gov', 'Gov', 'Gov', 'Gov', 'Gov', 'NY', 'Pres', 'Pres', 'Pres', 'Pres'];
      names.forEach((n, i) => {
        const cx = vx0 + rr + (i % per) * gapx, cy = vy0 + 26 + Math.floor(i / per) * (rr * 2 + 14);
        const isD = i >= 12 - dis;
        b += S.circle(cx, cy, rr, isD ? 'f-dn' : (i < 7 ? 'f-info' : i === 7 ? 'f-acc' : 'f-vio'));
        if (!narrow) b += S.text(cx, cy + rr + 11, n, 'xs', 'middle');
      });
      const vyEnd = vy0 + 26 + Math.ceil(12 / per) * (rr * 2 + 14);
      b += S.text(vx0, vyEnd + 4, dis ? `${12 - dis}–${dis} vote · ${dis} dissent${dis > 1 ? 's' : ''}` : '12–0 vote, unanimous', 'sm b ' + (dis ? 'dn' : 'up'));
      if (!narrow) {
        b += S.text(vx0, vyEnd + 26, '7 governors (blue)', 'xs') + S.text(vx0, vyEnd + 40, 'New York Fed president (amber)', 'xs') + S.text(vx0, vyEnd + 54, '4 rotating presidents (violet)', 'xs');
      }
      fig.innerHTML = S.wrap(W, narrow ? vyEnd + 16 : H, `Inflation ${F.num(inf, 1)}% and unemployment ${F.num(un, 1)}% on the Fed's dual-mandate map`, b);
      // statement
      const act = d > 0 ? `raise the target range for the federal funds rate by ${frac(Math.abs(d))} percentage point to` : d < 0 ? `lower the target range for the federal funds rate by ${frac(Math.abs(d))} percentage point to` : 'maintain the target range for the federal funds rate at';
      $id(id + '-stm').innerHTML = `<i>Statement, 2:00 pm ET:</i> "The Committee decided to ${act} ${frac(nl)} to ${frac(nu)} percent."${dis ? ` <i>${dis} member${dis > 1 ? 's' : ''} preferred a different move.</i>` : ''} <i>Press conference at 2:30.</i>`;
      setT(id + '-nr', `${F.num(nl, 2)}–${F.num(nu, 2)}%`);
      setT(id + '-rule', `≈ ${F.num(rule, 2)}%`, Math.abs(gap) > 1 ? 'dn' : 'up');
      setT(id + '-pr', p2(nu + 3));
      setT(id + '-cc', d ? `${d > 0 ? '+' : F.minus}${F.num(Math.abs(d), 2)} pts` : 'Same', d > 0 ? 'dn' : d < 0 ? 'up' : '');
      setT(id + '-sv', d ? (d > 0 ? 'Drift up' : 'Drift down') : 'Same');
      setT(id + '-mg', 'Via 10-yr');
      // coach
      const surprise = d - exp;
      const mkt = Math.abs(surprise) < 0.01 ? 'Markets expected this, so the move itself barely matters. Traders focus on the statement, the dot plot and the press conference for hints about the next meeting.'
        : surprise > 0 ? `That is <b>more hawkish</b> than the ${exp < 0 ? 'cut' : exp > 0 ? 'hike' : 'hold'} markets expected: short-term yields jump, the dollar firms and stocks usually drop that afternoon.`
          : `That is <b>more dovish</b> than markets expected: short-term yields fall and stocks usually rally, unless investors read it as fear about the economy.`;
      let read;
      if (inf >= 2.8 && un < 4.8) read = 'Inflation is above the 2% goal while the job market is near full strength: the textbook case to hold rates high or hike.';
      else if (inf < 2.6 && un > 5.2) read = 'Inflation is near goal and unemployment is rising: the textbook case to cut.';
      else if (inf >= 2.8 && un > 5.2) read = 'Both goals are missed in opposite directions. Stagflation forces the Fed to choose which pain to fight first.';
      else if (Math.abs(inf - 2) < 0.6 && un < 5) read = 'Both goals are close to met. Small moves, or none, are the usual answer.';
      else read = 'The two goals pull in different directions, so the Fed weighs which miss is bigger and more lasting.';
      const fit = gap > 1 ? ' Your rate is well above the simple rule: tight, which fights inflation but risks jobs.' : gap < -1 ? ' Your rate is well below the simple rule: loose, which helps jobs but risks inflation.' : ' Your rate is close to the simple rule.';
      setMsg(id + '-msg', Math.abs(surprise) < 0.01 ? 'info' : surprise > 0 ? 'dn' : 'up', Math.abs(surprise) < 0.01 ? 'As expected' : surprise > 0 ? 'Hawkish' : 'Dovish', `${read}${fit} ${mkt}`);
    });
  };

  /* ======================================================================
     rateValuation: rates → stock P/E, bond prices, mortgage payment, yield curve
     ====================================================================== */
  const MATS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30];
  const MLAB = ['3m', '6m', '1y', '2y', '3y', '5y', '7y', '10y', '20y', '30y'];
  const CURVES = {
    now: { label: 'Oct 20, 2026', y: [4.26, 4.36, 4.51, 4.79, 4.86, 4.94, 5.02, 5.12, 5.47, 5.42] },
    normal: { label: 'Normal', y: [3.0, 3.1, 3.25, 3.5, 3.65, 3.9, 4.1, 4.3, 4.65, 4.7] },
    flat: { label: 'Flat', y: [4.4, 4.4, 4.38, 4.35, 4.33, 4.32, 4.33, 4.35, 4.5, 4.45] },
    inverted: { label: 'Inverted', y: [5.4, 5.45, 5.3, 4.9, 4.6, 4.35, 4.3, 4.2, 4.45, 4.35] },
  };
  const peValue = (r) => { const g = 0.03, pay = 0.7; return r - g > 0.005 ? pay * (1 + g) / (r - g) : 140; };
  const peGrowth = (r) => {
    const gG = 0.14, gT = 0.035, n = 10; let pv = 0, e = 1;
    for (let t = 1; t <= n; t++) { e *= 1 + gG; pv += 0.2 * e / Math.pow(1 + r, t); }
    if (r - gT <= 0.005) return 140;
    return pv + (0.7 * e * (1 + gT) / (r - gT)) / Math.pow(1 + r, n);
  };
  const bondPrice = (c, y, n) => { let p = 0; for (let t = 1; t <= n; t++) p += c / Math.pow(1 + y, t); return p + 100 / Math.pow(1 + y, n); };
  const bondPct = (y0, dy, n) => { const c = y0 * 100; return (bondPrice(c, y0 + dy, n) / bondPrice(c, y0, n) - 1) * 100; };
  const pmt = (L, rate, yrs) => { const i = rate / 1200, n = yrs * 12; return i ? L * i / (1 - Math.pow(1 + i, -n)) : L / n; };

  SML.widgets.rateValuation = function (root, opts) {
    opts = opts || {};
    root.classList.add('xf');
    const id = SML.uid('xrv');
    const tab0 = opts.tab || 'stk';
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', [{ v: 'stk', label: 'Stocks' }, { v: 'bnd', label: 'Bonds' }, { v: 'mtg', label: 'Mortgage' }, { v: 'crv', label: 'Yield curve' }], tab0, 'View')}<span class="grow"></span><span class="meta" id="${id}-cap"></span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        <div class="xf-ctl" data-t="stk bnd mtg">${ui.slider({ id: id + '-y', label: '10-year Treasury yield', min: 0.5, max: 9, step: 0.05, value: 5.12, fmt: (v) => F.num(v, 2) + '%' })}</div>
        <div class="xf-ctl" data-t="stk">${ui.slider({ id: id + '-erp', label: 'Extra return investors demand from stocks', min: 2, max: 7, step: 0.25, value: 4, fmt: (v) => F.num(v, 2) + ' pts' })}</div>
        <div class="xf-ctl" data-t="bnd">${ui.slider({ id: id + '-dy', label: 'Yields change by', min: -3, max: 3, step: 0.25, value: 1, fmt: (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), 2) + ' pts' })}</div>
        <div class="xf-ctl" data-t="mtg">${ui.slider({ id: id + '-L', label: 'Loan amount', min: 100000, max: 1000000, step: 10000, value: 400000, fmt: 'usd0' })}</div>
        <div class="xf-ctl" data-t="mtg">${ui.slider({ id: id + '-sp', label: 'Mortgage rate above the 10-year', min: 1, max: 3.5, step: 0.05, value: 2.28, fmt: (v) => F.num(v, 2) + ' pts' })}</div>
        <div class="xf-ctl" data-t="crv">${ui.seg(id + '-c', Object.keys(CURVES).map((k) => ({ v: k, label: CURVES[k].label })), 'now', 'Curve shape')}</div>
      </div>
      <div class="wg-read" id="${id}-rd"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    let adj = { s: 0, l: 0 };
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && e.target.closest('#' + id + '-c')) adj = { s: 0, l: 0 }; draw(); });
    let G = null;
    ui.drag(fig, {
      sel: '.handle',
      start(pt, t) { if (G) G.which = t.dataset.h; },
      move(pt) {
        if (!G) return; const tab = st.seg(id + '-t');
        if (tab === 'stk') { st.set(id + '-y', Math.round(SML.clamp(G.x.inv(pt.x), 0.5, 9) * 20) / 20); }
        else if (tab === 'mtg') { const r = SML.clamp(G.x.inv(pt.x), 3, 10.5); st.set(id + '-y', Math.round(SML.clamp(r - st.n(id + '-sp'), 0.5, 9) * 20) / 20); }
        else if (tab === 'crv') { const base = CURVES[st.seg(id + '-c')].y; const v = SML.clamp(G.y.inv(pt.y), 0, 8); if (G.which === 's') adj.s = Math.round((v - base[3]) * 20) / 20; else adj.l = Math.round((v - base[7]) * 20) / 20; }
        draw();
      },
    });
    const curve = () => { const base = CURVES[st.seg(id + '-c')].y; return base.map((v, i) => { const m = MATS[i]; const w = m <= 2 ? 1 : m >= 10 ? 0 : 1 - (m - 2) / 8; return v + adj.s * w + adj.l * (1 - w); }); };

    const draw = ui.responsive(fig, (W) => {
      const tab = st.seg(id + '-t');
      root.querySelectorAll('.xf-ctl').forEach((c) => { c.hidden = c.dataset.t.split(' ').indexOf(tab) < 0; });
      const narrow = W < 480;
      const H = narrow ? 270 : 320, ml = narrow ? 40 : 52, mr = narrow ? 14 : 24, mt = 26, mb = 36;
      const y10 = st.n(id + '-y') / 100;
      let b = '', rd = '', msg = ['info', '', ''], note = '', cap = '';
      if (tab === 'stk') {
        const erp = st.n(id + '-erp') / 100;
        const xs = []; for (let v = 1; v <= 9.001; v += 0.1) xs.push(v);
        const vals = xs.map((v) => [v, peValue(v / 100 + erp), peGrowth(v / 100 + erp)]);
        const maxPE = 60;
        const x = SML.lin(1, 9, ml, W - mr), y = SML.lin(0, maxPE, H - mb, mt);
        G = { x, y };
        [0, 15, 30, 45, 60].forEach((v) => { b += S.line(ml, y(v), W - mr, y(v), 's-grid') + S.text(ml - 6, y(v) + 4, v + '×', 'xs mono', 'end'); });
        [1, 3, 5, 7, 9].forEach((v) => { b += S.text(x(v), H - mb + 16, v + '%', 'xs mono', 'middle'); });
        b += S.text(W - mr, H - 6, '10-YEAR YIELD →', 'cap', 'end') + S.text(ml, mt - 10, 'FAIR P/E', 'cap');
        const cut = (v) => (v > maxPE ? NaN : v);
        b += S.poly(vals.map((q) => [x(q[0]), y(cut(q[2]))]), 's-vio w25') + S.poly(vals.map((q) => [x(q[0]), y(cut(q[1]))]), 's-info w25');
        const cy = y10 * 100, pv = peValue(y10 + erp), pg = peGrowth(y10 + erp), pv1 = peValue(y10 + erp + 0.01), pg1 = peGrowth(y10 + erp + 0.01);
        b += S.line(x(cy), mt, x(cy), H - mb, 's-acc dash w15');
        b += S.circle(x(cy), y(Math.min(pg, maxPE)), 5, 'f-vio') + S.circle(x(cy), y(Math.min(pv, maxPE)), 5, 'f-info');
        if (narrow) {
          b += S.text(W - mr, mt + 4, '— fast-growth company', 'sm b vio', 'end') + S.text(W - mr, mt + 20, '— steady value company', 'sm b info', 'end');
        } else {
          const gi = vals.findIndex((q) => q[2] <= maxPE); const gq = vals[Math.max(0, gi)];
          b += S.text(x(gq[0]) + 8, Math.max(mt + 12, y(gq[2]) + 4), 'fast-growth company', 'sm b vio');
          b += S.text(x(1.15), y(Math.min(peValue(0.015 + erp), maxPE)) + 18, 'steady value company', 'sm b info');
        }
        b += S.circle(x(cy), H - mb - 12, 10, 'handle grab', ' data-h="x"') + S.text(x(cy) + 14, H - mb - 8, 'drag', 'xs b acc');
        const dv = (pv1 / pv - 1) * 100, dg = (pg1 / pg - 1) * 100;
        rd = ui.stat('Value company P/E', id + '-a', 'hl') + ui.stat('Growth company P/E', id + '-b') + ui.stat('+1 pt yield: value', id + '-c1') + ui.stat('+1 pt yield: growth', id + '-d1');
        $id(id + '-rd').innerHTML = rd;
        setT(id + '-a', F.num(pv, 1) + '×'); setT(id + '-b', F.num(pg, 1) + '×'); setT(id + '-c1', F.num(dv, 0) + '%', 'dn'); setT(id + '-d1', F.num(dg, 0) + '%', 'dn');
        msg = ['vio', 'Duration', `At a ${F.num(cy, 2)}% 10-year yield, a 1-point rise cuts the steady company's fair P/E by about ${F.num(Math.abs(dv), 0)}% and the fast-grower's by about ${F.num(Math.abs(dg), 0)}%. Most of a growth company's value sits in profits far in the future, so higher rates hit it harder, which is what happened to tech stocks in 2022.`];
        note = 'Illustrative discounted-earnings model: required return = 10-year yield + the extra return you set. Steady company: profits grow 3% a year, pays out 70%. Fast-grower: 14% a year for ten years, then 3.5%. Levels are made up; the direction and the gap are the lesson.';
        cap = 'Rates vs what a stock is worth';
      } else if (tab === 'bnd') {
        const dy = st.n(id + '-dy') / 100;
        const rows = [['2-year Treasury', 2], ['10-year Treasury', 10], ['30-year Treasury', 30]].map(([n, m]) => [n, bondPct(y10, dy, m)]);
        const fundDur = 6; rows.push(['Total bond fund (duration ≈ 6)', -fundDur * dy * 100 + 0.5 * fundDur * fundDur * dy * dy * 100 * 0.6]);
        const maxAbs = Math.max(5, Math.ceil(Math.max(...rows.map((r) => Math.abs(r[1]))) / 5) * 5);
        const labW = narrow ? 0 : 200, x0 = narrow ? 16 : ml + labW - 30, x1 = W - mr;
        const x = SML.lin(-maxAbs, maxAbs, x0, x1); G = { x, y: null };
        const rowH = narrow ? 52 : 52, top = mt + 6;
        b += S.line(x(0), top - 8, x(0), top + rows.length * rowH, 's-mut w15');
        [-maxAbs, -maxAbs / 2, maxAbs / 2, maxAbs].forEach((v) => { b += S.text(x(v), top + rows.length * rowH + 14, (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), v % 1 ? 1 : 0) + '%', 'xs mono', 'middle'); });
        rows.forEach((r, i) => {
          const yy = top + i * rowH, v = r[1];
          if (narrow) b += S.text(x0, yy + 10, r[0], 'sm b ink');
          else b += S.text(x0 - 12, yy + 24, r[0], 'md b ink', 'end');
          const bx = v >= 0 ? x(0) : x(v); b += S.rect(bx, yy + (narrow ? 16 : 12), Math.abs(x(v) - x(0)), 20, v >= 0 ? 'f-up' : 'f-dn', 3);
          const lab = (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), 1) + '%', blen = Math.abs(x(v) - x(0)), inside = blen > tw(lab, 11.5) + 16;
          const outFits = v >= 0 ? x(v) + 6 + tw(lab, 11.5) < W - 4 : x(v) - 6 - tw(lab, 11.5) > (narrow ? 4 : x0 + 4);
          const ty = yy + (narrow ? 31 : 27);
          if (outFits || !inside) b += S.text(v >= 0 ? x(v) + 6 : x(v) - 6, ty, lab, 'sm mono b ' + (v >= 0 ? 'up' : 'dn'), v >= 0 ? 'start' : 'end');
          else b += S.text(v >= 0 ? x(v) - 6 : x(v) + 6, ty, lab, 'sm mono b on', v >= 0 ? 'end' : 'start');
        });
        b += S.text(narrow ? 16 : x0, mt - 8, (narrow ? 'IF YIELDS MOVE ' : 'PRICE CHANGE IF YIELDS MOVE ') + (dy > 0 ? '+' : dy < 0 ? F.minus : '') + F.num(Math.abs(dy * 100), 2) + ' PTS', 'cap');
        rd = ui.stat('2-year', id + '-a') + ui.stat('10-year', id + '-b', 'hl') + ui.stat('30-year', id + '-c1') + ui.stat('Bond fund', id + '-d1');
        $id(id + '-rd').innerHTML = rd;
        const fmtp = (v) => (v > 0 ? '+' : v < 0 ? F.minus : '') + F.num(Math.abs(v), 1) + '%';
        ['-a', '-b', '-c1', '-d1'].forEach((k, i) => setT(id + k, fmtp(rows[i][1]), rows[i][1] >= 0 ? 'up' : 'dn'));
        msg = [dy > 0 ? 'dn' : 'up', dy > 0 ? 'Yields up' : dy < 0 ? 'Yields down' : 'No change', dy === 0 ? 'Move the slider: bond prices and yields always move in opposite directions.' : `When yields ${dy > 0 ? 'rise' : 'fall'} ${F.num(Math.abs(dy * 100), 2)} points, a 30-year bond ${dy > 0 ? 'loses' : 'gains'} about ${F.num(Math.abs(rows[2][1]), 0)}% but a 2-year bond only about ${F.num(Math.abs(rows[0][1]), 1)}%. The longer the bond, the bigger the swing. In 2022, when yields jumped, the US total bond market lost about 13%.`];
        note = 'Each Treasury is priced at par at today\'s 10-year yield (a flat curve, for simplicity) with yearly coupons; the bond fund uses duration 6 with a small convexity adjustment. Price change only, before interest earned.';
        cap = 'Rates vs bond prices';
      } else if (tab === 'mtg') {
        const L = st.n(id + '-L'), sp = st.n(id + '-sp'), r = y10 * 100 + sp;
        const x = SML.lin(3, 10.5, ml + 10, W - mr), pts = []; for (let v = 3; v <= 10.501; v += 0.1) pts.push([v, pmt(L, v, 30)]);
        const maxP = Math.ceil(pmt(L, 10.5, 30) / 500) * 500, y = SML.lin(0, maxP, H - mb, mt); G = { x, y };
        SML.ticks(0, maxP, 4).forEach((v) => { b += S.line(ml + 10, y(v), W - mr, y(v), 's-grid') + S.text(ml + 4, y(v) + 4, '$' + F.num(v / 1000, v % 1000 ? 1 : 0) + 'k', 'xs mono', 'end'); });
        [3, 4, 5, 6, 7, 8, 9, 10].forEach((v) => { b += S.text(x(v), H - mb + 16, v + '%', 'xs mono', 'middle'); });
        b += S.text(W - mr, H - 6, 'MORTGAGE RATE →', 'cap', 'end') + S.text(ml + 10, mt - 10, narrow ? 'MONTHLY PAYMENT' : 'MONTHLY PAYMENT (PRINCIPAL + INTEREST)', 'cap');
        b += S.area(pts.map((p) => [x(p[0]), y(p[1])]), y(0), 'f-acc-t') + S.poly(pts.map((p) => [x(p[0]), y(p[1])]), 's-acc w25');
        const rc = SML.clamp(r, 3, 10.5), pm = pmt(L, rc, 30), pm1 = pmt(L, rc + 1, 30), pm0 = pmt(L, Math.max(3, rc - 1), 30);
        b += S.line(x(rc), y(pm), x(rc), H - mb, 's-acc dash');
        b += S.circle(x(rc), y(pm), 10, 'handle grab', ' data-h="x"') + S.text(x(rc) + (rc > 8 ? -14 : 14), y(pm) - 12, usd0(pm) + '/mo', 'md b ink', rc > 8 ? 'end' : 'start');
        rd = ui.stat('Mortgage rate', id + '-a', 'hl') + ui.stat('Payment', id + '-b') + ui.stat('1 pt higher', id + '-c1') + ui.stat('1 pt lower', id + '-d1');
        $id(id + '-rd').innerHTML = rd;
        setT(id + '-a', p2(rc)); setT(id + '-b', usd0(pm)); setT(id + '-c1', '+' + usd0(pm1 - pm), 'dn'); setT(id + '-d1', F.minus + usd0(pm - pm0), 'up');
        msg = ['acc', 'Mortgages', `The Fed does not set mortgage rates. They track the 10-year Treasury yield plus a spread (about ${F.num(sp, 2)} points here). On a ${usd0(L)} 30-year loan at ${F.num(rc, 2)}%, each extra point costs about ${usd0(pm1 - pm)} a month, or about ${usd0((pm1 - pm) * 360)} over the life of the loan.`];
        note = 'Default spread: Freddie Mac\'s 7.40% 30-year average (Oct 15, 2026) minus the 5.12% 10-year Treasury yield (Oct 20, 2026). Principal and interest only; taxes, insurance and PMI are extra.';
        cap = 'Rates vs a mortgage payment';
      } else {
        const ys = curve(), top = Math.max(6, Math.ceil(Math.max(...ys) + 0.5));
        const x = (i) => ml + (i / (MATS.length - 1)) * (W - mr - ml), y = SML.lin(0, top, H - mb, mt);
        G = { x: null, y, which: G && G.which };
        SML.ticks(0, top, 4).forEach((v) => { b += S.line(ml, y(v), W - mr, y(v), 's-grid') + S.text(ml - 6, y(v) + 4, v + '%', 'xs mono', 'end'); });
        MLAB.forEach((l, i) => { if (!narrow || i % 2 === 1 || i === 0) b += S.text(x(i), H - mb + 16, l, 'xs mono', 'middle'); });
        b += S.text(W - mr, H - 6, 'TIME TO MATURITY →', 'cap', 'end') + S.text(ml, mt - 10, 'TREASURY YIELD', 'cap');
        const pts = ys.map((v, i) => [x(i), y(v)]);
        b += S.area(pts, y(0), 'f-info-t') + S.poly(pts, 's-info w3');
        pts.forEach((p, i) => { if (i !== 3 && i !== 7) b += S.circle(p[0], p[1], 3.5, 'f-info'); });
        b += S.circle(pts[3][0], pts[3][1], 10, 'handle grab', ' data-h="s"') + S.text(pts[3][0], pts[3][1] - 16, '2-yr ' + F.num(ys[3], 2) + '%', 'sm b acc', 'middle');
        b += S.circle(pts[7][0], pts[7][1], 10, 'handle grab', ' data-h="l"') + S.text(pts[7][0], pts[7][1] - 16, '10-yr ' + F.num(ys[7], 2) + '%', 'sm b acc', 'middle');
        const sprd = ys[7] - ys[3];
        let shape, cls, text;
        if (sprd < -0.1) { shape = 'Inverted'; cls = 'dn'; text = 'Short-term rates above long-term rates. Investors expect the Fed to cut later, usually because growth is expected to weaken. An inverted curve has come before most US recessions, but with long and uneven delays, and the record 2022 to 2024 inversion was not followed by a quick recession.'; }
        else if (sprd < 0.25) { shape = 'Flat'; cls = 'vio'; text = 'Little extra pay for lending longer. A flat curve often shows up when the Fed has hiked and markets are unsure what comes next.'; }
        else { shape = 'Normal'; cls = 'up'; text = 'Longer loans pay more, the usual shape in an expansion. Banks like it: they borrow short and lend long.'; }
        rd = ui.stat('2-year', id + '-a') + ui.stat('10-year', id + '-b') + ui.stat('10y − 2y spread', id + '-c1', 'hl') + ui.stat('Shape', id + '-d1');
        $id(id + '-rd').innerHTML = rd;
        setT(id + '-a', p2(ys[3])); setT(id + '-b', p2(ys[7])); setT(id + '-c1', (sprd >= 0 ? '+' : F.minus) + F.num(Math.abs(sprd), 2) + ' pts', sprd < 0 ? 'dn' : 'up'); setT(id + '-d1', shape, cls);
        msg = [cls, shape, text + ' Drag the 2-year or the 10-year point to reshape the curve.'];
        note = 'October 20, 2026 curve from the US Treasury daily par yield curve. The Normal, Flat and Inverted shapes are illustrative. The Fed sets the very short end directly; the market sets the rest, nudged by Fed guidance and QE or QT.';
        cap = 'The yield curve';
      }
      $id(id + '-cap').textContent = cap;
      fig.innerHTML = S.wrap(W, H, cap, b);
      setMsg(id + '-msg', msg[0], msg[1], msg[2]);
      $id(id + '-note').textContent = note;
    });
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const SRC = {
    fomcCal: { t: 'Federal Reserve: FOMC meeting calendars and statements', u: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
    fomc: { t: 'Federal Reserve: About the FOMC (members and voting rotation)', u: 'https://www.federalreserve.gov/monetarypolicy/fomc.htm' },
    sep16: { t: 'Federal Reserve statement, September 16, 2026', u: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm' },
    board: { t: 'Federal Reserve: Board of Governors members', u: 'https://www.federalreserve.gov/aboutthefed/bios/board/default.htm' },
    cpi: { t: 'BLS: Consumer Price Index, September 2026', u: 'https://www.bls.gov/news.release/cpi.nr0.htm' },
    jobs: { t: 'BLS: The Employment Situation, September 2026', u: 'https://www.bls.gov/news.release/empsit.nr0.htm' },
    pce: { t: 'BEA: PCE price index excluding food and energy', u: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index-excluding-food-and-energy' },
    curve: { t: 'US Treasury: daily par yield curve rates, October 2026', u: 'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value_month=202610' },
    pmms: { t: 'Freddie Mac: Primary Mortgage Market Survey', u: 'https://www.freddiemac.com/pmms' },
    impl: { t: 'Federal Reserve implementation note, September 16, 2026', u: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a1.htm' },
    sep: { t: 'Federal Reserve: Summary of Economic Projections, September 16, 2026', u: 'https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260916.htm' },
    warsh: { t: 'Federal Reserve: Kevin Warsh biography', u: 'https://www.federalreserve.gov/aboutthefed/bios/board/warsh.htm' },
    h41: { t: 'Federal Reserve H.4.1: factors affecting reserve balances', u: 'https://www.federalreserve.gov/releases/h41/current/default.htm' },
    mpr: { t: 'Federal Reserve Monetary Policy Report, July 2026 (Part 2)', u: 'https://www.federalreserve.gov/monetarypolicy/2026-07-mpr-part2.htm' },
    hist: { t: 'Federal Reserve History: The Great Inflation', u: 'https://www.federalreservehistory.org/essays/great-inflation' },
    inv: { t: 'Advisor Perspectives: the yield curve un-inverts (October 2024)', u: 'https://www.advisorperspectives.com/commentaries/2024/10/28/yield-curve-uninverts-october-14-2024' },
  };

  SML.lessons.push({
    id: 'l-macro-intro', course: 'fed', order: 1, title: 'How the economy moves stocks', mins: 9, level: 'Beginner',
    summary: 'The chain from jobs, prices and interest rates to profits and stock prices.',
    idea: 'Stock prices follow two things: expected profits and interest rates. The economy moves both.',
    widget: 'macroMap',
    try: 'Pick a shock and step through the chain. Then compare what stocks, bonds, gold, the dollar and oil usually do.',
    body: [
      '<h3>Two numbers drive every stock</h3><p>A share is a claim on a company’s future profits. What it is worth today depends on <b>how big those profits will be</b> and <b>how much the future is worth today</b>, which is set by interest rates. The economy pushes on both. Busy shoppers and full employment lift profits. Inflation pushes rates up, and higher rates shrink what far-off profits are worth now.</p>',
      '<h3>The dials to watch</h3><ul><li><b>Growth:</b> GDP, retail sales and business surveys (<a href="#l-pmi">PMI</a>).</li><li><b>Jobs:</b> the monthly jobs report and weekly jobless claims (<a href="#l-jobs">the jobs lesson</a>).</li><li><b>Prices:</b> CPI and PCE inflation (<a href="#l-inflation">the inflation lesson</a>).</li><li><b>Rates:</b> the Fed’s target rate and Treasury yields (<a href="#l-fed">the Fed</a>, <a href="#l-rates">yields</a>).</li><li><b>Commodities and the dollar:</b> oil, metals and the dollar’s value (<a href="#l-oil">oil</a>, <a href="#l-dollar">the dollar</a>).</li></ul>',
      '<h3>Two levers: monetary and fiscal policy</h3><p><b>Monetary policy</b> is the Federal Reserve: short-term interest rates and its bond holdings. <b>Fiscal policy</b> is Congress and the President: taxes, spending and deficits. They can push in the same direction, as in 2020 when both poured money into the economy, or against each other, as when the government spends heavily while the Fed tries to cool inflation.</p>',
      '<h3>Markets trade surprises, not news</h3><p>Before every report, economists publish a forecast called the <b>consensus</b>. Prices already reflect it. If inflation comes in exactly as expected, little happens. The gap between actual and expected is what moves markets, often within seconds of 8:30 am Eastern time.</p><p>That is why <b>good news can be bad news</b>. A very strong jobs report can push stocks down if it means the Fed will keep rates higher for longer.</p>',
      '<h3>What tends to move together</h3><ul><li><b>Risk-on days:</b> stocks, copper and riskier bonds rise together.</li><li><b>Risk-off days:</b> money runs to Treasuries, the dollar and gold.</li><li><b>Inflation scares are different:</b> stocks and bonds can fall at the same time, as they did in 2022. That is when a stock and bond mix protects you least.</li></ul>',
      '<h3>How to use this</h3><p><b>As a trader:</b> know the <a href="#calendar">calendar</a>. Cut size or stay flat into big 8:30 am releases, and let the first few minutes settle before you trade. <b>As an investor:</b> macro explains why markets move, but it rarely tells you when. Keep your mix, rebalance on a schedule and avoid rebuilding a portfolio around one month’s data.</p>',
    ],
    example: {
      title: 'A hotter-than-expected inflation morning',
      intro: 'Illustrative numbers, to show how the chain plays out in one morning.',
      steps: [
        'Economists expect core CPI to rise 0.3% for the month. At 8:30 am ET the report shows 0.5%.',
        'Within a minute the 2-year Treasury yield jumps from 4.70% to 4.85% as traders price in more rate hikes.',
        'Stock index futures fall 1.2%. A fast-growing tech stock drops 3% before the open while a large bank barely moves.',
        'A day trader whose plan says "no trades in the first 15 minutes on CPI day" waits, then trades a clean retest of the premarket low with normal size.',
        'A long-term investor with 70% stocks and 30% bonds does nothing: the mix is still inside the 5-point band that would trigger a rebalance.',
      ],
      result: 'Same news, two right answers: the trader manages the event risk, the investor ignores it.',
    },
    mistakes: [
      'Reacting to the headline number instead of the surprise against the consensus forecast.',
      'Assuming good economic news is always good for stocks. If it means higher rates for longer, stocks can fall.',
      'Holding a large or leveraged position into an 8:30 am CPI or jobs release without a plan.',
      'Rebuilding a long-term portfolio around one month of data or one scary headline.',
    ],
    points: [
      'Stock prices follow expected profits and interest rates; the economy moves both.',
      'Monetary policy is the Fed; fiscal policy is taxes and spending.',
      'Markets move on surprises against the consensus, not on the news itself.',
      'Inflation scares can hit stocks and bonds at the same time.',
      'Traders plan around release times; investors keep their mix and rebalance.',
    ],
    terms: ['Monetary policy', 'Fiscal policy', 'Consensus estimate', 'Federal Reserve', 'Inflation', 'Recession'],
    quiz: { q: 'Monthly CPI comes in at 0.3%, exactly what economists expected. What usually happens to stocks?', options: ['They jump, because inflation is positive', 'Little, because the number was already expected', 'They crash, because any inflation is bad'], answer: 1, why: 'Prices already reflect the consensus forecast. Markets move on the surprise, the gap between actual and expected.' },
    sources: [SRC.cpi, SRC.fomcCal],
  });

  SML.lessons.push({
    id: 'l-fed', course: 'fed', order: 2, title: 'How the Federal Reserve works', mins: 11, level: 'Intermediate',
    summary: 'Who sets interest rates, how a meeting works and how a decision reaches your wallet.',
    idea: 'Twelve people vote eight times a year on one short-term rate, and that rate ripples into every loan and stock price.',
    widget: 'fedSim',
    try: 'Pick an economy or drag the dot, then make your decision and see the vote, the statement and what happens to loans and markets.',
    body: [
      '<h3>What the Fed is</h3><p>The Federal Reserve is the US central bank. It has three parts:</p><ul><li><b>The Board of Governors</b> in Washington: seven governors nominated by the President and confirmed by the Senate, for staggered 14-year terms. The chair and vice chairs serve 4-year terms in those roles.</li><li><b>Twelve regional Reserve Banks</b>, from Boston to San Francisco, each with its own president.</li><li><b>The Federal Open Market Committee (FOMC)</b>, which sets interest rates. It has 12 voters: the 7 governors, the president of the New York Fed and 4 of the other 11 regional presidents, who rotate each year. The non-voting presidents still join the debate.</li></ul><p><b>Kevin Warsh</b> has chaired the Fed since May 22, 2026, after the Senate confirmed him 54–45; his term as chair runs to May 2030. Jerome Powell, chair until May 2026, remains a governor.</p>',
      '<h3>Independence</h3><p>The Fed is designed to set rates without day-to-day political control: governors serve long terms and can be removed only "for cause". How far that protection reaches is being tested. On June 29, 2026 the Supreme Court ruled that Governor Lisa Cook could not be removed immediately because the required process had not been followed, leaving the wider question open. Markets watch independence closely, because confidence that the Fed will fight inflation helps keep long-term rates in check.</p>',
      '<h3>The dual mandate</h3><p>Congress gave the Fed two main goals, <b>maximum employment</b> and <b>stable prices</b>, known as the dual mandate. (The law also lists moderate long-term interest rates.) The Fed defines stable prices as 2% inflation a year, measured by the PCE price index (<a href="#l-inflation">see inflation</a>). When the two goals pull apart, as in stagflation, the Fed has to choose which miss to fight first.</p>',
      '<h3>How a meeting works</h3><ul><li><b>Eight scheduled meetings a year</b>, most over two days.</li><li><b>2:00 pm ET:</b> the statement with the decision and the vote.</li><li><b>2:30 pm ET:</b> the chair’s press conference, where traders listen for hints about the next move.</li><li><b>Four meetings a year</b> (March, June, September and December) also publish the Summary of Economic Projections with the <b>dot plot</b>: each official’s guess for rates at future year ends.</li><li><b>Minutes</b> come out three weeks later and can move markets again.</li></ul><p>The remaining 2026 meetings are October 27–28 and December 8–9 (with projections). The full list is on the <a href="#calendar">calendar</a>.</p>',
      '<h3>The tools</h3><ul><li><b>The target range for the federal funds rate</b>, the overnight rate banks charge each other. It anchors every short-term rate.</li><li><b>Interest on reserve balances</b> and the <b>overnight reverse repo</b> rate, which keep market rates inside that range.</li><li><b>The discount window</b> (primary credit, 4.00%) and the <b>standing repo facility</b> (4.00%): routine overnight backstops where sound banks can borrow, which cap funding stress. Interest on reserves is 3.90% and the reverse repo rate 3.75% (all as of September 17, 2026).</li><li><b>The balance sheet:</b> buying bonds (<b>quantitative easing</b>) pushes long-term rates down; letting them run off (<b>quantitative tightening</b>) does the reverse. QT ran from June 2022 to December 1, 2025. Since January 2026 the Fed has bought short-term Treasury bills only to keep bank reserves ample. Total assets were about $6.76 trillion on October 14, 2026.</li><li><b>Forward guidance:</b> words about the future path, which move markets before any action.</li></ul>',
      '<h3>From the Fed to your wallet</h3><ul><li><b>Credit cards and HELOCs:</b> tied to the prime rate, which banks set at the top of the Fed’s range plus 3 points, so they move within a billing cycle or two.</li><li><b>Savings and money market funds:</b> drift the same way, often more slowly.</li><li><b>Mortgages:</b> follow the 10-year Treasury yield, which the market sets (<a href="#l-rates">see yields</a>). Mortgage rates can even rise after a Fed cut.</li><li><b>Stocks:</b> react to the expected path of rates more than to any single move.</li></ul>',
      '<h3>Where things stand in October 2026</h3><p>On September 16, 2026 the FOMC <b>raised</b> the target range by 0.25 points to <b>3.75% to 4.00%</b>, by a 12–0 vote, saying inflation "remains elevated". The latest readings: CPI inflation 3.7% over the year to September (core CPI 2.6%), core PCE inflation 3.0% in August, and unemployment 4.2% in September with job growth of only 29,000. The path here: three quarter-point cuts in September, October and December 2025 took the range to 3.50–3.75%; the Fed held through mid-2026 (in July, three members already wanted a hike); then came the September hike. The September dot plot’s median shows 4.1% at the end of 2026, which implies one more quarter-point hike this year. The next decision is October 28 at 2:00 pm ET.</p>',
      '<h3>Four moments that shaped today’s Fed</h3><ul><li><b>1979–1982:</b> with CPI inflation near 15% in early 1980, Chair Paul Volcker pushed the fed funds rate toward 20%. Two recessions followed, and inflation broke.</li><li><b>2008:</b> the financial crisis took rates to 0–0.25% and QE began in November 2008.</li><li><b>2020:</b> in March the Fed cut to 0–0.25% in two emergency moves and bought hundreds of billions of dollars of bonds.</li><li><b>2022–2023:</b> eleven hikes to 5.25–5.50% by July 2023, the most aggressive pace since the early 1980s.</li></ul>',
    ],
    example: {
      title: 'From a Fed hike to your credit card',
      intro: 'The September 16, 2026 hike, followed through one household. The card margin and savings rate are illustrative.',
      steps: [
        'The FOMC raises the target range by 0.25 points, from 3.50–3.75% to 3.75–4.00%.',
        'Banks’ prime rate follows the top of the range plus 3 points: from 6.75% to 7.00%.',
        'A variable card APR set at prime + 15 points moves from 21.75% to 22.00%.',
        'On a $5,000 balance carried for a year, that adds about $12.50 of interest ($5,000 × 0.25%).',
        'A savings account paying 4.00% may drift toward 4.25% if the bank passes the hike on: about $25 more a year on $10,000.',
      ],
      result: 'Small per dollar, but it reaches millions of loans and accounts at once. That is how the Fed cools or warms the economy.',
    },
    mistakes: [
      'Thinking the Fed sets mortgage rates. They follow the 10-year Treasury yield, which the market sets.',
      'Watching only the decision and missing the statement, the dot plot and the press conference, which often move markets more.',
      'Treating the dot plot as a promise. It is a forecast that changes with the data.',
      'Betting heavily on rate cuts while the Fed is still saying inflation is too high.',
    ],
    points: [
      'The FOMC has 12 voters: 7 governors, the New York Fed president and 4 rotating presidents.',
      'Its goals are maximum employment and 2% inflation measured by PCE.',
      'Eight meetings a year; statement at 2:00 pm ET, press conference at 2:30.',
      'Card and HELOC rates follow the Fed quickly; mortgages follow the 10-year yield.',
      'In September 2026 the Fed hiked to 3.75–4.00% because inflation was still above goal; the dot plot points to one more hike in 2026.',
    ],
    terms: ['Federal Reserve', 'FOMC', 'Federal funds rate', 'Dual mandate', 'Dot plot', 'Quantitative easing'],
    quiz: { q: 'Who votes on interest rates at an FOMC meeting?', options: ['All 19 governors and regional presidents', 'The 7 governors, the New York Fed president and 4 rotating regional presidents', 'Only the Fed chair'], answer: 1, why: 'Twelve members vote. All 12 regional presidents attend and speak, but only New York plus four others vote in a given year.' },
    sources: [SRC.fomc, SRC.sep16, SRC.impl, SRC.sep, SRC.warsh, SRC.h41],
  });

  SML.lessons.push({
    id: 'l-rates', course: 'fed', order: 3, title: 'Rates, yields and the yield curve', mins: 11, level: 'Intermediate',
    summary: 'Why the 10-year yield matters, how rates move stocks and bonds, and what the curve says.',
    idea: 'Interest rates are the price of time. When they rise, money in the future is worth less today, so stocks and bonds fall.',
    widget: 'rateValuation',
    try: 'Drag the 10-year yield on each tab and watch a fair P/E, bond prices, a mortgage payment and the yield curve change.',
    body: [
      '<h3>Short rates and long rates</h3><p>The Fed sets the overnight rate directly and nudges longer rates through its guidance and its bond holdings (QE and QT). Beyond that, longer yields are set by trading in Treasury bonds, based on where investors think inflation, growth and the Fed are heading, plus extra pay for tying money up longer. The <b>10-year Treasury yield</b> is the benchmark that mortgages and stock valuations watch. On October 20, 2026 the curve read: 3-month 4.26%, 2-year 4.79%, 10-year 5.12%, 30-year 5.42%.</p>',
      '<h3>Why rates move stock prices</h3><p>A stock is worth its future profits discounted back to today. A higher rate means a bigger discount. Companies whose profits are mostly far in the future, the fast growers, are hit hardest, a bit like long-term bonds. That is why tech stocks fell hardest when yields jumped in 2022. Steady companies paying profits now are hit less.</p>',
      '<h3>Bonds: the seesaw</h3><p>When yields rise, existing bonds with lower coupons are worth less, so their prices fall. <b>Duration</b> tells you by how much: a bond fund with a duration of 6 loses about 6% if yields rise 1 point. Long bonds swing the most. In 2022 a US total bond market index fund lost about 13% and an S&P 500 index fund about 18%: inflation hit both at once. More on bonds in <a href="#l-bonds">bonds and interest rates</a>.</p>',
      '<h3>Deficits and the supply of Treasuries</h3><p>When the government spends more than it collects in taxes, it borrows by selling Treasury bonds. The more bonds investors must absorb, the higher the yield they may demand for holding them for many years, often called the <b>term premium</b>. That is one reason long-term yields can rise even when the Fed is not hiking, and why Treasury auctions and budget news can move the bond market.</p>',
      '<h3>Real yields</h3><p>A <b>real yield</b> is the yield minus expected inflation. It is the true reward for lending. Rising real yields tend to pressure growth stocks and gold, which pays no interest. Treasury inflation-protected bonds (TIPS) show the real yield directly.</p>',
      '<h3>The yield curve</h3><ul><li><b>Normal:</b> long yields above short ones. The usual shape in an expansion. In October 2026 the 10-year sat about 0.33 points above the 2-year.</li><li><b>Flat:</b> little extra pay for lending longer, common after the Fed has hiked.</li><li><b>Inverted:</b> short yields above long ones. Investors expect cuts, usually because they expect growth to weaken. Inversions have come before most US recessions, but with long and uneven delays, and the 10-year stayed below the 2-year from July 2022 to August 2024, the longest inversion on record, without a recession following quickly.</li></ul>',
      '<h3>Mortgage rates</h3><p>Mortgage rates track the 10-year yield plus a spread for risk and costs. In mid-October 2026 the average 30-year fixed rate was 7.40% while the 10-year yielded about 5.12%, a spread of about 2.3 points. Use the Mortgage tab, then the <a href="#l-mortgage">mortgage lesson</a>.</p>',
    ],
    example: {
      title: 'One point higher, two companies',
      intro: 'The Stocks tab model: required return = 10-year yield + 4 points of extra return for owning stocks.',
      steps: [
        'Start with the 10-year yield at 5.12%. The steady company (3% growth, pays out 70%) is worth about 11.8 times earnings.',
        'The fast-grower (14% growth for ten years, then 3.5%) is worth about 22.5 times earnings.',
        'Yields rise 1 point to 6.12%. The steady company’s fair P/E falls to about 10.1, a drop of about 14%.',
        'The fast-grower’s falls to about 17.9, a drop of about 21%, because more of its value is far in the future.',
        'On the Bonds tab, the same 1-point rise cuts a 30-year bond by about 13.6% and a 2-year by only about 1.8%.',
      ],
      result: 'Long-dated assets, whether bonds or growth stocks, feel rate moves the most.',
    },
    mistakes: [
      'Thinking the Fed controls long-term rates. It sets the overnight rate directly and only influences longer rates.',
      'Calling long-term bonds safe without checking duration. A 30-year bond can lose more than 10% when yields jump.',
      'Treating an inverted curve as a signal to sell everything. The delay before past recessions has been long and uneven.',
      'Forgetting that stocks and bonds can fall together when inflation is the problem.',
    ],
    points: [
      'The 10-year Treasury yield is the benchmark for mortgages and stock valuations.',
      'Higher rates lower what future profits are worth; growth stocks feel it most.',
      'Bond prices move opposite to yields; duration says by how much.',
      'Normal, flat and inverted curves each tell a story about expected growth and Fed moves.',
      'Mortgage rates follow the 10-year plus a spread, about 2.3 points in October 2026.',
    ],
    terms: ['Treasury yield', 'Yield curve', 'Inverted yield curve', 'Real yield', 'Duration', 'Basis point'],
    quiz: { q: 'The 10-year yield jumps from 4% to 5%. Which usually falls the most?', options: ['A steady utility with slow, reliable profits', 'A fast-growing company whose profits are mostly years away', 'Cash in a money market fund'], answer: 1, why: 'Most of a fast-grower’s value is in distant profits, which a higher discount rate shrinks the most. Money market funds actually earn more when rates rise.' },
    sources: [SRC.curve, SRC.pmms, SRC.inv],
  });
})();
