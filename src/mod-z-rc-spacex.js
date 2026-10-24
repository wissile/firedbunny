/* Read a Real Company (fork K4): SpaceX's latest reported quarter (Q3 2026, with the Q2 first report as the
   contrast) in growthVsProfit, and how earnings move a stock price (earningsPrice, also a tool). Every company number
   is read from SML.realco and derived here. Hoppy's Coffee Cart is the shared everyday example; the "second-cart
   version" is a clearly labelled made-up variation used for losses and the IPO. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt;
  const RC = SML.realco;
  if (!RC || !RC.apple || !RC.spacex) return;
  const AP = RC.apple, SX = RC.spacex;
  const $id = (x) => document.getElementById(x);
  const E = SML.esc, clamp = SML.clamp, lerp = SML.lerp;
  const MI = F.minus;

  /* ---------------- formatting ---------------- */
  const NEG = MI + '\u2060'; /* minus + word joiner: a line never breaks between "−" and "$" */
  const sg = (v) => (v > 0 ? '+' : v < 0 ? NEG : '');
  const fM = (v, d) => (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v), d || 0) + 'M';
  const sM = (v, d) => sg(v) + '$' + F.num(Math.abs(v), d || 0) + 'M';
  const fB = (v, d) => (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v) / 1000, d == null ? 1 : d) + 'B';
  const sB = (v, d) => sg(v) + '$' + F.num(Math.abs(v) / 1000, d == null ? 1 : d) + 'B';
  const bil = (v, d) => (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v) / 1000, d == null ? 1 : d) + ' billion';
  const mil = (v) => (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v), 0) + ' million';
  const amt = (v) => (Math.abs(v) >= 1000 ? bil(v) : mil(v));
  const nb = (h) => String(h).replace(/−\$/g, NEG + '$');
  const fMB = (v) => (Math.abs(v) >= 1000 ? fB(v, 1) : fM(v));
  const fBz = (v, d) => (Math.abs(v) < 0.5 ? '$0' : fB(v, d));
  const sMB = (v) => (Math.abs(v) >= 1000 ? sB(v, 1) : sM(v));
  const pc = (a, b) => (a / b - 1) * 100;
  const fP = (v, d) => F.pct(v, d == null ? 1 : d);
  const sP = (v, d) => F.spct(v, d == null ? 1 : d);
  const usd = (v, d) => (v < 0 ? NEG : '') + '$' + F.num(Math.abs(v), d == null ? 2 : d);
  const sUsd = (v, d) => sg(v) + '$' + F.num(Math.abs(v), d == null ? 2 : d);
  const xx = (v, d) => F.num(v, d == null ? 1 : d) + '×';
  const tw = (s, px, mono) => String(s).replace(/&[a-z#0-9]+;/g, 'x').length * (px || 11.5) * (mono ? 0.6 : 0.55);
  const plain = (s) => String(s).replace(/&amp;/g, '&').replace(/<[^>]+>/g, '');
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const tip = (h, l) => { try { return SML.bunnyTip ? SML.bunnyTip(h, l) : ''; } catch (e) { return ''; } };

  /* ---------------- SpaceX numbers (all derived from SML.realco.spacex) ----------------
     cur = Q3 2026 (latest reported quarter as of October 2026), pq = Q2 2026 (first report, a loss), ya = Q3 2025.
     Income tax is a provision: + is an expense, − is a benefit. */
  const xc = SX.is.cur, xy = SX.is.ya, xq = SX.is.pq, xq1 = SX.is.pq2;
  const SEGP = { cur: SX.segments.cur, pq: SX.segments.pq, ya: SX.segments.ya };
  const segOf = (k, per) => (SEGP[per || 'cur'] || SX.segments.cur).find((s) => s.k === k) || {};
  const bsRow = (side, k) => (SX.bs[side] || []).find((r) => r.k === k) || { cur: 0, prev: 0, mid: 0 };
  const bsv = (side, k, w) => bsRow(side, k)[w] || 0;
  const BT = SX.bs.totals; /* arrays are [Sep 30, Dec 31, Jun 30] */
  const TI = { cur: 0, prev: 1, mid: 2 };
  const btot = (key, w) => BT[key][TI[w]];
  const brv = (br, start) => { const r = br.find((b) => b[0].indexOf(start) === 0); return r ? r[1] : 0; };
  const BR3 = SX.ebitda.bridge, BR2 = SX.ebitda.bridgePq;
  const X = {
    rev: xc.revenue, revYa: xy.revenue, revPq: xq.revenue, revPq1: xq1.revenue,
    yoy: pc(xc.revenue, xy.revenue), qoq: pc(xc.revenue, xq.revenue), yoyPq: pc(xq.revenue, SX.is.ya2.revenue),
    gm: (xc.gross / xc.revenue) * 100, gmYa: (xy.gross / xy.revenue) * 100, gmPq: (xq.gross / xq.revenue) * 100,
    om: (xc.opInc / xc.revenue) * 100, omYa: (xy.opInc / xy.revenue) * 100, omPq: (xq.opInc / xq.revenue) * 100,
    costPct: (xc.cost / xc.revenue) * 100, costPctYa: (xy.cost / xy.revenue) * 100,
    rdPct: (xc.rd / xc.revenue) * 100, rdYoy: pc(xc.rd, xy.rd), rdOfGrossPq: (xq.rd / xq.gross) * 100,
    sgaO: xc.sga + xc.restructuring + xc.impairment, sgaOYa: xy.sga + xy.restructuring + xy.impairment,
    netInt: xc.intExp + xc.intInc, netIntPq: xq.intExp + xq.intInc, netIntYa: xy.intExp + xy.intInc,
    ebitda: SX.ebitda.cur, ebitdaPq: SX.ebitda.pq, ebitdaYa: SX.ebitda.ya, ebitdaM: (SX.ebitda.cur / xc.revenue) * 100,
    gap: SX.ebitda.cur - xc.netInc, gapPq: SX.ebitda.pq - xq.netInc,
    da: brv(BR3, 'Depreciation'), sbc: brv(BR3, 'Stock-based'), acqSbc: brv(BR3, 'Acquisition-related stock'),
    daPq: brv(BR2, 'Depreciation'), sbcPq: brv(BR2, 'Stock'),
    capex: SX.capex.cur, capexPq: SX.capex.pq, capexPq1: SX.capex.pq2, capexYa: SX.capex.ya, capexYtd: SX.capex.ytd,
    q4Lo: SX.capex.q4Guide[0], q4Hi: SX.capex.q4Guide[1],
    ocf9: SX.cf9.operating[0], ocf9Ya: SX.cf9.operating[1], fin9: SX.cf9.financing[0], ipoNet: SX.cf9.ipoProceeds || SX.ipo.netProceeds,
    shYoy: pc(xc.sh, xy.sh),
  };
  X.below = X.netInt + xc.other - xc.tax; /* net interest + other income + tax benefit */
  X.belowPq = X.netIntPq + xq.other - xq.tax; X.belowYa = X.netIntYa + xy.other - xy.tax;
  X.belowShare = (X.below / xc.netInc) * 100;
  X.sbcAll = X.sbc + X.acqSbc;
  X.smallAdd = brv(BR3, 'Acquisition-related costs') + brv(BR3, 'Restructuring');
  X.intExpAdd = brv(BR3, 'Interest expense'); X.intIncOut = -brv(BR3, 'Interest income'); X.otherOut = -brv(BR3, 'Other income'); X.taxOut = -brv(BR3, 'Income tax');
  /* walk check: net income + D&A + all stock pay − net below-the-line + deal/restructuring costs = adjusted EBITDA */
  X.walk = xc.netInc + X.da + X.sbcAll - X.below + X.smallAdd;
  X.capexRev = X.capex / xc.revenue; X.capexEbitda = X.capex / X.ebitda;
  X.fcf9 = X.ocf9 - X.capexYtd; X.burnMonth = -X.fcf9 / 9;
  X.siCapexShare = (segOf('ai').capex / X.capex) * 100;
  X.connOm = (segOf('conn').opInc / segOf('conn').revenue) * 100;
  X.siOm = (segOf('ai').opInc / segOf('ai').revenue) * 100;
  X.spOm = (segOf('space').opInc / segOf('space').revenue) * 100;
  X.connShareOp = (segOf('conn').opInc / xc.opInc) * 100;
  X.siShareRev = (segOf('ai').revenue / xc.revenue) * 100;
  X.connYoy = pc(segOf('conn').revenue, segOf('conn', 'ya').revenue);
  X.siYoy = pc(segOf('ai').revenue, segOf('ai', 'ya').revenue);
  X.spYoy = pc(segOf('space').revenue, segOf('space', 'ya').revenue);
  const SN = SX.segments.notes || {};
  /* balance sheet: Dec 31, 2025 (prev) → Jun 30, 2026 (mid) → Sep 30, 2026 (cur) */
  const debtOf = (w) => bsv('liabilities', 'debtCur', w) + bsv('liabilities', 'debtNon', w);
  const defrevOf = (w) => bsv('liabilities', 'defrevCur', w) + bsv('liabilities', 'defrevNon', w);
  const gwOf = (w) => bsv('assets', 'gw', w) + bsv('assets', 'intang', w);
  const prefOf = (w) => (SX.bs.mezzanine[0] || {})[w] || 0;
  X.cash = bsv('assets', 'cash', 'cur'); X.cashMid = bsv('assets', 'cash', 'mid'); X.cash0 = bsv('assets', 'cash', 'prev');
  X.ms = bsv('assets', 'ms', 'cur'); X.msMid = bsv('assets', 'ms', 'mid');
  X.cashSec = X.cash + X.ms; X.cashSecMid = X.cashMid + X.msMid;
  X.ppe = bsv('assets', 'ppe', 'cur'); X.ppe0 = bsv('assets', 'ppe', 'prev');
  X.gw = bsv('assets', 'gw', 'cur'); X.gwMid = bsv('assets', 'gw', 'mid'); X.gw0 = bsv('assets', 'gw', 'prev');
  X.debt = debtOf('cur'); X.debt0 = debtOf('prev');
  X.defrev = defrevOf('cur'); X.defrev0 = defrevOf('prev');
  X.netCash = X.cashSec - X.debt;
  X.eq = btot('equity', 'cur'); X.eqMid = btot('equity', 'mid'); X.eq0 = btot('equity', 'prev');
  X.pref0 = prefOf('prev');
  X.apic = bsv('equity', 'apic', 'cur'); X.apicMid = bsv('equity', 'apic', 'mid'); X.apic0 = bsv('equity', 'apic', 'prev');
  X.def = bsv('equity', 'deficit', 'cur'); X.defMid = bsv('equity', 'deficit', 'mid'); X.def0 = bsv('equity', 'deficit', 'prev');
  X.cr = btot('currentAssets', 'cur') / btot('currentLiab', 'cur');
  X.crMid = btot('currentAssets', 'mid') / btot('currentLiab', 'mid');
  X.cr0 = btot('currentAssets', 'prev') / btot('currentLiab', 'prev');
  X.otherA = btot('assets', 'cur') - X.cash - X.ms - X.ppe - gwOf('cur');
  X.runRate = xc.revenue * 4;
  const MT = SX.metrics;
  const SO = SX.bs.sharesOutstanding;
  X.outCur = SO.classA[0] + SO.classB[0] + SO.classC[0];
  X.out0 = SO.classA[1] + SO.classB[1] + SO.classC[1];
  X.subsYoy = pc(MT.subs[0], MT.subs[2]);
  X.consYoy = pc(MT.consumerRev[0], MT.consumerRev[2]);
  X.epsOnPq = xc.netInc / xq.sh; X.epsOnYa = xc.netInc / xy.sh;
  const SXE = SX.expectations, SXR = SX.reaction, Q2 = SX.q2;
  /* Q1 2027 revenue guide: parsed from the call outlook line in SML.realco (it is stored as text) */
  const g1m = String((SX.call.outlook || []).find((o) => /first quarter of 2027/.test(o)) || '').match(/\$(\d+(?:\.\d+)?) billion to \$(\d+(?:\.\d+)?) billion/);
  X.g1Lo = g1m ? Number(g1m[1]) * 1000 : NaN; X.g1Hi = g1m ? Number(g1m[2]) * 1000 : NaN;
  X.g1Mid = (X.g1Lo + X.g1Hi) / 2;

  /* ---------------- Apple numbers (from SML.realco.apple) ---------------- */
  const A = { eps0: AP.ttmEps, p0: AP.reaction.closeBefore, p1: AP.reaction.closeAfter, sh: AP.is.cur.shBasic };
  A.pe0 = A.p0 / A.eps0; A.pe1 = A.p1 / A.eps0;
  A.mcap0 = A.p0 * A.sh; A.mcap1 = A.p1 * A.sh; A.mcapDrop = A.mcap0 - A.mcap1;
  A.eps = AP.is.cur.epsDil; A.epsX = A.eps - AP.tariffRefund.eps;
  const AEX = AP.expectations, AG = AP.call.guidance, AR = AP.reaction;
  A.beatLo = A.eps - AEX.eps[1]; A.beatHi = A.eps - AEX.eps[0];
  A.beatXLo = A.epsX - AEX.eps[1]; A.beatXHi = A.epsX - AEX.eps[0];
  A.gLo = AG.baseRevenue * (1 + AG.revGrowth[0] / 100); A.gHi = AG.baseRevenue * (1 + AG.revGrowth[1] / 100);
  A.ttmRev = AP.trend.slice(-4).reduce((s, q) => s + q.revenue, 0);
  A.ps = A.mcap0 / A.ttmRev;
  A.ah = A.p0 * (1 + AR.afterHoursPct / 100); A.open = A.p0 * (1 + AR.openPct / 100);
  A.peDrop = A.pe0 - A.pe1;

  /* ---------------- CSS ---------------- */
  SML.css(`
    .rcx [hidden]{display:none!important}
    .rcx .rcx-c[hidden]{display:none!important}
    .rcx-lab{font:600 10.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .rcx-bar2{background:var(--surface)}
    .rcx-bar2 .rcx-c{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
    .rcx-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line)}
    .rcx-card > div{background:var(--surface);padding:12px 16px;display:flex;flex-direction:column;gap:5px;min-width:0}
    .rcx-card > .rcx-ch{grid-column:1/-1;flex-direction:row;flex-wrap:wrap;align-items:baseline;gap:6px 12px;background:color-mix(in srgb,var(--accent) 6%,var(--surface))}
    .rcx-ct{font-family:var(--display);font-size:24px;line-height:1;color:var(--ink);letter-spacing:.01em;text-transform:uppercase}
    .rcx-tag{font:600 10px/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--flame,var(--accent));border:1px solid color-mix(in srgb,var(--flame,var(--accent)) 40%,transparent);border-radius:999px;padding:3px 8px;white-space:nowrap}
    .rcx-tap{font:500 11px var(--mono);color:var(--muted);margin-left:auto}
    .rcx-k{font:600 10px/1.3 var(--mono);letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
    .rcx-k.hop{color:var(--flame,var(--accent))} .rcx-k.real{color:var(--info)} .rcx-k.why{color:var(--accent)}
    .rcx-card p{font-size:14px;line-height:1.5;color:color-mix(in srgb,var(--ink) 88%,transparent);overflow-wrap:anywhere}
    @media(max-width:640px){.rcx-card{grid-template-columns:minmax(0,1fr)}}
    .rcx .rcx-hit{cursor:pointer;outline:none}
    .rcx .rcx-hit:focus-visible{stroke:var(--accent);stroke-width:2}
    .rcx svg .rcx-sel{fill:color-mix(in srgb,var(--accent) 9%,transparent);stroke:color-mix(in srgb,var(--accent) 50%,transparent);stroke-width:1}
    .rcx svg .rcx-ghost{fill:none;stroke:var(--muted);stroke-width:1.4;stroke-dasharray:4 3}
    .rcx-dots{display:inline-flex;gap:6px;align-items:center}
    .rcx-dots i{width:9px;height:9px;border-radius:50%;background:var(--shade2)}
    .rcx-dots i.done{background:color-mix(in srgb,var(--accent) 50%,var(--shade2))}
    .rcx-dots i.on{background:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
    .rcx-dots i.ok{background:var(--up)} .rcx-dots i.no{background:var(--down)}
    .rcx-actions .grow{flex:1 1 auto}
    .rcx-actions .meta{font:500 12px var(--mono);color:var(--muted)}
    .rcx-step{padding:14px 16px;background:var(--surface);display:flex;flex-direction:column;gap:7px}
    .rcx-when{font:600 10.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
    .rcx-step h4{font:600 17px/1.3 var(--sans);color:var(--ink);margin:0}
    .rcx-step p{font-size:14.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 88%,transparent);max-width:78ch}
    .rcx-guess{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding-top:2px}
    .rcx-head{padding:16px;background:var(--bg);display:flex;flex-direction:column;gap:8px}
    .rcx-co{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:600 10.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .rcx-hl{font:600 19px/1.35 var(--sans);color:var(--ink);text-wrap:balance;max-width:62ch}
    @media(max-width:520px){.rcx-hl{font-size:17px}}
    .rcx-tc{border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:var(--surface);max-width:76ch}
    .rcx-tc-h{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;padding:12px 16px;background:color-mix(in srgb,var(--accent) 6%,var(--surface));border-bottom:1px solid var(--line)}
    .rcx-tc-h span.n{font-family:var(--display);font-size:24px;line-height:1;color:var(--ink);text-transform:uppercase;letter-spacing:.01em}
    .rcx-tc dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);margin:0}
    .rcx-tc dl > div{background:var(--surface);padding:12px 16px;display:flex;flex-direction:column;gap:5px;min-width:0}
    .rcx-tc dt{font:600 10px/1.3 var(--mono);letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
    .rcx-tc dt.hop{color:var(--flame,var(--accent))} .rcx-tc dt.real{color:var(--info)} .rcx-tc dt.why{color:var(--accent)}
    .rcx-tc dd{margin:0;font-size:15px;line-height:1.55;color:color-mix(in srgb,var(--ink) 88%,transparent);overflow-wrap:anywhere}
    @media(max-width:640px){.rcx-tc dl{grid-template-columns:minmax(0,1fr)}}
    @media(max-width:560px){.rcx .wg-msg{flex-direction:column;gap:8px}}
    .rcx svg text.rcx-big{font-size:34px}
    .rcx svg .rcx-band{fill:color-mix(in srgb,var(--violet) 9%,transparent)}
  `);

  /* ---------------- term cards ---------------- */
  const V2 = 'second-cart version';
  const PQ = 'Jun 2026 quarter', CQ = 'Sep 2026 quarter', YQ = 'Sep 2025 quarter';
  /* card: {t, what, hop, hopTag, real, why, whyLabel} */
  const SXC = {
    revenue: { t: 'Revenue (top line)', what: 'All the money customers paid for what the company delivered in the period, before any costs.',
      hop: 'Sales of $10,000 this June, up 25% from $8,000 last June.',
      real: `${fM(X.rev)} in the September 2026 quarter, up ${fP(X.yoy)} from ${fM(X.revYa)} a year earlier and up ${fP(X.qoq)} from ${fM(X.revPq)} in June.`,
      why: 'Growth is what investors pay up for. Revenue more than doubling in a year at this size is rare, and it is why the stock trades on the future more than on today’s profit.' },
    cost: { t: 'Cost of revenue', what: 'What it cost to make and deliver what was sold.',
      hop: 'Beans, milk and cups: $4,000 on $10,000 of sales.',
      real: `${fM(xc.cost)}, ${fP(X.costPct)} of revenue (${fP(X.costPctYa)} a year earlier).`,
      why: 'When costs grow slower than sales, each new dollar of revenue keeps more profit. That is scale at work.' },
    gross: { t: 'Gross profit and gross margin', what: 'Revenue minus cost of revenue. Gross margin is that profit as a percent of revenue.',
      hop: '$10,000 − $4,000 = $6,000, a 60% gross margin (55% last June).',
      real: `${fM(xc.gross)}, a ${fP(X.gm)} gross margin, up from ${fP(X.gmPq)} in June and ${fP(X.gmYa)} a year earlier. Part of the jump was one-time: the CFO said the fourth-quarter gross margin should be closer to the second quarter’s, citing one-time benefits and customer mix in the third quarter (about 3 points of Connectivity’s margin were one-time, mainly tariff refunds, per TIKR).`,
      why: 'A rising gross margin usually says the business gets more efficient as it grows, but check how much of the rise is one-time. Guidance that it will slip back is something investors weigh.' },
    rd: { t: 'R&amp;D', what: 'Research and development: spending on inventing and building new products.',
      hop: '$500 on new recipes and barista training.',
      real: `${fM(xc.rd)}, ${fP(X.rdPct)} of revenue, up ${fP(X.rdYoy)} in a year. In June, R&amp;D used ${fP(X.rdOfGrossPq, 0)} of gross profit; that is why that quarter was a loss.`,
      why: 'Heavy R&amp;D is a bet on future sales. When revenue grows faster than R&amp;D, the bet starts to show up as profit.' },
    sga: { t: 'SG&amp;A and other', what: 'Selling, general and administrative costs: sales, offices, executives, legal. Here it also holds small restructuring charges.',
      hop: '$1,500 for ads, the permit, the accountant and the phone.',
      real: `${fM(xc.sga)} of SG&amp;A plus ${fM(xc.restructuring)} of restructuring: ${fM(X.sgaO)} (${fM(X.sgaOYa)} a year earlier).`,
      why: 'Overhead that grows slower than revenue is operating leverage: more of each new sales dollar falls to profit.' },
    opInc: { t: 'Operating income', what: 'Gross profit minus operating expenses: the profit from the core business, before interest, other items and taxes.',
      hop: '$6,000 of gross profit − $500 − $1,500 = $4,000, a 40% operating margin.',
      real: `${sM(xc.opInc)}, a ${fP(X.om)} margin: the first operating profit as a public company, after ${fM(xq.opInc)} in June and ${fM(xy.opInc)} a year earlier.`,
      why: 'This is the profit that can repeat, so investors value it most. The swing from a loss to a profit is the headline of the quarter.' },
    opLoss: { t: 'Operating loss', what: 'When gross profit does not cover operating expenses, the core business loses money before interest and taxes.',
      hopTag: V2, hop: 'The old cart earns $4,800, the new cart loses $1,000 and the delivery app loses $4,200: an operating loss of −$400 on $19,200 of sales.',
      real: `In June 2026 (SpaceX’s first report): ${fM(xq.opInc)}, a ${fP(X.omPq)} margin, as R&amp;D used ${fP(X.rdOfGrossPq, 0)} of gross profit. A year earlier, in September 2025: ${fM(xy.opInc)}. The Space segment still had a small one in September 2026: ${fM(segOf('space').opInc)}.`,
      why: 'A shrinking loss on fast growth is how a company moves toward profit. Investors pay for that path, so the trend matters more than the sign.' },
    interest: { t: 'Net interest', what: 'Interest earned on cash and investments minus interest paid on debt.',
      hop: 'Hoppy pays $200 a month on the cart loan; if the $6,000 in the bank earned 4% a year, that would bring in $20.',
      real: `${fM(xc.intExp)} paid, +${fM(xc.intInc)} earned: ${sM(X.netInt)} net (${fM(X.netIntPq)} in June). With ${fB(X.cashSec)} of cash and securities after the IPO, SpaceX now earns more interest than it pays.`,
      why: 'Below the operating line. It depends on the cash pile and on rates, not on selling more service.' },
    other: { t: 'Other income', what: 'Gains and losses outside the main business, such as on stakes in other companies.',
      hop: 'Hoppy sells an old grinder for $50 more than its value on the books: a $50 other gain.',
      real: `${sM(xc.other)} in the September quarter, of which ${fM(SX.belowTheLine.otherRelatedParty)} came from a related party (per TIKR). The nine-month cash flow shows a ${fM(SX.belowTheLine.unrealizedGain9m)} unrealized gain on stakes in other companies (TIKR). In June it was ${fM(xq.other)}.`,
      why: 'Gains like these can disappear next quarter. Investors usually look through them and value the operating profit.' },
    tax: { t: 'Income taxes', what: 'Taxes on the period’s results. Sometimes a company books a tax benefit instead, which adds to net income.',
      hop: '$760: 20% of the $3,800 profit before tax.',
      real: `A ${fM(-xc.tax)} tax benefit in the September quarter (a ${fM(xy.tax)} tax expense a year earlier, ${fM(xq.tax)} in June).`,
      why: 'A tax benefit raises net income without any extra business, and it may not repeat.' },
    belowLine: { t: 'Below the operating line', what: 'Everything between operating income and net income: interest, other income or expense, and taxes.',
      hop: 'If June’s $3,040 profit had included a $200 insurance refund, that part came from below the operating line, not from selling coffee.',
      real: `${sM(X.below)} in the September quarter: net interest ${sM(X.netInt)}, other income ${sM(xc.other)} and a ${fM(-xc.tax)} tax benefit. That is about ${fP(X.belowShare, 0)} of the ${fM(xc.netInc)} net income.`,
      why: 'Operating profit can repeat; below-the-line gains often do not. This is the quality check on any earnings headline.' },
    netInc: { t: 'Net income (bottom line)', what: 'What is left after every cost, interest, other item and tax.',
      hop: '$3,040 in June.',
      real: `${sM(xc.netInc)} in the September 2026 quarter, after ${fM(xq.netInc)} in June and ${fM(xy.netInc)} a year earlier: the first profitable quarter as a public company. About ${fB(X.below)} of it came from below the operating line. The nine months to September were still a loss: ${fM(SX.is.ytd.netInc)}.`,
      why: 'Net income is the headline, but its quality matters: profit from the core business is worth more than one-off gains.' },
    netLoss: { t: 'Net loss (bottom line)', what: 'What is left after every cost, interest and tax. Negative means the company lost money in the period.',
      hopTag: V2, hop: 'An operating loss of −$400 plus $300 of loan interest: a net loss of −$700.',
      real: `June 2026, SpaceX’s first report as a public company: ${fM(xq.netInc)} (EPS ${usd(xq.eps)}). September 2025: ${fM(xy.netInc)}, including a ${fM(xy.tax)} tax expense.`,
      why: 'No profit means no P/E. Investors then value a company on sales and on how soon the loss turns into a profit.' },
    eps: { t: 'EPS (earnings per share)', what: 'Net income divided by the average number of shares in the period. Diluted EPS adds shares from awards and options only when they would lower EPS.',
      hop: '$3,040 ÷ 1,000 shares = $3.04. Second-cart version: −$700 ÷ 1,000 = −$0.70.',
      real: `${fM(xc.netInc)} ÷ ${F.num(xc.sh)}M diluted shares = ${usd(xc.eps)} (basic ${usd(xc.epsBasic)} on ${F.num(xc.shBasic)}M). June: ${usd(xq.eps)}; a year earlier: ${usd(xy.eps)}.`,
      why: `Analysts expected about ${usd(SXE.eps[0])}–${usd(SXE.eps[1])} (reported), so it was a big beat. The share count quadrupled in a year, so compare per-share numbers with care.` },
    segment: { t: 'Segment', what: 'A part of the business the company reports on its own, with its own revenue and profit.',
      hopTag: V2, hop: 'The old cart, the new cart and the delivery app, each with its own sales and profit.',
      real: `Super Intelligence ${fM(segOf('ai').revenue)}, Connectivity (Starlink) ${fM(segOf('conn').revenue)}, Space ${fM(segOf('space').revenue)}.`,
      why: 'Segments show which part pays the bills and which part is the bet. One healthy segment can hide a money-losing one inside the total.' },
    conn: { t: 'Connectivity (Starlink)', what: 'Starlink satellite internet for homes, businesses, airlines, ships and governments.',
      hopTag: V2, hop: 'The old cart: $12,000 of sales and $4,800 of operating income, a 40% margin.',
      real: `${fM(segOf('conn').revenue)} of revenue (${sP(X.connYoy)}) and ${sM(segOf('conn').opInc)} of operating income, a ${fP(X.connOm)} margin: about ${fP(X.connShareOp, 0)} of the company’s operating income. ${F.num(MT.subs[0], 1)}M consumer subscribers.`,
      why: 'The steady earner. Its profit funds the bets elsewhere, so investors watch subscriber growth and margins closely.' },
    ai: { t: 'Super Intelligence (formerly AI)', what: 'Grok, cloud computing, X and, since the deal closed on ' + (SN.cursorClosed || 'August 14, 2026') + ', Cursor.',
      hopTag: V2, hop: 'The delivery app: $3,200 of sales and a −$4,200 operating loss while Hoppy builds it.',
      real: `${fM(segOf('ai').revenue)} of revenue (${sP(X.siYoy)}), about ${fP(X.siShareRev, 0)} of the total; Cursor added ${fM(SN.cursorRevenue)}. Operating income ${sM(segOf('ai').opInc)} after ${fM(SN.cursorStockComp)} of acquisition-related stock pay from the Cursor deal (about ${fB(SN.siOpIncExCursorComp)} before it). Capex ${fM(segOf('ai').capex)}, ${fP(X.siCapexShare, 0)} of the company total.`,
      why: 'This is where the money goes. The stock swings on whether investors believe the computing spend will pay back.' },
    space: { t: 'Space', what: 'Launches, Starship and Dragon.',
      hopTag: V2, hop: 'The new cart: $4,000 of sales and a −$1,000 operating loss while it finds customers.',
      real: `${fM(segOf('space').revenue)} of revenue (${sP(X.spYoy)}), a small operating loss of ${fM(segOf('space').opInc)} and ${sM(segOf('space').ebitda)} of adjusted EBITDA. Operating income was ${sM(segOf('space', 'ya').opInc)} a year earlier and ${fM(segOf('space', 'pq').opInc)} in June. ${MT.launches[0]} launches (${MT.launches[2]} a year earlier).`,
      why: 'An operating loss means costs ran slightly above gross profit. Here it is close to break-even, a big change from June.' },
    total: { t: 'Operating margin', what: 'Operating income as a percent of revenue.',
      hop: '$4,000 ÷ $10,000 = 40% (32.5% last June).',
      real: `Company ${fP(X.om)}; Starlink ${fP(X.connOm)}, Super Intelligence ${fP(X.siOm)}, Space ${fP(X.spOm)}. Backlog of signed orders: ${fB(MT.backlog, 0)}, about ${fB(MT.backlogNext12m, 0)} of it expected within a year.`,
      why: 'Margins let you compare businesses of different sizes. A segment that flips from loss to profit can change how investors value the whole company.' },
    subs: { t: 'Subscribers and ARPU', what: 'Paying customers, and the average revenue per user (ARPU), per month.',
      hop: 'Hoppy’s coffee club: 150 members at $20 a month = ARPU $20. Add a $12 student plan and grow to 300 members, half on each plan: ARPU drops to $16, but club revenue rises from $3,000 to $4,800.',
      real: `${F.num(MT.subs[0], 1)}M Starlink consumer subscribers (${F.num(MT.subs[2], 1)}M a year earlier, ${F.num(MT.subs[1], 1)}M in June; ${F.num(MT.netAdds, 1)}M added in the quarter). Consumer ARPU $${MT.arpu[0]} a month, up from $${MT.arpu[1]} in June and down from $${MT.arpu[2]} a year earlier. Consumer revenue ${fM(MT.consumerRev[0])}, up ${fP(X.consYoy, 0)}.`,
      why: 'Subscriptions are recurring revenue, which investors value highly. Falling ARPU with fast growth usually means cheaper plans or cheaper countries, so a rise is worth noticing.' },
    adjEbitda: { t: 'Adjusted EBITDA (non-GAAP)', what: 'Earnings before interest, taxes, depreciation and amortization, with more items such as stock pay removed. It is the company’s own measure, not an official GAAP one, and it is not a profit.',
      hop: 'Base cart: $3,040 + $200 interest + $760 tax + $200 depreciation = $4,200. Second-cart version: −$700 + $300 + $0 + $900 + $300 of stock pay = +$800, while the month ends in a −$700 loss.',
      real: `Positive ${fB(X.ebitda)} on SpaceX’s own adjusted measure in the September quarter (${fP(X.ebitdaM)} of revenue), up from ${fB(X.ebitdaPq)} in June and ${fB(X.ebitdaYa)} a year earlier. GAAP net income: ${fB(xc.netInc)}.`,
      why: `Bulls use it to show earning power before investment. Bears point out it ignores the capex the business needs: ${fB(X.capex)} in the quarter, ${F.num(X.capexEbitda, 1)}× this number.` },
    capex: { t: 'Capex (capital expenditures)', what: 'Money spent on long-lasting things: satellites, rockets, factories, data centers.',
      hop: 'A new $600 grinder. Second-cart version: a new cart, a van and app servers, $9,000.',
      real: `${fM(X.capex)} in the September quarter (Super Intelligence ${fM(segOf('ai').capex)}, Starlink ${fM(segOf('conn').capex)}, Space ${fM(segOf('space').capex)}), after ${fM(X.capexPq)} in June and ${fM(X.capexYa)} a year earlier: ${F.num(X.capexEbitda, 1)}× adjusted EBITDA. Nine months: ${fM(X.capexYtd)}.`,
      why: `Management guided fourth-quarter capex to ${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}. More spending means more cash needed, from the IPO money, debt or new shares.` },
    ocf: { t: 'Operating cash flow', what: 'Cash the business itself brought in after paying suppliers, staff and taxes.',
      hop: '$3,040 in June. Second-cart version: $700.',
      real: `${fM(X.ocf9)} over the nine months to September 2026 (a year earlier: ${fM(X.ocf9Ya)}).`,
      why: 'Growing fast, but far below the capex.' },
    fcf: { t: 'Free cash flow', what: 'Operating cash flow minus capex: the cash left over, or missing, after investing.',
      hop: '$3,040 − $600 = $2,440. Second-cart version: $700 − $9,000 = −$8,300.',
      real: `${fM(X.ocf9)} − ${fM(X.capexYtd)} of capex = ${fM(X.fcf9)}, about ${fB(X.fcf9)} over nine months (our math).`,
      why: 'Negative free cash flow has to be covered by cash on hand, borrowing or selling shares. A profitable quarter does not change that by itself.' },
    burn: { t: 'Cash burn', what: 'How fast a company uses cash when free cash flow is negative.',
      hopTag: V2, hop: 'Burning $8,300 a month with $6,000 in the bank means Hoppy must raise money within a month.',
      real: `About ${fB(-X.fcf9)} in nine months, roughly ${fB(X.burnMonth)} a month on average (our math). Financing brought in ${sB(X.fin9)} over the same nine months, mostly the IPO (net proceeds ${fB(X.ipoNet)}).`,
      why: `A big cash pile buys time. On September 30, 2026 SpaceX held ${fB(X.cash)} of cash plus ${fB(X.ms)} of marketable securities.` },
    cash: { t: 'Cash and cash equivalents', what: 'Money in the bank and very safe short-term investments.',
      hopTag: V2, hop: '$6,000 in the register and bank. After selling 800 new shares at $40: $38,000.',
      real: `${fM(X.cash)} on September 30, 2026 (${fM(X.cashMid)} on June 30; ${fM(X.cash0)} at the end of 2025).`,
      why: 'Cash is the runway for the capex plan. A big cushion lowers the risk of having to sell more shares at a bad price.' },
    ms: { t: 'Marketable securities', what: 'Investments the company can sell quickly, mostly bonds.',
      hop: 'Spare cash parked in Treasury bills instead of the register.',
      real: `${fM(X.ms)} on September 30 (${fM(X.msMid)} on June 30; none at the end of 2025). Cash plus securities went from ${fB(X.cashSecMid)} to ${fB(X.cashSec)} in the quarter.`,
      why: 'Counts as near-cash when you work out net cash.' },
    ppe: { t: 'PP&amp;E', what: 'Property, plant and equipment: long-lasting physical assets, after depreciation.',
      hop: 'The cart and espresso machine: $12,000.',
      real: `${fM(X.ppe)}, up from ${fM(X.ppe0)} at the end of 2025: the capex showing up on the balance sheet.`,
      why: 'Capex turns cash into PP&amp;E. Investors want these assets to earn a good return; their depreciation then hits profit for years.' },
    gw: { t: 'Goodwill and intangibles', what: 'Goodwill: the extra paid for a company above the fair value of its identifiable net assets (assets minus liabilities). Intangibles: things like software, customer lists or licenses.',
      hop: 'If Hoppy paid $5,000 for a rival cart whose equipment minus debts is worth $3,000, $2,000 would be goodwill.',
      real: `Goodwill ${fM(X.gw)} on September 30, from ${fM(X.gwMid)} on June 30 and ${fM(X.gw0)} at the end of 2025: mostly the Cursor deal (closed ${SN.cursorClosed}). Intangibles ${fM(bsv('assets', 'intang', 'cur'))}.`,
      why: 'If an acquisition disappoints, goodwill can be written down, which creates a big one-time loss.' },
    otherA: { t: 'Other assets', what: 'Money customers owe, inventory, prepaid costs, leased equipment, digital assets and more.',
      hop: 'Beans and cups ($1,000) and an unpaid catering invoice ($800).',
      real: `${fM(X.otherA)} in total, including receivables of ${fM(bsv('assets', 'ar', 'cur'))}, inventory of ${fM(bsv('assets', 'inv', 'cur'))} and digital assets of ${fM(bsv('assets', 'digital', 'cur'))}.`,
      why: 'Receivables growing faster than sales can mean customers are slow to pay.' },
    debt: { t: 'Debt and finance leases', what: 'Money borrowed that must be repaid with interest, plus long-term equipment leases.',
      hop: 'The $5,000 cart loan.',
      real: `${fM(X.debt)} on September 30 (${fM(bsv('liabilities', 'debtCur', 'cur'))} due within a year), up from ${fM(X.debt0)} at the end of 2025. On the June-quarter call, the CFO said the IPO and a ${fB(Q2.bond, 0)} bond sale strengthened the balance sheet, with part of the bond money used to repay a ${fB(Q2.bridgeLoan, 0)} bridge loan.`,
      why: `Debt adds interest and must be refinanced. With more cash and securities than debt (net cash about ${fB(X.netCash)}), the risk is lower.` },
    defrev: { t: 'Deferred revenue', what: 'Cash customers paid in advance for something not yet delivered.',
      hop: '$300 of gift cards sold but not yet used.',
      real: `${fM(X.defrev)} (${fM(bsv('liabilities', 'defrevCur', 'cur'))} due within a year), up from ${fM(X.defrev0)} at the end of 2025.`,
      why: 'Prepaid orders are future revenue already in the bank. Growing deferred revenue is a good sign for the coming quarters.' },
    otherL: { t: 'Other liabilities', what: 'Bills owed to suppliers (accounts payable), wages and other costs owed but not yet paid.',
      hop: '$700 owed to the bean supplier.',
      real: `Accounts payable ${fM(bsv('liabilities', 'ap', 'cur'))}, accrued expenses ${fM(bsv('liabilities', 'accr', 'cur'))}, other ${fM(bsv('liabilities', 'ol', 'cur'))}.`,
      why: 'Normal for a business. A jump can mean the company is paying suppliers more slowly to save cash.' },
    pref: { t: 'Convertible preferred stock', what: 'Special shares early investors bought. They carried extra protections and could convert into common stock; until then they sat between debt and equity.',
      hopTag: V2, hop: 'A friend’s $5,000 of preferred shares turns into 200 regular shares when Hoppy sells stock to the public.',
      real: `${fM(X.pref0)} at the end of 2025, $0 by June 30, 2026: it had all converted into common stock, adding to paid-in capital.`,
      why: 'Conversion turns a claim that ranked ahead of common shareholders into ordinary shares. Equity rises, and so does the share count.' },
    apic: { t: 'Additional paid-in capital', what: 'Money investors paid for shares above their tiny par value. In plain words: money owners put in.',
      hopTag: V2, hop: 'The friend’s $5,000 plus $32,000 from 800 new shares at $40: $37,000 more paid in.',
      real: `${fM(X.apic)} on September 30, from ${fM(X.apicMid)} on June 30 and ${fM(X.apic0)} at the end of 2025. Most of the first-half jump came from the preferred converting (${fB(X.pref0)}) and the IPO’s net proceeds (${fB(X.ipoNet)}). It rose another ${fB(X.apic - X.apicMid)} in the third quarter.`,
      why: 'Paid-in capital is money owners handed over. It funds the plan; it is not profit.' },
    deficit: { t: 'Accumulated deficit', what: 'All past losses added up, minus any profits. The negative twin of retained earnings.',
      hopTag: V2, hop: 'Losing $700 a month for a year piles up an $8,400 accumulated deficit; a profitable month makes it smaller.',
      real: `${fM(X.def)} on September 30: ${fM(X.def0)} at the end of 2025, ${fM(X.defMid)} after the first-half losses, then ${fM(X.def - X.defMid)} smaller after the September-quarter profit.`,
      why: 'It shows how much the company has lost over its life so far. A profit shrinks it; investors want to see that continue.' },
    aoci: { t: 'Other comprehensive income', what: 'Gains and losses that skip the income statement for now, such as currency moves on foreign operations.',
      hop: 'Hoppy has none.',
      real: `${fM(bsv('equity', 'aoci', 'cur'))} (from ${fM(bsv('equity', 'aoci', 'prev'))} at the end of 2025).`,
      why: 'Usually small. It matters little for the stock.' },
    equity: { t: 'Shareholders’ equity', what: 'Assets minus liabilities (and minus preferred stock): what would be left for common shareholders on paper.',
      hop: '$19,800 − $6,000 = $13,800. In the second-cart version, selling 800 new shares at $40 lifts it to $45,800.',
      real: `${fM(X.eq)} on September 30, 2026, from ${fM(X.eqMid)} on June 30 and ${fM(X.eq0)} at the end of 2025.`,
      why: 'Book value jumped, but markets price a company on future cash, not on book value. Equity built from new money also means more shares.' },
    netCash: { t: 'Net cash', what: 'Cash and marketable securities minus all debt.',
      hop: '$6,000 of cash − the $5,000 cart loan = $1,000.',
      real: `${fM(X.cash)} + ${fM(X.ms)} − ${fM(X.debt)} ≈ ${fB(X.netCash)}. Current ratio ${F.num(X.cr, 1)} (${F.num(X.crMid, 1)} on June 30, ${F.num(X.cr0, 1)} at the end of 2025).`,
      why: 'Positive net cash means it could repay every loan today. It buys time for the capex plan.' },
    dilution: { t: 'Dilution', what: 'When a company issues more shares, so each existing share owns a smaller slice.',
      hop: '1,000 shares become 2,000. The same $3,040 profit becomes $1.52 a share instead of $3.04.',
      real: `Diluted average shares: ${F.num(xy.sh)}M a year earlier, ${F.num(xq.sh)}M in June, ${F.num(xc.sh)}M in September. Shares outstanding jumped with the preferred conversion, the IPO and other share issuance: Class A ${F.num(SO.classA[1])}M → ${F.num(SO.classA[0])}M and Class B ${F.num(SO.classB[1])}M → ${F.num(SO.classB[0])}M from December 31 to September 30. The release does not break the weighted-average change down.`,
      why: 'Per-share numbers can look better or worse just because the share count changed. Check the share count before comparing EPS across periods.' },
    wavg: { t: 'Weighted average shares', what: 'The average share count over the period, weighted by how long each share existed.',
      hop: '1,000 shares for half the month and 2,000 for the other half: an average of 1,500.',
      real: `${F.num(xc.sh)}M diluted (${F.num(xc.shBasic)}M basic) in the September quarter, against ${F.num(xq.sh)}M in June. Shares outstanding on September 30: about ${F.num(X.outCur)}M of Class A and B.`,
      why: 'EPS divides by this average, so shares issued during a quarter show up gradually.' },
    ipo: { t: 'IPO', what: 'When a private company first sells shares to the public and lists on an exchange.',
      hopTag: V2, hop: 'Hoppy sells 800 new shares at $40 to the public: $32,000 to pay for the new cart and the app.',
      real: `Priced at $${SX.ipo.priced} and opened at $${SX.ipo.open} on ${SX.ipo.exchange} on ${SX.ipo.firstTrade} (ticker ${SX.ticker}). Net proceeds ${fB(X.ipoNet)}. Reported as the largest IPO ever.`,
      why: 'The IPO funds the capex plan and creates a public price. It also starts the lockup clock.' },
    lockup: { t: 'Lockup', what: 'A period after an IPO when insiders and early investors agree not to sell. Releases can come in stages.',
      hopTag: V2, hop: 'Hoppy’s early investors promise not to sell their shares for six months.',
      real: `The first lockup release came on ${Q2.reaction.lockup.replace(/ \(.*$/, '')}, two days after the first earnings report; more releases follow later.`,
      why: `Each release can add shares for sale. Ahead of the first one, the stock fell ${fP(-Q2.reaction.nextDayPct)} on August 5 (reported), with capex the other reason.` },
    noPE: { t: 'Why P/E is still hard', what: 'P/E divides the price by a year of earnings per share. It needs profit over a full year.',
      hopTag: V2, hop: 'EPS of −$0.70: a $40 share price gives a P/E of about −57, a meaningless number.',
      real: `EPS was ${usd(xc.eps)} in the September quarter, but the nine months to September were still a loss (EPS ${usd(SX.is.ytd.eps)}), so a trailing P/E does not work yet.`,
      why: 'Investors lean on sales-based measures, such as price to sales, and on the path to steady profit.' },
    ps: { t: 'Price to sales (P/S)', what: 'Market value divided by a year of revenue.',
      hopTag: V2, hop: '2,000 shares × $40 = $80,000 of market value. A year of sales at the latest month’s pace: $19,200 × 12 = $230,400. P/S ≈ 0.35.',
      real: `Run rate: ${fM(xc.revenue)} × 4 = ${fB(X.runRate)} a year. Divide your market value by it; the tool above does it live.`,
      why: 'A high P/S says investors expect much bigger sales and healthy margins later. If growth slows, high-P/S stocks can fall hard.' },
    runRate: { t: 'Run rate', what: 'A recent period’s revenue scaled to a full year.',
      hop: '$19,200 in the latest month × 12 = $230,400.',
      real: `${fM(xc.revenue)} × 4 = ${fB(X.runRate)}. Management guided first-quarter 2027 revenue to ${fB(X.g1Lo, 0)}–${fB(X.g1Hi, 0)}; four quarters at the midpoint would be ${fB(X.g1Mid * 4, 0)}: a forecast, not a result.`,
      why: 'Fast growers are often valued on the run rate, because last year’s revenue is already out of date.' },
    impliedPE: { t: 'From P/S to P/E', what: 'P/E = P/S ÷ net margin. Pick the share of sales a company might steadily keep as profit, and you see what P/E today’s price implies.',
      hop: 'P/S of 0.35 at a 10% net margin = a P/E of about 3.5.',
      real: 'Set a market value and a margin above.',
      why: 'It turns a sales multiple into a question you can judge: how profitable must the company become, and how soon?' },
  };
  /* adjusted EBITDA bridge cards, built from SML.realco for either quarter */
  const BRIDGE_BASE = {
    'Net': { t: 'GAAP net result', what: 'The official bottom line under GAAP, the US accounting rules. The bridge starts here.', hop: '$3,040 for the month (second-cart version: −$700).', why: 'GAAP counts every cost and every gain. The adjusted measure adds some costs back and takes some gains out; the steps show which.' },
    'Depreciation': { t: 'Depreciation and amortization', what: 'The cost of equipment spread over the years it is used (depreciation), and the same for intangibles like software (amortization). No cash leaves in the period.', hop: 'The cart and machine lose about $200 of value a month. Second-cart version: $900 with the new cart, a van and app servers.', why: 'Satellites wear out and data centers age. Adding D&amp;A back ignores the cost of replacing them, and capex is far bigger than D&amp;A.' },
    'Stock-based': { t: 'Stock-based compensation', what: 'Paying employees in shares instead of cash.', hop: 'Second-cart version: the app developer takes $300 of her monthly pay in Hoppy’s shares.', why: 'No cash leaves today, but new shares dilute every owner. Many investors treat it as a real cost; adjusted numbers leave it out.' },
    'Acquisition-related stock': { t: 'Stock pay from the Cursor deal', what: 'Shares granted as part of buying a company, booked as pay.', hop: 'If Hoppy bought a rival cart and gave its owner $500 of shares to stay on, that would be acquisition-related stock pay.', why: 'Adjusted numbers call it one-time. It still created new shares that dilute owners.' },
    'Acquisition-related costs': { t: 'Acquisition costs', what: 'Bankers, lawyers and other costs of buying a company.', hop: 'Hoppy pays a lawyer $100 to buy a rival cart.', why: 'Small here, and usually treated as one-time.' },
    'Restructuring': { t: 'Restructuring', what: 'Costs of reorganizing, like closing sites or layoffs. Usually labelled one-time.', hop: 'Closing a slow kiosk costs $150 to break the lease.', why: 'Tiny here. When "one-time" charges show up year after year, they stop being one-time.' },
    'Interest expense': { t: 'Interest expense', what: 'Interest paid on debt.', hop: '$200 a month on the cart loan.', why: 'EBITDA ignores how a company is financed. That helps when comparing businesses, but lenders are paid in real cash.' },
    'Interest income': { t: 'Interest income', what: 'Interest earned on cash and investments.', hop: 'If the $6,000 in the bank earned 4% a year, that would be $20 a month.', why: 'Taken out because it is financing, not the business. Big IPO cash made this line large.' },
    'Other income': { t: 'Other income', what: 'Gains outside the main business, such as on stakes in other companies.', hop: 'Hoppy sells an old grinder for $50 more than its book value.', why: 'Taken out because it is not the business. It helped GAAP net income; the adjusted measure removes it.' },
    'Other expense': { t: 'Other expense', what: 'Losses outside the main business, such as on investments or currencies.', hop: 'Hoppy sells an old grinder for $50 less than its book value.', why: 'Added back because it is not the business. These items swing a lot from quarter to quarter.' },
    'Income tax benefit': { t: 'Income tax benefit', what: 'A tax credit that raised net income.', hop: 'A one-off $100 tax refund in Hoppy’s month.', why: 'Taken out: taxes depend on rules and past losses, so EBITDA leaves them out in both directions.' },
    'Income taxes': { t: 'Income taxes', what: 'Taxes on the period’s results.', hop: '$760 on the $3,800 profit before tax.', why: 'Added back: taxes depend on country rules and past losses, so EBITDA leaves them out to compare businesses.' },
  };
  function bridgeCard(name, v, per) {
    const key = Object.keys(BRIDGE_BASE).find((k) => name.indexOf(k) === 0) || 'Net';
    const b = BRIDGE_BASE[key], rev = SX.is[per].revenue, lab = per === 'cur' ? CQ : PQ;
    const first = key === 'Net';
    return { t: first ? (v >= 0 ? 'GAAP net income' : 'GAAP net loss') : b.t, what: b.what, hop: b.hop, whyLabel: 'Why investors argue', why: b.why,
      real: first ? `${sM(v)} in the ${lab}.` : `${v >= 0 ? '+' : NEG}${fM(Math.abs(v))} ${v >= 0 ? 'added back' : 'taken out'} in the ${lab} (${fP((Math.abs(v) / rev) * 100)} of revenue).` };
  }
  function adjCard(per) {
    if (per === 'cur') return SXC.adjEbitda;
    return Object.assign({}, SXC.adjEbitda, { real: `Positive ${fB(X.ebitdaPq)} on SpaceX’s own adjusted measure in June 2026, against a GAAP net loss of ${fM(xq.netInc)}: a ${fB(X.gapPq)} gap.`,
      why: `Analysts expected about ${fB(Q2.expectations.ebitda)} (reported), so it beat. Capex that quarter was ${fB(X.capexPq)}.` });
  }

  /* Apple / price lesson cards (used in the l-rc-price body) */
  const APC = {
    formula: { t: 'Price ≈ EPS × P/E', what: 'A share price is the yearly profit per share investors count (EPS) times how many dollars they pay for each $1 of it (the P/E multiple).',
      hop: 'If every month were like June, Hoppy earns $3.04 × 12 = $36.48 a share a year. At a P/E of 10, a share is worth $364.80.',
      real: `Trailing twelve-month EPS of ${usd(A.eps0)} (the four quarters through June 2026) × a P/E of about ${xx(A.pe0)} = ${usd(A.p0)}, the July 30, 2026 close.`,
      why: 'Every earnings report moves one or both dials. Results and guidance move EPS; growth, risk and interest rates move the multiple.' },
    surprise: { t: 'Expectations and surprise', what: 'Analysts publish forecasts before each report. Their average is the consensus. Above it is a beat; below it, a miss.',
      hop: 'Hoppy’s buyer expected June EPS of $2.80. It came in at $3.04, a $0.24 beat (about 8.6%).',
      real: `EPS of ${usd(A.eps)} against about ${usd(AEX.eps[0])}–${usd(AEX.eps[1])} expected (reported): a beat of ${usd(A.beatLo)}–${usd(A.beatHi)}. Revenue ${fB(AP.is.cur.revenue)} against about ${fB(AEX.revenue[0])}–${fB(AEX.revenue[1])}.`,
      why: 'The price already reflects the consensus, so only the surprise is news. Traders also watch the unofficial whisper number, which is often higher.' },
    guidance: { t: 'Guidance and forward EPS', what: 'Management’s forecast for the next quarter or year. It resets what investors expect future EPS to be.',
      hop: 'Road works will block Hoppy’s corner in July, so Hoppy says July EPS will be about $2.50, not the $3.00 buyers expected.',
      real: `For the September quarter Apple guided revenue growth of ${AG.revGrowth[0]}%–${AG.revGrowth[1]}% (about ${fB(A.gLo)}–${fB(A.gHi)}) when analysts expected about ${AEX.nextQtrGrowth}% (about ${fB(AEX.nextQtrRevenue, 0)}), and a ${AG.grossMargin[0]}%–${AG.grossMargin[1]}% gross margin including about ${AG.tariffRefundPts} point from tariff refunds.`,
      why: 'Guidance covers the quarters still to come, so it usually moves the price more than the quarter just reported.' },
    quality: { t: 'Temporary items, adjusted vs GAAP', what: 'Part of a result may be temporary: a refund, a legal win, an asset sale. Companies also publish adjusted numbers that leave some costs out.',
      hop: 'June’s profit included a $200 one-time insurance refund (after tax). Without it, EPS is $2.84, not $3.04.',
      real: `Tariff refunds added ${usd(AP.tariffRefund.eps)} to EPS and about ${AP.tariffRefund.grossMarginPts} points to gross margin, a temporary boost; the September-quarter guide still includes about ${AG.tariffRefundPts} point of refunds. Without them EPS was about ${usd(A.epsX)}, so the beat shrinks to ${usd(A.beatXLo)}–${usd(A.beatXHi)} (our math, assuming the estimates did not include the refunds).`,
      why: `Investors give less credit for profit that is temporary. At SpaceX, about ${fB(X.below)} of the September-quarter profit came from below the operating line, and adjusted EBITDA (positive ${fB(X.ebitda)} on its own measure) tells yet another story.` },
    multiple: { t: 'Multiple expansion and contraction', what: 'The P/E rises (expands) when investors expect faster growth or less risk, and falls (contracts) when they expect slower growth, more risk or higher interest rates.',
      hop: 'At 12× instead of 10×, the same $36.48 of yearly EPS is worth $437.76 a share instead of $364.80.',
      real: `On July 31, 2026 the trailing EPS stayed ${usd(A.eps0)}, but the price fell from ${usd(A.p0)} to about $${F.num(A.p1, 0)}: the P/E went from about ${xx(A.pe0)} to about ${xx(A.pe1)}.`,
      why: `A fall of about ${F.num(A.peDrop, 1)} points in the multiple moved Apple’s price about ${fP(-AR.closePct)}. At a high P/E, changes in mood move the price more than the quarter’s profit.` },
    ttm: { t: 'Trailing vs forward P/E', what: 'Trailing (TTM) P/E uses the last four reported quarters of EPS. Forward P/E uses the EPS analysts expect over the next twelve months.',
      hop: 'At $360 a share, with $30 of EPS over the last 12 months and $36 expected over the next 12: trailing P/E 12, forward P/E 10.',
      real: `At ${usd(A.p0)}, Apple’s trailing P/E was about ${xx(A.pe0)} on ${usd(A.eps0)} of TTM EPS. Its forward P/E depends on analysts’ estimates, which change after every report; check a current source.`,
      why: 'Growing companies look cheaper on forward P/E. When guidance cuts forward EPS, the forward P/E jumps even before the price moves.' },
    mcap: { t: 'Market cap', what: 'Share price × number of shares: what the market values the whole company at.',
      hop: '1,000 shares × $364.80 = $364,800.',
      real: `About $${F.num(A.mcap0 / 1e6, 1)} trillion at ${usd(A.p0)} (× about ${F.num(A.sh / 1000, 2)} billion shares, the June quarter’s average count; our math). The July 31 drop erased about $${F.num(Math.round(A.mcapDrop / 10000) * 10, 0)} billion.`,
      why: 'A move in a company this large shows up in the S&amp;P 500 and in every index fund that holds it.' },
  };

  function cardHTML(c, realLabel) {
    if (!c) return '';
    return nb(`<div class="rcx-ch"><span class="rcx-ct">${c.t}</span>${c.hopTag ? `<span class="rcx-tag">Hoppy’s ${c.hopTag}</span>` : ''}<span class="rcx-tap">Tap the chart for other terms</span></div>
      <div><span class="rcx-k">What it is</span><p>${c.what}</p></div>
      <div><span class="rcx-k hop">At Hoppy’s cart${c.hopTag ? ' (' + c.hopTag + ')' : ''}</span><p>${c.hop}</p></div>
      <div><span class="rcx-k real">${realLabel || 'At SpaceX'}</span><p>${c.real}</p></div>
      <div><span class="rcx-k why">${c.whyLabel || 'Why it matters for the stock'}</span><p>${c.why}</p></div>`);
  }
  /* static version for lesson bodies */
  function tcard(c, realLabel) {
    return nb(`<div class="rcx-tc"><div class="rcx-tc-h"><span class="n">${c.t}</span>${c.hopTag ? `<span class="rcx-tag">Hoppy’s ${c.hopTag}</span>` : ''}</div><dl>
      <div><dt>What it is</dt><dd>${c.what}</dd></div>
      <div><dt class="hop">At Hoppy’s cart${c.hopTag ? ' (' + c.hopTag + ')' : ''}</dt><dd>${c.hop}</dd></div>
      <div><dt class="real">${realLabel || 'At SpaceX'}</dt><dd>${c.real}</dd></div>
      <div><dt class="why">${c.whyLabel || 'Why it matters for the stock'}</dt><dd>${c.why}</dd></div></dl></div>`);
  }

  /* ---------------- shared drawing helpers ---------------- */
  const reads = (el, arr) => { if (el) el.innerHTML = arr.map((r) => `<div class="stat${r[3] ? ' hl' : ''}"><span class="stat-l">${r[0]}</span><span class="stat-v${r[2] ? ' ' + r[2] : ''}">${r[1]}</span></div>`).join(''); };
  const msgTo = (el, cls, pill, html) => { if (el) el.innerHTML = ui.msg(cls, pill, nb(html)); };
  const hit = (x, y, w, h, k, label) => S.rect(x, y, w, h, 'hit rcx-hit', 0, ` data-k="${k}" tabindex="0" role="button" aria-label="${E(plain(label))}"`);

  /* per-widget animation runner (cancels on cleanup and on restart) */
  function animator() {
    let raf = 0, alive = true;
    SML.onCleanup(() => { alive = false; cancelAnimationFrame(raf); });
    return {
      run(ms, frame, done) {
        cancelAnimationFrame(raf);
        if (SML.reduced() || !alive) { frame(1); if (done) done(); return; }
        const t0 = performance.now();
        const step = (now) => {
          if (!alive) return;
          const t = Math.min(1, (now - t0) / ms);
          frame(ease(t));
          if (t < 1) raf = requestAnimationFrame(step); else if (done) done();
        };
        raf = requestAnimationFrame(step);
      },
      stop() { cancelAnimationFrame(raf); },
    };
  }

  /* Horizontal rows (waterfall or plain bars).
     o: {W, x0, x1, y0, rowH, labX, dom, compact, rows, fmt, bh, zero}
     row: {k, l, v, abs, from, c, b, hide, frac, sel, val, ghost, sep} */
  function hRows(o) {
    const x = SML.lin(o.dom[0], o.dom[1], o.x0, o.x1);
    const fs = o.compact ? 11.5 : 13, bh = o.bh || Math.round(o.rowH * 0.56);
    const fmt = o.fmt || sM;
    let s = '', run = 0, hasPrev = false;
    const n = o.rows.length, bottom = o.y0 + n * o.rowH;
    o.rows.forEach((r, i) => { if (r.sel) s += S.rect(1, o.y0 + i * o.rowH + 1, o.W - 2, o.rowH - 2, 'rcx-sel', 4); });
    if (o.zero !== false && o.dom[0] < 0) s += S.line(x(0), o.y0 - 2, x(0), bottom + 2, 's-mut');
    o.rows.forEach((r, i) => {
      const yy = o.y0 + i * o.rowH, cy = yy + o.rowH / 2;
      if (r.sep) s += S.line(4, yy, o.W - 4, yy, 's-line dash2');
      s += S.text(o.labX, cy + 4, r.l, (o.compact ? 'sm' : 'md') + (r.b ? ' b' : '') + (r.hide ? ' mut' : ' ink'), 'end');
      if (r.hide) { s += S.text(o.x0 + 6, cy + 4, '?', 'md b mut'); return; }
      const a = r.from != null ? r.from : r.abs ? 0 : run;
      const f = r.frac == null ? 1 : r.frac;
      const b = a + r.v * f;
      if (r.ghost != null) { const ga = Math.min(a, a + r.ghost), gb = Math.max(a, a + r.ghost); s += S.rect(x(ga), cy - bh / 2, Math.max(1, x(gb) - x(ga)), bh, 'rcx-ghost', 2); }
      if (!r.abs && r.from == null && hasPrev) s += S.line(x(a), cy - o.rowH + bh / 2, x(a), cy - bh / 2, 's-mut dash2');
      const xa = x(Math.min(a, b)), xb = x(Math.max(a, b));
      s += S.rect(xa, cy - bh / 2, Math.max(1.5, xb - xa), bh, 'f-' + (r.c || 'info'), 2);
      const lab = r.val != null ? r.val : r.abs ? String(fmt(r.v * f)).replace(/^\+/, '') : fmt(r.v * f);
      const wv = tw(lab, fs, true) + 2;
      const lc = (o.compact ? 'sm' : 'md') + ' mono b ';
      const tone = r.v < 0 ? 'dn' : r.abs ? 'ink' : 'up';
      if (xb + 6 + wv <= o.W - 2) s += S.text(xb + 6, cy + 4.5, lab, lc + tone);
      else if (xa - 6 - wv >= o.x0) s += S.text(xa - 6, cy + 4.5, lab, lc + tone, 'end');
      else s += S.text((xa + xb) / 2, cy + 4.5, lab, lc + 'on', 'middle');
      if (!r.noRun) { run = r.abs ? r.v : a + r.v; hasPrev = true; }
    });
    o.rows.forEach((r, i) => { if (r.k && !r.hide) s += hit(0, o.y0 + i * o.rowH, o.W, o.rowH, r.k, r.l); });
    return { s, x, run, bottom };
  }

  /* small vertical bar chart. items: [{l, v, c, txt, k}] */
  function miniBars(x0, y0, w, h, title, items) {
    const vals = items.map((it) => it.v);
    const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
    const two = items.some((it) => String(it.l).indexOf('\n') >= 0);
    const top = y0 + 30, bot = y0 + h - 18 - (two ? 11 : 0) - (lo < 0 ? 14 : 0);
    const y = SML.lin(lo, hi || 1, bot, top);
    const n = items.length, slot = w / n, bw = Math.min(34, slot * 0.56);
    let s = S.text(x0, y0 + 10, title, 'cap');
    s += S.line(x0, y(0), x0 + w, y(0), 's-mut');
    items.forEach((it, i) => {
      const cx = x0 + slot * (i + 0.5), a = y(Math.max(0, it.v)), b = y(Math.min(0, it.v));
      s += S.rect(cx - bw / 2, a, bw, Math.max(1.5, b - a), 'f-' + (it.c || 'info'), 2);
      s += S.text(cx, it.v >= 0 ? a - 5 : b + 13, it.txt, 'sm mono b ' + (it.v < 0 ? 'dn' : 'ink'), 'middle');
      String(it.l).split('\n').reverse().forEach((ln, j) => { s += S.text(cx, y0 + h - 3 - j * 11, ln, 'xs', 'middle'); });
    });
    return s;
  }

  /* ======================================================================
     growthVsProfit: SpaceX's latest reported quarter (Sep 2026), with June 2026 and Sep 2025 as contrasts.
     opts.part: 'quarter' (default: income, segments, adj. EBITDA, cash) | 'ipo' (balance sheet, shares, P/S) | 'all'
     ====================================================================== */
  const TABS = { inc: 'Loss to profit', seg: 'Segments', ebitda: 'Adj. EBITDA', cash: 'Cash burn', bs: 'Balance sheet', shares: 'Shares', ps: 'Price to sales' };
  const SEGN = { conn: 'Starlink (Connectivity)', ai: 'Super Intelligence', space: 'Space', total: 'SpaceX total' };
  const SEGS = { conn: 'Starlink', ai: 'Super\nIntel.', space: 'Space' };
  const BRLAB = {
    'Net income': ['GAAP net income', 'Net income'], 'Net loss': ['GAAP net loss', 'Net loss'],
    'Depreciation & amortization': ['+ Depreciation &amp; amortization', '+ D&amp;A'], 'Stock-based compensation': ['+ Stock-based pay', '+ Stock pay'],
    'Acquisition-related stock compensation': ['+ Stock pay from the Cursor deal', '+ Cursor stock pay'], 'Acquisition-related costs': ['+ Acquisition costs', '+ Deal costs'],
    'Restructuring': ['+ Restructuring', '+ Restructuring'], 'Interest expense': ['+ Interest expense', '+ Interest paid'], 'Interest income': ['− Interest income', '− Interest earned'],
    'Other income': ['− Other income', '− Other income'], 'Other expense': ['+ Other expense', '+ Other expense'],
    'Income tax benefit': ['− Tax benefit', '− Tax benefit'], 'Income taxes': ['+ Income taxes', '+ Taxes'],
  };
  const brLab = (name, compact) => (BRLAB[name] || [E(name), E(name)])[compact ? 1 : 0];
  const PERL = { cur: 'Sep 2026', pq: 'Jun 2026', ya: 'Sep 2025' };

  SML.widgets.growthVsProfit = function (root, opts) {
    opts = opts || {};
    root.classList.add('rcx');
    const id = SML.uid('gvp');
    const part = opts.part || 'quarter';
    const keys = part === 'ipo' ? ['bs', 'shares', 'ps'] : part === 'all' ? Object.keys(TABS) : ['inc', 'seg', 'ebitda', 'cash'];
    const tab0 = keys.indexOf(opts.tab) >= 0 ? opts.tab : keys[0];
    const has = (k) => keys.indexOf(k) >= 0;
    const sel = { inc: 'net', seg: 'conn', cash: 'capex', bs: 'equity', shares: 'dilution', ps: 'ps' };
    let step = 0, stepFrac = 1, bsT = 2, lastTab = null;
    const INC = (per) => { const p = SX.is[per]; return [p.revenue, -p.cost, p.gross, -p.rd, -(p.sga + p.restructuring + (p.impairment || 0)), p.opInc, p.intExp + p.intInc, p.other, -p.tax, p.netInc]; };
    let incVals = INC('cur');
    const anim = animator();
    const brPer = () => st.seg(id + '-brp') || 'cur';
    const bridge = () => (brPer() === 'cur' ? BR3 : BR2);

    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', keys.map((k) => ({ v: k, label: TABS[k] })), tab0, 'View')}<span class="grow"></span><span class="pill">SpaceX · latest: Sep 2026 quarter</span></div>
      <div class="wg-bar rcx-bar2" id="${id}-sub">
        ${has('inc') ? `<div class="rcx-c" data-t="inc"><span class="rcx-lab">Quarter</span>${ui.seg(id + '-per', [{ v: 'cur', label: 'Sep 2026' }, { v: 'pq', label: 'Jun 2026' }, { v: 'ya', label: 'Sep 2025' }], 'cur', 'Quarter')}</div>` : ''}
        ${has('seg') ? `<div class="rcx-c" data-t="seg"><span class="rcx-lab">Show</span>${ui.seg(id + '-lens', [{ v: 'op', label: 'Operating income' }, { v: 'ebitda', label: 'Adj. EBITDA' }, { v: 'capex', label: 'Capex' }, { v: 'growth', label: 'Growth' }], 'op', 'Measure')}</div>` : ''}
        ${has('ebitda') ? `<div class="rcx-c" data-t="ebitda">${ui.seg(id + '-brp', [{ v: 'cur', label: 'Sep 2026' }, { v: 'pq', label: 'Jun 2026' }], 'cur', 'Bridge quarter')}<span class="rcx-lab" id="${id}-stn">Step 1</span><span class="rcx-dots" id="${id}-dots"></span></div>` : ''}
        ${has('bs') ? `<div class="rcx-c" data-t="bs">${ui.seg(id + '-dt', [{ v: 'prev', label: 'Dec 31, 2025' }, { v: 'mid', label: 'Jun 30, 2026' }, { v: 'cur', label: 'Sep 30, 2026' }], 'cur', 'Balance sheet date')}<button type="button" class="btn btn-g sm" data-act="ipo">Play the year</button></div>` : ''}
        ${has('ps') ? `<div class="rcx-c" data-t="ps"><span class="rcx-lab">Yearly sales</span>${ui.seg(id + '-basis', [{ v: 'run', label: 'Latest quarter × 4' }, { v: 'guide', label: 'Q1 2027 guide × 4' }], 'run', 'Revenue basis')}</div>` : ''}
      </div>
      <div class="wg-fig"></div>
      ${has('shares') || has('ps') ? `<div class="wg-ctrl rcx-c" data-t="shares ps">
        ${has('shares') ? `<div class="rcx-c" data-t="shares">${ui.slider({ id: id + '-ni', label: 'Net result to split (what if)', min: -2000, max: 6000, step: 1, value: xc.netInc, fmt: (v) => sM(v) })}</div>` : ''}
        ${has('ps') ? `<div class="rcx-c" data-t="ps">${ui.slider({ id: id + '-mv', label: 'Market value you assume', min: 100, max: 3000, step: 10, value: 1000, fmt: (v) => '$' + F.num(v, 0) + 'B' })}</div>
        <div class="rcx-c" data-t="ps">${ui.slider({ id: id + '-nm', label: 'Steady net margin someday (what if)', min: 5, max: 40, step: 1, value: 20, fmt: (v) => v + '%' })}</div>` : ''}
      </div>` : ''}
      ${has('ebitda') ? `<div class="wg-actions rcx-actions rcx-c" data-t="ebitda"><button type="button" class="btn btn-g sm" data-act="back">◀ Back</button><button type="button" class="btn btn-p sm" data-act="next">Next add-back ▶</button><button type="button" class="btn btn-g sm" data-act="all">Show all</button><button type="button" class="btn btn-g sm" data-act="restart">Start over</button></div>` : ''}
      <div class="rcx-card" id="${id}-card" aria-live="polite"></div>
      <div class="wg-read" id="${id}-rd"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;

    const fig = root.querySelector('.wg-fig');
    const card = $id(id + '-card'), rd = $id(id + '-rd'), msg = $id(id + '-msg'), note = $id(id + '-note');
    const DTI = { prev: 0, mid: 1, cur: 2 };
    const st = ui.wire(root, (e) => {
      const t = e && e.target, segEl = t && t.closest ? t.closest('.seg') : null;
      if (segEl && segEl.id === id + '-per') {
        const to = INC(st.seg(id + '-per')), from = incVals.slice();
        anim.run(650, (k) => { incVals = from.map((v, i) => lerp(v, to[i], k)); draw(); });
        return;
      }
      if (segEl && segEl.id === id + '-dt') {
        const target = DTI[st.seg(id + '-dt')] != null ? DTI[st.seg(id + '-dt')] : 2, from = bsT;
        anim.run(800, (k) => { bsT = lerp(from, target, k); draw(); });
        return;
      }
      if (segEl && segEl.id === id + '-brp') { step = 0; stepFrac = 1; }
      draw();
    });
    const tab = () => st.seg(id + '-t') || tab0;

    function setStep(n, animate) {
      step = clamp(n, 0, bridge().length);
      if (animate) anim.run(480, (k) => { stepFrac = k; draw(); });
      else { stepFrac = 1; draw(); }
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b && root.contains(b)) {
        const a = b.dataset.act;
        if (a === 'next') setStep(step + 1, true);
        else if (a === 'back') setStep(step - 1, false);
        else if (a === 'all') setStep(bridge().length, false);
        else if (a === 'restart') setStep(0, false);
        else if (a === 'ipo') { st.setSeg(id + '-dt', 'cur'); bsT = 0; draw(); anim.run(2400, (k) => { bsT = 2 * k; draw(); }); }
        return;
      }
      const h = e.target.closest('[data-k]');
      if (h && fig.contains(h)) pick(h.dataset.k);
    });
    fig.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const h = e.target.closest && e.target.closest('[data-k]');
      if (h) { e.preventDefault(); pick(h.dataset.k); }
    });
    function pick(k) {
      const tb = tab();
      if (tb === 'ebitda') { const m = /^b(\d+)$/.exec(k); if (m) setStep(Number(m[1]), false); else if (k === 'adj') setStep(bridge().length, false); return; }
      sel[tb] = k; draw();
    }

    /* ---------- tab: income statement, loss to profit ---------- */
    function drawInc(W) {
      const compact = W < 560, per = st.seg(id + '-per') || 'cur';
      const p = SX.is[per], v = incVals;
      const L = [
        ['revenue', 'Revenue', 'Revenue', true, 'info'],
        ['cost', 'Cost of revenue', 'Cost of rev.', false],
        ['gross', 'Gross profit', 'Gross profit', true, 'up'],
        ['rd', 'R&amp;D', 'R&amp;D', false],
        ['sga', 'SG&amp;A and other', 'SG&amp;A, other', false],
        ['op', v[5] >= 0 ? 'Operating income' : 'Operating loss', v[5] >= 0 ? 'Op. income' : 'Op. loss', true],
        ['interest', 'Net interest', 'Net interest', false],
        ['other', v[7] >= 0 ? 'Other income' : 'Other expense', v[7] >= 0 ? 'Other inc.' : 'Other exp.', false],
        ['tax', v[8] >= 0 ? 'Tax benefit' : 'Income taxes', v[8] >= 0 ? 'Tax benefit' : 'Taxes', false],
        ['net', v[9] >= 0 ? 'Net income' : 'Net loss', v[9] >= 0 ? 'Net income' : 'Net loss', true],
      ];
      const cmp = per === 'cur' ? SX.is.ya : per === 'pq' ? SX.is.ya2 : null;
      const labW = compact ? 92 : 156, yoyW = compact || !cmp ? 0 : 70;
      const rowH = compact ? 28 : 31, y0 = 26;
      let s = '';
      /* violet band: below the operating line */
      s += S.rect(1, y0 + 6 * rowH + 1, W - 2, 3 * rowH - 2, 'rcx-band', 4);
      const rows = L.map((l, i) => ({ k: l[0], l: compact ? l[2] : l[1], v: v[i], abs: l[3], b: l[3], c: l[4] || (v[i] >= 0 ? 'up' : 'dn'), sel: sel.inc === l[0] }));
      const x1 = W - yoyW - (compact ? 6 : 64);
      const r = hRows({ W: W - yoyW, x0: labW + 10, x1, y0, rowH, labX: labW, dom: [-1700, 15500], compact, rows, fmt: (q) => sM(q) });
      s += S.text(compact ? 4 : labW + 10, 12, (compact ? PERL[per].toUpperCase() + ' QTR' : PERL[per].toUpperCase() + ' QUARTER') + ' · $ MILLIONS', 'cap');
      s += r.s;
      const belowNow = v[6] + v[7] + v[8];
      if (!compact) { const bl = `BELOW THE OPERATING LINE ${sM(belowNow)}`; s += S.text(x1, y0 + 6 * rowH + 13, bl, 'cap vio', 'end'); s += hit(x1 - tw(bl, 10.5, true) - bl.length * 1.7, y0 + 6 * rowH + 2, tw(bl, 10.5, true) + bl.length * 1.7, 14, 'belowLine', 'Below the operating line'); }
      if (cmp && yoyW) {
        const b0 = INC(per === 'cur' ? 'ya' : 'ya2'), a0 = INC(per);
        s += S.text(W - 4, 12, per === 'cur' ? 'VS SEP 2025' : 'VS JUN 2025', 'cap', 'end');
        rows.forEach((row, i) => {
          const a = a0[i], b = b0[i], cy = y0 + i * rowH + rowH / 2 + 4;
          let t, c;
          if (a > 0 && b > 0) { t = sP(pc(a, b)); c = i === 0 || i === 2 || i === 5 || i === 9 ? 'up' : 'mut'; }
          else if (a < 0 && b < 0 && (i === 5 || i === 9)) { t = a > b ? 'smaller' : 'bigger'; c = a > b ? 'up' : 'dn'; }
          else if (a < 0 && b < 0) { t = sP(pc(-a, -b)); c = 'mut'; }
          else { t = a > b ? 'better' : 'worse'; c = a > b ? 'up' : 'dn'; }
          s += S.text(W - 4, cy, t, 'sm mono b ' + c, 'end');
        });
      }
      const yE = y0 + rows.length * rowH + 22;
      s += S.text(labW, yE, 'EPS', (compact ? 'sm' : 'md') + ' b ink', 'end');
      const eq = compact ? `${fM(p.netInc)} ÷ ${F.num(p.sh)}M = ` : `${fM(p.netInc)} ÷ ${F.num(p.sh)}M ${per === 'cur' ? 'diluted ' : ''}shares = `;
      s += S.text(labW + 10, yE, eq, (compact ? 'sm' : 'md') + ' mono ink');
      s += S.text(labW + 10 + tw(eq, compact ? 11.5 : 13, true), yE, usd(p.eps), (compact ? 'md' : 'lg') + ' mono b ' + (p.eps >= 0 ? 'up' : 'dn'));
      s += hit(0, yE - 16, W, 24, 'eps', 'EPS');
      let H = yE + 10;
      if (compact) { H += 16; const bl = `Violet band: below the operating line ${sM(belowNow)}`; s += S.text(4, H - 6, bl, 'sm b vio'); s += hit(0, H - 20, W, 22, 'belowLine', 'Below the operating line'); H += 4; }
      fig.innerHTML = S.wrap(W, H, `SpaceX income statement for the ${PERL[per]} quarter as a waterfall from revenue to net result`, s);
      reads(rd, [['Revenue', fM(p.revenue), '', true], ['Gross margin', fP((p.gross / p.revenue) * 100)], ['Operating margin', fP((p.opInc / p.revenue) * 100), p.opInc >= 0 ? 'up' : 'dn'], [p.netInc >= 0 ? 'Net income' : 'Net loss', sM(p.netInc), p.netInc >= 0 ? 'up' : 'dn'], [per === 'cur' ? 'EPS (diluted)' : 'EPS', usd(p.eps), p.eps >= 0 ? 'up' : 'dn']]);
      if (per === 'cur') msgTo(msg, 'up', 'Loss to profit', `Revenue grew ${fP(X.yoy, 0)} to ${fB(X.rev)} and operating income reached ${sB(xc.opInc)} (${fP(X.om)} of revenue): the first profitable quarter as a public company. Net income was ${fB(xc.netInc)}, but about ${fB(X.below)} of it came from below the operating line (the violet band): other income, net interest and a tax benefit. The operating part is the profit that can repeat.`);
      else if (per === 'pq') msgTo(msg, 'dn', 'The loss before', `June 2026, the first report as a public company: revenue ${fB(X.revPq)}, but R&amp;D used ${fP(X.rdOfGrossPq, 0)} of gross profit, so the operating line was a loss of ${fM(xq.opInc)} and the net loss ${fM(xq.netInc)}. Three months later, revenue had nearly doubled while costs grew far less.`);
      else msgTo(msg, 'dn', 'A year earlier', `September 2025: revenue ${fB(X.revYa)}, an operating loss of ${fM(xy.opInc)} and a net loss of ${fM(xy.netInc)}, including a ${fM(xy.tax)} tax expense. Switch to Sep 2026 to watch every line change.`);
    }

    /* ---------- tab: segments ---------- */
    const LENS = {
      op: { title: 'OPERATING INCOME', v: (s) => s.opInc, tot: xc.opInc, dom: [-450, 3100], c: (v) => (v >= 0 ? 'up' : 'dn'), f: (v) => sM(v) },
      ebitda: { title: 'ADJUSTED EBITDA', v: (s) => s.ebitda, tot: X.ebitda, dom: [0, 9300], c: (v) => (v >= 0 ? 'up' : 'dn'), f: (v) => sM(v) },
      capex: { title: 'CAPEX', v: (s) => s.capex, tot: X.capex, dom: [0, 20500], c: () => 'dn', f: (v) => fM(v) },
      growth: { title: 'REVENUE GROWTH, YEAR OVER YEAR', v: (s) => pc(s.revenue, segOf(s.k, 'ya').revenue), tot: X.yoy, dom: [0, 900], c: () => 'info', f: (v) => sP(v, 0) },
    };
    function drawSeg(W) {
      const compact = W < 560, lens = st.seg(id + '-lens') || 'op', LD = LENS[lens];
      const rows = SX.segments.cur.map((s) => ({ k: s.k, rev: s.revenue, yoy: pc(s.revenue, segOf(s.k, 'ya').revenue), v: LD.v(s), m: (s.opInc / s.revenue) * 100 }));
      rows.push({ k: 'total', rev: xc.revenue, yoy: X.yoy, v: LD.tot, m: X.om, total: true });
      const rowH = compact ? 70 : 52, y0 = 24, labW = compact ? 0 : 238;
      const x0 = compact ? 10 : labW + 10, x1 = W - (compact ? 10 : 112);
      const x = SML.lin(LD.dom[0], LD.dom[1], x0, x1);
      let s = S.text(compact ? 8 : x0, 12, LD.title + (compact ? '' : ' · SEPTEMBER 2026 QUARTER'), 'cap');
      rows.forEach((r, i) => { if (sel.seg === r.k) s += S.rect(1, y0 + i * rowH + 1, W - 2, rowH - 2, 'rcx-sel', 4); });
      if (LD.dom[0] < 0) rows.forEach((r, i) => { const yy = y0 + i * rowH; s += compact ? S.line(x(0), yy + 40, x(0), yy + 62, 's-mut') : S.line(x(0), yy + 6, x(0), yy + rowH - 6, 's-mut'); });
      rows.forEach((r, i) => {
        const yy = y0 + i * rowH;
        if (r.total) s += S.line(4, yy, W - 4, yy, 's-line dash2');
        const sub = `${fM(r.rev)} revenue · ${sP(r.yoy, 0)} YoY`;
        let cy;
        if (compact) { s += S.text(8, yy + 17, SEGN[r.k], 'md b ink') + S.text(8, yy + 33, sub, 'xs mono'); cy = yy + 51; }
        else { s += S.text(8, yy + 22, SEGN[r.k], 'md b ink') + S.text(8, yy + 38, sub, 'sm mono'); cy = yy + rowH / 2; }
        const bh = compact ? 14 : 18, a = x(Math.min(0, r.v)), b = x(Math.max(0, r.v));
        s += S.rect(a, cy - bh / 2, Math.max(1.5, b - a), bh, 'f-' + LD.c(r.v), 2);
        let lab = LD.f(r.v); if (lens === 'op') lab += ` (${fP(r.m)})`;
        const fs = compact ? 11.5 : 13, wv = tw(lab, fs, true), cls = (compact ? 'sm' : 'md') + ' mono b ';
        if (r.v >= 0) { if (b + 6 + wv <= W - 2) s += S.text(b + 6, cy + 4.5, lab, cls + 'ink'); else s += S.text(b - 6, cy + 4.5, lab, cls + 'on', 'end'); }
        else if (a - 6 - wv >= x0) s += S.text(a - 6, cy + 4.5, lab, cls + 'dn', 'end');
        else s += S.text(b + 6, cy + 4.5, lab, cls + 'dn');
      });
      rows.forEach((r, i) => { s += hit(0, y0 + i * rowH, W, rowH, r.k, SEGN[r.k]); });
      /* close-up panel */
      const py = y0 + rows.length * rowH + 18, ph = compact ? 160 : 146, gap = 28, cw = (W - 16 - gap) / 2;
      const per3 = ['Sep 25', 'Jun 26', 'Sep 26'];
      const r3 = (arr) => [arr[2], arr[1], arr[0]];
      const segItems = (f, c) => ['conn', 'ai', 'space'].map((q) => ({ l: SEGS[q], v: f(segOf(q)), c: c(f(segOf(q)), q), txt: sMB(f(segOf(q))) }));
      let c1, c2;
      const k = sel.seg;
      if (k === 'conn') {
        c1 = ['CONSUMER SUBS', r3(MT.subs).map((v, i) => ({ l: per3[i], v, c: 'info', txt: F.num(v, 1) + 'M' }))];
        c2 = ['ARPU, $/MONTH', r3(MT.arpu).map((v, i) => ({ l: per3[i], v, c: 'acc', txt: '$' + v }))];
      } else if (k === 'ai') {
        c1 = ['COMPUTE, GW', r3(MT.computeGW).map((v, i) => ({ l: per3[i], v, c: 'vio', txt: F.num(v, 1) }))];
        c2 = ['CAPEX, SEP QTR', segItems((s) => s.capex, (v, q) => (q === 'ai' ? 'dn' : 'shade2')).map((it) => Object.assign(it, { txt: fMB(it.v) }))];
      } else if (k === 'space') {
        c1 = ['LAUNCHES', r3(MT.launches).map((v, i) => ({ l: per3[i], v, c: 'info', txt: String(v) }))];
        c2 = ['OP. INCOME', ['ya', 'pq', 'cur'].map((pp, i) => ({ l: per3[i], v: segOf('space', pp).opInc, c: segOf('space', pp).opInc >= 0 ? 'up' : 'dn', txt: sM(segOf('space', pp).opInc) }))];
      } else {
        c1 = ['OP. INCOME', segItems((s) => s.opInc, (v) => (v >= 0 ? 'up' : 'dn'))];
        c2 = ['ADJ. EBITDA', segItems((s) => s.ebitda, (v) => (v >= 0 ? 'up' : 'dn'))];
      }
      s += S.text(8, py - 2, (k === 'total' ? 'WHO EARNS WHAT' : (k === 'ai' ? 'SUPER INTELLIGENCE' : SEGN[k].split(' (')[0].toUpperCase()) + ' UP CLOSE'), 'cap acc');
      s += miniBars(8, py + 8, cw, ph, c1[0], c1[1]) + miniBars(8 + cw + gap, py + 8, cw, ph, c2[0], c2[1]);
      const H = py + 8 + ph + 4;
      fig.innerHTML = S.wrap(W, H, 'SpaceX segments in the September 2026 quarter: Starlink, Super Intelligence and Space, with revenue, growth and the chosen measure, plus a close-up of the selected segment', s);
      reads(rd, [['Starlink op. margin', fP(X.connOm), 'up', true], ['Super Intel. op. income', sM(segOf('ai').opInc), 'up'], ['Space op. income', fM(segOf('space').opInc), 'dn'], ['Consumer subscribers', F.num(MT.subs[0], 1) + 'M'], ['Consumer ARPU', '$' + MT.arpu[0] + '/mo']]);
      const lm = {
        op: `Starlink earned ${sM(segOf('conn').opInc)}, about ${fP(X.connShareOp, 0)} of the company’s operating income. Super Intelligence earned ${sM(segOf('ai').opInc)} after ${fM(SN.cursorStockComp)} of stock pay from the Cursor deal, and Space was close to break-even (${fM(segOf('space').opInc)}).`,
        ebitda: `On adjusted EBITDA, Super Intelligence leads with ${sM(segOf('ai').ebitda)}, because the measure adds back depreciation on all the new computing gear and the Cursor stock pay.`,
        capex: `Super Intelligence took ${fM(segOf('ai').capex)} of the ${fM(X.capex)} of capex: ${fP(X.siCapexShare, 0)}. That is the bet the market is pricing.`,
        growth: `Super Intelligence revenue grew ${fP(X.siYoy, 0)} (Cursor added ${fM(SN.cursorRevenue)}), Starlink ${fP(X.connYoy)} and Space ${fP(X.spYoy)}. Super Intelligence is now about ${fP(X.siShareRev, 0)} of all revenue.`,
      };
      msgTo(msg, lens === 'capex' ? 'dn' : 'info', 'Who earns what', lm[lens] + ' Tap a segment for its close-up.');
    }

    /* ---------- tab: adjusted EBITDA bridge (Sep 2026, or Jun 2026 for contrast) ---------- */
    function drawEbitda(W) {
      const compact = W < 560, per = brPer(), br = bridge(), n = br.length, total = per === 'cur' ? X.ebitda : X.ebitdaPq;
      step = clamp(step, 0, n);
      const labW = compact ? 112 : 230, rowH = compact ? 27 : 30, y0 = 30;
      const rows = br.map((b, i) => ({ k: 'b' + i, l: brLab(b[0], compact), v: b[1], abs: i === 0, c: i === 0 ? (b[1] >= 0 ? 'up' : 'dn') : b[1] >= 0 ? 'up' : 'dn', hide: i > step, frac: i === step ? stepFrac : 1, sel: i === step, b: i === 0 }));
      rows.push({ k: 'adj', l: compact ? '= Adj. EBITDA' : '= Adjusted EBITDA', v: total, abs: true, c: 'acc', b: true, hide: step < n, frac: step === n ? stepFrac : 1, sel: step === n, sep: true });
      let lo = 0, hi = 0, run = 0; br.forEach((b, i) => { run = i === 0 ? b[1] : run + b[1]; lo = Math.min(lo, run); hi = Math.max(hi, run); });
      const pad = (hi - lo) * 0.08;
      const r = hRows({ W, x0: labW + 10, x1: W - (compact ? 8 : 70), y0, rowH, labX: labW, dom: [lo - pad - (lo < 0 ? 200 : 0), hi + pad], compact, rows, fmt: (q) => sM(q) });
      let s = r.s;
      run = 0; br.forEach((b, i) => { if (i <= step) run = i === 0 ? b[1] : run + b[1]; });
      const xr = r.x(run);
      s += S.line(xr, y0 - 4, xr, r.bottom + 4, 's-acc dash w15');
      const lab = (compact ? 'RUNNING ' : 'RUNNING TOTAL ') + sM(run);
      const lw = tw(lab, 10.5, true) + lab.length * 1.6;
      s += S.text(clamp(xr, labW + 10 + lw / 2, W - lw / 2 - 2), 14, lab, 'cap acc', 'middle');
      let yB = r.bottom + 24;
      const net = br[0][1], bcl = (compact ? 'sm' : 'md') + ' mono ' + (step === n ? 'ink b' : 'mut');
      if (compact) { s += S.text(4, yB, `GAAP ${sM(net)} → adjusted ${sM(total)}`, bcl); yB += 17; s += S.text(4, yB, `a gap of ${sM(total - net)}`, bcl); }
      else s += S.text(4, yB, `GAAP ${sM(net)}  →  adjusted ${sM(total)}: a gap of ${sM(total - net)}`, bcl);
      fig.innerHTML = S.wrap(W, yB + 8, `Bridge from SpaceX GAAP net result to adjusted EBITDA for the ${PERL[per]} quarter, one step at a time`, s);
      const stn = $id(id + '-stn'); if (stn) stn.textContent = `Step ${step + 1} of ${n + 1}`;
      const dots = $id(id + '-dots'); if (dots) dots.innerHTML = Array.from({ length: n + 1 }, (_, i) => `<i class="${i === step ? 'on' : i < step ? 'done' : ''}"></i>`).join('');
      root.querySelectorAll('[data-act="back"]').forEach((b) => { b.disabled = step === 0; });
      root.querySelectorAll('[data-act="next"]').forEach((b) => { b.disabled = step === n; b.textContent = step === n - 1 ? 'Show the total ▶' : 'Next step ▶'; });
      if (per === 'cur') reads(rd, [['GAAP net income', sM(xc.netInc), 'up'], ['Adj. EBITDA', fM(X.ebitda), 'acc', true], ['Adj. EBITDA margin', fP(X.ebitdaM)], ['Capex', fM(X.capex), 'dn'], ['Capex ÷ adj. EBITDA', F.num(X.capexEbitda, 1) + '×', 'dn']]);
      else reads(rd, [['GAAP net loss', fM(xq.netInc), 'dn'], ['Adj. EBITDA', fM(X.ebitdaPq), 'acc', true], ['Adj. EBITDA margin', fP((X.ebitdaPq / xq.revenue) * 100)], ['Capex', fM(X.capexPq), 'dn'], ['Expected (reported)', '≈' + fB(Q2.expectations.ebitda)]]);
      if (step === 0) msgTo(msg, 'acc', 'Start', `GAAP says SpaceX ${net >= 0 ? 'earned' : 'lost'} ${fM(Math.abs(net))} in the ${PERL[per]} quarter. Its own adjusted EBITDA says ${fM(total)}. Press <b>Next step</b> to see each piece, and why investors argue about it.`);
      else if (step === n && per === 'cur') msgTo(msg, 'vio', 'Two stories', `Positive ${fB(X.ebitda)} on SpaceX’s own adjusted measure (${fP(X.ebitdaM)} of revenue), against GAAP net income of ${fB(xc.netInc)}. Depreciation (${fB(X.da)}) and stock pay (${fB(X.sbc)}, plus ${fB(X.acqSbc)} from the Cursor deal) were added back; the net below-the-line gains that lifted net income came out. In millions: ${fM(xc.netInc)} + ${fM(X.da)} + ${fM(X.sbcAll)} of stock pay − ${fM(X.below)} below the line + ${fM(X.smallAdd)} of deal and restructuring costs = ${fM(X.walk)}. Capex of ${fB(X.capex)} is ${F.num(X.capexEbitda, 1)}× this number.`);
      else if (step === n) msgTo(msg, 'vio', 'Two stories', `Positive ${fB(X.ebitdaPq)} on SpaceX’s own adjusted measure in June, against a GAAP net loss of ${fM(xq.netInc)}. Depreciation (${fB(X.daPq)}) and stock pay (${fB(X.sbcPq)}) were most of the ${fB(X.gapPq)} gap.`);
      else { const b = br[step]; msgTo(msg, b[1] >= 0 ? 'up' : 'dn', b[1] >= 0 ? 'Added back' : 'Taken out', `${plain(brLab(b[0], false)).replace(/^[+−] /, '')}: ${sM(b[1])}. Running total ${sM(run)}. The card below says what it is and why investors argue about it.`); }
    }

    /* ---------- tab: capex and cash burn ---------- */
    function drawCash(W) {
      const wide = W >= 660;
      const AW = wide ? Math.round(W * 0.56) : W, compact = AW < 420;
      const labW = compact ? 62 : 70, x0 = labW + 8, x1 = AW - (compact ? 56 : 70);
      const x = SML.lin(0, 42000, x0, x1);
      const Q = [
        { l: 'Sep 2025', rev: X.revYa, cap: SX.segments.ya },
        { l: 'Mar 2026', rev: X.revPq1, cap: null, tot: X.capexPq1 },
        { l: 'Jun 2026', rev: X.revPq, cap: SX.segments.pq },
        { l: 'Sep 2026', rev: X.rev, cap: SX.segments.cur },
        { l: 'Dec 2026', guide: true },
      ];
      const SC = { ai: 'dn', conn: 'acc', space: 'vio' };
      let s = '', lx = 4;
      [['f-info', 'Revenue'], ['f-dn', 'Capex: Super Intel.'], ['f-acc', 'Starlink'], ['f-vio', 'Space']].forEach((it) => { s += S.rect(lx, 4, 10, 10, it[0], 2) + S.text(lx + 14, 13, it[1], 'xs'); lx += 22 + tw(it[1], 10); });
      s += S.text(4, 38, compact ? 'REVENUE VS CAPEX' : 'BY QUARTER · REVENUE VS CAPEX', 'cap');
      const rH = 46;
      Q.forEach((q, i) => {
        const yy = 48 + i * rH;
        if (q.l === 'Sep 2026' && sel.cash === 'capex') s += S.rect(1, yy - 3, AW - 2, rH - 2, 'rcx-sel', 4);
        s += S.text(labW, yy + 21, q.l, (compact ? 'sm' : 'md') + ' b ink', 'end');
        if (q.guide) {
          s += S.rect(x0, yy + 11, x(X.q4Lo) - x0, 18, 'f-dn o35', 0) + S.rect(x0, yy + 11, x(X.q4Hi) - x0, 18, 'rcx-ghost', 0);
          s += S.text(x0 + 6, yy + 24, `guide ${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}`, 'sm mono b ink');
          s += hit(0, yy - 3, AW, rH - 2, 'capex', 'Capex guide');
          return;
        }
        s += S.rect(x0, yy + 1, x(q.rev) - x0, 10, 'f-info', 2) + S.text(x(q.rev) + 5, yy + 10, fB(q.rev), 'xs mono info');
        let cx = x0;
        const tot = q.cap ? q.cap.reduce((t, c) => t + c.capex, 0) : q.tot;
        if (q.cap) ['ai', 'conn', 'space'].forEach((k) => { const c = q.cap.find((z) => z.k === k); const w = x(c.capex) - x0; s += S.rect(cx, yy + 15, Math.max(1, w), 17, 'f-' + SC[k], 0); cx += w; });
        else s += S.rect(x0, yy + 15, x(tot) - x0, 17, 'f-dn o70', 0);
        s += S.text(x(tot) + 5, yy + 28, fB(tot), 'sm mono b dn');
        if (!compact) s += S.text(x(tot) + 5 + tw(fB(tot), 11.5, true) + 6, yy + 28, `${F.num(tot / q.rev, 2)}× rev.`, 'xs mono');
        s += hit(0, yy - 3, AW, rH - 2, 'capex', 'Capex ' + q.l);
      });
      const hA = 48 + Q.length * rH + 4;
      /* nine months */
      const bx = wide ? AW + 22 : 0, by = wide ? 0 : hA + 14, BW = wide ? W - AW - 22 : W;
      const bc = BW < 420, blab = bc ? 92 : 112;
      const rows = [
        { k: 'ocf', l: 'Operating cash', v: X.ocf9, abs: true, c: 'up', b: true, sel: sel.cash === 'ocf' },
        { k: 'capex', l: 'Capex', v: -X.capexYtd, c: 'dn', sel: sel.cash === 'capex' },
        { k: 'fcf', l: 'Free cash flow', v: X.fcf9, abs: true, c: 'dn', b: true, sel: sel.cash === 'fcf' },
      ];
      const r = hRows({ W: BW, x0: blab + 8, x1: BW - 8, y0: 20, rowH: 34, labX: blab, dom: [-50500, 15000], compact: bc, rows, fmt: (q) => sB(q, 1) });
      let sb = S.text(4, 12, 'NINE MONTHS TO SEPTEMBER 2026', 'cap') + r.s;
      sb += S.text(4, r.bottom + 22, `Financing brought in ${sB(X.fin9)}, mostly the IPO.`, 'sm');
      sb += hit(0, r.bottom + 8, BW, 22, 'burn', 'Cash burn');
      s += `<g transform="translate(${bx},${by})">${sb}</g>`;
      const H = Math.max(hA, by + r.bottom + 32);
      fig.innerHTML = S.wrap(W, H, 'SpaceX capex against revenue by quarter, the fourth-quarter capex guide, and nine months of operating cash flow, capex and free cash flow', s);
      reads(rd, [['Capex, Sep qtr', fB(X.capex), 'dn', true], ['Capex ÷ adj. EBITDA', F.num(X.capexEbitda, 1) + '×'], ['Operating cash, 9 mo', sB(X.ocf9), 'up'], ['Free cash flow, 9 mo', fB(X.fcf9), 'dn'], ['Cash + securities', fB(X.cashSec)]]);
      msgTo(msg, 'dn', 'Cash burn', `Capex of ${fB(X.capex)} in the September quarter was ${F.num(X.capexEbitda, 1)}× adjusted EBITDA, ${fP(X.siCapexShare, 0)} of it for Super Intelligence. Over nine months, ${fB(X.ocf9)} of operating cash against ${fB(X.capexYtd)} of capex left free cash flow of about ${fB(X.fcf9)} (our math). Management guided fourth-quarter capex to ${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}, about ${F.num(X.q4Lo / X.capex, 1)} to ${F.num(X.q4Hi / X.capex, 1)} times September’s. A profitable quarter does not end the cash burn.`);
    }

    /* ---------- tab: balance sheet, Dec 31 → Jun 30 → Sep 30 ---------- */
    const bsAt = (side, k, t) => (t <= 1 ? lerp(bsv(side, k, 'prev'), bsv(side, k, 'mid'), t) : lerp(bsv(side, k, 'mid'), bsv(side, k, 'cur'), t - 1));
    const totAt = (key, t) => (t <= 1 ? lerp(btot(key, 'prev'), btot(key, 'mid'), t) : lerp(btot(key, 'mid'), btot(key, 'cur'), t - 1));
    const prefAt = (t) => (t <= 1 ? lerp(prefOf('prev'), prefOf('mid'), t) : lerp(prefOf('mid'), prefOf('cur'), t - 1));
    function bsGroups(t) {
      const w = (k, side) => bsAt(side, k, t);
      const cash = w('cash', 'assets'), ms = w('ms', 'assets'), ppe = w('ppe', 'assets'), gw = w('gw', 'assets') + w('intang', 'assets');
      const debt = w('debtCur', 'liabilities') + w('debtNon', 'liabilities');
      const defrev = w('defrevCur', 'liabilities') + w('defrevNon', 'liabilities');
      return {
        A: [{ k: 'cash', l: 'Cash', v: cash, c: 'f-info' }, { k: 'ms', l: 'Marketable securities', v: ms, c: 'f-info o50' }, { k: 'ppe', l: 'PP&amp;E', v: ppe, c: 'f-vio' }, { k: 'gw', l: 'Goodwill &amp; intangibles', v: gw, c: 'f-acc o70' }, { k: 'otherA', l: 'Other assets', v: totAt('assets', t) - cash - ms - ppe - gw, c: 'f-shade2' }],
        L: [{ k: 'debt', l: 'Debt', v: debt, c: 'f-dn' }, { k: 'defrev', l: 'Deferred revenue', v: defrev, c: 'f-dn o70' }, { k: 'otherL', l: 'Other liabilities', v: totAt('liabilities', t) - debt - defrev, c: 'f-dn o35' }, { k: 'pref', l: 'Preferred stock', v: prefAt(t), c: 'f-acc' }, { k: 'equity', l: 'Equity', v: totAt('equity', t), c: 'f-up' }],
        Q: [{ k: 'apic', l: 'Paid-in capital', v: w('stock', 'equity') + w('apic', 'equity') }, { k: 'deficit', l: 'Accumulated deficit', v: w('deficit', 'equity') }, { k: 'aoci', l: 'Other', v: w('aoci', 'equity') }, { k: 'equity', l: '= Equity', v: totAt('equity', t) }],
        totA: totAt('assets', t),
      };
    }
    function drawBS(W) {
      const compact = W < 600, g = bsGroups(bsT), max = btot('assets', 'cur');
      const x = SML.lin(0, max, 8, W - 8);
      let s = '';
      const bar = (y, items, title) => {
        let t = S.text(8, y - 6, title, 'cap'), cx = 8;
        items.forEach((it) => {
          const w = x(it.v) - 8; if (w <= 0.2) return;
          t += S.rect(cx, y, w, 28, it.c + (sel.bs === it.k ? ' s-ink w2' : ''), 0);
          const lab = `${plain(it.l).split(' ')[0]} ${fB(it.v, 1)}`;
          if (w > tw(lab, 11.5) + 12 && it.c.indexOf('o35') < 0 && it.c.indexOf('shade2') < 0) t += S.text(cx + 6, y + 18, E(lab), 'sm b on');
          t += hit(cx, y, w, 28, it.k, it.l);
          cx += w;
        });
        return t;
      };
      const totL = g.L.reduce((t, it) => t + it.v, 0);
      s += bar(26, g.A, `OWNS · ${fB(g.totA)}`) + bar(80, g.L, `OWES + OWNERS’ SHARE · ${fB(totL)}`);
      const near = (v) => Math.abs(bsT - v) < 0.001;
      const dateLab = near(2) ? 'SEPTEMBER 30, 2026' : near(1) ? 'JUNE 30, 2026' : near(0) ? 'DECEMBER 31, 2025' : bsT < 1 ? 'THE IPO…' : 'THE CURSOR DEAL…';
      s += S.text(W - 8, 14, dateLab, 'cap acc', 'end');
      const ly = 132, rowH = 23;
      const legend = (x0, y0, items, w, head) => {
        let t = S.text(x0, y0, head, 'cap');
        items.forEach((it, i) => {
          const yy = y0 + 10 + i * rowH;
          if (sel.bs === it.k) t += S.rect(x0 - 4, yy, w + 4, rowH, 'rcx-sel', 3);
          t += S.rect(x0, yy + 6, 11, 11, it.c, 2) + S.text(x0 + 18, yy + 16, it.l, 'sm ink');
          t += S.text(x0 + w - 4, yy + 16, fBz(it.v, 1), 'sm mono b ink', 'end');
          t += hit(x0 - 4, yy, w + 4, rowH, it.k, it.l);
        });
        return t;
      };
      let qy;
      if (compact) {
        s += legend(8, ly, g.A, W - 16, 'WHAT IT OWNS');
        const ly2 = ly + 10 + g.A.length * rowH + 20;
        s += legend(8, ly2, g.L, W - 16, 'WHAT IT OWES, AND THE OWNERS’ SHARE');
        qy = ly2 + 10 + g.L.length * rowH + 24;
      } else {
        const cw = (W - 40) / 2;
        s += legend(8, ly, g.A, cw, 'WHAT IT OWNS') + legend(8 + cw + 24, ly, g.L, cw, 'WHAT IT OWES, AND THE OWNERS’ SHARE');
        qy = ly + 10 + Math.max(g.A.length, g.L.length) * rowH + 24;
      }
      s += S.text(8, qy, 'EQUITY = PAID IN − LOSSES SO FAR', 'cap acc');
      const qLab = compact ? 118 : 170;
      const r = hRows({ W, x0: qLab + 10, x1: W - (compact ? 8 : 80), y0: qy + 8, rowH: compact ? 26 : 28, labX: qLab, dom: [-46000, 222000], compact,
        rows: g.Q.map((q, i) => ({ k: q.k, l: q.l, v: q.v, abs: i === 0 || i === 3, c: i === 3 ? 'up' : q.v >= 0 ? 'info' : 'dn', b: i === 3, sel: sel.bs === q.k, sep: i === 3 })), fmt: (q) => sB(q, 1) });
      s += r.s;
      fig.innerHTML = S.wrap(W, r.bottom + 8, 'SpaceX balance sheet: what it owns against what it owes plus the owners’ share, and how equity is built', s);
      const ncAt = bsAt('assets', 'cash', bsT) + bsAt('assets', 'ms', bsT) - bsAt('liabilities', 'debtCur', bsT) - bsAt('liabilities', 'debtNon', bsT);
      const crAt = totAt('currentAssets', bsT) / totAt('currentLiab', bsT);
      reads(rd, [['Cash + securities', fB(bsAt('assets', 'cash', bsT) + bsAt('assets', 'ms', bsT)), '', true], ['Net cash', fB(ncAt)], ['Equity', fB(totAt('equity', bsT)), 'up'], ['Goodwill', fB(bsAt('assets', 'gw', bsT)), 'acc'], ['Current ratio', F.num(crAt, 1)]]);
      if (bsT > 1.5) msgTo(msg, 'up', 'Sep 30, 2026', `Since December 31: cash and securities rose from ${fB(X.cash0)} to ${fB(X.cashSec)}, the ${fB(X.pref0)} of preferred stock converted, and goodwill jumped from ${fB(X.gw0)} to ${fB(X.gw)} with the Cursor deal. Equity went from ${fB(X.eq0)} to ${fB(X.eq)}. The September-quarter profit shrank the accumulated deficit by ${fB(X.def - X.defMid)}, to ${fB(-X.def)} of losses so far.`);
      else if (bsT > 0.5) msgTo(msg, 'acc', 'Jun 30, 2026', `Just after the IPO: cash ${fB(X.cashMid)}, the preferred stock gone (converted), equity ${fB(X.eqMid)}. The accumulated deficit had grown to ${fB(X.defMid)} after the first-half losses.`);
      else msgTo(msg, 'acc', 'Dec 31, 2025', `Before the IPO: ${fB(X.cash0)} of cash, ${fB(X.pref0)} of preferred stock held by early investors and only ${fB(X.eq0)} of equity: past losses (${fB(X.def0)}) had used up almost all the ${fB(X.apic0)} owners had paid in. Press <b>Play the year</b>.`);
    }

    /* ---------- tab: shares and dilution ---------- */
    function drawShares(W) {
      const compact = W < 560, ni = st.n(id + '-ni');
      const labW = compact ? 0 : 104, x0 = compact ? 8 : labW + 10, x1 = W - (compact ? 8 : 130);
      const x = SML.lin(0, 13200, x0, x1);
      let s = S.text(8, 12, compact ? 'AVERAGE SHARES · BLOCK = 1 BILLION' : 'AVERAGE DILUTED SHARES IN THE QUARTER · EACH BLOCK = 1 BILLION', 'cap');
      const R = [{ l: 'Sep 2025 qtr', sh: xy.sh, k: 'wavg' }, { l: 'Jun 2026 qtr', sh: xq.sh, k: 'wavg' }, { l: 'Sep 2026 qtr', sh: xc.sh, k: 'dilution' }];
      const rowH = compact ? 56 : 42;
      R.forEach((r, i) => {
        const yy = 22 + i * rowH, by = compact ? yy + 22 : yy + 8, eps = ni / r.sh;
        if (compact) s += S.text(8, yy + 14, `${r.l.replace(' qtr', '')}: ${F.num(r.sh)}M`, 'sm b ink');
        else s += S.text(labW, by + 17, r.l, 'md b ink', 'end');
        s += S.rect(x0, by, x(r.sh) - x0, 24, 'f-info', 2);
        for (let b = 1000; b < r.sh; b += 1000) s += S.line(x(b), by, x(b), by + 24, 's-surf w2');
        if (!compact) s += S.text(x(r.sh) + 6, by + 17, `${F.num(r.sh)}M`, 'sm mono b ink');
        s += S.text(W - 8, compact ? yy + 14 : by + 17, 'EPS ' + usd(eps), (compact ? 'md' : 'lg') + ' mono b ' + (eps < 0 ? 'dn' : 'up'), 'end');
        s += hit(0, yy, W, rowH, r.k, r.l);
      });
      const yS = 22 + R.length * rowH + 12;
      s += S.text(8, yS, compact ? `Same ${sM(ni)} split in every row ${ni === xc.netInc ? '(real)' : '(what if)'}` : `Same result in every row: ${sM(ni)} ${ni === xc.netInc ? '(the real September 2026 quarter)' : '(what if)'}`, 'sm');
      /* shares outstanding by class */
      const oy = yS + 30;
      s += S.text(8, oy, 'SHARES OUTSTANDING, MILLIONS', 'cap');
      const CL = [['A', 'classA', 'f-info'], ['B', 'classB', 'f-vio'], ['C', 'classC', 'f-acc'], ['Pref.', 'prefOutstanding', 'f-shade2']];
      [['Dec 31, 2025', 1], ['Sep 30, 2026', 0]].forEach((d, j) => {
        const yy = oy + 10 + j * 32, bx = compact ? 74 : x0, oxx = SML.lin(0, 14000, bx, compact ? W - 58 : x1);
        s += S.text(compact ? 68 : labW, yy + 15, compact ? d[0].replace(', 20', ' ’') : d[0], (compact ? 'xs' : 'sm') + ' b ink', 'end');
        let cx = bx;
        CL.forEach((c) => { const v = SO[c[1]][d[1]]; if (!v) return; const w = oxx(v) - oxx(0); s += S.rect(cx, yy, w, 20, c[2], 0); if (w > tw(c[0], 11.5) + 8) s += S.text(cx + w / 2, yy + 14, c[0], 'sm b on', 'middle'); cx += w; });
        const tot = CL.reduce((t, c) => t + (SO[c[1]][d[1]] || 0), 0);
        s += S.text(cx + 6, yy + 15, F.num(tot) + 'M', 'sm mono b ink');
        s += hit(0, yy - 2, W, 24, 'dilution', 'Shares outstanding ' + d[0]);
      });
      /* class legend */
      let lgx = compact ? 8 : x0; const lgy = oy + 10 + 2 * 32 + 6;
      CL.forEach((c) => { const t = c[0] === 'Pref.' ? 'Preferred' : 'Class ' + c[0]; s += S.rect(lgx, lgy, 10, 10, c[2], 2) + S.text(lgx + 14, lgy + 9, t, 'xs'); lgx += 26 + tw(t, 10); });
      /* calendar */
      const ty = lgy + 82, ev = [
        { d: 'Jun 12', t: compact ? `IPO opens $${SX.ipo.open}` : `IPO opens at $${SX.ipo.open}`, k: 'ipo' },
        { d: 'Aug 4', t: 'First report', k: 'lockup' },
        { d: 'Aug 6', t: compact ? '1st lockup' : 'First lockup release', k: 'lockup', red: true },
        { d: 'Aug 14', t: compact ? 'Cursor closes' : 'Cursor deal closes', k: 'gw' },
        { d: 'Oct 20', t: 'Q3 report', k: 'eps' },
      ];
      s += S.text(8, ty - 46, 'THE SHARE CALENDAR, 2026', 'cap');
      const tx0 = 40, tx1 = W - 40;
      s += S.line(tx0 - 20, ty, tx1 + 20, ty, 's-line w2');
      ev.forEach((e, i) => {
        const ex = tx0 + (i / (ev.length - 1)) * (tx1 - tx0), up = i % 2 === 0;
        s += S.circle(ex, ty, 6, e.red ? 'f-dn' : 'f-acc');
        const anc = i === 0 ? 'start' : i === ev.length - 1 ? 'end' : 'middle', lx = i === 0 ? ex - 8 : i === ev.length - 1 ? ex + 8 : ex;
        s += S.text(lx, up ? ty - 24 : ty + 22, e.d, 'sm mono b ' + (e.red ? 'dn' : 'acc'), anc) + S.text(lx, up ? ty - 11 : ty + 36, e.t, (compact ? 'xs' : 'sm') + ' ink', anc);
        s += hit(ex - 30, ty - 36, 60, 78, e.k, e.t);
      });
      const H = ty + 46;
      fig.innerHTML = S.wrap(W, H, 'SpaceX average share count a year ago, in June and in September 2026, the same result split over each, shares outstanding by class, and the 2026 share calendar', s);
      reads(rd, [['Shares, Sep 2025 qtr', F.num(xy.sh) + 'M'], ['Shares, Jun 2026 qtr', F.num(xq.sh) + 'M'], ['Shares, Sep 2026 qtr', F.num(xc.sh) + 'M', '', true], ['EPS on Jun count', usd(ni / xq.sh), ni < 0 ? 'dn' : 'up'], ['EPS on Sep count', usd(ni / xc.sh), ni < 0 ? 'dn' : 'up']]);
      if (ni === xc.netInc) msgTo(msg, 'acc', 'Dilution', `The September quarter’s ${fM(ni)} over ${F.num(xc.sh)}M diluted shares is ${usd(xc.eps)} a share. On June’s ${F.num(xq.sh)}M shares it would be ${usd(X.epsOnPq)}; on the ${F.num(xy.sh)}M of a year earlier, ${usd(X.epsOnYa)}. Shares outstanding jumped with the preferred conversion, the IPO and other share issuance; the release does not break the weighted-average change down.`);
      else msgTo(msg, ni >= 0 ? 'up' : 'dn', 'What if', `A result of ${sM(ni)} is ${usd(ni / xy.sh)} a share on the count of a year earlier and ${usd(ni / xc.sh)} on September’s. Same company result, a much smaller slice per share. That is dilution.`);
    }

    /* ---------- tab: price to sales ---------- */
    function drawPS(W) {
      const wide = W >= 640, mv = st.n(id + '-mv') * 1000, nm = st.n(id + '-nm'), basis = st.seg(id + '-basis') || 'run';
      const rev = basis === 'guide' ? X.g1Mid * 4 : X.runRate, ps = mv / rev, pe = ps / (nm / 100);
      const GW = wide ? Math.round(W * 0.5) : W, cols = wide ? 12 : 10, gap = 3;
      const bs = Math.min(26, (GW - 16 - (cols - 1) * gap) / cols);
      const full = Math.floor(ps), frac = ps - full, total = Math.ceil(ps);
      let s = S.text(8, 12, W < 480 ? 'BLOCK = 1 YEAR OF SALES' : `MARKET VALUE ÷ ONE YEAR OF SALES (${fB(rev, 1)} EACH)`, 'cap');
      for (let i = 0; i < total; i++) {
        const cx = 8 + (i % cols) * (bs + gap), cy = 22 + Math.floor(i / cols) * (bs + gap);
        s += S.rect(cx, cy, Math.max(1, i < full ? bs : bs * frac), bs, 'f-info', 2);
        if (i >= full) s += S.rect(cx, cy, bs, bs, 'nf s-line', 2);
      }
      const gh = 22 + Math.ceil(Math.max(1, total) / cols) * (bs + gap);
      s += hit(0, 16, GW, gh - 10, 'ps', 'Price to sales');
      const rx = wide ? GW + 24 : 8, ry = wide ? 24 : gh + 26;
      s += S.text(rx, ry + 30, `P/S ${xx(ps)}`, 'b ink disp rcx-big');
      s += S.text(rx, ry + 52, `${'$' + F.num(mv / 1000, 0)}B ÷ ${fB(rev)} a year`, 'sm mono');
      s += S.text(rx, ry + 82, `At a steady ${nm}% net margin: P/E ≈ ${F.num(pe, 0)}×`, 'md b acc');
      s += S.text(rx, ry + 100, 'P/E = P/S ÷ net margin, on these sales', 'sm');
      s += hit(rx - 4, ry + 66, (wide ? W - rx : W - 8), 40, 'impliedPE', 'From P/S to P/E');
      const sy = ry + 152, sx0 = rx, sx1 = W - 12, top = Math.max(60, Math.ceil(ps / 10) * 10 + 10);
      const sx = SML.lin(0, top, sx0, sx1);
      s += S.text(sx0, sy - 24, 'PRICE TO SALES SCALE', 'cap');
      s += S.rect(sx0, sy, sx1 - sx0, 8, 'f-shade2', 4);
      s += S.circle(sx(A.ps), sy + 4, 6, 'f-info') + S.text(clamp(sx(A.ps), sx0 + 34, sx1 - 34), sy - 7, `Apple ≈${xx(A.ps)}`, 'xs b info', 'middle');
      s += S.circle(sx(Math.min(ps, top)), sy + 4, 7, 'f-acc') + S.text(clamp(sx(ps), sx0 + 46, sx1 - 46), sy + 36, 'your SpaceX input', 'xs b acc', 'middle');
      SML.ticks(0, top, wide ? 5 : 4).forEach((t) => { s += S.text(sx(t), sy + 20, t + '×', 'xs mono', 'middle'); });
      const H = Math.max(gh + 8, sy + 46);
      fig.innerHTML = S.wrap(W, H, `Price to sales: a market value of $${F.num(mv / 1000, 0)} billion equals ${F.num(ps, 1)} years of SpaceX sales`, s);
      reads(rd, [['EPS, Sep qtr', usd(xc.eps), 'up'], ['EPS, 9 months', usd(SX.is.ytd.eps), 'dn'], ['Yearly sales used', fB(rev)], ['P/S', xx(ps), 'acc', true], ['Implied P/E', F.num(pe, 0) + '×']]);
      msgTo(msg, 'acc', 'On sales', `At a $${F.num(mv / 1000, 0)}B market value you pay about ${xx(ps)} ${basis === 'guide' ? 'a year of sales at management’s first-quarter 2027 guide (a forecast)' : 'today’s yearly sales (the run rate)'}. If SpaceX steadily kept ${nm}% of those sales as profit, that would be a P/E of about ${F.num(pe, 0)}. One profitable quarter is not a year, so investors still lean on sales, growth and the path to steady profit. Apple, for comparison, was at about ${xx(A.ps)} sales on July 30 (our math).`);
    }

    const NOTES = {
      inc: 'SpaceX Q3 2026 results release (three months to September 30, 2026, reported October 20, 2026): the latest reported quarter as of October 2026. June 2026 was the first report as a public company. "SG&amp;A and other" includes restructuring and impairment. The violet band is everything below the operating line. Tap any row for its card.',
      seg: 'Segment revenue, operating income, adjusted EBITDA (non-GAAP) and capex from the release. Super Intelligence was called AI before; Cursor joined on August 14, 2026. Subscribers and ARPU are Starlink consumer metrics.',
      ebitda: 'Reconciliations from the releases. Adjusted EBITDA is SpaceX’s own non-GAAP measure, not a profit: it adds back some costs and takes out some gains.',
      cash: 'SpaceX publishes cash-flow totals for the year to date. Free cash flow is our math: nine-month operating cash flow minus nine-month capex. The fourth-quarter range is management’s guide, not a result.',
      bs: 'Balance sheets on December 31, 2025, June 30, 2026 and September 30, 2026. Preferred stock sat outside equity until it converted. "Other assets" holds receivables, inventory, leases, digital assets and more.',
      shares: 'Weighted average diluted shares used for EPS, and shares outstanding by class from the balance sheet. The release does not itemize why the weighted average rose. Calendar spacing is schematic.',
      ps: 'The market value is your input, not SpaceX’s actual market value, which changes every day. Run rate = September 2026 quarter revenue × 4. The guide option uses the midpoint of management’s first-quarter 2027 revenue guide × 4: a forecast, not a result. Apple’s ≈10.5× is our math from its July 30 close.',
    };
    const DRAW = { inc: drawInc, seg: drawSeg, ebitda: drawEbitda, cash: drawCash, bs: drawBS, shares: drawShares, ps: drawPS };

    const draw = ui.responsive(fig, (W) => {
      const tb = tab();
      if (tb !== lastTab) { anim.stop(); stepFrac = 1; if (tb === 'inc') incVals = INC(st.seg(id + '-per') || 'cur'); if (tb === 'bs') bsT = DTI[st.seg(id + '-dt')] != null ? DTI[st.seg(id + '-dt')] : 2; lastTab = tb; }
      root.querySelectorAll('.rcx-c').forEach((c) => { c.hidden = c.dataset.t.split(' ').indexOf(tb) < 0; });
      const sub = $id(id + '-sub'); if (sub) sub.hidden = !sub.querySelector('.rcx-c:not([hidden])');
      DRAW[tb](W);
      let c;
      if (tb === 'ebitda') { const br = bridge(), per = brPer(); c = step >= br.length ? adjCard(per) : bridgeCard(br[step][0], br[step][1], per); }
      else if (tb === 'inc') {
        const k = sel.inc, v = incVals;
        c = k === 'op' ? SXC[v[5] >= 0 ? 'opInc' : 'opLoss'] : k === 'net' ? SXC[v[9] >= 0 ? 'netInc' : 'netLoss'] : SXC[k];
      } else {
        c = SXC[sel[tb]];
        if (tb === 'seg' && sel.seg === 'conn' && (st.seg(id + '-lens') || 'op') === 'growth') c = SXC.subs;
      }
      card.innerHTML = cardHTML(c, 'At SpaceX');
      note.innerHTML = NOTES[tb] + ' Hoppy’s cart lines marked “second-cart version” use a made-up next chapter (a second cart and a delivery app) to explain losses and the IPO.';
    });
  };

  /* ======================================================================
     earningsPrice ★: Price ≈ EPS × P/E with Apple's real start, the July 31 replay, a headline game, the SpaceX case
     ====================================================================== */
  const PRESETS = [
    { k: 'real', label: 'Real start', v: [0, 0, 0, 0] },
    { k: 'br', label: 'Beat & raise', v: [0.10, 0, 4, 5] },
    { k: 'bw', label: 'Beat, weak guide', v: [0.13, 0.11, -3, -6] },
    { k: 'mr', label: 'Miss & raise', v: [-0.05, 0, 5, 3] },
    { k: 'sq', label: 'P/E squeeze', v: [0, 0, 0, -15] },
  ];
  const REPLAY = [
    { when: 'July 30, 4:00 pm ET', h: 'Before the report', pts: 1, rows: 0,
      p: `Apple closes at ${usd(A.p0)}. On the last four reported quarters (TTM EPS ${usd(A.eps0)}), that is a P/E of about ${xx(A.pe0)}. Analysts expect revenue of about ${fB(AEX.revenue[0])}–${fB(AEX.revenue[1])} and EPS of about ${usd(AEX.eps[0])}–${usd(AEX.eps[1])} (reported).` },
    { when: 'July 30, after the close', h: 'The headline: a beat', pts: 1, rows: 2, guess: true,
      p: `Revenue ${fB(AP.is.cur.revenue)} and EPS ${usd(A.eps)}: a beat on both, up ${fP(pc(AP.is.cur.revenue, AP.is.ya.revenue), 0)} and ${fP(pc(A.eps, AP.is.ya.epsDil), 0)} from a year earlier. Tim Cook, then CEO, called it “our strongest June quarter ever”.` },
    { when: 'Reading the details', h: 'Quality check: temporary help', pts: 1, rows: 4,
      p: `${usd(AP.tariffRefund.eps)} of the ${usd(A.eps)} came from tariff refunds, a temporary boost that also added about ${AP.tariffRefund.grossMarginPts} points to gross margin (the September-quarter guide still includes about ${AG.tariffRefundPts} point of refunds). Without it EPS is about ${usd(A.epsX)}, and the beat shrinks to ${usd(A.beatXLo)}–${usd(A.beatXHi)} (our math, assuming the estimates did not include the refunds). Services, ${fB(AP.is.cur.servSales, 2)}, came in below the about ${fB(AEX.services, 1)} expected.` },
    { when: 'July 30, 5:00 pm ET, the call', h: 'The outlook: softer than hoped', pts: 2, rows: 5,
      p: `Apple guided September-quarter growth of ${AG.revGrowth[0]}%–${AG.revGrowth[1]}% (about ${fB(A.gLo)}–${fB(A.gHi)}) when analysts expected about ${AEX.nextQtrGrowth}% (about ${fB(AEX.nextQtrRevenue, 0)}), with a ${AG.grossMargin[0]}%–${AG.grossMargin[1]}% gross margin including about ${AG.tariffRefundPts} point of tariff refunds. It also said chip supply would get tighter and memory costs were rising. After hours the stock slipped about ${fP(-AR.afterHoursPct, 0)}.` },
    { when: 'July 31, 9:30 am ET', h: 'The open', pts: 4, rows: 5,
      p: `The stock opened down about ${fP(-AR.openPct)} and traded as low as about $${AR.low}. Nothing in the trailing numbers changed overnight; what changed was what investors expect next.` },
    { when: 'July 31, 4:00 pm ET', h: 'The close: same EPS, lower multiple', pts: 5, rows: 5,
      p: `Apple closed near $${AR.closeAfter}, down about ${fP(-AR.closePct)}. ${usd(A.eps0)} of trailing EPS × about ${xx(A.pe1)} ≈ $${AR.closeAfter}. Investors paid about ${F.num(A.peDrop, 1)} fewer dollars for each $1 of profit: a multiple contraction driven by the outlook. About $${F.num(Math.round(A.mcapDrop / 10000) * 10, 0)} billion of market value disappeared (our math).` },
  ];
  const HEADS = [
    { real: true, co: 'Apple · July 30, 2026', h: 'Apple beats on revenue and EPS, but guides September-quarter growth to 9%–11%, below the about 12% analysts expected', ans: 'dn', d: ['up', 'dn', 'dn'],
      res: `Fell about ${fP(-AR.closePct)} on July 31 (reported).`, why: `Part of the beat was temporary (${usd(AP.tariffRefund.eps)} of tariff refunds) and the outlook was softer than expected. Investors priced the future lower, so the P/E fell from about ${xx(A.pe0, 0)} to about ${xx(A.pe1, 0)}.` },
    { co: 'Carrot Cloud · made-up company', h: 'Carrot Cloud misses EPS by 3 cents but raises its full-year forecast by 8%', ans: 'up', d: ['dn', 'up', 'up'],
      res: 'Typical reaction: up.', why: 'The quarter is behind us; the forecast covers the next four. A raised outlook lifts expected EPS, and often the multiple too.' },
    { real: true, co: 'SpaceX · October 20, 2026', h: `SpaceX swings to a ${bil(xc.netInc)} profit, beats estimates, and guides early-2027 revenue to ${bil(X.g1Lo, 0)}–${bil(X.g1Hi, 0)}, far above the about ${bil(SXE.q1_2027Revenue)} expected`, ans: 'up', d: ['up', 'up', 'up'],
      res: `Rose ${fP(SXR.nextDayPct)} to ${usd(SXR.closeAfter)} on October 21 (reported).`, why: `A beat plus a guide far above expectations: the outlook dial moved up. Note the quality check, though: about ${fB(X.below)} of the profit came from below the operating line, and fourth-quarter capex is guided to ${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}.` },
    { co: 'Hop Motors · made-up company', h: 'Hop Motors beats EPS by 10 cents; 8 cents came from a one-time tax benefit; outlook unchanged', ans: 'dn', d: ['flat', 'flat', 'dn'],
      res: 'Typical reaction: flat to down.', why: 'Strip the one-time item and the beat is only 2 cents. A low-quality beat does not raise future EPS, and it can make investors trust the numbers less.' },
    { real: true, co: 'SpaceX · August 4, 2026', h: `SpaceX revenue nearly doubles and beats; loss narrows; capex jumps to ${bil(X.capexPq)}; its first lockup release comes in two days`, ans: 'dn', d: ['up', 'dn', 'dn'],
      res: `Closed down ${fP(-Q2.reaction.nextDayPct)} at ${usd(Q2.reaction.nextDayClose)} on August 5 (reported).`, why: `The beat was big, but investors focused on cash: capex of ${fB(X.capexPq)} against about ${fB(Q2.expectations.capex, 0)} expected, and more shares able to trade after the first lockup release.` },
    { co: 'Clover Chips · made-up company', h: 'Clover Chips beats and raises, but the stock had already jumped 40% in the month before the report', ans: 'dn', d: ['up', 'up', 'dn'],
      res: 'Often down: “sell the news”.', why: 'When a stock runs up into earnings, the real expectation (the whisper number) is higher than the published consensus. A beat that only matches the whisper can still disappoint.' },
    { co: 'Meadow Foods · made-up company', h: 'Meadow Foods reports in line, and raises its gross margin outlook by 2 points', ans: 'up', d: ['flat', 'up', 'up'],
      res: 'Typical reaction: up.', why: 'Higher margins on the same sales mean more EPS ahead. The outlook dial moves up even though the quarter was only in line.' },
  ];

  SML.widgets.earningsPrice = function (root, opts) {
    opts = opts || {};
    root.classList.add('rcx');
    const id = SML.uid('ep');
    const TB = [{ v: 'play', label: 'Playground' }, { v: 'replay', label: 'Replay July 31' }, { v: 'game', label: 'Headline game' }, { v: 'spacex', label: 'SpaceX case' }];
    const tab0 = TB.some((t) => t.v === opts.tab) ? opts.tab : 'play';
    let rstep = 0, guess = null, gi = 0, ans = null, score = { ok: 0, n: 0, marks: [] }, sxSel = null, playH = null, G = null;
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-t', TB, tab0, 'View')}<span class="grow"></span><span class="pill" id="${id}-pill"></span></div>
      <div class="wg-bar rcx-bar2 rcx-c" data-t="play"><span class="rcx-lab">Scenario</span>${ui.seg(id + '-pre', PRESETS.map((p) => ({ v: p.k, label: p.label })), 'real', 'Scenario')}</div>
      <div class="wg-bar rcx-bar2 rcx-c" data-t="spacex"><span class="rcx-lab">Report</span>${ui.seg(id + '-sxq', [{ v: 'q3', label: 'Oct 20: Sep quarter' }, { v: 'q2', label: 'Aug 4: Jun quarter' }], 'q3', 'SpaceX report')}</div>
      <div class="rcx-head rcx-c" data-t="game" id="${id}-hl"></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl rcx-c" data-t="play">
        ${ui.slider({ id: id + '-s', label: 'Next quarter’s EPS vs expected', min: -0.3, max: 0.3, step: 0.01, value: 0, fmt: (v) => (Math.abs(v) < 0.005 ? 'in line' : sUsd(v)) })}
        ${ui.slider({ id: id + '-o', label: 'Part of it that is temporary', min: 0, max: 0.3, step: 0.01, value: 0, fmt: (v) => (v < 0.005 ? 'none' : MI + usd(v)) })}
        ${ui.slider({ id: id + '-g', label: 'Guidance: next year’s EPS outlook', min: -10, max: 10, step: 0.5, value: 0, fmt: (v) => (v === 0 ? 'unchanged' : sP(v)) })}
        ${ui.slider({ id: id + '-m', label: 'P/E multiple investors pay', min: -25, max: 25, step: 1, value: 0, fmt: (v) => xx(A.pe0 * (1 + v / 100)) + (v ? ' (' + sP(v, 0) + ')' : '') })}
      </div>
      <div class="rcx-step rcx-c" data-t="replay" id="${id}-step" aria-live="polite"></div>
      <div class="wg-actions rcx-actions rcx-c" data-t="replay"><button type="button" class="btn btn-g sm" data-act="rback">◀ Back</button><button type="button" class="btn btn-p sm" data-act="rnext">Next ▶</button><button type="button" class="btn btn-g sm" data-act="rplay">Play</button><button type="button" class="btn btn-g sm" data-act="rrestart">Restart</button><span class="grow"></span><span class="rcx-dots" id="${id}-rdots"></span></div>
      <div class="wg-actions rcx-actions rcx-c" data-t="game"><button type="button" class="btn btn-up sm" data-act="aup">▲ Stock goes up</button><button type="button" class="btn btn-dn sm" data-act="adn">▼ Stock goes down</button><button type="button" class="btn btn-g sm" data-act="gnext">Next headline ▶</button><span class="grow"></span><span class="rcx-dots" id="${id}-gdots"></span><span class="meta" id="${id}-score"></span></div>
      <div class="wg-read" id="${id}-rd"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = root.querySelector('.wg-fig');
    const rd = $id(id + '-rd'), msg = $id(id + '-msg'), note = $id(id + '-note');
    const st = ui.wire(root, (e) => {
      const t = e && e.target;
      const segEl = t && t.closest ? t.closest('.seg') : null;
      if (segEl && segEl.id === id + '-pre') { const p = PRESETS.find((q) => q.k === st.seg(id + '-pre')); if (p) ['-s', '-o', '-g', '-m'].forEach((k, i) => st.set(id + k, p.v[i])); }
      else if (t && t.type === 'range') st.setSeg(id + '-pre', '');
      if (segEl && segEl.id === id + '-t') stopPlay();
      if (segEl && segEl.id === id + '-sxq') sxSel = null;
      draw();
    });
    const tab = () => st.seg(id + '-t') || tab0;
    function stopPlay() { if (playH) { clearInterval(playH); playH = null; } root.querySelectorAll('[data-act="rplay"]').forEach((b) => { b.textContent = 'Play'; }); }
    SML.onCleanup(stopPlay);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (b && root.contains(b)) {
        const a = b.dataset.act;
        if (a === 'rnext') { rstep = Math.min(REPLAY.length - 1, rstep + 1); if (rstep === REPLAY.length - 1) stopPlay(); }
        else if (a === 'rback') { rstep = Math.max(0, rstep - 1); stopPlay(); }
        else if (a === 'rrestart') { rstep = 0; guess = null; stopPlay(); }
        else if (a === 'rplay') {
          if (playH) stopPlay();
          else {
            if (rstep >= REPLAY.length - 1) { rstep = 0; }
            b.textContent = 'Pause';
            playH = setInterval(() => { rstep = Math.min(REPLAY.length - 1, rstep + 1); if (rstep >= REPLAY.length - 1) stopPlay(); draw(); }, SML.reduced() ? 6000 : 4200);
          }
        }
        else if (a === 'gup' || a === 'gdn') guess = a === 'gup' ? 'up' : 'dn';
        else if ((a === 'aup' || a === 'adn') && !ans) { ans = a === 'aup' ? 'up' : 'dn'; const ok = ans === HEADS[gi].ans; score.n += 1; if (ok) score.ok += 1; score.marks[gi] = ok ? 'ok' : 'no'; }
        else if (a === 'gnext') { if (gi === HEADS.length - 1 && ans) { gi = 0; score = { ok: 0, n: 0, marks: [] }; } else if (ans) gi += 1; else gi = (gi + 1) % HEADS.length; ans = null; }
        draw();
        return;
      }
      const h = e.target.closest('[data-k]');
      if (h && fig.contains(h) && tab() === 'spacex') { sxSel = h.dataset.k; draw(); }
    });
    fig.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-k]') && tab() === 'spacex') { e.preventDefault(); sxSel = e.target.closest('[data-k]').dataset.k; draw(); } });
    ui.drag(fig, {
      sel: '.handle',
      move(pt) { if (!G || tab() !== 'play') return; const pe = clamp(G.y.inv(pt.y), A.pe0 * 0.75, A.pe0 * 1.25); st.set(id + '-m', Math.round((pe / A.pe0 - 1) * 100)); st.setSeg(id + '-pre', ''); draw(); },
    });

    /* ---------- playground ---------- */
    function drawPlay(W) {
      const s0 = st.n(id + '-s'), o = st.n(id + '-o'), g = st.n(id + '-g') / 100, m = st.n(id + '-m') / 100;
      const E1 = (A.eps0 + s0 - o) * (1 + g), PE1 = A.pe0 * (1 + m), P1 = E1 * PE1, chg = pc(P1, A.p0);
      const parts = [
        { l: ['Start'], v: A.p0, abs: true },
        { l: ['Quarter'], v: s0 * A.pe0 },
        { l: ['One-', 'time'], v: -o * A.pe0 },
        { l: ['Guid-', 'ance'], v: (A.eps0 + s0 - o) * g * A.pe0 },
        { l: ['Multi-', 'ple'], v: E1 * A.pe0 * m },
        { l: ['New'], v: P1, abs: true },
      ];
      const wide = W >= 640;
      const LW = wide ? Math.round(W * 0.55) : W, H1 = wide ? 310 : 246;
      /* EPS × P/E rectangle */
      const ml = 42, mr = 12, mt = 26, mb = 32;
      const x = SML.lin(0, 12, ml, LW - mr), y = SML.lin(0, 52, H1 - mb, mt);
      G = { y };
      let s = '';
      [0, 10, 20, 30, 40, 50].forEach((v) => { s += S.line(ml, y(v), LW - mr, y(v), 's-grid') + S.text(ml - 6, y(v) + 4, v + '×', 'xs mono', 'end'); });
      [0, 2, 4, 6, 8, 10, 12].forEach((v) => { s += S.text(x(v), H1 - mb + 15, '$' + v, 'xs mono', 'middle'); });
      s += S.line(ml, H1 - mb, LW - mr, H1 - mb, 's-mut') + S.line(ml, mt - 6, ml, H1 - mb, 's-mut');
      s += S.text(ml, 12, 'P/E: DOLLARS PAID PER $1 OF EPS', 'cap') + S.text(LW - mr, H1 - 3, 'EPS PER YEAR →', 'cap', 'end');
      const iso = (P, cls) => { const pts = []; for (let e = P / 52; e <= 12.001; e += 0.1) pts.push([x(e), y(P / e)]); return S.poly(pts, cls); };
      s += iso(A.p0, 's-mut dot2 w2');
      s += S.text(LW - mr, mt + 2, LW < 420 ? `dots: same ${usd(A.p0, 0)} price` : `dotted curve: every point = ${usd(A.p0, 0)}`, 'xs mut', 'end');
      const up = chg > 0.05, dn = chg < -0.05, tone = up ? 'up' : dn ? 'dn' : 'acc';
      if (up || dn) s += iso(P1, 's-' + tone + ' dot2 w15');
      s += S.rect(x(0), y(A.pe0), x(A.eps0) - x(0), y(0) - y(A.pe0), 'nf s-mut dash w15');
      s += S.rect(x(0), y(PE1), x(E1) - x(0), y(0) - y(PE1), 'f-' + tone + '-t s-' + tone + ' w2');
      const cx = (x(0) + x(E1)) / 2, cy = (y(PE1) + y(0)) / 2;
      s += S.text(cx, cy, usd(P1), 'xl mono b ink', 'middle') + S.text(cx, cy + 20, up || dn ? sP(chg) : 'no change', 'md b ' + tone, 'middle');
      s += S.text(cx, cy + 38, 'price = area', 'xs mut', 'middle');
      s += S.text(x(0) + 6, y(PE1) - 7, `P/E ${xx(PE1)}`, 'sm b acc');
      s += S.text(x(E1) - 6, H1 - mb - 7, `EPS ${usd(E1)}`, 'sm b acc', 'end');
      const hx = x(E1) - 22;
      s += S.circle(hx, y(PE1), 9, 'handle grab', ' data-h="pe"') + S.text(hx, y(PE1) - 14, 'drag', 'xs b acc', 'middle');
      /* price bridge */
      const bx = wide ? LW + 22 : 0, by = wide ? 0 : H1 + 18, BW = wide ? W - LW - 22 : W, BH = wide ? H1 : 214;
      let run = 0; const lv = [];
      parts.forEach((p) => { const a = p.abs ? 0 : run, b = p.abs ? p.v : run + p.v; if (!p.abs) lv.push(a, b); else lv.push(p.v); run = b; });
      const lo = Math.min(...lv), hi = Math.max(...lv), pad = Math.max(8, (hi - lo) * 0.28);
      const yb = SML.lin(lo - pad, hi + pad, BH - 46, 30);
      const slot = (BW - 8) / parts.length, bw = Math.min(46, slot * 0.6);
      let sb = S.text(4, 12, BW < 480 ? 'PRICE BRIDGE · NOT FROM $0' : 'PRICE BRIDGE · AXIS DOES NOT START AT $0', 'cap');
      run = 0;
      parts.forEach((p, i) => {
        const pcx = 4 + slot * (i + 0.5);
        let a, b, cls;
        if (p.abs) { a = lo - pad; b = p.v; cls = i === 0 ? 'f-shade2' : 'f-' + tone; }
        else { a = run; b = run + p.v; cls = p.v >= 0 ? 'f-up' : 'f-dn'; }
        const ya = yb(Math.max(a, b)), yz = yb(Math.min(a, b));
        if (!p.abs && Math.abs(p.v) < 0.005) sb += S.line(pcx - bw / 2, yb(run), pcx + bw / 2, yb(run), 's-mut w2');
        else sb += S.rect(pcx - bw / 2, ya, bw, Math.max(1.5, yz - ya), cls, 2);
        if (i < parts.length - 1) { const nb = p.abs ? p.v : run + p.v; sb += S.line(pcx + bw / 2, yb(nb), pcx + slot - bw / 2, yb(nb), 's-mut dash2'); }
        const lab = p.abs ? usd(p.v) : (Math.abs(p.v) < 0.005 ? '0' : sUsd(p.v));
        const lc = 'sm mono b ' + (p.abs ? 'ink' : p.v > 0.005 ? 'up' : p.v < -0.005 ? 'dn' : 'mut');
        if (p.abs || p.v >= 0) sb += S.text(pcx, ya - 6, lab, lc, 'middle'); else sb += S.text(pcx, yz + 14, lab, lc, 'middle');
        p.l.forEach((ln, k) => { sb += S.text(pcx, BH - 26 + k * 13, ln, 'sm ink', 'middle'); });
        run = p.abs ? p.v : run + p.v;
      });
      s += `<g transform="translate(${bx},${by})">${sb}</g>`;
      const H = wide ? H1 : by + BH;
      fig.innerHTML = S.wrap(W, H, `Apple price as EPS times P/E: ${usd(E1)} × ${xx(PE1)} = ${usd(P1)}, ${sP(chg)} from the July 30 close`, s);
      reads(rd, [['EPS investors count', usd(E1)], ['P/E', xx(PE1)], ['Price', usd(P1), '', true], ['Change', sP(chg), up ? 'up' : dn ? 'dn' : ''], ['Market value', '≈$' + F.num((P1 * A.sh) / 1e6, 2) + 'T']]);
      const contrib = [['quarter', parts[1].v], ['one-time', parts[2].v], ['guidance', parts[3].v], ['multiple', parts[4].v]];
      const big = contrib.slice().sort((p, q) => Math.abs(q[1]) - Math.abs(p[1]))[0];
      const L = {
        quarter: 'A beat adds to the profit investors count, but one quarter is only a quarter of the year.',
        'one-time': 'Investors strip out one-time gains, so that part of a beat earns no credit.',
        guidance: 'Guidance moves a whole year of expected EPS, which is why it usually outweighs the quarter.',
        multiple: 'The multiple is the market’s mood about growth, risk and interest rates. A small change in P/E moves the price as much as a big change in profit.',
      };
      if (Math.abs(chg) < 0.05 && Math.abs(s0) < 0.005 && o < 0.005 && g === 0 && m === 0) msgTo(msg, 'acc', 'Real start', `Apple’s trailing EPS of ${usd(A.eps0)} × a P/E of ${xx(A.pe0)} = ${usd(A.p0)}, the July 30, 2026 close. The rectangle’s area is the price. Pick a scenario or move a lever to see how a report changes each dial.`);
      else msgTo(msg, up ? 'up' : dn ? 'dn' : 'acc', up ? 'Price up' : dn ? 'Price down' : 'Offsetting', `${usd(E1)} × ${xx(PE1)} = ${usd(P1)} (${sP(chg)}). The biggest push came from the ${big[0]} (${sUsd(big[1])}). ${L[big[0]]}${(E1 > A.eps0 && m < 0) || (E1 < A.eps0 && m > 0) ? ' Here EPS and the multiple pull in opposite directions.' : ''}`);
      note.innerHTML = `The starting point is real: TTM EPS ${usd(A.eps0)} (the four quarters through June 2026) and the ${usd(A.p0)} close on July 30, 2026. The levers are illustrative what-ifs, not a forecast. A quarter’s surprise is added to the year’s EPS; guidance scales the whole year. Market value uses about ${F.num(A.sh / 1000, 2)} billion shares (the June quarter’s average), so it is approximate.`;
      $id(id + '-pill').textContent = 'Apple · illustrative levers';
    }

    /* ---------- replay July 31 ---------- */
    const RPTS = [
      { l: 'Jul 30 close', ls: 'Close', p: A.p0, t: usd(A.p0) },
      { l: 'After hours', ls: 'After hrs', p: A.ah, t: '≈$' + F.num(A.ah, 0) },
      { l: 'Jul 31 open', ls: 'Open', p: A.open, t: '≈$' + F.num(A.open, 0) },
      { l: 'Day low', ls: 'Low', p: AR.low, t: '≈$' + AR.low },
      { l: 'Jul 31 close', ls: 'Close', p: AR.closeAfter, t: '≈$' + AR.closeAfter },
    ];
    const SROWS = [
      { l: 'Revenue vs expected', ls: 'Revenue', a: pc(AP.is.cur.revenue, AEX.revenue[1]), b: pc(AP.is.cur.revenue, AEX.revenue[0]) },
      { l: 'EPS vs expected', ls: 'EPS', a: pc(A.eps, AEX.eps[1]), b: pc(A.eps, AEX.eps[0]) },
      { l: 'EPS without tariff refunds', ls: 'EPS without refunds', a: pc(A.epsX, AEX.eps[1]), b: pc(A.epsX, AEX.eps[0]) },
      { l: 'Services vs expected', ls: 'Services', a: pc(AP.is.cur.servSales, AEX.services), b: pc(AP.is.cur.servSales, AEX.services) },
      { l: 'Sept-quarter revenue guide', ls: 'Next-quarter guide', a: pc(A.gHi, AEX.nextQtrRevenue), b: pc(A.gLo, AEX.nextQtrRevenue) },
    ];
    function rangeTxt(a, b) { const lo = Math.min(a, b), hi = Math.max(a, b), d = lo % 1 === 0 && hi % 1 === 0 ? 0 : 1; return Math.abs(hi - lo) < 0.05 ? sP(lo, d) : `${sP(lo, d)} to ${sP(hi, d)}`; }
    function drawReplay(W) {
      const R = REPLAY[rstep], wide = W >= 640;
      const LW = wide ? Math.round(W * 0.5) : W, HP = 252;
      const ml = 44, mr = 12, top = 30, bot = HP - 60;
      const y = SML.lin(296, 338, bot, top), slot = (LW - ml - mr) / RPTS.length, px = (i) => ml + slot * (i + 0.5);
      let s = S.text(LW < 420 ? 4 : ml, 12, LW < 420 ? 'APPLE PRICE · REPORTED POINTS' : 'APPLE SHARE PRICE · REPORTED POINTS', 'cap');
      [300, 310, 320, 330].forEach((v) => { s += S.line(ml, y(v), LW - mr, y(v), 's-grid') + S.text(ml - 6, y(v) + 4, '$' + v, 'xs mono', 'end'); });
      s += S.line(ml, y(A.p0), LW - mr, y(A.p0), 's-mut dash');
      RPTS.forEach((p, i) => { s += S.text(px(i), bot + 16, wide ? p.l : p.ls, 'xs' + (i < R.pts ? ' ink' : ''), 'middle'); });
      for (let i = 1; i < R.pts; i++) s += S.line(px(i - 1), y(RPTS[i - 1].p), px(i), y(RPTS[i].p), 's-dn w25');
      RPTS.forEach((p, i) => {
        if (i >= R.pts) { s += S.circle(px(i), y(p.p), 4, 'nf s-line w15'); return; }
        s += S.circle(px(i), y(p.p), 5, i === 0 ? 'f-ink' : 'f-dn');
        const lc = 'sm mono b ' + (i === 0 ? 'ink' : 'dn');
        if (i === 1) s += S.text(px(i) + 9, y(p.p) + 4, p.t, lc);
        else if (i === 2 || i === 3) s += S.text(px(i), y(p.p) + 19, p.t, lc, 'middle');
        else s += S.text(px(i), y(p.p) - 10, p.t, lc, 'middle');
      });
      const cur = RPTS[R.pts - 1], pe = cur.p / A.eps0;
      const fx = R.pts === 1 ? `TTM EPS ${usd(A.eps0)} × ${xx(pe)} = ${usd(A.p0)}` : `${usd(A.eps0)} × ${xx(pe)} ≈ $${F.num(cur.p, 0)}${R.pts === 5 ? ` (${sP(AR.closePct)})` : ''}`;
      s += S.text(ml, HP - 22, 'PRICE ≈ EPS × P/E', 'cap acc') + S.text(ml, HP - 4, fx, (LW < 400 ? 'md' : 'lg') + ' mono b ' + (R.pts === 1 ? 'ink' : 'dn'));
      /* surprise rows */
      const bx = wide ? LW + 22 : 0, by = wide ? 0 : HP + 18, BW = wide ? W - LW - 22 : W;
      const rowH = 42, labOnTop = true;
      const x = SML.lin(-4, 8, 10, BW - 10);
      let sb = S.text(4, 12, BW < 420 ? 'SURPRISE VS EXPECTED' : 'SURPRISE VS WHAT ANALYSTS EXPECTED', 'cap');
      sb += S.line(x(0), 22, x(0), 22 + SROWS.length * rowH, 's-mut');
      SROWS.forEach((r, i) => {
        const yy = 22 + i * rowH, shown = i < R.rows;
        sb += S.text(10, yy + 14, wide ? r.l : r.l, 'sm b ' + (shown ? 'ink' : 'mut'));
        if (!shown) { sb += S.text(BW - 10, yy + 14, '?', 'sm b mut', 'end'); return; }
        const near = Math.abs(r.a) < Math.abs(r.b) ? r.a : r.b, far = near === r.a ? r.b : r.a, c = near >= 0 ? 'up' : 'dn';
        const a1 = x(Math.min(0, near)), b1 = x(Math.max(0, near));
        sb += S.rect(a1, yy + 21, Math.max(2, b1 - a1), 12, 'f-' + c, 2);
        if (Math.abs(far - near) > 0.05) { const a2 = x(Math.min(near, far)), b2 = x(Math.max(near, far)); sb += S.rect(a2, yy + 21, b2 - a2, 12, 'f-' + c + ' o35', 2); }
        sb += S.text(BW - 10, yy + 14, rangeTxt(r.a, r.b), 'sm mono b ' + c, 'end');
      });
      [-4, 0, 4, 8].forEach((v) => { sb += S.text(x(v), 22 + SROWS.length * rowH + 12, (v > 0 ? '+' : v < 0 ? MI : '') + Math.abs(v) + '%', 'xs mono', 'middle'); });
      s += `<g transform="translate(${bx},${by})">${sb}</g>`;
      const H = wide ? Math.max(HP, 22 + SROWS.length * rowH + 18) : by + 22 + SROWS.length * rowH + 18;
      fig.innerHTML = S.wrap(W, H, `Replay of Apple’s July 30 to 31, 2026 earnings reaction, step ${rstep + 1} of ${REPLAY.length}: ${R.h}`, s);
      const stEl = $id(id + '-step');
      let extra = '';
      if (R.guess) extra = `<div class="rcx-guess"><span class="rcx-lab">Your call for tomorrow</span><button type="button" class="btn sm ${guess === 'up' ? 'btn-up' : 'btn-g'}" data-act="gup">▲ Up</button><button type="button" class="btn sm ${guess === 'dn' ? 'btn-dn' : 'btn-g'}" data-act="gdn">▼ Down</button>${guess ? '<span class="rcx-lab">Locked in. Press Next.</span>' : ''}</div>`;
      if (rstep === REPLAY.length - 1 && guess) extra = `<p><b>You called ${guess === 'up' ? 'up' : 'down'}.</b> ${guess === 'dn' ? 'Right: the outlook mattered more than the beat.' : 'The headline beat pointed up, but the outlook and the one-time help pointed down, and the outlook won.'}</p>`;
      stEl.innerHTML = nb(`<span class="rcx-when">${R.when} · step ${rstep + 1} of ${REPLAY.length}</span><h4>${R.h}</h4><p>${R.p}</p>${extra}`);
      const dots = $id(id + '-rdots'); if (dots) dots.innerHTML = REPLAY.map((_, i) => `<i class="${i === rstep ? 'on' : i < rstep ? 'done' : ''}"></i>`).join('');
      root.querySelectorAll('[data-act="rback"]').forEach((b) => { b.disabled = rstep === 0; });
      root.querySelectorAll('[data-act="rnext"]').forEach((b) => { b.disabled = rstep === REPLAY.length - 1; });
      reads(rd, [['TTM EPS', usd(A.eps0)], ['P/E', xx(pe), R.pts > 1 ? 'dn' : ''], ['Price', R.pts === 1 ? usd(A.p0) : '≈$' + F.num(cur.p, 0), R.pts > 1 ? 'dn' : '', true], ['Move', R.pts === 1 ? '0%' : R.pts === 5 ? sP(AR.closePct) : sP(pc(cur.p, A.p0)), R.pts > 1 ? 'dn' : ''], ['Market value', '≈$' + F.num((cur.p * A.sh) / 1e6, 2) + 'T']]);
      const M = [
        ['acc', 'Set-up', 'The price already reflects these expectations. Only the surprise, and what it says about the future, can move it.'],
        ['up', 'Beat', 'On the headline alone, many traders would expect a pop. Make your call, then keep going.'],
        ['acc', 'Quality', 'Strip the temporary help and the EPS beat is small. Services also missed. The good news is thinner than the headline.'],
        ['dn', 'Outlook', 'Guidance resets next quarter’s numbers, and they came in below what was expected. This is the piece that moves the multiple.'],
        ['dn', 'Gap down', 'Gaps like this jump straight past stop orders. It is why many traders cut size or step aside before earnings.'],
        ['vio', 'Lesson', `Trailing EPS did not change; the P/E fell from about ${xx(A.pe0)} to about ${xx(A.pe1)}. A beat on the quarter, a softer outlook and temporary help: the outlook won. SpaceX shows the mirror image in the SpaceX case tab.`],
      ][rstep];
      msgTo(msg, M[0], M[1], M[2]);
      note.innerHTML = 'Prices, expectations and moves are as reported in the news (approximate); lines connect the reported points and are not an intraday chart. Revenue, EPS, the tariff refund and guidance are from Apple’s release and call. Ranges reflect the range of reported estimates. The beat without tariff refunds is our math, assuming the estimates did not include them.';
      $id(id + '-pill').textContent = 'Apple · real event';
    }

    /* ---------- headline game ---------- */
    function gauge(cx, cy, r, val, label, shown) {
      let s = S.path(`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`, 'nf s-line w4');
      s += S.text(cx - r - 2, cy + 14, MI, 'md b dn', 'middle') + S.text(cx + r + 2, cy + 14, '+', 'md b up', 'middle');
      if (shown) {
        const ang = { up: 52, flat: 0, dn: -52 }[val] * Math.PI / 180, tone = val === 'up' ? 'up' : val === 'dn' ? 'dn' : 'mut';
        s += S.line(cx, cy, cx + Math.sin(ang) * (r - 6), cy - Math.cos(ang) * (r - 6), 's-' + tone + ' w3') + S.circle(cx, cy, 5, 'f-' + tone);
        s += S.text(cx, cy + 32, val === 'up' ? 'up' : val === 'dn' ? 'down' : 'flat', 'sm b ' + tone, 'middle');
      } else s += S.text(cx, cy - 6, '?', 'xl b mut', 'middle') + S.circle(cx, cy, 4, 'f-mut');
      s += S.text(cx, cy + (shown ? 48 : 30), label, 'sm ink', 'middle');
      return s;
    }
    function drawGame(W) {
      const Hd = HEADS[gi], shown = !!ans, wide = W >= 560;
      const hl = $id(id + '-hl');
      hl.innerHTML = `<div class="rcx-co"><span class="pill ${Hd.real ? 'info' : ''}">${Hd.real ? 'Real' : 'Made-up'}</span><span>${Hd.co}</span><span>· headline ${gi + 1} of ${HEADS.length}</span></div><p class="rcx-hl">“${Hd.h}”</p>`;
      const r = wide ? 42 : Math.min(36, (W - 40) / 7);
      const lab = ['This quarter', 'Outlook', 'Multiple'];
      const GW = wide ? W * 0.7 : W;
      let s = S.text(4, 12, 'THE THREE DIALS', 'cap');
      lab.forEach((l, i) => { s += gauge(GW * ((i + 0.5) / 3), 30 + r + 8, r, Hd.d[i], l, shown); });
      const ry = wide ? 30 : 30 + r + 8 + 64, rx = wide ? W * 0.72 : 8;
      if (wide) s += S.line(W * 0.70, 26, W * 0.70, 30 + r + 60, 's-line');
      if (shown) {
        const okk = ans === Hd.ans, tone = Hd.ans === 'up' ? 'up' : 'dn';
        s += S.text(rx + 6, ry + 18, 'STOCK', 'cap') + S.text(rx + 6, ry + 54, Hd.ans === 'up' ? '▲ UP' : '▼ DOWN', 'xxl b disp ' + tone);
        s += S.text(rx + 6, ry + 76, (okk ? 'You called it: ' : 'You said ') + (ans === 'up' ? 'up' : 'down'), 'sm b ' + (okk ? 'up' : 'dn'));
      } else s += S.text(rx + 6, ry + 18, 'STOCK', 'cap') + S.text(rx + 6, ry + 54, '?', 'xxl b mut disp') + S.text(rx + 6, ry + 76, 'Make your call', 'sm mut');
      const H = wide ? 30 + r + 8 + 58 : ry + 86;
      fig.innerHTML = S.wrap(W, H, `Headline game: three dials for this quarter, the outlook and the multiple${shown ? ', and the stock’s reaction' : ''}`, s);
      root.querySelectorAll('[data-act="aup"],[data-act="adn"]').forEach((b) => { b.disabled = shown; });
      root.querySelectorAll('[data-act="gnext"]').forEach((b) => { b.textContent = gi === HEADS.length - 1 && shown ? 'Play again ↺' : 'Next headline ▶'; });
      const dots = $id(id + '-gdots'); if (dots) dots.innerHTML = HEADS.map((_, i) => `<i class="${score.marks[i] || (i === gi ? 'on' : '')}"></i>`).join('');
      const sc = $id(id + '-score'); if (sc) sc.textContent = `Score ${score.ok}/${score.n}`;
      reads(rd, [['Headline', `${gi + 1} of ${HEADS.length}`], ['Type', Hd.real ? 'Real' : 'Made-up'], ['Score', `${score.ok} / ${score.n}`, '', true]]);
      if (shown) msgTo(msg, ans === Hd.ans ? 'up' : 'dn', ans === Hd.ans ? 'Right' : 'Not quite', `<b>${Hd.res}</b> ${Hd.why}`);
      else msgTo(msg, 'acc', 'Your call', 'Read the headline. Which way does the stock go? Think about three dials: was the quarter better than expected, did the outlook change, and will investors pay more or less per $1 of profit?');
      note.innerHTML = 'Real headlines are paraphrased from the companies’ releases and news reports; the moves are as reported. Made-up companies show typical reactions, not rules: real reactions vary with what traders already expected.';
      $id(id + '-pill').textContent = 'Predict, then see why';
    }

    /* ---------- SpaceX case: Q3 2026 (latest) with the Q2 first report as the earlier contrast ---------- */
    const rng = (a, b) => `+${F.num(Math.min(a, b), 0)}–${F.num(Math.max(a, b), 0)}%`;
    const XQ = {
      q3: {
        rows: [
          { k: 'rev', l: 'Revenue', ex: `≈${fB(SXE.revenue[0], 1)}–${fB(SXE.revenue[1], 1)}`, ac: fB(X.rev, 1), chip: 'BEAT', c: 'up', a: pc(X.rev, SXE.revenue[1]), b: pc(X.rev, SXE.revenue[0]),
            m: `Revenue of ${fM(X.rev)} beat the about ${fB(SXE.revenue[0], 2)}–${fB(SXE.revenue[1], 2)} expected by ${rng(pc(X.rev, SXE.revenue[1]), pc(X.rev, SXE.revenue[0]))} (reported), and was up ${fP(X.yoy, 0)} from a year earlier.` },
          { k: 'eps', l: 'EPS', ex: `≈${usd(SXE.eps[0])}–${usd(SXE.eps[1])}`, ac: usd(xc.eps), chip: 'BEAT', c: 'up', txt: `$${F.num(xc.eps - SXE.eps[1], 2)}–$${F.num(xc.eps - SXE.eps[0], 2)} above`,
            m: `EPS of ${usd(xc.eps)} against about ${usd(SXE.eps[0])}–${usd(SXE.eps[1])} expected (reported): the first profitable quarter as a public company. About ${fB(X.below)} of the profit came from below the operating line.` },
          { k: 'guide', l: 'Q1 2027 guide', ex: `≈${fB(SXE.q1_2027Revenue, 1)}`, ac: `${fB(X.g1Lo, 0)}–${fB(X.g1Hi, 0)}`, chip: 'FAR ABOVE', c: 'up', a: pc(X.g1Lo, SXE.q1_2027Revenue), b: pc(X.g1Hi, SXE.q1_2027Revenue),
            m: `Management guided first-quarter 2027 revenue to ${fB(X.g1Lo, 0)}–${fB(X.g1Hi, 0)} when analysts had about ${fB(SXE.q1_2027Revenue)} (LSEG, reported): ${rng(pc(X.g1Lo, SXE.q1_2027Revenue), pc(X.g1Hi, SXE.q1_2027Revenue))} above. Guidance resets future EPS, and this time it reset it up.` },
          { k: 'capex', l: 'Q4 capex guide', ex: `Q3: ${fB(X.capex)}`, ac: `${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}`, chip: 'MORE SPENDING', c: 'dn', txt: `${F.num(X.q4Lo / X.capex, 1)}–${F.num(X.q4Hi / X.capex, 1)}× September’s`,
            m: `Fourth-quarter capex guided to ${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}, against ${fB(X.capex)} in September. In August, a capex jump helped sink the stock; this time the revenue outlook carried more weight.` },
        ],
        moves: [
          { k: 'ah3', l: 'After hours, Oct 20', a: SXR.afterHoursPct, b: SXR.afterHoursPct, m: `After the report the stock rose about ${fP(SXR.afterHoursPct, 0)} in after-hours trading (reported), from a ${usd(SXR.closeBefore)} close.` },
          { k: 'oct21', l: 'Oct 21', a: SXR.nextDayPct, b: SXR.nextDayPct, m: `On October 21 it closed up ${fP(SXR.nextDayPct)} at ${usd(SXR.closeAfter)} (reported).` },
        ],
      },
      q2: {
        rows: [
          { k: 'rev', l: 'Revenue', ex: `≈${fB(Q2.expectations.revenue[0], 2)}–${fB(Q2.expectations.revenue[1], 2)}`, ac: fB(X.revPq, 2), chip: 'BEAT', c: 'up', a: pc(X.revPq, Q2.expectations.revenue[1]), b: pc(X.revPq, Q2.expectations.revenue[0]),
            m: `June-quarter revenue of ${fM(X.revPq)} beat the about ${fB(Q2.expectations.revenue[0], 2)}–${fB(Q2.expectations.revenue[1], 2)} expected (reported).` },
          { k: 'eps', l: 'EPS', ex: `≈${usd(Q2.expectations.eps[0])} to ${usd(Q2.expectations.eps[1])}`, ac: usd(xq.eps), chip: 'BEAT', c: 'up', txt: `loss $${F.num(xq.eps - Q2.expectations.eps[1], 2)}–$${F.num(xq.eps - Q2.expectations.eps[0], 2)} smaller`,
            m: `EPS of ${usd(xq.eps)} against about ${usd(Q2.expectations.eps[0])} to ${usd(Q2.expectations.eps[1])} expected: a smaller loss than feared, but still a loss, so no P/E.` },
          { k: 'ebitda', l: 'Adj. EBITDA', ex: `≈${fB(Q2.expectations.ebitda, 1)}`, ac: fB(X.ebitdaPq, 2), chip: 'BEAT', c: 'up', a: pc(X.ebitdaPq, Q2.expectations.ebitda), b: pc(X.ebitdaPq, Q2.expectations.ebitda),
            m: `Positive ${fB(X.ebitdaPq, 2)} on SpaceX’s own adjusted measure, about ${fP(pc(X.ebitdaPq, Q2.expectations.ebitda), 0)} above the ≈${fB(Q2.expectations.ebitda)} expected.` },
          { k: 'capex', l: 'Capex', ex: `≈${fB(Q2.expectations.capex, 0)}`, ac: fB(X.capexPq, 1), chip: 'MORE SPENDING', c: 'dn', a: pc(X.capexPq, Q2.expectations.capex), b: pc(X.capexPq, Q2.expectations.capex),
            m: `Capex of ${fB(X.capexPq)} was about ${fP(pc(X.capexPq, Q2.expectations.capex), 0)} above the ≈${fB(Q2.expectations.capex, 0)} expected, and management said the next two quarters would be similar.` },
        ],
        moves: [
          { k: 'aug4', l: 'Aug 4, before the report', a: Q2.reaction.dayBeforePct, b: Q2.reaction.dayBeforePct, m: `The stock rose ${fP(Q2.reaction.dayBeforePct)} on August 4 to ${usd(Q2.reaction.closeBefore)}, before the report, so some good news may already have been in the price.` },
          { k: 'ah2', l: 'After hours', a: Q2.reaction.afterHoursPct[1], b: Q2.reaction.afterHoursPct[0], m: `After the report it fell about ${Math.abs(Q2.reaction.afterHoursPct[1])}%–${Math.abs(Q2.reaction.afterHoursPct[0])}% in after-hours trading (reported).` },
          { k: 'aug5', l: 'Aug 5', a: Q2.reaction.nextDayPct, b: Q2.reaction.nextDayPct, m: `On August 5 it closed down ${fP(-Q2.reaction.nextDayPct)} at ${usd(Q2.reaction.nextDayClose)} (reported), on the capex jump and ahead of the first lockup release on ${Q2.reaction.lockup.replace(/, 2026.*$/, '')}.` },
        ],
      },
    };
    const XCMP = [
      { k: 'cApple', l: 'Apple, Jul 31', v: AR.closePct, tag: 'beat, guide below', m: `Apple beat on revenue and EPS but guided the September quarter below expectations: it closed down about ${fP(-AR.closePct)} on July 31 (reported).` },
      { k: 'cQ2', l: 'SpaceX, Aug 5', v: Q2.reaction.nextDayPct, tag: 'beat, capex jump, lockup', m: `SpaceX’s first report beat, but capex jumped and the first lockup release was days away: down ${fP(-Q2.reaction.nextDayPct)} on August 5 (reported).` },
      { k: 'cQ3', l: 'SpaceX, Oct 21', v: SXR.nextDayPct, tag: 'beat, guide far above', m: `SpaceX beat again and guided far above expectations: up ${fP(SXR.nextDayPct)} on October 21 (reported). Same rule as Apple, opposite direction: the outlook moved the price.` },
    ];
    function drawSpaceX(W) {
      const wide = W >= 600, q = st.seg(id + '-sxq') || 'q3', D = XQ[q];
      const rowH = wide ? 40 : 58, y0 = 22;
      const exW = Math.max(...D.rows.map((r) => tw(r.ex, 11.5, true))), lW = Math.max(...D.rows.map((r) => tw(r.l, 13))), exX = Math.max(104, 8 + lW + 14);
      const acX = exX + exW + 14, acW = Math.max(...D.rows.map((r) => tw('→ ' + r.ac, 11.5, true)));
      const x = SML.lin(0, 85, wide ? acX + acW + 22 : 10, W - (wide ? 120 : 10));
      let s = S.text(4, 12, wide ? `THE SCOREBOARD · ${q === 'q3' ? 'OCTOBER 20 REPORT' : 'AUGUST 4 REPORT'} · EXPECTED (REPORTED) VS ACTUAL` : 'EXPECTED (REPORTED) → ACTUAL', 'cap');
      D.rows.forEach((r, i) => {
        const yy = y0 + i * rowH;
        if (sxSel === r.k) s += S.rect(1, yy + 1, W - 2, rowH - 2, 'rcx-sel', 4);
        const chipW = tw(r.chip, 10.5, true) + r.chip.length * 1.7 + 14;
        if (wide) {
          s += S.text(8, yy + 25, r.l, 'md b ink') + S.text(exX, yy + 25, r.ex, 'sm mono') + S.text(acX, yy + 25, '→ ' + r.ac, 'sm mono b ink');
          const bxx = x(0);
          if (r.a != null) {
            const n = Math.min(r.a, r.b), f = Math.max(r.a, r.b), t = rangeTxt(r.a, r.b), wt = tw(t, 11.5, true);
            s += S.rect(bxx, yy + 14, x(n) - bxx, 14, 'f-' + r.c, 2); if (f - n > 0.05) s += S.rect(x(n), yy + 14, x(f) - x(n), 14, 'f-' + r.c + ' o35', 2);
            s += x(f) + 6 + wt <= W - 12 - chipW ? S.text(x(f) + 6, yy + 25, t, 'sm mono b ' + r.c) : S.text(x(n) - 6, yy + 25, t, 'sm mono b on', 'end');
          }
          else s += S.text(bxx, yy + 25, r.txt, 'sm b ' + r.c);
          s += S.rect(W - 4 - chipW, yy + 12, chipW, 19, 'f-' + r.c + '-t', 9.5) + S.text(W - 4 - chipW / 2, yy + 25, r.chip, 'cap ' + r.c, 'middle');
        } else {
          s += S.text(8, yy + 16, r.l, 'md b ink') + S.rect(W - 4 - chipW, yy + 3, chipW, 19, 'f-' + r.c + '-t', 9.5) + S.text(W - 4 - chipW / 2, yy + 16, r.chip, 'cap ' + r.c, 'middle');
          s += S.text(8, yy + 33, `${r.ex} → ${r.ac}`, 'sm mono');
          if (r.a != null) { const n = Math.min(r.a, r.b), f = Math.max(r.a, r.b); s += S.rect(x(0), yy + 40, x(n) - x(0), 10, 'f-' + r.c, 2); if (f - n > 0.05) s += S.rect(x(n), yy + 40, x(f) - x(n), 10, 'f-' + r.c + ' o35', 2); const t = rangeTxt(r.a, r.b), tx = x(f) + 6; s += tx + tw(t, 11.5, true) < W - 4 ? S.text(tx, yy + 49, t, 'sm mono b ' + r.c) : S.text(x(n) - 6, yy + 49, t, 'sm mono b on', 'end'); }
          else s += S.text(8, yy + 49, r.txt, 'sm b ' + r.c);
        }
        s += hit(0, yy, W, rowH, r.k, r.l);
      });
      /* reported moves for this report */
      const my = y0 + D.rows.length * rowH + 30, mh = wide ? 30 : 46;
      s += S.text(4, my - 10, 'THE STOCK · REPORTED MOVES', 'cap');
      const mx = SML.lin(-16, 12, wide ? 200 : 10, W - (wide ? 110 : 10));
      const bars = (list, y1, lab) => {
        let t = '';
        list.forEach((r, i) => {
          const yy = y1 + i * mh;
          if (sxSel === r.k) t += S.rect(1, yy, W - 2, mh - 2, 'rcx-sel', 4);
          const n = Math.abs(r.a) < Math.abs(r.b) ? r.a : r.b, f = n === r.a ? r.b : r.a, c = n >= 0 ? 'up' : 'dn';
          const by2 = wide ? yy + 9 : yy + 22;
          t += S.text(8, wide ? yy + 19 : yy + 14, r.l, 'sm b ink');
          if (r.tag) t += wide ? S.text(W - 8, yy + 19, r.tag, 'xs mut', 'end') : S.text(W - 8, yy + 14, r.tag, 'xs mut', 'end');
          t += S.rect(Math.min(mx(0), mx(n)), by2, Math.abs(mx(n) - mx(0)), 13, 'f-' + c, 2);
          if (Math.abs(f - n) > 0.05) t += S.rect(Math.min(mx(n), mx(f)), by2, Math.abs(mx(f) - mx(n)), 13, 'f-' + c + ' o35', 2);
          const tx = rangeTxt(r.a, r.b), wt = tw(tx, 11.5, true);
          if (c === 'up') t += mx(f) + 6 + wt <= (wide && r.tag ? W - 8 - tw(r.tag, 10) - 8 : W - 4) ? S.text(mx(f) + 6, by2 + 11, tx, 'sm mono b up') : S.text(mx(f) - 6, by2 + 11, tx, 'sm mono b on', 'end');
          else if (mx(f) - 6 - wt >= (wide ? 140 : 4)) t += S.text(mx(f) - 6, by2 + 11, tx, 'sm mono b dn', 'end');
          else t += S.text(mx(0) + 6, by2 + 11, tx, 'sm mono b dn');
          t += hit(0, yy, W, mh - 2, r.k, r.l);
        });
        t += S.line(mx(0), y1 - 2, mx(0), y1 + list.length * mh, 's-mut');
        return t + (lab ? '' : '');
      };
      s += bars(D.moves, my);
      /* three reports, one lesson */
      const cy0 = my + D.moves.length * mh + 32;
      s += S.text(4, cy0 - 10, wide ? 'THREE REPORTS, ONE LESSON · NEXT-DAY CLOSE' : 'THREE REPORTS, ONE LESSON', 'cap acc');
      s += bars(XCMP.map((r) => ({ k: r.k, l: r.l, a: r.v, b: r.v, tag: r.tag })), cy0);
      const H = cy0 + XCMP.length * mh + 8;
      fig.innerHTML = S.wrap(W, H, q === 'q3' ? 'SpaceX September 2026 quarter: beats on revenue and EPS, a first-quarter 2027 revenue guide far above expectations and a bigger capex guide, the reported stock moves, and three reports compared' : 'SpaceX June 2026 quarter: beats on revenue, EPS and adjusted EBITDA while capex came in well above expectations, the reported stock moves, and three reports compared', s);
      if (q === 'q3') reads(rd, [['EPS, Sep qtr', usd(xc.eps), 'up'], ['Revenue beat', rng(pc(X.rev, SXE.revenue[1]), pc(X.rev, SXE.revenue[0])), 'up'], ['Q1 2027 guide vs expected', rng(pc(X.g1Lo, SXE.q1_2027Revenue), pc(X.g1Hi, SXE.q1_2027Revenue)), 'up', true], ['Oct 21 move', sP(SXR.nextDayPct), 'up'], ['Oct 21 close', usd(SXR.closeAfter)]]);
      else reads(rd, [['EPS, Jun qtr', usd(xq.eps), 'dn'], ['P/E', 'none (loss)', 'dn'], ['Revenue beat', rng(pc(X.revPq, Q2.expectations.revenue[1]), pc(X.revPq, Q2.expectations.revenue[0])), 'up'], ['Capex vs expected', sP(pc(X.capexPq, Q2.expectations.capex), 0), 'dn', true], ['Aug 5 move', sP(Q2.reaction.nextDayPct), 'dn']]);
      const all = D.rows.concat(D.moves).concat(XCMP);
      const r0 = all.find((r) => r.k === sxSel);
      const PL = { rev: 'Revenue', eps: 'EPS', ebitda: 'EBITDA', capex: 'Capex', guide: 'Guide', aug4: 'Aug 4', ah2: 'After hours', aug5: 'Aug 5', ah3: 'After hours', oct21: 'Oct 21', cApple: 'Apple', cQ2: 'SpaceX Q2', cQ3: 'SpaceX Q3' };
      if (r0) msgTo(msg, ['capex', 'ah2', 'aug5', 'cApple', 'cQ2'].indexOf(r0.k) >= 0 ? 'dn' : 'up', PL[r0.k], r0.m);
      else if (q === 'q3') msgTo(msg, 'up', 'Beat and guide up', `SpaceX beat on revenue and EPS, swung to a profit, and guided first-quarter 2027 revenue to ${fB(X.g1Lo, 0)}–${fB(X.g1Hi, 0)} against about ${fB(SXE.q1_2027Revenue)} expected (reported). The stock rose about ${fP(SXR.afterHoursPct, 0)} after hours and closed up ${fP(SXR.nextDayPct)} at ${usd(SXR.closeAfter)} on October 21. Apple beat too but guided below expectations and fell ${fP(-AR.closePct)}: the outlook moved both stocks. Switch to the August report for the opposite reaction.`);
      else msgTo(msg, 'vio', 'Beat, then drop', `The first report (August 4): a big beat on revenue, EPS and adjusted EBITDA, yet the stock closed down ${fP(-Q2.reaction.nextDayPct)} at ${usd(Q2.reaction.nextDayClose)} on August 5 (reported). Investors focused on capex of ${fB(X.capexPq)} against about ${fB(Q2.expectations.capex, 0)} expected and on the first lockup release on August 6. Tap any line.`);
      note.innerHTML = 'Expectations and stock moves are as reported in the news, so they are approximate. October: LSEG consensus via news reports, Motley Fool and TIKR. August: Zacks/Nasdaq and XTB for the estimates, Crypto Briefing for the ≈$13B capex estimate and the August 4 close, StartupHub for the August 5 close. Results are from SpaceX’s releases. Lighter bar ends show the range of reported estimates.';
      $id(id + '-pill').textContent = 'SpaceX · real events';
    }

    let lastTab = null;
    const draw = ui.responsive(fig, (W) => {
      const tb = tab();
      if (tb !== lastTab) { lastTab = tb; }
      root.querySelectorAll('.rcx-c').forEach((c) => { c.hidden = c.dataset.t.split(' ').indexOf(tb) < 0; });
      ({ play: drawPlay, replay: drawReplay, game: drawGame, spacex: drawSpaceX })[tb](W);
    });
  };

  /* ======================================================================
     Lessons
     ====================================================================== */
  const SXSRC = SX.sources || [];
  const APSRC = AP.sources || [];
  const srcBy = (list, re) => list.find((s) => re.test(s.t));

  SML.lessons.push({
    id: 'l-rc-spacex', course: 'realco', order: 6, title: 'SpaceX: from a loss to a profit', mins: 14, level: 'Intermediate',
    summary: 'Q3 2026: first profit as a public company, its quality, EBITDA, capex, IPO, P/S.',
    idea: `SpaceX swung to a ${bil(xc.netInc)} profit, but part came from below the operating line and capex keeps cash flowing out.`,
    widget: 'growthVsProfit', opts: {},
    try: 'Switch tabs and quarters, and tap any bar or row for its card. On Adj. EBITDA, press Next to walk the bridge one step at a time.',
    extra: [
      { widget: 'growthVsProfit', opts: { part: 'ipo' }, try: 'Press Play the year to watch the balance sheet change through the IPO and the Cursor deal, split the same profit over more shares, then set your own market value to see price to sales.' },
      { widget: 'earningsPrice', opts: { tab: 'spacex' }, try: 'Compare the October report (a beat and a big guide, up) with the August one (a beat, then down), next to Apple.' },
    ],
    body: [
      `<h3>The latest quarter: a first profit as a public company</h3><p>SpaceX listed on ${SX.ipo.exchange} in June 2026 (ticker ${SX.ticker}; priced at $${SX.ipo.priced}, opened at $${SX.ipo.open}). Its latest reported quarter as of October 2026 is July to September 2026, reported on October 20, 2026. Revenue rose ${fP(X.yoy, 0)} to ${bil(X.rev)}, the core business made an operating profit of ${bil(xc.opInc)} and net income was ${bil(xc.netInc)} (EPS ${usd(xc.eps)}): its first profitable quarter as a public company. Three months earlier, in its first report, it lost ${amt(-xq.netInc)}.</p>`,
      `<p>We keep using <b>Hoppy’s Coffee Cart</b> from the earlier lessons. Its real numbers are profitable, so for losses (like SpaceX’s June quarter) and the IPO we add a clearly made-up next chapter, <b>Hoppy’s opens a second cart</b>. A year later Hoppy runs the old cart, a new cart across town and a delivery app:</p><ul><li>Old cart: $12,000 of monthly sales and +$4,800 of operating income.</li><li>New cart: $4,000 of sales and −$1,000.</li><li>Delivery app: $3,200 of sales and −$4,200.</li><li>Total: $19,200 of sales, up 92% from $10,000, but an operating loss of −$400. With $300 of loan interest, a net loss of −$700.</li></ul>`,
      `<h3>Loss to profit, and the quality check</h3>${tcard(SXC.revenue)}${tcard(SXC.opInc)}<p>Operating income is the profit from the business itself. Net income was bigger, ${bil(xc.netInc)}, because about ${bil(X.below)} came from below the operating line: other income of ${amt(xc.other)} (of which ${amt(SX.belowTheLine.otherRelatedParty)} from a related party, per TIKR), net interest income of ${amt(X.netInt)} and a ${amt(-xc.tax)} tax benefit. Those can vanish next quarter.</p>${tcard(SXC.belowLine)}`,
      `<h3>Loss lessons from June, and from Space</h3><p>In June 2026, SpaceX’s first report as a public company, R&amp;D used ${fP(X.rdOfGrossPq, 0)} of gross profit, so the operating line was a loss of ${amt(xq.opInc)} and the net loss ${amt(xq.netInc)}. In September the Space segment still had a small operating loss: ${amt(segOf('space').opInc)} on ${bil(segOf('space').revenue)} of revenue.</p>${tcard(SXC.opLoss)}${tcard(SXC.netLoss)}`,
      `<h3>Segments: who earns what</h3><p><b>Starlink</b> (Connectivity) earned ${amt(segOf('conn').opInc)} of operating income on ${amt(segOf('conn').revenue)} of revenue (${fP(X.connOm)}): about ${fP(X.connShareOp, 0)} of the company’s operating income. <b>Super Intelligence</b> (formerly AI: Grok, cloud computing, X and, since ${SN.cursorClosed}, Cursor) brought in ${amt(segOf('ai').revenue)}, about ${fP(X.siShareRev, 0)} of all revenue, and earned ${amt(segOf('ai').opInc)} after ${amt(SN.cursorStockComp)} of stock pay from the Cursor deal. <b>Space</b> was close to break-even.</p>${tcard(SXC.subs)}`,
      `<h3>GAAP profit vs adjusted EBITDA</h3><p>SpaceX also reports <b>adjusted EBITDA</b>, its own non-GAAP measure. Start from ${fM(xc.netInc)} of net income. Add back depreciation and amortization (${fM(X.da)}), stock pay (${fM(X.sbc)}), stock pay from the Cursor deal (${fM(X.acqSbc)}), interest expense (${fM(X.intExpAdd)}) and ${fM(X.smallAdd)} of deal and restructuring costs. Then take out interest income (${fM(X.intIncOut)}), other income (${fM(X.otherOut)}) and the tax benefit (${fM(X.taxOut)}). You land on positive ${fM(X.ebitda)}, about ${bil(X.ebitda)}, on SpaceX’s own adjusted measure. It is not a profit, and it leaves out capex.</p>${tcard(SXC.adjEbitda)}`,
      `<h3>Capex and cash burn</h3><p>SpaceX spent ${bil(X.capex)} on capex in the quarter, ${F.num(X.capexEbitda, 1)} times adjusted EBITDA and ${fP(X.siCapexShare, 0)} of it for Super Intelligence, and guided the fourth quarter to ${bil(X.q4Lo, 0)}–${bil(X.q4Hi, 0)}. Cash-flow totals are published for the year to date.</p>${tcard(SXC.fcf)}`,
      `<h3>The balance sheet: IPO, conversion, Cursor</h3><p>From December 31, 2025 to September 30, 2026:</p><ul><li><b>Cash and marketable securities</b> rose from ${bil(X.cash0)} to ${bil(X.cashSec)} (about ${bil(X.cashSecMid)} on June 30, right after the IPO).</li><li><b>Preferred stock</b> of ${bil(X.pref0)} converted into common shares.</li><li><b>Goodwill</b> jumped from ${bil(X.gw0)} to ${bil(X.gw)}, mostly from buying Cursor.</li><li><b>Paid-in capital</b> grew from ${bil(X.apic0)} to ${bil(X.apic)}. The <b>accumulated deficit</b> went from ${bil(X.def0)} to ${bil(X.defMid)} after the first-half losses, then to ${bil(X.def)} after the September profit.</li><li><b>Debt and finance leases</b> rose from ${bil(X.debt0)} to ${bil(X.debt)}. On the June-quarter call, the CFO said the IPO and a ${bil(Q2.bond, 0)} bond sale strengthened the balance sheet, with part of the bond money used to repay a ${bil(Q2.bridgeLoan, 0)} bridge loan.</li></ul>${tcard(SXC.gw)}${tcard(SXC.equity)}`,
      `<h3>Dilution: the same profit, more slices</h3>${tcard(SXC.dilution)}`,
      `<h3>Still no trailing P/E, so price to sales</h3><p>One profitable quarter is not a year: the nine months to September were still a loss (EPS ${usd(SX.is.ytd.eps)}). So investors lean on <b>price to sales</b>: market value divided by a year of revenue. A common shortcut for a fast grower is the run rate, the latest quarter × 4: ${bil(X.runRate)}. The market value changes every day, so the widget lets you set it.</p>${tcard(SXC.ps)}`,
      `<h3>The reaction: two reports, opposite moves</h3><p><b>August 4 (the June quarter):</b> SpaceX beat on revenue, EPS and adjusted EBITDA, but capex jumped to ${bil(X.capexPq)} against about ${bil(Q2.expectations.capex, 0)} expected and the first lockup release was two days away. The stock closed down ${fP(-Q2.reaction.nextDayPct)} at ${usd(Q2.reaction.nextDayClose)} on August 5 (reported).</p><p><b>October 20 (the September quarter):</b> another beat (revenue ${bil(X.rev)} against about ${bil(SXE.revenue[0], 2)}–${bil(SXE.revenue[1], 2)}; EPS ${usd(xc.eps)} against about ${usd(SXE.eps[0])}–${usd(SXE.eps[1])}), plus a first-quarter 2027 revenue guide of ${bil(X.g1Lo, 0)}–${bil(X.g1Hi, 0)} against about ${bil(SXE.q1_2027Revenue)} expected. The stock rose about ${fP(SXR.afterHoursPct, 0)} after hours and closed up ${fP(SXR.nextDayPct)} at ${usd(SXR.closeAfter)} on October 21 (reported). Apple beat too but guided below expectations, and fell about ${fP(-AP.reaction.closePct)}. The outlook moved all three. More in <a href="#l-rc-price">How earnings move the stock price</a>; hear the call retold in the <a href="#l-rc-spacex-call">SpaceX earnings call lesson</a>, and try the <a href="#tool-earnings-price">earnings and price tool</a>.</p>${tip('When a company reports a big profit, check two lines before you celebrate: how much came from below the operating line, and how capex compares with adjusted EBITDA.')}`,
    ],
    example: {
      title: 'SpaceX’s latest quarter in five lines',
      intro: 'The September 2026 quarter ($ millions); the last line is our math.',
      steps: [
        `Revenue ${fM(X.rev)} against ${fM(X.revYa)} a year earlier: ${F.num(X.rev)} ÷ ${F.num(X.revYa)} = ${F.num(X.rev / X.revYa, 3)}, so up ${fP(X.yoy)}.`,
        `Gross profit ${fM(xc.gross)} minus R&amp;D ${fM(xc.rd)}, SG&amp;A ${fM(xc.sga)} and restructuring ${fM(xc.restructuring)} = operating income of ${sM(xc.opInc)}.`,
        `Then net interest ${sM(X.netInt)} (${fM(xc.intExp)} + ${fM(xc.intInc)}), other income ${sM(xc.other)} and a ${fM(-xc.tax)} tax benefit: net income of ${sM(xc.netInc)}. Divided by ${F.num(xc.sh)}M diluted shares, EPS is ${usd(xc.eps)}.`,
        `Add back D&amp;A ${fM(X.da)} and stock pay ${fM(X.sbc)} + ${fM(X.acqSbc)}, take out the below-the-line gains, and the bridge lands on positive ${fM(X.ebitda)} of adjusted EBITDA.`,
        `Nine months of operating cash (${fM(X.ocf9)}) minus nine months of capex (${fM(X.capexYtd)}) = free cash flow of ${fM(X.fcf9)}, about ${fB(X.fcf9)}.`,
      ],
      result: `A real operating profit, ${fB(X.below)} of help from below the line, positive ${fB(X.ebitda)} on SpaceX’s own adjusted measure, and still about ${fB(-X.fcf9)} more cash out than in over nine months.`,
    },
    mistakes: [
      `Reading net income without asking where it came from. About ${fB(X.below)} of the ${fB(xc.netInc)} came from below the operating line.`,
      `Treating adjusted EBITDA as profit. The ${fB(X.ebitda)} leaves out ${fB(X.da)} of wear and tear and the stock pay, and capex of ${fB(X.capex)} is ${F.num(X.capexEbitda, 1)} times bigger.`,
      `Comparing EPS without the share count. Diluted average shares went from ${F.num(xy.sh)}M to ${F.num(xc.sh)}M in a year.`,
      'Forgetting the lockup calendar. When insiders are free to sell, extra supply can weigh on the price even after good results.',
    ],
    points: [
      `Revenue rose ${fP(X.yoy, 0)}, and SpaceX swung from a ${fM(xq.netInc)} loss in June to ${sM(xc.netInc)} of net income in September.`,
      `About ${fB(X.below)} of that profit came from below the operating line; the ${fB(xc.opInc)} operating profit is the part that can repeat.`,
      `Starlink earns most of the operating income; Super Intelligence brings in about half the revenue and takes ${fP(X.siCapexShare, 0)} of the capex.`,
      `Capex (${fB(X.capex)}) is more than twice adjusted EBITDA; nine-month free cash flow was about ${fB(X.fcf9)}, and fourth-quarter capex is guided to ${fB(X.q4Lo, 0)}–${fB(X.q4Hi, 0)}.`,
      `The outlook moved the stock: down ${fP(-Q2.reaction.nextDayPct)} after the August report, up ${fP(SXR.nextDayPct)} after the October one.`,
    ],
    quiz: { q: `SpaceX’s September 2026 operating income was ${fB(xc.opInc)} but its net income was ${fB(xc.netInc)}. What made up most of the difference?`, options: ['Other income, net interest income and a tax benefit, all below the operating line', 'Higher Starlink prices', 'Lower R&amp;D spending'], answer: 0, why: `Other income ${fM(xc.other)}, net interest ${sM(X.netInt)} and a ${fM(-xc.tax)} tax benefit add up to about ${fB(X.below)}. Gains like these may not repeat, so investors value the operating profit more.` },
    terms: ['Operating income', 'Adjusted EBITDA', 'Cash burn', 'Dilution', 'Goodwill', 'Price to sales'],
    glossary: [
      { t: 'Below the operating line', d: 'Everything between operating income and net income: interest, other income or expense, and taxes.' },
      { t: 'Acquisition-related stock compensation', d: 'Shares granted as part of buying a company, booked as pay. Adjusted measures usually add it back.' },
      { t: 'Convertible preferred stock', d: 'Special shares, usually held by early investors, with extra protections. They can convert into common stock, often at an IPO.' },
      { t: 'Additional paid-in capital', d: 'Money investors paid for shares above their tiny par value: in plain words, the money owners put in.' },
      { t: 'Weighted average shares', d: 'The average share count over a period, weighted by how long each share existed. EPS divides by it.' },
      { t: 'Bridge loan', d: 'A short-term loan meant to be replaced by longer-term money, such as a bond sale.' },
    ],
    sources: SXSRC,
  });

  SML.lessons.push({
    id: 'l-rc-price', course: 'realco', order: 8, title: 'How earnings move the stock price', mins: 12, level: 'Intermediate',
    summary: 'Price ≈ EPS × P/E: surprises, guidance, temporary items and the multiple.',
    idea: 'Price is roughly EPS times P/E. Results move EPS, the outlook moves future EPS, and mood moves the multiple.',
    widget: 'earningsPrice', opts: {},
    try: 'Start on the Playground with Apple’s real numbers, then replay July 31, 2026 step by step, play the headline game and open the SpaceX case.',
    body: [
      `<h3>One formula</h3><p>Apple’s fiscal year ends in late September, so its April to June 2026 quarter is “fiscal Q3 2026”, reported on July 30, 2026: its latest reported quarter as of October 2026. Everything that happened to the stock next fits into one line.</p>${tcard(APC.formula, 'At Apple')}`,
      `<h3>Markets trade the surprise</h3>${tcard(APC.surprise, 'At Apple')}<p>That is why the same result can lift one stock and sink another: what matters is the gap between what happened and what was already priced in. See also <a href="#l-earnings">Earnings reports</a> and <a href="#l-earnings-season">Earnings season and the economy</a>.</p>`,
      `<h3>Guidance moves next year’s EPS</h3>${tcard(APC.guidance, 'At Apple')}`,
      `<h3>Quality: how much of the beat counts</h3>${tcard(APC.quality, 'At Apple')}<p>Always ask two questions: how much of this profit is temporary, and what does the adjusted number leave out? The <a href="#l-rc-apple-income">Apple income lesson</a> lets you remove the tariff refund line by line, and the <a href="#l-rc-spacex">SpaceX lesson</a> shows a profit with ${bil(X.below)} of help from below the operating line.</p>`,
      `<h3>The multiple: what investors will pay</h3>${tcard(APC.multiple, 'At Apple')}<p>Interest rates move multiples too: when bond yields rise, future profits are worth less today (<a href="#l-rates">rates and yields</a>).</p>`,
      `<h3>Which P/E?</h3>${tcard(APC.ttm, 'At Apple')}`,
      `<h3>The whole company</h3>${tcard(APC.mcap, 'At Apple')}`,
      `<h3>The same rule at SpaceX, both ways</h3><p>In August, SpaceX’s first report beat on revenue, EPS and adjusted EBITDA, but capex jumped and the first lockup release was days away: the stock closed down ${fP(-Q2.reaction.nextDayPct)} (reported). In October it beat again and guided first-quarter 2027 revenue to ${bil(X.g1Lo, 0)}–${bil(X.g1Hi, 0)} against about ${bil(SXE.q1_2027Revenue)} expected: up ${fP(SXR.nextDayPct)}. That quarter was profitable (EPS ${usd(xc.eps)}), but with the nine months still at a loss there is no meaningful trailing P/E, so investors lean on sales and the outlook. Open the SpaceX case tab above, or the full <a href="#l-rc-spacex">SpaceX lesson</a>.</p>`,
      `<h3>How traders use this</h3><ul><li>Check the date: earnings are on the <a href="#calendar">calendar</a>. Apple reports its September quarter on November 2, 2026.</li><li>Size down or step aside before the report: a gap can jump straight past your stop (<a href="#l-position-size">position sizing</a>, <a href="#l-one-percent">the 1% rule</a>).</li><li>Options get expensive before earnings and lose value after them (<a href="#l-iv-crush">IV and earnings</a>, <a href="#l-volatility">expected move</a>).</li><li>Read the outlook first, then the quality of the beat, then the headline.</li></ul>${tip('Before an earnings date, write down three things: what is expected, what would count as a real surprise, and what you will do if the stock gaps. Then you react to a plan, not to the headline.')}`,
    ],
    example: {
      title: 'Apple’s July 31, 2026 in numbers',
      intro: 'Expectations and moves are as reported; the arithmetic is ours.',
      steps: [
        `July 30 close ${usd(A.p0)} ÷ TTM EPS ${usd(A.eps0)} = a P/E of about ${xx(A.pe0)}.`,
        `Reported EPS ${usd(A.eps)} against about ${usd(AEX.eps[0])}–${usd(AEX.eps[1])} expected: a beat of ${usd(A.beatLo)}–${usd(A.beatHi)}, about ${fP(pc(A.eps, AEX.eps[1]), 0)}.`,
        `Strip the ${usd(AP.tariffRefund.eps)} tariff refund: ${usd(A.eps)} − ${usd(AP.tariffRefund.eps)} = ${usd(A.epsX)}, a beat of only ${usd(A.beatXLo)}–${usd(A.beatXHi)} (our math, assuming the estimates did not include the refunds).`,
        `Guidance: ${AG.revGrowth[0]}%–${AG.revGrowth[1]}% growth on last year’s ${fB(AG.baseRevenue)} = about ${fB(A.gLo)}–${fB(A.gHi)}, against about ${fB(AEX.nextQtrRevenue, 0)} expected.`,
        `Close about $${AR.closeAfter} (${sP(AR.closePct)}). $${AR.closeAfter} ÷ ${usd(A.eps0)} ≈ ${xx(A.pe1)}: the same trailing EPS at a lower multiple.`,
      ],
      result: `About $${F.num(A.p0 - A.p1, 0)} a share, roughly $${F.num(Math.round(A.mcapDrop / 10000) * 10, 0)} billion of market value (our math), came off on a quarter that beat.`,
    },
    mistakes: [
      'Judging a report by the headline beat. Check what is temporary and, above all, the guidance.',
      'Quoting a P/E without saying trailing or forward. The same stock can show very different numbers.',
      'Assuming a great quarter must lift the stock. If the price already assumed even more, it can fall.',
      'Holding a full-size position, or buying options, right before the report. Gaps jump stops, and option prices drop after the report (IV crush).',
    ],
    points: [
      'Price ≈ EPS × P/E: results move EPS, the outlook moves future EPS, and mood moves the P/E.',
      'Stocks move on the surprise against expectations, and most of all on guidance.',
      'Strip temporary items: a low-quality beat earns little credit.',
      `A small change in the multiple moves the price as much as a big change in profit: on July 31 Apple’s trailing EPS stayed ${usd(A.eps0)} while its P/E fell from about ${xx(A.pe0, 0)} to about ${xx(A.pe1, 0)}.`,
      'The outlook works both ways: Apple guided below expectations and fell; SpaceX guided far above and rose.',
    ],
    quiz: { q: 'A stock trades at $100 with yearly EPS of $5 (P/E 20). The quarter is in line, but guidance cuts next year’s EPS outlook by 10% and the P/E slips to 18. Roughly where does the price go?', options: ['About $90', 'About $81', 'It stays at $100, because the quarter was in line'], answer: 1, why: '$5 × 0.9 = $4.50 of expected EPS, × 18 = $81. A smaller EPS and a smaller multiple multiply.' },
    terms: ['P/E', 'Forward P/E', 'Trailing twelve months', 'Multiple', 'Beat', 'Market cap'],
    glossary: [
      { t: 'Multiple expansion', d: 'When investors start paying more per $1 of earnings, so the price rises faster than profit.' },
      { t: 'Multiple contraction', d: 'When investors pay less per $1 of earnings, so the price falls even if profit holds.' },
      { t: 'Sell the news', d: 'When a stock that rose into an event falls after it, because the good news was already in the price.' },
    ],
    sources: [APSRC[0], APSRC[1], APSRC[4], APSRC[5], srcBy(SXSRC, /Motley Fool: Stock market/), srcBy(SXSRC, /Zacks/), srcBy(SXSRC, /XTB/), srcBy(SXSRC, /Crypto Briefing/), srcBy(SXSRC, /StartupHub/)].filter(Boolean),
  });

  /* keep "−$" together in every lesson string */
  ['l-rc-spacex', 'l-rc-price'].forEach((lid) => {
    const l = SML.lessons.find((q) => q.id === lid); if (!l) return;
    l.body = l.body.map(nb); l.mistakes = l.mistakes.map(nb); l.points = l.points.map(nb);
    l.example.steps = l.example.steps.map(nb); l.example.result = nb(l.example.result);
    l.quiz.options = l.quiz.options.map(nb); l.quiz.why = nb(l.quiz.why); l.quiz.q = nb(l.quiz.q);
  });
})();
