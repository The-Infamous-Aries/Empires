/**
 * Research System - Manages technological advancement through tiered research
 */

class ResearchSystem {
    constructor() {
        this.researchDatabase = new Map();
        this.activeResearch = new Map(); // nationId -> research project
        this.completedResearch = new Map(); // nationId -> Set of completed research IDs
        this.researchQueue = new Map(); // nationId -> array of queued research
        
        this.categories = ['economy', 'healthcare', 'production', 'war'];
        this.maxTiers = 12; // Updated to 12 tiers for full progression
        this.maxSimultaneousResearch = 1; // Base limit, can be increased by wonders
        
        this.researchData = null; // Will hold the loaded research data
        this.initializeResearchDatabase();
    }

    async initialize() {
        this.setupEventHandlers();
        this.startResearchUpdates();
        console.log('Research System initialized with', this.researchDatabase.size, 'research projects');
    }

    initializeResearchDatabase() {
        // Research data will be loaded through DataIntegrationSystem
        // This method will be called after data is loaded
        console.log('Research System waiting for data integration...');
    }

    /**
     * Set research database from external data (called by DataIntegrationSystem)
     */
    setResearchDatabase(researchData) {
        this.researchData = researchData;
        this.researchDatabase.clear();
        
        // Convert research data to internal format
        for (const [id, research] of Object.entries(researchData)) {
            this.researchDatabase.set(id, {
                ...research,
                id: id
            });
        }
        
        console.log(`Research System loaded ${this.researchDatabase.size} research projects from data files`);
        
        // Emit event that research is ready
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('research:database_loaded', {
                count: this.researchDatabase.size,
                categories: this.getAvailableCategories()
            });
        }
    }

    /**
     * Get research data - prioritize loaded data files
     */
    getResearchData() {
        if (this.researchData) {
            return this.researchData;
        }
        
        // Try to get from DataIntegrationSystem
        if (typeof dataIntegration !== 'undefined' && dataIntegration.getAllResearch) {
            return dataIntegration.getAllResearch();
        }
        
        // Try to get from ResearchDatabase
        if (typeof ResearchDatabase !== 'undefined' && ResearchDatabase.research) {
            return ResearchDatabase.research;
        }
        
        // Fallback to empty object
        console.warn('No research data available');
        return {};
    }

    /**
     * Finish loading research data once all scripts are loaded
     */
    finishLoadingResearchData() {
        if (typeof window.ResearchDatabase !== 'undefined') {
            this.researchData = window.ResearchDatabase;
            
            // Convert to Map for compatibility with existing code
            Object.entries(this.researchData.research).forEach(([id, research]) => {
                this.researchDatabase.set(id, research);
            });
            
            console.log(`Research data loaded: ${this.researchDatabase.size} research items`);
        } else {
            console.error('ResearchDatabase not available, using fallback');
            this.initializeFallbackResearch();
        }
    }

    /**
     * Fallback research data if files fail to load
     */
    initializeFallbackResearch() {
        // Initialize minimal fallback research for each category
        this.initializeMinimalEconomyResearch();
        this.initializeMinimalHealthcareResearch();
        this.initializeMinimalProductionResearch();
        this.initializeMinimalWarResearch();
    }

    initializeMinimalEconomyResearch() {
        const economyResearch = [
            {
                id: 'basic_barter', name: 'Barter System', category: 'economy', tier: 1,
                description: 'Simple exchange of goods and services without currency',
                requirements: { tech_level: 1 },
                time: 24, cost: 25000,
                effects: { trade_efficiency: 5, market_access: 10 },
                unlocks: ['basic_currency']
            },
            {
                id: 'basic_currency', name: 'Currency Systems', category: 'economy', tier: 2,
                description: 'Introduction of standardized currency for trade',
                requirements: { tech_level: 2, prerequisites: ['basic_barter'] },
                time: 48, cost: 40000,
                effects: { trade_volume: 15, market_stability: 8 },
                unlocks: []
            }
        ];

        economyResearch.forEach(research => {
            this.researchDatabase.set(research.id, research);
        });
    }

    initializeMinimalHealthcareResearch() {
        const healthcareResearch = [
            {
                id: 'herbal_remedies', name: 'Herbal Remedies', category: 'healthcare', tier: 1,
                description: 'Basic knowledge of medicinal plants and natural treatments',
                requirements: { tech_level: 1 },
                time: 32, cost: 20000,
                effects: { disease_resistance: 5, population_health: 3, natural_healing: 8 },
                unlocks: ['basic_medicine']
            },
            {
                id: 'basic_medicine', name: 'Basic Medicine', category: 'healthcare', tier: 2,
                description: 'Fundamental understanding of human anatomy and disease',
                requirements: { tech_level: 2, prerequisites: ['herbal_remedies'] },
                time: 60, cost: 40000,
                effects: { disease_resistance: 10, population_health: 8, birth_rate: 2 },
                unlocks: []
            }
        ];

        healthcareResearch.forEach(research => {
            this.researchDatabase.set(research.id, research);
        });
    }

    initializeMinimalProductionResearch() {
        const productionResearch = [
            {
                id: 'stone_tools', name: 'Stone Tool Crafting', category: 'production', tier: 1,
                description: 'Creation of basic tools from stone and bone',
                requirements: { tech_level: 1 },
                time: 24, cost: 15000,
                effects: { basic_production: 8, tool_efficiency: 10, resource_gathering: 12 },
                unlocks: ['bronze_working']
            },
            {
                id: 'bronze_working', name: 'Bronze Working', category: 'production', tier: 2,
                description: 'Alloying copper and tin to create bronze tools and weapons',
                requirements: { tech_level: 2, prerequisites: ['stone_tools'] },
                time: 48, cost: 35000,
                effects: { tool_quality: 25, weapon_effectiveness: 20, trade_value: 15 },
                unlocks: []
            }
        ];

        productionResearch.forEach(research => {
            this.researchDatabase.set(research.id, research);
        });
    }

    initializeMinimalWarResearch() {
        const warResearch = [
            {
                id: 'primitive_weapons', name: 'Primitive Weapons', category: 'war', tier: 1,
                description: 'Basic clubs, spears, and stone weapons for combat',
                requirements: { tech_level: 1 },
                time: 20, cost: 12000,
                effects: { attack_power: 5, weapon_durability: 8, hunting_efficiency: 10 },
                unlocks: ['bronze_weapons']
            },
            {
                id: 'bronze_weapons', name: 'Bronze Weaponry', category: 'war', tier: 2,
                description: 'Superior bronze swords, axes, and spearheads',
                requirements: { tech_level: 2, prerequisites: ['primitive_weapons'] },
                time: 40, cost: 25000,
                effects: { weapon_quality: 25, critical_damage: 18, durability: 22 },
                unlocks: []
            }
        ];

        warResearch.forEach(research => {
            this.researchDatabase.set(research.id, research);
        });
    }

    setupEventHandlers() {
        EventBus.on('game_hour_passed', () => this.updateResearchProgress());
        EventBus.on('research_completed', (data) => this.handleResearchCompletion(data));
        EventBus.on('wonder_completed', (data) => this.handleWonderEffects(data));
    }

    startResearchUpdates() {
        // Update research progress every game hour
        setInterval(() => {
            this.updateResearchProgress();
        }, 3600000); // 1 hour in milliseconds
    }

    canStartResearch(nationId, researchId) {
        const nation = Nation.nationDatabase.getNation(nationId);
        if (!nation) return { success: false, reason: 'Nation not found' };

        const research = this.researchDatabase.get(researchId);
        if (!research) return { success: false, reason: 'Research not found' };

        // Check if already researching maximum projects
        const activeResearchCount = this.getActiveResearchCount(nationId);
        const maxResearch = this.getMaxSimultaneousResearch(nationId);
        if (activeResearchCount >= maxResearch) {
            return { success: false, reason: 'Maximum research projects active' };
        }

        // Check tech level requirement
        if (nation.techLevel < research.requirements.tech_level) {
            return { success: false, reason: `Tech level ${research.requirements.tech_level} required` };
        }

        // Check prerequisites
        if (research.requirements.prerequisites) {
            const completed = this.completedResearch.get(nationId) || new Set();
            for (const prereq of research.requirements.prerequisites) {
                if (!completed.has(prereq)) {
                    return { success: false, reason: `Prerequisite '${prereq}' not completed` };
                }
            }
        }

        // Check if already completed
        const completed = this.completedResearch.get(nationId) || new Set();
        if (completed.has(researchId)) {
            return { success: false, reason: 'Already researched' };
        }

        // Check cost
        if (nation.money < research.cost) {
            return { success: false, reason: 'Insufficient funds' };
        }

        return { success: true };
    }

    startResearch(nationId, researchId) {
        const canStart = this.canStartResearch(nationId, researchId);
        if (!canStart.success) return canStart;

        const nation = Nation.nationDatabase.getNation(nationId);
        const research = this.researchDatabase.get(researchId);

        // Deduct cost
        nation.money -= research.cost;

        // Calculate research time with modifiers
        const baseTime = research.time;
        const researchSpeedModifier = this.getResearchSpeedModifier(nationId);
        const adjustedTime = Math.max(1, Math.floor(baseTime * researchSpeedModifier));

        // Create research project
        const researchProject = {
            researchId: researchId,
            research: research,
            nationId: nationId,
            startTime: Date.now(),
            totalTime: adjustedTime * 3600000, // Convert hours to milliseconds
            progress: 0,
            isActive: true
        };

        // Store active research
        if (!this.activeResearch.has(nationId)) {
            this.activeResearch.set(nationId, []);
        }
        this.activeResearch.get(nationId).push(researchProject);

        this.notifyResearchStarted(researchProject);

        return { success: true, project: researchProject };
    }

    getResearchSpeedModifier(nationId) {
        const nation = Nation.nationDatabase.getNation(nationId);
        if (!nation) return 1.0;

        let modifier = 1.0;

        // Research improvements effect
        const researchImprovements = nation.improvements?.research_lab || 0;
        const improvementBonus = researchImprovements * 0.03; // 3% per improvement

        // Research project effect (doubles improvement bonus when stacked to 5)
        const researchProjects = nation.projects?.advanced_research || 0;
        const projectMultiplier = researchProjects >= 5 ? 2 : 1;

        const totalImprovement = Math.min(0.30, improvementBonus * projectMultiplier); // Cap at 30%
        modifier -= totalImprovement; // Reduce time (speed up research)

        // Education and research bonuses from other systems
        if (nation.nationStats?.education) {
            modifier -= (nation.nationStats.education / 100) * 0.15; // Up to 15% bonus from education
        }

        // Research wonder effects would be applied here
        // Example: Research Wonder provides additional research slot and speed bonus

        return Math.max(0.25, modifier); // Minimum 25% of original time (4x speed max)
    }

    getMaxSimultaneousResearch(nationId) {
        const nation = Nation.nationDatabase.getNation(nationId);
        if (!nation) return 1;

        let maxResearch = this.maxSimultaneousResearch;

        // Check for Research Wonder
        if (nation.wonders?.includes('great_library')) {
            maxResearch += 1; // Research Wonder adds one more research slot
        }

        return maxResearch;
    }

    getActiveResearchCount(nationId) {
        const activeProjects = this.activeResearch.get(nationId) || [];
        return activeProjects.filter(project => project.isActive).length;
    }

    updateResearchProgress() {
        this.activeResearch.forEach((projects, nationId) => {
            projects.forEach(project => {
                if (!project.isActive) return;

                const elapsed = Date.now() - project.startTime;
                project.progress = Math.min(100, (elapsed / project.totalTime) * 100);

                if (project.progress >= 100) {
                    this.completeResearch(project);
                }
            });
        });
    }

    completeResearch(project) {
        const nation = Nation.nationDatabase.getNation(project.nationId);
        if (!nation) return;

        // Mark as completed
        project.isActive = false;
        project.completedTime = Date.now();

        // Add to completed research
        if (!this.completedResearch.has(project.nationId)) {
            this.completedResearch.set(project.nationId, new Set());
        }
        this.completedResearch.get(project.nationId).add(project.researchId);

        // Apply research effects
        this.applyResearchEffects(project.nationId, project.research);

        // Award research points (used for disease cures)
        nation.researchPoints = (nation.researchPoints || 0) + this.calculateResearchPoints(project.research);

        this.notifyResearchCompleted(project);

        EventBus.emit('research_completed', {
            nationId: project.nationId,
            researchId: project.researchId,
            research: project.research
        });
    }

    applyResearchEffects(nationId, research) {
        const nation = Nation.nationDatabase.getNation(nationId);
        if (!nation) return;

        // Apply effects based on research
        Object.entries(research.effects).forEach(([effect, value]) => {
            switch(effect) {
                // Economic effects
                case 'tax_efficiency':
                    nation.taxEfficiency = (nation.taxEfficiency || 100) + value;
                    break;
                case 'economic_growth':
                    nation.economicGrowthRate = (nation.economicGrowthRate || 2) + (value / 100);
                    break;
                case 'trade_efficiency':
                    nation.tradeEfficiency = (nation.tradeEfficiency || 100) + value;
                    break;

                // Healthcare effects
                case 'disease_resistance':
                    nation.diseaseResistance = (nation.diseaseResistance || 0) + value;
                    break;
                case 'population_health':
                    nation.nationStats.health = (nation.nationStats.health || 75) + value;
                    break;
                case 'birth_rate':
                    nation.birthRateBonus = (nation.birthRateBonus || 0) + value;
                    break;

                // Production effects
                case 'basic_production':
                    nation.productionBonus = (nation.productionBonus || 0) + value;
                    break;
                case 'food_production':
                    nation.foodProductionBonus = (nation.foodProductionBonus || 0) + value;
                    break;
                case 'industrial_output':
                    nation.industrialBonus = (nation.industrialBonus || 0) + value;
                    break;

                // War effects
                case 'attack_power':
                    nation.militaryStats.attack = (nation.militaryStats.attack || 100) + value;
                    break;
                case 'defense':
                    nation.militaryStats.defense = (nation.militaryStats.defense || 100) + value;
                    break;
                case 'critical_chance':
                    nation.militaryStats.criticalChance = (nation.militaryStats.criticalChance || 5) + value;
                    break;
                case 'critical_damage':
                    nation.militaryStats.criticalDamage = (nation.militaryStats.criticalDamage || 150) + value;
                    break;

                // Add more effect handlers as needed
            }
        });

        // Ensure stats stay within reasonable bounds
        if (nation.nationStats.health) {
            nation.nationStats.health = Math.min(100, nation.nationStats.health);
        }
    }

    calculateResearchPoints(research) {
        // Research points based on tier and category
        const basePoints = research.tier * 5;
        const categoryMultiplier = research.category === 'healthcare' ? 1.5 : 1.0; // Healthcare gives more points for disease research
        return Math.floor(basePoints * categoryMultiplier);
    }

    handleWonderEffects(data) {
        // Handle effects of completed wonders on research
        if (data.wonderId === 'great_library') {
            // Research Wonder completed - increases research capacity
            console.log(`Research capacity increased for nation ${data.nationId}`);
        }
    }

    // API methods for UI
    getAvailableResearch(nationId, category = null) {
        const nation = Nation.nationDatabase.getNation(nationId);
        if (!nation) return [];

        const completed = this.completedResearch.get(nationId) || new Set();
        const available = [];

        // Use ResearchDatabase if available, otherwise fall back to local database
        if (this.researchData && this.researchData.getAvailableResearch) {
            return this.researchData.getAvailableResearch(completed, nation.techLevel, category);
        }

        // Fallback to original method
        this.researchDatabase.forEach((research, id) => {
            // Filter by category if specified
            if (category && research.category !== category) return;

            // Skip if already completed
            if (completed.has(id)) return;

            // Check if requirements are met
            const canStart = this.canStartResearch(nationId, id);
            if (canStart.success || canStart.reason === 'Insufficient funds' || canStart.reason === 'Maximum research projects active') {
                available.push({
                    ...research,
                    canStart: canStart.success,
                    reason: canStart.reason
                });
            }
        });

        return available.sort((a, b) => a.tier - b.tier);
    }

    /**
     * Get research tree for a specific category
     */
    getResearchTree(category) {
        if (this.researchData && this.researchData.getResearchTree) {
            return this.researchData.getResearchTree(category);
        }

        // Fallback method
        const categoryResearch = {};
        this.researchDatabase.forEach((research, id) => {
            if (research.category === category) {
                if (!categoryResearch[research.tier]) {
                    categoryResearch[research.tier] = [];
                }
                categoryResearch[research.tier].push({
                    id,
                    ...research,
                    prerequisites: research.requirements?.prerequisites || [],
                    unlocks: research.unlocks || []
                });
            }
        });

        return categoryResearch;
    }

    /**
     * Get research by category and tier
     */
    getResearchByCategoryAndTier(category, tier) {
        if (this.researchData && this.researchData.getResearchByCategoryAndTier) {
            return this.researchData.getResearchByCategoryAndTier(category, tier);
        }

        const results = [];
        this.researchDatabase.forEach((research, id) => {
            if (research.category === category && research.tier === tier) {
                results.push({ id, ...research });
            }
        });

        return results;
    }

    /**
     * Get category information
     */
    getCategoryInfo() {
        if (this.researchData && this.researchData.categories) {
            return this.researchData.categories;
        }

        // Fallback category info
        return {
            economy: { name: 'Economy', description: 'Financial systems and trade', icon: '💰' },
            healthcare: { name: 'Healthcare', description: 'Medical knowledge and public health', icon: '🏥' },
            production: { name: 'Production', description: 'Manufacturing and industry', icon: '🏭' },
            war: { name: 'Military', description: 'Military technology and tactics', icon: '⚔️' }
        };
    }

    /**
     * Get tech level information
     */
    getTechLevelInfo() {
        if (this.researchData && this.researchData.techLevels) {
            return this.researchData.techLevels;
        }

        // Fallback tech level info
        return {
            1: { era: 'Ancient', period: '3000-500 BCE', description: 'Stone Age foundations' },
            2: { era: 'Classical', period: '500 BCE-500 CE', description: 'Bronze and Iron Age' },
            3: { era: 'Medieval', period: '500-1000 CE', description: 'Dark Ages development' },
            4: { era: 'Renaissance', period: '1000-1500 CE', description: 'Early modern era' },
            5: { era: 'Early Modern', period: '1500-1800', description: 'Pre-industrial advancement' },
            6: { era: 'Industrial', period: '1800-1900', description: 'Industrial revolution' },
            7: { era: 'Contemporary', period: '1900-1945', description: 'Early 20th century' },
            8: { era: 'Modern', period: '1945-1980', description: 'Post-war technology boom' },
            9: { era: 'Information', period: '1980-2000', description: 'Digital revolution' },
            10: { era: 'Digital', period: '2000-2030', description: 'Information age' },
            11: { era: 'Advanced', period: '2030-2050', description: 'AI and nanotechnology' },
            12: { era: 'Future', period: '2050+', description: 'Post-human technology' }
        };
    }

    /**
     * Get research statistics
     */
    getResearchStatistics() {
        if (this.researchData && this.researchData.getStatistics) {
            return this.researchData.getStatistics();
        }

        // Fallback statistics calculation
        const stats = {
            total: this.researchDatabase.size,
            byCategory: {},
            byTier: {}
        };

        this.categories.forEach(category => {
            stats.byCategory[category] = 0;
        });

        for (let tier = 1; tier <= this.maxTiers; tier++) {
            stats.byTier[tier] = 0;
        }

        this.researchDatabase.forEach(research => {
            if (stats.byCategory[research.category] !== undefined) {
                stats.byCategory[research.category]++;
            }
            if (stats.byTier[research.tier] !== undefined) {
                stats.byTier[research.tier]++;
            }
        });

        return stats;
    }

    getActiveResearch(nationId) {
        const projects = this.activeResearch.get(nationId) || [];
        return projects.filter(project => project.isActive);
    }

    getCompletedResearch(nationId) {
        const completed = this.completedResearch.get(nationId) || new Set();
        const results = [];

        completed.forEach(researchId => {
            const research = this.researchDatabase.get(researchId);
            if (research) {
                results.push(research);
            }
        });

        return results.sort((a, b) => a.tier - b.tier);
    }

    getResearchProgress(nationId, researchId) {
        const projects = this.activeResearch.get(nationId) || [];
        const project = projects.find(p => p.researchId === researchId && p.isActive);
        
        if (!project) return 0;

        const elapsed = Date.now() - project.startTime;
        return Math.min(100, (elapsed / project.totalTime) * 100);
    }

    getResearchTimeRemaining(nationId, researchId) {
        const projects = this.activeResearch.get(nationId) || [];
        const project = projects.find(p => p.researchId === researchId && p.isActive);
        
        if (!project) return 0;

        const elapsed = Date.now() - project.startTime;
        const remaining = Math.max(0, project.totalTime - elapsed);
        
        return Math.ceil(remaining / 3600000); // Return in hours
    }

    canCancelResearch(nationId, researchId) {
        const projects = this.activeResearch.get(nationId) || [];
        const project = projects.find(p => p.researchId === researchId && p.isActive);
        return !!project;
    }

    cancelResearch(nationId, researchId) {
        const projects = this.activeResearch.get(nationId) || [];
        const projectIndex = projects.findIndex(p => p.researchId === researchId && p.isActive);
        
        if (projectIndex === -1) return false;

        const project = projects[projectIndex];
        const nation = Nation.nationDatabase.getNation(nationId);
        
        // Refund partial cost (50% if cancelled after starting)
        const refund = Math.floor(project.research.cost * 0.5);
        nation.money += refund;

        // Remove project
        projects.splice(projectIndex, 1);

        this.notifyResearchCancelled(project, refund);

        return true;
    }

    // Notification methods
    notifyResearchStarted(project) {
        const message = `Research started: ${project.research.name}`;
        EventBus.emit('research_started', {
            nationId: project.nationId,
            research: project.research,
            message: message
        });
    }

    notifyResearchCompleted(project) {
        const message = `Research completed: ${project.research.name}!`;
        EventBus.emit('research_completed_notification', {
            nationId: project.nationId,
            research: project.research,
            message: message
        });
    }

    notifyResearchCancelled(project, refund) {
        const message = `Research cancelled: ${project.research.name}. Refunded: $${refund}`;
        EventBus.emit('research_cancelled', {
            nationId: project.nationId,
            research: project.research,
            refund: refund,
            message: message
        });
    }
}

// Export for use in other modules
window.ResearchSystem = ResearchSystem;