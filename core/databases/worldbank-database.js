/**
 * World Bank Database - Handles world bank loans, inventory, prices
 * Source of truth: server/world.js (worldBank state)
 * Persisted to: saves/db/worldbank.json
 */

const BaseDatabase = require('./base-database');

class WorldBankDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            prices: { type: 'object', default: {} },
            targets: { type: 'object', default: {} },
            inventory: { type: 'object', default: {} },
            seeded: { type: 'boolean', default: false },
            loanRate: { type: 'number', default: 0.02 },
            loans: { type: 'array', default: [] },
            version: { type: 'number', default: 1 }
        };

        super('worldbank', schema);
    }

    async createWorldBank(bankData) {
        const id = bankData.id || 'world_bank';

        const bank = {
            id,
            prices: bankData.prices || {},
            targets: bankData.targets || {},
            inventory: bankData.inventory || {},
            seeded: bankData.seeded !== undefined ? bankData.seeded : false,
            loanRate: bankData.loanRate !== undefined ? bankData.loanRate : 0.02,
            loans: bankData.loans || [],
            version: 1
        };

        return await this.insert(id, bank);
    }

    async updatePrice(item, price) {
        const bank = this.findById('world_bank', ['admin']);
        if (!bank) throw new Error('World bank not found');

        const prices = { ...bank.prices };
        prices[item] = price;

        return await this.update('world_bank', { prices });
    }

    async updateTarget(item, target) {
        const bank = this.findById('world_bank', ['admin']);
        if (!bank) throw new Error('World bank not found');

        const targets = { ...bank.targets };
        targets[item] = target;

        return await this.update('world_bank', { targets });
    }

    async updateInventory(item, amount) {
        const bank = this.findById('world_bank', ['admin']);
        if (!bank) throw new Error('World bank not found');

        const inventory = { ...bank.inventory };
        inventory[item] = amount;

        return await this.update('world_bank', { inventory });
    }

    async addLoan(loanData) {
        const bank = this.findById('world_bank', ['admin']);
        if (!bank) throw new Error('World bank not found');

        const loans = [...(bank.loans || []), {
            id: loanData.id || this.generateLoanId(),
            nationId: loanData.nationId,
            principal: loanData.principal,
            owed: loanData.owed,
            rate: loanData.rate,
            takenAt: loanData.takenAt || Date.now(),
            status: loanData.status || 'active'
        }];

        return await this.update('world_bank', { loans });
    }

    async repayLoan(loanId, amount) {
        const bank = this.findById('world_bank', ['admin']);
        if (!bank) throw new Error('World bank not found');

        const loans = (bank.loans || []).map(loan => {
            if (loan.id === loanId) {
                const remainingOwed = Math.max(0, loan.owed - amount);
                return { ...loan, owed: remainingOwed, status: remainingOwed === 0 ? 'repaid' : 'active' };
            }
            return loan;
        });

        return await this.update('world_bank', { loans });
    }

    async findActiveLoans(permissions = ['public']) {
        const bank = this.findById('world_bank', permissions);
        if (!bank) return [];
        return (bank.loans || []).filter(l => l.status === 'active');
    }

    async findLoansByNation(nationId, permissions = ['public']) {
        const bank = this.findById('world_bank', permissions);
        if (!bank) return [];
        return (bank.loans || []).filter(l => l.nationId === nationId);
    }

    async markSeeded() {
        return await this.update('world_bank', { seeded: true });
    }

    async updateLoanRate(rate) {
        const bank = this.findById('world_bank', ['admin']);
        if (!bank) throw new Error('World bank not found');

        return await this.update('world_bank', { loanRate: rate });
    }

    /**
     * Accept server/world.js worldBank state and sync to DB.
     * server/world.js stores: prices, targets, inventory, seeded, loanRate
     * Loans are stored per-nation (n.loans), not in worldBank.loans.
     */
    async syncFromWorld(worldBankRecord) {
        const id = worldBankRecord.id || 'world_bank';
        const existing = this.findById(id, ['admin']);
        const normalized = {
            id,
            prices: worldBankRecord.prices || {},
            targets: worldBankRecord.targets || {},
            inventory: worldBankRecord.inventory || {},
            seeded: worldBankRecord.seeded !== undefined ? worldBankRecord.seeded : false,
            loanRate: worldBankRecord.loanRate !== undefined ? worldBankRecord.loanRate : 0.02,
            loans: worldBankRecord.loans || [],
            version: 1
        };
        if (existing) {
            return await this.update(id, normalized);
        } else {
            return await this.insert(id, normalized);
        }
    }

    /**
     * Get all per-nation loans from the database (for reference).
     * Note: server/world.js stores loans per-nation (n.loans), not in worldBank.
     * This method returns the loans array stored on the worldBank record itself
     * (used for any global loan tracking).
     */
    async getAllLoans(permissions = ['public']) {
        const bank = this.findById('world_bank', permissions);
        if (!bank) return [];
        return bank.loans || [];
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }

    generateLoanId() {
        return 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorldBankDatabase };
}
