// Temporary aggressive update checker
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.2';
  
  console.log('Current version:', currentVersion, 'Latest version:', latestVersion);
  
  if (currentVersion !== latestVersion) {
    // Force update without user confirmation (temporary)
    localStorage.setItem('app-version', latestVersion);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }).then(() => {
          alert('Updating app to version 1.0.2...');
          window.location.reload(true);
        });
      });
    } else {
      alert('Updating app to version 1.0.2...');
      window.location.reload(true);
    }
  }
}

// Check immediately and more frequently
checkForUpdates();
setInterval(checkForUpdates, 5000); // Check every 5 seconds

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});