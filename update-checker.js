// Enhanced automatic update checker with aggressive cache invalidation
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.10';
  
  console.log('Current version:', currentVersion, 'Latest version:', latestVersion);
  
  // Store last check time
  localStorage.setItem('last-update-check', Date.now().toString());
  
  if (currentVersion !== latestVersion) {
    console.log('New version detected, forcing update...');
    
    // Update version immediately
    localStorage.setItem('app-version', latestVersion);
    
    // Force immediate update without user confirmation
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        // Unregister all service workers first
        Promise.all(registrations.map(reg => reg.unregister())).then(() => {
          console.log('Service workers unregistered');
          
          // Clear all caches aggressively
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => {
                console.log('Deleting cache:', cacheName);
                return caches.delete(cacheName);
              })
            );
          }).then(() => {
            console.log('All caches cleared');
            
            // Clear any update flags
            localStorage.removeItem('sw-cache-cleared');
            
            // Force hard reload with multiple cache-busting parameters
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const newUrl = window.location.href.split('?')[0] + 
              `?v=${latestVersion}&t=${timestamp}&r=${random}&cache-bust=true`;
            
            console.log('Reloading with URL:', newUrl);
            window.location.replace(newUrl);
          });
        });
      });
    } else {
      // Fallback for browsers without service worker
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const newUrl = window.location.href.split('?')[0] + 
        `?v=${latestVersion}&t=${timestamp}&r=${random}&cache-bust=true`;
      window.location.replace(newUrl);
    }
  }
}

// Force version check on first load if no version is set
if (!localStorage.getItem('app-version')) {
  localStorage.setItem('app-version', '1.0.10');
  localStorage.setItem('last-update-check', Date.now().toString());
}

// Check on app start
checkForUpdates();

// Check when app becomes visible (more aggressive checking)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Small delay to ensure page is fully loaded
    setTimeout(checkForUpdates, 1000);
  }
});

// Check every 15 seconds when active (more frequent for faster updates)
setInterval(() => {
  if (!document.hidden) {
    checkForUpdates();
  }
}, 15000);