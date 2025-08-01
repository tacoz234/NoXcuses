// --- Confirmation Modal ---
function showConfirm(message, onYes) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return; // Exit if modal doesn't exist on this page
    
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

// --- Exercise Modals ---
// Only initialize if elements exist (workout page)
const exerciseModal = document.getElementById('exerciseModal');
const closeExerciseModalBtn = document.getElementById('closeExerciseModal');
const exerciseSearch = document.getElementById('exerciseSearch');
const exerciseList = document.getElementById('exerciseList');

// Only set up exercise modal if elements exist
if (exerciseModal && closeExerciseModalBtn && exerciseSearch && exerciseList) {
    function openExerciseModal() {
        exerciseModal.classList.remove('hidden');
        exerciseSearch.value = '';
        
        // Check if exercises are loaded, if not show loading message
        if (!window.allExercises || window.allExercises.length === 0) {
            exerciseList.innerHTML = '<div class="text-gray-400 text-center">Loading exercises...</div>';
            // Try to load exercises if they haven't been loaded yet
            if (window.exerciseManagement) {
                window.exerciseManagement.loadExercises().then(() => {
                    renderExerciseList(window.allExercises || []);
                });
            }
        } else {
            renderExerciseList(window.allExercises);
        }
        
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
        if (!exercises || exercises.length === 0) {
            exerciseList.innerHTML = '<div class="text-gray-400 text-center">No exercises found.</div>';
            return;
        }
        
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
    }

    exerciseSearch.addEventListener('input', function() {
        const val = exerciseSearch.value.toLowerCase();
        const exercises = window.allExercises || [];
        renderExerciseList(exercises.filter(ex => {
            // Search by exercise name
            const nameMatch = ex.name.toLowerCase().includes(val);
            
            // Search by muscles worked
            const muscleMatch = ex.muscle && ex.muscle.some(muscle => 
                muscle.toLowerCase().includes(val)
            );
            
            return nameMatch || muscleMatch;
        }));
    });
}

// Replace Exercise Modal
const replaceExerciseModal = document.getElementById('replaceExerciseModal');
const closeReplaceExerciseModalBtn = document.getElementById('closeReplaceExerciseModal');
const replaceExerciseSearch = document.getElementById('replaceExerciseSearch');
const replaceExerciseList = document.getElementById('replaceExerciseList');

// Only set up replace exercise modal if elements exist
if (replaceExerciseModal && closeReplaceExerciseModalBtn && replaceExerciseSearch && replaceExerciseList) {
    function openReplaceExerciseModal(idx) {
        replaceExerciseIdx = idx;
        replaceExerciseModal.classList.remove('hidden');
        replaceExerciseSearch.value = '';
        
        // Check if exercises are loaded
        if (!window.allExercises || window.allExercises.length === 0) {
            replaceExerciseList.innerHTML = '<div class="text-gray-400 text-center">Loading exercises...</div>';
            if (window.exerciseManagement) {
                window.exerciseManagement.loadExercises().then(() => {
                    renderReplaceExerciseList(window.allExercises || []);
                });
            }
        } else {
            renderReplaceExerciseList(window.allExercises);
        }
        
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
        const exercises = window.allExercises || [];
        renderReplaceExerciseList(exercises.filter(ex => {
            // Search by exercise name
            const nameMatch = ex.name.toLowerCase().includes(val);
            
            // Search by muscles worked
            const muscleMatch = ex.muscle && ex.muscle.some(muscle => 
                muscle.toLowerCase().includes(val)
            );
            
            return nameMatch || muscleMatch;
        }));
    });

    function renderReplaceExerciseList(exercises) {
        replaceExerciseList.innerHTML = '';
        if (!exercises || exercises.length === 0) {
            replaceExerciseList.innerHTML = '<div class="text-gray-400 text-center">No exercises found.</div>';
            return;
        }
        
        exercises.forEach(ex => {
            const div = document.createElement('div');
            div.className = 'bg-gray-100 rounded p-2 cursor-pointer hover:bg-blue-100 mb-1 text-black';
            div.textContent = ex.name;
            div.onclick = () => {
                if (replaceExerciseIdx !== null) {
                    let sets = [];
                    // Always copy reps and rest from the exercise being replaced
                    let oldEx = workoutExercises[replaceExerciseIdx];
                    let reps = oldEx?.sets?.[0]?.reps ?? 10;
                    let rest = oldEx?.rest ?? null;
                    let numSets = oldEx?.sets?.length ?? 1;
                    for (let i = 0; i < numSets; i++) {
                        sets.push({
                            reps: reps,
                            weight: 0,
                            completed: false
                        });
                    }
                    workoutExercises[replaceExerciseIdx] = {
                        name: ex.name,
                        sets: sets,
                        rest: rest
                    };
                    renderWorkoutExercises();
                    closeReplaceExerciseModal();
                }
            };
            replaceExerciseList.appendChild(div);
        });
    }
}

// --- Alert Modal ---
function showAlert(message, title = 'Alert', autoCloseSeconds = 3) {
    
    // Remove any existing alert
    const existing = document.getElementById('simpleAlert');
    if (existing) {
        existing.remove();
    }
    
    // Create a simple alert div that matches your app's style
    const alertDiv = document.createElement('div');
    alertDiv.id = 'simpleAlert';
    alertDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            color: #374151;
            padding: 24px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            z-index: 999999;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            text-align: center;
            min-width: 300px;
            max-width: 400px;
            font-family: Arial, sans-serif;
        ">
            <div style="margin-bottom: 8px; font-size: 18px; font-weight: 600; color: #1f2937;">${title}</div>
            <div style="color: #4b5563;">${message}</div>
        </div>
    `;
    
    // Add to page immediately
    document.body.appendChild(alertDiv);
    
    // Auto-remove after time
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, autoCloseSeconds * 1000);
    
    return alertDiv;
}

// Don't override window.alert to avoid conflicts

// --- Confirm Modal ---
function showConfirm(message, title = 'Confirm', onConfirm = () => {}, onCancel = () => {}) {
    
    // Remove any existing confirm dialog
    const existing = document.getElementById('simpleConfirm');
    if (existing) {
        existing.remove();
    }
    
    // Create a simple confirm dialog that matches your app's style
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'simpleConfirm';
    confirmDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                background: #1f2937;
                color: white;
                padding: 24px;
                border-radius: 12px;
                font-size: 16px;
                z-index: 1000000;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                text-align: center;
                min-width: 300px;
                max-width: 400px;
                font-family: Arial, sans-serif;
            ">
                <div style="margin-bottom: 8px; font-size: 18px; font-weight: 600;">${title}</div>
                <div style="margin-bottom: 20px; color: #d1d5db;">${message}</div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="confirmBtn" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Confirm</button>
                    <button id="cancelBtn" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page immediately
    document.body.appendChild(confirmDiv);
    
    // Add event listeners
    const confirmBtn = confirmDiv.querySelector('#confirmBtn');
    const cancelBtn = confirmDiv.querySelector('#cancelBtn');
    
    const cleanup = () => {
        confirmDiv.remove();
    };
    
    confirmBtn.onclick = () => {
        cleanup();
        onConfirm();
    };
    
    cancelBtn.onclick = () => {
        cleanup();
        onCancel();
    };
    
    // Close on background click
    confirmDiv.onclick = (e) => {
        if (e.target === confirmDiv) {
            cleanup();
            onCancel();
        }
    };
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            cleanup();
            onCancel();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    return confirmDiv;
}
