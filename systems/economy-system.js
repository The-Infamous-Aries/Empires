/**
 * Economy System - Economic Management and Resource Processing
 * Dominion Wars - Nation Building Strategy Game
 */

class EconomySystem {
    constructor() {
        this.isInitialized = false;
        
        // Economic indicators
        this.indicators = {
            gdpGrowthRate: 0.02, // 2% annual growth base
            inflationRate: 0.02, // 2% annual inflation base
            unemploymentRate: 0.05, // 5% unemployment base
            interestRate: 0.03, // 3% base interest rate
            exchangeRate: 1.0, // Exchange rate with international currency
            economicIndex: 100 // Overall economic health (0-200)
        };
        
        // Market data
        this.markets = {
            resources: new Map(),
            goods: new Map(),
            services: new Map()
        };
        
        // Trade data
        this.trade = {
            imports: new Map(),
            exports: new Map(),
            tradeBalance: 0,
            tradingPartners: new Map()
        };
        
        // Economic policies
        this.policies = {
            taxRate: 20, // Percentage
            corporateTaxRate: 25,
            salesTaxRate: 8,
            minimumWage: 15,
            socialSpending: 15, // Percentage of GDP
            infrastructureSpending: 10,
            militarySpending: 5,
            researchSpending: 3
        };
        
        // Economic history for analysis
        this.history = {
            gdp: [],
            inflation: [],
            unemployment: [],
            resources: new Map(),
            maxHistoryLength: 365 // Keep 1 year of data
        };
        
        // Corporations and businesses
        this.corporations = new Map();
        this.industries = new Map();
        
        // Economic events
        this.activeEvents = [];
        
        this.initializeMarkets();
        this.initializeIndustries();
    }

    /**
     * Initialize the economy system
     */
    async initialize() {
        console.log('Initializing Economy System...');
        
        // Set up initial market prices
        this.resetMarketPrices();
        
        // Initialize trade relationships
        this.initializeTrade();
        
        // Set up economic event listeners
        this.bindEvents();
        
        this.isInitialized = true;
        console.log('Economy System initialized');
    }

    /**
     * Initialize market data
     */
    initializeMarkets() {
        // Resource markets
        const resourcePrices = {
            money: 1.0, // Base currency
            materials: 2.5,
            food: 1.2,
            energy: 3.0,
            technology: 15.0
        };
        
        Object.entries(resourcePrices).forEach(([resource, price]) => {
            this.markets.resources.set(resource, {
                currentPrice: price,
                basePrice: price,
                demand: 100,
                supply: 100,
                volatility: 0.1,
                trend: 0,
                volume: 0
            });
        });
        
        // Goods markets (manufactured items)
        const goodsPrices = {
            consumer_goods: 5.0,
            industrial_equipment: 25.0,
            military_equipment: 50.0,
            luxury_goods: 15.0,
            pharmaceuticals: 30.0
        };
        
        Object.entries(goodsPrices).forEach(([good, price]) => {
            this.markets.goods.set(good, {
                currentPrice: price,
                basePrice: price,
                demand: 50,
                supply: 50,
                volatility: 0.15,
                trend: 0,
                volume: 0
            });
        });
        
        // Services markets
        const servicesPrices = {
            transportation: 8.0,
            communications: 12.0,
            education: 20.0,
            healthcare: 35.0,
            entertainment: 10.0
        };
        
        Object.entries(servicesPrices).forEach(([service, price]) => {
            this.markets.services.set(service, {
                currentPrice: price,
                basePrice: price,
                demand: 75,
                supply: 75,
                volatility: 0.08,
                trend: 0,
                volume: 0
            });
        });
    }

    /**
     * Initialize industries
     */
    initializeIndustries() {
        const industries = [
            {
                id: 'agriculture',
                name: 'Agriculture',
                produces: ['food'],
                requires: ['energy', 'materials'],
                efficiency: 1.0,
                employment: 0,
                capacity: 100
            },
            {
                id: 'manufacturing',
                name: 'Manufacturing',
                produces: ['consumer_goods', 'industrial_equipment'],
                requires: ['materials', 'energy'],
                efficiency: 1.0,
                employment: 0,
                capacity: 100
            },
            {
                id: 'technology',
                name: 'Technology',
                produces: ['technology'],
                requires: ['materials', 'energy'],
                efficiency: 1.0,
                employment: 0,
                capacity: 50
            },
            {
                id: 'services',
                name: 'Services',
                produces: ['transportation', 'communications'],
                requires: ['energy'],
                efficiency: 1.0,
                employment: 0,
                capacity: 200
            }
        ];
        
        industries.forEach(industry => {
            this.industries.set(industry.id, industry);
        });
    }

    /**
     * Initialize trade system
     */
    initializeTrade() {
        // Initialize empty trade data
        ['money', 'materials', 'food', 'energy', 'technology'].forEach(resource => {
            this.trade.imports.set(resource, 0);
            this.trade.exports.set(resource, 0);
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        EventBus.on(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.on(GameEvents.YEAR_PASSED, this.handleYearPassed, this);
        EventBus.on(GameEvents.RESOURCES_CHANGED, this.handleResourcesChanged, this);
        EventBus.on('trade_executed', this.handleTradeExecuted, this);
        EventBus.on('policy_changed', this.handlePolicyChanged, this);
    }

    /**
     * Handle daily economic updates
     */
    handleDayPassed(data) {
        // Update market prices
        this.updateMarketPrices();
        
        // Process industry production
        this.processIndustryProduction();
        
        // Update economic indicators
        this.updateEconomicIndicators();
        
        // Process active economic events
        this.processEconomicEvents();
        
        // Update trade flows
        this.updateTradeFlows();
        
        // Record economic history
        this.recordEconomicHistory();
    }

    /**
     * Handle monthly economic updates
     */
    handleMonthPassed(data) {
        // Calculate monthly statistics
        this.calculateMonthlyStatistics();
        
        // Process corporate activities
        this.processCorporateActivities();
        
        // Update employment statistics
        this.updateEmployment();
        
        // Generate economic events
        this.generateRandomEconomicEvents();
        
        // Update international trade agreements
        this.updateTradeAgreements();
    }

    /**
     * Handle yearly economic updates
     */
    handleYearPassed(data) {
        // Annual economic review
        this.performAnnualEconomicReview();
        
        // Update long-term trends
        this.updateLongTermTrends();
        
        // Process major economic cycles
        this.processEconomicCycles();
        
        // Generate annual economic report
        this.generateAnnualReport();
    }

    /**
     * Update market prices based on supply and demand
     */
    updateMarketPrices() {
        // Update resource prices
        for (const [resource, market] of this.markets.resources.entries()) {
            this.updateMarketPrice(market);
        }
        
        // Update goods prices
        for (const [good, market] of this.markets.goods.entries()) {
            this.updateMarketPrice(market);
        }
        
        // Update services prices
        for (const [service, market] of this.markets.services.entries()) {
            this.updateMarketPrice(market);
        }
    }

    /**
     * Update individual market price
     */
    updateMarketPrice(market) {
        // Calculate price change based on supply and demand
        const supplyDemandRatio = market.supply / Math.max(market.demand, 1);
        const baseChange = (1 - supplyDemandRatio) * 0.02; // 2% max change per day
        
        // Add volatility
        const volatilityChange = (Math.random() - 0.5) * market.volatility;
        
        // Add trend
        const trendChange = market.trend * 0.01;
        
        // Calculate total change
        const totalChange = baseChange + volatilityChange + trendChange;
        
        // Apply change to price
        market.currentPrice *= (1 + totalChange);
        
        // Prevent extreme prices
        market.currentPrice = Math.max(
            market.basePrice * 0.1,
            Math.min(market.basePrice * 5.0, market.currentPrice)
        );
        
        // Update trend
        market.trend = market.trend * 0.95 + totalChange * 20;
        market.trend = Math.max(-10, Math.min(10, market.trend));
        
        // Reset volume
        market.volume = 0;
    }

    /**
     * Process industry production
     */
    processIndustryProduction() {
        if (!window.Nation) return;
        
        for (const [industryId, industry] of this.industries.entries()) {
            // Calculate production based on employment and efficiency
            const productionRate = industry.employment * industry.efficiency;
            
            // Check if required resources are available
            const canProduce = this.checkResourceRequirements(industry.requires, productionRate);
            
            if (canProduce) {
                // Consume required resources
                this.consumeResources(industry.requires, productionRate);
                
                // Produce output resources
                this.produceResources(industry.produces, productionRate);
                
                // Update market supply
                industry.produces.forEach(resource => {
                    const market = this.getMarket(resource);
                    if (market) {
                        market.supply += productionRate;
                    }
                });
            }
        }
    }

    /**
     * Check if required resources are available
     */
    checkResourceRequirements(requirements, multiplier = 1) {
        if (!window.Nation) return false;
        
        return requirements.every(resource => {
            const required = multiplier * 0.1; // 0.1 units per production unit
            return window.Nation.resources[resource] >= required;
        });
    }

    /**
     * Consume resources for production
     */
    consumeResources(resources, multiplier = 1) {
        if (!window.Nation) return;
        
        resources.forEach(resource => {
            const consumption = multiplier * 0.1;
            window.Nation.resources[resource] -= consumption;
        });
    }

    /**
     * Produce resources from industry
     */
    produceResources(resources, multiplier = 1) {
        if (!window.Nation) return;
        
        resources.forEach(resource => {
            const production = multiplier * 0.15; // 15% more output than input
            
            if (window.Nation.resources[resource] !== undefined) {
                window.Nation.resources[resource] += production;
            } else {
                // Handle goods and services production
                this.addToNationalStockpile(resource, production);
            }
        });
    }

    /**
     * Add to national stockpile (for non-basic resources)
     */
    addToNationalStockpile(item, quantity) {
        if (!window.Nation.stockpile) {
            window.Nation.stockpile = new Map();
        }
        
        const current = window.Nation.stockpile.get(item) || 0;
        window.Nation.stockpile.set(item, current + quantity);
    }

    /**
     * Update economic indicators
     */
    updateEconomicIndicators() {
        if (!window.Nation) return;
        
        // Update GDP growth rate
        this.updateGDPGrowth();
        
        // Update inflation
        this.updateInflation();
        
        // Update unemployment
        this.updateUnemployment();
        
        // Update economic index
        this.updateEconomicIndex();
    }

    /**
     * Update GDP growth rate
     */
    updateGDPGrowth() {
        if (!window.Nation) return;
        
        const previousGDP = this.history.gdp.length > 0 ? 
            this.history.gdp[this.history.gdp.length - 1] : window.Nation.gdp;
        
        if (previousGDP > 0) {
            this.indicators.gdpGrowthRate = (window.Nation.gdp - previousGDP) / previousGDP;
        }
        
        // Apply policies effect
        this.indicators.gdpGrowthRate *= (1 + this.policies.infrastructureSpending / 100);
        this.indicators.gdpGrowthRate *= (1 - this.policies.taxRate / 200); // High taxes reduce growth
    }

    /**
     * Update inflation rate
     */
    updateInflation() {
        // Calculate average price change across all markets
        let totalPriceChange = 0;
        let marketCount = 0;
        
        for (const market of this.markets.resources.values()) {
            totalPriceChange += (market.currentPrice - market.basePrice) / market.basePrice;
            marketCount++;
        }
        
        if (marketCount > 0) {
            this.indicators.inflationRate = totalPriceChange / marketCount;
        }
        
        // Apply monetary policy effects
        this.indicators.inflationRate = Math.max(0, this.indicators.inflationRate);
    }

    /**
     * Update unemployment rate
     */
    updateUnemployment() {
        if (!window.Nation) return;
        
        // Calculate total employment across industries
        let totalEmployment = 0;
        for (const industry of this.industries.values()) {
            totalEmployment += industry.employment;
        }
        
        // Calculate unemployment rate
        const workforceSize = window.Nation.population * 0.6; // 60% workforce participation
        this.indicators.unemploymentRate = Math.max(0, 
            (workforceSize - totalEmployment) / workforceSize
        );
        
        // Apply economic policies effect
        if (this.policies.socialSpending > 20) {
            this.indicators.unemploymentRate *= 0.9; // Social spending reduces unemployment
        }
    }

    /**
     * Update overall economic index
     */
    updateEconomicIndex() {
        // Weighted average of various economic indicators
        let index = 100;
        
        // GDP growth factor (positive growth increases index)
        index += this.indicators.gdpGrowthRate * 1000;
        
        // Inflation factor (moderate inflation is good, too high or low is bad)
        const optimalInflation = 0.02;
        const inflationDeviation = Math.abs(this.indicators.inflationRate - optimalInflation);
        index -= inflationDeviation * 500;
        
        // Unemployment factor (lower unemployment is better)
        index -= this.indicators.unemploymentRate * 200;
        
        // Trade balance factor
        index += this.trade.tradeBalance * 0.01;
        
        // Clamp to reasonable range
        this.indicators.economicIndex = Math.max(0, Math.min(200, index));
    }

    /**
     * Process active economic events
     */
    processEconomicEvents() {
        this.activeEvents.forEach((event, index) => {
            event.duration--;
            
            if (event.duration <= 0) {
                // Event ended, remove effects
                this.removeEventEffects(event);
                this.activeEvents.splice(index, 1);
            } else {
                // Apply ongoing effects
                this.applyEventEffects(event);
            }
        });
    }

    /**
     * Apply economic event effects
     */
    applyEventEffects(event) {
        if (event.effects) {
            Object.entries(event.effects).forEach(([indicator, change]) => {
                if (this.indicators[indicator] !== undefined) {
                    this.indicators[indicator] *= (1 + change);
                }
            });
        }
    }

    /**
     * Remove economic event effects
     */
    removeEventEffects(event) {
        console.log(`Economic event ended: ${event.name}`);
        EventBus.emit('economic_event_ended', { event });
    }

    /**
     * Update trade flows
     */
    updateTradeFlows() {
        // Simulate international demand for exports
        for (const [resource, amount] of this.trade.exports.entries()) {
            if (amount > 0) {
                const market = this.markets.resources.get(resource);
                if (market) {
                    market.demand += amount * 0.1;
                    market.volume += amount;
                }
            }
        }
        
        // Calculate trade balance
        let exportValue = 0;
        let importValue = 0;
        
        for (const [resource, amount] of this.trade.exports.entries()) {
            const market = this.markets.resources.get(resource);
            if (market) {
                exportValue += amount * market.currentPrice;
            }
        }
        
        for (const [resource, amount] of this.trade.imports.entries()) {
            const market = this.markets.resources.get(resource);
            if (market) {
                importValue += amount * market.currentPrice;
            }
        }
        
        this.trade.tradeBalance = exportValue - importValue;
    }

    /**
     * Record economic history for analysis
     */
    recordEconomicHistory() {
        if (!window.Nation) return;
        
        // Record GDP
        this.history.gdp.push(window.Nation.gdp);
        if (this.history.gdp.length > this.history.maxHistoryLength) {
            this.history.gdp.shift();
        }
        
        // Record inflation
        this.history.inflation.push(this.indicators.inflationRate);
        if (this.history.inflation.length > this.history.maxHistoryLength) {
            this.history.inflation.shift();
        }
        
        // Record unemployment
        this.history.unemployment.push(this.indicators.unemploymentRate);
        if (this.history.unemployment.length > this.history.maxHistoryLength) {
            this.history.unemployment.shift();
        }
        
        // Record resource prices
        for (const [resource, market] of this.markets.resources.entries()) {
            if (!this.history.resources.has(resource)) {
                this.history.resources.set(resource, []);
            }
            
            const resourceHistory = this.history.resources.get(resource);
            resourceHistory.push(market.currentPrice);
            
            if (resourceHistory.length > this.history.maxHistoryLength) {
                resourceHistory.shift();
            }
        }
    }

    /**
     * Calculate monthly statistics
     */
    calculateMonthlyStatistics() {
        // Calculate average indicators for the month
        const monthLength = 30;
        
        if (this.history.gdp.length >= monthLength) {
            const recentGDP = this.history.gdp.slice(-monthLength);
            const avgGrowth = recentGDP.reduce((sum, gdp, index) => {
                if (index > 0) {
                    return sum + (gdp - recentGDP[index - 1]) / recentGDP[index - 1];
                }
                return sum;
            }, 0) / (monthLength - 1);
            
            EventBus.emit('monthly_economic_report', {
                averageGrowth: avgGrowth,
                currentIndicators: { ...this.indicators },
                tradeBalance: this.trade.tradeBalance
            });
        }
    }

    /**
     * Generate random economic events
     */
    generateRandomEconomicEvents() {
        // Small chance of economic event each month
        if (Math.random() < 0.15) { // 15% chance
            const events = [
                {
                    name: 'Market Boom',
                    description: 'Markets experience unexpected growth',
                    duration: 30, // 30 days
                    effects: { gdpGrowthRate: 0.05 }
                },
                {
                    name: 'Supply Chain Disruption',
                    description: 'International supply chains are disrupted',
                    duration: 15,
                    effects: { inflationRate: 0.02 }
                },
                {
                    name: 'Technology Innovation',
                    description: 'New technologies boost productivity',
                    duration: 60,
                    effects: { gdpGrowthRate: 0.03, unemploymentRate: -0.01 }
                },
                {
                    name: 'Trade War',
                    description: 'International trade tensions rise',
                    duration: 45,
                    effects: { gdpGrowthRate: -0.02 }
                }
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            this.activeEvents.push({ ...event });
            
            EventBus.emit('economic_event_started', { event });
            console.log(`Economic event started: ${event.name}`);
        }
    }

    /**
     * Execute trade between resources
     */
    executeTrade(fromResource, toResource, amount) {
        const fromMarket = this.getMarket(fromResource);
        const toMarket = this.getMarket(toResource);
        
        if (!fromMarket || !toMarket) {
            return false;
        }
        
        // Calculate exchange rate
        const exchangeRate = toMarket.currentPrice / fromMarket.currentPrice;
        const receivedAmount = amount * exchangeRate;
        
        // Update nation resources
        if (window.Nation) {
            if (window.Nation.resources[fromResource] >= amount) {
                window.Nation.resources[fromResource] -= amount;
                window.Nation.resources[toResource] += receivedAmount;
                
                // Update market data
                fromMarket.supply -= amount;
                fromMarket.demand += amount;
                fromMarket.volume += amount;
                
                toMarket.supply += receivedAmount;
                toMarket.demand -= receivedAmount;
                toMarket.volume += receivedAmount;
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get market data for resource, good, or service
     */
    getMarket(item) {
        return this.markets.resources.get(item) || 
               this.markets.goods.get(item) || 
               this.markets.services.get(item);
    }

    /**
     * Set tax rate
     */
    setTaxRate(rate) {
        this.policies.taxRate = Math.max(0, Math.min(100, rate));
        
        EventBus.emit('policy_changed', {
            policy: 'taxRate',
            oldValue: this.policies.taxRate,
            newValue: rate
        });
    }

    /**
     * Get economic overview
     */
    getEconomicOverview() {
        return {
            indicators: { ...this.indicators },
            policies: { ...this.policies },
            trade: {
                balance: this.trade.tradeBalance,
                imports: Object.fromEntries(this.trade.imports),
                exports: Object.fromEntries(this.trade.exports)
            },
            markets: {
                resources: Object.fromEntries(
                    Array.from(this.markets.resources.entries()).map(([k, v]) => [k, {
                        price: v.currentPrice,
                        change: ((v.currentPrice - v.basePrice) / v.basePrice * 100).toFixed(1) + '%'
                    }])
                )
            },
            activeEvents: this.activeEvents.length
        };
    }

    /**
     * Reset market prices to base values
     */
    resetMarketPrices() {
        for (const market of this.markets.resources.values()) {
            market.currentPrice = market.basePrice;
            market.trend = 0;
            market.volume = 0;
        }
    }

    /**
     * Get state for saving
     */
    getState() {
        return {
            indicators: { ...this.indicators },
            policies: { ...this.policies },
            trade: {
                imports: Object.fromEntries(this.trade.imports),
                exports: Object.fromEntries(this.trade.exports),
                tradeBalance: this.trade.tradeBalance
            },
            markets: {
                resources: Object.fromEntries(this.markets.resources),
                goods: Object.fromEntries(this.markets.goods),
                services: Object.fromEntries(this.markets.services)
            },
            industries: Object.fromEntries(this.industries),
            activeEvents: [...this.activeEvents],
            history: {
                gdp: [...this.history.gdp],
                inflation: [...this.history.inflation],
                unemployment: [...this.history.unemployment],
                resources: Object.fromEntries(this.history.resources)
            }
        };
    }

    /**
     * Set state from save data
     */
    setState(state) {
        if (state.indicators) Object.assign(this.indicators, state.indicators);
        if (state.policies) Object.assign(this.policies, state.policies);
        if (state.trade) {
            if (state.trade.imports) this.trade.imports = new Map(Object.entries(state.trade.imports));
            if (state.trade.exports) this.trade.exports = new Map(Object.entries(state.trade.exports));
            if (state.trade.tradeBalance !== undefined) this.trade.tradeBalance = state.trade.tradeBalance;
        }
        if (state.markets) {
            if (state.markets.resources) this.markets.resources = new Map(Object.entries(state.markets.resources));
            if (state.markets.goods) this.markets.goods = new Map(Object.entries(state.markets.goods));
            if (state.markets.services) this.markets.services = new Map(Object.entries(state.markets.services));
        }
        if (state.industries) this.industries = new Map(Object.entries(state.industries));
        if (state.activeEvents) this.activeEvents = [...state.activeEvents];
        if (state.history) {
            if (state.history.gdp) this.history.gdp = [...state.history.gdp];
            if (state.history.inflation) this.history.inflation = [...state.history.inflation];
            if (state.history.unemployment) this.history.unemployment = [...state.history.unemployment];
            if (state.history.resources) this.history.resources = new Map(Object.entries(state.history.resources));
        }
    }

    /**
     * Perform annual economic review
     */
    performAnnualEconomicReview() {
        // Implementation would analyze yearly performance
    }

    /**
     * Update long-term economic trends
     */
    updateLongTermTrends() {
        // Implementation would update multi-year trends
    }

    /**
     * Process economic cycles (boom/bust)
     */
    processEconomicCycles() {
        // Implementation would handle economic cycles
    }

    /**
     * Generate annual economic report
     */
    generateAnnualReport() {
        const report = {
            year: new Date().getFullYear(),
            indicators: { ...this.indicators },
            performance: {
                gdpGrowth: this.indicators.gdpGrowthRate,
                inflation: this.indicators.inflationRate,
                unemployment: this.indicators.unemploymentRate
            },
            tradeBalance: this.trade.tradeBalance,
            majorEvents: this.activeEvents.length
        };
        
        EventBus.emit('annual_economic_report', { report });
        return report;
    }

    /**
     * Handle resource changes
     */
    handleResourcesChanged(data) {
        // Update market supply/demand based on resource availability
        Object.keys(data.new).forEach(resource => {
            const market = this.markets.resources.get(resource);
            if (market) {
                const change = data.new[resource] - data.old[resource];
                if (change > 0) {
                    market.supply += change * 0.01; // Small effect on market
                } else {
                    market.demand += Math.abs(change) * 0.01;
                }
            }
        });
    }

    /**
     * Handle trade execution
     */
    handleTradeExecuted(data) {
        // Update trade statistics
        if (data.type === 'import') {
            const current = this.trade.imports.get(data.resource) || 0;
            this.trade.imports.set(data.resource, current + data.amount);
        } else if (data.type === 'export') {
            const current = this.trade.exports.get(data.resource) || 0;
            this.trade.exports.set(data.resource, current + data.amount);
        }
    }

    /**
     * Handle policy changes
     */
    handlePolicyChanged(data) {
        console.log(`Economic policy changed: ${data.policy} = ${data.newValue}`);
        // Policies will affect various economic indicators over time
    }

    /**
     * Process corporate activities
     */
    processCorporateActivities() {
        // Implementation would handle corporate growth, mergers, etc.
    }

    /**
     * Update employment statistics
     */
    updateEmployment() {
        // Implementation would update employment across industries
    }

    /**
     * Update trade agreements
     */
    updateTradeAgreements() {
        // Implementation would handle international trade agreements
    }

    /**
     * Destroy the economy system
     */
    destroy() {
        // Clean up event listeners
        EventBus.off(GameEvents.DAY_PASSED, this.handleDayPassed, this);
        EventBus.off(GameEvents.MONTH_PASSED, this.handleMonthPassed, this);
        EventBus.off(GameEvents.YEAR_PASSED, this.handleYearPassed, this);
        EventBus.off(GameEvents.RESOURCES_CHANGED, this.handleResourcesChanged, this);
        
        this.isInitialized = false;
        console.log('Economy System destroyed');
    }
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EconomySystem };
}