/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * ALLIANCE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════════
 * Comprehensive alliance management system with:
 * - Member limit management and roster upgrades
 * - 10+ alliance skills with 10-level progression
 * - Alliance XP system with multiple gain sources  
 * - Government structure customization (President, VP, Secretaries, etc.)
 * - Full customization options (banners, flags, colors, fonts)
 * - Integration with existing diplomacy and war systems
 */

class AllianceSystem {
    constructor() {
        this.isInitialized = false;
        
        // Active alliances registry
        this.alliances = new Map(); // allianceId -> Alliance instance
        this.allianceInvitations = new Map(); // invitationId -> invitation data
        this.allianceDiplomacy = new Map(); // Alliance-to-alliance diplomacy
        this.hiveMinds = new Map(); // allianceId -> HiveMindAI instance (no user leaders)
        this._pendingHonorChallenges = new Map(); // allianceId -> { challengerId, chiefId, expiresAt, createdAt }
        
        // Alliance skill definitions
        // Each skill affects all members of the alliance through getAllianceBonus()
        this.allianceSkills = {
            roster: {
                name: 'Roster Capacity',
                description: 'Increases maximum alliance member limit',
                baseCost: 1000,
                costMultiplier: 1.5,
                maxLevel: 10,
                effects: (level) => ({ memberLimit: 6 + (level * 2) })
            },
            customization: {
                name: 'Alliance Customization',
                description: 'Unlocks visual customization options',
                baseCost: 800,
                costMultiplier: 1.3,
                maxLevel: 10,
                effects: (level) => ({
                    customOptions: this.getCustomizationUnlocks(level)
                })
            },
            combatOffensive: {
                name: 'Offensive Combat Training',
                description: 'Increases attack damage for all alliance members',
                baseCost: 1200,
                costMultiplier: 1.4,
                maxLevel: 10,
                effects: (level) => ({
                    attackBoost: 0.02 * level  // +2% attack per level
                })
            },
            combatDefensive: {
                name: 'Defensive Combat Training',
                description: 'Increases defense for all alliance members',
                baseCost: 1200,
                costMultiplier: 1.4,
                maxLevel: 10,
                effects: (level) => ({
                    defenseBoost: 0.02 * level  // +2% defense per level
                })
            },
            marksmanship: {
                name: 'Marksmanship',
                description: 'Increases aim (accuracy) for all alliance members',
                baseCost: 1000,
                costMultiplier: 1.35,
                maxLevel: 10,
                effects: (level) => ({
                    aimBoost: 0.015 * level  // +1.5% aim per level
                })
            },
            fortune: {
                name: 'Fortune',
                description: 'Increases luck for all alliance members',
                baseCost: 1000,
                costMultiplier: 1.35,
                maxLevel: 10,
                effects: (level) => ({
                    luckBoost: 0.015 * level  // +1.5% luck per level
                })
            },
            criticalStrike: {
                name: 'Critical Strike Training',
                description: 'Increases critical damage for all alliance members',
                baseCost: 1400,
                costMultiplier: 1.45,
                maxLevel: 10,
                effects: (level) => ({
                    critDamageBoost: 0.02 * level  // +2% crit damage per level
                })
            },
            criticalEye: {
                name: 'Critical Eye',
                description: 'Increases critical hit chance for all alliance members',
                baseCost: 1400,
                costMultiplier: 1.45,
                maxLevel: 10,
                effects: (level) => ({
                    critChanceBoost: 0.01 * level  // +1% crit chance per level
                })
            },
            diplomacy: {
                name: 'Diplomatic Relations',
                description: 'Improves treaty success rates and duration',
                baseCost: 1000,
                costMultiplier: 1.35,
                maxLevel: 10,
                effects: (level) => ({
                    treatySuccessBonus: 0.05 * level,
                    treatyDurationBonus: 0.1 * level
                })
            },
            expansion: {
                name: 'Territorial Expansion',
                description: 'Reduces infrastructure and land costs for all members',
                baseCost: 1400,
                costMultiplier: 1.6,
                maxLevel: 10,
                effects: (level) => ({
                    infraCostReduction: 0.02 * level,  // -2% infra cost per level
                    landCostReduction: 0.02 * level     // -2% land cost per level
                })
            },
            upkeepReduction: {
                name: 'Upkeep Reduction',
                description: 'Reduces infrastructure and land upkeep for all members',
                baseCost: 1300,
                costMultiplier: 1.5,
                maxLevel: 10,
                effects: (level) => ({
                    infraUpkeepReduction: 0.02 * level,  // -2% infra upkeep per level
                    landUpkeepReduction: 0.02 * level    // -2% land upkeep per level
                })
            },
            technology: {
                name: 'Technology Research',
                description: 'Reduces technology costs for all members',
                baseCost: 1600,
                costMultiplier: 1.7,
                maxLevel: 10,
                effects: (level) => ({
                    techCostReduction: 0.02 * level  // -2% tech cost per level
                })
            },
            unity: {
                name: 'Alliance Unity',
                description: 'Increases happiness and reduces crime/disease for all members',
                baseCost: 2000,
                costMultiplier: 1.8,
                maxLevel: 10,
                effects: (level) => ({
                    happinessBoost: 1 * level,         // +1 happiness per level
                    crimeReduction: 0.02 * level,      // -2% crime per level
                    diseaseReduction: 0.02 * level     // -2% disease per level
                })
            },
            intelligence: {
                name: 'Intelligence Network',
                description: 'Improves spy efficiency for all members',
                baseCost: 1100,
                costMultiplier: 1.45,
                maxLevel: 10,
                effects: (level) => ({
                    spyEfficiencyBonus: 0.04 * level,
                    intelSharingRange: level * 2
                })
            }
        };
        
        // Government structure templates
        this.governmentTemplates = {
            democratic: {
                name: 'Democratic Alliance',
                description: 'Elected leadership with specialized departments',
                icon: 'assets/images/Alliance Government/democracy.png',
                roles: [
                    { id: 'president', name: 'President', permissions: ['all', 'startVote'], unique: true },
                    { id: 'vicePresident', name: 'Vice President', permissions: ['moderate', 'startVote'], unique: true },
                    { id: 'secDefense', name: 'Secretary of Defense', permissions: ['military', 'war'], unique: true },
                    { id: 'secForeign', name: 'Secretary of Foreign Affairs', permissions: ['diplomacy', 'treaties'], unique: true },
                    { id: 'secInternal', name: 'Secretary of Internal Affairs', permissions: ['members', 'domestic'], unique: true },
                    { id: 'secEconomy', name: 'Secretary of Economy', permissions: ['resources', 'trade', 'economy'], unique: true },
                    { id: 'secJustice', name: 'Secretary of Justice', permissions: ['disputes', 'rules'], unique: true },
                    { id: 'secTechnology', name: 'Secretary of Technology', permissions: ['research', 'intelligence'], unique: true },
                    { id: 'member', name: 'Member', permissions: ['basic'], unique: false }
                ]
            },
            
            trio: {
                name: 'Triumvirate',
                description: 'Three equal leaders sharing power',
                icon: 'assets/images/Alliance Government/triumvirate.png',
                roles: [
                    { id: 'triumvir1', name: 'First Triumvir', permissions: ['all', 'startVote'], unique: true },
                    { id: 'triumvir2', name: 'Second Triumvir', permissions: ['all', 'startVote'], unique: true },
                    { id: 'triumvir3', name: 'Third Triumvir', permissions: ['all', 'startVote'], unique: true },
                    { id: 'lieutenant', name: 'Lieutenant', permissions: ['moderate'], unique: false, maxCount: 3 },
                    { id: 'member', name: 'Member', permissions: ['basic'], unique: false }
                ]
            },
            autocratic: {
                name: 'Autocratic Alliance',
                description: 'Single supreme leader with appointed ministers',
                roles: [
                    { id: 'supremeLeader', name: 'Supreme Leader', permissions: ['all', 'startVote'], unique: true },
                    { id: 'warMinister', name: 'War Minister', permissions: ['military', 'war'], unique: true },
                    { id: 'diplomaticMinister', name: 'Diplomatic Minister', permissions: ['diplomacy', 'treaties'], unique: true },
                    { id: 'economicMinister', name: 'Economic Minister', permissions: ['resources', 'trade', 'economy'], unique: true },
                    { id: 'internalMinister', name: 'Internal Minister', permissions: ['members', 'domestic'], unique: true },
                    { id: 'officer', name: 'Officer', permissions: ['moderate'], unique: false, maxCount: 5 },
                    { id: 'subject', name: 'Subject', permissions: ['basic'], unique: false }
                ]
            },
            custom: {
                name: 'Custom Structure',
                description: 'Fully customizable government structure',
                icon: 'assets/images/Alliance Government/custom.png',
                roles: [] // Built by user
            },
            
            fellowship: {
                name: 'Fellowship',
                description: 'Easter-egg alliance where all founding members share equal control as Founding Fellows',
                icon: 'assets/images/Alliance Government/fellowship.png',
                roles: [
                    { id: 'foundingFellow', name: 'Founding Fellow', permissions: ['all', 'startVote'], unique: false, maxCount: 6 },
                    { id: 'fellow', name: 'Fellow', permissions: ['moderate', 'military', 'diplomacy'], unique: false }
                ]
            },

            oligarchy: {
                name: 'Oligarchy',
                description: 'Wealth council: every 30 days the 5 richest member nations (net revenue) rule as the Penta of Prosperity',
                specialType: 'oligarchy',
                councilSize: 5,
                councilRotationDays: 30,
                councilRoleId: 'oligarch',
                councilRoleName: 'Penta of Prosperity',
                icon: 'assets/images/Alliance Government/oligarchy.png',
                roles: [
                    { id: 'oligarch', name: 'Oligarch (Penta of Prosperity)', permissions: ['all', 'startVote'], unique: false, maxCount: 5 },
                    { id: 'member', name: 'Member', permissions: ['basic'], unique: false }
                ]
            },

            militaryJunta: {
                name: 'Military Junta',
                description: 'War council: every 30 days the 5 strongest member nations (military strength) rule as the Penta of Pain',
                specialType: 'militaryJunta',
                councilSize: 5,
                councilRotationDays: 30,
                councilRoleId: 'warlord',
                councilRoleName: 'Penta of Pain',
                icon: 'assets/images/Alliance Government/military-junta.png',
                roles: [
                    { id: 'warlord', name: 'Warlord (Penta of Pain)', permissions: ['all', 'military', 'war', 'startVote'], unique: false, maxCount: 5 },
                    { id: 'member', name: 'Member', permissions: ['basic'], unique: false }
                ]
            },

            theocracy: {
                name: 'Theocracy',
                description: 'Single divine leader; religion is forced to match the leader for all members. Leadership can shift by divine intervention (random daily chance) or a unanimous vote of no faith.',
                specialType: 'theocracy',
                councilSize: 1,
                icon: 'assets/images/Alliance Government/theochracy.png',
                roles: [
                    { id: 'highPriest', name: 'High Priest', permissions: ['all', 'startVote'], unique: true },
                    { id: 'congregation', name: 'Congregation', permissions: ['basic'], unique: false }
                ]
            },

            republic: {
                name: 'Republic',
                description: 'No leadership roles. All members have all permissions and are equal; every alliance decision requires a majority vote.',
                specialType: 'republic',
                requiresVoteForAll: true,
                icon: 'assets/images/Alliance Government/republic.png',
                roles: [
                    { id: 'citizen', name: 'Citizen', permissions: ['all'], unique: false }
                ]
            },

            hiveMind: {
                name: 'Hive Mind',
                description: 'No real user nation leads. An advanced AI entity runs all treaties, wars, and decisions. Users are Servants with no control; the AI acts purely on statistical or random reasons, favoring no nation.',
                specialType: 'hiveMind',
                isHiveMind: true,
                icon: 'assets/images/Alliance Government/hivemind.png',
                roles: [
                    { id: 'servant', name: 'Servant', permissions: ['basic'], unique: false }
                ]
            },

            honorTribe: {
                name: 'Honor Tribe',
                description: 'One Grand Chief leads until challenged. Leadership changes only through 1v1 solo nation wars for honor. Loser is exiled from the tribe.',
                specialType: 'honorTribe',
                councilSize: 1,
                icon: 'assets/images/Alliance Government/honor-tribe.png',
                roles: [
                    { id: 'grandChief', name: 'Grand Chief', permissions: ['all', 'startVote'], unique: true },
                    { id: 'member', name: 'Tribesperson', permissions: ['basic'], unique: false }
                ]
            }
        };
        
        // Alliance XP sources and multipliers
        this.xpSources = {
            treatyFulfillment: { base: 500, description: 'Fulfilling treaty obligations' },
            collectiveWarfare: { base: 200, description: 'Fighting together (33%+ participation)' },
            memberRetention: { base: 50, description: 'Daily bonus for active members' },
            diplomaticSuccess: { base: 300, description: 'Successful diplomatic negotiations' },
            sharedVictory: { base: 1000, description: 'Winning wars together' },
            territorialGain: { base: 400, description: 'Expanding alliance territory' },
            allianceProjects: { base: 800, description: 'Completing alliance-wide projects' }
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('Initializing Alliance System...');
        this.bindEvents();
        this.isInitialized = true;
        console.log('Alliance System ready');
    }
    
    bindEvents() {
        if (typeof EventBus === 'undefined' || typeof GameEvents === 'undefined') return;

        EventBus.on(GameEvents.DAY_PASSED, this.processDailyAlliances.bind(this));
        EventBus.on('war_declared', this.handleWarDeclared.bind(this));
        EventBus.on('war_ended', this.handleWarEnded.bind(this));
        EventBus.on('treaty_signed', this.handleTreatySigned.bind(this));
        EventBus.on('alliance_easter_egg_available', this.handleEasterEggAvailable.bind(this));
        EventBus.on('wonder_built', this.handleWonderBuilt.bind(this));
        EventBus.on('alliance_member_removed', this._onAllianceMemberRemoved.bind(this));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ALLIANCE CREATION & MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Check if a nation can create an alliance
     */
    canCreateAlliance(nationId) {
        const nation = this.getNation(nationId);
        if (!nation) return { canCreate: false, reason: 'Nation not found' };
        
        if (nation.allianceId) {
            return { canCreate: false, reason: 'Already in an alliance' };
        }
        
        // Check for wonder requirement OR easter egg condition
        const hasWonder = this.hasAllianceFoundingWonder(nationId);
        const hasEasterEgg = this.hasEasterEggCondition(nationId);
        
        if (!hasWonder && !hasEasterEgg) {
            return { 
                canCreate: false, 
                reason: 'Requires Alliance Founding Wonder or special diplomatic conditions',
                hint: 'Join Alliance (Not Create) but if the right people share ties who knows what might happen'
            };
        }
        
        return { canCreate: true, method: hasEasterEgg ? 'easterEgg' : 'wonder' };
    }
    
    /**
     * Create a new alliance
     */
    createAlliance(founderNationId, allianceData) {
        const canCreate = this.canCreateAlliance(founderNationId);
        if (!canCreate.canCreate) {
            throw new Error(canCreate.reason);
        }
        
        const allianceId = this.generateAllianceId();
        const alliance = new Alliance(allianceId, founderNationId, allianceData);
        
        // Set up initial government structure
        alliance.setupGovernment(allianceData.governmentType || 'democratic');
        
        // Add founder to alliance
        alliance.addMember(founderNationId, 'founder');
        
        // If easter egg creation, add all qualifying friends/best friends
        if (canCreate.method === 'easterEgg') {
            this.addEasterEggMembers(alliance, founderNationId);
            
            // Mark all easter egg members as founding fellows (for role transfer restrictions)
            this._membersForEach(alliance, (memberData, nationId) => {
                this.markEasterEggFounder(nationId);
            });
        }
        
        this.alliances.set(allianceId, alliance);
        
        // Update nation records
        const founderNation = this.getNation(founderNationId);
        founderNation.allianceId = allianceId;
        
        EventBus.emit('alliance_created', { 
            alliance: alliance.serialize(),
            founder: founderNationId,
            method: canCreate.method
        });
        
        return alliance;
    }
    
    /**
     * Get customization options unlocked by level
     */
    getCustomizationUnlocks(level) {
        const unlocks = [];
        if (level >= 1) unlocks.push('customBanner');
        if (level >= 2) unlocks.push('customFlag');
        if (level >= 3) unlocks.push('allianceNameFont');
        if (level >= 4) unlocks.push('allianceNameColor');
        if (level >= 5) unlocks.push('allianceNameOutline');
        if (level >= 6) unlocks.push('memberLevelsFont');
        if (level >= 7) unlocks.push('memberLevelsColor');
        if (level >= 8) unlocks.push('customEmblem');
        if (level >= 9) unlocks.push('themePalette');
        if (level >= 10) unlocks.push('fullyCustomizable');
        return unlocks;
    }
    
    /**
     * Check for easter egg condition
     */
    hasEasterEggCondition(nationId) {
        if (!window.DiplomacySystem) return false;
        
        const diplomacy = window.DiplomacySystem.nationDiplomacy.get(nationId);
        if (!diplomacy) return false;
        
        // Must have a best friend
        if (!diplomacy.relationships.bestFriend) return false;
        
        // Must have 5 friends with mutual pacts
        const friendsWithPacts = diplomacy.relationships.friends.filter(friendId => {
            return this.hasMutualPact(nationId, friendId);
        });
        
        if (friendsWithPacts.length < 5) return false;
        
        // Best friend must have mutual pacts or protectorates with all 5 friends
        const bestFriendHasPacts = friendsWithPacts.every(friendId => {
            return this.hasMutualPact(diplomacy.relationships.bestFriend, friendId) ||
                   this.hasProtectorate(diplomacy.relationships.bestFriend, friendId);
        });
        
        return bestFriendHasPacts;
    }
    
    /**
     * Check for alliance founding wonder
     */
    hasAllianceFoundingWonder(nationId) {
        if (!window.WondersSystem) return false;
        return WondersSystem.hasWonder(nationId, 'allianceHeadquarters');
    }
    
    /**
     * Add easter egg qualifying members to new alliance
     * Creates a Fellowship government where all 6 members are Founding Fellows
     */
    addEasterEggMembers(alliance, founderNationId) {
        if (!window.DiplomacySystem) return;
        
        const diplomacy = window.DiplomacySystem.nationDiplomacy.get(founderNationId);
        if (!diplomacy) return;
        
        // Override government to Fellowship for easter egg alliances
        alliance.setupGovernment('fellowship');
        alliance.governmentType = 'fellowship';
        
        // Add best friend as Founding Fellow
        if (diplomacy.relationships.bestFriend) {
            alliance.addMember(diplomacy.relationships.bestFriend, 'foundingFellow');
            const bestFriendNation = this.getNation(diplomacy.relationships.bestFriend);
            if (bestFriendNation) bestFriendNation.allianceId = alliance.id;
        }
        
        // Add all mutual pact friends as Founding Fellows
        diplomacy.relationships.friends.forEach(friendId => {
            if (this.hasMutualPact(founderNationId, friendId)) {
                alliance.addMember(friendId, 'foundingFellow');
                const friendNation = this.getNation(friendId);
                if (friendNation) friendNation.allianceId = alliance.id;
            }
        });
        
        // Also add founder as Founding Fellow (re-assign role; already added above)
        alliance.assignRole(founderNationId, 'foundingFellow');
    }
    
    /**
     * Check if two nations have a mutual pact
     */
    hasMutualPact(nationId1, nationId2) {
        if (!window.DiplomacySystem) return false;

        const diplomacy1 = window.DiplomacySystem.nationDiplomacy.get(nationId1);
        if (!diplomacy1) return false;

        // Check for mutual defense or mutual aggression treaties
        // treaties Map is keyed by treatyId, so iterate to find ones involving nationId2
        for (const [, treaty] of diplomacy1.treaties) {
            if (['mutualDefense', 'mutualAggression'].includes(treaty.type) &&
                treaty.parties.includes(nationId2)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if one nation has a protectorate with another
     */
    hasProtectorate(nationId1, nationId2) {
        if (!window.DiplomacySystem) return false;

        const diplomacy1 = window.DiplomacySystem.nationDiplomacy.get(nationId1);
        if (!diplomacy1) return false;

        for (const [, treaty] of diplomacy1.treaties) {
            if (treaty.type === 'protectorate' && treaty.parties.includes(nationId2)) {
                return true;
            }
        }
        return false;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ALLIANCE XP SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Award alliance XP for various activities
     */
    awardAllianceXP(allianceId, source, amount = null, details = {}) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return;
        
        const xpSource = this.xpSources[source];
        if (!xpSource) return;
        
        const xpGained = amount || xpSource.base;
        alliance.addExperience(xpGained, xpSource.description, details);
        
        EventBus.emit('alliance_xp_gained', {
            allianceId,
            source,
            amount: xpGained,
            description: xpSource.description,
            details
        });
    }
    
    /**
     * Process daily alliance activities
     */
    processDailyAlliances() {
        this.alliances.forEach((alliance, allianceId) => {
            // Member retention bonus
            const activeMembers = alliance.getActiveMemberCount();
            if (activeMembers > 1) {
                const retentionXP = this.xpSources.memberRetention.base * activeMembers;
                this.awardAllianceXP(allianceId, 'memberRetention', retentionXP);
            }
            
            // Process alliance skills and effects
            alliance.processDailyEffects();
            
            // Check for skill upgrades
            alliance.checkSkillUpgrades();

            // Update member stats snapshots for alliance leaderboards
            alliance.updateMemberStats();

            // Government-specific daily processing
            this.processGovernmentDaily(alliance);
        });
    }

    /**
     * Daily processing for special government types (council rotations, theocracy, etc.)
     */
    processGovernmentDaily(alliance) {
        const type = alliance.governmentType;
        const now = Date.now();

        // Oligarchy / Military Junta: monthly council rotation based on real days from creation
        if (type === 'oligarchy' || type === 'militaryJunta') {
            const template = alliance.government.structure || {};
            const rotationDays = template.councilRotationDays || 30;
            const rotationMs = rotationDays * 24 * 60 * 60 * 1000;
            const lastRotation = alliance._lastCouncilRotation || alliance.founded;
            if (now - lastRotation >= rotationMs && this._membersSize(alliance) >= 1) {
                this.rotateCouncil(alliance);
                alliance._lastCouncilRotation = now;
            }
        }

        // Theocracy: daily divine intervention (2-5% random chance) + forced religion
        if (type === 'theocracy') {
            this.processTheocracyDaily(alliance);
        }

        // Hive Mind: AI runs all decisions; no user nation leads
        if (type === 'hiveMind') {
            this.processHiveMindDaily(alliance).catch(err => console.warn('Hive Mind daily failed:', err.message));
        }
    }

    /**
     * Ensure a HiveMindAI exists for the alliance and tick it daily.
     * The AI makes all treaty/war/membership/treasury/settings/skills decisions;
     * users have no control. Execution is delegated to the AI entity itself.
     */
    async processHiveMindDaily(alliance) {
        if (!window.HiveMindAI) return;
        let ai = this.hiveMinds.get(alliance.id);
        if (!ai) {
            ai = new HiveMindAI(alliance);
            this.hiveMinds.set(alliance.id, ai);
        }
        const result = await ai.tick();
        if (result.actions && result.actions.length > 0) {
            alliance.memberHistory.push({
                action: 'hive_mind_tick',
                aiName: ai.name,
                actions: result.actions,
                date: Date.now()
            });
        }
        // Execute AI decisions that will proceed (delegated to the AI entity)
        await this.executeHiveMindDecisions(ai, result.actions, alliance);
        return result;
    }

    /**
     * Execute Hive Mind AI decisions via the AI entity's own execution methods.
     * Wrapped in try/catch so a failed execution never crashes the daily tick.
     */
    async executeHiveMindDecisions(ai, actions, alliance) {
        if (!ai || !actions || !Array.isArray(actions)) return;
        for (const action of actions) {
            if (!action || !action.willProceed) continue;
            try {
                if (action.type === 'treaty') {
                    await ai.executeTreatyProposal(action);
                } else if (action.type === 'war' && action.action === 'prepare_offensive') {
                    await ai.executeWarDeclaration(action);
                } else if (action.type === 'membership' && action.action === 'review_member') {
                    ai.executeMembershipKick(action);
                } else if (action.type === 'treasury') {
                    ai.executeTreasuryAction(action);
                } else if (action.type === 'settings') {
                    ai.executeSettingsAction(action);
                } else if (action.type === 'skills' && action.action === 'upgrade_skill') {
                    await ai.executeSkillsAction(action);
                } else if (action.type === 'invitations' && action.action === 'send_invitations') {
                    ai.executeInvitationsAction(action);
                } else if (action.type === 'roles' && action.action === 'assign_role') {
                    ai.executeRoleAssignment(action);
                } else if (action.type === 'application') {
                    ai.executeApplicationDecision(action, alliance);
                }
            } catch (err) {
                console.warn('Hive Mind decision execution failed:', err.message);
            }
        }
    }

    /**
     * Rotate the wealth/war council for Oligarchy and Military Junta.
     * Top N members by net revenue (oligarchy) or military strength (junta) become the council.
     */
    rotateCouncil(alliance) {
        const type = alliance.governmentType;
        const template = alliance.government.structure || {};
        const councilSize = template.councilSize || 5;
        const councilRoleId = template.councilRoleId || (type === 'oligarchy' ? 'oligarch' : 'warlord');
        const memberRoleId = 'member';

        // Build a scored list of members
        const scored = [];
        this._membersForEach(alliance, (memberData, nationId) => {
            const nation = this.getNation(nationId);
            if (!nation) return;
            let score = 0;
            if (type === 'oligarchy') {
                // Net revenue: taxRevenue - militaryBudget - total upkeep
                const upkeepTotal = (nation.buildingUpkeep && nation.buildingUpkeep.improvements !== undefined)
                    ? (nation.buildingUpkeep.improvements || 0) + (nation.buildingUpkeep.projects || 0) + (nation.buildingUpkeep.wonders || 0)
                    : 0;
                score = (nation.taxRevenue || 0) - (nation.militaryBudget || 0) - upkeepTotal;
            } else {
                // Military strength
                score = nation.militaryStrength || 0;
            }
            scored.push({ nationId, score });
        });

        // Sort descending by score
        scored.sort((a, b) => b.score - a.score);

        const council = scored.slice(0, councilSize).map(s => s.nationId);
        const councilSet = new Set(council);

        // Assign council role to top members, member role to the rest
        this._membersForEach(alliance, (memberData, nationId) => {
            const role = councilSet.has(nationId) ? councilRoleId : memberRoleId;
            alliance.assignRole(nationId, role);
        });

        // Record in history
        alliance.memberHistory.push({
            action: 'council_rotation',
            governmentType: type,
            council: council,
            date: Date.now()
        });

        EventBus.emit('alliance_council_rotated', {
            allianceId: alliance.id,
            governmentType: type,
            council: council,
            councilRole: councilRoleId
        });

        return council;
    }

    /**
     * Daily theocracy processing: random divine leadership change + forced religion.
     * 2-5% chance each day the High Priest changes to a random congregation member.
     * All members' religion is forced to match the current High Priest.
     * Detects High Priest religion changes and propagates to congregation.
     */
    processTheocracyDaily(alliance) {
        const roles = alliance.government.roles;
        const highPriestRole = roles.get('highPriest');
        const congregationRole = roles.get('congregation');
        if (!highPriestRole || !congregationRole) return;

        const members = this._membersKeys(alliance);
        if (members.length === 0) return;

        const currentPriestId = highPriestRole.members[0] || null;

        // Track High Priest religion changes and propagate to congregation
        if (currentPriestId) {
            const priestNation = this.getNation(currentPriestId);
            if (priestNation && priestNation.religion) {
                const lastPriestReligion = alliance._lastHighPriestReligion;

                // If High Priest's religion changed, propagate to all congregation members
                if (lastPriestReligion !== undefined && lastPriestReligion !== priestNation.religion) {
                    this.propagateTheocracyReligion(alliance, priestNation.religion, currentPriestId);
                }

                alliance._lastHighPriestReligion = priestNation.religion;
            }
        }

        // Forced religion: all members take the current High Priest's religion
        if (currentPriestId) {
            const priestNation = this.getNation(currentPriestId);
            if (priestNation && priestNation.religion) {
                const targetReligion = priestNation.religion;
                members.forEach(nationId => {
                    const nation = this.getNation(nationId);
                    if (nation && nation.religion !== targetReligion) {
                        this.forceSetNationReligion(nation, targetReligion);
                    }
                });
            }
        }

        // Divine intervention: 2-5% random chance to change leader to ANY random member
        const roll = Math.random() * 100;
        const divineChance = 2 + Math.random() * 3; // 2% to 5%
        if (roll < divineChance && members.length > 1) {
            // Pick a random member excluding the current priest (to ensure actual change)
            const candidates = currentPriestId ? members.filter(id => id !== currentPriestId) : members;
            if (candidates.length > 0) {
                const newPriestId = candidates[Math.floor(Math.random() * candidates.length)];
                this.changeTheocracyLeader(alliance, currentPriestId, newPriestId, 'divineIntervention');
            }
        }
    }

    /**
     * Force-set a nation's religion and apply bonuses, bypassing normal approval gates.
     * Used for theocracy congregation members whose population accepts the High Priest's religion.
     */
    forceSetNationReligion(nation, religionId) {
        const oldReligion = nation.religion;
        nation.religion = religionId;

        // Apply religion bonuses via ReligionSystem
        if (window.ReligionSystem) {
            window.ReligionSystem.applyReligionBonuses(nation, religionId);
        }
        // Apply nation-level religion bonuses
        if (nation.applyReligionBonuses) {
            nation.applyReligionBonuses();
        }

        // Mark as theocracy-approved so population does not rebel
        nation._theocracyReligionApproved = true;
        nation._theocracyReligionSource = religionId;

        EventBus.emit(GameEvents.RELIGION_CHANGED, {
            oldReligion: oldReligion,
            newReligion: religionId,
            nation: nation.serialize ? nation.serialize() : {},
            source: 'theocracy'
        });
    }

    /**
     * Propagate the High Priest's religion to all congregation members when it changes.
     */
    propagateTheocracyReligion(alliance, religionId, priestId) {
        this._membersForEach(alliance, (memberData, nationId) => {
            if (nationId === priestId) return; // Skip the High Priest
            const nation = this.getNation(nationId);
            if (nation && nation.religion !== religionId) {
                this.forceSetNationReligion(nation, religionId);
            }
        });

        alliance.memberHistory.push({
            action: 'theocracy_religion_propagated',
            religion: religionId,
            leader: priestId,
            date: Date.now()
        });

        EventBus.emit('alliance_theocracy_religion_propagated', {
            allianceId: alliance.id,
            religion: religionId,
            leader: priestId
        });
    }

    /**
     * Change the High Priest of a theocracy.
     */
    changeTheocracyLeader(alliance, oldPriestId, newPriestId, reason) {
        const roles = alliance.government.roles;
        const highPriestRole = this._rolesGet(alliance, 'highPriest');
        const congregationRole = this._rolesGet(alliance, 'congregation');
        if (!highPriestRole || !congregationRole) return false;

        // Remove old priest from highPriest role
        if (oldPriestId) {
            const idx = highPriestRole.members.indexOf(oldPriestId);
            if (idx !== -1) highPriestRole.members.splice(idx, 1);
            alliance.assignRole(oldPriestId, 'congregation');
        }

        // Assign new priest
        alliance.assignRole(newPriestId, 'highPriest');

        // Force religion to match new leader
        const newPriestNation = this.getNation(newPriestId);
        if (newPriestNation && newPriestNation.religion) {
            const targetReligion = newPriestNation.religion;
            this._membersForEach(alliance, (memberData, nationId) => {
                const nation = this.getNation(nationId);
                if (nation && nation.religion !== targetReligion) {
                    this.forceSetNationReligion(nation, targetReligion);
                }
            });
        }

        // Reset High Priest religion tracker for the new leader
        if (newPriestNation && newPriestNation.religion) {
            alliance._lastHighPriestReligion = newPriestNation.religion;
        } else {
            delete alliance._lastHighPriestReligion;
        }

        alliance.memberHistory.push({
            action: 'theocracy_leader_change',
            oldLeader: oldPriestId,
            newLeader: newPriestId,
            reason: reason,
            date: Date.now()
        });

        EventBus.emit('alliance_theocracy_leader_changed', {
            allianceId: alliance.id,
            oldLeader: oldPriestId,
            newLeader: newPriestId,
            reason: reason
        });

        return true;
    }

    /**
     * Theocracy vote of no faith.
     * Requires a unanimous vote: every member besides the current leader must vote in favor.
     * If unanimous, randomly picks a new leader from the member pool excluding the current leader.
     */
    theocracyVoteOfNoFaith(alliance, votingNationId) {
        if (alliance.governmentType !== 'theocracy') {
            throw new Error('Vote of no faith is only available in a Theocracy');
        }
        const roles = alliance.government.roles;
        const highPriestRole = this._rolesGet(alliance, 'highPriest');
        if (!highPriestRole) throw new Error('No High Priest in this theocracy');
        const currentLeader = highPriestRole.members[0];
        if (!currentLeader) throw new Error('No High Priest currently serving');

        const members = this._membersKeys(alliance);
        const voters = members.filter(id => id !== currentLeader);

        // The voting nation must be a non-leader member
        if (!voters.includes(votingNationId)) {
            throw new Error('Only non-leader members can call a vote of no faith');
        }

        // Initialize vote tracker if needed
        if (!alliance._noFaithVotes) alliance._noFaithVotes = new Map();
        alliance._noFaithVotes.set(votingNationId, true);

        // Check unanimity: every non-leader member must have voted
        if (voters.length > 0 && alliance._noFaithVotes.size >= voters.length) {
            // Unanimous reached - pick a new random leader excluding current leader
            const candidates = members.filter(id => id !== currentLeader);
            if (candidates.length === 0) {
                throw new Error('No eligible successor available');
            }
            const newLeader = candidates[Math.floor(Math.random() * candidates.length)];
            this.changeTheocracyLeader(alliance, currentLeader, newLeader, 'voteOfNoFaith');
            alliance._noFaithVotes.clear();
            return { success: true, newLeader: newLeader, reason: 'voteOfNoFaith', unanimous: true };
        }

        return { success: false, reason: 'pending', votes: alliance._noFaithVotes.size, required: voters.length };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WAR INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle war participation for XP
     */
    handleWarDeclared(data) {
        if (!data || !data.war) return;

        const war = data.war;

        // Skip honor challenge wars - they are internal 1v1 duels, not alliance warfare
        if (war.honorChallenge) return;

        const attackerNationId = war.originalAttacker;
        const defenderNationId = war.originalDefender;

        if (!attackerNationId || !defenderNationId) return;

        // Check attacker alliance participation
        const attackerNation = this.getNation(attackerNationId);
        if (attackerNation && attackerNation.allianceId) {
            this.checkAllianceWarParticipation(attackerNation.allianceId, war, 'attacker');
        }

        // Check defender alliance participation  
        const defenderNation = this.getNation(defenderNationId);
        if (defenderNation && defenderNation.allianceId) {
            this.checkAllianceWarParticipation(defenderNation.allianceId, war, 'defender');
        }
    }
    
    /**
     * Check if alliance has sufficient participation for XP
     */
    checkAllianceWarParticipation(allianceId, war, side) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return;
        
        const totalMembers = this._membersSize(alliance);
        const participatingMembers = this.countAllianceParticipants(alliance, war, side);
        const participationPercent = (participatingMembers / totalMembers) * 100;
        
        // Need at least 33% participation for alliance XP
        if (participationPercent >= 33) {
            alliance.setWarParticipation(war.id, {
                side,
                participationPercent,
                eligible: true
            });
        }
    }
    
    /**
     * Count alliance members participating in war
     */
    countAllianceParticipants(alliance, war, side) {
        let count = 0;
        if (!war || !war.sides || !war.sides[side]) return 0;
        this._membersForEach(alliance, (memberData, nationId) => {
            if (war.sides[side].nations.includes(nationId)) {
                count++;
            }
        });
        return count;
    }
    
    /**
     * Handle war damage for alliance XP
     */
    handleWarDamage(war, attackerNationId, damage) {
        const attackerNation = this.getNation(attackerNationId);
        if (!attackerNation || !attackerNation.allianceId) return;
        
        const alliance = this.alliances.get(attackerNation.allianceId);
        if (!alliance) return;
        
        const warParticipation = alliance.warParticipation.get(war.id);
        if (warParticipation && warParticipation.eligible) {
            // Award XP based on damage dealt
            const xpGained = Math.floor(damage / 1000); // 1 XP per 1000 damage
            this.awardAllianceXP(attackerNation.allianceId, 'collectiveWarfare', xpGained, {
                warId: war.id,
                damage: damage,
                attacker: attackerNationId
            });
        }
    }
    
    /**
     * Handle war end for alliance XP
     */
    handleWarEnded(data) {
        if (!data || !data.war) return;

        const war = data.war;
        const winner = data.winner;

        // Handle Honor Tribe 1v1 challenge war results
        if (war.honorChallenge) {
            this._handleHonorChallengeWarEnded(war);
            // Clean up war participation tracking
            this.alliances.forEach(alliance => {
                alliance.warParticipation.delete(war.id);
            });
            return;
        }

        // Award victory bonuses
        if (winner && winner.type === 'alliance') {
            const alliance = this.alliances.get(winner.id);
            if (alliance && war.sides && war.sides.defender) {
                this.awardAllianceXP(winner.id, 'sharedVictory', null, {
                    warId: war.id,
                    defeated: war.sides.defender.nations
                });
            }
        } else if (winner === 'attacker' || winner === 'defender') {
            // Single-nation war winner - award to their alliance
            const winnerNationId = winner === 'attacker' ? war.originalAttacker : war.originalDefender;
            const loserSide = winner === 'attacker' ? 'defender' : 'attacker';
            const winnerNation = this.getNation(winnerNationId);
            if (winnerNation && winnerNation.allianceId && war.sides && war.sides[loserSide]) {
                this.awardAllianceXP(winnerNation.allianceId, 'sharedVictory', null, {
                    warId: war.id,
                    defeated: war.sides[loserSide].nations
                });
            }
        }

        // Clean up war participation tracking
        this.alliances.forEach(alliance => {
            alliance.warParticipation.delete(war.id);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Generate unique alliance ID
     */
    generateAllianceId() {
        return 'alliance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get nation by ID (helper method)
     */
    getNation(nationId) {
        // Try window.Nation first
        if (window.Nation && window.Nation.id === nationId) {
            return window.Nation;
        }

        // Try DataManager currentPlayer nations
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

        return null;
    }
    
    /**
     * Get alliance by ID
     */
    getAlliance(allianceId) {
        return this.alliances.get(allianceId);
    }
    
    /**
     * Handle treaty signing for alliance XP
     */
    handleTreatySigned(data) {
        const { treaty, participants } = data;
        
        participants.forEach(participantId => {
            const nation = this.getNation(participantId);
            if (nation && nation.allianceId) {
                this.awardAllianceXP(nation.allianceId, 'diplomaticSuccess', null, {
                    treatyType: treaty.type,
                    partner: participants.find(p => p !== participantId)
                });
            }
        });
    }
    
    /**
     * Handle easter egg detection from diplomacy system
     */
    handleEasterEggAvailable(data) {
        console.log('Easter egg alliance creation available:', data);
        
        // Notify all involved nations
        EventBus.emit('alliance_creation_unlocked', {
            nations: data.nations,
            method: 'easterEgg',
            message: data.message
        });
    }
    
    /**
     * Handle wonder built events
     */
    handleWonderBuilt(data) {
        if (data.wonderKey === 'allianceHeadquarters') {
            console.log('Alliance Headquarters built, enabling alliance creation');
            
            EventBus.emit('alliance_creation_unlocked', {
                nations: [data.nationId],
                method: 'wonder',
                message: 'Alliance Headquarters constructed! You can now create an alliance.'
            });
        }
    }

    /**
     * Handle member removal - auto-disband empty non-Hive-Mind alliances
     */
    _onAllianceMemberRemoved(data) {
        if (!data || !data.allianceId) return;
        this._autoDisbandEmptyAlliance(data.allianceId);
    }
    
    /**
     * Get alliance by nation ID
     */
    getAllianceByNation(nationId) {
        const nation = this.getNation(nationId);
        if (!nation || !nation.allianceId) return null;
        return this.alliances.get(nation.allianceId);
    }
    
    /**
     * Check if two nations are in the same alliance
     */
    areAllied(nationId1, nationId2) {
        const nation1 = this.getNation(nationId1);
        const nation2 = this.getNation(nationId2);
        
        if (!nation1 || !nation2) return false;
        if (!nation1.allianceId || !nation2.allianceId) return false;
        
        return nation1.allianceId === nation2.allianceId;
    }
    
    /**
     * Get alliance military bonus for war calculations
     */
    getAllianceWarBonus(allianceId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return 1.0;

        let bonus = 1.0;

        // Combat Offensive skill bonus
        const combatSkill = alliance.skills.combatOffensive;
        if (combatSkill && combatSkill.level > 0) {
            bonus += combatSkill.effects.attackBoost || 0;
        }

        // Combat Defensive skill bonus when defending
        const defenseSkill = alliance.skills.combatDefensive;
        if (defenseSkill && defenseSkill.level > 0) {
            bonus += defenseSkill.effects.defenseBoost || 0;
        }

        // Unity skill overall efficiency
        const unitySkill = alliance.skills.unity;
        if (unitySkill && unitySkill.level > 0) {
            bonus += unitySkill.effects.happinessBoost || 0;
        }

        return Math.min(bonus, 2.0); // Cap at 100% bonus
    }

    /**
     * Get a specific alliance skill bonus for a nation.
     * Returns the effect value from the alliance's skills for the given bonus type.
     * If the nation is not in an alliance, returns 0.
     */
    getAllianceBonus(nationId, bonusType) {
        const alliance = this.getAllianceByNation(nationId);
        if (!alliance) return 0;

        const skillKey = this._bonusTypeToSkillKey(bonusType);
        if (!skillKey) return 0;

        const skill = alliance.skills[skillKey];
        if (!skill || skill.level === 0) return 0;

        const effects = skill.effects || {};
        return effects[bonusType] || 0;
    }

    /**
     * Get combined attack bonus for a nation (from combatOffensive skill)
     */
    getAttackBonus(nationId) {
        return this.getAllianceBonus(nationId, 'attackBoost');
    }

    /**
     * Get combined defense bonus for a nation (from combatDefensive skill)
     */
    getDefenseBonus(nationId) {
        return this.getAllianceBonus(nationId, 'defenseBoost');
    }

    /**
     * Get aim bonus for a nation (from marksmanship skill)
     */
    getAimBonus(nationId) {
        return this.getAllianceBonus(nationId, 'aimBoost');
    }

    /**
     * Get luck bonus for a nation (from fortune skill)
     */
    getLuckBonus(nationId) {
        return this.getAllianceBonus(nationId, 'luckBoost');
    }

    /**
     * Get critical damage bonus for a nation (from criticalStrike skill)
     */
    getCriticalDamageBonus(nationId) {
        return this.getAllianceBonus(nationId, 'critDamageBoost');
    }

    /**
     * Get critical chance bonus for a nation (from criticalEye skill)
     */
    getCriticalChanceBonus(nationId) {
        return this.getAllianceBonus(nationId, 'critChanceBoost');
    }

    /**
     * Get infrastructure cost reduction for a nation (from expansion skill)
     */
    getInfraCostReduction(nationId) {
        return this.getAllianceBonus(nationId, 'infraCostReduction');
    }

    /**
     * Get land cost reduction for a nation (from expansion skill)
     */
    getLandCostReduction(nationId) {
        return this.getAllianceBonus(nationId, 'landCostReduction');
    }

    /**
     * Get infrastructure upkeep reduction for a nation (from upkeepReduction skill)
     */
    getInfraUpkeepReduction(nationId) {
        return this.getAllianceBonus(nationId, 'infraUpkeepReduction');
    }

    /**
     * Get land upkeep reduction for a nation (from upkeepReduction skill)
     */
    getLandUpkeepReduction(nationId) {
        return this.getAllianceBonus(nationId, 'landUpkeepReduction');
    }

    /**
     * Get technology cost reduction for a nation (from technology skill)
     */
    getTechCostReduction(nationId) {
        return this.getAllianceBonus(nationId, 'techCostReduction');
    }

    /**
     * Get happiness boost for a nation (from unity skill)
     */
    getHappinessBoost(nationId) {
        return this.getAllianceBonus(nationId, 'happinessBoost');
    }

    /**
     * Get crime reduction for a nation (from unity skill)
     */
    getCrimeReduction(nationId) {
        return this.getAllianceBonus(nationId, 'crimeReduction');
    }

    /**
     * Get disease reduction for a nation (from unity skill)
     */
    getDiseaseReduction(nationId) {
        return this.getAllianceBonus(nationId, 'diseaseReduction');
    }

    /**
     * Get spy efficiency bonus for a nation (from intelligence skill)
     */
    getSpyEfficiencyBonus(nationId) {
        return this.getAllianceBonus(nationId, 'spyEfficiencyBonus');
    }

    /**
     * Map a bonus type string to the corresponding alliance skill key
     */
    _bonusTypeToSkillKey(bonusType) {
        const mapping = {
            attackBoost: 'combatOffensive',
            defenseBoost: 'combatDefensive',
            aimBoost: 'marksmanship',
            luckBoost: 'fortune',
            critDamageBoost: 'criticalStrike',
            critChanceBoost: 'criticalEye',
            treatySuccessBonus: 'diplomacy',
            treatyDurationBonus: 'diplomacy',
            infraCostReduction: 'expansion',
            landCostReduction: 'expansion',
            infraUpkeepReduction: 'upkeepReduction',
            landUpkeepReduction: 'upkeepReduction',
            techCostReduction: 'technology',
            happinessBoost: 'unity',
            crimeReduction: 'unity',
            diseaseReduction: 'unity',
            spyEfficiencyBonus: 'intelligence'
        };
        return mapping[bonusType] || null;
    }

    /**
     * Get all alliance bonuses for a nation as a single object.
     * Useful for applying all bonuses at once to a nation object.
     */
    getAllAllianceBonuses(nationId) {
        const alliance = this.getAllianceByNation(nationId);
        if (!alliance) return {};

        const bonuses = {};
        const skillKeys = Object.keys(alliance.skills);

        for (const skillKey of skillKeys) {
            const skill = alliance.skills[skillKey];
            if (!skill || skill.level === 0) continue;
            const effects = skill.effects || {};
            for (const [effectKey, effectValue] of Object.entries(effects)) {
                if (effectKey === 'customOptions' || effectKey === 'memberLimit') continue;
                bonuses[effectKey] = (bonuses[effectKey] || 0) + effectValue;
            }
        }

        return bonuses;
    }

    /**
     * Apply all alliance skill bonuses to a nation object.
     * Modifies the nation object in place by adding an _allianceBonuses property.
     */
    applyAllianceBonusesToNation(nationId) {
        const nation = this.getNation(nationId);
        if (!nation) return null;

        const bonuses = this.getAllAllianceBonuses(nationId);
        nation._allianceBonuses = bonuses;

        return bonuses;
    }

    /**
     * Check if a member's role grants economic/financial viewing permissions.
     * Accepts 'all', 'economy', 'resources', or 'trade'.
     */
    hasEconPermission(alliance, nationId) {
        const member = this._membersGet(alliance, nationId);
        if (!member) return false;
        const perms = member.permissions || [];
        return perms.includes('all') || perms.includes('economy') || perms.includes('resources') || perms.includes('trade');
    }

    /**
     * Get a target member nation's full financial / revenue breakdown.
     * Viewer must be in the same alliance and hold an economic permission.
     * Returns the breakdown object or throws on permission/nation errors.
     */
    getMemberFinancialBreakdown(viewerNationId, targetNationId) {
        const alliance = this.getAllianceByNation(viewerNationId);
        if (!alliance) {
            throw new Error('Viewer is not in an alliance');
        }
        const targetAlliance = this.getAllianceByNation(targetNationId);
        if (!targetAlliance || targetAlliance.id !== alliance.id) {
            throw new Error('Target nation is not in your alliance');
        }
        if (!this.hasEconPermission(alliance, viewerNationId)) {
            throw new Error('Your role does not have economic/financial viewing permissions');
        }

        const nation = this.getNation(targetNationId);
        if (!nation) {
            throw new Error('Target nation not found');
        }

        const upkeepTotal = (nation.buildingUpkeep && nation.buildingUpkeep.improvements !== undefined)
            ? (nation.buildingUpkeep.improvements || 0) + (nation.buildingUpkeep.projects || 0) + (nation.buildingUpkeep.wonders || 0)
            : 0;
        const netRevenue = (nation.taxRevenue || 0) - (nation.militaryBudget || 0) - upkeepTotal;

        return {
            nationId: nation.id,
            nationName: nation.name || nation.id,
            money: nation.money || 0,
            taxRate: nation.taxRate || 0,
            taxableIncome: nation.taxableIncome || 0,
            taxRevenue: nation.taxRevenue || 0,
            totalTaxEarned: nation.totalTaxEarned || 0,
            gdp: nation.gdp || 0,
            budget: nation.budget ? { ...nation.budget } : { income: 0, expenses: 0, balance: 0 },
            debt: nation.debt || 0,
            militaryBudget: nation.militaryBudget || 0,
            buildingUpkeep: nation.buildingUpkeep ? { ...nation.buildingUpkeep } : { improvements: 0, projects: 0, wonders: 0 },
            upkeepTotal: upkeepTotal,
            netRevenue: netRevenue,
            resourceGeneration: nation.resourceGeneration ? { ...nation.resourceGeneration } : { money: 0 },
            militaryStrength: nation.militaryStrength || 0,
            lastActive: nation.lastActive || null
        };
    }

    /**
     * Get the alliance a nation belongs to (alias for getAllianceByNation)
     */
    getAllianceForNation(nationId) {
        return this.getAllianceByNation(nationId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // ALLIANCE LEADERBOARD METHODS
    // ═════════════════════════════════════════════════════════════════════════════

    /**
     * Get a ranked leaderboard for a specific stat metric within an alliance.
     * @param {string} allianceId - alliance to rank
     * @param {string} metric - 'money', 'taxRevenue', 'netRevenue', 'militaryStrength', 'gdp', 'population', 'tech', 'happiness', 'stability'
     * @param {boolean} descending - highest first (default true)
     * @param {number} limit - max entries returned
     * @returns {Array} sorted array of stat snapshots
     */
    getAllianceLeaderboard(allianceId, metric, descending = true, limit = null) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return [];
        return alliance.getLeaderboard(metric, descending, limit);
    }

    /**
     * Get a nation's rank within its alliance for a specific stat metric (1 = top).
     * @returns {number|null} rank position or null if not found
     */
    getAllianceMemberRank(nationId, metric, descending = true) {
        const alliance = this.getAllianceByNation(nationId);
        if (!alliance) return null;
        return alliance.getMemberRank(nationId, metric, descending);
    }

    /**
     * Get stats snapshot for a member nation within their alliance.
     */
    getAllianceMemberStats(nationId) {
        const alliance = this.getAllianceByNation(nationId);
        if (!alliance) return null;
        return alliance.getMemberStats(nationId);
    }
    
    /**
     * Serialize all alliance data for saving
     */
    serialize() {
        return {
            alliances: Array.from(this.alliances.entries()).map(([id, alliance]) => [id, alliance.serialize()]),
            allianceInvitations: Array.from(this.allianceInvitations.entries()),
            allianceDiplomacy: Array.from(this.allianceDiplomacy.entries()),
            hiveMinds: Array.from(this.hiveMinds.entries()).map(([id, ai]) => [id, ai.serialize()])
        };
    }
    
    /**
     * Deserialize alliance data from save
     */
    deserialize(data) {
        if (!data) return;
        
        // Restore alliances
        if (data.alliances) {
            this.alliances.clear();
            data.alliances.forEach(([id, allianceData]) => {
                const alliance = Alliance.deserialize(allianceData);
                this.alliances.set(id, alliance);
            });
        }
        
        // Restore invitations
        if (data.allianceInvitations) {
            this.allianceInvitations = new Map(data.allianceInvitations);
        }
        
        // Restore diplomacy
        if (data.allianceDiplomacy) {
            this.allianceDiplomacy = new Map(data.allianceDiplomacy);
        }
        
        // Restore hive minds (will be re-attached to alliances on next tick)
        if (data.hiveMinds) {
            this.hiveMinds = new Map(data.hiveMinds);
        }
    }
    
    /**
     * Integration with existing war system
     * Provides alliance war bonus calculation that WarSystem can use via getAllianceById
     */
    integrateWithWarSystem() {
        if (window.WarSystem) {
            // Register alliance war bonus lookup on WarSystem for use in damage calculations
            window.WarSystem.getAllianceWarBonus = (allianceId) => {
                return this.getAllianceWarBonus(allianceId);
            };
        }
    }
    
    /**
     * Integration with existing diplomacy system  
     */
    integrateWithDiplomacySystem() {
        if (window.DiplomacySystem) {
            const allianceSystem = this;
            const diplomacySystem = window.DiplomacySystem;
            const originalValidate = diplomacySystem.validateTreatyProposal.bind(diplomacySystem);
            
            // Only wrap once
            if (diplomacySystem.validateTreatyProposal._allianceWrapped) return;
            
            diplomacySystem.validateTreatyProposal = (data) => {
                const result = originalValidate(data);
                
                // Add alliance-specific validations
                const proposerNation = allianceSystem.getNation(data.proposerId);
                const targetNation = allianceSystem.getNation(data.targetId);
                
                if (proposerNation && targetNation) {
                    // Check if nations are in same alliance (some treaties may not be allowed)
                    if (allianceSystem.areAllied(data.proposerId, data.targetId)) {
                        // Allies don't need certain treaties
                        if (['mutualDefense', 'mutualAggression'].includes(data.treatyType)) {
                            return { valid: false, reason: 'Alliance members already have mutual obligations' };
                        }
                    }
                }
                
                return result;
            };
            diplomacySystem.validateTreatyProposal._allianceWrapped = true;
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // ROLE RESIGNATION & TRANSFER
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Resign from a leadership role (member keeps alliance membership, loses role)
     * Founding Fellows in a Fellowship can resign their Founding Fellow status
     * but remain as regular Fellows.
     */
    resignRole(nationId) {
        const alliance = this.getAllianceByNation(nationId);
        if (!alliance) {
            throw new Error('Nation is not in an alliance');
        }

        const member = this._membersGet(alliance, nationId);
        if (!member) {
            throw new Error('Nation is not a member of this alliance');
        }

        const currentRole = member.role;
        const roleData = this._rolesGet(alliance, currentRole);

        if (!roleData) {
            throw new Error('Member has no assigned role');
        }

        // Cannot resign from 'member' role (already base)
        if (currentRole === 'member') {
            throw new Error('Already at base member role');
        }

        // Determine fallback role
        let fallbackRole = 'member';
        if (alliance.governmentType === 'fellowship' && currentRole === 'foundingFellow') {
            // Founding Fellow resigns -> becomes regular Fellow (not Founding Fellow)
            const fellowRole = this._rolesGet(alliance, 'fellow');
            if (fellowRole) {
                fallbackRole = 'fellow';
            }
        } else {
            // Find a non-unique role to fall back to
            for (const roleId of this._rolesKeys(alliance)) {
                const rData = this._rolesGet(alliance, roleId);
                if (!rData.unique && rData.id !== currentRole) {
                    fallbackRole = roleId;
                    break;
                }
            }
        }

        if (roleData.permissions.includes('all')) {
            const otherAllHolders = [];
            this._membersForEach(alliance, (m, nid) => {
                if (nid !== nationId && m.permissions.includes('all')) {
                    otherAllHolders.push(nid);
                }
            });
            if (otherAllHolders.length === 0) {
                throw new Error('Cannot resign the only leadership role with full permissions; alliance would be left leaderless');
            }
        }

        // Remove from current role
        alliance.assignRole(nationId, fallbackRole);

        // Record in history
        alliance.memberHistory.push({
            action: 'resigned_role',
            nationId: nationId,
            previousRole: currentRole,
            newRole: fallbackRole,
            date: Date.now()
        });

        EventBus.emit('alliance_role_resigned', {
            allianceId: alliance.id,
            nationId: nationId,
            previousRole: currentRole,
            newRole: fallbackRole
        });

        return { success: true, previousRole: currentRole, newRole: fallbackRole };
    }

    /**
     * Transfer a leadership role to another member.
     * The recipient does NOT gain Founding Fellow status unless they were already a founder.
     * Current holder steps down to fallback role.
     */
    transferRole(fromNationId, toNationId, roleId) {
        const alliance = this.getAllianceByNation(fromNationId);
        if (!alliance) {
            throw new Error('Source nation is not in an alliance');
        }

        const fromMember = this._membersGet(alliance, fromNationId);
        const toMember = this._membersGet(alliance, toNationId);
        if (!fromMember || !toMember) {
            throw new Error('One or both nations are not members');
        }

        if (fromMember.role !== roleId) {
            throw new Error('Source nation does not hold this role');
        }

        const roleData = this._rolesGet(alliance, roleId);
        if (!roleData) {
            throw new Error('Role not found');
        }

        // Check if recipient can hold this role
        if (roleData.unique) {
            const currentHolders = roleData.members.filter(id => id !== fromNationId);
            if (currentHolders.length >= roleData.maxCount) {
                throw new Error('Role is already at maximum capacity');
            }
        }

        // Founding Fellow restriction: non-founders cannot become Founding Fellows
        if (roleId === 'foundingFellow') {
            const recipientNation = this.getNation(toNationId);
            if (recipientNation && !recipientNation._isEasterEggFounder) {
                throw new Error('Only original founders can hold Founding Fellow status');
            }
        }

        // Transfer role
        const success = alliance.assignRole(toNationId, roleId);
        if (!success) {
            throw new Error('Failed to assign role to recipient');
        }

        // Source steps down to fallback
        let fallbackRole = 'member';
        if (alliance.governmentType === 'fellowship' && roleId === 'foundingFellow') {
            const fellowRole = this._rolesGet(alliance, 'fellow');
            if (fellowRole) {
                fallbackRole = 'fellow';
            }
        } else {
            for (const rId of this._rolesKeys(alliance)) {
                const rData = this._rolesGet(alliance, rId);
                if (!rData.unique && rData.id !== roleId) {
                    fallbackRole = rId;
                    break;
                }
            }
        }
        alliance.assignRole(fromNationId, fallbackRole);

        // Record in history
        alliance.memberHistory.push({
            action: 'transferred_role',
            fromNationId: fromNationId,
            toNationId: toNationId,
            role: roleId,
            date: Date.now()
        });

        EventBus.emit('alliance_role_transferred', {
            allianceId: alliance.id,
            fromNationId: fromNationId,
            toNationId: toNationId,
            role: roleId
        });

        return { success: true, role: roleId, recipient: toNationId };
    }

    // ════════════════════════════════════════════════════════════════════════════
    // MEMBER ACCESS COMPATIBILITY (Map vs plain object)
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Get member data (works for both Map and plain object).
     */
    _membersGet(alliance, nationId) {
        if (!alliance || !alliance.members) return undefined;
        if (typeof alliance.members.get === 'function') {
            return alliance.members.get(nationId);
        }
        return alliance.members[nationId];
    }

    /**
     * Get member count (works for both Map and plain object).
     */
    _membersSize(alliance) {
        if (!alliance || !alliance.members) return 0;
        if (typeof alliance.members.size === 'number') {
            return alliance.members.size;
        }
        return Object.keys(alliance.members).length;
    }

    /**
     * Get member keys (works for both Map and plain object).
     */
    _membersKeys(alliance) {
        if (!alliance || !alliance.members) return [];
        if (typeof alliance.members.keys === 'function') {
            return Array.from(alliance.members.keys());
        }
        return Object.keys(alliance.members);
    }

    /**
     * Get member entries [id, data] (works for both Map and plain object).
     */
    _membersEntries(alliance) {
        if (!alliance || !alliance.members) return [];
        if (typeof alliance.members.entries === 'function') {
            return Array.from(alliance.members.entries());
        }
        return Object.entries(alliance.members);
    }

    /**
     * Iterate over members (works for both Map and plain object).
     */
    _membersForEach(alliance, callback) {
        if (!alliance || !alliance.members) return;
        if (typeof alliance.members.forEach === 'function') {
            alliance.members.forEach(callback);
        } else {
            for (const [id, data] of Object.entries(alliance.members)) {
                callback(data, id, alliance.members);
            }
        }
    }

    /**
     * Iterate over roles (works for both Map and plain object).
     */
    _rolesForEach(alliance, callback) {
        if (!alliance || !alliance.government || !alliance.government.roles) return;
        const roles = alliance.government.roles;
        if (typeof roles.forEach === 'function') {
            roles.forEach(callback);
        } else {
            for (const [roleId, roleData] of Object.entries(roles)) {
                callback(roleData, roleId, roles);
            }
        }
    }

    /**
     * Get role data by ID (works for both Map and plain object).
     */
    _rolesGet(alliance, roleId) {
        if (!alliance || !alliance.government || !alliance.government.roles) return undefined;
        if (typeof alliance.government.roles.get === 'function') {
            return alliance.government.roles.get(roleId);
        }
        return alliance.government.roles[roleId];
    }

    /**
     * Get role keys (works for both Map and plain object).
     */
    _rolesKeys(alliance) {
        if (!alliance || !alliance.government || !alliance.government.roles) return [];
        if (typeof alliance.government.roles.keys === 'function') {
            return Array.from(alliance.government.roles.keys());
        }
        return Object.keys(alliance.government.roles);
    }

    /**
     * Delete a member (works for both Map and plain object).
     */
    _membersDelete(alliance, nationId) {
        if (!alliance || !alliance.members) return false;
        if (typeof alliance.members.delete === 'function') {
            return alliance.members.delete(nationId);
        }
        if (Object.prototype.hasOwnProperty.call(alliance.members, nationId)) {
            delete alliance.members[nationId];
            return true;
        }
        return false;
    }

    /**
     * Set role data on the roles collection (works for both Map and plain object).
     */
    _rolesSet(alliance, roleId, roleData) {
        if (!alliance || !alliance.government || !alliance.government.roles) return false;
        const roles = alliance.government.roles;
        if (typeof roles.set === 'function') {
            roles.set(roleId, roleData);
        } else {
            roles[roleId] = roleData;
        }
        return true;
    }

    /**
     * Delete a role from the roles collection (works for both Map and plain object).
     */
    _rolesDelete(alliance, roleId) {
        if (!alliance || !alliance.government || !alliance.government.roles) return false;
        const roles = alliance.government.roles;
        if (typeof roles.delete === 'function') {
            return roles.delete(roleId);
        }
        if (Object.prototype.hasOwnProperty.call(roles, roleId)) {
            delete roles[roleId];
            return true;
        }
        return false;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ════════════════════════════════════════════════════════════════════════════
    
    /**
     * Generate unique alliance ID
     */
    startVote(allianceId, voteType, targetNationId, initiatorNationId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        // Voting only for democratic, trio, and republic governments
        if (!['democratic', 'trio', 'republic'].includes(alliance.governmentType)) {
            throw new Error('Voting is not available for this government type');
        }

        const initiator = this._membersGet(alliance, initiatorNationId);
        if (!initiator) {
            throw new Error('Initiator is not a member');
        }

        // Check initiator has permission to start votes
        if (!this.hasRolePermission(alliance, initiatorNationId, 'startVote')) {
            throw new Error('Initiator does not have permission to start votes');
        }

        const voteId = 'vote_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        const vote = {
            id: voteId,
            allianceId: allianceId,
            voteType: voteType, // 'elect', 'remove', 'changeGovernment'
            targetNationId: targetNationId,
            initiatorNationId: initiatorNationId,
            startTime: Date.now(),
            endTime: Date.now() + (3 * 24 * 60 * 60 * 1000), // 3 days
            votes: new Map(), // nationId -> 'yes' | 'no' | 'abstain'
            status: 'active',
            requiredQuorum: Math.ceil(this._membersSize(alliance) * 0.5), // 50% quorum
            requiredMajority: 0.6 // 60% yes votes needed
        };

        // Initialize alliance votes map if needed
        if (!alliance.activeVotes) {
            alliance.activeVotes = new Map();
        }

        alliance.activeVotes.set(voteId, vote);

        EventBus.emit('alliance_vote_started', {
            allianceId: allianceId,
            voteId: voteId,
            voteType: voteType,
            targetNationId: targetNationId,
            initiatorNationId: initiatorNationId,
            endTime: vote.endTime
        });

        return voteId;
    }

    /**
     * Cast a vote on an active alliance vote
     */
    castVote(allianceId, voteId, nationId, voteChoice) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance || !alliance.activeVotes) {
            throw new Error('Alliance not found or no active votes');
        }

        const vote = alliance.activeVotes.get(voteId);
        if (!vote || vote.status !== 'active') {
            throw new Error('Vote not found or not active');
        }

        if (Date.now() > vote.endTime) {
            vote.status = 'expired';
            throw new Error('Vote has expired');
        }

        const voter = this._membersGet(alliance, nationId);
        if (!voter) {
            throw new Error('Voter is not a member');
        }

        if (!['yes', 'no', 'abstain'].includes(voteChoice)) {
            throw new Error('Invalid vote choice');
        }

        vote.votes.set(nationId, voteChoice);

        EventBus.emit('alliance_vote_cast', {
            allianceId: allianceId,
            voteId: voteId,
            nationId: nationId,
            voteChoice: voteChoice
        });

        return true;
    }

    /**
     * Resolve an active vote. Returns the result.
     */
    resolveVote(voteId) {
        let targetAllianceId = null;
        let vote = null;

        // Find the vote across all alliances
        this.alliances.forEach((alliance, aid) => {
            if (alliance.activeVotes && alliance.activeVotes.has(voteId)) {
                targetAllianceId = aid;
                vote = alliance.activeVotes.get(voteId);
            }
        });

        if (!vote) {
            throw new Error('Vote not found');
        }

        if (vote.status !== 'active') {
            return { status: vote.status, result: vote.result };
        }

        const alliance = this.alliances.get(targetAllianceId);
        const totalMembers = this._membersSize(alliance);
        const votes = Array.from(vote.votes.values());

        const yesCount = votes.filter(v => v === 'yes').length;
        const noCount = votes.filter(v => v === 'no').length;
        const abstainCount = votes.filter(v => v === 'abstain').length;
        const totalVotes = yesCount + noCount + abstainCount;

        // Check quorum
        const quorumMet = totalVotes >= vote.requiredQuorum;
        // Check majority (yes votes > requiredMajority of total votes cast)
        const majorityMet = totalVotes > 0 && (yesCount / totalVotes) >= vote.requiredMajority;

        let result = 'rejected';
        if (quorumMet && majorityMet) {
            result = 'approved';
        }

        vote.status = 'resolved';
        vote.result = result;
        vote.yesCount = yesCount;
        vote.noCount = noCount;
        vote.abstainCount = abstainCount;
        vote.resolvedAt = Date.now();

        // Execute vote result
        if (result === 'approved' && vote.voteType === 'elect' && vote.targetNationId) {
            // Elect target to an appropriate open leadership role
            const targetMember = this._membersGet(alliance, vote.targetNationId);
            if (targetMember) {
                // Find first available unique leadership role
                for (const roleId of this._rolesKeys(alliance)) {
                    const rData = this._rolesGet(alliance, roleId);
                    if (rData.unique && rData.members.length === 0) {
                        alliance.assignRole(vote.targetNationId, roleId);
                        break;
                    }
                }
            }
        }

        EventBus.emit('alliance_vote_resolved', {
            allianceId: targetAllianceId,
            voteId: voteId,
            result: result,
            yesCount: yesCount,
            noCount: noCount,
            abstainCount: abstainCount,
            totalVotes: totalVotes,
            quorumMet: quorumMet,
            majorityMet: majorityMet
        });

        return { voteId, result, yesCount, noCount, abstainCount, totalVotes, quorumMet, majorityMet };
    }

    /**
     * Check if a member's role has a specific permission
     */
    hasRolePermission(alliance, nationId, permission) {
        const member = this._membersGet(alliance, nationId);
        if (!member) return false;
        return member.permissions.includes('all') || member.permissions.includes(permission);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // COUP MECHANICS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Attempt a coup to seize control of the alliance.
     * Success depends on supporting members' strength, loyalty, and government type.
     */
    attemptCoup(allianceId, coupLeaderNationId, supportingNationIds) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        // Coups are not available in Republic, Hive Mind, Theocracy, or Honor Tribe
        // (Honor Tribe uses 1v1 challenge wars for leadership instead)
        if (alliance.governmentType === 'republic' || alliance.governmentType === 'hiveMind' || alliance.governmentType === 'theocracy' || alliance.governmentType === 'honorTribe') {
            throw new Error('Coups are not available in this government type');
        }

        const leader = this._membersGet(alliance, coupLeaderNationId);
        if (!leader) {
            throw new Error('Coup leader is not a member');
        }

        // Leader must have some standing (not a brand new member)
        const daysSinceJoin = (Date.now() - leader.joinDate) / (1000 * 60 * 60 * 24);
        if (daysSinceJoin < 7) {
            throw new Error('Coup leader must have been in alliance for at least 7 days');
        }

        // Validate supporters
        const supporters = [];
        for (const supporterId of supportingNationIds) {
            const supporter = this._membersGet(alliance, supporterId);
            if (!supporter) continue;
            if (supporterId === coupLeaderNationId) continue;
            supporters.push(supporterId);
        }

        if (supporters.length < 2) {
            throw new Error('Coup requires at least 2 supporters besides the leader');
        }

        // Calculate coup success chance
        const coupChance = this.calculateCoupChance(alliance, coupLeaderNationId, supporters);
        const roll = Math.random() * 100;
        const success = roll < coupChance;

        const coupData = {
            allianceId: allianceId,
            coupLeader: coupLeaderNationId,
            supporters: supporters,
            success: success,
            roll: roll,
            chance: coupChance,
            timestamp: Date.now()
        };

        if (success) {
            this.executeCoupSuccess(alliance, coupLeaderNationId, supporters);
        } else {
            this.executeCoupFailure(alliance, coupLeaderNationId, supporters);
        }

        EventBus.emit('alliance_coup_attempted', coupData);

        return coupData;
    }

    /**
     * Calculate coup success percentage
     */
    calculateCoupChance(alliance, coupLeaderId, supporterIds) {
        let baseChance = 25; // Base 25% chance

        // Government type modifiers
        if (alliance.governmentType === 'autocratic') {
            baseChance += 10; // Easier to overthrow autocratic leader
        } else if (alliance.governmentType === 'democratic') {
            baseChance -= 15; // Harder to overthrow elected leader
        } else if (alliance.governmentType === 'fellowship') {
            baseChance -= 25; // Very hard to overthrow fellowship
        }

        // Leader strength factor
        const leader = this._membersGet(alliance, coupLeaderId);
        const leaderRolePower = leader.permissions.includes('all') ? 15 : 5;
        baseChance += leaderRolePower;

        // Supporter strength factor
        let supporterPower = 0;
        for (const supporterId of supporterIds) {
            const supporter = this._membersGet(alliance, supporterId);
            if (supporter.permissions.includes('all')) {
                supporterPower += 10;
            } else if (supporter.permissions.includes('moderate')) {
                supporterPower += 5;
            }
        }
        baseChance += Math.min(supporterPower, 30);

        // Loyalty/stability factor (unity skill makes coup harder)
        const unitySkill = alliance.skills.unity;
        if (unitySkill && unitySkill.level > 0) {
            baseChance -= unitySkill.level * 2;
        }

        // Member count factor (larger alliances harder to coup)
        const memberFactor = Math.min(this._membersSize(alliance) * 2, 20);
        baseChance -= memberFactor;

        return Math.max(5, Math.min(95, baseChance));
    }

    /**
     * Execute successful coup - leader gains control
     */
    executeCoupSuccess(alliance, coupLeaderId, supporterIds) {
        const oldLeaderRole = this.findTopLeaderRole(alliance);

        // Remove current top leader(s) from their roles
        this._rolesForEach(alliance, (roleData, roleId) => {
            if (roleData.unique || roleData.permissions.includes('all')) {
                roleData.members.forEach(memberId => {
                    if (memberId !== coupLeaderId) {
                        alliance.assignRole(memberId, 'member');
                    }
                });
            }
        });

        // Coup leader takes the top role
        let topRole = oldLeaderRole || this.findTopLeaderRole(alliance);
        if (!topRole) {
            // Fall back to the first defined role in this government
            const firstRole = this._rolesKeys(alliance)[0];
            topRole = firstRole || 'member';
        }
        alliance.assignRole(coupLeaderId, topRole);

        // Supporters get elevated roles
        for (const supporterId of supporterIds) {
            const supporter = this._membersGet(alliance, supporterId);
            if (supporter.role === 'member') {
                // Give supporters a moderate role if available
                for (const roleId of this._rolesKeys(alliance)) {
                    const rData = this._rolesGet(alliance, roleId);
                    if (!rData.unique && rData.permissions.includes('moderate') && rData.members.length < rData.maxCount) {
                        alliance.assignRole(supporterId, roleId);
                        break;
                    }
                }
            }
        }

        // Record in history
        alliance.memberHistory.push({
            action: 'coup_success',
            nationId: coupLeaderId,
            supporters: supporterIds,
            newRole: topRole,
            date: Date.now()
        });

        EventBus.emit('alliance_coup_successful', {
            allianceId: alliance.id,
            newLeader: coupLeaderId,
            supporters: supporterIds,
            previousLeaderRole: oldLeaderRole
        });
    }

    /**
     * Execute failed coup - conspirators penalized
     */
    executeCoupFailure(alliance, coupLeaderId, supporterIds) {
        // Penalize coup leader and supporters
        const conspirators = [coupLeaderId, ...supporterIds];
        for (const nationId of conspirators) {
            const member = this._membersGet(alliance, nationId);
            if (member) {
                // Reduce their contributions as penalty
                member.contributions.xp = Math.floor(member.contributions.xp * 0.5);
                
                // If they held a leadership role, demote them
                if (member.role !== 'member' && member.role !== 'foundingFellow') {
                    alliance.assignRole(nationId, 'member');
                }
            }
        }

        // Record in history
        alliance.memberHistory.push({
            action: 'coup_failed',
            nationId: coupLeaderId,
            supporters: supporterIds,
            date: Date.now()
        });

        EventBus.emit('alliance_coup_failed', {
            allianceId: alliance.id,
            coupLeader: coupLeaderId,
            supporters: supporterIds
        });
    }

    /**
     * Find the top leadership role in an alliance
     */
    findTopLeaderRole(alliance) {
        for (const roleId of this._rolesKeys(alliance)) {
            const roleData = this._rolesGet(alliance, roleId);
            if (roleData.permissions.includes('all') && roleData.unique) {
                return roleId;
            }
        }
        return null;
    }

    /**
     * Mark a nation as an easter egg founder (for Founding Fellow restrictions)
     */
    markEasterEggFounder(nationId) {
        const nation = this.getNation(nationId);
        if (nation) {
            nation._isEasterEggFounder = true;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // HONOR TRIBE - 1V1 CHALLENGE LEADERSHIP SYSTEM
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Challenge the Grand Chief of an Honor Tribe to a 1v1 solo nation war.
     * Only available in Honor Tribe alliances. The winner takes leadership;
     * the loser is exiled from the alliance.
     */
    challengeLeadership(challengerId) {
        const alliance = this.getAllianceByNation(challengerId);
        if (!alliance) {
            throw new Error('Challenger is not in an alliance');
        }

        if (alliance.governmentType !== 'honorTribe') {
            throw new Error('Leadership challenges are only available in Honor Tribe alliances');
        }

        const challenger = this._membersGet(alliance, challengerId);
        if (!challenger) {
            throw new Error('Challenger is not a member');
        }

        if (challenger.role === 'grandChief') {
            throw new Error('The Grand Chief cannot challenge themselves');
        }

        // Find the current Grand Chief
        let grandChiefId = null;
        for (const roleId of this._rolesKeys(alliance)) {
            const roleData = this._rolesGet(alliance, roleId);
            if (roleData.id === 'grandChief' && roleData.members && roleData.members.length > 0) {
                grandChiefId = roleData.members[0];
                break;
            }
        }

        if (!grandChiefId) {
            throw new Error('No Grand Chief found to challenge');
        }

        if (grandChiefId === challengerId) {
            throw new Error('You are already the Grand Chief');
        }

        // Check cooldown - challenger must wait 7 days since joining or last challenge
        const daysSinceJoin = (Date.now() - challenger.joinDate) / (1000 * 60 * 60 * 24);
        if (daysSinceJoin < 7) {
            throw new Error('You must be in the tribe for at least 7 days before challenging');
        }

        // Check if there's already a pending honor challenge war
        const pendingChallenge = this._pendingHonorChallenges.get(alliance.id);
        if (pendingChallenge && Date.now() < pendingChallenge.expiresAt) {
            throw new Error('An honor challenge is already pending for this tribe');
        }

        // Set up the pending challenge (expires in 24 hours)
        this._pendingHonorChallenges.set(alliance.id, {
            challengerId: challengerId,
            chiefId: grandChiefId,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            createdAt: Date.now()
        });

        // Declare the 1v1 honor challenge war (no outside interference)
        this._declareHonorChallengeWar(alliance, challengerId, grandChiefId);

        EventBus.emit('alliance_honor_challenge_issued', {
            allianceId: alliance.id,
            challengerId: challengerId,
            chiefId: grandChiefId
        });

        return { success: true, challengerId, chiefId, expiresAt: Date.now() + (24 * 60 * 60 * 1000) };
    }

    /**
     * Declare a 1v1 honor challenge war between challenger and chief.
     * Uses warType 'honorChallenge' to prevent outside interference.
     */
    _declareHonorChallengeWar(alliance, challengerId, chiefId) {
        if (window.WarSystem) {
            WarSystem.declareWar({
                attackerNationId: challengerId,
                defenderNationId: chiefId,
                warType: 'honorChallenge',
                casusBelliId: 'honor_challenge',
                reason: `Honor Tribe leadership challenge: ${challengerId} challenges ${chiefId} for Grand Chief`,
                allianceId: alliance.id,
                honorChallenge: true
            });
        } else {
            // Fallback: if WarSystem not available, resolve immediately as a simulated war
            this._resolveHonorChallengeFallback(alliance, challengerId, chiefId);
        }
    }

    /**
     * Fallback resolution when WarSystem is not available.
     * Resolves based on military strength.
     */
    _resolveHonorChallengeFallback(alliance, challengerId, chiefId) {
        const challenger = this.getNation(challengerId);
        const chief = this.getNation(chiefId);

        const challengerStrength = challenger ? challenger.militaryStrength || 0 : 0;
        const chiefStrength = chief ? chief.militaryStrength || 0 : 0;

        // Add some randomness (±15%)
        const challengerRoll = challengerStrength * (0.85 + Math.random() * 0.30);
        const chiefRoll = chiefStrength * (0.85 + Math.random() * 0.30);

        const challengerWins = challengerRoll > chiefRoll;

        setTimeout(() => {
            this._resolveHonorChallenge(alliance.id, challengerId, chiefId, challengerWins);
        }, 1000);
    }

    /**
     * Resolve an honor challenge war result.
     * Winner becomes Grand Chief; loser is exiled from the alliance.
     */
    _resolveHonorChallenge(allianceId, challengerId, chiefId, challengerWins) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return;

        // Clear the pending challenge
        this._pendingHonorChallenges.delete(allianceId);

        const winner = challengerWins ? challengerId : chiefId;
        const loser = challengerWins ? chiefId : challengerId;

        const winnerNation = this.getNation(winner);
        const loserNation = this.getNation(loser);

        if (challengerWins) {
            // Challenger becomes the new Grand Chief
            alliance.assignRole(winner, 'grandChief');
            // Exile the former Grand Chief
            alliance.assignRole(loser, 'member');
            this._exileMember(alliance, loser);

            alliance.memberHistory.push({
                action: 'honor_challenge_won',
                nationId: winner,
                defeated: loser,
                date: Date.now()
            });

            EventBus.emit('alliance_honor_challenge_won', {
                allianceId: alliance.id,
                newGrandChief: winner,
                exiled: loser
            });
        } else {
            // Chief retains leadership; challenger is exiled
            alliance.assignRole(loser, 'member');
            this._exileMember(alliance, loser);

            alliance.memberHistory.push({
                action: 'honor_challenge_lost',
                nationId: winner,
                defeated: loser,
                date: Date.now()
            });

            EventBus.emit('alliance_honor_challenge_lost', {
                allianceId: alliance.id,
                grandChief: winner,
                exiled: loser
            });
        }
    }

    /**
     * Exile a member from the alliance (remove membership and allianceId).
     */
    _exileMember(alliance, nationId) {
        const nation = this.getNation(nationId);
        if (nation) {
            nation.allianceId = null;
        }
        this._membersDelete(alliance, nationId);

        alliance.memberHistory.push({
            action: 'exiled',
            nationId: nationId,
            date: Date.now()
        });

        EventBus.emit('alliance_member_exiled', {
            allianceId: alliance.id,
            nationId: nationId
        });
    }

    /**
     * Handle honor challenge war results in handleWarEnded.
     * Override the normal war XP logic for honor challenges.
     */
    _handleHonorChallengeWarEnded(war) {
        if (!war.honorChallenge || !war.allianceId) return;

        const alliance = this.alliances.get(war.allianceId);
        if (!alliance) return;

        const challengerId = war.originalAttacker;
        const chiefId = war.originalDefender;

        // Determine winner
        let challengerWins = false;
        if (war.winner) {
            if (war.winner === 'attacker' || war.winner === challengerId) {
                challengerWins = true;
            } else if (war.winner === 'defender' || war.winner === chiefId) {
                challengerWins = false;
            }
        }

        this._resolveHonorChallenge(alliance.id, challengerId, chiefId, challengerWins);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CUSTOM ALLIANCE - FULLY CUSTOMIZABLE GOVERNMENT
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Update a custom alliance's government structure.
     * Allows users to customize role names, permissions, council size, rotation stat, etc.
     */
    updateCustomGovernment(allianceId, updates) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        if (alliance.governmentType !== 'custom') {
            throw new Error('Only custom alliances can have their government structure updated');
        }

        const roles = alliance.government.roles;

        // Update role names and permissions
        if (updates.roles) {
            for (const roleUpdate of updates.roles) {
                const roleData = this._rolesGet(alliance, roleUpdate.id);
                if (!roleData) continue;

                if (roleUpdate.name) roleData.name = roleUpdate.name;
                if (roleUpdate.permissions) roleData.permissions = roleUpdate.permissions;
                if (roleUpdate.unique !== undefined) roleData.unique = roleUpdate.unique;
                if (roleUpdate.maxCount !== undefined) roleData.maxCount = roleUpdate.maxCount;
            }
        }

        // Update council rotation settings
        if (updates.councilSettings) {
            alliance.government.structure = alliance.government.structure || {};
            if (updates.councilSettings.councilSize !== undefined) {
                alliance.government.structure.councilSize = updates.councilSettings.councilSize;
            }
            if (updates.councilSettings.rotationDays !== undefined) {
                alliance.government.structure.councilRotationDays = updates.councilSettings.rotationDays;
            }
            if (updates.councilSettings.rotationStat !== undefined) {
                alliance.government.structure.rotationStat = updates.councilSettings.rotationStat; // 'money', 'militaryStrength', 'taxRevenue', 'netRevenue', etc.
            }
            if (updates.councilSettings.councilRoleId !== undefined) {
                alliance.government.structure.councilRoleId = updates.councilSettings.councilRoleId;
            }
            if (updates.councilSettings.councilRoleName !== undefined) {
                alliance.government.structure.councilRoleName = updates.councilSettings.councilRoleName;
            }
        }

        // Update leadership change method
        if (updates.leadershipChangeMethod) {
            alliance.government.structure = alliance.government.structure || {};
            alliance.government.structure.leadershipChangeMethod = updates.leadershipChangeMethod;
            // 'vote', 'challenge', 'rotation', 'succession'
        }

        alliance.memberHistory.push({
            action: 'custom_government_updated',
            updates: updates,
            date: Date.now()
        });

        EventBus.emit('alliance_custom_government_updated', {
            allianceId: alliance.id,
            updates: updates
        });

        return { success: true };
    }

    /**
     * Add a new role to a custom alliance.
     */
    addCustomRole(allianceId, roleData) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        if (alliance.governmentType !== 'custom') {
            throw new Error('Only custom alliances can add custom roles');
        }

        const roles = alliance.government.roles;
        const existingRole = this._rolesGet(alliance, roleData.id);
        if (existingRole) {
            throw new Error('Role with this ID already exists');
        }

        this._rolesSet(alliance, roleData.id, {
            id: roleData.id,
            name: roleData.name || roleData.id,
            permissions: roleData.permissions || ['basic'],
            unique: roleData.unique || false,
            maxCount: roleData.maxCount || null,
            members: roleData.members || []
        });

        alliance.memberHistory.push({
            action: 'custom_role_added',
            roleId: roleData.id,
            date: Date.now()
        });

        return { success: true, roleId: roleData.id };
    }

    /**
     * Remove a role from a custom alliance.
     */
    removeCustomRole(allianceId, roleId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        if (alliance.governmentType !== 'custom') {
            throw new Error('Only custom alliances can remove custom roles');
        }

        const roleData = this._rolesGet(alliance, roleId);
        if (!roleData) {
            throw new Error('Role not found');
        }

        if (roleData.unique && roleData.members.length > 0) {
            throw new Error('Cannot remove a role that has members assigned');
        }

        this._rolesDelete(alliance, roleId);

        alliance.memberHistory.push({
            action: 'custom_role_removed',
            roleId: roleId,
            date: Date.now()
        });

        return { success: true };
    }

    /**
     * Get the rotation stat for a custom alliance's council.
     */
    getCustomRotationStat(allianceId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return null;
        const structure = alliance.government.structure || {};
        return structure.rotationStat || 'money';
    }

    // Initialize pending honor challenges map
    _initPendingHonorChallenges() {
        this._pendingHonorChallenges = new Map(); // allianceId -> { challengerId, chiefId, expiresAt, createdAt }
    }

    /**
     * Destroy the alliance system - clean up event listeners
     */
    destroy() {
        if (typeof EventBus !== 'undefined') {
            EventBus.off(GameEvents.DAY_PASSED, this.processDailyAlliances);
            EventBus.off('war_declared', this.handleWarDeclared);
            EventBus.off('war_ended', this.handleWarEnded);
            EventBus.off('treaty_signed', this.handleTreatySigned);
            EventBus.off('alliance_easter_egg_available', this.handleEasterEggAvailable);
            EventBus.off('wonder_built', this.handleWonderBuilt);
            EventBus.off('alliance_member_removed', this._onAllianceMemberRemoved);
        }
        this.alliances.clear();
        this.allianceInvitations.clear();
        this.allianceDiplomacy.clear();
        this.isInitialized = false;
    }

    /**
     * Disband an alliance completely. Removes all members, cleans up AI state,
     * and removes from registry. Hive Mind alliances cannot be disbanded this way
     * while they still have an AI running them.
     */
    disbandAlliance(allianceId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        // Hive Mind alliances cannot be disbanded by member departure - AI runs them
        if (alliance.governmentType === 'hiveMind') {
            throw new Error('Cannot disband Hive Mind alliance via member departure');
        }

        // Remove all members
        const memberIds = this._membersKeys(alliance);
        for (const nationId of memberIds) {
            const nation = this.getNation(nationId);
            if (nation) nation.allianceId = null;
        }

        // Clear AI state if Hive Mind (shouldn't happen due to check above, but safety)
        this.hiveMinds.delete(allianceId);

        // Remove from registry
        this.alliances.delete(allianceId);

        EventBus.emit('alliance_disbanded', {
            allianceId: allianceId,
            name: alliance.name
        });

        return { success: true, allianceId };
    }

    /**
     * Auto-disband check: if an alliance has no members left (and is not Hive Mind),
     * disband it automatically.
     */
    _autoDisbandEmptyAlliance(allianceId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) return;

        if (alliance.governmentType === 'hiveMind') return; // AI runs it, keep it alive

        if (this._membersSize(alliance) === 0) {
            this.disbandAlliance(allianceId);
        }
    }
}

// Initialize the global alliance system
window.AllianceSystem = new AllianceSystem();