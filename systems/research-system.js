/**
 * Research System - Unified goal-based technological advancement
 *
 * Research is funded per-turn from Laboratory income diversion (a % of net turn revenue).
 * Each research has a cost (research points goal). Labs divert income per turn until
 * the goal is reached, then research auto-completes and the user can pick another.
 *
 * Effects from completed research are accumulated on nation.researchEffects and
 * nation.researchModifiers for other systems (war, economy, improvements, wonders) to consume.
 */

class ResearchSystem {
    constructor() {
        this.researchDatabase = new Map();
        this.activeResearch = new Map(); // nationId -> { researchId, research, progress, goal }
        this.completedResearch = new Map(); // nationId -> Set of completed research IDs

        this.categories = ['economy', 'healthcare', 'war'];
        this.maxTiers = 12;
        this.maxSimultaneousResearch = 1;

        // Laboratory settings
        this.labBasePercentage = 0.025;      // 2.5% of net income per lab
        this.labMaxStack = 4;                 // max 4 labs = 10%
        this.labPollutionPerLab = 5;          // +5 pollution per lab
        this.labDiseasePerLab = 5;            // +5 disease per lab

        this.researchData = null;
        this.initializeResearchDatabase();
    }

    async initialize() {
        this.setupEventHandlers();
        console.log('Research System initialized');
    }

    initializeResearchDatabase() {
        console.log('Research System waiting for data integration...');
    }

    setResearchDatabase(researchData) {
        this.researchData = researchData;
        this.researchDatabase.clear();

        for (const [id, research] of Object.entries(researchData)) {
            this.researchDatabase.set(id, { ...research, id });
        }

        console.log(`Research System loaded ${this.researchDatabase.size} research projects from data files`);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('research:database_loaded', {
                count: this.researchDatabase.size,
                categories: this.getAvailableCategories()
            });
        }
    }

    getResearchData() {
        if (this.researchData) return this.researchData;
        if (typeof dataIntegration !== 'undefined' && dataIntegration.getAllResearch) {
            return dataIntegration.getAllResearch();
        }
        if (typeof ResearchDatabase !== 'undefined' && ResearchDatabase.research) {
            return ResearchDatabase.research;
        }
        console.warn('No research data available');
        return {};
    }

    getAvailableCategories() {
        return [...this.categories];
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LABORATORY / RESEARCH INCOME
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Calculate how much research income (research points) labs generate this turn.
     * Net income = taxRevenue (turn revenue).
     */
    getLabResearchIncome(nation) {
        const labCount = nation.improvements?.researchLab || 0;
        if (labCount === 0) return 0;

        const effectiveCount = Math.min(labCount, this.labMaxStack);
        let percentage = this.labBasePercentage;

        // Advanced Research Institute project built (1 max) -> 3.5% per lab
        const advancedResearchCount = nation.projects?.advancedResearch || 0;
        if (advancedResearchCount >= 1) {
            percentage = 0.035;
        }

        // Wonder 1: Grand Research Academy (requires project) -> +1.5% per lab
        const academyCount = nation.wonders?.grandResearchAcademy || 0;
        if (academyCount > 0 && advancedResearchCount >= 1) {
            percentage += 0.015;
        }

        const netIncome = nation.taxRevenue || 0;
        return Math.floor(netIncome * percentage * effectiveCount);
    }

    /**
     * Get pollution and disease penalties from laboratories.
     */
    getLabPenalties(nation) {
        const labCount = nation.improvements?.researchLab || 0;
        if (labCount === 0) return { pollution: 0, disease: 0, perLab: { pollution: 0, disease: 0 } };

        let pollutionPerLab = this.labPollutionPerLab;  // 5
        let diseasePerLab = this.labDiseasePerLab;      // 5

        // Advanced Research Institute project built (1 max) -> +1 pollution/+1 disease per lab
        const advancedResearchCount = nation.projects?.advancedResearch || 0;
        if (advancedResearchCount >= 1) {
            pollutionPerLab += 1;
            diseasePerLab += 1;
        }

        // Wonder 1: Grand Research Academy (requires project) -> +2 pollution/+2 disease per lab
        const academyCount = nation.wonders?.grandResearchAcademy || 0;
        if (academyCount > 0 && advancedResearchCount >= 1) {
            pollutionPerLab += 2;
            diseasePerLab += 2;
        }

        // Wonder 2: Environmental Research Complex -> cuts pollution/disease by 50%
        const ecoCenterCount = nation.wonders?.environmentalResearchComplex || 0;
        if (ecoCenterCount > 0) {
            pollutionPerLab = pollutionPerLab / 2;
            diseasePerLab = diseasePerLab / 2;
        }

        return {
            pollution: Math.floor(pollutionPerLab * labCount),
            disease: Math.floor(diseasePerLab * labCount),
            perLab: { pollution: pollutionPerLab, disease: diseasePerLab }
        };
    }

    /**
     * Apply laboratory pollution/disease effects to nation stats.
     * Called when labs are built/demolished.
     */
    applyLabEffects(nation) {
        if (!nation.improvementEffects) nation.improvementEffects = {};

        const penalties = this.getLabPenalties(nation);
        nation.improvementEffects.labPollution = penalties.pollution;
        nation.improvementEffects.labDisease = penalties.disease;
        nation.improvementEffects.labCount = nation.improvements?.researchLab || 0;
        nation.improvementEffects.labResearchIncome = this.getLabResearchIncome(nation);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // RESEARCH MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════════

    getNation(nationId) {
        if (nationId && window.DataManager?.currentPlayer?.nations) {
            return window.DataManager.currentPlayer.nations.find(n => n.id === nationId);
        }
        return window.Nation;
    }

    setupEventHandlers() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('wonder_completed', (data) => this.handleWonderEffects(data));
        EventBus.on('improvement_built', (data) => {
            if (data.type === 'researchLab') this.applyLabEffects(data.nation);
        });
        EventBus.on('improvement_demolished', (data) => {
            if (data.type === 'researchLab') this.applyLabEffects(data.nation);
        });
        EventBus.on('project_built', (data) => {
            if (data.type === 'advancedResearch') this.applyLabEffects(data.nation);
        });
        EventBus.on('project_demolished', (data) => {
            if (data.type === 'advancedResearch') this.applyLabEffects(data.nation);
        });
        EventBus.on('wonder_built', (data) => {
            if (data.type === 'grandResearchAcademy' || data.type === 'environmentalResearchComplex') {
                this.applyLabEffects(data.nation);
            }
        });
        EventBus.on('wonder_demolished', (data) => {
            if (data.type === 'grandResearchAcademy' || data.type === 'environmentalResearchComplex') {
                this.applyLabEffects(data.nation);
            }
        });
    }

    canStartResearch(nationId, researchId) {
        const nation = this.getNation(nationId);
        if (!nation) return { success: false, reason: 'Nation not found' };

        const research = this.researchDatabase.get(researchId);
        if (!research) return { success: false, reason: 'Research not found' };

        const activeCount = this.getActiveResearchCount(nationId);
        const maxResearch = this.getMaxSimultaneousResearch(nationId);
        if (activeCount >= maxResearch) {
            return { success: false, reason: 'Maximum research projects active' };
        }

        if (nation.tech < research.requirements.tech_level) {
            return { success: false, reason: `Tech level ${research.requirements.tech_level} required` };
        }

        if (research.requirements?.prerequisites) {
            const completed = this.completedResearch.get(nationId) || new Set();
            for (const prereq of research.requirements.prerequisites) {
                if (!completed.has(prereq)) {
                    return { success: false, reason: `Prerequisite '${prereq}' not completed` };
                }
            }
        }

        const completed = this.completedResearch.get(nationId) || new Set();
        if (completed.has(researchId)) {
            return { success: false, reason: 'Already researched' };
        }

        return { success: true };
    }

    startResearch(nationId, researchId) {
        const canStart = this.canStartResearch(nationId, researchId);
        if (!canStart.success) return canStart;

        const nation = this.getNation(nationId);
        const research = this.researchDatabase.get(researchId);

        const researchProject = {
            researchId: research.id,
            research: research,
            nationId: nationId,
            progress: 0,
            goal: research.cost || 0,
            isActive: true,
            startedAt: Date.now()
        };

        if (!this.activeResearch.has(nationId)) {
            this.activeResearch.set(nationId, []);
        }
        this.activeResearch.get(nationId).push(researchProject);

        this.notifyResearchStarted(researchProject);

        return { success: true, project: researchProject };
    }

    getActiveResearchCount(nationId) {
        const projects = this.activeResearch.get(nationId) || [];
        return projects.filter(p => p.isActive).length;
    }

    getMaxSimultaneousResearch(nationId) {
        let maxResearch = this.maxSimultaneousResearch;

        // Wonders can add slots
        const nation = this.getNation(nationId);
        if (nation && nation.wonders?.great_library) {
            maxResearch += 1;
        }

        return maxResearch;
    }

    getActiveResearch(nationId) {
        const projects = this.activeResearch.get(nationId) || [];
        return projects.find(p => p.isActive);
    }

    getCompletedResearch(nationId) {
        const completed = this.completedResearch.get(nationId) || new Set();
        const results = [];
        completed.forEach(researchId => {
            const research = this.researchDatabase.get(researchId);
            if (research) results.push(research);
        });
        return results.sort((a, b) => a.tier - b.tier);
    }

    /**
     * Called each turn (day) to fund active research from lab income.
     */
    processResearchTurn(nation) {
        if (!nation) return;

        const nationId = nation.id;

        // No laboratories = no research funding possible
        const labCount = nation.improvements?.researchLab || 0;
        if (labCount === 0) {
            // Still apply any existing lab effects cleanup
            this.applyLabEffects(nation);
            return;
        }

        // 1. Generate research income from labs
        const researchIncome = this.getLabResearchIncome(nation);
        nation.researchPoints = (nation.researchPoints || 0) + researchIncome;

        // 2. Apply lab pollution/disease
        this.applyLabEffects(nation);

        // 3. Fund active research
        const active = this.getActiveResearch(nationId);
        if (!active || !active.isActive) return;

        const remaining = active.goal - active.progress;
        if (remaining <= 0) return;

        const toFund = Math.min(remaining, nation.researchPoints);
        active.progress += toFund;
        nation.researchPoints -= toFund;

        if (active.progress >= active.goal) {
            this.completeResearch(nation, active);
        }
    }

    completeResearch(nation, project) {
        project.isActive = false;
        project.completedAt = Date.now();

        if (!this.completedResearch.has(project.nationId)) {
            this.completedResearch.set(project.nationId, new Set());
        }
        this.completedResearch.get(project.nationId).add(project.researchId);

        // Apply research effects to nation
        this.applyResearchEffects(project.nationId, project.research);

        // Rebuild modifiers cache
        this.rebuildModifiers(project.nationId);

        this.notifyResearchCompleted(project);

        EventBus.emit('research_completed', {
            nationId: project.nationId,
            researchId: project.researchId,
            research: project.research
        });
    }

    applyResearchEffects(nationId, research) {
        const nation = this.getNation(nationId);
        if (!nation) return;

        if (!nation.researchEffects) nation.researchEffects = {};

        Object.entries(research.effects || {}).forEach(([effect, value]) => {
            nation.researchEffects[effect] = (nation.researchEffects[effect] || 0) + value;
        });
    }

    rebuildModifiers(nationId) {
        const nation = this.getNation(nationId);
        if (!nation || !nation.researchEffects) return;

        const effects = nation.researchEffects;
        const modifiers = {
            attack: 0,
            defense: 0,
            aim: 0,
            luck: 0,
            critChance: 0,
            critDamage: 0,
            block: 0,
            parry: 0,
            soldierCostReduction: 0,
            tankCostReduction: 0,
            aircraftCostReduction: 0,
            shipCostReduction: 0,
            soldierUpkeepReduction: 0,
            tankUpkeepReduction: 0,
            aircraftUpkeepReduction: 0,
            shipUpkeepReduction: 0,
            soldierEffectiveness: 0,
            tankEffectiveness: 0,
            aircraftEffectiveness: 0,
            shipEffectiveness: 0,
            missileDamageBoost: 0,
            nukeDamageBoost: 0,
            taxEfficiency: 0,
            income: 0,
            diseaseResistance: 0,
            health: 0,
            diseaseSpawnReduction: 0,
            diseaseLevelReduction: 0,
            pollutionReduction: 0,
            cureCostReduction: 0,
            populationGrowthBonus: 0,
            energySkillBonus: 0,
            intuitionSkillBonus: 0,
            taxableIncomeBoost: 0,
            crimeReduction: 0,
            happinessBonus: 0,
            environmentBonus: 0,
            infraUpkeepReduction: 0,
            infraCostReduction: 0,
            landCostReduction: 0,
            seniorsWorkTaxHalf: 0,
            populationBoost: 0
        };

        // Map effect keys to modifier stats
        const effectMap = {
            // War skills (player skill boosts)
            attack_power: 'attack',
            weapon_effectiveness: 'attack',
            weapon_quality: 'attack',
            cutting_power: 'attack',
            blade_sharpness: 'attack',
            penetrating_power: 'attack',
            firepower_revolution: 'attack',
            artillery_power: 'attack',
            infantry_firepower: 'attack',
            marksmanship: 'attack',
            mobile_firepower: 'attack',
            rate_of_fire: 'attack',
            automatic_firepower: 'attack',
            explosive_power: 'attack',
            armor_superiority: 'attack',
            air_superiority: 'attack',
            strategic_bombing: 'attack',
            invisibility_advantage: 'attack',
            surgical_strikes: 'attack',
            target_elimination: 'attack',
            tactical_flexibility: 'attack',
            battlefield_adaptation: 'attack',
            battlefield_mobility: 'attack',
            siege_efficiency: 'attack',
            siege_dominance: 'attack',
            battlefield_support: 'attack',
            reload_speed: 'attack',
            combat_efficiency: 'attack',
            suppression_fire: 'attack',
            chemical_warfare: 'attack',
            psychological_impact: 'attack',
            first_strike_capability: 'attack',
            information_dominance: 'attack',

            defense: 'defense',
            defensive_strength: 'defense',
            city_defense: 'defense',
            frontal_defense: 'defense',
            personal_protection: 'defense',
            fortress_strength: 'defense',
            artillery_resistance: 'defense',
            geometric_defense: 'defense',
            defensive_capability: 'defense',
            air_defense: 'defense',
            detection_avoidance: 'defense',
            defense_bonus: 'defense',
            settlement_protection: 'defense',
            combat_readiness: 'defense',
            battlefield_preparation: 'defense',
            city_protection: 'defense',
            area_denial: 'defense',

            aim: 'aim',
            accuracy: 'aim',
            ranged_attack: 'aim',
            bow_power: 'aim',
            range_extension: 'aim',
            precision_combat: 'aim',
            effective_range: 'aim',
            detection_capability: 'aim',
            electronic_warfare: 'aim',
            luck: 'luck',
            critical_chance: 'critChance',
            critical_damage: 'critDamage',

            block: 'block',
            parry: 'parry',
            block_chance: 'block',
            parry_chance: 'parry',

            // Unit cost reductions
            soldier_cost: 'soldierCostReduction',
            tank_cost: 'tankCostReduction',
            aircraft_cost: 'aircraftCostReduction',
            ship_cost: 'shipCostReduction',
            soldier_cost_reduction: 'soldierCostReduction',
            tank_cost_reduction: 'tankCostReduction',
            aircraft_cost_reduction: 'aircraftCostReduction',
            ship_cost_reduction: 'shipCostReduction',

            // Unit upkeep reductions
            soldier_upkeep: 'soldierUpkeepReduction',
            tank_upkeep: 'tankUpkeepReduction',
            aircraft_upkeep: 'aircraftUpkeepReduction',
            ship_upkeep: 'shipUpkeepReduction',
            soldier_upkeep_reduction: 'soldierUpkeepReduction',
            tank_upkeep_reduction: 'tankUpkeepReduction',
            aircraft_upkeep_reduction: 'aircraftUpkeepReduction',
            ship_upkeep_reduction: 'shipUpkeepReduction',

            // Unit effectiveness
            soldier_effectiveness: 'soldierEffectiveness',
            infantry_effectiveness: 'soldierEffectiveness',
            unit_coordination: 'soldierEffectiveness',
            tank_effectiveness: 'tankEffectiveness',
            cavalry_charge: 'tankEffectiveness',
            shock_tactics: 'tankEffectiveness',
            aircraft_effectiveness: 'aircraftEffectiveness',
            air_mobility: 'aircraftEffectiveness',
            ship_effectiveness: 'shipEffectiveness',
            naval_range: 'shipEffectiveness',
            soldier_effectiveness_boost: 'soldierEffectiveness',
            tank_effectiveness_boost: 'tankEffectiveness',
            aircraft_effectiveness_boost: 'aircraftEffectiveness',
            ship_effectiveness_boost: 'shipEffectiveness',

            // Missile / Nuke
            missile_damage: 'missileDamageBoost',
            siege_attack: 'missileDamageBoost',
            siege_power: 'missileDamageBoost',
            nuke_damage: 'nukeDamageBoost',
            nuclear_deterrent: 'nukeDamageBoost',
            strategic_dominance: 'nukeDamageBoost',
            missile_damage_boost: 'missileDamageBoost',
            nuke_damage_boost: 'nukeDamageBoost',
            wall_destruction: 'missileDamageBoost',
            fortification_breaching: 'missileDamageBoost',
            tactical_bombardment: 'missileDamageBoost',
            area_damage: 'missileDamageBoost',
            fortification_destruction: 'missileDamageBoost',
            infrastructure_disruption: 'missileDamageBoost',

            // Healthcare effects (disease, pollution, population growth, player skills)
            disease_spawn_rate_reduction: 'diseaseSpawnReduction',
            disease_level_reduction: 'diseaseLevelReduction',
            pollution_reduction: 'pollutionReduction',
            cure_cost_reduction: 'cureCostReduction',
            population_growth_bonus: 'populationGrowthBonus',
            energy_skill_bonus: 'energySkillBonus',
            intuition_skill_bonus: 'intuitionSkillBonus',
            health_bonus: 'health',
            medical_knowledge: 'health',

            // Economy
            tax_efficiency: 'taxEfficiency',
            trade_efficiency: 'income',
            trading_efficiency: 'income',
            economic_growth: 'income',
            international_trade: 'income',
            industrial_growth: 'income',
            technological_advancement: 'income',

            // Additional Economy effects
            market_access: 'income',
            corruption_resistance: 'income',
            market_stability: 'income',
            tax_income: 'income',
            administrative_efficiency: 'income',
            trade_protection: 'income',
            product_quality: 'income',
            guild_income: 'income',
            currency_stability: 'income',
            counterfeiting_resistance: 'income',
            credit_availability: 'income',
            investment_capacity: 'income',
            interest_income: 'income',
            foreign_income: 'income',
            diplomatic_influence: 'income',
            luxury_goods: 'income',
            wealth_generation: 'income',
            tax_fairness: 'income',
            social_stability: 'income',
            revenue_optimization: 'income',
            trade_security: 'income',
            transaction_efficiency: 'income',
            banking_prestige: 'income',
            colonial_trade: 'income',
            risk_distribution: 'income',
            corporate_income: 'income',
            contract_enforcement: 'income',
            business_confidence: 'income',
            legal_stability: 'income',
            financial_accuracy: 'income',
            fraud_prevention: 'income',
            business_efficiency: 'income',
            capital_formation: 'income',
            investment_liquidity: 'income',
            market_efficiency: 'income',
            risk_mitigation: 'income',
            trade_confidence: 'income',
            financial_security: 'income',
            monetary_control: 'income',
            inflation_management: 'income',
            investment_accuracy: 'income',
            risk_assessment: 'income',
            profit_optimization: 'income',
            economic_stability: 'income',
            business_cycle_control: 'income',
            employment_management: 'income',
            forecasting_accuracy: 'income',
            policy_effectiveness: 'income',
            planning_efficiency: 'income',
            innovation_funding: 'income',
            startup_success: 'income',
            technological_commercialization: 'income',
            national_planning: 'income',
            economic_growth_rate: 'income',
            international_competitiveness: 'income',
            data_driven_decisions: 'income',
            policy_precision: 'income',
            market_prediction: 'income',
            corporate_efficiency: 'income',
            market_consolidation: 'income',
            returns_optimization: 'income',
            market_psychology: 'income',
            consumer_behavior_prediction: 'income',
            policy_design: 'income',
            global_market_access: 'income',
            currency_arbitrage: 'income',
            international_investment: 'income',
            alternative_returns: 'income',
            risk_adjusted_profits: 'income',
            sophisticated_hedging: 'income',
            market_liquidity: 'income',
            price_discovery: 'income',
            market_making: 'income',
            arbitrage_capture: 'income',
            decision_optimization: 'income',
            consumer_insights: 'income',
            behavioral_prediction: 'income',
            personalized_finance: 'income',
            market_sentiment: 'income',
            digital_payments: 'income',
            financial_inclusion: 'income',
            autonomous_trading: 'income',
            pattern_recognition: 'income',
            risk_management: 'income',
            computational_supremacy: 'income',
            portfolio_optimization: 'income',
            risk_calculation: 'income',
            contract_automation: 'income',
            trust_minimization: 'income',
            transaction_costs: 'income',
            universal_prosperity: 'income',
            resource_optimization: 'income',

            // Economy research effect keys (new game mechanics)
            taxable_income_boost: 'taxableIncomeBoost',
            crime_reduction: 'crimeReduction',
            happiness_bonus: 'happinessBonus',
            environment_bonus: 'environmentBonus',
            infra_upkeep_reduction: 'infraUpkeepReduction',
            infra_cost_reduction: 'infraCostReduction',
            land_cost_reduction: 'landCostReduction',
            seniors_work_tax_half: 'seniorsWorkTaxHalf',
            population_boost: 'populationBoost',
            infrastructure_funding: 'income',

            // Healthcare
            disease_resistance: 'diseaseResistance',
            population_health: 'health',
            health: 'health'
        };

        for (const [effect, value] of Object.entries(effects)) {
            const stat = effectMap[effect];
            if (stat && modifiers[stat] !== undefined) {
                modifiers[stat] += value;
            }
        }

        nation.researchModifiers = modifiers;
    }

    getResearchModifier(nationId, stat) {
        const nation = this.getNation(nationId);
        if (!nation || !nation.researchModifiers) return 0;
        return nation.researchModifiers[stat] || 0;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // WAR SKILL BONUSES (applied to player skills)
    // ════════════════════════════════════════════════════════════════════════════

    getWarSkillBonus(nationId, skill) {
        return this.getResearchModifier(nationId, skill);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // API METHODS FOR UI
    // ════════════════════════════════════════════════════════════════════════════

    getAvailableResearch(nationId, category = null) {
        const nation = this.getNation(nationId);
        if (!nation) return [];

        const completed = this.completedResearch.get(nationId) || new Set();
        const available = [];

        this.researchDatabase.forEach((research, id) => {
            if (category && research.category !== category) return;
            if (completed.has(id)) return;
            if (research.requirements?.tech_level > nation.tech) return;

            const canStart = this.canStartResearch(nationId, id);
            available.push({
                ...research,
                canStart: canStart.success,
                reason: canStart.reason,
                progress: 0
            });
        });

        return available.sort((a, b) => a.tier - b.tier);
    }

    getResearchTree(category) {
        const categoryResearch = {};
        this.researchDatabase.forEach((research, id) => {
            if (research.category === category) {
                if (!categoryResearch[research.tier]) categoryResearch[research.tier] = [];
                categoryResearch[research.tier].push({
                    id,
                    ...research,
                    prerequisites: research.requirements?.prerequisites || [],
                    unlocks: research.unlocks || []
                });
            }
        });
        return categoryResearch;
    }

    getCategoryInfo() {
        if (this.researchData && this.researchData.categories) {
            return this.researchData.categories;
        }
        return {
            economy: { name: 'Economy', description: 'Financial systems and trade', icon: '💰' },
            healthcare: { name: 'Healthcare', description: 'Medical knowledge and public health', icon: '🏥' },
            war: { name: 'Military', description: 'Military technology and tactics', icon: '⚔️' }
        };
    }

    getTechLevelInfo() {
        if (this.researchData && this.researchData.techLevels) {
            return this.researchData.techLevels;
        }
        return {
            1: { description: 'Basic tools, primitive weapons, early medicine, simple trade systems' },
            2: { description: 'Metal tools, basic fortifications, organized taxation, classical medicine' },
            3: { description: 'Iron weaponry, defensive walls, banking systems, surgical techniques' },
            4: { description: 'Steel weapons, siege engines, commercial law, Renaissance medicine' },
            5: { description: 'Professional armies, castles, stock exchanges, industrial medicine' },
            6: { description: 'Gunpowder weapons, central banking, vaccines, modern surgery' },
            7: { description: 'Artillery, monetary policy, medical radiology, small arms' },
            8: { description: 'Rifles, econometrics, organ transplants, industrial logistics' },
            9: { description: 'Breech-loading, behavioral economics, MRI imaging, explosive shells' },
            10: { description: 'Machine guns, quantitative trading, stem cell therapy, chemical warfare' },
            11: { description: 'Nuclear weapons, cryptocurrency, organ regeneration, jet aircraft' },
            12: { description: 'Quantum finance, post-scarcity economics, consciousness medicine, cyber warfare' }
        };
    }

    getResearchStatistics() {
        const stats = {
            total: this.researchDatabase.size,
            byCategory: {},
            byTier: {}
        };
        this.categories.forEach(c => { stats.byCategory[c] = 0; });
        for (let t = 1; t <= this.maxTiers; t++) stats.byTier[t] = 0;
        this.researchDatabase.forEach(r => {
            if (stats.byCategory[r.category] !== undefined) stats.byCategory[r.category]++;
            if (stats.byTier[r.tier] !== undefined) stats.byTier[r.tier]++;
        });
        return stats;
    }

    getResearchProgress(nationId, researchId) {
        const active = this.getActiveResearch(nationId);
        if (!active || active.researchId !== researchId) return 0;
        return active.progress;
    }

    getResearchTimeRemaining(nationId, researchId) {
        const active = this.getActiveResearch(nationId);
        if (!active || active.researchId !== researchId) return 0;

        const remaining = active.goal - active.progress;
        if (remaining <= 0) return 0;

        const nation = this.getNation(nationId);
        if (!nation) return 0;

        const labIncome = this.getLabResearchIncome(nation);
        if (labIncome <= 0) return Infinity;

        return Math.ceil(remaining / labIncome);
    }

    canCancelResearch(nationId, researchId) {
        const active = this.getActiveResearch(nationId);
        return !!active && active.researchId === researchId && active.isActive;
    }

    cancelResearch(nationId, researchId) {
        const projects = this.activeResearch.get(nationId) || [];
        const idx = projects.findIndex(p => p.researchId === researchId && p.isActive);
        if (idx === -1) return false;
        projects.splice(idx, 1);
        this.notifyResearchCancelled({ researchId, nationId });
        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // WONDER EFFECTS
    // ════════════════════════════════════════════════════════════════════════════

    handleWonderEffects(data) {
        if (data.wonderId === 'great_library') {
            console.log(`Research capacity increased for nation ${data.nationId}`);
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ════════════════════════════════════════════════════════════════════════════

    notifyResearchStarted(project) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('research_started', {
                nationId: project.nationId,
                research: project.research,
                message: `Research started: ${project.research.name}`
            });
        }
    }

    notifyResearchCompleted(project) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('research_completed_notification', {
                nationId: project.nationId,
                research: project.research,
                message: `Research completed: ${project.research.name}!`
            });
        }
    }

    notifyResearchCancelled(project) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('research_cancelled', {
                nationId: project.nationId,
                researchId: project.researchId,
                message: `Research cancelled: ${project.research.name}`
            });
        }
    }
}

window.ResearchSystem = ResearchSystem;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResearchSystem;
}
