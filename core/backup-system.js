/**
 * Backup System for Empire Wars
 * Handles automatic backups, data recovery, and redundancy
 */

class BackupSystem {
    constructor() {
        this.backups = new Map();
        this.maxBackups = 50;
        this.backupInterval = 600000; // 10 minutes
        this.quickSaveInterval = 60000; // 1 minute
        
        this.backupTimer = null;
        this.quickSaveTimer = null;
        
        this.setupAutoBackup();
        this.loadBackupRegistry();
    }

    /**
     * Create a full backup of all game data
     */
    async createFullBackup(source = 'auto') {
        try {
            const backupId = this.generateBackupId();
            const timestamp = Date.now();
            
            const backup = {
                id: backupId,
                timestamp: timestamp,
                source: source,
                type: 'full',
                data: await this.collectAllData(),
                size: 0,
                checksum: ''
            };
            
            // Calculate size and checksum
            const serialized = JSON.stringify(backup.data);
            backup.size = serialized.length;
            backup.checksum = this.calculateChecksum(serialized);
            
            // Store backup
            await this.storeBackup(backup);
            
            // Clean up old backups
            this.cleanupOldBackups();
            
            console.log(`Full backup created: ${backupId} (${this.formatBytes(backup.size)})`);
            return backupId;
            
        } catch (error) {
            console.error('Failed to create full backup:', error);
            throw error;
        }
    }

    /**
     * Create an incremental backup with only changed data
     */
    async createIncrementalBackup(changedData, source = 'auto') {
        try {
            const backupId = this.generateBackupId();
            const timestamp = Date.now();
            
            const backup = {
                id: backupId,
                timestamp: timestamp,
                source: source,
                type: 'incremental',
                data: changedData,
                size: 0,
                checksum: ''
            };
            
            // Calculate size and checksum
            const serialized = JSON.stringify(backup.data);
            backup.size = serialized.length;
            backup.checksum = this.calculateChecksum(serialized);
            
            // Store backup
            await this.storeBackup(backup);
            
            console.log(`Incremental backup created: ${backupId} (${this.formatBytes(backup.size)})`);
            return backupId;
            
        } catch (error) {
            console.error('Failed to create incremental backup:', error);
            throw error;
        }
    }

    /**
     * Quick save - lightweight backup for frequent saves
     */
    async createQuickSave() {
        try {
            const quickSaveData = {
                timestamp: Date.now(),
                players: await this.getQuickSaveData('players'),
                nations: await this.getQuickSaveData('nations'),
                alliances: await this.getQuickSaveData('alliances')
            };
            
            localStorage.setItem('empire_quicksave', JSON.stringify(quickSaveData));
            
            // Keep rotating quick saves
            for (let i = 4; i > 0; i--) {
                const current = localStorage.getItem(`empire_quicksave_${i}`);
                if (current) {
                    localStorage.setItem(`empire_quicksave_${i + 1}`, current);
                }
            }
            
            localStorage.setItem('empire_quicksave_1', JSON.stringify(quickSaveData));
            
        } catch (error) {
            console.error('Quick save failed:', error);
        }
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId) {
        try {
            const backup = await this.loadBackup(backupId);
            if (!backup) {
                throw new Error(`Backup ${backupId} not found`);
            }
            
            // Verify backup integrity
            if (!this.verifyBackup(backup)) {
                throw new Error(`Backup ${backupId} is corrupted`);
            }
            
            // Apply backup data
            if (backup.type === 'full') {
                await this.restoreFullBackup(backup.data);
            } else {
                await this.restoreIncrementalBackup(backup.data);
            }
            
            console.log(`Successfully restored from backup: ${backupId}`);
            return true;
            
        } catch (error) {
            console.error('Failed to restore backup:', error);
            throw error;
        }
    }

    /**
     * Collect all game data for backup
     */
    async collectAllData() {
        const data = {};
        
        // Get data from localStorage
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith('empire_db_') || key.startsWith('dominion_wars_')) {
                data[key] = localStorage.getItem(key);
            }
        }
        
        return data;
    }

    /**
     * Get quick save data for specific database
     */
    async getQuickSaveData(dbName) {
        const key = `empire_db_${dbName}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Store backup to multiple locations for redundancy
     */
    async storeBackup(backup) {
        // Primary storage - localStorage
        const backupKey = `empire_backup_${backup.id}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Secondary storage - IndexedDB for larger backups
        if (backup.size > 100000) { // 100KB threshold
            await this.storeInIndexedDB(backup);
        }
        
        // Update backup registry
        this.backups.set(backup.id, {
            id: backup.id,
            timestamp: backup.timestamp,
            source: backup.source,
            type: backup.type,
            size: backup.size,
            checksum: backup.checksum,
            locations: ['localStorage', backup.size > 100000 ? 'indexedDB' : null].filter(Boolean)
        });
        
        this.saveBackupRegistry();
    }

    /**
     * Load backup from storage
     */
    async loadBackup(backupId) {
        const registry = this.backups.get(backupId);
        if (!registry) {
            return null;
        }
        
        // Try localStorage first
        if (registry.locations.includes('localStorage')) {
            const backupKey = `empire_backup_${backupId}`;
            const data = localStorage.getItem(backupKey);
            if (data) {
                return JSON.parse(data);
            }
        }
        
        // Try IndexedDB
        if (registry.locations.includes('indexedDB')) {
            return await this.loadFromIndexedDB(backupId);
        }
        
        return null;
    }

    /**
     * Verify backup integrity
     */
    verifyBackup(backup) {
        try {
            const serialized = JSON.stringify(backup.data);
            const checksum = this.calculateChecksum(serialized);
            return checksum === backup.checksum;
        } catch (error) {
            console.error('Backup verification error:', error);
            return false;
        }
    }

    /**
     * Restore full backup
     */
    async restoreFullBackup(data) {
        // Clear current data
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith('empire_db_') || key.startsWith('dominion_wars_')) {
                localStorage.removeItem(key);
            }
        }
        
        // Restore backup data
        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
        }
    }

    /**
     * Restore incremental backup
     */
    async restoreIncrementalBackup(data) {
        // Apply incremental changes
        for (const [key, value] of Object.entries(data)) {
            if (value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, value);
            }
        }
    }

    /**
     * Setup automatic backup timers
     */
    setupAutoBackup() {
        // Full backup every 10 minutes
        this.backupTimer = setInterval(() => {
            this.createFullBackup('auto').catch(error => {
                console.error('Auto backup failed:', error);
            });
        }, this.backupInterval);
        
        // Quick save every minute
        this.quickSaveTimer = setInterval(() => {
            this.createQuickSave().catch(error => {
                console.error('Quick save failed:', error);
            });
        }, this.quickSaveInterval);
    }

    /**
     * Clean up old backups
     */
    cleanupOldBackups() {
        const backupList = Array.from(this.backups.values())
            .sort((a, b) => b.timestamp - a.timestamp);
        
        // Keep only the most recent backups
        const toDelete = backupList.slice(this.maxBackups);
        
        for (const backup of toDelete) {
            this.deleteBackup(backup.id);
        }
    }

    /**
     * Delete a backup
     */
    async deleteBackup(backupId) {
        try {
            const registry = this.backups.get(backupId);
            if (!registry) return;
            
            // Remove from localStorage
            if (registry.locations.includes('localStorage')) {
                localStorage.removeItem(`empire_backup_${backupId}`);
            }
            
            // Remove from IndexedDB
            if (registry.locations.includes('indexedDB')) {
                await this.deleteFromIndexedDB(backupId);
            }
            
            // Remove from registry
            this.backups.delete(backupId);
            this.saveBackupRegistry();
            
        } catch (error) {
            console.error(`Failed to delete backup ${backupId}:`, error);
        }
    }

    /**
     * Get backup list with metadata
     */
    getBackupList() {
        return Array.from(this.backups.values())
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Calculate simple checksum for data integrity
     */
    calculateChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Generate unique backup ID
     */
    generateBackupId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `backup_${timestamp}_${random}`;
    }

    /**
     * Format bytes for display
     */
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Load backup registry from storage
     */
    loadBackupRegistry() {
        try {
            const registry = localStorage.getItem('empire_backup_registry');
            if (registry) {
                const parsed = JSON.parse(registry);
                this.backups = new Map(Object.entries(parsed));
            }
        } catch (error) {
            console.error('Failed to load backup registry:', error);
            this.backups = new Map();
        }
    }

    /**
     * Save backup registry to storage
     */
    saveBackupRegistry() {
        try {
            const registryObject = Object.fromEntries(this.backups);
            localStorage.setItem('empire_backup_registry', JSON.stringify(registryObject));
        } catch (error) {
            console.error('Failed to save backup registry:', error);
        }
    }

    /**
     * Store large backup in IndexedDB
     */
    async storeInIndexedDB(backup) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EmpireBackups', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('backups')) {
                    db.createObjectStore('backups', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['backups'], 'readwrite');
                const store = transaction.objectStore('backups');
                
                const addRequest = store.put(backup);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            };
        });
    }

    /**
     * Load backup from IndexedDB
     */
    async loadFromIndexedDB(backupId) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EmpireBackups', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['backups'], 'readonly');
                const store = transaction.objectStore('backups');
                
                const getRequest = store.get(backupId);
                getRequest.onsuccess = () => resolve(getRequest.result);
                getRequest.onerror = () => reject(getRequest.error);
            };
        });
    }

    /**
     * Delete backup from IndexedDB
     */
    async deleteFromIndexedDB(backupId) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EmpireBackups', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['backups'], 'readwrite');
                const store = transaction.objectStore('backups');
                
                const deleteRequest = store.delete(backupId);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject(deleteRequest.error);
            };
        });
    }

    /**
     * Export backup as downloadable file
     */
    async exportBackup(backupId) {
        try {
            const backup = await this.loadBackup(backupId);
            if (!backup) {
                throw new Error('Backup not found');
            }
            
            const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `empire_backup_${backupId}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Failed to export backup:', error);
            throw error;
        }
    }

    /**
     * Import backup from file
     */
    async importBackup(file) {
        try {
            const content = await this.readFile(file);
            const backup = JSON.parse(content);
            
            // Verify backup format
            if (!backup.id || !backup.data || !backup.checksum) {
                throw new Error('Invalid backup file format');
            }
            
            // Verify integrity
            if (!this.verifyBackup(backup)) {
                throw new Error('Backup file is corrupted');
            }
            
            // Store imported backup
            await this.storeBackup(backup);
            
            return backup.id;
            
        } catch (error) {
            console.error('Failed to import backup:', error);
            throw error;
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
     * Stop automatic backup timers
     */
    stop() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
        }
        
        if (this.quickSaveTimer) {
            clearInterval(this.quickSaveTimer);
            this.quickSaveTimer = null;
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BackupSystem };
}