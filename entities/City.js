/**
 * City Entity - Represents cities within a nation
 * Integrates with Nation territories, population, and resource systems
 */

class City {
    constructor(name, nation, coordinates = { x: 0, y: 0 }) {
        this.id = this.generateId();
        this.name = name;
        this.nationId = nation?.id || nation;
        this.coordinates = coordinates;
        this.founded = Date.now();
        
        // Integration with Nation system
        this.territoryIds = []; // Map tiles this city controls
        this.isCapital = false;
        this.capitalCity = false; // For backward compatibility with Nation.capitalCity
        
        // City Stats (contributes to Nation totals)
        this.population = 0; // Contributes to Nation.population
        this.happiness = 50; // Influences Nation.happiness
        this.infrastructure = 0; // Contributes to Nation.infra
        this.defenses = 0; // Contributes to Nation defense calculations
        this.land = 0; // Contributes to Nation.land
        
        // Resources (feeds into Nation.resources via ResourceSystem)
        this.resources = {
            iron: 0, lead: 0, lumber: 0, water: 0, food: 0,
            uranium: 0, coal: 0, oil: 0, limestone: 0, bauxite: 0,
            steel: 0, ammo: 0, paper: 0, cookedFood: 0,
            cement: 0, gas: 0, aluminum: 0
        };
        
        // Building management (integrates with BuildingsSystem)
        this.buildings = new Map(); // Building ID -> quantity
        this.buildingEffects = {}; // Aggregated effects from buildings
        this.districts = [];
        
        // City Specializations
        this.specialization = null; // 'industrial', 'commercial', 'military', 'research'
        this.tradingPosts = [];
        this.militaryUnits = []; // IDs of units stationed here
        
        // Integration with game systems
        this.improvements = {}; // Links to Nation.improvements
        this.projects = {}; // Links to Nation.projects
        
        // Events and history
        this.eventHistory = [];
        this.activeEvents = [];
        
        // Performance tracking
        this.lastUpdate = Date.now();
        this.productionHistory = [];
    }
    
    generateId() {
        return 'city_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Update city stats based on nation status
     */
    updateFromNation() {
        if (!window.Nation) return;
        
        const nation = window.Nation;
        
        // Update happiness based on nation happiness and local factors
        this.updateHappiness();
        
        // Update infrastructure contribution
        this.updateInfrastructureContribution();
        
        // Update resource production
        this.produceResources();
    }
    
    /**
     * Contribute this city's stats to nation totals
     */
    contributeToNation() {
        if (!window.Nation) return;
        
        const nation = window.Nation;
        
        // Add city to nation territories if not already there
        if (this.territoryIds.length > 0 && !nation.cities.includes(this.id)) {
            nation.cities.push(this.id);
        }
        
        // Set as capital if flagged
        if (this.isCapital && nation.capitalCity !== this.name) {
            nation.capitalCity = this.name;
        }
        
        return {
            population: this.population,
            infrastructure: this.infrastructure,
            resources: { ...this.resources },
            buildingEffects: { ...this.buildingEffects }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITY MANAGEMENT (Updated for Nation integration)
    // ═══════════════════════════════════════════════════════════════════════
    
    updatePopulation() {
        // Base population calculation using Nation formulas
        if (!window.Nation) {
            this.population = this.infrastructure * 100;
            return this.population;
        }
        
        const nation = window.Nation;
        
        // City population as fraction of national population
        const nationalPop = nation.population || 1;
        const infrastructureRatio = this.infrastructure / Math.max(1, nation.infra);
        
        // City gets proportional share based on infrastructure
        this.population = Math.floor(nationalPop * infrastructureRatio * 0.1); // 10% base allocation
        
        // Happiness and specialization modifiers
        const happinessMod = 0.8 + (this.happiness / 250); // 0.8 to 1.2 multiplier
        
        // Building bonuses using Nation's improvement system
        let buildingBonus = 1.0;
        if (this.buildings.has('housing') || this.improvements?.housing) {
            buildingBonus += 0.2;
        }
        
        // Apply modifiers
        this.population = Math.floor(this.population * happinessMod * buildingBonus);
        
        return this.population;
    }
    
    updateHappiness() {
        // Start with nation's base happiness
        let happiness = window.Nation?.happiness || 50;
        
        // Local city modifiers
        happiness += Math.min(25, this.infrastructure / 20);
        
        // Building bonuses using Nation's building system
        if (this.buildings.has('entertainment') || this.improvements?.park) {
            happiness += (this.improvements?.park || 0) * 5;
        }
        if (this.buildings.has('temple') || this.improvements?.embassy) {
            happiness += (this.improvements?.embassy || 0) * 3;
        }
        if (this.buildings.has('market') || this.improvements?.port) {
            happiness += (this.improvements?.port || 0) * 2;
        }
        
        // Resource shortages (using Nation's critical resource system)
        if (window.Nation?.resources) {
            const nationResources = window.Nation.resources;
            if (nationResources.water < this.population * 0.01) {
                happiness -= 15;
            }
            if (nationResources.food < this.population * 0.01) {
                happiness -= 15;
            }
        }
        
        // Apply Nation's nation statistics
        if (window.Nation?.nationStats) {
            const stats = window.Nation.nationStats;
            happiness -= stats.crime * 0.2; // Crime reduces happiness
            happiness -= stats.disease * 0.3; // Disease reduces happiness
            happiness -= stats.pollution * 0.1; // Pollution reduces happiness
        }
        
        this.happiness = Math.max(0, Math.min(100, happiness));
        return this.happiness;
    }
    
    updateInfrastructureContribution() {
        // This city's infrastructure contributes to nation total
        // Called by Nation when calculating total infrastructure
        return this.infrastructure;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUILDING SYSTEM (Integrates with Nation's BuildingsSystem)
    // ═══════════════════════════════════════════════════════════════════════
    
    addBuilding(buildingName, quantity = 1) {
        // This should work with Nation's improvement/project system
        if (!window.Nation) return false;
        
        // Add to city tracking
        const current = this.buildings.get(buildingName) || 0;
        this.buildings.set(buildingName, current + quantity);
        
        // Update Nation's improvements if it's a valid improvement type
        const improvementTypes = [
            'port', 'mine', 'assemblyPlant', 'barracks', 'factory', 
            'airforceBase', 'harbor', 'hospital', 'policeStation', 
            'recyclingCenter', 'school', 'park', 'casino', 
            'embassy', 'foreignAffairsOffice', 'internalAffairsOffice'
        ];
        
        if (improvementTypes.includes(buildingName)) {
            window.Nation.improvements[buildingName] = (window.Nation.improvements[buildingName] || 0) + quantity;
            
            // Trigger Nation's building system to recalculate effects
            if (window.GameEngine?.systems?.buildings) {
                window.GameEngine.systems.buildings.calculateImprovementEffects();
            }
        }
        
        // Recalculate building effects
        this.calculateBuildingEffects();
        
        this.addEvent(`Built ${quantity} ${buildingName} building(s)`);
        return true;
    }
    
    removeBuilding(buildingName, quantity = 1) {
        const current = this.buildings.get(buildingName) || 0;
        if (current < quantity) return false;
        
        // Remove from city
        const remaining = current - quantity;
        if (remaining <= 0) {
            this.buildings.delete(buildingName);
        } else {
            this.buildings.set(buildingName, remaining);
        }
        
        // Update Nation's improvements
        if (window.Nation?.improvements && window.Nation.improvements[buildingName]) {
            window.Nation.improvements[buildingName] = Math.max(0, 
                window.Nation.improvements[buildingName] - quantity
            );
            
            // Trigger recalculation
            if (window.GameEngine?.systems?.buildings) {
                window.GameEngine.systems.buildings.calculateImprovementEffects();
            }
        }
        
        this.calculateBuildingEffects();
        
        this.addEvent(`Demolished ${quantity} ${buildingName} building(s)`);
        return true;
    }
    
    getBuildingCount(buildingName) {
        return this.buildings.get(buildingName) || 0;
    }
    
    calculateBuildingEffects() {
        // Calculate aggregated effects from all buildings in this city
        this.buildingEffects = {};
        
        for (const [buildingName, count] of this.buildings) {
            // Use Nation's building effects if available
            if (window.Nation?.improvementEffects) {
                // Copy relevant effects (this is a simplified version)
                const effects = window.Nation.improvementEffects;
                
                // Aggregate effects proportionally
                if (effects.happinessBonus) {
                    this.buildingEffects.happinessBonus = (this.buildingEffects.happinessBonus || 0) + 
                        (effects.happinessBonus * count * 0.1); // 10% per building
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESOURCE MANAGEMENT (Integrates with Nation's ResourceSystem)
    // ═══════════════════════════════════════════════════════════════════════
    
    produceResources() {
        if (!window.Nation) return {};

        const production = {};

        // ── Building-specific production ─────────────────────────────────
        // NOTE: ResourceSystem.generateTerritoryResources() handles Nation-level
        // mine production each turn. City mines are tracked here for city-level
        // stats only — do NOT push to window.Nation.resources to avoid double-counting.
        for (const [buildingName, count] of this.buildings) {
            switch (buildingName) {
                case 'mine':
                    // Record city mine output (uses same 0.1/mine rate as ResourceSystem)
                    if (window.Nation.primaryResource) {
                        production[window.Nation.primaryResource] =
                            (production[window.Nation.primaryResource] || 0) + count * 0.1;
                    }
                    break;
                case 'farm':
                    production.food = (production.food || 0) + count * 20;
                    break;
                case 'well':
                    production.water = (production.water || 0) + count * 25;
                    break;
                case 'factory':
                    production.steel = (production.steel || 0) + count * 5;
                    break;
            }
        }

        // ── Specialization bonuses (city-level only) ─────────────────────
        if (this.specialization === 'industrial') {
            if (this.buildings.has('factory') || window.Nation?.improvements?.assemblyPlant) {
                production.steel  = (production.steel  || 0) + this.infrastructure * 0.5;
                production.cement = (production.cement || 0) + this.infrastructure * 0.3;
            }
        } else if (this.specialization === 'commercial') {
            if (this.buildings.has('port') || window.Nation?.improvements?.port) {
                production.paper = (production.paper || 0) + this.infrastructure * 0.3;
                production.gas   = (production.gas   || 0) + this.infrastructure * 0.2;
            }
        }

        // ── Store in city's own resource pool only ───────────────────────
        // Nation-level resources are managed exclusively by ResourceSystem and
        // Nation.calculateEconomy(). Cities track their own stockpile separately.
        for (const [resource, amount] of Object.entries(production)) {
            this.resources[resource] = (this.resources[resource] || 0) + amount;
        }

        return production;
    }
    
    consumeResources() {
        if (!window.Nation) return {};
        
        const consumption = {};
        
        // Base consumption tied to Nation's population efficiency
        const popEfficiency = window.Nation.nationStats?.populationEfficiency || 1.0;
        consumption.water = this.population * 0.01 * popEfficiency;
        consumption.food = this.population * 0.01 * popEfficiency;
        
        // Building maintenance (follows Nation's patterns)
        for (const [buildingName, count] of this.buildings) {
            switch (buildingName) {
                case 'factory':
                    consumption.iron = (consumption.iron || 0) + count * 2;
                    consumption.coal = (consumption.coal || 0) + count * 1;
                    break;
                case 'mine':
                    consumption.lumber = (consumption.lumber || 0) + count * 1;
                    break;
            }
        }
        
        // Consume from city resources first, then from Nation
        for (const [resource, amount] of Object.entries(consumption)) {
            const cityAvailable = this.resources[resource] || 0;
            
            if (cityAvailable >= amount) {
                // City can handle its own consumption
                this.resources[resource] -= amount;
            } else {
                // Need to draw from Nation resources
                const needed = amount - cityAvailable;
                this.resources[resource] = 0;
                
                if (window.Nation.resources && window.Nation.resources[resource]) {
                    window.Nation.resources[resource] = Math.max(0, 
                        window.Nation.resources[resource] - needed
                    );
                }
            }
        }
        
        return consumption;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITY DEVELOPMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    expandInfrastructure(amount) {
        if (amount <= 0) return false;
        
        this.infrastructure += amount;
        this.addEvent(`Infrastructure expanded by ${amount}`);
        return true;
    }
    
    setSpecialization(type) {
        const validTypes = ['industrial', 'commercial', 'military', 'research', null];
        if (!validTypes.includes(type)) return false;
        
        const oldSpec = this.specialization;
        this.specialization = type;
        
        if (oldSpec !== type) {
            this.addEvent(`Specialization changed from ${oldSpec || 'none'} to ${type || 'none'}`);
        }
        
        return true;
    }
    
    upgradeDefenses(amount) {
        if (amount <= 0) return false;
        
        this.defenses += amount;
        this.addEvent(`Defenses upgraded by ${amount}`);
        return true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITY EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    addEvent(description, type = 'info') {
        const event = {
            id: Date.now(),
            timestamp: Date.now(),
            description,
            type
        };
        
        this.eventHistory.push(event);
        
        // Keep only last 100 events
        if (this.eventHistory.length > 100) {
            this.eventHistory = this.eventHistory.slice(-100);
        }
        
        return event;
    }
    
    getRecentEvents(limit = 10) {
        return this.eventHistory.slice(-limit).reverse();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITY STATISTICS
    // ═══════════════════════════════════════════════════════════════════════
    
    getStats() {
        return {
            id: this.id,
            name: this.name,
            population: this.population,
            happiness: this.happiness,
            infrastructure: this.infrastructure,
            defenses: this.defenses,
            specialization: this.specialization,
            isCapital: this.isCapital,
            buildingCount: this.buildings.size,
            age: Date.now() - this.founded
        };
    }
    
    getResourceSummary() {
        const total = Object.values(this.resources).reduce((sum, val) => sum + val, 0);
        const criticalResources = {
            water: this.resources.water,
            food: this.resources.food
        };
        
        return {
            totalResources: total,
            criticalResources,
            resourceTypes: Object.keys(this.resources).filter(r => this.resources[r] > 0).length
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CITY UPDATES (MAIN LOOP)
    // ═══════════════════════════════════════════════════════════════════════
    
    update() {
        // Update population and happiness
        this.updatePopulation();
        this.updateHappiness();
        
        // Resource production and consumption
        this.produceResources();
        this.consumeResources();
        
        // Process active events
        this.processActiveEvents();
    }
    
    processActiveEvents() {
        const now = Date.now();
        this.activeEvents = this.activeEvents.filter(event => {
            if (event.endTime && now >= event.endTime) {
                this.addEvent(`Event ended: ${event.name}`, 'system');
                return false;
            }
            return true;
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    serialize() {
        return {
            id: this.id,
            name: this.name,
            nationId: this.nationId,
            coordinates: this.coordinates,
            founded: this.founded,
            
            // Stats
            population: this.population,
            happiness: this.happiness,
            infrastructure: this.infrastructure,
            defenses: this.defenses,
            
            // Resources
            resources: { ...this.resources },
            
            // Buildings (convert Map to Object)
            buildings: Object.fromEntries(this.buildings),
            
            // Features
            isCapital: this.isCapital,
            specialization: this.specialization,
            tradingPosts: [...this.tradingPosts],
            militaryUnits: [...this.militaryUnits],
            
            // Events
            eventHistory: [...this.eventHistory],
            activeEvents: [...this.activeEvents]
        };
    }
    
    static deserialize(data) {
        const city = new City(data.name, data.nationId, data.coordinates);
        
        // Restore properties
        city.id = data.id;
        city.founded = data.founded || Date.now();
        
        // Stats
        city.population = data.population || 0;
        city.happiness = data.happiness || 50;
        city.infrastructure = data.infrastructure || 0;
        city.defenses = data.defenses || 0;
        
        // Resources
        if (data.resources) {
            city.resources = { ...city.resources, ...data.resources };
        }
        
        // Buildings (convert Object back to Map)
        if (data.buildings) {
            city.buildings = new Map(Object.entries(data.buildings));
        }
        
        // Features
        city.isCapital = data.isCapital || false;
        city.specialization = data.specialization || null;
        city.tradingPosts = data.tradingPosts || [];
        city.militaryUnits = data.militaryUnits || [];
        
        // Events
        city.eventHistory = data.eventHistory || [];
        city.activeEvents = data.activeEvents || [];
        
        return city;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.City = City;
}