const CACHE_NAME = 'onpwa-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isHtmlRequest =
    e.request.mode === 'navigate' ||
    e.request.headers.get('accept')?.includes('text/html');

  // HTML a landing vždy network-first
  if (isHtmlRequest || url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(e.request)
        .then((netRes) => netRes)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // statické assety: cache-first
  e.respondWith(
    caches.match(e.request).then((res) => {
      if (res) return res;

      return fetch(e.request).then((netRes) => {
        const copy = netRes.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return netRes;
      });
    })
  );
});