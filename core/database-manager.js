/**
 * Advanced Database Manager for Empire Wars
 * Handles data storage, API access, permissions, and real-time sync
 *
 * All 15 domain databases use file-based persistence (saves/db/<domain>.json)
 * Every mutating operation writes to disk immediately (write-through).
 * On restart, all data is loaded from disk — nothing is lost.
 */

const path = require('path');

const { BaseDatabase } = require('./databases/base-database');
const { NationDatabase } = require('./databases/nation-database');
const { PlayerDatabase } = require('./databases/player-database');
const { AllianceDatabase } = require('./databases/alliance-database');
const { WarDatabase } = require('./databases/war-database');
const { TreatyDatabase } = require('./databases/treaty-database');
const { GlobalDatabase } = require('./databases/global-database');
const { SportsDatabase } = require('./databases/sports-database');
const { MessageDatabase } = require('./databases/message-database');
const { ForumDatabase } = require('./databases/forum-database');
const { WorldBankDatabase } = require('./databases/worldbank-database');
const { AnalyticsDatabase } = require('./databases/analytics-database');
const { AwardDatabase } = require('./databases/award-database');
const { AccountDatabase } = require('./databases/account-database');
const { SessionDatabase } = require('./databases/session-database');
const { AidDatabase } = require('./databases/aid-database');
const { CitizenDatabase } = require('./databases/citizen-database');

// Browser-safe fallback: if fs is not available, use no-op
let fs;
try {
    fs = require('node:fs');
} catch (_) {
    fs = null;
}

class DatabaseManager {
    constructor() {
        this.databases = new Map();
        this.apiKeys = new Map();
        this.permissions = new Map();
        this.backupSystem = null;
        this.queryLogger = null;
        this.syncManager = null;
        this.isInitialized = false;

        this.initializeDatabases();
    }

    /**
     * Initialize all domain databases with file-based persistence
     */
    initializeDatabases() {
        // Core game databases
        this.databases.set('players', new PlayerDatabase());
        this.databases.set('nations', new NationDatabase());
        this.databases.set('alliances', new AllianceDatabase());
        this.databases.set('wars', new WarDatabase());
        this.databases.set('treaties', new TreatyDatabase());
        this.databases.set('global', new GlobalDatabase());
        this.databases.set('sports', new SportsDatabase());
        this.databases.set('messages', new MessageDatabase());
        this.databases.set('forum', new ForumDatabase());
        this.databases.set('worldbank', new WorldBankDatabase());
        this.databases.set('analytics', new AnalyticsDatabase());
        this.databases.set('awards', new AwardDatabase());
        this.databases.set('accounts', new AccountDatabase());
        this.databases.set('sessions', new SessionDatabase());
        this.databases.set('aid', new AidDatabase());
        this.databases.set('citizens', new CitizenDatabase());

        console.log(`Database Manager: ${this.databases.size} domain databases initialized`);
    }

    /**
     * Get a database by name
     */
    get(name) {
        return this.databases.get(name) || null;
    }

    /**
     * Get all database names
     */
    getNames() {
        return Array.from(this.databases.keys());
    }

    /**
     * Get status of all databases
     */
    getDatabasesStatus() {
        const status = {};
        for (const [name, db] of this.databases) {
            status[name] = db.getStats ? db.getStats() : { recordCount: 0 };
        }
        return status;
    }

    /**
     * Save all databases to disk (force flush)
     */
    async saveAll() {
        const results = {};
        for (const [name, db] of this.databases) {
            if (db.saveData) {
                await db.saveData();
                results[name] = 'saved';
            } else if (db.flushSync) {
                db.flushSync();
                results[name] = 'flushed';
            } else {
                results[name] = 'no_save_method';
            }
        }
        return results;
    }

    /**
     * Load all databases from disk (called on startup)
     */
    async loadAll() {
        // Each database loads itself in its constructor via loadData()
        // This method ensures all are loaded and reports status
        const results = {};
        for (const [name, db] of this.databases) {
            results[name] = db.getSize ? db.getSize() : 0;
        }
        return results;
    }

    /**
     * Save a single entity's data to its domain database
     * @param {string} domain - Database name (e.g. 'nations', 'players')
     * @param {Object} entity - Entity with serialize() method or plain object
     * @param {string} idField - Field name used as the record ID (default: 'id')
     */
    async saveEntity(domain, entity, idField = 'id') {
        const db = this.get(domain);
        if (!db) {
            throw new Error(`Database '${domain}' not found`);
        }

        const serialized = entity.serialize ? entity.serialize() : entity;
        const id = serialized[idField];

        if (!id) {
            throw new Error(`Entity in '${domain}' has no ${idField}`);
        }

        // Check if record exists
        const existing = db.findById(id, ['admin']);
        if (existing) {
            return await db.update(id, serialized);
        } else {
            return await db.insert(id, serialized);
        }
    }

    /**
     * Load an entity's data from its domain database
     * @param {string} domain - Database name
     * @param {string} id - Record ID
     * @param {Array} permissions - Permission array for field filtering
     */
    async loadEntity(domain, id, permissions = ['admin']) {
        const db = this.get(domain);
        if (!db) {
            throw new Error(`Database '${domain}' not found`);
        }
        return db.findById(id, permissions);
    }

    /**
     * Delete an entity from its domain database
     * @param {string} domain - Database name
     * @param {string} id - Record ID
     */
    async deleteEntity(domain, id) {
        const db = this.get(domain);
        if (!db) {
            throw new Error(`Database '${domain}' not found`);
        }
        return await db.delete(id);
    }

    /**
     * Query a domain database
     * @param {string} domain - Database name
     * @param {Array} fields - Fields to select
     * @param {Object} filters - Filter conditions
     * @param {Array} permissions - Permission array
     */
    async query(domain, fields = [], filters = {}, permissions = ['public']) {
        const db = this.get(domain);
        if (!db) {
            throw new Error(`Database '${domain}' not found`);
        }
        if (!db.query) {
            throw new Error(`Database '${domain}' does not support queries`);
        }
        return await db.query(fields, filters, permissions);
    }

    /**
     * Subscribe to changes on a domain database
     * @param {string} domain - Database name
     * @param {Function} callback - Change listener
     */
    subscribe(domain, callback) {
        const db = this.get(domain);
        if (!db || !db.subscribe) {
            return () => {};
        }
        return db.subscribe(callback);
    }

    /**
     * Initialize backup system and sync manager (optional, called by DataIntegration)
     */
    async initializeExtensions() {
        try {
            const { BackupSystem } = require('./backup-system');
            const { SyncManager } = require('./sync-manager');

            this.backupSystem = new BackupSystem();
            this.syncManager = new SyncManager();

            // Wire database changes to sync manager
            for (const [dbName, database] of this.databases) {
                if (database.subscribe) {
                    database.subscribe((operation, data) => {
                        this.syncManager.queueSync({
                            [dbName]: data
                        }, 'database', 'normal');
                    });
                }
            }

            // Wire sync to backup
            if (this.syncManager.subscribe) {
                this.syncManager.subscribe('dataUpdated', (data) => {
                    if (this.backupSystem) {
                        this.backupSystem.createIncrementalBackup(data, 'sync');
                    }
                });
            }

            console.log('Database Manager: Extensions (backup, sync) initialized');
        } catch (error) {
            console.error('Database Manager: Failed to initialize extensions:', error);
        }
    }

    /**
     * Sync multiple entities across domains (used by DataManager enhanced save)
     * @param {Object} syncData - { domain: { id: record, ... }, ... }
     * @param {string} source - Source of the sync for logging
     */
    async syncData(syncData, source = 'sync') {
        const results = {};
        for (const [domain, records] of Object.entries(syncData)) {
            const db = this.get(domain);
            if (!db) {
                results[domain] = `Database '${domain}' not found`;
                continue;
            }
            const domainResults = {};
            if (typeof records === 'object' && !Array.isArray(records)) {
                for (const [id, record] of Object.entries(records)) {
                    try {
                        await this.saveEntity(domain, record, 'id');
                        domainResults[id] = 'saved';
                    } catch (error) {
                        domainResults[id] = `error: ${error.message}`;
                    }
                }
            }
            results[domain] = domainResults;
        }
        console.log(`Database Manager: synced data from ${source}`, results);
        return results;
    }

    /**
     * Shutdown: flush all databases to disk
     */
    async shutdown() {
        console.log('Database Manager: Flushing all databases to disk...');
        await this.saveAll();
        console.log('Database Manager: All databases flushed.');
    }
}

// Create global database manager instance
const DatabaseManager_Instance = new DatabaseManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DatabaseManager,
        DatabaseManager_Instance,
        NationDatabase,
        PlayerDatabase,
        AllianceDatabase,
        WarDatabase,
        TreatyDatabase,
        GlobalDatabase,
        SportsDatabase,
        MessageDatabase,
        ForumDatabase,
        WorldBankDatabase,
        AnalyticsDatabase,
        AwardDatabase,
        AccountDatabase,
        SessionDatabase,
        AidDatabase,
        BaseDatabase
    };
}

// Make available globally in browser context
if (typeof window !== 'undefined') {
    window.DatabaseManager = DatabaseManager_Instance;
    window.DatabaseManagerClass = DatabaseManager;
}
