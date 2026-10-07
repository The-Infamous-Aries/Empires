/**
 * World Forum System - Global Governance and Faction Voting
 * Dominion Wars - Nation Building Strategy Game
 */

class WorldForumSystem {
    constructor() {
        this.isInitialized = false;
        
        // Congress composition
        this.congressSeats = new Map(); // factionKey -> seat count
        this.congressMembers = new Map(); // factionKey -> [player representatives]
        this.totalSeats = 12; // Minimum 1 per faction
        
        // Active motions
        this.activeMotions = new Map();
        this.motionHistory = [];
        this.motionIdCounter = 1;
        
        // Voting periods
        this.votingPeriods = {
            faction: 24 * 60 * 60 * 1000, // 24 hours for faction voting
            world: 48 * 60 * 60 * 1000    // 48 hours for world voting
        };
        
        // Motion types and their effects
        this.motionTypes = {
            TRADE_EMBARGO: {
                name: 'Trade Embargo',
                description: 'Impose trade restrictions on a target faction',
                scope: 'world',
                minSupport: 0.6, // 60% support needed
                canPropose: ['all']
            },
            RESOURCE_SUBSIDY: {
                name: 'Resource Subsidy',
                description: 'Provide resource assistance to faction members',
                scope: 'faction',
                minSupport: 0.5, // 50% support needed
                canPropose: ['faction_members']
            },
            MILITARY_ALLIANCE: {
                name: 'Military Alliance',
                description: 'Form defensive pact between factions',
                scope: 'world',
                minSupport: 0.7, // 70% support needed
                canPropose: ['faction_representatives']
            },
            TERRITORY_DISPUTE: {
                name: 'Territory Dispute Resolution',
                description: 'Mediate territorial conflicts between nations',
                scope: 'world',
                minSupport: 0.55, // 55% support needed
                canPropose: ['all']
            },
            FACTION_SANCTION: {
                name: 'Faction Sanctions',
                description: 'Impose penalties on a faction for violations',
                scope: 'world',
                minSupport: 0.65, // 65% support needed
                canPropose: ['faction_representatives']
            },
            RESEARCH_SHARING: {
                name: 'Research Cooperation',
                description: 'Share technology research between factions',
                scope: 'faction',
                minSupport: 0.4, // 40% support needed
                canPropose: ['faction_members']
            },
            WORLD_TAX: {
                name: 'World Development Tax',
                description: 'Implement global tax for infrastructure development',
                scope: 'world',
                minSupport: 0.75, // 75% support needed
                canPropose: ['faction_representatives']
            }
        };
        
        this.initialize();
    }
    
    /**
     * Initialize World Forum system
     */
    initialize() {
        console.log('Initializing World Forum System...');
        
        this.updateCongressComposition();
        this.bindEvents();
        
        this.isInitialized = true;
        console.log('World Forum System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Listen for faction changes
        EventBus.on('faction_joined', this.handleFactionChange, this);
        EventBus.on('faction_left', this.handleFactionChange, this);
        
        // Listen for daily updates
        EventBus.on(GameEvents.DAY_PASSED, this.handleDailyUpdate, this);
        
        // Listen for account creation
        EventBus.on('account_created', this.handleAccountCreated, this);
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
     * Update Congress composition based on faction membership
     */
    updateCongressComposition() {
        if (!window.GridMap) return;
        
        const factionInfo = GridMap.getFactionInfo();
        const totalMembers = Object.values(factionInfo).reduce((sum, faction) => sum + faction.members, 0);
        
        // Reset seats
        this.congressSeats.clear();
        
        // Calculate seats for each faction
        Object.keys(factionInfo).forEach(factionKey => {
            const faction = factionInfo[factionKey];
            let seats = 1; // Minimum 1 seat per faction
            
            if (totalMembers > 0) {
                // Additional seats based on 5% representation
                const additionalSeats = Math.floor((faction.members / totalMembers) * 20); // 20 total additional seats
                seats += additionalSeats;
            }
            
            this.congressSeats.set(factionKey, seats);
            
            // Initialize representatives if not exists
            if (!this.congressMembers.has(factionKey)) {
                this.congressMembers.set(factionKey, []);
            }
        });
        
        // Update total seats
        this.totalSeats = Array.from(this.congressSeats.values()).reduce((sum, seats) => sum + seats, 0);
        
        console.log('Congress composition updated:', Object.fromEntries(this.congressSeats));
        
        EventBus.emit('congress_updated', {
            seats: Object.fromEntries(this.congressSeats),
            totalSeats: this.totalSeats
        });
    }
    
    /**
     * Propose a new motion
     */
    proposeMotion(proposerId, motionType, motionData) {
        if (!this.motionTypes[motionType]) {
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
        const motionTypeInfo = this.motionTypes[motionType];
        
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
        Object.keys(GridMap.FACTION_COLORS).forEach(factionKey => {
            motion.votes.faction.set(factionKey, { for: 0, against: 0, abstain: 0 });
        });
        
        this.activeMotions.set(motionId, motion);
        
        EventBus.emit('motion_proposed', {
            motion: this.serializeMotion(motion)
        });
        
        console.log(`Motion ${motionId} proposed by ${proposer.username}: ${motion.title}`);
        return motionId;
    }
    
    /**
     * Check if player can propose a motion type
     */
    canPlayerProposeMotion(player, motionType) {
        if (!player.factionKey) return false;
        
        const motionTypeInfo = this.motionTypes[motionType];
        const allowedProposers = motionTypeInfo.canPropose;
        
        if (allowedProposers.includes('all')) return true;
        if (allowedProposers.includes('faction_members') && player.factionKey) return true;
        if (allowedProposers.includes('faction_representatives') && this.isPlayerRepresentative(player)) return true;
        
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
        if (!player.canVoteInFaction()) {
            throw new Error('Player must be faction member for 24+ hours to vote');
        }
        
        // Check voting period
        if (motion.status !== 'faction_voting' || Date.now() > motion.factionVotingEnd) {
            throw new Error('Faction voting period has ended');
        }
        
        // Validate vote
        if (!['for', 'against', 'abstain'].includes(vote)) {
            throw new Error('Invalid vote option');
        }
        
        // Record faction vote
        const factionVotes = motion.votes.faction.get(player.factionKey);
        if (factionVotes) {
            factionVotes[vote]++;
        }
        
        EventBus.emit('vote_cast', {
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
     * Process daily updates for motions
     */
    handleDailyUpdate(data) {
        const currentTime = Date.now();
        
        for (const [motionId, motion] of this.activeMotions.entries()) {
            if (motion.status === 'faction_voting' && currentTime > motion.factionVotingEnd) {
                this.processFactionVotingEnd(motionId);
            } else if (motion.status === 'world_voting' && currentTime > motion.worldVotingEnd) {
                this.processWorldVotingEnd(motionId);
            }
        }
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
        if (motion.scope === 'faction') {
            this.processFactionMotion(motionId);
        } else {
            // Move to world voting
            motion.status = 'world_voting';
            motion.worldVotingEnd = Date.now() + this.votingPeriods.world;
            
            // Set faction votes in world voting
            for (const [factionKey, position] of motion.factionResults.entries()) {
                motion.votes.world.set(factionKey, position);
            }
            
            EventBus.emit('world_voting_started', {
                motion: this.serializeMotion(motion)
            });
        }
    }
    
    /**
     * Process faction-only motion
     */
    processFactionMotion(motionId) {
        const motion = this.activeMotions.get(motionId);
        if (!motion) return;
        
        const proposerFaction = motion.proposerFaction;
        const factionResult = motion.factionResults.get(proposerFaction);
        
        if (factionResult === 'for') {
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
     * Implement passed motion effects
     */
    implementMotion(motion) {
        console.log(`Implementing motion ${motion.id}: ${motion.title}`);
        
        // Motion implementation will be handled by specific motion processors
        EventBus.emit('motion_implemented', {
            motion: this.serializeMotion(motion)
        });
        
        // This is where specific motion effects would be applied
        // For now, we'll emit events that other systems can listen to
        switch (motion.type) {
            case 'TRADE_EMBARGO':
                EventBus.emit('trade_embargo_enacted', motion);
                break;
            case 'RESOURCE_SUBSIDY':
                EventBus.emit('resource_subsidy_enacted', motion);
                break;
            case 'MILITARY_ALLIANCE':
                EventBus.emit('military_alliance_formed', motion);
                break;
            case 'TERRITORY_DISPUTE':
                EventBus.emit('territory_dispute_resolved', motion);
                break;
            case 'FACTION_SANCTION':
                EventBus.emit('faction_sanctions_imposed', motion);
                break;
            case 'RESEARCH_SHARING':
                EventBus.emit('research_sharing_enabled', motion);
                break;
            case 'WORLD_TAX':
                EventBus.emit('world_tax_implemented', motion);
                break;
        }
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
        
        EventBus.emit('motion_completed', {
            motion: this.serializeMotion(motion)
        });
    }
    
    /**
     * Get player by ID (placeholder - would integrate with actual player system)
     */
    getPlayerById(playerId) {
        // For now, return current player if IDs match
        if (window.Player && window.Player.playerId === playerId) {
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
            motionTypes: Object.keys(this.motionTypes)
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
            motionIdCounter: this.motionIdCounter
        };
    }
}

// Create global World Forum instance
const WorldForum = new WorldForumSystem();