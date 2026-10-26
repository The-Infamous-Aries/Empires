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
            },
            
            fellowship: {
                name: 'Fellowship',
                description: 'Easter-egg alliance where all founding members share equal control as Founding Fellows',
                roles: [
                    { id: 'foundingFellow', name: 'Founding Fellow', permissions: ['all'], unique: false, maxCount: 6 },
                    { id: 'fellow', name: 'Fellow', permissions: ['moderate', 'military', 'diplomacy'], unique: false }
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
            alliance.members.forEach((memberData, nationId) => {
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
     * Creates a Fellowship government where all 6 members are Founding Fellows
     */
    addEasterEggMembers(alliance, founderNationId) {
        if (!window.DiplomacySystem) return;
        
        const diplomacy = DiplomacySystem.nationDiplomacy.get(founderNationId);
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
        
        // Also add founder as Founding Fellow
        alliance.addMember(founderNationId, 'foundingFellow');
    }
    
    /**
     * Check if two nations have a mutual pact
     */
    hasMutualPact(nationId1, nationId2) {
        if (!window.DiplomacySystem) return false;

        const diplomacy1 = DiplomacySystem.nationDiplomacy.get(nationId1);
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

        const diplomacy1 = DiplomacySystem.nationDiplomacy.get(nationId1);
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
        });
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
        if (!data || !data.war) return;

        const war = data.war;
        const winner = data.winner;

        // Award victory bonuses
        if (winner && winner.type === 'alliance') {
            const alliance = this.alliances.get(winner.id);
            if (alliance) {
                this.awardAllianceXP(winner.id, 'sharedVictory', null, {
                    warId: war.id,
                    defeated: war.sides.defender.nations
                });
            }
        } else if (winner === 'attacker' || winner === 'defender') {
            // Single-nation war winner - award to their alliance
            const winnerNationId = winner === 'attacker' ? war.originalAttacker : war.originalDefender;
            const winnerNation = this.getNation(winnerNationId);
            if (winnerNation && winnerNation.allianceId) {
                this.awardAllianceXP(winnerNation.allianceId, 'sharedVictory', null, {
                    warId: war.id,
                    defeated: war.sides[winner === 'attacker' ? 'defender' : 'attacker'].nations
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
     * Get the alliance a nation belongs to (alias for getAllianceByNation)
     */
    getAllianceForNation(nationId) {
        return this.getAllianceByNation(nationId);
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
            const originalValidate = DiplomacySystem.validateTreatyProposal;
            
            // Only wrap once
            if (originalValidate._allianceWrapped) return;
            
            DiplomacySystem.validateTreatyProposal = (data) => {
                const result = originalValidate.call(DiplomacySystem, data);
                
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
            DiplomacySystem.validateTreatyProposal._allianceWrapped = true;
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

        const member = alliance.members.get(nationId);
        if (!member) {
            throw new Error('Nation is not a member of this alliance');
        }

        const currentRole = member.role;
        const roleData = alliance.government.roles.get(currentRole);

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
            const fellowRole = alliance.government.roles.get('fellow');
            if (fellowRole) {
                fallbackRole = 'fellow';
            }
        } else {
            // Find a non-unique role to fall back to
            for (const [roleId, rData] of alliance.government.roles) {
                if (!rData.unique && rData.id !== currentRole) {
                    fallbackRole = roleId;
                    break;
                }
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

        const fromMember = alliance.members.get(fromNationId);
        const toMember = alliance.members.get(toNationId);
        if (!fromMember || !toMember) {
            throw new Error('One or both nations are not members');
        }

        if (fromMember.role !== roleId) {
            throw new Error('Source nation does not hold this role');
        }

        const roleData = alliance.government.roles.get(roleId);
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
            const fellowRole = alliance.government.roles.get('fellow');
            if (fellowRole) {
                fallbackRole = 'fellow';
            }
        } else {
            for (const [rId, rData] of alliance.government.roles) {
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
    // VOTING MECHANICS
    // ════════════════════════════════════════════════════════════════════════════

    /**
     * Start a vote for an alliance leadership position.
     * Only available for democratic and trio government types.
     */
    startVote(allianceId, voteType, targetNationId, initiatorNationId) {
        const alliance = this.alliances.get(allianceId);
        if (!alliance) {
            throw new Error('Alliance not found');
        }

        // Voting only for democratic and trio governments
        if (!['democratic', 'trio'].includes(alliance.governmentType)) {
            throw new Error('Voting is not available for this government type');
        }

        const initiator = alliance.members.get(initiatorNationId);
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
            requiredQuorum: Math.ceil(alliance.members.size * 0.5), // 50% quorum
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

        const voter = alliance.members.get(nationId);
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
        const totalMembers = alliance.members.size;
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
            const targetMember = alliance.members.get(vote.targetNationId);
            if (targetMember) {
                // Find first available unique leadership role
                for (const [roleId, rData] of alliance.government.roles) {
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
        const member = alliance.members.get(nationId);
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

        const leader = alliance.members.get(coupLeaderNationId);
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
            const supporter = alliance.members.get(supporterId);
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
        const leader = alliance.members.get(coupLeaderId);
        const leaderRolePower = leader.permissions.includes('all') ? 15 : 5;
        baseChance += leaderRolePower;

        // Supporter strength factor
        let supporterPower = 0;
        for (const supporterId of supporterIds) {
            const supporter = alliance.members.get(supporterId);
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
        const memberFactor = Math.min(alliance.members.size * 2, 20);
        baseChance -= memberFactor;

        return Math.max(5, Math.min(95, baseChance));
    }

    /**
     * Execute successful coup - leader gains control
     */
    executeCoupSuccess(alliance, coupLeaderId, supporterIds) {
        const oldLeaderRole = this.findTopLeaderRole(alliance);

        // Remove current top leader(s) from their roles
        alliance.government.roles.forEach((roleData, roleId) => {
            if (roleData.unique || roleData.permissions.includes('all')) {
                roleData.members.forEach(memberId => {
                    if (memberId !== coupLeaderId) {
                        alliance.assignRole(memberId, 'member');
                    }
                });
            }
        });

        // Coup leader takes the top role
        const topRole = oldLeaderRole || 'president';
        alliance.assignRole(coupLeaderId, topRole);

        // Supporters get elevated roles
        for (const supporterId of supporterIds) {
            const supporter = alliance.members.get(supporterId);
            if (supporter.role === 'member') {
                // Give supporters a moderate role if available
                for (const [roleId, rData] of alliance.government.roles) {
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
            const member = alliance.members.get(nationId);
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
        for (const [roleId, roleData] of alliance.government.roles) {
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
        }
        this.alliances.clear();
        this.allianceInvitations.clear();
        this.allianceDiplomacy.clear();
        this.isInitialized = false;
    }
}

// Initialize the global alliance system
window.AllianceSystem = new AllianceSystem();