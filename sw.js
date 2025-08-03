const CACHE_NAME = 'noxcuses-v1.0.2'; // Update version number when you make changes
const urlsToCache = [
  './',
  './index.html',
  './workout.html',
  './exercises.html',
  './history.html',
  './social.html',
  './account.html',
  './settings.html',
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
  './manifest.json',
  './icon-192.png',
  './badges.json',
  './exercises.json',
  './templates.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Force activation of new service worker
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});