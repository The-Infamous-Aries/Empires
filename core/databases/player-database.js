/**
 * Player Database - Handles player accounts and progression data
 */

class PlayerDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            username: { type: 'string', required: true, indexed: true },
            email: { type: 'string', required: true, indexed: true },
            passwordHash: { type: 'string', required: true },
            level: { type: 'number', default: 1, indexed: true },
            experience: { type: 'number', default: 0 },
            skillPoints: { type: 'number', default: 5 },
            legendaryPoints: { type: 'number', default: 0 },
            skills: { type: 'object', default: {} },
            nationId: { type: 'string', indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true },
            lastLogin: { type: 'number', indexed: true },
            createdAt: { type: 'number', default: Date.now },
            preferences: { type: 'object', default: {} },
            achievements: { type: 'object', default: {} }
        };
        
        super('players', schema);
    }

    /**
     * Create new player account
     */
    async createPlayer(playerData) {
        const id = this.generatePlayerId();
        
        const player = {
            ...playerData,
            id: id,
            level: 1,
            experience: 0,
            skillPoints: 5,
            legendaryPoints: 0,
            skills: {},
            isActive: true,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            preferences: this.getDefaultPreferences(),
            achievements: {}
        };
        
        return await this.insert(id, player);
    }

    /**
     * Authenticate player login
     */
    async authenticatePlayer(username, passwordHash) {
        const players = await this.query([], { username: username, isActive: true }, ['admin']);
        
        if (players.length === 0) {
            return null;
        }
        
        const player = players[0];
        if (player.passwordHash === passwordHash) {
            // Update last login
            await this.update(player.id, { lastLogin: Date.now() });
            return player;
        }
        
        return null;
    }

    /**
     * Award experience to player
     */
    async awardExperience(playerId, amount, source = 'unknown') {
        const player = this.findById(playerId, ['admin']);
        if (!player) {
            throw new Error('Player not found');
        }
        
        const newExp = player.experience + amount;
        const newLevel = this.calculateLevel(newExp);
        const levelUp = newLevel > player.level;
        
        const updates = {
            experience: newExp,
            level: newLevel
        };
        
        // Award skill points for level up
        if (levelUp) {
            updates.skillPoints = player.skillPoints + ((newLevel - player.level) * 5);
        }
        
        const updated = await this.update(playerId, updates);
        
        // Emit level up event if applicable
        if (levelUp) {
            this.notifyChange('levelUp', { 
                playerId: playerId, 
                newLevel: newLevel, 
                oldLevel: player.level 
            });
        }
        
        return updated;
    }

    /**
     * Calculate level from experience
     */
    calculateLevel(experience) {
        // XP formula: floor(100 × 2 × 1.12^(level-1))
        let level = 1;
        let requiredExp = 0;
        
        while (requiredExp <= experience && level < 100) {
            level++;
            requiredExp = Math.floor(100 * 2 * Math.pow(1.12, level - 1));
        }
        
        return Math.min(level - 1, 100);
    }

    /**
     * Apply permission filtering for player data
     */
    hasPermissionToView(record, permissions) {
        // Admin can see everything
        if (permissions.includes('admin') || permissions.includes('player_data')) {
            return true;
        }
        
        // Public can only see basic info for active players
        if (permissions.includes('public')) {
            return record.isActive && this.isPublicPlayerData(record);
        }
        
        return false;
    }

    /**
     * Check if player data should be publicly visible
     */
    isPublicPlayerData(record) {
        // Only show basic public information
        return true;
    }

    /**
     * Select fields based on permissions
     */
    selectFields(record, fields, permissions = ['public']) {
        const publicFields = ['id', 'username', 'level', 'nationId', 'isActive', 'lastLogin'];
        const privateFields = ['email', 'passwordHash', 'preferences', 'achievements'];
        
        if (permissions.includes('admin') || permissions.includes('player_data')) {
            return super.selectFields(record, fields);
        }
        
        // Filter out private fields for non-admin users
        const allowedFields = fields.filter(field => 
            publicFields.includes(field) && !privateFields.includes(field)
        );
        
        return super.selectFields(record, allowedFields);
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }

    /**
     * Get default player preferences
     */
    getDefaultPreferences() {
        return {
            theme: 'dark',
            notifications: true,
            soundEnabled: true,
            autoSave: true,
            language: 'en'
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerDatabase };
}