// Enhanced automatic update checker
function checkForUpdates() {
  const currentVersion = localStorage.getItem('app-version') || '1.0.0';
  const latestVersion = '1.0.8';
  
  console.log('Current version:', currentVersion, 'Latest version:', latestVersion);
  
  // Store last check time
  localStorage.setItem('last-update-check', Date.now().toString());
  
  if (currentVersion !== latestVersion) {
    console.log('New version available, updating automatically...');
    
    // Update version in localStorage
    localStorage.setItem('app-version', latestVersion);
    
    // Register for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(registration => {
        // Check for updates
        registration.update();
        
        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready, reload the page
              console.log('New version installed, reloading...');
              window.location.reload();
            }
          });
        });
      });
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'SW_UPDATED') {
          console.log('Service worker updated, reloading page...');
          // Small delay to ensure everything is ready
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      });
    } else {
      // Fallback for browsers without service worker
      console.log('No service worker support, doing hard reload...');
      window.location.reload(true);
    }
  }
}

// Initialize version on first load
if (!localStorage.getItem('app-version')) {
  localStorage.setItem('app-version', '1.0.8');
  localStorage.setItem('last-update-check', Date.now().toString());
}

// Check on app start
checkForUpdates();

// Check when app becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates();
  }
});

// Check every 30 seconds when active (less frequent to reduce overhead)
setInterval(() => {
  if (!document.hidden) {
    checkForUpdates();
  }
}, 30000);