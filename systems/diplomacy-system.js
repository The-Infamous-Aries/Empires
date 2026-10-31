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
                failurePenalty: { happiness: -25, duration: 7 },
                requiresPreAgreedPrice: true,
                category: 'protection'
            },
            extension: {
                name: 'Extension Pact',
                description: 'Nations/alliances act as one entity, assisting in all affairs',
                maxNation: 1,
                maxAlliance: 2,
                failurePenalty: { happiness: -15, duration: 7 },
                category: 'unity'
            },
            mutualDefense: {
                name: 'Mutual Defense Pact',
                description: 'Both parties must engage in ALL defensive wars together',
                maxNation: 6,
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -10, duration: 7 },
                requiresPreAgreedPrice: true,
                category: 'defense',
                allowsAllianceEasterEgg: true
            },
            mutualAggression: {
                name: 'Mutual Aggression Pact',
                description: 'Both parties must engage in ALL offensive wars together',
                maxNation: 6,
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -10, duration: 7 },
                requiresPreAgreedPrice: true,
                category: 'aggression',
                allowsAllianceEasterEgg: true
            },
            optionalDefense: {
                name: 'Optional Defense Pact',
                description: 'Parties may choose to engage in defensive wars, no penalties for declining',
                maxNation: 6,
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -20, duration: 7 },
                category: 'defense',
                allowsAllianceEasterEgg: false
            },
            optionalAggression: {
                name: 'Optional Aggression Pact',
                description: 'Parties may choose to engage in offensive wars, no penalties for declining',
                maxNation: 6,
                maxAlliance: 10,
                requiresEmbassies: 5,
                failurePenalty: { happiness: -20, duration: 7 },
                category: 'aggression',
                allowsAllianceEasterEgg: false
            },
            intelligence: {
                name: 'Intelligence Pact',
                description: 'Share technology and intelligence between nations',
                maxNation: 2,
                maxAlliance: 0,
                techShareRatio: 0.2,
                requiresFinancialOffice: true,
                category: 'intelligence'
            },
            peace: {
                name: 'Peace Pact',
                description: 'Non-aggression agreement preventing war declarations',
                maxNation: 3,
                maxAlliance: 5,
                maxDurationNation: 30,
                maxDurationAlliance: 180,
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
            protectorateFailure: null,
            mutualPactFailure: null,
            colorStandards: new Map(),
            worldStandard: null
        };
        
        // Nation diplomacy slots and relationships
        this.nationDiplomacy = new Map(); // nationId -> diplomacy data

        // Diplomacy scores per nation pair (sorted key "id1:id2" where id1 < id2)
        // Range: -100 (hostile) to +100 (allied). Affects treaty acceptance.
        this.diplomacyScores = new Map();

        // Alliance-to-alliance treaties (allianceId pair -> treaty data)
        this.allianceTreaties = new Map();

        // Track which treaties have already received expiration warnings
        // to avoid duplicate warning emissions
        this._expirationWarnings = new Set();

        // Track bound event handlers for proper unbinding in destroy()
        this._boundHandlers = new Map();

        this.initialize();
    }
    
    initialize() {
        console.log('Initializing Diplomacy System...');
        this.bindEvents();
        this.isInitialized = true;
        console.log('Diplomacy System ready');
    }
    
    bindEvents() {
        if (typeof EventBus === 'undefined' || typeof GameEvents === 'undefined') return;

        const handlers = {
            dayPassed: this.processDailyDiplomacy.bind(this),
            treatyProposed: this.handleTreatyProposed.bind(this),
            treatyAccepted: this.handleTreatyAccepted.bind(this),
            treatyDeclined: this.handleTreatyDeclined.bind(this),
            aidProposed: this.handleAidProposed.bind(this),
            aidAccepted: this.handleAidAccepted.bind(this),
            aidDeclined: this.handleAidDeclined.bind(this),
            warDeclared: this.handleWarDeclared.bind(this),
            warEnded: this.handleWarEnded.bind(this)
        };

        EventBus.on(GameEvents.DAY_PASSED, handlers.dayPassed);
        EventBus.on('treaty_proposed', handlers.treatyProposed);
        EventBus.on('treaty_accepted', handlers.treatyAccepted);
        EventBus.on('treaty_declined', handlers.treatyDeclined);
        EventBus.on('aid_proposed', handlers.aidProposed);
        EventBus.on('aid_accepted', handlers.aidAccepted);
        EventBus.on('aid_declined', handlers.aidDeclined);
        EventBus.on(GameEvents.WAR_DECLARED, handlers.warDeclared);
        EventBus.on('war_ended', handlers.warEnded);

        // Store for proper cleanup
        this._boundHandlers.set('dayPassed', handlers.dayPassed);
        this._boundHandlers.set('treatyProposed', handlers.treatyProposed);
        this._boundHandlers.set('treatyAccepted', handlers.treatyAccepted);
        this._boundHandlers.set('treatyDeclined', handlers.treatyDeclined);
        this._boundHandlers.set('aidProposed', handlers.aidProposed);
        this._boundHandlers.set('aidAccepted', handlers.aidAccepted);
        this._boundHandlers.set('aidDeclined', handlers.aidDeclined);
        this._boundHandlers.set('warDeclared', handlers.warDeclared);
        this._boundHandlers.set('warEnded', handlers.warEnded);
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

    /**
     * Refresh treaty slots for a nation (call when improvements/projects change).
     * Recalculates embassy count and updates stored treatySlots.
     */
    refreshTreatySlots(nationId) {
        const diplomacy = this.nationDiplomacy.get(nationId);
        if (!diplomacy) return null;
        diplomacy.treatySlots = this.calculateTreatySlots(nationId);
        return diplomacy.treatySlots;
    }
    
    // Propose a treaty between two nations/alliances
    proposeTreaty(data) {
        const { proposerId, targetId, treatyType, terms, duration } = data;
        
        // Validate treaty proposal
        const validation = this.validateTreatyProposal(data);
        if (!validation.valid) {
            throw new Error(`Treaty proposal invalid: ${validation.reason}`);
        }

        // Sanction check - proposer cannot propose diplomacy if sanctioned against target
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const diplomacyCheck = window.motionSystem.canPerformAction(proposerId, targetId, 'diplomacy');
            if (!diplomacyCheck.allowed) {
                throw new Error(`Cannot propose treaty: ${diplomacyCheck.reason}`);
            }
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
        
        // Re-validate the proposal — conditions may have changed since it was proposed
        // (category conflicts, slot limits, relationship requirements, etc.)
        const reValidation = this.validateTreatyProposal({
            proposerId: proposal.proposerId,
            targetId: proposal.targetId,
            treatyType: proposal.treatyType,
            terms: proposal.terms
        });
        if (!reValidation.valid) {
            throw new Error(`Treaty proposal no longer valid: ${reValidation.reason}`);
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
        
        // Update alliance records if either nation is in an alliance
        this._updateAllianceTreatyRecords(proposal.proposerId, proposal.targetId, treaty);
        
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

    // ══════════════════════════════════════════════════════════════════════
    // ALLIANCE-TO-ALLIANCE DIPLOMACY (improvement 5)
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Propose a treaty between two alliances.
     * Data: { proposerAllianceId, targetAllianceId, treatyType, terms, duration }
     */
    proposeAllianceTreaty(data) {
        const { proposerAllianceId, targetAllianceId, treatyType, terms, duration } = data;

        const treatyDef = this.treatyTypes[treatyType];
        if (!treatyDef) {
            throw new Error(`Invalid treaty type: ${treatyType}`);
        }

        if (proposerAllianceId === targetAllianceId) {
            throw new Error('Cannot propose treaty to your own alliance');
        }

        // Validate both alliances exist
        if (window.AllianceSystem) {
            const proposerAlliance = window.AllianceSystem.getAlliance(proposerAllianceId);
            const targetAlliance = window.AllianceSystem.getAlliance(targetAllianceId);
            if (!proposerAlliance) {
                throw new Error('Proposer alliance not found');
            }
            if (!targetAlliance) {
                throw new Error('Target alliance not found');
            }
        }

        // Check for existing alliance treaty of same type
        const key = this._allianceTreatyKey(proposerAllianceId, targetAllianceId);
        const existing = this.allianceTreaties.get(key);
        if (existing && existing.status === 'active' && existing.type === treatyType) {
            throw new Error(`Already have an active ${treatyType} treaty between these alliances`);
        }

        // Check for Financial Assistance Office requirement for intelligence pacts
        if (treatyType === 'intelligence' && treatyDef.requiresFinancialOffice) {
            // For alliance-level intelligence pacts, check if either alliance has a nation with the office
            // We check the proposer alliance's nations
            if (window.AllianceSystem) {
                const proposerAlliance = window.AllianceSystem.getAlliance(proposerAllianceId);
                if (proposerAlliance) {
                    let hasOffice = false;
                    for (const [nationId] of proposerAlliance.members) {
                        const nation = this.getNation(nationId);
                        if (nation && nation.projects?.financialAssistanceOffice) {
                            hasOffice = true;
                            break;
                        }
                    }
                    if (!hasOffice) {
                        throw new Error('Requires Financial Assistance Office project in proposer alliance');
                    }
                }
            }
        }
        const newCategory = treatyDef.category;
        const categoryConflicts = {
            protection: ['protection', 'unity'],
            unity: ['protection', 'unity'],
            defense: ['defense', 'aggression', 'peace'],
            aggression: ['defense', 'aggression', 'peace'],
            peace: ['defense', 'aggression', 'peace'],
            intelligence: []
        };
        const conflictingCategories = categoryConflicts[newCategory] || [];
        if (existing && existing.status === 'active') {
            const existingDef = this.treatyTypes[existing.type];
            if (existingDef && conflictingCategories.includes(existingDef.category)) {
                throw new Error(`Cannot have ${treatyType} (${newCategory}) with ${existing.type} (${existingDef.category}) - conflicting categories`);
            }
        }

        const proposalId = this.generateId();
        const proposal = {
            id: proposalId,
            proposerAllianceId,
            targetAllianceId,
            treatyType,
            terms,
            duration: duration || null,
            proposedAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending'
        };

        this.allianceTreaties.set(proposalId, proposal);

        EventBus.emit('alliance_treaty_proposed', {
            proposal,
            message: `Alliance treaty proposed: ${treatyDef.name}`
        });

        return proposalId;
    }

    /**
     * Accept an alliance treaty proposal.
     */
    acceptAllianceTreaty(proposalId) {
        const proposal = this.allianceTreaties.get(proposalId);
        if (!proposal) {
            throw new Error('Alliance treaty proposal not found');
        }

        if (proposal.status !== 'pending') {
            throw new Error('Alliance treaty proposal no longer pending');
        }

        if (Date.now() > proposal.expiresAt) {
            throw new Error('Alliance treaty proposal has expired');
        }

        const treatyDef = this.treatyTypes[proposal.treatyType];
        const treatyId = this.generateId();
        const treaty = {
            id: treatyId,
            type: proposal.treatyType,
            parties: [proposal.proposerAllianceId, proposal.targetAllianceId],
            terms: proposal.terms,
            createdAt: Date.now(),
            expiresAt: proposal.duration ? Date.now() + (proposal.duration * 24 * 60 * 60 * 1000) : null,
            violations: 0,
            status: 'active'
        };

        const key = this._allianceTreatyKey(proposal.proposerAllianceId, proposal.targetAllianceId);
        this.allianceTreaties.set(key, treaty);

        proposal.status = 'accepted';
        this.allianceTreaties.delete(proposalId);

        // Update alliance records
        this._updateAllianceAllianceTreatyRecords(
            proposal.proposerAllianceId,
            proposal.targetAllianceId,
            treaty
        );

        EventBus.emit('alliance_treaty_accepted', { treaty, proposal });

        return treatyId;
    }

    /**
     * Decline an alliance treaty proposal.
     */
    declineAllianceTreaty(proposalId) {
        const proposal = this.allianceTreaties.get(proposalId);
        if (!proposal) {
            throw new Error('Alliance treaty proposal not found');
        }

        proposal.status = 'declined';
        this.allianceTreaties.delete(proposalId);

        EventBus.emit('alliance_treaty_declined', { proposal });

        return true;
    }

    /**
     * Get active alliance treaty between two alliances.
     */
    getAllianceTreaty(allianceId1, allianceId2) {
        const key = this._allianceTreatyKey(allianceId1, allianceId2);
        const treaty = this.allianceTreaties.get(key);
        if (treaty && treaty.status === 'active') return treaty;
        return null;
    }

    /**
     * Check if two alliances have an active peace treaty.
     */
    hasAlliancePeaceTreaty(allianceId1, allianceId2) {
        const treaty = this.getAllianceTreaty(allianceId1, allianceId2);
        return treaty && treaty.type === 'peace';
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

        // Treaty category restrictions: certain categories conflict with each other
        // for the same nation pair
        const categoryConflicts = {
            protection: ['protection', 'unity'],
            unity: ['protection', 'unity'],
            defense: ['defense', 'aggression', 'peace'],
            aggression: ['defense', 'aggression', 'peace'],
            peace: ['defense', 'aggression', 'peace'],
            intelligence: [] // intelligence can coexist with most
        };

        const newCategory = treatyDef.category;
        const conflictingCategories = categoryConflicts[newCategory] || [];

        // Check both proposer and target for category conflicts
        const checkNationConflicts = (checkNationId) => {
            const checkDiplomacy = this.nationDiplomacy.get(checkNationId);
            if (!checkDiplomacy) return null;
            for (const [, treaty] of checkDiplomacy.treaties) {
                if (!treaty.parties.includes(
                    checkNationId === proposerId ? targetId : proposerId
                )) continue;
                const existingType = treaty.type;
                const existingDef = this.treatyTypes[existingType];
                if (!existingDef) continue;
                const existingCategory = existingDef.category;
                if (conflictingCategories.includes(existingCategory)) {
                    return {
                        valid: false,
                        reason: `Cannot have ${treatyType} (${newCategory}) with ${existingType} (${existingCategory}) - conflicting categories`
                    };
                }
            }
            return null;
        };

        const proposerConflict = checkNationConflicts(proposerId);
        if (proposerConflict) return proposerConflict;

        const targetConflict = checkNationConflicts(targetId);
        if (targetConflict) return targetConflict;
        
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
            if (!proposerNation.projects?.financialAssistanceOffice) {
                return { valid: false, reason: 'Requires Financial Assistance Office project' };
            }
        }
        
        return { valid: true };
    }
    
    // Process daily diplomacy events
    processDailyDiplomacy(data) {
        this.processExpiredProposals();
        this.processExpiredTreaties();
        this.processHappinessPenalties();
        this.processRelationshipDecay();
        this.processIntelligencePacts();
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

        // Clean up expired alliance treaty proposals
        for (const [id, proposal] of this.allianceTreaties) {
            if (proposal.status === 'pending' && now > proposal.expiresAt) {
                proposal.status = 'expired';
                this.allianceTreaties.delete(id);
                EventBus.emit('alliance_treaty_proposal_expired', { proposal });
            }
        }

        // Clean up expired aid proposals (refund aid amount, not tax)
        for (const [id, aidProposal] of this.aidProposals) {
            if (aidProposal.status === 'pending' && now > aidProposal.expiresAt) {
                const proposerNation = this.getNation(aidProposal.proposerId);
                if (proposerNation) {
                    if (proposerNation.currencyBalances) {
                        proposerNation.currencyBalances.aurel += aidProposal.amount;
                    } else {
                        proposerNation.money += aidProposal.amount;
                    }
                }
                this._removeAidSlot(aidProposal.proposerId, id);
                aidProposal.status = 'expired';
                this.aidProposals.delete(id);
                EventBus.emit('aid_proposal_expired', { aidProposal });
            }
        }
    }
    
    // Process expired treaties (mainly peace pacts)
    processExpiredTreaties() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;

        // Process nation-level active treaties
        for (const [id, treaty] of this.activeTreaties) {
            if (!treaty.expiresAt) continue;

            // Expiration warnings: 7 days and 1 day before expiry
            const timeLeft = treaty.expiresAt - now;
            if (timeLeft > 0 && timeLeft <= sevenDays) {
                const warningKey = `${id}:${Math.ceil(timeLeft / oneDay)}`;
                if (!this._expirationWarnings.has(warningKey)) {
                    this._expirationWarnings.add(warningKey);
                    EventBus.emit('treaty_expiring_soon', {
                        treatyId: id,
                        treaty,
                        daysRemaining: Math.ceil(timeLeft / oneDay)
                    });
                }
            }

            // Clear warning if treaty already expired
            if (timeLeft <= 0) {
                // Remove all warning keys for this treaty (days 1-7)
                for (let d = 1; d <= 7; d++) {
                    this._expirationWarnings.delete(`${id}:${d}`);
                }
            }

            // Remove expired treaties
            if (now > treaty.expiresAt) {
                this.removeTreaty(id);
                EventBus.emit('treaty_expired', { treaty });
            }
        }

        // Process alliance-level active treaties
        for (const [key, treaty] of this.allianceTreaties) {
            // Skip pending proposals (no expiresAt or status !== 'active')
            if (!treaty.expiresAt || treaty.status !== 'active') continue;

            const timeLeft = treaty.expiresAt - now;

            // Expiration warnings: 7 days and 1 day before expiry
            if (timeLeft > 0 && timeLeft <= sevenDays) {
                const warningKey = `${key}:${Math.ceil(timeLeft / oneDay)}`;
                if (!this._expirationWarnings.has(warningKey)) {
                    this._expirationWarnings.add(warningKey);
                    EventBus.emit('alliance_treaty_expiring_soon', {
                        treatyId: key,
                        treaty,
                        daysRemaining: Math.ceil(timeLeft / oneDay)
                    });
                }
            }

            // Clear warning if treaty already expired
            if (timeLeft <= 0) {
                // Remove all warning keys for this treaty (days 1-7)
                for (let d = 1; d <= 7; d++) {
                    this._expirationWarnings.delete(`${key}:${d}`);
                }
            }

            // Remove expired alliance treaty
            if (timeLeft <= 0) {
                this.allianceTreaties.delete(key);
                EventBus.emit('alliance_treaty_expired', { treatyId: key, treaty });
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

    /**
     * Relationship decay: friendships and rivalries fade over time unless
     * reinforced by interaction. Moves relationships toward neutral based
     * on the current diplomacy score.
     */
    processRelationshipDecay() {
        for (const [nationId, diplomacy] of this.nationDiplomacy) {
            const nation = this.getNation(nationId);
            if (!nation) continue;

            // Decay bestFriend if diplomacy score is low
            if (diplomacy.relationships.bestFriend) {
                const bestFriendId = diplomacy.relationships.bestFriend;
                const score = this.getDiplomacyScore(nationId, bestFriendId);
                if (score < 20) {
                    // Best friend relationship fades
                    diplomacy.relationships.bestFriend = null;
                    EventBus.emit('relationship_changed', {
                        nationId1: nationId,
                        nationId2: bestFriendId,
                        relationship: null
                    });
                }
            }

            // Decay friends: remove friends with low scores
            diplomacy.relationships.friends = diplomacy.relationships.friends.filter(friendId => {
                const score = this.getDiplomacyScore(nationId, friendId);
                if (score < 5) {
                    // Friendship faded
                    const friendDiplomacy = this.nationDiplomacy.get(friendId);
                    if (friendDiplomacy) {
                        const idx = friendDiplomacy.relationships.friends.indexOf(nationId);
                        if (idx >= 0) friendDiplomacy.relationships.friends.splice(idx, 1);
                    }
                    EventBus.emit('relationship_changed', {
                        nationId1: nationId,
                        nationId2: friendId,
                        relationship: null
                    });
                    return false;
                }
                return true;
            });

            // Decay foes: remove foes with scores moving toward neutral
            diplomacy.relationships.foes = diplomacy.relationships.foes.filter(foeId => {
                const score = this.getDiplomacyScore(nationId, foeId);
                if (score > -5) {
                    // Rivalry faded
                    const foeDiplomacy = this.nationDiplomacy.get(foeId);
                    if (foeDiplomacy) {
                        const idx = foeDiplomacy.relationships.foes.indexOf(nationId);
                        if (idx >= 0) foeDiplomacy.relationships.foes.splice(idx, 1);
                    }
                    EventBus.emit('relationship_changed', {
                        nationId1: nationId,
                        nationId2: foeId,
                        relationship: null
                    });
                    return false;
                }
                return true;
            });

            // Decay nemesis: remove nemesis if score improves beyond nemesis threshold
            if (diplomacy.relationships.nemesis) {
                const nemesisId = diplomacy.relationships.nemesis;
                const score = this.getDiplomacyScore(nationId, nemesisId);
                if (score > -75) {
                    // Nemesis relationship faded
                    diplomacy.relationships.nemesis = null;
                    const nemesisDiplomacy = this.nationDiplomacy.get(nemesisId);
                    if (nemesisDiplomacy && nemesisDiplomacy.relationships.nemesis === nationId) {
                        nemesisDiplomacy.relationships.nemesis = null;
                    }
                    EventBus.emit('relationship_changed', {
                        nationId1: nationId,
                        nationId2: nemesisId,
                        relationship: null
                    });
                }
            }
        }
    }

    /**
     * Intelligence Pact processing (improvement 12):
     * - Share 10% of tech with partner daily
     * - Partners cannot spy on each other
     * - All gather intel spy ops are shared with partners
     */
    processIntelligencePacts() {
        const maxDailyTechGain = 500; // Cap daily tech gain from intelligence pacts

        for (const [treatyId, treaty] of this.activeTreaties) {
            if (treaty.type !== 'intelligence') continue;

            const treatyDef = this.treatyTypes[treaty.type];
            const techShareRatio = treatyDef ? treatyDef.techShareRatio || 0.10 : 0.10;

            const [nationId1, nationId2] = treaty.parties;
            const nation1 = this.getNation(nationId1);
            const nation2 = this.getNation(nationId2);

            if (!nation1 || !nation2) continue;

            // Share tech based on treaty definition ratio, capped per nation per day
            const tech1 = nation1.tech || 0;
            const tech2 = nation2.tech || 0;

            let shareFrom1 = Math.floor(tech1 * techShareRatio);
            let shareFrom2 = Math.floor(tech2 * techShareRatio);

            // Cap daily tech gain per nation
            shareFrom1 = Math.min(shareFrom1, maxDailyTechGain);
            shareFrom2 = Math.min(shareFrom2, maxDailyTechGain);

            if (shareFrom1 > 0) {
                nation2.tech = (nation2.tech || 0) + shareFrom1;
            }
            if (shareFrom2 > 0) {
                nation1.tech = (nation1.tech || 0) + shareFrom2;
            }

            EventBus.emit('intelligence_tech_shared', {
                treatyId,
                nationId1,
                nationId2,
                techSharedFrom1: shareFrom1,
                techSharedFrom2: shareFrom2
            });
        }
    }

    /**
     * Check if two nations have an active intelligence pact.
     */
    hasIntelligencePact(nationId1, nationId2) {
        for (const [, treaty] of this.activeTreaties) {
            if (treaty.type === 'intelligence' &&
                treaty.parties.includes(nationId1) &&
                treaty.parties.includes(nationId2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a nation can spy on a target.
     * Returns { allowed: true } or { allowed: false, reason: '...' }.
     * Intelligence pact partners cannot spy on each other.
     */
    canSpyOn(attackerId, targetId) {
        if (this.hasIntelligencePact(attackerId, targetId)) {
            return {
                allowed: false,
                reason: 'Cannot spy on intelligence pact partner'
            };
        }

        // Sanction check
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const spyCheck = window.motionSystem.canPerformAction(attackerId, targetId, 'spy');
            if (!spyCheck.allowed) {
                return {
                    allowed: false,
                    reason: spyCheck.reason || 'Spying blocked by sanctions'
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Get all intelligence pact partners of a nation.
     * Used to share gather intel results with partners.
     */
    getIntelligencePartners(nationId) {
        const partners = [];
        for (const [, treaty] of this.activeTreaties) {
            if (treaty.type !== 'intelligence') continue;
            if (treaty.parties.includes(nationId)) {
                const partnerId = treaty.parties.find(p => p !== nationId);
                if (partnerId) partners.push(partnerId);
            }
        }
        return partners;
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

    // ══════════════════════════════════════════════════════════════════════
    // AID SYSTEM WITH WORLD BANK TAX
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Calculate World Bank tax on aid transfer.
     * Base: 5%
     * +5% each: not same alliance, not friend/bestfriend, is foe/nemesis,
     *           no ties at all, different color
     * Max: 30%
     */
    _calculateAidTax(proposerId, targetId) {
        let taxPercent = 5; // base tax

        const proposerNation = this.getNation(proposerId);
        const targetNation = this.getNation(targetId);

        if (!proposerNation || !targetNation) return 30; // max tax if can't determine

        // Condition 1: not in same alliance
        const sameAlliance =
            proposerNation.allianceId &&
            targetNation.allianceId &&
            proposerNation.allianceId === targetNation.allianceId;
        if (!sameAlliance) taxPercent += 5;

        // Condition 2: not friend/bestfriend (unless foe/nemesis, which is handled below)
        const relationship = this.getRelationship(proposerId, targetId);
        const isFoeOrNemesis = relationship === 'foe' || relationship === 'nemesis';
        if (relationship !== 'friend' && relationship !== 'bestFriend' && !isFoeOrNemesis) taxPercent += 5;

        // Condition 3: is foe/nemesis
        if (isFoeOrNemesis) taxPercent += 10;

        // Condition 4: no ties at all (no treaties, friend/foe, or alliance)
        const hasAnyTie =
            sameAlliance ||
            relationship === 'friend' ||
            relationship === 'bestFriend' ||
            relationship === 'foe' ||
            relationship === 'nemesis' ||
            this._hasAnyTreaty(proposerId, targetId);
        if (!hasAnyTie) taxPercent += 5;

        // Condition 5: different color
        if (proposerNation.factionColor && targetNation.factionColor &&
            proposerNation.factionColor !== targetNation.factionColor) {
            taxPercent += 5;
        }

        return Math.min(30, taxPercent);
    }

    /**
     * Check if two nations have any active treaty between them.
     */
    _hasAnyTreaty(nationId1, nationId2) {
        for (const [, treaty] of this.activeTreaties) {
            if (treaty.parties.includes(nationId1) && treaty.parties.includes(nationId2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Validate an aid proposal.
     */
    validateAidProposal(data) {
        const { proposerId, targetId, aidType, amount } = data;
        const proposerNation = this.getNation(proposerId);

        if (!proposerNation) {
            return { valid: false, reason: 'Proposer nation not found' };
        }

        const targetNation = this.getNation(targetId);
        if (!targetNation) {
            return { valid: false, reason: 'Target nation not found' };
        }

        if (proposerId === targetId) {
            return { valid: false, reason: 'Cannot send aid to yourself' };
        }

        // Check for Financial Assistance Office requirement
        if (!proposerNation.projects?.financialAssistanceOffice) {
            return { valid: false, reason: 'Requires Financial Assistance Office' };
        }

        // Check aid slots (3 maximum)
        const proposerDiplomacy = this.nationDiplomacy.get(proposerId);
        if (proposerDiplomacy && proposerDiplomacy.aidSlots.length >= 3) {
            return { valid: false, reason: 'Maximum 3 aid proposals allowed' };
        }

        if (aidType === 'money') {
            const balance = proposerNation.currencyBalances
                ? (proposerNation.currencyBalances.aurel || 0)
                : (proposerNation.money || 0);
            if (balance < amount) {
                return { valid: false, reason: 'Insufficient funds' };
            }
        }

        return { valid: true };
    }

    /**
     * Propose financial aid. Deducts amount + tax from proposer immediately.
     * Tax goes to the World Bank (not tracked as a separate entity, just deducted).
     */
    proposeAid(data) {
        const { proposerId, targetId, aidType, amount } = data;

        const validation = this.validateAidProposal(data);
        if (!validation.valid) {
            throw new Error(`Aid proposal invalid: ${validation.reason}`);
        }

        // Sanction check - proposer cannot send aid if sanctioned against target
        if (window.motionSystem && typeof window.motionSystem.canPerformAction === 'function') {
            const aidCheck = window.motionSystem.canPerformAction(proposerId, targetId, 'aid');
            if (!aidCheck.allowed) {
                throw new Error(`Cannot send aid: ${aidCheck.reason}`);
            }
        }

        const proposerNation = this.getNation(proposerId);
        const taxPercent = this._calculateAidTax(proposerId, targetId);
        const taxAmount = Math.floor(amount * (taxPercent / 100));
        const totalDeduction = amount + taxAmount;

        // Deduct amount + tax from proposer immediately
        const balance = proposerNation.currencyBalances
            ? (proposerNation.currencyBalances.aurel || 0)
            : (proposerNation.money || 0);
        if (balance < totalDeduction) {
            throw new Error('Insufficient funds (amount + World Bank tax)');
        }

        if (proposerNation.currencyBalances) {
            proposerNation.currencyBalances.aurel -= totalDeduction;
        } else {
            proposerNation.money -= totalDeduction;
        }

        const aidId = this.generateId();
        const aidProposal = {
            id: aidId,
            proposerId,
            targetId,
            aidType,
            amount,
            taxPercent,
            taxAmount,
            totalDeduction,
            proposedAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending'
        };

        this.aidProposals.set(aidId, aidProposal);

        // Track aid slot for proposer
        const proposerDiplomacy = this.initializeNationDiplomacy(proposerId);
        proposerDiplomacy.aidSlots.push({
            aidId,
            targetId,
            expiresAt: aidProposal.expiresAt
        });

        EventBus.emit('aid_proposed', { aidProposal });

        return aidId;
    }

    /**
     * Accept aid proposal. Transfers amount (minus tax already deducted) to target.
     */
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

        const targetNation = this.getNation(aidProposal.targetId);
        if (!targetNation) {
            throw new Error('Target nation not found');
        }

        if (aidProposal.aidType === 'money') {
            targetNation.currencyBalances
                ? (targetNation.currencyBalances.aurel = (targetNation.currencyBalances.aurel || 0) + aidProposal.amount)
                : (targetNation.money = (targetNation.money || 0) + aidProposal.amount);
        }

        aidProposal.status = 'accepted';

        // Remove aid slot for proposer
        this._removeAidSlot(aidProposal.proposerId, aidId);

        EventBus.emit('aid_accepted', { aidProposal });

        return true;
    }

    /**
     * Decline aid proposal. No refund since money was never taken (tax already applied at proposal).
     * Actually, money WAS taken at proposal time. On decline, refund the amount (not the tax).
     */
    declineAid(aidId) {
        const aidProposal = this.aidProposals.get(aidId);
        if (!aidProposal) {
            throw new Error('Aid proposal not found');
        }

        // Refund the aid amount (not the tax - tax is kept by World Bank)
        const proposerNation = this.getNation(aidProposal.proposerId);
        if (proposerNation) {
            if (proposerNation.currencyBalances) {
                proposerNation.currencyBalances.aurel += aidProposal.amount;
            } else {
                proposerNation.money += aidProposal.amount;
            }
        }

        aidProposal.status = 'declined';

        // Remove aid slot for proposer
        this._removeAidSlot(aidProposal.proposerId, aidId);

        this.aidProposals.delete(aidId);

        EventBus.emit('aid_declined', { aidProposal });

        return true;
    }

    /**
     * Remove an aid slot for a nation.
     */
    _removeAidSlot(nationId, aidId) {
        const diplomacy = this.nationDiplomacy.get(nationId);
        if (!diplomacy) return;
        diplomacy.aidSlots = diplomacy.aidSlots.filter(slot => slot.aidId !== aidId);
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

    /**
     * Generate a sorted key for diplomacy score lookups (nation pair).
     */
    _diplomacyScoreKey(nationId1, nationId2) {
        return [nationId1, nationId2].sort().join(':');
    }

    /**
     * Get diplomacy score between two nations (-100 to +100).
     * Default is 0 (neutral).
     */
    getDiplomacyScore(nationId1, nationId2) {
        const key = this._diplomacyScoreKey(nationId1, nationId2);
        return this.diplomacyScores.get(key) || 0;
    }

    /**
     * Modify diplomacy score between two nations.
     * Score is clamped to [-100, 100].
     */
    modifyDiplomacyScore(nationId1, nationId2, amount, reason = '') {
        const key = this._diplomacyScoreKey(nationId1, nationId2);
        const current = this.diplomacyScores.get(key) || 0;
        const newScore = Math.max(-100, Math.min(100, current + amount));
        this.diplomacyScores.set(key, newScore);

        EventBus.emit('diplomacy_score_changed', {
            nationId1,
            nationId2,
            previousScore: current,
            newScore,
            change: amount,
            reason
        });

        // Update relationship labels based on score thresholds
        this._syncRelationshipFromScore(nationId1, nationId2, newScore);

        return newScore;
    }

    /**
     * Set diplomacy score directly.
     */
    setDiplomacyScore(nationId1, nationId2, score) {
        return this.modifyDiplomacyScore(nationId1, nationId2, score - this.getDiplomacyScore(nationId1, nationId2), 'set');
    }

    /**
     * Sync relationship labels (friend/foe/bestFriend/nemesis) based on score.
     * Ensures labels are consistent with the current score in both directions.
     */
    _syncRelationshipFromScore(nationId1, nationId2, score) {
        const diplomacy = this.nationDiplomacy.get(nationId1);
        const diplomacy2 = this.nationDiplomacy.get(nationId2);
        if (!diplomacy || !diplomacy2) return;

        // Determine the target relationship label for this score
        let targetLabel = null;
        if (score >= 75) targetLabel = 'bestFriend';
        else if (score >= 25) targetLabel = 'friend';
        else if (score <= -75) targetLabel = 'nemesis';
        else if (score <= -25) targetLabel = 'foe';

        // Clear all existing relationship labels first
        diplomacy.relationships.friends = diplomacy.relationships.friends.filter(f => f !== nationId2);
        diplomacy2.relationships.friends = diplomacy2.relationships.friends.filter(f => f !== nationId1);
        diplomacy.relationships.bestFriend = diplomacy.relationships.bestFriend === nationId2 ? null : diplomacy.relationships.bestFriend;
        diplomacy2.relationships.bestFriend = diplomacy2.relationships.bestFriend === nationId1 ? null : diplomacy2.relationships.bestFriend;
        diplomacy.relationships.foes = diplomacy.relationships.foes.filter(f => f !== nationId2);
        diplomacy2.relationships.foes = diplomacy2.relationships.foes.filter(f => f !== nationId1);
        diplomacy.relationships.nemesis = diplomacy.relationships.nemesis === nationId2 ? null : diplomacy.relationships.nemesis;
        diplomacy2.relationships.nemesis = diplomacy2.relationships.nemesis === nationId1 ? null : diplomacy2.relationships.nemesis;

        // Apply the target label
        if (targetLabel === 'bestFriend' || targetLabel === 'friend') {
            if (!diplomacy.relationships.friends.includes(nationId2)) {
                diplomacy.relationships.friends.push(nationId2);
            }
            if (!diplomacy2.relationships.friends.includes(nationId1)) {
                diplomacy2.relationships.friends.push(nationId1);
            }
            if (targetLabel === 'bestFriend') {
                diplomacy.relationships.bestFriend = nationId2;
                diplomacy2.relationships.bestFriend = nationId1;
            }
        } else if (targetLabel === 'nemesis' || targetLabel === 'foe') {
            if (!diplomacy.relationships.foes.includes(nationId2)) {
                diplomacy.relationships.foes.push(nationId2);
            }
            if (!diplomacy2.relationships.foes.includes(nationId1)) {
                diplomacy2.relationships.foes.push(nationId1);
            }
            if (targetLabel === 'nemesis') {
                diplomacy.relationships.nemesis = nationId2;
                diplomacy2.relationships.nemesis = nationId1;
            }
        }

        EventBus.emit('relationship_changed', {
            nationId1,
            nationId2,
            relationship: targetLabel
        });
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

        // Update diplomacy score to reflect friendship
        this.modifyDiplomacyScore(nationId1, nationId2, 25, 'addFriend');

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

        // Update diplomacy score to reflect removed friendship
        this.modifyDiplomacyScore(nationId1, nationId2, -10, 'removeFriend');

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

        // Reciprocal: set on nationId2 as well
        const diplomacy2 = this.initializeNationDiplomacy(nationId2);
        diplomacy2.relationships.bestFriend = nationId1;
        if (!diplomacy2.relationships.friends.includes(nationId1)) {
            diplomacy2.relationships.friends.push(nationId1);
        }

        // Update diplomacy score to reflect best friend status (both directions)
        this.modifyDiplomacyScore(nationId1, nationId2, 50, 'setBestFriend');
        this.modifyDiplomacyScore(nationId2, nationId1, 50, 'setBestFriend');

        // Re-apply bestFriend label after score sync (score 50 < bestFriend threshold 75,
        // so _syncRelationshipFromScore would clear it; re-set here to preserve)
        diplomacy.relationships.bestFriend = nationId2;
        diplomacy2.relationships.bestFriend = nationId1;

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

        // Update diplomacy score to reflect foe status
        this.modifyDiplomacyScore(nationId1, nationId2, -50, 'addFoe');

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

        // Update diplomacy score to reflect removed foe status (move toward neutral)
        this.modifyDiplomacyScore(nationId1, nationId2, 10, 'removeFoe');

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

        // Reciprocal: set on nationId2 as well
        const diplomacy2 = this.initializeNationDiplomacy(nationId2);
        diplomacy2.relationships.nemesis = nationId1;
        if (!diplomacy2.relationships.foes.includes(nationId1)) {
            diplomacy2.relationships.foes.push(nationId1);
        }

        // Update diplomacy score to reflect nemesis status (both directions)
        this.modifyDiplomacyScore(nationId1, nationId2, -75, 'setNemesis');
        this.modifyDiplomacyScore(nationId2, nationId1, -75, 'setNemesis');

        // Re-apply nemesis/foe labels after score sync (preserve manual settings)
        diplomacy.relationships.nemesis = nationId2;
        diplomacy2.relationships.nemesis = nationId1;

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

    /**
     * Generate a sorted key for alliance-to-alliance treaty lookups.
     */
    _allianceTreatyKey(allianceId1, allianceId2) {
        return [allianceId1, allianceId2].sort().join(':');
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

    /**
     * Remove an active alliance treaty by alliance pair key.
     */
    removeAllianceTreaty(allianceId1, allianceId2) {
        const key = this._allianceTreatyKey(allianceId1, allianceId2);
        const treaty = this.allianceTreaties.get(key);
        if (!treaty || treaty.status !== 'active') return;

        this.allianceTreaties.delete(key);

        // Update alliance objects
        if (window.AllianceSystem) {
            const alliance1 = window.AllianceSystem.getAlliance(allianceId1);
            const alliance2 = window.AllianceSystem.getAlliance(allianceId2);
            if (alliance1) {
                alliance1.treaties = alliance1.treaties.filter(t => t.id !== key);
                alliance1.relations.delete(allianceId2);
            }
            if (alliance2) {
                alliance2.treaties = alliance2.treaties.filter(t => t.id !== key);
                alliance2.relations.delete(allianceId1);
            }
        }

        EventBus.emit('alliance_treaty_removed', { treatyId: key, treaty });
    }

    /**
     * Update Alliance objects when a nation-level treaty is signed.
     * If both nations are in alliances, record the relationship in their alliance records.
     */
    _updateAllianceTreatyRecords(nationId1, nationId2, treaty) {
        if (!window.AllianceSystem) return;

        const nation1 = this.getNation(nationId1);
        const nation2 = this.getNation(nationId2);
        if (!nation1 || !nation2) return;

        const allianceId1 = nation1.allianceId;
        const allianceId2 = nation2.allianceId;

        // If both nations are in the same alliance, no cross-alliance record needed
        if (!allianceId1 || !allianceId2 || allianceId1 === allianceId2) return;

        const alliance1 = window.AllianceSystem.getAlliance(allianceId1);
        const alliance2 = window.AllianceSystem.getAlliance(allianceId2);

        if (alliance1) {
            // Record relationship with the other alliance
            alliance1.relations.set(allianceId2, {
                type: treaty.type,
                treatyId: treaty.id,
                nationParties: [nationId1, nationId2],
                createdAt: treaty.createdAt,
                status: 'active'
            });
            alliance1.treaties.push({
                id: treaty.id,
                type: treaty.type,
                parties: [nationId1, nationId2],
                otherAllianceId: allianceId2,
                createdAt: treaty.createdAt,
                status: 'active'
            });
        }

        if (alliance2) {
            alliance2.relations.set(allianceId1, {
                type: treaty.type,
                treatyId: treaty.id,
                nationParties: [nationId1, nationId2],
                createdAt: treaty.createdAt,
                status: 'active'
            });
            alliance2.treaties.push({
                id: treaty.id,
                type: treaty.type,
                parties: [nationId1, nationId2],
                otherAllianceId: allianceId1,
                createdAt: treaty.createdAt,
                status: 'active'
            });
        }
    }

    /**
     * Update Alliance objects when an alliance-level treaty is signed.
     */
    _updateAllianceAllianceTreatyRecords(allianceId1, allianceId2, treaty) {
        if (!window.AllianceSystem) return;

        const alliance1 = window.AllianceSystem.getAlliance(allianceId1);
        const alliance2 = window.AllianceSystem.getAlliance(allianceId2);

        if (alliance1) {
            alliance1.relations.set(allianceId2, {
                type: treaty.type,
                treatyId: treaty.id,
                createdAt: treaty.createdAt,
                status: 'active'
            });
            alliance1.treaties.push({
                id: treaty.id,
                type: treaty.type,
                parties: [allianceId1, allianceId2],
                createdAt: treaty.createdAt,
                status: 'active'
            });
        }

        if (alliance2) {
            alliance2.relations.set(allianceId1, {
                type: treaty.type,
                treatyId: treaty.id,
                createdAt: treaty.createdAt,
                status: 'active'
            });
            alliance2.treaties.push({
                id: treaty.id,
                type: treaty.type,
                parties: [allianceId1, allianceId2],
                createdAt: treaty.createdAt,
                status: 'active'
            });
        }
    }
    
    // War event handlers
    handleWarDeclared(data) {
        if (!data || !data.war) return;

        const war = data.war;
        const attackerId = war.originalAttacker;
        const defenderId = war.originalDefender;

        if (!attackerId || !defenderId) return;

        // Peace pact prevention: if both parties have a peace pact, this is a violation
        const peaceTreaty = this.findPeacePactTreaty(attackerId, defenderId);
        if (peaceTreaty) {
            this.applyTreatyViolation(peaceTreaty.id, attackerId, defenderId, 'peace_pact_violation');
        }

        // Check all active treaties for violations (excluding peace pacts already handled above)
        this.checkTreatyViolations('war_declared', attackerId, defenderId);

        // Mutual defense auto-join: check if defender's mutual defense partners
        // should be notified to join the war on the defender's side
        this._checkMutualDefenseAutoJoin(war, defenderId);
    }

    /**
     * Check if two nations have an active peace pact between them.
     */
    hasActivePeacePact(nationId1, nationId2) {
        for (const [, treaty] of this.activeTreaties) {
            if (treaty.type === 'peace' &&
                treaty.parties.includes(nationId1) &&
                treaty.parties.includes(nationId2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Find the active peace pact treaty between two nations.
     * Returns the treaty object or null.
     */
    findPeacePactTreaty(nationId1, nationId2) {
        for (const [, treaty] of this.activeTreaties) {
            if (treaty.type === 'peace' &&
                treaty.parties.includes(nationId1) &&
                treaty.parties.includes(nationId2)) {
                return treaty;
            }
        }
        return null;
    }

    /**
     * Check mutual defense pacts for the defending nation and emit
     * notifications so allies can choose to join the war.
     */
    _checkMutualDefenseAutoJoin(war, defenderId) {
        const defenderDiplomacy = this.nationDiplomacy.get(defenderId);
        if (!defenderDiplomacy) return;

        for (const [, treaty] of defenderDiplomacy.treaties) {
            if (treaty.type !== 'mutualDefense') continue;

            const partnerId = treaty.parties.find(p => p !== defenderId);
            if (!partnerId) continue;

            const partnerNation = this.getNation(partnerId);
            if (!partnerNation) continue;

            // Emit notification so the partner can decide to join
            EventBus.emit('mutual_defense_activated', {
                warId: war.id,
                treatyId: treaty.id,
                defender: defenderId,
                partner: partnerId,
                partnerNation,
                message: `Mutual defense pact activated: ${partnerNation.name} is obligated to defend ${this.getNationName(defenderId)}`
            });
        }
    }

    /**
     * Check if a war can be declared between two nations.
     * Returns { allowed: true } or { allowed: false, reason: '...' }.
     * Checks peace pacts and alliance peace treaties.
     */
    canDeclareWar(attackerId, defenderId) {
        const attackerNation = this.getNation(attackerId);
        const defenderNation = this.getNation(defenderId);

        if (!attackerNation || !defenderNation) {
            return { allowed: false, reason: 'One or both nations not found' };
        }

        if (attackerId === defenderId) {
            return { allowed: false, reason: 'Cannot declare war on yourself' };
        }

        // Peace pact between the two nations
        if (this.hasActivePeacePact(attackerId, defenderId)) {
            return { allowed: false, reason: 'Cannot declare war: Peace pact exists between these nations' };
        }

        // Alliance-level peace treaties
        if (attackerNation.allianceId && defenderNation.allianceId &&
            attackerNation.allianceId === defenderNation.allianceId) {
            return { allowed: false, reason: 'Cannot declare war on your own alliance member' };
        }

        // Check alliance-to-alliance peace treaties
        if (attackerNation.allianceId && defenderNation.allianceId) {
            const allianceKey = this._allianceTreatyKey(attackerNation.allianceId, defenderNation.allianceId);
            const allianceTreaty = this.allianceTreaties.get(allianceKey);
            if (allianceTreaty && allianceTreaty.type === 'peace') {
                return { allowed: false, reason: 'Cannot declare war: Peace treaty exists between alliances' };
            }
        }

        return { allowed: true };
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

    // Event handlers for treaty proposals (pass-through, main logic in propose/accept/decline)
    handleTreatyProposed(data) {
        // Proposal already emitted by proposeTreaty; handler available for external listeners
    }

    handleTreatyAccepted(data) {
        // Acceptance already emitted by acceptTreaty
    }

    handleTreatyDeclined(data) {
        // Decline already emitted by declineTreaty
    }

    // Event handlers for aid proposals
    handleAidProposed(data) {
        // Proposal already emitted by proposeAid
    }

    handleAidAccepted(data) {
        // Acceptance already emitted by acceptAid
    }

    handleAidDeclined(data) {
        // Decline already emitted by declineAid
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

            // Peace pacts are handled separately in handleWarDeclared to avoid double-application
            if (treatyType === 'peace') continue;

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

    applyTreatyViolation(treatyId, nationId1, nationId2, violationType, penalizedNationIds = null) {
        const treaty = this.activeTreaties.get(treatyId);
        if (!treaty) return;

        treaty.violations = (treaty.violations || 0) + 1;

        const treatyDef = this.treatyTypes[treaty.type];
        const penalty = treatyDef?.failurePenalty;

        if (!penalty) return;

        // Determine which nations to penalize
        const nationsToPenalize = penalizedNationIds || [nationId1, nationId2];

        // Record penalties; daily happiness reduction handled by processHappinessPenalties()
        nationsToPenalize.forEach(nationId => {
            const nation = this.getNation(nationId);
            const diplomacy = this.nationDiplomacy.get(nationId);

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
            nations: nationsToPenalize,
            penalty
        });
    }
    
    processTreatyObligations(eventType, winnerId, loserId) {
        if (eventType !== 'war_ended') return;

        // Check nation-level treaties
        for (const [treatyId, treaty] of this.activeTreaties) {
            const parties = treaty.parties;
            const involvesWinner = parties.includes(winnerId);
            const involvesLoser = parties.includes(loserId);

            if (!involvesWinner && !involvesLoser) continue;

            const treatyType = treaty.type;

            // Protectorate: protector must defend protectorate. If protectorate lost, protector failed.
            if (treatyType === 'protectorate') {
                if (involvesLoser && !involvesWinner) {
                    // The loser was the protectorate; the protector failed to defend
                    const penalizedId = parties.find(p => p !== loserId) || loserId;
                    this.applyTreatyViolation(treatyId, penalizedId, loserId, 'protectorate_failure', [penalizedId]);
                }
            }

            // Mutual defense: if an ally was attacked and didn't join the defensive war, violation
            if (treatyType === 'mutualDefense') {
                if (involvesLoser && !involvesWinner) {
                    const penalizedId = parties.find(p => p !== loserId) || loserId;
                    this.applyTreatyViolation(treatyId, penalizedId, loserId, 'mutual_defense_failure', [penalizedId]);
                }
            }

            // Mutual aggression: if an ally declared offensive war and didn't join
            if (treatyType === 'mutualAggression') {
                if (involvesWinner && !involvesLoser) {
                    const penalizedId = parties.find(p => p !== winnerId) || winnerId;
                    this.applyTreatyViolation(treatyId, penalizedId, winnerId, 'mutual_aggression_failure', [penalizedId]);
                }
            }
        }

        // Check alliance-level treaties
        if (!window.AllianceSystem) return;

        for (const [key, treaty] of this.allianceTreaties) {
            if (treaty.status !== 'active') continue;

            const parties = treaty.parties; // [allianceId1, allianceId2]
            const treatyType = treaty.type;

            // Get all nation IDs for each alliance party
            const allianceNations = {};
            for (const allianceId of parties) {
                const alliance = window.AllianceSystem.getAlliance(allianceId);
                if (alliance) {
                    allianceNations[allianceId] = Array.from(alliance.members.keys());
                }
            }

            const winnerAlliance = parties.find(aId => allianceNations[aId]?.includes(winnerId));
            const loserAlliance = parties.find(aId => allianceNations[aId]?.includes(loserId));

            if (!winnerAlliance && !loserAlliance) continue;

            // Protectorate: protector alliance must defend protectorate alliance
            if (treatyType === 'protectorate') {
                if (loserAlliance && !winnerAlliance) {
                    const penalizedAllianceId = parties.find(p => p !== loserAlliance) || loserAlliance;
                    const penalizedNationIds = allianceNations[penalizedAllianceId] || [];
                    this.applyTreatyViolation(key, penalizedAllianceId, loserAlliance, 'protectorate_failure', penalizedNationIds);
                }
            }

            // Mutual defense: if an ally alliance was attacked and didn't join
            if (treatyType === 'mutualDefense') {
                if (loserAlliance && !winnerAlliance) {
                    const penalizedAllianceId = parties.find(p => p !== loserAlliance) || loserAlliance;
                    const penalizedNationIds = allianceNations[penalizedAllianceId] || [];
                    this.applyTreatyViolation(key, penalizedAllianceId, loserAlliance, 'mutual_defense_failure', penalizedNationIds);
                }
            }

            // Mutual aggression: if an ally alliance declared offensive war and didn't join
            if (treatyType === 'mutualAggression') {
                if (winnerAlliance && !loserAlliance) {
                    const penalizedAllianceId = parties.find(p => p !== winnerAlliance) || winnerAlliance;
                    const penalizedNationIds = allianceNations[penalizedAllianceId] || [];
                    this.applyTreatyViolation(key, penalizedAllianceId, winnerAlliance, 'mutual_aggression_failure', penalizedNationIds);
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

        // Alliance treaty proposals - include if nation is in either alliance
        const nation = this.getNation(nationId);
        if (nation && nation.allianceId) {
            for (const proposal of this.allianceTreaties.values()) {
                if (proposal.status !== 'pending') continue;
                if (proposal.proposerAllianceId === nation.allianceId ||
                    proposal.targetAllianceId === nation.allianceId) {
                    proposals.push({
                        ...proposal,
                        isAllianceProposal: true,
                        targetId: proposal.targetAllianceId // UI-friendly field
                    });
                }
            }
        }

        return proposals;
    }
    
    /**
     * Re-bind event listeners. Call this if EventBus/GameEvents weren't available
     * at construction time but are now loaded.
     */
    rebindEvents() {
        this._boundHandlers.clear();
        this.bindEvents();
    }

    getState() {
        return {
            activeTreaties: Array.from(this.activeTreaties.entries()),
            treatyProposals: Array.from(this.treatyProposals.entries()),
            allianceTreaties: Array.from(this.allianceTreaties.entries()),
            aidProposals: Array.from(this.aidProposals.entries()),
            diplomacyScores: Array.from(this.diplomacyScores.entries()),
            nationDiplomacy: Array.from(this.nationDiplomacy.entries()).map(([id, d]) => [
                id,
                {
                    treaties: Array.from(d.treaties.entries()),
                    treatySlots: d.treatySlots,
                    relationships: d.relationships,
                    embassySlots: d.embassySlots,
                    pendingProposals: d.pendingProposals,
                    aidSlots: d.aidSlots,
                    penalties: d.penalties
                }
            ]),
            globalStandards: this.globalStandards,
            isInitialized: this.isInitialized
        };
    }

    setState(state) {
        if (!state) return;

        this.activeTreaties = new Map(state.activeTreaties || []);
        this.treatyProposals = new Map(state.treatyProposals || []);
        this.allianceTreaties = new Map(state.allianceTreaties || []);
        this.aidProposals = new Map(state.aidProposals || []);
        this.diplomacyScores = new Map(state.diplomacyScores || []);
        this.globalStandards = state.globalStandards || this.globalStandards;
        this.isInitialized = state.isInitialized !== undefined ? state.isInitialized : false;

        // Restore nationDiplomacy with proper Map types
        this.nationDiplomacy = new Map();
        for (const [id, d] of state.nationDiplomacy || []) {
            this.nationDiplomacy.set(id, {
                treaties: new Map(d.treaties || []),
                treatySlots: d.treatySlots,
                relationships: d.relationships || { friends: [], bestFriend: null, foes: [], nemesis: null },
                embassySlots: d.embassySlots || 0,
                pendingProposals: d.pendingProposals || [],
                aidSlots: d.aidSlots || [],
                penalties: d.penalties || []
            });
        }
    }

    destroy() {
        if (typeof EventBus !== 'undefined' && this._boundHandlers) {
            EventBus.off(GameEvents.DAY_PASSED, this._boundHandlers.get('dayPassed'));
            EventBus.off('treaty_proposed', this._boundHandlers.get('treatyProposed'));
            EventBus.off('treaty_accepted', this._boundHandlers.get('treatyAccepted'));
            EventBus.off('treaty_declined', this._boundHandlers.get('treatyDeclined'));
            EventBus.off('aid_proposed', this._boundHandlers.get('aidProposed'));
            EventBus.off('aid_accepted', this._boundHandlers.get('aidAccepted'));
            EventBus.off('aid_declined', this._boundHandlers.get('aidDeclined'));
            EventBus.off('war_declared', this._boundHandlers.get('warDeclared'));
            EventBus.off('war_ended', this._boundHandlers.get('warEnded'));
            this._boundHandlers.clear();
        }

        this.activeTreaties.clear();
        this.treatyProposals.clear();
        this.allianceInvitations.clear();
        this.allianceTreaties.clear();
        this.aidProposals.clear();
        this.diplomacyScores.clear();
        this.nationDiplomacy.clear();
        this._expirationWarnings.clear();
        this.isInitialized = false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DiplomacySystem };
}

// Attach to window for cross-system access
if (typeof window !== 'undefined' && !window.DiplomacySystem) {
    window.DiplomacySystem = new DiplomacySystem();
}