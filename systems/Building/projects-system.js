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
                cost: { money: 8000000 },
                techRequired: 500,
                resources: { 'steel-manufactured': 100, 'bronze-manufactured': 300 },
                effect: 'Produces 1 missile per day, stores up to 5 missiles per silo. +50 pollution per silo.',
                category: 'military',
                special: 'Each silo can produce and store 5 missiles',
                pollutionProduction: 50
            },
            
            ironCurtain: {
                name: 'Iron Curtain Defense System',
                description: 'Missile defense system with interception capability',
                maxCount: 3,
                cost: { money: 12000000 },
                techRequired: 500,
                resources: { 'gasoline-manufactured': 100, 'lead-manufactured': 150 },
                effect: '11% chance to intercept incoming missiles per system (max 33%). +50 pollution per system.',
                category: 'military',
                special: 'Stacks to maximum 33% missile interception rate',
                pollutionProduction: 50
            },
            nuclearShield: {
                name: 'Nuclear Shield Defense System',
                description: 'Nuclear defense system with interception capability',
                maxCount: 3,
                cost: { money: 20000000 },
                techRequired: 1000,
                resources: { 'uranium-manufactured': 200, 'aluminum-manufactured': 150 },
                effect: '11% chance to intercept incoming nuclear missiles per system (max 33%). +50 pollution per system.',
                category: 'military',
                special: 'Stacks to maximum 33% nuclear interception rate',
                pollutionProduction: 50
            },
            
            commandCenter: {
                name: 'Military Command Center',
                description: 'Advanced military coordination facility',
                maxCount: 3,
                cost: { money: 9000000 },
                techRequired: 750,
                resources: { 'steel-manufactured': 75, 'bronze-manufactured': 250 },
                effect: '+1 offensive & defensive war slot per center (base 2 slots)',
                category: 'military',
                special: 'Increases simultaneous war capacity',
                pollutionProduction: 0
            },
            
            militaryAcademy: {
                name: 'Advanced Military Academy',
                description: 'Elite military training facility for larger armies',
                maxCount: 1,
                cost: { money: 28000000 },
                techRequired: 1500,
                resources: { 'steel-manufactured': 100, 'gasoline-manufactured': 100 },
                effect: 'Increases maximum military unit percentages significantly',
                category: 'military',
                special: 'Soldiers: 30% (was 20%), Tanks: 20% (was 10%), Aircraft: 10% (was 7.5%), Ships: 7.5% (was 5%)',
                pollutionProduction: 0
            },
            
            university: {
                name: 'National University',
                description: 'Advanced education and research institution',
                maxCount: 3,
                cost: { money: 10000000 },
                techRequired: 500,
                resources: { 'steel-manufactured': 100, 'lead-manufactured': 100 },
                effect: '+10% literacy rate, +3 happiness, -5% tech costs per university',
                category: 'education',
                special: 'Stacking benefits up to 3 universities',
                pollutionProduction: 0
            },
            
            advancedUniversity: {
                name: 'Advanced University',
                description: 'A postgraduate institution supporting the Great Library. Reduces tech costs by 3.33% per National University (max 10% with 3 universities).',
                maxCount: 1,
                cost: { money: 20000000 },
                techRequired: 600,
                requires: 'university',
                requireCount: 1,
                resources: { 'aluminum-manufactured': 100, 'gasoline-manufactured': 100 },
                effect: 'Reduces tech costs by 3.33% per National University (up to 10% with 3). Prerequisite for the Great Library.',
                category: 'education',
                pollutionProduction: 0
            },

            ambulanceHub: {
                name: 'Emergency Medical Hub',
                description: 'Advanced emergency medical response center',
                maxCount: 3,
                cost: { money: 6000000 },
                techRequired: 500,
                resources: { 'copper-manufactured': 100, 'aluminum-manufactured': 100 },
                effect: '-10% disease rate, +5 happiness per hub',
                category: 'healthcare',
                special: 'Reduces disease and increases happiness',
                pollutionProduction: 0
            },
            
            governmentStatue: {
                name: 'Government Monument',
                description: 'Permanent government choice with eternal population approval',
                maxCount: 1,
                cost: { money: 32000000 },
                techRequired: 1000,
                resources: { 'steel-manufactured': 125, 'gasoline-manufactured': 125 },
                effect: 'Locks government choice forever, population always approves',
                category: 'administration',
                special: 'PERMANENT - Cannot be demolished once built!',
                permanent: true,
                pollutionProduction: 0
            },
            
            religiousStatue: {
                name: 'Religious Monument',
                description: 'Permanent religion choice with eternal population approval',
                maxCount: 1,
                cost: { money: 32000000 },
                techRequired: 1000,
                resources: { 'steel-manufactured': 125, 'gasoline-manufactured': 125 },
                effect: 'Locks religion choice forever, population always approves',
                category: 'administration',
                special: 'PERMANENT - Cannot be demolished once built!',
                permanent: true,
                pollutionProduction: 0
            },
            
            spyOperations: {
                name: 'Intelligence Operations Center',
                description: 'Covert operations and espionage facility',
                maxCount: 5,
                cost: { money: 11000000 },
                techRequired: 750,
                resources: { 'copper-manufactured': 150, 'lead-manufactured': 150, 'uranium-manufactured': 150 },
                effect: 'Produces 3 spies per day, holds up to 10 spies per center. +50 pollution per center.',
                category: 'military',
                special: 'Each center can store 10 spies and produces 3 daily',
                pollutionProduction: 50
            },
            
            swatPolice: {
                name: 'SWAT Operations Center',
                description: 'Elite law enforcement tactical unit',
                maxCount: 3,
                cost: { money: 8000000 },
                techRequired: 750,
                resources: { 'steel-manufactured': 75, 'bronze-manufactured': 200 },
                effect: '-15% crime rate, +2 happiness per center',
                category: 'security',
                special: 'Enhanced crime reduction beyond regular police stations',
                pollutionProduction: 0
            },
            
            advancedResearch: {
                name: 'Advanced Research Institute',
                description: 'Enhances Research Laboratories: increases research income from 2.5% to 3.5% of net income per lab (4 labs max = 14% total). Adds +1 pollution and +1 disease per lab.',
                maxCount: 1,
                cost: { money: 15000000 },
                techRequired: 1000,
                resources: { 'aluminum-manufactured': 100, 'uranium-manufactured': 100 },
                effect: 'Labs give 3.5% income to research each (14% total with 4 labs). +1 pollution and +1 disease per lab.',
                category: 'science',
                special: 'Enhances Research Laboratory output and adds pollution/disease per lab',
                pollutionProduction: 0
            },
            
            enhancedPolice: {
                name: 'Advanced Police Stations',
                description: 'Enhanced law enforcement facilities with improved crime control',
                maxCount: 3,
                cost: { money: 8000000 },
                techRequired: 800,
                resources: { 'steel-manufactured': 75, 'bronze-manufactured': 200 },
                effect: '-10% crime rate, +2 happiness per center',
                category: 'infrastructure',
                special: 'Advanced crime reduction and public safety',
                pollutionProduction: 0
            },
            
            sportsBetting: {
                name: 'Sports Betting Complex',
                description: 'Legal gambling and entertainment facility',
                maxCount: 1,
                cost: { money: 15000000 },
                techRequired: 600,
                resources: { 'copper-manufactured': 200, 'bronze-manufactured': 400 },
                effect: '+33% taxable income but +33% crime rate. +200 pollution.',
                category: 'economic',
                special: 'Major economic boost with significant social costs',
                pollutionProduction: 200
            },
            
            enhancedBarracks: {
                name: 'Elite Military Training Program',
                description: 'Advanced training that boosts soldier effectiveness',
                maxCount: 1,
                cost: { money: 20000000 },
                techRequired: 750,
                resources: { 'steel-manufactured': 100, 'gasoline-manufactured': 100 },
                effect: 'Doubles barracks effectiveness bonus (from 10% to 20% per barracks). +75 pollution.',
                category: 'military',
                special: 'Elite soldier training and conditioning program',
                pollutionProduction: 75
            },
            
            enhancedFactories: {
                name: 'Advanced Tank Manufacturing',
                description: 'Improved production techniques for superior tanks',
                maxCount: 1,
                cost: { money: 26000000 },
                techRequired: 1000,
                resources: { 'steel-manufactured': 100, 'lead-manufactured': 100 },
                effect: 'Doubles factory effectiveness bonus (from 10% to 20% per factory). +150 pollution.',
                category: 'military',
                special: 'Next-generation armored vehicle production',
                pollutionProduction: 150
            },
            
            enhancedAirforces: {
                name: 'Advanced Aircraft Systems',
                description: 'Cutting-edge aerospace technology and pilot training',
                maxCount: 1,
                cost: { money: 32000000 },
                techRequired: 1250,
                resources: { 'aluminum-manufactured': 100, 'gasoline-manufactured': 100 },
                effect: 'Doubles airforce base effectiveness bonus (from 10% to 20% per base). +225 pollution.',
                category: 'military',
                special: 'Superior aircraft and pilot capabilities',
                pollutionProduction: 225
            },
            
            enhancedNavy: {
                name: 'Advanced Naval Operations',
                description: 'Modern naval technology and fleet tactics',
                maxCount: 1,
                cost: { money: 28000000 },
                techRequired: 1100,
                resources: { 'steel-manufactured': 125, 'gasoline-manufactured': 125 },
                effect: 'Doubles harbor effectiveness bonus (from 10% to 20% per harbor). +300 pollution.',
                category: 'military',
                special: 'State-of-the-art naval warfare capabilities',
                pollutionProduction: 300
            },
            
            broadcasting: {
                name: 'National Broadcasting Network',
                description: 'Enables participation in World Forum color-based voting and Congress eligibility',
                maxCount: 1,
                cost: { money: 10000000 },
                techRequired: 300,
                resources: { 'bronze-manufactured': 100, 'copper-manufactured': 50, 'aluminum-manufactured': 50, 'lead-manufactured': 50, 'steel-manufactured': 50, 'uranium-manufactured': 50, 'gasoline-manufactured': 50 },
                effect: 'Allows voting on color motions in World Forum and eligibility for Congress seats',
                category: 'infrastructure',
                special: 'Does NOT occupy a project slot but activates project cooldown',
                doesNotOccupySlot: true,
                pollutionProduction: 0
            },
            
            financialAssistanceOffice: {
                name: 'Financial Assistance Office',
                description: 'Enables sending monetary and technological aid to allied nations',
                maxCount: 1,
                cost: { money: 15000000 },
                techRequired: 800,
                resources: { 'bronze-manufactured': 200, 'copper-manufactured': 50, 'steel-manufactured': 50 },
                effect: 'Allows sending cash and tech through foreign aid, enhances Intelligence Pacts',
                category: 'diplomacy',
                special: '3 aid slots, 7 days proposal time, 3 days acceptance window',
                pollutionProduction: 0
            },
            
            officeOfRelationships: {
                name: 'Office of Relationships',
                description: 'Enables modification of diplomatic relationships',
                maxCount: 1,
                cost: { money: 13000000 },
                techRequired: 500,
                resources: { 'bronze-manufactured': 500, 'uranium-manufactured': 250 },
                effect: 'Allows changing friends, best friends, foes, and nemesis',
                category: 'diplomacy',
                special: 'Makes diplomatic relationships changeable',
                pollutionProduction: 0
            },
            enhancedRecycling: {
                name: 'Advanced Recycling Operations',
                description: 'Doubles recycling center effectiveness but reduces happiness',
                maxCount: 1,
                cost: { money: 20000000 },
                techRequired: 800,
                resources: { 'lead-manufactured': 100, 'aluminum-manufactured': 100, 'steel-manufactured': 100 },
                effect: 'Doubles recycling center pollution reduction (-300 → -600 each), but each recycling center reduces happiness by 1',
                category: 'infrastructure',
                special: 'Enhanced environmental protection with social costs',
                pollutionReduction: 0
            },
            
            // Food and Water enhancement projects
            advancedAgriculture: {
                name: 'Advanced Agriculture',
                description: 'Doubles the population covered by each farm (from 1M to 2M per farm)',
                maxCount: 1,
                cost: { money: 10000000 }, // $10M
                techRequired: 800,
                resources: { 'steel-manufactured': 250, 'gasoline-manufactured': 250 },
                effect: 'Each farm now covers 2,000,000 population instead of 1,000,000',
                category: 'infrastructure',
                special: 'Requires 5 farms to be built before this project can be selected',
                requires: 'farm', // Requires 5 farms built
                pollutionProduction: 0
            },
            
            farmSynergy: {
                name: 'Farm Synergy',
                description: 'Doubles the maximum stack bonus from 50% to 100% when 5 farms are built',
                maxCount: 1,
                cost: { money: 15000000 }, // $15M
                techRequired: 1000,
                resources: { 'bronze-manufactured': 600, 'aluminum-manufactured': 250 },
                effect: 'When 5 farms are built, the stack bonus increases from 50% to 100% (5M becomes 10M with doubling, or 7.5M base)',
                category: 'infrastructure',
                special: 'Requires 5 farms to be built before this project can be selected',
                requires: 'farm', // Requires 5 farms built
                pollutionProduction: 0
            },
            
            advancedWellDrilling: {
                name: 'Advanced Well Drilling',
                description: 'Doubles the population covered by each well (from 1M to 2M per well)',
                maxCount: 1,
                cost: { money: 10000000 }, // $10M
                techRequired: 800,
                resources: { 'copper-manufactured': 250, 'lead-manufactured': 250 },
                effect: 'Each well now covers 2,000,000 population instead of 1,000,000',
                category: 'infrastructure',
                special: 'Requires 5 wells to be built before this project can be selected',
                requires: 'well', // Requires 5 wells built
                pollutionProduction: 0
            },
            
            wellSynergy: {
                name: 'Well Synergy',
                description: 'Doubles the maximum stack bonus from 50% to 100% when 5 wells are built',
                maxCount: 1,
                cost: { money: 15000000 }, // $15M
                techRequired: 1000,
                resources: { 'bronze-manufactured': 600, 'aluminum-manufactured': 250 },
                effect: 'When 5 wells are built, the stack bonus increases from 50% to 100% (5M becomes 10M with doubling, or 7.5M base)',
                category: 'infrastructure',
                special: 'Requires 5 wells to be built before this project can be selected',
                requires: 'well', // Requires 5 wells built
                pollutionProduction: 0
            },
            
            // ─── Food & Water Production Projects (produce consumable food/water) ───
            foodProduction: {
                name: 'Food Production Facility',
                description: 'Produces consumable food resource (.25 per turn per facility).',
                maxCount: 3,
                cost: { money: 5000000 }, // $5M
                techRequired: 100,
                produces: { resource: 'food', rate: 0.25 },
                effect: 'Produces 0.25 food per turn per facility. -100 pollution per facility.',
                category: 'economy',
                pollutionReduction: 100
            },
            waterProduction: {
                name: 'Water Production Facility',
                description: 'Produces consumable water resource (.25 per turn per facility).',
                maxCount: 3,
                cost: { money: 5000000 }, // $5M
                techRequired: 100,
                produces: { resource: 'water', rate: 0.25 },
                effect: 'Produces 0.25 water per turn per facility. -100 pollution per facility.',
                category: 'economy',
                pollutionReduction: 100
            },
            
            salvageYard: {
                name: 'Salvage Yard',
                description: 'Enables resource recovery when demolishing buildings',
                maxCount: 1,
                cost: { money: 8000000 }, // $8M
                techRequired: 600,
                resources: { 'bronze-manufactured': 300, 'copper-manufactured': 100 },
                effect: 'Recovers a portion of building costs when demolishing improvements and projects',
                category: 'infrastructure',
                special: 'Required for resource recovery on demolition',
                pollutionProduction: 0
            },
            
            militarySalvage: {
                name: 'Military Salvage Operations',
                description: 'Recovers resources from defeated enemy units in war',
                maxCount: 3,
                cost: { money: 6000000 }, // $6M
                techRequired: 700,
                resources: { 'steel-manufactured': 100, 'gasoline-manufactured': 150 },
                effect: '9% salvage rate per project (max 27% with 3 projects). -50 pollution per project.',
                category: 'military',
                special: 'Stacks up to 3 times for increased salvage',
                pollutionReduction: 50
            },

            // ─── Pollution Reduction Projects (Set 1: Urban Greenbelt & Civic Nature) ───
            greenSpaceInitiative: {
                name: 'Green Space Initiative',
                description: 'Doubles the pollution reduction from Community Gardens.',
                maxCount: 1,
                cost: { money: 10000000 }, // $10M
                techRequired: 800,
                resources: { 'steel-manufactured': 100, 'lead-manufactured': 150 },
                effect: 'Doubles Community Garden pollution reduction (-60 → -120 each)',
                category: 'infrastructure',
                special: 'Stacks with National Parks System wonder',
                pollutionReduction: 0
            },
            urbanForestryProgram: {
                name: 'Urban Forestry Program',
                description: 'City-wide tree canopy expansion.',
                maxCount: 1,
                cost: { money: 8000000 }, // $8M
                techRequired: 600,
                resources: { 'bronze-manufactured': 100, 'aluminum-manufactured': 100 },
                effect: '-200 flat pollution reduction',
                category: 'infrastructure',
                pollutionReduction: 200
            },

            // ─── Pollution Reduction Projects (Set 2: Industrial Filtration & Waste Management) ───
            carbonCaptureProgram: {
                name: 'Carbon Capture Program',
                description: 'Targets transition plant pollution at the source.',
                maxCount: 1,
                cost: { money: 12000000 }, // $12M
                techRequired: 900,
                resources: { 'bronze-manufactured': 200, 'lead-manufactured': 100, 'steel-manufactured': 100 },
                effect: '-100 pollution per transition plant (Steel Mill, Bronze Foundry, etc.)',
                category: 'infrastructure',
                special: 'Applies to all 7 transition improvements',
                pollutionReduction: 0
            },
            zeroWasteInitiative: {
                name: 'Zero Waste Initiative',
                description: 'Doubles Waste Treatment Plant effectiveness.',
                maxCount: 1,
                cost: { money: 10000000 }, // $10M
                techRequired: 800,
                resources: { 'aluminum-manufactured': 150, 'copper-manufactured': 100 },
                effect: 'Doubles Waste Treatment Plant pollution reduction (-180 → -360 each)',
                category: 'infrastructure',
                special: 'Stacks with Waste Treatment Plant improvements',
                pollutionReduction: 0
            },

            // ─── Pollution Reduction Projects (Set 3: Regulatory & Civic Programs) ───
            cleanAirRegulations: {
                name: 'Clean Air Regulations',
                description: 'Reduces pollution from all sources.',
                maxCount: 1,
                cost: { money: 15000000 }, // $15M
                techRequired: 1000,
                resources: { 'bronze-manufactured': 250, 'steel-manufactured': 100 },
                effect: '-15% pollution from all sources',
                category: 'administration',
                special: 'Percentage-based reduction applied after flat reductions',
                pollutionReduction: 0
            },
            publicTransitExpansion: {
                name: 'Public Transit Expansion',
                description: 'Reduces transportation emissions.',
                maxCount: 1,
                cost: { money: 8000000 }, // $8M
                techRequired: 500,
                resources: { 'steel-manufactured': 150, 'gasoline-manufactured': 100 },
                effect: '-50 pollution per Harbor and Airforce Base',
                category: 'infrastructure',
                special: 'Targets Harbor and Airforce Base improvements',
                pollutionReduction: 0
            },
            epaAgency: {
                name: 'Environmental Protection Agency',
                description: 'Government oversight body that reduces pollution and blocks bad-edict increases.',
                maxCount: 1,
                cost: { money: 20000000 }, // $20M
                techRequired: 1200,
                resources: { 'bronze-manufactured': 300, 'steel-manufactured': 200, 'uranium-manufactured': 100 },
                effect: '-250 flat pollution reduction + blocks bad-edict pollution increases',
                category: 'administration',
                special: 'Prevents bad edicts from increasing pollution',
                pollutionReduction: 250
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
        this.isInitialized = count > 0;
        
        console.log('Projects System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!EventBus) return;
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
        const { projectType, nation } = data || {};
        
        if (!nation) {
            console.warn('build_project: missing nation');
            return false;
        }
        
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
        
        // Check prerequisite requirement (for projects that require specific improvements or projects)
        if (project.requires) {
            const requiredCount = project.requireCount || 5;
            const projectCount = nation.projects?.[project.requires] || 0;
            const improvementCount = nation.improvements?.[project.requires] || 0;
            const currentCount = projectCount + improvementCount;
            if (currentCount < requiredCount) {
                console.warn(`${project.name} requires ${requiredCount} ${project.requires} to be built first (current: ${currentCount})`);
                return false;
            }
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
        
        // Recalculate food/water wonder effects if it's a farm or well project
        if (['advancedAgriculture', 'farmSynergy', 'advancedWellDrilling', 'wellSynergy'].includes(projectType) && window.WondersSystem) {
            if (nation.wonders?.abundanceTemple > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'abundanceTemple');
            }
            if (nation.wonders?.aqueductOfLife > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'aqueductOfLife');
            }
        }
        
        EventBus.emit('project_built', {
            type: projectType,
            name: project.name,
            count: nation.projects[projectType],
            nation: nation
        });

        // Rebuild all project effects (full reset so pollution accumulators do not compound)
        this.rebuildAllProjectEffects(nation);

        console.log(`Built ${project.name} (${nation.projects[projectType]}/${project.maxCount})`);
        return true;
    }
    
    /**
     * Check if nation can afford project
     */
    canAffordProject(nation, project) {
        if (!nation || !project || !project.cost) return false;
        if (nation.money == null || nation.money < project.cost.money) return false;
        if (project.resources) {
            for (const [resourceKey, amount] of Object.entries(project.resources)) {
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
     * Pay for project cost
     */
    payProjectCost(nation, project) {
        if (!nation || !project || !project.cost) return;
        nation.money = (nation.money || 0) - project.cost.money;
        if (project.resources) {
            for (const [resourceKey, amount] of Object.entries(project.resources)) {
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
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 50;
                break;
                
            case 'ironCurtain':
                nation.projectEffects.missileInterception = Math.min(0.33, count * 0.11); // Max 33%
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 50;
                break;
                
            case 'nuclearShield':
                nation.projectEffects.nukeInterception = Math.min(0.33, count * 0.11); // Max 33%
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 50;
                break;
                
            case 'commandCenter':
                nation.projectEffects.offensiveWarSlots = 2 + count; // Base 2 + 1 per center
                nation.projectEffects.defensiveWarSlots = 2 + count; // Base 2 + 1 per center
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'officeOfRelationships':
                nation.projectEffects.changeableRelationships = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'militaryAcademy':
                nation.projectEffects.maxSoldierPercent = 30; // Up from 20%
                nation.projectEffects.maxTankPercent = 20;    // Up from 10%
                nation.projectEffects.maxAircraftPercent = 10; // Up from 7.5%
                nation.projectEffects.maxShipPercent = 7.5;   // Up from 5%
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'university':
                nation.projectEffects.universityLiteracyBonus = count * 0.10; // 10% per university
                nation.projectEffects.universityHappinessBonus = count * 3;   // +3 happiness per university
                nation.projectEffects.baseTechCostReduction = count * 0.05;   // -5% tech costs per university
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                
                // Great Library adds -2.5% tech cost per National University
                if (nation.wonderEffects?.greatLibraryActive) {
                    nation.projectEffects.greatLibraryUniversityBonus = count * (nation.wonderEffects.greatLibraryUniversityTechReduction || 0.025);
                } else {
                    nation.projectEffects.greatLibraryUniversityBonus = 0;
                }
                
                // Advanced University adds -3.33% tech cost per National University
                if (nation.projectEffects?.advancedUniversityActive) {
                    nation.projectEffects.advancedUniversityTechReduction = count * 0.0333;
                }
                
                // Recompute total tech cost reduction
                nation.projectEffects.techCostReduction = (
                    nation.projectEffects.baseTechCostReduction +
                    (nation.projectEffects.greatLibraryUniversityBonus || 0) +
                    (nation.projectEffects.advancedUniversityTechReduction || 0)
                );
                break;
                
            case 'ambulanceHub':
                nation.projectEffects.ambulanceDiseaseReduction = count * 0.10; // 10% per hub
                nation.projectEffects.ambulanceHappinessBonus = count * 5;      // +5 happiness per hub
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'governmentStatue':
                nation.projectEffects.governmentLocked = count > 0;
                nation.projectEffects.governmentApprovalLocked = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'religiousStatue':
                nation.projectEffects.religionLocked = count > 0;
                nation.projectEffects.religionApprovalLocked = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'spyOperations':
                nation.projectEffects.spyCapacity = count * 10; // 10 spies per center
                if (!nation.military) nation.military = {};
                if (!nation.military.spies) nation.military.spies = 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 50;
                break;
                
            case 'salvageYard':
                nation.projectEffects.resourceRecovery = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'enhancedPolice':
                nation.projectEffects.enhancedPoliceCrimeReduction = count * 0.10;
                nation.projectEffects.enhancedPoliceHappinessBonus = count * 2;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
            case 'advancedUniversity':
                nation.projectEffects.advancedUniversityActive = count > 0;
                // Tech cost reduction: 3.33% per National University (max 10% with 3)
                const universityCount = nation.projects?.university || 0;
                nation.projectEffects.advancedUniversityTechReduction = universityCount * 0.0333;
                // Recompute total tech cost reduction
                nation.projectEffects.techCostReduction = (
                    (nation.projectEffects.baseTechCostReduction || 0) +
                    (nation.projectEffects.greatLibraryUniversityBonus || 0) +
                    nation.projectEffects.advancedUniversityTechReduction
                );
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
            case 'advancedResearch':
                // Laboratory mechanics handled by ResearchSystem (3.5% rate when maxed, +1 pollution/disease)
                if (window.ResearchSystem) {
                    window.ResearchSystem.applyLabEffects(nation);
                }
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
            case 'swatPolice':
                nation.projectEffects.swatCrimeReduction = count * 0.15; // 15% per center
                nation.projectEffects.swatHappinessBonus = count * 2;    // +2 happiness per center
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'sportsBetting':
                nation.projectEffects.sportsBettingTaxBonus = 0.33;   // +33% taxable income
                nation.projectEffects.sportsBettingCrimeIncrease = 0.33; // +33% crime
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 200;
                break;
                
            case 'enhancedRecycling':
                nation.projectEffects.enhancedRecycling = count > 0;
                nation.projectEffects.pollutionReduction = (nation.projectEffects.pollutionReduction || 0) + count * 0;
                break;
                
            case 'enhancedBarracks':
                nation.projectEffects.enhancedBarracksEfficiency = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 75;
                break;
                
            case 'enhancedFactories':
                nation.projectEffects.enhancedFactoryEfficiency = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 150;
                break;
                
            case 'enhancedAirforces':
                nation.projectEffects.enhancedAirforceEfficiency = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 225;
                break;
                
            case 'enhancedNavy':
                nation.projectEffects.enhancedNavyEfficiency = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 300;
                break;
                
            // Food and Water project effects
            case 'advancedAgriculture':
                nation.projectEffects.farmDoubling = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'farmSynergy':
                nation.projectEffects.farmMaxStackBonus100 = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'advancedWellDrilling':
                nation.projectEffects.wellDoubling = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;
                
            case 'wellSynergy':
                nation.projectEffects.wellMaxStackBonus100 = count > 0;
                nation.projectEffects.pollutionProduction = (nation.projectEffects.pollutionProduction || 0) + count * 0;
                break;

            // Food & Water production rates
            case 'foodProduction':
                nation.projectEffects.foodProductionRate = count * 0.25;
                nation.projectEffects.pollutionReduction = (nation.projectEffects.pollutionReduction || 0) + count * 100;
                break;
            case 'waterProduction':
                nation.projectEffects.waterProductionRate = count * 0.25;
                nation.projectEffects.pollutionReduction = (nation.projectEffects.pollutionReduction || 0) + count * 100;
                break;
                
            case 'broadcasting':
                nation.projectEffects.worldForumAccess = count > 0;
                nation.projectEffects.colorVotingEnabled = count > 0;
                nation.projectEffects.congressEligible = count > 0;
                break;
                
            case 'financialAssistanceOffice':
                nation.projectEffects.financialAidEnabled = count > 0;
                nation.projectEffects.techAidEnabled = count > 0;
                nation.projectEffects.maxAidSlots = count > 0 ? 3 : 0;
                nation.projectEffects.intelligencePactBonus = count > 0; // Full tech sharing in Intelligence Pacts
                break;
                
            case 'militarySalvage':
                nation.projectEffects.militarySalvageRate = count * 0.09; // 9% per project (max 27% with 3 projects)
                nation.projectEffects.pollutionReduction = (nation.projectEffects.pollutionReduction || 0) + count * 50;
                break;

            // ─── Pollution Reduction Project Effects (Set 1: Urban Greenbelt & Civic Nature) ───
            case 'greenSpaceInitiative':
                nation.projectEffects.greenSpaceInitiative = count > 0;
                break;
            case 'urbanForestryProgram':
                nation.projectEffects.urbanForestryProgram = count > 0;
                nation.projectEffects.pollutionReduction = (nation.projectEffects.pollutionReduction || 0) + count * 200;
                break;

            // ─── Pollution Reduction Project Effects (Set 2: Industrial Filtration & Waste Management) ───
            case 'carbonCaptureProgram':
                nation.projectEffects.carbonCaptureProgram = count > 0;
                break;
            case 'zeroWasteInitiative':
                nation.projectEffects.zeroWasteInitiative = count > 0;
                break;

            // ─── Pollution Reduction Project Effects (Set 3: Regulatory & Civic Programs) ───
            case 'cleanAirRegulations':
                nation.projectEffects.cleanAirRegulations = count > 0;
                break;
            case 'publicTransitExpansion':
                nation.projectEffects.publicTransitExpansion = count > 0;
                break;
            case 'epaAgency':
                nation.projectEffects.epaAgency = count > 0;
                nation.projectEffects.pollutionReduction = (nation.projectEffects.pollutionReduction || 0) + count * 250;
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
     * Rebuild all project effects from scratch.
     * Resets effect accumulators (especially pollutionProduction/pollutionReduction)
     * so they do not compound when applyProjectEffects is called repeatedly.
     */
    rebuildAllProjectEffects(nation) {
        if (!nation.projects) return;
        if (!nation.projectEffects) nation.projectEffects = {};

        // Reset shared accumulators so repeated rebuilds do not compound pollution values
        nation.projectEffects.pollutionProduction = 0;
        nation.projectEffects.pollutionReduction = 0;

        // Reapply every built project type to rebuild the full effect set
        for (const type of Object.keys(this.projectTypes)) {
            const count = nation.projects[type] || 0;
            if (count > 0) {
                this.applyProjectEffects(nation, type);
            }
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
        if (!nation.statistics) nation.statistics = {};
        nation.statistics.missileHits = (nation.statistics.missileHits || 0) + 1;
        nation.statistics.missileLaunches = (nation.statistics.missileLaunches || 0) + 1;
        
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
        if (!nation || !nation.militaryUnits || !nation.population) return 0;
        
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
        const { projectType, nation } = data || {};
        
        if (!this.projectTypes[projectType]) {
            return null;
        }
        
        const project = this.projectTypes[projectType];
        
        return {
            ...project,
            canAfford: nation ? this.canAffordProject(nation, project) : false,
            currentCount: nation ? this.getProjectCount(nation, projectType) : 0,
            meetsTechRequirement: nation ? nation.tech >= project.techRequired : false,
            meetsPrerequisite: project.requires ? 
                ((nation?.projects?.[project.requires] || 0) + (nation?.improvements?.[project.requires] || 0) >= (project.requireCount || 5)) : true,
            meetsBonusRequirement: project.bonusRequirement ? 
                (nation?.bonusEffects?.[project.bonusRequirement] || false) : true
        };
    }
    
    /**
     * Demolish project
     */
    demolishProject(data) {
        const { projectType, nation } = data || {};
        
        if (!nation) {
            console.warn('demolish_project: missing nation');
            return false;
        }
        
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
        if (nation.projectEffects?.resourceRecovery) {
            const recoveryRate = nation.wonderEffects?.projectRecoveryRate || 
                               nation.projectEffects.projectRecoveryRate || 0.10;
            
            // Recover money
            if (project.cost?.money) {
                const recoveredMoney = Math.floor(project.cost.money * recoveryRate);
                recoveredResources.money = recoveredMoney;
                nation.money += recoveredMoney;
            }
            
            // Recover resources (staged compound keys)
            if (project.resources) {
                for (const [resourceKey, amount] of Object.entries(project.resources)) {
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
        
        nation.projects[projectType]--;
        
        // Rebuild all project effects (full reset so pollution accumulators do not compound)
        this.rebuildAllProjectEffects(nation);
        
        // Recalculate food/water wonder effects if it's a farm or well project
        if (['advancedAgriculture', 'farmSynergy', 'advancedWellDrilling', 'wellSynergy'].includes(projectType) && window.WondersSystem) {
            if (nation.wonders?.abundanceTemple > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'abundanceTemple');
            }
            if (nation.wonders?.aqueductOfLife > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'aqueductOfLife');
            }
        }
        
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
                meetsTechRequirement: nation.tech != null && nation.tech >= project.techRequired,
                meetsPrerequisite: project.requires ? 
                    ((nation.projects?.[project.requires] || 0) + (nation.improvements?.[project.requires] || 0) >= (project.requireCount || 5)) : true,
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
        if (penalty > 0 && nation.nationStats) {
            nation.nationStats.happiness -= penalty;
            nation.nationStats.happiness = Math.max(0, nation.nationStats.happiness);
        }
    }
    
    destroy() {
        if (!this.isInitialized) return;
        
        if (EventBus) {
            EventBus.off('build_project', this.buildProject, this);
            EventBus.off('demolish_project', this.demolishProject, this);
            EventBus.off('get_project_info', this.getProjectInfo, this);
            EventBus.off('launch_missile', this.launchMissile, this);
            EventBus.off('intercept_missile', this.interceptMissile, this);
        }
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectsSystem;
} else {
    window.ProjectsSystem = ProjectsSystem;
}