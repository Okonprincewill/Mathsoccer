// MathSoccer Service Worker
// Mathsoccer repo - offline PWA version

const CACHE_NAME = 'mathsoccer-v7-audio';

const CORE_FILES = [
  '/Mathsoccer/',
  '/Mathsoccer/index.html',
  '/Mathsoccer/manifest.json',
  '/Mathsoccer/logo192.png',
  '/Mathsoccer/logo512.png'
];

const AUDIO_FILES = [
'/Mathsoccer/explode.mp3',
'/Mathsoccer/Mathsoccer_touch.mp3',
'/Mathsoccer/cheer_goal.mp3',
'/Mathsoccer/ball.mp3',
'/Mathsoccer/kick.mp3',
'/Mathsoccer/crowd_louds.mp3',
'/Mathsoccer/Mathsoccer_cool.mp3',
'/Mathsoccer/maths.mp3',
'/Mathsoccer/disappointed.mp3'
];

const OPTIONAL_FILES = [
  '/Mathsoccer/screenshot1.png',
  '/Mathsoccer/screenshot2.png',
  '/Mathsoccer/screenshot3.png',
  '/Mathsoccer/screenshot4.png'
];

const ALL_FILES = [
  ...CORE_FILES,
  ...AUDIO_FILES,
  ...OPTIONAL_FILES
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {

      // Cache each file individually.
      // One missing file must NOT stop the PWA from installing.
      await Promise.all(
        ALL_FILES.map(async url => {
          try {
            await cache.add(url);
            console.log('Cached:', url);
          } catch (error) {
            console.log('Could not cache:', url, error);
          }
        })
      );

      await self.skipWaiting();
    })
  );
});


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') return;

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // ==========================================
  // PAGE NAVIGATION
  // ==========================================

  if (event.request.mode === 'navigate') {

    event.respondWith(
      fetch(event.request)
        .then(response => {

          // Keep the latest index available offline.
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put('/Mathsoccer/index.html', copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match('/Mathsoccer/index.html');
        })
    );

    return;
  }


  // ==========================================
  // AUDIO / IMAGES / MANIFEST / OTHER FILES
  // ==========================================

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {

      // Offline/cache-first
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not cached — get it from network.
      return fetch(event.request)
        .then(response => {

          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copy);
            });
          }

          return response;
        })
        .catch(() => {

          // Last-resort offline page.
          return caches.match('/Mathsoccer/index.html');
        });
    })
  );
});