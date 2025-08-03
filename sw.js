const CACHE_NAME = 'noxcuses-v1.0.9';
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
  console.log('Service worker installing with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Taking control of all clients');
      // Force immediate control of all clients
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that a new version is available
      return self.clients.matchAll().then(clients => {
        console.log('Notifying', clients.length, 'clients of update');
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_NAME
          });
        });
      });
    })
  );
  
  // Start background timer monitoring when service worker activates
  startBackgroundTimerMonitoring();
});

// Background timer monitoring function
function startBackgroundTimerMonitoring() {
  if (backgroundTimerInterval) {
    clearInterval(backgroundTimerInterval);
  }
  
  // More frequent checking for iOS
  backgroundTimerInterval = setInterval(async () => {
    try {
      // Get timer data directly from storage simulation
      const timerData = await getTimerDataFromStorage();
      
      if (timerData && timerData.isWorkoutActive) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
        const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);
        
        console.log(`Timer check: ${remainingTime}s remaining, notification shown: ${timerData.notificationShown}`);
        
        // If timer expired, show notification
        if (remainingTime <= 0 && !timerData.notificationShown) {
          console.log('Timer expired, showing notification');
          await showBackgroundNotification(timerData);
          // Mark notification as shown by updating the stored data
          await markNotificationShown();
        }
      }
    } catch (error) {
      console.error('Background timer check error:', error);
    }
  }, 500); // Check every 500ms for more responsive notifications
}

// Function to get timer data (improved version)
async function getTimerDataFromStorage() {
  try {
    // Try to get data from clients first
    const clients = await self.clients.matchAll();
    
    if (clients.length > 0) {
      // Try to get data from active client
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        clients[0].postMessage({
          type: 'GET_TIMER_DATA'
        }, [messageChannel.port2]);
        
        // Timeout after 500ms and try alternative method
        setTimeout(() => {
          // Fallback: simulate localStorage access by checking if we have cached data
          // This is a workaround since service workers can't access localStorage directly
          resolve(getCachedTimerData());
        }, 500);
      });
    }
    
    return getCachedTimerData();
  } catch (error) {
    console.error('Error getting timer data:', error);
    return null;
  }
}

// Cache timer data when received from clients
let cachedTimerData = null;
let lastCacheUpdate = 0;

function getCachedTimerData() {
  // Return cached data if it's recent (within 5 seconds)
  if (cachedTimerData && (Date.now() - lastCacheUpdate) < 5000) {
    return cachedTimerData;
  }
  return null;
}

function updateCachedTimerData(data) {
  cachedTimerData = data;
  lastCacheUpdate = Date.now();
}

// Function to mark notification as shown
async function markNotificationShown() {
  const clients = await self.clients.matchAll();
  
  if (clients.length > 0) {
    clients[0].postMessage({
      type: 'MARK_NOTIFICATION_SHOWN'
    });
  }
  
  // Also update cached data
  if (cachedTimerData) {
    cachedTimerData.notificationShown = true;
  }
}

// Function to show background notification
async function showBackgroundNotification(timerData) {
  const exerciseName = timerData.exerciseName || 'Exercise';
  const setNumber = (timerData.setIndex || 0) + 1;
  
  // Enhanced notification for iOS compatibility
  await self.registration.showNotification('🔔 Rest Timer Complete!', {
    body: `Time for your next set of ${exerciseName} (Set ${setNumber})\n\nTap to return to your workout`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'rest-timer-' + Date.now(), // Unique tag to ensure notification shows
    requireInteraction: true,
    silent: false, // Allow sound
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    actions: [
      {
        action: 'open-workout',
        title: '💪 Continue Workout',
        icon: './icon-192.png'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ],
    data: {
      exerciseName: exerciseName,
      setNumber: setNumber,
      url: './workout.html',
      timestamp: Date.now()
    },
    // iOS-specific properties
    renotify: true,
    timestamp: Date.now()
  });
  
  console.log('Background notification shown for:', exerciseName, 'Set', setNumber);
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

// Handle messages from clients (improved)
self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_TIMER_DATA') {
    // This will be handled by the client-side code
  } else if (event.data.type === 'UPDATE_TIMER_DATA') {
    // Cache the timer data for background use
    updateCachedTimerData(event.data.timerData);
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Never cache update-checker.js - always fetch fresh
  if (noCacheFiles.some(file => url.pathname.endsWith(file.replace('./', '')))) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store'
      })
    );
    return;
  }
  
  // Use network-first strategy for better updates
  // This ensures users get the latest version as soon as it's available
  event.respondWith(
    fetch(event.request, {
      cache: 'no-cache' // Always check network first
    }).then(networkResponse => {
      // If network request succeeds, update cache and return response
      if (networkResponse && networkResponse.status === 200) {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }
      throw new Error('Network response not ok');
    }).catch(() => {
      // If network fails, fall back to cache
      return caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // If no cache either, return a basic error response
        return new Response('Offline - content not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});