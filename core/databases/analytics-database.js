/**
 * Analytics Database - Handles analytics events and logging
 * Source of truth: core/data-integration.js (analytics logging)
 * Persisted to: saves/db/analytics.json
 */

const { BaseDatabase } = require('./base-database');

class AnalyticsDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            type: { type: 'string', required: true, indexed: true },
            timestamp: { type: 'number', indexed: true },
            nationId: { type: 'string', indexed: true },
            playerId: { type: 'string', indexed: true },
            data: { type: 'object', default: {} },
            version: { type: 'number', default: 1 }
        };

        super('analytics', schema);
    }

    async logEvent(eventData) {
        const id = eventData.id || this.generateAnalyticsId();

        const event = {
            id,
            type: eventData.type,
            timestamp: eventData.timestamp || Date.now(),
            nationId: eventData.nationId || null,
            playerId: eventData.playerId || null,
            data: eventData.data || {},
            version: 1
        };

        return await this.insert(id, event);
    }

    async logPopulationChange(nationId, population, previousPopulation) {
        return await this.logEvent({
            type: 'population_change',
            nationId,
            timestamp: Date.now(),
            data: {
                from: previousPopulation,
                to: population,
                delta: population - previousPopulation,
                growthRate: previousPopulation > 0
                    ? ((population - previousPopulation) / previousPopulation * 100)
                    : 0
            }
        });
    }

    async logLevelUp(playerId, newLevel, oldLevel) {
        return await this.logEvent({
            type: 'level_up',
            playerId,
            timestamp: Date.now(),
            data: {
                from: oldLevel,
                to: newLevel,
                levelsGained: newLevel - oldLevel
            }
        });
    }

    async findByType(type, permissions = ['public'], limit = 100) {
        const events = await this.findByIndex('type', type, permissions);
        return events
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limit);
    }

    async findByNation(nationId, permissions = ['public'], limit = 100) {
        const events = await this.findByIndex('nationId', nationId, permissions);
        return events
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limit);
    }

    async findByPlayer(playerId, permissions = ['public'], limit = 100) {
        const events = await this.findByIndex('playerId', playerId, permissions);
        return events
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limit);
    }

    async getRecentEvents(limit = 100, permissions = ['public']) {
        const events = await this.query([], {}, permissions);
        return events
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limit);
    }

    async pruneOldEvents(keepCount = 10000) {
        const allEvents = Array.from(this.data.values())
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const toDelete = allEvents.slice(keepCount);
        for (const event of toDelete) {
            await this.delete(event.id);
        }
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('analytics')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }

    generateAnalyticsId() {
        return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsDatabase };
}

