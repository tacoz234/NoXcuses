// Example Chart.js setup for Weight
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    new Chart(weightCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Weight (kg)',
          data: [70, 71, 69, 68, 67],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.2)',
          fill: true
        }]
      },
      options: { responsive: true }
    });
    // Repeat similar setup for measurementsChart and heartChart
    const measurementsCtx = document.getElementById('measurementsChart').getContext('2d');
    new Chart(measurementsCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Waist (cm)',
          data: [80, 79, 78, 77, 76],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.2)',
          fill: true
        }]
      },
      options: { responsive: true }
    });
    const heartCtx = document.getElementById('heartChart').getContext('2d');
    new Chart(heartCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Resting HR (bpm)',
          data: [72, 70, 69, 68, 67],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.2)',
          fill: true
        }]
      },
      options: { responsive: true }
    });
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
      else if (path.endsWith('social.html')) page = 'SOCIAL';
      nav.innerHTML = nav.innerHTML
        .replace('HOME_ACTIVE', page==='HOME' ? 'text-blue-500' : 'text-gray-400')
        .replace('HISTORY_ACTIVE', page==='HISTORY' ? 'text-blue-500' : 'text-gray-400')
        .replace('WORKOUT_ACTIVE', page==='WORKOUT' ? 'text-blue-500' : 'text-gray-400')
        .replace('EXERCISES_ACTIVE', page==='EXERCISES' ? 'text-blue-500' : 'text-gray-400')
        .replace('SOCIAL_ACTIVE', page==='SOCIAL' ? 'text-blue-500' : 'text-gray-400');
    })();