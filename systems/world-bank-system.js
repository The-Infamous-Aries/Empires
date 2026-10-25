/**
 * World Bank System - AI-driven bank for loans and resource marketplace
 */
class WorldBankSystem {
    constructor() {
        this.isInitialized = false;
        this.loanRate = 0.15; // 15% of income per turn
        this.maxLoanMultiplier = 5; // income * multiplier
        this.resourcePrices = {};
        this.bindEvents();
    }
    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('turn_updated', () => this.processLoanRepayments());
        }
    }
    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        console.log('World Bank System initialized');
    }
    getLoanLimit(nation) {
        const income = nation?.taxRevenue || 0;
        const playDays = (nation?.foundedDay ? (Date.now() / 86400000) : 1);
        const multiplier = Math.min(this.maxLoanMultiplier, 1 + playDays * 0.1);
        return Math.floor(income * multiplier);
    }
    takeLoan(nation, amount) {
        const limit = this.getLoanLimit(nation);
        if (amount > limit) return { ok: false, reason: 'Exceeds loan limit' };
        nation.money += amount;
        nation.loans = nation.loans || [];
        nation.loans.push({ amount, rate: this.loanRate, takenAt: Date.now() });
        return { ok: true };
    }
    processLoanRepayments() {
        if (!window.Nation) return;
        const n = window.Nation;
        if (!n.loans) return;
        const repayment = Math.floor((n.taxRevenue || 0) * this.loanRate);
        n.money -= repayment;
        n.loans.forEach(l => { l.remaining = (l.remaining || l.amount) - repayment; });
        n.loans = n.loans.filter(l => (l.remaining || 0) > 0);
    }
    calculateResourcePrice(resource, supplyCount, circulation) {
        const base = 100;
        const scarcity = supplyCount > 0 ? 1 / supplyCount : 2;
        const demand = circulation > 0 ? circulation / 1000 : 1;
        return Math.max(1, Math.floor(base * scarcity * demand));
    }
    buyResource(nation, resource, amount) { return { ok: false, reason: 'Resources removed' }; }
    destroy() { this.isInitialized = false; }
}
if (typeof module !== 'undefined' && module.exports) module.exports = WorldBankSystem;
else window.WorldBankSystem = WorldBankSystem;