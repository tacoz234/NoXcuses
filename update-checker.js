// Enhanced automatic update checker with more aggressive cache invalidation
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.11';
  
  console.log('Current version:', currentVersion, 'Latest version:', latestVersion);
  
  // Store last check time
  localStorage.setItem('last-update-check', Date.now().toString());
  
  if (currentVersion !== latestVersion) {
    console.log('New version detected, forcing update...');
    
    // Update version immediately
    localStorage.setItem('app-version', latestVersion);
    
    // More aggressive cache clearing approach
    if ('serviceWorker' in navigator) {
      // First, try to clear all caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('All caches cleared');
        
        // Then unregister service workers
        return navigator.serviceWorker.getRegistrations();
      }).then(registrations => {
        return Promise.all(registrations.map(reg => {
          console.log('Unregistering service worker:', reg.scope);
          return reg.unregister();
        }));
      }).then(() => {
        console.log('Service workers unregistered');
        
        // Clear localStorage flags
        localStorage.removeItem('sw-cache-cleared');
        localStorage.removeItem('notification-permission-asked');
        
        // Force hard reload with aggressive cache busting
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const sessionId = Math.random().toString(36).substring(7);
        
        // Clear browser cache headers
        const newUrl = window.location.href.split('?')[0] + 
          `?v=${latestVersion}&t=${timestamp}&r=${random}&s=${sessionId}&nocache=true&_=${Date.now()}`;
        
        console.log('Forcing reload with URL:', newUrl);
        
        // Use location.replace to avoid back button issues
        window.location.replace(newUrl);
      }).catch(error => {
        console.error('Error during update process:', error);
        // Fallback: just reload with cache busting
        const timestamp = Date.now();
        const newUrl = window.location.href.split('?')[0] + `?v=${latestVersion}&t=${timestamp}&nocache=true`;
        window.location.replace(newUrl);
      });
    } else {
      // Fallback for browsers without service worker
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const newUrl = window.location.href.split('?')[0] + 
        `?v=${latestVersion}&t=${timestamp}&r=${random}&nocache=true`;
      window.location.replace(newUrl);
    }
  }
}

// Enhanced version detection
function forceVersionUpdate() {
  // Clear any cached version info
  localStorage.removeItem('app-version');
  localStorage.removeItem('last-update-check');
  
  // Set to latest version
  localStorage.setItem('app-version', '1.0.11');
  localStorage.setItem('last-update-check', Date.now().toString());
}

// Force version check on first load if no version is set or version is old
const storedVersion = localStorage.getItem('app-version');
if (!storedVersion || storedVersion === '1.0.3' || storedVersion < '1.0.11') {
  console.log('Forcing version update from:', storedVersion);
  forceVersionUpdate();
}

// Check on app start with delay to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkForUpdates, 500);
  });
} else {
  setTimeout(checkForUpdates, 500);
}

// Check when app becomes visible (more aggressive checking)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Delay to ensure page is fully loaded
    setTimeout(checkForUpdates, 2000);
  }
});

// Check every 10 seconds when active (more frequent for faster updates)
setInterval(() => {
  if (!document.hidden) {
    checkForUpdates();
  }
}, 10000);

// Also check on page focus
window.addEventListener('focus', () => {
  setTimeout(checkForUpdates, 1000);
});