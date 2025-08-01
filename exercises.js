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
        })();

let allExercises = [];
let filteredExercises = [];
let exerciseHistory = {}; // For demo, could be loaded from localStorage

// Search functionality
const searchBtn = document.getElementById('search-btn');
const searchContainer = document.getElementById('search-container');
const exerciseSearch = document.getElementById('exercise-search');
const clearSearchBtn = document.getElementById('clear-search');

searchBtn.onclick = function() {
    searchContainer.classList.toggle('hidden');
    if (!searchContainer.classList.contains('hidden')) {
        exerciseSearch.focus();
        // Adjust main content padding when search is visible
        document.querySelector('main').style.paddingTop = '8rem';
    } else {
        // Reset main content padding when search is hidden
        document.querySelector('main').style.paddingTop = '5rem';
        exerciseSearch.value = '';
        filteredExercises = allExercises;
        renderExerciseList(filteredExercises);
        renderAlphaSlider(filteredExercises);
    }
};

exerciseSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    if (searchTerm === '') {
        filteredExercises = allExercises;
    } else {
        filteredExercises = allExercises.filter(exercise => {
            // Search by exercise name
            const nameMatch = exercise.name.toLowerCase().includes(searchTerm);
            
            // Search by muscles worked
            const muscleMatch = exercise.muscle && exercise.muscle.some(muscle => 
                muscle.toLowerCase().includes(searchTerm)
            );
            
            return nameMatch || muscleMatch;
        });
    }
    renderExerciseList(filteredExercises);
    renderAlphaSlider(filteredExercises);
});

clearSearchBtn.onclick = function() {
    exerciseSearch.value = '';
    filteredExercises = allExercises;
    renderExerciseList(filteredExercises);
    renderAlphaSlider(filteredExercises);
    exerciseSearch.focus();
};

// Close search when clicking outside
document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target) && !searchBtn.contains(e.target)) {
        if (!searchContainer.classList.contains('hidden') && exerciseSearch.value === '') {
            searchContainer.classList.add('hidden');
            document.querySelector('main').style.paddingTop = '5rem';
        }
    }
});

// After fetching exercises.json
fetch('exercises.json')
    .then(res => res.json())
    .then(exercises => {
        // Load custom exercises from localStorage
        let customExercises = [];
        try {
            customExercises = JSON.parse(localStorage.getItem('customExercises')) || [];
        } catch (e) {}
        allExercises = exercises.concat(customExercises).sort((a, b) => a.name.localeCompare(b.name));
        filteredExercises = allExercises;
        renderExerciseList(filteredExercises);
        renderAlphaSlider(filteredExercises);
    });

// In your create exercise logic:
document.getElementById('new-exercise-form').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-ex-name').value.trim();
    const notes = document.getElementById('new-ex-notes').value.trim();
    const video = document.getElementById('new-ex-video').value.trim();
    const image = document.getElementById('new-ex-image').value.trim();
    const musclesInput = document.getElementById('new-ex-muscles').value.trim();
    if (!name) return;
    const newEx = { name };
    if (notes) newEx.notes = notes;
    if (video) newEx.video = video;
    if (image) newEx.image = image;
    if (musclesInput) {
        // Parse comma-separated muscles and clean them up
        newEx.muscle = musclesInput.split(',').map(m => m.trim()).filter(m => m.length > 0);
    }
    // Save to localStorage
    let customExercises = [];
    try {
        customExercises = JSON.parse(localStorage.getItem('customExercises')) || [];
    } catch (e) {}
    customExercises.push(newEx);
    localStorage.setItem('customExercises', JSON.stringify(customExercises));
    allExercises.push(newEx);
    allExercises.sort((a, b) => a.name.localeCompare(b.name));
    filteredExercises = allExercises;
    renderExerciseList(filteredExercises);
    renderAlphaSlider(filteredExercises);
    document.getElementById('new-exercise-modal').classList.add('hidden');
    document.getElementById('new-exercise-form').reset();
};
document.getElementById('add-exercise-btn').onclick = function() {
    document.getElementById('new-exercise-modal').classList.remove('hidden');
};

// Add close button functionality for new exercise modal
document.getElementById('close-new-exercise-modal').onclick = function() {
    document.getElementById('new-exercise-modal').classList.add('hidden');
    document.getElementById('new-exercise-form').reset();
};

// Also close modal when clicking outside of it
document.getElementById('new-exercise-modal').onclick = function(e) {
    if (e.target === this) {
        document.getElementById('new-exercise-modal').classList.add('hidden');
        document.getElementById('new-exercise-form').reset();
    }
};

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('new-exercise-modal');
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.getElementById('new-exercise-form').reset();
        }
    }
});

function renderExerciseList(exercises) {
    const list = document.getElementById('exercise-list');
    list.innerHTML = '';
    let lastLetter = '';
    exercises.forEach((ex, idx) => {
        const firstLetter = ex.name[0].toUpperCase();
        if (firstLetter !== lastLetter) {
            list.insertAdjacentHTML('beforeend', `<div id="letter-${firstLetter}" class="text-xs font-bold text-gray-400 mt-3 mb-1">${firstLetter}</div>`);
            lastLetter = firstLetter;
        }
        const div = document.createElement('div');
        div.className = "bg-white rounded-lg shadow p-3 text-gray-900 cursor-pointer hover:bg-blue-50 transition";
        div.textContent = ex.name;
        div.onclick = () => openExerciseModal(ex);
        list.appendChild(div);
    });
}

function renderAlphaSlider(exercises) {
    const slider = document.getElementById('alpha-slider');
    slider.innerHTML = '';
    const letters = Array.from(new Set(exercises.map(e => e.name[0].toUpperCase())));
    letters.forEach(letter => {
        const btn = document.createElement('div');
        btn.className = 'text-xs font-bold text-gray-300 hover:text-blue-400 cursor-pointer px-1 py-0.5';
        btn.textContent = letter;
        btn.onclick = () => {
            const el = document.getElementById('letter-' + letter);
            if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
        };
        slider.appendChild(btn);
    });
}

// Modal logic
const modal = document.getElementById('exercise-modal');
const closeModalBtn = document.getElementById('close-exercise-modal');
const modalExName = document.getElementById('modal-ex-name');
const modalTabContent = document.getElementById('modal-tab-content');
let currentExercise = null;

function openExerciseModal(ex) {
    currentExercise = ex;
    modalExName.textContent = ex.name;
    
    // Display muscles worked
    displayMusclesWorked(ex);
    
    // Handle video/image button visibility and setup
    const mediaBtn = document.getElementById('toggle-video');
    const videoContainer = document.getElementById('video-container');
    const videoFrame = document.getElementById('exercise-video');
    const imageContainer = document.createElement('div');
    imageContainer.id = 'image-container';
    imageContainer.className = 'hidden mb-4';
    
    if (ex.video || ex.image) {
        mediaBtn.classList.remove('hidden');
        mediaBtn.innerHTML = `<i class="fas ${ex.video ? 'fa-play' : 'fa-image'} mr-2"></i>${ex.video ? 'Watch Demo' : 'View Form'}`;
        
        mediaBtn.onclick = () => {
            if (ex.video) {
                // Handle video
                videoContainer.classList.remove('hidden');
                if (imageContainer) imageContainer.classList.add('hidden');
                        
                        let videoId;
                        if (ex.video.includes('youtu.be')) {
                            videoId = ex.video.split('youtu.be/')[1].split('?')[0];
                        } else {
                            videoId = ex.video.split('v=')[1];
                            if (videoId.includes('&')) {
                                videoId = videoId.split('&')[0];
                            }
                        }
                        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        videoFrame.src = embedUrl;
                    } else if (ex.image) {
                        // Handle image
                        videoContainer.classList.add('hidden');
                        imageContainer.classList.remove('hidden');
                        imageContainer.innerHTML = `<img src="${ex.image}" alt="${ex.name} form" class="w-full rounded-lg">`;
                    }
                    mediaBtn.classList.add('hidden');
                };
            } else {
                mediaBtn.classList.add('hidden');
                videoContainer.classList.add('hidden');
                if (imageContainer) imageContainer.classList.add('hidden');
            }
            
            // Insert image container after video container
            videoContainer.parentNode.insertBefore(imageContainer, videoContainer.nextSibling);
            
            setActiveTab('notes');
            modal.classList.remove('hidden');
        }

function displayMusclesWorked(exercise) {
    const musclesSection = document.getElementById('muscles-worked-section');
    const musclesContainer = document.getElementById('muscles-worked-tags');
    
    if (exercise.muscle && exercise.muscle.length > 0) {
        musclesSection.classList.remove('hidden');
        musclesContainer.innerHTML = '';
        
        exercise.muscle.forEach(muscle => {
            const tag = document.createElement('span');
            tag.className = 'inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium mr-1 mb-1';
            tag.textContent = muscle;
            musclesContainer.appendChild(tag);
        });
    } else {
        musclesSection.classList.add('hidden');
    }
}

        // Update close modal function to handle both video and image
        closeModalBtn.onclick = () => {
            modal.classList.add('hidden');
            // Reset video
            const videoContainer = document.getElementById('video-container');
            const videoFrame = document.getElementById('exercise-video');
            const imageContainer = document.getElementById('image-container');
            const mediaBtn = document.getElementById('toggle-video');
            
            videoContainer.classList.add('hidden');
            if (imageContainer) imageContainer.classList.add('hidden');
            videoFrame.src = '';
            mediaBtn.classList.remove('hidden');
        };
        document.querySelectorAll('.modal-tab').forEach(tabBtn => {
            tabBtn.onclick = function() {
                setActiveTab(this.dataset.tab);
            };
        });
        function normalizeName(name) {
            return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        }
        function setActiveTab(tab) {
            document.querySelectorAll('.modal-tab').forEach(btn => {
                btn.classList.remove('border-blue-500', 'text-blue-600');
                if (btn.dataset.tab === tab) btn.classList.add('border-blue-500', 'text-blue-600');
            });
            if (!currentExercise) return;
            if (tab === 'notes') {
                modalTabContent.innerHTML = currentExercise.notes ? `<div class='text-gray-800'>${currentExercise.notes}</div>` : '<div class="text-gray-400">No notes for this exercise.</div>';
            } else if (tab === 'history') {
                let history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                let sets = [];
                const exNameNorm = normalizeName(currentExercise.name);
                history.forEach(w => {
                    (w.exercises || []).forEach(ex => {
                        if (normalizeName(ex.name) === exNameNorm) {
                            (ex.sets || []).forEach(set => {
                                if (set.completed) {
                                    sets.push({
                                        weight: set.weight,
                                        reps: set.reps,
                                        date: w.date,
                                        template: w.template || ''
                                    });
                                }
                            });
                        }
                    });
                });
                if (sets.length > 0) {
                    modalTabContent.innerHTML = sets.map(s => `<div class='text-gray-800'>${s.weight} x ${s.reps} <span class='text-gray-500 text-xs'>(${new Date(s.date).toLocaleDateString()}${s.template ? ' - ' + s.template : ''})</span></div>`).join('');
                } else {
                    modalTabContent.innerHTML = '<div class="text-gray-400">No history for this exercise.</div>';
                }
            } else if (tab === 'best') {
                let history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
                let bestSet = null;
                const exNameNorm = normalizeName(currentExercise.name);
                history.forEach(w => {
                    (w.exercises || []).forEach(ex => {
                        if (normalizeName(ex.name) === exNameNorm) {
                            (ex.sets || []).forEach(set => {
                                if (set.completed) {
                                    let volume = (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
                                    if (!bestSet || volume > bestSet.volume) {
                                        bestSet = {
                                            weight: set.weight,
                                            reps: set.reps,
                                            date: w.date,
                                            volume: volume
                                        };
                                    }
                                }
                            });
                        }
                    });
                });
                if (bestSet) {
                    modalTabContent.innerHTML = `<div class='text-gray-800'>${bestSet.weight} x ${bestSet.reps} <span class='text-gray-500 text-xs'>(${new Date(bestSet.date).toLocaleString()})</span></div>`;
                } else {
                    modalTabContent.innerHTML = '<div class="text-gray-400">No best set for this exercise.</div>';
                }
            }
        }