/**
 * Nation Entity - Core Nation State and Properties
 * Dominion Wars - Nation Building Strategy Game
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

        // ── Faction ────────────────────────────────────────────────────────
        this.factionKey   = null;
        this.factionColor = null;

        // ── Core nation stats ──────────────────────────────────────────────
        // Land is stored in miles; blocks = Math.floor(land / 100)
        this.land       = GameConfig.INITIAL_LAND;   // miles
        this.infra      = GameConfig.INITIAL_INFRA;
        this.tech       = GameConfig.INITIAL_TECH;   // starts at 0
        this.population = 0;   // computed each turn
        this.happiness  = GameConfig.INITIAL_HAPPINESS;
        this.stability  = 100;
        this.reputation = 50;

        // ── Money / economy ────────────────────────────────────────────────
        this.money          = GameConfig.INITIAL_RESOURCES.money; // $15,000,000
        this.taxRate        = GameConfig.BASE_TAX_RATE;           // 2.5% base
        this.taxableIncome  = 0;   // computed each turn
        this.taxRevenue     = 0;   // money earned last turn
        this.totalTaxEarned = 0;

        this.budget = { income: 0, expenses: 0, balance: 0 };
        this.debt   = 0;

        // ── Resources ──────────────────────────────────────────────────────
        this.resources = {
            // Basic Resources
            iron: 0, lead: 0, lumber: 0, water: 0, food: 0, 
            uranium: 0, coal: 0, oil: 0, limestone: 0, bauxite: 0,
            
            // Manufactured Resources  
            steel: 0, ammo: 0, paper: 0, cookedFood: 0, 
            cement: 0, gas: 0, aluminum: 0,
            
            // Legacy money field maintained for compatibility
            money: GameConfig.INITIAL_RESOURCES.money
        };
        
        this.primaryResource = null;  // One basic resource this nation produces
        this.bonusEffects = {};       // Active bonus resource effects
        this.currentBonuses = {};     // Current bonus multipliers
        this.criticalResourcePenalty = 0; // Happiness penalty for missing water/food
        
        // ── Improvements ───────────────────────────────────────────────────
        this.improvements = {};           // Built improvements (port: 2, mine: 1, etc.)
        this.improvementEffects = {};     // Effects from improvements
        this.diplomaticRelations = {};    // Friends, foes, best friend, nemesis
        this.domesticPolicies = {};       // Internal policies (requires Internal Affairs Office)
        this.policyEffects = {};          // Effects from domestic policies

        // ── Projects ───────────────────────────────────────────────────────
        this.projects = {};               // Built projects (missileSilo: 1, university: 2, etc.)
        this.projectEffects = {};         // Effects from projects
        this.military = {};               // Military units and equipment (missiles, etc.)

        // ── Nation Statistics & Complex Metrics ───────────────────────────────
        this.nationStats = {
            // Base rates (0-100 scale)
            happiness: GameConfig.INITIAL_HAPPINESS,     // 50 base
            pollution: 0,                                 // 0 base, increases with industry
            disease: 10,                                  // 10% base disease rate
            crime: 15,                                    // 15% base crime rate
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
        this.wars      = [];
        this.alliances = [];

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
        this.tradeAgreements = [];
        this.allianceId     = null;  // ID of alliance this nation belongs to
        this.allianceRole   = null;  // Role within the alliance

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

        // ── Statistics ─────────────────────────────────────────────────────
        this.statistics = {
            totalTurns:         0,
            territoriesClaimed: 0,
            warsWon:            0,
            warsLost:           0,
            researchCompleted:  0,
            landPurchased:      0,
            infraPurchased:     0,
            techPurchased:      0
        };

        this.eventHistory = [];
        this.achievements = new Set();

        // ── Sports Teams ───────────────────────────────────────────────────
        this.sportsTeams = {};               // Sports teams owned by this nation
        this.wonderEffects = {};             // Effects from built wonders (including sports)

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

        // Apply government bonuses
        this.applyGovernmentBonuses();

        // Apply religion bonuses
        this.applyReligionBonuses();

        // Initialize diplomacy for this nation
        if (GameEngine?.systems?.diplomacy) {
            GameEngine.systems.diplomacy.initializeNationDiplomacy(this.id);
        }

        // Start government/religion demand timers
        this.startDemandTimers();

        // First population/tax calculation
        this.calculatePopulation();
        this.calculateEconomy();

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
     */
    bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED,   this.handleDayPassed,   this);
        EventBus.on(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.on(GameEvents.YEAR_PASSED,  this.handleYearPassed,  this);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TURN PROCESSING (called every game day = every real hour)
    // ═══════════════════════════════════════════════════════════════════════

    handleDayPassed(data) {
        // 1. Process temporary effects (population/happiness reductions from military)
        this.processTemporaryEffects();
        
        // 2. Pay military maintenance costs
        this.payMilitaryMaintenance();
        
        // 3. Recalculate population
        this.calculatePopulation();

        // 4. Calculate all nation statistics (literacy, pollution, disease, crime, happiness, environment)
        this.calculateNationStats();

        // 5. Calculate and collect taxes
        this.calculateEconomy(true);

        // 6. Apply player skill bonuses to the nation
        if (window.Player) Player.applyToNation(this);

        // 7. Update military strength
        this.updateMilitaryStrength();

        // 8. Process research
        this.processResearch();

        // 9. Check government/religion demands
        this.checkDemands();

        // 10. Update happiness
        this.updateHappiness();

        // 11. Process projects (missile production, military penalties)
        if (window.GameEngine?.systems?.projects) {
            window.GameEngine.systems.projects.processDaily(this);
        }
        
        // 12. Process wonders (nuclear production, enhanced systems, cooldowns)
        if (window.GameEngine?.systems?.wonders) {
            window.GameEngine.systems.wonders.processDaily(this);
        }

        this.statistics.totalTurns++;

        EventBus.emit(GameEvents.NATION_UPDATED, { nation: this.serialize() });
    }

    handleMonthPassed(data) {
        this.updateDiplomaticRelations();
        this.processMonthlyEvents();

        // Stability drifts toward 100 if economy is healthy
        if (this.budget.balance >= 0) {
            this.stability = Math.min(100, this.stability + 1);
        } else {
            this.stability = Math.max(0,   this.stability - 2);
        }
    }

    handleYearPassed(data) {
        this.processAnnualStatistics();
        this.checkAchievements();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CORE ECONOMIC FORMULAS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Population = Land × Infra × Tech × ageFactor
     * ageFactor  = max(1, nationAgeDays / 30)
     * Population is 0 while Tech = 0.
     */
    calculatePopulation() {
        const technology = this.tech + (this.sharedTechnology || 0);
        if (technology <= 0) {
            this.population = 0;
            return;
        }

        const ageDays   = this._nationAgeDays();
        const ageFactor = Math.max(1, ageDays / GameConfig.FORMULAS.AGE_FACTOR_DIVISOR);
        
        // Base population calculation
        let population = Math.floor(this.land * this.infra * technology * ageFactor);
        
        // Apply bonus resource multipliers
        let growthMultiplier = 1.0;
        
        // Automobiles bonus: +10% population growth
        if (this.bonusEffects?.automobiles) {
            growthMultiplier += 0.10;
        }
        
        // Basic Needs bonus: +15% population growth  
        if (this.bonusEffects?.basicNeeds) {
            growthMultiplier += 0.15;
        }
        
        // Apply population efficiency from nation stats
        if (this.nationStats?.populationEfficiency) {
            growthMultiplier *= this.nationStats.populationEfficiency;
        }
        
        // Calculate base population
        let finalPopulation = Math.floor(population * growthMultiplier);
        
        // Apply temporary population reductions from military recruitment
        if (this.temporaryEffects) {
            const populationReductions = this.temporaryEffects
                .filter(effect => effect.type === 'populationReduction')
                .reduce((total, effect) => total + effect.amount, 0);
            
            finalPopulation = Math.max(0, finalPopulation - populationReductions);
        }
        
        this.population = finalPopulation;
    }
    
    /**
     * Calculate all complex nation statistics
     * This method runs after calculatePopulation and before calculateEconomy
     */
    calculateNationStats() {
        if (!this.nationStats) this.initializeNationStats();
        
        this.calculateLiteracy();
        this.calculatePollution();
        this.calculateDisease();
        this.calculateCrime();
        this.calculateHappiness();
        this.calculateEnvironment();
        this.calculateDerivedEffects();
    }
    
    /**
     * Initialize nation stats if missing
     */
    initializeNationStats() {
        this.nationStats = {
            happiness: GameConfig.INITIAL_HAPPINESS,
            pollution: 0,
            disease: 10,
            crime: 15,
            literacy: 0,
            environment: 50,
            happinessModifier: 1.0,
            populationEfficiency: 1.0,
            militaryMorale: 1.0,
            taxEfficiency: 1.0
        };
    }
    
    /**
     * Calculate literacy rate: base 0% + tech scaling + schools bonus + university bonus
     */
    calculateLiteracy() {
        // Base literacy from tech level (0% at tech 0, approaching 75% at high tech)
        let baseLiteracy = Math.min(75, ((this.tech + (this.sharedTechnology || 0)) / 2000) * 75);
        
        // School bonus: +7.5% per school (max +37.5%)
        let schoolBonus = 0;
        if (this.improvementEffects?.literacyBonus) {
            schoolBonus = this.improvementEffects.literacyBonus * 100; // Convert to percentage
        }
        
        // University bonus: +10% per university (max +30%)
        let universityBonus = 0;
        if (this.projectEffects?.universityLiteracyBonus) {
            universityBonus = this.projectEffects.universityLiteracyBonus * 100;
        }
        
        // Universal Education wonder bonus: +25% literacy rate
        let wonderEducationBonus = 0;
        if (this.wonderEffects?.universalEducationLiteracyBonus) {
            wonderEducationBonus = this.wonderEffects.universalEducationLiteracyBonus * 100;
        }
        
        // Government policy effects
        let policyBonus = 0;
        if (this.policyEffects?.educationBonus) {
            policyBonus = this.policyEffects.educationBonus * 100;
        }
        
        this.nationStats.literacy = Math.min(100, baseLiteracy + schoolBonus + universityBonus + wonderEducationBonus + policyBonus);
    }
    
    /**
     * Calculate pollution: base from industry, reduced by improvements and policies
     */
    calculatePollution() {
        // Base pollution from infrastructure and manufacturing
        let basePollution = Math.floor((this.infra / 50) + (this.population / 200000));
        
        // Add pollution from mines (industrial activity)
        const mineCount = this.improvements?.mine || 0;
        let minePollution = mineCount * 2; // +2 pollution per mine
        
        // Wonder effect: Clean Mine Operations removes mine pollution
        if (this.wonderEffects?.cleanMineOperations) {
            minePollution = 0;
        }
        basePollution += minePollution;
        
        // Add pollution from assembly plants
        const assemblyPlantCount = this.improvements?.assemblyPlant || 0;
        let assemblyPollution = assemblyPlantCount * 3; // +3 pollution per assembly plant
        
        // Wonder effect: Clean Assembly Operations removes assembly plant pollution
        if (this.wonderEffects?.cleanAssemblyOperations) {
            assemblyPollution = 0;
        }
        basePollution += assemblyPollution;
        
        // Add pollution from factories (tanks)
        const factoryCount = this.improvements?.factory || 0;
        basePollution += factoryCount * 3; // +3 pollution per factory
        
        // Recycling center reduction: -5% per center
        let recyclingReduction = 1.0;
        if (this.improvementEffects?.pollutionReduction) {
            recyclingReduction -= this.improvementEffects.pollutionReduction;
        }
        
        // Enhanced recycling project: double effect + happiness penalty removal from wonder
        if (this.projectEffects?.enhancedRecycling && !this.wonderEffects?.supremeRecycling) {
            recyclingReduction -= this.improvementEffects?.pollutionReduction || 0; // Double the effect
        }
        
        // Supreme recycling wonder: triple effect + environment bonus + happiness penalty removal
        if (this.wonderEffects?.supremeRecycling) {
            recyclingReduction -= (this.improvementEffects?.pollutionReduction || 0) * 2; // Triple total effect
        }
        
        // Parks reduction: -5% per park
        if (this.improvementEffects?.pollutionFromParks) {
            recyclingReduction -= Math.abs(this.improvementEffects.pollutionFromParks);
        }
        
        // Policy effects (environmental policies)
        if (this.policyEffects?.environmentalHealth) {
            recyclingReduction *= Math.max(0, 1.0 - this.policyEffects.environmentalHealth);
        }
        
        this.nationStats.pollution = Math.max(0, Math.floor(basePollution * Math.max(0, recyclingReduction)));
    }
    
    /**
     * Calculate disease rate: base 10% affected by hospitals, pollution, environment, and ambulance hubs
     */
    calculateDisease() {
        let baseDisease = 10; // 10% base disease rate
        
        // Pollution increases disease (+0.5% per pollution point)
        let pollutionEffect = this.nationStats.pollution * 0.5;
        
        // Hospital reduction: -5% per hospital
        let hospitalReduction = 0;
        if (this.improvementEffects?.diseaseReduction) {
            hospitalReduction = this.improvementEffects.diseaseReduction * 100; // Convert to percentage points
        }
        
        // Ambulance Hub reduction: -10% per hub
        let ambulanceReduction = 0;
        if (this.projectEffects?.ambulanceDiseaseReduction) {
            ambulanceReduction = this.projectEffects.ambulanceDiseaseReduction * 100;
        }
        
        // Universal Healthcare wonder reduction: -35% disease rate
        let wonderHealthcareReduction = 0;
        if (this.wonderEffects?.universalHealthcareDiseaseReduction) {
            wonderHealthcareReduction = this.wonderEffects.universalHealthcareDiseaseReduction * 100;
        }
        
        // Environment quality affects disease (good environment reduces disease)
        let environmentEffect = (50 - this.nationStats.environment) * 0.2; // +/- 0.2% per point from 50
        
        // Healthcare policy effects
        let healthcareEffect = 0;
        if (this.policyEffects?.healthcareQuality) {
            healthcareEffect = this.policyEffects.healthcareQuality * -10; // Better healthcare reduces disease
        }
        
        this.nationStats.disease = Math.max(0, Math.min(50, 
            baseDisease + pollutionEffect - hospitalReduction - ambulanceReduction - wonderHealthcareReduction + environmentEffect + healthcareEffect
        ));
    }
    
    /**
     * Calculate crime rate: base 15% affected by police, literacy, happiness, casinos, SWAT, and sports betting
     */
    calculateCrime() {
        let baseCrime = 15; // 15% base crime rate
        
        // Police station reduction: -5% per station
        let policeReduction = 0;
        if (this.improvementEffects?.crimeReduction) {
            policeReduction = this.improvementEffects.crimeReduction * 100; // Convert to percentage points
        }
        
        // SWAT police reduction: -10% per center
        let swatReduction = 0;
        if (this.projectEffects?.swatCrimeReduction) {
            swatReduction = this.projectEffects.swatCrimeReduction * 100;
        }
        
        // Casino increase: +3% per casino
        let casinoIncrease = 0;
        if (this.improvementEffects?.crimeIncrease) {
            casinoIncrease = this.improvementEffects.crimeIncrease * 100;
        }
        
        // Sports betting increase: +33%
        let sportsBettingIncrease = 0;
        if (this.projectEffects?.sportsBettingCrimeIncrease) {
            sportsBettingIncrease = this.projectEffects.sportsBettingCrimeIncrease * 100;
        }
        
        // Literacy reduces crime (educated populations have less crime)
        let literacyEffect = -(this.nationStats.literacy * 0.2); // -0.2% crime per 1% literacy
        
        // Happiness reduces crime
        let happinessEffect = -(this.nationStats.happiness - 50) * 0.1; // -0.1% per happiness point above 50
        
        // Surveillance policy effects
        let surveillanceEffect = 0;
        if (this.policyEffects?.internalSecurity) {
            surveillanceEffect = this.policyEffects.internalSecurity * -20; // Better security reduces crime
        }
        
        this.nationStats.crime = Math.max(0, Math.min(80, 
            baseCrime - policeReduction - swatReduction + casinoIncrease + sportsBettingIncrease + literacyEffect + happinessEffect + surveillanceEffect
        ));
    }

    /**
     * Calculate happiness (0–100).
     * Base 50, modified by pollution, disease, crime, literacy, improvements,
     * projects, wonders, government/religion bonuses, and policy effects.
     */
    calculateHappiness() {
        let happiness = GameConfig.INITIAL_HAPPINESS; // 50

        // Negative factors from other stats
        happiness -= this.nationStats.pollution * 0.15;   // pollution hurts mood
        happiness -= this.nationStats.disease   * 0.20;   // disease hurts mood
        happiness -= this.nationStats.crime     * 0.10;   // crime hurts mood
        happiness += this.nationStats.literacy  * 0.10;   // educated populace is happier

        // Improvement effects (parks, stadiums, etc. set happinessBonus on improvementEffects)
        if (this.improvementEffects?.happinessBonus) {
            happiness += this.improvementEffects.happinessBonus * 100;
        }

        // Project effects
        if (this.projectEffects?.happinessBonus) {
            happiness += this.projectEffects.happinessBonus * 100;
        }

        // Wonder effects
        if (this.wonderEffects?.happinessBonus) {
            happiness += this.wonderEffects.happinessBonus * 100;
        }

        // Policy effects (welfare, censorship, etc.)
        if (this.policyEffects?.happinessModifier) {
            happiness *= this.policyEffects.happinessModifier;
        }

        // Government type bonus (already applied to this.happiness by applyGovernmentEffects,
        // but nationStats.happiness is independent — apply the same multiplier here)
        if (window.GovernmentSystem && this.government) {
            const govType = window.GovernmentSystem.getGovernmentType?.(this.government);
            if (govType?.happinessBonus) {
                happiness *= govType.happinessBonus;
            }
        }

        this.nationStats.happiness = Math.max(0, Math.min(100, Math.round(happiness)));
    }

    /**
     * Calculate environment score (0–100).
     * Derived from pollution level and any environmental improvement/policy effects.
     */
    calculateEnvironment() {
        // Start at 100 and subtract based on pollution
        let environment = 100 - this.nationStats.pollution;

        // Environmental policy bonus (recycling programmes, green initiatives, etc.)
        if (this.policyEffects?.environmentalHealth) {
            environment += this.policyEffects.environmentalHealth * 20;
        }

        // Wonder effects (e.g. ecological wonders)
        if (this.wonderEffects?.environmentBonus) {
            environment += this.wonderEffects.environmentBonus * 100;
        }

        this.nationStats.environment = Math.max(0, Math.min(100, Math.round(environment)));
    }

    /**
     * Calculate derived multipliers that depend on the primary stats.
     * Sets populationEfficiency, militaryMorale, taxEfficiency, and happinessModifier.
     */
    calculateDerivedEffects() {
        const h = this.nationStats.happiness;
        const e = this.nationStats.environment;
        const c = this.nationStats.crime;

        // Population efficiency: happiness above 50 gives a bonus, below 50 a penalty
        this.nationStats.populationEfficiency = Math.max(0.5, Math.min(1.5, 1.0 + (h - 50) * 0.01));

        // Military morale: driven by happiness; religion may have set this.militaryMorale already
        this.nationStats.militaryMorale = Math.max(0.5, Math.min(1.5,
            (this.militaryMorale || 1.0) * (1.0 + (h - 50) * 0.005)
        ));

        // Tax efficiency: low crime and high happiness improve collection
        this.nationStats.taxEfficiency = Math.max(0.5, Math.min(1.5,
            1.0 + (h - 50) * 0.005 - c * 0.005
        ));

        // Overall happiness modifier (used by population growth formula)
        this.nationStats.happinessModifier = Math.max(0.5, Math.min(2.0, h / 50));
    }

    /**
     * taxableIncome = (Infra / 50) × population × Tech × literacy modifier
     * taxRevenue    = taxableIncome × (taxRate / 100) × tax efficiency
     *
     * taxRate = base 2.5% + player Taxation skill value
     * Money is deposited into this.money each turn.
     */
    calculateEconomy(collectTaxes = false) {
        // Effective tax rate: base from GameConfig + player skill
        let effectiveTaxRate = GameConfig.BASE_TAX_RATE; // 2.5
        if (window.Player) {
            // Taxation skill: each level adds 2.5%; getSkillValue returns decimal (0.025 per level)
            effectiveTaxRate += Player.getSkillValue('taxation') * 100;
        }
        this.taxRate = effectiveTaxRate;

        // Taxable income with literacy modifier
        let literacyModifier = 1.0 + (this.nationStats.literacy / 100) * 0.5; // Up to +50% at 100% literacy
        
        this.taxableIncome = Math.floor((this.infra / GameConfig.FORMULAS.TAXABLE_INFRA_DIVISOR)
                             * this.population
                             * (this.tech + (this.sharedTechnology || 0))
                             * literacyModifier);

        // Revenue this turn with tax efficiency
        this.taxRevenue    = Math.floor(this.taxableIncome * (this.taxRate / 100) * this.nationStats.taxEfficiency);
        // Recalculating a quote must never mint money. Only the turn collector pays taxes.
        if (collectTaxes) {
            this.money += this.taxRevenue;
            this.totalTaxEarned = (this.totalTaxEarned || 0) + this.taxRevenue;
        }

        // GDP approximation for display
        this.gdp = this.taxableIncome;

        // Budget summary
        this.budget.income  = this.taxRevenue;
        this.budget.expenses = this.militaryBudget;
        this.budget.balance  = this.budget.income - this.budget.expenses;

        EventBus.emit(GameEvents.RESOURCES_CHANGED, {
            money:         this.money,
            taxRevenue:    this.taxRevenue,
            taxableIncome: this.taxableIncome,
            taxRate:       this.taxRate
        });
    }

    // ── Legacy alias used by other systems ──────────────────────────────────
    // calculateResourceGeneration() is defined further below — it updates
    // this.resourceGeneration for UI display and delegates income to calculateEconomy().

    // ═══════════════════════════════════════════════════════════════════════
    // LAND / INFRA / TECH PURCHASES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Cost to buy the NEXT 100-mile block of land.
     * Formula: nextBlock × (population / 1000) × 10
     * First FREE_STARTING_BLOCKS blocks are free at nation creation only.
     */
    landCost() {
        const nextBlock = this.mapBlocks + 1;
        return Math.ceil(nextBlock
            * (Math.max(1, this.population) / GameConfig.FORMULAS.LAND_COST_POP_DIVISOR)
            * GameConfig.FORMULAS.LAND_COST_MULTIPLIER);
    }

    /**
     * Buy one block of land (100 miles).
     * Returns true on success.
     */
    buyLand() {
        if (this.mapBlocks < GameConfig.FREE_STARTING_BLOCKS) {
            // Should never be called before nation starts — but guard it
            this.mapBlocks++;
            this.land = this.mapBlocks * GameConfig.MILES_PER_BLOCK;
            return true;
        }

        const cost = this.landCost();
        if (this.money < cost) {
            console.warn(`Cannot buy land — need $${cost}, have $${this.money}`);
            return false;
        }

        this.money     -= cost;
        this.mapBlocks += 1;
        this.land       = this.mapBlocks * GameConfig.MILES_PER_BLOCK;
        this.statistics.landPurchased++;

        this.calculatePopulation();
        this.calculateEconomy();

        EventBus.emit('land_purchased', { mapBlocks: this.mapBlocks, land: this.land, cost });
        return true;
    }

    /**
     * Cost to buy the NEXT point of infrastructure.
     * Formula: (infra + 1) × (population / 1000) × 10
     */
    infraCost() {
        let baseCost = Math.ceil((this.infra + 1)
            * (Math.max(1, this.population) / GameConfig.FORMULAS.INFRA_COST_POP_DIVISOR)
            * GameConfig.FORMULAS.INFRA_COST_MULTIPLIER);
        
        // Apply Construction bonus: -15% infrastructure cost reduction
        if (this.bonusEffects?.construction) {
            baseCost = Math.floor(baseCost * 0.85); // 15% reduction
        }
        
        return baseCost;
    }

    /**
     * Buy one unit of infrastructure.
     */
    buyInfra(amount = 1) {
        for (let i = 0; i < amount; i++) {
            const cost = this.infraCost();
            if (this.money < cost) {
                console.warn(`Cannot buy infra at level ${this.infra + 1} — need $${cost}`);
                return false;
            }
            this.money -= cost;
            this.infra += 1;
            this.statistics.infraPurchased++;
        }

        this.calculatePopulation();
        this.calculateEconomy();

        EventBus.emit('infra_purchased', { infra: this.infra });
        return true;
    }

    /**
     * Cost to buy the NEXT tech level.
     * Formula: nextTechLevel × (land / 100) × (infra / 100) × (population / 1000)
     */
    techCost() {
        const nextLevel = this.tech + 1;
        let baseCost = Math.ceil(nextLevel
            * (this.land  / GameConfig.FORMULAS.TECH_COST_LAND_DIVISOR)
            * (this.infra / GameConfig.FORMULAS.TECH_COST_INFRA_DIVISOR)
            * (Math.max(1, this.population) / GameConfig.FORMULAS.TECH_COST_POP_DIVISOR));
        
        // Apply University tech cost reduction: -5% per university
        if (this.projectEffects?.techCostReduction) {
            baseCost = Math.floor(baseCost * (1.0 - this.projectEffects.techCostReduction));
        }
        
        // Apply Universal Education wonder tech cost reduction: -15%
        if (this.wonderEffects?.universalEducationTechCostReduction) {
            baseCost = Math.floor(baseCost * (1.0 - this.wonderEffects.universalEducationTechCostReduction));
        }
        
        return baseCost;
    }

    /**
     * Buy one tech level.
     */
    buyTech() {
        const cost = this.techCost();
        if (this.money < cost) {
            console.warn(`Cannot buy tech — need $${cost}, have $${this.money}`);
            return false;
        }

        this.money -= cost;
        this.tech  += 1;
        this.statistics.techPurchased++;

        this.calculatePopulation();
        this.calculateEconomy();

        EventBus.emit('tech_purchased', { tech: this.tech, cost });
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NATION AGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Nation age in game days.
     */
    _nationAgeDays() {
        if (window.GameTime) {
            return GameTime.nationAgeDays(this.foundedDay);
        }
        // Fallback: use real time (ms) converted to days at 1 hr per day
        return Math.floor((Date.now() - (this.founded || Date.now())) / 3_600_000);
    }

    /**
     * Formatted age string.
     */
    getNationAge() {
        const days = this._nationAgeDays();
        const years  = Math.floor(days / 360);
        const months = Math.floor((days % 360) / 30);
        const rem    = days % 30;
        if (years > 0)  return `${years}y ${months}m ${rem}d`;
        if (months > 0) return `${months}m ${rem}d`;
        return `${rem}d`;
    }

    /**
     * Apply government type bonuses and penalties
     */
    applyGovernmentBonuses() {
        // Use GovernmentSystem if available for detailed bonuses
        if (window.GovernmentSystem) {
            const gov = window.GovernmentSystem.getGovernment(this.government);
            if (gov) {
                this.governmentType = gov;
                
                // Apply bonuses
                if (gov.bonuses.happiness) {
                    this.happiness = Math.floor(this.happiness * gov.bonuses.happiness);
                }
                if (gov.bonuses.gdp || gov.bonuses.economyBonus) {
                    this.gdp = Math.floor(this.gdp * (gov.bonuses.gdp || 1.1));
                }
                if (gov.bonuses.militaryStrength || gov.bonuses.militaryBonus) {
                    this.militaryStrength = Math.floor(this.militaryStrength * (gov.bonuses.militaryStrength || 1.1));
                }
                if (gov.bonuses.stability) {
                    this.stability = Math.floor(this.stability * gov.bonuses.stability);
                }
                if (gov.bonuses.populationGrowth) {
                    this.populationGrowthModifier = gov.bonuses.populationGrowth;
                }
                if (gov.bonuses.technology) {
                    this.technologyBonus = gov.bonuses.technology;
                }
                
                // Apply policies from government
                if (gov.policies) {
                    this.policies = { ...gov.policies };
                }
                
                // Apply tax rate
                if (gov.taxRate) {
                    this.taxRate = gov.taxRate;
                }
                
                // Apply penalties
                if (gov.penalties) {
                    if (gov.penalties.happiness) {
                        this.happiness = Math.floor(this.happiness * gov.penalties.happiness);
                    }
                    if (gov.penalties.militaryStrength) {
                        this.militaryStrength = Math.floor(this.militaryStrength * gov.penalties.militaryStrength);
                    }
                    if (gov.penalties.stability) {
                        this.stability = Math.floor(this.stability * gov.penalties.stability);
                    }
                }
                
                return;
            }
        }
        
        // Fallback to GameConfig
        const govType = GameConfig.GOVERNMENT_TYPES[this.government.toUpperCase()] || 
                       GameConfig.GOVERNMENT_TYPES.DEMOCRACY;
        
        this.governmentType = govType;
        
        // Apply bonuses to base values
        this.gdp = Math.floor(this.gdp * govType.economyBonus);
        this.militaryStrength = Math.floor(this.militaryStrength * govType.militaryBonus);
        this.happiness = Math.floor(this.happiness * govType.happinessBonus);
    }

    /**
     * Apply religion bonuses
     */
    applyReligionBonuses() {
        if (!window.ReligionSystem) return;
        
        const religion = window.ReligionSystem.getReligion(this.religion);
        if (!religion) return;
        
        // Apply happiness bonus
        if (religion.bonuses.happiness) {
            this.happiness = Math.floor(this.happiness * religion.bonuses.happiness);
        }
        
        // Apply population growth bonus
        if (religion.bonuses.populationGrowth) {
            this.populationGrowthModifier = (this.populationGrowthModifier || 1) * (1 + religion.bonuses.populationGrowth);
        }
        
        // Apply stability bonus
        if (religion.bonuses.stability) {
            this.stability = Math.floor(this.stability * religion.bonuses.stability);
        }
        
        // Apply military morale bonus
        if (religion.bonuses.militaryMorale) {
            this.militaryMorale = (this.militaryMorale || 1) * religion.bonuses.militaryMorale;
        }
        
        // Apply technology bonus
        if (religion.bonuses.technology) {
            this.technologyBonus = (this.technologyBonus || 1) * religion.bonuses.technology;
        }
        
        // Apply happiness penalty
        if (religion.penalties && religion.penalties.happiness) {
            this.happiness = Math.floor(this.happiness * religion.penalties.happiness);
        }
    }

    /**
     * Start demand timers for government/religion changes
     */
    startDemandTimers() {
        // Random time between 1 week (7 days) and 1 month (30 days) in game days
        const minDays = 7;
        const maxDays = 30;
        
        this.demandTimer = {
            governmentDaysRemaining: Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays,
            religionDaysRemaining: Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays,
            isDemandingGovernment: false,
            isDemandingReligion: false,
            currentGovernmentHint: null,
            currentReligionHint: null
        };
        
        console.log(`Demand timers started - Government: ${this.demandTimer.governmentDaysRemaining} days, Religion: ${this.demandTimer.religionDaysRemaining} days`);
    }

    /**
     * Get random hint for current government
     */
    getGovernmentHint() {
        if (!window.GovernmentSystem) return null;
        
        const hints = window.GovernmentSystem.getGovernmentHints(this.government, 5);
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get random hint for current religion
     */
    getReligionHint() {
        if (!window.ReligionSystem) return null;
        
        const hints = window.ReligionSystem.getReligionHints(this.religion, 5);
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Change government (when people demand it)
     */
    changeGovernment(newGovernmentId) {
        const oldGovernment = this.government;
        this.government = newGovernmentId;
        
        // Reapply government bonuses
        this.applyGovernmentBonuses();
        
        // Reset demand timer (cycle repeats monthly = 30 days)
        this.demandTimer.governmentDaysRemaining = 30;
        this.demandTimer.isDemandingGovernment = false;
        this.demandTimer.currentGovernmentHint = null;
        
        EventBus.emit(GameEvents.GOVERNMENT_CHANGED, {
            oldGovernment: oldGovernment,
            newGovernment: newGovernmentId,
            nation: this.serialize()
        });
        
        console.log(`Government changed from ${oldGovernment} to ${newGovernmentId}`);
    }

    /**
     * Change religion (when people demand it)
     */
    changeReligion(newReligionId) {
        const oldReligion = this.religion;
        this.religion = newReligionId;
        
        // Reapply religion bonuses
        this.applyReligionBonuses();
        
        // Reset demand timer (cycle repeats monthly = 30 days)
        this.demandTimer.religionDaysRemaining = 30;
        this.demandTimer.isDemandingReligion = false;
        this.demandTimer.currentReligionHint = null;
        
        EventBus.emit(GameEvents.RELIGION_CHANGED, {
            oldReligion: oldReligion,
            newReligion: newReligionId,
            nation: this.serialize()
        });
        
        console.log(`Religion changed from ${oldReligion} to ${newReligionId}`);
    }

    /**
     * Check and process government/religion demands
     */
    checkDemands() {
        // Government demand check
        if (this.demandTimer.governmentDaysRemaining > 0) {
            this.demandTimer.governmentDaysRemaining--;
            
            if (this.demandTimer.governmentDaysRemaining <= 0 && !this.demandTimer.isDemandingGovernment) {
                this.demandTimer.isDemandingGovernment = true;
                this.demandTimer.currentGovernmentHint = this.getGovernmentHint();
                
                EventBus.emit(GameEvents.GOVERNMENT_DEMAND, {
                    hint: this.demandTimer.currentGovernmentHint,
                    daysRemaining: 7 // Give 7 days to respond
                });
            }
        }
        
        // Religion demand check
        if (this.demandTimer.religionDaysRemaining > 0) {
            this.demandTimer.religionDaysRemaining--;
            
            if (this.demandTimer.religionDaysRemaining <= 0 && !this.demandTimer.isDemandingReligion) {
                this.demandTimer.isDemandingReligion = true;
                this.demandTimer.currentReligionHint = this.getReligionHint();
                
                EventBus.emit(GameEvents.RELIGION_DEMAND, {
                    hint: this.demandTimer.currentReligionHint,
                    daysRemaining: 7 // Give 7 days to respond
                });
            }
        }
        
        // Process demand timeouts (7 days to respond)
        if (this.demandTimer.isDemandingGovernment) {
            // Could implement automatic change if player doesn't respond
            // For now, just let the hint persist
        }
        
        if (this.demandTimer.isDemandingReligion) {
            // Could implement automatic change if player doesn't respond
        }
    }

    /**
     * Calculate resource generation rates — updates this.resourceGeneration display object.
     * NOTE: Actual income is applied by calculateEconomy() (called via handleDayPassed).
     * This method only updates the reporting/display object used by UI panels.
     */
    calculateResourceGeneration() {
        // Delegate to the canonical income calculation so both money fields stay in sync.
        // The resourceGeneration object is updated here for UI display purposes only.
        this.resourceGeneration.money = this.taxRevenue || 0;
        this.resourceGeneration.food = this.territories.length * 100; // Placeholder for UI

        // Apply government modifier for display
        const govBonus = this.governmentType?.economyBonus || 1.0;
        Object.keys(this.resourceGeneration).forEach(resource => {
            this.resourceGeneration[resource] = Math.floor(
                this.resourceGeneration[resource] * govBonus
            );
        });
    }

    /**
     * Update nation statistics daily — now handled in handleDayPassed above.
     * Kept as stub for any legacy external callers.
     */
    handleDayPassedLegacy(data) { this.handleDayPassed(data); }

    /**
     * Generate daily resources — delegated to calculateEconomy()
     */
    generateDailyResources() { this.calculateEconomy(); }

    /**
     * Update nation happiness
     */
    updateHappiness() {
        // Happiness is now calculated in calculateHappiness() method within calculateNationStats()
        // This method is kept for compatibility but just triggers the comprehensive calculation
        this.calculateHappiness();
        
        EventBus.emit(GameEvents.HAPPINESS_CHANGED, {
            oldHappiness: this.happiness, 
            newHappiness: this.nationStats.happiness, 
            change: this.nationStats.happiness - this.happiness
        });
        
        this.happiness = this.nationStats.happiness;
    }

    /**
     * Update economic indicators — delegates to calculateEconomy()
     */
    updateEconomy() { this.calculateEconomy(); }

    /**
     * Process research and technology advancement with player skill bonuses
     */
    processResearch() {
        if (!this.currentResearch) return;
        
        // Generate research points
        let researchGeneration = Math.floor(this.population * 0.001 + this.resources.technology * 0.1);
        
        // Apply player intuition skill bonus to research
        if (window.Player) {
            const intuitionBonus = Player.getSkillValue('intuition'); // flat 0-100
            researchGeneration = Math.floor(researchGeneration * (1 + intuitionBonus * 0.01));
        }
        
        this.researchPoints += researchGeneration;
        
        // Apply to current research
        if (this.currentResearch) {
            this.researchProgress += researchGeneration;
            
            // Check if research is complete
            const requiredPoints = this.currentResearch.cost || 1000;
            if (this.researchProgress >= requiredPoints) {
                this.completeResearch();
                
                // Award research experience to player
                if (window.Player) {
                    Player._awardExperience(Math.floor(requiredPoints / 100), 'Research');
                }
            }
        }
    }

    /**
     * Complete current research
     */
    completeResearch() {
        if (!this.currentResearch) return;
        
        const research = this.currentResearch;
        
        // Add technology
        this.technologies.add(research.id);
        
        // Apply research benefits
        if (research.benefits) {
            this.applyResearchBenefits(research.benefits);
        }
        
        // Reset research state
        this.currentResearch = null;
        this.researchProgress = 0;
        this.statistics.researchCompleted++;
        
        EventBus.emit(GameEvents.RESEARCH_COMPLETED, {
            research: research,
            nation: this.serialize()
        });
        
        console.log(`Research completed: ${research.name}`);
    }

    /**
     * Apply research benefits
     */
    applyResearchBenefits(benefits) {
        if (benefits.populationGrowth) {
            // Increase population growth rate
        }
        if (benefits.economicBonus) {
            this.gdp *= (1 + benefits.economicBonus);
        }
        if (benefits.militaryBonus) {
            this.militaryStrength *= (1 + benefits.militaryBonus);
        }
        // Add more benefit types as needed
    }

    /**
     * Start new research project
     */
    startResearch(researchId) {
        // This would look up research from a technology tree
        const research = {
            id: researchId,
            name: `Research ${researchId}`,
            cost: 1000 + Math.random() * 2000,
            benefits: {
                economicBonus: 0.1
            }
        };
        
        this.currentResearch = research;
        this.researchProgress = 0;
        
        EventBus.emit(GameEvents.RESEARCH_STARTED, {
            research: research
        });
        
        return true;
    }

    /**
     * Handle monthly updates
     */
    handleMonthPassed(data) {
        // Monthly economic calculations
        this.processMonthlyEconomics();
        
        // Diplomatic relations updates
        this.updateDiplomaticRelations();
        
        // Process long-term events
        this.processMonthlyEvents();
    }

    /**
     * Handle yearly updates
     */
    handleYearPassed(data) {
        // Annual statistics
        this.processAnnualStatistics();
        
        // Check achievements
        this.checkAchievements();
        
        // Generate annual report
        this.generateAnnualReport();
    }

    /**
     * Process monthly economics
     */
    processMonthlyEconomics() {
        // Recalculate resource generation
        this.calculateResourceGeneration();
        
        // Update stability based on economic performance
        if (this.budget.balance > 0) {
            this.stability = Math.min(100, this.stability + 1);
        } else {
            this.stability = Math.max(0, this.stability - 2);
        }
    }

    /**
     * Update diplomatic relations
     */
    updateDiplomaticRelations() {
        // Natural decay/improvement of relations over time
        for (const [nationId, relation] of this.relations.entries()) {
            // Slight tendency toward neutral (50)
            if (relation > 50) {
                this.relations.set(nationId, Math.max(50, relation - 0.5));
            } else if (relation < 50) {
                this.relations.set(nationId, Math.min(50, relation + 0.5));
            }
        }
    }

    /**
     * Process monthly events
     */
    processMonthlyEvents() {
        // Random events that can occur
        const eventChance = Math.random();
        
        if (eventChance < 0.1) { // 10% chance per month
            this.triggerRandomEvent();
        }
    }

    /**
     * Trigger random event
     */
    triggerRandomEvent() {
        // Collect all event categories into a single pool with weights
        const allEvents = [];
        
        // Add all event categories from the data file
        Object.values(NationEvents).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(event => {
                    // Add multiple copies based on weight for proper probability
                    const weight = event.weight || 1;
                    for (let i = 0; i < weight; i++) {
                        allEvents.push(event);
                    }
                });
            }
        });
        
        // If no events loaded, fall back to basic events
        if (allEvents.length === 0) {
            allEvents = [
                {
                    id: 'economic_boom',
                    name: 'Economic Boom',
                    description: 'Your nation experiences unexpected economic growth!',
                    effects: { money: 2000000, happiness: 5 }
                },
                {
                    id: 'natural_disaster',
                    name: 'Natural Disaster',
                    description: 'A natural disaster strikes your nation.',
                    effects: { population: 0.95, happiness: -10, money: -1000000 }
                },
                {
                    id: 'tech_breakthrough',
                    name: 'Technological Breakthrough',
                    description: 'Your scientists make an important discovery!',
                    effects: { tech: 100, researchPoints: 500 }
                },
                {
                    id: 'diplomatic_success',
                    name: 'Diplomatic Success',
                    description: 'Your diplomatic efforts improve international relations.',
                    effects: { reputation: 5, happiness: 3 }
                }
            ];
        }
        
        const event = allEvents[Math.floor(Math.random() * allEvents.length)];
        this.applyEventEffects(event);
        
        this.eventHistory.push({
            date: Date.now(),
            event: event
        });
        
        EventBus.emit(GameEvents.RANDOM_EVENT, {
            event: event,
            nation: this.serialize()
        });
    }

    /**
     * Apply event effects
     */
    applyEventEffects(event) {
        const effects = event.effects;
        
        Object.keys(effects).forEach(stat => {
            if (this[stat] !== undefined) {
                if (effects[stat] < 1 && effects[stat] > 0) {
                    // Multiplier
                    this[stat] *= effects[stat];
                } else {
                    // Addition
                    this[stat] += effects[stat];
                }
            } else if (this.resources[stat] !== undefined) {
                this.resources[stat] += effects[stat];
            }
        });
        
        // Ensure valid ranges
        this.happiness = Math.max(0, Math.min(100, this.happiness));
        this.stability = Math.max(0, Math.min(100, this.stability));
        this.reputation = Math.max(0, Math.min(100, this.reputation));
    }

    /**
     * Process annual statistics
     */
    processAnnualStatistics() {
        // Calculate annual growth rates
        // Update nation ranking
        // Process long-term trends
    }

    /**
     * Check and award achievements
     */
    checkAchievements() {
        const achievements = [
            {
                id: 'first_territory',
                name: 'First Steps',
                description: 'Claim your first territory',
                condition: () => this.territories.length >= 1
            },
            {
                id: 'economic_powerhouse',
                name: 'Economic Powerhouse',
                description: 'Reach a GDP of 1 million',
                condition: () => this.gdp >= 1000000
            },
            {
                id: 'happy_nation',
                name: 'Happy Nation',
                description: 'Maintain 80+ happiness for a full year',
                condition: () => this.happiness >= 80
            }
        ];
        
        achievements.forEach(achievement => {
            if (!this.achievements.has(achievement.id) && achievement.condition()) {
                this.achievements.add(achievement.id);
                EventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, {
                    achievement: achievement
                });
            }
        });
    }

    /**
     * Generate annual report
     */
    generateAnnualReport() {
        const report = {
            year: new Date().getFullYear(),
            population: this.population,
            gdp: this.gdp,
            happiness: this.happiness,
            territories: this.territories.length,
            achievements: Array.from(this.achievements),
            majorEvents: this.eventHistory.slice(-5) // Last 5 events
        };
        
        EventBus.emit(GameEvents.ANNUAL_REPORT, {
            report: report
        });
        
        return report;
    }

    /**
     * Get nation overview data
     */
    getOverview() {
        return {
            basic: {
                name: this.name,
                leader: this.leader,
                government: this.government,
                founded: this.founded,
                age: Math.floor((Date.now() - this.founded) / (1000 * 60 * 60 * 24))
            },
            statistics: {
                population: this.population,
                gdp: this.gdp,
                happiness: this.happiness,
                stability: this.stability,
                reputation: this.reputation,
                militaryStrength: this.militaryStrength
            },
            resources: { ...this.resources },
            economy: { ...this.budget },
            territories: this.territories.length,
            technologies: this.technologies.size
        };
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
            treaties:        [...this.treaties],
            tradeAgreements: [...this.tradeAgreements],

            // Gov / religion
            governmentType:  this.governmentType,
            policies:        { ...this.policies },
            demandTimer:     { ...this.demandTimer },

            statistics:      { ...this.statistics },
            eventHistory:    [...this.eventHistory],
            achievements:    Array.from(this.achievements),
            
            // Sports teams and wonder effects
            sportsTeams:     { ...this.sportsTeams },
            wonderEffects:   { ...this.wonderEffects }
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
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                this[key] = { ...data[key] };
            } else {
                this[key] = data[key];
            }
        });
        
        this.isInitialized = true;
        
        EventBus.emit(GameEvents.NATION_LOADED, {
            nation: this.serialize()
        });
    }

    /**
     * Handle resource changes
     */
    handleResourcesChanged(data) {
        // Update resource-dependent calculations
        this.calculateResourceGeneration();
    }

    /**
     * Add territory to nation with player skill bonuses
     */
    addTerritory(territory) {
        if (!this.territories.includes(territory.id)) {
            this.territories.push(territory.id);
            this.totalArea += territory.area;
            this.statistics.territoriesClaimed++;
            
            // Award experience for territorial expansion
            if (window.Player) {
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
            // Would need to get territory data to subtract area
            
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
        return this.relations.get(nationId) || 50; // Default neutral
    }

    /**
     * Build infrastructure with player skill bonuses
     */
    buildInfrastructure(type, amount = 1, cost = null) {
        // Calculate cost if not provided
        const buildCost = cost || this.calculateBuildCost(type, amount);
        
        if (this.resources.money < buildCost) {
            throw new Error('Insufficient funds');
        }
        
        // Apply player energy skill bonus (efficiency of construction actions)
        let actualAmount = amount;
        if (window.Player) {
            const energyVal = Player.getSkillValue('energy'); // flat 0-200
            // Every 20 energy = +5% efficiency, capped at +50%
            const efficiencyBonus = Math.min(0.5, energyVal / 400);
            actualAmount = Math.floor(amount * (1 + efficiencyBonus));
        }
        
        this.resources.money -= buildCost;
        
        // Add infrastructure based on type
        if (type === 'development') {
            this.infrastructure = this.infrastructure || {};
            this.infrastructure.development = (this.infrastructure.development || 0) + actualAmount;
        }
        
        // Award experience to player for construction
        if (window.Player) {
            Player._awardExperience(amount * 15, 'Building Constructed');
        }
        
        EventBus.emit(GameEvents.INFRASTRUCTURE_BUILT, {
            type: type,
            amount: actualAmount,
            cost: buildCost,
            nation: this
        });
        
        return actualAmount;
    }

    /**
     * Calculate build cost for infrastructure
     */
    calculateBuildCost(type, amount) {
        const baseCosts = {
            development: 1000,
            roads: 500,
            power: 750,
            housing: 300
        };
        
        return (baseCosts[type] || 1000) * amount;
    }

    /**
     * Train military with player skill bonuses
     */
    trainMilitary(type, amount = 1) {
        if (!Object.hasOwn(this.militaryUnits, type) || !Number.isSafeInteger(amount) || amount < 1) {
            throw new Error('Select a valid unit and positive whole quantity');
        }
        const costData = this.calculateMilitaryCost(type, amount);
        
        // Check money requirement
        if (this.money < costData.money) {
            throw new Error(`Insufficient funding: need $${costData.money.toLocaleString()}, have $${this.resources.money.toLocaleString()}`);
        }
        
        // Check resource requirements
        if (costData.resources) {
            for (const [resource, required] of Object.entries(costData.resources)) {
                if ((this.resources[resource] || 0) < required) {
                    throw new Error(`Insufficient ${resource}: need ${required}, have ${this.resources[resource] || 0}`);
                }
            }
        }
        
        // Check prerequisites
        if (costData.prerequisite && !this.hasPrerequisite(costData.prerequisite)) {
            throw new Error(`Missing prerequisite: ${costData.prerequisite}`);
        }
        
        // Check technology requirements
        if (costData.techRequired && this.tech < costData.techRequired) {
            throw new Error(`Insufficient technology: need ${costData.techRequired}, have ${this.tech}`);
        }
        
        // Apply player attack skill bonus
        let actualMoneyCost = costData.money;
        if (window.Player) {
            const attackVal = Player.getSkillValue('attack');
            const discount = Math.min(0.20, attackVal / 5000);
            actualMoneyCost = Math.floor(costData.money * (1 - discount));
        }
        
        // Deduct costs
        this.money -= actualMoneyCost;
        if (costData.resources) {
            for (const [resource, cost] of Object.entries(costData.resources)) {
                this.resources[resource] -= cost;
            }
        }
        
        // Add units
        this.militaryUnits[type] = (this.militaryUnits[type] || 0) + amount;
        
        // Apply population impact (temporary population reduction)
        if (costData.populationImpact > 0) {
            this.applyTemporaryPopulationReduction(costData.populationImpact);
        }
        
        // Apply happiness impact for nuclear weapons
        if (costData.happinessImpact) {
            this.applyTemporaryHappinessReduction(costData.happinessImpact);
        }
        
        // Update military strength
        this.updateMilitaryStrength();
        
        // Award experience to player for military training
        if (window.Player) {
            Player._awardExperience(amount * 8, 'Military Trained');
        }
        
        EventBus.emit(GameEvents.MILITARY_TRAINED, {
            type: type,
            amount: amount,
            cost: {
                money: actualMoneyCost,
                resources: costData.resources
            },
            populationImpact: costData.populationImpact,
            nation: this
        });
        
        return amount;
    }

    /**
     * Calculate military training cost with new resource requirements
     */
    calculateMilitaryCost(type, amount) {
        const unitCosts = {
            soldiers: {
                money: 1 * amount,
                resources: { food: 1 * amount },
                populationImpact: Math.floor(amount / 10), // Every 10 soldiers = -1 population for 1 day
                techRequired: 0, // No tech requirement
                description: 'Basic infantry units'
            },
            tanks: {
                money: 50 * amount,
                resources: { steel: 5 * amount },
                populationImpact: amount, // Each tank = -1 population for 1 day
                techRequired: 150, // Tech 150 required for armored vehicles
                description: 'Armored combat vehicles'
            },
            aircraft: {
                money: 150 * amount,
                resources: { aluminum: 15 * amount },
                populationImpact: amount * 2, // Each aircraft = -2 population for 1 day
                techRequired: 300, // Tech 300 required for military aviation
                description: 'Military aircraft'
            },
            ships: {
                money: 500 * amount,
                resources: { steel: 30 * amount },
                populationImpact: amount * 5, // Each ship = -5 population for 1 day
                techRequired: 450, // Tech 450 required for naval vessels
                description: 'Naval vessels'
            },
            spies: {
                money: 100000 * amount,
                resources: { ammo: 50 * amount, food: 25 * amount },
                populationImpact: 0, // No population impact
                prerequisite: 'spyOperations',
                techRequired: 0, // No additional tech requirement (spy ops has its own)
                description: 'Intelligence operatives'
            },
            missiles: {
                money: 500000 * amount,
                resources: { gas: 500 * amount, ammo: 500 * amount },
                populationImpact: 0, // No population impact
                prerequisite: 'missileSilo',
                techRequired: 0, // No additional tech requirement (missile silo has its own)
                description: 'Ballistic missiles'
            },
            nukes: {
                money: 1500000 * amount,
                resources: { gas: 1000 * amount, uranium: 1000 * amount },
                populationImpact: 0, // No population impact
                happinessImpact: amount, // -1 happiness for 1 day per nuke
                prerequisite: 'nuclearWarheadFacility',
                techRequired: 0, // No additional tech requirement (nuclear facility has its own)
                description: 'Nuclear warheads'
            }
        };
        
        return unitCosts[type] || { money: 100 * amount, resources: {}, populationImpact: 0, techRequired: 0 };
    }
    
    /**
     * Check if nation has required prerequisite building/project
     */
    hasPrerequisite(prerequisite) {
        if (!prerequisite) return true;
        
        // Check projects first
        if (this.projects && this.projects[prerequisite] > 0) {
            return true;
        }
        
        // Check wonders
        if (this.wonders && this.wonders[prerequisite] > 0) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Apply temporary population reduction for military recruitment
     */
    applyTemporaryPopulationReduction(amount) {
        if (!this.temporaryEffects) {
            this.temporaryEffects = [];
        }
        
        this.temporaryEffects.push({
            type: 'populationReduction',
            amount: amount,
            turnsRemaining: 1, // 1 game day = 1 hourly turn
            description: `Military recruitment impact: -${amount} population`
        });
    }
    
    /**
     * Apply temporary happiness reduction for nuclear weapons
     */
    applyTemporaryHappinessReduction(amount) {
        if (!this.temporaryEffects) {
            this.temporaryEffects = [];
        }
        
        this.temporaryEffects.push({
            type: 'happinessReduction',
            amount: amount,
            turnsRemaining: 1, // 1 game day = 1 hourly turn
            description: `Nuclear weapons production: -${amount} happiness`
        });
    }
    
    /**
     * Process temporary effects each turn
     */
    processTemporaryEffects() {
        if (!this.temporaryEffects) return;
        
        // Reduce turn counters and remove expired effects
        this.temporaryEffects = this.temporaryEffects.filter(effect => {
            effect.turnsRemaining--;
            return effect.turnsRemaining > 0;
        });
    }
    
    /**
     * Calculate daily military maintenance costs
     */
    calculateDailyMaintenanceCosts() {
        const maintenanceCosts = {
            money: 0,
            resources: {}
        };
        
        // Soldiers: $1 and 1 food per 100 soldiers per day
        const soldiers = this.militaryUnits.soldiers || 0;
        if (soldiers > 0) {
            const soldierGroups = Math.ceil(soldiers / 100);
            maintenanceCosts.money += soldierGroups * 1;
            maintenanceCosts.resources.food = (maintenanceCosts.resources.food || 0) + soldierGroups * 1;
        }
        
        // Tanks: $15 and 1 steel per 10 tanks per day
        const tanks = this.militaryUnits.tanks || 0;
        if (tanks > 0) {
            const tankGroups = Math.ceil(tanks / 10);
            maintenanceCosts.money += tankGroups * 15;
            maintenanceCosts.resources.steel = (maintenanceCosts.resources.steel || 0) + tankGroups * 1;
        }
        
        // Aircraft: $50 and 3 aluminum each per day
        const aircraft = this.militaryUnits.aircraft || 0;
        if (aircraft > 0) {
            maintenanceCosts.money += aircraft * 50;
            maintenanceCosts.resources.aluminum = (maintenanceCosts.resources.aluminum || 0) + aircraft * 3;
        }
        
        // Ships: $150 and 5 steel each per day
        const ships = this.militaryUnits.ships || 0;
        if (ships > 0) {
            maintenanceCosts.money += ships * 150;
            maintenanceCosts.resources.steel = (maintenanceCosts.resources.steel || 0) + ships * 5;
        }
        
        // Spies: $500, 5 ammo, and 5 food each per day
        const spies = this.militaryUnits.spies || 0;
        if (spies > 0) {
            maintenanceCosts.money += spies * 500;
            maintenanceCosts.resources.ammo = (maintenanceCosts.resources.ammo || 0) + spies * 5;
            maintenanceCosts.resources.food = (maintenanceCosts.resources.food || 0) + spies * 5;
        }
        
        // Missiles: $1000, 5 ammo, and 5 gas each per day
        const missiles = this.militaryUnits.missiles || 0;
        if (missiles > 0) {
            maintenanceCosts.money += missiles * 1000;
            maintenanceCosts.resources.ammo = (maintenanceCosts.resources.ammo || 0) + missiles * 5;
            maintenanceCosts.resources.gas = (maintenanceCosts.resources.gas || 0) + missiles * 5;
        }
        
        // Nukes: $5000, 50 ammo, and 50 uranium each per day
        const nukes = this.militaryUnits.nukes || 0;
        if (nukes > 0) {
            maintenanceCosts.money += nukes * 5000;
            maintenanceCosts.resources.ammo = (maintenanceCosts.resources.ammo || 0) + nukes * 50;
            maintenanceCosts.resources.uranium = (maintenanceCosts.resources.uranium || 0) + nukes * 50;
        }
        
        return maintenanceCosts;
    }
    
    /**
     * Pay daily military maintenance
     */
    payMilitaryMaintenance() {
        const costs = this.calculateDailyMaintenanceCosts();
        
        // Check if we can afford maintenance
        if (this.money < costs.money) {
            // Reduce military effectiveness if can't pay maintenance
            this.militaryMaintenanceDeficit = true;
            console.warn(`Cannot afford military maintenance: need $${costs.money.toLocaleString()}, have $${this.resources.money.toLocaleString()}`);
            return false;
        }
        
        // Check resource requirements
        for (const [resource, required] of Object.entries(costs.resources)) {
            if ((this.resources[resource] || 0) < required) {
                this.militaryMaintenanceDeficit = true;
                console.warn(`Cannot afford military maintenance: need ${required} ${resource}, have ${this.resources[resource] || 0}`);
                return false;
            }
        }
        
        // Pay costs
        this.money -= costs.money;
        for (const [resource, cost] of Object.entries(costs.resources)) {
            this.resources[resource] -= cost;
        }
        
        this.militaryMaintenanceDeficit = false;
        
        EventBus.emit('military_maintenance_paid', {
            costs: costs,
            nation: this
        });
        
        return true;
    }

    /**
     * Update military strength based on units and player skills
     */
    updateMilitaryStrength() {
        const unitStrength = {
            soldiers: 1,
            tanks: 25,
            aircraft: 100,
            ships: 200,
            spies: 10,      // Intelligence value
            missiles: 500,  // High strategic value
            nukes: 2000     // Ultimate strategic value
        };
        
        let totalStrength = 0;
        Object.keys(this.militaryUnits).forEach(type => {
            totalStrength += this.militaryUnits[type] * (unitStrength[type] || 1);
        });
        
        // Apply player attack skill bonus to military strength
        if (window.Player) {
            const attackVal  = Player.getSkillValue('attack');  // flat bonus
            const defenseVal = Player.getSkillValue('defense'); // flat bonus
            totalStrength = Math.floor(totalStrength + attackVal + defenseVal);
        }
        
        // Apply maintenance deficit penalty (50% effectiveness if can't pay maintenance)
        if (this.militaryMaintenanceDeficit) {
            totalStrength = Math.floor(totalStrength * 0.5);
        }
        
        this.militaryStrength = totalStrength;
    }

    /**
     * Conduct trade with player skill bonuses
     */
    conductTrade(partnerId, offer, request) {
        // Apply player luck and taxation skill to trade efficiency
        let tradeBonus = 0;
        if (window.Player) {
            const luckVal     = Player.getSkillValue('luck');     // decimal e.g. 0.25
            const taxationVal = Player.getSkillValue('taxation'); // decimal e.g. 0.15
            tradeBonus = luckVal * 0.5 + taxationVal; // luck improves trade luck, taxation = trade efficiency
        }
        
        // Calculate trade value with bonus
        const tradeValue = this.calculateTradeValue(offer, request, tradeBonus);
        
        // Execute trade
        Object.keys(offer).forEach(resource => {
            this.resources[resource] -= offer[resource];
        });
        
        Object.keys(request).forEach(resource => {
            this.resources[resource] += Math.floor(request[resource] * (1 + tradeBonus * 0.2)); // Up to 20% bonus
        });
        
        // Award trade experience to player
        if (window.Player) {
            Player._awardExperience(Math.floor(tradeValue / 50), 'Trade Completed');
        }
        
        EventBus.emit(GameEvents.TRADE_COMPLETED, {
            partner: partnerId,
            offer: offer,
            request: request,
            bonus: tradeBonus,
            nation: this
        });
        
        return true;
    }

    /**
     * Calculate trade value
     */
    calculateTradeValue(offer, request, bonus = 0) {
        const resourceValues = {
            money: 1,
            materials: 2,
            food: 1.5,
            energy: 3,
            technology: 5
        };
        
        let offerValue = 0;
        let requestValue = 0;
        
        Object.keys(offer).forEach(resource => {
            offerValue += offer[resource] * (resourceValues[resource] || 1);
        });
        
        Object.keys(request).forEach(resource => {
            requestValue += request[resource] * (resourceValues[resource] || 1);
        });
        
        return Math.max(offerValue, requestValue) * (1 + bonus);
    }

    // ═══════════════════════════════════════════════════════════════════════
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
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════

    destroy() {
        // Clean up event listeners
        EventBus.off(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        EventBus.off(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.off(GameEvents.YEAR_PASSED, this.handleYearPassed, this);
        EventBus.off(GameEvents.RESOURCES_CHANGED, this.handleResourcesChanged, this);
        
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
