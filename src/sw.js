/* FiredBunny service worker: keeps the site working offline.
   tools/build.py writes dist/sw.js as `const BUILD = { version, shell: [...] };` followed by this file.

   - The page (one HTML file holds every lesson) is fetched fresh when online and saved; offline, the saved copy opens.
   - Fonts, icons and the manifest are saved at install.
   - Audio is saved only when the visitor taps Download (the page writes it to the AUDIO cache). Saved audio is served
     from here, including the byte ranges that phones ask for when playing or seeking.
   - Live data (/api/*): the network answer when online; offline, the last answer this device got for that request. */
'use strict';
/* global BUILD */
const SHELL = 'fb-shell-' + BUILD.version;
const AUDIO = 'fb-audio-v1'; // kept across site updates; keys carry ?v=<file hash>
const API = 'fb-api-v1';
const API_KEEP = 40; // most recent live-data answers kept for offline use
const PAGE = '/';
const NET_WAIT = 5000; // ms to wait for the network before showing the saved page

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    await cache.add(new Request(PAGE, { cache: 'no-cache' })); // the page must be saved, or the install fails
    await Promise.all(BUILD.shell.filter((u) => u !== PAGE).map((u) => cache.add(new Request(u, { cache: 'no-cache' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('fb-shell-') && n !== SHELL).map((n) => caches.delete(n)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (e) { /* not supported */ } }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'version' && event.ports && event.ports[0]) event.ports[0].postMessage({ version: BUILD.version });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;
  if (p === '/sw.js') return;
  if (p.startsWith('/api/')) { if (req.mode !== 'navigate') event.respondWith(api(req)); return; }
  if (p.startsWith('/audio/')) { event.respondWith(audio(req, url)); return; }
  if (req.mode === 'navigate' && !/\.[a-z0-9]{2,5}$/i.test(p)) { event.respondWith(page(event)); return; }
  event.respondWith(asset(req));
});

/* The page: network first (so an online visit always gets the latest site), saved copy when offline or very slow. */
async function page(event) {
  const cache = await caches.open(SHELL);
  const network = (async () => {
    const res = (await event.preloadResponse) || (await fetch(event.request));
    if (res && res.ok && /text\/html/i.test(res.headers.get('content-type') || '')) await cache.put(PAGE, res.clone());
    return res;
  })();
  event.waitUntil(network.catch(() => {}));
  const saved = () => cache.match(PAGE);
  try {
    const first = await Promise.race([network, new Promise((r) => setTimeout(() => r(null), NET_WAIT))]);
    if (first) return first;
    return (await saved()) || (await network);
  } catch (e) {
    const hit = await saved();
    if (hit) return hit;
    return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>FiredBunny</title><body style="font:16px system-ui;background:#0b0f19;color:#e8ecf4;padding:32px">You are offline, and FiredBunny has not been saved on this device yet. Open it once while online, then it works offline.</body>', { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
}

/* Fonts, icons, manifest: saved copy first, network otherwise (and keep fonts for next time). */
async function asset(req) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && new URL(req.url).pathname.startsWith('/fonts/')) cache.put(req, res.clone()).catch(() => {});
  return res;
}

/* Audio: a downloaded file is served from the device; otherwise straight from the network (not saved). */
async function audio(req, url) {
  const cache = await caches.open(AUDIO);
  const hit = await cache.match(url.href, { ignoreVary: true });
  if (!hit) return fetch(req);
  return ranged(req, hit);
}
async function ranged(req, res) {
  const range = req.headers.get('range');
  if (!range) return res;
  const blob = await res.blob();
  const total = blob.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m || (!m[1] && !m[2])) return new Response(blob, { status: 200, headers: headersFor(res, total) });
  let start, end;
  if (!m[1]) { start = Math.max(0, total - Number(m[2])); end = total - 1; } // "bytes=-500": the last 500 bytes
  else { start = Number(m[1]); end = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1; }
  if (start >= total || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
  const h = headersFor(res, end - start + 1);
  h['Content-Range'] = `bytes ${start}-${end}/${total}`;
  return new Response(blob.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: h });
}
function headersFor(res, length) {
  return { 'Content-Type': res.headers.get('content-type') || 'audio/mp4', 'Content-Length': String(length), 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
}

/* Live data: network first; offline, the last answer this device saw for the same request. */
async function api(req) {
  const cache = await caches.open(API);
  try {
    const res = await fetch(req);
    const p = new URL(req.url).pathname;
    if (res.ok && p !== '/api/health' && p !== '/api' && /json/i.test(res.headers.get('content-type') || '')) {
      cache.put(req, res.clone()).then(() => trim(cache)).catch(() => {});
    }
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    return new Response(JSON.stringify({ error: 'offline', source: 'offline', message: 'You are offline.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
}
async function trim(cache) {
  const keys = await cache.keys();
  const extra = keys.length - API_KEEP;
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}
