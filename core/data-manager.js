/**
 * Data Manager for Save/Load and Data Persistence
 * Dominion Wars - Nation Building Strategy Game
 */

class DataManager {
    constructor() {
        this.saveSlots = new Map();
        this.autoSaveEnabled = true;
        this.autoSaveInterval = GameConfig.SAVE.AUTO_SAVE_INTERVAL;
        this.maxSaveSlots = GameConfig.SAVE.MAX_SAVE_SLOTS;
        this.compressionEnabled = GameConfig.SAVE.COMPRESSION_ENABLED;
        this.autoSaveTimer = null;
        
        this.loadSaveSlots();
        this.setupAutoSave();
    }

    /**
     * Save the current game state
     * @param {string} slotName - Name of the save slot
     * @param {Object} gameState - Current game state to save
     * @param {boolean} isAutoSave - Whether this is an auto-save
     * @returns {Promise<boolean>} Success status
     */
    async saveGame(slotName = 'quicksave', gameState = null, isAutoSave = false) {
        try {
            if (!gameState) {
                gameState = this.getCurrentGameState();
            }

            const saveData = {
                version: GameConfig.VERSION,
                timestamp: Date.now(),
                gameState: gameState,
                metadata: {
                    nationName: gameState.nation?.name || 'Unknown Nation',
                    gameYear: gameState.time?.year || 1,
                    gameDay: gameState.time?.day || 1,
                    population: gameState.nation?.population || 0,
                    playTime: gameState.playTime || 0,
                    isAutoSave: isAutoSave
                }
            };

            // Compress data if enabled
            let processedData = JSON.stringify(saveData);
            if (this.compressionEnabled) {
                processedData = this.compressData(processedData);
            }

            // Save to localStorage
            const saveKey = `dominion_wars_save_${slotName}`;
            localStorage.setItem(saveKey, processedData);

            // Update save slots registry
            this.saveSlots.set(slotName, {
                name: slotName,
                timestamp: saveData.timestamp,
                metadata: saveData.metadata,
                compressed: this.compressionEnabled
            });

            this.saveSaveSlots();

            EventBus.emit(GameEvents.GAME_SAVED, {
                slotName: slotName,
                timestamp: saveData.timestamp,
                isAutoSave: isAutoSave
            });

            console.log(`Game saved to slot '${slotName}' ${isAutoSave ? '(auto)' : ''}`);
            return true;

        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    /**
     * Load a game from a save slot
     * @param {string} slotName - Name of the save slot to load
     * @returns {Promise<Object|null>} Loaded game state or null if failed
     */
    async loadGame(slotName = 'quicksave') {
        try {
            const saveKey = `dominion_wars_save_${slotName}`;
            let saveData = localStorage.getItem(saveKey);

            if (!saveData) {
                console.warn(`No save data found for slot '${slotName}'`);
                return null;
            }

            // Decompress data if needed
            const slotInfo = this.saveSlots.get(slotName);
            if (slotInfo && slotInfo.compressed) {
                saveData = this.decompressData(saveData);
            }

            const parsedData = JSON.parse(saveData);

            // Validate save data version
            if (!this.validateSaveData(parsedData)) {
                console.error('Invalid or incompatible save data');
                return null;
            }

            EventBus.emit(GameEvents.GAME_LOADED, {
                slotName: slotName,
                timestamp: parsedData.timestamp,
                metadata: parsedData.metadata
            });

            console.log(`Game loaded from slot '${slotName}'`);
            return parsedData.gameState;

        } catch (error) {
            console.error('Error loading game:', error);
            return null;
        }
    }

    /**
     * Delete a save slot
     * @param {string} slotName - Name of the save slot to delete
     * @returns {boolean} Success status
     */
    deleteSave(slotName) {
        try {
            const saveKey = `dominion_wars_save_${slotName}`;
            localStorage.removeItem(saveKey);
            this.saveSlots.delete(slotName);
            this.saveSaveSlots();
            
            console.log(`Save slot '${slotName}' deleted`);
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            return false;
        }
    }

    /**
     * Get list of all save slots
     * @returns {Array} Array of save slot information
     */
    getSaveSlots() {
        return Array.from(this.saveSlots.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Check if a save slot exists
     * @param {string} slotName - Name of the save slot
     * @returns {boolean} Whether the slot exists
     */
    hasSave(slotName) {
        return this.saveSlots.has(slotName);
    }

    /**
     * Get current game state from all systems
     * @returns {Object} Current game state
     */
    getCurrentGameState() {
        const gameState = {
            timestamp: Date.now(),
            version: GameConfig.VERSION
        };

        // Collect data from all game systems
        if (window.GameEngine) {
            gameState.engine = GameEngine.getState();
        }

        if (window.Nation) {
            gameState.nation = Nation.serialize();
        }

        if (window.EconomySystem) {
            gameState.economy = EconomySystem.getState();
        }

        if (window.MilitarySystem) {
            gameState.military = MilitarySystem.getState();
        }

        if (window.PopulationSystem) {
            gameState.population = PopulationSystem.getState();
        }

        if (window.InfrastructureSystem) {
            gameState.infrastructure = InfrastructureSystem.getState();
        }

        if (window.ResearchSystem) {
            gameState.research = ResearchSystem.getState();
        }

        if (window.DiplomacySystem) {
            gameState.diplomacy = DiplomacySystem.getState();
        }

        if (window.TerritorySystem) {
            gameState.territory = TerritorySystem.getState();
        }

        if (window.TimeSystem) {
            gameState.time = TimeSystem.getState();
        }

        return gameState;
    }

    /**
     * Apply loaded game state to all systems
     * @param {Object} gameState - Game state to apply
     * @returns {Promise<boolean>} Success status
     */
    async applyGameState(gameState) {
        try {
            // Apply state to all game systems
            if (gameState.engine && window.GameEngine) {
                GameEngine.setState(gameState.engine);
            }

            if (gameState.nation && window.Nation) {
                Nation.deserialize(gameState.nation);
            }

            if (gameState.economy && window.EconomySystem) {
                EconomySystem.setState(gameState.economy);
            }

            if (gameState.military && window.MilitarySystem) {
                MilitarySystem.setState(gameState.military);
            }

            if (gameState.population && window.PopulationSystem) {
                PopulationSystem.setState(gameState.population);
            }

            if (gameState.infrastructure && window.InfrastructureSystem) {
                InfrastructureSystem.setState(gameState.infrastructure);
            }

            if (gameState.research && window.ResearchSystem) {
                ResearchSystem.setState(gameState.research);
            }

            if (gameState.diplomacy && window.DiplomacySystem) {
                DiplomacySystem.setState(gameState.diplomacy);
            }

            if (gameState.territory && window.TerritorySystem) {
                TerritorySystem.setState(gameState.territory);
            }

            if (gameState.time && window.TimeSystem) {
                TimeSystem.setState(gameState.time);
            }

            // Refresh UI after loading
            if (window.GameEngine) {
                GameEngine.refreshUI();
            }

            return true;
        } catch (error) {
            console.error('Error applying game state:', error);
            return false;
        }
    }

    /**
     * Setup automatic saving
     */
    setupAutoSave() {
        if (this.autoSaveEnabled && this.autoSaveInterval > 0) {
            this.autoSaveTimer = setInterval(() => {
                this.saveGame('autosave', null, true);
            }, this.autoSaveInterval);
        }
    }

    /**
     * Stop automatic saving
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Validate save data compatibility
     * @param {Object} saveData - Save data to validate
     * @returns {boolean} Whether the save data is valid
     */
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return false;
        }

        if (!saveData.version || !saveData.timestamp || !saveData.gameState) {
            return false;
        }

        // Check version compatibility (simplified)
        const saveVersion = saveData.version.split('.');
        const currentVersion = GameConfig.VERSION.split('.');
        
        // Major version must match
        if (saveVersion[0] !== currentVersion[0]) {
            return false;
        }

        return true;
    }

    /**
     * Load save slots registry from localStorage
     */
    loadSaveSlots() {
        try {
            const slotsData = localStorage.getItem('dominion_wars_save_slots');
            if (slotsData) {
                const slots = JSON.parse(slotsData);
                this.saveSlots = new Map(Object.entries(slots));
            }
        } catch (error) {
            console.error('Error loading save slots:', error);
            this.saveSlots = new Map();
        }
    }

    /**
     * Save save slots registry to localStorage
     */
    saveSaveSlots() {
        try {
            const slotsObject = Object.fromEntries(this.saveSlots);
            localStorage.setItem('dominion_wars_save_slots', JSON.stringify(slotsObject));
        } catch (error) {
            console.error('Error saving save slots registry:', error);
        }
    }

    /**
     * Export save data as downloadable file
     * @param {string} slotName - Name of the save slot to export
     * @returns {boolean} Success status
     */
    exportSave(slotName) {
        try {
            const saveKey = `dominion_wars_save_${slotName}`;
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) {
                console.error('Save slot not found');
                return false;
            }

            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `dominion_wars_${slotName}_${Date.now()}.save`;
            link.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting save:', error);
            return false;
        }
    }

    /**
     * Import save data from file
     * @param {File} file - Save file to import
     * @param {string} slotName - Name for the imported save slot
     * @returns {Promise<boolean>} Success status
     */
    async importSave(file, slotName) {
        try {
            const saveData = await this.readFile(file);
            const saveKey = `dominion_wars_save_${slotName}`;
            
            // Validate imported data
            const parsedData = JSON.parse(saveData);
            if (!this.validateSaveData(parsedData)) {
                console.error('Invalid save file');
                return false;
            }

            localStorage.setItem(saveKey, saveData);
            
            // Update save slots registry
            this.saveSlots.set(slotName, {
                name: slotName,
                timestamp: parsedData.timestamp,
                metadata: parsedData.metadata,
                compressed: this.compressionEnabled
            });

            this.saveSaveSlots();
            return true;
        } catch (error) {
            console.error('Error importing save:', error);
            return false;
        }
    }

    /**
     * Read file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
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
     * Simple data compression (placeholder)
     * @param {string} data - Data to compress
     * @returns {string} Compressed data
     */
    compressData(data) {
        // Simple compression using btoa (base64 encoding)
        // In a real implementation, you might use a proper compression library
        return btoa(data);
    }

    /**
     * Simple data decompression (placeholder)
     * @param {string} data - Data to decompress
     * @returns {string} Decompressed data
     */
    decompressData(data) {
        // Simple decompression using atob (base64 decoding)
        return atob(data);
    }

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        let totalSize = 0;
        let saveCount = 0;

        for (const [key, value] of Object.entries(localStorage)) {
            if (key.startsWith('dominion_wars_save_')) {
                totalSize += key.length + value.length;
                saveCount++;
            }
        }

        return {
            saveCount: saveCount,
            totalSize: totalSize,
            averageSize: saveCount > 0 ? Math.round(totalSize / saveCount) : 0,
            maxSlots: this.maxSaveSlots
        };
    }

    /**
     * Clear all save data
     */
    clearAllSaves() {
        try {
            // Remove all save files
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('dominion_wars_save_')) {
                    localStorage.removeItem(key);
                }
            }

            // Clear save slots registry
            this.saveSlots.clear();
            localStorage.removeItem('dominion_wars_save_slots');

            console.log('All save data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing save data:', error);
            return false;
        }
    }

    /**
     * Cleanup old saves (keep only the most recent ones)
     * @param {number} maxToKeep - Maximum number of saves to keep
     */
    cleanupOldSaves(maxToKeep = 5) {
        const saves = this.getSaveSlots().filter(save => !save.name.includes('autosave'));
        
        if (saves.length > maxToKeep) {
            const toDelete = saves.slice(maxToKeep);
            
            for (const save of toDelete) {
                this.deleteSave(save.name);
            }
            
            console.log(`Cleaned up ${toDelete.length} old save files`);
        }
    }

    /**
     * Destroy the data manager and clean up resources
     */
    destroy() {
        this.stopAutoSave();
        this.saveSlots.clear();
        console.log('Data manager destroyed');
    }
}

// Create global data manager instance
const DataManager_Instance = new DataManager();

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataManager, DataManager_Instance };
}