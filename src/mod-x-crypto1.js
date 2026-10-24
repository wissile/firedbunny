/* Stock Market Lessons: Crypto & Blockchain, part 1 (how a blockchain works, the main kinds of coins, custody). Course `crypto`. */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $id = (x) => document.getElementById(x);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sv = (x, txt, cls) => { const e = $id(x); if (!e) return; e.textContent = txt; e.className = 'stat-v' + (cls ? ' ' + cls : ''); };
  const msg = (x, pill, pt, html) => { const e = $id(x); if (e) e.innerHTML = ui.msg(pill, pt, html); };

  /* ---------------- SHA-256 (synchronous, tested against FIPS vectors) ---------------- */
  const KC = (() => {
    const k = [], h = []; let n = 0, c = 2;
    const isP = (x) => { for (let i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; };
    while (n < 64) { if (isP(c)) { if (n < 8) h.push((Math.pow(c, 1 / 2) * 4294967296) | 0); k.push((Math.pow(c, 1 / 3) * 4294967296) | 0); n++; } c++; }
    return { K: new Int32Array(k), H: h };
  })();
  const WB = new Int32Array(64);
  function sha256(str) {
    const s = unescape(encodeURIComponent(str)); const l = s.length; const len = ((l + 9 + 63) >> 6) << 6; const b = new Uint8Array(len);
    for (let i = 0; i < l; i++) b[i] = s.charCodeAt(i);
    b[l] = 0x80; const bits = l * 8; b[len - 4] = bits >>> 24; b[len - 3] = (bits >>> 16) & 255; b[len - 2] = (bits >>> 8) & 255; b[len - 1] = bits & 255;
    let h0 = KC.H[0], h1 = KC.H[1], h2 = KC.H[2], h3 = KC.H[3], h4 = KC.H[4], h5 = KC.H[5], h6 = KC.H[6], h7 = KC.H[7]; const K = KC.K, W = WB;
    for (let o = 0; o < len; o += 64) {
      for (let t = 0; t < 16; t++) W[t] = (b[o + 4 * t] << 24) | (b[o + 4 * t + 1] << 16) | (b[o + 4 * t + 2] << 8) | b[o + 4 * t + 3];
      for (let t = 16; t < 64; t++) { const x = W[t - 15], y = W[t - 2]; const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3); const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10); W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0; }
      let a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)); const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + W[t]) | 0; const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const mj = (a & bb) ^ (a & c) ^ (bb & c); const t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + bb) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }
  SML.sha256 = SML.sha256 || sha256;

  /* chance an attacker with share q of hash power ever catches up from z blocks behind (Bitcoin whitepaper, section 11) */
  function catchUp(q, z) {
    const p = 1 - q; if (q >= p) return 1;
    const lam = z * (q / p); let sum = 1;
    for (let k = 0; k <= z; k++) { let poi = Math.exp(-lam); for (let i = 1; i <= k; i++) poi *= lam / i; sum -= poi * (1 - Math.pow(q / p, z - k)); }
    return Math.max(0, Math.min(1, sum));
  }

  SML.css(`
.kc1-chain{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:stretch}
.kc1-chain.wide{grid-template-columns:minmax(0,1fr) 18px minmax(0,1fr) 18px minmax(0,1fr) 18px minmax(0,1fr);gap:0}
.kc1-blk{background:var(--surface);border:1px solid var(--input);border-radius:8px;padding:10px 11px;display:flex;flex-direction:column;gap:7px;min-width:0;position:relative;transition:border-color .2s,box-shadow .2s}
.kc1-blk.ok{box-shadow:inset 0 3px 0 var(--up)}
.kc1-blk.bad{border-color:color-mix(in srgb,var(--down) 70%,transparent);box-shadow:inset 0 3px 0 var(--down);background:color-mix(in srgb,var(--down) 7%,var(--surface))}
.kc1-blk.pend{border-style:dashed;box-shadow:inset 0 3px 0 var(--accent)}
.kc1-blk header{display:flex;align-items:center;justify-content:space-between;gap:8px}
.kc1-blk header b{font:600 11px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink)}
.kc1-blk label{display:flex;flex-direction:column;gap:4px}
.kc1-blk label span,.kc1-k{font:500 9.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.kc1-blk input{width:100%;min-width:0;background:var(--bg);border:1px solid var(--line);border-radius:4px;color:var(--ink);font:500 13px/1.3 var(--sans);padding:6px 7px}
.kc1-blk input:focus{outline:2px solid var(--accent);outline-offset:-1px}
.kc1-kv{display:grid;grid-template-columns:44px minmax(0,1fr) 14px;gap:6px;align-items:center}
.kc1-kv code{font:500 12px/1.2 var(--mono);color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:none;border:0;padding:0}
.kc1-kv code b{color:var(--up);font-weight:700}
.kc1-blk.bad .kc1-kv code b{color:var(--down)}
.kc1-kv i{font-style:normal;font:700 12px var(--mono);text-align:center}
.kc1-kv i.y{color:var(--up)} .kc1-kv i.n{color:var(--down)}
.kc1-lnk{display:flex;align-items:center;justify-content:center;font:700 13px var(--mono);color:var(--up)}
.kc1-lnk.bad{color:var(--down)}
.kc1-chain:not(.wide) .kc1-lnk{height:16px}
.kc1-chain:not(.wide) .kc1-lnk::before{content:'↓ links'}
.kc1-chain.wide .kc1-lnk::before{content:'→'}
.kc1-chain:not(.wide) .kc1-lnk.bad::before{content:'✕ link broken'}
.kc1-chain.wide .kc1-lnk.bad::before{content:'✕'}
.kc1-row{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:flex-end}
.kc1-row .grow{flex:1 1 220px;min-width:0}
.kc1-row .fld{flex:1 1 220px;min-width:0}
.kc1-row .fld input{width:100%}
.kc1-btns{display:flex;flex-wrap:wrap;gap:8px}
.kc1-mini{font:500 11px var(--mono);color:var(--muted)}
.kc1-tbl{width:100%;border-collapse:collapse;font-size:13.5px}
.kc1-tbl th,.kc1-tbl td{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.kc1-tbl th{font:500 10px/1.3 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:500}
.kc1-tbl td:first-child{color:var(--ink);font-weight:600}
.kc1-cards{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
@media(min-width:620px){.kc1-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
.kc1-card{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;text-align:left;cursor:pointer;color:inherit;font:inherit;transition:border-color .15s,background-color .15s}
.kc1-card:hover{border-color:var(--input)}
.kc1-card.on{border-color:var(--accent);background:var(--surface-2)}
.kc1-card h4{font-size:15px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:8px}
.kc1-card h4 i{width:10px;height:10px;border-radius:2px;display:inline-block;flex:0 0 10px}
.kc1-card p{font-size:13.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.kc1-card dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 10px;font-size:12.5px;line-height:1.4}
.kc1-card dt{font:500 10px/1.5 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.kc1-card dd{color:var(--text)}
.kc1-q{display:flex;flex-direction:column;gap:12px}
.kc1-q .qi{display:flex;flex-direction:column;gap:6px}
.kc1-q .qi > span{font-size:14px;color:var(--ink);font-weight:600}
.kc1-rank{list-style:none;display:flex;flex-direction:column;gap:8px}
.kc1-rank li{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:10px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.kc1-rank li.top{border-color:var(--accent);box-shadow:inset 3px 0 0 var(--accent)}
.kc1-rank .n{font-family:var(--display);font-size:28px;line-height:.9;color:var(--muted)}
.kc1-rank li.top .n{color:var(--accent)}
.kc1-rank b{display:block;color:var(--ink);font-weight:600;font-size:14.5px}
.kc1-rank small{display:block;color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:2px}
.kc1-rank .sc{font:600 12px var(--mono);color:var(--muted);white-space:nowrap}
.kc1-dots{display:inline-flex;gap:3px;vertical-align:middle}
.kc1-dots i{width:9px;height:9px;border-radius:50%;background:var(--line)}
.kc1-dots i.g{background:var(--up)} .kc1-dots i.a{background:var(--accent)} .kc1-dots i.r{background:var(--down)}
.kc1-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:500 11px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.kc1-legend span{display:inline-flex;align-items:center;gap:6px}
.kc1-scroll{overflow-x:auto;max-width:100%}
.kc1-safe{list-style:none;display:grid;gap:8px;grid-template-columns:minmax(0,1fr)}
@media(min-width:620px){.kc1-safe{grid-template-columns:repeat(2,minmax(0,1fr))}}
.kc1-safe li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;font-size:13.5px;line-height:1.5;color:color-mix(in srgb,var(--ink) 88%,transparent)}
.kc1-safe li::before{content:'✓';font:700 13px var(--mono);color:var(--up)}
.kc1-safe li.no::before{content:'✕';color:var(--down)}
`);

  /* =====================================================================
     1) blockChainDemo: proof of work chain you can mine and tamper with; proof of stake slot simulator
     ===================================================================== */
  const TXS = ['Dev pays Eve 0.05 BTC', 'Eve pays Finn 0.02 BTC', 'Finn pays Gia 0.01 BTC', 'Gia pays Hal 0.3 BTC', 'Hal pays Ana 0.12 BTC', 'Ana pays Ben 0.07 BTC'];
  SML.widgets.blockChainDemo = function (root) {
    const id = SML.uid('kbc');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">A blockchain you can break</span><span class="grow"></span>${ui.seg(id + '-mode', [{ v: 'pow', label: 'Proof of work' }, { v: 'pos', label: 'Proof of stake' }], 'pow', 'Consensus')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl" id="${id}-ctl"></div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = $id(id + '-fig'), ctl = $id(id + '-ctl'), read = $id(id + '-read'), note = $id(id + '-note');
    let mode = 'pow', dead = false, raf = 0;
    SML.onCleanup(() => { dead = true; if (raf) cancelAnimationFrame(raf); });

    /* ---------- proof of work state ---------- */
    let diff = 2;
    const blockStr = (b) => `${b.i}|${b.prev}|${b.data}|${b.nonce}`;
    const meets = (h, d) => h.slice(0, d) === '0'.repeat(d);
    function mineSync(b, cap) { let n = 0; for (;;) { b.hash = sha256(blockStr(b)); n++; if (meets(b.hash, b.diff)) return n; b.nonce++; if (cap && n >= cap) return -n; } }
    let chain = [], pend = null, tries = 0, ms = 0, lastEvent = 'start', tampered = -1, remined = 0, remineTries = 0, txi = 0;
    function newPending() { const last = chain[chain.length - 1]; pend = { i: last.i + 1, prev: last.hash, data: TXS[txi % TXS.length], nonce: 0, diff, hash: '' }; txi++; pend.hash = sha256(blockStr(pend)); }
    function resetPow() {
      chain = []; let prev = '0'.repeat(64);
      ['Genesis block', 'Ana pays Ben 0.5 BTC', 'Ben pays Cara 0.2 BTC', 'Cara pays Dev 0.1 BTC'].forEach((d, i) => { const b = { i, prev, data: d, nonce: 0, diff: 2, hash: '' }; mineSync(b); chain.push(b); prev = b.hash; });
      txi = 0; diff = 2; newPending(); tries = 0; ms = 0; lastEvent = 'start'; tampered = -1; remined = 0; remineTries = 0;
    }
    /* recompute current hashes from current data, find first broken block */
    function status() {
      const st = chain.map((b) => ({ h: sha256(blockStr(b)) }));
      let broken = -1;
      chain.forEach((b, k) => { const okSelf = meets(st[k].h, b.diff); const okLink = k === 0 ? true : b.prev === st[k - 1].h; st[k].okSelf = okSelf; st[k].okLink = okLink; if ((!okSelf || !okLink) && broken < 0) broken = k; });
      chain.forEach((b, k) => { st[k].ok = broken < 0 || k < broken; });
      const last = st[st.length - 1];
      return { st, broken, pendLink: pend.prev === last.h };
    }
    const hashHTML = (h, d, ok) => `<b>${esc(h.slice(0, Math.max(d, 0)))}</b>${esc(h.slice(Math.max(d, 0), 12))}…`;
    const lead = (h) => { let n = 0; while (n < h.length && h[n] === '0') n++; return n; };

    function drawPow() {
      const s = status(); const vis = chain.slice(-3); const off = chain.length - vis.length;
      let html = `<div class="kc1-chain${fig.clientWidth >= 700 ? ' wide' : ''}" id="${id}-chain">`;
      vis.forEach((b, j) => {
        const k = off + j, x = s.st[k];
        if (j > 0) html += `<div class="kc1-lnk${x.okLink ? '' : ' bad'}" aria-hidden="true"></div>`;
        html += `<article class="kc1-blk ${x.ok ? 'ok' : 'bad'}" aria-label="Block ${b.i}">
          <header><b>Block ${b.i}</b><span class="pill ${x.ok ? 'up' : 'dn'}">${x.ok ? 'valid' : 'broken'}</span></header>
          <label><span>Data${b.i === 0 ? '' : ' (edit me)'}</span><input type="text" data-k="${k}" value="${esc(b.data)}" maxlength="60" aria-label="Data in block ${b.i}"></label>
          <div class="kc1-kv"><span class="kc1-k">Prev</span><code title="${esc(b.prev)}">${esc(b.prev.slice(0, 12))}…</code><i class="${x.okLink ? 'y' : 'n'}">${x.okLink ? '✓' : '✕'}</i></div>
          <div class="kc1-kv"><span class="kc1-k">Nonce</span><code>${F.num(b.nonce)}</code><i></i></div>
          <div class="kc1-kv"><span class="kc1-k">Hash</span><code title="${esc(x.h)}">${hashHTML(x.h, Math.min(lead(x.h), 6), x.okSelf)}</code><i class="${x.okSelf ? 'y' : 'n'}">${x.okSelf ? '✓' : '✕'}</i></div>
        </article>`;
      });
      html += `<div class="kc1-lnk${s.pendLink ? '' : ' bad'}" aria-hidden="true"></div>
        <article class="kc1-blk pend" aria-label="New block ${pend.i}">
          <header><b>Block ${pend.i}</b><span class="pill acc" id="${id}-pp">${raf ? 'mining…' : 'not mined'}</span></header>
          <label><span>New transaction</span><input type="text" data-k="p" value="${esc(pend.data)}" maxlength="60" aria-label="New transaction"></label>
          <div class="kc1-kv"><span class="kc1-k">Prev</span><code title="${esc(pend.prev)}">${esc(pend.prev.slice(0, 12))}…</code><i class="${s.pendLink ? 'y' : 'n'}">${s.pendLink ? '✓' : '✕'}</i></div>
          <div class="kc1-kv"><span class="kc1-k">Nonce</span><code id="${id}-pn">${F.num(pend.nonce)}</code><i></i></div>
          <div class="kc1-kv"><span class="kc1-k">Hash</span><code id="${id}-ph">${hashHTML(pend.hash, Math.min(lead(pend.hash), 6))}</code><i></i></div>
        </article></div>`;
      fig.innerHTML = html;
      $$('input[data-k]', fig).forEach((inp) => {
        inp.addEventListener('input', () => {
          if (inp.dataset.k === 'p') { pend.data = inp.value; pend.hash = sha256(blockStr(pend)); const ph = $id(id + '-ph'); if (ph) ph.innerHTML = hashHTML(pend.hash, Math.min(lead(pend.hash), 6)); return; }
          const k = Number(inp.dataset.k); if (!chain[k] || k === 0) { inp.value = chain[k] ? chain[k].data : ''; return; }
          chain[k].data = inp.value; tampered = k; lastEvent = 'tamper'; refreshPow(inp);
        });
      });
      $$('input[data-k="0"]', fig).forEach((i) => { i.readOnly = true; i.title = 'The genesis block is fixed in this demo'; });
      readPow(s);
    }
    function refreshPow(focusEl) {
      const k = focusEl ? focusEl.dataset.k : null, pos = focusEl ? focusEl.selectionStart : 0;
      drawPow();
      if (k != null) { const el = fig.querySelector(`input[data-k="${k}"]`); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
    }
    function readPow(s) {
      s = s || status();
      const valid = s.broken < 0 ? chain.length : s.broken;
      sv(id + '-a', F.num(tries), tries ? 'acc' : '');
      sv(id + '-t', tries ? (ms < 1000 ? Math.max(1, Math.round(ms)) + ' ms' : (ms / 1000).toFixed(1) + ' s') : '—');
      sv(id + '-v', `${valid} / ${chain.length}`, s.broken < 0 ? 'up' : 'dn');
      sv(id + '-d', '1 in ' + F.num(Math.pow(16, diff)));
      const b = s.broken;
      if (lastEvent === 'tamper' && b >= 0) {
        const after = chain.length - 1 - b;
        msg(id + '-msg', 'dn', 'Tampered', `You changed block ${chain[b].i}. Its hash changed${s.st[b].okSelf ? '' : ' and no longer starts with enough zeros'}, so ${after ? `block ${chain[b].i + 1} no longer points to it and every block after it is broken too` : 'the new block no longer points to it'}. To hide the edit you must redo the work for ${after + 1} block${after ? 's' : ''}.`);
      } else if (lastEvent === 'tamper') {
        msg(id + '-msg', 'up', 'Back to valid', 'The data matches the original again, so every hash and link checks out. Any other change breaks the chain.');
      } else if (lastEvent === 'remine') {
        msg(id + '-msg', 'acc', 'Rewritten', `You re-mined ${remined} block${remined === 1 ? '' : 's'} with ${F.num(remineTries)} tries to hide one edit. On the real network everyone else keeps adding blocks while you work, so you would need more computing power than all of them together.`);
      } else if (lastEvent === 'mined') {
        msg(id + '-msg', 'up', 'Block found', `It took ${F.num(tries)} tries to find a nonce whose hash starts with ${diff} zero${diff === 1 ? '' : 's'}. Anyone can check it with one hash. Now edit the data in an older block and watch the chain break.`);
      } else {
        msg(id + '-msg', 'info', 'How it fits', 'Each block stores the previous block’s hash, its fingerprint. Mine the new block, then edit an older one.');
      }
      const rm = root.querySelector('[data-a="remine"]'); if (rm) rm.disabled = s.broken < 0 || !!raf;
      const mb = root.querySelector('[data-a="mine"]'); if (mb) { mb.disabled = !!raf || s.broken >= 0; mb.title = s.broken >= 0 ? 'Fix the broken chain first: miners only build on a valid chain' : ''; }
    }
    function mineAnim(blocks, done) {
      /* blocks: list of block objects to mine in order; each fixes its prev first */
      let qi = 0, n = 0; const t0 = performance.now(); tries = 0;
      const prep = () => { const b = blocks[qi]; const k = chain.indexOf(b); if (k > 0) b.prev = sha256(blockStr(chain[k - 1])); else if (k < 0) b.prev = sha256(blockStr(chain[chain.length - 1])); b.nonce = 0; };
      prep();
      const step = () => {
        if (dead || !root.isConnected) { raf = 0; return; }
        const t = performance.now(); let b = blocks[qi];
        while (performance.now() - t < 12) {
          for (let r = 0; r < 300; r++) {
            b.hash = sha256(blockStr(b)); n++;
            if (meets(b.hash, b.diff)) { qi++; if (qi >= blocks.length) { tries = n; ms = performance.now() - t0; raf = 0; done(n); return; } prep(); b = blocks[qi]; break; }
            b.nonce++;
          }
        }
        tries = n; const pn = $id(id + '-pn'), ph = $id(id + '-ph');
        if (b === pend && pn) { pn.textContent = F.num(pend.nonce); ph.innerHTML = hashHTML(pend.hash, Math.min(lead(pend.hash), 6)); }
        sv(id + '-a', F.num(n), 'acc');
        raf = requestAnimationFrame(step);
      };
      if (SML.reduced()) { const t0b = performance.now(); let tot = 0; blocks.forEach((b) => { const k = chain.indexOf(b); b.prev = k > 0 ? sha256(blockStr(chain[k - 1])) : k < 0 ? sha256(blockStr(chain[chain.length - 1])) : b.prev; b.nonce = 0; tot += mineSync(b); }); tries = tot; ms = performance.now() - t0b; done(tot); return; }
      raf = requestAnimationFrame(step);
      const pp = $id(id + '-pp'); if (pp) pp.textContent = 'mining…';
      readPow();
    }
    function ctlPow() {
      ctl.innerHTML = `<div class="kc1-row" style="grid-column:1/-1">
          <div class="grow" style="display:flex;flex-direction:column;gap:6px"><span class="ctl-lab">Difficulty: zeros the hash must start with</span>${ui.seg(id + '-diff', [1, 2, 3, 4].map((v) => ({ v, label: String(v) })), diff, 'Difficulty')}</div>
          <div class="kc1-btns"><button type="button" class="btn btn-p sm" data-a="mine">Mine block</button><button type="button" class="btn btn-g sm" data-a="remine">Re-mine broken blocks</button><button type="button" class="btn btn-g sm" data-a="reset">Reset</button></div>
        </div>`;
      read.innerHTML = ui.stat('Tries to mine', id + '-a', 'hl') + ui.stat('Time', id + '-t') + ui.stat('Valid blocks', id + '-v') + ui.stat('Chance per try', id + '-d');
      note.innerHTML = 'A real SHA-256 runs in your browser. Each try changes the nonce and hashes the block again. Real Bitcoin blocks need many more zeros, so the whole network shares the work. Edit any block’s data to tamper with it.';
    }
    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (mode === 'pos') { posAction(a); return; }
      if (raf) return;
      if (a === 'reset') { resetPow(); drawPow(); return; }
      if (a === 'mine') {
        const s = status(); if (s.broken >= 0) return;
        pend.diff = diff;
        mineAnim([pend], () => { chain.push(pend); newPending(); lastEvent = 'mined'; drawPow(); });
        return;
      }
      if (a === 'remine') {
        const s = status(); if (s.broken < 0) return;
        const list = chain.slice(Math.max(1, s.broken));
        remined = list.length;
        mineAnim(list, (n) => { remineTries = n; lastEvent = 'remine'; tampered = -1; pend.prev = chain[chain.length - 1].hash; pend.hash = sha256(blockStr(pend)); drawPow(); });
      }
    });
    ctl.addEventListener('click', (e) => {
      const sb = e.target.closest('.seg button'); if (!sb || mode !== 'pow' || raf) return;
      const g = sb.closest('.seg'); if (!g || g.id !== id + '-diff') return;
      $$('button', g).forEach((x) => { x.classList.toggle('on', x === sb); x.setAttribute('aria-pressed', x === sb); });
      diff = Number(sb.dataset.v); pend.diff = diff; readPow();
    });

    /* ---------- proof of stake state ---------- */
    const OTH = [['Pool A', 22], ['Pool B', 18], ['Pool C', 14], ['Pool D', 12], ['Pool E', 10], ['Pool F', 8], ['Pool G', 6]];
    let you = 10, cheat = false, slashed = false, slot = 0, mine = 0, hist = [], cur = -1, rng = SML.rng(7), slashSlot = -1;
    function shares() {
      const tot = OTH.reduce((s, o) => s + o[1], 0); const yv = slashed ? 0 : you; const rest = 100 - (slashed ? you : you);
      const arr = [{ n: 'You', s: yv, me: true }].concat(OTH.map((o) => ({ n: o[0], s: (o[1] / tot) * rest })));
      const sum = arr.reduce((a, x) => a + x.s, 0); arr.forEach((x) => { x.p = x.s / sum; });
      return arr;
    }
    function pick() { const arr = shares(); let r = rng(), k = 0; for (; k < arr.length - 1; k++) { r -= arr[k].p; if (r <= 0) break; } return k; }
    function runSlots(n) {
      for (let j = 0; j < n; j++) {
        slot++; const k = pick(); cur = k;
        if (k === 0) { if (cheat) { slashed = true; slashSlot = slot; hist.push('x'); break; } mine++; hist.push('y'); } else hist.push('o');
      }
      if (hist.length > 60) hist = hist.slice(-60);
    }
    function resetPos() { slot = 0; mine = 0; hist = []; cur = -1; slashed = false; slashSlot = -1; rng = SML.rng(7); }
    function ctlPos() {
      ctl.innerHTML = `${ui.slider({ id: id + '-you', label: 'Your share of all staked coins', min: 1, max: 70, step: 1, value: you, fmt: 'pct' })}
        <div style="display:flex;flex-direction:column;gap:8px"><span class="ctl-lab">How you behave</span>${ui.seg(id + '-beh', [{ v: 'honest', label: 'Follow the rules' }, { v: 'cheat', label: 'Sign two blocks' }], cheat ? 'cheat' : 'honest', 'Behaviour')}</div>
        <div class="kc1-btns" style="align-self:end"><button type="button" class="btn btn-p sm" data-a="slot">Next slot</button><button type="button" class="btn btn-g sm" data-a="run">Run 100 slots</button><button type="button" class="btn btn-g sm" data-a="reset">Reset</button></div>`;
      read.innerHTML = ui.stat('Slots run', id + '-s') + ui.stat('Picked you', id + '-m', 'hl') + ui.stat('Expected share', id + '-e') + ui.stat('Your status', id + '-st');
      note.innerHTML = 'Simplified model: one proposer per slot, picked at random in proportion to stake. Real networks also have committees that vote on each block. Pools here are made up.';
      const sl = $id(id + '-you');
      sl.addEventListener('input', () => { ui.setRange(sl); you = Number(sl.value); drawPos(); });
      $id(id + '-beh').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', $id(id + '-beh')).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); cheat = b.dataset.v === 'cheat'; drawPos(); });
    }
    function posAction(a) {
      if (a === 'reset') resetPos();
      else if (a === 'slot') { if (!slashed) runSlots(1); }
      else if (a === 'run') { if (!slashed) runSlots(100); }
      drawPos();
    }
    const drawPosFig = ui.responsive(fig, (W) => { if (mode === 'pos') posFig(W); });
    function posFig(W) {
      const narrow = W < 520, H = narrow ? 478 : 360;
      const arr = shares(); const cx = narrow ? W / 2 : Math.min(W * 0.42, 250), cy = narrow ? 150 : 160, R = narrow ? Math.min(W / 2 - 78, 104) : 118;
      let b = '';
      b += S.circle(cx, cy, R, 'nf s-line w1 dash2');
      const maxS = Math.max(...arr.map((x) => x.s), 1);
      arr.forEach((x, k) => {
        const a = -Math.PI / 2 + (k / arr.length) * Math.PI * 2; const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
        const r = narrow ? 6 + 14 * Math.sqrt(x.s / maxS) : 8 + 20 * Math.sqrt(x.s / maxS);
        const isCur = k === cur && slot > 0;
        const cls = x.me ? (slashed ? 'f-dn-t s-dn w2' : 'f-acc-t s-acc w2') : 'f-shade2 s-line w1';
        if (isCur) b += S.circle(px, py, r + 6, 'nf ' + (x.me ? (slashed ? 's-dn' : 's-acc') : 's-info') + ' w2');
        b += S.circle(px, py, r, cls);
        if (x.me && slashed) b += S.line(px - 7, py - 7, px + 7, py + 7, 's-dn w2') + S.line(px + 7, py - 7, px - 7, py + 7, 's-dn w2');
        const lx = px + (Math.cos(a) >= 0.2 ? r + 6 : Math.cos(a) <= -0.2 ? -r - 6 : 0), ly = py + (Math.abs(Math.cos(a)) < 0.2 ? (Math.sin(a) < 0 ? -r - 8 : r + 16) : 4);
        const anc = Math.cos(a) >= 0.2 ? 'start' : Math.cos(a) <= -0.2 ? 'end' : 'middle';
        b += S.text(lx, ly, `${esc(narrow && !x.me ? x.n.replace('Pool ', '') : x.n)} ${x.s.toFixed(0)}%`, (narrow ? 'xs ' : 'sm ') + (x.me ? (slashed ? 'dn b' : 'acc b') : 'ink'), anc);
      });
      /* center block */
      const prop = slot > 0 ? arr[cur] : null;
      const bw2 = narrow ? 80 : 92, bh2 = narrow ? 44 : 52;
      b += S.rect(cx - bw2 / 2, cy - bh2 / 2, bw2, bh2, slot > 0 && cur === 0 ? (slashed ? 'f-dn-t s-dn w15' : 'f-acc-t s-acc w15') : 'f-surf s-line w15', 6);
      b += S.text(cx, cy - (narrow ? 4 : 6), slot > 0 ? 'Slot ' + slot : 'Next slot', 'xs mono', 'middle');
      b += S.text(cx, cy + (narrow ? 11 : 12), prop ? (cur === 0 && slashed ? 'You cheated' : esc(narrow ? prop.n.replace('Pool ', 'Pool ') : prop.n) + (narrow ? '' : ' proposes')) : 'press Next', (narrow ? 'xs b ' : 'sm b ') + (prop && cur === 0 ? (slashed ? 'dn' : 'acc') : 'ink'), 'middle');
      if (prop) { const a = -Math.PI / 2 + (cur / arr.length) * Math.PI * 2; const px = cx + (R - 30) * Math.cos(a), py = cy + (R - 30) * Math.sin(a); b += S.arrow(px, py, cx + 50 * Math.cos(a), cy + 30 * Math.sin(a), cur === 0 ? (slashed ? 'dn' : 'acc') : 'info', 7); }
      /* thresholds bar */
      const bx = narrow ? 18 : Math.min(W * 0.42, 250) + R + 104, bw = narrow ? W - 36 : W - bx - 16;
      const by = narrow ? 336 : 70;
      if (narrow || bw > 150) {
        const sx = (v) => bx + (v / 100) * bw;
        b += S.text(bx, by - (narrow ? 22 : 14), narrow ? 'IF YOU CONTROL THIS MUCH' : 'IF YOU CONTROL THIS MUCH STAKE', 'cap');
        b += S.rect(bx, by, bw, 14, 'f-shade2', 3);
        b += S.rect(bx, by, sx(you) - bx, 14, slashed ? 'f-dn' : 'f-acc', 3);
        if (narrow) {
          b += S.line(sx(33.3), by - 4, sx(33.3), by + 18, 's-ink w15') + S.line(sx(66.7), by - 4, sx(66.7), by + 18, 's-ink w15');
          b += S.text(sx(33.3), by - 7, '1/3: stall', 'xs ink', 'middle') + S.text(sx(66.7), by + 30, '2/3: rewrite history', 'xs ink', 'middle');
        } else {
          [[33.3, 'can stop blocks', 'from being final'], [66.7, 'can rewrite', 'final history']].forEach(([v, t1, t2]) => { b += S.line(sx(v), by - 4, sx(v), by + 18, 's-ink w15'); b += S.text(sx(v), by + 32, (v < 50 ? '1/3: ' : '2/3: ') + t1, 'xs ink', 'middle'); b += S.text(sx(v), by + 45, t2, 'xs', 'middle'); });
        }
        b += S.text(bx, by + (narrow ? 70 : 72), you >= 66.7 ? 'You could rewrite history, but you would be' : you >= 33.3 ? 'You could stall the chain, and you would' : 'Below a third you cannot stall the chain.', 'sm ' + (you >= 33.3 ? 'dn b' : 'up b'));
        b += S.text(bx, by + (narrow ? 86 : 88), you >= 33.3 ? 'putting a huge stake at risk of being burned.' : 'Breaking the rules gets your stake slashed.', 'sm');
        if (!narrow) { b += S.text(bx, by + 128, 'HISTORY (LAST 60 SLOTS)', 'cap'); hist.forEach((h, j) => { const x = bx + (j % 20) * (bw / 20), y = by + 142 + Math.floor(j / 20) * 16; b += S.rect(x, y, Math.max(4, bw / 20 - 3), 11, h === 'y' ? 'f-acc' : h === 'x' ? 'f-dn' : 'f-shade2', 2); }); }
      }
      if (narrow) { const last = hist.slice(-20); b += S.text(18, 450, 'LAST 20 SLOTS', 'cap'); last.forEach((h, j) => { b += S.rect(18 + j * ((W - 36) / 20), 458, Math.max(4, (W - 36) / 20 - 3), 10, h === 'y' ? 'f-acc' : h === 'x' ? 'f-dn' : 'f-shade2', 2); }); }
      fig.innerHTML = S.wrap(W, H, 'Validators in a ring, sized by stake; one is picked to propose each block', b);
    }
    function readPos() {
      sv(id + '-s', F.num(slot));
      sv(id + '-m', slot ? `${mine} (${((mine / slot) * 100).toFixed(0)}%)` : '0', 'acc');
      sv(id + '-e', you + '%');
      sv(id + '-st', slashed ? 'Slashed' : 'Active', slashed ? 'dn' : 'up');
      if (slashed) msg(id + '-msg', 'dn', 'Slashed', `You were picked in slot ${slashSlot} and signed two different blocks. The network caught it, burned part of your stake and pushed you out. Cheating is caught because both signatures are public.`);
      else if (!slot) msg(id + '-msg', 'info', 'Stake', `No mining here. Validators lock up coins, and the network picks who proposes each block in proportion to stake. With ${you}% of the stake you should be picked about ${you}% of the time.`);
      else msg(id + '-msg', you >= 33.3 ? 'acc' : 'up', 'Rewards', `You proposed ${mine} of ${slot} blocks (${((mine / slot) * 100).toFixed(0)}%), close to your ${you}% share. Honest validators earn rewards; ${you >= 33.3 ? 'a share this big could stall the chain, which is why stake spread across many validators matters.' : 'try "Sign two blocks" to see what happens to cheaters.'}`);
      const nb = root.querySelector('[data-a="slot"]'), rb = root.querySelector('[data-a="run"]'); if (nb) nb.disabled = slashed; if (rb) rb.disabled = slashed;
    }
    function drawPos() { drawPosFig(true); readPos(); }

    const powResize = ui.responsive(fig, () => { if (mode === 'pow' && !raf) { const ch = $id(id + '-chain'); if (ch) ch.classList.toggle('wide', fig.clientWidth >= 700); } });
    function setMode(m) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      mode = m;
      if (m === 'pow') { ctlPow(); if (!chain.length) resetPow(); drawPow(); } else { ctlPos(); drawPos(); }
    }
    $id(id + '-mode').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', $id(id + '-mode')).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); setMode(b.dataset.v); });
    resetPow(); setMode('pow'); powResize(true);
  };

  /* =====================================================================
     1b) attackOdds: chance an attacker with q of the hash power catches up from z blocks behind
     ===================================================================== */
  SML.widgets.attackOdds = function (root) {
    const id = SML.uid('kat');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">How safe is a payment after N blocks?</span></div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl">${ui.slider({ id: id + '-q', label: 'Attacker’s share of all mining power', min: 1, max: 55, step: 1, value: 10, fmt: 'pct' })}${ui.slider({ id: id + '-z', label: 'Blocks you wait (confirmations)', min: 0, max: 12, step: 1, value: 6, fmt: 'num' })}</div>
      <div class="wg-read">${ui.stat('Attacker’s chance', id + '-p', 'hl')}${ui.stat('Wait at 10 min a block', id + '-w')}${ui.stat('Blocks for under 0.1%', id + '-n')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">From the formula in section 11 of the Bitcoin white paper: the chance an attacker who is behind ever catches up with the honest chain. Drag the dot or the sliders.</div>`;
    const fig = $id(id + '-fig'); const st = ui.wire(root, () => draw());
    let geo = null;
    const draw = ui.responsive(fig, (W) => {
      const q = st.n(id + '-q') / 100, z = st.n(id + '-z'); const narrow = W < 480;
      const H = Math.round(SML.clamp(W * 0.46, 230, 300)); const L = narrow ? 40 : 52, Rr = 16, T = 18, B = H - 34;
      const x = SML.lin(0, 12, L, W - Rr), y = SML.lin(0, 1, B, T);
      let b = '';
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => { b += S.line(L, y(v), W - Rr, y(v), 's-grid') + S.text(L - 6, y(v) + 4, (v * 100).toFixed(0) + '%', 'xs mono', 'end'); });
      for (let k = 0; k <= 12; k += narrow ? 2 : 1) b += S.text(x(k), B + 16, String(k), 'xs mono', 'middle');
      b += S.text((L + W - Rr) / 2, H - 4, 'blocks waited', 'xs', 'middle');
      [0.1, 0.3].forEach((qq) => { if (Math.abs(qq - q) < 0.005) return; const pts = []; for (let k = 0; k <= 12; k++) pts.push([x(k), y(catchUp(qq, k))]); b += S.poly(pts, 's-line w15 dash2'); b += S.text(x(narrow ? 3 : 2) + 4, y(catchUp(qq, narrow ? 3 : 2)) - 6, Math.round(qq * 100) + '%', 'xs'); });
      const pts = []; for (let k = 0; k <= 12; k++) pts.push([x(k), y(catchUp(q, k))]);
      b += S.area(pts, B, 'f-dn-t') + S.poly(pts, 's-dn w25');
      const P = catchUp(q, z);
      b += S.line(x(z), T, x(z), B, 's-acc dash2 w15');
      b += S.circle(x(z), y(P), 8, 'handle grab', ' data-h="1"');
      b += S.text(x(z) + (z > 8 ? -12 : 12), Math.max(T + 12, y(P) - 10), (P >= 0.9995 ? '100%' : P < 0.0001 ? '<0.01%' : (P * 100).toFixed(P < 0.01 ? 2 : 1) + '%'), 'md b dn', z > 8 ? 'end' : 'start');
      fig.innerHTML = S.wrap(W, H, 'Chance an attacker catches up, by number of blocks waited', b, 'drag');
      geo = { x, L, W, Rr };
      sv(id + '-p', P >= 0.9995 ? '100%' : P < 0.0001 ? '<0.01%' : (P * 100).toFixed(P < 0.01 ? 2 : 1) + '%', P > 0.1 ? 'dn' : P > 0.001 ? 'acc' : 'up');
      sv(id + '-w', z === 0 ? 'none' : z * 10 + ' min');
      let need = -1; for (let k = 0; k <= 60; k++) { if (catchUp(q, k) < 0.001) { need = k; break; } }
      sv(id + '-n', q >= 0.5 ? 'never' : need < 0 ? '60+' : String(need));
      if (q >= 0.5) msg(id + '-msg', 'dn', '51% attack', 'With half or more of all mining power, the attacker always catches up eventually. That is what a 51% attack means: they can rewrite recent blocks and spend the same coins twice.');
      else if (P > 0.1) msg(id + '-msg', 'dn', 'Risky', `An attacker with ${Math.round(q * 100)}% of the power has about a ${(P * 100).toFixed(0)}% chance to undo a payment after ${z} block${z === 1 ? '' : 's'}. Wait longer for big amounts.`);
      else msg(id + '-msg', 'up', 'Safer', `After ${z} block${z === 1 ? '' : 's'} an attacker with ${Math.round(q * 100)}% of the power has a ${P < 0.0001 ? 'tiny' : (P * 100).toFixed(2) + '%'} chance. Each extra block makes the odds drop fast, which is why exchanges wait for several confirmations.`);
    });
    ui.drag(fig, { sel: '[data-h]', move(pt) { if (!geo) return; const k = Math.round(SML.clamp(geo.x.invert ? geo.x.invert(pt.x) : ((pt.x - geo.L) / (geo.W - geo.Rr - geo.L)) * 12, 0, 12)); st.set(id + '-z', k); draw(true); } });
  };

  /* =====================================================================
     2) coinMap: compare coin types; bitcoin supply schedule; stablecoin peg under stress
     ===================================================================== */
  /* bitcoin issuance schedule: eras of 210,000 blocks; actual halving dates, later ones estimated */
  const ERA_START = [2009.01, 2012.91, 2016.52, 2020.36, 2024.30, 2028.30, 2032.30, 2036.30, 2040.30, 2044.30, 2048.30];
  function btcAt(yr) {
    let mined = 0;
    for (let e = 0; e < 33; e++) {
      const s = ERA_START[e] != null ? ERA_START[e] : ERA_START[ERA_START.length - 1] + 4 * (e - ERA_START.length + 1);
      const nx = ERA_START[e + 1] != null ? ERA_START[e + 1] : s + 4; const reward = 50 / Math.pow(2, e);
      if (yr <= s) break;
      const frac = Math.min(1, (yr - s) / (nx - s)); mined += 210000 * reward * frac;
      if (yr < nx) return { mined, reward, era: e };
    }
    return { mined, reward: 50 / Math.pow(2, 32), era: 32 };
  }
  SML.btcAt = btcAt;
  /* market snapshot (fill from research/crypto.md) */
  const GROUPS = [
    { k: 'btc', name: 'Bitcoin', short: 'BTC', c: '--accent', f: 'f-acc', share: 59, shareTxt: '~59%', what: 'Digital money with a fixed supply of 21 million. Used mainly as a long-term store of value.', supply: '21M cap', sec: 'Proof of work', dd: '−33%', pill: 'acc',
      coach: 'About $84,500 in October 2026, a third below its record near $126,000 (October 6, 2025), after falling as low as about $57,700 in July 2026. Past bear markets took it down 77% to 93%. Its supply rule is fixed in code.' },
    { k: 'eth', name: 'Ethereum (ether)', short: 'ETH', c: '--info', f: 'f-info', share: 11, shareTxt: '~11%', what: 'A shared computer that runs smart contracts. Ether pays the fees and is staked to secure the network.', supply: 'No hard cap', sec: 'Proof of stake', dd: '−50%', pill: 'info',
      coach: 'About $2,490 in October 2026, half its August 2025 record of about $4,946. Ethereum runs the smart contracts behind most stablecoins and DeFi. Staking ether paid roughly 3% a year in 2026.' },
    { k: 'stable', name: 'Stablecoins', short: 'Stable', c: '--up', f: 'f-up', share: 10, shareTxt: '~10%', what: 'Tokens built to stay at $1, usually backed by reserves of cash-like assets held by the issuer. The plumbing of crypto trading.', supply: 'Minted on demand', sec: 'Issuer’s reserves', dd: 'Aims for $0', ddc: 'up', pill: 'up',
      coach: 'About $301 billion in circulation (October 2026): Tether’s USDT about 61% and USDC about 24%. Not FDIC-insured. The GENIUS Act requires US payment stablecoins to hold 100% reserves and bans paying interest to holders.' },
    { k: 'alt', name: 'Altcoins and memecoins', short: 'Other', c: '--violet', f: 'f-vio', share: 20, shareTxt: '~20%', what: 'Thousands of other tokens, from large smart-contract chains to joke coins with no purpose.', supply: 'Varies', sec: 'Varies', dd: 'Often far worse', ddc: 'dn', pill: 'dn',
      coach: 'Thousands of tokens share what is left. Many trade thinly, insiders often hold much of the supply and new coins unlock over time. Most small coins never get back to their highs.' },
  ];
  const VOLS = [{ k: 'sp', n: 'S&P 500', v: 15, label: '~15% (long run)' }, { k: 'btc', n: 'Bitcoin, past year', v: 43, label: '~43%' }, { k: 'btc10', n: 'Bitcoin, 10-yr avg', v: 64, label: '~64%' }, { k: 'stable', n: 'Stablecoins', v: 1, label: 'near 0% if the peg holds' }];
  SML.cryptoGroups = GROUPS; SML.cryptoVols = VOLS;
  SML.cryptoNote = 'October 2026 snapshot (CoinGecko, CoinMarketCap, DefiLlama); shares move daily. Volatility: Grayscale for bitcoin, Callan for the S&P 500. Smaller coins usually swing even more.';
  SML.widgets.coinMap = function (root) {
    const id = SML.uid('kcm');
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">The crypto map</span><span class="grow"></span>${ui.seg(id + '-tab', [{ v: 'map', label: 'Compare' }, { v: 'btc', label: 'Bitcoin supply' }, { v: 'peg', label: 'Stablecoin stress' }], 'map', 'View')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl" id="${id}-ctl"></div>
      <div class="wg-read" id="${id}-read"></div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note" id="${id}-note"></div>`;
    const fig = $id(id + '-fig'), ctl = $id(id + '-ctl'), read = $id(id + '-read'), note = $id(id + '-note');
    let tab = 'map', pick = 'btc', yr = 2026.8, back = 'cash', run = 30;
    const GROUPS = SML.cryptoGroups;
    function setTab(t) {
      tab = t;
      if (t === 'map') {
        ctl.innerHTML = `<div class="kc1-cards" style="grid-column:1/-1" id="${id}-cards">${GROUPS.map((g) => `<button type="button" class="kc1-card${g.k === pick ? ' on' : ''}" data-g="${g.k}" aria-pressed="${g.k === pick}"><h4><i style="background:var(${g.c})"></i>${g.name}</h4><p>${g.what}</p></button>`).join('')}</div>`;
        read.innerHTML = ui.stat('Share of crypto market', id + '-sh', 'hl') + ui.stat('Supply rule', id + '-sr') + ui.stat('Secured by', id + '-sec') + ui.stat('Below its record', id + '-dd');
        note.innerHTML = SML.cryptoNote || 'Market shares are approximate and change daily.';
      } else if (t === 'btc') {
        ctl.innerHTML = ui.slider({ id: id + '-yr', label: 'Year', min: 2009, max: 2050, step: 0.25, value: yr, fmt: (v) => String(Math.floor(v)) });
        read.innerHTML = ui.stat('Mined by then', id + '-mn', 'hl') + ui.stat('Share of 21M', id + '-pc') + ui.stat('Reward per block', id + '-rw') + ui.stat('New coins a day', id + '-nd');
        note.innerHTML = 'Supply is computed from the protocol: 210,000 blocks per era, the reward halves each era, starting at 50 BTC. Past halving dates are real; 2028 and later are estimates because block times vary. Drag the handle.';
      } else {
        ctl.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px"><span class="ctl-lab">What backs the coin</span>${ui.seg(id + '-bk', [{ v: 'cash', label: 'Cash and T-bills' }, { v: 'crypto', label: 'Other crypto' }, { v: 'algo', label: 'An algorithm' }], back, 'Backing')}</div>${ui.slider({ id: id + '-run', label: 'Holders who rush to cash out in a week', min: 0, max: 80, step: 5, value: run, fmt: 'pct' })}`;
        read.innerHTML = ui.stat('Lowest price', id + '-lo', 'hl') + ui.stat('After a week', id + '-end') + ui.stat('Redeemed for $1', id + '-rd');
        note.innerHTML = 'A simplified model, not a forecast. Reserve-backed coins hold up as long as the reserves are real, safe and quick to sell. Algorithmic coins rely on confidence, which is what failed with TerraUSD in May 2022.';
      }
      const st = ui.wire(ctl, () => { if (tab === 'btc') yr = st.n(id + '-yr'); if (tab === 'peg') { run = st.n(id + '-run'); back = st.seg(id + '-bk') || back; } draw(true); });
      draw(true);
    }
    ctl.addEventListener('click', (e) => { const c = e.target.closest('.kc1-card'); if (!c) return; pick = c.dataset.g; $$('.kc1-card', ctl).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); draw(true); });
    let geo = null;
    const draw = ui.responsive(fig, (W) => {
      const narrow = W < 500;
      if (tab === 'map') {
        const g = GROUPS.find((x) => x.k === pick) || GROUPS[0];
        let b = '';
        b += S.text(0 + 4, 16, narrow ? 'SHARE OF ALL CRYPTO' : 'SHARE OF THE TOTAL CRYPTO MARKET', 'cap');
        let x0 = 4; const bw = W - 8, by = 28, bh = 34;
        let small = [];
        GROUPS.forEach((gg) => { const w = (gg.share / 100) * bw; b += S.rect(x0, by, Math.max(1, w - 2), bh, gg.f + (gg.k === pick ? '' : ' o50'), 3); if (w > 76) b += S.text(x0 + 8, by + 22, `${gg.short} ${gg.share}%`, 'sm b ' + (gg.k === pick ? 'on' : 'ink')); else small.push(gg); x0 += w; });
        let extraY = 0;
        if (small.length) { let lx2 = 4; small.forEach((gg) => { b += S.rect(lx2, by + bh + 10, 9, 9, gg.f, 2) + S.text(lx2 + 13, by + bh + 18, `${gg.short} ${gg.share}%`, 'sm ' + (gg.k === pick ? 'acc b' : 'ink')); lx2 += 30 + (gg.short.length + 4) * 7; }); extraY = 22; }
        /* volatility bars */
        const vy = by + bh + 34 + extraY; b += S.text(4, vy, narrow ? 'TYPICAL YEARLY SWING' : 'HOW MUCH IT SWINGS: TYPICAL YEARLY VOLATILITY', 'cap');
        const vols = SML.cryptoVols; const vmax = Math.max(...vols.map((v) => v.v)) * 1.25; const lx = narrow ? 118 : 150;
        vols.forEach((v, j) => { const yy = vy + 14 + j * 24; const w = ((W - lx - 60) * v.v) / vmax; b += S.text(lx - 8, yy + 13, narrow ? v.n.replace(', past year', ' now').replace(', 10-yr avg', ' 10-yr') : v.n, 'sm ' + (v.k === pick || (pick === 'btc' && v.k === 'btc10') ? 'acc b' : 'ink'), 'end'); const hi = v.k === pick || (pick === 'btc' && v.k === 'btc10'); b += S.rect(lx, yy, Math.max(3, w), 16, hi ? 'f-acc' : v.k === 'sp' ? 'f-info' : 'f-shade2', 3); b += S.text(lx + Math.max(3, w) + 6, yy + 13, narrow ? v.label.replace(' (long run)', '').replace(' if the peg holds', '') : v.label, 'sm mono ' + (hi ? 'acc b' : 'ink')); });
        fig.innerHTML = S.wrap(W, vy + 14 + vols.length * 24 + 6, 'Market share by coin type and how much each swings', b);
        sv(id + '-sh', g.shareTxt || ('~' + g.share + '%'), 'acc'); sv(id + '-sr', g.supply); sv(id + '-sec', g.sec); sv(id + '-dd', g.dd, g.ddc || 'dn');
        msg(id + '-msg', g.pill, g.name, g.coach);
        return;
      }
      if (tab === 'btc') {
        const H = Math.round(SML.clamp(W * 0.5, 240, 320)); const L = narrow ? 44 : 56, Rr = 18, T = 26, B = H - 30;
        const x = SML.lin(2009, 2050, L, W - Rr), y = SML.lin(0, 21e6, B, T);
        let b = '';
        [0, 5e6, 10e6, 15e6, 21e6].forEach((v) => { b += S.line(L, y(v), W - Rr, y(v), v === 21e6 ? 's-acc dash w15' : 's-grid') + S.text(L - 6, y(v) + 4, v / 1e6 + 'M', 'xs mono', 'end'); });
        b += S.text(W - Rr, y(21e6) - 6, '21 million cap', 'sm acc b', 'end');
        [2010, 2020, 2030, 2040, 2050].forEach((t) => { b += S.text(x(t), B + 16, String(t), 'xs mono', 'middle'); });
        const ptsP = [], ptsF = []; const now = 2026.8;
        for (let t = 2009; t <= 2050.01; t += 0.25) { const p = [x(t), y(btcAt(t).mined)]; if (t <= now) ptsP.push(p); if (t >= now - 0.25) ptsF.push(p); }
        b += S.area(ptsP, B, 'f-acc-t') + S.poly(ptsP, 's-acc w25') + S.poly(ptsF, 's-acc w2 dash2');
        ERA_START.slice(1, 6).forEach((t, j) => { const est = t > now; b += S.line(x(t), B, x(t), B - 10, 's-ink w15'); if (!narrow || j % 2 === 0 || j === 4) b += S.text(x(t), B - 14, (est ? '~' : '') + Math.floor(t), 'xs ' + (est ? 'mut' : 'ink'), 'middle'); });
        if (!narrow) b += S.text(x(2012) - 22, B - 14, 'halvings', 'xs', 'end');
        const s = btcAt(yr); b += S.line(x(yr), T, x(yr), B, 's-info dash2 w15') + S.circle(x(yr), y(s.mined), 8, 'handle grab', ' data-h="1"');
        b += S.text(x(yr) + (x(yr) > W * 0.7 ? -12 : 12), Math.max(T + 30, y(s.mined) - 12), (s.mined / 1e6).toFixed(2) + 'M BTC', 'md b ink', x(yr) > W * 0.7 ? 'end' : 'start');
        fig.innerHTML = S.wrap(W, H, 'Bitcoin supply over time approaching 21 million, with halvings marked', b, 'drag');
        geo = { x };
        sv(id + '-mn', (s.mined / 1e6).toFixed(2) + 'M', 'acc'); sv(id + '-pc', ((s.mined / 21e6) * 100).toFixed(1) + '%');
        sv(id + '-rw', s.reward >= 0.01 ? (+s.reward.toFixed(4)).toString() + ' BTC' : '< 0.01 BTC'); sv(id + '-nd', F.num(Math.round(s.reward * 144)));
        msg(id + '-msg', yr > now ? 'info' : 'acc', yr > now ? 'Estimate' : 'Schedule', yr > now
          ? `By ${Math.floor(yr)} about ${(s.mined / 1e6).toFixed(2)} million bitcoin will exist, and each block will pay ${(+s.reward.toFixed(4))} BTC. New supply keeps shrinking: the last fractions are expected around 2140.`
          : `In ${Math.floor(yr)} each block paid ${(+s.reward.toFixed(4))} BTC, about ${F.num(Math.round(s.reward * 144))} new coins a day at 144 blocks a day. A halving cuts that in half, but price depends on demand, not on the schedule alone.`);
        return;
      }
      /* stablecoin stress model */
      const H = Math.round(SML.clamp(W * 0.46, 230, 300)) + (narrow ? 10 : 0); const L = narrow ? 44 : 56, Rr = 16, T = 18, B = H - (narrow ? 40 : 30);
      const days = 7, x = SML.lin(0, days, L, W - Rr), y = SML.lin(0, 1.05, B, T);
      const path = pegPath(back, run / 100);
      let b = '';
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => { b += S.line(L, y(v), W - Rr, y(v), v === 1 ? 's-up dash w15' : 's-grid') + S.text(L - 6, y(v) + 4, '$' + v.toFixed(2), 'xs mono', 'end'); });
      for (let d = 0; d <= days; d++) b += S.text(x(d), B + 16, narrow ? String(d) : 'day ' + d, 'xs mono', 'middle');
      if (narrow) b += S.text(W - Rr, B + 28, 'days', 'xs', 'end');
      const pts = path.map((p, k) => [x(k / 4), y(p)]);
      b += S.poly(pts, (path[path.length - 1] > 0.98 ? 's-up' : path[path.length - 1] > 0.6 ? 's-acc' : 's-dn') + ' w25');
      b += S.text(W - Rr, y(1) - 6, '$1 peg', 'sm up b', 'end');
      fig.innerHTML = S.wrap(W, H, 'Stablecoin price over a week of heavy redemptions', b);
      const lo = Math.min(...path), end = path[path.length - 1];
      sv(id + '-lo', '$' + lo.toFixed(2), lo > 0.98 ? 'up' : lo > 0.6 ? 'acc' : 'dn'); sv(id + '-end', '$' + end.toFixed(2), end > 0.98 ? 'up' : end > 0.6 ? 'acc' : 'dn');
      sv(id + '-rd', back === 'cash' ? run + '%' : back === 'crypto' ? Math.min(run, 45) + '%' : Math.min(run, 10) + '%');
      if (back === 'cash') msg(id + '-msg', 'up', 'Holds', `Even with ${run}% of holders cashing out, a coin backed one-for-one by cash and short Treasury bills can pay everyone $1, as long as the reserves are really there. That is why reserve rules and audits matter.`);
      else if (back === 'crypto') msg(id + '-msg', end > 0.98 ? 'acc' : 'dn', end > 0.98 ? 'Strained' : 'Wobbles', `Backed by other crypto, the coin needs extra collateral because that collateral can crash at the same time. ${run >= 50 ? 'A big rush during a market crash can push it below $1.' : 'It survives smaller rushes.'}`);
      else msg(id + '-msg', run >= 20 ? 'dn' : 'acc', run >= 20 ? 'Death spiral' : 'Fragile', run >= 20 ? 'With nothing solid behind it, each redemption prints more of a sister token, its price falls, confidence breaks and the coin spirals toward zero. TerraUSD failed this way in May 2022.' : 'It holds while confidence holds. A bigger rush can tip it into a spiral.');
    });
    function pegPath(bk, r) {
      const out = []; let p = 1;
      for (let k = 0; k <= 28; k++) {
        const t = k / 28;
        if (bk === 'cash') p = 1 - Math.min(0.006, r * 0.01) * Math.sin(Math.PI * t);
        else if (bk === 'crypto') { const stress = Math.max(0, r - 0.45); p = 1 - (0.01 + stress * 0.5) * Math.sin(Math.PI * Math.min(1, t * 1.4)); }
        else { if (r < 0.2) p = 1 - r * 0.15 * Math.sin(Math.PI * t); else { const k2 = (r - 0.2) * 9; p = Math.max(0.02, 1 / (1 + Math.pow(t * 3, 2) * k2)); } }
        out.push(SML.clamp(p, 0, 1.01));
      }
      return out;
    }
    ui.drag(fig, { sel: '[data-h]', move(pt) { if (tab !== 'btc' || !geo) return; const v = 2009 + ((pt.x - geo.x(2009)) / (geo.x(2050) - geo.x(2009))) * 41; yr = Math.round(SML.clamp(v, 2009, 2050) * 4) / 4; const sl = $id(id + '-yr'); if (sl) { sl.value = yr; ui.setRange(sl); } draw(true); } });
    $id(id + '-tab').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', $id(id + '-tab')).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); setTab(b.dataset.v); });
    setTab('map');
  };

  /* =====================================================================
     3) custodyPicker: five ways to hold crypto, rated; a short quiz picks a setup
     ===================================================================== */
  const OPTS = [
    { k: 'etf', name: 'Spot ETF in a brokerage or IRA', short: 'ETF', who: 'The fund’s custodian', keys: 2, hack: 3, fail: 3, fees: 2, tax: 3, ease: 3, h24: 1, defi: 1,
      failTxt: 'If your broker fails, SIPC protects the ETF shares (not their market value). The coins sit with the fund’s custodian.', pro: 'Normal brokerage account, IRA-friendly, clean tax forms.', con: 'Yearly fund fee, trades only in market hours, you never touch the coins.' },
    { k: 'app', name: 'Broker app (e.g. Robinhood)', short: 'Broker app', who: 'The app company', keys: 1, hack: 2, fail: 1, fees: 2, tax: 3, ease: 3, h24: 3, defi: 1,
      failTxt: 'The coins are held by the company. SIPC does not protect crypto that is not a security, and the FDIC does not insure crypto, so a failure can leave you as a creditor in bankruptcy.', pro: 'Simple, trades all day and night, tax forms provided.', con: 'Spreads can be hidden in the price; withdrawal options vary.' },
    { k: 'exch', name: 'Crypto exchange account', short: 'Exchange', who: 'The exchange', keys: 1, hack: 2, fail: 1, fees: 2, tax: 2, ease: 2, h24: 3, defi: 2,
      failTxt: 'Coins left on an exchange are only as safe as the company. When FTX collapsed in November 2022, customers could not withdraw; its founder had taken more than $8 billion of their money.', pro: 'Most coins, lowest trading fees at scale, 24/7.', con: 'Exchange hacks and failures, account takeovers, tracking basis across platforms.' },
    { k: 'hot', name: 'Hot wallet (phone or browser app)', short: 'Hot wallet', who: 'You', keys: 3, hack: 1, fail: 3, fees: 2, tax: 1, ease: 2, h24: 3, defi: 3,
      failTxt: 'No company can freeze or lose your coins, but a phishing link, malware or a leaked seed phrase can empty the wallet in seconds.', pro: 'Full control, works with apps and DeFi.', con: 'Online device risk; you track every cost basis yourself.' },
    { k: 'cold', name: 'Hardware wallet (offline device)', short: 'Hardware', who: 'You', keys: 3, hack: 3, fail: 3, fees: 2, tax: 1, ease: 1, h24: 3, defi: 2,
      failTxt: 'Company failures do not touch your coins. Losing both the device and the seed phrase means the coins are gone for good.', pro: 'Keys never touch the internet. Best for large long-term holdings you control.', con: 'Costs money, takes care to set up, and the seed phrase backup is on you.' },
  ];
  const CRIT = [['keys', 'You control the keys'], ['hack', 'Safe from hacks'], ['fail', 'Safe if the company fails'], ['tax', 'Easy tax records'], ['ease', 'Easy to use'], ['h24', 'Trade any hour'], ['defi', 'Use crypto apps (DeFi)']];
  SML.widgets.custodyPicker = function (root) {
    const id = SML.uid('kcp');
    const Q = [
      { k: 'amt', q: 'How much will you hold?', o: [['s', 'Under $1,000'], ['m', '$1,000 to $25,000'], ['l', 'More than $25,000']] },
      { k: 'acct', q: 'Where do you want it?', o: [['ira', 'In an IRA or my brokerage'], ['any', 'Anywhere'], ['me', 'Fully in my control']] },
      { k: 'use', q: 'How will you use it?', o: [['hold', 'Buy and hold for years'], ['trade', 'Trade often'], ['apps', 'Use crypto apps and DeFi']] },
      { k: 'tech', q: 'How comfortable are you with tech?', o: [['lo', 'Keep it simple'], ['mid', 'Fairly comfortable'], ['hi', 'Very comfortable']] },
    ];
    const ans = { amt: 'm', acct: 'any', use: 'hold', tech: 'mid' };
    root.innerHTML = `
      <div class="wg-bar"><span class="wg-title">Pick your setup</span><span class="grow"></span>${ui.seg(id + '-view', [{ v: 'quiz', label: 'Answer 4 questions' }, { v: 'grid', label: 'Compare all five' }], 'quiz', 'View')}</div>
      <div class="wg-fig" id="${id}-fig"></div>
      <div class="wg-ctrl" id="${id}-ctl">
        <div class="kc1-q" style="grid-column:1/-1">${Q.map((q) => `<div class="qi"><span>${q.q}</span>${ui.seg(id + '-' + q.k, q.o.map((o) => ({ v: o[0], label: o[1] })), ans[q.k], q.q)}</div>`).join('')}</div>
      </div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Ratings are a teaching summary, not a product review. Check fees and terms on the provider’s site. Never share a seed phrase with anyone, including “support”.</div>`;
    const fig = $id(id + '-fig'); let view = 'quiz', fail = false;
    function score(o) {
      let s = 0;
      const w = { keys: 1, hack: 1.2, fail: 1.2, fees: 0.4, tax: 0.6, ease: 1, h24: 0.3, defi: 0.2 };
      if (ans.amt === 'l') { w.hack += 1; w.fail += 1.2; w.keys += 0.6; }
      if (ans.amt === 's') { w.ease += 0.8; w.fees += 0.4; }
      if (ans.acct === 'ira') { w.tax += 1; w.ease += 0.5; }
      if (ans.acct === 'me') { w.keys += 2.5; w.fail += 0.6; }
      if (ans.use === 'trade') { w.h24 += 1.5; w.fees += 0.8; w.ease += 0.4; }
      if (ans.use === 'apps') { w.defi += 2.5; w.keys += 1; }
      if (ans.use === 'hold') { w.hack += 0.5; w.fail += 0.4; }
      if (ans.tech === 'lo') { w.ease += 1.6; w.tax += 0.4; }
      if (ans.tech === 'hi') { w.ease -= 0.4; }
      Object.keys(w).forEach((k) => { s += w[k] * (o[k] || 0); });
      let pen = 0;
      if (ans.acct === 'ira' && o.k !== 'etf') pen += 6;
      if (ans.acct === 'me' && (o.k === 'etf' || o.k === 'app' || o.k === 'exch')) pen += 6;
      if (ans.use === 'apps' && (o.k === 'etf' || o.k === 'app')) pen += 4;
      if (ans.tech === 'lo' && (o.k === 'hot' || o.k === 'cold')) pen += 2;
      return s - pen;
    }
    const dots = (v) => `<span class="kc1-dots" aria-label="${['', 'weak', 'medium', 'strong'][v]}">${[1, 2, 3].map((i) => `<i class="${i <= v ? (v === 3 ? 'g' : v === 2 ? 'a' : 'r') : ''}"></i>`).join('')}</span>`;
    function render() {
      const ranked = OPTS.map((o) => ({ o, s: score(o) })).sort((a, b) => b.s - a.s);
      const top = ranked[0].o;
      if (view === 'quiz') {
        const max = ranked[0].s, min = Math.min(...ranked.map((r) => r.s));
        fig.innerHTML = `<ol class="kc1-rank">${ranked.map((r, i) => `<li class="${i === 0 ? 'top' : ''}"><span class="n">${i + 1}</span><span><b>${esc(r.o.name)}</b><small>${i === 0 ? esc(r.o.pro) + ' <br>Watch out: ' + esc(r.o.con) : esc(r.o.con)}</small></span><span class="sc">${Math.round(((r.s - min) / Math.max(1, max - min)) * 100)}% fit</span></li>`).join('')}</ol>`;
      } else if (fig.clientWidth < 600) {
        fig.innerHTML = `<div class="kc1-legend" style="margin-bottom:10px"><span>${dots(3)} strong</span><span>${dots(2)} medium</span><span>${dots(1)} weak</span></div>
          <label style="display:flex;gap:8px;align-items:center;cursor:pointer;font-size:13.5px;color:var(--ink);margin-bottom:10px"><input type="checkbox" id="${id}-fail"${fail ? ' checked' : ''}> What if the company fails?</label>
          <div class="kc1-cards">${OPTS.map((o) => `<div class="kc1-card${o.k === top.k ? ' on' : ''}" style="cursor:default"><h4>${esc(o.name)}</h4><span class="kc1-mini">keys held by: ${esc(o.who)}</span><dl>${CRIT.map((c) => `<dt>${c[1]}</dt><dd>${dots(o[c[0]])}</dd>`).join('')}</dl>${fail ? `<p>${esc(o.failTxt)}</p>` : ''}</div>`).join('')}</div>`;
        const fb = $id(id + '-fail'); if (fb) fb.addEventListener('change', () => { fail = fb.checked; render(); });
      } else {
        fig.innerHTML = `<div class="kc1-legend" style="margin-bottom:10px"><span>${dots(3)} strong</span><span>${dots(2)} medium</span><span>${dots(1)} weak</span><span style="margin-left:auto"><label style="display:inline-flex;gap:6px;align-items:center;cursor:pointer;text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--ink)"><input type="checkbox" id="${id}-fail"${fail ? ' checked' : ''}> What if the company fails?</label></span></div>
          <div class="kc1-scroll scroll"><table class="kc1-tbl"><thead><tr><th>Setup</th>${CRIT.map((c) => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${OPTS.map((o) => `<tr${o.k === top.k ? ' style="background:color-mix(in srgb,var(--accent) 8%,transparent)"' : ''}><td>${esc(o.short)}<br><span class="kc1-mini">keys: ${esc(o.who)}</span></td>${CRIT.map((c) => `<td>${dots(o[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          ${fail ? `<ul class="kc1-safe" style="margin-top:12px">${OPTS.map((o) => `<li class="${o.fail === 3 ? '' : 'no'}"><span><b style="color:var(--ink)">${esc(o.short)}:</b> ${esc(o.failTxt)}</span></li>`).join('')}</ul>` : ''}`;
        const fb = $id(id + '-fail'); if (fb) fb.addEventListener('change', () => { fail = fb.checked; render(); });
      }
      const extra = ans.amt === 'l' && top.k !== 'cold' && top.k !== 'etf' ? ' For this much money, also look at a hardware wallet or a spot ETF.' : '';
      const ira = ans.acct === 'ira' ? ' Inside an IRA, a spot ETF is the usual route: gains grow tax-deferred or tax-free and there is no crypto paperwork.' : '';
      msg(id + '-msg', top.k === 'cold' || top.k === 'etf' ? 'up' : top.k === 'hot' ? 'acc' : 'info', 'Best fit', `${esc(top.name)}. ${esc(top.pro)}${ira}${extra}`);
    }
    let lastNarrow = null;
    ui.responsive(fig, () => { const n = fig.clientWidth < 600; if (lastNarrow !== null && n !== lastNarrow && view === 'grid') render(); lastNarrow = n; });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('.seg button'); if (!b) return; const g = b.closest('.seg'); if (!g || !root.contains(g)) return;
      $$('button', g).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      if (g.id === id + '-view') { view = b.dataset.v; render(); return; }
      const k = g.id.slice((id + '-').length); if (k in ans) { ans[k] = b.dataset.v; render(); }
    });
    render();
  };

  /* =====================================================================
     Lessons
     ===================================================================== */
  SML.lessons.push({
    id: 'l-blockchain', course: 'crypto', order: 1, title: 'How a blockchain works', mins: 9, level: 'Beginner',
    summary: 'Blocks, hashes, mining and staking: why a shared ledger is so hard to fake.',
    idea: 'A blockchain is a ledger that thousands of computers keep in sync. Each block locks in the one before it, so changing history means redoing everything after it.',
    widget: 'blockChainDemo',
    try: 'Mine the new block. Then change the data in an older block and watch every block after it break. Switch to proof of stake to see how validators replace miners.',
    body: [
      '<h3>The problem: digital money without a bank</h3><p>A digital file can be copied, so how do you stop someone spending the same coin twice? A bank solves this by keeping the only ledger. A <b>blockchain</b> solves it by giving every participant a copy of the ledger and a set of rules for adding to it. No single company can quietly edit it.</p>',
      '<h3>Hashes: fingerprints for data</h3><p>A <b>hash</b> turns any data into a short fingerprint. Bitcoin uses SHA-256, the same function running in the demo above. Change one letter and the fingerprint changes completely, and you cannot work backwards from a fingerprint to the data.</p>',
      '<h3>Blocks chained together</h3><p>Transactions are grouped into blocks. Each block stores the hash of the block before it. Edit an old block and its hash changes, so the next block no longer points to it, and every block after that is broken too. That is the “chain”.</p>',
      '<h3>Proof of work: mining</h3><p>To add a block, <b>miners</b> race to find a number (the nonce) that makes the block’s hash start with enough zeros. The only way is trial and error, so it costs computing power and electricity. The winner earns new coins plus fees. Bitcoin adjusts the difficulty about every two weeks so a block arrives roughly every 10 minutes, no matter how many miners join.</p>',
      '<h3>Proof of stake: validators</h3><p>Ethereum switched from mining to <b>proof of stake</b> on September 15, 2022, which cut its energy use by about 99.95%. Validators lock up ether as a deposit. The network picks them at random, in proportion to their stake, to propose and vote on blocks. Break the rules, such as signing two different blocks, and part of the deposit is destroyed (“slashed”).</p>',
      '<h3>Why rewriting history is so hard</h3><ul><li><b>Confirmations:</b> each new block on top of yours is a confirmation. To undo a payment, an attacker must redo that block and every block after it faster than the rest of the network.</li><li><b>51% attack:</b> with more than half of all mining power, an attacker can eventually rewrite recent blocks. Big networks make that very expensive; small coins are easier targets.</li><li><b>Stake attacks:</b> on Ethereum, someone with a third of all staked ether could stop the chain from finalizing (blocks keep coming, and a penalty called the inactivity leak slowly drains the attacker), and about two thirds could rewrite finalized history, at the risk of losing that stake.</li></ul>',
      '<h3>What a blockchain does not do</h3><ul><li>There is no undo button. Send coins to the wrong address and they are usually gone.</li><li>It is public, not private. Every transaction stays visible forever, and addresses can often be linked to people through exchanges.</li><li>It does not make a coin valuable or a project honest. Scam tokens run on blockchains too (see <a href="#l-crypto-risks">risks, scams and taxes</a>).</li></ul>',
    ],
    extra: [{ widget: 'attackOdds', try: 'Slide the attacker’s share of mining power and the number of blocks you wait. See why exchanges wait for several confirmations.' }],
    example: {
      title: 'Following one bitcoin payment',
      intro: 'Ana sends Ben 0.01 BTC. Here is what happens before Ben can treat it as final.',
      steps: [
        'Ana’s wallet signs the payment with her private key. Anyone can check the signature against her address, but nobody can forge it.',
        'The payment is broadcast to the network and waits in a queue with others. Ana adds a fee; higher fees tend to get picked up sooner.',
        'A miner includes it in a block. Blocks arrive about every 10 minutes on average, so the payment usually gets its first confirmation within minutes.',
        'Each new block on top adds a confirmation. Six blocks take about an hour.',
        'Using the formula from the Bitcoin white paper, an attacker with 10% of all mining power has about a 0.02% chance of undoing a payment buried under six blocks.',
      ],
      result: 'That is why many exchanges wait for several confirmations before they credit a large deposit.',
    },
    mistakes: [
      'Sending coins to the wrong address and expecting a refund. There is no bank to reverse it; test with a small amount first.',
      'Thinking crypto is anonymous. Every transaction is public forever, and exchanges link addresses to real names.',
      'Believing “it is on the blockchain” means a project is legitimate. Anyone can launch a token, including scammers.',
      'Confusing the technology with the investment. A working blockchain does not make its coin a good buy.',
    ],
    points: [
      'A blockchain is a shared ledger copied across thousands of computers.',
      'Each block stores the previous block’s hash, so editing old data breaks every later link.',
      'Proof of work makes rewriting costly with electricity; proof of stake puts locked coins at risk instead.',
      'Every extra confirmation makes a payment much harder to undo.',
      'Transactions are permanent and public.',
    ],
    terms: ['Blockchain', 'Hash', 'Mining', 'Proof of work', 'Proof of stake', 'Cryptocurrency'],
    glossary: [
      { t: 'Node', d: 'A computer that keeps a copy of the blockchain and checks new blocks against the rules.' },
      { t: 'Nonce', d: 'The number miners change over and over until the block’s hash meets the target.' },
      { t: 'Confirmation', d: 'Each block added on top of the one holding your transaction.' },
      { t: '51% attack', d: 'Controlling most of a network’s mining power (or stake) to rewrite recent history.' },
    ],
    quiz: { q: 'You change one word in a transaction buried five blocks deep. What happens?', options: ['Nothing; old blocks can be edited freely', 'That block’s hash changes, so the next block no longer links to it and every later block must be redone', 'The network asks the sender’s bank to approve the change'], answer: 1, why: 'Each block stores the previous block’s hash, so one edit breaks every link after it.' },
    sources: [
      { t: 'Bitcoin: A Peer-to-Peer Electronic Cash System (white paper, section 11)', u: 'https://bitcoin.org/bitcoin.pdf' },
      { t: 'ethereum.org: The Merge (September 15, 2022; energy use down ~99.95%)', u: 'https://ethereum.org/en/roadmap/merge/' },
      { t: 'ethereum.org: Proof-of-stake attack and defense', u: 'https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/attack-and-defense/' },
    ],
  });

  SML.lessons.push({
    id: 'l-crypto-coins', course: 'crypto', order: 2, title: 'Bitcoin, Ethereum, stablecoins and altcoins', mins: 10, level: 'Beginner',
    summary: 'What each kind of coin is for, how its supply works and how much it swings.',
    idea: 'Not all crypto is alike. Bitcoin has a fixed supply, ether runs programs, stablecoins try to stay at $1, and most other tokens are long shots.',
    widget: 'coinMap',
    try: 'Tap each group to compare them, drag through bitcoin’s supply schedule, then put a stablecoin under stress.',
    body: [
      '<h3>Look at market cap, not price per coin</h3><p>A coin’s <b>market capitalization</b> is its price times the number of coins. A token at $0.0001 with a trillion coins is worth more in total than one at $50 with a million coins. In October 2026 the whole crypto market was worth about $2.8 to $2.9 trillion, and bitcoin alone was 58% to 60% of it.</p>',
      '<h3>Bitcoin: fixed supply, big swings</h3><p>Bitcoin launched in 2009 with a hard cap of 21 million coins. New coins come from mining, and the reward per block halves every 210,000 blocks, about every four years. The last <b>halving</b>, on April 20, 2024, cut it to 3.125 BTC; the next is expected around April 2028. About 20.1 million coins existed by October 2026.</p><p>It still swings far more than stocks: about 43% a year recently against roughly 15% for the S&amp;P 500. It fell 84% from its December 2017 peak and 77% from its November 2021 peak, and from its record of about $126,000 in October 2025 it dropped more than half by July 2026.</p>',
      '<h3>Ethereum: a world computer</h3><p>Ethereum runs <b>smart contracts</b>, programs that move money when conditions are met. They power stablecoins, lending and trading apps (<b>DeFi</b>) and NFTs. Every action pays a <b>gas fee</b> in ether. <b>Layer 2</b> networks bundle many transactions and settle them on Ethereum to cut fees. Ether has no fixed cap, and since 2022 it is secured by staking, which paid roughly 3% a year in 2026.</p><p><b>DeFi risks:</b> a bug in a smart contract can be drained in minutes, and bridges that move coins between chains are frequent targets. Hacks topped about $935 million in the first half of 2026, including KelpDAO (about $292 million) and Drift (about $285 million). When an app asks to spend your tokens, that approval can stay open; revoke the ones you no longer use.</p>',
      '<h3>Stablecoins: crypto’s dollars</h3><ul><li><b>Backed by reserves held by the issuer</b> (USDT, USDC): together about $255 billion of the roughly $301 billion stablecoin total in October 2026. The reserves are mostly cash-like assets; check the issuer’s attestations. They are only as safe as those reserves and the company behind them. Not FDIC-insured.</li><li><b>Backed by other crypto</b>: they hold extra collateral, which can fall at the same time as the market.</li><li><b>Algorithmic</b>: backed by code and confidence. TerraUSD lost its peg in May 2022 and investors lost an estimated $40 billion.</li></ul><p>The GENIUS Act, signed July 18, 2025, requires US payment stablecoins to hold 100% reserves in cash and short-term Treasuries, publish them monthly, and not pay interest to holders. It takes effect by January 18, 2027 at the latest.</p>',
      '<h3>Where US rules stand (October 2026)</h3><ul><li><b>Stablecoins:</b> the GENIUS Act was signed July 18, 2025 and takes effect by January 18, 2027 at the latest. Regulators missed the July 2026 deadline for final rules, and none were confirmed final as of October 2026.</li><li><b>Market structure:</b> the CLARITY Act, which would split oversight between the CFTC and the SEC, passed the House 294–134 in July 2025. A Senate vote to move it forward failed 49–50 on September 15, 2026.</li><li><b>Funds:</b> on September 17, 2025 the SEC approved generic listing standards, so exchanges can list qualifying crypto funds without a separate approval each time.</li><li><b>Government holdings:</b> a Strategic Bitcoin Reserve was created by executive order on March 6, 2025, funded with forfeited bitcoin. It had made no purchases as of June 2026.</li></ul><p>Rules can still change quickly, which is a risk of its own.</p>',
      '<h3>Altcoins and memecoins</h3><p>Thousands of other tokens exist. Some run large networks; many are hype. Warning signs: insiders holding most of the supply, big <b>token unlocks</b> coming, thin trading and promises of guaranteed returns. Most small coins never get back to their highs. See <a href="#l-crypto-risks">risks, scams and taxes</a>.</p>',
      '<h3>Staking</h3><p>On proof-of-stake chains you can lock coins to help secure the network and earn rewards. Rewards are taxed as income when you receive them, coins can be locked for a while, and staking through an exchange adds that company’s risk. Some spot ether ETFs now stake for you.</p>',
    ],
    example: {
      title: 'Halving math',
      intro: 'How much new bitcoin enters the market each day, and what the next halving changes.',
      steps: [
        'Bitcoin aims for one block about every 10 minutes: 6 an hour, 144 a day.',
        'Since April 2024 each block creates 3.125 new BTC: 144 × 3.125 = 450 new coins a day.',
        'At about $84,500 per coin (October 2026), that is about $38 million of new bitcoin a day that miners can sell to pay for power.',
        'After the next halving, expected around April 2028, the reward drops to 1.5625 BTC: 225 new coins a day.',
        'About 20.1 million of the 21 million already exist, roughly 95.7%. The rest trickles out over the following century.',
      ],
      result: 'The schedule is certain; the price is not. A halving cuts new supply, but demand decides where the price goes.',
    },
    mistakes: [
      'Thinking a coin at a fraction of a cent is cheap. Check the market cap and how many coins exist.',
      'Treating a stablecoin like a bank deposit. It is not FDIC-insured, and it depends on the issuer’s reserves.',
      'Buying a memecoin because it is trending. Many lose most of their value within months.',
      'Assuming every halving brings a rally. Past peaks came 12 to 18 months after halvings, but that is a pattern, not a law.',
    ],
    points: [
      'Judge a coin by market cap and supply rules, not its price per coin.',
      'Bitcoin is capped at 21 million coins; new issuance halves about every four years.',
      'Ethereum is a platform for smart contracts; ether pays fees and secures it through staking.',
      'Stablecoins are only as safe as their reserves.',
      'Most altcoins and memecoins lose most of their value.',
    ],
    terms: ['Bitcoin', 'Ethereum', 'Stablecoin', 'Altcoin', 'Halving', 'Smart contract'],
    glossary: [
      { t: 'Market capitalization', d: 'Price times the number of coins or shares. The real size of an asset.' },
      { t: 'Layer 2', d: 'A network that bundles many transactions and settles them on a main blockchain such as Ethereum, for lower fees.' },
      { t: 'Memecoin', d: 'A token built around a joke or internet trend, usually with no use beyond speculation.' },
      { t: 'Token unlock', d: 'A scheduled release of coins held by founders or early investors, which can add selling pressure.' },
    ],
    quiz: { q: 'A new token trades at $0.0001. What tells you whether it is “cheap”?', options: ['Its price: anything under a penny is cheap', 'Its market cap: price times the number of coins', 'How many people are talking about it online'], answer: 1, why: 'Price per coin means nothing without the supply. Market cap shows what the whole thing is valued at.' },
    sources: [
      { t: 'CoinGecko: bitcoin price, supply and record high', u: 'https://www.coingecko.com/en/coins/bitcoin' },
      { t: 'DefiLlama: stablecoin supply', u: 'https://defillama.com/stablecoins' },
      { t: 'White House fact sheet: GENIUS Act signed July 18, 2025', u: 'https://www.whitehouse.gov/fact-sheets/2025/07/fact-sheet-president-donald-j-trump-signs-genius-act-into-law/' },
      { t: 'bitcoin.org FAQ: supply cap and block time', u: 'https://bitcoin.org/en/faq' },
      { t: 'SEC: generic listing standards for commodity-based trust shares (September 17, 2025)', u: 'https://www.sec.gov/newsroom/press-releases/2025-121-sec-approves-generic-listing-standards-commodity-based-trust-shares' },
    ],
  });

  SML.lessons.push({
    id: 'l-crypto-custody', course: 'crypto', order: 3, title: 'Wallets, keys, exchanges and ETFs', mins: 9, level: 'Beginner',
    summary: 'Who holds the keys: exchanges, broker apps, ETFs, hot wallets and hardware wallets.',
    idea: 'Whoever holds the private key controls the coins. Pick your trade-off between convenience and control, and guard the seed phrase like cash.',
    widget: 'custodyPicker',
    try: 'Answer four questions to rank five ways to hold crypto. Then compare all five and tick “What if the company fails?”.',
    body: [
      '<h3>Addresses, keys and seed phrases</h3><ul><li>Your <b>address</b> is like an account number. You can share it to receive coins.</li><li>Your <b>private key</b> signs transactions. Whoever has it controls the coins.</li><li>Your <b>seed phrase</b>, 12 or 24 words, can rebuild your keys on any device. There is no password reset: lose it and the coins stay locked forever; leak it and they can be taken in seconds. Chainalysis estimated in 2020 that about 3.7 million bitcoin were probably lost for good.</li></ul>',
      '<h3>Letting a company hold it: exchanges and broker apps</h3><p>On an exchange or an app like Robinhood or Coinbase, the company holds the keys for you. It is convenient and you can reset a password. But your coins are only as safe as the company: it can be hacked, freeze withdrawals or go bankrupt. When FTX collapsed in November 2022, its founder had taken more than $8 billion of customer money; he was sentenced to 25 years. SIPC does not protect crypto that is not a security, and the FDIC does not insure crypto.</p>',
      '<h3>Spot ETFs: crypto in a regular brokerage or IRA</h3><p>Spot bitcoin ETFs started trading in January 2024 and spot ether ETFs in July 2024. You buy shares like any stock, including in an IRA, and never handle keys. The fund pays a custodian; you pay a yearly fee, and fees differ a lot: iShares’ IBIT charges 0.25%, Grayscale’s ETHE charges 2.5% and keeps 23% of its staking rewards, BlackRock’s staked ether fund ETHB charges 0.25% plus 18% of rewards, and Bitwise’s Solana fund BSOL charges 0.20%. US spot bitcoin ETFs held about $100 billion in October 2026. Spot funds for Solana, Litecoin and Hedera launched in late October 2025 and for XRP on November 13, 2025, and some ether funds now stake their coins. Trade-offs: trading only in market hours and no access to crypto apps. ETF shares get normal tax forms, and the wash-sale rule applies to them.</p>',
      '<h3>Holding it yourself: hot and cold wallets</h3><p>A <b>hot wallet</b> is an app on a phone or browser: handy for using crypto apps, but online and open to phishing and malware. A <b>cold wallet</b>, usually a hardware device, keeps keys offline and signs transactions on the device. Self-custody removes company risk and adds personal risk: you are the bank, the security team and the record keeper. You also track your own cost basis for taxes.</p>',
      '<h3>Seed phrase rules</h3><ul><li>Write it on paper or metal. Never photograph it, email it or save it in the cloud.</li><li>Never type it into a website or app you reached from a link, and never give it to “support”. Real support never asks.</li><li>Buy hardware wallets directly from the maker, never second-hand.</li><li>Keep a backup in a second safe place and tell a trusted person how to find it if something happens to you (see <a href="#l-estate">wills and beneficiaries</a>).</li></ul>',
    ],
    example: {
      title: 'Moving $8,000 from an exchange to a hardware wallet',
      steps: [
        'Buy the device directly from the maker’s own website, not from a marketplace seller.',
        'Set it up at home. It shows a 24-word seed phrase once; write it on paper and store it offline. No photos, no typing.',
        'On the exchange, withdraw a test amount of about $50 to the address shown on the device screen. Wait until it arrives.',
        'Withdraw the rest. Before confirming, compare the whole address on the device screen with where you are sending, at least the start, middle and end. Malware can swap addresses, and look-alike “poisoned” addresses can match the first and last characters.',
        'Store a second copy of the seed phrase somewhere separate and note in your estate papers how to find it.',
      ],
      result: 'No exchange failure can now freeze those coins. The trade-off: lose the device and both seed copies and the coins are gone for good.',
    },
    mistakes: [
      'Saving the seed phrase as a phone photo, email or cloud note, where a hack can find it.',
      'Typing the seed phrase into a website or giving it to someone claiming to be support. That is how wallets get emptied.',
      'Leaving large amounts on an exchange because it is convenient. Not your keys, not your coins.',
      'Having no plan for heirs. Coins in self-custody can be lost forever if nobody knows how to reach them.',
    ],
    points: [
      'Not your keys, not your coins: companies holding crypto can be hacked, freeze withdrawals or fail.',
      'SIPC and the FDIC do not protect crypto coins.',
      'Spot ETFs give crypto exposure in a regular brokerage or IRA without handling keys.',
      'A hardware wallet suits larger long-term holdings if you can protect the seed phrase.',
      'Never share your seed phrase with anyone.',
    ],
    terms: ['Private key', 'Seed phrase', 'Cold wallet', 'Self-custody', 'Spot bitcoin ETF', 'SIPC'],
    glossary: [
      { t: 'Wallet address', d: 'A public string of characters you share so others can send you crypto.' },
      { t: 'Custodian', d: 'A company that holds assets, or the keys to them, on someone else’s behalf.' },
    ],
    quiz: { q: 'Someone from “wallet support” asks for your 12 words to fix a problem. What should you do?', options: ['Send them so they can fix it quickly', 'Refuse: anyone with the words can take everything, and real support never asks', 'Send only the first six words'], answer: 1, why: 'The seed phrase is the master key. Anyone who asks for it is trying to steal your coins.' },
    sources: [
      { t: 'SEC Investor Bulletin: Crypto asset custody basics (December 12, 2025)', u: 'https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/crypto-asset-custody-basics-retail-investors-investor-bulletin-0' },
      { t: 'SIPC: What SIPC protects', u: 'https://www.sipc.org/for-investors/what-sipc-protects' },
      { t: 'US Attorney SDNY: Samuel Bankman-Fried sentenced to 25 years', u: 'https://www.justice.gov/usao-sdny/pr/samuel-bankman-fried-sentenced-25-years-prison' },
      { t: 'iShares Bitcoin Trust ETF (IBIT): fee and assets', u: 'https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf' },
    ],
  });
})();
