// Check for updates periodically
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.1'; // Update this when you release
  
  if (currentVersion !== latestVersion) {
    if (confirm('A new version is available! Update now? (Your data will be preserved)')) {
      localStorage.setItem('app-version', latestVersion);
      
      // Enhanced reload with service worker cache clearing
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          // Clear all caches
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }).then(() => {
            window.location.reload(true);
          });
        });
      } else {
        window.location.reload(true);
      }
    }
  }
}

// Check on app start
checkForUpdates();

// Check when app becomes visible (user switches back to it)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});