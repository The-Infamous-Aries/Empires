/**
 * Motion System Framework - Extensible Motion Processing with Boost/Penalty Mechanics
 * Dominion Wars - Nation Building Strategy Game
 *
 * Single source of truth for all motion effects. World Forum delegates motion
 * implementation here. Supports:
 *   - Premade motions (fixed boost+penalty, no Congress selection)
 *   - Custom motions (Congress picks one boost + one penalty, custom name)
 *   - Neutral motions (no boost/penalty, affect world/game aspects only)
 *   - Sanctions (World Forum only; block attack/aid/diplomacy/color interaction)
 *
 * NOTE: Resources and trades have been removed from the game. No motion references
 * resources or resource trading. Aid (financial transfers) is still allowed and can
 * be blocked by sanctions.
 */

class MotionSystem {
    constructor() {
        this.isInitialized = false;
        this.motionProcessors = new Map();
        this.activeEffects = new Map();   // motionId -> effect
        this.activeSanctions = new Map(); // sanctionId -> sanction data
        this.sanctionedTargets = new Map(); // targetKey -> Set of sanctionIds

        this.initialize();
    }

    /**
     * Initialize motion system
     */
    initialize() {
        console.log('Initializing Motion System...');

        this.registerDefaultProcessors();
        this.bindEvents();

        this.isInitialized = true;
        console.log('Motion System initialized');
    }

    /**
     * Destroy motion system and clean up listeners
     */
    destroy() {
        if (typeof EventBus !== 'undefined') {
            if (typeof GameEvents !== 'undefined') {
                EventBus.off(GameEvents.DAY_PASSED, this.handleDailyEffects, this);
            }
        }

        this.activeEffects.clear();
        this.activeSanctions.clear();
        this.sanctionedTargets.clear();
        this.motionProcessors.clear();
        this.isInitialized = false;
        console.log('Motion System destroyed');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (typeof EventBus === 'undefined' || typeof GameEvents === 'undefined') {
            return;
        }

        EventBus.on(GameEvents.DAY_PASSED, this.handleDailyEffects, this);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // INTERNAL EVENT EMITTER (guards against undefined EventBus)
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Safely emit an event if EventBus is available
     */
    emit(eventName, data) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit(eventName, data);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // BOOST / PENALTY CATALOGS (Congress picks one of each for custom motions)
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Available boosts Congress can attach to a custom motion.
     * Resources and trades removed — boosts map to currencies, military, research,
     * population, happiness, diplomacy, buildings, energy, and XP.
     */
    getBoostCatalog() {
        return [
            { id: 'money_generation', label: 'Currency Generation', category: 'economy', min: 5, max: 50, default: 15, applyEvent: 'motion_boost_money_generation' },
            { id: 'xp_gain', label: 'Experience Gain', category: 'progression', min: 5, max: 40, default: 20, applyEvent: 'motion_boost_xp_gain' },
            { id: 'energy_regeneration', label: 'Energy Regeneration', category: 'progression', min: 5, max: 40, default: 15, applyEvent: 'motion_boost_energy_regeneration' },
            { id: 'military_effectiveness', label: 'Military Effectiveness', category: 'military', min: 5, max: 35, default: 12, applyEvent: 'motion_boost_military_effectiveness' },
            { id: 'defense', label: 'Defense', category: 'military', min: 5, max: 35, default: 12, applyEvent: 'motion_boost_defense' },
            { id: 'research_points', label: 'Research Points', category: 'technology', min: 5, max: 35, default: 18, applyEvent: 'motion_boost_research_points' },
            { id: 'building_cost_reduction', label: 'Building Cost Reduction', category: 'infrastructure', min: 5, max: 30, default: 15, applyEvent: 'motion_boost_building_cost_reduction' },
            { id: 'happiness', label: 'Happiness', category: 'social', min: 5, max: 25, default: 10, applyEvent: 'motion_boost_happiness' },
            { id: 'population_growth', label: 'Population Growth', category: 'social', min: 5, max: 25, default: 10, applyEvent: 'motion_boost_population_growth' },
            { id: 'diplomacy_standing', label: 'Diplomacy Standing', category: 'diplomacy', min: 5, max: 25, default: 10, applyEvent: 'motion_boost_diplomacy_standing' },
            // ══ SPORTS BOOSTS ══
            { id: 'sports_betting', label: 'Sports Betting Revenue', category: 'economy', min: 5, max: 50, default: 33, applyEvent: 'motion_boost_sports_betting' },
            { id: 'athlete_development', label: 'Athlete Development', category: 'progression', min: 5, max: 40, default: 20, applyEvent: 'motion_boost_athlete_development' },
            { id: 'fan_engagement', label: 'Fan Engagement', category: 'social', min: 5, max: 30, default: 15, applyEvent: 'motion_boost_fan_engagement' },
            { id: 'stadium_revenue', label: 'Stadium Revenue', category: 'economy', min: 5, max: 35, default: 15, applyEvent: 'motion_boost_stadium_revenue' },
        ];
    }

    /**
     * Available penalties Congress can attach to a custom motion.
     * Every non-sanction motion MUST have a penalty to prevent overpowered boosts.
     * Resources and trades removed.
     */
    getPenaltyCatalog() {
        return [
            { id: 'money_generation', label: 'Reduced Currency Generation (Inflation)', category: 'economy', min: 5, max: 50, default: 15, applyEvent: 'motion_penalty_money_generation' },
            { id: 'xp_gain', label: 'Reduced Experience Gain', category: 'progression', min: 5, max: 40, default: 20, applyEvent: 'motion_penalty_xp_gain' },
            { id: 'energy_cost', label: 'Increased Energy Cost', category: 'progression', min: 5, max: 40, default: 15, applyEvent: 'motion_penalty_energy_cost' },
            { id: 'military_upkeep', label: 'Increased Military Upkeep', category: 'military', min: 5, max: 35, default: 12, applyEvent: 'motion_penalty_military_upkeep' },
            { id: 'defense_weakness', label: 'Reduced Defense', category: 'military', min: 5, max: 35, default: 12, applyEvent: 'motion_penalty_defense_weakness' },
            { id: 'research_points', label: 'Reduced Research Points', category: 'technology', min: 5, max: 35, default: 18, applyEvent: 'motion_penalty_research_points' },
            { id: 'building_cost_increase', label: 'Increased Building Cost', category: 'infrastructure', min: 5, max: 30, default: 15, applyEvent: 'motion_penalty_building_cost_increase' },
            { id: 'happiness_penalty', label: 'Reduced Happiness', category: 'social', min: 5, max: 25, default: 10, applyEvent: 'motion_penalty_happiness_penalty' },
            { id: 'population_penalty', label: 'Reduced Population Growth', category: 'social', min: 5, max: 25, default: 10, applyEvent: 'motion_penalty_population_penalty' },
            { id: 'diplomacy_penalty', label: 'Reduced Diplomacy Standing', category: 'diplomacy', min: 5, max: 25, default: 10, applyEvent: 'motion_penalty_diplomacy_penalty' },
            // ══ SPORTS PENALTIES ══
            { id: 'sports_crime', label: 'Increased Sports Crime', category: 'social', min: 5, max: 25, default: 10, applyEvent: 'motion_penalty_sports_crime' },
            { id: 'training_cost', label: 'Increased Training Cost', category: 'progression', min: 5, max: 30, default: 15, applyEvent: 'motion_penalty_training_cost' },
            { id: 'roster_instability', label: 'Roster Instability', category: 'social', min: 5, max: 25, default: 10, applyEvent: 'motion_penalty_roster_instability' },
            { id: 'active_season_reduction', label: 'Shorter Active Season', category: 'progression', min: 5, max: 30, default: 14, applyEvent: 'motion_penalty_active_season_reduction' },
        ];
    }

    /**
     * Get a single boost entry by id
     */
    getBoostEntry(boostId) {
        return this.getBoostCatalog().find(b => b.id === boostId) || null;
    }

    /**
     * Get a single penalty entry by id
     */
    getPenaltyEntry(penaltyId) {
        return this.getPenaltyCatalog().find(p => p.id === penaltyId) || null;
    }

    /**
     * Boost label for name generation
     */
    getBoostLabel(boostId) {
        const entry = this.getBoostEntry(boostId);
        return entry ? entry.label : boostId;
    }

    /**
     * Penalty label for name generation
     */
    getPenaltyLabel(penaltyId) {
        const entry = this.getPenaltyEntry(penaltyId);
        return entry ? entry.label : penaltyId;
    }

    /**
     * Validate a boost value against catalog bounds. Returns { valid, value, error }.
     */
    validateBoost(boostId, value) {
        const entry = this.getBoostEntry(boostId);
        if (!entry) return { valid: false, value: null, error: `Unknown boost: ${boostId}` };
        const num = Number(value);
        if (!Number.isFinite(num)) return { valid: false, value: null, error: `Invalid boost value for ${boostId}` };
        if (num < entry.min || num > entry.max) {
            return { valid: false, value: null, error: `Boost ${boostId} must be between ${entry.min} and ${entry.max}, got ${num}` };
        }
        return { valid: true, value: num, error: null };
    }

    /**
     * Validate a penalty value against catalog bounds. Returns { valid, value, error }.
     */
    validatePenalty(penaltyId, value) {
        const entry = this.getPenaltyEntry(penaltyId);
        if (!entry) return { valid: false, value: null, error: `Unknown penalty: ${penaltyId}` };
        const num = Number(value);
        if (!Number.isFinite(num)) return { valid: false, value: null, error: `Invalid penalty value for ${penaltyId}` };
        if (num < entry.min || num > entry.max) {
            return { valid: false, value: null, error: `Penalty ${penaltyId} must be between ${entry.min} and ${entry.max}, got ${num}` };
        }
        return { valid: true, value: num, error: null };
    }

    /**
     * Validate a full boost+penalty pair. Returns { valid, boost, penalty, errors }.
     * Rules:
     *   - Boost and penalty cannot be the same category (id).
     *   - Boost value must equal penalty value (perfect balance).
     */
    validateBoostPenalty(boostId, boostValue, penaltyId, penaltyValue) {
        const errors = [];
        const boost = this.validateBoost(boostId, boostValue);
        const penalty = this.validatePenalty(penaltyId, penaltyValue);
        if (!boost.valid) errors.push(boost.error);
        if (!penalty.valid) errors.push(penalty.error);

        // Prevent same category boost and penalty
        if (boost.valid && penalty.valid && boostId === penaltyId) {
            errors.push(`Boost and penalty cannot be the same category: ${boostId}`);
        }

        // Boost value must equal penalty value (perfect balance)
        if (boost.valid && penalty.valid && boost.value !== penalty.value) {
            errors.push(`Boost value (${boost.value}) must equal penalty value (${penalty.value}) for balanced motion`);
        }

        return {
            valid: errors.length === 0,
            boost: boost.valid ? boost.value : null,
            penalty: penalty.valid ? penalty.value : null,
            errors
        };
    }

    /**
     * Generate a custom motion name from boost + penalty picks.
     * Example: "Currency Generation with Inflation Act"
     */
    generateMotionName(boostId, penaltyId, scope = 'world') {
        const boostLabel = this.getBoostLabel(boostId);
        const penaltyLabel = this.getPenaltyLabel(penaltyId);
        const scopeWord = scope === 'color' ? 'Faction' : 'World';
        return `${boostLabel} with ${penaltyLabel} Act`;
    }

    /**
     * Generate a custom motion description from boost + penalty picks.
     */
    generateMotionDescription(boostId, penaltyId, boostValue, penaltyValue, duration, scope = 'world') {
        const boostLabel = this.getBoostLabel(boostId);
        const penaltyLabel = this.getPenaltyLabel(penaltyId);
        const scopeWord = scope === 'color' ? 'faction' : 'world';
        return `A ${scopeWord}-wide measure granting ${boostLabel} (${boostValue}%) at the cost of ${penaltyLabel} (${penaltyValue}%) for ${duration}.`;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PREMADE MOTION TEMPLATES (fixed effects, no Congress boost/penalty selection)
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Premade motion definitions. These have fixed effects already set.
     * Congress can propose them directly without selecting boost/penalty.
     *
     * No motions reference resources or resource trading. Money = currency balances.
     */
    getPremadeMotionTemplates() {
        return {
            // ══ COLOR BLOC PREMADES (scope: color, proposer needs Broadcasting) ══
            COLOR_EXPERIENCE_SURGE: {
                name: 'Experience Surge Initiative',
                description: 'Boost XP gain for all faction members with energy cost increase',
                scope: 'color',
                minSupport: 0.45,
                fixedEffects: { xpBoost: 20, energyCostIncrease: 25 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_ENERGY_REGENERATION: {
                name: 'Enhanced Energy Recovery',
                description: 'Increase energy regeneration rate for faction members with happiness penalty',
                scope: 'color',
                minSupport: 0.4,
                fixedEffects: { energyBoost: 15, happinessPenalty: 10 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_MILITARY_TRAINING: {
                name: 'Military Training Program',
                description: 'Enhanced military effectiveness with military upkeep increase',
                scope: 'color',
                minSupport: 0.55,
                fixedEffects: { militaryBoost: 12, militaryUpkeepIncrease: 20 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_TECH_SHARING: {
                name: 'Technology Sharing Initiative',
                description: 'Accelerated research points for faction members',
                scope: 'color',
                minSupport: 0.6,
                fixedEffects: { researchPointsBoost: 18 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_INFRASTRUCTURE_PUSH: {
                name: 'Infrastructure Development Push',
                description: 'Building cost reduction with population growth penalty',
                scope: 'color',
                minSupport: 0.5,
                fixedEffects: { buildingCostReduction: 20, populationGrowthPenalty: 15 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_DEFENSIVE_PACT: {
                name: 'Faction Defense Alliance',
                description: 'Enhanced defensive bonuses when attacked by external factions',
                scope: 'color',
                minSupport: 0.65,
                fixedEffects: { defensiveBonus: 25 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_ECONOMIC_STIMULUS: {
                name: 'Economic Stimulus Package',
                description: 'Currency generation boost with inflation effects',
                scope: 'color',
                minSupport: 0.55,
                fixedEffects: { moneyBoost: 25, inflationRate: 5 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            COLOR_HAPPINESS_CAMPAIGN: {
                name: 'Morale Boosting Campaign',
                description: 'Happiness increase with productivity slight decrease',
                scope: 'color',
                minSupport: 0.4,
                fixedEffects: { happinessBoost: 15, productivityPenalty: 8 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },

            // ══ WORLD PREMADES (scope: world, proposer needs Internet wonder + Congress) ══
            WORLD_CALENDAR_CHANGE: {
                name: 'World Calendar Modification',
                description: 'Alter the world calendar system and time progression',
                scope: 'world',
                minSupport: 0.65,
                fixedEffects: { calendarChange: true },
                duration: null, // permanent
                requiresWonder: 'internet',
                canPropose: ['congress_only'],
                neutral: true
            },
            WORLD_NAME_CHANGE: {
                name: 'World Rename Proposal',
                description: 'Change the official name of the game world',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { worldRename: true },
                duration: null, // permanent
                requiresWonder: 'internet',
                canPropose: ['congress_only'],
                neutral: true
            },
            WORLD_MILITARY_LIMITATION: {
                name: 'Military Size Restrictions',
                description: 'Limit maximum military unit counts globally',
                scope: 'world',
                minSupport: 0.75,
                fixedEffects: { unitLimits: { tanks: 100, aircraft: 50, ships: 25 } },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            WORLD_TECHNOLOGY_SHARING: {
                name: 'Mandatory Technology Sharing',
                description: 'Force sharing of research points above certain thresholds',
                scope: 'world',
                minSupport: 0.8,
                fixedEffects: { techThreshold: 1000, sharingRate: 0.1 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            WORLD_ENVIRONMENTAL_PROTECTION: {
                name: 'Environmental Protection Act',
                description: 'Limit pollution-causing activities with production penalties',
                scope: 'world',
                minSupport: 0.65,
                fixedEffects: { pollutionLimits: 'moderate', productionPenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            WORLD_PEACE_TREATY: {
                name: 'Global Peace Enforcement',
                description: 'Temporary ban on all military conflicts',
                scope: 'world',
                minSupport: 0.85,
                fixedEffects: { peaceEnforcement: true },
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            ANTI_NUCLEAR_MANDATE: {
                name: 'Anti-Nuclear Mandate',
                description: 'Ban nuclear weapon production (making) for 30 days. Does NOT ban launching existing nukes.',
                scope: 'world',
                minSupport: 0.7,
                isNuclearBan: true,
                banType: 'production',
                fixedEffects: { nuclearProductionBan: true, nuclearLaunchBan: false },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            ANTI_NUCLEAR_LAUNCH_BAN: {
                name: 'Anti-Nuclear Launch Ban',
                description: 'Ban nuclear weapon launching for 30 days. Does NOT ban production.',
                scope: 'world',
                minSupport: 0.7,
                isNuclearBan: true,
                banType: 'launch',
                mutuallyExclusiveWith: ['HEAVY_MISSILE_OBJECTIVE'],
                fixedEffects: { nuclearProductionBan: false, nuclearLaunchBan: true },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            ANTI_MISSILE_MANDATE: {
                name: 'Anti-Missile Mandate',
                description: 'Ban missile production (making) for 30 days. Does NOT ban launching existing missiles.',
                scope: 'world',
                minSupport: 0.65,
                isMissileBan: true,
                banType: 'production',
                fixedEffects: { missileProductionBan: true, missileLaunchBan: false },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            ANTI_MISSILE_LAUNCH_BAN: {
                name: 'Anti-Missile Launch Ban',
                description: 'Ban missile launching for 30 days. Does NOT ban production of new missiles.',
                scope: 'world',
                minSupport: 0.65,
                isMissileBan: true,
                banType: 'launch',
                mutuallyExclusiveWith: ['HEAVY_MISSILE_OBJECTIVE'],
                fixedEffects: { missileProductionBan: false, missileLaunchBan: true },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },

            // ══ SANCTIONS (World Forum only; block attack/aid/diplomacy/color) ══
            FACTION_SANCTION: {
                name: 'Faction Sanctions',
                description: 'Impose sanctions on a faction for violations (World Forum only)',
                scope: 'world',
                minSupport: 0.65,
                isSanction: true,
                sanctionBlocks: ['attack', 'aid', 'diplomacy', 'color_interaction'],
                fixedEffects: { sanctionType: 'economic', severity: 'moderate' },
                duration: '30 days',
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },

            // ══ LEGACY PROCESSOR MOTIONS (registered via registerMotionProcessor) ══
            MILITARY_ALLIANCE: {
                name: 'Military Alliance',
                description: 'Form defensive pact between factions',
                scope: 'world',
                minSupport: 0.7,
                fixedEffects: { allianceFactions: [] },
                duration: null, // permanent until revoked
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            TERRITORY_DISPUTE: {
                name: 'Territory Dispute Resolution',
                description: 'Resolve a territory dispute between factions',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { territoryResolution: true },
                duration: '30 days',
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            RESEARCH_SHARING: {
                name: 'Research Sharing Agreement',
                description: 'Share research points between factions',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { researchSharing: true, bonus: 0.2 },
                duration: '60 days',
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            WORLD_TAX: {
                name: 'World Tax',
                description: 'Implement a global tax rate for world projects',
                scope: 'world',
                minSupport: 0.7,
                fixedEffects: { worldTaxRate: 0.05, purpose: 'infrastructure' },
                duration: '90 days',
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            HEAVY_MISSILE_OBJECTIVE: {
                name: 'Heavy Missile Objective',
                description: 'Increase infrastructure destroyed by missiles by 15% for 30 days. Cannot be active with Anti-Nuclear Launch Ban or Anti-Missile Launch Ban.',
                scope: 'world',
                minSupport: 0.6,
                isMissileObjective: true,
                mutuallyExclusiveWith: ['ANTI_NUCLEAR_LAUNCH_BAN', 'ANTI_MISSILE_LAUNCH_BAN'],
                fixedEffects: { missileInfraDamageBoost: 15 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },

            // ══ GOVERNMENT & RELIGION AMNESTIES (mutually exclusive, min 30 days active before cancel) ══
            GOVERNMENT_CHANGE_AMNESTY: {
                name: 'Government Change Amnesty',
                description: 'Lowers government change cooldown from 14 to 7 days; raises religion change cooldown from 14 to 28 days',
                scope: 'world',
                minSupport: 0.6,
                isAmnesty: true,
                amnestyType: 'government',
                governmentCooldownDays: 7,
                religionCooldownDays: 28,
                minActiveDays: 30,
                mutuallyExclusiveWith: ['RELIGION_CHANGE_AMNESTY'],
                fixedEffects: { governmentCooldownDays: 7, religionCooldownDays: 28 },
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            RELIGION_CHANGE_AMNESTY: {
                name: 'Religion Change Amnesty',
                description: 'Lowers religion change cooldown from 14 to 7 days; raises government change cooldown from 14 to 28 days',
                scope: 'world',
                minSupport: 0.6,
                isAmnesty: true,
                amnestyType: 'religion',
                governmentCooldownDays: 28,
                religionCooldownDays: 7,
                minActiveDays: 30,
                mutuallyExclusiveWith: ['GOVERNMENT_CHANGE_AMNESTY'],
                fixedEffects: { governmentCooldownDays: 28, religionCooldownDays: 7 },
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },

            // ══ MILITARY SUPREMACY ACTS (max 2 active at a time) ══
            SOLDIER_SUPREMACY: {
                name: 'Soldier Supremacy Act',
                description: 'Raise soldier effectiveness by 30%, but lower tanks, aircraft, and ships by 10% each for 30 days',
                scope: 'world',
                minSupport: 0.6,
                isMilitarySupremacy: true,
                supremacyType: 'soldier',
                fixedEffects: { soldierEffectivenessBoost: 30, tankEffectivenessPenalty: 10, aircraftEffectivenessPenalty: 10, shipEffectivenessPenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            TANK_SUPREMACY: {
                name: 'Tank Supremacy Act',
                description: 'Raise tank effectiveness by 30%, but lower soldiers, aircraft, and ships by 10% each for 30 days',
                scope: 'world',
                minSupport: 0.6,
                isMilitarySupremacy: true,
                supremacyType: 'tank',
                fixedEffects: { tankEffectivenessBoost: 30, soldierEffectivenessPenalty: 10, aircraftEffectivenessPenalty: 10, shipEffectivenessPenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            AIRCRAFT_SUPREMACY: {
                name: 'Aircraft Supremacy Act',
                description: 'Raise aircraft effectiveness by 30%, but lower soldiers, tanks, and ships by 10% each for 30 days',
                scope: 'world',
                minSupport: 0.6,
                isMilitarySupremacy: true,
                supremacyType: 'aircraft',
                fixedEffects: { aircraftEffectivenessBoost: 30, soldierEffectivenessPenalty: 10, tankEffectivenessPenalty: 10, shipEffectivenessPenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            SHIP_SUPREMACY: {
                name: 'Ship Supremacy Act',
                description: 'Raise ship effectiveness by 30%, but lower soldiers, tanks, and aircraft by 10% each for 30 days',
                scope: 'world',
                minSupport: 0.6,
                isMilitarySupremacy: true,
                supremacyType: 'ship',
                fixedEffects: { shipEffectivenessBoost: 30, soldierEffectivenessPenalty: 10, tankEffectivenessPenalty: 10, aircraftEffectivenessPenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },

            // ══ HEALTH & ENVIRONMENT MOTIONS (Color and World) ══
            ADVANCED_GLOBAL_HEALTHCARE: {
                name: 'Advanced Global Healthcare',
                description: 'Raise happiness +15, lower disease rate and disease spawn rate -10, but lower taxable income -10% for all nations',
                scope: 'world',
                minSupport: 0.65,
                fixedEffects: { happinessBoost: 15, diseaseRateReduction: 10, diseaseSpawnReduction: 10, taxableIncomePenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            COLOR_ADVANCED_HEALTHCARE: {
                name: 'Advanced Faction Healthcare',
                description: 'Raise happiness +15, lower disease rate and disease spawn rate -10, but lower taxable income -10% for faction members',
                scope: 'color',
                minSupport: 0.55,
                fixedEffects: { happinessBoost: 15, diseaseRateReduction: 10, diseaseSpawnReduction: 10, taxableIncomePenalty: 10 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            GREEN_GOALS: {
                name: 'Green Goals',
                description: 'Raise environment +10, lower pollution by 30%, but lower taxable income by 10% for 30 days',
                scope: 'world',
                minSupport: 0.65,
                fixedEffects: { environmentBoost: 10, pollutionReduction: 30, taxableIncomePenalty: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            COLOR_GREEN_GOALS: {
                name: 'Faction Green Goals',
                description: 'Raise environment +10, lower pollution by 30%, but lower taxable income by 10% for faction members',
                scope: 'color',
                minSupport: 0.55,
                fixedEffects: { environmentBoost: 10, pollutionReduction: 30, taxableIncomePenalty: 10 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },

            // ══ POPULATION & BUILDING MOTIONS (Color and World) ══
            CHILD_LABOR: {
                name: 'Child Labor Act',
                description: 'Allow children demographic to work and be taxed at full rate, but lower happiness by 50',
                scope: 'world',
                minSupport: 0.55,
                fixedEffects: { childLaborEnabled: true, happinessPenalty: 50 },
                duration: null, // permanent until revoked
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            COLOR_CHILD_LABOR: {
                name: 'Faction Child Labor Act',
                description: 'Allow children demographic to work and be taxed at full rate, but lower happiness by 50 for faction members',
                scope: 'color',
                minSupport: 0.5,
                fixedEffects: { childLaborEnabled: true, happinessPenalty: 50 },
                duration: null, // permanent until revoked
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            NEW_BUILD_OBJECTIVE: {
                name: 'New Build Objective',
                description: 'Lower land and infrastructure purchase cost by 15%, but raise their upkeep cost by 10% for 30 days',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { landPurchaseDiscount: 15, infraPurchaseDiscount: 15, landUpkeepIncrease: 10, infraUpkeepIncrease: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            COLOR_NEW_BUILD_OBJECTIVE: {
                name: 'Faction New Build Objective',
                description: 'Lower land and infrastructure purchase cost by 15%, but raise their upkeep cost by 10% for faction members',
                scope: 'color',
                minSupport: 0.55,
                fixedEffects: { landPurchaseDiscount: 15, infraPurchaseDiscount: 15, landUpkeepIncrease: 10, infraUpkeepIncrease: 10 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },
            RESTORATION_ACT: {
                name: 'Restoration Act',
                description: 'Lower land and infrastructure upkeep cost by 15%, but raise their purchase cost by 10% for 30 days',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { landUpkeepDiscount: 15, infraUpkeepDiscount: 15, landPurchaseIncrease: 10, infraPurchaseIncrease: 10 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            COLOR_RESTORATION_ACT: {
                name: 'Faction Restoration Act',
                description: 'Lower land and infrastructure upkeep cost by 15%, but raise their purchase cost by 10% for faction members',
                scope: 'color',
                minSupport: 0.55,
                fixedEffects: { landUpkeepDiscount: 15, infraUpkeepDiscount: 15, landPurchaseIncrease: 10, infraPurchaseIncrease: 10 },
                
                requiresProject: 'broadcasting',
                canPropose: ['faction_members']
            },

            // ══ FREE SPEECH & WORLD FORUM MOTIONS ══
            FREE_SPEECH_PROTECTION: {
                name: 'Free Speech Protection',
                description: 'Disable forum moderation and allow unrestricted speech for 30 days',
                scope: 'world',
                minSupport: 0.6,
                isWorldForumMotion: true,
                fixedEffects: { forumModerationDisabled: true, freeSpeechProtected: true },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            CONGRESSIONAL_TERM_LIMITS: {
                name: 'Congressional Term Limits',
                description: 'Limit how many motions one faction can propose per day',
                scope: 'world',
                minSupport: 0.55,
                isWorldForumMotion: true,
                fixedEffects: { maxMotionsPerFactionPerDay: 3 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            VETO_POWER_ROTATION: {
                name: 'Veto Power Rotation',
                description: 'Rotate veto power among color factions weekly',
                scope: 'world',
                minSupport: 0.65,
                isWorldForumMotion: true,
                fixedEffects: { vetoRotationEnabled: true },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            EMERGENCY_POWERS: {
                name: 'Emergency Powers',
                description: 'Allow Congress to bypass world vote for 7 days',
                scope: 'world',
                minSupport: 0.75,
                isWorldForumMotion: true,
                fixedEffects: { emergencyPowersEnabled: true, bypassWorldVote: true },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            MOTION_COST_INCREASE: {
                name: 'Motion Cost Increase',
                description: 'Raise the money cost to propose motions',
                scope: 'world',
                minSupport: 0.5,
                isWorldForumMotion: true,
                fixedEffects: { motionProposalCostMultiplier: 2 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            SUPERMAJORITY_REQUIREMENT: {
                name: 'Supermajority Requirement',
                description: 'Change vote threshold from 50% to 66% for sanctions',
                scope: 'world',
                minSupport: 0.6,
                isWorldForumMotion: true,
                fixedEffects: { sanctionVoteThreshold: 0.66 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            MOTION_RENAME: {
                name: 'Motion Rename Act',
                description: 'Allows renaming of any passed motion by changing its official title',
                scope: 'world',
                minSupport: 0.55,
                isWorldForumMotion: true,
                fixedEffects: { motionRenameAllowed: true },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },

            // ══ SPORTS MOTIONS ══
            SPORTS_XP_GAIN_BOOST: {
                name: 'Athlete XP Development Act',
                description: 'Boosts player XP gain but reduces fans gained from games',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { xpGainBoost: 25, fansGainedPenalty: 15 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            SPORTS_FANS_GAIN_BOOST: {
                name: 'Fan Engagement Initiative',
                description: 'Boosts fans gained from games but reduces player XP gain',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { fansGainedBoost: 25, xpGainPenalty: 15 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            SPORTS_UPGRADE_SUBSIDY: {
                name: 'Stadium Upgrade Subsidy',
                description: 'Lowers stadium upgrade costs but reduces revenue from games',
                scope: 'world',
                minSupport: 0.6,
                fixedEffects: { upgradeCostReduction: 20, gameRevenuePenalty: 15 },
                
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            },
            SEASON_LENGTH_ALTERATION: {
                name: 'Season Length Alteration',
                description: 'Allows altering the length of sports seasons',
                scope: 'world',
                minSupport: 0.65,
                neutral: true,
                fixedEffects: { seasonLengthChangeAllowed: true },
                duration: null,
                requiresWonder: 'internet',
                canPropose: ['congress_only']
            }
        };
    }

    /**
     * Check if a motion type is a sanction
     */
    isSanctionMotion(motionType) {
        const template = this.getPremadeMotionTemplates()[motionType];
        return !!template?.isSanction;
    }

    /**
     * Get sanction blocks for a motion type
     */
    getSanctionBlocks(motionType) {
        const template = this.getPremadeMotionTemplates()[motionType];
        return template?.sanctionBlocks || [];
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // MOTION PROPOSAL & IMPLEMENTATION
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Register a motion processor
     */
    registerMotionProcessor(motionType, processor) {
        if (typeof processor.process !== 'function') {
            throw new Error('Motion processor must have a process method');
        }
        this.motionProcessors.set(motionType, processor);
        console.log(`Motion processor registered: ${motionType}`);
    }

    /**
     * Register default motion processors
     */
    registerDefaultProcessors() {
        this.registerMotionProcessor('MILITARY_ALLIANCE', new MilitaryAllianceProcessor());
        this.registerMotionProcessor('TERRITORY_DISPUTE', new TerritoryDisputeProcessor());
        this.registerMotionProcessor('FACTION_SANCTION', new FactionSanctionProcessor());
        this.registerMotionProcessor('RESEARCH_SHARING', new ResearchSharingProcessor());
        this.registerMotionProcessor('WORLD_TAX', new WorldTaxProcessor());
    }

    /**
     * Apply a motion's full effect. Called by World Forum after a motion passes.
     * Handles: premade motions, custom boost/penalty motions, sanctions, neutral motions.
     */
    applyMotion(motion) {
        if (!motion || !motion.type) {
            console.warn('applyMotion called without valid motion');
            return;
        }

        const template = this.getPremadeTemplate(motion.type);
        const startTime = Date.now();
        const durationMs = motion.parameters?.duration ? this.parseDurationMs(motion.parameters.duration) : this.parseDurationMs('30 days');

        // ══ MUTUAL EXCLUSION CHECKS ══

        // Government Change Amnesty vs Religion Change Amnesty - mutually exclusive
        if (motion.type === 'GOVERNMENT_CHANGE_AMNESTY' || motion.type === 'RELIGION_CHANGE_AMNESTY') {
            const otherAmnesty = motion.type === 'GOVERNMENT_CHANGE_AMNESTY' ? 'RELIGION_CHANGE_AMNESTY' : 'GOVERNMENT_CHANGE_AMNESTY';
            for (const [existingMotionId, existingEffect] of this.activeEffects.entries()) {
                if (existingEffect.type === otherAmnesty && existingEffect.duration !== null) {
                    const elapsed = Date.now() - existingEffect.startDate;
                    const remainingMs = existingEffect.duration - elapsed;
                    if (remainingMs > 0) {
                        console.warn(`Cannot propose ${motion.type}: ${otherAmnesty} is active with ${Math.ceil(remainingMs / (24 * 60 * 60 * 1000))} days remaining`);
                        return;
                    }
                }
            }
        }

        // Heavy Missile Objective vs Anti-Nuclear/Anti-Missile Launch Bans - mutually exclusive
        if (motion.type === 'HEAVY_MISSILE_OBJECTIVE' || motion.type === 'ANTI_NUCLEAR_LAUNCH_BAN' || motion.type === 'ANTI_MISSILE_LAUNCH_BAN') {
            const others = motion.type === 'HEAVY_MISSILE_OBJECTIVE' ? ['ANTI_NUCLEAR_LAUNCH_BAN', 'ANTI_MISSILE_LAUNCH_BAN'] : ['HEAVY_MISSILE_OBJECTIVE'];
            for (const [existingMotionId, existingEffect] of this.activeEffects.entries()) {
                if (others.includes(existingEffect.type) && existingEffect.duration !== null) {
                    const elapsed = Date.now() - existingEffect.startDate;
                    const remainingMs = existingEffect.duration - elapsed;
                    if (remainingMs > 0) {
                        console.warn(`Cannot propose ${motion.type}: ${existingEffect.type} is active with ${Math.ceil(remainingMs / (24 * 60 * 60 * 1000))} days remaining`);
                        return;
                    }
                }
            }
        }

        // Max 2 military supremacy acts active at a time
        if (template?.isMilitarySupremacy) {
            let activeSupremacyCount = 0;
            for (const [existingMotionId, existingEffect] of this.activeEffects.entries()) {
                if (existingEffect.type && existingEffect.type.endsWith('_SUPREMACY') && existingEffect.duration !== null) {
                    const elapsed = Date.now() - existingEffect.startDate;
                    const remainingMs = existingEffect.duration - elapsed;
                    if (remainingMs > 0) {
                        activeSupremacyCount++;
                    }
                }
            }
            if (activeSupremacyCount >= 2) {
                console.warn(`Cannot propose ${motion.type}: maximum 2 military supremacy acts can be active at a time`);
                return;
            }
        }

        // ══ SANCTIONS (World Forum only; block attack/aid/diplomacy/color) ══
        if (this.isSanctionMotion(motion.type)) {
            const sanctionId = `sanction_${motion.id}`;
            this.applySanction(
                sanctionId,
                motion.targets?.[0] || motion.proposerFaction,
                'faction',
                motion.parameters?.sanctionType || 'economic',
                motion.parameters?.severity || 'moderate',
                motion.parameters?.duration ? this.parseDurationDays(motion.parameters.duration) : 30,
                this.getSanctionBlocks(motion.type),
                motion.proposer
            );

            // Also track in activeEffects for consistency with all other motions
            this.activeEffects.set(motion.id, {
                type: motion.type,
                motionId: motion.id,
                motionType: motion.type,
                startDate: startTime,
                duration: durationMs,
                sourceMotion: motion,
                isSanction: true,
                sanctionId: sanctionId,
                targetKey: motion.targets?.[0] || motion.proposerFaction,
                blockedActions: this.getSanctionBlocks(motion.type),
                scope: motion.scope,
                originalMinSupport: template?.minSupport
            });

            this.emit('motion_implemented', { motion, effect: { type: motion.type, isSanction: true } });
            return;
        }

        // ══ NEUTRAL MOTIONS (no boost/penalty; affect world/game aspects) ══
        if (template?.neutral) {
            const neutralBaseData = {
                motionType: motion.type,
                motionId: motion.id,
                proposer: motion.proposer,
                proposerFaction: motion.proposerFaction,
                scope: motion.scope,
                targets: motion.targets || [],
                parameters: motion.parameters || {}
            };
            if (motion.type === 'WORLD_CALENDAR_CHANGE') {
                this.emit('world_calendar_changed', {
                    ...neutralBaseData,
                    newSettings: motion.parameters,
                    fullCalendar: motion.parameters
                });
            } else if (motion.type === 'WORLD_NAME_CHANGE') {
                this.emit('world_name_changed', { ...neutralBaseData, newName: motion.parameters?.newWorldName });
            } else if (motion.type === 'SEASON_LENGTH_ALTERATION') {
                this.emit('season_length_alteration_applied', {
                    ...neutralBaseData,
                    seasonLengthChangeAllowed: template.fixedEffects.seasonLengthChangeAllowed
                });
            }
            this.addActiveEffect(motion.id, { type: motion.type, neutral: true, duration: null, scope: motion.scope, originalMinSupport: template?.minSupport }, motion);
            this.emit('motion_implemented', { motion, effect: { type: motion.type, neutral: true } });
            return;
        }

        // ══ CUSTOM BOOST/PENALTY MOTIONS ══
        if (motion.boost && motion.penalty) {
            this.applyCustomBoostPenaltyMotion(motion);
            return;
        }

        // ══ PREMADE / LEGACY MOTIONS (processor-based) ══
        const processor = this.motionProcessors.get(motion.type);
        if (processor) {
            try {
                const effect = processor.process(motion);
                if (effect) {
                    effect.originalMinSupport = template?.minSupport;
                    this.addActiveEffect(motion.id, effect, motion);
                }
            } catch (error) {
                console.error(`Error processing motion ${motion.id}:`, error);
            }

            // Emit game events for processor-based motions so other systems can react
            if (template?.fixedEffects) {
                this.emitPremadeMotionEvents(motion.type, template.fixedEffects, motion);
            }

            this.emit('motion_implemented', { motion, effect: { type: motion.type } });
            return;
        }

        // Premade motion with fixed effects (no processor)
        if (template?.fixedEffects) {
            this.addActiveEffect(motion.id, {
                type: motion.type,
                fixedEffects: template.fixedEffects,
                duration: durationMs,
                scope: motion.scope,
                startDate: startTime,
                originalMinSupport: template.minSupport
            }, motion);

            // Emit game events for all premade motions so other systems can react
            this.emitPremadeMotionEvents(motion.type, template.fixedEffects, motion);

            this.emit('motion_implemented', { motion, effect: { type: motion.type, fixedEffects: template.fixedEffects } });
            return;
        }

        console.warn(`No handler for motion type: ${motion.type}`);
    }

    /**
     * Emit game events for premade motions so other systems (war, economy, research,
     * population, diplomacy) can react to the actual effects.
     * No events reference resources or resource trading.
     */
    emitPremadeMotionEvents(motionType, fixedEffects, motion) {
        const baseData = {
            motionType,
            motionId: motion.id,
            proposer: motion.proposer,
            proposerFaction: motion.proposerFaction,
            scope: motion.scope,
            targets: motion.targets || [],
            parameters: motion.parameters || {}
        };

        switch (motionType) {
            // ══ COLOR MOTION EVENTS ══
            case 'COLOR_EXPERIENCE_SURGE':
                this.emit('color_experience_surge_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    xpBoost: fixedEffects.xpBoost,
                    energyCostIncrease: fixedEffects.energyCostIncrease
                });
                break;
            case 'COLOR_ENERGY_REGENERATION':
                this.emit('color_energy_regeneration_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    energyBoost: fixedEffects.energyBoost,
                    happinessPenalty: fixedEffects.happinessPenalty
                });
                break;
            case 'COLOR_MILITARY_TRAINING':
                this.emit('color_military_training_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    militaryBoost: fixedEffects.militaryBoost,
                    militaryUpkeepIncrease: fixedEffects.militaryUpkeepIncrease
                });
                break;
            case 'COLOR_TECH_SHARING':
                this.emit('color_tech_sharing_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    researchPointsBoost: fixedEffects.researchPointsBoost
                });
                break;
            case 'COLOR_INFRASTRUCTURE_PUSH':
                this.emit('color_infrastructure_push_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    buildingCostReduction: fixedEffects.buildingCostReduction,
                    populationGrowthPenalty: fixedEffects.populationGrowthPenalty
                });
                break;
            case 'COLOR_DEFENSIVE_PACT':
                this.emit('color_defensive_pact_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    defensiveBonus: fixedEffects.defensiveBonus
                });
                break;
            case 'COLOR_ECONOMIC_STIMULUS':
                this.emit('color_economic_stimulus_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    moneyBoost: fixedEffects.moneyBoost,
                    inflationRate: fixedEffects.inflationRate
                });
                break;
            case 'COLOR_HAPPINESS_CAMPAIGN':
                this.emit('color_happiness_campaign_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    happinessBoost: fixedEffects.happinessBoost,
                    productivityPenalty: fixedEffects.productivityPenalty
                });
                break;

            // ══ WORLD MOTION EVENTS ══
            case 'WORLD_CALENDAR_CHANGE':
                this.emit('world_calendar_changed', {
                    ...baseData,
                    newSettings: motion.parameters,
                    fullCalendar: motion.parameters
                });
                break;
            case 'WORLD_NAME_CHANGE':
                this.emit('world_name_changed', { ...baseData, newName: motion.parameters?.newWorldName });
                break;
            case 'WORLD_MILITARY_LIMITATION':
                this.emit('world_military_limitation_applied', {
                    ...baseData,
                    unitLimits: fixedEffects.unitLimits
                });
                break;
            case 'WORLD_TECHNOLOGY_SHARING':
                this.emit('world_technology_sharing_applied', {
                    ...baseData,
                    techThreshold: fixedEffects.techThreshold,
                    sharingRate: fixedEffects.sharingRate
                });
                break;
            case 'WORLD_ENVIRONMENTAL_PROTECTION':
                this.emit('world_environmental_protection_applied', {
                    ...baseData,
                    pollutionLimits: fixedEffects.pollutionLimits,
                    productionPenalty: fixedEffects.productionPenalty
                });
                break;
            case 'WORLD_PEACE_TREATY':
                this.emit('world_peace_treaty_applied', { ...baseData, peaceEnforcement: true });
                break;

            // ══ GOVERNMENT & RELIGION AMNESTY EVENTS ══
            case 'GOVERNMENT_CHANGE_AMNESTY':
                this.emit('government_change_amnesty_applied', {
                    ...baseData,
                    governmentCooldownDays: fixedEffects.governmentCooldownDays,
                    religionCooldownDays: fixedEffects.religionCooldownDays
                });
                break;
            case 'RELIGION_CHANGE_AMNESTY':
                this.emit('religion_change_amnesty_applied', {
                    ...baseData,
                    governmentCooldownDays: fixedEffects.governmentCooldownDays,
                    religionCooldownDays: fixedEffects.religionCooldownDays
                });
                break;

            // ══ WORLD PEACE & NUCLEAR/MISSILE EVENTS ══
            case 'ANTI_NUCLEAR_MANDATE':
                this.emit('anti_nuclear_mandate_applied', {
                    ...baseData,
                    nuclearProductionBan: fixedEffects.nuclearProductionBan,
                    nuclearLaunchBan: fixedEffects.nuclearLaunchBan
                });
                break;
            case 'ANTI_NUCLEAR_LAUNCH_BAN':
                this.emit('anti_nuclear_launch_ban_applied', {
                    ...baseData,
                    nuclearProductionBan: fixedEffects.nuclearProductionBan,
                    nuclearLaunchBan: fixedEffects.nuclearLaunchBan
                });
                break;
            case 'ANTI_MISSILE_MANDATE':
                this.emit('anti_missile_mandate_applied', {
                    ...baseData,
                    missileProductionBan: fixedEffects.missileProductionBan,
                    missileLaunchBan: fixedEffects.missileLaunchBan
                });
                break;
            case 'HEAVY_MISSILE_OBJECTIVE':
                this.emit('heavy_missile_objective_applied', {
                    ...baseData,
                    missileInfraDamageBoost: fixedEffects.missileInfraDamageBoost
                });
                break;

            // ══ MILITARY SUPREMACY EVENTS ══
            case 'SOLDIER_SUPREMACY':
                this.emit('soldier_supremacy_applied', {
                    ...baseData,
                    soldierEffectivenessBoost: fixedEffects.soldierEffectivenessBoost,
                    tankEffectivenessPenalty: fixedEffects.tankEffectivenessPenalty,
                    aircraftEffectivenessPenalty: fixedEffects.aircraftEffectivenessPenalty,
                    shipEffectivenessPenalty: fixedEffects.shipEffectivenessPenalty
                });
                break;
            case 'TANK_SUPREMACY':
                this.emit('tank_supremacy_applied', {
                    ...baseData,
                    tankEffectivenessBoost: fixedEffects.tankEffectivenessBoost,
                    soldierEffectivenessPenalty: fixedEffects.soldierEffectivenessPenalty,
                    aircraftEffectivenessPenalty: fixedEffects.aircraftEffectivenessPenalty,
                    shipEffectivenessPenalty: fixedEffects.shipEffectivenessPenalty
                });
                break;
            case 'AIRCRAFT_SUPREMACY':
                this.emit('aircraft_supremacy_applied', {
                    ...baseData,
                    aircraftEffectivenessBoost: fixedEffects.aircraftEffectivenessBoost,
                    soldierEffectivenessPenalty: fixedEffects.soldierEffectivenessPenalty,
                    tankEffectivenessPenalty: fixedEffects.tankEffectivenessPenalty,
                    shipEffectivenessPenalty: fixedEffects.shipEffectivenessPenalty
                });
                break;
            case 'SHIP_SUPREMACY':
                this.emit('ship_supremacy_applied', {
                    ...baseData,
                    shipEffectivenessBoost: fixedEffects.shipEffectivenessBoost,
                    soldierEffectivenessPenalty: fixedEffects.soldierEffectivenessPenalty,
                    tankEffectivenessPenalty: fixedEffects.tankEffectivenessPenalty,
                    aircraftEffectivenessPenalty: fixedEffects.aircraftEffectivenessPenalty
                });
                break;

            // ══ HEALTH & ENVIRONMENT EVENTS ══
            case 'ADVANCED_GLOBAL_HEALTHCARE':
                this.emit('advanced_global_healthcare_applied', {
                    ...baseData,
                    happinessBoost: fixedEffects.happinessBoost,
                    diseaseRateReduction: fixedEffects.diseaseRateReduction,
                    diseaseSpawnReduction: fixedEffects.diseaseSpawnReduction,
                    taxableIncomePenalty: fixedEffects.taxableIncomePenalty
                });
                break;
            case 'COLOR_ADVANCED_HEALTHCARE':
                this.emit('color_advanced_healthcare_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    happinessBoost: fixedEffects.happinessBoost,
                    diseaseRateReduction: fixedEffects.diseaseRateReduction,
                    diseaseSpawnReduction: fixedEffects.diseaseSpawnReduction,
                    taxableIncomePenalty: fixedEffects.taxableIncomePenalty
                });
                break;
            case 'GREEN_GOALS':
                this.emit('green_goals_applied', {
                    ...baseData,
                    environmentBoost: fixedEffects.environmentBoost,
                    pollutionReduction: fixedEffects.pollutionReduction,
                    taxableIncomePenalty: fixedEffects.taxableIncomePenalty
                });
                break;
            case 'COLOR_GREEN_GOALS':
                this.emit('color_green_goals_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    environmentBoost: fixedEffects.environmentBoost,
                    pollutionReduction: fixedEffects.pollutionReduction,
                    taxableIncomePenalty: fixedEffects.taxableIncomePenalty
                });
                break;

            // ══ POPULATION & BUILDING EVENTS ══
            case 'CHILD_LABOR':
                this.emit('child_labor_applied', {
                    ...baseData,
                    childLaborEnabled: fixedEffects.childLaborEnabled,
                    happinessPenalty: fixedEffects.happinessPenalty
                });
                break;
            case 'COLOR_CHILD_LABOR':
                this.emit('color_child_labor_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    childLaborEnabled: fixedEffects.childLaborEnabled,
                    happinessPenalty: fixedEffects.happinessPenalty
                });
                break;
            case 'NEW_BUILD_OBJECTIVE':
                this.emit('new_build_objective_applied', {
                    ...baseData,
                    landPurchaseDiscount: fixedEffects.landPurchaseDiscount,
                    infraPurchaseDiscount: fixedEffects.infraPurchaseDiscount,
                    landUpkeepIncrease: fixedEffects.landUpkeepIncrease,
                    infraUpkeepIncrease: fixedEffects.infraUpkeepIncrease
                });
                break;
            case 'COLOR_NEW_BUILD_OBJECTIVE':
                this.emit('color_new_build_objective_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    landPurchaseDiscount: fixedEffects.landPurchaseDiscount,
                    infraPurchaseDiscount: fixedEffects.infraPurchaseDiscount,
                    landUpkeepIncrease: fixedEffects.landUpkeepIncrease,
                    infraUpkeepIncrease: fixedEffects.infraUpkeepIncrease
                });
                break;
            case 'RESTORATION_ACT':
                this.emit('restoration_act_applied', {
                    ...baseData,
                    landUpkeepDiscount: fixedEffects.landUpkeepDiscount,
                    infraUpkeepDiscount: fixedEffects.infraUpkeepDiscount,
                    landPurchaseIncrease: fixedEffects.landPurchaseIncrease,
                    infraPurchaseIncrease: fixedEffects.infraPurchaseIncrease
                });
                break;
            case 'COLOR_RESTORATION_ACT':
                this.emit('color_restoration_act_applied', {
                    ...baseData,
                    factionKey: motion.proposerFaction,
                    landUpkeepDiscount: fixedEffects.landUpkeepDiscount,
                    infraUpkeepDiscount: fixedEffects.infraUpkeepDiscount,
                    landPurchaseIncrease: fixedEffects.landPurchaseIncrease,
                    infraPurchaseIncrease: fixedEffects.infraPurchaseIncrease
                });
                break;

            // ══ FREE SPEECH & WORLD FORUM EVENTS ══
            case 'FREE_SPEECH_PROTECTION':
                this.emit('free_speech_protection_applied', {
                    ...baseData,
                    forumModerationDisabled: fixedEffects.forumModerationDisabled,
                    freeSpeechProtected: fixedEffects.freeSpeechProtected
                });
                break;
            case 'CONGRESSIONAL_TERM_LIMITS':
                this.emit('congressional_term_limits_applied', {
                    ...baseData,
                    maxMotionsPerFactionPerDay: fixedEffects.maxMotionsPerFactionPerDay
                });
                break;
            case 'VETO_POWER_ROTATION':
                this.emit('veto_power_rotation_applied', {
                    ...baseData,
                    vetoRotationEnabled: fixedEffects.vetoRotationEnabled
                });
                break;
            case 'EMERGENCY_POWERS':
                this.emit('emergency_powers_applied', {
                    ...baseData,
                    emergencyPowersEnabled: fixedEffects.emergencyPowersEnabled,
                    bypassWorldVote: fixedEffects.bypassWorldVote
                });
                break;
            case 'MOTION_COST_INCREASE':
                this.emit('motion_cost_increase_applied', {
                    ...baseData,
                    motionProposalCostMultiplier: fixedEffects.motionProposalCostMultiplier
                });
                break;
            case 'SUPERMAJORITY_REQUIREMENT':
                this.emit('supermajority_requirement_applied', {
                    ...baseData,
                    sanctionVoteThreshold: fixedEffects.sanctionVoteThreshold
                });
                break;

            // ══ SANCTION EVENTS ══
            case 'FACTION_SANCTION':
                this.emit('faction_sanction_applied', {
                    ...baseData,
                    sanctionType: fixedEffects.sanctionType,
                    severity: fixedEffects.severity,
                    sanctionBlocks: this.getSanctionBlocks('FACTION_SANCTION')
                });
                break;

            // ══ LEGACY PROCESSOR EVENTS ══
            case 'MILITARY_ALLIANCE':
                this.emit('military_alliance_formed', {
                    ...baseData,
                    factions: fixedEffects.allianceFactions,
                    duration: fixedEffects.duration
                });
                break;
            case 'TERRITORY_DISPUTE':
                this.emit('territory_dispute_resolved', {
                    ...baseData,
                    resolution: fixedEffects.territoryResolution
                });
                break;
            case 'RESEARCH_SHARING':
                this.emit('research_sharing_applied', {
                    ...baseData,
                    factions: motion.targets || [motion.proposerFaction],
                    bonus: fixedEffects.bonus
                });
                break;
            case 'WORLD_TAX':
                this.emit('world_tax_collected', {
                    ...baseData,
                    rate: fixedEffects.worldTaxRate,
                    purpose: fixedEffects.purpose
                });
                break;

            // ══ SPORTS MOTION EVENTS ══
            case 'SPORTS_XP_GAIN_BOOST':
                this.emit('sports_xp_gain_boost_applied', {
                    ...baseData,
                    xpGainBoost: fixedEffects.xpGainBoost,
                    fansGainedPenalty: fixedEffects.fansGainedPenalty
                });
                break;
            case 'SPORTS_FANS_GAIN_BOOST':
                this.emit('sports_fans_gain_boost_applied', {
                    ...baseData,
                    fansGainedBoost: fixedEffects.fansGainedBoost,
                    xpGainPenalty: fixedEffects.xpGainPenalty
                });
                break;
            case 'SPORTS_UPGRADE_SUBSIDY':
                this.emit('sports_upgrade_subsidy_applied', {
                    ...baseData,
                    upgradeCostReduction: fixedEffects.upgradeCostReduction,
                    gameRevenuePenalty: fixedEffects.gameRevenuePenalty
                });
                break;
            case 'SEASON_LENGTH_ALTERATION':
                this.emit('season_length_alteration_applied', {
                    ...baseData,
                    seasonLengthChangeAllowed: fixedEffects.seasonLengthChangeAllowed
                });
                break;
        }
    }

    /**
     * Apply a custom boost+penalty motion. Emits boost and penalty events.
     */
    applyCustomBoostPenaltyMotion(motion) {
        const { boost, penalty, scope, targets } = motion;

        // Validate values before applying
        const validation = this.validateBoostPenalty(boost.id, boost.value, penalty.id, penalty.value);
        if (!validation.valid) {
            console.error(`Invalid boost/penalty for motion ${motion.id}:`, validation.errors);
            return;
        }

        // Emit boost event
        const boostEntry = this.getBoostEntry(boost.id);
        if (boostEntry) {
            this.emit(boostEntry.applyEvent, {
                scope,
                targets: targets || [],
                boostId: boost.id,
                boostValue: validation.boost,
                duration: motion.parameters?.duration
            });
        }

        // Emit penalty event
        const penaltyEntry = this.getPenaltyEntry(penalty.id);
        if (penaltyEntry) {
            this.emit(penaltyEntry.applyEvent, {
                scope,
                targets: targets || [],
                penaltyId: penalty.id,
                penaltyValue: validation.penalty,
                duration: motion.parameters?.duration
            });
        }

        this.addActiveEffect(motion.id, {
            type: motion.type,
            boost: { id: boost.id, value: validation.boost },
            penalty: { id: penalty.id, value: validation.penalty },
            scope,
            duration: motion.parameters?.duration ? this.parseDurationMs(motion.parameters.duration) : null,
            startDate: Date.now(),
            originalMinSupport: 0.5
        }, motion);

        this.emit('motion_implemented', {
            motion,
            effect: { type: motion.type, boost: { id: boost.id, value: validation.boost }, penalty: { id: penalty.id, value: validation.penalty } }
        });
    }

    /**
     * Revoke a permanent or non-expiring motion (e.g. military alliance, calendar, name).
     * @param {string} motionId - The motion ID to revoke
     * @param {number} cancelSupport - The support level of the cancel vote (0-1)
     * @returns { {allowed: boolean, reason?: string, requiresSupport?: number} }
     */
    revokeMotion(motionId, cancelSupport) {
        const effect = this.activeEffects.get(motionId);
        if (!effect) return { allowed: false, reason: 'Motion not found' };

        // If it's a sanction, remove via sanction system
        if (effect.isSanction && effect.sanctionId) {
            const removed = this.removeSanction(effect.sanctionId);
            return { allowed: removed, reason: removed ? null : 'Failed to remove sanction' };
        }

        // Check minimum active days for amnesty motions
        const template = this.getPremadeTemplate(effect.type);
        if (template?.minActiveDays) {
            const elapsedDays = (Date.now() - effect.startDate) / (24 * 60 * 60 * 1000);
            if (elapsedDays < template.minActiveDays) {
                return {
                    allowed: false,
                    reason: `${template.name} must be active for at least ${template.minActiveDays} days before it can be canceled (${Math.ceil(template.minActiveDays - elapsedDays)} days remaining)`,
                    requiresSupport: template.minSupport
                };
            }
        }

        // Check cancel vote threshold matches original pass threshold
        const requiredSupport = effect.originalMinSupport || template?.minSupport || 0.5;
        if (cancelSupport !== undefined && cancelSupport < requiredSupport) {
            return {
                allowed: false,
                reason: `Canceling this motion requires ${Math.round(requiredSupport * 100)}% support (cancel vote has ${Math.round(cancelSupport * 100)}%)`,
                requiresSupport: requiredSupport
            };
        }

        // Remove the active effect
        const removed = this.removeActiveEffect(motionId);

        if (removed) {
            this.emit('motion_revoked', { motionId, type: effect.type });
        }

        return { allowed: removed, reason: removed ? null : 'Failed to remove effect' };
    }

    /**
     * Parse a duration string like "30 days" to days (number)
     */
    parseDurationDays(durationStr) {
        if (typeof durationStr === 'number') return durationStr;
        const str = String(durationStr).trim().toLowerCase();
        if (str === 'until canceled' || str === 'until cancelled' || str === 'permanent') return null;
        if (str === '1 year' || str === 'year') return 365;
        const match = str.match(/^(\d+)\s*(day|days|week|weeks|month|months)$/i);
        if (!match) return 30;
        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('week')) return amount * 7;
        if (unit.startsWith('month')) return amount * 30;
        return amount;
    }

    /**
     * Parse a duration string to milliseconds
     */
    parseDurationMs(durationStr) {
        const days = this.parseDurationDays(durationStr);
        return days === null ? null : days * 24 * 60 * 60 * 1000;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // SANCTION SYSTEM (World Forum only)
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Apply a sanction to a target (faction, nation, alliance, or color).
     * Sanctions are World Forum only and block attack/aid/diplomacy/color interaction.
     * Aid is still allowed in the game but sanctions can block it.
     */
    applySanction(sanctionId, targetKey, targetType, sanctionType, severity, durationDays, blockedActions, imposedBy) {
        const endTime = durationDays ? Date.now() + (durationDays * 24 * 60 * 60 * 1000) : null;

        const sanction = {
            id: sanctionId,
            targetKey,
            targetType, // 'faction', 'nation', 'alliance', 'color'
            sanctionType, // 'economic', 'military', 'diplomatic', 'comprehensive'
            severity, // 'minor', 'moderate', 'severe', 'critical'
            blockedActions: blockedActions || ['attack', 'aid', 'diplomacy', 'color_interaction'],
            imposedBy,
            imposedAt: Date.now(),
            endTime,
            isActive: true
        };

        this.activeSanctions.set(sanctionId, sanction);

        // Index by target for fast lookup
        if (!this.sanctionedTargets.has(targetKey)) {
            this.sanctionedTargets.set(targetKey, new Set());
        }
        this.sanctionedTargets.get(targetKey).add(sanctionId);

        this.emit('sanction_applied', {
            sanctionId,
            targetKey,
            targetType,
            sanctionType,
            severity,
            blockedActions,
            durationDays,
            imposedBy
        });

        console.log(`Sanction ${sanctionId} applied to ${targetType} ${targetKey}`);
        return sanction;
    }

    /**
     * Remove a sanction
     */
    removeSanction(sanctionId) {
        const sanction = this.activeSanctions.get(sanctionId);
        if (!sanction) return false;

        const targetSanctions = this.sanctionedTargets.get(sanction.targetKey);
        if (targetSanctions) {
            targetSanctions.delete(sanctionId);
            if (targetSanctions.size === 0) {
                this.sanctionedTargets.delete(sanction.targetKey);
            }
        }

        sanction.isActive = false;
        const removed = this.activeSanctions.delete(sanctionId);

        if (removed) {
            this.emit('sanction_removed', {
                sanctionId,
                targetKey: sanction.targetKey,
                targetType: sanction.targetType
            });
        }

        return removed;
    }

    /**
     * Check if a target is currently sanctioned for a specific action.
     * Returns { isSanctioned: boolean, sanctions: [] }
     */
    isTargetSanctioned(targetKey, action = null) {
        const sanctionIds = this.sanctionedTargets.get(targetKey);
        if (!sanctionIds || sanctionIds.size === 0) {
            return { isSanctioned: false, sanctions: [] };
        }

        const currentTime = Date.now();
        const activeSanctions = [];

        for (const sanctionId of sanctionIds) {
            const sanction = this.activeSanctions.get(sanctionId);
            if (!sanction || !sanction.isActive) continue;
            if (sanction.endTime && currentTime > sanction.endTime) {
                sanction.isActive = false;
                continue;
            }
            if (action && !sanction.blockedActions.includes(action)) continue;
            activeSanctions.push(sanction);
        }

        return {
            isSanctioned: activeSanctions.length > 0,
            sanctions: activeSanctions
        };
    }

    /**
     * Check if a nation/faction can perform an action (attack, aid, diplomacy, color_interaction).
     * Returns { allowed: boolean, reason: string|null, sanctions: [] }
     */
    canPerformAction(actorKey, targetKey, action) {
        const sanctionCheck = this.isTargetSanctioned(targetKey, action);
        if (sanctionCheck.isSanctioned) {
            const reasons = sanctionCheck.sanctions.map(s =>
                `${s.targetType} ${s.targetKey} is under ${s.severity} ${s.sanctionType} sanctions`
            ).join('; ');
            return {
                allowed: false,
                reason: `Action '${action}' blocked: ${reasons}`,
                sanctions: sanctionCheck.sanctions
            };
        }
        return { allowed: true, reason: null, sanctions: [] };
    }

    /**
     * Get all active sanctions for a target
     */
    getSanctionsForTarget(targetKey) {
        return this.isTargetSanctioned(targetKey).sanctions;
    }

    /**
     * Get all active sanctions
     */
    getAllSanctions() {
        return Array.from(this.activeSanctions.values()).filter(s => s.isActive);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EFFECT MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Add active effect from motion
     */
    addActiveEffect(motionId, effect, motion) {
        this.activeEffects.set(motionId, {
            ...effect,
            motionId,
            motionType: motion ? motion.type : undefined,
            startDate: effect.startDate || Date.now(),
            sourceMotion: motion
        });

        this.emit('motion_effect_applied', {
            motionId,
            effect
        });
    }

    /**
     * Remove active effect
     */
    removeActiveEffect(motionId) {
        const effect = this.activeEffects.get(motionId);
        if (effect && effect.onRemove) {
            try {
                effect.onRemove();
            } catch (error) {
                console.error(`Error removing effect for motion ${motionId}:`, error);
            }
        }

        const removed = this.activeEffects.delete(motionId);

        if (removed) {
            this.emit('motion_effect_removed', { motionId });
        }

        return removed;
    }

    /**
     * Handle daily processing of motion effects
     */
    handleDailyEffects(data) {
        const currentTime = Date.now();
        const expiredEffects = [];

        for (const [motionId, effect] of this.activeEffects.entries()) {
            if (effect.onDaily) {
                try {
                    effect.onDaily();
                } catch (error) {
                    console.error(`Error in daily effect processing for motion ${motionId}:`, error);
                }
            }

            if (effect.duration && currentTime - effect.startDate >= effect.duration) {
                expiredEffects.push(motionId);
            }
        }

        expiredEffects.forEach(motionId => this.removeActiveEffect(motionId));
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═════════════════════════════════════════════════════════════════════════════

    getActiveEffects() {
        return Array.from(this.activeEffects.values());
    }

    getMotionEffect(motionId) {
        const effect = this.activeEffects.get(motionId);
        return effect ? { ...effect } : undefined;
    }

    getPremadeTemplate(motionType) {
        return this.getPremadeMotionTemplates()[motionType];
    }
}

/**
 * Base Motion Processor Class
 */
class BaseMotionProcessor {
    process(motion) {
        throw new Error('Motion processor must implement process method');
    }
}

/**
 * Military Alliance Processor
 */
class MilitaryAllianceProcessor extends BaseMotionProcessor {
    process(motion) {
        const allianceFactions = motion.targets || [];

        return {
            type: 'military_alliance',
            factions: allianceFactions,
            duration: null, // Permanent until revoked via revokeMotion()
            onDaily: () => {
                this.applyAllianceBenefits(allianceFactions);
            }
        };
    }

    applyAllianceBenefits(factions) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('alliance_benefits_applied', { factions });
        }
    }
}

/**
 * Territory Dispute Processor
 */
class TerritoryDisputeProcessor extends BaseMotionProcessor {
    process(motion) {
        const params = motion.parameters || {};
        const disputedTerritory = params.territory;
        const resolution = params.resolution;

        this.resolveTerritoryDispute(disputedTerritory, resolution);

        return null; // No ongoing effect
    }

    resolveTerritoryDispute(territory, resolution) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('territory_dispute_resolved', { territory, resolution });
        }
    }
}

/**
 * Faction Sanction Processor (Sanction - blocks attack/aid/diplomacy/color)
 */
class FactionSanctionProcessor extends BaseMotionProcessor {
    process(motion) {
        const targetFaction = (motion.targets || [])[0];
        const params = motion.parameters || {};
        const sanctionType = params.type || 'economic';
        const severity = params.severity || 'moderate';

        return {
            type: 'faction_sanction',
            targetFaction,
            sanctionType,
            severity,
            duration: 14 * 24 * 60 * 60 * 1000, // 14 days
            onDaily: () => {
                this.applySanctions(targetFaction, sanctionType, severity);
            },
            onRemove: () => {
                this.removeSanctions(targetFaction);
            }
        };
    }

    applySanctions(targetFaction, type, severity) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sanctions_applied', { faction: targetFaction, type, severity });
        }
    }

    removeSanctions(targetFaction) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sanctions_removed', { faction: targetFaction });
        }
    }
}

/**
 * Research Sharing Processor
 */
class ResearchSharingProcessor extends BaseMotionProcessor {
    process(motion) {
        const participatingFactions = motion.targets || [motion.proposerFaction];
        const params = motion.parameters || {};
        const researchBonus = params.bonus || 0.2; // 20% research bonus

        return {
            type: 'research_sharing',
            factions: participatingFactions,
            bonus: researchBonus,
            duration: 60 * 24 * 60 * 60 * 1000, // 60 days
            onDaily: () => {
                this.applyResearchBonus(participatingFactions, researchBonus);
            }
        };
    }

    applyResearchBonus(factions, bonus) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('research_bonus_applied', { factions, bonus });
        }
    }
}

/**
 * World Tax Processor
 */
class WorldTaxProcessor extends BaseMotionProcessor {
    process(motion) {
        const params = motion.parameters || {};
        const taxRate = params.rate || 0.05; // 5% tax
        const purpose = params.purpose || 'infrastructure';

        return {
            type: 'world_tax',
            rate: taxRate,
            purpose,
            duration: 90 * 24 * 60 * 60 * 1000, // 90 days
            onDaily: () => {
                this.collectWorldTax(taxRate, purpose);
            }
        };
    }

    collectWorldTax(rate, purpose) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('world_tax_collected', { rate, purpose });
        }
    }
}

// Create global Motion System instance
const motionSystem = new MotionSystem();

// Expose on window for browser access
if (typeof window !== 'undefined') {
    window.motionSystem = motionSystem;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MotionSystem,
        motionSystem,
        BaseMotionProcessor,
        MilitaryAllianceProcessor,
        TerritoryDisputeProcessor,
        FactionSanctionProcessor,
        ResearchSharingProcessor,
        WorldTaxProcessor
    };
}
