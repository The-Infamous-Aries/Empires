/**
 * Resource Bars System - Empires Game
 *
 * Visual resource indicators showing resource levels with production rates.
 */

const resourceBars = {
    resources: [],
    nation: null,

    /**
     * Initialize resource bars
     */
    async init() {
        const container = document.getElementById('resource-bars-container');
        if (!container) return;

        await this.loadResources();
        this.render();
    },

    /**
     * Load resource data from API — real data only, no demo fallback
     */
    async loadResources() {
        try {
            const nationData = await api.get('/api/web/user/nation');
            if (nationData && nationData.nation) {
                this.nation = nationData.nation;
                const resourcesData = await api.get('/api/web/user/resources');
                if (resourcesData?.resources && Object.keys(resourcesData.resources).length > 0) {
                    this.resources = resourcesData.resources;
                } else {
                    // Empty nation — show zeroes for its resource types
                    this.resources = {};
                    const r1 = this.nation.resource_1;
                    const r2 = this.nation.resource_2;
                    if (r1) this.resources[r1] = { amount: 0, capacity: 50000, production: 0 };
                    if (r2) this.resources[r2] = { amount: 0, capacity: 50000, production: 0 };
                    this.resources['CASH'] = {
                        amount: this.nation.cash || 0,
                        capacity: 1e9,
                        production: 0
                    };
                }
            }
        } catch (err) {
            console.error('Failed to load resources:', err);
            this.resources = {};
        }
    },

    /**
     * Get default resources based on nation type
     */
    getDefaultResources() {
        const defaults = {
            GRAIN: { amount: 10000, capacity: 50000, production: 500 },
            TIMBER: { amount: 8000, capacity: 40000, production: 400 },
            FISH: { amount: 6000, capacity: 30000, production: 300 },
            LIVESTOCK: { amount: 5000, capacity: 25000, production: 250 },
            COAL: { amount: 4000, capacity: 20000, production: 200 },
            IRON: { amount: 3000, capacity: 15000, production: 150 },
            COPPER: { amount: 2500, capacity: 12000, production: 125 },
            LIMESTONE: { amount: 2000, capacity: 10000, production: 100 },
            OIL: { amount: 1500, capacity: 8000, production: 75 },
            LEAD: { amount: 1000, capacity: 5000, production: 50 },
            SPICES: { amount: 800, capacity: 4000, production: 40 },
            GOLD: { amount: 500, capacity: 3000, production: 25 },
            GEMSTONES: { amount: 200, capacity: 1000, production: 10 },
            TITANIUM: { amount: 100, capacity: 500, production: 5 },
            URANIUM: { amount: 50, capacity: 250, production: 2 }
        };
        return defaults;
    },

    /**
     * Get resource icon
     */
    getResourceIcon(type) {
        const icons = {
            GRAIN: '🌾', TIMBER: '🪵', FISH: '🐟', LIVESTOCK: '🐄',
            COAL: '⚫', IRON: '🔩', COPPER: '🥉', LIMESTONE: '🪨',
            OIL: '🛢️', LEAD: '◼', SPICES: '🌶️', GOLD: '🪙',
            GEMSTONES: '💎', TITANIUM: '🔷', URANIUM: '☢️'
        };
        return icons[type] || '📦';
    },

    /**
     * Get resource color class
     */
    getResourceColor(type) {
        const colors = {
            GOLD: 'gold-resource',
            GEMSTONES: 'gem-resource',
            URANIUM: 'uranium-resource',
            IRON: 'iron-resource',
            TITANIUM: 'titanium-resource',
            OIL: 'oil-resource'
        };
        return colors[type] || '';
    },

    /**
     * Render resource bars
     */
    render() {
        const container = document.getElementById('resource-bars-container');
        if (!container || !this.nation) return;

        // Get resource types from nation
        const resourceTypes = [this.nation.resource_1, this.nation.resource_2].filter(Boolean);
        const resourceData = resourceTypes.map(type => ({
            type,
            ...this.resources[type] || this.getDefaultResources()[type] || { amount: 0, capacity: 1000, production: 0 }
        }));

        // Add money as first resource — use production value from server (computed via real formula)
        const cashData = this.resources['CASH'] || {};
        resourceData.unshift({
            type: 'CASH',
            amount: this.nation.cash || 0,
            capacity: cashData.capacity || 100000000,
            production: cashData.production || 0
        });

        container.innerHTML = resourceData.map(r => {
            const percent = Math.min(100, (r.amount / r.capacity) * 100);
            const isOverflow = r.amount > r.capacity;
            const icon = r.type === 'CASH' ? '💰' : this.getResourceIcon(r.type);
            const colorClass = this.getResourceColor(r.type);

            return `
                <div class="resource-bar-card ${colorClass}">
                    <div class="resource-bar-header">
                        <span class="resource-bar-name">${icon} ${r.type}</span>
                        <span class="resource-bar-amount">${fmtNum(Math.floor(r.amount))}</span>
                    </div>
                    <div class="resource-bar-production">
                        ${r.production > 0 ? '+' : ''}${fmtNum(r.production)}/tick
                        <span class="text-muted"> · ${fmtNum(r.capacity)} cap</span>
                    </div>
                    <div class="resource-bar-track">
                        <div class="resource-bar-fill ${isOverflow ? 'overflow' : ''}"
                             style="width: ${percent}%"
                             data-resource-type="${r.type}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// Helper functions
function fmtNum(n) {
    if (!n && n !== 0) return '-';
    return Number(n).toLocaleString();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('resource-bars-container')) {
        resourceBars.init();
    }
});