/* Account layer: who is signed in, where their data lives, and one API every page uses.
 *
 * Sign-in is the viewer's Claude account (the `user` capability). When the page can write the viewer's private
 * `db` subtree (data/users/<id>/...), the profile is saved there and follows them across devices. Otherwise
 * everything is kept in this browser (localStorage) and can be exported/imported as a file.
 *
 * Privacy on shared browsers: in cloud mode nothing of the signed-in person's profile, assessments or lesson progress
 * is written to this browser's storage. The browser keys (sml:profile, sml:assessments, sml:done) only ever hold
 * guest data, which a signed-in person can choose to move into their account (migrateLocal), and which is then cleared.
 *
 * Loaded after content*.js, before the modules. Pages call SML.account.* and listen to the 'sml:account' event.
 */
(function () {
  'use strict';
  const SML = window.SML;
  const LKEY = 'profile', AKEY = 'assessments';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }; // local calendar day
  const uid = (p) => (p || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------------- profile shape ---------------- */
  const DEFAULTS = () => ({
    v: 1,
    nickname: '',                 // what the site calls you (your Claude name is used when this is empty)
    birthYear: null,              // number
    retireAge: null,              // number: target age to stop needing a paycheck
    monthlySpend: null,           // number: typical monthly spending today
    household: [],                // [{id, name, relation:'self'|'partner'|'child'|'parent'|'other', birthYear, income, incomeNote}]
    assets: [],                   // [{id, name, type, value, owner, note, updated}]  type: cash|retirement|brokerage|home|realestate|crypto|vehicle|business|other
    debts: [],                    // [{id, name, type, balance, rate, owner, note, updated}] type: card|student|car|mortgage|heloc|personal|other
    netWorthHistory: [],          // [{d:'YYYY-MM-DD', assets, debts, net}] one per day, newest last
    goals: [],                    // [{id, title, type, target, current, source:'manual'|'networth'|'investable'|'cash', deadline, monthly, created, done}]
    progress: { done: [] },       // lesson ids completed
    latestAssessment: null,       // id of the newest assessment
    assessmentSummary: [],        // [{id, date, archetype, risk, top}] small history for charts
    prefs: { defaultTrack: 'trading', weeklyOnCalendar: false, showTips: true },
    createdAt: null, updatedAt: null,
  });
  const ASSET_TYPES = [['cash', 'Cash & savings'], ['retirement', 'Retirement accounts'], ['brokerage', 'Brokerage'], ['home', 'Home'], ['realestate', 'Other real estate'], ['crypto', 'Crypto'], ['vehicle', 'Vehicles'], ['business', 'Business'], ['other', 'Other']];
  const DEBT_TYPES = [['card', 'Credit cards'], ['student', 'Student loans'], ['car', 'Car loans'], ['mortgage', 'Mortgage'], ['heloc', 'Home equity line'], ['personal', 'Personal loans'], ['other', 'Other']];

  function normalize(p) {
    const d = DEFAULTS(); const o = Object.assign(d, p || {});
    ['household', 'assets', 'debts', 'netWorthHistory', 'goals', 'assessmentSummary'].forEach((k) => { if (!Array.isArray(o[k])) o[k] = []; });
    o.progress = Object.assign({ done: [] }, o.progress || {}); if (!Array.isArray(o.progress.done)) o.progress.done = [];
    o.prefs = Object.assign(DEFAULTS().prefs, o.prefs || {});
    return o;
  }
  const hasData = (p) => !!(p && (p.household.length || p.assets.length || p.debts.length || p.goals.length || p.assessmentSummary.length || p.birthYear || p.nickname));

  /* ---------------- state ---------------- */
  const local = {
    load() { return normalize(SML.store.get(LKEY, null)); },
    save(p) { SML.store.set(LKEY, p); },
    assessments() { const a = SML.store.get(AKEY, []); return Array.isArray(a) ? a : []; },
    saveAssessments(a) { SML.store.set(AKEY, a); },
  };
  let profile = local.load();
  // host: 'claude' when the page runs inside claude.ai (accounts available), 'web' on a normal website (browser storage only)
  const host = (window.claude && typeof window.claude.use === 'function') ? 'claude' : 'web';
  SML.host = host;
  const status = { ready: false, host, mode: 'local', signedIn: false, uid: null, name: '', avatar: '', color: '', isOwner: false, cloudError: null, localPending: false };
  let db = null, userNs = null, pRef = null;
  let writeChain = Promise.resolve(), saveTimer = null, dirty = false;
  const listeners = new Set();
  function emit(type) {
    const detail = { type, status: Object.assign({}, status) };
    listeners.forEach((fn) => { try { fn(detail); } catch (e) {} });
    try { document.dispatchEvent(new CustomEvent('sml:account', { detail })); } catch (e) {}
  }

  /* ---------------- persistence ---------------- */
  function persistSoon() {
    dirty = true;
    if (status.mode !== 'cloud') { local.save(profile); return Promise.resolve(); }
    clearTimeout(saveTimer);
    return new Promise((res) => { saveTimer = setTimeout(() => { flush().then(res, res); }, 500); });
  }
  function flush() {
    if (status.mode !== 'cloud' || !pRef || !dirty) return Promise.resolve();
    dirty = false; const body = clone(profile);
    writeChain = writeChain.then(() => pRef.set(body)).catch((e) => cloudFail(e));
    return writeChain;
  }
  function cloudFail(e) {
    const code = e && e.code;
    if (code === 'unavailable') { dirty = true; setTimeout(flush, 1500 + Math.random() * 1500); return; }
    // invalid_argument here means this viewer may not write their own subtree (view-only access) or a body problem.
    status.mode = 'local'; status.cloudError = code || 'error'; local.save(profile);
    SML.store.set('done', (profile.progress.done || []).slice());
    try { document.dispatchEvent(new CustomEvent('sml:progress')); } catch (er) {}
    emit('mode');
  }

  /* ---------------- progress sync ---------------- */
  // In cloud mode lesson progress lives only in the profile; in local mode the browser key 'done' is the truth.
  const localDone = () => { const l = SML.store.get('done', []); return Array.isArray(l) ? l : []; };
  if (SML.progress && !SML.progress.__wrapped) {
    const orig = SML.progress.set.bind(SML.progress);
    SML.progress.list = () => (status.mode === 'cloud' ? (profile.progress.done || []).slice() : localDone());
    SML.progress.set = function (id, on) {
      if (status.mode === 'cloud') {
        const l = (profile.progress.done || []).filter((x) => x !== id); if (on) l.push(id);
        profile.progress.done = l; profile.updatedAt = new Date().toISOString(); persistSoon();
        document.dispatchEvent(new CustomEvent('sml:progress'));
      } else { orig(id, on); profile.progress.done = localDone(); profile.updatedAt = new Date().toISOString(); persistSoon(); }
    };
    SML.progress.__wrapped = true;
  }
  const progressEvent = () => { try { document.dispatchEvent(new CustomEvent('sml:progress')); } catch (e) {} };
  { // local start: the browser's 'done' list and the local profile's copy should agree
    const ld = localDone(); const all = Array.from(new Set(ld.concat(profile.progress.done || [])));
    profile.progress.done = all; if (all.length !== ld.length) SML.store.set('done', all);
  }

  /* ---------------- cloud connect ---------------- */
  async function connect() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      userNs = await window.claude.use('user');
      if (userNs) {
        const me = await userNs.me();
        status.uid = me.id || null; status.name = me.name || ''; status.avatar = me.avatarUrl || ''; status.color = me.color || ''; status.isOwner = !!me.isOwner;
        status.signedIn = !!me.id;
      }
      if (!status.uid) return;
      db = await window.claude.use('db');
      if (!db) return;
      pRef = db.doc('data/users/' + status.uid + '/profile');
      const snap = await pRef.get();
      const guest = local.load(); const guestHad = hasData(guest) || localDone().length > 0 || local.assessments().length > 0;
      if (snap.exists) {
        profile = normalize(snap.data());
        status.localPending = guestHad && !hasData(profile) && !(profile.progress.done || []).length;
      } else {
        profile = normalize(null); profile.createdAt = new Date().toISOString();
        status.localPending = guestHad;
      }
      status.mode = 'cloud';
      progressEvent();
    } catch (e) { status.cloudError = (e && e.code) || 'error'; status.mode = 'local'; }
    finally { status.ready = true; emit('ready'); }
  }
  let readyResolve; const readyP = new Promise((r) => { readyResolve = r; });
  listeners.add((d) => { if (d.type === 'ready') readyResolve(Object.assign({}, status)); });
  // Without a viewer runtime (opened as a plain file, or no Claude shell) we are local right away.
  setTimeout(() => { if (!status.ready && (!window.claude || typeof window.claude.use !== 'function')) { status.ready = true; emit('ready'); } }, 0);
  connect();
  // claude.use resolves null after ~10 s when no viewer answers; make sure 'ready' always fires.
  setTimeout(() => { if (!status.ready) { status.ready = true; emit('ready'); } }, 12000);

  /* ---------------- assessments ---------------- */
  function aCol() { return pRef ? pRef.collection('assessments') : null; }
  function summaryOf(r) { return { id: r.id, date: r.date, archetype: r.archetype && r.archetype.key, name: r.archetype && r.archetype.name, risk: r.scores && r.scores.risk, top: r.scores && r.scores.styles ? Object.entries(r.scores.styles).sort((a, b) => b[1] - a[1])[0][0] : null, profile: r.profile && r.profile.key }; }

  /* ---------------- public API ---------------- */
  const api = {
    status,
    ready: () => (status.ready ? Promise.resolve(Object.assign({}, status)) : readyP),
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    get: () => clone(profile),
    displayName: () => profile.nickname || status.name || '',
    /** save(patchObject) merges top-level fields; save(fn) lets fn mutate a working copy. Resolves when stored. */
    save(patch) {
      const p = clone(profile);
      if (typeof patch === 'function') { const r = patch(p); if (r && typeof r === 'object') Object.assign(p, r); } else Object.assign(p, patch || {});
      profile = normalize(p); if (!profile.createdAt) profile.createdAt = new Date().toISOString(); profile.updatedAt = new Date().toISOString();
      const done = persistSoon(); emit('change'); return done;
    },
    newId: uid,
    assetTypes: ASSET_TYPES, debtTypes: DEBT_TYPES,
    netWorth(p) {
      const q = p || profile; const byType = {}; let assets = 0, debts = 0;
      q.assets.forEach((a) => { const v = Number(a.value) || 0; assets += v; byType[a.type || 'other'] = (byType[a.type || 'other'] || 0) + v; });
      const debtByType = {}; q.debts.forEach((d) => { const v = Number(d.balance) || 0; debts += v; debtByType[d.type || 'other'] = (debtByType[d.type || 'other'] || 0) + v; });
      const investable = (byType.retirement || 0) + (byType.brokerage || 0) + (byType.crypto || 0);
      return { assets, debts, net: assets - debts, byType, debtByType, investable, cash: byType.cash || 0 };
    },
    householdIncome(p) { return (p || profile).household.reduce((s, m) => s + (Number(m.income) || 0), 0); },
    /** Record today's net worth in the history (one point per day; replaces today's). */
    snapshot() {
      const nw = api.netWorth();
      return api.save((p) => { const d = today(); p.netWorthHistory = p.netWorthHistory.filter((x) => x.d !== d); p.netWorthHistory.push({ d, assets: nw.assets, debts: nw.debts, net: nw.net }); p.netWorthHistory.sort((a, b) => (a.d < b.d ? -1 : 1)); if (p.netWorthHistory.length > 400) p.netWorthHistory = p.netWorthHistory.slice(-400); });
    },
    assessments: {
      async list() {
        if (status.mode === 'cloud' && aCol()) { try { const s = await aCol().orderBy('date', 'desc').limit(60).get(); return s.docs.map((d) => d.data()); } catch (e) { /* fall back */ } }
        return local.assessments().slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      },
      async latest() { const l = await api.assessments.list(); return l[0] || null; },
      async get(id) { const l = await api.assessments.list(); return l.find((x) => x.id === id) || null; },
      /** Save a finished assessment result (see SPEC-account.md for its shape). Resolves the stored id. */
      async add(result) {
        const r = clone(result); if (!r.id) r.id = uid('a'); if (!r.date) r.date = new Date().toISOString();
        const toLocal = () => { const la = local.assessments().filter((x) => x.id !== r.id); la.push(r); local.saveAssessments(la.slice(-60)); };
        if (status.mode === 'cloud' && aCol()) { try { await aCol().doc(r.id).set(r); } catch (e) { cloudFail(e); toLocal(); } }
        else toLocal();
        await api.save((p) => { p.latestAssessment = r.id; p.assessmentSummary = p.assessmentSummary.filter((x) => x.id !== r.id).concat([summaryOf(r)]).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-60); });
        return r.id;
      },
      async remove(id) {
        local.saveAssessments(local.assessments().filter((x) => x.id !== id));
        if (status.mode === 'cloud' && aCol()) { try { await aCol().doc(id).delete(); } catch (e) { cloudFail(e); } }
        await api.save((p) => { p.assessmentSummary = p.assessmentSummary.filter((x) => x.id !== id); if (p.latestAssessment === id) p.latestAssessment = p.assessmentSummary.length ? p.assessmentSummary[p.assessmentSummary.length - 1].id : null; });
      },
    },
    /** Copy what this browser holds into the signed-in account (offered when the account is empty). */
    async migrateLocal() {
      const loc = local.load(); const la = local.assessments(); const ld = localDone();
      const keepProgress = (profile.progress.done || []).slice();
      profile = normalize(Object.assign({}, loc, { createdAt: profile.createdAt || loc.createdAt }));
      profile.progress.done = Array.from(new Set(keepProgress.concat(ld)));
      status.localPending = false;
      await api.save({}); await flush();
      if (status.mode === 'cloud' && aCol()) { for (const r of la) { try { await aCol().doc(r.id).set(r); } catch (e) { cloudFail(e); break; } } }
      if (status.mode === 'cloud') { SML.store.set(LKEY, null); SML.store.set(AKEY, []); SML.store.set('done', []); } // moved, not copied
      progressEvent(); emit('change');
    },
    dismissMigration() { status.localPending = false; emit('change'); },
    exportData() { return api.assessments.list().then((a) => ({ app: 'FiredBunny', version: 1, exportedAt: new Date().toISOString(), profile: clone(profile), assessments: a, progress: SML.progress ? SML.progress.list() : [] })); },
    async importData(obj) {
      if (!obj || typeof obj !== 'object' || !obj.profile) throw new Error('This file is not a FiredBunny export.');
      profile = normalize(obj.profile);
      const cur = SML.progress ? SML.progress.list() : [];
      const all = Array.from(new Set(cur.concat(Array.isArray(obj.progress) ? obj.progress : []).concat(profile.progress.done || [])));
      profile.progress.done = all; if (status.mode !== 'cloud') SML.store.set('done', all);
      await api.save({}); progressEvent();
      for (const r of (obj.assessments || [])) { if (r && r.id) await api.assessments.add(r); }
      emit('change');
    },
    /** Delete everything this person saved: local copy and, when signed in, their cloud profile and assessments. */
    async clearAll() {
      const ids = (await api.assessments.list()).map((a) => a.id);
      SML.store.set(LKEY, null); SML.store.set(AKEY, []);
      if (status.mode === 'cloud' && pRef) { try { for (const id of ids) await aCol().doc(id).delete(); await pRef.delete(); } catch (e) { cloudFail(e); } }
      profile = normalize(null);
      SML.store.set('done', []); SML.store.set('assessDraft', null); SML.store.set('assessProgress', null); SML.assessDraft = null;
      progressEvent();
      emit('change');
    },
    /** Lesson progress helpers for dashboards. */
    progressFor(lessonIds) { const s = new Set(SML.progress ? SML.progress.list() : []); return lessonIds.filter((id) => s.has(id)).length; },
  };
  window.addEventListener('pagehide', () => { if (dirty) flush(); });
  SML.account = api;
})();
