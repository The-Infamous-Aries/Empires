/**
 * Wonders Panel UI Component
 * Displays and manages world wonders (highest tier buildings)
 */

class WondersPanel {
    constructor() {
        this.isInitialized = false;
        this.isVisible = false;
        this.wonderCategories = ['administration', 'education', 'healthcare', 'military', 'infrastructure'];
        this.selectedCategory = 'administration';
        
        this.bindEvents();
    }
    
    /**
     * Initialize the wonders panel
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.createWondersPanel();
        this.populateWondersList();
        this.updateWonderCounts();
        
        this.isInitialized = true;
        console.log('Wonders Panel initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('wonder_built', this.onWonderBuilt, this);
        EventBus.on('wonder_demolished', this.onWonderDemolished, this);
        EventBus.on('nation_updated', this.updateWonderCounts, this);
        EventBus.on('resources_changed', this.updateAffordability, this);
    }
    
    /**
     * Create the wonders panel HTML structure
     */
    createWondersPanel() {
        const buildPopup = document.getElementById('build-popup');
        if (!buildPopup) return;
        
        const content = buildPopup.querySelector('.popup-content');
        if (!content) return;
        
        // Create wonders section
        const wondersSection = document.createElement('div');
        wondersSection.id = 'wonders-section';
        wondersSection.className = 'build-section hidden';
        wondersSection.innerHTML = `
            <div class="section-header">
                <h4>🌟 Wonders of the World</h4>
                <p class="section-subtitle">Monumental achievements that shape civilizations forever</p>
            </div>
            
            <div class="wonder-categories">
                <button class="category-filter active" data-category="administration">🏛️ Monuments</button>
                <button class="category-filter" data-category="education">📚 Education</button>
                <button class="category-filter" data-category="healthcare">🏥 Healthcare</button>
                <button class="category-filter" data-category="military">⚔️ Military</button>
                <button class="category-filter" data-category="infrastructure">🔧 Infrastructure</button>
            </div>
            
            <div class="wonders-grid" id="wonders-grid">
                <!-- Wonders will be populated here -->
            </div>
            
            <div class="wonder-summary">
                <div class="summary-item">
                    <strong>Active Wonders:</strong> <span id="total-wonders">0</span>
                </div>
                <div class="summary-item">
                    <strong>Nuclear Capability:</strong> <span id="nuclear-status">No</span>
                </div>
                <div class="summary-item">
                    <strong>Enhanced Systems:</strong> <span id="enhanced-count">0</span>
                </div>
            </div>
        `;
        
        content.appendChild(wondersSection);
        
        // Bind category filter events
        this.bindCategoryFilters();
    }
    
    /**
     * Bind category filter events
     */
    bindCategoryFilters() {
        const filters = document.querySelectorAll('.category-filter');
        filters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.selectCategory(category);
            });
        });
    }
    
    /**
     * Select a wonder category
     */
    selectCategory(category) {
        this.selectedCategory = category;
        
        // Update filter buttons
        document.querySelectorAll('.category-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Update wonders display
        this.populateWondersList();
    }
    
    /**
     * Show the wonders panel
     */
    show() {
        if (!this.isInitialized) this.initialize();
        
        // Hide other sections
        document.querySelectorAll('.build-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show wonders section
        const wondersSection = document.getElementById('wonders-section');
        if (wondersSection) {
            wondersSection.classList.remove('hidden');
            this.isVisible = true;
            this.populateWondersList();
            this.updateWonderCounts();
        }
    }
    
    /**
     * Hide the wonders panel
     */
    hide() {
        const wondersSection = document.getElementById('wonders-section');
        if (wondersSection) {
            wondersSection.classList.add('hidden');
            this.isVisible = false;
        }
    }
    /**
     * Populate the wonders list based on selected category
     */
    populateWondersList() {
        const wondersGrid = document.getElementById('wonders-grid');
        if (!wondersGrid || !window.WondersSystem) return;
        
        wondersGrid.innerHTML = '';
        
        Object.entries(WondersSystem.wonderTypes).forEach(([wonderType, wonder]) => {
            if (wonder.category !== this.selectedCategory) return;
            
            const wonderCard = this.createWonderCard(wonderType, wonder);
            wondersGrid.appendChild(wonderCard);
        });
    }
    
    /**
     * Create a wonder card element
     */
    createWonderCard(wonderType, wonder) {
        const nation = window.Nation;
        const currentCount = nation?.wonders?.[wonderType] || 0;
        const canAfford = nation ? WondersSystem.canAffordWonder(nation, wonder) : false;
        const meetsTech = nation ? nation.tech >= wonder.techRequired : false;
        const meetsPrereq = wonder.requires ? (nation?.projects?.[wonder.requires] > 0) : true;
        const isMaxed = currentCount >= wonder.maxCount;
        
        const card = document.createElement('div');
        card.className = 'wonder-card';
        
        if (!canAfford) card.classList.add('unaffordable');
        if (!meetsTech) card.classList.add('tech-locked');
        if (!meetsPrereq) card.classList.add('prereq-locked');
        if (isMaxed) card.classList.add('maxed');
        
        // Format cost display
        const costEntries = Object.entries(wonder.cost);
        const costDisplay = costEntries.map(([resource, amount]) => {
            if (resource === 'money') {
                return `$${(amount / 1000000).toFixed(1)}M`;
            }
            return `${amount} ${resource}`;
        }).join(', ');
        
        card.innerHTML = `
            <div class="wonder-header">
                <h4 class="wonder-name">${wonder.name}</h4>
                <div class="wonder-count">${currentCount}/${wonder.maxCount}</div>
            </div>
            
            <div class="wonder-info">
                <p class="wonder-description">${wonder.description}</p>
                <div class="wonder-effect">
                    <strong>Effect:</strong> ${wonder.effect}
                </div>
                ${wonder.special ? `<div class="wonder-special">${wonder.special}</div>` : ''}
            </div>
            
            <div class="wonder-requirements">
                <div class="tech-requirement ${meetsTech ? 'met' : 'unmet'}">
                    🧬 Tech ${wonder.techRequired} ${meetsTech ? '✓' : '✗'}
                </div>
                ${wonder.requires ? `
                    <div class="prereq-requirement ${meetsPrereq ? 'met' : 'unmet'}">
                        🏗️ Requires ${WondersSystem.wonderTypes[wonder.requires]?.name || wonder.requires} ${meetsPrereq ? '✓' : '✗'}
                    </div>
                ` : ''}
            </div>
            
            <div class="wonder-cost">
                <div class="cost-display">💰 ${costDisplay}</div>
            </div>
            
            <div class="wonder-actions">
                <button class="build-wonder-btn ${canAfford && meetsTech && meetsPrereq && !isMaxed ? '' : 'disabled'}" 
                        data-wonder="${wonderType}" ${!canAfford || !meetsTech || !meetsPrereq || isMaxed ? 'disabled' : ''}>
                    ${isMaxed ? 'Maximum Built' : 'Build Wonder'}
                </button>
                ${currentCount > 0 ? `
                    <button class="demolish-wonder-btn" data-wonder="${wonderType}">
                        Demolish
                    </button>
                ` : ''}
            </div>
        `;
        
        // Bind action events
        const buildBtn = card.querySelector('.build-wonder-btn');
        if (buildBtn) {
            buildBtn.addEventListener('click', (e) => {
                const wonderType = e.target.dataset.wonder;
                this.buildWonder(wonderType);
            });
        }
        
        const demolishBtn = card.querySelector('.demolish-wonder-btn');
        if (demolishBtn) {
            demolishBtn.addEventListener('click', (e) => {
                const wonderType = e.target.dataset.wonder;
                this.demolishWonder(wonderType);
            });
        }
        
        return card;
    }
    
    /**
     * Build a wonder
     */
    buildWonder(wonderType) {
        if (!window.Nation || !window.WondersSystem) return;
        
        const wonder = WondersSystem.wonderTypes[wonderType];
        if (!wonder) return;
        
        // Show confirmation for expensive wonders
        const cost = Object.entries(wonder.cost).map(([resource, amount]) => {
            if (resource === 'money') return `$${(amount / 1000000).toFixed(1)}M`;
            return `${amount} ${resource}`;
        }).join(', ');
        
        const confirmMessage = `Build ${wonder.name} for ${cost}?\n\nThis is a WONDER - one of the most expensive constructions possible!`;
        
        if (!confirm(confirmMessage)) return;
        
        const success = WondersSystem.buildWonder({
            wonderType: wonderType,
            nation: window.Nation
        });
        
        if (success) {
            this.populateWondersList();
            this.updateWonderCounts();
            
            // Show success notification
            if (window.GameEngine?.ui?.notifications) {
                GameEngine.ui.notifications.show(`🌟 ${wonder.name} completed! A true Wonder of the World!`, 'success');
            }
        }
    }
    
    /**
     * Demolish a wonder
     */
    demolishWonder(wonderType) {
        if (!window.Nation || !window.WondersSystem) return;
        
        const wonder = WondersSystem.wonderTypes[wonderType];
        if (!wonder) return;
        
        const confirmMessage = `Demolish ${wonder.name}?\n\nThis will destroy one of the world's greatest wonders!`;
        
        if (!confirm(confirmMessage)) return;
        
        const success = WondersSystem.demolishWonder({
            wonderType: wonderType,
            nation: window.Nation
        });
        
        if (success) {
            this.populateWondersList();
            this.updateWonderCounts();
        }
    }
    
    /**
     * Update wonder counts and summary
     */
    updateWonderCounts() {
        if (!this.isVisible || !window.Nation) return;
        
        const nation = window.Nation;
        let totalWonders = 0;
        let enhancedCount = 0;
        
        // Count total wonders
        if (nation.wonders) {
            Object.values(nation.wonders).forEach(count => {
                totalWonders += count;
            });
        }
        
        // Count enhanced systems
        if (nation.wonderEffects?.enhancedMissileProduction) enhancedCount++;
        if (nation.wonderEffects?.enhancedSpyProduction) enhancedCount++;
        if (nation.wonderEffects?.enhancedSalvage) enhancedCount++;
        if (nation.wonderEffects?.enhancedNuclearProduction) enhancedCount++;
        
        // Update display
        const totalElement = document.getElementById('total-wonders');
        if (totalElement) totalElement.textContent = totalWonders;
        
        const nuclearElement = document.getElementById('nuclear-status');
        if (nuclearElement) {
            nuclearElement.textContent = nation.wonderEffects?.nuclearCapability ? 'Yes' : 'No';
            nuclearElement.style.color = nation.wonderEffects?.nuclearCapability ? '#ff6b6b' : '#666';
        }
        
        const enhancedElement = document.getElementById('enhanced-count');
        if (enhancedElement) enhancedElement.textContent = enhancedCount;
    }
    
    /**
     * Update affordability status
     */
    updateAffordability() {
        if (!this.isVisible) return;
        this.populateWondersList();
    }
    
    /**
     * Handle wonder built event
     */
    onWonderBuilt(data) {
        if (this.isVisible) {
            this.populateWondersList();
            this.updateWonderCounts();
        }
    }
    
    /**
     * Handle wonder demolished event
     */
    onWonderDemolished(data) {
        if (this.isVisible) {
            this.populateWondersList();
            this.updateWonderCounts();
        }
    }
    
    /**
     * Destroy the wonders panel
     */
    destroy() {
        EventBus.off('wonder_built', this.onWonderBuilt, this);
        EventBus.off('wonder_demolished', this.onWonderDemolished, this);
        EventBus.off('nation_updated', this.updateWonderCounts, this);
        EventBus.off('resources_changed', this.updateAffordability, this);
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WondersPanel;
} else {
    window.WondersPanel = WondersPanel;
}

// Initialize wonders panel when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.WondersPanel = new WondersPanel();
});