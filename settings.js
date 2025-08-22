// Navbar highlight logic
(function() {
    const path = window.location.pathname;
    const nav = document.querySelector('nav');
    if (!nav) return;
    let page = '';
    if (path.endsWith('index.html')) page = 'HOME';
    else if (path.endsWith('history.html')) page = 'HISTORY';
    else if (path.endsWith('workout.html')) page = 'WORKOUT';
    else if (path.endsWith('exercises.html')) page = 'EXERCISES';
    else if (path.endsWith('social.html') || path.endsWith('account.html') || path.endsWith('settings.html')) page = 'SOCIAL';

    nav.innerHTML = nav.innerHTML
        .replace('HOME_ACTIVE', page==='HOME' ? 'text-blue-500' : 'text-gray-400')
        .replace('HISTORY_ACTIVE', page==='HISTORY' ? 'text-blue-500' : 'text-gray-400')
        .replace('WORKOUT_ACTIVE', page==='WORKOUT' ? 'text-blue-500' : 'text-gray-400')
        .replace('EXERCISES_ACTIVE', page==='EXERCISES' ? 'text-blue-500' : 'text-gray-400')
        .replace('SOCIAL_ACTIVE', page==='SOCIAL' ? 'text-blue-500' : 'text-gray-400');
})();

// Get DOM elements
const profilePicture = document.getElementById('profilePicture');
const profilePicInput = document.getElementById('profilePicInput');
const usernameInput = document.getElementById('usernameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const themeSelect = document.getElementById('themeSelect');
const weightUnitSelect = document.getElementById('weightUnitSelect');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// Notification elements
const notificationToggle = document.getElementById('notificationToggle');
const notificationStatus = document.getElementById('notificationStatus');

// Load user data
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Set profile picture
    if (userData.profilePic) {
        profilePicture.src = userData.profilePic;
    } else {
        profilePicture.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username || 'User')}&background=444&color=fff&size=128`;
    }
    
    // Set other fields
    usernameInput.value = userData.username || '';
    emailInput.value = userData.email || '';
    themeSelect.value = userData.theme || 'dark';
    weightUnitSelect.value = userData.weightUnit || 'kg';
}

// Handle profile picture upload
profilePicInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePicture.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle settings save with navigation blocking
saveSettingsBtn.addEventListener('click', function(event) {
    // Prevent any default button behavior
    event.preventDefault();
    event.stopPropagation();
    
    // Block any navigation attempts
    const originalLocation = window.location.href;
    
    const userData = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        profilePic: profilePicture.src,
        theme: themeSelect.value,
        weightUnit: weightUnitSelect.value
    };
    
    if (passwordInput.value.trim()) {
        userData.password = passwordInput.value.trim();
    }
    
    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Show success message
    showAlert('Settings saved successfully!', 'Success');
    
    // Force stay on current page if navigation was attempted
    setTimeout(() => {
        if (window.location.href !== originalLocation) {
            console.log('Navigation detected, forcing back to settings');
            window.location.href = 'settings.html';
        }
    }, 100);
    
    return false;
});

// Load user data when page loads
loadUserData();

// Help modal functionality
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelpModal = document.getElementById('closeHelpModal');

if (helpBtn && helpModal && closeHelpModal) {
    helpBtn.addEventListener('click', function() {
        helpModal.classList.remove('hidden');
    });
    
    closeHelpModal.addEventListener('click', function() {
        helpModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    helpModal.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
            helpModal.classList.add('hidden');
        }
    });
}

// Display app version information
function displayAppInfo() {
    const currentVersion = localStorage.getItem('app-version') || '1.0.0';
    const lastUpdated = localStorage.getItem('last-update-check') || 'Never';
    
    const versionEl = document.getElementById('appVersion');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    
    if (versionEl) versionEl.textContent = currentVersion;
    if (lastUpdatedEl) {
        if (lastUpdated === 'Never') {
            lastUpdatedEl.textContent = 'Never';
        } else {
            const date = new Date(parseInt(lastUpdated));
            lastUpdatedEl.textContent = date.toLocaleDateString();
        }
    }
}

// Call on page load
displayAppInfo();

// Notification permission handling
function updateNotificationUI() {
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationStatus = document.getElementById('notificationStatus');
    
    if (!notificationToggle || !notificationStatus) {
        console.error('Notification UI elements not found');
        return;
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Always enable the button
    notificationToggle.disabled = false;
    
    if (!('Notification' in window)) {
        notificationToggle.textContent = 'Not Supported';
        notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500';
        notificationStatus.textContent = 'Notifications not supported in this browser';
        return;
    }

    // iOS-specific check
    if (isIOS && !isStandalone) {
        notificationToggle.textContent = 'Add to Home Screen First';
        notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-orange-500 text-white hover:bg-orange-600';
        notificationStatus.textContent = 'Must be added to Home Screen for iOS notifications';
        return;
    }

    const permission = Notification.permission;
    
    switch (permission) {
        case 'granted':
            notificationToggle.textContent = 'Test Notification';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600';
            notificationStatus.textContent = isIOS ? 'iOS notifications enabled ✓' : 'Notifications enabled ✓';
            break;
        case 'denied':
            notificationToggle.textContent = 'Blocked - Check Settings';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600';
            notificationStatus.textContent = isIOS ? 
                'Enable in iPhone Settings > Notifications > NoXcuses' : 
                'Notifications blocked. Enable in browser settings';
            break;
        default: // 'default'
            notificationToggle.textContent = 'Enable Notifications';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600';
            notificationStatus.textContent = isIOS ? 
                'Tap to enable iOS notifications' : 
                'Tap to enable rest timer notifications';
            break;
    }
}

// Handle notification toggle click (iOS-optimized)
// Improved notification toggle with better error handling
function initializeNotificationToggle() {
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationStatus = document.getElementById('notificationStatus');
    
    if (!notificationToggle || !notificationStatus) {
        console.error('Notification toggle elements not found');
        return;
    }

    // Remove any existing event listeners without cloning
    notificationToggle.replaceWith(notificationToggle.cloneNode(true));
    
    // Get the fresh element reference after replacement
    const freshToggle = document.getElementById('notificationToggle');
    
    // Add fresh event listener
    freshToggle.addEventListener('click', async function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Notification toggle clicked');
        
        try {
            if (!('Notification' in window)) {
                alert('Notifications are not supported in this browser.');
                return;
            }

            // Check if running as PWA on iOS
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            console.log('iOS:', isIOS, 'Standalone:', isStandalone, 'Permission:', Notification.permission);
            
            if (isIOS && !isStandalone) {
                alert('📱 iOS Requirement:\n\n1. Add this app to your Home Screen\n2. Open from the Home Screen icon (not Safari)\n3. Then try enabling notifications again\n\nNotifications only work for installed PWAs on iOS.');
                return;
            }

            if (Notification.permission === 'granted') {
                // Show test notification
                console.log('Permission already granted, showing test notification');
                try {
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.showNotification('🎉 Notifications Working!', {
                            body: 'Rest timer notifications are enabled and working.',
                            icon: './icon-192.png',
                            badge: './icon-192.png',
                            tag: 'test-notification',
                            requireInteraction: false
                        });
                    } else {
                        new Notification('🎉 Notifications Working!', {
                            body: 'Rest timer notifications are enabled and working.',
                            icon: './icon-192.png'
                        });
                    }
                } catch (error) {
                    console.error('Test notification failed:', error);
                    alert('Test notification failed: ' + error.message);
                }
                return;
            }

            if (Notification.permission === 'denied') {
                if (isIOS) {
                    alert('🚫 Notifications Blocked on iOS\n\nTo fix:\n1. Go to iPhone Settings\n2. Scroll down to find "NoXcuses"\n3. Tap it and enable "Allow Notifications"\n4. Return to this app and try again');
                } else {
                    alert('Notifications are blocked. Please enable them in your browser settings.');
                }
                return;
            }

            // Request permission (permission is 'default')
            console.log('Requesting notification permission...');
            
            // Show confirmation first
            const userConfirmed = confirm('🔔 Enable Rest Timer Notifications?\n\nYou\'ll get notified when your rest timer finishes, even when the app is in the background.\n\nTap OK to enable notifications.');
            
            if (!userConfirmed) {
                console.log('User cancelled notification request');
                return;
            }

            const permission = await Notification.requestPermission();
            console.log('Permission result:', permission);
            
            if (permission === 'granted') {
                alert('✅ Notifications Enabled!\n\nYou\'ll now receive rest timer alerts when the app is in the background.');
                
                // Show welcome notification
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    setTimeout(async () => {
                        try {
                            await registration.showNotification('🎉 Welcome!', {
                                body: 'Rest timer notifications are now enabled.',
                                icon: './icon-192.png',
                                badge: './icon-192.png',
                                tag: 'welcome-notification',
                                requireInteraction: false
                            });
                        } catch (e) {
                            console.log('Welcome notification failed:', e);
                        }
                    }, 1000);
                }
            } else if (permission === 'denied') {
                if (isIOS) {
                    alert('❌ Notifications Denied\n\nIf you change your mind:\n1. Go to iPhone Settings > Notifications\n2. Find "NoXcuses" and enable notifications\n3. Restart the app');
                } else {
                    alert('❌ Notifications were denied. Rest timer alerts won\'t work.');
                }
            } else {
                console.log('Permission still default after request - this is unusual');
                alert('⚠️ Notification permission unclear. Please try again.');
            }
            
            updateNotificationUI();
            
        } catch (error) {
            console.error('Error in notification toggle:', error);
            alert('Error: ' + error.message + '\n\nPlease check the console for more details.');
        }
    });
    
    // Update UI immediately
    updateNotificationUI();
}

// Update Now button functionality
function initializeUpdateButton() {
    const updateBtn = document.getElementById('updateNowBtn');
    const updateIcon = document.getElementById('updateIcon');
    const updateBtnText = document.getElementById('updateBtnText');
    const updateStatus = document.getElementById('updateStatus');
    
    if (!updateBtn || !updateIcon || !updateBtnText || !updateStatus) {
        console.error('Update button elements not found');
        return;
    }
    
    updateBtn.addEventListener('click', async function() {
        // Disable button and show loading state
        updateBtn.disabled = true;
        updateIcon.className = 'fas fa-spinner fa-spin mr-2';
        updateBtnText.textContent = 'Checking...';
        updateStatus.textContent = 'Checking for updates...';
        updateStatus.classList.remove('hidden');
        
        try {
            // Access the global updateChecker instance
            if (typeof updateChecker !== 'undefined') {
                // Force a fresh check
                updateChecker.hasShownNotification = false;
                
                // Get current and latest versions
                const currentVersion = updateChecker.getCurrentVersion();
                const latestVersion = updateChecker.latestVersion;
                
                console.log('Manual update check - Current:', currentVersion, 'Latest:', latestVersion);
                
                // Check if update is available
                if (currentVersion !== latestVersion) {
                    updateBtnText.textContent = 'Update Available!';
                    updateIcon.className = 'fas fa-download mr-2';
                    updateStatus.textContent = `Version ${latestVersion} is available. Click to install.`;
                    updateStatus.className = 'text-xs text-green-400 mt-2 text-center';
                    
                    // Change button to install update
                    updateBtn.onclick = function() {
                        updateBtn.disabled = true;
                        updateIcon.className = 'fas fa-spinner fa-spin mr-2';
                        updateBtnText.textContent = 'Installing...';
                        updateStatus.textContent = 'Installing update... Please wait.';
                        updateStatus.className = 'text-xs text-blue-400 mt-2 text-center';
                        
                        // Perform the update
                        updateChecker.performUpdate();
                    };
                } else {
                    // No update available
                    updateBtnText.textContent = 'Up to Date';
                    updateIcon.className = 'fas fa-check mr-2';
                    updateStatus.textContent = 'You have the latest version.';
                    updateStatus.className = 'text-xs text-green-400 mt-2 text-center';
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        resetUpdateButton();
                    }, 3000);
                }
            } else {
                throw new Error('Update checker not available');
            }
        } catch (error) {
            console.error('Update check failed:', error);
            updateBtnText.textContent = 'Check Failed';
            updateIcon.className = 'fas fa-exclamation-triangle mr-2';
            updateStatus.textContent = 'Failed to check for updates. Try again later.';
            updateStatus.className = 'text-xs text-red-400 mt-2 text-center';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                resetUpdateButton();
            }, 3000);
        }
        
        updateBtn.disabled = false;
    });
    
    function resetUpdateButton() {
        updateBtn.disabled = false;
        updateIcon.className = 'fas fa-sync-alt mr-2';
        updateBtnText.textContent = 'Check for Updates';
        updateStatus.classList.add('hidden');
        
        // Reset the click handler
        updateBtn.onclick = updateBtn.onclick;
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize notification toggle
    initializeNotificationToggle();
    // Initialize update button
    initializeUpdateButton();
});

// Data Export/Import functionality
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataInput = document.getElementById('importDataInput');

// Export all user data
function exportUserData() {
    try {
        const exportData = {
            exportDate: new Date().toISOString(),
            appVersion: localStorage.getItem('app-version') || '1.0.0',
            userData: {
                // User profile and settings
                userData: JSON.parse(localStorage.getItem('userData') || '{}'),
                
                // Workout data
                workoutHistory: JSON.parse(localStorage.getItem('workoutHistory') || '[]'),
                currentWorkout: JSON.parse(localStorage.getItem('currentWorkout') || '{}'),
                isWorkoutActive: localStorage.getItem('isWorkoutActive'),
                
                // Templates and exercises
                custom_templates: JSON.parse(localStorage.getItem('custom_templates') || '[]'),
                customExercises: JSON.parse(localStorage.getItem('customExercises') || '[]'),
                
                // App preferences
                userPreferences: JSON.parse(localStorage.getItem('userPreferences') || '{}'),
                settings: JSON.parse(localStorage.getItem('settings') || '{}'),
                
                // Notification settings
                notificationPermissionAsked: localStorage.getItem('notification-permission-asked'),
                notificationPermissionResult: localStorage.getItem('notification-permission-result'),
                
                // Any other relevant data
                badges: JSON.parse(localStorage.getItem('badges') || '[]'),
                achievements: JSON.parse(localStorage.getItem('achievements') || '[]')
            }
        };
        
        // Create and download the file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `noxcuses-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Data exported successfully! Save this file to import into your iOS app.', 'Success');
    } catch (error) {
        console.error('Export error:', error);
        showAlert('Failed to export data. Please try again.', 'Error');
    }
}

// Import user data
function importUserData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (!importData.userData) {
                throw new Error('Invalid data format');
            }
            
            // Confirm before importing
            if (!confirm('This will replace all your current data. Are you sure you want to continue?')) {
                return;
            }
            
            // Import all data
            Object.entries(importData.userData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (typeof value === 'object') {
                        localStorage.setItem(key, JSON.stringify(value));
                    } else {
                        localStorage.setItem(key, value);
                    }
                }
            });
            
            showAlert('Data imported successfully! Please refresh the page to see your imported data.', 'Success');
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Import error:', error);
            showAlert('Failed to import data. Please check the file format.', 'Error');
        }
    };
    reader.readAsText(file);
}

// Event listeners for export/import
if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportUserData);
}

if (importDataInput) {
    importDataInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            importUserData(file);
        }
    });
}

// Helper function for showing alerts (if not already defined)
function showAlert(message, type = 'Info') {
    // Create a simple alert modal if one doesn't exist
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'Success' ? 'bg-green-600' : 
        type === 'Error' ? 'bg-red-600' : 'bg-blue-600'
    } text-white`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'Success' ? 'fa-check-circle' : 
                type === 'Error' ? 'fa-exclamation-circle' : 'fa-info-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 4000);
}