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
fetch('badges.json')
      .then(response => response.json())
      .then(badges => {
        const colorMap = {
          blue: 'bg-blue-100 text-blue-700',
          green: 'bg-green-100 text-green-700',
          yellow: 'bg-yellow-100 text-yellow-700',
          purple: 'bg-purple-100 text-purple-700',
          pink: 'bg-pink-100 text-pink-700'
        };
        const container = document.getElementById('badges-container');
        badges.forEach(badge => {
          const span = document.createElement('span');
          span.className = `inline-flex items-center px-3 py-1 rounded-full font-semibold text-sm shadow mr-2 mb-2 ${colorMap[badge.color] || 'bg-gray-200 text-gray-800'}`;
          span.textContent = badge.label;
          span.title = badge.description;
          container.appendChild(span);
        });
      });

// Update the edit button handler
document.getElementById('editAccountBtn').addEventListener('click', () => {
    window.location.href = 'settings.html';
});