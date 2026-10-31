/**
 * World Bank System - AI-driven bank for loans and currency investments
 * Resources removed - money-only economy. Currency system added.
 * Currency exchange rates are owned by EconomySystem (single source of truth).
 * World Bank also controls interest rates for stacked taxes and unpaid bills.
 */

// 6 Currency types (canonical config, mirrored in economy-system.js)
const CURRENCIES = {
  aurel:   { key: 'aurel',   name: 'Aurel',   abbrev: 'AUR', symbol: '₳', baseRate: 100 },
  velt:    { key: 'velt',    name: 'Velt',    abbrev: 'VLT', symbol: '✦', baseRate: 100 },
  krona:   { key: 'krona',   name: 'Krona',   abbrev: 'KRN', symbol: '₭', baseRate: 100 },
  drachma: { key: 'drachma', name: 'Drachma', abbrev: 'DRM', symbol: 'ð', baseRate: 100 },
  sovereign: { key: 'sovereign', name: 'Sovereign', abbrev: 'SOV', symbol: 'ꜱ', baseRate: 100 },
  talon:   { key: 'talon',   name: 'Talon',   abbrev: 'TLN', symbol: '₮', baseRate: 100 },
};

// Thresholds for interest compounding
const TAX_STACK_THRESHOLD = 12;   // Interest starts applying at 12 stacked turns
const TAX_COMPOUND_INTERVAL = 6;  // Compounds every 6 turns after threshold
const BILL_STACK_THRESHOLD = 24;  // Interest starts applying at 24 stacked turns
const BILL_COMPOUND_INTERVAL = 12;// Compounds every 12 turns after threshold

class WorldBankSystem {
    constructor() {
        this.isInitialized = false;
        this.loanRate = 0.15; // 15% of income per turn
        this.maxLoanMultiplier = 5; // income * multiplier
        this.currencies = {};
        // Tracking territory purchases for tax calculation
        this.territoryPurchaseCounts = {}; // nation.id -> { count: number, lastPurchaseDay: number }
        this.globalTerritoryPurchaseCount = 0;
        this.globalTerritoryPurchaseTurns = {}; // turnNumber -> count
        this.bindEvents();
    }
    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('day_passed', this._onDayPassed.bind(this));
        }
    }

    _onDayPassed() {
        // 1. Sync live rates from EconomySystem (single source of truth) into
        //    World Bank's local cache for backward-compatible reads.
        this.syncCurrencyRates();
        // 2. Trigger EconomySystem's dynamic rate formula (usage, circulation,
        //    spending, random fluctuation) so currencies rise/fall each turn.
        this.updateCurrencyRates();
        // 3. Re-sync after EconomySystem mutated rates so World Bank cache stays current.
        this.syncCurrencyRates();
        // 4. Process loan repayments for every nation (player + AI).
        this.processLoanRepayments();
    }
    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('World Bank System initialized (currency rates owned by EconomySystem)');
        // Seed currency balances on the nation if EconomySystem owns them.
        if (window.EconomySystem && typeof window.EconomySystem.initializeCurrencies === 'function') {
            window.EconomySystem.initializeCurrencies();
        }
    }
    /**
     * Get currency configuration. Defers to EconomySystem for live rates if available.
     */
    getCurrencyConfig() {
        if (window.EconomySystem && typeof window.EconomySystem.getCurrencyConfig === 'function') {
            return window.EconomySystem.getCurrencyConfig();
        }
        const config = {};
        for (const [key, cfg] of Object.entries(CURRENCIES)) {
            config[key] = { ...cfg };
        }
        return config;
    }
    /**
     * Initialize currency state in world. Delegates to EconomySystem if available.
     */
    initWorldCurrencies(worldState) {
        if (window.EconomySystem && typeof window.EconomySystem.initializeCurrencies === 'function') {
            window.EconomySystem.initializeCurrencies();
            if (window.Nation && !window.Nation.currencyBalances) {
                window.EconomySystem.getAllCurrencyBalances(); // triggers seeding in getAllCurrencyBalances
            }
            return;
        }

        if (!worldState.currencies) {
            worldState.currencies = {};
        }
        for (const [key, cfg] of Object.entries(CURRENCIES)) {
            if (!worldState.currencies[key]) {
                worldState.currencies[key] = {
                    key: cfg.key,
                    name: cfg.name,
                    abbrev: cfg.abbrev,
                    symbol: cfg.symbol,
                    rate: cfg.baseRate,
                    history: [{ rate: cfg.baseRate, at: Date.now() }],
                };
            }
        }
    }
    /**
     * Sync currency rates from EconomySystem into worldState (for backward compatibility).
     * EconomySystem is the single source of truth for rates.
     */
    syncCurrencyRates() {
        if (window.EconomySystem && typeof window.EconomySystem.getCurrencyConfig === 'function') {
            const liveConfig = window.EconomySystem.getCurrencyConfig();
            const now = Date.now();
            for (const [key, currency] of Object.entries(liveConfig)) {
                if (this.currencies[key]) {
                    const oldRate = this.currencies[key].rate;
                    if (oldRate !== currency.rate) {
                        this.currencies[key].history.push({ rate: currency.rate, at: now });
                    }
                    this.currencies[key].rate = currency.rate;
                } else {
                    this.currencies[key] = { ...currency };
                }
            }
            return;
        }

        // Fallback: no EconomySystem, keep existing worldState.currencies untouched
        // (EconomySystem owns rates; World Bank does not independently update them)
    }
    /**
     * Update currency rates (delegates to EconomySystem).
     * Kept for backward compatibility; EconomySystem.updateCurrencyRates() is the canonical caller.
     */
    updateCurrencyRates(worldState, nations) {
        if (window.EconomySystem && typeof window.EconomySystem.updateCurrencyRates === 'function') {
            window.EconomySystem.updateCurrencyRates();
            return;
        }
        // No EconomySystem: do not independently mutate rates.
    }

    // ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
    // INTEREST RATE CALCULATIONS (Taxes & Bills)
    // ═════════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get all nations that use a specific currency as their primary currency
     */
    getNationsOnCurrency(currencyKey) {
        const nations = [];
        if (!window.Nation || !currencyKey) return nations;
        // Check the current nation
        if (window.Nation.currency === currencyKey) {
            nations.push(window.Nation);
        }
        // Check if there are other tracked nations
        if (window.GameEngine && window.GameEngine.nations) {
            for (const [id, n] of Object.entries(window.GameEngine.nations)) {
                if (n.currency === currencyKey && n.id !== window.Nation.id) {
                    nations.push(n);
                }
            }
        }
        return nations;
    }

    /**
     * Get total number of nations in the game
     */
    getTotalNations() {
        let count = 1; // At least the current nation
        if (window.GameEngine && window.GameEngine.nations) {
            count = Math.max(count, Object.keys(window.GameEngine.nations).length);
        }
        return count;
    }

    /**
     * Get nations on a currency that have stacked taxes (stackedTaxesTurns > 0)
     */
    getNationsWithStackedTaxesOnCurrency(currencyKey) {
        const nationsOnCurrency = this.getNationsOnCurrency(currencyKey);
        return nationsOnCurrency.filter(n => (n.stackedTaxesTurns || 0) > 0);
    }

    /**
     * Get nations on a currency that have unpaid bills (stackedBillsTurns > 0)
     */
    getNationsWithStackedBillsOnCurrency(currencyKey) {
        const nationsOnCurrency = this.getNationsOnCurrency(currencyKey);
        return nationsOnCurrency.filter(n => (n.stackedBillsTurns || 0) > 0);
    }

    /**
     * Calculate currency volatility from other currencies (rising/falling)
     * Measures how much other currency rates have changed from their base rates
     */
    getOtherCurrencyVolatility(currencyKey) {
        const config = this.getCurrencyConfig();
        if (!config || Object.keys(config).length <= 1) return 0;
        let totalVolatility = 0;
        let count = 0;
        for (const [key, currency] of Object.entries(config)) {
            if (key === currencyKey) continue;
            const baseRate = currency.baseRate || 100;
            const currentRate = currency.rate || currency.baseRate || 100;
            if (!baseRate || baseRate <= 0) continue;
            const change = Math.abs(currentRate - baseRate) / baseRate;
            totalVolatility += change;
            count++;
        }
        return count > 0 ? totalVolatility / count : 0;
    }

    /**
     * Calculate tax interest rate for a nation's currency.
     * Complex formula based on:
     *   - Amount of nations on that currency
     *   - Amount of nations on that currency with stacked taxes
     *   - Other currencies' rising/falling values
     *
     * Returns a decimal rate (e.g., 0.025 = 2.5%)
     */
    calculateTaxInterestRate(nation) {
        if (!nation || !nation.currency) return 0;

        const currencyKey = nation.currency;
        const config = this.getCurrencyConfig();
        const currencyConfig = config[currencyKey];
        if (!currencyConfig) return 0;

        const baseRate = 0.005; // 0.5% base interest rate

        // Factor 1: Currency usage - more nations on currency = more stable = lower rate
        const nationsOnCurrency = this.getNationsOnCurrency(currencyKey).length;
        const totalNations = Math.max(this.getTotalNations(), 1);
        const usageFactor = nationsOnCurrency / totalNations; // 0 to 1

        // Factor 2: Stacked taxes - more nations stacking taxes = higher demand = higher rate
        const nationsWithStackedTaxes = this.getNationsWithStackedTaxesOnCurrency(currencyKey).length;
        const stackedFactor = nationsOnCurrency > 0 ? nationsWithStackedTaxes / nationsOnCurrency : 0; // 0 to 1

        // Factor 3: Other currencies rising/falling = uncertainty = higher rate
        const volatilityFactor = this.getOtherCurrencyVolatility(currencyKey); // 0 to ~1+

        // Combined rate calculation
        // Base rate increases with usage, stacking, and volatility
        let rate = baseRate * (1 + usageFactor * 0.5) * (1 + stackedFactor * 1.0) * (1 + volatilityFactor * 0.5);

        // Cap at reasonable maximum
        return Math.min(Math.max(rate, 0), 0.15); // 0% to 15%
    }

    /**
     * Calculate bill interest rate for a nation's currency.
     * Always higher than tax interest rate to discourage bill stacking.
     *
     * Returns a decimal rate (e.g., 0.050 = 5.0%)
     */
    calculateBillInterestRate(nation) {
        const taxRate = this.calculateTaxInterestRate(nation);
        // Bills must always be higher than taxes: at least 1.5x tax rate + 1% minimum gap
        let billRate = taxRate * 1.5 + 0.01;
        // Cap at reasonable maximum
        return Math.min(Math.max(billRate, 0), 0.30); // 0% to 30%
    }

    /**
     * Calculate compound interest for stacked taxes.
     * Interest starts applying when stackedTaxesTurns >= TAX_STACK_THRESHOLD (12).
     * Compounds every TAX_COMPOUND_INTERVAL (6) turns after threshold.
     *
     * @param {number} stackedAmount - The stacked tax amount
     * @param {number} stackedTurns - How many turns it's been stacked
     * @param {number} rate - The interest rate (decimal)
     * @returns {number} - Interest amount to add
     */
    calculateTaxInterest(stackedAmount, stackedTurns, rate) {
        if (stackedTurns < TAX_STACK_THRESHOLD || rate <= 0 || stackedAmount <= 0) return 0;

        // Calculate how many compounding periods have passed
        const turnsPastThreshold = stackedTurns - TAX_STACK_THRESHOLD;
        const compoundCount = Math.floor(turnsPastThreshold / TAX_COMPOUND_INTERVAL);

        // Compound interest: amount * rate * compoundCount
        // Each compound period adds rate * amount
        const interest = stackedAmount * rate * compoundCount;

        return interest;
    }

    /**
     * Calculate compound interest for unpaid bills.
     * Interest starts applying when stackedBillsTurns >= BILL_STACK_THRESHOLD (24).
     * Compounds every BILL_COMPOUND_INTERVAL (12) turns after threshold.
     *
     * @param {number} stackedAmount - The stacked bill amount
     * @param {number} stackedTurns - How many turns it's been stacked
     * @param {number} rate - The interest rate (decimal)
     * @returns {number} - Interest amount to add
     */
    calculateBillInterest(stackedAmount, stackedTurns, rate) {
        if (stackedTurns < BILL_STACK_THRESHOLD || rate <= 0 || stackedAmount <= 0) return 0;

        // Calculate how many compounding periods have passed
        const turnsPastThreshold = stackedTurns - BILL_STACK_THRESHOLD;
        const compoundCount = Math.floor(turnsPastThreshold / BILL_COMPOUND_INTERVAL);

        // Compound interest: amount * rate * compoundCount
        const interest = stackedAmount * rate * compoundCount;

        return interest;
    }

    /**
     * Get interest rate info for UI display
     */
    getInterestRateInfo(nation) {
        if (!nation || !nation.currency) return null;

        const currencyKey = nation.currency;
        const taxRate = this.calculateTaxInterestRate(nation);
        const billRate = this.calculateBillInterestRate(nation);

        return {
            currencyKey,
            taxRate,
            billRate,
            taxRatePercent: (taxRate * 100).toFixed(2),
            billRatePercent: (billRate * 100).toFixed(2),
            taxStackThreshold: TAX_STACK_THRESHOLD,
            taxCompoundInterval: TAX_COMPOUND_INTERVAL,
            billStackThreshold: BILL_STACK_THRESHOLD,
            billCompoundInterval: BILL_COMPOUND_INTERVAL,
            nationsOnCurrency: this.getNationsOnCurrency(currencyKey).length,
            totalNations: this.getTotalNations(),
        };
    }

    // ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
    // LOAN SYSTEM (Existing)
    // ═════════════════════════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Get loan limit based on nation tax revenue and days played.
     */
    getLoanLimit(nation) {
        const income = nation?.taxRevenue || 0;
        let playDays = 1;
        if (nation?.foundedDay) {
            const founded = typeof nation.foundedDay === 'number'
                ? nation.foundedDay
                : new Date(nation.foundedDay).getTime();
            if (founded > 1e12) {
                // Timestamp: convert ms to days
                playDays = Math.max(1, Math.floor((Date.now() - founded) / 86400000));
            } else if (window.TimeSystem && typeof window.TimeSystem.currentDay === 'number') {
                // Game-day integer
                playDays = Math.max(1, Math.floor(window.TimeSystem.currentDay - founded));
            } else {
                playDays = 1;
            }
        }
        const multiplier = Math.min(this.maxLoanMultiplier, 1 + playDays * 0.1);
        return Math.floor(income * multiplier);
    }
    /**
     * Take a loan. Adds funds to currencyBalances.aurel (or legacy nation.money).
     */
    takeLoan(nation, amount) {
        const limit = this.getLoanLimit(nation);
        if (amount > limit) return { ok: false, reason: 'Exceeds loan limit' };

        if (nation.currencyBalances) {
            nation.currencyBalances.aurel = (nation.currencyBalances.aurel || 0) + amount;
        } else {
            nation.money = (nation.money || 0) + amount;
        }

        nation.loans = nation.loans || [];
        nation.loans.push({ amount, rate: this.loanRate, takenAt: Date.now(), remaining: amount });
        return { ok: true };
    }
    /**
     * Process loan repayments. Deducts from currencyBalances.aurel (or legacy nation.money).
     * Repayment is split across all active loans, not applied in full to each.
     * Processes every nation (player + AI) that has active loans.
     */
    processLoanRepayments() {
        const nations = [];
        if (window.GameEngine && window.GameEngine.nations) {
            for (const n of Object.values(window.GameEngine.nations)) {
                nations.push(n);
            }
        }
        if (window.Nation && !nations.includes(window.Nation)) {
            nations.push(window.Nation);
        }

        for (const n of nations) {
            if (!n.loans || n.loans.length === 0) continue;

            const repayment = Math.floor((n.taxRevenue || 0) * this.loanRate);
            if (repayment <= 0) continue;

            // Split repayment across all active loans
            const perLoan = Math.floor(repayment / n.loans.length);
            let remainingRepayment = repayment;

            for (const loan of n.loans) {
                if (remainingRepayment <= 0) break;
                const payment = Math.min(perLoan, loan.remaining || loan.amount);
                loan.remaining = (loan.remaining || loan.amount) - payment;
                remainingRepayment -= payment;
            }

            // Apply any leftover repayment to the first loan
            if (remainingRepayment > 0 && n.loans.length > 0) {
                const first = n.loans[0];
                first.remaining = Math.max(0, (first.remaining || first.amount) - remainingRepayment);
            }

            // Deduct total repayment from nation balance
            if (n.currencyBalances) {
                n.currencyBalances.aurel = Math.max(0, (n.currencyBalances.aurel || 0) - repayment);
            } else {
                n.money = Math.max(0, (n.money || 0) - repayment);
            }

            // Remove paid-off loans
            n.loans = n.loans.filter(l => (l.remaining || 0) > 0);
        }
    }
    // ── Currency Investment System ──
    /**
     * Buy currency points. Deducts from currencyBalances.aurel (or legacy nation.money).
     * Records spending in EconomySystem for rate dynamics.
     */
    currencyBuy(nation, currencyKey, points, worldState) {
        points = Math.floor(points);
        if (!CURRENCIES[currencyKey]) throw new Error('Unknown currency');
        if (points <= 0) throw new Error('Invalid amount');

        // Get live rate from EconomySystem if available
        let currencyRate;
        if (window.EconomySystem && typeof window.EconomySystem.getCurrencyConfig === 'function') {
            const config = window.EconomySystem.getCurrencyConfig();
            currencyRate = config[currencyKey]?.rate;
            if (currencyRate === undefined) throw new Error('Currency not initialized in EconomySystem');
        } else {
            const currency = worldState && worldState.currencies && worldState.currencies[currencyKey];
            if (!currency) throw new Error('Currency not initialized');
            currencyRate = currency.rate;
        }

        const cost = Math.ceil(points * currencyRate);

        // Deduct from the nation's PRIMARY currency (aurel by default), not the
        // currency being bought — otherwise buying a currency requires already
        // holding that same currency (circular).
        const primaryKey = nation.currency || 'aurel';
        const primaryBalance = nation.currencyBalances ? (nation.currencyBalances[primaryKey] || 0) : (nation.money || 0);
        if (primaryBalance < cost) throw new Error('Insufficient money');

        // Deduct cost from primary currency balance
        if (nation.currencyBalances) {
            nation.currencyBalances[primaryKey] = (nation.currencyBalances[primaryKey] || 0) - cost;
        } else {
            nation.money -= cost;
        }

        nation.currencyInvestments = nation.currencyInvestments || {};
        if (!nation.currencyInvestments[currencyKey]) {
            nation.currencyInvestments[currencyKey] = { points: 0, entryPrice: 0, totalSpent: 0 };
        }
        const inv = nation.currencyInvestments[currencyKey];
        const newPoints = inv.points + points;
        const newTotalSpent = inv.totalSpent + cost;
        inv.entryPrice = newTotalSpent / newPoints; // average entry price
        inv.points = newPoints;
        inv.totalSpent = newTotalSpent;

        // Record spending for currency rate dynamics (EconomySystem owns rates)
        if (window.EconomySystem && typeof window.EconomySystem.recordCurrencySpending === 'function') {
            window.EconomySystem.recordCurrencySpending(currencyKey, cost);
        }

        return { points, cost, entryPrice: inv.entryPrice, currentRate: currencyRate };
    }
    /**
     * Sell currency points back. Adds proceeds to currencyBalances.aurel (or legacy nation.money).
     */
    currencySell(nation, currencyKey, points, worldState) {
        points = Math.floor(points);
        if (!CURRENCIES[currencyKey]) throw new Error('Unknown currency');
        if (points <= 0) throw new Error('Invalid amount');

        nation.currencyInvestments = nation.currencyInvestments || {};
        const inv = nation.currencyInvestments[currencyKey];
        if (!inv || inv.points < points) throw new Error('Not enough currency points');

        // Get live rate from EconomySystem if available
        let currencyRate;
        if (window.EconomySystem && typeof window.EconomySystem.getCurrencyConfig === 'function') {
            const config = window.EconomySystem.getCurrencyConfig();
            currencyRate = config[currencyKey]?.rate;
            if (currencyRate === undefined) throw new Error('Currency not initialized in EconomySystem');
        } else {
            const currency = worldState && worldState.currencies && worldState.currencies[currencyKey];
            if (!currency) throw new Error('Currency not initialized');
            currencyRate = currency.rate;
        }

        const proceeds = Math.floor(points * currencyRate);

        // Add proceeds to the nation's PRIMARY currency (not the currency sold)
        const primaryKey = nation.currency || 'aurel';
        if (nation.currencyBalances) {
            nation.currencyBalances[primaryKey] = (nation.currencyBalances[primaryKey] || 0) + proceeds;
        } else {
            nation.money = (nation.money || 0) + proceeds;
        }

        inv.points -= points;
        if (inv.points === 0) {
            inv.entryPrice = 0;
            inv.totalSpent = 0;
        }
        return { points, proceeds, currentRate: currencyRate };
    }
    /**
     * Get investment status. Reads live rate from EconomySystem if available.
     */
    getInvestmentStatus(nation, currencyKey, worldState) {
        nation.currencyInvestments = nation.currencyInvestments || {};
        const inv = nation.currencyInvestments[currencyKey];

        // Get live rate from EconomySystem if available
        let currencyRate;
        if (window.EconomySystem && typeof window.EconomySystem.getCurrencyConfig === 'function') {
            const config = window.EconomySystem.getCurrencyConfig();
            currencyRate = config[currencyKey]?.rate || 0;
        } else {
            const currency = worldState && worldState.currencies && worldState.currencies[currencyKey];
            currencyRate = currency?.rate || 0;
        }

        if (!inv || inv.points === 0) {
            return { points: 0, entryPrice: 0, currentRate: currencyRate, pnl: 0 };
        }
        const currentValue = inv.points * currencyRate;
        const pnl = currentValue - inv.totalSpent;
        return { points: inv.points, entryPrice: inv.entryPrice, currentRate: currencyRate, pnl };
    }

    /**
     * Calculate the cost to purchase a new territory.
     * Compounding cost: first territory cheap, scales upward.
     *
     * @param {object} nation - The nation purchasing
     * @param {number} baseCost - Base cost for first territory (default 1000)
     * @param {number} growthRate - Growth multiplier per territory (default 1.5)
     * @returns {object} { baseCost, taxAmount, totalCost, breakdown }
     */
    calculateTerritoryPurchaseCost(nation, baseCost = 1000, growthRate = 1.5) {
        if (!nation) return { baseCost: 0, taxAmount: 0, totalCost: 0, breakdown: {} };

        const slotsOwned = nation.territorySlotsOwned || 0;
        const territoryIndex = slotsOwned + 1; // Next territory number

        // Base compounding cost: first territory cheap, scales upward
        const baseTerritoryCost = Math.floor(baseCost * Math.pow(growthRate, territoryIndex - 1));

        // Calculate tax multiplier based on multiple factors
        const taxBreakdown = this.calculateTerritoryTaxMultiplier(nation, baseTerritoryCost);

        const taxAmount = Math.floor(baseTerritoryCost * taxBreakdown.totalMultiplier);
        const totalCost = Math.floor(baseTerritoryCost + taxAmount);

        return {
            baseCost: Math.floor(baseTerritoryCost),
            taxAmount,
            totalCost,
            breakdown: {
                ...taxBreakdown.breakdown,
                territoryIndex,
                slotsOwned,
                baseCost: Math.floor(baseTerritoryCost)
            }
        };
    }

    /**
     * Get territory purchase cost info for UI display
     */
    getTerritoryCostInfo(nation, currentDay) {
        if (!nation) return null;

        const costInfo = this.calculateTerritoryPurchaseCost(nation);
        const taxInfo = this.getInterestRateInfo(nation);

        return {
            baseCost: costInfo.baseCost,
            taxAmount: costInfo.taxAmount,
            totalCost: costInfo.totalCost,
            breakdown: costInfo.breakdown,
            taxRateInfo: taxInfo
        };
    }

    /**
     * Calculate tax multiplier for territory purchase based on:
     * 1. Recent purchases (user + global total) - more purchases = higher tax
     * 2. Slots owned ratio vs world average - above average = higher tax
     * 3. Currency value - higher currency value = higher tax
     *
     * @param {object} nation - The nation purchasing
     * @param {number} baseCost - Base territory cost
     * @returns {object} { totalMultiplier, breakdown }
     */
    calculateTerritoryTaxMultiplier(nation, baseCost) {
        const currencyKey = nation.currency || 'aurel';
        const config = this.getCurrencyConfig();
        const currencyConfig = config[currencyKey] || { baseRate: 100 };
        const currencyValue = currencyConfig.baseRate || 100;

        // Factor 1: Recent purchases (user + global total)
        const nationPurchaseCount = nation.territoryPurchaseCounts && nation.territoryPurchaseCounts.count
            ? nation.territoryPurchaseCounts.count
            : 0;
        const globalPurchaseCount = this.globalTerritoryPurchaseCount || 0;

        // Purchase factor: more purchases = higher tax (capped at 2x)
        const purchaseFactor = 1 + Math.min(nationPurchaseCount * 0.1, 1.0) + Math.min(globalPurchaseCount * 0.05, 1.0);

        // Factor 2: Slots owned ratio vs world average
        const slotsOwned = nation.territorySlotsOwned || 0;
        const totalNations = Math.max(this.getTotalNations(), 1);
        const totalSlotsOwned = this.getTotalSlotsOwned();
        const averageSlotsPerNation = totalSlotsOwned / totalNations;

        let slotRatioFactor = 1;
        if (averageSlotsPerNation > 0) {
            const slotRatio = slotsOwned / averageSlotsPerNation;
            if (slotRatio > 1) {
                // Above average: higher tax (up to +50%)
                slotRatioFactor = 1 + Math.min((slotRatio - 1) * 0.5, 0.5);
            } else {
                // Below average: lower tax (down to 0.5x)
                slotRatioFactor = Math.max(0.5, slotRatio);
            }
        }

        // Factor 3: Currency value - higher currency value = higher tax
        // Base rate 100 = neutral. Higher = more expensive currency = higher tax
        const currencyValueFactor = Math.max(0.5, Math.min(2.0, currencyValue / 100));

        // Combined multiplier
        const totalMultiplier = purchaseFactor * slotRatioFactor * currencyValueFactor;

        const breakdown = {
            purchaseFactor: Math.round(purchaseFactor * 100) / 100,
            slotRatioFactor: Math.round(slotRatioFactor * 100) / 100,
            currencyValueFactor: Math.round(currencyValueFactor * 100) / 100,
            totalMultiplier: Math.round(totalMultiplier * 100) / 100,
            nationsOnCurrency: this.getNationsOnCurrency(currencyKey).length,
            totalNations: totalNations,
            slotsOwned,
            averageSlotsPerNation: Math.round(averageSlotsPerNation * 10) / 10,
            currencyValue
        };

        return { totalMultiplier, breakdown };
    }

    /**
     * Get total slots owned across all nations
     */
    getTotalSlotsOwned() {
        let total = 0;
        const seen = new Set();
        if (window.GameEngine && window.GameEngine.nations) {
            for (const [id, n] of Object.entries(window.GameEngine.nations)) {
                if (seen.has(id)) continue;
                seen.add(id);
                total += n.territorySlotsOwned || 0;
            }
        }
        if (window.Nation && !seen.has(window.Nation.id)) {
            total += window.Nation.territorySlotsOwned || 0;
        }
        return total;
    }

    /**
     * Record a territory purchase for tax tracking
     */
    recordTerritoryPurchase(nation, currentDay) {
        if (!nation) return;

        if (!nation.territoryPurchaseCounts) {
            nation.territoryPurchaseCounts = { count: 0, lastPurchaseDay: 0 };
        }
        nation.territoryPurchaseCounts.count = (nation.territoryPurchaseCounts.count || 0) + 1;
        nation.territoryPurchaseCounts.lastPurchaseDay = currentDay;
        if (!nation.territorySlotsOwned) nation.territorySlotsOwned = 0;
        nation.territorySlotsOwned++;

        this.globalTerritoryPurchaseCount = (this.globalTerritoryPurchaseCount || 0) + 1;
        this.globalTerritoryPurchaseTurns = this.globalTerritoryPurchaseTurns || {};
        if (currentDay !== undefined) {
            this.globalTerritoryPurchaseTurns[currentDay] = (this.globalTerritoryPurchaseTurns[currentDay] || 0) + 1;
        }

        // Decay old purchase counts over time (20% reduction per 7 days since last purchase)
        const daysSinceLast = currentDay !== undefined
            ? currentDay - (nation.territoryPurchaseCounts.lastPurchaseDay || currentDay)
            : 0;
        if (daysSinceLast >= 7) {
            const decaySteps = Math.floor(daysSinceLast / 7);
            let decayed = nation.territoryPurchaseCounts.count;
            for (let i = 0; i < decaySteps; i++) {
                decayed = Math.floor(decayed * 0.8);
            }
            nation.territoryPurchaseCounts.count = decayed;
        }
    }

    /**
     * Get territory purchase cost info for UI display
     */
    getTerritoryCostInfo(nation, currentDay) {
        if (!nation) return null;

        const costInfo = this.calculateTerritoryPurchaseCost(nation);
        const taxInfo = this.getInterestRateInfo(nation);

        return {
            baseCost: costInfo.baseCost,
            taxAmount: costInfo.taxAmount,
            totalCost: costInfo.totalCost,
            breakdown: costInfo.breakdown,
            taxRateInfo: taxInfo
        };
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = WorldBankSystem;
else window.WorldBankSystem = WorldBankSystem;
