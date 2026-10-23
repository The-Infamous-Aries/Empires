/**
 * Wonders System - Empire Builder
 * Handles advanced wonder constructions (highest tier buildings with unique effects)
 */

class WondersSystem {
    constructor() {
        this.isInitialized = false;
        
        // Wonder definitions - most advanced buildings in the game
        this.wonderTypes = {};
        
        this.initializeWonderTypes();
        this.initialize();
    }
    
    /**
     * Initialize wonder type definitions
     */
    initializeWonderTypes() {
        // Monument Wonders - unlock government/religion flexibility
        this.wonderTypes.governmentMonument = {
            name: 'Government Monument',
            description: 'Removes permanent lock from Government Statue, allows government changes every 14 days',
            maxCount: 1,
            cost: { money: 50000000, cement: 800, paper: 300, steel: 500, lumber: 300, water: 200 },
            techRequired: 500,
            effect: 'Unlocks government changes from Government Statue (once per 14 days)',
            category: 'administration',
            special: 'Removes government lock, adds 14-day cooldown for changes',
            requires: 'governmentStatue'
        };
        
        this.wonderTypes.religiousMonument = {
            name: 'Religious Monument', 
            description: 'Removes permanent lock from Religious Statue, allows religion changes every 14 days',
            maxCount: 1,
            cost: { money: 50000000, cement: 800, paper: 300, steel: 500, lumber: 300, food: 200 },
            techRequired: 500,
            effect: 'Unlocks religion changes from Religious Statue (once per 14 days)',
            category: 'administration',
            special: 'Removes religion lock, adds 14-day cooldown for changes',
            requires: 'religiousStatue'
        };
        
        // Research & Science Wonders
        this.wonderTypes.great_library = {
            name: 'Great Library',
            description: 'Center of learning that allows simultaneous research projects and accelerates technological advancement',
            maxCount: 1,
            cost: { money: 75000000, cement: 1200, paper: 800, steel: 600, lumber: 400, water: 300 },
            techRequired: 600,
            effect: 'Enables 2 simultaneous research projects, +25% research speed, +200 research points/day',
            category: 'science',
            special: 'Unlocks second research slot, research speed bonus, daily research points',
            requires: 'advancedUniversity'
        };

        // Education & Healthcare Wonders
        this.wonderTypes.universalEducation = {
            name: 'Universal Education System',
            description: 'Advanced education system raising literacy and reducing tech costs',
            maxCount: 1,
            cost: { money: 75000000, cement: 600, steel: 400, food: 300, water: 250, lumber: 200, paper: 500, lead: 100 },
            techRequired: 2000,
            effect: '+25% literacy rate, -15% tech costs',
            category: 'education',
            special: 'Massive education and research boost'
        };
        
        this.wonderTypes.universalHealthcare = {
            name: 'Universal Healthcare System',
            description: 'Advanced healthcare system reducing disease and increasing happiness',
            maxCount: 1,
            cost: { money: 80000000, cement: 700, food: 400, water: 350, steel: 300, paper: 400, aluminum: 200 },
            techRequired: 2000,
            effect: '-35% disease rate, +15 happiness',
            category: 'healthcare',
            special: 'Comprehensive healthcare for all citizens'
        };
        
        // Enhanced Military Wonders
        this.wonderTypes.enhancedSilos = {
            name: 'Enhanced Missile Silo Network',
            description: 'Upgraded missile production and storage capabilities',
            maxCount: 1,
            cost: { money: 60000000, cement: 800, steel: 600, aluminum: 400, gas: 300, ammo: 500 },
            techRequired: 1500,
            effect: 'Each silo produces 2 missiles/day and stores 10 (was 1/day, 5 storage)',
            category: 'military',
            special: 'Doubles missile silo efficiency',
            requires: 'missileSilo'
        };
        
        this.wonderTypes.enhancedSpyOps = {
            name: 'Enhanced Intelligence Network',
            description: 'Advanced spy operations with increased production and capacity',
            maxCount: 1,
            cost: { money: 90000000, cement: 600, paper: 500, food: 300, water: 250, steel: 400, aluminum: 300 },
            techRequired: 3000,
            effect: 'Each Spy Operations produces 5 spies/day and stores 15 (was 3/day, 10 storage)',
            category: 'military',
            special: 'Elite intelligence capabilities',
            requires: 'spyOperations'
        };
        
        this.wonderTypes.militaryRecovery = {
            name: 'Military Recovery Wonder',
            description: 'Advanced battlefield salvage operations and medical support systems',
            maxCount: 1,
            cost: { money: 55000000, cement: 500, steel: 400, aluminum: 300, gas: 250, ammo: 200, food: 150, water: 100 },
            techRequired: 1200,
            effect: 'Doubles Military Salvage project recovery rate to 18% and reduces soldier losses by 2.5%',
            category: 'military',
            special: 'Enhanced combat resource recovery and soldier preservation',
            requires: 'militarySalvage'
        };
        
        // Enhanced Infrastructure Wonders
        this.wonderTypes.enhancedSalvage = {
            name: 'Advanced Resource Recovery Complex',
            description: 'Enhanced salvage operations with higher recovery rates',
            maxCount: 1,
            cost: { money: 70000000, cement: 800, steel: 600, lumber: 400, aluminum: 300, gas: 350, food: 200, water: 150 },
            techRequired: 1500,
            effect: 'Increases refund rates: 30% improvements, 20% projects, 10% wonders (was 15%/10%/5%)',
            category: 'infrastructure',
            special: 'Doubles resource recovery efficiency',
            requires: 'salvageYard'
        };
        
        // Nuclear Wonders
        this.wonderTypes.nuclearWarheadFacility = {
            name: 'Nuclear Warhead Production Facility',
            description: 'Enables nuclear weapon production and storage',
            maxCount: 1,
            cost: { money: 100000000, cement: 1000, steel: 800, gas: 600, ammo: 800, aluminum: 500, uranium: 200 },
            techRequired: 750,
            effect: 'Produces 1 nuclear warhead per day, stores up to 3 warheads',
            category: 'military',
            special: 'NUCLEAR CAPABILITY - Ultimate military deterrent'
        };
        
        this.wonderTypes.enhancedNuclearWarheads = {
            name: 'Enhanced Nuclear Arsenal',
            description: 'Upgraded nuclear production with increased capacity',
            maxCount: 1,
            cost: { money: 150000000, cement: 1200, steel: 1000, gas: 800, ammo: 1000, aluminum: 600, uranium: 300 },
            techRequired: 2000,
            effect: 'Increases nuclear production to 2/day and storage to 5 warheads',
            category: 'military',
            special: 'Advanced nuclear weapons program',
            requires: 'nuclearWarheadFacility'
        };
        
        // Resource Alternative Wonders
        this.wonderTypes.atmosphericWaterGenerator = {
            name: 'Atmospheric Water Generation Complex',
            description: 'Advanced technology that eliminates water dependency',
            maxCount: 1,
            cost: { money: 120000000, cement: 900, steel: 700, aluminum: 500, lead: 300, uranium: 150 },
            techRequired: 2500,
            effect: 'Removes population happiness penalty for lacking water, enables water-dependent bonuses',
            category: 'infrastructure',
            special: 'Generates water from atmospheric humidity - no water resources needed'
        };
        
        this.wonderTypes.hydroponicCropFarm = {
            name: 'Hydroponic Mega-Farm Complex',
            description: 'Advanced farming technology that eliminates food dependency',
            maxCount: 1,
            cost: { money: 110000000, cement: 800, steel: 600, aluminum: 450, water: 400, uranium: 125 },
            techRequired: 2500,
            effect: 'Removes population happiness penalty for lacking food, enables food-dependent bonuses',
            category: 'infrastructure',
            special: 'Soil-less farming technology - no food resources needed'
        };
        
        // Sports Stadium Wonders
        this.wonderTypes.basketballStadium = {
            name: 'Basketball Stadium Complex',
            description: 'Professional basketball facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 85000000, cement: 700, steel: 500, aluminum: 300, lumber: 400, gas: 200 },
            techRequired: 1200,
            effect: 'Unlocks basketball team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a basketball team with players, upgrades, and tournaments'
        };

        this.wonderTypes.hockeyStadium = {
            name: 'Hockey Arena Complex',
            description: 'Professional hockey facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 90000000, cement: 800, steel: 600, aluminum: 400, water: 300, gas: 250 },
            techRequired: 1300,
            effect: 'Unlocks hockey team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a hockey team with players, upgrades, and tournaments'
        };

        this.wonderTypes.soccerStadium = {
            name: 'Soccer Stadium Complex',
            description: 'Professional soccer facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 80000000, cement: 600, steel: 450, aluminum: 250, lumber: 500, water: 200 },
            techRequired: 1100,
            effect: 'Unlocks soccer team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a soccer team with players, upgrades, and tournaments'
        };
        
        // Alliance Management Wonder
        this.wonderTypes.allianceHeadquarters = {
            name: 'Alliance Headquarters Complex',
            description: 'Diplomatic and organizational center for creating and managing alliances',
            maxCount: 1,
            cost: { money: 75000000, cement: 600, lumber: 400, paper: 300, steel: 250, aluminum: 150 },
            techRequired: 1000,
            effect: 'Enables alliance creation and advanced diplomatic features',
            category: 'diplomacy',
            special: 'Foundation for alliance leadership - coordinate with other nations without easter eggs'
        };
        
        // Enhanced Production Wonders
        this.wonderTypes.supremeMining = {
            name: 'Supreme Mining Complex',
            description: 'Ultimate mining technology that boosts all mine efficiency by 50%',
            maxCount: 1,
            cost: { money: 80000000, steel: 800, cement: 600, uranium: 400, aluminum: 300, gas: 500 },
            techRequired: 1500,
            effect: 'Increases mine efficiency by additional 50% (stacks with Enhanced Mining project)',
            category: 'production',
            special: 'Revolutionary mining technology'
        };
        
        this.wonderTypes.cleanMining = {
            name: 'Clean Mining Operations Wonder',
            description: 'Advanced mining technology that eliminates pollution from all mines',
            maxCount: 1,
            cost: { money: 75000000, steel: 600, aluminum: 500, cement: 500, uranium: 300, gas: 400 },
            techRequired: 1800,
            effect: 'Removes all pollution generated by mines (they produce 0 pollution)',
            category: 'production',
            special: 'Environmentally clean mining operations'
        };
        
        this.wonderTypes.supremeAssembly = {
            name: 'Supreme Manufacturing Complex',
            description: 'Ultimate manufacturing technology that boosts all assembly plant efficiency by 50%',
            maxCount: 1,
            cost: { money: 85000000, steel: 900, aluminum: 600, cement: 700, gas: 600, paper: 300 },
            techRequired: 1800,
            effect: 'Increases assembly plant efficiency by additional 50% (stacks with Enhanced Assembly project)',
            category: 'production',
            special: 'Revolutionary manufacturing technology'
        };
        
        this.wonderTypes.cleanAssembly = {
            name: 'Clean Manufacturing Operations Wonder',
            description: 'Advanced manufacturing technology that eliminates pollution from all assembly plants',
            maxCount: 1,
            cost: { money: 80000000, steel: 700, aluminum: 600, cement: 600, gas: 500, paper: 200 },
            techRequired: 2000,
            effect: 'Removes all pollution generated by assembly plants (they produce 0 pollution)',
            category: 'production',
            special: 'Environmentally clean manufacturing operations'
        };
        
        this.wonderTypes.supremeRecycling = {
            name: 'Supreme Environmental Protection Complex',
            description: 'Ultimate recycling technology that triples effectiveness and provides environmental bonuses',
            maxCount: 1,
            cost: { money: 90000000, steel: 800, aluminum: 700, cement: 800, gas: 600, uranium: 200 },
            techRequired: 2200,
            effect: 'Triples recycling center effectiveness, removes happiness penalty, +1 environment per recycling center',
            category: 'infrastructure',
            special: 'Ultimate environmental protection technology'
        };
        
        // Supreme Military Wonder
        this.wonderTypes.supremeMilitary = {
            name: 'Supreme Military Command Complex',
            description: 'Ultimate military enhancement that boosts all maxed military improvements but reduces happiness',
            maxCount: 1,
            cost: { money: 150000000, steel: 1200, aluminum: 800, cement: 1000, gas: 800, ammo: 1000, uranium: 300 },
            techRequired: 3000,
            effect: 'Gives slight boost to ALL military unit types that are at maximum stacks (5), but causes -0.5 happiness per boosted type (max -2 when all 4 at max)',
            category: 'military',
            special: 'Ultimate military supremacy with population unrest'
        };
        
        // World Forum Wonders
        this.wonderTypes.internet = {
            name: 'Global Internet Network',
            description: 'Advanced communication network enabling participation in world affairs voting',
            maxCount: 1,
            cost: { money: 60000000, aluminum: 800, paper: 600, cement: 400, steel: 300, gas: 200, uranium: 150 },
            techRequired: 1500,
            effect: 'Allows voting on world affairs in World Forum (edicts and global policies), requires Broadcasting Network',
            category: 'infrastructure',
            special: 'Enables participation in global World Forum decisions beyond color politics',
            requires: 'broadcasting' // Requires Broadcasting project
        };
    }
    
    /**
     * Initialize the wonders system
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('Wonders System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on('build_wonder', this.buildWonder, this);
        EventBus.on('demolish_wonder', this.demolishWonder, this);
        EventBus.on('get_wonder_info', this.getWonderInfo, this);
    }
    
    /**
     * Build a wonder
     */
    buildWonder(data) {
        const { wonderType, nation } = data;
        
        if (!this.wonderTypes[wonderType]) {
            console.warn(`Unknown wonder type: ${wonderType}`);
            return false;
        }
        
        const wonder = this.wonderTypes[wonderType];
        const currentCount = this.getWonderCount(nation, wonderType);
        
        // Check max count
        if (currentCount >= wonder.maxCount) {
            console.warn(`Maximum ${wonder.name} limit reached (${wonder.maxCount})`);
            return false;
        }
        
        // Check tech requirement
        if (nation.tech < wonder.techRequired) {
            console.warn(`${wonder.name} requires ${wonder.techRequired} technology (current: ${nation.tech})`);
            return false;
        }
        
        // Check prerequisite building requirement
        if (wonder.requires) {
            if (!nation.projects?.[wonder.requires] || nation.projects[wonder.requires] <= 0) {
                console.warn(`${wonder.name} requires ${wonder.requires} to be built first`);
                return false;
            }
        }
        
        // Check costs
        if (!this.canAffordWonder(nation, wonder)) {
            console.warn(`Cannot afford ${wonder.name}`);
            return false;
        }
        
        // Pay costs
        this.payWonderCost(nation, wonder);
        
        // Add wonder
        if (!nation.wonders) nation.wonders = {};
        if (!nation.wonders[wonderType]) nation.wonders[wonderType] = 0;
        nation.wonders[wonderType]++;
        
        // Apply effects
        this.applyWonderEffects(nation, wonderType);
        
        EventBus.emit('wonder_built', {
            type: wonderType,
            name: wonder.name,
            count: nation.wonders[wonderType],
            nation: nation
        });
        
        console.log(`Built ${wonder.name} - A Wonder of the World!`);
        return true;
    }
    
    /**
     * Check if nation can afford wonder
     */
    canAffordWonder(nation, wonder) {
        return Object.entries(wonder.cost).every(([resource, amount]) => {
            if (resource === 'money') {
                return nation.money >= amount;
            }
            return (nation.resources[resource] || 0) >= amount;
        });
    }
    
    /**
     * Pay for wonder cost
     */
    payWonderCost(nation, wonder) {
        Object.entries(wonder.cost).forEach(([resource, amount]) => {
            if (resource === 'money') {
                nation.money -= amount;
            } else {
                nation.resources[resource] -= amount;
            }
        });
    }
    
    /**
     * Get current count of wonder type
     */
    getWonderCount(nation, wonderType) {
        return nation.wonders?.[wonderType] || 0;
    }
    
    /**
     * Check if nation has a specific wonder
     */
    hasWonder(nationId, wonderType) {
        const nation = this.getNation ? this.getNation(nationId) : window.Nation;
        if (!nation) return false;
        return this.getWonderCount(nation, wonderType) > 0;
    }
    
    /**
     * Get nation by ID (helper method)
     */
    getNation(nationId) {
        if (window.DataManager && window.DataManager.currentPlayer) {
            return window.DataManager.currentPlayer.nations?.find(n => n.id === nationId) || window.Nation;
        }
        return window.Nation;
    }
    
    /**
     * Apply wonder effects to nation
     */
    applyWonderEffects(nation, wonderType) {
        if (!nation.wonderEffects) nation.wonderEffects = {};
        
        const count = this.getWonderCount(nation, wonderType);
        
        switch (wonderType) {
            case 'governmentMonument':
                if (nation.projectEffects?.governmentLocked) {
                    nation.wonderEffects.governmentChangeable = true;
                    nation.wonderEffects.governmentCooldown = 0;
                    nation.wonderEffects.lastGovernmentChange = 0;
                }
                break;
                
            case 'religiousMonument':
                if (nation.projectEffects?.religionLocked) {
                    nation.wonderEffects.religionChangeable = true;
                    nation.wonderEffects.religionCooldown = 0;
                    nation.wonderEffects.lastReligionChange = 0;
                }
                break;
                
            case 'universalEducation':
                nation.wonderEffects.universalEducationLiteracyBonus = 0.25;
                nation.wonderEffects.universalEducationTechCostReduction = 0.15;
                break;
                
            case 'universalHealthcare':
                nation.wonderEffects.universalHealthcareDiseaseReduction = 0.35;
                nation.wonderEffects.universalHealthcareHappinessBonus = 15;
                break;
                
            case 'enhancedSilos':
                nation.wonderEffects.enhancedMissileProduction = true;
                nation.wonderEffects.missileProductionRate = 2;
                nation.wonderEffects.missileStorageCapacity = 10;
                break;
                
            case 'enhancedSpyOps':
                nation.wonderEffects.enhancedSpyProduction = true;
                nation.wonderEffects.spyProductionRate = 5;
                nation.wonderEffects.spyStorageCapacity = 15;
                break;
                
            case 'militaryRecovery':
                nation.wonderEffects.militaryRecoveryEnabled = true;
                nation.wonderEffects.enhancedSalvageRate = (nation.projectEffects?.militarySalvageRate || 0) * 2; // Doubles the rate (9% becomes 18% per project)
                nation.wonderEffects.soldierLossReduction = 0.025; // 2.5% reduction in soldier casualties
                break;
                
            case 'enhancedSalvage':
                nation.wonderEffects.enhancedSalvage = true;
                nation.wonderEffects.improvementRecoveryRate = 0.30;
                nation.wonderEffects.projectRecoveryRate = 0.20;
                nation.wonderEffects.wonderRecoveryRate = 0.10;
                break;
                
            case 'nuclearWarheadFacility':
                nation.wonderEffects.nuclearCapability = true;
                nation.wonderEffects.nuclearProductionRate = 1;
                nation.wonderEffects.nuclearStorageCapacity = 3;
                if (!nation.military) nation.military = {};
                if (!nation.military.nukes) nation.military.nukes = 0;
                break;
                
            case 'enhancedNuclearWarheads':
                nation.wonderEffects.enhancedNuclearProduction = true;
                nation.wonderEffects.nuclearProductionRate = 2;
                nation.wonderEffects.nuclearStorageCapacity = 5;
                break;
                
            case 'atmosphericWaterGenerator':
                nation.wonderEffects.waterIndependence = true;
                nation.wonderEffects.simulatedWaterAccess = true;
                break;
                
            case 'hydroponicCropFarm':
                nation.wonderEffects.foodIndependence = true;
                nation.wonderEffects.simulatedFoodAccess = true;
                break;
                
            // Sports Stadium Effects
            case 'basketballStadium':
                nation.wonderEffects.basketballTeamUnlocked = true;
                break;
                
            case 'hockeyStadium':
                nation.wonderEffects.hockeyTeamUnlocked = true;
                break;
                
            case 'soccerStadium':
                nation.wonderEffects.soccerTeamUnlocked = true;
                break;
                
            case 'allianceHeadquarters':
                nation.wonderEffects.canCreateAlliance = true;
                nation.wonderEffects.allianceLeadershipBonus = 0.15; // 15% bonus to alliance coordination
                nation.wonderEffects.maxTreaties = 10; // Increased treaty capacity
                break;
                
            case 'supremeMining':
                nation.wonderEffects.supremeMineEfficiency = true;
                break;
                
            case 'cleanMining':
                nation.wonderEffects.cleanMineOperations = true;
                break;
                
            case 'supremeAssembly':
                nation.wonderEffects.supremeAssemblyEfficiency = true;
                break;
                
            case 'cleanAssembly':
                nation.wonderEffects.cleanAssemblyOperations = true;
                break;
                
            case 'supremeRecycling':
                nation.wonderEffects.supremeRecycling = true;
                break;
                
            case 'supremeMilitary':
                nation.wonderEffects.supremeMilitaryBonus = true;
                this.applySupremeMilitaryEffects(nation);
                break;
                
            case 'internet':
                nation.wonderEffects.globalVotingEnabled = true;
                nation.wonderEffects.worldAffairsAccess = true;
                break;
        }
        
        this.updateNationWithWonderEffects(nation);
    }
    
    /**
     * Update nation statistics with wonder effects
     */
    updateNationWithWonderEffects(nation) {
        if (nation.calculateNationStats) {
            nation.calculateNationStats();
        }
    }
    
    /**
     * Apply supreme military effects (only if all military improvements are maxed)
     */
    applySupremeMilitaryEffects(nation) {
        if (!nation.wonderEffects?.supremeMilitaryBonus || !nation.improvements) return;
        
        const militaryImprovements = ['barracks', 'factory', 'airforceBase', 'harbor'];
        let maxedCount = 0;
        let happinessPenalty = 0;
        
        // Check which military improvements are at maximum (5)
        militaryImprovements.forEach(improvement => {
            const count = nation.improvements[improvement] || 0;
            if (count >= 5) { // Maximum stack
                maxedCount++;
                happinessPenalty += 0.5; // -0.5 happiness per maxed type
                
                // Apply slight boost (additional 5% effectiveness)
                switch(improvement) {
                    case 'barracks':
                        nation.wonderEffects.supremeSoldierBonus = 0.05;
                        break;
                    case 'factory':
                        nation.wonderEffects.supremeTankBonus = 0.05;
                        break;
                    case 'airforceBase':
                        nation.wonderEffects.supremeAircraftBonus = 0.05;
                        break;
                    case 'harbor':
                        nation.wonderEffects.supremeShipBonus = 0.05;
                        break;
                }
            }
        });
        
        // Apply happiness penalty only if we have bonuses
        if (maxedCount > 0) {
            nation.wonderEffects.supremeMilitaryHappinessPenalty = happinessPenalty;
        } else {
            // No bonuses or penalties if not all maxed
            nation.wonderEffects.supremeSoldierBonus = 0;
            nation.wonderEffects.supremeTankBonus = 0;
            nation.wonderEffects.supremeAircraftBonus = 0;
            nation.wonderEffects.supremeShipBonus = 0;
            nation.wonderEffects.supremeMilitaryHappinessPenalty = 0;
        }
    }
    
    /**
     * Get wonder information
     */
    getWonderInfo(data) {
        const { wonderType } = data;
        
        if (!this.wonderTypes[wonderType]) {
            return null;
        }
        
        const wonder = this.wonderTypes[wonderType];
        const nation = window.Nation;
        
        return {
            ...wonder,
            canAfford: nation ? this.canAffordWonder(nation, wonder) : false,
            currentCount: nation ? this.getWonderCount(nation, wonderType) : 0,
            meetsTechRequirement: nation ? nation.tech >= wonder.techRequired : false,
            meetsPrerequisite: wonder.requires ? 
                (nation?.projects?.[wonder.requires] > 0) : true
        };
    }
    
    /**
     * Demolish wonder
     */
    demolishWonder(data) {
        const { wonderType, nation } = data;
        
        if (!nation.wonders?.[wonderType] || nation.wonders[wonderType] <= 0) {
            console.warn(`No ${wonderType} to demolish`);
            return false;
        }
        
        nation.wonders[wonderType]--;
        
        if (nation.wonders[wonderType] <= 0) {
            this.removeWonderEffects(nation, wonderType);
        }
        
        EventBus.emit('wonder_demolished', {
            type: wonderType,
            count: nation.wonders[wonderType],
            nation: nation
        });
        
        return true;
    }
    
    /**
     * Remove wonder effects when demolished
     */
    removeWonderEffects(nation, wonderType) {
        if (!nation.wonderEffects) return;
        
        switch (wonderType) {
            case 'governmentMonument':
                delete nation.wonderEffects.governmentChangeable;
                delete nation.wonderEffects.governmentCooldown;
                delete nation.wonderEffects.lastGovernmentChange;
                break;
                
            case 'religiousMonument':
                delete nation.wonderEffects.religionChangeable;
                delete nation.wonderEffects.religionCooldown;
                delete nation.wonderEffects.lastReligionChange;
                break;
                
            case 'universalEducation':
                delete nation.wonderEffects.universalEducationLiteracyBonus;
                delete nation.wonderEffects.universalEducationTechCostReduction;
                break;
                
            case 'universalHealthcare':
                delete nation.wonderEffects.universalHealthcareDiseaseReduction;
                delete nation.wonderEffects.universalHealthcareHappinessBonus;
                break;
                
            case 'enhancedSilos':
                delete nation.wonderEffects.enhancedMissileProduction;
                delete nation.wonderEffects.missileProductionRate;
                delete nation.wonderEffects.missileStorageCapacity;
                break;
                
            case 'enhancedSpyOps':
                delete nation.wonderEffects.enhancedSpyProduction;
                delete nation.wonderEffects.spyProductionRate;
                delete nation.wonderEffects.spyStorageCapacity;
                break;
                
            case 'enhancedSalvage':
                delete nation.wonderEffects.enhancedSalvage;
                delete nation.wonderEffects.improvementRecoveryRate;
                delete nation.wonderEffects.projectRecoveryRate;
                delete nation.wonderEffects.wonderRecoveryRate;
                break;
                
            case 'nuclearWarheadFacility':
                delete nation.wonderEffects.nuclearCapability;
                delete nation.wonderEffects.nuclearProductionRate;
                delete nation.wonderEffects.nuclearStorageCapacity;
                break;
                
            case 'enhancedNuclearWarheads':
                delete nation.wonderEffects.enhancedNuclearProduction;
                // Revert to base nuclear facility stats
                nation.wonderEffects.nuclearProductionRate = 1;
                nation.wonderEffects.nuclearStorageCapacity = 3;
                break;
                
            case 'atmosphericWaterGenerator':
                delete nation.wonderEffects.waterIndependence;
                delete nation.wonderEffects.simulatedWaterAccess;
                break;
                
            case 'hydroponicCropFarm':
                delete nation.wonderEffects.foodIndependence;
                delete nation.wonderEffects.simulatedFoodAccess;
                break;
                
            // Sports Stadium Effects Removal
            case 'basketballStadium':
                delete nation.wonderEffects.basketballTeamUnlocked;
                break;
                
            case 'hockeyStadium':
                delete nation.wonderEffects.hockeyTeamUnlocked;
                break;
                
            case 'soccerStadium':
                delete nation.wonderEffects.soccerTeamUnlocked;
                break;
                
            case 'allianceHeadquarters':
                delete nation.wonderEffects.canCreateAlliance;
                delete nation.wonderEffects.allianceLeadershipBonus;
                delete nation.wonderEffects.maxTreaties;
                break;
                
            case 'supremeMining':
                delete nation.wonderEffects.supremeMineEfficiency;
                break;
                
            case 'cleanMining':
                delete nation.wonderEffects.cleanMineOperations;
                break;
                
            case 'supremeAssembly':
                delete nation.wonderEffects.supremeAssemblyEfficiency;
                break;
                
            case 'cleanAssembly':
                delete nation.wonderEffects.cleanAssemblyOperations;
                break;
                
            case 'supremeRecycling':
                delete nation.wonderEffects.supremeRecycling;
                break;
                
            case 'supremeMilitary':
                delete nation.wonderEffects.supremeMilitaryBonus;
                delete nation.wonderEffects.supremeSoldierBonus;
                delete nation.wonderEffects.supremeTankBonus;
                delete nation.wonderEffects.supremeAircraftBonus;
                delete nation.wonderEffects.supremeShipBonus;
                delete nation.wonderEffects.supremeMilitaryHappinessPenalty;
                break;
                
            case 'internet':
                delete nation.wonderEffects.globalVotingEnabled;
                delete nation.wonderEffects.worldAffairsAccess;
                break;
        }
        
        this.updateNationWithWonderEffects(nation);
    }
    
    /**
     * Produce nuclear warheads (daily production)
     */
    produceNukes(nation) {
        if (!nation.wonderEffects?.nuclearCapability) return;
        
        const maxNukes = nation.wonderEffects.nuclearStorageCapacity || 3;
        const currentNukes = nation.military?.nukes || 0;
        const productionRate = nation.wonderEffects.nuclearProductionRate || 1;
        
        if (currentNukes < maxNukes) {
            const canProduce = Math.min(productionRate, maxNukes - currentNukes);
            
            if (canProduce > 0) {
                if (!nation.military) nation.military = {};
                nation.military.nukes = (nation.military.nukes || 0) + canProduce;
                
                console.log(`Produced ${canProduce} nuclear warheads (${nation.military.nukes}/${maxNukes})`);
            }
        }
    }
    
    /**
     * Enhanced missile production for wonders
     */
    produceEnhancedMissiles(nation) {
        if (!nation.wonderEffects?.enhancedMissileProduction) return;
        
        const siloCount = nation.projects?.missileSilo || 0;
        if (siloCount <= 0) return;
        
        const productionRate = nation.wonderEffects.missileProductionRate || 2;
        const storageCapacity = nation.wonderEffects.missileStorageCapacity || 10;
        const maxMissiles = siloCount * storageCapacity;
        const currentMissiles = nation.military?.missiles || 0;
        
        if (currentMissiles < maxMissiles) {
            const totalProduction = siloCount * productionRate;
            const canProduce = Math.min(totalProduction, maxMissiles - currentMissiles);
            
            if (canProduce > 0) {
                if (!nation.military) nation.military = {};
                nation.military.missiles = (nation.military.missiles || 0) + canProduce;
                
                console.log(`Enhanced missile production: ${canProduce} missiles (${nation.military.missiles}/${maxMissiles})`);
            }
        }
    }
    
    /**
     * Enhanced spy production for wonders
     */
    produceEnhancedSpies(nation) {
        if (!nation.wonderEffects?.enhancedSpyProduction) return;
        
        const spyCenterCount = nation.projects?.spyOperations || 0;
        if (spyCenterCount <= 0) return;
        
        const productionRate = nation.wonderEffects.spyProductionRate || 5;
        const storageCapacity = nation.wonderEffects.spyStorageCapacity || 15;
        const maxSpies = spyCenterCount * storageCapacity;
        const currentSpies = nation.military?.spies || 0;
        
        if (currentSpies < maxSpies) {
            const totalProduction = spyCenterCount * productionRate;
            const canProduce = Math.min(totalProduction, maxSpies - currentSpies);
            
            if (canProduce > 0) {
                if (!nation.military) nation.military = {};
                nation.military.spies = (nation.military.spies || 0) + canProduce;
                
                console.log(`Enhanced spy recruitment: ${canProduce} spies (${nation.military.spies}/${maxSpies})`);
            }
        }
    }
    
    /**
     * Process government/religion change cooldowns
     */
    processCooldowns(nation) {
        const currentDay = window.GameTime ? GameTime.getTime().totalDays : 0;
        
        // Government change cooldown
        if (nation.wonderEffects?.governmentChangeable && nation.wonderEffects.governmentCooldown > 0) {
            const daysSinceChange = currentDay - (nation.wonderEffects.lastGovernmentChange || 0);
            if (daysSinceChange >= 14) {
                nation.wonderEffects.governmentCooldown = 0;
            }
        }
        
        // Religion change cooldown
        if (nation.wonderEffects?.religionChangeable && nation.wonderEffects.religionCooldown > 0) {
            const daysSinceChange = currentDay - (nation.wonderEffects.lastReligionChange || 0);
            if (daysSinceChange >= 14) {
                nation.wonderEffects.religionCooldown = 0;
            }
        }
    }
    
    /**
     * Attempt to change government (if monument allows)
     */
    changeGovernment(data) {
        const { nation, newGovernment } = data;
        
        if (!nation.wonderEffects?.governmentChangeable) {
            console.warn('Government Monument required to change government after statue is built');
            return false;
        }
        
        if (nation.wonderEffects.governmentCooldown > 0) {
            console.warn('Government change is on cooldown (14 days between changes)');
            return false;
        }
        
        const currentDay = window.GameTime ? GameTime.getTime().totalDays : 0;
        
        nation.government = newGovernment;
        nation.wonderEffects.lastGovernmentChange = currentDay;
        nation.wonderEffects.governmentCooldown = 14;
        
        // Reapply government bonuses
        if (nation.applyGovernmentBonuses) {
            nation.applyGovernmentBonuses();
        }
        
        console.log(`Government changed to ${newGovernment} (next change available in 14 days)`);
        return true;
    }
    
    /**
     * Attempt to change religion (if monument allows)
     */
    changeReligion(data) {
        const { nation, newReligion } = data;
        
        if (!nation.wonderEffects?.religionChangeable) {
            console.warn('Religious Monument required to change religion after statue is built');
            return false;
        }
        
        if (nation.wonderEffects.religionCooldown > 0) {
            console.warn('Religion change is on cooldown (14 days between changes)');
            return false;
        }
        
        const currentDay = window.GameTime ? GameTime.getTime().totalDays : 0;
        
        nation.religion = newReligion;
        nation.wonderEffects.lastReligionChange = currentDay;
        nation.wonderEffects.religionCooldown = 14;
        
        // Reapply religion bonuses
        if (nation.applyReligionBonuses) {
            nation.applyReligionBonuses();
        }
        
        console.log(`Religion changed to ${newReligion} (next change available in 14 days)`);
        return true;
    }
    
    /**
     * Get all wonders for a nation
     */
    getNationWonders(nation) {
        const wonders = {};
        
        Object.keys(this.wonderTypes).forEach(type => {
            const wonder = this.wonderTypes[type];
            wonders[type] = {
                ...wonder,
                count: this.getWonderCount(nation, type),
                canAfford: this.canAffordWonder(nation, wonder),
                isMaxed: this.getWonderCount(nation, type) >= wonder.maxCount,
                meetsTechRequirement: nation.tech >= wonder.techRequired,
                meetsPrerequisite: wonder.requires ? 
                    (nation.projects?.[wonder.requires] > 0) : true
            };
        });
        
        return wonders;
    }
    
    /**
     * Process daily wonder operations
     */
    processDaily(nation) {
        // Produce nuclear warheads
        this.produceNukes(nation);
        
        // Enhanced missile production (overrides regular missile production)
        if (nation.wonderEffects?.enhancedMissileProduction) {
            this.produceEnhancedMissiles(nation);
        }
        
        // Enhanced spy production (overrides regular spy production)
        if (nation.wonderEffects?.enhancedSpyProduction) {
            this.produceEnhancedSpies(nation);
        }
        
        // Process government/religion change cooldowns
        this.processCooldowns(nation);
        
        // Recalculate supreme military effects if wonder is active
        if (nation.wonderEffects?.supremeMilitaryBonus) {
            this.applySupremeMilitaryEffects(nation);
        }
    }
    
    /**
     * Launch nuclear missile (requires nuclear warheads)
     */
    launchNuke(data) {
        const { nation, targetNationId, warheadType = 'standard' } = data;
        
        if (!nation.wonderEffects?.nuclearCapability) {
            console.warn('Nuclear Warhead Facility required for nuclear weapons');
            return false;
        }
        
        if (!nation.military?.nukes || nation.military.nukes === 0) {
            console.warn('No nuclear warheads available for launch');
            return false;
        }
        
        // Consume nuclear warhead
        nation.military.nukes--;
        
        // Calculate massive nuclear damage
        let damage = 10000; // Base nuclear damage (10x regular missile)
        
        if (warheadType === 'enhanced') {
            damage *= 1.5; // Enhanced warheads do 50% more damage
        }
        
        EventBus.emit('nuclear_missile_launched', {
            from: nation.id,
            target: targetNationId,
            damage: damage,
            type: warheadType,
            canBeIntercepted: false // Nuclear missiles cannot be intercepted by Iron Curtain
        });
        
        console.log(`NUCLEAR WEAPON LAUNCHED at ${targetNationId} with ${damage} damage!`);
        return true;
    }
    
    /**
     * Destroy the wonders system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        EventBus.off('build_wonder', this.buildWonder, this);
        EventBus.off('demolish_wonder', this.demolishWonder, this);
        EventBus.off('get_wonder_info', this.getWonderInfo, this);
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WondersSystem;
} else {
    window.WondersSystem = WondersSystem;
}