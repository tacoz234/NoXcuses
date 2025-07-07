// navbar.js
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

    // Replace placeholders with active/inactive classes
    nav.innerHTML = nav.innerHTML
        .replace('HOME_ACTIVE', page === 'HOME' ? 'text-blue-500' : 'text-gray-400')
        .replace('HISTORY_ACTIVE', page === 'HISTORY' ? 'text-blue-500' : 'text-gray-400')
        .replace('WORKOUT_ACTIVE', page === 'WORKOUT' ? 'text-blue-500' : 'text-gray-400')
        .replace('EXERCISES_ACTIVE', page === 'EXERCISES' ? 'text-blue-500' : 'text-gray-400');
})();