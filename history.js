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
            <div class="flex flex-col mb-2">
                ${workout.template ? `<div class="font-bold text-lg">${workout.template}</div>` : ''}
                <div class="font-bold text-base">${formatDate(workout.date)}</div>
                <div class="text-sm text-gray-600">Duration: ${workout.duration}</div>
            </div>
            <div class="divide-y divide-gray-200">
                ${exercisesHtml}
            </div>
        `;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "absolute top-0 right-0 h-full w-24 bg-red-600 text-white font-bold rounded-lg transition-all duration-200 translate-x-full group-[.show-delete]:translate-x-0";
        deleteBtn.style.zIndex = 10;
        deleteBtn.onclick = function() {
            // Remove from localStorage
            let all = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
            all.splice(all.length - 1 - idx, 1); // Because we reversed
            localStorage.setItem('workoutHistory', JSON.stringify(all));
            renderHistory();
        };

        // Swipe logic
        let startX = 0, currentX = 0, swiped = false;
        card.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            card.style.transition = '';
        });
        card.addEventListener('touchmove', function(e) {
            currentX = e.touches[0].clientX;
            let dx = currentX - startX;
            // If already swiped and user swipes right, allow to swipe back
            if (swiped && dx > 0) {
                card.style.transform = `translateX(${dx - 80}px)`;
            } else if (!swiped) {
                card.style.transform = `translateX(${dx}px)`;
            }
        });
        card.addEventListener('touchend', function(e) {
            let dx = currentX - startX;
            card.style.transition = 'transform 0.2s';
            if (!swiped && dx < -60) {
                // Swipe left to show delete
                card.style.transform = 'translateX(-80px)';
                workoutDiv.classList.add('show-delete');
                swiped = true;
            } else if (swiped && dx > 40) {
                // Swipe right to hide delete
                card.style.transform = '';
                workoutDiv.classList.remove('show-delete');
                swiped = false;
            } else if (swiped) {
                // Stay in delete state
                card.style.transform = 'translateX(-80px)';
            } else {
                // Return to normal
                card.style.transform = '';
                workoutDiv.classList.remove('show-delete');
                swiped = false;
            }
            startX = 0; currentX = 0;
        });

        // Also allow mouse for desktop
        let mouseDown = false, mouseStartX = 0, mouseCurrentX = 0;
        card.addEventListener('mousedown', function(e) {
            mouseDown = true;
            mouseStartX = e.clientX;
            card.style.transition = '';
        });
        card.addEventListener('mousemove', function(e) {
            if (!mouseDown) return;
            mouseCurrentX = e.clientX;
            let dx = mouseCurrentX - mouseStartX;
            if (Math.abs(dx) > 0) {
                card.style.transform = `translateX(${dx}px)`;
            }
        });
        card.addEventListener('mouseup', function(e) {
            if (!mouseDown) return;
            let dx = mouseCurrentX - mouseStartX;
            card.style.transition = 'transform 0.2s';
            if (Math.abs(dx) > 60) {
                card.style.transform = 'translateX(-80px)';
                workoutDiv.classList.add('show-delete');
                swiped = true;
            } else {
                card.style.transform = '';
                workoutDiv.classList.remove('show-delete');
                swiped = false;
            }
            mouseDown = false;
            mouseStartX = 0; mouseCurrentX = 0;
        });
        card.addEventListener('mouseleave', function(e) {
            if (mouseDown) {
                card.dispatchEvent(new MouseEvent('mouseup'));
            }
        });

        // Hide delete if card is tapped again
        card.addEventListener('click', function() {
            if (swiped) {
                card.style.transform = '';
                workoutDiv.classList.remove('show-delete');
                swiped = false;
            }
        });

        // Add after card.innerHTML assignment
        const moreBtn = document.createElement('button');
        moreBtn.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
        moreBtn.className = 'absolute top-2 right-10 text-gray-500 hover:text-gray-700 text-xl p-2';
        moreBtn.onclick = function(e) {
            e.stopPropagation();
            document.getElementById('addTemplateModal').classList.remove('hidden');
            document.getElementById('addTemplateNameInput').value = workout.template || '';
            // Store the workout object for saving
            window._workoutToTemplate = workout;
        };
        workoutDiv.appendChild(moreBtn);

        workoutDiv.appendChild(card);
        workoutDiv.appendChild(deleteBtn);
        historyList.appendChild(workoutDiv);
    });
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
            console.log('Save Template clicked');
            const name = document.getElementById('addTemplateNameInput').value.trim();
            if (!name) return alert('Please enter a template name.');
            const workout = window._workoutToTemplate;
            if (!workout) return;
            // Always store weights in lbs
            const exercises = (workout.exercises || []).map(ex => ({
                ...ex,
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