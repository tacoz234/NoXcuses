// Template and Routine Loading functionality
class TemplateLoading {
    constructor(templatePreview) {
        this.templatePreview = templatePreview;
        this.allTemplates = [];
    }

    async loadTemplatesAndRoutines() {
        try {
            const [data, customTemplates] = await Promise.all([
                fetch('templates.json').then(res => res.json()).catch(() => ({templates:[],routines:[]})),
                Promise.resolve(JSON.parse(localStorage.getItem('custom_templates') || '[]'))
            ]);

            const routinesList = document.getElementById('routines-list');
            const templateList = document.getElementById('template-list');
            const templates = Array.isArray(data) ? data : (data.templates || []);
            const routines = Array.isArray(data) ? [] : (data.routines || []);
            
            // Merge built-in and custom templates
            this.allTemplates = templates.concat(customTemplates);
            
            // Update template preview with all templates
            if (this.templatePreview) {
                this.templatePreview.setAllTemplates(this.allTemplates);
            }

            const templatesInRoutines = new Set();
            routines.forEach(routine => {
                routine.templates.forEach(templateName => {
                    templatesInRoutines.add(templateName);
                });
            });

            // Render Routines (folders)
            this.renderRoutines(routinesList, routines);
            
            // Render Individual Templates in 2-column grid (only templates NOT in routines)
            this.renderStandaloneTemplates(templateList, templatesInRoutines);

        } catch (error) {
            console.error('Error loading templates:', error);
            const templateList = document.getElementById('template-list');
            if (templateList) {
                templateList.innerHTML = '<div class="text-red-400 text-center col-span-2">Error loading templates.</div>';
            }
        }
    }

    renderRoutines(routinesList, routines) {
        if (!routinesList) return;

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
                        const template = this.allTemplates.find(t => t.name === tplName);
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
                    const template = this.allTemplates.find(t => t.name === templateName);
                    if (template && this.templatePreview) {
                        this.templatePreview.openTemplatePreviewModal(template);
                    }
                }
            });
            
            routinesList.appendChild(routineEl);
        });
    }

    renderStandaloneTemplates(templateList, templatesInRoutines) {
        if (!templateList) return;

        // Clear any existing content first
        templateList.innerHTML = '';
        
        const standaloneTemplates = this.allTemplates.filter(tpl => !templatesInRoutines.has(tpl.name));
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
                if (this.templatePreview) {
                    this.templatePreview.openTemplatePreviewModal(tpl);
                }
            });
            
            templateList.appendChild(card);
        });
    }

    getAllTemplates() {
        return this.allTemplates;
    }
}

// Export for use in other modules
window.TemplateLoading = TemplateLoading;