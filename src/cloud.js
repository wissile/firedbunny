/* FiredBunny accounts on the website: sign-in and saving with Supabase (src/cloud-config.js, supabase/schema.sql).
 *
 * Off unless cloud-config.js has a project URL and key, and only on the website: inside claude.ai the Claude account is
 * used instead (account.js). When someone is signed in:
 *   - Everything they save is one row per item in public.user_data (key -> JSON value):
 *       'profile'          goals, net worth, household, lesson progress (account.js)
 *       'assessment:<id>'  each self-assessment result (account.js)
 *       's:<name>'         everything else a page keeps with SML.store: trade journal, FIRE plan, spreadsheet rows,
 *                          checklists, preferences... Only analytics consent stays with the device.
 *   - This browser keeps a copy (localStorage 'fb-cloud:<user id>') so pages open at once and work offline. Changes
 *     wait in it until they reach the server. Signing out deletes the copy.
 *   - A newer server copy (saved from another device) replaces this one, except an item changed here that has not been
 *     uploaded yet: that change wins, and lesson progress from both sides is kept.
 * Guests never load the Supabase library; their data stays in the browser exactly as before.
 */
(function () {
  'use strict';
  const SML = window.SML;
  const C = SML.SUPABASE || {};
  const web = !(window.claude && typeof window.claude.use === 'function');
  let ref = '';
  try { ref = C.url ? new URL(C.url).hostname.split('.')[0] : ''; } catch (e) { ref = ''; }
  const enabled = !!(web && C.url && C.key && ref && /^https:\/\//.test(C.url));
  const LIB = '/vendor/supabase-js-2.119.0.js';
  const SKEY = 'sb-' + ref + '-auth-token'; // where supabase-js keeps the session (its default storage key)
  const DEVICE = new Set(['analytics']); // SML.store keys that stay with this browser
  const ACCOUNT = new Set(['profile', 'assessments', 'done']); // account.js keeps these itself (guest copies)
  const PREFS = new Set(['narSpeed', 'narAuto', 'track', 'cal:prefs', 'dashReturn', 'earn:last', 'rci-decoded']); // moved, but not worth asking about
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  function readUser() {
    if (!enabled) return null;
    try {
      const s = JSON.parse(ls.get(SKEY) || 'null');
      const u = s && (s.user || (s.currentSession && s.currentSession.user));
      return u && u.id ? { id: u.id, email: u.email || '' } : null;
    } catch (e) { return null; }
  }
  const user = readUser();
  const CKEY = user ? 'fb-cloud:' + user.id : '';
  let cache = { items: {}, pending: {}, rejected: {}, pulledAt: null };
  function loadCache() {
    if (!CKEY) return;
    try { const c = JSON.parse(ls.get(CKEY) || 'null'); if (c && c.items) cache = { items: c.items, pending: c.pending || {}, rejected: c.rejected || {}, pulledAt: c.pulledAt || null }; } catch (e) {}
  }
  loadCache();
  const saveCache = () => { if (CKEY && !ls.set(CKEY, JSON.stringify(cache))) console.warn('[FiredBunny] could not keep the offline copy of your account'); };
  const status = { enabled, signedIn: !!user, email: user ? user.email : '', lastSync: cache.pulledAt, error: null, pending: Object.keys(cache.pending).length, offline: navigator.onLine === false };
  const statusListeners = new Set(), changeListeners = new Set();
  const emitStatus = () => { status.pending = Object.keys(cache.pending).length; statusListeners.forEach((fn) => { try { fn(Object.assign({}, status)); } catch (e) {} }); };
  const emitChange = (keys) => { changeListeners.forEach((fn) => { try { fn(keys); } catch (e) {} }); try { document.dispatchEvent(new CustomEvent('sml:cloud', { detail: { keys } })); } catch (e) {} };

  /* ---------------- the local copy ---------------- */
  const get = (key, d) => { const it = cache.items[key]; return it ? clone(it.v) : d; };
  const has = (key) => !!cache.items[key];
  const keys = (prefix) => Object.keys(cache.items).filter((k) => k.indexOf(prefix || '') === 0);
  function set(key, v) {
    if (!user) return;
    if (v === undefined || v === null) { if (!cache.items[key] && !cache.pending[key]) return; delete cache.items[key]; }
    else cache.items[key] = { v: clone(v), t: cache.items[key] ? cache.items[key].t : null };
    cache.pending[key] = (cache.pending[key] || 0) + 1;
    delete cache.rejected[key];
    saveCache(); emitStatus(); schedulePush();
  }

  /* ---------------- Supabase client (loaded only when needed) ---------------- */
  let clientP = null, leaving = false;
  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = LIB; s.async = true;
      s.onload = () => res(); s.onerror = () => { s.remove(); rej(Object.assign(new Error('The sign-in service could not load. Check your connection.'), { network: true })); };
      document.head.appendChild(s);
    });
  }
  function client() {
    if (!enabled) return Promise.reject(new Error('Accounts are not switched on.'));
    if (!clientP) {
      clientP = loadLib().then(() => {
        const c = window.supabase.createClient(C.url, C.key, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        c.auth.onAuthStateChange((event) => {
          // the session ended without us asking (password changed elsewhere, account deleted, refresh refused)
          if (event === 'SIGNED_OUT' && user && !leaving) { if (!Object.keys(cache.pending).length && CKEY) ls.del(CKEY); location.reload(); }
        });
        return c;
      });
      clientP.catch(() => { clientP = null; });
    }
    return clientP;
  }

  /* ---------------- sync ---------------- */
  let pushTimer = null, pushing = null, backoff = 2000;
  const isNetwork = (e) => !!(e && (e.network || e.status === 0 || /fetch|network|load failed|timeout/i.test(String(e.message || e))));
  function schedulePush(ms) { if (!user) return; clearTimeout(pushTimer); pushTimer = setTimeout(() => { push().catch(() => {}); }, ms == null ? 800 : ms); }
  async function upsertRows(c, rows) {
    const { data, error } = await c.from('user_data').upsert(rows, { onConflict: 'user_id,key' }).select('key,updated_at');
    if (error) throw error;
    (data || []).forEach((r) => { if (cache.items[r.key]) cache.items[r.key].t = r.updated_at; });
  }
  function push() {
    if (!user) return Promise.resolve();
    if (pushing) return pushing.then(() => (Object.keys(cache.pending).length ? push() : undefined));
    const ks = Object.keys(cache.pending);
    if (!ks.length) return Promise.resolve();
    pushing = (async () => {
      const c = await client();
      // The profile holds lesson progress from every device: if another device saved it since our copy, keep both
      // sides' lessons before uploading ours (everything else: the newest change wins).
      let merged = false;
      if (cache.pending.profile && cache.items.profile) {
        const { data: cur, error: e0 } = await c.from('user_data').select('value,updated_at').eq('key', 'profile');
        if (e0) throw e0;
        const r = cur && cur[0];
        if (r && cache.items.profile && r.updated_at !== cache.items.profile.t) {
          const before = JSON.stringify(cache.items.profile.v.progress || {});
          mergeProgress(cache.items.profile.v, r.value);
          merged = JSON.stringify(cache.items.profile.v.progress || {}) !== before;
        }
      }
      const snap = {}; ks.forEach((k) => { snap[k] = cache.pending[k]; });
      const ups = ks.filter((k) => cache.items[k]).map((k) => ({ user_id: user.id, key: k, value: cache.items[k].v }));
      const dels = ks.filter((k) => !cache.items[k]);
      for (let i = 0; i < ups.length; i += 40) {
        const part = ups.slice(i, i + 40);
        try { await upsertRows(c, part); }
        catch (e) {
          if (isNetwork(e) || part.length === 1) throw e;
          for (const row of part) { // one bad item (too big, over the limit) must not hold the others back
            try { await upsertRows(c, [row]); }
            catch (e2) { if (isNetwork(e2)) throw e2; cache.rejected[row.key] = String(e2.message || e2).slice(0, 200); delete cache.pending[row.key]; }
          }
        }
      }
      if (dels.length) { const { error } = await c.from('user_data').delete().in('key', dels); if (error) throw error; }
      ks.forEach((k) => { if (cache.pending[k] === snap[k]) delete cache.pending[k]; });
      saveCache();
      if (merged) emitChange(['profile']); // the page's copy of the profile now has the other device's lessons too
      backoff = 2000; status.error = Object.keys(cache.rejected).length ? 'Some items are too large to save to your account.' : null; status.offline = false; status.lastSync = new Date().toISOString();
    })().catch((e) => {
      status.error = isNetwork(e) ? null : message(e); status.offline = isNetwork(e);
      backoff = Math.min(backoff * 2, 60000); schedulePush(backoff);
    }).finally(() => { pushing = null; emitStatus(); });
    return pushing;
  }
  function mergeProgress(mine, theirs) {
    try { const a = (mine.progress && mine.progress.done) || [], b = (theirs.progress && theirs.progress.done) || []; mine.progress = Object.assign({}, mine.progress, { done: Array.from(new Set(a.concat(b))) }); } catch (e) {}
  }
  async function pull() {
    if (!user) return false;
    const c = await client();
    const { data, error } = await c.from('user_data').select('key,value,updated_at');
    if (error) throw error;
    const seen = new Set(), changed = [];
    (data || []).forEach((r) => {
      seen.add(r.key);
      const it = cache.items[r.key];
      if (cache.pending[r.key]) { // changed here and still on its way up: ours wins, lesson progress from both sides
        if (it && r.key === 'profile' && it.t !== r.updated_at) { mergeProgress(it.v, r.value); changed.push(r.key); }
        return;
      }
      if (!it || it.t !== r.updated_at) { cache.items[r.key] = { v: r.value, t: r.updated_at }; changed.push(r.key); }
    });
    Object.keys(cache.items).forEach((k) => { if (!seen.has(k) && !cache.pending[k] && cache.items[k].t) { delete cache.items[k]; changed.push(k); } }); // deleted on another device
    cache.pulledAt = new Date().toISOString(); status.lastSync = cache.pulledAt; status.offline = false;
    saveCache(); emitStatus();
    if (changed.length) emitChange(changed);
    return true;
  }
  let lastSync = 0, syncing = null;
  function sync(force) {
    if (!user) return Promise.resolve(false);
    if (syncing) return force ? syncing.then(() => sync(true)) : syncing; // a forced sync (back online) runs after the current one
    if (!force && Date.now() - lastSync < 15000) return Promise.resolve(true);
    lastSync = Date.now();
    syncing = push().then(() => pull()).catch((e) => { status.offline = isNetwork(e); status.error = isNetwork(e) ? null : message(e); emitStatus(); return false; }).finally(() => { syncing = null; });
    return syncing;
  }
  let firstP = null;
  /** Resolves once this device has a copy of the account (straight away when it already has one; at most `ms`). */
  function ready(ms) {
    if (!user) return Promise.resolve(false);
    if (cache.pulledAt) return Promise.resolve(true);
    if (!firstP) firstP = sync(true);
    return Promise.race([firstP, new Promise((r) => setTimeout(() => r(false), ms || 8000))]);
  }

  if (user) {
    window.addEventListener('focus', () => sync());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); else if (Object.keys(cache.pending).length) push().catch(() => {}); });
    window.addEventListener('online', () => { backoff = 2000; status.offline = false; emitStatus(); sync(true); });
    window.addEventListener('offline', () => { status.offline = true; emitStatus(); });
    // another tab of this browser signed out, or changed the shared copy
    window.addEventListener('storage', (e) => {
      if (e.key === SKEY && !e.newValue) location.reload();
      else if (e.key === CKEY && e.newValue) { loadCache(); emitStatus(); emitChange(['*']); }
    });
    setTimeout(() => { if (cache.pulledAt) sync(true); }, 50); // refresh a copy we already had; ready() fetches the first one
  } else if (enabled) {
    window.addEventListener('storage', (e) => { if (e.key === SKEY && e.newValue) location.reload(); }); // signed in in another tab
  }

  /* ---------------- SML.store: a signed-in person's saved items follow the account ---------------- */
  if (user && SML.store) {
    SML.store.backend = { has: (k) => !DEVICE.has(k) && !ACCOUNT.has(k), get: (k, d) => get('s:' + k, d), set: (k, v) => set('s:' + k, v) };
  }
  function guestKeys(meaningful) {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k || k.indexOf('sml:') !== 0) continue; const n = k.slice(4); if (DEVICE.has(n) || ACCOUNT.has(n) || (meaningful && PREFS.has(n))) continue; const v = SML.store.local.get(n, null); if (v !== null && v !== '' && !(Array.isArray(v) && !v.length)) out.push(n); } } catch (e) {}
    return out;
  }

  /* ---------------- account.js adapter (same shape as the claude.ai database it uses) ---------------- */
  function collection(prefix) {
    return {
      doc: (id) => ({ get: async () => ({ exists: has(prefix + id), data: () => get(prefix + id) }), set: async (v) => set(prefix + id, v), delete: async () => set(prefix + id, null) }),
      orderBy: (field, dir) => ({ limit: (n) => ({ get: async () => {
        const docs = keys(prefix).map((k) => get(k)).filter(Boolean).sort((a, b) => { const x = a[field], y = b[field]; return x === y ? 0 : ((x < y) === (dir === 'desc') ? 1 : -1); }).slice(0, n);
        return { docs: docs.map((d) => ({ data: () => d })) };
      } }) }),
    };
  }
  function doc(key) {
    return { get: async () => ({ exists: has(key), data: () => get(key) }), set: async (v) => set(key, v), delete: async () => set(key, null), collection: (name) => collection((name === 'assessments' ? 'assessment' : name) + ':') };
  }

  /* ---------------- sign-in ---------------- */
  const signinURL = (q) => location.origin + ((SML.routes && SML.routes.mode === 'path' && SML.routes.path) ? SML.routes.path('signin') : '/signin/') + (q || '');
  function message(e) {
    const m = String((e && (e.message || e.error_description)) || e || '');
    const code = (e && (e.code || e.error_code)) || '';
    if (isNetwork(e)) return 'Can’t reach the server. Check your connection and try again.';
    if (code === 'invalid_credentials' || /invalid login credentials/i.test(m)) return 'That email and password don’t match an account.';
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(m)) return 'Confirm your email first: open the link we sent you (check spam too).';
    if (code === 'user_already_exists' || /already registered/i.test(m)) return 'There’s already an account with this email. Sign in instead.';
    if (code === 'weak_password' || /password should be|weak password/i.test(m)) return 'Choose a longer password: at least 8 characters, ideally a few words.';
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || (e && e.status === 429) || /rate limit|too many/i.test(m)) return 'Too many tries for now. Wait a few minutes and try again.';
    if (code === 'otp_expired' || /expired|invalid.*link/i.test(m)) return 'That link has expired or was already used. Ask for a new one below.';
    if (code === 'same_password') return 'That’s your current password. Choose a new one.';
    if (/flow state|code verifier|both auth code and code verifier/i.test(m)) return 'This link has to be opened in the browser where you asked for it.';
    return m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Something went wrong. Please try again.';
  }
  const fail = (error) => { const e = new Error(message(error)); e.cause = error; throw e; };
  async function signUp(email, password) {
    const c = await client();
    const { data, error } = await c.auth.signUp({ email, password, options: { emailRedirectTo: signinURL() } });
    if (error) fail(error);
    return { confirm: !data.session };
  }
  async function signIn(email, password) { const c = await client(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) fail(error); }
  async function resend(email) { const c = await client(); const { error } = await c.auth.resend({ type: 'signup', email, options: { emailRedirectTo: signinURL() } }); if (error) fail(error); }
  async function sendReset(email) { const c = await client(); const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: signinURL('?reset=1') }); if (error) fail(error); }
  async function newPassword(password) { const c = await client(); const { error } = await c.auth.updateUser({ password }); if (error) fail(error); }
  /** Sign out on this device. Unsaved changes are uploaded first; if that is impossible it reports how many are waiting
   *  (pass force to sign out anyway, losing them). */
  async function signOut(force) {
    if (!user) return { ok: true };
    await push().catch(() => {});
    const n = Object.keys(cache.pending).length;
    if (n && !force) return { ok: false, pending: n };
    leaving = true;
    try { const c = await client(); await c.auth.signOut({ scope: 'local' }); } catch (e) {}
    ls.del(SKEY); if (CKEY) ls.del(CKEY);
    return { ok: true };
  }
  async function deleteAccount() {
    const c = await client();
    const { error } = await c.rpc('delete_my_account');
    if (error) fail(error);
    leaving = true;
    try { await c.auth.signOut({ scope: 'local' }); } catch (e) {}
    ls.del(SKEY); if (CKEY) ls.del(CKEY);
  }
  /** On the sign-in page: finish what an emailed link started (confirm the email, or reset the password). */
  async function handleLink() {
    if (!enabled) return null;
    const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.slice(1));
    const err = q.get('error_description') || h.get('error_description') || q.get('error') || h.get('error');
    const code = q.get('code'), th = q.get('token_hash'), type = q.get('type'), reset = q.get('reset') === '1' || type === 'recovery';
    if (!err && !code && !th) return null;
    const clean = () => { try { history.replaceState(null, '', location.pathname); } catch (e) {} };
    if (err) { clean(); return { kind: 'error', reset, message: message({ message: err, code: q.get('error_code') || h.get('error_code') }) }; }
    try {
      const c = await client();
      if (th) { const { error } = await c.auth.verifyOtp({ token_hash: th, type: type || 'email' }); if (error) fail(error); }
      const { data } = await c.auth.getSession(); // a ?code= link is exchanged while the client starts (detectSessionInUrl)
      clean();
      if (data && data.session) return { kind: reset ? 'recovery' : 'confirmed', email: data.session.user && data.session.user.email };
      return { kind: reset ? 'error' : 'confirmed-elsewhere', reset, message: reset ? 'This reset link has to be opened in the browser where you asked for it. Ask for a new one below.' : '' };
    } catch (e) { clean(); return { kind: 'error', reset, message: e.message || message(e) }; }
  }

  SML.cloud = {
    enabled, user, status,
    hasCopy: () => !!cache.pulledAt,
    ready, sync, push, get, has, keys, set, doc,
    onStatus(fn) { statusListeners.add(fn); return () => statusListeners.delete(fn); },
    onChange(fn) { changeListeners.add(fn); return () => changeListeners.delete(fn); },
    guestHasData: () => guestKeys(true).length > 0,
    /** Move this browser's guest items (journal, plans, preferences...) into the account. Moved, not copied. */
    moveGuestStore() { guestKeys(false).forEach((n) => { const v = SML.store.local.get(n, null); if (v !== null && !has('s:' + n)) set('s:' + n, v); SML.store.local.remove(n); }); },
    /** Delete every SML.store item saved in the account (Settings → delete everything). */
    clearStore() { keys('s:').forEach((k) => set(k, null)); },
    rejected: () => Object.assign({}, cache.rejected),
    message, signUp, signIn, resend, sendReset, newPassword, signOut, deleteAccount, handleLink, client,
  };
  // pages ask this to choose their wording: accounts exist here (claude.ai, or the website with Supabase switched on)
  SML.accountsOn = !web || enabled;
})();
