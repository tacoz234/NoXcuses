// --- Main Workout Initialization ---

document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functionality
    attachDrawerEvents();
    setupButtonHandlers();
    startAutoSave(); // Start auto-saving
    restoreWorkoutState(); // Attempt to restore workout state on load

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

    // Load exercises and templates
    exerciseManagement.loadExercises();
    templateLoading.loadTemplatesAndRoutines();
});