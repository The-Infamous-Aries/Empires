/**
 * Game Configuration and Constants
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 */

const GameConfig = {
    // Game Information
    GAME_TITLE: "Sovereignty Epochs",
    VERSION: "1.0.0",
    
    // ── Starting nation values ─────────────────────────────────────────────────
    // $10,000,000 money, 1,000 land (miles), 1,000 infra, 0 tech
    // First 10 map blocks (100 mi each) are free; after that cost money.
    INITIAL_RESOURCES: {
        money:     10_000_000
    },

    INITIAL_LAND:   1000,   // miles
    INITIAL_INFRA:  100,
    INITIAL_TECH:   0,

    // Miles of land per visible map block
    MILES_PER_BLOCK: 100,
    // First N blocks given free at nation creation
    FREE_STARTING_BLOCKS: 10,

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
    //    pop = Land * Infra * Tech * ageFactor
    //    ageFactor = max(1, nationAgeDays / 30)
    //    (Tech=0 → pop=0; buy tech to unlock population)
    //
    //  LAND COST (per new 100-mile block after the first 10):
    //    cost = nextBlockNumber * (population / 1000) * 10
    //    where nextBlockNumber = current blocks owned + 1
    //
    //  INFRA COST (per +1 infra):
    //    cost = (currentInfra + 1) * (population / 1000) * 10
    //
    //  TECH COST (per +1 tech level):
    //    cost = nextTechLevel * (Land / 100) * (Infra / 100) * (population / 1000)
    //
    //  TAXABLE INCOME (per turn):
    //    taxableIncome = (Infra / 50) * population * Tech
    //
    //  TAX REVENUE (per turn):
    //    taxRevenue = taxableIncome * (taxRate / 100)
    //    taxRate starts at 2.5% (base); each Taxation skill level adds 2.5%
    //
    FORMULAS: {
        // ageFactor: max(1, totalDays / 30)
        AGE_FACTOR_DIVISOR:       30,
        // population = land * infra * tech * ageFactor
        POP_LAND_COEFF:           1,
        POP_INFRA_COEFF:          1,
        POP_TECH_COEFF:           1,
        // land/infra cost multipliers
        LAND_COST_POP_DIVISOR:    1000,
        LAND_COST_MULTIPLIER:     10,
        INFRA_COST_POP_DIVISOR:   1000,
        INFRA_COST_MULTIPLIER:    10,
        // tech cost multipliers
        TECH_COST_LAND_DIVISOR:   100,
        TECH_COST_INFRA_DIVISOR:  100,
        TECH_COST_POP_DIVISOR:    1000,
        // taxable income
        TAXABLE_INFRA_DIVISOR:    50,
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
    
    // Building Costs
    BUILDING_COSTS: {
        HOUSE: { money: 1000 },
        FACTORY: { money: 5000 },
        FARM: { money: 2000 },
        POWER_PLANT: { money: 8000 },
        RESEARCH_CENTER: { money: 10000 },
        BARRACKS: { money: 3000 },
        HOSPITAL: { money: 6000 },
        SCHOOL: { money: 4000 }
    },
    
    // Military Unit Costs
    MILITARY_COSTS: {
        SOLDIER: { money: 100 },
        TANK: { money: 5000 },
        AIRCRAFT: { money: 20000 },
        SHIP: { money: 50000 }
    },

    // Aid Settings (nations can send aid to each other)
    AID: {
        COOLDOWN_MS: 3600000,       // 1 hour between aid sends
        MAX_AMOUNT: 1000000,        // Max money per aid transfer
        MIN_AMOUNT: 1000,           // Min money per aid transfer
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
    AID_SENT: 'aid_sent',
    AID_RECEIVED: 'aid_received',
    
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
    
    // UI Events
    MODAL_OPENED: 'modal_opened',
    MODAL_CLOSED: 'modal_closed',
    NOTIFICATION_SHOWN: 'notification_shown',

    // Global System Events
    GLOBAL_AVERAGES_UPDATED: 'global_averages_updated',
    GLOBAL_ENVIRONMENT_CALCULATED: 'global_environment_calculated',
    GLOBAL_DISEASE_SPAWN_CHECK: 'global_disease_spawn_check',
    GLOBAL_DISEASE_OUTBREAK: 'global_disease_outbreak',
    GLOBAL_MAJORITY_SHIFTED: 'global_majority_shifted',
    GLOBAL_SPECIAL_OFFER: 'global_special_offer',
    GLOBAL_SPORTS_STATS_UPDATED: 'global_sports_stats_updated',
    GLOBAL_EDUCATION_BUILDING_STATS_UPDATED: 'global_education_building_stats_updated',
    GLOBAL_WAR_STATS_UPDATED: 'global_war_stats_updated',
    GLOBAL_MILITARY_UNIT_STATS_UPDATED: 'global_military_unit_stats_updated',
    GLOBAL_CURRENCY_STATS_UPDATED: 'global_currency_stats_updated',
    GLOBAL_DISEASE_STATS_UPDATED: 'global_disease_stats_updated',
    GLOBAL_POPULATION_DEMOGRAPHICS_UPDATED: 'global_population_demographics_updated',

    // Lottery Events
    LOTTERY_DRAWING_COMPLETE: 'lottery_drawing_complete',
    LOTTERY_PRIZE_WON: 'lottery_prize_won',
    LOTTERY_TICKET_PURCHASED: 'lottery_ticket_purchased'
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConfig, ResourceTypes, BuildingTypes, MilitaryUnitTypes, GameEvents };
}