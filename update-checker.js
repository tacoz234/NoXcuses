class UpdateChecker {
    constructor() {
        this.currentVersion = this.getCurrentVersion();
        this.latestVersion = '1.0.36'; // Update this
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
                
                // Wait longer for unregistration to complete
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // 2. Clear ALL caches aggressively
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('Clearing', cacheNames.length, 'caches');
                
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            // 3. Preserve user data and notification permissions during storage clear
            const preservedData = {
                // Notification permissions
                'notification-permission-asked': localStorage.getItem('notification-permission-asked'),
                'notification-permission-result': localStorage.getItem('notification-permission-result'),
                
                // User workout data
                'workoutHistory': localStorage.getItem('workoutHistory'),
                'currentWorkout': localStorage.getItem('currentWorkout'),
                
                // User templates and exercises
                'custom_templates': localStorage.getItem('custom_templates'),
                'customExercises': localStorage.getItem('customExercises'),
                
                // Workout state
                'isWorkoutActive': localStorage.getItem('isWorkoutActive'),
                
                // Rest timer state (if active)
                'restTimerState': localStorage.getItem('restTimerState'),
                
                // Any other user preferences that might exist
                'userPreferences': localStorage.getItem('userPreferences'),
                'settings': localStorage.getItem('settings')
            };
            
            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Restore preserved data
            Object.entries(preservedData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    localStorage.setItem(key, value);
                }
            });
            
            // 4. Set the new version
            localStorage.setItem('app-version', this.latestVersion);
            localStorage.setItem('last-update-check', Date.now().toString());
            localStorage.setItem('last-notified-version', this.latestVersion);
            
            // 5. Clear IndexedDB (but preserve any user data if stored there)
            if ('indexedDB' in window) {
                try {
                    const databases = await indexedDB.databases();
                    // Only clear app-specific databases, not user data databases
                    const appDatabases = databases.filter(db => 
                        db.name && (
                            db.name.includes('cache') || 
                            db.name.includes('sw-') ||
                            db.name.includes('service-worker')
                        )
                    );
                    
                    await Promise.all(
                        appDatabases.map(db => {
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
            
            // 6. SUPER aggressive cache busting
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 15);
            const currentUrl = new URL(window.location.href);
            
            // Clear all URL parameters first
            currentUrl.search = '';
            
            // Add multiple cache busting parameters
            currentUrl.searchParams.set('v', this.latestVersion);
            currentUrl.searchParams.set('_t', timestamp);
            currentUrl.searchParams.set('_force', '1');
            currentUrl.searchParams.set('_cb', randomId);
            currentUrl.searchParams.set('_update', this.latestVersion);
            currentUrl.searchParams.set('_nocache', '1');
            
            if (isProduction) {
                // Additional production cache busting
                currentUrl.searchParams.set('_prod_update', '1');
                currentUrl.searchParams.set('_no_cache', timestamp);
                currentUrl.searchParams.set('_bust', randomId);
            }
            
            console.log('Forcing reload to:', currentUrl.href);
            console.log('Preserved user data during update:', Object.keys(preservedData).filter(k => preservedData[k] !== null));
            
            // Force a hard reload that bypasses all caches
            window.location.replace(currentUrl.href);
            
            // Fallback after a delay
            setTimeout(() => {
                window.location.href = currentUrl.href;
            }, 1000);
            
        } catch (error) {
            console.error('Update failed:', error);
            // Fallback: super aggressive reload
            const fallbackUrl = window.location.href.split('?')[0] + '?_emergency_reload=' + Date.now() + '&v=' + this.latestVersion;
            window.location.href = fallbackUrl;
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