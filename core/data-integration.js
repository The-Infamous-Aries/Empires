/**
 * Data Integration System for Empire Wars
 * Connects all data management components together
 */

class DataIntegration {
    constructor() {
        this.databaseManager = null;
        this.apiSystem = null;
        this.backupSystem = null;
        this.syncManager = null;
        this.isInitialized = false;
        
        this.initialize();
    }

    /**
     * Initialize all data management systems
     */
    async initialize() {
        try {
            console.log('Initializing Data Integration System...');
            
            // Initialize core systems
            this.databaseManager = new DatabaseManager();
            this.apiSystem = new ApiSystem(this.databaseManager);
            this.backupSystem = new BackupSystem();
            this.syncManager = new SyncManager();
            
            // Connect systems together
            this.setupIntegrations();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Perform initial backup
            await this.performInitialBackup();
            
            this.isInitialized = true;
            console.log('Data Integration System initialized successfully');
            
            // Emit initialization event
            if (window.EventBus) {
                EventBus.emit('dataSystemInitialized', {
                    timestamp: Date.now(),
                    systems: ['database', 'api', 'backup', 'sync']
                });
            }
            
        } catch (error) {
            console.error('Failed to initialize Data Integration System:', error);
            throw error;
        }
    }

    /**
     * Setup integrations between systems
     */
    setupIntegrations() {
        // Connect database changes to sync manager
        for (const [dbName, database] of this.databaseManager.databases) {
            database.subscribe((operation, data) => {
                this.syncManager.queueSync({
                    [dbName]: data.record
                }, 'database', 'normal');
            });
        }
        
        // Connect sync manager to backup system
        this.syncManager.subscribe('dataUpdated', (data) => {
            this.backupSystem.createIncrementalBackup(data, 'sync');
        });
        
        // Connect API system to database manager
        this.apiSystem.dbManager = this.databaseManager;
    }

    /**
     * Setup event handlers for game events
     */
    setupEventHandlers() {
        if (window.EventBus) {
            // Handle game data changes
            EventBus.on(GameEvents.NATION_CREATED, this.handleNationCreated.bind(this));
            EventBus.on(GameEvents.RESOURCES_CHANGED, this.handleResourcesChanged.bind(this));
            EventBus.on(GameEvents.POPULATION_CHANGED, this.handlePopulationChanged.bind(this));
            EventBus.on(GameEvents.PLAYER_LEVEL_UP, this.handlePlayerLevelUp.bind(this));
            EventBus.on(GameEvents.ALLIANCE_FORMED, this.handleAllianceFormed.bind(this));
            EventBus.on(GameEvents.WAR_DECLARED, this.handleWarDeclared.bind(this));
            
            // Handle system events
            EventBus.on(GameEvents.GAME_SAVED, this.handleGameSaved.bind(this));
            EventBus.on(GameEvents.GAME_LOADED, this.handleGameLoaded.bind(this));
        }
    }

    /**
     * Handle nation creation
     */
    async handleNationCreated(eventData) {
        try {
            const nation = eventData.nation;
            await this.databaseManager.databases.get('nations').insert(nation.id, {
                name: nation.name,
                playerId: nation.playerId,
                leaderName: nation.leaderName,
                government: nation.government,
                religion: nation.religion,
                population: nation.population,
                gdp: nation.gdp,
                land: nation.land,
                infrastructure: nation.infrastructure,
                technology: nation.technology,
                money: nation.money,
                materials: nation.materials,
                food: nation.food,
                energy: nation.energy,
                founded: Date.now(),
                lastActive: Date.now(),
                isActive: true
            });
            
            console.log('Nation data synchronized:', nation.name);
        } catch (error) {
            console.error('Failed to handle nation creation:', error);
        }
    }

    /**
     * Handle resource changes
     */
    async handleResourcesChanged(eventData) {
        try {
            const { nationId, resources, previousResources } = eventData;
            
            // Update nation record
            await this.databaseManager.databases.get('nations').update(nationId, {
                money: resources.money,
                materials: resources.materials,
                food: resources.food,
                energy: resources.energy,
                lastActive: Date.now()
            });
            
            // Log resource change for analytics
            await this.logResourceChange(nationId, resources, previousResources);
            
        } catch (error) {
            console.error('Failed to handle resource changes:', error);
        }
    }

    /**
     * Handle population changes
     */
    async handlePopulationChanged(eventData) {
        try {
            const { nationId, population, previousPopulation } = eventData;
            
            await this.databaseManager.databases.get('nations').update(nationId, {
                population: population,
                lastActive: Date.now()
            });
            
            // Log population change for analytics
            await this.logPopulationChange(nationId, population, previousPopulation);
            
        } catch (error) {
            console.error('Failed to handle population changes:', error);
        }
    }

    /**
     * Handle player level up
     */
    async handlePlayerLevelUp(eventData) {
        try {
            const { playerId, newLevel, oldLevel, experience } = eventData;
            
            await this.databaseManager.databases.get('players').update(playerId, {
                level: newLevel,
                experience: experience,
                lastActive: Date.now()
            });
            
            // Log level up for analytics
            await this.logLevelUp(playerId, newLevel, oldLevel);
            
        } catch (error) {
            console.error('Failed to handle player level up:', error);
        }
    }

    /**
     * Handle alliance formation
     */
    async handleAllianceFormed(eventData) {
        try {
            const alliance = eventData.alliance;
            
            await this.databaseManager.databases.get('alliances').insert(alliance.id, {
                name: alliance.name,
                founderId: alliance.founderId,
                description: alliance.description,
                memberCount: 1,
                founded: Date.now(),
                isActive: true,
                isOpen: alliance.isOpen || false
            });
            
            // Update founder's nation record
            if (alliance.founderId) {
                await this.databaseManager.databases.get('nations').update(alliance.founderId, {
                    allianceId: alliance.id,
                    lastActive: Date.now()
                });
            }
            
            console.log('Alliance data synchronized:', alliance.name);
        } catch (error) {
            console.error('Failed to handle alliance formation:', error);
        }
    }

    /**
     * Handle war declaration
     */
    async handleWarDeclared(eventData) {
        try {
            const war = eventData.war;
            
            await this.databaseManager.databases.get('wars').insert(war.id, {
                attackerId: war.attackerId,
                defenderId: war.defenderId,
                type: war.type,
                reason: war.reason,
                status: 'active',
                declared: Date.now(),
                turns: 0
            });
            
            console.log('War data synchronized:', war.id);
        } catch (error) {
            console.error('Failed to handle war declaration:', error);
        }
    }

    /**
     * Handle game save event
     */
    async handleGameSaved(eventData) {
        try {
            // Create backup when game is manually saved
            await this.backupSystem.createFullBackup('manual_save');
            console.log('Backup created on game save');
        } catch (error) {
            console.error('Failed to create backup on save:', error);
        }
    }

    /**
     * Handle game load event
     */
    async handleGameLoaded(eventData) {
        try {
            // Synchronize loaded data to databases
            await this.synchronizeLoadedData(eventData);
            console.log('Loaded data synchronized to databases');
        } catch (error) {
            console.error('Failed to synchronize loaded data:', error);
        }
    }

    /**
     * Perform initial backup
     */
    async performInitialBackup() {
        try {
            await this.backupSystem.createFullBackup('initial');
            console.log('Initial backup completed');
        } catch (error) {
            console.error('Initial backup failed:', error);
        }
    }

    /**
     * Process API request
     */
    async processApiRequest(request) {
        if (!this.isInitialized) {
            return {
                success: false,
                error: 'Data system not initialized'
            };
        }
        
        return await this.apiSystem.processRequest(request);
    }

    /**
     * Create API key for external access
     */
    createApiKey(playerName, permissions = [], description = '') {
        if (!this.isInitialized) {
            throw new Error('Data system not initialized');
        }
        
        return this.databaseManager.createApiKey(playerName, permissions, description);
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
            sync: this.syncManager.getSyncStatus(),
            backups: this.backupSystem.getBackupList().slice(0, 5), // Latest 5 backups
            performance: this.databaseManager.getPerformanceMetrics()
        };
    }

    /**
     * Log resource change for analytics
     */
    async logResourceChange(nationId, resources, previousResources) {
        const change = {
            type: 'resource_change',
            nationId: nationId,
            timestamp: Date.now(),
            changes: {}
        };
        
        for (const [resource, value] of Object.entries(resources)) {
            const oldValue = previousResources[resource] || 0;
            if (value !== oldValue) {
                change.changes[resource] = {
                    from: oldValue,
                    to: value,
                    delta: value - oldValue
                };
            }
        }
        
        if (Object.keys(change.changes).length > 0) {
            await this.databaseManager.databases.get('analytics').insert(
                this.generateAnalyticsId(), change
            );
        }
    }

    /**
     * Log population change for analytics
     */
    async logPopulationChange(nationId, population, previousPopulation) {
        const change = {
            type: 'population_change',
            nationId: nationId,
            timestamp: Date.now(),
            from: previousPopulation,
            to: population,
            delta: population - previousPopulation,
            growthRate: previousPopulation > 0 ? 
                ((population - previousPopulation) / previousPopulation * 100) : 0
        };
        
        await this.databaseManager.databases.get('analytics').insert(
            this.generateAnalyticsId(), change
        );
    }

    /**
     * Log level up for analytics
     */
    async logLevelUp(playerId, newLevel, oldLevel) {
        const change = {
            type: 'level_up',
            playerId: playerId,
            timestamp: Date.now(),
            from: oldLevel,
            to: newLevel,
            levelsGained: newLevel - oldLevel
        };
        
        await this.databaseManager.databases.get('analytics').insert(
            this.generateAnalyticsId(), change
        );
    }

    /**
     * Synchronize loaded data to databases
     */
    async synchronizeLoadedData(eventData) {
        const { gameState } = eventData;
        
        if (gameState.nation) {
            await this.databaseManager.syncData({
                nations: { [gameState.nation.id]: gameState.nation }
            }, 'load');
        }
        
        if (gameState.player) {
            await this.databaseManager.syncData({
                players: { [gameState.player.id]: gameState.player }
            }, 'load');
        }
        
        if (gameState.alliance) {
            await this.databaseManager.syncData({
                alliances: { [gameState.alliance.id]: gameState.alliance }
            }, 'load');
        }
    }

    /**
     * Generate unique analytics ID
     */
    generateAnalyticsId() {
        return 'analytics_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    /**
     * Export all data
     */
    async exportAllData() {
        try {
            const data = {};
            
            for (const [name, database] of this.databaseManager.databases) {
                const records = await database.query([], {}, ['admin']);
                data[name] = records;
            }
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `empire_data_export_${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            return true;
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
            
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }
            
            // Import to databases
            for (const [dbName, records] of Object.entries(data)) {
                if (this.databaseManager.databases.has(dbName) && Array.isArray(records)) {
                    const database = this.databaseManager.databases.get(dbName);
                    
                    for (const record of records) {
                        if (record.id) {
                            await database.insert(record.id, record);
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
    destroy() {
        if (this.databaseManager) {
            this.databaseManager.destroy();
        }
        
        if (this.backupSystem) {
            this.backupSystem.stop();
        }
        
        this.isInitialized = false;
        console.log('Data Integration System destroyed');
    }
}

// Create global data integration instance
const DataIntegration_Instance = new DataIntegration();

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataIntegration, DataIntegration_Instance };
}

// Make available globally
window.DataIntegration = DataIntegration_Instance;