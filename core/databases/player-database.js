/**
 * Player Database - Handles all player account and progression data
 * Source of truth: entities/Player.js (serialize/deserialize)
 * Persisted to: saves/db/players.json
 */

const { BaseDatabase } = require('./base-database');

class PlayerDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            playerId: { type: 'string', required: true, indexed: true },
            username: { type: 'string', required: true, indexed: true },
            email: { type: 'string', required: true, indexed: true },
            joinDate: { type: 'number' },
            lastActive: { type: 'number', indexed: true },

            factionKey: { type: 'string', indexed: true },
            factionColor: { type: 'string' },
            factionJoinDate: { type: 'number' },
            factionRank: { type: 'string' },

            level: { type: 'number', default: 1, indexed: true },
            experience: { type: 'number', default: 0 },
            totalExperience: { type: 'number', default: 0 },
            legendaryLevel: { type: 'number', default: 1 },
            totalLegendaryLevels: { type: 'number', default: 0 },
            canGoLegendary: { type: 'boolean', default: false },

            unallocatedSkillPoints: { type: 'number', default: 0 },
            unallocatedLegendarySkillPoints: { type: 'number', default: 0 },

            skills: { type: 'object', default: {} },

            statistics: { type: 'object', default: {} },
            achievements: { type: 'array', default: [] },
            titles: { type: 'array', default: [] },
            currentTitle: { type: 'string' },

            settings: { type: 'object', default: {} },
            activeEffects: { type: 'object', default: {} },

            currentEnergy: { type: 'number', default: 100 },
            currentIntuition: { type: 'number', default: 100 },

            nationId: { type: 'string', indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('players', schema);
    }

    async createPlayer(playerData) {
        const id = playerData.playerId || this.generatePlayerId();

        const player = {
            id,
            playerId: id,
            username: playerData.username || 'Player',
            email: playerData.email || '',
            joinDate: playerData.joinDate || Date.now(),
            lastActive: Date.now(),

            factionKey: playerData.factionKey || null,
            factionColor: playerData.factionColor || null,
            factionJoinDate: playerData.factionJoinDate || null,
            factionRank: playerData.factionRank || 'Member',

            level: playerData.level !== undefined ? playerData.level : 1,
            experience: playerData.experience !== undefined ? playerData.experience : 0,
            totalExperience: playerData.totalExperience !== undefined ? playerData.totalExperience : 0,
            legendaryLevel: playerData.legendaryLevel !== undefined ? playerData.legendaryLevel : 1,
            totalLegendaryLevels: playerData.totalLegendaryLevels !== undefined ? playerData.totalLegendaryLevels : 0,
            canGoLegendary: playerData.canGoLegendary !== undefined ? playerData.canGoLegendary : false,

            unallocatedSkillPoints: playerData.unallocatedSkillPoints !== undefined ? playerData.unallocatedSkillPoints : 0,
            unallocatedLegendarySkillPoints: playerData.unallocatedLegendarySkillPoints !== undefined ? playerData.unallocatedLegendarySkillPoints : 0,

            skills: playerData.skills || {},

            statistics: playerData.statistics || {
                playTime: 0, loginsCount: 0, nationsCreated: 0, battlesWon: 0,
                battlesLost: 0, alliancesFormed: 0,
                territoriesClaimed: 0, buildingsConstructed: 0, researchCompleted: 0,
                treatiesSigned: 0, spyMissions: 0
            },
            achievements: playerData.achievements || [],
            titles: playerData.titles || [],
            currentTitle: playerData.currentTitle || null,

            settings: playerData.settings || {
                notifications: { battles: true, diplomacy: true, research: true, general: true },
                ui: { theme: 'default', mapZoom: 1.0, showTutorial: true,
                      textSize: 'normal', nameFont: 'system',
                      nameColor: '#e9ecec', nameColorAccent: '#a8a8a8',
                      musicEnabled: true, musicVolume: 0.35 },
                privacy: { showOnline: true, allowMessages: true, showStatistics: true },
                customImages: { flagImage: null,
                                militaryUnits: { soldier: null, tank: null, aircraft: null, ships: null, spies: null, missiles: null, nukes: null },
                                nationalFood: { type: 'pizza', text: '' },
                                nationalWater: { type: 'water', text: '' },
                                nationalPet: { type: 'none', text: '' } }
            },
            activeEffects: playerData.activeEffects || {},

            currentEnergy: playerData.currentEnergy !== undefined ? playerData.currentEnergy : 100,
            currentIntuition: playerData.currentIntuition !== undefined ? playerData.currentIntuition : 100,

            nationId: playerData.nationId || null,
            isActive: true,
            version: 1
        };

        return await this.insert(id, player);
    }

    async syncFromEntity(playerEntity) {
        const serialized = playerEntity.serialize ? playerEntity.serialize() : playerEntity;
        const id = playerEntity.playerId || serialized.playerId;
        if (!id) throw new Error('Player has no playerId');
        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, serialized);
        } else {
            return await this.insert(id, serialized);
        }
    }

    async awardExperience(playerId, amount, source = 'unknown') {
        const player = this.findById(playerId, ['admin']);
        if (!player) throw new Error('Player not found');

        const newExp = player.experience + amount;
        const newLevel = this.calculateLevel(newExp);
        const levelUp = newLevel > player.level;

        const updates = { experience: newExp, level: newLevel };
        if (levelUp) {
            updates.unallocatedSkillPoints = (player.unallocatedSkillPoints || 0) + ((newLevel - player.level) * 5);
        }

        const updated = await this.update(playerId, updates);
        if (levelUp) {
            this.notifyChange('levelUp', { playerId, newLevel, oldLevel: player.level });
        }
        return updated;
    }

    calculateLevel(experience) {
        let level = 1;
        let requiredExp = 0;
        while (requiredExp <= experience && level < 100) {
            level++;
            requiredExp = Math.floor(100 * 2 * Math.pow(1.12, level - 1));
        }
        return Math.min(level - 1, 100);
    }

    async findByUsername(username, permissions = ['public']) {
        const players = await this.query([], { username: username, isActive: true }, permissions);
        return players.length > 0 ? players[0] : null;
    }

    async findByPlayerId(playerId, permissions = ['public']) {
        return this.findByIndex('playerId', playerId, permissions);
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('player_data')) return true;
        if (permissions.includes('public')) return record.isActive !== false;
        return false;
    }

    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerDatabase };
}

