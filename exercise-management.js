// Exercise Management functionality
class ExerciseManagement {
    constructor() {
        this.initializeEventListeners();
    }

    async loadExercises() {
        try {
            const data = await fetch('exercises.json').then(res => res.json());
            let customExercises = [];
            try {
                customExercises = JSON.parse(localStorage.getItem('customExercises')) || [];
            } catch (e) {}
            
            window.allExercises = data.concat(customExercises).sort((a, b) => a.name.localeCompare(b.name));
            
            // Wire up the Add Exercises button in the drawer ONLY after allExercises is ready
            const addExercisesBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Add Exercises');
            if (addExercisesBtn) {
                addExercisesBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    openExerciseModal();
                });
            }
        } catch (error) {
            console.error('Error loading exercises:', error);
        }
    }

    initializeEventListeners() {
        // Event listeners for exercise menu buttons
        document.body.addEventListener('click', (e) => {
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

        // Exercise action handlers
        document.body.addEventListener('click', (e) => {
            // Handler for Remove
            const removeBtn = e.target.closest('.remove-ex-btn');
            if (removeBtn) {
                e.stopPropagation();
                const idx = +removeBtn.dataset.idx;
                if (window.workoutExercises) {
                    window.workoutExercises.splice(idx, 1);
                    if (window.renderWorkoutExercises) window.renderWorkoutExercises();
                    if (window.saveWorkoutState) window.saveWorkoutState();
                }
            }

            // Handler for Replace
            const replaceBtn = e.target.closest('.replace-ex-btn');
            if (replaceBtn) {
                e.stopPropagation();
                const idx = +replaceBtn.dataset.idx;
                if (window.openReplaceExerciseModal) {
                    window.openReplaceExerciseModal(idx);
                }
            }

            // Handler for Edit (placeholder, implement as needed)
            const editBtn = e.target.closest('.edit-ex-btn');
            if (editBtn) {
                e.stopPropagation();
                const idx = +editBtn.dataset.idx;
                alert(`Edit exercise at index: ${idx} (functionality to be implemented)`);
            }
        });
    }
}

// Export for use in other modules
window.ExerciseManagement = ExerciseManagement;