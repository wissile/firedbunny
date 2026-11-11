/* Offline & app: registers the service worker (src/sw.js), downloads lesson audio for offline listening, offers
   "install the app", and renders the #offline page.
   Website only: the claude.ai preview has no service worker and no audio files, so everything here stays off there.
   window.FB_ASSETS (written by tools/build.py) = { v: build version, files: { 'audio/...': [bytes, hash] } }.
   SML.assetURL(path) -> '/audio/x.mp4?v=<hash>' so a re-recorded file never plays from an old copy.
   SML.offline: enabled, status(url), progress(url), get(urls), remove(urls), removeAll(), catalog(), on(fn). */
(function () {
  'use strict';
  const SML = window.SML, esc = SML.esc;
  const A = window.FB_ASSETS || null;
  const isWeb = SML.host === 'web' && /^https?:$/.test(location.protocol);
  const secure = location.protocol === 'https:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const swOK = isWeb && secure && 'serviceWorker' in navigator;
  const enabled = isWeb && secure && 'caches' in window && !!A;
  const AUDIO = 'fb-audio-v1';
  const SHELL = A ? 'fb-shell-' + A.v : '';
  const PAR = 3; // files downloaded at once

  const rel = (p) => String(p || '').replace(/^\/+/, '').split('?')[0];
  SML.assetURL = (p) => { const f = A && A.files[rel(p)]; return isWeb && f ? '/' + rel(p) + '?v=' + f[1] : p; };
  const sizeOf = (u) => { const f = A && A.files[rel(u)]; return f ? f[0] : 0; };
  const abs = (u) => new URL(u, location.origin + '/');
  const MB = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : b >= 1e7 ? Math.round(b / 1e6) + ' MB' : (b / 1e6).toFixed(1) + ' MB');

  /* ---------------- events ---------------- */
  const subs = new Set();
  let tickT = 0;
  function emit(kind) {
    if (kind === 'progress') { if (tickT) return; tickT = setTimeout(() => { tickT = 0; subs.forEach((f) => { try { f('progress'); } catch (e) {} }); }, 200); return; }
    subs.forEach((f) => { try { f(kind || 'state'); } catch (e) {} });
  }
  const on = (fn) => { subs.add(fn); return () => subs.delete(fn); };

  /* ---------------- service worker ---------------- */
  let shellReady = false, swState = swOK ? 'starting' : 'off';
  function checkShell() {
    if (!enabled) return Promise.resolve(false);
    return caches.has(SHELL).then((h) => { shellReady = h; if (h) swState = 'ready'; emit(); return h; }).catch(() => false);
  }
  if (swOK) {
    const reg = () => navigator.serviceWorker.register('/sw.js').then((r) => {
      const w = r.installing || r.waiting;
      if (w) w.addEventListener('statechange', () => { if (w.state === 'activated') checkShell(); });
      return checkShell();
    }).catch((e) => { swState = 'failed'; console.warn('[offline] service worker did not register', e); emit(); });
    if (document.readyState === 'complete') reg(); else window.addEventListener('load', reg);
    // The site opens from the copy saved on this device, so a new deploy arrives in the background: when its service
    // worker takes over from the one this page started with, offer a reload. (No offer on the very first visit.)
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdate(); checkShell(); });
  }
  function showUpdate() {
    if (document.getElementById('fb-upd')) return;
    const d = document.createElement('div'); d.id = 'fb-upd'; d.className = 'fb-upd'; d.setAttribute('role', 'status');
    d.innerHTML = '<span>A new version of FiredBunny is ready.</span><button type="button" class="btn btn-p sm" data-upd="go">Reload</button><button type="button" class="fb-upd-x" data-upd="x" aria-label="Later">×</button>';
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-upd]'); if (!b) return; if (b.dataset.upd === 'go') location.reload(); else d.remove(); });
    document.body.appendChild(d);
  }

  /* ---------------- downloads ---------------- */
  let have = new Map(); // pathname -> pathname + ?v=... of the saved copy
  function refresh() {
    if (!enabled) return Promise.resolve();
    return caches.open(AUDIO).then((c) => c.keys()).then((keys) => {
      have = new Map(); keys.forEach((r) => { const u = new URL(r.url); have.set(u.pathname, u.pathname + u.search); }); emit();
    }).catch(() => {});
  }
  const Q = { list: [], active: new Map(), total: 0, done: 0, failed: 0, bytes: 0, got: 0, error: '', cancelled: false };
  function status(url) {
    const u = abs(url); const k = have.get(u.pathname);
    if (Q.active.has(u.href) || Q.list.includes(u.href)) return 'busy';
    if (!k) return 'none';
    return k === u.pathname + u.search ? 'done' : 'old';
  }
  function progress(url) { const a = Q.active.get(abs(url).href); const n = sizeOf(url); return a && n ? Math.min(1, a.got / n) : 0; }
  let asked = false;
  function persist() { if (asked) return; asked = true; try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(() => emit()); } catch (e) {} }
  function get(urls) {
    if (!enabled) return 0;
    if (Q.error === 'quota') Q.error = '';
    if (!Q.total) Q.cancelled = false;
    let n = 0;
    urls.forEach((x) => { const h = abs(x).href; if (status(h) === 'done' || status(h) === 'busy') return; Q.list.push(h); Q.total++; Q.bytes += sizeOf(h); n++; });
    if (n) { persist(); pump(); emit(); }
    return n;
  }
  function pump() {
    while (Q.active.size < PAR && Q.list.length) {
      const u = Q.list.shift(); const ctl = new AbortController(); const job = { ctl, got: 0 }; Q.active.set(u, job);
      fetchOne(u, job).then(() => { Q.done++; }, (e) => {
        Q.got -= job.got;
        if (e && e.name === 'AbortError') return;
        Q.failed++;
        if (e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.message)))) { Q.error = 'quota'; cancel(true); }
        else if (!Q.error) Q.error = navigator.onLine === false ? 'offline' : 'network';
      }).finally(() => {
        Q.active.delete(u);
        if (!Q.list.length && !Q.active.size) finish();
        pump(); emit();
      });
    }
  }
  async function fetchOne(u, job) {
    const res = await fetch(u, { signal: job.ctl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const type = res.headers.get('content-type') || 'audio/mp4';
    let body;
    if (res.body && res.body.getReader) {
      const rd = res.body.getReader(); const parts = [];
      for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); job.got += value.length; Q.got += value.length; emit('progress'); }
      body = new Blob(parts, { type });
    } else { body = await res.blob(); job.got = body.size; Q.got += body.size; }
    const cache = await caches.open(AUDIO);
    await cache.put(u, new Response(body, { headers: { 'Content-Type': type, 'Content-Length': String(body.size) } }));
    const p = new URL(u).pathname;
    const old = (await cache.keys()).filter((r) => { const x = new URL(r.url); return x.pathname === p && x.href !== u; });
    await Promise.all(old.map((r) => cache.delete(r)));
    have.set(p, p + new URL(u).search);
  }
  let last = null; // summary of the last finished batch
  function finish() {
    if (!Q.total) return;
    last = { done: Q.done, failed: Q.failed, error: Q.error };
    if (Q.cancelled) SML.toast(Q.done ? `Stopped. ${Q.done} recording${Q.done === 1 ? '' : 's'} saved.` : 'Download stopped.');
    else if (Q.total > 1 || Q.failed) SML.toast(Q.failed ? (Q.error === 'quota' ? 'Not enough space on this device for every download.' : `${Q.done} saved, ${Q.failed} could not download. Try again on a steady connection.`) : `${Q.done} recordings saved for offline.`);
    else if (Q.done === 1) SML.toast('Saved for offline listening.');
    Q.total = Q.done = Q.failed = Q.bytes = Q.got = 0; Q.cancelled = false; if (Q.error !== 'quota') Q.error = '';
  }
  function cancel(keepError) {
    if (Q.total) Q.cancelled = true;
    Q.list.forEach((u) => { Q.bytes -= sizeOf(u); Q.total--; }); Q.list = [];
    if (!Q.active.size) finish();
    Q.active.forEach((j) => { try { j.ctl.abort(); } catch (e) {} });
    if (!keepError) Q.error = '';
    emit();
  }
  async function remove(urls) {
    if (!enabled) return;
    const paths = new Set(urls.map((x) => abs(x).pathname));
    const cache = await caches.open(AUDIO);
    const keys = await cache.keys();
    await Promise.all(keys.filter((r) => paths.has(new URL(r.url).pathname)).map((r) => cache.delete(r)));
    paths.forEach((p) => have.delete(p));
    emit();
  }
  async function removeAll() { cancel(); if (enabled) { await caches.delete(AUDIO); have = new Map(); emit(); } }

  /* every recording the site has, grouped by track (lessons) plus the earnings calls */
  function catalog() {
    const N = SML.narration || {};
    const groups = (SML.tracks || []).map((t) => ({ id: t.id, title: t.title, items: [] }));
    const gi = {}; groups.forEach((g) => { gi[g.id] = g; });
    (SML.courses || []).slice().sort((a, b) => (a.n || 0) - (b.n || 0)).forEach((c) => {
      const g = gi[c.track || 'trading']; if (!g) return;
      (SML.lessons || []).filter((l) => l.course === c.id).sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((l) => {
        const r = N[l.id]; if (!r || !sizeOf(r.file)) return;
        g.items.push({ id: l.id, title: l.title, href: '#' + l.id, url: abs(SML.assetURL(r.file)).href, bytes: sizeOf(r.file), dur: r.dur, file: 'FiredBunny - ' + l.title });
      });
    });
    const calls = { id: 'calls', title: 'Earnings call recordings', items: [] };
    let mp4 = true; try { mp4 = !!new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"'); } catch (e) {}
    const S = (SML.rcCall && SML.rcCall.scripts) || {};
    Object.keys(S).forEach((k) => {
      const s = S[k]; const p = `audio/${s.file}.${mp4 || !sizeOf(`audio/${s.file}.webm`) ? 'mp4' : 'webm'}`;
      if (!sizeOf(p)) return;
      calls.items.push({ id: s.file, title: `${s.company}: ${s.title}`, href: '#tool-call', url: abs(SML.assetURL(p)).href, bytes: sizeOf(p), file: `FiredBunny - ${s.company} ${s.title}` });
    });
    return groups.filter((g) => g.items.length).concat(calls.items.length ? [calls] : []);
  }

  /* ---------------- install ---------------- */
  let deferred = null;
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
  const ua = navigator.userAgent || '';
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /android/i.test(ua);
  if (isWeb) {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
    window.addEventListener('appinstalled', () => { deferred = null; SML.toast('FiredBunny is installed.'); emit(); });
    window.addEventListener('offline', () => { SML.toast(enabled && shellReady ? 'You’re offline. Lessons, tools and downloaded audio still work.' : 'You’re offline.'); emit(); });
    window.addEventListener('online', () => { SML.toast('Back online.'); emit(); });
  }
  async function install() {
    if (!deferred) return false;
    const e = deferred; deferred = null;
    try { await e.prompt(); const c = await e.userChoice; emit(); return c && c.outcome === 'accepted'; } catch (err) { emit(); return false; }
  }

  SML.offline = { enabled, status, progress, get, remove, removeAll, cancel, catalog, on, sizeOf, queue: Q, install, canInstall: () => !!deferred, standalone };
  if (enabled) refresh();

  /* ---------------- the #offline page ---------------- */
  SML.css(`
    .fb-upd{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:10px;width:max-content;max-width:calc(100vw - 24px);padding:8px 8px 8px 16px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--surface) 94%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 40px -10px rgba(0,0,0,.6);font:500 14px var(--sans);color:var(--ink)}
    .fb-upd-x{background:transparent;border:0;color:var(--muted);font-size:20px;line-height:1;cursor:pointer;padding:4px 8px;min-height:34px}
    .off{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;padding-block:32px 80px}
    .off-card{border:1px solid var(--line);border-radius:calc(var(--r) * 2);background:var(--surface);padding:20px;display:flex;flex-direction:column;gap:12px;min-width:0}
    .off-wide{grid-column:1 / -1}
    .off-card h2{font:600 17px/1.3 var(--sans);color:var(--ink);margin:0;display:flex;align-items:center;gap:10px}
    .off-card p{margin:0;color:var(--text);line-height:1.55;font-size:14.5px}
    .off-note{font-size:13px !important;color:var(--muted) !important}
    .off-ok{display:inline-flex;align-items:center;gap:6px;font:600 12px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--up)}
    .off-wait{color:var(--accent)}
    .off-no{color:var(--muted)}
    .off-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .off-bar{height:8px;border-radius:4px;background:var(--line);overflow:hidden}
    .off-bar i{display:block;height:100%;background:var(--up);transition:width .2s}
    .off-bar.busy i{background:var(--accent)}
    .off-steps{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:8px;color:var(--text);font-size:14.5px;line-height:1.5}
    .off-steps svg{vertical-align:-3px}
    .off-list{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;color:var(--text);font-size:14.5px;line-height:1.5}
    .off-trk{border-top:1px solid var(--line);padding-top:12px;display:flex;flex-direction:column;gap:8px}
    .off-trk-h{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}
    .off-trk-h b{font:600 15px var(--sans);color:var(--ink)}
    .off-trk-h small{font:500 12px var(--mono);color:var(--muted)}
    .off-trk-h .btn{margin-left:auto}
    .off-trk details summary{cursor:pointer;font:500 13px var(--sans);color:var(--muted);min-height:32px;display:flex;align-items:center}
    .off-trk details summary:hover{color:var(--ink)}
    .off-items{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column}
    .off-items li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:4px 10px;align-items:center;padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent)}
    .off-items li:last-child{border-bottom:0}
    .off-items a.t{color:var(--ink);text-decoration:none;font-size:14px;line-height:1.35;min-width:0}
    .off-items a.t:hover{color:var(--accent)}
    .off-items small{display:block;font:500 11.5px var(--mono);color:var(--muted);margin-top:2px}
    .off-items .st{font:600 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
    .off-items .st.ok{color:var(--up)}
    .off-items .st.old{color:var(--accent)}
    .off-ib{display:flex;gap:6px;align-items:center}
    .off-ib button,.off-ib a{min-height:34px;min-width:34px;padding:0 10px;border-radius:var(--r);border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 12px var(--sans);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;gap:6px}
    .off-ib button:hover,.off-ib a:hover{border-color:var(--input)}
    .off-ib svg{width:14px;height:14px}
    @media (max-width:820px){.off{grid-template-columns:minmax(0,1fr)}}
    @media (max-width:520px){.off-items li{grid-template-columns:minmax(0,1fr) auto}.off-items .st{grid-column:1;grid-row:2}.off-ib{grid-column:2;grid-row:1 / span 2}.off-trk-h .btn{margin-left:0}}
  `);
  const ICO = {
    down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-label="Add"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18h2"/></svg>',
    head: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/></svg>',
  };
  SML.offlineIcons = ICO;
  const fmtMin = (s) => (s ? Math.max(1, Math.round(s / 60)) + ' min' : '');

  SML.pages.offline = function (view) {
    view.innerHTML = `
      ${SML.pageHeader('', 'Offline & app', 'Take it <em>offline</em>.', '<p>Every lesson, tool, simulator and the glossary work without a connection once this device has the site. Download lesson audio to listen on a plane, the subway or a run.</p>')}
      <div class="wrap off" data-off="root">
        <section class="off-card" aria-labelledby="off-h1"><h2 id="off-h1">${ICO.wifi}This device</h2><div data-off="status"></div></section>
        <section class="off-card" aria-labelledby="off-h2"><h2 id="off-h2">${ICO.phone}Install the app</h2><div data-off="install"></div></section>
        <section class="off-card off-wide" aria-labelledby="off-h3"><h2 id="off-h3">${ICO.head}Lesson audio</h2><div data-off="audio"></div></section>
        <section class="off-card off-wide" aria-labelledby="off-h4"><h2 id="off-h4">What works offline</h2>
          <ul class="off-list">
            <li><b>Works offline:</b> every lesson, worked example and quiz, all tools and simulators, the trade replay, the calendar, the glossary, your dashboard and settings. Your progress saves on this device as usual.</li>
            <li><b>Listening offline:</b> downloaded audio plays in the natural voice. A lesson you have not downloaded reads aloud with your device’s own voice instead.</li>
            <li><b>Needs a connection:</b> live earnings lookups (companies you looked up before on this device still open offline) and links to other websites.</li>
            <li><b>Updates:</b> when you are online, FiredBunny loads the newest version and saves it for next time.</li>
          </ul>
        </section>
      </div>`;
    if (!enabled) {
      const why = SML.host === 'claude' ? 'Offline mode, downloads and the app work on the FiredBunny website, not in this preview.' : !secure ? 'Offline mode needs the secure (https) address of the site.' : 'This browser does not support offline storage for websites.';
      view.querySelector('[data-off="status"]').innerHTML = `<p>${esc(why)}</p>${SML.host === 'claude' ? '<p class="off-note">Open <b>firedbunny.com</b> in your phone’s browser to install it and download audio.</p>' : ''}`;
      view.querySelector('[data-off="install"]').innerHTML = `<p class="off-note">Available on the website.</p>`;
      view.querySelector('[data-off="audio"]').innerHTML = `<p class="off-note">Available on the website.</p>`;
      return 'Offline & app';
    }
    const $ = (s) => view.querySelector(s);
    const openSet = new Set();
    let est = null, persisted = null;
    const storage = () => { try { if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((e) => { est = e; paintStatus(); }); if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then((p) => { persisted = p; paintStatus(); }); } catch (e) {} };

    function paintStatus() {
      const el = $('[data-off="status"]'); if (!el) return;
      const ready = shellReady;
      const line = ready ? `<span class="off-ok">${ICO.check}Ready offline</span>` : swState === 'failed' ? '<span class="off-ok off-no">Not available</span>' : '<span class="off-ok off-wait">Getting ready…</span>';
      const free = est && est.quota ? Math.max(0, est.quota - (est.usage || 0)) : null;
      el.innerHTML = `<div class="off-row">${line}<span class="off-note">${navigator.onLine === false ? 'You’re offline right now.' : 'You’re online.'}</span></div>
        <p>${ready ? 'This device has saved the whole site: every page opens without a connection, even after you close the browser.' : swState === 'failed' ? 'This browser did not let FiredBunny save itself for offline use. Lessons still work while you are online.' : 'Saving the site on this device. This takes a few seconds the first time.'}</p>
        ${est ? `<p class="off-note">FiredBunny uses ${MB(est.usage || 0)} on this device${free != null ? ` · about ${MB(free)} more is available to it` : ''}.${persisted === true ? ' Your downloads are protected from automatic clean-up.' : persisted === false ? ' Your browser may clear downloads if the device runs low on space.' : ''}</p>` : ''}`;
    }
    function paintInstall() {
      const el = $('[data-off="install"]'); if (!el) return;
      if (standalone()) { el.innerHTML = `<span class="off-ok">${ICO.check}Installed</span><p>You’re using the FiredBunny app. It opens from your home screen, full screen, and works offline.</p>`; return; }
      if (deferred) { el.innerHTML = `<p>Add FiredBunny to your ${android ? 'home screen' : 'apps'}: it opens like an app, full screen, and works offline.</p><div class="off-row"><button type="button" class="btn btn-p" data-off-act="install">${ICO.down}Install FiredBunny</button></div>`; return; }
      if (ios) {
        el.innerHTML = `<p>Put FiredBunny on your home screen. It opens full screen like an app and keeps your downloads.</p>
          <ol class="off-steps"><li>In Safari, tap the <b>Share</b> button ${ICO.share} at the bottom (or top) of the screen.</li><li>Scroll down and tap <b>Add to Home Screen</b> ${ICO.plus}.</li><li>Tap <b>Add</b>. Open FiredBunny from your home screen from now on.</li></ol>
          <p class="off-note">On iPhone and iPad, install it before downloading audio: Safari can clear saved files for websites you have not opened in a few weeks, but not for apps on your home screen.</p>`;
        return;
      }
      if (android) { el.innerHTML = `<p>Put FiredBunny on your home screen. It opens like an app and works offline.</p><ol class="off-steps"><li>Open your browser’s menu (<b>⋮</b>).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Confirm. Open FiredBunny from your home screen from now on.</li></ol>`; return; }
      el.innerHTML = `<p>Install FiredBunny as an app on this computer: it gets its own window and works offline.</p><ol class="off-steps"><li>In Chrome or Edge, click the install icon at the right end of the address bar, or open the menu and choose <b>Install FiredBunny</b> (or <b>Apps</b>, then <b>Install</b>).</li><li>In Safari on a Mac, choose <b>File</b>, then <b>Add to Dock</b>.</li></ol><p class="off-note">On your phone, open firedbunny.com and come back to this page for the steps.</p>`;
    }
    function counts(items) { let n = 0, b = 0; items.forEach((it) => { if (status(it.url) === 'done') { n++; b += it.bytes; } }); return { n, b }; }
    function row(it) {
      const s = status(it.url); const pct = Math.round(progress(it.url) * 100);
      const st = s === 'done' ? `<span class="st ok">${ICO.check} Saved</span>` : s === 'busy' ? `<span class="st">${pct ? pct + '%' : 'Waiting'}</span>` : s === 'old' ? '<span class="st old">Update</span>' : '<span class="st">Not saved</span>';
      const btn = s === 'done' ? `<button type="button" data-off-rm="${esc(it.url)}" aria-label="Remove the download of ${esc(it.title)}" title="Remove download">${ICO.x}</button>`
        : s === 'busy' ? '' : `<button type="button" data-off-get="${esc(it.url)}" aria-label="Download ${esc(it.title)}" title="Download for offline">${ICO.down}</button>`;
      return `<li><a class="t" href="${it.href}">${esc(it.title)}<small>${MB(it.bytes)}${it.dur ? ' · ' + fmtMin(it.dur) : ''}</small></a>${st}<span class="off-ib">${btn}<a href="${esc(it.url)}" download="${esc(it.file)}.m4a" title="Save the audio file to this device" aria-label="Save the audio file of ${esc(it.title)}">File</a></span></li>`;
    }
    function paintAudio() {
      const el = $('[data-off="audio"]'); if (!el) return;
      el.querySelectorAll('details[data-g]').forEach((d) => { if (d.open) openSet.add(d.dataset.g); else openSet.delete(d.dataset.g); });
      const cat = catalog(); const all = cat.flatMap((g) => g.items);
      const tot = all.reduce((s, it) => s + it.bytes, 0); const c = counts(all);
      const busy = Q.total > 0;
      const qpct = busy && Q.bytes ? Math.min(100, Math.round((Q.got / Q.bytes) * 100)) : 0;
      el.innerHTML = `
        <p>Every lesson has a recording in a natural voice. Download the ones you want, or everything, and they play without a connection. A lesson is about 2 MB on average, so use Wi-Fi for big downloads.</p>
        <div class="off-row"><b style="color:var(--ink)">${c.n} of ${all.length} saved</b><span class="off-note">${MB(c.b)} of ${MB(tot)}</span></div>
        <div class="off-bar${busy ? ' busy' : ''}" role="progressbar" aria-label="${busy ? 'Download progress' : 'Recordings saved on this device'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${busy ? qpct : Math.round((c.b / (tot || 1)) * 100)}"><i style="width:${busy ? qpct : (c.b / (tot || 1)) * 100}%"></i></div>
        <div class="off-row" data-off="qline">${busy ? `<span class="off-note" aria-live="polite">Downloading ${Q.done + Q.active.size} of ${Q.total} · ${MB(Q.got)} of ${MB(Q.bytes)}</span><button type="button" class="btn btn-g sm" data-off-act="cancel">Cancel</button>`
          : `${c.n < all.length ? `<button type="button" class="btn btn-p" data-off-act="all">${ICO.down}${c.n ? 'Download the rest' : 'Download all'} (${MB(tot - c.b)})</button>` : `<span class="off-ok">${ICO.check}Everything is saved</span>`}${c.n ? '<button type="button" class="btn btn-g sm" data-off-act="rmall">Remove all downloads</button>' : ''}`}</div>
        ${Q.error === 'quota' ? '<div class="callout dn"><span>This device ran out of space for downloads. Remove some, or free up space and try again.</span></div>' : last && last.failed && !busy ? `<p class="off-note">${last.failed} download${last.failed === 1 ? '' : 's'} did not finish${last.error === 'offline' ? ' because the connection dropped' : ''}. Tap Download again to retry.</p>` : ''}
        ${cat.map((g) => { const k = counts(g.items); const gb = g.items.reduce((s, it) => s + it.bytes, 0); const left = g.items.filter((it) => status(it.url) === 'none' || status(it.url) === 'old');
          return `<div class="off-trk"><div class="off-trk-h"><b>${esc(g.title)}</b><small>${g.items.length} recording${g.items.length === 1 ? '' : 's'} · ${MB(gb)} · ${k.n} saved</small>${left.length ? `<button type="button" class="btn btn-g sm" data-off-grp="${g.id}">${ICO.down}Download ${k.n ? 'the rest' : g.id === 'calls' ? 'both' : 'track'}</button>` : k.n ? `<span class="off-ok">${ICO.check}Saved</span>` : ''}</div>
            <details data-g="${g.id}"${openSet.has(g.id) ? ' open' : ''}><summary>${g.id === 'calls' ? 'Show recordings' : 'Show lessons'}</summary><ul class="off-items">${g.items.map(row).join('')}</ul></details></div>`; }).join('')}`;
    }
    function paintProgress() {
      const el = $('[data-off="audio"]'); if (!el || !Q.total) return paintAudio();
      const bar = el.querySelector('.off-bar i'); const qpct = Q.bytes ? Math.min(100, Math.round((Q.got / Q.bytes) * 100)) : 0;
      if (bar) bar.style.width = qpct + '%';
      const ql = el.querySelector('[data-off="qline"] .off-note'); if (ql) ql.textContent = `Downloading ${Q.done + Q.active.size} of ${Q.total} · ${MB(Q.got)} of ${MB(Q.bytes)}`;
      el.querySelectorAll('.off-items li').forEach((li) => { const b = li.querySelector('.st'); const a = li.querySelector('a[download]'); if (!b || !a || !b.textContent.match(/%|Waiting/)) return; const p = Math.round(progress(a.getAttribute('href')) * 100); if (p) b.textContent = p + '%'; });
    }
    const paintAll = () => { paintStatus(); paintInstall(); paintAudio(); };
    paintAll(); storage(); checkShell();
    const off = on((kind) => { if (kind === 'progress') paintProgress(); else { paintStatus(); paintInstall(); paintAudio(); } });
    let storT = setInterval(storage, 4000);
    SML.onCleanup(() => { off(); clearInterval(storT); });
    // listen on this render's own root: #view itself outlives the page, so a listener there would pile up per visit
    $('[data-off="root"]').addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const cat = catalog();
      if (t.dataset.offGet) get([t.dataset.offGet]);
      else if (t.dataset.offRm) remove([t.dataset.offRm]).then(storage);
      else if (t.dataset.offGrp) { const g = cat.find((x) => x.id === t.dataset.offGrp); if (g) get(g.items.map((it) => it.url)); }
      else if (t.dataset.offAct === 'all') get(cat.flatMap((g) => g.items.map((it) => it.url)));
      else if (t.dataset.offAct === 'cancel') cancel();
      else if (t.dataset.offAct === 'rmall') { if (t.dataset.sure) removeAll().then(storage); else { t.dataset.sure = '1'; t.textContent = 'Tap again to remove all'; setTimeout(() => { if (t.isConnected) { delete t.dataset.sure; t.textContent = 'Remove all downloads'; } }, 4000); } }
      else if (t.dataset.offAct === 'install') install();
    });
    return 'Offline & app';
  };
})();
