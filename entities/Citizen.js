/**
 * Citizen Entity - Represents individual citizens within a nation
 * Integrates with Nation's population, economy, and happiness systems
 */

class Citizen {
    constructor(nationId, cityId = null) {
        this.id = this.generateId();
        this.nationId = nationId;
        this.cityId = cityId;
        this.born = Date.now();
        
        // Personal Information
        this.name = this.generateName();
        this.age = this.generateAge();
        this.gender = Math.random() > 0.5 ? 'male' : 'female';
        this.occupation = 'unemployed';
        this.education = 'none';
        this.health = 100;
        this.happiness = 50;
        
        // Economic Status (integrates with Nation economy)
        this.income = 0;
        this.wealth = this.generateInitialWealth();
        this.jobSkill = Math.random() * 50;
        this.productivity = 1.0;
        this.taxesPaid = 0; // Contributes to Nation.taxRevenue
        
        // Social Status (affects Nation statistics)
        this.socialClass = this.determineSocialClass();
        this.loyalty = 50 + Math.random() * 50; // 50-100 loyalty to nation
        this.politicalLeanings = this.generatePoliticalLeanings();
        this.culturalValues = this.generateCulturalValues();
        
        // Life Events
        this.lifeEvents = [];
        this.achievements = [];
        this.relationships = new Map();
        
        // Demographics (reflects Nation policies and bonuses)
        this.ethnicity = this.generateEthnicity();
        this.religion = this.generateReligion();
        this.language = 'common';
        
        // Status Tracking
        this.isAlive = true;
        this.isEmployed = false;
        this.isMilitary = false;
        this.isRetired = false;
        this.isCriminal = false;
        
        // Integration with Nation systems
        this.contributesToNationStats = true;
        this.affectedByNationPolicies = true;
        this.affectedByNationHappiness = true;
        
        // Life Statistics (modified by Nation stats)
        this.lifeExpectancy = this.calculateLifeExpectancy();
        this.reproductiveYears = this.calculateReproductiveYears();
        this.workingYears = this.calculateWorkingYears();
        
        this.initializeCitizen();
    }
    
    generateId() {
        return 'citizen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITIZEN INITIALIZATION (Integrates with Nation Systems)
    // ═══════════════════════════════════════════════════════════════════════
    
    initializeCitizen() {
        // Apply Nation's effects to citizen generation
        this.applyNationEffects();
        
        // Set age-appropriate characteristics
        this.adjustForAge();
        
        // Determine initial occupation based on Nation's economy
        this.determineInitialOccupation();
        
        // Add initial life event
        this.addLifeEvent('Born in the nation', 'birth');
        
        // Contribute to Nation population tracking
        this.registerWithNation();
    }
    
    applyNationEffects() {
        if (!window.Nation) return;
        
        const nation = window.Nation;
        
        // Apply Nation's happiness baseline to citizen
        if (this.affectedByNationHappiness) {
            this.happiness = Math.max(0, Math.min(100, 
                nation.happiness + (Math.random() * 20 - 10) // ±10 variation
            ));
        }
        
        // Apply Nation's literacy rate to education
        if (nation.nationStats?.literacy) {
            const literacyRate = nation.nationStats.literacy / 100;
            if (Math.random() < literacyRate) {
                this.education = this.age > 18 ? 'secondary' : 'primary';
                if (this.age > 22 && Math.random() < literacyRate * 0.3) {
                    this.education = 'higher';
                }
            }
        }
        
        // Apply Nation's government effects
        if (nation.governmentType) {
            // Government affects political leanings
            this.applyGovernmentEffects(nation.governmentType);
        }
        
        // Apply Nation's religion to citizen religion
        if (nation.religion && Math.random() < 0.7) { // 70% chance to match national religion
            this.religion = nation.religion;
        }
    }
    
    applyGovernmentEffects(government) {
        if (!government) return;
        
        // Government influences citizen political leanings
        switch (government) {
            case 'liberalDemocracy':
                this.politicalLeanings.social -= 20; // More liberal
                this.politicalLeanings.authoritarian -= 15; // Less authoritarian
                break;
            case 'conservativeRepublic':
                this.politicalLeanings.social += 20; // More conservative
                this.politicalLeanings.economic += 15; // More right-wing economically
                break;
            case 'socialism':
                this.politicalLeanings.economic -= 25; // More left-wing
                this.politicalLeanings.authoritarian += 10; // Slightly more authoritarian
                break;
            case 'authoritarianRegime':
                this.politicalLeanings.authoritarian += 30; // Much more authoritarian
                this.loyalty += 15; // Higher base loyalty (or fear)
                break;
        }
        
        // Clamp values
        Object.keys(this.politicalLeanings).forEach(key => {
            this.politicalLeanings[key] = Math.max(-50, Math.min(50, this.politicalLeanings[key]));
        });
        this.loyalty = Math.max(0, Math.min(100, this.loyalty));
    }
    
    registerWithNation() {
        if (!window.Nation) return;
        
        // Add this citizen to Nation's tracking (if Nation has citizen arrays)
        if (!window.Nation.citizens) window.Nation.citizens = [];
        window.Nation.citizens.push(this.id);
        
        // Contribute to population count (this would be aggregate calculated)
        // The actual population number is calculated by Nation.calculatePopulation()
    }
    
    generateName() {
        const firstNames = [
            'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
            'Jamie', 'Sage', 'Rowan', 'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley',
            'Hayden', 'Hunter', 'Jesse', 'Kai', 'Lane', 'Logan', 'Marley', 'Noah',
            'Parker', 'Peyton', 'Reagan', 'River', 'Skylar', 'Spencer'
        ];
        
        const lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
            'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
            'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
        ];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }
    
    generateAge() {
        // Weighted age distribution (more young people)
        const random = Math.random();
        if (random < 0.3) return Math.floor(Math.random() * 18); // 0-17 (children)
        if (random < 0.6) return 18 + Math.floor(Math.random() * 30); // 18-47 (adults)
        if (random < 0.9) return 48 + Math.floor(Math.random() * 20); // 48-67 (middle age)
        return 68 + Math.floor(Math.random() * 25); // 68-92 (elderly)
    }
    
    generateInitialWealth() {
        // Most citizens start with little wealth
        const random = Math.random();
        if (random < 0.7) return Math.random() * 1000; // Poor (0-1000)
        if (random < 0.9) return 1000 + Math.random() * 5000; // Middle class (1000-6000)
        return 6000 + Math.random() * 20000; // Wealthy (6000-26000)
    }
    
    determineSocialClass() {
        if (this.wealth < 1000) return 'lower';
        if (this.wealth < 6000) return 'middle';
        return 'upper';
    }
    
    generatePoliticalLeanings() {
        return {
            economic: -50 + Math.random() * 100, // -50 to 50 (left to right)
            social: -50 + Math.random() * 100,   // -50 to 50 (liberal to conservative)
            authoritarian: Math.random() * 100   // 0 to 100 (libertarian to authoritarian)
        };
    }
    
    generateCulturalValues() {
        return {
            tradition: Math.random() * 100,
            innovation: Math.random() * 100,
            community: Math.random() * 100,
            individualism: Math.random() * 100,
            environmentalism: Math.random() * 100
        };
    }
    
    generateEthnicity() {
        const ethnicities = [
            'Human-A', 'Human-B', 'Human-C', 'Human-D', 'Human-E',
            'Mixed-AB', 'Mixed-AC', 'Mixed-BD', 'Mixed-CE', 'Mixed-DE'
        ];
        return ethnicities[Math.floor(Math.random() * ethnicities.length)];
    }
    
    generateReligion() {
        const religions = [
            'monotheism', 'polytheism', 'atheism', 'buddhism', 'hinduism',
            'islam', 'christianity', 'judaism', 'shintoism', 'shamanism', 'none'
        ];
        return religions[Math.floor(Math.random() * religions.length)];
    }
    
    adjustForAge() {
        if (this.age < 18) {
            // Children
            this.occupation = 'student';
            this.income = 0;
            this.wealth *= 0.1; // Children have little wealth
            this.jobSkill = 0;
            this.education = this.age > 6 ? 'primary' : 'none';
        } else if (this.age < 25) {
            // Young adults
            this.education = Math.random() > 0.3 ? 'secondary' : 'primary';
            if (Math.random() > 0.7) this.education = 'higher';
        } else if (this.age < 65) {
            // Working adults
            this.education = Math.random() > 0.4 ? 'secondary' : 'primary';
            if (Math.random() > 0.5) this.education = 'higher';
            this.jobSkill = 20 + Math.random() * 60; // More experienced
        } else {
            // Elderly
            this.isRetired = true;
            this.productivity = Math.max(0.3, 1.0 - (this.age - 65) * 0.02);
            this.health = Math.max(20, 100 - (this.age - 65) * 2);
        }
    }
    
    determineInitialOccupation() {
        if (this.age < 18) {
            this.occupation = 'student';
            return;
        }
        
        if (this.isRetired) {
            this.occupation = 'retired';
            return;
        }
        
        // Occupation based on education and random chance
        const occupations = {
            none: ['laborer', 'farmer', 'unemployed'],
            primary: ['laborer', 'farmer', 'clerk', 'craftsperson'],
            secondary: ['clerk', 'technician', 'manager', 'teacher', 'trader'],
            higher: ['doctor', 'engineer', 'scientist', 'lawyer', 'administrator', 'professor']
        };
        
        const availableOccupations = occupations[this.education] || occupations.none;
        this.occupation = availableOccupations[Math.floor(Math.random() * availableOccupations.length)];
        
        this.isEmployed = this.occupation !== 'unemployed';
        this.calculateIncome();
    }
    
    calculateLifeExpectancy() {
        let baseLife = 75;
        
        // Health affects life expectancy
        baseLife += (this.health - 50) * 0.3;
        
        // Wealth affects life expectancy
        if (this.socialClass === 'upper') baseLife += 5;
        else if (this.socialClass === 'lower') baseLife -= 5;
        
        // Education affects life expectancy
        if (this.education === 'higher') baseLife += 3;
        else if (this.education === 'none') baseLife -= 3;
        
        return Math.max(40, Math.min(100, baseLife));
    }
    
    calculateReproductiveYears() {
        if (this.gender === 'female') {
            return { start: 15, end: 45 };
        } else {
            return { start: 18, end: 60 };
        }
    }
    
    calculateWorkingYears() {
        let startAge = 18;
        if (this.education === 'higher') startAge = 22;
        
        let endAge = 65;
        if (this.socialClass === 'lower') endAge = 70; // Work longer
        
        return { start: startAge, end: endAge };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITIZEN LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    ageOneYear() {
        this.age++;
        
        // Age-related changes
        this.adjustStatsForAging();
        
        // Life stage transitions
        this.checkLifeStageTransitions();
        
        // Random life events
        this.checkRandomEvents();
        
        // Health and mortality check
        this.checkMortality();
    }
    
    adjustStatsForAging() {
        // Health generally declines with age after 30
        if (this.age > 30) {
            const ageDecline = (this.age - 30) * 0.5;
            this.health = Math.max(10, this.health - ageDecline);
        }
        
        // Job skill improves with experience (up to age 50)
        if (this.age < 50 && this.isEmployed) {
            this.jobSkill = Math.min(100, this.jobSkill + Math.random() * 2);
        }
        
        // Productivity changes with age
        if (this.age < 25) {
            this.productivity = Math.min(1.2, this.productivity + 0.02);
        } else if (this.age > 55) {
            this.productivity = Math.max(0.5, this.productivity - 0.01);
        }
    }
    
    checkLifeStageTransitions() {
        // Child to adult
        if (this.age === 18 && this.occupation === 'student') {
            this.determineInitialOccupation();
            this.addLifeEvent('Became an adult', 'milestone');
        }
        
        // Retirement
        if (this.age === 65 && !this.isRetired) {
            this.retire();
        }
        
        // Education milestones
        if (this.age === 18 && this.education === 'primary') {
            if (Math.random() > 0.5) {
                this.education = 'secondary';
                this.addLifeEvent('Completed secondary education', 'education');
            }
        }
        
        if (this.age === 22 && this.education === 'secondary') {
            if (Math.random() > 0.7) {
                this.education = 'higher';
                this.addLifeEvent('Completed higher education', 'education');
                this.determineInitialOccupation(); // May get better job
            }
        }
    }
    
    checkRandomEvents() {
        const eventChance = Math.random();
        
        if (eventChance < 0.05) { // 5% chance of random event
            this.triggerRandomEvent();
        }
    }
    
    checkMortality() {
        // Calculate mortality risk
        let mortalityRisk = 0.001; // Base 0.1% per year
        
        // Age increases risk
        if (this.age > 60) {
            mortalityRisk += (this.age - 60) * 0.002;
        }
        
        // Health affects risk
        mortalityRisk += (100 - this.health) * 0.0001;
        
        // Check if citizen dies
        if (Math.random() < mortalityRisk) {
            this.die('natural causes');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EMPLOYMENT & ECONOMICS
    // ═══════════════════════════════════════════════════════════════════════
    
    calculateIncome() {
        if (!this.isEmployed || this.isRetired) {
            this.income = this.isRetired ? this.wealth * 0.05 : 0; // Retirement income
            return;
        }
        
        // Base income by occupation
        const occupationIncomes = {
            laborer: 20000,
            farmer: 25000,
            clerk: 30000,
            craftsperson: 35000,
            technician: 40000,
            manager: 50000,
            teacher: 45000,
            trader: 55000,
            doctor: 80000,
            engineer: 75000,
            scientist: 70000,
            lawyer: 85000,
            administrator: 60000,
            professor: 65000
        };
        
        let baseIncome = occupationIncomes[this.occupation] || 15000;
        
        // Modify by skill level
        baseIncome *= (0.5 + (this.jobSkill / 100));
        
        // Modify by productivity
        baseIncome *= this.productivity;
        
        // Add some randomness
        baseIncome *= (0.8 + Math.random() * 0.4);
        
        this.income = Math.floor(baseIncome);
    }
    
    changeJob(newOccupation) {
        if (this.age < 18 || this.isRetired) return false;
        
        const oldOccupation = this.occupation;
        this.occupation = newOccupation;
        this.isEmployed = newOccupation !== 'unemployed';
        
        this.calculateIncome();
        
        if (oldOccupation !== newOccupation) {
            this.addLifeEvent(`Changed job from ${oldOccupation} to ${newOccupation}`, 'career');
        }
        
        return true;
    }
    
    retire() {
        if (this.isRetired) return false;
        
        this.isRetired = true;
        this.occupation = 'retired';
        this.isEmployed = false;
        
        // Retirement wealth boost
        this.wealth += this.income * 5; // 5 years of income as retirement savings
        
        this.calculateIncome();
        this.addLifeEvent('Retired from active work', 'milestone');
        
        return true;
    }
    
    payTaxes(taxRate) {
        const taxAmount = this.income * taxRate;
        this.wealth = Math.max(0, this.wealth - taxAmount);
        this.taxesPaid += taxAmount;
        
        return taxAmount;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // LIFE EVENTS & RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════════════════
    
    addLifeEvent(description, type = 'general') {
        const event = {
            id: Date.now(),
            timestamp: Date.now(),
            age: this.age,
            description,
            type
        };
        
        this.lifeEvents.push(event);
        
        // Keep only last 20 events
        if (this.lifeEvents.length > 20) {
            this.lifeEvents = this.lifeEvents.slice(-20);
        }
        
        return event;
    }
    
    triggerRandomEvent() {
        const events = [
            { desc: 'Won a small lottery', type: 'fortune', effect: () => { this.wealth += 1000; this.happiness += 10; } },
            { desc: 'Got promoted at work', type: 'career', effect: () => { this.income *= 1.2; this.happiness += 5; } },
            { desc: 'Had a minor accident', type: 'misfortune', effect: () => { this.health -= 10; this.wealth -= 500; } },
            { desc: 'Made a new friend', type: 'social', effect: () => { this.happiness += 5; } },
            { desc: 'Learned a new skill', type: 'education', effect: () => { this.jobSkill += 5; } },
            { desc: 'Had a health scare', type: 'health', effect: () => { this.health -= 5; this.happiness -= 5; } },
            { desc: 'Received recognition', type: 'achievement', effect: () => { this.happiness += 10; this.loyalty += 5; } },
            { desc: 'Lost some money gambling', type: 'misfortune', effect: () => { this.wealth -= 200; this.happiness -= 3; } }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        this.addLifeEvent(event.desc, event.type);
        
        if (event.effect) {
            event.effect();
        }
        
        // Clamp values
        this.health = Math.max(0, Math.min(100, this.health));
        this.happiness = Math.max(0, Math.min(100, this.happiness));
        this.loyalty = Math.max(0, Math.min(100, this.loyalty));
        this.wealth = Math.max(0, this.wealth);
    }
    
    addRelationship(otherCitizenId, type) {
        this.relationships.set(otherCitizenId, {
            type: type, // 'friend', 'family', 'romantic', 'rival'
            strength: 50 + Math.random() * 50,
            formed: Date.now()
        });
    }
    
    die(cause = 'unknown') {
        this.isAlive = false;
        this.addLifeEvent(`Died from ${cause}`, 'death');
        
        // Death affects other citizens (family/friends)
        this.notifyRelationshipsOfDeath();
        
        return {
            citizen: this,
            cause: cause,
            age: this.age,
            wealth: this.wealth
        };
    }
    
    notifyRelationshipsOfDeath() {
        // This would notify related citizens
        // For now, just record the event
        for (const [citizenId, relationship] of this.relationships) {
            // In a full implementation, this would reduce happiness of related citizens
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Update citizen based on Nation's current state
     */
    updateFromNationState() {
        if (!window.Nation || !this.contributesToNationStats) return;
        
        const nation = window.Nation;
        
        // Update happiness based on Nation factors
        this.updateHappinessFromNation(nation);
        
        // Update health based on Nation healthcare
        this.updateHealthFromNation(nation);
        
        // Update loyalty based on Nation performance
        this.updateLoyaltyFromNation(nation);
        
        // Update employment based on Nation economy
        this.updateEmploymentFromNation(nation);
        
        return true;
    }
    
    updateHappinessFromNation(nation) {
        const factors = {
            economicGrowth: nation.gdp > 0 ? 5 : -5,
            unemployment: this.isEmployed ? 0 : -10,
            healthcare: (100 - nation.nationStats.disease) / 100 * 10,
            disease: nation.nationStats.disease,
            crime: nation.nationStats.crime,
            education: nation.nationStats.literacy,
            pollution: nation.nationStats.pollution,
            governmentEfficiency: nation.stability
        };
        
        this.updateHappiness(factors);
    }
    
    updateHealthFromNation(nation) {
        // Nation's healthcare affects citizen health
        const healthcareQuality = (100 - nation.nationStats.disease) / 100;
        const pollutionEffect = nation.nationStats.pollution * 0.1;
        
        let healthChange = 0;
        healthChange += healthcareQuality * 2; // +2 max for good healthcare
        healthChange -= pollutionEffect; // Pollution reduces health
        
        // Hospital effects
        if (nation.improvementEffects?.diseaseReduction) {
            healthChange += nation.improvementEffects.diseaseReduction * 10;
        }
        
        this.health = Math.max(0, Math.min(100, this.health + healthChange));
    }
    
    updateLoyaltyFromNation(nation) {
        const factors = {
            governmentEfficiency: nation.stability,
            atWar: false, // Would need war system integration
            warSupport: 50,
            victoryInWar: false,
            defeatInWar: false,
            gdpGrowth: nation.gdp > 0 ? 3 : -3
        };
        
        this.updateLoyalty(factors);
    }
    
    updateEmploymentFromNation(nation) {
        if (this.age < 18 || this.age > 65) return; // Not working age
        
        // Simple employment model based on Nation's economy
        const employmentRate = Math.min(95, Math.max(60, 
            70 + (nation.stability - 50) * 0.3 + (nation.happiness - 50) * 0.2
        )) / 100;
        
        if (!this.isEmployed && Math.random() < employmentRate * 0.1) {
            // Chance to find employment
            this.findJob();
        } else if (this.isEmployed && Math.random() < (1 - employmentRate) * 0.05) {
            // Chance to lose employment
            this.loseJob();
        }
    }
    
    /**
     * Contribute to Nation's tax revenue
     */
    payTaxesToNation(taxRate) {
        if (!window.Nation || this.income <= 0) return 0;
        
        const taxAmount = this.income * (taxRate / 100);
        const actualTaxPaid = Math.min(taxAmount, this.wealth);
        
        // Pay taxes
        this.wealth = Math.max(0, this.wealth - actualTaxPaid);
        this.taxesPaid += actualTaxPaid;
        
        // Contribute to Nation's tax revenue
        window.Nation.taxRevenue = (window.Nation.taxRevenue || 0) + actualTaxPaid;
        window.Nation.totalTaxEarned = (window.Nation.totalTaxEarned || 0) + actualTaxPaid;
        
        return actualTaxPaid;
    }
    
    /**
     * Get aggregated citizen data for Nation statistics
     */
    getStatsContribution() {
        return {
            happiness: this.happiness,
            health: this.health,
            loyalty: this.loyalty,
            income: this.income,
            wealth: this.wealth,
            education: this.education,
            isEmployed: this.isEmployed,
            isCriminal: this.isCriminal,
            age: this.age,
            productivity: this.productivity
        };
    }
    
    /**
     * Remove this citizen from Nation tracking
     */
    removeFromNation() {
        if (!window.Nation?.citizens) return;
        
        const index = window.Nation.citizens.indexOf(this.id);
        if (index !== -1) {
            window.Nation.citizens.splice(index, 1);
        }
    }
    
    updateHappiness(factors) {
        let happinessChange = 0;
        
        // Economic factors
        if (factors.economicGrowth > 0) happinessChange += factors.economicGrowth * 2;
        if (factors.unemployment > 10) happinessChange -= (factors.unemployment - 10) * 0.5;
        
        // Health factors
        if (factors.healthcare > 50) happinessChange += (factors.healthcare - 50) * 0.1;
        if (factors.disease > 20) happinessChange -= (factors.disease - 20) * 0.2;
        
        // Social factors
        if (factors.crime > 30) happinessChange -= (factors.crime - 30) * 0.3;
        if (factors.education > 60) happinessChange += (factors.education - 60) * 0.1;
        
        // Environmental factors
        if (factors.pollution > 50) happinessChange -= (factors.pollution - 50) * 0.2;
        
        // Personal factors
        if (this.health < 50) happinessChange -= (50 - this.health) * 0.1;
        if (this.wealth < 500) happinessChange -= 5;
        if (!this.isEmployed && this.age > 18 && this.age < 65) happinessChange -= 10;
        
        this.happiness = Math.max(0, Math.min(100, this.happiness + happinessChange));
        
        return happinessChange;
    }
    
    updateLoyalty(factors) {
        let loyaltyChange = 0;
        
        // Government performance
        if (factors.governmentEfficiency > 70) loyaltyChange += 2;
        if (factors.governmentEfficiency < 30) loyaltyChange -= 3;
        
        // War and peace
        if (factors.atWar && factors.warSupport < 50) loyaltyChange -= 5;
        if (factors.victoryInWar) loyaltyChange += 10;
        if (factors.defeatInWar) loyaltyChange -= 10;
        
        // Economic performance
        if (factors.gdpGrowth > 5) loyaltyChange += 3;
        if (factors.gdpGrowth < -5) loyaltyChange -= 5;
        
        // Personal experience
        if (this.happiness > 70) loyaltyChange += 1;
        if (this.happiness < 30) loyaltyChange -= 2;
        
        this.loyalty = Math.max(0, Math.min(100, this.loyalty + loyaltyChange));
        
        return loyaltyChange;
    }
    
    getOpinionOnPolicy(policy) {
        // Generate opinion based on political leanings and personal situation
        let opinion = 0; // -100 to 100
        
        switch (policy.type) {
            case 'tax_increase':
                opinion -= this.politicalLeanings.economic;
                if (this.socialClass === 'upper') opinion -= 20;
                break;
                
            case 'welfare_expansion':
                opinion += Math.abs(this.politicalLeanings.economic);
                if (this.socialClass === 'lower') opinion += 20;
                break;
                
            case 'military_expansion':
                opinion += this.politicalLeanings.authoritarian * 0.5;
                if (this.isMilitary) opinion += 30;
                break;
                
            case 'education_funding':
                opinion += this.culturalValues.innovation * 0.3;
                if (this.education === 'higher') opinion += 15;
                break;
                
            case 'environmental_protection':
                opinion += this.culturalValues.environmentalism * 0.5;
                break;
        }
        
        // Add some randomness
        opinion += (-10 + Math.random() * 20);
        
        return Math.max(-100, Math.min(100, opinion));
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STATISTICS & INFORMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    getStats() {
        return {
            id: this.id,
            name: this.name,
            age: this.age,
            gender: this.gender,
            
            // Economic
            occupation: this.occupation,
            education: this.education,
            income: this.income,
            wealth: this.wealth,
            socialClass: this.socialClass,
            
            // Status
            health: this.health,
            happiness: this.happiness,
            loyalty: this.loyalty,
            productivity: this.productivity,
            
            // Demographics
            ethnicity: this.ethnicity,
            religion: this.religion,
            
            // Life status
            isAlive: this.isAlive,
            isEmployed: this.isEmployed,
            isMilitary: this.isMilitary,
            isRetired: this.isRetired,
            
            // Relationships
            relationshipCount: this.relationships.size,
            lifeEventCount: this.lifeEvents.length,
            
            // Expectations
            lifeExpectancy: this.lifeExpectancy,
            yearsLived: this.age,
            estimatedYearsRemaining: Math.max(0, this.lifeExpectancy - this.age)
        };
    }
    
    getCitizenSummary() {
        return {
            name: this.name,
            age: this.age,
            occupation: this.occupation,
            education: this.education,
            health: Math.floor(this.health),
            happiness: Math.floor(this.happiness),
            loyalty: Math.floor(this.loyalty),
            wealth: Math.floor(this.wealth),
            socialClass: this.socialClass,
            isEmployed: this.isEmployed
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    serialize() {
        return {
            id: this.id,
            nationId: this.nationId,
            cityId: this.cityId,
            born: this.born,
            
            // Personal information
            name: this.name,
            age: this.age,
            gender: this.gender,
            occupation: this.occupation,
            education: this.education,
            health: this.health,
            happiness: this.happiness,
            
            // Economic status
            income: this.income,
            wealth: this.wealth,
            jobSkill: this.jobSkill,
            productivity: this.productivity,
            taxesPaid: this.taxesPaid,
            
            // Social status
            socialClass: this.socialClass,
            loyalty: this.loyalty,
            politicalLeanings: { ...this.politicalLeanings },
            culturalValues: { ...this.culturalValues },
            
            // Demographics
            ethnicity: this.ethnicity,
            religion: this.religion,
            language: this.language,
            
            // Status tracking
            isAlive: this.isAlive,
            isEmployed: this.isEmployed,
            isMilitary: this.isMilitary,
            isRetired: this.isRetired,
            isCriminal: this.isCriminal,
            
            // Life statistics
            lifeExpectancy: this.lifeExpectancy,
            reproductiveYears: this.reproductiveYears,
            workingYears: this.workingYears,
            
            // Events and relationships
            lifeEvents: [...this.lifeEvents],
            achievements: [...this.achievements],
            relationships: Array.from(this.relationships.entries())
        };
    }
    
    static deserialize(data) {
        const citizen = new Citizen(data.nationId, data.cityId);
        
        // Restore properties
        citizen.id = data.id;
        citizen.born = data.born || Date.now();
        
        // Personal information
        citizen.name = data.name || citizen.name;
        citizen.age = data.age || citizen.age;
        citizen.gender = data.gender || citizen.gender;
        citizen.occupation = data.occupation || citizen.occupation;
        citizen.education = data.education || citizen.education;
        citizen.health = data.health || citizen.health;
        citizen.happiness = data.happiness || citizen.happiness;
        
        // Economic status
        citizen.income = data.income || 0;
        citizen.wealth = data.wealth || citizen.wealth;
        citizen.jobSkill = data.jobSkill || citizen.jobSkill;
        citizen.productivity = data.productivity || citizen.productivity;
        citizen.taxesPaid = data.taxesPaid || 0;
        
        // Social status
        citizen.socialClass = data.socialClass || citizen.socialClass;
        citizen.loyalty = data.loyalty || citizen.loyalty;
        if (data.politicalLeanings) citizen.politicalLeanings = { ...data.politicalLeanings };
        if (data.culturalValues) citizen.culturalValues = { ...data.culturalValues };
        
        // Demographics
        citizen.ethnicity = data.ethnicity || citizen.ethnicity;
        citizen.religion = data.religion || citizen.religion;
        citizen.language = data.language || citizen.language;
        
        // Status tracking
        citizen.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        citizen.isEmployed = data.isEmployed !== undefined ? data.isEmployed : false;
        citizen.isMilitary = data.isMilitary || false;
        citizen.isRetired = data.isRetired || false;
        citizen.isCriminal = data.isCriminal || false;
        
        // Life statistics
        citizen.lifeExpectancy = data.lifeExpectancy || citizen.lifeExpectancy;
        if (data.reproductiveYears) citizen.reproductiveYears = data.reproductiveYears;
        if (data.workingYears) citizen.workingYears = data.workingYears;
        
        // Events and relationships
        citizen.lifeEvents = data.lifeEvents || [];
        citizen.achievements = data.achievements || [];
        if (data.relationships) {
            citizen.relationships = new Map(data.relationships);
        }
        
        return citizen;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Citizen = Citizen;
}