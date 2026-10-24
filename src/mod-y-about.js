/* About FiredBunny: story, first-paycheck visual, beliefs, live counts, how to use the site, feedback form.
 * Also the owner-only `feedbackInbox` widget. Prefix: .ab- */
(function () {
  'use strict';
  const SML = window.SML, S = SML.svg, ui = SML.ui, F = SML.fmt, esc = SML.esc;
  const $ = (sel, r) => (r || document).querySelector(sel);
  const $$ = (sel, r) => Array.from((r || document).querySelectorAll(sel));
  const hasRuntime = () => !!(window.claude && typeof window.claude.use === 'function');
  const use = (name) => { try { return hasRuntime() ? window.claude.use(name).catch(() => null) : Promise.resolve(null); } catch (e) { return Promise.resolve(null); } };
  const icon = (d) => `<svg class="ab-ic" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const arrow = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  SML.css(`
    .page-hdr.ab-hero .wrap{display:grid;gap:36px;grid-template-columns:minmax(0,1fr);align-items:center}
    @media(min-width:1024px){.page-hdr.ab-hero .wrap{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:56px}}
    .ab-hero .h-page{max-width:12ch;margin-top:18px}
    .ab-hero .lede{margin-top:22px;color:color-mix(in srgb,var(--ink) 78%,transparent);font-size:clamp(17px,1.5vw,19px);max-width:52ch}
    .ab-hero-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
    .ab-art{position:relative;border-radius:10px;overflow:hidden;background:#000;border:1px solid color-mix(in srgb,var(--flame) 45%,var(--line));box-shadow:0 0 0 1px color-mix(in srgb,var(--flame) 15%,transparent),0 30px 90px -30px color-mix(in srgb,var(--flame) 55%,transparent),0 0 60px -10px color-mix(in srgb,var(--gold) 30%,transparent)}
    .ab-art img{display:block;width:100%;height:auto;aspect-ratio:5/4;object-fit:cover;background:#070709}
    .ab-art figcaption{display:flex;justify-content:space-between;gap:12px;padding:10px 14px;border-top:1px solid color-mix(in srgb,var(--flame) 30%,transparent);font:600 10.5px var(--mono);letter-spacing:.18em;text-transform:uppercase;color:color-mix(in srgb,var(--ink) 72%,transparent)}
    .ab-art figcaption span:last-child{color:var(--gold)}
    .ab-story{display:grid;gap:32px;grid-template-columns:1fr}
    @media(min-width:1024px){.ab-story{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:56px;align-items:start}}
    .ab-prose p{font-size:17.5px;line-height:1.75;color:color-mix(in srgb,var(--ink) 86%,transparent);max-width:64ch;text-wrap:pretty}
    .ab-prose p + p{margin-top:18px}
    .ab-prose b{color:var(--ink)}
    .ab-sign{display:flex;align-items:center;gap:12px;margin-top:26px;font:600 12px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .ab-quote{position:relative;border-left:4px solid var(--flame);background:color-mix(in srgb,var(--flame) 7%,var(--surface));border-radius:0 var(--r) var(--r) 0;padding:24px 24px 22px}
    .ab-quote q{display:block;font-family:var(--display);font-size:clamp(30px,3.4vw,42px);line-height:1;text-transform:uppercase;color:var(--ink);quotes:none}
    .ab-quote q em{font-style:normal;color:var(--gold)}
    .ab-quote p{margin-top:14px;color:var(--muted);font-size:14.5px;line-height:1.55}
    .ab-facts{list-style:none;margin-top:18px;display:flex;flex-direction:column;gap:12px}
    .ab-facts li{display:flex;gap:12px;align-items:flex-start;font-size:15px;line-height:1.5;color:color-mix(in srgb,var(--ink) 85%,transparent)}
    .ab-facts li .fb-flame{margin-top:3px;flex:0 0 auto}
    .ab-beliefs{list-style:none;display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;grid-template-columns:1fr}
    @media(min-width:640px){.ab-beliefs{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1100px){.ab-beliefs{grid-template-columns:repeat(5,minmax(0,1fr))}}
    .ab-beliefs li{background:var(--surface);padding:22px 20px;display:flex;flex-direction:column;gap:10px}
    .ab-beliefs .ab-ic{color:var(--flame)}
    .ab-beliefs b{font-size:17px;font-weight:600;color:var(--ink)}
    .ab-beliefs p{font-size:14px;line-height:1.6;color:color-mix(in srgb,var(--ink) 66%,transparent)}
    .ab-counts{list-style:none;display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;grid-template-columns:repeat(2,minmax(0,1fr))}
    @media(min-width:768px){.ab-counts{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:1100px){.ab-counts{grid-template-columns:repeat(6,minmax(0,1fr))}}
    .ab-counts li{background:var(--surface)}
    .ab-counts a{display:flex;flex-direction:column;gap:8px;padding:20px;text-decoration:none;color:inherit;height:100%;transition:background-color .15s}
    .ab-counts a:hover{background:var(--surface-2)}
    .ab-counts b{font-family:var(--display);font-weight:400;font-size:clamp(46px,5vw,64px);line-height:.85;color:var(--gold)}
    .ab-counts span{font:600 11px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
    .ab-tracks{display:grid;gap:12px;grid-template-columns:1fr;margin-top:16px}
    @media(min-width:768px){.ab-tracks{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .ab-trk{display:flex;flex-direction:column;gap:6px;padding:16px 18px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);text-decoration:none;color:inherit;transition:border-color .15s}
    .ab-trk:hover{border-color:color-mix(in srgb,var(--flame) 55%,transparent)}
    .ab-trk b{font-family:var(--display);font-weight:400;font-size:28px;line-height:1;text-transform:uppercase;color:var(--ink)}
    .ab-trk small{font-size:13.5px;line-height:1.5;color:var(--muted)}
    .ab-steps{list-style:none;display:grid;gap:12px;grid-template-columns:1fr;counter-reset:abs}
    @media(min-width:768px){.ab-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1100px){.ab-steps{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .ab-steps a{display:flex;flex-direction:column;gap:10px;height:100%;padding:22px 20px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);text-decoration:none;color:inherit;transition:border-color .15s,background-color .15s}
    .ab-steps a:hover{border-color:color-mix(in srgb,var(--flame) 55%,transparent);background:var(--surface-2)}
    .ab-steps .n{font-family:var(--display);font-size:56px;line-height:.8;color:var(--accent)}
    .ab-steps b{font-size:17px;font-weight:600;color:var(--ink);line-height:1.3}
    .ab-steps p{font-size:14px;line-height:1.6;color:color-mix(in srgb,var(--ink) 66%,transparent)}
    .ab-steps .more{margin-top:auto}
    .ab-fb{display:grid;gap:28px;grid-template-columns:1fr;align-items:start}
    @media(min-width:1024px){.ab-fb{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:48px}}
    .ab-fb-side p{font-size:16.5px;line-height:1.7;color:color-mix(in srgb,var(--ink) 80%,transparent);max-width:48ch}
    .ab-fb-side p + p{margin-top:14px}
    .ab-fb-side .fb-tip{margin-top:20px}
    .ab-form{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:20px;display:flex;flex-direction:column;gap:18px}
    @media(min-width:768px){.ab-form{padding:26px}}
    .ab-form .fld > span{display:flex;justify-content:space-between;gap:10px}
    .ab-form textarea{font:400 15.5px/1.6 var(--sans);color:var(--ink);background:var(--bg);border:1px solid var(--input);border-radius:var(--r);padding:11px 12px;width:100%;min-height:150px;resize:vertical;min-width:0}
    .ab-form textarea:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 3px rgba(232,173,79,.2)}
    .ab-form textarea::placeholder{color:color-mix(in srgb,var(--muted) 70%,transparent)}
    .ab-form select optgroup{background:var(--surface);color:var(--muted)}
    .ab-form select option{background:var(--surface);color:var(--ink)}
    .ab-row2{display:grid;gap:14px;grid-template-columns:1fr}
    @media(min-width:640px){.ab-row2{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .ab-kind{display:flex;flex-wrap:wrap;gap:8px}
    .ab-kind button{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--muted);font:600 13.5px var(--sans);cursor:pointer;transition:border-color .15s,color .15s,background-color .15s}
    .ab-kind button i{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.5}
    .ab-kind button.on{color:var(--ink);border-color:var(--flame);background:color-mix(in srgb,var(--flame) 12%,var(--bg))}
    .ab-kind button.on i{background:var(--flame);opacity:1}
    .ab-cnt{font:500 11px var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:none}
    .ab-cnt.warn{color:var(--down)}
    .ab-send{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px}
    .ab-send .note{flex:1 1 220px}
    .ab-status{border-radius:var(--r);padding:14px 16px;font-size:15px;line-height:1.55;display:flex;gap:12px;align-items:flex-start}
    .ab-status .fb-mark{flex:0 0 auto}
    .ab-status.ok{background:color-mix(in srgb,var(--up) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--up) 40%,var(--line))}
    .ab-status.info{background:color-mix(in srgb,var(--info) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--info) 40%,var(--line))}
    .ab-status.err{background:color-mix(in srgb,var(--down) 10%,var(--surface));border:1px solid color-mix(in srgb,var(--down) 40%,var(--line))}
    .ab-status b{color:var(--ink)}
    .ab-privacy{font-size:13px;line-height:1.55;color:var(--muted);border-top:1px solid var(--line);padding-top:14px}
    .ab-pp .wg-ctrl{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
    .ab-leg{display:flex;flex-wrap:wrap;gap:6px 18px;padding:12px 16px 0;font:500 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
    .ab-leg i{display:inline-block;width:18px;height:3px;border-radius:2px;vertical-align:middle;margin-right:7px}
    .ab-inbox{display:flex;flex-direction:column}
    .ab-inbox .wg-bar{border-bottom:1px solid var(--line)}
    .ab-ilist{list-style:none}
    .ab-ilist li{padding:16px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
    .ab-ilist li:last-child{border-bottom:0}
    .ab-ilist li.done{opacity:.6}
    .ab-imeta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font:500 11.5px var(--mono);color:var(--muted)}
    .ab-imsg{font-size:15px;line-height:1.6;color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere}
    .ab-iact{display:flex;gap:8px}
    .ab-iact button{min-height:32px;padding:0 12px;font-size:12.5px}
    .ab-empty{padding:22px 16px;color:var(--muted);font-size:14.5px;line-height:1.6}
  `);

  /* ---------------- first paycheck widget ---------------- */
  // Same monthly habit, two start ages, growth after inflation compounded monthly; deposits at month end.
  const fv = (pm, rYear, months) => { const i = rYear / 100 / 12; return i ? pm * ((Math.pow(1 + i, months) - 1) / i) : pm * months; };
  SML.widgets.firstPaycheck = function (root) {
    const id = SML.uid('abp');
    root.classList.add('ab-pp');
    root.innerHTML = `
      <div class="wg-bar"><span class="meta">Second person waits</span><span class="grow"></span>${ui.seg(id + '-gap', [{ v: 5, label: '5 yrs' }, { v: 10, label: '10 yrs' }, { v: 15, label: '15 yrs' }], 10, 'How long the second person waits')}</div>
      <div class="ab-leg"><span><i style="background:var(--accent)"></i>Starts with the first paycheck</span><span><i style="background:var(--info)"></i>Starts later</span></div>
      <div class="wg-fig"></div>
      <div class="wg-ctrl">
        ${ui.slider({ id: id + '-m', label: 'Invested each month', min: 50, max: 1500, step: 25, value: 300, fmt: 'usd0' })}
        ${ui.slider({ id: id + '-a', label: 'Age at first paycheck', min: 18, max: 30, step: 1, value: 22, fmt: (v) => v + ' years old' })}
        ${ui.slider({ id: id + '-r', label: 'Growth after inflation', min: 2, max: 8, step: 0.5, value: 5, fmt: 'pct1' })}
      </div>
      <div class="wg-read">${ui.stat('Early starter at 62', id + '-ea', 'hl')}${ui.stat('Late starter at 62', id + '-la')}${ui.stat('Cost of waiting', id + '-cw')}${ui.stat('Late starter must invest', id + '-cu')}</div>
      <div class="wg-msg" id="${id}-msg"></div>
      <div class="wg-note">Today's dollars: growth is after inflation, compounded monthly, deposits at the end of each month. A teaching model with a steady return; real markets go up and down.</div>`;
    const fig = root.querySelector('.wg-fig');
    const st = ui.wire(root, () => draw(true));
    const end = 62;
    const draw = ui.responsive(fig, (W) => {
      const pm = st.n(id + '-m'), a0 = st.n(id + '-a'), r = st.n(id + '-r'), gap = Number(st.seg(id + '-gap')) || 10;
      const a1 = a0 + gap; const mA = (end - a0) * 12, mB = Math.max(0, (end - a1) * 12);
      const A = fv(pm, r, mA), B = fv(pm, r, mB);
      const catchUp = mB > 0 ? A / (fv(1, r, mB)) : Infinity;
      const H = Math.round(SML.clamp(W * 0.46, 220, 330));
      const compact = W < 480;
      const L = compact ? 12 : 16, Rm = compact ? 66 : 92, T = 22, Bm = 30;
      const x = SML.lin(a0, end, L, W - Rm), y = SML.lin(0, A * 1.08, H - Bm, T);
      let b = '';
      const yt = SML.ticks(0, A * 1.08, compact ? 3 : 4);
      yt.forEach((v) => { b += S.line(L, y(v), W - Rm, y(v), 's-grid'); const hit = Math.abs(y(v) - 4 - (T + 14)) < 14 && x(a1) + 6 < L + 50; if (v > 0 && !hit) b += S.text(L + 2, y(v) - 4, F.usd(v >= 1e6 ? v / 1e6 : v / 1e3, v >= 1e6 ? 1 : 0) + (v >= 1e6 ? 'M' : 'k'), 'xs mono mut'); });
      const ptsA = [], ptsB = [];
      for (let age = a0; age <= end; age += 0.5) { ptsA.push([x(age), y(fv(pm, r, (age - a0) * 12))]); ptsB.push([x(age), y(age < a1 ? 0 : fv(pm, r, (age - a1) * 12))]); }
      b += S.area(ptsA, H - Bm, 'f-acc-t') + S.area(ptsB, H - Bm, 'f-info-t');
      b += S.poly(ptsA, 's-acc w25') + S.poly(ptsB, 's-info w25');
      b += S.line(L, H - Bm, W - Rm, H - Bm, 's-line');
      const ages = compact ? [a0, a1, end] : [a0, a1, Math.round((a1 + end) / 2), end];
      ages.forEach((ag) => { b += S.line(x(ag), H - Bm, x(ag), H - Bm + 4, 's-mut') + S.text(x(ag), H - Bm + 17, String(ag), 'xs mono', 'middle'); });
      b += S.line(x(a1), T + 6, x(a1), H - Bm, 's-info dash2') + S.circle(x(a1), H - Bm, 4.5, 'f-info');
      b += S.text(x(a1) + 6, T + 14, compact ? 'starts at ' + a1 : 'second person starts at ' + a1, 'sm info b');
      const fmtEnd = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : '$' + Math.round(v / 1e3) + 'k');
      const ya = y(A), yb = y(B);
      b += S.circle(x(end), ya, 5, 'f-acc') + S.circle(x(end), yb, 5, 'f-info');
      const yl = Math.min(ya, yb - 18);
      b += S.text(x(end) + 9, yl + 4, fmtEnd(A), 'md mono b acc') + S.text(x(end) + 9, Math.max(yb + 4, yl + 22), fmtEnd(B), 'md mono b info');
      fig.innerHTML = S.wrap(W, H, `Investing ${F.usd(pm, 0)} a month from age ${a0} grows to about ${fmtEnd(A)} by 62; starting at ${a1} grows to about ${fmtEnd(B)}`, b);
      const set = (k, v) => { const el = document.getElementById(id + '-' + k); if (el) el.textContent = v; };
      set('ea', F.usd(A, 0)); set('la', F.usd(B, 0)); set('cw', F.usd(A - B, 0));
      set('cu', isFinite(catchUp) ? F.usd(catchUp, 0) + '/mo' : '—');
      const putA = pm * mA, putB = pm * mB;
      const share = A ? Math.round((1 - B / A) * 100) : 0;
      document.getElementById(id + '-msg').innerHTML = ui.msg('acc', 'First paycheck', `Starting at ${a0} instead of ${a1} means putting in only ${F.usd(putA - putB, 0)} more, yet ending with ${F.usd(A - B, 0)} more: about ${share}% of the early starter's pile comes from those first ${gap} years. To catch up, the late starter needs about ${isFinite(catchUp) ? F.usd(catchUp, 0) : '—'} a month instead of ${F.usd(pm, 0)}.`);
    });
  };

  /* ---------------- owner feedback inbox ---------------- */
  SML.widgets.feedbackInbox = function (root) {
    root.classList.add('ab-inbox');
    const id = SML.uid('abi');
    root.innerHTML = `<div class="wg-bar"><span class="meta">Feedback inbox</span><span class="grow"></span>${ui.seg(id + '-f', [{ v: 'new', label: 'New' }, { v: 'all', label: 'All' }, { v: 'done', label: 'Done' }], 'new', 'Filter feedback')}</div><div class="ab-ibody"><p class="ab-empty">Checking who is viewing…</p></div>`;
    const body = root.querySelector('.ab-ibody');
    let docs = [], db = null, unsub = null, alive = true;
    SML.onCleanup(() => { alive = false; if (unsub) try { unsub(); } catch (e) {} });
    const st = ui.wire(root, () => render());
    function entries() {
      const out = [];
      docs.forEach((d) => { const data = d.data() || {}; (data.entries || []).forEach((e, i) => out.push(Object.assign({ _doc: d.id, _i: i }, e))); });
      return out.sort((a, b) => (String(a.at) < String(b.at) ? 1 : -1));
    }
    function render() {
      if (!alive) return;
      const f = st.seg(id + '-f') || 'new';
      const all = entries(); const list = all.filter((e) => f === 'all' || (f === 'done' ? e.status === 'done' : e.status !== 'done'));
      if (!all.length) { body.innerHTML = `<p class="ab-empty">No feedback yet. When readers send ideas or corrections from the About page, they show up here, newest first.</p>`; return; }
      if (!list.length) { body.innerHTML = `<p class="ab-empty">Nothing in this view. ${f === 'new' ? 'You are all caught up.' : ''}</p>`; return; }
      body.innerHTML = `<ul class="ab-ilist">${list.map((e) => `<li class="${e.status === 'done' ? 'done' : ''}" data-doc="${esc(e._doc)}" data-eid="${esc(e.id || '')}">
        <div class="ab-imeta"><span class="pill ${e.kind === 'Correct an inaccuracy' ? 'dn' : e.kind === 'Idea' ? 'up' : e.kind === 'Something to improve' ? 'acc' : 'info'}"></span><span class="ab-iwhere"></span><span>${esc(fmtTime(e.at))}</span></div>
        <p class="ab-imsg"></p>
        <div class="ab-iact"><button type="button" class="btn btn-g" data-act="toggle">${e.status === 'done' ? 'Reopen' : 'Mark done'}</button></div></li>`).join('')}</ul>`;
      // user-written text goes in with textContent
      $$('.ab-ilist li', body).forEach((li, i) => { const e = list[i]; li.querySelector('.pill').textContent = e.kind || 'Feedback'; li.querySelector('.ab-iwhere').textContent = [e.where, e.page].filter(Boolean).join(' · ') || 'General'; li.querySelector('.ab-imsg').textContent = e.message || ''; });
    }
    body.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-act="toggle"]'); if (!b || !db) return;
      const li = b.closest('li'); const ref = db.doc('feedback/' + li.dataset.doc);
      b.disabled = true;
      try {
        const snap = await ref.get(); if (!snap.exists) return;
        const data = JSON.parse(JSON.stringify(snap.data()));
        (data.entries || []).forEach((e) => { if (e.id === li.dataset.eid) e.status = e.status === 'done' ? 'new' : 'done'; });
        await ref.update({ entries: data.entries || [] });
      } catch (e) { SML.toast('Could not update that entry. Try again in a moment.'); }
      finally { b.disabled = false; }
    });
    (async () => {
      const user = await use('user');
      const owner = user ? await user.isOwner() : false;
      if (!alive) return;
      if (!owner) { const sg = document.getElementById(id + '-f'); if (sg) sg.hidden = true; body.innerHTML = `<p class="ab-empty">The feedback inbox is visible only to the site owner${hasRuntime() ? '' : ', when this page runs on claude.ai'}.</p>`; return; }
      db = await use('db');
      if (!alive) return;
      if (!db) { body.innerHTML = `<p class="ab-empty">The inbox needs the page's storage, which is not available in this view.</p>`; return; }
      try {
        unsub = db.collection('feedback').onSnapshot((snap) => { docs = snap.docs; render(); }, () => { body.innerHTML = `<p class="ab-empty">The inbox could not load right now. Reload the page to try again.</p>`; });
      } catch (e) { body.innerHTML = `<p class="ab-empty">The inbox could not load right now.</p>`; }
    })();
  };
  function fmtTime(iso) { try { const d = new Date(iso); return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return String(iso || ''); } }

  /* ---------------- feedback sending ---------------- */
  const KINDS = ['Idea', 'Something to improve', 'Correct an inaccuracy', 'Other'];
  const PAGES = [['', 'General'], ['home', 'Home'], ['learn', 'Lessons'], ['assessment', 'Self-assessment'], ['dashboard', 'Dashboard'], ['tools', 'Tools'], ['calendar', 'Calendar'], ['play', 'Playground'], ['indicator', 'TradingView indicator'], ['sheets', 'Spreadsheets'], ['blog', 'Trade notes'], ['apps', 'Apps'], ['glossary', 'Glossary']];
  function whereOptions() {
    let h = `<optgroup label="Pages">${PAGES.map(([v, l]) => `<option value="${esc(v ? '#' + v : '')}">${esc(l)}</option>`).join('')}</optgroup>`;
    const tracks = SML.tracks || [];
    tracks.forEach((t) => {
      const cs = SML.courses.filter((c) => (c.track || 'trading') === t.id).sort((a, b) => a.n - b.n);
      const ls = cs.flatMap((c) => SML.lessons.filter((l) => l.course === c.id).sort((a, b) => (a.order || 0) - (b.order || 0)));
      if (ls.length) h += `<optgroup label="${esc(t.title)} lessons">${ls.map((l) => `<option value="#${esc(l.id)}">${esc(l.title)}</option>`).join('')}</optgroup>`;
    });
    return h;
  }
  /* What this view can do: 'db' (private to the owner), 'comments' (shell composer), or 'copy'. */
  let routeCache = null;
  function detectRoute() {
    if (routeCache) return routeCache;
    routeCache = (async () => {
      if (!hasRuntime()) return { kind: 'copy' };
      const [user, db, comments] = await Promise.all([use('user'), use('db'), use('comments')]);
      let uidv = null, canWrite = null;
      if (user) { try { uidv = await user.id(); canWrite = await user.can('data.write'); } catch (e) {} }
      if (db && uidv && canWrite !== false) return { kind: 'db', db, uid: uidv, comments };
      if (comments) return { kind: 'comments', comments };
      return { kind: 'copy' };
    })();
    return routeCache;
  }

  SML.pages.about = function (view) {
    const nTracks = (SML.tracks || []).length, nCourses = SML.courses.length, nLessons = SML.lessons.length, nTools = SML.tools.length, nGloss = SML.glossary.length, nDates = (SML.calendarEvents || []).length;
    const trackLessons = (tid) => SML.courses.filter((c) => (c.track || 'trading') === tid).reduce((s, c) => s + SML.lessons.filter((l) => l.course === c.id).length, 0);
    const beliefs = [
      [icon('<path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7c-2-4-6-3-5-1s5 1 5 1 4 1 5-1-3-3-5 1"/>'), 'Free, for good', 'No paywall, no course upsell, no "premium" tier for the important parts.'],
      [icon('<path d="M4 6h16M4 12h10M4 18h13"/>'), 'Plain words', 'Every term is explained the first time it shows up, and the glossary links each one to its lesson.'],
      [icon('<path d="M6 3v4M18 3v4M3 10h18"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 15l2.5 2.5L16 12"/>'), 'Play to learn', 'Drag it, step through it, break it. A picture you can touch beats a page of text.'],
      [icon('<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'), 'No hype', 'No hot tips and no promises. Risk comes first, and the boring habits get as much space as the exciting ones.'],
      [icon('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'), 'Education, not advice', 'Your situation is yours. For big tax, legal or money decisions, talk to a professional who knows your details.'],
    ];
    const steps = [
      ['#assessment', 'Take the self-assessment', 'Slide through goals, money, time, risk and temperament. Get your investor profile and a learning path made for you.', 'Start the assessment'],
      ['#learn', 'Pick a track, go lesson by lesson', 'Trading, Retirement &amp; Wealth or FIRE. Each lesson is one idea, a picture to play with, a worked example and a quick check.', 'Browse the tracks'],
      ['#tools', 'Run your own numbers', `${nTools} tools for sizing, options, taxes, housing and retirement, plus the market &amp; tax calendar for every key date.`, 'Open the tools'],
      ['#dashboard', 'Track it on your dashboard', 'Goals, net worth, household income, lesson progress and how your investor profile changes over the years.', 'Go to my dashboard'],
    ];
    view.innerHTML = `
      <header class="page-hdr ab-hero"><div class="wrap">
        <div>
          ${SML.kicker('', 'About FiredBunny')}
          <h1 class="h-page">The money school they <em>skipped</em></h1>
          <p class="lede">Hi, I'm FiredBunny. For ten years I collected money lessons in bits and pieces, mostly the hard way. This site puts all of it in one place, in plain words you can play with, for free.</p>
          <div class="ab-hero-cta"><a class="btn btn-p" href="#assessment">Find your investor profile ${arrow}</a><a class="btn btn-g" href="#ab-feedback" data-jump="ab-feedback">Send feedback</a></div>
        </div>
        <figure class="ab-art"><img src="${SML.brandLogo || SML.brandArt}" alt="FiredBunny logo: a relaxed white bunny in sunglasses lounging beside rising candlesticks" width="1000" height="800"><figcaption><span>Retire early</span><span>Stay chill</span></figcaption></figure>
      </div></header>

      <section class="chapter" aria-labelledby="ab-why"><div class="wrap">
        ${SML.chapHead('01', 'Why this exists', 'A note from the bunny.', '', 'ab-why')}
        <div class="ab-story">
          <div class="ab-prose">
            <p>I spent about ten years learning about money the slow way. A tip from a coworker. A mistake with a credit card. A tax form I did not understand until it cost me. A book here, a forum thread there. <b>Bits and pieces</b>, and nobody ever showed me how they fit together.</p>
            <p>School did not either. You can graduate able to solve for x without ever hearing how a 401(k) match works, how a credit card charges interest, what an index fund is, or why money you invest at 22 can be worth far more than money you invest at 32.</p>
            <p>That is why I think <b>every concept here matters from the day you earn your first salary</b>. How you manage that first paycheck shapes your life: the things you do, the things you buy, and how soon you can buy back your own time. Your freedom, really.</p>
            <p>This is the knowledge I wish someone had handed me early on. So I gathered all of it, turned it into lessons and tools you can play with, and I'm sharing it to help you skip some of the hard way.</p>
            <p class="ab-sign">${SML.bunnyMark(32)}<span>FiredBunny</span></p>
          </div>
          <aside>
            <div class="ab-quote"><q>Your first paycheck is your <em>first investment decision</em>.</q><p>Not because you need to pick stocks on day one, but because the habits you start then compound, good or bad.</p></div>
            <ul class="ab-facts">
              <li>${SML.flame(14)}<span>Ten years of notes, turned into ${nLessons} lessons across ${nTracks} tracks.</span></li>
              <li>${SML.flame(14)}<span>Every figure checked against official sources, with the date it was checked.</span></li>
              <li>${SML.flame(14)}<span>Spot something wrong or out of date? <a href="#ab-feedback" data-jump="ab-feedback">Tell me</a> and I'll fix it.</span></li>
            </ul>
          </aside>
        </div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ab-pay"><div class="wrap">
        ${SML.chapHead('02', 'Why start with your first paycheck', 'Same salary, same habit. The only difference is when it starts.', `<a class="more" href="#l-compound">Lesson: the power of compound interest ${arrow}</a>`, 'ab-pay')}
        ${SML.widgetHTML('firstPaycheck')}
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ab-bel"><div class="wrap">
        ${SML.chapHead('03', 'What FiredBunny believes', 'Five rules every page follows.', '', 'ab-bel')}
        <ul class="ab-beliefs">${beliefs.map(([ic, t, d]) => `<li>${ic}<b>${t}</b><p>${d}</p></li>`).join('')}</ul>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ab-in"><div class="wrap">
        ${SML.chapHead('04', 'What is inside', 'Everything here is free and works in your browser.', `<a class="more" href="#learn">All lessons ${arrow}</a>`, 'ab-in')}
        <ul class="ab-counts">
          <li><a href="#learn"><b>${nTracks}</b><span>Tracks</span></a></li>
          <li><a href="#learn"><b>${nCourses}</b><span>Courses</span></a></li>
          <li><a href="#learn"><b>${nLessons}</b><span>Lessons</span></a></li>
          <li><a href="#tools"><b>${nTools}</b><span>Tools</span></a></li>
          <li><a href="#glossary"><b>${nGloss}</b><span>Glossary terms</span></a></li>
          <li><a href="#calendar"><b>${nDates || '—'}</b><span>Calendar dates</span></a></li>
        </ul>
        <div class="ab-tracks">${(SML.tracks || []).map((t) => `<a class="ab-trk" href="#track-${t.id}"><span class="meta">Track ${String(t.n).padStart(2, '0')} · ${trackLessons(t.id)} lessons</span><b>${esc(t.title)}</b><small>${esc(t.blurb || '')}</small></a>`).join('')}</div>
      </div></section>

      <section class="chapter" style="padding-top:0" aria-labelledby="ab-how"><div class="wrap">
        ${SML.chapHead('05', 'How to use the site', 'Four steps. Do them in order the first time, then jump around.', '', 'ab-how')}
        <ol class="ab-steps">${steps.map(([h, t, d, cta], i) => `<li><a href="${h}"><span class="n">${String(i + 1).padStart(2, '0')}</span><b>${t}</b><p>${d}</p><span class="more">${cta} ${arrow}</span></a></li>`).join('')}</ol>
      </div></section>

      <section class="chapter" style="padding-top:0" id="ab-feedback" aria-labelledby="ab-fbh"><div class="wrap">
        ${SML.chapHead('06', 'Tell the bunny', 'Ideas, things to improve, and anything that looks wrong.', '', 'ab-fbh')}
        <div class="ab-fb">
          <div class="ab-fb-side">
            <p>Tax limits, rates and rules change every year. If a number looks off or a lesson is out of date, I would rather fix it today than have you act on it.</p>
            <p>Ideas are welcome too: a topic you wish were covered, a tool you would use, a part that confused you.</p>
            ${SML.bunnyTip('Point me to the exact lesson or page and, for corrections, the source you saw. It makes fixes much faster.', 'Bunny tip')}
          </div>
          <form class="ab-form" novalidate>
            <div class="fld"><span>What kind of feedback?</span><div class="ab-kind" role="group" aria-label="Kind of feedback">${KINDS.map((k, i) => `<button type="button" data-k="${esc(k)}" class="${i === 0 ? 'on' : ''}" aria-pressed="${i === 0}"><i></i>${esc(k)}</button>`).join('')}</div></div>
            <div class="ab-row2">
              <label class="fld"><span>Where (optional)</span><select name="where">${whereOptions()}</select></label>
              <label class="fld"><span>Or paste a link (optional)</span><input name="link" type="text" maxlength="300" placeholder="e.g. a lesson link or a source" autocomplete="off"></label>
            </div>
            <label class="fld"><span>Your message <span class="ab-cnt" aria-live="polite">0 / 2,000</span></span><textarea name="message" maxlength="2000" placeholder="What should change, and why? For corrections, what did you expect to see?"></textarea></label>
            <div class="ab-send"><button type="submit" class="btn btn-p">Send feedback ${arrow}</button><span class="note ab-route">Checking how this page can send…</span></div>
            <div class="ab-status" role="status" hidden></div>
            <p class="ab-privacy">What is stored when you send: your message, the kind and page you picked, the time, and an opaque account id that keeps each person's notes together (it is not your name or email). Only you and the site owner can read it.</p>
          </form>
        </div>
      </div></section>
      <section class="chapter" style="padding-top:0" id="ab-inbox-sec" hidden aria-labelledby="ab-inh"><div class="wrap">
        ${SML.chapHead('', 'Your feedback inbox', 'Only you see this section, as the site owner.', '', 'ab-inh')}
        ${SML.widgetHTML('feedbackInbox')}
      </div></section>`;

    // jump links without changing the route
    $$('[data-jump]', view).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const el = document.getElementById(a.dataset.jump); if (el) el.scrollIntoView({ behavior: SML.reduced() ? 'auto' : 'smooth', block: 'start' }); }));

    const form = $('.ab-form', view), msg = form.querySelector('textarea'), cnt = form.querySelector('.ab-cnt');
    const status = form.querySelector('.ab-status'), routeEl = form.querySelector('.ab-route'), sendBtn = form.querySelector('[type="submit"]');
    let kind = KINDS[0];
    form.querySelector('.ab-kind').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k;
      $$('.ab-kind button', form).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      msg.placeholder = kind === 'Correct an inaccuracy' ? 'What looks wrong, what should it say, and where did you see the right figure?' : kind === 'Idea' ? 'What would you like to see on FiredBunny?' : 'What should change, and why?';
    });
    const updCnt = () => { const n = msg.value.length; cnt.textContent = n.toLocaleString('en-US') + ' / 2,000'; cnt.classList.toggle('warn', n > 1900); };
    msg.addEventListener('input', updCnt);
    const showStatus = (cls, html) => { status.hidden = false; status.className = 'ab-status ' + cls; status.innerHTML = SML.bunnyMark(26) + `<div>${html}</div>`; };

    let alive = true; SML.onCleanup(() => { alive = false; });
    detectRoute().then((r) => {
      if (!alive) return;
      routeEl.textContent = r.kind === 'db' ? 'Goes privately to FiredBunny.' : r.kind === 'comments' ? 'Opens the comment box on this page, where you post it.' : 'Sending is not available in this view; the button copies your message.';
      const priv = form.querySelector('.ab-privacy');
      if (r.kind === 'comments') priv.textContent = 'Your message is copied, then you post it as a comment on this page. Comments show your name and are visible to people who can see this page\'s comments.';
      if (r.kind === 'copy') { sendBtn.firstChild.textContent = 'Copy my message '; priv.textContent = 'Nothing is stored from this view. Your message is only copied to your clipboard, so you can paste it wherever you like.'; }
    });
    (async () => { const user = await use('user'); const own = user ? await user.isOwner() : false; if (alive && own) { const sec = $('#ab-inbox-sec', view); if (sec) sec.hidden = false; } })();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = msg.value.trim();
      if (text.length < 5) { showStatus('err', '<b>Add a few words first.</b> Tell me what you noticed or what you would like to see.'); msg.focus(); return; }
      const sel = form.querySelector('select');
      const where = sel.value ? sel.options[sel.selectedIndex].text : 'General';
      const link = form.querySelector('[name="link"]').value.trim().slice(0, 300);
      const entry = { id: SML.account ? SML.account.newId('f') : 'f-' + Date.now().toString(36), at: new Date().toISOString(), kind, where: (sel.value ? sel.value + ' ' : '') + where, message: text.slice(0, 2000), page: link, status: 'new' };
      const plain = `[${kind}] ${where}${link ? ' · ' + link : ''}\n\n${text}`;
      sendBtn.disabled = true;
      try {
        const r = await detectRoute();
        if (r.kind === 'db') {
          try {
            const ref = r.db.doc('feedback/' + r.uid);
            const snap = await ref.get();
            const prev = snap.exists && Array.isArray((snap.data() || {}).entries) ? JSON.parse(JSON.stringify(snap.data().entries)) : [];
            prev.push(entry);
            await ref.set({ entries: prev.slice(-50), updatedAt: entry.at });
            msg.value = ''; updCnt();
            showStatus('ok', `<b>Hop hop. Sent.</b> Thank you. It went straight to FiredBunny${kind === 'Correct an inaccuracy' ? ', and corrections get looked at first' : ''}.`);
            return;
          } catch (err) {
            if (!r.comments) throw err;
            routeCache = Promise.resolve({ kind: 'comments', comments: r.comments });
            return openComments(r.comments, plain);
          }
        }
        if (r.kind === 'comments') return openComments(r.comments, plain);
        SML.copy(plain, 'Message copied');
        showStatus('info', '<b>Copied, so nothing is lost.</b> Sending from this page is not available in this view. Paste your message wherever you share feedback with FiredBunny.');
      } catch (err) {
        SML.copy(plain, 'Message copied');
        showStatus('err', '<b>That did not go through.</b> Your message is copied so you do not lose it. Try again in a moment.');
      } finally { sendBtn.disabled = false; }
    });
    async function openComments(comments, plain) {
      SML.copy(plain, 'Message copied');
      try {
        const res = await comments.openComposer({ element: form });
        if (res && res.opened) showStatus('info', '<b>The comment box is open.</b> Your message is copied: paste it there and post. Comments are visible to people who can see this page\'s comments.');
        else showStatus('info', '<b>Your message is copied.</b> Click the page once, then press Send again to open the comment box, or add a comment from the page\'s comment menu.');
      } catch (err) {
        showStatus('info', '<b>Copied, so nothing is lost.</b> Sending from this page is not available in this view.');
      }
    }
    return 'About FiredBunny';
  };
})();
