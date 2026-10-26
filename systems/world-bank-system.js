/**
 * World Bank System - AI-driven bank for loans and currency investments
 * Resources removed - money-only economy. Currency system added.
 * Currency exchange rates are owned by EconomySystem (single source of truth).
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

class WorldBankSystem {
    constructor() {
        this.isInitialized = false;
        this.loanRate = 0.15; // 15% of income per turn
        this.maxLoanMultiplier = 5; // income * multiplier
        this.currencies = {};
        this.bindEvents();
    }
    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('day_passed', () => this.processLoanRepayments());
            EventBus.on('day_passed', () => this.syncCurrencyRates());
        }
    }
    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('World Bank System initialized (currency rates owned by EconomySystem)');
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
            for (const [key, currency] of Object.entries(liveConfig)) {
                if (this.currencies[key]) {
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
            playDays = Math.max(1, Math.floor((Date.now() - founded) / 86400000));
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
     */
    processLoanRepayments() {
        if (!window.Nation) return;
        const n = window.Nation;
        if (!n.loans || n.loans.length === 0) return;

        const repayment = Math.floor((n.taxRevenue || 0) * this.loanRate);
        if (repayment <= 0) return;

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

        const balance = nation.currencyBalances ? (nation.currencyBalances.aurel || 0) : (nation.money || 0);
        if (balance < cost) throw new Error('Insufficient money');

        // Deduct from aurel balance
        if (nation.currencyBalances) {
            nation.currencyBalances.aurel -= cost;
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
            window.EconomySystem.recordCurrencySpending('aurel', cost);
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

        // Add to aurel balance
        if (nation.currencyBalances) {
            nation.currencyBalances.aurel = (nation.currencyBalances.aurel || 0) + proceeds;
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
    calculateResourcePrice(resource, supplyCount, circulation) {
        return { ok: false, reason: 'Resources removed' };
    }
    buyResource(nation, resource, amount) { return { ok: false, reason: 'Resources removed' }; }
    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off('day_passed', this.processLoanRepayments, this);
            EventBus.off('day_passed', this.syncCurrencyRates, this);
        }
        this.isInitialized = false;
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = WorldBankSystem;
else window.WorldBankSystem = WorldBankSystem;
