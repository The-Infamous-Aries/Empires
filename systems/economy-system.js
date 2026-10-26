/**
 * Economy System - Economic Management and Currency Processing
 * Dominion Wars - Nation Building Strategy Game
 * Resources removed - 6-currency economy with dynamic exchange rates.
 */

// Import economic events data
var EconomicEventsData = (typeof require !== 'undefined' && typeof module !== 'undefined')
    ? require('../data/events/economic-events.js')
    : (typeof window !== 'undefined' ? window.EconomicEvents : {});

// 6 Currency types (defined in world-bank-system.js)
// aurel (₳, 100), velt (✦, 90), krona (₭, 110), drachma (ð, 95), sovereign (ꜱ, 105), talon (₮, 85)
const CURRENCY_KEYS = ['aurel', 'velt', 'krona', 'drachma', 'sovereign', 'talon'];

class EconomySystem {
    constructor() {
        this.isInitialized = false;

        // Economic indicators
        this.indicators = {
            gdpGrowthRate: 0.02,
            inflationRate: 0.02,
            unemploymentRate: 0.05,
            interestRate: 0.03,
            exchangeRate: 1.0,
            economicIndex: 100
        };

        // Markets (goods and services only — resources removed)
        this.markets = {
            goods: new Map(),
            services: new Map()
        };

        // Currency system (6 currencies with dynamic rates)
        this.currencies = new Map(); // currencyKey -> { rate, circulation, usageCount, spentRecently, history }

        // Trade data (currency-based only)
        this.trade = {
            imports: new Map(),
            exports: new Map(),
            tradeBalance: 0,
            tradingPartners: new Map()
        };

        // Economic policies
        this.policies = {
            taxRate: 20,
            corporateTaxRate: 25,
            salesTaxRate: 8,
            minimumWage: 15,
            socialSpending: 15,
            infrastructureSpending: 10,
            militarySpending: 5,
            researchSpending: 3
        };

        // Economic history
        this.history = {
            gdp: [],
            inflation: [],
            unemployment: [],
            maxHistoryLength: 365
        };

        // Corporations and businesses
        this.corporations = new Map();
        this.industries = new Map();

        // Economic events
        this.activeEvents = [];
        this._appliedEventEffects = new Map(); // eventId -> { indicator, originalValue }

        // Market trading system (currency offers only)
        this.marketOffers = {
            buyOffers: new Map(),
            sellOffers: new Map(),
            escrow: new Map(), // playerId -> { currencyKey: amount }
            pendingCancellations: new Map()
        };

        this.nextOfferId = 1;

        this.initializeMarkets();
        this.initializeIndustries();
        this.initializeCurrencies();
    }

    /**
     * Initialize the economy system
     */
    initialize() {
        console.log('Initializing Economy System...');

        this.resetMarketPrices();
        this.initializeTrade();
        this.bindEvents();

        this.isInitialized = true;
        console.log('Economy System initialized');
    }

    /**
     * Initialize currency system with 6 currencies
     */
    initializeCurrencies() {
        const baseRates = {
            aurel: 100,
            velt: 100,
            krona: 100,
            drachma: 100,
            sovereign: 100,
            talon: 100
        };

        const currencySymbols = {
            aurel: 'assets/images/Currency/aurel.png',
            velt: 'assets/images/Currency/velt.png',
            krona: 'assets/images/Currency/krona.png',
            drachma: 'assets/images/Currency/drachma.png',
            sovereign: 'assets/images/Currency/soverneign.png',
            talon: 'assets/images/Currency/talon.png'
        };

        const currencyAbbrevs = {
            aurel: 'AUR',
            velt: 'VLT',
            krona: 'KRN',
            drachma: 'DRM',
            sovereign: 'SOV',
            talon: 'TLN'
        };

        CURRENCY_KEYS.forEach(key => {
            this.currencies.set(key, {
                key,
                abbrev: currencyAbbrevs[key] || key.toUpperCase(),
                symbol: currencySymbols[key] || key,
                rate: baseRates[key] || 100,
                baseRate: baseRates[key] || 100,
                circulation: 0,
                usageCount: 0,
                spentRecently: 0,
                history: [{ rate: baseRates[key] || 100, at: Date.now() }]
            });
        });

        // Seed nation currency balances if not present
        if (window.Nation && !window.Nation.currencyBalances) {
            window.Nation.currencyBalances = {};
            CURRENCY_KEYS.forEach(key => {
                window.Nation.currencyBalances[key] = 0;
            });
            // Start with some aurel (base currency)
            window.Nation.currencyBalances.aurel = 10000;
            window.Nation.currency = 'aurel';
        }
    }

    /**
     * Initialize market data (goods and services only)
     */
    initializeMarkets() {
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
            { id: 'agriculture', name: 'Agriculture', produces: ['food'], requires: [], efficiency: 1.0, employment: 0, capacity: 100 },
            { id: 'manufacturing', name: 'Manufacturing', produces: ['consumer_goods', 'industrial_equipment'], requires: [], efficiency: 1.0, employment: 0, capacity: 100 },
            { id: 'technology', name: 'Technology', produces: ['technology'], requires: [], efficiency: 1.0, employment: 0, capacity: 50 },
            { id: 'services', name: 'Services', produces: ['transportation', 'communications'], requires: [], efficiency: 1.0, employment: 0, capacity: 200 }
        ];

        industries.forEach(industry => {
            this.industries.set(industry.id, industry);
        });
    }

    /**
     * Initialize trade system (currency-based)
     */
    initializeTrade() {
        CURRENCY_KEYS.forEach(currencyKey => {
            this.trade.imports.set(currencyKey, 0);
            this.trade.exports.set(currencyKey, 0);
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (typeof EventBus === 'undefined') return;

        const dayEvent = typeof GameEvents !== 'undefined' ? GameEvents.DAY_PASSED : 'day_passed';
        const monthEvent = typeof GameEvents !== 'undefined' ? GameEvents.MONTH_PASSED : 'month_passed';
        const yearEvent = typeof GameEvents !== 'undefined' ? GameEvents.YEAR_PASSED : 'year_passed';

        EventBus.on(dayEvent, this.handleDayPassed, this);
        EventBus.on(monthEvent, this.handleMonthPassed, this);
        EventBus.on(yearEvent, this.handleYearPassed, this);
        EventBus.on('trade_executed', this.handleTradeExecuted, this);
        EventBus.on('policy_changed', this.handlePolicyChanged, this);
    }

    /**
     * Handle daily economic updates
     */
    handleDayPassed(data) {
        this.updateMarketPrices();
        this.updateCurrencyRates();
        this.processIndustryProduction();
        this.updateEconomicIndicators();
        this.processEconomicEvents();
        this.updateTradeFlows();
        this.recordEconomicHistory();
        this.processPendingCancellations(data ? data.currentDay : (window.TimeSystem ? window.TimeSystem.currentDay : 1));
    }

    /**
     * Process pending offer cancellations (12-turn delay)
     */
    processPendingCancellations(currentDay) {
        for (const [offerId, cancellation] of this.pendingCancellations.entries()) {
            if (currentDay >= cancellation.returnDate) {
                if (window.Nation && window.Player && cancellation.playerId === window.Player.playerId) {
                    const currencyKey = cancellation.currencyKey || 'aurel';
                    const amount = cancellation.amount || 0;
                    if (window.Nation.currencyBalances) {
                        window.Nation.currencyBalances[currencyKey] = (window.Nation.currencyBalances[currencyKey] || 0) + amount;
                    } else if (currencyKey === 'aurel') {
                        window.Nation.money = (window.Nation.money || 0) + amount;
                    }

                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit('market_offer_cancelled_returned', { offerId, currencyKey, amount });
                    }
                }

                this.pendingCancellations.delete(offerId);
            }
        }
    }

    /**
     * Create a buy offer (currency-based)
     */
    createBuyOffer(playerId, currencyKey, amount, pricePerUnit) {
        if (!window.Nation || !window.Player || window.Player.playerId !== playerId) {
            throw new Error('Invalid player');
        }

        if (!CURRENCY_KEYS.includes(currencyKey)) {
            throw new Error('Invalid currency');
        }

        const totalCost = amount * pricePerUnit;
        const balances = window.Nation.currencyBalances || {};
        const currentBalance = balances[currencyKey] || (currencyKey === 'aurel' ? (window.Nation.money || 0) : 0);

        if (currentBalance < totalCost) {
            throw new Error('Insufficient currency for buy offer');
        }

        const offerId = this.nextOfferId++;
        const offer = {
            id: offerId,
            playerId,
            type: 'buy',
            currencyKey,
            amount,
            pricePerUnit,
            totalValue: totalCost,
            timestamp: Date.now()
        };

        // Put currency in escrow
        if (window.Nation.currencyBalances) {
            window.Nation.currencyBalances[currencyKey] -= totalCost;
        } else if (currencyKey === 'aurel') {
            window.Nation.money -= totalCost;
        }

        if (!this.marketOffers.escrow.has(playerId)) {
            this.marketOffers.escrow.set(playerId, {});
        }
        const escrowData = this.marketOffers.escrow.get(playerId);
        escrowData[currencyKey] = (escrowData[currencyKey] || 0) + totalCost;

        this.marketOffers.buyOffers.set(offerId, offer);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('market_buy_offer_created', { offer });
        }
        return offer;
    }

    /**
     * Create a sell offer (currency-based)
     */
    createSellOffer(playerId, currencyKey, amount, pricePerUnit) {
        if (!window.Nation || !window.Player || window.Player.playerId !== playerId) {
            throw new Error('Invalid player');
        }

        if (!CURRENCY_KEYS.includes(currencyKey)) {
            throw new Error('Invalid currency');
        }

        const balances = window.Nation.currencyBalances || {};
        const currentAmount = balances[currencyKey] || (currencyKey === 'aurel' ? (window.Nation.money || 0) : 0);
        if (currentAmount < amount) {
            throw new Error('Insufficient currency for sell offer');
        }

        const offerId = this.nextOfferId++;
        const offer = {
            id: offerId,
            playerId,
            type: 'sell',
            currencyKey,
            amount,
            pricePerUnit,
            totalValue: amount * pricePerUnit,
            timestamp: Date.now()
        };

        if (window.Nation.currencyBalances) {
            window.Nation.currencyBalances[currencyKey] -= amount;
        } else if (currencyKey === 'aurel') {
            window.Nation.money -= amount;
        }

        if (!this.marketOffers.escrow.has(playerId)) {
            this.marketOffers.escrow.set(playerId, {});
        }
        const escrowData = this.marketOffers.escrow.get(playerId);
        escrowData[currencyKey] = (escrowData[currencyKey] || 0) + amount;

        this.marketOffers.sellOffers.set(offerId, offer);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('market_sell_offer_created', { offer });
        }
        return offer;
    }

    /**
     * Accept a buy offer (sell to buyer)
     */
    acceptBuyOffer(offerId, sellerId) {
        if (!window.Nation || !window.Player || window.Player.playerId !== sellerId) {
            throw new Error('Invalid seller');
        }

        const offer = this.marketOffers.buyOffers.get(offerId);
        if (!offer) {
            throw new Error('Buy offer not found');
        }

        const balances = window.Nation.currencyBalances || {};
        const currentAmount = balances[offer.currencyKey] || (offer.currencyKey === 'aurel' ? (window.Nation.money || 0) : 0);
        if (currentAmount < offer.amount) {
            throw new Error('Insufficient currency to fulfill buy offer');
        }

        // Execute trade
        if (window.Nation.currencyBalances) {
            window.Nation.currencyBalances[offer.currencyKey] -= offer.amount;
        } else if (offer.currencyKey === 'aurel') {
            window.Nation.money -= offer.amount;
        }

        if (window.Nation.currencyBalances) {
            window.Nation.currencyBalances.aurel = (window.Nation.currencyBalances.aurel || 0) + offer.totalValue;
        } else {
            window.Nation.money = (window.Nation.money || 0) + offer.totalValue;
        }

        this.marketOffers.buyOffers.delete(offerId);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('market_buy_offer_accepted', { offer, sellerId, sellerName: window.Nation.nationName });
        }

        return true;
    }

    /**
     * Accept a sell offer (buy from seller)
     */
    acceptSellOffer(offerId, buyerId) {
        if (!window.Nation || !window.Player || window.Player.playerId !== buyerId) {
            throw new Error('Invalid buyer');
        }

        const offer = this.marketOffers.sellOffers.get(offerId);
        if (!offer) {
            throw new Error('Sell offer not found');
        }

        const buyerBalances = window.Nation.currencyBalances || {};
        const buyerBalance = buyerBalances[offer.currencyKey] || (offer.currencyKey === 'aurel' ? (window.Nation.money || 0) : 0);
        if (buyerBalance < offer.totalValue) {
            throw new Error('Insufficient currency to accept sell offer');
        }

        if (window.Nation.currencyBalances) {
            window.Nation.currencyBalances[offer.currencyKey] -= offer.totalValue;
        } else if (offer.currencyKey === 'aurel') {
            window.Nation.money -= offer.totalValue;
        }

        if (window.Nation.currencyBalances) {
            window.Nation.currencyBalances[offer.currencyKey] = (window.Nation.currencyBalances[offer.currencyKey] || 0) + offer.amount;
        } else {
            window.Nation.money = (window.Nation.money || 0) + offer.amount;
        }

        this.marketOffers.sellOffers.delete(offerId);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('market_sell_offer_accepted', { offer, buyerId, buyerName: window.Nation.nationName });
        }

        return true;
    }

    /**
     * Cancel an offer (with 12-turn delay)
     */
    cancelOffer(offerId, playerId) {
        if (!window.Player || window.Player.playerId !== playerId) {
            throw new Error('Invalid player');
        }

        let offer = this.marketOffers.buyOffers.get(offerId) ||
            this.marketOffers.sellOffers.get(offerId);

        if (!offer || offer.playerId !== playerId) {
            throw new Error('Offer not found or not owned by player');
        }

        this.marketOffers.buyOffers.delete(offerId);
        this.marketOffers.sellOffers.delete(offerId);

        const currentDay = window.TimeSystem ? window.TimeSystem.currentDay : 1;
        const returnDate = currentDay + 12;

        let currencyKey = offer.currencyKey || 'aurel';
        let amount = offer.type === 'buy' ? offer.totalValue : offer.amount;

        this.pendingCancellations.set(offerId, { playerId, currencyKey, amount, returnDate });

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('market_offer_cancelled', { offerId, offer, returnDate });
        }

        return { returnDate };
    }

    /**
     * Get all market offers
     */
    getMarketOffers() {
        return {
            buyOffers: Array.from(this.marketOffers.buyOffers.values()),
            sellOffers: Array.from(this.marketOffers.sellOffers.values())
        };
    }

    /**
     * Get player's active offers
     */
    getPlayerOffers(playerId) {
        const buyOffers = Array.from(this.marketOffers.buyOffers.values()).filter(offer => offer.playerId === playerId);
        const sellOffers = Array.from(this.marketOffers.sellOffers.values()).filter(offer => offer.playerId === playerId);
        return { buyOffers, sellOffers };
    }

    /**
     * Get player's escrow currencies
     */
    getPlayerEscrow(playerId) {
        return this.marketOffers.escrow.get(playerId) || {};
    }

    // ── Currency System ──
    /**
     * Get currency configuration for all 6 currencies
     */
    getCurrencyConfig() {
        const config = {};
        for (const [key, currency] of this.currencies.entries()) {
            config[key] = { ...currency };
        }
        return config;
    }

    /**
     * Get balance of a specific currency for the current nation
     */
    getCurrencyBalance(currencyKey) {
        if (!window.Nation) return 0;
        const balances = window.Nation.currencyBalances || {};
        if (balances[currencyKey] !== undefined) {
            return balances[currencyKey];
        }
        // Legacy fallback: aurel maps to money
        if (currencyKey === 'aurel') {
            return window.Nation.money || 0;
        }
        return 0;
    }

    /**
     * Get all currency balances for the current nation
     */
    getAllCurrencyBalances() {
        if (!window.Nation) return {};
        return { ...(window.Nation.currencyBalances || {}), aurel: window.Nation.currencyBalances?.aurel ?? window.Nation.money ?? 0 };
    }

    /**
     * Convert an amount from one currency to another using current exchange rates
     */
    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;

        const from = this.currencies.get(fromCurrency);
        const to = this.currencies.get(toCurrency);
        if (!from || !to) return amount;

        // Exchange rate: how much of toCurrency per 1 unit of fromCurrency
        const rate = to.rate / from.rate;
        return Math.floor(amount * rate);
    }

    /**
     * Transfer funds between users with automatic currency conversion
     * If sender and receiver use different currencies, converts the amount
     * based on current exchange rates.
     */
    transferCurrency(fromNation, toNation, amount, fromCurrency, toCurrency) {
        if (!fromNation || !toNation) return { ok: false, reason: 'Invalid nation' };
        if (!CURRENCY_KEYS.includes(fromCurrency) || !CURRENCY_KEYS.includes(toCurrency)) {
            return { ok: false, reason: 'Invalid currency' };
        }

        const fromBalances = fromNation.currencyBalances || {};
        const fromBalance = fromBalances[fromCurrency] || (fromCurrency === 'aurel' ? (fromNation.money || 0) : 0);
        if (fromBalance < amount) {
            return { ok: false, reason: 'Insufficient currency' };
        }

        // Deduct from sender
        if (fromNation.currencyBalances) {
            fromNation.currencyBalances[fromCurrency] -= amount;
        } else if (fromCurrency === 'aurel') {
            fromNation.money -= amount;
        }

        // Convert to receiver's currency
        let receivedAmount;
        if (fromCurrency === toCurrency) {
            receivedAmount = amount;
        } else {
            receivedAmount = this.convertCurrency(amount, fromCurrency, toCurrency);
        }

        // Add to receiver
        if (toNation.currencyBalances) {
            toNation.currencyBalances[toCurrency] = (toNation.currencyBalances[toCurrency] || 0) + receivedAmount;
        } else if (toCurrency === 'aurel') {
            toNation.money = (toNation.money || 0) + receivedAmount;
        }

        // Track spending for currency rate dynamics
        const currency = this.currencies.get(fromCurrency);
        if (currency) {
            currency.spentRecently += amount;
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('currency_transferred', {
                fromNation: fromNation.nationName,
                toNation: toNation.nationName,
                fromCurrency,
                toCurrency,
                amountSent: amount,
                amountReceived: receivedAmount,
                converted: fromCurrency !== toCurrency
            });
        }

        return {
            ok: true,
            amountSent: amount,
            amountReceived: receivedAmount,
            fromCurrency,
            toCurrency,
            converted: fromCurrency !== toCurrency
        };
    }

    /**
     * Update currency exchange rates dynamically.
     * Based on: usage count (how many nations use it), circulation (total in circulation),
     * spentRecently (amount spent on buildings/military/upkeep/etc), plus random fluctuation.
     */
    updateCurrencyRates() {
        if (!window.Nation) return;

        const nations = window.Nations || {};
        const nationList = Object.values(nations);

        for (const [key, currency] of this.currencies.entries()) {
            // Count how many nations use this currency as their primary
            let usageCount = 0;
            let totalCirculation = 0;
            for (const n of nationList) {
                if (n.currency === key) usageCount++;
                const bal = (n.currencyBalances && n.currencyBalances[key]) || (key === 'aurel' ? (n.money || 0) : 0);
                totalCirculation += bal;
            }

            currency.usageCount = usageCount;
            currency.circulation = totalCirculation;

            // Decay spentRecently over time (recent spending window)
            currency.spentRecently = Math.floor(currency.spentRecently * 0.9);

            // Calculate dynamic rate factors
            // Usage factor: more users = more stable/valuable (0.5 to 1.5)
            const usageFactor = Math.max(0.5, Math.min(1.5, 1 + (usageCount - 5) * 0.05));

            // Circulation factor: high circulation relative to base = more velocity
            const circulationFactor = Math.max(0.5, Math.min(1.5, 1 + Math.log10(Math.max(totalCirculation, 1)) * 0.02));

            // Spending factor: recently spent currency loses value slightly (inflationary pressure)
            const spendingFactor = Math.max(0.5, Math.min(1.5, 1 - (currency.spentRecently / 1000000) * 0.1));

            // Random fluctuation (±5%)
            const randomFactor = 0.95 + Math.random() * 0.1;

            // Combine factors
            const newRate = Math.floor(currency.baseRate * usageFactor * circulationFactor * spendingFactor * randomFactor);
            currency.rate = Math.max(1, newRate);

            // Record history
            currency.history.push({ rate: currency.rate, at: Date.now() });
            if (currency.history.length > 100) currency.history.shift();
        }

        // Update the primary exchange rate indicator
        const aurel = this.currencies.get('aurel');
        this.indicators.exchangeRate = aurel ? aurel.rate / aurel.baseRate : 1.0;
    }

    /**
     * Record spending for currency rate dynamics (called when money/currency is spent)
     */
    recordCurrencySpending(currencyKey, amount) {
        const currency = this.currencies.get(currencyKey);
        if (currency) {
            currency.spentRecently += amount;
        }
    }

    /**
     * Update market prices based on supply and demand (goods and services only)
     */
    updateMarketPrices() {
        for (const [, market] of this.markets.goods.entries()) {
            this.updateMarketPrice(market);
        }
        for (const [, market] of this.markets.services.entries()) {
            this.updateMarketPrice(market);
        }
    }

    /**
     * Update individual market price
     */
    updateMarketPrice(market) {
        const supplyDemandRatio = market.supply / Math.max(market.demand, 1);
        const baseChange = (1 - supplyDemandRatio) * 0.02;
        const volatilityChange = (Math.random() - 0.5) * market.volatility;
        const trendChange = market.trend * 0.01;
        const totalChange = baseChange + volatilityChange + trendChange;

        market.currentPrice *= (1 + totalChange);
        market.currentPrice = Math.max(
            market.basePrice * 0.1,
            Math.min(market.basePrice * 5.0, market.currentPrice)
        );

        market.trend = market.trend * 0.95 + totalChange * 20;
        market.trend = Math.max(-10, Math.min(10, market.trend));
        market.volume = 0;
    }

    /**
     * Process industry production (resources removed — money/currency only)
     */
    processIndustryProduction() {
        if (!window.Nation) return;

        for (const [industryId, industry] of this.industries.entries()) {
            const productionRate = industry.employment * industry.efficiency;

            // Produce output (adds to national stockpile / goods market)
            if (productionRate > 0) {
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
     * Update economic indicators
     */
    updateEconomicIndicators() {
        if (!window.Nation) return;
        this.updateGDPGrowth();
        this.updateInflation();
        this.updateUnemployment();
        this.updateEconomicIndex();
    }

    /**
     * Update GDP growth rate
     */
    updateGDPGrowth() {
        if (!window.Nation) return;

        const previousGDP = this.history.gdp.length > 0
            ? this.history.gdp[this.history.gdp.length - 1]
            : window.Nation.gdp;

        if (previousGDP > 0) {
            this.indicators.gdpGrowthRate = (window.Nation.gdp - previousGDP) / previousGDP;
        }

        this.indicators.gdpGrowthRate *= (1 + this.policies.infrastructureSpending / 100);
        this.indicators.gdpGrowthRate *= (1 - this.policies.taxRate / 200);
    }

    /**
     * Update inflation rate (goods and services markets only)
     */
    updateInflation() {
        let totalPriceChange = 0;
        let marketCount = 0;

        for (const market of this.markets.goods.values()) {
            totalPriceChange += (market.currentPrice - market.basePrice) / market.basePrice;
            marketCount++;
        }
        for (const market of this.markets.services.values()) {
            totalPriceChange += (market.currentPrice - market.basePrice) / market.basePrice;
            marketCount++;
        }

        if (marketCount > 0) {
            this.indicators.inflationRate = totalPriceChange / marketCount;
        }

        this.indicators.inflationRate = Math.max(0, this.indicators.inflationRate);
    }

    /**
     * Update unemployment rate
     */
    updateUnemployment() {
        if (!window.Nation) return;

        let totalEmployment = 0;
        for (const industry of this.industries.values()) {
            totalEmployment += industry.employment;
        }

        const population = window.Nation.population || 0;
        const workforceSize = population * 0.6;

        if (workforceSize > 0) {
            this.indicators.unemploymentRate = Math.max(0, (workforceSize - totalEmployment) / workforceSize);
        } else {
            this.indicators.unemploymentRate = 0;
        }

        if (this.policies.socialSpending > 20) {
            this.indicators.unemploymentRate *= 0.9;
        }
    }

    /**
     * Update overall economic index
     */
    updateEconomicIndex() {
        let index = 100;
        index += this.indicators.gdpGrowthRate * 1000;

        const optimalInflation = 0.02;
        const inflationDeviation = Math.abs(this.indicators.inflationRate - optimalInflation);
        index -= inflationDeviation * 500;

        index -= this.indicators.unemploymentRate * 200;
        index += this.trade.tradeBalance * 0.01;

        this.indicators.economicIndex = Math.max(0, Math.min(200, index));
    }

    /**
     * Process active economic events (iterate backwards to avoid splice-skip)
     */
    processEconomicEvents() {
        for (let i = this.activeEvents.length - 1; i >= 0; i--) {
            const event = this.activeEvents[i];
            event.duration--;

            if (event.duration <= 0) {
                this.removeEventEffects(event);
                this.activeEvents.splice(i, 1);
            } else {
                this.applyEventEffects(event);
            }
        }
    }

    /**
     * Apply economic event effects (track originals for reversal)
     */
    applyEventEffects(event) {
        if (!event.effects) return;

        const eventId = event.id || `${event.name}_${Date.now()}`;
        const reversal = {};

        Object.entries(event.effects).forEach(([indicator, change]) => {
            if (this.indicators[indicator] !== undefined) {
                if (!this._appliedEventEffects.has(eventId)) {
                    this._appliedEventEffects.set(eventId, {});
                }
                const eventEffects = this._appliedEventEffects.get(eventId);
                if (eventEffects[indicator] === undefined) {
                    eventEffects[indicator] = this.indicators[indicator];
                }
                reversal[indicator] = eventEffects[indicator];
                this.indicators[indicator] *= (1 + change);
            }
        });

        if (Object.keys(reversal).length > 0) {
            this._appliedEventEffects.get(eventId).reversal = reversal;
        }
    }

    /**
     * Remove economic event effects (reverse previously applied changes)
     */
    removeEventEffects(event) {
        const eventId = event.id || `${event.name}_${Date.now()}`;
        const eventEffects = this._appliedEventEffects.get(eventId);

        if (eventEffects && eventEffects.reversal) {
            Object.entries(eventEffects.reversal).forEach(([indicator, originalValue]) => {
                this.indicators[indicator] = originalValue;
            });
        }

        this._appliedEventEffects.delete(eventId);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('economic_event_ended', { event });
        }
    }

    /**
     * Update trade flows (currency-based)
     */
    updateTradeFlows() {
        for (const [currencyKey, amount] of this.trade.exports.entries()) {
            if (amount > 0) {
                const currency = this.currencies.get(currencyKey);
                if (currency) {
                    currency.circulation += amount * 0.1;
                }
            }
        }

        let exportValue = 0;
        let importValue = 0;

        for (const [currencyKey, amount] of this.trade.exports.entries()) {
            const currency = this.currencies.get(currencyKey);
            if (currency) {
                exportValue += amount * currency.rate;
            }
        }

        for (const [currencyKey, amount] of this.trade.imports.entries()) {
            const currency = this.currencies.get(currencyKey);
            if (currency) {
                importValue += amount * currency.rate;
            }
        }

        this.trade.tradeBalance = exportValue - importValue;
    }

    /**
     * Record economic history for analysis
     */
    recordEconomicHistory() {
        if (!window.Nation) return;

        this.history.gdp.push(window.Nation.gdp);
        if (this.history.gdp.length > this.history.maxHistoryLength) {
            this.history.gdp.shift();
        }

        this.history.inflation.push(this.indicators.inflationRate);
        if (this.history.inflation.length > this.history.maxHistoryLength) {
            this.history.inflation.shift();
        }

        this.history.unemployment.push(this.indicators.unemploymentRate);
        if (this.history.unemployment.length > this.history.maxHistoryLength) {
            this.history.unemployment.shift();
        }
    }

    /**
     * Calculate monthly statistics
     */
    calculateMonthlyStatistics() {
        const monthLength = 30;

        if (this.history.gdp.length >= monthLength) {
            const recentGDP = this.history.gdp.slice(-monthLength);
            let avgGrowth = 0;
            let count = 0;
            for (let index = 1; index < recentGDP.length; index++) {
                avgGrowth += (recentGDP[index] - recentGDP[index - 1]) / recentGDP[index - 1];
                count++;
            }
            if (count > 0) avgGrowth /= count;

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('monthly_economic_report', {
                    averageGrowth: avgGrowth,
                    currentIndicators: { ...this.indicators },
                    tradeBalance: this.trade.tradeBalance,
                    currencies: this.getCurrencyConfig()
                });
            }
        }
    }

    /**
     * Generate random economic events
     */
    generateRandomEconomicEvents() {
        if (Math.random() < 0.15) {
            const allEconomicEvents = [];

            if (typeof EconomicEventsData !== 'undefined' && EconomicEventsData) {
                Object.values(EconomicEventsData).forEach(category => {
                    if (Array.isArray(category)) {
                        category.forEach(event => {
                            const weight = event.weight || 1;
                            for (let i = 0; i < weight; i++) {
                                allEconomicEvents.push(event);
                            }
                        });
                    }
                });
            }

            if (allEconomicEvents.length === 0) {
                allEconomicEvents = [
                    { name: 'Market Boom', description: 'Markets experience unexpected growth', duration: 30, effects: { gdpGrowthRate: 0.05 } },
                    { name: 'Supply Chain Disruption', description: 'International supply chains are disrupted', duration: 15, effects: { inflationRate: 0.02 } },
                    { name: 'Technology Innovation', description: 'New technologies boost productivity', duration: 60, effects: { gdpGrowthRate: 0.03, unemploymentRate: -0.01 } },
                    { name: 'Trade War', description: 'International trade tensions rise', duration: 45, effects: { gdpGrowthRate: -0.02 } },
                    { name: 'Currency Crisis', description: 'A major currency loses value rapidly', duration: 20, effects: { economicIndex: -0.1 } },
                    { name: 'Economic Sanctions', description: 'Trade restrictions reduce currency circulation', duration: 25, effects: { gdpGrowthRate: -0.01, unemploymentRate: 0.01 } }
                ];
            }

            const event = allEconomicEvents[Math.floor(Math.random() * allEconomicEvents.length)];
            event.id = `${event.name}_${Date.now()}`;
            this.activeEvents.push({ ...event });

            if (typeof EventBus !== 'undefined') {
                EventBus.emit('economic_event_started', { event });
            }
        }
    }

    /**
     * Get market data for good or service
     */
    getMarket(item) {
        return this.markets.goods.get(item) || this.markets.services.get(item);
    }

    /**
     * Set tax rate
     */
    setTaxRate(rate) {
        const oldValue = this.policies.taxRate;
        this.policies.taxRate = Math.max(0, Math.min(100, rate));

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('policy_changed', { policy: 'taxRate', oldValue, newValue: rate });
        }
    }

    /**
     * Get economic overview
     */
    getEconomicOverview() {
        const currencies = {};
        for (const [key, currency] of this.currencies.entries()) {
            currencies[key] = {
                rate: currency.rate,
                baseRate: currency.baseRate,
                circulation: currency.circulation,
                usageCount: currency.usageCount,
                symbol: currency.symbol || key,
                abbrev: currency.abbrev || key.toUpperCase()
            };
        }

        return {
            indicators: { ...this.indicators },
            policies: { ...this.policies },
            trade: {
                balance: this.trade.tradeBalance,
                imports: Object.fromEntries(this.trade.imports),
                exports: Object.fromEntries(this.trade.exports)
            },
            markets: {
                goods: Object.fromEntries(
                    Array.from(this.markets.goods.entries()).map(([k, v]) => [k, {
                        price: v.currentPrice,
                        change: ((v.currentPrice - v.basePrice) / v.basePrice * 100).toFixed(1) + '%'
                    }])
                ),
                services: Object.fromEntries(
                    Array.from(this.markets.services.entries()).map(([k, v]) => [k, {
                        price: v.currentPrice,
                        change: ((v.currentPrice - v.basePrice) / v.basePrice * 100).toFixed(1) + '%'
                    }])
                )
            },
            currencies,
            activeEvents: this.activeEvents.length
        };
    }

    /**
     * Reset market prices to base values
     */
    resetMarketPrices() {
        for (const market of this.markets.goods.values()) {
            market.currentPrice = market.basePrice;
            market.trend = 0;
            market.volume = 0;
        }
        for (const market of this.markets.services.values()) {
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
                goods: Object.fromEntries(this.markets.goods),
                services: Object.fromEntries(this.markets.services)
            },
            currencies: Object.fromEntries(this.currencies),
            industries: Object.fromEntries(this.industries),
            activeEvents: [...this.activeEvents],
            history: {
                gdp: [...this.history.gdp],
                inflation: [...this.history.inflation],
                unemployment: [...this.history.unemployment]
            },
            marketOffers: {
                buyOffers: Object.fromEntries(this.marketOffers.buyOffers),
                sellOffers: Object.fromEntries(this.marketOffers.sellOffers),
                escrow: Object.fromEntries(this.marketOffers.escrow),
                pendingCancellations: Object.fromEntries(this.marketOffers.pendingCancellations)
            },
            nextOfferId: this.nextOfferId
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
            if (state.markets.goods) this.markets.goods = new Map(Object.entries(state.markets.goods));
            if (state.markets.services) this.markets.services = new Map(Object.entries(state.markets.services));
        }
        if (state.currencies) {
            this.currencies = new Map(Object.entries(state.currencies));
        }
        if (state.industries) this.industries = new Map(Object.entries(state.industries));
        if (state.activeEvents) this.activeEvents = [...state.activeEvents];
        if (state.history) {
            if (state.history.gdp) this.history.gdp = [...state.history.gdp];
            if (state.history.inflation) this.history.inflation = [...state.history.inflation];
            if (state.history.unemployment) this.history.unemployment = [...state.history.unemployment];
        }
        if (state.marketOffers) {
            if (state.marketOffers.buyOffers) {
                this.marketOffers.buyOffers = new Map(Object.entries(state.marketOffers.buyOffers));
            }
            if (state.marketOffers.sellOffers) {
                this.marketOffers.sellOffers = new Map(Object.entries(state.marketOffers.sellOffers));
            }
            if (state.marketOffers.escrow) {
                this.marketOffers.escrow = new Map(Object.entries(state.marketOffers.escrow));
            }
            if (state.marketOffers.pendingCancellations) {
                this.marketOffers.pendingCancellations = new Map(Object.entries(state.marketOffers.pendingCancellations));
            }
        }
        if (state.nextOfferId) this.nextOfferId = state.nextOfferId;
    }

    /**
     * Perform annual economic review
     */
    performAnnualEconomicReview() { }

    /**
     * Update long-term economic trends
     */
    updateLongTermTrends() { }

    /**
     * Process economic cycles (boom/bust)
     */
    processEconomicCycles() { }

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
            majorEvents: this.activeEvents.length,
            currencies: this.getCurrencyConfig()
        };

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('annual_economic_report', { report });
        }
        return report;
    }

    /**
     * Handle trade execution (currency-based)
     */
    handleTradeExecuted(data) {
        if (data.type === 'import') {
            const current = this.trade.imports.get(data.currencyKey || 'aurel') || 0;
            this.trade.imports.set(data.currencyKey || 'aurel', current + data.amount);
        } else if (data.type === 'export') {
            const current = this.trade.exports.get(data.currencyKey || 'aurel') || 0;
            this.trade.exports.set(data.currencyKey || 'aurel', current + data.amount);
        }
    }

    /**
     * Handle policy changes
     */
    handlePolicyChanged(data) {
        if (typeof EventBus !== 'undefined') {
            console.log(`Economic policy changed: ${data.policy} = ${data.newValue}`);
        }
    }

    /**
     * Process corporate activities
     */
    processCorporateActivities() { }

    /**
     * Update employment statistics
     */
    updateEmployment() { }

    /**
     * Update trade agreements
     */
    updateTradeAgreements() { }

    /**
     * Handle monthly economic updates
     */
    handleMonthPassed(data) {
        this.calculateMonthlyStatistics();
        this.processCorporateActivities();
        this.updateEmployment();
        this.generateRandomEconomicEvents();
        this.updateTradeAgreements();
    }

    /**
     * Handle yearly economic updates
     */
    handleYearPassed(data) {
        this.performAnnualEconomicReview();
        this.updateLongTermTrends();
        this.processEconomicCycles();
        this.generateAnnualReport();
    }

    /**
     * Destroy the economy system
     */
    destroy() {
        if (typeof EventBus !== 'undefined') {
            const dayEvent = typeof GameEvents !== 'undefined' ? GameEvents.DAY_PASSED : 'day_passed';
            const monthEvent = typeof GameEvents !== 'undefined' ? GameEvents.MONTH_PASSED : 'month_passed';
            const yearEvent = typeof GameEvents !== 'undefined' ? GameEvents.YEAR_PASSED : 'year_passed';

            EventBus.off(dayEvent, this.handleDayPassed, this);
            EventBus.off(monthEvent, this.handleMonthPassed, this);
            EventBus.off(yearEvent, this.handleYearPassed, this);
            EventBus.off('trade_executed', this.handleTradeExecuted, this);
            EventBus.off('policy_changed', this.handlePolicyChanged, this);
        }

        this.isInitialized = false;
        console.log('Economy System destroyed');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EconomySystem };
} else if (typeof window !== 'undefined') {
    window.EconomySystem = EconomySystem;
}
