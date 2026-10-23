/**
 * Advanced Database Manager for Empire Wars
 * Handles data storage, API access, permissions, and real-time sync
 */

class DatabaseManager {
    constructor() {
        this.databases = new Map();
        this.apiKeys = new Map();
        this.permissions = new Map();
        this.backupSystem = new BackupSystem();
        this.queryLogger = new QueryLogger();
        this.syncManager = new SyncManager();
        
        this.initializeDatabases();
        this.setupPerformanceMonitoring();
        this.startAutoBackup();
    }

    /**
     * Initialize separate databases for different data types
     */
    initializeDatabases() {
        // Core game databases
        this.databases.set('players', new PlayerDatabase());
        this.databases.set('nations', new NationDatabase());
        this.databases.set('alliances', new AllianceDatabase());
        this.databases.set('wars', new WarDatabase());
        this.databases.set('trade', new TradeDatabase());
        this.databases.set('diplomacy', new DiplomacyDatabase());
        this.databases.set('forum', new ForumDatabase());
        this.databases.set('messaging', new MessageDatabase());
        this.databases.set('world', new WorldDatabase());
        this.databases.set('economy', new EconomyDatabase());
        this.databases.set('military', new MilitaryDatabase());
        this.databases.set('research', new ResearchDatabase());
        this.databases.set('analytics', new AnalyticsDatabase());
        
        console.log('Database Manager: All databases initialized');
    }

    /**
     * Create API key for external access
     */
    createApiKey(playerName, permissions = [], description = '') {
        const apiKey = this.generateSecureKey();
        const keyData = {
            key: apiKey,
            playerName: playerName,
            permissions: permissions,
            description: description,
            created: Date.now(),
            lastUsed: null,
            usageCount: 0,
            isActive: true
        };
        
        this.apiKeys.set(apiKey, keyData);
        this.saveApiKeys();
        
        return apiKey;
    }

    /**
     * Process GraphQL-like query with permission checks
     */
    async processQuery(query, apiKey = null) {
        try {
            // Validate API key if provided
            const permissions = this.validateApiKey(apiKey);
            
            // Parse and validate query
            const parsedQuery = this.parseQuery(query);
            
            // Check permissions for requested data
            this.checkQueryPermissions(parsedQuery, permissions);
            
            // Log query for monitoring
            this.queryLogger.log(query, apiKey, parsedQuery);
            
            // Execute query across databases
            const result = await this.executeQuery(parsedQuery, permissions);
            
            // Update API key usage
            if (apiKey) {
                this.updateApiKeyUsage(apiKey);
            }
            
            return {
                success: true,
                data: result,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Query processing error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * Validate API key and return permissions
     */
    validateApiKey(apiKey) {
        if (!apiKey) {
            return ['public']; // Public access permissions
        }
        
        const keyData = this.apiKeys.get(apiKey);
        if (!keyData || !keyData.isActive) {
            throw new Error('Invalid or inactive API key');
        }
        
        return keyData.permissions;
    }

    /**
     * Parse GraphQL-like query syntax
     */
    parseQuery(queryString) {
        // Simple query parser - can be enhanced with proper GraphQL parser
        const query = {
            operation: 'query',
            selections: [],
            filters: {},
            pagination: { limit: 100, offset: 0 }
        };
        
        // Extract database and fields from query
        // Format: { nations { name, population, gdp } where: { active: true } }
        const matches = queryString.match(/\{([^}]+)\}/g);
        if (matches) {
            matches.forEach(match => {
                const content = match.slice(1, -1).trim();
                if (content.includes('where:')) {
                    const [selection, filter] = content.split('where:');
                    query.selections.push(selection.trim());
                    query.filters = this.parseFilter(filter.trim());
                } else {
                    query.selections.push(content);
                }
            });
        }
        
        return query;
    }

    /**
     * Check if query is allowed with given permissions
     */
    checkQueryPermissions(query, permissions) {
        const requiredPermissions = this.getRequiredPermissions(query);
        
        for (const required of requiredPermissions) {
            if (!permissions.includes(required) && !permissions.includes('admin')) {
                throw new Error(`Insufficient permissions: ${required} required`);
            }
        }
    }

    /**
     * Execute parsed query across relevant databases
     */
    async executeQuery(query, permissions) {
        const results = {};
        
        for (const selection of query.selections) {
            const parts = selection.split(' ');
            const dbName = parts[0];
            const fields = parts.slice(1);
            
            if (this.databases.has(dbName)) {
                const database = this.databases.get(dbName);
                results[dbName] = await database.query(fields, query.filters, permissions);
            }
        }
        
        return results;
    }

    /**
     * Real-time data synchronization
     */
    async syncData(data, source = 'game') {
        try {
            // Validate incoming data
            const validationResult = this.validateData(data);
            if (!validationResult.isValid) {
                throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);
            }
            
            // Apply data to appropriate databases
            for (const [dbName, dbData] of Object.entries(data)) {
                if (this.databases.has(dbName)) {
                    await this.databases.get(dbName).update(dbData);
                }
            }
            
            // Create backup point
            await this.backupSystem.createBackup(data, source);
            
            // Notify sync manager
            this.syncManager.notifyUpdate(data, source);
            
            return { success: true, timestamp: Date.now() };
        } catch (error) {
            console.error('Data sync error:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Generate secure API key
     */
    generateSecureKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'ew_'; // Empire Wars prefix
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Get required permissions for query
     */
    getRequiredPermissions(query) {
        const permissions = new Set(['public']);
        
        for (const selection of query.selections) {
            const dbName = selection.split(' ')[0];
            
            // Map database access to required permissions
            switch (dbName) {
                case 'nations':
                case 'alliances':
                case 'wars':
                    permissions.add('game_data');
                    break;
                case 'players':
                    permissions.add('player_data');
                    break;
                case 'messaging':
                    permissions.add('private_messages');
                    break;
                case 'military':
                    permissions.add('military_data');
                    break;
                case 'analytics':
                    permissions.add('analytics');
                    break;
            }
        }
        
        return Array.from(permissions);
    }

    /**
     * Validate data structure and content
     */
    validateData(data) {
        const errors = [];
        const validators = new Map([
            ['players', this.validatePlayerData],
            ['nations', this.validateNationData],
            ['alliances', this.validateAllianceData],
            ['wars', this.validateWarData],
            ['trade', this.validateTradeData]
        ]);
        
        for (const [dbName, dbData] of Object.entries(data)) {
            if (validators.has(dbName)) {
                const validator = validators.get(dbName);
                const result = validator.call(this, dbData);
                if (!result.isValid) {
                    errors.push(...result.errors);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        this.metrics = {
            queries: { count: 0, totalTime: 0, errors: 0 },
            syncs: { count: 0, totalTime: 0, errors: 0 },
            backups: { count: 0, totalTime: 0, errors: 0 }
        };
        
        // Monitor every 5 minutes
        setInterval(() => {
            this.logPerformanceMetrics();
        }, 300000);
    }

    /**
     * Start automatic backup system
     */
    startAutoBackup() {
        // Backup every 10 minutes
        setInterval(async () => {
            await this.performFullBackup();
        }, 600000);
        
        // Quick save every minute
        setInterval(async () => {
            await this.performQuickSave();
        }, 60000);
    }
    /**
     * Parse filter conditions
     */
    parseFilter(filterString) {
        try {
            return JSON.parse(filterString);
        } catch (error) {
            // Simple key:value parsing
            const filters = {};
            const pairs = filterString.split(',');
            for (const pair of pairs) {
                const [key, value] = pair.split(':').map(s => s.trim());
                if (key && value) {
                    filters[key] = isNaN(value) ? value.replace(/['"]/g, '') : Number(value);
                }
            }
            return filters;
        }
    }

    /**
     * Update API key usage statistics
     */
    updateApiKeyUsage(apiKey) {
        const keyData = this.apiKeys.get(apiKey);
        if (keyData) {
            keyData.lastUsed = Date.now();
            keyData.usageCount++;
            this.saveApiKeys();
        }
    }

    /**
     * Perform full backup of all databases
     */
    async performFullBackup() {
        try {
            const backupData = {};
            
            for (const [name, database] of this.databases) {
                backupData[name] = {
                    data: Object.fromEntries(database.data),
                    version: database.version,
                    lastModified: database.lastModified
                };
            }
            
            await this.backupSystem.createFullBackup('scheduled');
            console.log('Full backup completed successfully');
            
        } catch (error) {
            console.error('Full backup failed:', error);
        }
    }

    /**
     * Perform quick save of critical data
     */
    async performQuickSave() {
        try {
            await this.backupSystem.createQuickSave();
        } catch (error) {
            console.error('Quick save failed:', error);
        }
    }

    /**
     * Log performance metrics
     */
    logPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        console.log('Database Performance Metrics:', metrics);
        
        // Store metrics for historical analysis
        const metricsKey = `empire_metrics_${Date.now()}`;
        try {
            localStorage.setItem(metricsKey, JSON.stringify(metrics));
            
            // Keep only last 100 metric snapshots
            const allKeys = Object.keys(localStorage).filter(k => k.startsWith('empire_metrics_'));
            if (allKeys.length > 100) {
                const oldestKeys = allKeys.sort().slice(0, allKeys.length - 100);
                oldestKeys.forEach(key => localStorage.removeItem(key));
            }
        } catch (error) {
            console.error('Failed to store metrics:', error);
        }
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        const dbStats = {};
        for (const [name, db] of this.databases) {
            dbStats[name] = db.getStats();
        }
        
        return {
            timestamp: Date.now(),
            databases: dbStats,
            apiKeys: {
                total: this.apiKeys.size,
                active: Array.from(this.apiKeys.values()).filter(k => k.isActive).length
            },
            performance: this.metrics,
            memory: this.getMemoryUsage()
        };
    }

    /**
     * Get memory usage statistics
     */
    getMemoryUsage() {
        let totalSize = 0;
        let itemCount = 0;
        
        for (const [key, value] of Object.entries(localStorage)) {
            if (key.startsWith('empire_') || key.startsWith('dominion_wars_')) {
                totalSize += key.length + (value ? value.length : 0);
                itemCount++;
            }
        }
        
        return {
            totalBytes: totalSize,
            totalItems: itemCount,
            averageSize: itemCount > 0 ? Math.round(totalSize / itemCount) : 0
        };
    }

    /**
     * Validate player data structure
     */
    validatePlayerData(data) {
        const errors = [];
        
        if (!data.username || typeof data.username !== 'string') {
            errors.push('Invalid username');
        }
        
        if (!data.email || typeof data.email !== 'string') {
            errors.push('Invalid email');
        }
        
        if (typeof data.level !== 'number' || data.level < 1) {
            errors.push('Invalid level');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate nation data structure
     */
    validateNationData(data) {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string') {
            errors.push('Invalid nation name');
        }
        
        if (!data.playerId || typeof data.playerId !== 'string') {
            errors.push('Invalid player ID');
        }
        
        if (typeof data.population !== 'number' || data.population < 0) {
            errors.push('Invalid population');
        }
        
        if (typeof data.gdp !== 'number' || data.gdp < 0) {
            errors.push('Invalid GDP');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate alliance data structure
     */
    validateAllianceData(data) {
        const errors = [];
        
        if (!data.name || typeof data.name !== 'string') {
            errors.push('Invalid alliance name');
        }
        
        if (!data.founderId || typeof data.founderId !== 'string') {
            errors.push('Invalid founder ID');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate war data structure
     */
    validateWarData(data) {
        const errors = [];
        
        if (!data.attackerId || typeof data.attackerId !== 'string') {
            errors.push('Invalid attacker ID');
        }
        
        if (!data.defenderId || typeof data.defenderId !== 'string') {
            errors.push('Invalid defender ID');
        }
        
        if (!data.type || typeof data.type !== 'string') {
            errors.push('Invalid war type');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate trade data structure
     */
    validateTradeData(data) {
        const errors = [];
        
        if (!data.senderId || typeof data.senderId !== 'string') {
            errors.push('Invalid sender ID');
        }
        
        if (!data.receiverId || typeof data.receiverId !== 'string') {
            errors.push('Invalid receiver ID');
        }
        
        if (!data.resources || typeof data.resources !== 'object') {
            errors.push('Invalid resources');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Save API keys to storage
     */
    saveApiKeys() {
        try {
            const keysObject = Object.fromEntries(this.apiKeys);
            localStorage.setItem('empire_api_keys', JSON.stringify(keysObject));
        } catch (error) {
            console.error('Failed to save API keys:', error);
        }
    }

    /**
     * Load API keys from storage
     */
    loadApiKeys() {
        try {
            const stored = localStorage.getItem('empire_api_keys');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.apiKeys = new Map(Object.entries(parsed));
            }
        } catch (error) {
            console.error('Failed to load API keys:', error);
            this.apiKeys = new Map();
        }
    }

    /**
     * Get API key information
     */
    getApiKeyInfo(apiKey) {
        return this.apiKeys.get(apiKey) || null;
    }

    /**
     * Deactivate API key
     */
    deactivateApiKey(apiKey) {
        const keyData = this.apiKeys.get(apiKey);
        if (keyData) {
            keyData.isActive = false;
            this.saveApiKeys();
            return true;
        }
        return false;
    }

    /**
     * Get all databases status
     */
    getDatabasesStatus() {
        const status = {};
        for (const [name, db] of this.databases) {
            status[name] = db.getStats();
        }
        return status;
    }

    /**
     * Initialize missing database classes with stubs
     */
    initializeMissingDatabases() {
        // Create stub classes for databases not yet implemented
        const stubDatabases = [
            'alliances', 'wars', 'trade', 'diplomacy', 'forum', 
            'messaging', 'world', 'economy', 'military', 'research', 'analytics'
        ];
        
        for (const dbName of stubDatabases) {
            if (!this.databases.has(dbName)) {
                this.databases.set(dbName, new StubDatabase(dbName));
            }
        }
    }

    /**
     * Destroy database manager and cleanup
     */
    destroy() {
        // Stop backup system
        if (this.backupSystem) {
            this.backupSystem.stop();
        }
        
        // Clear databases
        for (const database of this.databases.values()) {
            if (database.destroy) {
                database.destroy();
            }
        }
        
        this.databases.clear();
        this.apiKeys.clear();
        this.permissions.clear();
        
        console.log('Database Manager destroyed');
    }
}

/**
 * Stub Database for databases not yet fully implemented
 */
class StubDatabase {
    constructor(name) {
        this.name = name;
        this.data = new Map();
        this.schema = {};
        this.indexes = new Map();
        this.version = 1;
        this.lastModified = Date.now();
    }

    async query(fields = [], filters = {}, permissions = ['public']) {
        return Array.from(this.data.values());
    }

    async insert(id, record) {
        record.id = id;
        record.created = Date.now();
        record.modified = Date.now();
        this.data.set(id, record);
        this.lastModified = Date.now();
        return record;
    }

    async update(id, updates) {
        const existing = this.data.get(id);
        if (!existing) {
            throw new Error(`Record ${id} not found in ${this.name}`);
        }
        
        const updated = { ...existing, ...updates };
        updated.modified = Date.now();
        
        this.data.set(id, updated);
        this.lastModified = Date.now();
        return updated;
    }

    async delete(id) {
        const result = this.data.delete(id);
        if (result) {
            this.lastModified = Date.now();
        }
        return result;
    }

    findById(id, permissions = ['public']) {
        return this.data.get(id) || null;
    }

    getStats() {
        return {
            name: this.name,
            recordCount: this.data.size,
            lastModified: this.lastModified,
            version: this.version,
            type: 'stub'
        };
    }
}

/**
 * Query Logger for tracking database queries
 */
class QueryLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
    }

    log(query, apiKey, parsedQuery) {
        const logEntry = {
            timestamp: Date.now(),
            query: query,
            apiKey: apiKey ? apiKey.substring(0, 8) + '...' : null,
            parsedQuery: parsedQuery,
            id: this.generateLogId()
        };
        
        this.logs.push(logEntry);
        
        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    getRecentLogs(limit = 50) {
        return this.logs.slice(-limit);
    }

    generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }
}

// Import required classes (these would need to be loaded)
// For now, create minimal implementations to avoid errors

class PlayerDatabase extends BaseDatabase {
    constructor() {
        super('players', {
            username: { type: 'string', required: true, indexed: true },
            email: { type: 'string', required: true, indexed: true },
            level: { type: 'number', default: 1, indexed: true },
            nationId: { type: 'string', indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true },
            
            // OAuth integration fields
            googleId: { type: 'string', indexed: true },
            discordId: { type: 'string', indexed: true },
            authProvider: { type: 'string', default: 'local', indexed: true },
            
            // Enhanced user data
            profilePicture: { type: 'string' },
            passwordHash: { type: 'string' },
            emailVerified: { type: 'boolean', default: false },
            joinDate: { type: 'number', default: () => Date.now() },
            lastLogin: { type: 'number', default: () => Date.now() },
            refreshToken: { type: 'string' }
        });
    }

    // OAuth-specific methods
    async findUserByGoogleId(googleId) {
        return this.findBy('googleId', googleId);
    }

    async findUserByDiscordId(discordId) {
        return this.findBy('discordId', discordId);
    }

    async findUserByUsername(username) {
        return this.findBy('username', username);
    }

    async findUserByEmail(email) {
        return this.findBy('email', email);
    }

    async createUser(userData) {
        return this.insert(this.generateId(), userData);
    }

    async updateUser(userId, updateData) {
        return this.update(userId, updateData);
    }
}

class NationDatabase extends BaseDatabase {
    constructor() {
        super('nations', {
            name: { type: 'string', required: true, indexed: true },
            playerId: { type: 'string', required: true, indexed: true },
            population: { type: 'number', default: 0, indexed: true },
            gdp: { type: 'number', default: 0, indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true }
        });
    }
}

class AllianceDatabase extends BaseDatabase {
    constructor() {
        super('alliances', {
            name: { type: 'string', required: true, indexed: true },
            founderId: { type: 'string', required: true, indexed: true },
            memberCount: { type: 'number', default: 1, indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true }
        });
    }
}

class WarDatabase extends StubDatabase {
    constructor() { super('wars'); }
}

class TradeDatabase extends StubDatabase {
    constructor() { super('trade'); }
}

class DiplomacyDatabase extends StubDatabase {
    constructor() { super('diplomacy'); }
}

class ForumDatabase extends StubDatabase {
    constructor() { super('forum'); }
}

class MessageDatabase extends StubDatabase {
    constructor() { super('messaging'); }
}

class WorldDatabase extends StubDatabase {
    constructor() { super('world'); }
}

class EconomyDatabase extends StubDatabase {
    constructor() { super('economy'); }
}

class MilitaryDatabase extends StubDatabase {
    constructor() { super('military'); }
}

class ResearchDatabase extends StubDatabase {
    constructor() { super('research'); }
}

class AnalyticsDatabase extends StubDatabase {
    constructor() { super('analytics'); }
}

// Base Database class (minimal implementation)
class BaseDatabase {
    constructor(name, schema = {}) {
        this.name = name;
        this.schema = schema;
        this.data = new Map();
        this.indexes = new Map();
        this.version = 1;
        this.lastModified = Date.now();
    }

    async query(fields = [], filters = {}, permissions = ['public']) {
        return Array.from(this.data.values());
    }

    async insert(id, record) {
        this.data.set(id, record);
        return record;
    }

    async update(id, updates) {
        const existing = this.data.get(id);
        if (!existing) throw new Error('Record not found');
        const updated = { ...existing, ...updates };
        this.data.set(id, updated);
        return updated;
    }

    getStats() {
        return {
            name: this.name,
            recordCount: this.data.size,
            lastModified: this.lastModified,
            version: this.version
        };
    }
}

// Create global database manager instance
const DatabaseManager_Instance = new DatabaseManager();

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        DatabaseManager, 
        DatabaseManager_Instance,
        PlayerDatabase,
        NationDatabase,
        AllianceDatabase,
        BaseDatabase,
        StubDatabase,
        QueryLogger
    };
}