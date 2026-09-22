const CACHE_NAME = 'birgado-market-v2';
const ASSETS = [
  '/snack-point/',
  '/snack-point/index.html',
  '/snack-point/manifest.json',
  '/snack-point/sw.js',
  '/snack-point/logo.svg',
  '/snack-point/icons/icon-192.png',
  '/snack-point/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
});
