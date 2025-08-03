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
    if (!('Notification' in window)) {
        notificationToggle.textContent = 'Not Supported';
        notificationToggle.disabled = true;
        notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed';
        notificationStatus.textContent = 'Notifications not supported in this browser';
        return;
    }

    const permission = Notification.permission;
    
    switch (permission) {
        case 'granted':
            notificationToggle.textContent = 'Enabled ✓';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-green-500 text-white';
            notificationStatus.textContent = 'Notifications are enabled';
            break;
        case 'denied':
            notificationToggle.textContent = 'Blocked';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-red-500 text-white';
            notificationStatus.textContent = 'Notifications blocked. Enable in iOS Settings > Notifications';
            break;
        default: // 'default'
            notificationToggle.textContent = 'Enable';
            notificationToggle.className = 'px-4 py-2 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600';
            notificationStatus.textContent = 'Tap to enable rest timer notifications';
            break;
    }
}

// Handle notification toggle click
notificationToggle.addEventListener('click', async function() {
    if (!('Notification' in window)) {
        alert('Notifications are not supported in this browser.');
        return;
    }

    if (Notification.permission === 'granted') {
        // Already granted, show test notification
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
            alert('Notification test failed. Check console for details.');
        }
        return;
    }

    if (Notification.permission === 'denied') {
        alert('Notifications are blocked. To enable:\n\n1. Go to iOS Settings > Notifications\n2. Find "NoXcuses" in the app list\n3. Turn on "Allow Notifications"\n\nThen refresh this page and try again.');
        return;
    }

    // Request permission
    try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            // Show success message and test notification
            alert('✅ Notifications enabled! You\'ll now receive rest timer alerts.');
            
            // Show test notification
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('🎉 Notifications Enabled!', {
                    body: 'You\'ll now receive rest timer notifications.',
                    icon: './icon-192.png',
                    badge: './icon-192.png',
                    tag: 'welcome-notification',
                    requireInteraction: false
                });
            }
        } else {
            alert('❌ Notifications were not enabled. Rest timer alerts won\'t work.');
        }
        
        // Update notification UI
        updateNotificationUI();
        
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        alert('Error requesting notification permission. Please try again.');
    }
});

// Initialize notification UI
updateNotificationUI();