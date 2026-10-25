/**
 * Game Constants and Configuration
 */

const GameConstants = {
    // ═══════════════════════════════════════════════════════════════════════
    // GAME CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    VERSION: '2.0.0',
    BUILD: 'Empire-2024',
    
    // Game Speed & Timing
    GAME_SPEED: 1000, // 1 second = 1 game tick
    FPS_TARGET: 60,
    UPDATE_INTERVAL: 1000,
    
    // Save System
    AUTO_SAVE_INTERVAL: 60000, // 1 minute
    BACKUP_INTERVAL: 600000,   // 10 minutes
    MAX_BACKUP_FILES: 10,
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION STARTING VALUES
    // ═══════════════════════════════════════════════════════════════════════
    
    INITIAL_LAND: 1000,           // Square miles
    INITIAL_INFRA: 100,          // Infrastructure points
    INITIAL_TECH: 0,              // Technology points
    INITIAL_HAPPINESS: 50,        // Happiness percentage
    INITIAL_MILITARY: 100,        // Military strength
    INITIAL_POPULATION: 0,        // Calculated from land/infra/tech
    
    INITIAL_RESOURCES: {
        money: 15000000,          // $15 million starting money
        iron: 0, lead: 0, lumber: 0, water: 0, food: 0,
        uranium: 0, coal: 0, oil: 0, limestone: 0, bauxite: 0,
        steel: 0, ammo: 0, paper: 0, cookedFood: 0,
        cement: 0, gas: 0, aluminum: 0
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // PLAYER STARTING VALUES
    // ═══════════════════════════════════════════════════════════════════════
    
    INITIAL_SKILL_POINTS: 100,
    BASE_ATTACK: 50,
    BASE_DEFENSE: 50,
    
    SKILL_NAMES: [
        'offense', 'defense', 'leadership', 'economy', 'geography',
        'political', 'espionage', 'nuclear', 'growth', 'commerce', 
        'engineering', 'medicine'
    ],
    
    // ═══════════════════════════════════════════════════════════════════════
    // ECONOMIC CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    BASE_TAX_RATE: 0.025,        // 2.5% base tax rate
    GDP_MULTIPLIER: 2.4,         // Population to GDP multiplier
    MILES_PER_BLOCK: 100,        // Land calculation
    
    // Resource Production
    PRIMARY_RESOURCE_MULTIPLIER: 10,
    BASE_RESOURCE_PRODUCTION: 100,
    
    // Costs
    LAND_COST_BASE: 2000,
    LAND_COST_MULTIPLIER: 1.1,
    INFRA_COST_BASE: 12000,
    TECH_COST_BASE: 50000,
    
    // ═══════════════════════════════════════════════════════════════════════
    // MILITARY CONFIGURATION  
    // ═══════════════════════════════════════════════════════════════════════
    
    // Military Capacity Limits (as percentage of population)
    MILITARY_CAPACITY: {
        soldiers: 0.25,      // 25% max
        tanks: 0.15,         // 15% max
        aircraft: 0.10,      // 10% max
        ships: 0.05,         // 5% max
        spies: 0.01,         // 1% max
        missiles: 0.005,     // 0.5% max
        nukes: 0.001         // 0.1% max
    },
    
    // Military Academy Bonus Limits
    MILITARY_ACADEMY_LIMITS: {
        soldiers: 0.30,      // +5% with academy
        tanks: 0.20,         // +5% with academy
        aircraft: 0.10,      // No bonus
        ships: 0.075         // +2.5% with academy
    },
    
    // Unit Strength Values
    UNIT_STRENGTH: {
        soldiers: 1,
        tanks: 25,
        aircraft: 100,
        ships: 200,
        spies: 10,
        missiles: 500,
        nukes: 2000
    },
    
    // Combat System
    WAR_ENERGY_MAX: 100,
    WAR_ENERGY_PER_ATTACK: 10,
    WAR_ENERGY_REGEN_RATE: 10, // per hour
    WAR_ROUND_DURATION: 4,     // hours
    
    // ═══════════════════════════════════════════════════════════════════════
    // GOVERNMENT & RELIGION TYPES
    // ═══════════════════════════════════════════════════════════════════════
    
    GOVERNMENT_TYPES: {
        monarchy: 'Monarchy',
        republic: 'Republic',
        democracy: 'Democracy',
        liberalDemocracy: 'Liberal Democracy',
        socialism: 'Socialism',
        communism: 'Communism',
        fascism: 'Fascism',
        anarchy: 'Anarchy',
        theocracy: 'Theocracy',
        dictatorship: 'Dictatorship',
        oligarchy: 'Oligarchy',
        technocracy: 'Technocracy'
    },
    
    RELIGION_TYPES: {
        monotheism: 'Monotheism',
        polytheism: 'Polytheism',
        atheism: 'Atheism',
        buddhism: 'Buddhism',
        hinduism: 'Hinduism',
        islam: 'Islam',
        christianity: 'Christianity',
        judaism: 'Judaism',
        shintoism: 'Shintoism',
        shamanism: 'Shamanism',
        scientology: 'Scientology',
        pastafarianism: 'Pastafarianism'
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESOURCES
    // ═══════════════════════════════════════════════════════════════════════
    
    BASIC_RESOURCES: [
        'iron', 'lead', 'lumber', 'water', 'food',
        'uranium', 'coal', 'oil', 'limestone', 'bauxite'
    ],
    
    MANUFACTURED_RESOURCES: [
        'steel', 'ammo', 'paper', 'cookedFood',
        'cement', 'gas', 'aluminum'
    ],
    
    CRITICAL_RESOURCES: ['water', 'food'],
    
    RESOURCE_ICONS: {
        money: '💰', iron: '⚒️', lead: '🔶', lumber: '🪵', water: '💧',
        food: '🍎', uranium: '☢️', coal: '🪨', oil: '🛢️', limestone: '🗿',
        bauxite: '⛏️', steel: '🔩', ammo: '💥', paper: '📄',
        cookedFood: '🍽️', cement: '🧱', gas: '⛽', aluminum: '🔗'
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // UI CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    THEMES: [
        'dark', 'light', 'sea', 'fire', 'forest',
        'royal', 'neon', 'cyberpunk', 'sunset', 'arctic'
    ],
    
    FONT_SIZES: [
        { name: 'Small', value: '12px' },
        { name: 'Medium', value: '14px' },
        { name: 'Large', value: '16px' },
        { name: 'Extra Large', value: '18px' },
        { name: 'Huge', value: '20px' }
    ],
    
    NAME_FONTS: [
        'Arial', 'Georgia', 'Times New Roman', 'Verdana',
        'Trebuchet MS', 'Palatino', 'Impact', 'Comic Sans MS',
        'Courier New', 'Lucida Console'
    ],
    
    // ═══════════════════════════════════════════════════════════════════════
    // MAP CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    MAP_WIDTH: 2000,
    MAP_HEIGHT: 1000,
    MAP_TILE_SIZE: 20,
    
    MAP_ZOOM: {
        MIN: 0.1,
        MAX: 8.0,
        DEFAULT: 1.0,
        STEP: 0.1
    },
    
    // Territory Colors — derived from GAME_COLORS (core/colors.js).
    // Kept as a simple key→hex map for any legacy code that reads it.
    get FACTION_COLORS() {
        if (typeof GAME_COLORS === 'undefined') return {};
        const out = {};
        for (const [k, v] of Object.entries(GAME_COLORS)) out[k] = v.hex;
        return out;
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // ALLIANCE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    ALLIANCE_SKILLS: [
        'leadership', 'coordination', 'intelligence', 'logistics',
        'diplomacy', 'warfare', 'economics', 'technology',
        'culture', 'defense', 'expansion', 'unity'
    ],
    
    ALLIANCE_ROLES: {
        founder: 'Founder',
        leader: 'Leader', 
        officer: 'Officer',
        member: 'Member',
        recruit: 'Recruit'
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // FORMULAS CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    FORMULAS: {
        AGE_FACTOR_DIVISOR: 7,     // Nation age formula
        HAPPINESS_BASE: 50,         // Base happiness
        POLLUTION_BASE: 0,          // Base pollution
        DISEASE_BASE: 10,           // Base disease rate
        CRIME_BASE: 15,             // Base crime rate
        LITERACY_BASE: 0,           // Base literacy
        ENVIRONMENT_BASE: 50        // Base environment quality
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // API CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    
    API: {
        RATE_LIMITS: {
            public: 100,        // requests per minute
            game_data: 1000,
            private: 10000
        },
        
        CACHE_TTL: 300000,     // 5 minutes
        
        PERMISSIONS: [
            'public', 'game_data', 'player_data', 'private_messages',
            'military_data', 'analytics', 'write', 'admin'
        ]
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // DEBUG & DEVELOPMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    DEBUG: {
        ENABLED: true,
        LOG_LEVEL: 'info',      // 'debug', 'info', 'warn', 'error'
        SHOW_FPS: false,
        SHOW_PERFORMANCE: false,
        MOCK_DATA: false
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION LIMITS
    // ═══════════════════════════════════════════════════════════════════════
    
    VALIDATION: {
        NATION_NAME: { min: 3, max: 50 },
        LEADER_NAME: { min: 2, max: 30 },
        ALLIANCE_NAME: { min: 3, max: 40 },
        MESSAGE_LENGTH: { min: 1, max: 1000 },
        PASSWORD: { min: 8, max: 128 },
        FILE_SIZE_MAX: 5 * 1024 * 1024, // 5MB
        
        ALLOWED_FILE_TYPES: {
            images: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            flags: ['image/png', 'image/jpeg', 'image/svg+xml']
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENT TYPES
    // ═══════════════════════════════════════════════════════════════════════
    
    EVENTS: {
        // Game Events
        GAME_STARTED: 'game:started',
        GAME_LOADED: 'game:loaded',
        GAME_SAVED: 'game:saved',
        TURN_UPDATED: 'turn:updated',
        
        // Nation Events
        NATION_CREATED: 'nation:created',
        NATION_UPDATED: 'nation:updated',
        POPULATION_CHANGED: 'nation:population_changed',
        RESOURCES_CHANGED: 'nation:resources_changed',
        
        // Player Events
        PLAYER_CREATED: 'player:created',
        PLAYER_UPDATED: 'player:updated',
        SKILL_CHANGED: 'player:skill_changed',
        LEVEL_UP: 'player:level_up',
        
        // War Events
        WAR_DECLARED: 'war:declared',
        WAR_ENDED: 'war:ended',
        ATTACK_LAUNCHED: 'war:attack_launched',
        BATTLE_RESULT: 'war:battle_result',
        
        // Alliance Events
        ALLIANCE_CREATED: 'alliance:created',
        ALLIANCE_JOINED: 'alliance:joined',
        ALLIANCE_LEFT: 'alliance:left',
        ALLIANCE_DISBANDED: 'alliance:disbanded',
        
        // Diplomacy Events
        TREATY_PROPOSED: 'diplomacy:treaty_proposed',
        TREATY_ACCEPTED: 'diplomacy:treaty_accepted',
        TREATY_REJECTED: 'diplomacy:treaty_rejected',
        RELATION_CHANGED: 'diplomacy:relation_changed',
        
        // UI Events
        PANEL_OPENED: 'ui:panel_opened',
        PANEL_CLOSED: 'ui:panel_closed',
        THEME_CHANGED: 'ui:theme_changed',
        SETTINGS_CHANGED: 'ui:settings_changed'
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // ERROR CODES
    // ═══════════════════════════════════════════════════════════════════════
    
    ERROR_CODES: {
        VALIDATION_FAILED: 'VALIDATION_FAILED',
        INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES',
        INVALID_OPERATION: 'INVALID_OPERATION',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        NOT_FOUND: 'NOT_FOUND',
        SYSTEM_ERROR: 'SYSTEM_ERROR'
    }
};

// Freeze the object to prevent modifications
Object.freeze(GameConstants);

// Make available globally
if (typeof window !== 'undefined') {
    window.GameConstants = GameConstants;
    window.GameConfig = GameConstants; // Alias for compatibility
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConstants;
}