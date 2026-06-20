const createPreview = {
    data: null,

    async init() {
        try {
            const resp = await api.get('/api/web/game-data');
            if (resp) this.data = resp;
        } catch (e) {
            console.error('Failed to load game data', e);
        }
        this._bind();
        this.updateAll();
    },

    _bind() {
        const ids = ['ce-gov', 'ce-war-policy', 'ce-dom-policy', 'ce-resource'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.updateAll());
        });
        document.querySelectorAll('#ce-name, #ce-ruler, #ce-capital').forEach(el => {
            el.addEventListener('input', () => this.updateAll());
        });
    },

    updateAll() {
        this._updateGovPreview();
        this._updateWarPolicyPreview();
        this._updateDomPolicyPreview();
        this._updateResourcePreview();
        this._updateSummaryPreview();
    },

    _fmtPct(val) {
        if (val === 0) return '0%';
        const pct = Math.abs(val) < 1 ? Math.round(val * 100) : Math.round(val);
        const sign = val > 0 ? '+' : '';
        return sign + pct + '%';
    },

    _fmtVal(val) {
        if (val === 0) return '0';
        const sign = val > 0 ? '+' : '';
        return sign + val;
    },

    _bonusRow(icon, label, value, isNegative) {
        if (!value || value === '0' || value === '0%') return '';
        const cls = isNegative ? 'text-danger' : 'text-success';
        return `<div class="small ${cls}"><span class="me-1">${icon}</span>${label}: <strong>${value}</strong></div>`;
    },

    _govBonuses(gov) {
        if (!gov) return '<div class="text-muted small">Select a government</div>';
        let html = `<div class="fw-semibold mb-1" style="font-size:.95rem">${gov.name}</div>`;
        html += '<div class="d-flex flex-wrap gap-x-3 gap-y-1">';
        html += this._bonusRow('💰', 'Tax Income', this._fmtPct(gov.income_bonus), gov.income_bonus < 0);
        html += this._bonusRow('⚔️', 'Military', this._fmtPct(gov.military_bonus), gov.military_bonus < 0);
        html += this._bonusRow('😊', 'Happiness', this._fmtVal(gov.happiness_bonus), gov.happiness_bonus < 0);
        html += this._bonusRow('👥', 'Pop Growth', this._fmtPct(gov.population_bonus), gov.population_bonus < 0);
        html += this._bonusRow('🔧', 'Upkeep', this._fmtPct(-gov.upkeep_reduction), gov.upkeep_reduction < 0);
        html += this._bonusRow('💸', 'Costs', this._fmtPct(-gov.cost_reduction), gov.cost_reduction < 0);
        html += this._bonusRow('🏪', 'Commerce', this._fmtPct(gov.commerce_bonus), gov.commerce_bonus < 0);
        html += this._bonusRow('👤', 'Citizen Income', this._fmtPct(gov.citizen_income_bonus), gov.citizen_income_bonus < 0);
        html += '</div>';
        if (gov.description) html += `<div class="text-muted small mt-1">${gov.description}</div>`;
        return html;
    },

    _updateGovPreview() {
        const el = document.getElementById('ce-gov-details');
        if (!el) return;
        const val = document.getElementById('ce-gov')?.value;
        const gov = this.data?.governments?.[val];
        el.innerHTML = gov
            ? `<div class="p-3 rounded" style="background:var(--bg-input);border:1px solid var(--border-color)">${this._govBonuses(gov)}</div>`
            : '<div class="text-muted small p-2">Select a government to see bonuses</div>';
    },

    _policyBonuses(data, type) {
        if (!data) return '<div class="text-muted small">Select an option</div>';
        const lines = [];
        if (data.description) lines.push(`<div class="text-muted small mb-1">${data.description}</div>`);
        const bonusDefs = {
            domestic: [
                { k: 'tax_income_bonus', icon: '💰', label: 'Tax Income' },
                { k: 'commerce_income_bonus', icon: '🏪', label: 'Commerce' },
                { k: 'trade_income_bonus', icon: '🚢', label: 'Trade' },
                { k: 'citizen_income_bonus', icon: '👤', label: 'Citizen Income', raw: true },
                { k: 'infrastructure_cost_bonus', icon: '🔨', label: 'Infra Cost', neg: true },
                { k: 'improvement_cost_bonus', icon: '🏗️', label: 'Improv Cost', neg: true },
                { k: 'improvement_upkeep_bonus', icon: '🔧', label: 'Improv Upkeep', neg: true },
                { k: 'project_cost_bonus', icon: '📋', label: 'Project Cost', neg: true },
                { k: 'wonder_cost_bonus', icon: '🏛️', label: 'Wonder Cost', neg: true },
                { k: 'land_cost_bonus', icon: '🗺️', label: 'Land Cost', neg: true },
                { k: 'new_city_cost_bonus', icon: '🏙️', label: 'City Cost', neg: true },
                { k: 'food_production_bonus', icon: '🌾', label: 'Food Prod' },
                { k: 'manufacturing_output_bonus', icon: '🏭', label: 'Manufacturing' },
                { k: 'technology_cost_bonus', icon: '🎓', label: 'Tech Cost', neg: true },
                { k: 'tech_income_bonus', icon: '💡', label: 'Tech Income' },
                { k: 'military_unit_cap_bonus', icon: '⚔️', label: 'Unit Cap' },
                { k: 'soldier_upkeep_bonus', icon: '🛡️', label: 'Soldier Upkeep', neg: true },
                { k: 'soldier_efficiency_bonus', icon: '🎯', label: 'Soldier Eff' },
                { k: 'population_growth_bonus', icon: '👥', label: 'Pop Growth' },
                { k: 'happiness_bonus', icon: '😊', label: 'Happiness', raw: true },
                { k: 'pollution_bonus', icon: '🌫️', label: 'Pollution', raw: true, rev: true },
                { k: 'environment_bonus', icon: '🌿', label: 'Environment', raw: true },
                { k: 'power_plant_efficiency_bonus', icon: '⚡', label: 'Plant Eff' },
                { k: 'disease_bonus', icon: '🏥', label: 'Disease', raw: true, rev: true },
                { k: 'import_export_fees_bonus', icon: '📦', label: 'Trade Fees', neg: true },
                { k: 'resource_market_fees_bonus', icon: '📊', label: 'Market Fees', neg: true },
                { k: 'spy_defense_bonus', icon: '🕵️', label: 'Spy Defense' },
                { k: 'war_score_gain_bonus', icon: '📈', label: 'War Score' },
                { k: 'war_happiness_penalty_reduction', icon: '🤝', label: 'War Happy Penalty' },
            ],
            war: [
                { k: 'attack_damage_bonus', icon: '🔥', label: 'Attack Dmg' },
                { k: 'first_strike_bonus', icon: '⚡', label: 'First Strike' },
                { k: 'offensive_bonus', icon: '⚔️', label: 'Offense' },
                { k: 'defensive_bonus', icon: '🛡️', label: 'Defense' },
                { k: 'ground_defense_bonus', icon: '🌍', label: 'Ground Def' },
                { k: 'city_resistance_bonus', icon: '🏰', label: 'Resistance', raw: true },
                { k: 'soldier_efficiency_bonus', icon: '🎯', label: 'Soldier Eff' },
                { k: 'soldier_casualties_dealt_bonus', icon: '💀', label: 'Casualties Dealt' },
                { k: 'soldier_casualties_taken_bonus', icon: '🩸', label: 'Casualties Taken', rev: true },
                { k: 'war_score_gain_bonus', icon: '📈', label: 'War Score' },
                { k: 'war_score_loss_reduction', icon: '📉', label: 'Score Loss Red' },
                { k: 'loot_bonus', icon: '💰', label: 'Loot' },
                { k: 'resource_steal_bonus', icon: '📦', label: 'Resource Steal' },
                { k: 'infrastructure_damage_bonus', icon: '🏗️', label: 'Infra Dmg', rev: true },
                { k: 'peace_deal_bonus', icon: '🤝', label: 'Peace Bonus' },
                { k: 'spy_defense_bonus', icon: '🕵️', label: 'Spy Defense' },
                { k: 'spy_operations_bonus', icon: '🕵️', label: 'Spy Ops' },
                { k: 'enemy_spy_operations_reduction', icon: '🚫', label: 'Enemy Spy' },
                { k: 'nuke_damage_bonus', icon: '☢️', label: 'Nuke Dmg' },
                { k: 'airstrike_damage_bonus', icon: '✈️', label: 'Airstrike' },
                { k: 'aircraft_losses_bonus', icon: '🛩️', label: 'Aircraft Loss', neg: true },
                { k: 'dogfight_bonus', icon: '⚔️', label: 'Dogfight' },
                { k: 'missile_damage_bonus', icon: '🚀', label: 'Missile Dmg' },
                { k: 'naval_battle_bonus', icon: '🚢', label: 'Naval Battle' },
                { k: 'ship_efficiency_bonus', icon: '⚓', label: 'Ship Eff' },
                { k: 'enemy_happiness_damage', icon: '😱', label: 'Enemy Happy', raw: true },
                { k: 'blockade_duration_bonus', icon: '⛓️', label: 'Blockade' },
                { k: 'beige_duration_reduction', icon: '🛡️', label: 'Beige Time', neg: true },
                { k: 'war_declaration_cost_bonus', icon: '💸', label: 'Declare Cost', rev: true },
                { k: 'resistance_recovery_bonus', icon: '❤️', label: 'Resist Recovery' },
                { k: 'global_condemnation_bonus', icon: '⚠️', label: 'Condemnation', rev: true },
            ],
            resource: [
                { k: 'citizen_income_bonus', icon: '👤', label: 'Citizen Income', raw: true },
                { k: 'commerce_income_bonus', icon: '🏪', label: 'Commerce' },
                { k: 'infrastructure_cost_bonus', icon: '🔨', label: 'Infra Cost', neg: true },
                { k: 'infrastructure_upkeep_bonus', icon: '🔧', label: 'Infra Upkeep', neg: true },
                { k: 'improvement_upkeep_bonus', icon: '🏗️', label: 'Improv Upkeep', neg: true },
                { k: 'land_cost_bonus', icon: '🗺️', label: 'Land Cost', neg: true },
                { k: 'wonder_cost_bonus', icon: '🏛️', label: 'Wonder Cost', neg: true },
                { k: 'project_cost_bonus', icon: '📋', label: 'Project Cost', neg: true },
                { k: 'technology_cost_bonus', icon: '🎓', label: 'Tech Cost', neg: true },
                { k: 'soldier_upkeep_bonus', icon: '🛡️', label: 'Soldier Upkeep', neg: true },
                { k: 'soldier_efficiency_bonus', icon: '🎯', label: 'Soldier Eff' },
                { k: 'tank_cost_bonus', icon: '🔩', label: 'Tank Cost', neg: true },
                { k: 'tank_efficiency_bonus', icon: '🎯', label: 'Tank Eff' },
                { k: 'aircraft_cost_bonus', icon: '✈️', label: 'Aircraft Cost', neg: true },
                { k: 'aircraft_upkeep_bonus', icon: '🔧', label: 'Aircraft Upkeep', neg: true },
                { k: 'ship_cost_bonus', icon: '🚢', label: 'Ship Cost', neg: true },
                { k: 'ship_upkeep_bonus', icon: '🔧', label: 'Ship Upkeep', neg: true },
                { k: 'missile_cost_bonus', icon: '🚀', label: 'Missile Cost', neg: true },
                { k: 'happiness_bonus', icon: '😊', label: 'Happiness', raw: true },
                { k: 'population_growth_bonus', icon: '👥', label: 'Pop Growth' },
                { k: 'citizen_percentage_bonus', icon: '👤', label: 'Citizens' },
                { k: 'disease_bonus', icon: '🏥', label: 'Disease', raw: true, rev: true },
                { k: 'environment_bonus', icon: '🌿', label: 'Environment', raw: true },
                { k: 'hospital_effectiveness_bonus', icon: '🏥', label: 'Hospital Eff' },
                { k: 'agricultural_production_bonus', icon: '🌾', label: 'Agri Prod' },
            ],
        };
        const defs = bonusDefs[type] || [];
        let hasBonuses = false;
        defs.forEach(def => {
            let raw = data[def.k];
            if (raw === undefined || raw === null || raw === 0) return;
            let display;
            if (def.raw) {
                display = this._fmtVal(def.rev ? -raw : raw);
            } else {
                const val = def.rev ? -raw : raw;
                display = this._fmtPct(def.neg ? -val : val);
            }
            hasBonuses = true;
            lines.push(this._bonusRow(def.icon, def.label, display, raw < 0));
        });
        if (data.special_effect) {
            lines.push(`<div class="small text-info"><span class="me-1">✨</span>${data.special_effect}</div>`);
        }
        if (data.enables_nuclear_program) {
            lines.push(`<div class="small text-warning"><span class="me-1">☢️</span>Enables Nuclear Program</div>`);
        }
        if (data.nuclear_deterrence) {
            lines.push(`<div class="small text-warning"><span class="me-1">☢️</span>Nuclear Deterrence</div>`);
        }
        if (!hasBonuses) {
            lines.push('<div class="text-muted small">No special bonuses</div>');
        }
        return lines.join('');
    },

    _updateWarPolicyPreview() {
        const el = document.getElementById('ce-war-policy-details');
        if (!el) return;
        const val = document.getElementById('ce-war-policy')?.value;
        const pol = this.data?.war_policies?.[val];
        el.innerHTML = pol
            ? `<div class="p-2 rounded" style="background:var(--bg-input);border:1px solid var(--border-color)">${this._policyBonuses(pol, 'war')}</div>`
            : '';
    },

    _updateDomPolicyPreview() {
        const el = document.getElementById('ce-dom-policy-details');
        if (!el) return;
        const val = document.getElementById('ce-dom-policy')?.value;
        const pol = this.data?.domestic_policies?.[val];
        el.innerHTML = pol
            ? `<div class="p-2 rounded" style="background:var(--bg-input);border:1px solid var(--border-color)">${this._policyBonuses(pol, 'domestic')}</div>`
            : '';
    },

    _updateResourcePreview() {
        const el = document.getElementById('ce-resource-details');
        if (!el) return;
        const val = document.getElementById('ce-resource')?.value;
        const res = this.data?.resources?.[val];
        el.innerHTML = res
            ? `<div class="p-2 rounded" style="background:var(--bg-input);border:1px solid var(--border-color)">${this._policyBonuses(res, 'resource')}</div>`
            : '';
    },

    _updateSummaryPreview() {
        const el = document.getElementById('ce-summary-preview');
        if (!el) return;
        const name = document.getElementById('ce-name')?.value?.trim() || 'Your Empire';
        const ruler = document.getElementById('ce-ruler')?.value?.trim() || 'Your Name';
        const capital = document.getElementById('ce-capital')?.value?.trim() || 'Capital';
        const govVal = document.getElementById('ce-gov')?.value;
        const gov = this.data?.governments?.[govVal];
        const wpVal = document.getElementById('ce-war-policy')?.value;
        const wp = this.data?.war_policies?.[wpVal];
        const dpVal = document.getElementById('ce-dom-policy')?.value;
        const dp = this.data?.domestic_policies?.[dpVal];
        const resVal = document.getElementById('ce-resource')?.value;
        const res = this.data?.resources?.[resVal];
        const color = document.getElementById('ce-color')?.value || 'BLUE';
        const colorMap = { BLUE: '#0d6efd', RED: '#dc3545', GREEN: '#198754', PURPLE: '#6f42c1', ORANGE: '#fd7e14', TEAL: '#20c997', PINK: '#d63384', WHITE: '#adb5bd' };
        el.innerHTML = `<div class="p-3 rounded" style="background:var(--bg-input);border:1px solid var(--border-color)">
            <div class="d-flex align-items-center gap-3 mb-2">
                <span class="color-sphere" style="background:${colorMap[color]||'#6c757d'};width:20px;height:20px;display:inline-block;border-radius:50%"></span>
                <div>
                    <strong style="font-size:1.1rem">${esc(name)}</strong>
                    <span class="text-secondary small ms-2">${esc(ruler)}</span>
                </div>
            </div>
            <div class="d-flex flex-wrap gap-2 small">
                <span class="badge bg-primary">🏛️ ${gov ? gov.name : '—'}</span>
                <span class="badge bg-secondary">⚔️ ${wp ? wp.name : '—'}</span>
                <span class="badge bg-success">🏠 ${dp ? dp.name : '—'}</span>
                <span class="badge bg-warning text-dark">🌾 ${res ? res.name : '—'}</span>
                <span class="badge bg-info">🎨 ${color}</span>
            </div>
        </div>`;
    },
};

window.createPreview = createPreview;

document.addEventListener('DOMContentLoaded', () => {
    createPreview.init();
});
