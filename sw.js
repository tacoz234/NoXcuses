const CACHE_NAME = 'noxcuses-v1.0.16'; // Update version to match
const urlsToCache = [
  './',
  './index.html?v=1.0.16',
  './workout.html?v=1.0.16',
  './exercises.html?v=1.0.16',
  './history.html?v=1.0.16',
  './social.html?v=1.0.16',
  './account.html?v=1.0.16',
  './settings.html?v=1.0.16',
  './index.js?v=1.0.16',
  './workout.js?v=1.0.16',
  './exercises.js?v=1.0.16',
  './history.js?v=1.0.16',
  './social.js?v=1.0.16',
  './account.js?v=1.0.16',
  './settings.js?v=1.0.16',
  './drawer.js?v=1.0.16',
  './modals.js?v=1.0.16',
  './navbar.js?v=1.0.16',
  './stopwatch.js?v=1.0.16',
  './workout-init.js?v=1.0.16',
  './exercise-management.js?v=1.0.16',
  './global-timer.js?v=1.0.16',
  './template-creation.js?v=1.0.16',
  './template-loading.js?v=1.0.16',
  './template-preview.js?v=1.0.16',
  './manifest.json?v=1.0.16',
  './icon-192.png?v=1.0.16',
  './badges.json?v=1.0.16',
  './exercises.json?v=1.0.16',
  './templates.json?v=1.0.16'
];

// Enhanced background timer monitoring for PWA
function startBackgroundTimerMonitoring() {
  if (backgroundTimerInterval) {
    clearInterval(backgroundTimerInterval);
  }
  
  backgroundTimerInterval = setInterval(async () => {
    try {
      const timerData = await getTimerDataFromStorage();
      
      if (timerData && timerData.isWorkoutActive) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
        const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);
        
        console.log(`SW Timer check: ${remainingTime}s remaining, notification shown: ${timerData.notificationShown}`);
        
        // Check if any clients are visible
        const clients = await self.clients.matchAll({ 
          type: 'window',
          includeUncontrolled: true 
        });
        
        const hasVisibleClient = clients.some(client => 
          client.visibilityState === 'visible' || client.focused
        );
        
        console.log('Clients:', clients.length, 'Visible:', hasVisibleClient);
        
        // If timer expired and no visible clients, show notification
        if (remainingTime <= 0 && !timerData.notificationShown) {
          console.log('Timer expired, showing notification. Visible clients:', hasVisibleClient);
          
          // Always show notification for PWA, regardless of visibility
          await showBackgroundNotification(timerData);
          await markNotificationShown();
        }
      }
    } catch (error) {
      console.error('Background timer check error:', error);
    }
  }, 100); // Very frequent checking for PWA
}

// Enhanced notification for PWA
async function showBackgroundNotification(timerData) {
  const { exerciseName, setNumber, currentExerciseIndex } = timerData;
  
  const notificationOptions = {
    body: `Time for ${exerciseName} Set ${setNumber}`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'rest-timer-' + currentExerciseIndex + '-' + setNumber,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    data: {
      exerciseName,
      setNumber,
      currentExerciseIndex,
      url: './workout.html'
    },
    // PWA-specific enhancements
    dir: 'auto',
    lang: 'en',
    persistent: true
  };
  
  try {
    // Only check permission, don't request it in service worker
    if (Notification.permission === 'granted') {
      await self.registration.showNotification('🔔 Rest Timer Complete!', notificationOptions);
      console.log('PWA notification shown for:', exerciseName, 'Set', setNumber);
    } else {
      console.log('Notification permission not granted, skipping notification');
    }
  } catch (error) {
    console.error('PWA notification failed:', error);
    // Fallback: try with minimal options
    try {
      if (Notification.permission === 'granted') {
        await self.registration.showNotification('Rest Timer Complete!', {
          body: `Time for ${exerciseName} Set ${setNumber}`,
          requireInteraction: true,
          tag: 'rest-timer-' + Date.now(),
          vibrate: [200, 100, 200]
        });
      }
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
    }
  }
}

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
  
  // **ENHANCED: More aggressive checking for better reliability**
  backgroundTimerInterval = setInterval(async () => {
    try {
      // Get timer data directly from storage simulation
      const timerData = await getTimerDataFromStorage();
      
      if (timerData && timerData.isWorkoutActive) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
        const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);
        
        console.log(`SW Timer check: ${remainingTime}s remaining, notification shown: ${timerData.notificationShown}`);
        
        // **ENHANCED: Check if any clients are visible**
        const clients = await self.clients.matchAll({ type: 'window' });
        const hasVisibleClient = clients.some(client => client.visibilityState === 'visible');
        
        // If timer expired and no visible clients, show notification
        if (remainingTime <= 0 && !timerData.notificationShown && !hasVisibleClient) {
          console.log('Timer expired in background, showing notification');
          await showBackgroundNotification(timerData);
          await markNotificationShown();
        }
      }
    } catch (error) {
      console.error('Background timer check error:', error);
    }
  }, 250); // **ENHANCED: Even more frequent checking (250ms)**
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
// Enhanced notification for better iOS compatibility
async function showBackgroundNotification(timerData) {
  const exerciseName = timerData.exerciseName || 'Exercise';
  const setNumber = (timerData.setIndex || 0) + 1;
  
  // For iOS, we need to be more aggressive with notification properties
  const notificationOptions = {
    body: `Time for your next set of ${exerciseName} (Set ${setNumber})\n\nTap to return to your workout`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'rest-timer-' + Date.now(), // Always unique tag
    requireInteraction: true, // Force user interaction
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'open-workout',
        title: '💪 Continue Workout'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ],
    data: {
      exerciseName: exerciseName,
      setNumber: setNumber,
      url: '/workout.html',
      timestamp: Date.now()
    },
    // iOS-specific enhancements
    renotify: true,
    timestamp: Date.now(),
    // Add these for better iOS compatibility
    dir: 'auto',
    lang: 'en'
  };
  
  // Try multiple notification strategies for iOS
  try {
    await self.registration.showNotification('🔔 Rest Timer Complete!', notificationOptions);
    console.log('Background notification shown for:', exerciseName, 'Set', setNumber);
  } catch (error) {
    console.error('Notification failed:', error);
    // Fallback: try with minimal options
    await self.registration.showNotification('Rest Timer Complete!', {
      body: `Time for ${exerciseName} Set ${setNumber}`,
      requireInteraction: true,
      tag: 'rest-timer-' + Date.now()
    });
  }
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