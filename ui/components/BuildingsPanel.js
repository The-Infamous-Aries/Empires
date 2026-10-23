/**
 * Buildings Panel - Empire Builder
 * Unified interface for managing Improvements, Projects, and Wonders
 */

class BuildingsPanel {
    constructor() {
        this.isVisible = false;
        this.currentTab = 'improvements';
        this.buildingData = {
            improvements: {},
            projects: {},
            wonders: {},
            requirements: {}
        };
        
        this.bindEvents();
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('show_buildings_interface', this.show, this);
        EventBus.on('building_requirements_updated', this.updateRequirements, this);
        EventBus.on('building_error', this.showBuildingError, this);
        EventBus.on('improvement_built', this.refreshBuildings, this);
        EventBus.on('project_built', this.refreshBuildings, this);
        EventBus.on('wonder_built', this.refreshBuildings, this);
        EventBus.on('improvement_demolished', this.refreshBuildings, this);
        EventBus.on('project_demolished', this.refreshBuildings, this);
        EventBus.on('wonder_demolished', this.refreshBuildings, this);
    }
    
    /**
     * Show the buildings panel
     */
    show(data) {
        this.buildingData = data;
        this.isVisible = true;
        
        this.createInterface();
        this.updateContent();
    }
    
    /**
     * Hide the buildings panel
     */
    hide() {
        this.isVisible = false;
        const panel = document.getElementById('buildings-panel');
        if (panel) {
            panel.remove();
        }
    }
    
    /**
     * Create the main interface
     */
    createInterface() {
        // Remove existing panel
        this.hide();
        
        const panel = document.createElement('div');
        panel.id = 'buildings-panel';
        panel.className = 'modal-overlay';
        panel.innerHTML = this.getInterfaceHTML();
        
        document.body.appendChild(panel);
        
        // Bind interface events
        this.bindInterfaceEvents();
    }
    
    /**
     * Get the main interface HTML
     */
    getInterfaceHTML() {
        const { requirements } = this.buildingData;
        
        return `
            <div class="modal-content buildings-modal">
                <div class="modal-header">
                    <h2>🏗️ Buildings Management</h2>
                    <button class="modal-close" id="close-buildings">×</button>
                </div>
                
                <div class="buildings-info-bar">
                    <div class="territory-info">
                        <span class="info-label">🗺️ Territory:</span>
                        <span class="info-value">${requirements.territoryCount || 0} squares</span>
                    </div>
                    <div class="improvement-slots">
                        <span class="info-label">🏠 Improvement Slots:</span>
                        <span class="info-value">${requirements.improvements?.used || 0}/${requirements.improvements?.total || 0}</span>
                    </div>
                    <div class="project-status">
                        <span class="info-label">🏭 Projects:</span>
                        <span class="info-value">${requirements.projects?.current || 0}/${requirements.projects?.maxAllowed || 0}</span>
                        ${requirements.projects?.daysUntilNextBuild > 0 ? 
                            `<span class="cooldown-timer">(${requirements.projects.daysUntilNextBuild}d cooldown)</span>` : ''}
                    </div>
                    <div class="wonder-status">
                        <span class="info-label">🌟 Wonders:</span>
                        <span class="info-value">${requirements.wonders?.current || 0}/${requirements.wonders?.maxAllowed || 0}</span>
                        ${requirements.wonders?.daysUntilNextBuild > 0 ? 
                            `<span class="cooldown-timer">(${requirements.wonders.daysUntilNextBuild}d cooldown)</span>` : ''}
                    </div>
                </div>
                
                <div class="buildings-tabs">
                    <button class="tab-button ${this.currentTab === 'improvements' ? 'active' : ''}" 
                            data-tab="improvements">🏠 Improvements</button>
                    <button class="tab-button ${this.currentTab === 'projects' ? 'active' : ''}" 
                            data-tab="projects">🏭 Projects</button>
                    <button class="tab-button ${this.currentTab === 'wonders' ? 'active' : ''}" 
                            data-tab="wonders">🌟 Wonders</button>
                </div>
                
                <div class="buildings-content">
                    <div id="buildings-tab-content"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Bind interface events
     */
    bindInterfaceEvents() {
        // Close button
        const closeBtn = document.getElementById('close-buildings');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.currentTab = e.target.dataset.tab;
                this.updateTabs();
                this.updateContent();
            });
        });
        
        // Close on background click
        const panel = document.getElementById('buildings-panel');
        if (panel) {
            panel.addEventListener('click', (e) => {
                if (e.target === panel) {
                    this.hide();
                }
            });
        }
        
        // ESC key to close
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        if (this.isVisible && event.key === 'Escape') {
            this.hide();
        }
    }
    
    /**
     * Update tab appearance
     */
    updateTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === this.currentTab);
        });
    }
    
    /**
     * Update the content area based on current tab
     */
    updateContent() {
        const contentDiv = document.getElementById('buildings-tab-content');
        if (!contentDiv) return;
        
        let content = '';
        
        switch (this.currentTab) {
            case 'improvements':
                content = this.getImprovementsContent();
                break;
            case 'projects':
                content = this.getProjectsContent();
                break;
            case 'wonders':
                content = this.getWondersContent();
                break;
        }
        
        contentDiv.innerHTML = content;
        this.bindContentEvents();
    }
    
    /**
     * Get improvements tab content
     */
    getImprovementsContent() {
        const { improvements, requirements } = this.buildingData;
        const slotsInfo = requirements.improvements;
        
        let content = `
            <div class="buildings-section">
                <div class="section-header">
                    <h3>🏠 Infrastructure Improvements</h3>
                    <div class="section-info">
                        Slots Available: ${slotsInfo?.available || 0}/${slotsInfo?.total || 0}
                        <span class="help-text">• Build without restrictions (except slots and resources)</span>
                        <span class="help-text">• Demolish anytime without penalty</span>
                    </div>
                </div>
                
                <div class="buildings-grid">
        `;
        
        // Show available improvements
        Object.entries(improvements).forEach(([type, data]) => {
            content += this.getBuildingCard('improvement', type, data);
        });
        
        content += `
                </div>
            </div>
        `;
        
        return content;
    }
    
    /**
     * Get projects tab content
     */
    getProjectsContent() {
        const { projects, requirements } = this.buildingData;
        const projectsInfo = requirements.projects;
        
        let content = `
            <div class="buildings-section">
                <div class="section-header">
                    <h3>🏭 Advanced Projects</h3>
                    <div class="section-info">
                        Projects: ${projectsInfo?.current || 0}/${projectsInfo?.maxAllowed || 0}
                        ${projectsInfo?.daysUntilNextBuild > 0 ? 
                            `<span class="cooldown-text">⏰ ${projectsInfo.daysUntilNextBuild} days until next build</span>` : ''}
                        <span class="help-text">• 1 project per 10 territories owned</span>
                        <span class="help-text">• 14-day cooldown between builds</span>
                        <span class="help-text">• Demolishing resets the timer</span>
                    </div>
                </div>
                
                <div class="buildings-grid">
        `;
        
        // Show available projects
        Object.entries(projects).forEach(([type, data]) => {
            content += this.getBuildingCard('project', type, data);
        });
        
        content += `
                </div>
            </div>
        `;
        
        return content;
    }
    
    /**
     * Get wonders tab content
     */
    getWondersContent() {
        const { wonders, requirements } = this.buildingData;
        const wondersInfo = requirements.wonders;
        
        let content = `
            <div class="buildings-section">
                <div class="section-header">
                    <h3>🌟 Wonders of the World</h3>
                    <div class="section-info">
                        Wonders: ${wondersInfo?.current || 0}/${wondersInfo?.maxAllowed || 0}
                        ${wondersInfo?.daysUntilNextBuild > 0 ? 
                            `<span class="cooldown-text">⏰ ${wondersInfo.daysUntilNextBuild} days until next build</span>` : ''}
                        <span class="help-text">• 1 wonder per 20 territories owned</span>
                        <span class="help-text">• 28-day cooldown between builds</span>
                        <span class="help-text">• Demolishing does NOT reset timer</span>
                    </div>
                </div>
                
                <div class="buildings-grid">
        `;
        
        // Show available wonders
        Object.entries(wonders).forEach(([type, data]) => {
            content += this.getBuildingCard('wonder', type, data);
        });
        
        content += `
                </div>
            </div>
        `;
        
        return content;
    }
    
    /**
     * Create building card HTML
     */
    getBuildingCard(buildingType, type, data) {
        const isBuilt = data.count > 0;
        const canAfford = data.canAfford;
        const canBuildType = this.canBuildBuildingType(buildingType);
        const canBuild = canAfford && canBuildType && !data.isMaxed;
        
        let statusClass = 'available';
        let statusText = 'Available';
        let buttonText = 'Build';
        let buttonClass = 'build-btn';
        
        if (data.isMaxed) {
            statusClass = 'maxed';
            statusText = 'Maximum Built';
            buttonText = 'Maxed';
            buttonClass = 'build-btn disabled';
        } else if (!canBuildType) {
            statusClass = 'restricted';
            statusText = this.getBuildRestrictionText(buildingType);
            buttonText = 'Restricted';
            buttonClass = 'build-btn disabled';
        } else if (!canAfford) {
            statusClass = 'unaffordable';
            statusText = 'Cannot Afford';
            buttonText = 'Build';
            buttonClass = 'build-btn disabled';
        }
        
        // Prerequisites check
        if (data.meetsPrerequisite === false) {
            statusClass = 'prerequisite';
            statusText = 'Missing Prerequisite';
            buttonClass = 'build-btn disabled';
        }
        
        // Tech requirements
        if (data.meetsTechRequirement === false) {
            statusClass = 'tech-required';
            statusText = `Need ${data.techRequired} Tech`;
            buttonClass = 'build-btn disabled';
        }
        
        return `
            <div class="building-card ${statusClass}">
                <div class="building-header">
                    <h4>${data.name}</h4>
                    ${isBuilt ? `<span class="built-count">${data.count}/${data.maxCount || '∞'}</span>` : ''}
                </div>
                
                <div class="building-description">
                    <p>${data.description}</p>
                    <div class="building-effect">
                        <strong>Effect:</strong> ${data.effect}
                    </div>
                    ${data.special ? `<div class="building-special">${data.special}</div>` : ''}
                </div>
                
                <div class="building-cost">
                    <strong>Cost:</strong>
                    ${this.formatCost(data.cost)}
                </div>
                
                ${data.techRequired ? `
                    <div class="building-requirements">
                        <strong>Tech Required:</strong> ${data.techRequired}
                    </div>
                ` : ''}
                
                <div class="building-status">
                    <span class="status-text ${statusClass}">${statusText}</span>
                </div>
                
                <div class="building-actions">
                    <button class="${buttonClass}" 
                            data-action="build" 
                            data-type="${buildingType}" 
                            data-building="${type}"
                            ${!canBuild ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                    ${isBuilt ? `
                        <button class="demolish-btn" 
                                data-action="demolish" 
                                data-type="${buildingType}" 
                                data-building="${type}">
                            Demolish
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Check if can build building type (territory/timer restrictions)
     */
    canBuildBuildingType(buildingType) {
        const { requirements } = this.buildingData;
        
        switch (buildingType) {
            case 'improvement':
                return requirements.improvements?.available > 0;
            case 'project':
                return requirements.projects?.canBuild?.canBuild === true;
            case 'wonder':
                return requirements.wonders?.canBuild?.canBuild === true;
            default:
                return false;
        }
    }
    
    /**
     * Get restriction text for building type
     */
    getBuildRestrictionText(buildingType) {
        const { requirements } = this.buildingData;
        
        switch (buildingType) {
            case 'improvement':
                return 'No Improvement Slots';
            case 'project':
                return requirements.projects?.canBuild?.reason || 'Cannot Build';
            case 'wonder':
                return requirements.wonders?.canBuild?.reason || 'Cannot Build';
            default:
                return 'Restricted';
        }
    }
    
    /**
     * Format cost display
     */
    formatCost(cost) {
        if (!cost) return 'Free';
        
        return Object.entries(cost).map(([resource, amount]) => {
            const formatted = new Intl.NumberFormat().format(amount);
            const icon = this.getResourceIcon(resource);
            return `<span class="cost-item">${icon} ${formatted}</span>`;
        }).join(' ');
    }
    
    /**
     * Get resource icon
     */
    getResourceIcon(resource) {
        const icons = {
            money: '💰',
            food: '🌾',
            water: '💧',
            lumber: '🪵',
            cement: '🧱',
            steel: '🔩',
            aluminum: '⚡',
            gas: '⛽',
            ammo: '💥',
            lead: '🔗',
            uranium: '☢️',
            paper: '📄'
        };
        return icons[resource] || '📦';
    }
    
    /**
     * Bind content area events (build/demolish buttons)
     */
    bindContentEvents() {
        const buildButtons = document.querySelectorAll('[data-action="build"]');
        const demolishButtons = document.querySelectorAll('[data-action="demolish"]');
        
        buildButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const building = e.target.dataset.building;
                this.handleBuild(type, building);
            });
        });
        
        demolishButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const building = e.target.dataset.building;
                this.handleDemolish(type, building);
            });
        });
    }
    
    /**
     * Handle building construction
     */
    handleBuild(buildingType, buildingName) {
        const nation = this.buildingData.nation;
        
        if (!nation) {
            console.warn('No nation data available for building');
            return;
        }
        
        // Emit the appropriate build event
        switch (buildingType) {
            case 'improvement':
                EventBus.emit('build_improvement', {
                    improvementType: buildingName,
                    nation: nation
                });
                break;
            case 'project':
                EventBus.emit('build_project', {
                    projectType: buildingName,
                    nation: nation
                });
                break;
            case 'wonder':
                EventBus.emit('build_wonder', {
                    wonderType: buildingName,
                    nation: nation
                });
                break;
        }
    }
    
    /**
     * Handle building demolition
     */
    handleDemolish(buildingType, buildingName) {
        const nation = this.buildingData.nation;
        
        if (!nation) {
            console.warn('No nation data available for demolishing');
            return;
        }
        
        // Confirm demolition
        if (!confirm(`Are you sure you want to demolish this ${buildingName}?`)) {
            return;
        }
        
        // Emit the appropriate demolish event
        switch (buildingType) {
            case 'improvement':
                EventBus.emit('demolish_improvement', {
                    improvementType: buildingName,
                    nation: nation
                });
                break;
            case 'project':
                EventBus.emit('demolish_project', {
                    projectType: buildingName,
                    nation: nation
                });
                break;
            case 'wonder':
                EventBus.emit('demolish_wonder', {
                    wonderType: buildingName,
                    nation: nation
                });
                break;
        }
    }
    
    /**
     * Refresh buildings data and update display
     */
    refreshBuildings() {
        if (this.isVisible) {
            // Request fresh building data
            EventBus.emit('show_buildings_panel');
        }
    }
    
    /**
     * Update requirements display
     */
    updateRequirements(requirements) {
        this.buildingData.requirements = requirements;
        
        if (this.isVisible) {
            // Update the info bar
            const infoBar = document.querySelector('.buildings-info-bar');
            if (infoBar) {
                infoBar.innerHTML = this.getInfoBarHTML(requirements);
            }
            
            // Update current tab content to reflect new restrictions
            this.updateContent();
        }
    }
    
    /**
     * Get info bar HTML
     */
    getInfoBarHTML(requirements) {
        return `
            <div class="territory-info">
                <span class="info-label">🗺️ Territory:</span>
                <span class="info-value">${requirements.territoryCount || 0} squares</span>
            </div>
            <div class="improvement-slots">
                <span class="info-label">🏠 Improvement Slots:</span>
                <span class="info-value">${requirements.improvements?.used || 0}/${requirements.improvements?.total || 0}</span>
            </div>
            <div class="project-status">
                <span class="info-label">🏭 Projects:</span>
                <span class="info-value">${requirements.projects?.current || 0}/${requirements.projects?.maxAllowed || 0}</span>
                ${requirements.projects?.daysUntilNextBuild > 0 ? 
                    `<span class="cooldown-timer">(${requirements.projects.daysUntilNextBuild}d cooldown)</span>` : ''}
            </div>
            <div class="wonder-status">
                <span class="info-label">🌟 Wonders:</span>
                <span class="info-value">${requirements.wonders?.current || 0}/${requirements.wonders?.maxAllowed || 0}</span>
                ${requirements.wonders?.daysUntilNextBuild > 0 ? 
                    `<span class="cooldown-timer">(${requirements.wonders.daysUntilNextBuild}d cooldown)</span>` : ''}
            </div>
        `;
    }
    
    /**
     * Show building error message
     */
    showBuildingError(error) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'building-error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <strong>Cannot Build ${error.type}:</strong>
                <p>${error.reason}</p>
            </div>
        `;
        
        // Add to panel if visible
        const panel = document.getElementById('buildings-panel');
        if (panel) {
            panel.appendChild(errorDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        }
    }
    
    /**
     * Destroy the panel
     */
    destroy() {
        EventBus.off('show_buildings_interface', this.show, this);
        EventBus.off('building_requirements_updated', this.updateRequirements, this);
        EventBus.off('building_error', this.showBuildingError, this);
        EventBus.off('improvement_built', this.refreshBuildings, this);
        EventBus.off('project_built', this.refreshBuildings, this);
        EventBus.off('wonder_built', this.refreshBuildings, this);
        EventBus.off('improvement_demolished', this.refreshBuildings, this);
        EventBus.off('project_demolished', this.refreshBuildings, this);
        EventBus.off('wonder_demolished', this.refreshBuildings, this);
        
        this.hide();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingsPanel;
} else {
    window.BuildingsPanel = BuildingsPanel;
}

// Initialize buildings panel when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.BuildingsPanelInstance = new BuildingsPanel();
});