/**
 * Improvements System - Empire Builder
 * Handles nation improvements like ports, mines, factories, embassies, etc.
 */

class ImprovementsSystem {
    constructor() {
        this.isInitialized = false;
        
        // Improvement definitions
        this.improvementTypes = {
            barracks: {
                name: 'Barracks',
                description: 'Improves soldier effectiveness',
                maxCount: 5,
                cost: { money: 1500000 }, // $1.5M
                effect: '+45% soldier effectiveness per barracks (stacks to 225% at 5). Projects and wonders add on top. +25 pollution per barracks.',
                category: 'military',
                pollutionProduction: 25
            },
            
            factory: {
                name: 'Factory',
                description: 'Improves tank effectiveness',
                maxCount: 5,
                cost: { money: 2000000 }, // $2M
                effect: '+45% tank effectiveness per factory (stacks to 225% at 5). Projects and wonders add on top. +50 pollution per factory.',
                category: 'military',
                pollutionProduction: 50
            },
            
            airforceBase: {
                name: 'Airforce Base',
                description: 'Improves aircraft effectiveness',
                maxCount: 5,
                cost: { money: 2800000 }, // $2.8M
                effect: '+45% aircraft effectiveness per base (stacks to 225% at 5). Projects and wonders add on top. +75 pollution per base.',
                category: 'military',
                pollutionProduction: 75
            },
            
            harbor: {
                name: 'Harbor',
                description: 'Improves ship effectiveness',
                maxCount: 5,
                cost: { money: 2500000 }, // $2.5M
                effect: '+45% ship effectiveness per harbor (stacks to 225% at 5). Projects and wonders add on top. +100 pollution per harbor.',
                category: 'military',
                pollutionProduction: 100
            },
            
            embassy: {
                name: 'Embassy',
                description: 'Enables diplomatic relations',
                maxCount: 5,
                cost: { money: 1200000 }, // $1.2M
                effect: '1 friend/foe slot per embassy, special bonuses at 5',
                category: 'diplomacy'
            },
            
            foreignAffairsOffice: {
                name: 'Foreign Affairs Office',
                description: 'Required for all diplomatic actions',
                maxCount: 1,
                cost: { money: 3500000 }, // $3.5M
                effect: 'Required for all diplomatic actions. PERMANENT - cannot be demolished once built.',
                category: 'diplomacy',
                permanent: true
            },
            
            internalAffairsOffice: {
                name: 'Internal Affairs Office',
                description: 'Enables domestic policy selection',
                maxCount: 1,
                cost: { money: 3000000 }, // $3M
                effect: 'Allows selection of 16 domestic policies (edicts). PERMANENT - cannot be demolished once built.',
                category: 'administration',
                permanent: true
            },
            
            hospital: {
                name: 'Hospital',
                description: 'Reduces disease rates',
                maxCount: 5,
                cost: { money: 900000 }, // $900K
                effect: '-5% disease rate per hospital (max -25%)',
                category: 'infrastructure'
            },
            
            policeStation: {
                name: 'Police Station',
                description: 'Reduces crime rates',
                maxCount: 5,
                cost: { money: 750000 }, // $750K
                effect: '-5% crime rate per station (max -25%)',
                category: 'infrastructure'
            },
            
            recyclingCenter: {
                name: 'Recycling Center',
                description: 'Reduces pollution levels',
                maxCount: 5,
                cost: { money: 1100000 }, // $1.1M
                effect: '-300 pollution per center',
                category: 'infrastructure',
                pollutionReduction: 300
            },
            
            school: {
                name: 'School',
                description: 'Increases literacy rate',
                maxCount: 5,
                cost: { money: 1000000 }, // $1M
                effect: '+7.5% literacy rate per school (max +37.5%)',
                category: 'infrastructure'
            },
            
            casino: {
                name: 'Casino',
                description: 'Increases taxable income but raises crime',
                maxCount: 5,
                cost: { money: 1800000 }, // $1.8M
                effect: '+5% taxable income per casino, but increases crime and reduces happiness. +100 pollution per casino.',
                category: 'economic',
                pollutionProduction: 100
            },
            
            park: {
                name: 'Park',
                description: 'Improves environment and happiness',
                maxCount: 5,
                cost: { money: 650000 }, // $650K
                effect: '+7.5% environment and +2% happiness per park. -75 pollution per park.',
                category: 'infrastructure',
                pollutionReduction: 75
            },
            
            researchLab: {
                name: 'Research Laboratory',
                description: 'Diverts 2.5% of net turn income to research per lab (stacks to 4 = 10%). Adds +5 pollution and +5 disease per lab.',
                maxCount: 4,
                cost: { money: 2200000 }, // $2.2M
                effect: '2.5% of net income to research per lab (max 4 labs = 10%). +5 pollution and +5 disease per lab.',
                category: 'science',
                pollutionProduction: 25
            },
            
            treePlantation: {
                name: 'Tree Plantation',
                description: 'Improves environment quality and happiness, reduces pollution',
                maxCount: 5,
                cost: { money: 450000 }, // $450K
                effect: 'Increases environment quality and happiness. -150 pollution per plantation.',
                category: 'infrastructure',
                pollutionReduction: 150
            },

            // Food and Water improvements for basic needs system
            farm: {
                name: 'Farm',
                description: 'Produces food for 1 million population per farm. Stacks to 5. At 5 stacks, gives 50% bonus (5M becomes 7.5M)',
                maxCount: 5,
                cost: { money: 500000 }, // $500K
                effect: 'Each farm feeds 1,000,000 population. 5 farms max: 5,000,000 base + 50% bonus = 7,500,000',
                category: 'infrastructure',
                populationCoverage: 1000000, // 1M per farm
                baseStackBonus: 0.50 // 50% bonus at max stack
            },

            well: {
                name: 'Well',
                description: 'Provides water for 1 million population per well. Stacks to 5. At 5 stacks, gives 50% bonus (5M becomes 7.5M)',
                maxCount: 5,
                cost: { money: 500000 }, // $500K
                effect: 'Each well provides water for 1,000,000 population. 5 wells max: 5,000,000 base + 50% bonus = 7,500,000',
                category: 'infrastructure',
                populationCoverage: 1000000, // 1M per well
                baseStackBonus: 0.50 // 50% bonus at max stack
            },

            // ─── Mineral Production Improvements (produce raw staged resources) ───
            steelMill: {
                name: 'Iron Mine',
                description: 'Produces raw steel resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw steel per turn per mine (stacking bonus up to 50%). +75 pollution per mine.',
                category: 'production',
                produces: { resource: 'steel', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },
            bronzeSmelter: {
                name: 'Tin Mine',
                description: 'Produces raw bronze resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw bronze per turn per mine (stacking bonus up to 50%). +75 pollution per mine.',
                category: 'production',
                produces: { resource: 'bronze', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },
            leadRefinery: {
                name: 'Lead Mine',
                description: 'Produces raw lead resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw lead per turn per mine (stacking bonus up to 50%). +75 pollution per mine.',
                category: 'production',
                produces: { resource: 'lead', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },
            aluminumSmelter: {
                name: 'Bauxite Mine',
                description: 'Produces raw aluminum resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw aluminum per turn per mine (stacking bonus up to 50%). +75 pollution per mine.',
                category: 'production',
                produces: { resource: 'aluminum', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },
            copperRefinery: {
                name: 'Copper Mine',
                description: 'Produces raw copper resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw copper per turn per mine (stacking bonus up to 50%). +75 pollution per mine.',
                category: 'production',
                produces: { resource: 'copper', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },
            uraniumEnrichmentPlant: {
                name: 'Uranium Mine',
                description: 'Produces raw uranium resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw uranium per turn per mine (stacking bonus up to 50%). +75 pollution per mine.',
                category: 'production',
                produces: { resource: 'uranium', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },
            gasolineRefinery: {
                name: 'Oil Rig',
                description: 'Produces raw gasoline resource. Stacks to 5.',
                maxCount: 5,
                cost: { money: 750000 },
                effect: '+0.1 raw gasoline per turn per rig (stacking bonus up to 50%). +75 pollution per rig.',
                category: 'production',
                produces: { resource: 'gasoline', stage: 'raw', rate: 0.1 },
                pollutionProduction: 75
            },

            // ─── Mineral Transition Improvements (convert stage N to stage N+1) ───
            steelFoundry: {
                name: 'Steel Mill',
                description: 'Converts raw steel to stage1 steel. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per mill (2:1 ratio). +125 pollution per mill.',
                category: 'production',
                transition: { resource: 'steel', capacity: 2 },
                pollutionProduction: 125
            },
            bronzeCasting: {
                name: 'Bronze Foundry',
                description: 'Converts raw bronze to stage1 bronze. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per foundry (2:1 ratio). +125 pollution per foundry.',
                category: 'production',
                transition: { resource: 'bronze', capacity: 2 },
                pollutionProduction: 125
            },
            leadCasting: {
                name: 'Lead Refinery',
                description: 'Converts raw lead to stage1 lead. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per refinery (2:1 ratio). +125 pollution per refinery.',
                category: 'production',
                transition: { resource: 'lead', capacity: 2 },
                pollutionProduction: 125
            },
            aluminumExtrusion: {
                name: 'Aluminum Smelter',
                description: 'Converts raw aluminum to stage1 aluminum. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per smelter (2:1 ratio). +125 pollution per smelter.',
                category: 'production',
                transition: { resource: 'aluminum', capacity: 2 },
                pollutionProduction: 125
            },
            copperDrawing: {
                name: 'Copper Refinery',
                description: 'Converts raw copper to stage1 copper. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per refinery (2:1 ratio). +125 pollution per refinery.',
                category: 'production',
                transition: { resource: 'copper', capacity: 2 },
                pollutionProduction: 125
            },
            uraniumFuelFabrication: {
                name: 'Uranium Enrichment Plant',
                description: 'Converts raw uranium to stage1 uranium. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per plant (2:1 ratio). +125 pollution per plant.',
                category: 'production',
                transition: { resource: 'uranium', capacity: 2 },
                pollutionProduction: 125
            },
            gasolineBlending: {
                name: 'Oil Refinery',
                description: 'Converts raw gasoline to stage1 gasoline. Stacks to 5.',
                maxCount: 5,
                cost: { money: 1000000 },
                effect: 'Transition capacity: 2 units per cycle per refinery (2:1 ratio). +125 pollution per refinery.',
                category: 'production',
                transition: { resource: 'gasoline', capacity: 2 },
                pollutionProduction: 125
            },

            // ─── Pollution Reduction Improvements (Set 1: Urban Greenbelt & Civic Nature) ───
            communityGarden: {
                name: 'Community Garden',
                description: 'Small urban plots that absorb local emissions.',
                maxCount: 5,
                cost: { money: 800000 }, // $800K
                effect: '-60 pollution per garden',
                category: 'infrastructure',
                pollutionReduction: 60
            },
            urbanArboretum: {
                name: 'Urban Arboretum',
                description: 'Larger curated tree collections in city centers.',
                maxCount: 5,
                cost: { money: 1200000 }, // $1.2M
                effect: '-110 pollution per arboretum',
                category: 'infrastructure',
                pollutionReduction: 110
            },
            wetlandsPreserve: {
                name: 'Wetlands Preserve',
                description: 'Natural filtration zones that clean runoff.',
                maxCount: 5,
                cost: { money: 1400000 }, // $1.4M
                effect: '-140 pollution per preserve',
                category: 'infrastructure',
                pollutionReduction: 140
            },

            // ─── Pollution Reduction Improvements (Set 2: Industrial Filtration & Waste Management) ───
            wasteTreatmentPlant: {
                name: 'Waste Treatment Plant',
                description: 'Processes industrial byproducts before release.',
                maxCount: 5,
                cost: { money: 1600000 }, // $1.6M
                effect: '-180 pollution per plant',
                category: 'infrastructure',
                pollutionReduction: 180
            },
            emissionsScrubberTower: {
                name: 'Emissions Scrubber Tower',
                description: 'Filters smokestack output from manufacturing.',
                maxCount: 5,
                cost: { money: 1500000 }, // $1.5M
                effect: '-160 pollution per tower',
                category: 'infrastructure',
                pollutionReduction: 160
            },
            bioremediationCenter: {
                name: 'Bioremediation Center',
                description: 'Uses organisms to neutralize contaminated soil/water.',
                maxCount: 5,
                cost: { money: 1300000 }, // $1.3M
                effect: '-130 pollution per center',
                category: 'infrastructure',
                pollutionReduction: 130
            }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the improvements system
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('Improvements System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!EventBus) return;
        EventBus.on('get_improvement_info', this.getImprovementInfo, this);
    }
    
    /**
     * Build an improvement
     */
    buildImprovement(data) {
        const { improvementType, nation } = data || {};
        
        if (!nation) {
            console.warn('build_improvement: missing nation');
            return false;
        }
        
        if (!this.improvementTypes[improvementType]) {
            console.warn(`Unknown improvement type: ${improvementType}`);
            return false;
        }
        
        const improvement = this.improvementTypes[improvementType];
        const currentCount = this.getImprovementCount(nation, improvementType);
        
        // Check max count
        if (currentCount >= improvement.maxCount) {
            console.warn(`Maximum ${improvement.name} limit reached (${improvement.maxCount})`);
            return false;
        }
        
        // Check costs
        if (!this.canAffordImprovement(nation, improvement)) {
            console.warn(`Cannot afford ${improvement.name}`);
            return false;
        }
        
        // Pay costs
        this.payImprovementCost(nation, improvement);
        
        // Add improvement
        if (!nation.improvements) nation.improvements = {};
        if (!nation.improvements[improvementType]) nation.improvements[improvementType] = 0;
        nation.improvements[improvementType]++;
        
        // Recalculate supreme military wonder bonuses first so they are read
        // by applyImprovementEffects during the rebuild below.
        if (['barracks', 'factory', 'airforceBase', 'harbor'].includes(improvementType) && 
            nation.wonderEffects?.supremeMilitaryBonus && window.WondersSystem) {
            window.WondersSystem.applySupremeMilitaryEffects(nation);
        }
        
        // Apply effects (full rebuild so pollution accumulators do not compound on repeated builds/demolishes)
        this.rebuildAllImprovementEffects(nation);
        
        // Recalculate food/water wonder effects if it's a farm or well
        if (['farm', 'well'].includes(improvementType) && window.WondersSystem) {
            if (nation.wonders?.abundanceTemple > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'abundanceTemple');
            }
            if (nation.wonders?.aqueductOfLife > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'aqueductOfLife');
            }
        }
        
        EventBus.emit('improvement_built', {
            type: improvementType,
            name: improvement.name,
            count: nation.improvements[improvementType],
            nation: nation
        });
        
        console.log(`Built ${improvement.name} (${nation.improvements[improvementType]}/${improvement.maxCount})`);
        return true;
    }
    
    /**
     * Check if nation can afford improvement
     */
    canAffordImprovement(nation, improvement) {
        if (!nation || !improvement || !improvement.cost) return false;
        if (nation.money == null || nation.money < improvement.cost.money) return false;
        // Check resource costs (compound keys like 'steel-manufactured')
        if (improvement.cost.resources) {
            for (const [resourceKey, amount] of Object.entries(improvement.cost.resources)) {
                const { resource, stage } = this.parseCompoundKey(resourceKey);
                const has = stage
                    ? nation.resources?.[resource]?.[stage] || 0
                    : nation.resources?.[resource] || 0;
                if (has < amount) return false;
            }
        }
        return true;
    }

    /**
     * Parse compound key like 'steel-manufactured' into { resource, stage }
     */
    parseCompoundKey(key) {
        const parts = key.split('-');
        if (parts.length >= 2) {
            const stage = parts.pop();
            const resource = parts.join('-');
            return { resource, stage };
        }
        return { resource: key, stage: null };
    }

    /**
     * Pay for improvement cost
     */
    payImprovementCost(nation, improvement) {
        if (!nation || !improvement || !improvement.cost) return;
        nation.money = (nation.money || 0) - improvement.cost.money;
        // Deduct resource costs (compound keys like 'steel-manufactured')
        if (improvement.cost.resources) {
            for (const [resourceKey, amount] of Object.entries(improvement.cost.resources)) {
                const { resource, stage } = this.parseCompoundKey(resourceKey);
                if (stage) {
                    nation.resources[resource][stage] = (nation.resources[resource]?.[stage] || 0) - amount;
                } else {
                    nation.resources[resource] = (nation.resources[resource] || 0) - amount;
                }
            }
        }
    }
    
    /**
     * Get current count of improvement type
     */
    getImprovementCount(nation, improvementType) {
        return nation.improvements?.[improvementType] || 0;
    }
    
    /**
     * Apply improvement effects to nation
     */
    applyImprovementEffects(nation, improvementType) {
        if (!nation.improvementEffects) nation.improvementEffects = {};
        
        const count = this.getImprovementCount(nation, improvementType);
        
        switch (improvementType) {
            case 'barracks':
                let soldierBonus = 0.45; // Base 45% per barracks
                if (nation.projectEffects?.enhancedBarracksEfficiency) {
                    soldierBonus += 0.15; // Project adds +15% per barracks (stacks additively)
                }
                nation.improvementEffects.soldierEffectiveness = count * soldierBonus;
                // Supreme Military wonder doubles pollution from maxed barracks
                let barracksPollution = count * 25;
                if (nation.wonderEffects?.supremeSoldierPollutionDouble && count >= 5) {
                    barracksPollution *= 2;
                }
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + barracksPollution;
                
                // Add wonder bonus if applicable (stacks on top of base + project)
                if (nation.wonderEffects?.supremeSoldierBonus && count >= 5) {
                    nation.improvementEffects.soldierEffectiveness += nation.wonderEffects.supremeSoldierBonus * count;
                }
                break;
                
            case 'factory':
                let tankBonus = 0.45; // Base 45% per factory
                if (nation.projectEffects?.enhancedFactoryEfficiency) {
                    tankBonus += 0.15; // Project adds +15% per factory (stacks additively)
                }
                nation.improvementEffects.tankEffectiveness = count * tankBonus;
                // Supreme Military wonder doubles pollution from maxed factories
                let tankPollution = count * 50;
                if (nation.wonderEffects?.supremeTankPollutionDouble && count >= 5) {
                    tankPollution *= 2;
                }
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + tankPollution;
                
                // Add wonder bonus if applicable (stacks on top of base + project)
                if (nation.wonderEffects?.supremeTankBonus && count >= 5) {
                    nation.improvementEffects.tankEffectiveness += nation.wonderEffects.supremeTankBonus * count;
                }
                break;
                
            case 'airforceBase':
                let aircraftBonus = 0.45; // Base 45% per base
                if (nation.projectEffects?.enhancedAirforceEfficiency) {
                    aircraftBonus += 0.15; // Project adds +15% per base (stacks additively)
                }
                nation.improvementEffects.aircraftEffectiveness = count * aircraftBonus;
                // Supreme Military wonder doubles pollution from maxed airforce bases
                let aircraftPollution = count * 75;
                if (nation.wonderEffects?.supremeAircraftPollutionDouble && count >= 5) {
                    aircraftPollution *= 2;
                }
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + aircraftPollution;
                
                // Add wonder bonus if applicable (stacks on top of base + project)
                if (nation.wonderEffects?.supremeAircraftBonus && count >= 5) {
                    nation.improvementEffects.aircraftEffectiveness += nation.wonderEffects.supremeAircraftBonus * count;
                }
                break;
                
            case 'harbor':
                let shipBonus = 0.45; // Base 45% per harbor
                if (nation.projectEffects?.enhancedNavyEfficiency) {
                    shipBonus += 0.15; // Project adds +15% per harbor (stacks additively)
                }
                nation.improvementEffects.shipEffectiveness = count * shipBonus;
                // Supreme Military wonder doubles pollution from maxed harbors
                let shipPollution = count * 100;
                if (nation.wonderEffects?.supremeShipPollutionDouble && count >= 5) {
                    shipPollution *= 2;
                }
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + shipPollution;
                
                // Add wonder bonus if applicable (stacks on top of base + project)
                if (nation.wonderEffects?.supremeShipBonus && count >= 5) {
                    nation.improvementEffects.shipEffectiveness += nation.wonderEffects.supremeShipBonus * count;
                }
                break;
                
            case 'embassy':
                this.applyEmbassyEffects(nation, count);
                break;
                
            case 'foreignAffairsOffice':
                nation.improvementEffects.canDiplomacy = true;
                break;
                
            case 'internalAffairsOffice':
                nation.improvementEffects.canSetPolicies = true;
                // Unlock all edict categories (domestic policies) so they can be selected
                if (window.EdictSystem && window.EDICT_CATEGORIES) {
                    Object.keys(window.EDICT_CATEGORIES).forEach(cat => {
                        window.EdictSystem.unlockEdict(nation, cat);
                    });
                }
                break;
                
            case 'hospital':
                nation.improvementEffects.diseaseReduction = count * 0.05; // 5% per hospital
                break;
                
            case 'policeStation':
                nation.improvementEffects.crimeReduction = count * 0.05; // 5% per station
                break;
                
            case 'recyclingCenter':
                nation.improvementEffects.pollutionReduction = (nation.improvementEffects.pollutionReduction || 0) + count * 300; // -300 pollution per center
                
                // Enhanced recycling project adds happiness penalty
                if (nation.projectEffects?.enhancedRecycling) {
                    nation.improvementEffects.recyclingHappinessPenalty = count; // -1 happiness per center
                } else {
                    nation.improvementEffects.recyclingHappinessPenalty = 0;
                }
                
                // Supreme recycling wonder removes happiness penalty and adds environment bonus
                if (nation.wonderEffects?.supremeRecycling) {
                    nation.improvementEffects.recyclingHappinessPenalty = 0; // Remove penalty
                    nation.improvementEffects.recyclingEnvironmentBonus = count; // +1 environment per center
                }
                break;
                
            case 'school':
                let schoolLiteracyBonus = count * 0.075; // 7.5% per school
                // Great Library adds +2.5% literacy per school (making them +10% each, 50% total with 5)
                if (nation.wonderEffects?.greatLibraryActive) {
                    schoolLiteracyBonus += count * (nation.wonderEffects.greatLibrarySchoolLiteracyBonus || 0.025);
                }
                nation.improvementEffects.literacyBonus = schoolLiteracyBonus;
                break;
                
            case 'casino':
                nation.improvementEffects.taxableIncomeBonus = count * 0.05; // 5% per casino
                nation.improvementEffects.crimeIncrease = count * 0.03; // 3% crime increase per casino
                nation.improvementEffects.happinessDecrease = count * 2; // -2 happiness per casino
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 100; // +100 pollution per casino
                break;
                
            case 'treePlantation':
                nation.improvementEffects.treeEnvironmentBonus = count;
                nation.improvementEffects.treeHappinessBonus = count;
                nation.improvementEffects.treePollutionReduction = count * 150; // -150 pollution per plantation
                nation.improvementEffects.pollutionReduction = (nation.improvementEffects.pollutionReduction || 0) + count * 150;
                break;
            case 'researchLab':
                // Laboratory mechanics handled by ResearchSystem (income diversion, pollution, disease)
                if (window.ResearchSystem && typeof window.ResearchSystem.applyLabEffects === 'function') {
                    window.ResearchSystem.applyLabEffects(nation);
                }
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 25; // +25 pollution per lab
                break;
            case 'park':
                nation.improvementEffects.environmentBonus = count * 0.075; // 7.5% environment per park
                nation.improvementEffects.happinessFromParks = count * 2; // +2 happiness per park
                nation.improvementEffects.pollutionReduction = (nation.improvementEffects.pollutionReduction || 0) + count * 75; // -75 pollution per park
                break;
                
            case 'farm':
                // Calculate food coverage: each farm covers 1M population
                let farmCoverage = count * 1000000; // Base coverage from farms
                let farmStackBonus = 0;
                
                // Apply project effects that double farm coverage per farm
                if (nation.projectEffects?.farmDoubling) {
                    farmCoverage = count * 2000000; // 2M per farm when doubled
                }
                
                // Apply stack bonus: at max stack (5), get 50% bonus (or 100% if project maxed)
                if (count >= 5) {
                    let stackBonusPercent = 0.50; // Base 50% at max stack
                    if (nation.projectEffects?.farmMaxStackBonus100) {
                        stackBonusPercent = 1.00; // 100% bonus when project applied
                    }
                    farmStackBonus = farmCoverage * stackBonusPercent;
                }
                
                nation.improvementEffects.foodProduction = farmCoverage + farmStackBonus;
                nation.improvementEffects.foodCoverage = farmCoverage;
                nation.improvementEffects.foodStackBonus = farmStackBonus;
                break;
                
            case 'well':
                // Calculate water coverage: each well covers 1M population
                let wellCoverage = count * 1000000; // Base coverage from wells
                let wellStackBonus = 0;
                
                // Apply project effects that double well coverage per well
                if (nation.projectEffects?.wellDoubling) {
                    wellCoverage = count * 2000000; // 2M per well when doubled
                }
                
                // Apply stack bonus: at max stack (5), get 50% bonus (or 100% if project maxed)
                if (count >= 5) {
                    let stackBonusPercent = 0.50; // Base 50% at max stack
                    if (nation.projectEffects?.wellMaxStackBonus100) {
                        stackBonusPercent = 1.00; // 100% bonus when project applied
                    }
                    wellStackBonus = wellCoverage * stackBonusPercent;
                }
                
                nation.improvementEffects.waterProduction = wellCoverage + wellStackBonus;
                nation.improvementEffects.waterCoverage = wellCoverage;
                nation.improvementEffects.waterStackBonus = wellStackBonus;
                break;

            // ─── Mineral Production Effect Cases ───
            // Production rates and transition capacities are computed per-turn by
            // ResourceSystem.processTurn(), not here. These cases store the
            // improvement count on improvementEffects for UI/display tracking.
            case 'steelMill':
                nation.improvementEffects.steelMillCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;
            case 'bronzeSmelter':
                nation.improvementEffects.bronzeSmelterCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;
            case 'leadRefinery':
                nation.improvementEffects.leadRefineryCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;
            case 'aluminumSmelter':
                nation.improvementEffects.aluminumSmelterCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;
            case 'copperRefinery':
                nation.improvementEffects.copperRefineryCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;
            case 'uraniumEnrichmentPlant':
                nation.improvementEffects.uraniumEnrichmentPlantCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;
            case 'gasolineRefinery':
                nation.improvementEffects.gasolineRefineryCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 75; // +75 pollution per mine
                break;

            // ─── Mineral Transition Effect Cases ───
            case 'steelFoundry':
                nation.improvementEffects.steelFoundryCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per mill
                break;
            case 'bronzeCasting':
                nation.improvementEffects.bronzeCastingCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per foundry
                break;
            case 'leadCasting':
                nation.improvementEffects.leadCastingCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per refinery
                break;
            case 'aluminumExtrusion':
                nation.improvementEffects.aluminumExtrusionCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per smelter
                break;
            case 'copperDrawing':
                nation.improvementEffects.copperDrawingCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per refinery
                break;
            case 'uraniumFuelFabrication':
                nation.improvementEffects.uraniumFuelFabricationCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per plant
                break;
            case 'gasolineBlending':
                nation.improvementEffects.gasolineBlendingCount = count;
                nation.improvementEffects.pollutionProduction = (nation.improvementEffects.pollutionProduction || 0) + count * 125; // +125 pollution per refinery
                break;

            // ─── Pollution Reduction Effect Cases (Set 1: Urban Greenbelt & Civic Nature) ───
            case 'communityGarden':
                nation.improvementEffects.communityGardenCount = count;
                nation.improvementEffects.pollutionReduction = count * 60; // -60 pollution per garden
                break;
            case 'urbanArboretum':
                nation.improvementEffects.urbanArboretumCount = count;
                nation.improvementEffects.pollutionReduction = count * 110; // -110 pollution per arboretum
                break;
            case 'wetlandsPreserve':
                nation.improvementEffects.wetlandsPreserveCount = count;
                nation.improvementEffects.pollutionReduction = count * 140; // -140 pollution per preserve
                break;

            // ─── Pollution Reduction Effect Cases (Set 2: Industrial Filtration & Waste Management) ───
            case 'wasteTreatmentPlant':
                nation.improvementEffects.wasteTreatmentPlantCount = count;
                nation.improvementEffects.pollutionReduction = count * 180; // -180 pollution per plant
                break;
            case 'emissionsScrubberTower':
                nation.improvementEffects.emissionsScrubberTowerCount = count;
                nation.improvementEffects.pollutionReduction = count * 160; // -160 pollution per tower
                break;
            case 'bioremediationCenter':
                nation.improvementEffects.bioremediationCenterCount = count;
                nation.improvementEffects.pollutionReduction = count * 130; // -130 pollution per center
                break;
        }
    }
    
    /**
     * Rebuild all improvement effects from scratch.
     * Resets effect accumulators (especially pollutionProduction/pollutionReduction)
     * so they do not compound when applyImprovementEffects is called repeatedly
     * for the same type within a single turn (build/demolish).
     */
    rebuildAllImprovementEffects(nation) {
        if (!nation.improvements) return;
        if (!nation.improvementEffects) nation.improvementEffects = {};
        
        // Reset shared accumulators so repeated rebuilds do not compound pollution values
        nation.improvementEffects.pollutionProduction = 0;
        nation.improvementEffects.pollutionReduction = 0;
        
        // Reapply every built improvement type to rebuild the full effect set
        for (const type of Object.keys(this.improvementTypes)) {
            const count = nation.improvements[type] || 0;
            if (count > 0) {
                this.applyImprovementEffects(nation, type);
            }
        }
    }
    
    /**
     * Apply embassy effects
     */
    applyEmbassyEffects(nation, embassyCount) {
        if (!nation.diplomaticRelations) nation.diplomaticRelations = {};
        
        nation.diplomaticRelations.maxFriends = embassyCount;
        nation.diplomaticRelations.maxFoes = embassyCount;
        
        // Special bonuses at 5 embassies
        if (embassyCount >= 5) {
            nation.diplomaticRelations.canSelectBestFriend = true;
            nation.diplomaticRelations.canSelectNemesis = true;
        }
        
        // Initialize arrays if needed
        if (!nation.diplomaticRelations.friends) nation.diplomaticRelations.friends = [];
        if (!nation.diplomaticRelations.foes) nation.diplomaticRelations.foes = [];
        if (!nation.diplomaticRelations.bestFriend) nation.diplomaticRelations.bestFriend = null;
        if (!nation.diplomaticRelations.nemesis) nation.diplomaticRelations.nemesis = null;
    }
    
    /**
     * Calculate diplomatic combat bonuses
     */
    calculateDiplomaticCombatBonus(nation, targetNation, warParticipants) {
        if (!nation.diplomaticRelations) return 0;
        
        let bonus = 0;
        let friendsInWar = 0;
        let foesInWar = 0;
        
        // Count friends and foes in the war
        if (!nation.diplomaticRelations.friends) nation.diplomaticRelations.friends = [];
        if (!nation.diplomaticRelations.foes) nation.diplomaticRelations.foes = [];
        warParticipants.forEach(participantId => {
            if (nation.diplomaticRelations.friends.includes(participantId)) {
                friendsInWar++;
            }
            if (nation.diplomaticRelations.foes.includes(participantId)) {
                foesInWar++;
            }
        });
        
        // Friend bonuses (5% per friend, stacking to 25% for all 5)
        bonus += friendsInWar * 0.05;
        
        // Foe penalties/bonuses (both sides get +5% per foe relationship)
        bonus += foesInWar * 0.05;
        
        // Best friend bonus (15% when in same war)
        if (nation.diplomaticRelations.bestFriend && 
            warParticipants.includes(nation.diplomaticRelations.bestFriend)) {
            bonus += 0.15;
        }
        
        // Nemesis bonus (15% when fighting nemesis)
        if (nation.diplomaticRelations.nemesis && 
            warParticipants.includes(nation.diplomaticRelations.nemesis)) {
            bonus += 0.15;
        }
        
        // Maximum theoretical bonus: 5 friends (25%) + 5 foes (25%) + best friend (15%) + nemesis (15%) = 80%
        // But in practice, if all 12 are in a war, it's even higher due to cross-stacking
        
        return Math.min(bonus, 1.25); // Cap at 125% bonus
    }
    
    /**
     * Get improvement information
     */
    getImprovementInfo(data) {
        const { improvementType, nation } = data || {};
        
        if (!this.improvementTypes[improvementType]) {
            return null;
        }
        
        return {
            ...this.improvementTypes[improvementType],
            canAfford: nation ? this.canAffordImprovement(nation, this.improvementTypes[improvementType]) : false,
            currentCount: nation ? this.getImprovementCount(nation, improvementType) : 0
        };
    }
    
    /**
     * Demolish improvement
     */
    demolishImprovement(data) {
        const { improvementType, nation } = data || {};
        
        if (!nation) {
            console.warn('demolish_improvement: missing nation');
            return false;
        }
        
        if (!nation.improvements?.[improvementType] || nation.improvements[improvementType] <= 0) {
            console.warn(`No ${improvementType} to demolish`);
            return false;
        }
        
        const improvement = this.improvementTypes[improvementType];

        if (!improvement) {
            console.warn(`Unknown improvement type: ${improvementType}`);
            return false;
        }

        // Permanent buildings cannot be demolished
        if (improvement.permanent) {
            console.warn(`${improvement.name} is permanent and cannot be demolished`);
            return false;
        }

        // Calculate resource recovery if salvage yard exists
        let recoveredResources = {};
        if (nation.projectEffects?.resourceRecovery && improvement.cost) {
            // Check if enhanced salvage rates are available from wonders
            const recoveryRate = nation.wonderEffects?.improvementRecoveryRate ||
                               nation.projectEffects.improvementRecoveryRate || 0.15;
                                
            const recoveredMoney = Math.floor(improvement.cost.money * recoveryRate);
            
            // Return recovered money to nation
            nation.money += recoveredMoney;
            
            recoveredResources.money = recoveredMoney;
        }
        
        nation.improvements[improvementType]--;
        
        // Handle special demolition effects
        if (improvementType === 'embassy') {
            this.handleEmbassyDemolition(nation);
        }
        
        // Recalculate supreme military wonder bonuses first so they are read
        // by applyImprovementEffects during the rebuild below.
        if (['barracks', 'factory', 'airforceBase', 'harbor'].includes(improvementType) && 
            nation.wonderEffects?.supremeMilitaryBonus && window.WondersSystem) {
            window.WondersSystem.applySupremeMilitaryEffects(nation);
        }
        
        // Reapply effects (full rebuild so pollution accumulators do not compound)
        this.rebuildAllImprovementEffects(nation);
        
        // Recalculate food/water wonder effects if it's a farm or well
        if (['farm', 'well'].includes(improvementType) && window.WondersSystem) {
            if (nation.wonders?.abundanceTemple > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'abundanceTemple');
            }
            if (nation.wonders?.aqueductOfLife > 0) {
                window.WondersSystem.applyWonderEffects(nation, 'aqueductOfLife');
            }
        }
        
        EventBus.emit('improvement_demolished', {
            type: improvementType,
            count: nation.improvements[improvementType],
            recoveredResources: recoveredResources,
            nation: nation
        });
        
        return true;
    }
    
    /**
     * Handle embassy demolition effects
     */
    handleEmbassyDemolition(nation) {
        if (!nation.diplomaticRelations) return;
        
        const maxRelations = nation.improvements.embassy || 0;

        if (!nation.diplomaticRelations.friends) nation.diplomaticRelations.friends = [];
        if (!nation.diplomaticRelations.foes) nation.diplomaticRelations.foes = [];

        // Remove excess friends/foes
        if (nation.diplomaticRelations.friends.length > maxRelations) {
            const removed = nation.diplomaticRelations.friends.splice(maxRelations);
            console.log(`Removed friends due to embassy demolition: ${removed.join(', ')}`);
        }
        
        if (nation.diplomaticRelations.foes.length > maxRelations) {
            const removed = nation.diplomaticRelations.foes.splice(maxRelations);
            console.log(`Removed foes due to embassy demolition: ${removed.join(', ')}`);
        }
        
        // Remove best friend/nemesis if less than 5 embassies
        if (maxRelations < 5) {
            nation.diplomaticRelations.bestFriend = null;
            nation.diplomaticRelations.nemesis = null;
            nation.diplomaticRelations.canSelectBestFriend = false;
            nation.diplomaticRelations.canSelectNemesis = false;
        }
    }
    
    /**
     * Get all improvements for a nation
     */
    getNationImprovements(nation) {
        const improvements = {};
        
        Object.keys(this.improvementTypes).forEach(type => {
            improvements[type] = {
                ...this.improvementTypes[type],
                count: this.getImprovementCount(nation, type),
                canAfford: this.canAffordImprovement(nation, this.improvementTypes[type]),
                isMaxed: this.getImprovementCount(nation, type) >= this.improvementTypes[type].maxCount
            };
        });
        
        return improvements;
    }
    
    /**
     * Destroy the improvements system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        if (EventBus) {
            EventBus.off('get_improvement_info', this.getImprovementInfo, this);
        }
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImprovementsSystem;
} else {
    window.ImprovementsSystem = ImprovementsSystem;
}