/* KANI app-shell cache; never persist protected online, profile or commerce data. */
const VERSION = 'kani-shell-v1-20261026';
const SHELL = ['/', '/offline', '/icons/192.png', '/icons/512.png', '/icons/180.png'];
const STATIC_CACHE = 'kani-static-v1';
const PRIVATE_PATHS = /^\/(api|account|online|shop)(\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then(async (cache) => {
    await Promise.all(SHELL.map((path) => cache.add(path).catch(() => {})));
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('kani-') && ![VERSION, STATIC_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Private routes are network-only. Show the generic offline screen if the
  // network fails, but never cache an identity, match, or payment response.
  if (PRIVATE_PATHS.test(url.pathname)) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request).catch(async () => {
        const cache = await caches.open(VERSION);
        return await cache.match('/offline') || Response.error();
      }));
    }
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (url.pathname === '/' && response.ok) {
          const cache = await caches.open(VERSION);
          await cache.put('/', response.clone());
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(VERSION);
        return (url.pathname === '/' ? await cache.match('/') : null) ||
          await cache.match('/offline') || Response.error();
      })
    );
    return;
  }
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })
    );
  }
});
