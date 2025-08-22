const CACHE_NAME = 'noxcuses-v1.0.45'; // Increment version
const urlsToCache = [
  './',
  './index.html?v=1.0.45',
  './workout.html?v=1.0.45',
  './exercises.html?v=1.0.45',
  './history.html?v=1.0.45',
  './social.html?v=1.0.45',
  './account.html?v=1.0.45',
  './settings.html?v=1.0.45',
  './index.js?v=1.0.45',
  './workout.js?v=1.0.45',
  './exercises.js?v=1.0.45',
  './history.js?v=1.0.45',
  './social.js?v=1.0.45',
  './account.js?v=1.0.45',
  './settings.js?v=1.0.45',
  './drawer.js?v=1.0.45',
  './modals.js?v=1.0.45',
  './navbar.js?v=1.0.45',
  './stopwatch.js?v=1.0.45',
  './update-checker.js?v=1.0.45',
  './workout-init.js?v=1.0.45',
  './exercise-management.js?v=1.0.45',
  './global-timer.js?v=1.0.45',
  './template-creation.js?v=1.0.45',
  './template-loading.js?v=1.0.45',
  './template-preview.js?v=1.0.45',
  './manifest.json?v=1.0.45',
  './icon-3.png?v=1.0.45',
  './badges.json?v=1.0.45',
  './exercises.json?v=1.0.45',
  './templates.json?v=1.0.45'
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
    icon: './icon-3.png',
    badge: './icon-3.png',
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

let backgroundTimerInterval = null;

self.addEventListener('install', (event) => {
  console.log('Service worker installing with cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Use cache-busting for initial install
        const cacheBustingUrls = urlsToCache.map(url => {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}_sw_install=${Date.now()}`;
        });
        return cache.addAll(cacheBustingUrls);
      })
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
            version: CACHE_NAME,
            forceReload: true // Add this flag
          });
        });
      });
    })
  );
  
  // Start background timer monitoring when service worker activates
  startBackgroundTimerMonitoring();
});

// Background timer monitoring function
// Enhanced background timer monitoring for iOS compatibility
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
                
                // iOS-friendly notification logic
                if (remainingTime <= 0 && !timerData.notificationShown) {
                    console.log('Timer expired, showing notification. Visible clients:', hasVisibleClient);
                    
                    // Always try to show notification on iOS, regardless of visibility
                    // iOS PWAs need more aggressive notification handling
                    await showBackgroundNotification(timerData);
                    await markNotificationShown();
                }
            }
        } catch (error) {
            console.error('Background timer check error:', error);
        }
    }, 500); // Increased frequency for iOS reliability
}

// Enhanced notification for iOS compatibility
async function showBackgroundNotification(timerData) {
    const exerciseName = timerData.exerciseName || 'Exercise';
    const setNumber = (timerData.setIndex || 0) + 1;
    
    // iOS-optimized notification options
    const notificationOptions = {
        body: `Time for your next set of ${exerciseName} (Set ${setNumber})`,
        icon: './icon-3.png',
        badge: './icon-3.png',
        tag: 'rest-timer-' + Date.now(), // Always unique for iOS
        requireInteraction: true, // Force user interaction on iOS
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
            url: './workout.html',
            timestamp: Date.now()
        },
        // iOS-specific properties
        renotify: true,
        timestamp: Date.now(),
        dir: 'auto',
        lang: 'en'
    };
    
    try {
        // Check permission before showing notification
        if (Notification.permission === 'granted') {
            await self.registration.showNotification('🔔 Rest Timer Complete!', notificationOptions);
            console.log('Background notification shown for:', exerciseName, 'Set', setNumber);
        } else {
            console.warn('Notification permission not granted:', Notification.permission);
        }
    } catch (error) {
        console.error('Notification failed:', error);
        
        // iOS fallback: try with minimal options
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
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
    return;
  }
  
  // Enhanced cache-busting strategy for production
  event.respondWith(
    (async () => {
      try {
        // Create cache-busting request
        const cacheBustUrl = new URL(event.request.url);
        cacheBustUrl.searchParams.set('_cb', Date.now());
        
        const cacheBustRequest = new Request(cacheBustUrl.href, {
          method: event.request.method,
          headers: {
            ...Object.fromEntries(event.request.headers.entries()),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          mode: event.request.mode,
          credentials: event.request.credentials,
          redirect: event.request.redirect
        });
        
        // Try network first with cache busting
        const networkResponse = await fetch(cacheBustRequest);
        
        if (networkResponse && networkResponse.status === 200) {
          // Update cache with the fresh response
          const responseClone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, responseClone);
          return networkResponse;
        }
        
        throw new Error('Network response not ok');
      } catch (networkError) {
        console.log('Network failed, trying cache:', networkError);
        
        // Fall back to cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If no cache either, return a basic error response
        return new Response('Offline - content not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// Add this to your service worker
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Rest Timer Complete! 💪',
    body: 'Your rest period is over. Time for the next set!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'rest-timer',
    requireInteraction: true
  };
  
  // If push has data, use it
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (e) {
      console.log('Push data not JSON:', event.data.text());
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData
    })
  );
});

// Add these missing functions:
let cachedTimerData = null;

// Function to get timer data from storage or cache
async function getTimerDataFromStorage() {
    try {
        // First try to get from cached data (sent from client)
        if (cachedTimerData) {
            return cachedTimerData;
        }
        
        // Fallback: try to get from clients
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        
        if (clients.length > 0) {
            // Request timer data from the first available client
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                clients[0].postMessage(
                    { type: 'GET_TIMER_DATA' },
                    [messageChannel.port2]
                );
                
                // Timeout after 1 second
                setTimeout(() => resolve(null), 1000);
            });
        }
        
        return null;
    } catch (error) {
        console.error('Error getting timer data:', error);
        return null;
    }
}

// Function to mark notification as shown
async function markNotificationShown() {
    try {
        // Update cached data
        if (cachedTimerData) {
            cachedTimerData.notificationShown = true;
        }
        
        // Notify all clients to update their localStorage
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        
        clients.forEach(client => {
            client.postMessage({
                type: 'MARK_NOTIFICATION_SHOWN'
            });
        });
    } catch (error) {
        console.error('Error marking notification as shown:', error);
    }
}

// Function to update cached timer data
function updateCachedTimerData(timerData) {
    cachedTimerData = timerData;
    console.log('Updated cached timer data:', timerData);
}

// Enhanced background timer monitoring for iOS compatibility
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
                
                // iOS-friendly notification logic
                if (remainingTime <= 0 && !timerData.notificationShown) {
                    console.log('Timer expired, showing notification. Visible clients:', hasVisibleClient);
                    
                    // Always try to show notification on iOS, regardless of visibility
                    // iOS PWAs need more aggressive notification handling
                    await showBackgroundNotification(timerData);
                    await markNotificationShown();
                }
            }
        } catch (error) {
            console.error('Background timer check error:', error);
        }
    }, 500); // Increased frequency for iOS reliability
}

// Enhanced notification for iOS compatibility
async function showBackgroundNotification(timerData) {
    const exerciseName = timerData.exerciseName || 'Exercise';
    const setNumber = (timerData.setIndex || 0) + 1;
    
    // iOS-optimized notification options
    const notificationOptions = {
        body: `Time for your next set of ${exerciseName} (Set ${setNumber})`,
        icon: './icon-3.png',
        badge: './icon-3.png',
        tag: 'rest-timer-' + Date.now(), // Always unique for iOS
        requireInteraction: true, // Force user interaction on iOS
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
            url: './workout.html',
            timestamp: Date.now()
        },
        // iOS-specific properties
        renotify: true,
        timestamp: Date.now(),
        dir: 'auto',
        lang: 'en'
    };
    
    try {
        // Check permission before showing notification
        if (Notification.permission === 'granted') {
            await self.registration.showNotification('🔔 Rest Timer Complete!', notificationOptions);
            console.log('Background notification shown for:', exerciseName, 'Set', setNumber);
        } else {
            console.warn('Notification permission not granted:', Notification.permission);
        }
    } catch (error) {
        console.error('Notification failed:', error);
        
        // iOS fallback: try with minimal options
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
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
    return;
  }
  
  // Enhanced cache-busting strategy for production
  event.respondWith(
    (async () => {
      try {
        // Create cache-busting request
        const cacheBustUrl = new URL(event.request.url);
        cacheBustUrl.searchParams.set('_cb', Date.now());
        
        const cacheBustRequest = new Request(cacheBustUrl.href, {
          method: event.request.method,
          headers: {
            ...Object.fromEntries(event.request.headers.entries()),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          mode: event.request.mode,
          credentials: event.request.credentials,
          redirect: event.request.redirect
        });
        
        // Try network first with cache busting
        const networkResponse = await fetch(cacheBustRequest);
        
        if (networkResponse && networkResponse.status === 200) {
          // Update cache with the fresh response
          const responseClone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, responseClone);
          return networkResponse;
        }
        
        throw new Error('Network response not ok');
      } catch (networkError) {
        console.log('Network failed, trying cache:', networkError);
        
        // Fall back to cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If no cache either, return a basic error response
        return new Response('Offline - content not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});