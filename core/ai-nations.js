/**
 * AI Nations System - Manages computer-controlled nations for testing and gameplay
 */

class AINationsSystem {
    constructor() {
        this.aiNations = new Map();
        this.aiPlayers = new Map();
        this.isInitialized = false;
        this.updateInterval = null;
        this.decisionInterval = 5000; // 5 seconds between AI decisions
        
        // AI Behavior Settings
        this.aiSettings = {
            aggressiveness: 0.3,    // 0-1 how likely to start wars
            diplomacy: 0.7,        // 0-1 how likely to make treaties
            expansion: 0.6,        // 0-1 how focused on growth
            military: 0.5,         // 0-1 focus on military vs economy
            trading: 0.8,          // 0-1 how active in trading
            cooperation: 0.4       // 0-1 willingness to cooperate
        };
        
        // AI Nation Templates
        this.nationTemplates = this.createNationTemplates();
        
        // Decision weights for different actions
        this.actionWeights = {
            economic: 0.4,
            military: 0.2,
            diplomatic: 0.2,
            research: 0.1,
            expansion: 0.1
        };
        
        // Track AI relationships
        this.aiRelationships = new Map();
        
        this.bindEvents();
    }
    
    bindEvents() {
        EventBus.on(GameEvents.GAME_STARTED, () => {
            this.initialize();
        });
        
        EventBus.on(GameEvents.TURN_UPDATED, () => {
            this.updateAINations();
        });
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing AI Nations System...');
        
        // Create AI nations
        await this.createAINations();
        
        // Start AI decision loop
        this.startAILoop();
        
        this.isInitialized = true;
        console.log(`AI Nations System initialized with ${this.aiNations.size} AI nations`);
    }

    createNationTemplates() {
        return [
            {
                name: 'Aetherian Empire',
                leader: 'Emperor Valdris',
                government: 'monarchy',
                religion: 'monotheism',
                primaryResource: 'iron',
                personality: {
                    aggressiveness: 0.8,
                    diplomacy: 0.3,
                    expansion: 0.9,
                    military: 0.8,
                    trading: 0.4,
                    cooperation: 0.2
                },
                startingSkills: {
                    offense: 15, defense: 12, leadership: 18, economy: 8,
                    geography: 10, political: 6, espionage: 14, nuclear: 5,
                    growth: 7, commerce: 9, engineering: 11, medicine: 5
                }
            },
            {
                name: 'Republic of Neredia',
                leader: 'President Marina',
                government: 'republic',
                religion: 'polytheism',
                primaryResource: 'water',
                personality: {
                    aggressiveness: 0.2,
                    diplomacy: 0.8,
                    expansion: 0.4,
                    military: 0.3,
                    trading: 0.9,
                    cooperation: 0.8
                },
                startingSkills: {
                    offense: 5, defense: 8, leadership: 12, economy: 18,
                    geography: 15, political: 16, espionage: 7, nuclear: 3,
                    growth: 14, commerce: 17, engineering: 10, medicine: 15
                }
            },
            {
                name: 'Technate of Innovus',
                leader: 'Chief Engineer Zara',
                government: 'technocracy',
                religion: 'atheism',
                primaryResource: 'uranium',
                personality: {
                    aggressiveness: 0.4,
                    diplomacy: 0.6,
                    expansion: 0.5,
                    military: 0.6,
                    trading: 0.7,
                    cooperation: 0.7
                },
                startingSkills: {
                    offense: 8, defense: 10, leadership: 14, economy: 15,
                    geography: 12, political: 8, espionage: 11, nuclear: 18,
                    growth: 9, commerce: 12, engineering: 18, medicine: 16
                }
            },
            {
                name: 'Tribal Federation of Wildlands',
                leader: 'Chief Thornwick',
                government: 'anarchy',
                religion: 'shamanism',
                primaryResource: 'lumber',
                personality: {
                    aggressiveness: 0.6,
                    diplomacy: 0.5,
                    expansion: 0.7,
                    military: 0.7,
                    trading: 0.3,
                    cooperation: 0.4
                },
                startingSkills: {
                    offense: 16, defense: 14, leadership: 10, economy: 6,
                    geography: 18, political: 4, espionage: 13, nuclear: 2,
                    growth: 15, commerce: 5, engineering: 7, medicine: 12
                }
            }
        ];
    }

    async createAINations() {
        const templates = [...this.nationTemplates];
        
        // Shuffle templates
        for (let i = templates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [templates[i], templates[j]] = [templates[j], templates[i]];
        }
        
        // Create 11-12 AI nations as requested
        const numAINations = 11 + Math.floor(Math.random() * 2); // 11 or 12

        // Ensure every basic resource is used as a primary resource at least once.
        const basicResources = ['iron', 'lead', 'lumber', 'water', 'food', 'uranium', 'coal', 'oil', 'limestone', 'bauxite'];
        const shuffledResources = [...basicResources].sort(() => Math.random() - 0.5);
        const primaryAssignments = [];
        for (let i = 0; i < numAINations; i++) {
            if (i < shuffledResources.length) {
                primaryAssignments.push(shuffledResources[i]);
            } else {
                primaryAssignments.push(basicResources[Math.floor(Math.random() * basicResources.length)]);
            }
        }

        for (let i = 0; i < numAINations; i++) {
            const template = templates[i % templates.length];
            const aiNation = await this.createAINation(template, i, primaryAssignments[i]);
            
            if (aiNation) {
                this.aiNations.set(aiNation.id, aiNation);
                console.log(`Created AI Nation: ${aiNation.name}`);
            }
        }

        // Assign starting map territories to all AI nations
        if (window.GridMap) {
            this.assignInitialTerritories();
        }
    }

    /**
     * Assign a contiguous cluster of grid tiles to each AI nation so they
     * actually appear on the map.  Nations are spread across the world grid
     * in a grid layout so they don't overlap each other.
     */
    assignInitialTerritories() {
        const nations = Array.from(this.aiNations.values());
        if (nations.length === 0) return;

        // Each nation gets a roughly square starting cluster.
        // The world is -25..25 on each axis (50 tiles wide).
        // We split it into a layout grid of slots.
        const WORLD_HALF = 22; // stay a bit inside the bounds
        const cols = Math.ceil(Math.sqrt(nations.length));
        const rows = Math.ceil(nations.length / cols);
        const slotW = Math.floor((WORLD_HALF * 2) / cols);
        const slotH = Math.floor((WORLD_HALF * 2) / rows);

        // Starting tiles per nation (3x3 = 9 tiles is a visible splash of colour)
        const CLUSTER_RADIUS = 2; // gives a 5x5 = 25 tile cluster per nation

        nations.forEach((nation, idx) => {
            if (!nation || !nation.factionColor) return;

            const col = idx % cols;
            const row = Math.floor(idx / cols);

            // Centre of this nation's slot
            const cx = -WORLD_HALF + Math.round(slotW * (col + 0.5));
            const cy = -WORLD_HALF + Math.round(slotH * (row + 0.5));

            let claimed = 0;
            for (let dx = -CLUSTER_RADIUS; dx <= CLUSTER_RADIUS; dx++) {
                for (let dy = -CLUSTER_RADIUS; dy <= CLUSTER_RADIUS; dy++) {
                    const tx = cx + dx;
                    const ty = cy + dy;
                    const existing = GridMap.getTerritory(tx, ty);
                    // Only claim empty tiles
                    if (!existing || !existing.ownerId) {
                        try {
                            GridMap.claimTerritory(tx, ty, nation.id, nation.factionColor);
                            claimed++;
                        } catch (e) {
                            // tile already taken — skip
                        }
                    }
                }
            }
            console.log(`[AI] ${nation.name} claimed ${claimed} tiles around (${cx}, ${cy})`);
        });

        // Trigger a map re-render — if the renderer isn't up yet, retry after a short delay
        const tryRender = (attempt = 0) => {
            const renderer = (window.MapIntegration && window.MapIntegration.enhancedRenderer)
                ? window.MapIntegration.enhancedRenderer
                : window.MapRenderer;
            if (renderer && typeof renderer.scheduleRender === 'function') {
                renderer.scheduleRender();
            } else if (renderer && typeof renderer.render === 'function') {
                renderer.render();
            } else if (attempt < 20) {
                // Renderer not ready yet — retry in 250ms (up to 5 seconds)
                setTimeout(() => tryRender(attempt + 1), 250);
            }
        };
        tryRender();
    }

    async createAINation(template, index, primaryResource) {
        try {
            // Create AI Player first — use PlayerClass (the constructor), not the Player singleton
            const aiPlayer = new PlayerClass();
            aiPlayer.initialize({
                username: `AI_${template.name.replace(/\\s+/g, '_')}_${index}`,
                isAI: true
            });
            
            // Set AI skills based on template
            for (const [skill, value] of Object.entries(template.startingSkills)) {
                aiPlayer.skills[skill] = value;
            }
            
            // Create AI Nation
            // Use NationClass (the constructor), not the Nation singleton
            const aiNation = new NationClass();
            aiNation.name = this.generateVariantName(template.name, index);
            aiNation.leader = template.leader;
            aiNation.government = template.government;
            aiNation.religion = template.religion;
            aiNation.primaryResource = primaryResource || template.primaryResource;
            
            // No resource seeding in money-only economy
            aiNation.currency = aiNation.currency || null;
            
            // Add some variation to starting resources
            aiNation.land = GameConfig.INITIAL_LAND + (Math.random() * 500 - 250);
            aiNation.infra = GameConfig.INITIAL_INFRA + (Math.random() * 200 - 100);
            aiNation.tech = Math.floor(Math.random() * 100);
            aiNation.money += Math.floor(Math.random() * 5000000 - 2500000);
            
            // Assign faction color (round-robin across the 10 game colors)
            const colorDef = (typeof colorForIndex !== 'undefined')
                ? colorForIndex(index)
                : Object.values(GameConfig.FACTION_COLORS)[index % Object.keys(GameConfig.FACTION_COLORS).length];
            aiNation.factionKey   = colorDef ? colorDef.key || Object.keys(GameConfig.FACTION_COLORS)[index % 10] : null;
            aiNation.factionColor = colorDef ? (colorDef.hex || colorDef) : null;
            
            // Set AI personality
            aiNation.aiPersonality = { ...template.personality };
            aiNation.isAI = true;
            aiNation.playerId = aiPlayer.id;
            
            // Store references
            this.aiPlayers.set(aiPlayer.id, aiPlayer);
            
            // Initialize nation calculations using the methods that actually exist
            if (typeof aiNation.calculatePopulation       === 'function') aiNation.calculatePopulation();
            if (typeof aiNation.calculateNationStats      === 'function') aiNation.calculateNationStats();
            if (typeof aiNation.calculateLiteracy         === 'function') aiNation.calculateLiteracy();
            if (typeof aiNation.calculateEconomy          === 'function') aiNation.calculateEconomy();
            if (typeof aiNation.calculateResourceGeneration === 'function') aiNation.calculateResourceGeneration();
            
            return aiNation;
        } catch (error) {
            console.error('Error creating AI nation:', error);
            return null;
        }
    }
    generateVariantName(baseName, index) {
        const prefixes = ['Great', 'United', 'Free', 'New', 'East', 'West', 'North', 'South'];
        const suffixes = ['Kingdom', 'State', 'Realm', 'Dominion', 'Union', 'Alliance'];
        
        if (index === 0) return baseName;
        if (index < prefixes.length) {
            return `${prefixes[index - 1]} ${baseName}`;
        }
        
        const suffix = suffixes[(index - prefixes.length) % suffixes.length];
        return `${baseName} ${suffix}`;
    }

    startAILoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.processAIDecisions();
        }, this.decisionInterval);
    }

    stopAILoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    processAIDecisions() {
        for (const [nationId, aiNation] of this.aiNations) {
            if (!aiNation.isAI) continue;
            
            try {
                this.makeAIDecision(aiNation);
            } catch (error) {
                console.error(`Error processing AI decision for ${aiNation.name}:`, error);
            }
        }
    }

    makeAIDecision(aiNation) {
        // Skip if nation is in bad state
        if (!aiNation.isAlive || aiNation.population <= 0) return;
        
        // Get current nation state
        const nationState = this.analyzeNationState(aiNation);
        
        // Determine priority actions based on state and personality
        const possibleActions = this.getPossibleActions(aiNation, nationState);
        
        // Choose and execute action
        const chosenAction = this.selectBestAction(aiNation, possibleActions, nationState);
        
        if (chosenAction) {
            this.executeAIAction(aiNation, chosenAction);
        }
    }

    analyzeNationState(nation) {
        return {
            // Economic indicators
            gdpPerCapita: nation.population > 0 ? (nation.taxableIncome / nation.population) : 0,
            treasuryRatio: nation.money / Math.max(1, nation.population * 100),
            resourceScarcity: this.calculateResourceScarcity(nation),
            
            // Military indicators
            militaryStrength: nation.militaryStrength,
            militaryRatio: nation.population > 0 ? (nation.militaryStrength / nation.population) : 0,
            atWar: nation.wars.length > 0,
            
            // Development indicators
            techLevel: nation.tech,
            infraLevel: nation.infra,
            landSize: nation.land,
            
            // Social indicators
            happiness: nation.nationStats?.happiness || 50,
            stability: nation.stability,
            
            // Threats and opportunities
            nearbyEnemies: this.getNearbyEnemies(nation),
            potentialAllies: this.getPotentialAllies(nation),
            tradeOpportunities: this.getTradeOpportunities(nation)
        };
    }

    calculateResourceScarcity(nation) { return 0; }
            const needed = nation.population * 0.1; // Basic need
            if (amount < needed) {
                scarcityScore += (needed - amount) / needed;
            }
        }
        
        return Math.min(1, scarcityScore);
    }

    getPossibleActions(nation, state) {
        const actions = [];
        
        // Economic actions
        if (nation.money > 1000000) {
            actions.push({ type: 'buyLand', priority: 0.3, cost: 500000 });
            actions.push({ type: 'buyInfra', priority: 0.4, cost: 1000000 });
            actions.push({ type: 'buyTech', priority: 0.3, cost: 2000000 });
        }
        
        // Military actions
        if (nation.money > 500000 && state.militaryRatio < 0.1) {
            actions.push({ type: 'recruitSoldiers', priority: 0.4, cost: 100000 });
        }
        
        if (nation.money > 2000000 && nation.tech > 500) {
            actions.push({ type: 'recruitTanks', priority: 0.3, cost: 500000 });
        }
        
        // Diplomatic actions
        const nearbyNations = this.getNearbyNations(nation);
        for (const otherNation of nearbyNations) {
            if (!this.areAtWar(nation, otherNation)) {
                actions.push({ type: 'makeTreaty', target: otherNation.id, priority: 0.2 });
            }
        }
        
        // Research actions
        if (nation.tech > 100 && !nation.currentResearch) {
            actions.push({ type: 'startResearch', priority: 0.25 });
        }
        
        // Aggressive actions
        if (state.militaryStrength > 1000) {
            for (const target of this.getPotentialTargets(nation)) {
                actions.push({ 
                    type: 'declareWar', 
                    target: target.id, 
                    priority: nation.aiPersonality.aggressiveness 
                });
            }
        }
        
        return actions;
    }
    selectBestAction(nation, actions, state) {
        if (actions.length === 0) return null;
        
        // Weight actions by personality and current needs
        for (const action of actions) {
            let weight = action.priority || 0.1;
            
            // Personality modifiers
            switch (action.type) {
                case 'declareWar':
                    weight *= nation.aiPersonality.aggressiveness;
                    break;
                case 'makeTreaty':
                    weight *= nation.aiPersonality.diplomacy;
                    break;
                case 'buyLand':
                case 'buyInfra':
                    weight *= nation.aiPersonality.expansion;
                    break;
                case 'recruitSoldiers':
                case 'recruitTanks':
                    weight *= nation.aiPersonality.military;
                    break;
            }
            
            // Current needs modifiers
            if (state.resourceScarcity > 0.5) {
                if (action.type === 'buyLand' || action.type === 'buyInfra') {
                    weight *= 1.5;
                }
            }
            
            if (state.atWar && (action.type.includes('recruit') || action.type === 'buyTech')) {
                weight *= 1.3;
            }
            
            if (state.happiness < 40) {
                if (action.type === 'buyInfra' || action.type === 'makeTreaty') {
                    weight *= 1.2;
                }
                if (action.type === 'declareWar') {
                    weight *= 0.5;
                }
            }
            
            action.finalWeight = weight;
        }
        
        // Sort by weight and add randomness
        actions.sort((a, b) => (b.finalWeight + Math.random() * 0.1) - (a.finalWeight + Math.random() * 0.1));
        
        return actions[0];
    }

    executeAIAction(nation, action) {
        const aiPlayer = this.aiPlayers.get(nation.playerId);
        if (!aiPlayer) return;
        
        try {
            switch (action.type) {
                case 'buyLand':
                    this.aiBuyLand(nation, aiPlayer);
                    break;
                case 'buyInfra':
                    this.aiBuyInfra(nation, aiPlayer);
                    break;
                case 'buyTech':
                    this.aiBuyTech(nation, aiPlayer);
                    break;
                case 'recruitSoldiers':
                    this.aiRecruitSoldiers(nation);
                    break;
                case 'recruitTanks':
                    this.aiRecruitTanks(nation);
                    break;
                case 'declareWar':
                    this.aiDeclareWar(nation, action.target);
                    break;
                case 'makeTreaty':
                    this.aiMakeTreaty(nation, action.target);
                    break;
                case 'startResearch':
                    this.aiStartResearch(nation);
                    break;
            }
        } catch (error) {
            console.error(`Error executing AI action ${action.type}:`, error);
        }
    }

    aiBuyLand(nation, player) {
        const cost = this.calculateLandCost(nation.land);
        if (nation.money >= cost) {
            nation.money -= cost;
            nation.land += 100;
            console.log(`${nation.name} bought land for $${cost}`);
        }
    }

    aiBuyInfra(nation, player) {
        const cost = this.calculateInfraCost(nation.infra);
        if (nation.money >= cost) {
            nation.money -= cost;
            nation.infra += 100;
            console.log(`${nation.name} bought infrastructure for $${cost}`);
        }
    }

    aiBuyTech(nation, player) {
        const cost = this.calculateTechCost(nation.tech);
        if (nation.money >= cost) {
            nation.money -= cost;
            nation.tech += 50;
            console.log(`${nation.name} bought technology for $${cost}`);
        }
    }

    aiRecruitSoldiers(nation) {
        const maxSoldiers = Math.floor(nation.population * 0.1);
        const currentSoldiers = nation.militaryUnits.soldiers || 0;
        
        if (currentSoldiers < maxSoldiers && nation.money >= 50000) {
            const recruits = Math.min(100, maxSoldiers - currentSoldiers);
            nation.militaryUnits.soldiers += recruits;
            nation.money -= recruits * 500;
            console.log(`${nation.name} recruited ${recruits} soldiers`);
        }
    }

    aiRecruitTanks(nation) {
        const maxTanks = Math.floor(nation.population * 0.05);
        const currentTanks = nation.militaryUnits.tanks || 0;
        
        if (currentTanks < maxTanks && nation.money >= 200000) {
            const newTanks = Math.min(10, maxTanks - currentTanks);
            nation.militaryUnits.tanks += newTanks;
            nation.money -= newTanks * 20000;
            console.log(`${nation.name} built ${newTanks} tanks`);
        }
    }

    aiDeclareWar(nation, targetId) {
        // Use existing war system
        if (window.WarSystem) {
            const result = window.WarSystem.declareWar(nation.id, targetId);
            if (result.success) {
                console.log(`${nation.name} declared war on ${targetId}`);
            }
        }
    }

    aiMakeTreaty(nation, targetId) {
        // Use existing diplomacy system
        if (window.DiplomacySystem) {
            const treatyTypes = ['non_aggression', 'trade', 'mutual_defense'];
            const treatyType = treatyTypes[Math.floor(Math.random() * treatyTypes.length)];
            
            const result = window.DiplomacySystem.proposeTreaty(nation.id, targetId, treatyType);
            if (result.success) {
                console.log(`${nation.name} proposed ${treatyType} treaty with ${targetId}`);
            }
        }
    }

    aiStartResearch(nation) {
        // Simple research selection based on current needs
        const availableResearch = ['agriculture', 'metalworking', 'writing', 'wheel'];
        const research = availableResearch[Math.floor(Math.random() * availableResearch.length)];
        
        if (window.ResearchSystem) {
            const result = window.ResearchSystem.startResearch(nation.id, research);
            if (result.success) {
                console.log(`${nation.name} started researching ${research}`);
            }
        }
    }
    // Helper methods for AI decision making
    calculateLandCost(currentLand) {
        return Math.floor(GameConfig.LAND_COST_BASE * Math.pow(GameConfig.LAND_COST_MULTIPLIER, currentLand / 1000));
    }

    calculateInfraCost(currentInfra) {
        return Math.floor(GameConfig.INFRA_COST_BASE * (currentInfra / 1000 + 1));
    }

    calculateTechCost(currentTech) {
        return Math.floor(GameConfig.TECH_COST_BASE * (currentTech / 500 + 1));
    }

    getNearbyNations(nation) {
        // In a real implementation, this would use map/territory data
        // For now, return random subset of other AI nations
        const others = Array.from(this.aiNations.values()).filter(n => n.id !== nation.id);
        return others.slice(0, 3 + Math.floor(Math.random() * 3));
    }

    getNearbyEnemies(nation) {
        return nation.wars.map(war => war.enemy);
    }

    getPotentialAllies(nation) {
        return this.getNearbyNations(nation).filter(n => 
            !this.areAtWar(nation, n) && 
            !this.haveTreaty(nation, n) &&
            Math.random() < nation.aiPersonality.cooperation
        );
    }

    getPotentialTargets(nation) {
        return this.getNearbyNations(nation).filter(n => {
            const strengthRatio = nation.militaryStrength / (n.militaryStrength + 1);
            return strengthRatio > 1.2 && !this.haveTreaty(nation, n);
        });
    }

    getTradeOpportunities(nation) {
        // Simple implementation - return nations with different primary resources
        return this.getNearbyNations(nation).filter(n => 
            n.primaryResource !== nation.primaryResource
        );
    }

    areAtWar(nation1, nation2) {
        return nation1.wars.some(war => 
            war.attacker === nation2.id || war.defender === nation2.id
        );
    }

    haveTreaty(nation1, nation2) {
        return nation1.treaties?.some(treaty => 
            treaty.participants.includes(nation1.id) && treaty.participants.includes(nation2.id)
        );
    }

    updateAINations() {
        // Update all AI nations each turn
        for (const [nationId, aiNation] of this.aiNations) {
            if (!aiNation.isAI) continue;
            
            try {
                // Update nation calculations
                aiNation.calculateAll();
                
                // Update AI personality slightly over time
                this.evolveAIPersonality(aiNation);
                
            } catch (error) {
                console.error(`Error updating AI nation ${aiNation.name}:`, error);
            }
        }
    }

    evolveAIPersonality(nation) {
        // Small random changes to personality over time
        const personality = nation.aiPersonality;
        
        for (const [trait, value] of Object.entries(personality)) {
            const change = (Math.random() - 0.5) * 0.02; // ±1% change
            personality[trait] = Math.max(0, Math.min(1, value + change));
        }
        
        // Personality changes based on recent events
        if (nation.wars.length > 0) {
            personality.aggressiveness = Math.min(1, personality.aggressiveness + 0.01);
            personality.diplomacy = Math.max(0, personality.diplomacy - 0.01);
        }
        
        if (nation.nationStats?.happiness > 70) {
            personality.cooperation = Math.min(1, personality.cooperation + 0.005);
        }
    }

    // Public API methods
    getAINation(nationId) {
        return this.aiNations.get(nationId);
    }

    getAllAINations() {
        return Array.from(this.aiNations.values());
    }

    getAIPlayer(playerId) {
        return this.aiPlayers.get(playerId);
    }

    isAINation(nationId) {
        return this.aiNations.has(nationId);
    }

    removeAINation(nationId) {
        const aiNation = this.aiNations.get(nationId);
        if (aiNation && aiNation.playerId) {
            this.aiPlayers.delete(aiNation.playerId);
        }
        return this.aiNations.delete(nationId);
    }

    setAISettings(newSettings) {
        this.aiSettings = { ...this.aiSettings, ...newSettings };
        console.log('AI settings updated:', this.aiSettings);
    }

    getAIStats() {
        const stats = {
            totalAINations: this.aiNations.size,
            activeAINations: 0,
            averagePopulation: 0,
            averageGDP: 0,
            averageMilitary: 0,
            activeWars: 0,
            activeTreaties: 0
        };
        
        let totalPop = 0, totalGDP = 0, totalMilitary = 0;
        
        for (const nation of this.aiNations.values()) {
            if (nation.isAlive && nation.population > 0) {
                stats.activeAINations++;
                totalPop += nation.population;
                totalGDP += nation.taxableIncome || 0;
                totalMilitary += nation.militaryStrength;
                stats.activeWars += nation.wars?.length || 0;
                stats.activeTreaties += nation.treaties?.length || 0;
            }
        }
        
        if (stats.activeAINations > 0) {
            stats.averagePopulation = Math.floor(totalPop / stats.activeAINations);
            stats.averageGDP = Math.floor(totalGDP / stats.activeAINations);
            stats.averageMilitary = Math.floor(totalMilitary / stats.activeAINations);
        }
        
        return stats;
    }

    // Debug and testing methods
    forceAIAction(nationId, actionType, ...args) {
        const nation = this.aiNations.get(nationId);
        if (!nation) return { success: false, message: 'Nation not found' };
        
        try {
            const action = { type: actionType };
            this.executeAIAction(nation, action);
            return { success: true, message: `Executed ${actionType}` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getAIDecisionLog(nationId, limit = 10) {
        // This would return recent AI decisions for debugging
        // For now, return empty array
        return [];
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AINationsSystem = AINationsSystem;
    
    // Auto-initialize if other systems are ready
    if (typeof GameEngine !== 'undefined') {
        window.aiNations = new AINationsSystem();
    }
}