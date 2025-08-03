class UpdateChecker {
    constructor() {
        this.latestVersion = '1.0.13'; // Increment this for new updates
        this.currentVersion = this.getCurrentVersion();
        this.updateCheckInterval = null;
        this.isUpdating = false;
        
        this.init();
    }

    init() {
        console.log('UpdateChecker initialized. Current:', this.currentVersion, 'Latest:', this.latestVersion);
        
        // Check immediately on load
        this.checkForUpdates();
        
        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isUpdating) {
                console.log('Page became visible, checking for updates');
                this.checkForUpdates();
            }
        });
        
        // Check when window gains focus
        window.addEventListener('focus', () => {
            if (!this.isUpdating) {
                console.log('Window focused, checking for updates');
                this.checkForUpdates();
            }
        });
        
        // More frequent checking - every 5 seconds when active
        this.updateCheckInterval = setInterval(() => {
            if (!document.hidden && !this.isUpdating) {
                this.checkForUpdates();
            }
        }, 5000);
        
        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SW_UPDATED') {
                    console.log('Service worker updated, forcing reload');
                    this.forceUpdate();
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
        if (this.isUpdating) return;
        
        try {
            console.log('Checking for updates...', this.currentVersion, 'vs', this.latestVersion);
            
            if (this.currentVersion !== this.latestVersion) {
                console.log('Update available! Current:', this.currentVersion, 'Latest:', this.latestVersion);
                await this.performUpdate();
            }
        } catch (error) {
            console.error('Update check failed:', error);
        }
    }

    async performUpdate() {
        if (this.isUpdating) return;
        this.isUpdating = true;
        
        console.log('Performing aggressive update...');
        
        try {
            // 1. Unregister ALL service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('Unregistering', registrations.length, 'service workers');
                
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
            
            // 2. Clear ALL caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('Clearing', cacheNames.length, 'caches');
                
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            // 3. Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // 4. Set the new version in localStorage
            localStorage.setItem('app-version', this.latestVersion);
            localStorage.setItem('last-update-check', Date.now().toString());
            
            // 4. Clear IndexedDB if present
            if ('indexedDB' in window) {
                try {
                    const databases = await indexedDB.databases();
                    await Promise.all(
                        databases.map(db => {
                            return new Promise((resolve) => {
                                const deleteReq = indexedDB.deleteDatabase(db.name);
                                deleteReq.onsuccess = () => resolve();
                                deleteReq.onerror = () => resolve(); // Continue even if error
                            });
                        })
                    );
                } catch (e) {
                    console.log('IndexedDB clear failed:', e);
                }
            }
            
            // 5. Force hard reload with cache busting
            const timestamp = Date.now();
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('v', this.latestVersion);
            currentUrl.searchParams.set('_t', timestamp);
            currentUrl.searchParams.set('_force', '1');
            
            console.log('Forcing reload to:', currentUrl.href);
            
            // Use replace to avoid back button issues
            window.location.replace(currentUrl.href);
            
        } catch (error) {
            console.error('Update failed:', error);
            // Fallback: simple reload
            window.location.reload(true);
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