/* Analytics: Google Tag Manager (GTM-PJR6KKW9) and the events FiredBunny reports to it.
   Website only. Off in the claude.ai copy, on localhost and in automated browsers (the build's home-page snapshot).
   Consent: visitors whose time zone is in Europe are asked first (nothing loads until they allow it); everyone else
   gets it by default and can switch it off in Settings > Privacy. A visitor's profile, goals, money figures and
   anything they type into the tools are never sent.
   Events go into window.dataLayer as { event, ...SML.trackKeys }; analytics/gtm-firedbunny.json maps them to GA4 and
   analytics/README.md lists every event. Debug without sending anything: add ?fbdebug to the address (events are
   pushed to window.dataLayer but Tag Manager is not loaded). */
(function () {
  'use strict';
  const SML = window.SML;
  const GTM_ID = 'GTM-PJR6KKW9';
  const web = SML.host === 'web' && /^https?:$/.test(location.protocol);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const robot = navigator.webdriver === true;
  let debug = false; try { debug = /[?&]fbdebug\b/.test(location.search) || localStorage.getItem('fb_analytics_debug') === '1'; } catch (e) {}
  const canSend = web && !local && !robot; // a real visitor on the website

  /* ---------------- consent ---------------- */
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();
  const askFirst = /^Europe\//.test(tz) || /^(Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)|Africa\/Ceuta|Asia\/(Nicosia|Famagusta)|Arctic\/Longyearbyen)$/.test(tz);
  const choice = () => { const v = SML.store.get('analytics', null); return v === 'granted' || v === 'denied' ? v : null; };
  const allowed = () => { const c = choice(); return c ? c === 'granted' : !askFirst; };
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  let started = false, scriptIn = false;
  function start() { // consent and Tag Manager's start event go first in the queue, before any FiredBunny event
    if (started || !canSend || !allowed()) return;
    started = true;
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
    gtag('js', new Date());
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }
  function loadScript() { // after the first page has drawn, so it never slows the start
    if (!started || scriptIn) return; scriptIn = true;
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }
  function refresh() { SML.trackOn = (canSend && allowed()) || (web && debug); }
  function setChoice(granted) {
    SML.store.set('analytics', granted ? 'granted' : 'denied');
    if (granted) {
      start(); refresh();
      if (started) { gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }); loadScript(); }
      if (ctx.page_location) SML.track('page_view', { connection: navigator.onLine === false ? 'offline' : 'online', display_mode: displayMode(), lessons_done: SML.progress ? SML.progress.count() : undefined });
    }
    else {
      if (started) gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      refresh(); clearCookies();
    }
    const b = document.getElementById('fb-consent'); if (b) b.remove();
  }
  function clearCookies() {
    const host = location.hostname; const parts = host.split('.'); const domains = ['', host];
    for (let i = parts.length - 2; i > 0; i--) domains.push('.' + parts.slice(i).join('.'));
    document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^(_ga|_gid|_gat|_gcl)/.test(n)).forEach((n) => {
      domains.forEach((d) => { document.cookie = `${n}=; Max-Age=0; path=/${d ? '; domain=' + d : ''}`; });
    });
  }
  SML.analytics = { allowed, set: setChoice, choice, askFirst, available: canSend, debug: () => debug };
  start(); refresh();

  /* ---------------- page context, attached to every event ---------------- */
  const lessonById = (id) => (SML.lessons || []).find((l) => l.id === id);
  const courseById = (id) => (SML.courses || []).find((c) => c.id === id);
  const trackTitle = (id) => { const t = (SML.tracks || []).find((x) => x.id === id); return t ? t.title : undefined; };
  let ctx = {};
  function describe(tok) {
    const o = { page_location: location.origin + '/' + (tok === 'home' ? '' : tok), page_title: document.title, page_type: 'page', content_id: tok };
    if (tok === 'home') o.page_type = 'home';
    else if (tok.indexOf('l-') === 0) { const l = lessonById(tok); o.page_type = 'lesson'; if (l) { const c = courseById(l.course); o.content_title = l.title; o.course_name = c && c.title; o.track_name = trackTitle(c && c.track || 'trading'); } }
    else if (tok.indexOf('c-') === 0) { const c = courseById(tok.slice(2)) || courseById(tok); o.page_type = 'course'; if (c) { o.content_title = c.title; o.course_name = c.title; o.track_name = trackTitle(c.track || 'trading'); } }
    else if (tok.indexOf('tool-') === 0) { const t = (SML.tools || []).find((x) => x.id === tok); o.page_type = 'tool'; if (t) { o.content_title = t.title; o.track_name = trackTitle(t.track || 'trading'); } }
    else if (tok.indexOf('track-') === 0) { o.page_type = 'track'; o.track_name = trackTitle(tok.slice(6)); }
    else if (tok.indexOf('post-') === 0) o.page_type = 'post';
    return o;
  }
  SML.trackContext = () => ctx;
  const displayMode = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true ? 'app' : 'browser'; } catch (e) { return 'browser'; } };

  /* ---------------- page views (the site changes pages without reloading) ---------------- */
  let lastLoc = document.referrer || undefined, scrolled = {}, firstRoute = true;
  document.addEventListener('sml:route', (e) => {
    const tok = (e.detail && e.detail.tok) || 'home';
    ctx = describe(tok);
    SML.track('page_view', { page_referrer: lastLoc, connection: navigator.onLine === false ? 'offline' : 'online', display_mode: displayMode(), lessons_done: SML.progress ? SML.progress.count() : undefined });
    lastLoc = ctx.page_location; scrolled = {};
    if (firstRoute) {
      firstRoute = false;
      const later = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 3000 }) : (fn) => setTimeout(fn, 1500);
      later(loadScript);
      if (canSend && askFirst && !choice()) setTimeout(banner, 1200);
    }
  });

  /* ---------------- clicks on links inside the site ---------------- */
  const text = (el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  function area(el) {
    if (el.closest('#drawer')) return 'menu';
    if (el.closest('header.nav')) return 'nav';
    if (el.closest('footer.foot')) return 'footer';
    if (el.closest('.nar, .nar-mini')) return 'audio_player';
    const s = el.closest('section[id], section[aria-labelledby], .page-hdr, .hero, nav[aria-label]');
    if (!s) return 'page';
    return s.id || s.getAttribute('aria-labelledby') || s.getAttribute('aria-label') || s.className.split(' ')[0];
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest) return;
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1) SML.track('select_content', { item_name: a.getAttribute('href').slice(1), label: text(a), item_category: area(a) });
    const s = e.target.closest('[data-acx-act]'); // Settings and dashboard actions: export, import, delete, reset, save...
    if (s) SML.track('settings_action', { label: s.dataset.acxAct, item_category: ctx.page_type });
    const m = e.target.closest('#nav-menu'); if (m) SML.track('menu_toggle', { label: m.getAttribute('aria-expanded') === 'true' ? 'close' : 'open' });
  }, true);
  // any form sent (feedback on the About page, imports...): which form, never what was typed
  document.addEventListener('submit', (e) => { const f = e.target; SML.track('form_submit', { item_name: f.id || f.getAttribute('aria-label') || f.className.split(' ')[0] || 'form', item_category: ctx.page_type }); }, true);

  /* ---------------- how far down each page people read ---------------- */
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const h = document.documentElement.scrollHeight, v = window.innerHeight;
      if (h < v * 1.3) return;
      const p = ((window.scrollY + v) / h) * 100;
      [25, 50, 75, 90].forEach((m) => { if (p >= m && !scrolled[m]) { scrolled[m] = true; SML.track('page_scroll', { percent: m }); } });
    });
  }, { passive: true });

  /* ---------------- first use of each interactive picture, tool or simulator ---------------- */
  const used = new WeakSet();
  const onUse = (e) => {
    const w = e.target.closest && e.target.closest('[data-widget]'); if (!w || used.has(w)) return;
    used.add(w); SML.track('widget_interact', { item_name: w.dataset.widget, item_category: ctx.page_type, method: e.type });
  };
  ['pointerdown', 'input', 'change', 'keydown'].forEach((t) => document.addEventListener(t, onUse, true));

  /* ---------------- lessons finished, assessments, copies ---------------- */
  if (SML.progress && SML.progress.set) {
    const set = SML.progress.set;
    SML.progress.set = function (id, on) {
      const was = SML.progress.isDone(id);
      const r = set.apply(this, arguments);
      if (on && !was) { const l = lessonById(id); const c = l && courseById(l.course); SML.track('lesson_complete', { item_name: id, label: l && l.title, item_category: c && c.title, value: SML.progress.count() }); }
      return r;
    };
  }
  if (SML.account && SML.account.assessments && SML.account.assessments.add) {
    const add = SML.account.assessments.add;
    SML.account.assessments.add = function (r) {
      try {
        const styles = r && r.scores && r.scores.styles ? Object.entries(r.scores.styles).sort((a, b) => b[1] - a[1]) : [];
        SML.track('assessment_complete', { label: r && r.archetype && (r.archetype.name || r.archetype.key), item_name: styles[0] && styles[0][0], value: r && r.scores && typeof r.scores.risk === 'number' ? Math.round(r.scores.risk) : undefined });
      } catch (e) {}
      return add.apply(this, arguments);
    };
  }
  if (SML.copy) {
    const copy = SML.copy;
    SML.copy = function (t, msg) { SML.track('copy_content', { label: msg || 'Copied', item_category: ctx.page_type, value: typeof t === 'string' ? t.length : undefined }); return copy.apply(this, arguments); };
  }

  /* ---------------- install as an app ---------------- */
  window.addEventListener('beforeinstallprompt', () => SML.track('app_install_prompt', { label: 'available' }));
  window.addEventListener('appinstalled', () => SML.track('app_installed', { label: displayMode() }));

  /* ---------------- errors (so broken things show up in the reports) ---------------- */
  let errs = 0;
  window.addEventListener('error', (e) => { if (errs++ > 9 || !e || !e.message) return; SML.track('js_error', { label: String(e.message), item_name: (String(e.filename || '').split('/').pop() || '?') + ':' + (e.lineno || 0) }); });
  window.addEventListener('unhandledrejection', (e) => { if (errs++ > 9) return; SML.track('js_error', { label: 'promise: ' + String((e && e.reason && (e.reason.message || e.reason)) || ''), item_name: 'promise' }); });

  /* ---------------- consent banner (time zones in Europe, before any choice) ---------------- */
  SML.css(`
    .fb-consent{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:75;max-width:420px;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:12px;border:1px solid var(--line);background:color-mix(in srgb,var(--surface) 96%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 16px 48px -12px rgba(0,0,0,.7);color:var(--text);font:400 14px/1.5 var(--sans)}
    .fb-consent p{margin:0}
    .fb-consent b{color:var(--ink)}
    .fb-consent .row{display:flex;gap:8px;flex-wrap:wrap}
    @media (max-width:520px){.fb-consent{left:12px;right:12px;max-width:none}}
  `);
  function banner() {
    if (document.getElementById('fb-consent') || choice()) return;
    const d = document.createElement('div'); d.id = 'fb-consent'; d.className = 'fb-consent'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Analytics');
    d.innerHTML = '<p><b>Help make FiredBunny better?</b> Allow Google Analytics to count visits and see which lessons, tools and audio people use. Your profile, goals and money figures are never sent. You can change this any time in Settings.</p><div class="row"><button type="button" class="btn btn-p sm" data-c="yes">Allow</button><button type="button" class="btn btn-g sm" data-c="no">No thanks</button></div>';
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) setChoice(b.dataset.c === 'yes'); });
    document.body.appendChild(d);
  }
})();
