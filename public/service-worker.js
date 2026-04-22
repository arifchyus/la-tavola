// La Tavola Service Worker - offline caching
const CACHE_NAME = 'latavola-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
];

// Install: cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS).catch(() => {
        // Some URLs may not exist at install time - that's OK
        return Promise.resolve();
      }))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached version immediately if available
      if (cached) {
        // Update cache in background
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }

      // Otherwise fetch from network and cache
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Network failed - try to return cached index for SPA routes
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Listen for sync events when coming back online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    // Client-side code handles actual sync - this just wakes up the app
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({type: 'sync-orders'}));
    });
  }
});
