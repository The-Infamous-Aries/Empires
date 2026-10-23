/**
 * Team Panel Component
 * Comprehensive sports team management interface
 */

class TeamPanel {
    constructor() {
        this.element = null;
        this.currentTab = 'overview';
        this.currentSport = null;
        this.teams = new Map();
        
        this.initialize();
        this.bindEvents();
    }

    initialize() {
        this.createElement();
        this.setupTabs();
        this.loadTeamData();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'team-panel';
        this.element.innerHTML = `
            <div class="panel-header">
                <h2><i class="fas fa-trophy"></i> Team Management</h2>
                <div class="sport-selector">
                    <button class="sport-btn" data-sport="basketball">
                        <i class="fas fa-basketball-ball"></i> Basketball
                    </button>
                    <button class="sport-btn" data-sport="hockey">
                        <i class="fas fa-hockey-puck"></i> Hockey  
                    </button>
                    <button class="sport-btn" data-sport="soccer">
                        <i class="fas fa-futbol"></i> Soccer
                    </button>
                </div>
            </div>
            
            <div class="team-content">
                <div class="no-teams-message" id="noTeamsMessage">
                    <div class="message-content">
                        <i class="fas fa-info-circle"></i>
                        <h3>No Teams Available</h3>
                        <p>Build a Stadium Wonder to unlock team management for that sport!</p>
                        <div class="required-wonders">
                            <div class="wonder-requirement">
                                <i class="fas fa-basketball-ball"></i>
                                <span>Basketball Stadium Wonder</span>
                            </div>
                            <div class="wonder-requirement">
                                <i class="fas fa-hockey-puck"></i>
                                <span>Hockey Arena Wonder</span>
                            </div>
                            <div class="wonder-requirement">
                                <i class="fas fa-futbol"></i>
                                <span>Soccer Stadium Wonder</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="team-interface" id="teamInterface" style="display: none;">
                    <div class="team-tabs">
                        <button class="tab-btn active" data-tab="overview">Overview</button>
                        <button class="tab-btn" data-tab="roster">Roster</button>
                        <button class="tab-btn" data-tab="stadium">Stadium</button>
                        <button class="tab-btn" data-tab="matches">Matches</button>
                        <button class="tab-btn" data-tab="tournaments">Tournaments</button>
                        <button class="tab-btn" data-tab="gambling">Betting</button>
                    </div>
                    
                    <div class="team-tab-content">
                        ${this.generateOverviewTab()}
                        ${this.generateRosterTab()}
                        ${this.generateStadiumTab()}
                        ${this.generateMatchesTab()}
                        ${this.generateTournamentsTab()}
                        ${this.generateGamblingTab()}
                    </div>
                </div>
            </div>
        `;
    }
    generateOverviewTab() {
        return `
            <div class="tab-content active" id="overviewTab">
                <div class="team-overview">
                    <div class="team-header">
                        <div class="team-info">
                            <h3 id="teamName">No Team Selected</h3>
                            <div class="team-actions">
                                <button class="btn btn-primary" id="createTeamBtn">Create Team</button>
                                <button class="btn btn-secondary" id="renameTeamBtn" style="display: none;">Rename Team</button>
                            </div>
                        </div>
                        <div class="team-logo">
                            <i class="fas fa-trophy"></i>
                        </div>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Record</h4>
                            <div class="record">
                                <span id="wins">0</span>-<span id="losses">0</span>-<span id="draws">0</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <h4>Budget</h4>
                            <div class="budget">
                                $<span id="teamBudget">0</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <h4>Fan Base</h4>
                            <div class="fans">
                                <span id="fanBase">0</span> fans
                                (<span id="fanLoyalty">0</span>% loyalty)
                            </div>
                        </div>
                        <div class="stat-card">
                            <h4>Championships</h4>
                            <div class="championships">
                                <span id="championships">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recent-matches">
                        <h4>Recent Matches</h4>
                        <div id="recentMatchesList">
                            <p>No recent matches</p>
                        </div>
                    </div>
                    
                    <div class="next-match">
                        <h4>Next Match</h4>
                        <div id="nextMatchInfo">
                            <p>No scheduled matches</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateRosterTab() {
        return `
            <div class="tab-content" id="rosterTab">
                <div class="roster-management">
                    <div class="roster-header">
                        <h4>Team Roster</h4>
                        <div class="roster-actions">
                            <button class="btn btn-primary" id="signPlayerBtn">Sign Player</button>
                            <button class="btn btn-secondary" id="tradePlayerBtn">Trade Player</button>
                        </div>
                    </div>
                    
                    <div class="starting-lineup">
                        <h5>Starting Lineup</h5>
                        <div id="startingLineup" class="lineup-grid">
                            <!-- Starting players will be populated here -->
                        </div>
                    </div>
                    
                    <div class="bench-players">
                        <h5>Bench Players</h5>
                        <div id="benchPlayers" class="bench-grid">
                            <!-- Bench players will be populated here -->
                        </div>
                    </div>
                    
                    <div class="injured-players">
                        <h5>Injured Players</h5>
                        <div id="injuredPlayers" class="injured-list">
                            <!-- Injured players will be populated here -->
                        </div>
                    </div>
                    
                    <div class="coach-info">
                        <h5>Coaching Staff</h5>
                        <div id="coachCard" class="coach-card">
                            <!-- Coach information will be populated here -->
                        </div>
                        <button class="btn btn-secondary" id="hireCoachBtn">Hire New Coach</button>
                    </div>
                </div>
            </div>
        `;
    }

    generateStadiumTab() {
        return `
            <div class="tab-content" id="stadiumTab">
                <div class="stadium-management">
                    <div class="stadium-info">
                        <h4 id="stadiumName">Stadium</h4>
                        <p>Capacity: <span id="stadiumCapacity">0</span> seats</p>
                    </div>
                    
                    <div class="upgrades-grid">
                        <div class="upgrade-card" data-upgrade="Training Facilities">
                            <div class="upgrade-icon">
                                <i class="fas fa-dumbbell"></i>
                            </div>
                            <div class="upgrade-info">
                                <h5>Training Facilities</h5>
                                <p>Improves player development and team performance</p>
                                <div class="upgrade-level">
                                    Level: <span class="level">0</span>/10
                                </div>
                                <div class="upgrade-effect">
                                    Effect: +<span class="effect">0</span>% training bonus
                                </div>
                            </div>
                            <button class="btn btn-upgrade" data-upgrade="Training Facilities">
                                Upgrade ($<span class="cost">2,000,000</span>)
                            </button>
                        </div>
                        
                        <div class="upgrade-card" data-upgrade="Medical Center">
                            <div class="upgrade-icon">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <div class="upgrade-info">
                                <h5>Medical Center</h5>
                                <p>Reduces injury frequency and recovery time</p>
                                <div class="upgrade-level">
                                    Level: <span class="level">0</span>/10
                                </div>
                                <div class="upgrade-effect">
                                    Effect: -<span class="effect">0</span>% injury duration
                                </div>
                            </div>
                            <button class="btn btn-upgrade" data-upgrade="Medical Center">
                                Upgrade ($<span class="cost">3,000,000</span>)
                            </button>
                        </div>
                        
                        <div class="upgrade-card" data-upgrade="Youth Academy">
                            <div class="upgrade-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <div class="upgrade-info">
                                <h5>Youth Academy</h5>
                                <p>Produces young talent and improves scouting</p>
                                <div class="upgrade-level">
                                    Level: <span class="level">0</span>/10
                                </div>
                                <div class="upgrade-effect">
                                    Effect: <span class="effect">0</span> youth players/season
                                </div>
                            </div>
                            <button class="btn btn-upgrade" data-upgrade="Youth Academy">
                                Upgrade ($<span class="cost">2,500,000</span>)
                            </button>
                        </div>
                        
                        <div class="upgrade-card" data-upgrade="Fan Experience">
                            <div class="upgrade-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="upgrade-info">
                                <h5>Fan Experience</h5>
                                <p>Increases stadium capacity and revenue</p>
                                <div class="upgrade-level">
                                    Level: <span class="level">0</span>/10
                                </div>
                                <div class="upgrade-effect">
                                    Effect: +<span class="effect">0</span>k capacity, +<span class="revenue-effect">0</span>% revenue
                                </div>
                            </div>
                            <button class="btn btn-upgrade" data-upgrade="Fan Experience">
                                Upgrade ($<span class="cost">1,500,000</span>)
                            </button>
                        </div>
                        
                        <div class="upgrade-card" data-upgrade="Technology Center">
                            <div class="upgrade-icon">
                                <i class="fas fa-microchip"></i>
                            </div>
                            <div class="upgrade-info">
                                <h5>Technology Center</h5>
                                <p>Advanced analytics and player monitoring</p>
                                <div class="upgrade-level">
                                    Level: <span class="level">0</span>/10
                                </div>
                                <div class="upgrade-effect">
                                    Effect: +<span class="effect">0</span>% analytics bonus
                                </div>
                            </div>
                            <button class="btn btn-upgrade" data-upgrade="Technology Center">
                                Upgrade ($<span class="cost">4,000,000</span>)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    generateMatchesTab() {
        return `
            <div class="tab-content" id="matchesTab">
                <div class="matches-section">
                    <div class="matches-header">
                        <h4>Match Schedule</h4>
                        <div class="match-filters">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="upcoming">Upcoming</button>
                            <button class="filter-btn" data-filter="completed">Completed</button>
                        </div>
                    </div>
                    
                    <div class="matches-list" id="matchesList">
                        <!-- Matches will be populated here -->
                    </div>
                    
                    <div class="match-actions">
                        <button class="btn btn-primary" id="scheduleMatchBtn">Schedule Friendly</button>
                        <button class="btn btn-secondary" id="viewStatsBtn">View Statistics</button>
                    </div>
                </div>
            </div>
        `;
    }

    generateTournamentsTab() {
        return `
            <div class="tab-content" id="tournamentsTab">
                <div class="tournaments-section">
                    <div class="tournaments-header">
                        <h4>Tournaments</h4>
                        <button class="btn btn-primary" id="createTournamentBtn">Create Tournament</button>
                    </div>
                    
                    <div class="active-tournaments">
                        <h5>Active Tournaments</h5>
                        <div id="activeTournamentsList">
                            <!-- Active tournaments will be populated here -->
                        </div>
                    </div>
                    
                    <div class="available-tournaments">
                        <h5>Available Tournaments</h5>
                        <div id="availableTournamentsList">
                            <!-- Available tournaments will be populated here -->
                        </div>
                    </div>
                    
                    <div class="tournament-history">
                        <h5>Tournament History</h5>
                        <div id="tournamentHistory">
                            <!-- Tournament history will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateGamblingTab() {
        return `
            <div class="tab-content" id="gamblingTab">
                <div class="gambling-section">
                    <div class="gambling-header">
                        <h4>Sports Betting</h4>
                        <div class="betting-balance">
                            Available: $<span id="bettingBalance">0</span>
                        </div>
                    </div>
                    
                    <div class="upcoming-bets">
                        <h5>Upcoming Matches</h5>
                        <div id="upcomingBets">
                            <!-- Betting opportunities will be populated here -->
                        </div>
                    </div>
                    
                    <div class="active-bets">
                        <h5>Active Bets</h5>
                        <div id="activeBets">
                            <!-- Active bets will be populated here -->
                        </div>
                    </div>
                    
                    <div class="betting-history">
                        <h5>Betting History</h5>
                        <div id="bettingHistory">
                            <!-- Betting history will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (typeof EventBus !== 'undefined') {
            EventBus.on('sports:teamCreated', this.onTeamCreated.bind(this));
            EventBus.on('sports:stadiumUpgraded', this.onStadiumUpgraded.bind(this));
            EventBus.on('sports:matchCompleted', this.onMatchCompleted.bind(this));
        }

        // Bind UI events after element is created
        setTimeout(() => {
            this.bindUIEvents();
        }, 100);
    }

    bindUIEvents() {
        if (!this.element) return;

        // Sport selector buttons
        this.element.querySelectorAll('.sport-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sport = e.target.closest('.sport-btn').dataset.sport;
                this.selectSport(sport);
            });
        });

        // Tab buttons
        this.element.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Create team button
        const createTeamBtn = this.element.querySelector('#createTeamBtn');
        if (createTeamBtn) {
            createTeamBtn.addEventListener('click', () => {
                this.showCreateTeamModal();
            });
        }

        // Stadium upgrade buttons
        this.element.querySelectorAll('.btn-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeType = e.target.dataset.upgrade;
                this.upgradeStadium(upgradeType);
            });
        });

        // Other UI event bindings
        this.bindRosterEvents();
        this.bindTournamentEvents();
        this.bindGamblingEvents();
    }
    bindRosterEvents() {
        const signPlayerBtn = this.element.querySelector('#signPlayerBtn');
        const hireCoachBtn = this.element.querySelector('#hireCoachBtn');

        if (signPlayerBtn) {
            signPlayerBtn.addEventListener('click', () => {
                this.showPlayerMarket();
            });
        }

        if (hireCoachBtn) {
            hireCoachBtn.addEventListener('click', () => {
                this.showCoachMarket();
            });
        }
    }

    bindTournamentEvents() {
        const createTournamentBtn = this.element.querySelector('#createTournamentBtn');
        
        if (createTournamentBtn) {
            createTournamentBtn.addEventListener('click', () => {
                this.showCreateTournamentModal();
            });
        }
    }

    bindGamblingEvents() {
        // Betting events will be bound dynamically when matches are loaded
    }

    selectSport(sport) {
        this.currentSport = sport;
        
        // Update active sport button
        this.element.querySelectorAll('.sport-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.element.querySelector(`[data-sport="${sport}"]`).classList.add('active');

        // Check if team exists for this sport
        const hasTeam = this.hasTeamForSport(sport);
        const hasStadium = this.hasStadiumForSport(sport);

        if (hasStadium) {
            this.showTeamInterface(hasTeam);
            if (hasTeam) {
                this.loadTeamData(sport);
            }
        } else {
            this.showNoTeamsMessage();
        }
    }

    hasStadiumForSport(sport) {
        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem || !window.gameEngine?.currentPlayer?.nation) {
            return false;
        }
        
        return sportsSystem.hasStadiumWonder(window.gameEngine.currentPlayer.nation.id, sport);
    }

    hasTeamForSport(sport) {
        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem || !window.gameEngine?.currentPlayer?.nation) {
            return false;
        }
        
        const team = sportsSystem.getTeam(window.gameEngine.currentPlayer.nation.id, sport);
        return team !== null;
    }

    showTeamInterface(hasTeam) {
        this.element.querySelector('#noTeamsMessage').style.display = 'none';
        this.element.querySelector('#teamInterface').style.display = 'block';

        // Show/hide team creation button
        const createBtn = this.element.querySelector('#createTeamBtn');
        const renameBtn = this.element.querySelector('#renameTeamBtn');
        
        if (hasTeam) {
            createBtn.style.display = 'none';
            renameBtn.style.display = 'inline-block';
        } else {
            createBtn.style.display = 'inline-block';
            renameBtn.style.display = 'none';
        }
    }

    showNoTeamsMessage() {
        this.element.querySelector('#noTeamsMessage').style.display = 'block';
        this.element.querySelector('#teamInterface').style.display = 'none';
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update active tab button
        this.element.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.element.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        this.element.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        this.element.querySelector(`#${tabName}Tab`).classList.add('active');

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        if (!this.currentSport) return;

        switch (tabName) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'roster':
                this.loadRosterData();
                break;
            case 'stadium':
                this.loadStadiumData();
                break;
            case 'matches':
                this.loadMatchesData();
                break;
            case 'tournaments':
                this.loadTournamentsData();
                break;
            case 'gambling':
                this.loadGamblingData();
                break;
        }
    }
    loadTeamData(sport = null) {
        const targetSport = sport || this.currentSport;
        if (!targetSport) return;

        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem || !window.gameEngine?.currentPlayer?.nation) return;

        const team = sportsSystem.getTeam(window.gameEngine.currentPlayer.nation.id, targetSport);
        if (team) {
            this.teams.set(targetSport, team);
            this.updateOverviewDisplay(team);
        }
    }

    loadOverviewData() {
        const team = this.teams.get(this.currentSport);
        if (team) {
            this.updateOverviewDisplay(team);
        }
    }

    updateOverviewDisplay(team) {
        if (!team) return;

        // Update team name
        const teamNameEl = this.element.querySelector('#teamName');
        if (teamNameEl) teamNameEl.textContent = team.name;

        // Update record
        const winsEl = this.element.querySelector('#wins');
        const lossesEl = this.element.querySelector('#losses');
        const drawsEl = this.element.querySelector('#draws');
        
        if (winsEl) winsEl.textContent = team.stats.wins;
        if (lossesEl) lossesEl.textContent = team.stats.losses;
        if (drawsEl) drawsEl.textContent = team.stats.draws;

        // Update budget
        const budgetEl = this.element.querySelector('#teamBudget');
        if (budgetEl) budgetEl.textContent = this.formatNumber(team.budget);

        // Update fan info
        const fanBaseEl = this.element.querySelector('#fanBase');
        const fanLoyaltyEl = this.element.querySelector('#fanLoyalty');
        
        if (fanBaseEl) fanBaseEl.textContent = this.formatNumber(team.fanBase);
        if (fanLoyaltyEl) fanLoyaltyEl.textContent = team.fanLoyalty;

        // Update championships
        const championshipsEl = this.element.querySelector('#championships');
        if (championshipsEl) championshipsEl.textContent = team.stats.championships;
    }

    loadRosterData() {
        const team = this.teams.get(this.currentSport);
        if (!team) return;

        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem) return;

        // Load starting lineup
        this.updateStartingLineup(team, sportsSystem);
        
        // Load bench players
        this.updateBenchPlayers(team, sportsSystem);
        
        // Load injured players
        this.updateInjuredPlayers(team, sportsSystem);
        
        // Load coach info
        this.updateCoachInfo(team);
    }

    updateStartingLineup(team, sportsSystem) {
        const lineupEl = this.element.querySelector('#startingLineup');
        if (!lineupEl) return;

        lineupEl.innerHTML = '';
        
        for (const [position, playerId] of team.roster) {
            const player = sportsSystem.players.get(playerId);
            if (player && !player.isInjured) {
                const playerCard = this.createPlayerCard(player, position, true);
                lineupEl.appendChild(playerCard);
            }
        }
    }

    updateBenchPlayers(team, sportsSystem) {
        const benchEl = this.element.querySelector('#benchPlayers');
        if (!benchEl) return;

        benchEl.innerHTML = '';
        
        const benchPlayers = team.players.filter(playerId => {
            const player = sportsSystem.players.get(playerId);
            const isStarter = Array.from(team.roster.values()).includes(playerId);
            return player && !player.isInjured && !isStarter;
        });

        benchPlayers.forEach(playerId => {
            const player = sportsSystem.players.get(playerId);
            if (player) {
                const playerCard = this.createPlayerCard(player, player.position, false);
                benchEl.appendChild(playerCard);
            }
        });
    }

    updateInjuredPlayers(team, sportsSystem) {
        const injuredEl = this.element.querySelector('#injuredPlayers');
        if (!injuredEl) return;

        injuredEl.innerHTML = '';
        
        const injuredPlayers = team.players.filter(playerId => {
            const player = sportsSystem.players.get(playerId);
            return player && player.isInjured;
        });

        if (injuredPlayers.length === 0) {
            injuredEl.innerHTML = '<p>No injured players</p>';
            return;
        }

        injuredPlayers.forEach(playerId => {
            const player = sportsSystem.players.get(playerId);
            if (player) {
                const playerCard = this.createPlayerCard(player, player.position, false, true);
                injuredEl.appendChild(playerCard);
            }
        });
    }

    createPlayerCard(player, position, isStarter = false, isInjured = false) {
        const card = document.createElement('div');
        card.className = `player-card ${isStarter ? 'starter' : ''} ${isInjured ? 'injured' : ''}`;
        
        const rating = this.calculatePlayerRating(player);
        const salaryFormatted = this.formatNumber(player.salary);
        
        card.innerHTML = `
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-position">${position}</div>
                <div class="player-details">
                    <span>Age: ${player.age}</span>
                    <span>Rating: ${rating}</span>
                    <span>Salary: $${salaryFormatted}</span>
                    ${isInjured ? `<span class="injury-info">Injured (${player.injuryDaysLeft} days)</span>` : ''}
                </div>
            </div>
            <div class="player-actions">
                <button class="btn btn-small" onclick="teamPanel.showPlayerDetails('${player.id}')">
                    View
                </button>
                <button class="btn btn-small btn-danger" onclick="teamPanel.releasePlayer('${player.id}')">
                    Release
                </button>
            </div>
        `;
        
        return card;
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
        
        return Math.round(averageAttribute * ageFactor * moraleFactor);
    }
    updateCoachInfo(team) {
        const coachEl = this.element.querySelector('#coachCard');
        if (!coachEl || !team.coach) return;

        const coach = team.coach;
        const salaryFormatted = this.formatNumber(coach.salary);
        
        coachEl.innerHTML = `
            <div class="coach-info">
                <h6>${coach.name}</h6>
                <div class="coach-details">
                    <div class="coach-stats">
                        <span>Age: ${coach.age}</span>
                        <span>Experience: ${coach.experience} years</span>
                        <span>Salary: $${salaryFormatted}</span>
                        <span>Contract: ${coach.contractYears} years</span>
                    </div>
                    <div class="coach-attributes">
                        <div class="attribute">
                            <span>Tactics:</span>
                            <div class="attribute-bar">
                                <div class="bar-fill" style="width: ${coach.attributes.tactics}%"></div>
                            </div>
                            <span>${coach.attributes.tactics}</span>
                        </div>
                        <div class="attribute">
                            <span>Motivation:</span>
                            <div class="attribute-bar">
                                <div class="bar-fill" style="width: ${coach.attributes.motivation}%"></div>
                            </div>
                            <span>${coach.attributes.motivation}</span>
                        </div>
                        <div class="attribute">
                            <span>Development:</span>
                            <div class="attribute-bar">
                                <div class="bar-fill" style="width: ${coach.attributes.development}%"></div>
                            </div>
                            <span>${coach.attributes.development}</span>
                        </div>
                        <div class="attribute">
                            <span>Management:</span>
                            <div class="attribute-bar">
                                <div class="bar-fill" style="width: ${coach.attributes.management}%"></div>
                            </div>
                            <span>${coach.attributes.management}</span>
                        </div>
                    </div>
                    <div class="coach-record">
                        <span>Record: ${coach.careerRecord.wins}-${coach.careerRecord.losses}</span>
                        <span>Championships: ${coach.careerRecord.championships}</span>
                    </div>
                </div>
            </div>
        `;
    }

    loadStadiumData() {
        const team = this.teams.get(this.currentSport);
        if (!team) return;

        // Update stadium name and capacity
        const stadiumNameEl = this.element.querySelector('#stadiumName');
        const capacityEl = this.element.querySelector('#stadiumCapacity');
        
        if (stadiumNameEl) stadiumNameEl.textContent = team.stadium.name;
        if (capacityEl) capacityEl.textContent = this.formatNumber(team.stadium.capacity);

        // Update upgrade cards
        this.updateUpgradeCards(team);
    }

    updateUpgradeCards(team) {
        const upgradeCards = this.element.querySelectorAll('.upgrade-card');
        
        upgradeCards.forEach(card => {
            const upgradeType = card.dataset.upgrade;
            const level = team.stadium.upgrades[upgradeType] || 0;
            
            // Update level display
            const levelEl = card.querySelector('.level');
            if (levelEl) levelEl.textContent = level;
            
            // Update effect display
            this.updateUpgradeEffect(card, upgradeType, level);
            
            // Update cost and button state
            this.updateUpgradeCost(card, upgradeType, level);
        });
    }

    updateUpgradeEffect(card, upgradeType, level) {
        const effectEl = card.querySelector('.effect');
        const revenueEffectEl = card.querySelector('.revenue-effect');
        
        if (!effectEl) return;
        
        switch (upgradeType) {
            case 'Training Facilities':
                effectEl.textContent = (level * 5).toFixed(1);
                break;
            case 'Medical Center':
                effectEl.textContent = (level * 10).toFixed(0);
                break;
            case 'Youth Academy':
                effectEl.textContent = level;
                break;
            case 'Fan Experience':
                effectEl.textContent = (level * 5).toFixed(0);
                if (revenueEffectEl) revenueEffectEl.textContent = (level * 10).toFixed(0);
                break;
            case 'Technology Center':
                effectEl.textContent = (level * 5).toFixed(1);
                break;
        }
    }

    updateUpgradeCost(card, upgradeType, level) {
        const costEl = card.querySelector('.cost');
        const btnEl = card.querySelector('.btn-upgrade');
        
        if (!costEl || !btnEl) return;
        
        if (level >= 10) {
            btnEl.textContent = 'MAX LEVEL';
            btnEl.disabled = true;
            btnEl.classList.add('disabled');
        } else {
            const sportsSystem = window.gameEngine?.systems?.sports;
            if (sportsSystem) {
                const cost = sportsSystem.getUpgradeCost(upgradeType, level + 1);
                costEl.textContent = this.formatNumber(cost);
                btnEl.disabled = false;
                btnEl.classList.remove('disabled');
            }
        }
    }

    loadMatchesData() {
        // Load match data from sports system
        const matchesListEl = this.element.querySelector('#matchesList');
        if (!matchesListEl) return;

        // This would be populated with actual match data
        matchesListEl.innerHTML = '<p>No matches scheduled</p>';
    }

    loadTournamentsData() {
        // Load tournament data from sports system
        const activeEl = this.element.querySelector('#activeTournamentsList');
        const availableEl = this.element.querySelector('#availableTournamentsList');
        const historyEl = this.element.querySelector('#tournamentHistory');

        if (activeEl) activeEl.innerHTML = '<p>No active tournaments</p>';
        if (availableEl) availableEl.innerHTML = '<p>No tournaments available</p>';
        if (historyEl) historyEl.innerHTML = '<p>No tournament history</p>';
    }

    loadGamblingData() {
        // Load betting data from sports system
        const balanceEl = this.element.querySelector('#bettingBalance');
        const upcomingEl = this.element.querySelector('#upcomingBets');
        const activeEl = this.element.querySelector('#activeBets');
        const historyEl = this.element.querySelector('#bettingHistory');

        if (balanceEl && window.gameEngine?.currentPlayer?.nation) {
            balanceEl.textContent = this.formatNumber(window.gameEngine.currentPlayer.nation.money);
        }

        if (upcomingEl) upcomingEl.innerHTML = '<p>No betting opportunities</p>';
        if (activeEl) activeEl.innerHTML = '<p>No active bets</p>';
        if (historyEl) historyEl.innerHTML = '<p>No betting history</p>';
    }
    // ═══════════════════════════════════════════════════════════════════
    //                           ACTION METHODS
    // ═══════════════════════════════════════════════════════════════════

    showCreateTeamModal() {
        if (!this.currentSport) return;

        const modal = this.createModal('Create Team', `
            <div class="create-team-form">
                <div class="form-group">
                    <label for="teamNameInput">Team Name:</label>
                    <input type="text" id="teamNameInput" placeholder="Enter team name" maxlength="30">
                </div>
                <div class="form-group">
                    <label>Sport:</label>
                    <div class="sport-display">
                        <i class="fas fa-${this.getSportIcon(this.currentSport)}"></i>
                        ${this.currentSport.charAt(0).toUpperCase() + this.currentSport.slice(1)}
                    </div>
                </div>
                <div class="cost-info">
                    <h4>Team Creation Cost: $10,000,000</h4>
                    <p>Includes stadium setup, initial roster, and coaching staff</p>
                </div>
            </div>
        `, [
            {
                text: 'Create Team',
                className: 'btn-primary',
                onClick: () => this.createTeam()
            },
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: () => this.closeModal()
            }
        ]);

        this.showModal(modal);
    }

    createTeam() {
        const teamNameInput = document.querySelector('#teamNameInput');
        const teamName = teamNameInput?.value.trim();

        if (!teamName) {
            this.showNotification('Please enter a team name', 'error');
            return;
        }

        if (!window.gameEngine?.currentPlayer?.nation) {
            this.showNotification('Nation not found', 'error');
            return;
        }

        const nation = window.gameEngine.currentPlayer.nation;
        const cost = 10000000; // $10M

        if (nation.money < cost) {
            this.showNotification('Insufficient funds to create team', 'error');
            return;
        }

        try {
            const sportsSystem = window.gameEngine.systems.sports;
            const team = sportsSystem.createTeam({
                nationId: nation.id,
                sport: this.currentSport,
                teamName: teamName
            });

            // Deduct cost
            nation.money -= cost;

            this.closeModal();
            this.loadTeamData(this.currentSport);
            this.showTeamInterface(true);
            this.showNotification(`${teamName} created successfully!`, 'success');

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    upgradeStadium(upgradeType) {
        if (!this.currentSport || !window.gameEngine?.currentPlayer?.nation) {
            this.showNotification('Team not found', 'error');
            return;
        }

        try {
            const sportsSystem = window.gameEngine.systems.sports;
            sportsSystem.upgradeStadium({
                nationId: window.gameEngine.currentPlayer.nation.id,
                sport: this.currentSport,
                upgradeType: upgradeType
            });

            this.loadTeamData(this.currentSport);
            this.loadStadiumData();
            this.showNotification(`${upgradeType} upgraded successfully!`, 'success');

        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showPlayerDetails(playerId) {
        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem) return;

        const player = sportsSystem.players.get(playerId);
        if (!player) return;

        const attributesHTML = Object.entries(player.attributes).map(([attr, value]) => {
            return `
                <div class="attribute">
                    <span>${attr.charAt(0).toUpperCase() + attr.slice(1)}:</span>
                    <div class="attribute-bar">
                        <div class="bar-fill" style="width: ${value}%"></div>
                    </div>
                    <span>${value}</span>
                </div>
            `;
        }).join('');

        const modal = this.createModal(`${player.name} - Details`, `
            <div class="player-details">
                <div class="player-basic-info">
                    <h4>${player.name}</h4>
                    <p>Position: ${player.position}</p>
                    <p>Age: ${player.age}</p>
                    <p>Salary: $${this.formatNumber(player.salary)}</p>
                    <p>Contract: ${player.contractYears} years</p>
                    <p>Morale: ${player.morale}%</p>
                    <p>Potential: ${player.potential}</p>
                </div>
                <div class="player-attributes">
                    <h5>Attributes</h5>
                    ${attributesHTML}
                </div>
                <div class="player-stats">
                    <h5>Career Stats</h5>
                    <p>Games Played: ${player.gamesPlayed}</p>
                    ${Object.entries(player.careerStats).map(([stat, value]) => 
                        `<p>${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${value}</p>`
                    ).join('')}
                </div>
            </div>
        `, [
            {
                text: 'Close',
                className: 'btn-primary',
                onClick: () => this.closeModal()
            }
        ]);

        this.showModal(modal);
    }

    releasePlayer(playerId) {
        if (!confirm('Are you sure you want to release this player?')) {
            return;
        }

        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem) return;

        const team = this.teams.get(this.currentSport);
        if (!team) return;

        // Remove player from team
        team.players = team.players.filter(id => id !== playerId);
        
        // Remove from roster if starter
        for (const [position, id] of team.roster) {
            if (id === playerId) {
                team.roster.delete(position);
                break;
            }
        }

        // Remove from injuries if injured
        team.injuries.delete(playerId);

        this.loadRosterData();
        this.showNotification('Player released', 'info');
    }

    showPlayerMarket() {
        // Show available players for signing
        const modal = this.createModal('Player Market', `
            <div class="player-market">
                <h4>Available Free Agents</h4>
                <p>Feature coming soon - player trading and free agent market</p>
                <div class="market-filters">
                    <select id="positionFilter">
                        <option value="">All Positions</option>
                        ${this.playerPositions[this.currentSport]?.map(pos => 
                            `<option value="${pos}">${pos}</option>`
                        ).join('') || ''}
                    </select>
                    <input type="range" id="budgetFilter" min="500000" max="10000000" value="5000000">
                    <span>Budget: $<span id="budgetDisplay">5,000,000</span></span>
                </div>
                <div class="available-players">
                    <p>No players currently available</p>
                </div>
            </div>
        `, [
            {
                text: 'Close',
                className: 'btn-secondary',
                onClick: () => this.closeModal()
            }
        ]);

        this.showModal(modal);
    }

    showCoachMarket() {
        // Show available coaches for hiring
        const modal = this.createModal('Coach Market', `
            <div class="coach-market">
                <h4>Available Coaches</h4>
                <p>Feature coming soon - coach hiring market</p>
                <div class="available-coaches">
                    <p>No coaches currently available</p>
                </div>
            </div>
        `, [
            {
                text: 'Close',
                className: 'btn-secondary',
                onClick: () => this.closeModal()
            }
        ]);

        this.showModal(modal);
    }

    showCreateTournamentModal() {
        if (!this.currentSport) return;

        const modal = this.createModal('Create Tournament', `
            <div class="create-tournament-form">
                <div class="form-group">
                    <label for="tournamentName">Tournament Name:</label>
                    <input type="text" id="tournamentName" placeholder="Enter tournament name" maxlength="50">
                </div>
                <div class="form-group">
                    <label for="tournamentType">Tournament Type:</label>
                    <select id="tournamentType">
                        <option value="league">League (Round Robin)</option>
                        <option value="cup">Cup (Knockout)</option>
                        <option value="championship">Championship</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="entryFee">Entry Fee:</label>
                    <input type="number" id="entryFee" min="0" max="10000000" value="1000000">
                </div>
                <div class="tournament-info">
                    <h4>Tournament Details</h4>
                    <p>Tournaments require at least 2 teams to start</p>
                    <p>Prize pool is distributed based on final standings</p>
                </div>
            </div>
        `, [
            {
                text: 'Create Tournament',
                className: 'btn-primary',
                onClick: () => this.createTournamentAction()
            },
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: () => this.closeModal()
            }
        ]);

        this.showModal(modal);
    }

    createTournamentAction() {
        const nameInput = document.querySelector('#tournamentName');
        const typeInput = document.querySelector('#tournamentType');
        const feeInput = document.querySelector('#entryFee');
        
        const name = nameInput?.value.trim();
        const type = typeInput?.value || 'league';
        const fee = parseInt(feeInput?.value) || 1000000;

        if (!name) {
            this.showNotification('Please enter a tournament name', 'error');
            return;
        }

        try {
            const sportsSystem = window.gameEngine?.systems?.sports;
            if (sportsSystem) {
                const tournament = sportsSystem.createTournament(this.currentSport, type);
                tournament.name = name;
                tournament.entryFee = fee;
                tournament.prize.money = fee * 10; // 10x entry fee as prize

                this.closeModal();
                this.loadTournamentsData();
                this.showNotification(`${name} tournament created!`, 'success');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    //                           EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    onTeamCreated(data) {
        if (data.sport === this.currentSport) {
            this.loadTeamData(data.sport);
            this.showTeamInterface(true);
        }
    }

    onStadiumUpgraded(data) {
        if (data.sport === this.currentSport) {
            this.loadStadiumData();
        }
    }

    onMatchCompleted(data) {
        if (this.currentTab === 'matches') {
            this.loadMatchesData();
        }
        
        // Update overview if it's our team
        const team = this.teams.get(this.currentSport);
        if (team && (data.team1 === team.id || data.team2 === team.id)) {
            this.loadOverviewData();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════

    getSportIcon(sport) {
        const icons = {
            basketball: 'basketball-ball',
            hockey: 'hockey-puck',
            soccer: 'futbol'
        };
        return icons[sport] || 'trophy';
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toString();
    }

    createModal(title, content, buttons) {
        return {
            title: title,
            content: content,
            buttons: buttons || []
        };
    }

    showModal(modal) {
        // This would integrate with the existing Modal system
        if (window.gameEngine?.systems?.ui?.modal) {
            window.gameEngine.systems.ui.modal.show({
                title: modal.title,
                content: modal.content,
                buttons: modal.buttons
            });
        }
    }

    closeModal() {
        if (window.gameEngine?.systems?.ui?.modal) {
            window.gameEngine.systems.ui.modal.hide();
        }
    }

    showNotification(message, type = 'info') {
        if (window.gameEngine?.systems?.ui?.notifications) {
            window.gameEngine.systems.ui.notifications.show(message, type);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                         LIFECYCLE METHODS
    // ═══════════════════════════════════════════════════════════════════

    show() {
        if (this.element) {
            this.element.style.display = 'block';
            this.loadInitialData();
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    loadInitialData() {
        // Check what sports are available and auto-select first available
        const sportsSystem = window.gameEngine?.systems?.sports;
        if (!sportsSystem || !window.gameEngine?.currentPlayer?.nation) {
            this.showNoTeamsMessage();
            return;
        }

        const availableSports = sportsSystem.getAvailableSports(window.gameEngine.currentPlayer.nation.id);
        
        if (availableSports.length > 0) {
            this.selectSport(availableSports[0]);
        } else {
            this.showNoTeamsMessage();
        }

        // Update sport button visibility
        this.updateSportButtons(availableSports);
    }

    updateSportButtons(availableSports) {
        this.element.querySelectorAll('.sport-btn').forEach(btn => {
            const sport = btn.dataset.sport;
            if (availableSports.includes(sport)) {
                btn.style.display = 'inline-block';
                btn.disabled = false;
            } else {
                btn.style.display = 'none';
                btn.disabled = true;
            }
        });
    }

    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off('sports:teamCreated', this.onTeamCreated);
            EventBus.off('sports:stadiumUpgraded', this.onStadiumUpgraded);
            EventBus.off('sports:matchCompleted', this.onMatchCompleted);
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //                           SAVE/LOAD STATE
    // ═══════════════════════════════════════════════════════════════════

    getState() {
        return {
            currentTab: this.currentTab,
            currentSport: this.currentSport,
            teams: Array.from(this.teams.entries())
        };
    }

    setState(state) {
        if (state) {
            this.currentTab = state.currentTab || 'overview';
            this.currentSport = state.currentSport;
            this.teams = new Map(state.teams || []);
            
            if (this.currentSport) {
                this.selectSport(this.currentSport);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamPanel;
} else if (typeof window !== 'undefined') {
    window.TeamPanel = TeamPanel;
}