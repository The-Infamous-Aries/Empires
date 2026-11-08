/**
 * AI Team System - Fully Managed AI-Run Sports Teams
 * Sovereignty Epochs - Nation Ruler Roleplay Game
 *
 * AI teams are league participants not tied to any player nation.
 * They autodraft from the global draft pool, self-manage rosters,
 * and scale competitively so leagues stay full and balanced.
 *
 * Balance target: AI teams sit in the middle of the pack — strong enough
 * that users can't steamroll every season, weak enough that a well-managed
 * user team can win the championship.
 */

class AITeamSystem {
    constructor(sportsSystem) {
        this.sports = sportsSystem;

        // AI team metadata: teamId -> { name, sport, leagueId, personality, seasonJoined, budget }
        this.aiTeams = new Map();

        // AI personalities affect draft/roster preferences
        this.personalities = [
            { key: 'balanced', strengthBias: 0, description: 'Balanced build' },
            { key: 'offense', strengthBias: 5, description: 'Offense-focused' },
            { key: 'defense', strengthBias: -5, description: 'Defense-focused' },
            { key: 'youth', strengthBias: -3, description: 'Young, high-potential roster' },
            { key: 'veteran', strengthBias: 3, description: 'Experienced veterans' },
        ];

        // Target average attribute for AI teams (competitive middle-of-pack)
        this.targetAvgAttribute = 55;
        this.attributeVariance = 12;
    }

    // ═════════════════════════════════════════════════════════════════════
    // AI TEAM CREATION
    // ═════════════════════════════════════════════════════════════════════

    createAITeam(data) {
        const { sport, teamName, leagueId } = data;

        if (!this.sports.sportTypes.includes(sport)) {
            throw new Error('Unknown sport');
        }

        const aiId = `AI-${this.sports.generateId()}`;
        const personality = this.personalities[
            Math.floor(Math.random() * this.personalities.length)
        ];

        // AI teams bypass the stadium wonder requirement (no nation wonder needed)
        const team = this.sports.createTeam({
            nationId: aiId,
            sport,
            teamName,
            leagueId,
            isAI: true,
        });

        team.isAI = true;
        team.aiPersonality = personality.key;
        team.aiBudget = 5000000 + Math.floor(Math.random() * 5000000); // $5M-$10M
        team.aiSeasonJoined = this.sports.seasonCycle.season;

        // Store AI metadata
        this.aiTeams.set(team.id, {
            teamId: team.id,
            name: teamName,
            sport,
            leagueId,
            personality: personality.key,
            strengthBias: personality.strengthBias,
            seasonJoined: team.aiSeasonJoined,
            budget: team.aiBudget,
            lastDraftDay: null,
            lastManagementDay: null,
        });

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:aiTeamCreated', { team, aiId, personality: personality.key });
        }

        return team;
    }

    getAITeam(teamId) {
        return this.aiTeams.get(teamId) || null;
    }

    isAITeam(teamId) {
        return this.aiTeams.has(teamId);
    }

    getAITeamsInLeague(leagueId) {
        return [...this.aiTeams.values()].filter(a => a.leagueId === leagueId);
    }

    // ═════════════════════════════════════════════════════════════════════
    // AI AUTODRAFT - Fill roster from the global draft pool
    // ═════════════════════════════════════════════════════════════════════

    autodraftAITeam(teamId) {
        const team = this.sports.getTeamById(teamId);
        if (!team) throw new Error('AI team not found');
        if (!team.isAI) throw new Error('Not an AI team');

        const aiMeta = this.aiTeams.get(teamId);
        const sport = team.sport;
        const draftBoard = this.sports.draftSystem.getDraftBoardAll(sport);

        if (draftBoard.length === 0) return { drafted: 0, message: 'Draft pool empty' };

        const positions = this.sports.teamPlayerSystem.playerPositions[sport];
        const positionList =
            sport === 'football'
                ? [...positions.offense, ...positions.defense]
                : positions;

        // Determine how many players the AI needs to fill roster + subs
        const targetRosterSize = positionList.length; // starters
        const targetSubsPerPosition = 2;
        const targetTotal = targetRosterSize + positionList.length * targetSubsPerPosition;

        let drafted = 0;

        // First pass: draft starters for each position, picking best available
        for (const position of positionList) {
            if (team.roster.has(position) && team.roster.get(position)) continue;

            const bestPlayer = this.selectBestPlayerForPosition(
                draftBoard,
                position,
                sport,
                aiMeta.strengthBias
            );

            if (bestPlayer) {
                this.signAIPlayer(team, bestPlayer.id);
                team.roster.set(position, bestPlayer.id);
                drafted++;
            }
        }

        // Second pass: fill subs
        for (const position of positionList) {
            let subs = team.subs.get(position) || [];
            while (subs.length < targetSubsPerPosition) {
                const bestPlayer = this.selectBestPlayerForPosition(
                    draftBoard,
                    position,
                    sport,
                    aiMeta.strengthBias
                );
                if (!bestPlayer) break;
                this.signAIPlayer(team, bestPlayer.id);
                subs.push(bestPlayer.id);
                drafted++;
            }
            team.subs.set(position, subs);
        }

        aiMeta.lastDraftDay = this.sports.getCurrentDay();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:aiTeamDrafted', { teamId, sport, drafted });
        }

        return { drafted, team };
    }

    selectBestPlayerForPosition(draftBoard, position, sport, strengthBias) {
        // Filter players matching position, not retired, not already on a team
        const candidates = draftBoard.filter(p => {
            if (p.isRetired) return false;
            if (this.sports.getPlayerTeam(p.id)) return false;
            // Position match (exact or sport-specific)
            return p.position === position;
        });

        if (candidates.length === 0) return null;

        // Score each candidate: attribute average + personality bias + random variance
        const scored = candidates.map(p => {
            const attrs = Object.values(p.attributes || {});
            const avgAttr = attrs.length > 0 ? attrs.reduce((a, b) => a + b, 0) / attrs.length : 50;

            // Personality bias toward certain attributes
            let biasBonus = 0;
            if (strengthBias > 0 && p.attributes.strength !== undefined) {
                biasBonus += (p.attributes.strength - 50) * 0.1;
            }
            if (strengthBias < 0 && p.attributes.defense !== undefined) {
                biasBonus += (p.attributes.defense - 50) * 0.1;
            }

            // Prefer players closer to target average (competitive balance)
            const balanceScore = -Math.abs(avgAttr - this.targetAvgAttribute) * 0.5;

            const randomVariance = (Math.random() - 0.5) * 8;

            return {
                player: p,
                score: avgAttr + biasBonus + balanceScore + randomVariance,
            };
        });

        scored.sort((a, b) => b.score - a.score);

        // Pick from top 3 with some randomness so AI isn't perfectly deterministic
        const topN = Math.min(3, scored.length);
        const pickIdx = Math.floor(Math.random() * topN);

        return scored[pickIdx].player;
    }

    signAIPlayer(team, playerId) {
        const player = this.sports.players.get(playerId);
        if (!player) throw new Error('Player not found');

        const aiMeta = this.aiTeams.get(team.id);
        if (!aiMeta) throw new Error('AI metadata not found');

        // AI pays from its own budget (not nation money)
        const salary = player.salary || 500000;
        if (aiMeta.budget < salary) {
            // AI can't afford — sign anyway at reduced rate (AI teams don't go bankrupt)
            aiMeta.budget = 0;
        } else {
            aiMeta.budget -= salary;
        }
        team.aiBudget = aiMeta.budget;

        this.sports.teamPlayerSystem.signPlayer(team, playerId, this.getAINation(team.id));
    }

    // ══════════════════════════════════════════════════════════════════════
    // AI ROSTER MANAGEMENT - Auto-set starters/subs each season
    // ══════════════════════════════════════════════════════════════════════

    autoManageRoster(teamId) {
        const team = this.sports.getTeamById(teamId);
        if (!team || !team.isAI) return;

        const sport = team.sport;
        const positions =
            sport === 'football'
                ? [...this.sports.teamPlayerSystem.playerPositions[sport].offense,
                    ...this.sports.teamPlayerSystem.playerPositions[sport].defense]
                : this.sports.teamPlayerSystem.playerPositions[sport];

        // Clear existing roster/sub assignments
        team.roster.clear();
        team.subs.clear();

        const available = [...team.players.values()].filter(p => !p.isInjured && !p.isRetired);

        // Sort by overall rating (best first)
        available.sort((a, b) => {
            const ra = this.sports.calculatePlayerRating(a);
            const rb = this.sports.calculatePlayerRating(b);
            return rb - ra;
        });

        const positionIndex = {};
        positions.forEach(pos => { positionIndex[pos] = 0; });

        // Assign starters (best player per position)
        for (const player of available) {
            const pos = player.position;
            if (!positionIndex[pos]) continue;
            if (positionIndex[pos] === 0) {
                team.roster.set(pos, player.id);
                positionIndex[pos]++;
            } else if (positionIndex[pos] <= 2) {
                if (!team.subs.has(pos)) team.subs.set(pos, []);
                team.subs.get(pos).push(player.id);
                positionIndex[pos]++;
            }
        }

        this.aiTeams.get(teamId).lastManagementDay = this.sports.getCurrentDay();
    }

    // ══════════════════════════════════════════════════════════════════════
    // AI SEASON PROCESSING - Called each season cycle
    // ══════════════════════════════════════════════════════════════════════

    processAITeamSeason(teamId) {
        const team = this.sports.getTeamById(teamId);
        if (!team || !team.isAI) return;

        this.autoManageRoster(teamId);

        // AI may train one random attribute if budget allows
        const aiMeta = this.aiTeams.get(teamId);
        if (aiMeta.budget > 1000000 && Math.random() < 0.3) {
            const players = [...team.players.values()].filter(p => !p.isRetired);
            if (players.length > 0) {
                const p = players[Math.floor(Math.random() * players.length)];
                const attrs = Object.keys(p.attributes || {});
                const attr = attrs[Math.floor(Math.random() * attrs.length)];
                if (p.attributes[attr] < p.potential) {
                    p.attributes[attr] = Math.min(p.potential, p.attributes[attr] + 1);
                    aiMeta.budget -= 1000000;
                    team.aiBudget = aiMeta.budget;
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // MOCK NATION FOR AI TEAMS
    // ══════════════════════════════════════════════════════════════════════

    getAINation(teamId) {
        const aiMeta = this.aiTeams.get(teamId);
        if (!aiMeta) return null;

        return {
            id: `AI-${teamId}`,
            name: 'AI Manager',
            money: aiMeta.budget,
            statistics: {},
            wonderEffects: {},
        };
    }

    // ══════════════════════════════════════════════════════════════════════
    // SERIALIZE / DESERIALIZE
    // ══════════════════════════════════════════════════════════════════════

    getState() {
        return {
            aiTeams: [...this.aiTeams.entries()],
        };
    }

    setState(state) {
        if (!state) return;
        if (state.aiTeams) {
            this.aiTeams = new Map(state.aiTeams);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AITeamSystem;
} else if (typeof window !== 'undefined') {
    window.AITeamSystem = AITeamSystem;
}
