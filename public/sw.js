const CACHE_NAME = 'studytour-v12';
const PRECACHE = [
  '/tour-2026/',
  '/tour-2026/index.html',
  '/tour-2026/manifest.json',
  '/tour-2026/noorehuda.ttf',
  '/tour-2026/icon-192.png',
  '/tour-2026/icon-512.png',
  '/tour-2026/tour_roadmap_mobile.pdf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
