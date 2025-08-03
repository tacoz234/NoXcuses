class UpdateChecker {
    constructor() {
        this.latestVersion = '1.0.25'; // Increment this for new updates
        this.currentVersion = this.getCurrentVersion();
        this.updateCheckInterval = null;
        this.isUpdating = false;
        this.hasShownNotification = false;
        
        this.init();
    }

    init() {
        console.log('UpdateChecker initialized. Current:', this.currentVersion, 'Latest:', this.latestVersion);
        
        // Check immediately on load
        this.checkForUpdates();
        
        // Check when page becomes visible (but less frequently)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isUpdating && !this.hasShownNotification) {
                console.log('Page became visible, checking for updates');
                this.checkForUpdates();
            }
        });
        
        // Check when window gains focus (but less frequently)
        window.addEventListener('focus', () => {
            if (!this.isUpdating && !this.hasShownNotification) {
                console.log('Window focused, checking for updates');
                this.checkForUpdates();
            }
        });
        
        // Less frequent checking - every 30 seconds when active
        this.updateCheckInterval = setInterval(() => {
            if (!document.hidden && !this.isUpdating && !this.hasShownNotification) {
                this.checkForUpdates();
            }
        }, 30000);
        
        // Enhanced service worker update handling
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SW_UPDATED') {
                    console.log('Service worker updated, forcing reload');
                    if (event.data.forceReload) {
                        this.forceUpdate();
                    } else {
                        this.showUpdateNotification();
                    }
                }
            });
            
            // Check for waiting service worker
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    console.log('Service worker waiting, showing update notification');
                    this.showUpdateNotification();
                }
            });
        }
    }

    getCurrentVersion() {
        // Try multiple methods to get current version
        const urlParams = new URLSearchParams(window.location.search);
        const urlVersion = urlParams.get('v');
        
        if (urlVersion) {
            return urlVersion;
        }
        
        // Check localStorage
        const storedVersion = localStorage.getItem('app-version');
        if (storedVersion) {
            return storedVersion;
        }
        
        // Check manifest or other sources
        const metaVersion = document.querySelector('meta[name="version"]');
        if (metaVersion) {
            return metaVersion.content;
        }
        
        return '1.0.0'; // fallback
    }

    async checkForUpdates() {
        if (this.isUpdating || this.hasShownNotification) return;
        
        try {
            console.log('Checking for updates...', this.currentVersion, 'vs', this.latestVersion);
            
            // Enhanced version checking with server validation
            const isProduction = !window.location.hostname.includes('localhost');
            
            if (isProduction) {
                // For production, also check server for version info
                try {
                    const response = await fetch(`./manifest.json?v=${Date.now()}`, {
                        cache: 'no-store',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                    
                    if (response.ok) {
                        const manifest = await response.json();
                        // Compare with latestVersion instead of currentVersion
                        if (manifest.version && manifest.version !== this.latestVersion) {
                            console.log('Server version newer than expected:', manifest.version, 'vs', this.latestVersion);
                            // Update our latest version to match server
                            this.latestVersion = manifest.version;
                        }
                        
                        // Now check if current version needs updating
                        if (manifest.version && manifest.version !== this.currentVersion) {
                            console.log('Server version mismatch detected:', manifest.version, 'vs current:', this.currentVersion);
                            this.showUpdateNotification();
                            this.hasShownNotification = true;
                            return;
                        }
                    }
                } catch (e) {
                    console.log('Server version check failed:', e);
                }
            }
            
            // Standard version check
            if (this.currentVersion !== this.latestVersion) {
                console.log('Update available! Current:', this.currentVersion, 'Latest:', this.latestVersion);
                this.showUpdateNotification();
                this.hasShownNotification = true;
            }
        } catch (error) {
            console.error('Update check failed:', error);
        }
    }

    showUpdateNotification() {
        // Check if we've already shown the notification for this version
        const lastNotifiedVersion = localStorage.getItem('last-notified-version');
        if (lastNotifiedVersion === this.latestVersion) {
            console.log('Already notified for version:', this.latestVersion);
            return; // Don't spam notifications
        }
        
        // Create update notification
        const updateDiv = document.createElement('div');
        updateDiv.id = 'updateNotification';
        updateDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #1f2937;
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                font-family: Arial, sans-serif;
            ">
                <div style="font-weight: bold; margin-bottom: 8px;">🚀 Update Available!</div>
                <div style="margin-bottom: 12px; font-size: 14px;">Version ${this.latestVersion} is ready to install.</div>
                <div style="display: flex; gap: 8px;">
                    <button id="updateNow" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Update Now</button>
                    <button id="updateLater" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Later</button>
                </div>
            </div>
        `;
        
        // Remove existing notification if any
        const existing = document.getElementById('updateNotification');
        if (existing) existing.remove();
        
        document.body.appendChild(updateDiv);
        
        // Add event listeners
        document.getElementById('updateNow').onclick = () => {
            updateDiv.remove();
            // Mark as notified before updating to prevent loops
            localStorage.setItem('last-notified-version', this.latestVersion);
            this.performUpdate();
        };
        
        document.getElementById('updateLater').onclick = () => {
            updateDiv.remove();
            // Remember we showed notification for this version
            localStorage.setItem('last-notified-version', this.latestVersion);
            this.hasShownNotification = true;
        };
        
        // Removed the auto-hide timeout - notification will persist until user action
    }

    async performUpdate() {
        if (this.isUpdating) return;
        this.isUpdating = true;
        
        console.log('Performing aggressive update...');
        
        try {
            // Enhanced production update strategy
            const isProduction = !window.location.hostname.includes('localhost');
            
            // 1. Unregister ALL service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('Unregistering', registrations.length, 'service workers');
                
                for (const registration of registrations) {
                    await registration.unregister();
                }
                
                // Wait a bit for unregistration to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 2. Clear ALL caches aggressively
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('Clearing', cacheNames.length, 'caches');
                
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            // 3. Clear all storage except notification permissions
            const notificationAsked = localStorage.getItem('notification-permission-asked');
            const notificationResult = localStorage.getItem('notification-permission-result');
            
            localStorage.clear();
            sessionStorage.clear();
            
            // Restore notification permissions
            if (notificationAsked) {
                localStorage.setItem('notification-permission-asked', notificationAsked);
            }
            if (notificationResult) {
                localStorage.setItem('notification-permission-result', notificationResult);
            }
            
            // 4. Set the new version
            localStorage.setItem('app-version', this.latestVersion);
            localStorage.setItem('last-update-check', Date.now().toString());
            
            // 5. Clear IndexedDB
            if ('indexedDB' in window) {
                try {
                    const databases = await indexedDB.databases();
                    await Promise.all(
                        databases.map(db => {
                            return new Promise((resolve) => {
                                const deleteReq = indexedDB.deleteDatabase(db.name);
                                deleteReq.onsuccess = () => resolve();
                                deleteReq.onerror = () => resolve();
                            });
                        })
                    );
                } catch (e) {
                    console.log('IndexedDB clear failed:', e);
                }
            }
            
            // 6. Enhanced cache busting for production
            const timestamp = Date.now();
            const currentUrl = new URL(window.location.href);
            
            // Clear all URL parameters first
            currentUrl.search = '';
            
            // Add aggressive cache busting
            currentUrl.searchParams.set('v', this.latestVersion);
            currentUrl.searchParams.set('_t', timestamp);
            currentUrl.searchParams.set('_force', '1');
            currentUrl.searchParams.set('_cb', Math.random().toString(36));
            
            if (isProduction) {
                // Additional production cache busting
                currentUrl.searchParams.set('_prod_update', '1');
                currentUrl.searchParams.set('_no_cache', timestamp);
            }
            
            console.log('Forcing reload to:', currentUrl.href);
            
            // Use location.href instead of replace for more aggressive reload
            window.location.href = currentUrl.href;
            
        } catch (error) {
            console.error('Update failed:', error);
            // Fallback: aggressive reload
            window.location.href = window.location.href + '?_force_reload=' + Date.now();
        }
    }

    forceUpdate() {
        console.log('Force update requested');
        this.performUpdate();
    }

    destroy() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
        }
    }
}

// Initialize update checker
const updateChecker = new UpdateChecker();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    updateChecker.destroy();
});