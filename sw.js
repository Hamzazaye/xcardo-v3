/**
 * XcardO — Warlords of the Obsidian Altar
 * Offline-First PWA Service Worker
 */

const CACHE_NAME = 'xcardo-v3-cache-v4';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './assets/logo-xcardo-crest.png',
  './assets/logo-xcardo-nav.png',
  './assets/portraits/hero_paladin.jpg',
  './assets/portraits/hero_valkyrie.jpg',
  './assets/portraits/hero_archmage.jpg',
  './assets/portraits/hero_dragonknight.jpg',
  './assets/portraits/hero_ranger.jpg',
  './assets/portraits/hero_deathknight.jpg',
  './assets/portraits/boss_malakor.jpg',
  './assets/portraits/boss_vespera.jpg',
  './assets/portraits/boss_vorn.jpg',
  './assets/portraits/boss_thurible.jpg',
  './assets/portraits/boss_carmilla.jpg',
  './assets/portraits/boss_hollow_seraph.jpg',
  './src/main.js',
  './src/core/event-bus.js',
  './src/core/rng.js',
  './src/core/save-manager.js',
  './src/data/gothic-config.js',
  './src/engine/pattern-detector.js',
  './src/engine/ai-brain.js',
  './src/engine/game-state.js',
  './src/three/gothic-scene.js',
  './src/three/sculptor-3d.js',
  './src/three/shatter-physics.js',
  './src/ui/app-controller.js',
  './src/ui/gothic-svg.js',
  './src/audio/sound-engine.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
