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
            cost: { money: 50000000 },
            techRequired: 500,
            resources: { 'bronze-manufactured': 2000, 'steel-manufactured': 500, 'copper-manufactured': 500 },
            effect: 'Unlocks government changes from Government Statue (once per 14 days)',
            category: 'administration',
            special: 'Removes government lock, adds 14-day cooldown for changes',
            requires: 'governmentStatue'
        };
        
        this.wonderTypes.religiousMonument = {
            name: 'Religious Monument', 
            description: 'Removes permanent lock from Religious Statue, allows religion changes every 14 days',
            maxCount: 1,
            cost: { money: 50000000 },
            techRequired: 500,
            resources: { 'bronze-manufactured': 2000, 'steel-manufactured': 500, 'copper-manufactured': 500 },
            effect: 'Unlocks religion changes from Religious Statue (once per 14 days)',
            category: 'administration',
            special: 'Removes religion lock, adds 14-day cooldown for changes',
            requires: 'religiousStatue'
        };
        
        // Research & Science Wonders
        this.wonderTypes.great_library = {
            name: 'Great Library',
            description: 'Center of learning that boosts literacy from Schools and reduces tech costs from National Universities',
            maxCount: 1,
            cost: { money: 75000000 },
            techRequired: 600,
            resources: { 'bronze-manufactured': 1000, 'copper-manufactured': 300, 'aluminum-manufactured': 300 },
            effect: '+2.5% literacy rate per School (making Schools +10% each, 50% total with 5). -2.5% tech cost per National University (making them -7.5% each, -32.5% total with Advanced University + 3 Universities).',
            category: 'science',
            special: 'Boosts School literacy and National University tech cost reduction',
            requires: 'advancedUniversity'
        };

        this.wonderTypes.grandResearchAcademy = {
            name: 'Grand Research Academy',
            description: 'Advanced research academy that boosts laboratory output. Requires the Advanced Research Institute project.',
            maxCount: 1,
            cost: { money: 100000000 },
            techRequired: 1200,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 300, 'steel-manufactured': 300, 'gasoline-manufactured': 300 },
            effect: 'Adds +1.5% research income per laboratory (requires Advanced Research Institute project). +2 pollution and +2 disease per lab.',
            category: 'science',
            special: 'Requires Advanced Research Institute project. +1.5% lab income per lab, +2 pollution/disease per lab',
            requires: 'advancedResearch'
        };

        this.wonderTypes.environmentalResearchComplex = {
            name: 'Environmental Research Complex',
            description: 'Eco-friendly research facility that cuts laboratory pollution and disease by half.',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 1400,
            resources: { 'bronze-manufactured': 1000, 'copper-manufactured': 300, 'aluminum-manufactured': 300, 'uranium-manufactured': 300 },
            effect: 'Cuts pollution and disease from laboratories by 50%.',
            category: 'science',
            special: 'Reduces lab pollution and disease by 50%'
        };

        // Education & Healthcare Wonders
        this.wonderTypes.universalEducation = {
            name: 'Universal Education System',
            description: 'Advanced education system raising literacy and reducing tech costs',
            maxCount: 1,
            cost: { money: 75000000 },
            techRequired: 2000,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 300, 'steel-manufactured': 300, 'uranium-manufactured': 300 },
            effect: '+25% literacy rate, -15% tech costs',
            category: 'education',
            special: 'Massive education and research boost'
        };
        
        this.wonderTypes.universalHealthcare = {
            name: 'Universal Healthcare System',
            description: 'Advanced healthcare system reducing disease and increasing happiness',
            maxCount: 1,
            cost: { money: 80000000 },
            techRequired: 2000,
            resources: { 'bronze-manufactured': 1000, 'copper-manufactured': 300, 'aluminum-manufactured': 300, 'gasoline-manufactured': 300 },
            effect: '-35% disease rate, +15 happiness',
            category: 'healthcare',
            special: 'Comprehensive healthcare for all citizens'
        };
        
        // Enhanced Military Wonders
        this.wonderTypes.enhancedSilos = {
            name: 'Enhanced Missile Silo Network',
            description: 'Upgraded missile production and storage capabilities',
            maxCount: 1,
            cost: { money: 60000000 },
            techRequired: 1500,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 500, 'gasoline-manufactured': 500 },
            effect: 'Each silo produces 2 missiles/day and stores 10 (was 1/day, 5 storage)',
            category: 'military',
            special: 'Doubles missile silo efficiency',
            requires: 'missileSilo'
        };
        
        this.wonderTypes.enhancedSpyOps = {
            name: 'Enhanced Intelligence Network',
            description: 'Advanced spy operations with increased production and capacity',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 3000,
            resources: { 'copper-manufactured': 500, 'lead-manufactured': 500, 'uranium-manufactured': 500 },
            effect: 'Each Spy Operations produces 5 spies/day and stores 15 (was 3/day, 10 storage)',
            category: 'military',
            special: 'Elite intelligence capabilities',
            requires: 'spyOperations'
        };
        
        this.wonderTypes.militaryRecovery = {
            name: 'Military Recovery Wonder',
            description: 'Advanced battlefield salvage operations and medical support systems',
            maxCount: 1,
            cost: { money: 55000000 },
            techRequired: 1200,
            resources: { 'steel-manufactured': 500, 'aluminum-manufactured': 500, 'lead-manufactured': 200, 'copper-manufactured': 200, 'bronze-manufactured': 1000 },
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
            cost: { money: 70000000 },
            techRequired: 1500,
            resources: { 'bronze-manufactured': 2000, 'aluminum-manufactured': 1000, 'steel-manufactured': 1000, 'uranium-manufactured': 500, 'gasoline-manufactured': 500 },
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
            cost: { money: 100000000 },
            techRequired: 750,
            resources: { 'uranium-manufactured': 300, 'aluminum-manufactured': 300, 'gasoline-manufactured': 300, 'steel-manufactured': 500 },
            effect: 'Produces 1 nuclear warhead per day, stores up to 3 warheads. +50 pollution.',
            category: 'military',
            special: 'NUCLEAR CAPABILITY - Ultimate military deterrent',
            pollutionProduction: 50
        };
        
        this.wonderTypes.enhancedNuclearWarheads = {
            name: 'Enhanced Nuclear Arsenal',
            description: 'Upgraded nuclear production with increased capacity',
            maxCount: 1,
            cost: { money: 150000000 },
            techRequired: 2000,
            resources: { 'bronze-manufactured': 2000, 'uranium-manufactured': 1000, 'aluminum-manufactured': 1000, 'gasoline-manufactured': 1000 },
            effect: 'Increases nuclear production to 2/day and storage to 5 warheads. +100 pollution.',
            category: 'military',
            special: 'Advanced nuclear weapons program',
            requires: 'nuclearWarheadFacility',
            pollutionProduction: 100
        };
        
        // Sports Stadium Wonders
        this.wonderTypes.basketballStadium = {
            name: 'Basketball Stadium Complex',
            description: 'Professional basketball facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 1200,
            resources: { 'bronze-manufactured': 600, 'steel-manufactured': 300, 'copper-manufactured': 300 },
            effect: 'Unlocks basketball team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a basketball team with players, upgrades, and tournaments'
        };

        this.wonderTypes.hockeyStadium = {
            name: 'Hockey Arena Complex',
            description: 'Professional hockey facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 1300,
            resources: { 'bronze-manufactured': 600, 'steel-manufactured': 300, 'copper-manufactured': 300 },
            effect: 'Unlocks hockey team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a hockey team with players, upgrades, and tournaments'
        };

        this.wonderTypes.soccerStadium = {
            name: 'Soccer Stadium Complex',
            description: 'Professional soccer facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 1100,
            resources: { 'bronze-manufactured': 600, 'steel-manufactured': 300, 'copper-manufactured': 300 },
            effect: 'Unlocks soccer team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a soccer team with players, upgrades, and tournaments'
        };

        this.wonderTypes.footballStadium = {
            name: 'Football Stadium Complex',
            description: 'Professional football facility enabling team ownership and management',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 1400,
            resources: { 'bronze-manufactured': 600, 'steel-manufactured': 300, 'copper-manufactured': 300 },
            effect: 'Unlocks football team creation, management, and tournament participation',
            category: 'sports',
            special: 'Professional sports franchise - own and manage a football team with players, upgrades, and tournaments'
        };
        
        // Alliance Management Wonder
        this.wonderTypes.allianceHeadquarters = {
            name: 'Alliance Headquarters Complex',
            description: 'Diplomatic and organizational center for creating and managing alliances',
            maxCount: 1,
            cost: { money: 75000000 },
            techRequired: 1000,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 300, 'gasoline-manufactured': 300, 'steel-manufactured': 300, 'aluminum-manufactured': 300 },
            effect: 'Enables alliance creation and advanced diplomatic features',
            category: 'diplomacy',
            special: 'Foundation for alliance leadership - coordinate with other nations without easter eggs'
        };
        
        // Enhanced Production Wonders
        this.wonderTypes.supremeMining = {
            name: 'Supreme Mining Complex',
            description: 'Doubles stack bonus for all 7 mineral production improvements when stacked 3+ (count 3: 25%→50%, count 4: 37.5%→75%, count 5: 50%→100%). Adds +50 pollution per mine.',
            maxCount: 1,
            cost: { money: 80000000 },
            techRequired: 1500,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 300, 'copper-manufactured': 300, 'steel-manufactured': 300, 'aluminum-manufactured': 300, 'gasoline-manufactured': 300, 'uranium-manufactured': 300 },
            effect: 'Doubles stack bonus for mineral production improvements at stack 3+; count 5 max stack: 50%→100%. +50 pollution per mine.',
            category: 'production',
            special: 'Doubles stack bonus at stack 3+ on mineral production improvements only',
            pollutionProduction: 50
        };
        
        this.wonderTypes.cleanMining = {
            name: 'Clean Mining Operations Wonder',
            description: 'Reduces pollution from all 7 mineral production improvements (steel, bronze, lead, aluminum, copper, uranium, gasoline) by 50%',
            maxCount: 1,
            cost: { money: 75000000 },
            techRequired: 1800,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 300, 'copper-manufactured': 300, 'steel-manufactured': 300, 'aluminum-manufactured': 300, 'gasoline-manufactured': 300, 'uranium-manufactured': 300 },
            effect: '-50% pollution from mineral production improvements only',
            category: 'production',
            special: 'Environmentally clean mining - affects raw goods production only'
        };
        
        this.wonderTypes.supremeAssembly = {
            name: 'Supreme Manufacturing Complex',
            description: 'Increases max stack transition bonus from 2 to 5 per transition improvement (7 improvements that convert raw resources into staged goods) and reduces assembly timer gate from 4 to 3 turns. Adds +75 pollution per transition plant.',
            maxCount: 1,
            cost: { money: 85000000 },
            techRequired: 1800,
            resources: { 'bronze-manufactured': 2000, 'lead-manufactured': 750, 'copper-manufactured': 750, 'steel-manufactured': 750, 'aluminum-manufactured': 750, 'gasoline-manufactured': 750, 'uranium-manufactured': 750 },
            effect: 'Max stack bonus: 2→5 transitions per turn; count 3-4 bonus: 1→2; timer gate: 4→3 turns - affects transition improvements only. +75 pollution per transition plant.',
            category: 'production',
            special: 'Revolutionary manufacturing technology - affects transition improvements only',
            pollutionProduction: 75
        };
        
        this.wonderTypes.cleanAssembly = {
            name: 'Clean Manufacturing Operations Wonder',
            description: 'Reduces pollution from the 7 transition improvements (that convert raw resources into staged goods) by 50% - affects transition improvements only',
            maxCount: 1,
            cost: { money: 80000000 },
            techRequired: 2000,
            resources: { 'bronze-manufactured': 2000, 'lead-manufactured': 750, 'copper-manufactured': 750, 'steel-manufactured': 750, 'aluminum-manufactured': 750, 'gasoline-manufactured': 750, 'uranium-manufactured': 750 },
            effect: '-50% pollution from transition improvements only',
            category: 'production',
            special: 'Environmentally clean manufacturing - affects transition improvements only'
        };
        
        this.wonderTypes.supremeRecycling = {
            name: 'Supreme Environmental Protection Complex',
            description: 'Ultimate recycling technology that triples effectiveness and provides environmental bonuses',
            maxCount: 1,
            cost: { money: 90000000 },
            techRequired: 2200,
            resources: { 'bronze-manufactured': 2000, 'copper-manufactured': 750, 'aluminum-manufactured': 750, 'uranium-manufactured': 750 },
            effect: 'Triples recycling center effectiveness (-300 → -900 each), removes happiness penalty, +1 environment per recycling center',
            category: 'infrastructure',
            special: 'Ultimate environmental protection technology',
            pollutionReduction: 0
        };
        
        // Supreme Military Wonder
        this.wonderTypes.supremeMilitary = {
            name: 'Supreme Military Command Complex',
            description: 'Ultimate military enhancement that boosts all maxed military improvements but reduces happiness',
            maxCount: 1,
            cost: { money: 150000000 },
            techRequired: 3000,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 500, 'steel-manufactured': 500, 'aluminum-manufactured': 500, 'gasoline-manufactured': 500 },
            effect: 'Gives slight boost to ALL military unit types that are at maximum stacks (5), but causes -0.5 happiness per boosted type (max -2 when all 4 at max). Doubles pollution from military unit efficiency improvements when max stacked.',
            category: 'military',
            special: 'Ultimate military supremacy with population unrest',
            pollutionProduction: 0
        };
        
        // World Forum Wonders
        this.wonderTypes.internet = {
            name: 'Global Internet Network',
            description: 'Advanced communication network enabling participation in world affairs voting',
            maxCount: 1,
            cost: { money: 60000000 },
            techRequired: 1500,
            resources: { 'bronze-manufactured': 1000, 'lead-manufactured': 500, 'copper-manufactured': 500, 'steel-manufactured': 500, 'aluminum-manufactured': 500, 'gasoline-manufactured': 500, 'uranium-manufactured': 500 },
            effect: 'Allows voting on world affairs in World Forum (edicts and global policies), requires Broadcasting Network',
            category: 'infrastructure',
            special: 'Enables participation in global World Forum decisions beyond color politics',
            requires: 'broadcasting' // Requires Broadcasting project
        };

        // Food and Water Wonders - require 5 stacked farms/wells to work
        this.wonderTypes.abundanceTemple = {
            name: 'Temple of Abundance',
            description: 'Ancient temple that blesses your nation with endless food production. Requires 5 farms to be built to channel its power.',
            maxCount: 1,
            cost: { money: 250000000 }, // $250M - ALOT of money
            techRequired: 2500,
            resources: { 'bronze-manufactured': 1500, 'lead-manufactured': 750, 'copper-manufactured': 750, 'steel-manufactured': 750, 'aluminum-manufactured': 750, 'gasoline-manufactured': 750, 'uranium-manufactured': 750 },
            effect: 'Provides food for ALL nation population regardless of size, but requires 5 farms to be built to function',
            category: 'infrastructure',
            special: 'Requires 5 farms built. If farms drop below 5, wonder becomes inactive.',
            requires: 'farm' // Requires 5 farms
        };

        this.wonderTypes.aqueductOfLife = {
            name: 'Aqueduct of Life',
            description: 'Mighty aqueduct that brings pure water to every citizen. Requires 5 wells to be built to channel its power.',
            maxCount: 1,
            cost: { money: 250000000 }, // $250M - ALOT of money
            techRequired: 2500,
            resources: { 'bronze-manufactured': 1500, 'lead-manufactured': 750, 'copper-manufactured': 750, 'steel-manufactured': 750, 'aluminum-manufactured': 750, 'gasoline-manufactured': 750, 'uranium-manufactured': 750 },
            effect: 'Provides water for ALL nation population regardless of size, but requires 5 wells to be built to function',
            category: 'infrastructure',
            special: 'Requires 5 wells built. If wells drop below 5, wonder becomes inactive.',
            requires: 'well' // Requires 5 wells
        };

        // ─── Pollution Reduction Wonders (Set 1: Urban Greenbelt & Civic Nature) ───
        this.wonderTypes.nationalParksSystem = {
            name: 'National Parks System',
            description: 'Doubles park pollution reduction (-75 → -150 per park) and adds environment bonus.',
            maxCount: 1,
            cost: { money: 90000000 }, // $90M
            techRequired: 1500,
            resources: { 'bronze-manufactured': 1500, 'lead-manufactured': 750, 'copper-manufactured': 750, 'steel-manufactured': 750, 'aluminum-manufactured': 750, 'gasoline-manufactured': 750, 'uranium-manufactured': 750 },
            effect: 'Doubles park pollution reduction (-75 → -150 each); +1 environment per park',
            category: 'infrastructure',
            special: 'Stacks with Park Expansion Program project',
            pollutionReduction: 0
        };

        this.wonderTypes.ancientForestPreserve = {
            name: 'Ancient Forest Preserve',
            description: 'Doubles tree plantation pollution reduction (-150 → -300 per plantation) and adds environment bonus.',
            maxCount: 1,
            cost: { money: 90000000 }, // $90M
            techRequired: 2000,
            resources: { 'bronze-manufactured': 1500, 'lead-manufactured': 750, 'copper-manufactured': 750, 'steel-manufactured': 750, 'aluminum-manufactured': 750, 'gasoline-manufactured': 750, 'uranium-manufactured': 750 },
            effect: 'Doubles tree plantation pollution reduction (-150 → -300 each); +1 environment per plantation',
            category: 'infrastructure',
            special: 'Stacks with Arboretum Initiative project',
            pollutionReduction: 0
        };

        // ─── Pollution Reduction Wonders (Set 2: Industrial Filtration & Waste Management) ───
        this.wonderTypes.carbonSequestrationFacility = {
            name: 'Carbon Sequestration Facility',
            description: 'Large-scale underground carbon storage.',
            maxCount: 1,
            cost: { money: 100000000 }, // $100M
            techRequired: 1800,
            resources: { 'bronze-manufactured': 2000, 'lead-manufactured': 1000, 'steel-manufactured': 1000, 'uranium-manufactured': 500 },
            effect: '-600 flat pollution reduction',
            category: 'infrastructure',
            special: 'Major flat pollution reduction',
            pollutionReduction: 600
        };

        this.wonderTypes.atmosphericFiltrationDome = {
            name: 'Atmospheric Filtration Dome',
            description: 'City-wide air purification network.',
            maxCount: 1,
            cost: { money: 110000000 }, // $110M
            techRequired: 2000,
            resources: { 'bronze-manufactured': 2000, 'lead-manufactured': 1000, 'steel-manufactured': 1000, 'aluminum-manufactured': 1000, 'gasoline-manufactured': 1000, 'uranium-manufactured': 1000 },
            effect: '-700 flat pollution reduction',
            category: 'infrastructure',
            special: 'Highest flat pollution reduction of any wonder',
            pollutionReduction: 700
        };

        // ─── Pollution Reduction Wonders (Set 3: Regulatory & Civic Programs) ───
        this.wonderTypes.greenTechnologyInstitute = {
            name: 'Green Technology Institute',
            description: 'Cuts laboratory pollution by half.',
            maxCount: 1,
            cost: { money: 80000000 }, // $80M
            techRequired: 1600,
            resources: { 'bronze-manufactured': 1500, 'aluminum-manufactured': 1000, 'uranium-manufactured': 500 },
            effect: '-50% pollution from Research Laboratories',
            category: 'science',
            special: 'Halves Research Lab pollution (+5 → +2.5 per lab)',
            pollutionReduction: 0
        };

        this.wonderTypes.globalClimateAccord = {
            name: 'Global Climate Accord Signatory',
            description: 'International commitment to reduce all pollution sources.',
            maxCount: 1,
            cost: { money: 120000000 }, // $120M
            techRequired: 2200,
            resources: { 'bronze-manufactured': 2000, 'steel-manufactured': 1500, 'aluminum-manufactured': 1500, 'uranium-manufactured': 1000 },
            effect: '-10% pollution from all sources',
            category: 'administration',
            special: 'Percentage-based reduction applied after flat reductions',
            pollutionReduction: 0
        };

        this.wonderTypes.zeroEmissionZone = {
            name: 'Zero Emission Zone',
            description: 'Designated clean-air urban district.',
            maxCount: 1,
            cost: { money: 150000000 }, // $150M
            techRequired: 2400,
            resources: { 'bronze-manufactured': 2500, 'steel-manufactured': 2000, 'aluminum-manufactured': 2000, 'uranium-manufactured': 1000 },
            effect: '-300 flat pollution removal + removes Harbor and Airforce Base pollution',
            category: 'infrastructure',
            special: 'Removes all pollution from Harbor and Airforce Base improvements',
            pollutionReduction: 300
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
        if (!EventBus) return;
        EventBus.on('build_wonder', this.buildWonder, this);
        EventBus.on('demolish_wonder', this.demolishWonder, this);
        EventBus.on('get_wonder_info', this.getWonderInfo, this);
    }
    
    /**
     * Build a wonder
     */
    buildWonder(data) {
        const { wonderType, nation } = data || {};
        
        if (!nation) {
            console.warn('build_wonder: missing nation');
            return false;
        }
        
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
            // Check if it's a project prerequisite (like 'broadcasting', 'missileSilo', etc.)
            if (nation.projects?.[wonder.requires] && nation.projects[wonder.requires] > 0) {
                // Project prerequisite met
            }
            // Check if it's a wonder prerequisite (like 'nuclearWarheadFacility')
            else if (nation.wonders?.[wonder.requires] && nation.wonders[wonder.requires] > 0) {
                // Wonder prerequisite met
            }
            // Check if it's an improvement prerequisite (like 'farm', 'well', etc.)
            else if (nation.improvements?.[wonder.requires] && nation.improvements[wonder.requires] >= 5) {
                // Improvement prerequisite met (requires 5 built)
            }
            else {
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
        if (!nation || !wonder || !wonder.cost) return false;
        if (nation.money == null || nation.money < wonder.cost.money) return false;
        if (wonder.resources) {
            for (const [resourceKey, amount] of Object.entries(wonder.resources)) {
                const [resource, stage] = resourceKey.includes('-') ? resourceKey.split('-') : [resourceKey, null];
                const has = stage
                    ? (nation.resources?.[resource]?.[stage] || 0)
                    : (nation.resources?.[resource] || 0);
                if (has < amount) return false;
            }
        }
        return true;
    }

    /**
     * Pay for wonder cost
     */
    payWonderCost(nation, wonder) {
        if (!nation || !wonder || !wonder.cost) return;
        nation.money = (nation.money || 0) - wonder.cost.money;
        if (wonder.resources) {
            for (const [resourceKey, amount] of Object.entries(wonder.resources)) {
                const [resource, stage] = resourceKey.includes('-') ? resourceKey.split('-') : [resourceKey, null];
                if (stage) {
                    nation.resources[resource][stage] = (nation.resources[resource]?.[stage] || 0) - amount;
                } else {
                    nation.resources[resource] = (nation.resources[resource] || 0) - amount;
                }
            }
        }
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
        const nation = this.getNation(nationId);
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

            case 'great_library':
                nation.wonderEffects.greatLibraryActive = true;
                nation.wonderEffects.greatLibrarySchoolLiteracyBonus = 0.025; // +2.5% literacy per school
                nation.wonderEffects.greatLibraryUniversityTechReduction = 0.025; // -2.5% tech cost per university
                
                // Recompute school literacy bonuses with Great Library bonus (+2.5% per school)
                if (nation.improvements && nation.improvements.school > 0) {
                    const schoolCount = nation.improvements.school;
                    if (!nation.improvementEffects) nation.improvementEffects = {};
                    const baseSchoolBonus = schoolCount * 0.075;
                    const greatLibraryBonus = schoolCount * 0.025;
                    nation.improvementEffects.literacyBonus = baseSchoolBonus + greatLibraryBonus;
                }
                
                // Recompute university tech cost reduction with Great Library bonus
                const universityCount = nation.projects?.university || 0;
                if (universityCount > 0) {
                    nation.projectEffects.greatLibraryUniversityBonus = universityCount * 0.025;
                    // Recompute total tech cost reduction
                    nation.projectEffects.techCostReduction = (
                        (nation.projectEffects.baseTechCostReduction || 0) +
                        nation.projectEffects.greatLibraryUniversityBonus +
                        (nation.projectEffects.advancedUniversityTechReduction || 0)
                    );
                }
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
                nation.wonderEffects.pollutionProduction = (nation.wonderEffects.pollutionProduction || 0) + count * 50;
                if (!nation.military) nation.military = {};
                if (!nation.military.nukes) nation.military.nukes = 0;
                break;
                
            case 'enhancedNuclearWarheads':
                nation.wonderEffects.enhancedNuclearProduction = true;
                nation.wonderEffects.nuclearProductionRate = 2;
                nation.wonderEffects.nuclearStorageCapacity = 5;
                nation.wonderEffects.pollutionProduction = (nation.wonderEffects.pollutionProduction || 0) + count * 100;
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
                
            case 'footballStadium':
                nation.wonderEffects.footballTeamUnlocked = true;
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
                nation.wonderEffects.pollutionProduction = (nation.wonderEffects.pollutionProduction || 0) + count * 0;
                this.applySupremeMilitaryEffects(nation);
                break;
                
            case 'internet':
                nation.wonderEffects.globalVotingEnabled = true;
                nation.wonderEffects.worldAffairsAccess = true;
                nation.wonderEffects.pollutionProduction = (nation.wonderEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'abundanceTemple':
                // Check if 5 farms are built
                const farmCount = nation.improvements?.farm || 0;
                if (farmCount >= 5) {
                    nation.wonderEffects.abundanceTempleActive = true;
                    nation.wonderEffects.foodIndependence = true;
                } else {
                    nation.wonderEffects.abundanceTempleActive = false;
                    delete nation.wonderEffects.foodIndependence;
                    console.warn('Temple of Abundance requires 5 farms to function');
                }
                
                // Give +5 happiness if both farm projects are built
                if (nation.projectEffects?.farmDoubling && nation.projectEffects?.farmMaxStackBonus100) {
                    nation.wonderEffects.abundanceTempleHappinessBonus = 5;
                } else {
                    nation.wonderEffects.abundanceTempleHappinessBonus = 0;
                }
                nation.wonderEffects.pollutionProduction = (nation.wonderEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'aqueductOfLife':
                // Check if 5 wells are built
                const wellCount = nation.improvements?.well || 0;
                if (wellCount >= 5) {
                    nation.wonderEffects.aqueductOfLifeActive = true;
                    nation.wonderEffects.waterIndependence = true;
                } else {
                    nation.wonderEffects.aqueductOfLifeActive = false;
                    delete nation.wonderEffects.waterIndependence;
                    console.warn('Aqueduct of Life requires 5 wells to function');
                }
                
                // Give +5 happiness if both well projects are built
                if (nation.projectEffects?.wellDoubling && nation.projectEffects?.wellMaxStackBonus100) {
                    nation.wonderEffects.aqueductOfLifeHappinessBonus = 5;
                } else {
                    nation.wonderEffects.aqueductOfLifeHappinessBonus = 0;
                }
                nation.wonderEffects.pollutionProduction = (nation.wonderEffects.pollutionProduction || 0) + count * 0;
                break;

            // ─── Pollution Reduction Wonder Effects (Set 1: Urban Greenbelt & Civic Nature) ───
            case 'nationalParksSystem':
                nation.wonderEffects.nationalParksSystem = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 0;
                break;
                
            case 'ancientForestPreserve':
                nation.wonderEffects.ancientForestPreserve = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 0;
                break;

            // ─── Pollution Reduction Wonder Effects (Set 2: Industrial Filtration & Waste Management) ───
            case 'carbonSequestrationFacility':
                nation.wonderEffects.carbonSequestrationFacility = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 600;
                break;
                
            case 'atmosphericFiltrationDome':
                nation.wonderEffects.atmosphericFiltrationDome = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 700;
                break;

            // ─── Pollution Reduction Wonder Effects (Set 3: Regulatory & Civic Programs) ───
            case 'greenTechnologyInstitute':
                nation.wonderEffects.greenTechnologyInstitute = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 0;
                break;
                
            case 'globalClimateAccord':
                nation.wonderEffects.globalClimateAccord = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 0;
                break;
                
            case 'zeroEmissionZone':
                nation.wonderEffects.zeroEmissionZone = true;
                nation.wonderEffects.pollutionReduction = (nation.wonderEffects.pollutionReduction || 0) + count * 300;
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
        if (!nation.improvements) return;
        
        const militaryImprovements = ['barracks', 'factory', 'airforceBase', 'harbor'];
        let maxedCount = 0;
        let happinessPenalty = 0;
        
        // Reset all supreme military bonuses first (prevents stale bonuses when improvements are demolished)
        nation.wonderEffects.supremeSoldierBonus = 0;
        nation.wonderEffects.supremeTankBonus = 0;
        nation.wonderEffects.supremeAircraftBonus = 0;
        nation.wonderEffects.supremeShipBonus = 0;
        nation.wonderEffects.supremeMilitaryHappinessPenalty = 0;
        
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
        
        // Only apply wonder bonus and happiness penalty if at least one improvement is maxed
        if (maxedCount > 0) {
            nation.wonderEffects.supremeMilitaryBonus = true;
            nation.wonderEffects.supremeMilitaryHappinessPenalty = happinessPenalty;
            
            // Supreme Military doubles pollution from maxed military improvements
            militaryImprovements.forEach(improvement => {
                const count = nation.improvements[improvement] || 0;
                if (count >= 5) {
                    switch(improvement) {
                        case 'barracks':
                            nation.wonderEffects.supremeSoldierPollutionDouble = true;
                            break;
                        case 'factory':
                            nation.wonderEffects.supremeTankPollutionDouble = true;
                            break;
                        case 'airforceBase':
                            nation.wonderEffects.supremeAircraftPollutionDouble = true;
                            break;
                        case 'harbor':
                            nation.wonderEffects.supremeShipPollutionDouble = true;
                            break;
                    }
                }
            });
        } else {
            nation.wonderEffects.supremeMilitaryBonus = false;
            nation.wonderEffects.supremeMilitaryHappinessPenalty = 0;
            nation.wonderEffects.supremeSoldierPollutionDouble = false;
            nation.wonderEffects.supremeTankPollutionDouble = false;
            nation.wonderEffects.supremeAircraftPollutionDouble = false;
            nation.wonderEffects.supremeShipPollutionDouble = false;
        }
    }
    
    /**
     * Get wonder information
     */
    getWonderInfo(data) {
        const { wonderType, nation } = data || {};
        
        if (!this.wonderTypes[wonderType]) {
            return null;
        }
        
        const wonder = this.wonderTypes[wonderType];
        
        let meetsPrerequisite = true;
        if (wonder.requires && nation) {
            // Check if it's a project prerequisite
            if (nation.projects?.[wonder.requires] && nation.projects[wonder.requires] > 0) {
                meetsPrerequisite = true;
            }
            // Check if it's a wonder prerequisite
            else if (nation.wonders?.[wonder.requires] && nation.wonders[wonder.requires] > 0) {
                meetsPrerequisite = true;
            }
            // Check if it's an improvement prerequisite (requires 5 built)
            else if (nation.improvements?.[wonder.requires] && nation.improvements[wonder.requires] >= 5) {
                meetsPrerequisite = true;
            }
            else {
                meetsPrerequisite = false;
            }
        }
        
        return {
            ...wonder,
            canAfford: nation ? this.canAffordWonder(nation, wonder) : false,
            currentCount: nation ? this.getWonderCount(nation, wonderType) : 0,
            meetsTechRequirement: nation ? nation.tech >= wonder.techRequired : false,
            meetsPrerequisite: meetsPrerequisite
        };
    }
    
    /**
     * Demolish wonder
     */
    demolishWonder(data) {
        const { wonderType, nation } = data || {};
        
        if (!nation) {
            console.warn('demolish_wonder: missing nation');
            return false;
        }
        
        if (!nation.wonders?.[wonderType] || nation.wonders[wonderType] <= 0) {
            console.warn(`No ${wonderType} to demolish`);
            return false;
        }
        
        const wonderCountBefore = nation.wonders[wonderType];
        
        nation.wonders[wonderType]--;
        
        // Calculate resource recovery if salvage yard exists
        let recoveredResources = {};
        if (nation.projectEffects?.resourceRecovery && wonder.cost) {
            const recoveryRate = nation.wonderEffects?.wonderRecoveryRate || 
                               nation.projectEffects.projectRecoveryRate || 0.10;
            
            // Recover money
            if (wonder.cost?.money) {
                const recoveredMoney = Math.floor(wonder.cost.money * recoveryRate);
                recoveredResources.money = recoveredMoney;
                nation.money = (nation.money || 0) + recoveredMoney;
            }
            
            // Recover resources (staged compound keys)
            if (wonder.resources) {
                for (const [resourceKey, amount] of Object.entries(wonder.resources)) {
                    const [resource, stage] = resourceKey.includes('-') ? resourceKey.split('-') : [resourceKey, null];
                    const recoveredAmount = Math.floor(amount * recoveryRate);
                    if (recoveredAmount > 0) {
                        recoveredResources[resourceKey] = recoveredAmount;
                        if (stage) {
                            nation.resources[resource][stage] = (nation.resources[resource]?.[stage] || 0) + recoveredAmount;
                        } else {
                            nation.resources[resource] = (nation.resources[resource] || 0) + recoveredAmount;
                        }
                    }
                }
            }
        }
        
        if (nation.wonders[wonderType] <= 0) {
            this.removeWonderEffects(nation, wonderType, wonderCountBefore);
        }
        
        EventBus.emit('wonder_demolished', {
            type: wonderType,
            count: nation.wonders[wonderType],
            recoveredResources: recoveredResources,
            nation: nation
        });
        
        return true;
    }
    
    /**
     * Remove wonder effects when demolished
     */
    removeWonderEffects(nation, wonderType, wonderCountBefore) {
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

            case 'great_library':
                delete nation.wonderEffects.greatLibraryActive;
                delete nation.wonderEffects.greatLibrarySchoolLiteracyBonus;
                delete nation.wonderEffects.greatLibraryUniversityTechReduction;
                
                // Recompute university tech cost reduction without Great Library bonus
                nation.projectEffects.greatLibraryUniversityBonus = 0;
                nation.projectEffects.techCostReduction = (
                    (nation.projectEffects.baseTechCostReduction || 0) +
                    (nation.projectEffects.greatLibraryUniversityBonus || 0) +
                    (nation.projectEffects.advancedUniversityTechReduction || 0)
                );
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
                
            case 'militaryRecovery':
                delete nation.wonderEffects.militaryRecoveryEnabled;
                delete nation.wonderEffects.enhancedSalvageRate;
                delete nation.wonderEffects.soldierLossReduction;
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
                // Remove pollution added by this wonder
                nation.wonderEffects.pollutionProduction = Math.max(0, (nation.wonderEffects.pollutionProduction || 0) - wonderCountBefore * 50);
                break;
                
            case 'enhancedNuclearWarheads':
                delete nation.wonderEffects.enhancedNuclearProduction;
                // Remove pollution added by this wonder
                nation.wonderEffects.pollutionProduction = Math.max(0, (nation.wonderEffects.pollutionProduction || 0) - wonderCountBefore * 100);
                // Revert to base nuclear facility stats if base wonder still exists
                if (nation.wonders?.nuclearWarheadFacility > 0) {
                    nation.wonderEffects.nuclearProductionRate = 1;
                    nation.wonderEffects.nuclearStorageCapacity = 3;
                } else {
                    delete nation.wonderEffects.nuclearProductionRate;
                    delete nation.wonderEffects.nuclearStorageCapacity;
                }
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
                
            case 'footballStadium':
                delete nation.wonderEffects.footballTeamUnlocked;
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
                delete nation.wonderEffects.supremeSoldierPollutionDouble;
                delete nation.wonderEffects.supremeTankPollutionDouble;
                delete nation.wonderEffects.supremeAircraftPollutionDouble;
                delete nation.wonderEffects.supremeShipPollutionDouble;
                break;
                
            case 'internet':
                delete nation.wonderEffects.globalVotingEnabled;
                delete nation.wonderEffects.worldAffairsAccess;
                break;
                
            case 'abundanceTemple':
                delete nation.wonderEffects.abundanceTempleActive;
                delete nation.wonderEffects.foodIndependence;
                delete nation.wonderEffects.abundanceTempleHappinessBonus;
                break;
                
            case 'aqueductOfLife':
                delete nation.wonderEffects.aqueductOfLifeActive;
                delete nation.wonderEffects.waterIndependence;
                delete nation.wonderEffects.aqueductOfLifeHappinessBonus;
                break;

            // ─── Pollution Reduction Wonder Effect Removal (Set 1: Urban Greenbelt & Civic Nature) ───
            case 'nationalParksSystem':
                delete nation.wonderEffects.nationalParksSystem;
                break;
                
            case 'ancientForestPreserve':
                delete nation.wonderEffects.ancientForestPreserve;
                break;

            // ─── Pollution Reduction Wonder Effect Removal (Set 2: Industrial Filtration & Waste Management) ───
            case 'carbonSequestrationFacility':
                delete nation.wonderEffects.carbonSequestrationFacility;
                nation.wonderEffects.pollutionReduction = Math.max(0, (nation.wonderEffects.pollutionReduction || 0) - wonderCountBefore * 600);
                break;
                
            case 'atmosphericFiltrationDome':
                delete nation.wonderEffects.atmosphericFiltrationDome;
                nation.wonderEffects.pollutionReduction = Math.max(0, (nation.wonderEffects.pollutionReduction || 0) - wonderCountBefore * 700);
                break;

            // ─── Pollution Reduction Wonder Effect Removal (Set 3: Regulatory & Civic Programs) ───
            case 'greenTechnologyInstitute':
                delete nation.wonderEffects.greenTechnologyInstitute;
                break;
                
            case 'globalClimateAccord':
                delete nation.wonderEffects.globalClimateAccord;
                break;
                
            case 'zeroEmissionZone':
                delete nation.wonderEffects.zeroEmissionZone;
                nation.wonderEffects.pollutionReduction = Math.max(0, (nation.wonderEffects.pollutionReduction || 0) - wonderCountBefore * 300);
                break;
        }
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
            
            let meetsPrerequisite = true;
            if (wonder.requires) {
                // Check if it's a project prerequisite
                if (nation.projects?.[wonder.requires] && nation.projects[wonder.requires] > 0) {
                    meetsPrerequisite = true;
                }
                // Check if it's a wonder prerequisite
                else if (nation.wonders?.[wonder.requires] && nation.wonders[wonder.requires] > 0) {
                    meetsPrerequisite = true;
                }
                // Check if it's an improvement prerequisite (requires 5 built)
                else if (nation.improvements?.[wonder.requires] && nation.improvements[wonder.requires] >= 5) {
                    meetsPrerequisite = true;
                }
                else {
                    meetsPrerequisite = false;
                }
            }
            
            wonders[type] = {
                ...wonder,
                count: this.getWonderCount(nation, type),
                canAfford: this.canAffordWonder(nation, wonder),
                isMaxed: this.getWonderCount(nation, type) >= wonder.maxCount,
                meetsTechRequirement: nation.tech >= wonder.techRequired,
                meetsPrerequisite: meetsPrerequisite
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
        
        // Recalculate food/water wonder effects if wonders are active
        if (nation.wonders?.abundanceTemple > 0) {
            this.applyWonderEffects(nation, 'abundanceTemple');
        }
        if (nation.wonders?.aqueductOfLife > 0) {
            this.applyWonderEffects(nation, 'aqueductOfLife');
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
        nation.statistics.nukeHits = (nation.statistics.nukeHits || 0) + 1;
        nation.statistics.nukeLaunches = (nation.statistics.nukeLaunches || 0) + 1;
        
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
        
        if (EventBus) {
            EventBus.off('build_wonder', this.buildWonder, this);
            EventBus.off('demolish_wonder', this.demolishWonder, this);
            EventBus.off('get_wonder_info', this.getWonderInfo, this);
        }
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WondersSystem;
} else {
    window.WondersSystem = WondersSystem;
}