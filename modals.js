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

// --- Exercise Modals ---
const exerciseModal = document.getElementById('exerciseModal');
const closeExerciseModalBtn = document.getElementById('closeExerciseModal');
const exerciseSearch = document.getElementById('exerciseSearch');
const exerciseList = document.getElementById('exerciseList');

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
    renderExerciseList(exercises.filter(ex => ex.name.toLowerCase().includes(val)));
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
    renderReplaceExerciseList(exercises.filter(ex => ex.name.toLowerCase().includes(val)));
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