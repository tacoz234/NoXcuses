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
        let exerciseHistory = {}; // For demo, could be loaded from localStorage
        fetch('exercises.json')
            .then(res => res.json())
            .then(exercises => {
                allExercises = exercises.slice().sort((a, b) => a.name.localeCompare(b.name));
                renderExerciseList(allExercises);
                renderAlphaSlider(allExercises);
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