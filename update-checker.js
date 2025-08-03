// Enhanced update checker with cache busting
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.6';
  
  console.log('Current version:', currentVersion, 'Latest version:', latestVersion);
  
  // Store last check time
  localStorage.setItem('last-update-check', Date.now().toString());
  
  if (currentVersion !== latestVersion) {
    if (confirm('A new version is available! Update now? (Your data will be preserved)')) {
      localStorage.setItem('app-version', latestVersion);
      
      // Enhanced reload with aggressive cache clearing
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          // Unregister all service workers
          Promise.all(registrations.map(reg => reg.unregister())).then(() => {
            // Clear all caches
            caches.keys().then(cacheNames => {
              return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
              );
            }).then(() => {
              // Clear localStorage update flags
              localStorage.removeItem('sw-cache-cleared');
              // Force reload with cache bypass and timestamp
              window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now() + '&cache-bust=' + Math.random();
            });
          });
        });
      } else {
        // Fallback for browsers without service worker
        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now() + '&cache-bust=' + Math.random();
      }
    }
  }
}

// Force version check on first load if no version is set
if (!localStorage.getItem('app-version')) {
  localStorage.setItem('app-version', '1.0.6');
  localStorage.setItem('last-update-check', Date.now().toString());
}

// Check on app start
checkForUpdates();

// Check when app becomes visible (more frequent for better detection)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});

// Check every 15 seconds when active (more frequent)
setInterval(() => {
  if (!document.hidden) {
    checkForUpdates();
  }
}, 15000);