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
        // Handle both old array format and new object format
        const templates = Array.isArray(data) ? data : (data.templates || []);
        const routines = Array.isArray(data) ? [] : (data.routines || []);

        if (!templates.length && !routines.length) {
            templateList.innerHTML = '<div class="text-gray-400 text-center col-span-2">No templates or routines found.</div>';
            return;
        }

        // Get all template names that are included in routines
        const templatesInRoutines = new Set();
        routines.forEach(routine => {
            routine.templates.forEach(templateName => {
                templatesInRoutines.add(templateName);
            });
        });

        // Render Routines (folders)
        routines.forEach(routine => {
            const routineEl = document.createElement('div');
            routineEl.className = 'bg-gray-800 rounded-2xl shadow-lg p-5 text-white flex flex-col gap-3 cursor-pointer border border-gray-700 hover:shadow-xl transition-all';
            routineEl.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="font-semibold text-base"><i class="fas fa-folder mr-2 text-yellow-400"></i>${routine.name}</div>
                    <i class="fas fa-chevron-down transition-transform"></i>
                </div>
                <div class="routine-templates hidden pl-2 pt-2 border-l-2 border-gray-600 ml-2 space-y-2">
                    ${routine.templates.map(tplName => {
                        const template = templates.find(t => t.name === tplName);
                        if (!template) return `<div class="text-gray-400 p-2">Template "${tplName}" not found</div>`;
                        
                        const exerciseCount = template.exercises ? template.exercises.length : 0;
                        return `
                            <div class="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer template-item" data-template="${tplName}">
                                <div class="font-medium text-sm">${tplName}</div>
                                <div class="text-xs text-gray-300 mt-1">${exerciseCount} exercises</div>
                                <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold mt-2 template-start-btn">Start</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            // Toggle routine expansion
            const header = routineEl.querySelector('.flex.justify-between');
            header.onclick = (e) => {
                if (e.target.closest('.template-start-btn')) return; // Don't toggle if clicking start button
                const templatesDiv = routineEl.querySelector('.routine-templates');
                const chevron = routineEl.querySelector('.fa-chevron-down, .fa-chevron-up');
                templatesDiv.classList.toggle('hidden');
                chevron.classList.toggle('fa-chevron-down');
                chevron.classList.toggle('fa-chevron-up');
            };
            
            // Move this function before the template click handlers
            function startWorkoutFromTemplate(template) {
              // Clear any existing workout data
              workoutExercises = [];
              document.querySelector('textarea').value = '';
              resetStopwatch();
            
              // Set workout name
              const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
              if (workoutNameEl) {
                workoutNameEl.textContent = template.name;
              }
            
              // Add exercises from the template
              if (template.exercises && template.exercises.length > 0) {
                template.exercises.forEach(exercise => {
                  addExerciseToWorkout(exercise);
                });
              }
            
              // Open the drawer to start the workout
              openDrawer();
            }

            // Add click handlers for template start buttons within routines
            routineEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('template-start-btn')) {
                    e.stopPropagation();
                    const templateName = e.target.closest('.template-item').dataset.template;
                    const template = templates.find(t => t.name === templateName);
                    if (template) {
                        startWorkoutFromTemplate(template);
                    } else {
                        console.error('Template not found:', templateName);
                        alert('Could not start workout. Template data not found.');
                    }
                }
            });
            
            routinesList.appendChild(routineEl);
        });

        // Render Individual Templates in 2-column grid (only templates NOT in routines)
        const standaloneTemplates = templates.filter(tpl => !templatesInRoutines.has(tpl.name));
        standaloneTemplates.forEach((tpl, idx) => {
            let exercises = tpl.exercises.slice(0, 2).map(ex => `<span class='inline-block bg-gray-100 text-gray-800 rounded-lg px-2 py-1 text-xs font-medium'>${ex.name}</span>`).join('');
            let more = tpl.exercises.length > 2 ? `<span class='inline-block bg-gray-200 text-gray-700 rounded-lg px-2 py-1 text-xs font-medium'>+${tpl.exercises.length-2} more</span>` : '';
            let card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-lg p-4 text-gray-900 flex flex-col gap-2 cursor-pointer border border-gray-200 hover:shadow-xl transition-all';
            card.innerHTML = `
                <div class="font-semibold text-sm mb-1">${tpl.name}</div>
                <div class="flex flex-wrap gap-1 text-xs">${exercises}${more}</div>
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm mt-2 self-start">Start</button>
            `;
            card.querySelector('button').onclick = (e) => {
                e.stopPropagation();
                // Clear previous workout data
                workoutExercises = [];
                document.querySelector('textarea').value = '';
                const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
                if (workoutNameEl) {
                    workoutNameEl.textContent = tpl.name;
                }
                // Add exercises from template
                if (tpl.exercises && tpl.exercises.length > 0) {
                    tpl.exercises.forEach(exercise => {
                        addExerciseToWorkout(exercise);
                    });
                }
                renderWorkoutExercises();
                resetStopwatch();
                openDrawer();
            };
            card.onclick = () => {
                // Clear previous workout data
                workoutExercises = [];
                document.querySelector('textarea').value = '';
                const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
                if (workoutNameEl) {
                    workoutNameEl.textContent = tpl.name;
                }
                // Add exercises from template
                if (tpl.exercises && tpl.exercises.length > 0) {
                    tpl.exercises.forEach(exercise => {
                        addExerciseToWorkout(exercise);
                    });
                }
                renderWorkoutExercises();
                resetStopwatch();
                openDrawer();
            };
            templateList.appendChild(card);
        });
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
  drawerContent.style.position = 'fixed';
  drawerContent.style.bottom = '0';
  drawerContent.style.maxHeight = '95vh';
  drawerContent.style.overflowY = 'auto'; // Set overflow on drawerContent instead
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
  drawerContent.style.position = 'fixed';
  drawerContent.style.bottom = '0';
  drawerContent.style.overflowY = 'hidden'; // Set overflow on drawerContent
  isOpen = false;
  drawerContent.style.pointerEvents = 'auto';
  drawerTab.style.pointerEvents = 'auto';
}

function attachDrawerEvents() {
    // Combined event listener for all start buttons
    document.body.addEventListener('click', function(e) {
        const startButton = e.target.closest('.template-start-btn, #emptyWorkoutBtn');
        if (!startButton) return;

        e.preventDefault();

        if (startButton.id === 'emptyWorkoutBtn') {
            // Clear previous workout data for an empty session
            workoutExercises = [];
            document.querySelector('textarea').value = '';
            resetStopwatch();
            
            const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
            if (workoutNameEl) {
              workoutNameEl.textContent = 'New Workout';
            }
            
            renderWorkoutExercises();
            openDrawer(); // Add this line to properly open the drawer
            setWorkoutActive(true); // Add this line to properly activate the workout
            autoStartStopwatch(); // Add this line to start the stopwatch
        }
        else {
            // Find the template data
            const templateItem = startButton.closest('.template-item, .template-card');
            if (templateItem) {
                const templateName = templateItem.dataset.template;
                // We need to fetch the template data again to pass to the function
                fetch('templates.json')
                    .then(res => res.json())
                    .then(data => {
                        const allTemplates = Array.isArray(data) ? data : (data.templates || []);
                        const template = allTemplates.find(t => t.name === templateName);
                        if (template) {
                            startWorkoutFromTemplate(template);
                        } else {
                            console.error('Template not found:', templateName);
                            alert('Could not start workout. Template data not found.');
                        }
                    });
            }
        }
    });

    drawerTab.addEventListener('click', function() {
        openDrawer();
    });
    drawerTab.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        isDragging = true;
        startY = e.touches[0].clientY;
        drawerContent.style.overflowY = 'hidden'; // Disable scrolling when starting to drag
    });

    drawerTab.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling while dragging
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
            drawerContent.style.overflowY = 'auto'; // Re-enable scrolling after drag
        }
    });
}
// Add this after the drawer event setup
document.addEventListener('DOMContentLoaded', function() {
    attachDrawerEvents();
    setupButtonHandlers(); // Initialize the workout buttons
});

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
    duration: formatTime(stopwatchSeconds),
    notes: document.querySelector('textarea')?.value || '',
    exercises: workoutExercises
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
// --- Add after your exercise modal logic ---
let workoutExercises = [];
const exercisesContainer = document.createElement('div');
exercisesContainer.id = 'workoutExercisesContainer';
exercisesContainer.className = 'mb-4';
// Insert this container into the drawer, e.g. after notes textarea
const notesTextarea = document.querySelector('textarea');
if (notesTextarea && notesTextarea.parentNode) {
  notesTextarea.parentNode.insertBefore(exercisesContainer, notesTextarea.nextSibling);
}

// --- Replace renderWorkoutExercises with this version ---
function renderWorkoutExercises() {
  exercisesContainer.innerHTML = '';
  exercisesContainer.className = 'flex flex-col min-h-[calc(95vh-400px)]'; // Changed to min-height
  
  if (workoutExercises.length === 0) {
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'bg-[#1a2233] rounded-lg p-8 mb-4 text-center flex-grow flex flex-col items-center justify-center';
    placeholderDiv.innerHTML = `
      <i class="fas fa-dumbbell text-gray-600 text-4xl mb-4"></i>
      <p class="text-gray-400">No exercises added yet</p>
      <p class="text-gray-500 text-sm mt-2">Click "Add Exercises" to start your workout</p>
    `;
    exercisesContainer.appendChild(placeholderDiv);
    return;
  }

  // Create exercises container
  const exercisesList = document.createElement('div');
  exercisesList.className = 'flex-shrink-0'; // Don't let exercises shrink
  
  workoutExercises.forEach((ex, exIdx) => {
    const exDiv = document.createElement('div');
    exDiv.className = 'bg-white rounded-lg p-4 mb-4 text-gray-900 shadow';
    exDiv.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="font-semibold">${ex.name}</span>
        <button class="text-red-500 text-xs remove-ex-btn" data-idx="${exIdx}">Remove</button>
      </div>
      <div class="space-y-2">
        ${ex.sets.map((set, setIdx) => `
          <div class="relative mb-1">
            <div class="absolute inset-0 flex items-center justify-end pr-2 bg-red-500 rounded delete-bg" style="z-index:0;opacity:0;pointer-events:none;transition:opacity 0.2s;">
              <button class="delete-set-btn text-white font-bold px-4 py-2 rounded" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">Delete</button>
            </div>
            <div class="flex items-center gap-2 set-row bg-gray-50 rounded transition-transform relative" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" style="z-index:1;">
              <span class="text-xs text-gray-500 w-10">Set ${setIdx+1}</span>
              <label class="text-xs text-gray-600">Weight</label>
              <input type="number" min="0" value="${set.weight}" class="weight-input w-16 p-1 rounded bg-gray-100 text-gray-900 border" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">
              <span class="text-gray-400 text-xs">kg</span>
              <label class="text-xs text-gray-600 ml-2">Reps</label>
              <input type="number" min="1" value="${set.reps}" class="reps-input w-12 p-1 rounded bg-gray-100 text-gray-900 border" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">
              <input type="checkbox" class="ml-2 w-4 h-4 text-blue-600 rounded border-gray-300" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">
            </div>
          </div>
        `).join('')}
        <div class="flex justify-center mt-4">
          <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-base shadow add-set-btn" data-idx="${exIdx}">+ Add Set</button>
        </div>
      </div>
    `;
    exercisesContainer.appendChild(exDiv);
    // Attach swipe-to-delete handlers for each set-row
    exDiv.querySelectorAll('.set-row').forEach(row => {
      const wrapper = row.parentElement;
      const deleteBg = wrapper.querySelector('.delete-bg');
      let startX = 0, currentX = 0, swiped = false, mouseDown = false;
      function revealDelete() {
        row.style.transform = 'translateX(-80px)';
        deleteBg.style.opacity = '1';
        deleteBg.style.pointerEvents = 'auto';
      }
      function hideDelete() {
        row.style.transform = '';
        deleteBg.style.opacity = '0';
        deleteBg.style.pointerEvents = 'none';
      }
      row.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        swiped = false;
      });
      row.addEventListener('touchmove', e => {
        currentX = e.touches[0].clientX;
        const dx = currentX - startX;
        if (dx < -40) swiped = true;
      });
      row.addEventListener('touchend', e => {
        if (swiped) {
          revealDelete();
        } else {
          hideDelete();
        }
      });
      row.addEventListener('mousedown', e => {
        mouseDown = true;
        startX = e.clientX;
        swiped = false;
      });
      row.addEventListener('mousemove', e => {
        if (!mouseDown) return;
        currentX = e.clientX;
        const dx = currentX - startX;
        if (dx < -40) swiped = true;
      });
      row.addEventListener('mouseup', e => {
        if (!mouseDown) return;
        mouseDown = false;
        if (swiped) {
          revealDelete();
        } else {
          hideDelete();
        }
      });
      row.addEventListener('mouseleave', e => {
        if (mouseDown) {
          mouseDown = false;
          hideDelete();
        }
      });
      // Hide delete if clicking elsewhere
      row.addEventListener('click', hideDelete);
      // Delete button handler
      deleteBg.querySelector('.delete-set-btn').onclick = function(e) {
        e.stopPropagation();
        const exIdx = parseInt(this.dataset.exIdx);
        const setIdx = parseInt(this.dataset.setIdx);
        workoutExercises[exIdx].sets.splice(setIdx, 1);
        renderWorkoutExercises();
        saveWorkoutState();
      };
    });
  });
  // Remove exercise handlers
  exercisesContainer.querySelectorAll('.remove-ex-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.dataset.idx);
      workoutExercises.splice(idx, 1);
      renderWorkoutExercises();
      saveWorkoutState();
    };
  });
  // Add set handlers
  exercisesContainer.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.dataset.idx);
      workoutExercises[idx].sets.push({reps: 10, weight: 0});
      renderWorkoutExercises();
      saveWorkoutState();
    };
  });
  // Remove set handlers
  exercisesContainer.querySelectorAll('.remove-set-btn').forEach(btn => {
    btn.onclick = function() {
      const exIdx = parseInt(this.dataset.exIdx);
      const setIdx = parseInt(this.dataset.setIdx);
      workoutExercises[exIdx].sets.splice(setIdx, 1);
      renderWorkoutExercises();
      saveWorkoutState();
    };
  });
  // Input handlers
  exercisesContainer.querySelectorAll('.reps-input, .weight-input').forEach(input => {
    input.onchange = function() {
      const exIdx = parseInt(this.dataset.exIdx);
      const setIdx = parseInt(this.dataset.setIdx);
      if (this.classList.contains('reps-input')) workoutExercises[exIdx].sets[setIdx].reps = parseInt(this.value) || 1;
      if (this.classList.contains('weight-input')) workoutExercises[exIdx].sets[setIdx].weight = parseFloat(this.value) || 0;
      saveWorkoutState();
    };
  });
}

function addExerciseToWorkout(ex) {
  const sets = [];
  const numSets = ex.working_sets || 1;
  
  for (let i = 0; i < numSets; i++) {
    sets.push({
      reps: ex.reps ? parseInt(ex.reps) || 10 : 10,
      weight: 0
    });
  }
  
  workoutExercises.push({
    name: ex.name,
    sets: sets
  });
  renderWorkoutExercises();
  saveWorkoutState();
}

function saveWorkoutState() {
  const notes = document.querySelector('textarea')?.value || '';
  const name = document.querySelector('#drawerContent .text-xl.font-bold')?.textContent || 'New Workout';
  const state = {
    name,
    notes,
    stopwatchSeconds,  // Use the actual variable, not window.stopwatchSeconds
    isRunning: isStopwatchRunning,  // Use the actual variable
    lastSaveTime: Date.now(),
    exercises: workoutExercises
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

      // Calculate elapsed time correctly
      const now = Date.now();
      const lastSaveTime = workoutData.lastSaveTime || now;
      const elapsedSinceLastSave = Math.floor((now - lastSaveTime) / 1000);
      
      // Only add elapsed time if the workout was running
      stopwatchSeconds = workoutData.stopwatchSeconds || 0;
      if (workoutData.isRunning) {
        stopwatchSeconds += elapsedSinceLastSave;
      }
      
      updateStopwatchDisplay();
      
      // Start the stopwatch if it was running
      if (workoutData.isRunning) {
        startStopwatch();
      }

      // Restore exercises and ensure sets is always an array
      workoutExercises = Array.isArray(workoutData.exercises) ? workoutData.exercises.map(ex => ({
        ...ex,
        sets: Array.isArray(ex.sets) ? ex.sets : []
      })) : [];
      renderWorkoutExercises();
      
      // Open the drawer if workout is active
      if (localStorage.getItem('isWorkoutActive') === '1') {
        openDrawer();
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