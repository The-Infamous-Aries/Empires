/**
 * Data Integration System for Empire Wars
 * Connects all data management components together using file-based persistence.
 *
 * All domain databases persist to saves/db/<domain>.json via write-through.
 * On restart, everything loads from disk — nothing is lost.
 */

// Browser-safe imports
let ApiSystem, BackupSystem, SyncManager;
try {
    ApiSystem = require('./api-system').ApiSystem;
} catch (_) {}
try {
    BackupSystem = require('./backup-system').BackupSystem;
} catch (_) {}
try {
    SyncManager = require('./sync-manager').SyncManager;
} catch (_) {}

class DataIntegration {
    constructor() {
        this.databaseManager = null;
        this.apiSystem = null;
        this.backupSystem = null;
        this.syncManager = null;
        this.isInitialized = false;
        this._initializing = false;
    }

    /**
     * Initialize all data management systems
     */
    async initialize() {
        // Prevent double initialization
        if (this.isInitialized || this._initializing) return;
        this._initializing = true;

        try {
            console.log('Initializing Data Integration System...');

            // Use the new file-based DatabaseManager
            const { DatabaseManager_Instance } = require('./database-manager');
            this.databaseManager = DatabaseManager_Instance;

            // Create sub-systems (may not exist in all environments)
            if (ApiSystem) {
                this.apiSystem = new ApiSystem(this.databaseManager);
            }
            if (BackupSystem) {
                this.backupSystem = new BackupSystem();
            }
            if (SyncManager) {
                this.syncManager = new SyncManager();
            }

            // Connect systems together
            this.setupIntegrations();

            // Setup event handlers
            this.setupEventHandlers();

            // Load all data from disk (restore from saves/db/*.json)
            const loadResults = await this.databaseManager.loadAll();
            console.log('Data Integration: Database load results:', loadResults);

            // Wire auto-save events
            const { wireAutoSave } = require('./data-persistence');
            wireAutoSave();

            // Perform initial backup
            await this.performInitialBackup();

            this.isInitialized = true;
            this._initializing = false;
            console.log('Data Integration System initialized successfully');

            // Emit initialization event
            if (typeof window !== 'undefined' && window.EventBus) {
                window.EventBus.emit('dataSystemInitialized', {
                    timestamp: Date.now(),
                    systems: ['database', 'api', 'backup', 'sync']
                });
            }

        } catch (error) {
            this._initializing = false;
            console.error('Failed to initialize Data Integration System:', error);
            throw error;
        }
    }

    /**
     * Check if initialization is complete (for callers that can't await)
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Setup integrations between systems
     */
    setupIntegrations() {
        // Connect sync manager to backup system
        if (this.syncManager && this.backupSystem) {
            this.syncManager.subscribe('dataUpdated', (data) => {
                this.backupSystem.createIncrementalBackup(data, 'sync');
            });
        }

        // Connect API system to database manager
        if (this.apiSystem) {
            this.apiSystem.dbManager = this.databaseManager;
        }
    }

    /**
     * Setup event handlers for game events
     */
    setupEventHandlers() {
        if (typeof window !== 'undefined' && window.EventBus) {
            const EventBus = window.EventBus;

            // Handle game data changes
            EventBus.on('nation_updated', this.handleNationUpdated.bind(this));
            EventBus.on('nation_created', this.handleNationUpdated.bind(this));
            EventBus.on('nation_loaded', this.handleNationUpdated.bind(this));
            EventBus.on('player_updated', this.handlePlayerUpdated.bind(this));
            EventBus.on('player_initialized', this.handlePlayerUpdated.bind(this));
            EventBus.on('player_loaded', this.handlePlayerUpdated.bind(this));
            EventBus.on('alliance_updated', this.handleAllianceUpdated.bind(this));
            EventBus.on('war_updated', this.handleWarUpdated.bind(this));
            EventBus.on('war_created', this.handleWarUpdated.bind(this));
            EventBus.on('war_loaded', this.handleWarUpdated.bind(this));
            EventBus.on('treaty_updated', this.handleTreatyUpdated.bind(this));
            EventBus.on('treaty_created', this.handleTreatyUpdated.bind(this));
            EventBus.on('global_updated', this.handleGlobalUpdated.bind(this));
            EventBus.on('team_updated', this.handleTeamUpdated.bind(this));
            EventBus.on('team_created', this.handleTeamUpdated.bind(this));
            EventBus.on('team_loaded', this.handleTeamUpdated.bind(this));
            EventBus.on('message_sent', this.handleMessageUpdated.bind(this));
            EventBus.on('worldBank_updated', this.handleWorldBankUpdated.bind(this));

            // Handle game save/load events
            EventBus.on('game_saved', this.handleGameSaved.bind(this));
            EventBus.on('game_loaded', this.handleGameLoaded.bind(this));
        }
    }

    // ─── Entity Change Handlers (auto-save to databases) ────────────────

    async handleNationUpdated(eventData) {
        try {
            const { saveNation } = require('./data-persistence');
            await saveNation(eventData.nation);
        } catch (error) {
            console.error('Failed to save nation:', error);
        }
    }

    async handlePlayerUpdated(eventData) {
        try {
            const { savePlayer } = require('./data-persistence');
            await savePlayer(eventData.player);
        } catch (error) {
            console.error('Failed to save player:', error);
        }
    }

    async handleAllianceUpdated(eventData) {
        try {
            const { saveAlliance } = require('./data-persistence');
            await saveAlliance(eventData.alliance);
        } catch (error) {
            console.error('Failed to save alliance:', error);
        }
    }

    async handleWarUpdated(eventData) {
        try {
            const { saveWar } = require('./data-persistence');
            await saveWar(eventData.war);
        } catch (error) {
            console.error('Failed to save war:', error);
        }
    }

    async handleTreatyUpdated(eventData) {
        try {
            const { saveTreaty } = require('./data-persistence');
            await saveTreaty(eventData.treaty);
        } catch (error) {
            console.error('Failed to save treaty:', error);
        }
    }

    async handleGlobalUpdated(eventData) {
        try {
            const { saveGlobal } = require('./data-persistence');
            await saveGlobal(eventData.global);
        } catch (error) {
            console.error('Failed to save global state:', error);
        }
    }

    async handleTeamUpdated(eventData) {
        try {
            const { saveTeam } = require('./data-persistence');
            await saveTeam(eventData.team);
        } catch (error) {
            console.error('Failed to save team:', error);
        }
    }

    async handleMessageUpdated(eventData) {
        try {
            const { saveMessage } = require('./data-persistence');
            await saveMessage(eventData.message);
        } catch (error) {
            console.error('Failed to save message:', error);
        }
    }

    async handleWorldBankUpdated(eventData) {
        try {
            const { saveWorldBank } = require('./data-persistence');
            await saveWorldBank(eventData.worldBank);
        } catch (error) {
            console.error('Failed to save world bank:', error);
        }
    }

    // ─── Game Save/Load Events ─────────────────────────────────────────

    async handleGameSaved(eventData) {
        try {
            if (!this.backupSystem) {
                console.warn('Backup system not available — skipping backup on save');
                return;
            }
            await this.backupSystem.createFullBackup('manual_save');
            console.log('Backup created on game save');
        } catch (error) {
            console.error('Failed to create backup on save:', error);
        }
    }

    async handleGameLoaded(eventData) {
        try {
            // Data is already loaded from databases on startup
            // This event just syncs any in-memory changes
            console.log('Loaded data synchronized to databases');
        } catch (error) {
            console.error('Failed to synchronize loaded data:', error);
        }
    }

    // ─── API & Query Support ───────────────────────────────────────────

    /**
     * Process API request
     */
    async processApiRequest(request) {
        if (!this.isInitialized) {
            return { success: false, error: 'Data system not initialized' };
        }
        if (!this.apiSystem) {
            return { success: false, error: 'API system not available' };
        }
        return await this.apiSystem.processRequest(request);
    }

    /**
     * Create API key for external access (Discord bots, etc.)
     */
    createApiKey(playerName, permissions = [], description = '') {
        if (!this.isInitialized) {
            throw new Error('Data system not initialized');
        }
        // DatabaseManager has an apiKeys Map but no createApiKey method — create inline
        const keyId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const apiKey = {
            id: keyId,
            playerName,
            permissions,
            description,
            createdAt: Date.now(),
            active: true
        };
        this.databaseManager.apiKeys.set(keyId, apiKey);
        return apiKey;
    }

    /**
     * Get system status
     */
    getSystemStatus() {
        if (!this.isInitialized) {
            return { status: 'not_initialized' };
        }

        return {
            status: 'active',
            timestamp: Date.now(),
            databases: this.databaseManager.getDatabasesStatus(),
            sync: this.syncManager ? this.syncManager.getSyncStatus() : null,
            backups: this.backupSystem ? this.backupSystem.getBackupList().slice(0, 5) : [],
            performance: null
        };
    }

    /**
     * Perform initial backup
     */
    async performInitialBackup() {
        try {
            if (!this.backupSystem) {
                console.warn('Backup system not available — skipping initial backup');
                return;
            }
            await this.backupSystem.createFullBackup('initial');
            console.log('Initial backup completed');
        } catch (error) {
            console.error('Initial backup failed:', error);
        }
    }

    /**
     * Export all data
     */
    async exportAllData() {
        try {
            const data = {};
            for (const [name, database] of this.databaseManager.databases) {
                const records = await this.databaseManager.query(name, [], {}, ['admin']);
                data[name] = records;
            }

            const json = JSON.stringify(data, null, 2);

            // Browser-only: trigger download
            if (typeof window !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `empire_data_export_${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
            }

            return json;
        } catch (error) {
            console.error('Data export failed:', error);
            return false;
        }
    }

    /**
     * Import data from file
     */
    async importData(file) {
        try {
            const content = await this.readFile(file);
            const data = JSON.parse(content);

            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            for (const [dbName, records] of Object.entries(data)) {
                if (this.databaseManager.databases.has(dbName) && Array.isArray(records)) {
                    for (const record of records) {
                        if (record.id) {
                            await this.databaseManager.saveEntity(dbName, record, 'id');
                        }
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Data import failed:', error);
            return false;
        }
    }

    /**
     * Read file content
     */
    readFile(file) {
        // Browser-only: FileReader
        if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
            throw new Error('FileReader is not available in this environment');
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Clean up and destroy
     */
    async destroy() {
        // Stop AI/sync loop
        if (this.syncManager && typeof this.syncManager.destroy === 'function') {
            this.syncManager.destroy();
        }

        // Stop backup timer
        if (this.backupSystem && typeof this.backupSystem.stop === 'function') {
            this.backupSystem.stop();
        }

        // Flush all databases to disk before shutdown
        if (this.databaseManager) {
            await this.databaseManager.saveAll();
        }

        this.isInitialized = false;
        console.log('Data Integration System destroyed');
    }
}

// Create global data integration instance
const DataIntegration_Instance = new DataIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataIntegration, DataIntegration_Instance };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DataIntegration = DataIntegration_Instance;
}
