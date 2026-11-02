/**
 * War Database - Handles all war records
 * Source of truth: server/world.js (war state) + entities/Nation.js (wars array)
 * Persisted to: saves/db/wars.json
 *
 * NOTE: server/world.js war records use these field names:
 *   id, attacker, defender, participants, reason, status, round, wins, damage,
 *   endsAt, peace (array), result
 * This database normalizes them to attackerId/defenderId for consistency.
 */

const BaseDatabase = require('./base-database');

class WarDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            attackerId: { type: 'string', required: true, indexed: true },
            defenderId: { type: 'string', required: true, indexed: true },
            participants: { type: 'array', default: [], indexed: true },
            type: { type: 'string', required: true, indexed: true },
            reason: { type: 'string' },
            status: { type: 'string', required: true, indexed: true },
            declared: { type: 'number', indexed: true },
            round: { type: 'number', default: 0 },
            wins: { type: 'object', default: {} },
            damage: { type: 'object', default: {} },
            casualties: { type: 'object', default: {} },
            damageDealt: { type: 'object', default: {} },
            peace: { type: 'array', default: [] },
            peaceTerms: { type: 'object' },
            result: { type: 'string' },
            endedAt: { type: 'number' },
            version: { type: 'number', default: 1 }
        };

        super('wars', schema);
    }

    // ─── Insert/Update overrides (normalize attacker/defender → attackerId/defenderId) ─

    async insert(id, record) {
        const normalized = this._normalizeRecord({ ...record });
        return super.insert(id, normalized);
    }

    async update(id, updates) {
        const normalized = this._normalizeRecord({ ...updates });
        return super.update(id, normalized);
    }

    _normalizeRecord(record) {
        // Normalize 'attacker' (server format) → 'attackerId'
        if (record.attacker !== undefined && record.attackerId === undefined) {
            record.attackerId = record.attacker;
            delete record.attacker;
        }
        // Normalize 'defender' (server format) → 'defenderId'
        if (record.defender !== undefined && record.defenderId === undefined) {
            record.defenderId = record.defender;
            delete record.defender;
        }
        return record;
    }

    // ─── Create War (matches server/world.js format) ──────────────────

    async createWar(warData) {
        const id = warData.id || this.generateWarId();
        const now = Date.now();

        const war = {
            id,
            attackerId: warData.attackerId || warData.attacker || null,
            defenderId: warData.defenderId || warData.defender || null,
            participants: warData.participants || [warData.attackerId, warData.defenderId].filter(Boolean),
            type: warData.type || 'conventional',
            reason: warData.reason || '',
            status: warData.status || 'preparing',
            declared: warData.declared || now,
            round: warData.round !== undefined ? warData.round : 0,
            wins: warData.wins || {},
            damage: warData.damage || {},
            casualties: warData.casualties || {},
            damageDealt: warData.damageDealt || {},
            peace: warData.peace || [],
            peaceTerms: warData.peaceTerms || null,
            result: warData.result || null,
            endedAt: warData.endedAt || null,
            version: 1
        };

        return await this.insert(id, war);
    }

    // ─── War state mutations ──────────────────────────────────────────

    async updateWarStatus(warId, status, peaceTerms = null, result = null) {
        const updates = { status };
        if (status === 'ended' || status === 'peace') {
            updates.endedAt = Date.now();
        }
        if (peaceTerms) updates.peaceTerms = peaceTerms;
        if (result) updates.result = result;
        return await this.update(warId, updates);
    }

    async recordRound(warId, roundNum) {
        const war = this.findById(warId, ['admin']);
        if (!war) throw new Error('War not found');

        return await this.update(warId, { round: roundNum });
    }

    async recordRoundResult(warId, side, damageAmount) {
        const war = this.findById(warId, ['admin']);
        if (!war) throw new Error('War not found');

        const wins = { ...war.wins };
        wins[side] = (wins[side] || 0) + 1;

        const damage = { ...war.damage };
        damage[side] = (damage[side] || 0) + damageAmount;

        return await this.update(warId, { wins, damage, round: (war.round || 0) + 1 });
    }

    async recordCasualties(warId, side, amount) {
        const war = this.findById(warId, ['admin']);
        if (!war) throw new Error('War not found');

        const casualties = { ...war.casualties };
        casualties[side] = (casualties[side] || 0) + amount;

        return await this.update(warId, { casualties });
    }

    async recordDamage(warId, side, amount) {
        const war = this.findById(warId, ['admin']);
        if (!war) throw new Error('War not found');

        const damageDealt = { ...war.damageDealt };
        damageDealt[side] = (damageDealt[side] || 0) + amount;

        return await this.update(warId, { damageDealt, round: (war.round || 0) + 1 });
    }

    async addPeaceVote(warId, nationId) {
        const war = this.findById(warId, ['admin']);
        if (!war) throw new Error('War not found');

        const peace = [...(war.peace || [])];
        if (!peace.includes(nationId)) peace.push(nationId);

        const updates = { peace };
        if (peace.length >= 2) {
            updates.status = 'ended';
            updates.endedAt = Date.now();
            updates.result = 'White peace';
        }

        return await this.update(warId, updates);
    }

    // ─── Query helpers ──────────────────────────────────────────────────

    async findByStatus(status, permissions = ['public']) {
        return this.findByIndex('status', status, permissions);
    }

    async findActiveWars(permissions = ['public']) {
        return this.findByIndex('status', 'active', permissions);
    }

    async findPreparingWars(permissions = ['public']) {
        return this.findByIndex('status', 'preparing', permissions);
    }

    async findEndedWars(permissions = ['public']) {
        return this.findByIndex('status', 'ended', permissions);
    }

    async findByParticipant(nationId, permissions = ['public']) {
        const wars = await this.query([], {}, permissions);
        return wars.filter(w => (w.participants || []).includes(nationId));
    }

    async findByAttacker(attackerId, permissions = ['public']) {
        return this.findByIndex('attackerId', attackerId, permissions);
    }

    async findByDefender(defenderId, permissions = ['public']) {
        return this.findByIndex('defenderId', defenderId, permissions);
    }

    async findWarsByType(type, permissions = ['public']) {
        return this.findByIndex('type', type, permissions);
    }

    async findWarsByNation(nationId, permissions = ['public']) {
        // No isActive field on wars; filter by participant instead
        const wars = await this.query([], {}, permissions);
        return wars.filter(w => w.attackerId === nationId || w.defenderId === nationId);
    }

    // ─── Sync from entity / server state ──────────────────────────────

    /**
     * Accept server/world.js war record format and sync to DB
     */
    async syncFromWorld(warRecord) {
        const id = warRecord.id;
        if (!id) throw new Error('War has no id');

        const normalized = this._normalizeRecord({ ...warRecord });

        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, normalized);
        } else {
            return await this.insert(id, normalized);
        }
    }

    // ─── Permissions ────────────────────────────────────────────────────

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }

    // ─── ID Generation ──────────────────────────────────────────────────

    generateWarId() {
        return 'war_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WarDatabase };
}
