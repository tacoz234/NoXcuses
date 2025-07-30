// Template Preview Modal functionality
class TemplatePreview {
    constructor() {
        this.currentPreviewTemplate = null;
        this.allTemplates = [];
        this.initializeEventListeners();
    }

    setAllTemplates(templates) {
        this.allTemplates = templates;
    }

    openTemplatePreviewModal(template) {
        this.currentPreviewTemplate = template;
        const modal = document.getElementById('templatePreviewModal');
        const title = document.getElementById('templatePreviewTitle');
        const summary = document.getElementById('templatePreviewSummary');
        const exercisesList = document.getElementById('templatePreviewExercises');
        
        if (!modal) {
            console.error('Template preview modal not found');
            return;
        }
        
        // Set title
        if (title) title.textContent = template.name;
        
        // Set summary
        const exerciseCount = template.exercises ? template.exercises.length : 0;
        if (summary) summary.textContent = `${exerciseCount} exercises`;
        
        // Render exercises
        if (exercisesList) {
            exercisesList.innerHTML = '';
            if (template.exercises && template.exercises.length > 0) {
                template.exercises.forEach((exercise, index) => {
                    const exerciseDiv = document.createElement('div');
                    exerciseDiv.className = 'bg-gray-700 rounded-lg p-4';
                    
                    // Check if this exercise has actual workout data (sets with weight/reps)
                    const hasActualSets = exercise.sets && Array.isArray(exercise.sets) && 
                                         exercise.sets.length > 0 && 
                                         exercise.sets.some(set => set.weight !== undefined || set.reps !== undefined);
                    
                    let setsDisplay, repsDisplay, restDisplay;
                    
                    if (hasActualSets) {
                        // For templates saved from history, show actual data in template format
                        const completedSets = exercise.sets.filter(set => set.completed);
                        setsDisplay = completedSets.length || exercise.sets.length;
                        
                        // Get rep range from actual sets
                        const repsValues = exercise.sets
                            .filter(set => set.reps && set.reps > 0)
                            .map(set => parseInt(set.reps));
                        
                        if (repsValues.length > 0) {
                            const minReps = Math.min(...repsValues);
                            const maxReps = Math.max(...repsValues);
                            repsDisplay = minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;
                        } else {
                            repsDisplay = '8-12'; // fallback
                        }
                        
                        restDisplay = exercise.rest || '60-90s';
                    } else if (exercise.sets && (exercise.minReps || exercise.maxReps)) {
                        // New format with sets and rep ranges
                        setsDisplay = exercise.sets;
                        if (exercise.minReps === exercise.maxReps) {
                            repsDisplay = `${exercise.minReps}`;
                        } else {
                            repsDisplay = `${exercise.minReps}-${exercise.maxReps}`;
                        }
                        restDisplay = exercise.rest || '60-90s';
                    } else {
                        // Old format fallback
                        setsDisplay = exercise.working_sets || exercise.sets || '3';
                        repsDisplay = exercise.reps || '8-12';
                        restDisplay = exercise.rest || '60-90s';
                    }
                    
                    exerciseDiv.innerHTML = `
                        <div class="font-medium text-white mb-2">${exercise.name}</div>
                        <div class="text-sm text-gray-300 space-y-1">
                            <div><span class="text-gray-400">Sets:</span> ${setsDisplay}</div>
                            <div><span class="text-gray-400">Reps:</span> ${repsDisplay}</div>
                            <div><span class="text-gray-400">Rest:</span> ${restDisplay}</div>
                            ${exercise.muscle ? `<div class="text-xs text-gray-400 mt-2"><span class="text-gray-500">Target:</span> ${exercise.muscle}</div>` : ''}
                            ${exercise.notes ? `<div class="text-xs text-gray-400 mt-2 italic">${exercise.notes}</div>` : ''}
                        </div>
                    `;
                    exercisesList.appendChild(exerciseDiv);
                });
            } else {
                exercisesList.innerHTML = '<div class="text-gray-400 text-center py-4">No exercises in this template</div>';
            }
        }
        
        // Force show modal with multiple approaches
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    closeTemplatePreviewModal() {
        const modal = document.getElementById('templatePreviewModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
        
        this.currentPreviewTemplate = null;
    }

    initializeEventListeners() {
        // Set up modal event listeners
        const closeBtn = document.getElementById('closeTemplatePreviewModal');
        const cancelBtn = document.getElementById('cancelTemplatePreview');
        const startBtn = document.getElementById('startTemplateFromPreview');
        const modal = document.getElementById('templatePreviewModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeTemplatePreviewModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeTemplatePreviewModal());
        }
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.currentPreviewTemplate) {
                    window.allTemplates = this.allTemplates;
                    startWorkoutFromTemplate(this.currentPreviewTemplate);
                    this.closeTemplatePreviewModal();
                }
            });
        }
        if (modal) {
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'templatePreviewModal') {
                    this.closeTemplatePreviewModal();
                }
            });
        }

        // Close modal with Escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.closeTemplatePreviewModal();
            }
        });

        // Template edit dropdown functionality
        this.initializeEditDropdown();
    }

    initializeEditDropdown() {
        const editTemplateBtn = document.getElementById('editTemplateBtn');
        const editTemplateDropdown = document.getElementById('editTemplateDropdown');
        const editTemplateOption = document.getElementById('editTemplateOption');
        const deleteTemplateOption = document.getElementById('deleteTemplateOption');

        // Toggle dropdown when edit button is clicked
        if (editTemplateBtn) {
            editTemplateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTemplateDropdown.classList.toggle('hidden');
            });
        }

        // Edit template functionality
        if (editTemplateOption) {
            editTemplateOption.addEventListener('click', () => {
                if (this.currentPreviewTemplate) {
                    window.templateCreation.editTemplate(this.currentPreviewTemplate);
                }
                editTemplateDropdown.classList.add('hidden');
            });
        }

        // Delete template functionality
        if (deleteTemplateOption) {
            deleteTemplateOption.addEventListener('click', () => {
                if (this.currentPreviewTemplate) {
                    this.deleteTemplate(this.currentPreviewTemplate.name);
                }
                editTemplateDropdown.classList.add('hidden');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (editTemplateDropdown && !editTemplateBtn.contains(e.target)) {
                editTemplateDropdown.classList.add('hidden');
            }
        });
    }

    deleteTemplate(templateName) {
        if (!confirm(`Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`)) {
            return;
        }

        // Only allow deletion of custom templates
        let customTemplates = [];
        try {
            customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
        } catch (e) {
            customTemplates = [];
        }

        const templateIndex = customTemplates.findIndex(t => t.name === templateName);
        if (templateIndex === -1) {
            alert('This template cannot be deleted (it may be a built-in template)');
            return;
        }

        customTemplates.splice(templateIndex, 1);
        localStorage.setItem('custom_templates', JSON.stringify(customTemplates));

        alert('Template deleted successfully!');
        this.closeTemplatePreviewModal();
        
        // Refresh the page to update the template list
        window.location.reload();
    }

    getCurrentPreviewTemplate() {
        return this.currentPreviewTemplate;
    }
}

// Export for use in other modules
window.TemplatePreview = TemplatePreview;