/**
 * Sports Management System - League, Season, Tournament Edition
 * Dominion Wars - Nation Building Strategy Game
 *
 * Handles:
 * - Leagues (30-40 nations per league, per sport)
 * - Seasons: daily games (1 per day per team), 30-45 games per season (~1-1.5 months)
 * - Championship tournament at season end: best-of-5 rounds, best-of-7 finals
 * - 14-day offseason break between seasons
 * - Draft system: players drafted from population demographics
 * - Player training (nation currency), natural leveling from games
 * - Contracts (1-5 seasons), extensions (skill + happiness pricing)
 * - Stadium upgrades: Seating, Gym, Medical Center, Youth Academy, Fan Experience,
 *   Concessions, Technology Center
 * - Team management: starters, subs, injuries
 * - Gambling/betting on matches
 *
 * Teams start empty (no auto roster), use nation.money directly, start with 0 fans.
 * Unlocked via Stadium Wonders (Basketball, Hockey, Soccer).
 */

class SportsSystem {
    constructor() {
        // ── Sub-systems ────────────────────────────────────────────────
        this.teamPlayerSystem = new TeamPlayerSystem(this);
        this.draftSystem = new DraftSystem(this);

        // ── Data stores ────────────────────────────────────────────────
        this.teams = new Map();      // nationId -> { sport -> Team }
        this.players = new Map();    // playerId -> player object
        this.leagues = new Map();    // leagueId -> league object
        this.tournaments = new Map(); // tournamentId -> tournament object
        this.matches = new Map();    // matchId -> match object
        this.bets = new Map();       // betId -> bet object

        // ── Nation-level sport stats (coach rating per sport + overall) ──
        this.nationSportStats = new Map(); // nationId -> { sport: {...}, overall: {...} }

        // ── Config ─────────────────────────────────────────────────────
        this.sportTypes = ['basketball', 'hockey', 'soccer', 'football'];
        this.playerPositions = {
            basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
            hockey: ['Goalkeeper', 'Left Defense', 'Right Defense', 'Left Wing', 'Center', 'Right Wing'],
            soccer: ['Goalkeeper', 'Left Back', 'Center Back', 'Center Back', 'Right Back', 'Defensive Mid', 'Central Mid', 'Central Mid', 'Left Wing', 'Right Wing', 'Striker'],
            football: {
                offense: ['Quarterback', 'Running Back', 'Wide Receiver', 'Slot Receiver', 'Tight End', 'Left Tackle', 'Left Guard', 'Center', 'Right Guard', 'Right Tackle', 'Kicker'],
                defense: ['Defensive End', 'Defensive Tackle', 'Nose Tackle', 'Defensive End', 'Middle Linebacker', 'Outside Linebacker', 'Outside Linebacker', 'Cornerback', 'Cornerback', 'Free Safety', 'Strong Safety'],
            },
        };

        this.stadiumUpgrades = [
            'Seating',
            'Gym',
            'Medical Center',
            'Youth Academy',
            'Fan Experience',
            'Concessions',
            'Technology Center',
        ];

        // League config
        this.minLeagueTeams = 2;
        this.maxLeagueTeams = 40;
        this.gamesPerSeason = 30; // Fixed at 30 games
        this.offseasonDays = 14;

        // Phase lengths (in game days)
        this.phaseLengths = {
            registration: 7,
            draft: 7,
            active: 30,
            leagueChampionship: 21, // max, actual varies by bracket
            worldChampionship: 21,
            offseason: 14,
        };

        // Upgrade type -> stadium property key mapping
        this.upgradeKeyMap = {
            'Seating': 'seating',
            'Gym': 'gym',
            'Medical Center': 'medicalCenter',
            'Youth Academy': 'youthAcademy',
            'Fan Experience': 'fanExperience',
            'Concessions': 'concessions',
            'Technology Center': 'technologyCenter',
        };

        // Global season cycle - all leagues sync to this
        this.seasonCycle = {
            phase: 'registration', // registration, draft, active, leagueChampionship, worldChampionship, offseason
            season: 1,
            phaseDay: 0,
            phaseStartDay: 0,
            leagueChampions: [], // [{ leagueId, championTeamId, leagueName, sport }]
            worldChampionshipStarted: false,
            worldChampionTeamId: null,
        };

        this.initialize();
    }

    initialize() {
        this.bindEvents();
    }

    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('sports:createTeam', this.createTeam.bind(this));
            EventBus.on('sports:upgradeStadium', this.upgradeStadium.bind(this));
            EventBus.on('sports:signPlayer', this.signPlayer.bind(this));
            EventBus.on('sports:releasePlayer', this.releasePlayer.bind(this));
            EventBus.on('wonder_built', this.onWonderBuilt.bind(this));
            EventBus.on('wonder_demolished', this.onWonderDemolished.bind(this));
        }
    }

    onWonderBuilt(data) {
        const stadiumWonders = ['basketballStadium', 'hockeyStadium', 'soccerStadium'];
        if (stadiumWonders.includes(data.wonderType)) {
            if (window.BottomMenu && typeof window.BottomMenu.updateTeamTabVisibility === 'function') {
                window.BottomMenu.updateTeamTabVisibility();
            }
        }
    }

    onWonderDemolished(data) {
        const stadiumWonders = ['basketballStadium', 'hockeyStadium', 'soccerStadium'];
        if (stadiumWonders.includes(data.wonderType)) {
            if (window.BottomMenu && typeof window.BottomMenu.updateTeamTabVisibility === 'function') {
                window.BottomMenu.updateTeamTabVisibility();
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // LEAGUES
    // ═════════════════════════════════════════════════════════════════════

    createLeague(data) {
        const { nationId, sport, name, sides } = data;

        if (!this.sportTypes.includes(sport)) {
            throw new Error('Unknown sport');
        }
        if (!this.hasStadiumWonder(nationId, sport)) {
            throw new Error('Stadium wonder required to create a league');
        }

        // Parse custom sides (2-8 sides)
        let leagueSides = [];
        if (sides && Array.isArray(sides) && sides.length >= 2 && sides.length <= 8) {
            leagueSides = sides.map((s, idx) => ({
                id: `side-${idx}`,
                name: s.name || `Side ${idx + 1}`,
                abbreviation: s.abbreviation || s.name.charAt(0).toUpperCase(),
                teams: [],
            }));
        } else {
            // Default: 2 sides (East/West)
            leagueSides = [
                { id: 'side-0', name: 'East', abbreviation: 'E', teams: [] },
                { id: 'side-1', name: 'West', abbreviation: 'W', teams: [] },
            ];
        }

        const league = {
            id: this.generateId(),
            name: name || `${sport.charAt(0).toUpperCase() + sport.slice(1)} League`,
            sport,
            sides: leagueSides,
            sideCount: leagueSides.length,
            gamesPerSeason: this.gamesPerSeason,
            season: 1,
            week: 1,
            status: 'waiting', // waiting, registration, draft, active, leagueChampionship, offseason
            teams: [], // [{ nationId, teamId, teamName, sideId }]
            createdDay: this.getCurrentDay(),
            lastGameDay: null,
            championshipTournamentId: null,
            offseasonEndDay: null,
            // Cross-side matchup configuration (for >2 sides): who competes on which bracket side
            bracketSideConfig: null,
        };

        this.leagues.set(league.id, league);

        // Auto-join the creator on first side
        this.joinLeague({ leagueId: league.id, nationId, teamName: name || `${name || sport} Team`, sport, sideId: leagueSides[0].id });

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:leagueCreated', { league });
        }

        return league;
    }

    joinLeague(data) {
        const { leagueId, nationId, teamName, sport, sideId } = data;

        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');
        if (league.sport !== sport) throw new Error('League sport mismatch');
        if (league.status !== 'waiting' && league.status !== 'registration') {
            throw new Error('League is not open for joining');
        }

        // Check nation has stadium wonder
        if (!this.hasStadiumWonder(nationId, sport)) {
            throw new Error('Stadium wonder required to join this league');
        }

        // Check not already in league
        if (league.teams.some(t => t.nationId === nationId)) {
            throw new Error('Nation already in this league');
        }

        // Check league not full
        if (league.teams.length >= this.maxLeagueTeams) {
            throw new Error('League is full');
        }

        // Determine side
        let selectedSideId = sideId;
        if (!selectedSideId || !league.sides.find(s => s.id === selectedSideId)) {
            // Assign to side with fewest teams
            const sideCounts = {};
            for (const s of league.sides) sideCounts[s.id] = 0;
            for (const t of league.teams) {
                if (t.sideId && sideCounts[t.sideId] !== undefined) sideCounts[t.sideId]++;
            }
            selectedSideId = Object.keys(sideCounts).reduce((a, b) => sideCounts[a] < sideCounts[b] ? a : b);
        }

        // Check side not overfilled (max 40 / sideCount per side, but overall cap applies)
        const sideTeamCount = league.teams.filter(t => t.sideId === selectedSideId).length;
        const maxPerSide = Math.ceil(this.maxLeagueTeams / league.sideCount);
        if (sideTeamCount >= maxPerSide) {
            throw new Error(`Side ${league.sides.find(s => s.id === selectedSideId)?.name} is full`);
        }

        // Create team for this nation in this league
        const team = this.createTeam({ nationId, sport, teamName, leagueId: league.id });
        team.leagueId = league.id;

        league.teams.push({
            nationId,
            teamId: team.id,
            teamName: team.name,
            sideId: selectedSideId,
        });

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:leagueJoined', { leagueId, nationId, teamId: team.id, sport, sideId: selectedSideId });
        }

        return { league, team };
    }

    leaveLeague(leagueId, nationId) {
        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');

        const idx = league.teams.findIndex(t => t.nationId === nationId);
        if (idx === -1) throw new Error('Nation not in this league');

        const teamId = league.teams[idx].teamId;
        league.teams.splice(idx, 1);

        // Remove team
        const nationTeams = this.teams.get(nationId);
        if (nationTeams) delete nationTeams[league.sport];

        return true;
    }

    startDraft(leagueId) {
        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');
        if (league.status !== 'waiting' && league.status !== 'registration') {
            throw new Error('League is not in registration phase');
        }
        // Only allow draft start during global registration or draft phase
        if (this.seasonCycle.phase !== 'registration' && this.seasonCycle.phase !== 'draft') {
            throw new Error('Global season is not in registration/draft phase');
        }

        league.status = 'draft';
        league.season = this.seasonCycle.season;
        league.draftPool = this.draftSystem.getDraftBoard(league.sport);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:draftStarted', { league });
        }

        return league;
    }

    getDraftPool(leagueId) {
        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');
        return league.draftPool || [];
    }

    draftPlayer(data) {
        const { leagueId, nationId, playerId } = data;

        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');
        if (league.status !== 'draft') throw new Error('Draft is not active');

        const team = this.getTeam(nationId, league.sport);
        if (!team) throw new Error('No team in this league');

        const player = this.players.get(playerId);
        if (!player) throw new Error('Player not found');
        if (player.isRetired) throw new Error('Player is retired');
        if (player.sport !== league.sport) throw new Error('Player plays a different sport');

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        // Delegate signing logic (salary, roster, previousTeams) to team-player-system
        this.teamPlayerSystem.signPlayer(team, playerId, nation);

        // Draft-specific marking
        player.isDrafted = true;
        player.draftRateMultiplier = 1.0;

        // Remove from draft pool
        const poolIdx = league.draftPool.findIndex(p => p.id === playerId);
        if (poolIdx !== -1) league.draftPool.splice(poolIdx, 1);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:playerDrafted', { leagueId, nationId, playerId, player, teamId: team.id });
        }

        return player;
    }

    isTeamFull(team) {
        // Full team = at least one starter per position
        const posConfig = this.playerPositions[team.sport];

        if (team.sport === 'football' && posConfig && posConfig.offense && posConfig.defense) {
            // Football needs all 11 offense + 11 defense positions filled = 22 roster slots
            let filledOffense = 0;
            let filledDefense = 0;
            for (const position of posConfig.offense) {
                if (team.roster.has(position) && team.roster.get(position)) filledOffense++;
            }
            for (const position of posConfig.defense) {
                if (team.roster.has(position) && team.roster.get(position)) filledDefense++;
            }
            return filledOffense >= posConfig.offense.length && filledDefense >= posConfig.defense.length;
        }

        const positions = posConfig;
        let filledPositions = 0;
        for (const position of positions) {
            if (team.roster.has(position) && team.roster.get(position)) filledPositions++;
        }
        return filledPositions >= positions.length;
    }

    canStartSeason(league) {
        if (league.teams.length < this.minLeagueTeams) return false;
        for (const t of league.teams) {
            const team = this.getTeam(t.nationId, league.sport);
            if (!team || !this.isTeamFull(team)) return false;
        }
        return true;
    }

    startSeason(leagueId) {
        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');
        if (league.status !== 'draft') throw new Error('League not in draft phase');
        // Only allow season start during global draft or active phase
        if (this.seasonCycle.phase !== 'draft' && this.seasonCycle.phase !== 'active') {
            throw new Error('Global season is not in draft/active phase');
        }
        if (!this.canStartSeason(league)) throw new Error('Not all teams have a full roster');

        league.status = 'active';
        league.season = this.seasonCycle.season;
        league.week = 1;
        league.lastGameDay = this.getCurrentDay();

        // Generate season schedule (30 games, daily)
        this.generateSeasonSchedule(league);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:seasonStarted', { league });
        }

        return league;
    }

    generateSeasonSchedule(league) {
        const teams = league.teams;
        const gamesPerSeason = this.gamesPerSeason; // Fixed at 30
        const startDay = this.getCurrentDay();

        league.schedule = [];
        // Each team plays one game per day for 30 days
        // Round-robin style pairing each day
        for (let day = 0; day < gamesPerSeason; day++) {
            const matchups = [];
            const used = new Set();
            // Simple pairing: team i plays team (i + day + 1) % n
            for (let i = 0; i < teams.length; i++) {
                if (used.has(i)) continue;
                const j = (i + day + 1) % teams.length;
                if (used.has(j) || i === j) continue;
                used.add(i);
                used.add(j);
                matchups.push({
                    homeTeam: teams[i].teamId,
                    awayTeam: teams[j].teamId,
                    homeNation: teams[i].nationId,
                    awayNation: teams[j].nationId,
                    dayOffset: day,
                    scheduledDay: startDay + day,
                    completed: false,
                });
            }
            league.schedule.push({ day: day + 1, scheduledDay: startDay + day, matches: matchups });
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // DAILY GAME PROCESSING (one game per day per team)
    // ═════════════════════════════════════════════════════════════════════

    processDailyGames() {
        // Only process daily games during global active phase
        if (this.seasonCycle.phase !== 'active') return;

        const now = this.getCurrentDay();

        for (const [leagueId, league] of this.leagues) {
            if (league.status !== 'active') continue;

            // Find today's scheduled matches
            for (const dayEntry of league.schedule) {
                if (dayEntry.completed) continue;
                if (dayEntry.scheduledDay > now) continue;

                for (const match of dayEntry.matches) {
                    if (match.completed) continue;

                    const team1 = this.getTeamById(match.homeTeam);
                    const team2 = this.getTeamById(match.awayTeam);
                    if (!team1 || !team2) continue;

                    // Simulate match
                    const result = this.simulateMatch(team1, team2);
                    match.completed = true;
                    match.result = result;
                    match.score1 = result.score1;
                    match.score2 = result.score2;
                    match.winnerId = result.score1 > result.score2 ? team1.id : (result.score2 > result.score1 ? team2.id : null);

                    // Update team records
                    this.updateTeamRecords(team1, team2, result);
                    this.updateLeagueStandings(league, team1, team2, result);

                    // Award XP to players (natural leveling)
                    const minutesPlayed = 60; // standard game time
                    this.awardMatchXP(team1, team2, result);

                    // Update stats and get outcomes
                    const statResult = this.updateTeamStats(team1, team2, result);

                    // Process match injuries with new injury system
                    this.processMatchInjuries(team1, team2, minutesPlayed, statResult.outcome1, statResult.outcome2, match);

                    // Update fans
                    this.updateFansAfterGame(league, team1, team2, result);

                    // Store match
                    this.matches.set(match.id || this.generateId(), {
                        ...result,
                        leagueId,
                        season: league.season,
                        day: dayEntry.day,
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam,
                    });

                    // Process bets
                    this.processMatchBets(result);
                }

                dayEntry.completed = true;
                league.lastGameDay = now;
                league.week = dayEntry.day;
            }

            // Check if season is over
            const allCompleted = league.schedule.every(d => d.completed);
            if (allCompleted) {
                this.endRegularSeason(leagueId);
            }
        }
    }

    updateTeamRecords(team1, team2, result) {
        if (result.score1 > result.score2) {
            team1.stats.wins++;
            team2.stats.losses++;
        } else if (result.score2 > result.score1) {
            team2.stats.wins++;
            team1.stats.losses++;
        } else {
            team1.stats.draws++;
            team2.stats.draws++;
        }
    }

    updateLeagueStandings(league, team1, team2, result) {
        if (!league.standings) league.standings = new Map();

        const ensure = (team) => {
            if (!league.standings.has(team.id)) {
                league.standings.set(team.id, {
                    teamId: team.id,
                    nationId: team.nationId,
                    teamName: team.name,
                    wins: 0, losses: 0, draws: 0, points: 0,
                    goalsFor: 0, goalsAgainst: 0,
                });
            }
            return league.standings.get(team.id);
        };

        const s1 = ensure(team1);
        const s2 = ensure(team2);

        s1.goalsFor += result.score1;
        s1.goalsAgainst += result.score2;
        s2.goalsFor += result.score2;
        s2.goalsAgainst += result.score1;

        if (result.score1 > result.score2) {
            s1.wins++; s1.points += 3;
            s2.losses++;
        } else if (result.score2 > result.score1) {
            s2.wins++; s2.points += 3;
            s1.losses++;
        } else {
            s1.draws++; s2.draws++;
            s1.points += 1; s2.points += 1;
        }
    }

    awardMatchXP(team1, team2, result) {
        const teamWon1 = result.score1 > result.score2;
        const teamWon2 = result.score2 > result.score1;

        // Award XP to all players on both teams (even benched get some for team result)
        const minutesPlayed = 90; // default full game

        for (const [playerId, player] of team1.players) {
            const xp = this.teamPlayerSystem.awardGameXP(player, minutesPlayed, teamWon1, team1.sport);
            this.draftSystem.updateDraftRateAfterGame(player, teamWon1, team1.stats);
        }
        for (const [playerId, player] of team2.players) {
            const xp = this.teamPlayerSystem.awardGameXP(player, minutesPlayed, teamWon2, team2.sport);
            this.draftSystem.updateDraftRateAfterGame(player, teamWon2, team2.stats);
        }
    }

    updateFansAfterGame(league, team1, team2, result) {
        const seatingLevel1 = team1.stadium.seating || 0;
        const seatingLevel2 = team2.stadium.seating || 0;
        const fanExpLevel1 = team1.stadium.fanExperience || 0;
        const fanExpLevel2 = team2.stadium.fanExperience || 0;
        const techLevel1 = team1.stadium.technologyCenter || 0;
        const techLevel2 = team2.stadium.technologyCenter || 0;

        // Base fan gain per game
        let fanGain1 = 1000 + seatingLevel1 * 500;
        let fanGain2 = 1000 + seatingLevel2 * 500;

        // Fan experience bonus
        fanGain1 = Math.floor(fanGain1 * (1 + fanExpLevel1 * 0.1));
        fanGain2 = Math.floor(fanGain2 * (1 + fanExpLevel2 * 0.1));

        // Technology center bonus
        fanGain1 = Math.floor(fanGain1 * (1 + techLevel1 * 0.05));
        fanGain2 = Math.floor(fanGain2 * (1 + techLevel2 * 0.05));

        // Win bonus
        if (result.score1 > result.score2) {
            fanGain1 = Math.floor(fanGain1 * 1.5);
        } else if (result.score2 > result.score1) {
            fanGain2 = Math.floor(fanGain2 * 1.5);
        }

        team1.fans += fanGain1;
        team2.fans += fanGain2;
    }

    // ═════════════════════════════════════════════════════════════════════
    // END OF REGULAR SEASON -> CHAMPIONSHIP
    // ═════════════════════════════════════════════════════════════════════

    endRegularSeason(leagueId) {
        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');

        // Only advance to championship during global leagueChampionship phase
        if (this.seasonCycle.phase !== 'leagueChampionship') return;

        league.status = 'leagueChampionship';
        this.startChampionship(leagueId);
    }

    startChampionship(leagueId) {
        const league = this.leagues.get(leagueId);
        if (!league) throw new Error('League not found');

        const sideCount = league.sideCount || 2;
        const standings = league.standings || new Map();
        const ranked = [...standings.entries()]
            .sort(([, a], [, b]) =>
                b.points - a.points ||
                (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
                a.teamName.localeCompare(b.teamName)
            );

        // Build team -> side mapping
        const teamSideMap = new Map();
        for (const t of league.teams) {
            teamSideMap.set(t.teamId, t.sideId);
        }

        let qualifiers = [];

        // Side-aware qualification (target: 16 teams)
        if (sideCount === 2) {
            // 8 from each side = 16 total
            for (const side of league.sides) {
                const sideTeams = ranked
                    .filter(([teamId]) => teamSideMap.get(teamId) === side.id)
                    .map(([teamId]) => teamId);
                qualifiers.push(...sideTeams.slice(0, 8));
            }
        } else if (sideCount === 4) {
            // Best 4 from each side = 16 total
            for (const side of league.sides) {
                const sideTeams = ranked
                    .filter(([teamId]) => teamSideMap.get(teamId) === side.id)
                    .map(([teamId]) => teamId);
                qualifiers.push(...sideTeams.slice(0, 4));
            }
        } else if (sideCount === 6) {
            // Best 2 from each side = 12, plus 4 wildcards (2 per bracket side group)
            const bracketSideGroups = [
                league.sides.slice(0, 3),
                league.sides.slice(3, 6),
            ];

            for (const side of league.sides) {
                const sideTeams = ranked
                    .filter(([teamId]) => teamSideMap.get(teamId) === side.id)
                    .map(([teamId]) => teamId);
                qualifiers.push(...sideTeams.slice(0, 2));
            }

            // Wildcards: 2 per bracket side from remaining best
            for (const group of bracketSideGroups) {
                const groupSideIds = group.map(s => s.id);
                const remaining = ranked
                    .filter(([teamId]) => groupSideIds.includes(teamSideMap.get(teamId)))
                    .filter(([teamId]) => !qualifiers.includes(teamId))
                    .map(([teamId]) => teamId);
                qualifiers.push(...remaining.slice(0, 2));
            }
        } else if (sideCount === 8) {
            // Best 2 from each side = 16 total
            for (const side of league.sides) {
                const sideTeams = ranked
                    .filter(([teamId]) => teamSideMap.get(teamId) === side.id)
                    .map(([teamId]) => teamId);
                qualifiers.push(...sideTeams.slice(0, 2));
            }
        } else {
            // Fallback: top 16 overall
            qualifiers = ranked.map(([teamId]) => teamId).slice(0, 16);
        }

        // Ensure we have at most 16 teams
        qualifiers = qualifiers.slice(0, 16);

        if (qualifiers.length < 2) {
            throw new Error('Not enough qualified teams for championship');
        }

        // Create championship tournament
        const tournament = {
            id: this.generateId(),
            leagueId,
            sport: league.sport,
            season: league.season,
            type: 'championship',
            name: `${league.name} Championship - Season ${league.season}`,
            status: 'active',
            participants: qualifiers.map((teamId, i) => ({
                teamId,
                seed: i + 1,
                sideId: teamSideMap.get(teamId),
            })),
            matches: [],
            currentRound: 1,
            totalRounds: Math.ceil(Math.log2(qualifiers.length)),
            bracket: [],
            sideCount,
        };

        // Generate bracket: round of N (1vN, 2vN-1, etc.) - best of 5
        const round1Matches = [];
        for (let i = 0; i < qualifiers.length / 2; i++) {
            round1Matches.push({
                homeTeam: qualifiers[i],
                awayTeam: qualifiers[qualifiers.length - 1 - i],
                round: 1,
                bestOf: 5,
                firstTo: 3,
                gamesPlayed: 0,
                wins: { [qualifiers[i]]: 0, [qualifiers[qualifiers.length - 1 - i]]: 0 },
                completed: false,
                winner: null,
                nextGameDay: this.getCurrentDay() + 4,
            });
        }
        tournament.matches = round1Matches;
        tournament.bracket = [round1Matches];

        league.championshipTournamentId = tournament.id;
        this.tournaments.set(tournament.id, tournament);

        // Track tournament entry for each qualifier
        for (const teamId of qualifiers) {
            const t = this.getTeamById(teamId);
            if (t) {
                t.stats.tournamentsEntered++;
                t.stats.playoffAppearances++;
            }
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:championshipStarted', { league, tournament });
        }

        return tournament;
    }

    // ═════════════════════════════════════════════════════════════════════
    // CHAMPIONSHIP GAME PROCESSING (every 4 turns)
    // ═════════════════════════════════════════════════════════════════════

    processChampionshipGames() {
        const now = this.getCurrentDay();
        const isWorldPhase = this.seasonCycle.phase === 'worldChampionship';

        for (const [tournamentId, tournament] of this.tournaments) {
            if (tournament.status !== 'active') continue;

            // Only process tournaments matching current global phase
            if (isWorldPhase && !tournament.isWorldChampionship) continue;
            if (!isWorldPhase && tournament.isWorldChampionship) continue;

            // Handle World Championship byes - auto-advance teams with byes
            if (isWorldPhase && tournament.byeWinners && tournament.nextRoundTeams) {
                // Bye winners already in nextRoundTeams, nothing to auto-advance yet
                // They wait for round 1 winners to join them
            }

            let bracketAdvanced = false;

            for (const roundMatches of tournament.bracket) {
                for (const match of roundMatches) {
                    if (match.completed) continue;
                    if (match.nextGameDay > now) continue;

                    const team1 = this.getTeamById(match.homeTeam);
                    const team2 = this.getTeamById(match.awayTeam);
                    if (!team1 || !team2) continue;

                    const result = this.simulateMatch(team1, team2);

                    // Track best-of series
                    match.gamesPlayed++;
                    if (result.score1 > result.score2) {
                        match.wins[match.homeTeam]++;
                    } else if (result.score2 > result.score1) {
                        match.wins[match.awayTeam]++;
                    }

                    // Check series winner
                    const firstTo = match.firstTo || 3;
                    if (match.wins[match.homeTeam] >= firstTo) {
                        match.completed = true;
                        match.winner = match.homeTeam;
                        match.seriesWinner = match.homeTeam;
                        this.awardChampionshipAdvancement(tournament, match, match.homeTeam);
                    } else if (match.wins[match.awayTeam] >= firstTo) {
                        match.completed = true;
                        match.winner = match.awayTeam;
                        match.seriesWinner = match.awayTeam;
                        this.awardChampionshipAdvancement(tournament, match, match.awayTeam);
                    } else {
                        // Series continues, schedule next game in 4 days
                        match.nextGameDay = now + 4;
                    }

                    // Award XP
                    this.awardMatchXP(team1, team2, result);
                    const statResult = this.updateTeamStats(team1, team2, result);
                    this.processMatchInjuries(team1, team2, 60, statResult.outcome1, statResult.outcome2, match);
                    this.updateFansAfterGame(null, team1, team2, result);
                    this.processMatchBets(result);

                    // Store match result
                    this.matches.set(match.id || this.generateId(), {
                        ...result,
                        tournamentId,
                        series: match.round,
                        gameNumber: match.gamesPlayed,
                        isWorldChampionship: tournament.isWorldChampionship,
                    });

                    bracketAdvanced = true;
                }
            }

            // For World Championship: after round 1 completes, add bye winners to next round
            if (isWorldPhase && tournament.isWorldChampionship && bracketAdvanced) {
                const round1 = tournament.bracket[0];
                if (round1 && round1.every(m => m.completed)) {
                    const round1Winners = round1.map(m => m.seriesWinner).filter(Boolean);
                    const allNextRoundTeams = [...tournament.nextRoundTeams, ...round1Winners];

                    // Create next round (semifinals or finals)
                    const nextRoundMatches = [];
                    const numTeams = allNextRoundTeams.length;

                    if (numTeams === 2) {
                        // Finals
                        nextRoundMatches.push({
                            homeTeam: allNextRoundTeams[0],
                            awayTeam: allNextRoundTeams[1],
                            round: 2,
                            bestOf: 7,
                            firstTo: 4,
                            gamesPlayed: 0,
                            wins: { [allNextRoundTeams[0]]: 0, [allNextRoundTeams[1]]: 0 },
                            completed: false,
                            winner: null,
                            nextGameDay: now + 4,
                            isWorldChampionship: true,
                        });
                    } else if (numTeams === 4) {
                        // Semifinals
                        for (let i = 0; i < numTeams / 2; i++) {
                            nextRoundMatches.push({
                                homeTeam: allNextRoundTeams[i],
                                awayTeam: allNextRoundTeams[numTeams - 1 - i],
                                round: 2,
                                bestOf: 5,
                                firstTo: 3,
                                gamesPlayed: 0,
                                wins: { [allNextRoundTeams[i]]: 0, [allNextRoundTeams[numTeams - 1 - i]]: 0 },
                                completed: false,
                                winner: null,
                                nextGameDay: now + 4,
                                isWorldChampionship: true,
                            });
                        }
                    }

                    if (nextRoundMatches.length > 0) {
                        tournament.bracket.push(nextRoundMatches);
                        tournament.nextRoundTeams = [];
                    }
                }
            }

            // Check if all rounds complete -> champion
            const allRoundsDone = tournament.bracket.every(round =>
                round.every(m => m.completed)
            );

            if (allRoundsDone) {
                this.finishChampionship(tournament);
            }
        }
    }

    awardChampionshipAdvancement(tournament, completedMatch, winnerTeamId) {
        // World Championship advancement is handled in processChampionshipGames
        if (tournament.isWorldChampionship) return;

        // Find next round or create it
        const currentRoundIdx = tournament.bracket.length - 1;
        const currentRound = tournament.bracket[currentRoundIdx];

        // Check if all matches in current round are done
        if (!currentRound.every(m => m.completed)) return;

        const winners = currentRound.map(m => m.seriesWinner);

        if (winners.length === 1) {
            // Championship complete - this was the finals
            return;
        }

        // Create next round
        const nextRoundIdx = currentRoundIdx + 1;
        const isFinals = winners.length === 2;

        const nextRound = [];
        for (let i = 0; i < winners.length / 2; i++) {
            nextRound.push({
                homeTeam: winners[i],
                awayTeam: winners[winners.length - 1 - i],
                round: currentRound[0].round + 1,
                bestOf: isFinals ? 7 : 5,
                firstTo: isFinals ? 4 : 3,
                gamesPlayed: 0,
                wins: { [winners[i]]: 0, [winners[winners.length - 1 - i]]: 0 },
                completed: false,
                winner: null,
                nextGameDay: this.getCurrentDay() + 4,
            });
        }

        tournament.bracket.push(nextRound);

        if (isFinals) {
            // Mark that finals is best of 7
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('sports:finalsReached', { tournament, finalists: winners });
            }
        }
    }

    finishChampionship(tournament) {
        const finals = tournament.bracket[tournament.bracket.length - 1];
        const championTeamId = finals[0].seriesWinner;

        const championTeam = this.getTeamById(championTeamId);
        if (championTeam) {
            championTeam.stats.championships++;
        }

        tournament.status = 'completed';
        tournament.championTeamId = championTeamId;
        tournament.finishedDay = this.getCurrentDay();

        // Track tournament win for champion
        if (championTeam) {
            championTeam.stats.tournamentsWon++;
            if (tournament.isWorldChampionship) {
                championTeam.stats.worldTournamentsWon++;
                if (championTeam.nationId) {
                    this.updateNationTournamentWin(championTeam.nationId, tournament.sport, true);
                }
            } else {
                if (championTeam.nationId) {
                    this.updateNationTournamentWin(championTeam.nationId, tournament.sport, false);
                }
            }
        }

        // Move league to offseason
        const league = this.leagues.get(tournament.leagueId);
        if (league) {
            league.status = 'offseason';
            league.offseasonEndDay = null;

            // Track league champion for World Championship
            const existing = this.seasonCycle.leagueChampions.find(lc => lc.leagueId === tournament.leagueId);
            if (existing) {
                existing.championTeamId = championTeamId;
                existing.championTeamName = championTeam ? championTeam.name : 'Unknown';
            } else {
                this.seasonCycle.leagueChampions.push({
                    leagueId: tournament.leagueId,
                    championTeamId,
                    championTeamName: championTeam ? championTeam.name : 'Unknown',
                    sport: league.sport,
                    leagueName: league.name,
                    season: league.season,
                });
            }

            this.checkAndStartWorldChampionship();
            }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:championshipCompleted', { tournament, champion: championTeam });
        }
    }

    checkAndStartWorldChampionship() {
        if (this.seasonCycle.phase !== 'leagueChampionship') return;
        if (this.seasonCycle.worldChampionshipStarted) return;

        const allLeaguesDone = [...this.leagues.values()].every(l =>
            l.status === 'offseason' || l.status === 'completed'
        );

        const hasChampions = this.seasonCycle.leagueChampions.length > 0;

        if (allLeaguesDone && hasChampions) {
            this.startWorldChampionship();
        }
    }

    startWorldChampionship() {
        if (this.seasonCycle.worldChampionshipStarted) return;

        this.seasonCycle.worldChampionshipStarted = true;
        this.seasonCycle.phase = 'worldChampionship';
        this.seasonCycle.phaseDay = 0;
        this.seasonCycle.phaseStartDay = this.getCurrentDay();

        const champions = this.seasonCycle.leagueChampions.map(lc => lc.championTeamId).filter(Boolean);

        if (champions.length < 2) {
            this.seasonCycle.phase = 'offseason';
            this.seasonCycle.phaseDay = 0;
            this.seasonCycle.phaseStartDay = this.getCurrentDay();
            return;
        }

        const bracketSize = this.getNextPowerOfTwo(champions.length);
        const numByes = bracketSize - champions.length;

        const tournament = {
            id: this.generateId(),
            sport: null,
            season: this.seasonCycle.season,
            type: 'worldChampionship',
            name: `World Championship - Season ${this.seasonCycle.season}`,
            status: 'active',
            participants: champions.map((teamId, i) => ({
                teamId,
                seed: i + 1,
            })),
            matches: [],
            currentRound: 1,
            totalRounds: Math.log2(bracketSize),
            bracket: [],
            isWorldChampionship: true,
        };

        const seededTeams = [...champions];
        const round1Matches = [];
        const teamsWithByes = seededTeams.slice(-numByes);
        const teamsPlaying = seededTeams.slice(0, -numByes);

        for (let i = 0; i < teamsPlaying.length / 2; i++) {
            round1Matches.push({
                homeTeam: teamsPlaying[i],
                awayTeam: teamsPlaying[teamsPlaying.length - 1 - i],
                round: 1,
                bestOf: 5,
                firstTo: 3,
                gamesPlayed: 0,
                wins: { [teamsPlaying[i]]: 0, [teamsPlaying[teamsPlaying.length - 1 - i]]: 0 },
                completed: false,
                winner: null,
                nextGameDay: this.getCurrentDay() + 4,
                isWorldChampionship: true,
            });
        }

        tournament.byeWinners = teamsWithByes;
        tournament.nextRoundTeams = [...teamsWithByes];
        tournament.matches = round1Matches;
        tournament.bracket = [round1Matches];

        // Track world tournament entry for each participant
        for (const p of champions) {
            const t = this.getTeamById(p);
            if (t) t.stats.worldTournamentsEntered++;
        }

        this.tournaments.set(tournament.id, tournament);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:worldChampionshipStarted', { tournament, champions });
        }

        return tournament;
    }

    getNextPowerOfTwo(n) {
        if (n <= 1) return 1;
        let p = 1;
        while (p < n) p *= 2;
        return p;
    }

    // ══════════════════════════════════════════════════════════════════════
    // OFFSEASON -> NEXT SEASON
    // ═════════════════════════════════════════════════════════════════════

    processOffseason() {
        // Only process offseason during global offseason phase
        if (this.seasonCycle.phase !== 'offseason') return;

        const now = this.getCurrentDay();
        const offseasonLength = this.phaseLengths.offseason;

        // Check if offseason is over for all leagues
        if (now - this.seasonCycle.phaseStartDay < offseasonLength) return;

        // Advance all leagues to next season
        for (const [leagueId, league] of this.leagues) {
            if (league.status !== 'offseason') continue;

            league.status = 'draft';
            league.season = this.seasonCycle.season + 1;
            league.week = 1;
            league.offseasonEndDay = null;
            league.lastGameDay = null;
            league.schedule = [];
            league.standings = new Map();
            league.championshipTournamentId = null;

            // Advance player demographics (every 4 seasons)
            this.advanceAllPlayerDemographics(league.sport);

            // Check contract expiries and warn
            for (const t of league.teams) {
                const team = this.getTeam(t.nationId, league.sport);
                if (team) {
                    const expired = this.teamPlayerSystem.processSeasonEndContracts(team);
                    this.teamPlayerSystem.checkContractExpiries(team);
                    for (const pid of expired) {
                        const player = team.players.get(pid);
                        if (player) {
                            player.isDrafted = false;
                        }
                    }
                }
            }
        }

        // Advance global season cycle
        this.seasonCycle.season++;
        this.seasonCycle.phase = 'registration';
        this.seasonCycle.phaseDay = 0;
        this.seasonCycle.phaseStartDay = now;
        this.seasonCycle.leagueChampions = [];
        this.seasonCycle.worldChampionshipStarted = false;
        this.seasonCycle.worldChampionTeamId = null;

        // Set all waiting leagues to registration
        for (const [leagueId, league] of this.leagues) {
            if (league.status === 'waiting') {
                league.status = 'registration';
            }
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:newGlobalSeason', { season: this.seasonCycle.season });
        }
    }

    advanceAllPlayerDemographics(sport) {
        for (const [nationId, sports] of this.teams) {
            for (const [sp, team] of Object.entries(sports)) {
                if (sp !== sport) continue;
                for (const [playerId, player] of team.players) {
                    this.teamPlayerSystem.advanceDemographics(player);
                }
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // TEAM CREATION (empty roster - no auto players)
    // ═════════════════════════════════════════════════════════════════════

    createTeam(data) {
        const { nationId, sport, teamName, leagueId } = data;

        if (!this.canCreateTeam(nationId, sport)) {
            throw new Error(`Cannot create ${sport} team - stadium wonder required`);
        }

        if (!this.teams.has(nationId)) {
            this.teams.set(nationId, {});
        }

        const team = new Team({
            id: this.generateId(),
            nationId,
            sport,
            name: teamName || `${sport.charAt(0).toUpperCase() + sport.slice(1)} Team`,
            founded: Date.now(),
            leagueId: leagueId || null,
        });

        this.teams.get(nationId)[sport] = team;

        // Add 100 players to this sport's global draft board when a team unlocks
        this.draftSystem.addPlayersForTeamUnlock(sport);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:teamCreated', { nationId, sport, team, leagueId });
        }

        return team;
    }

    canCreateTeam(nationId, sport) {
        const nation = this.getNation(nationId);
        if (!nation) return false;
        return this.hasStadiumWonder(nationId, sport);
    }

    // ═════════════════════════════════════════════════════════════════════
    // STADIUM UPGRADES (new 7 types)
    // ═════════════════════════════════════════════════════════════════════

    upgradeStadium(data) {
        const { nationId, sport, upgradeType } = data;
        const team = this.getTeam(nationId, sport);

        if (!team) throw new Error('Team not found');

        const key = this.upgradeKeyMap[upgradeType];
        if (!key) throw new Error('Unknown stadium upgrade');

        const currentLevel = team.stadium[key];
        if (currentLevel === undefined) throw new Error('Unknown stadium upgrade');
        if (currentLevel >= 10) throw new Error('Maximum upgrade level reached');

        const cost = this.getUpgradeCost(upgradeType, currentLevel + 1);
        const nation = this.getNation(nationId);

        if (!nation) throw new Error('Nation not found');
        if (nation.money < cost) throw new Error('Insufficient nation funds for upgrade');

        // Technology Center requires nation tech level
        if (upgradeType === 'Technology Center') {
            const requiredTech = (currentLevel + 1) * 100;
            if (nation.tech < requiredTech) {
                throw new Error(`Technology Center level ${currentLevel + 1} requires ${requiredTech} nation technology`);
            }
        }

        // Pay for upgrade
        nation.money -= cost;
        team.stadium[key]++;

        // Update capacity from seating
        if (upgradeType === 'Seating') {
            team.stadiumCapacity = team.stadium.seating * 5000; // 5000 seats per level
        }

        // Apply upgrade effects
        this.applyUpgradeEffects(team, upgradeType);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:stadiumUpgraded', { nationId, sport, upgradeType, level: team.stadium[key] });
        }

        return true;
    }

    getUpgradeCost(upgradeType, level) {
        const baseCosts = {
            'Seating': 1000000,
            'Gym': 2000000,
            'Medical Center': 3000000,
            'Youth Academy': 2500000,
            'Fan Experience': 1500000,
            'Concessions': 2000000,
            'Technology Center': 5000000,
        };

        return baseCosts[upgradeType] * Math.pow(1.5, level - 1);
    }

    applyUpgradeEffects(team, upgradeType) {
        const key = this.upgradeKeyMap[upgradeType];
        const level = team.stadium[key];

        switch (upgradeType) {
            case 'Seating':
                team.stadiumCapacity = level * 5000;
                break;
            case 'Gym':
                team.gymBonus = level * 0.1;
                break;
            case 'Medical Center':
                team.medicalBonus = level * 0.1;
                break;
            case 'Youth Academy':
                team.youthAcademyBonus = level;
                break;
            case 'Fan Experience':
                team.fanExperienceBonus = level * 0.1;
                break;
            case 'Concessions':
                team.concessionsBonus = level * 0.1;
                break;
            case 'Technology Center':
                team.technologyBonus = level * 0.05;
                break;
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // PLAYER MANAGEMENT (delegated to TeamPlayerSystem)
    // ═════════════════════════════════════════════════════════════════════

    signPlayer(data) {
        const { nationId, sport, playerId } = data;
        const team = this.getTeam(nationId, sport);
        if (!team) throw new Error('Team not found');

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        return this.teamPlayerSystem.signPlayer(team, playerId, nation);
    }

    releasePlayer(data) {
        const { nationId, sport, playerId } = data;
        const team = this.getTeam(nationId, sport);
        if (!team) throw new Error('Team not found');

        return this.teamPlayerSystem.releasePlayer(team, playerId);
    }

    setStarter(data) {
        const { nationId, sport, position, playerId } = data;
        const team = this.getTeam(nationId, sport);
        if (!team) throw new Error('Team not found');

        return this.teamPlayerSystem.setStarter(team, position, playerId);
    }

    setSub(data) {
        const { nationId, sport, position, playerId, add = true } = data;
        const team = this.getTeam(nationId, sport);
        if (!team) throw new Error('Team not found');

        return this.teamPlayerSystem.setSub(team, position, playerId, add);
    }

    trainPlayer(data) {
        const { nationId, sport, playerId, attribute } = data;
        const team = this.getTeam(nationId, sport);
        if (!team) throw new Error('Team not found');

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        return this.teamPlayerSystem.trainPlayer(team, playerId, attribute, nation);
    }

    extendContract(data) {
        const { nationId, sport, playerId, seasons } = data;
        const team = this.getTeam(nationId, sport);
        if (!team) throw new Error('Team not found');

        const player = team.players.get(playerId);
        if (!player) throw new Error('Player not on team');

        const nation = this.getNation(nationId);
        if (!nation) throw new Error('Nation not found');

        return this.teamPlayerSystem.extendContract(player, seasons, nation);
    }

    // ═════════════════════════════════════════════════════════════════════
    // PLAYER TRADES
    // ═════════════════════════════════════════════════════════════════════

    tradePlayers(data) {
        const { nationIdA, sportA, playerIdA, nationIdB, sportB, playerIdB } = data;

        const teamA = this.getTeam(nationIdA, sportA);
        const teamB = this.getTeam(nationIdB, sportB);

        if (!teamA) throw new Error('Team A not found');
        if (!teamB) throw new Error('Team B not found');

        const playerA = teamA.players.get(playerIdA);
        const playerB = teamB.players.get(playerIdB);
        if (!playerA) throw new Error('Player A not on team A');
        if (!playerB) throw new Error('Player B not on team B');

        // Validate salaries
        const nationA = this.getNation(nationIdA);
        const nationB = this.getNation(nationIdB);
        if (!nationA || !nationB) throw new Error('Nation not found');

        // Execute trade: release both, then sign cross-team
        this.teamPlayerSystem.releasePlayer(teamA, playerIdA);
        this.teamPlayerSystem.releasePlayer(teamB, playerIdB);

        playerA.joinedDate = Date.now();
        playerB.joinedDate = Date.now();

        this.teamPlayerSystem.signPlayer(teamB, playerIdA, nationA);
        this.teamPlayerSystem.signPlayer(teamA, playerIdB, nationB);

        // Remove players from draft boards if they were there
        this.draftSystem.removePlayerFromBoard(playerIdA);
        this.draftSystem.removePlayerFromBoard(playerIdB);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:playersTraded', {
                teamA: teamA.id,
                teamB: teamB.id,
                playerA,
                playerB,
                nationIdA,
                nationIdB,
            });
        }

        return { playerA, playerB };
    }

    getLeagueForTeam(teamId) {
        for (const [leagueId, league] of this.leagues) {
            if (league.teams.some(t => t.teamId === teamId)) return league;
        }
        return null;
    }

    simulateMatch(team1, team2) {
        const match = {
            id: this.generateId(),
            team1: team1.id,
            team2: team2.id,
            date: Date.now(),
            sport: team1.sport,
            score1: 0,
            score2: 0,
            events: [],
            stats: { [team1.id]: {}, [team2.id]: {} },
            status: 'completed',
        };

        const strength1 = this.calculateTeamStrength(team1);
        const strength2 = this.calculateTeamStrength(team2);

        switch (team1.sport) {
            case 'basketball':
                this.simulateBasketball(match, team1, team2, strength1, strength2);
                break;
            case 'hockey':
                this.simulateHockey(match, team1, team2, strength1, strength2);
                break;
            case 'soccer':
                this.simulateSoccer(match, team1, team2, strength1, strength2);
                break;
            case 'football':
                this.simulateFootball(match, team1, team2, strength1, strength2);
                break;
        }

        this.matches.set(match.id, match);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:matchCompleted', { match, team1, team2 });
        }

        return match;
    }

    calculateTeamStrength(team) {
        let totalStrength = 0;
        let playerCount = 0;
        const countedPlayers = new Set();

        // Starters count more than subs
        team.roster.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player && !player.isInjured && !countedPlayers.has(playerId)) {
                countedPlayers.add(playerId);
                totalStrength += this.calculatePlayerRating(player) * 1.2;
                playerCount++;
            }
        });

        // Subs count at normal weight (only if not already counted as starter)
        team.subs.forEach(ids => {
            ids.forEach(playerId => {
                const player = this.players.get(playerId);
                if (player && !player.isInjured && !countedPlayers.has(playerId)) {
                    countedPlayers.add(playerId);
                    totalStrength += this.calculatePlayerRating(player);
                    playerCount++;
                }
            });
        });

        const baseStrength = playerCount > 0 ? totalStrength / playerCount : 50;

        // Coach bonus (placeholder - no coach in new system, use a small base)
        const coachBonus = 0.05;

        // Stadium bonuses
        const gymBonus = team.gymBonus || 0;
        const techBonus = team.technologyBonus || 0;

        return baseStrength * (1 + coachBonus + gymBonus + techBonus);
    }

    calculatePlayerRating(player) {
        const values = Object.values(player.attributes);
        const avgAttribute = values.reduce((a, b) => a + b, 0) / values.length;

        // Age factor
        let ageFactor = 1.0;
        if (player.age < 22) ageFactor = 0.8 + (player.age - 18) * 0.05;
        else if (player.age > 30) ageFactor = 1.0 - (player.age - 30) * 0.03;

        const moraleFactor = player.morale / 100;
        return avgAttribute * ageFactor * moraleFactor;
    }

    simulateBasketball(match, team1, team2, strength1, strength2) {
        for (let quarter = 1; quarter <= 4; quarter++) {
            for (let minute = 1; minute <= 12; minute++) {
                const roll = Math.random();
                if (roll < 0.15) {
                    const scoringTeam = Math.random() < (strength1 / (strength1 + strength2)) ? team1 : team2;
                    const points = Math.random() < 0.3 ? 3 : 2;
                    if (scoringTeam === team1) match.score1 += points;
                    else match.score2 += points;
                    match.events.push({ minute: (quarter - 1) * 12 + minute, team: scoringTeam.id, type: points === 3 ? '3-pointer' : 'field goal', points });
                } else if (roll < 0.25) {
                    // Steal
                    const stealTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (quarter - 1) * 12 + minute, team: stealTeam.id, type: 'steal' });
                } else if (roll < 0.35) {
                    // Rebound
                    const rebTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (quarter - 1) * 12 + minute, team: rebTeam.id, type: 'rebound' });
                } else if (roll < 0.45) {
                    // Shot attempt
                    const shotTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (quarter - 1) * 12 + minute, team: shotTeam.id, type: 'shot' });
                } else if (roll < 0.55) {
                    // Block
                    const blockTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (quarter - 1) * 12 + minute, team: blockTeam.id, type: 'block' });
                }
            }
        }
        if (match.score1 === match.score2) {
            for (let minute = 1; minute <= 5; minute++) {
                if (Math.random() < 0.2) {
                    const scoringTeam = Math.random() < 0.5 ? team1 : team2;
                    const points = Math.random() < 0.25 ? 3 : 2;
                    if (scoringTeam === team1) match.score1 += points;
                    else match.score2 += points;
                    if (match.score1 !== match.score2) break;
                }
            }
        }
    }

    simulateHockey(match, team1, team2, strength1, strength2) {
        for (let period = 1; period <= 3; period++) {
            for (let minute = 1; minute <= 20; minute++) {
                const roll = Math.random();
                if (roll < 0.08) {
                    const scoringTeam = Math.random() < (strength1 / (strength1 + strength2)) ? team1 : team2;
                    if (scoringTeam === team1) match.score1++;
                    else match.score2++;
                    match.events.push({ minute: (period - 1) * 20 + minute, team: scoringTeam.id, type: 'goal' });
                } else if (roll < 0.18) {
                    // Shot
                    const shotTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (period - 1) * 20 + minute, team: shotTeam.id, type: 'shot' });
                } else if (roll < 0.25) {
                    // Block
                    const blockTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (period - 1) * 20 + minute, team: blockTeam.id, type: 'block' });
                } else if (roll < 0.28) {
                    // Fight
                    const fightTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({ minute: (period - 1) * 20 + minute, team: fightTeam.id, type: 'fight' });
                }
            }
        }
        if (match.score1 === match.score2) {
            if (Math.random() < 0.5) {
                const winner = Math.random() < 0.5 ? team1 : team2;
                if (winner === team1) match.score1++;
                else match.score2++;
                match.events.push({ minute: 65, team: winner.id, type: 'overtime goal' });
            }
        }
    }

    simulateSoccer(match, team1, team2, strength1, strength2) {
        const totalMinutes = 90 + Math.floor(Math.random() * 8);
        for (let minute = 1; minute <= totalMinutes; minute++) {
            const roll = Math.random();
            if (roll < 0.03) {
                const scoringTeam = Math.random() < (strength1 / (strength1 + strength2)) ? team1 : team2;
                if (scoringTeam === team1) match.score1++;
                else match.score2++;
                match.events.push({ minute: minute, team: scoringTeam.id, type: 'goal' });
            } else if (roll < 0.06) {
                // Steal
                const stealTeam = Math.random() < 0.5 ? team1 : team2;
                match.events.push({ minute: minute, team: stealTeam.id, type: 'steal' });
            }
        }
    }

    simulateFootball(match, team1, team2, strength1, strength2) {
        // 4 quarters of 15 minutes each
        const totalStrength = strength1 + strength2;
        const team1Chance = strength1 / totalStrength;

        for (let quarter = 1; quarter <= 4; quarter++) {
            for (let minute = 1; minute <= 15; minute++) {
                const roll = Math.random();
                if (roll < 0.05) {
                    // Interception
                    const intTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({
                        minute: (quarter - 1) * 15 + minute,
                        team: intTeam.id,
                        type: 'interception',
                        quarter,
                    });
                } else if (roll < 0.12) {
                    // Pass completion
                    const passTeam = Math.random() < 0.5 ? team1 : team2;
                    match.events.push({
                        minute: (quarter - 1) * 15 + minute,
                        team: passTeam.id,
                        type: 'pass',
                        quarter,
                    });
                } else if (roll < 0.18) {
                    // Drive chance - scoring play
                    const scoringTeam = Math.random() < team1Chance ? team1 : team2;
                    const isTeam1 = scoringTeam === team1;

                    // Determine scoring play type
                    const playRoll = Math.random();
                    let points = 0;
                    let type = '';

                    if (playRoll < 0.55) {
                        // Touchdown (6 points) + extra point attempt (1 point)
                        points = 6;
                        type = 'touchdown';
                        if (Math.random() < 0.94) {
                            points += 1;
                            match.events.push({
                                minute: (quarter - 1) * 15 + minute + 1,
                                team: scoringTeam.id,
                                type: 'extra point',
                                quarter,
                            });
                        } else if (Math.random() < 0.40) {
                            // 2-point conversion attempt
                            match.events.push({
                                minute: (quarter - 1) * 15 + minute + 1,
                                team: scoringTeam.id,
                                type: '2-point conversion',
                                quarter,
                            });
                        }
                    } else if (playRoll < 0.75) {
                        // Field goal (3 points)
                        points = 3;
                        type = 'field goal';
                    } else if (playRoll < 0.82) {
                        // Safety (2 points)
                        points = 2;
                        type = 'safety';
                    } else {
                        // Turnover - no points
                        type = 'turnover';
                    }

                    if (type !== 'turnover') {
                        if (isTeam1) match.score1 += points;
                        else match.score2 += points;
                        match.events.push({
                            minute: (quarter - 1) * 15 + minute,
                            team: scoringTeam.id,
                            type,
                            points,
                            quarter,
                        });
                    }
                }
            }
        }
    }

    updateTeamStats(team1, team2, match) {
        if (match.score1 > match.score2) {
            team1.stats.wins++; team2.stats.losses++;
        } else if (match.score2 > match.score1) {
            team2.stats.wins++; team1.stats.losses++;
        } else {
            team1.stats.draws++; team2.stats.draws++;
        }

        const outcome1 = match.score1 > match.score2 ? 'win' : (match.score2 > match.score1 ? 'loss' : 'draw');
        const outcome2 = match.score2 > match.score1 ? 'win' : (match.score1 > match.score2 ? 'loss' : 'draw');

        team1.players.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player) {
                player.gamesPlayed++;
                player.consecutiveGamesPlayed = (player.consecutiveGamesPlayed || 0) + 1;
            }
        });
        team2.players.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player) {
                player.gamesPlayed++;
                player.consecutiveGamesPlayed = (player.consecutiveGamesPlayed || 0) + 1;
            }
        });

        // Accumulate sport-specific scoring stats
        this.accumulateSportStats(team1, match);
        this.accumulateSportStats(team2, match);

        // Track nation-level sport stats (coach rating)
        if (team1.nationId) {
            const won1 = match.score1 > match.score2;
            this.updateNationSportStats(team1.nationId, match.sport, won1);
        }
        if (team2.nationId) {
            const won2 = match.score2 > match.score1;
            this.updateNationSportStats(team2.nationId, match.sport, won2);
        }

        return { outcome1, outcome2 };
    }

    accumulateSportStats(team, match) {
        const sport = match.sport;
        const isTeam1 = match.team1 === team.id;
        const score = isTeam1 ? match.score1 : match.score2;

        // Universal win/loss already handled in updateTeamStats

        switch (sport) {
            case 'football':
                for (const ev of match.events || []) {
                    if (ev.type === 'touchdown') team.stats.touchdowns++;
                    else if (ev.type === 'field goal') team.stats.fieldGoals++;
                    else if (ev.type === 'extra point') team.stats.extraPoints++;
                    else if (ev.type === '2-point conversion') team.stats.conversions2pt++;
                    else if (ev.type === 'interception') team.stats.interceptions++;
                    else if (ev.type === 'pass') team.stats.passes++;
                }
                break;
            case 'hockey':
                for (const ev of match.events || []) {
                    if (ev.type === 'goal') team.stats.hockeyPoints++;
                    else if (ev.type === 'shot') team.stats.hockeyShots++;
                    else if (ev.type === 'block') team.stats.hockeyBlocks++;
                    else if (ev.type === 'fight') team.stats.fights++;
                }
                break;
            case 'soccer':
                for (const ev of match.events || []) {
                    if (ev.type === 'goal') team.stats.soccerPoints++;
                    else if (ev.type === 'steal') team.stats.soccerSteals++;
                }
                break;
            case 'basketball':
                for (const ev of match.events || []) {
                    if (ev.type === 'field goal') team.stats.basketballPoints += ev.points || 2;
                    else if (ev.type === '3-pointer') team.stats.basketballPoints += 3;
                    else if (ev.type === 'steal') team.stats.basketballSteals++;
                    else if (ev.type === 'rebound') team.stats.rebounds++;
                    else if (ev.type === 'shot') team.stats.basketballShots++;
                    else if (ev.type === 'block') team.stats.basketballBlocks++;
                }
                break;
        }

        // Track injuries suffered this match
        const injuriesThisMatch = match.events
            .filter(ev => ev.type === 'injury')
            .length;
        if (injuriesThisMatch > 0) {
            team.stats.totalInjuries += injuriesThisMatch;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NATION-LEVEL SPORT STATS (coach rating per sport + overall)
    // ════════════════════════════════════════════════════════════════════════

    initNationSportStats(nationId) {
        if (this.nationSportStats.has(nationId)) return;
        this.nationSportStats.set(nationId, {
            basketball: { wins: 0, losses: 0, tournamentsWon: 0, worldTournamentsWon: 0 },
            hockey: { wins: 0, losses: 0, tournamentsWon: 0, worldTournamentsWon: 0 },
            soccer: { wins: 0, losses: 0, tournamentsWon: 0, worldTournamentsWon: 0 },
            football: { wins: 0, losses: 0, tournamentsWon: 0, worldTournamentsWon: 0 },
            overall: { wins: 0, losses: 0, tournamentsWon: 0, worldTournamentsWon: 0 },
        });
    }

    updateNationSportStats(nationId, sport, won) {
        this.initNationSportStats(nationId);
        const stats = this.nationSportStats.get(nationId);
        const s = stats[sport] || stats.overall;
        if (won) s.wins++; else s.losses++;
        stats.overall.wins += s.wins; // recompute overall from scratch below
        // Recompute overall from individual sports to avoid double counting
        stats.overall.wins = 0;
        stats.overall.losses = 0;
        stats.overall.tournamentsWon = 0;
        stats.overall.worldTournamentsWon = 0;
        for (const sp of this.sportTypes) {
            const spStats = stats[sp];
            stats.overall.wins += spStats.wins;
            stats.overall.losses += spStats.losses;
            stats.overall.tournamentsWon += spStats.tournamentsWon;
            stats.overall.worldTournamentsWon += spStats.worldTournamentsWon;
        }
    }

    updateNationTournamentWin(nationId, sport, isWorld) {
        this.initNationSportStats(nationId);
        const stats = this.nationSportStats.get(nationId);
        if (isWorld) {
            stats[sport].worldTournamentsWon++;
            stats.overall.worldTournamentsWon++;
        } else {
            stats[sport].tournamentsWon++;
            stats.overall.tournamentsWon++;
        }
    }

    getNationSportStats(nationId, sport) {
        this.initNationSportStats(nationId);
        if (sport) return this.nationSportStats.get(nationId)[sport];
        return this.nationSportStats.get(nationId);
    }

    getNationCoachRating(nationId, sport) {
        this.initNationSportStats(nationId);
        const stats = this.nationSportStats.get(nationId);
        const s = stats[sport] || stats.overall;
        const total = s.wins + s.losses;
        if (total === 0) return 0;
        const winComponent = (s.wins / total) * 60;
        const tournamentComponent = Math.min(
            (s.tournamentsWon + s.worldTournamentsWon) * 10,
            40
        );
        return Math.round(winComponent + tournamentComponent);
    }

    getNationOverallCoachRating(nationId) {
        return this.getNationCoachRating(nationId, 'overall');
    }

    // ═════════════════════════════════════════════════════════════════════
    // INJURIES
    // ═════════════════════════════════════════════════════════════════════

    processMatchInjuries(team1, team2, minutesPlayed = 60, outcome1 = 'draw', outcome2 = 'draw', match = null) {
        const matchups = [
            { team: team1, opposing: team2, outcome: outcome1 },
            { team: team2, opposing: team1, outcome: outcome2 },
        ];
        matchups.forEach(({ team, opposing, outcome }) => {
            team.players.forEach(playerId => {
                const player = this.players.get(playerId);
                if (player && !player.isInjured && !player.isRetired) {
                    const result = this.teamPlayerSystem.inflictInjury(team, playerId, minutesPlayed, outcome, opposing);
                    if (result) {
                        console.log(`Injury: ${player.name} (${team.sport}) - ${result.type} (${result.description}), risk: ${result.riskScore.toFixed(2)}`);
                        if (match) {
                            match.events.push({
                                minute: 0,
                                team: team.id,
                                type: 'injury',
                                description: result.description,
                                risk: result.riskScore,
                            });
                        }
                    }
                }
            });
        });
    }

    processInjuries() {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                this.teamPlayerSystem.healInjuries(team);
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // BETTING
    // ═════════════════════════════════════════════════════════════════════

    placeBet(data) {
        const { bettorId, matchId, betType, amount, prediction } = data;

        const match = this.matches.get(matchId);
        if (!match) throw new Error('Match not found');

        const nation = this.getNation(bettorId);
        if (!nation || nation.money < amount) throw new Error('Insufficient funds');

        const bet = {
            id: this.generateId(),
            bettorId,
            matchId,
            betType,
            amount,
            prediction,
            odds: this.calculateOdds(match, betType, prediction),
            timestamp: Date.now(),
            status: 'pending',
        };

        nation.money -= amount;
        this.bets.set(bet.id, bet);

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:betPlaced', { bet });
        }

        return bet;
    }

    calculateOdds(match, betType, prediction) {
        const team1 = this.getTeamById(match.team1);
        const team2 = this.getTeamById(match.team2);

        if (!team1 || !team2) return 2.0;

        const strength1 = this.calculateTeamStrength(team1);
        const strength2 = this.calculateTeamStrength(team2);
        const total = strength1 + strength2;

        switch (betType) {
            case 'winner':
                if (prediction === match.team1) return total / Math.max(strength1, 1);
                if (prediction === match.team2) return total / Math.max(strength2, 1);
                return 4.0; // draw
            case 'over_under':
                return 1.8 + Math.random() * 0.4;
            case 'score':
                return 5 + Math.random() * 10;
            default:
                return 2.0;
        }
    }

    processMatchBets(match) {
        for (const [betId, bet] of this.bets) {
            if (bet.matchId === match.id && bet.status === 'pending') {
                const won = this.checkBetResult(bet, match);
                bet.status = won ? 'won' : 'lost';

                if (won) {
                    const winnings = bet.amount * bet.odds;
                    const nation = this.getNation(bet.bettorId);
                    if (nation) nation.money += winnings;
                    bet.winnings = winnings;
                }

                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sports:betResolved', { bet, won });
                }
            }
        }
    }

    checkBetResult(bet, match) {
        switch (bet.betType) {
            case 'winner':
                if (match.score1 > match.score2 && bet.prediction === match.team1) return true;
                if (match.score2 > match.score1 && bet.prediction === match.team2) return true;
                if (match.score1 === match.score2 && bet.prediction === 'draw') return true;
                return false;
            case 'over_under':
                const totalScore = match.score1 + match.score2;
                return bet.prediction.type === 'over' ? totalScore > bet.prediction.line : totalScore < bet.prediction.line;
            case 'score':
                return match.score1 === bet.prediction.score1 && match.score2 === bet.prediction.score2;
            default:
                return false;
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // DAILY TURN PROCESSING (called by server each game day)
    // ═════════════════════════════════════════════════════════════════════

    // Advance the global season cycle based on days elapsed in current phase
    advanceSeasonCycle() {
        const now = this.getCurrentDay();
        const daysInPhase = now - this.seasonCycle.phaseStartDay;
        const phaseLength = this.phaseLengths[this.seasonCycle.phase] || 0;

        switch (this.seasonCycle.phase) {
            case 'registration':
                if (daysInPhase >= this.phaseLengths.registration) {
                    this.seasonCycle.phase = 'draft';
                    this.seasonCycle.phaseDay = 0;
                    this.seasonCycle.phaseStartDay = now;
                }
                break;

            case 'draft':
                if (daysInPhase >= this.phaseLengths.draft) {
                    // Auto-start all draft leagues that have full rosters
                    for (const [leagueId, league] of this.leagues) {
                        if (league.status === 'draft' && this.canStartSeason(league)) {
                            league.status = 'active';
                            league.season = this.seasonCycle.season;
                            league.week = 1;
                            league.lastGameDay = now;
                            this.generateSeasonSchedule(league);
                        }
                    }
                    this.seasonCycle.phase = 'active';
                    this.seasonCycle.phaseDay = 0;
                    this.seasonCycle.phaseStartDay = now;
                }
                break;

            case 'active':
                if (daysInPhase >= this.phaseLengths.active) {
                    this.seasonCycle.phase = 'leagueChampionship';
                    this.seasonCycle.phaseDay = 0;
                    this.seasonCycle.phaseStartDay = now;
                    // End regular season for all active leagues
                    for (const [leagueId, league] of this.leagues) {
                        if (league.status === 'active') {
                            league.status = 'championship';
                            this.startChampionship(leagueId);
                        }
                    }
                }
                break;

            case 'leagueChampionship':
                // Check if all league championships are done
                const allDone = [...this.leagues.values()].every(l =>
                    l.status === 'offseason' || l.status === 'completed'
                );
                if (allDone && this.seasonCycle.leagueChampions.length > 0) {
                    this.seasonCycle.phase = 'worldChampionship';
                    this.seasonCycle.phaseDay = 0;
                    this.seasonCycle.phaseStartDay = now;
                    this.startWorldChampionship();
                }
                break;

            case 'worldChampionship':
                // Check if world championship is done
                const worldDone = [...this.tournaments.values()].every(t =>
                    t.type !== 'worldChampionship' || t.status === 'completed'
                );
                if (worldDone) {
                    this.seasonCycle.phase = 'offseason';
                    this.seasonCycle.phaseDay = 0;
                    this.seasonCycle.phaseStartDay = now;
                }
                break;

            case 'offseason':
                // Handled by processOffseason()
                break;
        }
    }

    turn(at, day) {
        // Daily player development, retirement, injuries, revenue
        const retiredPlayers = [];
        for (const [playerId, player] of this.players) {
            if (!player.isRetired) {
                this.teamPlayerSystem.processPlayerDevelopment(player);
                this.teamPlayerSystem.checkRetirement(player);
                if (player.isRetired) retiredPlayers.push(player);
            }
        }
        this.processInjuries();

        // Regenerate players for sports where retirements occurred
        const sportsWithRetirements = new Set();
        for (const player of retiredPlayers) {
            sportsWithRetirements.add(player.sport);
        }
        for (const sport of sportsWithRetirements) {
            this.draftSystem.regenerateRetiredPlayers(sport);
        }

        // Drive global season cycle
        this.advanceSeasonCycle();

        // Process based on current global phase
        switch (this.seasonCycle.phase) {
            case 'active':
                this.processDailyGames();
                break;
            case 'leagueChampionship':
                this.processChampionshipGames();
                break;
            case 'worldChampionship':
                this.processChampionshipGames();
                break;
            case 'offseason':
                this.processOffseason();
                break;
        }
    }

    process(at) {
        // Tournament/championship match processing (called by world advance)
        this.processChampionshipGames();
    }

    // ═════════════════════════════════════════════════════════════════════
    // UTILITY
    // ═════════════════════════════════════════════════════════════════════

    getTeam(nationId, sport) {
        const nationTeams = this.teams.get(nationId);
        return nationTeams ? nationTeams[sport] : null;
    }

    getTeamById(teamId) {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                if (team.id === teamId) return team;
            }
        }
        return null;
    }

    getPlayerTeam(playerId) {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                if (team.players.has(playerId)) return team;
            }
        }
        return null;
    }

    getNation(nationId) {
        if (typeof window !== 'undefined' && window.gameEngine?.currentPlayer?.nation) {
            const currentNation = window.gameEngine.currentPlayer.nation;
            if (currentNation.id === nationId || !currentNation.id) return currentNation;
        }
        // Server-side: try to find via DataManager or world
        if (typeof window !== 'undefined' && window.DataManager?.currentPlayer) {
            return window.DataManager.currentPlayer.nations?.find(n => n.id === nationId) || window.Nation;
        }
        return null;
    }

    hasStadiumWonder(nationId, sport) {
        const wondersSystem = window.gameEngine?.systems?.wonders;
        if (!wondersSystem) return false;
        const wonderMap = { basketball: 'basketballStadium', hockey: 'hockeyStadium', soccer: 'soccerStadium', football: 'footballStadium' };
        return wondersSystem.hasWonder(nationId, wonderMap[sport]);
    }

    getCurrentDay() {
        if (typeof window !== 'undefined' && window.GameTime) {
            return window.GameTime.getTime().totalDays;
        }
        return 0;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    getAvailableSports(nationId) {
        const available = [];
        for (const sport of this.sportTypes) {
            if (this.hasStadiumWonder(nationId, sport)) available.push(sport);
        }
        return available;
    }

    // ═════════════════════════════════════════════════════════════════════
    // SAVE / LOAD
    // ═════════════════════════════════════════════════════════════════════

    getState() {
        const teamsSerializable = {};
        for (const [nationId, sports] of this.teams) {
            teamsSerializable[nationId] = {};
            for (const [sport, team] of Object.entries(sports)) {
                teamsSerializable[nationId][sport] = {
                    id: team.id,
                    nationId: team.nationId,
                    sport: team.sport,
                    name: team.name,
                    stadium: team.stadium,
                    stadiumCapacity: team.stadiumCapacity,
                    players: [...team.players.entries()],
                    roster: [...team.roster.entries()],
                    subs: [...team.subs.entries()],
                    revenue: team.revenue,
                    expenses: team.expenses,
                    stats: team.stats,
                    fans: team.fans,
                    fanLoyalty: team.fanLoyalty,
                    currentSeason: team.currentSeason,
                    currentWeek: team.currentWeek,
                    leagueId: team.leagueId,
                    injuries: [...team.injuries.entries()],
                };
            }
        }

        return {
            teams: teamsSerializable,
            players: [...this.players.entries()],
            leagues: [...this.leagues.entries()],
            tournaments: [...this.tournaments.entries()],
            matches: [...this.matches.entries()],
            bets: [...this.bets.entries()],
            seasonCycle: this.seasonCycle,
            nationSportStats: [...this.nationSportStats.entries()],
            draftBoards: this.draftSystem ? [...this.draftSystem.draftBoards.entries()] : [],
        };
    }

    setState(state) {
        if (!state) return;

        this.teams = new Map();
        if (state.teams) {
            for (const [nationId, sports] of Object.entries(state.teams)) {
                this.teams.set(nationId, {});
                for (const [sport, data] of Object.entries(sports)) {
                    const team = new Team({
                        id: data.id,
                        nationId: data.nationId,
                        sport: data.sport,
                        name: data.name,
                        founded: Date.now(),
                        leagueId: data.leagueId,
                    });
                    team.stadium = data.stadium || { seating: 0, gym: 0, medicalCenter: 0, youthAcademy: 0, fanExperience: 0, concessions: 0, technologyCenter: 0 };
                    team.stadiumCapacity = data.stadiumCapacity || 0;
                    team.gymBonus = data.gymBonus || 0;
                    team.medicalBonus = data.medicalBonus || 0;
                    team.youthAcademyBonus = data.youthAcademyBonus || 0;
                    team.fanExperienceBonus = data.fanExperienceBonus || 0;
                    team.concessionsBonus = data.concessionsBonus || 0;
                    team.technologyBonus = data.technologyBonus || 0;
                    team.players = new Map(data.players || []);
                    team.roster = new Map(data.roster || []);
                    team.subs = new Map(data.subs || []);
                    team.revenue = data.revenue || 0;
                    team.expenses = data.expenses || 0;
                    team.stats = data.stats || { wins: 0, losses: 0, draws: 0, totalInjuries: 0, championships: 0, playoffAppearances: 0, tournamentsEntered: 0, tournamentsWon: 0, worldTournamentsEntered: 0, worldTournamentsWon: 0, interceptions: 0, passes: 0, touchdowns: 0, conversions2pt: 0, extraPoints: 0, fieldGoals: 0, fights: 0, hockeyPoints: 0, hockeyShots: 0, hockeyBlocks: 0, soccerPoints: 0, soccerSteals: 0, basketballSteals: 0, rebounds: 0, basketballPoints: 0, basketballShots: 0, basketballBlocks: 0 };
                    team.fans = data.fans || 0;
                    team.fanLoyalty = data.fanLoyalty || 50;
                    team.currentSeason = data.currentSeason || 1;
                    team.currentWeek = data.currentWeek || 1;
                    team.leagueId = data.leagueId || null;
                    team.injuries = new Map(data.injuries || []);
                    this.teams.get(nationId)[sport] = team;
                }
            }
        }

        this.players = new Map(state.players || []);
        this.leagues = new Map(state.leagues || []);
        this.tournaments = new Map(state.tournaments || []);
        this.matches = new Map(state.matches || []);
        this.bets = new Map(state.bets || []);
        if (state.seasonCycle) {
            this.seasonCycle = state.seasonCycle;
        }
        if (state.nationSportStats) {
            this.nationSportStats = new Map(state.nationSportStats);
        }
        if (this.draftSystem) {
            this.draftSystem.draftBoards = new Map(state.draftBoards || []);
        }
    }

    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off('sports:createTeam');
            EventBus.off('sports:upgradeStadium');
            EventBus.off('sports:signPlayer');
            EventBus.off('sports:releasePlayer');
            EventBus.off('wonder_built', this.onWonderBuilt);
            EventBus.off('wonder_demolished', this.onWonderDemolished);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsSystem;
} else if (typeof window !== 'undefined') {
    window.SportsSystem = SportsSystem;
}
