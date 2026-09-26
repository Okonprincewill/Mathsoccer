// MathSoccer Service Worker
// Mathsoccer repo - offline PWA version

const CACHE_NAME = 'mathsoccer-v10-audio';

const APP_ROOT = '/Mathsoccer/';

// ✅ FILES TO CACHE - NO APP_ROOT ALONE!
const FILES_TO_CACHE = [
    APP_ROOT + 'index.html',
    APP_ROOT + 'manifest.json',
    APP_ROOT + 'pwabuilder-sw.js',
    APP_ROOT + 'icon-512.png',
    APP_ROOT + 'icon-192.png',
    APP_ROOT + 'screenshot1.png',
    APP_ROOT + 'screenshot2.png',
    APP_ROOT + 'screenshot3.png',
    APP_ROOT + 'screenshot4.png'
];

// Audio files - optional
const AUDIO_FILES = [
    APP_ROOT + 'explode.mp3',
    APP_ROOT + 'kick.mp3',
    APP_ROOT + 'ball.mp3',
    APP_ROOT + 'Mathsoccer_touch.mp3',
    APP_ROOT + 'cheer_goal.mp3',
    APP_ROOT + 'crowd_louds.mp3',
    APP_ROOT + 'Mathsoccer_cool.mp3',
    APP_ROOT + 'maths.mp3',
    APP_ROOT + 'disappointed.mp3'
];

// ============================================================
// INSTALL
// ============================================================

self.addEventListener('install', event => {
    console.log('📦 Installing Mathsoccer SW...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                // 1. Cache core files (MUST succeed)
                console.log('📦 Caching core files...');
                await cache.addAll(FILES_TO_CACHE);
                console.log('✅ Core files cached!');
                
                // 2. Cache audio files (try each one)
                console.log('📦 Caching audio files...');
                let audioCached = 0;
                let audioFailed = 0;
                
                for (const audio of AUDIO_FILES) {
                    try {
                        await cache.add(audio);
                        audioCached++;
                        console.log(`  ✅ ${audio.split('/').pop()}`);
                    } catch (e) {
                        audioFailed++;
                        console.log(`  ⚠️ ${audio.split('/').pop()} (not cached)`);
                    }
                }
                
                console.log(`📊 Audio: ${audioCached} cached, ${audioFailed} failed`);
                console.log('✅ Mathsoccer SW installed!');
                
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Installation failed:', error);
                throw error;
            })
    );
});

// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener('activate', event => {
    console.log('🚀 Activating Mathsoccer SW...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('mathsoccer-') && name !== CACHE_NAME)
                        .map(name => {
                            console.log(`🗑️ Deleting: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('✅ SW activated!');
                return self.clients.claim();
            })
    );
});

// ============================================================
// SKIP WAITING MESSAGE
// ============================================================

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', event => {
    const request = event.request;
    
    if (request.method !== 'GET') return;
    
    // HTML navigation - network first, fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, copy);
                    });
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(APP_ROOT + 'index.html');
                    if (cached) return cached;
                    return new Response('Mathsoccer offline', { status: 503 });
                })
        );
        return;
    }
    
    // Assets - cache first
    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, copy);
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Fallback for images
                if (request.url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
                    return caches.match(APP_ROOT + 'icon-512.png');
                }
                // Fallback for audio (silence)
                if (request.url.endsWith('.mp3')) {
                    return new Response(new ArrayBuffer(0), {
                        headers: { 'Content-Type': 'audio/mpeg' }
                    });
                }
                return new Response('Offline', { status: 503 });
            })
    );
});

console.log('⚽ Mathsoccer SW loaded!');