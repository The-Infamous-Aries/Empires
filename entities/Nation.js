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

// Nation-level random events are handled via NationSituations (choice-based)
// Population system triggers nation situations on day_passed

class NationClass {
    constructor() {
        this.isInitialized = false;

        // ── Identity ───────────────────────────────────────────────────────
        this.name        = '';
        this.leader      = '';
        this.government  = 'liberalDemocracy';
        this.religion    = 'monotheism';
        this.foodType    = 'salad';
        this.waterType   = 'water';
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
        this.money          = GameConfig.INITIAL_RESOURCES.money; // $10,000,000
        this.taxRate        = GameConfig.BASE_TAX_RATE;           // 2.5% base
        this.taxableIncome  = 0;   // computed each turn
        this.taxRevenue     = 0;   // money earned last turn
        this.totalTaxEarned = 0;
        
        this.budget = { income: 0, expenses: 0, balance: 0 };
        this.debt   = 0;
        
        // Healthcare spending (affected by disease outbreaks and cures)
        this.healthcare_spending = 0;
        
// ── Currency ──────────────────────────────────────────────────────
        this.currency = null; // one of 6 fictional currency types
        this.currencyInvestments = {}; // currency -> { points, entryPrice }
        
        // ── Improvements ───────────────────────────────────────────────────
        this.improvements = {};           // Built improvements (port: 2, mine: 1, etc.)
        this.improvementEffects = {};     // Effects from improvements
        this.diplomaticRelations = {};    // Friends, foes, best friend, nemesis
        this.domesticPolicies = {};       // Internal policies (requires Internal Affairs Office)
        this.policyEffects = {};          // Effects from domestic policies
        this.buildingUpkeep = { improvements: 0, projects: 0, wonders: 0 }; // Building upkeep costs
        this.nationSituationModifiers = { infra_cost: 1, land_cost: 1, tech_cost: 1, infra_upkeep: 0 };
        this.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };

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
        this.researchEffects = {};
        this.researchModifiers = {};

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
            techPurchased:      0,
            missileHits:        0,
            missileMisses:      0,
            nukeHits:           0,
            nukeMisses:         0
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
        this.foodType    = nationData.foodType   || 'salad';
        this.waterType   = nationData.waterType  || 'water';
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
        
        // 3. Pay infrastructure upkeep (affected by nation situation modifiers)
        const infraUpkeepMod = this.nationSituationModifiers?.infra_upkeep || 0;
        if (infraUpkeepMod !== 0 && this.infra > 0) {
            const upkeepCost = Math.floor(this.infra * Math.abs(infraUpkeepMod));
            if (this.money < upkeepCost) {
                this.money = 0;
            } else {
                this.money -= upkeepCost;
            }
        }
        
        // 5. Recalculate population
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
     * Population = (Land × Infra × (Tech + 1) × ageFactor) × modifiers
     * ageFactor  = max(1, nationAgeDays / 30)
     * Population is NEVER 0 — even with Tech = 0, a nation has base population
     * from land and infrastructure.
     *
     * Modifiers include: Happiness, Disease, Crime, Environment, Literacy,
     * Tech, Improvements, Projects, Wonders, Military (safety bonus),
     * and temporary population reductions from military recruitment.
     */
    calculatePopulation() {
        const technology = this.tech + (this.sharedTechnology || 0);
        const ageDays   = this._nationAgeDays();
        const ageFactor = Math.max(1, ageDays / GameConfig.FORMULAS.AGE_FACTOR_DIVISOR);

        // Base population: land × infra × (tech + 1) × ageFactor
        // (tech + 1 ensures population > 0 even at tech 0)
        let population = Math.floor(this.land * this.infra * (technology + 1) * ageFactor);

        // ── Modifier stack ─────────────────────────────────────────────
        let modifier = 1.0;

        // Happiness: above 50 = bonus, below 50 = penalty
        const h = this.nationStats?.happiness || 50;
        modifier *= Math.max(0.5, Math.min(1.5, 1.0 + (h - 50) * 0.01));

        // Disease: higher disease reduces population
        const d = this.nationStats?.disease || 10;
        modifier *= Math.max(0.4, 1.0 - d * 0.008);

        // Crime: higher crime reduces population
        const c = this.nationStats?.crime || 15;
        modifier *= Math.max(0.4, 1.0 - c * 0.004);

        // Environment: better environment increases population
        const e = this.nationStats?.environment || 50;
        modifier *= Math.max(0.5, Math.min(1.5, 1.0 + (e - 50) * 0.01));

        // Literacy rate: more literate = slightly more productive population
        const lit = this.nationStats?.literacy || 0;
        modifier *= 1.0 + lit * 0.002;

        // Tech level: more tech = slightly more population
        modifier *= 1.0 + technology * 0.0005;

        // Military safety bonus: having some military makes citizens feel safe
        const milStrength = this.militaryStrength || 0;
        const militarySafety = Math.min(1.2, 1.0 + Math.min(milStrength / 50000, 0.2));
        modifier *= militarySafety;

        // Apply population efficiency from nation stats
        if (this.nationStats?.populationEfficiency) {
            modifier *= this.nationStats.populationEfficiency;
        }

        // Apply bonus resource multipliers (automobiles, basic needs, etc.)
        let growthMultiplier = modifier;

        if (this.bonusEffects?.automobiles) {
            growthMultiplier += 0.10;
        }
        if (this.bonusEffects?.basicNeeds) {
            growthMultiplier += 0.15;
        }

        // Calculate final population
        let finalPopulation = Math.floor(population * growthMultiplier);

        // Apply research-based population boost (flat % boost to total population)
        const populationBoost = this.researchModifiers?.populationBoost || 0;
        if (populationBoost > 0) {
            finalPopulation = Math.floor(finalPopulation * (1 + populationBoost / 100));
        }

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
        this.calculateFoodWater(); // Calculate food and water coverage
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
     * Calculate literacy rate: grows slowly over time based on tech + improvements/projects/wonders
     * Even with all buildings built, nations only reach about 35-40% literacy at most.
     * Time (nation age) is required to push literacy higher.
     */
    calculateLiteracy() {
        // Base literacy from tech level (very slow: ~0.01% per tech level, max ~20% from tech alone)
        const technology = this.tech + (this.sharedTechnology || 0);
        let baseLiteracy = Math.min(20, technology * 0.01);

        // Time-based growth: nation age contributes to literacy (people become more literate over the ages)
        const ageDays   = this._nationAgeDays();
        const ageBonus  = Math.min(15, ageDays * 0.05); // up to 15% from age alone

        // School bonus: +7.5% per school (max +37.5% but capped by overall 40% cap)
        let schoolBonus = 0;
        if (this.improvementEffects?.literacyBonus) {
            schoolBonus = this.improvementEffects.literacyBonus * 100;
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

        // Sum all sources, hard cap at 40%
        this.nationStats.literacy = Math.min(40, Math.max(0,
            baseLiteracy + ageBonus + schoolBonus + universityBonus + wonderEducationBonus + policyBonus
        ));
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
        
        // Apply research-based pollution reduction
        const pollutionReduction = this.researchModifiers?.pollutionReduction || 0;
        if (pollutionReduction > 0) {
            this.nationStats.pollution = Math.max(0, Math.floor(this.nationStats.pollution * (1 - pollutionReduction / 100)));
        }
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
        
        // Apply research-based disease level reduction
        const diseaseReduction = this.researchModifiers?.diseaseLevelReduction || 0;
        if (diseaseReduction > 0) {
            this.nationStats.disease = Math.max(0, Math.floor(this.nationStats.disease * (1 - diseaseReduction / 100)));
        }
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

        // Apply research-based crime reduction (percentage reduction)
        const crimeReduction = this.researchModifiers?.crimeReduction || 0;
        if (crimeReduction > 0) {
            this.nationStats.crime = Math.max(0, Math.floor(this.nationStats.crime * (1 - crimeReduction / 100)));
        }
    }
    
    /**
     * Calculate food and water coverage for population needs
     * Food/Water are not produced or stacked as resources - they are for happiness/population formulas
     */
    calculateFoodWater() {
        // Calculate food production from farms
        let foodProduction = 0;
        const farmCount = this.improvements?.farm || 0;
        if (farmCount > 0) {
            // Base: 1M per farm
            foodProduction = farmCount * 1000000;
            
            // Apply farm doubling project
            if (this.projectEffects?.farmDoubling) {
                foodProduction = farmCount * 2000000;
            }
            
            // Apply stack bonus at max stack (5 farms)
            if (farmCount >= 5) {
                let stackBonusPercent = 0.50; // Base 50%
                if (this.projectEffects?.farmMaxStackBonus100) {
                    stackBonusPercent = 1.00; // 100% with project
                }
                foodProduction += foodProduction * stackBonusPercent;
            }
        }
        
        // Calculate water production from wells
        let waterProduction = 0;
        const wellCount = this.improvements?.well || 0;
        if (wellCount > 0) {
            // Base: 1M per well
            waterProduction = wellCount * 1000000;
            
            // Apply well doubling project
            if (this.projectEffects?.wellDoubling) {
                waterProduction = wellCount * 2000000;
            }
            
            // Apply stack bonus at max stack (5 wells)
            if (wellCount >= 5) {
                let stackBonusPercent = 0.50; // Base 50%
                if (this.projectEffects?.wellMaxStackBonus100) {
                    stackBonusPercent = 1.00; // 100% with project
                }
                waterProduction += waterProduction * stackBonusPercent;
            }
        }
        
        // Apply wonder effects - Temple of Abundance provides food for ALL population
        if (this.wonderEffects?.abundanceTempleActive) {
            foodProduction = this.population; // Covers entire population
        }
        
        // Aqueduct of Life provides water for ALL population
        if (this.wonderEffects?.aqueductOfLifeActive) {
            waterProduction = this.population; // Covers entire population
        }
        
        // Store production values
        this.nationStats.foodProduction = foodProduction;
        this.nationStats.waterProduction = waterProduction;
        
        // Calculate coverage percentages
        const population = Math.max(1, this.population);
        this.nationStats.foodCoverage = Math.min(100, (foodProduction / population) * 100);
        this.nationStats.waterCoverage = Math.min(100, (waterProduction / population) * 100);
        
        // Calculate food/water deficits (penalties if not enough for all population)
        this.nationStats.foodDeficit = Math.max(0, population - foodProduction);
        this.nationStats.waterDeficit = Math.max(0, population - waterProduction);
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

        // Food and Water penalties - major happiness impacts for basic needs
        // If nation doesn't have enough food/water for ALL population, apply penalties
        if (this.nationStats.foodDeficit > 0) {
            // Penalty scales with deficit percentage
            const foodDeficitPercent = this.nationStats.foodDeficit / Math.max(1, this.population);
            happiness -= foodDeficitPercent * 30; // Up to -30 happiness for 100% deficit
        } else {
            // Bonus for having more than enough food
            happiness += 2;
        }
        
        if (this.nationStats.waterDeficit > 0) {
            // Penalty scales with deficit percentage
            const waterDeficitPercent = this.nationStats.waterDeficit / Math.max(1, this.population);
            happiness -= waterDeficitPercent * 30; // Up to -30 happiness for 100% deficit
        } else {
            // Bonus for having more than enough water
            happiness += 2;
        }

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
        
        // Food/Water wonder happiness bonuses
        if (this.wonderEffects?.abundanceTempleHappinessBonus) {
            happiness += this.wonderEffects.abundanceTempleHappinessBonus;
        }
        if (this.wonderEffects?.aqueductOfLifeHappinessBonus) {
            happiness += this.wonderEffects.aqueductOfLifeHappinessBonus;
        }

        // Apply research-based happiness bonus
        const happinessBonus = this.researchModifiers?.happinessBonus || 0;
        if (happinessBonus > 0) {
            happiness += happinessBonus;
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

        // Apply research-based environment bonus
        const environmentBonus = this.researchModifiers?.environmentBonus || 0;
        if (environmentBonus > 0) {
            environment += environmentBonus;
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
     * Taxable income (per turn) — complex formula that works even at Tech = 0.
     *
     * taxableIncome = Population × TechModifier × LiteracyModifier × HappinessModifier × 0.01
     *
     * TechModifier     = 1.0 + tech × 0.001
     * LiteracyModifier = 1.0 + literacy × 0.01
     * HappinessModifier= 1.0 + (happiness − 50) × 0.005
     *
     * Tax Revenue (per turn / turn income):
     *   taxRevenue = taxableIncome × (taxRate / 100) × taxEfficiency × governmentModifier
     *
     * taxRate = BASE_TAX_RATE (2.5%) + Player Taxation skill (2.5% per level, max 50%)
     * Government tax rate overrides base if a government type sets one.
     * Money is only deposited into this.money when collectTaxes = true (turn collector).
     */
    calculateEconomy(collectTaxes = false) {
        // ── Effective tax rate ─────────────────────────────────────────
        let effectiveTaxRate = GameConfig.BASE_TAX_RATE; // 2.5

        if (window.Player) {
            // Taxation skill: each level adds 2.5%; getSkillValue returns decimal (0.025 per level)
            effectiveTaxRate += Player.getSkillValue('taxation') * 100;
        }

        // Government type tax rate override
        let governmentModifier = 1.0;
        if (window.GovernmentSystem && this.government) {
            const govType = window.GovernmentSystem.getGovernmentType?.(this.government);
            if (govType?.taxRate) {
                effectiveTaxRate = govType.taxRate;
            }
            if (govType?.taxEfficiency) {
                governmentModifier *= govType.taxEfficiency;
            }
        }

        this.taxRate = effectiveTaxRate;

        // ── Complex taxable income formula ─────────────────────────────
        // Works at Tech = 0: population exists, so taxable income > 0
        const technology = this.tech + (this.sharedTechnology || 0);
        const literacy   = this.nationStats?.literacy || 0;
        const happiness  = this.nationStats?.happiness || 50;

        const techModifier     = 1.0 + technology * 0.001;      // +0.1% per tech level
        const literacyModifier = 1.0 + literacy * 0.01;         // +1% per literacy point
        const happinessModifier= 1.0 + (happiness - 50) * 0.005; // +0.5% per happiness point above 50

        this.taxableIncome = Math.floor(
            this.population
            * techModifier
            * literacyModifier
            * happinessModifier
            * 0.01
        );

        // Apply research-based taxable income boost
        const taxableIncomeBoost = this.researchModifiers?.taxableIncomeBoost || 0;
        if (taxableIncomeBoost > 0) {
            this.taxableIncome = Math.floor(this.taxableIncome * (1 + taxableIncomeBoost / 100));
        }

        // Seniors work/taxed at half rate (research effect: seniors_work_tax_half)
        const seniorsHalfTax = this.researchModifiers?.seniorsWorkTaxHalf || 0;
        if (seniorsHalfTax > 0) {
            // Seniors contribute at half rate = boost taxable income by 5% per level of the effect
            this.taxableIncome = Math.floor(this.taxableIncome * (1 + seniorsHalfTax * 0.05));
        }

        // ── Tax revenue ────────────────────────────────────────────────
        const taxEfficiency = Math.max(0.5, Math.min(1.5,
            this.nationStats?.taxEfficiency || 1.0
        )) * governmentModifier;

        this.taxRevenue = Math.floor(
            this.taxableIncome * (this.taxRate / 100) * taxEfficiency
        );

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
     * First 10 blocks (1000 miles) are free at nation creation only.
     * Scaling: every 10 blocks past free = small increase; every 100 blocks = large increase.
     * Starts at block 11 (level 1000).
     */
    landCost() {
        const nextBlock = this.mapBlocks + 1;
        if (nextBlock <= GameConfig.FREE_STARTING_BLOCKS) {
            return 0;
        }

        const blocksPastFree = nextBlock - GameConfig.FREE_STARTING_BLOCKS;
        const tier        = Math.floor(blocksPastFree / 10);   // every 10 blocks (1000 land)
        const majorTier   = Math.floor(blocksPastFree / 100);  // every 100 blocks (10000 land)

        let cost = 5000; // base cost per block
        cost *= (1 + tier * 0.10);   // small increase per 10-block tier
        cost *= (1 + majorTier * 0.50); // large increase per 100-block tier

        // Apply research-based land cost reduction
        const landCostReduction = this.researchModifiers?.landCostReduction || 0;
        if (landCostReduction > 0) {
            cost = Math.floor(cost * (1 - landCostReduction / 100));
        }

        // Apply nation situation modifier
        const landCostMod = this.nationSituationModifiers?.land_cost || 1;
        cost = Math.floor(cost * landCostMod);

        return Math.ceil(cost);
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
     * First 1000 infra are free at nation creation only.
     * Scaling: every 1000 levels = small increase; every 10000 levels = large increase.
     */
    infraCost() {
        if (this.infra + 1 <= GameConfig.FREE_STARTING_INFRA) {
            return 0;
        }

        const levelsPastFree = this.infra + 1 - GameConfig.FREE_STARTING_INFRA;
        const tier        = Math.floor(levelsPastFree / 1000);   // every 1000 infra levels
        const majorTier   = Math.floor(levelsPastFree / 10000);  // every 10000 infra levels

        let cost = 1000; // base cost per infra level
        cost *= (1 + tier * 0.10);    // small increase per 1000-level tier
        cost *= (1 + majorTier * 0.50); // large increase per 10000-level tier

        // Apply Construction bonus: -15% infrastructure cost reduction
        if (this.bonusEffects?.construction) {
            cost = Math.floor(cost * 0.85);
        }

        // Apply research-based infra cost reduction
        const infraCostReduction = this.researchModifiers?.infraCostReduction || 0;
        if (infraCostReduction > 0) {
            cost = Math.floor(cost * (1 - infraCostReduction / 100));
        }

        // Apply nation situation modifier
        const infraCostMod = this.nationSituationModifiers?.infra_cost || 1;
        cost = Math.floor(cost * infraCostMod);

        return Math.ceil(cost);
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
     * Much cheaper base cost, scales based on Land/Infra average.
     *
     * Up to 10% of the Land/Infra average gets cheaper (discount).
     * After that, cost scales greatly.
     * Max discount at avg 5000 (5000 land and 5000 infra).
     * Cost never drops below minimum for that level.
     * All improvements/projects/wonders effects are applied.
     */
    techCost() {
        const nextLevel = this.tech + 1;
        const avgLandInfra = (this.land + this.infra) / 2;

        // Base cost — much cheaper than before
        let cost = nextLevel * 50;

        // Discount: up to 10% of avg land/infra gets cheaper
        const discountableTech = Math.min(nextLevel, avgLandInfra * 0.1);

        // Discount scales with avg, max discount at avg = 5000
        const maxDiscount = Math.min(0.80, avgLandInfra / 5000); // up to 80% off at 5000 avg
        const discount = (discountableTech / Math.max(1, nextLevel)) * maxDiscount;

        cost = Math.floor(cost * (1 - discount));

        // Minimum floor per level — cost never drops below this
        const minCost = nextLevel * 5;

        // Apply improvement/project/wonder tech cost reductions
        if (this.projectEffects?.techCostReduction) {
            cost = Math.floor(cost * (1.0 - this.projectEffects.techCostReduction));
        }
        if (this.wonderEffects?.universalEducationTechCostReduction) {
            cost = Math.floor(cost * (1.0 - this.wonderEffects.universalEducationTechCostReduction));
        }

        // Apply nation situation modifier
        const techCostMod = this.nationSituationModifiers?.tech_cost || 1;
        cost = Math.floor(cost * techCostMod);

        return Math.max(minCost, cost);
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
            window.GovernmentSystem.applyGovernmentBonuses(this, this.government);
            this.governmentType = window.GovernmentSystem.getGovernment(this.government);
            
            // Apply policies from government
            if (this.governmentType?.policies) {
                this.policies = { ...this.governmentType.policies };
            }
            
            // Apply tax rate
            if (this.governmentType?.taxRate) {
                this.taxRate = this.governmentType.taxRate;
            }
            
            return;
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

        // Apply research-based population growth bonus
        const popGrowthBonus = this.researchModifiers?.populationGrowthBonus || 0;
        if (popGrowthBonus > 0) {
            this.populationGrowthModifier = (this.populationGrowthModifier || 1) * (1 + popGrowthBonus / 100);
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
     * Delegates to the unified ResearchSystem (goal-based, funded by lab income)
     */
    processResearch() {
        if (window.ResearchSystem) {
            window.ResearchSystem.processResearchTurn(this);
        }
    }

    /**
     * Start a new research project (goal-based, funded per-turn by lab income)
     */
    startResearch(researchId) {
        if (!window.ResearchSystem) return false;
        const result = window.ResearchSystem.startResearch(this.id, researchId);
        if (result.success) {
            EventBus.emit(GameEvents.RESEARCH_STARTED, {
                research: result.project.research,
                nation: this
            });
        }
        return result.success;
    }

    /**
     * Cancel active research
     */
    cancelResearch(researchId) {
        if (!window.ResearchSystem) return false;
        return window.ResearchSystem.cancelResearch(this.id, researchId);
    }

    /**
     * Get active research for this nation
     */
    getActiveResearch() {
        if (!window.ResearchSystem) return null;
        return window.ResearchSystem.getActiveResearch(this.id);
    }

    /**
     * Get research progress for a specific research (0-100)
     */
    getResearchProgress(researchId) {
        if (!window.ResearchSystem) return 0;
        return window.ResearchSystem.getResearchProgress(this.id, researchId);
    }

    /**
     * Get completed research list
     */
    getCompletedResearch() {
        if (!window.ResearchSystem) return [];
        return window.ResearchSystem.getCompletedResearch(this.id);
    }

    /**
     * Get available research to start
     */
    getAvailableResearch(category = null) {
        if (!window.ResearchSystem) return [];
        return window.ResearchSystem.getAvailableResearch(this.id, category);
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
        // Nation events are now choice-based situations handled by the Population System
        // Fallback to basic built-in events if no situation system is active
        const allEvents = [
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
            currency: this.currency,
            currencyInvestments: { ...this.currencyInvestments },
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
            foodType:        this.foodType,
            waterType:       this.waterType,
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
            wonderEffects:   { ...this.wonderEffects },
            nationSituationModifiers: { ...this.nationSituationModifiers },
            militarySituationModifiers: { ...this.militarySituationModifiers }
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
        
        if (this.money < buildCost) {
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
        
        this.money -= buildCost;
        
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
            throw new Error(`Insufficient funding: need $${costData.money.toLocaleString()}, have $${this.money.toLocaleString()}`);
        }
        
        // No resource requirements (money-only economy)
        
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
        // No resource deduction (money-only economy)
        
        // Deduct population from demographics via Population System (universal truth)
        if (costData.populationCost > 0 && window.PopulationSystem) {
            const eligible = window.PopulationSystem.getMilitaryEligiblePopulation();
            const needed = costData.populationCost;
            if (eligible < needed) {
                throw new Error(`Insufficient military-eligible population: need ${needed}, have ${eligible}`);
            }
            const enlistResult = window.PopulationSystem.enlistMilitaryPopulation(needed);
            costData.populationCostActual = enlistResult.total;
        }
        
        // Add units
        this.militaryUnits[type] = (this.militaryUnits[type] || 0) + amount;
        
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
            populationImpact: costData.populationCostActual || 0,
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
                money: amount * 0.1, // $10 per 100
                resources: {},
                populationCost: Math.ceil(amount * 0.1), // 10 per 100, round up to next whole person
                techRequired: 0, // No tech requirement
                description: 'Basic infantry units'
            },
            tanks: {
                money: 25 * amount,
                resources: {},
                populationCost: Math.ceil(amount * 2), // 2 population per tank
                techRequired: 150, // Tech 150 required for armored vehicles
                description: 'Armored combat vehicles'
            },
            aircraft: {
                money: 100 * amount,
                resources: {},
                populationCost: Math.ceil(amount * 3), // 3 population per aircraft
                techRequired: 300, // Tech 300 required for military aviation
                description: 'Military aircraft'
            },
            ships: {
                money: 250 * amount,
                resources: {},
                populationCost: Math.ceil(amount * 5), // 5 population per ship
                techRequired: 450, // Tech 450 required for naval vessels
                description: 'Naval vessels'
            },
            spies: {
                money: 50000 * amount,
                resources: {},
                populationCost: Math.ceil(amount * 10), // 10 population per spy
                prerequisite: 'spyOperations',
                techRequired: 0, // No additional tech requirement (spy ops has its own)
                description: 'Intelligence operatives'
            },
            missiles: {
                money: 500000 * amount,
                resources: {},
                populationCost: 0, // No population cost
                prerequisite: 'missileSilo',
                techRequired: 0, // No additional tech requirement (missile silo has its own)
                description: 'Ballistic missiles'
            },
            nukes: {
                money: 2500000 * amount,
                resources: {},
                populationCost: 0, // No population cost
                happinessImpact: amount, // -1 happiness for 1 day per nuke
                prerequisite: 'nuclearWarheadFacility',
                techRequired: 0, // No additional tech requirement (nuclear facility has its own)
                description: 'Nuclear warheads'
            }
        };
        
        return unitCosts[type] || { money: 100 * amount, resources: {}, populationCost: 0, techRequired: 0 };
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

        // Military situation modifiers
        const mod = this.militarySituationModifiers || { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };

        // Soldiers: $10 and 1 food per 100 soldiers per day (increased)
        const soldiers = this.militaryUnits.soldiers || 0;
        if (soldiers > 0) {
            const soldierGroups = Math.ceil(soldiers / 100);
            maintenanceCosts.money += Math.floor(soldierGroups * 10 * mod.soldier_eff);
            maintenanceCosts.resources.food = (maintenanceCosts.resources.food || 0) + Math.floor(soldierGroups * 5 * mod.soldier_eff);
        }
        
        // Tanks: $150 and 5 steel per 10 tanks per day (increased)
        const tanks = this.militaryUnits.tanks || 0;
        if (tanks > 0) {
            const tankGroups = Math.ceil(tanks / 10);
            maintenanceCosts.money += Math.floor(tankGroups * 150 * mod.tank_eff);
            maintenanceCosts.resources.steel = (maintenanceCosts.resources.steel || 0) + Math.floor(tankGroups * 15 * mod.tank_eff);
        }
        
        // Aircraft: $500 and 15 aluminum each per day (increased)
        const aircraft = this.militaryUnits.aircraft || 0;
        if (aircraft > 0) {
            maintenanceCosts.money += Math.floor(aircraft * 500 * mod.aircraft_eff);
            maintenanceCosts.resources.aluminum = (maintenanceCosts.resources.aluminum || 0) + Math.floor(aircraft * 45 * mod.aircraft_eff);
        }
        
        // Ships: $1500 and 50 steel each per day (increased)
        const ships = this.militaryUnits.ships || 0;
        if (ships > 0) {
            maintenanceCosts.money += Math.floor(ships * 1500 * mod.ship_eff);
            maintenanceCosts.resources.steel = (maintenanceCosts.resources.steel || 0) + Math.floor(ships * 150 * mod.ship_eff);
        }
        
        // Spies: $5000, 50 ammo, and 50 food each per day (increased)
        const spies = this.militaryUnits.spies || 0;
        if (spies > 0) {
            maintenanceCosts.money += Math.floor(spies * 5000);
            maintenanceCosts.resources.ammo = (maintenanceCosts.resources.ammo || 0) + Math.floor(spies * 50);
            maintenanceCosts.resources.food = (maintenanceCosts.resources.food || 0) + Math.floor(spies * 50);
        }
        
        // Missiles: $10000, 50 ammo, and 50 gas each per day (increased)
        const missiles = this.militaryUnits.missiles || 0;
        if (missiles > 0) {
            maintenanceCosts.money += Math.floor(missiles * 10000);
            maintenanceCosts.resources.ammo = (maintenanceCosts.resources.ammo || 0) + Math.floor(missiles * 50);
            maintenanceCosts.resources.gas = (maintenanceCosts.resources.gas || 0) + Math.floor(missiles * 50);
        }
        
        // Nukes: $50000, 500 ammo, and 500 uranium each per day (increased significantly)
        const nukes = this.militaryUnits.nukes || 0;
        if (nukes > 0) {
            maintenanceCosts.money += Math.floor(nukes * 50000);
            maintenanceCosts.resources.ammo = (maintenanceCosts.resources.ammo || 0) + Math.floor(nukes * 500);
            maintenanceCosts.resources.uranium = (maintenanceCosts.resources.uranium || 0) + Math.floor(nukes * 500);
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
            console.warn(`Cannot afford military maintenance: need $${costs.money.toLocaleString()}, have $${this.money.toLocaleString()}`);
            return false;
        }
        
        // Pay costs
        this.money -= costs.money;
        
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
        
// Trade removed in money-only economy
        return;
        
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
