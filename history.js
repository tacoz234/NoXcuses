function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    const noHistory = document.getElementById('no-history');
    let history = JSON.parse(localStorage.getItem('workoutHistory') || '[]').reverse();

    historyList.innerHTML = '';
    if (history.length === 0) {
        noHistory.classList.remove('hidden');
        return;
    } else {
        noHistory.classList.add('hidden');
    }

    history.forEach((workout, idx) => {
        const workoutDiv = document.createElement('div');
        workoutDiv.className = "relative group overflow-hidden";

        // Card content
        const card = document.createElement('div');
        card.className = "bg-white rounded-lg shadow-md p-4 text-gray-900 transition-transform duration-200";
        card.style.touchAction = "pan-y";

        let exercisesHtml = '';
        if (workout.exercises && Array.isArray(workout.exercises)) {
          workout.exercises.forEach(ex => {
              let setsHtml = '';
              if (ex.sets && Array.isArray(ex.sets)) {
                ex.sets.forEach((set, i) => {
                    setsHtml += `
                    <div class="flex items-center space-x-2 text-sm">
                        <span class="text-gray-600">Set ${i+1}:</span>
                        <span>${set.weight || '-'} lbs</span>
                        <span>x</span>
                        <span>${set.reps || '-'}</span>
                        <span>${set.completed ? '✅' : ''}</span>
                    </div>
                `;
                });
              }
              exercisesHtml += `
                <div class="mb-2">
                    <div class="font-semibold">${ex.name}</div>
                    <div class="ml-2 space-y-1">${setsHtml}</div>
                </div>
            `;
        });
        }

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-grow">
                    ${workout.template ? `<div class="font-bold text-lg">${workout.template}</div>` : ''}
                    <div class="font-bold text-base">${formatDate(workout.date)}</div>
                    <div class="text-sm text-gray-600">Duration: ${workout.duration}</div>
                </div>
                <button class="more-btn text-gray-500 hover:text-gray-700 p-2" data-idx="${idx}">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="divide-y divide-gray-200 mt-2">
                ${exercisesHtml}
            </div>
        `;

        workoutDiv.appendChild(card);
        historyList.appendChild(workoutDiv);
    });

    // Add event listeners for the new modals
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.currentTarget.dataset.idx;
            const workout = history[idx];
            openWorkoutActionsModal(workout, idx);
        });
    });
}

function openWorkoutActionsModal(workout, idx) {
    const modal = document.getElementById('workoutActionsModal');
    modal.classList.remove('hidden');

    // Store workout data for later use
    modal.dataset.workoutIdx = idx;
    modal.dataset.workout = JSON.stringify(workout);

    document.getElementById('closeWorkoutActionsModal').onclick = () => modal.classList.add('hidden');
    document.getElementById('saveAsTemplateBtn').onclick = () => saveAsTemplate(workout);
    document.getElementById('deleteWorkoutBtn').onclick = () => openDeleteConfirmModal(idx);
}

function openDeleteConfirmModal(idx) {
    const modal = document.getElementById('deleteConfirmModal');
    modal.classList.remove('hidden');

    document.getElementById('cancelDeleteBtn').onclick = () => modal.classList.add('hidden');
    document.getElementById('confirmDeleteBtn').onclick = () => {
        deleteWorkout(idx);
        modal.classList.add('hidden');
        document.getElementById('workoutActionsModal').classList.add('hidden');
    };
}

function deleteWorkout(idx) {
    let all = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    all.splice(all.length - 1 - idx, 1); // Because we reversed for display
    localStorage.setItem('workoutHistory', JSON.stringify(all));
    renderHistory();
}

function saveAsTemplate(workout) {
    document.getElementById('workoutActionsModal').classList.add('hidden');
    const addTemplateModal = document.getElementById('addTemplateModal');
    addTemplateModal.classList.remove('hidden');
    document.getElementById('addTemplateNameInput').value = workout.template || `Workout from ${formatDate(workout.date).split(',')[0]}`;
    window._workoutToTemplate = workout;
}

window.onload = renderHistory;

// Add this outside renderHistory(), at the end of the file:
document.addEventListener('DOMContentLoaded', function() {
    const closeModalBtn = document.getElementById('closeAddTemplateModal');
    if (closeModalBtn) {
        closeModalBtn.onclick = function() {
            document.getElementById('addTemplateModal').classList.add('hidden');
        };
    }
    const confirmAddTemplateBtn = document.getElementById('confirmAddTemplateBtn');
    if (confirmAddTemplateBtn) {
        confirmAddTemplateBtn.onclick = function() {
            const name = document.getElementById('addTemplateNameInput').value.trim();
            if (!name) return alert('Please enter a template name.');
            const workout = window._workoutToTemplate;
            if (!workout) return;
            // Always store weights in lbs
            const exercises = (workout.exercises || []).map(ex => ({
                ...ex,
                rest: ex.rest || '', // Save rest time if present
                sets: (ex.sets || []).map(set => {
                    let weight = parseFloat(set.weight);
                    return {
                        ...set,
                        weight: isNaN(weight) ? '' : weight
                    };
                })
            }));
            let customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
            customTemplates.push({ name, exercises });
            localStorage.setItem('custom_templates', JSON.stringify(customTemplates));
            document.getElementById('addTemplateModal').classList.add('hidden');
            alert('Template saved!');
        };
    } else {
        console.error('Save Template button not found in DOM');
    }
});