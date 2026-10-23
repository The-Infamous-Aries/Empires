/**
 * Diseases Panel Component
 * Displays active diseases and cure research progress
 */

class DiseasesPanel extends Panel {
    constructor() {
        super('diseases', 'Disease Management', 'Manage active diseases and research cures');
        this.refreshInterval = null;
    }

    createContent() {
        return `
            <div class="diseases-panel">
                <div class="diseases-header">
                    <h3>Disease Status</h3>
                    <button class="refresh-btn" onclick="DiseasesPanel.refresh()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>

                <div class="diseases-tabs">
                    <button class="tab-btn active" data-tab="national" onclick="DiseasesPanel.switchTab('national')">
                        National Diseases
                    </button>
                    <button class="tab-btn" data-tab="global" onclick="DiseasesPanel.switchTab('global')">
                        Global Diseases
                    </button>
                    <button class="tab-btn" data-tab="completed" onclick="DiseasesPanel.switchTab('completed')">
                        Cured Diseases
                    </button>
                </div>

                <div class="diseases-content">
                    <div class="tab-content active" id="national-diseases">
                        <div class="diseases-section">
                            <h4>Active National Diseases</h4>
                            <div id="national-diseases-list" class="diseases-list"></div>
                        </div>
                    </div>

                    <div class="tab-content" id="global-diseases">
                        <div class="diseases-section">
                            <h4>Global Disease Outbreaks</h4>
                            <div id="global-diseases-list" class="diseases-list"></div>
                            <div class="global-cooperation">
                                <h5>Global Cooperation Status</h5>
                                <div id="cooperation-status"></div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-content" id="completed-diseases">
                        <div class="diseases-section">
                            <h4>Successfully Cured</h4>
                            <div id="cured-diseases-list" class="diseases-list"></div>
                        </div>
                    </div>
                </div>

                <div class="research-points-display">
                    <h4>Research Points Available: <span id="available-research-points">0</span></h4>
                </div>
            </div>
        `;
    }

    initialize() {
        super.initialize();
        this.loadDiseases();
        this.startAutoRefresh();
        this.bindEvents();
    }

    bindEvents() {
        EventBus.on('disease_outbreak', (data) => this.handleDiseaseOutbreak(data));
        EventBus.on('disease_global_evolution', (data) => this.handleGlobalEvolution(data));
        EventBus.on('cure_research_started', (data) => this.handleCureStarted(data));
        EventBus.on('cure_completed', (data) => this.handleCureCompleted(data));
        EventBus.on('global_cure_completed', (data) => this.handleGlobalCureCompleted(data));
    }

    loadDiseases() {
        if (!window.DiseaseSystem || !window.Nation) return;

        const nationId = Nation.id;
        
        // Load national diseases
        const nationalDiseases = DiseaseSystem.getActiveDiseases(nationId);
        this.displayNationalDiseases(nationalDiseases);

        // Load global diseases
        const globalDiseases = DiseaseSystem.getGlobalDiseases();
        this.displayGlobalDiseases(globalDiseases);

        // Update research points display
        this.updateResearchPoints();
    }

    displayNationalDiseases(diseases) {
        const container = document.getElementById('national-diseases-list');
        if (!container) return;

        if (diseases.length === 0) {
            container.innerHTML = '<div class="no-diseases">No active national diseases</div>';
            return;
        }

        container.innerHTML = diseases.map(outbreak => this.renderDiseaseCard(outbreak)).join('');
    }

    displayGlobalDiseases(diseases) {
        const container = document.getElementById('global-diseases-list');
        if (!container) return;

        if (diseases.length === 0) {
            container.innerHTML = '<div class="no-diseases">No active global diseases</div>';
            return;
        }

        container.innerHTML = diseases.map(outbreak => this.renderDiseaseCard(outbreak, true)).join('');
        
        // Update cooperation status
        this.updateCooperationStatus(diseases);
    }

    renderDiseaseCard(outbreak, isGlobal = false) {
        const disease = outbreak.disease;
        const canStartCure = DiseaseSystem.canStartCureResearch(outbreak.nationId, disease.id);
        const cureProgress = DiseaseSystem.getCureProgress(outbreak.nationId, disease.id);
        const timeRemaining = outbreak.cureInProgress ? this.formatTime(outbreak.cureCompletionTime - Date.now()) : null;

        const severityClass = disease.severity === 'major' ? 'severity-major' : 'severity-minor';
        const scopeClass = isGlobal ? 'scope-global' : 'scope-national';

        return `
            <div class="disease-card ${severityClass} ${scopeClass}">
                <div class="disease-header">
                    <h5>${disease.name}</h5>
                    <div class="disease-badges">
                        <span class="severity-badge ${disease.severity}">${disease.severity.toUpperCase()}</span>
                        <span class="scope-badge ${disease.scope}">${disease.scope.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="disease-info">
                    <p class="description">${disease.description}</p>
                    
                    <div class="disease-effects">
                        <h6>Effects:</h6>
                        <ul>
                            ${Object.entries(disease.effects).map(([effect, value]) => 
                                `<li>${this.formatEffect(effect, value)}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    
                    <div class="cure-requirements">
                        <h6>Cure Requirements:</h6>
                        <ul>
                            <li>Cost: $${disease.cureRequirement.money.toLocaleString()}</li>
                            <li>Time: ${disease.cureRequirement.time} hours</li>
                            <li>Research Points: ${disease.cureRequirement.research_points}</li>
                            ${disease.cureRequirement.global_cooperation ? '<li>Global Cooperation Required</li>' : ''}
                        </ul>
                    </div>
                </div>

                <div class="cure-actions">
                    ${outbreak.cureInProgress ? `
                        <div class="cure-progress">
                            <h6>Cure Research in Progress</h6>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${cureProgress}%"></div>
                            </div>
                            <div class="progress-info">
                                <span>${Math.round(cureProgress)}% Complete</span>
                                ${timeRemaining ? `<span>Time Remaining: ${timeRemaining}</span>` : ''}
                            </div>
                        </div>
                    ` : `
                        <button class="cure-btn ${canStartCure ? 'can-afford' : 'cannot-afford'}" 
                                onclick="DiseasesPanel.startCureResearch('${disease.id}')"
                                ${!canStartCure ? 'disabled' : ''}>
                            ${canStartCure ? 'Start Cure Research' : 'Cannot Afford'}
                        </button>
                    `}
                </div>

                ${outbreak.evolutionTimer !== null ? `
                    <div class="evolution-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Will evolve to global in ${outbreak.evolutionTimer} hours if not cured!</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    formatEffect(effect, value) {
        const effectNames = {
            'happiness': 'Happiness',
            'productivity': 'Productivity',
            'population_growth': 'Population Growth',
            'healthcare_cost': 'Healthcare Cost',
            'disease_progress': 'Disease Progress',
            'food_consumption': 'Food Consumption',
            'social_stability': 'Social Stability'
        };

        const name = effectNames[effect] || effect.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const sign = value >= 0 ? '+' : '';
        
        if (effect === 'healthcare_cost') {
            return `${name}: $${value.toLocaleString()}`;
        } else if (effect.includes('consumption') || effect.includes('cost')) {
            return `${name}: ${sign}${value}`;
        } else {
            return `${name}: ${sign}${value}%`;
        }
    }

    updateCooperationStatus(globalDiseases) {
        const container = document.getElementById('cooperation-status');
        if (!container || globalDiseases.length === 0) return;

        const cooperationInfo = globalDiseases.map(outbreak => {
            const disease = outbreak.disease;
            const cooperation = this.calculateCooperationLevel(disease.id);
            return `
                <div class="cooperation-item">
                    <span class="disease-name">${disease.name}</span>
                    <div class="cooperation-bar">
                        <div class="cooperation-fill" style="width: ${cooperation.percentage}%"></div>
                    </div>
                    <span class="cooperation-text">${cooperation.participating}/${cooperation.total} nations (${cooperation.percentage}%)</span>
                </div>
            `;
        }).join('');

        container.innerHTML = cooperationInfo;
    }

    calculateCooperationLevel(diseaseId) {
        // This would integrate with the DiseaseSystem to get actual cooperation data
        // For now, return placeholder data
        return {
            participating: 3,
            total: 5,
            percentage: 60
        };
    }

    updateResearchPoints() {
        const pointsElement = document.getElementById('available-research-points');
        if (pointsElement && window.Nation) {
            pointsElement.textContent = Nation.researchPoints || 0;
        }
    }

    startCureResearch(diseaseId) {
        if (!window.DiseaseSystem || !window.Nation) return;

        const result = DiseaseSystem.startCureResearch(Nation.id, diseaseId);
        
        if (result.success) {
            this.showNotification('Cure research started successfully!', 'success');
            this.loadDiseases();
        } else {
            this.showNotification(`Cannot start research: ${result.reason}`, 'error');
        }
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
        document.getElementById(`${tabName}-diseases`).classList.add('active');

        // Load appropriate data
        this.loadDiseases();
    }

    refresh() {
        this.loadDiseases();
        this.showNotification('Disease data refreshed', 'info');
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadDiseases();
        }, 30000);
    }

    formatTime(milliseconds) {
        if (milliseconds <= 0) return '0h 0m';
        
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        
        return `${hours}h ${minutes}m`;
    }

    // Event handlers
    handleDiseaseOutbreak(data) {
        this.showNotification(`Disease outbreak: ${data.disease.name}!`, 'warning');
        this.loadDiseases();
    }

    handleGlobalEvolution(data) {
        this.showNotification(`${data.originalDisease.name} has evolved to ${data.globalDisease.name}!`, 'error');
        this.loadDiseases();
    }

    handleCureStarted(data) {
        this.showNotification(`Cure research started for ${data.disease.name}`, 'info');
        this.loadDiseases();
    }

    handleCureCompleted(data) {
        this.showNotification(`Cure completed for ${data.disease.name}!`, 'success');
        this.loadDiseases();
    }

    handleGlobalCureCompleted(data) {
        this.showNotification(`Global cure completed for ${data.disease.name}!`, 'success');
        this.loadDiseases();
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        super.destroy();
    }
}

// Make available globally
window.DiseasesPanel = DiseasesPanel;