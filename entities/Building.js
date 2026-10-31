/**
 * Building Entity - Represents individual buildings and construction projects
 * Integrates with Nation's BuildingsSystem, ImprovementsSystem, ProjectsSystem, WondersSystem
 */

class Building {
    constructor(buildingName, buildingType = 'improvement', cityId = null, nationId = null) {
        this.id = this.generateId();
        this.name = buildingName; // 'port', 'mine', 'university', etc.
        this.type = buildingType; // 'improvement', 'project', 'wonder'
        this.cityId = cityId;
        this.nationId = nationId;
        this.built = Date.now();
        
        // Building Status
        this.isActive = true;
        this.condition = 100; // 0-100 condition/durability
        this.efficiency = 1.0; // Efficiency multiplier
        this.quantity = 1; // How many of this building
        
        // Building Stats (from Nation's system)
        this.level = 1;
        this.maxLevel = this.getMaxLevel();
        this.maintenanceCost = this.getMaintenanceCost();
        this.powerConsumption = this.getPowerConsumption();
        this.workerCapacity = this.getWorkerCapacity();
        this.currentWorkers = 0;
        
        // Building Effects (integrates with Nation effects)
        this.effects = this.getBuildingEffects();
        this.bonuses = this.getBuildingBonuses();
        this.production = this.getBuildingProduction();
        this.consumption = this.getBuildingConsumption();
        
        // Integration with Nation systems
        this.contributesToNationEffects = true;
        this.nationEffectKeys = []; // Which Nation properties this building affects
        
        // Building Events
        this.eventHistory = [];
        this.lastMaintenance = Date.now();
        
        this.initializeBuildingStats();
    }
    
    generateId() {
        return 'building_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUILDING INITIALIZATION (Uses Nation's Building System Data)
    // ═══════════════════════════════════════════════════════════════════════
    
    initializeBuildingStats() {
        // Get building data from Nation's systems
        const buildingData = this.getNationBuildingData();
        
        if (buildingData) {
            this.maxLevel = buildingData.maxLevel || 1;
            this.maintenanceCost = buildingData.maintenance || 0;
            this.powerConsumption = buildingData.power || 0;
            this.workerCapacity = buildingData.workers || 0;
            this.effects = { ...buildingData.effects };
            this.production = { ...buildingData.production };
            this.consumption = { ...buildingData.consumption };
            
            // Determine which Nation properties this affects
            this.determineNationEffects();
        }
    }
    
    getNationBuildingData() {
        // Use Nation's BuildingsSystem data if available
        if (window.GameEngine?.systems?.buildings) {
            const buildingsSystem = window.GameEngine.systems.buildings;
            
            // Check improvements first
            if (buildingsSystem.improvements && buildingsSystem.improvements[this.name]) {
                return {
                    type: 'improvement',
                    ...buildingsSystem.improvements[this.name],
                    maxLevel: buildingsSystem.improvements[this.name].maxLevel || 10
                };
            }
            
            // Check projects
            if (buildingsSystem.projects && buildingsSystem.projects[this.name]) {
                return {
                    type: 'project',
                    ...buildingsSystem.projects[this.name],
                    maxLevel: buildingsSystem.projects[this.name].maxLevel || 5
                };
            }
            
            // Check wonders
            if (buildingsSystem.wonders && buildingsSystem.wonders[this.name]) {
                return {
                    type: 'wonder',
                    ...buildingsSystem.wonders[this.name],
                    maxLevel: 1 // Wonders are unique
                };
            }
        }
        
        // Fallback to our own data matching Nation's system
        return this.getFallbackBuildingData();
    }
    
    getFallbackBuildingData() {
        // Building data matching Nation's improvement/project system
        const buildingData = {
            // === IMPROVEMENTS ===
            'port': {
                type: 'improvement',
                maxLevel: 10,
                cost: 1500000, // $1.5M base cost
                maintenance: 5000,
                effects: { 
                    shipEffectiveness: 0.05, // +5% per level
                    tradeBonus: 0.1,
                    happinessBonus: 0.02
                },
                nationEffects: ['improvementEffects.shipEffectiveness', 'improvementEffects.happinessBonus']
            },
            'mine': {
                type: 'improvement', 
                maxLevel: 10,
                cost: 2000000,
                maintenance: 8000,
                effects: {
                    basicResourceBonus: 0.10, // +10% resource production
                    pollutionIncrease: 0.02
                },
                nationEffects: ['improvementEffects.basicResourceBonus']
            },
            'assemblyPlant': {
                type: 'improvement',
                maxLevel: 5,
                cost: 3000000,
                maintenance: 12000,
                effects: {
                    manufacturedResourceBonus: 0.20, // +20% manufactured resources
                    pollutionIncrease: 0.03
                },
                nationEffects: ['improvementEffects.manufacturedResourceBonus']
            },
            'barracks': {
                type: 'improvement',
                maxLevel: 10,
                cost: 2500000,
                maintenance: 10000,
                effects: {
                    soldierEffectiveness: 0.10, // +10% soldier effectiveness
                    militaryMoraleBonus: 0.05
                },
                nationEffects: ['improvementEffects.soldierEffectiveness']
            },
            'factory': {
                type: 'improvement',
                maxLevel: 7,
                cost: 4000000,
                maintenance: 15000,
                effects: {
                    tankEffectiveness: 0.10,
                    pollutionIncrease: 0.05
                },
                nationEffects: ['improvementEffects.tankEffectiveness']
            },
            'airforceBase': {
                type: 'improvement',
                maxLevel: 5,
                cost: 8000000,
                maintenance: 25000,
                effects: {
                    aircraftEffectiveness: 0.10
                },
                nationEffects: ['improvementEffects.aircraftEffectiveness']
            },
            'harbor': {
                type: 'improvement',
                maxLevel: 5,
                cost: 6000000,
                maintenance: 20000,
                effects: {
                    shipEffectiveness: 0.10
                },
                nationEffects: ['improvementEffects.shipEffectiveness']
            },
            'hospital': {
                type: 'improvement',
                maxLevel: 5,
                cost: 3500000,
                maintenance: 15000,
                effects: {
                    diseaseReduction: 0.05, // -5% disease per hospital
                    happinessBonus: 0.03
                },
                nationEffects: ['improvementEffects.diseaseReduction', 'improvementEffects.happinessBonus']
            },
            'policeStation': {
                type: 'improvement',
                maxLevel: 5,
                cost: 2200000,
                maintenance: 8000,
                effects: {
                    crimeReduction: 0.05, // -5% crime per station
                    happinessBonus: 0.02
                },
                nationEffects: ['improvementEffects.crimeReduction', 'improvementEffects.happinessBonus']
            },
            'recyclingCenter': {
                type: 'improvement',
                maxLevel: 3,
                cost: 1800000,
                maintenance: 6000,
                effects: {
                    pollutionReduction: 0.05, // -5% pollution per center
                    happinessBonus: 0.02
                },
                nationEffects: ['improvementEffects.pollutionReduction', 'improvementEffects.happinessBonus']
            },
            'school': {
                type: 'improvement',
                maxLevel: 5,
                cost: 2800000,
                maintenance: 12000,
                effects: {
                    literacyBonus: 0.075, // +7.5% literacy per school
                    happinessBonus: 0.025
                },
                nationEffects: ['improvementEffects.literacyBonus', 'improvementEffects.happinessBonus']
            },
            'park': {
                type: 'improvement',
                maxLevel: 5,
                cost: 1200000,
                maintenance: 3000,
                effects: {
                    happinessBonus: 0.05,
                    pollutionFromParks: -0.05 // Reduces pollution
                },
                nationEffects: ['improvementEffects.happinessBonus', 'improvementEffects.pollutionFromParks']
            },
            
            // === PROJECTS ===
            'university': {
                type: 'project',
                maxLevel: 3,
                cost: 15000000,
                techRequired: 500,
                maintenance: 25000,
                effects: {
                    literacyBonus: 0.10,
                    happinessBonus: 0.05,
                    techCostReduction: 0.05
                },
                nationEffects: ['projectEffects.universityLiteracyBonus', 'projectEffects.techCostReduction']
            },
            'missileSilo': {
                type: 'project',
                maxLevel: 10,
                cost: 25000000,
                techRequired: 750,
                maintenance: 50000,
                effects: {
                    missileProduction: 1, // 1 missile per day
                    missileStorage: 5     // 5 missile storage
                },
                nationEffects: ['projectEffects.missileProduction', 'projectEffects.missileStorage']
            }
        };
        
        return buildingData[this.name] || null;
    }
    
    determineNationEffects() {
        const data = this.getNationBuildingData();
        if (data && data.nationEffects) {
            this.nationEffectKeys = [...data.nationEffects];
        }
    }
    
    getMaxLevel() {
        const data = this.getNationBuildingData();
        return data ? data.maxLevel : 1;
    }
    
    getMaintenanceCost() {
        const data = this.getNationBuildingData();
        return data ? (data.maintenance || 0) : 0;
    }
    
    getPowerConsumption() {
        const data = this.getNationBuildingData();
        return data ? (data.power || 0) : 0;
    }
    
    getWorkerCapacity() {
        const data = this.getNationBuildingData();
        return data ? (data.workers || 0) : 0;
    }
    
    getBuildingEffects() {
        const data = this.getNationBuildingData();
        return data ? (data.effects || {}) : {};
    }
    
    getBuildingBonuses() {
        const data = this.getNationBuildingData();
        return data ? (data.bonuses || {}) : {};
    }
    
    getBuildingProduction() {
        const data = this.getNationBuildingData();
        return data ? (data.production || {}) : {};
    }
    
    getBuildingConsumption() {
        const data = this.getNationBuildingData();
        return data ? (data.consumption || {}) : {};
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Apply this building's effects to Nation
     */
    applyEffectsToNation() {
        if (!window.Nation || !this.contributesToNationEffects) return;
        
        const effectValue = this.getEffectiveValue();
        
        // Apply to Nation's improvement/project effects
        this.nationEffectKeys.forEach(effectKey => {
            const keys = effectKey.split('.');
            let target = window.Nation;
            
            // Navigate to the correct Nation property
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]]) target[keys[i]] = {};
                target = target[keys[i]];
            }
            
            const finalKey = keys[keys.length - 1];
            
            // Add this building's contribution
            if (typeof target[finalKey] === 'number') {
                target[finalKey] += effectValue;
            } else {
                target[finalKey] = effectValue;
            }
        });
        
        return true;
    }
    
    /**
     * Remove this building's effects from Nation
     */
    removeEffectsFromNation() {
        if (!window.Nation || !this.contributesToNationEffects) return;
        
        const effectValue = this.getEffectiveValue();
        
        this.nationEffectKeys.forEach(effectKey => {
            const keys = effectKey.split('.');
            let target = window.Nation;
            
            // Navigate to the correct Nation property
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]]) return; // Effect doesn't exist
                target = target[keys[i]];
            }
            
            const finalKey = keys[keys.length - 1];
            
            // Remove this building's contribution
            if (typeof target[finalKey] === 'number') {
                target[finalKey] = Math.max(0, target[finalKey] - effectValue);
            }
        });
        
        return true;
    }
    
    /**
     * Get this building's effective contribution value
     */
    getEffectiveValue() {
        // Base effect modified by condition, efficiency, and quantity
        const baseEffect = this.effects[Object.keys(this.effects)[0]] || 0;
        return baseEffect * (this.condition / 100) * this.efficiency * this.quantity;
    }
    
    /**
     * Update Nation's building counts
     */
    updateNationCount(change = 0) {
        if (!window.Nation) return;
        
        // Update improvement/project counts in Nation
        if (this.type === 'improvement' && window.Nation.improvements) {
            window.Nation.improvements[this.name] = 
                (window.Nation.improvements[this.name] || 0) + change;
        } else if (this.type === 'project' && window.Nation.projects) {
            window.Nation.projects[this.name] = 
                (window.Nation.projects[this.name] || 0) + change;
        }
        
        // Trigger system recalculation
        if (window.GameEngine?.systems?.buildings) {
            if (this.type === 'improvement') {
                window.GameEngine.systems.buildings.calculateImprovementEffects();
            } else if (this.type === 'project') {
                window.GameEngine.systems.buildings.calculateProjectEffects();
            }
        }
    }
    
    upgrade() {
        if (this.level >= this.maxLevel) {
            return { success: false, message: 'Building is already at maximum level' };
        }
        
        const upgradeCost = this.getUpgradeCost();
        // Note: Cost checking would be done by the calling system
        
        this.level++;
        this.efficiency = Math.min(2.0, 1.0 + (this.level - 1) * 0.1);
        this.updateEffects();
        
        this.addEvent(`Upgraded to level ${this.level}`, 'upgrade');
        
        return { 
            success: true, 
            message: `Building upgraded to level ${this.level}`,
            newLevel: this.level,
            newEfficiency: this.efficiency
        };
    }
    
    getUpgradeCost() {
        const baseCost = this.maintenanceCost * 10;
        const levelMultiplier = Math.pow(1.5, this.level);
        return Math.floor(baseCost * levelMultiplier);
    }
    
    repair(amount = 25) {
        const oldCondition = this.condition;
        this.condition = Math.min(100, this.condition + amount);
        
        if (this.condition !== oldCondition) {
            this.updateEfficiency();
            this.addEvent(`Repaired (+${this.condition - oldCondition} condition)`, 'maintenance');
        }
        
        return this.condition - oldCondition;
    }
    
    performMaintenance() {
        const timeSinceLastMaintenance = Date.now() - this.lastMaintenance;
        const daysSince = timeSinceLastMaintenance / (1000 * 60 * 60 * 24);
        
        // Condition degrades over time without maintenance
        const degradation = Math.min(10, daysSince * 0.5);
        this.condition = Math.max(0, this.condition - degradation);
        
        this.updateEfficiency();
        this.lastMaintenance = Date.now();
        
        if (degradation > 0) {
            this.addEvent(`Condition degraded by ${degradation.toFixed(1)}`, 'maintenance');
        }
        
        return degradation;
    }
    
    updateEfficiency() {
        // Efficiency based on condition and level
        const conditionFactor = this.condition / 100;
        const levelFactor = 1.0 + (this.level - 1) * 0.1;
        
        this.efficiency = conditionFactor * levelFactor;
        this.updateEffects();
    }
    
    updateEffects() {
        // Recalculate effects based on current efficiency and level
        const baseData = this.getBuildingData();
        if (!baseData) return;
        
        // Scale effects by efficiency and level
        for (const [effect, baseValue] of Object.entries(baseData.effects || {})) {
            this.effects[effect] = baseValue * this.efficiency * this.level;
        }
        
        for (const [resource, baseAmount] of Object.entries(baseData.production || {})) {
            this.production[resource] = Math.floor(baseAmount * this.efficiency * this.level);
        }
        
        for (const [resource, baseAmount] of Object.entries(baseData.consumption || {})) {
            this.consumption[resource] = Math.floor(baseAmount * this.level);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // WORKER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    assignWorkers(count) {
        const available = this.workerCapacity - this.currentWorkers;
        const assigned = Math.min(count, available);
        
        this.currentWorkers += assigned;
        
        if (assigned > 0) {
            this.addEvent(`Assigned ${assigned} workers (${this.currentWorkers}/${this.workerCapacity})`, 'workers');
        }
        
        return assigned;
    }
    
    removeWorkers(count) {
        const removed = Math.min(count, this.currentWorkers);
        this.currentWorkers -= removed;
        
        if (removed > 0) {
            this.addEvent(`Removed ${removed} workers (${this.currentWorkers}/${this.workerCapacity})`, 'workers');
        }
        
        return removed;
    }
    
    getWorkerEfficiency() {
        if (this.workerCapacity === 0) return 1.0;
        return Math.min(1.0, this.currentWorkers / this.workerCapacity);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRODUCTION & EFFECTS
    // ═══════════════════════════════════════════════════════════════════════
    
    getActualProduction() {
        const workerEfficiency = this.getWorkerEfficiency();
        const actualProduction = {};
        
        for (const [resource, amount] of Object.entries(this.production)) {
            actualProduction[resource] = Math.floor(amount * workerEfficiency);
        }
        
        return actualProduction;
    }
    
    getActualConsumption() {
        const workerEfficiency = this.getWorkerEfficiency();
        const actualConsumption = {};
        
        for (const [resource, amount] of Object.entries(this.consumption)) {
            actualConsumption[resource] = Math.floor(amount * workerEfficiency);
        }
        
        return actualConsumption;
    }
    
    getActualEffects() {
        const workerEfficiency = this.getWorkerEfficiency();
        const actualEffects = {};
        
        for (const [effect, value] of Object.entries(this.effects)) {
            actualEffects[effect] = value * workerEfficiency;
        }
        
        return actualEffects;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUILDING STATUS
    // ═══════════════════════════════════════════════════════════════════════
    
    activate() {
        this.isActive = true;
        this.addEvent('Building activated', 'status');
    }
    
    deactivate() {
        this.isActive = false;
        this.addEvent('Building deactivated', 'status');
    }
    
    destroy() {
        this.isActive = false;
        this.condition = 0;
        this.currentWorkers = 0;
        this.addEvent('Building destroyed', 'status');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS & HISTORY
    // ═══════════════════════════════════════════════════════════════════════
    
    addEvent(description, type = 'info') {
        const event = {
            id: Date.now(),
            timestamp: Date.now(),
            description,
            type
        };
        
        this.eventHistory.push(event);
        
        // Keep only last 50 events
        if (this.eventHistory.length > 50) {
            this.eventHistory = this.eventHistory.slice(-50);
        }
        
        return event;
    }
    
    getRecentEvents(limit = 10) {
        return this.eventHistory.slice(-limit).reverse();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STATISTICS & INFORMATION
    // ═══════════════════════════════════════════════════════════════════════
    
    getStats() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            level: this.level,
            maxLevel: this.maxLevel,
            condition: this.condition,
            efficiency: this.efficiency,
            isActive: this.isActive,
            
            // Resource info
            production: this.getActualProduction(),
            consumption: this.getActualConsumption(),
            effects: this.getActualEffects(),
            
            // Worker info
            currentWorkers: this.currentWorkers,
            workerCapacity: this.workerCapacity,
            workerEfficiency: this.getWorkerEfficiency(),
            
            // Costs
            maintenanceCost: this.maintenanceCost,
            upgradeCost: this.getUpgradeCost(),
            
            // Age
            age: Date.now() - this.built
        };
    }
    
    getStatusSummary() {
        const status = [];
        
        if (!this.isActive) status.push('Inactive');
        if (this.condition < 50) status.push('Poor Condition');
        if (this.currentWorkers < this.workerCapacity * 0.5) status.push('Understaffed');
        if (this.level < this.maxLevel) status.push('Upgradeable');
        
        return status.length > 0 ? status : ['Operational'];
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE CYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    update() {
        if (this.isActive) {
            // Perform maintenance degradation
            this.performMaintenance();
            
            // Update effects based on current state
            this.updateEffects();
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    serialize() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            cityId: this.cityId,
            nationId: this.nationId,
            built: this.built,
            
            // Status
            isActive: this.isActive,
            condition: this.condition,
            efficiency: this.efficiency,
            
            // Stats
            level: this.level,
            maxLevel: this.maxLevel,
            maintenanceCost: this.maintenanceCost,
            powerConsumption: this.powerConsumption,
            
            // Workers
            workerCapacity: this.workerCapacity,
            currentWorkers: this.currentWorkers,
            
            // Effects and production
            effects: { ...this.effects },
            bonuses: { ...this.bonuses },
            production: { ...this.production },
            consumption: { ...this.consumption },
            
            // Events
            eventHistory: [...this.eventHistory],
            lastMaintenance: this.lastMaintenance
        };
    }
    
    static deserialize(data) {
        const building = new Building(data.type, data.name, data.cityId, data.nationId);
        
        // Restore properties
        building.id = data.id;
        building.built = data.built || Date.now();
        
        // Status
        building.isActive = data.isActive !== undefined ? data.isActive : true;
        building.condition = data.condition || 100;
        building.efficiency = data.efficiency || 1.0;
        
        // Stats
        building.level = data.level || 1;
        building.maxLevel = data.maxLevel || building.getMaxLevel();
        building.maintenanceCost = data.maintenanceCost || 0;
        building.powerConsumption = data.powerConsumption || 0;
        
        // Workers
        building.workerCapacity = data.workerCapacity || 0;
        building.currentWorkers = data.currentWorkers || 0;
        
        // Effects and production
        if (data.effects) building.effects = { ...data.effects };
        if (data.bonuses) building.bonuses = { ...data.bonuses };
        if (data.production) building.production = { ...data.production };
        if (data.consumption) building.consumption = { ...data.consumption };
        
        // Events
        building.eventHistory = data.eventHistory || [];
        building.lastMaintenance = data.lastMaintenance || Date.now();
        
        return building;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Building = Building;
}