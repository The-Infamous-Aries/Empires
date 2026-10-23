/**
 * Sports Management System
 * Handles team ownership, player management, tournaments, and gambling
 * Unlocked through Stadium Wonders (Basketball, Hockey, Soccer)
 */

class SportsSystem {
    constructor() {
        this.teams = new Map(); // nationId -> { basketball: team, hockey: team, soccer: team }
        this.players = new Map(); // playerId -> player object
        this.tournaments = new Map(); // tournamentId -> tournament object
        this.matches = new Map(); // matchId -> match object
        this.bets = new Map(); // betId -> bet object
        this.seasonData = new Map(); // sport -> season info
        
        this.sportTypes = ['basketball', 'hockey', 'soccer'];
        this.playerPositions = {
            basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
            hockey: ['Goalkeeper', 'Left Defense', 'Right Defense', 'Left Wing', 'Center', 'Right Wing'],
            soccer: ['Goalkeeper', 'Left Back', 'Center Back', 'Center Back', 'Right Back', 'Defensive Mid', 'Central Mid', 'Central Mid', 'Left Wing', 'Right Wing', 'Striker']
        };
        
        this.stadiumUpgrades = [
            'Training Facilities',
            'Medical Center', 
            'Youth Academy',
            'Fan Experience',
            'Technology Center'
        ];
        
        this.initialize();
    }

    initialize() {
        this.initializeSeasons();
        this.bindEvents();
        this.startDailyProcessor();
    }

    initializeSeasons() {
        for (const sport of this.sportTypes) {
            this.seasonData.set(sport, {
                currentSeason: 1,
                currentWeek: 1,
                seasonsPerYear: 1,
                weeksPerSeason: 20,
                playoffsWeeks: 4,
                offseasonWeeks: 8
            });
        }
    }

    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('sports:createTeam', this.createTeam.bind(this));
            EventBus.on('sports:upgradeStadium', this.upgradeStadium.bind(this));
            EventBus.on('sports:signPlayer', this.signPlayer.bind(this));
            EventBus.on('sports:releasePlayer', this.releasePlayer.bind(this));
            
            // Listen for wonder events to update team tab visibility
            EventBus.on('wonder_built', this.onWonderBuilt.bind(this));
            EventBus.on('wonder_demolished', this.onWonderDemolished.bind(this));
        }
    }

    onWonderBuilt(data) {
        const stadiumWonders = ['basketballStadium', 'hockeyStadium', 'soccerStadium'];
        if (stadiumWonders.includes(data.wonderType)) {
            // Update team tab visibility in bottom menu
            if (window.BottomMenu && typeof window.BottomMenu.updateTeamTabVisibility === 'function') {
                window.BottomMenu.updateTeamTabVisibility();
            }
        }
    }

    onWonderDemolished(data) {
        const stadiumWonders = ['basketballStadium', 'hockeyStadium', 'soccerStadium'];
        if (stadiumWonders.includes(data.wonderType)) {
            // Update team tab visibility in bottom menu
            if (window.BottomMenu && typeof window.BottomMenu.updateTeamTabVisibility === 'function') {
                window.BottomMenu.updateTeamTabVisibility();
            }
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    //                           TEAM MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    createTeam(data) {
        const { nationId, sport, teamName } = data;
        
        if (!this.canCreateTeam(nationId, sport)) {
            throw new Error(`Cannot create ${sport} team - stadium wonder required`);
        }

        if (!this.teams.has(nationId)) {
            this.teams.set(nationId, {});
        }

        const team = {
            id: this.generateId(),
            nationId: nationId,
            sport: sport,
            name: teamName,
            founded: Date.now(),
            
            // Stadium & Facilities
            stadium: {
                name: `${teamName} Stadium`,
                capacity: 25000,
                upgrades: {
                    'Training Facilities': 0,
                    'Medical Center': 0,
                    'Youth Academy': 0,
                    'Fan Experience': 0,
                    'Technology Center': 0
                }
            },
            
            // Staff
            coach: this.generateCoach(),
            
            // Players
            players: [],
            roster: new Map(), // position -> playerId
            
            // Finances
            budget: 10000000, // $10M starting budget
            revenue: 0,
            expenses: 0,
            
            // Performance
            stats: {
                wins: 0,
                losses: 0,
                draws: 0,
                championships: 0,
                playoffAppearances: 0
            },
            
            // Fan base
            fanBase: 50000,
            fanLoyalty: 50,
            
            // Current season
            currentSeason: 1,
            injuries: new Map() // playerId -> injury info
        };

        // Generate initial roster
        this.generateInitialRoster(team);
        
        this.teams.get(nationId)[sport] = team;
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:teamCreated', { nationId, sport, team });
        }
        
        return team;
    }
    canCreateTeam(nationId, sport) {
        const nation = this.getNation(nationId);
        if (!nation) return false;
        
        const wonderRequired = `${sport}Stadium`;
        return this.hasWonder(nationId, wonderRequired);
    }

    hasWonder(nationId, wonderType) {
        // Check if nation has the required stadium wonder
        const wondersSystem = window.gameEngine?.systems?.wonders;
        if (!wondersSystem) return false;
        
        return wondersSystem.hasWonder(nationId, wonderType);
    }

    generateInitialRoster(team) {
        const positions = this.playerPositions[team.sport];
        const playersPerPosition = team.sport === 'soccer' ? 1 : (team.sport === 'hockey' ? 1 : 1);
        
        positions.forEach((position, index) => {
            for (let i = 0; i < playersPerPosition; i++) {
                const player = this.generatePlayer(team.sport, position);
                team.players.push(player);
                team.roster.set(position, player.id);
                this.players.set(player.id, player);
            }
        });
        
        // Add bench players
        const benchSize = team.sport === 'soccer' ? 7 : 6;
        for (let i = 0; i < benchSize; i++) {
            const randomPosition = positions[Math.floor(Math.random() * positions.length)];
            const player = this.generatePlayer(team.sport, randomPosition);
            team.players.push(player);
            this.players.set(player.id, player);
        }
    }

    generatePlayer(sport, position) {
        const names = [
            'James', 'Michael', 'Robert', 'John', 'David', 'William', 'Richard', 'Thomas', 'Christopher', 'Daniel',
            'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin'
        ];
        
        const surnames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
        ];

        const player = {
            id: this.generateId(),
            name: `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`,
            age: 18 + Math.floor(Math.random() * 15), // 18-32
            position: position,
            sport: sport,
            
            // Core attributes (0-100)
            attributes: this.generateAttributes(sport, position),
            
            // Career stats
            gamesPlayed: 0,
            careerStats: this.initializeCareerStats(sport),
            
            // Contract
            salary: Math.floor(Math.random() * 5000000) + 500000, // $0.5M - $5.5M
            contractYears: 2 + Math.floor(Math.random() * 4), // 2-5 years
            
            // Development
            potential: 60 + Math.floor(Math.random() * 40), // 60-99
            morale: 70 + Math.floor(Math.random() * 30), // 70-99
            
            // Status
            isInjured: false,
            injuryDaysLeft: 0,
            isRetired: false,
            
            // History
            joinedDate: Date.now(),
            previousTeams: []
        };
        
        return player;
    }
    generateAttributes(sport, position) {
        const baseAttributes = {
            basketball: ['speed', 'shooting', 'passing', 'defense', 'rebounding', 'stamina'],
            hockey: ['speed', 'shooting', 'passing', 'checking', 'goaltending', 'stamina'],
            soccer: ['speed', 'shooting', 'passing', 'defending', 'goalkeeping', 'stamina']
        };
        
        const attributes = {};
        const sportAttrs = baseAttributes[sport];
        
        sportAttrs.forEach(attr => {
            let value = 40 + Math.floor(Math.random() * 40); // 40-79 base
            
            // Position-specific bonuses
            if (this.isPositionAttribute(sport, position, attr)) {
                value += Math.floor(Math.random() * 20); // Up to +20 for relevant attributes
            }
            
            attributes[attr] = Math.min(99, value);
        });
        
        return attributes;
    }

    isPositionAttribute(sport, position, attribute) {
        const positionAttributes = {
            basketball: {
                'Point Guard': ['passing', 'speed'],
                'Shooting Guard': ['shooting', 'speed'],
                'Small Forward': ['shooting', 'speed'],
                'Power Forward': ['rebounding', 'defense'],
                'Center': ['rebounding', 'defense']
            },
            hockey: {
                'Goalkeeper': ['goaltending'],
                'Left Defense': ['defense', 'checking'],
                'Right Defense': ['defense', 'checking'],
                'Left Wing': ['speed', 'shooting'],
                'Center': ['passing', 'shooting'],
                'Right Wing': ['speed', 'shooting']
            },
            soccer: {
                'Goalkeeper': ['goalkeeping'],
                'Left Back': ['defending', 'speed'],
                'Center Back': ['defending'],
                'Right Back': ['defending', 'speed'],
                'Defensive Mid': ['defending', 'passing'],
                'Central Mid': ['passing', 'stamina'],
                'Left Wing': ['speed', 'shooting'],
                'Right Wing': ['speed', 'shooting'],
                'Striker': ['shooting', 'speed']
            }
        };
        
        const relevantAttrs = positionAttributes[sport][position] || [];
        return relevantAttrs.includes(attribute);
    }

    initializeCareerStats(sport) {
        const stats = {
            basketball: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 },
            hockey: { goals: 0, assists: 0, hits: 0, saves: 0, goalsAgainst: 0 },
            soccer: { goals: 0, assists: 0, tackles: 0, saves: 0, goalsAgainst: 0 }
        };
        
        return stats[sport] || {};
    }

    generateCoach() {
        const coachNames = [
            'Bill Thompson', 'Mike Rodriguez', 'Steve Anderson', 'Tony Wilson', 'Dave Martinez',
            'John Mitchell', 'Paul Jackson', 'Mark Davis', 'Rick Johnson', 'Tom Williams'
        ];
        
        return {
            id: this.generateId(),
            name: coachNames[Math.floor(Math.random() * coachNames.length)],
            age: 35 + Math.floor(Math.random() * 25), // 35-59
            experience: Math.floor(Math.random() * 20), // 0-19 years
            
            // Coaching attributes (0-100)
            attributes: {
                tactics: 50 + Math.floor(Math.random() * 40),
                motivation: 50 + Math.floor(Math.random() * 40),
                development: 50 + Math.floor(Math.random() * 40),
                management: 50 + Math.floor(Math.random() * 40)
            },
            
            salary: 1000000 + Math.floor(Math.random() * 4000000), // $1M - $5M
            contractYears: 2 + Math.floor(Math.random() * 4),
            
            careerRecord: {
                wins: 0,
                losses: 0,
                championships: 0
            }
        };
    }
    // ═══════════════════════════════════════════════════════════════════
    //                         PLAYER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    signPlayer(data) {
        const { nationId, sport, playerId } = data;

        const team = this.getTeam(nationId, sport);
        if (!team) {
            throw new Error(`No ${sport} team found for nation ${nationId}`);
        }

        const player = this.players.get(playerId);
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        if (player.sport !== sport) {
            throw new Error(`Player is a ${player.sport} player, not ${sport}`);
        }

        // Check if player is already on this team
        if (team.players.includes(playerId)) {
            throw new Error('Player is already on this team');
        }

        // Check if team has enough budget for salary
        if (team.budget < player.salary) {
            throw new Error('Insufficient team budget to sign this player');
        }

        // Sign the player
        team.players.push(playerId);
        team.budget -= player.salary; // Signing bonus (one month salary)
        player.previousTeams.push({ teamName: player.currentTeam || 'Free Agent', leftDate: Date.now() });
        player.joinedDate = Date.now();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:playerSigned', { nationId, sport, playerId, player });
        }

        return player;
    }

    releasePlayer(data) {
        const { nationId, sport, playerId } = data;

        const team = this.getTeam(nationId, sport);
        if (!team) {
            throw new Error(`No ${sport} team found for nation ${nationId}`);
        }

        // Confirm player is on this team
        if (!team.players.includes(playerId)) {
            throw new Error('Player is not on this team');
        }

        // Remove from players list
        team.players = team.players.filter(id => id !== playerId);

        // Remove from roster if they were a starter
        for (const [position, id] of team.roster) {
            if (id === playerId) {
                team.roster.delete(position);
                break;
            }
        }

        // Remove from injuries if injured
        if (team.injuries && team.injuries.has(playerId)) {
            team.injuries.delete(playerId);
            const player = this.players.get(playerId);
            if (player) {
                player.isInjured = false;
                player.injuryDaysLeft = 0;
            }
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:playerReleased', { nationId, sport, playerId });
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         STADIUM UPGRADES
    // ═══════════════════════════════════════════════════════════════════

    upgradeStadium(data) {
        const { nationId, sport, upgradeType } = data;
        const team = this.getTeam(nationId, sport);
        
        if (!team) {
            throw new Error('Team not found');
        }
        
        const currentLevel = team.stadium.upgrades[upgradeType];
        if (currentLevel >= 10) {
            throw new Error('Maximum upgrade level reached');
        }
        
        const cost = this.getUpgradeCost(upgradeType, currentLevel + 1);
        const nation = this.getNation(nationId);
        
        if (nation.money < cost) {
            throw new Error('Insufficient funds for upgrade');
        }
        
        // Pay for upgrade
        nation.money -= cost;
        team.stadium.upgrades[upgradeType]++;
        
        // Apply upgrade effects
        this.applyUpgradeEffects(team, upgradeType);
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:stadiumUpgraded', { nationId, sport, upgradeType });
        }
        
        return true;
    }

    getUpgradeCost(upgradeType, level) {
        const baseCosts = {
            'Training Facilities': 2000000, // $2M base
            'Medical Center': 3000000,      // $3M base
            'Youth Academy': 2500000,       // $2.5M base
            'Fan Experience': 1500000,      // $1.5M base
            'Technology Center': 4000000    // $4M base
        };
        
        return baseCosts[upgradeType] * Math.pow(1.5, level - 1);
    }

    applyUpgradeEffects(team, upgradeType) {
        const level = team.stadium.upgrades[upgradeType];
        
        switch (upgradeType) {
            case 'Training Facilities':
                // Improves player development and team performance
                team.trainingBonus = level * 0.05; // 5% per level
                break;
                
            case 'Medical Center':
                // Reduces injury frequency and recovery time
                team.injuryReduction = level * 0.1; // 10% reduction per level
                break;
                
            case 'Youth Academy':
                // Produces young talent and improves scouting
                team.youthProduction = level;
                break;
                
            case 'Fan Experience':
                // Increases revenue and fan loyalty
                team.stadium.capacity += level * 5000; // +5k capacity per level
                team.revenueBonus = level * 0.1; // 10% per level
                break;
                
            case 'Technology Center':
                // Advanced analytics and player monitoring
                team.analyticsBonus = level * 0.05; // 5% per level
                break;
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    //                         GAME SIMULATION
    // ═══════════════════════════════════════════════════════════════════

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
            stats: {
                [team1.id]: {},
                [team2.id]: {}
            }
        };
        
        // Calculate team strengths
        const strength1 = this.calculateTeamStrength(team1);
        const strength2 = this.calculateTeamStrength(team2);
        
        // Simulate game based on sport
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
        }
        
        // Update team stats
        this.updateTeamStats(team1, team2, match);
        
        // Process injuries
        this.processMatchInjuries(team1, team2);
        
        this.matches.set(match.id, match);
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:matchCompleted', { match, team1, team2 });
        }
        
        return match;
    }

    calculateTeamStrength(team) {
        let totalStrength = 0;
        let playerCount = 0;
        
        // Calculate average player strength for starting lineup
        team.roster.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player && !player.isInjured) {
                totalStrength += this.calculatePlayerRating(player);
                playerCount++;
            }
        });
        
        const baseStrength = playerCount > 0 ? totalStrength / playerCount : 50;
        
        // Apply coach bonus
        const coachBonus = (team.coach.attributes.tactics + team.coach.attributes.motivation) / 200;
        
        // Apply stadium bonuses
        const trainingBonus = team.trainingBonus || 0;
        const analyticsBonus = team.analyticsBonus || 0;
        
        return baseStrength * (1 + coachBonus + trainingBonus + analyticsBonus);
    }

    calculatePlayerRating(player) {
        const attributes = Object.values(player.attributes);
        const averageAttribute = attributes.reduce((a, b) => a + b, 0) / attributes.length;
        
        // Age factor (peak at 27, decline after 30)
        let ageFactor = 1.0;
        if (player.age < 22) ageFactor = 0.8 + (player.age - 18) * 0.05;
        else if (player.age > 30) ageFactor = 1.0 - (player.age - 30) * 0.03;
        
        // Morale factor
        const moraleFactor = player.morale / 100;
        
        return averageAttribute * ageFactor * moraleFactor;
    }
    simulateBasketball(match, team1, team2, strength1, strength2) {
        // Basketball: 4 quarters, 12 minutes each
        for (let quarter = 1; quarter <= 4; quarter++) {
            for (let minute = 1; minute <= 12; minute++) {
                // Random scoring opportunities
                if (Math.random() < 0.15) { // 15% chance per minute
                    const scoringTeam = Math.random() < (strength1 / (strength1 + strength2)) ? team1 : team2;
                    const points = Math.random() < 0.3 ? 3 : 2; // 30% chance for 3-pointer
                    
                    if (scoringTeam === team1) {
                        match.score1 += points;
                    } else {
                        match.score2 += points;
                    }
                    
                    match.events.push({
                        minute: (quarter - 1) * 12 + minute,
                        team: scoringTeam.id,
                        type: points === 3 ? '3-pointer' : 'field goal',
                        points: points
                    });
                }
            }
        }
        
        // Overtime if tied
        if (match.score1 === match.score2) {
            for (let minute = 1; minute <= 5; minute++) {
                if (Math.random() < 0.2) {
                    const scoringTeam = Math.random() < 0.5 ? team1 : team2;
                    const points = Math.random() < 0.25 ? 3 : 2;
                    
                    if (scoringTeam === team1) {
                        match.score1 += points;
                    } else {
                        match.score2 += points;
                    }
                    
                    if (match.score1 !== match.score2) break; // First to score wins
                }
            }
        }
    }

    simulateHockey(match, team1, team2, strength1, strength2) {
        // Hockey: 3 periods, 20 minutes each
        for (let period = 1; period <= 3; period++) {
            for (let minute = 1; minute <= 20; minute++) {
                if (Math.random() < 0.08) { // 8% chance per minute
                    const scoringTeam = Math.random() < (strength1 / (strength1 + strength2)) ? team1 : team2;
                    
                    if (scoringTeam === team1) {
                        match.score1++;
                    } else {
                        match.score2++;
                    }
                    
                    match.events.push({
                        minute: (period - 1) * 20 + minute,
                        team: scoringTeam.id,
                        type: 'goal'
                    });
                }
            }
        }
        
        // Overtime/Shootout if tied
        if (match.score1 === match.score2) {
            // Sudden death overtime
            if (Math.random() < 0.5) {
                const winner = Math.random() < 0.5 ? team1 : team2;
                if (winner === team1) {
                    match.score1++;
                } else {
                    match.score2++;
                }
                match.events.push({ minute: 65, team: winner.id, type: 'overtime goal' });
            }
        }
    }

    simulateSoccer(match, team1, team2, strength1, strength2) {
        // Soccer: 90 minutes + injury time
        const totalMinutes = 90 + Math.floor(Math.random() * 8); // 0-7 minutes injury time
        
        for (let minute = 1; minute <= totalMinutes; minute++) {
            if (Math.random() < 0.03) { // 3% chance per minute
                const scoringTeam = Math.random() < (strength1 / (strength1 + strength2)) ? team1 : team2;
                
                if (scoringTeam === team1) {
                    match.score1++;
                } else {
                    match.score2++;
                }
                
                match.events.push({
                    minute: minute,
                    team: scoringTeam.id,
                    type: 'goal'
                });
            }
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    //                            TOURNAMENTS
    // ═══════════════════════════════════════════════════════════════════

    createTournament(sport, type = 'league') {
        const tournament = {
            id: this.generateId(),
            sport: sport,
            type: type, // 'league', 'cup', 'championship'
            name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            participants: [],
            matches: [],
            standings: new Map(),
            currentRound: 1,
            status: 'registration', // registration, active, completed
            prize: {
                money: 10000000, // $10M prize pool
                trophies: type === 'championship' ? 5 : (type === 'cup' ? 3 : 1)
            },
            startDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // Starts in 1 week
            registrationDeadline: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 days to register
        };
        
        this.tournaments.set(tournament.id, tournament);
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:tournamentCreated', { tournament });
        }
        
        return tournament;
    }

    registerForTournament(tournamentId, nationId, sport) {
        const tournament = this.tournaments.get(tournamentId);
        const team = this.getTeam(nationId, sport);
        
        if (!tournament || !team) {
            throw new Error('Tournament or team not found');
        }
        
        if (tournament.status !== 'registration') {
            throw new Error('Registration is closed');
        }
        
        if (tournament.participants.some(p => p.nationId === nationId)) {
            throw new Error('Already registered for this tournament');
        }
        
        tournament.participants.push({
            nationId: nationId,
            teamId: team.id,
            teamName: team.name
        });
        
        tournament.standings.set(team.id, {
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        });
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:teamRegistered', { tournamentId, nationId, sport });
        }
        
        return true;
    }

    startTournament(tournamentId) {
        const tournament = this.tournaments.get(tournamentId);
        
        if (!tournament || tournament.status !== 'registration') {
            return false;
        }
        
        if (tournament.participants.length < 2) {
            throw new Error('Not enough participants');
        }
        
        tournament.status = 'active';
        
        if (tournament.type === 'league') {
            this.generateLeagueMatches(tournament);
        } else {
            this.generateKnockoutMatches(tournament);
        }
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:tournamentStarted', { tournament });
        }
        
        return true;
    }

    generateLeagueMatches(tournament) {
        const teams = tournament.participants;
        
        // Round-robin: each team plays every other team twice
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                // Home and away matches
                tournament.matches.push({
                    homeTeam: teams[i].teamId,
                    awayTeam: teams[j].teamId,
                    round: 1,
                    scheduledTime: Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000
                });
                
                tournament.matches.push({
                    homeTeam: teams[j].teamId,
                    awayTeam: teams[i].teamId,
                    round: 2,
                    scheduledTime: Date.now() + (14 + Math.random() * 14) * 24 * 60 * 60 * 1000
                });
            }
        }
    }

    generateKnockoutMatches(tournament) {
        const teams = tournament.participants;
        
        // Generate first round matches
        for (let i = 0; i < teams.length; i += 2) {
            if (i + 1 < teams.length) {
                tournament.matches.push({
                    homeTeam: teams[i].teamId,
                    awayTeam: teams[i + 1].teamId,
                    round: 1,
                    scheduledTime: Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
                });
            }
        }
        
        // Note: Subsequent rounds would be generated as matches complete
    }
    // ═══════════════════════════════════════════════════════════════════
    //                             GAMBLING
    // ═══════════════════════════════════════════════════════════════════

    placeBet(data) {
        const { bettorId, matchId, betType, amount, prediction } = data;
        
        const match = this.matches.get(matchId);
        if (!match || match.status === 'completed') {
            throw new Error('Cannot bet on this match');
        }
        
        const nation = this.getNation(bettorId);
        if (!nation || nation.money < amount) {
            throw new Error('Insufficient funds');
        }
        
        const bet = {
            id: this.generateId(),
            bettorId: bettorId,
            matchId: matchId,
            betType: betType, // 'winner', 'score', 'over_under'
            amount: amount,
            prediction: prediction,
            odds: this.calculateOdds(match, betType, prediction),
            timestamp: Date.now(),
            status: 'pending'
        };
        
        // Deduct bet amount
        nation.money -= amount;
        
        this.bets.set(bet.id, bet);
        
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('sports:betPlaced', { bet });
        }
        
        return bet;
    }

    calculateOdds(match, betType, prediction) {
        // Simple odds calculation based on team strengths
        const team1 = this.getTeamById(match.team1);
        const team2 = this.getTeamById(match.team2);
        
        const strength1 = this.calculateTeamStrength(team1);
        const strength2 = this.calculateTeamStrength(team2);
        
        const total = strength1 + strength2;
        const team1Probability = strength1 / total;
        const team2Probability = strength2 / total;
        
        switch (betType) {
            case 'winner':
                if (prediction === match.team1) {
                    return 1 / team1Probability;
                } else if (prediction === match.team2) {
                    return 1 / team2Probability;
                } else { // draw
                    return 1 / 0.25; // 25% chance for draw
                }
                
            case 'over_under':
                return 1.8 + Math.random() * 0.4; // 1.8 - 2.2
                
            case 'score':
                return 5 + Math.random() * 10; // 5 - 15 for exact score
                
            default:
                return 2.0;
        }
    }

    processMatchBets(match) {
        // Process all bets for this match after completion
        for (const [betId, bet] of this.bets) {
            if (bet.matchId === match.id && bet.status === 'pending') {
                const won = this.checkBetResult(bet, match);
                bet.status = won ? 'won' : 'lost';
                
                if (won) {
                    const winnings = bet.amount * bet.odds;
                    const nation = this.getNation(bet.bettorId);
                    if (nation) {
                        nation.money += winnings;
                    }
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
                return bet.prediction.type === 'over' ? 
                    totalScore > bet.prediction.line : 
                    totalScore < bet.prediction.line;
                    
            case 'score':
                return match.score1 === bet.prediction.score1 && 
                       match.score2 === bet.prediction.score2;
                       
            default:
                return false;
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    //                            DAILY PROCESSING
    // ═══════════════════════════════════════════════════════════════════

    startDailyProcessor() {
        setInterval(() => {
            this.processDailyUpdates();
        }, 60 * 60 * 1000); // Every hour (1 game day)
    }

    processDailyUpdates() {
        // Age players and handle retirement
        for (const [playerId, player] of this.players) {
            this.processPlayerDevelopment(player);
            this.checkRetirement(player);
        }
        
        // Heal injuries
        this.processInjuries();
        
        // Process scheduled matches
        this.processScheduledMatches();
        
        // Generate revenue for teams
        this.processTeamRevenue();
        
        // Youth academy production
        this.processYouthAcademies();
    }

    processScheduledMatches() {
        // Process matches that are scheduled to occur
        const now = Date.now();
        
        for (const [tournamentId, tournament] of this.tournaments) {
            if (tournament.status === 'active') {
                tournament.matches.forEach(matchData => {
                    if (matchData.scheduledTime <= now && !matchData.completed) {
                        const team1 = this.getTeamById(matchData.homeTeam);
                        const team2 = this.getTeamById(matchData.awayTeam);
                        
                        if (team1 && team2) {
                            const match = this.simulateMatch(team1, team2);
                            matchData.completed = true;
                            matchData.result = match;
                            
                            // Update tournament standings
                            this.updateTournamentStandings(tournament, match);
                        }
                    }
                });
            }
        }
    }

    updateTournamentStandings(tournament, match) {
        const team1Stats = tournament.standings.get(match.team1);
        const team2Stats = tournament.standings.get(match.team2);
        
        if (team1Stats && team2Stats) {
            // Update goals for/against
            team1Stats.goalsFor += match.score1;
            team1Stats.goalsAgainst += match.score2;
            team2Stats.goalsFor += match.score2;
            team2Stats.goalsAgainst += match.score1;
            
            // Update wins/losses/draws and points
            if (match.score1 > match.score2) {
                team1Stats.wins++;
                team1Stats.points += 3;
                team2Stats.losses++;
            } else if (match.score2 > match.score1) {
                team2Stats.wins++;
                team2Stats.points += 3;
                team1Stats.losses++;
            } else {
                team1Stats.draws++;
                team2Stats.draws++;
                team1Stats.points += 1;
                team2Stats.points += 1;
            }
        }
    }

    processTeamRevenue() {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                // Calculate match day revenue
                const baseRevenue = team.fanBase * 25; // $25 per fan
                const capacityBonus = Math.min(team.fanBase / team.stadium.capacity, 1.0);
                const revenueBonus = team.revenueBonus || 0;
                
                team.revenue = Math.floor(baseRevenue * capacityBonus * (1 + revenueBonus));
                team.budget += team.revenue;
                
                // Calculate expenses (player salaries, coach salary, maintenance)
                let totalSalaries = 0;
                team.players.forEach(playerId => {
                    const player = this.players.get(playerId);
                    if (player) {
                        totalSalaries += player.salary;
                    }
                });
                
                const dailyExpenses = Math.floor((totalSalaries + team.coach.salary) / 365);
                team.expenses = dailyExpenses;
                team.budget -= dailyExpenses;
                
                // Ensure budget doesn't go negative
                if (team.budget < 0) {
                    // Get money from nation if available
                    const nation = this.getNation(nationId);
                    if (nation && nation.money >= Math.abs(team.budget)) {
                        nation.money += team.budget; // team.budget is negative
                        team.budget = 0;
                    }
                }
            }
        }
    }

    processYouthAcademies() {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                const youthLevel = team.stadium.upgrades['Youth Academy'] || 0;
                
                if (youthLevel > 0) {
                    // Random chance to produce a youth player
                    const productionChance = youthLevel * 0.02; // 2% per level per day
                    
                    if (Math.random() < productionChance) {
                        const positions = this.playerPositions[sport];
                        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
                        
                        const youthPlayer = this.generateYouthPlayer(sport, randomPosition);
                        team.players.push(youthPlayer.id);
                        this.players.set(youthPlayer.id, youthPlayer);
                        
                        if (typeof EventBus !== 'undefined') {
                            EventBus.emit('sports:youthPlayerGenerated', { 
                                nationId, 
                                sport, 
                                player: youthPlayer 
                            });
                        }
                    }
                }
            }
        }
    }

    generateYouthPlayer(sport, position) {
        const names = [
            'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Cameron', 'Drew', 'Sage',
            'Quinn', 'Reese', 'Dakota', 'Skylar', 'River', 'Phoenix', 'Blake', 'Emery', 'Rowan', 'Finley'
        ];
        
        const surnames = [
            'Johnson', 'Thompson', 'White', 'Harris', 'Martin', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
            'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez'
        ];

        const player = {
            id: this.generateId(),
            name: `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`,
            age: 16 + Math.floor(Math.random() * 3), // 16-18
            position: position,
            sport: sport,
            
            // Youth players have lower current attributes but higher potential
            attributes: this.generateYouthAttributes(sport, position),
            
            // Career stats
            gamesPlayed: 0,
            careerStats: this.initializeCareerStats(sport),
            
            // Contract (youth contracts are cheaper)
            salary: Math.floor(Math.random() * 1000000) + 200000, // $200k - $1.2M
            contractYears: 2 + Math.floor(Math.random() * 3), // 2-4 years
            
            // Development (higher potential for youth)
            potential: 75 + Math.floor(Math.random() * 25), // 75-99
            morale: 80 + Math.floor(Math.random() * 20), // 80-99
            
            // Status
            isInjured: false,
            injuryDaysLeft: 0,
            isRetired: false,
            
            // History
            joinedDate: Date.now(),
            previousTeams: [],
            isYouthProduct: true
        };
        
        return player;
    }

    generateYouthAttributes(sport, position) {
        const attributes = this.generateAttributes(sport, position);
        
        // Youth players have 20-30% lower current attributes but can improve more
        for (const [attr, value] of Object.entries(attributes)) {
            attributes[attr] = Math.max(20, Math.floor(value * (0.7 + Math.random() * 0.1)));
        }
        
        return attributes;
    }

    processPlayerDevelopment(player) {
        // Players develop based on age, playing time, and facilities
        if (player.age < 28 && !player.isRetired) {
            const team = this.getPlayerTeam(player.id);
            const developmentRate = team ? (team.trainingBonus || 0) + 0.01 : 0.01;
            
            // Random attribute improvements
            for (const [attr, value] of Object.entries(player.attributes)) {
                if (Math.random() < developmentRate && value < player.potential) {
                    player.attributes[attr] = Math.min(player.potential, value + 1);
                }
            }
        }
        
        // Age-related decline for older players
        if (player.age > 32) {
            const declineRate = (player.age - 32) * 0.002;
            if (Math.random() < declineRate) {
                const attributes = Object.keys(player.attributes);
                const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
                player.attributes[randomAttr] = Math.max(1, player.attributes[randomAttr] - 1);
            }
        }
    }

    checkRetirement(player) {
        if (player.age > 35) {
            const retirementChance = (player.age - 35) * 0.1;
            if (Math.random() < retirementChance) {
                player.isRetired = true;
                
                // Remove from team
                const team = this.getPlayerTeam(player.id);
                if (team) {
                    team.players = team.players.filter(p => p !== player.id);
                    
                    // Remove from roster
                    for (const [position, playerId] of team.roster) {
                        if (playerId === player.id) {
                            team.roster.delete(position);
                            break;
                        }
                    }
                }
                
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('sports:playerRetired', { player });
                }
            }
        }
    }

    processInjuries() {
        for (const [teamId, team] of this.teams) {
            for (const [playerId, injury] of team.injuries) {
                injury.daysLeft--;
                if (injury.daysLeft <= 0) {
                    const player = this.players.get(playerId);
                    if (player) {
                        player.isInjured = false;
                        player.injuryDaysLeft = 0;
                    }
                    team.injuries.delete(playerId);
                }
            }
        }
    }

    processMatchInjuries(team1, team2) {
        [team1, team2].forEach(team => {
            team.players.forEach(playerId => {
                const player = this.players.get(playerId);
                if (player && !player.isInjured && Math.random() < 0.02) { // 2% injury chance per game
                    const injuryDuration = 1 + Math.floor(Math.random() * 14); // 1-14 days
                    
                    // Medical center reduces injury duration
                    const medicalBonus = team.stadium.upgrades['Medical Center'] || 0;
                    const actualDuration = Math.max(1, Math.floor(injuryDuration * (1 - medicalBonus * 0.1)));
                    
                    player.isInjured = true;
                    player.injuryDaysLeft = actualDuration;
                    team.injuries.set(playerId, {
                        type: 'minor',
                        daysLeft: actualDuration
                    });
                }
            });
        });
    }

    updateTeamStats(team1, team2, match) {
        // Update team statistics based on match result
        if (match.score1 > match.score2) {
            team1.stats.wins++;
            team2.stats.losses++;
        } else if (match.score2 > match.score1) {
            team2.stats.wins++;
            team1.stats.losses++;
        } else {
            team1.stats.draws++;
            team2.stats.draws++;
        }
        
        // Update player game stats
        team1.players.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player) {
                player.gamesPlayed++;
                // Add random stats based on position and performance
                this.updatePlayerGameStats(player, match, team1.id === match.team1);
            }
        });
        
        team2.players.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player) {
                player.gamesPlayed++;
                this.updatePlayerGameStats(player, match, team2.id === match.team1);
            }
        });
    }

    updatePlayerGameStats(player, match, isTeam1) {
        const sport = player.sport;
        const events = match.events.filter(event => {
            const eventTeam = isTeam1 ? match.team1 : match.team2;
            return event.team === eventTeam;
        });
        
        // Simple stat attribution based on events
        events.forEach(event => {
            if (Math.random() < 0.3) { // 30% chance player was involved
                switch (sport) {
                    case 'basketball':
                        if (event.type === '3-pointer' || event.type === 'field goal') {
                            player.careerStats.points += event.points || 2;
                        }
                        break;
                    case 'hockey':
                    case 'soccer':
                        if (event.type === 'goal') {
                            player.careerStats.goals++;
                        }
                        break;
                }
            }
        });
    }
    // ═══════════════════════════════════════════════════════════════════
    //                           UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════

    getTeam(nationId, sport) {
        const nationTeams = this.teams.get(nationId);
        return nationTeams ? nationTeams[sport] : null;
    }

    getTeamById(teamId) {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                if (team.id === teamId) {
                    return team;
                }
            }
        }
        return null;
    }

    getPlayerTeam(playerId) {
        for (const [nationId, sports] of this.teams) {
            for (const [sport, team] of Object.entries(sports)) {
                if (team.players.includes(playerId)) {
                    return team;
                }
            }
        }
        return null;
    }

    getNation(nationId) {
        // Get nation from game engine
        if (typeof window !== 'undefined' && window.gameEngine?.currentPlayer?.nation) {
            const currentNation = window.gameEngine.currentPlayer.nation;
            if (currentNation.id === nationId || !currentNation.id) {
                return currentNation;
            }
        }
        return null;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    hasStadiumWonder(nationId, sport) {
        const wondersSystem = window.gameEngine?.systems?.wonders;
        if (!wondersSystem) return false;
        
        const wonderMap = {
            basketball: 'basketballStadium',
            hockey: 'hockeyStadium',
            soccer: 'soccerStadium'
        };
        
        return wondersSystem.hasWonder(nationId, wonderMap[sport]);
    }

    getAvailableSports(nationId) {
        const availableSports = [];
        
        for (const sport of this.sportTypes) {
            if (this.hasStadiumWonder(nationId, sport)) {
                availableSports.push(sport);
            }
        }
        
        return availableSports;
    }

    getTeamStats(nationId, sport) {
        const team = this.getTeam(nationId, sport);
        if (!team) return null;
        
        return {
            name: team.name,
            wins: team.stats.wins,
            losses: team.stats.losses,
            draws: team.stats.draws,
            championships: team.stats.championships,
            fanBase: team.fanBase,
            fanLoyalty: team.fanLoyalty,
            budget: team.budget,
            revenue: team.revenue,
            expenses: team.expenses,
            players: team.players.length,
            injuredPlayers: Array.from(team.injuries.keys()).length
        };
    }

    // Save/Load functionality
    getState() {
        return {
            teams: Array.from(this.teams.entries()),
            players: Array.from(this.players.entries()),
            tournaments: Array.from(this.tournaments.entries()),
            matches: Array.from(this.matches.entries()),
            bets: Array.from(this.bets.entries()),
            seasonData: Array.from(this.seasonData.entries())
        };
    }

    setState(state) {
        if (state) {
            this.teams = new Map(state.teams || []);
            this.players = new Map(state.players || []);
            this.tournaments = new Map(state.tournaments || []);
            this.matches = new Map(state.matches || []);
            this.bets = new Map(state.bets || []);
            this.seasonData = new Map(state.seasonData || []);
        }
    }

    destroy() {
        // Clean up any intervals or event listeners
        if (typeof EventBus !== 'undefined') {
            EventBus.off('sports:createTeam');
            EventBus.off('sports:upgradeStadium');
            EventBus.off('sports:signPlayer');
            EventBus.off('sports:releasePlayer');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsSystem;
} else if (typeof window !== 'undefined') {
    window.SportsSystem = SportsSystem;
}