// --- Initialization on DOMContentLoaded ---

document.addEventListener('DOMContentLoaded', function() {
    attachDrawerEvents();
    setupButtonHandlers();
    startAutoSave(); // Start auto-saving
    restoreWorkoutState(); // Attempt to restore workout state on load

    // Template Preview Modal functionality
    let currentPreviewTemplate = null;
    let allTemplates = []; // Move this to a broader scope

    function openTemplatePreviewModal(template) {
        console.log('Opening template preview for:', template.name);
        currentPreviewTemplate = template;
        const modal = document.getElementById('templatePreviewModal');
        const title = document.getElementById('templatePreviewTitle');
        const summary = document.getElementById('templatePreviewSummary');
        const exercisesList = document.getElementById('templatePreviewExercises');
        
        console.log('Modal element found:', !!modal);
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
        console.log('Before showing modal - classes:', modal.className);
        console.log('Before showing modal - display:', modal.style.display);
        
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        
        console.log('After showing modal - classes:', modal.className);
        console.log('After showing modal - display:', modal.style.display);
        console.log('Modal should now be visible!');
    }

    function closeTemplatePreviewModal() {
        const modal = document.getElementById('templatePreviewModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
        
        currentPreviewTemplate = null;
    }

    // Set up modal event listeners immediately
    const closeBtn = document.getElementById('closeTemplatePreviewModal');
    const cancelBtn = document.getElementById('cancelTemplatePreview');
    const startBtn = document.getElementById('startTemplateFromPreview');
    const modal = document.getElementById('templatePreviewModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeTemplatePreviewModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeTemplatePreviewModal);
    }
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (currentPreviewTemplate) {
                window.allTemplates = allTemplates;
                startWorkoutFromTemplate(currentPreviewTemplate);
                closeTemplatePreviewModal();
            }
        });
    }
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'templatePreviewModal') {
                closeTemplatePreviewModal();
            }
        });
    }

    // Close modal with Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeTemplatePreviewModal();
        }
    });

    // Load exercises.json
    fetch('exercises.json')
        .then(res => res.json())
        .then(data => {
            let customExercises = [];
            try {
                customExercises = JSON.parse(localStorage.getItem('customExercises')) || [];
            } catch (e) {}
            allExercises = data.concat(customExercises).sort((a, b) => a.name.localeCompare(b.name));
            // Wire up the Add Exercises button in the drawer ONLY after allExercises is ready
            const addExercisesBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Add Exercises');
            if (addExercisesBtn) {
                addExercisesBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    openExerciseModal();
                });
            }
        });

    // Event listeners for exercise menu buttons
    document.body.addEventListener('click', function(e) {
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

    document.body.addEventListener('click', function(e) {
        // Handler for Remove
        const removeBtn = e.target.closest('.remove-ex-btn');
        if (removeBtn) {
            e.stopPropagation();
            const idx = +removeBtn.dataset.idx;
            workoutExercises.splice(idx, 1);
            renderWorkoutExercises();
            saveWorkoutState();
        }

        // Handler for Replace
        const replaceBtn = e.target.closest('.replace-ex-btn');
        if (replaceBtn) {
            e.stopPropagation();
            const idx = +replaceBtn.dataset.idx;
            openReplaceExerciseModal(idx);
        }

        // Handler for Edit (placeholder, implement as needed)
        const editBtn = e.target.closest('.edit-ex-btn');
        if (editBtn) {
            e.stopPropagation();
            const idx = +editBtn.dataset.idx;
            alert(`Edit exercise at index: ${idx} (functionality to be implemented)`);
        }
    });

    // Load templates from templates.json AND custom_templates from localStorage
    Promise.all([
        fetch('templates.json').then(res => res.json()).catch(() => ({templates:[],routines:[]})),
        Promise.resolve(JSON.parse(localStorage.getItem('custom_templates') || '[]'))
    ]).then(([data, customTemplates]) => {
        const routinesList = document.getElementById('routines-list');
        const templateList = document.getElementById('template-list');
        const templates = Array.isArray(data) ? data : (data.templates || []);
        const routines = Array.isArray(data) ? [] : (data.routines || []);
        // Merge built-in and custom templates
        allTemplates = templates.concat(customTemplates);

        const templatesInRoutines = new Set();
        routines.forEach(routine => {
            routine.templates.forEach(templateName => {
                templatesInRoutines.add(templateName);
            });
        });

        // Render Routines (folders)
        if (routinesList) {
            routines.forEach(routine => {
                const routineEl = document.createElement('div');
                routineEl.className = 'bg-gray-800 rounded-2xl shadow-lg p-5 text-white flex flex-col gap-3 cursor-pointer border border-gray-700 hover:shadow-xl transition-all';
                routineEl.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="font-semibold text-base"><i class="fas fa-folder mr-2 text-yellow-400"></i>${routine.name}</div>
                        <i class="fas fa-chevron-down transition-transform"></i>
                    </div>
                    <div class="routine-templates hidden pl-2 pt-2 border-l-2 border-gray-600 ml-2 space-y-2">
                        ${routine.templates.map(tplName => {
                            const template = allTemplates.find(t => t.name === tplName);
                            if (!template) return `<div class="text-gray-400 p-2">Template \"${tplName}\" not found</div>`;
                            const exerciseCount = template.exercises ? template.exercises.length : 0;
                            return `
                                <div class="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer template-item" data-template="${tplName}">
                                    <div class="font-medium text-sm">${tplName}</div>
                                    <div class="text-xs text-gray-300 mt-1">${exerciseCount} exercises</div>
                                    <div class="text-xs text-blue-400 mt-2 italic">Tap to preview</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                const header = routineEl.querySelector('.flex.justify-between');
                header.onclick = (e) => {
                    const templatesDiv = routineEl.querySelector('.routine-templates');
                    const chevron = routineEl.querySelector('.fa-chevron-down, .fa-chevron-up');
                    templatesDiv.classList.toggle('hidden');
                    chevron.classList.toggle('fa-chevron-down');
                    chevron.classList.toggle('fa-chevron-up');
                };
                routineEl.addEventListener('click', (e) => {
                    if (e.target.closest('.template-item')) {
                        // Show preview when clicking anywhere on template
                        e.stopPropagation();
                        const templateName = e.target.closest('.template-item').dataset.template;
                        const template = allTemplates.find(t => t.name === templateName);
                        if (template) {
                            console.log('Template clicked, opening preview:', template.name);
                            openTemplatePreviewModal(template);
                        }
                    }
                });
                routinesList.appendChild(routineEl);
            });
        }

        // Render Individual Templates in 2-column grid (only templates NOT in routines)
        if (templateList) {
            // Clear any existing content first
            templateList.innerHTML = '';
            
            const standaloneTemplates = allTemplates.filter(tpl => !templatesInRoutines.has(tpl.name));
            standaloneTemplates.forEach((tpl) => {
                const exerciseCount = tpl.exercises ? tpl.exercises.length : 0;
                const card = document.createElement('div');
                card.className = 'bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer template-item';
                card.innerHTML = `
                    <div class="font-medium text-sm template-name">${tpl.name}</div>
                    <div class="text-xs text-gray-300 mt-1 template-count">${exerciseCount} exercises</div>
                    <div class="text-xs text-blue-400 mt-2 italic">Tap to preview</div>
                `;
                
                // Make entire card clickable to open preview
                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Standalone template clicked:', tpl.name);
                    openTemplatePreviewModal(tpl);
                });
                
                templateList.appendChild(card);
            });
        }

    }).catch(error => {
        console.error('Error loading templates:', error);
        const templateList = document.getElementById('template-list');
        if (templateList) {
            templateList.innerHTML = '<div class="text-red-400 text-center col-span-2">Error loading templates.</div>';
        }
    });

    // Template Creation Modal functionality
    let templateExercises = [];
    let currentConfigExercise = null;
    
    const createTemplateBtn = document.getElementById('createTemplateBtn');
    const templateCreationModal = document.getElementById('templateCreationModal');
    const closeTemplateCreationModal = document.getElementById('closeTemplateCreationModal');
    const cancelTemplateCreation = document.getElementById('cancelTemplateCreation');
    const templateNameInput = document.getElementById('templateNameInput');
    const addExerciseToTemplate = document.getElementById('addExerciseToTemplate');
    const saveTemplate = document.getElementById('saveTemplate');
    const templateExercisesList = document.getElementById('templateExercisesList');
    
    const templateExerciseModal = document.getElementById('templateExerciseModal');
    const closeTemplateExerciseModal = document.getElementById('closeTemplateExerciseModal');
    const templateExerciseSearch = document.getElementById('templateExerciseSearch');
    const templateExerciseList = document.getElementById('templateExerciseList');

    // Exercise configuration modal elements
    const templateExerciseConfigModal = document.getElementById('templateExerciseConfigModal');
    const closeTemplateExerciseConfigModal = document.getElementById('closeTemplateExerciseConfigModal');
    const cancelExerciseConfig = document.getElementById('cancelExerciseConfig');
    const saveExerciseConfig = document.getElementById('saveExerciseConfig');
    const configExerciseName = document.getElementById('configExerciseName');
    const configSets = document.getElementById('configSets');
    const configMinReps = document.getElementById('configMinReps');
    const configMaxReps = document.getElementById('configMaxReps');

    // Template deletion
    const deleteTemplateBtn = document.getElementById('deleteTemplateBtn');

    function openTemplateCreationModal() {
        templateExercises = [];
        templateNameInput.value = '';
        renderTemplateExercises();
        templateCreationModal.style.display = 'flex';
        templateCreationModal.classList.remove('hidden');
    }

    function closeTemplateCreationModalFunc() {
        templateCreationModal.style.display = 'none';
        templateCreationModal.classList.add('hidden');
        templateExercises = [];
    }

    function renderTemplateExercises() {
        if (templateExercises.length === 0) {
            templateExercisesList.innerHTML = `
                <div class="text-gray-400 text-center py-8">
                    No exercises added yet. Click "Add Exercise" to get started.
                </div>
            `;
        } else {
            templateExercisesList.innerHTML = templateExercises.map((exercise, index) => {
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
                            <button class="text-red-400 hover:text-red-300 text-sm" onclick="removeTemplateExercise(${index})">
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

    function removeTemplateExercise(index) {
        templateExercises.splice(index, 1);
        renderTemplateExercises();
    }

    function openTemplateExerciseModal() {
        templateExerciseModal.style.display = 'flex';
        templateExerciseModal.classList.remove('hidden');
        renderTemplateExerciseList();
    }

    function closeTemplateExerciseModalFunc() {
        templateExerciseModal.style.display = 'none';
        templateExerciseModal.classList.add('hidden');
    }

    function openExerciseConfigModal(exercise) {
        currentConfigExercise = exercise;
        configExerciseName.textContent = exercise.name;
        configSets.value = 3;
        configMinReps.value = 8;
        configMaxReps.value = 12;
        
        templateExerciseConfigModal.style.display = 'flex';
        templateExerciseConfigModal.classList.remove('hidden');
    }

    function closeExerciseConfigModalFunc() {
        templateExerciseConfigModal.style.display = 'none';
        templateExerciseConfigModal.classList.add('hidden');
        currentConfigExercise = null;
    }

    function saveExerciseConfigFunc() {
        if (!currentConfigExercise) return;
        
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
            ...currentConfigExercise,
            sets: sets,
            minReps: minReps,
            maxReps: maxReps
        };

        if (!templateExercises.find(ex => ex.name === configuredExercise.name)) {
            templateExercises.push(configuredExercise);
            renderTemplateExercises();
        }
        
        closeExerciseConfigModalFunc();
        closeTemplateExerciseModalFunc();
    }

    function renderTemplateExerciseList(searchTerm = '') {
        const filteredExercises = allExercises.filter(ex => 
            ex.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        templateExerciseList.innerHTML = filteredExercises.map(exercise => `
            <div class="p-2 border rounded hover:bg-gray-100 cursor-pointer exercise-item" data-exercise='${JSON.stringify(exercise)}'>
                <div class="font-medium">${exercise.name}</div>
                <div class="text-sm text-gray-600">${exercise.muscle || 'Unknown muscle'}</div>
            </div>
        `).join('');

        // Add click listeners to exercise items
        templateExerciseList.querySelectorAll('.exercise-item').forEach(item => {
            item.addEventListener('click', () => {
                const exercise = JSON.parse(item.dataset.exercise);
                if (!templateExercises.find(ex => ex.name === exercise.name)) {
                    openExerciseConfigModal(exercise);
                } else {
                    alert('This exercise is already in your template');
                }
            });
        });
    }

    function saveTemplateFunc() {
        const templateName = templateNameInput.value.trim();
        
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        
        if (templateExercises.length === 0) {
            alert('Please add at least one exercise to the template');
            return;
        }

        const newTemplate = {
            name: templateName,
            exercises: templateExercises.map(ex => ({
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

        // Check if template name already exists
        if (customTemplates.find(t => t.name === templateName) || allTemplates.find(t => t.name === templateName)) {
            alert('A template with this name already exists');
            return;
        }

        customTemplates.push(newTemplate);
        localStorage.setItem('custom_templates', JSON.stringify(customTemplates));

        alert('Template saved successfully!');
        closeTemplateCreationModalFunc();
        
        // Refresh the page to show the new template
        window.location.reload();
    }

    function deleteTemplate(templateName) {
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
        closeTemplatePreviewModal();
        
        // Refresh the page to update the template list
        window.location.reload();
    }

    // Event listeners for template creation
    if (createTemplateBtn) {
        createTemplateBtn.addEventListener('click', openTemplateCreationModal);
    }
    
    if (closeTemplateCreationModal) {
        closeTemplateCreationModal.addEventListener('click', closeTemplateCreationModalFunc);
    }
    
    if (cancelTemplateCreation) {
        cancelTemplateCreation.addEventListener('click', closeTemplateCreationModalFunc);
    }
    
    if (addExerciseToTemplate) {
        addExerciseToTemplate.addEventListener('click', openTemplateExerciseModal);
    }
    
    if (saveTemplate) {
        saveTemplate.addEventListener('click', saveTemplateFunc);
    }
    
    if (closeTemplateExerciseModal) {
        closeTemplateExerciseModal.addEventListener('click', closeTemplateExerciseModalFunc);
    }
    
    if (templateExerciseSearch) {
        templateExerciseSearch.addEventListener('input', (e) => {
            renderTemplateExerciseList(e.target.value);
        });
    }

    // Exercise configuration modal event listeners
    if (closeTemplateExerciseConfigModal) {
        closeTemplateExerciseConfigModal.addEventListener('click', closeExerciseConfigModalFunc);
    }
    
    if (cancelExerciseConfig) {
        cancelExerciseConfig.addEventListener('click', closeExerciseConfigModalFunc);
    }
    
    if (saveExerciseConfig) {
        saveExerciseConfig.addEventListener('click', saveExerciseConfigFunc);
    }

    // Template deletion event listener
    // Template edit dropdown functionality
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
            if (currentPreviewTemplate) {
                editTemplate(currentPreviewTemplate);
            }
            editTemplateDropdown.classList.add('hidden');
        });
    }

    // Delete template functionality
    if (deleteTemplateOption) {
        deleteTemplateOption.addEventListener('click', () => {
            if (currentPreviewTemplate) {
                deleteTemplate(currentPreviewTemplate.name);
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

    // Edit template function
    function editTemplate(template) {
        // Close the preview modal
        closeTemplatePreviewModal();
        
        // Populate the creation modal with existing template data
        templateNameInput.value = template.name;
        templateExercises = template.exercises.map(ex => ({
            name: ex.name,
            muscle: ex.muscle,
            sets: ex.sets || 3,
            minReps: ex.minReps || 8,
            maxReps: ex.maxReps || 12
        }));
        
        renderTemplateExercises();
        
        // Open the creation modal
        templateCreationModal.style.display = 'flex';
        templateCreationModal.classList.remove('hidden');
        
        // Update the save function to handle editing
        isEditingTemplate = true;
        originalTemplateName = template.name;
    }

    // Add variables to track editing state
    let isEditingTemplate = false;
    let originalTemplateName = '';

    // Update the save template function to handle editing
    function saveTemplateFunc() {
        const templateName = templateNameInput.value.trim();
        
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        
        if (templateExercises.length === 0) {
            alert('Please add at least one exercise to the template');
            return;
        }

        const newTemplate = {
            name: templateName,
            exercises: templateExercises.map(ex => ({
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

        if (isEditingTemplate) {
            // Find and update the existing template
            const templateIndex = customTemplates.findIndex(t => t.name === originalTemplateName);
            if (templateIndex !== -1) {
                customTemplates[templateIndex] = newTemplate;
            } else {
                // If not found in custom templates, it might be a built-in template being "edited" as new
                if (customTemplates.find(t => t.name === templateName) || allTemplates.find(t => t.name === templateName)) {
                    alert('A template with this name already exists');
                    return;
                }
                customTemplates.push(newTemplate);
            }
            
            // Reset editing state
            isEditingTemplate = false;
            originalTemplateName = '';
        } else {
            // Check if template name already exists for new templates
            if (customTemplates.find(t => t.name === templateName) || allTemplates.find(t => t.name === templateName)) {
                alert('A template with this name already exists');
                return;
            }
            customTemplates.push(newTemplate);
        }

        localStorage.setItem('custom_templates', JSON.stringify(customTemplates));

        alert(isEditingTemplate ? 'Template updated successfully!' : 'Template saved successfully!');
        closeTemplateCreationModalFunc();
        
        // Refresh the page to show the updated template
        window.location.reload();
    }

    // Update the close template creation modal function to reset editing state
    function closeTemplateCreationModalFunc() {
        templateCreationModal.style.display = 'none';
        templateCreationModal.classList.add('hidden');
        templateExercises = [];
        isEditingTemplate = false;
        originalTemplateName = '';
    }

    // Remove the old event listeners and update them
    // Template deletion event listener (remove this)
    // if (deleteTemplateBtn) {
    //     deleteTemplateBtn.addEventListener('click', () => {
    //         if (currentPreviewTemplate) {
    //             deleteTemplate(currentPreviewTemplate.name);
    //         }
    //     });
    // }

    // Cancel template preview event listener (remove this)
    // if (cancelBtn) {
    //     cancelBtn.addEventListener('click', closeTemplatePreviewModal);
    // }
});