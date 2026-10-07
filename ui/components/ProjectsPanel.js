/**
 * Projects Panel UI Component
 * Displays and manages nation projects (advanced facilities)
 */

class ProjectsPanel {
    constructor() {
        this.isVisible = false;
        this.projects = {};
        this.bindEvents();
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('show_projects_panel', this.show, this);
        EventBus.on('hide_projects_panel', this.hide, this);
        EventBus.on('project_built', this.onProjectBuilt, this);
        EventBus.on('project_demolished', this.onProjectDemolished, this);
        EventBus.on('resources_updated', this.updateAffordability, this);
    }
    
    /**
     * Show the projects panel
     */
    show() {
        if (!window.Nation || !window.GameEngine?.systems?.projects) {
            console.warn('Nation or Projects System not available');
            return;
        }
        
        this.projects = window.GameEngine.systems.projects.getNationProjects(window.Nation);
        this.render();
        this.isVisible = true;
    }
    
    /**
     * Hide the projects panel
     */
    hide() {
        const modal = document.getElementById('projects-modal');
        if (modal) {
            modal.remove();
        }
        this.isVisible = false;
    }
    
    /**
     * Render the projects panel
     */
    render() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        
        const modal = Modal.create({
            id: 'projects-modal',
            title: 'Advanced Nation Projects',
            content: this.generateContent(),
            size: 'large',
            showCloseButton: true
        });
        
        modalContainer.appendChild(modal);
        this.attachEventListeners();
    }
    
    /**
     * Generate the panel content
     */
    generateContent() {
        const categories = {
            'military': { name: 'Military & Defense', icon: '🚀', projects: [] },
            'economic': { name: 'Economic & Trade', icon: '💼', projects: [] },
            'education': { name: 'Education & Research', icon: '🎓', projects: [] },
            'healthcare': { name: 'Healthcare & Emergency', icon: '🏥', projects: [] },
            'diplomacy': { name: 'Diplomatic Relations', icon: '🤝', projects: [] }
        };
        
        // Categorize projects
        Object.entries(this.projects).forEach(([key, project]) => {
            const category = project.category || 'military';
            if (categories[category]) {
                categories[category].projects.push({ key, ...project });
            }
        });
        
        let content = '<div class="projects-panel">';
        content += this.generateProjectOverview();
        content += '<div class="projects-grid">';
        
        Object.entries(categories).forEach(([catKey, category]) => {
            if (category.projects.length > 0) {
                content += this.generateCategorySection(category);
            }
        });
        
        content += '</div></div>';
        return content;
    }
    
    /**
     * Generate project overview with military status
     */
    generateProjectOverview() {
        const nation = window.Nation;
        
        return `
            <div class="projects-overview">
                <h3>🏗️ Advanced Projects Status</h3>
                <div class="project-stats-grid">
                    <div class="project-stat-card">
                        <h4>🚀 Military Capabilities</h4>
                        <div class="stat-row">
                            <span>Missile Capacity:</span>
                            <span>${nation.projectEffects?.missileCapacity || 0} missiles</span>
                        </div>
                        <div class="stat-row">
                            <span>Current Missiles:</span>
                            <span>${nation.military?.missiles || 0}</span>
                        </div>
                        <div class="stat-row">
                            <span>Missile Defense:</span>
                            <span>${Math.round((nation.projectEffects?.missileInterception || 0) * 100)}% interception</span>
                        </div>
                        <div class="stat-row">
                            <span>War Slots:</span>
                            <span>${nation.projectEffects?.offensiveWarSlots || 2} offensive / ${nation.projectEffects?.defensiveWarSlots || 2} defensive</span>
                        </div>
                    </div>
                    
                    <div class="project-stat-card">
                        <h4>📚 Education & Research</h4>
                        <div class="stat-row">
                            <span>Tech Cost Reduction:</span>
                            <span>${Math.round((nation.projectEffects?.techCostReduction || 0) * 100)}%</span>
                        </div>
                        <div class="stat-row">
                            <span>University Literacy Bonus:</span>
                            <span>+${Math.round((nation.projectEffects?.universityLiteracyBonus || 0) * 100)}%</span>
                        </div>
                        <div class="stat-row">
                            <span>University Happiness:</span>
                            <span>+${nation.projectEffects?.universityHappinessBonus || 0}</span>
                        </div>
                    </div>
                    
                    <div class="project-stat-card">
                        <h4>🏥 Health & Emergency</h4>
                        <div class="stat-row">
                            <span>Ambulance Disease Reduction:</span>
                            <span>${Math.round((nation.projectEffects?.ambulanceDiseaseReduction || 0) * 100)}%</span>
                        </div>
                        <div class="stat-row">
                            <span>Ambulance Happiness:</span>
                            <span>+${nation.projectEffects?.ambulanceHappinessBonus || 0}</span>
                        </div>
                    </div>
                    
                    <div class="project-stat-card">
                        <h4>🤝 Diplomatic Status</h4>
                        <div class="stat-row">
                            <span>Permanent Trade:</span>
                            <span>${nation.projectEffects?.permanentTrades ? '✅ Enabled' : '❌ Limited Time'}</span>
                        </div>
                        <div class="stat-row">
                            <span>Changeable Relations:</span>
                            <span>${nation.projectEffects?.changeableRelationships ? '✅ Enabled' : '❌ Fixed'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate category section
     */
    generateCategorySection(category) {
        let section = `
            <div class="project-category">
                <h4>${category.icon} ${category.name}</h4>
        `;
        
        category.projects.forEach(project => {
            section += this.generateProjectItem(project);
        });
        
        section += '</div>';
        return section;
    }
    
    /**
     * Generate individual project item
     */
    generateProjectItem(project) {
        const isMaxed = project.count >= project.maxCount;
        const canAfford = project.canAfford;
        const meetsTech = project.meetsTechRequirement;
        const meetsBonus = project.meetsBonusRequirement;
        const canBuild = canAfford && meetsTech && meetsBonus && !isMaxed;
        
        const costText = this.formatCost(project.cost);
        
        let itemClass = 'project-item';
        if (isMaxed) itemClass += ' maxed';
        if (!canBuild && !isMaxed) itemClass += ' cant-build';
        
        let buttonText = 'Build Project';
        let buttonClass = 'build-project-btn';
        let buttonDisabled = '';
        
        if (isMaxed) {
            buttonText = 'Maximum Built';
            buttonClass += ' maxed';
            buttonDisabled = 'disabled';
        } else if (!meetsTech) {
            buttonText = `Requires ${project.techRequired} Technology`;
            buttonDisabled = 'disabled';
        } else if (!meetsBonus && project.bonusRequirement) {
            buttonText = `Requires ${project.bonusRequirement} Bonus`;
            buttonDisabled = 'disabled';
        } else if (!canAfford) {
            buttonText = 'Cannot Afford';
            buttonDisabled = 'disabled';
        }
        
        return `
            <div class="${itemClass}">
                <div class="project-header">
                    <span class="project-name">${project.name}</span>
                    <span class="project-count">${project.count}/${project.maxCount}</span>
                </div>
                <div class="project-description">${project.description}</div>
                <div class="project-requirements">
                    <div class="tech-req ${meetsTech ? 'met' : 'not-met'}">
                        🔬 Tech Required: ${project.techRequired} ${meetsTech ? '✓' : '✗'}
                    </div>
                    ${project.bonusRequirement ? 
                        `<div class="bonus-req ${meetsBonus ? 'met' : 'not-met'}">
                            ⭐ Bonus Required: ${project.bonusRequirement} ${meetsBonus ? '✓' : '✗'}
                        </div>` : ''}
                </div>
                <div class="project-cost">Cost: ${costText}</div>
                <div class="project-effect">${project.effect}</div>
                ${project.special ? `<div class="project-special">💫 ${project.special}</div>` : ''}
                <button class="${buttonClass}" 
                        data-project="${project.key}" 
                        ${buttonDisabled}>${buttonText}</button>
                ${project.count > 0 ? `<button class="demolish-project-btn" data-demolish="${project.key}">Demolish</button>` : ''}
            </div>
        `;
    }
    
    /**
     * Format project cost
     */
    formatCost(cost) {
        return Object.entries(cost).map(([resource, amount]) => {
            if (resource === 'money') {
                return `$${amount.toLocaleString()}`;
            } else {
                return `${amount} ${resource}`;
            }
        }).join(', ');
    }
    
    /**
     * Attach event listeners to the modal
     */
    attachEventListeners() {
        const modal = document.getElementById('projects-modal');
        if (!modal) return;
        
        // Build project buttons
        modal.querySelectorAll('.build-project-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectType = e.target.dataset.project;
                this.buildProject(projectType);
            });
        });
        
        // Demolish project buttons
        modal.querySelectorAll('.demolish-project-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectType = e.target.dataset.demolish;
                this.demolishProject(projectType);
            });
        });
    }
    
    /**
     * Build a project
     */
    buildProject(projectType) {
        if (!window.Nation || !window.GameEngine?.systems?.projects) return;
        
        EventBus.emit('build_project', {
            projectType: projectType,
            nation: window.Nation
        });
    }
    
    /**
     * Demolish a project
     */
    demolishProject(projectType) {
        if (!window.Nation || !window.GameEngine?.systems?.projects) return;
        
        if (confirm(`Are you sure you want to demolish a ${this.projects[projectType]?.name}? This is a major project!`)) {
            EventBus.emit('demolish_project', {
                projectType: projectType,
                nation: window.Nation
            });
        }
    }
    
    /**
     * Handle project built event
     */
    onProjectBuilt(data) {
        if (this.isVisible) {
            // Refresh the panel to show updated counts and affordability
            this.show();
        }
    }
    
    /**
     * Handle project demolished event
     */
    onProjectDemolished(data) {
        if (this.isVisible) {
            // Refresh the panel to show updated counts
            this.show();
        }
    }
    
    /**
     * Update affordability when resources change
     */
    updateAffordability(data) {
        if (this.isVisible) {
            // Update button states without full refresh
            this.projects = window.GameEngine.systems.projects.getNationProjects(window.Nation);
            this.updateButtonStates();
        }
    }
    
    /**
     * Update button states based on current affordability and requirements
     */
    updateButtonStates() {
        const modal = document.getElementById('projects-modal');
        if (!modal) return;
        
        modal.querySelectorAll('.build-project-btn').forEach(btn => {
            const projectType = btn.dataset.project;
            const project = this.projects[projectType];
            
            if (project) {
                const isMaxed = project.count >= project.maxCount;
                const canAfford = project.canAfford;
                const meetsTech = project.meetsTechRequirement;
                const meetsBonus = project.meetsBonusRequirement;
                
                if (isMaxed) {
                    btn.textContent = 'Maximum Built';
                    btn.disabled = true;
                    btn.className = 'build-project-btn maxed';
                } else if (!meetsTech) {
                    btn.textContent = `Requires ${project.techRequired} Technology`;
                    btn.disabled = true;
                    btn.className = 'build-project-btn';
                } else if (!meetsBonus && project.bonusRequirement) {
                    btn.textContent = `Requires ${project.bonusRequirement} Bonus`;
                    btn.disabled = true;
                    btn.className = 'build-project-btn';
                } else if (!canAfford) {
                    btn.textContent = 'Cannot Afford';
                    btn.disabled = true;
                    btn.className = 'build-project-btn';
                } else {
                    btn.textContent = 'Build Project';
                    btn.disabled = false;
                    btn.className = 'build-project-btn';
                }
            }
        });
    }
    
    /**
     * Destroy the panel
     */
    destroy() {
        EventBus.off('show_projects_panel', this.show, this);
        EventBus.off('hide_projects_panel', this.hide, this);
        EventBus.off('project_built', this.onProjectBuilt, this);
        EventBus.off('project_demolished', this.onProjectDemolished, this);
        EventBus.off('resources_updated', this.updateAffordability, this);
        
        this.hide();
    }
}

// Initialize projects panel when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ProjectsPanel = new ProjectsPanel();
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectsPanel;
} else {
    window.ProjectsPanel = ProjectsPanel;
}