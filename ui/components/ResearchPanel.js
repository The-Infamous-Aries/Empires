/**
 * Research Panel Component
 * Displays available research, active research, and completed technologies
 */

class ResearchPanel extends Panel {
    constructor() {
        super('research', 'Research & Technology', 'Advance your nation through technological research');
        this.currentCategory = 'economy';
        this.refreshInterval = null;
    }

    createContent() {
        return `
            <div class="research-panel">
                <div class="research-header">
                    <h3>Research & Technology</h3>
                    <div class="research-capacity">
                        <span id="research-slots-used">0</span>/<span id="research-slots-total">1</span> Research Slots
                    </div>
                </div>

                <div class="research-categories">
                    <button class="category-btn active" data-category="economy" onclick="ResearchPanel.switchCategory('economy')">
                        <i class="fas fa-coins"></i> Economy
                    </button>
                    <button class="category-btn" data-category="healthcare" onclick="ResearchPanel.switchCategory('healthcare')">
                        <i class="fas fa-heartbeat"></i> Healthcare  
                    </button>
                    <button class="category-btn" data-category="production" onclick="ResearchPanel.switchCategory('production')">
                        <i class="fas fa-industry"></i> Production
                    </button>
                    <button class="category-btn" data-category="war" onclick="ResearchPanel.switchCategory('war')">
                        <i class="fas fa-shield-alt"></i> Military
                    </button>
                </div>

                <div class="research-tabs">
                    <button class="tab-btn active" data-tab="available" onclick="ResearchPanel.switchTab('available')">
                        Available Research
                    </button>
                    <button class="tab-btn" data-tab="active" onclick="ResearchPanel.switchTab('active')">
                        Active Research
                    </button>
                    <button class="tab-btn" data-tab="completed" onclick="ResearchPanel.switchTab('completed')">
                        Completed Research
                    </button>
                </div>

                <div class="research-content">
                    <div class="tab-content active" id="available-research">
                        <div class="research-filters">
                            <label>
                                <input type="checkbox" id="filter-affordable" checked> 
                                Show only affordable
                            </label>
                            <label>
                                Tier: <select id="tier-filter">
                                    <option value="all">All Tiers</option>
                                    <option value="1">Tier 1 - Ancient</option>
                                    <option value="2">Tier 2 - Classical</option>
                                    <option value="3">Tier 3 - Medieval</option>
                                    <option value="4">Tier 4 - Renaissance</option>
                                    <option value="5">Tier 5 - Early Modern</option>
                                    <option value="6">Tier 6 - Industrial</option>
                                    <option value="7">Tier 7 - Contemporary</option>
                                    <option value="8">Tier 8 - Modern</option>
                                    <option value="9">Tier 9 - Information</option>
                                    <option value="10">Tier 10 - Digital</option>
                                    <option value="11">Tier 11 - Advanced</option>
                                    <option value="12">Tier 12 - Future</option>
                                </select>
                            </label>
                        </div>
                        <div id="available-research-list" class="research-list"></div>
                    </div>

                    <div class="tab-content" id="active-research">
                        <div id="active-research-list" class="research-list"></div>
                    </div>

                    <div class="tab-content" id="completed-research">
                        <div id="completed-research-list" class="research-list"></div>
                    </div>
                </div>

                <div class="research-bonuses">
                    <h4>Research Bonuses</h4>
                    <div id="research-bonuses-list"></div>
                </div>
            </div>
        `;
    }

    initialize() {
        super.initialize();
        this.loadResearch();
        this.startAutoRefresh();
        this.bindEvents();
        this.setupFilters();
    }

    bindEvents() {
        EventBus.on('research_started', (data) => this.handleResearchStarted(data));
        EventBus.on('research_completed_notification', (data) => this.handleResearchCompleted(data));
        EventBus.on('research_cancelled', (data) => this.handleResearchCancelled(data));
    }

    setupFilters() {
        const affordableFilter = document.getElementById('filter-affordable');
        const tierFilter = document.getElementById('tier-filter');

        if (affordableFilter) {
            affordableFilter.addEventListener('change', () => this.loadAvailableResearch());
        }

        if (tierFilter) {
            tierFilter.addEventListener('change', () => this.loadAvailableResearch());
        }
    }

    loadResearch() {
        this.updateResearchCapacity();
        this.loadAvailableResearch();
        this.loadActiveResearch();
        this.loadCompletedResearch();
        this.loadResearchBonuses();
    }

    updateResearchCapacity() {
        if (!window.ResearchSystem || !window.Nation) return;

        const usedSlots = ResearchSystem.getActiveResearchCount(Nation.id);
        const totalSlots = ResearchSystem.getMaxSimultaneousResearch(Nation.id);

        const usedElement = document.getElementById('research-slots-used');
        const totalElement = document.getElementById('research-slots-total');

        if (usedElement) usedElement.textContent = usedSlots;
        if (totalElement) totalElement.textContent = totalSlots;
    }

    loadAvailableResearch() {
        if (!window.ResearchSystem || !window.Nation) return;

        const container = document.getElementById('available-research-list');
        if (!container) return;

        const research = ResearchSystem.getAvailableResearch(Nation.id, this.currentCategory);
        const affordableOnly = document.getElementById('filter-affordable')?.checked;
        const tierFilter = document.getElementById('tier-filter')?.value;

        let filteredResearch = research;

        // Apply filters
        if (affordableOnly) {
            filteredResearch = filteredResearch.filter(r => r.canStart);
        }

        if (tierFilter && tierFilter !== 'all') {
            filteredResearch = filteredResearch.filter(r => r.tier === parseInt(tierFilter));
        }

        if (filteredResearch.length === 0) {
            container.innerHTML = '<div class="no-research">No research available with current filters</div>';
            return;
        }

        container.innerHTML = filteredResearch.map(research => this.renderAvailableResearchCard(research)).join('');
    }

    loadActiveResearch() {
        if (!window.ResearchSystem || !window.Nation) return;

        const container = document.getElementById('active-research-list');
        if (!container) return;

        const activeProjects = ResearchSystem.getActiveResearch(Nation.id);

        if (activeProjects.length === 0) {
            container.innerHTML = '<div class="no-research">No active research projects</div>';
            return;
        }

        container.innerHTML = activeProjects.map(project => this.renderActiveResearchCard(project)).join('');
    }

    loadCompletedResearch() {
        if (!window.ResearchSystem || !window.Nation) return;

        const container = document.getElementById('completed-research-list');
        if (!container) return;

        const completed = ResearchSystem.getCompletedResearch(Nation.id);
        const categoryCompleted = completed.filter(r => r.category === this.currentCategory);

        if (categoryCompleted.length === 0) {
            container.innerHTML = '<div class="no-research">No completed research in this category</div>';
            return;
        }

        container.innerHTML = categoryCompleted.map(research => this.renderCompletedResearchCard(research)).join('');
    }

    renderAvailableResearchCard(research) {
        const canStart = research.canStart;
        const reason = research.reason || '';

        return `
            <div class="research-card available ${canStart ? 'can-start' : 'cannot-start'}">
                <div class="research-header">
                    <h5>${research.name}</h5>
                    <div class="research-badges">
                        <span class="tier-badge tier-${research.tier}">Tier ${research.tier}</span>
                        <span class="category-badge ${research.category}">${research.category}</span>
                    </div>
                </div>

                <div class="research-info">
                    <p class="description">${research.description}</p>
                    
                    <div class="research-requirements">
                        <h6>Requirements:</h6>
                        <ul>
                            <li>Cost: $${research.cost.toLocaleString()}</li>
                            <li>Time: ${research.time} hours</li>
                            <li>Tech Level: ${research.requirements.tech_level}</li>
                            ${research.requirements.prerequisites ? 
                                `<li>Prerequisites: ${research.requirements.prerequisites.join(', ')}</li>` : ''}
                        </ul>
                    </div>

                    <div class="research-effects">
                        <h6>Effects:</h6>
                        <ul>
                            ${Object.entries(research.effects).map(([effect, value]) => 
                                `<li>${this.formatEffect(effect, value)}</li>`
                            ).join('')}
                        </ul>
                    </div>

                    ${research.unlocks ? `
                        <div class="research-unlocks">
                            <h6>Unlocks:</h6>
                            <div class="unlock-tags">
                                ${research.unlocks.map(unlock => `<span class="unlock-tag">${unlock}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="research-actions">
                    <button class="start-research-btn ${canStart ? 'can-start' : 'cannot-start'}" 
                            onclick="ResearchPanel.startResearch('${research.id}')"
                            ${!canStart ? 'disabled' : ''}>
                        ${canStart ? 'Start Research' : reason}
                    </button>
                </div>
            </div>
        `;
    }

    renderActiveResearchCard(project) {
        const progress = ResearchSystem.getResearchProgress(Nation.id, project.researchId);
        const timeRemaining = ResearchSystem.getResearchTimeRemaining(Nation.id, project.researchId);
        const canCancel = ResearchSystem.canCancelResearch(Nation.id, project.researchId);

        return `
            <div class="research-card active">
                <div class="research-header">
                    <h5>${project.research.name}</h5>
                    <div class="research-badges">
                        <span class="tier-badge tier-${project.research.tier}">Tier ${project.research.tier}</span>
                        <span class="status-badge active">IN PROGRESS</span>
                    </div>
                </div>

                <div class="research-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>${Math.round(progress)}% Complete</span>
                        <span>Time Remaining: ${timeRemaining}h</span>
                    </div>
                </div>

                <div class="research-info">
                    <p class="description">${project.research.description}</p>
                </div>

                <div class="research-actions">
                    ${canCancel ? `
                        <button class="cancel-research-btn" onclick="ResearchPanel.cancelResearch('${project.researchId}')">
                            Cancel Research (50% refund)
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderCompletedResearchCard(research) {
        return `
            <div class="research-card completed">
                <div class="research-header">
                    <h5>${research.name}</h5>
                    <div class="research-badges">
                        <span class="tier-badge tier-${research.tier}">Tier ${research.tier}</span>
                        <span class="status-badge completed">COMPLETED</span>
                    </div>
                </div>

                <div class="research-info">
                    <p class="description">${research.description}</p>
                    
                    <div class="research-effects">
                        <h6>Active Effects:</h6>
                        <ul>
                            ${Object.entries(research.effects).map(([effect, value]) => 
                                `<li>${this.formatEffect(effect, value)}</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    loadResearchBonuses() {
        const container = document.getElementById('research-bonuses-list');
        if (!container || !window.Nation) return;

        const bonuses = [];
        const nation = Nation;

        // Research lab bonuses
        if (nation.improvements?.research_lab) {
            const labs = nation.improvements.research_lab;
            const bonus = labs * 3;
            bonuses.push(`Research Labs: ${labs} (-${bonus}% research time)`);
        }

        // Advanced research project bonuses
        if (nation.projects?.advanced_research) {
            const projects = nation.projects.advanced_research;
            if (projects >= 5) {
                bonuses.push(`Advanced Research Institute: Doubles lab bonus (-30% total)`);
            } else {
                bonuses.push(`Advanced Research Institute: ${projects}/5 (inactive)`);
            }
        }

        // Wonder bonuses
        if (nation.wonders?.includes('great_library')) {
            bonuses.push('Great Library: +1 research slot, +25% speed, +200 research points/day');
        }

        // Education bonuses
        if (nation.nationStats?.education) {
            const eduBonus = Math.round((nation.nationStats.education / 100) * 15);
            bonuses.push(`Education: ${Math.round(nation.nationStats.education)}% (+${eduBonus}% research speed)`);
        }

        if (bonuses.length === 0) {
            container.innerHTML = '<div class="no-bonuses">No active research bonuses</div>';
        } else {
            container.innerHTML = bonuses.map(bonus => `<div class="bonus-item">${bonus}</div>`).join('');
        }
    }

    formatEffect(effect, value) {
        const effectNames = {
            'tax_efficiency': 'Tax Efficiency',
            'economic_growth': 'Economic Growth',
            'trade_efficiency': 'Trade Efficiency',
            'disease_resistance': 'Disease Resistance',
            'population_health': 'Population Health',
            'birth_rate': 'Birth Rate',
            'basic_production': 'Basic Production',
            'food_production': 'Food Production',
            'industrial_output': 'Industrial Output',
            'attack_power': 'Attack Power',
            'defense': 'Defense',
            'critical_chance': 'Critical Chance',
            'critical_damage': 'Critical Damage'
        };

        const name = effectNames[effect] || effect.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const sign = value >= 0 ? '+' : '';
        
        return `${name}: ${sign}${value}${effect.includes('rate') || effect.includes('chance') ? '%' : ''}`;
    }

    startResearch(researchId) {
        if (!window.ResearchSystem || !window.Nation) return;

        const result = ResearchSystem.startResearch(Nation.id, researchId);
        
        if (result.success) {
            this.showNotification(`Research started: ${result.project.research.name}`, 'success');
            this.loadResearch();
        } else {
            this.showNotification(`Cannot start research: ${result.reason}`, 'error');
        }
    }

    cancelResearch(researchId) {
        if (!window.ResearchSystem || !window.Nation) return;

        const success = ResearchSystem.cancelResearch(Nation.id, researchId);
        
        if (success) {
            this.showNotification('Research cancelled with partial refund', 'info');
            this.loadResearch();
        } else {
            this.showNotification('Cannot cancel research', 'error');
        }
    }

    switchCategory(category) {
        this.currentCategory = category;

        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Reload research data
        this.loadResearch();
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-research`).classList.add('active');
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadActiveResearch();
            this.updateResearchCapacity();
        }, 30000);
    }

    // Event handlers
    handleResearchStarted(data) {
        this.showNotification(`Research started: ${data.research.name}`, 'info');
        this.loadResearch();
    }

    handleResearchCompleted(data) {
        this.showNotification(`Research completed: ${data.research.name}!`, 'success');
        this.loadResearch();
    }

    handleResearchCancelled(data) {
        this.showNotification(`Research cancelled: ${data.research.name}. Refunded: $${data.refund}`, 'info');
        this.loadResearch();
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        super.destroy();
    }
}

// Make available globally
window.ResearchPanel = ResearchPanel;