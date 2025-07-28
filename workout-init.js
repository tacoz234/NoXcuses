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
                    
                    const sets = exercise.working_sets || 'N/A';
                    const reps = exercise.reps || 'N/A';
                    const rest = exercise.rest || 'N/A';
                    
                    exerciseDiv.innerHTML = `
                        <div class="font-medium text-white mb-2">${exercise.name}</div>
                        <div class="text-sm text-gray-300 space-y-1">
                            <div><span class="text-gray-400">Sets:</span> ${sets}</div>
                            <div><span class="text-gray-400">Reps:</span> ${reps}</div>
                            <div><span class="text-gray-400">Rest:</span> ${rest}</div>
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
            // After rendering routines:
            let routinelessContainer = document.getElementById('routineless-templates');
            if (!routinelessContainer) {
                routinelessContainer = document.createElement('div');
                routinelessContainer.id = 'routineless-templates';
                routinelessContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'; // Make it visible and styled
                templateList.appendChild(routinelessContainer);
            }
            
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
                
                routinelessContainer.appendChild(card);
            });
        }

    }).catch(error => {
        console.error('Error loading templates:', error);
        const templateList = document.getElementById('template-list');
        if (templateList) {
            templateList.innerHTML = '<div class="text-red-400 text-center col-span-2">Error loading templates.</div>';
        }
    });
});