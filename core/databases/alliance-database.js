/**
 * Alliance Database - Handles all alliance data and statistics
 * Source of truth: entities/Alliance.js (serialize/deserialize)
 * Persisted to: saves/db/alliances.json
 *
 * NOTE: Alliance.js serializes Map fields as Array.from(...entries())
 * (arrays of [key, value] pairs). This database stores them as plain objects
 * for queryability, converting on write/read.
 */

const BaseDatabase = require('./base-database');

// ─── Helpers to convert between Map and plain object ──────────────────────

function mapToObj(map) {
    if (!map || !(map instanceof Map)) return map;
    const obj = {};
    for (const [k, v] of map) obj[k] = v;
    return obj;
}

function objToMap(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return new Map(Object.entries(obj));
}

function serializeSerializedMapFields(data) {
    // Alliance.js.serialize() produces Arrays of [k,v] pairs for Map fields.
    // Convert them to plain objects for storage/queryability.
    if (!data) return data;

    // Government Maps
    if (data.government) {
        if (Array.isArray(data.government.roles)) {
            data.government.roles = mapToObj(new Map(data.government.roles));
        }
        if (Array.isArray(data.government.currentLeaders)) {
            data.government.currentLeaders = mapToObj(new Map(data.government.currentLeaders));
        }
    }

    // Members (Array of [nationId, memberData])
    if (Array.isArray(data.members)) {
        data.members = mapToObj(new Map(data.members));
    }

    // Invitations (Array of [inviteId, inviteData])
    if (Array.isArray(data.invitations)) {
        data.invitations = mapToObj(new Map(data.invitations));
    }

    // Relations (Array of [allianceId, relationData])
    if (Array.isArray(data.relations)) {
        data.relations = mapToObj(new Map(data.relations));
    }

    // WarParticipation (Array of [warId, participationData])
    if (Array.isArray(data.warParticipation)) {
        data.warParticipation = mapToObj(new Map(data.warParticipation));
    }

    // MilitaryCoordination sharedIntelligence (Array or Map)
    if (data.militaryCoordination) {
        if (Array.isArray(data.militaryCoordination.sharedIntelligence)) {
            data.militaryCoordination.sharedIntelligence = mapToObj(
                new Map(data.militaryCoordination.sharedIntelligence)
            );
        }
    }

    // SharedResources contributions & allocations (Arrays of [memberId, data])
    if (data.sharedResources) {
        if (Array.isArray(data.sharedResources.contributions)) {
            data.sharedResources.contributions = mapToObj(
                new Map(data.sharedResources.contributions)
            );
        }
        if (Array.isArray(data.sharedResources.allocations)) {
            data.sharedResources.allocations = mapToObj(
                new Map(data.sharedResources.allocations)
            );
        }
    }

    return data;
}

function deserializeMapFields(data) {
    // Convert plain objects back to Maps for in-memory use.
    if (!data) return data;

    if (data.government) {
        if (data.government.roles && !Array.isArray(data.government.roles)) {
            data.government.roles = objToMap(data.government.roles);
        }
        if (data.government.currentLeaders && !Array.isArray(data.government.currentLeaders)) {
            data.government.currentLeaders = objToMap(data.government.currentLeaders);
        }
    }

    if (data.members && !Array.isArray(data.members)) {
        data.members = objToMap(data.members);
    }

    if (data.invitations && !Array.isArray(data.invitations)) {
        data.invitations = objToMap(data.invitations);
    }

    if (data.relations && !Array.isArray(data.relations)) {
        data.relations = objToMap(data.relations);
    }

    if (data.warParticipation && !Array.isArray(data.warParticipation)) {
        data.warParticipation = objToMap(data.warParticipation);
    }

    if (data.militaryCoordination) {
        if (data.militaryCoordination.sharedIntelligence && !Array.isArray(data.militaryCoordination.sharedIntelligence)) {
            data.militaryCoordination.sharedIntelligence = objToMap(
                data.militaryCoordination.sharedIntelligence
            );
        }
    }

    if (data.sharedResources) {
        if (data.sharedResources.contributions && !Array.isArray(data.sharedResources.contributions)) {
            data.sharedResources.contributions = objToMap(data.sharedResources.contributions);
        }
        if (data.sharedResources.allocations && !Array.isArray(data.sharedResources.allocations)) {
            data.sharedResources.allocations = objToMap(data.sharedResources.allocations);
        }
    }

    return data;
}

class AllianceDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            name: { type: 'string', required: true, indexed: true },
            acronym: { type: 'string', indexed: true },
            description: { type: 'string' },
            founded: { type: 'number' },
            foundedDay: { type: 'number' },
            color: { type: 'string', default: '#ffffff' },
            colorChangedAt: { type: 'number', default: 0 },
            governmentChangedAt: { type: 'number', default: 0 },

            governmentType: { type: 'string', indexed: true },
            government: { type: 'object', default: {} },
            members: { type: 'object', default: {} },
            memberHistory: { type: 'array', default: [] },
            memberLimit: { type: 'number', default: 6 },
            invitations: { type: 'object', default: {} },

            level: { type: 'number', default: 1 },
            experience: { type: 'number', default: 0 },
            totalExperience: { type: 'number', default: 0 },
            experienceToNext: { type: 'number', default: 1000 },
            skillPoints: { type: 'number', default: 0 },
            skills: { type: 'object', default: {} },

            customization: { type: 'object', default: {} },
            treaties: { type: 'array', default: [] },
            relations: { type: 'object', default: {} },
            diplomaticStance: { type: 'string', default: 'neutral' },

            warParticipation: { type: 'object', default: {} },
            militaryCoordination: { type: 'object', default: {} },
            sharedResources: { type: 'object', default: {} },

            statistics: { type: 'object', default: {} },

            isActive: { type: 'boolean', default: true, indexed: true },
            lastActive: { type: 'number', indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('alliances', schema);
    }

    // ─── Create ──────────────────────────────────────────────────────────

    async createAlliance(allianceData) {
        const id = allianceData.id || this.generateAllianceId();

        const alliance = {
            id,
            name: allianceData.name || 'New Alliance',
            acronym: allianceData.acronym || '',
            description: allianceData.description || '',
            founded: allianceData.founded || Date.now(),
            foundedDay: allianceData.foundedDay || 0,
            color: allianceData.color || '#ffffff',
            colorChangedAt: allianceData.colorChangedAt || 0,
            governmentChangedAt: allianceData.governmentChangedAt || 0,

            governmentType: allianceData.governmentType || 'democratic',
            government: allianceData.government || {
                structure: null, roles: {}, customRoles: [], founder: allianceData.founderId || null, currentLeaders: {}
            },
            members: allianceData.members || {},
            memberHistory: allianceData.memberHistory || [],
            memberLimit: allianceData.memberLimit || 6,
            invitations: allianceData.invitations || {},

            level: allianceData.level || 1,
            experience: allianceData.experience || 0,
            totalExperience: allianceData.totalExperience || 0,
            experienceToNext: allianceData.experienceToNext || 1000,
            skillPoints: allianceData.skillPoints || 0,
            skills: allianceData.skills || {},

            customization: allianceData.customization || {
                banner: { url: null, enabled: false },
                flag: { design: null, colors: [], enabled: false },
                nameStyle: { font: 'default', color: '#ffffff', outlineColor: '#000000', enabled: false },
                memberLevelsStyle: { font: 'default', color: '#cccccc', enabled: false },
                emblem: { design: null, enabled: false },
                theme: { palette: 'default', enabled: false }
            },
            treaties: allianceData.treaties || [],
            relations: allianceData.relations || {},
            diplomaticStance: allianceData.diplomaticStance || 'neutral',

            warParticipation: allianceData.warParticipation || {},
            militaryCoordination: allianceData.militaryCoordination || {
                joinedWars: [], sharedIntelligence: {}, coordinatedStrikes: []
            },
            sharedResources: allianceData.sharedResources || {
                pool: {}, contributions: {}, allocations: {}
            },

            statistics: allianceData.statistics || {
                warsWon: 0, warsLost: 0, treatiesSigned: 0, territoryGained: 0,
                totalDamageDealt: 0, membersRecruited: 0, projectsCompleted: 0
            },

            isActive: true,
            lastActive: Date.now(),
            version: 1
        };

        return await this.insert(id, alliance);
    }

    // ─── Sync from entity (handles Map→Object conversion) ────────────────

    async syncFromEntity(allianceEntity) {
        const serialized = allianceEntity.serialize ? allianceEntity.serialize() : allianceEntity;
        const converted = serializeSerializedMapFields({ ...serialized });
        return await this.update(serialized.id, converted);
    }

    // ─── Insert/Update overrides (ensure Map fields are stored as objects) ─

    async insert(id, record) {
        const converted = serializeSerializedMapFields({ ...record });
        return super.insert(id, converted);
    }

    async update(id, updates) {
        const converted = serializeSerializedMapFields({ ...updates });
        return super.update(id, converted);
    }

    // ─── Member management ───────────────────────────────────────────────

    async addMember(allianceId, nationId, memberData = {}) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const members = { ...alliance.members };
        members[nationId] = {
            nationId, joinDate: Date.now(), memberType: memberData.memberType || 'member',
            role: memberData.role || 'member', contributions: { xp: 0, wars: 0, diplomacy: 0 },
            permissions: memberData.permissions || ['basic']
        };

        const memberHistory = [...alliance.memberHistory, {
            action: 'joined', nationId, date: Date.now(), memberType: memberData.memberType || 'member'
        }];

        return await this.update(allianceId, { members, memberHistory });
    }

    async removeMember(allianceId, nationId) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const members = { ...alliance.members };
        delete members[nationId];

        const memberHistory = [...alliance.memberHistory, {
            action: 'left', nationId, date: Date.now()
        }];

        return await this.update(allianceId, { members, memberHistory });
    }

    // ─── Query helpers ───────────────────────────────────────────────────

    async findByMember(nationId, permissions = ['public']) {
        const alliances = await this.query([], { isActive: true }, permissions);
        return alliances.filter(a => a.members && a.members[nationId]);
    }

    async getTopAlliances(metric = 'experience', limit = 50, permissions = ['public']) {
        const alliances = await this.query([], { isActive: true }, permissions);
        return alliances
            .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
            .slice(0, limit);
    }

    async findByFounder(founderId, permissions = ['public']) {
        const alliances = await this.query([], { isActive: true }, permissions);
        return alliances.filter(a => a.government && a.government.founder === founderId);
    }

    // ─── War & military ─────────────────────────────────────────────────

    async setWarParticipation(allianceId, warId, participationData) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const warParticipation = { ...alliance.warParticipation };
        warParticipation[warId] = participationData;

        return await this.update(allianceId, { warParticipation });
    }

    async addCoordinatedStrike(allianceId, strikeData) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const strikes = [...(alliance.militaryCoordination.coordinatedStrikes || []), strikeData];
        return await this.update(allianceId, {
            militaryCoordination: { ...alliance.militaryCoordination, coordinatedStrikes: strikes }
        });
    }

    // ─── Economy / shared resources ──────────────────────────────────────

    async addResourceContribution(allianceId, memberId, resources) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const contributions = { ...alliance.sharedResources.contributions };
        const existing = contributions[memberId] || {};
        contributions[memberId] = { ...existing, ...resources };

        return await this.update(allianceId, {
            sharedResources: { ...alliance.sharedResources, contributions }
        });
    }

    async addResourceAllocation(allianceId, memberId, resources) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const allocations = { ...alliance.sharedResources.allocations };
        const existing = allocations[memberId] || {};
        allocations[memberId] = { ...existing, ...resources };

        return await this.update(allianceId, {
            sharedResources: { ...alliance.sharedResources, allocations }
        });
    }

    // ─── Diplomacy ───────────────────────────────────────────────────────

    async addTreaty(allianceId, treatyId) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const treaties = [...(alliance.treaties || []), treatyId];
        return await this.update(allianceId, { treaties });
    }

    async removeTreaty(allianceId, treatyId) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const treaties = (alliance.treaties || []).filter(t => t !== treatyId);
        return await this.update(allianceId, { treaties });
    }

    async setRelation(allianceId, targetAllianceId, relationData) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const relations = { ...alliance.relations };
        relations[targetAllianceId] = relationData;

        return await this.update(allianceId, { relations });
    }

    async setDiplomaticStance(allianceId, stance) {
        return await this.update(allianceId, { diplomaticStance: stance });
    }

    // ─── Customization ───────────────────────────────────────────────────

    async updateCustomization(allianceId, customizationUpdates) {
        const alliance = this.findById(allianceId, ['admin']);
        if (!alliance) throw new Error('Alliance not found');

        const customization = { ...alliance.customization, ...customizationUpdates };
        return await this.update(allianceId, { customization });
    }

    // ─── Permissions ─────────────────────────────────────────────────────

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return record.isActive !== false;
        return false;
    }

    // ─── ID Generation ───────────────────────────────────────────────────

    generateAllianceId() {
        return 'alliance_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AllianceDatabase, mapToObj, objToMap, serializeSerializedMapFields, deserializeMapFields };
}
