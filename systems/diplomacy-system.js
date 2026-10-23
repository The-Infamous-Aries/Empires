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
        this.aidProposals = new Map(); // aidId -> aid proposal data
        
        // Global standards for compensation (can be set by World Forum)
        this.globalStandards = {
            protectorateFailure: 1000000, // $1M default compensation
            mutualPactFailure: 500000,    // $500K default compensation
            colorStandards: new Map(),    // color-specific standards
            worldStandard: null           // world forum standard
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
        EventBus.on(GameEvents.DAY_PASSED, this.processDailyDiplomacy.bind(this));
        EventBus.on('treaty_proposed', this.handleTreatyProposed.bind(this));
        EventBus.on('treaty_accepted', this.handleTreatyAccepted.bind(this));
        EventBus.on('treaty_declined', this.handleTreatyDeclined.bind(this));
        EventBus.on('aid_proposed', this.handleAidProposed.bind(this));
        EventBus.on('aid_accepted', this.handleAidAccepted.bind(this));
        EventBus.on('aid_declined', this.handleAidDeclined.bind(this));
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
        const nation = GameEngine?.currentNation || DataManager?.currentNation;
        if (!nation || nation.id !== nationId) return { embassies: 0 };
        
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
        const { proposerId, targetId, treatyType, terms, duration, compensation } = data;
        
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
            compensation: compensation || this.getDefaultCompensation(treatyType),
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
            compensation: proposal.compensation,
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
    
    // Propose financial aid
    proposeAid(data) {
        const { proposerId, targetId, aidType, amount } = data;
        
        // Validate aid proposal
        const validation = this.validateAidProposal(data);
        if (!validation.valid) {
            throw new Error(`Aid proposal invalid: ${validation.reason}`);
        }
        
        const nation = this.getNation(proposerId);
        
        // Take resources from proposer immediately
        if (aidType === 'money') {
            if (nation.money < amount) {
                throw new Error('Insufficient funds for aid proposal');
            }
            nation.money -= amount;
        } else if (aidType === 'tech') {
            // Tech aid doesn't cost resources, just shares current tech level
        }
        
        const aidId = this.generateId();
        const aidProposal = {
            id: aidId,
            proposerId,
            targetId,
            aidType,
            amount,
            proposedAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            acceptWindowEnds: null, // Set when accepted (3 days from acceptance)
            status: 'pending'
        };
        
        this.aidProposals.set(aidId, aidProposal);
        
        EventBus.emit('aid_proposed', { aidProposal });
        
        return aidId;
    }
    
    // Accept aid proposal
    acceptAid(aidId) {
        const aidProposal = this.aidProposals.get(aidId);
        if (!aidProposal) {
            throw new Error('Aid proposal not found');
        }
        
        if (aidProposal.status !== 'pending') {
            throw new Error('Aid proposal no longer pending');
        }
        
        if (Date.now() > aidProposal.expiresAt) {
            throw new Error('Aid proposal has expired');
        }
        
        // Transfer aid to target
        const targetNation = this.getNation(aidProposal.targetId);
        
        if (aidProposal.aidType === 'money') {
            targetNation.money += aidProposal.amount;
        } else if (aidProposal.aidType === 'tech') {
            const proposerNation = this.getNation(aidProposal.proposerId);
            const techTransfer = Math.floor(proposerNation.tech * 0.2); // 1/5 of tech
            targetNation.tech += techTransfer;
        }
        
        aidProposal.status = 'accepted';
        aidProposal.acceptWindowEnds = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days
        
        EventBus.emit('aid_accepted', { aidProposal });
        
        return true;
    }
    
    // Decline aid proposal
    declineAid(aidId) {
        const aidProposal = this.aidProposals.get(aidId);
        if (!aidProposal) {
            throw new Error('Aid proposal not found');
        }
        
        // Return resources to proposer after 1 day delay
        setTimeout(() => {
            if (aidProposal.aidType === 'money') {
                const proposerNation = this.getNation(aidProposal.proposerId);
                proposerNation.money += aidProposal.amount;
            }
        }, 24 * 60 * 60 * 1000); // 1 day delay
        
        aidProposal.status = 'declined';
        this.aidProposals.delete(aidId);
        
        EventBus.emit('aid_declined', { aidProposal });
        
        return true;
    }
    
    // Check for alliance easter egg condition
    checkAllianceEasterEgg(nationId1, nationId2) {
        const diplomacy1 = this.nationDiplomacy.get(nationId1);
        const diplomacy2 = this.nationDiplomacy.get(nationId2);
        
        if (!diplomacy1 || !diplomacy2) return false;
        
        // Check if one nation is the other's best friend and has 5 friends
        const checkNation = (mainNation, otherNation) => {
            if (mainNation.relationships.bestFriend !== otherNation) return false;
            if (mainNation.relationships.friends.length < 5) return false;
            
            // Check if all 5 friends have mutual pacts with main nation
            const friendsWithMutualPacts = mainNation.relationships.friends.filter(friendId => {
                return this.hasMutualPact(mainNation.id, friendId);
            });
            
            if (friendsWithMutualPacts.length < 5) return false;
            
            // Check if best friend has mutual pact or protectorate with all 5 friends
            const bestFriendHasPacts = mainNation.relationships.friends.every(friendId => {
                return this.hasMutualPact(otherNation, friendId) || this.hasProtectorate(otherNation, friendId);
            });
            
            return bestFriendHasPacts;
        };
        
        if (checkNation(diplomacy1, nationId2) || checkNation(diplomacy2, nationId1)) {
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
        
        // Check if proposer has embassy requirement
        if (treatyDef.requiresEmbassies) {
            const proposerDiplomacy = this.nationDiplomacy.get(proposerId);
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
    
    // Validate aid proposal
    validateAidProposal(data) {
        const { proposerId, targetId, aidType, amount } = data;
        const proposerNation = this.getNation(proposerId);
        
        if (!proposerNation.projects?.financialAssistanceOffice) {
            return { valid: false, reason: 'Requires Financial Assistance Office' };
        }
        
        // Check aid slots (3 maximum)
        const proposerDiplomacy = this.nationDiplomacy.get(proposerId);
        if (proposerDiplomacy.aidSlots.length >= 3) {
            return { valid: false, reason: 'Maximum 3 aid proposals allowed' };
        }
        
        if (aidType === 'money' && proposerNation.money < amount) {
            return { valid: false, reason: 'Insufficient funds' };
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
        
        // Clean up expired aid proposals
        for (const [id, aidProposal] of this.aidProposals) {
            if (now > aidProposal.expiresAt) {
                // Return money to proposer if declined by timeout
                if (aidProposal.aidType === 'money') {
                    const proposerNation = this.getNation(aidProposal.proposerId);
                    proposerNation.money += aidProposal.amount;
                }
                this.aidProposals.delete(id);
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
        // This would get the nation from the game's nation storage
        return GameEngine?.currentNation || DataManager?.currentNation;
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
    }
    
    getDefaultCompensation(treatyType) {
        const standards = this.globalStandards;
        
        if (treatyType === 'protectorate') {
            return standards.protectorateFailure;
        } else if (treatyType.includes('mutual')) {
            return standards.mutualPactFailure;
        }
        
        return 0;
    }
    
    // War event handlers
    handleWarDeclared(data) {
        const { attackerId, defenderId } = data;
        
        // Check all active treaties for violations
        this.checkTreatyViolations('war_declared', attackerId, defenderId);
    }
    
    handleWarEnded(data) {
        const { winnerId, loserId } = data;
        
        // Process any post-war treaty obligations
        this.processTreatyObligations('war_ended', winnerId, loserId);
    }
    
    checkTreatyViolations(eventType, nationId1, nationId2) {
        // This would check all active treaties and apply penalties for violations
        // Complex logic for different treaty types and their requirements
    }
    
    processTreatyObligations(eventType, nationId1, nationId2) {
        // This would process treaty obligations after events
        // Such as protection failures, mutual pact violations, etc.
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
        
        // Aid proposals
        for (const aidProposal of this.aidProposals.values()) {
            if (aidProposal.targetId === nationId && aidProposal.status === 'pending') {
                proposals.push(aidProposal);
            }
        }
        
        return proposals;
    }
    
    destroy() {
        this.activeTreaties.clear();
        this.treatyProposals.clear();
        this.allianceInvitations.clear();
        this.aidProposals.clear();
        this.nationDiplomacy.clear();
        this.isInitialized = false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiplomacySystem };
}