const CACHE_NAME = 'noxcuses-v1.0.3';
const urlsToCache = [
  './',
  './index.html',
  './workout.html',
  './exercises.html',
  './history.html',
  './social.html',
  './account.html',
  './settings.html',
  // JS files
  './index.js',
  './workout.js',
  './exercises.js',
  './history.js',
  './social.js',
  './account.js',
  './settings.js',
  './drawer.js',
  './modals.js',
  './navbar.js',
  './stopwatch.js',
  './workout-init.js',
  './exercise-management.js',
  './global-timer.js',
  './template-creation.js',
  './template-loading.js',
  './template-preview.js',
  // Assets
  './manifest.json',
  './icon-192.png',
  './badges.json',
  './exercises.json',
  './templates.json'
];

// Don't cache update-checker.js - always fetch fresh
const noCacheFiles = ['./update-checker.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache update-checker.js - always fetch fresh
  if (noCacheFiles.some(file => url.pathname.endsWith(file.replace('./', '')))) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      }
    )
  );
});