// Bergwerk Idle — Service Worker for PWA
// V3: Cache bust on update (new CACHE_NAME per deploy), network-first for HTML
const CACHE_NAME = 'bergwerk-v3';
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  BASE + '/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW v3] pre-caching', ASSETS);
      return cache.addAll(ASSETS).catch(err => {
        console.warn('[SW v3] pre-cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      console.log('[SW v3] purging old caches:', keys.filter(k => k !== CACHE_NAME));
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
  console.log('[SW v3] activated, base:', BASE);
});

self.addEventListener('fetch', event => {
  // Skip non-GET and Supabase API
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/functions/v1/')) return;

  // Network-first for HTML (always get latest index.html)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (immutable hashed filenames)
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});