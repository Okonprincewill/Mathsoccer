// MathSoccer Service Worker - works with base64 version - FIXED for iPhone + Android - Mathsoccer repo
const CACHE_NAME = 'mathsoccer-v6-fix-selective';

const urlsToCache = [
  '/Mathsoccer/',
  '/Mathsoccer/index.html',
  '/Mathsoccer/manifest.json'
];

// iPhone + Android: Don't fail install if optional assets missing
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache core files - even if one fails, don't break install
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Core cache failed, caching individually', err);
        // Try one by one - base64 index.html is large (2.5MB), may fail on low storage iPhone
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(e => console.log('Failed to cache', url)))
        );
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // iPhone + Android fix: only handle GET requests for our origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // For navigation requests (iPhone standalone needs this)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/Mathsoccer/index.html') || caches.match('/Mathsoccer/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Don't cache base64 index.html again (already 2.5MB)
        // Only cache icons, manifest, screenshots for Android/iPhone offline
        if (response.ok && !event.request.url.includes('index.html')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback for offline - important for iPhone black screen
        return caches.match('/Mathsoccer/index.html');
      });
    })
  );
});
