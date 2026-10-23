/**
 * Resource Entity - Represents resource deposits, production, and trade
 * Integrates with Nation's ResourceSystem and territory management
 */

class Resource {
    constructor(type, amount = 0, location = null) {
        this.id = this.generateId();
        this.type = type;
        this.amount = amount;
        this.location = location; // Territory/City where resource is located
        this.discovered = Date.now();
        
        // Resource Properties (matches Nation's resource system)
        this.quality = this.generateQuality();
        this.accessibility = this.generateAccessibility();
        this.renewability = this.getResourceRenewability();
        this.extractionRate = this.calculateExtractionRate();
        
        // Production & Extraction (integrates with Nation.resources)
        this.isBeingExtracted = false;
        this.extractionMethod = null;
        this.dailyProduction = 0;
        this.totalExtracted = 0;
        this.remainingDeposits = this.calculateInitialDeposits();
        
        // Economic Data (integrates with Nation's economy)
        this.marketValue = this.getMarketValue();
        this.lastPriceUpdate = Date.now();
        this.priceHistory = [];
        this.tradeVolume = 0;
        
        // Infrastructure (links to Nation buildings)
        this.extractionFacilities = []; // Building IDs that extract this resource
        this.transportationLinks = [];
        this.storageCapacity = 0;
        this.currentStorage = 0;
        
        // Environmental & Social (affects Nation stats)
        this.environmentalImpact = this.calculateEnvironmentalImpact();
        this.socialImpact = 0;
        this.sustainabilityRating = this.calculateSustainability();
        
        // Integration with Nation systems
        this.contributesToNationResources = true;
        this.affectedByNationEfficiency = true;
        this.isPrimaryResource = false; // Is this the Nation's primary resource?
        
        // Events
        this.eventHistory = [];
        
        this.initializeResourceData();
    }
    
    generateId() {
        return 'resource_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESOURCE INITIALIZATION (Uses Nation's Resource System)
    // ═══════════════════════════════════════════════════════════════════════
    
    initializeResourceData() {
        const resourceData = this.getNationResourceTypeData();
        if (resourceData) {
            this.baseValue = resourceData.baseValue;
            this.category = resourceData.category;
            this.rarity = resourceData.rarity;
            this.uses = [...resourceData.uses];
            this.renewability = resourceData.renewable;
            this.environmentalImpact = this.calculateEnvironmentalImpact();
        }
        
        // Check if this is Nation's primary resource
        if (window.Nation?.primaryResource === this.type) {
            this.isPrimaryResource = true;
        }
    }
    
    getNationResourceTypeData() {
        // Use Nation's resource system data if available
        if (window.GameEngine?.systems?.resources) {
            const resourceSystem = window.GameEngine.systems.resources;
            
            // Check basic resources
            if (resourceSystem.basicResources && resourceSystem.basicResources.has(this.type)) {
                return this.getBasicResourceData();
            }
            
            // Check manufactured resources
            if (resourceSystem.manufacturedResources && resourceSystem.manufacturedResources.has(this.type)) {
                return this.getManufacturedResourceData();
            }
        }
        
        // Fallback to our resource data matching Nation's system
        return this.getResourceTypeData();
    }
    
    getBasicResourceData() {
        // Basic resource data matching Nation's system
        const basicResources = {
            iron: {
                category: 'mineral',
                baseValue: 50,
                rarity: 'common',
                renewable: false,
                uses: ['construction', 'manufacturing', 'military'],
                environmentalImpact: 'medium',
                extractionBuildings: ['mine'],
                productionRate: 0.1 // Per mine per day
            },
            lead: {
                category: 'mineral',
                baseValue: 75,
                rarity: 'common', 
                renewable: false,
                uses: ['ammunition', 'batteries', 'radiation_shielding'],
                environmentalImpact: 'high',
                extractionBuildings: ['mine'],
                productionRate: 0.1
            },
            lumber: {
                category: 'organic',
                baseValue: 30,
                rarity: 'common',
                renewable: true,
                uses: ['construction', 'paper', 'fuel'],
                environmentalImpact: 'low',
                extractionBuildings: ['lumbermill'],
                productionRate: 0.15
            },
            water: {
                category: 'essential',
                baseValue: 20,
                rarity: 'common',
                renewable: true,
                uses: ['survival', 'agriculture', 'industry'],
                environmentalImpact: 'none',
                extractionBuildings: ['well'],
                productionRate: 0.25,
                criticalResource: true
            },
            food: {
                category: 'essential',
                baseValue: 25,
                rarity: 'common',
                renewable: true,
                uses: ['survival', 'population_growth'],
                environmentalImpact: 'low',
                extractionBuildings: ['farm'],
                productionRate: 0.20,
                criticalResource: true
            },
            uranium: {
                category: 'mineral',
                baseValue: 500,
                rarity: 'rare',
                renewable: false,
                uses: ['nuclear_power', 'nuclear_weapons'],
                environmentalImpact: 'very_high',
                extractionBuildings: ['mine'],
                productionRate: 0.05
            },
            coal: {
                category: 'mineral',
                baseValue: 40,
                rarity: 'common',
                renewable: false,
                uses: ['energy', 'steel_production'],
                environmentalImpact: 'high',
                extractionBuildings: ['mine'],
                productionRate: 0.1
            },
            oil: {
                category: 'mineral',
                baseValue: 80,
                rarity: 'uncommon',
                renewable: false,
                uses: ['fuel', 'plastics', 'chemicals'],
                environmentalImpact: 'high',
                extractionBuildings: ['drill', 'mine'],
                productionRate: 0.08
            },
            limestone: {
                category: 'mineral',
                baseValue: 35,
                rarity: 'common',
                renewable: false,
                uses: ['construction', 'cement'],
                environmentalImpact: 'medium',
                extractionBuildings: ['mine'],
                productionRate: 0.1
            },
            bauxite: {
                category: 'mineral',
                baseValue: 120,
                rarity: 'uncommon',
                renewable: false,
                uses: ['aluminum_production'],
                environmentalImpact: 'medium',
                extractionBuildings: ['mine'],
                productionRate: 0.07
            }
        };
        
        return basicResources[this.type] || null;
    }
    
    getManufacturedResourceData() {
        // Manufactured resource data matching Nation's system
        const manufacturedResources = {
            steel: {
                category: 'manufactured',
                baseValue: 100,
                rarity: 'common',
                renewable: false, // Depends on input materials
                uses: ['construction', 'military', 'infrastructure'],
                environmentalImpact: 'medium',
                requiredInputs: { iron: 2, coal: 1 },
                productionBuildings: ['factory', 'assemblyPlant'],
                productionRate: 1.0
            },
            ammo: {
                category: 'manufactured',
                baseValue: 150,
                rarity: 'common',
                renewable: false,
                uses: ['military', 'hunting'],
                environmentalImpact: 'low',
                requiredInputs: { lead: 1, steel: 0.5 },
                productionBuildings: ['factory'],
                productionRate: 0.8
            },
            paper: {
                category: 'manufactured',
                baseValue: 40,
                rarity: 'common',
                renewable: true, // Depends on lumber
                uses: ['administration', 'knowledge', 'trade'],
                environmentalImpact: 'low',
                requiredInputs: { lumber: 2 },
                productionBuildings: ['assemblyPlant'],
                productionRate: 1.5
            },
            cookedFood: {
                category: 'manufactured',
                baseValue: 60,
                rarity: 'common',
                renewable: true,
                uses: ['nutrition', 'happiness', 'intuition_restoration'],
                environmentalImpact: 'none',
                requiredInputs: { food: 1 },
                productionBuildings: ['kitchen', 'assemblyPlant'],
                productionRate: 1.2
            },
            cement: {
                category: 'manufactured',
                baseValue: 80,
                rarity: 'common',
                renewable: false,
                uses: ['construction', 'infrastructure'],
                environmentalImpact: 'medium',
                requiredInputs: { limestone: 2, coal: 0.5 },
                productionBuildings: ['assemblyPlant'],
                productionRate: 1.0
            },
            gas: {
                category: 'manufactured',
                baseValue: 70,
                rarity: 'common',
                renewable: false,
                uses: ['fuel', 'heating', 'industrial'],
                environmentalImpact: 'medium',
                requiredInputs: { oil: 1 },
                productionBuildings: ['refinery', 'assemblyPlant'],
                productionRate: 0.9
            },
            aluminum: {
                category: 'manufactured',
                baseValue: 200,
                rarity: 'uncommon',
                renewable: false,
                uses: ['aerospace', 'electronics', 'construction'],
                environmentalImpact: 'medium',
                requiredInputs: { bauxite: 3 },
                productionBuildings: ['smelter', 'assemblyPlant'],
                productionRate: 0.6
            }
        };
        
        return manufacturedResources[this.type] || null;
    }
    
    getResourceTypeData() {
        const resourceTypes = {
            // Basic Resources
            iron: {
                category: 'mineral',
                baseValue: 50,
                rarity: 'common',
                renewable: false,
                uses: ['construction', 'manufacturing', 'military'],
                environmentalImpact: 'medium'
            },
            lead: {
                category: 'mineral',
                baseValue: 75,
                rarity: 'common',
                renewable: false,
                uses: ['ammunition', 'batteries', 'radiation_shielding'],
                environmentalImpact: 'high'
            },
            lumber: {
                category: 'organic',
                baseValue: 30,
                rarity: 'common',
                renewable: true,
                uses: ['construction', 'paper', 'fuel'],
                environmentalImpact: 'low'
            },
            water: {
                category: 'essential',
                baseValue: 20,
                rarity: 'common',
                renewable: true,
                uses: ['survival', 'agriculture', 'industry'],
                environmentalImpact: 'none'
            },
            food: {
                category: 'essential',
                baseValue: 25,
                rarity: 'common',
                renewable: true,
                uses: ['survival', 'population_growth'],
                environmentalImpact: 'low'
            },
            uranium: {
                category: 'mineral',
                baseValue: 500,
                rarity: 'rare',
                renewable: false,
                uses: ['nuclear_power', 'nuclear_weapons'],
                environmentalImpact: 'very_high'
            },
            coal: {
                category: 'mineral',
                baseValue: 40,
                rarity: 'common',
                renewable: false,
                uses: ['energy', 'steel_production'],
                environmentalImpact: 'high'
            },
            oil: {
                category: 'mineral',
                baseValue: 80,
                rarity: 'uncommon',
                renewable: false,
                uses: ['fuel', 'plastics', 'chemicals'],
                environmentalImpact: 'high'
            },
            limestone: {
                category: 'mineral',
                baseValue: 35,
                rarity: 'common',
                renewable: false,
                uses: ['construction', 'cement'],
                environmentalImpact: 'medium'
            },
            bauxite: {
                category: 'mineral',
                baseValue: 120,
                rarity: 'uncommon',
                renewable: false,
                uses: ['aluminum_production'],
                environmentalImpact: 'medium'
            },
            
            // Manufactured Resources
            steel: {
                category: 'manufactured',
                baseValue: 100,
                rarity: 'processed',
                renewable: false,
                uses: ['construction', 'military', 'infrastructure'],
                environmentalImpact: 'medium'
            },
            ammo: {
                category: 'manufactured',
                baseValue: 150,
                rarity: 'processed',
                renewable: false,
                uses: ['military', 'defense'],
                environmentalImpact: 'medium'
            },
            paper: {
                category: 'manufactured',
                baseValue: 40,
                rarity: 'processed',
                renewable: true,
                uses: ['administration', 'education', 'communication'],
                environmentalImpact: 'low'
            },
            cookedFood: {
                category: 'manufactured',
                baseValue: 50,
                rarity: 'processed',
                renewable: true,
                uses: ['survival', 'happiness', 'military'],
                environmentalImpact: 'low'
            },
            cement: {
                category: 'manufactured',
                baseValue: 60,
                rarity: 'processed',
                renewable: false,
                uses: ['construction', 'infrastructure'],
                environmentalImpact: 'medium'
            },
            gas: {
                category: 'manufactured',
                baseValue: 90,
                rarity: 'processed',
                renewable: false,
                uses: ['fuel', 'heating', 'power'],
                environmentalImpact: 'medium'
            },
            aluminum: {
                category: 'manufactured',
                baseValue: 180,
                rarity: 'processed',
                renewable: false,
                uses: ['aerospace', 'electronics', 'construction'],
                environmentalImpact: 'medium'
            }
        };
        
        return resourceTypes[this.type] || null;
    }
    
    generateQuality() {
        // Random quality between 50-100
        return 50 + Math.random() * 50;
    }
    
    generateAccessibility() {
        // Random accessibility between 20-100
        return 20 + Math.random() * 80;
    }
    
    getResourceRenewability() {
        const resourceData = this.getResourceTypeData();
        return resourceData ? resourceData.renewable : false;
    }
    
    calculateInitialDeposits() {
        if (this.renewability) {
            return Number.MAX_SAFE_INTEGER; // Renewable resources never run out
        }
        
        // Non-renewable resources have finite deposits
        const baseDeposits = this.amount * (10 + Math.random() * 40); // 10-50x initial amount
        return Math.floor(baseDeposits * (this.quality / 100));
    }
    
    calculateExtractionRate() {
        const baseRate = this.amount * 0.1; // 10% of total per day base
        const qualityModifier = this.quality / 100;
        const accessibilityModifier = this.accessibility / 100;
        
        return Math.floor(baseRate * qualityModifier * accessibilityModifier);
    }
    
    getMarketValue() {
        const resourceData = this.getResourceTypeData();
        if (!resourceData) return 10;
        
        let value = resourceData.baseValue;
        
        // Quality affects value
        value *= (0.5 + (this.quality / 100));
        
        // Rarity affects value
        const rarityMultipliers = {
            common: 1.0,
            uncommon: 1.5,
            rare: 2.5,
            very_rare: 4.0,
            legendary: 10.0
        };
        value *= (rarityMultipliers[resourceData.rarity] || 1.0);
        
        return Math.floor(value);
    }
    
    calculateEnvironmentalImpact() {
        const resourceData = this.getResourceTypeData();
        if (!resourceData) return 0;
        
        const impactLevels = {
            none: 0,
            low: 10,
            medium: 25,
            high: 50,
            very_high: 100
        };
        
        return impactLevels[resourceData.environmentalImpact] || 0;
    }
    
    calculateSustainability() {
        let sustainability = 100;
        
        // Renewable resources are more sustainable
        if (!this.renewability) {
            sustainability -= 30;
        }
        
        // Environmental impact reduces sustainability
        sustainability -= this.environmentalImpact;
        
        // Extraction method affects sustainability
        if (this.extractionMethod === 'strip_mining') {
            sustainability -= 20;
        } else if (this.extractionMethod === 'deep_drilling') {
            sustainability -= 10;
        }
        
        return Math.max(0, Math.min(100, sustainability));
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NATION INTEGRATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Contribute this resource's production to Nation resources
     */
    contributeToNation() {
        if (!window.Nation || !this.contributesToNationResources) return 0;
        
        const production = this.getDailyProduction();
        
        if (production > 0) {
            // Add to Nation's resources
            window.Nation.resources[this.type] = 
                (window.Nation.resources[this.type] || 0) + production;
            
            // Update totals
            this.totalExtracted += production;
            this.currentStorage = Math.min(this.storageCapacity || Infinity, 
                this.currentStorage + production);
            
            return production;
        }
        
        return 0;
    }
    
    /**
     * Get daily production rate accounting for Nation effects
     */
    getDailyProduction() {
        if (!this.isBeingExtracted || this.dailyProduction <= 0) return 0;
        
        let production = this.dailyProduction;
        
        // Apply Nation's resource efficiency bonuses
        if (window.Nation?.improvementEffects && this.affectedByNationEfficiency) {
            // Basic resource bonus from mines
            if (this.category === 'mineral' && window.Nation.improvementEffects.basicResourceBonus) {
                production *= (1 + window.Nation.improvementEffects.basicResourceBonus);
            }
            
            // Manufactured resource bonus from assembly plants
            if (this.category === 'manufactured' && window.Nation.improvementEffects.manufacturedResourceBonus) {
                production *= (1 + window.Nation.improvementEffects.manufacturedResourceBonus);
            }
        }
        
        // Apply Nation's project bonuses
        if (window.Nation?.projectEffects) {
            // Enhanced mine efficiency
            if (this.category === 'mineral' && window.Nation.projectEffects.enhancedMineEfficiency) {
                production *= 2.0; // Double efficiency
            }
        }
        
        // Apply Nation's wonder bonuses
        if (window.Nation?.wonderEffects) {
            // Supreme mine efficiency
            if (this.category === 'mineral' && window.Nation.wonderEffects.supremeMineEfficiency) {
                production *= 1.5; // Additional 50%
            }
        }
        
        // Apply Player skill bonuses
        if (window.Player) {
            const efficiencyBonus = window.Player.getSkillValue('industry') || 0;
            production *= (1 + efficiencyBonus);
        }
        
        return Math.floor(production);
    }
    
    /**
     * Check if Nation has required buildings for extraction
     */
    canExtract() {
        if (!window.Nation) return false;
        
        const resourceData = this.getNationResourceTypeData();
        if (!resourceData?.extractionBuildings) return true;
        
        // Check if Nation has any of the required buildings
        for (const buildingType of resourceData.extractionBuildings) {
            if (window.Nation.improvements?.[buildingType] > 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get extraction rate based on Nation's buildings
     */
    getExtractionRateFromNation() {
        if (!window.Nation) return 0;
        
        const resourceData = this.getNationResourceTypeData();
        if (!resourceData) return 0;
        
        let totalRate = 0;
        
        // Calculate rate based on Nation's buildings
        if (resourceData.extractionBuildings) {
            for (const buildingType of resourceData.extractionBuildings) {
                const buildingCount = window.Nation.improvements?.[buildingType] || 0;
                if (buildingCount > 0) {
                    totalRate += (resourceData.productionRate || 0.1) * buildingCount;
                }
            }
        }
        
        return totalRate;
    }
    
    /**
     * Apply resource effects to Nation statistics
     */
    applyEffectsToNation() {
        if (!window.Nation) return;
        
        // Apply environmental impact
        if (this.environmentalImpact > 0 && this.isBeingExtracted) {
            // Increase pollution based on extraction
            const pollutionIncrease = this.environmentalImpact * (this.dailyProduction / 100);
            window.Nation.nationStats.pollution = 
                (window.Nation.nationStats.pollution || 0) + pollutionIncrease;
        }
        
        // Critical resource penalties
        const resourceData = this.getNationResourceTypeData();
        if (resourceData?.criticalResource) {
            const currentAmount = window.Nation.resources?.[this.type] || 0;
            const requiredAmount = window.Nation.population * 0.01; // 1% of population per day
            
            if (currentAmount < requiredAmount) {
                // Apply happiness penalty for critical resource shortage
                window.Nation.criticalResourcePenalty = 
                    (window.Nation.criticalResourcePenalty || 0) + 15;
            }
        }
    }
    
    startExtraction(method = 'basic') {
        if (this.isBeingExtracted) {
            return { success: false, message: 'Resource is already being extracted' };
        }
        
        if (this.remainingDeposits <= 0) {
            return { success: false, message: 'No deposits remaining' };
        }
        
        this.isBeingExtracted = true;
        this.extractionMethod = method;
        this.updateExtractionRate();
        
        this.addEvent(`Started ${method} extraction`, 'extraction');
        
        return { success: true, message: `Extraction started using ${method} method` };
    }
    
    stopExtraction() {
        if (!this.isBeingExtracted) {
            return { success: false, message: 'No extraction in progress' };
        }
        
        this.isBeingExtracted = false;
        this.extractionMethod = null;
        this.dailyProduction = 0;
        
        this.addEvent('Stopped extraction', 'extraction');
        
        return { success: true, message: 'Extraction stopped' };
    }
    
    updateExtractionRate() {
        if (!this.isBeingExtracted) {
            this.dailyProduction = 0;
            return;
        }
        
        let rate = this.extractionRate;
        
        // Extraction method modifiers
        const methodModifiers = {
            basic: 1.0,
            advanced: 1.5,
            industrial: 2.0,
            strip_mining: 3.0,
            deep_drilling: 1.2,
            sustainable: 0.8
        };
        
        rate *= (methodModifiers[this.extractionMethod] || 1.0);
        
        // Infrastructure bonuses
        for (const facility of this.extractionFacilities) {
            rate *= (1 + facility.efficiency);
        }
        
        // Accessibility decreases over time for non-renewable resources
        if (!this.renewability) {
            const depletionRatio = 1 - (this.totalExtracted / this.remainingDeposits);
            rate *= Math.max(0.1, depletionRatio);
        }
        
        this.dailyProduction = Math.floor(rate);
    }
    
    extractDaily() {
        if (!this.isBeingExtracted || this.dailyProduction <= 0) {
            return 0;
        }
        
        let extracted = this.dailyProduction;
        
        // Check storage capacity
        if (this.storageCapacity > 0) {
            const availableStorage = this.storageCapacity - this.currentStorage;
            extracted = Math.min(extracted, availableStorage);
        }
        
        // Check remaining deposits for non-renewable resources
        if (!this.renewability) {
            extracted = Math.min(extracted, this.remainingDeposits);
            this.remainingDeposits -= extracted;
            
            if (this.remainingDeposits <= 0) {
                this.stopExtraction();
                this.addEvent('Resource depleted', 'depletion');
            }
        }
        
        this.totalExtracted += extracted;
        this.currentStorage += extracted;
        
        // Update market value based on extraction
        this.updateMarketValue();
        
        if (extracted > 0) {
            this.addEvent(`Extracted ${extracted} units`, 'production');
        }
        
        return extracted;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INFRASTRUCTURE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    addExtractionFacility(facility) {
        this.extractionFacilities.push({
            id: facility.id || Date.now(),
            name: facility.name,
            efficiency: facility.efficiency || 0.1,
            maintenance: facility.maintenance || 0,
            built: Date.now()
        });
        
        this.updateExtractionRate();
        this.addEvent(`Built ${facility.name}`, 'infrastructure');
    }
    
    upgradeStorage(additionalCapacity) {
        this.storageCapacity += additionalCapacity;
        this.addEvent(`Increased storage capacity by ${additionalCapacity}`, 'infrastructure');
    }
    
    addTransportationLink(link) {
        this.transportationLinks.push({
            id: link.id || Date.now(),
            type: link.type, // 'road', 'rail', 'pipeline', 'port'
            destination: link.destination,
            capacity: link.capacity || 100,
            built: Date.now()
        });
        
        this.addEvent(`Built ${link.type} to ${link.destination}`, 'infrastructure');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MARKET & TRADING
    // ═══════════════════════════════════════════════════════════════════════
    
    updateMarketValue() {
        const resourceData = this.getResourceTypeData();
        if (!resourceData) return;
        
        let newValue = resourceData.baseValue;
        
        // Supply affects price (more supply = lower price)
        const globalSupply = this.getGlobalSupply();
        const supplyFactor = Math.max(0.5, Math.min(2.0, 1000 / (globalSupply + 100)));
        newValue *= supplyFactor;
        
        // Demand affects price
        const demand = this.getGlobalDemand();
        const demandFactor = Math.max(0.5, Math.min(2.0, demand / 500));
        newValue *= demandFactor;
        
        // Quality still affects value
        newValue *= (0.5 + (this.quality / 100));
        
        // Store price history
        if (this.marketValue !== Math.floor(newValue)) {
            this.priceHistory.push({
                price: this.marketValue,
                timestamp: Date.now()
            });
            
            // Keep only last 30 price points
            if (this.priceHistory.length > 30) {
                this.priceHistory = this.priceHistory.slice(-30);
            }
        }
        
        this.marketValue = Math.floor(newValue);
        this.lastPriceUpdate = Date.now();
    }
    
    getGlobalSupply() {
        // This would query all resource deposits of this type
        // For now, return a simulated value
        return 500 + Math.random() * 1000;
    }
    
    getGlobalDemand() {
        // This would calculate based on usage across all nations
        // For now, return a simulated value
        return 300 + Math.random() * 700;
    }
    
    sell(quantity, buyer = null) {
        const availableToSell = Math.min(quantity, this.currentStorage);
        if (availableToSell <= 0) {
            return { success: false, amount: 0, revenue: 0 };
        }
        
        const revenue = availableToSell * this.marketValue;
        this.currentStorage -= availableToSell;
        this.tradeVolume += availableToSell;
        
        this.addEvent(`Sold ${availableToSell} units for $${revenue}`, 'trade');
        
        return {
            success: true,
            amount: availableToSell,
            revenue: revenue,
            pricePerUnit: this.marketValue
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESOURCE PROCESSING
    // ═══════════════════════════════════════════════════════════════════════
    
    canBeProcessedInto() {
        const processingChains = {
            iron: ['steel'],
            lumber: ['paper'],
            food: ['cookedFood'],
            limestone: ['cement'],
            oil: ['gas'],
            bauxite: ['aluminum'],
            lead: ['ammo']
        };
        
        return processingChains[this.type] || [];
    }
    
    getProcessingRequirements(targetResource) {
        const requirements = {
            steel: { iron: 2, coal: 1 },
            paper: { lumber: 3 },
            cookedFood: { food: 1 },
            cement: { limestone: 2 },
            gas: { oil: 1 },
            aluminum: { bauxite: 3 },
            ammo: { lead: 2, iron: 1 }
        };
        
        return requirements[targetResource] || {};
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
            amount: this.amount,
            quality: this.quality,
            accessibility: this.accessibility,
            renewability: this.renewability,
            
            // Production
            isBeingExtracted: this.isBeingExtracted,
            extractionMethod: this.extractionMethod,
            dailyProduction: this.dailyProduction,
            totalExtracted: this.totalExtracted,
            remainingDeposits: this.remainingDeposits,
            depletionRate: this.renewability ? 0 : (this.totalExtracted / this.remainingDeposits * 100),
            
            // Economic
            marketValue: this.marketValue,
            totalValue: this.currentStorage * this.marketValue,
            tradeVolume: this.tradeVolume,
            
            // Infrastructure
            storageCapacity: this.storageCapacity,
            currentStorage: this.currentStorage,
            storageUtilization: this.storageCapacity > 0 ? (this.currentStorage / this.storageCapacity * 100) : 0,
            facilityCount: this.extractionFacilities.length,
            transportLinks: this.transportationLinks.length,
            
            // Environmental
            environmentalImpact: this.environmentalImpact,
            sustainabilityRating: this.sustainabilityRating,
            
            // Age
            age: Date.now() - this.discovered
        };
    }
    
    getResourceSummary() {
        const resourceData = this.getResourceTypeData();
        
        return {
            name: this.type,
            category: resourceData?.category || 'unknown',
            rarity: resourceData?.rarity || 'unknown',
            renewable: this.renewability,
            quality: Math.floor(this.quality),
            accessibility: Math.floor(this.accessibility),
            marketValue: this.marketValue,
            inStorage: this.currentStorage,
            dailyOutput: this.dailyProduction
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE CYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    update() {
        // Daily extraction if active
        if (this.isBeingExtracted) {
            this.extractDaily();
        }
        
        // Update market value periodically
        const timeSinceLastUpdate = Date.now() - this.lastPriceUpdate;
        if (timeSinceLastUpdate > 3600000) { // Update every hour
            this.updateMarketValue();
        }
        
        // Update extraction rate based on current conditions
        this.updateExtractionRate();
        
        // Recalculate sustainability
        this.sustainabilityRating = this.calculateSustainability();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    serialize() {
        return {
            id: this.id,
            type: this.type,
            amount: this.amount,
            location: this.location,
            discovered: this.discovered,
            
            // Properties
            quality: this.quality,
            accessibility: this.accessibility,
            renewability: this.renewability,
            extractionRate: this.extractionRate,
            
            // Production
            isBeingExtracted: this.isBeingExtracted,
            extractionMethod: this.extractionMethod,
            dailyProduction: this.dailyProduction,
            totalExtracted: this.totalExtracted,
            remainingDeposits: this.remainingDeposits,
            
            // Economic
            marketValue: this.marketValue,
            lastPriceUpdate: this.lastPriceUpdate,
            priceHistory: [...this.priceHistory],
            tradeVolume: this.tradeVolume,
            
            // Infrastructure
            extractionFacilities: [...this.extractionFacilities],
            transportationLinks: [...this.transportationLinks],
            storageCapacity: this.storageCapacity,
            currentStorage: this.currentStorage,
            
            // Environmental
            environmentalImpact: this.environmentalImpact,
            socialImpact: this.socialImpact,
            sustainabilityRating: this.sustainabilityRating,
            
            // Events
            eventHistory: [...this.eventHistory]
        };
    }
    
    static deserialize(data) {
        const resource = new Resource(data.type, data.amount, data.location);
        
        // Restore properties
        resource.id = data.id;
        resource.discovered = data.discovered || Date.now();
        
        // Properties
        resource.quality = data.quality || resource.quality;
        resource.accessibility = data.accessibility || resource.accessibility;
        resource.renewability = data.renewability !== undefined ? data.renewability : resource.renewability;
        resource.extractionRate = data.extractionRate || resource.extractionRate;
        
        // Production
        resource.isBeingExtracted = data.isBeingExtracted || false;
        resource.extractionMethod = data.extractionMethod || null;
        resource.dailyProduction = data.dailyProduction || 0;
        resource.totalExtracted = data.totalExtracted || 0;
        resource.remainingDeposits = data.remainingDeposits || resource.remainingDeposits;
        
        // Economic
        resource.marketValue = data.marketValue || resource.marketValue;
        resource.lastPriceUpdate = data.lastPriceUpdate || Date.now();
        resource.priceHistory = data.priceHistory || [];
        resource.tradeVolume = data.tradeVolume || 0;
        
        // Infrastructure
        resource.extractionFacilities = data.extractionFacilities || [];
        resource.transportationLinks = data.transportationLinks || [];
        resource.storageCapacity = data.storageCapacity || 0;
        resource.currentStorage = data.currentStorage || 0;
        
        // Environmental
        resource.environmentalImpact = data.environmentalImpact || resource.environmentalImpact;
        resource.socialImpact = data.socialImpact || 0;
        resource.sustainabilityRating = data.sustainabilityRating || resource.sustainabilityRating;
        
        // Events
        resource.eventHistory = data.eventHistory || [];
        
        return resource;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.Resource = Resource;
}