// workout.js

// Global variables for workout state
let workoutExercises = [];
let stopwatchInterval = null;
let stopwatchSeconds = 0;
let isStopwatchRunning = false;
let allExercises = []; // To store exercises from exercises.json
let replaceExerciseIdx = null; // Used for replacing exercises in the workout
const DEFAULT_REST_TIME = 60; // Default rest time in seconds

// --- Utility Functions ---

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function parseRestTime(restString) {
    const match = restString.match(/(\d+)-(\d+)\s*min/);
    if (match) {
        return parseInt(match[1]) * 60; // Use the lower end of the range in seconds
    }
    return DEFAULT_REST_TIME; // Fallback to default
}

// --- Stopwatch Functions ---

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
        stopwatchInterval = null;
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

// --- Drawer Logic ---
const drawer = document.getElementById('workoutDrawer');
const drawerContent = document.getElementById('drawerContent');
const drawerTab = document.getElementById('drawerTab');
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
    drawerContent.style.overflowY = 'auto';
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
    drawerContent.style.overflowY = 'hidden';
    isOpen = false;
    drawerContent.style.pointerEvents = 'auto';
    drawerTab.style.pointerEvents = 'auto';
}

function attachDrawerEvents() {
    document.body.addEventListener('click', function(e) {
        const startButton = e.target.closest('.template-start-btn, #emptyWorkoutBtn');
        if (!startButton) return;

        e.preventDefault();

        if (startButton.id === 'emptyWorkoutBtn') {
            workoutExercises = [];
            document.querySelector('textarea').value = '';
            resetStopwatch();
            
            const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
            if (workoutNameEl) {
                workoutNameEl.textContent = 'New Workout';
            }
            
            renderWorkoutExercises();
            openDrawer();
            setWorkoutActive(true);
            autoStartStopwatch();
        } else {
            const templateItem = startButton.closest('.template-item, .template-card');
            if (templateItem) {
                const templateName = templateItem.dataset.template;
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
        drawerContent.style.overflowY = 'hidden';
    });

    drawerTab.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        e.preventDefault();
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
            drawerContent.style.overflowY = 'auto';
        }
    });
}


// --- Confirmation Modal ---

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

// --- Workout History ---

function saveWorkoutToHistory() {
    const workout = {
        name: document.querySelector('.text-xl.font-bold')?.textContent || 'Workout',
        time: new Date().toISOString(),
        duration: formatTime(stopwatchSeconds),
        notes: document.querySelector('textarea')?.value || '',
        exercises: workoutExercises.map(ex => ({
            name: ex.name,
            sets: ex.sets.filter((_, setIdx) => {
                const row = document.querySelector(`.set-row[data-ex-idx="${workoutExercises.indexOf(ex)}"][data-set-idx="${setIdx}"]`);
                const checkbox = row?.querySelector('.set-complete-checkbox');
                return checkbox?.checked;
            })
        })).filter(ex => ex.sets.length > 0)
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

// --- Exercise Modals ---

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

// Replace Exercise Modal
const replaceExerciseModal = document.getElementById('replaceExerciseModal');
const closeReplaceExerciseModalBtn = document.getElementById('closeReplaceExerciseModal');
const replaceExerciseSearch = document.getElementById('replaceExerciseSearch');
const replaceExerciseList = document.getElementById('replaceExerciseList');

function openReplaceExerciseModal(idx) {
    replaceExerciseIdx = idx;
    replaceExerciseModal.classList.remove('hidden');
    replaceExerciseSearch.value = '';
    renderReplaceExerciseList(allExercises);
    replaceExerciseSearch.focus();
}
function closeReplaceExerciseModal() {
    replaceExerciseModal.classList.add('hidden');
    replaceExerciseIdx = null;
}
closeReplaceExerciseModalBtn.onclick = closeReplaceExerciseModal;
window.addEventListener('keydown', function(e) {
    if (!replaceExerciseModal.classList.contains('hidden') && e.key === 'Escape') closeReplaceExerciseModal();
});
replaceExerciseSearch.addEventListener('input', function() {
    const val = replaceExerciseSearch.value.toLowerCase();
    renderReplaceExerciseList(allExercises.filter(ex => ex.name.toLowerCase().includes(val)));
});

function renderReplaceExerciseList(exercises) {
    replaceExerciseList.innerHTML = '';
    exercises.forEach(ex => {
        const div = document.createElement('div');
        div.className = 'bg-gray-100 rounded p-2 cursor-pointer hover:bg-blue-100 mb-1 text-black';
        div.textContent = ex.name;
        div.onclick = () => {
            if (replaceExerciseIdx !== null) {
                const prevSets = workoutExercises[replaceExerciseIdx].sets;
                const sets = prevSets.map(set => ({
                    reps: set.reps,
                    weight: set.weight,
                    completed: set.completed
                }));
                const numSets = ex.working_sets || 1;
                while (sets.length < numSets) {
                    sets.push({
                        reps: ex.reps ? parseInt(ex.reps) || 10 : 10,
                        weight: 0,
                        completed: false
                    });
                }
                if (sets.length > numSets) sets.length = numSets;
                workoutExercises[replaceExerciseIdx] = {
                    name: ex.name,
                    sets: sets
                };
                renderWorkoutExercises();
                closeReplaceExerciseModal();
            }
        };
        replaceExerciseList.appendChild(div);
    });
    if (exercises.length === 0) {
        replaceExerciseList.innerHTML = '<div class="text-gray-400 text-center">No exercises found.</div>';
    }
}

// --- Workout Exercises Rendering ---

const exercisesContainer = document.createElement('div');
exercisesContainer.id = 'workoutExercisesContainer';
exercisesContainer.className = 'mb-4';
const notesTextarea = document.querySelector('textarea');
if (notesTextarea && notesTextarea.parentNode) {
    notesTextarea.parentNode.insertBefore(exercisesContainer, notesTextarea.nextSibling);
}

function renderWorkoutExercises() {
    // Create skip rest modal if it doesn't exist
    let skipRestModal = document.getElementById('skipRestModal');
    if (!skipRestModal) {
        skipRestModal = document.createElement('div');
        skipRestModal.id = 'skipRestModal';
        skipRestModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';
        skipRestModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
                <h3 class="text-xl font-semibold mb-4">End Rest Period?</h3>
                <div class="flex justify-center gap-4">
                    <button class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded" onclick="this.closest('#skipRestModal').classList.add('hidden')">Continue Rest</button>
                    <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded confirm-skip-rest">End Rest</button>
                </div>
            </div>
        `;
        document.body.appendChild(skipRestModal);
    }

    exercisesContainer.innerHTML = '';
    exercisesContainer.className = 'flex flex-col min-h-[calc(95vh-500px)]';
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const weightUnit = userData.weightUnit || 'kg';
    const conversionFactor = weightUnit === 'lb' ? 2.20462 : 1;
    
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

    const exercisesList = document.createElement('div');
    exercisesList.className = 'flex-shrink-0';
    
    workoutExercises.forEach((ex, exIdx) => {
        const exDiv = document.createElement('div');
        exDiv.className = 'bg-white rounded-lg p-4 mb-4 text-gray-900 shadow';
        exDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">${ex.name}</span>
                <div class="relative">
                    <button class="text-gray-500 text-xl ex-menu-btn" data-idx="${exIdx}" style="padding:0 8px;">&#x22EE;</button>
                    <div class="ex-menu hidden absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                        <button class="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 remove-ex-btn" data-idx="${exIdx}">Remove</button>
                        <button class="block w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-gray-100 replace-ex-btn" data-idx="${exIdx}">Replace</button>
                        <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-ex-btn" data-idx="${exIdx}">Edit</button>
                    </div>
                </div>
            </div>
            <div class="space-y-2">
                ${ex.sets.map((set, setIdx) => `
                    <div class="relative mb-1">
                        <div class="absolute inset-0 flex items-center justify-end pr-2 bg-red-500 rounded delete-bg" style="z-index:0;opacity:0;pointer-events:none;transition:opacity 0.2s;">
                            <button class="delete-set-btn text-white font-bold px-4 py-2 rounded" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">Delete</button>
                        </div>
                        <div class="flex items-center gap-2 set-row bg-gray-50 rounded transition-all relative" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" style="z-index:1;">
                            <span class="text-xs text-gray-500 w-10">Set ${setIdx+1}</span>
                            <label class="text-xs text-gray-600">Weight</label>
                            <input type="number" min="0" value="${(set.weight * conversionFactor).toFixed(1)}" class="weight-input w-16 p-1 rounded bg-gray-100 text-gray-900 border transition-colors" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" data-original-unit="kg">
                            <span class="text-gray-400 text-xs">${weightUnit}</span>
                            <label class="text-xs text-gray-600 ml-2">Reps</label>
                            <input type="number" min="1" value="${set.reps}" class="reps-input w-12 p-1 rounded bg-gray-100 text-gray-900 border transition-colors" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">
                            <input type="checkbox" class="set-complete-checkbox w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" ${set.completed ? 'checked' : ''}>
                        </div>
                        <div class="rest-timer-container hidden mt-2 text-center bg-gray-50 rounded p-2">
                            <div class="flex items-center justify-center gap-2">
                                <button class="decrease-time-btn bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded-lg">-10s</button>
                                <div class="rest-timer-display text-lg font-bold text-blue-400 cursor-pointer hover:text-blue-500">00:00</div>
                                <button class="increase-time-btn bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded-lg">+10s</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
                <div class="flex justify-center mt-4">
                    <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-base shadow add-set-btn" data-idx="${exIdx}">+ Add Set</button>
                </div>
            </div>
        `;
        exercisesContainer.appendChild(exDiv);

        exDiv.querySelectorAll('.weight-input').forEach(input => {
            input.addEventListener('change', function() {
                const exIdx = parseInt(this.dataset.exIdx);
                const setIdx = parseInt(this.dataset.setIdx);
                const displayedValue = parseFloat(this.value) || 0;
                const storedValue = weightUnit === 'lb' ? displayedValue / 2.20462 : displayedValue;
                workoutExercises[exIdx].sets[setIdx].weight = parseFloat(storedValue.toFixed(1));
                saveWorkoutState();
            });
        });

        exDiv.querySelectorAll('.set-complete-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const row = this.closest('.set-row');
                const inputs = row.querySelectorAll('input[type="number"]');
                
                if (this.checked) {
                    row.classList.add('bg-green-100');
                    row.classList.remove('bg-gray-50');
                    inputs.forEach(input => {
                        input.classList.add('bg-green-100');
                        input.disabled = true;
                    });
                } else {
                    row.classList.remove('bg-green-100');
                    row.classList.add('bg-gray-50');
                    inputs.forEach(input => {
                        input.classList.remove('bg-green-100');
                        input.disabled = false;
                    });
                }
            });
        });

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
            row.addEventListener('click', hideDelete);
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

    let restTimerInterval = null;
    let restTimeSeconds = 0;

    function adjustRestTime(seconds) {
        if (restTimerInterval) {
            restTimeSeconds = Math.max(0, restTimeSeconds + seconds);
            const displays = document.querySelectorAll('.rest-timer-display');
            displays.forEach(display => {
                display.textContent = formatTime(restTimeSeconds);
            });
        }
    }

    function startRestTimer(timerDisplayEl, containerEl, exercise) {
        stopRestTimer();
        restTimeSeconds = exercise.rest ? parseRestTime(exercise.rest) : DEFAULT_REST_TIME;
        timerDisplayEl.textContent = formatTime(restTimeSeconds);
        containerEl.classList.remove('hidden');

        restTimerInterval = setInterval(() => {
            restTimeSeconds--;
            timerDisplayEl.textContent = formatTime(restTimeSeconds);
            if (restTimeSeconds <= 0) {
                stopRestTimer();
                containerEl.classList.add('hidden');
            }
        }, 1000);
    }

    function stopRestTimer() {
        if (restTimerInterval) {
            clearInterval(restTimerInterval);
            restTimerInterval = null;
        }
    }

    // Add timer adjustment button handlers
    exercisesContainer.querySelectorAll('.decrease-time-btn').forEach(button => {
        button.onclick = function() {
            adjustRestTime(-10);
        };
    });

    exercisesContainer.querySelectorAll('.increase-time-btn').forEach(button => {
        button.onclick = function() {
            adjustRestTime(10);
        };
    });

    // Set completion checkbox handler
    exercisesContainer.querySelectorAll('.set-complete-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const exIdx = parseInt(this.dataset.exIdx);
            const setIdx = parseInt(this.dataset.setIdx);
            const isCompleted = this.checked;

            if (!workoutExercises[exIdx].sets[setIdx].hasOwnProperty('completed')) {
                workoutExercises[exIdx].sets[setIdx].completed = false;
            }
            workoutExercises[exIdx].sets[setIdx].completed = isCompleted;
            saveWorkoutState();

            const row = this.closest('.set-row');
            const inputs = row.querySelectorAll('input[type="number"]');
            const setContainer = row.parentElement;
            const restTimerContainer = setContainer.querySelector('.rest-timer-container');
            const restTimerDisplay = restTimerContainer.querySelector('.rest-timer-display');
            
            if (isCompleted) {
                row.classList.add('bg-green-100');
                row.classList.remove('bg-gray-50');
                inputs.forEach(input => {
                    input.classList.add('bg-green-100');
                    input.disabled = true;
                });
                startRestTimer(restTimerDisplay, restTimerContainer, workoutExercises[exIdx]);
            } else {
                row.classList.remove('bg-green-100');
                row.classList.add('bg-gray-50');
                inputs.forEach(input => {
                    input.classList.remove('bg-green-100');
                    input.disabled = false;
                });
                stopRestTimer();
                restTimerContainer.classList.add('hidden');
            }
        });
    });

    // Rest timer display click to open skip modal
    exercisesContainer.querySelectorAll('.rest-timer-display').forEach(display => {
        display.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let skipRestModal = document.getElementById('skipRestModal');
            skipRestModal.style.display = 'flex';
            
            const confirmBtn = skipRestModal.querySelector('.confirm-skip-rest');
            const restTimerContainer = this.closest('.rest-timer-container');
            
            confirmBtn.onclick = function() {
                stopRestTimer();
                restTimerContainer.classList.add('hidden');
                skipRestModal.style.display = 'none';
            };
        };
    });
}

function addExerciseToWorkout(ex) {
    const sets = [];
    const numSets = ex.working_sets || 1;
    
    for (let i = 0; i < numSets; i++) {
        sets.push({
            reps: ex.reps ? parseInt(ex.reps) || 10 : 10,
            weight: 0,
            completed: false
        });
    }
    
    workoutExercises.push({
        name: ex.name,
        sets: sets,
        rest: ex.rest || null // Preserve rest time from template if available
    });
    renderWorkoutExercises();
    saveWorkoutState();
}

function startWorkoutFromTemplate(template) {
    workoutExercises = [];
    document.querySelector('textarea').value = '';
    resetStopwatch();
    
    const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
    if (workoutNameEl) {
        workoutNameEl.textContent = template.name;
    }
    
    if (template.exercises && template.exercises.length > 0) {
        template.exercises.forEach(exercise => {
            addExerciseToWorkout(exercise);
        });
    }
    
    openDrawer();
}

// --- Local Storage and State Management ---

function saveWorkoutState() {
    const notes = document.querySelector('textarea')?.value || '';
    const name = document.querySelector('#drawerContent .text-xl.font-bold')?.textContent || 'New Workout';
    const state = {
        name,
        notes,
        stopwatchSeconds,
        isRunning: isStopwatchRunning,
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

            const now = Date.now();
            const lastSaveTime = workoutData.lastSaveTime || now;
            const elapsedSinceLastSave = Math.floor((now - lastSaveTime) / 1000);
            
            stopwatchSeconds = workoutData.stopwatchSeconds || 0;
            if (workoutData.isRunning) {
                stopwatchSeconds += elapsedSinceLastSave;
            }
            
            updateStopwatchDisplay();
            
            if (workoutData.isRunning) {
                startStopwatch();
            }

            workoutExercises = Array.isArray(workoutData.exercises) ? workoutData.exercises.map(ex => ({
                ...ex,
                sets: Array.isArray(ex.sets) ? ex.sets.map(set => ({ ...set, completed: set.hasOwnProperty('completed') ? set.completed : false })) : []
            })) : [];
            renderWorkoutExercises();
            
            if (localStorage.getItem('isWorkoutActive') === '1') {
                openDrawer();
            }
        } catch (e) {
            console.error('Error restoring workout state:', e);
        }
    }
}

function startAutoSave() {
    setInterval(() => {
        if (localStorage.getItem('isWorkoutActive') === '1') {
            saveWorkoutState();
        }
    }, 5000);
}

// --- Initialization on DOMContentLoaded ---

document.addEventListener('DOMContentLoaded', function() {
    attachDrawerEvents();
    setupButtonHandlers();
    startAutoSave(); // Start auto-saving
    restoreWorkoutState(); // Attempt to restore workout state on load

    // Load exercises.json
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

    // Event listeners for exercise menu buttons
    document.body.addEventListener('click', function(e) {
        const menuBtn = e.target.closest('.ex-menu-btn');
        if (menuBtn) {
            e.stopPropagation();
            document.querySelectorAll('.ex-menu').forEach(m => {
                if (m !== menuBtn.nextElementSibling) {
                    m.classList.add('hidden');
                }
            });
            const menu = menuBtn.nextElementSibling;
            menu.classList.toggle('hidden');
        } else if (!e.target.closest('.ex-menu')) {
            document.querySelectorAll('.ex-menu').forEach(m => m.classList.add('hidden'));
        }
    });

    document.body.addEventListener('click', function(e) {
        // Handler for Remove
        const removeBtn = e.target.closest('.remove-ex-btn');
        if (removeBtn) {
            e.stopPropagation();
            const idx = +removeBtn.dataset.idx;
            workoutExercises.splice(idx, 1);
            renderWorkoutExercises();
            saveWorkoutState();
        }

        // Handler for Replace
        const replaceBtn = e.target.closest('.replace-ex-btn');
        if (replaceBtn) {
            e.stopPropagation();
            const idx = +replaceBtn.dataset.idx;
            openReplaceExerciseModal(idx);
        }

        // Handler for Edit (placeholder, implement as needed)
        const editBtn = e.target.closest('.edit-ex-btn');
        if (editBtn) {
            e.stopPropagation();
            const idx = +editBtn.dataset.idx;
            alert(`Edit exercise at index: ${idx} (functionality to be implemented)`);
        }
    });

    // Load templates from templates.json and render
    fetch('templates.json')
        .then(res => res.json())
        .then(data => {
            const routinesList = document.getElementById('routines-list');
            const templateList = document.getElementById('template-list');
            const templates = Array.isArray(data) ? data : (data.templates || []);
            const routines = Array.isArray(data) ? [] : (data.routines || []);

            if (!templates.length && !routines.length) {
                if (templateList) { // Check if element exists
                    templateList.innerHTML = '<div class="text-gray-400 text-center col-span-2">No templates or routines found.</div>';
                }
                return;
            }

            const templatesInRoutines = new Set();
            routines.forEach(routine => {
                routine.templates.forEach(templateName => {
                    templatesInRoutines.add(templateName);
                });
            });

            // Render Routines (folders)
            if (routinesList) { // Check if element exists
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
                    
                    const header = routineEl.querySelector('.flex.justify-between');
                    header.onclick = (e) => {
                        if (e.target.closest('.template-start-btn')) return;
                        const templatesDiv = routineEl.querySelector('.routine-templates');
                        const chevron = routineEl.querySelector('.fa-chevron-down, .fa-chevron-up');
                        templatesDiv.classList.toggle('hidden');
                        chevron.classList.toggle('fa-chevron-down');
                        chevron.classList.toggle('fa-chevron-up');
                    };
                    
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
            }

            // Render Individual Templates in 2-column grid (only templates NOT in routines)
            if (templateList) { // Check if element exists
                const standaloneTemplates = templates.filter(tpl => !templatesInRoutines.has(tpl.name));
                standaloneTemplates.forEach((tpl, idx) => {
                    let exercises = tpl.exercises.slice(0, 2).map(ex => `<span class='inline-block bg-gray-100 text-gray-800 rounded-lg px-2 py-1 text-xs font-medium'>${ex.name}</span>`).join('');
                    let more = tpl.exercises.length > 2 ? `<span class='inline-block bg-gray-200 text-gray-700 rounded-lg px-2 py-1 text-xs font-medium'>+${tpl.exercises.length-2} more</span>` : '';
                    let card = document.createElement('div');
                    card.className = 'bg-white rounded-2xl shadow-lg p-4 text-gray-900 flex flex-col gap-2 cursor-pointer border border-gray-200 hover:shadow-xl transition-all template-card'; // Added template-card class
                    card.dataset.template = tpl.name; // Add data-template attribute
                    card.innerHTML = `
                        <div class="font-semibold text-sm mb-1">${tpl.name}</div>
                        <div class="flex flex-wrap gap-1 text-xs">${exercises}${more}</div>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm mt-2 self-start template-start-btn">Start</button>
                    `;
                    card.querySelector('button').onclick = (e) => {
                        e.stopPropagation();
                        startWorkoutFromTemplate(tpl);
                    };
                    card.onclick = () => {
                        startWorkoutFromTemplate(tpl);
                    };
                    templateList.appendChild(card);
                });
            }
        })
        .catch(error => {
            console.error('Error loading templates:', error);
            const templateList = document.getElementById('template-list');
            if (templateList) {
                templateList.innerHTML = '<div class="text-red-400 text-center col-span-2">Error loading templates.</div>';
            }
        });
});