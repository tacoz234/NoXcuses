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
    nav.innerHTML = nav.innerHTML
        .replace('HOME_ACTIVE', page==='HOME' ? 'text-blue-500' : 'text-gray-400')
        .replace('HISTORY_ACTIVE', page==='HISTORY' ? 'text-blue-500' : 'text-gray-400')
        .replace('WORKOUT_ACTIVE', page==='WORKOUT' ? 'text-blue-500' : 'text-gray-400')
        .replace('EXERCISES_ACTIVE', page==='EXERCISES' ? 'text-blue-500' : 'text-gray-400');
})();

// Load templates from templates.json and render
fetch('templates.json')
    .then(res => res.json())
    .then(data => {
        const routinesList = document.getElementById('routines-list');
        const templateList = document.getElementById('template-list');
        // ... existing code ...
    })
    .catch(error => {
        console.error('Error loading templates:', error);
        document.getElementById('template-list').innerHTML = '<div class="text-red-400 text-center col-span-2">Error loading templates.</div>';
    });

// Drawer and workout logic
let drawer = document.getElementById('workoutDrawer');
let drawerContent = document.getElementById('drawerContent');
let drawerTab = document.getElementById('drawerTab');
let isOpen = false, startY = 0, currentY = 0, isDragging = false;
const NAVBAR_HEIGHT = 150;
const PULL_TAB_HEIGHT = 32;

function setWorkoutActive(active) {
  localStorage.setItem('isWorkoutActive', active ? '1' : '0');
  document.getElementById('drawerTabContainer').style.display = active ? '' : 'none';
  if (active) {
    saveWorkoutState();
  } else {
    localStorage.removeItem('currentWorkout');
    localStorage.removeItem('workoutStartTime');
  }
}

function openDrawer() {
  drawer.style.pointerEvents = 'auto';
  drawer.style.backgroundColor = 'rgba(16,24,40,0.85)';
  drawerContent.style.transform = 'translateY(0)';
  isOpen = true;
  drawerContent.style.pointerEvents = 'auto';
  drawerTab.style.pointerEvents = 'auto';
  setWorkoutActive(true);
  setTimeout(autoStartStopwatch, 500);
}
function closeDrawer() {
  drawer.style.pointerEvents = 'none';
  drawer.style.backgroundColor = 'transparent';
  drawerContent.style.transform = `translateY(calc(100vh - ${NAVBAR_HEIGHT}px - ${PULL_TAB_HEIGHT}px))`;
  isOpen = false;
  drawerContent.style.pointerEvents = 'auto';
  drawerTab.style.pointerEvents = 'auto';
}

document.addEventListener('DOMContentLoaded', function() {
  attachDrawerEvents();
  if (localStorage.getItem('isWorkoutActive') === '1') {
    restoreWorkoutState();
    setWorkoutActive(true);
    openDrawer();
  } else {
    setWorkoutActive(false);
  }
  setupButtonHandlers();
  startAutoSave();
  const notesTextarea = document.querySelector('textarea');
  if (notesTextarea) {
    notesTextarea.addEventListener('input', () => {
      if (localStorage.getItem('isWorkoutActive') === '1') {
        saveWorkoutState();
      }
    });
  }
});

function attachDrawerEvents() {
    document.querySelectorAll('#template-list button, .mb-6 button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openDrawer();
        });
    });
    var emptyBtn = document.getElementById('emptyWorkoutBtn');
    if (emptyBtn) {
        emptyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openDrawer();
        });
    }
    drawerTab.addEventListener('click', function() {
        openDrawer();
    });
    drawerTab.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        isDragging = true;
        startY = e.touches[0].clientY;
    });
    drawerTab.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        let dy = currentY - startY;
        if (dy > 0) {
            drawerContent.style.transform = `translateY(${dy}px)`;
        }
    });
    drawerTab.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        let dy = currentY - startY;
        if (dy > 100) {
            closeDrawer();
        } else {
            drawerContent.style.transform = 'translateY(0)';
        }
    });
}
document.addEventListener('DOMContentLoaded', attachDrawerEvents);

function showConfirm(message, onYes) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmMessage').textContent = message;
  modal.style.display = '';
  function cleanup() {
    modal.style.display = 'none';
    yesBtn.removeEventListener('click', yesHandler);
    noBtn.removeEventListener('click', noHandler);
  }
  const yesBtn = document.getElementById('confirmYes');
  const noBtn = document.getElementById('confirmNo');
  function yesHandler() { cleanup(); onYes(); }
  function noHandler() { cleanup(); }
  yesBtn.addEventListener('click', yesHandler);
  noBtn.addEventListener('click', noHandler);
}

function saveWorkoutToHistory() {
  const workout = {
    name: document.querySelector('.text-xl.font-bold')?.textContent || 'Workout',
    time: new Date().toISOString(),
    notes: document.querySelector('textarea')?.value || '',
    exercises: []
  };
  let history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
  history.push(workout);
  localStorage.setItem('workoutHistory', JSON.stringify(history));
}

function setupButtonHandlers() {
  const finishBtn = document.getElementById('finishWorkoutBtn');
  if (finishBtn) {
    finishBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      showConfirm('Finish and save this workout?', function() {
        stopStopwatch();
        const finalTime = formatTime(stopwatchSeconds);
        saveWorkoutToHistory();
        setWorkoutActive(false);
        closeDrawer();
        resetStopwatch();
      });
    });
  }
  const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cancel Workout');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      showConfirm('Cancel and erase this workout?', function() {
        resetStopwatch();
        setWorkoutActive(false);
        closeDrawer();
      });
    });
  }
}

let stopwatchInterval = null;
let stopwatchSeconds = 0;
let isStopwatchRunning = false;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateStopwatchDisplay() {
    const stopwatchEl = document.getElementById('stopwatch');
    if (stopwatchEl) {
        stopwatchEl.textContent = formatTime(stopwatchSeconds);
    }
}

function startStopwatch() {
    if (!isStopwatchRunning) {
        stopwatchInterval = setInterval(() => {
            stopwatchSeconds++;
            updateStopwatchDisplay();
        }, 1000);
        isStopwatchRunning = true;
    }
}

function stopStopwatch() {
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        isStopwatchRunning = false;
    }
}

function resetStopwatch() {
    stopStopwatch();
    stopwatchSeconds = 0;
    updateStopwatchDisplay();
}

function autoStartStopwatch() {
    if (!isStopwatchRunning) {
        startStopwatch();
    }
}

function saveWorkoutState() {
  const notes = document.querySelector('textarea')?.value || '';
  const stopwatchSeconds = window.stopwatchSeconds || 0;
  const isRunning = window.isStopwatchRunning || false;
  const lastSaveTime = Date.now();
  const state = {
    notes,
    stopwatchSeconds,
    isRunning,
    lastSaveTime
  };
  localStorage.setItem('currentWorkout', JSON.stringify(state));
}

function restoreWorkoutState() {
  const savedWorkout = localStorage.getItem('currentWorkout');
  if (savedWorkout) {
    try {
      const workoutData = JSON.parse(savedWorkout);
      const nameEl = document.querySelector('.text-xl.font-bold');
      if (nameEl && workoutData.name) {
        nameEl.textContent = workoutData.name;
      }
      const notesEl = document.querySelector('textarea');
      if (notesEl && workoutData.notes) {
        notesEl.value = workoutData.notes;
      }
      const now = Date.now();
      const lastSaveTime = workoutData.lastSaveTime || now;
      const elapsedSinceLastSave = Math.floor((now - lastSaveTime) / 1000);
      stopwatchSeconds = (workoutData.stopwatchSeconds || 0) + elapsedSinceLastSave;
      updateStopwatchDisplay();
      if (workoutData.isRunning) {
        startStopwatch();
      }
    } catch (e) {
      console.error('Error restoring workout state:', e);
    }
  }
}

setInterval(() => {
  if (localStorage.getItem('isWorkoutActive') === '1') saveWorkoutState();
}, 5000);

if (localStorage.getItem('isWorkoutActive') === '1') {
  restoreWorkoutState();
}

function startAutoSave() {
  setInterval(() => {
    if (localStorage.getItem('isWorkoutActive') === '1') {
      saveWorkoutState();
    }
  }, 30000);
}

// Exercise Modal Logic
let allExercises = [];
const exerciseModal = document.getElementById('exerciseModal');
const closeExerciseModalBtn = document.getElementById('closeExerciseModal');
const exerciseSearch = document.getElementById('exerciseSearch');
const exerciseList = document.getElementById('exerciseList');

function openExerciseModal() {
  exerciseModal.classList.remove('hidden');
  exerciseSearch.value = '';
  renderExerciseList(allExercises);
  exerciseSearch.focus();
}
function closeExerciseModal() {
  exerciseModal.classList.add('hidden');
}
closeExerciseModalBtn.onclick = closeExerciseModal;
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeExerciseModal();
});

function renderExerciseList(exercises) {
  exerciseList.innerHTML = '';
  exercises.forEach(ex => {
    const div = document.createElement('div');
    div.className = 'bg-gray-100 rounded p-2 cursor-pointer hover:bg-blue-100';
    div.textContent = ex.name;
    div.onclick = () => {
      addExerciseToWorkout(ex);
      closeExerciseModal();
    };
    exerciseList.appendChild(div);
  });
  if (exercises.length === 0) {
    exerciseList.innerHTML = '<div class="text-gray-400 text-center">No exercises found.</div>';
  }
}

exerciseSearch.addEventListener('input', function() {
  const val = exerciseSearch.value.toLowerCase();
  renderExerciseList(allExercises.filter(ex => ex.name.toLowerCase().includes(val)));
});

// Fetch exercises.json
fetch('exercises.json')
  .then(res => res.json())
  .then(data => {
    allExercises = data;
  });

// Wire up the Add Exercises button in the drawer
const addExercisesBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Add Exercises');
if (addExercisesBtn) {
  addExercisesBtn.addEventListener('click', function(e) {
    e.preventDefault();
    openExerciseModal();
  });
}

// Placeholder: Add selected exercise to workout (replace with your logic)
function addExerciseToWorkout(ex) {
  alert('Exercise added: ' + ex.name);
  // TODO: Actually add the exercise to the workout list in the drawer
}