/**
 * Treaty Database - Handles all treaty records
 * Source of truth: server/world.js (treaty state)
 * Persisted to: saves/db/treaties.json
 */

const { BaseDatabase } = require('./base-database');

class TreatyDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            type: { type: 'string', required: true, indexed: true },
            partyA: { type: 'string', required: true, indexed: true },
            partyB: { type: 'string', required: true, indexed: true },
            status: { type: 'string', required: true, indexed: true },
            createdAt: { type: 'number', indexed: true },
            acceptedAt: { type: 'number' },
            endsAt: { type: 'number' },
            expiresAt: { type: 'number', indexed: true },
            terms: { type: 'object', default: {} },
            createdBy: { type: 'string', required: true },
            duration: { type: 'number' },
            compensation: { type: 'number', default: 0 },
            version: { type: 'number', default: 1 }
        };

        super('treaties', schema);
    }

    async createTreaty(treatyData) {
        const id = treatyData.id || this.generateTreatyId();

        const treaty = {
            id,
            type: treatyData.type || 'peace',
            partyA: treatyData.partyA,
            partyB: treatyData.partyB,
            status: treatyData.status || 'pending',
            createdAt: treatyData.createdAt || Date.now(),
            acceptedAt: treatyData.acceptedAt || null,
            endsAt: treatyData.endsAt || null,
            expiresAt: treatyData.expiresAt || null,
            terms: treatyData.terms || {},
            createdBy: treatyData.createdBy,
            duration: treatyData.duration || null,
            compensation: treatyData.compensation !== undefined ? treatyData.compensation : 0,
            version: 1
        };

        return await this.insert(id, treaty);
    }

    async acceptTreaty(treatyId) {
        return await this.update(treatyId, { status: 'active', acceptedAt: Date.now() });
    }

    async endTreaty(treatyId) {
        return await this.update(treatyId, { status: 'ended', endsAt: Date.now() });
    }

    async rejectTreaty(treatyId) {
        return await this.update(treatyId, { status: 'rejected', endsAt: Date.now() });
    }

    async expireTreaty(treatyId) {
        return await this.update(treatyId, { status: 'expired', endsAt: Date.now() });
    }

    async syncFromEntity(treatyEntity) {
        const serialized = treatyEntity.serialize ? treatyEntity.serialize() : treatyEntity;
        const id = serialized.id || treatyEntity.id;
        if (!id) throw new Error('Treaty has no id');
        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, serialized);
        } else {
            return await this.insert(id, serialized);
        }
    }

    async findByParty(nationId, permissions = ['public']) {
        const treaties = await this.query([], { isActive: true }, permissions);
        return treaties.filter(t => t.partyA === nationId || t.partyB === nationId);
    }

    async findActiveTreaties(permissions = ['public']) {
        return this.findByIndex('status', 'active', permissions);
    }

    async findTreatiesByType(type, permissions = ['public']) {
        return this.findByIndex('type', type, permissions);
    }

    async findPendingTreaties(permissions = ['public']) {
        return this.findByIndex('status', 'pending', permissions);
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }

    generateTreatyId() {
        return 'treaty_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TreatyDatabase };
}

