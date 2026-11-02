/**
 * Aid Database - Handles aid transfers between nations
 * Persisted to: saves/db/aid.json
 */

const BaseDatabase = require('./base-database');

class AidDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            fromNationId: { type: 'string', required: true, indexed: true },
            toNationId: { type: 'string', required: true, indexed: true },
            amount: { type: 'number', required: true },
            type: { type: 'string', required: true },
            createdAt: { type: 'number', required: true, indexed: true },
            status: { type: 'string', default: 'completed', indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('aid', schema);
    }

    // ─── Find ──────────────────────────────────────────────────────────

    async findByFromNation(fromNationId, permissions = ['admin']) {
        return this.findByIndex('fromNationId', fromNationId, permissions);
    }

    async findByToNation(toNationId, permissions = ['admin']) {
        return this.findByIndex('toNationId', toNationId, permissions);
    }

    async findByNation(nationId, permissions = ['admin']) {
        const sent = await this.findByFromNation(nationId, permissions);
        const received = await this.findByToNation(nationId, permissions);
        return [...sent, ...received];
    }

    async findRecentAid(limit = 50, permissions = ['admin']) {
        const allAid = Array.from(this.data.values())
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
        return this.applyPermissions(allAid, permissions);
    }

    // ─── Permissions ───────────────────────────────────────────────────

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AidDatabase };
}
