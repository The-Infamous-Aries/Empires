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
                effect: 'Produces 1 missile per day, stores up to 5 missiles per silo',
                category: 'military',
                special: 'Each silo can produce and store 5 missiles'
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
            },
            
            governmentStatue: {
                name: 'Government Monument',
                description: 'Permanent government choice with eternal population approval',
                maxCount: 1,
                cost: { money: 25000000, cement: 500, paper: 200, steel: 300, lumber: 200 },
                techRequired: 1000,
                effect: 'Locks government choice forever, population always approves',
                category: 'administration',
                special: 'PERMANENT - Cannot be demolished once built!',
                permanent: true
            },
            
            religiousStatue: {
                name: 'Religious Monument',
                description: 'Permanent religion choice with eternal population approval',
                maxCount: 1,
                cost: { money: 25000000, cement: 500, paper: 200, steel: 300, lumber: 200 },
                techRequired: 1000,
                effect: 'Locks religion choice forever, population always approves',
                category: 'administration',
                special: 'PERMANENT - Cannot be demolished once built!',
                permanent: true
            },
            
            spyOperations: {
                name: 'Intelligence Operations Center',
                description: 'Covert operations and espionage facility',
                maxCount: 5,
                cost: { money: 8000000, cement: 300, paper: 250, food: 150, water: 100 },
                techRequired: 750,
                effect: 'Produces 3 spies per day, holds up to 10 spies per center',
                category: 'military',
                special: 'Each center can store 10 spies and produces 3 daily'
            },
            
            salvageYard: {
                name: 'Resource Reclamation Facility',
                description: 'Recovers resources from demolished buildings',
                maxCount: 1,
                cost: { money: 18000000, cement: 400, steel: 300, lumber: 200, aluminum: 150, gas: 200 },
                techRequired: 1250,
                effect: 'Recovers 15% of improvement costs, 10% of project costs, 5% of wonder costs when demolishing',
                category: 'infrastructure',
                special: 'PERMANENT - Enables resource recovery from demolition',
                permanent: true
            },
            
            swatPolice: {
                name: 'SWAT Operations Center',
                description: 'Elite law enforcement tactical unit',
                maxCount: 3,
                cost: { money: 6000000, cement: 200, ammo: 300, gas: 150, paper: 100, water: 75 },
                techRequired: 750,
                effect: '-15% crime rate, +2 happiness per center',
                category: 'security',
                special: 'Enhanced crime reduction beyond regular police stations'
            },
            
            advancedResearch: {
                name: 'Advanced Research Institute',
                description: 'Doubles the effectiveness of Research Laboratories when fully stacked',
                maxCount: 5,
                cost: { money: 12000000, aluminum: 200, cement: 300, paper: 250, gas: 150 },
                techRequired: 1000,
                effect: 'When 5 are built, doubles Research Lab bonus (from 3% per lab to 6% per lab)',
                category: 'science',
                special: 'Requires 5 to activate: doubles Research Lab time reduction from 15% to 30%'
            },

            enhancedPolice: {
                name: 'Advanced Police Stations',
                description: 'Enhanced law enforcement facilities with improved crime control',
                maxCount: 3,
                cost: { money: 6000000, cement: 250, steel: 200, gas: 150, ammo: 300, food: 100, water: 75 },
                techRequired: 800,
                effect: '-10% crime rate, +2 happiness per center',
                category: 'infrastructure',
                special: 'Advanced crime reduction and public safety'
            },
            
            sportsBetting: {
                name: 'Sports Betting Complex',
                description: 'Legal gambling and entertainment facility',
                maxCount: 1,
                cost: { money: 12000000, cement: 300, steel: 250, aluminum: 100, food: 200, water: 150 },
                techRequired: 600,
                effect: '+33% taxable income but +33% crime rate',
                category: 'economic',
                special: 'Major economic boost with significant social costs'
            },
            
            enhancedMining: {
                name: 'Advanced Mining Operations',
                description: 'Doubles the effectiveness of all mines',
                maxCount: 1,
                cost: { money: 25000000, steel: 500, cement: 400, gas: 300, aluminum: 200, uranium: 100 },
                techRequired: 1000,
                effect: 'Doubles mine production efficiency (from 0.1 to 0.2 per mine per turn)',
                category: 'production',
                special: 'Significantly increases basic resource production from mines'
            },
            
            enhancedAssembly: {
                name: 'Advanced Manufacturing Systems',
                description: 'Doubles the effectiveness of all assembly plants',
                maxCount: 1,
                cost: { money: 30000000, steel: 600, cement: 500, aluminum: 400, gas: 350, paper: 200 },
                techRequired: 1200,
                effect: 'Doubles assembly plant production efficiency (from 0.05 to 0.1 per plant per turn)',
                category: 'production',
                special: 'Significantly increases manufactured resource production from assembly plants'
            },
            
            enhancedRecycling: {
                name: 'Advanced Recycling Operations',
                description: 'Doubles recycling center effectiveness but reduces happiness',
                maxCount: 1,
                cost: { money: 20000000, steel: 400, aluminum: 300, cement: 300, gas: 250, paper: 150 },
                techRequired: 800,
                effect: 'Doubles recycling center pollution reduction, but each recycling center reduces happiness by 1',
                category: 'infrastructure',
                special: 'Enhanced environmental protection with social costs'
            },
            
            // Military Enhancement Projects
            enhancedBarracks: {
                name: 'Elite Military Training Program',
                description: 'Advanced training that boosts soldier effectiveness',
                maxCount: 1,
                cost: { money: 15000000, steel: 300, cement: 250, ammo: 400, gas: 200, food: 300 },
                techRequired: 750,
                effect: 'Doubles barracks effectiveness bonus (from 10% to 20% per barracks)',
                category: 'military',
                special: 'Elite soldier training and conditioning program'
            },
            
            enhancedFactories: {
                name: 'Advanced Tank Manufacturing',
                description: 'Improved production techniques for superior tanks',
                maxCount: 1,
                cost: { money: 20000000, steel: 500, aluminum: 300, cement: 200, gas: 300, ammo: 250 },
                techRequired: 1000,
                effect: 'Doubles factory effectiveness bonus (from 10% to 20% per factory)',
                category: 'military',
                special: 'Next-generation armored vehicle production'
            },
            
            enhancedAirforces: {
                name: 'Advanced Aircraft Systems',
                description: 'Cutting-edge aerospace technology and pilot training',
                maxCount: 1,
                cost: { money: 25000000, aluminum: 600, steel: 300, cement: 250, gas: 400, ammo: 200 },
                techRequired: 1250,
                effect: 'Doubles airforce base effectiveness bonus (from 10% to 20% per base)',
                category: 'military',
                special: 'Superior aircraft and pilot capabilities'
            },
            
            enhancedNavy: {
                name: 'Advanced Naval Operations',
                description: 'Modern naval technology and fleet tactics',
                maxCount: 1,
                cost: { money: 22000000, steel: 600, aluminum: 200, cement: 300, gas: 350, ammo: 300 },
                techRequired: 1100,
                effect: 'Doubles harbor effectiveness bonus (from 10% to 20% per harbor)',
                category: 'military',
                special: 'State-of-the-art naval warfare capabilities'
            },
            
            broadcasting: {
                name: 'National Broadcasting Network',
                description: 'Enables participation in World Forum color-based voting and Congress eligibility',
                maxCount: 1,
                cost: { money: 8000000, aluminum: 150, paper: 300, cement: 200, steel: 100, gas: 100 },
                techRequired: 300,
                effect: 'Allows voting on color motions in World Forum and eligibility for Congress seats',
                category: 'infrastructure',
                special: 'Does NOT occupy a project slot but activates project cooldown',
                doesNotOccupySlot: true
            },
            
            financialAssistanceOffice: {
                name: 'Financial Assistance Office',
                description: 'Enables sending monetary and technological aid to allied nations',
                maxCount: 1,
                cost: { money: 12000000, cement: 300, paper: 400, steel: 200, food: 150, water: 100 },
                techRequired: 800,
                effect: 'Allows sending cash and tech through foreign aid, enhances Intelligence Pacts',
                category: 'diplomacy',
                special: '3 aid slots, 7 days proposal time, 3 days acceptance window'
            },
            
            militarySalvage: {
                name: 'Military Salvage Operations',
                description: 'Recovers resources from destroyed military equipment in combat',
                maxCount: 3,
                cost: { money: 8000000, cement: 300, steel: 400, aluminum: 200, lumber: 150 },
                techRequired: 650,
                effect: 'Recovers 9% of resources from destroyed tanks, aircraft, and ships in combat',
                category: 'military',
                special: 'Combat resource recovery - reduces war costs through salvage operations'
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
                nation.projectEffects.missileCapacity = count * 5; // 5 missiles per silo
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
                
            case 'governmentStatue':
                nation.projectEffects.governmentLocked = true;
                nation.projectEffects.governmentApprovalLocked = true;
                break;
                
            case 'religiousStatue':
                nation.projectEffects.religionLocked = true;
                nation.projectEffects.religionApprovalLocked = true;
                break;
                
            case 'spyOperations':
                nation.projectEffects.spyCapacity = count * 10; // 10 spies per center
                if (!nation.military) nation.military = {};
                if (!nation.military.spies) nation.military.spies = 0;
                break;
                
            case 'salvageYard':
                nation.projectEffects.resourceRecovery = true;
                nation.projectEffects.improvementRecoveryRate = 0.15; // 15%
                nation.projectEffects.projectRecoveryRate = 0.10;     // 10%
                nation.projectEffects.wonderRecoveryRate = 0.05;      // 5%
                break;
                
            case 'swatPolice':
                nation.projectEffects.swatCrimeReduction = count * 0.10; // 10% per center
                nation.projectEffects.swatHappinessBonus = count * 2;    // +2 happiness per center
                break;
                
            case 'sportsBetting':
                nation.projectEffects.sportsBettingTaxBonus = 0.33;   // +33% taxable income
                nation.projectEffects.sportsBettingCrimeIncrease = 0.33; // +33% crime
                break;
                
            case 'enhancedMining':
                nation.projectEffects.enhancedMineEfficiency = true;
                break;
                
            case 'enhancedAssembly':
                nation.projectEffects.enhancedAssemblyEfficiency = true;
                break;
                
            case 'enhancedRecycling':
                nation.projectEffects.enhancedRecycling = true;
                break;
                
            case 'enhancedBarracks':
                nation.projectEffects.enhancedBarracksEfficiency = true;
                break;
                
            case 'enhancedFactories':
                nation.projectEffects.enhancedFactoryEfficiency = true;
                break;
                
            case 'enhancedAirforces':
                nation.projectEffects.enhancedAirforceEfficiency = true;
                break;
                
            case 'enhancedNavy':
                nation.projectEffects.enhancedNavyEfficiency = true;
                break;
                
            case 'broadcasting':
                nation.projectEffects.worldForumAccess = true;
                nation.projectEffects.colorVotingEnabled = true;
                nation.projectEffects.congressEligible = true;
                break;
                
            case 'financialAssistanceOffice':
                nation.projectEffects.financialAidEnabled = true;
                nation.projectEffects.techAidEnabled = true;
                nation.projectEffects.maxAidSlots = 3;
                nation.projectEffects.intelligencePactBonus = true; // Full tech sharing in Intelligence Pacts
                break;
                
            case 'militarySalvage':
                nation.projectEffects.militarySalvageRate = count * 0.09; // 9% per project (max 27% with 3 projects)
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
     * Produce missiles and spies (daily production)
     */
    produceMissiles(nation) {
        if (!nation.projectEffects?.missileCapacity) return;
        
        const maxMissiles = nation.projectEffects.missileCapacity;
        const currentMissiles = nation.military?.missiles || 0;
        const siloCount = this.getProjectCount(nation, 'missileSilo');
        
        if (currentMissiles < maxMissiles && siloCount > 0) {
            // Produce 1 missile per silo per day
            const productionRate = siloCount;
            const canProduce = Math.min(productionRate, maxMissiles - currentMissiles);
            
            if (canProduce > 0) {
                if (!nation.military) nation.military = {};
                nation.military.missiles = (nation.military.missiles || 0) + canProduce;
                
                console.log(`Produced ${canProduce} missiles (${nation.military.missiles}/${maxMissiles})`);
            }
        }
    }
    
    /**
     * Produce spies (daily production)
     */
    produceSpies(nation) {
        if (!nation.projectEffects?.spyCapacity) return;
        
        const maxSpies = nation.projectEffects.spyCapacity;
        const currentSpies = nation.military?.spies || 0;
        const spyCenterCount = this.getProjectCount(nation, 'spyOperations');
        
        if (currentSpies < maxSpies && spyCenterCount > 0) {
            // Produce 3 spies per center per day
            const productionRate = spyCenterCount * 3;
            const canProduce = Math.min(productionRate, maxSpies - currentSpies);
            
            if (canProduce > 0) {
                if (!nation.military) nation.military = {};
                nation.military.spies = (nation.military.spies || 0) + canProduce;
                
                console.log(`Produced ${canProduce} spies (${nation.military.spies}/${maxSpies})`);
            }
        }
    }
    
    /**
     * Calculate military unit limits based on projects
     */
    getMilitaryUnitLimits(nation) {
        const baseLimits = {
            soldiers: 0.20,   // 20% base
            tanks: 0.10,      // 10% base
            aircraft: 0.075,  // 7.5% base
            ships: 0.05,      // 5% base
            spies: 0.01,      // 1% base (only if spy operations exist)
            missiles: 0.005,  // 0.5% base (only if missile silo exists)
            nukes: 0.001      // 0.1% base (only if nuclear facility exists)
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
        const limits = {
            soldiers: Math.floor(nation.population * baseLimits.soldiers),
            tanks: Math.floor(nation.population * baseLimits.tanks),
            aircraft: Math.floor(nation.population * baseLimits.aircraft),
            ships: Math.floor(nation.population * baseLimits.ships)
        };
        
        // Special units require specific buildings
        if (nation.projects?.spyOperations > 0) {
            limits.spies = Math.floor(nation.population * baseLimits.spies);
        } else {
            limits.spies = 0;
        }
        
        if (nation.projects?.missileSilo > 0) {
            limits.missiles = Math.floor(nation.population * baseLimits.missiles);
        } else {
            limits.missiles = 0;
        }
        
        if (nation.wonders?.nuclearWarheadFacility > 0) {
            limits.nukes = Math.floor(nation.population * baseLimits.nukes);
        } else {
            limits.nukes = 0;
        }
        
        return limits;
    }
    
    /**
     * Check for excessive military force penalty
     */
    calculateMilitaryForcePenalty(nation) {
        if (!nation.militaryUnits) return 0;
        
        const totalUnits = (nation.militaryUnits.soldiers || 0) + 
                          (nation.militaryUnits.tanks || 0) + 
                          (nation.militaryUnits.aircraft || 0) + 
                          (nation.militaryUnits.ships || 0) + 
                          (nation.militaryUnits.spies || 0) + 
                          (nation.militaryUnits.missiles || 0) + 
                          (nation.militaryUnits.nukes || 0);
        
        const populationPercent = totalUnits / nation.population;
        
        // Penalty if more than 25% of population is in military/weapons
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
        
        const project = this.projectTypes[projectType];
        
        // Check if project is permanent (cannot be demolished)
        if (project.permanent) {
            console.warn(`${project.name} is permanent and cannot be demolished`);
            return false;
        }
        
        // Calculate resource recovery if salvage yard exists
        let recoveredResources = {};
        if (nation.projectEffects?.resourceRecovery && project.cost) {
            // Check if enhanced salvage rates are available from wonders
            const recoveryRate = nation.wonderEffects?.projectRecoveryRate || 
                               nation.projectEffects.projectRecoveryRate || 0.10;
                               
            Object.entries(project.cost).forEach(([resource, amount]) => {
                recoveredResources[resource] = Math.floor(amount * recoveryRate);
            });
            
            // Return recovered resources to nation
            Object.entries(recoveredResources).forEach(([resource, amount]) => {
                if (resource === 'money') {
                    nation.money += amount;
                } else {
                    nation.resources[resource] = (nation.resources[resource] || 0) + amount;
                }
            });
        }
        
        nation.projects[projectType]--;
        
        // Reapply effects with new count
        this.applyProjectEffects(nation, projectType);
        
        EventBus.emit('project_demolished', {
            type: projectType,
            count: nation.projects[projectType],
            recoveredResources: recoveredResources,
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
        // Check if wonders override missile/spy production
        const hasEnhancedMissiles = nation.wonderEffects?.enhancedMissileProduction;
        const hasEnhancedSpies = nation.wonderEffects?.enhancedSpyProduction;
        
        // Only produce regular missiles if no enhanced production
        if (!hasEnhancedMissiles) {
            this.produceMissiles(nation);
        }
        
        // Only produce regular spies if no enhanced production
        if (!hasEnhancedSpies) {
            this.produceSpies(nation);
        }
        
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