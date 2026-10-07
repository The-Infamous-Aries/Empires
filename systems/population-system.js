/**
 * Population System - Population Management and Demographics
 * Dominion Wars - Nation Building Strategy Game
 */

class PopulationSystem {
    constructor() {
        this.isInitialized = false;
        
        // Population demographics
        this.demographics = {
            totalPopulation: 0,
            birthRate: 0.02, // 2% annual birth rate
            deathRate: 0.01, // 1% annual death rate
            migrationRate: 0.005, // 0.5% annual migration rate
            
            // Age groups
            ageGroups: {
                children: 0.25,    // 0-18 years (25%)
                adults: 0.65,      // 19-65 years (65%)
                elderly: 0.10      // 65+ years (10%)
            },
            
            // Education levels
            education: {
                none: 0.15,        // No formal education (15%)
                primary: 0.30,     // Primary education (30%)
                secondary: 0.40,   // Secondary education (40%)
                tertiary: 0.15     // Higher education (15%)
            },
            
            // Employment status
            employment: {
                employed: 0.60,    // Currently employed (60%)
                unemployed: 0.05,  // Actively seeking work (5%)
                inactive: 0.35     // Not in workforce (35% - students, retired, etc.)
            }
        };
        
        // Population distribution across territories
        this.territorialDistribution = new Map();
        
        // Population happiness factors
        this.happinessFactors = {
            housing: 75,        // Housing quality/availability
            healthcare: 70,     // Healthcare access and quality  
            education: 65,      // Education opportunities
            employment: 80,     // Job availability
            safety: 85,         // Public safety and security
            environment: 60,    // Environmental quality
            governance: 55,     // Government effectiveness
            economy: 70,        // Economic conditions
            infrastructure: 65, // Infrastructure quality
            culture: 75         // Cultural opportunities
        };
        
        // Population growth modifiers
        this.growthModifiers = {
            happiness: 1.0,     // Happiness multiplier
            resources: 1.0,     // Resource availability multiplier
            capacity: 1.0,      // Territory capacity multiplier
            policies: 1.0,      // Government policies multiplier
            events: 1.0,        // Random events multiplier
            healthcare: 1.0,    // Healthcare quality multiplier
            education: 1.0      // Education quality multiplier
        };
        
        // Population history for tracking trends
        this.history = {
            population: [],
            happiness: [],
            growth: [],
            migration: [],
            maxHistoryLength: 365 // Keep 1 year of data
        };
        
        // Population events
        this.activeEvents = [];
        
        // Skills and specializations
        this.skillDistribution = {
            agriculture: 0.25,
            manufacturing: 0.20,
            services: 0.30,
            technology: 0.10,
            military: 0.05,
            research: 0.05,
            government: 0.03,
            healthcare: 0.02
        };
    }

    /**
     * Initialize the population system
     */
    async initialize() {
        console.log('Initializing Population System...');
        
        // Set initial population from nation data
        if (window.Nation) {
            this.demographics.totalPopulation = window.Nation.population;
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
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        EventBus.on(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.on(GameEvents.YEAR_PASSED, this.handleYearPassed, this);
        EventBus.on(GameEvents.TERRITORY_ADDED, this.handleTerritoryAdded, this);
        EventBus.on(GameEvents.TERRITORY_REMOVED, this.handleTerritoryRemoved, this);
        EventBus.on('policy_changed', this.handlePolicyChanged, this);
        EventBus.on('infrastructure_built', this.handleInfrastructureBuilt, this);
    }

    /**
     * Initialize territorial distribution
     */
    initializeTerritorialDistribution() {
        if (!window.Nation) return;
        
        const territories = window.Nation.territories;
        if (territories.length === 0) return;
        
        // Distribute population evenly across territories initially
        const populationPerTerritory = this.demographics.totalPopulation / territories.length;
        
        territories.forEach(territoryId => {
            this.territorialDistribution.set(territoryId, {
                population: populationPerTerritory,
                capacity: this.calculateTerritoryCapacity(territoryId),
                growth: 0,
                happiness: 50,
                density: 0
            });
        });
        
        this.updateTerritorialDensities();
    }

    /**
     * Handle daily population updates
     */
    handleDayPassed(data) {
        // Update population growth
        this.updatePopulationGrowth();
        
        // Update happiness factors
        this.updateHappinessFactors();
        
        // Process migration between territories
        this.processTerritorialMigration();
        
        // Update demographics
        this.updateDemographics();
        
        // Process population events
        this.processPopulationEvents();
        
        // Record history
        this.recordPopulationHistory();
        
        // Update nation population
        this.updateNationPopulation();
    }

    /**
     * Update population growth
     */
    updatePopulationGrowth() {
        // Calculate daily growth rate
        let dailyGrowthRate = (this.demographics.birthRate - this.demographics.deathRate) / 365;
        
        // Apply growth modifiers
        Object.values(this.growthModifiers).forEach(modifier => {
            dailyGrowthRate *= modifier;
        });
        
        // Calculate population change
        const populationChange = this.demographics.totalPopulation * dailyGrowthRate;
        
        // Apply to territorial populations
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            const territoryGrowth = (data.population / this.demographics.totalPopulation) * populationChange;
            
            // Apply territory-specific modifiers
            const capacityModifier = Math.min(1.0, data.capacity / data.population);
            const happinessModifier = data.happiness / 50; // 50 is neutral happiness
            
            const actualGrowth = territoryGrowth * capacityModifier * happinessModifier;
            
            data.population += actualGrowth;
            data.growth = actualGrowth;
        }
        
        // Update total population
        this.demographics.totalPopulation += populationChange;
        
        // Process migration
        this.processMigration();
    }

    /**
     * Process migration (immigration/emigration)
     */
    processMigration() {
        const migrationChange = this.demographics.totalPopulation * (this.demographics.migrationRate / 365);
        
        // Migration depends on overall happiness and economic conditions
        let netMigration = migrationChange;
        
        if (window.Nation) {
            const happinessModifier = (window.Nation.happiness - 50) / 50;
            const economicModifier = window.Nation.gdp > 0 ? Math.log(window.Nation.gdp) / 20 : 0;
            
            netMigration *= (1 + happinessModifier + economicModifier);
        }
        
        // Apply migration to territories (prefer territories with better conditions)
        const sortedTerritories = Array.from(this.territorialDistribution.entries())
            .sort((a, b) => b[1].happiness - a[1].happiness);
        
        sortedTerritories.forEach(([territoryId, data], index) => {
            const migrationShare = (sortedTerritories.length - index) / sortedTerritories.length;
            const territoryMigration = netMigration * migrationShare;
            
            data.population = Math.max(0, data.population + territoryMigration);
        });
        
        this.demographics.totalPopulation = Math.max(0, this.demographics.totalPopulation + netMigration);
    }

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
        
        // Update growth modifiers based on happiness
        const avgHappiness = Array.from(this.territorialDistribution.values())
            .reduce((sum, data) => sum + data.happiness, 0) / this.territorialDistribution.size;
        
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
     * Update demographics breakdown
     */
    updateDemographics() {
        // Age group transitions (simplified)
        const aging = this.demographics.totalPopulation * 0.0001; // 0.01% age up daily
        
        // Children become adults
        const childrenToAdults = aging * 0.3;
        this.demographics.ageGroups.children -= childrenToAdults / this.demographics.totalPopulation;
        this.demographics.ageGroups.adults += childrenToAdults / this.demographics.totalPopulation;
        
        // Adults become elderly
        const adultsToElderly = aging * 0.1;
        this.demographics.ageGroups.adults -= adultsToElderly / this.demographics.totalPopulation;
        this.demographics.ageGroups.elderly += adultsToElderly / this.demographics.totalPopulation;
        
        // Ensure valid percentages
        const total = Object.values(this.demographics.ageGroups).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(this.demographics.ageGroups).forEach(group => {
                this.demographics.ageGroups[group] /= total;
            });
        }
        
        // Update education levels (gradual improvement)
        this.updateEducationLevels();
        
        // Update employment based on economic conditions
        this.updateEmploymentLevels();
        
        // Update territorial densities
        this.updateTerritorialDensities();
    }

    /**
     * Update education levels
     */
    updateEducationLevels() {
        // Education improves gradually with investment
        const educationImprovement = 0.0001; // 0.01% improvement per day
        
        // Move population up education levels
        const noneToPrimary = this.demographics.education.none * educationImprovement;
        const primaryToSecondary = this.demographics.education.primary * educationImprovement;
        const secondaryToTertiary = this.demographics.education.secondary * educationImprovement * 0.5;
        
        this.demographics.education.none -= noneToPrimary;
        this.demographics.education.primary += noneToPrimary - primaryToSecondary;
        this.demographics.education.secondary += primaryToSecondary - secondaryToTertiary;
        this.demographics.education.tertiary += secondaryToTertiary;
        
        // Ensure valid percentages
        const total = Object.values(this.demographics.education).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(this.demographics.education).forEach(level => {
                this.demographics.education[level] /= total;
            });
        }
    }

    /**
     * Update employment levels
     */
    updateEmploymentLevels() {
        // Employment changes based on economic conditions
        let targetUnemployment = 0.05; // 5% base unemployment
        
        if (window.Nation) {
            // Economic conditions affect unemployment
            const economicHealth = window.Nation.gdp / (window.Nation.population * 50); // GDP per capita relative to $50k
            targetUnemployment *= (2 - economicHealth); // Better economy = lower unemployment
            targetUnemployment = Math.max(0.01, Math.min(0.20, targetUnemployment));
        }
        
        // Gradually adjust towards target
        const currentUnemployment = this.demographics.employment.unemployed;
        const adjustmentRate = 0.001; // 0.1% adjustment per day
        
        if (currentUnemployment > targetUnemployment) {
            const reduction = Math.min(adjustmentRate, currentUnemployment - targetUnemployment);
            this.demographics.employment.unemployed -= reduction;
            this.demographics.employment.employed += reduction;
        } else if (currentUnemployment < targetUnemployment) {
            const increase = Math.min(adjustmentRate, targetUnemployment - currentUnemployment);
            this.demographics.employment.employed -= increase;
            this.demographics.employment.unemployed += increase;
        }
    }

    /**
     * Update territorial population densities
     */
    updateTerritorialDensities() {
        for (const [territoryId, data] of this.territorialDistribution.entries()) {
            data.density = data.population / data.capacity;
        }
    }

    /**
     * Calculate territory capacity
     */
    calculateTerritoryCapacity(territoryId) {
        // This would get actual territory data
        // For now, return a base capacity
        return 50000; // Base capacity of 50,000 per territory
    }

    /**
     * Process population events
     */
    processPopulationEvents() {
        this.activeEvents.forEach((event, index) => {
            event.duration--;
            
            if (event.duration <= 0) {
                this.removeEventEffects(event);
                this.activeEvents.splice(index, 1);
            } else {
                this.applyEventEffects(event);
            }
        });
    }

    /**
     * Apply population event effects
     */
    applyEventEffects(event) {
        if (event.effects) {
            Object.entries(event.effects).forEach(([factor, change]) => {
                if (this.growthModifiers[factor] !== undefined) {
                    this.growthModifiers[factor] *= (1 + change);
                } else if (this.happinessFactors[factor] !== undefined) {
                    this.happinessFactors[factor] += change;
                }
            });
        }
    }

    /**
     * Remove population event effects
     */
    removeEventEffects(event) {
        console.log(`Population event ended: ${event.name}`);
        EventBus.emit('population_event_ended', { event });
    }

    /**
     * Record population history
     */
    recordPopulationHistory() {
        // Record total population
        this.history.population.push(this.demographics.totalPopulation);
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
     * Update nation population
     */
    updateNationPopulation() {
        if (window.Nation) {
            window.Nation.population = Math.floor(this.demographics.totalPopulation);
            
            // Update nation happiness based on population happiness
            const avgHappiness = Array.from(this.territorialDistribution.values())
                .reduce((sum, data) => sum + data.happiness, 0) / 
                Math.max(1, this.territorialDistribution.size);
            
            window.Nation.happiness = avgHappiness;
        }
    }

    /**
     * Handle monthly population updates
     */
    handleMonthPassed(data) {
        // Monthly demographic analysis
        this.performMonthlyAnalysis();
        
        // Generate population events
        this.generatePopulationEvents();
        
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
            demographics: { ...this.demographics }
        });
    }

    /**
     * Generate population events
     */
    generatePopulationEvents() {
        if (Math.random() < 0.1) { // 10% chance per month
            const events = [
                {
                    name: 'Baby Boom',
                    description: 'A surge in birth rates across the nation',
                    duration: 90,
                    effects: { happiness: 0.05 }
                },
                {
                    name: 'Health Crisis',
                    description: 'Public health concerns affect the population',
                    duration: 60,
                    effects: { healthcare: -10 }
                },
                {
                    name: 'Education Reform',
                    description: 'Educational improvements boost population skills',
                    duration: 180,
                    effects: { education: 5 }
                },
                {
                    name: 'Migration Wave',
                    description: 'Increased immigration boosts population',
                    duration: 30,
                    effects: { resources: 1.02 }
                }
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            this.activeEvents.push({ ...event });
            
            EventBus.emit('population_event_started', { event });
        }
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
                this.demographics.birthRate *= 1.001;
            } else if (trend < -0.001) { // Decline
                this.demographics.deathRate *= 0.999;
            }
        }
    }

    /**
     * Perform annual population census
     */
    performAnnualCensus() {
        const census = {
            totalPopulation: Math.floor(this.demographics.totalPopulation),
            demographics: { ...this.demographics },
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
    updateVitalRates() {
        // Healthcare affects death rate
        const healthcareIndex = this.happinessFactors.healthcare / 100;
        this.demographics.deathRate = 0.01 * (1 - healthcareIndex * 0.5);
        
        // Economic conditions and happiness affect birth rate
        const happinessIndex = (Object.values(this.happinessFactors).reduce((sum, val) => sum + val, 0) / Object.keys(this.happinessFactors).length) / 100;
        this.demographics.birthRate = 0.02 * (0.5 + happinessIndex);
        
        // Ensure reasonable ranges
        this.demographics.birthRate = Math.max(0.005, Math.min(0.05, this.demographics.birthRate));
        this.demographics.deathRate = Math.max(0.003, Math.min(0.03, this.demographics.deathRate));
    }

    /**
     * Generate annual population report
     */
    generateAnnualReport() {
        const report = {
            year: new Date().getFullYear(),
            population: Math.floor(this.demographics.totalPopulation),
            growth: this.demographics.birthRate - this.demographics.deathRate,
            demographics: { ...this.demographics },
            avgHappiness: this.history.happiness.reduce((sum, val) => sum + val, 0) / this.history.happiness.length,
            territories: this.territorialDistribution.size
        };
        
        EventBus.emit('annual_population_report', { report });
        return report;
    }

    /**
     * Handle territory added
     */
    handleTerritoryAdded(data) {
        const territory = data.territory;
        this.territorialDistribution.set(territory.id, {
            population: territory.population || 0,
            capacity: this.calculateTerritoryCapacity(territory.id),
            growth: 0,
            happiness: 50,
            density: 0
        });
        
        this.demographics.totalPopulation += territory.population || 0;
    }

    /**
     * Handle territory removed
     */
    handleTerritoryRemoved(data) {
        const territoryData = this.territorialDistribution.get(data.territoryId);
        if (territoryData) {
            this.demographics.totalPopulation -= territoryData.population;
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
     * Get population overview
     */
    getPopulationOverview() {
        return {
            total: Math.floor(this.demographics.totalPopulation),
            demographics: { ...this.demographics },
            happiness: Array.from(this.territorialDistribution.values())
                .reduce((sum, data) => sum + data.happiness, 0) / this.territorialDistribution.size,
            growth: this.demographics.birthRate - this.demographics.deathRate,
            territories: this.territorialDistribution.size,
            activeEvents: this.activeEvents.length
        };
    }

    /**
     * Get detailed territorial breakdown
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
                    growth: Math.round(data.growth * 365) // Annualized growth
                }
            ])
        );
    }

    /**
     * Get state for saving
     */
    getState() {
        return {
            demographics: { ...this.demographics },
            territorialDistribution: Object.fromEntries(this.territorialDistribution),
            happinessFactors: { ...this.happinessFactors },
            growthModifiers: { ...this.growthModifiers },
            skillDistribution: { ...this.skillDistribution },
            activeEvents: [...this.activeEvents],
            history: {
                population: [...this.history.population],
                happiness: [...this.history.happiness],
                growth: [...this.history.growth]
            }
        };
    }

    /**
     * Set state from save data
     */
    setState(state) {
        if (state.demographics) Object.assign(this.demographics, state.demographics);
        if (state.territorialDistribution) {
            this.territorialDistribution = new Map(Object.entries(state.territorialDistribution));
        }
        if (state.happinessFactors) Object.assign(this.happinessFactors, state.happinessFactors);
        if (state.growthModifiers) Object.assign(this.growthModifiers, state.growthModifiers);
        if (state.skillDistribution) Object.assign(this.skillDistribution, state.skillDistribution);
        if (state.activeEvents) this.activeEvents = [...state.activeEvents];
        if (state.history) {
            if (state.history.population) this.history.population = [...state.history.population];
            if (state.history.happiness) this.history.happiness = [...state.history.happiness];
            if (state.history.growth) this.history.growth = [...state.history.growth];
        }
    }

    /**
     * Destroy the population system
     */
    destroy() {
        // Clean up event listeners
        EventBus.off(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        EventBus.off(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.off(GameEvents.YEAR_PASSED, this.handleYearPassed, this);
        EventBus.off(GameEvents.TERRITORY_ADDED, this.handleTerritoryAdded, this);
        EventBus.off(GameEvents.TERRITORY_REMOVED, this.handleTerritoryRemoved, this);
        
        this.isInitialized = false;
        console.log('Population System destroyed');
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PopulationSystem };
}