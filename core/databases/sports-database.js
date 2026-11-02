/**
 * Sports Database - Handles all sports teams, leagues, and stats
 * Source of truth: entities/Team.js + GlobalWorld sportsGlobalStats
 * Persisted to: saves/db/sports.json
 */

const BaseDatabase = require('./base-database');

class SportsDatabase extends BaseDatabase {
    constructor() {
        const schema = {
            id: { type: 'string', required: true, indexed: true },
            nationId: { type: 'string', required: true, indexed: true },
            sport: { type: 'string', required: true, indexed: true },
            teamName: { type: 'string', required: true },
            founded: { type: 'number' },
            leagueId: { type: 'string', indexed: true },

            stadium: { type: 'object', default: {} },
            stadiumCapacity: { type: 'number', default: 0 },
            gymBonus: { type: 'number', default: 0 },
            medicalBonus: { type: 'number', default: 0 },
            youthAcademyBonus: { type: 'number', default: 0 },
            fanExperienceBonus: { type: 'number', default: 0 },
            concessionsBonus: { type: 'number', default: 0 },
            technologyBonus: { type: 'number', default: 0 },

            players: { type: 'object', default: {} },
            roster: { type: 'object', default: {} },
            subs: { type: 'object', default: {} },

            revenue: { type: 'number', default: 0 },
            expenses: { type: 'number', default: 0 },

            stats: { type: 'object', default: {} },
            fans: { type: 'number', default: 0 },
            fanLoyalty: { type: 'number', default: 50 },

            currentSeason: { type: 'number', default: 1 },
            currentWeek: { type: 'number', default: 1 },
            injuries: { type: 'object', default: {} },
            contractExpiryWarnings: { type: 'array', default: [] },

            isActive: { type: 'boolean', default: true, indexed: true },
            version: { type: 'number', default: 1 }
        };

        super('sports', schema);
    }

    async createTeam(teamData) {
        const id = teamData.id || this.generateTeamId();

        const team = {
            id,
            nationId: teamData.nationId,
            sport: teamData.sport,
            teamName: teamData.teamName,
            founded: teamData.founded || Date.now(),
            leagueId: teamData.leagueId || null,

            stadium: teamData.stadium || {
                seating: 0, gym: 0, medicalCenter: 0, youthAcademy: 0,
                fanExperience: 0, concessions: 0, technologyCenter: 0
            },
            stadiumCapacity: 0,
            gymBonus: 0,
            medicalBonus: 0,
            youthAcademyBonus: 0,
            fanExperienceBonus: 0,
            concessionsBonus: 0,
            technologyBonus: 0,

            players: teamData.players || {},
            roster: teamData.roster || {},
            subs: teamData.subs || {},

            revenue: 0,
            expenses: 0,

            stats: teamData.stats || {
                wins: 0, losses: 0, draws: 0, totalInjuries: 0,
                championships: 0, playoffAppearances: 0, tournamentsEntered: 0,
                tournamentsWon: 0, worldTournamentsEntered: 0, worldTournamentsWon: 0,
                interceptions: 0, passes: 0, touchdowns: 0, conversions2pt: 0,
                extraPoints: 0, fieldGoals: 0, fights: 0, hockeyPoints: 0,
                hockeyShots: 0, hockeyBlocks: 0, soccerPoints: 0, soccerSteals: 0,
                basketballSteals: 0, rebounds: 0, basketballPoints: 0,
                basketballShots: 0, basketballBlocks: 0
            },
            fans: 0,
            fanLoyalty: 50,

            currentSeason: 1,
            currentWeek: 1,
            injuries: {},
            contractExpiryWarnings: [],

            isActive: true,
            version: 1
        };

        return await this.insert(id, team);
    }

    async syncFromEntity(teamEntity) {
        const serialized = teamEntity.serialize ? teamEntity.serialize() : {
            id: teamEntity.id,
            nationId: teamEntity.nationId,
            sport: teamEntity.sport,
            teamName: teamEntity.name,
            founded: teamEntity.founded,
            stadium: teamEntity.stadium,
            stadiumCapacity: teamEntity.stadiumCapacity,
            gymBonus: teamEntity.gymBonus,
            medicalBonus: teamEntity.medicalBonus,
            youthAcademyBonus: teamEntity.youthAcademyBonus,
            fanExperienceBonus: teamEntity.fanExperienceBonus,
            concessionsBonus: teamEntity.concessionsBonus,
            technologyBonus: teamEntity.technologyBonus,
            players: Object.fromEntries(teamEntity.players || []),
            roster: Object.fromEntries(teamEntity.roster || []),
            subs: Object.fromEntries(teamEntity.subs || []),
            revenue: teamEntity.revenue,
            expenses: teamEntity.expenses,
            stats: teamEntity.stats,
            fans: teamEntity.fans,
            fanLoyalty: teamEntity.fanLoyalty,
            currentSeason: teamEntity.currentSeason,
            currentWeek: teamEntity.currentWeek,
            injuries: Object.fromEntries(teamEntity.injuries || []),
            contractExpiryWarnings: teamEntity.contractExpiryWarnings,
            isActive: true,
            version: 1
        };
        const id = serialized.id || teamEntity.id;
        if (!id) throw new Error('Team has no id');
        const existing = this.findById(id, ['admin']);
        if (existing) {
            return await this.update(id, serialized);
        } else {
            return await this.insert(id, serialized);
        }
    }

    async updateStats(teamId, statUpdates) {
        const team = this.findById(teamId, ['admin']);
        if (!team) throw new Error('Team not found');

        const stats = { ...team.stats, ...statUpdates };
        return await this.update(teamId, { stats });
    }

    async addFanCount(teamId, amount) {
        const team = this.findById(teamId, ['admin']);
        if (!team) throw new Error('Team not found');
        return await this.update(teamId, { fans: (team.fans || 0) + amount });
    }

    async addInjury(teamId, playerId, injuryData) {
        const team = this.findById(teamId, ['admin']);
        if (!team) throw new Error('Team not found');

        const injuries = { ...team.injuries };
        injuries[playerId] = { ...injuryData, addedAt: Date.now() };

        return await this.update(teamId, { injuries });
    }

    async removeInjury(teamId, playerId) {
        const team = this.findById(teamId, ['admin']);
        if (!team) throw new Error('Team not found');

        const injuries = { ...team.injuries };
        delete injuries[playerId];

        return await this.update(teamId, { injuries });
    }

    async findByNation(nationId, permissions = ['public']) {
        return this.findByIndex('nationId', nationId, permissions);
    }

    async findBySport(sport, permissions = ['public']) {
        return this.findByIndex('sport', sport, permissions);
    }

    async findByLeague(leagueId, permissions = ['public']) {
        return this.findByIndex('leagueId', leagueId, permissions);
    }

    async getTopTeams(metric = 'stats.wins', limit = 50, permissions = ['public']) {
        const teams = await this.query([], { isActive: true }, permissions);
        return teams
            .sort((a, b) => {
                const av = metric.split('.').reduce((o, k) => (o || {})[k], a) || 0;
                const bv = metric.split('.').reduce((o, k) => (o || {})[k], b) || 0;
                return bv - av;
            })
            .slice(0, limit);
    }

    hasPermissionToView(record, permissions) {
        if (permissions.includes('admin') || permissions.includes('game_data')) return true;
        if (permissions.includes('public')) return record.isActive !== false;
        return false;
    }

    generateTeamId() {
        return 'team_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SportsDatabase };
}
