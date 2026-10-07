/**
 * Projects System - Empire Builder
 * Handles advanced nation projects (more expensive than improvements, require tech levels)
 */

class ProjectsSystem {
    constructor() {
        this.isInitialized = false;
        
        // Project definitions
        this.projectTypes = {
            missileSilo: {
                name: 'Missile Silo',
                description: 'Enables missile production for military use',
                maxCount: 3,
                cost: { money: 5000000, aluminum: 100, ammo: 200, gas: 150, cement: 200 },
                techRequired: 500,
                effect: 'Allows production of 2 missiles per silo for military operations',
                category: 'military',
                special: 'Each silo can produce and store 2 missiles'
            },
            
            ironCurtain: {
                name: 'Iron Curtain Defense System',
                description: 'Missile defense system with interception capability',
                maxCount: 3,
                cost: { money: 8000000, aluminum: 150, ammo: 250, gas: 200, cement: 300 },
                techRequired: 500,
                effect: '15% chance to intercept incoming missiles per system (max 45%)',
                category: 'military',
                special: 'Stacks to maximum 45% missile interception rate'
            },
            
            tradeHub: {
                name: 'International Trade Hub',
                description: 'Advanced trading facility for permanent trade agreements',
                maxCount: 1,
                cost: { money: 15000000, food: 500, water: 300, cement: 400, paper: 200 },
                techRequired: 1000,
                effect: 'Enables permanent trade agreements and unlimited trade proposals',
                category: 'economic',
                special: 'Removes time limits on trade agreements'
            },
            
            commandCenter: {
                name: 'Military Command Center',
                description: 'Advanced military coordination facility',
                maxCount: 3,
                cost: { money: 6000000, ammo: 300, gas: 200, paper: 150, cement: 250 },
                techRequired: 750,
                effect: '+1 offensive & defensive war slot per center (base 2 slots)',
                category: 'military',
                special: 'Increases simultaneous war capacity'
            },
            
            officeOfRelationships: {
                name: 'Office of Diplomatic Relations',
                description: 'Enables modification of diplomatic relationships',
                maxCount: 1,
                cost: { money: 10000000, cement: 200, paper: 300, food: 250, water: 200 },
                techRequired: 500,
                effect: 'Allows changing friends, best friends, foes, and nemesis',
                category: 'diplomacy',
                special: 'Makes diplomatic relationships changeable'
            },
            
            militaryAcademy: {
                name: 'Advanced Military Academy',
                description: 'Elite military training facility for larger armies',
                maxCount: 1,
                cost: { money: 20000000, gas: 400, ammo: 500, cement: 300, steel: 200, aluminum: 150 },
                techRequired: 1500,
                effect: 'Increases maximum military unit percentages significantly',
                category: 'military',
                special: 'Soldiers: 30% (was 20%), Tanks: 20% (was 10%), Aircraft: 10% (was 7.5%), Ships: 7.5% (was 5%)'
            },
            
            university: {
                name: 'National University',
                description: 'Advanced education and research institution',
                maxCount: 3,
                cost: { money: 7500000, cement: 300, paper: 400, food: 200, water: 150 },
                techRequired: 500,
                effect: '+10% literacy rate, +3 happiness, -5% tech costs per university',
                category: 'education',
                special: 'Stacking benefits up to 3 universities'
            },
            
            ambulanceHub: {
                name: 'Emergency Medical Hub',
                description: 'Advanced emergency medical response center',
                maxCount: 3,
                cost: { money: 4000000, cement: 200, paper: 100, gas: 150, food: 100, water: 100 },
                techRequired: 500,
                bonusRequirement: 'automobiles', // Requires Automobiles bonus resource
                effect: '-10% disease rate, +5 happiness per hub',
                category: 'healthcare',
                special: 'Requires Automobiles bonus resource to build (but not to maintain)'
            }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the projects system
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('Projects System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('build_project', this.buildProject, this);
        EventBus.on('demolish_project', this.demolishProject, this);
        EventBus.on('get_project_info', this.getProjectInfo, this);
        EventBus.on('launch_missile', this.launchMissile, this);
        EventBus.on('intercept_missile', this.interceptMissile, this);
    }
    
    /**
     * Build a project
     */
    buildProject(data) {
        const { projectType, nation } = data;
        
        if (!this.projectTypes[projectType]) {
            console.warn(`Unknown project type: ${projectType}`);
            return false;
        }
        
        const project = this.projectTypes[projectType];
        const currentCount = this.getProjectCount(nation, projectType);
        
        // Check max count
        if (currentCount >= project.maxCount) {
            console.warn(`Maximum ${project.name} limit reached (${project.maxCount})`);
            return false;
        }
        
        // Check tech requirement
        if (nation.tech < project.techRequired) {
            console.warn(`${project.name} requires ${project.techRequired} technology (current: ${nation.tech})`);
            return false;
        }
        
        // Check bonus resource requirement (for Ambulance Hub)
        if (project.bonusRequirement && !nation.bonusEffects?.[project.bonusRequirement]) {
            console.warn(`${project.name} requires ${project.bonusRequirement} bonus resource`);
            return false;
        }
        
        // Check costs
        if (!this.canAffordProject(nation, project)) {
            console.warn(`Cannot afford ${project.name}`);
            return false;
        }
        
        // Pay costs
        this.payProjectCost(nation, project);
        
        // Add project
        if (!nation.projects) nation.projects = {};
        if (!nation.projects[projectType]) nation.projects[projectType] = 0;
        nation.projects[projectType]++;
        
        // Apply effects
        this.applyProjectEffects(nation, projectType);
        
        EventBus.emit('project_built', {
            type: projectType,
            name: project.name,
            count: nation.projects[projectType],
            nation: nation
        });
        
        console.log(`Built ${project.name} (${nation.projects[projectType]}/${project.maxCount})`);
        return true;
    }
    
    /**
     * Check if nation can afford project
     */
    canAffordProject(nation, project) {
        return Object.entries(project.cost).every(([resource, amount]) => {
            if (resource === 'money') {
                return nation.money >= amount;
            }
            return (nation.resources[resource] || 0) >= amount;
        });
    }
    
    /**
     * Pay for project cost
     */
    payProjectCost(nation, project) {
        Object.entries(project.cost).forEach(([resource, amount]) => {
            if (resource === 'money') {
                nation.money -= amount;
            } else {
                nation.resources[resource] -= amount;
            }
        });
    }
    
    /**
     * Get current count of project type
     */
    getProjectCount(nation, projectType) {
        return nation.projects?.[projectType] || 0;
    }
    
    /**
     * Apply project effects to nation
     */
    applyProjectEffects(nation, projectType) {
        if (!nation.projectEffects) nation.projectEffects = {};
        
        const count = this.getProjectCount(nation, projectType);
        
        switch (projectType) {
            case 'missileSilo':
                nation.projectEffects.missileCapacity = count * 2; // 2 missiles per silo
                if (!nation.military) nation.military = {};
                if (!nation.military.missiles) nation.military.missiles = 0;
                break;
                
            case 'ironCurtain':
                nation.projectEffects.missileInterception = Math.min(0.45, count * 0.15); // Max 45%
                break;
                
            case 'tradeHub':
                nation.projectEffects.permanentTrades = true;
                nation.projectEffects.unlimitedTradeProposals = true;
                break;
                
            case 'commandCenter':
                nation.projectEffects.offensiveWarSlots = 2 + count; // Base 2 + 1 per center
                nation.projectEffects.defensiveWarSlots = 2 + count; // Base 2 + 1 per center
                break;
                
            case 'officeOfRelationships':
                nation.projectEffects.changeableRelationships = true;
                break;
                
            case 'militaryAcademy':
                nation.projectEffects.maxSoldierPercent = 30; // Up from 20%
                nation.projectEffects.maxTankPercent = 20;    // Up from 10%
                nation.projectEffects.maxAircraftPercent = 10; // Up from 7.5%
                nation.projectEffects.maxShipPercent = 7.5;   // Up from 5%
                break;
                
            case 'university':
                nation.projectEffects.universityLiteracyBonus = count * 0.10; // 10% per university
                nation.projectEffects.universityHappinessBonus = count * 3;   // +3 happiness per university
                nation.projectEffects.techCostReduction = count * 0.05;       // -5% tech costs per university
                break;
                
            case 'ambulanceHub':
                nation.projectEffects.ambulanceDiseaseReduction = count * 0.10; // 10% per hub
                nation.projectEffects.ambulanceHappinessBonus = count * 5;      // +5 happiness per hub
                break;
        }
        
        // Update nation stats to reflect project effects
        this.updateNationWithProjectEffects(nation);
    }
    
    /**
     * Update nation statistics with project effects
     */
    updateNationWithProjectEffects(nation) {
        // This integrates with the nation stats system
        if (nation.calculateNationStats) {
            nation.calculateNationStats();
        }
    }
    
    /**
     * Launch missile (requires missile silo and available missiles)
     */
    launchMissile(data) {
        const { nation, targetNationId, missileType = 'standard' } = data;
        
        if (!nation.projectEffects?.missileCapacity || nation.projectEffects.missileCapacity === 0) {
            console.warn('No missile silos available');
            return false;
        }
        
        if (!nation.military?.missiles || nation.military.missiles === 0) {
            console.warn('No missiles available for launch');
            return false;
        }
        
        // Consume missile
        nation.military.missiles--;
        
        // Calculate damage and launch
        const damage = this.calculateMissileDamage(nation, missileType);
        
        EventBus.emit('missile_launched', {
            from: nation.id,
            target: targetNationId,
            damage: damage,
            type: missileType,
            canBeIntercepted: true
        });
        
        console.log(`Missile launched at ${targetNationId} with ${damage} damage`);
        return true;
    }
    
    /**
     * Calculate missile damage
     */
    calculateMissileDamage(nation, missileType) {
        let baseDamage = 1000; // Base missile damage
        
        // Apply military morale and improvements
        if (nation.nationStats?.militaryMorale) {
            baseDamage *= nation.nationStats.militaryMorale;
        }
        
        // Missile type modifiers
        switch (missileType) {
            case 'standard':
                baseDamage *= 1.0;
                break;
            case 'nuclear':
                baseDamage *= 5.0; // 5x damage for nuclear
                break;
            case 'precision':
                baseDamage *= 0.8; // Less damage but higher accuracy
                break;
        }
        
        return Math.floor(baseDamage);
    }
    
    /**
     * Attempt to intercept incoming missile
     */
    interceptMissile(data) {
        const { targetNation, incomingDamage } = data;
        
        if (!targetNation.projectEffects?.missileInterception) {
            return { intercepted: false, damage: incomingDamage };
        }
        
        const interceptionChance = targetNation.projectEffects.missileInterception;
        const roll = Math.random();
        
        if (roll < interceptionChance) {
            console.log(`Missile intercepted! (${Math.round(interceptionChance * 100)}% chance)`);
            return { intercepted: true, damage: 0 };
        } else {
            console.log(`Missile not intercepted (${Math.round(interceptionChance * 100)}% chance)`);
            return { intercepted: false, damage: incomingDamage };
        }
    }
    
    /**
     * Produce missiles (daily production for missile silos)
     */
    produceMissiles(nation) {
        if (!nation.projectEffects?.missileCapacity) return;
        
        const maxMissiles = nation.projectEffects.missileCapacity;
        const currentMissiles = nation.military?.missiles || 0;
        
        if (currentMissiles < maxMissiles) {
            // Produce missiles based on available resources and tech
            const productionRate = Math.min(1, Math.floor(nation.tech / 1000)); // 1 missile per day at 1000+ tech
            const canProduce = Math.min(productionRate, maxMissiles - currentMissiles);
            
            if (canProduce > 0) {
                if (!nation.military) nation.military = {};
                nation.military.missiles = (nation.military.missiles || 0) + canProduce;
                
                console.log(`Produced ${canProduce} missiles (${nation.military.missiles}/${maxMissiles})`);
            }
        }
    }
    
    /**
     * Calculate military unit limits based on projects
     */
    getMilitaryUnitLimits(nation) {
        const baseLimits = {
            soldiers: 0.20,  // 20% base
            tanks: 0.10,     // 10% base
            aircraft: 0.075, // 7.5% base
            ships: 0.05      // 5% base
        };
        
        // Apply Military Academy bonuses
        if (nation.projectEffects?.maxSoldierPercent) {
            baseLimits.soldiers = nation.projectEffects.maxSoldierPercent / 100;
        }
        if (nation.projectEffects?.maxTankPercent) {
            baseLimits.tanks = nation.projectEffects.maxTankPercent / 100;
        }
        if (nation.projectEffects?.maxAircraftPercent) {
            baseLimits.aircraft = nation.projectEffects.maxAircraftPercent / 100;
        }
        if (nation.projectEffects?.maxShipPercent) {
            baseLimits.ships = nation.projectEffects.maxShipPercent / 100;
        }
        
        // Calculate actual unit limits based on population
        return {
            soldiers: Math.floor(nation.population * baseLimits.soldiers),
            tanks: Math.floor(nation.population * baseLimits.tanks),
            aircraft: Math.floor(nation.population * baseLimits.aircraft),
            ships: Math.floor(nation.population * baseLimits.ships)
        };
    }
    
    /**
     * Check for excessive military force penalty
     */
    calculateMilitaryForcePenalty(nation) {
        if (!nation.military) return 0;
        
        const totalUnits = (nation.military.soldiers || 0) + 
                          (nation.military.tanks || 0) + 
                          (nation.military.aircraft || 0) + 
                          (nation.military.ships || 0);
        
        const populationPercent = totalUnits / nation.population;
        
        // Penalty if more than 25% of population is in military
        if (populationPercent > 0.25) {
            return 10; // -10 happiness for excessive force
        }
        
        return 0;
    }
    
    /**
     * Get project information
     */
    getProjectInfo(data) {
        const { projectType } = data;
        
        if (!this.projectTypes[projectType]) {
            return null;
        }
        
        const project = this.projectTypes[projectType];
        const nation = window.Nation;
        
        return {
            ...project,
            canAfford: nation ? this.canAffordProject(nation, project) : false,
            currentCount: nation ? this.getProjectCount(nation, projectType) : 0,
            meetsTechRequirement: nation ? nation.tech >= project.techRequired : false,
            meetsBonusRequirement: project.bonusRequirement ? 
                (nation?.bonusEffects?.[project.bonusRequirement] || false) : true
        };
    }
    
    /**
     * Demolish project
     */
    demolishProject(data) {
        const { projectType, nation } = data;
        
        if (!nation.projects?.[projectType] || nation.projects[projectType] <= 0) {
            console.warn(`No ${projectType} to demolish`);
            return false;
        }
        
        nation.projects[projectType]--;
        
        // Reapply effects with new count
        this.applyProjectEffects(nation, projectType);
        
        EventBus.emit('project_demolished', {
            type: projectType,
            count: nation.projects[projectType],
            nation: nation
        });
        
        return true;
    }
    
    /**
     * Get all projects for a nation
     */
    getNationProjects(nation) {
        const projects = {};
        
        Object.keys(this.projectTypes).forEach(type => {
            const project = this.projectTypes[type];
            projects[type] = {
                ...project,
                count: this.getProjectCount(nation, type),
                canAfford: this.canAffordProject(nation, project),
                isMaxed: this.getProjectCount(nation, type) >= project.maxCount,
                meetsTechRequirement: nation.tech >= project.techRequired,
                meetsBonusRequirement: project.bonusRequirement ? 
                    (nation.bonusEffects?.[project.bonusRequirement] || false) : true
            };
        });
        
        return projects;
    }
    
    /**
     * Process daily project operations
     */
    processDaily(nation) {
        // Produce missiles for missile silos
        this.produceMissiles(nation);
        
        // Calculate and apply military force penalties
        const penalty = this.calculateMilitaryForcePenalty(nation);
        if (penalty > 0) {
            nation.nationStats.happiness -= penalty;
            nation.nationStats.happiness = Math.max(0, nation.nationStats.happiness);
        }
    }
    
    /**
     * Destroy the projects system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        EventBus.off('build_project', this.buildProject, this);
        EventBus.off('demolish_project', this.demolishProject, this);
        EventBus.off('get_project_info', this.getProjectInfo, this);
        EventBus.off('launch_missile', this.launchMissile, this);
        EventBus.off('intercept_missile', this.interceptMissile, this);
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectsSystem;
} else {
    window.ProjectsSystem = ProjectsSystem;
}