
// MathSoccer Service Worker - works with base64 version
const CACHE_NAME = 'mathsoccer-v4-base64';
const urlsToCache = [
  '/MATHSOCCER-4aSide-/',
  '/MATHSOCCER-4aSide-/index.html',
  '/MATHSOCCER-4aSide-/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
