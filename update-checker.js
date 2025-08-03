// Enhanced update checker with cache busting
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.3';
  
  console.log('Current version:', currentVersion, 'Latest version:', latestVersion);
  
  if (currentVersion !== latestVersion) {
    if (confirm('A new version is available! Update now? (Your data will be preserved)')) {
      localStorage.setItem('app-version', latestVersion);
      
      // Enhanced reload with service worker cache clearing
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
              // Force reload with cache bypass
              window.location.href = window.location.href + '?v=' + Date.now();
            });
          });
        });
      } else {
        window.location.href = window.location.href + '?v=' + Date.now();
      }
    }
  }
}

// Check on app start
checkForUpdates();

// Check when app becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});

// Check every 30 seconds when active
setInterval(() => {
  if (!document.hidden) {
    checkForUpdates();
  }
}, 30000);