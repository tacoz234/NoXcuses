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

    // Main Share Modal functionality
    const postBtn = document.getElementById('post-btn');
    const shareModal = document.getElementById('share-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const shareOptions = document.querySelectorAll('.share-option');

    postBtn.addEventListener('click', () => {
        shareModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        shareModal.classList.add('hidden');
    });

    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.add('hidden');
        }
    });

    // Sub-modal functionality
    const templateShareModal = document.getElementById('template-share-modal');
    const workoutShareModal = document.getElementById('workout-share-modal');
    const playlistShareModal = document.getElementById('playlist-share-modal');
    const prShareModal = document.getElementById('pr-share-modal');
    const closeSubModalBtns = document.querySelectorAll('.close-sub-modal-btn');

    shareOptions.forEach(option => {
        option.addEventListener('click', () => {
            shareModal.classList.add('hidden');
            const shareType = option.dataset.shareType;
            if (shareType === 'template') {
                templateShareModal.classList.remove('hidden');
                loadTemplates();
            } else if (shareType === 'workout') {
                workoutShareModal.classList.remove('hidden');
                loadWorkouts();
            } else if (shareType === 'playlist') {
                playlistShareModal.classList.remove('hidden');
                loadPlaylists();
            } else if (shareType === 'pr') {
                prShareModal.classList.remove('hidden');
                loadExercisesForPR();
            }
        });
    });

    closeSubModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.fixed').classList.add('hidden');
        });
    });

    [templateShareModal, workoutShareModal, playlistShareModal, prShareModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    async function loadTemplates() {
        const templateListContainer = document.getElementById('template-list-container');
        templateListContainer.innerHTML = '<p class="text-gray-400">Loading templates...</p>';
        try {
            const response = await fetch('templates.json');
            const data = await response.json();
            const templates = Array.isArray(data) ? data : (data.templates || []);
            if (templates.length === 0) {
                templateListContainer.innerHTML = '<p class="text-gray-400">No templates found.</p>';
                return;
            }
            templateListContainer.innerHTML = templates.map(tpl => `
                <button class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-md text-lg transition-colors duration-200 template-item" data-template-name="${tpl.name}">
                    ${tpl.name}
                </button>
            `).join('');
            templateListContainer.querySelectorAll('.template-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    showAlert(`Sharing template: ${e.target.dataset.templateName}`, 'Success');
                    templateShareModal.classList.add('hidden');
                });
            });
        } catch (error) {
            console.error('Error loading templates:', error);
            templateListContainer.innerHTML = '<p class="text-red-400">Error loading templates.</p>';
        }
    }

    function loadWorkouts() {
        const workoutListContainer = document.getElementById('workout-list-container');
        const workoutHistory = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        if (workoutHistory.length === 0) {
            workoutListContainer.innerHTML = '<p class="text-gray-400">No workout history found.</p>';
            return;
        }
        workoutListContainer.innerHTML = workoutHistory.reverse().map(workout => `
            <button class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-md text-lg transition-colors duration-200 workout-item" data-workout-date="${workout.date}">
                Workout on ${new Date(workout.date).toLocaleString()}
            </button>
        `).join('');
        workoutListContainer.querySelectorAll('.workout-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                showAlert(`Sharing workout from: ${e.target.dataset.workoutDate}`, 'Success');
                workoutShareModal.classList.add('hidden');
            });
        });
    }

    async function loadPlaylists() {
        const playlistListContainer = document.getElementById('playlist-list-container');
        playlistListContainer.innerHTML = '<p class="text-gray-400">Loading playlists...</p>';
        try {
            const response = await fetch('templates.json');
            const data = await response.json();
            const playlists = data.playlists || [];
            if (playlists.length === 0) {
                playlistListContainer.innerHTML = '<p class="text-gray-400">No playlists found.</p>';
                return;
            }
            playlistListContainer.innerHTML = playlists.map(playlist => `
                <button class="w-full text-left bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-md text-lg transition-colors duration-200 playlist-item" data-playlist-name="${playlist.name}">
                    ${playlist.name}
                </button>
            `).join('');
            playlistListContainer.querySelectorAll('.playlist-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    showAlert(`Sharing playlist: ${e.target.dataset.playlistName}`, 'Success');
                    playlistShareModal.classList.add('hidden');
                });
            });
        } catch (error) {
            console.error('Error loading playlists:', error);
            playlistListContainer.innerHTML = '<p class="text-red-400">Error loading playlists.</p>';
        }
    }

    async function loadExercisesForPR() {
        const exerciseSelect = document.getElementById('pr-exercise-select');
        exerciseSelect.innerHTML = '<option>Loading exercises...</option>';
        try {
            const response = await fetch('exercises.json');
            const exercises = await response.json();
            if (exercises.length === 0) {
                exerciseSelect.innerHTML = '<option>No exercises found</option>';
                return;
            }
            exerciseSelect.innerHTML = exercises.map(ex => `<option value="${ex.name}">${ex.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading exercises:', error);
            exerciseSelect.innerHTML = '<option>Error loading exercises</option>';
        }
    }

    const submitPrShareBtn = document.getElementById('submit-pr-share');
    submitPrShareBtn.addEventListener('click', () => {
        const videoFile = document.getElementById('pr-video-upload').files[0];
        const selectedExercise = document.getElementById('pr-exercise-select').value;
        const weight = document.getElementById('pr-weight-input').value;
        let message = `Sharing PR for exercise: ${selectedExercise}`;
        if (weight) {
            message += ` with weight: ${weight}`;
        }
        if (videoFile) {
            message += ` with video: ${videoFile.name}`;
        }
        showAlert(message, 'Success');
        prShareModal.classList.add('hidden');
    });
})();