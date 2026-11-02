/**
 * Account Database - Handles user accounts (registration, login)
 * Source of truth: server/world.js (accounts state)
 * Persisted to: saves/db/accounts.json
 *
 * ALL fields from every account source are covered:
 *   server/world.js:      id, username, passwordHash
 *   passport-config.js:   email, googleId, authProvider, profilePicture,
 *                         emailVerified, joinDate, lastLogin
 *   auth-routes.js:       email, passwordHash, authProvider, emailVerified,
 *                         joinDate, lastLogin
 *   auth-middleware.js:   isAdmin
 */

const BaseDatabase = require('./base-database');

class AccountDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            username: { type: 'string', required: true, indexed: true },
            passwordHash: { type: 'string', required: true },
            email: { type: 'string', indexed: true },
            authProvider: { type: 'string', default: 'local', indexed: true },
            googleId: { type: 'string', indexed: true },
            discordId: { type: 'string', indexed: true },
            profilePicture: { type: 'string' },
            emailVerified: { type: 'boolean', default: false },
            joinDate: { type: 'number', indexed: true },
            lastLogin: { type: 'number' },
            isActive: { type: 'boolean', default: true, indexed: true },
            isAdmin: { type: 'boolean', default: false, indexed: true },
            nationId: { type: 'string', indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('accounts', schema);
    }

    // ─── Create ──────────────────────────────────────────────────────────

    async createAccount(accountData) {
        const id = accountData.id || this.generateAccountId();

        const account = {
            id,
            username: accountData.username,
            passwordHash: accountData.passwordHash,
            email: accountData.email || '',
            authProvider: accountData.authProvider || 'local',
            googleId: accountData.googleId || null,
            discordId: accountData.discordId || null,
            profilePicture: accountData.profilePicture || null,
            emailVerified: accountData.emailVerified !== undefined ? accountData.emailVerified : false,
            joinDate: accountData.joinDate || Date.now(),
            lastLogin: accountData.lastLogin || null,
            isActive: true,
            isAdmin: accountData.isAdmin || false,
            nationId: accountData.nationId || null,
            version: 1
        };

        return await this.insert(id, account);
    }

    /**
     * Alias expected by passport-config.js and auth-routes.js.
     * Creates an account and returns just the ID (for auth-routes compatibility).
     */
    async createUser(accountData) {
        const record = await this.createAccount(accountData);
        return record.id;
    }

    // ─── Read / Find ─────────────────────────────────────────────────────

    /**
     * Find account by username.
     * Alias expected by passport-config.js and auth-routes.js.
     */
    async findUserByUsername(username, permissions = ['admin']) {
        return await this.findByUsername(username, permissions);
    }

    /**
     * Find account by email.
     * Alias expected by passport-config.js and auth-routes.js.
     */
    async findUserByEmail(email, permissions = ['admin']) {
        return await this.findByEmail(email, permissions);
    }

    /**
     * Find account by Google ID.
     * Alias expected by passport-config.js.
     */
    async findUserByGoogleId(googleId, permissions = ['admin']) {
        return await this.findByGoogleId(googleId, permissions);
    }

    /**
     * Find account by Discord ID.
     * Alias expected by passport-config.js.
     */
    async findUserByDiscordId(discordId, permissions = ['admin']) {
        return await this.findByDiscordId(discordId, permissions);
    }

    /**
     * Find account by ID.
     * Alias expected by passport-config.js and auth-middleware.js.
     */
    async findUserById(id, permissions = ['admin']) {
        return this.findById(id, permissions);
    }

    /**
     * Find account by nation ID.
     */
    async findByNationId(nationId, permissions = ['admin']) {
        const accounts = await this.findByIndex('nationId', nationId, permissions);
        return accounts.length > 0 ? accounts[0] : null;
    }

    // ─── Update ──────────────────────────────────────────────────────────

    /**
     * Update account fields.
     * Alias expected by passport-config.js.
     */
    async updateUser(id, updates) {
        return await this.update(id, updates);
    }

    async updateLastLogin(id) {
        return await this.update(id, { lastLogin: Date.now() });
    }

    async linkNation(accountId, nationId) {
        return await this.update(accountId, { nationId });
    }

    async deactivate(id) {
        return await this.update(id, { isActive: false });
    }

    async grantAdmin(accountId) {
        return await this.update(accountId, { isAdmin: true });
    }

    async revokeAdmin(accountId) {
        return await this.update(accountId, { isAdmin: false });
    }

    // ─── Permissions ─────────────────────────────────────────────────────

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin')) return true;
        // Account data is never publicly queryable — not even for the owner
        return false;
    }

    // ─── ID Generation ───────────────────────────────────────────────────

    generateAccountId() {
        return 'account_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccountDatabase };
}
