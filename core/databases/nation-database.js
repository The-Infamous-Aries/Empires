/**
 * Nation Database - Handles all nation data and statistics
 * Source of truth: entities/Nation.js (serialize/deserialize)
 * Persisted to: saves/db/nations.json
 */

const BaseDatabase = require('./base-database');

class NationDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            playerId: { type: 'string', required: true, indexed: true },
            name: { type: 'string', required: true, indexed: true },
            leader: { type: 'string', required: true },
            government: { type: 'string', indexed: true },
            religion: { type: 'string', indexed: true },
            factionKey: { type: 'string', indexed: true },
            factionColor: { type: 'string' },
            nationalFood: { type: 'string' },
            nationalWater: { type: 'string' },
            capitalCity: { type: 'string' },
            motto: { type: 'string' },
            flag: { type: 'object' },
            founded: { type: 'number', indexed: true },
            foundedDay: { type: 'number' },

            // Core stats
            land: { type: 'number', default: 1000 },
            infra: { type: 'number', default: 100 },
            tech: { type: 'number', default: 0 },
            sharedTechnology: { type: 'number', default: 0 },
            mapBlocks: { type: 'number', default: 10 },
            population: { type: 'number', default: 0, indexed: true },
            happiness: { type: 'number', default: 50 },
            stability: { type: 'number', default: 100 },
            reputation: { type: 'number', default: 50 },

            // Economy
            money: { type: 'number', default: 10000000 },
            taxRate: { type: 'number', default: 2.5 },
            taxableIncome: { type: 'number', default: 0 },
            taxRevenue: { type: 'number', default: 0 },
            totalTaxEarned: { type: 'number', default: 0 },
            budget: { type: 'object', default: { income: 0, expenses: 0, balance: 0 } },
            debt: { type: 'number', default: 0 },
            gdp: { type: 'number', default: 0, indexed: true },

            // Stacked taxes & bills
            stackedTaxes: { type: 'number', default: 0 },
            stackedTaxesTurns: { type: 'number', default: 0 },
            lastTaxInterestRate: { type: 'number', default: 0 },
            stackedBills: { type: 'number', default: 0 },
            stackedBillsTurns: { type: 'number', default: 0 },
            lastBillInterestRate: { type: 'number', default: 0 },

            // Edicts
            edictUnlocked: { type: 'object', default: {} },
            edicts: { type: 'object', default: null },
            edictChangeDates: { type: 'object', default: null },
            edictFreePassUsed: { type: 'boolean', default: false },
            edictEffects: { type: 'object', default: null },
            edictSynergies: { type: 'array', default: [] },
            discoveredSynergies: { type: 'array', default: [] },
            synergyDays: { type: 'object', default: {} },

            // Improvements
            improvements: { type: 'object', default: {} },
            improvementEffects: { type: 'object', default: {} },
            diplomaticRelations: { type: 'object', default: {} },
            domesticPolicies: { type: 'object', default: {} },
            policyEffects: { type: 'object', default: {} },
            buildingUpkeep: { type: 'object', default: { improvements: 0, projects: 0, wonders: 0 } },

            // Projects
            projects: { type: 'object', default: {} },
            projectEffects: { type: 'object', default: {} },

            // Military
            military: { type: 'object', default: {} },
            baseAttack: { type: 'number', default: 50 },
            baseDefense: { type: 'number', default: 50 },
            militaryStrength: { type: 'number', default: 50 },
            militaryUnits: { type: 'object', default: { soldiers: 0, tanks: 0, aircraft: 0, ships: 0, spies: 0, missiles: 0, nukes: 0 } },
            militaryBudget: { type: 'number', default: 0 },
            militaryMaintenanceDeficit: { type: 'boolean', default: false },
            wars: { type: 'array', default: [] },
            alliances: { type: 'array', default: [] },
            totalArea: { type: 'number', default: 1000 },

            // Research
            researchPoints: { type: 'number', default: 0 },
            technologies: { type: 'array', default: [] },
            currentResearch: { type: 'string' },
            researchProgress: { type: 'number', default: 0 },

            // Map / territory
            territories: { type: 'array', default: [] },
            cities: { type: 'array', default: [] },

            // Diplomacy
            relations: { type: 'object', default: {} },
            treaties: { type: 'array', default: [] },
            tradeAgreements: { type: 'array', default: [] },
            allianceId: { type: 'string', indexed: true },
            allianceRole: { type: 'string' },

            // Government / religion
            governmentType: { type: 'object', default: {} },
            policies: { type: 'object', default: { economic: 'Mixed', military: 'Defensive', social: 'Moderate', environmental: 'Balanced', foreign: 'Neutral' } },
            demandTimer: { type: 'object', default: {} },

            // Statistics
            statistics: { type: 'object', default: {} },
            eventHistory: { type: 'array', default: [] },
            achievements: { type: 'array', default: [] },

            // Sports teams & wonder effects
            sportsTeams: { type: 'object', default: {} },
            wonderEffects: { type: 'object', default: {} },

            // Nation stats
            nationStats: { type: 'object', default: {
                happiness: 50, pollution: 0, disease: 10, crime: 15, literacy: 0,
                environment: 50, happinessModifier: 1.0, populationEfficiency: 1.0,
                militaryMorale: 1.0, taxEfficiency: 1.0
            } },

            // Metadata
            lastActive: { type: 'number', indexed: true },
            isActive: { type: 'boolean', default: true, indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('nations', schema);
    }

    /**
     * Create a new nation record from entity data
     */
    async createNation(nationData) {
        const id = nationData.id || this.generateNationId();

        const nation = {
            id,
            playerId: nationData.playerId || null,
            name: nationData.name || 'New Nation',
            leader: nationData.leader || 'Player',
            government: nationData.government || 'liberalDemocracy',
            religion: nationData.religion || 'monotheism',
            factionKey: nationData.factionKey || null,
            factionColor: nationData.factionColor || null,
            nationalFood: nationData.nationalFood || null,
            nationalWater: nationData.nationalWater || null,
            capitalCity: nationData.capitalCity || 'Capital City',
            motto: nationData.motto || 'Unity, Progress, Prosperity',
            flag: nationData.flag || null,
            founded: nationData.founded || Date.now(),
            foundedDay: nationData.foundedDay || 0,

            land: nationData.land !== undefined ? nationData.land : 1000,
            infra: nationData.infra !== undefined ? nationData.infra : 100,
            tech: nationData.tech !== undefined ? nationData.tech : 0,
            sharedTechnology: nationData.sharedTechnology !== undefined ? nationData.sharedTechnology : 0,
            mapBlocks: nationData.mapBlocks !== undefined ? nationData.mapBlocks : 10,
            population: nationData.population !== undefined ? nationData.population : 0,
            happiness: nationData.happiness !== undefined ? nationData.happiness : 50,
            stability: nationData.stability !== undefined ? nationData.stability : 100,
            reputation: nationData.reputation !== undefined ? nationData.reputation : 50,

            money: nationData.money !== undefined ? nationData.money : 10000000,
            taxRate: nationData.taxRate !== undefined ? nationData.taxRate : 2.5,
            taxableIncome: nationData.taxableIncome !== undefined ? nationData.taxableIncome : 0,
            taxRevenue: nationData.taxRevenue !== undefined ? nationData.taxRevenue : 0,
            totalTaxEarned: nationData.totalTaxEarned !== undefined ? nationData.totalTaxEarned : 0,
            budget: nationData.budget || { income: 0, expenses: 0, balance: 0 },
            debt: nationData.debt !== undefined ? nationData.debt : 0,
            gdp: nationData.gdp !== undefined ? nationData.gdp : 0,

            stackedTaxes: nationData.stackedTaxes !== undefined ? nationData.stackedTaxes : 0,
            stackedTaxesTurns: nationData.stackedTaxesTurns !== undefined ? nationData.stackedTaxesTurns : 0,
            lastTaxInterestRate: nationData.lastTaxInterestRate !== undefined ? nationData.lastTaxInterestRate : 0,
            stackedBills: nationData.stackedBills !== undefined ? nationData.stackedBills : 0,
            stackedBillsTurns: nationData.stackedBillsTurns !== undefined ? nationData.stackedBillsTurns : 0,
            lastBillInterestRate: nationData.lastBillInterestRate !== undefined ? nationData.lastBillInterestRate : 0,

            edictUnlocked: nationData.edictUnlocked || {},
            edicts: nationData.edicts || null,
            edictChangeDates: nationData.edictChangeDates || null,
            edictFreePassUsed: nationData.edictFreePassUsed !== undefined ? nationData.edictFreePassUsed : false,
            edictEffects: nationData.edictEffects || null,
            edictSynergies: nationData.edictSynergies || [],
            discoveredSynergies: nationData.discoveredSynergies || [],
            synergyDays: nationData.synergyDays || {},

            improvements: nationData.improvements || {},
            improvementEffects: nationData.improvementEffects || {},
            diplomaticRelations: nationData.diplomaticRelations || {},
            domesticPolicies: nationData.domesticPolicies || {},
            policyEffects: nationData.policyEffects || {},
            buildingUpkeep: nationData.buildingUpkeep || { improvements: 0, projects: 0, wonders: 0 },

            projects: nationData.projects || {},
            projectEffects: nationData.projectEffects || {},

            military: nationData.military || {},
            baseAttack: nationData.baseAttack !== undefined ? nationData.baseAttack : 50,
            baseDefense: nationData.baseDefense !== undefined ? nationData.baseDefense : 50,
            militaryStrength: nationData.militaryStrength !== undefined ? nationData.militaryStrength : 50,
            militaryUnits: nationData.militaryUnits || { soldiers: 0, tanks: 0, aircraft: 0, ships: 0, spies: 0, missiles: 0, nukes: 0 },
            militaryBudget: nationData.militaryBudget !== undefined ? nationData.militaryBudget : 0,
            militaryMaintenanceDeficit: nationData.militaryMaintenanceDeficit !== undefined ? nationData.militaryMaintenanceDeficit : false,
            wars: nationData.wars || [],
            alliances: nationData.alliances || [],
            totalArea: nationData.totalArea !== undefined ? nationData.totalArea : 1000,

            researchPoints: nationData.researchPoints !== undefined ? nationData.researchPoints : 0,
            technologies: nationData.technologies || [],
            currentResearch: nationData.currentResearch || null,
            researchProgress: nationData.researchProgress !== undefined ? nationData.researchProgress : 0,

            territories: nationData.territories || [],
            cities: nationData.cities || [],

            relations: nationData.relations || {},
            treaties: nationData.treaties || [],
            tradeAgreements: nationData.tradeAgreements || [],
            allianceId: nationData.allianceId || null,
            allianceRole: nationData.allianceRole || null,

            governmentType: nationData.governmentType || {},
            policies: nationData.policies || { economic: 'Mixed', military: 'Defensive', social: 'Moderate', environmental: 'Balanced', foreign: 'Neutral' },
            demandTimer: nationData.demandTimer || {},

            statistics: nationData.statistics || {},
            eventHistory: nationData.eventHistory || [],
            achievements: nationData.achievements || [],

            sportsTeams: nationData.sportsTeams || {},
            wonderEffects: nationData.wonderEffects || {},

            nationStats: nationData.nationStats || {
                happiness: 50, pollution: 0, disease: 10, crime: 15, literacy: 0,
                environment: 50, happinessModifier: 1.0, populationEfficiency: 1.0,
                militaryMorale: 1.0, taxEfficiency: 1.0
            },

            lastActive: Date.now(),
            isActive: true,
            version: 1
        };

        return await this.insert(id, nation);
    }

    /**
     * Update nation from serialized entity state (full sync)
     */
    async syncFromEntity(nationEntity) {
        const serialized = nationEntity.serialize ? nationEntity.serialize() : nationEntity;
        const id = nationEntity.id || serialized.id;
        if (!id) throw new Error('Nation has no id');
        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, serialized);
        } else {
            return await this.insert(id, serialized);
        }
    }

    /**
     * Find nations by alliance
     */
    async findByAlliance(allianceId, permissions = ['public']) {
        return this.findByIndex('allianceId', allianceId, permissions);
    }

    /**
     * Find nations by player
     */
    async findByPlayer(playerId, permissions = ['public']) {
        return this.findByIndex('playerId', playerId, permissions);
    }

    /**
     * Get top nations by metric
     */
    async getTopNations(metric = 'gdp', limit = 50, permissions = ['public']) {
        const nations = await this.query([], { isActive: true }, permissions);
        return nations
            .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
            .slice(0, limit);
    }

    /**
     * Search nations by name
     */
    async searchNations(namePattern, permissions = ['public']) {
        const nations = await this.query([], { isActive: true }, permissions);
        const regex = new RegExp(namePattern, 'i');
        return nations.filter(n => regex.test(n.name));
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return record.isActive !== false;
        return false;
    }

    generateNationId() {
        return 'nation_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NationDatabase };
}
