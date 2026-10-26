/**
 * Military Unit Entity - Represents individual military units and formations
 * Integrates with Nation's WarSystem, Player combat skills, and military calculations
 * Population System: depletes demographics on enlist, returns on decommission, records combat deaths
 */

class MilitaryUnit {
    constructor(type, quantity, nationId = null, options = {}) {
        this.id = this.generateId();
        this.type = type; // 'soldiers', 'tanks', 'aircraft', 'ships', 'spies', 'missiles', 'nukes'
        this.quantity = quantity;
        this.nationId = nationId;
        this.created = Date.now();
        
        // Track last quantity synced to Nation (prevents double-counting)
        this._lastNationQuantity = 0;
        
        // Unit Status
        this.isActive = true;
        this.condition = 100; // 0-100 condition/readiness
        this.experience = 0; // Combat experience
        this.morale = 100; // Unit morale (affected by Nation.nationStats.militaryMorale)
        
        // Unit Stats (integrates with Nation military system)
        this.baseStrength = this.calculateUnitStrength();
        this.effectiveStrength = this.calculateEffectiveStrength();
        this.maintenance = this.calculateMaintenanceCost();
        
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
        
        // Population System integration - track which demographics were depleted
        this.populationSource = null; // { total, breakdown, citizens }
        this.populationCost = 0; // total population enlisted for this unit
        
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // UNIT INITIALIZATION (Integrates with Nation's Military System)
    // ═════════════════════════════════════════════════════════════════════════
    
    initializeUnitData() {
        if (this._skipInit) return;
        
        const unitData = this.getNationUnitTypeData();
        if (unitData) {
            this.baseStrength = unitData.strength;
            this.baseMaintenance = unitData.maintenance;
            this.populationCost = unitData.populationCost;
        }
        
        // Enlist population from demographics (Young Adult → Adult → Middle Aged → Older → Teen)
        if (window.PopulationSystem && this.populationCost > 0) {
            const needed = Math.ceil(this.populationCost * this.quantity);
            const eligible = window.PopulationSystem.getMilitaryEligiblePopulation();
            const canEnlist = Math.min(needed, eligible);
            
            if (canEnlist > 0) {
                this.populationSource = window.PopulationSystem.enlistMilitaryPopulation(canEnlist);
                // Adjust quantity if we couldn't enlist enough population
                if (this.populationSource.total < needed) {
                    this.quantity = Math.floor(this.populationSource.total / this.populationCost);
                    if (this.quantity <= 0) {
                        this.isActive = false;
                        return;
                    }
                }
            } else {
                // No military-eligible population available
                this.quantity = 0;
                this.isActive = false;
                return;
            }
        }
        
        // Update contribution to Nation
        this.updateNationMilitaryStrength();
        
        // Recalculate strength after enlistment
        this.baseStrength = this.calculateUnitStrength();
        this.effectiveStrength = this.calculateEffectiveStrength();
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
                maintenance: 0.05, // $5 per 100 per day
                trainingTime: 0, // Instant recruiting
                populationCost: 0.1, // 10 per 100, rounded up at enlistment
                effectivenessBonus: 'soldierEffectiveness'
            },
            tanks: {
                strength: 25,
                maintenance: 20, // $20 per tank per day
                trainingTime: 0, // Instant recruiting
                populationCost: 2, // 2 population per tank
                effectivenessBonus: 'tankEffectiveness'
            },
            aircraft: {
                strength: 100,
                maintenance: 75, // $75 per aircraft per day
                trainingTime: 0, // Instant recruiting
                populationCost: 3, // 3 population per aircraft
                effectivenessBonus: 'aircraftEffectiveness'
            },
            ships: {
                strength: 200,
                maintenance: 200, // $200 per ship per day
                trainingTime: 0, // Instant recruiting
                populationCost: 5, // 5 population per ship
                effectivenessBonus: 'shipEffectiveness'
            },
            spies: {
                strength: 5,
                maintenance: 15000, // $15,000 per spy per day
                trainingTime: 0, // Instant recruiting
                populationCost: 10, // 10 population per spy
                effectivenessBonus: 'spyEffectiveness'
            },
            missiles: {
                strength: 500,
                maintenance: 20000, // $20,000 per missile per day
                trainingTime: 0, // Instant recruiting
                populationCost: 0,
                effectivenessBonus: 'missileEffectiveness'
            },
            nukes: {
                strength: 2000,
                maintenance: 50000, // $50,000 per nuke per day
                trainingTime: 0, // Instant recruiting
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
                maintenance: 0.05, // $5 per 100 per day
                trainingTime: 0, // Instant recruiting
                populationCost: 0.1 // 10 per 100, rounded up at enlistment
            },
            tanks: {
                strength: 25,
                maintenance: 20, // $20 per tank per day
                trainingTime: 0, // Instant recruiting
                populationCost: 2
            },
            aircraft: {
                strength: 100,
                maintenance: 75, // $75 per aircraft per day
                trainingTime: 0, // Instant recruiting
                populationCost: 3
            },
            ships: {
                strength: 200,
                maintenance: 200, // $200 per ship per day
                trainingTime: 0, // Instant recruiting
                populationCost: 5
            },
            spies: {
                strength: 10,
                maintenance: 15000, // $15,000 per spy per day
                trainingTime: 0, // Instant recruiting
                populationCost: 10
            },
            missiles: {
                strength: 500,
                maintenance: 20000, // $20,000 per missile per day
                trainingTime: 0, // Instant recruiting
                populationCost: 0
            },
            nukes: {
                strength: 2000,
                maintenance: 50000, // $50,000 per nuke per day
                trainingTime: 0, // Instant recruiting
                populationCost: 0
            }
        };
        
        return unitTypes[this.type] || null;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // STRENGTH CALCULATIONS (Integrates with Nation & Player Systems)
    // ═════════════════════════════════════════════════════════════════════════
    
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
        // militaryMorale is stored as a decimal multiplier (1.0 = 100%, 0.85 = 85%)
        let moraleMultiplier = this.morale / 100;
        if (this.affectedByMilitaryMorale && window.Nation?.nationStats?.militaryMorale !== undefined) {
            const nationMorale = window.Nation.nationStats.militaryMorale;
            // If stored as percentage (0-100), convert to multiplier
            if (nationMorale > 1) {
                moraleMultiplier = nationMorale / 100;
            } else {
                moraleMultiplier = nationMorale;
            }
        }
        strength *= moraleMultiplier;
        
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
    
    /**
     * Calculate how many units of this type can be enlisted from available population.
     * Returns max units such that populationCost * units <= availablePopulation.
     * Returns Infinity if populationCost is 0 (missiles, nukes).
     */
    static getMaxUnitsFromPopulation(type, availablePopulation) {
        const popCostPerUnit = {
            soldiers: 0.1, // 10 per 100
            tanks: 2,
            aircraft: 3,
            ships: 5,
            spies: 10,
            missiles: 0,
            nukes: 0
        }[type] || 0;
        
        if (popCostPerUnit === 0) return Infinity; // No population cost
        return Math.floor(availablePopulation / popCostPerUnit);
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // POPULATION SYSTEM INTEGRATION
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Decommission this unit and return enlisted population to demographics.
     * Citizens are restored to their original age groups (age frozen at enlistment).
     */
    decommission() {
        if (!this.isActive) return 0;
        
        const returned = window.PopulationSystem
            ? window.PopulationSystem.dischargeMilitaryPopulation(this.populationSource)
            : 0;
        
        const qtyAtDecommission = this.quantity;
        const strengthAtDecommission = this.calculateEffectiveStrength();
        const maintenanceAtDecommission = this.maintenance;
        
        this.populationSource = null;
        this.populationCost = 0;
        this.quantity = 0;
        this.isActive = false;
        
        // Remove this unit's contribution from Nation using values captured before zeroing
        if (window.Nation && this.contributesToNationStrength && qtyAtDecommission > 0) {
            const strengthPerUnit = strengthAtDecommission / Math.max(qtyAtDecommission, 1);
            window.Nation.militaryUnits[this.type] = Math.max(0,
                (window.Nation.militaryUnits[this.type] || 0) - qtyAtDecommission
            );
            window.Nation.militaryStrength = Math.max(0,
                (window.Nation.militaryStrength || 0) - (strengthPerUnit * qtyAtDecommission)
            );
            window.Nation.militaryBudget = Math.max(0,
                (window.Nation.militaryBudget || 0) - (maintenanceAtDecommission / Math.max(qtyAtDecommission, 1) * qtyAtDecommission)
            );
        }
        
        this.addEvent('Unit decommissioned - population returned to demographics', 'decommission');
        
        return returned;
    }
    
    /**
     * Record combat deaths for casualties taken.
     * Called when units are destroyed in combat (not decommissioned).
     */
    recordCombatDeaths(count) {
        if (!count || count <= 0) return 0;
        
        this.populationStatsRecorded = (this.populationStatsRecorded || 0) + count;
        
        if (window.PopulationSystem) {
            window.PopulationSystem.recordMilitaryCombatDeaths(count);
        }
        
        return count;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Update Nation's military strength and unit counts.
     * Uses delta tracking to prevent double-counting on repeated calls.
     */
    updateNationMilitaryStrength() {
        if (!window.Nation || !this.contributesToNationStrength) return;
        
        const lastQty = this._lastNationQuantity || 0;
        const delta = this.quantity - lastQty;
        if (delta === 0) return;
        
        // Initialize if needed
        if (!window.Nation.militaryUnits) {
            window.Nation.militaryUnits = {};
        }
        if (!window.Nation.militaryUnits[this.type]) {
            window.Nation.militaryUnits[this.type] = 0;
        }
        window.Nation.militaryUnits[this.type] += delta;
        
        // Calculate per-unit values based on pre-change quantity for accuracy
        const perQty = Math.max(lastQty, 1);
        const strengthPerUnit = this.calculateEffectiveStrength() / Math.max(this.quantity, 1);
        const maintenancePerUnit = this.maintenance / perQty;
        
        // Apply deltas
        const deltaStrength = strengthPerUnit * delta;
        const deltaMaintenance = maintenancePerUnit * delta;
        
        window.Nation.militaryStrength = Math.max(0,
            (window.Nation.militaryStrength || 0) + deltaStrength
        );
        window.Nation.militaryBudget = Math.max(0,
            (window.Nation.militaryBudget || 0) + deltaMaintenance
        );
        
        this._lastNationQuantity = this.quantity;
        
        return deltaStrength;
    }
    
    /**
     * Remove this unit's contribution from Nation
     */
    removeFromNationMilitaryStrength() {
        if (!window.Nation || !this.contributesToNationStrength) return;
        
        const qtyToRemove = this._lastNationQuantity || this.quantity;
        if (qtyToRemove <= 0) return;
        
        // Remove from unit counts
        if (window.Nation.militaryUnits && window.Nation.militaryUnits[this.type]) {
            window.Nation.militaryUnits[this.type] = Math.max(0,
                window.Nation.militaryUnits[this.type] - qtyToRemove
            );
        }
        
        // Remove from total strength
        const strengthPerUnit = this.calculateEffectiveStrength() / Math.max(qtyToRemove, 1);
        window.Nation.militaryStrength = Math.max(0,
            (window.Nation.militaryStrength || 0) - (strengthPerUnit * qtyToRemove)
        );
        
        // Remove maintenance cost
        const maintenancePerUnit = this.maintenance / Math.max(qtyToRemove, 1);
        window.Nation.militaryBudget = Math.max(0,
            (window.Nation.militaryBudget || 0) - (maintenancePerUnit * qtyToRemove)
        );
        
        this._lastNationQuantity = 0;
        
        return qtyToRemove;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // UNIT OPERATIONS
    // ═════════════════════════════════════════════════════════════════════════
    
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // COMBAT OPERATIONS
    // ═════════════════════════════════════════════════════════════════════════
    
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
        // Apply casualties to this unit
        const casualtiesTaken = this.takeCasualties(outcome.damage);
        
        // Record combat deaths for this unit's losses
        if (casualtiesTaken > 0 && window.PopulationSystem) {
            window.PopulationSystem.recordMilitaryCombatDeaths(casualtiesTaken);
        }
        
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
        
        // Record enemy combat deaths
        if (outcome.casualties > 0 && window.PopulationSystem) {
            window.PopulationSystem.recordMilitaryCombatDeaths(outcome.casualties);
        }
    }
    
    takeCasualties(casualties) {
        const lost = Math.min(casualties, this.quantity);
        const preQty = this.quantity;
        
        // Update Nation's military totals BEFORE reducing quantity
        if (window.Nation && this.contributesToNationStrength && lost > 0) {
            const strengthPerUnit = this.calculateEffectiveStrength() / Math.max(preQty, 1);
            window.Nation.militaryUnits[this.type] = Math.max(0,
                (window.Nation.militaryUnits[this.type] || 0) - lost
            );
            window.Nation.militaryStrength = Math.max(0,
                (window.Nation.militaryStrength || 0) - (strengthPerUnit * lost)
            );
            window.Nation.militaryBudget = Math.max(0,
                (window.Nation.militaryBudget || 0) - (this.maintenance / Math.max(preQty, 1) * lost)
            );
        }
        
        this.quantity -= lost;
        
        if (lost > 0) {
            this.addEvent(`Lost ${lost} units in combat`, 'casualties');
        }
        
        // Unit is destroyed if no units remain
        if (this.quantity <= 0) {
            this.isActive = false;
            this.addEvent('Unit destroyed', 'status');
            // Combat-dead population is NOT returned to demographics
            // It is recorded as Killed in Combat via recordMilitaryCombatDeaths
            // Replacement births are scheduled after 2-turn buffer in Population System
            this.populationSource = null;
        }
        
        return lost;
    }
    
    // ═════════════════════════════════════════════════════════════════════════
    // UPGRADES & SPECIALIZATIONS
    // ═════════════════════════════════════════════════════════════════════════
    
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // UNIT MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════
    
    reinforce(additionalUnits) {
        // Enlist additional population for reinforcements
        if (window.PopulationSystem && this.populationCost > 0) {
            const needed = Math.ceil(this.populationCost * additionalUnits);
            const eligible = window.PopulationSystem.getMilitaryEligiblePopulation();
            const canEnlist = Math.min(needed, eligible);
            
            if (canEnlist > 0) {
                const reinforcementSource = window.PopulationSystem.enlistMilitaryPopulation(canEnlist);
                const reinforcedQty = Math.floor(reinforcementSource.total / this.populationCost);
                
                // Merge population sources
                if (this.populationSource && reinforcementSource.citizens.length > 0) {
                    this.populationSource.citizens = [
                        ...this.populationSource.citizens,
                        ...reinforcementSource.citizens
                    ];
                    // Merge breakdown
                    for (const [group, count] of Object.entries(reinforcementSource.breakdown)) {
                        this.populationSource.breakdown[group] = 
                            (this.populationSource.breakdown[group] || 0) + count;
                    }
                }
                
                this.quantity += reinforcedQty;
                this.addEvent(`Reinforced with ${reinforcedQty} units`, 'reinforcement');
                
                // Update Nation's military totals
                if (window.Nation && this.contributesToNationStrength) {
                    this.updateNationMilitaryStrength();
                }
                
                return reinforcedQty;
            }
        }
        
        this.quantity += additionalUnits;
        this.addEvent(`Reinforced with ${additionalUnits} units`, 'reinforcement');
        
        // Update Nation's military totals
        if (window.Nation && this.contributesToNationStrength) {
            this.updateNationMilitaryStrength();
        }
        
        return additionalUnits;
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

        // Discharge any population the constructor enlisted (we're taking from parent instead)
        if (newUnit.populationSource && window.PopulationSystem) {
            window.PopulationSystem.dischargeMilitaryPopulation(newUnit.populationSource);
            newUnit.populationSource = null;
            newUnit.populationCost = 0;
        }

        // Adjust parent's Nation contribution (remove splitQuantity worth of units)
        if (window.Nation && this.contributesToNationStrength) {
            const strengthPerUnit = this.populationCost > 0
                ? this.calculateEffectiveStrength() / Math.max(this.quantity, 1)
                : 0;
            window.Nation.militaryUnits[this.type] = Math.max(0,
                (window.Nation.militaryUnits[this.type] || 0) - splitQuantity
            );
            window.Nation.militaryStrength = Math.max(0,
                (window.Nation.militaryStrength || 0) - (strengthPerUnit * splitQuantity)
            );
            window.Nation.militaryBudget = Math.max(0,
                (window.Nation.militaryBudget || 0) - (this.maintenance / Math.max(this.quantity, 1) * splitQuantity)
            );
        }

        // Split population source proportionally
        if (this.populationSource) {
            const ratio = splitQuantity / this.quantity;
            const splitCitizens = [];
            const splitBreakdown = {};

            // Take citizens from the end of the array (LIFO for splitting)
            const citizensToSplit = Math.floor(this.populationSource.citizens.length * ratio);
            for (let i = 0; i < citizensToSplit; i++) {
                splitCitizens.push(this.populationSource.citizens.pop());
            }

            // Calculate breakdown from split citizens
            for (const citizen of splitCitizens) {
                splitBreakdown[citizen.ageGroup] = (splitBreakdown[citizen.ageGroup] || 0) + 1;
            }

            newUnit.populationSource = {
                total: splitCitizens.length,
                breakdown: splitBreakdown,
                citizens: splitCitizens
            };
            newUnit.populationCost = this.populationCost;

            // Update original breakdown
            for (const [group, count] of Object.entries(splitBreakdown)) {
                this.populationSource.breakdown[group] =
                    Math.max(0, (this.populationSource.breakdown[group] || 0) - count);
            }
            this.populationSource.total -= splitCitizens.length;
        }

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
        
        // Capture this unit's old strength contribution before quantity changes
        const oldThisStrength = this.calculateEffectiveStrength();
        const oldThisQty = this.quantity;
        
        // Merge quantities
        this.quantity = totalQuantity;

        // Adjust Nation's military totals:
        // - Remove otherUnit's contribution (it's being absorbed into this unit)
        // - Update this's contribution (quantity changed from oldThisQty to totalQuantity)
        // - militaryUnits[type] count stays the same (Q1 + Q2 before, Q1 + Q2 after)
        if (window.Nation && this.contributesToNationStrength) {
            // Remove otherUnit's contribution from Nation strength/budget
            if (otherUnit.contributesToNationStrength) {
                const otherStrength = otherUnit.calculateEffectiveStrength();
                window.Nation.militaryStrength = Math.max(0,
                    (window.Nation.militaryStrength || 0) - otherStrength
                );
                window.Nation.militaryBudget = Math.max(0,
                    (window.Nation.militaryBudget || 0) - otherUnit.maintenance
                );
            }
            
            // Get per-unit maintenance from unit data (not this.maintenance which is stale)
            const unitData = this.getNationUnitTypeData();
            const perUnitMaintenance = unitData?.maintenance || 0;
            
            // Update this's contribution: remove old strength, add new strength
            const newStrength = this.calculateEffectiveStrength();
            window.Nation.militaryStrength = Math.max(0,
                (window.Nation.militaryStrength || 0) - oldThisStrength + newStrength
            );
            
            // Update maintenance budget
            const oldTotalMaintenance = perUnitMaintenance * oldThisQty;
            const newTotalMaintenance = perUnitMaintenance * this.quantity;
            window.Nation.militaryBudget = Math.max(0,
                (window.Nation.militaryBudget || 0) - oldTotalMaintenance + newTotalMaintenance
            );
        }

        // Mark otherUnit as inactive since it was merged into this unit
        otherUnit.isActive = false;
        otherUnit.quantity = 0;
        
        // Merge population sources
        if (otherUnit.populationSource && this.populationSource) {
            this.populationSource.citizens = [
                ...this.populationSource.citizens,
                ...otherUnit.populationSource.citizens
            ];
            this.populationSource.total += otherUnit.populationSource.total;
            for (const [group, count] of Object.entries(otherUnit.populationSource.breakdown)) {
                this.populationSource.breakdown[group] = 
                    (this.populationSource.breakdown[group] || 0) + count;
            }
        } else if (otherUnit.populationSource) {
            this.populationSource = otherUnit.populationSource;
        }
        
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // EVENTS & HISTORY
    // ═════════════════════════════════════════════════════════════════════════
    
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // STATISTICS & INFORMATION
    // ═════════════════════════════════════════════════════════════════════════
    
    getStats() {
        return {
            id: this.id,
            type: this.type,
            quantity: this.quantity,
            
            // Combat stats
            baseStrength: this.baseStrength,
            effectiveStrength: this.calculateEffectiveStrength(),
            condition: this.condition,
            experience: this.experience,
            morale: this.morale,
            
            // Population stats
            populationCost: this.populationCost,
            populationEnlisted: this.populationSource?.total || 0,
            populationBreakdown: this.populationSource?.breakdown || {},
            
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
            maintenance: this.calculateMaintenanceCost(),
            
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // UPDATE CYCLE
    // ═════════════════════════════════════════════════════════════════════════
    
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
    
    // ═════════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═════════════════════════════════════════════════════════════════════════
    
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
            
            // Population integration
            populationSource: this.populationSource,
            populationCost: this.populationCost,
            
            // Modifications
            upgrades: [...this.upgrades],
            specializations: [...this.specializations],
            
            // Events
            eventHistory: [...this.eventHistory]
        };
    }
    
    static deserialize(data) {
        const unit = MilitaryUnit.createWithoutInit(data.type, data.quantity, data.nationId);
        
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
        
        // Population integration (restore directly, don't re-enlist)
        unit.populationSource = data.populationSource || null;
        unit.populationCost = data.populationCost || 0;
        
        // Modifications
        unit.upgrades = data.upgrades || [];
        unit.specializations = data.specializations || [];
        
        // Events
        unit.eventHistory = data.eventHistory || [];
        
        return unit;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.MilitaryUnit = MilitaryUnit;
}
