/**
 * Diplomacy System - Advanced Treaty Management
 * Empire Builder - Nation Building Strategy Game
 * 
 * Handles all diplomatic relations, treaties, alliances, and international agreements
 */

class DiplomacySystem {
    constructor() {
        this.isInitialized = false;
        
        // Treaty type definitions
        this.treatyTypes = {
            protectorate: {
                name: 'Protectorate Agreement',
                description: 'Protector guarantees protection in all wars to the protectorate',
                maxNation: 1,
                maxAlliance: 2,
                failurePenalty: { happiness: -25, duration: 7, compensation: true },
                requiresPreAgreedPrice: true,
                category: 'protection'
            },
            extension: {
                name: 'Extension Pact',
                description: 'Nations/alliances act as one entity, assisting in all affairs',
                maxNation: 1,
                maxAlliance: 2,
                failurePenalty: { happiness: -15, duration: 7, compensation: false },
                category: 'unity'
            },
            mutualDefense: {
                name: 'Mutual Defense Pact',
                description: 'Both parties must engage in ALL defensive wars together',
                maxNation: 6, // reduced to 3 if not friends/best friend
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -10, duration: 7, compensation: true },
                requiresPreAgreedPrice: true,
                category: 'defense',
                allowsAllianceEasterEgg: true
            },
            mutualAggression: {
                name: 'Mutual Aggression Pact',
                description: 'Both parties must engage in ALL offensive wars together',
                maxNation: 6, // reduced to 3 if not friends/best friend
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -10, duration: 7, compensation: true },
                requiresPreAgreedPrice: true,
                category: 'aggression',
                allowsAllianceEasterEgg: true
            },
            optionalDefense: {
                name: 'Optional Defense Pact',
                description: 'Parties may choose to engage in defensive wars, no penalties for declining',
                maxNation: 6, // reduced to 3 if not friends/best friend
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -20, duration: 7, compensation: false },
                category: 'defense',
                allowsAllianceEasterEgg: false
            },
            optionalAggression: {
                name: 'Optional Aggression Pact',
                description: 'Parties may choose to engage in offensive wars, no penalties for declining',
                maxNation: 6, // reduced to 3 if not friends/best friend
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -20, duration: 7, compensation: false },
                category: 'aggression',
                allowsAllianceEasterEgg: false
            },
            intelligence: {
                name: 'Intelligence Pact',
                description: 'Share technology and intelligence between nations',
                maxNation: 2,
                maxAlliance: 0, // Alliances cannot sign intelligence pacts
                techShareRatio: 0.2, // Share 1/5 of tech levels
                requiresFinancialOffice: true, // For tech aid
                category: 'intelligence'
            },
            peace: {
                name: 'Peace Pact',
                description: 'Non-aggression agreement preventing war declarations',
                maxNation: 3,
                maxAlliance: 5,
                maxDurationNation: 30, // 30 days for nations
                maxDurationAlliance: 180, // 6 months for alliances
                cannotBreakEarly: true,
                category: 'peace'
            }
        };
        
        // Alliance requirements and easter egg conditions
        this.allianceRequirements = {
            standardRequirement: 'allianceFoundingWonder', // Normal way to create alliances
            easterEggCondition: {
                requiresBestFriend: true,
                requiresFiveFriends: true,
                treatyType: ['mutualDefense', 'mutualAggression', 'protectorate'],
                hintText: 'Join Alliance (Not Create) but if the right people share ties who knows what might happen'
            }
        };
        
        // Active treaties and proposals
        this.activeTreaties = new Map(); // treatyId -> treaty data
        this.treatyProposals = new Map(); // proposalId -> proposal data
        this.allianceInvitations = new Map(); // invitationId -> invitation data
        
        // Global standards for compensation (can be set by World Forum)
        this.globalStandards = {
            protectorateFailure: null, // No monetary compensation
            mutualPactFailure: null,   // No monetary compensation
            colorStandards: new Map(), // color-specific standards
            worldStandard: null        // world forum standard
        };
        
        // Nation diplomacy slots and relationships
        this.nationDiplomacy = new Map(); // nationId -> diplomacy data
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Diplomacy System...');
        this.bindEvents();
        this.isInitialized = true;
        console.log('Diplomacy System ready');
    }
    
    bindEvents() {
        if (typeof EventBus === 'undefined' || typeof GameEvents === 'undefined') return;

        EventBus.on(GameEvents.DAY_PASSED, this.processDailyDiplomacy.bind(this));
        EventBus.on('treaty_proposed', this.handleTreatyProposed.bind(this));
        EventBus.on('treaty_accepted', this.handleTreatyAccepted.bind(this));
        EventBus.on('treaty_declined', this.handleTreatyDeclined.bind(this));
        EventBus.on('war_declared', this.handleWarDeclared.bind(this));
        EventBus.on('war_ended', this.handleWarEnded.bind(this));
    }
    
    // Initialize nation's diplomacy data
    initializeNationDiplomacy(nationId) {
        if (!this.nationDiplomacy.has(nationId)) {
            this.nationDiplomacy.set(nationId, {
                treaties: new Map(),
                treatySlots: this.calculateTreatySlots(nationId),
                relationships: {
                    friends: [],
                    bestFriend: null,
                    foes: [],
                    nemesis: null
                },
                embassySlots: 0,
                pendingProposals: [],
                aidSlots: [],
                penalties: []
            });
        }
        return this.nationDiplomacy.get(nationId);
    }
    
    // Calculate maximum treaty slots based on nation's buildings
    calculateTreatySlots(nationId) {
        const nation = this.getNation(nationId);
        if (!nation) return { embassies: 0 };

        const embassyCount = nation.improvements?.embassy || 0;
        const hasOfficeOfRelationships = nation.projects?.officeOfRelationships || 0;

        return {
            embassies: embassyCount,
            canModifyRelationships: hasOfficeOfRelationships > 0,
            maxFriends: embassyCount,
            maxFoes: embassyCount
        };
    }
    
    // Propose a treaty between two nations/alliances
    proposeTreaty(data) {
        const { proposerId, targetId, treatyType, terms, duration } = data;
        
        // Validate treaty proposal
        const validation = this.validateTreatyProposal(data);
        if (!validation.valid) {
            throw new Error(`Treaty proposal invalid: ${validation.reason}`);
        }
        
        const proposalId = this.generateId();
        const proposal = {
            id: proposalId,
            proposerId,
            targetId,
            treatyType,
            terms,
            duration: duration || null,
            proposedAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending'
        };
        
        this.treatyProposals.set(proposalId, proposal);
        
        // Notify target nation
        EventBus.emit('treaty_proposed', {
            proposal,
            message: `${this.getNationName(proposerId)} has proposed a ${this.treatyTypes[treatyType].name}`
        });
        
        return proposalId;
    }
    
    // Accept a treaty proposal
    acceptTreaty(proposalId) {
        const proposal = this.treatyProposals.get(proposalId);
        if (!proposal) {
            throw new Error('Treaty proposal not found');
        }
        
        if (proposal.status !== 'pending') {
            throw new Error('Treaty proposal no longer pending');
        }
        
        if (Date.now() > proposal.expiresAt) {
            throw new Error('Treaty proposal has expired');
        }
        
        // Create active treaty
        const treatyId = this.generateId();
        const treaty = {
            id: treatyId,
            type: proposal.treatyType,
            parties: [proposal.proposerId, proposal.targetId],
            terms: proposal.terms,
            createdAt: Date.now(),
            expiresAt: proposal.duration ? Date.now() + (proposal.duration * 24 * 60 * 60 * 1000) : null,
            violations: 0,
            status: 'active'
        };
        
        this.activeTreaties.set(treatyId, treaty);
        
        // Update nation diplomacy records
        this.addTreatyToNation(proposal.proposerId, treatyId, treaty);
        this.addTreatyToNation(proposal.targetId, treatyId, treaty);
        
        // Remove proposal
        proposal.status = 'accepted';
        this.treatyProposals.delete(proposalId);
        
        // Check for alliance easter egg
        this.checkAllianceEasterEgg(proposal.proposerId, proposal.targetId);
        
        EventBus.emit('treaty_accepted', { treaty, proposal });
        EventBus.emit('treaty_signed', { treaty, proposal, participants: [proposal.proposerId, proposal.targetId] });
        
        return treatyId;
    }
    
    // Decline a treaty proposal
    declineTreaty(proposalId) {
        const proposal = this.treatyProposals.get(proposalId);
        if (!proposal) {
            throw new Error('Treaty proposal not found');
        }
        
        proposal.status = 'declined';
        this.treatyProposals.delete(proposalId);
        
        EventBus.emit('treaty_declined', { proposal });
        
        return true;
    }
    
    // Check for alliance easter egg condition
    checkAllianceEasterEgg(nationId1, nationId2) {
        const diplomacy1 = this.nationDiplomacy.get(nationId1);
        const diplomacy2 = this.nationDiplomacy.get(nationId2);
        
        if (!diplomacy1 || !diplomacy2) return false;
        
        // Check if one nation is the other's best friend and has 5 friends
        const checkNation = (mainNationId, mainNationDiplomacy, otherNationId) => {
            if (mainNationDiplomacy.relationships.bestFriend !== otherNationId) return false;
            if (mainNationDiplomacy.relationships.friends.length < 5) return false;
            
            // Check if all 5 friends have mutual pacts with main nation
            const friendsWithMutualPacts = mainNationDiplomacy.relationships.friends.filter(friendId => {
                return this.hasMutualPact(mainNationId, friendId);
            });
            
            if (friendsWithMutualPacts.length < 5) return false;
            
            // Check if best friend has mutual pact or protectorate with all 5 friends
            const bestFriendHasPacts = mainNationDiplomacy.relationships.friends.every(friendId => {
                return this.hasMutualPact(otherNationId, friendId) || this.hasProtectorate(otherNationId, friendId);
            });
            
            return bestFriendHasPacts;
        };
        
        if (checkNation(nationId1, diplomacy1, nationId2) || checkNation(nationId2, diplomacy2, nationId1)) {
            // Easter egg condition met! Enable alliance creation
            EventBus.emit('alliance_easter_egg_available', {
                nations: [nationId1, nationId2],
                message: 'Special alliance opportunity detected! The bonds between these nations run deep...'
            });
            return true;
        }
        
        return false;
    }
    
    // Validate treaty proposal
    validateTreatyProposal(data) {
        const { proposerId, targetId, treatyType, terms } = data;
        const treatyDef = this.treatyTypes[treatyType];
        
        if (!treatyDef) {
            return { valid: false, reason: 'Invalid treaty type' };
        }
        
        // Check proposer and target exist
        const proposerNation = this.getNation(proposerId);
        const targetNation = this.getNation(targetId);
        
        if (!proposerNation) {
            return { valid: false, reason: 'Proposer nation not found' };
        }
        if (!targetNation) {
            return { valid: false, reason: 'Target nation not found' };
        }
        
        // Cannot propose treaty to yourself
        if (proposerId === targetId) {
            return { valid: false, reason: 'Cannot propose treaty to yourself' };
        }
        
        // Check if already have an active treaty of this type with this nation
        const proposerDiplomacy = this.nationDiplomacy.get(proposerId);
        if (proposerDiplomacy) {
            for (const [, treaty] of proposerDiplomacy.treaties) {
                if (treaty.type === treatyType && treaty.parties.includes(targetId)) {
                    return { valid: false, reason: `Already have an active ${treatyType} treaty with this nation` };
                }
            }
        }
        
        // Check if proposer has embassy requirement
        if (treatyDef.requiresEmbassies) {
            if (!proposerDiplomacy || proposerDiplomacy.treatySlots.embassies < treatyDef.requiresEmbassies) {
                return { valid: false, reason: `Requires ${treatyDef.requiresEmbassies} embassies` };
            }
        }
        
        // Check treaty limits
        const proposerTreatyCount = this.getNationTreatyCount(proposerId, treatyType);
        const maxTreaties = treatyDef.maxNation; // Assuming nations for now
        
        if (proposerTreatyCount >= maxTreaties) {
            return { valid: false, reason: `Maximum ${maxTreaties} ${treatyType} treaties allowed` };
        }
        
        // Check friend/foe relationship requirements
        if (treatyDef.maxNation === 6) {
            const relationship = this.getRelationship(proposerId, targetId);
            if (!relationship || (relationship !== 'friend' && relationship !== 'bestFriend')) {
                const reducedMax = 3;
                if (proposerTreatyCount >= reducedMax) {
                    return { valid: false, reason: `Maximum ${reducedMax} treaties without friend relationship` };
                }
            }
        }
        
        // Check for Financial Assistance Office requirement
        if (treatyType === 'intelligence' && treatyDef.requiresFinancialOffice) {
            const proposerNation = this.getNation(proposerId);
            if (!proposerNation.projects?.financialAssistanceOffice) {
                // Reduce tech sharing if no Financial Assistance Office
                // This is handled in the intelligence pact processing
            }
        }
        
        return { valid: true };
    }
    
    // Process daily diplomacy events
    processDailyDiplomacy(data) {
        this.processExpiredProposals();
        this.processExpiredTreaties();
        this.processHappinessPenalties();
        this.processAidSlots();
    }
    
    // Process expired proposals
    processExpiredProposals() {
        const now = Date.now();
        
        // Clean up expired treaty proposals
        for (const [id, proposal] of this.treatyProposals) {
            if (now > proposal.expiresAt) {
                this.treatyProposals.delete(id);
                EventBus.emit('treaty_proposal_expired', { proposal });
            }
        }
    }
    
    // Process expired treaties (mainly peace pacts)
    processExpiredTreaties() {
        const now = Date.now();
        
        for (const [id, treaty] of this.activeTreaties) {
            if (treaty.expiresAt && now > treaty.expiresAt) {
                this.removeTreaty(id);
                EventBus.emit('treaty_expired', { treaty });
            }
        }
    }
    
    // Process happiness penalties from treaty violations
    processHappinessPenalties() {
        for (const [nationId, diplomacy] of this.nationDiplomacy) {
            diplomacy.penalties = diplomacy.penalties.filter(penalty => {
                // Apply happiness reduction each day while penalty is active
                const nation = this.getNation(nationId);
                if (nation && penalty.amount > 0) {
                    nation.happiness = Math.max(0, (nation.happiness || 50) - penalty.amount);
                }

                penalty.duration--;
                if (penalty.duration <= 0) {
                    // Remove penalty
                    return false;
                }
                return true;
            });
        }
    }
    
    // Process aid slot cleanups
    processAidSlots() {
        const now = Date.now();
        
        for (const [nationId, diplomacy] of this.nationDiplomacy) {
            diplomacy.aidSlots = diplomacy.aidSlots.filter(slot => {
                return now <= slot.expiresAt;
            });
        }
    }
    
    // Utility methods
    generateId() {
        return 'treaty_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getNation(nationId) {
        // Try window.Nation first (single-player / active nation)
        if (window.Nation && window.Nation.id === nationId) {
            return window.Nation;
        }

        // Try DataManager currentPlayer nations (multi-nation support)
        if (window.DataManager && window.DataManager.currentPlayer) {
            const nations = window.DataManager.currentPlayer.nations || [];
            const found = nations.find(n => n.id === nationId);
            if (found) return found;
        }

        // Try DataManager directly
        if (window.DataManager && window.DataManager.nations) {
            const found = window.DataManager.nations.find(n => n.id === nationId);
            if (found) return found;
        }

        // Fallback: try GameEngine.currentNation
        if (window.GameEngine && window.GameEngine.currentNation && window.GameEngine.currentNation.id === nationId) {
            return window.GameEngine.currentNation;
        }

        return null;
    }
    
    getNationName(nationId) {
        const nation = this.getNation(nationId);
        return nation ? nation.name : `Nation ${nationId}`;
    }
    
    getRelationship(nationId1, nationId2) {
        const diplomacy = this.nationDiplomacy.get(nationId1);
        if (!diplomacy) return null;

        if (diplomacy.relationships.bestFriend === nationId2) return 'bestFriend';
        if (diplomacy.relationships.friends.includes(nationId2)) return 'friend';
        if (diplomacy.relationships.nemesis === nationId2) return 'nemesis';
        if (diplomacy.relationships.foes.includes(nationId2)) return 'foe';

        return null;
    }

    // Relationship modification methods
    addFriend(nationId1, nationId2) {
        const diplomacy = this.initializeNationDiplomacy(nationId1);
        if (!diplomacy.relationships.friends.includes(nationId2)) {
            diplomacy.relationships.friends.push(nationId2);
        }
        // Reciprocal friendship
        const diplomacy2 = this.initializeNationDiplomacy(nationId2);
        if (!diplomacy2.relationships.friends.includes(nationId1)) {
            diplomacy2.relationships.friends.push(nationId1);
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: 'friend'
        });

        return true;
    }

    removeFriend(nationId1, nationId2) {
        const diplomacy = this.nationDiplomacy.get(nationId1);
        if (diplomacy) {
            const idx = diplomacy.relationships.friends.indexOf(nationId2);
            if (idx >= 0) diplomacy.relationships.friends.splice(idx, 1);
        }
        const diplomacy2 = this.nationDiplomacy.get(nationId2);
        if (diplomacy2) {
            const idx2 = diplomacy2.relationships.friends.indexOf(nationId1);
            if (idx2 >= 0) diplomacy2.relationships.friends.splice(idx2, 1);
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: null
        });

        return true;
    }

    setBestFriend(nationId1, nationId2) {
        const diplomacy = this.initializeNationDiplomacy(nationId1);
        diplomacy.relationships.bestFriend = nationId2;

        // Ensure best friend is also in friends list
        if (!diplomacy.relationships.friends.includes(nationId2)) {
            diplomacy.relationships.friends.push(nationId2);
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: 'bestFriend'
        });

        return true;
    }

    addFoe(nationId1, nationId2) {
        const diplomacy = this.initializeNationDiplomacy(nationId1);
        if (!diplomacy.relationships.foes.includes(nationId2)) {
            diplomacy.relationships.foes.push(nationId2);
        }
        // Reciprocal foe
        const diplomacy2 = this.initializeNationDiplomacy(nationId2);
        if (!diplomacy2.relationships.foes.includes(nationId1)) {
            diplomacy2.relationships.foes.push(nationId1);
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: 'foe'
        });

        return true;
    }

    removeFoe(nationId1, nationId2) {
        const diplomacy = this.nationDiplomacy.get(nationId1);
        if (diplomacy) {
            const idx = diplomacy.relationships.foes.indexOf(nationId2);
            if (idx >= 0) diplomacy.relationships.foes.splice(idx, 1);
        }
        const diplomacy2 = this.nationDiplomacy.get(nationId2);
        if (diplomacy2) {
            const idx2 = diplomacy2.relationships.foes.indexOf(nationId1);
            if (idx2 >= 0) diplomacy2.relationships.foes.splice(idx2, 1);
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: null
        });

        return true;
    }

    setNemesis(nationId1, nationId2) {
        const diplomacy = this.initializeNationDiplomacy(nationId1);
        diplomacy.relationships.nemesis = nationId2;

        // Also add as foe
        if (!diplomacy.relationships.foes.includes(nationId2)) {
            diplomacy.relationships.foes.push(nationId2);
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: 'nemesis'
        });

        return true;
    }
    
    hasMutualPact(nationId1, nationId2) {
        const diplomacy = this.nationDiplomacy.get(nationId1);
        if (!diplomacy) return false;
        
        for (const [treatyId, treaty] of diplomacy.treaties) {
            if (treaty.type === 'mutualDefense' || treaty.type === 'mutualAggression') {
                if (treaty.parties.includes(nationId2)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    hasProtectorate(nationId1, nationId2) {
        const diplomacy = this.nationDiplomacy.get(nationId1);
        if (!diplomacy) return false;
        
        for (const [treatyId, treaty] of diplomacy.treaties) {
            if (treaty.type === 'protectorate') {
                if (treaty.parties.includes(nationId2)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    getNationTreatyCount(nationId, treatyType) {
        const diplomacy = this.nationDiplomacy.get(nationId);
        if (!diplomacy) return 0;
        
        let count = 0;
        for (const [treatyId, treaty] of diplomacy.treaties) {
            if (treaty.type === treatyType) {
                count++;
            }
        }
        return count;
    }
    
    addTreatyToNation(nationId, treatyId, treaty) {
        let diplomacy = this.nationDiplomacy.get(nationId);
        if (!diplomacy) {
            diplomacy = this.initializeNationDiplomacy(nationId);
        }
        diplomacy.treaties.set(treatyId, treaty);
    }
    
    removeTreaty(treatyId) {
        const treaty = this.activeTreaties.get(treatyId);
        if (!treaty) return;
        
        // Remove from all parties
        for (const nationId of treaty.parties) {
            const diplomacy = this.nationDiplomacy.get(nationId);
            if (diplomacy) {
                diplomacy.treaties.delete(treatyId);
            }
        }
        
        this.activeTreaties.delete(treatyId);

        EventBus.emit('treaty_removed', { treatyId, treaty });
    }
    
    // War event handlers
    handleWarDeclared(data) {
        if (!data || !data.war) return;

        const war = data.war;
        const attackerId = war.originalAttacker;
        const defenderId = war.originalDefender;

        if (!attackerId || !defenderId) return;

        // Check all active treaties for violations
        this.checkTreatyViolations('war_declared', attackerId, defenderId);
    }

    handleWarEnded(data) {
        if (!data || !data.war) return;

        const war = data.war;
        const winnerId = war.winner === 'attacker' ? war.originalAttacker : war.winner === 'defender' ? war.originalDefender : null;
        const loserId = war.winner === 'attacker' ? war.originalDefender : war.winner === 'defender' ? war.originalAttacker : null;

        if (!winnerId || !loserId) return;

        // Process any post-war treaty obligations
        this.processTreatyObligations('war_ended', winnerId, loserId);
    }
    
    checkTreatyViolations(eventType, nationId1, nationId2) {
        if (eventType !== 'war_declared') return;

        // When a war is declared between two nations, check if any active treaties
        // require mutual participation or prohibit war between the parties.
        const nations = [nationId1, nationId2];

        for (const [treatyId, treaty] of this.activeTreaties) {
            const parties = treaty.parties;

            // Only check treaties that involve one of the warring nations
            const involvesWarNation = parties.some(p => nations.includes(p));
            if (!involvesWarNation) continue;

            const treatyType = treaty.type;

            // Peace pacts prohibit war between the parties
            if (treatyType === 'peace') {
                // If both warring nations are parties to the same peace pact, it's a violation
                if (parties.includes(nationId1) && parties.includes(nationId2)) {
                    this.applyTreatyViolation(treatyId, nationId1, nationId2, 'peace_pact_violation');
                }
            }

            // Mutual defense / mutual aggression: check if treaty partner is on the opposing side
            // and whether the obligated nation is participating
            if (treatyType === 'mutualDefense' || treatyType === 'mutualAggression') {
                // Both nations in the treaty are now at war with each other - treaty conflict
                if (parties.includes(nationId1) && parties.includes(nationId2)) {
                    this.applyTreatyViolation(treatyId, nationId1, nationId2, 'mutual_pact_conflict');
                }
            }
        }
    }

    applyTreatyViolation(treatyId, nationId1, nationId2, violationType) {
        const treaty = this.activeTreaties.get(treatyId);
        if (!treaty) return;

        treaty.violations = (treaty.violations || 0) + 1;

        const treatyDef = this.treatyTypes[treaty.type];
        const penalty = treatyDef?.failurePenalty;

        if (!penalty) return;

        // Apply happiness penalty to both parties
        [nationId1, nationId2].forEach(nationId => {
            const nation = this.getNation(nationId);
            const diplomacy = this.nationDiplomacy.get(nationId);

            if (nation) {
                nation.happiness = Math.max(0, (nation.happiness || 50) + penalty.happiness);
            }

            if (diplomacy) {
                diplomacy.penalties = diplomacy.penalties || [];
                diplomacy.penalties.push({
                    type: violationType,
                    treatyId,
                    treatyType: treaty.type,
                    amount: Math.abs(penalty.happiness),
                    duration: penalty.duration,
                    appliedAt: Date.now()
                });
            }
        });

        EventBus.emit('treaty_violation', {
            treatyId,
            treatyType: treaty.type,
            violationType,
            nations: [nationId1, nationId2],
            penalty
        });
    }
    
    processTreatyObligations(eventType, winnerId, loserId) {
        if (eventType !== 'war_ended') return;

        // Check treaties involving the winner or loser for fulfillment/penalty processing
        for (const [treatyId, treaty] of this.activeTreaties) {
            const parties = treaty.parties;
            const involvesWinner = parties.includes(winnerId);
            const involvesLoser = parties.includes(loserId);

            if (!involvesWinner && !involvesLoser) continue;

            const treatyType = treaty.type;

            // Protectorate: protector must defend protectorate. If protectorate lost, protector failed.
            if (treatyType === 'protectorate') {
                if (involvesLoser && !involvesWinner) {
                    // The loser was the protectorate (or protector); apply penalty to the other party
                    const penalizedId = parties.find(p => p !== loserId) || loserId;
                    this.applyTreatyViolation(treatyId, penalizedId, loserId, 'protectorate_failure');
                }
            }

            // Mutual defense: if an ally was attacked and didn't join the defensive war, violation
            if (treatyType === 'mutualDefense') {
                if (involvesLoser && !involvesWinner) {
                    const penalizedId = parties.find(p => p !== loserId) || loserId;
                    this.applyTreatyViolation(treatyId, penalizedId, loserId, 'mutual_defense_failure');
                }
            }

            // Mutual aggression: if an ally declared offensive war and didn't join
            if (treatyType === 'mutualAggression') {
                if (involvesWinner && !involvesLoser) {
                    const penalizedId = parties.find(p => p !== winnerId) || winnerId;
                    this.applyTreatyViolation(treatyId, penalizedId, winnerId, 'mutual_aggression_failure');
                }
            }
        }
    }
    
    // Get nation's diplomacy status for UI
    getNationDiplomacyStatus(nationId) {
        const diplomacy = this.nationDiplomacy.get(nationId);
        if (!diplomacy) return null;
        
        return {
            relationships: diplomacy.relationships,
            treatySlots: diplomacy.treatySlots,
            activeTreaties: Array.from(diplomacy.treaties.values()),
            pendingProposals: this.getPendingProposalsForNation(nationId),
            aidSlots: diplomacy.aidSlots.length,
            maxAidSlots: 3,
            penalties: diplomacy.penalties
        };
    }
    
    getPendingProposalsForNation(nationId) {
        const proposals = [];
        
        // Treaty proposals
        for (const proposal of this.treatyProposals.values()) {
            if (proposal.targetId === nationId && proposal.status === 'pending') {
                proposals.push(proposal);
            }
        }
        
        return proposals;
    }
    
    destroy() {
        // Unbind event listeners
        if (typeof EventBus !== 'undefined') {
            EventBus.off(GameEvents.DAY_PASSED, this.processDailyDiplomacy);
            EventBus.off('treaty_proposed', this.handleTreatyProposed);
            EventBus.off('treaty_accepted', this.handleTreatyAccepted);
            EventBus.off('treaty_declined', this.handleTreatyDeclined);
            EventBus.off('war_declared', this.handleWarDeclared);
            EventBus.off('war_ended', this.handleWarEnded);
        }

        this.activeTreaties.clear();
        this.treatyProposals.clear();
        this.allianceInvitations.clear();
        this.nationDiplomacy.clear();
        this.isInitialized = false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiplomacySystem };
}