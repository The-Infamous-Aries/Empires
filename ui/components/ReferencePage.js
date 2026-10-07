/**
 * Reference Page - Government and Religion Encyclopedia
 * Dominion Wars - Nation Building Strategy Game
 */

class ReferencePageSystem {
    constructor() {
        this.isInitialized = false;
        this.currentTab = 'governments';
        this.initialize();
    }

    initialize() {
        console.log('Initializing Reference Page System...');
        this.createReferenceModal();
        this.bindEvents();
        this.isInitialized = true;
        console.log('Reference Page System initialized');
    }

    createReferenceModal() {
        const modalHTML = `
            <div id="reference-modal" class="reference-modal hidden">
                <div class="reference-modal-overlay"></div>
                <div class="reference-modal-content">
                    <div class="reference-header">
                        <h2>Encyclopedia</h2>
                        <button id="reference-close-btn" class="close-btn">&times;</button>
                    </div>
                    
                    <div class="reference-tabs">
                        <button class="tab-btn active" data-tab="governments">
                            <span class="tab-icon">🏛️</span>
                            Governments
                        </button>
                        <button class="tab-btn" data-tab="religions">
                            <span class="tab-icon">✝️</span>
                            Religions
                        </button>
                    </div>
                    
                    <div class="reference-body">
                        <!-- Governments Tab -->
                        <div id="governments-tab" class="reference-tab active">
                            <div class="reference-intro">
                                <h3>Government Types</h3>
                                <p>Choose your nation's governing system. Each government provides unique bonuses and penalties that shape your nation's future.</p>
                            </div>
                            <div class="reference-grid" id="governments-grid">
                                <!-- Governments will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Religions Tab -->
                        <div id="religions-tab" class="reference-tab">
                            <div class="reference-intro">
                                <h3>Religions & Philosophies</h3>
                                <p>Select your nation's religious or philosophical foundation. Faith shapes culture, morality, and even economic output.</p>
                            </div>
                            <div class="reference-grid" id="religions-grid">
                                <!-- Religions will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="reference-footer">
                        <div class="reference-legend">
                            <div class="legend-item">
                                <span class="legend-color positive"></span>
                                <span>Bonus</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color negative"></span>
                                <span>Penalty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Populate the grids
        this.populateGovernments();
        this.populateReligions();
    }

    populateGovernments() {
        const grid = document.getElementById('governments-grid');
        if (!grid || !window.GovernmentSystem) return;

        const governments = GovernmentSystem.getAllGovernments();
        grid.innerHTML = '';

        governments.forEach(gov => {
            const card = this.createGovernmentCard(gov);
            grid.appendChild(card);
        });
    }

    createGovernmentCard(government) {
        const card = document.createElement('div');
        card.className = 'reference-card government-card';
        card.dataset.governmentId = government.id;

        // Build bonuses and penalties HTML
        const bonusesHTML = Object.entries(government.bonuses || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const sign = percentage > 0 ? '+' : '';
            const className = percentage > 0 ? 'positive' : 'negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<div class="stat-row ${className}">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${sign}${percentage}%</span>
            </div>`;
        }).join('');

        const penaltiesHTML = Object.entries(government.penalties || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const className = 'negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<div class="stat-row ${className}">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${percentage}%</span>
            </div>`;
        }).join('');

        card.innerHTML = `
            <div class="card-header">
                <h4 class="government-name">${government.name}</h4>
                <span class="government-fullname">${government.fullName}</span>
            </div>
            <div class="card-body">
                <p class="government-description">${government.description}</p>
                
                <div class="stats-section">
                    <h5>Bonuses</h5>
                    <div class="stats-list">${bonusesHTML || '<span class="no-stats">None</span>'}</div>
                </div>
                
                ${penaltiesHTML ? `
                <div class="stats-section">
                    <h5>Penalties</h5>
                    <div class="stats-list">${penaltiesHTML}</div>
                </div>
                ` : ''}
                
                <div class="stats-section">
                    <h5>Base Policies</h5>
                    <div class="policies-list">
                        ${Object.entries(government.policies || {}).map(([key, value]) => `
                            <span class="policy-tag">${key}: ${value}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="stats-section">
                    <h5>Tax & Military</h5>
                    <div class="tax-military">
                        <span>Tax Rate: ${government.taxRate}%</span>
                        <span>Military Budget: ${government.militaryBudget}%</span>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    populateReligions() {
        const grid = document.getElementById('religions-grid');
        if (!grid || !window.ReligionSystem) return;

        const religions = ReligionSystem.getAllReligions();
        grid.innerHTML = '';

        religions.forEach(religion => {
            const card = this.createReligionCard(religion);
            grid.appendChild(card);
        });
    }

    createReligionCard(religion) {
        const card = document.createElement('div');
        card.className = 'reference-card religion-card';
        card.dataset.religionId = religion.id;

        // Build bonuses HTML
        const bonusesHTML = Object.entries(religion.bonuses || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const sign = percentage > 0 ? '+' : '';
            const className = percentage > 0 ? 'positive' : 'negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<div class="stat-row ${className}">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${sign}${percentage}%</span>
            </div>`;
        }).join('');

        const penaltiesHTML = Object.entries(religion.penalties || {}).map(([key, value]) => {
            const percentage = Math.round((value - 1) * 100);
            if (percentage === 0) return '';
            const className = 'negative';
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            return `<div class="stat-row ${className}">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${percentage}%</span>
            </div>`;
        }).join('');

        card.innerHTML = `
            <div class="card-header">
                <h4 class="religion-name">${religion.name}</h4>
                <span class="religion-fullname">${religion.fullName}</span>
            </div>
            <div class="card-body">
                <p class="religion-description">${religion.description}</p>
                
                <div class="stats-section">
                    <h5>Bonuses</h5>
                    <div class="stats-list">${bonusesHTML || '<span class="no-stats">None</span>'}</div>
                </div>
                
                ${penaltiesHTML ? `
                <div class="stats-section">
                    <h5>Penalty</h5>
                    <div class="stats-list">${penaltiesHTML}</div>
                </div>
                ` : ''}
                
                <div class="stats-section">
                    <h5>Practices</h5>
                    <div class="practices-list">
                        <span class="practice-tag">Worship: ${religion.practices.worship}</span>
                        <span class="practice-tag">Holy Days: ${religion.practices.holyDays}</span>
                        <span class="practice-tag">Dietary: ${religion.practices.dietary}</span>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    bindEvents() {
        // Tab switching — scoped to reference modal to avoid colliding with account-creation tabs
        document.getElementById('reference-modal')?.querySelectorAll('.reference-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Close button
        document.getElementById('reference-close-btn')?.addEventListener('click', () => {
            this.hideModal();
        });

        // Overlay click to close
        document.querySelector('.reference-modal-overlay')?.addEventListener('click', () => {
            this.hideModal();
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons — scoped to the reference modal only
        const modal = document.getElementById('reference-modal');
        if (!modal) return;

        modal.querySelectorAll('.reference-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update tab content
        modal.querySelectorAll('.reference-tab').forEach(tabContent => {
            tabContent.classList.toggle('active', tabContent.id === `${tab}-tab`);
        });
    }

    showModal() {
        const modal = document.getElementById('reference-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal() {
        const modal = document.getElementById('reference-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Create global instance
let ReferencePage = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    ReferencePage = new ReferencePageSystem();
});