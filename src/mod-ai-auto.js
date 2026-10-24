/* Stock Market Lessons: Trading with AI, part 2 (automation): agentFlow, botRiskSim, setupRules. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = (s, r) => (r || document).querySelector(s);

  const CROSS = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-dn-t"/><path d="M6 6l6 6M12 6l-6 6" class="nf s-dn w2"/></svg>';
  const DASH = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-shade"/><path d="M5.5 9h7" class="nf s-mut w2"/></svg>';
  const WAIT = '<svg class="ck" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8.5" class="f-acc-t"/><circle cx="9" cy="9" r="3" class="f-acc"/></svg>';

  SML.css(`
.af-pane{display:grid;grid-template-columns:minmax(0,1fr)}
.af-pane > div{padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-width:0}
.af-pane > div + div{border-top:1px solid var(--line)}
@media (min-width:820px){.af-pane{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.af-pane > div + div{border-top:0;border-left:1px solid var(--line)}}
.af-h{font:600 10.5px/1.3 var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
.af-req{font-size:15.5px;line-height:1.45;color:var(--ink);font-weight:500}
.af-checks{list-style:none;display:flex;flex-direction:column;gap:9px}
.af-checks li{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;font-size:14px;line-height:1.45;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.af-checks li small{display:block;color:var(--muted);font-size:12.5px}
.af-code{margin:0;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:12px 14px;font:500 12.5px/1.6 var(--mono);color:var(--ink);overflow-x:auto;white-space:pre;max-width:100%}
.af-code .c{color:var(--muted);font-style:italic} .af-code .k{color:var(--info)} .af-code .s{color:var(--up)} .af-code .n{color:var(--accent)}
.af-acts .grow{flex:1 1 auto}
.sr-code{font-size:12px}
.br-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.br-legend i{display:inline-block;width:18px;height:0;border-top:2px solid var(--muted);vertical-align:middle;margin-right:6px}
.br-legend i.y{border-top-color:var(--accent);border-top-width:3px}
.br-legend i.d{border-top-style:dashed}
.br-legend b{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--up);margin-right:6px;vertical-align:middle}
.br-grp{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.br-grp > span{font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted);min-width:76px}
.sr-grid{display:grid;grid-template-columns:minmax(0,1fr)}
.sr-grid > div{padding:14px 16px;min-width:0;display:flex;flex-direction:column;gap:10px}
.sr-grid > div + div{border-top:1px solid var(--line)}
@media (min-width:860px){.sr-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.sr-grid > div + div{border-top:0;border-left:1px solid var(--line)}}
.sr-rules{display:flex;flex-direction:column}
.sr-rules > div{display:grid;grid-template-columns:88px minmax(0,1fr);gap:12px;padding:8px 0;border-bottom:1px dashed var(--line);font-size:14px;line-height:1.45}
.sr-rules > div:last-child{border-bottom:0}
.sr-rules dt{font:600 10.5px/1.6 var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--accent)}
.sr-rules dd{margin:0;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.sr-dots{display:inline-flex;gap:4px;vertical-align:middle;margin-left:6px}
.sr-dots i{width:9px;height:9px;border-radius:50%;background:var(--line)}
.sr-dots i.on{background:var(--accent)}
.sr-pc{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
@media (min-width:640px){.sr-pc{grid-template-columns:1fr 1fr}}
.sr-pc ul{list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13.5px;line-height:1.45}
.sr-pc li{display:grid;grid-template-columns:16px minmax(0,1fr);gap:8px}
.sr-pc .ck{width:16px;height:16px;flex-basis:16px}
`);

  /* =====================================================================
     agentFlow: one request flowing You > Claude > MCP server > agentic account > exchange
     ===================================================================== */
  SML.widgets.agentFlow = function (root) {
    const id = SML.uid('af');
    const REQ = {
      ok: { label: 'Small limit buy', text: 'Buy 5 shares of DEMO, limit $48.20.', sym: 'DEMO', qty: 5, type: 'limit', px: 48.2 },
      big: { label: 'Big dollar buy', text: 'Buy $3,000 of DEMO at market.', sym: 'DEMO', usd: 3000, type: 'market', px: 48.2 },
      off: { label: 'Not on my list', text: 'Buy 10 shares of ZORB, limit $12.40.', sym: 'ZORB', qty: 10, type: 'limit', px: 12.4 },
      over: { label: 'Over budget', text: 'Buy 30 shares of DEMO, limit $48.20.', sym: 'DEMO', qty: 30, type: 'limit', px: 48.2 },
    };
    const ALLOWED = ['DEMO', 'ACME'];
    const NODES = [['You', 'rules, approval'], ['Claude', 'AI client'], ['MCP server', 'Robinhood'], ['Agentic', 'account'], ['Exchange', 'fills orders']];
    const STEP_NODE = [0, 1, 2, 3, 0, 4];
    let step = 0, decision = 'pending', timer = null;

    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Request</span>${ui.seg(id + '-r', Object.keys(REQ).map((k) => ({ v: k, label: REQ[k].label })), 'ok', 'Request to the agent')}</div>
      <div class="wg-bar"><span class="wg-title">Guardrails</span>${ui.chips(id + '-g', [
        { k: 'appr', label: 'Review before trade', color: 'var(--up)', on: true },
        { k: 'budget', label: 'Pilot-size account ($1,000)', color: 'var(--up)', on: true },
        { k: 'maxpos', label: 'Rule: max 25% per position', color: 'var(--accent)', on: true },
        { k: 'list', label: 'Rule: allowed tickers', color: 'var(--accent)', on: true },
      ])}</div>
      <div class="wg-fig"></div>
      <div class="af-pane">
        <div><span class="af-h">What you asked</span><p class="af-req" id="${id}-req"></p><span class="af-h">Checks so far</span><ul class="af-checks" id="${id}-checks"></ul></div>
        <div><span class="af-h">Tool call (simulated, field names illustrative)</span><pre class="af-code" id="${id}-code"></pre></div>
      </div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-actions af-acts">
        <button type="button" class="btn sm btn-g" data-a="back">Back</button>
        <button type="button" class="btn sm btn-p" data-a="next">Next step</button>
        <button type="button" class="btn sm btn-g" data-a="all">Run to the end</button>
        <button type="button" class="btn sm btn-up" data-a="approve" hidden>Approve</button>
        <button type="button" class="btn sm btn-dn" data-a="reject" hidden>Reject</button>
        <span class="grow"></span>
        <button type="button" class="btn sm btn-g" data-a="reset">Reset</button>
      </div>
      <div class="wg-note">Simulation for learning. Robinhood documents its real tools in its support articles; the names and fields here are illustrative. Only the account balance and the review step are controls Robinhood provides; the 25% and ticker rules live in your instructions, which an agent can misread.</div>`;
    const fig = root.querySelector('.wg-fig');
    const g = (k) => SML.$(`#${id}-g .chip[data-k="${k}"]`, root);
    const on = (k) => { const c = g(k); return !!(c && c.classList.contains('on')); };
    const reqKey = () => st.seg(id + '-r');
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && (e.target.closest('#' + id + '-r') || e.target.closest('#' + id + '-g'))) { stop(); step = 0; decision = 'pending'; } draw(); });

    function plan() {
      const r = REQ[reqKey()]; const cash = on('budget') ? 1000 : 25000;
      const value = r.usd ? r.usd : r.qty * r.px;
      const checks = [];
      let blockAt = null, why = '';
      // step 1: agent reads your rules
      if (on('list')) { const ok = ALLOWED.indexOf(r.sym) >= 0; checks.push({ at: 1, s: ok ? 'pass' : 'fail', t: `Ticker ${r.sym} is ${ok ? '' : 'not '}on your list`, d: 'Your rule: trade only ' + ALLOWED.join(' and ') + '.' }); if (!ok && blockAt == null) { blockAt = 1; why = 'rules'; } }
      else checks.push({ at: 1, s: 'skip', t: 'Ticker list: not set', d: 'Nothing stops an unexpected ticker.' });
      if (on('maxpos')) { const ok = value <= cash * 0.25; checks.push({ at: 1, s: ok ? 'pass' : 'fail', t: `Size ${F.usd0(value)} is ${(value / cash * 100).toFixed(0)}% of the account`, d: ok ? 'Under your 25% limit.' : 'Over your 25% limit, so the agent should refuse or ask to shrink it.' }); if (!ok && blockAt == null) { blockAt = 1; why = 'rules'; } }
      else checks.push({ at: 1, s: 'skip', t: 'Position size: no limit set', d: 'The agent may use most of the account on one trade.' });
      // step 3: account balance (enforced by the broker)
      const fits = value <= cash;
      checks.push({ at: 3, s: fits ? 'pass' : 'fail', t: `${F.usd0(value)} against ${F.usd0(cash)} in the agentic account`, d: fits ? 'Enough cash, so the order is accepted.' : 'Not enough buying power, so the broker rejects it.' });
      if (!fits && blockAt == null) { blockAt = 3; why = 'cash'; }
      // step 4: review
      checks.push({ at: 4, s: on('appr') ? (decision === 'approved' ? 'pass' : decision === 'rejected' ? 'fail' : 'wait') : 'skip', t: on('appr') ? (decision === 'approved' ? 'You approved it' : decision === 'rejected' ? 'You rejected it' : 'Waiting for your review') : 'No review: it goes straight through', d: on('appr') ? 'You check the order in the app before it is placed.' : 'Nobody looks at the order before it reaches the market.' });
      if (on('appr') && decision === 'rejected' && blockAt == null) { blockAt = 4; why = 'you'; }
      const fill = r.type === 'market' ? r.px + 0.06 : r.px;
      return { r, cash, value, checks, blockAt, why, fill, shares: r.usd ? r.usd / fill : r.qty };
    }
    function maxStep(P) { if (P.blockAt != null) return P.blockAt; if (on('appr') && decision === 'pending') return 4; return 5; }

    const draw = ui.responsive(fig, (W) => {
      const P = plan(); if (step > maxStep(P)) step = maxStep(P);
      const blocked = P.blockAt != null && step >= P.blockAt;
      const vert = W < 600;
      const nodeOfStep = (s) => STEP_NODE[s];
      const visited = new Set(); for (let s = 0; s < step; s++) visited.add(nodeOfStep(s));
      const state = (n) => { if (blocked && nodeOfStep(P.blockAt) === n) return 'bad'; if (nodeOfStep(step) === n) return 'act'; if (visited.has(n)) return 'done'; return 'idle'; };
      const cls = { bad: 'f-dn-t s-dn w2', act: 'f-acc-t s-acc w2', done: 'f-up-t s-up w15', idle: 'f-surf s-line w15' };
      const subOf = (i) => (i === 3 ? 'account · ' + F.usd0(P.cash) : NODES[i][1]);
      let b = '', H, boxes = [];
      if (!vert) {
        const pad = 8, gap = Math.max(28, W * 0.05), nw = (W - 2 * pad - 4 * gap) / 5, nh = 64, ny = 40; H = 184;
        for (let i = 0; i < 5; i++) boxes.push({ x: pad + i * (nw + gap), y: ny, w: nw, h: nh });
        // forward arrows with step badges
        [1, 2, 3, 5].forEach((s, k) => {
          const a = boxes[k], c = boxes[k + 1]; const y = a.y + a.h / 2; const lit = step >= s && !(blocked && P.blockAt < s);
          b += S.arrow(a.x + a.w + 3, y, c.x - 3, y, lit ? 'acc' : 'mut', 7, !lit);
          b += S.circle((a.x + a.w + c.x) / 2, y - 14, 9, lit ? 'f-acc' : 'f-shade2') + S.text((a.x + a.w + c.x) / 2, y - 10.2, String(s), 'badge', 'middle');
        });
        // review loop from agentic account back to you
        const a = boxes[3], u = boxes[0]; const ly = a.y + a.h + 34; const lit = step >= 4 && on('appr') && !(blocked && P.blockAt < 4);
        if (on('appr')) {
          b += S.path(`M${(a.x + a.w / 2).toFixed(1)},${a.y + a.h + 2} L${(a.x + a.w / 2).toFixed(1)},${ly} L${(u.x + u.w / 2).toFixed(1)},${ly} L${(u.x + u.w / 2).toFixed(1)},${a.y + a.h + 9}`, 'nf ' + (lit ? 's-acc w2' : 's-mut w15 dash'));
          b += S.polygon([[u.x + u.w / 2, a.y + a.h + 2], [u.x + u.w / 2 - 5, a.y + a.h + 10], [u.x + u.w / 2 + 5, a.y + a.h + 10]], lit ? 'f-acc' : 'f-mut');
          b += S.circle((a.x + u.x + u.w) / 2 + a.w / 4, ly, 9, lit ? 'f-acc' : 'f-shade2') + S.text((a.x + u.x + u.w) / 2 + a.w / 4, ly + 3.8, '4', 'badge', 'middle');
          b += S.text((a.x + u.x + u.w) / 2 - a.w / 4, ly + 18, 'review before trade: you approve in the app', 'sm ' + (lit ? 'acc b' : ''), 'middle');
        } else {
          b += S.text((a.x + u.x + u.w) / 2, ly + 4, 'no review step: orders go straight to the market', 'sm dn', 'middle');
        }
        b += S.text(pad, 18, 'SIMULATION · ONE REQUEST, STEP ' + step + ' OF 5', 'cap');
      } else {
        const padL = 10, nw = W - padL - 74, nh = 46, gap = 34; const top = 26; H = top + 5 * nh + 4 * gap + 8;
        for (let i = 0; i < 5; i++) boxes.push({ x: padL, y: top + i * (nh + gap), w: nw, h: nh });
        [1, 2, 3, 5].forEach((s, k) => {
          const a = boxes[k], c = boxes[k + 1]; const x = a.x + 28; const lit = step >= s && !(blocked && P.blockAt < s);
          b += S.arrow(x, a.y + a.h + 3, x, c.y - 3, lit ? 'acc' : 'mut', 7, !lit);
          b += S.circle(x + 22, (a.y + a.h + c.y) / 2, 9, lit ? 'f-acc' : 'f-shade2') + S.text(x + 22, (a.y + a.h + c.y) / 2 + 3.8, String(s), 'badge', 'middle');
        });
        const a = boxes[3], u = boxes[0]; const lx = a.x + a.w + 30; const lit = step >= 4 && on('appr') && !(blocked && P.blockAt < 4);
        if (on('appr')) {
          b += S.path(`M${a.x + a.w + 2},${(a.y + a.h / 2).toFixed(1)} L${lx},${(a.y + a.h / 2).toFixed(1)} L${lx},${(u.y + u.h / 2).toFixed(1)} L${u.x + u.w + 9},${(u.y + u.h / 2).toFixed(1)}`, 'nf ' + (lit ? 's-acc w2' : 's-mut w15 dash'));
          b += S.polygon([[u.x + u.w + 2, u.y + u.h / 2], [u.x + u.w + 10, u.y + u.h / 2 - 5], [u.x + u.w + 10, u.y + u.h / 2 + 5]], lit ? 'f-acc' : 'f-mut');
          const my = (a.y + u.y + u.h) / 2;
          const by = u.y + u.h / 2 + 30;
          b += S.circle(lx, by, 9, lit ? 'f-acc' : 'f-shade2') + S.text(lx, by + 3.8, '4', 'badge', 'middle');
          b += S.text(lx + 16, my + 34, 'review before trade', 'sm ' + (lit ? 'acc b' : ''), 'middle', ` transform="rotate(-90 ${(lx + 16).toFixed(1)} ${(my + 34).toFixed(1)})"`);
        } else {
          b += S.text(lx + 12, (a.y + u.y + u.h) / 2, 'no review step', 'sm dn', 'middle', ` transform="rotate(-90 ${(lx + 12).toFixed(1)} ${((a.y + u.y + u.h) / 2).toFixed(1)})"`);
        }
        b += S.text(padL, 14, 'SIMULATION · STEP ' + step + ' OF 5', 'cap');
      }
      boxes.forEach((bx, i) => {
        const s2 = state(i);
        b += S.rect(bx.x, bx.y, bx.w, bx.h, cls[s2], 8);
        const cx = vert ? bx.x + 56 : bx.x + bx.w / 2, an = vert ? 'start' : 'middle';
        b += S.text(cx, bx.y + bx.h / 2 - (vert ? 1 : 3), NODES[i][0], 'md b ink', an) + S.text(cx, bx.y + bx.h / 2 + (vert ? 14 : 13), subOf(i), 'xs', an);
        const mx = vert ? bx.x + bx.w - 14 : bx.x + bx.w - 12, my = bx.y + 12;
        if (s2 === 'done') b += S.circle(mx, my, 7, 'f-up') + S.path(`M${mx - 3.2},${my} l2.2,2.4 l4,-4.6`, 'nf w2', ' style="stroke:var(--on)"');
        if (s2 === 'bad') b += S.circle(mx, my, 7, 'f-dn') + S.path(`M${mx - 3},${my - 3} l6,6 M${mx + 3},${my - 3} l-6,6`, 'nf w2', ' style="stroke:var(--on)"');
        if (s2 === 'act') b += S.circle(mx, my, 5, 'f-acc');
      });
      fig.innerHTML = S.wrap(W, H, 'Simulated flow of one order request from you through Claude and the Robinhood MCP server to the agentic account and the exchange, with guardrail checks', b);
      panel(P, blocked);
    });

    function codeFor(P) {
      const r = P.r; const L = [];
      L.push('{');
      L.push('  <span class="k">"tool"</span>: <span class="s">"place equity order"</span>,');
      L.push('  <span class="k">"account"</span>: <span class="s">"agentic"</span>,');
      L.push(`  <span class="k">"symbol"</span>: <span class="s">"${r.sym}"</span>,`);
      L.push('  <span class="k">"side"</span>: <span class="s">"buy"</span>,');
      L.push(`  <span class="k">"order_type"</span>: <span class="s">"${r.type}"</span>,`);
      if (r.usd) L.push(`  <span class="k">"dollar_amount"</span>: <span class="n">${r.usd.toFixed(2)}</span>`);
      else { L.push(`  <span class="k">"quantity"</span>: <span class="n">${r.qty}</span>,`); L.push(`  <span class="k">"limit_price"</span>: <span class="n">${r.px.toFixed(2)}</span>`); }
      L.push('}');
      return L.join('\n');
    }
    function panel(P, blocked) {
      $('#' + id + '-req', root).textContent = '“' + P.r.text + '”';
      const icon = { pass: ui.check, fail: CROSS, skip: DASH, wait: WAIT };
      const shown = P.checks.filter((c) => c.at <= step);
      $('#' + id + '-checks', root).innerHTML = shown.length ? shown.map((c) => `<li>${icon[c.s]}<span>${esc(c.t)}<small>${esc(c.d)}</small></span></li>`).join('') : `<li>${DASH}<span>Nothing checked yet.<small>Press Next step to send the request.</small></span></li>`;
      const code = $('#' + id + '-code', root);
      if (step >= 2) code.innerHTML = codeFor(P);
      else if (blocked && P.blockAt === 1) code.innerHTML = '<span class="c">// No tool call. The agent\n// stopped at your rules and\n// asked you to change it.</span>';
      else code.innerHTML = '<span class="c">// Not sent yet. Claude first\n// reads your standing rules\n// (step 1), then calls a tool.</span>';
      // readouts
      let status = ['Not sent', ''];
      if (blocked) status = P.why === 'rules' ? ['Stopped by rules', 'dn'] : P.why === 'cash' ? ['Rejected: cash', 'dn'] : ['Rejected by you', 'dn'];
      else if (step === 4 && on('appr') && decision === 'pending') status = ['Waiting for you', 'acc'];
      else if (step === 5) status = ['Filled', 'up'];
      else if (step > 0) status = ['In progress', ''];
      $('#' + id + '-read', root).innerHTML =
        `<div class="stat"><span class="stat-l">Order value</span><span class="stat-v">${F.usd0(P.value)}</span></div>` +
        `<div class="stat"><span class="stat-l">Share of account</span><span class="stat-v ${P.value > P.cash * 0.25 ? 'dn' : ''}">${Math.round((P.value / P.cash) * 100)}%</span></div>` +
        `<div class="stat"><span class="stat-l">Agentic cash</span><span class="stat-v">${F.usd0(P.cash)}</span></div>` +
        `<div class="stat"><span class="stat-l">Status</span><span class="stat-v ${status[1]}">${status[0]}</span></div>`;
      // coach
      const m = $('#' + id + '-msg', root);
      const r = P.r;
      if (blocked && P.why === 'rules') m.innerHTML = ui.msg('dn', 'Stopped', `Your written rules caught it at step 1, before any tool call. Remember these rules are instructions to the agent, not a broker setting, so check its first trades to make sure it follows them.`);
      else if (blocked && P.why === 'cash') m.innerHTML = ui.msg('dn', 'Rejected', `The order needs ${F.usd0(P.value)} but the agentic account holds ${F.usd0(P.cash)}. The account balance is the one hard limit the broker enforces, which is why you fund it at pilot size.`);
      else if (blocked && P.why === 'you') m.innerHTML = ui.msg('dn', 'Rejected', 'You rejected it in the review step. Nothing reached the market. This is the habit to keep until the agent has a long clean record.');
      else if (step === 0) m.innerHTML = ui.msg('acc', 'Step 0', `You type a request. Press Next step to follow it through the system.`);
      else if (step === 1) m.innerHTML = ui.msg('acc', 'Step 1', 'Claude reads your standing rules first. Rules with exact numbers are easy to check; “only good setups” is not.');
      else if (step === 2) m.innerHTML = ui.msg('acc', 'Step 2', 'Claude calls the broker tool through the MCP server. You signed in through Robinhood, so the agent never saw your password.');
      else if (step === 3) m.innerHTML = ui.msg('acc', 'Step 3', `The order can only use the agentic account. It has ${F.usd0(P.cash)}, enough for this ${F.usd0(P.value)} order.`);
      else if (step === 4 && on('appr')) m.innerHTML = ui.msg('acc', 'Step 4', 'Review before trade is on, so the order waits. Check the ticker, size and price in the app, then Approve or Reject.');
      else if (step === 5 && !on('appr') && !on('maxpos') && !on('list')) m.innerHTML = ui.msg('dn', 'Filled', `${r.text.replace(/\.$/, '')} went through with no rules and nobody watching. It worked this time; the next misread instruction will too.`);
      else if (step === 5) m.innerHTML = ui.msg('up', 'Filled', `Filled ${r.usd ? (P.shares.toFixed(2) + ' shares') : r.qty + ' shares'} of ${r.sym} at ${F.usd(P.fill)}. You get a push notification and the trade shows in the activity feed. Write it in your journal.`);
      else m.innerHTML = ui.msg('acc', 'Step ' + step, 'Moving on.');
      // buttons
      const mx = maxStep(P);
      $('[data-a="next"]', root).disabled = step >= mx;
      $('[data-a="all"]', root).disabled = step >= mx;
      $('[data-a="back"]', root).disabled = step === 0;
      const waiting = step === 4 && on('appr') && decision === 'pending';
      $('[data-a="approve"]', root).hidden = !waiting; $('[data-a="reject"]', root).hidden = !waiting;
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    SML.onCleanup(stop);
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-a]'); if (!btn || !root.contains(btn)) return;
      const a = btn.dataset.a; const P = plan();
      if (a === 'next') { stop(); if (step < maxStep(P)) step++; }
      else if (a === 'back') { stop(); if (step > 0) { step--; if (step < 4) decision = 'pending'; } }
      else if (a === 'reset') { stop(); step = 0; decision = 'pending'; }
      else if (a === 'approve') { decision = 'approved'; step = 5; }
      else if (a === 'reject') { decision = 'rejected'; }
      else if (a === 'all') {
        stop();
        if (SML.reduced()) step = maxStep(P);
        else timer = setInterval(() => { const Q = plan(); if (step >= maxStep(Q)) { stop(); draw(); return; } step++; draw(); }, 650);
      }
      draw();
    });
  };

  /* =====================================================================
     botRiskSim: failures vs guardrails over six weeks
     ===================================================================== */
  SML.widgets.botRiskSim = function (root) {
    const id = SML.uid('br');
    let seed = 11;
    root.innerHTML = `
      <div class="wg-bar br-grp"><span>Failures</span>${ui.chips(id + '-ev', [
        { k: 'bug', label: 'Bug doubles orders', color: 'var(--down)', on: true },
        { k: 'outage', label: 'Outage in a drop', color: 'var(--down)', on: true },
        { k: 'slip', label: 'Slippage', color: 'var(--down)', on: false },
        { k: 'regime', label: 'Regime change', color: 'var(--down)', on: true },
      ])}</div>
      <div class="wg-bar br-grp"><span>Guardrails</span>${ui.chips(id + '-gd', [
        { k: 'dls', label: 'Daily loss stop 2%', color: 'var(--up)', on: false },
        { k: 'cap', label: 'Max 6 orders a day', color: 'var(--up)', on: false },
        { k: 'stop', label: 'Stops at the broker', color: 'var(--up)', on: false },
        { k: 'kill', label: 'Kill switch at −8%', color: 'var(--up)', on: false },
      ])}</div>
      <div class="wg-bar"><span class="br-legend"><span><i class="d"></i>Ideal bot (nothing breaks)</span><span><i class="y"></i>Your bot</span><span><b></b>Day halted by a guardrail</span></span></div>
      <div class="wg-fig"></div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-actions"><button type="button" class="btn sm btn-g" data-a="again">Run again with new luck</button><button type="button" class="btn sm btn-g" data-a="guards">Turn on every guardrail</button></div>
      <div class="wg-note">Simulation: a $10,000 account, 4 signals a day for 30 trading days, 0.5% risk per order, 47% winners at +1.8R. Bug: days 8 to 10. Outage: day 21. Regime change: from day 16 the win rate falls to 30%.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const ev = (k) => st.on(id + '-ev', k), gd = (k) => st.on(id + '-gd', k);

    function sim(E, G) {
      const r = SML.rng(seed); const D = 30, T = 4; const draws = []; for (let i = 0; i < D * T; i++) draws.push(r());
      let eq = 10000, peak = 10000, maxDD = 0, orders = 0, halted = 0, killDay = null; const curve = [eq]; const marks = [];
      for (let d = 1; d <= D; d++) {
        if (killDay) { curve.push(eq); continue; }
        const start = eq; let dayOrders = 0, stopped = false;
        if (E.outage && d === 21) { const lossR = G.stop ? 1.3 : 6; eq -= eq * 0.005 * lossR; marks.push({ d, k: 'outage', r: lossR }); }
        for (let t = 0; t < T; t++) {
          if (G.dls && eq <= start * 0.98) { if (!stopped) { stopped = true; halted++; marks.push({ d, k: 'dls' }); } break; }
          const p = E.regime && d >= 16 ? 0.30 : 0.47;
          let R = draws[(d - 1) * T + t] < p ? 1.8 : -1;
          if (E.slip) R -= 0.15;
          let k = E.bug && d >= 8 && d <= 10 ? 2 : 1;
          if (G.cap) k = Math.min(k, Math.max(0, 6 - dayOrders));
          if (k === 0) { if (!stopped) { stopped = true; halted++; marks.push({ d, k: 'cap' }); } break; }
          dayOrders += k; orders += k;
          eq += eq * 0.005 * R * k;
        }
        peak = Math.max(peak, eq); const dd = (peak - eq) / peak; maxDD = Math.max(maxDD, dd);
        if (G.kill && dd >= 0.08) { killDay = d; marks.push({ d, k: 'kill' }); }
        curve.push(eq);
      }
      return { curve, orders, halted, killDay, maxDD, eq, marks };
    }

    const draw = ui.responsive(fig, (W) => {
      const E = { bug: ev('bug'), outage: ev('outage'), slip: ev('slip'), regime: ev('regime') };
      const G = { dls: gd('dls'), cap: gd('cap'), stop: gd('stop'), kill: gd('kill') };
      const you = sim(E, G), ideal = sim({}, {});
      const compact = W < 480;
      const H = Math.round(SML.clamp(W * 0.48, 250, 360)), padL = compact ? 46 : 58, padR = compact ? 12 : 64, top = 16, bot = 26;
      const all = you.curve.concat(ideal.curve);
      const lo = Math.min(...all) * 0.985, hi = Math.max(...all) * 1.015;
      const x = SML.lin(0, 30, padL, W - padR), y = SML.lin(lo, hi, H - bot, top);
      let b = '';
      SML.ticks(lo, hi, 6).forEach((v) => { b += S.line(padL, y(v), W - padR, y(v), 's-grid') + S.text(padL - 6, y(v) + 4, '$' + (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k', 'xs mono', 'end'); });
      b += S.line(padL, y(10000), W - padR, y(10000), 's-mut dash2');
      if (E.bug) b += S.rect(x(7), top, x(10) - x(7), H - bot - top, 'f-dn-t', 0, ' opacity=".55"') + S.text((x(7) + x(10)) / 2, top + 12, 'bug', 'xs dn b', 'middle');
      if (E.regime) b += S.rect(x(15), top, x(30) - x(15), H - bot - top, 'f-vio-t', 0, ' opacity=".35"') + S.text(x(15) + 6, top + 12, compact ? 'new regime' : 'regime change: the edge is gone', 'xs vio b');
      [0, 5, 10, 15, 20, 25, 30].forEach((d) => { b += S.text(x(d), H - 8, compact && d % 10 ? '' : (d === 0 ? 'start' : 'day ' + d), 'xs mono', 'middle'); });
      b += S.poly(ideal.curve.map((v, i) => [x(i), y(v)]), 's-mut w2 dash');
      b += S.poly(you.curve.map((v, i) => [x(i), y(v)]), 's-acc w3');
      you.marks.forEach((m) => {
        const px = x(m.d), py = y(you.curve[m.d]);
        if (m.k === 'outage') b += S.circle(px, py, 9, 'f-dn') + S.text(px, py + 4, '!', 'badge', 'middle');
        if (m.k === 'kill') b += S.circle(px, py, 9, 'f-up') + S.text(px, py + 3.8, 'K', 'badge', 'middle');
        if (m.k === 'dls' || m.k === 'cap') b += S.circle(px, H - bot - 6, 3.5, 'f-up');
      });
      const ex = W - padR;
      if (!compact) {
        const ly1 = y(ideal.eq), ly2 = y(you.eq); const sep = Math.abs(ly1 - ly2) < 16 ? (ly1 < ly2 ? -8 : 8) : 0;
        b += S.text(ex + 6, ly1 + 4 + sep, F.usd0(ideal.eq), 'xs mono mut') + S.text(ex + 6, ly2 + 4 - sep, F.usd0(you.eq), 'xs mono b acc');
      }
      fig.innerHTML = S.wrap(W, H, 'Equity of a simulated trading bot over 30 days compared with an ideal bot, showing the effect of failures and guardrails', b);
      const ret = (you.eq / 10000 - 1) * 100;
      $('#' + id + '-read', root).innerHTML =
        `<div class="stat hl"><span class="stat-l">Your bot</span><span class="stat-v ${ret >= 0 ? 'up' : 'dn'}">${F.usd0(you.eq)}</span></div>` +
        `<div class="stat"><span class="stat-l">Ideal bot</span><span class="stat-v">${F.usd0(ideal.eq)}</span></div>` +
        `<div class="stat"><span class="stat-l">Max drawdown</span><span class="stat-v dn">${F.pct(-you.maxDD * 100, 1)}</span></div>` +
        `<div class="stat"><span class="stat-l">Orders placed</span><span class="stat-v">${you.orders}</span></div>` +
        `<div class="stat"><span class="stat-l">Halted</span><span class="stat-v">${you.killDay ? 'Day ' + you.killDay : you.halted ? you.halted + ' day' + (you.halted > 1 ? 's' : '') : 'Never'}</span></div>`;
      const anyGuard = G.dls || G.cap || G.stop || G.kill, anyEv = E.bug || E.outage || E.slip || E.regime;
      const m = $('#' + id + '-msg', root);
      if (!anyEv) m.innerHTML = ui.msg('info', 'No failures', 'With nothing breaking, your bot matches the ideal one. Real bots never get this. Switch on a failure.');
      else if (you.killDay) m.innerHTML = ui.msg('up', 'Kill switch', `The kill switch stopped the bot on day ${you.killDay}, 8% below its peak. A small, known loss instead of an open-ended one. Now you find out why before restarting.`);
      else if (E.regime && !G.kill) m.innerHTML = ui.msg('dn', 'Still trading', 'After the regime change the strategy stopped working, but the bot keeps firing every signal. Only a drawdown rule or a human review stops this.');
      else if (E.outage && !G.stop) m.innerHTML = ui.msg('dn', 'Outage', 'On day 21 the connection dropped during a fall with no stop resting at the broker. One trade lost 6R. A stop order sitting at the broker keeps working when your bot does not.');
      else if (E.bug && !G.cap && !G.dls) m.innerHTML = ui.msg('dn', 'Bug', 'For three days every signal filled twice, so every trade carried double risk. A cap on orders per day turns a costly bug into an obvious one.');
      else if (anyGuard) m.innerHTML = ui.msg('up', 'Guarded', `Guardrails limited the damage: max drawdown ${F.pct(you.maxDD * 100, 1)} against ${F.pct(ideal.maxDD * 100, 1)} for the ideal bot. Read the log of each halt before you restart.`);
      else m.innerHTML = ui.msg('acc', 'Failures', 'Small failures add up. Switch on guardrails to see which ones matter most.');
    });
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-a]'); if (!btn || !root.contains(btn)) return;
      if (btn.dataset.a === 'again') seed = seed * 7 + 13;
      if (btn.dataset.a === 'guards') SML.$$(`#${id}-gd .chip`, root).forEach((c) => { c.classList.add('on'); c.setAttribute('aria-pressed', 'true'); });
      draw();
    });
  };

  /* =====================================================================
     setupRules: exact rules, pseudo-code, chart and automation fit
     ===================================================================== */
  function closesFromOHLC(c) { return c.map((k) => k.c); }
  function baseChart(W, H, c, o) {
    o = o || {};
    const padL = 8, padR = o.padR != null ? o.padR : 78, top = 26, bot = o.bot != null ? o.bot : 18;
    const lows = c.map((k) => k.l).concat(o.extra || []), highs = c.map((k) => k.h).concat(o.extra || []);
    const lo = Math.min(...lows), hi = Math.max(...highs), pad = (hi - lo) * 0.08;
    const n = c.length; const slot = (W - padL - padR) / n;
    const x = (i) => padL + (i + 0.5) * slot; const y = SML.lin(lo - pad, hi + pad, H - bot - (o.lowerH || 0), top);
    return { x, y, slot, bw: Math.max(1.5, Math.min(10, slot * 0.6)), padL, padR, top, bot, xr: W - padR };
  }
  const tag = (g, yv, text, cls) => S.text(g.xr + 6, yv + 4, text, 'xs mono b ' + cls);

  const SETUPS = {
    pmh: {
      label: 'PMH retest', tf: '2-min', fit: 3, freq: '4 to 10 a month per ticker', judge: 'Medium', lesson: ['#l-breakouts', 'Breakouts & fakeouts'],
      rules: [['Market', 'Liquid US stock, 1M+ shares a day, in play today'], ['Filter', 'Price above VWAP; premarket high (PMH) marked before 9:30 ET'], ['Entry', 'A 2-min candle closes above PMH on volume above 1.5× the 20-bar average; buy when a later candle dips to within $0.05 of PMH and closes back above it'], ['Stop', '$0.10 below PMH'], ['Target', '2R, or the previous day high if it is closer'], ['Size', 'Risk 0.5% of the account per trade'], ['Window', '9:35 to 11:30 ET; flat by 15:55 ET']],
      code: `each 2-min close, 9:35 to 11:30 ET:
  if close > PMH and close > VWAP
     and volume > 1.5 * avg20:
    broke = true
  if broke and low <= PMH + 0.05
     and close > PMH:
    stop = PMH - 0.10
    per  = close - stop
    qty  = floor(equity * 0.005 / per)
    buy qty, limit = close
    set stop; target = close + 2 * per
at 15:55 ET: close all`,
      pros: ['Exact numbers for every rule', 'Same levels you mark by hand'], cons: ['Fast: slippage at the open hurts', 'Needs premarket data and reliable 2-min bars'],
      coach: 'Good fit once written exactly. The hard part is speed: a few cents of slippage on a $0.40 stop changes the result, so backtest with costs.',
    },
    orb: {
      label: 'Opening range', tf: '5-min', fit: 4, freq: '8 to 15 a month', judge: 'Low', lesson: ['#l-breakouts', 'Breakouts & fakeouts'],
      rules: [['Market', 'Liquid stock or index ETF'], ['Range', 'High and low from 9:30 to 9:45 ET'], ['Entry', 'A 5-min candle closes above the range high on volume above 1.5× its 20-bar average'], ['Stop', 'Range midpoint'], ['Target', '2R'], ['Size', 'Risk 0.5% of the account'], ['Window', 'Entries before 11:00 ET; flat by 15:55 ET']],
      code: `at 9:45 ET:
  ORH = high of 9:30 to 9:45
  ORL = low of 9:30 to 9:45
each 5-min close until 11:00 ET:
  if flat and close > ORH
     and volume > 1.5 * avg20:
    stop = (ORH + ORL) / 2
    per  = close - stop
    qty  = floor(equity * 0.005 / per)
    buy qty, set stop
    target = close + 2 * per
at 15:55 ET: close all`,
      pros: ['Purely time and price based', 'One decision per day'], cons: ['Many false breakouts in choppy markets', 'Gap days need extra rules'],
      coach: 'One of the easiest intraday setups to automate: every rule is a time, a price or a volume number. Backtest it on the tickers you trade before you trust it.',
    },
    ema: {
      label: 'EMA pullback', tf: '15-min or daily', fit: 4, freq: '3 to 8 a month', judge: 'Low', lesson: ['#l-ema-stack', '13, 48 & 200 EMA'],
      rules: [['Trend', 'Close above the 200 EMA and 13 EMA above 48 EMA'], ['Pullback', 'Low touches the 48 EMA'], ['Entry', 'First close back above the 13 EMA after the touch'], ['Stop', 'Below the pullback low'], ['Exit', '2R, or a close below the 48 EMA'], ['Size', 'Risk 0.5% to 1% of the account'], ['Window', 'Any bar close; no entries in the first 15 minutes']],
      code: `on each bar close:
  up = close > ema200 and ema13 > ema48
  if up and low <= ema48:
    touched = true
    swing_low = min(swing_low, low)
  if touched and close > ema13:
    stop = swing_low - 0.01
    per  = close - stop
    qty  = floor(equity * 0.0075 / per)
    buy qty, set stop
    target = close + 2 * per
    touched = false
  if holding and close < ema48: sell`,
      pros: ['Trend filter avoids fighting the market', 'Works on daily bars too'], cons: ['Whipsaws in sideways markets', 'Pullback depth varies'],
      coach: 'A trend filter plus an exact trigger. Rules a computer can check on every bar close, which also makes it easy to backtest.',
    },
    rsi2: {
      label: 'RSI(2) dip', tf: 'Daily, end of day', fit: 5, freq: '2 to 4 a month', judge: 'Low', lesson: ['#l-rsi', 'RSI'],
      rules: [['Market', 'A broad index ETF'], ['Filter', 'Close above its 200-day simple moving average'], ['Entry', 'RSI(2) closes below 10; buy near the close'], ['Exit', 'First close above the 5-day moving average'], ['Stops', 'Time stop after 10 days; disaster stop 8% below entry'], ['Size', 'A fixed slice, e.g. 20% of the account'], ['Window', 'Check once a day, 15 minutes before the close']],
      code: `once a day at 15:45 ET:
  if flat and close > sma200
     and rsi(close, 2) < 10:
    buy floor(equity * 0.20 / close)
    disaster_stop = entry * 0.92
  if holding and (close > sma5
     or days_held >= 10):
    sell all`,
      pros: ['One check a day, slow and calm', 'Long history to test on'], cons: ['Few trades, so results take time to judge', 'A deep crash can hit the disaster stop'],
      coach: 'Daily, rule-based and slow: the friendliest kind of setup for automation. Still backtest it with costs and on data that includes bad years.',
    },
    wheel: {
      label: 'The wheel', tf: 'Monthly options', fit: 3, freq: '1 to 2 a month', judge: 'Medium to high', lesson: ['#l-wheel', 'The wheel strategy'],
      rules: [['Stock', 'Only a company you would hold for years, with liquid options'], ['Put', 'Sell a cash-secured put about 0.25 delta, 30 to 45 days out'], ['Skip', 'No new put if earnings fall before expiration'], ['Assigned', 'Sell a covered call at or above your cost basis, 30 to 45 days out'], ['Exit', 'Buy back early at 50% of max profit, or let it expire'], ['Size', 'Cash for 100 shares per contract; no more than 20% of the account per stock'], ['Window', 'Once a week check; trade during regular hours']],
      code: `every week:
  if cash and no open put
     and no earnings before expiry:
    sell 1 put, delta ~0.25, 30-45 days
  if 100 shares and no open call:
    sell 1 call, strike >= cost basis
  if option worth <= 50% of premium:
    buy it back`,
      pros: ['Slow, few decisions', 'Clear rules for each state'], cons: ['Picking the stock and handling earnings need judgment', 'Assignment in a crash leaves you holding a loser'],
      coach: 'The steps are mechanical, but choosing the stock is not. Automate the reminders and the order prep; keep the stock choice and the approval for yourself.',
    },
    dca: {
      label: 'Monthly DCA', tf: 'Monthly', fit: 5, freq: '1 a month', judge: 'None', lesson: ['#l-blend', 'Blending styles'],
      rules: [['Market', 'A broad, low-cost index fund or ETF'], ['Entry', 'Buy a fixed dollar amount on the same day each month'], ['Exit', 'None; rebalance once a year'], ['Size', 'What you can save every month, e.g. $500'], ['Rules', 'Never skip after a drop; that is when the buy is cheapest'], ['Window', 'Any time on the chosen day'], ['Tool', 'Most brokers have built-in recurring buys; no AI needed']],
      code: `first trading day of each month:
  buy $500 of the index fund
  (fractional shares are fine)
once a year:
  rebalance to your target mix`,
      pros: ['No judgment at all', 'Brokers already automate it'], cons: ['Slow by design', 'Feels bad in long drops, which is when it works'],
      coach: 'The simplest automation there is, and you do not need AI for it: a recurring buy in your broker app does the job.',
    },
  };

  function chartPMH(W, H, compact) {
    const PMH = 101.0;
    const cl = SML.data.path([[0, 100.25], [4, 100.6], [7, 100.85], [9, 101.5], [11, 101.35], [13, 101.12], [14, 101.42], [17, 101.85], [20, 102.2], [22, 102.48], [25, 102.35]], 26, 4, 0.05);
    const c = SML.data.candles(cl, 9, { wick: 0.22, vol: 100, boost: { 9: 2.6 } }); c[13].l = Math.min(c[13].l, PMH + 0.03); c[13].c = Math.max(c[13].c, PMH + 0.1);
    const g = baseChart(W, H, c, { extra: [PMH - 0.1, PMH + 1.2], padR: compact ? 60 : 78 });
    const vw = SML.ind.vwap(c);
    let b = S.line(g.padL, g.y(PMH), g.xr, g.y(PMH), 's-acc dash w15') + tag(g, g.y(PMH), 'PMH', 'acc');
    b += S.poly(vw.map((v, i) => [g.x(i), g.y(v)]), 's-info w2') + S.text(g.x(3), g.y(vw[3]) + 16, 'VWAP', 'xs info b', 'middle');
    const entry = c[14].c, stop = PMH - 0.1, tgt = entry + 2 * (entry - stop);
    b += S.line(g.x(14), g.y(stop), g.xr, g.y(stop), 's-dn dash2 w15') + tag(g, g.y(stop) + 10, 'stop', 'dn');
    b += S.line(g.x(14), g.y(tgt), g.xr, g.y(tgt), 's-up dash2 w15') + tag(g, g.y(tgt), '2R', 'up');
    b += S.candles(c, g.x, g.bw, g.y);
    b += S.badge(g.x(9), g.y(c[9].h) - 14, 1) + S.badge(g.x(13), g.y(c[13].l) + 16, 2) + S.badge(g.x(14), g.y(c[14].h) - 14, 3);
    b += S.text(g.padL, 12, compact ? '1 break · 2 retest · 3 entry' : '1 break on volume · 2 retest holds · 3 entry', 'cap');
    return b;
  }
  function chartORB(W, H, compact) {
    const cl = SML.data.path([[0, 40.55], [1, 40.8], [2, 40.3], [3, 40.5], [4, 40.72], [5, 41.02], [8, 41.38], [11, 41.8], [13, 42.1], [16, 41.95]], 17, 21, 0.04);
    const c = SML.data.candles(cl, 12, { wick: 0.2, vol: 100, boost: { 5: 2.1 } });
    const orh = Math.max(c[0].h, c[1].h, c[2].h), orl = Math.min(c[0].l, c[1].l, c[2].l), mid = (orh + orl) / 2;
    const g = baseChart(W, H, c, { padR: compact ? 60 : 78 });
    let b = S.rect(g.padL, g.y(orh), g.x(2) + g.slot / 2 - g.padL, g.y(orl) - g.y(orh), 'f-acc-t s-acc', 3, ' opacity=".9"');
    b += S.text(g.padL + 4, g.y(orh) - 6, 'opening range', 'xs acc b');
    b += S.line(g.x(2), g.y(orh), g.xr, g.y(orh), 's-acc dash w15') + tag(g, g.y(orh), 'ORH', 'acc');
    const entry = c[5].c, tgt = entry + 2 * (entry - mid);
    b += S.line(g.x(5), g.y(mid), g.xr, g.y(mid), 's-dn dash2 w15') + tag(g, g.y(mid) + 4, 'stop', 'dn');
    b += S.line(g.x(5), g.y(tgt), g.xr, g.y(tgt), 's-up dash2 w15') + tag(g, g.y(tgt), '2R', 'up');
    b += S.candles(c, g.x, g.bw, g.y) + S.badge(g.x(5), g.y(c[5].h) - 14, 1);
    b += S.text(g.padL, 12, compact ? '1 close above the range' : '9:30 to 9:45 sets the range · 1 close above it on volume', 'cap');
    return b;
  }
  function chartEMA(W, H, compact) {
    const all = SML.data.path([[0, 97], [120, 100.5], [200, 104], [235, 109], [250, 105.6], [256, 105.1], [262, 107.4], [280, 110.4], [299, 112]], 300, 17, 0.3);
    const e13 = SML.ind.ema(all, 13), e48 = SML.ind.ema(all, 48), e200 = SML.ind.ema(all, 200);
    const from = 210, cl = all.slice(from); const c = SML.data.candles(cl, 33, { wick: 0.25 });
    const g = baseChart(W, H, c, { extra: e200.slice(from), padR: compact ? 54 : 70 });
    let b = '';
    b += S.poly(e200.slice(from).map((v, i) => [g.x(i), g.y(v)]), 's-ink w25 o70') + S.poly(e48.slice(from).map((v, i) => [g.x(i), g.y(v)]), 's-info w2') + S.poly(e13.slice(from).map((v, i) => [g.x(i), g.y(v)]), 's-vio w15');
    b += tag(g, g.y(e200[299]), '200', 'ink') + tag(g, g.y(e48[299]) + 6, '48', 'info') + tag(g, g.y(e13[299]) - 6, '13', 'vio');
    b += S.candles(c, g.x, g.bw, g.y);
    let touch = -1, ent = -1;
    for (let i = 20; i < c.length; i++) { const j = from + i; if (touch < 0 && c[i].l <= e48[j] * 1.003 && all[j] > e200[j]) touch = i; if (touch >= 0 && i > touch && c[i].c > e13[j]) { ent = i; break; } }
    if (touch >= 0) b += S.badge(g.x(touch), g.y(c[touch].l) + 16, 1);
    if (ent >= 0) b += S.badge(g.x(ent), g.y(c[ent].h) - 14, 2);
    b += S.text(g.padL, 12, compact ? '1 touch 48 EMA · 2 entry' : '1 pullback touches the 48 EMA · 2 close back above the 13 EMA', 'cap');
    return b;
  }
  function chartRSI(W, H, compact) {
    const all = SML.data.path([[0, 300], [180, 360], [230, 390], [250, 372], [262, 395], [280, 380], [300, 405], [329, 418]], 330, 51, 3.2);
    const s200 = SML.ind.sma(all, 200), s5 = SML.ind.sma(all, 5), r2 = SML.ind.rsi(all, 2);
    const from = 210, cl = all.slice(from); const c = SML.data.candles(cl, 8, { wick: 0.2 });
    const lowerH = Math.round(H * 0.28);
    const g = baseChart(W, H, c, { extra: s200.slice(from).filter((v) => v != null), padR: compact ? 54 : 70, lowerH, bot: 14 });
    let b = S.poly(s200.slice(from).map((v, i) => (v == null ? null : [g.x(i), g.y(v)])), 's-ink w2 o70') + tag(g, g.y(s200[329]), '200d', 'ink');
    b += S.candles(c, g.x, Math.max(1.4, g.bw * 0.8), g.y);
    const rTop = H - g.bot - lowerH + 10, rBot = H - g.bot; const ry = SML.lin(0, 100, rBot, rTop);
    b += S.line(g.padL, rTop - 4, g.xr, rTop - 4, 's-line') + S.line(g.padL, ry(10), g.xr, ry(10), 's-up dash2') + S.text(g.xr + 6, ry(10) + 4, '10', 'xs mono up');
    b += S.poly(r2.slice(from).map((v, i) => (v == null ? null : [g.x(i), ry(v)])), 's-vio w15') + S.text(g.xr + 6, ry(62), 'RSI(2)', 'xs vio b');
    let inPos = false, n = 0;
    for (let i = 1; i < c.length; i++) {
      const j = from + i;
      if (!inPos && r2[j] != null && r2[j] < 10 && all[j] > s200[j]) { inPos = true; n++; b += S.polygon([[g.x(i), g.y(c[i].l) + 5], [g.x(i) - 5, g.y(c[i].l) + 14], [g.x(i) + 5, g.y(c[i].l) + 14]], 'f-up'); }
      else if (inPos && s5[j] != null && all[j] > s5[j]) { inPos = false; b += S.circle(g.x(i), g.y(c[i].h) - 8, 3.4, 'f-acc'); }
    }
    b += S.text(g.padL, 12, compact ? '▲ buy · ● sell' : '▲ RSI(2) < 10 above the 200-day: buy · ● close above the 5-day: sell', 'cap');
    return b;
  }
  function chartWheel(W, H, compact) {
    const n = 130; const cl = SML.data.path([[0, 50], [20, 51.5], [42, 49.8], [55, 46.2], [63, 44.4], [80, 45.6], [100, 46.4], [115, 48.2], [129, 49.4]], n, 61, 0.35);
    const padL = 8, padR = compact ? 54 : 70, top = compact ? 36 : 22, bot = 20;
    const x = SML.lin(0, n - 1, padL, W - padR), y = SML.lin(43, 52.6, H - bot, top);
    const legs = [[0, 21, 47, 'put', 'P'], [21, 42, 48, 'put', 'P'], [42, 63, 47.5, 'put', 'A'], [63, 84, 47, 'call', 'C'], [84, 105, 47, 'call', 'C'], [105, 126, 47.5, 'call', 'X']];
    let b = '', marks = '';
    legs.forEach(([a, z, k, t, lab]) => {
      b += S.line(x(a), y(k), x(z), y(k), (t === 'put' ? 's-info' : 's-acc') + ' w2 dash2');
      marks += S.badge(x(z), y(k), lab, lab === 'A' || lab === 'X' ? 'f-vio' : t === 'put' ? 'f-info' : 'f-acc');
    });
    b += S.poly(cl.map((v, i) => [x(i), y(v)]), 's-ink w2') + marks;
    b += S.text(x(126) + 12, y(47.5) + 4, 'strike', 'xs mono');
    if (!compact) b += S.text(x(10), y(47) + 18, 'puts', 'xs info b', 'middle') + S.text(x(94), y(47) - 10, 'covered calls', 'xs acc b', 'middle');
    if (compact) b += S.text(padL, 12, 'P put expires · A assigned', 'cap') + S.text(padL, 26, 'C call expires · X called away', 'cap');
    else b += S.text(padL, 12, 'P put expires · A assigned · C covered call expires · X shares called away', 'cap');
    return b;
  }
  function chartDCA(W, H, compact) {
    const n = 24; const px = SML.data.path([[0, 100], [5, 108], [9, 92], [12, 84], [16, 96], [20, 110], [23, 118]], n, 71, 1.4);
    let sh = 0, cost = 0; const avg = px.map((p) => { sh += 500 / p; cost += 500; return cost / sh; });
    const padL = 8, padR = compact ? 60 : 92, top = 18, bot = 20;
    const x = SML.lin(0, n - 1, padL + 6, W - padR), y = SML.lin(Math.min(...px) - 6, Math.max(...px) + 6, H - bot, top);
    let b = S.poly(px.map((p, i) => [x(i), y(p)]), 's-ink w2') + S.poly(avg.map((p, i) => [x(i), y(p)]), 's-up w2 dash');
    px.forEach((p, i) => { b += S.circle(x(i), y(p), 3.2, 'f-acc'); });
    b += S.text(W - padR + 6, y(px[n - 1]) + 4, compact ? 'price' : 'price ' + px[n - 1].toFixed(0), 'xs mono b ink') + S.text(W - padR + 6, y(avg[n - 1]) + 4, compact ? 'avg' : 'avg cost ' + avg[n - 1].toFixed(0), 'xs mono b up');
    b += S.text(padL, 12, compact ? '● $500 a month for 24 months' : '● $500 bought every month for 24 months', 'cap');
    return b;
  }
  const CHARTS = { pmh: chartPMH, orb: chartORB, ema: chartEMA, rsi2: chartRSI, wheel: chartWheel, dca: chartDCA };

  SML.widgets.setupRules = function (root) {
    const id = SML.uid('sr');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-s', Object.keys(SETUPS).map((k) => ({ v: k, label: SETUPS[k].label })), 'orb', 'Setup')}</div>
      <div class="wg-fig"></div>
      <div class="sr-grid"><div><span class="af-h">Exact rules</span><dl class="sr-rules" id="${id}-rules"></dl></div><div><span class="af-h">Pseudo-code</span><pre class="af-code sr-code" id="${id}-code"></pre><div class="sr-pc" id="${id}-pc"></div></div></div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-note">Teaching examples, not recommendations. Every setup needs a backtest with costs and a paper-trading run first: <a href="#l-backtest">Backtest before you trust</a>.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw());
    const draw = ui.responsive(fig, (W) => {
      const k = st.seg(id + '-s'); const s = SETUPS[k]; const compact = W < 520;
      const H = Math.round(SML.clamp(W * 0.42, 230, 320));
      fig.innerHTML = S.wrap(W, H, s.label + ' setup drawn on an example chart', CHARTS[k](W, H, compact));
      $('#' + id + '-rules', root).innerHTML = s.rules.map((r) => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
      $('#' + id + '-code', root).textContent = s.code;
      $('#' + id + '-pc', root).innerHTML = `<ul>${s.pros.map((p) => `<li>${ui.check}<span>${p}</span></li>`).join('')}</ul><ul>${s.cons.map((p) => `<li>${CROSS}<span>${p}</span></li>`).join('')}</ul>`;
      const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < s.fit ? 'on' : ''}"></i>`).join('');
      $('#' + id + '-read', root).innerHTML =
        `<div class="stat hl"><span class="stat-l">Automation fit</span><span class="stat-v">${s.fit} / 5<span class="sr-dots" aria-hidden="true">${dots}</span></span></div>` +
        `<div class="stat"><span class="stat-l">Signals</span><span class="stat-v" style="font-size:22px">${s.freq}</span></div>` +
        `<div class="stat"><span class="stat-l">Judgment needed</span><span class="stat-v">${s.judge}</span></div>` +
        `<div class="stat"><span class="stat-l">Timeframe</span><span class="stat-v" style="font-size:22px">${s.tf}</span></div>`;
      $('#' + id + '-msg', root).innerHTML = ui.msg(s.fit >= 5 ? 'up' : s.fit >= 4 ? 'info' : 'acc', 'Fit ' + s.fit + '/5', `${s.coach} Learn it first: <a href="${s.lesson[0]}">${s.lesson[1]}</a>.`);
    });
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-ai-automate', course: 'ai', order: 4, title: 'Automate trades with Robinhood and MCP', mins: 14, level: 'Intermediate',
    summary: 'Connect an AI agent to Robinhood through MCP, with a small account, rules and a review step.',
    idea: 'Give an AI agent a small separate account, exact written rules and a review step before it ever trades real money.',
    widget: 'agentFlow', opts: {},
    try: 'Pick a request, switch the guardrails on and off, then step through what happens to the order.',
    body: [
      '<h3>What MCP is</h3>',
      '<p><b>MCP</b> (Model Context Protocol) is an open standard that lets an AI assistant use outside tools. A broker’s MCP server turns account actions, such as reading a quote or placing an order, into tools the AI can call when you ask it to.</p>',
      '<h3>How the pieces fit</h3>',
      '<ul><li><b>You</b> write the rules, fund the account and approve trades.</li><li><b>The AI client</b> (Claude Desktop or Claude Code) reads your request and decides which tool to call.</li><li><b>Robinhood’s MCP server</b> receives the tool call. You signed in through Robinhood, so the agent never sees your password.</li><li><b>The agentic account</b> is a separate account. The agent can place trades only here.</li><li><b>The market</b> fills the order like any other.</li></ul>',
      '<p>Robinhood launched Agentic Trading as a US-only beta on May 27, 2026. As of October 2026 its tools cover account and portfolio data, watchlists, market data, stocks, options and crypto (crypto was added July 20, 2026, needs a Robinhood Crypto account and is not available in some states, such as New York). It is free for eligible customers.</p>',
      '<h3>Step 1: Practise on paper first</h3>',
      '<p>Alpaca, a broker built around its API, has an official MCP server that uses paper trading by default (<code>ALPACA_PAPER_TRADE=true</code>). Install it with <code>uvx alpaca-mcp-server</code>, put the API keys only in your client’s <code>env</code> settings, never in the chat, and run your rules on fake money for a few weeks.</p>',
      '<h3>Step 2: Connect Robinhood</h3>',
      '<ol><li>Have a primary individual investing account in good standing.</li><li><b>Claude Desktop:</b> Settings &gt; Connectors &gt; Add custom connector, then paste <code>https://agent.robinhood.com/mcp/trading</code>.</li><li><b>Claude Code:</b> run the command below, type <code>/mcp</code>, select <code>robinhood-trading</code> and sign in.</li></ol>',
      '<pre><code>claude mcp add robinhood-trading --transport http https://agent.robinhood.com/mcp/trading</code></pre>',
      '<p>The same link works in ChatGPT, Codex, Cursor, Grok and other MCP clients. Skip community tools that ask for your Robinhood username and password; use the official server.</p>',
      '<h3>Step 3: Open and fund the agentic account</h3>',
      '<p>During sign-in Robinhood asks you to open an MCP account, a separate self-directed individual account (you can have up to ten). The agent can <b>read</b> all your Robinhood accounts, including positions, balances, order history and account numbers, but can <b>trade</b> only in this one. Fund it at pilot size, an amount you could lose without it hurting, because that balance is the agent’s real budget.</p>',
      '<h3>Step 4: Review before every trade</h3>',
      '<p>Robinhood lets you review what the agent is about to do before it acts. Keep that on. If you tell the agent to act without asking, it can trade without your confirmation. Robinhood has not published per-order or daily loss caps, so any limit beyond the account balance lives in your instructions, and an agent can misread instructions.</p>',
      '<h3>Step 5: Write your rules down</h3>',
      '<p>Paste standing rules at the start of every session, or save them in your project instructions. An example:</p>',
      '<pre><code>RULES FOR MY TRADING AGENT\n- Trade only these tickers: DEMO, ACME (example list).\n- Use only the agentic account. Never act on my other accounts.\n- Max position: 25% of the agentic account. Max 3 open positions.\n- Risk per trade: 1% of the account. Place a stop with every entry.\n- Order types: limit and stop limit only. No market orders.\n- Trading window: 9:45 to 15:30 ET. Nothing in the first 15 minutes.\n- Max daily loss: 2% of the account. After that, stop and tell me.\n- Always show me the full order and ask before placing it.\n- Log every decision: time, ticker, reason, order, result.</code></pre>',
      '<h3>Step 6: Dry run, then one tiny trade</h3>',
      '<p>Start read-only. Ask for your positions, a quote and what the agent would do under your rules, then check every number in the app. Next, place one tiny limit order with review on and confirm it shows up in the agentic account.</p>',
      '<h3>Step 7: Monitor, journal and know your kill switch</h3>',
      '<p>Robinhood sends a push notification for every trade and shows real-time activity and P&amp;L. Copy each decision into your <a href="#l-journal">journal</a>. Your kill switch is disconnecting the agent, which you can do at any time, then cancelling open orders in the app. Robinhood warns that agents can make errors, misread instructions or act on outdated information, that strategies can move fast and be hard to stop, that you are responsible for every trade, and that you can lose your entire deposit.</p>',
    ],
    example: {
      title: 'A first supervised trade',
      intro: 'Example numbers. The agentic account holds $1,000 and your rules say 1% risk and 25% max position.',
      steps: [
        'You move $1,000 into the agentic account. Your main account stays out of reach for trading.',
        'You ask: “Buy DEMO on a pullback to $48.20 with a stop at $47.70.” Your rules allow 1% risk, which is $10.',
        'The agent sizes it: $10 ÷ ($48.20 − $47.70) = 20 shares, worth $964. That is 96% of the account, so your 25% rule caps it at 5 shares ($241).',
        'It shows you a limit buy for 5 shares at $48.20 plus a stop at $47.70 and waits. You check the quote in the app and approve.',
        'The order fills, Robinhood sends a push notification and the agent writes the entry in your log.',
      ],
      result: 'Worst case if the stop fills at $47.70: 5 × $0.50 = $2.50, a quarter of 1% of the agentic account.',
    },
    mistakes: [
      'Funding the agentic account with money you cannot afford to lose. The balance is the only hard limit the broker enforces.',
      'Telling the agent to trade without asking before it has a clean record in paper trading and supervised trades.',
      'Pasting API keys, passwords or account numbers into a chat, or using unofficial tools that want your login.',
      'Assuming the agent will follow every rule. Check its first trades against your rules and the app.',
    ],
    points: [
      'MCP connects an AI client to a broker’s tools. Robinhood’s official server is https://agent.robinhood.com/mcp/trading.',
      'The agent can read all your Robinhood accounts but trade only in the separate agentic account, so fund it at pilot size.',
      'Keep review-before-trade on and give exact rules: tickers, size, daily loss, order types, hours.',
      'Practise on paper with Alpaca’s MCP server first, start read-only, then make one tiny trade.',
      'Your kill switch is disconnecting the agent and cancelling open orders.',
    ],
    terms: ['MCP', 'AI agent', 'Agentic account', 'Paper trading', 'Kill switch', 'API'],
    quiz: { q: 'Where can a Robinhood-connected agent place trades?', options: ['In any of your Robinhood accounts', 'Only in the separate agentic account', 'Only in paper trading'], answer: 1, why: 'It can read all your accounts, but it can trade only in the agentic account, so that balance is its budget.' },
  });

  SML.lessons.push({
    id: 'l-ai-bots', course: 'ai', order: 5, title: 'Benefits and risks of trading bots', mins: 10, level: 'Intermediate',
    summary: 'What automation does well, how it breaks, and the guardrails that keep a bug small.',
    idea: 'A bot follows its rules perfectly, including broken ones, so guardrails matter more than the strategy.',
    widget: 'botRiskSim', opts: {},
    try: 'Switch failures on, then add guardrails one at a time and compare your bot with the ideal one.',
    body: [
      '<h3>What bots do well</h3>',
      '<ul><li><b>Discipline.</b> Every signal gets the same rules, the same size and the same stop.</li><li><b>No emotions.</b> No fear after a loss, no revenge trade, no hesitation.</li><li><b>Speed and reach.</b> A bot can watch many tickers at once and act in a second.</li><li><b>A record.</b> Every decision is logged, and rules written as code can be <a href="#l-backtest">backtested</a>.</li></ul>',
      '<h3>How bots break</h3>',
      '<ul><li><b>Bugs.</b> A retry that sends an order twice doubles your risk without warning.</li><li><b>Outages.</b> Your internet, the broker or the AI service can drop while you hold a position.</li><li><b>Slippage.</b> Real fills are worse than the backtest, most of all at the open.</li><li><b>Regime change.</b> A strategy that worked in a calm trend can stop working in a choppy or crashing market, and the bot keeps trading it.</li><li><b>Over-trading.</b> Cheap signals turn into dozens of small losses and fees.</li><li><b>Different answers.</b> An AI model can respond differently to the same request. Keep entries and exits as fixed rules; use the AI for research and checks.</li><li><b>Rate limits and costs.</b> APIs throttle heavy use, and data feeds and AI usage cost money that has to come out of your edge.</li><li><b>Taxes.</b> Buying back the same ticker within 30 days of a loss creates <a href="#l-wash-sale">wash sales</a>, and bots do this constantly.</li></ul>',
      '<h3>Guardrails that keep a failure small</h3>',
      '<ul><li>A separate, small account as the hard budget.</li><li>Max orders per day and max open positions.</li><li>Max daily loss, after which the bot stops until tomorrow.</li><li>Allowed tickers and allowed hours.</li><li>Stop orders resting at the broker, so protection works even if your bot is offline.</li><li>A heartbeat check that alerts you if the bot goes quiet.</li><li>A kill switch you can reach from your phone, and logs you actually read.</li></ul>',
      '<p>Run every bot on paper first, then at tiny size. Scale up only after its live results match its backtest for a few months.</p>',
    ],
    example: {
      title: 'A duplicate-order bug, caught',
      intro: 'Example numbers. A $10,000 account, 0.5% risk per order, guardrails of 6 orders a day and a 2% daily loss stop.',
      steps: [
        'Normally each signal risks 0.5% of $10,000, which is $50.',
        'On Tuesday a retry bug sends every order twice, so each signal now risks $100.',
        'The first two doubled trades both lose: −$200, which is 2% of the account.',
        'The daily loss stop halts the bot for the rest of the day, and the 6-order cap was ready to block the rest anyway.',
        'Your log shows two fills for every signal, so you pause the bot and fix the retry logic before Wednesday.',
      ],
      result: 'The bug costs $200. Without guardrails, four doubled losing trades would have cost $400, and the bug might have run for days.',
    },
    mistakes: [
      'Running a bot with no daily loss limit, no order cap and no kill switch.',
      'Trusting a backtest that ignored slippage, fees and outages.',
      'Letting an AI model decide entries freely instead of following fixed, testable rules.',
      'Never reading the logs until something has already gone badly wrong.',
    ],
    points: [
      'Bots remove emotion, not risk.',
      'Plan for bugs, outages, slippage and regime change before they happen.',
      'Guardrails: small account, max orders, max daily loss, stops at the broker, kill switch.',
      'Use AI for research and checks; use fixed rules for execution.',
    ],
    terms: ['Kill switch', 'Slippage', 'Backtest', 'Wash sale', 'Rate limit', 'Paper trading'],
    quiz: { q: 'Your bot hits its max daily loss. What should happen?', options: ['It doubles size to win it back', 'It stops trading for the day and alerts you', 'It switches to a different strategy'], answer: 1, why: 'The point of a daily loss limit is to stop, alert you and let you review the log before the next session.' },
  });

  SML.lessons.push({
    id: 'l-ai-setups', course: 'ai', order: 6, title: 'Setups worth automating', mins: 10, level: 'Intermediate',
    summary: 'Six rule-based setups from the course, written exactly enough for a bot to follow.',
    idea: 'A bot can only follow rules a computer can check, so “looks strong” has to become a number.',
    widget: 'setupRules', opts: {},
    try: 'Pick a setup to see its exact rules, pseudo-code and how well it suits automation.',
    body: [
      '<h3>Why rules must be exact</h3>',
      '<p>“Buy when it breaks out strongly” means something to you and nothing to a computer. “Buy when a 5-minute candle closes above $40.90 on volume above 1.5 times its 20-bar average, before 11:00 ET” can be checked on every bar, tested on past data and followed the same way every time.</p>',
      '<p>Every rule needs four things: a market, an entry condition, an exit (stop, target and time) and a size. Filters, such as trading only above VWAP or only above the 200 EMA, cut down the bad signals.</p>',
      '<h3>The six setups</h3>',
      '<ul><li><b>PMH break and retest</b> with a VWAP filter, from <a href="#l-levels">key levels</a> and <a href="#l-breakouts">breakouts</a>.</li><li><b>Opening range breakout</b>: the first 15 minutes set a box; trade the close above it.</li><li><b>EMA pullback</b> in an uptrend, from <a href="#l-ema-stack">13, 48 &amp; 200 EMA</a>.</li><li><b>RSI(2) dip</b> on a broad index ETF above its 200-day average, from <a href="#l-rsi">RSI</a>.</li><li><b>The wheel</b> on a stock you want to own, from <a href="#l-wheel">the wheel strategy</a>.</li><li><b>Monthly dollar-cost averaging</b> into an index fund, from <a href="#l-blend">blending styles</a>.</li></ul>',
      '<h3>From alert to order</h3>',
      '<p>A common pattern: a TradingView alert fires when your conditions are met and sends a webhook, a short message, to a service you control. Your code checks the rules again, sizes the trade and places the order through a broker API, or an AI agent prepares the order and waits for your approval. Each link in that chain can fail, so log every step.</p>',
      '<h3>Test before you trust</h3>',
      '<p>Slow, end-of-day setups are the easiest to automate and to check. Fast intraday setups need clean data and realistic slippage. Whatever you pick, <a href="#l-backtest">backtest it with costs</a>, paper trade it, then start tiny.</p>',
    ],
    example: {
      title: 'Opening range breakout, written for a bot',
      intro: 'Example numbers for a made-up stock, DEMO, with $50 of risk per trade.',
      steps: [
        'From 9:30 to 9:45 ET, DEMO trades between $40.10 and $40.90. That is the opening range.',
        'Rule: buy when a 5-minute candle closes above $40.90 on volume above 1.5 times its 20-bar average, before 11:00 ET.',
        'At 9:55 a candle closes at $41.02 on 2.1 times normal volume. Entry $41.02, stop at the range midpoint, $40.50: risk $0.52 a share.',
        'Size: $50 ÷ $0.52 = 96.2, rounded down to 96 shares.',
        'Target 2R: $41.02 + 2 × $0.52 = $42.06. Anything still open is closed at 15:55 ET.',
      ],
      result: 'If the target fills: 96 × $1.04 = $99.84, about 2R. If the stop fills: −$49.92.',
    },
    mistakes: [
      'Using words a computer cannot check, like “strong”, “clean” or “looks ready”.',
      'Automating a setup you have never traded by hand or backtested.',
      'Forgetting exit rules: the time stop, the end-of-day close and what happens on a gap.',
      'Running fast intraday setups without counting slippage at the open.',
    ],
    points: [
      'Every rule needs a number: price, volume, time and size.',
      'Daily, end-of-day setups such as RSI(2) and DCA are the easiest to automate.',
      'Fast intraday setups need clean data, low delays and slippage in the backtest.',
      'A TradingView alert plus a webhook can trigger your own order code or an agent that asks first.',
      'Backtest and paper trade every setup before real money.',
    ],
    terms: ['Webhook', 'Backtest', 'VWAP', 'PMH', 'RSI', 'Slippage'],
    quiz: { q: 'Which rule can a bot actually follow?', options: ['Buy when the chart looks strong', 'Buy when a 5-minute candle closes above $40.90 on volume above 1.5 times the 20-bar average', 'Buy when it feels like the bottom'], answer: 1, why: 'Only the second rule is made of numbers a computer can check on every bar.' },
  });
})();
