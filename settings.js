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
    else if (path.endsWith('social.html') || path.endsWith('account.html')) page = 'SOCIAL';

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

// Handle settings save
saveSettingsBtn.addEventListener('click', function() {
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
    
    
    // Redirect back to account page
    window.location.href = 'account.html';
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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!('Notification' in window)) {
        notificationToggle.textContent = 'Not Supported';
        notificationToggle.disabled = true;
        notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed';
        notificationStatus.textContent = 'Notifications not supported in this browser';
        return;
    }

    // iOS-specific check
    if (isIOS && !isStandalone) {
        notificationToggle.textContent = 'Add to Home Screen';
        notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-orange-500 text-white';
        notificationStatus.textContent = 'Must be added to Home Screen for iOS notifications';
        return;
    }

    const permission = Notification.permission;
    
    switch (permission) {
        case 'granted':
            notificationToggle.textContent = 'Enabled ✓';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-green-500 text-white';
            notificationStatus.textContent = isIOS ? 'iOS notifications enabled' : 'Notifications are enabled';
            break;
        case 'denied':
            notificationToggle.textContent = 'Blocked';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-red-500 text-white';
            notificationStatus.textContent = isIOS ? 
                'Enable in iPhone Settings > Notifications > NoXcuses' : 
                'Notifications blocked. Enable in browser settings';
            break;
        default: // 'default'
            notificationToggle.textContent = 'Enable';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600';
            notificationStatus.textContent = isIOS ? 
                'Tap to enable iOS notifications' : 
                'Tap to enable rest timer notifications';
            break;
    }
}

// Handle notification toggle click (iOS-optimized)
notificationToggle.addEventListener('click', async function() {
    if (!('Notification' in window)) {
        alert('Notifications are not supported in this browser.');
        return;
    }

    // Check if running as PWA on iOS
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS && !isStandalone) {
        alert('📱 iOS Requirement:\n\n1. Add this app to your Home Screen\n2. Open from the Home Screen icon (not Safari)\n3. Then try enabling notifications again\n\nNotifications only work for installed PWAs on iOS.');
        return;
    }

    if (Notification.permission === 'granted') {
        // Show test notification
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
            }
        } catch (error) {
            console.error('Test notification failed:', error);
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

    // Request permission with iOS-specific handling
    try {
        // iOS requires a more explicit user interaction
        const userConfirmed = confirm('🔔 Enable Rest Timer Notifications?\n\nYou\'ll get notified when your rest timer finishes, even when the app is in the background.\n\nTap OK to enable notifications.');
        
        if (!userConfirmed) {
            return;
        }

        const permission = await Notification.requestPermission();
        
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
            // Permission is still 'default' - this shouldn't happen after requestPermission
            alert('⚠️ Notification permission unclear. Please try again.');
        }
        
        updateNotificationUI();
        
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        if (isIOS) {
            alert('❌ iOS Notification Error\n\nTry:\n1. Make sure you opened this app from the Home Screen\n2. Restart the app\n3. Try again');
        } else {
            alert('Error requesting notification permission. Please try again.');
        }
    }
});

// Initialize notification UI
updateNotificationUI();