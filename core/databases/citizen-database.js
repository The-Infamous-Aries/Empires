/**
 * Citizen Database - Handles individual citizen records with names, family ties, jobs
 * Source of truth: entities/Citizen.js (serialize/deserialize)
 * Persisted to: saves/db/citizens.json
 */

const { BaseDatabase } = require('./base-database');

class CitizenDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            nationId: { type: 'string', required: true, indexed: true },
            cityId: { type: 'string' },
            name: { type: 'string', required: true },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            familyName: { type: 'string' },
            age: { type: 'number' },
            ageGroup: { type: 'string' },
            gender: { type: 'string' },
            sexualOrientation: { type: 'string' },
            occupation: { type: 'string' },
            education: { type: 'string' },
            literacyScore: { type: 'number' },
            isGifted: { type: 'boolean' },
            health: { type: 'number' },
            happiness: { type: 'number' },
            income: { type: 'number' },
            wealth: { type: 'number' },
            jobSkill: { type: 'number' },
            productivity: { type: 'number' },
            taxesPaid: { type: 'number' },
            socialClass: { type: 'string' },
            loyalty: { type: 'number' },
            ethnicity: { type: 'string' },
            religion: { type: 'string' },
            language: { type: 'string' },
            isAlive: { type: 'boolean' },
            isEmployed: { type: 'boolean' },
            isMilitary: { type: 'boolean' },
            isRetired: { type: 'boolean' },
            relationshipStatus: { type: 'string' },
            spouseIds: { type: 'array' },
            partnerIds: { type: 'array' },
            parentIds: { type: 'array' },
            childIds: { type: 'array' },
            born: { type: 'number' },
            birthTime: { type: 'number' },
            lifeEvents: { type: 'array' },
            achievements: { type: 'array' },
            relationships: { type: 'array' },
            version: { type: 'number', default: 1 }
        };

        super('citizens', schema);
    }

    /**
     * Save a single citizen record
     */
    async saveCitizen(citizenData) {
        const id = citizenData.id || this.generateCitizenId();
        const record = {
            id,
            nationId: citizenData.nationId || null,
            cityId: citizenData.cityId || null,
            name: citizenData.name || 'Unnamed Citizen',
            firstName: citizenData.firstName || null,
            lastName: citizenData.lastName || null,
            familyName: citizenData.familyName || null,
            age: citizenData.age !== undefined ? citizenData.age : 0,
            ageGroup: citizenData.ageGroup || null,
            gender: citizenData.gender || 'male',
            sexualOrientation: citizenData.sexualOrientation || 'straight',
            occupation: citizenData.occupation || 'unemployed',
            education: citizenData.education || 'none',
            literacyScore: citizenData.literacyScore !== undefined ? citizenData.literacyScore : 0,
            isGifted: citizenData.isGifted || false,
            health: citizenData.health !== undefined ? citizenData.health : 100,
            happiness: citizenData.happiness !== undefined ? citizenData.happiness : 50,
            income: citizenData.income !== undefined ? citizenData.income : 0,
            wealth: citizenData.wealth !== undefined ? citizenData.wealth : 0,
            jobSkill: citizenData.jobSkill !== undefined ? citizenData.jobSkill : 0,
            productivity: citizenData.productivity !== undefined ? citizenData.productivity : 1.0,
            taxesPaid: citizenData.taxesPaid !== undefined ? citizenData.taxesPaid : 0,
            socialClass: citizenData.socialClass || 'commoner',
            loyalty: citizenData.loyalty !== undefined ? citizenData.loyalty : 50,
            ethnicity: citizenData.ethnicity || null,
            religion: citizenData.religion || 'none',
            language: citizenData.language || 'common',
            isAlive: citizenData.isAlive !== undefined ? citizenData.isAlive : true,
            isEmployed: citizenData.isEmployed || false,
            isMilitary: citizenData.isMilitary || false,
            isRetired: citizenData.isRetired || false,
            relationshipStatus: citizenData.relationshipStatus || 'single',
            spouseIds: Array.isArray(citizenData.spouseIds) ? [...citizenData.spouseIds] : [],
            partnerIds: Array.isArray(citizenData.partnerIds) ? [...citizenData.partnerIds] : [],
            parentIds: Array.isArray(citizenData.parentIds) ? [...citizenData.parentIds] : [],
            childIds: Array.isArray(citizenData.childIds) ? [...citizenData.childIds] : [],
            born: citizenData.born || Date.now(),
            birthTime: citizenData.birthTime || Date.now(),
            lifeEvents: Array.isArray(citizenData.lifeEvents) ? [...citizenData.lifeEvents] : [],
            achievements: Array.isArray(citizenData.achievements) ? [...citizenData.achievements] : [],
            relationships: Array.isArray(citizenData.relationships)
                ? citizenData.relationships.map(r => [r[0], r[1]])
                : [],
            version: 1
        };
        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, record);
        } else {
            return await this.insert(id, record);
        }
    }

    /**
     * Save all citizens for a nation (bulk replace)
     */
    async saveNationCitizens(nationId, citizens) {
        if (!Array.isArray(citizens)) throw new Error('citizens must be an array');
        const results = [];
        for (const c of citizens) {
            c.nationId = nationId;
            results.push(await this.saveCitizen(c));
        }
        return results;
    }

    /**
     * Get all citizens for a nation
     */
    async getCitizensByNation(nationId, permissions = ['public']) {
        return this.findByIndex('nationId', nationId, permissions);
    }

    /**
     * Delete all citizens for a nation
     */
    async deleteNationCitizens(nationId) {
        const citizens = await this.findByIndex('nationId', nationId, ['admin']);
        const results = [];
        for (const c of citizens) {
            results.push(await this.delete(c.id));
        }
        return results;
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return record.isAlive !== false;
        return false;
    }

    generateCitizenId() {
        return 'citizen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CitizenDatabase };
}
