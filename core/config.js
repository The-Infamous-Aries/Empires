/**
 * Game Configuration and Constants
 * Dominion Wars - Nation Building Strategy Game
 */

const GameConfig = {
    // Game Information
    GAME_TITLE: "Dominion Wars",
    VERSION: "1.0.0",
    
    // ── Starting nation values ─────────────────────────────────────────────────
    // $10,000,000 money, 1,000 land (miles), 1,000 infra, 0 tech
    // First 10 map blocks (100 mi each) are free; after that cost money.
    INITIAL_RESOURCES: {
        money:     50_000_000
    },

    INITIAL_LAND:   1000,   // miles
    INITIAL_INFRA:  1000,   // infrastructure
    INITIAL_TECH:   0,

    // Miles of land per visible map block
    MILES_PER_BLOCK: 100,
    // First N blocks given free at nation creation (1000 miles = 10 blocks)
    FREE_STARTING_BLOCKS: 10,
    // First N infrastructure given free at nation creation
    FREE_STARTING_INFRA: 1000,

    // ── Starting player skill floors (base values before any skill points) ──
    BASE_ATTACK:   50,
    BASE_DEFENSE:  50,
    BASE_AIM:      10,    // % (not decimal — converted when used)
    BASE_ENERGY:   100,
    BASE_INTUITION: 50,
    BASE_LUCK:     5,     // %
    BASE_TAX_RATE: 2.5,   // % — matches the Taxation skill at level 0

    INITIAL_POPULATION: 0,    // population = 0 until tech > 0
    INITIAL_HAPPINESS:  50,
    INITIAL_GDP:        0,
    INITIAL_MILITARY:   50,   // = BASE_ATTACK + BASE_DEFENSE flat value

    // ── Time ──────────────────────────────────────────────────────────────
    // 1 turn = 1 real hour = 1 game day.  30 days/month, 12 months/year.
    GAME_SPEED: 3_600_000,   // ms — 1 real hour per turn
    MMO_MODE:   true,

    // ── Formulas (documented here, implemented in Nation.js) ─────────────
    //
    //  POPULATION:
    //    pop = (Land × Infra × (Tech + 1) × ageFactor) × modifiers
    //    ageFactor = max(1, nationAgeDays / 30)
    //    (Tech = 0 still produces population from Land × Infra)
    //    Modifiers: Happiness, Disease, Crime, Environment, Literacy, Tech,
    //    Military safety, Improvements, Projects, Wonders
    //
    //  LAND COST (per next 100-mile block after first 10 free blocks):
    //    Base $5,000 per block
    //    Every 10 blocks past free: +10% cost
    //    Every 100 blocks past free: +50% cost (compounding)
    //    First 10 blocks (1000 miles) are FREE
    //
    //  INFRA COST (per +1 infra after first 1000 free):
    //    Base $1,000 per level
    //    Every 1000 levels past free: +10% cost
    //    Every 10000 levels past free: +50% cost (compounding)
    //
    //  TECH COST (per +1 tech level):
    //    Base = nextLevel × 50
    //    Discount: up to 10% of (Land+Infra)/2 average gets cheaper
    //    Max 80% discount at avg = 5000
    //    Cost never drops below nextLevel × 5
    //    Improvements/Projects/Wonders reductions apply
    //
    //  TAXABLE INCOME (per turn):
    //    taxableIncome = Population × TechMod × LiteracyMod × HappinessMod × 0.01
    //    TechMod      = 1.0 + tech × 0.001
    //    LiteracyMod  = 1.0 + literacy × 0.01
    //    HappinessMod = 1.0 + (happiness − 50) × 0.005
    //
    //  TAX REVENUE (per turn):
    //    taxRevenue = taxableIncome × (taxRate / 100) × taxEfficiency × govModifier
    //    taxRate = BASE_TAX_RATE (2.5%) + Taxation skill (2.5% per level, max 50%)
    //
    //  LITERACY RATE:
    //    Grows slowly: tech × 0.01 (max 20%) + age × 0.05 (max 15%)
    //    + Improvements/Projects/Wonders/Policies
    //    Hard cap at 40%
    //
    FORMULAS: {
        // ageFactor: max(1, totalDays / 30)
        AGE_FACTOR_DIVISOR:       30,
        // population = land * infra * (tech + 1) * ageFactor * modifiers
        POP_LAND_COEFF:           1,
        POP_INFRA_COEFF:          1,
        POP_TECH_COEFF:           1,
        // land cost scaling
        LAND_COST_BASE:           5000,
        LAND_COST_TIER_STEP:      10,      // every 10 blocks = small increase
        LAND_COST_TIER_RATE:      0.10,    // +10% per tier
        LAND_COST_MAJOR_STEP:     100,     // every 100 blocks = large increase
        LAND_COST_MAJOR_RATE:     0.50,    // +50% per major tier
        // infra cost scaling
        INFRA_COST_BASE:          1000,
        INFRA_COST_TIER_STEP:     1000,    // every 1000 levels = small increase
        INFRA_COST_TIER_RATE:     0.10,
        INFRA_COST_MAJOR_STEP:    10000,   // every 10000 levels = large increase
        INFRA_COST_MAJOR_RATE:    0.50,
        // tech cost scaling
        TECH_COST_BASE:           50,      // per level multiplier
        TECH_COST_MIN:            5,       // minimum per level multiplier
        TECH_COST_DISCOUNT_MAX:   0.80,    // max 80% discount
        TECH_COST_DISCOUNT_AVG_MAX: 5000,  // avg at which max discount reached
        TECH_COST_DISCOUNT_PCT:   0.10,    // up to 10% of average gets discount
        // taxable income
        TAXABLE_BASE_DIVISOR:     100,     // × 0.01
        TAXABLE_TECH_RATE:        0.001,
        TAXABLE_LITERACY_RATE:    0.01,
        TAXABLE_HAPPINESS_RATE:   0.005,
    },
    
    // Player Progression System
    // XP formula: floor(100 × 2 × 1.12^(level-1) × legendaryLevel)
    // See Player.js — SKILL_DEFS and SKILL_COST_TABLE live there.
    PLAYER_LEVELS: {
        MAX_LEVEL:              100,
        SKILL_POINTS_PER_LEVEL: 5,       // +5 per level → 500 total at level 100
        LEGENDARY_SKILL_REWARD: 2,       // +2 permanent legendary skill pts per prestige
        XP_BASE:                100,
        XP_GROWTH_FACTOR:       1.12
    },
    
    // Save System Settings
    SAVE: {
        AUTO_SAVE_INTERVAL: 300000, // 5 minutes in milliseconds
        MAX_SAVE_SLOTS: 10,
        COMPRESSION_ENABLED: true,
        BACKUP_COUNT: 3
    },
    
    // Debug Settings
    DEBUG: {
        ENABLED: true,
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
        SHOW_FPS: false,
        SHOW_COORDINATES: false,
        UNLIMITED_RESOURCES: false
    },

    // Faction Colors — getter so GameConfig.FACTION_COLORS always returns
    // the live 10-color list from core/colors.js regardless of load order.
    // Returns a plain { key: hex, … } object for backwards compatibility.
    get FACTION_COLORS() {
        if (typeof GAME_COLORS === 'undefined') return {};
        const out = {};
        for (const [k, v] of Object.entries(GAME_COLORS)) out[k] = v.hex;
        return out;
    },
    
    // UI Settings
    UI: {
        NOTIFICATION_DURATION: 5000,
        ANIMATION_DURATION: 300,
        TOOLTIP_DELAY: 500
    },
    
    // Player Skills — definitions live in entities/Player.js (SKILL_DEFS).
    // Keeping this stub so older code that references GameConfig.PLAYER_SKILLS
    // doesn't hard-crash; real skill logic uses SKILL_DEFS directly.
    PLAYER_SKILLS: {},

    // Experience Sources (flat XP rewards per activity)
    EXPERIENCE_SOURCES: {
        DAILY_LOGIN: 50,
        TERRITORY_CLAIMED: 500,
        BATTLE_WON: 1000,
        BATTLE_LOST: 250,
        TRADE_COMPLETED: 100,
        ALLIANCE_FORMED: 750,
        RESEARCH_COMPLETED: 300,
        BUILDING_CONSTRUCTED: 150,
        TREATY_SIGNED: 400,
        SPY_MISSION_SUCCESS: 200,
        POPULATION_MILESTONE: 250,
        GDP_MILESTONE: 300
    },
    
    // Map Settings
    MAP: {
        WIDTH: 1200,
        HEIGHT: 800,
        INITIAL_ZOOM: 1.0,
        MIN_ZOOM: 0.5,
        MAX_ZOOM: 3.0,
        ZOOM_STEP: 0.1
    },
    
    // Resource Generation Rates (per day)
    RESOURCE_GENERATION: {
        BASE_MONEY_PER_CITIZEN: 5,
        BASE_MATERIALS_PER_INDUSTRIAL: 10,
        BASE_FOOD_PER_AGRICULTURAL: 8,
        BASE_ENERGY_PER_POWER_PLANT: 15,
        BASE_TECH_PER_RESEARCH_CENTER: 3
    },
    
    // Building Costs
    BUILDING_COSTS: {
        HOUSE: { money: 1000, materials: 50 },
        FACTORY: { money: 5000, materials: 200, energy: 10 },
        FARM: { money: 2000, materials: 75 },
        POWER_PLANT: { money: 8000, materials: 300 },
        RESEARCH_CENTER: { money: 10000, materials: 150, energy: 20 },
        BARRACKS: { money: 3000, materials: 100 },
        HOSPITAL: { money: 6000, materials: 120, energy: 15 },
        SCHOOL: { money: 4000, materials: 80 }
    },
    
    // Military Unit Costs
    MILITARY_COSTS: {
        SOLDIER: { money: 100, materials: 10 },
        TANK: { money: 5000, materials: 200, energy: 50 },
        AIRCRAFT: { money: 20000, materials: 500, energy: 100, technology: 10 },
        SHIP: { money: 50000, materials: 1000, energy: 200, technology: 20 }
    },
    
    // Population Growth
    POPULATION_GROWTH: {
        BASE_RATE: 0.001,  // 0.1% per day
        HAPPINESS_MODIFIER: 0.002,  // Additional growth based on happiness
        CAPACITY_MODIFIER: 0.5  // Reduced growth when near capacity
    },
    
    // Happiness Factors
    HAPPINESS_FACTORS: {
        UNEMPLOYMENT_PENALTY: -0.5,
        HEALTHCARE_BONUS: 0.3,
        EDUCATION_BONUS: 0.2,
        SAFETY_BONUS: 0.4,
        PROSPERITY_BONUS: 0.6
    },
    
    // Research Categories
    RESEARCH_CATEGORIES: {
        MILITARY: "military",
        ECONOMIC: "economic",
        INFRASTRUCTURE: "infrastructure",
        SOCIAL: "social",
        ENVIRONMENTAL: "environmental"
    },
    
    // Government Types
    GOVERNMENT_TYPES: {
        DEMOCRACY: {
            name: "Democracy",
            economyBonus: 1.1,
            militaryBonus: 0.9,
            happinessBonus: 1.2,
            corruptionPenalty: 0.95
        },
        MONARCHY: {
            name: "Monarchy",
            economyBonus: 1.0,
            militaryBonus: 1.1,
            happinessBonus: 0.9,
            corruptionPenalty: 0.9
        },
        REPUBLIC: {
            name: "Republic",
            economyBonus: 1.05,
            militaryBonus: 1.0,
            happinessBonus: 1.1,
            corruptionPenalty: 0.98
        },
        DICTATORSHIP: {
            name: "Dictatorship",
            economyBonus: 0.9,
            militaryBonus: 1.3,
            happinessBonus: 0.7,
            corruptionPenalty: 0.8
        }
    },
    
    // Economic Policies
    ECONOMIC_POLICIES: {
        CAPITALIST: { growth: 1.2, inequality: 1.3, innovation: 1.4 },
        SOCIALIST: { growth: 0.9, inequality: 0.7, welfare: 1.5 },
        MIXED: { growth: 1.0, inequality: 1.0, stability: 1.2 }
    },
};

// Resource Types Enumeration
const ResourceTypes = {
    MONEY: 'money',
    MATERIALS: 'materials',
    FOOD: 'food',
    ENERGY: 'energy',
    TECHNOLOGY: 'technology'
};

// Building Types Enumeration
const BuildingTypes = {
    RESIDENTIAL: 'residential',
    COMMERCIAL: 'commercial',
    INDUSTRIAL: 'industrial',
    MILITARY: 'military',
    GOVERNMENT: 'government',
    SPECIAL: 'special'
};

// Military Unit Types Enumeration
const MilitaryUnitTypes = {
    INFANTRY: 'infantry',
    ARMORED: 'armored',
    NAVAL: 'naval',
    AIR_FORCE: 'air_force',
    NUCLEAR: 'nuclear'
};

// Game Events Enumeration
const GameEvents = {
    // Game State
    GAME_STARTED: 'game_started',
    GAME_PAUSED: 'game_paused',
    GAME_RESUMED: 'game_resumed',
    GAME_SAVED: 'game_saved',
    GAME_LOADED: 'game_loaded',
    
    // Time Events
    DAY_PASSED: 'day_passed',
    MONTH_PASSED: 'month_passed',
    YEAR_PASSED: 'year_passed',
    
    // Nation Events
    NATION_CREATED: 'nation_created',
    NATION_UPDATED: 'nation_updated',
    NATION_LOADED:  'nation_loaded',
    RESOURCES_CHANGED: 'resources_changed',
    POPULATION_CHANGED: 'population_changed',
    HAPPINESS_CHANGED: 'happiness_changed',
    
    // Government & Religion Events
    GOVERNMENT_DEMAND: 'government_demand',
    GOVERNMENT_CHANGED: 'government_changed',
    RELIGION_DEMAND: 'religion_demand',
    RELIGION_CHANGED: 'religion_changed',

    // Player Progression Events
    PLAYER_LEVEL_UP:          'player_level_up',
    PLAYER_WENT_LEGENDARY:    'player_went_legendary',
    SKILL_UPGRADED:           'skill_upgraded',
    LEGENDARY_SKILL_ALLOCATED:'legendary_skill_allocated',
    EXPERIENCE_GAINED:        'experience_gained',
    ACHIEVEMENT_UNLOCKED:     'achievement_unlocked',
    
    // Building Events
    BUILDING_CONSTRUCTED: 'building_constructed',
    BUILDING_UPGRADED: 'building_upgraded',
    BUILDING_DESTROYED: 'building_destroyed',
    
    // Military Events
    UNIT_RECRUITED: 'unit_recruited',
    UNIT_DEPLOYED: 'unit_deployed',
    BATTLE_STARTED: 'battle_started',
    BATTLE_ENDED: 'battle_ended',
    
    // Diplomacy Events
    ALLIANCE_FORMED: 'alliance_formed',
    WAR_DECLARED: 'war_declared',
    PEACE_TREATY: 'peace_treaty',
    TRADE_AGREEMENT: 'trade_agreement',
    
    // Research Events
    RESEARCH_COMPLETED: 'research_completed',
    RESEARCH_STARTED: 'research_started',
    TECHNOLOGY_UNLOCKED: 'technology_unlocked',

    // Nation Territory / Infrastructure / Military Events
    TERRITORY_ADDED: 'territory_added',
    TERRITORY_REMOVED: 'territory_removed',
    INFRASTRUCTURE_BUILT: 'infrastructure_built',
    MILITARY_TRAINED: 'military_trained',
    DIPLOMATIC_RELATION_CHANGED: 'diplomatic_relation_changed',

    // Misc Nation events used in Nation.js
    RANDOM_EVENT: 'random_event',
    ANNUAL_REPORT: 'annual_report',
    TRADE_COMPLETED: 'trade_completed',
    
    // UI Events
    MODAL_OPENED: 'modal_opened',
    MODAL_CLOSED: 'modal_closed',
    NOTIFICATION_SHOWN: 'notification_shown'
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConfig, ResourceTypes, BuildingTypes, MilitaryUnitTypes, GameEvents };
}