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
        
        // Alliance skill definitions
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
            warEfficiency: {
                name: 'War Coordination',
                description: 'Increases damage when fighting together',
                baseCost: 1200,
                costMultiplier: 1.4,
                maxLevel: 10,
                effects: (level) => ({ 
                    warDamageBonus: 0.02 * level,
                    coordinationBonus: 0.01 * level
                })
            },
            
            // Continue alliance skills
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
            economy: {
                name: 'Economic Cooperation',
                description: 'Enables resource sharing and trade bonuses',
                baseCost: 900,
                costMultiplier: 1.4,
                maxLevel: 10,
                effects: (level) => ({
                    resourceShareLimit: level * 10000,
                    tradeBonus: 0.03 * level
                })
            },
            intelligence: {
                name: 'Intelligence Network',
                description: 'Shared spy operations and info gathering',
                baseCost: 1100,
                costMultiplier: 1.45,
                maxLevel: 10,
                effects: (level) => ({
                    spyEfficiencyBonus: 0.04 * level,
                    intelSharingRange: level * 2
                })
            },
            defense: {
                name: 'Collective Defense',
                description: 'Defensive bonuses when protecting allies',
                baseCost: 1300,
                costMultiplier: 1.4,
                maxLevel: 10,
                effects: (level) => ({
                    defenseBonus: 0.03 * level,
                    counterAttackBonus: 0.02 * level
                })
            },
            research: {
                name: 'Research Collaboration',
                description: 'Shared research projects and tech bonuses',
                baseCost: 1500,
                costMultiplier: 1.5,
                maxLevel: 10,
                effects: (level) => ({
                    researchSpeedBonus: 0.05 * level,
                    techShareEfficiency: 0.1 * level
                })
            },
            
            logistics: {
                name: 'Military Logistics',
                description: 'Improves military supply and coordination',
                baseCost: 1200,
                costMultiplier: 1.4,
                maxLevel: 10,
                effects: (level) => ({
                    supplyEfficiency: 0.04 * level,
                    deploymentSpeed: 0.03 * level
                })
            },
            expansion: {
                name: 'Territorial Expansion',
                description: 'Bonuses for claiming and holding territory',
                baseCost: 1400,
                costMultiplier: 1.6,
                maxLevel: 10,
                effects: (level) => ({
                    expansionCostReduction: 0.05 * level,
                    territoryHoldBonus: 0.02 * level
                })
            },
            unity: {
                name: 'Alliance Unity',
                description: 'Overall alliance bonuses and stability',
                baseCost: 2000,
                costMultiplier: 1.8,
                maxLevel: 10,
                effects: (level) => ({
                    stabilityBonus: 0.02 * level,
                    loyaltyBonus: 0.05 * level,
                    overallEfficiency: 0.01 * level
                })
            },
            infrastructure: {
                name: 'Infrastructure Coordination',
                description: 'Shared infrastructure bonuses and construction speed',
                baseCost: 1100,
                costMultiplier: 1.45,
                maxLevel: 10,
                effects: (level) => ({
                    constructionSpeedBonus: 0.03 * level,
                    infraEfficiencyBonus: 0.02 * level,
                    sharedInfrastructure: level * 5
                })
            },
            technology: {
                name: 'Technology Sharing',
                description: 'Advanced tech sharing and research coordination',
                baseCost: 1600,
                costMultiplier: 1.7,
                maxLevel: 10,
                effects: (level) => ({
                    techShareBonus: 0.1 * level,
                    researchCoordination: 0.05 * level,
                    advancedTechAccess: level >= 5
                })
            }
        };
        
        // Government structure templates
        this.governmentTemplates = {
            democratic: {
                name: 'Democratic Alliance',
                description: 'Elected leadership with specialized departments',
                roles: [
                    { id: 'president', name: 'President', permissions: ['all'], unique: true },
                    { id: 'vicePresident', name: 'Vice President', permissions: ['moderate'], unique: true },
                    { id: 'secDefense', name: 'Secretary of Defense', permissions: ['military', 'war'], unique: true },
                    { id: 'secForeign', name: 'Secretary of Foreign Affairs', permissions: ['diplomacy', 'treaties'], unique: true },
                    { id: 'secInternal', name: 'Secretary of Internal Affairs', permissions: ['members', 'domestic'], unique: true },
                    { id: 'secEconomy', name: 'Secretary of Economy', permissions: ['resources', 'trade'], unique: true },
                    { id: 'secJustice', name: 'Secretary of Justice', permissions: ['disputes', 'rules'], unique: true },
                    { id: 'secTechnology', name: 'Secretary of Technology', permissions: ['research', 'intelligence'], unique: true },
                    { id: 'member', name: 'Member', permissions: ['basic'], unique: false }
                ]
            },
            
            trio: {
                name: 'Triumvirate',
                description: 'Three equal leaders sharing power',
                roles: [
                    { id: 'triumvir1', name: 'First Triumvir', permissions: ['all'], unique: true },
                    { id: 'triumvir2', name: 'Second Triumvir', permissions: ['all'], unique: true },
                    { id: 'triumvir3', name: 'Third Triumvir', permissions: ['all'], unique: true },
                    { id: 'lieutenant', name: 'Lieutenant', permissions: ['moderate'], unique: false, maxCount: 3 },
                    { id: 'member', name: 'Member', permissions: ['basic'], unique: false }
                ]
            },
            autocratic: {
                name: 'Autocratic Alliance',
                description: 'Single supreme leader with appointed ministers',
                roles: [
                    { id: 'supremeLeader', name: 'Supreme Leader', permissions: ['all'], unique: true },
                    { id: 'warMinister', name: 'War Minister', permissions: ['military', 'war'], unique: true },
                    { id: 'diplomaticMinister', name: 'Diplomatic Minister', permissions: ['diplomacy', 'treaties'], unique: true },
                    { id: 'economicMinister', name: 'Economic Minister', permissions: ['resources', 'trade'], unique: true },
                    { id: 'internalMinister', name: 'Internal Minister', permissions: ['members', 'domestic'], unique: true },
                    { id: 'officer', name: 'Officer', permissions: ['moderate'], unique: false, maxCount: 5 },
                    { id: 'subject', name: 'Subject', permissions: ['basic'], unique: false }
                ]
            },
            custom: {
                name: 'Custom Structure',
                description: 'Fully customizable government structure',
                roles: [] // Built by user
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
            resourceSharing: { base: 100, description: 'Active resource cooperation' },
            allianceProjects: { base: 800, description: 'Completing alliance-wide projects' }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Alliance System...');
        this.bindEvents();
        this.isInitialized = true;
        console.log('Alliance System ready');
    }
    
    bindEvents() {
        EventBus.on(GameEvents.DAY_PASSED, this.processDailyAlliances.bind(this));
        EventBus.on('war_declared', this.handleWarDeclared.bind(this));
        EventBus.on('war_ended', this.handleWarEnded.bind(this));
        EventBus.on('treaty_signed', this.handleTreatySigned.bind(this));
        EventBus.on('alliance_easter_egg_available', this.handleEasterEggAvailable.bind(this));
        EventBus.on('wonder_built', this.handleWonderBuilt.bind(this));
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
    async createAlliance(founderNationId, allianceData) {
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
        
        const diplomacy = DiplomacySystem.nationDiplomacy.get(nationId);
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
     */
    addEasterEggMembers(alliance, founderNationId) {
        if (!window.DiplomacySystem) return;
        
        const diplomacy = DiplomacySystem.nationDiplomacy.get(founderNationId);
        if (!diplomacy) return;
        
        // Add best friend as co-founder
        if (diplomacy.relationships.bestFriend) {
            alliance.addMember(diplomacy.relationships.bestFriend, 'coFounder');
            const bestFriendNation = this.getNation(diplomacy.relationships.bestFriend);
            if (bestFriendNation) bestFriendNation.allianceId = alliance.id;
        }
        
        // Add all mutual pact friends as founding members
        diplomacy.relationships.friends.forEach(friendId => {
            if (this.hasMutualPact(founderNationId, friendId)) {
                alliance.addMember(friendId, 'foundingMember');
                const friendNation = this.getNation(friendId);
                if (friendNation) friendNation.allianceId = alliance.id;
            }
        });
    }
    
    /**
     * Check if two nations have a mutual pact
     */
    hasMutualPact(nationId1, nationId2) {
        if (!window.DiplomacySystem) return false;
        
        const diplomacy1 = DiplomacySystem.nationDiplomacy.get(nationId1);
        if (!diplomacy1) return false;
        
        // Check for mutual defense or mutual aggression treaties
        return diplomacy1.treaties.has(nationId2) && 
               ['mutualDefense', 'mutualAggression'].includes(
                   diplomacy1.treaties.get(nationId2)?.type
               );
    }
    
    /**
     * Check if one nation has a protectorate with another
     */
    hasProtectorate(nationId1, nationId2) {
        if (!window.DiplomacySystem) return false;
        
        const diplomacy1 = DiplomacySystem.nationDiplomacy.get(nationId1);
        if (!diplomacy1) return false;
        
        return diplomacy1.treaties.has(nationId2) && 
               diplomacy1.treaties.get(nationId2)?.type === 'protectorate';
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
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WAR INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle war participation for XP
     */
    handleWarDeclared(data) {
        const { war, attackerNationId, defenderNationId } = data;
        
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
        
        const totalMembers = alliance.members.size;
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
        alliance.members.forEach((memberData, nationId) => {
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
        const { war, winner } = data;
        
        // Award victory bonuses
        if (winner && winner.type === 'alliance') {
            const alliance = this.alliances.get(winner.id);
            if (alliance) {
                this.awardAllianceXP(winner.id, 'sharedVictory', null, {
                    warId: war.id,
                    defeated: war.sides.defender.nations
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
        if (window.DataManager && window.DataManager.currentPlayer) {
            return window.DataManager.currentPlayer.nations.find(n => n.id === nationId);
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
        
        // War efficiency skill bonus
        const warSkill = alliance.skills.warEfficiency;
        if (warSkill && warSkill.level > 0) {
            bonus += warSkill.effects.warDamageBonus || 0;
        }
        
        // Defense skill bonus when defending
        const defenseSkill = alliance.skills.defense;
        if (defenseSkill && defenseSkill.level > 0) {
            // This would be applied specifically during defensive wars
            bonus += defenseSkill.effects.defenseBonus || 0;
        }
        
        // Unity skill overall efficiency
        const unitySkill = alliance.skills.unity;
        if (unitySkill && unitySkill.level > 0) {
            bonus += unitySkill.effects.overallEfficiency || 0;
        }
        
        return Math.min(bonus, 2.0); // Cap at 100% bonus
    }
    
    /**
     * Serialize all alliance data for saving
     */
    serialize() {
        return {
            alliances: Array.from(this.alliances.entries()).map(([id, alliance]) => [id, alliance.serialize()]),
            allianceInvitations: Array.from(this.allianceInvitations.entries()),
            allianceDiplomacy: Array.from(this.allianceDiplomacy.entries())
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
    }
    
    /**
     * Integration with existing war system
     */
    integrateWithWarSystem() {
        if (window.WarSystem) {
            // Override war damage calculation to include alliance bonuses
            const originalCalculateDamage = WarSystem.calculateWarDamage;
            WarSystem.calculateWarDamage = (attackerNation, defenderNation, warData) => {
                let damage = originalCalculateDamage.call(WarSystem, attackerNation, defenderNation, warData);
                
                // Apply alliance bonuses
                if (attackerNation.allianceId) {
                    const warBonus = this.getAllianceWarBonus(attackerNation.allianceId);
                    damage = Math.floor(damage * warBonus);
                }
                
                return damage;
            };
        }
    }
    
    /**
     * Integration with existing diplomacy system  
     */
    integrateWithDiplomacySystem() {
        if (window.DiplomacySystem) {
            // Add alliance-aware treaty validation
            const originalValidate = DiplomacySystem.validateTreatyProposal;
            DiplomacySystem.validateTreatyProposal = (data) => {
                const result = originalValidate.call(DiplomacySystem, data);
                
                // Add alliance-specific validations
                const proposerNation = this.getNation(data.proposerId);
                const targetNation = this.getNation(data.targetId);
                
                if (proposerNation && targetNation) {
                    // Check if nations are in same alliance (some treaties may not be allowed)
                    if (this.areAllied(data.proposerId, data.targetId)) {
                        // Allies don't need certain treaties
                        if (['mutualDefense', 'mutualAggression'].includes(data.treatyType)) {
                            return { valid: false, reason: 'Alliance members already have mutual obligations' };
                        }
                    }
                }
                
                return result;
            };
        }
    }
}

// Initialize the global alliance system
window.AllianceSystem = new AllianceSystem();