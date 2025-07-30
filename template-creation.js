// Template Creation and Editing functionality
class TemplateCreation {
    constructor() {
        this.templateExercises = [];
        this.currentConfigExercise = null;
        this.isEditingTemplate = false;
        this.originalTemplateName = '';
        this.initializeEventListeners();
    }

    openTemplateCreationModal() {
        this.templateExercises = [];
        const templateNameInput = document.getElementById('templateNameInput');
        if (templateNameInput) templateNameInput.value = '';
        this.renderTemplateExercises();
        
        const templateCreationModal = document.getElementById('templateCreationModal');
        if (templateCreationModal) {
            templateCreationModal.style.display = 'flex';
            templateCreationModal.classList.remove('hidden');
        }
    }

    closeTemplateCreationModal() {
        const templateCreationModal = document.getElementById('templateCreationModal');
        if (templateCreationModal) {
            templateCreationModal.style.display = 'none';
            templateCreationModal.classList.add('hidden');
        }
        this.templateExercises = [];
        this.isEditingTemplate = false;
        this.originalTemplateName = '';
    }

    renderTemplateExercises() {
        const templateExercisesList = document.getElementById('templateExercisesList');
        if (!templateExercisesList) return;

        if (this.templateExercises.length === 0) {
            templateExercisesList.innerHTML = `
                <div class="text-gray-400 text-center py-8">
                    No exercises added yet. Click "Add Exercise" to get started.
                </div>
            `;
        } else {
            templateExercisesList.innerHTML = this.templateExercises.map((exercise, index) => {
                // Add fallback values for exercises that might not have sets/reps configured
                const sets = exercise.sets || 3;
                const minReps = exercise.minReps || 8;
                const maxReps = exercise.maxReps || 12;
                
                const repRange = minReps === maxReps ? 
                    `${minReps} reps` : 
                    `${minReps}-${maxReps} reps`;
                
                return `
                    <div class="bg-gray-700 rounded-lg p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="font-medium text-sm">${exercise.name}</div>
                            <button class="text-red-400 hover:text-red-300 text-sm" onclick="window.templateCreation.removeTemplateExercise(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="text-xs text-gray-300">${exercise.muscle || 'Unknown muscle'}</div>
                        <div class="text-xs text-blue-400 mt-1">${sets} sets × ${repRange}</div>
                    </div>
                `;
            }).join('');
        }
    }

    removeTemplateExercise(index) {
        this.templateExercises.splice(index, 1);
        this.renderTemplateExercises();
    }

    openTemplateExerciseModal() {
        const templateExerciseModal = document.getElementById('templateExerciseModal');
        if (templateExerciseModal) {
            templateExerciseModal.style.display = 'flex';
            templateExerciseModal.classList.remove('hidden');
        }
        this.renderTemplateExerciseList();
    }

    closeTemplateExerciseModal() {
        const templateExerciseModal = document.getElementById('templateExerciseModal');
        if (templateExerciseModal) {
            templateExerciseModal.style.display = 'none';
            templateExerciseModal.classList.add('hidden');
        }
    }

    openExerciseConfigModal(exercise) {
        this.currentConfigExercise = exercise;
        const configExerciseName = document.getElementById('configExerciseName');
        const configSets = document.getElementById('configSets');
        const configMinReps = document.getElementById('configMinReps');
        const configMaxReps = document.getElementById('configMaxReps');
        
        if (configExerciseName) configExerciseName.textContent = exercise.name;
        if (configSets) configSets.value = 3;
        if (configMinReps) configMinReps.value = 8;
        if (configMaxReps) configMaxReps.value = 12;
        
        const templateExerciseConfigModal = document.getElementById('templateExerciseConfigModal');
        if (templateExerciseConfigModal) {
            templateExerciseConfigModal.style.display = 'flex';
            templateExerciseConfigModal.classList.remove('hidden');
        }
    }

    closeExerciseConfigModal() {
        const templateExerciseConfigModal = document.getElementById('templateExerciseConfigModal');
        if (templateExerciseConfigModal) {
            templateExerciseConfigModal.style.display = 'none';
            templateExerciseConfigModal.classList.add('hidden');
        }
        this.currentConfigExercise = null;
    }

    saveExerciseConfig() {
        if (!this.currentConfigExercise) return;
        
        const configSets = document.getElementById('configSets');
        const configMinReps = document.getElementById('configMinReps');
        const configMaxReps = document.getElementById('configMaxReps');
        
        const sets = parseInt(configSets.value);
        const minReps = parseInt(configMinReps.value);
        const maxReps = parseInt(configMaxReps.value);
        
        if (sets < 1 || minReps < 1 || maxReps < 1) {
            alert('Please enter valid numbers for sets and reps');
            return;
        }
        
        if (minReps > maxReps) {
            alert('Minimum reps cannot be greater than maximum reps');
            return;
        }

        const configuredExercise = {
            ...this.currentConfigExercise,
            sets: sets,
            minReps: minReps,
            maxReps: maxReps
        };

        if (!this.templateExercises.find(ex => ex.name === configuredExercise.name)) {
            this.templateExercises.push(configuredExercise);
            this.renderTemplateExercises();
        }
        
        this.closeExerciseConfigModal();
        this.closeTemplateExerciseModal();
    }

    renderTemplateExerciseList(searchTerm = '') {
        const templateExerciseList = document.getElementById('templateExerciseList');
        if (!templateExerciseList || !window.allExercises) return;

        const filteredExercises = window.allExercises.filter(ex => 
            ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        templateExerciseList.innerHTML = filteredExercises.map(exercise => `
            <div class="p-2 border rounded hover:bg-gray-100 cursor-pointer exercise-item" data-exercise="${JSON.stringify(exercise).replace(/"/g, '&quot;')}">
                <div class="font-medium">${exercise.name}</div>
                <div class="text-sm text-gray-600">${exercise.muscle || 'Unknown muscle'}</div>
            </div>
        `).join('');

        // Add click listeners to exercise items
        templateExerciseList.querySelectorAll('.exercise-item').forEach(item => {
            item.addEventListener('click', () => {
                const exercise = JSON.parse(item.dataset.exercise);
                if (!this.templateExercises.find(ex => ex.name === exercise.name)) {
                    this.openExerciseConfigModal(exercise);
                } else {
                    alert('This exercise is already in your template');
                }
            });
        });
    }

    saveTemplate() {
        const templateNameInput = document.getElementById('templateNameInput');
        const templateName = templateNameInput ? templateNameInput.value.trim() : '';
        
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        
        if (this.templateExercises.length === 0) {
            alert('Please add at least one exercise to the template');
            return;
        }

        const newTemplate = {
            name: templateName,
            exercises: this.templateExercises.map(ex => ({
                name: ex.name,
                muscle: ex.muscle,
                sets: ex.sets,
                minReps: ex.minReps,
                maxReps: ex.maxReps,
                weight: 0
            }))
        };

        // Save to localStorage
        let customTemplates = [];
        try {
            customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
        } catch (e) {
            customTemplates = [];
        }

        if (this.isEditingTemplate) {
            // Find and update the existing template
            const templateIndex = customTemplates.findIndex(t => t.name === this.originalTemplateName);
            if (templateIndex !== -1) {
                customTemplates[templateIndex] = newTemplate;
            } else {
                // If not found in custom templates, it might be a built-in template being "edited" as new
                if (customTemplates.find(t => t.name === templateName) || (window.templatePreview && window.templatePreview.allTemplates.find(t => t.name === templateName))) {
                    alert('A template with this name already exists');
                    return;
                }
                customTemplates.push(newTemplate);
            }
            
            // Reset editing state
            this.isEditingTemplate = false;
            this.originalTemplateName = '';
        } else {
            // Check if template name already exists for new templates
            if (customTemplates.find(t => t.name === templateName) || (window.templatePreview && window.templatePreview.allTemplates.find(t => t.name === templateName))) {
                alert('A template with this name already exists');
                return;
            }
            customTemplates.push(newTemplate);
        }

        localStorage.setItem('custom_templates', JSON.stringify(customTemplates));

        alert(this.isEditingTemplate ? 'Template updated successfully!' : 'Template saved successfully!');
        this.closeTemplateCreationModal();
        
        // Refresh the page to show the updated template
        window.location.reload();
    }

    editTemplate(template) {
        // Close the preview modal
        if (window.templatePreview) {
            window.templatePreview.closeTemplatePreviewModal();
        }
        
        // Populate the creation modal with existing template data
        const templateNameInput = document.getElementById('templateNameInput');
        if (templateNameInput) templateNameInput.value = template.name;
        
        this.templateExercises = template.exercises.map(ex => ({
            name: ex.name,
            muscle: ex.muscle,
            sets: ex.sets || 3,
            minReps: ex.minReps || 8,
            maxReps: ex.maxReps || 12
        }));
        
        this.renderTemplateExercises();
        
        // Open the creation modal
        const templateCreationModal = document.getElementById('templateCreationModal');
        if (templateCreationModal) {
            templateCreationModal.style.display = 'flex';
            templateCreationModal.classList.remove('hidden');
        }
        
        // Update the save function to handle editing
        this.isEditingTemplate = true;
        this.originalTemplateName = template.name;
    }

    initializeEventListeners() {
        // Event listeners for template creation
        const createTemplateBtn = document.getElementById('createTemplateBtn');
        const closeTemplateCreationModal = document.getElementById('closeTemplateCreationModal');
        const cancelTemplateCreation = document.getElementById('cancelTemplateCreation');
        const addExerciseToTemplate = document.getElementById('addExerciseToTemplate');
        const saveTemplate = document.getElementById('saveTemplate');
        const closeTemplateExerciseModal = document.getElementById('closeTemplateExerciseModal');
        const templateExerciseSearch = document.getElementById('templateExerciseSearch');
        
        // Exercise configuration modal event listeners
        const closeTemplateExerciseConfigModal = document.getElementById('closeTemplateExerciseConfigModal');
        const cancelExerciseConfig = document.getElementById('cancelExerciseConfig');
        const saveExerciseConfig = document.getElementById('saveExerciseConfig');

        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => this.openTemplateCreationModal());
        }
        
        if (closeTemplateCreationModal) {
            closeTemplateCreationModal.addEventListener('click', () => this.closeTemplateCreationModal());
        }
        
        if (cancelTemplateCreation) {
            cancelTemplateCreation.addEventListener('click', () => this.closeTemplateCreationModal());
        }
        
        if (addExerciseToTemplate) {
            addExerciseToTemplate.addEventListener('click', () => this.openTemplateExerciseModal());
        }
        
        if (saveTemplate) {
            saveTemplate.addEventListener('click', () => this.saveTemplate());
        }
        
        if (closeTemplateExerciseModal) {
            closeTemplateExerciseModal.addEventListener('click', () => this.closeTemplateExerciseModal());
        }
        
        if (templateExerciseSearch) {
            templateExerciseSearch.addEventListener('input', (e) => {
                this.renderTemplateExerciseList(e.target.value);
            });
        }

        if (closeTemplateExerciseConfigModal) {
            closeTemplateExerciseConfigModal.addEventListener('click', () => this.closeExerciseConfigModal());
        }
        
        if (cancelExerciseConfig) {
            cancelExerciseConfig.addEventListener('click', () => this.closeExerciseConfigModal());
        }
        
        if (saveExerciseConfig) {
            saveExerciseConfig.addEventListener('click', () => this.saveExerciseConfig());
        }

        // Routine creation placeholder
        const createRoutineBtn = document.getElementById('createRoutineBtn');
        if (createRoutineBtn) {
            createRoutineBtn.addEventListener('click', () => {
                // Placeholder function - doesn't do anything yet
                console.log('Routine button clicked - functionality to be implemented');
            });
        }
    }
}

// Export for use in other modules
window.TemplateCreation = TemplateCreation;