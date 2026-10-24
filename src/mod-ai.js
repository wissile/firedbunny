/* Stock Market Lessons: Trading with AI, part 1 (basics, research, mistakes, security, journal coach). */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $id = (x) => document.getElementById(x);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };

  SML.css(`
.ai-card{display:flex;flex-direction:column;gap:14px;padding:18px 16px;background:var(--surface)}
.ai-task{font-size:19px;line-height:1.4;font-weight:600;color:var(--ink);max-width:56ch;text-wrap:pretty}
.ai-btns{display:grid;gap:8px;grid-template-columns:1fr}
@media (min-width:560px){.ai-btns{grid-template-columns:repeat(3,minmax(0,1fr))}}
.ai-btns .btn{white-space:normal;text-align:center;line-height:1.2}
.ai-pick{background:var(--bg);color:var(--ink);border:1px solid var(--line);border-left:4px solid var(--c)}
.ai-pick:hover{background:var(--surface-2);border-color:var(--input);border-left-color:var(--c)}
.ai-done{font-size:15px;color:var(--muted)}
.ai-fields{display:grid;gap:12px 16px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));padding:16px}
.ai-fields .wide{grid-column:1/-1}
.ai-fields input[type=text]{font:500 14.5px var(--sans)}
.prose pre.ai-pre{white-space:pre-wrap;overflow-wrap:anywhere}
.ai-prompt{margin:0;padding:16px;background:var(--bg);font:500 12.5px/1.7 var(--mono);color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere;max-height:420px;overflow:auto}
.ai-prompt b{color:var(--accent);font-weight:600}
.ai-prompt i{font-style:normal;color:var(--muted)}
.hs-grid{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:820px){.hs-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}}
.hs-pane{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.hs-pane h4{margin:0;font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--accent)}
.hs-claims{list-style:none;display:flex;flex-direction:column;gap:6px}
.hs-claim{display:grid;grid-template-columns:22px minmax(0,1fr);gap:10px;align-items:start;width:100%;text-align:left;padding:9px 10px;border:1px solid var(--line);border-radius:5px;background:var(--bg);color:color-mix(in srgb,var(--ink) 88%,transparent);font:500 14.5px/1.45 var(--sans);cursor:pointer;transition:border-color .15s,background-color .15s}
.hs-claim:hover{border-color:var(--input)}
.hs-claim .fl{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--input);display:grid;place-content:center;font:700 11px var(--mono);color:var(--muted)}
.hs-claim[aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--bg))}
.hs-claim[aria-pressed=true] .fl{background:var(--accent);border-color:var(--accent);color:var(--on-acc)}
.hs-claim.ok{border-color:color-mix(in srgb,var(--up) 60%,transparent)}
.hs-claim.bad{border-color:color-mix(in srgb,var(--down) 70%,transparent)}
.hs-claim small{display:block;margin-top:4px;font-size:12.5px;line-height:1.45;color:var(--muted)}
.hs-claim small b{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-right:6px}
.hs-src{font-size:14.5px;line-height:1.65;color:color-mix(in srgb,var(--ink) 85%,transparent);margin:0;border-left:2px solid var(--line);padding-left:12px}
.hs-src mark{background:color-mix(in srgb,var(--accent) 22%,transparent);color:var(--ink);border-radius:2px;padding:0 2px}
.sc-body{display:grid;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.sc-body{grid-template-columns:minmax(0,1fr) minmax(0,1.25fr)}.sc-body > .wg-fig svg{position:sticky;top:84px}.sc-body > .sc-list{border-left:1px solid var(--line);border-top:0!important}}
.sc-body > .sc-list{border-top:1px solid var(--line)}
.sc-list{background:var(--surface);padding:12px 16px 16px;display:flex;flex-direction:column;gap:14px;min-width:0}
.sc-list h4{margin:0;font:600 10.5px var(--mono);text-transform:uppercase;letter-spacing:.16em;color:var(--accent)}
.sc-g{display:flex;flex-direction:column;gap:7px}
.ai-ck{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:10px;align-items:start;font-size:14px;line-height:1.45;color:color-mix(in srgb,var(--ink) 85%,transparent);cursor:pointer}
.ai-ck input{appearance:none;-webkit-appearance:none;width:18px;height:18px;margin:1px 0 0;border:1.5px solid var(--input);border-radius:4px;background:var(--bg);cursor:pointer}
.ai-ck input:checked{background:var(--up) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-6.5' fill='none' stroke='%230b0f19' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/13px no-repeat;border-color:var(--up)}
.ai-ck input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.ai-ck em{font-style:normal;font:600 10px var(--mono);letter-spacing:.08em;padding:2px 6px;border-radius:999px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.ai-ck em.hi{color:var(--down);border-color:color-mix(in srgb,var(--down) 40%,transparent)}
.ai-fix{list-style:none;display:flex;flex-direction:column;padding:4px 16px 14px;background:var(--surface)}
.ai-fix li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;padding:9px 0;border-bottom:1px dashed var(--line);font-size:14.5px;line-height:1.45;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.ai-fix li:last-child{border-bottom:0}
.ai-fix li span.n{font-family:var(--display);font-size:24px;line-height:.9;color:var(--accent)}
.ai-fix .ok{grid-template-columns:1fr;color:var(--up)}
.jc-notes{list-style:none;display:flex;flex-direction:column;padding:6px 16px 12px;background:var(--surface)}
.jc-notes li{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;padding:10px 0;border-bottom:1px dashed var(--line);font-size:14.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.jc-notes li:last-child{border-bottom:0}
.jc-notes li i{width:8px;height:8px;border-radius:50%;margin-top:7px;background:var(--c)}
.jc-tbl{background:var(--surface)}
.jc-tbl summary{cursor:pointer;padding:12px 16px;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.14em;color:var(--muted)}
.jc-tbl .tbl{font-size:13px;min-width:560px}
.jc-tbl .tbl td,.jc-tbl .tbl th{padding:6px 10px}
`);

  /* =====================================================================
     1. aiTaskSorter
     ===================================================================== */
  const BUCKETS = [
    { k: 'great', label: 'Great for AI', short: 'Great', c: 'var(--up)', cls: 'up' },
    { k: 'care', label: 'Use with care', short: 'Care', c: 'var(--accent)', cls: 'acc' },
    { k: 'dont', label: 'Don’t', short: 'Don’t', c: 'var(--down)', cls: 'dn' },
  ];
  const TASKS = [
    { t: 'Summarize a 60-page 10-Q you paste in into five bullets', s: 'Summarize a 10-Q', a: 'great', why: 'Reading and condensing long text is a core strength. Spot-check the numbers you will act on.' },
    { t: 'Tell you whether a stock will be higher on Friday', s: 'Predict Friday’s price', a: 'dont', why: 'No model can predict short-term prices. You get a confident guess written like analysis.' },
    { t: 'Explain gamma in plain words with a numeric example', s: 'Explain gamma', a: 'great', why: 'Patient, tailored explanations are one of the best uses. Ask it to quiz you afterwards.' },
    { t: 'Write Pine Script for an EMA crossover indicator', s: 'Write Pine Script', a: 'care', why: 'Good at code, but often uses old syntax or hides a logic bug. Compile it, test it on a chart and read it.' },
    { t: 'Give today’s premarket high without any data tool connected', s: 'Today’s PMH, no data', a: 'dont', why: 'Without live data it cannot know today’s prices and may invent one that looks real.' },
    { t: 'Turn your written trading rules into a yes/no checklist', s: 'Rules to checklist', a: 'great', why: 'Restructuring your own text is low risk and high value. You can see at once if it changed a rule.' },
    { t: 'Work out position sizes for 40 trades without a calculator or code', s: 'Mental math, 40 trades', a: 'care', why: 'Language models can slip on arithmetic. Ask it to use a code tool or a sheet, and check a few rows.' },
    { t: 'Place live trades on its own with no budget or approvals', s: 'Trade with no limits', a: 'dont', why: 'An agent can misread an instruction or act on stale data. Use a small separate account and keep approvals on.' },
    { t: 'Summarize headlines you paste in and list what could move the stock', s: 'Summarize headlines', a: 'great', why: 'Sorting text you supply into themes is reliable. It is context for your plan, not a signal.' },
    { t: 'Report a strategy’s win rate without running any code on data', s: 'Win rate, no code', a: 'dont', why: 'A backtest that was never run is made up. Real numbers need real data and code.' },
    { t: 'Pick which stocks to buy for your retirement', s: 'Pick retirement stocks', a: 'care', why: 'It can explain options and trade-offs, but it does not know your full situation and is not a licensed adviser.' },
    { t: 'Find patterns in your exported trade journal and show the counts', s: 'Review your journal', a: 'great', why: 'Grouping your own rows works well, and asking for counts lets you check the work.' },
  ];

  SML.widgets.aiTaskSorter = function (root) {
    const id = SML.uid('ats');
    let picks = new Array(TASKS.length).fill(null), cur = 0, reveal = false;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Sort each task</span><span class="grow"></span><span class="pill acc" id="${id}-prog"></span></div>
      <div class="ai-card" id="${id}-card"></div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Sorted', id + '-n')}${ui.stat('Right', id + '-ok')}${ui.stat('Score', id + '-sc', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-actions"><button type="button" class="btn sm btn-g" data-a="all">Show all answers</button><button type="button" class="btn sm btn-g" data-a="reset">Start again</button></div>`;
    const fig = $('.wg-fig', root);
    function card() {
      const el = $id(id + '-card');
      if (cur >= TASKS.length) { el.innerHTML = `<p class="ai-task">All ${TASKS.length} tasks sorted.</p><p class="ai-done">Pattern: AI is great at reading, explaining and organizing what you give it. It is risky when it has to know fresh prices, do unchecked math or act on its own.</p>`; return; }
      const t = TASKS[cur];
      el.innerHTML = `<p class="meta">Task ${cur + 1} of ${TASKS.length}</p><p class="ai-task">${esc(t.t)}</p><div class="ai-btns" role="group" aria-label="Choose a bucket">${BUCKETS.map((b) => `<button type="button" class="btn ai-pick" data-b="${b.k}" style="--c:${b.c}">${b.label}</button>`).join('')}</div>`;
    }
    const draw = ui.responsive(fig, (W) => {
      const by = BUCKETS.map((b) => TASKS.map((t, i) => ({ t, i })).filter((x) => picks[x.i] === b.k || (reveal && picks[x.i] == null && x.t.a === b.k)));
      const narrow = W < 480;
      const colW = narrow ? W : W / 3, wide = colW > 190;
      const rows = Math.max(4, ...by.map((a) => a.length));
      const boxH = by.map((a) => 52 + (narrow ? Math.max(1, a.length) : rows) * 28);
      const H = narrow ? boxH.reduce((p, q) => p + q + 10, 0) - 2 : 52 + rows * 28 + 8;
      let s = '', yy = 4;
      BUCKETS.forEach((b, j) => {
        const x0 = narrow ? 0 : j * colW + 4, w = narrow ? W : colW - 8, y0 = narrow ? yy : 4, bh = narrow ? boxH[j] : H - 8;
        const tc = b.cls === 'up' ? 'up' : b.cls === 'acc' ? 'acc' : 'dn';
        s += S.rect(x0, y0, w, bh, 'f-bg s-line', 6);
        s += S.rect(x0, y0, w, 4, 'f-' + tc, 0);
        s += S.text(x0 + 10, y0 + 24, (wide ? b.label : b.short).toUpperCase(), 'cap ' + tc);
        s += S.text(x0 + w - 10, y0 + 24, String(by[j].length), 'md mono b ink', 'end');
        if (narrow && !by[j].length) s += S.text(x0 + 16, y0 + 55, 'Nothing here yet', 'sm mut');
        by[j].forEach((x, r) => {
          const y = y0 + 40 + r * 28, picked = picks[x.i] != null, ok = picked && picks[x.i] === x.t.a;
          const cls = !picked ? 'f-shade s-line' : ok ? 'f-up-t s-up' : 'f-dn-t s-dn';
          s += S.rect(x0 + 8, y, w - 16, 22, cls + ' w1', 4);
          const lab = '#' + (x.i + 1) + (wide ? '  ' + x.t.s : '');
          const max = Math.floor((w - 40) / 6.6);
          s += S.text(x0 + 16, y + 15, esc(lab.length > max ? lab.slice(0, max - 1) + '…' : lab), 'sm ' + (picked ? 'ink' : 'mut'));
          if (picked) s += S.text(x0 + w - 16, y + 15, ok ? '✓' : '✗', 'sm b ' + (ok ? 'up' : 'dn'), 'end');
        });
        yy += bh + 10;
      });
      fig.innerHTML = S.wrap(W, H, 'Three buckets showing the tasks you sorted, marked right or wrong', s);
    });
    function update(last) {
      const n = picks.filter((p) => p != null).length, ok = picks.filter((p, i) => p === TASKS[i].a).length;
      $id(id + '-prog').textContent = n >= TASKS.length ? 'Done' : `Card ${Math.min(cur + 1, TASKS.length)} of ${TASKS.length}`;
      sv(id + '-n', `${n}/${TASKS.length}`); sv(id + '-ok', String(ok), ok ? 'up' : '');
      sv(id + '-sc', n ? Math.round((ok / n) * 100) + '%' : '—', 'acc');
      const m = $id(id + '-msg');
      if (last != null) { const t = TASKS[last], good = picks[last] === t.a, ans = BUCKETS.find((b) => b.k === t.a); m.innerHTML = ui.msg(good ? 'up' : 'dn', good ? 'Right' : ans.short, `${good ? '' : 'Best bucket: <b>' + ans.label + '</b>. '}${esc(t.why)}`); }
      else if (reveal) m.innerHTML = ui.msg('info', 'Answers', 'Grey chips show where the tasks you have not sorted yet belong. Keep sorting to read the reason for each one.');
      else m.innerHTML = ui.msg('acc', 'Start', 'Pick a bucket for the task above. You get the reason right away.');
      card(); draw();
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-b],[data-a]'); if (!b || !root.contains(b)) return;
      if (b.dataset.b && cur < TASKS.length) { picks[cur] = b.dataset.b; const last = cur; cur++; update(last); }
      else if (b.dataset.a === 'all') { reveal = !reveal; b.textContent = reveal ? 'Hide answers' : 'Show all answers'; update(null); }
      else if (b.dataset.a === 'reset') { picks = new Array(TASKS.length).fill(null); cur = 0; reveal = false; $('[data-a="all"]', root).textContent = 'Show all answers'; update(null); }
    });
    update(null);
  };

  /* =====================================================================
     2. promptBuilder
     ===================================================================== */
  const PTASKS = {
    plan: { label: 'Premarket plan', subj: 'Ticker', subjV: 'DEMO', when: 'today’s session',
      role: 'You are a careful trading assistant. You help me plan; you do not give financial advice.',
      data: (s, w) => `Data for ${s}, ${w}: PDH 52.10, PDL 49.80, PMH 51.40, PML 50.60, VWAP 51.05.\nHeadlines: [paste the latest headlines here]`,
      task: (s) => `Write my if-then plan for ${s} for the first hour: what I do if price breaks and holds the PMH, if it loses the PML, and if it stays between them.`,
      format: 'Answer as a table with columns: Scenario, Trigger, Entry, Stop, Target, Size note. Then list three risks in bullets.' },
    earn: { label: 'Earnings summary', subj: 'Ticker', subjV: 'DEMO', when: 'the latest quarter',
      role: 'You are a careful financial analyst writing for a beginner.',
      data: (s, w) => `Below is ${s}’s earnings release and call transcript for ${w}:\n[paste the full text here]`,
      task: () => 'Summarize revenue, EPS, gross margin, free cash flow and guidance, each compared with the same quarter last year.',
      format: 'Five bullets, then a table with columns: Metric, This quarter, Last year, Change.' },
    comp: { label: 'Compare companies', subj: 'Tickers', subjV: 'DEMO vs DEMO-B', when: 'the last four quarters',
      role: 'You are a neutral analyst comparing businesses, not recommending them.',
      data: (s, w) => `Figures for ${s} over ${w} (from their filings):\n[paste revenue, net income, debt, cash and free cash flow for each]`,
      task: (s) => `Compare ${s} on revenue growth, profit margin, debt to equity and free cash flow.`,
      format: 'A side-by-side table, then two sentences on the biggest difference.' },
    explain: { label: 'Explain a concept', subj: 'Topic', subjV: 'VWAP', when: 'a 2-minute day-trading chart',
      role: 'You are a patient trading tutor for a complete beginner.',
      data: (s, w) => `I trade on ${w}. Here is what I already understand about ${s}: [write one or two sentences]`,
      task: (s) => `Explain ${s} in plain words with one worked numeric example, then quiz me with three multiple-choice questions.`,
      format: 'Short paragraphs, the example as numbered steps, then the quiz with answers at the end.' },
    check: { label: 'Build a checklist', subj: 'Setup', subjV: 'PMH break and retest', when: 'every trade',
      role: 'You are my trading coach. You keep my rules exactly as I wrote them.',
      data: (s, w) => `My written rules for the ${s} setup:\n[paste your rules here]`,
      task: (s, w) => `Turn my rules into a yes/no checklist I can tick before ${w}. Keep every rule; do not add new ones.`,
      format: 'Numbered yes/no questions, at most ten, grouped under Before entry, Entry, After entry.' },
  };
  const PARTS = [
    { k: 'role', label: 'Role', w: 10, part: 'Role' },
    { k: 'ctx', label: 'Your rules', w: 15, part: 'Context' },
    { k: 'data', label: 'Paste data', w: 25, part: 'Data' },
    { k: 'fmt', label: 'Format', w: 10, part: 'Format' },
    { k: 'honest', label: 'Say “not stated”', w: 15, part: 'Rules' },
    { k: 'cite', label: 'Quote sources', w: 8, part: 'Rules' },
    { k: 'nopred', label: 'No predictions', w: 7, part: 'Rules' },
  ];

  SML.widgets.promptBuilder = function (root) {
    const id = SML.uid('pb');
    root.innerHTML = `
      <div class="wg-bar">${ui.seg(id + '-task', Object.keys(PTASKS).map((k) => ({ v: k, label: PTASKS[k].label })), 'plan', 'Task')}</div>
      <div class="ai-fields">
        <label class="fld" for="${id}-subj"><span id="${id}-subjl">Ticker</span><input type="text" id="${id}-subj" value="DEMO" autocomplete="off"></label>
        <label class="fld" for="${id}-when"><span>When / timeframe</span><input type="text" id="${id}-when" value="today’s session" autocomplete="off"></label>
        <label class="fld wide" for="${id}-rules"><span>Your rules (context)</span><input type="text" id="${id}-rules" value="I day trade US stocks on a 2-minute chart, risk 1% per trade and only take PMH or PDH breaks that retest and hold." autocomplete="off"></label>
      </div>
      <div class="wg-bar"><span class="wg-title">Good habits</span>${ui.chips(id + '-p', PARTS.map((p) => ({ k: p.k, label: p.label, color: 'var(--up)', on: p.k !== 'cite' && p.k !== 'fmt' })))}</div>
      <div class="wg-fig"></div>
      <pre class="ai-prompt" id="${id}-out" aria-live="polite"></pre>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-actions"><button type="button" class="btn sm btn-p" data-a="copy">Copy prompt</button><span class="note">Paste into Claude, ChatGPT or any assistant, then fill the [brackets].</span></div>`;
    const fig = $('.wg-fig', root);
    let lastTask = 'plan', text = '';
    const st = ui.wire(root, () => { const t = st.seg(id + '-task'); if (t !== lastTask) { lastTask = t; const P = PTASKS[t]; $id(id + '-subj').value = P.subjV; $id(id + '-when').value = P.when; $id(id + '-subjl').textContent = P.subj; } render(); });
    function build() {
      const P = PTASKS[st.seg(id + '-task')] || PTASKS.plan;
      const subj = $id(id + '-subj').value.trim() || P.subjV, when = $id(id + '-when').value.trim() || P.when, rules = $id(id + '-rules').value.trim();
      const on = (k) => st.on(id + '-p', k);
      const L = [], H = [];
      const add = (head, body) => { L.push(head + ': ' + body); H.push(`<b>${head}:</b> ${esc(body)}`); };
      if (on('role')) add('Role', P.role);
      if (on('ctx') && rules) add('Context', rules);
      if (on('data')) add('Data', P.data(subj, when));
      add('Task', P.task(subj, when));
      if (on('fmt')) add('Format', P.format);
      const r = [];
      if (on('honest')) r.push('Use only the data I gave you. If something is missing, write "not stated" instead of guessing.');
      if (on('cite')) r.push('Quote the sentence or source you used for every number.');
      if (on('nopred')) r.push('Do not predict where the price will go and do not tell me what to buy.');
      if (r.length) add('Rules', r.join(' '));
      text = L.join('\n\n'); $id(id + '-out').innerHTML = H.join('\n\n');
      let score = 10; PARTS.forEach((p) => { if (on(p.k) && (p.k !== 'ctx' || rules)) score += p.w; });
      score = Math.min(100, score);
      const have = { Role: on('role'), Context: on('ctx') && !!rules, Data: on('data'), Task: true, Format: on('fmt'), Rules: on('honest') || on('cite') || on('nopred') };
      return { score, have, on };
    }
    let B = null;
    const draw = ui.responsive(fig, (W) => {
      if (!B) return;
      const narrow = W < 560, H = narrow ? 184 : 104;
      const names = ['Role', 'Context', 'Data', 'Task', 'Format', 'Rules'];
      let s = '';
      const gx = narrow ? 0 : W - 210, gw = narrow ? W : 210;
      const ax0 = 0, aw = narrow ? W : W - 236;
      s += S.text(ax0, 16, 'PROMPT ANATOMY', 'cap');
      const seg = (aw - 5 * 6) / 6;
      names.forEach((n, i) => {
        const x = ax0 + i * (seg + 6), ok = B.have[n];
        s += S.rect(x, 28, seg, 38, ok ? 'f-up-t s-up w1' : 'f-bg s-line w1', 5);
        s += S.text(x + seg / 2, 52, n, (seg < 58 ? 'xs' : 'sm') + ' b ' + (ok ? 'up' : 'mut'), 'middle');
      });
      s += S.text(ax0, 88, B.have.Data ? 'Data is in: answers can be checked.' : 'No data: the model will fill gaps from memory.', 'sm ' + (B.have.Data ? 'ink' : 'dn'));
      const gy = narrow ? 118 : 16;
      s += S.text(gx, gy, 'QUALITY', 'cap');
      s += S.rect(gx, gy + 14, gw, 12, 'f-bg s-line w1', 6);
      const cls = B.score >= 80 ? 'f-up' : B.score >= 55 ? 'f-acc' : 'f-dn';
      s += S.rect(gx, gy + 14, (gw * B.score) / 100, 12, cls, 6);
      s += S.text(gx, gy + 62, String(B.score), 'xxl disp ' + (B.score >= 80 ? 'up' : B.score >= 55 ? 'acc' : 'dn')) + S.text(gx + 44, gy + 60, '/ 100', 'sm mono');
      fig.innerHTML = S.wrap(W, H, `Prompt anatomy and quality score ${B.score} out of 100`, s);
    });
    function render() {
      B = build(); draw();
      const miss = [];
      if (!B.on('data')) miss.push('paste the actual data, the biggest single improvement');
      if (!B.on('honest')) miss.push('tell it to write "not stated" instead of guessing');
      if (!B.on('ctx')) miss.push('add your rules so the answer fits how you trade');
      if (!B.on('fmt')) miss.push('ask for a table or bullets so it is easy to scan');
      if (!B.on('cite')) miss.push('ask it to quote the source for each number');
      if (!B.on('role')) miss.push('give it a role');
      $id(id + '-msg').innerHTML = !miss.length ? ui.msg('up', 'Complete', 'Role, context, data, one task, a format and honesty rules. You will get an answer you can check line by line.') : B.score >= 85 ? ui.msg('up', 'Strong', 'One more upgrade: ' + miss[0] + '.') : ui.msg(B.score >= 55 ? 'acc' : 'dn', B.score >= 55 ? 'Okay' : 'Weak', 'To improve it: ' + miss.slice(0, 3).join('; ') + '.');
    }
    $('[data-a="copy"]', root).addEventListener('click', () => SML.copy(text, 'Prompt copied'));
    render();
  };

  /* =====================================================================
     3. hallucinationSpotter
     ===================================================================== */
  const SRC = [
    { k: 'rev', t: 'Revenue for the third quarter was $412 million, up 18% from $349 million a year ago.' },
    { k: 'ni', t: 'GAAP net income was $31 million, or $0.42 per diluted share.' },
    { k: 'gm', t: 'Gross margin was 46.1%, compared with 44.0% in the prior-year quarter.' },
    { k: 'gd', t: 'The company now expects full-year revenue of $1.58 billion to $1.62 billion, unchanged from its prior outlook.' },
    { k: 'fcf', t: 'Free cash flow was $22 million.' },
    { k: 'div', t: 'The board did not declare a dividend.' },
  ];
  const CLAIMS = [
    { c: 'Revenue rose 18% to $412 million.', bad: false, src: 'rev', why: 'Matches the release, and 412 ÷ 349 = 1.18.' },
    { c: 'EPS came in at $0.48 per share.', bad: true, src: 'ni', why: 'The release says $0.42. A small slip like this can flip a “beat” into a “miss”.' },
    { c: 'Gross margin expanded to 46.1% from 44.0%.', bad: false, src: 'gm', why: 'Matches the release.' },
    { c: 'Management raised full-year guidance to $1.6 to $1.7 billion.', bad: true, src: 'gd', why: 'Guidance was $1.58B to $1.62B and unchanged. “Raised” is invented.' },
    { c: 'Net income was $31 million.', bad: false, src: 'ni', why: 'Matches the release.' },
    { c: 'The board announced a new $0.10 quarterly dividend.', bad: true, src: 'div', why: 'The release says no dividend was declared. The model filled a gap with a plausible fact.' },
    { c: 'Free cash flow was $22 million.', bad: false, src: 'fcf', why: 'Matches the release.' },
    { c: 'Analysts expect the stock to rally after the report.', bad: true, src: null, why: 'Nothing in the source says this. It is an opinion presented as a fact.' },
  ];
  SML.widgets.hallucinationSpotter = function (root) {
    const id = SML.uid('hs');
    let flags = new Array(CLAIMS.length).fill(false), checked = false;
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">DEMO Robotics Q3 · made-up company</span><span class="grow"></span><span class="pill" id="${id}-st"></span></div>
      <div class="wg-fig"><div class="hs-grid">
        <div class="hs-pane"><h4>AI summary · tap claims to flag</h4><ul class="hs-claims" id="${id}-c"></ul></div>
        <div class="hs-pane"><h4>Source · press release excerpt</h4><p class="hs-src" id="${id}-src"></p></div>
      </div></div>
      <div class="wg-read">${ui.stat('Bad claims caught', id + '-caught')}${ui.stat('Missed', id + '-miss')}${ui.stat('False alarms', id + '-fa')}${ui.stat('Score', id + '-sc', 'hl')}</div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-actions"><button type="button" class="btn sm btn-p" data-a="check">Check against the source</button><button type="button" class="btn sm btn-g" data-a="reset">Try again</button></div>`;
    function render() {
      $id(id + '-c').innerHTML = CLAIMS.map((c, i) => {
        const res = checked ? (c.bad ? 'bad' : 'ok') : '';
        const verdict = checked ? `<small><b class="${c.bad ? 'dn' : 'up'}">${c.bad ? (c.src ? 'Wrong' : 'Not in source') : 'Correct'}</b>${esc(c.why)}</small>` : '';
        return `<li><button type="button" class="hs-claim ${res}" data-i="${i}" aria-pressed="${flags[i]}"><span class="fl">${flags[i] ? '!' : i + 1}</span><span>${esc(c.c)}${verdict}</span></button></li>`;
      }).join('');
      const marks = checked ? new Set(CLAIMS.filter((c) => c.bad && c.src).map((c) => c.src)) : new Set();
      $id(id + '-src').innerHTML = SRC.map((s) => (marks.has(s.k) ? `<mark>${esc(s.t)}</mark>` : esc(s.t))).join(' ');
      const nf = flags.filter(Boolean).length;
      $id(id + '-st').textContent = `${nf} flagged`; $id(id + '-st').className = 'pill' + (nf ? ' acc' : '');
      const bad = CLAIMS.map((c, i) => c.bad), caught = flags.filter((f, i) => f && bad[i]).length, fa = flags.filter((f, i) => f && !bad[i]).length, totalBad = bad.filter(Boolean).length;
      if (checked) {
        sv(id + '-caught', `${caught}/${totalBad}`, caught === totalBad ? 'up' : 'acc'); sv(id + '-miss', String(totalBad - caught), totalBad - caught ? 'dn' : 'up'); sv(id + '-fa', String(fa), fa ? 'acc' : '');
        const score = Math.max(0, Math.round(((caught - fa * 0.5) / totalBad) * 100)); sv(id + '-sc', score + '%', 'acc');
        $id(id + '-msg').innerHTML = caught === totalBad && !fa ? ui.msg('up', 'Sharp', 'You caught every bad claim with no false alarms. The habit that did it: trace each number to a sentence.') : ui.msg(caught === totalBad ? 'acc' : 'dn', caught === totalBad ? 'Close' : 'Missed some', `${totalBad - caught ? `${totalBad - caught} wrong claim${totalBad - caught > 1 ? 's' : ''} slipped through. ` : ''}${fa ? `${fa} correct claim${fa > 1 ? 's were' : ' was'} flagged, which costs only a check. ` : ''}Half the claims were fine; the wrong ones looked just as confident.`);
      } else {
        ['caught', 'miss', 'fa', 'sc'].forEach((k) => sv(id + '-' + k, '—'));
        $id(id + '-msg').innerHTML = ui.msg('acc', 'Your turn', 'Flag any claim you would verify before trading on it. Then check against the source.');
      }
    }
    root.addEventListener('click', (e) => {
      const c = e.target.closest('.hs-claim'); const a = e.target.closest('[data-a]');
      if (c && root.contains(c) && !checked) { const i = Number(c.dataset.i); flags[i] = !flags[i]; render(); }
      else if (a && root.contains(a)) { if (a.dataset.a === 'check') checked = true; else { checked = false; flags = flags.map(() => false); } render(); }
    });
    render();
  };

  /* =====================================================================
     4. securityChecklist
     ===================================================================== */
  const CHECKS = [
    { g: 'Keys and access', k: 'store', w: 3, t: 'API keys live in a secret store or env settings, never in a chat or shared code', fix: 'Move every API key into a password manager or the tool’s env settings and rotate any key that was ever pasted into a chat.' },
    { g: 'Keys and access', k: 'ro', w: 2, t: 'Research tools use read-only keys; only the trading tool can place orders', fix: 'Create read-only keys for research and data tools.' },
    { g: 'Keys and access', k: 'tfa', w: 3, t: 'Two-factor authentication is on for broker, email and AI accounts', fix: 'Turn on two-factor authentication for your broker, your email and every AI account.' },
    { g: 'Keys and access', k: 'off', w: 2, t: 'I can disconnect the agent or revoke keys in one step', fix: 'Practise disconnecting the agent and revoking a key so you can do it in seconds.' },
    { g: 'Money limits', k: 'sep', w: 3, t: 'The agent trades in a separate account, like a Robinhood agentic account', fix: 'Give the agent its own account so it can never touch your main portfolio.' },
    { g: 'Money limits', k: 'small', w: 3, t: 'That account holds only a small pilot amount I can afford to lose', fix: 'Fund the agent’s account with a pilot amount, the most you are willing to lose while testing.' },
    { g: 'Money limits', k: 'appr', w: 3, t: 'Approvals are on, or my instructions say: always show me the order and wait', fix: 'Turn on trade approvals or tell the agent to always wait for your yes before ordering.' },
    { g: 'Money limits', k: 'lim', w: 2, t: 'Max order size and a daily loss limit are written into the agent’s rules', fix: 'Write a max order size and a daily stop-trading loss into the agent’s instructions.' },
    { g: 'Data and privacy', k: 'priv', w: 2, t: 'I never paste account numbers, SSNs or full statements into chats', fix: 'Strip account numbers and personal data before sharing anything with an AI tool.' },
    { g: 'Data and privacy', k: 'set', w: 1, t: 'I checked each AI tool’s data and training settings', fix: 'Review the data retention and training settings of each AI provider you use.' },
    { g: 'Rules and records', k: 'law', w: 3, t: 'No trading on non-public information and no bots that try to move prices', fix: 'Write down the legal lines: no inside information, no spoofing or pump schemes, ever.' },
    { g: 'Rules and records', k: 'log', w: 2, t: 'Every agent action and order is logged and reviewed weekly', fix: 'Keep a log of every agent order and review it weekly with your journal.' },
    { g: 'Rules and records', k: 'scrape', w: 1, t: 'Data collection follows site terms and rate limits, using official APIs where they exist', fix: 'Switch scrapers to official APIs (like SEC EDGAR) and respect rate limits and terms.' },
    { g: 'Rules and records', k: 'tax', w: 1, t: 'I track wash sales and taxes from frequent automated trades', fix: 'Track wash sales from repeated trades in the same ticker and keep your broker’s tax records.' },
  ];
  const PRESETS = { beginner: ['tfa', 'priv', 'law'], careful: CHECKS.map((c) => c.k).filter((k) => k !== 'set' && k !== 'tax'), none: [] };
  SML.widgets.securityChecklist = function (root) {
    const id = SML.uid('sc');
    const groups = Array.from(new Set(CHECKS.map((c) => c.g)));
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Load an example</span>${ui.seg(id + '-pre', [{ v: 'beginner', label: 'Typical beginner' }, { v: 'careful', label: 'Careful setup' }, { v: 'none', label: 'Clear all' }], 'beginner', 'Example setups')}</div>
      <div class="sc-body"><div class="wg-fig"></div><div class="sc-list">${groups.map((g) => `<div class="sc-g"><h4>${g}</h4>${CHECKS.filter((c) => c.g === g).map((c) => `<label class="ai-ck" for="${id}-${c.k}"><input type="checkbox" id="${id}-${c.k}" data-k="${c.k}"><span>${esc(c.t)}</span><em class="${c.w >= 3 ? 'hi' : ''}">${c.w >= 3 ? 'CRITICAL' : c.w === 2 ? 'IMPORTANT' : 'GOOD'}</em></label>`).join('')}</div>`).join('')}</div></div>
      <div class="wg-read">${ui.stat('Risk', id + '-risk')}${ui.stat('Done', id + '-done')}${ui.stat('Critical gaps', id + '-crit')}</div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <div class="wg-bar"><span class="wg-title">Your next fixes</span></div>
      <ol class="ai-fix" id="${id}-fix"></ol>`;
    const fig = $('.wg-fig', root);
    const total = CHECKS.reduce((s, c) => s + c.w, 0);
    const isOn = (k) => { const e = $id(id + '-' + k); return !!(e && e.checked); };
    const setPreset = (p) => CHECKS.forEach((c) => { const e = $id(id + '-' + c.k); if (e) e.checked = (PRESETS[p] || []).includes(c.k); });
    let risk = 0;
    const draw = ui.responsive(fig, (W) => {
      const showBars = W >= 340 && window.matchMedia('(min-width: 900px)').matches;
      const r = Math.min(W / 2 - 34, 118), cx = W / 2, cy = 22 + r;
      const H = cy + 74 + (showBars ? 20 + groups.length * 40 : 0);
      const pt = (a, rr) => [cx + rr * Math.cos(Math.PI * (1 - a)), cy - rr * Math.sin(Math.PI * (1 - a))];
      const arc = (a0, a1, cls) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return S.path(`M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`, 'nf ' + cls); };
      let s = arc(0, 0.295, 's-up w4 o70') + arc(0.305, 0.595, 's-acc w4 o70') + arc(0.605, 1, 's-dn w4 o70');
      [0, 0.5, 1].forEach((a, i) => { const [x, y] = pt(a, r + 16); s += S.text(x, y + 4, ['0', '50', '100'][i], 'xs mono', 'middle'); });
      const [nx, ny] = pt(risk / 100, r - 14);
      s += S.line(cx, cy, nx, ny, 's-ink w3') + S.circle(cx, cy, 6, 'f-ink');
      const lvl = risk >= 60 ? ['HIGH RISK', 'dn'] : risk >= 30 ? ['MEDIUM RISK', 'acc'] : ['LOW RISK', 'up'];
      s += S.text(cx, cy + 44, String(risk), 'xxl disp ' + lvl[1], 'middle', ' style="font-size:34px"');
      s += S.text(cx, cy + 64, lvl[0], 'cap ' + lvl[1], 'middle');
      if (showBars) {
        let y = cy + 104;
        groups.forEach((g) => {
          const items = CHECKS.filter((c) => c.g === g), got = items.filter((c) => isOn(c.k)).reduce((p, c) => p + c.w, 0), all = items.reduce((p, c) => p + c.w, 0);
          const n = items.filter((c) => isOn(c.k)).length, f = got / all;
          s += S.text(0, y, esc(g), 'sm ink b') + S.text(W, y, `${n} of ${items.length}`, 'xs mono', 'end');
          s += S.rect(0, y + 8, W, 8, 'f-shade', 4) + S.rect(0, y + 8, Math.max(f ? 8 : 0, W * f), 8, f >= 0.99 ? 'f-up' : f >= 0.5 ? 'f-acc' : 'f-dn', 4);
          y += 40;
        });
      }
      fig.innerHTML = S.wrap(W, H, `Risk gauge at ${risk} out of 100`, s);
    });
    function render() {
      const missing = CHECKS.filter((c) => !isOn(c.k));
      risk = Math.round((missing.reduce((s, c) => s + c.w, 0) / total) * 100);
      const crit = missing.filter((c) => c.w >= 3);
      sv(id + '-risk', risk + ' / 100', risk >= 60 ? 'dn' : risk >= 30 ? 'acc' : 'up');
      sv(id + '-done', `${CHECKS.length - missing.length} of ${CHECKS.length}`);
      sv(id + '-crit', String(crit.length), crit.length ? 'dn' : 'up');
      $id(id + '-msg').innerHTML = !missing.length ? ui.msg('up', 'Locked down', 'Every box ticked. Keep reviewing the agent log and rotating keys.') : crit.length ? ui.msg('dn', 'Fix first', `${crit.length} critical gap${crit.length > 1 ? 's' : ''}. Each one alone could cost more than a bad trade.`) : ui.msg('acc', 'Almost', 'No critical gaps left. The rest make problems easier to spot and clean up.');
      const fixes = missing.slice().sort((a, b) => b.w - a.w).slice(0, 4);
      $id(id + '-fix').innerHTML = fixes.length ? fixes.map((c, i) => `<li><span class="n">${i + 1}</span><span>${esc(c.fix)}</span></li>`).join('') : '<li class="ok">Nothing left to fix.</li>';
      draw();
    }
    const st = ui.wire(root, (e) => { if (e && e.target && e.target.closest && e.target.closest('.seg')) setPreset(st.seg(id + '-pre')); render(); });
    setPreset('beginner'); render();
  };

  /* =====================================================================
     5. journalCoach
     ===================================================================== */
  // date, ticker, setup, time, followed plan, R, size multiple
  const JR = [
    ['10/01', 'DEMO-A', 'PMH retest', '9:52', 'Y', 2.1, 1], ['10/01', 'DEMO-C', 'Chase', '10:04', 'N', -1.0, 1],
    ['10/02', 'DEMO-B', 'VWAP reclaim', '10:18', 'Y', 1.4, 1], ['10/02', 'DEMO-B', 'Chase', '10:41', 'N', -1.3, 1],
    ['10/03', 'DEMO-D', 'Opening breakout', '9:36', 'Y', -1.0, 1], ['10/03', 'DEMO-D', 'Chase', '9:44', 'N', -1.5, 1.5],
    ['10/06', 'DEMO-A', 'PMH retest', '10:02', 'Y', 1.8, 1], ['10/06', 'DEMO-C', 'VWAP reclaim', '11:40', 'Y', -0.4, 1],
    ['10/06', 'DEMO-C', 'Chase', '11:55', 'N', -1.0, 2], ['10/07', 'DEMO-A', 'PDL bounce', '10:30', 'Y', 1.1, 1],
    ['10/07', 'DEMO-B', 'Opening breakout', '9:33', 'N', -1.2, 1], ['10/08', 'DEMO-D', 'PMH retest', '9:58', 'Y', 2.4, 1],
    ['10/08', 'DEMO-D', 'VWAP reclaim', '13:10', 'Y', 0.3, 1], ['10/09', 'DEMO-A', 'Opening breakout', '9:31', 'Y', 1.5, 1],
    ['10/09', 'DEMO-C', 'Chase', '14:20', 'N', -1.0, 1], ['10/10', 'DEMO-B', 'PMH retest', '10:12', 'Y', -1.0, 1],
    ['10/10', 'DEMO-B', 'VWAP reclaim', '10:48', 'Y', 1.6, 1], ['10/13', 'DEMO-A', 'PDL bounce', '12:05', 'Y', -1.0, 1],
    ['10/13', 'DEMO-A', 'Chase', '12:20', 'N', -1.5, 1.5], ['10/14', 'DEMO-D', 'PMH retest', '9:55', 'Y', 1.9, 1],
    ['10/14', 'DEMO-C', 'Opening breakout', '9:35', 'N', -1.0, 1], ['10/15', 'DEMO-B', 'VWAP reclaim', '10:40', 'Y', 1.2, 1],
    ['10/15', 'DEMO-D', 'PDL bounce', '14:45', 'Y', 0.6, 1], ['10/16', 'DEMO-A', 'PMH retest', '10:08', 'Y', 2.0, 1],
    ['10/16', 'DEMO-C', 'Chase', '9:40', 'N', -1.0, 1], ['10/17', 'DEMO-B', 'Opening breakout', '9:32', 'Y', -1.0, 1],
    ['10/17', 'DEMO-B', 'Chase', '9:50', 'N', -1.4, 1.5], ['10/20', 'DEMO-D', 'VWAP reclaim', '11:15', 'Y', 0.8, 1],
    ['10/20', 'DEMO-A', 'PDL bounce', '10:25', 'Y', 1.3, 1], ['10/21', 'DEMO-C', 'PMH retest', '10:15', 'Y', -1.0, 1],
  ];
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const TRADES = JR.map((r, i) => ({ n: i + 1, date: r[0], tk: r[1], setup: r[2], time: r[3], plan: r[4], R: r[5], size: r[6] }));
  TRADES.forEach((t, i) => { const p = TRADES[i - 1]; t.afterLoss = !!(p && p.date === t.date && p.R < 0); t.m = mins(t.time); });
  const GROUPS = {
    time: { label: 'Time of day', key: (t) => (t.m < 585 ? '9:30 to 9:45' : t.m < 630 ? '9:45 to 10:30' : t.m < 720 ? '10:30 to 12:00' : 'After 12:00'), order: ['9:30 to 9:45', '9:45 to 10:30', '10:30 to 12:00', 'After 12:00'] },
    setup: { label: 'Setup', key: (t) => t.setup, order: ['PMH retest', 'VWAP reclaim', 'PDL bounce', 'Opening breakout', 'Chase'] },
    plan: { label: 'Followed plan', key: (t) => (t.plan === 'Y' ? 'Followed plan' : 'Broke plan'), order: ['Followed plan', 'Broke plan'] },
    loss: { label: 'After a loss', key: (t) => (!t.afterLoss ? 'No loss before' : t.size > 1 ? 'After a loss, bigger size' : 'After a loss, same size'), order: ['No loss before', 'After a loss, same size', 'After a loss, bigger size'] },
  };
  const statsOf = (arr) => { const n = arr.length, w = arr.filter((t) => t.R > 0).length, tot = arr.reduce((s, t) => s + t.R, 0); return { n, w, wr: n ? w / n : 0, tot, avg: n ? tot / n : 0 }; };
  const JS = { all: statsOf(TRADES), plan: statsOf(TRADES.filter((t) => t.plan === 'Y')), broke: statsOf(TRADES.filter((t) => t.plan === 'N')), open: statsOf(TRADES.filter((t) => t.m < 585)), bigger: statsOf(TRADES.filter((t) => t.afterLoss && t.size > 1)), pmh: statsOf(TRADES.filter((t) => t.setup === 'PMH retest')) };
  const r1 = (v) => F.R(v, 1);

  SML.widgets.journalCoach = function (root) {
    const id = SML.uid('jc');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Group by</span>${ui.seg(id + '-g', Object.keys(GROUPS).map((k) => ({ v: k, label: GROUPS[k].label })), 'time', 'Group trades by')}</div>
      <div class="wg-bar"><span class="wg-title">Include</span>${ui.chips(id + '-f', [{ k: 'Y', label: 'Followed plan', color: 'var(--up)', on: true }, { k: 'N', label: 'Broke plan', color: 'var(--down)', on: true }])}<span class="grow"></span><span class="note">Sample journal · made-up tickers</span></div>
      <div class="wg-fig"></div>
      <div class="wg-read">${ui.stat('Trades', id + '-n')}${ui.stat('Win rate', id + '-wr')}${ui.stat('Total R', id + '-tot')}${ui.stat('Avg R per trade', id + '-avg')}</div>
      <div class="wg-msg" id="${id}-msg" aria-live="polite"></div>
      <ul class="jc-notes" id="${id}-notes"></ul>
      <details class="jc-tbl"><summary>See the ${TRADES.length} trades</summary><div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Date</th><th>Time</th><th>Ticker</th><th>Setup</th><th>Plan</th><th class="num">Size</th><th class="num">R</th></tr></thead><tbody>${TRADES.map((t) => `<tr><td class="mono">${t.n}</td><td class="mono">${t.date}</td><td class="mono">${t.time}</td><td class="mono">${t.tk}</td><td>${t.setup}</td><td>${t.plan === 'Y' ? 'Yes' : '<span class="dn">No</span>'}</td><td class="num">${t.size}×</td><td class="num ${t.R > 0 ? 'up' : 'dn'}">${r1(t.R)}</td></tr>`).join('')}</tbody></table></div></details>
      <div class="wg-actions"><button type="button" class="btn sm btn-p" data-a="copy">Copy the AI prompt with this journal</button><span class="note">Then try the same prompt with your own export.</span></div>`;
    const fig = $('.wg-fig', root);
    let rows = [];
    const st = ui.wire(root, () => render());
    const sel = () => TRADES.filter((t) => st.on(id + '-f', t.plan));
    const draw = ui.responsive(fig, (W) => {
      const G = GROUPS[st.seg(id + '-g')] || GROUPS.time; const data = sel();
      rows = G.order.map((k) => ({ k, s: statsOf(data.filter((t) => G.key(t) === k)) })).filter((r) => r.s.n);
      const narrow = W < 520, labW = narrow ? 0 : Math.min(180, W * 0.26), statW = narrow ? 70 : 104, rowH = narrow ? 58 : 46, top = 30, pad = 54;
      const H = top + Math.max(1, rows.length) * rowH + 10;
      const lo = Math.min(0, ...rows.map((r) => r.s.tot)), hi = Math.max(0, ...rows.map((r) => r.s.tot));
      const x0 = (narrow ? 0 : labW + 14) + (lo < 0 ? pad : 4), x1 = W - statW - (hi > 0 ? pad : 8);
      const x = SML.lin(lo, hi > lo ? hi : lo + 1, x0, x1), zx = x(0);
      let s = S.text(narrow ? 0 : labW + 14, 14, 'TOTAL R', 'cap') + S.text(W, 14, narrow ? 'N · WIN' : 'TRADES · WIN', 'cap', 'end');
      s += S.line(zx, top - 4, zx, H - 6, 's-mut');
      rows.forEach((r, i) => {
        const y = top + i * rowH + (narrow ? 22 : 8), bh = 22, v = r.s.tot;
        if (narrow) s += S.text(0, y - 7, esc(r.k), 'sm ink b');
        else s += S.text(labW, y + 15, esc(r.k), 'md ink', 'end');
        const xa = Math.min(zx, x(v)), w = Math.max(2, Math.abs(x(v) - zx));
        s += S.rect(xa, y, w, bh, v >= 0 ? 'f-up' : 'f-dn', 3, ' opacity=".85"');
        s += S.text(v >= 0 ? xa + w + 6 : xa - 6, y + 15, r1(v), 'sm mono b ' + (v >= 0 ? 'up' : 'dn'), v >= 0 ? 'start' : 'end');
        s += S.text(W, y + 15, `${r.s.n} · ${Math.round(r.s.wr * 100)}%`, 'sm mono', 'end');
      });
      if (!rows.length) s += S.text(W / 2, top + 30, 'Turn on at least one filter.', 'md', 'middle');
      fig.innerHTML = S.wrap(W, H, 'Bars of total R for each group of trades, with count and win rate', s);
    });
    function render() {
      draw();
      const data = sel(), a = statsOf(data);
      sv(id + '-n', String(a.n)); sv(id + '-wr', a.n ? Math.round(a.wr * 100) + '%' : '—'); sv(id + '-tot', a.n ? r1(a.tot) : '—', a.tot >= 0 ? 'up' : 'dn'); sv(id + '-avg', a.n ? F.R(a.avg, 2) : '—', a.avg >= 0 ? 'up' : 'dn');
      const best = rows.slice().sort((p, q) => q.s.tot - p.s.tot)[0], worst = rows.slice().sort((p, q) => p.s.tot - q.s.tot)[0];
      const G = GROUPS[st.seg(id + '-g')];
      $id(id + '-msg').innerHTML = rows.length > 1 ? ui.msg(worst.s.tot < 0 ? 'dn' : 'up', 'Biggest leak', `By ${G.label.toLowerCase()}: <b>${esc(worst.k)}</b> is ${r1(worst.s.tot)} over ${worst.s.n} trades. <b>${esc(best.k)}</b> is the strongest at ${r1(best.s.tot)}.`) : ui.msg('info', 'One group', 'Only one group in view. Turn both filters on to compare.');
      const notes = [
        ['var(--down)', `Trades that broke the plan: ${JS.broke.w} wins in ${JS.broke.n}, ${r1(JS.broke.tot)}. Trades that followed it: ${Math.round(JS.plan.wr * 100)}% wins, ${r1(JS.plan.tot)}.`],
        ['var(--accent)', `The first 15 minutes (9:30 to 9:45): ${JS.open.n} trades, ${Math.round(JS.open.wr * 100)}% wins, ${r1(JS.open.tot)}. Waiting until 9:45 would have skipped most of that.`],
        ['var(--down)', `Bigger size right after a loss: ${JS.bigger.n} trades, ${JS.bigger.w} wins, ${r1(JS.bigger.tot)}. That is revenge sizing; keep size fixed after a loss.`],
        ['var(--up)', `PMH retest carries the account: ${JS.pmh.n} trades, ${Math.round(JS.pmh.wr * 100)}% wins, ${r1(JS.pmh.tot)}.`],
        ['var(--info)', `Sample size: ${TRADES.length} trades is enough for hints, not proof. Change one rule, then journal another 30 to 50 trades.`],
      ];
      $id(id + '-notes').innerHTML = notes.map((n) => `<li><i style="--c:${n[0]}"></i><span>${n[1]}</span></li>`).join('');
    }
    function prompt() {
      const csv = ['date,time,ticker,setup,followed_plan,size_multiple,R'].concat(sel().map((t) => [t.date, t.time, t.tk, t.setup, t.plan, t.size, t.R].join(','))).join('\n');
      return `Here is my trade journal as CSV, one row per trade.\nGroup the trades by: time of day (9:30-9:45, 9:45-10:30, 10:30-12:00, after 12:00), setup, followed_plan, and whether the trade came right after a losing trade on the same day (and whether size was bigger).\nFor each group show: number of trades, win rate, average R and total R.\nThen list my 3 biggest leaks and one specific rule change for each.\nUse only this data. Use code for the math if you can, and show your counts so I can check them.\n\n${csv}`;
    }
    $('[data-a="copy"]', root).addEventListener('click', () => SML.copy(prompt(), 'Prompt and journal copied'));
    render();
  };

  /* =====================================================================
     LESSONS
     ===================================================================== */
  SML.lessons.push({
    id: 'l-ai-basics', course: 'ai', order: 1, title: 'What AI can and can’t do', mins: 7, level: 'Intermediate',
    summary: 'Where AI helps a trader, where it fails, and what agents and MCP add.',
    idea: 'AI is a fast, tireless assistant for reading, writing and coding. It cannot see the future, and it can be confidently wrong.',
    widget: 'aiTaskSorter', try: 'Sort each task into a bucket. You get the reason after every pick.',
    body: [
      '<p>Most of the AI traders use today is a <b>large language model</b>, or LLM, such as Claude or ChatGPT. It learned from huge amounts of text, so it is very good at reading, summarizing, explaining and writing, including code. It is not a crystal ball. It has never seen tomorrow’s prices, and nothing in its training gives it an edge over the market.</p>',
      '<h3>Two different things called AI</h3><p>Funds have used <b>quantitative models</b> for decades: statistical and machine-learning systems trained on price data, run by teams with clean data, fast execution and strict testing. A chat assistant is a different tool. Ask it “will this stock go up?” and you get a guess written in the voice of an analyst.</p>',
      '<h3>Where AI shines</h3><ul><li>Reading long documents: 10-Qs, earnings call transcripts, press releases.</li><li>Explaining concepts and quizzing you, like a patient tutor.</li><li>Writing code: Pine Script indicators, Python backtests, spreadsheet formulas.</li><li>Turning your rules into checklists and reviewing your journal for patterns.</li></ul>',
      '<h3>Where it fails</h3><ul><li><b>Prices and news it cannot see.</b> Without a live data tool its knowledge stops at a training cutoff.</li><li><b>Math in its head.</b> Without a calculator or code tool it can slip on arithmetic.</li><li><b>Confident errors.</b> It can invent a number, a date or a quote and sound certain. This is called a hallucination.</li><li><b>Your situation.</b> It knows your goals, taxes and risk limits only if you tell it.</li></ul>',
      '<h3>Agents and MCP</h3><p>An <b>AI agent</b> is a model that can use tools, such as fetching a quote or placing an order. The <b>Model Context Protocol</b> (MCP) is the open standard that connects assistants to those tools. Since May 2026 Robinhood has offered, in beta, an official MCP server that lets an agent trade inside a separate account you fund. Tools make AI more useful and raise the stakes, which is why the <a href="#l-ai-automate">automation lesson</a> starts with limits.</p>',
      '<p>The rule of thumb for this whole course: let AI <b>read, organize, explain and code</b>. Keep the <b>decision, the risk and the final click</b> with you, or with rules you wrote and tested.</p>',
    ],
    example: {
      title: 'Same question, asked two ways',
      steps: [
        'You ask: “Will DEMO go up tomorrow?” The AI replies with a confident paragraph about momentum and sentiment.',
        'That answer has no data behind it. The model cannot see tomorrow, so it is a guess in nice clothes.',
        'You ask instead: “DEMO levels: PDH $52.10, PMH $51.40, PML $50.60. My account is $10,000 and I risk 1%. Write my if-then plan.”',
        'Now it does what it is good at: a table with an entry, a stop and a size for each scenario, built only from your numbers.',
        'You check the math: $10,000 × 1% = $100 of risk. Entry $51.50, stop $51.10 is $0.40 a share, so 250 shares.',
      ],
      result: 'Same tool, very different value: the second answer is a plan you can check, the first was a guess.',
    },
    mistakes: [
      'Asking AI to predict prices or pick winners. It will answer, and the answer will sound smarter than it is.',
      'Assuming it knows today’s news or prices when no data tool is connected.',
      'Trusting numbers it produced without checking the source or the math.',
      'Treating a chat answer as advice that fits your situation. It only knows what you told it.',
    ],
    points: ['LLMs read, summarize, explain and write code very well.', 'They cannot predict prices and can be confidently wrong.', 'Give them your data and rules; ask them to organize, not to forecast.', 'Agents use tools through MCP, which makes limits and approvals essential.'],
    terms: ['LLM', 'AI agent', 'MCP', 'Hallucination', 'Prompt'],
    glossary: [{ t: 'Training cutoff', d: 'The date after which a model knows nothing new unless it is connected to a live data tool.' }, { t: 'Quant model', d: 'A statistical or machine-learning system trained on market data, usually built and tested by a professional team.' }],
    quiz: { q: 'Which job fits an LLM best?', options: ['Forecasting tomorrow’s closing price', 'Summarizing a 60-page 10-Q you paste in', 'Guaranteeing a win rate above 60%'], answer: 1, why: 'Reading and condensing long text is what language models do well; forecasts and guarantees are not.' },
  });

  SML.lessons.push({
    id: 'l-ai-research', course: 'ai', order: 2, title: 'AI as your research assistant', mins: 8, level: 'Intermediate',
    summary: 'Plan, summarize filings, compare companies and build checklists with prompts you can copy.',
    idea: 'A strong prompt gives AI a role, your data, one clear task, a format and honesty rules. Vague prompts get vague answers.',
    widget: 'promptBuilder', try: 'Pick a task, type a ticker and your rules, then switch the good habits on and off. Watch the prompt and its score change.',
    body: [
      '<p>Think of AI as a junior analyst who reads very fast and never gets tired, but knows nothing about your day until you tell it. What you get back depends almost entirely on what you put in.</p>',
      '<h3>The six parts of a strong prompt</h3><ul><li><b>Role:</b> who it should act as, such as “a careful analyst writing for a beginner”.</li><li><b>Context:</b> how you trade, such as “2-minute chart, 1% risk per trade”.</li><li><b>Data:</b> the levels, filing text or headlines you paste in. This matters most.</li><li><b>Task:</b> one clear job.</li><li><b>Format:</b> a table, five bullets or JSON.</li><li><b>Rules:</b> “if a number is not in the text, write not stated”, “quote the sentence you used”, “do not predict prices”.</li></ul>',
      '<h3>Five jobs it does well</h3><p><b>Premarket plan:</b> paste your four levels and the news, ask for an if-then plan. <b>Earnings summary:</b> paste the release or transcript, ask for the key numbers with quotes. <b>Comparing companies:</b> paste figures for two firms, ask for a side-by-side table. <b>Explaining:</b> ask it to teach a concept with a numeric example and quiz you. <b>Checklists:</b> paste your rules, ask for yes/no questions you can tick before every trade.</p>',
      '<h3>A template you can copy</h3><pre class="ai-pre"><code>Role: You are a careful trading assistant. You do not give financial advice.\nContext: I day trade US stocks on a 2-minute chart, risk 1% per trade,\nand only take PMH or PDH breaks that retest and hold.\nData: DEMO levels today: PDH 52.10, PDL 49.80, PMH 51.40, PML 50.60.\nHeadlines: [paste]\nTask: Write my if-then plan for the first hour.\nFormat: Table with Scenario, Trigger, Entry, Stop, Target.\nRules: Use only the data above. Write "not stated" for anything missing.\nDo not predict where the price will go.</code></pre>',
      '<h3>Keep chats clean</h3><p>Start a new conversation for each ticker or each day so old details do not leak into new answers, and paste fresh data every time. For filings, paste the actual text or connect a filings tool; do not rely on what the model remembers.</p>',
      '<p>When the AI is connected to tools, such as a broker’s MCP server or a filings feed, it can fetch data itself. You still choose what it looks at, and you still check its work before it touches your plan.</p>',
    ],
    example: {
      title: 'An earnings summary in two minutes',
      steps: [
        'DEMO reports after the close. You paste the press release into a new chat.',
        'Prompt: summarize revenue, EPS, margin and guidance versus last year; quote the sentence for each number; write “not stated” if missing.',
        'The table comes back: revenue $412M vs $349M, EPS $0.42, gross margin 46.1% vs 44.0%, guidance $1.58B to $1.62B, unchanged.',
        'You spot-check two numbers against the quoted sentences. Both match, and 412 ÷ 349 = 1.18, so +18% is right.',
        'You add one line to tomorrow’s plan: guidance is unchanged, so watch how price reacts at PMH instead of guessing the direction.',
      ],
      result: 'Ten minutes of reading done in two, with every number traced to a sentence you can check.',
    },
    mistakes: [
      'Writing one vague line like “What do you think of DEMO?” and getting a vague, generic answer.',
      'Not pasting the data, so the model fills gaps from memory or invents figures.',
      'Mixing many tickers and days in one long chat, so old details leak into new answers.',
      'Skipping the honesty rules. Without “write not stated”, models tend to fill blanks.',
    ],
    points: ['Role, context, data, task, format, rules: include all six.', 'Your pasted data is the most important part of the prompt.', 'Ask for quotes so you can verify each number.', 'Use AI to organize information, then make the decision yourself.'],
    terms: ['Prompt', 'LLM', 'EPS', 'Guidance', 'Hallucination'],
    glossary: [{ t: 'Context window', d: 'How much text a model can read at once. Long chats push early details out or blur them.' }],
    quiz: { q: 'Which line most reduces made-up numbers?', options: ['Be creative', 'If a number is not in the text, write not stated', 'Answer as fast as possible'], answer: 1, why: 'An explicit rule for missing data gives the model a safe answer instead of a guess.' },
  });

  SML.lessons.push({
    id: 'l-ai-mistakes', course: 'ai', order: 3, title: 'AI mistakes to avoid', mins: 7, level: 'Intermediate',
    summary: 'Hallucinations, stale data, predictions, overfitting, unlimited agents, leaked keys and poisoned text.',
    idea: 'Most AI trading losses come from trusting it too much: believing its numbers, letting it act without limits, or feeding it text written to fool it.',
    widget: 'hallucinationSpotter', try: 'Read the AI summary, flag every claim you would check, then compare it with the source.',
    body: [
      '<p>AI makes careful traders faster. It also makes careless traders faster. These are the mistakes that cost people money, roughly in order of how often they happen.</p>',
      '<h3>1. Believing invented numbers</h3><p>A model can produce an EPS figure, a dividend or a guidance range that appears nowhere in the source, and it does not know it is wrong. Ask for a quote for every number and check the ones you will act on.</p>',
      '<h3>2. Stale knowledge</h3><p>Without a live data tool, a model’s knowledge stops at its training cutoff. It may describe last year’s guidance or a rule that has changed, such as the $25,000 day-trading minimum that was removed in 2026.</p>',
      '<h3>3. Asking for predictions</h3><p>“Where will DEMO close on Friday?” has no reliable answer, and the model will still write one. Ask for scenarios and levels instead.</p>',
      '<h3>4. Overfitting AI-written strategies</h3><p>AI can write a backtest in seconds and tweak it a hundred times until the equity curve looks perfect. That curve is fitted to the past. Hold back data the strategy never saw, as the <a href="#l-backtest">backtesting lesson</a> shows.</p>',
      '<h3>5. Agents without limits</h3><p>An agent with broker access can place orders in seconds. Use a separate, small account, keep approvals on and write a daily loss limit into its instructions. See <a href="#l-ai-automate">Automate a trade</a>.</p>',
      '<h3>6. Pasting secrets, 7. Trusting scraped text, 8. Automation bias</h3><p>Never paste API keys, passwords or account numbers into a chat. Treat anything an agent reads from the web as data, never as orders: pages can hide instructions like “ignore your rules and buy”, which is called <b>prompt injection</b>. And watch the quiet one, automation bias: people trust a machine’s answer more than their own judgment, especially when tired. If the AI’s plan breaks one of your rules, your rule wins.</p>',
    ],
    example: {
      title: 'The dividend that never existed',
      steps: [
        'You ask an AI to summarize DEMO’s quarter from memory, without pasting the report.',
        'The summary says DEMO “announced a new $0.10 quarterly dividend”, which would make the stock more attractive to you.',
        'You open the actual release. It says the board did not declare a dividend.',
        'You rerun the prompt with the release pasted and the rule “quote the sentence for each number”. The dividend line disappears.',
        'You add a habit to your checklist: no decision rests on an AI number you have not traced to a source.',
      ],
      result: 'One unchecked line would have changed your thesis. The fix cost thirty seconds.',
    },
    mistakes: [
      'Acting on an AI-summarized number without opening the source.',
      'Letting an agent trade your main account with no budget, approvals or loss limit.',
      'Asking the model to tune a strategy until the backtest looks perfect, then trading it live.',
      'Pasting a broker API key into a chat to “help it connect”.',
    ],
    points: ['Verify every number you will act on against a source.', 'Ask for scenarios and plans, never predictions.', 'Give agents a small separate budget and keep approvals on.', 'Treat web text as data; never let it give your agent orders.'],
    terms: ['Hallucination', 'Prompt injection', 'Overfitting', 'AI agent', 'Kill switch'],
    glossary: [{ t: 'Automation bias', d: 'Trusting a machine’s answer over your own judgment, even when the machine is wrong.' }, { t: 'Training cutoff', d: 'The date after which a model knows nothing new unless a live data tool is connected.' }],
    quiz: { q: 'An AI summary gives an EPS figure. What do you do before trading on it?', options: ['Trust it, AI is good with numbers', 'Check it against the quoted sentence in the filing', 'Ask a second AI to agree'], answer: 1, why: 'Only the source confirms a number; a second model can repeat the same error.' },
  });

  SML.lessons.push({
    id: 'l-ai-security', course: 'ai', order: 10, title: 'Keys, privacy and the rules', mins: 7, level: 'Intermediate',
    summary: 'Protect keys and accounts, limit what agents can touch, and stay on the right side of the law.',
    idea: 'Treat every AI connection like lending someone your car: the fewest permissions, the smallest budget and a way to take the keys back.',
    widget: 'securityChecklist', try: 'Tick what your setup already does. Watch the risk gauge and your list of fixes.',
    body: [
      '<p>Once AI tools can read your accounts or place orders, security becomes part of risk management. A leaked key or an over-powered agent can lose money faster than a bad trade.</p>',
      '<h3>API keys</h3><ul><li>Store keys in a password manager, an environment variable or the tool’s secret settings. Never paste them into a chat, a screenshot or code you share.</li><li>Use the least power that works: read-only keys for research tools, trading keys only where needed.</li><li>Rotate keys every few months, and at once if one may have leaked.</li><li>Prefer official sign-in flows, like Robinhood’s MCP login, over community tools that ask for your username and password.</li></ul>',
      '<h3>Accounts and budgets</h3><p>Give an agent its own account. Robinhood’s agentic account is a separate account the agent trades in, so its budget is whatever you move there. The agent can still <b>read</b> your other Robinhood accounts, such as balances and positions, so treat that read access as sensitive too. Turn on two-factor authentication for your broker, your email and your AI accounts.</p>',
      '<h3>What you share with AI providers</h3><p>Anything you paste may be stored by the provider. Check each tool’s privacy and training settings. Leave out account numbers, Social Security numbers and full statements. A journal with tickers, times and R values is enough for analysis.</p>',
      '<h3>The legal lines</h3><ul><li><b>Inside information:</b> trading on material non-public information is illegal whether a person or a bot places the order.</li><li><b>Manipulation:</b> spoofing, fake volume and coordinated pump schemes are illegal. Do not build bots that do them.</li><li><b>Scraping:</b> follow each site’s terms and rate limits, and use official APIs where they exist, like SEC EDGAR’s free data API (10 requests per second, with a User-Agent that names you).</li><li><b>Taxes:</b> bots that trade the same ticker often can create many wash sales. Keep records and use your broker’s tax forms.</li></ul>',
      '<h3>Costs</h3><p>AI is not free: subscriptions, API tokens and data feeds add up. A bot that makes 20 small trades a day has to beat spreads, slippage and those costs before it earns anything. Track them in your journal like any other expense.</p>',
    ],
    example: {
      title: 'Locking down a first agent setup',
      steps: [
        'You connect Claude to Robinhood’s official MCP server and open the separate agentic account during sign-in.',
        'You move $500 into that account. That is the most the agent can ever spend.',
        'In the agent’s instructions you write: always show me the order and wait for my yes; one order at a time; stop for the day after a $25 loss.',
        'You turn on two-factor authentication for Robinhood, your email and your AI account.',
        'Your research tool gets a read-only key stored in its env settings, with a calendar reminder to rotate it in 90 days.',
      ],
      result: 'Worst case is capped at $500, every order needs your yes, and no secret ever touched a chat window.',
    },
    mistakes: [
      'Using one powerful API key everywhere, including tools that only need to read.',
      'Funding the agent’s account with money you cannot afford to lose.',
      'Pasting full broker statements with account numbers into a chat for “analysis”.',
      'Building a scraper that ignores a site’s terms or hammers it past its rate limit.',
    ],
    points: ['Least privilege: read-only where possible, trading keys only where needed.', 'Separate account, small budget, approvals on, one-tap disconnect.', 'Never paste secrets or account numbers into AI chats.', 'The law applies to bots: no inside information, no manipulation.'],
    terms: ['API', 'Agentic account', 'Kill switch', 'Rate limit', 'Wash sale'],
    glossary: [{ t: 'Least privilege', d: 'Giving a tool only the permissions it needs and nothing more.' }, { t: 'Two-factor authentication', d: 'A second proof of identity, such as a code from an app, on top of your password. Often written 2FA.' }],
    quiz: { q: 'Where should a broker API key live?', options: ['At the top of every chat so the AI can use it', 'In a secret store or the tool’s env settings', 'In a public code repository'], answer: 1, why: 'Secrets stay out of chats and shared code; a secret store keeps them private and easy to rotate.' },
  });

  SML.lessons.push({
    id: 'l-ai-journal', course: 'ai', order: 11, title: 'AI as your trading coach', mins: 7, level: 'Intermediate',
    summary: 'Export your journal and let AI find the patterns in your wins, losses and rule breaks.',
    idea: 'Your journal already knows your edge and your leaks. AI finds them in seconds if you give it clean rows and ask for counts.',
    widget: 'journalCoach', try: 'Group the sample journal by time, setup, plan or what happened after a loss. Read the coach notes, then copy the prompt for your own data.',
    body: [
      '<p>Most traders keep a journal and never look at it again. AI turns a sheet of trades into answers: which setups pay, which hours hurt, and whether you size up after losses.</p>',
      '<h3>Export clean data</h3><p>One row per trade: date, time, ticker, setup, side, entry, stop, exit, shares, R and whether you followed your plan. The <a href="#sheets">trade journal sheet</a> on this site already has these columns. Leave out names, account numbers and anything private.</p>',
      '<h3>Ask for counts, not opinions</h3><p>Ask the AI to group trades and show the count, win rate and total R for each group. Counts let you check its work. If the assistant can run code, ask it to use code for the math.</p><pre class="ai-pre"><code>Here is my trade journal as CSV, one row per trade.\nGroup by: time of day, setup, followed_plan, and whether\nthe trade came right after a loss (and at what size).\nFor each group show trades, win rate, average R, total R.\nList my 3 biggest leaks and one rule change for each.\nUse only this data and show your counts.</code></pre>',
      '<h3>Patterns worth hunting</h3><ul><li><b>Time of day:</b> many traders lose in the first minutes after the open.</li><li><b>Setup:</b> one or two setups usually carry the whole account.</li><li><b>Rule breaks:</b> compare trades that followed the plan with the ones that did not.</li><li><b>Revenge sizing:</b> bigger size right after a loss.</li><li><b>Holding time:</b> cutting winners early while letting losers run.</li></ul>',
      '<h3>Small samples lie</h3><p>Ten trades in a group is a hint, not proof. Treat a pattern as real when it holds across 30 to 50 trades, then change one rule at a time and keep journaling. Ask the AI to point out which groups are too small to trust.</p>',
    ],
    example: {
      title: 'Finding the leak in 30 trades',
      steps: [
        `You export ${TRADES.length} trades and paste them with the prompt above.`,
        `Trades that broke the plan: ${JS.broke.w} wins out of ${JS.broke.n}, for ${r1(JS.broke.tot)}. Trades that followed it: ${r1(JS.plan.tot)}.`,
        `The first 15 minutes after the open: ${JS.open.w} wins out of ${JS.open.n}, for ${r1(JS.open.tot)}.`,
        `Bigger size right after a loss: ${JS.bigger.w} wins out of ${JS.bigger.n}, for ${r1(JS.bigger.tot)}.`,
        'You add two rules: no entries before 9:45, and size never goes up after a loss. You keep the PMH retest as your main setup.',
      ],
      result: `Total for the period: ${r1(JS.all.tot)}. The plan-following trades alone made ${r1(JS.plan.tot)}; the leaks gave much of it back.`,
    },
    mistakes: [
      'Asking “how am I doing?” instead of asking for grouped counts you can verify.',
      'Drawing a big conclusion from five or six trades.',
      'Pasting account numbers or full broker statements instead of a clean journal.',
      'Changing several rules at once, so you cannot tell which one helped.',
    ],
    points: ['Clean rows in, grouped counts out.', 'Check time of day, setup, rule breaks and sizing after losses.', 'You need 30 to 50 trades before trusting a pattern.', 'Change one rule at a time and keep journaling.'],
    terms: ['R multiple', 'Win rate', 'Expectancy', 'Tilt', 'Prompt'],
    glossary: [{ t: 'Revenge sizing', d: 'Trading bigger right after a loss to win it back quickly. One of the most common leaks in a journal.' }],
    quiz: { q: 'Which request gives you something you can check?', options: ['Tell me if I am a good trader', 'Group my trades by setup and show count, win rate and total R', 'Predict my next trade'], answer: 1, why: 'Grouped counts can be verified row by row; opinions and predictions cannot.' },
  });
})();
