/**
 * Technology Entity - Represents research technologies and advancements
 * Integrates with Nation's ResearchSystem and external research data files
 */

class Technology {
    constructor(id, name = '', description = '') {
        this.id = id;
        this.name = name || id;
        this.description = description;
        this.discovered = null;
        this.researchStarted = null;
        
        // Technology Properties (from research database)
        this.category = this.getCategory();
        this.tier = this.getTier();
        this.cost = this.getResearchCost();
        this.time = this.getResearchTime();
        this.prerequisites = this.getPrerequisites();
        
        // Research Status (integrates with Nation.currentResearch)
        this.isResearched = false;
        this.isBeingResearched = false;
        this.researchProgress = 0;
        this.researchedBy = []; // List of nation IDs that have researched this
        
        // Technology Effects (applied to Nation)
        this.effects = this.getEffects();
        this.unlocks = this.getUnlocks();
        this.bonuses = this.getBonuses();
        
        // Advanced Properties
        this.rarity = this.getRarity();
        this.difficulty = this.getDifficulty();
        this.applications = this.getApplications();
        this.obsoletes = this.getObsoleteTechnologies();
        
        // Research Integration
        this.researchDatabase = null; // Link to research data
        this.baseResearchRate = 1.0;
        this.researchMultipliers = {};
        this.collaborativeBonus = 0;
        
        // Historical Data
        this.firstDiscoveredBy = null;
        this.firstDiscoveredAt = null;
        this.totalResearchInvestment = 0;
        this.researchAttempts = 0;
        
        this.initializeTechnologyData();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TECHNOLOGY DATA INITIALIZATION (Uses Nation's Research Database)
    // ═══════════════════════════════════════════════════════════════════════
    
    initializeTechnologyData() {
        // Get technology data from Nation's research system
        const techData = this.getTechnologyData();
        
        if (techData) {
            this.name = techData.name || this.name;
            this.description = techData.description || this.description;
            this.category = techData.category || this.category;
            this.tier = techData.tier || this.tier;
            this.cost = techData.cost || this.cost;
            this.time = techData.time || this.time;
            this.prerequisites = techData.prerequisites || [];
            this.effects = techData.effects || {};
            this.unlocks = techData.unlocks || [];
            this.bonuses = techData.bonuses || {};
            this.rarity = techData.rarity || 'common';
            this.difficulty = techData.difficulty || 'medium';
            this.applications = techData.applications || [];
            this.obsoletes = techData.obsoletes || [];
        }
    }
    
    getTechnologyData() {
        // First try to use DataIntegrationSystem's research database
        if (typeof window !== 'undefined' && window.DataIntegrationSystem?.researchDatabase) {
            const researchDb = window.DataIntegrationSystem.researchDatabase;
            if (researchDb[this.id]) {
                return researchDb[this.id];
            }
        }
        
        // Try ResearchDatabase if available
        if (typeof ResearchDatabase !== 'undefined' && ResearchDatabase.research) {
            return ResearchDatabase.research[this.id];
        }
        
        // Try individual research data files
        if (typeof window !== 'undefined') {
            const allResearch = {
                ...window.EconomyResearch,
                ...window.HealthcareResearch, 
                ...window.ProductionResearch,
                ...window.WarResearch
            };
            
            if (allResearch[this.id]) {
                return allResearch[this.id];
            }
        }
        
        // Try Nation's research system
        if (window.GameEngine?.systems?.research) {
            const researchSystem = window.GameEngine.systems.research;
            if (researchSystem.technologies && researchSystem.technologies[this.id]) {
                return researchSystem.technologies[this.id];
            }
        }
        
        // Fallback to basic technology data
        return this.getFallbackTechnologyData();
    }
    
    getFallbackTechnologyData() {
        // Basic technology data matching Nation's system
        const technologies = {
            // Tier 1 - Basic Technologies (0-500 tech)
            'agriculture': {
                name: 'Agriculture',
                description: 'Basic farming techniques and crop cultivation',
                category: 'economic',
                tier: 1,
                cost: 100,
                time: 5,
                prerequisites: [],
                effects: { foodProduction: 1.2, populationGrowth: 1.1 },
                unlocks: ['irrigation', 'domestication'],
                bonuses: { farmEfficiency: 0.15 },
                applications: ['farming', 'food_security'],
                rarity: 'common'
            },
            'writing': {
                name: 'Writing',
                description: 'Development of written language and record keeping',
                category: 'knowledge',
                tier: 1,
                cost: 150,
                time: 7,
                prerequisites: [],
                effects: { literacyGrowth: 1.3, researchSpeed: 1.1 },
                unlocks: ['mathematics', 'literature', 'bureaucracy'],
                bonuses: { administrationEfficiency: 0.1 },
                rarity: 'common'
            },
            'metalworking': {
                name: 'Metalworking',
                description: 'Basic metal smelting and tool creation',
                category: 'industrial',
                tier: 1,
                cost: 200,
                time: 10,
                prerequisites: [],
                effects: { ironProduction: 1.5, toolQuality: 1.2 },
                unlocks: ['weaponry', 'construction', 'mining'],
                bonuses: { buildingEfficiency: 0.1 },
                rarity: 'common'
            },
            'wheel': {
                name: 'The Wheel',
                description: 'Revolutionary transportation technology',
                category: 'transport',
                tier: 1,
                cost: 120,
                time: 6,
                prerequisites: [],
                effects: { tradeRange: 1.3, transportEfficiency: 1.4 },
                unlocks: ['roads', 'carts', 'pottery'],
                bonuses: { movementSpeed: 0.2 },
                rarity: 'common'
            },
            
            // Tier 2 - Classical Technologies (500-1000 tech)
            'mathematics': {
                name: 'Mathematics',
                description: 'Advanced mathematical concepts and calculations',
                category: 'knowledge',
                tier: 2,
                cost: 300,
                time: 15,
                prerequisites: ['writing'],
                effects: { researchSpeed: 1.2, engineeringEfficiency: 1.15 },
                unlocks: ['engineering', 'astronomy', 'currency'],
                bonuses: { constructionAccuracy: 0.15 },
                rarity: 'common'
            },
            'iron_working': {
                name: 'Iron Working',
                description: 'Advanced metalworking with iron tools and weapons',
                category: 'industrial',
                tier: 2,
                cost: 400,
                time: 20,
                prerequisites: ['metalworking'],
                effects: { militaryStrength: 1.25, toolDurability: 1.3 },
                unlocks: ['steel_working', 'advanced_weapons'],
                bonuses: { weaponEffectiveness: 0.2 },
                rarity: 'common'
            },
            'currency': {
                name: 'Currency',
                description: 'Standardized medium of exchange',
                category: 'economic',
                tier: 2,
                cost: 250,
                time: 12,
                prerequisites: ['mathematics'],
                effects: { tradeEfficiency: 1.3, taxCollection: 1.2 },
                unlocks: ['banking', 'markets'],
                bonuses: { commerceBonus: 0.2 },
                rarity: 'common'
            },
            // Tier 1 - Basic Technologies (0-500 tech)
            'agriculture': {
                category: 'economic',
                tier: 1,
                cost: 100,
                time: 5,
                prerequisites: [],
                effects: { foodProduction: 1.2, populationGrowth: 1.1 },
                unlocks: ['irrigation', 'domestication'],
                bonuses: { farmEfficiency: 0.15 },
                applications: ['farming', 'food_security']
            },
            'writing': {
                category: 'knowledge',
                tier: 1,
                cost: 150,
                time: 7,
                prerequisites: [],
                effects: { literacyGrowth: 1.3, researchSpeed: 1.1 },
                unlocks: ['mathematics', 'literature', 'bureaucracy'],
                bonuses: { administrationEfficiency: 0.1 }
            },
            'metalworking': {
                category: 'industrial',
                tier: 1,
                cost: 200,
                time: 10,
                prerequisites: [],
                effects: { ironProduction: 1.5, toolQuality: 1.2 },
                unlocks: ['weaponry', 'construction', 'mining'],
                bonuses: { buildingEfficiency: 0.1 }
            },
            'wheel': {
                category: 'transport',
                tier: 1,
                cost: 120,
                time: 6,
                prerequisites: [],
                effects: { tradeRange: 1.3, transportEfficiency: 1.4 },
                unlocks: ['roads', 'carts', 'pottery'],
                bonuses: { movementSpeed: 0.2 }
            },
            
            // Tier 2 - Classical Technologies (500-1000 tech)
            'mathematics': {
                category: 'knowledge',
                tier: 2,
                cost: 300,
                time: 15,
                prerequisites: ['writing'],
                effects: { researchSpeed: 1.2, engineeringEfficiency: 1.15 },
                unlocks: ['engineering', 'astronomy', 'currency'],
                bonuses: { constructionAccuracy: 0.15 }
            },
            'iron_working': {
                category: 'industrial',
                tier: 2,
                cost: 400,
                time: 20,
                prerequisites: ['metalworking'],
                effects: { militaryStrength: 1.25, toolDurability: 1.3 },
                unlocks: ['steel_working', 'advanced_weapons'],
                bonuses: { weaponEffectiveness: 0.2 }
            },
            'sailing': {
                category: 'transport',
                tier: 2,
                cost: 350,
                time: 18,
                prerequisites: ['wheel'],
                effects: { navalRange: 2.0, fishingYield: 1.4 },
                unlocks: ['navigation', 'shipbuilding'],
                bonuses: { seaTradeBonus: 0.25 }
            },
            'currency': {
                category: 'economic',
                tier: 2,
                cost: 250,
                time: 12,
                prerequisites: ['mathematics'],
                effects: { tradeEfficiency: 1.3, taxCollection: 1.2 },
                unlocks: ['banking', 'markets'],
                bonuses: { commerceBonus: 0.2 }
            },
            
            // Tier 3 - Medieval Technologies (1000-1500 tech)
            'engineering': {
                category: 'industrial',
                tier: 3,
                cost: 600,
                time: 25,
                prerequisites: ['mathematics', 'iron_working'],
                effects: { constructionSpeed: 1.4, infrastructureEfficiency: 1.3 },
                unlocks: ['mechanical_engineering', 'siege_engines'],
                bonuses: { buildingDurability: 0.25 }
            },
            'optics': {
                category: 'knowledge',
                tier: 3,
                cost: 500,
                time: 22,
                prerequisites: ['mathematics'],
                effects: { researchAccuracy: 1.25, observationRange: 1.5 },
                unlocks: ['telescopes', 'microscopes'],
                bonuses: { scientificPrecision: 0.2 }
            },
            'gunpowder': {
                category: 'military',
                tier: 3,
                cost: 800,
                time: 30,
                prerequisites: ['engineering'],
                effects: { militaryPower: 1.5, siegeEffectiveness: 2.0 },
                unlocks: ['firearms', 'cannons', 'mining_explosives'],
                bonuses: { combatEffectiveness: 0.3 },
                rarity: 'uncommon'
            },
            'printing_press': {
                category: 'knowledge',
                tier: 3,
                cost: 700,
                time: 28,
                prerequisites: ['engineering', 'writing'],
                effects: { knowledgeSpread: 1.8, literacyGrowth: 1.5 },
                unlocks: ['mass_communication', 'newspapers'],
                bonuses: { educationEfficiency: 0.25 }
            },
            
            // Tier 4 - Renaissance Technologies (1500-2000 tech)
            'steam_power': {
                category: 'industrial',
                tier: 4,
                cost: 1200,
                time: 40,
                prerequisites: ['engineering', 'gunpowder'],
                effects: { industrialOutput: 1.6, transportSpeed: 1.4 },
                unlocks: ['railroads', 'steamships', 'factories'],
                bonuses: { manufacturingEfficiency: 0.3 },
                rarity: 'uncommon'
            },
            'electricity': {
                category: 'industrial',
                tier: 4,
                cost: 1500,
                time: 45,
                prerequisites: ['steam_power'],
                effects: { industrialCapacity: 1.8, cityEfficiency: 1.4 },
                unlocks: ['electronics', 'electric_power', 'telegraphs'],
                bonuses: { powerGeneration: 0.4 },
                rarity: 'rare'
            },
            'chemistry': {
                category: 'knowledge',
                tier: 4,
                cost: 1000,
                time: 35,
                prerequisites: ['optics'],
                effects: { medicineEfficiency: 1.5, explosivesPower: 1.3 },
                unlocks: ['pharmaceuticals', 'synthetic_materials'],
                bonuses: { healthcareQuality: 0.25 }
            },
            'flight': {
                category: 'transport',
                tier: 4,
                cost: 1800,
                time: 50,
                prerequisites: ['electricity', 'engineering'],
                effects: { militaryMobility: 1.7, reconnaissanceRange: 2.5 },
                unlocks: ['aviation', 'aerospace'],
                bonuses: { airSuperiority: 0.35 },
                rarity: 'rare'
            },
            
            // Tier 5 - Modern Technologies (2000-3000 tech)
            'electronics': {
                category: 'industrial',
                tier: 5,
                cost: 2500,
                time: 60,
                prerequisites: ['electricity'],
                effects: { communicationRange: 3.0, computationSpeed: 2.0 },
                unlocks: ['computers', 'radar', 'television'],
                bonuses: { informationProcessing: 0.4 },
                rarity: 'rare'
            },
            'nuclear_physics': {
                category: 'knowledge',
                tier: 5,
                cost: 3000,
                time: 70,
                prerequisites: ['chemistry', 'electricity'],
                effects: { energyOutput: 3.0, weaponsPower: 5.0 },
                unlocks: ['nuclear_power', 'nuclear_weapons'],
                bonuses: { scientificRevolution: 0.5 },
                rarity: 'very_rare',
                difficulty: 'very_hard'
            },
            'rocketry': {
                category: 'aerospace',
                tier: 5,
                cost: 2800,
                time: 65,
                prerequisites: ['flight', 'electronics'],
                effects: { missileRange: 4.0, spaceCapability: 1.0 },
                unlocks: ['space_program', 'icbm'],
                bonuses: { strategicRange: 0.6 },
                rarity: 'rare'
            },
            'computers': {
                category: 'information',
                tier: 5,
                cost: 2200,
                time: 55,
                prerequisites: ['electronics'],
                effects: { dataProcessing: 3.0, automationLevel: 2.0 },
                unlocks: ['internet', 'artificial_intelligence'],
                bonuses: { efficiencyBonus: 0.35 }
            },
            
            // Tier 6 - Advanced Technologies (3000+ tech)
            'internet': {
                category: 'information',
                tier: 6,
                cost: 4000,
                time: 80,
                prerequisites: ['computers'],
                effects: { globalCommunication: 5.0, knowledgeSharing: 3.0 },
                unlocks: ['cyber_warfare', 'digital_economy'],
                bonuses: { networkEffects: 0.5 },
                rarity: 'legendary'
            },
            'artificial_intelligence': {
                category: 'information',
                tier: 6,
                cost: 5000,
                time: 100,
                prerequisites: ['computers', 'internet'],
                effects: { automationRevolution: 4.0, decisionSpeed: 3.0 },
                unlocks: ['robotics', 'smart_systems'],
                bonuses: { cognitiveAmplification: 0.7 },
                rarity: 'legendary',
                difficulty: 'extreme'
            },
            'fusion_power': {
                category: 'energy',
                tier: 6,
                cost: 6000,
                time: 120,
                prerequisites: ['nuclear_physics'],
                effects: { cleanEnergy: 10.0, powerOutput: 8.0 },
                unlocks: ['fusion_weapons', 'stellar_engineering'],
                bonuses: { energyRevolution: 0.8 },
                rarity: 'legendary',
                difficulty: 'extreme'
            },
            'nanotechnology': {
                category: 'materials',
                tier: 6,
                cost: 4500,
                time: 90,
                prerequisites: ['chemistry', 'electronics'],
                effects: { materialStrength: 5.0, miniaturization: 4.0 },
                unlocks: ['molecular_engineering', 'smart_materials'],
                bonuses: { materialRevolution: 0.6 },
                rarity: 'legendary'
            }
        };
        
        return technologies[this.id] || null;
    }
    
    getCategory() {
        const categories = {
            'economic': 'Economic',
            'military': 'Military', 
            'knowledge': 'Knowledge',
            'industrial': 'Industrial',
            'transport': 'Transport',
            'aerospace': 'Aerospace',
            'information': 'Information',
            'energy': 'Energy',
            'materials': 'Materials',
            'medical': 'Medical'
        };
        return categories[this.category] || 'General';
    }
    
    getTier() {
        // Determine tier based on cost
        if (this.cost < 500) return 1;
        if (this.cost < 1000) return 2;
        if (this.cost < 2000) return 3;
        if (this.cost < 3000) return 4;
        if (this.cost < 4000) return 5;
        return 6;
    }
    
    getResearchCost() {
        const techData = this.getTechnologyData();
        return techData ? techData.cost : 100;
    }
    
    getResearchTime() {
        const techData = this.getTechnologyData();
        return techData ? techData.time : 10; // days
    }
    
    getPrerequisites() {
        const techData = this.getTechnologyData();
        return techData ? (techData.prerequisites || []) : [];
    }
    
    getEffects() {
        const techData = this.getTechnologyData();
        return techData ? (techData.effects || {}) : {};
    }
    
    getUnlocks() {
        const techData = this.getTechnologyData();
        return techData ? (techData.unlocks || []) : [];
    }
    
    getBonuses() {
        const techData = this.getTechnologyData();
        return techData ? (techData.bonuses || {}) : {};
    }
    
    getRarity() {
        const techData = this.getTechnologyData();
        return techData ? (techData.rarity || 'common') : 'common';
    }
    
    getDifficulty() {
        const techData = this.getTechnologyData();
        return techData ? (techData.difficulty || 'medium') : 'medium';
    }
    
    getApplications() {
        const techData = this.getTechnologyData();
        return techData ? (techData.applications || []) : [];
    }
    
    getObsoleteTechnologies() {
        const techData = this.getTechnologyData();
        return techData ? (techData.obsoletes || []) : [];
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Start research on this technology
     */
    startResearch(nationId = null) {
        if (this.isResearched || this.isBeingResearched) {
            return { success: false, message: 'Technology already researched or being researched' };
        }
        
        const nation = nationId ? this.getNation(nationId) : window.Nation;
        if (!nation) {
            return { success: false, message: 'Nation not found' };
        }
        
        // Check prerequisites
        if (!this.canResearch(nation)) {
            return { success: false, message: 'Prerequisites not met' };
        }
        
        // Set as current research in Nation
        nation.currentResearch = this.id;
        nation.researchProgress = 0;
        
        // Update technology status
        this.isBeingResearched = true;
        this.researchStarted = Date.now();
        this.researchProgress = 0;
        
        // Add to Nation's research tracking
        if (!nation.researchAttempts) nation.researchAttempts = {};
        nation.researchAttempts[this.id] = (nation.researchAttempts[this.id] || 0) + 1;
        
        return { success: true, message: `Started researching ${this.name}` };
    }
    
    /**
     * Complete research on this technology
     */
    completeResearch(nationId = null) {
        const nation = nationId ? this.getNation(nationId) : window.Nation;
        if (!nation) return { success: false, message: 'Nation not found' };
        
        // Update technology status
        this.isResearched = true;
        this.isBeingResearched = false;
        this.discovered = Date.now();
        this.researchProgress = 100;
        
        // Add to Nation's technologies
        if (!nation.technologies) nation.technologies = new Set();
        nation.technologies.add(this.id);
        
        // Clear Nation's current research
        if (nation.currentResearch === this.id) {
            nation.currentResearch = null;
            nation.researchProgress = 0;
        }
        
        // Apply technology effects to Nation
        this.applyEffectsToNation(nation);
        
        // Track who researched this first
        if (!this.firstDiscoveredBy) {
            this.firstDiscoveredBy = nation.id || 'player';
            this.firstDiscoveredAt = Date.now();
        }
        
        // Add to researched by list
        const researcherId = nation.id || 'player';
        if (!this.researchedBy.includes(researcherId)) {
            this.researchedBy.push(researcherId);
        }
        
        // Update Nation statistics
        if (nation.statistics) {
            nation.statistics.researchCompleted = (nation.statistics.researchCompleted || 0) + 1;
        }
        
        return { success: true, message: `Completed research on ${this.name}` };
    }
    
    /**
     * Apply this technology's effects to Nation
     */
    applyEffectsToNation(nation) {
        if (!nation) nation = window.Nation;
        if (!nation) return;
        
        // Apply technology bonuses to Nation
        if (this.bonuses) {
            if (!nation.technologyBonuses) nation.technologyBonuses = {};
            
            Object.keys(this.bonuses).forEach(bonusType => {
                nation.technologyBonuses[bonusType] = 
                    (nation.technologyBonuses[bonusType] || 0) + this.bonuses[bonusType];
            });
        }
        
        // Apply technology effects
        if (this.effects) {
            if (!nation.technologyEffects) nation.technologyEffects = {};
            
            Object.keys(this.effects).forEach(effectType => {
                nation.technologyEffects[effectType] = 
                    (nation.technologyEffects[effectType] || 1) * this.effects[effectType];
            });
        }
        
        // Trigger Nation recalculations
        if (nation.calculatePopulation) nation.calculatePopulation();
        if (nation.calculateEconomy) nation.calculateEconomy();
        
        return true;
    }
    
    /**
     * Check if Nation can research this technology
     */
    canResearch(nation) {
        if (!nation) nation = window.Nation;
        if (!nation) return false;
        
        // Check if already researched
        if (this.isResearched || (nation.technologies && nation.technologies.has(this.id))) {
            return false;
        }
        
        // Check prerequisites
        if (this.prerequisites && this.prerequisites.length > 0) {
            for (const prereq of this.prerequisites) {
                if (!nation.technologies || !nation.technologies.has(prereq)) {
                    return false;
                }
            }
        }
        
        // Check tech level requirement (if technology has tier requirement)
        if (this.tier && nation.tech < (this.tier * 100)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get Nation object
     */
    getNation(nationId) {
        if (nationId && window.DataManager?.currentPlayer?.nations) {
            return window.DataManager.currentPlayer.nations.find(n => n.id === nationId);
        }
        return window.Nation;
    }
    
    /**
     * Get research progress for a nation
     */
    getResearchProgress(nationId = null) {
        const nation = nationId ? this.getNation(nationId) : window.Nation;
        if (!nation) return 0;
        
        if (nation.currentResearch === this.id) {
            return nation.researchProgress || 0;
        }
        
        return this.isResearched ? 100 : 0;
    }

    /**
     * Check if this technology can be researched
     */
    canBeResearched(nation = null) {
        if (!nation) nation = window.Nation;
        if (!nation) return { canResearch: false, reason: 'No nation available' };

        for (const prereq of this.prerequisites) {
            if (!nation.technologies.has(prereq)) {
                return { 
                    canResearch: false, 
                    reason: `Missing prerequisite: ${prereq}` 
                };
            }
        }
        
        // Check if already researched
        if (this.isResearched || nation.technologies.has(this.id)) {
            return { 
                canResearch: false, 
                reason: 'Already researched' 
            };
        }
        
        // Check if already being researched
        if (nation.currentResearch === this.id) {
            return { 
                canResearch: false, 
                reason: 'Already being researched' 
            };
        }
        
        // Check tech level requirement
        if (nation.tech < this.cost * 0.8) {
            return { 
                canResearch: false, 
                reason: `Insufficient technology level (need ${Math.floor(this.cost * 0.8)})` 
            };
        }
        
        return { canResearch: true };
    }
    
    startResearch(nation) {
        const canStart = this.canResearch(nation);
        if (!canStart.canResearch) {
            return { success: false, message: canStart.reason };
        }
        
        this.isBeingResearched = true;
        this.researchStarted = Date.now();
        this.researchProgress = 0;
        this.researchAttempts++;
        
        // Set this as the nation's current research
        nation.currentResearch = this.id;
        nation.researchProgress = 0;
        
        return { 
            success: true, 
            message: `Started researching ${this.name}`,
            estimatedDays: this.time
        };
    }
    
    addResearchProgress(points, nation) {
        if (!this.isBeingResearched) return 0;
        
        // Apply research multipliers
        let actualPoints = points * this.baseResearchRate;
        
        // Nation-specific multipliers
        if (nation.researchBonuses) {
            for (const [bonus, multiplier] of Object.entries(nation.researchBonuses)) {
                actualPoints *= multiplier;
            }
        }
        
        // Difficulty modifier
        const difficultyMultipliers = {
            'easy': 1.2,
            'medium': 1.0,
            'hard': 0.8,
            'very_hard': 0.6,
            'extreme': 0.4
        };
        actualPoints *= (difficultyMultipliers[this.difficulty] || 1.0);
        
        this.researchProgress += actualPoints;
        nation.researchProgress = this.researchProgress;
        this.totalResearchInvestment += actualPoints;
        
        // Check if research is complete
        if (this.researchProgress >= this.cost) {
            return this.completeResearch(nation);
        }
        
        return actualPoints;
    }
    
    completeResearch(nation) {
        this.isBeingResearched = false;
        this.isResearched = true;
        this.discovered = Date.now();
        
        // Add to nation's technologies
        nation.technologies.add(this.id);
        nation.currentResearch = null;
        nation.researchProgress = 0;
        
        // Track first discovery
        if (!this.firstDiscoveredBy) {
            this.firstDiscoveredBy = nation.id;
            this.firstDiscoveredAt = Date.now();
        }
        
        // Add nation to researchers list
        if (!this.researchedBy.includes(nation.id)) {
            this.researchedBy.push(nation.id);
        }
        
        // Apply technology effects to nation
        this.applyEffectsToNation(nation);
        
        return {
            completed: true,
            technology: this.name,
            effects: this.effects,
            unlocks: this.unlocks,
            bonuses: this.bonuses
        };
    }
    
    applyEffectsToNation(nation) {
        // Apply permanent bonuses to the nation
        for (const [effect, value] of Object.entries(this.bonuses)) {
            if (!nation.technologyBonuses) nation.technologyBonuses = {};
            nation.technologyBonuses[effect] = (nation.technologyBonuses[effect] || 0) + value;
        }
        
        // Apply multiplicative effects
        for (const [effect, multiplier] of Object.entries(this.effects)) {
            if (!nation.technologyMultipliers) nation.technologyMultipliers = {};
            nation.technologyMultipliers[effect] = (nation.technologyMultipliers[effect] || 1.0) * multiplier;
        }
        
        // Make obsolete technologies unavailable
        for (const obsoleteTech of this.obsoletes) {
            if (nation.availableTechnologies) {
                nation.availableTechnologies.delete(obsoleteTech);
            }
        }
        
        // Unlock new technologies
        if (!nation.availableTechnologies) nation.availableTechnologies = new Set();
        for (const unlockedTech of this.unlocks) {
            nation.availableTechnologies.add(unlockedTech);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // COLLABORATIVE RESEARCH
    // ═══════════════════════════════════════════════════════════════════════
    
    addCollaborator(nationId) {
        if (!this.collaborators) this.collaborators = [];
        
        if (!this.collaborators.includes(nationId)) {
            this.collaborators.push(nationId);
            this.updateCollaborativeBonus();
        }
    }
    
    removeCollaborator(nationId) {
        if (!this.collaborators) return;
        
        const index = this.collaborators.indexOf(nationId);
        if (index !== -1) {
            this.collaborators.splice(index, 1);
            this.updateCollaborativeBonus();
        }
    }
    
    updateCollaborativeBonus() {
        if (!this.collaborators || this.collaborators.length <= 1) {
            this.collaborativeBonus = 0;
            return;
        }
        
        // Each additional collaborator adds 15% bonus (max 75% with 5 collaborators)
        this.collaborativeBonus = Math.min(0.75, (this.collaborators.length - 1) * 0.15);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TECHNOLOGY INFORMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    getResearchInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            tier: this.tier,
            cost: this.cost,
            time: this.time,
            rarity: this.rarity,
            difficulty: this.difficulty,
            
            // Research status
            isResearched: this.isResearched,
            isBeingResearched: this.isBeingResearched,
            researchProgress: this.researchProgress,
            progressPercentage: this.cost > 0 ? (this.researchProgress / this.cost * 100) : 0,
            
            // Requirements
            prerequisites: this.prerequisites,
            
            // Benefits
            effects: this.effects,
            unlocks: this.unlocks,
            bonuses: this.bonuses,
            applications: this.applications,
            
            // Historical data
            firstDiscoveredBy: this.firstDiscoveredBy,
            firstDiscoveredAt: this.firstDiscoveredAt,
            researchedByCount: this.researchedBy.length,
            totalInvestment: this.totalResearchInvestment,
            
            // Collaboration
            collaborativeBonus: this.collaborativeBonus,
            collaboratorCount: this.collaborators ? this.collaborators.length : 0
        };
    }
    
    getProgressSummary() {
        if (this.isResearched) {
            return {
                status: 'completed',
                message: 'Technology researched',
                percentage: 100
            };
        }
        
        if (this.isBeingResearched) {
            const percentage = this.cost > 0 ? (this.researchProgress / this.cost * 100) : 0;
            const remaining = this.cost - this.researchProgress;
            
            return {
                status: 'in_progress',
                message: `${percentage.toFixed(1)}% complete`,
                percentage: percentage,
                remaining: remaining,
                estimatedDaysRemaining: Math.ceil(remaining / 100) // Rough estimate
            };
        }
        
        return {
            status: 'not_started',
            message: 'Research not started',
            percentage: 0
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            discovered: this.discovered,
            researchStarted: this.researchStarted,
            
            // Properties
            category: this.category,
            tier: this.tier,
            cost: this.cost,
            time: this.time,
            prerequisites: [...this.prerequisites],
            
            // Status
            isResearched: this.isResearched,
            isBeingResearched: this.isBeingResearched,
            researchProgress: this.researchProgress,
            researchedBy: [...this.researchedBy],
            
            // Effects
            effects: { ...this.effects },
            unlocks: [...this.unlocks],
            bonuses: { ...this.bonuses },
            
            // Advanced properties
            rarity: this.rarity,
            difficulty: this.difficulty,
            applications: [...this.applications],
            obsoletes: [...this.obsoletes],
            
            // Research data
            baseResearchRate: this.baseResearchRate,
            researchMultipliers: { ...this.researchMultipliers },
            collaborativeBonus: this.collaborativeBonus,
            collaborators: this.collaborators ? [...this.collaborators] : [],
            
            // Historical
            firstDiscoveredBy: this.firstDiscoveredBy,
            firstDiscoveredAt: this.firstDiscoveredAt,
            totalResearchInvestment: this.totalResearchInvestment,
            researchAttempts: this.researchAttempts
        };
    }
    
    static deserialize(data) {
        const tech = new Technology(data.id, data.name, data.description);
        
        // Restore properties
        tech.discovered = data.discovered;
        tech.researchStarted = data.researchStarted;
        
        // Properties
        tech.category = data.category || tech.category;
        tech.tier = data.tier || tech.tier;
        tech.cost = data.cost || tech.cost;
        tech.time = data.time || tech.time;
        tech.prerequisites = data.prerequisites || [];
        
        // Status
        tech.isResearched = data.isResearched || false;
        tech.isBeingResearched = data.isBeingResearched || false;
        tech.researchProgress = data.researchProgress || 0;
        tech.researchedBy = data.researchedBy || [];
        
        // Effects
        tech.effects = data.effects || {};
        tech.unlocks = data.unlocks || [];
        tech.bonuses = data.bonuses || {};
        
        // Advanced properties
        tech.rarity = data.rarity || tech.rarity;
        tech.difficulty = data.difficulty || tech.difficulty;
        tech.applications = data.applications || [];
        tech.obsoletes = data.obsoletes || [];
        
        // Research data
        tech.baseResearchRate = data.baseResearchRate || 1.0;
        tech.researchMultipliers = data.researchMultipliers || {};
        tech.collaborativeBonus = data.collaborativeBonus || 0;
        tech.collaborators = data.collaborators || [];
        
        // Historical
        tech.firstDiscoveredBy = data.firstDiscoveredBy;
        tech.firstDiscoveredAt = data.firstDiscoveredAt;
        tech.totalResearchInvestment = data.totalResearchInvestment || 0;
        tech.researchAttempts = data.researchAttempts || 0;
        
        return tech;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Technology = Technology;
}