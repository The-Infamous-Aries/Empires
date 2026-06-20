/**
 * Military Management UI - Empires Game
 *
 * UI for purchasing units and viewing army composition.
 */

const military = {
    military: null,
    nation: null,
    unitPrices: {},

    /**
     * Initialize military management UI
     */
    async init() {
        const section = document.getElementById('military-management-section');
        if (!section) return;

        await this.loadMilitary();
    },

    /**
     * Load military data
     */
    async loadMilitary() {
        try {
            const [data, pricesData] = await Promise.all([
                api.get('/api/web/user/nation'),
                api.get('/api/web/military/prices')
            ]);
            if (data && data.nation) {
                this.nation = data.nation;
                this.unitPrices = pricesData?.prices || {};

                const militaryData = await api.get('/api/web/user/military');
                this.military = militaryData?.military || this.getEmptyMilitary();

                this.renderMilitaryOverview();
                this.renderUnitList();
            }
        } catch (err) {
            console.error('Failed to load military:', err);
        }
    },

    /**
     * Get empty military object
     */
    getEmptyMilitary() {
        return {
            soldiers: 0, tanks: 0, fighters: 0, bombers: 0,
            destroyers: 0, cruisers: 0, battleships: 0, carriers: 0, submarines: 0,
            cruise_missiles: 0, nuclear_weapons: 0, spies: 0,
            soldier_cap: 0, tank_cap: 0, aircraft_cap: 0, ship_cap: 0,
            missile_cap: 0, nuke_cap: 0, spy_cap: 0
        };
    },

    /**
     * Render military overview
     */
    renderMilitaryOverview() {
        const container = document.getElementById('military-overview');
        if (!container) return;

        const totalUnits = this.military.soldiers + this.military.tanks + this.military.fighters +
                          this.military.bombers + this.military.destroyers + this.military.cruisers +
                          this.military.battleships + this.military.carriers + this.military.submarines +
                          this.military.cruise_missiles + this.military.nuclear_weapons + this.military.spies;

        container.innerHTML = `
            <div class="military-stats">
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(totalUnits)}</div>
                    <div class="stat-label">Total Units</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.soldiers)}</div>
                    <div class="stat-label">Soldiers</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.tanks)}</div>
                    <div class="stat-label">Tanks</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.fighters + this.military.bombers)}</div>
                    <div class="stat-label">Aircraft</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.destroyers + this.military.cruisers + this.military.battleships + this.military.carriers + this.military.submarines)}</div>
                    <div class="stat-label">Ships</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.cruise_missiles)}</div>
                    <div class="stat-label">Missiles</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.nuclear_weapons)}</div>
                    <div class="stat-label">Nuclear</div>
                </div>
                <div class="city-stat-box">
                    <div class="stat-value">${fmtNum(this.military.spies)}</div>
                    <div class="stat-label">Spies</div>
                </div>
            </div>
        `;
    },

    /**
     * Render unit list with purchase buttons
     */
    renderUnitList() {
        const container = document.getElementById('military-units-list');
        if (!container) return;

        const units = [
            { key: 'soldiers', name: 'Soldiers', icon: '💂', desc: 'Basic infantry unit', capKey: 'soldier_cap' },
            { key: 'tanks', name: 'Tanks', icon: '🛡️', desc: 'Armored ground units', capKey: 'tank_cap' },
            { key: 'fighters', name: 'Fighters', icon: '✈️', desc: 'Air superiority', capKey: 'aircraft_cap' },
            { key: 'bombers', name: 'Bombers', icon: '🛫', desc: 'Strategic bombing', capKey: 'aircraft_cap' },
            { key: 'destroyers', name: 'Destroyers', icon: '🚤', desc: 'Fast escort ships', capKey: 'ship_cap' },
            { key: 'submarines', name: 'Submarines', icon: '⚓', desc: 'Underwater stealth', capKey: 'ship_cap' },
            { key: 'cruisers', name: 'Cruisers', icon: '🚢', desc: 'Heavy naval units', capKey: 'ship_cap' },
            { key: 'battleships', name: 'Battleships', icon: '⚔️', desc: 'Capital ships', capKey: 'ship_cap' },
            { key: 'carriers', name: 'Carriers', icon: '🛳️', desc: 'Aircraft carriers', capKey: 'ship_cap' },
            { key: 'cruise_missiles', name: 'Missiles', icon: '🚀', desc: 'Guided missiles', capKey: 'missile_cap' },
            { key: 'spies', name: 'Spies', icon: '🕵️', desc: 'Espionage agents', capKey: 'spy_cap' },
            { key: 'nuclear_weapons', name: 'Nuclear', icon: '☢️', desc: 'Strategic weapons', capKey: 'nuke_cap' }
        ];

        container.innerHTML = units.map(unit => {
            const count = this.military[unit.key] || 0;
            const cap = this.military[unit.capKey] || 0;
            const price = this.getUnitPrice(unit.key);
            const canAfford = this.nation.cash >= price;
            const atCap = count >= cap;
            const btnDisabled = !canAfford || atCap;

            return `
                <div class="military-unit-row" data-unit="${unit.key}">
                    <div class="military-unit-info">
                        <div class="military-unit-icon ${unit.key}">${unit.icon}</div>
                        <div>
                            <div class="military-unit-name">${unit.name}</div>
                            <div class="military-unit-cap">${count.toLocaleString()} / ${fmtNum(cap)} ${unit.desc}</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span class="military-unit-count">${fmtNum(count)}</span>
                        <span style="color:var(--text-muted); font-size:0.75rem;">$${fmtNum(price)}</span>
                        <button class="military-buy-btn" onclick="military.buyUnit('${unit.key}')"
                                ${btnDisabled ? 'disabled' : ''}>
                            Buy
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Get unit price (considering resource bonuses)
     */
    getUnitPrice(unitKey) {
        return this.unitPrices[unitKey] || 0;
    },

    /**
     * Buy a unit
     */
    async buyUnit(unitKey) {
        const price = this.getUnitPrice(unitKey);

        if (this.nation.cash < price) {
            alert('Not enough cash!');
            return;
        }

        const capKey = this.getCapKey(unitKey);
        if (this.military[unitKey] >= this.military[capKey]) {
            alert('Unit cap reached!');
            return;
        }

        try {
            const resp = await api.post('/api/web/military/buy', {
                unit_type: unitKey,
                amount: 1
            });

            if (resp.success) {
                this.nation.cash -= price;
                this.military[unitKey]++;
                this.renderMilitaryOverview();
                this.renderUnitList();
            }
        } catch (err) {
            console.error('Failed to buy unit:', err);
            alert('Failed to purchase unit');
        }
    },

    /**
     * Get cap key for unit
     */
    getCapKey(unitKey) {
        const capKeys = {
            soldiers: 'soldier_cap',
            tanks: 'tank_cap',
            fighters: 'aircraft_cap',
            bombers: 'aircraft_cap',
            destroyers: 'ship_cap',
            cruisers: 'ship_cap',
            battleships: 'ship_cap',
            carriers: 'ship_cap',
            submarines: 'ship_cap',
            cruise_missiles: 'missile_cap',
            nuclear_weapons: 'nuke_cap',
            spies: 'spy_cap'
        };
        return capKeys[unitKey] || 'soldier_cap';
    },

    /**
     * Recruit soldiers (bulk purchase)
     */
    async recruitSoldiers() {
        const amount = 100;
        const price = amount * this.getUnitPrice('soldiers');

        if (this.nation.cash < price) {
            alert('Not enough cash!');
            return;
        }

        if (this.military.soldiers + amount > this.military.soldier_cap) {
            alert('Would exceed soldier cap!');
            return;
        }

        try {
            const resp = await api.post('/api/web/military/buy', {
                unit_type: 'soldiers',
                amount: amount
            });

            if (resp.success) {
                this.nation.cash -= price;
                this.military.soldiers += amount;
                this.renderMilitaryOverview();
                this.renderUnitList();
                alert(`Recruited ${amount} soldiers!`);
            }
        } catch (err) {
            console.error('Failed to recruit soldiers:', err);
            alert('Failed to recruit soldiers');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    military.init();
});