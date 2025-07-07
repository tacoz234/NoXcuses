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
    alert('Settings saved successfully!');
    
    // Redirect back to account page
    window.location.href = 'account.html';
});

// Load user data when page loads
loadUserData();