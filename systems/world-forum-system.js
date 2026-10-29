/**
 * World Forum System - Global Governance and Faction Voting
 * Dominion Wars - Nation Building Strategy Game
 */

class WorldForumSystem {
    constructor() {
        this.isInitialized = false;
        
        // Congress composition (one seat minimum per color faction = 10 total)
        this.congressSeats = new Map(); // factionKey -> seat count
        this.congressMembers = new Map(); // factionKey -> [player representatives]
        this.totalSeats = 10; // Minimum 1 per faction (10 factions)
        
        // Active motions
        this.activeMotions = new Map();
        this.motionHistory = [];
        this.motionIdCounter = 1;
        
        // Voting periods
        this.votingPeriods = {
            faction: 24 * 60 * 60 * 1000, // 24 hours for faction voting
            world: 48 * 60 * 60 * 1000    // 48 hours for world voting
        };
        
        // Color naming system
        this.colorNames = new Map(); // factionKey -> current name
        this.colorNameHistory = new Map(); // factionKey -> [historical names]
        this.activeColorNameVotes = new Map(); // factionKey -> voting data
        
        // World settings that can be changed via World Forum
        this.worldSettings = {
            worldName: 'Empire Dominion',
            calendar: {
                timeMultiplier: 1.0, // How fast time progresses
                dayLength: 24, // Hours in a game day
                weekLength: 7, // Days in a week
                monthLength: 30, // Days in a month
                yearLength: 365, // Days in a year
                currentYear: 2024,
                currentMonth: 1,
                currentDay: 1
            }
        };
        
        // Active effects (tracked by motion-system.js, mirrored here for UI/history)
        this.activeEffects = new Map();

        // Motion type info is delegated to motion-system.js (truth source)
        this.getMotionTypeInfo = (motionType) => {
            if (typeof window !== 'undefined' && window.motionSystem) {
                return window.motionSystem.getPremadeTemplate(motionType);
            }
            return null;
        };

        this.initialize();
    }

    /**
     * Initialize World Forum system
     */
    initialize() {
        console.log('Initializing World Forum System...');
        
        this.updateCongressComposition();
        this.initializeColorNames();
        this.bindEvents();
        
        this.isInitialized = true;
        console.log('World Forum System initialized');
    }

    /**
     * Safely emit an event if EventBus is available
     */
    emit(eventName, data) {
        if (typeof EventBus !== 'undefined') {
            EventBus.emit(eventName, data);
        }
    }

    /**
     * Initialize color names for factions from the canonical GAME_COLORS list.
     */
    initializeColorNames() {
        const src = (typeof GAME_COLORS !== 'undefined') ? GAME_COLORS
            : (typeof window !== 'undefined' && window.GridMap ? window.GridMap.FACTION_COLORS : {});

        for (const [key, def] of Object.entries(src)) {
            const name = def.name || def.key || key;
            if (!this.colorNames.has(key)) {
                this.colorNames.set(key, name);
            }
            if (!this.colorNameHistory.has(key)) {
                this.colorNameHistory.set(key, [name]);
            }
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        if (typeof EventBus === 'undefined') return;

        // Listen for faction changes
        EventBus.on('faction_joined', this.handleFactionChange, this);
        EventBus.on('faction_left', this.handleFactionChange, this);
        
        // Listen for daily updates
        if (typeof GameEvents !== 'undefined') {
            EventBus.on(GameEvents.DAY_PASSED, this.handleDailyUpdate, this);
        }
        
        // Listen for account creation
        EventBus.on('account_created', this.handleAccountCreated, this);
        
        // Listen for Broadcasting/Internet project changes
        EventBus.on('project_built', this.handleProjectBuilt, this);
        EventBus.on('project_demolished', this.handleProjectDemolished, this);
        EventBus.on('wonder_built', this.handleWonderBuilt, this);
        EventBus.on('wonder_demolished', this.handleWonderDemolished, this);
        
        // Listen for monthly congressional elections
        EventBus.on('month_passed', this.handleMonthlyElections, this);
        
        // Listen for world setting changes
        EventBus.on('world_calendar_changed', this.handleCalendarChange, this);
        EventBus.on('world_name_changed', this.handleWorldNameChange, this);
    }
    
    /**
     * Handle faction membership changes
     */
    handleFactionChange(data) {
        this.updateCongressComposition();
    }
    
    /**
     * Handle new account creation
     */
    handleAccountCreated(data) {
        this.updateCongressComposition();
    }
    
    /**
     * Start congressional elections for all factions
     */
    startCongressionalElections() {
        if (typeof window === 'undefined' || !window.GridMap) return;
        
        const factionInfo = window.GridMap.getFactionInfo();
        const currentTime = Date.now();
        
        Object.keys(factionInfo).forEach(factionKey => {
            const faction = factionInfo[factionKey];
            const seatCount = this.congressSeats.get(factionKey) || 0;
            
            if (seatCount > 0) {
                // Get eligible candidates (players with Broadcasting Network)
                const eligibleCandidates = [];
                if (faction.membersList) {
                    faction.membersList.forEach(member => {
                        if (member.projectEffects?.worldForumAccess) {
                            eligibleCandidates.push({
                                playerId: member.playerId,
                                username: member.username,
                                votes: 0
                            });
                        }
                    });
                }
                
                if (eligibleCandidates.length > 0) {
                    const election = {
                        factionKey: factionKey,
                        candidates: eligibleCandidates,
                        seatsToFill: seatCount,
                        startTime: currentTime,
                        endTime: currentTime + (7 * 24 * 60 * 60 * 1000), // 7 days voting
                        status: 'active',
                        voters: new Set() // Track who has voted
                    };
                    
                    // Store active election
                    this.activeElections = this.activeElections || new Map();
                    this.activeElections.set(factionKey, election);
                    
                    this.emit('congressional_election_started', {
                        factionKey: factionKey,
                        election: election
                    });
                }
            }
        });
    }
    
    /**
     * Vote in congressional election
     */
    voteInCongressionalElection(factionKey, voterId, candidateIds) {
        if (!this.activeElections || !this.activeElections.has(factionKey)) {
            throw new Error('No active election for this faction');
        }
        
        const election = this.activeElections.get(factionKey);
        const voter = this.getPlayerById(voterId);
        
        if (!voter || voter.factionKey !== factionKey) {
            throw new Error('Voter must be member of the faction');
        }
        
        if (!voter.projectEffects?.worldForumAccess) {
            throw new Error('Broadcasting Network required to vote in congressional elections');
        }
        
        if (election.voters.has(voterId)) {
            throw new Error('Player has already voted in this election');
        }
        
        if (Date.now() > election.endTime) {
            throw new Error('Election voting period has ended');
        }
        
        // Validate candidate selection (can vote for up to seat count)
        if (candidateIds.length > election.seatsToFill) {
            throw new Error(`Can only vote for up to ${election.seatsToFill} candidates`);
        }
        
        // Add votes to candidates
        candidateIds.forEach(candidateId => {
            const candidate = election.candidates.find(c => c.playerId === candidateId);
            if (candidate) {
                candidate.votes++;
            }
        });
        
        // Mark voter as having voted
        election.voters.add(voterId);
        
        this.emit('congressional_vote_cast', {
            factionKey: factionKey,
            voterId: voterId,
            candidateIds: candidateIds
        });
        
        return true;
    }
    
    /**
     * Finalize congressional election results
     */
    finalizeCongressionalElection(factionKey) {
        if (!this.activeElections || !this.activeElections.has(factionKey)) return;
        
        const election = this.activeElections.get(factionKey);
        
        // Sort candidates by votes (descending)
        election.candidates.sort((a, b) => b.votes - a.votes);
        
        // Select top candidates for available seats
        const winners = election.candidates.slice(0, election.seatsToFill);
        const winnerIds = winners.map(w => w.playerId);
        
        // Update congress members
        this.congressMembers.set(factionKey, winnerIds);
        
        // Remove completed election
        this.activeElections.delete(factionKey);
        
        this.emit('congressional_election_completed', {
            factionKey: factionKey,
            winners: winners,
            totalVoters: election.voters.size
        });
        
        console.log(`Congressional election completed for ${factionKey}:`, winners);
    }
    
    /**
     * Start color name voting for a faction
     */
    startColorNameVote(factionKey, proposedNames) {
        if (!proposedNames || proposedNames.length < 2) {
            throw new Error('At least 2 name options required');
        }
        
        const currentTime = Date.now();
        const nameVote = {
            factionKey: factionKey,
            options: proposedNames.map(name => ({ name: name, votes: 0 })),
            startTime: currentTime,
            endTime: currentTime + (3 * 24 * 60 * 60 * 1000), // 3 days voting
            status: 'active',
            voters: new Set()
        };
        
        this.activeColorNameVotes.set(factionKey, nameVote);
        
        this.emit('color_name_vote_started', {
            factionKey: factionKey,
            vote: nameVote
        });
        
        return nameVote;
    }
    
    /**
     * Vote on color name
     */
    voteOnColorName(factionKey, voterId, selectedName) {
        if (!this.activeColorNameVotes.has(factionKey)) {
            throw new Error('No active color name vote for this faction');
        }
        
        const nameVote = this.activeColorNameVotes.get(factionKey);
        const voter = this.getPlayerById(voterId);
        
        if (!voter || voter.factionKey !== factionKey) {
            throw new Error('Voter must be member of the faction');
        }
        
        if (nameVote.voters.has(voterId)) {
            throw new Error('Player has already voted on color name');
        }
        
        if (Date.now() > nameVote.endTime) {
            throw new Error('Color name voting period has ended');
        }
        
        // Find and increment vote for selected name
        const option = nameVote.options.find(opt => opt.name === selectedName);
        if (!option) {
            throw new Error('Invalid name selection');
        }
        
        option.votes++;
        nameVote.voters.add(voterId);
        
        this.emit('color_name_vote_cast', {
            factionKey: factionKey,
            voterId: voterId,
            selectedName: selectedName
        });
        
        return true;
    }
    
    /**
     * Finalize color name vote
     */
    finalizeColorNameVote(factionKey) {
        if (!this.activeColorNameVotes.has(factionKey)) return;
        
        const nameVote = this.activeColorNameVotes.get(factionKey);
        
        // Find winning name
        let winningOption = nameVote.options[0];
        nameVote.options.forEach(option => {
            if (option.votes > winningOption.votes) {
                winningOption = option;
            }
        });
        
        // Update color name
        const oldName = this.colorNames.get(factionKey);
        this.colorNames.set(factionKey, winningOption.name);
        
        // Add to history
        if (!this.colorNameHistory.has(factionKey)) {
            this.colorNameHistory.set(factionKey, []);
        }
        this.colorNameHistory.get(factionKey).push(winningOption.name);
        
        // Remove completed vote
        this.activeColorNameVotes.delete(factionKey);
        
        // Update faction name in GridMap if available
        if (typeof window !== 'undefined' && window.GridMap && window.GridMap.FACTION_COLORS[factionKey]) {
            window.GridMap.FACTION_COLORS[factionKey].name = winningOption.name;
        }
        
        this.emit('color_name_changed', {
            factionKey: factionKey,
            oldName: oldName,
            newName: winningOption.name,
            totalVotes: nameVote.voters.size
        });
        
        console.log(`Color name changed for ${factionKey}: ${oldName} -> ${winningOption.name}`);
    }
    
    /**
     * Handle project built (check for Broadcasting)
     */
    handleProjectBuilt(data) {
        if (data.type === 'broadcasting') {
            this.updateCongressComposition();
        }
    }
    
    /**
     * Handle project demolished (check for Broadcasting)
     */
    handleProjectDemolished(data) {
        if (data.type === 'broadcasting') {
            this.updateCongressComposition();
        }
    }
    
    /**
     * Handle wonder built (check for Internet)
     */
    handleWonderBuilt(data) {
        if (data.type === 'internet') {
            // Player can now participate in world-level voting
            console.log('Player gained Internet wonder - can now vote on world affairs');
        }
    }
    
    /**
     * Handle wonder demolished (check for Internet)
     */
    handleWonderDemolished(data) {
        if (data.type === 'internet') {
            // Player lost world-level voting access
            console.log('Player lost Internet wonder - no longer eligible for world affairs voting');
        }
    }
    
    /**
     * Handle monthly congressional elections
     */
    handleMonthlyElections(data) {
        console.log('Starting monthly congressional elections...');
        this.startCongressionalElections();
    }
    
    /**
     * Handle world calendar changes
     */
    handleCalendarChange(data) {
        if (data.newSettings) {
            Object.assign(this.worldSettings.calendar, data.newSettings);
            console.log('World calendar updated:', data.newSettings);
        }
    }
    
    /**
     * Handle world name changes
     */
    handleWorldNameChange(data) {
        if (data.newName) {
            this.worldSettings.worldName = data.newName;
            console.log('World renamed to:', data.newName);
        }
    }
    
    /**
     * Update Congress composition based on faction membership (only nations with Broadcasting)
     */
    updateCongressComposition() {
        if (typeof window === 'undefined' || !window.GridMap) return;
        
        const factionInfo = window.GridMap.getFactionInfo();
        
        // Count only members with Broadcasting Network for Congress eligibility
        const eligibleMembersByFaction = {};
        let totalEligibleMembers = 0;
        
        Object.keys(factionInfo).forEach(factionKey => {
            const faction = factionInfo[factionKey];
            let eligibleCount = 0;
            
            // Count faction members who have Broadcasting Network
            if (faction.membersList) {
                faction.membersList.forEach(member => {
                    if (member.projectEffects?.worldForumAccess) {
                        eligibleCount++;
                    }
                });
            }
            
            eligibleMembersByFaction[factionKey] = eligibleCount;
            totalEligibleMembers += eligibleCount;
        });
        
        // Reset seats
        this.congressSeats.clear();
        
        // Calculate seats for each faction (only for factions with eligible members)
        Object.keys(factionInfo).forEach(factionKey => {
            const eligibleMembers = eligibleMembersByFaction[factionKey];
            
            if (eligibleMembers > 0) {
                let seats = 1; // Minimum 1 seat per faction with Broadcasting networks
                
                if (totalEligibleMembers > 0) {
                    // Additional seats based on 5% representation of Broadcasting-enabled nations
                    const additionalSeats = Math.floor((eligibleMembers / totalEligibleMembers) * 20); // 20 total additional seats
                    seats += additionalSeats;
                }
                
                this.congressSeats.set(factionKey, seats);
            } else {
                // No seats for factions without Broadcasting networks
                this.congressSeats.set(factionKey, 0);
            }
            
            // Initialize representatives if not exists
            if (!this.congressMembers.has(factionKey)) {
                this.congressMembers.set(factionKey, []);
            }
        });
        
        // Update total seats
        this.totalSeats = Array.from(this.congressSeats.values()).reduce((sum, seats) => sum + seats, 0);
        
        console.log('Congress composition updated (Broadcasting-enabled nations only):', {
            eligible: eligibleMembersByFaction,
            seats: Object.fromEntries(this.congressSeats)
        });
        
        this.emit('congress_updated', {
            seats: Object.fromEntries(this.congressSeats),
            totalSeats: this.totalSeats,
            eligibleMembersByFaction: eligibleMembersByFaction
        });
    }
    
    /**
     * Propose a new motion
     */
    proposeMotion(proposerId, motionType, motionData) {
        const motionTypeInfo = this.getMotionTypeInfo(motionType);
        if (!motionTypeInfo) {
            throw new Error('Invalid motion type');
        }
        
        const proposer = this.getPlayerById(proposerId);
        if (!proposer) {
            throw new Error('Proposer not found');
        }
        
        // Check if proposer can propose this type of motion
        if (!this.canPlayerProposeMotion(proposer, motionType)) {
            throw new Error('Player cannot propose this motion type');
        }
        
        const motionId = this.motionIdCounter++;
        
        const motion = {
            id: motionId,
            type: motionType,
            proposer: proposerId,
            proposerFaction: proposer.factionKey,
            title: motionData.title || motionTypeInfo.name,
            description: motionData.description || motionTypeInfo.description,
            scope: motionTypeInfo.scope,
            minSupport: motionTypeInfo.minSupport,
            targets: motionData.targets || [],
            parameters: motionData.parameters || {},
            
            // Voting data
            status: 'faction_voting', // faction_voting, world_voting, passed, failed, expired
            votes: {
                faction: new Map(), // factionKey -> {for: count, against: count, abstain: count}
                world: new Map()    // factionKey -> vote (for/against/abstain based on faction result)
            },
            
            // Timing
            createdDate: Date.now(),
            factionVotingEnd: Date.now() + this.votingPeriods.faction,
            worldVotingEnd: null,
            implementedDate: null,
            
            // Results
            factionResults: new Map(),
            finalResult: null
        };
        
        // Initialize faction voting
        if (typeof window !== 'undefined' && window.GridMap?.FACTION_COLORS) {
            Object.keys(window.GridMap.FACTION_COLORS).forEach(factionKey => {
                motion.votes.faction.set(factionKey, { for: 0, against: 0, abstain: 0 });
            });
        }
        
        this.activeMotions.set(motionId, motion);
        
        this.emit('motion_proposed', {
            motion: this.serializeMotion(motion)
        });
        
        console.log(`Motion ${motionId} proposed by ${proposer.username}: ${motion.title}`);
        return motionId;
    }
    
    /**
     * Check if player can propose a motion
     */
    canPlayerProposeMotion(player, motionType) {
        if (!player.factionKey) return false;
        
        const motionTypeInfo = this.getMotionTypeInfo(motionType);
        if (!motionTypeInfo) return false;
        
        // Check project/wonder requirements
        if (motionTypeInfo.requiresProject && !player.projectEffects?.worldForumAccess) {
            return false;
        }
        
        if (motionTypeInfo.requiresWonder && !player.wonderEffects?.globalVotingEnabled) {
            return false;
        }
        
        // Check scope-based requirements
        if (motionTypeInfo.scope === 'world' && !player.wonderEffects?.globalVotingEnabled) {
            return false;
        }
        
        const allowedProposers = motionTypeInfo.canPropose;
        
        if (allowedProposers.includes('all')) return true;
        if (allowedProposers.includes('faction_members') && player.factionKey) return true;
        if (allowedProposers.includes('faction_representatives') && this.isPlayerRepresentative(player)) return true;
        if (allowedProposers.includes('congress_only') && this.isPlayerRepresentative(player)) return true;
        
        return false;
    }
    
    /**
     * Check if player is a faction representative
     */
    isPlayerRepresentative(player) {
        if (!player.factionKey) return false;
        
        const representatives = this.congressMembers.get(player.factionKey) || [];
        return representatives.includes(player.playerId);
    }
    
    /**
     * Vote on a motion
     */
    voteOnMotion(motionId, playerId, vote, justification = '') {
        const motion = this.activeMotions.get(motionId);
        if (!motion) {
            throw new Error('Motion not found');
        }
        
        const player = this.getPlayerById(playerId);
        if (!player || !player.factionKey) {
            throw new Error('Player not found or not in faction');
        }
        
        // Check if player can vote
        if (!player.canVoteInFaction || typeof player.canVoteInFaction !== 'function' || !player.canVoteInFaction()) {
            throw new Error('Player must be faction member for 24+ hours to vote');
        }
        
        // Check motion scope permissions
        if (motion.scope === 'color' && !player.projectEffects?.worldForumAccess) {
            throw new Error('Broadcasting Network required to vote on color motions');
        }
        
        if (motion.scope === 'world' && !player.wonderEffects?.globalVotingEnabled) {
            throw new Error('Internet Network required to vote on world affairs');
        }
        
        // Check voting period
        if (motion.status !== 'faction_voting' || Date.now() > motion.factionVotingEnd) {
            throw new Error('Faction voting period has ended');
        }
        
        // For color motions, only faction members can vote
        if (motion.scope === 'color' && motion.proposerFaction !== player.factionKey) {
            throw new Error('Can only vote on motions from your own faction');
        }
        
        // Validate vote
        if (!['for', 'against', 'abstain'].includes(vote)) {
            throw new Error('Invalid vote option');
        }
        
        // Record faction vote
        const factionVotes = motion.votes.faction.get(player.factionKey);
        if (factionVotes) {
            // Check if player already voted (track individual votes)
            if (!motion.individualVotes) {
                motion.individualVotes = new Map();
            }
            if (motion.individualVotes.has(playerId)) {
                throw new Error('Player has already voted on this motion');
            }
            
            factionVotes[vote]++;
            motion.individualVotes.set(playerId, {
                vote: vote,
                justification: justification,
                timestamp: Date.now()
            });
        }
        
        this.emit('vote_cast', {
            motionId: motionId,
            playerId: playerId,
            playerFaction: player.factionKey,
            vote: vote,
            justification: justification
        });
        
        console.log(`Player ${player.username} voted ${vote} on motion ${motionId}`);
        return true;
    }
    
    /**
     * Process daily updates for motions and effects
     */
    handleDailyUpdate(data) {
        const currentTime = Date.now();
        
        // Process active motions
        for (const [motionId, motion] of this.activeMotions.entries()) {
            if (motion.status === 'faction_voting' && currentTime > motion.factionVotingEnd) {
                this.processFactionVotingEnd(motionId);
            } else if (motion.status === 'world_voting' && currentTime > motion.worldVotingEnd) {
                this.processWorldVotingEnd(motionId);
            }
        }
        
        // Process active elections
        if (this.activeElections) {
            for (const [factionKey, election] of this.activeElections.entries()) {
                if (election.status === 'active' && currentTime > election.endTime) {
                    this.finalizeCongressionalElection(factionKey);
                }
            }
        }
        
        // Process active color name votes
        for (const [factionKey, nameVote] of this.activeColorNameVotes.entries()) {
            if (nameVote.status === 'active' && currentTime > nameVote.endTime) {
                this.finalizeColorNameVote(factionKey);
            }
        }
    }
    
    /**
     * Expire a motion effect
     */
    expireMotionEffect(motionId) {
        if (!this.activeEffects?.has(motionId)) return;
        
        const effect = this.activeEffects.get(motionId);
        effect.isActive = false;
        
        // Emit expiration events based on motion type
        this.emit('motion_effect_expired', {
            motionId: motionId,
            type: effect.type,
            affectedFactions: effect.affectedFactions
        });
        
        console.log(`Motion effect expired: ${effect.type} (Motion ${motionId})`);
    }
    
    /**
     * Get all active motion effects
     */
    getActiveEffects(factionKey = null) {
        if (!this.activeEffects) return [];
        
        return Array.from(this.activeEffects.values())
            .filter(effect => {
                if (!effect.isActive) return false;
                if (!factionKey) return true;
                
                return effect.affectedFactions === 'all' || 
                       (Array.isArray(effect.affectedFactions) && effect.affectedFactions.includes(factionKey));
            });
    }
    
    /**
     * Get voting summary for UI
     */
    getVotingSummary(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) return null;
        
        const summary = {
            player: {
                factionKey: player.factionKey,
                canVoteColor: !!player.projectEffects?.worldForumAccess,
                canVoteWorld: !!player.wonderEffects?.globalVotingEnabled,
                isCongressMember: this.isPlayerRepresentative(player)
            },
            activeMotions: this.getActiveMotions().filter(motion => {
                // Filter motions player can vote on
                if (motion.scope === 'color') {
                    return motion.proposerFaction === player.factionKey && player.projectEffects?.worldForumAccess;
                }
                if (motion.scope === 'world') {
                    return player.wonderEffects?.globalVotingEnabled;
                }
                return false;
            }),
            activeElections: [],
            activeColorNameVotes: []
        };
        
        // Add active elections for player's faction
        if (this.activeElections?.has(player.factionKey)) {
            summary.activeElections.push(this.activeElections.get(player.factionKey));
        }
        
        // Add active color name votes for player's faction
        if (this.activeColorNameVotes.has(player.factionKey)) {
            summary.activeColorNameVotes.push(this.activeColorNameVotes.get(player.factionKey));
        }
        
        return summary;
    }
    
    /**
     * Get motion templates for proposal creation
     */
    getMotionTemplates(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) return [];
        
        const templates = [];
        
        // Motion type info is delegated to motion-system.js (truth source)
        const allTemplates = typeof window !== 'undefined' && window.motionSystem
            ? window.motionSystem.getPremadeMotionTemplates()
            : {};
        
        Object.entries(allTemplates).forEach(([type, info]) => {
            if (this.canPlayerProposeMotion(player, type)) {
                templates.push({
                    type: type,
                    name: info.name,
                    description: info.description,
                    scope: info.scope,
                    minSupport: info.minSupport,
                    parameters: info.parameters || [],
                    effects: info.effects
                });
            }
        });
        
        return templates;
    }
    
    /**
     * Process end of faction voting period
     */
    processFactionVotingEnd(motionId) {
        const motion = this.activeMotions.get(motionId);
        if (!motion) return;
        
        // Determine faction positions
        for (const [factionKey, votes] of motion.votes.faction.entries()) {
            const totalVotes = votes.for + votes.against + votes.abstain;
            
            if (totalVotes === 0) {
                motion.factionResults.set(factionKey, 'abstain');
            } else if (votes.for > votes.against) {
                motion.factionResults.set(factionKey, 'for');
            } else if (votes.against > votes.for) {
                motion.factionResults.set(factionKey, 'against');
            } else {
                motion.factionResults.set(factionKey, 'abstain');
            }
        }
        
        // Check if motion scope is faction-only
        if (motion.scope === 'color') {
            this.processColorMotion(motionId);
        } else {
            // Move to world voting
            motion.status = 'world_voting';
            motion.worldVotingEnd = Date.now() + this.votingPeriods.world;
            
            // Set faction votes in world voting
            for (const [factionKey, position] of motion.factionResults.entries()) {
                motion.votes.world.set(factionKey, position);
            }
            
            this.emit('world_voting_started', {
                motion: this.serializeMotion(motion)
            });
        }
    }
    
    /**
     * Process color motion results
     */
    processColorMotion(motionId) {
        const motion = this.activeMotions.get(motionId);
        if (!motion) return;
        
        const proposerFaction = motion.proposerFaction;
        const factionResult = motion.factionResults.get(proposerFaction);
        
        // Calculate support percentage
        const factionVotes = motion.votes.faction.get(proposerFaction);
        const totalVotes = factionVotes.for + factionVotes.against + factionVotes.abstain;
        const supportPercentage = totalVotes > 0 ? factionVotes.for / totalVotes : 0;
        
        if (supportPercentage >= motion.minSupport) {
            motion.status = 'passed';
            motion.finalResult = 'passed';
            motion.implementedDate = Date.now();
            this.implementMotion(motion);
        } else {
            motion.status = 'failed';
            motion.finalResult = 'failed';
        }
        
        this.completeMotion(motionId);
    }
    
    /**
     * Process end of world voting period
     */
    processWorldVotingEnd(motionId) {
        const motion = this.activeMotions.get(motionId);
        if (!motion) return;
        
        // Calculate weighted votes based on seats
        let totalSeats = 0;
        let supportSeats = 0;
        
        for (const [factionKey, position] of motion.votes.world.entries()) {
            const seats = this.congressSeats.get(factionKey) || 0;
            totalSeats += seats;
            
            if (position === 'for') {
                supportSeats += seats;
            }
        }
        
        const supportPercentage = totalSeats > 0 ? supportSeats / totalSeats : 0;
        
        if (supportPercentage >= motion.minSupport) {
            motion.status = 'passed';
            motion.finalResult = 'passed';
            motion.implementedDate = Date.now();
            this.implementMotion(motion);
        } else {
            motion.status = 'failed';
            motion.finalResult = 'failed';
        }
        
        this.completeMotion(motionId);
    }
    
    /**
     * Implement motion effects (delegates to Motion System engine)
     */
    implementMotion(motion) {
        console.log(`Implementing motion ${motion.id}: ${motion.title}`);

        // Delegate all effect application to the Motion System engine
        if (typeof window !== 'undefined' && window.motionSystem) {
            window.motionSystem.applyMotion(motion);
        } else if (typeof motionSystem !== 'undefined') {
            motionSystem.applyMotion(motion);
        } else {
            console.warn('Motion System not available; motion effects not applied');
        }

        // Track active effect in world forum for UI/history
        if (!this.activeEffects) {
            this.activeEffects = new Map();
        }

        let endTime = null;
        if (motion.parameters?.duration) {
            const days = typeof window !== 'undefined' && window.motionSystem
                ? window.motionSystem.parseDurationDays(motion.parameters.duration)
                : null;
            if (days !== null) {
                endTime = Date.now() + (days * 24 * 60 * 60 * 1000);
            }
        }

        this.activeEffects.set(motion.id, {
            motionId: motion.id,
            type: motion.type,
            parameters: motion.parameters,
            startTime: Date.now(),
            endTime: endTime,
            affectedFactions: motion.scope === 'color' ? [motion.proposerFaction] : 'all',
            isActive: true
        });

        this.emit('motion_implemented', {
            motion: this.serializeMotion(motion),
            effect: this.activeEffects.get(motion.id)
        });
    }

    /**
     * Complete motion and move to history
     */
    completeMotion(motionId) {
        const motion = this.activeMotions.get(motionId);
        if (!motion) return;
        
        // Move to history
        this.motionHistory.push(this.serializeMotion(motion));
        this.activeMotions.delete(motionId);
        
        this.emit('motion_completed', {
            motion: this.serializeMotion(motion)
        });
    }
    
    /**
     * Get player by ID (placeholder - would integrate with actual player system)
     */
    getPlayerById(playerId) {
        // For now, return current player if IDs match
        if (typeof window !== 'undefined' && window.Player && window.Player.playerId === playerId) {
            return window.Player;
        }
        return null;
    }
    
    /**
     * Get active motions
     */
    getActiveMotions() {
        return Array.from(this.activeMotions.values()).map(motion => this.serializeMotion(motion));
    }
    
    /**
     * Get motion history
     */
    getMotionHistory(limit = 50) {
        return this.motionHistory.slice(-limit);
    }
    
    /**
     * Get Congress information
     */
    getCongressInfo() {
        return {
            totalSeats: this.totalSeats,
            factionSeats: Object.fromEntries(this.congressSeats),
            representatives: Object.fromEntries(this.congressMembers),
            activeMotions: this.activeMotions.size,
            motionTypes: typeof window !== 'undefined' && window.motionSystem
                ? Object.keys(window.motionSystem.getPremadeMotionTemplates())
                : []
        };
    }
    
    /**
     * Serialize motion for transmission
     */
    serializeMotion(motion) {
        return {
            id: motion.id,
            type: motion.type,
            proposer: motion.proposer,
            proposerFaction: motion.proposerFaction,
            title: motion.title,
            description: motion.description,
            scope: motion.scope,
            minSupport: motion.minSupport,
            targets: motion.targets,
            parameters: motion.parameters,
            status: motion.status,
            votes: {
                faction: Object.fromEntries(motion.votes.faction),
                world: Object.fromEntries(motion.votes.world)
            },
            createdDate: motion.createdDate,
            factionVotingEnd: motion.factionVotingEnd,
            worldVotingEnd: motion.worldVotingEnd,
            implementedDate: motion.implementedDate,
            factionResults: Object.fromEntries(motion.factionResults),
            finalResult: motion.finalResult
        };
    }
    
    /**
     * Serialize system state for saving
     */
    serialize() {
        return {
            congressSeats: Object.fromEntries(this.congressSeats),
            congressMembers: Object.fromEntries(this.congressMembers),
            activeMotions: Array.from(this.activeMotions.values()).map(motion => this.serializeMotion(motion)),
            motionHistory: [...this.motionHistory],
            motionIdCounter: this.motionIdCounter,
            colorNames: Object.fromEntries(this.colorNames),
            colorNameHistory: Object.fromEntries(this.colorNameHistory),
            activeColorNameVotes: Object.fromEntries(this.activeColorNameVotes),
            activeElections: this.activeElections ? Object.fromEntries(this.activeElections) : {},
            activeEffects: this.activeEffects ? Object.fromEntries(this.activeEffects) : {},
            worldSettings: this.worldSettings
        };
    }
    
    /**
     * Deserialize system state from saved data
     */
    deserialize(data) {
        if (data.congressSeats) this.congressSeats = new Map(Object.entries(data.congressSeats));
        if (data.congressMembers) this.congressMembers = new Map(Object.entries(data.congressMembers));
        if (data.motionHistory) this.motionHistory = data.motionHistory;
        if (data.motionIdCounter) this.motionIdCounter = data.motionIdCounter;
        if (data.colorNames) this.colorNames = new Map(Object.entries(data.colorNames));
        if (data.colorNameHistory) this.colorNameHistory = new Map(Object.entries(data.colorNameHistory));
        if (data.activeColorNameVotes) this.activeColorNameVotes = new Map(Object.entries(data.activeColorNameVotes));
        if (data.worldSettings) this.worldSettings = data.worldSettings;
        
        // Reconstruct active motions
        if (data.activeMotions) {
            this.activeMotions.clear();
            data.activeMotions.forEach(motionData => {
                const motion = this.deserializeMotion(motionData);
                this.activeMotions.set(motion.id, motion);
            });
        }
        
        // Reconstruct active elections
        if (data.activeElections) {
            this.activeElections = new Map(Object.entries(data.activeElections));
        }
        
        // Reconstruct active effects
        if (data.activeEffects) {
            this.activeEffects = new Map(Object.entries(data.activeEffects));
        }
    }
    
    /**
     * Deserialize motion from saved data
     */
    deserializeMotion(data) {
        return {
            id: data.id,
            type: data.type,
            proposer: data.proposer,
            proposerFaction: data.proposerFaction,
            title: data.title,
            description: data.description,
            scope: data.scope,
            minSupport: data.minSupport,
            targets: data.targets,
            parameters: data.parameters,
            status: data.status,
            votes: {
                faction: new Map(Object.entries(data.votes.faction)),
                world: new Map(Object.entries(data.votes.world))
            },
            createdDate: data.createdDate,
            factionVotingEnd: data.factionVotingEnd,
            worldVotingEnd: data.worldVotingEnd,
            implementedDate: data.implementedDate,
            factionResults: new Map(Object.entries(data.factionResults)),
            finalResult: data.finalResult,
            individualVotes: data.individualVotes ? new Map(Object.entries(data.individualVotes)) : new Map()
        };
    }
}

// Create global World Forum instance
const WorldForum = new WorldForumSystem();