/**
 * Nation Profile UI - Empires Game
 *
 * Rich nation detail page with bio, flag, policies, cities, military, resources, and history.
 */

const nationProfile = {
    nation: null,
    nationId: null,
    myNationId: null,
    isOwner: false,

    /**
     * Initialize nation profile UI
     */
    async init() {
        this.nationId = window.location.pathname.split('/').pop();
        if (this.nationId === 'profile') {
            // View own nation
            const data = await api.get('/api/web/user/nation');
            if (data?.nation) {
                this.nationId = data.nation.nation_id;
            }
        }

        await this.loadData();
        this.render();
    },

    /**
     * Load nation data
     */
    async loadData() {
        try {
            const [nationData, myData, rankingsData] = await Promise.all([
                api.get(`/api/web/nations/${this.nationId}`),
                api.get('/api/web/user/nation'),
                api.get('/api/web/rankings')
            ]);

            this.nation = nationData;

            if (myData?.nation) {
                this.myNationId = myData.nation.nation_id;
                this.isOwner = this.myNationId === this.nationId;
            }

            this.rankings = rankingsData || [];
        } catch (err) {
            console.error('Failed to load nation data:', err);
        }
    },

    /**
     * Render nation profile
     */
    render() {
        const container = document.getElementById('nation-profile');
        if (!container || !this.nation) return;

        container.innerHTML = `
            <div class="nation-profile-card">
                <div class="nation-header">
                    <div class="nation-header-content">
                        <div class="nation-flag-large" style="background: ${this.getColorHex(this.nation.national_color)}"></div>
                        <div class="nation-info">
                            <div class="nation-name-large">${esc(this.nation.nation_name)}</div>
                            <div class="nation-ruler">👑 ${esc(this.nation.ruler_name)} · 🏛️ ${this.getGovIcon(this.nation.government_type)} ${esc(this.nation.government_type)}</div>
                            ${this.nation.alliance_name ? `<div class="mt-2"><span class="badge bg-info">🤝 ${esc(this.nation.alliance_name)}</span></div>` : ''}
                        </div>
                        <div class="text-end">
                            <div class="fs-2 fw-bold text-gold">#${this.getRank()}</div>
                            <div class="text-muted small">Global Rank</div>
                        </div>
                    </div>
                </div>

                ${this.nation.bio ? `
                <div class="nation-bio">
                    <h5>📝 Nation Bio</h5>
                    <div class="nation-bio-text">${esc(this.nation.bio)}</div>
                </div>
                ` : ''}
            </div>
        `;

        // Hide action buttons if viewing own nation
        const actions = document.getElementById('nation-actions');
        if (actions && this.isOwner) {
            actions.innerHTML = `
                <a href="/cities" class="btn btn-gold">🏙️ Manage Cities</a>
                <a href="/military" class="btn btn-outline-light">⚔️ Military</a>
                <a href="/settings" class="btn btn-outline-secondary">⚙️ Settings</a>
            `;
        }

        this.renderStats();
        this.renderRankings();
        this.renderCities();
        this.renderMilitary();
        this.renderResources();
        this.renderPolicies();
        this.renderHistory();
    },

    /**
     * Render statistics
     */
    renderStats() {
        const container = document.getElementById('nation-stats');
        if (!container || !this.nation) return;

        container.innerHTML = `
            <div class="nation-stats-large">
                <div class="nation-stat-box">
                    <div class="stat-label">💰 Cash</div>
                    <div class="stat-value">$${fmtNum(this.nation.cash || 0)}</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">🌾 Infrastructure</div>
                    <div class="stat-value">${fmtNum(this.nation.total_infrastructure || 0)}</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">🏞️ Land</div>
                    <div class="stat-value">${fmtNum(this.nation.total_land || 0)}</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">👥 Population</div>
                    <div class="stat-value">${fmtNum(this.nation.total_population || 0)}</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">😊 Happiness</div>
                    <div class="stat-value">${this.nation.happiness || 0}%</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">🌱 Environment</div>
                    <div class="stat-value">${this.nation.environment || 0}%</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">🔬 Technology</div>
                    <div class="stat-value">${fmtNum(this.nation.technology || 0)}</div>
                </div>
                <div class="nation-stat-box">
                    <div class="stat-label">📊 Tax Rate</div>
                    <div class="stat-value">${Math.round((this.nation.tax_rate || 0) * 100)}%</div>
                </div>
            </div>
        `;
    },

    /**
     * Render rankings
     */
    renderRankings() {
        const container = document.getElementById('nation-rankings');
        if (!container || !this.nation) return;

        const rank = this.getRank();
        const myRanking = this.rankings.find(n => n.nation_id === this.nationId) || {};

        container.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <span>Overall Score</span>
                <span class="text-gold fw-bold">#${rank}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
                <span>Military Rank</span>
                <span>#${myRanking.military_rank || '-'}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
                <span>Economy Rank</span>
                <span>#${myRanking.economy_rank || '-'}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
                <span>Tech Rank</span>
                <span>#${myRanking.tech_rank || '-'}</span>
            </div>
            <hr class="border-secondary">
            <div class="d-flex justify-content-between">
                <span>Total Score</span>
                <span class="text-gold fw-bold">${fmtNum(this.nation.score || this.nation.nation_score || 0)}</span>
            </div>
        `;
    },

    /**
     * Render cities
     */
    renderCities() {
        const container = document.getElementById('nation-cities');
        const countEl = document.getElementById('city-count');
        if (!container || !this.nation) return;

        const cities = this.nation.cities || [];
        countEl.textContent = `${cities.length} cities`;

        if (cities.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary py-4">No cities</div>';
            return;
        }

        container.innerHTML = `
            <div class="row g-3">
                ${cities.map(city => `
                    <div class="col-md-6 col-lg-4">
                        <div class="city-card p-3 rounded" style="background: var(--bg-input);">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="fw-bold">${city.is_capital ? '🏛️' : '🏙️'} ${esc(city.city_name)}</div>
                                ${city.is_capital ? '<span class="badge bg-warning text-dark">Capital</span>' : ''}
                            </div>
                            <div class="row text-center small">
                                <div class="col-4">
                                    <div class="text-gold fw-bold">${fmtNum(city.infrastructure)}</div>
                                    <div class="text-muted">Infra</div>
                                </div>
                                <div class="col-4">
                                    <div class="text-gold fw-bold">${fmtNum(city.land)}</div>
                                    <div class="text-muted">Land</div>
                                </div>
                                <div class="col-4">
                                    <div class="text-gold fw-bold">${fmtNum(city.population)}</div>
                                    <div class="text-muted">Pop</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render military
     */
    renderMilitary() {
        const container = document.getElementById('nation-military');
        if (!container || !this.nation) return;

        const mil = this.nation.military || {};

        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">🏃 Ground Forces</h6>
                    <div class="d-flex justify-content-between py-2 border-bottom border-secondary">
                        <span>💂 Soldiers</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.soldiers || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2 border-bottom border-secondary">
                        <span>🛡️ Tanks</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.tanks || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2">
                        <span>🚀 Missiles</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.cruise_missiles || 0)}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">✈️ Air Force</h6>
                    <div class="d-flex justify-content-between py-2 border-bottom border-secondary">
                        <span>✈️ Fighters</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.fighters || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2 border-bottom border-secondary">
                        <span>🛫 Bombers</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.bombers || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2">
                        <span>☢️ Nuclear Weapons</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.nuclear_weapons || 0)}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">🚢 Navy</h6>
                    <div class="d-flex justify-content-between py-2 border-bottom border-secondary">
                        <span>🚤 Destroyers</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.destroyers || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2 border-bottom border-secondary">
                        <span>⚓ Submarines</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.submarines || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2">
                        <span>⚔️ Battleships</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.battleships || 0)}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">🕵️ Intelligence</h6>
                    <div class="d-flex justify-content-between py-2">
                        <span>🕵️ Spies</span>
                        <span class="text-gold fw-bold">${fmtNum(mil.spies || 0)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render resources
     */
    renderResources() {
        const container = document.getElementById('nation-resources');
        if (!container || !this.nation) return;

        const resources = this.nation.resources || {};

        container.innerHTML = `
            <div class="resource-bars-container">
                ${Object.entries(resources).map(([type, data]) => `
                    <div class="resource-bar-card">
                        <div class="resource-bar-header">
                            <span class="resource-bar-name">${this.getResourceIcon(type)} ${type}</span>
                            <span class="resource-bar-amount">${fmtNum(data.amount)}</span>
                        </div>
                        <div class="resource-bar-production">
                            +${fmtNum(data.production)}/tick
                            <span class="text-muted"> · ${fmtNum(data.capacity)} cap</span>
                        </div>
                        <div class="resource-bar-track">
                            <div class="resource-bar-fill" style="width: ${Math.min(100, (data.amount / data.capacity) * 100)}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render policies
     */
    renderPolicies() {
        const container = document.getElementById('nation-policies');
        if (!container || !this.nation) return;

        container.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background: var(--bg-input);">
                        <h6 class="text-muted mb-2">🏛️ Government</h6>
                        <div class="d-flex align-items-center gap-2">
                            <span>${this.getGovIcon(this.nation.government_type)}</span>
                            <span class="fw-bold">${esc(this.nation.government_type)}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background: var(--bg-input);">
                        <h6 class="text-muted mb-2">⛪ Religion</h6>
                        <div class="fw-bold">${esc(this.nation.religion_type || 'None')}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background: var(--bg-input);">
                        <h6 class="text-muted mb-2">⚔️ War Policy</h6>
                        <div class="fw-bold">${esc(this.nation.war_policy_type)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background: var(--bg-input);">
                        <h6 class="text-muted mb-2">🏠 Domestic Policy</h6>
                        <div class="fw-bold">${esc(this.nation.domestic_policy_type)}</div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background: var(--bg-input);">
                        <h6 class="text-muted mb-2">💰 Resources</h6>
                        <div>
                            <span class="badge bg-info">${esc(this.nation.resource_1)}</span>
                            ${this.nation.resource_2 ? `<span class="badge bg-secondary">${esc(this.nation.resource_2)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 rounded" style="background: var(--bg-input);">
                        <h6 class="text-muted mb-2">🎨 Flag Color</h6>
                        <span class="color-sphere-lg" style="background: ${this.getColorHex(this.nation.national_color)}"></span>
                        <span class="ms-2">${esc(this.nation.national_color)}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render history
     */
    renderHistory() {
        const container = document.getElementById('nation-history');
        if (!container || !this.nation) return;

        const history = this.nation.history || [];

        if (history.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary py-4">No history recorded yet</div>';
            return;
        }

        container.innerHTML = `
            <div class="timeline">
                ${history.map((h, i) => `
                    <div class="timeline-item ${i % 2 === 0 ? 'left' : 'right'}">
                        <div class="timeline-content">
                            <div class="timeline-year">${esc(h.year)}</div>
                            <div class="timeline-event">${esc(h.event)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Get nation rank
     */
    getRank() {
        if (!this.rankings || this.rankings.length === 0) return '-';
        const index = this.rankings.findIndex(n => n.nation_id === this.nationId);
        return index >= 0 ? index + 1 : '-';
    },

    /**
     * Get color hex
     */
    getColorHex(color) {
        const colors = {
            BLUE: '#0d6efd', RED: '#dc3545', GREEN: '#198754', PURPLE: '#6f42c1',
            ORANGE: '#fd7e14', TEAL: '#20c997', PINK: '#d63384', WHITE: '#adb5bd', BLACK: '#212529'
        };
        return colors[color] || '#6c757d';
    },

    /**
     * Get government icon
     */
    getGovIcon(gov) {
        const icons = {
            DEMOCRACY: '🗳️', REPUBLIC: '🏛️', MONARCHY: '👑', DICTATORSHIP: '👿',
            FASCISM: '⚡', COMMUNIST: '🔨', THEOCRACY: '⛪', CAPITALIST: '💵'
        };
        return icons[gov] || '🏛️';
    },

    /**
     * Get resource icon
     */
    getResourceIcon(type) {
        const icons = {
            GRAIN: '🌾', TIMBER: '🪵', FISH: '🐟', IRON: '🔩', COAL: '⚫',
            OIL: '🛢️', GOLD: '🪙', URANIUM: '☢️', TITANIUM: '🔷'
        };
        return icons[type] || '📦';
    },

    /**
     * Toggle espionage view
     */
    toggleEspionage() {
        showToast('Espionage report coming soon!', 'info');
    }
};

// Helper functions
function fmtNum(n) {
    if (!n && n !== 0) return '-';
    return Number(n).toLocaleString();
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// Toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:70px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
    return container;
}

// Add timeline styles
const style = document.createElement('style');
style.textContent = `
    .timeline {
        position: relative;
        padding: 20px 0;
    }
    .timeline::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--border-color);
    }
    .timeline-item {
        position: relative;
        width: 50%;
        padding: 10px 20px;
    }
    .timeline-item.left {
        left: 0;
        text-align: right;
    }
    .timeline-item.right {
        left: 50%;
        text-align: left;
    }
    .timeline-item::before {
        content: '';
        position: absolute;
        top: 20px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--accent-primary);
    }
    .timeline-item.left::before {
        right: -6px;
    }
    .timeline-item.right::before {
        left: -6px;
    }
    .timeline-year {
        font-size: 0.8rem;
        color: var(--accent-primary);
        font-weight: 700;
    }
    .timeline-event {
        font-size: 0.9rem;
        color: var(--text-primary);
    }
    .city-card {
        transition: all 0.15s;
    }
    .city-card:hover {
        border-color: var(--accent-primary);
    }
    .toast {
        padding: 12px 16px;
        border-radius: 8px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-lg);
    }
    .toast-success { border-left: 3px solid var(--accent-success); }
    .toast-error { border-left: 3px solid var(--accent-danger); }
    .toast-info { border-left: 3px solid var(--accent-info); }
`;
document.head.appendChild(style);