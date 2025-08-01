// --- Main Workout Initialization ---

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize core functionality
    attachDrawerEvents();
    setupButtonHandlers();
    startAutoSave(); // Start auto-saving
    
    // Only restore workout state if we're on the workout page or there's an active workout
    if (window.location.pathname.includes('workout.html') || localStorage.getItem('isWorkoutActive') === '1') {
        restoreWorkoutState(); // Attempt to restore workout state on load
    } else {
        // Clean up any leftover rest timer state if not on workout page and no active workout
        localStorage.removeItem('activeRestTimer');
    }

    // Initialize modules
    const templatePreview = new TemplatePreview();
    const templateCreation = new TemplateCreation();
    const templateLoading = new TemplateLoading(templatePreview);
    const exerciseManagement = new ExerciseManagement();

    // Make instances globally available for cross-module communication
    window.templatePreview = templatePreview;
    window.templateCreation = templateCreation;
    window.templateLoading = templateLoading;
    window.exerciseManagement = exerciseManagement;

    // Load exercises first (this is critical for modals to work)
    await exerciseManagement.loadExercises();
    
    // Then load templates
    templateLoading.loadTemplatesAndRoutines();
});