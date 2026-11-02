/**
 * Session Database - Handles user sessions
 * Source of truth: server/world.js (sessions state)
 * Persisted to: saves/db/sessions.json
 */

const BaseDatabase = require('./base-database');

class SessionDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            accountId: { type: 'string', required: true, indexed: true },
            tokenHash: { type: 'string', required: true, indexed: true },
            expires: { type: 'number', required: true, indexed: true },
            createdAt: { type: 'number', indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('sessions', schema);
    }

    async createSession(sessionData) {
        const id = sessionData.id || this.generateSessionId();

        const session = {
            id,
            accountId: sessionData.accountId,
            tokenHash: sessionData.tokenHash,
            expires: sessionData.expires,
            createdAt: sessionData.createdAt || Date.now(),
            isActive: true,
            version: 1
        };

        return await this.insert(id, session);
    }

    async findByTokenHash(tokenHash, permissions = ['admin']) {
        const sessions = await this.findByIndex('tokenHash', tokenHash, permissions);
        return sessions.length > 0 ? sessions[0] : null;
    }

    async findByAccountId(accountId, permissions = ['admin']) {
        return this.findByIndex('accountId', accountId, permissions);
    }

    async findValidSession(accountId, permissions = ['admin']) {
        const now = Date.now();
        const sessions = await this.findByAccountId(accountId, permissions);
        return sessions.find(s => s.isActive && s.expires > now);
    }

    async invalidateSession(id) {
        return await this.update(id, { isActive: false });
    }

    async invalidateAllForAccount(accountId) {
        const sessions = await this.findByAccountId(accountId, ['admin']);
        for (const session of sessions) {
            await this.update(session.id, { isActive: false });
        }
    }

    async pruneExpiredSessions() {
        const now = Date.now();
        const allSessions = Array.from(this.data.values());
        const expired = allSessions.filter(s => !s.isActive || s.expires <= now);

        for (const session of expired) {
            await this.delete(session.id);
        }

        return expired.length;
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin')) return true;
        return false; // Sessions are never publicly viewable
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SessionDatabase };
}
