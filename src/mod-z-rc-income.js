/* FiredBunny · Read a Real Company (fork K2).
   Lessons: l-rc-words (termTranslator) and l-rc-apple-income (incomeWaterfall), plus the tool widget statementExplorer ★.
   Every company figure is read from SML.realco (content-realco.js); every ratio below is computed from it at load.
   Hoppy's Coffee Cart is the shared made-up example from SPEC-realco.md. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  if (!SML.realco || !SML.realco.apple || !SML.realco.spacex) return;
  const RC = SML.realco, A = RC.apple, X = RC.spacex;
  const MI = F.minus, clamp = SML.clamp;
  const $id = (x) => document.getElementById(x);

  /* ---------------- formatting ---------------- */
  const M = (v) => F.usd(v, 0) + 'M';                                                       // −$143M · $109,417M
  const Bn = (v, d) => (v < 0 ? MI : '') + '$' + F.num(Math.abs(v) / 1000, d == null ? 1 : d) + 'B';
  const BM = (v) => (v === 0 ? '$0' : Math.abs(v) >= 1000 ? Bn(v) : M(v));
  const H$ = (v) => F.usd(v, 0);
  const E$ = (v) => F.usd(v, 2);
  const P = (v, d) => F.pct(v, d == null ? 1 : d);
  const SP = (v, d) => F.spct(v, d == null ? 1 : d);
  const shM = (v) => F.num(v, 1) + 'M';
  const cents = (v) => F.num(v, 1) + '¢';
  const pc = (a, b) => ((a - b) / Math.abs(b)) * 100;
  const sgn = (v, f) => (v > 0 ? '+' : v < 0 ? MI : '') + f(Math.abs(v));
  const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);
  const strip = (h) => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  const estW = (str, px, mono) => strip(str).length * px * (mono ? 0.62 : 0.56);
  const tx = (x, str, px, W, mono) => { const w = estW(str, px, mono); return clamp(x, w / 2 + 2, W - w / 2 - 2); };

  /* ---------------- derived numbers ---------------- */
  const ai = A.is.cur, ay = A.is.ya, ap = A.is.pq, xi = X.is.cur, xy = X.is.ya, xp = X.is.pq;
  const xOpex = (r) => r.rd + r.sga + r.restructuring + r.impairment;
  const xNonOp = (r) => r.intExp + r.intInc + r.other;
  const TR = A.tariffRefund, G = A.call.guidance, EXA = A.expectations, EXX = X.expectations;
  const D = {
    revYoY: pc(ai.revenue, ay.revenue), revQoQ: pc(ai.revenue, ap.revenue),
    gm: (ai.gross / ai.revenue) * 100, gmYa: (ay.gross / ay.revenue) * 100, gmPq: (ap.gross / ap.revenue) * 100,
    om: (ai.opInc / ai.revenue) * 100, omYa: (ay.opInc / ay.revenue) * 100,
    nm: (ai.netInc / ai.revenue) * 100, nmYa: (ay.netInc / ay.revenue) * 100,
    tax: (ai.tax / ai.pretax) * 100, taxYa: (ay.tax / ay.pretax) * 100,
    prodGP: ai.prodSales - ai.prodCost, servGP: ai.servSales - ai.servCost,
    prodGPya: ay.prodSales - ay.prodCost, servGPya: ay.servSales - ay.servCost,
    epsYoY: pc(ai.epsDil, ay.epsDil), niYoY: pc(ai.netInc, ay.netInc), shYoY: pc(ai.shDil, ay.shDil),
    xRevYoY: pc(xi.revenue, xy.revenue), xRevQoQ: pc(xi.revenue, xp.revenue),
    xGm: (xi.gross / xi.revenue) * 100, xGmYa: (xy.gross / xy.revenue) * 100,
    xOm: (xi.opInc / xi.revenue) * 100, xOmYa: (xy.opInc / xy.revenue) * 100,
    xNm: (xi.netInc / xi.revenue) * 100, xNmYa: (xy.netInc / xy.revenue) * 100,
    xEbitdaM: (X.ebitda.cur / xi.revenue) * 100, xEbitdaMya: (X.ebitda.ya / xy.revenue) * 100,
    xGmPq: (xp.gross / xp.revenue) * 100, xOmPq: (xp.opInc / xp.revenue) * 100,
    xFcf9: [X.cf9.operating[0] + X.cf9.ppe[0], X.cf9.operating[1] + X.cf9.ppe[1]],
    xBelow: X.belowTheLine.netInterest + X.belowTheLine.other + X.belowTheLine.taxBenefit,
  };
  /* SpaceX helpers: segment lookup, EBITDA bridge lines, and guidance ranges parsed from the call outlook text */
  const XSEG = (k, p) => X.segments[p || 'cur'].find((g) => g.k === k) || {};
  const XBR = (name) => (X.ebitda.bridge.find((b) => b[0] === name) || [0, 0])[1];
  const nums = (t) => (String(t || '').match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const xOut = X.call.outlook || [], xQ1 = nums(xOut.find((t) => /first quarter of 2027/.test(t))), xGW = nums(xOut.find((t) => /GW/.test(t)));
  D.xGuideRev = xQ1.length >= 2 ? [xQ1[0] * 1000, xQ1[1] * 1000] : null;
  D.xGuideGW = xGW.length >= 2 ? [xGW[0], xGW[1]] : null;
  D.xNextDay = X.reaction.nextDayPct;
  const segOpTxt = () => { const sp = XSEG('space').opInc; return `Starlink earned ${M(XSEG('conn').opInc)}, Super Intelligence ${M(XSEG('ai').opInc)} after ${M(X.segments.notes.cursorStockComp)} of Cursor-related stock pay, and Space ${sp < 0 ? 'lost ' + M(-sp) : 'earned ' + M(sp)}`; };
  D.prodGM = (D.prodGP / ai.prodSales) * 100; D.servGM = (D.servGP / ai.servSales) * 100;
  D.servRevShare = (ai.servSales / ai.revenue) * 100; D.servGPShare = (D.servGP / ai.gross) * 100;
  /* Tariff refund: Apple gave about 2 points of gross margin and $0.11 of EPS. We back the dollars out of the $0.11:
     $0.11 × diluted shares = after-tax effect; ÷ (1 − the quarter's tax rate) = pre-tax effect inside cost of sales. */
  D.ref = (function () { const t = ai.tax / ai.pretax, net = TR.eps * ai.shDil, pre = net / (1 - t); return { net, pre, taxOn: pre - net, eps: Math.round((ai.epsDil - TR.eps) * 100) / 100 }; })();
  D.gmEx = ((ai.gross - D.ref.pre) / ai.revenue) * 100;
  D.epsExYoY = pc(D.ref.eps, ay.epsDil);
  D.gLo = G.baseRevenue * (1 + G.revGrowth[0] / 100); D.gHi = G.baseRevenue * (1 + G.revGrowth[1] / 100);
  const cents2 = (v) => Math.round(v * 100);
  D.beat = [cents2(ai.epsDil - EXA.eps[1]), cents2(ai.epsDil - EXA.eps[0])];
  D.beatEx = [cents2(D.ref.eps - EXA.eps[1]), cents2(D.ref.eps - EXA.eps[0])];
  const bsv = (list, k, p) => { const r = list.find((x) => x.k === k); return r ? r[p] : 0; };
  const aB = A.bs, xB = X.bs, aCF = A.cf9;
  D.aCashMs = (p) => bsv(aB.assets, 'cash', p) + bsv(aB.assets, 'msCur', p) + bsv(aB.assets, 'msNon', p);
  D.aDebt = (p) => bsv(aB.liabilities, 'cp', p) + bsv(aB.liabilities, 'debtCur', p) + bsv(aB.liabilities, 'debtNon', p);
  D.xCashMs = (p) => bsv(xB.assets, 'cash', p) + bsv(xB.assets, 'ms', p);
  D.xDebt = (p) => bsv(xB.liabilities, 'debtCur', p) + bsv(xB.liabilities, 'debtNon', p);
  D.aCapex = [bsv(aCF.investing, 'capex', 'cur'), bsv(aCF.investing, 'capex', 'ya')];
  D.aFcf = [aCF.totals.operating[0] + D.aCapex[0], aCF.totals.operating[1] + D.aCapex[1]];
  D.aBvps = aB.totals.equity[0] / ai.shBasic;

  /* Hoppy's Coffee Cart (made up; numbers fixed by SPEC-realco.md) */
  const HOP = {
    cur: { revenue: 10000, cost: 4000, gross: 6000, rd: 500, sga: 1500, opex: 2000, opInc: 4000, interest: -200, pretax: 3800, tax: 760, netInc: 3040, sh: 1000, eps: 3.04 },
    ya: { revenue: 8000, cost: 3600, gross: 4400, rd: 400, sga: 1400, opex: 1800, opInc: 2600, interest: -200, pretax: 2400, tax: 480, netInc: 1920, sh: 1000, eps: 1.92 },
    bs: { cash: 6000, inv: 1000, ar: 800, equip: 12000, assets: 19800, ap: 700, defrev: 300, loan: 5000, liab: 6000, equity: 13800 },
    cf: { ni: 3040, dep: 200, inv: -300, ap: 100, ocf: 3040, capex: -600, fcf: 2440, div: -1000 },
  };
  const hc = HOP.cur, hy = HOP.ya;

  /* ---------------- CSS ---------------- */
  SML.css(`
    .rci-hl{padding:14px 16px 15px;background:var(--surface);display:flex;flex-direction:column;gap:8px}
    .rci-hl .k{display:flex;align-items:center;gap:8px;font:600 10px/1.3 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
    .rci-hl .k i{flex:0 0 7px;width:7px;height:7px;border-radius:50%;background:var(--flame);box-shadow:0 0 8px var(--flame)}
    .rci-hl p{font-size:16.5px;line-height:1.75;color:var(--ink);text-wrap:pretty}
    .rci-j{font:inherit;line-height:1.3;border:0;margin:0 1px;padding:1px 5px;border-radius:4px;cursor:pointer;color:var(--ink);background:color-mix(in srgb,var(--accent) 13%,transparent);box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--accent) 70%,transparent);transition:background-color .15s,color .15s}
    .rci-j:hover{background:color-mix(in srgb,var(--accent) 28%,transparent)}
    .rci-j.on{background:var(--accent);color:var(--on-acc);box-shadow:none}
    .rci-j.seen:not(.on){box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--up) 70%,transparent);background:color-mix(in srgb,var(--up) 11%,transparent)}
    .rci-cap{font-size:12px;color:var(--muted)}
    .rci-nw{white-space:nowrap}
    .rci-nav{gap:8px}
    .rci-nav label{flex:1 1 120px;min-width:0;display:flex}
    .rci-nav select{width:100%;min-width:0;padding:7px 10px;font-size:13.5px}
    .rci-prog{display:inline-flex;align-items:center;gap:8px;font:600 10.5px/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
    .rci-prog .prog{width:64px}
    .rci-prog .prog i{background:var(--up)}
    .rci-card{padding:16px;background:var(--surface);display:flex;flex-direction:column;gap:10px}
    .rci-card-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}
    .rci-card-n{font-family:var(--display);font-weight:400;font-size:30px;line-height:.95;text-transform:uppercase;color:var(--ink);letter-spacing:.01em}
    .rci-card-aka{font:500 10.5px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .rci-dl{display:flex;flex-direction:column;margin:0}
    .rci-dl > div{display:grid;grid-template-columns:148px minmax(0,1fr);gap:14px;padding:10px 0;border-top:1px solid var(--line)}
    .rci-dl dt{font:600 10px/1.6 var(--mono);letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
    .rci-dl dd{margin:0;font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 88%,transparent);min-width:0}
    .rci-dl dd p{margin-top:4px}
    .rci-dl .hop dt{color:var(--flame)} .rci-dl .real dt{color:var(--info)} .rci-dl .stock dt{color:var(--up)} .rci-dl .what dt{color:var(--accent)}
    @media (max-width:560px){.rci-dl > div{grid-template-columns:1fr;gap:3px}}
    .rci-math{font:600 15px/1.45 var(--mono);color:var(--ink);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
    .rci-m{font-family:var(--mono);font-weight:600;color:var(--ink);font-size:13.5px;white-space:normal}
    .rci-tag{display:inline-block;vertical-align:2px;margin-left:6px;padding:1px 6px;border-radius:3px;border:1px solid color-mix(in srgb,var(--violet) 45%,transparent);font:600 9.5px/1.4 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--violet);white-space:nowrap}
    .rci-tag.acc{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
    .rci-best{align-self:flex-start;margin-top:2px}
    .rci-flip{animation:rciFlip .42s cubic-bezier(.2,.8,.2,1)}
    @keyframes rciFlip{from{transform:perspective(900px) rotateX(-55deg);opacity:.15}to{transform:none;opacity:1}}
    .rci-grow .g{transform-box:fill-box;transform-origin:left center;animation:rciGrow .55s cubic-bezier(.2,.8,.2,1) both}
    .rci-grow .gr{transform-box:fill-box;transform-origin:right center;animation:rciGrow .55s cubic-bezier(.2,.8,.2,1) both}
    .rci-grow .gu{transform-box:fill-box;transform-origin:center bottom;animation:rciGrowU .55s cubic-bezier(.2,.8,.2,1) both}
    @keyframes rciGrow{from{transform:scaleX(0)}} @keyframes rciGrowU{from{transform:scaleY(0)}}
    @media (prefers-reduced-motion:reduce){.rci-flip,.rci-grow .g,.rci-grow .gr,.rci-grow .gu{animation:none}}
    .rci-row{cursor:pointer;outline:none}
    .rci-bg{fill:transparent}
    .rci-row:not(.on):hover .rci-bg{fill:color-mix(in srgb,var(--accent) 7%,transparent)}
    .rci-row:focus-visible .rci-bg{stroke:var(--accent);stroke-width:1.5}
    .rci-cardwrap:empty{display:none}
    .rci-xh{padding:10px 16px;background:var(--surface);font-size:13px;line-height:1.5;color:var(--muted)}
    .rci-xh b{color:var(--ink)}
    .rci-tw{background:var(--surface);overflow-x:auto;-webkit-overflow-scrolling:touch}
    .rci-t{width:100%;border-collapse:collapse;font:500 12.5px/1.35 var(--mono);font-variant-numeric:tabular-nums}
    .rci-t th,.rci-t td{padding:7px 8px;border-bottom:1px solid var(--line);text-align:right;vertical-align:baseline;white-space:nowrap;color:var(--text)}
    .rci-t th:first-child{text-align:left;white-space:normal;width:100%;min-width:118px;padding-left:16px}
    .rci-t td:last-child,.rci-t th:last-child{padding-right:16px}
    .rci-t thead th:not(:first-child),.rci-t tr.sec th.num{min-width:86px}
    .rci-t thead th{font:500 9.5px/1.25 var(--mono);text-transform:uppercase;letter-spacing:.1em;color:var(--muted);background:var(--shade);white-space:normal;vertical-align:bottom}
    .rci-t tr.sec th{font:600 10px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);background:color-mix(in srgb,var(--bg) 40%,var(--surface));padding-top:12px}
    .rci-t tr.sec th.num{color:var(--muted);font-weight:500;font-size:9.5px;white-space:normal}
    .rci-t tr.tot th,.rci-t tr.tot td{color:var(--ink);font-weight:600;border-top:1px solid var(--input)}
    .rci-t tr.sub th:first-child{padding-left:28px}
    .rci-t tr.calc th:first-child .rci-ln{font-style:italic;color:var(--muted)}
    .rci-t tr.row:hover{background:var(--surface-2)}
    .rci-t tr.on{background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
    .rci-t tr.on .rci-ln{color:var(--accent)}
    .rci-t tr.det td{white-space:normal;text-align:left;padding:0 0 0 0;background:var(--bg);border-left:3px solid var(--accent)}
    .rci-t tr.det .rci-card{background:transparent;font:400 14px/1.5 var(--sans)}
    .rci-t tr.det .rci-math,.rci-t tr.det .rci-m{font-family:var(--mono)}
    .rci-t td.up{color:var(--up)} .rci-t td.dn{color:var(--down)} .rci-t td.na{color:var(--muted);opacity:.7}
    .rci-ln{appearance:none;border:0;background:none;padding:0;margin:0;font:500 13.5px/1.35 var(--sans);color:inherit;text-align:left;cursor:pointer;display:inline}
    .rci-t tr.tot .rci-ln{font-weight:600;color:var(--ink)}
    .rci-ln:hover{color:var(--accent)}
    .rci-ln::after{content:"\\00a0+";font-family:var(--mono);color:var(--muted);font-size:11px}
    .rci-t tr.on .rci-ln::after{content:"\\00a0−"}
    .rci-ln:focus-visible{outline:2px solid color-mix(in srgb,var(--accent) 70%,transparent);outline-offset:2px;border-radius:2px}
    @media (max-width:560px){.rci-t thead th:not(:first-child),.rci-t tr.sec th.num{min-width:0}.rci-t{font-size:11.5px}.rci-t th,.rci-t td{padding:7px 5px}.rci-t th:first-child{padding-left:10px;min-width:104px}.rci-t td:last-child,.rci-t th:last-child{padding-right:10px}.rci-ln{font-size:12.5px}.rci-t tr.sub th:first-child{padding-left:18px}}
  `);

  /* ---------------- svg helpers ---------------- */
  const chip = (xr, y, label, kind) => { const w = label.length * 7.3 + 16; return S.rect(xr - w, y - 13, w, 19, 'f-' + kind + '-t', 9.5) + S.text(xr - w / 2, y, label, 'cap ' + kind, 'middle'); };
  const hatch = (pid, c) => `<defs><pattern id="${pid}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="f-${c}-t"/><line x1="0" y1="0" x2="0" y2="7" class="s-${c} w25"/></pattern></defs>`;
  /* figures with tappable rows: expose them as a group so screen readers reach the buttons inside */
  const wrapI = (W, H, label, body, cls) => S.wrap(W, H, label, body, cls).replace('role="img"', 'role="group"');
  const ON = { info: 'on', up: 'on', dn: 'on', acc: 'onacc', vio: 'on', mut: 'on', shade2: 'ink' };

  /* horizontal waterfall. steps [{l, v, abs, c, hl, txt}] o {fmt, hl:true to dim the rest} */
  function hwf(W, steps, o) {
    o = o || {};
    const compact = W < 480, rowH = compact ? 25 : 27, lw = compact ? 100 : 162, vw = compact ? 70 : 92;
    const x0 = lw + 4, x1 = W - vw - 8;
    let run = 0;
    const bars = steps.map((s) => { let a, b; if (s.abs) { a = 0; b = s.v; } else { a = run; b = run + s.v; } run = b; return Object.assign({ a, b }, s); });
    const vals = [0]; bars.forEach((b) => vals.push(b.a, b.b));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const x = SML.lin(lo, hi, x0, x1), top = 4;
    let s = '';
    if (lo < 0) s += S.line(x(0), top - 2, x(0), top + bars.length * rowH, 's-mut dash2');
    bars.forEach((b, i) => {
      const y = top + i * rowH, cy = y + rowH / 2, bh = rowH - 9, lit = !o.hl || b.hl;
      const xa = x(Math.min(b.a, b.b)), xb = x(Math.max(b.a, b.b));
      const c = b.c || (b.v >= 0 ? 'up' : 'dn');
      if (o.hl && b.hl) s += S.rect(0, y + 1, W, rowH - 2, 'f-acc-t', 4);
      s += S.text(4, cy + 4, b.l, (compact ? 'sm' : 'md') + (lit ? ' ink' : ' mut') + (b.abs ? ' b' : ''));
      s += S.rect(xa, cy - bh / 2, Math.max(2, xb - xa), bh, 'f-' + c + (lit ? '' : ' o35') + (b.abs || b.v >= 0 ? ' g' : ' gr'), 2);
      if (i < bars.length - 1) s += S.line(x(b.b), cy + bh / 2, x(b.b), cy + rowH - bh / 2, 's-mut dash2' + (lit ? '' : ' o35'));
      const val = b.txt != null ? b.txt : b.abs ? o.fmt(b.v) : sgn(b.v, o.fmt);
      s += S.text(W - 4, cy + 4, val, 'sm mono b ' + (!lit ? 'mut' : b.abs ? (b.v < 0 ? 'dn' : 'ink') : 'mut'), 'end');
    });
    return { H: top + bars.length * rowH + 4, body: s };
  }

  /* vertical bars with bracket arrows. o {bars:[{l,l2,v,segs,c,dim,ghost,txt,tag}], arrows:[{a,b,t,c}], fmt, legend} */
  function figCompare(W, o) {
    const n = o.bars.length, compact = W < 480, arrows = o.arrows || [];
    const legendH = o.legend ? 22 : 0, H = o.H || (compact ? 236 : 252);
    const top = 8 + arrows.length * 26 + 26, labY = H - legendH - 32;
    const neg = o.bars.some((b) => b.v < 0);
    const vals = [0].concat(o.bars.map((b) => b.v));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const y = SML.lin(lo, hi > 0 ? hi : 1, labY - 8 - (neg ? 22 : 0), top);
    const slot = W / n, bw = Math.min(compact ? 48 : 72, slot * 0.56), cx = (i) => slot * (i + 0.5);
    let s = S.line(0, y(0), W, y(0), 's-mut');
    o.bars.forEach((b, i) => {
      const x = cx(i) - bw / 2, y0 = y(0), yv = y(b.v), dim = b.dim ? ' o35' : '';
      if (b.ghost) s += S.rect(x, Math.min(yv, y0), bw, Math.abs(yv - y0), 'f-acc-t s-acc dash w15', 3);
      else if (b.segs) { let acc = 0; b.segs.forEach((g) => { const ya = y(acc), yb = y(acc + g.v); s += S.rect(x, yb, bw, Math.max(0, ya - yb - 1), 'f-' + g.c + dim + ' gu'); acc += g.v; }); }
      else s += S.rect(x, Math.min(yv, y0), bw, Math.max(2, Math.abs(yv - y0)), 'f-' + (b.c || (b.v < 0 ? 'dn' : 'info')) + dim + ' gu', 3);
      const lab = b.txt != null ? b.txt : o.fmt(b.v);
      s += b.v >= 0 ? S.text(cx(i), yv - 7, lab, 'sm mono b ' + (b.dim ? 'mut' : 'ink'), 'middle') : S.text(cx(i), yv + 15, lab, 'sm mono b ' + (b.dim ? 'mut' : 'dn'), 'middle');
      if (b.tag) s += S.text(cx(i), b.v >= 0 ? yv - 21 : yv + 29, b.tag, 'xs b acc', 'middle');
      s += S.text(cx(i), labY + 16, b.l, (compact ? 'sm' : 'md') + (b.dim ? ' mut' : ' ink'), 'middle');
      if (b.l2) s += S.text(cx(i), labY + 30, b.l2, 'xs', 'middle');
    });
    arrows.forEach((a, k) => {
      const ly = 12 + k * 26, off = (k - (arrows.length - 1) / 2) * 7;
      const xa = cx(a.a) + off, xb = cx(a.b) + off;
      const end = (j) => y(Math.max(0, o.bars[j].v)) - (o.bars[j].tag ? 32 : 21);
      const ea = end(a.a), eb = end(a.b);
      s += S.poly([[xa, ea], [xa, ly], [xb, ly], [xb, eb - 6]], 's-' + a.c + ' w15') + S.polygon([[xb, eb], [xb - 4.5, eb - 8], [xb + 4.5, eb - 8]], 'f-' + a.c);
      s += S.circle(xa, ea, 2.5, 'f-' + a.c);
      const tw = estW(a.t, 11.5, true) + 14, tcx = tx((xa + xb) / 2, a.t, 11.5, W - 14, true) + 7;
      s += S.rect(tcx - tw / 2, ly - 9.5, tw, 19, 'f-surf s-' + a.c, 9.5) + S.text(tcx, ly + 4, a.t, 'sm mono b ' + a.c, 'middle');
    });
    if (o.legend) { let lx = 0; o.legend.forEach((g) => { s += S.rect(lx, H - 13, 10, 10, 'f-' + g.c, 2) + S.text(lx + 15, H - 4, g.l, 'sm'); lx += 30 + estW(g.l, 11.5); }); }
    return { H, body: s };
  }

  /* percent-of-sales tracks. rows [{l, v, c, dim, ref, note}] */
  function figMargin(W, rows, pid) {
    const vs = rows.map((r) => r.v), neg = Math.min(...vs) < 0;
    const dmin = neg ? Math.min(-30, Math.floor(Math.min(...vs) / 10) * 10) : 0;
    const x = SML.lin(dmin, 100, 1, W - 1), rowH = 56;
    let s = pid ? hatch(pid, 'acc') : '';
    rows.forEach((r, i) => {
      const y = 2 + i * rowH, by = y + 20, bh = 20;
      s += S.text(0, y + 13, r.l, 'sm b ' + (r.dim ? 'mut' : 'ink'));
      if (r.note) s += S.text(W, y + 13, r.note, 'xs b acc', 'end');
      s += S.rect(x(0), by, x(100) - x(0), bh, 'f-shade2 o50', 3);
      if (neg) s += S.rect(x(dmin), by, x(0) - x(dmin), bh, 'f-dn-t', 3);
      const xa = x(Math.min(0, r.v)), xb = x(Math.max(0, r.v));
      s += S.rect(xa, by, Math.max(2, xb - xa), bh, 'f-' + (r.v < 0 ? 'dn' : r.c || 'up') + (r.dim ? ' o50' : '') + (r.v < 0 ? ' gr' : ' g'), 3);
      if (r.ref && pid) { const xr = x(r.v - r.ref); s += S.rect(xr, by, xb - xr, bh, '', 0, ` fill="url(#${pid})"`); }
      const lab = P(r.v);
      if (r.v >= 0) s += xb + 10 + estW(lab, 13, true) < W ? S.text(xb + 8, by + 15, lab, 'md mono b ' + (r.dim ? 'mut' : 'ink')) : S.text(xb - 7, by + 15, lab, 'md mono b on', 'end');
      else s += S.text(x(0) + 8, by + 15, lab, 'md mono b dn');
    });
    const ay = 2 + rows.length * rowH;
    s += S.line(x(0), 22, x(0), ay - 10, 's-mut') + S.text(x(0), ay + 3, '0%', 'xs', neg ? 'middle' : 'start') + S.text(W, ay + 3, '100% of sales', 'xs', 'end');
    if (neg) s += S.text(x(dmin), ay + 3, P(dmin, 0), 'xs dn', 'start');
    return { H: ay + 8, body: s };
  }

  /* net income ÷ shares = EPS. rows [{l, ni, sh, eps, tag, tc, dim}] */
  function figEps(W, rows) {
    const compact = W < 480, opw = compact ? 18 : 28, bw = (W - 2 * opw) / 3, bh = 46, rowH = bh + 32;
    let s = '';
    rows.forEach((r, i) => {
      const y = 2 + i * rowH, by = y + 20;
      s += S.text(0, y + 12, r.l, 'sm b ' + (r.dim ? 'mut' : 'acc'));
      if (r.tag) s += S.text(W, y + 12, r.tag, 'sm mono b ' + (r.tc || 'up'), 'end');
      [[r.ni, compact ? 'Profit' : 'Net income'], [r.sh, 'Shares'], [r.eps, 'EPS']].forEach((c, j) => {
        const bx = j * (bw + opw), last = j === 2;
        s += S.rect(bx, by, bw, bh, last ? 'f-acc-t s-acc' : 'f-surf s-line', 5);
        s += S.text(bx + bw / 2, by + 15, c[1], 'cap', 'middle');
        s += S.text(bx + bw / 2, by + bh - 9, c[0], (compact ? 'md' : 'lg') + ' mono b ' + (last ? (r.dim ? 'mut' : 'acc') : r.dim ? 'mut' : 'ink'), 'middle');
        if (j < 2) s += S.text(bx + bw + opw / 2, by + bh / 2 + 7, j === 0 ? '÷' : '=', 'xl ink', 'middle');
      });
    });
    return { H: 2 + rows.length * rowH, body: s };
  }

  /* expectation number lines. rows [{l, band:[a,b], bandL, bc, act, actL, ac, alt:{v,l,c}, mark:{v,l}, verdict, vc}] */
  function figRange(W, rows) {
    const rowH = 88; let s = '';
    rows.forEach((r, i) => {
      const y = 2 + i * rowH, ay = y + 46;
      s += S.text(0, y + 13, r.l, 'md b ink');
      if (r.verdict) s += chip(W, y + 13, r.verdict, r.vc);
      const vals = [r.act]; if (r.band) vals.push(r.band[0], r.band[1]); if (r.alt) vals.push(r.alt.v); if (r.mark) vals.push(r.mark.v);
      const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.24 || Math.abs(hi) * 0.1 || 1;
      const x = SML.lin(lo - pad, hi + pad, 10, W - 10);
      s += S.line(2, ay, W - 2, ay, 's-line w2');
      /* labels go into lanes (above the line, then two lanes below) so they never overlap */
      const lanes = { a: [], b1: [], b2: [] }, Y = { a: ay - 15, b1: ay + 24, b2: ay + 38 };
      const place = (cx, str, px, mono, prefs) => {
        const w = estW(str, px, mono), c = tx(cx, str, px, W, mono), span = [c - w / 2 - 4, c + w / 2 + 4];
        const lane = prefs.find((p) => !lanes[p].some((q) => q[0] < span[1] && span[0] < q[1])) || prefs[prefs.length - 1];
        lanes[lane].push(span); return { x: c, y: Y[lane] };
      };
      const ac = r.ac || r.vc || 'info', xc = x(r.act);
      const pa = place(xc, r.actL, 11.5, true, ['a', 'b1', 'b2']);
      if (r.band) {
        let xa = x(r.band[0]), xb = x(r.band[1]); if (xb - xa < 9) { const m = (xa + xb) / 2; xa = m - 4.5; xb = m + 4.5; }
        const bc = r.bc || 'acc', pb = place((xa + xb) / 2, r.bandL, 10, false, ['b1', 'b2']);
        s += S.rect(xa, ay - 10, xb - xa, 20, 'f-' + bc + '-t s-' + bc, 3);
        s += S.text(pb.x, pb.y, r.bandL, 'xs b ' + bc, 'middle');
      }
      if (r.mark) { const xm = x(r.mark.v), pm = place(xm, r.mark.l, 10, false, ['b1', 'b2']); s += S.line(xm, ay - 9, xm, ay + 9, 's-mut w2'); s += S.text(pm.x, pm.y, r.mark.l, 'xs', 'middle'); }
      if (r.alt) { const xa2 = x(r.alt.v), c = r.alt.c || 'info', pl = place(xa2, r.alt.l, 11.5, false, ['a', 'b1', 'b2']); s += S.circle(xa2, ay, 6.5, 'f-surf s-' + c + ' w25'); s += S.text(pl.x, pl.y, r.alt.l, 'sm b ' + c, 'middle'); }
      s += S.circle(xc, ay, 8, 'f-' + ac + ' s-surf w2');
      s += S.text(pa.x, pa.y, r.actL, 'sm mono b ' + ac, 'middle');
    });
    return { H: 2 + rows.length * rowH - 2, body: s };
  }

  /* stacked share bar + table. o {segs:[{l, v, c, op}], fmt, op:true, pct:true} */
  function figSeg(W, o) {
    const compact = W < 480; let s = '';
    const tot = sum(o.segs, (g) => g.v), x = SML.lin(0, tot, 0, W);
    let acc = 0;
    o.segs.forEach((g) => {
      const xa = x(acc), w = x(acc + g.v) - xa, sh = P((g.v / tot) * 100, 0);
      s += S.rect(xa, 4, Math.max(1, w - 2), 30, 'f-' + g.c + ' g', 2);
      if (w > estW(sh, 11.5, true) + 10) s += S.text(xa + w / 2 - 1, 23.5, sh, 'sm mono b ' + (ON[g.c] || 'on'), 'middle');
      acc += g.v;
    });
    const c1 = o.op ? W - (compact ? 96 : 150) : o.pct ? W - (compact ? 52 : 70) : W;
    let y = 56;
    if (o.op) { s += S.text(c1, y, 'Revenue', 'cap', 'end') + S.text(W, y, compact ? 'Op. profit' : 'Operating income', 'cap', 'end'); y += 8; }
    o.segs.forEach((g, i) => {
      const ry = y + 18 + i * 24;
      s += S.rect(0, ry - 10, 11, 11, 'f-' + g.c, 2) + S.text(18, ry, compact && g.s ? g.s : g.l, 'md ink');
      s += S.text(c1, ry, o.fmt(g.v), 'md mono b ink', 'end');
      if (o.op) s += S.text(W, ry, o.fmt(g.op), 'md mono b ' + (g.op < 0 ? 'dn' : 'up'), 'end');
      else if (o.pct) s += S.text(W, ry, P((g.v / tot) * 100), 'sm mono', 'end');
    });
    const H = y + 18 + o.segs.length * 24;
    return { H, body: s };
  }

  /* fiscal vs calendar quarters, Oct 2025 – Sep 2026. which: 'cal' | 'fis' */
  function figFiscal(W, which) {
    const mon = ['O', 'N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S'], cw = W / 12, compact = W < 480, b0 = which === 'cal3' ? 9 : 6;
    let s = S.rect(b0 * cw, 0, 3 * cw, 150, 'f-acc-t', 4);
    s += S.text(1.5 * cw, 12, '2025', 'xs', 'middle') + S.text(7.5 * cw, 12, '2026', 'xs', 'middle') + S.line(3 * cw, 2, 3 * cw, 34, 's-mut dash2');
    mon.forEach((m, i) => { s += S.text(cw * (i + 0.5), 29, m, 'sm mono ' + (i >= b0 && i <= b0 + 2 ? 'b acc' : 'ink'), 'middle'); });
    const rows = [
      { y: 56, l: 'Calendar quarters', q: ['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026'], hi: which === 'cal' ? 2 : which === 'cal3' ? 3 : -1 },
      { y: 110, l: compact ? 'Apple fiscal 2026' : 'Apple’s fiscal year 2026', q: ['Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26'], hi: which === 'fis' ? 2 : -1 },
    ];
    rows.forEach((r) => {
      s += S.text(2, r.y - 6, r.l, 'sm b ' + (r.hi >= 0 ? 'acc' : 'mut'));
      r.q.forEach((q, j) => { const on = j === r.hi; s += S.rect(j * 3 * cw + 2, r.y, 3 * cw - 4, 30, on ? 'f-acc s-acc w2' : 'f-surf s-line', 5); s += S.text((j * 3 + 1.5) * cw, r.y + 19.5, q, 'md mono b ' + (on ? 'onacc' : 'ink'), 'middle'); });
    });
    const cap = b0 === 9 ? 'July to September 2026' : 'April to June 2026';
    s += S.text(tx((b0 + 1.5) * cw, cap, 11.5, W), 160, cap, 'sm b acc', 'middle');
    return { H: 166, body: s };
  }

  /* months by season for the coffee cart: YoY vs sequential */
  function figSeasons(W) {
    const mon = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], cw = W / 12, cold = [0, 1, 11], warm = [5, 6, 7];
    let s = '';
    [[24, 'Last year'], [104, 'This year']].forEach(([y, l], r) => {
      s += S.text(0, y - 7, l, 'sm b ' + (r ? 'ink' : 'mut'));
      mon.forEach((m, i) => {
        const c = cold.indexOf(i) >= 0 ? 'f-info-t' : warm.indexOf(i) >= 0 ? 'f-acc-t' : 'f-shade2 o50';
        const hl = i === 5 ? ' s-acc w2' : r === 1 && i === 2 ? ' s-info w2' : '';
        s += S.rect(i * cw + 1.5, y, cw - 3, 30, c + hl, 3) + S.text((i + 0.5) * cw, y + 19.5, m, 'sm mono b ' + (i === 5 ? 'acc' : 'ink'), 'middle');
      });
    });
    const jx = 5.5 * cw, mx = 2.5 * cw;
    s += S.arrow(jx, 58, jx, 100, 'acc', 7);
    const yl = SP(pc(hc.revenue, hy.revenue), 0) + ' YoY: same month';
    s += S.text(jx + 10, 84, yl, 'sm b acc');
    s += S.poly([[mx, 138], [mx, 152], [jx, 152], [jx, 142]], 's-info w15') + S.polygon([[jx, 136], [jx - 4.5, 144], [jx + 4.5, 144]], 'f-info');
    const ql = 'Jun vs Mar: mostly weather';
    s += S.text(tx((mx + jx) / 2, ql, 11.5, W), 170, ql, 'sm b info', 'middle');
    s += S.rect(0, 182, 10, 10, 'f-info-t s-info') + S.text(15, 191, 'cold months', 'xs') + S.rect(92, 182, 10, 10, 'f-acc-t s-acc') + S.text(107, 191, 'warm months', 'xs');
    return { H: 196, body: s };
  }

  function figNote(W, title, lines) {
    let s = S.rect(1, 1, W - 2, 44 + lines.length * 19, 'f-surf s-line dash', 8);
    s += S.text(W / 2, 30, title, 'xl b ink', 'middle');
    lines.forEach((l, i) => { s += S.text(W / 2, 56 + i * 19, l, 'sm' + (i === 0 ? ' ink' : ''), 'middle'); });
    return { H: 48 + lines.length * 19, body: s };
  }

  /* ---------------- mini income statements for the translator ---------------- */
  const SHORT = { op: 'Operating inc.', oth: 'Interest, other', cost: 'Cost of sales', sga: 'SG&amp;A' };
  const LAD = {
    hop: () => [['rev', 'Revenue', hc.revenue, 1], ['cost', 'Cost of sales', -hc.cost], ['gross', 'Gross profit', hc.gross, 1], ['rd', 'R&amp;D', -hc.rd], ['sga', 'SG&amp;A', -hc.sga], ['op', 'Operating income', hc.opInc, 1], ['oth', 'Loan interest', hc.interest], ['tax', 'Tax', -hc.tax], ['net', 'Net income', hc.netInc, 1]],
    apple: () => [['rev', 'Revenue', ai.revenue, 1], ['cost', 'Cost of sales', -ai.cost], ['gross', 'Gross profit', ai.gross, 1], ['rd', 'R&amp;D', -ai.rd], ['sga', 'SG&amp;A', -ai.sga], ['op', 'Operating income', ai.opInc, 1], ['oth', 'Other income', ai.other], ['tax', 'Tax', -ai.tax], ['net', 'Net income', ai.netInc, 1]],
    spacex: () => [['rev', 'Revenue', xi.revenue, 1], ['cost', 'Cost of revenue', -xi.cost], ['gross', 'Gross profit', xi.gross, 1], ['rd', 'R&amp;D', -xi.rd], ['sga', 'SG&amp;A + other', -(xi.sga + xi.restructuring + xi.impairment)], ['op', xi.opInc < 0 ? 'Operating loss' : 'Operating income', xi.opInc, 1], ['oth', 'Interest &amp; other', xNonOp(xi)], ['tax', xi.tax < 0 ? 'Tax benefit' : 'Tax', -xi.tax], ['net', xi.netInc < 0 ? 'Net loss' : 'Net income', xi.netInc, 1]],
  };
  const FM = { hop: H$, apple: BM, spacex: M };
  const ladder = (lens, hl) => (W) => hwf(W, LAD[lens]().map(([k, l, v, abs]) => ({
    l: W < 480 && SHORT[k] && !(lens === 'spacex' && k === 'sga') ? SHORT[k] : l, v, abs: !!abs, hl: hl.indexOf(k) >= 0,
    c: abs ? (v < 0 ? 'dn' : k === 'rev' ? 'info' : k === 'net' ? 'up' : 'acc') : v < 0 ? 'dn' : 'up',
  })), { fmt: FM[lens], hl: true });
  const trendFig = (hlPair, arrows) => (W) => figCompare(W, {
    bars: A.trend.map((t, i) => ({ l: t.q, l2: t.fq, v: t.revenue, c: 'info', dim: hlPair.indexOf(i) < 0, tag: t.q.indexOf('Dec') === 0 ? 'holidays' : '' })),
    arrows, fmt: (v) => Bn(v),
  });
  const xTrio = (arrows) => (W) => figCompare(W, { bars: [{ l: X.labels.ya, v: xy.revenue }, { l: X.labels.pq, v: xp.revenue }, { l: X.labels.cur, v: xi.revenue }], arrows, fmt: M });
  const SEGC = { conn: 'info', ai: 'vio', space: 'acc' };
  const SEGS = { conn: 'Starlink', ai: 'Super Intelligence', space: 'Space' };
  const SEGSS = { conn: 'Starlink', ai: 'Super Intel.', space: 'Space' };
  const SEGT = { conn: 'Connectivity (Starlink)', ai: 'Super Intelligence (formerly AI)', space: 'Space (launch, Starship, Dragon)' };
  const BRL = { 'Net income': ['Net income', 'Net income'], 'Net loss': ['Net loss', 'Net loss'], 'Depreciation & amortization': ['Depreciation &amp; amort.', 'D&amp;A'], 'Stock-based compensation': ['Stock-based pay', 'Stock pay'], 'Acquisition-related stock compensation': ['Deal-related stock pay', 'Deal stock pay'], 'Acquisition-related costs': ['Deal costs', 'Deal costs'], Restructuring: ['Restructuring', 'Restructuring'], 'Interest expense': ['Interest expense', 'Interest paid'], 'Interest income': ['Interest income', 'Interest earned'], 'Other income': ['Other income', 'Other income'], 'Other expense': ['Other expense', 'Other'], 'Income tax benefit': ['Tax benefit', 'Tax benefit'], 'Income taxes': ['Income taxes', 'Taxes'] };

  /* ======================================================================
     Earnings words: one card per term, three lenses (Hoppy's cart, Apple, SpaceX)
     ====================================================================== */
  const GROUPS = ['Sales and growth', 'Costs and gross profit', 'Running costs and operating profit', 'The bottom line', 'Expectations', 'Adjustments and cash'];
  const imag = '<span class="rci-tag acc">imaginary numbers</span>';
  const TT = [
    {
      k: 'revenue', g: 0, n: 'Revenue', aka: 'sales · the top line',
      what: 'All the money customers paid for what the company sold in the period, before any cost comes out. It is the first line of the income statement, so people call it the top line.',
      why: 'Revenue is the first number traders hold up against the consensus. A top-line beat shows customers are really buying; a miss is hard to fix with cost cuts.',
      hop: () => ({ math: `${H$(hc.revenue)} this June vs ${H$(hy.revenue)} last June`, say: `Every cup rung up in June, before paying for a single bean: ${SP(pc(hc.revenue, hy.revenue), 0)} on last June.`, fig: (W) => figCompare(W, { bars: [{ l: 'Last June', v: hy.revenue }, { l: 'This June', v: hc.revenue }], arrows: [{ a: 0, b: 1, t: SP(pc(hc.revenue, hy.revenue), 0) + ' YoY', c: 'up' }], fmt: H$ }) }),
      apple: () => ({ math: `${M(ai.prodSales)} products + ${M(ai.servSales)} services = ${M(ai.revenue)}`, say: `That is ${Bn(ai.revenue)}, up ${P(D.revYoY)} from ${Bn(ay.revenue)} a year earlier. Apple called it its strongest June quarter ever.`, fig: (W) => figCompare(W, { bars: [{ l: A.labels.ya, v: ay.revenue, segs: [{ v: ay.prodSales, c: 'info' }, { v: ay.servSales, c: 'vio' }] }, { l: A.labels.cur, v: ai.revenue, segs: [{ v: ai.prodSales, c: 'info' }, { v: ai.servSales, c: 'vio' }] }], arrows: [{ a: 0, b: 1, t: SP(D.revYoY) + ' YoY', c: 'up' }], fmt: (v) => Bn(v), legend: [{ c: 'info', l: 'Products' }, { c: 'vio', l: 'Services' }] }) }),
      spacex: () => ({ math: `${M(xi.revenue)}, up from ${M(xy.revenue)}`, say: `Revenue was ${F.num(xi.revenue / xy.revenue, 1)} times its level a year earlier (${SP(D.xRevYoY)}). Super Intelligence brought in ${Bn(XSEG('ai').revenue)}, ${P((XSEG('ai').revenue / xi.revenue) * 100, 0)} of it.`, fig: (W) => figCompare(W, { bars: [{ l: X.labels.ya, v: xy.revenue, segs: X.segments.ya.map((g) => ({ v: g.revenue, c: SEGC[g.k] })) }, { l: X.labels.cur, v: xi.revenue, segs: X.segments.cur.map((g) => ({ v: g.revenue, c: SEGC[g.k] })) }], arrows: [{ a: 0, b: 1, t: SP(D.xRevYoY) + ' YoY', c: 'up' }], fmt: M, legend: X.segments.cur.map((g) => ({ c: SEGC[g.k], l: SEGS[g.k] })) }) }),
    },
    {
      k: 'yoy', g: 0, n: 'Year over year', aka: 'YoY',
      what: 'Compares a period with the same period one year earlier: summer with summer, holidays with holidays. The seasons cancel out, so what is left is real growth.',
      why: 'Headlines lead with YoY growth. Growth faster or slower than expected changes how much investors will pay for each dollar of profit, the P/E multiple.',
      hop: () => ({ math: `(${H$(hc.revenue)} − ${H$(hy.revenue)}) ÷ ${H$(hy.revenue)} = ${SP(pc(hc.revenue, hy.revenue), 0)}`, say: 'June against last June: same weather, same summer crowds. So the 25% is the cart really growing.', fig: (W) => figCompare(W, { bars: [{ l: 'Last June', v: hy.revenue }, { l: 'This June', v: hc.revenue }], arrows: [{ a: 0, b: 1, t: SP(pc(hc.revenue, hy.revenue), 0) + ' YoY', c: 'up' }], fmt: H$ }) }),
      apple: () => ({ math: `(${M(ai.revenue)} − ${M(ay.revenue)}) ÷ ${M(ay.revenue)} = ${SP(D.revYoY)}`, say: 'June 2026 quarter against June 2025 quarter. On the chart the December holiday bar towers over the rest, so only same-quarter comparisons are fair for Apple.', fig: trendFig([0, 4], [{ a: 0, b: 4, t: SP(D.revYoY) + ' YoY', c: 'up' }]) }),
      spacex: () => ({ math: `(${M(xi.revenue)} − ${M(xy.revenue)}) ÷ ${M(xy.revenue)} = ${SP(D.xRevYoY)}`, say: 'Revenue was more than two and a half times its level a year earlier. The Super Intelligence segment (Grok, cloud compute, X and, since August, Cursor) did most of the growing.', fig: xTrio([{ a: 0, b: 2, t: SP(D.xRevYoY) + ' YoY', c: 'up' }]) }),
    },
    {
      k: 'qoq', g: 0, n: 'Quarter over quarter', aka: 'QoQ · sequential',
      what: 'Compares a quarter with the one right before it. It spots a turn quickly, but in a seasonal business it mixes the seasons into the number.',
      why: { hop: 'A QoQ dip in a seasonal business is normal and already expected. Traders judge it against the company’s own guidance for that quarter.', apple: 'A QoQ dip in a seasonal business is normal and already expected. Traders judge it against the company’s own guidance for that quarter.', spacex: 'For a fast grower, QoQ is the speedometer. Faster growth than expected can lift the stock; a slowdown from one quarter to the next can sink it even while YoY still looks huge.' },
      hop: () => ({ math: 'QoQ = (this quarter − last quarter) ÷ last quarter', say: 'Hoppy’s sells far more iced drinks in summer than on cold March mornings, so June against March mostly measures the weather. Compare June with last June instead.', fig: (W) => figSeasons(W) }),
      apple: () => ({ math: `(${M(ai.revenue)} − ${M(ap.revenue)}) ÷ ${M(ap.revenue)} = ${SP(D.revQoQ)}`, say: `Sales slipped ${P(-D.revQoQ)} from the March quarter while growing ${P(D.revYoY)} from a year ago. Apple’s June quarter is seasonally smaller than March, so nothing broke.`, fig: trendFig([3, 4, 0], [{ a: 0, b: 4, t: SP(D.revYoY) + ' YoY', c: 'up' }, { a: 3, b: 4, t: SP(D.revQoQ) + ' QoQ', c: 'dn' }]) }),
      spacex: () => ({ math: `(${M(xi.revenue)} − ${M(xp.revenue)}) ÷ ${M(xp.revenue)} = ${SP(D.xRevQoQ)}`, say: `For a company growing this fast, QoQ shows the pace: revenue rose ${P(D.xRevQoQ)} in three months. Cursor, bought in August, added ${M(X.segments.notes.cursorRevenue)} of it.`, fig: xTrio([{ a: 0, b: 2, t: SP(D.xRevYoY) + ' YoY', c: 'up' }, { a: 1, b: 2, t: SP(D.xRevQoQ) + ' QoQ', c: 'up' }]) }),
    },
    {
      k: 'fiscal', g: 0, n: 'Fiscal quarter', aka: 'the company’s own calendar',
      what: 'A fiscal year is a company’s own 12-month accounting year. Its quarters, Q1 to Q4, count from the start of that year, which may not be January.',
      why: 'Mix up fiscal and calendar quarters and you compare the wrong numbers. Apple’s Q1 is the holiday quarter, by far its biggest.',
      hop: () => ({ math: 'June sits in Q2 (April to June)', say: 'Hoppy’s books run January to December, so its fiscal quarters match the calendar.', fig: (W) => figFiscal(W, 'cal') }),
      apple: () => ({ math: 'April–June 2026 = fiscal Q3 2026', say: `${A.fiscalNote} This quarter ended ${A.periodEnd}.`, fig: (W) => figFiscal(W, 'fis') }),
      spacex: () => ({ math: 'July–September 2026 = Q3 2026', say: `SpaceX keeps its books on the calendar year (its last year ended ${X.bs.labels.prev}), so Q3 means July to September. Its latest quarter covers newer months than Apple’s: Apple’s own July to September quarter, its fiscal Q4, comes out on November 2.`, fig: (W) => figFiscal(W, 'cal3') }),
    },
    {
      k: 'cost', g: 1, n: 'Cost of sales', aka: 'COGS · cost of revenue',
      what: 'What it cost to make or deliver exactly what was sold: parts, assembly, shipping, data centers, support. It grows with every unit sold.',
      why: 'When cost of sales grows slower than sales, margins widen and profit grows faster than revenue. Rising parts or memory prices squeeze this line first, so traders listen for them on the call.',
      hop: () => ({ math: `Beans, milk and cups: ${H$(hc.cost)}`, say: `Up from ${H$(hy.cost)} last June (${SP(pc(hc.cost, hy.cost))}), while sales rose 25%.`, fig: ladder('hop', ['rev', 'cost']) }),
      apple: () => ({ math: `${M(ai.prodCost)} products + ${M(ai.servCost)} services = ${M(ai.cost)}`, say: `Up ${P(pc(ai.cost, ay.cost))} while sales grew ${P(D.revYoY)}, so each sale cost less to make.`, fig: ladder('apple', ['rev', 'cost']) }),
      spacex: () => ({ math: `${M(xi.cost)} on ${M(xi.revenue)} of revenue`, say: `Cost of revenue grew ${P(pc(xi.cost, xy.cost))} while revenue grew ${P(D.xRevYoY)}.`, fig: ladder('spacex', ['rev', 'cost']) }),
    },
    {
      k: 'gross', g: 1, n: 'Gross profit', aka: 'revenue − cost of sales',
      what: 'Revenue minus cost of sales: what is left to pay for inventing, selling and running the business. Apple’s statement calls this line "gross margin" in dollars.',
      why: 'Gross profit is the fuel for every line below it. When it grows faster than sales, the company is pricing well or making things more cheaply.',
      hop: () => ({ math: `${H$(hc.revenue)} − ${H$(hc.cost)} = ${H$(hc.gross)}`, say: `Last June: ${H$(hy.revenue)} − ${H$(hy.cost)} = ${H$(hy.gross)}.`, fig: ladder('hop', ['rev', 'cost', 'gross']) }),
      apple: () => ({ math: `${M(ai.revenue)} − ${M(ai.cost)} = ${M(ai.gross)}`, say: `Up ${P(pc(ai.gross, ay.gross))} from ${Bn(ay.gross)} a year earlier, faster than sales.`, fig: ladder('apple', ['rev', 'cost', 'gross']) }),
      spacex: () => ({ math: `${M(xi.revenue)} − ${M(xi.cost)} = ${M(xi.gross)}`, say: `Up from ${M(xy.gross)} a year earlier (${SP(pc(xi.gross, xy.gross))}).`, fig: ladder('spacex', ['rev', 'cost', 'gross']) }),
    },
    {
      k: 'gm', g: 1, n: 'Gross margin', aka: 'gross profit ÷ revenue',
      what: 'Gross profit as a percent of revenue: how many cents of each sales dollar are left after making the product.',
      why: { hop: 'A wider margin means each extra sale adds more profit. Investors pay more for businesses whose margins are rising.', apple: `Margin guidance moves stocks. Apple guided the September quarter to ${G.grossMargin[0]}%–${G.grossMargin[1]}%, below this quarter’s ${P(D.gm)}, one reason the stock fell.`, spacex: 'A rising gross margin while revenue grows this fast tells investors growth is getting more profitable per dollar. But Q3’s margin had one-time help: the CFO said fourth-quarter gross margin should look more like Q2’s, given one-time benefits and customer mix in Q3 (Starlink’s margin included about 3 points of one-time help, mainly tariff refunds, per TIKR).' },
      hop: () => ({ math: `${H$(hc.gross)} ÷ ${H$(hc.revenue)} = ${P((hc.gross / hc.revenue) * 100, 0)}`, say: `Up from ${P((hy.gross / hy.revenue) * 100, 0)} last June (${H$(hy.gross)} ÷ ${H$(hy.revenue)}): 60 cents of every sales dollar are left after the beans.`, fig: (W) => figMargin(W, [{ l: 'This June', v: (hc.gross / hc.revenue) * 100 }, { l: 'Last June', v: (hy.gross / hy.revenue) * 100, dim: 1 }]) }),
      apple: () => ({ math: `${M(ai.gross)} ÷ ${M(ai.revenue)} = ${P(D.gm)}`, say: `Up from ${P(D.gmYa)}. Apple said about ${TR.grossMarginPts} points came from temporary tariff refunds, so the underlying margin was about ${P(D.gmEx, 0)}.`, fig: (W) => figMargin(W, [{ l: A.labels.cur, v: D.gm, ref: TR.grossMarginPts, note: `≈${TR.grossMarginPts} pts tariff refund` }, { l: A.labels.ya, v: D.gmYa, dim: 1 }], SML.uid('rcihz')) }),
      spacex: () => ({ math: `${M(xi.gross)} ÷ ${M(xi.revenue)} = ${P(D.xGm)}`, say: `Up from ${P(D.xGmYa)} a year earlier and ${P(D.xGmPq)} in Q2. The CFO said fourth-quarter gross margin would be closer to Q2’s.`, fig: (W) => figMargin(W, [{ l: X.labels.cur, v: D.xGm }, { l: X.labels.pq, v: D.xGmPq, dim: 1 }, { l: X.labels.ya, v: D.xGmYa, dim: 1 }]) }),
    },
    {
      k: 'opex', g: 2, n: 'Operating expenses', aka: 'opex · R&D + SG&A',
      what: 'The costs of running the company that are not tied to each unit sold: mainly research and development (R&D) plus selling, general and administrative (SG&A).',
      why: { hop: 'Investors want opex to grow slower than gross profit, so more of each sale drops to the bottom line.', apple: `Investors watch whether opex grows slower than gross profit. Apple guided ${Bn(G.opex[0])}–${Bn(G.opex[1])} for the September quarter.`, spacex: 'In Q3 gross profit finally outgrew operating costs. Investors watch whether that holds as the fourth-quarter gross margin falls back toward Q2’s.' },
      hop: () => ({ math: `${H$(hc.rd)} R&D + ${H$(hc.sga)} SG&A = ${H$(hc.opex)}`, say: `Up from ${H$(hy.opex)} last June.`, fig: ladder('hop', ['rd', 'sga']) }),
      apple: () => ({ math: `${M(ai.rd)} + ${M(ai.sga)} = ${M(ai.opex)}`, say: `Up ${P(pc(ai.opex, ay.opex))}, faster than sales (${SP(D.revYoY)}), mostly because R&D jumped ${P(pc(ai.rd, ay.rd))}.`, fig: ladder('apple', ['rd', 'sga']) }),
      spacex: () => ({ math: `${M(xi.rd)} + ${M(xi.sga)} + ${M(xi.restructuring)} = ${M(xOpex(xi))}`, say: xOpex(xi) > xi.gross ? `R&D, SG&A and restructuring together were bigger than gross profit (${M(xi.gross)}). That gap is the operating loss.` : `Operating costs grew too, but gross profit (${M(xi.gross)}) now covers them with ${M(xi.gross - xOpex(xi))} to spare: SpaceX’s operating profit.`, fig: ladder('spacex', ['rd', 'sga']) }),
    },
    {
      k: 'rd', g: 2, n: 'R&D', aka: 'research and development',
      what: 'Spending on inventing and improving products: engineers, chip design, software, AI.',
      why: 'High R&D lowers today’s profit to build tomorrow’s products. Investors accept it when growth follows and punish it when it does not.',
      hop: () => ({ math: `New recipes and barista training: ${H$(hc.rd)}`, say: `${P((hc.rd / hc.revenue) * 100, 0)} of sales. Last June it was ${H$(hy.rd)}.`, fig: ladder('hop', ['rd']) }),
      apple: () => ({ math: `${M(ai.rd)}, up ${P(pc(ai.rd, ay.rd))} from ${M(ay.rd)}`, say: `${P((ai.rd / ai.revenue) * 100)} of sales. R&D grew ${F.num(pc(ai.rd, ay.rd) / D.revYoY, 1)} times as fast as revenue.`, fig: ladder('apple', ['rd']) }),
      spacex: () => ({ math: `${M(xi.rd)}, ${P((xi.rd / xi.revenue) * 100)} of revenue`, say: `Up ${P(pc(xi.rd, xy.rd))} from ${M(xy.rd)} a year earlier, when it was ${P((xy.rd / xy.revenue) * 100)} of revenue.`, fig: ladder('spacex', ['rd']) }),
    },
    {
      k: 'sga', g: 2, n: 'SG&A', aka: 'selling, general and administrative',
      what: 'Marketing, sales staff, stores, executives, lawyers and offices: the cost of selling and running the company.',
      why: 'SG&A that grows slower than sales is called operating leverage: each extra dollar of sales drops more profit to the bottom line.',
      hop: () => ({ math: `Ads, permit, accountant, phone: ${H$(hc.sga)}`, say: `${P((hc.sga / hc.revenue) * 100, 0)} of sales. Last June: ${H$(hy.sga)}.`, fig: ladder('hop', ['sga']) }),
      apple: () => ({ math: `${M(ai.sga)}, up ${P(pc(ai.sga, ay.sga))}`, say: `${P((ai.sga / ai.revenue) * 100)} of sales. It grew slower than revenue, which lifted the operating margin.`, fig: ladder('apple', ['sga']) }),
      spacex: () => ({ math: `${M(xi.sga)}, up ${P(pc(xi.sga, xy.sga))}`, say: `${P((xi.sga / xi.revenue) * 100)} of revenue, ${xi.sga / xi.revenue > xy.sga / xy.revenue ? 'up' : 'down'} from ${P((xy.sga / xy.revenue) * 100)} a year earlier.`, fig: ladder('spacex', ['sga']) }),
    },
    {
      k: 'opinc', g: 2, n: 'Operating income', aka: 'operating profit · EBIT, roughly',
      what: 'Gross profit minus operating expenses: the profit from the core business before interest and taxes.',
      why: 'Operating income shows whether the business itself makes money, before financing choices and taxes. Growing it faster than sales is what investors want to see.',
      hop: () => ({ math: `${H$(hc.gross)} − ${H$(hc.opex)} = ${H$(hc.opInc)}`, say: `Last June: ${H$(hy.gross)} − ${H$(hy.opex)} = ${H$(hy.opInc)}.`, fig: ladder('hop', ['gross', 'rd', 'sga', 'op']) }),
      apple: () => ({ math: `${M(ai.gross)} − ${M(ai.opex)} = ${M(ai.opInc)}`, say: `Up ${P(pc(ai.opInc, ay.opInc))} from ${Bn(ay.opInc)}.`, fig: ladder('apple', ['gross', 'rd', 'sga', 'op']) }),
      spacex: () => ({ math: `${M(xi.gross)} − ${M(xOpex(xi))} = ${M(xi.opInc)}`, say: xi.opInc >= 0 ? `SpaceX’s first operating profit as a public company, after ${M(xy.opInc)} a year earlier and ${M(xp.opInc)} in Q2.` : `Still a loss, compared with ${M(xy.opInc)} a year earlier.`, fig: ladder('spacex', ['gross', 'rd', 'sga', 'op']) }),
    },
    {
      k: 'opm', g: 2, n: 'Operating margin', aka: 'operating income ÷ revenue',
      what: 'Operating income as a percent of revenue: how many cents of each sales dollar the core business keeps.',
      why: 'A widening margin means profit is growing faster than sales. Margin trends often matter more to the stock than one quarter’s profit.',
      hop: () => ({ math: `${H$(hc.opInc)} ÷ ${H$(hc.revenue)} = ${P((hc.opInc / hc.revenue) * 100, 0)}`, say: `Up from ${P((hy.opInc / hy.revenue) * 100)} last June (${H$(hy.opInc)} ÷ ${H$(hy.revenue)}).`, fig: (W) => figMargin(W, [{ l: 'This June', v: (hc.opInc / hc.revenue) * 100, c: 'acc' }, { l: 'Last June', v: (hy.opInc / hy.revenue) * 100, c: 'acc', dim: 1 }]) }),
      apple: () => ({ math: `${M(ai.opInc)} ÷ ${M(ai.revenue)} = ${P(D.om)}`, say: `Up from ${P(D.omYa)}: Apple’s core business kept about ${F.num(D.om, 0)} cents of each sales dollar.`, fig: (W) => figMargin(W, [{ l: A.labels.cur, v: D.om, c: 'acc' }, { l: A.labels.ya, v: D.omYa, c: 'acc', dim: 1 }]) }),
      spacex: () => ({ math: `${M(xi.opInc)} ÷ ${M(xi.revenue)} = ${P(D.xOm)}`, say: `Up from ${P(D.xOmYa)} a year earlier and ${P(D.xOmPq)} in Q2.`, fig: (W) => figMargin(W, [{ l: X.labels.cur, v: D.xOm, c: 'acc' }, { l: X.labels.pq, v: D.xOmPq, c: 'acc', dim: 1 }, { l: X.labels.ya, v: D.xOmYa, c: 'acc', dim: 1 }]) }),
    },
    {
      k: 'oploss', g: 2, n: 'Operating loss', aka: 'negative operating income', best: 'spacex',
      what: 'When operating expenses are bigger than gross profit, the core business loses money before interest and taxes.',
      why: { any: 'A loss is not automatically bad for the stock. A shrinking loss with fast growth can lift it; investors ask how long the cash lasts until profits arrive.' },
      hop: () => ({ math: `${H$(hc.gross)} − ${H$(hc.opex)} = +${H$(hc.opInc)}: no loss`, say: 'Hoppy’s would show an operating loss only if R&D plus SG&A ever topped its gross profit.', fig: ladder('hop', ['gross', 'rd', 'sga', 'op']) }),
      apple: () => ({ math: `${M(ai.gross)} − ${M(ai.opex)} = +${M(ai.opInc)}: no loss`, say: 'Apple has no operating loss. Switch to SpaceX to see a real one.', fig: ladder('apple', ['gross', 'rd', 'sga', 'op']) }),
      spacex: () => ({ math: `Q2 2026: ${sgn(XSEG('conn', 'pq').opInc, M)} Starlink ${sgn(XSEG('ai', 'pq').opInc, M)} AI ${sgn(XSEG('space', 'pq').opInc, M)} Space = ${M(xp.opInc)}`, say: `A real operating loss from SpaceX’s previous quarter, its first report as a public company: Starlink made money, AI and Space lost more. By Q3 2026 it had turned into ${sgn(xi.opInc, M)} of operating income; only the Space segment still lost a little (${M(XSEG('space').opInc)}).`, fig: (W) => figCompare(W, { bars: X.segments.pq.map((g) => ({ l: g.k === 'ai' ? 'AI' : SEGS[g.k], l2: 'Q2 2026', v: g.opInc, c: g.opInc < 0 ? 'dn' : 'up' })).concat([{ l: 'Total', l2: 'Q2 2026', v: xp.opInc, c: 'dn' }, { l: 'Total', l2: 'Q3 2026', v: xi.opInc, c: xi.opInc < 0 ? 'dn' : 'up' }]), fmt: M }) }),
    },
    {
      k: 'net', g: 3, n: 'Net income', aka: 'earnings · profit · the bottom line',
      what: 'The profit left after every cost, interest and tax. It is the last line of the income statement, so people call it the bottom line.',
      why: 'Net income divided by the share count becomes EPS, the number most headlines compare with forecasts.',
      hop: () => ({ math: `${H$(hc.opInc)} − ${H$(-hc.interest)} interest − ${H$(hc.tax)} tax = ${H$(hc.netInc)}`, say: `Up ${P(pc(hc.netInc, hy.netInc))} from ${H$(hy.netInc)} last June.`, fig: ladder('hop', ['op', 'oth', 'tax', 'net']) }),
      apple: () => ({ math: `${M(ai.opInc)} + ${M(ai.other)} − ${M(ai.tax)} tax = ${M(ai.netInc)}`, say: `Up ${P(D.niYoY)}. Apple kept ${P(D.nm)} of sales as profit.`, fig: ladder('apple', ['op', 'oth', 'tax', 'net']) }),
      spacex: () => ({ math: `${M(xi.opInc)} ${xNonOp(xi) >= 0 ? '+' : '−'} ${M(Math.abs(xNonOp(xi)))} interest &amp; other ${xi.tax < 0 ? '+ ' + M(-xi.tax) + ' tax benefit' : '− ' + M(xi.tax) + ' tax'} = ${M(xi.netInc)}`, say: xi.netInc >= 0 ? `SpaceX’s first profitable quarter as a public company, after ${M(xy.netInc)} a year earlier and ${M(xp.netInc)} in Q2. About ${Bn(D.xBelow)} of it came from below the operating line.` : `A net loss, compared with ${M(xy.netInc)} a year earlier.`, fig: ladder('spacex', ['op', 'oth', 'tax', 'net']) }),
    },
    {
      k: 'netloss', g: 3, n: 'Net loss', aka: 'a negative bottom line', best: 'spacex',
      what: 'After all costs, interest and taxes, the company spent more than it earned in the period.',
      why: { any: 'Losses shrink equity and can force a company to borrow or sell shares. The direction matters: SpaceX’s losses narrowed as revenue grew, and in Q3 2026 its bottom line turned positive.' },
      hop: () => ({ math: `${H$(hc.netInc)} of profit: no loss`, say: 'If June’s costs, interest and tax had added up to more than $10,000, the bottom line would turn negative.', fig: ladder('hop', ['net']) }),
      apple: () => ({ math: `${M(ai.netInc)} of profit: no loss`, say: 'Apple’s bottom line is firmly positive. Switch to SpaceX for a real net loss.', fig: ladder('apple', ['net']) }),
      spacex: () => ({ math: `Q2 2026: ${M(xp.netInc)} · Q3 2025: ${M(xy.netInc)}`, say: `Real net losses from SpaceX’s recent past: ${F.num((-xp.netInc / xp.revenue) * 100, 1)} cents per dollar of revenue in Q2 2026. In Q3 2026 the bottom line turned ${xi.netInc >= 0 ? 'positive' : 'less negative'}: ${sgn(xi.netInc, M)}.`, fig: (W) => figCompare(W, { bars: [{ l: 'Q3 2025', v: xy.netInc, c: 'dn' }, { l: 'Q1 2026', v: X.is.pq2.netInc, c: 'dn' }, { l: 'Q2 2026', v: xp.netInc, c: 'dn' }, { l: 'Q3 2026', v: xi.netInc, c: xi.netInc < 0 ? 'dn' : 'up' }], fmt: M }) }),
    },
    {
      k: 'eps', g: 3, n: 'EPS', aka: 'earnings per share',
      what: 'Net income divided by the number of shares: your slice of the profit for each share you own.',
      why: '<a href="#l-rc-price">Price ≈ EPS × P/E</a>. A higher EPS than expected raises what each share is worth, as long as investors keep paying the same multiple.',
      hop: () => ({ math: `${H$(hc.netInc)} ÷ ${F.num(hc.sh)} shares = ${E$(hc.eps)}`, say: `Last June: ${H$(hy.netInc)} ÷ ${F.num(hy.sh)} = ${E$(hy.eps)}.`, fig: (W) => figEps(W, [{ l: 'This June', ni: H$(hc.netInc), sh: F.num(hc.sh), eps: E$(hc.eps), tag: SP(pc(hc.eps, hy.eps)) }, { l: 'Last June', ni: H$(hy.netInc), sh: F.num(hy.sh), eps: E$(hy.eps), dim: 1 }]) }),
      apple: () => ({ math: `${M(ai.netInc)} ÷ ${shM(ai.shDil)} shares = ${E$(ai.epsDil)}`, say: `Up ${P(D.epsYoY)} from ${E$(ay.epsDil)}. EPS grew faster than net income (${SP(D.niYoY)}) because buybacks cut the share count ${P(-D.shYoY)}.`, fig: (W) => figEps(W, [{ l: A.labels.cur, ni: M(ai.netInc), sh: shM(ai.shDil), eps: E$(ai.epsDil), tag: SP(D.epsYoY) + ' YoY' }, { l: A.labels.ya, ni: M(ay.netInc), sh: shM(ay.shDil), eps: E$(ay.epsDil), dim: 1 }]) }),
      spacex: () => ({ math: `${M(xi.netInc)} ÷ ${F.num(xi.sh)}M diluted shares = ${E$(xi.eps)}`, say: `A year earlier: ${E$(xy.eps)} a share on ${F.num(xy.sh)}M shares. Analysts expected about ${E$(EXX.eps[0])}–${E$(EXX.eps[1])}.`, fig: (W) => figEps(W, [{ l: X.labels.cur, ni: M(xi.netInc), sh: F.num(xi.sh) + 'M', eps: E$(xi.eps), tag: 'diluted' }, { l: X.labels.ya, ni: M(xy.netInc), sh: F.num(xy.sh) + 'M', eps: E$(xy.eps), dim: 1 }]) }),
    },
    {
      k: 'diluted', g: 3, n: 'Diluted shares', aka: 'diluted EPS',
      what: 'Diluted EPS adds the shares that employee stock awards and options could create, but only when counting them lowers EPS (the treasury-stock method; in a loss quarter they are left out). It is the EPS headlines quote.',
      why: { hop: 'Dilution quietly shrinks each share’s slice. Buybacks do the opposite and make EPS grow faster than profit.', apple: 'Dilution quietly shrinks each share’s slice. Buybacks do the opposite, which is why Apple’s EPS grew faster than its profit.', spacex: `SpaceX’s diluted share count is ${F.num(xi.sh / xy.sh, 1)} times a year earlier (${F.num(xy.sh)}M to ${F.num(xi.sh)}M), so each share’s claim on profit is far smaller than the headline profit suggests.` },
      hop: () => ({ math: `${F.num(hc.sh)} shares, no stock awards: basic = diluted = ${E$(hc.eps)}`, say: 'If Hoppy promised the barista shares, they would join the diluted count and shave a little off EPS.', fig: (W) => figEps(W, [{ l: 'Basic and diluted', ni: H$(hc.netInc), sh: F.num(hc.sh), eps: E$(hc.eps) }]) }),
      apple: () => ({ math: `Basic ${shM(ai.shBasic)} → ${E$(ai.epsBasic)} · Diluted ${shM(ai.shDil)} → ${E$(ai.epsDil)}`, say: `About ${shM(ai.shDil - ai.shBasic)} extra shares from stock awards cost one cent of EPS.`, fig: (W) => figEps(W, [{ l: 'Basic', ni: M(ai.netInc), sh: shM(ai.shBasic), eps: E$(ai.epsBasic), dim: 1 }, { l: 'Diluted (the headline number)', ni: M(ai.netInc), sh: shM(ai.shDil), eps: E$(ai.epsDil) }]) }),
      spacex: () => ({ math: `Basic ${F.num(xi.shBasic)}M → ${E$(xi.epsBasic)} · Diluted ${F.num(xi.sh)}M → ${E$(xi.eps)}`, say: `Now that SpaceX is profitable, about ${F.num(xi.sh - xi.shBasic)}M extra shares from stock awards count, trimming EPS by ${cents2(xi.epsBasic - xi.eps)} cents. Shares outstanding jumped this year with the preferred conversion, the IPO and other share issuance (Class A ${F.num(X.bs.sharesOutstanding.classA[1])}M → ${F.num(X.bs.sharesOutstanding.classA[0])}M, Class B ${F.num(X.bs.sharesOutstanding.classB[1])}M → ${F.num(X.bs.sharesOutstanding.classB[0])}M since December); the release does not break down the change in the weighted average.`, fig: (W) => figEps(W, [{ l: 'Basic', ni: M(xi.netInc), sh: F.num(xi.shBasic) + 'M', eps: E$(xi.epsBasic), dim: 1 }, { l: 'Diluted (the headline number)', ni: M(xi.netInc), sh: F.num(xi.sh) + 'M', eps: E$(xi.eps) }]) }),
    },
    {
      k: 'segment', g: 0, n: 'Segment', aka: 'a business line reported on its own',
      what: 'A part of the business the company reports separately, so you can see which parts grow and which make money.',
      why: { hop: 'Segments show where growth comes from, and where to cut or invest next.', apple: 'Investors track each piece: a strong Greater China or a soft iPad can move the stock even when the total looks fine.', spacex: `Super Intelligence now brings in about half the revenue, while Starlink earns most of the operating profit (${M(XSEG('conn').opInc)} of ${M(xi.opInc)}). Investors value those two businesses very differently.` },
      hop: () => ({ math: `Coffee ${H$(8000)} + pastries ${H$(2000)} = ${H$(hc.revenue)} ${imag}`, say: 'If Hoppy sold pastries too and reported them separately, you could see which one grows faster.', fig: (W) => figSeg(W, { segs: [{ l: 'Coffee', v: 8000, c: 'info' }, { l: 'Pastries', v: 2000, c: 'acc' }], fmt: H$, pct: true }) }),
      apple: () => ({ math: Object.keys(A.regions.cur).map((k) => `${k} ${Bn(A.regions.cur[k])}`).join(' · '), say: `Apple’s official segments are these five regions, which add up to ${Bn(ai.revenue)}. It also reports sales by product: iPhone alone was ${Bn(A.categories.cur.iPhone)}.`, fig: (W) => figSeg(W, { segs: Object.keys(A.regions.cur).map((k, i) => ({ l: k, s: k === 'Rest of Asia Pacific' ? 'Rest of Asia Pac.' : k, v: A.regions.cur[k], c: ['info', 'vio', 'acc', 'up', 'mut'][i] })), fmt: (v) => Bn(v), pct: true }) }),
      spacex: () => ({ math: X.segments.cur.map((g) => `${SEGS[g.k]} ${M(g.revenue)}`).join(' · '), say: `Operating income: ${segOpTxt()}.`, fig: (W) => figSeg(W, { segs: X.segments.cur.map((g) => ({ l: SEGT[g.k], s: SEGSS[g.k], v: g.revenue, op: g.opInc, c: SEGC[g.k] })), fmt: M, op: true }) }),
    },
    {
      k: 'consensus', g: 4, n: 'Consensus', aka: 'the average analyst forecast',
      what: 'The average forecast of the analysts who follow a company. Prices already reflect it before the results come out.',
      why: 'Stocks move on the surprise against the consensus, not on the raw number. A great quarter that everyone expected can leave the price flat.',
      hop: () => ({ math: `Regulars guessed ${H$(hy.revenue)}: a repeat of last June`, say: 'That guess is Hoppy’s consensus. Real analysts build detailed models, but the idea is the same.', fig: (W) => figRange(W, [{ l: 'June sales', band: [hy.revenue, hy.revenue], bandL: 'the guess', act: hc.revenue, actL: H$(hc.revenue), verdict: 'BEAT', vc: 'up' }]) }),
      apple: () => ({ math: `Revenue about ${Bn(EXA.revenue[0])}–${Bn(EXA.revenue[1])} · EPS about ${E$(EXA.eps[0])}–${E$(EXA.eps[1])}`, say: `Those were the reported estimates before July 30, 2026. Apple came in at ${Bn(ai.revenue)} and ${E$(ai.epsDil)}.`, fig: (W) => figRange(W, [
        { l: 'Revenue', band: EXA.revenue, bandL: 'expected', act: ai.revenue, actL: Bn(ai.revenue), verdict: 'BEAT', vc: 'up' },
        { l: 'Diluted EPS', band: EXA.eps, bandL: 'expected', act: ai.epsDil, actL: E$(ai.epsDil), verdict: 'BEAT', vc: 'up' }]) }),
      spacex: () => ({ math: `Revenue about ${Bn(EXX.revenue[0], 2)}–${Bn(EXX.revenue[1], 2)} · EPS about ${E$(EXX.eps[0])}–${E$(EXX.eps[1])}`, say: `Those were the reported estimates for Q3. SpaceX came in at ${Bn(xi.revenue, 2)} and ${E$(xi.eps)}. For the first quarter of 2027, analysts had about ${Bn(EXX.q1_2027Revenue)} of revenue.`, fig: (W) => figRange(W, [
        { l: 'Revenue', band: EXX.revenue, bandL: 'expected', act: xi.revenue, actL: Bn(xi.revenue, 2), verdict: 'BEAT', vc: 'up' },
        { l: 'Diluted EPS', band: EXX.eps, bandL: 'expected', act: xi.eps, actL: E$(xi.eps), verdict: 'BEAT', vc: 'up' }]) }),
    },
    {
      k: 'beat', g: 4, n: 'Beat or miss', aka: 'versus the consensus',
      what: 'A beat is a result above the consensus; a miss is below it. Traders check revenue, EPS and guidance separately, so one report can beat and miss at the same time.',
      why: { hop: 'A beat on the quarter can still sink the stock if guidance, margins or one-time items disappoint. Read the whole scoreboard.', apple: 'A beat on the quarter can still sink the stock if guidance, margins or one-time items disappoint. Read the whole scoreboard.', spacex: `SpaceX beat and guided far above expectations, and the stock rose about ${P(D.xNextDay)} the next day. Apple beat too but guided below hopes, and fell about ${P(-A.reaction.closePct, 0)}.` },
      hop: () => ({ math: `${H$(hc.revenue)} − ${H$(hy.revenue)} guess = ${H$(hc.revenue - hy.revenue)} beat`, say: 'Sales beat the regulars’ guess by 25%. EPS beat too, since the guess was last June’s $1.92.', fig: (W) => figRange(W, [{ l: 'June sales', band: [hy.revenue, hy.revenue], bandL: 'the guess', act: hc.revenue, actL: H$(hc.revenue), verdict: 'BEAT', vc: 'up' }, { l: 'EPS', band: [hy.eps, hy.eps], bandL: 'the guess', act: hc.eps, actL: E$(hc.eps), verdict: 'BEAT', vc: 'up' }]) }),
      apple: () => ({ math: `EPS ${E$(ai.epsDil)} vs about ${E$(EXA.eps[0])}–${E$(EXA.eps[1])}: a ${D.beat[0]}–${D.beat[1]} cent beat`, say: `Revenue beat too. But Services (${Bn(ai.servSales)}) came in under the roughly ${Bn(EXA.services)} expected, and guidance was below hopes.`, fig: (W) => figRange(W, [
        { l: 'Revenue', band: EXA.revenue, bandL: 'expected', act: ai.revenue, actL: Bn(ai.revenue), verdict: 'BEAT', vc: 'up' },
        { l: 'Diluted EPS', band: EXA.eps, bandL: 'expected', act: ai.epsDil, actL: E$(ai.epsDil), alt: { v: D.ref.eps, l: E$(D.ref.eps) + ' w/o refund (our math)' }, verdict: 'BEAT', vc: 'up' },
        { l: 'Services', band: [EXA.services, EXA.services], bandL: 'expected', act: ai.servSales, actL: Bn(ai.servSales, 2), verdict: 'MISS', vc: 'dn' },
        { l: 'Next quarter growth', band: G.revGrowth, bc: 'info', bandL: 'guided', act: EXA.nextQtrGrowth, actL: '~' + EXA.nextQtrGrowth + '% hoped', ac: 'acc', verdict: 'BELOW', vc: 'dn' }]) }),
      spacex: () => ({ math: `Revenue ${Bn(xi.revenue, 2)} vs about ${Bn(EXX.revenue[0], 2)}–${Bn(EXX.revenue[1], 2)}`, say: `EPS of ${E$(xi.eps)} beat about ${E$(EXX.eps[0])}–${E$(EXX.eps[1])}${D.xGuideRev ? `, and the first-quarter 2027 revenue guide (${Bn(D.xGuideRev[0], 0)}–${Bn(D.xGuideRev[1], 0)}) was far above the roughly ${Bn(EXX.q1_2027Revenue)} analysts had` : ''}. The stock rose about ${P(D.xNextDay)} the next day.`, fig: (W) => figRange(W, [
        { l: 'Revenue', band: EXX.revenue, bandL: 'expected', act: xi.revenue, actL: Bn(xi.revenue, 2), verdict: 'BEAT', vc: 'up' },
        { l: 'Diluted EPS', band: EXX.eps, bandL: 'expected', act: xi.eps, actL: E$(xi.eps), verdict: 'BEAT', vc: 'up' }].concat(D.xGuideRev ? [
        { l: 'Q1 2027 revenue guide', band: D.xGuideRev, bc: 'info', bandL: `guided ${Bn(D.xGuideRev[0], 0)}–${Bn(D.xGuideRev[1], 0)}`, act: EXX.q1_2027Revenue, actL: '~' + Bn(EXX.q1_2027Revenue) + ' expected', ac: 'acc', verdict: 'FAR ABOVE', vc: 'up' }] : [])) }),
    },
    {
      k: 'guidance', g: 4, n: 'Guidance', aka: 'management’s own forecast',
      what: 'The company’s forecast for the next quarter or year: sales, margins, costs. Not every company gives one.',
      why: { hop: 'A stock is a bet on future profits, so guidance often moves it more than the quarter just reported.', apple: 'A stock is a bet on future profits, so guidance often moves it more than the quarter just reported. Apple beat in July 2026 and still fell about 7% on softer guidance.', spacex: `Guidance far above expectations lifted the stock about ${P(D.xNextDay)} the next day: the mirror image of Apple, which beat but guided below hopes and fell about ${P(-A.reaction.closePct, 0)}.` },
      hop: () => ({ math: `Next June: ${H$(11000)} to ${H$(12000)} ${imag}`, say: 'Hoppy tells the regulars what he expects. If they had hoped for $12,500, even growth of 10% to 20% disappoints them.', fig: (W) => figRange(W, [{ l: 'Next June sales', band: [11000, 12000], bc: 'info', bandL: 'Hoppy’s guide', act: 12500, actL: 'hoped ' + H$(12500), ac: 'acc', mark: { v: hc.revenue, l: 'this June' }, verdict: 'BELOW HOPES', vc: 'dn' }]) }),
      apple: () => ({ math: `${M(G.baseRevenue)} × ${1 + G.revGrowth[0] / 100}–${1 + G.revGrowth[1] / 100} = ${Bn(D.gLo)}–${Bn(D.gHi)}`, say: `Apple guided ${G.revGrowth[0]}%–${G.revGrowth[1]}% growth for the September quarter, with a currency headwind about ${G.fxHeadwindPts} points bigger than in the June quarter. Analysts had hoped for about ${EXA.nextQtrGrowth}% (about ${Bn(EXA.nextQtrRevenue, 0)}). Gross margin guide: ${G.grossMargin[0]}%–${G.grossMargin[1]}%.`, fig: (W) => figRange(W, [
        { l: 'Sep 2026 qtr revenue', band: [D.gLo, D.gHi], bc: 'info', bandL: `guided ${Bn(D.gLo)}–${Bn(D.gHi)}`, act: EXA.nextQtrRevenue, actL: '~' + Bn(EXA.nextQtrRevenue, 0) + ' hoped', ac: 'acc', mark: { v: G.baseRevenue, l: 'Sep 2025 qtr' }, verdict: 'BELOW', vc: 'dn' },
        { l: 'Gross margin', band: G.grossMargin, bc: 'info', bandL: `guided ${G.grossMargin[0]}%–${G.grossMargin[1]}%`, act: D.gm, actL: 'June ' + P(D.gm), ac: 'mut', verdict: 'LOWER', vc: 'dn' }]) }),
      spacex: () => ({ math: D.xGuideRev ? `Q1 2027 revenue ${Bn(D.xGuideRev[0], 0)}–${Bn(D.xGuideRev[1], 0)} vs about ${Bn(EXX.q1_2027Revenue)} expected` : xOut[0], say: `SpaceX also guided fourth-quarter capex of ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)} (Q3: ${Bn(X.capex.cur)})${D.xGuideGW ? `, ${F.num(D.xGuideGW[0], 1)} to ${F.num(D.xGuideGW[1], 0)} GW of computing capacity by year end (${F.num(X.metrics.computeGW[0], 1)} GW in September)` : ''}, and a fourth-quarter gross margin closer to Q2’s.`, fig: (W) => figRange(W, (D.xGuideRev ? [
        { l: 'Q1 2027 revenue', band: D.xGuideRev, bc: 'info', bandL: `guided ${Bn(D.xGuideRev[0], 0)}–${Bn(D.xGuideRev[1], 0)}`, act: EXX.q1_2027Revenue, actL: '~' + Bn(EXX.q1_2027Revenue) + ' expected', ac: 'acc', mark: { v: xi.revenue, l: 'Q3 2026' }, verdict: 'FAR ABOVE', vc: 'up' }] : []).concat([
        { l: 'Q4 2026 capex', band: X.capex.q4Guide, bc: 'info', bandL: `guided ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)}`, act: X.capex.cur, actL: 'Q3 ' + Bn(X.capex.cur), ac: 'mut', verdict: 'HIGHER', vc: 'acc' }])) }),
    },
    {
      k: 'onetime', g: 5, n: 'One-time item', aka: 'temporary or non-recurring',
      what: 'A gain or cost that is temporary or unusual: a refund, a lawsuit settlement, a restructuring, a gain below the operating line. Investors often strip it out to see the repeatable business.',
      why: { hop: 'A beat built on a temporary item counts for less, because it fades.', apple: 'A beat built on a temporary item counts for less. Apple’s September guide still includes about 1 point of refunds, so the help shrinks over time rather than vanishing at once.', spacex: `A profit lifted by items below the operating line counts for less, because those items may not recur. Investors compare it with operating income, which was ${Bn(xi.opInc)}.` },
      hop: () => ({ math: `${H$(hc.netInc)} − ${H$(300)} permit refund = ${H$(hc.netInc - 300)} ${imag}`, say: `If ${H$(300)} of June’s profit came from a temporary permit refund, the repeatable profit is ${H$(hc.netInc - 300)}, or ${E$((hc.netInc - 300) / hc.sh)} a share.`, fig: (W) => figRange(W, [{ l: 'EPS', act: hc.eps, actL: E$(hc.eps) + ' reported', ac: 'info', alt: { v: (hc.netInc - 300) / hc.sh, l: 'repeatable ' + E$((hc.netInc - 300) / hc.sh), c: 'acc' }, mark: { v: hy.eps, l: 'last June ' + E$(hy.eps) } }]) }),
      apple: () => ({ math: `${E$(ai.epsDil)} − ${E$(TR.eps)} tariff refund = ${E$(D.ref.eps)}`, say: `Apple said tariff refunds added about ${TR.grossMarginPts} points of gross margin and ${E$(TR.eps)} of EPS. Without them EPS was still above the ${E$(EXA.eps[0])}–${E$(EXA.eps[1])} consensus, but only by ${D.beatEx[0]}–${D.beatEx[1]} cents (FiredBunny’s math, assuming the consensus did not include the refunds). The September guide still includes about ${G.tariffRefundPts} point of refunds.`, fig: (W) => figRange(W, [
        { l: 'Diluted EPS', band: EXA.eps, bandL: 'expected', act: ai.epsDil, actL: E$(ai.epsDil), ac: 'info', alt: { v: D.ref.eps, l: E$(D.ref.eps) + ' w/o refund (our math)', c: 'acc' } },
        { l: 'Gross margin', act: D.gm, actL: P(D.gm), ac: 'info', alt: { v: D.gmEx, l: '≈' + P(D.gmEx, 0) + ' w/o refund', c: 'acc' }, mark: { v: D.gmYa, l: 'year ago ' + P(D.gmYa) } }]) }),
      spacex: () => ({ math: `${M(xi.opInc)} operating income + ${M(X.belowTheLine.netInterest)} net interest + ${M(X.belowTheLine.other)} other income + ${M(X.belowTheLine.taxBenefit)} tax benefit = ${M(xi.netInc)}`, say: `About ${Bn(D.xBelow)} of Q3’s ${Bn(xi.netInc)} profit came from below the operating line, including ${M(X.belowTheLine.otherRelatedParty)} of other income from a related party (per TIKR). Such items may not recur every quarter. Above the line, ${M(X.segments.notes.cursorStockComp)} of Cursor-related stock pay is the kind of deal cost adjusted numbers add back.`, fig: (W) => hwf(W, [{ l: 'Operating income', v: xi.opInc, abs: 1, c: 'acc' }, { l: 'Net interest', v: X.belowTheLine.netInterest, c: 'up' }, { l: 'Other income', v: X.belowTheLine.other, c: 'up' }, { l: 'Tax benefit', v: X.belowTheLine.taxBenefit, c: 'up' }, { l: 'Net income', v: xi.netInc, abs: 1, c: 'up' }], { fmt: M }) }),
    },
    {
      k: 'adjusted', g: 5, n: 'Adjusted (non-GAAP)', aka: 'the company’s own version of profit', best: 'spacex',
      what: 'GAAP is the official rulebook every US public company reports under. Adjusted, or non-GAAP, numbers are the company’s own version that leaves some costs out.',
      why: { any: 'Adjusted numbers can help compare companies, but stock pay and equipment wear are real costs. Always read the GAAP line next to the adjusted one.' },
      hop: () => ({ math: `GAAP net income ${H$(hc.netInc)} · adjusted EBITDA ${H$(hc.netInc - hc.interest + hc.tax + HOP.cf.dep)}`, say: `Leave out interest (${H$(-hc.interest)}), tax (${H$(hc.tax)}) and machine depreciation (${H$(HOP.cf.dep)}) and the cart looks ${H$(-hc.interest + hc.tax + HOP.cf.dep)} more profitable.`, fig: (W) => figCompare(W, { bars: [{ l: 'GAAP profit', v: hc.netInc, c: 'up' }, { l: 'Adjusted EBITDA', v: hc.netInc - hc.interest + hc.tax + HOP.cf.dep, c: 'vio' }], arrows: [{ a: 0, b: 1, t: '+' + H$(-hc.interest + hc.tax + HOP.cf.dep) + ' left out', c: 'acc' }], fmt: H$ }) }),
      apple: () => ({ math: `GAAP diluted EPS ${E$(ai.epsDil)}`, say: `Apple reports GAAP results only. The ${E$(D.ref.eps)} without tariff refunds is investors’ own adjustment, not an official number.`, fig: (W) => figNote(W, 'GAAP only', [`Reported diluted EPS: ${E$(ai.epsDil)}`, 'Apple publishes no adjusted EPS', `Without refunds (our math): ≈${E$(D.ref.eps)}`]) }),
      spacex: () => ({ math: `GAAP net income ${M(xi.netInc)} · adjusted EBITDA ${M(X.ebitda.cur)}`, say: `Same quarter: positive ${Bn(X.ebitda.cur)} on SpaceX’s own adjusted measure vs ${Bn(xi.netInc)} under GAAP. Adjusted EBITDA adds back depreciation (${Bn(XBR('Depreciation & amortization'))}), stock pay (${Bn(XBR('Stock-based compensation'))}) and ${Bn(XBR('Acquisition-related stock compensation'))} of Cursor-related stock pay, and takes out other income and the tax benefit.`, fig: (W) => figCompare(W, { bars: [{ l: 'GAAP net income', v: xi.netInc, c: xi.netInc < 0 ? 'dn' : 'up' }, { l: 'Adjusted EBITDA', v: X.ebitda.cur, c: 'vio' }], arrows: [{ a: 0, b: 1, t: sgn(X.ebitda.cur - xi.netInc, Bn) + ' net add-backs', c: 'acc' }], fmt: M }) }),
    },
    {
      k: 'ebitda', g: 5, n: 'EBITDA', aka: 'earnings before interest, taxes, depreciation and amortization', best: 'spacex',
      what: 'Earnings before interest, taxes and the wear-and-tear cost of equipment (depreciation and amortization). A rough view of cash earnings before reinvesting; it is not a profit figure.',
      why: { hop: 'EBITDA is handy for comparing businesses with different loans and tax bills, but the espresso machine still wears out.', apple: 'Without an official EBITDA, investors use Apple’s GAAP operating income and cash flow instead.', spacex: `EBITDA ignores what it costs to build and replace equipment. SpaceX spent ${Bn(X.capex.cur)} on capex in the quarter, ${F.num(X.capex.cur / X.ebitda.cur, 1)} times its adjusted EBITDA, and guided ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)} for Q4.` },
      hop: () => ({ math: `${H$(hc.netInc)} + ${H$(-hc.interest)} + ${H$(hc.tax)} + ${H$(HOP.cf.dep)} = ${H$(hc.netInc - hc.interest + hc.tax + HOP.cf.dep)}`, say: 'Net income plus interest, tax and machine depreciation.', fig: (W) => hwf(W, [{ l: 'Net income', v: hc.netInc, abs: 1, c: 'up' }, { l: '+ Interest', v: -hc.interest, c: 'acc' }, { l: '+ Tax', v: hc.tax, c: 'acc' }, { l: '+ Depreciation', v: HOP.cf.dep, c: 'acc' }, { l: 'EBITDA', v: hc.netInc - hc.interest + hc.tax + HOP.cf.dep, abs: 1, c: 'vio' }], { fmt: H$ }) }),
      apple: () => ({ math: 'Not reported', say: `Apple does not publish EBITDA. Its depreciation and amortization is only given for nine months (${M(bsv(aCF.operating, 'da', 'cur'))}), so a quarterly figure would be a guess.`, fig: (W) => figNote(W, 'No EBITDA line', ['Apple reports GAAP results only', `Nine-month D&amp;A: ${M(bsv(aCF.operating, 'da', 'cur'))}`, `Quarter operating income: ${M(ai.opInc)}`]) }),
      spacex: () => ({ math: `${X.ebitda.bridge.map((b, i) => (i ? sgn(b[1], M) : M(b[1]))).join(' ')} = ${M(X.ebitda.cur)}`, say: `Positive ${Bn(X.ebitda.cur)} on SpaceX’s own adjusted measure, ${P(D.xEbitdaM)} of revenue, up from ${M(X.ebitda.ya)} a year earlier. The SpaceX lesson walks through each add-back.`, fig: (W) => hwf(W, X.ebitda.bridge.map((b, i) => ({ l: (BRL[b[0]] || [b[0], b[0]])[W < 480 ? 1 : 0], v: b[1], abs: i === 0, c: i === 0 ? (b[1] < 0 ? 'dn' : 'up') : b[1] >= 0 ? 'acc' : 'dn' })).concat([{ l: W < 480 ? 'Adj. EBITDA' : 'Adjusted EBITDA', v: X.ebitda.cur, abs: 1, c: 'vio' }]), { fmt: M }) }),
    },
    {
      k: 'fcf', g: 5, n: 'Free cash flow', aka: 'operating cash − capex',
      what: 'The cash the business brings in from operations minus what it spends on long-lasting things (capex). It is what is left for dividends, buybacks or paying down debt.',
      why: { hop: 'Profit is an opinion, cash is a fact. Free cash flow is what can actually be paid out.', apple: 'Strong free cash flow pays for the buybacks that lift EPS. Apple’s cash machine is a big part of why investors pay a high P/E.', spacex: `Negative free cash flow means the company must keep raising money or spend its savings. SpaceX guided fourth-quarter capex of ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)}, up from ${Bn(X.capex.cur)} in Q3.` },
      hop: () => ({ math: `${H$(HOP.cf.ocf)} operating cash − ${H$(-HOP.cf.capex)} grinder = ${H$(HOP.cf.fcf)}`, say: `Hoppy paid a ${H$(-HOP.cf.div)} dividend out of it.`, fig: (W) => hwf(W, [{ l: 'Operating cash', v: HOP.cf.ocf, abs: 1, c: 'info' }, { l: 'Capex (grinder)', v: HOP.cf.capex, c: 'dn' }, { l: 'Free cash flow', v: HOP.cf.fcf, abs: 1, c: 'up' }], { fmt: H$ }) }),
      apple: () => ({ math: `${M(aCF.totals.operating[0])} − ${M(-D.aCapex[0])} = ${M(D.aFcf[0])}`, say: `Nine months to June 2026. Apple then spent ${Bn(-bsv(aCF.financing, 'buyback', 'cur'))} on buybacks and ${Bn(-bsv(aCF.financing, 'div', 'cur'))} on dividends.`, fig: (W) => hwf(W, [{ l: W < 480 ? 'Operating cash' : 'Operating cash (9 mo)', v: aCF.totals.operating[0], abs: 1, c: 'info' }, { l: 'Capex', v: D.aCapex[0], c: 'dn' }, { l: 'Free cash flow', v: D.aFcf[0], abs: 1, c: 'up' }], { fmt: (v) => Bn(v) }) }),
      spacex: () => ({ math: `${M(X.cf9.operating[0])} − ${M(-X.cf9.ppe[0])} = ${M(D.xFcf9[0])}`, say: `Nine months to September 2026. Most of the capex went to Super Intelligence computing capacity (${Bn(XSEG('ai').capex)} in Q3 alone), paid for with IPO money (${Bn(X.cf9.ipoProceeds)} raised) and debt.`, fig: (W) => hwf(W, [{ l: W < 480 ? 'Operating cash' : 'Operating cash (9 mo)', v: X.cf9.operating[0], abs: 1, c: 'info' }, { l: 'Capex (9 mo)', v: X.cf9.ppe[0], c: 'dn' }, { l: 'Free cash flow', v: D.xFcf9[0], abs: 1, c: 'dn' }], { fmt: M }) }),
    },
  ];
  const TTK = {}; TT.forEach((t) => { TTK[t.k] = t; });
  const LENS = { hop: 'Hoppy’s cart', apple: 'Apple', spacex: 'SpaceX' };
  const whyOf = (t, lens) => (typeof t.why === 'string' ? t.why : t.why[lens] || t.why.any || t.why.apple);

  /* term card: rows [{c, h, b}] */
  function card(t, rows, o) {
    o = o || {};
    return `<div class="rci-card${o.flip ? ' rci-flip' : ''}"><div class="rci-card-h"><h4 class="rci-card-n">${t.n}</h4>${t.aka ? `<span class="rci-card-aka">${t.aka}</span>` : ''}</div><dl class="rci-dl">${rows.filter((r) => r && r.b).map((r) => `<div class="${r.c}"><dt>${r.h}</dt><dd>${r.b}</dd></div>`).join('')}</dl>${o.after || ''}</div>`;
  }
  const hopFromTT = (k) => { const L = TTK[k].hop(); return `<span class="rci-m">${L.math}</span> ${L.say}`; };

  /* ======================================================================
     Widget 1: termTranslator
     ====================================================================== */
  const J = (k, txt) => `<button type="button" class="rci-j" data-t="${k}">${txt}</button>`;
  const nw = (t) => `<span class="rci-nw">${t}</span>`;
  const HEAD = {
    hop: () => `Hoppy’s Coffee Cart: June ${J('revenue', 'top line')} up ${P(pc(hc.revenue, hy.revenue), 0)} ${J('yoy', 'YoY')} to ${H$(hc.revenue)}; ${J('gm', 'gross margin')} widens to ${P((hc.gross / hc.revenue) * 100, 0)}; ${J('opinc', 'operating income')} ${H$(hc.opInc)}; ${J('net', 'bottom line')} ${H$(hc.netInc)}, or ${J('eps', 'EPS')} of ${E$(hc.eps)} vs ${E$(hy.eps)}; ${J('fcf', 'free cash flow')} ${H$(HOP.cf.fcf)}.`,
    apple: () => `Apple ${J('beat', 'beats')} on the ${J('revenue', 'top line')} and ${J('eps', 'EPS')} in ${J('fiscal', 'fiscal Q3')}: revenue ${Bn(ai.revenue)}, up ${P(D.revYoY, 0)} ${J('yoy', 'YoY')} but down ${P(-D.revQoQ)} ${J('qoq', 'QoQ')}; ${J('gm', 'gross margin')} ${P(D.gm)} with help from ${J('onetime', 'temporary')} tariff refunds; ${J('diluted', 'diluted')} EPS ${E$(ai.epsDil)}; ${J('guidance', 'guidance')} of ${G.revGrowth[0]}%–${G.revGrowth[1]}% growth trails the ~${EXA.nextQtrGrowth}% ${J('consensus', 'consensus')}.`,
    spacex: () => `SpaceX’s latest quarter (Q3): revenue up ${P(D.xRevYoY, 0)} ${J('yoy', 'YoY')} and ${P(D.xRevQoQ, 0)} ${J('qoq', 'QoQ')}; its first ${J('opinc', 'operating profit')} as a public company, ${M(xi.opInc)}, and a ${J('net', 'bottom line')} of ${Bn(xi.netInc)}, though about ${Bn(D.xBelow)} came from ${J('onetime', 'below the line')}; ${J('eps', 'EPS')} ${E$(xi.eps)} vs a ${nw('~' + E$(EXX.eps[0]) + '–' + E$(EXX.eps[1]))} ${J('consensus', 'consensus')}; ${J('adjusted', 'adjusted')} ${J('ebitda', 'EBITDA')} ${Bn(X.ebitda.cur)}; the Super Intelligence ${J('segment', 'segment')} is now ${P((XSEG('ai').revenue / xi.revenue) * 100, 0)} of sales; ${Bn(X.capex.cur)} of capex keeps ${J('fcf', 'free cash flow')} deep below zero; ${J('guidance', 'guidance')} far above hopes.`,
  };
  const DKEY = 'rci-decoded';

  SML.widgets.termTranslator = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('rct');
    let lens = LENS[opts.lens] ? opts.lens : 'hop';
    let ti = Math.max(0, TT.findIndex((t) => t.k === opts.term));
    let flip = false;
    const seen = new Set((SML.store.get(DKEY, []) || []).filter((k) => TTK[k]));
    const opt = GROUPS.map((g, gi) => `<optgroup label="${g}">${TT.filter((t) => t.g === gi).map((t) => `<option value="${t.k}">${strip(t.n)}</option>`).join('')}</optgroup>`).join('');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-l', Object.keys(LENS).map((k) => ({ v: k, label: LENS[k] })), lens, 'Example to read')}<span class="grow"></span><span class="rci-prog" id="${id}-pg"></span></div>
      <div class="rci-hl"><span class="k"><i></i>Headline decoder · tap a highlighted word</span><p id="${id}-hl"></p><span class="rci-cap" id="${id}-hc"></span></div>
      <div class="wg-bar rci-nav"><label for="${id}-sel"><span class="sr">Pick a term</span><select id="${id}-sel" class="inp">${opt}</select></label><button type="button" class="btn btn-g sm" data-nav="-1">‹ Prev</button><button type="button" class="btn btn-g sm" data-nav="1">Next ›</button></div>
      <div class="wg-fig"></div>
      <div id="${id}-card"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Apple: fiscal Q3 2026 (April to June), reported ${A.reported}. SpaceX: ${X.period} (July to September), reported ${X.reported}. These are the latest reported quarters as of October 2026. Statement figures in $ millions as the companies print them; ratios computed by FiredBunny. Estimates and the analyst consensus are as reported by news outlets. Hoppy’s Coffee Cart is made up. Education only, not investment advice.</div>`;
    const fig = root.querySelector('.wg-fig'), sel = $id(id + '-sel');
    const mark = () => { const k = TT[ti].k; if (!seen.has(k)) { seen.add(k); SML.store.set(DKEY, Array.from(seen)); } };
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      if (t === sel) { const i = TT.findIndex((x) => x.k === sel.value); if (i >= 0 && i !== ti) { ti = i; mark(); render(true); } return; }
      const nl = st.seg(id + '-l'); if (nl && nl !== lens) { lens = nl; render(true); }
    });
    root.addEventListener('click', (e) => {
      const j = e.target.closest('[data-t]');
      if (j && root.contains(j)) { const i = TT.findIndex((x) => x.k === j.dataset.t); if (i >= 0) { ti = i; mark(); render(true); const nb = root.querySelector(`#${id}-hl [data-t="${TT[ti].k}"]`); if (nb) nb.focus({ preventScroll: true }); } return; }
      const n = e.target.closest('[data-nav]');
      if (n && root.contains(n)) { ti = (ti + Number(n.dataset.nav) + TT.length) % TT.length; mark(); render(true); return; }
      const b = e.target.closest('[data-lens]');
      if (b && root.contains(b)) { lens = b.dataset.lens; st.setSeg(id + '-l', lens); render(true); }
    });
    const drawFig = ui.responsive(fig, (W) => {
      const t = TT[ti], f = t[lens]().fig(W);
      fig.innerHTML = S.wrap(W, f.H, `${strip(t.n)} at ${LENS[lens]}: ${strip(t[lens]().math)}`, f.body, flip && !SML.reduced() ? 'rci-grow' : '');
    });
    function render(animate) {
      flip = !!animate;
      const t = TT[ti], L = t[lens]();
      sel.value = t.k;
      $id(id + '-hl').innerHTML = HEAD[lens]();
      root.querySelectorAll(`#${id}-hl [data-t]`).forEach((b) => { b.classList.toggle('on', b.dataset.t === t.k); b.classList.toggle('seen', seen.has(b.dataset.t)); b.setAttribute('aria-pressed', b.dataset.t === t.k); });
      $id(id + '-hc').textContent = lens === 'hop' ? 'A made-up headline for a made-up cart, built from the numbers in this lesson.' : `Headline-style summary written by FiredBunny from ${lens === 'apple' ? 'Apple’s' : 'SpaceX’s'} release and reported estimates.`;
      const best = t.best && t.best !== lens ? `<button type="button" class="btn btn-g sm rci-best" data-lens="${t.best}">See it with ${LENS[t.best]}’s real numbers ›</button>` : '';
      $id(id + '-card').innerHTML = card({ n: t.n, aka: t.aka }, [
        { c: 'what', h: 'What it is', b: t.what },
        { c: lens === 'hop' ? 'hop' : 'real', h: 'At ' + LENS[lens], b: `<div class="rci-math">${L.math}</div><p>${L.say}</p>` },
      ], { flip: flip && !SML.reduced(), after: best });
      $id(id + '-msg').innerHTML = ui.msg('up', 'Stock', `<b>Moves the stock because:</b> ${whyOf(t, lens)}`);
      $id(id + '-pg').innerHTML = `<span>${seen.size} of ${TT.length} decoded</span><span class="prog"><i style="--w:${Math.round((seen.size / TT.length) * 100)}%"></i></span>`;
      drawFig();
      flip = false;
    }
    render(false);
  };

  /* ======================================================================
     Shared term cards for statement lines (incomeWaterfall + statementExplorer)
     ====================================================================== */
  const TD = {
    prodSales: { n: 'Products sales', what: 'Money from selling devices: iPhone, Mac, iPad, wearables and accessories.', hop: `The cart only sells products: every cup is a product sale, all ${H$(hc.revenue)} of June.`, why: `Products are about ${P((ai.prodSales / ai.revenue) * 100, 0)} of Apple’s sales but keep only about ${P(D.prodGM, 0)} as gross margin, so the mix between products and services moves Apple’s overall margin.` },
    servSales: { n: 'Services sales', what: 'Recurring sales that need no new device: App Store, iCloud, Apple Music and TV, AppleCare, payments, advertising.', hop: 'Like selling monthly coffee subscriptions: paid again every month without building a new cart.', why: `Services keep about ${F.num(D.servGM, 0)} cents of gross profit per dollar and repeat, so investors pay up for them. This quarter Services came in a little under the roughly ${Bn(EXA.services)} analysts expected.` },
    prodCost: { n: 'Cost of sales: products', what: 'Parts, assembly, freight and warranty costs for the devices sold.', hop: `Beans, milk and cups: ${H$(hc.cost)} in June.`, why: 'Component prices hit this line first. Apple flagged rising memory chip costs on the call, which can squeeze product margins.' },
    servCost: { n: 'Cost of sales: services', what: 'The cost of delivering services: data centers, content licenses, support staff.', hop: 'If Hoppy sold subscriptions, the extra cups and the app fees would land here.', why: 'Services cost little compared with their sales, which is why they lift Apple’s overall margin.' },
    other: { n: 'Other income / expense', aka: 'non-operating', what: 'Money from outside the main business: interest earned on cash, minus interest paid on debt, investment gains or losses, currency effects.', hop: `Interest on the cart loan: ${H$(hc.interest)} a month.`, why: 'Usually small next to operating income, so investors look past its swings.' },
    intExp: { n: 'Interest expense', what: 'Interest paid on loans and bonds.', hop: `The ${H$(-hc.interest)} a month Hoppy pays on the ${H$(HOP.bs.loan)} cart loan.`, why: `More debt means more interest. In mid-2026 SpaceX sold ${Bn(X.q2.bond, 0)} of bonds and used part of the money to repay a ${Bn(X.q2.bridgeLoan, 0)} bridge loan, so investors watch this line.` },
    intInc: { n: 'Interest income', what: 'Interest earned on cash and short-term investments.', hop: 'If Hoppy parked spare cash in a savings account, the interest would show up here.', why: `A big cash pile earns interest, which adds to profit or softens a loss. After the IPO, SpaceX’s interest income rose to ${M(xi.intInc)} from ${M(xy.intInc)} a year earlier; it is non-operating, so investors judge the business on operating income.` },
    pretax: { n: 'Income before taxes', aka: 'pretax income', what: 'Operating income plus or minus other income: the profit the tax bill is based on.', hop: `${H$(hc.opInc)} − ${H$(-hc.interest)} interest = ${H$(hc.pretax)}.`, why: 'Compare it with the tax line to get the tax rate, which can move EPS on its own.' },
    tax: { n: 'Provision for income taxes', what: 'The income tax expense for the period.', hop: `20% of ${H$(hc.pretax)} = ${H$(hc.tax)}.`, why: 'A higher tax rate shrinks EPS even when the business does fine, so traders check it against the company’s guidance.' },
    taxRate: { n: 'Effective tax rate', aka: 'tax ÷ pretax income', what: 'The share of pretax profit that went to income taxes.', hop: `${H$(hc.tax)} ÷ ${H$(hc.pretax)} = 20%.`, why: `At Apple’s ${P(D.tax)} rate, each point of tax rate moves EPS by about ${P(100 / (100 - D.tax))}. Apple guided about ${G.taxRate}% for the September quarter.` },
    nm: { n: 'Net margin', aka: 'net income ÷ revenue', what: 'How many cents of each sales dollar end up as profit after everything.', hop: `${H$(hc.netInc)} ÷ ${H$(hc.revenue)} = ${P((hc.netInc / hc.revenue) * 100)}.`, why: 'A rising net margin means profit grows faster than sales, which investors reward.' },
    epsBasic: { n: 'Basic EPS', what: 'Net income divided by the average number of shares outstanding.', hop: `${H$(hc.netInc)} ÷ ${F.num(hc.sh)} shares = ${E$(hc.eps)}.`, why: 'Headlines quote diluted EPS, which can be a little lower because it adds shares from stock awards when they would lower EPS.' },
    shBasic: { n: 'Basic shares', what: 'The average number of shares outstanding during the quarter, in millions.', hop: `Hoppy owns all ${F.num(hc.sh)} shares.`, why: 'Buybacks shrink this count and new shares grow it, so EPS can move even when profit does not.' },
    restructuring: { n: 'Restructuring', what: 'One-time costs of reorganizing: layoffs, closing sites, ending contracts.', hop: 'If Hoppy closed a second cart and paid to break its lease, that would be restructuring.', why: `Treated as one-time, so adjusted profit adds it back. SpaceX’s fell to ${M(xi.restructuring)} from ${M(xy.restructuring)} a year earlier.` },
    impairment: { n: 'Impairment', what: 'A write-down when an asset is suddenly worth less than its value on the books.', hop: 'If the espresso machine broke beyond repair, its remaining book value would be written off.', why: 'A non-cash, usually one-time hit. SpaceX reported none in its latest quarter.' },
    segRev: { n: 'Segment revenue', what: TTK.segment.what, hop: 'Coffee and pastries reported separately, if the cart sold both.', why: TTK.segment.why.spacex },
    segOp: { n: 'Segment operating income', what: 'Each segment’s profit or loss from operations, before interest and taxes.', hop: 'Whether the pastry side makes money after its own ovens, staff and ads.', why: `Shows which parts make money. In Q3 2026 ${segOpTxt()}.` },
    segEbitda: { n: 'Segment adjusted EBITDA', what: 'Each segment’s adjusted EBITDA, a non-GAAP measure that adds back depreciation, stock pay and one-time items.', hop: 'Each side’s earnings before machine wear, if Hoppy reported coffee and pastries apart.', why: `It can look very different from operating income: in Q3 2026 Super Intelligence showed positive ${M(XSEG('ai').ebitda)} on this adjusted measure but ${M(XSEG('ai').opInc)} of operating income. Investors argue about which view matters more.` },
    adjEbitdaM: { n: 'Adjusted EBITDA margin', what: 'Adjusted EBITDA as a percent of revenue (non-GAAP).', hop: `${H$(hc.netInc - hc.interest + hc.tax + HOP.cf.dep)} ÷ ${H$(hc.revenue)} = ${P(((hc.netInc - hc.interest + hc.tax + HOP.cf.dep) / hc.revenue) * 100)}.`, why: 'Popular with growth companies. Compare it with the GAAP operating margin to see how much was left out.' },
    xEps: { n: 'EPS per share (loss quarters)', what: 'Net income or loss divided by the weighted average number of shares.', hop: `Hoppy’s is positive: ${E$(hc.eps)} a share.`, why: 'A smaller loss per share than expected counts as a beat.' },
    xSh: { n: 'Diluted shares', aka: 'weighted average', what: 'The average share count during the quarter, in millions, plus stock-award shares when they would lower EPS. Shares issued mid-quarter count only for the days they existed.', hop: `Hoppy has ${F.num(hc.sh)} shares and issued none.`, why: `SpaceX’s shares outstanding jumped with the preferred conversion, the IPO and other share issuance (Class A ${F.num(X.bs.sharesOutstanding.classA[1])}M → ${F.num(X.bs.sharesOutstanding.classA[0])}M and Class B ${F.num(X.bs.sharesOutstanding.classB[1])}M → ${F.num(X.bs.sharesOutstanding.classB[0])}M from December 31 to September 30). The release does not break down the change in the weighted average.` },
    /* balance sheet */
    cash: { n: 'Cash and cash equivalents', what: 'Money in the bank plus investments that can be turned into cash within about three months.', hop: `Cash in the register and bank: ${H$(HOP.bs.cash)}.`, why: 'Cash is the cushion for bad times and the fuel for buybacks, dividends and building.' },
    ms: { n: 'Marketable securities', what: 'Bonds and other investments that can be sold quickly. Current ones mature within a year; non-current ones later.', hop: 'If Hoppy bought a Treasury bill with spare cash, it would sit here.', why: 'They count toward net cash, the money left if every loan were paid off.' },
    ar: { n: 'Accounts receivable', what: 'Money customers owe for things already delivered.', hop: `The office catering invoice not yet paid: ${H$(HOP.bs.ar)}.`, why: 'Receivables growing much faster than sales can mean customers are slow to pay.' },
    vendor: { n: 'Vendor non-trade receivables', what: 'Apple buys components and sells them to the companies that assemble its products. Until they pay, those assemblers owe Apple for the parts.', hop: 'Like Hoppy buying cups in bulk and selling some to the juice cart next door, which pays him later.', why: 'A quirk of Apple’s supply chain. It rises and falls with production volumes.' },
    inv: { n: 'Inventory', what: 'Products and parts waiting to be sold.', hop: `Beans and cups in stock: ${H$(HOP.bs.inv)}.`, why: 'Rising inventory can mean stocking up ahead of launches or demand slowing. The reason matters, so listen to the call.' },
    oca: { n: 'Other current assets', what: 'Smaller short-term items: prepaid bills, tax refunds due, deposits.', hop: 'A month of the cart permit paid in advance.', why: 'Rarely moves a stock. Check it only when it jumps.' },
    ppe: { n: 'Property, plant and equipment', aka: 'PP&E', what: 'Buildings, machines, data centers, satellites and rockets, minus the wear-and-tear charged so far (depreciation).', hop: `The cart and espresso machine: ${H$(HOP.bs.equip)}.`, why: 'Fast-growing PP&E shows heavy investment, which must pay off later in sales.' },
    intang: { n: 'Intangible assets', what: 'Valuable things you cannot touch: patents, licenses, acquired technology.', hop: 'A secret syrup recipe, if Hoppy had bought it from another café.', why: 'Mostly from deals; if they disappoint, they get written down.' },
    onca: { n: 'Other non-current assets', what: 'Long-term items such as deferred tax assets and long-term prepayments.', hop: 'A two-year permit paid up front.', why: 'Often large, but rarely market-moving.' },
    rou: { n: 'Finance lease right-of-use assets', what: 'Equipment or property leased on long terms, recorded almost as if owned.', hop: 'A leased second espresso machine.', why: 'Comes with a matching lease liability that counts like debt.' },
    digital: { n: 'Digital assets', what: 'Crypto, such as bitcoin, held as an investment.', hop: 'Hoppy holds none.', why: 'Crypto prices swing, so this line can move profit and equity. See the crypto lessons.' },
    gw: { n: 'Goodwill', what: 'The extra paid, when buying a business, above the fair value of its identifiable net assets (its assets minus its liabilities).', hop: `If Hoppy paid ${H$(15000)} for a rival cart whose equipment and supplies, minus its debts, were worth ${H$(12000)}, the extra ${H$(3000)} would be goodwill (imaginary).`, why: 'If the bought business disappoints, goodwill gets written down in one hit.' },
    dta: { n: 'Deferred tax assets', what: 'Past losses or taxes paid early that can cut future tax bills.', hop: 'Hoppy has none.', why: 'Only worth something if the company earns profits later to use them.' },
    ap: { n: 'Accounts payable', what: 'Bills the company owes its suppliers.', hop: `Owes the bean supplier ${H$(HOP.bs.ap)}.`, why: 'Large payables mean suppliers are funding part of the business, a sign of bargaining power.' },
    ocl: { n: 'Other current liabilities', what: 'Short-term bills not yet paid: taxes due, wages, rebates, warranties.', hop: 'This month’s phone bill, not yet paid.', why: 'Rarely moves the stock on its own.' },
    defrev: { n: 'Deferred revenue', what: 'Cash customers paid in advance for something not yet delivered, like a subscription or a launch contract.', hop: `Gift cards sold but not yet used: ${H$(HOP.bs.defrev)}.`, why: 'It turns into revenue later, so rising deferred revenue hints at future sales.' },
    cp: { n: 'Commercial paper', what: 'Very short-term IOUs big companies sell to borrow for a few weeks or months.', hop: 'Like borrowing for a few weeks against next month’s sales.', why: 'Cheap, flexible borrowing that has to be rolled over again and again.' },
    debt: { n: 'Debt', aka: 'term debt · loans · bonds', what: 'Money borrowed with bonds or loans that must be repaid. The current part is due within a year.', hop: `The cart loan: ${H$(HOP.bs.loan)}.`, why: 'Debt must be repaid or refinanced. Compare it with cash: if cash is bigger, the company has net cash.' },
    oncl: { n: 'Other non-current liabilities', what: 'Long-term obligations such as taxes owed over several years.', hop: 'Hoppy has none.', why: 'Usually steady and rarely market-moving.' },
    pref: { n: 'Redeemable convertible preferred stock', what: 'Shares sold to private investors with special rights: paid back first and convertible into common stock. They sit between debt and equity.', hop: 'If an early investor got special shares that are paid out before Hoppy’s, they would sit here.', why: 'At an IPO, preferred stock usually converts into ordinary shares: it moves into equity and the share count jumps.' },
    stock: { n: 'Common stock and paid-in capital', what: 'Money shareholders paid in for shares over the years, plus stock given to employees.', hop: 'What Hoppy put in to start the cart.', why: 'It grows when employees receive stock, one source of dilution.' },
    parStock: { n: 'Common stock (par value)', what: 'A tiny legal "par value" per share. The real money paid in sits in additional paid-in capital.', hop: 'A formality: a few cents per share.', why: 'Ignore its size; look at paid-in capital instead.' },
    apic: { n: 'Additional paid-in capital', what: 'Money investors paid for shares above par value.', hop: 'What Hoppy and any partners paid in for their shares.', why: 'Jumps when a company sells new stock, as in an IPO.' },
    re: { n: 'Retained earnings', what: 'All the profit a company has kept since it started, minus dividends. At companies like Apple that retire the shares they buy back, buybacks reduce it too; many others record buybacks as treasury stock instead.', hop: 'Profits Hoppy left in the business over the years.', why: 'It can fall below zero at a very profitable company once dividends and buybacks add up to more than all the profit it has ever earned.' },
    deficit: { n: 'Accumulated deficit', what: 'Negative retained earnings: total past losses are bigger than total past profits.', hop: 'If the cart had lost money for years, the losses would pile up here.', why: 'Shows how much money the business has lost over its life, which investors weigh against its growth.' },
    aoci: { n: 'Accumulated other comprehensive income (loss)', aka: 'AOCI', what: 'Gains and losses not yet run through profit, mostly from bond prices and currencies.', hop: 'Hoppy has none.', why: 'Small and rarely market-moving.' },
    tCA: { n: 'Total current assets', what: 'Everything that turns into cash within a year.', hop: `${H$(HOP.bs.cash)} cash + ${H$(HOP.bs.inv)} beans + ${H$(HOP.bs.ar)} invoice = ${H$(HOP.bs.cash + HOP.bs.inv + HOP.bs.ar)}.`, why: 'Compare with current liabilities to see whether the next year’s bills are covered.' },
    tA: { n: 'Total assets', what: 'Everything the company owns or is owed.', hop: `${H$(HOP.bs.assets)}: cash, beans, the invoice and the cart.`, why: 'Assets always equal liabilities plus equity. The mix matters more than the size.' },
    tCL: { n: 'Total current liabilities', what: 'Everything due within a year.', hop: `Bean bill ${H$(HOP.bs.ap)} + gift cards ${H$(HOP.bs.defrev)}, plus any loan payments due this year.`, why: 'If it is far above current assets, the company may need to borrow to pay its bills.' },
    tL: { n: 'Total liabilities', what: 'Everything the company owes.', hop: `${H$(HOP.bs.ap)} + ${H$(HOP.bs.defrev)} + ${H$(HOP.bs.loan)} loan = ${H$(HOP.bs.liab)}.`, why: 'The claims that come before shareholders if things go wrong.' },
    tE: { n: 'Shareholders’ equity', aka: 'book value', what: 'Assets minus liabilities: what would be left for shareholders on paper.', hop: `${H$(HOP.bs.assets)} − ${H$(HOP.bs.liab)} = ${H$(HOP.bs.equity)}.`, why: 'Growing equity usually means retained profits; a sudden jump can also mean new shares were sold.' },
    tLE: { n: 'Total liabilities and equity', what: 'Always equal to total assets: every dollar the company has came from a lender or an owner.', hop: `${H$(HOP.bs.liab)} + ${H$(HOP.bs.equity)} = ${H$(HOP.bs.assets)}.`, why: 'If the two sides ever differ, something is wrong with the numbers.' },
    cashMs: { n: 'Cash and marketable securities', what: 'Cash plus quickly sellable investments: the company’s war chest.', hop: `${H$(HOP.bs.cash)}, all in the register and bank.`, why: 'Pays for buybacks, deals and downturns without borrowing.' },
    debtTot: { n: 'Total debt', what: 'All borrowing: commercial paper, bonds and loans (and, at SpaceX, finance leases).', hop: `The ${H$(HOP.bs.loan)} cart loan.`, why: 'More debt means more interest and less room in a bad year.' },
    netCash: { n: 'Net cash', what: 'Cash and marketable securities minus all debt. Positive means the company could pay off every loan today.', hop: `${H$(HOP.bs.cash)} − ${H$(HOP.bs.loan)} = ${H$(HOP.bs.cash - HOP.bs.loan)}.`, why: 'A big net cash pile lowers risk and funds buybacks, which supports the share price.' },
    curRatio: { n: 'Current ratio', aka: 'current assets ÷ current liabilities', what: 'Whether the next year’s bills are covered by assets that turn into cash within a year. Around 1 or above is fine for most big companies.', hop: 'The cart’s cash and stock easily cover its bills due this month.', why: 'A ratio far below 1 can force a company to borrow or raise money.' },
    de: { n: 'Debt to equity', what: 'Total debt divided by shareholders’ equity.', hop: `${H$(HOP.bs.loan)} ÷ ${H$(HOP.bs.equity)} = ${F.num(HOP.bs.loan / HOP.bs.equity, 2)}.`, why: 'Above 2 deserves a closer look in most industries. Always compare debt with cash too: net cash changes the picture.' },
    bvps: { n: 'Book value per share', what: 'Shareholders’ equity divided by the number of shares.', hop: `${H$(HOP.bs.equity)} ÷ ${F.num(hc.sh)} = ${E$(HOP.bs.equity / hc.sh)}.`, why: 'Apple’s share price is far above its book value per share: investors pay for its brand and future profits, which the balance sheet does not show.' },
    /* cash flow */
    cfNi: { n: 'Net income (cash flow start)', what: 'The cash flow statement starts from profit, then corrects for everything that was not cash.', hop: `June profit: ${H$(HOP.cf.ni)}.`, why: 'If cash from operations keeps falling short of net income, the profit may be lower quality.' },
    cfDa: { n: 'Depreciation and amortization', aka: 'D&A', what: 'The cost of equipment wearing out. It lowered profit but no cash left this period, so it is added back.', hop: `Machine depreciation: +${H$(HOP.cf.dep)}.`, why: 'Big D&A means big past spending; replacing that equipment costs real cash later.' },
    cfSbc: { n: 'Share-based compensation', aka: 'stock pay', what: 'Pay given in stock instead of cash. Added back because no cash left.', hop: 'If Hoppy paid the barista in shares, no cash would leave the register.', why: 'No cash today, but it creates new shares later, which dilutes owners unless buybacks soak them up.' },
    cfOth: { n: 'Other adjustments', what: 'Other non-cash items, such as deferred taxes and investment gains or losses.', hop: 'Hoppy has none.', why: 'Usually small.' },
    cfAr: { n: 'Change in accounts receivable', what: 'When customers pay what they owed, cash comes in even though the sale was booked earlier.', hop: `When the office pays the ${H$(HOP.bs.ar)} invoice, ${H$(HOP.bs.ar)} of cash comes in.`, why: 'Collections can make operating cash beat profit for a while.' },
    cfVendor: { n: 'Change in vendor receivables', what: 'Cash collected from the assemblers that owe Apple for components it sold them. A positive number means they paid down what they owed.', hop: 'The juice cart paying Hoppy for the cups.', why: 'Swings with Apple’s production cycle.' },
    cfInv: { n: 'Change in inventories', what: 'Buying more stock than you sell uses cash.', hop: `Extra beans stocked: ${H$(HOP.cf.inv)}.`, why: 'An inventory build ties up cash until the products sell.' },
    cfOa: { n: 'Change in other assets', what: 'Cash tied up in other assets, such as prepayments.', hop: 'Paying next month’s permit early.', why: 'Large swings deserve a look in the filing.' },
    cfAp: { n: 'Change in accounts payable', what: 'Paying suppliers uses cash; owing them more saves cash for now.', hop: `Bean bill not yet paid: +${H$(HOP.cf.ap)}.`, why: 'Stretching suppliers boosts cash flow only temporarily.' },
    cfOl: { n: 'Change in other liabilities', what: 'Cash effect of changes in taxes owed, accrued costs and similar bills.', hop: 'The phone bill still unpaid at month end.', why: 'Can swing a lot from one period to the next.' },
    cfOp: { n: 'Operating cash flow', what: 'Cash the business itself brought in after paying suppliers, staff and taxes.', hop: `${H$(HOP.cf.ni)} + ${H$(HOP.cf.dep)} − ${H$(-HOP.cf.inv)} + ${H$(HOP.cf.ap)} = ${H$(HOP.cf.ocf)}.`, why: 'The engine for everything else: capex, dividends, buybacks.' },
    cfMs: { n: 'Marketable securities bought, matured or sold', what: 'Moving cash in and out of bonds. It changes where the money sits, not how much the company has.', hop: 'Moving spare cash between the register and a Treasury bill.', why: 'Ignore these when judging the business; they are parking choices.' },
    capex: { n: 'Capex', aka: 'capital expenditures', what: 'Cash spent on long-lasting things: buildings, machines, data centers, satellites.', hop: `A new grinder: ${H$(HOP.cf.capex)}.`, why: 'Capex is subtracted to get free cash flow. A sudden jump can sink a stock even after a strong quarter, as SpaceX found in August 2026.' },
    cfOthInv: { n: 'Other investing', what: 'Smaller investing items, such as buying businesses or other investments.', hop: 'Hoppy has none.', why: 'Watch for acquisitions hiding here.' },
    cfInvTot: { n: 'Investing cash flow', what: 'Cash spent on, or received from, long-term investments, equipment and securities.', hop: `The grinder: ${H$(HOP.cf.capex)}.`, why: 'Big negative investing is normal for a company building for growth.' },
    cfTaxes: { n: 'Taxes paid on employee stock awards', what: 'When employees’ shares vest, the company holds back some shares and pays their taxes in cash.', hop: 'Hoppy has none.', why: 'A hidden cash cost of paying people in stock.' },
    cfDiv: { n: 'Dividends paid', what: 'Cash paid out to shareholders.', hop: `Hoppy’s ${H$(-HOP.cf.div)} dividend.`, why: `Apple declared ${E$(A.dividend.perShare)} a share for this quarter. Dividends tend to be steady, so investors notice any cut.` },
    cfBuyback: { n: 'Buybacks', aka: 'share repurchases', what: 'Cash spent buying back the company’s own shares, which shrinks the share count.', hop: 'If Hoppy bought back a partner’s shares, each remaining share would own more of the cart.', why: `Fewer shares made Apple’s EPS grow ${P(D.epsYoY)} while net income grew ${P(D.niYoY)}.` },
    cfIssue: { n: 'New term debt issued', what: 'Borrowing new money by selling bonds.', hop: 'Taking out a second cart loan.', why: 'Apple issued none in these nine months.' },
    cfRepay: { n: 'Term debt repaid', what: 'Paying back bonds that came due.', hop: 'Paying down the cart loan.', why: 'Shrinking debt lowers interest costs and risk.' },
    cfCp: { n: 'Commercial paper, net', what: 'Short-term borrowing taken or paid back, net.', hop: 'Paying back a few-week loan.', why: 'Apple paid down most of its commercial paper.' },
    cfOthFin: { n: 'Other financing', what: 'Smaller financing items.', hop: 'Hoppy has none.', why: 'Usually small.' },
    cfFinTot: { n: 'Financing cash flow', what: 'Cash from or to lenders and shareholders: borrowing, repaying, dividends, buybacks, selling new shares.', hop: `The dividend: ${H$(HOP.cf.div)}.`, why: 'Positive means the company raised money; negative means it sent money back to owners and lenders.' },
    chg: { n: 'Change in cash', what: 'Operating plus investing plus financing cash flow.', hop: `${H$(HOP.cf.ocf)} − ${H$(-HOP.cf.capex)} − ${H$(-HOP.cf.div)} = +${H$(HOP.cf.ocf + HOP.cf.capex + HOP.cf.div)}.`, why: 'Links the cash flow statement to the cash line on the balance sheet.' },
    beg: { n: 'Cash at the start', what: 'Cash, cash equivalents and restricted cash at the start of the period.', hop: 'What was in the register on June 1.', why: 'Start plus change equals end.' },
    end: { n: 'Cash at the end', what: 'Cash, cash equivalents and restricted cash at the end of the period.', hop: 'What was in the register on June 30.', why: 'Matches the cash line on the balance sheet (plus any restricted cash).' },
    cashTaxes: { n: 'Cash paid for income taxes', what: 'Income taxes actually paid in cash during the period.', hop: 'The tax Hoppy actually sent in.', why: 'Can differ a lot from the tax expense on the income statement because of timing.' },
    capexQ: { n: 'Capex by quarter', what: 'Cash spent on long-lasting things during one quarter.', hop: `A new grinder: ${H$(-HOP.cf.capex)}.`, why: `SpaceX’s Q3 capex was ${F.num(X.capex.cur / xi.revenue, 1)}× its revenue and it guided ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)} for Q4. In August a capex jump, plus the first lockup release on August 6, sank the stock ${P(-X.q2.reaction.nextDayPct)} in a day; in October, guidance far above expectations lifted it.` },
  };
  const TDMAP = { revenue: 'revenue', cost: 'cost', gross: 'gross', gm: 'gm', rd: 'rd', sga: 'sga', opex: 'opex', opInc: 'opinc', opm: 'opm', oploss: 'oploss', netInc: 'net', netloss: 'netloss', epsDil: 'eps', shDil: 'diluted', adjEbitda: 'ebitda', fcf: 'fcf' };
  function td(k, co) {
    if (TD[k]) return TD[k];
    const t = TTK[TDMAP[k] || k];
    if (!t) return { n: k, what: '', hop: '', why: '' };
    return { n: t.n, aka: t.aka, what: t.what, hop: hopFromTT(t.k), why: whyOf(t, co) };
  }

  /* ======================================================================
     Widget 2: incomeWaterfall: Apple's June 2026 quarter, revenue to EPS
     ====================================================================== */
  const WROWS = [
    { k: 'revenue', l: 'Revenue', s: 'Revenue', abs: 1, c: 'info' },
    { k: 'cost', l: 'Cost of sales', s: 'Cost of sales', c: 'dn' },
    { k: 'gross', l: 'Gross profit', s: 'Gross profit', abs: 1, c: 'acc' },
    { k: 'rd', l: 'Research &amp; development', s: 'R&amp;D', c: 'dn' },
    { k: 'sga', l: 'Selling, general &amp; admin', s: 'SG&amp;A', c: 'dn' },
    { k: 'opInc', l: 'Operating income', s: 'Operating inc.', abs: 1, c: 'acc' },
    { k: 'other', l: 'Other income', s: 'Other income', c: 'up' },
    { k: 'tax', l: 'Income tax', s: 'Income tax', c: 'dn' },
    { k: 'netInc', l: 'Net income', s: 'Net income', abs: 1, c: 'up' },
  ];
  const SIGN = { cost: -1, rd: -1, sga: -1, tax: -1, other: 1 };
  function wModel(per, ref) {
    const r = A.is[per], on = !!ref && per === 'cur';
    const pre = on ? D.ref.pre : 0, taxOn = on ? D.ref.taxOn : 0, netOn = on ? D.ref.net : 0;
    return { revenue: r.revenue, cost: r.cost + pre, gross: r.gross - pre, rd: r.rd, sga: r.sga, opInc: r.opInc - pre, other: r.other, tax: r.tax - taxOn, netInc: r.netInc - netOn, eps: on ? D.ref.eps : r.epsDil, sh: r.shDil, est: on };
  }
  const CATS = { iPhone: 'Apple’s phone line, about half of all sales.', Mac: 'Laptops and desktops.', iPad: 'Tablets.', 'Wearables, Home & Accessories': 'Apple Watch, AirPods, Apple TV, HomePod, Vision Pro and accessories.', Services: 'App Store, iCloud, Apple Music and TV, AppleCare, payments and advertising.' };
  const REGS = { Americas: 'North and South America.', Europe: 'Europe plus India, the Middle East and Africa.', 'Greater China': 'Mainland China, Hong Kong and Taiwan.', Japan: 'Japan.', 'Rest of Asia Pacific': 'Australia and the Asian markets not counted elsewhere.' };
  const SHORTNAME = { 'Wearables, Home & Accessories': 'Wearables, Home', 'Rest of Asia Pacific': 'Rest of Asia Pac.' };

  SML.widgets.incomeWaterfall = function (root) {
    const id = SML.uid('rciw'), pid = id + '-hz';
    let sel = 'revenue', mixSel = null, lastW = 600, cur = null, anim = 0;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-p', [{ v: 'cur', label: A.labels.cur }, { v: 'ya', label: A.labels.ya }], 'cur', 'Quarter')}${ui.seg(id + '-u', [{ v: 'usd', label: '$ billions' }, { v: 'per', label: 'Per $1 of sales' }], 'usd', 'Units')}<span class="grow"></span>${ui.chips(id + '-r', [{ k: 'ref', label: 'Remove tariff refund', color: 'var(--accent)' }])}</div>
      <div class="wg-fig"></div>
      <div class="rci-cardwrap" id="${id}-card"></div>
      <div class="wg-read">${ui.stat('Revenue', id + '-s1')}${ui.stat('Gross margin', id + '-s2')}${ui.stat('Operating margin', id + '-s3')}${ui.stat('Net income', id + '-s4')}${ui.stat('Diluted EPS', id + '-s5', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-bar"><span class="wg-title">Where the sales came from</span><span class="grow"></span>${ui.seg(id + '-m', [{ v: 'ps', label: 'Products vs services' }, { v: 'cat', label: 'Categories' }, { v: 'reg', label: 'Regions' }], 'ps', 'Breakdown')}</div>
      <div class="wg-fig rci-mixf"></div>
      <div class="wg-msg" id="${id}-msg2"></div>
      <div class="wg-note">Apple’s fiscal Q3 2026: three months ended ${A.periodEnd}, reported ${A.reported}; the latest reported quarter as of October 2026. Source: Apple’s 8-K, Exhibit 99.1. Tap any row for its card. "Remove tariff refund" is our estimate: Apple said refunds added about ${TR.grossMarginPts} points of gross margin and ${E$(TR.eps)} of EPS; we take ${E$(TR.eps)} × ${shM(ai.shDil)} diluted shares ≈ ${Bn(D.ref.net, 2)} after tax, ≈ ${Bn(D.ref.pre, 2)} before tax at the quarter’s ${P(D.tax)} tax rate.</div>`;
    const fig = root.querySelector('.wg-fig'), mixFig = root.querySelector('.rci-mixf'), esc = SML.esc;
    const st = ui.wire(root, (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#' + id + '-m')) { mixSel = null; mixAnim = true; drawMix(); return; }
      go(); renderCard(); stats();
    });
    const per = () => st.seg(id + '-p') || 'cur', unit = () => st.seg(id + '-u') || 'usd', refOn = () => st.on(id + '-r', 'ref');
    const vec = (m, u) => { const d = u === 'per' ? m.revenue : 1; return WROWS.map((r) => m[r.k] / d).concat([m.eps]); };

    function go() {
      const target = vec(wModel(per(), refOn()), unit());
      if (!cur || cur.length !== target.length || SML.reduced()) { cur = target; renderAll(); return; }
      const from = cur.slice(), t0 = performance.now(), dur = 480, my = ++anim;
      const step = (now) => {
        if (my !== anim) return;
        const t = clamp((now - t0) / dur, 0, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        cur = from.map((a, i) => a + (target[i] - a) * e);
        renderAll();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    SML.onCleanup(() => { anim++; });

    function drawMain() {
      const W = lastW, compact = W < 540, u = unit(), p = per(), other = p === 'cur' ? 'ya' : 'cur';
      const m = wModel(p, refOn()), gm = wModel(other, refOn()), gv = vec(gm, u);
      const est = m.est;
      const yoyM = wModel('cur', refOn()), yaM = wModel('ya', false);
      const rowH = compact ? 38 : 31, top = 30, lw = compact ? 100 : 182, vw = compact ? 78 : 100, yw = compact ? 0 : 76;
      const x0 = lw + 6, x1 = W - vw - yw - 10;
      const dom = u === 'per' ? 1 : Math.max(ai.revenue, ay.revenue);
      const x = SML.lin(0, dom, x0, x1);
      const fmtv = (v) => (u === 'per' ? cents(v * 100) : BM(v));
      let s = hatch(pid, 'acc');
      /* header */
      s += S.rect(0, 6, 12, 10, 'f-info', 2) + S.text(17, 15, p === 'cur' ? A.labels.cur : A.labels.ya, 'sm ink');
      const gl = (p === 'cur' ? A.labels.ya : A.labels.cur);
      const gx = 17 + estW(p === 'cur' ? A.labels.cur : A.labels.ya, 11.5) + 18;
      s += S.rect(gx, 6, 12, 10, 'nf s-mut dash2', 2) + S.text(gx + 17, 15, gl, 'sm');
      if (!compact) s += S.text(W - yw, 15, u === 'per' ? '¢ per $1' : '$ billions', 'cap', 'end') + S.text(W, 15, u === 'per' ? 'vs year ago' : 'YoY', 'cap', 'end');
      /* rows */
      let run = 0, grun = 0;
      WROWS.forEach((r, i) => {
        const v = cur[i], g = gv[i], y = top + i * rowH, cy = compact ? y + 15 : y + rowH / 2, bh = compact ? 16 : 17, on = sel === r.k;
        let a, b, ga, gb;
        if (r.abs) { a = 0; b = v; ga = 0; gb = g; } else { const sg = SIGN[r.k]; a = run; b = run + sg * v; ga = grun; gb = grun + sg * g; }
        run = b; grun = gb;
        const realCur = m[r.k];
        let yoy;
        if (u === 'per') yoy = r.k === 'revenue' ? '' : sgn((yoyM[r.k] / yoyM.revenue - yaM[r.k] / yaM.revenue) * 100, (d) => F.num(d, 1) + '¢');
        else if (r.k === 'other') yoy = sgn(yoyM.other - yaM.other, M);
        else yoy = (yoyM.est && ['cost', 'gross', 'opInc', 'tax', 'netInc'].indexOf(r.k) >= 0 ? '≈' : '') + SP(pc(yoyM[r.k], yaM[r.k]));
        const good = r.k === 'cost' || r.k === 'rd' || r.k === 'sga' || r.k === 'tax' ? 'mut' : (u === 'per' ? ((yoyM[r.k] / yoyM.revenue - yaM[r.k] / yaM.revenue) >= 0 ? 'up' : 'dn') : 'up');
        const lab = (est && ['cost', 'gross', 'opInc', 'tax', 'netInc'].indexOf(r.k) >= 0 ? '≈' : '') + fmtv(u === 'per' ? v : realCur);
        let g1 = `<g class="rci-row${on ? ' on' : ''}" data-k="${r.k}" tabindex="0" role="button" aria-label="${strip(r.l)}: ${strip(lab)}, ${strip(yoy)} year over year. Show card.">`;
        g1 += S.rect(0, y + 1, W, rowH - 2, 'rci-bg' + (on ? ' f-acc-t' : ''), 4) + (on ? S.rect(0, y + 3, 3, rowH - 6, 'f-acc', 1.5) : '');
        g1 += S.text(6, compact ? y + 19 : cy + 4.5, compact ? r.s : r.l, (compact ? 'sm' : 'md') + ' ink' + (r.abs ? ' b' : ''));
        const gxa = x(Math.min(ga, gb)), gxb = x(Math.max(ga, gb));
        g1 += S.rect(gxa, cy - bh / 2 - 2, Math.max(1, gxb - gxa), bh + 4, 'nf s-mut dash2', 2);
        const xa = x(Math.min(a, b)), xb = x(Math.max(a, b));
        g1 += S.rect(xa, cy - bh / 2, Math.max(2, xb - xa), bh, 'f-' + (r.k === 'other' && v < 0 ? 'dn' : r.c), 2);
        if (est && r.k === 'gross') { const xr = x(b), xr2 = x(b + (u === 'per' ? D.ref.pre / ai.revenue : D.ref.pre)); g1 += S.rect(xr, cy - bh / 2, Math.max(1, xr2 - xr), bh, '', 2, ` fill="url(#${pid})"`); if (!compact) g1 += S.text(xr2 + 5, cy + 4, 'refund', 'xs b acc'); }
        if (i < WROWS.length - 1) g1 += S.line(x(b), cy + bh / 2, x(b), cy + rowH - bh / 2, 's-mut dash2');
        g1 += S.text(W - yw - (compact ? 4 : 0), compact ? y + 17 : cy + 4.5, lab, (compact ? 'sm' : 'md') + ' mono b ' + (r.abs ? 'ink' : 'mut'), 'end');
        g1 += S.text(W - (compact ? 4 : 0), compact ? y + 31 : cy + 4.5, yoy, (compact ? 'xs' : 'sm') + ' mono b ' + good, 'end');
        s += g1 + '</g>';
      });
      /* EPS row */
      const ey = top + WROWS.length * rowH + 6, eh = compact ? 50 : 46, on = sel === 'eps', eps = cur[WROWS.length];
      const eyo = pc(wModel('cur', refOn()).eps, ay.epsDil);
      let g2 = `<g class="rci-row${on ? ' on' : ''}" data-k="eps" tabindex="0" role="button" aria-label="Diluted EPS ${E$(eps)}. Show card.">`;
      g2 += S.rect(0, ey, W, eh, 'rci-bg' + (on ? ' f-acc-t' : ''), 4) + S.line(0, ey - 3, W, ey - 3, 's-line');
      g2 += S.text(6, ey + (compact ? 20 : 27), compact ? 'EPS' : 'Earnings per share', (compact ? 'sm' : 'md') + ' b ink');
      if (compact) g2 += S.text(6, ey + 36, 'diluted', 'xs');
      const ex = x0 + 4, et = compact ? '÷ ' + F.num(m.sh / 1000, 2) + 'B shares' : '÷ ' + F.num(m.sh / 1000, 2) + 'B diluted shares =';
      g2 += S.text(ex, ey + (compact ? 21 : 27), et, 'sm');
      if (compact) g2 += S.text(ex, ey + 37, '= profit per share', 'xs');
      const coinX = ex + estW(et, 11.5) + 30;
      if (!compact && coinX + 22 < x1) g2 += S.circle(coinX, ey + eh / 2, 19, 'f-acc s-surf w2') + S.text(coinX, ey + eh / 2 + 5, '$', 'lg b onacc', 'middle');
      g2 += S.text(W - yw - (compact ? 4 : 0), ey + (compact ? 21 : 28), (m.est ? '≈' : '') + E$(eps), (compact ? 'md' : 'lg') + ' mono b acc', 'end');
      g2 += S.text(W - (compact ? 4 : 0), ey + (compact ? 37 : 28), (m.est ? '≈' : '') + SP(eyo), (compact ? 'xs' : 'sm') + ' mono b up', 'end');
      s += g2 + '</g>';
      const H = ey + eh + 4;
      fig.innerHTML = wrapI(W, H, `Apple ${p === 'cur' ? A.labels.cur : A.labels.ya} income statement as a waterfall from revenue ${Bn(m.revenue)} to net income ${Bn(m.netInc)} and diluted EPS ${E$(m.eps)}`, s);
    }

    function cardFor(k) {
      const m = wModel('cur', refOn()), est = m.est;
      const T = k === 'eps' ? td('epsDil', 'apple') : k === 'opInc' ? td('opInc', 'apple') : k === 'netInc' ? td('netInc', 'apple') : td(k, 'apple');
      const R = {
        revenue: `${Bn(ai.revenue)}, up ${P(D.revYoY)} from ${Bn(ay.revenue)}. Products ${Bn(ai.prodSales)} (${SP(pc(ai.prodSales, ay.prodSales))}), Services ${Bn(ai.servSales)} (${SP(pc(ai.servSales, ay.servSales))}). Analysts expected about ${Bn(EXA.revenue[0])}–${Bn(EXA.revenue[1])}.`,
        cost: `${Bn(ai.cost)}: products ${Bn(ai.prodCost)}, services ${Bn(ai.servCost)}. Up ${P(pc(ai.cost, ay.cost))} while sales rose ${P(D.revYoY)}.${est ? ` Without the tariff refund, about ${Bn(m.cost)}.` : ''}`,
        gross: `${Bn(ai.gross)}, a ${P(D.gm)} gross margin (${P(D.gmYa)} a year ago). Products kept ${P(D.prodGM)}, Services ${P(D.servGM)}. ${est ? `Without the refund: about ${Bn(m.gross)}, ≈${P(D.gmEx, 0)}.` : `Apple said about ${TR.grossMarginPts} points came from temporary tariff refunds; its September guide still includes about ${G.tariffRefundPts} point of them.`}`,
        rd: `${Bn(ai.rd)}, ${P((ai.rd / ai.revenue) * 100)} of sales, up ${P(pc(ai.rd, ay.rd))}: ${F.num(pc(ai.rd, ay.rd) / D.revYoY, 1)} times as fast as revenue.`,
        sga: `${Bn(ai.sga)}, ${P((ai.sga / ai.revenue) * 100)} of sales, up ${P(pc(ai.sga, ay.sga))}: slower than revenue.`,
        opInc: `${Bn(ai.opInc)}, up ${P(pc(ai.opInc, ay.opInc))}: a ${P(D.om)} operating margin vs ${P(D.omYa)} a year earlier.${est ? ` Without the refund, about ${Bn(m.opInc)}.` : ''}`,
        other: `${M(ai.other)} vs ${M(ay.other)} a year earlier. Apple guided about ${M(G.otherIncome)} for the September quarter.`,
        tax: `${Bn(ai.tax)} on ${Bn(ai.pretax)} of pretax income: a ${P(D.tax)} rate vs ${P(D.taxYa)} a year earlier. Guidance for September: about ${G.taxRate}%.`,
        netInc: `${Bn(ai.netInc)}, up ${P(D.niYoY)}: ${P(D.nm)} of sales, vs ${P(D.nmYa)} a year earlier.${est ? ` Without the refund, about ${Bn(m.netInc)}.` : ''}`,
        eps: `${M(ai.netInc)} ÷ ${shM(ai.shDil)} diluted shares = ${E$(ai.epsDil)}, up ${P(D.epsYoY)} from ${E$(ay.epsDil)}. Diluted shares fell ${P(-D.shYoY)} thanks to buybacks. Includes ${E$(TR.eps)} of tariff refunds: about ${E$(D.ref.eps)} without (${SP(D.epsExYoY)}). Analysts expected about ${E$(EXA.eps[0])}–${E$(EXA.eps[1])}.`,
      };
      return card({ n: k === 'eps' ? 'Diluted EPS' : k === 'tax' ? 'Income tax' : T.n, aka: T.aka }, [
        { c: 'what', h: 'What it is', b: T.what },
        { c: 'hop', h: 'At Hoppy’s cart', b: T.hop },
        { c: 'real', h: 'At Apple, June 2026 qtr', b: R[k] },
        { c: 'stock', h: 'Why it matters for the stock', b: T.why },
      ]);
    }

    function stats() {
      const m = wModel(per(), refOn()), e = m.est ? '≈' : '';
      const set = (n, v) => { const el = $id(id + '-s' + n); if (el) el.textContent = v; };
      set(1, Bn(m.revenue)); set(2, e + P((m.gross / m.revenue) * 100, m.est ? 0 : 1)); set(3, e + P((m.opInc / m.revenue) * 100, m.est ? 0 : 1)); set(4, e + Bn(m.netInc)); set(5, e + E$(m.eps));
      let msg;
      const p = per(), u = unit();
      if (p === 'ya') msg = ui.msg('info', 'A year ago', `The June 2025 quarter: ${Bn(ay.revenue)} of sales and EPS of ${E$(ay.epsDil)}. The dashed outlines show June 2026: sales grew ${P(D.revYoY)}, and gross profit, operating income, net income and EPS all grew faster.`);
      else if (refOn()) msg = ui.msg('acc', 'Temporary', `Without the tariff refund EPS is about ${E$(D.ref.eps)}: still up ${P(D.epsExYoY)} from ${E$(ay.epsDil)} and still above the ${E$(EXA.eps[0])}–${E$(EXA.eps[1])} consensus, but by ${D.beatEx[0]}–${D.beatEx[1]} cents instead of ${D.beat[0]}–${D.beat[1]} (our math, assuming the consensus did not include the refunds). Gross margin drops to about ${P(D.gmEx, 0)}. Refunds are temporary: the September guide still includes about ${G.tariffRefundPts} point of them.`);
      else if (u === 'per') { const r = (k) => cents((ai[k] / ai.revenue) * 100); msg = ui.msg('info', 'Per $1', `Of each $1 of sales, Apple spent ${r('cost')} making what it sold, ${r('rd')} on R&amp;D, ${r('sga')} on SG&amp;A and ${r('tax')} on tax. With ${r('other')} of other income, it kept ${r('netInc')} as profit, up from ${cents(D.nmYa)} a year earlier.`); }
      else msg = ui.msg('up', 'Beat', `Out of ${Bn(ai.revenue)} of sales Apple kept ${Bn(ai.netInc)}: ${P(D.nm)}, up from ${P(D.nmYa)}. EPS of ${E$(ai.epsDil)} beat the roughly ${E$(EXA.eps[0])}–${E$(EXA.eps[1])} expected, yet the stock fell about ${P(-A.reaction.closePct, 0)} the next day. See <a href="#l-rc-price">why</a>.`);
      $id(id + '-msg').innerHTML = msg;
    }

    /* products vs services, categories, regions */
    function drawMix() {
      const W = lastW, compact = W < 540, mode = st.seg(id + '-m') || 'ps';
      let s = '', H;
      if (mode === 'ps') {
        const x = SML.lin(0, ai.revenue, 0, W), bh = 34, yA = 22, yB = 128;
        const segs = [
          { k: 'prod', c: 'info', a: [0, ai.prodSales], b: [0, D.prodGP], l: 'Products', gm: D.prodGM, yoy: pc(ai.prodSales, ay.prodSales) },
          { k: 'serv', c: 'vio', a: [ai.prodSales, ai.revenue], b: [D.prodGP, ai.gross], l: 'Services', gm: D.servGM, yoy: pc(ai.servSales, ay.servSales) },
        ];
        segs.forEach((g, i) => {
          const on = mixSel === g.k;
          let gg = `<g class="rci-row${on ? ' on' : ''}" data-m="${g.k}" tabindex="0" role="button" aria-label="${g.l}: sales ${Bn(g.a[1] - g.a[0])}, gross profit ${Bn(g.b[1] - g.b[0])}, ${P(g.gm)} gross margin">`;
          gg += S.polygon([[x(g.a[0]) + 1, yA + bh], [x(g.a[1]) - 1, yA + bh], [x(g.b[1]) - 1, yB], [x(g.b[0]) + 1, yB]], 'f-' + g.c + (on ? ' o50' : ' o35'));
          const wa = x(g.a[1]) - x(g.a[0]), wb = x(g.b[1]) - x(g.b[0]);
          gg += S.rect(x(g.a[0]) + 1, yA, wa - 2, bh, 'f-' + g.c + (on ? ' s-ink w2' : ''), 3) + S.rect(x(g.b[0]) + 1, yB, wb - 2, bh, 'f-' + g.c + (on ? ' s-ink w2' : ''), 3);
          const la = wa > 130 ? `${g.l} ${Bn(g.a[1] - g.a[0])}` : Bn(g.a[1] - g.a[0]);
          gg += S.text(x(g.a[0]) + wa / 2, yA + 22, la, 'sm mono b on', 'middle');
          gg += S.text(x(g.b[0]) + wb / 2, yB + 22, Bn(g.b[1] - g.b[0]), 'sm mono b on', 'middle');
          const ly = yB + bh + 18 + i * 16;
          gg += S.text(x(g.b[0]) + 2, ly, `${g.l}: ${P(g.gm)} margin`, 'sm b ' + g.c);
          s += gg + '</g>';
        });
        const xc = x(ai.gross);
        s += S.rect(xc + 2, yB, x(ai.revenue) - xc - 3, bh, 'nf s-mut dash2', 3) + S.text((xc + W) / 2, yB + 22, compact ? 'cost ' + Bn(ai.cost) : 'cost of sales ' + Bn(ai.cost), 'sm mut', 'middle');
        s += S.text(0, yA - 7, 'Sales ' + Bn(ai.revenue), 'sm b ink') + S.text(0, yB - 7, 'Gross profit ' + Bn(ai.gross) + (compact ? '' : ' = ' + P(D.gm) + ' of sales'), 'sm b ink');
        H = yB + bh + 44;
      } else {
        const src = mode === 'cat' ? A.categories : A.regions, keys = Object.keys(src.cur).sort((a, b) => src.cur[b] - src.cur[a]);
        const rowH = compact ? 36 : 34, top = 24, lw = compact ? 104 : 226, vw = compact ? 112 : 170;
        const x = SML.lin(0, Math.max(...keys.map((k) => Math.max(src.cur[k], src.ya[k]))), lw, W - vw);
        s += S.rect(0, 5, 12, 10, 'f-info', 2) + S.text(17, 14, A.labels.cur, 'sm ink');
        const gx = 17 + estW(A.labels.cur, 11.5) + 18;
        s += S.rect(gx, 5, 12, 10, 'nf s-mut dash2', 2) + S.text(gx + 17, 14, A.labels.ya, 'sm');
        keys.forEach((k, i) => {
          const y = top + i * rowH, cy = y + rowH / 2, on = mixSel === k, yo = pc(src.cur[k], src.ya[k]);
          let gg = `<g class="rci-row${on ? ' on' : ''}" data-m="${esc(k)}" tabindex="0" role="button" aria-label="${esc(k)}: ${Bn(src.cur[k])}, ${SP(yo)} year over year">`;
          gg += S.rect(0, y + 1, W, rowH - 2, 'rci-bg' + (on ? ' f-acc-t' : ''), 4);
          gg += S.text(6, cy + 4.5, compact && SHORTNAME[k] ? SHORTNAME[k] : k.replace('&', '&amp;'), (compact ? 'sm' : 'md') + ' ink');
          gg += S.rect(x(0), cy - 9, x(src.ya[k]) - x(0), 18, 'nf s-mut dash2', 2) + S.rect(x(0), cy - 7, x(src.cur[k]) - x(0), 14, 'f-info g', 2);
          gg += S.text(W - (compact ? 58 : 76), cy + 4.5, Bn(src.cur[k]), (compact ? 'sm' : 'md') + ' mono b ink', 'end');
          gg += S.text(W - 4, cy + 4.5, SP(yo), (compact ? 'sm' : 'md') + ' mono b ' + (yo >= 0 ? 'up' : 'dn'), 'end');
          s += gg + '</g>';
        });
        H = top + keys.length * rowH + 4;
      }
      mixFig.innerHTML = wrapI(W, H, mode === 'ps' ? `Apple sales ${Bn(ai.revenue)} split into products and services, and the gross profit each kept` : `Apple ${mode === 'cat' ? 'sales by product category' : 'sales by region'}, June 2026 quarter vs a year earlier`, s, mixAnim && !SML.reduced() ? 'rci-grow' : '');
      mixAnim = false;
      mixMsg(mode);
    }
    function mixMsg(mode) {
      let h;
      if (mode === 'ps') {
        if (mixSel === 'prod') h = ui.msg('info', 'Products', `${Bn(ai.prodSales)} of sales (${SP(pc(ai.prodSales, ay.prodSales))}) kept ${Bn(D.prodGP)} of gross profit: ${P(D.prodGM)} per dollar. iPhone, Mac, iPad and wearables. Rising memory chip costs pressure this margin.`);
        else if (mixSel === 'serv') h = ui.msg('vio', 'Services', `${Bn(ai.servSales)} of sales (${SP(pc(ai.servSales, ay.servSales))}) kept ${Bn(D.servGP)}: ${P(D.servGM)} per dollar. Analysts expected about ${Bn(EXA.services)}, so Services came in a little light.`);
        else h = ui.msg('vio', 'Mix', `Services were ${P(D.servRevShare)} of sales but ${P(D.servGPShare)} of gross profit: each Services dollar keeps ${cents(D.servGM)} vs ${cents(D.prodGM)} for products. That is why investors watch Services so closely.`);
      } else {
        const src = mode === 'cat' ? A.categories : A.regions, keys = Object.keys(src.cur), dsc = mode === 'cat' ? CATS : REGS;
        if (mixSel && src.cur[mixSel] != null) {
          const k = mixSel, yo = pc(src.cur[k], src.ya[k]);
          h = ui.msg(yo >= 0 ? 'up' : 'dn', esc(SHORTNAME[k] || k), `${Bn(src.cur[k])}, ${SP(yo)} from ${Bn(src.ya[k])}; ${P((src.cur[k] / ai.revenue) * 100)} of Apple’s sales. ${dsc[k] || ''}`);
        } else if (mode === 'cat') {
          const by = keys.slice().sort((a, b) => pc(src.cur[b], src.ya[b]) - pc(src.cur[a], src.ya[a])), fast = by[0], slow = by[by.length - 1];
          h = ui.msg('info', 'Categories', `iPhone was ${P((src.cur.iPhone / ai.revenue) * 100)} of sales and grew ${P(pc(src.cur.iPhone, src.ya.iPhone))}. ${fast} grew fastest (${SP(pc(src.cur[fast], src.ya[fast]))}); ${slow} ${pc(src.cur[slow], src.ya[slow]) < 0 ? 'was the only one that shrank' : 'grew slowest'} (${SP(pc(src.cur[slow], src.ya[slow]))}). Tap a bar for details.`);
        } else {
          const by = keys.slice().sort((a, b) => pc(src.cur[b], src.ya[b]) - pc(src.cur[a], src.ya[a])), big = keys.slice().sort((a, b) => src.cur[b] - src.cur[a])[0];
          h = ui.msg('info', 'Regions', `Apple’s official segments are these regions. ${by[0]} (${SP(pc(src.cur[by[0]], src.ya[by[0]]))}) and ${by[1]} (${SP(pc(src.cur[by[1]], src.ya[by[1]]))}) grew fastest; the ${big}, the biggest, grew ${P(pc(src.cur[big], src.ya[big]))}. Tap a bar for details.`);
        }
      }
      $id(id + '-msg2').innerHTML = h;
    }

    function renderAll() { drawMain(); }
    function renderCard() { $id(id + '-card').innerHTML = cardFor(sel); }

    const pick = (k, focus) => { sel = k; renderAll(); renderCard(); if (focus) { const g = fig.querySelector(`[data-k="${k}"]`); if (g) g.focus({ preventScroll: true }); } };
    const pickMix = (k, focus) => { mixSel = mixSel === k ? null : k; drawMix(); if (focus) { const g = mixFig.querySelector(`[data-m="${CSS.escape(k)}"]`); if (g) g.focus({ preventScroll: true }); } };
    fig.addEventListener('click', (e) => { const g = e.target.closest('[data-k]'); if (g && fig.contains(g)) pick(g.dataset.k, true); });
    fig.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest('[data-k]'); if (g) { e.preventDefault(); pick(g.dataset.k, true); } });
    mixFig.addEventListener('click', (e) => { const g = e.target.closest('[data-m]'); if (g && mixFig.contains(g)) pickMix(g.dataset.m, true); });
    mixFig.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest('[data-m]'); if (g) { e.preventDefault(); pickMix(g.dataset.m, true); } });

    let mixAnim = true;
    cur = vec(wModel('cur', false), 'usd');
    ui.responsive(fig, (W) => { lastW = W; renderAll(); drawMix(); });
    renderCard(); stats();
  };

  /* ======================================================================
     Widget 3: statementExplorer ★ (Apple / SpaceX × income / balance / cash flow)
     ====================================================================== */
  const CO = { apple: 'Apple', spacex: 'SpaceX' };
  const AISK = { msCur: 'ms', msNon: 'ms', debtCur: 'debt', debtNon: 'debt' };
  const XBSK = { pre: 'oca', oa: 'onca', defrevCur: 'defrev', defrevNon: 'defrev', debtCur: 'debt', debtNon: 'debt', accr: 'ocl', ol: 'oncl', stock: 'parStock' };
  const CFK = { ni: 'cfNi', da: 'cfDa', sbc: 'cfSbc', oth: 'cfOth', ar: 'cfAr', vendor: 'cfVendor', inv: 'cfInv', oa: 'cfOa', ap: 'cfAp', ol: 'cfOl' };
  const CFKI = { buyMs: 'cfMs', matMs: 'cfMs', sellMs: 'cfMs', capex: 'capex', oth: 'cfOthInv' };
  const CFKF = { taxes: 'cfTaxes', div: 'cfDiv', buyback: 'cfBuyback', issue: 'cfIssue', repay: 'cfRepay', cp: 'cfCp', oth: 'cfOthFin' };

  function modelIS(co, ck) {
    if (co === 'apple') {
      const c = ai, p = A.is[ck], R = (id, l, kind, o) => Object.assign({ id, l, k: id, kind: kind || 'm', cur: c[id], cmp: p[id] }, o);
      return {
        cols: [A.labels.cur, A.labels[ck]], unit: '$ millions, except per-share figures; shares in millions',
        sections: [
          { h: 'Net sales', rows: [R('prodSales', 'Products', 'm', { sub: 1, good: 1 }), R('servSales', 'Services', 'm', { sub: 1, good: 1 }), R('revenue', 'Total net sales', 'm', { tot: 1, good: 1 })] },
          { h: 'Cost of sales', rows: [R('prodCost', 'Products', 'm', { sub: 1 }), R('servCost', 'Services', 'm', { sub: 1 }), R('cost', 'Total cost of sales', 'm', { tot: 1 })] },
          { rows: [R('gross', 'Gross margin (gross profit)', 'm', { tot: 1, good: 1 }), { id: 'gm', k: 'gm', l: 'Gross margin %', kind: 'pct', cur: D.gm, cmp: (p.gross / p.revenue) * 100, calc: 1, good: 1 }] },
          { h: 'Operating expenses', rows: [R('rd', 'Research and development', 'm', { sub: 1 }), R('sga', 'Selling, general and administrative', 'm', { sub: 1 }), R('opex', 'Total operating expenses', 'm', { tot: 1 })] },
          { rows: [R('opInc', 'Operating income', 'm', { tot: 1, good: 1 }), { id: 'opm', k: 'opm', l: 'Operating margin %', kind: 'pct', cur: D.om, cmp: (p.opInc / p.revenue) * 100, calc: 1, good: 1 }] },
          { h: 'Below the operating line', rows: [R('other', 'Other income/(expense), net', 'm', { good: 1 }), R('pretax', 'Income before taxes', 'm', { tot: 1, good: 1 }), R('tax', 'Provision for income taxes'), { id: 'taxRate', k: 'taxRate', l: 'Effective tax rate', kind: 'pct', cur: D.tax, cmp: (p.tax / p.pretax) * 100, calc: 1 }, R('netInc', 'Net income', 'm', { tot: 1, good: 1 }), { id: 'nm', k: 'nm', l: 'Net margin %', kind: 'pct', cur: D.nm, cmp: (p.netInc / p.revenue) * 100, calc: 1, good: 1 }] },
          { h: 'Per share', rows: [R('epsBasic', 'Basic EPS', 'eps', { good: 1 }), R('epsDil', 'Diluted EPS', 'eps', { tot: 1, good: 1 }), R('shBasic', 'Shares used: basic', 'sh'), R('shDil', 'Shares used: diluted', 'sh')] },
        ],
      };
    }
    const c = xi, p = X.is[ck], has = (v) => (v == null ? null : v);
    const R = (id, l, kind, o) => Object.assign({ id, l, k: id, kind: kind || 'm', cur: c[id], cmp: has(p[id]) }, o);
    const segRows = (key, k) => X.segments.cur.map((g) => { const y = (X.segments[ck] || []).find((z) => z.k === g.k); return { id: key + '.' + g.k, l: SEGT[g.k], k, seg: g.k, kind: 'm', cur: g[key], cmp: y ? y[key] : null, sub: 1, good: 1, ng: key === 'ebitda' }; });
    const Y = X.is.ytd;
    return {
      cols: [X.labels.cur, X.labels[ck]], unit: '$ millions, except per-share figures; shares in millions',
      sections: [
        { rows: [R('revenue', 'Revenue', 'm', { tot: 1, good: 1 }), R('cost', 'Cost of revenue'), R('gross', 'Gross profit', 'm', { tot: 1, good: 1 }), { id: 'gm', k: 'gm', l: 'Gross margin %', kind: 'pct', cur: D.xGm, cmp: p.gross != null ? (p.gross / p.revenue) * 100 : null, calc: 1, good: 1 }] },
        { h: 'Operating expenses', rows: [R('rd', 'Research and development', 'm', { sub: 1 }), R('sga', 'Selling, general and administrative', 'm', { sub: 1 }), R('restructuring', 'Restructuring', 'm', { sub: 1 }), R('impairment', 'Impairment', 'm', { sub: 1 }), { id: 'opex', k: 'opex', l: 'Total operating expenses', kind: 'm', cur: xOpex(c), cmp: p.rd != null ? xOpex(p) : null, tot: 1 }] },
        { rows: [R('opInc', 'Income (loss) from operations', 'm', { tot: 1, good: 1, k: c.opInc < 0 ? 'oploss' : 'opInc' }), { id: 'opm', k: 'opm', l: 'Operating margin %', kind: 'pct', cur: D.xOm, cmp: (p.opInc / p.revenue) * 100, calc: 1, good: 1 }] },
        { h: 'Below the operating line', rows: [R('intExp', 'Interest expense'), R('intInc', 'Interest income', 'm', { good: 1 }), R('other', 'Other income (expense), net', 'm', { good: 1 }), R('pretax', 'Income (loss) before income taxes', 'm', { tot: 1, good: 1 }), R('tax', 'Provision for (benefit from) income taxes'), R('netInc', 'Net income (loss)', 'm', { tot: 1, good: 1, k: c.netInc < 0 ? 'netloss' : 'netInc' }), { id: 'nm', k: 'nm', l: 'Net margin %', kind: 'pct', cur: D.xNm, cmp: (p.netInc / p.revenue) * 100, calc: 1, good: 1 }] },
        { h: 'Per share', rows: [R('epsBasic', 'Basic EPS', 'eps', { good: 1 }), R('eps', 'Diluted EPS', 'eps', { tot: 1, good: 1, k: 'epsDil' }), R('shBasic', 'Shares used: basic', 'sh'), R('sh', 'Shares used: diluted', 'sh', { k: 'xSh' })] },
        { h: 'Segments: revenue', rows: segRows('revenue', 'segRev') },
        { h: 'Segments: operating income (loss)', rows: segRows('opInc', 'segOp') },
        { h: 'Non-GAAP, as defined by SpaceX', rows: [{ id: 'adjEbitda', k: 'adjEbitda', l: 'Adjusted EBITDA', kind: 'm', cur: X.ebitda.cur, cmp: X.ebitda[ck], tot: 1, good: 1, ng: 1 }, { id: 'adjM', k: 'adjEbitdaM', l: 'Adjusted EBITDA margin %', kind: 'pct', cur: D.xEbitdaM, cmp: X.ebitda[ck] != null ? (X.ebitda[ck] / p.revenue) * 100 : null, calc: 1, good: 1, ng: 1 }].concat(segRows('ebitda', 'segEbitda')) },
        { h: 'Nine months to September 30', cols: [Y.label.replace('9 months to ', '9 mo to '), '9 mo to Sep 2025'], rows: [
          { id: 'ytdRev', noNote: 1, k: 'revenue', l: 'Revenue', kind: 'm', cur: Y.revenue, cmp: Y.ya.revenue, good: 1 },
          { id: 'ytdOp', noNote: 1, k: Y.opInc < 0 ? 'oploss' : 'opInc', l: 'Income (loss) from operations', kind: 'm', cur: Y.opInc, cmp: Y.ya.opInc, good: 1 },
          { id: 'ytdNet', noNote: 1, k: Y.netInc < 0 ? 'netloss' : 'netInc', l: 'Net income (loss)', kind: 'm', cur: Y.netInc, cmp: Y.ya.netInc, good: 1 },
          { id: 'ytdEps', noNote: 1, k: 'epsDil', l: 'EPS', kind: 'eps', cur: Y.eps, cmp: Y.ya.eps, good: 1 }] },
      ],
    };
  }

  function modelBS(co, bk) {
    const B = co === 'apple' ? aB : xB, map = co === 'apple' ? AISK : XBSK, T = B.totals;
    bk = co === 'spacex' && bk === 'mid' ? 'mid' : 'prev';
    const ti = bk === 'mid' ? 2 : 1, tv = (arr) => [arr[0], arr[ti]];
    const item = (r, o) => Object.assign({ id: r.k, k: map[r.k] || r.k, l: r.name, kind: 'm', cur: r.cur, cmp: r[bk], sub: 1 }, o);
    const tot = (id, l, v, good) => ({ id, k: id, l, kind: 'm', cur: v[0], cmp: v[1], tot: 1, good: good ? 1 : 0 });
    const secs = [
      { h: 'Current assets', rows: B.assets.filter((r) => r.current).map((r) => item(r, { good: r.k === 'cash' ? 1 : 0 })).concat([tot('tCA', 'Total current assets', tv(T.currentAssets))]) },
      { h: 'Non-current assets', rows: B.assets.filter((r) => !r.current).map((r) => item(r)).concat([tot('tA', 'Total assets', tv(T.assets))]) },
      { h: 'Current liabilities', rows: B.liabilities.filter((r) => r.current).map((r) => item(r)).concat([tot('tCL', 'Total current liabilities', tv(T.currentLiab))]) },
      { h: 'Non-current liabilities', rows: B.liabilities.filter((r) => !r.current).map((r) => item(r)).concat([tot('tL', 'Total liabilities', tv(T.liabilities))]) },
    ];
    let mez = [0, 0];
    if (B.mezzanine) { mez = [sum(B.mezzanine, (r) => r.cur), sum(B.mezzanine, (r) => r[bk])]; secs.push({ h: 'Between debt and equity', rows: B.mezzanine.map((r) => item(r, { sub: 0 })) }); }
    secs.push({ h: 'Shareholders’ equity', rows: B.equity.map((r) => item(r, { good: r.k === 're' || r.k === 'deficit' ? 1 : 0 })).concat([tot('tE', 'Total shareholders’ equity', tv(T.equity), 1)]) });
    secs.push({ rows: [{ id: 'tLE', k: 'tLE', l: B.mezzanine ? 'Total liabilities, preferred stock and equity' : 'Total liabilities and equity', kind: 'm', cur: T.liabilities[0] + mez[0] + T.equity[0], cmp: T.liabilities[ti] + mez[1] + T.equity[ti], tot: 1 }] });
    const cm = co === 'apple' ? [D.aCashMs('cur'), D.aCashMs('prev')] : [D.xCashMs('cur'), D.xCashMs(bk)];
    const db = co === 'apple' ? [D.aDebt('cur'), D.aDebt('prev')] : [D.xDebt('cur'), D.xDebt(bk)];
    const key = [
      { id: 'cashMs', k: 'cashMs', l: 'Cash and marketable securities', kind: 'm', cur: cm[0], cmp: cm[1], calc: 1, good: 1 },
      { id: 'debtTot', k: 'debtTot', l: co === 'apple' ? 'Total debt (commercial paper + term debt)' : 'Total debt and finance leases', kind: 'm', cur: db[0], cmp: db[1], calc: 1 },
      { id: 'netCash', k: 'netCash', l: 'Net cash (cash and securities − debt)', kind: 'm', cur: cm[0] - db[0], cmp: cm[1] - db[1], calc: 1, tot: 1, good: 1 },
      { id: 'curRatio', k: 'curRatio', l: 'Current ratio', kind: 'x', cur: T.currentAssets[0] / T.currentLiab[0], cmp: T.currentAssets[ti] / T.currentLiab[ti], calc: 1, good: 1 },
      { id: 'de', k: 'de', l: 'Debt to equity', kind: 'x', cur: db[0] / T.equity[0], cmp: db[1] / T.equity[ti], calc: 1 },
    ];
    if (co === 'apple') key.push({ id: 'bvps', k: 'bvps', l: 'Book value per share (≈, quarter’s basic shares)', kind: 'eps', cur: D.aBvps, cmp: null, calc: 1, good: 1 });
    secs.push({ h: 'Key figures, computed by FiredBunny', rows: key });
    return { cols: [B.labels.cur, B.labels[bk]], unit: '$ millions', sections: secs };
  }

  function modelCF(co) {
    if (co === 'apple') {
      const C = aCF, T = C.totals, it = (r, map, o) => Object.assign({ id: 'cf.' + r.k + (map === CFKI ? '.i' : map === CFKF ? '.f' : ''), k: map[r.k], l: r.name, kind: 'm', cur: r.cur, cmp: r.ya, sub: 1 }, o);
      return {
        cols: [C.labels.cur, C.labels.ya], unit: '$ millions',
        sections: [
          { h: 'Operating activities', rows: C.operating.map((r) => it(r, CFK, r.k === 'ni' ? { good: 1, sub: 0 } : {})).concat([{ id: 'tOp', k: 'cfOp', l: 'Cash generated by operating activities', kind: 'm', cur: T.operating[0], cmp: T.operating[1], tot: 1, good: 1 }]) },
          { h: 'Investing activities', rows: C.investing.map((r) => it(r, CFKI)).concat([{ id: 'tInv', k: 'cfInvTot', l: 'Cash from (used in) investing', kind: 'm', cur: T.investing[0], cmp: T.investing[1], tot: 1 }]) },
          { h: 'Financing activities', rows: C.financing.map((r) => it(r, CFKF)).concat([{ id: 'tFin', k: 'cfFinTot', l: 'Cash used in financing', kind: 'm', cur: T.financing[0], cmp: T.financing[1], tot: 1 }]) },
          { h: 'Cash', rows: [{ id: 'chg', k: 'chg', l: 'Increase in cash', kind: 'm', cur: T.change[0], cmp: T.change[1], tot: 1, good: 1 }, { id: 'beg', k: 'beg', l: 'Cash at the start', kind: 'm', cur: T.begin[0], cmp: T.begin[1], sub: 1 }, { id: 'end', k: 'end', l: 'Cash at the end', kind: 'm', cur: T.end[0], cmp: T.end[1], sub: 1 }] },
          { h: 'Computed and supplemental', rows: [{ id: 'fcf', k: 'fcf', l: 'Free cash flow (operating cash − capex)', kind: 'm', cur: D.aFcf[0], cmp: D.aFcf[1], calc: 1, tot: 1, good: 1 }, { id: 'cashTaxes', k: 'cashTaxes', l: 'Cash paid for income taxes', kind: 'm', cur: C.cashTaxes[0], cmp: C.cashTaxes[1] }] },
        ],
      };
    }
    const C = X.cf9, segY = (k) => XSEG(k, 'ya');
    return {
      cols: ['9 months to Sep 2026', '9 months to Sep 2025'], unit: '$ millions',
      sections: [
        { h: 'Nine months to September 30 (totals as published)', rows: [
          { id: 'x9op', k: 'cfOp', l: 'Operating cash flow', kind: 'm', cur: C.operating[0], cmp: C.operating[1], tot: 1, good: 1 },
          { id: 'x9inv', k: 'cfInvTot', l: 'Investing cash flow', kind: 'm', cur: C.investing[0], cmp: C.investing[1] },
          { id: 'x9capex', k: 'capex', l: 'of which capex (property, plant and equipment)', kind: 'm', cur: C.ppe[0], cmp: C.ppe[1], sub: 1 },
          { id: 'x9fin', k: 'cfFinTot', l: 'Financing cash flow', kind: 'm', cur: C.financing[0], cmp: C.financing[1] },
          { id: 'x9ipo', k: 'cfFinTot', l: 'of which IPO proceeds, net', kind: 'm', cur: C.ipoProceeds, cmp: null, sub: 1 },
          { id: 'x9chg', k: 'chg', l: 'Change in cash', kind: 'm', cur: C.change[0], cmp: C.change[1], tot: 1 },
          { id: 'x9end', k: 'end', l: 'Cash at the end (incl. restricted cash)', kind: 'm', cur: C.endCash[0], cmp: C.endCash[1], sub: 1 },
          { id: 'fcf', k: 'fcf', l: 'Free cash flow (operating cash − capex)', kind: 'm', cur: D.xFcf9[0], cmp: D.xFcf9[1], calc: 1, tot: 1, good: 1 }] },
        { h: 'Capex by quarter', cols: [X.labels.cur, X.labels.ya], rows: [
          { id: 'xcq', k: 'capexQ', l: 'Total capex', kind: 'm', cur: X.capex.cur, cmp: X.capex.ya, tot: 1 }].concat(X.segments.cur.map((g) => ({ id: 'xcq.' + g.k, k: 'capexQ', seg: g.k, l: SEGT[g.k], kind: 'm', cur: g.capex, cmp: segY(g.k).capex, sub: 1 }))) },
        { h: 'Capex in earlier 2026 quarters', cols: ['Amount', ''], noCmp: 1, rows: [{ id: 'xcq2', k: 'capexQ', l: 'June 2026 quarter', kind: 'm', cur: X.capex.pq, cmp: null }, { id: 'xcq1', k: 'capexQ', l: 'March 2026 quarter', kind: 'm', cur: X.capex.pq2, cmp: null }] },
      ],
    };
  }

  const cellV = (v, kind) => {
    if (v == null || !isFinite(v)) return '<span title="not reported for this period">n/a</span>';
    if (kind === 'eps') return E$(v);
    if (kind === 'sh') return F.num(v, 1);
    if (kind === 'pct') return P(v);
    if (kind === 'x') return F.num(v, 2) + '×';
    return F.num(v, 0);
  };
  function chg(r) {
    const a = r.cur, b = r.cmp;
    if (a == null || b == null || !isFinite(a) || !isFinite(b)) return { t: '', c: 'na' };
    const d = a - b, dir = d > 0 ? 1 : d < 0 ? -1 : 0, c = r.good ? (dir > 0 ? 'up' : dir < 0 ? 'dn' : '') : '';
    if (r.kind === 'pct') return { t: sgn(d, (v) => F.num(v, 1)) + ' pts', c };
    if (r.kind === 'x') return { t: sgn(d, (v) => F.num(v, 2)), c };
    const sp = (x) => SP(x, Math.abs(x) < 0.1 ? 2 : 1);
    if (r.kind === 'sh') return { t: sp(pc(a, b)), c };
    if (r.kind === 'eps') return a > 0 && b > 0 ? { t: sp(pc(a, b)), c } : { t: sgn(d, E$), c };
    if (b !== 0 && Math.sign(a) === Math.sign(b) && !(r.good && a < 0)) return { t: sp(pc(Math.abs(a), Math.abs(b))), c };
    return { t: sgn(d, (v) => F.num(v, 0)), c };
  }
  const cardV = (v, kind) => (v == null || !isFinite(v) ? 'n/a' : kind === 'm' ? BM(v) : cellV(v, kind));
  function chgWords(r) {
    const a = r.cur, b = r.cmp; if (a == null || b == null || !isFinite(a) || !isFinite(b) || a === b) return '';
    const c = chg(r).t; if (!c) return '';
    return r.kind === 'm' && c.indexOf('%') < 0 ? ` (${sgn(a - b, BM)})` : ` (${c})`;
  }

  /* company notes for the "At Apple / At SpaceX" row */
  const NOTE = {
    'apple.revenue': () => `Apple called it its strongest June quarter ever. Analysts expected about ${Bn(EXA.revenue[0])}–${Bn(EXA.revenue[1])}.`,
    'apple.servSales': () => `Services were ${P(D.servRevShare)} of sales but ${P(D.servGPShare)} of gross profit.`,
    'apple.gross': () => `Apple said tariff refunds added about ${TR.grossMarginPts} points of gross margin; without them, about ${P(D.gmEx, 0)}.`,
    'apple.gm': () => `About ${TR.grossMarginPts} points came from temporary tariff refunds. September-quarter guide: ${G.grossMargin[0]}%–${G.grossMargin[1]}%.`,
    'apple.opex': () => `September-quarter guide: ${Bn(G.opex[0])}–${Bn(G.opex[1])}.`,
    'apple.other': () => `September-quarter guide: about ${M(G.otherIncome)}.`,
    'apple.tax': () => `A ${P(D.tax)} rate vs ${P(D.taxYa)} a year earlier. September-quarter guide: about ${G.taxRate}%.`,
    'apple.epsDil': () => `Includes ${E$(TR.eps)} from tariff refunds (about ${E$(D.ref.eps)} without). Analysts expected about ${E$(EXA.eps[0])}–${E$(EXA.eps[1])}.`,
    'apple.shBasic': () => `Buybacks cut it ${P(-pc(ai.shBasic, ay.shBasic))} in a year.`,
    'apple.shDil': () => `Buybacks cut it ${P(-D.shYoY)} in a year, so EPS grew ${P(D.epsYoY)} vs net income ${P(D.niYoY)}.`,
    'apple.inv': () => 'Nearly doubled in nine months.',
    'apple.re': () => `Flipped from ${Bn(bsv(aB.equity, 're', 'prev'))} to ${Bn(bsv(aB.equity, 're', 'cur'))}: nine months of profit outran buybacks and dividends.`,
    'apple.tE': () => `Up ${Bn(aB.totals.equity[0] - aB.totals.equity[1])} in nine months.`,
    'apple.netCash': () => 'Apple could repay every loan and still hold tens of billions.',
    'apple.cf.buyback.f': () => `On the call Apple said it returned about ${Bn(A.call.quarterReturn.total, 0)} to shareholders in the June quarter alone.`,
    'apple.cf.capex.i': () => 'Small next to Apple’s operating cash, which is why its free cash flow is so large.',
    'apple.fcf': () => `Then ${Bn(-bsv(aCF.financing, 'buyback', 'cur'))} of buybacks and ${Bn(-bsv(aCF.financing, 'div', 'cur'))} of dividends.`,
    'spacex.revenue': () => `Analysts expected about ${Bn(EXX.revenue[0], 2)}–${Bn(EXX.revenue[1], 2)}. Super Intelligence brought in ${Bn(XSEG('ai').revenue)}, including ${M(X.segments.notes.cursorRevenue)} from Cursor (bought ${X.segments.notes.cursorClosed}).`,
    'spacex.opInc': () => `${segOpTxt()}.`,
    'spacex.netInc': () => `About ${Bn(D.xBelow)} came from below the operating line: other income ${M(X.belowTheLine.other)} (including ${M(X.belowTheLine.otherRelatedParty)} from a related party, per TIKR), net interest ${M(X.belowTheLine.netInterest)} and a ${M(X.belowTheLine.taxBenefit)} tax benefit. Nine months to September: ${M(X.is.ytd.netInc)}.`,
    'spacex.eps': () => `Analysts expected about ${E$(EXX.eps[0])}–${E$(EXX.eps[1])}.`,
    'spacex.sh': () => `Shares outstanding jumped with the preferred conversion, the IPO and other share issuance (Class A ${F.num(X.bs.sharesOutstanding.classA[1])}M → ${F.num(X.bs.sharesOutstanding.classA[0])}M, Class B ${F.num(X.bs.sharesOutstanding.classB[1])}M → ${F.num(X.bs.sharesOutstanding.classB[0])}M since December 31). The release does not break down the change in the weighted average.`,
    'spacex.tax': () => `A negative number is a tax benefit: it added ${M(-xi.tax)} to profit this quarter.`,
    'spacex.other': () => `Includes ${M(X.belowTheLine.otherRelatedParty)} from a related party (per TIKR). Gains like these may not recur.`,
    'spacex.adjEbitda': () => `It adds back ${Bn(XBR('Depreciation & amortization'))} of depreciation, ${Bn(XBR('Stock-based compensation'))} of stock pay and ${Bn(XBR('Acquisition-related stock compensation'))} of Cursor-related stock pay, and takes out other income and the tax benefit.`,
    'spacex.cash': () => `It was ${Bn(bsv(xB.assets, 'cash', 'mid'))} on ${xB.labels.mid}, just after the IPO, while marketable securities grew to ${Bn(bsv(xB.assets, 'ms', 'cur'))}.`,
    'spacex.ms': () => `Zero in December, ${Bn(bsv(xB.assets, 'ms', 'mid'))} in June, ${Bn(bsv(xB.assets, 'ms', 'cur'))} in September.`,
    'spacex.ppe': () => 'Up sharply as SpaceX built computing capacity.',
    'spacex.gw': () => `Jumped from ${Bn(bsv(xB.assets, 'gw', 'prev'))} to ${Bn(bsv(xB.assets, 'gw', 'cur'))} with the Cursor acquisition, which closed ${X.segments.notes.cursorClosed}.`,
    'spacex.pref': () => 'All of it converted into common stock at the June IPO.',
    'spacex.apic': () => 'The IPO, the preferred conversion and other share issuance poured into this line.',
    'spacex.deficit': () => `Barely changed since December: the nine-month result was ${M(X.is.ytd.netInc)} (Q1 ${M(X.is.pq2.netInc)}, Q2 ${M(xp.netInc)}, Q3 ${sgn(xi.netInc, M)}).`,
    'spacex.tE': () => `From ${Bn(xB.totals.equity[1])} at the end of 2025 to ${Bn(xB.totals.equity[0])}: the IPO, the preferred conversion and other share issuance.`,
    'spacex.netCash': () => 'Positive thanks to the IPO cash, even after new borrowing and heavy capex.',
    'spacex.defrevCur': () => `Deferred revenue is part of a ${Bn(X.metrics.backlog, 0)} backlog, about ${Bn(X.metrics.backlogNext12m, 0)} of it expected within a year.`,
    'spacex.defrevNon': () => `Deferred revenue is part of a ${Bn(X.metrics.backlog, 0)} backlog, about ${Bn(X.metrics.backlogNext12m, 0)} of it expected within a year.`,
    'spacex.fcf': () => `Q3 capex alone was ${Bn(X.capex.cur)}, ${F.num(X.capex.cur / xi.revenue, 1)}× the quarter’s revenue, and SpaceX guided ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)} for Q4.`,
    'spacex.xcq': () => `Capex was ${Bn(X.capex.pq)} in the June quarter and ${Bn(X.capex.pq2)} in the March quarter.`,
    'spacex.x9fin': () => `Includes ${Bn(X.cf9.ipoProceeds)} of IPO proceeds.`,
  };

  SML.widgets.statementExplorer = function (root, opts) {
    opts = opts || {};
    const id = SML.uid('rcx'), pid = id + '-hz';
    let co = opts.company === 'spacex' ? 'spacex' : 'apple';
    let stt = ['income', 'balance', 'cash'].indexOf(opts.statement) >= 0 ? opts.statement : 'income';
    let ck = opts.compare === 'pq' ? 'pq' : 'ya', bk = opts.compareBalance === 'mid' ? 'mid' : 'prev';
    let open = opts.open === undefined ? (stt === 'income' ? 'revenue' : stt === 'balance' ? 'tE' : co === 'apple' ? 'fcf' : 'fcf') : opts.open, lastW = 600;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-c', [{ v: 'apple', label: 'Apple' }, { v: 'spacex', label: 'SpaceX' }], co, 'Company')}${ui.seg(id + '-s', [{ v: 'income', label: 'Income' }, { v: 'balance', label: 'Balance sheet' }, { v: 'cash', label: 'Cash flow' }], stt, 'Statement')}<span class="grow"></span><span id="${id}-kw">${ui.seg(id + '-k', [{ v: 'ya', label: 'vs year ago' }, { v: 'pq', label: 'vs prior qtr' }], ck, 'Compare with')}</span><span id="${id}-bw">${ui.seg(id + '-b', [{ v: 'prev', label: 'vs ' + xB.labels.prev }, { v: 'mid', label: 'vs ' + xB.labels.mid }], bk, 'Compare balance sheet with')}</span></div>
      <div class="rci-xh" id="${id}-h"></div>
      <div class="wg-fig"></div>
      <div class="rci-tw" id="${id}-t"></div>
      <div class="wg-read" id="${id}-rd"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-nt"></div>`;
    const fig = root.querySelector('.wg-fig'), tw = $id(id + '-t');
    const st = ui.wire(root, () => {
      const c2 = st.seg(id + '-c') || co, s2 = st.seg(id + '-s') || stt, k2 = st.seg(id + '-k') || ck, b2 = st.seg(id + '-b') || bk;
      if (c2 !== co || s2 !== stt) open = null;
      co = c2; stt = s2; ck = k2; bk = b2; renderAll();
    });
    const model = () => (stt === 'income' ? modelIS(co, ck) : stt === 'balance' ? modelBS(co, bk) : modelCF(co));
    const coName = () => CO[co];

    function cardFor(r, cols) {
      const T = td(r.k, co);
      let real = `${cols[0]}: <b>${cardV(r.cur, r.kind)}</b>`;
      if (r.cmp != null && isFinite(r.cmp)) real += `; ${cols[1]}: ${cardV(r.cmp, r.kind)}${chgWords(r)}`;
      real += '.';
      if (r.calc) real += ' Computed by FiredBunny from the reported lines.';
      if (r.ng) real += ' Non-GAAP: SpaceX’s own measure.';
      const nf = NOTE[co + '.' + r.id] || (r.noNote ? null : NOTE[co + '.' + r.k]);
      if (nf) real += ' ' + nf();
      if (r.seg) real = `<b>${SEGS[r.seg]}</b>. ` + real;
      return card({ n: T.n, aka: T.aka }, [
        { c: 'what', h: 'What it is', b: T.what },
        { c: 'hop', h: 'At Hoppy’s cart', b: T.hop },
        { c: 'real', h: 'At ' + coName(), b: real },
        { c: 'stock', h: 'Why it matters for the stock', b: T.why },
      ]);
    }

    function tableHTML(m, compact) {
      const H = compact ? ['Line', 'Now', 'Then', 'Chg'] : ['Line · tap for meaning', m.cols[0], m.cols[1], 'Change'];
      let h = `<table class="rci-t"><thead><tr><th scope="col">${H[0]}</th><th scope="col">${compact ? esc2(m.cols[0]) : H[1]}</th><th scope="col">${compact ? esc2(m.cols[1]) : H[2]}</th><th scope="col">${H[3]}</th></tr></thead><tbody>`;
      m.sections.forEach((sec) => {
        if (sec.h) h += sec.cols ? `<tr class="sec"><th scope="rowgroup">${sec.h}</th><th class="num">${sec.cols[0]}</th><th class="num">${sec.cols[1]}</th><th></th></tr>` : `<tr class="sec"><th scope="rowgroup" colspan="4">${sec.h}</th></tr>`;
        sec.rows.forEach((r) => {
          const on = open === r.id, c = sec.noCmp ? { t: '', c: '' } : chg(r);
          h += `<tr class="row${r.tot ? ' tot' : ''}${r.sub ? ' sub' : ''}${r.calc ? ' calc' : ''}${on ? ' on' : ''}" data-row="${r.id}"><th scope="row"><button type="button" class="rci-ln" data-r="${r.id}" aria-expanded="${on}">${r.l}</button>${r.ng ? '<span class="rci-tag">non-GAAP</span>' : ''}</th><td class="${r.cur == null ? 'na' : ''}">${cellV(r.cur, r.kind)}</td><td class="${r.cmp == null ? 'na' : ''}">${sec.noCmp ? '' : cellV(r.cmp, r.kind)}</td><td class="${c.c}">${c.t}</td></tr>`;
          if (on) h += `<tr class="det"><td colspan="4">${cardFor(r, sec.cols || m.cols)}</td></tr>`;
        });
      });
      return h + '</tbody></table>';
    }
    const esc2 = (s) => s.replace(/ qtr$/, '').replace(/^6 months to /, '6 mo to ').replace(/^9 months to /, '9 mo to ');

    /* figures */
    function figIncome(W) {
      const compact = W < 520, ins = [], outs = [], r = co === 'apple' ? ai : xi;
      ins.push({ k: 'revenue', l: 'Revenue', v: r.revenue, c: 'info' });
      outs.push({ k: 'cost', l: co === 'apple' ? 'Cost of sales' : 'Cost of revenue', v: r.cost, c: 'dn' }, { k: 'rd', l: 'R&amp;D', v: r.rd, c: 'vio' }, { k: 'sga', l: 'SG&amp;A', v: r.sga, c: 'acc' });
      if (r.restructuring) outs.push({ k: 'restructuring', l: 'Restructuring', v: r.restructuring, c: 'mut' });
      if (r.impairment) outs.push({ k: 'impairment', l: 'Impairment', v: r.impairment, c: 'mut' });
      const no = co === 'apple' ? r.other : xNonOp(r), nk = co === 'apple' ? 'other' : no < 0 ? 'intExp' : 'intInc', nl = co === 'apple' ? (no < 0 ? 'Other expense' : 'Other income') : 'Interest &amp; other';
      if (no < 0) outs.push({ k: nk, l: nl, v: -no, c: 'shade2' }); else if (no > 0) ins.push({ k: nk, l: nl, v: no, c: 'shade2' });
      if (r.tax >= 0) outs.push({ k: 'tax', l: 'Tax', v: r.tax, c: 'mut' }); else ins.push({ k: 'tax', l: 'Tax benefit', v: -r.tax, c: 'mut' });
      if (r.netInc < 0) ins.push({ k: 'netInc', l: 'Net loss', v: -r.netInc, c: 'dn', hatch: 1 }); else outs.push({ k: 'netInc', l: 'Net income', v: r.netInc, c: 'up' });
      const tot = Math.max(sum(ins, (g) => g.v), sum(outs, (g) => g.v));
      const lw = compact ? 0 : 96, x = SML.lin(0, tot, lw, W), bh = 30;
      let s = hatch(pid, 'dn');
      const rowsY = compact ? [18, 82] : [8, 52];
      [[ins, compact ? 'Money in' : 'Money in'], [outs, compact ? 'Where it went' : 'Where it went']].forEach(([list, lab], ri) => {
        const y = rowsY[ri];
        s += compact ? S.text(0, y - 6, lab, 'sm b ink') : S.text(0, y + 20, lab, 'sm b ink');
        let acc = 0;
        list.forEach((g) => {
          const xa = x(acc), w = x(acc + g.v) - xa;
          let gg = `<g class="rci-row${open === g.k ? ' on' : ''}" data-k="${g.k}" tabindex="0" role="button" aria-label="${strip(g.l)} ${M(g.v)}">`;
          gg += g.hatch ? S.rect(xa + 0.5, y, Math.max(1, w - 1), bh, '', 2, ` fill="url(#${pid})"`) + S.rect(xa + 0.5, y, Math.max(1, w - 1), bh, 'nf s-dn w15', 2) : S.rect(xa + 0.5, y, Math.max(1, w - 1), bh, 'f-' + g.c + (open === g.k ? ' s-ink w2' : '') + ' g', 2);
          const lv = g.l + ' ' + BM(g.v), lab2 = w > estW(lv, 11.5) + 14 ? lv : w > estW(g.l, 11.5) + 12 ? g.l : g.hatch && w > 34 ? 'loss' : w > 46 ? P((g.v / (co === 'apple' ? ai.revenue : xi.revenue)) * 100, 0) : '';
          if (lab2) gg += S.text(xa + w / 2, y + 19.5, lab2, 'sm b ' + (g.hatch ? 'dn' : ON[g.c] || 'on'), 'middle');
          s += gg + '</g>';
          acc += g.v;
        });
      });
      /* legend */
      const items = outs.concat(ins.filter((g) => g.k !== 'revenue'));
      const cols = W >= 640 ? 3 : W >= 420 ? 2 : 1, cw = W / cols, ly0 = rowsY[1] + bh + 22;
      const base = co === 'apple' ? ai.revenue : xi.revenue;
      items.forEach((g, i) => {
        const cx = (i % cols) * cw, cy = ly0 + Math.floor(i / cols) * 20;
        let gg = `<g class="rci-row${open === g.k ? ' on' : ''}" data-k="${g.k}">`;
        gg += g.hatch ? S.rect(cx, cy - 9, 11, 11, 'nf s-dn w15', 2) : S.rect(cx, cy - 9, 11, 11, 'f-' + g.c, 2);
        gg += S.text(cx + 17, cy, `${g.l} ${BM(g.v)} · ${P((g.v / base) * 100, 1)}`, 'sm ' + (open === g.k ? 'acc b' : 'ink'));
        s += gg + '</g>';
      });
      const H = ly0 + Math.ceil(items.length / cols) * 20;
      return { H, body: s, label: `${coName()} ${co === 'apple' ? A.labels.cur : X.labels.cur}: where each sales dollar went` };
    }
    function figBalance(W) {
      const B = co === 'apple' ? aB : xB, T = B.totals, compact = W < 520;
      const pers = co === 'spacex' ? [['cur', 0], ['mid', 2], ['prev', 1]] : [['cur', 0], ['prev', 1]];
      const mx = Math.max(...pers.map((q) => T.assets[q[1]])), lw = compact ? 0 : 118, x = SML.lin(0, mx, lw, W - 4), bh = 24;
      let s = '', y = 4;
      pers.forEach(([pk, ti], pi) => {
        const p = pi ? 1 : 0, mez = B.mezzanine ? [0, 0, 0].map(() => sum(B.mezzanine, (r) => r[pk])) : [0, 0, 0];
        s += S.text(0, y + 12, B.labels[pk], 'sm b ' + (p ? 'mut' : 'acc'));
        y += 20;
        const rows = [
          ['Owns', [['tCA', 'Current assets', T.currentAssets[ti], 'info'], ['tA', 'Non-current assets', T.assets[ti] - T.currentAssets[ti], 'info o50']]],
          ['Owes + owners', [['tCL', 'Current liabilities', T.currentLiab[ti], 'dn'], ['tL', 'Long-term liabilities', T.liabilities[ti] - T.currentLiab[ti], 'dn o50']].concat(mez[0] ? [['pref', 'Preferred', mez[0], 'vio']] : []).concat([['tE', 'Equity', T.equity[ti], 'up']])],
        ];
        rows.forEach(([lab, segs]) => {
          if (compact) { s += S.text(0, y + 11, lab, 'xs'); y += 14; } else s += S.text(0, y + 16, lab, 'sm ink');
          let acc = 0;
          segs.forEach(([k, l, v, c]) => {
            const xa = x(acc), w = x(acc + v) - xa;
            let gg = `<g class="rci-row${open === k && !p ? ' on' : ''}" data-k="${k}" tabindex="${p ? -1 : 0}" role="button" aria-label="${l} ${Bn(v)}">`;
            gg += S.rect(xa + 0.5, y, Math.max(1, w - 1), bh, 'f-' + c + (open === k && !p ? ' s-ink w2' : '') + (p ? ' o70' : '') + ' g', 2);
            const t = w > estW(l + ' ' + Bn(v), 11.5) + 10 ? l + ' ' + Bn(v) : w > 50 ? Bn(v) : '';
            if (t) gg += S.text(xa + w / 2, y + 16.5, t, 'sm b ' + (c.indexOf('o50') > 0 ? 'ink' : ON[c] || 'on'), 'middle');
            s += gg + '</g>';
            acc += v;
          });
          y += bh + 6;
        });
        y += 8;
      });
      return { H: y, body: s, label: `${coName()} balance sheet: assets equal liabilities plus equity, ${pers.map((q) => B.labels[q[0]]).join(', ')}` };
    }
    function figCash(W) {
      const compact = W < 520;
      const rows = co === 'apple'
        ? [['tOp', 'Operating', aCF.totals.operating[0], 'info'], ['tInv', 'Investing', aCF.totals.investing[0], 'vio'], ['tFin', 'Financing', aCF.totals.financing[0], 'acc'], ['chg', 'Change in cash', aCF.totals.change[0], 'mut'], ['fcf', 'Free cash flow', D.aFcf[0], 'up']]
        : [['x9op', 'Operating', X.cf9.operating[0], 'info'], ['x9inv', 'Investing', X.cf9.investing[0], 'vio'], ['x9fin', 'Financing', X.cf9.financing[0], 'acc'], ['x9capex', 'Capex', X.cf9.ppe[0], 'dn'], ['fcf', 'Free cash flow', D.xFcf9[0], D.xFcf9[0] < 0 ? 'dn' : 'up']];
      const vals = rows.map((r) => r[2]).concat([0]), lo = Math.min(...vals), hi = Math.max(...vals);
      const lw = compact ? 96 : 130, vw = compact ? 74 : 92, x = SML.lin(lo, hi, lw + 6, W - vw - 8), rowH = 30, top = 22;
      let s = S.text(0, 12, co === 'apple' ? aCF.labels.cur : X.cf9.label, 'sm b acc');
      s += S.line(x(0), top - 4, x(0), top + rows.length * rowH, 's-mut');
      rows.forEach(([k, l, v, c], i) => {
        const y = top + i * rowH, cy = y + rowH / 2, on = open === k;
        let gg = `<g class="rci-row${on ? ' on' : ''}" data-k="${k}" tabindex="0" role="button" aria-label="${l} ${M(v)}">`;
        gg += S.rect(0, y + 1, W, rowH - 2, 'rci-bg' + (on ? ' f-acc-t' : ''), 4);
        if (i === 3) gg += S.line(0, y, W, y, 's-line');
        gg += S.text(6, cy + 4.5, l, (compact ? 'sm' : 'md') + ' ink' + (k === 'fcf' ? ' b' : ''));
        const xa = x(Math.min(0, v)), xb = x(Math.max(0, v));
        gg += S.rect(xa, cy - 8, Math.max(2, xb - xa), 16, 'f-' + c + (v < 0 ? ' gr' : ' g'), 2);
        gg += S.text(W - 4, cy + 4.5, BM(v), (compact ? 'sm' : 'md') + ' mono b ' + (v < 0 ? 'dn' : 'ink'), 'end');
        s += gg + '</g>';
      });
      return { H: top + rows.length * rowH + 4, body: s, label: `${coName()} cash flow: operating, investing, financing and free cash flow` };
    }

    function header() {
      const C = co === 'apple' ? A : X;
      const per = stt === 'balance' ? `as of ${C.bs.labels.cur}, compared with ${C.bs.labels[co === 'spacex' ? bk : 'prev']}` : stt === 'cash' ? (co === 'apple' ? 'nine months to June 27, 2026 (Apple reports cash flow year to date)' : 'nine months to September 30, 2026 (SpaceX reports cash flow year to date)') : `${C.period}${co === 'apple' ? ', April to June 2026' : ', July to September 2026'}, three months ended ${C.periodEnd}`;
      const nm = stt === 'income' ? 'Income statement' : stt === 'balance' ? 'Balance sheet' : 'Cash flow statement';
      const m = model();
      return `<b>${coName()} · ${nm}</b> · latest reported quarter as of October 2026 · ${per} · reported ${C.reported} · <span class="mono">${m.unit}</span> · <a href="${C.sources[0].u}" target="_blank" rel="noopener noreferrer">source</a>`;
    }
    function readHTML() {
      const S2 = (l, v, c) => `<div class="stat${c ? ' ' + c : ''}"><span class="stat-l">${l}</span><span class="stat-v">${v}</span></div>`;
      if (co === 'apple' && stt === 'income') return S2('Gross margin', P(D.gm)) + S2('Operating margin', P(D.om)) + S2('Net margin', P(D.nm)) + S2('Diluted EPS', E$(ai.epsDil), 'hl');
      if (co === 'spacex' && stt === 'income') return S2('Gross margin', P(D.xGm)) + S2('Operating margin', P(D.xOm)) + S2('Adj. EBITDA margin', P(D.xEbitdaM)) + S2('Diluted EPS', E$(xi.eps), 'hl');
      if (co === 'apple' && stt === 'balance') return S2('Net cash', Bn(D.aCashMs('cur') - D.aDebt('cur'))) + S2('Current ratio', F.num(aB.totals.currentAssets[0] / aB.totals.currentLiab[0], 2)) + S2('Debt / equity', F.num(D.aDebt('cur') / aB.totals.equity[0], 2)) + S2('Book value / share', '≈' + E$(D.aBvps), 'hl');
      if (co === 'spacex' && stt === 'balance') return S2('Net cash', Bn(D.xCashMs('cur') - D.xDebt('cur'))) + S2('Current ratio', F.num(xB.totals.currentAssets[0] / xB.totals.currentLiab[0], 2)) + S2('Debt / equity', F.num(D.xDebt('cur') / xB.totals.equity[0], 2)) + S2('Equity', Bn(xB.totals.equity[0]), 'hl');
      if (co === 'apple') return S2('Operating cash, 9 mo', Bn(aCF.totals.operating[0])) + S2('Capex, 9 mo', Bn(-D.aCapex[0])) + S2('Buybacks + dividends', Bn(-(bsv(aCF.financing, 'buyback', 'cur') + bsv(aCF.financing, 'div', 'cur')))) + S2('Free cash flow', Bn(D.aFcf[0]), 'hl');
      return S2('Operating cash, 9 mo', Bn(X.cf9.operating[0])) + S2('Capex, 9 mo', Bn(-X.cf9.ppe[0])) + S2('Q3 capex ÷ revenue', F.num(X.capex.cur / xi.revenue, 1) + '×') + S2('Free cash flow, 9 mo', Bn(D.xFcf9[0]), 'hl');
    }
    function msgHTML() {
      if (co === 'apple' && stt === 'income') return ui.msg('up', 'Profitable', `Apple turned ${Bn(ai.revenue)} of sales into ${Bn(ai.netInc)} of profit: ${F.num(D.nm, 1)} cents per dollar, up from ${F.num(D.nmYa, 1)} a year earlier. ${ck === 'pq' ? `Against the March quarter, sales were ${SP(D.revQoQ)}: the June quarter is seasonally smaller.` : 'Tap a line to see what it means.'}`);
      if (co === 'spacex' && stt === 'income') return xi.netInc >= 0 ? ui.msg('up', 'Profit', `SpaceX’s revenue grew ${P(ck === 'pq' ? D.xRevQoQ : D.xRevYoY)} ${ck === 'pq' ? 'in one quarter' : 'in a year'} and it earned ${Bn(xi.netInc)}, its first profitable quarter as a public company. About ${Bn(D.xBelow)} of that came from below the operating line. Adjusted EBITDA, SpaceX’s own measure, was positive ${Bn(X.ebitda.cur)}.`) : ui.msg('dn', 'Still a loss', `SpaceX lost ${M(-xi.netInc)} this quarter.`);
      if (co === 'apple' && stt === 'balance') return ui.msg('up', 'Net cash', `Apple owns ${Bn(aB.totals.assets[0])} and owes ${Bn(aB.totals.liabilities[0])}; the ${Bn(aB.totals.equity[0])} difference is shareholders’ equity. Cash and securities beat debt by ${Bn(D.aCashMs('cur') - D.aDebt('cur'))}.`);
      if (co === 'spacex' && stt === 'balance') return ui.msg('info', 'After the IPO', `Since ${xB.labels.prev} SpaceX’s equity went from ${Bn(xB.totals.equity[1])} to ${Bn(xB.totals.equity[0])}, helped by the IPO and the conversion of ${Bn(bsv(xB.mezzanine, 'pref', 'prev'))} of preferred stock, and goodwill from ${Bn(bsv(xB.assets, 'gw', 'prev'))} to ${Bn(bsv(xB.assets, 'gw', 'cur'))} with the Cursor deal. Cash and securities: ${Bn(D.xCashMs('cur'))}, down from ${Bn(D.xCashMs('mid'))} on ${xB.labels.mid}.`);
      if (co === 'apple') return ui.msg('up', 'Cash machine', `In nine months Apple’s operations brought in ${Bn(aCF.totals.operating[0])}. After ${Bn(-D.aCapex[0])} of capex, ${Bn(D.aFcf[0])} of free cash flow paid for ${Bn(-bsv(aCF.financing, 'buyback', 'cur'))} of buybacks and ${Bn(-bsv(aCF.financing, 'div', 'cur'))} of dividends.`);
      return ui.msg('dn', 'Cash burn', `In nine months operations brought in ${Bn(X.cf9.operating[0])}, but capex was ${Bn(-X.cf9.ppe[0])}, so free cash flow was about ${Bn(D.xFcf9[0])}. IPO money (${Bn(X.cf9.ipoProceeds)}) paid for it, and SpaceX guided ${Bn(X.capex.q4Guide[0], 0)}–${Bn(X.capex.q4Guide[1], 0)} of capex for the fourth quarter alone.`);
    }
    function noteHTML() {
      const base = 'Figures in millions exactly as reported: 109,417 means $109.4 billion. Change shows % for like-signed values and the difference otherwise; pts = percentage points. Ratios and lines marked computed are FiredBunny’s math. ';
      if (co === 'spacex' && stt === 'cash') return base + 'SpaceX reports cash flow year to date (nine months), with totals only; capex is also given quarter by quarter, so free cash flow here is nine-month operating cash minus nine-month capex.';
      if (co === 'spacex' && stt === 'income') return base + `Q3 2026 is SpaceX’s latest reported quarter as of October 2026 (reported ${X.reported}). Compare it with Q3 2025, or with Q2 2026, its first report as a public company. The nine-month section shows the year to date is still a small loss.`;
      if (co === 'apple' && stt === 'cash') return base + 'Apple reports cash flow year to date (nine months), not for the quarter alone.';
      if (stt === 'balance' && co === 'spacex') return base + `Compare ${xB.labels.cur} with ${xB.labels.prev} (before the IPO) or with ${xB.labels.mid} (just after it). Preferred stock sits between liabilities and equity; it converted to common stock at the June 2026 IPO.`;
      return base + 'Education only, not investment advice.';
    }

    function renderTable() { tw.innerHTML = tableHTML(model(), lastW < 520); }
    function renderFig() {
      const W = lastW, f = stt === 'income' ? figIncome(W) : stt === 'balance' ? figBalance(W) : figCash(W);
      fig.innerHTML = wrapI(W, f.H, f.label, f.body);
    }
    function renderAll() {
      $id(id + '-kw').hidden = stt !== 'income';
      $id(id + '-bw').hidden = !(stt === 'balance' && co === 'spacex');
      $id(id + '-h').innerHTML = header();
      renderFig(); renderTable();
      $id(id + '-rd').innerHTML = readHTML();
      $id(id + '-msg').innerHTML = msgHTML();
      $id(id + '-nt').textContent = noteHTML();
    }
    const rowIdFor = (k) => {
      const m = model(); let found = null;
      m.sections.forEach((sec) => sec.rows.forEach((r) => { if (!found && (r.id === k || r.k === k)) found = r.id; }));
      return found;
    };
    function openRow(rid, focus, scroll) {
      if (!rid) return;
      open = open === rid ? null : rid; renderTable(); renderFig();
      const b = tw.querySelector(`[data-r="${rid}"]`);
      if (b && focus) b.focus({ preventScroll: true });
      if (b && scroll && open) { const tr = b.closest('tr'); try { tr.scrollIntoView({ block: 'nearest', behavior: SML.reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ } }
    }
    tw.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b && tw.contains(b)) openRow(b.dataset.r, true, false); });
    fig.addEventListener('click', (e) => { const g = e.target.closest('[data-k]'); if (g && fig.contains(g)) openRow(rowIdFor(g.dataset.k), false, true); });
    fig.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const g = e.target.closest('[data-k]'); if (g) { e.preventDefault(); openRow(rowIdFor(g.dataset.k), true, true); } });
    ui.responsive(fig, (W) => { const was = lastW < 520; lastW = W; renderFig(); if ((W < 520) !== was || !tw.innerHTML) renderTable(); });
    renderAll();
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const AS = A.sources, XS = X.sources;
  const tip = (h, l) => (SML.bunnyTip ? SML.bunnyTip(h, l) : '');
  SML.lessons.push({
    id: 'l-rc-words', course: 'realco', order: 1, title: 'Earnings words in plain English', mins: 12, level: 'Beginner',
    summary: 'Every earnings word decoded with a coffee cart, then Apple and SpaceX.',
    idea: 'About twenty words build every earnings headline. Learn them on a coffee cart, then read Apple and SpaceX for real.',
    widget: 'termTranslator', opts: {},
    try: 'Tap a highlighted word in the headline, then flip between Hoppy’s cart, Apple and SpaceX to see the same idea with real numbers.',
    body: [
      `<h3>Meet Hoppy’s Coffee Cart</h3><p>Every earnings report uses the same few words. To learn them, picture one small business: Hoppy’s Coffee Cart. Here is its June next to last June. Apple’s income statement has the very same lines, just with much bigger numbers. New to the three reports? Start with <a href="#l-statements">the three statements</a>.</p>
      <table class="tbl"><thead><tr><th>Line</th><th class="num">This June</th><th class="num">Last June</th></tr></thead><tbody>
      <tr><td>Sales (revenue)</td><td class="num">$10,000</td><td class="num">$8,000</td></tr>
      <tr><td>Beans, milk, cups (cost of sales)</td><td class="num">$4,000</td><td class="num">$3,600</td></tr>
      <tr><td><b>Gross profit</b></td><td class="num">$6,000 (60%)</td><td class="num">$4,400 (55%)</td></tr>
      <tr><td>New recipes, barista training (R&amp;D)</td><td class="num">$500</td><td class="num">$400</td></tr>
      <tr><td>Ads, permit, accountant, phone (SG&amp;A)</td><td class="num">$1,500</td><td class="num">$1,400</td></tr>
      <tr><td><b>Operating income</b></td><td class="num">$4,000 (40%)</td><td class="num">$2,600 (32.5%)</td></tr>
      <tr><td>Interest on the cart loan</td><td class="num">−$200</td><td class="num">−$200</td></tr>
      <tr><td>Profit before tax</td><td class="num">$3,800</td><td class="num">$2,400</td></tr>
      <tr><td>Tax (20%)</td><td class="num">$760</td><td class="num">$480</td></tr>
      <tr><td><b>Net income</b></td><td class="num">$3,040</td><td class="num">$1,920</td></tr>
      <tr><td><b>EPS</b> (1,000 shares)</td><td class="num">$3.04</td><td class="num">$1.92</td></tr></tbody></table>`,
      '<h3>The income statement, top to bottom</h3><ul><li><b>Revenue</b>, the <b>top line</b>: everything customers paid. Apple took in $109.4 billion in its April to June 2026 quarter.</li><li><b>Cost of sales</b>: what it cost to make exactly what was sold. Revenue minus cost of sales is <b>gross profit</b>; divide it by revenue for the <b>gross margin</b> (Hoppy’s 60%, Apple 50.1%).</li><li><b>Operating expenses</b>: <b>R&amp;D</b> (inventing the next product) plus <b>SG&amp;A</b> (selling and running the company). Gross profit minus these is <b>operating income</b>; as a share of sales it is the <b>operating margin</b> (Apple 32.6%).</li><li>After interest, other income and tax comes <b>net income</b>, the <b>bottom line</b>: Apple $29.8 billion.</li><li>Split net income across the shares and you get <b>EPS</b>. Headlines quote <b>diluted EPS</b>, which also counts shares promised to employees: Apple $2.02.</li></ul>',
      '<h3>Compared with what? YoY, QoQ and fiscal quarters</h3><p><b>Year over year (YoY)</b> compares a quarter with the same quarter a year earlier. <b>Quarter over quarter (QoQ)</b>, also called sequential, compares it with the quarter right before. Apple’s sales were up 16% YoY and down 1.6% QoQ, and both are true. Apple sells far more in the October to December holiday quarter, and its June quarter is seasonally smaller than March, so for a seasonal business YoY is the fair test. For a fast grower like SpaceX, QoQ shows the pace: +86.5% in one quarter.</p><p>A <b>fiscal year</b> is a company’s own accounting year. Apple’s ends in late September, so October to December is its fiscal Q1 and April to June 2026 is <b>fiscal Q3 2026</b>. SpaceX uses the calendar year, so its July to September quarter is Q3 2026. These are the latest reported quarters as of October 2026: Apple’s covers April to June and SpaceX’s, reported on October 20, covers July to September. Apple reports its next one on November 2, 2026.</p>',
      '<h3>When the lines turn red, and back to black</h3><p>SpaceX’s previous quarter shows a loss. In Q2 2026, its first report as a public company, revenue was $7.8 billion and the gross margin 55.3%, but research and other operating costs were bigger than gross profit. That is an <b>operating loss</b>: −$143 million. After interest and tax the <b>net loss</b> was −$541 million, or −$0.09 per share.</p><p>One quarter later the lines turned black. In Q3 2026 revenue rose 161% from a year earlier to $14.6 billion, operating income was +$2.8 billion and net income +$4.4 billion, or $0.35 per diluted share: its first profitable quarter as a public company. About $1.6 billion of that profit came from below the operating line (other income, net interest and a tax benefit), so investors also look at the $2.8 billion of operating income.</p>',
      `<h3>Expectations: consensus, beat, miss and guidance</h3><p>Before results, analysts publish forecasts; their average is the <b>consensus</b>. A result above it is a <b>beat</b>, below it a <b>miss</b>. Apple’s revenue ($109.4 billion vs about $108.7 to $109.0 billion expected) and EPS ($2.02 vs about $1.88 to $1.89) were beats; Services ($30.7 billion vs about $31.2 billion) was a small miss.</p><p><b>Guidance</b> is management’s own forecast for the next quarter. Apple guided September-quarter sales growth of 9% to 11%, while analysts had hoped for about 12%, and its stock fell about 7% the next day. SpaceX did the opposite in October: it beat (revenue $14.6 billion vs about $12.7 to $12.9 billion expected) and guided first-quarter 2027 revenue of $33 to $37 billion vs about $22.2 billion expected, and its stock rose about 7.8%. A stock prices the future, so guidance often counts more than the quarter just reported. See <a href="#l-rc-price">how earnings move the stock price</a>, <a href="#l-earnings">earnings reports</a> and <a href="#l-earnings-season">earnings season</a>.</p>`,
      '<h3>Adjusted numbers, one-time items, segments and cash</h3><ul><li>A <b>one-time item</b> is temporary or unusual, so it says little about the repeatable business. Apple’s EPS included $0.11 from tariff refunds; without them it was about $1.91. Refunds are temporary rather than gone overnight: Apple’s September guide still includes about 1 point of them.</li><li><b>GAAP</b> numbers follow the official rules. <b>Adjusted</b> (non-GAAP) numbers leave some costs out. <b>EBITDA</b> skips interest, taxes, depreciation and amortization. In Q3 2026 SpaceX showed positive $8.8 billion on its own adjusted EBITDA measure, double its $4.4 billion GAAP net income; <a href="#l-rc-spacex">the SpaceX lesson</a> goes deeper.</li><li>A <b>segment</b> is a part of the business reported on its own: SpaceX’s Starlink, Super Intelligence and Space, or Apple’s five regions.</li><li><b>Free cash flow</b> is operating cash minus capex: about $110.2 billion for Apple in nine months, and about −$35.0 billion for SpaceX in nine months as it built computing capacity. More in <a href="#l-rc-apple-cash">Apple’s cash flow</a>.</li></ul>' + tip('Read a results headline in this order: revenue against the consensus, EPS against the consensus, then guidance. The third one usually decides the next day.'),
    ],
    example: {
      title: 'Decode Apple’s quarter in six steps',
      intro: 'Apple’s fiscal Q3 2026 (April to June), in millions of dollars as Apple printed them.',
      steps: [
        `Top line: revenue was ${M(ai.revenue)} vs ${M(ay.revenue)} a year earlier. (${M(ai.revenue)} − ${M(ay.revenue)}) ÷ ${M(ay.revenue)} = ${SP(D.revYoY)} YoY. Against the March quarter’s ${M(ap.revenue)} it is ${SP(D.revQoQ)} QoQ, a normal seasonal dip.`,
        `Gross profit: ${M(ai.revenue)} − ${M(ai.cost)} cost of sales = ${M(ai.gross)}. Gross margin: ${M(ai.gross)} ÷ ${M(ai.revenue)} = ${P(D.gm)}.`,
        `Operating income: ${M(ai.gross)} − ${M(ai.rd)} R&D − ${M(ai.sga)} SG&A = ${M(ai.opInc)}, a ${P(D.om)} operating margin.`,
        `Bottom line: ${M(ai.opInc)} + ${M(ai.other)} other income − ${M(ai.tax)} tax = ${M(ai.netInc)}. Divided by ${shM(ai.shDil)} diluted shares, that is ${E$(ai.epsDil)} of EPS.`,
        `Expectations: analysts expected about ${E$(EXA.eps[0])} to ${E$(EXA.eps[1])}, so ${E$(ai.epsDil)} beat by ${D.beat[0]} to ${D.beat[1]} cents. Take out the ${E$(TR.eps)} of temporary tariff refunds and the beat shrinks to ${D.beatEx[0]} to ${D.beatEx[1]} cents (${E$(D.ref.eps)}; FiredBunny’s math, assuming the consensus did not include the refunds).`,
        `Guidance: ${G.revGrowth[0]}% to ${G.revGrowth[1]}% growth for the September quarter, below the roughly ${EXA.nextQtrGrowth}% analysts wanted. The stock fell about ${P(-A.reaction.closePct, 0)} the next day.`,
      ],
      result: 'Same quarter, three readings: a record June-quarter top line, a smaller beat once the temporary refunds are removed, and a soft outlook. The stock followed the outlook.',
    },
    mistakes: [
      'Calling Apple’s June quarter a slowdown because sales fell 1.6% from March. In a seasonal business, compare with the same quarter a year earlier (+16.4%).',
      'Treating adjusted EBITDA as profit. In Q2 2026 SpaceX showed positive $3.5 billion on its own adjusted EBITDA measure in a quarter with a $541 million GAAP net loss.',
      'Reading only the headline beat. Check temporary items (Apple’s $0.11 of tariff refunds, SpaceX’s $1.6 billion of non-operating profit from below the operating line, some of which may not recur) and the guidance before deciding what the number means.',
      'Mixing up fiscal and calendar quarters. Apple’s fiscal Q3 is April to June; its fiscal Q1 is the holiday quarter.',
    ],
    points: [
      'Revenue is the top line, net income the bottom line, and EPS is net income per share.',
      'Margins turn dollars into cents per sales dollar: Apple kept 50.1¢ after making its products and 27.2¢ as profit.',
      'Use YoY for seasonal businesses; QoQ shows the pace of a fast grower like SpaceX.',
      'Stocks move on results versus the consensus, and most of all on guidance.',
      'Always read adjusted numbers and one-time items next to the GAAP line.',
    ],
    quiz: { q: 'Apple’s June 2026 quarter sales were 16% higher than a year earlier but 1.6% lower than the March quarter. What is the best reading?', options: ['Apple’s business is shrinking', 'Sales grew; the June quarter is just seasonally smaller than March', 'The two numbers contradict each other'], answer: 1, why: 'YoY removes the seasons, so +16% is the real growth. The QoQ dip is Apple’s normal seasonal pattern.' },
    terms: ['Revenue', 'Year over year', 'Quarter over quarter', 'Gross margin', 'Operating income', 'EPS'],
    glossary: [
      { t: 'Consensus', d: 'The average forecast of the analysts who follow a company; the same as the consensus estimate.' },
      { t: 'Sequential', d: 'Another word for quarter over quarter: compared with the quarter just before.' },
    ],
    sources: [AS[0], AS[2]].concat([/sec\.gov/, /gelonghui/, /tikr\.com/, /teslarati/, /fool\.com\/coverage/].map((re) => XS.find((x) => re.test(x.u))).filter(Boolean)).concat([AS[4]]),
  });

  SML.lessons.push({
    id: 'l-rc-apple-income', course: 'realco', order: 2, title: 'Apple’s earnings, line by line', mins: 13, level: 'Beginner',
    summary: 'Apple’s June 2026 quarter, sales to EPS, and what each line did to the stock.',
    idea: 'Follow $109.4 billion of sales down to $2.02 per share, and see which lines lifted the stock and which sank it.',
    widget: 'incomeWaterfall', opts: {},
    try: 'Tap any row for its card. Flip to a year ago to watch every line grow, switch to cents per $1 of sales, and remove the tariff refund.',
    body: [
      '<h3>The quarter at a glance</h3><p>Apple’s latest reported quarter as of October 2026 is its <b>fiscal Q3 2026</b>: the three months from April to June, ended June 27, 2026. Apple’s fiscal year ends in late September, which is why April to June is its Q3. Results came out on July 30, 2026, after the market closed. Tim Cook, CEO at the time, called it Apple’s strongest June quarter ever. John Ternus became CEO on September 1, 2026, and Apple reports its September quarter on November 2. If the words are new, start with <a href="#l-rc-words">earnings words in plain English</a>.</p>',
      '<h3>Sales: products and services</h3><p>Revenue was <b>$109.4 billion, up 16.4%</b>. Products brought in $78.7 billion (+18.1%) and Services $30.7 billion (+12.1%). By category: iPhone $54.3 billion (+21.7%), Mac $10.4 billion (+28.7%), iPad $6.2 billion (−5.9%), and Wearables, Home and Accessories $7.9 billion (+6.5%). Apple’s official segments are regions: Greater China grew 22.4% to $18.8 billion.</p>',
      '<h3>Margins and the tariff refund</h3><p>Gross margin jumped to <b>50.1%</b> from 46.5%. Products kept 40.1 cents of each sales dollar and Services 75.6 cents, so Services were 28.1% of sales but 42.4% of gross profit. Apple said <b>tariff refunds</b> added about 2 points of gross margin and $0.11 of EPS. Refunds are a temporary, non-recurring help: without them, gross margin was about 48% and EPS about $1.91. They do not vanish at once, though: the September-quarter guide still includes about 1 point of them.</p>',
      '<h3>Spending and operating income</h3><p>R&amp;D rose 32.3% to $11.7 billion (10.7% of sales) and SG&amp;A 10.5% to $7.3 billion. Operating income grew 26.6% to <b>$35.7 billion</b>, an operating margin of 32.6% vs 30.0% a year earlier.</p>',
      '<h3>Below the line: tax, net income and EPS</h3><p>Other income added $572 million (a year earlier it was −$171 million). Tax took $6.5 billion, a 17.9% rate vs 16.4%. Net income rose 27.1% to <b>$29.8 billion</b>. Diluted EPS rose 28.7% to <b>$2.02</b>, faster than profit, because buybacks cut the diluted share count 1.6% to 14.71 billion. The cash side of those buybacks is in <a href="#l-rc-apple-cash">Apple’s cash flow</a>.</p>',
      '<h3>What each line meant for the stock</h3><ul><li><b>Revenue and EPS beat</b> the consensus (about $108.7 to $109.0 billion and $1.88 to $1.89).</li><li><b>Part of the beat was temporary</b>: $0.11 of tariff refunds, so the underlying beat was 2 to 3 cents (FiredBunny’s math, assuming the consensus did not include the refunds).</li><li><b>Services</b>, the high-margin engine, came in a little below the roughly $31.2 billion expected.</li><li><b>Guidance</b> for the September quarter: 9% to 11% growth (about $111.7 to $113.7 billion) vs about 12% hoped for, and a 47% to 48% gross margin that still includes about 1 point of refunds.</li><li>The stock closed at $333.43 on July 30 and fell about 7.4% on July 31, to near $309. Hear how the call unfolded in <a href="#l-rc-apple-call">Apple’s earnings call, explained</a>, and see the math in <a href="#l-rc-price">how earnings move the stock price</a>. For options traders, that kind of gap is why <a href="#l-iv-crush">IV crush</a> and position size matter around earnings.</li></ul>' + tip('A record quarter and a falling stock are not a contradiction. The price already expected a strong June; the news was in the temporary help and the September guide.'),
    ],
    extra: [{ widget: 'statementExplorer', opts: { company: 'apple', statement: 'income', open: 'gross' }, try: 'The same quarter as Apple printed it, in millions. Tap any line for its card, compare with the March quarter, or switch to the balance sheet, cash flow or SpaceX.' }],
    example: {
      title: 'Strip out the tariff refund',
      intro: 'How much of Apple’s $2.02 was repeatable? All figures from Apple’s release.',
      steps: [
        `Reported: ${M(ai.netInc)} net income ÷ ${shM(ai.shDil)} diluted shares = ${E$(ai.epsDil)} of diluted EPS.`,
        `Apple said tariff refunds added ${E$(TR.eps)}. ${E$(ai.epsDil)} − ${E$(TR.eps)} = ${E$(D.ref.eps)}.`,
        `Growth: reported (${E$(ai.epsDil)} − ${E$(ay.epsDil)}) ÷ ${E$(ay.epsDil)} = ${SP(D.epsYoY)}; without the refund (${E$(D.ref.eps)} − ${E$(ay.epsDil)}) ÷ ${E$(ay.epsDil)} = ${SP(D.epsExYoY)}.`,
        `Against the ${E$(EXA.eps[0])} to ${E$(EXA.eps[1])} consensus, the beat shrinks from ${D.beat[0]} to ${D.beat[1]} cents to ${D.beatEx[0]} to ${D.beatEx[1]} cents (our math, assuming the consensus did not include the refunds).`,
        `Gross margin: ${P(D.gm)} minus about ${TR.grossMarginPts} points ≈ ${P(D.gmEx, 0)}, the top of Apple’s ${G.grossMargin[0]}% to ${G.grossMargin[1]}% guide for September, which itself still includes about ${G.tariffRefundPts} point of refunds.`,
      ],
      result: 'Still a beat and still strong growth, but smaller than the headline. That is one reason investors looked past it to the guidance.',
    },
    mistakes: [
      'Reading the jump in gross margin as permanent. About 2 of the 3.6 points came from temporary tariff refunds.',
      'Treating every category as equal. iPad fell 5.9%, but it is under 6% of sales; iPhone is about half.',
      'Assuming EPS growth equals profit growth. Buybacks cut the share count 1.6%, so EPS grew 28.7% while net income grew 27.1%.',
      'Expecting a record quarter to lift the stock. The September guidance and margin outlook mattered more.',
    ],
    points: [
      'Apple turned $109.4 billion of sales into $29.8 billion of profit: 27.2 cents per dollar.',
      'Services are 28% of sales but 42% of gross profit, thanks to a 75.6% margin.',
      'About $0.11 of the $2.02 EPS came from temporary tariff refunds; without them, about $1.91.',
      'Buybacks made EPS grow faster than net income.',
      'The stock fell about 7% because the outlook, the margin guide and the temporary help outweighed the beat.',
    ],
    quiz: { q: 'Apple’s gross margin was 50.1%, including about 2 points from temporary tariff refunds. Which margin is the fair base for judging next quarter?', options: ['About 52%', 'About 48%', '50.1%, because the refund was real money'], answer: 1, why: 'Temporary items fade, so investors judge the next quarter against the margin excluding the refunds, about 48%. Apple’s 47%–48% September guide still includes about 1 point of them.' },
    terms: ['Gross margin', 'Operating margin', 'Diluted EPS', 'One-time item', 'Guidance', 'Segment'],
    sources: [AS[0], AS[1], AS[4], AS[5]],
  });
})();
