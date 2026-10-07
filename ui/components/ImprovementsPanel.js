/**
 * Improvements Panel UI Component
 * Displays and manages nation improvements
 */

class ImprovementsPanel {
    constructor() {
        this.isVisible = false;
        this.improvements = {};
        this.bindEvents();
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('show_improvements_panel', this.show, this);
        EventBus.on('hide_improvements_panel', this.hide, this);
        EventBus.on('improvement_built', this.onImprovementBuilt, this);
        EventBus.on('improvement_demolished', this.onImprovementDemolished, this);
        EventBus.on('resources_updated', this.updateAffordability, this);
    }
    
    /**
     * Show the improvements panel
     */
    show() {
        if (!window.Nation || !window.ImprovementsSystem) {
            console.warn('Nation or Improvements System not available');
            return;
        }
        
        this.improvements = window.ImprovementsSystem.systems.improvements.getNationImprovements(window.Nation);
        this.render();
        this.isVisible = true;
    }
    
    /**
     * Hide the improvements panel
     */
    hide() {
        const modal = document.getElementById('improvements-modal');
        if (modal) {
            modal.remove();
        }
        this.isVisible = false;
    }
    
    /**
     * Render the improvements panel
     */
    render() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        
        const modal = Modal.create({
            id: 'improvements-modal',
            title: 'Nation Improvements',
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
            'trade': { name: 'Trade & Economics', icon: '🚢', improvements: [] },
            'production': { name: 'Production', icon: '🏭', improvements: [] },
            'military': { name: 'Military', icon: '⚔️', improvements: [] },
            'infrastructure': { name: 'Infrastructure', icon: '🏗️', improvements: [] },
            'diplomacy': { name: 'Diplomacy', icon: '🤝', improvements: [] },
            'economic': { name: 'Economic', icon: '💰', improvements: [] },
            'administration': { name: 'Administration', icon: '🏛️', improvements: [] }
        };
        
        // Categorize improvements
        Object.entries(this.improvements).forEach(([key, improvement]) => {
            const category = improvement.category || 'infrastructure';
            if (categories[category]) {
                categories[category].improvements.push({ key, ...improvement });
            }
        });
        
        let content = '<div class="improvements-panel">';
        content += this.generateStatsOverview();
        content += '<div class="improvements-grid">';
        
        Object.entries(categories).forEach(([catKey, category]) => {
            if (category.improvements.length > 0) {
                content += this.generateCategorySection(category);
            }
        });
        
        content += '</div></div>';
        return content;
    }
    
    /**
     * Generate statistics overview
     */
    generateStatsOverview() {
        const nation = window.Nation;
        if (!nation.nationStats) return '';
        
        return `
            <div class="statistics-panel">
                <h3>📊 Nation Statistics Overview</h3>
                <div class="stats-grid">
                    <div class="stat-category">
                        <h4>Social Metrics</h4>
                        <div class="stat-item">
                            <span class="stat-label">Happiness</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.happiness, 70, 40)}">${Math.round(nation.nationStats.happiness)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Literacy Rate</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.literacy, 60, 30)}">${Math.round(nation.nationStats.literacy)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Crime Rate</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.crime, 30, 50, true)}">${Math.round(nation.nationStats.crime)}%</span>
                        </div>
                    </div>
                    
                    <div class="stat-category">
                        <h4>Health & Environment</h4>
                        <div class="stat-item">
                            <span class="stat-label">Disease Rate</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.disease, 20, 35, true)}">${Math.round(nation.nationStats.disease)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Pollution Level</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.pollution, 20, 40, true)}">${nation.nationStats.pollution}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Environment Quality</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.environment, 60, 40)}">${Math.round(nation.nationStats.environment)}%</span>
                        </div>
                    </div>
                    
                    <div class="stat-category">
                        <h4>Effectiveness Multipliers</h4>
                        <div class="stat-item">
                            <span class="stat-label">Population Efficiency</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.populationEfficiency * 100, 110, 90)}">${Math.round(nation.nationStats.populationEfficiency * 100)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Military Morale</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.militaryMorale * 100, 110, 90)}">${Math.round(nation.nationStats.militaryMorale * 100)}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tax Efficiency</span>
                            <span class="stat-value ${this.getStatClass(nation.nationStats.taxEfficiency * 100, 110, 90)}">${Math.round(nation.nationStats.taxEfficiency * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Get CSS class for stat value based on thresholds
     */
    getStatClass(value, goodThreshold, badThreshold, inverted = false) {
        if (inverted) {
            if (value <= goodThreshold) return 'good';
            if (value >= badThreshold) return 'bad';
            return 'neutral';
        } else {
            if (value >= goodThreshold) return 'good';
            if (value <= badThreshold) return 'bad';
            return 'neutral';
        }
    }
    
    /**
     * Generate category section
     */
    generateCategorySection(category) {
        let section = `
            <div class="improvement-category">
                <h4>${category.icon} ${category.name}</h4>
        `;
        
        category.improvements.forEach(improvement => {
            section += this.generateImprovementItem(improvement);
        });
        
        section += '</div>';
        return section;
    }
    
    /**
     * Generate individual improvement item
     */
    generateImprovementItem(improvement) {
        const isMaxed = improvement.count >= improvement.maxCount;
        const canAfford = improvement.canAfford;
        const costText = this.formatCost(improvement.cost);
        
        let itemClass = 'improvement-item';
        if (isMaxed) itemClass += ' maxed';
        if (!canAfford && !isMaxed) itemClass += ' cant-afford';
        
        let buttonText = 'Build';
        let buttonClass = 'build-improvement-btn';
        let buttonDisabled = '';
        
        if (isMaxed) {
            buttonText = 'Maximum Built';
            buttonClass += ' maxed';
            buttonDisabled = 'disabled';
        } else if (!canAfford) {
            buttonText = 'Cannot Afford';
            buttonDisabled = 'disabled';
        }
        
        return `
            <div class="${itemClass}">
                <div class="improvement-header">
                    <span class="improvement-name">${improvement.name}</span>
                    <span class="improvement-count">${improvement.count}/${improvement.maxCount}</span>
                </div>
                <div class="improvement-description">${improvement.description}</div>
                <div class="improvement-cost">Cost: ${costText}</div>
                <div class="improvement-effect">${improvement.effect}</div>
                <button class="${buttonClass}" 
                        data-improvement="${improvement.key}" 
                        ${buttonDisabled}>${buttonText}</button>
                ${improvement.count > 0 ? `<button class="demolish-improvement-btn" data-demolish="${improvement.key}">Demolish</button>` : ''}
            </div>
        `;
    }
    
    /**
     * Format improvement cost
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
        const modal = document.getElementById('improvements-modal');
        if (!modal) return;
        
        // Build improvement buttons
        modal.querySelectorAll('.build-improvement-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const improvementType = e.target.dataset.improvement;
                this.buildImprovement(improvementType);
            });
        });
        
        // Demolish improvement buttons
        modal.querySelectorAll('.demolish-improvement-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const improvementType = e.target.dataset.demolish;
                this.demolishImprovement(improvementType);
            });
        });
    }
    
    /**
     * Build an improvement
     */
    buildImprovement(improvementType) {
        if (!window.Nation || !window.ImprovementsSystem) return;
        
        EventBus.emit('build_improvement', {
            improvementType: improvementType,
            nation: window.Nation
        });
    }
    
    /**
     * Demolish an improvement
     */
    demolishImprovement(improvementType) {
        if (!window.Nation || !window.ImprovementsSystem) return;
        
        if (confirm(`Are you sure you want to demolish a ${this.improvements[improvementType]?.name}?`)) {
            EventBus.emit('demolish_improvement', {
                improvementType: improvementType,
                nation: window.Nation
            });
        }
    }
    
    /**
     * Handle improvement built event
     */
    onImprovementBuilt(data) {
        if (this.isVisible) {
            // Refresh the panel to show updated counts and affordability
            this.show();
        }
    }
    
    /**
     * Handle improvement demolished event
     */
    onImprovementDemolished(data) {
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
            this.improvements = window.ImprovementsSystem.systems.improvements.getNationImprovements(window.Nation);
            this.updateButtonStates();
        }
    }
    
    /**
     * Update button states based on current affordability
     */
    updateButtonStates() {
        const modal = document.getElementById('improvements-modal');
        if (!modal) return;
        
        modal.querySelectorAll('.build-improvement-btn').forEach(btn => {
            const improvementType = btn.dataset.improvement;
            const improvement = this.improvements[improvementType];
            
            if (improvement) {
                const isMaxed = improvement.count >= improvement.maxCount;
                const canAfford = improvement.canAfford;
                
                if (isMaxed) {
                    btn.textContent = 'Maximum Built';
                    btn.disabled = true;
                    btn.className = 'build-improvement-btn maxed';
                } else if (!canAfford) {
                    btn.textContent = 'Cannot Afford';
                    btn.disabled = true;
                    btn.className = 'build-improvement-btn';
                } else {
                    btn.textContent = 'Build';
                    btn.disabled = false;
                    btn.className = 'build-improvement-btn';
                }
            }
        });
    }
    
    /**
     * Destroy the panel
     */
    destroy() {
        EventBus.off('show_improvements_panel', this.show, this);
        EventBus.off('hide_improvements_panel', this.hide, this);
        EventBus.off('improvement_built', this.onImprovementBuilt, this);
        EventBus.off('improvement_demolished', this.onImprovementDemolished, this);
        EventBus.off('resources_updated', this.updateAffordability, this);
        
        this.hide();
    }
}

// Initialize improvements panel when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ImprovementsPanel = new ImprovementsPanel();
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImprovementsPanel;
} else {
    window.ImprovementsPanel = ImprovementsPanel;
}