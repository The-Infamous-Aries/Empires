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
        this.militaryUnits = { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 };
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
        this.founded     = Date.now();
        this.capitalCity = nationData.capital    || 'Capital City';
        this.motto       = nationData.motto      || 'Unity, Progress, Prosperity';
        this.factionKey  = nationData.factionKey  || null;
        this.factionColor = nationData.factionColor || null;

        // Record which game day this nation was founded (for age calculation)
        // GameTime may not exist yet on very first init — default to 0
        this.foundedDay = window.GameTime ? GameTime.getTime().totalDays : 0;

        // Apply government bonuses
        this.applyGovernmentBonuses();

        // Apply religion bonuses
        this.applyReligionBonuses();

        // Start government/religion demand timers
        this.startDemandTimers();

        // First population/tax calculation
        this.calculatePopulation();
        this.calculateEconomy();

        this.isInitialized = true;

        EventBus.emit(GameEvents.NATION_CREATED, { nation: this.serialize() });
        console.log(`Nation '${this.name}' founded on Day ${this.foundedDay}`);
    }

    /**
     * Create nation — static factory
     */
    static create(nationData) {
        if (window.Nation && window.Nation.isInitialized) {
            console.warn('Nation already exists');
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
        // 1. Recalculate population
        this.calculatePopulation();

        // 2. Calculate all nation statistics (literacy, pollution, disease, crime, happiness, environment)
        this.calculateNationStats();

        // 3. Calculate and collect taxes
        this.calculateEconomy();

        // 3. Apply player skill bonuses to the nation
        if (window.Player) Player.applyToNation(this);

        // 4. Update military strength
        this.updateMilitaryStrength();

        // 5. Process research
        this.processResearch();

        // 6. Check government/religion demands
        this.checkDemands();

        // 7. Update happiness
        this.updateHappiness();

        // 8. Process projects (missile production, military penalties)
        if (window.GameEngine?.systems?.projects) {
            window.GameEngine.systems.projects.processDaily(this);
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
        if (this.tech <= 0) {
            this.population = 0;
            return;
        }

        const ageDays   = this._nationAgeDays();
        const ageFactor = Math.max(1, ageDays / GameConfig.FORMULAS.AGE_FACTOR_DIVISOR);
        
        // Base population calculation
        let population = Math.floor(this.land * this.infra * this.tech * ageFactor);
        
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
        
        this.population = Math.floor(population * growthMultiplier);
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
        let baseLiteracy = Math.min(75, (this.tech / 2000) * 75);
        
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
        
        // Government policy effects
        let policyBonus = 0;
        if (this.policyEffects?.educationBonus) {
            policyBonus = this.policyEffects.educationBonus * 100;
        }
        
        this.nationStats.literacy = Math.min(100, baseLiteracy + schoolBonus + universityBonus + policyBonus);
    }
    
    /**
     * Calculate pollution: base from industry, reduced by improvements and policies
     */
    calculatePollution() {
        // Base pollution from infrastructure and manufacturing
        let basePollution = Math.floor((this.infra / 50) + (this.population / 200000));
        
        // Add pollution from mines (industrial activity)
        const mineCount = this.improvements?.mine || 0;
        basePollution += mineCount * 2; // +2 pollution per mine
        
        // Add pollution from factories
        const factoryCount = this.improvements?.factory || 0;
        basePollution += factoryCount * 3; // +3 pollution per factory
        
        // Recycling center reduction: -5% per center
        let recyclingReduction = 1.0;
        if (this.improvementEffects?.pollutionReduction) {
            recyclingReduction -= this.improvementEffects.pollutionReduction;
        }
        
        // Parks reduction: -5% per park
        if (this.improvementEffects?.pollutionFromParks) {
            recyclingReduction -= Math.abs(this.improvementEffects.pollutionFromParks);
        }
        
        // Policy effects (environmental policies)
        if (this.policyEffects?.environmentalHealth) {
            recyclingReduction *= (1.0 + this.policyEffects.environmentalHealth);
        }
        
        this.nationStats.pollution = Math.max(0, Math.floor(basePollution * recyclingReduction));
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
        
        // Environment quality affects disease (good environment reduces disease)
        let environmentEffect = (50 - this.nationStats.environment) * 0.2; // +/- 0.2% per point from 50
        
        // Healthcare policy effects
        let healthcareEffect = 0;
        if (this.policyEffects?.healthcareQuality) {
            healthcareEffect = this.policyEffects.healthcareQuality * -10; // Better healthcare reduces disease
        }
        
        this.nationStats.disease = Math.max(0, Math.min(50, 
            baseDisease + pollutionEffect - hospitalReduction - ambulanceReduction + environmentEffect + healthcareEffect
        ));
    }
    
    /**
     * Calculate crime rate: base 15% affected by police, literacy, happiness, and casinos
     */
    calculateCrime() {
        let baseCrime = 15; // 15% base crime rate
        
        // Police station reduction: -5% per station
        let policeReduction = 0;
        if (this.improvementEffects?.crimeReduction) {
            policeReduction = this.improvementEffects.crimeReduction * 100; // Convert to percentage points
        }
        
        // Casino increase: +3% per casino
        let casinoIncrease = 0;
        if (this.improvementEffects?.crimeIncrease) {
            casinoIncrease = this.improvementEffects.crimeIncrease * 100;
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
            baseCrime - policeReduction + casinoIncrease + literacyEffect + happinessEffect + surveillanceEffect
        ));
    }

    /**
     * taxableIncome = (Infra / 50) × population × Tech × literacy modifier
     * taxRevenue    = taxableIncome × (taxRate / 100) × tax efficiency
     *
     * taxRate = base 2.5% + player Taxation skill value
     * Money is deposited into this.money each turn.
     */
    calculateEconomy() {
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
                             * this.tech
                             * literacyModifier);

        // Revenue this turn with tax efficiency
        this.taxRevenue    = Math.floor(this.taxableIncome * (this.taxRate / 100) * this.nationStats.taxEfficiency);
        this.money        += this.taxRevenue;
        this.totalTaxEarned = (this.totalTaxEarned || 0) + this.taxRevenue;

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
    calculateResourceGeneration() { this.calculateEconomy(); }

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
            const gov = GovernmentSystem.getGovernment(this.government);
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
        
        const religion = ReligionSystem.getReligion(this.religion);
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
        
        const hints = GovernmentSystem.getGovernmentHints(this.government, 5);
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get random hint for current religion
     */
    getReligionHint() {
        if (!window.ReligionSystem) return null;
        
        const hints = ReligionSystem.getReligionHints(this.religion, 5);
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
     * Calculate resource generation rates
     */
    calculateResourceGeneration() {
        // Base generation
        this.resourceGeneration.money = this.population * GameConfig.RESOURCE_GENERATION.BASE_MONEY_PER_CITIZEN;
        this.resourceGeneration.food = this.territories.length * 100; // Placeholder
        
        // Apply government modifiers
        Object.keys(this.resourceGeneration).forEach(resource => {
            this.resourceGeneration[resource] = Math.floor(
                this.resourceGeneration[resource] * this.governmentType.economyBonus
            );
        });
        
        // Apply happiness modifiers
        const happinessModifier = 1 + ((this.happiness - 50) / 100);
        Object.keys(this.resourceGeneration).forEach(resource => {
            this.resourceGeneration[resource] = Math.floor(
                this.resourceGeneration[resource] * happinessModifier
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
        const events = [
            {
                name: 'Economic Boom',
                description: 'Your nation experiences unexpected economic growth!',
                effects: { gdp: 1.1, happiness: 5 }
            },
            {
                name: 'Natural Disaster',
                description: 'A natural disaster strikes your nation.',
                effects: { population: 0.95, happiness: -10, money: -1000 }
            },
            {
                name: 'Technological Breakthrough',
                description: 'Your scientists make an important discovery!',
                effects: { technology: 100, researchPoints: 500 }
            },
            {
                name: 'Diplomatic Success',
                description: 'Your diplomatic efforts improve international relations.',
                effects: { reputation: 5, happiness: 3 }
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
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
            achievements:    Array.from(this.achievements)
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
        const cost = this.calculateMilitaryCost(type, amount);
        
        if (this.resources.money < cost) {
            throw new Error('Insufficient military funding');
        }
        
        // Apply player attack skill bonus — each attack level = 50 flat damage reduction to cost
        let actualCost = cost;
        if (window.Player) {
            const attackVal = Player.getSkillValue('attack'); // flat 0-1000
            // Each 100 attack = 2% discount, max 20% reduction
            const discount = Math.min(0.20, attackVal / 5000);
            actualCost = Math.floor(cost * (1 - discount));
        }
        
        this.resources.money -= actualCost;
        this.militaryUnits[type] = (this.militaryUnits[type] || 0) + amount;
        
        // Update military strength
        this.updateMilitaryStrength();
        
        // Award experience to player for military training
        if (window.Player) {
            Player._awardExperience(amount * 8, 'Military Trained');
        }
        
        EventBus.emit(GameEvents.MILITARY_TRAINED, {
            type: type,
            amount: amount,
            cost: actualCost,
            nation: this
        });
        
        return amount;
    }

    /**
     * Calculate military training cost
     */
    calculateMilitaryCost(type, amount) {
        const baseCosts = {
            soldiers: 100,
            tanks: 5000,
            aircraft: 25000,
            ships: 50000
        };
        
        return (baseCosts[type] || 100) * amount;
    }

    /**
     * Update military strength based on units and player skills
     */
    updateMilitaryStrength() {
        const unitStrength = {
            soldiers: 1,
            tanks: 25,
            aircraft: 100,
            ships: 200
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

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NationClass, Nation };
}
    
    /**
     * Calculate comprehensive happiness from all sources
     */
    calculateHappiness() {
        let totalHappiness = GameConfig.INITIAL_HAPPINESS; // Start with base 50
        
        // Economic factors
        if (this.budget.balance > 0) totalHappiness += 5;
        if (this.budget.balance < 0) totalHappiness -= 10;
        
        // Stability effects
        if (this.stability < 50) totalHappiness -= (50 - this.stability) * 0.2;
        if (this.stability > 80) totalHappiness += (this.stability - 80) * 0.1;
        
        // Critical resource penalties (water/food)
        if (this.criticalResourcePenalty > 0) {
            totalHappiness -= this.criticalResourcePenalty * 10; // -10 per missing critical resource
        }
        
        // Improvement effects
        if (this.bonusEffects?.basicNeeds) {
            totalHappiness += 10; // Basic Needs bonus provides +10 happiness
        }
        
        if (this.improvementEffects?.happinessFromParks) {
            totalHappiness += this.improvementEffects.happinessFromParks; // +3 per park
        }
        
        if (this.improvementEffects?.happinessDecrease) {
            totalHappiness -= this.improvementEffects.happinessDecrease; // -2 per casino
        }
        
        // Project effects
        if (this.projectEffects?.universityHappinessBonus) {
            totalHappiness += this.projectEffects.universityHappinessBonus; // +3 per university
        }
        
        if (this.projectEffects?.ambulanceHappinessBonus) {
            totalHappiness += this.projectEffects.ambulanceHappinessBonus; // +5 per ambulance hub
        }
        
        // Disease and crime reduce happiness
        totalHappiness -= this.nationStats.disease * 0.5; // -0.5% per 1% disease rate
        totalHappiness -= this.nationStats.crime * 0.3; // -0.3% per 1% crime rate
        
        // Pollution reduces happiness
        totalHappiness -= this.nationStats.pollution * 0.4; // -0.4% per pollution point
        
        // Environment quality affects happiness
        totalHappiness += (this.nationStats.environment - 50) * 0.3; // +/- 0.3% per point from base 50
        
        // Government happiness effects
        const gov = window.GovernmentSystem?.getGovernment(this.government);
        if (gov?.bonuses?.happiness) {
            totalHappiness *= gov.bonuses.happiness;
        }
        
        // Religion happiness effects
        const religion = window.ReligionSystem?.getReligion(this.religion);
        if (religion?.bonuses?.happiness) {
            totalHappiness *= religion.bonuses.happiness;
        }
        
        // Policy effects
        if (this.policyEffects?.civilLiberties) {
            totalHappiness += this.policyEffects.civilLiberties * 20; // Civil liberties boost happiness
        }
        
        if (this.policyEffects?.socialEquality) {
            totalHappiness += this.policyEffects.socialEquality * 15; // Social equality boosts happiness
        }
        
        this.nationStats.happiness = Math.max(0, Math.min(100, totalHappiness));
        this.happiness = this.nationStats.happiness; // Keep legacy field updated
    }
    
    /**
     * Calculate environment quality
     */
    calculateEnvironment() {
        let environment = 50; // Base environment quality
        
        // Pollution reduces environment quality directly
        environment -= this.nationStats.pollution * 1.5; // -1.5 per pollution point
        
        // Parks improve environment
        if (this.improvementEffects?.environmentBonus) {
            environment += this.improvementEffects.environmentBonus * 50; // +5 per park (10% of 50)
        }
        
        // Environmental policies
        if (this.policyEffects?.environmentalHealth) {
            environment += this.policyEffects.environmentalHealth * 50; // Policy effects on environment
        }
        
        // Industrial output can harm environment
        if (this.policyEffects?.industrialOutput && this.policyEffects.industrialOutput > 0) {
            environment -= this.policyEffects.industrialOutput * 25; // Industrial focus harms environment
        }
        
        this.nationStats.environment = Math.max(0, Math.min(100, environment));
    }
    
    /**
     * Calculate derived effects from all statistics
     */
    calculateDerivedEffects() {
        // Population efficiency (affects population formula)
        let popEfficiency = 1.0;
        
        // Disease reduces population efficiency
        popEfficiency -= (this.nationStats.disease / 100) * 0.5; // Max -25% at 50% disease rate
        
        // Crime reduces population efficiency
        popEfficiency -= (this.nationStats.crime / 100) * 0.3; // Max -24% at 80% crime rate
        
        // High happiness improves population efficiency
        if (this.nationStats.happiness > 70) {
            popEfficiency += (this.nationStats.happiness - 70) * 0.01; // Up to +30% at 100 happiness
        }
        
        this.nationStats.populationEfficiency = Math.max(0.5, Math.min(1.5, popEfficiency));
        
        // Military morale (affects all military units)
        let morale = 1.0;
        
        // Happiness affects military morale
        morale += (this.nationStats.happiness - 50) * 0.01; // +/- 1% per happiness point from 50
        
        // Literacy improves military effectiveness (better educated soldiers)
        morale += this.nationStats.literacy * 0.005; // Up to +50% at 100% literacy
        
        // Crime and disease reduce military effectiveness
        morale -= this.nationStats.crime * 0.002; // Up to -16% at 80% crime
        morale -= this.nationStats.disease * 0.003; // Up to -15% at 50% disease
        
        this.nationStats.militaryMorale = Math.max(0.5, Math.min(2.0, morale));
        
        // Tax efficiency (affects tax collection)
        let taxEff = 1.0;
        
        // Literacy improves tax efficiency (better record keeping, less evasion)
        taxEff += this.nationStats.literacy * 0.003; // Up to +30% at 100% literacy
        
        // Crime reduces tax efficiency (more tax evasion)
        taxEff -= this.nationStats.crime * 0.002; // Up to -16% at 80% crime
        
        // Casino bonus to taxable income
        if (this.improvementEffects?.taxableIncomeBonus) {
            taxEff += this.improvementEffects.taxableIncomeBonus; // +5% per casino
        }
        
        // Policy effects on tax efficiency
        if (this.policyEffects?.taxEfficiency) {
            taxEff += this.policyEffects.taxEfficiency;
        }
        
        this.nationStats.taxEfficiency = Math.max(0.5, Math.min(2.0, taxEff));
        
        // Update happiness modifier for legacy systems
        this.nationStats.happinessModifier = 1.0 + ((this.nationStats.happiness - 50) / 100);
    }