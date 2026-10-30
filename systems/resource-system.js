/**
 * Resource System - Empire Builder
 * Handles basic resources, manufacturing, and bonus resource effects
 */

class ResourceSystem {
    constructor() {
        this.isInitialized = false;
        
        // Resource definitions
        this.basicResources = new Set([
            'iron', 'lead', 'lumber', 'water', 'food', 'uranium', 'coal', 'oil', 'limestone', 'bauxite'
        ]);
        
        this.manufacturedResources = new Set([
            'steel', 'ammo', 'paper', 'cookedFood', 'cement', 'gas', 'aluminum'
        ]);
        
        this.bonusResources = new Set([
            'construction', 'automobiles', 'armsPile', 'basicNeeds', 'books'
        ]);
        
        // Manufacturing recipes
        this.manufacturingRecipes = {
            steel: { inputs: { iron: 2 }, output: 1, description: 'Used for tanks and ships' },
            ammo: { inputs: { lead: 1 }, output: 2, description: 'Used for military units' },
            paper: { inputs: { lumber: 1 }, output: 3, description: 'Used for diplomacy' },
            cookedFood: { inputs: { water: 1, food: 1 }, output: 2, description: 'Consumed for energy' },
            cement: { inputs: { limestone: 2 }, output: 1, description: 'Used for Wonders and Projects' },
            gas: { inputs: { oil: 1 }, output: 1, description: 'Used for military' },
            aluminum: { inputs: { bauxite: 2 }, output: 1, description: 'Used for planes, missiles, nukes' }
        };
        
        // Bonus resource requirements and effects
        this.bonusRequirements = {
            construction: {
                required: ['iron', 'limestone', 'cement', 'oil', 'steel'],
                effects: { infraCostReduction: 0.15, buildSpeedBonus: 0.25 },
                description: 'Reduces infrastructure costs by 15%, increases build speed by 25%'
            },
            automobiles: {
                required: ['oil', 'steel', 'construction'],
                techRequirement: { tech: 1000 },
                effects: { populationGrowth: 0.10, tradeBonus: 0.20 },
                description: 'Increases population growth by 10%, trade efficiency by 20%'
            },
            armsPile: {
                required: ['gas', 'ammo', 'steel', 'aluminum'],
                effects: { militaryStrengthBonus: 0.30, unitCostReduction: 0.20 },
                description: 'Increases military strength by 30%, reduces unit costs by 20%'
            },
            basicNeeds: {
                required: ['food', 'water', 'cement', 'lumber'],
                effects: { happinessBonus: 2, populationGrowth: 0.15 },
                description: 'Provides +2 happiness, increases population growth by 15%'
            },
            books: {
                required: ['lead', 'paper'],
                techRequirement: { tech: 50 },
                effects: { researchBonus: 0.25, diplomacyBonus: 0.15 },
                description: 'Increases research speed by 25%, diplomacy effectiveness by 15%'
            }
        };
        
        // Critical resources for happiness
        this.criticalResources = new Set(['water', 'food']);
        
        // Territory resource distribution (what each nation starts with ONE of)
        this.territoryResourceTypes = [
            'iron', 'lead', 'lumber', 'water', 'food', 'uranium', 'coal', 'oil', 'limestone', 'bauxite'
        ];
        
        this.initialize();
    }
    
    /**
     * Initialize the resource system
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.isInitialized = true;
        
        console.log('Resource System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED, this.processDaily, this);
        EventBus.on(GameEvents.MONTH_PASSED, this.processMonthly, this);
        EventBus.on('manufacture_resource', this.manufactureResource, this);
        EventBus.on('trade_resources', this.tradeResources, this);
    }
    
    /**
     * Get all resource definitions
     */
    getAllResources() {
        return {
            basic: Array.from(this.basicResources),
            manufactured: Array.from(this.manufacturedResources),
            bonus: Array.from(this.bonusResources)
        };
    }
    
    /**
     * Get resource information
     */
    getResourceInfo(resourceType) {
        if (this.basicResources.has(resourceType)) {
            return {
                type: 'basic',
                category: 'Basic Resource',
                isCritical: this.criticalResources.has(resourceType),
                description: this.getBasicResourceDescription(resourceType)
            };
        }
        
        if (this.manufacturedResources.has(resourceType)) {
            const recipe = this.manufacturingRecipes[resourceType];
            return {
                type: 'manufactured',
                category: 'Manufactured Resource',
                recipe: recipe,
                description: recipe.description
            };
        }
        
        if (this.bonusResources.has(resourceType)) {
            const bonus = this.bonusRequirements[resourceType];
            return {
                type: 'bonus',
                category: 'Bonus Resource',
                requirements: bonus.required,
                techRequirement: bonus.techRequirement,
                effects: bonus.effects,
                description: bonus.description
            };
        }
        
        return null;
    }
    
    /**
     * Get basic resource descriptions
     */
    getBasicResourceDescription(resource) {
        const descriptions = {
            iron: 'Essential metal for construction and manufacturing steel',
            lead: 'Heavy metal used for ammunition production',
            lumber: 'Wood resource for construction and paper manufacturing',
            water: 'CRITICAL - Required for population survival and food processing',
            food: 'CRITICAL - Required for population survival and energy production',
            uranium: 'Radioactive element for advanced energy and nuclear weapons',
            coal: 'Fossil fuel for energy production and industrial processes',
            oil: 'Liquid fuel for transportation, military, and chemical production',
            limestone: 'Sedimentary rock for cement and construction materials',
            bauxite: 'Aluminum ore for aerospace and advanced manufacturing'
        };
        return descriptions[resource] || 'Unknown resource';
    }
    
    /**
     * Process daily resource operations
     */
    processDaily(data) {
        if (!window.Nation) return;
        
        // Generate basic resources from territory
        this.generateTerritoryResources();
        
        // Process manufacturing
        this.processManufacturing();
        
        // Calculate bonus effects
        this.calculateBonusEffects();
        
        // Check critical resource penalties
        this.applyCriticalResourcePenalties();
        
        EventBus.emit('resources_updated', {
            resources: window.Nation.resources,
            bonusEffects: window.Nation.bonusEffects
        });
    }
    
    /**
     * Generate resources from nation's territory
     */
    generateTerritoryResources() {
        if (!window.Nation || !window.Nation.resources) return;
        
        const nation = window.Nation;
        
        // Base resource production: 0.1 units per turn per mine
        let baseProduction = 0.1;
        
        // Apply mine bonuses to basic resource production
        let mineBonus = 1.0;
        if (nation.improvementEffects?.basicResourceBonus) {
            mineBonus += nation.improvementEffects.basicResourceBonus; // +10% per mine
        }
        
        // Apply project bonus that doubles mine efficiency
        if (nation.projectEffects?.enhancedMineEfficiency) {
            mineBonus *= 2.0; // Double efficiency from project
        }
        
        // Apply wonder bonuses for mine efficiency
        if (nation.wonderEffects?.supremeMineEfficiency) {
            mineBonus *= 1.5; // Additional 50% from wonder
        }
        
        // Calculate final production per mine
        const productionPerMine = baseProduction * mineBonus;
        const mineCount = nation.improvements?.mine || 0;
        
        // Each nation produces only its primary resource, scaled by mine count
        if (nation.primaryResource && this.basicResources.has(nation.primaryResource) && mineCount > 0) {
            const production = productionPerMine * mineCount;
            nation.resources[nation.primaryResource] = (nation.resources[nation.primaryResource] || 0) + production;
        }
    }
    
    /**
     * Process automatic manufacturing
     */
    processManufacturing() {
        if (!window.Nation || !window.Nation.resources) return;
        
        const nation = window.Nation;
        
        // Base manufacturing rate: 0.05 units per turn per assembly plant
        const baseManufacturingRate = 0.05;
        const assemblyPlantCount = nation.improvements?.assemblyPlant || 0;
        
        if (assemblyPlantCount === 0) return; // No production without assembly plants
        
        // Apply assembly plant bonuses
        let manufacturingBonus = 1.0;
        if (nation.improvementEffects?.manufacturedGoodsBonus) {
            manufacturingBonus += nation.improvementEffects.manufacturedGoodsBonus; // +5% per assembly plant
        }
        
        // Apply project bonus that doubles assembly plant efficiency
        if (nation.projectEffects?.enhancedAssemblyEfficiency) {
            manufacturingBonus *= 2.0; // Double efficiency from project
        }
        
        // Apply wonder bonuses for assembly plant efficiency
        if (nation.wonderEffects?.supremeAssemblyEfficiency) {
            manufacturingBonus *= 1.5; // Additional 50% from wonder
        }
        
        // Calculate production rate per assembly plant
        const productionRate = baseManufacturingRate * manufacturingBonus;
        const totalProduction = productionRate * assemblyPlantCount;
        
        // Auto-manufacture if resources are available
        Object.entries(this.manufacturingRecipes).forEach(([product, recipe]) => {
            // Check if we can manufacture at least one batch
            const canManufacture = Object.entries(recipe.inputs).every(([input, required]) => {
                return (nation.resources[input] || 0) >= required;
            });
            
            if (canManufacture && totalProduction > 0) {
                // Calculate how many batches we can make with available resources
                let maxBatches = totalProduction / recipe.output;
                
                // Limit by available input resources
                Object.entries(recipe.inputs).forEach(([input, required]) => {
                    const availableBatches = (nation.resources[input] || 0) / required;
                    maxBatches = Math.min(maxBatches, availableBatches);
                });
                
                if (maxBatches > 0) {
                    // Consume inputs proportionally
                    Object.entries(recipe.inputs).forEach(([input, required]) => {
                        nation.resources[input] -= required * maxBatches;
                    });
                    
                    // Produce output
                    const outputAmount = recipe.output * maxBatches;
                    nation.resources[product] = (nation.resources[product] || 0) + outputAmount;
                }
            }
        });
    }
    
    /**
     * Calculate and apply bonus resource effects
     */
    calculateBonusEffects() {
        if (!window.Nation) return;
        
        const nation = window.Nation;
        nation.bonusEffects = nation.bonusEffects || {};
        nation.currentBonuses = {};
        
        // Reset bonus effects
        Object.keys(this.bonusRequirements).forEach(bonus => {
            nation.bonusEffects[bonus] = false;
        });
        
        // Check each bonus resource
        Object.entries(this.bonusRequirements).forEach(([bonusName, requirements]) => {
            const hasAllResources = requirements.required.every(resource => {
                if (resource === 'water' && nation.wonderEffects?.simulatedWaterAccess) return true;
                if (resource === 'food' && nation.wonderEffects?.simulatedFoodAccess) return true;
                return this.bonusResources.has(resource) ? !!nation.bonusEffects[resource] : (nation.resources[resource] || 0) > 0;
            });
            
            const meetsTechRequirement = !requirements.techRequirement || 
                (nation.effectiveTech ?? nation.tech) >= requirements.techRequirement.tech;
            
            if (hasAllResources && meetsTechRequirement) {
                nation.bonusEffects[bonusName] = true;
                
                // Apply effects to nation stats
                this.applyBonusEffects(bonusName, requirements.effects);
            }
        });
    }
    
    /**
     * Apply bonus effects to nation
     */
    applyBonusEffects(bonusName, effects) {
        if (!window.Nation) return;
        
        const nation = window.Nation;
        
        // Store current bonus multipliers for UI display
        nation.currentBonuses = nation.currentBonuses || {};
        nation.currentBonuses[bonusName] = effects;
        
        // Effects are calculated in real-time in relevant systems
        // This just tracks which bonuses are active
    }
    
    /**
     * Apply happiness penalties for missing critical resources
     */
    applyCriticalResourcePenalties() {
        if (!window.Nation) return;
        
        const nation = window.Nation;
        let happinessPenalty = 0;
        
        this.criticalResources.forEach(resource => {
            let hasResource = (nation.resources[resource] || 0) > 0;
            
            // Check wonder effects that provide resource independence
            if (resource === 'water' && nation.wonderEffects?.waterIndependence) {
                hasResource = true; // Atmospheric Water Generator provides water independence
            }
            if (resource === 'food' && nation.wonderEffects?.foodIndependence) {
                hasResource = true; // Hydroponic Crop Farm provides food independence
            }
            
            if (!hasResource) {
                happinessPenalty -= 1;
            }
        });
        
        if (happinessPenalty < 0) {
            nation.criticalResourcePenalty = Math.abs(happinessPenalty);
            // Penalty is applied in happiness calculation
        } else {
            nation.criticalResourcePenalty = 0;
        }
    }
    
    /**
     * Manual manufacturing function
     */
    manufactureResource(data) {
        const { resourceType, quantity = 1 } = data;
        
        if (!this.manufacturingRecipes[resourceType]) {
            console.warn(`No recipe found for ${resourceType}`);
            return false;
        }
        
        if (!window.Nation || !window.Nation.resources) return false;
        
        const nation = window.Nation;
        const recipe = this.manufacturingRecipes[resourceType];
        
        // Check if we have enough inputs
        for (const [input, required] of Object.entries(recipe.inputs)) {
            if ((nation.resources[input] || 0) < required * quantity) {
                console.warn(`Insufficient ${input} for manufacturing ${resourceType}`);
                return false;
            }
        }
        
        // Consume inputs
        Object.entries(recipe.inputs).forEach(([input, required]) => {
            nation.resources[input] -= required * quantity;
        });
        
        // Produce output
        nation.resources[resourceType] = (nation.resources[resourceType] || 0) + (recipe.output * quantity);
        
        EventBus.emit('manufacturing_completed', {
            product: resourceType,
            quantity: recipe.output * quantity,
            consumed: Object.fromEntries(
                Object.entries(recipe.inputs).map(([input, required]) => [input, required * quantity])
            )
        });
        
        return true;
    }
    
    /**
     * Trade resources between nations
     */
    tradeResources(data) {
        const { partnerId, offering, requesting } = data;
        
        if (!window.Nation || !window.Nation.resources) return false;
        
        const nation = window.Nation;
        
        // Check if we have enough resources to trade
        for (const [resource, amount] of Object.entries(offering)) {
            if ((nation.resources[resource] || 0) < amount) {
                console.warn(`Insufficient ${resource} for trade`);
                return false;
            }
        }
        
        // Execute trade (simplified - would involve partner nation in real implementation)
        Object.entries(offering).forEach(([resource, amount]) => {
            nation.resources[resource] -= amount;
        });
        
        Object.entries(requesting).forEach(([resource, amount]) => {
            nation.resources[resource] = (nation.resources[resource] || 0) + amount;
        });
        
        EventBus.emit('trade_completed', {
            partner: partnerId,
            offered: offering,
            received: requesting
        });
        
        return true;
    }
    
    /**
     * Get resource production summary
     */
    getProductionSummary() {
        if (!window.Nation) return {};
        
        const nation = window.Nation;
        const summary = {
            basic: {},
            manufactured: {},
            bonus: {},
            criticalStatus: {}
        };
        
        // Basic resource production
        this.basicResources.forEach(resource => {
            summary.basic[resource] = {
                current: nation.resources[resource] || 0,
                isProduced: resource === nation.primaryResource,
                isCritical: this.criticalResources.has(resource)
            };
        });
        
        // Manufactured resource status
        this.manufacturedResources.forEach(resource => {
            summary.manufactured[resource] = {
                current: nation.resources[resource] || 0,
                recipe: this.manufacturingRecipes[resource],
                canManufacture: this.canManufacture(resource)
            };
        });
        
        // Bonus resource status
        Object.entries(this.bonusRequirements).forEach(([bonus, requirements]) => {
            summary.bonus[bonus] = {
                active: nation.bonusEffects[bonus] || false,
                requirements: requirements.required,
                techRequirement: requirements.techRequirement,
                effects: requirements.effects
            };
        });
        
        // Critical resource status
        this.criticalResources.forEach(resource => {
            summary.criticalStatus[resource] = {
                available: (nation.resources[resource] || 0) > 0,
                penalty: !((nation.resources[resource] || 0) > 0) ? -1 : 0
            };
        });
        
        return summary;
    }
    
    /**
     * Check if a manufactured resource can be produced
     */
    canManufacture(resourceType) {
        if (!this.manufacturingRecipes[resourceType] || !window.Nation) return false;
        
        const recipe = this.manufacturingRecipes[resourceType];
        const nation = window.Nation;
        
        return Object.entries(recipe.inputs).every(([input, required]) => {
            return (nation.resources[input] || 0) >= required;
        });
    }
    
    /**
     * Get bonus effect multipliers for calculations
     */
    getBonusMultipliers() {
        if (!window.Nation || !window.Nation.bonusEffects) return {};
        
        const multipliers = {};
        const nation = window.Nation;
        
        // Infrastructure cost reduction from Construction bonus
        if (nation.bonusEffects.construction) {
            multipliers.infraCostReduction = 0.15;
            multipliers.buildSpeedBonus = 0.25;
        }
        
        // Population growth from Automobiles and Basic Needs
        multipliers.populationGrowth = 1.0;
        if (nation.bonusEffects.automobiles) multipliers.populationGrowth += 0.10;
        if (nation.bonusEffects.basicNeeds) multipliers.populationGrowth += 0.15;
        
        // Military bonuses from Arms Pile
        if (nation.bonusEffects.armsPile) {
            multipliers.militaryStrengthBonus = 0.30;
            multipliers.unitCostReduction = 0.20;
        }
        
        // Research bonus from Books
        if (nation.bonusEffects.books) {
            multipliers.researchBonus = 0.25;
            multipliers.diplomacyBonus = 0.15;
        }
        
        // Trade bonus from Automobiles
        if (nation.bonusEffects.automobiles) {
            multipliers.tradeBonus = 0.20;
        }
        
        // Happiness bonus from Basic Needs
        if (nation.bonusEffects.basicNeeds) {
            multipliers.happinessBonus = 2;
        }
        
        return multipliers;
    }
    
    /**
     * Process monthly resource operations
     */
    processMonthly(data) {
        if (!window.Nation) return;
        
        // Monthly resource decay for perishables
        const nation = window.Nation;
        
        // Food spoilage (5% loss per month)
        if (nation.resources.food > 0) {
            const spoilage = Math.floor(nation.resources.food * 0.05);
            nation.resources.food = Math.max(0, nation.resources.food - spoilage);
        }
        
        // Cooked food spoilage (10% loss per month)
        if (nation.resources.cookedFood > 0) {
            const spoilage = Math.floor(nation.resources.cookedFood * 0.10);
            nation.resources.cookedFood = Math.max(0, nation.resources.cookedFood - spoilage);
        }
    }
    
    /**
     * Assign primary resource to nation
     */
    assignPrimaryResource(nationId, resourceType) {
        if (!this.basicResources.has(resourceType)) {
            console.warn(`Invalid primary resource: ${resourceType}`);
            return false;
        }
        
        if (window.Nation) {
            window.Nation.primaryResource = resourceType;
            console.log(`Nation assigned primary resource: ${resourceType}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Destroy the resource system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        EventBus.off(GameEvents.DAY_PASSED, this.processDaily, this);
        EventBus.off(GameEvents.MONTH_PASSED, this.processMonthly, this);
        EventBus.off('manufacture_resource', this.manufactureResource, this);
        EventBus.off('trade_resources', this.tradeResources, this);
        
        this.isInitialized = false;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResourceSystem;
} else {
    window.ResourceSystem = ResourceSystem;
}