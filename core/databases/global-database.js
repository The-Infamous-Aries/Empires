/**
 * Global Database - Handles all global game state (GlobalWorld entity)
 * Source of truth: entities/GlobalWorld.js (serialize/deserialize)
 * Persisted to: saves/db/global.json
 */

const BaseDatabase = require('./base-database');

class GlobalDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            saveVersion: { type: 'number', default: 1 },

            globalAverages: { type: 'object', default: {} },
            previousAverages: { type: 'object', default: {} },
            recentStrikes: { type: 'array', default: [] },
            governmentTally: { type: 'object', default: {} },
            religionTally: { type: 'object', default: {} },
            totalNations: { type: 'number', default: 0 },
            majorityGovernment: { type: 'string' },
            majorityReligion: { type: 'string' },
            suggestedGovernment: { type: 'string' },
            suggestedReligion: { type: 'string' },

            warStats: { type: 'object', default: {} },
            militaryUnitStats: { type: 'object', default: {} },
            currencyStats: { type: 'object', default: {} },
            populationDemographics: { type: 'object', default: {} },
            educationBuildings: { type: 'object', default: {} },
            sportsGlobalStats: { type: 'object', default: {} },
            globalPlayerSkillStandard: { type: 'number', default: 50 },

            specialOfferCooldown: { type: 'object', default: {} },
            specialOffersPending: { type: 'object', default: {} },

            cumulativeNukePollution: { type: 'number', default: 0 },
            cumulativeMissilePollution: { type: 'number', default: 0 },
            diseaseStats: { type: 'object', default: {} },

            config: { type: 'object', default: {} },
            version: { type: 'number', default: 1 }
        };

        super('global', schema);
    }

    async createGlobalState(globalData) {
        const id = globalData.id || 'global_state';

        const state = {
            id,
            saveVersion: globalData.saveVersion || 1,

            globalAverages: globalData.globalAverages || {
                happiness: 50, pollution: 0, disease: 10, crime: 15,
                environment: 50, populationDensity: 0, education: 50, literacyRate: 50
            },
            previousAverages: globalData.previousAverages || {},
            recentStrikes: globalData.recentStrikes || [],
            governmentTally: globalData.governmentTally || {},
            religionTally: globalData.religionTally || {},
            totalNations: globalData.totalNations || 0,
            majorityGovernment: globalData.majorityGovernment || null,
            majorityReligion: globalData.majorityReligion || null,
            suggestedGovernment: globalData.suggestedGovernment || null,
            suggestedReligion: globalData.suggestedReligion || null,

            warStats: globalData.warStats || {
                totalNations: 0, nationsAtWar: 0, nationsAtPeace: 0,
                warPercentage: 0, peacePercentage: 0, activeWarCount: 0, lastCalculatedDay: 0
            },
            militaryUnitStats: globalData.militaryUnitStats || {
                soldiers: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                tanks: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                aircraft: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                ships: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                spies: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                missiles: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 },
                nukes: { avgPerNation: 0, totalWorld: 0, nationsWithUnits: 0 }
            },
            currencyStats: globalData.currencyStats || {
                aurel: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                velt: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                krona: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                drachma: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                sovereign: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                talon: { nationCount: 0, totalBalance: 0, avgBalance: 0, pctOfNations: 0 },
                totalNations: 0
            },
            populationDemographics: globalData.populationDemographics || {
                newborn: { totalCount: 0, pctOfWorld: 0 },
                infant: { totalCount: 0, pctOfWorld: 0 },
                toddler: { totalCount: 0, pctOfWorld: 0 },
                child: { totalCount: 0, pctOfWorld: 0 },
                teen: { totalCount: 0, pctOfWorld: 0 },
                youngAdult: { totalCount: 0, pctOfWorld: 0 },
                adult: { totalCount: 0, pctOfWorld: 0 },
                middleAged: { totalCount: 0, pctOfWorld: 0 },
                older: { totalCount: 0, pctOfWorld: 0 },
                senior: { totalCount: 0, pctOfWorld: 0 },
                elderly: { totalCount: 0, pctOfWorld: 0 },
                totalPopulation: 0
            },
            educationBuildings: globalData.educationBuildings || {},
            sportsGlobalStats: globalData.sportsGlobalStats || {},
            globalPlayerSkillStandard: globalData.globalPlayerSkillStandard !== undefined ? globalData.globalPlayerSkillStandard : 50,
            specialOfferCooldown: globalData.specialOfferCooldown || {},
            specialOffersPending: globalData.specialOffersPending || {},
            cumulativeNukePollution: globalData.cumulativeNukePollution !== undefined ? globalData.cumulativeNukePollution : 0,
            cumulativeMissilePollution: globalData.cumulativeMissilePollution !== undefined ? globalData.cumulativeMissilePollution : 0,
            diseaseStats: globalData.diseaseStats || {
                totalNations: 0, nationsWithMinorDisease: 0, nationsWithMajorDisease: 0,
                pctWithMinorDisease: 0, pctWithMajorDisease: 0,
                totalMinorOutbreaks: 0, totalMajorOutbreaks: 0, lastCalculatedDay: 0
            },
            config: globalData.config || {},
            version: 1
        };

        return await this.insert(id, state);
    }

    async syncFromEntity(globalEntity) {
        const serialized = globalEntity.serialize ? globalEntity.serialize() : globalEntity;
        const id = serialized.id || 'global_state';
        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, serialized);
        } else {
            return await this.insert(id, serialized);
        }
    }

    async updateGlobalAverages(averages) {
        const state = this.findById('global_state', ['admin']);
        if (!state) throw new Error('Global state not found');
        return await this.update('global_state', {
            globalAverages: { ...state.globalAverages, ...averages },
            previousAverages: state.globalAverages
        });
    }

    async addStrike(strikeData) {
        const state = this.findById('global_state', ['admin']);
        if (!state) throw new Error('Global state not found');

        const strikes = [...state.recentStrikes, strikeData];
        // Keep only last 100 strikes
        if (strikes.length > 100) strikes.splice(0, strikes.length - 100);

        return await this.update('global_state', { recentStrikes: strikes });
    }

    async updateTally(type, key, count) {
        const state = this.findById('global_state', ['admin']);
        if (!state) throw new Error('Global state not found');

        const tally = { ...state[type] };
        tally[key] = count;

        return await this.update('global_state', { [type]: tally });
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return true;
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalDatabase };
}
