/**
 * Improvements System - Empire Builder
 * Handles nation improvements like ports, mines, factories, embassies, etc.
 */

class ImprovementsSystem {
    constructor() {
        this.isInitialized = false;
        
        // Improvement definitions
        this.improvementTypes = {
            port: {
                name: 'Port',
                description: 'Allows trade with other nations',
                maxCount: 4,
                cost: { money: 500000 }, // $500K
                effect: 'Enables 1 trade partner per port',
                category: 'trade'
            },
            
            mine: {
                name: 'Mine',
                description: 'Increases basic resource production',
                maxCount: 4,
                cost: { money: 750000 }, // $750K
                effect: '+10% basic resource production per mine',
                category: 'production'
            },
            
            assemblyPlant: {
                name: 'Assembly Plant',
                description: 'Produces manufactured goods',
                maxCount: 5,
                cost: { money: 1500000, steel: 50, cement: 30 }, // $1.5M + materials
                effect: '+5% manufactured goods production per plant',
                category: 'production'
            },
            
            barracks: {
                name: 'Barracks',
                description: 'Improves soldier effectiveness',
                maxCount: 5,
                cost: { money: 1200000, cement: 40, lumber: 20 },
                effect: '+10% soldier effectiveness per barracks',
                category: 'military'
            },
            
            factory: {
                name: 'Factory',
                description: 'Improves tank effectiveness',
                maxCount: 5,
                cost: { money: 1800000, steel: 60, aluminum: 25 },
                effect: '+10% tank effectiveness per factory',
                category: 'military'
            },
            
            airforceBase: {
                name: 'Airforce Base',
                description: 'Improves aircraft effectiveness',
                maxCount: 5,
                cost: { money: 2500000, aluminum: 80, cement: 50 },
                effect: '+10% aircraft effectiveness per base',
                category: 'military'
            },
            
            harbor: {
                name: 'Harbor',
                description: 'Improves ship effectiveness',
                maxCount: 5,
                cost: { money: 2200000, steel: 70, cement: 60 },
                effect: '+10% ship effectiveness per harbor',
                category: 'military'
            },
            
            embassy: {
                name: 'Embassy',
                description: 'Enables diplomatic relations',
                maxCount: 5,
                cost: { money: 1000000, lumber: 30, paper: 50 },
                effect: '1 friend/foe slot per embassy, special bonuses at 5',
                category: 'diplomacy'
            },
            
            foreignAffairsOffice: {
                name: 'Foreign Affairs Office',
                description: 'Enables diplomacy with other nations',
                maxCount: 1,
                cost: { money: 3000000, paper: 100, lumber: 50 },
                effect: 'Required for all diplomatic actions',
                category: 'diplomacy'
            },
            
            internalAffairsOffice: {
                name: 'Internal Affairs Office',
                description: 'Enables domestic policy selection',
                maxCount: 1,
                cost: { money: 2500000, cement: 40, paper: 75 },
                effect: 'Allows selection of 10 domestic policies',
                category: 'administration'
            },
            
            hospital: {
                name: 'Hospital',
                description: 'Reduces disease rates',
                maxCount: 5,
                cost: { money: 800000, cement: 25, steel: 15 },
                effect: '-5% disease rate per hospital (max -25%)',
                category: 'infrastructure'
            },
            
            policeStation: {
                name: 'Police Station',
                description: 'Reduces crime rates',
                maxCount: 5,
                cost: { money: 600000, cement: 20, lumber: 10 },
                effect: '-5% crime rate per station (max -25%)',
                category: 'infrastructure'
            },
            
            recyclingCenter: {
                name: 'Recycling Center',
                description: 'Reduces pollution levels',
                maxCount: 5,
                cost: { money: 1000000, steel: 30, aluminum: 20 },
                effect: '-5% pollution per center (max -25%)',
                category: 'infrastructure'
            },
            
            school: {
                name: 'School',
                description: 'Increases literacy rate',
                maxCount: 5,
                cost: { money: 900000, cement: 30, lumber: 25 },
                effect: '+7.5% literacy rate per school (max +37.5%)',
                category: 'infrastructure'
            },
            
            casino: {
                name: 'Casino',
                description: 'Increases taxable income but raises crime',
                maxCount: 5,
                cost: { money: 1500000, lumber: 40, aluminum: 15 },
                effect: '+5% taxable income per casino, but increases crime and reduces happiness',
                category: 'economic'
            },
            
            park: {
                name: 'Park',
                description: 'Improves environment and happiness',
                maxCount: 5,
                cost: { money: 400000, lumber: 50 },
                effect: 'Increases environment quality and happiness, reduces pollution',
                category: 'infrastructure'
            }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the improvements system
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('Improvements System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('build_improvement', this.buildImprovement, this);
        EventBus.on('demolish_improvement', this.demolishImprovement, this);
        EventBus.on('get_improvement_info', this.getImprovementInfo, this);
    }
    
    /**
     * Build an improvement
     */
    buildImprovement(data) {
        const { improvementType, nation } = data;
        
        if (!this.improvementTypes[improvementType]) {
            console.warn(`Unknown improvement type: ${improvementType}`);
            return false;
        }
        
        const improvement = this.improvementTypes[improvementType];
        const currentCount = this.getImprovementCount(nation, improvementType);
        
        // Check max count
        if (currentCount >= improvement.maxCount) {
            console.warn(`Maximum ${improvement.name} limit reached (${improvement.maxCount})`);
            return false;
        }
        
        // Check costs
        if (!this.canAffordImprovement(nation, improvement)) {
            console.warn(`Cannot afford ${improvement.name}`);
            return false;
        }
        
        // Pay costs
        this.payImprovementCost(nation, improvement);
        
        // Add improvement
        if (!nation.improvements) nation.improvements = {};
        if (!nation.improvements[improvementType]) nation.improvements[improvementType] = 0;
        nation.improvements[improvementType]++;
        
        // Apply effects
        this.applyImprovementEffects(nation, improvementType);
        
        EventBus.emit('improvement_built', {
            type: improvementType,
            name: improvement.name,
            count: nation.improvements[improvementType],
            nation: nation
        });
        
        console.log(`Built ${improvement.name} (${nation.improvements[improvementType]}/${improvement.maxCount})`);
        return true;
    }
    
    /**
     * Check if nation can afford improvement
     */
    canAffordImprovement(nation, improvement) {
        return Object.entries(improvement.cost).every(([resource, amount]) => {
            if (resource === 'money') {
                return nation.money >= amount;
            }
            return (nation.resources[resource] || 0) >= amount;
        });
    }
    
    /**
     * Pay for improvement cost
     */
    payImprovementCost(nation, improvement) {
        Object.entries(improvement.cost).forEach(([resource, amount]) => {
            if (resource === 'money') {
                nation.money -= amount;
            } else {
                nation.resources[resource] -= amount;
            }
        });
    }
    
    /**
     * Get current count of improvement type
     */
    getImprovementCount(nation, improvementType) {
        return nation.improvements?.[improvementType] || 0;
    }
    
    /**
     * Apply improvement effects to nation
     */
    applyImprovementEffects(nation, improvementType) {
        if (!nation.improvementEffects) nation.improvementEffects = {};
        
        const count = this.getImprovementCount(nation, improvementType);
        
        switch (improvementType) {
            case 'port':
                nation.improvementEffects.maxTradePartners = count;
                break;
                
            case 'mine':
                nation.improvementEffects.basicResourceBonus = count * 0.10; // 10% per mine
                break;
                
            case 'assemblyPlant':
                nation.improvementEffects.manufacturedGoodsBonus = count * 0.05; // 5% per plant
                break;
                
            case 'barracks':
                nation.improvementEffects.soldierEffectiveness = count * 0.10; // 10% per barracks
                break;
                
            case 'factory':
                nation.improvementEffects.tankEffectiveness = count * 0.10; // 10% per factory
                break;
                
            case 'airforceBase':
                nation.improvementEffects.aircraftEffectiveness = count * 0.10; // 10% per base
                break;
                
            case 'harbor':
                nation.improvementEffects.shipEffectiveness = count * 0.10; // 10% per harbor
                break;
                
            case 'embassy':
                this.applyEmbassyEffects(nation, count);
                break;
                
            case 'foreignAffairsOffice':
                nation.improvementEffects.canDiplomacy = true;
                break;
                
            case 'internalAffairsOffice':
                nation.improvementEffects.canSetPolicies = true;
                this.initializePolicies(nation);
                break;
                
            case 'hospital':
                nation.improvementEffects.diseaseReduction = count * 0.05; // 5% per hospital
                break;
                
            case 'policeStation':
                nation.improvementEffects.crimeReduction = count * 0.05; // 5% per station
                break;
                
            case 'recyclingCenter':
                nation.improvementEffects.pollutionReduction = count * 0.05; // 5% per center
                break;
                
            case 'school':
                nation.improvementEffects.literacyBonus = count * 0.075; // 7.5% per school
                break;
                
            case 'casino':
                nation.improvementEffects.taxableIncomeBonus = count * 0.05; // 5% per casino
                nation.improvementEffects.crimeIncrease = count * 0.03; // 3% crime increase per casino
                nation.improvementEffects.happinessDecrease = count * 2; // -2 happiness per casino
                break;
                
            case 'park':
                nation.improvementEffects.environmentBonus = count * 0.10; // 10% environment per park
                nation.improvementEffects.happinessFromParks = count * 3; // +3 happiness per park
                nation.improvementEffects.pollutionFromParks = -count * 0.05; // -5% pollution per park
                break;
        }
    }
    
    /**
     * Apply embassy effects
     */
    applyEmbassyEffects(nation, embassyCount) {
        if (!nation.diplomaticRelations) nation.diplomaticRelations = {};
        
        nation.diplomaticRelations.maxFriends = embassyCount;
        nation.diplomaticRelations.maxFoes = embassyCount;
        
        // Special bonuses at 5 embassies
        if (embassyCount >= 5) {
            nation.diplomaticRelations.canSelectBestFriend = true;
            nation.diplomaticRelations.canSelectNemesis = true;
        }
        
        // Initialize arrays if needed
        if (!nation.diplomaticRelations.friends) nation.diplomaticRelations.friends = [];
        if (!nation.diplomaticRelations.foes) nation.diplomaticRelations.foes = [];
        if (!nation.diplomaticRelations.bestFriend) nation.diplomaticRelations.bestFriend = null;
        if (!nation.diplomaticRelations.nemesis) nation.diplomaticRelations.nemesis = null;
    }
    
    /**
     * Initialize domestic policies
     */
    initializePolicies(nation) {
        if (!nation.domesticPolicies) {
            nation.domesticPolicies = {
                immigration: 'moderate',      // restrictive, moderate, open
                nuclearResearch: 'limited',   // banned, limited, active, aggressive
                education: 'public',          // private, public, mixed, elite
                healthcare: 'universal',      // private, universal, hybrid, premium
                environment: 'balanced',      // industrial, balanced, green, strict
                taxation: 'progressive',      // flat, progressive, regressive, corporate
                military: 'defensive',        // pacifist, defensive, balanced, aggressive
                trade: 'free',               // protectionist, regulated, free, laissez-faire
                surveillance: 'limited',      // none, limited, moderate, extensive
                research: 'civilian'          // civilian, dual-use, military, classified
            };
        }
    }
    
    /**
     * Set domestic policy
     */
    setDomesticPolicy(nation, policy, stance) {
        if (!nation.improvementEffects?.canSetPolicies) {
            console.warn('Internal Affairs Office required to set policies');
            return false;
        }
        
        if (!nation.domesticPolicies) {
            this.initializePolicies(nation);
        }
        
        if (!(policy in nation.domesticPolicies)) {
            console.warn(`Unknown policy: ${policy}`);
            return false;
        }
        
        const validStances = this.getPolicyStances(policy);
        if (!validStances.includes(stance)) {
            console.warn(`Invalid stance '${stance}' for policy '${policy}'`);
            return false;
        }
        
        nation.domesticPolicies[policy] = stance;
        this.applyPolicyEffects(nation);
        
        EventBus.emit('policy_changed', {
            policy: policy,
            stance: stance,
            nation: nation
        });
        
        return true;
    }
    
    /**
     * Get valid stances for a policy
     */
    getPolicyStances(policy) {
        const stances = {
            immigration: ['restrictive', 'moderate', 'open'],
            nuclearResearch: ['banned', 'limited', 'active', 'aggressive'],
            education: ['private', 'public', 'mixed', 'elite'],
            healthcare: ['private', 'universal', 'hybrid', 'premium'],
            environment: ['industrial', 'balanced', 'green', 'strict'],
            taxation: ['flat', 'progressive', 'regressive', 'corporate'],
            military: ['pacifist', 'defensive', 'balanced', 'aggressive'],
            trade: ['protectionist', 'regulated', 'free', 'laissez-faire'],
            surveillance: ['none', 'limited', 'moderate', 'extensive'],
            research: ['civilian', 'dual-use', 'military', 'classified']
        };
        return stances[policy] || [];
    }
    
    /**
     * Apply policy effects to nation
     */
    applyPolicyEffects(nation) {
        if (!nation.domesticPolicies) return;
        
        // Reset policy effects
        if (!nation.policyEffects) nation.policyEffects = {};
        
        // Immigration effects
        switch (nation.domesticPolicies.immigration) {
            case 'restrictive':
                nation.policyEffects.populationGrowth = -0.05; // -5% growth
                nation.policyEffects.culturalStability = 0.10; // +10% stability
                break;
            case 'moderate':
                nation.policyEffects.populationGrowth = 0.0;
                nation.policyEffects.culturalStability = 0.0;
                break;
            case 'open':
                nation.policyEffects.populationGrowth = 0.15; // +15% growth
                nation.policyEffects.culturalStability = -0.05; // -5% stability
                break;
        }
        
        // Nuclear Research effects
        switch (nation.domesticPolicies.nuclearResearch) {
            case 'banned':
                nation.policyEffects.nuclearCapability = 0.0;
                nation.policyEffects.internationalReputation = 0.05;
                nation.policyEffects.energyProduction = -0.10;
                break;
            case 'limited':
                nation.policyEffects.nuclearCapability = 0.25;
                nation.policyEffects.internationalReputation = 0.0;
                nation.policyEffects.energyProduction = 0.05;
                break;
            case 'active':
                nation.policyEffects.nuclearCapability = 0.75;
                nation.policyEffects.internationalReputation = -0.05;
                nation.policyEffects.energyProduction = 0.15;
                break;
            case 'aggressive':
                nation.policyEffects.nuclearCapability = 1.0;
                nation.policyEffects.internationalReputation = -0.15;
                nation.policyEffects.energyProduction = 0.25;
                nation.policyEffects.militaryThreat = 0.20;
                break;
        }
        
        // Education effects
        switch (nation.domesticPolicies.education) {
            case 'private':
                nation.policyEffects.researchBonus = 0.10;
                nation.policyEffects.socialEquality = -0.10;
                nation.policyEffects.economicGrowth = 0.05;
                break;
            case 'public':
                nation.policyEffects.researchBonus = 0.0;
                nation.policyEffects.socialEquality = 0.10;
                nation.policyEffects.economicGrowth = 0.0;
                break;
            case 'mixed':
                nation.policyEffects.researchBonus = 0.05;
                nation.policyEffects.socialEquality = 0.05;
                nation.policyEffects.economicGrowth = 0.03;
                break;
            case 'elite':
                nation.policyEffects.researchBonus = 0.20;
                nation.policyEffects.socialEquality = -0.20;
                nation.policyEffects.economicGrowth = 0.10;
                break;
        }
        
        // Healthcare effects
        switch (nation.domesticPolicies.healthcare) {
            case 'private':
                nation.policyEffects.healthcareQuality = 0.15;
                nation.policyEffects.socialEquality = -0.15;
                nation.policyEffects.governmentSpending = -0.10;
                break;
            case 'universal':
                nation.policyEffects.healthcareQuality = 0.05;
                nation.policyEffects.socialEquality = 0.15;
                nation.policyEffects.governmentSpending = 0.15;
                break;
            case 'hybrid':
                nation.policyEffects.healthcareQuality = 0.10;
                nation.policyEffects.socialEquality = 0.05;
                nation.policyEffects.governmentSpending = 0.05;
                break;
            case 'premium':
                nation.policyEffects.healthcareQuality = 0.25;
                nation.policyEffects.socialEquality = -0.25;
                nation.policyEffects.governmentSpending = 0.20;
                break;
        }
        
        // Environment effects
        switch (nation.domesticPolicies.environment) {
            case 'industrial':
                nation.policyEffects.industrialOutput = 0.20;
                nation.policyEffects.environmentalHealth = -0.20;
                nation.policyEffects.internationalReputation = -0.10;
                break;
            case 'balanced':
                nation.policyEffects.industrialOutput = 0.0;
                nation.policyEffects.environmentalHealth = 0.0;
                nation.policyEffects.internationalReputation = 0.0;
                break;
            case 'green':
                nation.policyEffects.industrialOutput = -0.10;
                nation.policyEffects.environmentalHealth = 0.15;
                nation.policyEffects.internationalReputation = 0.10;
                break;
            case 'strict':
                nation.policyEffects.industrialOutput = -0.20;
                nation.policyEffects.environmentalHealth = 0.30;
                nation.policyEffects.internationalReputation = 0.15;
                break;
        }
        
        // Taxation effects
        switch (nation.domesticPolicies.taxation) {
            case 'flat':
                nation.policyEffects.taxEfficiency = 0.10;
                nation.policyEffects.socialEquality = -0.10;
                nation.policyEffects.economicGrowth = 0.05;
                break;
            case 'progressive':
                nation.policyEffects.taxEfficiency = 0.0;
                nation.policyEffects.socialEquality = 0.10;
                nation.policyEffects.economicGrowth = 0.0;
                break;
            case 'regressive':
                nation.policyEffects.taxEfficiency = 0.05;
                nation.policyEffects.socialEquality = -0.20;
                nation.policyEffects.economicGrowth = 0.10;
                break;
            case 'corporate':
                nation.policyEffects.taxEfficiency = 0.15;
                nation.policyEffects.socialEquality = -0.15;
                nation.policyEffects.economicGrowth = 0.15;
                break;
        }
        
        // Military effects
        switch (nation.domesticPolicies.military) {
            case 'pacifist':
                nation.policyEffects.militaryStrength = -0.30;
                nation.policyEffects.diplomaticReputation = 0.15;
                nation.policyEffects.governmentSpending = -0.15;
                break;
            case 'defensive':
                nation.policyEffects.militaryStrength = 0.0;
                nation.policyEffects.diplomaticReputation = 0.05;
                nation.policyEffects.governmentSpending = 0.0;
                break;
            case 'balanced':
                nation.policyEffects.militaryStrength = 0.10;
                nation.policyEffects.diplomaticReputation = 0.0;
                nation.policyEffects.governmentSpending = 0.10;
                break;
            case 'aggressive':
                nation.policyEffects.militaryStrength = 0.25;
                nation.policyEffects.diplomaticReputation = -0.15;
                nation.policyEffects.governmentSpending = 0.25;
                break;
        }
        
        // Trade effects
        switch (nation.domesticPolicies.trade) {
            case 'protectionist':
                nation.policyEffects.tradeIncome = -0.15;
                nation.policyEffects.domesticIndustry = 0.20;
                nation.policyEffects.internationalRelations = -0.10;
                break;
            case 'regulated':
                nation.policyEffects.tradeIncome = -0.05;
                nation.policyEffects.domesticIndustry = 0.10;
                nation.policyEffects.internationalRelations = 0.0;
                break;
            case 'free':
                nation.policyEffects.tradeIncome = 0.15;
                nation.policyEffects.domesticIndustry = -0.05;
                nation.policyEffects.internationalRelations = 0.10;
                break;
            case 'laissez-faire':
                nation.policyEffects.tradeIncome = 0.30;
                nation.policyEffects.domesticIndustry = -0.15;
                nation.policyEffects.internationalRelations = 0.15;
                break;
        }
        
        // Surveillance effects
        switch (nation.domesticPolicies.surveillance) {
            case 'none':
                nation.policyEffects.internalSecurity = -0.10;
                nation.policyEffects.civilLiberties = 0.20;
                nation.policyEffects.espionageDefense = -0.20;
                break;
            case 'limited':
                nation.policyEffects.internalSecurity = 0.0;
                nation.policyEffects.civilLiberties = 0.10;
                nation.policyEffects.espionageDefense = 0.0;
                break;
            case 'moderate':
                nation.policyEffects.internalSecurity = 0.10;
                nation.policyEffects.civilLiberties = -0.05;
                nation.policyEffects.espionageDefense = 0.15;
                break;
            case 'extensive':
                nation.policyEffects.internalSecurity = 0.25;
                nation.policyEffects.civilLiberties = -0.20;
                nation.policyEffects.espionageDefense = 0.30;
                break;
        }
        
        // Research effects
        switch (nation.domesticPolicies.research) {
            case 'civilian':
                nation.policyEffects.civilianResearch = 0.15;
                nation.policyEffects.militaryResearch = -0.10;
                nation.policyEffects.internationalCooperation = 0.15;
                break;
            case 'dual-use':
                nation.policyEffects.civilianResearch = 0.10;
                nation.policyEffects.militaryResearch = 0.10;
                nation.policyEffects.internationalCooperation = 0.05;
                break;
            case 'military':
                nation.policyEffects.civilianResearch = -0.05;
                nation.policyEffects.militaryResearch = 0.25;
                nation.policyEffects.internationalCooperation = -0.10;
                break;
            case 'classified':
                nation.policyEffects.civilianResearch = 0.05;
                nation.policyEffects.militaryResearch = 0.35;
                nation.policyEffects.internationalCooperation = -0.25;
                break;
        }
        
        // Calculate combined effects and synergies
        this.calculatePolicySynergies(nation);
    }
    
    /**
     * Calculate policy synergies and combinations
     */
    calculatePolicySynergies(nation) {
        if (!nation.policyEffects) return;
        
        const policies = nation.domesticPolicies;
        
        // Authoritarian synergy (extensive surveillance + aggressive military + regressive taxation)
        if (policies.surveillance === 'extensive' && 
            policies.military === 'aggressive' && 
            policies.taxation === 'regressive') {
            nation.policyEffects.authoritarianBonus = 0.20; // +20% to military and control
            nation.policyEffects.democraticPenalty = -0.25; // -25% to happiness and relations
        }
        
        // Liberal democracy synergy (open immigration + universal healthcare + progressive taxation)
        if (policies.immigration === 'open' && 
            policies.healthcare === 'universal' && 
            policies.taxation === 'progressive') {
            nation.policyEffects.democraticBonus = 0.15; // +15% to happiness and growth
            nation.policyEffects.economicEfficiency = -0.10; // -10% economic efficiency
        }
        
        // Technocracy synergy (elite education + dual-use research + corporate taxation)
        if (policies.education === 'elite' && 
            policies.research === 'dual-use' && 
            policies.taxation === 'corporate') {
            nation.policyEffects.technocraticBonus = 0.30; // +30% to research and development
            nation.policyEffects.socialCohesion = -0.15; // -15% to social stability
        }
        
        // Green state synergy (strict environment + green energy + universal healthcare)
        if (policies.environment === 'strict' && 
            policies.healthcare === 'universal' && 
            policies.research === 'civilian') {
            nation.policyEffects.sustainabilityBonus = 0.25; // +25% to long-term growth
            nation.policyEffects.industrialPenalty = -0.20; // -20% to immediate production
        }
    }
    
    /**
     * Calculate diplomatic combat bonuses
     */
    calculateDiplomaticCombatBonus(nation, targetNation, warParticipants) {
        if (!nation.diplomaticRelations) return 0;
        
        let bonus = 0;
        let friendsInWar = 0;
        let foesInWar = 0;
        
        // Count friends and foes in the war
        warParticipants.forEach(participantId => {
            if (nation.diplomaticRelations.friends.includes(participantId)) {
                friendsInWar++;
            }
            if (nation.diplomaticRelations.foes.includes(participantId)) {
                foesInWar++;
            }
        });
        
        // Friend bonuses (5% per friend, stacking to 25% for all 5)
        bonus += friendsInWar * 0.05;
        
        // Foe penalties/bonuses (both sides get +5% per foe relationship)
        bonus += foesInWar * 0.05;
        
        // Best friend bonus (15% when in same war)
        if (nation.diplomaticRelations.bestFriend && 
            warParticipants.includes(nation.diplomaticRelations.bestFriend)) {
            bonus += 0.15;
        }
        
        // Nemesis bonus (15% when fighting nemesis)
        if (nation.diplomaticRelations.nemesis && 
            warParticipants.includes(nation.diplomaticRelations.nemesis)) {
            bonus += 0.15;
        }
        
        // Maximum theoretical bonus: 5 friends (25%) + 5 foes (25%) + best friend (15%) + nemesis (15%) = 80%
        // But in practice, if all 12 are in a war, it's even higher due to cross-stacking
        
        return Math.min(bonus, 1.25); // Cap at 125% bonus
    }
    
    /**
     * Get improvement information
     */
    getImprovementInfo(data) {
        const { improvementType } = data;
        
        if (!this.improvementTypes[improvementType]) {
            return null;
        }
        
        return {
            ...this.improvementTypes[improvementType],
            canAfford: window.Nation ? this.canAffordImprovement(window.Nation, this.improvementTypes[improvementType]) : false,
            currentCount: window.Nation ? this.getImprovementCount(window.Nation, improvementType) : 0
        };
    }
    
    /**
     * Demolish improvement
     */
    demolishImprovement(data) {
        const { improvementType, nation } = data;
        
        if (!nation.improvements?.[improvementType] || nation.improvements[improvementType] <= 0) {
            console.warn(`No ${improvementType} to demolish`);
            return false;
        }
        
        nation.improvements[improvementType]--;
        
        // Handle special demolition effects
        if (improvementType === 'embassy') {
            this.handleEmbassyDemolition(nation);
        }
        
        // Reapply effects with new count
        this.applyImprovementEffects(nation, improvementType);
        
        EventBus.emit('improvement_demolished', {
            type: improvementType,
            count: nation.improvements[improvementType],
            nation: nation
        });
        
        return true;
    }
    
    /**
     * Handle embassy demolition effects
     */
    handleEmbassyDemolition(nation) {
        if (!nation.diplomaticRelations) return;
        
        const maxRelations = nation.improvements.embassy || 0;
        
        // Remove excess friends/foes
        if (nation.diplomaticRelations.friends.length > maxRelations) {
            const removed = nation.diplomaticRelations.friends.splice(maxRelations);
            console.log(`Removed friends due to embassy demolition: ${removed.join(', ')}`);
        }
        
        if (nation.diplomaticRelations.foes.length > maxRelations) {
            const removed = nation.diplomaticRelations.foes.splice(maxRelations);
            console.log(`Removed foes due to embassy demolition: ${removed.join(', ')}`);
        }
        
        // Remove best friend/nemesis if less than 5 embassies
        if (maxRelations < 5) {
            nation.diplomaticRelations.bestFriend = null;
            nation.diplomaticRelations.nemesis = null;
            nation.diplomaticRelations.canSelectBestFriend = false;
            nation.diplomaticRelations.canSelectNemesis = false;
        }
    }
    
    /**
     * Get all improvements for a nation
     */
    getNationImprovements(nation) {
        const improvements = {};
        
        Object.keys(this.improvementTypes).forEach(type => {
            improvements[type] = {
                ...this.improvementTypes[type],
                count: this.getImprovementCount(nation, type),
                canAfford: this.canAffordImprovement(nation, this.improvementTypes[type]),
                isMaxed: this.getImprovementCount(nation, type) >= this.improvementTypes[type].maxCount
            };
        });
        
        return improvements;
    }
    
    /**
     * Destroy the improvements system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        EventBus.off('build_improvement', this.buildImprovement, this);
        EventBus.off('demolish_improvement', this.demolishImprovement, this);
        EventBus.off('get_improvement_info', this.getImprovementInfo, this);
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImprovementsSystem;
} else {
    window.ImprovementsSystem = ImprovementsSystem;
}