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