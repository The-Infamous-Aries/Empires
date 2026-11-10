/**
 * Resource System - Empire Builder
 * Sovereignty Epochs (Empire.2)
 *
 * Handles staged mineral resources (7 minerals × 5 stages), food/water
 * production and consumption, World Bank staged pricing with complex
 * currency-based tax rates, global resource monitoring, and food/water
 * timed bonus effects.
 *
 * Follows the same class pattern as ImprovementsSystem / ProjectsSystem.
 *
 * Tax rate design: mirrors WorldBankSystem.calculateTaxInterestRate()
 * (world-bank-system.js:376) — complex, currency-based, not flat.
 *
 * Resource target stock: wb.targets[resource] — World Bank's target
 * inventory level. Price adjusts on inventory/target ratio.
 *
 * Food/water 72h purchase tracking: records each food/water buy with
 * turn number; price factor decays over 72 hours (oldest = least effect).
 */

const { EQUIPMENT_WORLD_BANK_PRICES } = require("../../assets/data/equipment/chests.js");
const { EquipmentLootSystemInstance } = require("../Equipment/equipment-loot-system.js");

class ResourceSystem {
    constructor() {
        this.isInitialized = false;

        // ── Stage / transition constants ─────────────────────────────────
        this.minerals = ['steel', 'bronze', 'lead', 'aluminum', 'copper', 'uranium', 'gasoline'];
        this.stages = ['raw', 'stage1', 'stage2', 'stage3', 'manufactured'];
        this.stageMultipliers = { raw: 1, stage1: 2, stage2: 4, stage3: 8, manufactured: 16 };
        this.transitionChain = {
            raw: 'stage1',
            stage1: 'stage2',
            stage2: 'stage3',
            stage3: 'manufactured',
        };
        this.conversionRatio = 2; // 2 units of stage N → 1 unit of stage N+1

        // ── Production settings ──────────────────────────────────────────
        this.baseProductionRate = 0.1; // raw per improvement per turn
        this.stackBonuses = [0, 0.075, 0.25, 0.375, 0.5]; // index = Math.min(count,5)-1
        this.transitionCapacityPerImprovement = 2; // input units per improvement per cycle
        this.timerGateTurns = 4; // turns a batch must wait before transitioning

        // ── Food/water settings ──────────────────────────────────────────
        this.foodWaterProductionRate = 0.25; // per turn per project
        this.foodWaterIntuitionCost = 10;    // base intuition cost per consumption
        this.foodWaterDurationTurns = 2;
        this.foodWaterBasePrice = 50;        // must be > mineral raw base price (1.0)
        this.foodWaterPurchaseWindowHours = 72; // 72-hour purchase tracking window

        // ── Effect key mapping (plan §4.2.3) ─────────────────────────────
        // Each entry: { target, mode }
        //   mode 'mult1plus'     → target *= (1 + val)   [val can be +/-]
        //   mode 'mult1minus'    → target *= (1 - val)   [val positive = benefit]
        //   mode 'costUpDown'    → tempMilitaryCost/Upkeep: benefit ×(1-val), penalty ×(1+val)
        //   mode 'add'           → target += val
        //   mode 'addX5'         → target += val × 5
        this.effectKeyMap = {
            soldierEffectiveness:     { target: 'improvementEffects.soldierEffectiveness',     mode: 'mult1plus' },
            tankEffectiveness:        { target: 'improvementEffects.tankEffectiveness',        mode: 'mult1plus' },
            aircraftEffectiveness:    { target: 'improvementEffects.aircraftEffectiveness',    mode: 'mult1plus' },
            shipEffectiveness:        { target: 'improvementEffects.shipEffectiveness',        mode: 'mult1plus' },
            militaryStrength:         { target: 'policyEffects.militaryStrength',              mode: 'mult1plus' },
            militaryMorale:           { target: 'nationStats.militaryMorale',                  mode: 'mult1plus' },
            purchaseCost:             { target: 'tempMilitaryCost',                            mode: 'costUpDown' },
            upkeepCost:               { target: 'tempMilitaryUpkeep',                          mode: 'costUpDown' },
            nukeMissileInfraDamage:   { target: 'policyEffects.nukeMissileInfraDamage',        mode: 'mult1plus' },
            taxRate:                  { target: 'policyEffects.taxEfficiency',                 mode: 'mult1plus' },
            buildingCostReduction:    { target: 'policyEffects.buildingCostReduction',         mode: 'mult1minus' },
            buildingUpkeepReduction:  { target: 'policyEffects.buildingUpkeepReduction',       mode: 'mult1minus' },
            taxableIncome:            { target: 'improvementEffects.taxableIncomeBonus',       mode: 'mult1plus' },
            energyRegen:              { target: 'improvementEffects.energyRegenModifier',      mode: 'mult1plus' },
            intuitionRegen:           { target: 'improvementEffects.intuitionRegenModifier',   mode: 'mult1plus' },
            literacyBonus:            { target: 'improvementEffects.literacyBonus',            mode: 'mult1plus' },
            happiness:                { target: 'edictEffects.happinessModifier',              mode: 'add' },
            environment:              { target: 'improvementEffects.treeEnvironmentBonus',     mode: 'addX5' },
            pollution:                { target: 'improvementEffects.pollutionModifier',        mode: 'mult1plus' },
            crime:                    { target: 'improvementEffects.crimeModifier',            mode: 'mult1plus' },
            militaryRecruitmentRate:  { target: 'policyEffects.militaryRecruitmentRate',       mode: 'mult1plus' },
            militaryTrainingSpeed:    { target: 'policyEffects.militaryTrainingSpeed',         mode: 'mult1plus' },
        };

        // ── Food types (plan §4.1) ───────────────────────────────────────
        // benefit: military, penalty: econ. value = signed number.
        this.foodTypes = {
            burger:  { name: 'Burger',  category: 'food',  benefit: { key: 'soldierEffectiveness',     value: 0.50 }, penalty: { key: 'taxRate',                     value: -0.075 }, duration: 2, intuitionCost: 10 },
            cake:    { name: 'Cake',    category: 'food',  benefit: { key: 'tankEffectiveness',        value: 0.50 }, penalty: { key: 'buildingCostReduction',       value: -0.10 }, duration: 2, intuitionCost: 10 },
            cookie:  { name: 'Cookie',  category: 'food',  benefit: { key: 'aircraftEffectiveness',    value: 0.50 }, penalty: { key: 'buildingUpkeepReduction',     value: -0.10 }, duration: 2, intuitionCost: 10 },
            donut:   { name: 'Donut',   category: 'food',  benefit: { key: 'shipEffectiveness',        value: 0.50 }, penalty: { key: 'taxableIncome',               value: -0.10 }, duration: 2, intuitionCost: 10 },
            hotdog:  { name: 'Hotdog',  category: 'food',  benefit: { key: 'militaryStrength',         value: 0.25 }, penalty: { key: 'energyRegen',                 value: -0.50 }, duration: 2, intuitionCost: 10 },
            pizza:   { name: 'Pizza',   category: 'food',  benefit: { key: 'militaryMorale',           value: 0.25 }, penalty: { key: 'intuitionRegen',                value: -0.15 }, duration: 2, intuitionCost: 10 },
            ramen:   { name: 'Ramen',   category: 'food',  benefit: { key: 'purchaseCost',  unitType: 'soldier', value: 0.15 }, penalty: { key: 'literacyBonus',           value: -0.20 }, duration: 2, intuitionCost: 10 },
            salad:   { name: 'Salad',   category: 'food',  benefit: { key: 'purchaseCost',  unitType: 'tank',    value: 0.15 }, penalty: { key: 'happiness',               value: -0.15 }, duration: 2, intuitionCost: 10 },
            steak:   { name: 'Steak',   category: 'food',  benefit: { key: 'purchaseCost',  unitType: 'aircraft',value: 0.15 }, penalty: { key: 'environment',             value: -0.15 }, duration: 2, intuitionCost: 10 },
            sushi:   { name: 'Sushi',   category: 'food',  benefit: { key: 'purchaseCost',  unitType: 'ship',    value: 0.15 }, penalty: { key: 'pollution',                 value: 0.15 }, duration: 2, intuitionCost: 10 },
            taco:    { name: 'Taco',    category: 'food',  benefit: { key: 'nukeMissileInfraDamage',   value: 0.33 }, penalty: { key: 'crime',                           value: 0.15 }, duration: 2, intuitionCost: 10 },
        };

        // ── Water types (plan §4.2) ──────────────────────────────────────
        // benefit: econ, penalty: military. value = signed number.
        this.waterTypes = {
            beer:        { name: 'Beer',        category: 'water', benefit: { key: 'taxRate',                    value: 0.075 }, penalty: { key: 'tankEffectiveness',         value: -0.50 }, duration: 2, intuitionCost: 10 },
            coffee:      { name: 'Coffee',      category: 'water', benefit: { key: 'buildingCostReduction',     value: 0.10 }, penalty: { key: 'aircraftEffectiveness',     value: -0.50 }, duration: 2, intuitionCost: 10 },
            'energy-drink': { name: 'Energy Drink', category: 'water', benefit: { key: 'buildingUpkeepReduction',value: 0.10 }, penalty: { key: 'shipEffectiveness',         value: -0.50 }, duration: 2, intuitionCost: 10 },
            juice:       { name: 'Juice',       category: 'water', benefit: { key: 'taxableIncome',             value: 0.10 }, penalty: { key: 'militaryStrength',            value: -0.25 }, duration: 2, intuitionCost: 10 },
            liquor:      { name: 'Liquor',      category: 'water', benefit: { key: 'energyRegen',               value: 0.50 }, penalty: { key: 'militaryMorale',              value: -0.25 }, duration: 2, intuitionCost: 10 },
            milk:        { name: 'Milk',        category: 'water', benefit: { key: 'intuitionRegen',            value: 0.15 }, penalty: { key: 'purchaseCost',  unitType: 'soldier', value: 0.15 }, duration: 2, intuitionCost: 10 },
            milkshake:   { name: 'Milkshake',   category: 'water', benefit: { key: 'literacyBonus',             value: 0.20 }, penalty: { key: 'purchaseCost',  unitType: 'tank',    value: 0.15 }, duration: 2, intuitionCost: 10 },
            smoothie:    { name: 'Smoothie',    category: 'water', benefit: { key: 'happiness',                 value: 0.15 }, penalty: { key: 'purchaseCost',  unitType: 'aircraft',value: 0.15 }, duration: 2, intuitionCost: 10 },
            soda:        { name: 'Soda',        category: 'water', benefit: { key: 'environment',               value: 0.15 }, penalty: { key: 'purchaseCost',  unitType: 'ship',    value: 0.15 }, duration: 2, intuitionCost: 10 },
            water:       { name: 'Water',       category: 'water', benefit: { key: 'pollution',                 value: -0.15 }, penalty: { key: 'nukeMissileInfraDamage',      value: -0.33 }, duration: 2, intuitionCost: 10 },
            wine:        { name: 'Wine',        category: 'water', benefit: { key: 'crime',                     value: -0.15 }, penalty: { key: 'soldierEffectiveness',        value: -0.50 }, duration: 2, intuitionCost: 10 },
        };

        // Combined lookup for consumeFoodWater()
        this.consumableTypes = {};
        for (const [key, def] of Object.entries(this.foodTypes)) this.consumableTypes[key] = def;
        for (const [key, def] of Object.entries(this.waterTypes)) this.consumableTypes[key] = def;

        // ── Unit types that use tempMilitaryCost/Upkeep ──────────────────
        this.costUnitTypes = ['soldier', 'tank', 'aircraft', 'ship'];

        this.isInitialized = true;
    }

    /**
     * Initialize the resource system (called from constructor).
     */
    initialize() {
        if (this.isInitialized) return;
        this.bindEvents();
        this.isInitialized = true;
    }

    /**
     * Bind event listeners.
     * Note: world.js also calls processTurn/processFoodWater directly
     * (see plan §10.5). This EventBus binding is for event-driven usage.
     */
    bindEvents() {
        const bus = typeof window !== 'undefined' ? window.EventBus : (typeof EventBus !== 'undefined' ? EventBus : null);
        if (bus) {
            bus.on('turn_processed', this._onTurnProcessed.bind(this));
        }
    }

    _onTurnProcessed(data) {
        const nation = data && data.nation ? data.nation : null;
        if (nation) {
            this.processTurn(nation);
            this.processFoodWater(nation);
            this.applyActiveBonuses(nation);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Default nation resource state
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Returns the default staged resource object for a new nation.
     * Matches plan §3.5 exactly.
     */
    getDefaultNationResources() {
        const resources = { money: 10_000_000 };
        for (const mineral of this.minerals) {
            resources[mineral] = { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 };
        }
        resources.food = 0;
        resources.water = 0;
        resources.foodTypes = {};
        resources.waterTypes = {};
        const foodTypes = ['burger', 'cake', 'cookie', 'donut', 'hotdog', 'pizza', 'ramen', 'salad', 'steak', 'sushi', 'taco'];
        const waterTypes = ['beer', 'coffee', 'energy-drink', 'juice', 'liquor', 'milk', 'milkshake', 'smoothie', 'soda', 'water', 'wine'];
        foodTypes.forEach(t => { resources.foodTypes[t] = 0; });
        waterTypes.forEach(t => { resources.waterTypes[t] = 0; });
        resources.resourceStageTurn = this.getDefaultResourceStageTurn();
        resources.tempMilitaryCost = {};
        resources.tempMilitaryUpkeep = {};
        return resources;
    }

    /**
     * Returns the default resourceStageTurn object (no `manufactured` — terminal stage).
     */
    getDefaultResourceStageTurn() {
        const turn = {};
        for (const mineral of this.minerals) {
            turn[mineral] = { raw: 0, stage1: 0, stage2: 0, stage3: 0 };
        }
        return turn;
    }

    /**
     * Returns the default resourceWonderEffects object.
     */
    getDefaultResourceWonderEffects() {
        return {
            supremeMining:  { active: false, stackBonus: 0 },
            supremeAssembly: { active: false, timerReduction: 0 },
        };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Global resource monitoring
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Compute global resource totals across all nations.
     * Returns shape matching plan §3:
     *   { steel: { raw: {totalAmount, producerCount}, stage1: {...}, ..., rawProducerCount, totalAllStages }, ...,
     *     food: {totalAmount, producerCount}, water: {totalAmount, producerCount} }
     */
    computeGlobalResources(allNations) {
        const globalResources = {};

        for (const mineral of this.minerals) {
            globalResources[mineral] = {};
            let totalAllStages = 0;
            let rawProducerCount = 0;

            for (const stage of this.stages) {
                let totalAmount = 0;
                let producerCount = 0;
                for (const nation of allNations) {
                    const res = nation.resources && nation.resources[mineral];
                    if (res && res[stage] > 0) {
                        totalAmount += res[stage];
                        producerCount += 1;
                    }
                }
                globalResources[mineral][stage] = { totalAmount, producerCount };
                totalAllStages += totalAmount;
                if (stage === 'raw') {
                    // rawProducerCount = nations with production improvement > 0
                    for (const nation of allNations) {
                        const prodKey = this._productionImprovementKey(mineral);
                        if (nation.improvements && nation.improvements[prodKey] > 0) {
                            rawProducerCount += 1;
                        }
                    }
                }
            }
            globalResources[mineral].rawProducerCount = rawProducerCount;
            globalResources[mineral].totalAllStages = totalAllStages;
        }

        // Food / water (flat)
        for (const fw of ['food', 'water']) {
            let totalAmount = 0;
            let producerCount = 0;
            const projKey = fw === 'food' ? 'foodProduction' : 'waterProduction';
            for (const nation of allNations) {
                const amt = nation.resources && nation.resources[fw] !== undefined ? nation.resources[fw] : 0;
                totalAmount += amt;
                if (nation.projects && nation.projects[projKey] > 0) producerCount += 1;
            }
            globalResources[fw] = { totalAmount, producerCount };
        }

        return globalResources;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Mineral production
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Calculate raw production for a mineral resource.
     * base = 0.1 × count; stackBonus from stackBonuses array; supremeMining wonder
     * doubles stackBonus for stacks >= 3 (count 3: 0.25→0.50, count 4: 0.375→0.75,
     * count 5: 0.50→1.00).
     */
    calculateRawProduction(nation, resourceKey) {
        const prodKey = this._productionImprovementKey(resourceKey);
        const count = nation.improvements && nation.improvements[prodKey] ? nation.improvements[prodKey] : 0;
        if (count === 0) return 0;

        const base = this.baseProductionRate * count;
        const stackIndex = Math.min(count, 5) - 1;
        let stackBonus = this.stackBonuses[stackIndex] || 0;

        // Supreme Mining wonder: doubles stack bonus for stacks >= 3
        const wonderEffects = nation.wonderEffects;
        if (wonderEffects && wonderEffects.supremeMineEfficiency && count >= 3) {
            stackBonus = Math.min(stackBonus * 2, 1.0);
        }

        return base * (1 + stackBonus) * (1 + (nation.equipmentProductionBonus || 0)) * (1 + (EquipmentLootSystemInstance.getResourceBonus(nation)[resourceKey] || 0) / 100);
    }

    /**
     * Calculate transition capacity for a mineral resource.
     * Base = count × 2 input units per cycle. Converted pairs capped at count.
     * supremeAssembly wonder reduces timer gate by 1 (used in processTurn).
     */
    calculateTransitionCapacity(nation, resourceKey) {
        const transKey = this._transitionImprovementKey(resourceKey);
        const count = nation.improvements && nation.improvements[transKey] ? nation.improvements[transKey] : 0;
        return count * this.transitionCapacityPerImprovement; // input units per cycle
    }

    _productionImprovementKey(resourceKey) {
        const map = {
            steel: 'steelMill', bronze: 'bronzeSmelter', lead: 'leadRefinery',
            aluminum: 'aluminumSmelter', copper: 'copperRefinery',
            uranium: 'uraniumEnrichmentPlant', gasoline: 'gasolineRefinery',
        };
        return map[resourceKey];
    }

    _transitionImprovementKey(resourceKey) {
        const map = {
            steel: 'steelFoundry', bronze: 'bronzeCasting', lead: 'leadCasting',
            aluminum: 'aluminumExtrusion', copper: 'copperDrawing',
            uranium: 'uraniumFuelFabrication', gasoline: 'gasolineBlending',
        };
        return map[resourceKey];
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Per-turn processing (minerals + food/water)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Process one turn of mineral production and staging for a nation.
     * Called from world.js processTurn() (plan §10.5).
     */
    processTurn(nation) {
        if (!nation.resources) return;

        // Initialize production tracking for this turn
        if (!nation.resourceProduction) nation.resourceProduction = {};
        nation.resourceProduction.rawProduced = nation.resourceProduction.rawProduced || {};
        nation.resourceProduction.manufacturedProduced = nation.resourceProduction.manufacturedProduced || {};

        for (const mineral of this.minerals) {
            // Ensure resource object exists
            if (!nation.resources[mineral]) {
                nation.resources[mineral] = { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 };
            }
            const res = nation.resources[mineral];

            // Ensure resourceStageTurn entry exists and is persisted
            if (!nation.resourceStageTurn) nation.resourceStageTurn = {};
            if (!nation.resourceStageTurn[mineral]) {
                nation.resourceStageTurn[mineral] = { raw: 0, stage1: 0, stage2: 0, stage3: 0 };
            }
            const stageTurn = nation.resourceStageTurn[mineral];

            // 1. Add raw production to raw stage
            const rawProd = this.calculateRawProduction(nation, mineral);
            if (rawProd > 0) {
                res.raw += rawProd;
                stageTurn.raw = 0; // newly produced raw resets timer
                // Track raw production
                nation.resourceProduction.rawProduced[mineral] = (nation.resourceProduction.rawProduced[mineral] || 0) + rawProd;
            }

            // 2. Increment timers for stages with amount > 0 (exclude manufactured — terminal)
            for (const stage of ['raw', 'stage1', 'stage2', 'stage3']) {
                if (res[stage] > 0) {
                    stageTurn[stage] = (stageTurn[stage] || 0) + 1;
                }
            }

            // 3. Transition eligible stages to next stage
            const transKey = this._transitionImprovementKey(mineral);
            const transCount = nation.improvements && nation.improvements[transKey]
                ? nation.improvements[transKey]
                : 0;
            const stackingBonus = this._getTransitionStackingBonus(transCount, nation);
            const totalTransitions = transCount + stackingBonus;
            const timerGate = this._getTimerGate(nation);

            let transitionsRemaining = totalTransitions;

            // Process all stages in order. Each stage can transition multiple
            // times if resources allow and pool remains. All stages can run in
            // same turn (raw→stage1→stage2→stage3→manufactured).
            for (const stage of ['raw', 'stage1', 'stage2', 'stage3']) {
                const nextStage = this.transitionChain[stage];
                if (!nextStage) continue;

                while (transitionsRemaining > 0) {
                    const amount = res[stage] || 0;
                    const waited = stageTurn[stage] || 0;

                    if (waited < timerGate || amount < 2) break;

                    // One transition: consume 2 units, produce 1 at next stage
                    res[stage] -= 2;
                    res[nextStage] = (res[nextStage] || 0) + 1;
                    transitionsRemaining -= 1;

                    // Track manufactured production when stage3 → manufactured
                    if (nextStage === 'manufactured') {
                        nation.resourceProduction.manufacturedProduced[mineral] = (nation.resourceProduction.manufacturedProduced[mineral] || 0) + 1;
                    }

                    // Reset timers for converted batch and newly arrived units
                    stageTurn[stage] = 0;
                    stageTurn[nextStage] = 0;
                }
            }
        }
    }

    /**
     * Get the effective timer gate turns for a nation (supremeAssembly reduces by 1).
     */
    _getTimerGate(nation) {
        let gate = this.timerGateTurns;
        const wonderEffects = nation.wonderEffects;
        if (wonderEffects && wonderEffects.supremeAssemblyEfficiency) {
            gate -= 1; // supremeAssembly reduces timer gate by 1
        }
        return Math.max(1, gate);
    }

    /**
     * Get stacking bonus transitions per turn for transition improvements.
     * count 1-2: +0, count 3-4: +1, count 5: +2
     * Total transitions at count 5 = 5 + 2 = 7.
     * When supremeAssembly wonder is active: count 3-4: +2, count 5: +5
     * (max stack bonus from 2 to 5).
     */
    _getTransitionStackingBonus(count, nation) {
        const wonderEffects = nation.wonderEffects;
        if (wonderEffects && wonderEffects.supremeAssemblyEfficiency) {
            if (count >= 5) return 5;
            if (count >= 3) return 2;
            return 0;
        }
        if (count >= 5) return 2;
        if (count >= 3) return 1;
        return 0;
    }

    /**
     * Process one turn of food/water production for a nation.
     * Called from world.js processTurn() (plan §10.5).
     */
    processFoodWater(nation) {
        if (!nation.resources) return;
        const foodCount = nation.projects && nation.projects.foodProduction ? nation.projects.foodProduction : 0;
        const waterCount = nation.projects && nation.projects.waterProduction ? nation.projects.waterProduction : 0;
        if (foodCount > 0) nation.resources.food = (nation.resources.food || 0) + this.foodWaterProductionRate * foodCount;
        if (waterCount > 0) nation.resources.water = (nation.resources.water || 0) + this.foodWaterProductionRate * waterCount;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // World Bank pricing
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Calculate the complex resource tax rate for a nation.
     * Mirrors WorldBankSystem.calculateTaxInterestRate() (world-bank-system.js:376)
     * but adapted for resource trades. NOT a flat rate.
     *
     * Factors:
     *   - baseRate = 0.005 (0.5%)
     *   - Currency usage: more nations on currency = more stable = lower rate
     *   - Stacked taxes: more nations stacking taxes = higher demand = higher rate
     *   - Volatility: other currencies rising/falling = uncertainty = higher rate
     *   - Global tax multiplier (inverse of global rise multiplier)
     *   - World Lottery rate impact (inverse: bank payouts lower tax rates)
     *
     * Returns a decimal rate (e.g. 0.025 = 2.5%), clamped 0 to 0.15.
     */
    calculateResourceTaxRate(nation, worldBankState) {
        if (!nation || !nation.currency) return 0.005;

        const currencyKey = nation.currency;

        // Determine totalNations before using it in currency usage calc
        let totalNations = worldBankState && worldBankState.totalNations !== undefined
            ? worldBankState.totalNations
            : (nation.allianceNations ? nation.allianceNations.length : 1);

        // Factor 1: Currency usage
        let nationsOnCurrency = 0;
        if (worldBankState && worldBankState.currencyStats) {
            const stats = worldBankState.currencyStats[currencyKey];
            nationsOnCurrency = stats ? (stats.pctOfNations ? Math.round(stats.pctOfNations / 100 * totalNations) : 0) : 0;
        }

        const usageFactor = totalNations > 0 ? nationsOnCurrency / totalNations : 0;

        // Factor 2: Stacked taxes
        let nationsWithStackedTaxes = 0;
        if (worldBankState && worldBankState.nationsWithStackedTaxes !== undefined) {
            nationsWithStackedTaxes = worldBankState.nationsWithStackedTaxes[currencyKey] || 0;
        }
        const stackedFactor = nationsOnCurrency > 0 ? nationsWithStackedTaxes / nationsOnCurrency : 0;

        // Factor 3: Volatility from other currencies
        let volatilityFactor = 0;
        if (worldBankState && worldBankState.currencyStats) {
            const baseRate = 100; // canonical baseRate from CURRENCIES
            let totalVol = 0;
            let count = 0;
            for (const [key, stats] of Object.entries(worldBankState.currencyStats)) {
                if (key === currencyKey) continue;
                const currentRate = stats.rate || stats.baseRate || 100;
                const change = Math.abs(currentRate - baseRate) / baseRate;
                totalVol += change;
                count++;
            }
            volatilityFactor = count > 0 ? totalVol / count : 0;
        }

        // Combined rate (mirrors calculateTaxInterestRate)
        const baseRate = 0.005;
        let rate = baseRate * (1 + usageFactor * 0.5) * (1 + stackedFactor * 1.0) * (1 + volatilityFactor * 0.5);

        // Global tax multiplier (inverse of global rise: when global rates rise, taxes fall)
        // Use worldBankState.globalRiseMultiplier if available, else neutral 1.0
        const globalRiseMult = worldBankState && worldBankState.globalRiseMultiplier !== undefined
            ? worldBankState.globalRiseMultiplier
            : 1.0;
        const globalTaxMult = Math.max(0.5, Math.min(2.0, 1 / globalRiseMult));
        rate = rate * globalTaxMult;

        // World Lottery rate impact (inverse for taxes)
        const lotteryImpact = worldBankState && worldBankState.lotteryRateImpactMultiplier !== undefined
            ? worldBankState.lotteryRateImpactMultiplier
            : 1.0;
        rate = rate / lotteryImpact;

        return Math.min(Math.max(rate, 0), 0.15); // 0% to 15%
    }

    /**
     * Get the food/water 72-hour purchase price factor.
     * Purchases in the last 72h raise price; effect decays the older the purchase.
     * decayWeight = max(0, 1 - ageInHours / 72) — 1.0 at 0h, 0.0 at 72h+.
     * Note: purchase history timestamps use Date.now() milliseconds.
     */
    getFoodWaterPurchase72hFactor(resourceKey, worldBankState) {
        if (resourceKey !== 'food' && resourceKey !== 'water') return 1.0;
        if (!worldBankState || !worldBankState.foodWaterPurchaseHistory) return 1.0;

        const history = worldBankState.foodWaterPurchaseHistory[resourceKey] || [];
        if (history.length === 0) return 1.0;

        const windowMs = this.foodWaterPurchaseWindowHours * 60 * 60 * 1000;
        const now = Date.now();

        let totalWeightedAmount = 0;
        for (const entry of history) {
            const ageMs = now - entry.at;
            if (ageMs > windowMs) continue; // outside 72h window
            const ageHours = ageMs / (60 * 60 * 1000);
            const decayWeight = Math.max(0, 1 - ageHours / this.foodWaterPurchaseWindowHours);
            totalWeightedAmount += entry.amount * decayWeight;
        }

        // Factor: 1 + (weighted amount / 10000) — each 10,000 units weighted adds 10%
        const factor = 1 + Math.min(totalWeightedAmount / 10000, 1.0);
        return factor;
    }

    /**
     * Record a food/water purchase for 72-hour price tracking.
     * Called from worldBankBuy after a successful purchase.
     */
    recordFoodWaterPurchase(resourceKey, amount, worldBankState, at) {
        if (resourceKey !== 'food' && resourceKey !== 'water') return;
        if (!worldBankState) return;
        worldBankState.foodWaterPurchaseHistory = worldBankState.foodWaterPurchaseHistory || {};
        worldBankState.foodWaterPurchaseHistory[resourceKey] = worldBankState.foodWaterPurchaseHistory[resourceKey] || [];
        worldBankState.foodWaterPurchaseHistory[resourceKey].push({ amount, at: at || Date.now() });

        // Prune entries older than 72 hours
        const windowMs = this.foodWaterPurchaseWindowHours * 60 * 60 * 1000;
        const now = at || Date.now();
        worldBankState.foodWaterPurchaseHistory[resourceKey] = worldBankState.foodWaterPurchaseHistory[resourceKey].filter(
            e => now - e.at <= windowMs
        );
    }

    /**
     * Calculate buy/sell price for a resource.
     * resourceKey: mineral key or 'food'/'water'
     * stage: 'raw'|'stage1'|'stage2'|'stage3'|'manufactured' for minerals, null for food/water
     * globalData: result of computeGlobalResources()
     * nation: the buying/selling nation (for complex tax rate)
     * worldBankState: this.state.worldBank (for targets, inventory, currency stats, purchase history)
     */
    getWorldBankPrice(resourceKey, stage, globalData, nation, worldBankState) {
        let basePrice;
        let globalTotalAmount = 0;
        let producerCount = 0;

        const isMineral = this.minerals.includes(resourceKey);
        const isEquipment = Object.keys(EQUIPMENT_WORLD_BANK_PRICES).includes(resourceKey);

        if (isMineral) {
            // Base price by stage multiplier — raw base price = 1 currency unit
            const rawBasePrice = 1;
            basePrice = rawBasePrice * (this.stageMultipliers[stage] || 1);

            const g = globalData && globalData[resourceKey];
            if (g) {
                globalTotalAmount = g[stage] ? g[stage].totalAmount : 0;
                producerCount = g[stage] ? g[stage].producerCount : 0;
            }
        } else if (isEquipment) {
            // Equipment items (keys/chests) — fixed base price, supply factor from WB inventory/targets
            basePrice = EQUIPMENT_WORLD_BANK_PRICES[resourceKey];
            const targetStock = worldBankState && worldBankState.targets && worldBankState.targets[resourceKey] !== undefined
                ? worldBankState.targets[resourceKey]
                : 10000;
            globalTotalAmount = worldBankState && worldBankState.inventory && worldBankState.inventory[resourceKey] !== undefined
                ? worldBankState.inventory[resourceKey]
                : 0;
            producerCount = 0; // equipment has no producers
        } else {
            // food / water — base price higher than mineral raw base price (1.0)
            basePrice = (typeof GameConfig !== 'undefined' && GameConfig.FOOD_WATER_BASE_PRICE !== undefined)
                ? GameConfig.FOOD_WATER_BASE_PRICE : 50;
            const g = globalData && globalData[resourceKey];
            if (g) {
                globalTotalAmount = g.totalAmount || 0;
                producerCount = g.producerCount || 0;
            }
        }

        // ── Resource target stock ─────────────────────────────────────────
        // wb.targets[resource] = World Bank's target inventory level.
        // Price adjusts on inventory/target ratio.
        const targetStock = worldBankState && worldBankState.targets && worldBankState.targets[resourceKey] !== undefined
            ? worldBankState.targets[resourceKey]
            : (typeof GameConfig !== 'undefined' && GameConfig.RESOURCE_TARGET_STOCK && GameConfig.RESOURCE_TARGET_STOCK[resourceKey] !== undefined)
                ? GameConfig.RESOURCE_TARGET_STOCK[resourceKey]
                : 10000;

        const totalNations = worldBankState && worldBankState.totalNations !== undefined
            ? worldBankState.totalNations
            : (nation.allianceNations ? nation.allianceNations.length : 1);

        // Supply factor: inventory vs target stock
        const supplyFactor = Math.max(0.5, Math.min(2.0, 1 - (globalTotalAmount / targetStock)));

        // Producer factor: more producers → slightly higher (industrial demand)
        const producerFactor = Math.max(1.0, Math.min(1.5, 1 + (producerCount / totalNations)));

        // Food/water 72-hour purchase factor
        let fwPurchaseFactor = 1.0;
        if (!isMineral) {
            fwPurchaseFactor = this.getFoodWaterPurchase72hFactor(resourceKey, worldBankState);
        }

        const preTaxPrice = basePrice * supplyFactor * producerFactor * fwPurchaseFactor;

        // ── Complex tax rate (mirrors calculateTaxInterestRate) ───────────
        const taxRate = this.calculateResourceTaxRate(nation, worldBankState);

        const buyPrice = preTaxPrice * (1 + taxRate);
        const sellPrice = preTaxPrice * (1 - taxRate);

        return {
            buyPrice: Math.max(0, Math.floor(buyPrice * 100) / 100),
            sellPrice: Math.max(0, Math.floor(sellPrice * 100) / 100),
            preTaxPrice: Math.max(0, Math.floor(preTaxPrice * 100) / 100),
            taxRate,
        };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Food/water consumption
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Consume 1 unit of food or water, applying timed bonuses/penalties.
     *
     * @param {object} nation - The consuming nation
     * @param {string} type - Food/water key (e.g. 'burger', 'water')
     * @param {boolean} skipIntuition - If true, luck/evade saved the intuition cost (resource still consumed)
     * @returns {object} { success, benefit, penalty, turnsRemaining, type, category, intuitionConsumed }
     */
    consumeFoodWater(nation, type, skipIntuition = false) {
        const def = this.consumableTypes[type];
        if (!def) return { success: false, reason: `Unknown consumable type: ${type}` };

        // Check resource availability (1 unit) — food/water are stored as flat keys
        const category = def.category; // 'food' or 'water'
        const has = nation.resources && nation.resources[category] !== undefined
            ? nation.resources[category] >= 1
            : false;
        if (!has) return { success: false, reason: `Insufficient ${category}` };

        // Check intuition cost (unless luck/evade saved it)
        let intuitionConsumed = 0;
        if (!skipIntuition) {
            const player = nation.player;
            const intuition = player && player.intuition !== undefined ? player.intuition : 0;
            if (intuition < this.foodWaterIntuitionCost) {
                return { success: false, reason: `Insufficient intuition (need ${this.foodWaterIntuitionCost})` };
            }
            nation.resources[category] -= 1;
            if (player) {
                player.intuition = intuition - this.foodWaterIntuitionCost;
                intuitionConsumed = this.foodWaterIntuitionCost;
            }
        } else {
            // Luck/evade saved intuition — still consume the resource
            nation.resources[category] -= 1;
        }

        // Initialize activeResourceBonuses if needed
        if (!nation.activeResourceBonuses) nation.activeResourceBonuses = [];

        // Push bonus entry
        const bonus = {
            type,
            category: def.category,
            turnsRemaining: def.duration,
            benefit: def.benefit,
            penalty: def.penalty,
        };
        nation.activeResourceBonuses.push(bonus);

        return {
            success: true,
            benefit: def.benefit,
            penalty: def.penalty,
            turnsRemaining: def.duration,
            type,
            category: def.category,
            intuitionConsumed,
        };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Bonus application (called from world.js refresh)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Apply active food/water bonuses to a nation's effect targets.
     * Decrements turnsRemaining and removes expired bonuses.
     * Called from world.js refresh() (plan §10.5).
     */
    applyActiveBonuses(nation) {
        if (!nation.activeResourceBonuses || nation.activeResourceBonuses.length === 0) return;

        const surviving = [];

        for (const bonus of nation.activeResourceBonuses) {
            bonus.turnsRemaining -= 1;
            if (bonus.turnsRemaining <= 0) continue; // expired
            surviving.push(bonus);

            this._applyEffect(nation, bonus.benefit, true);
            this._applyEffect(nation, bonus.penalty, false);
        }

        nation.activeResourceBonuses = surviving;
    }

    /**
     * Apply a single benefit/penalty effect to a nation.
     * isBenefit: true for benefit, false for penalty.
     */
    _applyEffect(nation, effect, isBenefit) {
        if (!effect || !effect.key) return;

        const mapping = this.effectKeyMap[effect.key];
        if (!mapping) return;

        let val = effect.value;
        if (val === undefined) return;

        // For costUpDown effects, val is stored positive; benefit uses ×(1-val), penalty uses ×(1+val)
        if (mapping.mode === 'costUpDown') {
            const unitType = effect.unitType;
            const resolved = this._resolveTarget(nation, mapping.target);
            if (!resolved) return;
            // Ensure the cost object exists on the nation
            const costObj = resolved.obj[resolved.prop];
            if (!costObj || typeof costObj !== 'object') return;
            const key = unitType ? unitType : 'default';
            const current = costObj[key] !== undefined ? costObj[key] : 0;
            let multiplier;
            if (isBenefit) {
                multiplier = 1 - val;
            } else {
                multiplier = 1 + val;
            }
            costObj[key] = current * multiplier;
            return;
        }

        // For all other modes, resolve the target object + property
        const resolved = this._resolveTarget(nation, mapping.target);
        if (!resolved || !resolved.obj || resolved.prop === undefined) return;

        const current = resolved.obj[resolved.prop] !== undefined ? resolved.obj[resolved.prop] : 0;
        let newVal;

        switch (mapping.mode) {
            case 'mult1plus':
                newVal = current * (1 + val);
                break;
            case 'mult1minus':
                newVal = current * (1 - val);
                break;
            case 'add':
                newVal = current + val;
                break;
            case 'addX5':
                newVal = current + val * 5;
                break;
            default:
                newVal = current * (1 + val);
        }

        resolved.obj[resolved.prop] = newVal;
    }

    /**
     * Resolve a dotted target path like 'improvementEffects.soldierEffectiveness'
     * to { obj, prop }. Starts resolution from `nation`.
     * Returns null if any intermediate path is missing (does not auto-create).
     */
    _resolveTarget(nation, path) {
        const parts = path.split('.');
        let obj = nation;
        for (let i = 0; i < parts.length - 1; i++) {
            const p = parts[i];
            if (obj[p] === undefined) return null;
            obj = obj[p];
        }
        const prop = parts[parts.length - 1];
        return { obj, prop };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Wonder effects
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Apply wonder build/demolish effects to the resource system.
     * Called from wonders-system.js buildWonder() / demolishWonder().
     */
    applyWonderEffects(nation, wonderKey, isBuilding) {
        if (!nation.wonderEffects) nation.wonderEffects = {};

        if (wonderKey === 'supremeMining') {
            nation.wonderEffects.supremeMineEfficiency = isBuilding;
            nation.wonderEffects.supremeMineStackBonus = isBuilding ? 0.50 : 0;
        } else if (wonderKey === 'supremeAssembly') {
            nation.wonderEffects.supremeAssemblyEfficiency = isBuilding;
            nation.wonderEffects.supremeAssemblyTimerReduction = isBuilding ? 1 : 0;
        }
        // cleanMining / cleanAssembly effects are wired in nation-system.js
        // calculatePollution() / calculateCrime() — not handled here.
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Compound key helpers (for affordability/pay/worldBank/catalog)
    // ═════════════════════════════════════════════════════════════════════════

    /**
     * Parse a compound key like 'steel-manufactured' into { resource, stage }.
     * Flat keys like 'food' return { resource: 'food', stage: null }.
     */
    parseCompoundKey(resourceKey) {
        if (resourceKey.includes('-')) {
            const parts = resourceKey.split('-');
            const stage = parts.pop();
            const resource = parts.join('-');
            return { resource, stage };
        }
        return { resource: resourceKey, stage: null };
    }

    /**
     * Get the amount of a resource a nation has, handling staged vs flat keys.
     */
    getResourceAmount(nation, resourceKey) {
        const { resource, stage } = this.parseCompoundKey(resourceKey);
        if (!nation.resources) return 0;
        if (stage) {
            const res = nation.resources[resource];
            return res && res[stage] !== undefined ? res[stage] : 0;
        }
        return nation.resources[resource] !== undefined ? nation.resources[resource] : 0;
    }

    /**
     * Deduct an amount of a resource from a nation, handling staged vs flat keys.
     * Returns true if sufficient and deducted, false otherwise.
     */
    deductResource(nation, resourceKey, amount) {
        const { resource, stage } = this.parseCompoundKey(resourceKey);
        if (!nation.resources) return false;
        const has = this.getResourceAmount(nation, resourceKey);
        if (has < amount) return false;
        if (stage) {
            nation.resources[resource][stage] -= amount;
        } else {
            nation.resources[resource] -= amount;
        }
        return true;
    }

    /**
     * Add an amount of a resource to a nation, handling staged vs flat keys.
     */
    addResource(nation, resourceKey, amount) {
        const { resource, stage } = this.parseCompoundKey(resourceKey);
        if (!nation.resources) return;
        if (stage) {
            nation.resources[resource][stage] = (nation.resources[resource][stage] || 0) + amount;
        } else {
            nation.resources[resource] = (nation.resources[resource] || 0) + amount;
        }
    }

    /**
     * Build the 37-item staged World Bank catalog resource list.
     * Replaces r.resources.basicResources + manufacturedResources (plan §9/§10.5).
     */
    buildCatalogResources() {
        const items = [];
        for (const m of this.minerals) {
            for (const s of this.stages) {
                items.push(`${m}-${s}`);
            }
        }
        items.push('food', 'water');
        return items;
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResourceSystem };
}
