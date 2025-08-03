const CACHE_NAME = 'noxcuses-v1.0.4';
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

// Background timer monitoring
let backgroundTimerInterval = null;

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
  
  // Start background timer monitoring when service worker activates
  startBackgroundTimerMonitoring();
});

// Background timer monitoring function
function startBackgroundTimerMonitoring() {
  if (backgroundTimerInterval) {
    clearInterval(backgroundTimerInterval);
  }
  
  backgroundTimerInterval = setInterval(async () => {
    try {
      // Check if there's an active rest timer
      const clients = await self.clients.matchAll();
      
      // Get timer data from IndexedDB or simulate localStorage access
      const timerData = await getTimerDataFromStorage();
      
      if (timerData && timerData.isWorkoutActive) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
        const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);
        
        // If timer expired, show notification
        if (remainingTime <= 0 && !timerData.notificationShown) {
          await showBackgroundNotification(timerData);
          // Mark notification as shown
          await updateTimerNotificationStatus(timerData);
        }
      }
    } catch (error) {
      console.error('Background timer check error:', error);
    }
  }, 1000);
}

// Function to get timer data (simulating localStorage access)
async function getTimerDataFromStorage() {
  try {
    // Since service workers can't access localStorage directly,
    // we'll use postMessage to get data from clients
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        clients[0].postMessage({
          type: 'GET_TIMER_DATA'
        }, [messageChannel.port2]);
        
        // Timeout after 1 second
        setTimeout(() => resolve(null), 1000);
      });
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Function to show background notification
async function showBackgroundNotification(timerData) {
  const exerciseName = timerData.exerciseName || 'Exercise';
  const setNumber = (timerData.setIndex || 0) + 1;
  
  await self.registration.showNotification('Rest Timer Complete! 💪', {
    body: `Time for your next set of ${exerciseName} (Set ${setNumber})`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'rest-timer',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'open-workout',
        title: 'Go to Workout'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      exerciseName: exerciseName,
      setNumber: setNumber,
      url: './workout.html'
    }
  });
}

// Function to update notification status
async function updateTimerNotificationStatus(timerData) {
  const clients = await self.clients.matchAll();
  
  if (clients.length > 0) {
    clients[0].postMessage({
      type: 'MARK_NOTIFICATION_SHOWN',
      timerData: timerData
    });
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open-workout') {
    event.waitUntil(
      clients.openWindow('./workout.html')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the workout page
    event.waitUntil(
      clients.openWindow('./workout.html')
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_TIMER_DATA') {
    // This will be handled by the client-side code
  }
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
      })
  );
});