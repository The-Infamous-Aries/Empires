/**
 * Nation Entity - Core Nation State and Properties
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * ── KEY FORMULAS (all verified in config.js comments) ────────────────────────
 *
 *   population    = land * infra * tech * ageFactor
 *   ageFactor     = max(1, nationAgeDays / 30)
 *   taxableIncome = (infra / 50) * population * tech
 *   taxRevenue    = taxableIncome * (taxRate / 100)         [per turn]
 *   landCost      = nextBlock * (population / 1000) * 10
 *   infraCost     = (infra + 1) * (population / 1000) * 10
 *   techCost      = nextTechLevel * (land/100) * (infra/100) * (population/1000)
 */

// NationEvents is loaded as a global via script tag in index.html
// Use window.NationEvents in browser context

class NationClass {
    constructor() {
        this.isInitialized = false;

        // ── Equipment (loot system) ────────────────────────────────────────
        this.equipment = {
            inventory: [],
            keys: { key1: 0, key2: 0, key3: 0 },
            chests: { chest1: 0, chest2: 0, chest3: 0, chest4: 0 },
            equipped: { weapon: null, head: null, body: null, arms: null, legs: null, feet: null, tool: null },
            // Goal streak tracking
            goalStreaks: {
                dailyStreak: 0,      // Consecutive days with 7/10 daily goals completed
                weeklyStreak: 0,     // Consecutive weeks with 7/10 weekly goals completed
                monthlyStreak: 0,    // Consecutive months with 7/10 monthly goals completed
            },
            // Chest stacking for monthly goal streaks (chest3 -> chest4 conversion)
            chestStacks: {
                chest3: 0,           // Accumulated chest3s from monthly streak
                chest4: 0,           // Accumulated chest4s from monthly streak
            },
            // Login streak chest tracking
            loginStreakChests: {
                consecutiveDays: 0,  // Consecutive days logged in
                lastLoginDate: null, // YYYY-MM-DD of last login
                weeklyChestCount: 0, // Chest2s granted this month from weekly login streak
                monthlyChestCount: 0,// Chest3s granted this month from bi-weekly login streak
                loginMonthYear: null,// YYYY-MM of current month
                allMonthDaysLogged: false, // Whether every day of month logged in
            },
        };

        // ── Identity ───────────────────────────────────────────────────────
        this.name        = '';
        this.leader      = '';
        this.government  = 'liberalDemocracy';
        this.religion    = 'monotheism';
        this.founded     = null;      // real-world timestamp
        this.foundedDay  = 0;         // game totalDays at creation (for age calc)
        this.flag        = null;
        this.motto       = '';
        this.capitalCity = '';

        // ── Government/religion happiness bonuses (applied in calculateHappiness) ───
        this.governmentHappinessBonus = 1.0;
        this.religionHappinessBonus = 1.0;

        // ── Faction ────────────────────────────────────────────────────────
        this.factionKey   = null;
        this.factionColor = null;
        this.currency     = null;

        // ── National Pet (cosmetic only, no gameplay effect) ──
        this.nationalPet = null;

        // ── National Food & Water (cosmetic only, no gameplay effect) ──
        this.nationalFood = null;
        this.nationalWater = null;
        this.nationalPetChangedDay = null;
        this.nationalFoodChangedDay = null;
        this.nationalWaterChangedDay = null;

        // ── Core nation stats ──────────────────────────────────────────────
        // Land is stored in miles; blocks = Math.floor(land / 100)
        this.land       = GameConfig.INITIAL_LAND;   // miles
        this.infra      = GameConfig.INITIAL_INFRA;
        this.tech       = GameConfig.INITIAL_TECH;   // starts at 0
        this.sharedTechnology = 0; // Technology shared from allies or research treaties
        this.population = 0;   // computed each turn
        this.happiness  = GameConfig.INITIAL_HAPPINESS;
        this.stability  = 100;
        this.reputation = 50;

        // ── Money / economy ────────────────────────────────────────────────
        this.money          = GameConfig.INITIAL_RESOURCES.money; // $10,000,000
        this.taxRate        = GameConfig.BASE_TAX_RATE;           // 2.5% base
        this.taxableIncome  = 0;   // computed each turn
        this.taxRevenue     = 0;   // money earned last turn
        this.totalTaxEarned = 0;
        
        this.budget = { income: 0, expenses: 0, balance: 0 };
        this.debt   = 0;
        
        // ── Stacked Taxes & Bills (World Bank interest) ─────────────────────
        this.stackedTaxes = 0;
        this.stackedTaxesTurns = 0;
        this.lastTaxInterestRate = 0;
        this.stackedBills = 0;
        this.stackedBillsTurns = 0;
        this.lastBillInterestRate = 0;
        this.edictUnlocked = {};
        this.edicts = null;
        this.edictChangeDates = null;
        this.edictFreePassUsed = false;
        this.edictEffects = null;
        this.edictSynergies = [];
        this.discoveredSynergies = [];
        this.synergyDays = {};
        
        // ── Resources ──────────────────────────────────────────────────────
        this.resources = {
            money: GameConfig.INITIAL_RESOURCES.money,
            steel:   { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            bronze:  { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            lead:    { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            aluminum:{ raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            copper:  { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            uranium: { raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            gasoline:{ raw: 0, stage1: 0, stage2: 0, stage3: 0, manufactured: 0 },
            food: 0,
            water: 0,
            resourceStageTurn: {
                steel:   { raw: 0, stage1: 0, stage2: 0, stage3: 0 },
                bronze:  { raw: 0, stage1: 0, stage2: 0, stage3: 0 },
                lead:    { raw: 0, stage1: 0, stage2: 0, stage3: 0 },
                aluminum:{ raw: 0, stage1: 0, stage2: 0, stage3: 0 },
                copper:  { raw: 0, stage1: 0, stage2: 0, stage3: 0 },
                uranium: { raw: 0, stage1: 0, stage2: 0, stage3: 0 },
                gasoline:{ raw: 0, stage1: 0, stage2: 0, stage3: 0 }
            },
            tempMilitaryCost: {},
            tempMilitaryUpkeep: {},
        };

        this.activeResourceBonuses = [];   // Active food/water consumptions
        this.resourceWonderEffects = {     // Active wonder effects on resource system
            supremeMining:  { active: false, stackBonus: 0 },
            supremeAssembly: { active: false, timerReduction: 0 },
        };
        
        this.primaryResource = null;  // One basic resource this nation produces
        this.bonusEffects = {};       // Active bonus resource effects
        this.currentBonuses = {};     // Current bonus multipliers
        this.criticalResourcePenalty = 0; // Happiness penalty for missing water/food
        this.populationGrowthModifier = 1.0; // Population growth multiplier from gov/religion/wonders
        this.technologyBonus = 1.0; // Technology multiplier from gov/religion/wonders
        
        // ── Improvements ───────────────────────────────────────────────────
        this.improvements = {};           // Built improvements (port: 2, mine: 1, etc.)
        this.improvementEffects = {};     // Effects from improvements
        this.diplomaticRelations = {};    // Friends, foes, best friend, nemesis
        this.buildingUpkeep = { improvements: 0, projects: 0, wonders: 0 }; // Building upkeep costs

        // ── Projects ───────────────────────────────────────────────────────
        this.projects = {};               // Built projects (missileSilo: 1, university: 2, etc.)
        this.projectEffects = {};         // Effects from projects
        this.military = {};               // Military units and equipment (missiles, etc.)

        // ── Nation Statistics & Complex Metrics ───────────────────────────────
        this.nationStats = {
            // Base rates (0-100 scale)
            happiness: GameConfig.INITIAL_HAPPINESS,     // 50 base
            pollution: 0,                                 // 0 base, -500 to 500 scale
            disease: 0,                                   // 0 base, -100 to 100 scale
            crime: 0,                                     // 0 base, -100 to 100 scale
            literacy: 0,                                  // 0% base, scales with tech and schools
            environment: 50,                              // 50 base environment quality
            
            // Calculated modifiers
            happinessModifier: 1.0,                      // Final happiness multiplier
            populationEfficiency: 1.0,                   // Population formula multiplier
            militaryMorale: 1.0,                         // Military effectiveness multiplier
            taxEfficiency: 1.0                           // Tax collection efficiency
        };

        // ── Military ───────────────────────────────────────────────────────
        // Base stats from config; skill bonuses are layered on top by Player
        this.baseAttack  = GameConfig.BASE_ATTACK;   // 50
        this.baseDefense = GameConfig.BASE_DEFENSE;  // 50
        this.militaryStrength = GameConfig.INITIAL_MILITARY;
        this.militaryUnits = { 
            soldiers: 0, 
            tanks: 0, 
            aircraft: 0, 
            ships: 0, 
            spies: 0, 
            missiles: 0, 
            nukes: 0 
        };
        this.militaryBudget = 0;
        this.militaryMaintenanceDeficit = false;
        this.wars      = [];
        this.alliances = [];
        this.totalArea = this.land; // Total land miles claimed
        this.gdp = 0; // Gross Domestic Product, calculated each turn

        // ── Research ───────────────────────────────────────────────────────
        this.researchPoints  = 0;
        this.technologies    = new Set();
        this.currentResearch = null;
        this.researchProgress = 0;

        // ── Map / territory ────────────────────────────────────────────────
        this.territories = [];  // map tile IDs claimed
        this.cities      = [];
        this.mapBlocks   = Math.floor(GameConfig.INITIAL_LAND / GameConfig.MILES_PER_BLOCK); // 10

        // ── Diplomatic ────────────────────────────────────────────────────
        this.relations      = new Map();
        this.treaties       = [];
        this.allianceId     = null;  // ID of alliance this nation belongs to
        this.allianceRole   = null;  // Role within the alliance
        this.relationshipAddedDay = {}; // targetId -> day last added (non-neutral), for 7-day removal cooldown

        // ── Government / religion demand timers ───────────────────────────
        this.governmentType = {};
        this.policies = {
            economic: 'Mixed', military: 'Defensive',
            social: 'Moderate', environmental: 'Balanced', foreign: 'Neutral'
        };
        this.demandTimer = {
            governmentDaysRemaining: 0,
            religionDaysRemaining:   0,
            isDemandingGovernment:   false,
            isDemandingReligion:     false,
            currentGovernmentHint:   null,
            currentReligionHint:     null
        };

        this.statistics = {
            totalTurns:         0,
            territoriesClaimed: 0,
            warsWon:            0,
            warsFought:         0,
            warsLost:           0,
            treatiesSigned:     0,
            researchCompleted:  0,
            landPurchased:      0,
            infraPurchased:     0,
            techPurchased:      0,
            missileHits:        0,
            missileMisses:      0,
            nukeHits:           0,
            nukeMisses:         0,
            missileLaunches:    0,
            nukeLaunches:       0,
            immigrantsAccepted: 0,
            literacyScore:      0,
            zeroUnemploymentDays: 0,
            peacefulDays:       0,
            positiveRelationsCount: 0,
            edictsPassed:       0,
            governmentChanges:  0,
            policiesEnacted:    0,
            religionChanges:    0,
            uniformPopulationDays: 0,
            sportsChampionshipsWon: 0,
            worldChampionshipsWon: 0,
            seasonTournamentsWon: 0,
            totalSportsFans:    0,
            playersDrafted:     0,
            sportsGamesWon:     0,
            injuriesTotal:      0,
            worldForumMotionsProposed: 0,
            worldForumMotionsPassed: 0,
            worldForumMotionsVoted: 0,
            worldForumCalendarReforms: 0,
            espionageOperationsTotal: 0,
            forumPostsTotal:    0,
            forumThreadsCreated: 0,
            totalUnitsKilled:   0,
            totalUnitsLost:     0,
            spyMissions:        0,
            allianceDays:       0,
            alliancesFormed:    0,
            warDays:            0,
            missilesBlocked:    0,
            zeroPollutionDays:  0,
            zeroCrimeDays:      0,
            zeroDiseaseDays:    0,
            perfectHappinessDays: 0,
            friendsCount:       0,
            hasBestFriend:      0,
            fiveFriendsDays:    0,
            bestFriendDays:     0,
            fiveFriendsBestFriendDays: 0,
            easterEggAlliances: 0,
            exactly300SoldiersDays: 0,
            buildingsConstructed: 0,
        };

        this.eventHistory = [];
        this.achievements = new Set();

        // ── Sports Teams ───────────────────────────────────────────────────
        this.sportsTeams = {};               // Sports teams owned by this nation
        this.wonderEffects = {};             // Effects from built wonders (including sports)
        this.wrestlingPromotion = null;      // Wrestling promotion owned by this nation

        // Resource generation legacy field (kept for compatibility)
        this.resourceGeneration = { money: 0, materials: 0, food: 0, energy: 0, technology: 0 };

        this.bindEvents();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize nation with starting parameters
     */
    initialize(nationData = {}) {
        this.name        = nationData.name       || 'New Nation';
        this.leader      = nationData.leader     || 'Player';
        this.government  = nationData.government || 'liberalDemocracy';
        this.religion    = nationData.religion   || 'monotheism';
        this.founded     = nationData.founded    || Date.now();
        this.capitalCity = nationData.capital    || 'Capital City';
        this.motto       = nationData.motto      || 'Unity, Progress, Prosperity';
        this.factionKey  = nationData.factionKey  || null;
        this.factionColor = nationData.factionColor || null;

        // Persist server-assigned ids so MapIntegration and other systems
        // can identify which nation belongs to the logged-in player.
        this.id       = nationData.id       || null;
        this.playerId = nationData.playerId || null;

        // Record which game day this nation was founded (for age calculation)
        // GameTime may not exist yet on very first init — default to 0
        this.foundedDay = window.GameTime ? GameTime.getTime().totalDays : 0;

        // Apply government bonuses (delegated to NationSystem)
        if (window.NationSystemInstance) {
            window.NationSystemInstance.setNation(this);
            window.NationSystemInstance.applyGovernmentBonuses();
        }

        // Apply religion bonuses (delegated to NationSystem)
        if (window.NationSystemInstance) {
            window.NationSystemInstance.applyReligionBonuses();
        }

        // Initialize diplomacy for this nation
        if (GameEngine?.systems?.diplomacy) {
            GameEngine.systems.diplomacy.initializeNationDiplomacy(this.id);
        }

        // Start government/religion demand timers (delegated to NationSystem)
        if (window.NationSystemInstance) {
            window.NationSystemInstance.startDemandTimers();
        }

        // Initialize edicts (defaults + locked state)
        if (window.EdictSystem && typeof window.EdictSystem.initializeNationEdicts === 'function') {
            window.EdictSystem.initializeNationEdicts(this);
        } else {
            if (!this.edicts) this.edicts = null;
            if (!this.edictChangeDates) this.edictChangeDates = {};
            if (this.edictFreePassUsed === undefined) this.edictFreePassUsed = false;
            if (!this.edictUnlocked) this.edictUnlocked = {};
            if (!this.edictEffects) this.edictEffects = {};
            if (!this.edictSynergies) this.edictSynergies = [];
            if (!this.discoveredSynergies) this.discoveredSynergies = [];
            if (!this.synergyDays) this.synergyDays = {};
        }
        if (window.EdictSystem && typeof window.EdictSystem.applyEdictEffects === 'function') {
            window.EdictSystem.applyEdictEffects(this);
        }

        // First population/tax calculation (delegated to NationSystem)
        if (window.NationSystemInstance) {
            window.NationSystemInstance.calculatePopulation();
            window.NationSystemInstance.calculateEconomy();
        }

        // Load flag from settings if available
        this.loadFlagFromSettings();

        this.isInitialized = true;

        EventBus.emit(GameEvents.NATION_CREATED, { nation: this.serialize() });
        console.log(`Nation '${this.name}' founded on Day ${this.foundedDay}`);
    }

    /**
     * Create nation — static factory.
     * If a fully initialized nation already exists, logs a warning and bails.
     * If window.Nation is the blank uninitialized singleton it's safe to replace.
     */
    static create(nationData) {
        if (window.Nation && window.Nation.isInitialized) {
            console.warn('Nation already initialized — use _hydrateNation to update an existing nation');
            return false;
        }
        const nation = new NationClass();
        nation.initialize(nationData);
        
        // Replace global Nation instance
        window.Nation = nation;
        
        return true;
    }

    /**
     * Bind event listeners
     * Delegates day/month/year handlers to NationSystem.
     */
    bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED,   this.handleDayPassed,   this);
        EventBus.on(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.on(GameEvents.YEAR_PASSED,  this.handleYearPassed,  this);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // ENTITY STATE ACCESSORS (pure entity operations, no system logic)
    // ═════════════════════════════════════════════════════════════════════════

    handleDayPassed(data) {
        if (window.NationSystem) {
            return window.NationSystem.handleDayPassed(data);
        }
    }


    handleMonthPassed(data) {
        if (window.NationSystem) {
            return window.NationSystem.handleMonthPassed(data);
        }
    }

    handleYearPassed(data) {
        if (window.NationSystem) {
            return window.NationSystem.handleYearPassed(data);
        }
    }

    /**
     * Serialize nation data for saving
     */
    serialize() {
        return {
            name:            this.name,
            leader:          this.leader,
            government:      this.government,
            religion:        this.religion,
            founded:         this.founded,
            foundedDay:      this.foundedDay,
            flag:            this.flag,
            motto:           this.motto,
            capitalCity:     this.capitalCity,
            factionKey:      this.factionKey,
            factionColor:    this.factionColor,
            currency:        this.currency,

            // National cosmetic selections
            nationalPet:     this.nationalPet,
            nationalFood:    this.nationalFood,
            nationalWater:   this.nationalWater,
            nationalPetChangedDay:     this.nationalPetChangedDay,
            nationalFoodChangedDay:    this.nationalFoodChangedDay,
            nationalWaterChangedDay:   this.nationalWaterChangedDay,

            // Core stats
            land:            this.land,
            infra:           this.infra,
            tech:            this.tech,
            mapBlocks:       this.mapBlocks,
            population:      this.population,
            happiness:       this.happiness,
            stability:       this.stability,
            reputation:      this.reputation,

            // Economy
            money:           this.money,
            taxRate:         this.taxRate,
            taxableIncome:   this.taxableIncome,
            taxRevenue:      this.taxRevenue,
            totalTaxEarned:  this.totalTaxEarned,
            budget:          { ...this.budget },
            debt:            this.debt,
            gdp:             this.gdp,

            // Military
            baseAttack:      this.baseAttack,
            baseDefense:     this.baseDefense,
            militaryStrength: this.militaryStrength,
            militaryUnits:   { ...this.militaryUnits },
            militaryBudget:  this.militaryBudget,
            wars:            [...this.wars],
            alliances:       [...this.alliances],

            // Research
            researchPoints:  this.researchPoints,
            technologies:    Array.from(this.technologies),
            currentResearch: this.currentResearch,
            researchProgress: this.researchProgress,

            // Map
            territories:     [...this.territories],
            cities:          [...this.cities],

            // Diplomacy
            relations:       Object.fromEntries(this.relations),
            relationshipAddedDay: { ...this.relationshipAddedDay },
            treaties:        [...this.treaties],

            // Gov / religion
            governmentType:  this.governmentType,
            policies:        { ...this.policies },
            demandTimer:     { ...this.demandTimer },

            statistics:      { ...this.statistics },
            eventHistory:    [...this.eventHistory],
            achievements:    Array.from(this.achievements),
            
            // Sports teams and wonder effects
            sportsTeams:     { ...this.sportsTeams },
            wonderEffects:   { ...this.wonderEffects },
            wrestlingPromotion: this.wrestlingPromotion,
            resourceWonderEffects: { ...this.resourceWonderEffects },

            // Resources (staged resource system)
            resources: { ...this.resources },
            activeResourceBonuses: this.activeResourceBonuses ? [...this.activeResourceBonuses] : [],

            // Edicts
            edicts:             this.edicts ? { ...this.edicts } : null,
            edictChangeDates:   this.edictChangeDates ? { ...this.edictChangeDates } : null,
            edictFreePassUsed:  this.edictFreePassUsed,
            edictUnlocked:      this.edictUnlocked ? { ...this.edictUnlocked } : {},
            edictEffects:       this.edictEffects ? { ...this.edictEffects } : null,
            edictSynergies:     Array.isArray(this.edictSynergies) ? [...this.edictSynergies] : [],
            discoveredSynergies: Array.isArray(this.discoveredSynergies) ? [...this.discoveredSynergies] : [],
            synergyDays:        this.synergyDays ? { ...this.synergyDays } : {},

            // Equipment (loot system)
            equipment: this.equipment ? { ...this.equipment,
                inventory: this.equipment.inventory ? [...this.equipment.inventory] : [],
                keys: this.equipment.keys ? { ...this.equipment.keys } : null,
                chests: this.equipment.chests ? { ...this.equipment.chests } : null,
                equipped: this.equipment.equipped ? { ...this.equipment.equipped } : null,
            } : null,
        };
    }

    /**
     * Deserialize nation data from save
     */
    deserialize(data) {
        Object.keys(data).forEach(key => {
            if (key === 'technologies' || key === 'achievements') {
                this[key] = new Set(data[key]);
            } else if (key === 'relations') {
                this[key] = new Map(Object.entries(data[key]));
            } else if (Array.isArray(data[key])) {
                this[key] = [...data[key]];
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                this[key] = { ...data[key] };
            } else {
                this[key] = data[key];
            }
        });

        // Ensure edict state exists
        if (!this.edicts) this.edicts = null;
        if (!this.edictChangeDates) this.edictChangeDates = null;
        if (this.edictFreePassUsed === undefined) this.edictFreePassUsed = false;
        if (!this.edictUnlocked) this.edictUnlocked = {};
        if (!this.edictEffects) this.edictEffects = null;
        if (!this.edictSynergies) this.edictSynergies = [];
        if (!this.discoveredSynergies) this.discoveredSynergies = [];
        if (!this.synergyDays) this.synergyDays = {};

        // Ensure resource-system fields exist on legacy saves
        if (!this.resources) this.resources = { money: GameConfig.INITIAL_RESOURCES.money };
        if (!this.resources.resourceStageTurn) this.resources.resourceStageTurn = {};
        if (!this.resources.tempMilitaryCost) this.resources.tempMilitaryCost = {};
        if (!this.resources.tempMilitaryUpkeep) this.resources.tempMilitaryUpkeep = {};
        if (!this.resources.food) this.resources.food = 0;
        if (!this.resources.water) this.resources.water = 0;
        if (!this.resources.foodTypes) this.resources.foodTypes = {};
        if (!this.resources.waterTypes) this.resources.waterTypes = {};
        const foodTypes = ['burger', 'cake', 'cookie', 'donut', 'hotdog', 'pizza', 'ramen', 'salad', 'steak', 'sushi', 'taco'];
        const waterTypes = ['beer', 'coffee', 'energy-drink', 'juice', 'liquor', 'milk', 'milkshake', 'smoothie', 'soda', 'water', 'wine'];
        foodTypes.forEach(t => { if (!this.resources.foodTypes[t]) this.resources.foodTypes[t] = 0; });
        waterTypes.forEach(t => { if (!this.resources.waterTypes[t]) this.resources.waterTypes[t] = 0; });
        if (!this.activeResourceBonuses) this.activeResourceBonuses = [];
        if (!this.resourceWonderEffects) this.resourceWonderEffects = {
            supremeMining: { active: false, stackBonus: 0 },
            supremeAssembly: { active: false, timerReduction: 0 },
        };

        if (window.EdictSystem && typeof window.EdictSystem.initializeNationEdicts === 'function' && !this.edicts) {
            window.EdictSystem.initializeNationEdicts(this);
        }
        if (window.EdictSystem && typeof window.EdictSystem.applyEdictEffects === 'function') {
            window.EdictSystem.applyEdictEffects(this);
        }

        this.isInitialized = true;
        
        EventBus.emit(GameEvents.NATION_LOADED, {
            nation: this.serialize()
        });
    }

    /**
     * Add territory to nation
     */
    addTerritory(territory) {
        if (!this.territories.includes(territory.id)) {
            this.territories.push(territory.id);
            this.totalArea += territory.area;
            // Track territory area for accurate removal later
            this.territoryAreas = this.territoryAreas || {};
            this.territoryAreas[territory.id] = territory.area;
            this.statistics.territoriesClaimed++;
            
            // Award experience for territorial expansion
            if (window.XPGoalsSystem) {
                window.XPGoalsSystem.awardXP('claimTerritory', 1, { territory: territory.id });
            } else if (window.Player) {
                Player._awardExperience(500, 'Territory Claimed');
            }
            
            EventBus.emit(GameEvents.TERRITORY_ADDED, {
                territory: territory,
                nation: this.serialize()
            });
        }
    }

    /**
     * Remove territory from nation
     */
    removeTerritory(territoryId) {
        const index = this.territories.indexOf(territoryId);
        if (index !== -1) {
            this.territories.splice(index, 1);
            // Subtract territory area from total area
            const area = this.territoryAreas?.[territoryId] || 0;
            this.totalArea = Math.max(0, this.totalArea - area);
            delete this.territoryAreas?.[territoryId];

            EventBus.emit(GameEvents.TERRITORY_REMOVED, {
                territoryId: territoryId,
                nation: this.serialize()
            });
        }
    }

    /**
     * Set diplomatic relation with another nation with player skill bonuses
     */
    setRelation(nationId, value) {
        // Apply player diplomacy skill bonus for relationship improvements
        if (window.Player) {
            const diplomacyVal = Player.getSkillValue('diplomacy'); // 0..0.50 decimal
            if (value > this.getRelation(nationId)) {
                // Improving relations — diplomacy skill amplifies the improvement
                value = Math.min(100, value * (1 + diplomacyVal));
            }
        }
        
        this.relations.set(nationId, Math.max(0, Math.min(100, value)));
        
        EventBus.emit(GameEvents.DIPLOMATIC_RELATION_CHANGED, {
            targetNation: nationId,
            newValue: value
        });
    }

    /**
     * Get diplomatic relation with another nation
     */
    getRelation(nationId) {
        return this.relations.get(nationId) ?? 50; // Default neutral
    }

    /**
     * Get maximum allowed treaty length based on Diplomacy skill.
     * Level 10 (100%) doubles the base length.
     * @param {number} baseMaxLength - Base maximum treaty length in days
     * @returns {number} Maximum allowed treaty length
     */
    getMaxTreatyLength(baseMaxLength) {
        if (window.Player) {
            const diplomacyVal = Player.getSkillValue('diplomacy'); // 0..1.0 decimal
            return Math.floor(baseMaxLength * (1 + diplomacyVal));
        }
        return baseMaxLength;
    }

    /**
     * Apply research benefits to nation stats.
     */
    applyResearchBenefits(benefits) {
        if (!benefits) return;
        if (benefits.populationGrowth) {
            this.populationGrowthModifier = (this.populationGrowthModifier || 1) * (1 + benefits.populationGrowth);
        }
        if (benefits.economicBonus) {
            this.gdp *= (1 + benefits.economicBonus);
        }
        if (benefits.militaryBonus) {
            this.militaryStrength = Math.floor(this.militaryStrength * (1 + benefits.militaryBonus));
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // FLAG MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Set nation flag
     */
    setFlag(flagData) {
        this.flag = flagData;
        
        // Trigger UI updates
        const event = new CustomEvent('nationFlagUpdated', {
            detail: { 
                flag: flagData,
                nationId: this.id,
                nationName: this.name 
            }
        });
        document.dispatchEvent(event);
        
        // Save to localStorage if this is the player's nation
        if (window.Nation === this) {
            this.saveFlagToSettings(flagData);
        }
        
        console.log('Nation flag updated');
    }
    
    /**
     * Get nation flag
     */
    getFlag() {
        return this.flag;
    }
    
    /**
     * Save flag to game settings
     */
    saveFlagToSettings(flagData) {
        try {
            const settings = JSON.parse(localStorage.getItem('game-settings') || '{}');
            settings.flag = flagData;
            localStorage.setItem('game-settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save flag to settings:', error);
        }
    }
    
    /**
     * Load flag from game settings
     */
    loadFlagFromSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('game-settings') || '{}');
            if (settings.flag) {
                this.flag = settings.flag;
                return true;
            }
        } catch (error) {
            console.error('Failed to load flag from settings:', error);
        }
        return false;
    }
    
    /**
     * Get flag as image data URL
     */
    getFlagAsImage() {
        if (!this.flag) return null;
        
        // If it's already an uploaded image
        if (this.flag.type === 'uploaded') {
            return this.flag.data;
        }
        
        // If it's a designed flag, we need to render it
        if (this.flag.type === 'designed' && typeof FlagDisplay !== 'undefined') {
            const tempContainer = document.createElement('div');
            const tempDisplay = new FlagDisplay(tempContainer, {
                width: 300,
                height: 200
            });
            tempDisplay.updateFlag(this.flag);
            const imageData = tempDisplay.getFlagAsImage();
            tempDisplay.destroy();
            return imageData;
        }
        
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NATIONAL PET (cosmetic only)
    // ═══════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get the nation's selected pet icon (cosmetic only).
     */
    getNationalPet() {
        return this.nationalPet || null;
    }

    /**
     * Set the nation's pet icon (cosmetic only, no gameplay effect).
     * @param {string} petIcon - Pet icon name from PET_ICONS list
     * @returns {boolean} true if set successfully
     */
    setNationalPet(petIcon) {
        if (!petIcon) {
            this.nationalPet = null;
            return true;
        }
        if (window.WorldLotterySystem && typeof window.WorldLotterySystem.getPetIcons === 'function') {
            const validPets = window.WorldLotterySystem.getPetIcons();
            if (!validPets.includes(petIcon)) return false;
        }
        // 7-day cooldown on national pet changes
        const currentDay = window.GameTime ? GameTime.getTime().totalDays : 0;
        const lastPetChange = this.nationalPetChangedDay;
        if (lastPetChange !== undefined && currentDay - lastPetChange < 7) {
            return false; // On cooldown
        }
        this.nationalPet = petIcon;
        this.nationalPetChangedDay = currentDay;
        if (window.WorldLottery) {
            window.WorldLottery.setNationPet(this.id, petIcon);
        }
        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════
    // NATIONAL FOOD (cosmetic only)
    // ════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get the nation's selected food icon (cosmetic only).
     */
    getNationalFood() {
        return this.nationalFood || null;
    }

    /**
     * Set the nation's food icon (cosmetic only, no gameplay effect).
     * @param {string} foodIcon - Food icon key from assets/images/Food/
     * @returns {boolean} true if set successfully
     */
    setNationalFood(foodIcon) {
        if (!foodIcon) {
            this.nationalFood = null;
            return true;
        }
        const validFoods = ['burger','cake','cookie','donut','hotdog','pizza','ramen','salad','steak','sushi','taco'];
        if (!validFoods.includes(foodIcon)) return false;
        // Cooldown only after unlocking food production (14 days)
        const hasFoodProduction = this.projects && this.projects.foodProduction > 0;
        if (hasFoodProduction) {
            const currentDay = window.GameTime ? GameTime.getTime().totalDays : 0;
            const lastFoodChange = this.nationalFoodChangedDay;
            if (lastFoodChange !== undefined && currentDay - lastFoodChange < 14) {
                return false; // On cooldown
            }
            this.nationalFoodChangedDay = currentDay;
        }
        this.nationalFood = foodIcon;
        return true;
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════════════
    // NATIONAL WATER (cosmetic only)
    // ════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get the nation's selected water icon (cosmetic only).
     */
    getNationalWater() {
        return this.nationalWater || null;
    }

    /**
     * Set the nation's water icon (cosmetic only, no gameplay effect).
     * @param {string} waterIcon - Water icon key from assets/images/Water/
     * @returns {boolean} true if set successfully
     */
    setNationalWater(waterIcon) {
        if (!waterIcon) {
            this.nationalWater = null;
            return true;
        }
        const validWaters = ['beer','coffee','energy-drink','juice','liquor','milk','milkshake','smoothie','soda','water','wine'];
        if (!validWaters.includes(waterIcon)) return false;
        // Cooldown only after unlocking water production (14 days)
        const hasWaterProduction = this.projects && this.projects.waterProduction > 0;
        if (hasWaterProduction) {
            const currentDay = window.GameTime ? GameTime.getTime().totalDays : 0;
            const lastWaterChange = this.nationalWaterChangedDay;
            if (lastWaterChange !== undefined && currentDay - lastWaterChange < 14) {
                return false; // On cooldown
            }
            this.nationalWaterChangedDay = currentDay;
        }
        this.nationalWater = waterIcon;
        return true;
    }

    calculateMilitaryCost(type, amount = 1) {
        amount = Math.max(1, Math.floor(Number(amount) || 1));
        const unitCostData =
          typeof MilitaryUnit !== "undefined" && MilitaryUnit.getUnitCostData
            ? MilitaryUnit.getUnitCostData(type)
            : null;
        if (!unitCostData) {
          return { money: 1000 * amount, populationCost: 0, techRequired: 0, resources: {} };
        }
        const result = {
          money: unitCostData.moneyCost * amount,
          populationCost: unitCostData.populationCost * amount,
          techRequired: unitCostData.techRequired || 0,
          resources: unitCostData.resources
            ? Object.fromEntries(
                Object.entries(unitCostData.resources).map(([k, v]) => [k, v * amount]),
              )
            : {},
        };
        const milCostMod = this.edictEffects?.militaryCostModifier || 0;
        if (result.money) {
          result.money = Math.max(1, Math.floor(result.money * (1 + milCostMod)));
        }
        const costTypeMap = { soldiers: "soldier", tanks: "tank", aircraft: "aircraft", ships: "ship" };
        const unitKey = costTypeMap[type];
        if (unitKey && this.resources?.tempMilitaryCost?.[unitKey]) {
          result.money = Math.max(1, Math.floor(result.money * (1 - this.resources.tempMilitaryCost[unitKey])));
        }
        return result;
    }

    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════

    destroy() {
        // Clean up event listeners
        EventBus.off(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        EventBus.off(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.off(GameEvents.YEAR_PASSED, this.handleYearPassed, this);
        
        this.isInitialized = false;
        console.log('Nation destroyed');
    }
}

// Create global Nation instance (will be replaced when nation is created)
const Nation = new NationClass();

// Expose class so other systems (e.g. AI nations) can instantiate new instances
window.NationClass = NationClass;

// Expose the uninitialized singleton so it's accessible everywhere.
// NationClass.create() will replace this with an initialized instance.
window.Nation = Nation;

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NationClass, Nation };
}
