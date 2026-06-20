/**
 * City Management UI - Empires Game
 *
 * UI for buying/selling infrastructure and land in cities.
 */

const cityManagement = {
    nation: null,
    cities: [],
    infraPrices: {},
    landPrices: {},

    /**
     * Initialize city management UI
     */
    async init() {
        const section = document.getElementById('city-management-section');
        if (!section) return;

        await this.loadData();
        this.render();
    },

    /**
     * Load city and pricing data
     */
    async loadData() {
        try {
            const [nationData, _prices] = await Promise.all([
                api.get('/api/web/user/nation'),
                api.get('/api/web/user/cities'),
            ]);
            if (nationData && nationData.nation) {
                this.nation = nationData.nation;
                const citiesData = _prices;
                this.cities = citiesData?.cities || [];
                // Prices come from server-side real formulas on each buy/sell action
                // We display per-unit cost returned by the server after each purchase
                this.infraPrice = null;
                this.landPrice = null;
            }
        } catch (err) {
            console.error('Failed to load city data:', err);
        }
    },

    /**
     * Render city management UI
     */
    render() {
        const section = document.getElementById('city-management-section');
        if (!section) return;

        const content = document.getElementById('city-management-body');
        if (!content) return;

        // Add pricing info header — prices calculated server-side via real formulas
        content.innerHTML = `
            <div class="city-pricing-info mb-4 p-3 rounded" style="background: var(--bg-input);">
                <div class="row">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-primary">💰</span>
                            <span><strong>Infrastructure:</strong> <em class="text-muted">price varies by level</em></span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-success">🏞</span>
                            <span><strong>Land:</strong> <em class="text-muted">price varies by level</em></span>
                        </div>
                    </div>
                    <div class="col-md-6 text-md-end mt-2 mt-md-0">
                        <span class="text-secondary">
                            Cash: <strong class="text-gold">$${fmtNum(this.nation?.cash || 0)}</strong>
                        </span>
                    </div>
                </div>
            </div>
            <div class="city-cards-container">
                ${this.cities.length > 0 ? this.renderCityCards() : '<div class="text-center text-secondary py-4">No cities found</div>'}
            </div>
        `;
    },

    /**
     * Render individual city cards
     */
    renderCityCards() {
        return this.cities.map(city => {
            return `
                <div class="city-management-card mb-3">
                    <div class="city-card-header">
                        <h5>🏙️ ${esc(city.city_name || 'City')}</h5>
                        ${city.is_capital ? '<span class="badge bg-warning">Capital</span>' : ''}
                    </div>
                    <div class="city-stats-grid">
                        <div class="city-stat-box">
                            <div class="stat-value">${fmtNum(city.infrastructure || 0)}</div>
                            <div class="stat-label">Infrastructure</div>
                        </div>
                        <div class="city-stat-box">
                            <div class="stat-value">${fmtNum(city.land || 0)}</div>
                            <div class="stat-label">Land</div>
                        </div>
                        <div class="city-stat-box">
                            <div class="stat-value">${fmtNum(city.population || 0)}</div>
                            <div class="stat-label">Population</div>
                        </div>
                        <div class="city-stat-box">
                            <div class="stat-value">${city.happiness || 0}</div>
                            <div class="stat-label">Happiness</div>
                        </div>
                        <div class="city-stat-box">
                            <div class="stat-value">${Math.round(city.environment || 0)}%</div>
                            <div class="stat-label">Environment</div>
                        </div>
                    </div>
                    <div class="city-actions">
                        <button class="btn btn-gold btn-sm"
                                onclick="cityManagement.buyInfra('${city.city_id}')"
                                title="Price calculated server-side via real formula">
                            🏗️ Buy Infra (+1)
                        </button>
                        <button class="btn btn-outline-danger btn-sm"
                                onclick="cityManagement.sellInfra('${city.city_id}')"
                                ${!city.infrastructure ? 'disabled' : ''}
                                title="Sell one infrastructure">
                            🔨 Sell Infra (-1)
                        </button>
                        <button class="btn btn-gold btn-sm"
                                onclick="cityManagement.buyLand('${city.city_id}')"
                                title="Price calculated server-side via real formula">
                            🏞️ Buy Land (+1)
                        </button>
                        <button class="btn btn-outline-danger btn-sm"
                                onclick="cityManagement.sellLand('${city.city_id}')"
                                ${!city.land ? 'disabled' : ''}
                                title="Sell one land">
                            🪓 Sell Land (-1)
                        </button>
                        <button class="btn btn-outline-primary btn-sm"
                                onclick="cityManagement.buildImprovement('${city.city_id}')"
                                title="Build improvement">
                            🏢 Improvement
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Buy infrastructure in a city
     */
    async buyInfra(cityId) {
        try {
            const resp = await api.post('/api/web/city/infra', {
                city_id: cityId,
                action: 'buy',
                amount: 1
            });

            if (resp?.success) {
                const city = this.cities.find(c => c.city_id === cityId);
                if (city) city.infrastructure++;
                this.nation.cash -= resp.cost;
                this.render();
                showToast(`Infrastructure purchased for $${fmtNum(resp.cost)}`, 'success');
            } else {
                showToast(resp?.message || 'Failed to buy infrastructure', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to buy infrastructure', 'error');
        }
    },

    async sellInfra(cityId) {
        try {
            const resp = await api.post('/api/web/city/infra', {
                city_id: cityId,
                action: 'sell',
                amount: 1
            });

            if (resp?.success) {
                const city = this.cities.find(c => c.city_id === cityId);
                if (city) city.infrastructure--;
                this.nation.cash += resp.refund;
                this.render();
                showToast(`Infrastructure sold for $${fmtNum(resp.refund)}`, 'success');
            } else {
                showToast(resp?.message || 'Failed to sell infrastructure', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to sell infrastructure', 'error');
        }
    },

    async buyLand(cityId) {
        try {
            const resp = await api.post('/api/web/city/land', {
                city_id: cityId,
                action: 'buy',
                amount: 1
            });

            if (resp?.success) {
                const city = this.cities.find(c => c.city_id === cityId);
                if (city) city.land++;
                this.nation.cash -= resp.cost;
                this.render();
                showToast(`Land purchased for $${fmtNum(resp.cost)}`, 'success');
            } else {
                showToast(resp?.message || 'Failed to buy land', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to buy land', 'error');
        }
    },

    async sellLand(cityId) {
        try {
            const resp = await api.post('/api/web/city/land', {
                city_id: cityId,
                action: 'sell',
                amount: 1
            });

            if (resp?.success) {
                const city = this.cities.find(c => c.city_id === cityId);
                if (city) city.land--;
                this.nation.cash += resp.refund;
                this.render();
                showToast(`Land sold for $${fmtNum(resp.refund)}`, 'success');
            } else {
                showToast(resp?.message || 'Failed to sell land', 'error');
            }
        } catch (err) {
            showToast(err.message || 'Failed to sell land', 'error');
        }
    },

    /**
     * Build improvement in a city
     */
    async buildImprovement(cityId) {
        showToast('Improvement selection coming soon!', 'info');
    }
};

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-message">${esc(message)}</span>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('city-management-section')) {
        cityManagement.init();
    }
});