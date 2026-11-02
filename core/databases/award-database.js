/**
 * Award Database - Handles nation and player awards/achievements
 * Source of truth: entities/AwardSystem.js (nationAwards, playerAwards)
 * Persisted to: saves/db/awards.json
 */

const BaseDatabase = require('./base-database');

class AwardDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            entityType: { type: 'string', required: true, indexed: true }, // 'nation' or 'player'
            entityId: { type: 'string', required: true, indexed: true },
            awardId: { type: 'string', required: true, indexed: true },
            category: { type: 'string', indexed: true },
            unlockedAt: { type: 'number', indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('awards', schema);
    }

    async awardNation(nationId, awardId, category, unlockedAt = null) {
        const id = `award_nation_${nationId}_${awardId}`;

        const award = {
            id,
            entityType: 'nation',
            entityId: nationId,
            awardId,
            category: category || '',
            unlockedAt: unlockedAt || Date.now(),
            version: 1
        };

        return await this.insert(id, award);
    }

    async awardPlayer(playerId, awardId, category, unlockedAt = null) {
        const id = `award_player_${playerId}_${awardId}`;

        const award = {
            id,
            entityType: 'player',
            entityId: playerId,
            awardId,
            category: category || '',
            unlockedAt: unlockedAt || Date.now(),
            version: 1
        };

        return await this.insert(id, award);
    }

    async hasAward(entityType, entityId, awardId) {
        const awards = await this.query([], { entityType, entityId, awardId }, ['admin']);
        return awards.length > 0;
    }

    async getNationAwards(nationId, permissions = ['public']) {
        return this.findByIndex('entityId', nationId, permissions);
    }

    async getPlayerAwards(playerId, permissions = ['public']) {
        return this.findByIndex('entityId', playerId, permissions);
    }

    async getAwardsByCategory(category, permissions = ['public']) {
        return this.findByIndex('category', category, permissions);
    }

    async getAwardCount(entityType, entityId, permissions = ['public']) {
        const awards = await this.query([], { entityType, entityId }, permissions);
        return awards.length;
    }

    // ─── Sync from AwardSystem.serialize() format ────────────────────────

    /**
     * Accept AwardSystem.serialize() output and create flat award records.
     * AwardSystem.serialize() returns:
     *   { nationAwards: { nationId: [awardId, ...] }, playerAwards: { playerId: [awardId, ...] } }
     */
    async syncFromSerialized(serializedData) {
        if (!serializedData) return 0;

        let count = 0;

        // Nation awards
        if (serializedData.nationAwards) {
            for (const [nationId, awardIds] of Object.entries(serializedData.nationAwards)) {
                if (!Array.isArray(awardIds)) continue;
                for (const awardId of awardIds) {
                    const id = `award_nation_${nationId}_${awardId}`;
                    const existing = this.findById(id, ['admin']);
                    if (!existing) {
                        await this.insert(id, {
                            id,
                            entityType: 'nation',
                            entityId: nationId,
                            awardId,
                            category: '',
                            unlockedAt: Date.now(),
                            version: 1
                        });
                        count++;
                    }
                }
            }
        }

        // Player awards
        if (serializedData.playerAwards) {
            for (const [playerId, awardIds] of Object.entries(serializedData.playerAwards)) {
                if (!Array.isArray(awardIds)) continue;
                for (const awardId of awardIds) {
                    const id = `award_player_${playerId}_${awardId}`;
                    const existing = this.findById(id, ['admin']);
                    if (!existing) {
                        await this.insert(id, {
                            id,
                            entityType: 'player',
                            entityId: playerId,
                            awardId,
                            category: '',
                            unlockedAt: Date.now(),
                            version: 1
                        });
                        count++;
                    }
                }
            }
        }

        return count;
    }

    /**
     * Export awards in AwardSystem.serialize() format for AwardSystem.deserialize().
     * Returns: { nationAwards: { nationId: [awardId, ...] }, playerAwards: { playerId: [awardId, ...] } }
     */
    exportToSerialized() {
        const nationAwards = {};
        const playerAwards = {};

        for (const record of this.data.values()) {
            if (record.entityType === 'nation') {
                if (!nationAwards[record.entityId]) nationAwards[record.entityId] = [];
                nationAwards[record.entityId].push(record.awardId);
            } else if (record.entityType === 'player') {
                if (!playerAwards[record.entityId]) playerAwards[record.entityId] = [];
                playerAwards[record.entityId].push(record.awardId);
            }
        }

        return { nationAwards, playerAwards };
    }

    // ─── Convenience: return award ID arrays (matching AwardSystem internal format) ─

    async getNationAwardIds(nationId, permissions = ['public']) {
        const records = await this.getNationAwards(nationId, permissions);
        return records.map(r => r.awardId);
    }

    async getPlayerAwardIds(playerId, permissions = ['public']) {
        const records = await this.getPlayerAwards(playerId, permissions);
        return records.map(r => r.awardId);
    }

    async removeLowerTiers(entityType, entityId, trackKey, awardedIndex) {
        // Remove all lower tier awards for the same trackKey
        const awards = await this.query([], { entityType, entityId }, ['admin']);
        const tiersToRemove = awards.filter((_, idx) => idx < awardedIndex);
        for (const award of tiersToRemove) {
            await this.delete(award.id);
        }
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AwardDatabase };
}
