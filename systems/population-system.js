/**
 * Population System - Population Management and Demographics
 * Dominion Wars - Nation Building Strategy Game
 */

// PopulationSituations are loaded as globals via script tags in index.html
// CitizenJobSystem is the truth source for citizen jobs, income, and taxation
let CitizenJobSystem;
try {
    CitizenJobSystem = window.CitizenJobSystem;
} catch (e) {
    CitizenJobSystem = null;
}

class PopulationSystem {
    constructor() {
        this.isInitialized = false;
        
        // Real-time age group configuration (days since birth)
        // Newborn → Teen: 14 days real time
        // Teen → Senior: ~120 days real time (3-5 months)
        // Senior → Elderly: ~30 days real time (1 month)
        // Elderly → Death: ~14 days real time
        // Total lifespan: ~178 days real time
        this.ageGroupConfig = {
            newborn:   { minDays: 0,     maxDays: 3,   taxable: false, militaryEligible: false },
            infant:    { minDays: 3,     maxDays: 7,   taxable: false, militaryEligible: false },
            toddler:   { minDays: 7,     maxDays: 10,  taxable: false, militaryEligible: false },
            child:     { minDays: 10,    maxDays: 14,  taxable: false, militaryEligible: false },
            teen:        { minDays: 14,    maxDays: 45,  taxable: true,  militaryEligible: true },
            youngAdult:  { minDays: 45,    maxDays: 75,  taxable: true,  militaryEligible: true },
            adult:       { minDays: 75,    maxDays: 100, taxable: true,  militaryEligible: true },
            middleAged:  { minDays: 100,   maxDays: 120, taxable: true,  militaryEligible: true },
            older:       { minDays: 120,   maxDays: 134, taxable: true,  militaryEligible: true },
            senior:      { minDays: 134,   maxDays: 164, taxable: false, militaryEligible: false },
            elderly:     { minDays: 164,   maxDays: 178, taxable: false, militaryEligible: false }
        };
        this.REAL_TIME_MAX_AGE_DAYS = 178; // Death threshold

        // Age Demographics with lifecycle tracking (counts synced from citizens)
        this.ageGroups = {
            newborn:   { min: 0,   max: 3,   count: 0 },
            infant:    { min: 3,   max: 7,   count: 0 },
            toddler:   { min: 7,   max: 10,  count: 0 },
            child:     { min: 10,  max: 14,  count: 0 },
            teen:        { min: 14,  max: 45,  count: 0 },
            youngAdult:  { min: 45,  max: 75,  count: 0 },
            adult:       { min: 75,  max: 100, count: 0 },
            middleAged:  { min: 100, max: 120, count: 0 },
            older:       { min: 120, max: 134, count: 0 },
            senior:      { min: 134, max: 164, count: 0 },
            elderly:     { min: 164, max: 178, count: 0 }
        };

        // Individual citizen tracking for real-time age progression
        this.citizens = new Map(); // citizenId -> { birthTime: timestamp, ageGroup: string, employmentStatus: string, educationLevel: string }
        this.nextCitizenId = 1;

        // Pending replacement births (2-turn buffer after death)
        this.pendingBirths = new Map(); // day -> count of births to add
        
        // Base demographic rates (affected by game conditions)
        this.vitalRates = {
            baseBirthRate: 0.035,      // 3.5% annual birth rate
            baseDeathRate: 0.01,       // 1% annual death rate
            migrationRate: 0.005,      // 0.5% annual migration rate
            literacyGrowthRate: 0.001, // Daily literacy improvement rate
            educationProgressRate: 0.002 // Daily education advancement rate
        };
        
        // Population distribution across territories
        this.territorialDistribution = new Map();
        
        // Migration and policy system
        this.migrationFactors = {
            happiness: 1.0,
            literacy: 1.0,
            technology: 1.0,
            pollution: 1.0,
            disease: 1.0,
            crime: 1.0,
            employment: 1.0,
            infrastructure: 1.0
        };
        
        this.migrationPolicy = 'balanced'; // open, restricted, balanced
        this.migrationEffectiveness = 1.0;

        // Military population penalty settings
        this.militaryPenaltyThreshold = 0.5; // 50% of eligible population drafted triggers penalty
        this.militaryPenaltyGrowthMultiplier = 0.5; // 50% growth reduction when penalty active

        // Population Situations System (every 3 days)
        this.populationSituations = {
            lastSituationDay: 0,
            situationInterval: 3, // Every 3 days
            activeSituation: null,
            situationHistory: [],
            activeEffects: new Map() // effectId -> { endDay: number, effects: object }
        };

        // Nation Situations System (every 5 days)
        this.nationSituations = {
            lastSituationDay: 0,
            situationInterval: 5, // Every 5 days
            activeSituation: null,
            situationHistory: [],
            activeEffects: new Map() // effectId -> { endDay: number, effects: object }
        };
        this.nationSituationDatabase = [];

        // Military Situations System (every 4 days)
        this.militarySituations = {
            lastSituationDay: 0,
            situationInterval: 4, // Every 4 days
            activeSituation: null,
            situationHistory: [],
            activeEffects: new Map() // effectId -> { endDay: number, effects: object }
        };
        this.militarySituationDatabase = [];
        
        // Employment system
        this.employment = {
            workforce: 0,              // Working age population (youngAdult + adult + middleAged)
            employed: 0,               // Currently employed
            unemployed: 0,             // Seeking work
            students: 0,               // In education (child + teen + some youngAdult)
            retired: 0,                // Retired (senior + elderly)
            dependents: 0,             // Too young/old to work (newborn + infant + toddler)
            unemploymentRate: 0.05,    // 5% base unemployment
            laborParticipationRate: 0.75 // 75% of working age actually work
        };
        
        // Education system
        this.education = {
            noEducation: 0.15,         // 15% no formal education
            primaryEducation: 0.35,    // 35% primary education
            secondaryEducation: 0.35,  // 35% secondary education
            higherEducation: 0.15,     // 15% higher education
            progressionQueue: new Map(), // citizenId -> { targetLevel: 'secondary', daysRemaining: 7 }
            literacyRequirements: {
                primary: 25,    // Need 25% literacy for primary education
                secondary: 50,  // Need 50% literacy for secondary education  
                higher: 75      // Need 75% literacy for higher education
            }
        };
        
        // Population history for analysis
        this.history = {
            totalPopulation: [],
            ageDistribution: [],
            migration: [],
            births: [],
            deaths: [],
            enlisted: [],
            diedInCombat: [],
            reachedSenior: [],
            emigrated: [],
            employment: [],
            education: [],
            // Legacy arrays used by the older processing path
            population: [],
            happiness: [],
            growth: [],
            maxHistoryLength: 365
        };

        // Running population statistics
        this.populationStats = {
            born: 0,
            died: 0,
            enlisted: 0,
            diedInCombat: 0,
            reachedSenior: 0,
            emigrated: 0
        };

        // Happiness factors (0-100 scale per category)
        this.happinessFactors = {
            housing:     50,
            healthcare:  50,
            education:   50,
            employment:  50,
            safety:      50,
            environment: 50,
            governance:  50,
            economy:     50
        };

        // Growth modifier multipliers (1.0 = neutral)
        this.growthModifiers = {
            happiness:  1.0,
            disease:    1.0,
            war:        1.0,
            policies:   1.0,
            resources:  1.0
        };

        this.initializePopulationSituations();
        this.initializeNationSituations();
        this.initializeMilitarySituations();
    }

    /**
     * Initialize population situations from the PopulationSituations data file
     */
    initializePopulationSituations() {
        this.situationDatabase = [];

        // Load situations from the PopulationSituations global (assets/data/events/population-situations.js)
        if (typeof window !== 'undefined' && window.PopulationSituations) {
            Object.values(window.PopulationSituations).forEach(category => {
                if (!Array.isArray(category)) return;
                category.forEach(situation => {
                    this.situationDatabase.push({
                        id: situation.id,
                        title: situation.title,
                        description: situation.description,
                        duration: situation.duration,
                        choices: situation.choices.map(choice => ({
                            text: choice.text,
                            effects: { ...choice.effects }
                        }))
                    });
                });
            });
        }

        this.log('debug', `Loaded ${this.situationDatabase.length} population situations from data file`);
    }

    /**
     * Initialize nation situations from the NationSituations data file
     */
    initializeNationSituations() {
        this.nationSituationDatabase = [];

        if (typeof window !== 'undefined' && window.NationSituations) {
            Object.values(window.NationSituations).forEach(category => {
                if (!Array.isArray(category)) return;
                category.forEach(situation => {
                    this.nationSituationDatabase.push({
                        id: situation.id,
                        title: situation.title,
                        description: situation.description,
                        duration: situation.duration,
                        choices: situation.choices.map(choice => ({
                            text: choice.text,
                            effects: { ...choice.effects }
                        }))
                    });
                });
            });
        }

        this.log('debug', `Loaded ${this.nationSituationDatabase.length} nation situations from data file`);
    }

    /**
     * Initialize military situations from the MilitarySituations data file
     */
    initializeMilitarySituations() {
        this.militarySituationDatabase = [];

        if (typeof window !== 'undefined' && window.MilitarySituations) {
            Object.values(window.MilitarySituations).forEach(category => {
                if (!Array.isArray(category)) return;
                category.forEach(situation => {
                    this.militarySituationDatabase.push({
                        id: situation.id,
                        title: situation.title,
                        description: situation.description,
                        duration: situation.duration,
                        war_peace: situation.war_peace || 'peace',
                        choices: situation.choices.map(choice => ({
                            text: choice.text,
                            effects: { ...choice.effects }
                        }))
                    });
                });
            });
        }

        this.log('debug', `Loaded ${this.militarySituationDatabase.length} military situations from data file`);
    }

    /**
     * Initialize the population system
     */
    async initialize() {
        console.log('Initializing Population System...');
        
        // Set initial population from nation data
        if (window.Nation) {
            const pop = window.Nation.population || 0;
            this.initializeAgeDistribution(pop);
            this.updateDemographics();
        }
        
        // Initialize territorial distribution
        this.initializeTerritorialDistribution();
        
        // Set up event listeners
        this.bindEvents();
        
        this.isInitialized = true;
        console.log('Population System initialized');
    }

    /**
     * Bind EventBus listeners for population-affecting game events
     */
    bindEvents() {
        if (typeof EventBus === 'undefined') return;

        if (typeof this.handleDayPassed === 'function') {
            EventBus.on('day_passed', (data) => this.handleDayPassed(data));
        }
        if (typeof this.handleMonthPassed === 'function') {
            EventBus.on('month_passed', (data) => this.handleMonthPassed(data));
        }
        if (typeof this.handleYearPassed === 'function') {
            EventBus.on('year_passed', (data) => this.handleYearPassed(data));
        }
        if (typeof this.handleTerritoryAdded === 'function') {
            EventBus.on('territory_added', (data) => this.handleTerritoryAdded(data));
        }
        if (typeof this.handleTerritoryRemoved === 'function') {
            EventBus.on('territory_removed', (data) => this.handleTerritoryRemoved(data));
        }
        if (typeof this.handlePolicyChanged === 'function') {
            EventBus.on('policy_changed', (data) => this.handlePolicyChanged(data));
        }
        if (typeof this.handleInfrastructureBuilt === 'function') {
            EventBus.on('infrastructure_built', (data) => this.handleInfrastructureBuilt(data));
        }
    }

    /**
     * Initialize age distribution based on current population
     */
    initializeAgeDistribution(totalPopulation) {
        // Clear existing citizens and reset counts before reinitializing
        this.citizens.clear();
        this.nextCitizenId = 1;
        Object.keys(this.ageGroups).forEach(ag => { this.ageGroups[ag].count = 0; });
        
        // Distribute population across age groups with realistic proportions
        const ageDistribution = {
            newborn: 0.02,
            infant: 0.03,
            toddler: 0.05,
            child: 0.15,
            teen: 0.12,
            youngAdult: 0.18,
            adult: 0.25,
            middleAged: 0.15,
            older: 0.08,
            senior: 0.04,
            elderly: 0.02
        };
        
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        // Initialize age groups with population counts
        Object.entries(ageDistribution).forEach(([ageGroup, proportion]) => {
            this.ageGroups[ageGroup].count = Math.floor(totalPopulation * proportion);
        });
        
        // Sync territorial distribution with citizen counts
        this.syncTerritorialDistributionWithCitizens();
        
        // Create individual citizens with real-time birth timestamps
        Object.entries(this.ageGroups).forEach(([ageGroup, data]) => {
            for (let i = 0; i < data.count; i++) {
                const daysOld = this.getRandomDaysInGroup(ageGroup);
                const isGifted = Math.random() < 0.05;
                const citizen = {
                    id: this.nextCitizenId++,
                    birthTime: now - (daysOld * msPerDay),
                    ageGroup: ageGroup,
                    employmentStatus: this.determineEmploymentStatus(ageGroup),
                    educationLevel: this.determineEducationLevel(ageGroup),
                    literacyScore: 0,
                    isGifted: isGifted,
                    literacyProgress: 0,
                    relationshipStatus: ageGroup === 'teen' || ageGroup === 'youngAdult' ? (Math.random() < 0.3 ? 'dating' : 'single') : 'single',
                    spouseIds: [],
                    partnerIds: [],
                    parentIds: [],
                    childIds: [],
                    relationships: new Map(),
                    ethnicity: null // Will be resolved from nation name
                };
                
                // Set initial literacy based on age group as a fraction of national literacy
                if (window.Nation?.nationStats) {
                    const nationLiteracy = window.Nation.nationStats.literacy || 0;
                    const cap = isGifted ? Math.min(100, nationLiteracy + 20) : nationLiteracy;
                    citizen.literacyScore = this._getInitialLiteracyForAgeGroup(ageGroup, nationLiteracy, cap);
                }
                
                this.citizens.set(citizen.id, citizen);
            }
        });
        
        // Final sync after citizens are created
        this.syncTerritorialDistributionWithCitizens();
    }

    /**
     * Get random days-old within an age group (real-time days)
     */
    getRandomDaysInGroup(ageGroup) {
        const config = this.ageGroupConfig[ageGroup];
        return Math.floor(Math.random() * (config.maxDays - config.minDays)) + config.minDays;
    }

    /**
     * Determine employment status based on age group
     */
    determineEmploymentStatus(ageGroup) {
        const workingAges = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        if (!workingAges.includes(ageGroup)) return 'not_applicable';
        
        const rand = Math.random();
        if (rand < 0.75) return 'employed';
        if (rand < 0.80) return 'unemployed';
        return 'student';
    }

    /**
     * Determine education level based on age and literacy
     */
    determineEducationLevel(ageGroup) {
        const youngAges = ['newborn', 'infant', 'toddler', 'child'];
        if (youngAges.includes(ageGroup)) return 'none';
        
        // Use nationStats.literacy — direct Nation.literacy property does not exist
        const ns      = (window.Nation && window.Nation.nationStats) ? window.Nation.nationStats : {};
        const literacy = ns.literacy !== undefined ? ns.literacy : 0;
        const rand = Math.random() * 100;
        
        if (rand < literacy * 0.2) return 'higher';
        if (rand < literacy * 0.6) return 'secondary';
        if (rand < literacy * 0.8) return 'primary';
        return 'none';
    }

    /**
     * Convert education level to a literacy score (0-100) for job assignment
     */
    _educationToLiteracyScore(educationLevel) {
        switch (educationLevel) {
            case 'higher': return 80;
            case 'secondary': return 60;
            case 'primary': return 30;
            case 'none':
            default: return 10;
        }
    }

    /**
     * Get initial literacy score for an initialized citizen based on age group.
     * Returns a random value within the expected cumulative range for that age,
     * as a fraction of the nation's literacy rate.
     */
    _getInitialLiteracyForAgeGroup(ageGroup, nationLiteracy, cap) {
        // Expected cumulative literacy as fraction of national literacy by age group
        const ranges = {
            newborn:    { min: 0.00, max: 0.00 },
            infant:     { min: 0.01, max: 0.03 },
            toddler:    { min: 0.04, max: 0.08 },
            child:      { min: 0.09, max: 0.16 },
            teen:       { min: 0.24, max: 0.41 },
            youngAdult: { min: 0.29, max: 0.51 },
            adult:      { min: 0.31, max: 0.56 },
            middleAged: { min: 0.32, max: 0.59 },
            older:      { min: 0.325, max: 0.61 },
            senior:     { min: 0.325, max: 0.61 },
            elderly:    { min: 0.325, max: 0.61 }
        };

        const range = ranges[ageGroup] || ranges.newborn;
        const raw = nationLiteracy * (range.min + Math.random() * (range.max - range.min));
        return Math.min(cap, Math.max(0, Math.round(raw * 100) / 100));
    }

    /**
     * Get current day from TimeSystem
     */
    getCurrentDay() {
        return window.TimeSystem ? window.TimeSystem.currentDay : 1;
    }

    /**
     * Log helper for debugging
     */
    log(level, message) {
        if (typeof console !== 'undefined') {
            console[level] ? console[level](message) : console.log(message);
        }
    }


    /**
     * Update population growth
     */
    updatePopulationGrowth() {
        const totalPopulation = this.getTotalPopulation();
        if (totalPopulation === 0 || this.territorialDistribution.size === 0) return;
        
        // Calculate daily growth rate based on nation conditions
        const dailyGrowthRate = this.calculatePopulationGrowthRate();
        
        // Calculate population change
        const populationChange = totalPopulation * dailyGrowthRate;
        
        // Apply to territorial populations
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            const territoryGrowth = (data.population / totalPopulation) * populationChange;
            
            // Apply territory-specific modifiers
            const capacityModifier = Math.min(1.0, data.capacity / Math.max(data.population, 1));
            const happinessModifier = data.happiness / 50; // 50 is neutral happiness
            
            const actualGrowth = territoryGrowth * capacityModifier * happinessModifier;
            
            data.population += actualGrowth;
            data.growth = actualGrowth;
        }
        
        // Track growth for history (citizens handle actual births/deaths)
    }

    /**
     * Process migration (immigration/emigration)
     */

    /**
     * Process territorial migration (movement between territories)
     */
    processTerritorialMigration() {
        // People move from less happy territories to happier ones
        const territories = Array.from(this.territorialDistribution.entries());
        
        territories.forEach(([fromId, fromData]) => {
            territories.forEach(([toId, toData]) => {
                if (fromId !== toId && fromData.happiness < toData.happiness) {
                    const happinessDifference = toData.happiness - fromData.happiness;
                    const migrationRate = Math.min(0.001, happinessDifference / 10000); // Max 0.1% per day
                    
                    const migrationAmount = fromData.population * migrationRate;
                    
                    // Check capacity constraints
                    if (toData.population + migrationAmount <= toData.capacity * 1.2) { // Allow 20% overcrowding
                        fromData.population -= migrationAmount;
                        toData.population += migrationAmount;
                    }
                }
            });
        });
    }

    /**
     * Apply population density effects to nation stats (crime, disease, happiness).
     * Higher density = higher crime, higher disease, lower happiness.
     * Only applies to territories that have been added (selected map pieces).
     */
    applyDensityEffectsToNation() {
        if (!window.Nation) return;

        const territories = Array.from(this.territorialDistribution.values());
        if (territories.length === 0) return;

        // Calculate weighted average density across all territories
        let totalPopulation = 0;
        let totalLandMiles = 0;
        let weightedDensitySum = 0;

        for (const data of territories) {
            totalPopulation += data.population || 0;
            totalLandMiles += data.landMiles || 0;
            if (data.landMiles && data.landMiles > 0) {
                weightedDensitySum += (data.population / data.landMiles) * data.population;
            }
        }

        const overallDensity = totalLandMiles > 0 ? totalPopulation / totalLandMiles : 0;
        const weightedDensity = totalPopulation > 0 ? weightedDensitySum / totalPopulation : 0;

        // Density effects on nation stats
        // Density measured as people per square mile
        // Low density (< 10): minimal effect
        // Medium density (10-100): slight increase in crime/disease
        // High density (100+): significant increase in crime/disease, decrease in happiness

        let crimeIncrease = 0;
        let diseaseIncrease = 0;
        let happinessDecrease = 0;

        if (weightedDensity > 500) {
            crimeIncrease = 15;
            diseaseIncrease = 10;
            happinessDecrease = 10;
        } else if (weightedDensity > 200) {
            crimeIncrease = 10;
            diseaseIncrease = 6;
            happinessDecrease = 6;
        } else if (weightedDensity > 100) {
            crimeIncrease = 6;
            diseaseIncrease = 4;
            happinessDecrease = 4;
        } else if (weightedDensity > 50) {
            crimeIncrease = 3;
            diseaseIncrease = 2;
            happinessDecrease = 2;
        } else if (weightedDensity > 10) {
            crimeIncrease = 1;
            diseaseIncrease = 1;
            happinessDecrease = 1;
        }

        // Apply to nation stats
        const ns = window.Nation.nationStats || {};
        if (crimeIncrease > 0 && ns.crime !== undefined) {
            ns.crime = Math.min(80, (ns.crime || 15) + crimeIncrease);
        }
        if (diseaseIncrease > 0 && ns.disease !== undefined) {
            ns.disease = Math.min(50, (ns.disease || 10) + diseaseIncrease);
        }
        if (happinessDecrease > 0) {
            window.Nation.happiness = Math.max(0, Math.min(100, (window.Nation.happiness || 50) - happinessDecrease));
            if (ns.happiness !== undefined) ns.happiness = window.Nation.happiness;
        }

        // Store density data on nation for other systems
        window.Nation.populationDensity = overallDensity;
        window.Nation.totalLandMiles = totalLandMiles;
        window.Nation.totalPopulation = totalPopulation;
    }

    /**
     * Update happiness factors
     */
    updateHappinessFactors() {
        // Update happiness based on various factors
        let overallHappiness = 0;

        // Calculate weighted happiness across all factors
        const weights = {
            housing: 0.15,
            healthcare: 0.12,
            education: 0.10,
            employment: 0.18,
            safety: 0.15,
            environment: 0.08,
            governance: 0.10,
            economy: 0.12
        };

        Object.entries(weights).forEach(([factor, weight]) => {
            overallHappiness += this.happinessFactors[factor] * weight;
        });

        // Apply edict happiness modifier (from various edicts)
        if (window.Nation?.edictEffects?.happinessModifier) {
            overallHappiness += window.Nation.edictEffects.happinessModifier;
        }

        // Update territorial happiness
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            // Base happiness from overall factors
            let territoryHappiness = overallHappiness;

            // Modify based on territory-specific conditions
            territoryHappiness *= this.getTerritoryHappinessModifier(territoryId);

            // Population density affects happiness
            const densityPenalty = Math.max(0, (data.density - 1.0) * 10); // Penalty for overcrowding
            territoryHappiness -= densityPenalty;

            // Smooth happiness changes
            data.happiness = data.happiness * 0.95 + territoryHappiness * 0.05;
            data.happiness = Math.max(0, Math.min(100, data.happiness));
        }

        // Apply density effects to nation stats
        this.applyDensityEffectsToNation();

        // Update growth modifiers based on happiness
        const avgHappiness = this.territorialDistribution.size > 0
            ? Array.from(this.territorialDistribution.values())
                .reduce((sum, data) => sum + data.happiness, 0) / this.territorialDistribution.size
            : 50;

        this.growthModifiers.happiness = 0.5 + (avgHappiness / 100);
    }

    /**
     * Get territory-specific happiness modifier
     */
    getTerritoryHappinessModifier(territoryId) {
        // This would check territory-specific conditions
        // For now, return a base modifier with some variation
        return 0.9 + Math.random() * 0.2;
    }

    /**
     * Record population history
     */
    recordPopulationHistory() {
        // Record total population
        this.history.population.push(this.getTotalPopulation());
        if (this.history.population.length > this.history.maxHistoryLength) {
            this.history.population.shift();
        }
        
        // Record average happiness
        const avgHappiness = Array.from(this.territorialDistribution.values())
            .reduce((sum, data) => sum + data.happiness, 0) / 
            Math.max(1, this.territorialDistribution.size);
        
        this.history.happiness.push(avgHappiness);
        if (this.history.happiness.length > this.history.maxHistoryLength) {
            this.history.happiness.shift();
        }
        
        // Record growth
        const totalGrowth = Array.from(this.territorialDistribution.values())
            .reduce((sum, data) => sum + data.growth, 0);
        
        this.history.growth.push(totalGrowth);
        if (this.history.growth.length > this.history.maxHistoryLength) {
            this.history.growth.shift();
        }
    }

    /**
     * Handle monthly population updates
     */
    handleMonthPassed(data) {
        // Monthly demographic analysis
        this.performMonthlyAnalysis();
        
        // Update long-term trends
        this.updateLongTermTrends();
    }

    /**
     * Handle yearly population updates
     */
    handleYearPassed(data) {
        // Annual population census
        this.performAnnualCensus();
        
        // Update birth and death rates based on conditions
        this.updateVitalRates();
        
        // Generate annual population report
        this.generateAnnualReport();
    }

    /**
     * Perform monthly demographic analysis
     */
    performMonthlyAnalysis() {
        const monthlyGrowth = this.history.growth.slice(-30).reduce((sum, val) => sum + val, 0);
        const avgHappiness = this.history.happiness.slice(-30).reduce((sum, val) => sum + val, 0) / 30;
        
        EventBus.emit('monthly_population_report', {
            growth: monthlyGrowth,
            avgHappiness: avgHappiness,
            demographics: { ...this.vitalRates }
        });
    }

    /**
     * Update long-term demographic trends
     */
    updateLongTermTrends() {
        // Analyze trends and adjust base rates
        if (this.history.population.length >= 30) {
            const recentGrowth = this.history.population.slice(-30);
            const trend = (recentGrowth[29] - recentGrowth[0]) / recentGrowth[0] / 30;
            
            // Adjust birth/death rates based on trends
            if (trend > 0.001) { // Strong growth
                this.vitalRates.baseBirthRate *= 1.001;
            } else if (trend < -0.001) { // Decline
                this.vitalRates.baseDeathRate *= 0.999;
            }
        }
    }

    /**
     * Perform annual population census
     */
    performAnnualCensus() {
        const census = {
            totalPopulation: Math.floor(this.getTotalPopulation()),
            demographics: { ...this.vitalRates },
            territorialDistribution: Object.fromEntries(
                Array.from(this.territorialDistribution.entries()).map(([id, data]) => [
                    id, 
                    { 
                        population: Math.floor(data.population), 
                        happiness: Math.round(data.happiness),
                        density: Math.round(data.density * 100) / 100
                    }
                ])
            ),
            yearlyGrowth: this.history.growth.reduce((sum, val) => sum + val, 0),
            averageHappiness: this.history.happiness.reduce((sum, val) => sum + val, 0) / this.history.happiness.length
        };
        
        EventBus.emit('annual_population_census', { census });
        return census;
    }

    /**
     * Update vital rates (birth/death) based on conditions
     */

    /**
     * Generate annual population report
     */

    /**
     * Handle territory added
     */
    handleTerritoryAdded(data) {
        const territory = data.territory;
        const landMiles = territory.landMiles || territory.land || 1000; // Default 1000 sq miles
        this.territorialDistribution.set(territory.id, {
            population: territory.population || 0,
            capacity: this.calculateTerritoryCapacity(territory.id),
            landMiles: landMiles,
            growth: 0,
            happiness: 50,
            density: 0
        });
        
        this.syncTerritorialDistributionWithCitizens();
        this.applyDensityEffectsToNation();
    }

    /**
     * Handle territory removed
     */
    handleTerritoryRemoved(data) {
        const territoryData = this.territorialDistribution.get(data.territoryId);
        if (territoryData) {
            this.territorialDistribution.delete(data.territoryId);
        }
    }

    /**
     * Handle policy changes that affect population
     */
    handlePolicyChanged(data) {
        switch (data.policy) {
            case 'healthcare':
                this.happinessFactors.healthcare += data.newValue - data.oldValue;
                break;
            case 'education':
                this.happinessFactors.education += data.newValue - data.oldValue;
                break;
            case 'social_spending':
                this.growthModifiers.policies = 1 + (data.newValue / 100);
                break;
        }
    }

    /**
     * Handle infrastructure improvements
     */
    handleInfrastructureBuilt(data) {
        // Infrastructure improvements affect happiness
        const territory = data.territory;
        const territoryData = this.territorialDistribution.get(territory.id);
        
        if (territoryData) {
            territoryData.happiness += 2; // Small happiness boost
            territoryData.capacity += 5000; // Increase capacity
        }
    }

    /**
     * Handle daily population updates
     */
    handleDayPassed(data) {
        const currentDay = data.currentDay || this.getCurrentDay();
        
        // Update population growth
        this.updatePopulationGrowth();
        
        // Update happiness factors
        this.updateHappinessFactors();
        
        // Process migration between territories
        this.processTerritorialMigration();
        
        // Age all citizens by one day
        this.processDailyAging();
        
        // Process births and deaths
        this.processBirthsAndDeaths();
        
        // Process relationships (dating, marriage, divorce, newborns)
        this.processRelationships(currentDay);
        
        // Process migration
        this.processMigration();
        
        // Update employment and education
        this.updateEmploymentAndEducation();
        
        // Assign jobs and calculate incomes via CitizenJobSystem
        if (CitizenJobSystem && window.Nation) {
            const citizensArray = Array.from(this.citizens.values());
            const nationStats = window.Nation.nationStats || {};
            const nationTech = window.Nation.tech || 0;
            
            CitizenJobSystem.assignJobsToCitizens(
                citizensArray,
                window.Nation,
                nationStats
            );
            CitizenJobSystem.applyIncomes(
                citizensArray,
                nationStats,
                nationTech,
                window.Nation
            );
        }
        
        // Check for population situations (every 3 days)
        this.checkPopulationSituations(currentDay);
        
        // Process active situation effects
        this.processActiveSituationEffects(currentDay);
        
        // Check for nation situations (every 5 days)
        this.checkNationSituations(currentDay);
        
        // Process active nation situation effects
        this.processActiveNationSituationEffects(currentDay);
        
        // Check for military situations (every 4 days)
        this.checkMilitarySituations(currentDay);
        
        // Process active military situation effects
        this.processActiveMilitarySituationEffects(currentDay);
        
        // Update demographics and statistics
        this.updateDemographics();
        
        // Record daily history
        this.recordDailyHistory();
        this.recordPopulationHistory();
        
        // Update nation population
        this.updateNationPopulation();
        
        // Sync territorial distribution with citizens (final daily sync)
        this.syncTerritorialDistributionWithCitizens();
    }

    /**
     * Process daily aging of all citizens
     */
    processDailyAging() {
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        const currentDay = this.getCurrentDay();
        const citizensToReassign = [];
        const citizensToRemove = [];
        
        for (const [citizenId, citizen] of this.citizens.entries()) {
            const ageDays = (now - citizen.birthTime) / msPerDay;
            
            // Check if citizen has reached max age (death)
            if (ageDays >= this.REAL_TIME_MAX_AGE_DAYS) {
                citizensToRemove.push(citizen);
                continue;
            }
            
            // Determine correct age group based on real-time age
            const correctGroup = this.getAgeGroupForRealTimeAge(ageDays);
            if (correctGroup && correctGroup !== citizen.ageGroup) {
                citizensToReassign.push({ citizen, newAgeGroup: correctGroup });
            }
        }
        
        // Process deaths - schedule replacement birth after 2-turn buffer
        citizensToRemove.forEach(citizen => {
            this.ageGroups[citizen.ageGroup].count--;
            this.citizens.delete(citizen.id);
            this.recordDeath('old_age');
            
            // Schedule replacement birth after 2-turn buffer
            const replacementDay = currentDay + 2;
            const currentPending = this.pendingBirths.get(replacementDay) || 0;
            this.pendingBirths.set(replacementDay, currentPending + 1);
        });
        
        // Reassign citizens to correct age groups
        citizensToReassign.forEach(({ citizen, newAgeGroup }) => {
            // Remove from old group
            this.ageGroups[citizen.ageGroup].count--;
            
            // Grant literacy on demographic transition (before updating group)
            this.grantLiteracyOnAgeTransition(citizen, newAgeGroup);
            
            // Add to new group
            citizen.ageGroup = newAgeGroup;
            this.ageGroups[newAgeGroup].count++;
            
            // Update employment status if entering/leaving working age
            this.updateCitizenEmploymentStatus(citizen);
            
            // Track when a citizen reaches senior age
            if (newAgeGroup === 'senior') {
                this.recordReachedSenior();
            }
        });
        
        // Process pending replacement births (2-turn buffer)
        if (this.pendingBirths.has(currentDay)) {
            const birthsToAdd = this.pendingBirths.get(currentDay);
            this.pendingBirths.delete(currentDay);
            for (let i = 0; i < birthsToAdd; i++) {
                this.createNewCitizen();
            }
        }
    }

    /**
     * Get appropriate age group for a given real-time age in days
     */
    getAgeGroupForRealTimeAge(ageDays) {
        for (const [groupName, groupData] of Object.entries(this.ageGroupConfig)) {
            if (ageDays >= groupData.minDays && ageDays < groupData.maxDays) {
                return groupName;
            }
        }
        return null; // Age exceeds maximum (death)
    }

    /**
     * Update citizen employment status when changing age groups
     */
    updateCitizenEmploymentStatus(citizen) {
        const workingAges = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        const studentAges = ['child'];
        const retiredAges = ['senior', 'elderly'];
        
        if (workingAges.includes(citizen.ageGroup) && citizen.employmentStatus === 'not_applicable') {
            // Entering workforce
            citizen.employmentStatus = Math.random() < 0.75 ? 'employed' : 'unemployed';
        } else if (retiredAges.includes(citizen.ageGroup)) {
            // Retiring
            citizen.employmentStatus = 'retired';
        } else if (studentAges.includes(citizen.ageGroup)) {
            // School age
            citizen.employmentStatus = 'student';
        }
    }

    /**
     * Process daily births and deaths based on nation conditions
     * Natural growth can be positive (births) or negative (deaths)
     */
    processBirthsAndDeaths() {
        if (!window.Nation) return;
        
        const totalPopulation = this.getTotalPopulation();
        if (totalPopulation === 0) return;
        
        const ns = window.Nation.nationStats || {};
        const happiness = window.Nation.happiness || 50;
        const disease = ns.disease || 10;
        const pollution = ns.pollution || 0;
        const environment = ns.environment !== undefined ? ns.environment : 50;
        
        // Base daily rates
        const baseDailyBirthRate = this.vitalRates.baseBirthRate / 365;
        const baseDailyDeathRate = this.vitalRates.baseDeathRate / 365;
        
        // Shared condition factors
        const happinessFactor = 0.5 + (happiness / 100);
        const diseaseFactor = Math.max(0.1, 1 - (disease / 100));
        const environmentFactor = 0.5 + (environment / 100);
        const pollutionFactor = Math.max(0.1, 1 - (pollution / 100));
        
        // Calculate daily births (only if conditions support growth)
        const dailyBirthRate = baseDailyBirthRate * happinessFactor * diseaseFactor * environmentFactor * pollutionFactor;
        const expectedBirths = totalPopulation * dailyBirthRate;
        const actualBirths = Math.floor(expectedBirths + Math.random());
        
        for (let i = 0; i < actualBirths; i++) {
            this.createNewCitizen();
        }
        
        // Calculate daily deaths (always applies, higher when conditions are poor)
        const deathHappinessFactor = 1.5 - (happiness / 100); // 0.5 to 1.5 (lower happiness = more deaths)
        const deathDiseaseFactor = 1 + (disease / 100); // Higher disease = more deaths
        const deathPollutionFactor = 1 + (pollution / 100); // Higher pollution = more deaths
        const dailyDeathRate = baseDailyDeathRate * deathHappinessFactor * deathDiseaseFactor * deathPollutionFactor;
        const expectedDeaths = totalPopulation * dailyDeathRate;
        const actualDeaths = Math.floor(expectedDeaths + Math.random());
        
        // Process natural deaths (not old-age — those are handled by processDailyAging)
        for (let i = 0; i < actualDeaths; i++) {
            this.processNaturalDeath();
        }
    }

    /**
     * Process a natural death from a random eligible age group
     */
    processNaturalDeath() {
        const totalPopulation = this.getTotalPopulation();
        if (totalPopulation === 0) return;
        
        // Death probabilities skewed toward older groups
        const deathProbabilities = {
            newborn: 0.01,
            infant: 0.005,
            toddler: 0.003,
            child: 0.001,
            teen: 0.002,
            youngAdult: 0.004,
            adult: 0.008,
            middleAged: 0.015,
            older: 0.04,
            senior: 0.12,
            elderly: 0.30
        };
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [ageGroup, probability] of Object.entries(deathProbabilities)) {
            cumulative += probability;
            if (rand < cumulative && this.ageGroups[ageGroup]?.count > 0) {
                const groupCitizens = Array.from(this.citizens.values())
                    .filter(citizen => citizen.ageGroup === ageGroup);
                
                if (groupCitizens.length > 0) {
                    const citizen = groupCitizens[Math.floor(Math.random() * groupCitizens.length)];
                    this.citizens.delete(citizen.id);
                    if (this.ageGroups[ageGroup].count > 0) {
                        this.ageGroups[ageGroup].count--;
                    }
                    this.recordDeath('natural');
                    this.syncTerritorialDistributionWithCitizens();
                }
                break;
            }
        }
    }

    /**
     * ════════════════════════════════════════════════════════════════════════════════════════════
     * RELATIONSHIP & FAMILY SYSTEM
     * ════════════════════════════════════════════════════════════════════════════════════════════
     * 
     * Relationship Types:
     *   Straight Monogamy: Male + Female, only 2
     *   Gay Monogamy: Same sex (M/M or F/F), only 2
     *   Straight Polygamy: 3-4 people, must have both male and female
     *   Gay Polygamy: 3-4 people, all same gender
     * 
     * Relationship Stages:
     *   Teens (14-45): 50% chance/turn to start dating
     *   Young Adults (45-75): 50% chance/turn to marry or break up
     *   Married: Divorce instead of break up (much lower rate)
     * 
     * ═══════════════════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Process all relationship mechanics for the current day.
     * Called daily in handleDayPassed after births/deaths.
     */
    processRelationships(currentDay) {
        if (!window.Nation) return;

        const citizens = Array.from(this.citizens.values());
        const nation = window.Nation;
        const ns = nation.nationStats || {};

        // ── Step 1: Resolve ethnicity for all citizens ──
        this.resolveCitizenEthnicity(citizens, nation);

        // ── Step 2: Relationship spawning for Teens ──
        this.spawnTeenRelationships(citizens, nation);

        // ── Step 3: Relationship changes for Young Adults ──
        this.processYoungAdultRelationships(citizens, nation, ns);

        // ── Step 4: Marriage/divorce for all married citizens ──
        this.processMarriedCouples(citizens, nation, ns, currentDay);

        // ── Step 5: Generate newborns from straight married couples ──
        this.generateNewbornsFromMarriages(citizens, nation, ns);

        // ── Step 6: Assign relationship roles (Wife, Husband, Mother, Father, etc.) ──
        this.assignRelationshipRoles(citizens);

        // ── Step 7: Sync relationship changes ──
        this.syncTerritorialDistributionWithCitizens();
    }

    /**
     * Resolve ethnicity for citizens based on nation name.
     * Default: nation name + "ian" (e.g., "Test" → "Testian")
     * Override: nation.populationName if set
     * Immigrants: randomly pull a foreign nation's name
     */
    resolveCitizenEthnicity(citizens, nation) {
        const populationName = nation.getPopulationName ? nation.getPopulationName() : (nation.name + 'ian');
        const nations = window.Nations || {};

        for (const citizen of citizens) {
            // If ethnicity is null, resolve from nation
            if (!citizen.ethnicity) {
                // Check if citizen is an immigrant (has a different origin nation)
                if (citizen.isImmigrant && Object.keys(nations).length > 1) {
                    // Randomly pick a foreign nation for ethnicity
                    const foreignNations = Object.values(nations).filter(n => n.name !== nation.name);
                    if (foreignNations.length > 0) {
                        const foreign = foreignNations[Math.floor(Math.random() * foreignNations.length)];
                        citizen.ethnicity = foreign.getPopulationName ? foreign.getPopulationName() : (foreign.name + 'ian');
                    } else {
                        citizen.ethnicity = populationName;
                    }
                } else {
                    citizen.ethnicity = populationName;
                }
            }
        }
    }

    /**
     * Spawn relationships for Teens (ageGroup: teen).
     * 50% chance per turn to start dating another eligible citizen.
     */
    spawnTeenRelationships(citizens, nation) {
        const teens = citizens.filter(c => c.ageGroup === 'teen' && c.isAlive && c.relationshipStatus === 'single');
        const allEligible = citizens.filter(c => c.isAlive && c.ageGroup === 'teen' && c.relationshipStatus === 'single');

        for (const teen of teens) {
            // 50% chance to start a relationship
            if (Math.random() > 0.5) continue;

            // Find another eligible teen to date
            const potentialPartners = allEligible.filter(p => p.id !== teen.id);
            if (potentialPartners.length === 0) continue;

            const partner = potentialPartners[Math.floor(Math.random() * potentialPartners.length)];

            // Determine relationship type based on genders
            const relationshipType = this.determineRelationshipType(teen.gender, partner.gender, 2);

            // Create the relationship
            this.createRelationship(teen, partner, 'dating', relationshipType, nation);
        }
    }

    /**
     * Process relationship changes for Young Adults (ageGroup: youngAdult).
     * 50% chance per turn to marry or break up with current partner.
     */
    processYoungAdultRelationships(citizens, nation, nationStats) {
        const youngAdults = citizens.filter(c => c.ageGroup === 'youngAdult' && c.isAlive && c.relationshipStatus === 'dating');

        for (const ya of youngAdults) {
            // 50% chance for a relationship change
            if (Math.random() > 0.5) continue;

            // Find their current partner(s)
            const partnerIds = [...ya.partnerIds];
            if (partnerIds.length === 0) continue;

            for (const partnerId of partnerIds) {
                const partner = citizens.find(c => c.id === partnerId);
                if (!partner || !partner.isAlive) continue;

                // Determine if this is marry or break up
                const isMarried = ya.relationshipStatus === 'married';
                const isStraightCouple = ya.gender !== partner.gender;

                // Calculate probabilities
                const marryProb = this.calculateMarryProbability(ya, partner, nationStats, isStraightCouple);
                const breakupProb = this.calculateBreakupProbability(ya, partner, nationStats, isStraightCouple);

                // If already married, breakup becomes divorce (much lower rate)
                if (isMarried) {
                    const divorceProb = this.calculateDivorceProbability(ya, partner, nationStats);
                    if (Math.random() < divorceProb) {
                        this.divorceCouple(ya, partner);
                    }
                    continue;
                }

                // Roll for marry vs break up vs stay dating
                const roll = Math.random();
                if (roll < marryProb) {
                    this.marryCouple(ya, partner, nation);
                } else if (roll < marryProb + breakupProb) {
                    this.breakUpCouple(ya, partner);
                }
                // Otherwise: stay dating
            }
        }
    }

    /**
     * Process married couples - check for divorce.
     * Already handled in processYoungAdultRelationships for young adults,
     * but older adults also need divorce checks.
     */
    processMarriedCouples(citizens, nation, nationStats, currentDay) {
        const marriedCitizens = citizens.filter(c => c.isAlive && c.relationshipStatus === 'married');

        for (const citizen of marriedCitizens) {
            // Only check divorce for non-youngAdult age groups (young adults handled above)
            if (citizen.ageGroup === 'youngAdult') continue;

            const spouseIds = [...citizen.spouseIds];
            for (const spouseId of spouseIds) {
                const spouse = citizens.find(c => c.id === spouseId);
                if (!spouse || !spouse.isAlive) continue;

                const divorceProb = this.calculateDivorceProbability(citizen, spouse, nationStats);
                if (Math.random() < divorceProb) {
                    this.divorceCouple(citizen, spouse);
                }
            }
        }
    }

    /**
     * Calculate probability of marrying (0-1).
     * Weighs: Age (older more likely), Health (unhealthy less likely),
     * Wealth (more money more likely), Education/Literacy (higher more likely),
     * Job (unemployed less likely), Religion (matching = very high).
     * None of these negatively weigh breakup.
     */
    calculateMarryProbability(citizen, partner, nationStats, isStraightCouple) {
        let prob = 0.1; // Base 10%

        // Age factor: older people more inclined to marry
        const ageFactor = (citizen.age + partner.age) / 2;
        prob += ageFactor * 0.002; // +0.2% per year of average age

        // Health factor: unhealthy less likely to marry
        const avgHealth = (citizen.health + partner.health) / 2;
        prob += (avgHealth - 50) * 0.001; // ±0.1% per health point from 50

        // Wealth/Social Class factor: more money = higher marry chance
        const avgWealth = (citizen.wealth + partner.wealth) / 2;
        prob += Math.min(avgWealth / 10000, 0.15); // Up to +15% for wealthy

        // Education/Literacy factor: higher score more likely to marry
        const avgLiteracy = (citizen.literacyScore || 0 + partner.literacyScore || 0) / 2;
        prob += avgLiteracy * 0.002; // +0.2% per literacy point

        // Job/Employment factor: unemployed less likely to marry
        const bothEmployed = citizen.isEmployed && partner.isEmployed;
        if (!bothEmployed) {
            prob *= 0.7; // Reduce by 30% if not both employed
        }

        // Religion factor: matching = VERY high chance
        if (citizen.religion === partner.religion && citizen.religion !== 'none') {
            prob *= 3.0; // Triple the chance if religions match
        }

        // Straight couples get a slight bonus for traditional marriage
        if (isStraightCouple) {
            prob *= 1.2;
        }

        return Math.min(0.95, Math.max(0, prob));
    }

    /**
     * Calculate probability of breaking up (0-1).
     * Weighs: Health (unhealthy more breakup), Wealth (money doesn't weigh breakup more),
     * Education (lower doesn't weigh breakup more), Job (unemployed more breakup),
     * Religion (not matching doesn't weigh breakup more).
     * Only negative factors apply; positive ones don't reduce breakup chance.
     */
    calculateBreakupProbability(citizen, partner, nationStats, isStraightCouple) {
        let prob = 0.05; // Base 5%

        // Health factor: unhealthy more breakup
        const avgHealth = (citizen.health + partner.health) / 2;
        if (avgHealth < 50) {
            prob += (50 - avgHealth) * 0.002; // +0.2% per health point below 50
        }
        // Health above 50 doesn't reduce breakup chance

        // Wealth factor: money does NOT weigh breakup more
        // (No negative wealth effect on breakup)

        // Education factor: lower doesn't weigh breakup more
        // (No negative education effect on breakup)

        // Job factor: unemployed more breakup
        if (!citizen.isEmployed || !partner.isEmployed) {
            prob += 0.1; // +10% if either is unemployed
        }
        // Having a job doesn't reduce breakup chance

        // Religion factor: not matching doesn't weigh breakup more
        // (No negative religion effect on breakup)

        return Math.min(0.9, Math.max(0, prob));
    }

    /**
     * Calculate probability of divorce (0-1). Much lower than breakup.
     * Same weighs as breakup but all factors are dampened.
     */
    calculateDivorceProbability(citizen, partner, nationStats) {
        const breakupProb = this.calculateBreakupProbability(citizen, partner, nationStats, true);
        // Divorce is much harder than breakup - dampen by 80%
        return breakupProb * 0.2;
    }

    /**
     * Create a dating relationship between two citizens.
     */
    createRelationship(citizenA, citizenB, type, relationshipType, nation) {
        const now = Date.now();

        // Update citizen A
        citizenA.relationshipStatus = type === 'married' ? 'married' : 'dating';
        if (!citizenA.partnerIds.includes(citizenB.id)) {
            citizenA.partnerIds.push(citizenB.id);
        }
        citizenA.relationships.set(citizenB.id, {
            type: type,
            role: relationshipType,
            started: now
        });

        // Update citizen B
        citizenB.relationshipStatus = type === 'married' ? 'married' : 'dating';
        if (!citizenB.partnerIds.includes(citizenA.id)) {
            citizenB.partnerIds.push(citizenA.id);
        }
        citizenB.relationships.set(citizenA.id, {
            type: type,
            role: relationshipType,
            started: now
        });

        // Add life events
        citizenA.lifeEvents.push({
            id: Date.now(),
            timestamp: now,
            age: citizenA.age,
            description: type === 'married' ? `Married ${partnerName(citizenB)}` : `Started dating ${partnerName(citizenB)}`,
            type: type === 'married' ? 'marriage' : 'relationship'
        });
        citizenB.lifeEvents.push({
            id: Date.now(),
            timestamp: now,
            age: citizenB.age,
            description: type === 'married' ? `Married ${partnerName(citizenA)}` : `Started dating ${partnerName(citizenA)}`,
            type: type === 'married' ? 'marriage' : 'relationship'
        });

        // Keep only last 20 events
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Marry two dating citizens.
     */
    marryCouple(citizenA, citizenB, nation) {
        const now = Date.now();

        // Update both citizens
        citizenA.relationshipStatus = 'married';
        citizenB.relationshipStatus = 'married';

        // Move from partnerIds to spouseIds
        citizenA.spouseIds.push(citizenB.id);
        citizenB.spouseIds.push(citizenA.id);

        // Remove from partnerIds
        citizenA.partnerIds = citizenA.partnerIds.filter(id => id !== citizenB.id);
        citizenB.partnerIds = citizenB.partnerIds.filter(id => id !== citizenA.id);

        // Update relationship map
        citizenA.relationships.set(citizenB.id, {
            type: 'married',
            role: this.getSpouseRole(citizenA.gender, citizenB.gender),
            started: now
        });
        citizenB.relationships.set(citizenA.id, {
            type: 'married',
            role: this.getSpouseRole(citizenB.gender, citizenA.gender),
            started: now
        });

        // Life events
        const partnerNameB = citizenB.name;
        const partnerNameA = citizenA.name;
        citizenA.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenA.age,
            description: `Married ${partnerNameB}`,
            type: 'marriage'
        });
        citizenB.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenB.age,
            description: `Married ${partnerNameA}`,
            type: 'marriage'
        });
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Break up two dating citizens.
     */
    breakUpCouple(citizenA, citizenB) {
        const now = Date.now();

        citizenA.relationshipStatus = 'single';
        citizenB.relationshipStatus = 'single';

        citizenA.partnerIds = citizenA.partnerIds.filter(id => id !== citizenB.id);
        citizenB.partnerIds = citizenB.partnerIds.filter(id => id !== citizenA.id);

        citizenA.relationships.delete(citizenB.id);
        citizenB.relationships.delete(citizenA.id);

        citizenA.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenA.age,
            description: `Broke up with ${citizenB.name}`,
            type: 'breakup'
        });
        citizenB.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenB.age,
            description: `Broke up with ${citizenA.name}`,
            type: 'breakup'
        });
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Divorce two married citizens.
     */
    divorceCouple(citizenA, citizenB) {
        const now = Date.now();

        citizenA.relationshipStatus = 'divorced';
        citizenB.relationshipStatus = 'divorced';

        citizenA.spouseIds = citizenA.spouseIds.filter(id => id !== citizenB.id);
        citizenB.spouseIds = citizenB.spouseIds.filter(id => id !== citizenA.id);

        citizenA.relationships.delete(citizenB.id);
        citizenB.relationships.delete(citizenA.id);

        citizenA.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenA.age,
            description: `Divorced from ${citizenB.name}`,
            type: 'divorce'
        });
        citizenB.lifeEvents.push({
            id: now,
            timestamp: now,
            age: citizenB.age,
            description: `Divorced from ${citizenA.name}`,
            type: 'divorce'
        });
        if (citizenA.lifeEvents.length > 20) citizenA.lifeEvents = citizenA.lifeEvents.slice(-20);
        if (citizenB.lifeEvents.length > 20) citizenB.lifeEvents = citizenB.lifeEvents.slice(-20);
    }

    /**
     * Get the spouse role based on genders.
     * Male + Female → Husband/Wife
     * Same sex → Partner/Spouse (generic)
     */
    getSpouseRole(genderA, genderB) {
        // genderA's role relative to genderB
        if (genderA === 'male' && genderB === 'female') return 'Husband';
        if (genderA === 'female' && genderB === 'male') return 'Wife';
        if (genderA === 'male' && genderB === 'male') return 'Husband';
        if (genderA === 'female' && genderB === 'female') return 'Wife';
        return 'Partner';
    }

    /**
     * Determine relationship type based on genders and number of people.
     */
    determineRelationshipType(genderA, genderB, count) {
        const hasMale = genderA === 'male' || genderB === 'male';
        const hasFemale = genderA === 'female' || genderB === 'female';
        const allSameGender = genderA === genderB;

        if (count === 2) {
            if (allSameGender) return 'Gay Monogamy';
            return 'Straight Monogamy';
        } else {
            // Polygamy (3-4 people)
            if (allSameGender) return 'Gay Polygamy';
            return 'Straight Polygamy';
        }
    }

    /**
     * Generate newborns from straight married couples.
     * Uses the nation's population growth rate to determine how many couples have children.
     */
    generateNewbornsFromMarriages(citizens, nation, nationStats) {
        if (!nation) return;

        // Find all straight married couples (male + female, both married to each other)
        const marriedCouples = [];
        const processedPairs = new Set();

        for (const citizen of citizens) {
            if (!citizen.isAlive || citizen.relationshipStatus !== 'married') continue;
            if (citizen.gender !== 'male' && citizen.gender !== 'female') continue;

            for (const spouseId of citizen.spouseIds) {
                const spouse = citizens.find(c => c.id === spouseId);
                if (!spouse || !spouse.isAlive || spouse.relationshipStatus !== 'married') continue;
                if (spouse.gender !== 'male' && spouse.gender !== 'female') continue;
                if (citizen.gender === spouse.gender) continue; // Same-sex couples don't produce newborns

                const pairKey = [citizen.id, spouse.id].sort().join('-');
                if (processedPairs.has(pairKey)) continue;
                processedPairs.add(pairKey);

                // Check reproductive age (15-45 for female, 15-60 for male)
                const female = citizen.gender === 'female' ? citizen : spouse;
                const male = citizen.gender === 'male' ? citizen : spouse;

                if (female.age < 15 || female.age > 45) continue;
                if (male.age < 15 || male.age > 60) continue;

                marriedCouples.push({ husband: male, wife: female });
            }
        }

        if (marriedCouples.length === 0) return;

        // Calculate birth rate from nation stats
        const ns = nationStats || {};
        const happiness = nation.happiness || 50;
        const disease = ns.disease || 10;
        const environment = ns.environment !== undefined ? ns.environment : 50;
        const pollution = ns.pollution || 0;

        const baseDailyBirthRate = this.vitalRates.baseBirthRate / 365;
        const happinessFactor = 0.5 + (happiness / 100);
        const diseaseFactor = Math.max(0.1, 1 - (disease / 100));
        const environmentFactor = 0.5 + (environment / 100);
        const pollutionFactor = Math.max(0.1, 1 - (pollution / 100));

        const dailyBirthRate = baseDailyBirthRate * happinessFactor * diseaseFactor * environmentFactor * pollutionFactor;

        // Each couple has a chance to have a child based on the rate
        for (const couple of marriedCouples) {
            if (Math.random() < dailyBirthRate) {
                this.createChildFromCouple(couple.husband, couple.wife, nation);
            }
        }
    }

    /**
     * Create a child from a married couple.
     */
    createChildFromCouple(father, mother, nation) {
        const isGifted = Math.random() < 0.05;
        const now = Date.now();

        // Determine child's gender
        const gender = Math.random() > 0.5 ? 'male' : 'female';

        // Determine child's ethnicity from parents (same nation)
        const populationName = nation.getPopulationName ? nation.getPopulationName() : (nation.name + 'ian');

        const child = {
            id: this.nextCitizenId++,
            birthTime: now,
            ageGroup: 'newborn',
            employmentStatus: 'not_applicable',
            educationLevel: 'none',
            literacyScore: 0,
            isGifted: isGifted,
            literacyProgress: 0,
            gender: gender,
            ethnicity: populationName,
            religion: mother.religion || father.religion || 'none',
            relationshipStatus: 'single',
            spouseIds: [],
            partnerIds: [],
            parentIds: [father.id, mother.id],
            childIds: [],
            relationships: new Map(),
            nationId: nation.id || nation.name,
            cityId: null,
            born: now
        };

        // Set child's name
        child.name = this.generateChildName(gender, populationName);

        // Add child to citizens
        this.citizens.set(child.id, child);
        this.ageGroups.newborn.count++;
        this.recordBirth();

        // Update parents' childIds
        father.childIds.push(child.id);
        mother.childIds.push(child.id);

        // Add parent relationships to child
        child.relationships.set(father.id, {
            type: 'family',
            role: father.gender === 'male' ? 'Father' : 'Parent',
            started: now
        });
        child.relationships.set(mother.id, {
            type: 'family',
            role: mother.gender === 'female' ? 'Mother' : 'Parent',
            started: now
        });

        // Add child relationships to parents
        father.relationships.set(child.id, {
            type: 'family',
            role: father.gender === 'male' ? 'Father' : 'Parent',
            started: now
        });
        mother.relationships.set(child.id, {
            type: 'family',
            role: mother.gender === 'female' ? 'Mother' : 'Parent',
            started: now
        });

        // Add sibling relationships between child and existing children of parents
        const existingSiblings = [...father.childIds, ...mother.childIds].filter(id => id !== child.id);
        for (const siblingId of existingSiblings) {
            const sibling = this.citizens.get(siblingId);
            if (!sibling || !sibling.isAlive) continue;

            const siblingRole = sibling.gender === 'male' ? 'Brother' : 'Sister';
            const childRole = child.gender === 'male' ? 'Brother' : 'Sister';

            child.relationships.set(siblingId, {
                type: 'family',
                role: siblingRole,
                started: now
            });
            sibling.relationships.set(child.id, {
                type: 'family',
                role: childRole,
                started: now
            });

            sibling.childIds = sibling.childIds || [];
            if (!sibling.childIds.includes(child.id)) {
                // Don't add child to sibling's childIds (that's wrong)
            }
        }

        // Life events for parents
        father.lifeEvents.push({
            id: now,
            timestamp: now,
            age: father.age,
            description: `Child born: ${child.name}`,
            type: 'birth'
        });
        mother.lifeEvents.push({
            id: now,
            timestamp: now,
            age: mother.age,
            description: `Child born: ${child.name}`,
            type: 'birth'
        });
        if (father.lifeEvents.length > 20) father.lifeEvents = father.lifeEvents.slice(-20);
        if (mother.lifeEvents.length > 20) mother.lifeEvents = mother.lifeEvents.slice(-20);

        return child;
    }

    /**
     * Generate a child name based on gender and ethnicity.
     */
    generateChildName(gender, populationName) {
        const maleNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas'];
        const femaleNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        const firstNames = gender === 'male' ? maleNames : femaleNames;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        return `${firstName} ${lastName}`;
    }

    /**
     * Assign relationship roles (Wife, Husband, Mother, Father, Son, Daughter, etc.)
     * to all citizens based on their current relationships.
     */
    assignRelationshipRoles(citizens) {
        // First, clear all family roles and re-assign based on current state
        // This ensures roles are always up-to-date

        for (const citizen of citizens) {
            if (!citizen.isAlive) continue;

            // Assign spouse roles
            for (const spouseId of citizen.spouseIds) {
                const spouse = citizens.find(c => c.id === spouseId);
                if (!spouse) continue;

                const role = this.getSpouseRole(citizen.gender, spouse.gender);
                const rel = citizen.relationships.get(spouseId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'married';
                } else {
                    citizen.relationships.set(spouseId, {
                        type: 'married',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign parent roles
            for (const childId of citizen.childIds) {
                const child = citizens.find(c => c.id === childId);
                if (!child) continue;

                const role = citizen.gender === 'male' ? 'Father' : 'Mother';
                const rel = citizen.relationships.get(childId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'family';
                } else {
                    citizen.relationships.set(childId, {
                        type: 'family',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign child roles
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (!parent) continue;

                const role = citizen.gender === 'male' ? 'Son' : 'Daughter';
                const rel = citizen.relationships.get(parentId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'family';
                } else {
                    citizen.relationships.set(parentId, {
                        type: 'family',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign sibling roles (shared parents)
            const allSiblings = new Set();
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (parent) {
                    for (const childId of parent.childIds) {
                        if (childId !== citizen.id) allSiblings.add(childId);
                    }
                }
            }
            for (const siblingId of allSiblings) {
                const sibling = citizens.find(c => c.id === siblingId);
                if (!sibling) continue;

                const role = citizen.gender === 'male' ? 'Brother' : 'Sister';
                const rel = citizen.relationships.get(siblingId);
                if (rel) {
                    rel.role = role;
                    rel.type = 'family';
                } else {
                    citizen.relationships.set(siblingId, {
                        type: 'family',
                        role: role,
                        started: Date.now()
                    });
                }
            }

            // Assign grandparent roles
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (!parent) continue;

                for (const grandparentId of parent.parentIds) {
                    const grandparent = citizens.find(c => c.id === grandparentId);
                    if (!grandparent) continue;

                    const role = grandparent.gender === 'male' ? 'Grandfather' : 'Grandmother';
                    const rel = citizen.relationships.get(grandparentId);
                    if (rel) {
                        rel.role = role;
                        rel.type = 'family';
                    } else {
                        citizen.relationships.set(grandparentId, {
                            type: 'family',
                            role: role,
                            started: Date.now()
                        });
                    }
                }
            }

            // Assign grandchild roles
            for (const childId of citizen.childIds) {
                const child = citizens.find(c => c.id === childId);
                if (!child) continue;

                for (const grandchildId of child.childIds) {
                    const grandchild = citizens.find(c => c.id === grandchildId);
                    if (!grandchild) continue;

                    const role = citizen.gender === 'male' ? 'Grandfather' : 'Grandmother';
                    const rel = citizen.relationships.get(grandchildId);
                    if (rel) {
                        rel.role = role;
                        rel.type = 'family';
                    } else {
                        citizen.relationships.set(grandchildId, {
                            type: 'family',
                            role: role,
                            started: Date.now()
                        });
                    }
                }
            }

            // Assign cousin roles (children of parent's siblings)
            for (const parentId of citizen.parentIds) {
                const parent = citizens.find(c => c.id === parentId);
                if (!parent) continue;

                for (const auntUncleId of parent.parentIds.flatMap(pid => {
                    const p = citizens.find(c => c.id === pid);
                    return p ? p.childIds.filter(id => id !== parentId) : [];
                })) {
                    const auntUncle = citizens.find(c => c.id === auntUncleId);
                    if (!auntUncle) continue;

                    for (const cousinId of auntUncle.childIds) {
                        const cousin = citizens.find(c => c.id === cousinId);
                        if (!cousin || cousin.id === citizen.id) continue;

                        const rel = citizen.relationships.get(cousinId);
                        if (rel) {
                            rel.role = 'Cousin';
                            rel.type = 'family';
                        } else {
                            citizen.relationships.set(cousinId, {
                                type: 'family',
                                role: 'Cousin',
                                started: Date.now()
                            });
                        }
                    }
                }
            }
        }
    }

    /**
     * Helper to get partner name for life events.
     */
    partnerName(citizen) {
        return citizen ? citizen.name : 'Unknown';
    }

    /**
     * ════════════════════════════════════════════════════════════════════════════════════════════
     * END RELATIONSHIP & FAMILY SYSTEM
     * ════════════════════════════════════════════════════════════════════════════════════════════
     */

    /**
     * Create a new citizen (birth) with real-time timestamp
     */
    createNewCitizen() {
        const isGifted = Math.random() < 0.05; // 5% gifted citizens
        const citizen = {
            id: this.nextCitizenId++,
            birthTime: Date.now(),
            ageGroup: 'newborn',
            employmentStatus: 'not_applicable',
            educationLevel: 'none',
            literacyScore: 0, // Newborns start with nothing
            isGifted: isGifted,
            literacyProgress: 0,
            relationshipStatus: 'single',
            spouseIds: [],
            partnerIds: [],
            parentIds: [],
            childIds: [],
            relationships: new Map(),
            ethnicity: null // Will be resolved from nation name
        };
        
        this.citizens.set(citizen.id, citizen);
        this.ageGroups.newborn.count++;
        this.recordBirth();
    }

    /**
     * Record death in statistics
     */
    recordDeath(cause) {
        // Record death statistics for analysis
        if (!this.deathStats) this.deathStats = {};
        this.deathStats[cause] = (this.deathStats[cause] || 0) + 1;
        this.populationStats.died++;
    }

    /**
     * Record a birth in statistics
     */
    recordBirth(count = 1) {
        this.populationStats.born += count;
    }

    /**
     * Record a combat death in statistics
     */
    recordCombatDeath(count = 1) {
        this.populationStats.diedInCombat += count;
        this.populationStats.died += count;
    }

    /**
     * Record a citizen reaching senior age group
     */
    recordReachedSenior(count = 1) {
        this.populationStats.reachedSenior += count;
    }

    /**
     * Enlist military population from demographic groups.
     * Depletion order: Young Adult → Adult → Middle Aged → Older → Teen
     * Returns breakdown with total, per-group counts, and citizen objects for later discharge.
     */
    enlistMilitaryPopulation(amount) {
        if (!amount || amount <= 0) return { total: 0, breakdown: {}, citizens: [] };
        
        const depletionOrder = ['youngAdult', 'adult', 'middleAged', 'older', 'teen'];
        let remaining = amount;
        let enlisted = 0;
        const breakdown = {};
        const enlistedCitizens = [];
        
        for (const group of depletionOrder) {
            if (remaining <= 0) break;
            
            const groupCitizens = Array.from(this.citizens.values())
                .filter(citizen => citizen.ageGroup === group);
            
            const take = Math.min(remaining, groupCitizens.length);
            
            for (let i = 0; i < take; i++) {
                const citizen = groupCitizens[i];
                this.citizens.delete(citizen.id);
                enlistedCitizens.push({ ...citizen }); // store copy with original ageGroup
            }
            
            this.ageGroups[group].count -= take;
            breakdown[group] = take;
            remaining -= take;
            enlisted += take;
        }
        
        this.populationStats.enlisted += enlisted;
        this.syncTerritorialDistributionWithCitizens();
        return { total: enlisted, breakdown, citizens: enlistedCitizens };
    }

    /**
     * Return enlisted military population to their original demographic groups.
     * Used when units are decommissioned (not combat-killed).
     * Citizens are restored with their original ageGroup (age frozen at enlistment).
     */
    dischargeMilitaryPopulation(source) {
        if (!source || !source.citizens || source.citizens.length === 0) return 0;
        
        const now = Date.now();
        const msPerDay = 24 * 60 * 60 * 1000;
        
        let restored = 0;
        for (const citizen of source.citizens) {
            // Recalculate age group based on current time vs birthTime (resume aging)
            const ageDays = (now - citizen.birthTime) / msPerDay;
            const correctGroup = this.getAgeGroupForRealTimeAge(ageDays);
            if (correctGroup) {
                citizen.ageGroup = correctGroup;
                citizen.birthTime = citizen.birthTime; // keep original birthTime for continued aging
            }
            
            this.citizens.set(citizen.id, citizen);
            this.ageGroups[citizen.ageGroup].count++;
            restored++;
        }
        
        this.syncTerritorialDistributionWithCitizens();
        return restored;
    }

    /**
     * Record combat deaths and schedule replacement births after 2-turn buffer.
     * Returns the number of deaths recorded.
     */
    recordMilitaryCombatDeaths(count, breakdown) {
        if (!count || count <= 0) return 0;
        
        this.recordCombatDeath(count);
        
        // Schedule replacement births after 2-turn buffer (handled by pendingBirths)
        const currentDay = this.getCurrentDay();
        const replacementDay = currentDay + 2;
        const currentPending = this.pendingBirths.get(replacementDay) || 0;
        this.pendingBirths.set(replacementDay, currentPending + count);
        
        return count;
    }

    /**
     * Process migration (slow, long-term effect)
     */
    processMigration() {
        if (!window.Nation) return;
        
        const totalPopulation = this.getTotalPopulation();
        const happiness = window.Nation.happiness || 50;
        // Read stats from nationStats where they actually live
        const ns       = window.Nation.nationStats || {};
        const literacy  = ns.literacy  || 0;
        const tech      = window.Nation.tech || 0;
        const pollution = ns.pollution  || 0;
        const disease   = ns.disease   || 10;
        const crime     = ns.crime     || 15;
        
        // Calculate migration attractiveness factors
        this.migrationFactors.happiness   = happiness / 50; // 0.5 to 2.0
        this.migrationFactors.literacy    = Math.max(0.1, literacy / 50);   // 0.1 to 2.0
        this.migrationFactors.technology  = Math.min(2.0, tech / 1000); // 0 to 2.0
        this.migrationFactors.pollution   = 2.0 - (pollution / 50);  // Higher pollution = less attractive
        this.migrationFactors.disease     = 2.0 - (disease / 25);     // Higher disease = less attractive
        this.migrationFactors.crime       = 2.0 - (crime / 40);         // Higher crime = less attractive
        
        // Calculate overall migration attractiveness
        const attractiveness = Object.values(this.migrationFactors)
            .reduce((sum, factor) => sum + factor, 0) / Object.keys(this.migrationFactors).length;
        
        // Calculate daily migration rate (very small for gradual effect)
        const baseDailyMigration = (this.vitalRates.migrationRate / 365) * totalPopulation;
        const migrationRate = baseDailyMigration * (attractiveness - 1.0) * this.migrationEffectiveness;
        
        // Apply migration policy modifiers
        const policyMultiplier = this.getMigrationPolicyMultiplier();
        
        // Apply edict immigration modifier
        let edictImmigrationMultiplier = 1.0;
        if (window.Nation?.edictEffects?.immigrationModifier) {
            edictImmigrationMultiplier += window.Nation.edictEffects.immigrationModifier;
        }
        
        const actualMigration = Math.floor(migrationRate * policyMultiplier * edictImmigrationMultiplier + Math.random());
        
        if (actualMigration > 0) {
            // Immigration
            for (let i = 0; i < actualMigration; i++) {
                this.createImmigrant();
            }
        } else if (actualMigration < 0) {
            // Emigration
            for (let i = 0; i < Math.abs(actualMigration); i++) {
                this.processEmigration();
            }
        }
    }

    /**
     * Get migration policy multiplier
     */
    getMigrationPolicyMultiplier() {
        switch (this.migrationPolicy) {
            case 'open': return 2.0;      // Double migration effects
            case 'restricted': return 0.5; // Half migration effects
            case 'balanced': return 1.0;   // Normal migration effects
            default: return 1.0;
        }
    }

    /**
     * Create immigrant citizen
     */
    createImmigrant(demographic = null) {
        const workingAges = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        let ageGroup;
        
        if (demographic && ['youngAdult', 'adult', 'senior'].includes(demographic)) {
            ageGroup = demographic;
        } else {
            ageGroup = workingAges[Math.floor(Math.random() * workingAges.length)];
        }
        
        const now = Date.now();
        const daysOld = this.getRandomDaysInGroup(ageGroup);
        const isGifted = Math.random() < 0.05;
        const citizen = {
            id: this.nextCitizenId++,
            birthTime: now - (daysOld * 24 * 60 * 60 * 1000),
            ageGroup: ageGroup,
            employmentStatus: Math.random() < 0.6 ? 'unemployed' : 'employed',
            educationLevel: Math.random() < 0.4 ? 'secondary' : 'primary',
            literacyScore: this._educationToLiteracyScore(Math.random() < 0.4 ? 'secondary' : 'primary'),
            isGifted: isGifted,
            literacyProgress: 0,
            isImmigrant: true,
            relationshipStatus: 'single',
            spouseIds: [],
            partnerIds: [],
            parentIds: [],
            childIds: [],
            relationships: new Map(),
            ethnicity: null // Will be resolved from a random foreign nation
        };
        
        // Set immigrant ethnicity from a random foreign nation
        const nations = window.Nations || {};
        const foreignNations = Object.values(nations).filter(n => n.name !== window.Nation.name);
        if (foreignNations.length > 0) {
            const foreign = foreignNations[Math.floor(Math.random() * foreignNations.length)];
            citizen.ethnicity = foreign.getPopulationName ? foreign.getPopulationName() : (foreign.name + 'ian');
        }
        
        // Cap immigrant literacy at nation literacy rate (or +20 for gifted)
        if (window.Nation?.nationStats) {
            const nationLiteracy = window.Nation.nationStats.literacy || 0;
            const cap = citizen.isGifted ? Math.min(100, nationLiteracy + 20) : nationLiteracy;
            citizen.literacyScore = Math.min(citizen.literacyScore, cap);
        }
        
        this.citizens.set(citizen.id, citizen);
        this.ageGroups[ageGroup].count++;
        this.recordBirth();
    }

    /**
     * Process emigration
     */
    processEmigration() {
        const totalCitizens = this.citizens.size;
        if (totalCitizens === 0) return;
        
        // Emigrants are often working age or young adults
        const emigrantCandidates = Array.from(this.citizens.values())
            .filter(citizen => ['youngAdult', 'adult'].includes(citizen.ageGroup));
        
        if (emigrantCandidates.length > 0) {
            const emigrant = emigrantCandidates[Math.floor(Math.random() * emigrantCandidates.length)];
            this.citizens.delete(emigrant.id);
            this.ageGroups[emigrant.ageGroup].count--;
            this.populationStats.emigrated++;
            this.recordDeath('emigration');
        }
    }

    /**
     * Sync territorial distribution population counts with the citizens Map.
     * Ensures the dual population model stays consistent.
     */
    syncTerritorialDistributionWithCitizens() {
        if (!window.Nation) return;

        const totalCitizens = this.citizens.size;
        const territories = Array.from(this.territorialDistribution.keys());
        if (territories.length === 0) return;

        // Distribute citizens evenly across territories
        const perTerritory = Math.floor(totalCitizens / territories.length);
        let remaining = totalCitizens % territories.length;

        for (const [i, territoryId] of territories.entries()) {
            const count = perTerritory + (i < remaining ? 1 : 0);
            const territoryData = this.territorialDistribution.get(territoryId);
            if (territoryData) {
                territoryData.population = count;
                territoryData.density = territoryData.capacity > 0 ? count / territoryData.capacity : 0;
            }
        }
    }

    /**
     * Get total population count (authoritative source: citizens Map)
     */
    getTotalPopulation() {
        return this.citizens.size;
    }

    /**
     * Get taxable population - only Teen through Older pay taxes
     * Newborns, Infants, Toddlers, Children, Seniors, Elderly do NOT pay taxes
     */
    getTaxablePopulation() {
        const taxableGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        return taxableGroups.reduce((sum, group) => sum + (this.ageGroups[group]?.count || 0), 0);
    }

    /**
     * Get military-eligible population - only Teen through Older can be drafted
     * Anything before Teen and anything after Older does NOT count for military
     */
    getMilitaryEligiblePopulation() {
        const militaryGroups = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];
        return militaryGroups.reduce((sum, group) => sum + (this.ageGroups[group]?.count || 0), 0);
    }

    /**
     * Get current military population count (drafted citizens)
     */
    getDraftedMilitaryPopulation() {
        if (!window.Nation) return 0;
        const military = window.Nation.militaryUnits || window.Nation.military || {};
        return (military.soldiers || 0) +
               (military.tanks || 0) +
               (military.aircraft || 0) +
               (military.ships || 0) +
               (military.spies || 0);
    }

    /**
     * Check if military population penalty is active
     * When drafted military exceeds threshold of eligible population, growth is penalized
     */
    checkMilitaryPenalty() {
        const eligible = this.getMilitaryEligiblePopulation();
        if (eligible === 0) return 1.0;
        
        const drafted = this.getDraftedMilitaryPopulation();
        const usageRatio = drafted / eligible;
        
        if (usageRatio > this.militaryPenaltyThreshold) {
            return this.militaryPenaltyGrowthMultiplier;
        }
        return 1.0;
    }

    /**
     * Calculate daily population growth rate based on nation conditions
     * Factors: disease, happiness, environment, pollution, taxable income, military penalty
     */
    calculatePopulationGrowthRate() {
        if (!window.Nation) {
            return (this.vitalRates.baseBirthRate - this.vitalRates.baseDeathRate) / 365;
        }
        
        const ns = window.Nation.nationStats || {};
        const happiness = window.Nation.happiness || 50;
        const disease = ns.disease || 10;
        const pollution = ns.pollution || 0;
        const environment = ns.environment !== undefined ? ns.environment : 50;
        
        // Base daily growth rate (birth - death)
        const baseDailyRate = (this.vitalRates.baseBirthRate - this.vitalRates.baseDeathRate) / 365;
        
        // Happiness factor: 0.5 (at 0 happiness) to 1.5 (at 100 happiness)
        const happinessFactor = 0.5 + (happiness / 100);
        
        // Disease factor: reduces growth as disease increases
        const diseaseFactor = Math.max(0.1, 1 - (disease / 100));
        
        // Environment factor: 0.5 (at 0) to 1.5 (at 100)
        const environmentFactor = 0.5 + (environment / 100);
        
        // Pollution factor: reduces growth as pollution increases
        const pollutionFactor = Math.max(0.1, 1 - (pollution / 100));
        
        // Taxable income factor: thriving economy = more growth
        const taxablePop = this.getTaxablePopulation();
        const totalPop = Math.max(1, this.getTotalPopulation());
        const taxableRatio = taxablePop / totalPop;
        const incomeFactor = 0.5 + taxableRatio; // 0.5 to 1.5 based on taxable share
        
        // Military penalty factor
        const militaryPenaltyFactor = this.checkMilitaryPenalty();
        
        // Combine all factors
        const dailyRate = baseDailyRate *
            happinessFactor *
            diseaseFactor *
            environmentFactor *
            pollutionFactor *
            incomeFactor *
            militaryPenaltyFactor;
        
        // Apply edict birth rate modifier (from Sexual Orientation edict)
        if (window.Nation?.edictEffects?.birthRateModifier) {
            const edictBirthMod = window.Nation.edictEffects.birthRateModifier;
            const edictDailyRate = dailyRate * edictBirthMod;
            // Only apply positive modifier, or apply negative as reduction
            return dailyRate + edictDailyRate;
        }
        
        return dailyRate;
    }

    /**
     * Check for population situations (every 3 days)
     */
    checkPopulationSituations(currentDay) {
        const daysSinceLastSituation = currentDay - this.populationSituations.lastSituationDay;
        
        if (daysSinceLastSituation >= this.populationSituations.situationInterval) {
            this.triggerPopulationSituation(currentDay);
            this.populationSituations.lastSituationDay = currentDay;
        }
    }

    /**
     * Trigger a new population situation
     */
    triggerPopulationSituation(currentDay) {
        // Don't trigger if there's already an active situation
        if (this.populationSituations.activeSituation) return;
        
        // Select random situation
        const availableSituations = this.situationDatabase.filter(situation => 
            !this.populationSituations.situationHistory.includes(situation.id) ||
            this.populationSituations.situationHistory.length >= this.situationDatabase.length * 0.8
        );
        
        if (availableSituations.length === 0) {
            // Reset history if we've used most situations
            this.populationSituations.situationHistory = [];
            return this.triggerPopulationSituation(currentDay);
        }
        
        const selectedSituation = availableSituations[Math.floor(Math.random() * availableSituations.length)];
        this.populationSituations.activeSituation = {
            ...selectedSituation,
            triggerDay: currentDay,
            expiryDay: currentDay + selectedSituation.duration
        };
        
        // Notify UI
        EventBus.emit('population_situation_triggered', {
            situation: this.populationSituations.activeSituation
        });
    }

    /**
     * Make choice for active population situation
     */
    makePopulationChoice(choiceIndex) {
        if (!this.populationSituations.activeSituation) return false;
        
        const situation = this.populationSituations.activeSituation;
        const choice = situation.choices[choiceIndex];
        
        if (!choice) return false;
        
        // Apply choice effects
        const effectId = `situation_${situation.id}_${Date.now()}`;
        const currentDay = this.getCurrentDay();
        
        this.populationSituations.activeEffects.set(effectId, {
            endDay: currentDay + situation.duration,
            effects: choice.effects,
            situationTitle: situation.title,
            choiceText: choice.text
        });
        
        // Apply immediate effects to nation
        this.applySituationEffects(choice.effects);
        
        // Record in history
        this.populationSituations.situationHistory.push(situation.id);
        if (this.populationSituations.situationHistory.length > 50) {
            this.populationSituations.situationHistory.shift(); // Keep only recent 50
        }
        
        // Clear active situation
        this.populationSituations.activeSituation = null;
        
        EventBus.emit('population_choice_made', {
            situation: situation,
            choice: choice,
            effectId: effectId
        });
        
        return true;
    }

    /**
     * Apply situation effects to nation
     */
    applySituationEffects(effects) {
        if (!window.Nation) return;
        
        Object.entries(effects).forEach(([effect, value]) => {
            switch (effect) {
                case 'happiness':
                    window.Nation.happiness = Math.max(0, Math.min(100, (window.Nation.happiness || 50) + value));
                    if (window.Nation.nationStats) window.Nation.nationStats.happiness = window.Nation.happiness;
                    break;
                case 'money':
                    if (value < 0) {
                        const currentMoney = window.Nation.money || 0;
                        const cost = currentMoney * (0.05 + Math.random() * 0.15);
                        window.Nation.money = Math.max(0, currentMoney - cost);
                    } else {
                        window.Nation.money = (window.Nation.money || 0) + value;
                    }
                    break;
                case 'crime':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.crime = Math.max(0, Math.min(80, (window.Nation.nationStats.crime || 15) + value));
                    }
                    break;
                case 'disease':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.disease = Math.max(0, Math.min(50, (window.Nation.nationStats.disease || 10) + value));
                    }
                    break;
                case 'pollution':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.pollution = Math.max(0, (window.Nation.nationStats.pollution || 0) + value);
                    }
                    break;
                case 'population':
                    if (value > 0) {
                        // Add population through immigration
                        for (let i = 0; i < value; i++) {
                            this.createImmigrant();
                        }
                    }
                    break;
                case 'birthRate':
                    this.vitalRates.baseBirthRate = Math.max(0.01, this.vitalRates.baseBirthRate + value);
                    break;
                case 'population_youngAdult':
                    // Add young adult immigrants (working-age demographic)
                    if (value > 0) {
                        for (let i = 0; i < value; i++) {
                            this.createImmigrant('youngAdult');
                        }
                    }
                    break;
                case 'population_working':
                    // Add working-age immigrants
                    if (value > 0) {
                        for (let i = 0; i < value; i++) {
                            this.createImmigrant('adult');
                        }
                    }
                    break;
                case 'population_senior':
                    // Add senior immigrants
                    if (value > 0) {
                        for (let i = 0; i < value; i++) {
                            this.createImmigrant('senior');
                        }
                    }
                    break;
            }
        });
        
        // Update nation calculations
        if (window.Nation.calculateNationStats) {
            window.Nation.calculateNationStats();
        }
    }

    /**
     * Process active situation effects (check for expiry)
     */
    processActiveSituationEffects(currentDay) {
        const expiredEffects = [];
        
        for (const [effectId, effectData] of this.populationSituations.activeEffects.entries()) {
            if (currentDay >= effectData.endDay) {
                expiredEffects.push(effectId);
            }
        }
        
        // Remove expired effects (note: we don't reverse the effects, they're permanent changes)
        expiredEffects.forEach(effectId => {
            const effectData = this.populationSituations.activeEffects.get(effectId);
            this.populationSituations.activeEffects.delete(effectId);
            
            EventBus.emit('population_effect_expired', {
                effectId: effectId,
                effectData: effectData
            });
        });
    }

    /**
     * Check for nation situations (every 5 days)
     */
    checkNationSituations(currentDay) {
        const daysSinceLastSituation = currentDay - this.nationSituations.lastSituationDay;
        
        if (daysSinceLastSituation >= this.nationSituations.situationInterval) {
            this.triggerNationSituation(currentDay);
            this.nationSituations.lastSituationDay = currentDay;
        }
    }

    /**
     * Trigger a new nation situation
     */
    triggerNationSituation(currentDay) {
        // Don't trigger if there's already an active situation
        if (this.nationSituations.activeSituation) return;
        
        // Select random situation
        const availableSituations = this.nationSituationDatabase.filter(situation => 
            !this.nationSituations.situationHistory.includes(situation.id) ||
            this.nationSituations.situationHistory.length >= this.nationSituationDatabase.length * 0.8
        );
        
        if (availableSituations.length === 0) {
            this.nationSituations.situationHistory = [];
            return this.triggerNationSituation(currentDay);
        }
        
        const selectedSituation = availableSituations[Math.floor(Math.random() * availableSituations.length)];
        this.nationSituations.activeSituation = {
            ...selectedSituation,
            triggerDay: currentDay,
            expiryDay: currentDay + selectedSituation.duration
        };
        
        EventBus.emit('nation_situation_triggered', {
            situation: this.nationSituations.activeSituation
        });
    }

    /**
     * Make choice for active nation situation
     */
    makeNationChoice(choiceIndex) {
        if (!this.nationSituations.activeSituation) return false;
        
        const situation = this.nationSituations.activeSituation;
        const choice = situation.choices[choiceIndex];
        
        if (!choice) return false;
        
        const effectId = `nation_situation_${situation.id}_${Date.now()}`;
        const currentDay = this.getCurrentDay();
        
        this.nationSituations.activeEffects.set(effectId, {
            endDay: currentDay + situation.duration,
            effects: choice.effects,
            situationTitle: situation.title,
            choiceText: choice.text
        });
        
        this.applyNationSituationEffects(choice.effects);
        
        this.nationSituations.situationHistory.push(situation.id);
        if (this.nationSituations.situationHistory.length > 50) {
            this.nationSituations.situationHistory.shift();
        }
        
        this.nationSituations.activeSituation = null;
        
        EventBus.emit('nation_choice_made', {
            situation: situation,
            choice: choice,
            effectId: effectId
        });
        
        return true;
    }

    /**
     * Apply nation situation effects to nation
     */
    applyNationSituationEffects(effects) {
        if (!window.Nation) return;
        
        Object.entries(effects).forEach(([effect, value]) => {
            switch (effect) {
                case 'literacy':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.literacy = Math.max(0, Math.min(100, (window.Nation.nationStats.literacy || 0) + value));
                    }
                    break;
                case 'pollution':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.pollution = Math.max(0, Math.min(100, (window.Nation.nationStats.pollution || 0) + value));
                    }
                    break;
                case 'environment':
                    if (window.Nation.nationStats) {
                        window.Nation.nationStats.environment = Math.max(0, Math.min(100, (window.Nation.nationStats.environment || 50) + value));
                    }
                    break;
                case 'infra_cost':
                    if (!window.Nation.nationSituationModifiers) {
                        window.Nation.nationSituationModifiers = { infra_cost: 1, land_cost: 1, tech_cost: 1, infra_upkeep: 0 };
                    }
                    window.Nation.nationSituationModifiers.infra_cost *= value;
                    break;
                case 'land_cost':
                    if (!window.Nation.nationSituationModifiers) {
                        window.Nation.nationSituationModifiers = { infra_cost: 1, land_cost: 1, tech_cost: 1, infra_upkeep: 0 };
                    }
                    window.Nation.nationSituationModifiers.land_cost *= value;
                    break;
                case 'tech_cost':
                    if (!window.Nation.nationSituationModifiers) {
                        window.Nation.nationSituationModifiers = { infra_cost: 1, land_cost: 1, tech_cost: 1, infra_upkeep: 0 };
                    }
                    window.Nation.nationSituationModifiers.tech_cost *= value;
                    break;
                case 'infra_upkeep':
                    if (!window.Nation.nationSituationModifiers) {
                        window.Nation.nationSituationModifiers = { infra_cost: 1, land_cost: 1, tech_cost: 1, infra_upkeep: 0 };
                    }
                    window.Nation.nationSituationModifiers.infra_upkeep += value;
                    break;
                case 'money':
                    if (value < 0) {
                        const currentMoney = window.Nation.money || 0;
                        const cost = currentMoney * (0.05 + Math.random() * 0.15);
                        window.Nation.money = Math.max(0, currentMoney - cost);
                    } else {
                        window.Nation.money = (window.Nation.money || 0) + value;
                    }
                    break;
            }
        });
        
        if (window.Nation.calculateNationStats) {
            window.Nation.calculateNationStats();
        }
    }

    /**
     * Process active nation situation effects (check for expiry)
     */
    processActiveNationSituationEffects(currentDay) {
        const expiredEffects = [];
        
        for (const [effectId, effectData] of this.nationSituations.activeEffects.entries()) {
            if (currentDay >= effectData.endDay) {
                expiredEffects.push(effectId);
            }
        }
        
        expiredEffects.forEach(effectId => {
            const effectData = this.nationSituations.activeEffects.get(effectId);
            this.nationSituations.activeEffects.delete(effectId);
            
            EventBus.emit('nation_effect_expired', {
                effectId: effectId,
                effectData: effectData
            });
        });
    }

    /**
     * Check for military situations (every 4 days)
     */
    checkMilitarySituations(currentDay) {
        const daysSinceLastSituation = currentDay - this.militarySituations.lastSituationDay;
        
        if (daysSinceLastSituation >= this.militarySituations.situationInterval) {
            this.triggerMilitarySituation(currentDay);
            this.militarySituations.lastSituationDay = currentDay;
        }
    }

    /**
     * Trigger a new military situation
     */
    triggerMilitarySituation(currentDay) {
        // Don't trigger if there's already an active situation
        if (this.militarySituations.activeSituation) return;
        
        // Select random situation
        const availableSituations = this.militarySituationDatabase.filter(situation => 
            !this.militarySituations.situationHistory.includes(situation.id) ||
            this.militarySituations.situationHistory.length >= this.militarySituationDatabase.length * 0.8
        );
        
        if (availableSituations.length === 0) {
            this.militarySituations.situationHistory = [];
            return this.triggerMilitarySituation(currentDay);
        }
        
        const selectedSituation = availableSituations[Math.floor(Math.random() * availableSituations.length)];
        this.militarySituations.activeSituation = {
            ...selectedSituation,
            triggerDay: currentDay,
            expiryDay: currentDay + selectedSituation.duration
        };
        
        EventBus.emit('military_situation_triggered', {
            situation: this.militarySituations.activeSituation
        });
    }

    /**
     * Make choice for active military situation
     */
    makeMilitaryChoice(choiceIndex) {
        if (!this.militarySituations.activeSituation) return false;
        
        const situation = this.militarySituations.activeSituation;
        const choice = situation.choices[choiceIndex];
        
        if (!choice) return false;
        
        const effectId = `military_situation_${situation.id}_${Date.now()}`;
        const currentDay = this.getCurrentDay();
        
        this.militarySituations.activeEffects.set(effectId, {
            endDay: currentDay + situation.duration,
            effects: choice.effects,
            situationTitle: situation.title,
            choiceText: choice.text
        });
        
        this.applyMilitarySituationEffects(choice.effects);
        
        this.militarySituations.situationHistory.push(situation.id);
        if (this.militarySituations.situationHistory.length > 50) {
            this.militarySituations.situationHistory.shift();
        }
        
        this.militarySituations.activeSituation = null;
        
        EventBus.emit('military_choice_made', {
            situation: situation,
            choice: choice,
            effectId: effectId
        });
        
        return true;
    }

    /**
     * Apply military situation effects to nation
     */
    applyMilitarySituationEffects(effects) {
        if (!window.Nation) return;
        
        Object.entries(effects).forEach(([effect, value]) => {
            switch (effect) {
                case 'soldier_eff':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.soldier_eff *= value;
                    break;
                case 'tank_eff':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.tank_eff *= value;
                    break;
                case 'aircraft_eff':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.aircraft_eff *= value;
                    break;
                case 'ship_eff':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.ship_eff *= value;
                    break;
                case 'spy_ops_success_chance':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.spy_ops_success_chance += value;
                    break;
                case 'missile_infra_damage':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.missile_infra_damage += value;
                    break;
                case 'nuke_infra_damage':
                    if (!window.Nation.militarySituationModifiers) {
                        window.Nation.militarySituationModifiers = { soldier_eff: 1, tank_eff: 1, aircraft_eff: 1, ship_eff: 1, spy_ops_success_chance: 0, missile_infra_damage: 0, nuke_infra_damage: 0 };
                    }
                    window.Nation.militarySituationModifiers.nuke_infra_damage += value;
                    break;
                case 'money':
                    if (value < 0) {
                        const currentMoney = window.Nation.money || 0;
                        const cost = currentMoney * (0.05 + Math.random() * 0.15);
                        window.Nation.money = Math.max(0, currentMoney - cost);
                    } else {
                        window.Nation.money = (window.Nation.money || 0) + value;
                    }
                    break;
            }
        });
        
        if (window.Nation.calculateNationStats) {
            window.Nation.calculateNationStats();
        }
    }

    /**
     * Process active military situation effects (check for expiry)
     */
    processActiveMilitarySituationEffects(currentDay) {
        const expiredEffects = [];
        
        for (const [effectId, effectData] of this.militarySituations.activeEffects.entries()) {
            if (currentDay >= effectData.endDay) {
                expiredEffects.push(effectId);
            }
        }
        
        expiredEffects.forEach(effectId => {
            const effectData = this.militarySituations.activeEffects.get(effectId);
            this.militarySituations.activeEffects.delete(effectId);
            
            EventBus.emit('military_effect_expired', {
                effectId: effectId,
                effectData: effectData
            });
        });
    }

    /**
     * Update employment and education statistics
     */
    updateEmploymentAndEducation() {
        this.updateEmploymentStatistics();
        this.updateEducationStatistics();
        this.processEducationProgression();
    }

    /**
     * Update employment statistics
     */
    updateEmploymentStatistics() {
        // Count citizens by employment status
        const employmentCounts = {
            employed: 0,
            unemployed: 0,
            student: 0,
            retired: 0,
            not_applicable: 0
        };
        
        for (const citizen of this.citizens.values()) {
            employmentCounts[citizen.employmentStatus]++;
        }
        
        // Calculate workforce and employment rates
        this.employment.workforce = employmentCounts.employed + employmentCounts.unemployed;
        this.employment.employed = employmentCounts.employed;
        this.employment.unemployed = employmentCounts.unemployed;
        this.employment.students = employmentCounts.student;
        this.employment.retired = employmentCounts.retired;
        this.employment.dependents = employmentCounts.not_applicable;
        
        // Calculate rates
        if (this.employment.workforce > 0) {
            this.employment.unemploymentRate = this.employment.unemployed / this.employment.workforce;
            this.employment.laborParticipationRate = this.employment.workforce / 
                (this.ageGroups.teen.count + this.ageGroups.youngAdult.count + this.ageGroups.adult.count + this.ageGroups.middleAged.count + this.ageGroups.older.count);
        }
        
        // Factor in happiness, improvements, and military for employment opportunities
        const militaryPopulation = this.getDraftedMilitaryPopulation();
        this.adjustEmploymentForGameFactors(militaryPopulation);
    }

    /**
     * Adjust employment based on game factors
     */
    adjustEmploymentForGameFactors(militaryPopulation = 0) {
        if (!window.Nation) return;
        
        const happiness = window.Nation.happiness || 50;
        const improvements = this.getImprovementEmploymentSlots();
        
        // Calculate employment capacity based on improvements
        const employmentCapacity = improvements.totalSlots;
        const currentEmployed = this.employment.employed + militaryPopulation;
        
        // Adjust employment based on capacity and happiness
        const happinessFactor = happiness / 50; // 0.5 to 2.0
        const effectiveCapacity = employmentCapacity * happinessFactor;
        
        if (currentEmployed > effectiveCapacity) {
            // Too many people for available jobs - increase unemployment
            const excess = currentEmployed - effectiveCapacity;
            this.employment.unemploymentRate = Math.min(0.5, this.employment.unemploymentRate + (excess / this.employment.workforce));
        } else if (currentEmployed < effectiveCapacity) {
            // Jobs available - reduce unemployment
            const shortage = effectiveCapacity - currentEmployed;
            this.employment.unemploymentRate = Math.max(0.02, this.employment.unemploymentRate - (shortage / this.employment.workforce));
        }
    }

    /**
     * Get employment slots from improvements
     */
    getImprovementEmploymentSlots() {
        const employmentSlots = {
            totalSlots: 1000, // Base employment capacity
            byType: {
                industrial: 0,
                service: 0,
                government: 0,
                military: 0
            }
        };
        
        if (window.Nation && window.Nation.improvements) {
            // Each improvement type provides different employment
            const improvements = window.Nation.improvements;
            
            employmentSlots.byType.industrial = (improvements.factory || 0) * 200 + 
                                              (improvements.mine || 0) * 150 + 
                                              (improvements.assemblyPlant || 0) * 250;
            
            employmentSlots.byType.service = (improvements.hospital || 0) * 100 + 
                                           (improvements.school || 0) * 80 + 
                                           (improvements.park || 0) * 50;
            
            employmentSlots.byType.government = (improvements.embassy || 0) * 30 + 
                                              (improvements.foreignAffairsOffice || 0) * 25 + 
                                              (improvements.internalAffairsOffice || 0) * 35;
            
            employmentSlots.byType.military = (improvements.barracks || 0) * 100 + 
                                            (improvements.airforceBase || 0) * 150 + 
                                            (improvements.harbor || 0) * 120;
            
            employmentSlots.totalSlots = Object.values(employmentSlots.byType)
                .reduce((total, slots) => total + slots, 1000);
        }
        
        return employmentSlots;
    }

    /**
     * Update education statistics  
     */
    updateEducationStatistics() {
        // Count citizens by education level
        const educationCounts = {
            none: 0,
            primary: 0,
            secondary: 0,
            higher: 0
        };
        
        for (const citizen of this.citizens.values()) {
            educationCounts[citizen.educationLevel]++;
        }
        
        const totalCitizens = this.citizens.size;
        if (totalCitizens > 0) {
            this.education.noEducation = educationCounts.none / totalCitizens;
            this.education.primaryEducation = educationCounts.primary / totalCitizens;
            this.education.secondaryEducation = educationCounts.secondary / totalCitizens;
            this.education.higherEducation = educationCounts.higher / totalCitizens;
        }
    }

    /**
     * Process education progression (7-day advancement)
     */
    processEducationProgression() {
        if (!window.Nation) return;
        
        const ns        = window.Nation.nationStats || {};
        const literacy  = ns.literacy  || 0;
        const happiness = window.Nation.happiness || 50;
        const tech      = window.Nation.tech || 0;
        
        // Check conditions for education advancement
        const progressionFactors = {
            literacy: literacy / 100,
            happiness: happiness / 50,
            technology: tech / 1000
        };
        
        // Process citizens in progression queue
        for (const [citizenId, progression] of this.education.progressionQueue.entries()) {
            progression.daysRemaining--;
            
            if (progression.daysRemaining <= 0) {
                // Advance citizen education
                const citizen = this.citizens.get(citizenId);
                if (citizen) {
                    citizen.educationLevel = progression.targetLevel;
                }
                this.education.progressionQueue.delete(citizenId);
            }
        }
        
        // Add new citizens to progression queue if conditions are met
        this.queueEducationProgressions(progressionFactors);
    }

    /**
     * Grant literacy when a citizen transitions between demographic groups.
     *
     * Each transition grants a random percentage of the nation's literacy rate,
     * ensuring citizens gain literacy as they age but not all at the same rate.
     *
     * Rules:
     * - Newborns start at 0 literacy
     * - Newborn→Infant: 1.00%–3.00% of national literacy
     * - Infant→Toddler: 3.00%–5.00%
     * - Toddler→Child: 5.00%–8.00%
     * - Child→Teen: 15.00%–25.00% (working class become relatively literate)
     * - Teen→YoungAdult: 5.00%–10.00%
     * - YoungAdult→Adult: 2.00%–5.00%
     * - Adult→MiddleAged: 1.00%–3.00%
     * - MiddleAged→Older: 0.50%–2.00%
     * - Older→Senior: 0 (plateau, no gain)
     * - Senior→Elderly: 0 (no gain)
     *
     * Gifted citizens (~5%) get a 1.5x multiplier and can exceed nation literacy by +20.
     * Non-gifted citizens are capped at the nation's literacy rate.
     */
    grantLiteracyOnAgeTransition(citizen, newAgeGroup) {
        if (!window.Nation) return;

        const ns = window.Nation.nationStats || {};
        const nationLiteracy = ns.literacy || 0;
        const isGifted = citizen.isGifted || false;

        // Determine the literacy cap for this citizen
        const literacyCap = isGifted
            ? Math.min(100, nationLiteracy + 20)
            : nationLiteracy;

        // No gain if already at or above cap
        const currentLiteracy = citizen.literacyScore || 0;
        if (currentLiteracy >= literacyCap) return;

        // Transition gain percentages (min, max) of national literacy rate
        const transitionGains = {
            'infant':        { min: 0.01, max: 0.03 },   // 1.00%–3.00%
            'toddler':       { min: 0.03, max: 0.05 },   // 3.00%–5.00%
            'child':         { min: 0.05, max: 0.08 },   // 5.00%–8.00%
            'teen':          { min: 0.15, max: 0.25 },   // 15.00%–25.00%
            'youngAdult':    { min: 0.05, max: 0.10 },   // 5.00%–10.00%
            'adult':         { min: 0.02, max: 0.05 },   // 2.00%–5.00%
            'middleAged':    { min: 0.01, max: 0.03 },   // 1.00%–3.00%
            'older':         { min: 0.005, max: 0.02 },  // 0.50%–2.00%
            // senior, elderly: no gain (0)
        };

        const gainDef = transitionGains[newAgeGroup];
        if (!gainDef) return; // senior/elderly/newborn — no literacy gain on transition

        // Random gain within range, as a percentage of national literacy rate
        const gainPercent = gainDef.min + Math.random() * (gainDef.max - gainDef.min);
        const gainAmount = nationLiteracy * gainPercent;

        // Gifted citizens learn 50% faster
        const finalGain = isGifted ? gainAmount * 1.5 : gainAmount;

        // Apply education edict literacy boost (toddlers and children only)
        if (window.Nation?.edictEffects) {
            if (newAgeGroup === 'toddler' && window.Nation.edictEffects.literacyBoostToddler) {
                const boostedGain = finalGain * (1 + window.Nation.edictEffects.literacyBoostToddler);
                citizen.literacyScore = Math.min(literacyCap, currentLiteracy + boostedGain);
                citizen.literacyScore = Math.round(citizen.literacyScore * 100) / 100;
                return;
            }
            if (newAgeGroup === 'child' && window.Nation.edictEffects.literacyBoostChild) {
                const boostedGain = finalGain * (1 + window.Nation.edictEffects.literacyBoostChild);
                citizen.literacyScore = Math.min(literacyCap, currentLiteracy + boostedGain);
                citizen.literacyScore = Math.round(citizen.literacyScore * 100) / 100;
                return;
            }
        }

        // Apply gain, capped at the citizen's literacy cap
        const newLiteracy = Math.min(literacyCap, currentLiteracy + finalGain);
        citizen.literacyScore = Math.round(newLiteracy * 100) / 100;
    }

    /**
     * Progress individual citizen literacy based on nation literacy rate and demographics.
     *
     * NOTE: This method is now deprecated in favor of grantLiteracyOnAgeTransition(),
     * which grants literacy when citizens transition between demographic groups.
     * Kept for backward compatibility — does nothing.
     */
    progressCitizenLiteracy() {
        // Deprecated: literacy is now granted on demographic transitions
        // via grantLiteracyOnAgeTransition() in processDailyAging().
    }

    /**
     * Queue citizens for education progression
     */
    queueEducationProgressions(factors) {
        const eligibleCitizens = Array.from(this.citizens.values())
            .filter(citizen => !this.education.progressionQueue.has(citizen.id))
            .filter(citizen => ['child', 'teen', 'youngAdult', 'adult'].includes(citizen.ageGroup));
        
        for (const citizen of eligibleCitizens) {
            const currentLevel = citizen.educationLevel;
            let targetLevel = null;
            let required = null;
            
            if (currentLevel === 'none' && factors.literacy >= 0.25) {
                targetLevel = 'primary';
                required = this.education.literacyRequirements.primary;
            } else if (currentLevel === 'primary' && factors.literacy >= 0.50) {
                targetLevel = 'secondary';
                required = this.education.literacyRequirements.secondary;
            } else if (currentLevel === 'secondary' && factors.literacy >= 0.75) {
                targetLevel = 'higher';
                required = this.education.literacyRequirements.higher;
            }
            
            if (targetLevel && Math.random() < 0.1) { // 10% chance per day to start progression
                this.education.progressionQueue.set(citizen.id, {
                    targetLevel: targetLevel,
                    daysRemaining: 7 // 7 days to complete education level
                });
            }
        }
    }
    /**
     * Initialize territorial distribution
     */
    initializeTerritorialDistribution() {
        if (!window.Nation) return;
        
        const territories = window.Nation.territories || ['capital'];
        const totalPopulation = this.getTotalPopulation();
        
        if (territories.length === 0) return;
        
        // Distribute population across territories
        const populationPerTerritory = Math.floor(totalPopulation / territories.length);
        
        territories.forEach(territoryId => {
            this.territorialDistribution.set(territoryId, {
                population: populationPerTerritory,
                capacity: this.calculateTerritoryCapacity(territoryId),
                growthRate: 0.02,
                happiness: 50,
                density: 0
            });
        });
        
        this.updateTerritorialDensities();
    }

    /**
     * Calculate territory capacity based on infrastructure
     */
    calculateTerritoryCapacity(territoryId) {
        // Base capacity calculation
        const baseCapacity = 10000;
        
        if (window.Nation) {
            const infra = window.Nation.infra || 1000;
            const land = window.Nation.land || 1000;
            return Math.floor(baseCapacity * Math.sqrt(infra * land / 1000000));
        }
        
        return baseCapacity;
    }

    /**
     * Update territorial densities
     */
    updateTerritorialDensities() {
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            data.density = data.capacity > 0 ? data.population / data.capacity : 0;
        }
    }

    /**
     * Update demographics summary
     */
    updateDemographics() {
        const totalPopulation = this.getTotalPopulation();
        
        // Update age group percentages
        Object.keys(this.ageGroups).forEach(ageGroup => {
            this.ageGroups[ageGroup].percentage = totalPopulation > 0 ? 
                this.ageGroups[ageGroup].count / totalPopulation : 0;
        });
        
        // Update territorial distribution
        this.updateTerritorialDensities();
    }

    /**
     * Record daily history
     */
    recordDailyHistory() {
        const currentDay = this.getCurrentDay();
        const totalPopulation = this.getTotalPopulation();
        
        // Record population history
        this.history.totalPopulation.push({
            day: currentDay,
            population: totalPopulation
        });
        
        // Record age distribution
        const ageDistribution = {};
        Object.entries(this.ageGroups).forEach(([ageGroup, data]) => {
            ageDistribution[ageGroup] = data.count;
        });
        
        this.history.ageDistribution.push({
            day: currentDay,
            distribution: ageDistribution
        });
        
        // Record employment and education
        this.history.employment.push({
            day: currentDay,
            employed: this.employment.employed,
            unemployed: this.employment.unemployed,
            unemploymentRate: this.employment.unemploymentRate
        });
        
        this.history.education.push({
            day: currentDay,
            noEducation: this.education.noEducation,
            primaryEducation: this.education.primaryEducation,
            secondaryEducation: this.education.secondaryEducation,
            higherEducation: this.education.higherEducation
        });
        
        // Record population lifecycle stats
        this.history.births.push({ day: currentDay, born: this.populationStats.born });
        this.history.deaths.push({ day: currentDay, died: this.populationStats.died });
        this.history.enlisted.push({ day: currentDay, enlisted: this.populationStats.enlisted });
        this.history.diedInCombat.push({ day: currentDay, diedInCombat: this.populationStats.diedInCombat });
        this.history.reachedSenior.push({ day: currentDay, reachedSenior: this.populationStats.reachedSenior });
        this.history.emigrated.push({ day: currentDay, emigrated: this.populationStats.emigrated });
        // Trim history to max length
        Object.keys(this.history).forEach(key => {
            if (Array.isArray(this.history[key]) && this.history[key].length > this.history.maxHistoryLength) {
                this.history[key].shift();
            }
        });
    }

    /**
     * Update nation population
     */
    updateNationPopulation() {
        if (window.Nation) {
            window.Nation.population = this.getTotalPopulation();
        }
    }

    /**
     * Handle monthly updates (delegates to primary handleMonthPassed above)
     */
    // Note: handleMonthPassed and handleYearPassed are defined earlier in this file.
    // Population events are handled exclusively through the situation system (choices-based).

    /**
     * Update vital rates based on game conditions
     */
    updateVitalRates() {
        if (!window.Nation) return;
        
        const happiness = window.Nation.happiness || 50;
        const ns        = window.Nation.nationStats || {};
        const literacy  = ns.literacy  || 0;
        const disease   = ns.disease   || 10;
        
        // Adjust birth rate based on happiness and literacy
        const happinessFactor = 1 + (happiness - 50) / 200; // +/-25%
        const literacyFactor = 1 + (literacy - 50) / 400;   // +/-12.5%
        this.vitalRates.baseBirthRate = Math.max(0.01, Math.min(0.06, 
            0.035 * happinessFactor * literacyFactor));
        
        // Adjust death rate based on disease and healthcare
        const diseaseFactor = 1 + disease / 200; // 0% to 25% increase
        this.vitalRates.baseDeathRate = Math.max(0.005, Math.min(0.03,
            0.01 * diseaseFactor));
    }

    /**
     * Analyze demographic trends
     */
    analyzeDemographicTrends() {
        // Calculate demographic momentum and dependency ratios
        const totalPop = this.getTotalPopulation();
        
        if (totalPop > 0) {
            const workingAge = this.ageGroups.youngAdult.count + 
                             this.ageGroups.adult.count + 
                             this.ageGroups.middleAged.count;
            
            const dependents = totalPop - workingAge;
            
            this.dependencyRatio = dependents / Math.max(workingAge, 1);
            this.agingIndex = (this.ageGroups.senior.count + this.ageGroups.elderly.count) / 
                            Math.max(this.ageGroups.child.count + this.ageGroups.teen.count, 1);
        }
    }

    /**
     * Generate annual report
     */
    generateAnnualReport() {
        const monthlyGrowthRate = this.history.totalPopulation.length >= 2
            ? (this.history.totalPopulation[this.history.totalPopulation.length - 1].population - this.history.totalPopulation[0].population) / this.history.totalPopulation[0].population / this.history.totalPopulation.length
            : 0;
        
        const report = {
            populationGrowth: monthlyGrowthRate * 12, // Annualized
            majorDemographicShifts: this.identifyDemographicShifts(),
            employmentTrends: this.analyzeEmploymentTrends(),
            educationProgress: this.analyzeEducationProgress(),
            migrationImpact: this.analyzeMigrationImpact(),
            populationChallenges: this.identifyPopulationChallenges(),
            recommendations: this.generateRecommendations()
        };
        
        EventBus.emit('annual_population_report', report);
        return report;
    }

    /**
     * Get population overview for UI
     */
    getPopulationOverview() {
        const totalPop = this.getTotalPopulation();
        const taxablePop = this.getTaxablePopulation();
        const militaryEligible = this.getMilitaryEligiblePopulation();
        const drafted = this.getDraftedMilitaryPopulation();
        
        return {
            totalPopulation: totalPop,
            taxablePopulation: taxablePop,
            nonTaxablePopulation: totalPop - taxablePop,
            militaryEligiblePopulation: militaryEligible,
            draftedMilitaryPopulation: drafted,
            militaryUsageRatio: militaryEligible > 0 ? (drafted / militaryEligible) : 0,
            militaryPenaltyActive: this.checkMilitaryPenalty() < 1.0,
            ageDistribution: Object.entries(this.ageGroups).map(([group, data]) => ({
                ageGroup: group,
                count: data.count,
                percentage: totalPop > 0 ? (data.count / totalPop * 100).toFixed(1) : 0,
                ageRange: `${data.min}-${data.max} days (real-time)`,
                taxable: this.ageGroupConfig[group]?.taxable || false,
                militaryEligible: this.ageGroupConfig[group]?.militaryEligible || false
            })),
            employment: {
                workforce: this.employment.workforce,
                employed: this.employment.employed,
                unemployed: this.employment.unemployed,
                unemploymentRate: (this.employment.unemploymentRate * 100).toFixed(1),
                laborParticipation: (this.employment.laborParticipationRate * 100).toFixed(1)
            },
            education: {
                noEducation: (this.education.noEducation * 100).toFixed(1),
                primary: (this.education.primaryEducation * 100).toFixed(1),
                secondary: (this.education.secondaryEducation * 100).toFixed(1),
                higher: (this.education.higherEducation * 100).toFixed(1),
                progressingCount: this.education.progressionQueue.size
            },
            vitalStatistics: {
                birthRate: (this.vitalRates.baseBirthRate * 100).toFixed(2),
                deathRate: (this.vitalRates.baseDeathRate * 100).toFixed(2),
                migrationPolicy: this.migrationPolicy,
                dailyGrowthRate: (this.calculatePopulationGrowthRate() * 100).toFixed(4),
                naturalGrowthRate: ((this.vitalRates.baseBirthRate - this.vitalRates.baseDeathRate) * 100).toFixed(2)
            },
            activeSituation: this.populationSituations.activeSituation,
            activeEffects: Array.from(this.populationSituations.activeEffects.values()),
            territorialBreakdown: this.getTerritorialBreakdown(),
            populationStats: { ...this.populationStats },
            populationHistory: {
                births: [...this.history.births],
                deaths: [...this.history.deaths],
                enlisted: [...this.history.enlisted],
                diedInCombat: [...this.history.diedInCombat],
                reachedSenior: [...this.history.reachedSenior],
                emigrated: [...this.history.emigrated]
            }
        };
    }

    /**
     * Get territorial breakdown
     */
    getTerritorialBreakdown() {
        return Object.fromEntries(
            Array.from(this.territorialDistribution.entries()).map(([id, data]) => [
                id,
                {
                    population: Math.floor(data.population),
                    capacity: Math.floor(data.capacity),
                    density: Math.round(data.density * 100) / 100,
                    happiness: Math.round(data.happiness),
                    growthRate: Math.round((data.growthRate || data.growth || 0) * 1000) / 10 // Per 1000 population
                }
            ])
        );
    }

    /**
     * Set migration policy
     */
    setMigrationPolicy(policy) {
        const validPolicies = ['open', 'restricted', 'balanced'];
        if (validPolicies.includes(policy)) {
            this.migrationPolicy = policy;
            EventBus.emit('migration_policy_changed', { policy });
        }
    }

    // Helper methods for analysis
    identifyDemographicShifts() {
        const shifts = [];
        const totalPop = this.getTotalPopulation();
        if (totalPop === 0) return shifts;

        const workingAge = this.ageGroups.youngAdult.count + this.ageGroups.adult.count + this.ageGroups.middleAged.count;
        const dependents = totalPop - workingAge;
        const dependencyRatio = dependents / Math.max(workingAge, 1);

        if (dependencyRatio > 0.7) {
            shifts.push({ type: 'high_dependency', severity: 'high', description: 'High dependent-to-worker ratio strains economy' });
        }
        if (this.ageGroups.elderly.count > totalPop * 0.2) {
            shifts.push({ type: 'aging_population', severity: 'medium', description: 'Large elderly population increases healthcare demand' });
        }
        return shifts;
    }

    analyzeEmploymentTrends() {
        const totalPop = this.getTotalPopulation();
        if (totalPop === 0) return {};

        return {
            workforce: this.employment.workforce,
            employed: this.employment.employed,
            unemployed: this.employment.unemployed,
            unemploymentRate: this.employment.unemploymentRate,
            trend: this.employment.unemploymentRate > 0.1 ? 'rising_unemployment' : 'stable'
        };
    }

    analyzeEducationProgress() {
        const totalPop = this.getTotalPopulation();
        if (totalPop === 0) return {};

        return {
            noEducation: this.education.noEducation,
            primary: this.education.primaryEducation,
            secondary: this.education.secondaryEducation,
            higher: this.education.higherEducation,
            progressingCount: this.education.progressionQueue.size,
            avgLiteracy: this.getAverageLiteracy()
        };
    }

    getAverageLiteracy() {
        let total = 0;
        let count = 0;
        for (const citizen of this.citizens.values()) {
            if (citizen.literacyScore !== undefined) {
                total += citizen.literacyScore;
                count++;
            }
        }
        return count > 0 ? total / count : 0;
    }

    analyzeMigrationImpact() {
        return {
            migrationPolicy: this.migrationPolicy,
            recentBirths: this.populationStats.born,
            recentDeaths: this.populationStats.died,
            recentEmigration: this.populationStats.emigrated,
            netMigration: this.populationStats.emigrated > 0 ? -this.populationStats.emigrated : 0
        };
    }

    identifyPopulationChallenges() {
        const challenges = [];
        const totalPop = this.getTotalPopulation();
        if (totalPop === 0) return challenges;

        const ns = window.Nation?.nationStats || {};
        if (ns.crime && ns.crime > 50) {
            challenges.push({ type: 'high_crime', severity: 'high', description: 'Crime rate is dangerously high' });
        }
        if (ns.disease && ns.disease > 30) {
            challenges.push({ type: 'high_disease', severity: 'high', description: 'Disease levels threaten population health' });
        }
        if (this.employment.unemploymentRate > 0.2) {
            challenges.push({ type: 'high_unemployment', severity: 'medium', description: 'Unemployment exceeds 20%' });
        }
        const density = window.Nation?.populationDensity || 0;
        if (density > 200) {
            challenges.push({ type: 'overcrowding', severity: 'medium', description: 'Population density is causing strain' });
        }
        return challenges;
    }

    generateRecommendations() {
        const recommendations = [];
        const challenges = this.identifyPopulationChallenges();

        for (const challenge of challenges) {
            switch (challenge.type) {
                case 'high_crime':
                    recommendations.push('Increase police presence and improve social services');
                    break;
                case 'high_disease':
                    recommendations.push('Invest in healthcare infrastructure and sanitation');
                    break;
                case 'high_unemployment':
                    recommendations.push('Create jobs through infrastructure and industry development');
                    break;
                case 'overcrowding':
                    recommendations.push('Expand territory or improve urban planning');
                    break;
            }
        }
        return recommendations;
    }

    // Event handlers

    /**
     * Get state for saving
     */
    getState() {
        return {
            ageGroups: { ...this.ageGroups },
            citizens: Object.fromEntries(this.citizens),
            nextCitizenId: this.nextCitizenId,
            vitalRates: { ...this.vitalRates },
            territorialDistribution: Object.fromEntries(this.territorialDistribution),
            migrationFactors: { ...this.migrationFactors },
            migrationPolicy: this.migrationPolicy,
            populationSituations: {
                lastSituationDay: this.populationSituations.lastSituationDay,
                activeSituation: this.populationSituations.activeSituation,
                situationHistory: [...this.populationSituations.situationHistory],
                activeEffects: Object.fromEntries(this.populationSituations.activeEffects)
            },
            nationSituations: {
                lastSituationDay: this.nationSituations.lastSituationDay,
                activeSituation: this.nationSituations.activeSituation,
                situationHistory: [...this.nationSituations.situationHistory],
                activeEffects: Object.fromEntries(this.nationSituations.activeEffects)
            },
            militarySituations: {
                lastSituationDay: this.militarySituations.lastSituationDay,
                activeSituation: this.militarySituations.activeSituation,
                situationHistory: [...this.militarySituations.situationHistory],
                activeEffects: Object.fromEntries(this.militarySituations.activeEffects)
            },
            employment: { ...this.employment },
            education: {
                ...this.education,
                progressionQueue: Object.fromEntries(this.education.progressionQueue)
            },
            pendingBirths: Object.fromEntries(this.pendingBirths),
            populationStats: { ...this.populationStats },
            history: {
                totalPopulation: [...this.history.totalPopulation],
                ageDistribution: [...this.history.ageDistribution],
                migration: [...this.history.migration],
                employment: [...this.history.employment],
                education: [...this.history.education]
            }
        };
    }

    /**
     * Set state from save data
     */
    setState(state) {
        if (state.ageGroups) Object.assign(this.ageGroups, state.ageGroups);
        if (state.citizens) this.citizens = new Map(Object.entries(state.citizens));
        if (state.nextCitizenId) this.nextCitizenId = state.nextCitizenId;
        if (state.vitalRates) Object.assign(this.vitalRates, state.vitalRates);
        if (state.territorialDistribution) {
            this.territorialDistribution = new Map(Object.entries(state.territorialDistribution));
        }
        if (state.migrationFactors) Object.assign(this.migrationFactors, state.migrationFactors);
        if (state.migrationPolicy) this.migrationPolicy = state.migrationPolicy;
        if (state.populationSituations) {
            Object.assign(this.populationSituations, state.populationSituations);
            if (state.populationSituations.activeEffects) {
                this.populationSituations.activeEffects = new Map(Object.entries(state.populationSituations.activeEffects));
            }
        }
        if (state.nationSituations) {
            Object.assign(this.nationSituations, state.nationSituations);
            if (state.nationSituations.activeEffects) {
                this.nationSituations.activeEffects = new Map(Object.entries(state.nationSituations.activeEffects));
            }
        }
        if (state.militarySituations) {
            Object.assign(this.militarySituations, state.militarySituations);
            if (state.militarySituations.activeEffects) {
                this.militarySituations.activeEffects = new Map(Object.entries(state.militarySituations.activeEffects));
            }
        }
        if (state.employment) Object.assign(this.employment, state.employment);
        if (state.education) {
            Object.assign(this.education, state.education);
            if (state.education.progressionQueue) {
                this.education.progressionQueue = new Map(Object.entries(state.education.progressionQueue));
            }
        }
        if (state.pendingBirths) {
            this.pendingBirths = new Map(Object.entries(state.pendingBirths));
        }
        if (state.populationStats) {
            this.populationStats = { ...state.populationStats };
        }
        if (state.history) {
            Object.assign(this.history, state.history);
        }
    }

    /**
     * Destroy the population system
     */
    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off('day_passed', this.handleDayPassed, this);
            EventBus.off('month_passed', this.handleMonthPassed, this);
            EventBus.off('year_passed', this.handleYearPassed, this);
            EventBus.off('territory_added', this.handleTerritoryAdded, this);
            EventBus.off('territory_removed', this.handleTerritoryRemoved, this);
            EventBus.off('policy_changed', this.handlePolicyChanged, this);
            EventBus.off('infrastructure_built', this.handleInfrastructureBuilt, this);
        }
        
        this.isInitialized = false;
        console.log('Population System destroyed');
    }
}

// Create global population system instance
window.PopulationSystem = PopulationSystem;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PopulationSystem };
}