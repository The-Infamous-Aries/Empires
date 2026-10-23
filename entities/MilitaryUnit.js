/**
 * Military Unit Entity - Represents individual military units and formations
 * Integrates with Nation's WarSystem, Player combat skills, and military calculations
 */

class MilitaryUnit {
    constructor(type, quantity, nationId = null) {
        this.id = this.generateId();
        this.type = type; // 'soldiers', 'tanks', 'aircraft', 'ships', 'spies', 'missiles', 'nukes'
        this.quantity = quantity;
        this.nationId = nationId;
        this.created = Date.now();
        
        // Unit Status
        this.isActive = true;
        this.condition = 100; // 0-100 condition/readiness
        this.experience = 0; // Combat experience
        this.morale = 100; // Unit morale (affected by Nation.nationStats.militaryMorale)
        
        // Unit Stats (integrates with Nation military system)
        this.baseStrength = this.calculateUnitStrength();
        this.effectiveStrength = this.calculateEffectiveStrength();
        this.maintenance = this.calculateMaintenanceCost();
        this.upkeep = this.calculateUpkeep();
        
        // Location and Deployment
        this.location = null; // City ID or coordinates
        this.deployment = 'garrison'; // 'garrison', 'patrol', 'combat', 'training'
        this.assignment = null; // Specific mission or target
        
        // Combat History (integrates with War System)
        this.battlesParticipated = 0;
        this.victories = 0;
        this.losses = 0;
        this.kills = 0;
        this.warDamageDealt = 0; // Total war damage for Nation statistics
        
        // Unit Modifications
        this.upgrades = [];
        this.specializations = [];
        this.equipment = {};
        
        // Integration with Nation systems
        this.contributesToNationStrength = true;
        this.affectedByPlayerSkills = true;
        this.affectedByMilitaryMorale = true;
        
        // Events
        this.eventHistory = [];
        
        this.initializeUnitData();
    }
    
    generateId() {
        return 'unit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UNIT INITIALIZATION (Integrates with Nation's Military System)
    // ═══════════════════════════════════════════════════════════════════════
    
    initializeUnitData() {
        const unitData = this.getNationUnitTypeData();
        if (unitData) {
            this.baseStrength = unitData.strength;
            this.baseMaintenance = unitData.maintenance;
            this.baseUpkeep = unitData.upkeep;
            this.equipment = { ...unitData.equipment };
            this.trainingTime = unitData.trainingTime;
            this.populationCost = unitData.populationCost;
        }
        
        // Update contribution to Nation
        this.updateNationMilitaryStrength();
    }
    
    getNationUnitTypeData() {
        // Use Nation's military system data if available
        if (window.GameEngine?.systems?.military || window.GameEngine?.systems?.war) {
            // Get unit data from military system
            return this.getWarSystemUnitData();
        }
        
        // Fallback to match Nation's military unit types
        return this.getUnitTypeData();
    }
    
    getWarSystemUnitData() {
        // Unit data matching Nation's war system calculations
        const unitTypes = {
            soldiers: {
                strength: 1,
                maintenance: 100, // Daily maintenance cost
                upkeep: 50,
                equipment: { weapons: 'basic', armor: 'basic' },
                trainingTime: 7,
                populationCost: 1,
                effectivenessBonus: 'soldierEffectiveness' // Links to Nation.improvementEffects
            },
            tanks: {
                strength: 25,
                maintenance: 500,
                upkeep: 250,
                equipment: { armor: 'heavy', weapons: 'cannon', fuel: 'diesel' },
                trainingTime: 30,
                populationCost: 5,
                effectivenessBonus: 'tankEffectiveness'
            },
            aircraft: {
                strength: 100,
                maintenance: 2000,
                upkeep: 1000,
                equipment: { weapons: 'missiles', fuel: 'jet', avionics: 'advanced' },
                trainingTime: 60,
                populationCost: 10,
                effectivenessBonus: 'aircraftEffectiveness'
            },
            ships: {
                strength: 200,
                maintenance: 4000,
                upkeep: 2000,
                equipment: { weapons: 'naval_guns', armor: 'naval', radar: 'naval' },
                trainingTime: 90,
                populationCost: 20,
                effectivenessBonus: 'shipEffectiveness'
            },
            spies: {
                strength: 5,
                maintenance: 1000,
                upkeep: 500,
                equipment: { gadgets: 'spy_kit', communications: 'encrypted' },
                trainingTime: 120,
                populationCost: 2,
                effectivenessBonus: 'spyEffectiveness'
            },
            missiles: {
                strength: 500,
                maintenance: 200,
                upkeep: 100,
                equipment: { warhead: 'conventional', guidance: 'gps' },
                trainingTime: 1,
                populationCost: 0,
                effectivenessBonus: 'missileEffectiveness'
            },
            nukes: {
                strength: 2000,
                maintenance: 2000,
                upkeep: 1000,
                equipment: { warhead: 'nuclear', delivery: 'icbm', security: 'maximum' },
                trainingTime: 1,
                populationCost: 0,
                effectivenessBonus: 'nuclearEffectiveness'
            }
        };
        
        return unitTypes[this.type] || null;
    }
    
    getUnitTypeData() {
        const unitTypes = {
            soldiers: {
                strength: 1,
                maintenance: 10, // per unit per day
                upkeep: 5, // per unit per day
                equipment: { weapons: 'basic', armor: 'basic' },
                trainingTime: 7, // days
                populationCost: 1
            },
            tanks: {
                strength: 25,
                maintenance: 100,
                upkeep: 50,
                equipment: { armor: 'heavy', weapons: 'cannon', fuel: 'diesel' },
                trainingTime: 30,
                populationCost: 5
            },
            aircraft: {
                strength: 100,
                maintenance: 500,
                upkeep: 200,
                equipment: { weapons: 'missiles', fuel: 'jet', avionics: 'advanced' },
                trainingTime: 60,
                populationCost: 10
            },
            ships: {
                strength: 200,
                maintenance: 1000,
                upkeep: 400,
                equipment: { weapons: 'naval_guns', armor: 'naval', radar: 'naval' },
                trainingTime: 90,
                populationCost: 20
            },
            spies: {
                strength: 10,
                maintenance: 200,
                upkeep: 100,
                equipment: { gadgets: 'spy_kit', communications: 'encrypted' },
                trainingTime: 120,
                populationCost: 2
            },
            missiles: {
                strength: 500,
                maintenance: 50,
                upkeep: 25,
                equipment: { warhead: 'conventional', guidance: 'gps' },
                trainingTime: 1, // automated
                populationCost: 0
            },
            nukes: {
                strength: 2000,
                maintenance: 1000,
                upkeep: 500,
                equipment: { warhead: 'nuclear', delivery: 'icbm', security: 'maximum' },
                trainingTime: 1,
                populationCost: 0
            }
        };
        
        return unitTypes[this.type] || null;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STRENGTH CALCULATIONS (Integrates with Nation & Player Systems)
    // ═══════════════════════════════════════════════════════════════════════
    
    calculateUnitStrength() {
        const unitData = this.getNationUnitTypeData();
        if (!unitData) return 0;
        
        return unitData.strength * this.quantity;
    }
    
    calculateEffectiveStrength() {
        let strength = this.baseStrength;
        
        // Apply condition modifier
        strength *= (this.condition / 100);
        
        // Apply experience bonus (max +50% like Player skills)
        const experienceBonus = Math.min(0.5, this.experience / 1000);
        strength *= (1 + experienceBonus);
        
        // Apply unit morale (affected by Nation.nationStats.militaryMorale)
        if (this.affectedByMilitaryMorale && window.Nation?.nationStats?.militaryMorale) {
            strength *= window.Nation.nationStats.militaryMorale;
        } else {
            strength *= (this.morale / 100);
        }
        
        // Apply Nation's improvement bonuses
        if (window.Nation?.improvementEffects && this.contributesToNationStrength) {
            const unitData = this.getNationUnitTypeData();
            if (unitData?.effectivenessBonus) {
                const bonus = window.Nation.improvementEffects[unitData.effectivenessBonus] || 0;
                strength *= (1 + bonus);
            }
        }
        
        // Apply Player skill bonuses
        if (this.affectedByPlayerSkills && window.Player) {
            // Attack and Defense skills boost all units
            const attackBonus = window.Player.getSkillValue('attack') || 0;
            const defenseBonus = window.Player.getSkillValue('defense') || 0;
            strength += (attackBonus + defenseBonus) * this.quantity;
        }
        
        // Apply government and religion bonuses
        if (window.Nation?.governmentType?.militaryBonus) {
            strength *= window.Nation.governmentType.militaryBonus;
        }
        
        this.effectiveStrength = Math.floor(strength);
        return this.effectiveStrength;
    }
    
    calculateMaintenanceCost() {
        const unitData = this.getNationUnitTypeData();
        if (!unitData) return 0;
        
        let cost = unitData.maintenance * this.quantity;
        
        // Efficiency bonuses from Player skills
        if (window.Player) {
            const efficiencyReduction = window.Player.getSkillValue('logistics') || 0;
            cost *= (1 - efficiencyReduction);
        }
        
        return Math.floor(cost);
    }
    
    calculateUpkeep() {
        const unitData = this.getNationUnitTypeData();
        if (!unitData) return 0;
        
        return Math.floor(unitData.upkeep * this.quantity);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Update Nation's military strength and unit counts
     */
    updateNationMilitaryStrength() {
        if (!window.Nation || !this.contributesToNationStrength) return;
        
        // Update unit counts in Nation.militaryUnits
        if (!window.Nation.militaryUnits[this.type]) {
            window.Nation.militaryUnits[this.type] = 0;
        }
        window.Nation.militaryUnits[this.type] += this.quantity;
        
        // Update Nation's total military strength
        const contribution = this.calculateEffectiveStrength();
        window.Nation.militaryStrength = (window.Nation.militaryStrength || 0) + contribution;
        
        // Update military budget for maintenance
        window.Nation.militaryBudget = (window.Nation.militaryBudget || 0) + this.maintenance;
        
        return contribution;
    }
    
    /**
     * Remove this unit's contribution from Nation
     */
    removeFromNationMilitaryStrength() {
        if (!window.Nation || !this.contributesToNationStrength) return;
        
        // Remove from unit counts
        if (window.Nation.militaryUnits[this.type]) {
            window.Nation.militaryUnits[this.type] = Math.max(0, 
                window.Nation.militaryUnits[this.type] - this.quantity
            );
        }
        
        // Remove from total strength
        const contribution = this.calculateEffectiveStrength();
        window.Nation.militaryStrength = Math.max(0, 
            (window.Nation.militaryStrength || 0) - contribution
        );
        
        // Remove maintenance cost
        window.Nation.militaryBudget = Math.max(0,
            (window.Nation.militaryBudget || 0) - this.maintenance
        );
        
        return contribution;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UNIT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    deploy(location, deployment = 'patrol') {
        this.location = location;
        this.deployment = deployment;
        
        this.addEvent(`Deployed to ${location} for ${deployment}`, 'deployment');
        
        // Deployment affects morale and condition
        if (deployment === 'combat') {
            this.morale = Math.max(50, this.morale - 10);
        } else if (deployment === 'training') {
            this.morale = Math.min(100, this.morale + 5);
        }
    }
    
    recall() {
        const oldLocation = this.location;
        this.location = null;
        this.deployment = 'garrison';
        this.assignment = null;
        
        this.addEvent(`Recalled from ${oldLocation}`, 'deployment');
        
        // Garrison duty improves morale
        this.morale = Math.min(100, this.morale + 5);
    }
    
    repair(amount = 25) {
        const oldCondition = this.condition;
        this.condition = Math.min(100, this.condition + amount);
        
        const repaired = this.condition - oldCondition;
        if (repaired > 0) {
            this.addEvent(`Repaired (+${repaired} condition)`, 'maintenance');
        }
        
        return repaired;
    }
    
    resupply() {
        this.condition = Math.min(100, this.condition + 15);
        this.morale = Math.min(100, this.morale + 10);
        
        this.addEvent('Unit resupplied', 'maintenance');
    }
    
    train(type = 'general') {
        const trainingEffects = {
            general: { experience: 10, morale: 5, condition: -5 },
            combat: { experience: 20, morale: -5, condition: -10 },
            technical: { experience: 15, morale: 0, condition: 0 },
            leadership: { experience: 5, morale: 10, condition: 0 }
        };
        
        const effects = trainingEffects[type] || trainingEffects.general;
        
        this.experience += effects.experience;
        this.morale = Math.max(0, Math.min(100, this.morale + effects.morale));
        this.condition = Math.max(0, Math.min(100, this.condition + effects.condition));
        
        this.addEvent(`Completed ${type} training`, 'training');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // COMBAT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    engageCombat(enemy, terrain = 'normal') {
        this.battlesParticipated++;
        
        const myStrength = this.calculateEffectiveStrength();
        const enemyStrength = enemy.calculateEffectiveStrength();
        
        // Calculate combat outcome
        const outcome = this.calculateCombatOutcome(myStrength, enemyStrength, terrain);
        
        // Apply combat results
        this.applyCombatResults(outcome);
        
        this.addEvent(`Combat vs ${enemy.type}: ${outcome.result}`, 'combat');
        
        return outcome;
    }
    
    calculateCombatOutcome(myStrength, enemyStrength, terrain) {
        // Base combat calculation with randomness
        const myRoll = myStrength * (0.8 + Math.random() * 0.4);
        const enemyRoll = enemyStrength * (0.8 + Math.random() * 0.4);
        
        // Terrain modifiers
        const terrainMods = {
            urban: { defenders: 1.2, attackers: 0.9 },
            forest: { infantry: 1.1, vehicles: 0.8 },
            desert: { vehicles: 1.1, infantry: 0.9 },
            naval: { ships: 1.3, land: 0.3 },
            air: { aircraft: 1.2, ground: 0.7 }
        };
        
        let result, damage, casualties;
        
        if (myRoll > enemyRoll * 1.2) {
            result = 'decisive_victory';
            damage = Math.floor(this.quantity * 0.05); // 5% losses
            casualties = Math.floor(enemyStrength * 0.3); // 30% enemy losses
        } else if (myRoll > enemyRoll) {
            result = 'victory';
            damage = Math.floor(this.quantity * 0.1); // 10% losses
            casualties = Math.floor(enemyStrength * 0.2); // 20% enemy losses
        } else if (myRoll > enemyRoll * 0.8) {
            result = 'draw';
            damage = Math.floor(this.quantity * 0.15); // 15% losses
            casualties = Math.floor(enemyStrength * 0.15); // 15% enemy losses
        } else if (myRoll > enemyRoll * 0.5) {
            result = 'defeat';
            damage = Math.floor(this.quantity * 0.25); // 25% losses
            casualties = Math.floor(enemyStrength * 0.1); // 10% enemy losses
        } else {
            result = 'crushing_defeat';
            damage = Math.floor(this.quantity * 0.4); // 40% losses
            casualties = Math.floor(enemyStrength * 0.05); // 5% enemy losses
        }
        
        return { result, damage, casualties, myRoll, enemyRoll };
    }
    
    applyCombatResults(outcome) {
        // Apply casualties
        this.takeCasualties(outcome.damage);
        
        // Update experience and morale based on result
        if (outcome.result.includes('victory')) {
            this.victories++;
            this.experience += 25;
            this.morale = Math.min(100, this.morale + 10);
        } else if (outcome.result.includes('defeat')) {
            this.losses++;
            this.experience += 10;
            this.morale = Math.max(25, this.morale - 15);
        } else {
            this.experience += 15;
            this.morale = Math.max(50, this.morale - 5);
        }
        
        // Combat degrades condition
        this.condition = Math.max(10, this.condition - 20);
        
        this.kills += outcome.casualties;
    }
    
    takeCasualties(casualties) {
        const lost = Math.min(casualties, this.quantity);
        this.quantity -= lost;
        
        if (lost > 0) {
            this.addEvent(`Lost ${lost} units in combat`, 'casualties');
        }
        
        // Unit is destroyed if no units remain
        if (this.quantity <= 0) {
            this.isActive = false;
            this.addEvent('Unit destroyed', 'status');
        }
        
        return lost;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UPGRADES & SPECIALIZATIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    addUpgrade(upgrade) {
        this.upgrades.push({
            name: upgrade.name,
            strengthBonus: upgrade.strengthBonus || 0,
            maintenanceIncrease: upgrade.maintenanceIncrease || 0,
            added: Date.now()
        });
        
        this.addEvent(`Upgraded with ${upgrade.name}`, 'upgrade');
    }
    
    addSpecialization(specialization) {
        if (!this.specializations.includes(specialization)) {
            this.specializations.push(specialization);
            this.addEvent(`Specialized in ${specialization}`, 'training');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UNIT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    reinforce(additionalUnits) {
        this.quantity += additionalUnits;
        this.addEvent(`Reinforced with ${additionalUnits} units`, 'reinforcement');
    }
    
    split(splitQuantity) {
        if (splitQuantity >= this.quantity || splitQuantity <= 0) {
            return null; // Cannot split
        }
        
        // Create new unit with split quantity
        const newUnit = new MilitaryUnit(this.type, splitQuantity, this.nationId);
        newUnit.experience = this.experience;
        newUnit.morale = this.morale;
        newUnit.condition = this.condition;
        newUnit.upgrades = [...this.upgrades];
        newUnit.specializations = [...this.specializations];
        
        // Reduce this unit's quantity
        this.quantity -= splitQuantity;
        
        this.addEvent(`Split ${splitQuantity} units into new formation`, 'organization');
        
        return newUnit;
    }
    
    merge(otherUnit) {
        if (otherUnit.type !== this.type) {
            return false; // Cannot merge different unit types
        }
        
        // Weighted averages for merging stats
        const totalQuantity = this.quantity + otherUnit.quantity;
        
        this.experience = Math.floor(
            (this.experience * this.quantity + otherUnit.experience * otherUnit.quantity) / totalQuantity
        );
        
        this.morale = Math.floor(
            (this.morale * this.quantity + otherUnit.morale * otherUnit.quantity) / totalQuantity
        );
        
        this.condition = Math.floor(
            (this.condition * this.quantity + otherUnit.condition * otherUnit.quantity) / totalQuantity
        );
        
        // Merge quantities
        this.quantity = totalQuantity;
        
        // Merge upgrades and specializations
        for (const upgrade of otherUnit.upgrades) {
            if (!this.upgrades.some(u => u.name === upgrade.name)) {
                this.upgrades.push(upgrade);
            }
        }
        
        for (const spec of otherUnit.specializations) {
            if (!this.specializations.includes(spec)) {
                this.specializations.push(spec);
            }
        }
        
        this.addEvent(`Merged with ${otherUnit.type} unit (+${otherUnit.quantity})`, 'organization');
        
        return true;
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
            type: this.type,
            quantity: this.quantity,
            
            // Combat stats
            baseStrength: this.calculateBaseStrength(),
            effectiveStrength: this.calculateEffectiveStrength(),
            condition: this.condition,
            experience: this.experience,
            morale: this.morale,
            
            // Combat history
            battlesParticipated: this.battlesParticipated,
            victories: this.victories,
            losses: this.losses,
            kills: this.kills,
            winRate: this.battlesParticipated > 0 ? (this.victories / this.battlesParticipated * 100) : 0,
            
            // Deployment
            location: this.location,
            deployment: this.deployment,
            assignment: this.assignment,
            
            // Costs
            maintenance: this.calculateMaintenance(),
            upkeep: this.calculateUpkeep(),
            
            // Modifications
            upgradeCount: this.upgrades.length,
            specializationCount: this.specializations.length,
            
            // Status
            isActive: this.isActive,
            age: Date.now() - this.created
        };
    }
    
    getCombatRating() {
        const strength = this.calculateEffectiveStrength();
        const experience = this.experience;
        const morale = this.morale;
        
        let rating = 'Recruit';
        const combined = (strength / 100) + (experience / 50) + (morale / 50);
        
        if (combined >= 15) rating = 'Elite';
        else if (combined >= 10) rating = 'Veteran';
        else if (combined >= 6) rating = 'Regular';
        else if (combined >= 3) rating = 'Trained';
        
        return rating;
    }
    
    getStatusSummary() {
        const status = [];
        
        if (!this.isActive) status.push('Inactive');
        if (this.condition < 50) status.push('Poor Condition');
        if (this.morale < 50) status.push('Low Morale');
        if (this.quantity === 0) status.push('No Units');
        if (this.deployment === 'combat') status.push('In Combat');
        
        return status.length > 0 ? status : ['Operational'];
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE CYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    update() {
        if (!this.isActive || this.quantity <= 0) return;
        
        // Natural condition degradation
        if (this.deployment === 'combat') {
            this.condition = Math.max(0, this.condition - 2);
        } else if (this.deployment === 'patrol') {
            this.condition = Math.max(0, this.condition - 0.5);
        }
        
        // Morale changes based on deployment
        if (this.deployment === 'garrison') {
            this.morale = Math.min(100, this.morale + 0.5);
        } else if (this.deployment === 'combat') {
            this.morale = Math.max(25, this.morale - 1);
        }
        
        // Experience decay if not in use
        if (this.deployment === 'garrison') {
            this.experience = Math.max(0, this.experience - 0.1);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    serialize() {
        return {
            id: this.id,
            type: this.type,
            quantity: this.quantity,
            nationId: this.nationId,
            created: this.created,
            
            // Status
            isActive: this.isActive,
            condition: this.condition,
            experience: this.experience,
            morale: this.morale,
            
            // Deployment
            location: this.location,
            deployment: this.deployment,
            assignment: this.assignment,
            
            // Combat history
            battlesParticipated: this.battlesParticipated,
            victories: this.victories,
            losses: this.losses,
            kills: this.kills,
            
            // Modifications
            upgrades: [...this.upgrades],
            specializations: [...this.specializations],
            equipment: { ...this.equipment },
            
            // Events
            eventHistory: [...this.eventHistory]
        };
    }
    
    static deserialize(data) {
        const unit = new MilitaryUnit(data.type, data.quantity, data.nationId);
        
        // Restore properties
        unit.id = data.id;
        unit.created = data.created || Date.now();
        
        // Status
        unit.isActive = data.isActive !== undefined ? data.isActive : true;
        unit.condition = data.condition || 100;
        unit.experience = data.experience || 0;
        unit.morale = data.morale || 100;
        
        // Deployment
        unit.location = data.location || null;
        unit.deployment = data.deployment || 'garrison';
        unit.assignment = data.assignment || null;
        
        // Combat history
        unit.battlesParticipated = data.battlesParticipated || 0;
        unit.victories = data.victories || 0;
        unit.losses = data.losses || 0;
        unit.kills = data.kills || 0;
        
        // Modifications
        unit.upgrades = data.upgrades || [];
        unit.specializations = data.specializations || [];
        if (data.equipment) unit.equipment = { ...data.equipment };
        
        // Events
        unit.eventHistory = data.eventHistory || [];
        
        return unit;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.MilitaryUnit = MilitaryUnit;
}