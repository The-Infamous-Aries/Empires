/**
 * Territory Manager - Handles Territory Ownership and Management
 * Dominion Wars - Nation Building Strategy Game
 */

class TerritoryManager {
    constructor() {
        this.isInitialized = false;
        this.claimCosts = new Map();
        this.territoryBonuses = new Map();
        this.lastUpdateTime = 0;
        this.updateInterval = 1000; // Update every second
        
        this.initializeClaimCosts();
        this.initializeTerritoryBonuses();
    }

    /**
     * Initialize the territory manager
     */
    async initialize() {
        console.log('Initializing Territory Manager...');
        
        // Subscribe to relevant events
        this.bindEvents();
        
        // Calculate initial territory values
        this.recalculateAllTerritoryValues();
        
        this.isInitialized = true;
        console.log('Territory Manager initialized');
    }

    /**
     * Bind event listeners.
     * Only subscribe handlers that are actually implemented on the class.
     */
    bindEvents() {
        // Territory claim events
        EventBus.on('claim_territory',  this.handleTerritoryClaimRequest,  this);
        EventBus.on('abandon_territory', this.handleTerritoryAbandonRequest, this);

        // Infrastructure events
        EventBus.on('build_infrastructure', this.handleInfrastructureBuild, this);
        EventBus.on('upgrade_territory',    this.handleTerritoryUpgrade,    this);

        // Combat events
        EventBus.on('territory_attacked', this.handleTerritoryAttack,   this);
        EventBus.on('territory_defended', this.handleTerritoryDefense,  this);

        // Time events
        EventBus.on(GameEvents.DAY_PASSED, this.handleDayPassed, this);
    }

    /**
     * Handle territory abandon request
     */
    handleTerritoryAbandonRequest(data) {
        const territory = data.territory || data;
        if (!territory) return;
        const nationId = 'player';
        const key = `${territory.x},${territory.y}`;
        if (this.abandonTerritory(key, nationId)) {
            EventBus.emit('show_notification', {
                message: `Territory abandoned`,
                type: 'info'
            });
        }
    }

    /**
     * Handle infrastructure build request
     */
    handleInfrastructureBuild(data) {
        const { territory, infrastructureType, cost } = data || {};
        if (!territory || !infrastructureType) return;
        const key = `${territory.x},${territory.y}`;
        this.buildInfrastructure(key, infrastructureType, cost || {});
    }

    /**
     * Handle territory upgrade request
     */
    handleTerritoryUpgrade(data) {
        const { territory, cost } = data || {};
        if (!territory) return;
        const key = `${territory.x},${territory.y}`;
        this.upgradeTerritory(key, cost || {});
    }

    /**
     * Handle territory defense event
     */
    handleTerritoryDefense(data) {
        // Placeholder — defense outcomes are resolved by WarSystem.
        // Log for now; real logic can be added when WarSystem integration is complete.
        console.log('Territory defense event received:', data);
    }

    /**
     * Initialize territory claim costs
     */
    initializeClaimCosts() {
        // Base costs for claiming territories by size
        this.claimCosts.set('small', {
            money: 5000,
            materials: 100,
            influence: 10
        });
        
        this.claimCosts.set('medium', {
            money: 15000,
            materials: 300,
            influence: 25
        });
        
        this.claimCosts.set('large', {
            money: 40000,
            materials: 800,
            influence: 50
        });
    }

    /**
     * Initialize territory bonuses
     */
    initializeTerritoryBonuses() {
        // Bonuses based on territory characteristics
        this.territoryBonuses.set('coastal', {
            trade: 1.3,
            naval_capacity: 2.0,
            fishing: 1.5
        });
        
        this.territoryBonuses.set('mountainous', {
            mining: 1.8,
            defense: 1.4,
            materials: 1.2
        });
        
        this.territoryBonuses.set('fertile', {
            agriculture: 1.6,
            population_growth: 1.3,
            food: 1.4
        });
        
        this.territoryBonuses.set('strategic', {
            military_effectiveness: 1.5,
            diplomatic_influence: 1.3,
            trade_routes: 1.4
        });
    }

    /**
     * Handle territory claim request
     */
    handleTerritoryClaimRequest(data) {
        const territory = data.territory || data;
        if (!territory) {
            console.error('No territory provided for claim request');
            return;
        }

        if (territory.owner) {
            EventBus.emit('show_notification', {
                message: `${territory.name} is already owned by another nation`,
                type: 'warning'
            });
            return;
        }

        // Check if player can afford to claim
        const cost = this.calculateClaimCost(territory);
        if (!this.canAffordClaim(cost)) {
            EventBus.emit('show_notification', {
                message: 'Insufficient resources to claim this territory',
                type: 'error'
            });
            return;
        }

        // Attempt to claim territory
        if (this.claimTerritory(territory.id, 'player', cost)) {
            EventBus.emit('show_notification', {
                message: `Successfully claimed ${territory.name}!`,
                type: 'success'
            });
            
            EventBus.emit(GameEvents.TERRITORY_CLAIMED, {
                territory: territory,
                owner: 'player',
                cost: cost
            });
        }
    }

    /**
     * Calculate the cost to claim a territory
     */
    calculateClaimCost(territory) {
        const baseCost = this.claimCosts.get(territory.size);
        const cost = { ...baseCost };

        // Modify cost based on territory properties
        let multiplier = 1.0;

        // Higher cost for fertile land
        if (territory.fertility > 0.7) {
            multiplier *= 1.5;
        }

        // Higher cost for coastal territories
        if (territory.coastal) {
            multiplier *= 1.3;
        }

        // Higher cost for resource-rich territories
        const resourceCount = Object.keys(territory.resources).length;
        multiplier *= (1 + resourceCount * 0.2);

        // Higher cost for strategic locations
        if (territory.isStrategic) {
            multiplier *= 2.0;
        }

        // Apply multiplier to all costs
        Object.keys(cost).forEach(resource => {
            cost[resource] = Math.floor(cost[resource] * multiplier);
        });

        return cost;
    }

    /**
     * Check if player can afford to claim territory
     */
    canAffordClaim(cost) {
        // This would check against actual player resources
        // For now, return true as placeholder
        return true;
    }

    /**
     * Resolve a territory from an id/key/object.
     * TerritoryManager uses GridMap (window.GridMap) as its data source.
     * The id may be:
     *   - a "x,y" string key
     *   - an object with .x / .y properties
     *   - an object that is itself the territory (has .ownerId field)
     */
    _resolveTerritory(idOrObj) {
        if (!idOrObj) return null;
        const gm = window.GridMap;
        if (!gm) return null;
        // Already a territory object
        if (typeof idOrObj === 'object' && 'x' in idOrObj && 'y' in idOrObj) {
            return idOrObj;
        }
        // String key "x,y"
        if (typeof idOrObj === 'string' && idOrObj.includes(',')) {
            const [x, y] = idOrObj.split(',').map(Number);
            return gm.getTerritory(x, y) || null;
        }
        return null;
    }

    /**
     * Claim a territory
     */
    claimTerritory(territoryId, nationId, cost = null) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory) {
            console.error(`Territory ${territoryId} not found`);
            return false;
        }

        if (territory.owner) {
            console.error(`Territory ${territoryId} is already owned`);
            return false;
        }

        // Set ownership
        territory.owner = nationId;
        territory.claimedDate = Date.now();
        
        // Deduct costs if provided
        if (cost && nationId === 'player') {
            // Deduct from player resources
            this.deductResources(cost);
        }

        // Calculate territory benefits
        this.updateTerritoryBonuses(territory);

        const territoryName = territory.name || `(${territory.x},${territory.y})`;
        console.log(`Territory ${territoryName} claimed by ${nationId}`);
        return true;
    }

    /**
     * Abandon a territory
     */
    abandonTerritory(territoryId, nationId) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory) {
            console.error(`Territory ${territoryId} not found`);
            return false;
        }

        if (territory.owner !== nationId) {
            console.error(`Territory ${territoryId} is not owned by ${nationId}`);
            return false;
        }

        // Remove ownership
        territory.owner = null;
        territory.claimedDate = null;
        territory.developmentLevel = Math.max(1, (territory.developmentLevel || 1) * 0.5);

        const territoryName = territory.name || `(${territory.x},${territory.y})`;
        console.log(`Territory ${territoryName} abandoned by ${nationId}`);
        
        EventBus.emit(GameEvents.TERRITORY_ABANDONED, {
            territory: territory,
            previousOwner: nationId
        });

        return true;
    }

    /**
     * Transfer territory ownership
     */
    transferTerritory(territoryId, fromNationId, toNationId) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory) return false;

        if (territory.owner !== fromNationId) return false;

        territory.owner = toNationId;
        territory.transferDate = Date.now();

        EventBus.emit(GameEvents.TERRITORY_TRANSFERRED, {
            territory: territory,
            from: fromNationId,
            to: toNationId
        });

        return true;
    }

    /**
     * Upgrade territory development level
     */
    upgradeTerritory(territoryId, upgradeCost) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory || !territory.owner) return false;

        // Check if can afford upgrade
        if (!this.canAffordUpgrade(upgradeCost)) return false;

        // Apply upgrade
        territory.developmentLevel = (territory.developmentLevel || 1) + 1;
        territory.infrastructure = (territory.infrastructure || 0) + 10;
        territory.economicValue = (territory.economicValue || 1) * 1.1;

        // Deduct costs
        this.deductResources(upgradeCost);

        EventBus.emit(GameEvents.TERRITORY_UPGRADED, {
            territory: territory,
            newLevel: territory.developmentLevel
        });

        return true;
    }

    /**
     * Build infrastructure in territory
     */
    buildInfrastructure(territoryId, infrastructureType, cost) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory || territory.owner !== 'player') return false;

        if (!this.canAffordUpgrade(cost)) return false;

        // Add infrastructure
        if (!territory.infrastructure_buildings) {
            territory.infrastructure_buildings = [];
        }

        territory.infrastructure_buildings.push({
            type: infrastructureType,
            built: Date.now(),
            level: 1
        });

        territory.infrastructure = (territory.infrastructure || 0) + 5;
        territory.economicValue = (territory.economicValue || 1) * 1.05;

        // Deduct costs
        this.deductResources(cost);

        EventBus.emit(GameEvents.INFRASTRUCTURE_BUILT, {
            territory: territory,
            infrastructureType: infrastructureType
        });

        return true;
    }

    /**
     * Calculate territory income per day
     */
    calculateTerritoryIncome(territory) {
        if (!territory.owner) return { money: 0, materials: 0, food: 0 };

        let baseIncome = {
            money: territory.population * 0.5,
            materials: 0,
            food: territory.fertility * 100
        };

        // Apply development level multiplier
        const developmentMultiplier = 1 + (territory.developmentLevel - 1) * 0.2;
        Object.keys(baseIncome).forEach(resource => {
            baseIncome[resource] *= developmentMultiplier;
        });

        // Apply infrastructure bonuses
        const infrastructureMultiplier = 1 + (territory.infrastructure / 100);
        Object.keys(baseIncome).forEach(resource => {
            baseIncome[resource] *= infrastructureMultiplier;
        });

        // Add resource extraction
        Object.values(territory.resources).forEach(resource => {
            if (resource.type === 'iron' || resource.type === 'coal') {
                baseIncome.materials += resource.maxExtraction * 0.8;
            } else if (resource.type === 'gold') {
                baseIncome.money += resource.maxExtraction * resource.value;
            }
        });

        // Apply territory bonuses
        this.applyTerritoryBonuses(territory, baseIncome);

        // Round values
        Object.keys(baseIncome).forEach(resource => {
            baseIncome[resource] = Math.floor(baseIncome[resource]);
        });

        return baseIncome;
    }

    /**
     * Apply territory bonuses to income
     */
    applyTerritoryBonuses(territory, income) {
        // Coastal bonus
        if (territory.coastal) {
            const bonus = this.territoryBonuses.get('coastal');
            if (bonus.trade) {
                income.money *= bonus.trade;
            }
        }

        // Mountainous bonus (high elevation)
        if (territory.elevation > 600) {
            const bonus = this.territoryBonuses.get('mountainous');
            if (bonus.materials) {
                income.materials *= bonus.materials;
            }
        }

        // Fertile bonus
        if (territory.fertility > 0.7) {
            const bonus = this.territoryBonuses.get('fertile');
            if (bonus.food) {
                income.food *= bonus.food;
            }
        }

        // Strategic location bonus
        if (territory.isStrategic) {
            const bonus = this.territoryBonuses.get('strategic');
            income.money *= 1.2;
            income.materials *= 1.1;
        }
    }

    /**
     * Update territory bonuses
     */
    updateTerritoryBonuses(territory) {
        territory.bonuses = {};

        // Calculate all applicable bonuses
        if (territory.coastal) {
            territory.bonuses.coastal = this.territoryBonuses.get('coastal');
        }

        if (territory.elevation > 600) {
            territory.bonuses.mountainous = this.territoryBonuses.get('mountainous');
        }

        if (territory.fertility > 0.7) {
            territory.bonuses.fertile = this.territoryBonuses.get('fertile');
        }

        if (territory.isStrategic) {
            territory.bonuses.strategic = this.territoryBonuses.get('strategic');
        }
    }

    /**
     * Handle territory attack
     */
    handleTerritoryAttack(data) {
        const { territory, attacker, attackForce } = data;
        
        if (!territory.owner || territory.owner === attacker) {
            console.error('Invalid attack target');
            return;
        }

        // Calculate defense strength
        const defenseStrength = this.calculateTerritoryDefense(territory);
        
        // Simple combat calculation (placeholder)
        const attackSuccess = attackForce > defenseStrength * 1.2;
        
        if (attackSuccess) {
            // Transfer territory
            const previousOwner = territory.owner;
            const territoryKey = `${territory.x},${territory.y}`;
            this.transferTerritory(territoryKey, previousOwner, attacker);
            
            // Reduce development due to war damage
            territory.developmentLevel *= 0.8;
            territory.infrastructure *= 0.9;
            territory.population *= 0.95;
            
            EventBus.emit(GameEvents.TERRITORY_CONQUERED, {
                territory: territory,
                conqueror: attacker,
                previousOwner: previousOwner
            });
        } else {
            EventBus.emit(GameEvents.TERRITORY_ATTACK_FAILED, {
                territory: territory,
                attacker: attacker
            });
        }
    }

    /**
     * Calculate territory defense strength
     */
    calculateTerritoryDefense(territory) {
        let defenseStrength = territory.population * 0.01; // Militia
        
        // Add garrison strength
        defenseStrength += territory.garrisonStrength || 0;
        
        // Apply defense bonuses
        if (territory.bonuses && territory.bonuses.mountainous) {
            defenseStrength *= territory.bonuses.mountainous.defense;
        }
        
        // Infrastructure bonus
        defenseStrength *= (1 + territory.infrastructure / 200);
        
        // Fortification bonus
        defenseStrength *= (1 + (territory.fortificationLevel || 0));
        
        return defenseStrength;
    }

    /**
     * Handle day passed event
     */
    handleDayPassed(data) {
        if (!window.GridMap) return;
        // Update all territories
        const territories = window.GridMap.getAllTerritories();
        
        territories.forEach(territory => {
            if (territory.owner) {
                // Generate daily income
                const income = this.calculateTerritoryIncome(territory);
                
                // Apply income to nation resources
                this.applyTerritoryIncome(territory.owner, income);
                
                // Population growth
                this.updateTerritoryPopulation(territory);
                
                // Resource extraction
                this.extractTerritoryResources(territory);
            }
        });
    }

    /**
     * Update territory population
     */
    updateTerritoryPopulation(territory) {
        const growthRate = GameConfig.POPULATION_GROWTH.BASE_RATE;
        let growth = territory.population * growthRate;
        
        // Apply happiness modifier
        if (window.Nation && window.Nation.happiness) {
            const happinessModifier = (window.Nation.happiness - 50) / 50;
            growth *= (1 + happinessModifier * GameConfig.POPULATION_GROWTH.HAPPINESS_MODIFIER);
        }
        
        // Apply fertility bonus
        growth *= (1 + territory.fertility * 0.5);
        
        // Apply capacity constraints
        const capacity = territory.infrastructure * 100;
        if (territory.population > capacity * 0.8) {
            growth *= GameConfig.POPULATION_GROWTH.CAPACITY_MODIFIER;
        }
        
        territory.population += Math.floor(growth);
    }

    /**
     * Extract resources from territory
     */
    extractTerritoryResources(territory) {
        Object.values(territory.resources).forEach(resource => {
            const extracted = Math.min(resource.maxExtraction, resource.abundance - resource.extracted);
            resource.extracted += extracted;
            
            // Add to nation stockpile
            if (territory.owner === 'player' && window.Nation) {
                if (!window.Nation.resourceStockpile) {
                    window.Nation.resourceStockpile = {};
                }
                if (!window.Nation.resourceStockpile[resource.type]) {
                    window.Nation.resourceStockpile[resource.type] = 0;
                }
                window.Nation.resourceStockpile[resource.type] += extracted;
            }
        });
    }

    /**
     * Apply territory income to nation
     */
    applyTerritoryIncome(nationId, income) {
        if (nationId === 'player' && window.Nation) {
            // Add income to nation resources
            Object.entries(income).forEach(([resource, amount]) => {
                if (window.Nation.resources[resource] !== undefined) {
                    window.Nation.resources[resource] += amount;
                }
            });
        }
    }

    /**
     * Recalculate all territory values
     */
    recalculateAllTerritoryValues() {
        if (!window.GridMap) return;
        const territories = window.GridMap.getAllTerritories();
        territories.forEach(territory => {
            this.updateTerritoryBonuses(territory);
        });
    }

    /**
     * Deduct resources (placeholder)
     */
    deductResources(cost) {
        if (window.Nation) {
            Object.entries(cost).forEach(([resource, amount]) => {
                if (window.Nation.resources[resource] !== undefined) {
                    window.Nation.resources[resource] -= amount;
                }
            });
        }
    }

    /**
     * Check if can afford upgrade (placeholder)
     */
    canAffordUpgrade(cost) {
        if (!window.Nation) return false;
        
        return Object.entries(cost).every(([resource, amount]) => {
            return window.Nation.resources[resource] >= amount;
        });
    }

    /**
     * Get territories owned by nation
     */
    getNationTerritories(nationId) {
        if (!window.GridMap) return [];
        return window.GridMap.getNationTerritories(nationId);
    }

    /**
     * Get total nation territory stats
     */
    getNationTerritoryStats(nationId) {
        const territories = this.getNationTerritories(nationId);
        
        const stats = {
            count: territories.length,
            totalPopulation: 0,
            totalArea: 0,
            totalIncome: { money: 0, materials: 0, food: 0 },
            avgDevelopment: 0,
            avgHappiness: 50
        };

        territories.forEach(territory => {
            stats.totalPopulation += territory.population;
            stats.totalArea += territory.area;
            stats.avgDevelopment += territory.developmentLevel;
            
            const income = this.calculateTerritoryIncome(territory);
            Object.keys(stats.totalIncome).forEach(resource => {
                stats.totalIncome[resource] += income[resource] || 0;
            });
        });

        if (territories.length > 0) {
            stats.avgDevelopment /= territories.length;
        }

        return stats;
    }

    /**
     * Get territory manager state for saving
     */
    getState() {
        return {
            lastUpdateTime: this.lastUpdateTime,
            claimCosts: Object.fromEntries(this.claimCosts),
            territoryBonuses: Object.fromEntries(this.territoryBonuses)
        };
    }

    /**
     * Set territory manager state from save
     */
    setState(state) {
        if (state.lastUpdateTime) this.lastUpdateTime = state.lastUpdateTime;
        if (state.claimCosts) this.claimCosts = new Map(Object.entries(state.claimCosts));
        if (state.territoryBonuses) this.territoryBonuses = new Map(Object.entries(state.territoryBonuses));
    }

    /**
     * Update method called by game engine
     */
    update(deltaTime) {
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime >= this.updateInterval) {
            // Perform periodic updates
            this.lastUpdateTime = currentTime;
        }
    }

    /**
     * Destroy territory manager
     */
    destroy() {
        this.isInitialized = false;
        console.log('Territory Manager destroyed');
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TerritoryManager };
}

// Expose as both TerritoryManager and TerritorySystem so game-engine.js
// can instantiate it regardless of which name it checks for.
window.TerritoryManager = TerritoryManager;
window.TerritorySystem  = TerritoryManager;