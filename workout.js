// Global variables for workout state
let workoutExercises = [];
let allExercises = []; // To store exercises from exercises.json
let replaceExerciseIdx = null; // Used for replacing exercises in the workout
const DEFAULT_REST_TIME = 60; // Default rest time in seconds

// --- Rest Timer Persistence ---
let activeRestTimer = null; // Store active timer info for persistence
let restTimerInterval = null;
let restTimeSeconds = 0;
let initialRestTimeSeconds = 0; // Track initial timer duration for progress calculation

function saveRestTimerState() {
    if (activeRestTimer) {
        const restTimerState = {
            ...activeRestTimer,
            remainingSeconds: restTimeSeconds,
            lastUpdateTime: Date.now()
        };
        localStorage.setItem('activeRestTimer', JSON.stringify(restTimerState));
    } else {
        localStorage.removeItem('activeRestTimer');
    }
}

function restoreRestTimerState() {
    const savedTimer = localStorage.getItem('activeRestTimer');
    if (savedTimer) {
        try {
            const timerData = JSON.parse(savedTimer);
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - timerData.lastUpdateTime) / 1000);
            const remainingTime = Math.max(0, timerData.remainingSeconds - elapsedSeconds);
            
            if (remainingTime > 0) {
                // Find the corresponding timer display and container
                const exerciseIndex = timerData.exerciseIndex;
                const setIndex = timerData.setIndex;
                
                // Wait for DOM to be ready, then restore timer
                setTimeout(() => {
                    const setRow = document.querySelector(`.set-row[data-ex-idx="${exerciseIndex}"][data-set-idx="${setIndex}"]`);
                    if (setRow) {
                        const setContainer = setRow.parentElement;
                        const restTimerContainer = setContainer.querySelector('.rest-timer-container');
                        const restTimerDisplay = restTimerContainer.querySelector('.rest-timer-display');
                        
                        if (restTimerContainer && restTimerDisplay) {
                            activeRestTimer = {
                                exerciseIndex: exerciseIndex,
                                setIndex: setIndex,
                                timerDisplay: restTimerDisplay,
                                timerContainer: restTimerContainer
                            };
                            
                            restTimeSeconds = remainingTime;
                            restTimerDisplay.textContent = formatTime(restTimeSeconds);
                            restTimerContainer.classList.remove('hidden');
                            
                            restTimerInterval = setInterval(() => {
                                restTimeSeconds--;
                                restTimerDisplay.textContent = formatTime(restTimeSeconds);
                                saveRestTimerState(); // Save state on each tick
                                
                                // Update the first timer completion location (around line 64)
                                if (restTimeSeconds <= 0) {
                                    showRestTimerFinishedAlert();
                                    stopRestTimer();
                                    restTimerContainer.classList.add('hidden');
                                }
                            }, 1000);
                        }
                    }
                }, 100);
            } else {
                // Timer has expired while away
                localStorage.removeItem('activeRestTimer');
            }
        } catch (e) {
            console.error('Error restoring rest timer state:', e);
            localStorage.removeItem('activeRestTimer');
        }
    }
}

// --- Utility Functions ---

function parseRestTime(restString) {
    const match = restString.match(/(\d+)-(\d+)\s*min/);
    if (match) {
        return parseInt(match[1]) * 60; // Use the lower end of the range in seconds
    }
    return DEFAULT_REST_TIME; // Fallback to default
}

function showRestTimerFinishedAlert() {
    // Play a notification sound
    try {
        // Create an audio context and play a beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz tone
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Audio not supported or failed:', error);
    }
    
    // Show alert popup
    showAlert('Rest timer finished! Time for your next set.', 'Rest Complete');
}

// --- Workout History ---

function saveWorkoutToHistory() {
    const workout = {
        name: document.querySelector('.text-xl.font-bold')?.textContent || 'Workout',
        date: new Date().toISOString(),
        duration: formatTime(stopwatchSeconds),
        notes: document.querySelector('textarea')?.value || '',
        template: window.currentTemplateName || null, // <-- add this line
        exercises: workoutExercises.map(ex => ({
            name: ex.name,
            rest: ex.rest || '', // <-- Add this line to save rest
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
            showConfirm(
                'Finish and save this workout?',
                'Finish Workout',
                function() {
                    stopStopwatch();
                    saveWorkoutToHistory();
                    setWorkoutActive(false);
                    closeDrawer();
                    resetStopwatch();
                },
                function() {
                    // User cancelled - do nothing
                }
            );
        });
    }
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cancel Workout');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showConfirm(
                'Cancel and erase this workout?',
                'Cancel Workout',
                function() {
                    resetStopwatch();
                    setWorkoutActive(false);
                    closeDrawer();
                },
                function() {
                    // User cancelled - do nothing
                }
            );
        });
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
        
        // Get last workout data for this exercise
        let lastWorkoutData = '';
        
        let repRestRangeText = '';
        if (window.currentTemplateName && window.allTemplates) {
            const template = window.allTemplates.find(t => t.name === window.currentTemplateName);
            if (template && template.exercises) {
                // Use the template data from the original slot (by index)
                const templateEx = template.exercises[exIdx];
                if (templateEx && templateEx.reps) {
                    repRestRangeText = `<div class=\"text-xs text-gray-500 mt-1\">Rep range: ${templateEx.reps}`;
                    if (templateEx.rest) {
                        repRestRangeText += ` &nbsp;|&nbsp; Rest range: ${templateEx.rest}`;
                    }
                    repRestRangeText += '</div>';
                }
            }
        }
        exDiv.innerHTML = `
            <div class=\"flex justify-between items-center mb-1\">
                <span class=\"font-semibold\">${ex.name}</span>
                <div class=\"relative\">
                    <button class=\"text-gray-500 text-xl ex-menu-btn\" data-idx=\"${exIdx}\" style=\"padding:0 8px;\">&#x22EE;</button>
                    <div class=\"ex-menu hidden absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10\">
                        <button class=\"block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 remove-ex-btn\" data-idx=\"${exIdx}\">Remove</button>
                        <button class=\"block w-full text-left px-4 py-2 text-sm text-blue-500 hover:bg-gray-100 replace-ex-btn\" data-idx=\"${exIdx}\">Replace</button>
                        <button class=\"block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-ex-btn\" data-idx=\"${exIdx}\">Edit</button>
                    </div>
                </div>
            </div>
            ${repRestRangeText}
            ${lastWorkoutData}
            <div class=\"space-y-2\">
                ${ex.sets.map((set, setIdx) => {
                    const isCompleted = set.completed;
                    const rowClass = isCompleted ? 'bg-green-100' : 'bg-gray-50';
                    const inputClass = isCompleted ? 'bg-green-100' : 'bg-gray-100';
                    const disabled = isCompleted ? 'disabled' : '';

                    return `
                    <div class="relative mb-1">
                        <div class="absolute inset-0 flex items-center justify-end pr-2 bg-red-500 rounded delete-bg" style="z-index:0;opacity:0;pointer-events:none;transition:opacity 0.2s;">
                            <button class="delete-set-btn text-white font-bold px-4 py-2 rounded" data-ex-idx="${exIdx}" data-set-idx="${setIdx}">Delete</button>
                        </div>
                        <div class="flex items-center gap-2 set-row ${rowClass} rounded transition-all relative p-3 w-full" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" style="z-index:1;">
                            <div class="flex items-center gap-2 w-[140px]">
                                <span class="text-sm text-gray-500">Set ${setIdx+1}</span>
                                <span class="text-sm text-gray-400 truncate">(${getLastWorkoutSet(ex.name, setIdx)})</span>
                            </div>
                            <div class="flex items-center gap-2 ml-auto">
                                <input type="number" min="0" value="${set.weight}" class="weight-input w-14 p-1.5 text-base rounded ${inputClass} text-gray-900 border transition-colors" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" data-original-unit="kg" ${disabled}>
                                <span class="text-gray-400 text-sm">${weightUnit}</span>
                                <span class="text-gray-400 text-sm">×</span>
                                <input type="number" min="1" value="${typeof set.reps === 'string' && set.reps.match(/^\d+/) ? set.reps.match(/^\d+/)[0] : set.reps}" class="reps-input w-12 p-1.5 text-base rounded ${inputClass} text-gray-900 border transition-colors" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" ${disabled}>
                                <input type="checkbox" class="set-complete-checkbox w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" ${isCompleted ? 'checked' : ''}>
                            </div>
                        </div>
                        <div class="rest-timer-container hidden mt-2 text-center bg-gray-50 rounded p-2">
                            <div class="flex items-center justify-center gap-2">
                                <button class="decrease-time-btn bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded-lg">-10s</button>
                                <div class="rest-timer-display text-lg font-bold text-blue-400 cursor-pointer hover:text-blue-500">00:00</div>
                                <button class="increase-time-btn bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded-lg">+10s</button>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div class="rest-timer-progress bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear" style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                `}).join('')}
                <div class="flex justify-center mt-4">
                    <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg text-base shadow add-set-btn\" data-idx=\"${exIdx}\">+ Add Set</button>
                </div>
            </div>
        `;
        exercisesContainer.appendChild(exDiv);

        exDiv.querySelectorAll('.weight-input').forEach(input => {
            input.addEventListener('change', function() {
                const exIdx = parseInt(this.dataset.exIdx);
                const setIdx = parseInt(this.dataset.setIdx);
                const displayedValue = parseFloat(this.value) || 0;
                workoutExercises[exIdx].sets[setIdx].weight = displayedValue;
                saveWorkoutState();
            });
        });

        exDiv.querySelectorAll('.set-complete-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const row = this.closest('.set-row');
                const inputs = row.querySelectorAll('input[type="number"]');
                const exIdx = parseInt(this.dataset.exIdx);
                const setIdx = parseInt(this.dataset.setIdx);

                workoutExercises[exIdx].sets[setIdx].completed = this.checked;
                saveWorkoutState();
                
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

    function adjustRestTime(seconds) {
        if (restTimerInterval) {
            restTimeSeconds = Math.max(0, restTimeSeconds + seconds);
            
            // Update the total duration when time is adjusted
            initialRestTimeSeconds = Math.max(initialRestTimeSeconds + seconds, restTimeSeconds);
            
            const displays = document.querySelectorAll('.rest-timer-display');
            const progressBars = document.querySelectorAll('.rest-timer-progress');
            
            displays.forEach(display => {
                display.textContent = formatTime(restTimeSeconds);
            });
            
            // Update progress bar with new total duration
            progressBars.forEach(progressBar => {
                const progressPercentage = initialRestTimeSeconds > 0 ? (restTimeSeconds / initialRestTimeSeconds) * 100 : 0;
                progressBar.style.width = `${Math.max(0, progressPercentage)}%`;
            });
            
            // Update the stored initial duration in activeRestTimer
            if (activeRestTimer) {
                activeRestTimer.initialDuration = initialRestTimeSeconds;
            }
            
            saveRestTimerState(); // Save state when time is adjusted
        }
    }

    function startRestTimer(timerDisplayEl, containerEl, exercise, exerciseIndex, setIndex) {
        stopRestTimer();
        restTimeSeconds = exercise.rest ? parseRestTime(exercise.rest) : DEFAULT_REST_TIME;
        initialRestTimeSeconds = restTimeSeconds; // Store initial duration for progress calculation
        
        timerDisplayEl.textContent = formatTime(restTimeSeconds);
        containerEl.classList.remove('hidden');

        // Initialize progress bar to 100%
        const progressBar = containerEl.querySelector('.rest-timer-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
        }

        // Store active timer info for persistence
        activeRestTimer = {
            exerciseIndex: exerciseIndex,
            setIndex: setIndex,
            timerDisplay: timerDisplayEl,
            timerContainer: containerEl,
            initialDuration: initialRestTimeSeconds
        };

        restTimerInterval = setInterval(() => {
            restTimeSeconds--;
            timerDisplayEl.textContent = formatTime(restTimeSeconds);
            
            // Update progress bar
            if (progressBar && initialRestTimeSeconds > 0) {
                const progressPercentage = (restTimeSeconds / initialRestTimeSeconds) * 100;
                progressBar.style.width = `${Math.max(0, progressPercentage)}%`;
            }
            
            saveRestTimerState(); // Save state on each tick
            
            if (restTimeSeconds <= 0) {
                showRestTimerFinishedAlert();
                stopRestTimer();
                containerEl.classList.add('hidden');
            }
        }, 1000);
    
        saveRestTimerState(); // Save initial state
    }

    function stopRestTimer() {
        if (restTimerInterval) {
            clearInterval(restTimerInterval);
            restTimerInterval = null;
        }
        
        // Hide the previously active timer container if it exists
        if (activeRestTimer && activeRestTimer.timerContainer) {
            activeRestTimer.timerContainer.classList.add('hidden');
        }
        
        // Also hide any other visible timer containers to ensure only one timer is visible
        const allTimerContainers = document.querySelectorAll('.rest-timer-container');
        allTimerContainers.forEach(container => {
            container.classList.add('hidden');
        });
        
        activeRestTimer = null;
        saveRestTimerState(); // Clear saved state
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
                startRestTimer(restTimerDisplay, restTimerContainer, workoutExercises[exIdx], exIdx, setIdx);
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
    let sets = [];
    if (Array.isArray(ex.sets) && ex.sets.length > 0) {
        sets = ex.sets.map(set => ({
            ...set,
            completed: false // Always start as not completed
        }));
    } else {
        const numSets = ex.working_sets || 1;
        for (let i = 0; i < numSets; i++) {
            sets.push({
                reps: ex.reps ? parseInt(ex.reps) || 10 : 10,
                weight: 0,
                completed: false
            });
        }
    }
    workoutExercises.push({
        name: ex.name,
        sets: sets,
        rest: ex.rest || null
    });
    renderWorkoutExercises();
    saveWorkoutState();
}

function startWorkoutFromTemplate(template) {
    window.currentTemplateName = template.name;
    workoutExercises = [];
    document.querySelector('textarea').value = '';
    resetStopwatch();
    const workoutNameEl = document.querySelector('#drawerContent .text-xl.font-bold');
    if (workoutNameEl) {
        workoutNameEl.textContent = template.name;
    }
    if (template.exercises && template.exercises.length > 0) {
        template.exercises.forEach(exercise => {
            // Deep copy exercise and its sets
            const copiedExercise = {
                ...exercise,
                sets: Array.isArray(exercise.sets) ? exercise.sets.map(set => ({ ...set })) : []
            };
            addExerciseToWorkout(copiedExercise);
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
        exercises: workoutExercises,
        templateName: window.currentTemplateName || null
    };
    localStorage.setItem('currentWorkout', JSON.stringify(state));
    
    // Also save rest timer state when saving workout
    saveRestTimerState();
}

async function restoreWorkoutState() {
    const savedWorkout = localStorage.getItem('currentWorkout');
    if (savedWorkout) {
        try {
            const workoutData = JSON.parse(savedWorkout);

            // Restore template context if it exists
            if (workoutData.templateName) {
                window.currentTemplateName = workoutData.templateName;
                // We need to ensure allTemplates is loaded before rendering
                if (!window.allTemplates) {
                    const [data, customTemplates] = await Promise.all([
                        fetch('templates.json').then(res => res.json()).catch(() => ({templates:[],routines:[]})),
                        Promise.resolve(JSON.parse(localStorage.getItem('custom_templates') || '[]'))
                    ]);
                    const templates = Array.isArray(data) ? data : (data.templates || []);
                    window.allTemplates = templates.concat(customTemplates);
                }
            }

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
            
            // Restore rest timer after rendering exercises
            restoreRestTimerState();
            
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

// Add this helper function at the top of the file
function getLastWorkoutSet(exerciseName, setIndex) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const localWeightUnit = userData.weightUnit || 'lb';
    
    const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    for (let i = history.length - 1; i >= 0; i--) {
        const workout = history[i];
        const lastExercise = workout.exercises.find(e => e.name === exerciseName);
        if (lastExercise && lastExercise.sets && lastExercise.sets[setIndex]) {
            const set = lastExercise.sets[setIndex];
            return `${set.weight}${localWeightUnit}×${set.reps}`;
        }
    }
    return '-';
}

// Update the timer completion logic in both locations
if (restTimeSeconds <= 0) {
    showRestTimerFinishedAlert();
    stopRestTimer();
    restTimerContainer.classList.add('hidden');
}

// Update the timer completion logic in both locations
if (restTimeSeconds <= 0) {
    showRestTimerFinishedAlert();
    stopRestTimer();
    containerEl.classList.add('hidden');
}

 