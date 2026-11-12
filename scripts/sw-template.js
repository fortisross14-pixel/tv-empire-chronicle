/* TV Empire Chronicle service worker. Generated at build time (see vite.config.ts):
   the version and the file list below are filled in for each build. */
const VERSION = '__VERSION__';
const FILES = __FILES__;
const APP = `tvec-app-${VERSION}`;
const FONTS = 'tvec-fonts';

// Install: download the whole game (code, poster art, icons) so it plays offline.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP).then((cache) => cache.addAll(FILES)));
});

// Activate: drop caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('tvec-app-') && k !== APP).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// The page asks to switch to a waiting new version ("Update" in the banner).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: serve the saved copy, refresh it in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req);
      const fresh = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    })());
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Pages: try the network for the newest version, fall back to the saved game offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(async () => (await caches.match('./index.html')) || (await caches.match('./')) || Response.error()));
    return;
  }

  // Everything else (hashed code, posters, icons): saved copy first.
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) (await caches.open(APP)).put(req, res.clone());
    return res;
  })());
});
