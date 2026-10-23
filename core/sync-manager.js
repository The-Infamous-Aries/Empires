/**
 * Sync Manager for Empire Wars
 * Handles real-time synchronization and data consistency
 */

class SyncManager {
    constructor() {
        this.syncQueue = [];
        this.isProcessing = false;
        this.listeners = new Map();
        this.syncInterval = 5000; // 5 seconds
        this.maxRetries = 3;
        this.conflictResolver = new ConflictResolver();
        
        this.startSyncLoop();
        this.setupChangeTracking();
    }

    /**
     * Queue data for synchronization
     */
    queueSync(data, source = 'game', priority = 'normal') {
        const syncItem = {
            id: this.generateSyncId(),
            data: data,
            source: source,
            priority: priority,
            timestamp: Date.now(),
            retries: 0,
            status: 'queued'
        };
        
        this.syncQueue.push(syncItem);
        this.sortSyncQueue();
        
        // Process immediately for high priority items
        if (priority === 'high' && !this.isProcessing) {
            this.processSyncQueue();
        }
    }

    /**
     * Process sync queue
     */
    async processSyncQueue() {
        if (this.isProcessing || this.syncQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            while (this.syncQueue.length > 0) {
                const item = this.syncQueue.shift();
                await this.processSyncItem(item);
            }
        } catch (error) {
            console.error('Sync processing error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process individual sync item
     */
    async processSyncItem(item) {
        try {
            item.status = 'processing';
            
            // Validate data before sync
            const validation = await this.validateSyncData(item.data);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Check for conflicts
            const conflicts = await this.detectConflicts(item.data);
            if (conflicts.length > 0) {
                const resolved = await this.conflictResolver.resolve(conflicts, item.data);
                item.data = resolved;
            }
            
            // Apply sync
            await this.applySyncData(item.data, item.source);
            
            item.status = 'completed';
            this.notifyListeners('syncCompleted', item);
            
        } catch (error) {
            console.error(`Sync item ${item.id} failed:`, error);
            
            item.retries++;
            item.status = 'failed';
            item.error = error.message;
            
            // Retry if under limit
            if (item.retries < this.maxRetries) {
                item.status = 'queued';
                this.syncQueue.unshift(item); // Add back to front for retry
            } else {
                this.notifyListeners('syncFailed', item);
            }
        }
    }

    /**
     * Validate sync data
     */
    async validateSyncData(data) {
        const errors = [];
        
        // Check data structure
        if (!data || typeof data !== 'object') {
            errors.push('Data must be an object');
            return { isValid: false, errors };
        }
        
        // Validate individual database changes
        for (const [dbName, dbData] of Object.entries(data)) {
            if (!this.isValidDatabaseName(dbName)) {
                errors.push(`Invalid database name: ${dbName}`);
                continue;
            }
            
            if (!Array.isArray(dbData) && typeof dbData !== 'object') {
                errors.push(`Invalid data format for ${dbName}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Detect data conflicts
     */
    async detectConflicts(incomingData) {
        const conflicts = [];
        
        for (const [dbName, changes] of Object.entries(incomingData)) {
            // Get current data state
            const currentData = this.getCurrentDatabaseState(dbName);
            
            if (Array.isArray(changes)) {
                // Handle batch changes
                for (const change of changes) {
                    const conflict = this.detectRecordConflict(currentData, change);
                    if (conflict) {
                        conflicts.push({
                            database: dbName,
                            recordId: change.id,
                            type: conflict.type,
                            current: conflict.current,
                            incoming: change,
                            timestamp: Date.now()
                        });
                    }
                }
            } else if (changes.id) {
                // Handle single record change
                const conflict = this.detectRecordConflict(currentData, changes);
                if (conflict) {
                    conflicts.push({
                        database: dbName,
                        recordId: changes.id,
                        type: conflict.type,
                        current: conflict.current,
                        incoming: changes,
                        timestamp: Date.now()
                    });
                }
            }
        }
        
        return conflicts;
    }

    /**
     * Detect conflict for individual record
     */
    detectRecordConflict(currentData, incomingChange) {
        if (!incomingChange.id) {
            return null;
        }
        
        const currentRecord = currentData.get ? currentData.get(incomingChange.id) : 
                             currentData[incomingChange.id];
        
        if (!currentRecord) {
            return null; // No conflict for new records
        }
        
        // Check for timestamp conflicts
        if (currentRecord.modified && incomingChange.modified) {
            if (currentRecord.modified > incomingChange.modified) {
                return {
                    type: 'stale_update',
                    current: currentRecord
                };
            }
        }
        
        // Check for concurrent modifications
        if (currentRecord.version && incomingChange.version) {
            if (currentRecord.version !== incomingChange.version - 1) {
                return {
                    type: 'version_conflict',
                    current: currentRecord
                };
            }
        }
        
        return null;
    }

    /**
     * Apply synchronized data
     */
    async applySyncData(data, source) {
        const appliedChanges = {};
        
        for (const [dbName, changes] of Object.entries(data)) {
            try {
                const applied = await this.applyDatabaseChanges(dbName, changes, source);
                appliedChanges[dbName] = applied;
            } catch (error) {
                console.error(`Failed to apply changes to ${dbName}:`, error);
                throw error;
            }
        }
        
        // Notify about successful sync
        this.notifyListeners('dataUpdated', appliedChanges);
        
        return appliedChanges;
    }

    /**
     * Apply changes to specific database
     */
    async applyDatabaseChanges(dbName, changes, source) {
        // This would integrate with the DatabaseManager
        // For now, just track the changes
        const applied = [];
        
        if (Array.isArray(changes)) {
            for (const change of changes) {
                applied.push(await this.applyRecordChange(dbName, change, source));
            }
        } else if (changes.id) {
            applied.push(await this.applyRecordChange(dbName, changes, source));
        }
        
        return applied;
    }

    /**
     * Apply individual record change
     */
    async applyRecordChange(dbName, change, source) {
        // Mark change with sync metadata
        const syncedChange = {
            ...change,
            syncSource: source,
            syncTimestamp: Date.now(),
            version: (change.version || 0) + 1
        };
        
        // Store the change (this would interact with actual database)
        // For now, just simulate the operation
        console.log(`Applied sync change to ${dbName}:`, syncedChange.id);
        
        return syncedChange;
    }

    /**
     * Start sync processing loop
     */
    startSyncLoop() {
        setInterval(() => {
            if (!this.isProcessing && this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        }, this.syncInterval);
    }

    /**
     * Setup change tracking
     */
    setupChangeTracking() {
        // Track localStorage changes
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            const oldValue = localStorage.getItem(key);
            originalSetItem.call(localStorage, key, value);
            
            if (key.startsWith('empire_db_') && oldValue !== value) {
                this.trackChange(key, value, oldValue);
            }
        };
    }

    /**
     * Track data changes
     */
    trackChange(key, newValue, oldValue) {
        try {
            const dbName = key.replace('empire_db_', '');
            const changeRecord = {
                database: dbName,
                key: key,
                newValue: newValue,
                oldValue: oldValue,
                timestamp: Date.now(),
                source: 'local'
            };
            
            this.notifyListeners('changeTracked', changeRecord);
            
        } catch (error) {
            console.error('Change tracking error:', error);
        }
    }

    /**
     * Subscribe to sync events
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        
        this.listeners.get(event).add(callback);
        
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
            }
        };
    }

    /**
     * Notify event listeners
     */
    notifyListeners(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            for (const callback of eventListeners) {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Listener error:', error);
                }
            }
        }
    }

    /**
     * Get current database state
     */
    getCurrentDatabaseState(dbName) {
        try {
            const data = localStorage.getItem(`empire_db_${dbName}`);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error(`Failed to get ${dbName} state:`, error);
            return {};
        }
    }

    /**
     * Sort sync queue by priority and timestamp
     */
    sortSyncQueue() {
        this.syncQueue.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            return a.timestamp - b.timestamp;
        });
    }

    /**
     * Generate unique sync ID
     */
    generateSyncId() {
        return 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    /**
     * Check if database name is valid
     */
    isValidDatabaseName(name) {
        const validNames = [
            'players', 'nations', 'alliances', 'wars', 'trade', 
            'diplomacy', 'forum', 'messaging', 'world', 'economy', 
            'military', 'research', 'analytics'
        ];
        return validNames.includes(name);
    }

    /**
     * Get sync queue status
     */
    getSyncStatus() {
        return {
            queueLength: this.syncQueue.length,
            isProcessing: this.isProcessing,
            byPriority: {
                high: this.syncQueue.filter(item => item.priority === 'high').length,
                normal: this.syncQueue.filter(item => item.priority === 'normal').length,
                low: this.syncQueue.filter(item => item.priority === 'low').length
            },
            byStatus: {
                queued: this.syncQueue.filter(item => item.status === 'queued').length,
                processing: this.syncQueue.filter(item => item.status === 'processing').length,
                failed: this.syncQueue.filter(item => item.status === 'failed').length
            }
        };
    }

    /**
     * Clear sync queue
     */
    clearQueue() {
        this.syncQueue = [];
    }

    /**
     * Force sync now
     */
    async forceSync() {
        if (!this.isProcessing) {
            await this.processSyncQueue();
        }
    }
}

/**
 * Conflict Resolver for handling data conflicts
 */
class ConflictResolver {
    constructor() {
        this.strategies = new Map([
            ['timestamp', this.resolveByTimestamp],
            ['version', this.resolveByVersion],
            ['merge', this.mergeConflicts],
            ['manual', this.flagForManualResolution]
        ]);
    }

    /**
     * Resolve conflicts using appropriate strategy
     */
    async resolve(conflicts, incomingData) {
        const resolved = { ...incomingData };
        
        for (const conflict of conflicts) {
            const strategy = this.selectStrategy(conflict);
            const resolution = await this.strategies.get(strategy).call(this, conflict);
            
            // Apply resolution to resolved data
            if (resolution.action === 'accept_current') {
                // Keep current data (remove incoming change)
                this.removeChange(resolved, conflict);
            } else if (resolution.action === 'accept_incoming') {
                // Keep incoming data (no change needed)
                continue;
            } else if (resolution.action === 'merge') {
                // Apply merged data
                this.applyMergedData(resolved, conflict, resolution.mergedData);
            } else if (resolution.action === 'manual') {
                // Flag for manual resolution
                this.flagManualResolution(resolved, conflict);
            }
        }
        
        return resolved;
    }

    /**
     * Select appropriate strategy for conflict type
     */
    selectStrategy(conflict) {
        switch (conflict.type) {
            case 'stale_update':
                return 'timestamp';
            case 'version_conflict':
                return 'version';
            case 'concurrent_modify':
                return 'merge';
            default:
                return 'manual';
        }
    }

    /**
     * Resolve by timestamp - newest wins
     */
    async resolveByTimestamp(conflict) {
        const currentTime = conflict.current.modified || 0;
        const incomingTime = conflict.incoming.modified || 0;
        
        return {
            action: incomingTime > currentTime ? 'accept_incoming' : 'accept_current',
            reason: 'Resolved by timestamp'
        };
    }

    /**
     * Resolve by version - check version sequence
     */
    async resolveByVersion(conflict) {
        const currentVersion = conflict.current.version || 0;
        const incomingVersion = conflict.incoming.version || 0;
        
        if (incomingVersion === currentVersion + 1) {
            return {
                action: 'accept_incoming',
                reason: 'Valid version sequence'
            };
        } else {
            return {
                action: 'accept_current',
                reason: 'Invalid version sequence'
            };
        }
    }

    /**
     * Attempt to merge conflicting changes
     */
    async mergeConflicts(conflict) {
        try {
            const merged = this.performMerge(conflict.current, conflict.incoming);
            return {
                action: 'merge',
                mergedData: merged,
                reason: 'Automatically merged'
            };
        } catch (error) {
            return {
                action: 'manual',
                reason: 'Automatic merge failed'
            };
        }
    }

    /**
     * Flag for manual resolution
     */
    async flagForManualResolution(conflict) {
        return {
            action: 'manual',
            reason: 'Requires manual intervention'
        };
    }

    /**
     * Perform data merge
     */
    performMerge(current, incoming) {
        const merged = { ...current };
        
        // Simple field-level merge
        for (const [key, value] of Object.entries(incoming)) {
            if (key === 'id' || key === 'created') {
                continue; // Don't merge these fields
            }
            
            if (current[key] !== value) {
                // Take the newer value or use conflict resolution rules
                merged[key] = value;
            }
        }
        
        // Update version and timestamp
        merged.version = Math.max(current.version || 0, incoming.version || 0) + 1;
        merged.modified = Date.now();
        merged.mergedAt = Date.now();
        
        return merged;
    }

    /**
     * Remove conflicting change from data
     */
    removeChange(data, conflict) {
        if (data[conflict.database]) {
            if (Array.isArray(data[conflict.database])) {
                data[conflict.database] = data[conflict.database].filter(
                    item => item.id !== conflict.recordId
                );
            } else if (data[conflict.database].id === conflict.recordId) {
                delete data[conflict.database];
            }
        }
    }

    /**
     * Apply merged data
     */
    applyMergedData(data, conflict, mergedData) {
        if (!data[conflict.database]) {
            data[conflict.database] = [];
        }
        
        if (Array.isArray(data[conflict.database])) {
            const index = data[conflict.database].findIndex(item => item.id === conflict.recordId);
            if (index >= 0) {
                data[conflict.database][index] = mergedData;
            } else {
                data[conflict.database].push(mergedData);
            }
        } else {
            data[conflict.database] = mergedData;
        }
    }

    /**
     * Flag for manual resolution
     */
    flagManualResolution(data, conflict) {
        if (!data._conflicts) {
            data._conflicts = [];
        }
        
        data._conflicts.push({
            ...conflict,
            flaggedAt: Date.now(),
            status: 'pending_manual_resolution'
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SyncManager, ConflictResolver };
}