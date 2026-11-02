/**
 * Territory Manager - Corrected Integration with Real Game Systems
 * Dominion Wars - Nation Building Strategy Game
 *
 * This file is the rules/logic layer between the map data (map-data.js)
 * and the real game systems (Nation, NationSystem, WorldBankSystem).
 *
 * How territories work in the real game:
 *   1. Nation buys land (miles) via NationSystem.buyLand() -> increases land + mapBlocks
 *      Cost formula: landCost() = nextMile * (pop/1000) * 10 * tierMult
 *      First 10 blocks (1000 miles) are free; after that you pay.
 *   2. Nation claims a map tile using one mapBlock.
 *      mapBlocks = Math.floor(land / 100)  (1 block = 100 miles = 1 tile)
 *      You can only claim as many tiles as you have blocks.
 *      New claim must touch an existing owned tile (or be your first).
 *   3. WorldBankSystem tracks territory slot purchases with compounding cost
 *      and taxes them. recordTerritoryPurchase() is called on each claim.
 *
 * Map data source: window.GridMap (from map-data.js) - sparse, expandable grid.
 * Player nation: window.Nation (the logged-in player's nation entity).
 * All money/land operations go through the real systems, not local copies.
 */

class TerritoryManager {
    constructor() {
        this.isInitialized = false;
        this.lastUpdateTime = 0;
        this.updateInterval = 1000;

        // Cached references to game systems (resolved on initialize)
        this.gridMap = null;
        this.nationSystem = null;
        this.worldBank = null;
        this.player = null;
        this.nation = null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════════════════

    async initialize() {
        console.log('Initializing Territory Manager...');

        // Resolve global references
        this.gridMap = window.GridMap || null;
        this.player = window.Player || null;
        this.nation = window.Nation || null;
        this.nationSystem = window.NationSystem || null;
        this.worldBank = window.WorldBankSystem || null;

        if (!this.gridMap) {
            console.warn('Territory Manager: window.GridMap not found — map-data.js must load first');
        }
        if (!this.nationSystem) {
            console.warn('Territory Manager: window.NationSystem not found — land costs unavailable');
        }
        if (!this.worldBank) {
            console.warn('Territory Manager: window.WorldBankSystem not found — territory taxes unavailable');
        }

        this.bindEvents();

        this.isInitialized = true;
        console.log('Territory Manager initialized');
    }

    /**
     * Bind event listeners to the global EventBus.
     */
    bindEvents() {
        if (!window.EventBus) return;

        // Territory claim/abandon requests from the map UI
        window.EventBus.on('claim_territory', this.handleTerritoryClaimRequest, this);
        window.EventBus.on('abandon_territory', this.handleTerritoryAbandonRequest, this);

        // Infrastructure / upgrade requests
        window.EventBus.on('build_infrastructure', this.handleInfrastructureBuild, this);
        window.EventBus.on('upgrade_territory', this.handleTerritoryUpgrade, this);

        // Combat events
        window.EventBus.on('territory_attacked', this.handleTerritoryAttack, this);
        window.EventBus.on('territory_defended', this.handleTerritoryDefense, this);

        // Daily turn — process income, population, resources for all owned tiles
        window.EventBus.on(GameEvents.DAY_PASSED, this.handleDayPassed, this);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CLAIM / ABANDON / TRANSFER
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Handle a claim request from the map UI.
     * data: { x, y } or { territory: { x, y } }
     */
    handleTerritoryClaimRequest(data) {
        const territory = data.territory || data;
        if (!territory || territory.x === undefined || territory.y === undefined) {
            console.error('Territory Manager: no valid coordinates for claim');
            this._notify('Invalid territory coordinates', 'error');
            return;
        }

        const { x, y } = territory;
        const nation = this._getPlayerNation();
        if (!nation) {
            this._notify('No nation found', 'error');
            return;
        }

        // Validate the claim through the full rules pipeline
        const result = this.canClaim(x, y, nation.id || nation.playerId);
        if (!result.allowed) {
            this._notify(result.reason || 'Cannot claim this territory', 'warning');
            return;
        }

        // Calculate total cost: land purchase + WorldBank territory tax
        const costInfo = this._calculateClaimCost(nation);
        if (nation.money < costInfo.totalCost) {
            this._notify(`Need $${costInfo.totalCost.toLocaleString()}, have $${nation.money.toLocaleString()}`, 'error');
            return;
        }

        // Execute the purchase
        const success = this._executeClaim(x, y, nation, costInfo);
        if (success) {
            this._notify(`Territory claimed at (${x}, ${y})`, 'success');
            window.EventBus.emit(GameEvents.TERRITORY_ADDED, {
                territory: { x, y, ownerId: nation.id || nation.playerId, area: 100 },
                nation: nation.serialize ? nation.serialize() : nation
            });
            window.EventBus.emit('territory_claimed', { x, y, nationId: nation.id || nation.playerId });
        } else {
            this._notify('Claim failed — see console for details', 'error');
        }
    }

    /**
     * Handle an abandon request.
     */
    handleTerritoryAbandonRequest(data) {
        const territory = data.territory || data;
        if (!territory || territory.x === undefined || territory.y === undefined) return;

        const nation = this._getPlayerNation();
        if (!nation) return;

        const key = `${territory.x},${territory.y}`;
        if (this.abandonTerritory(key, nation.id || nation.playerId)) {
            this._notify('Territory abandoned', 'info');
        }
    }

    /**
     * Check whether a nation can claim a tile at (x, y).
     * Returns { allowed: boolean, reason?: string }.
     */
    canClaim(x, y, nationId) {
        if (!this.gridMap) return { allowed: false, reason: 'Map data not loaded' };

        const nation = this._getNationById(nationId);
        if (!nation) return { allowed: false, reason: 'Nation not found' };

        const key = `${x},${y}`;
        const existing = this.gridMap.getTerritory(x, y);
        if (existing && existing.ownerId) {
            return { allowed: false, reason: 'Territory already claimed' };
        }

        // Must have mapBlocks available
        const mapBlocks = nation.mapBlocks || 0;
        const ownedCount = (nation.territories || []).length;
        if (ownedCount >= mapBlocks) {
            return { allowed: false, reason: 'Buy another land block first' };
        }

        // Adjacency check: first claim is free, otherwise must touch existing territory
        if (ownedCount > 0) {
            const touches = this._touchesExistingTerritory(x, y, nationId);
            if (!touches) {
                return { allowed: false, reason: 'New territory must touch your nation' };
            }
        }

        return { allowed: true };
    }

    /**
     * Abandon a territory tile.
     * Returns true on success.
     */
    abandonTerritory(territoryId, nationId) {
        if (!this.gridMap) return false;

        const nation = this._getNationById(nationId);
        if (!nation) return false;

        // Parse key "x,y"
        let x, y;
        if (typeof territoryId === 'string' && territoryId.includes(',')) {
            [x, y] = territoryId.split(',').map(Number);
        } else if (typeof territoryId === 'object' && territoryId.x !== undefined) {
            x = territoryId.x;
            y = territoryId.y;
        } else {
            return false;
        }

        const territory = this.gridMap.getTerritory(x, y);
        if (!territory || !territory.ownerId) return false;
        if (territory.ownerId !== nationId) return false;

        // Clear ownership in grid map
        territory.ownerId = null;
        territory.ownerFaction = null;
        territory.claimedDate = null;

        // Remove from nation's territory list
        const key = `${x},${y}`;
        const idx = nation.territories ? nation.territories.indexOf(key) : -1;
        if (idx !== -1) {
            nation.territories.splice(idx, 1);
        }

        // Emit removal event
        window.EventBus.emit(GameEvents.TERRITORY_REMOVED, {
            territoryId: key,
            nation: nation.serialize ? nation.serialize() : nation
        });

        return true;
    }

    /**
     * Transfer territory ownership (used by conquest).
     */
    transferTerritory(territoryId, fromNationId, toNationId) {
        if (!this.gridMap) return false;

        const toNation = this._getNationById(toNationId);
        if (!toNation) return false;

        let x, y;
        if (typeof territoryId === 'string' && territoryId.includes(',')) {
            [x, y] = territoryId.split(',').map(Number);
        } else if (typeof territoryId === 'object' && territoryId.x !== undefined) {
            x = territoryId.x;
            y = territoryId.y;
        } else {
            return false;
        }

        const territory = this.gridMap.getTerritory(x, y);
        if (!territory || territory.ownerId !== fromNationId) return false;

        territory.ownerId = toNationId;
        territory.ownerFaction = toNation.factionColor || null;
        territory.claimedDate = Date.now();

        // Remove from old nation, add to new
        const fromNation = this._getNationById(fromNationId);
        if (fromNation && fromNation.territories) {
            const idx = fromNation.territories.indexOf(`${x},${y}`);
            if (idx !== -1) fromNation.territories.splice(idx, 1);
        }
        if (!toNation.territories) toNation.territories = [];
        toNation.territories.push(`${x},${y}`);

        window.EventBus.emit(GameEvents.TERRITORY_ADDED, {
            territory: { x, y, ownerId: toNationId, area: 100 },
            nation: toNation.serialize ? toNation.serialize() : toNation
        });
        window.EventBus.emit('territory_transferred', {
            territory: { x, y },
            from: fromNationId,
            to: toNationId
        });

        return true;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COST CALCULATION (real game formulas)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Calculate the total cost to claim one new territory tile.
     * Combines:
     *   1. NationSystem.landCost() — cost to buy 100 miles (1 block) of land
     *   2. WorldBankSystem.calculateTerritoryPurchaseCost() — territory slot tax
     *
     * Returns { baseCost, taxAmount, totalCost, breakdown }
     */
    _calculateClaimCost(nation) {
        const landCost = this.nationSystem && typeof this.nationSystem.landCost === 'function'
            ? this.nationSystem.landCost()
            : 0;

        let wbCost = { baseCost: 0, taxAmount: 0, totalCost: 0, breakdown: {} };
        if (this.worldBank && typeof this.worldBank.calculateTerritoryPurchaseCost === 'function') {
            wbCost = this.worldBank.calculateTerritoryPurchaseCost(nation);
        }

        // The land cost buys 100 miles = 1 map block = 1 tile
        const baseCost = Math.max(landCost, wbCost.baseCost || 0);
        const taxAmount = wbCost.taxAmount || 0;
        const totalCost = baseCost + taxAmount;

        return {
            baseCost,
            taxAmount,
            totalCost,
            breakdown: wbCost.breakdown || {}
        };
    }

    /**
     * Execute a claim: buy land, record with World Bank, mark tile in GridMap,
     * add territory to nation.
     */
    _executeClaim(x, y, nation, costInfo) {
        try {
            // 1. Buy one land block (100 miles) via NationSystem
            //    buyLand() buys 1 mile at a time; we need 100 miles for a block.
            //    Call it 100 times OR just increment land directly.
            //    We use the public API: buyLand() handles the cost deduction.
            if (this.nationSystem && typeof this.nationSystem.buyLand === 'function') {
                // buyLand() buys 1 mile; we need 100 miles per block.
                // However, the first 1000 miles are free. For simplicity and correctness,
                // we increment land by 100 and deduct the cost once.
                const milesNeeded = 100;
                for (let i = 0; i < milesNeeded; i++) {
                    if (!this.nationSystem.buyLand()) {
                        throw new Error('Failed to purchase land miles');
                    }
                }
            } else {
                // Fallback: direct increment if NationSystem unavailable
                nation.land = (nation.land || 0) + 100;
                nation.mapBlocks = Math.floor(nation.land / 100);
                nation.money = (nation.money || 0) - costInfo.baseCost;
            }

            // 2. Record territory purchase with World Bank (taxes, tracking)
            if (this.worldBank && typeof this.worldBank.recordTerritoryPurchase === 'function') {
                const currentDay = window.TimeSystem ? window.TimeSystem.currentDay : 0;
                this.worldBank.recordTerritoryPurchase(nation, currentDay, costInfo.taxAmount);
            }

            // 3. Mark tile in GridMap
            this.gridMap.claimTerritory(x, y, nation.id || nation.playerId, nation.factionColor || null);

            // 4. Add territory to nation entity
            if (nation.addTerritory) {
                nation.addTerritory({ id: `${x},${y}`, area: 100 });
            } else if (!nation.territories) {
                nation.territories = [`${x},${y}`];
            } else {
                nation.territories.push(`${x},${y}`);
            }

            // 5. Recalculate population/economy after land change
            if (nation.calculatePopulation) nation.calculatePopulation();
            if (nation.calculateEconomy) nation.calculateEconomy();

            return true;
        } catch (err) {
            console.error('Territory Manager: claim execution failed:', err);
            return false;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INFRASTRUCTURE / UPGRADES
    // ══════════════════════════════════════════════════════════════════════════

    handleInfrastructureBuild(data) {
        const { territory, infrastructureType, cost } = data || {};
        if (!territory || !infrastructureType) return;
        const key = `${territory.x},${territory.y}`;
        this.buildInfrastructure(key, infrastructureType, cost || {});
    }

    handleTerritoryUpgrade(data) {
        const { territory, cost } = data || {};
        if (!territory) return;
        const key = `${territory.x},${territory.y}`;
        this.upgradeTerritory(key, cost || {});
    }

    buildInfrastructure(territoryId, infrastructureType, cost) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory || territory.ownerId !== (this.player?.playerId || 'player')) return false;

        const nation = this._getPlayerNation();
        if (!nation || nation.money < (cost.money || 0)) return false;

        nation.money -= cost.money || 0;
        territory.infrastructure_buildings = territory.infrastructure_buildings || [];
        territory.infrastructure_buildings.push({ type: infrastructureType, built: Date.now(), level: 1 });
        territory.infrastructure = (territory.infrastructure || 0) + 5;

        window.EventBus.emit(GameEvents.INFRASTRUCTURE_BUILT, {
            territory, infrastructureType
        });
        return true;
    }

    upgradeTerritory(territoryId, upgradeCost) {
        const territory = this._resolveTerritory(territoryId);
        if (!territory || !territory.ownerId) return false;

        const nation = this._getPlayerNation();
        if (!nation || nation.money < (upgradeCost.money || 0)) return false;

        nation.money -= upgradeCost.money || 0;
        territory.developmentLevel = (territory.developmentLevel || 1) + 1;
        territory.infrastructure = (territory.infrastructure || 0) + 10;

        window.EventBus.emit(GameEvents.TERRITORY_UPGRADED, {
            territory, newLevel: territory.developmentLevel
        });
        return true;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COMBAT
    // ══════════════════════════════════════════════════════════════════════════

    handleTerritoryAttack(data) {
        const { territory, attacker, attackForce } = data || {};
        if (!territory || !attacker) return;

        if (!territory.ownerId || territory.ownerId === attacker) {
            console.error('Territory Manager: invalid attack target');
            return;
        }

        const defenseStrength = this.calculateTerritoryDefense(territory);
        const attackSuccess = attackForce > defenseStrength * 1.2;

        if (attackSuccess) {
            const previousOwner = territory.ownerId;
            this.transferTerritory(`${territory.x},${territory.y}`, previousOwner, attacker);

            // War damage
            territory.developmentLevel = Math.max(0, (territory.developmentLevel || 1) * 0.8);
            territory.infrastructure = Math.max(0, (territory.infrastructure || 0) * 0.9);
            territory.population = Math.max(0, (territory.population || 0) * 0.95);

            window.EventBus.emit(GameEvents.TERRITORY_CONQUERED, {
                territory, conqueror: attacker, previousOwner
            });
        } else {
            window.EventBus.emit('territory_attack_failed', { territory, attacker });
        }
    }

    handleTerritoryDefense(data) {
        console.log('Territory Manager: defense event received:', data);
    }

    calculateTerritoryDefense(territory) {
        let defense = (territory.population || 0) * 0.01; // militia
        defense += territory.garrisonStrength || 0;
        if (territory.bonuses && territory.bonuses.mountainous) {
            defense *= territory.bonuses.mountainous.defense || 1;
        }
        defense *= (1 + (territory.infrastructure || 0) / 200);
        defense *= (1 + (territory.fortificationLevel || 0));
        return defense;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DAILY TURN (income, population, resources)
    // ══════════════════════════════════════════════════════════════════════════

    handleDayPassed(data) {
        if (!this.gridMap) return;

        const territories = this.gridMap.getAllTerritories();
        territories.forEach(territory => {
            if (!territory.ownerId) return;

            // Daily income
            const income = this.calculateTerritoryIncome(territory);
            this.applyTerritoryIncome(territory.ownerId, income);

            // Population growth
            this.updateTerritoryPopulation(territory);

            // Resource extraction
            this.extractTerritoryResources(territory);
        });
    }

    /**
     * Calculate daily income for a territory.
     */
    calculateTerritoryIncome(territory) {
        if (!territory.ownerId) return { money: 0, materials: 0, food: 0 };

        const population = territory.population || 0;
        const development = territory.developmentLevel || 1;
        const infrastructure = territory.infrastructure || 0;

        const devMultiplier = 1 + (development - 1) * 0.2;
        const infraMultiplier = 1 + infrastructure / 100;

        let baseIncome = {
            money: Math.floor(population * 0.5 * devMultiplier * infraMultiplier),
            materials: 0,
            food: Math.floor(population * 0.1 * devMultiplier * infraMultiplier)
        };

        // Resource extraction income
        const resources = territory.resources || {};
        Object.values(resources).forEach(resource => {
            if (resource.type === 'iron' || resource.type === 'coal') {
                baseIncome.materials += Math.floor((resource.maxExtraction || 0) * 0.8);
            } else if (resource.type === 'gold') {
                baseIncome.money += Math.floor((resource.maxExtraction || 0) * (resource.value || 1));
            }
        });

        // Territory bonuses
        if (territory.bonuses) {
            if (territory.coastal && territory.bonuses.coastal) {
                baseIncome.money = Math.floor(baseIncome.money * (territory.bonuses.coastal.trade || 1));
            }
            if (territory.elevation > 600 && territory.bonuses.mountainous) {
                baseIncome.materials = Math.floor(baseIncome.materials * (territory.bonuses.mountainous.materials || 1));
            }
            if (territory.fertility > 0.7 && territory.bonuses.fertile) {
                baseIncome.food = Math.floor(baseIncome.food * (territory.bonuses.fertile.food || 1));
            }
            if (territory.isStrategic && territory.bonuses.strategic) {
                baseIncome.money = Math.floor(baseIncome.money * 1.2);
                baseIncome.materials = Math.floor(baseIncome.materials * 1.1);
            }
        }

        return baseIncome;
    }

    updateTerritoryPopulation(territory) {
        const growthRate = GameConfig.POPULATION_GROWTH?.BASE_RATE || 0.001;
        let growth = (territory.population || 0) * growthRate;

        // Happiness modifier
        if (window.Nation && window.Nation.happiness) {
            const happinessModifier = (window.Nation.happiness - 50) / 50;
            growth *= (1 + happinessModifier * (GameConfig.POPULATION_GROWTH?.HAPPINESS_MODIFIER || 0));
        }

        // Fertility bonus
        growth *= (1 + (territory.fertility || 0) * 0.5);

        // Capacity constraint
        const capacity = (territory.infrastructure || 0) * 100;
        if ((territory.population || 0) > capacity * 0.8) {
            growth *= GameConfig.POPULATION_GROWTH?.CAPACITY_MODIFIER || 0.5;
        }

        territory.population = Math.floor((territory.population || 0) + growth);
    }

    extractTerritoryResources(territory) {
        const resources = territory.resources || {};
        Object.values(resources).forEach(resource => {
            const extracted = Math.min(resource.maxExtraction || 0, (resource.abundance || 0) - (resource.extracted || 0));
            resource.extracted = (resource.extracted || 0) + extracted;

            if (territory.ownerId === 'player' && window.Nation) {
                if (!window.Nation.resourceStockpile) window.Nation.resourceStockpile = {};
                if (!window.Nation.resourceStockpile[resource.type]) {
                    window.Nation.resourceStockpile[resource.type] = 0;
                }
                window.Nation.resourceStockpile[resource.type] += extracted;
            }
        });
    }

    applyTerritoryIncome(nationId, income) {
        if (nationId === 'player' && window.Nation) {
            Object.entries(income).forEach(([resource, amount]) => {
                if (window.Nation.resources && window.Nation.resources[resource] !== undefined) {
                    window.Nation.resources[resource] += amount;
                }
            });
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    _getPlayerNation() {
        if (window.Nation && window.Nation.id) return window.Nation;
        if (this.nation) return this.nation;
        if (window.Player && window.Player.playerId) {
            return this._getNationById(window.Player.playerId);
        }
        return null;
    }

    _getNationById(nationId) {
        // Try window.Nation first (the player's nation)
        if (window.Nation && (window.Nation.id === nationId || window.Nation.playerId === nationId)) {
            return window.Nation;
        }
        // Try GameEngine nations
        if (window.GameEngine && window.GameEngine.nations) {
            return window.GameEngine.nations[nationId] || null;
        }
        // Try DatabaseManager
        if (window.DatabaseManager && window.DatabaseManager.nationDatabase) {
            return window.DatabaseManager.nationDatabase.getNation(nationId);
        }
        return null;
    }

    _resolveTerritory(idOrObj) {
        if (!idOrObj) return null;
        if (!this.gridMap) return null;

        if (typeof idOrObj === 'object' && idOrObj.x !== undefined && idOrObj.y !== undefined) {
            return idOrObj;
        }
        if (typeof idOrObj === 'string' && idOrObj.includes(',')) {
            const [x, y] = idOrObj.split(',').map(Number);
            return this.gridMap.getTerritory(x, y) || null;
        }
        return null;
    }

    _touchesExistingTerritory(x, y, nationId) {
        if (!this.gridMap) return false;
        const adjacent = [
            [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
        ];
        return adjacent.some(([ax, ay]) => {
            const t = this.gridMap.getTerritory(ax, ay);
            return t && t.ownerId === nationId;
        });
    }

    _notify(message, type = 'info') {
        if (window.EventBus) {
            window.EventBus.emit('show_notification', { message, type });
        }
        console.log(`[Territory Manager] ${message}`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // QUERY API (used by renderers)
    // ══════════════════════════════════════════════════════════════════════════

    getTerritory(x, y) {
        return this.gridMap ? this.gridMap.getTerritory(x, y) : null;
    }

    getTerritoriesByOwner(nationId) {
        if (!this.gridMap) return [];
        return this.gridMap.getNationTerritories(nationId) || [];
    }

    getAllTerritories() {
        return this.gridMap ? this.gridMap.getAllTerritories() : [];
    }

    getNationTerritoryStats(nationId) {
        const territories = this.getTerritoriesByOwner(nationId);
        const stats = {
            count: territories.length,
            totalPopulation: 0,
            totalArea: territories.length * 100,
            totalIncome: { money: 0, materials: 0, food: 0 },
            avgDevelopment: 0
        };
        territories.forEach(t => {
            stats.totalPopulation += t.population || 0;
            stats.avgDevelopment += t.developmentLevel || 0;
            const income = this.calculateTerritoryIncome(t);
            Object.keys(stats.totalIncome).forEach(r => {
                stats.totalIncome[r] += income[r] || 0;
            });
        });
        if (territories.length > 0) stats.avgDevelopment /= territories.length;
        return stats;
    }

    getFactionInfo() {
        return this.gridMap ? this.gridMap.getFactionInfo() : {};
    }

    getAvailableFactionColors() {
        return this.gridMap ? this.gridMap.getAvailableFactionColors() : [];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE / STATE
    // ══════════════════════════════════════════════════════════════════════════

    update(deltaTime) {
        const now = Date.now();
        if (now - this.lastUpdateTime >= this.updateInterval) {
            this.lastUpdateTime = now;
        }
    }

    getState() {
        return { lastUpdateTime: this.lastUpdateTime };
    }

    setState(state) {
        if (state && state.lastUpdateTime !== undefined) this.lastUpdateTime = state.lastUpdateTime;
    }

    destroy() {
        this.isInitialized = false;
        if (window.EventBus) {
            window.EventBus.off('claim_territory', this.handleTerritoryClaimRequest, this);
            window.EventBus.off('abandon_territory', this.handleTerritoryAbandonRequest, this);
            window.EventBus.off('build_infrastructure', this.handleInfrastructureBuild, this);
            window.EventBus.off('upgrade_territory', this.handleTerritoryUpgrade, this);
            window.EventBus.off('territory_attacked', this.handleTerritoryAttack, this);
            window.EventBus.off('territory_defended', this.handleTerritoryDefense, this);
            window.EventBus.off(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        }
        console.log('Territory Manager destroyed');
    }
}

window.TerritoryManager = TerritoryManager;
window.TerritorySystem = TerritoryManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TerritoryManager };
}
