/**
 * Draft System - Global Per-Sport Draft Boards
 * Dominion Wars - Nation Building Strategy Game
 *
 * Each sport has its own global draft board visible to all users.
 * When a user unlocks a team (stadium wonder built), 100 randomly
 * generated players are added to that sport's draft board.
 * Players regenerate as they retire, keeping the draft ever-changing.
 *
 * Demographics are distributed equally (same number of each age group).
 * Older players have higher base skills on average.
 * Skills are position-appropriate for each sport.
 */

class DraftSystem {
    constructor(sportsSystem) {
        this.sports = sportsSystem;
        this.tps = sportsSystem.teamPlayerSystem;

        this.demographics = ['teen', 'youngAdult', 'adult', 'middleAged', 'older'];

        // Skill bonus per demographic: older players start with better skills
        this.demographicSkillBonus = {
            teen: 0,
            youngAdult: 5,
            adult: 10,
            middleAged: 15,
            older: 20,
        };

        // Players added per team unlock
        this.playersPerTeamUnlock = 100;

    // Global draft boards per sport
    // sport -> Map of playerId -> player (free agents + drafted)
    this.draftBoards = new Map();
    const sportTypes = this.sports.sportTypes || ['basketball', 'hockey', 'soccer', 'football'];
    for (const sport of sportTypes) {
        this.draftBoards.set(sport, new Map());
    }
    }
    // ══════════════════════════════════════════════════════════════════════
    // INITIALIZE DRAFT BOARD FOR A SPORT (called when first team unlocks)
    // ═════════════════════════════════════════════════════════════════════

    initializeDraftBoard(sport) {
        const board = this.draftBoards.get(sport);
        if (!board) return;

        // Add 100 players for this sport, equal demographic distribution
        const playersPerDemo = Math.floor(this.playersPerTeamUnlock / this.demographics.length);
        const positions = this.tps.playerPositions[sport];

        for (const demo of this.demographics) {
            for (let i = 0; i < playersPerDemo; i++) {
                const position = positions[Math.floor(Math.random() * positions.length)];
                const player = this.tps.generatePlayer({
                    sport,
                    position,
                    demographic: demo,
                    isDrafted: false,
                });

                // Apply demographic skill bonus (older = better base skills)
                const bonus = this.demographicSkillBonus[demo] || 0;
                if (bonus > 0) {
                    for (const attr of Object.keys(player.attributes)) {
                        player.attributes[attr] = Math.min(99, player.attributes[attr] + bonus);
                    }
                }

                // Set contract display
                player.contractDisplay = {
                    seasons: player.contractSeasons,
                    costPerSeason: this.tps.getContractExtensionCost(player, null, null),
                    totalCost: player.contractSeasons * this.tps.getContractExtensionCost(player, null, null),
                };

                // Draft rate for display
                player.draftRate = this.calculateDraftRate(player);

                board.set(player.id, player);
                this.sports.players.set(player.id, player);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // ADD PLAYERS WHEN A TEAM UNLOCKS (100 per team unlock)
    // ═════════════════════════════════════════════════════════════════════

    addPlayersForTeamUnlock(sport) {
        const board = this.draftBoards.get(sport);
        if (!board) {
            this.initializeDraftBoard(sport);
            return;
        }

        const playersPerDemo = Math.floor(this.playersPerTeamUnlock / this.demographics.length);
        const positions = this.tps.playerPositions[sport];

        for (const demo of this.demographics) {
            for (let i = 0; i < playersPerDemo; i++) {
                const position = positions[Math.floor(Math.random() * positions.length)];
                const player = this.tps.generatePlayer({
                    sport,
                    position,
                    demographic: demo,
                    isDrafted: false,
                });

                const bonus = this.demographicSkillBonus[demo] || 0;
                if (bonus > 0) {
                    for (const attr of Object.keys(player.attributes)) {
                        player.attributes[attr] = Math.min(99, player.attributes[attr] + bonus);
                    }
                }

                player.contractDisplay = {
                    seasons: player.contractSeasons,
                    costPerSeason: this.tps.getContractExtensionCost(player, null, null),
                    totalCost: player.contractSeasons * this.tps.getContractExtensionCost(player, null, null),
                };

                player.draftRate = this.calculateDraftRate(player);

                board.set(player.id, player);
                this.sports.players.set(player.id, player);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // REGENERATE PLAYERS WHEN THEY RETIRE (keep draft ever-changing)
    // ═════════════════════════════════════════════════════════════════════

    regenerateRetiredPlayers(sport) {
        const board = this.draftBoards.get(sport);
        if (!board) return;

        // Remove retired players from board and global players map
        for (const [pid, p] of board) {
            if (p.isRetired) {
                board.delete(pid);
                this.sports.players.delete(pid);
            }
        }

        const positions = this.tps.playerPositions[sport];
        const playersPerDemo = Math.floor(this.playersPerTeamUnlock / (this.demographics.length * 2)); // smaller regen

        for (const demo of this.demographics) {
            for (let i = 0; i < playersPerDemo; i++) {
                const position = positions[Math.floor(Math.random() * positions.length)];
                const player = this.tps.generatePlayer({
                    sport,
                    position,
                    demographic: demo,
                    isDrafted: false,
                });

                const bonus = this.demographicSkillBonus[demo] || 0;
                if (bonus > 0) {
                    for (const attr of Object.keys(player.attributes)) {
                        player.attributes[attr] = Math.min(99, player.attributes[attr] + bonus);
                    }
                }

                player.contractDisplay = {
                    seasons: player.contractSeasons,
                    costPerSeason: this.tps.getContractExtensionCost(player, null, null),
                    totalCost: player.contractSeasons * this.tps.getContractExtensionCost(player, null, null),
                };

                player.draftRate = this.calculateDraftRate(player);

                board.set(player.id, player);
                this.sports.players.set(player.id, player);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // GET DRAFT BOARD (visible to all users)
    // ═════════════════════════════════════════════════════════════════════

    getDraftBoard(sport) {
        const board = this.draftBoards.get(sport);
        if (!board) return [];
        // Return only free agents (not on a team, not retired)
        return [...board.values()].filter(p => !p.isRetired && !this.tps.getPlayerTeam(p.id));
    }

    getDraftBoardAll(sport) {
        // All players in the draft board for this sport (including drafted)
        const board = this.draftBoards.get(sport);
        if (!board) return [];
        return [...board.values()].filter(p => !p.isRetired);
    }

    // ═════════════════════════════════════════════════════════════════════
    // CALCULATE DRAFT RATE
    // ═════════════════════════════════════════════════════════════════════

    calculateDraftRate(player) {
        const values = Object.values(player.attributes);
        const avgAttr = values.reduce((a, b) => a + b, 0) / values.length;
        const skillRate = avgAttr / 100;
        const potentialFactor = player.potential / 100;

        // Older players have higher draft rate due to better base skills
        const demoFactor = {
            teen: 0.9,
            youngAdult: 1.0,
            adult: 1.1,
            middleAged: 1.2,
            older: 1.3,
        }[player.demographic] || 1.0;

        // Players never on a team have slightly lower visibility
        const onTeamFactor = player.isDrafted ? 1.0 : 0.9;

        return skillRate * potentialFactor * demoFactor * onTeamFactor;
    }

    // ══════════════════════════════════════════════════════════════════════
    // DRAFT PLAYER (from global board to team)
    // ═════════════════════════════════════════════════════════════════════

    draftPlayer(nationId, sport, playerId, team) {
        const player = this.sports.players.get(playerId);
        if (!player) throw new Error('Player not found');
        if (player.isRetired) throw new Error('Player is retired');
        if (player.sport !== sport) throw new Error('Player plays a different sport');

        const nation = this.sports.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        // Delegate signing logic (salary, roster, previousTeams) to team-player-system
        this.tps.signPlayer(team, playerId, nation);

        // Draft-specific marking
        player.isDrafted = true;
        player.draftRateMultiplier = 1.0;

        // Remove from draft board if present
        const board = this.draftBoards.get(sport);
        if (board) board.delete(playerId);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:playerDrafted', { nationId, sport, playerId, player, teamId: team.id });
        }

        return player;
    }

    // ═════════════════════════════════════════════════════════════════════
    // UPDATE DRAFT RATE AFTER GAME
    // ═════════════════════════════════════════════════════════════════════

    updateDraftRateAfterGame(player, teamWon, teamStats) {
        const values = Object.values(player.attributes);
        const avgAttr = values.reduce((a, b) => a + b, 0) / values.length;
        const skillRate = avgAttr / 100;
        const potentialFactor = player.potential / 100;

        const totalGames = teamStats.wins + teamStats.losses + teamStats.draws;
        const winRate = totalGames > 0 ? teamStats.wins / totalGames : 0.5;
        const recordFactor = 0.5 + winRate;

        const demoFactor = {
            teen: 0.9,
            youngAdult: 1.0,
            adult: 1.1,
            middleAged: 1.2,
            older: 1.3,
        }[player.demographic] || 1.0;

        player.draftRate = skillRate * potentialFactor * recordFactor * demoFactor;
        player.draftRateMultiplier = 1.0;

        return player.draftRate;
    }

    // ═════════════════════════════════════════════════════════════════════
    // RETURN PLAYER TO DRAFT BOARD (when released/retired)
    // ═════════════════════════════════════════════════════════════════════

    returnPlayerToBoard(player) {
        if (player.isRetired) return;
        // Remove from current team if on one
        const team = this.tps.getPlayerTeam(player.id);
        if (team) {
            team.players.delete(player.id);
            for (const [pos, pid] of team.roster) {
                if (pid === player.id) team.roster.delete(pos);
            }
            for (const [pos, ids] of team.subs) {
                const idx = ids.indexOf(player.id);
                if (idx !== -1) ids.splice(idx, 1);
            }
        }
        const board = this.draftBoards.get(player.sport);
        if (board) {
            player.isDrafted = false;
            player.draftRateMultiplier = 0.9;
            board.set(player.id, player);
        }
    }

    removePlayerFromBoard(playerId) {
        for (const board of this.draftBoards.values()) {
            board.delete(playerId);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftSystem;
} else if (typeof window !== 'undefined') {
    window.DraftSystem = DraftSystem;
}
